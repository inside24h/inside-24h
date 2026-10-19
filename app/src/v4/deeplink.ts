// Deep links: every moment can be shared. The hash holds what you ate, how much, the minute of the day, the view
// and the comparison partner, e.g. #q=cola&n=2&t=45m&view=full&vs=glass+of+water. Opening it restores that moment
// (paused, so people see what the sender saw). Old links (#q=banana, #p=cola&t=90, #compare=…) keep working.
// MEALS: #m=hamburger+fries*2+cola (food ids, *servings or *grams g; food/meal.ts). Exact and short; old meal links
// written as text (#q=118 g Banana + 250 g Milk) still open through the text parser.
import { MAX_MIN } from '../time';
import { baseOf, deriveFood, foodKey, isPlain, parseMeal, servingPart, sizesOf, type Choice, type Part } from './food/parse';
import { cleanPace, mealCode, mealFromCode } from './food/meal';

export type View = 'simple' | 'full' | 'detailed';
export const PORTIONS = [0.5, 1, 2, 3] as const;
/** Keys this module owns; any other key in the hash (dose, city, QA keys…) is passed through untouched. */
const OWN = ['q', 'm', 'p', 'n', 't', 'view', 'vs', 'compare', 'v', 's', 'add', 'on', 'over'];
/** Old keys that describe a stale UI state and are dropped as soon as the app writes its own hash. */
const DROP = ['organ', 'panel'];

export interface Link {
  q?: string;      // food as text, parsed with parseMeal
  m?: string;      // a meal of several things: "hamburger fries*2 cola" (wins over q)
  p?: string;      // old: curated product id (espresso, cola, water)
  n: number;       // portion: 0.5 · 1 · 2 · 3
  t: number | null; // minutes after eating; null = not given
  view: View;
  vs?: string;     // comparison partner (old key: compare)
  // 2026-10-18, one food only (with q): which kind and how much (research/audit/VARIANTS-DONE.md)
  v?: string;      // variant: #q=beer&v=radler
  s?: string;      // named size, wins over n: #q=pizza&s=whole
  add?: string;    // add-ins: #q=espresso&add=sugar1 (several: "sugar1 milk1")
  on?: string;     // builder parts: #q=pizza&on=base+ham+mushrooms
  // 2026-10-19 PACING: "Over how long?" in minutes, #q=beer&n=3&over=2h (0 / absent = all at once, as every older link)
  over?: number;
}

/** "3h", "180m", "180" → one of the offered paces (0 · 60 · 120 · 180 · 240 min); anything else = all at once. */
export const parsePace = (s: string | null | undefined): number => cleanPace(parseTime(s));

/** "45m", "2h", "1h30m", "1.5h", or old plain minutes "90" → minutes (clamped to the day); null if unreadable. */
export function parseTime(s: string | null | undefined): number | null {
  if (s == null) return null;
  const t = s.trim().toLowerCase();
  if (!t) return null;
  const m = /^(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m?)?$/.exec(t);
  if (!m || (m[1] === undefined && m[2] === undefined)) return null;
  const min = Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
  return Number.isFinite(min) ? Math.max(0, Math.min(MAX_MIN, min)) : null;
}

/** Minutes → "45m", "2h", "1h30m"; the first 5 minutes keep one decimal (the swallow happens in seconds). */
export function formatTime(min: number): string {
  const v = Math.max(0, Math.min(MAX_MIN, min));
  if (v < 5) return `${Math.round(v * 10) / 10}m`;
  const r = Math.round(v), h = Math.floor(r / 60), mm = r % 60;
  return h ? `${h}h${mm ? `${mm}m` : ''}` : `${mm}m`;
}

export function parsePortion(s: string | null | undefined): number {
  if (!s) return 1;
  const v = s.trim() === '½' ? 0.5 : Number(s.replace(',', '.'));
  return (PORTIONS as readonly number[]).includes(v) ? v : 1;
}

export function readLink(hash: string): Link {
  const h = new URLSearchParams(hash.replace(/^#/, ''));
  const v = h.get('view');
  return {
    q: h.get('q')?.trim() || undefined,
    m: h.get('m')?.trim() || undefined,
    p: h.get('p')?.trim() || undefined,
    n: parsePortion(h.get('n')),
    t: parseTime(h.get('t')),
    view: v === 'detailed' || v === 'full' ? v : 'simple',
    vs: (h.get('vs') ?? h.get('compare'))?.trim() || undefined,
    v: h.get('v')?.trim() || undefined,
    s: h.get('s')?.trim() || undefined,
    add: h.get('add')?.trim() || undefined,
    on: h.get('on')?.trim() || undefined,
    over: parsePace(h.get('over')) || undefined,
  };
}

/** Builds "#q=…&n=…&t=…&view=…&vs=…" (defaults left out). `prev` = the current hash, whose other keys are kept. */
export function writeLink(l: Partial<Link>, prev = ''): string {
  const out = new URLSearchParams();
  if (l.m) out.set('m', l.m); else if (l.q) out.set('q', l.q); else if (l.p) out.set('p', l.p);
  if (!l.m && l.q) { if (l.v) out.set('v', l.v); if (l.add) out.set('add', l.add); if (l.on) out.set('on', l.on); }
  if (!l.m && l.q && l.s) out.set('s', l.s);
  else if (l.n !== undefined && l.n !== 1) out.set('n', String(l.n));
  if (l.over && cleanPace(l.over)) out.set('over', `${cleanPace(l.over) / 60}h`);
  if (l.t !== undefined && l.t !== null) out.set('t', formatTime(l.t));
  if (l.view && l.view !== 'simple') out.set('view', l.view);
  if (l.vs) out.set('vs', l.vs);
  new URLSearchParams(prev.replace(/^#/, '')).forEach((val, key) => { if (!OWN.includes(key) && !DROP.includes(key) && !out.has(key)) out.set(key, val); });
  const s = out.toString();
  return s ? `#${s}` : '';
}

// ---- food ⇄ link text ----
/** Curated products (own detailed models) are linked by plain name and reopen in that model. */
export const CURATED_Q: Record<string, string> = { cola: 'cola', espresso: 'espresso', water: 'glass of water' };
/** Own key only: link text like "constructor" or "__proto__" must never reach Object.prototype. */
export const own = <T,>(o: Record<string, T>, k: string | undefined | null): T | undefined => (k != null && Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined);
/** Only the plain default (not decaf, not with sugar, not a 500 ml cola) reopens in the curated model. */
export const isCuratedServing = (parts: Part[]) => parts.length === 1 && isPlain(parts[0].food) && !!own(CURATED_Q, parts[0].food.id) && Math.abs(parts[0].grams - parts[0].food.serving.grams) < 1;
const sameMeal = (a: Part[], b: Part[]) => a.length === b.length && a.every((p, i) => foodKey(p.food) === foodKey(b[i].food) && Math.abs(p.grams - b[i].grams) < 1);
const cache = new Map<string, string>();
/** Shortest text that parses back to exactly these foods and grams: "cola", "banana", else "118 g Banana + 250 g Milk". */
export function mealText(parts: Part[]): string {
  if (isCuratedServing(parts)) return CURATED_Q[parts[0].food.id];
  const exact = parts.map((p) => `${Math.round(p.grams)} g ${p.food.name.replace(/\s*\(.*\)$/, '')}`).join(' + ');
  const hit = cache.get(exact);
  if (hit) return hit;
  let out = exact;
  if (parts.every((p) => Math.abs(p.grams - p.food.serving.grams) < 1)) {
    const short = parts.map((p) => p.food.name.replace(/\s*\(.*\)$/, '').toLowerCase()).join(' + ');
    if (sameMeal(parseMeal(short), parts)) out = short;
  }
  cache.set(exact, out);
  return out;
}

/** What a link names: a meal code first, else the text, else nothing (curated #p= links are handled by the app). */
export function linkParts(l: Pick<Link, 'q' | 'm'> & Partial<Pick<Link, 'v' | 'add' | 'on'>>): Part[] {
  const meal = mealFromCode(l.m);
  if (meal.length) return meal;
  const parts = l.q ? parseMeal(l.q) : [];
  if (parts.length !== 1 || !(l.v || l.add || l.on)) return parts;
  // the kind named in the link; an unknown v / add / on falls back to the default (no miss: the food is there)
  const p = parts[0];
  const ch: Choice = { v: l.v ?? p.food.v, on: l.on ? l.on.split(/[\s+,]+/).filter(Boolean) : p.food.on, add: l.add ? readAdd(l.add) : p.food.add };
  const f = deriveFood(baseOf(p.food), ch);
  return [servingPart(f, p.grams / Math.max(1e-9, p.food.serving.grams))];
}
const readAdd = (s: string): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const tok of s.split(/[\s+,]+/)) {
    const m = /^([a-z]+)(\d+)?$/.exec(tok);
    if (m && !Object.prototype.hasOwnProperty.call(out, m[1])) out[m[1]] = Number(m[2] ?? 1);
  }
  return out;
};
/** The multiple of one serving the link asks for: a named size (s) wins over n; an unknown size falls back to n. */
export function linkMult(l: Pick<Link, 'n'> & Partial<Pick<Link, 's'>>, base: Part[]): number {
  if (l.s && base.length === 1) { const z = sizesOf(base[0].food)?.find((x) => x.k === l.s); if (z) return z.mult; }
  return l.n;
}
export interface Resolved {
  link: Link;
  /** what the link names, as parts (empty: nothing, or nothing we know) */
  base: Part[];
  /** the food text the link asked for but we could not find (shown to the person, never silently replaced) */
  miss?: string;
  /** the comparison partner, only when we know it */
  vs?: Part[];
  /** the partner the link asked for but we could not find */
  vsMiss?: string;
  /** how many servings to show: the named size (s) when it is one of this food's sizes, else n */
  mult: number;
}
const safeParts = (f: () => Part[]): Part[] => { try { const p = f(); return Array.isArray(p) ? p : []; } catch { return []; } };
/** Everything a (possibly old, mistyped or hand-edited) link asks for, without ever throwing. Unknown foods and
 *  partners come back as `miss` / `vsMiss` so the app can say so instead of crashing or showing something else.
 *  `isProduct` = curated product ids the app can open from an old #p= link. */
export function resolveLink(hash: string, isProduct: (id: string) => boolean = (id) => !!own(CURATED_Q, id)): Resolved {
  let link: Link;
  try { link = readLink(hash); } catch { link = { n: 1, t: null, view: 'simple' }; }
  const named = link.m || link.q;
  const base = named ? safeParts(() => linkParts(link))
    : link.p && own(CURATED_Q, link.p) && link.n !== 1 ? safeParts(() => parseMeal(own(CURATED_Q, link.p)!)) : [];
  const miss = named && !base.length ? named : !named && link.p && !isProduct(link.p) ? link.p : undefined;
  const vsParts = link.vs ? safeParts(() => parseMeal(link.vs!)) : [];
  return { link, base, miss, mult: linkMult(link, base), vs: vsParts.length ? vsParts : undefined, vsMiss: link.vs && !vsParts.length ? link.vs : undefined };
}

/** Link fields for what is on screen: two or more things → exact meal code (m); one → the short text (q). */
export const linkFor = (parts: Part[]): Pick<Link, 'q' | 'm' | 'v' | 'add' | 'on'> => {
  if (parts.length > 1) return { m: mealCode(parts) };
  const p = parts[0];
  if (!p || isPlain(p.food)) return { q: mealText(parts) };
  // one food of another kind: #q=<base>&v=…&add=…&on=… at one serving; an odd amount uses the exact meal code
  if (Math.abs(p.grams - p.food.serving.grams) >= 1) return { m: mealCode(parts) };
  const f = p.food;
  return { q: mealText([servingPart(baseOf(f), 1)]), v: f.v, add: f.add ? Object.entries(f.add).map(([k, x]) => `${k}${x}`).join(' ') : undefined, on: f.on?.join(' ') };
};
