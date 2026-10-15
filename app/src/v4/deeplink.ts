// Deep links: every moment can be shared. The hash holds what you ate, how much, the minute of the day, the view
// and the comparison partner, e.g. #q=cola&n=2&t=45m&view=full&vs=glass+of+water. Opening it restores that moment
// (paused, so people see what the sender saw). Old links (#q=banana, #p=cola&t=90, #compare=…) keep working.
// MEALS: #m=hamburger+fries*2+cola (food ids, *servings or *grams g; food/meal.ts). Exact and short; old meal links
// written as text (#q=118 g Banana + 250 g Milk) still open through the text parser.
import { MAX_MIN } from '../time';
import { parseMeal, type Part } from './food/parse';
import { mealCode, mealFromCode } from './food/meal';

export type View = 'simple' | 'full' | 'detailed';
export const PORTIONS = [0.5, 1, 2, 3] as const;
/** Keys this module owns; any other key in the hash (dose, city, QA keys…) is passed through untouched. */
const OWN = ['q', 'm', 'p', 'n', 't', 'view', 'vs', 'compare'];
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
}

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
  };
}

/** Builds "#q=…&n=…&t=…&view=…&vs=…" (defaults left out). `prev` = the current hash, whose other keys are kept. */
export function writeLink(l: Partial<Link>, prev = ''): string {
  const out = new URLSearchParams();
  if (l.m) out.set('m', l.m); else if (l.q) out.set('q', l.q); else if (l.p) out.set('p', l.p);
  if (l.n !== undefined && l.n !== 1) out.set('n', String(l.n));
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
export const isCuratedServing = (parts: Part[]) => parts.length === 1 && !!CURATED_Q[parts[0].food.id] && Math.abs(parts[0].grams - parts[0].food.serving.grams) < 1;
const sameMeal = (a: Part[], b: Part[]) => a.length === b.length && a.every((p, i) => p.food.id === b[i].food.id && Math.abs(p.grams - b[i].grams) < 1);
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
export function linkParts(l: Pick<Link, 'q' | 'm'>): Part[] {
  const meal = mealFromCode(l.m);
  return meal.length ? meal : l.q ? parseMeal(l.q) : [];
}
/** Link fields for what is on screen: two or more things → exact meal code (m); one → the short text (q). */
export const linkFor = (parts: Part[]): Pick<Link, 'q' | 'm'> => (parts.length > 1 ? { m: mealCode(parts) } : { q: mealText(parts) });
