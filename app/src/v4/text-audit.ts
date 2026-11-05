// Round 17 (critique f, 2026-11-05): the text audit. Every string a video shows or posts (hooks A and B, cards, teasers,
// chapter kickers, guess answers, verdicts, end cards, titles, descriptions, hashtags) for EVERY database item, variant
// and builder choice, in all three cuts, and for a broad, seeded set of comparisons (typical servings, the same amount,
// near ties, food vs drink, alcohol), built by the same code as the app, then linted for whole classes of mistakes:
// repeated amounts ("of 250 ml of 250 ml"), repeated time phrases, contradictions (an answer that names a winner next
// to "It's close"), cards shown at a moment they do not belong to, generic hooks, hooks without the food, grammar and
// plurals, units, generic hashtags, and lengths. text-audit.test.ts runs it (every class must be empty) and writes the
// dump a reviewer reads: research/improvements/text-audit-2026-11-05.txt.
// Not part of the app bundle (nothing in the app imports it).
import db from './food/fooddb.json';
import { deriveFood, parseMeal, servingPart, type Food, type Part } from './food/parse';
import { analyze, type Analysis } from './analyze';
import { DEFAULT_PROFILE, type Profile } from '../science/profile';
import { chapterText } from './stories';
import { compareHookB, HOOK_NUMBER, hookB, hookFor, hookForCompare, type Hook } from './video-hook';
import { captionsFor, foodTag } from './video-caption';
import { plainNote, inText, whereCard } from './video-body';
import { FPS, readSeconds, type Cut, type Plan, type PlanFx, type StopIn } from './video-plan';
import { BEAT_WORDS } from './video-beats';
import { worstMoment } from './status';
import { sameAmountOffer, sameAs } from './Compare';
import { applyHook, beatCtx, climaxFx, cmpName, comparePlan, decafOf, heroOf, payoffMinOf, shortName, singlePlan, singleStops, staleAt, surgeOf, surpriseOf, type ComparePlan } from './video-story';

export const AUDIT_PROFILE: Profile = { ...DEFAULT_PROFILE, drinkAtMin: 22 * 60 };
export const AUDIT_CUTS: Cut[] = ['long', 'medium', 'short'];
const SYS = ['energy', 'heart', 'water', 'brain'] as const;

export interface AuditItem { id: string; x: Analysis }
/** Every database food, every variant, every builder preset and "everything on", each at one serving. */
export function auditItems(p: Profile = AUDIT_PROFILE): AuditItem[] {
  const out: AuditItem[] = [];
  const add = (id: string, parts: Part[]) => { if (parts.length) out.push({ id, x: analyze(parts, p) }); };
  type DbFood = { id: string; name: string; aliases?: string[]; variants?: { v: string; name: string }[] };
  for (const f0 of db as unknown as DbFood[]) {
    const parts = parseMeal(f0.name); add(f0.id, parts.length ? parts : parseMeal(f0.aliases?.[0] ?? f0.id));
    for (const v of f0.variants ?? []) add(`${f0.id}.${v.v}`, parseMeal(v.name));
    const f = (parts[0]?.food.id === f0.id ? parts[0].food : undefined) as Food | undefined;
    const b = f?.builder;
    if (f && b) {
      for (const pr of b.presets) add(`${f0.id}+${pr.k}`, [servingPart(deriveFood(f, { on: pr.on }), 1)]);
      const all = b.groups.flatMap((g) => (g.one ? g.opts.filter((o) => o.on).slice(0, 1) : g.opts)).map((o) => o.k);
      add(`${f0.id}+all`, [servingPart(deriveFood(f, { on: all }), 1)]);
    }
  }
  return out;
}

export interface SingleOut { hook: Hook; plan: Plan; stops: StopIn[]; payoff?: number; name: string; hero?: { big: string; small: string }; notes: string[]; caps: ReturnType<typeof captionsFor> }
/** The single video exactly as AppV4 builds it (reelPlan, overlay, captions). */
export function auditSingle(x: Analysis, cut: Cut, v: 'A' | 'B', p: Profile = AUDIT_PROFILE): SingleOut {
  const b = x.built, story = b.story, name = shortName(x.label);
  const chapters = story.chapters.map((c) => ({ min: c.min, title: c.title, text: chapterText(c, c.min) }));
  const solid = /bite/i.test(story.chapters[0]?.title ?? '');
  const hin = { name, chapters, alcohol: (b.alcoholG ?? 0) > 1, caffeine: b.caffeine.doseMg >= 10, solid, kcal: b.energy.total, grams: x.macros.grams,
    pace: b.pace ? { doses: b.pace.doses, round: 'drink' } : undefined, caffeineMg: b.caffeine.doseMg, surprise: surpriseOf(x.label, x.sugarPeak, p), decaf: decafOf(x.label, b, p) };
  const hookA = hookFor(hin), hook = v === 'A' ? hookA : hookB(hin, hookA);
  const stops = applyHook(singleStops(story, beatCtx(name, b, p.drinkAtMin), (m) => whereCard(b, m)), hook, (b.alcoholG ?? 0) > 1 ? 0 : b.caffeine.doseMg);
  const fx: PlanFx = { ...climaxFx(b, x.glucose !== undefined, chapters, hook), payoffMin: payoffMinOf(stops, hook), drinkAtMin: p.drinkAtMin, wakeMin: p.wakeMin,
    lights: x.systems.map((s) => s.levels[worstMoment(s)] as 0 | 1 | 2), heart: x.systems.find((s) => s.key === 'heart')?.levels, surge: surgeOf(b, x.glucose !== undefined) };
  const plan = singlePlan(stops, cut, fx), payoff = fx.payoffMin;
  const notes = x.systems.map((s) => { const w = worstMoment(s), l = s.levels[w] as 0 | 1 | 2; return `${s.label}: ${plainNote(s.key as typeof SYS[number], l, w, b, inText(w), !!s.unknown)}`; });
  const caps = captionsFor({ name, hook, alcohol: (b.alcoholG ?? 0) > 1, caffeine: b.caffeine.doseMg >= 10 || /\bdecaf/i.test(x.label), sugar: (x.sugarPeak ?? 0) >= 0.5, solid });
  return { hook, plan, stops, payoff, name, hero: heroOf(b, x.glucose !== undefined, chapters, p.glucoseUnit, hook), notes, caps };
}

export interface CompareOut { cp: ComparePlan; hook: string; hookB: string; caps: ReturnType<typeof captionsFor>; an: string; bn: string }
export function auditCompare(a: Analysis, b: Analysis, cut: Cut, p: Profile = AUDIT_PROFILE): CompareOut {
  const cp = comparePlan(a, b, p, cut), an = cmpName(a.label), bn = cmpName(b.label), gq = cp.guess;
  const hook = gq ? gq.question : hookForCompare(an, bn, false).line1, hb = gq ? compareHookB(gq.question, an, bn) : hook;
  const caps = captionsFor({ name: `${an} vs ${bn}`, hook: { line1: hook, line2: '' }, alcohol: [a, b].some((x) => (x.built.alcoholG ?? 0) > 1), sugar: /sugar/i.test(hook),
    caffeine: [a, b].some((x) => x.built.caffeine.doseMg >= 20), compare: { a: an, b: bn } });
  return { cp, hook, hookB: hb, caps, an, bn };
}

/** A seeded, broad set of comparison pairs: random pairs, the same amount wherever the app offers it, near ties,
 *  food vs drink, alcohol vs alcohol. Each is [id, left query parts, right query parts]. */
export function auditPairs(items: AuditItem[], n = 300, p: Profile = AUDIT_PROFILE): { id: string; a: Analysis; b: Analysis; same: boolean }[] {
  let seed = 20261105;
  const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 2 ** 32; };
  const base = items.filter((i) => !/[.+]/.test(i.id));
  const pick = (xs: AuditItem[]) => xs[Math.floor(rnd() * xs.length)];
  const liquids = base.filter((i) => i.x.built.story.chapters[0] && !/bite/i.test(i.x.built.story.chapters[0].title));
  const solids = base.filter((i) => !liquids.includes(i));
  const alcs = base.filter((i) => (i.x.built.alcoholG ?? 0) > 1);
  const out: { id: string; a: Analysis; b: Analysis; same: boolean }[] = [];
  const seen = new Set<string>();
  const push = (l: AuditItem, r: AuditItem, same = false) => {
    if (l.id === r.id) return;
    const key = `${l.id}|${r.id}|${same}`; if (seen.has(key)) return; seen.add(key);
    if (!same) { out.push({ id: `${l.id} vs ${r.id}`, a: l.x, b: r.x, same }); return; }
    const lp = parseMeal(l.x.name), rp = parseMeal(r.x.name);
    if (!sameAmountOffer(lp, rp)) return;
    const rs = sameAs(lp[0], rp[0]); if (!rs) return;
    out.push({ id: `${l.id} vs ${r.id} (same amount)`, a: l.x, b: analyze(rs, p), same });
  };
  // fixed pairs the critics watched, then the random ones
  const by = (id: string) => base.find((i) => i.id === id);
  for (const [l, r] of [['cola', 'orange-juice'], ['apple-juice', 'cola'], ['brie', 'banana'], ['ice-cream', 'green-tea'], ['cola', 'water'], ['espresso', 'beer'], ['red-wine', 'beer'], ['hamburger', 'cola']] as const) {
    const L = by(l), R = by(r); if (L && R) { push(L, R); push(L, R, true); }
  }
  let guard = 0;
  while (out.length < n && guard++ < 20 * n) {
    const k = rnd();
    if (k < 0.35) push(pick(base), pick(base));
    else if (k < 0.6) push(pick(liquids), pick(liquids), true);
    else if (k < 0.75) push(pick(solids), pick(solids), true);
    else if (k < 0.9) push(pick(solids), pick(liquids));
    else push(pick(alcs.length ? alcs : base), pick(rnd() < 0.5 && alcs.length ? alcs : base));
  }
  return out;
}

// ---------------------------------------------------------------- lint
export type Issue = { cls: string; where: string; text: string };
const w = (s: string) => s.trim().split(/\s+/).filter(Boolean);
const GENERIC_TAGS = new Set(['drink', 'drinks', 'food', 'juice', 'milk', 'tea', 'water', 'coffee', 'wine', 'roll', 'cake', 'bread', 'potato', 'cheese', 'yogurt', 'shake', 'soup', 'salad']);
const NAME_STOP = new Set(['one', 'a', 'an', 'can', 'cup', 'glass', 'bottle', 'of', 'whole', 'half', 'small', 'large', 'medium', 'big', 'portion', 'slice', 'slices', 'serving', 'ml', 'g', 'with', 'and', 'the', 'shot', 'mug', 'pint', 'over', 'inch', 'toppings', 'fillet', 'piece', 'pieces', 'bowl', 'plate', 'side']);
const nameWords = (name: string) => name.replace(/\s+over\s+.*$/i, '').toLowerCase().split(/[^a-z]+/).filter((x) => x.length >= 3 && !NAME_STOP.has(x));

/** Lints one on-screen or posted string. */
export function lintText(s: string, where: string, kind: 'card' | 'hook' | 'verdict' | 'caption' | 'title' | 'note' | 'answer'): Issue[] {
  const out: Issue[] = [];
  const bad = (cls: string) => out.push({ cls, where, text: s });
  if (!s.trim()) return out;
  if (/undefined|NaN|\bnull\b|\[object|Infinity|\$\{/.test(s)) bad('broken');
  // repeated words and phrases
  if (/\b(\w+) \1\b/i.test(s.replace(/\b(\d+) (?=\d)/g, ''))) bad('duplicate word');
  if (/\b(\d+(?:[.,]\d+)?\s*(?:ml|g|mg|kcal)) of \1\b/i.test(s) || /of \d+(?:[.,]\d+)?\s*(?:ml|g) of \d+(?:[.,]\d+)?\s*(?:ml|g)\b/i.test(s)) bad('repeated amount');
  if (kind !== 'caption') {
    const t = s.toLowerCase().replace(/[^a-z0-9%' ]+/g, ' ').split(/\s+/).filter(Boolean);
    const grams = new Map<string, number>();
    for (let i = 0; i + 3 <= t.length; i++) { const g = t.slice(i, i + 3).join(' '); grams.set(g, (grams.get(g) ?? 0) + 1); }
    const rep = [...grams.entries()].find(([g, c]) => c >= 2 && !/^(vs|of|the|a|and) /.test(g));
    if (rep) bad(`repeated phrase`);
  }
  // time phrases said twice
  if ((s.match(/24 hours/g) ?? []).length >= 2 || /, in 24 hours\./.test(s)) bad('redundant time phrase');
  // grammar and plurals
  if (/\b1 (teaspoons|hours|minutes|beers|grams|crepes|eggs|slices|glasses|cans)\b/.test(s)) bad('plural after 1');
  if (/\b(?:[2-9]|\d{2,}) (teaspoon|hour|minute|beer|crepe|egg|glass|can|slice|portion|time)(?![s\w-])/.test(s) && !/\d+ (?:hour|minute)s? (?:later|in)\b/.test('')) bad('singular after 2+');
  if (/\ba (?:[aeio]\w+)/.test(s) && !/\ba (?:one|once)\b/.test(s)) bad('a/an');
  if (/\.\.(?!\.)|,\.|\s[.,:;!?](?!\d)|\s{2,}|:\s*\.|\?\./.test(s)) bad('punctuation');
  if (kind !== 'caption' && kind !== 'title' && /\b(?:and|or) (?!I\b|US\b|USDA\b)[A-Z][a-z]+/.test(s)) bad('capital mid-sentence');
  // units
  if (/\d(?:ml|mg|kcal)\b|\d g\b(?= of\s*$)/.test(s)) bad('unit spacing');
  const tsp = /(\d+) g of sugar: about (\d+) teaspoons?/.exec(s);
  if (tsp && Number(tsp[2]) !== Math.round(Number(tsp[1]) / 4)) bad('teaspoons vs grams');
  // lengths
  if (kind === 'card' && w(s).length > BEAT_WORDS + 1) bad('card too long');
  if (kind === 'hook' && w(s).length > 10) bad('hook line too long');
  if (kind === 'verdict' && s.length > 120) bad('verdict too long');
  return out;
}

/** The chapter title a kicker names, and whether a card under it is shown at its own time. */
export function lintMoment(title: string | undefined, stop: number, chapters: { min: number; title: string }[], where: string): Issue[] {
  if (!title) return [];
  const ch = chapters.filter((c) => c.title === title).sort((p, q) => Math.abs(p.min - stop) - Math.abs(q.min - stop))[0];
  if (!ch) return [];
  if (staleAt(ch, stop)) return [{ cls: 'card at the wrong time', where, text: `${title} (+${ch.min} min) shown at +${stop} min` }];
  return [];
}

export interface AuditResult { issues: Issue[]; dump: string[] }
const hm = (m: number) => `+${Math.floor(m / 60)}:${String(Math.round(m % 60)).padStart(2, '0')}`;

export function auditSingles(items: AuditItem[], res: AuditResult, p: Profile = AUDIT_PROFILE) {
  for (const { id, x } of items) {
    const chapters = x.built.story.chapters;
    const solid = /bite/i.test(chapters[0]?.title ?? '');
    const all = (cut: Cut, v: 'A' | 'B') => auditSingle(x, cut, v, p);
    const A = all('long', 'A'), B = all('long', 'B');
    res.dump.push('', `=== ${id} · ${A.name}`);
    for (const [v, o] of [['A', A], ['B', B]] as const) {
      res.dump.push(`  hook ${v}: ${o.hook.line1} / ${o.hook.line2}${o.hook.payoff ? `  [pays off: ${o.hook.payoff}]` : ''}`);
      for (const l of [o.hook.line1, o.hook.line2]) res.issues.push(...lintText(l, `${id} hook ${v}`, 'hook'));
      const both = `${o.hook.line1} ${o.hook.line2}`;
      if ((both.match(/24 hours/g) ?? []).length >= 2) res.issues.push({ cls: 'redundant time phrase', where: `${id} hook ${v}`, text: both });
      if (!HOOK_NUMBER.test(both) && !/\?/.test(both)) res.issues.push({ cls: 'generic hook', where: `${id} hook ${v}`, text: both });
      if (solid && /water go\?/.test(both)) res.issues.push({ cls: 'generic hook', where: `${id} hook ${v}`, text: both });
      if (/What happens to it in 24 hours\?/.test(both)) res.issues.push({ cls: 'generic hook', where: `${id} hook ${v}`, text: both });
      if (/Watch it for 24 hours\./.test(both) && !/\?/.test(both) && !/\d{3,} kcal/.test(both)) res.issues.push({ cls: 'generic hook', where: `${id} hook ${v}`, text: both });
      const nw = nameWords(o.name);
      if (nw.length && !(x.built.alcoholG && x.built.pace) && !nw.some((n) => both.toLowerCase().includes(n))) res.issues.push({ cls: 'hook without the food', where: `${id} hook ${v}`, text: both });
    }
    for (const cut of AUDIT_CUTS) for (const v of ['A', 'B'] as const) {
      const o = cut === 'long' ? (v === 'A' ? A : B) : all(cut, v);
      const titleAt = new Map<number, string | undefined>();
      for (const f of o.plan.frames) if (f.stop !== undefined && f.title && f.beat === 'hold' && !titleAt.has(f.stop)) titleAt.set(f.stop, f.title);
      if (v === 'A') res.dump.push(`  ${cut} (${o.plan.seconds.toFixed(1)} s):`);
      // a question is answered in every cut: its moment is in the video
      if (/\?/.test(`${o.hook.line1} ${o.hook.line2}`) && (o.payoff === undefined || !o.plan.stops.some((m) => Math.abs(m - o.payoff!) <= 1))) res.issues.push({ cls: 'question never answered', where: `${id} ${cut} ${v}`, text: `${o.hook.line1} ${o.hook.line2} (answer at ${o.payoff ?? 'none'})` });
      for (const pg of o.plan.pages) {
        if (!pg.text) continue;
        if (v === 'A') res.dump.push(`    ${hm(pg.stop).padEnd(7)} ${(titleAt.get(pg.stop) ?? '').toUpperCase().padEnd(26)} ${pg.text}`);
        res.issues.push(...lintText(pg.text, `${id} ${cut} ${v} ${hm(pg.stop)}`, 'card'));
        if (pg.s < readSeconds(pg.text) - 1 / FPS) res.issues.push({ cls: 'reading time', where: `${id} ${cut} ${v}`, text: `${pg.text} (${pg.s.toFixed(2)} s)` });
        if (/^Coming up: .*\bsleep\b/.test(pg.text) && !chapters.some((c) => /bed|^Sleep\b|night/i.test(c.title))) res.issues.push({ cls: 'teaser promises the wrong thing', where: `${id} ${cut}`, text: pg.text });
      }
      for (const [st, t] of titleAt) res.issues.push(...lintMoment(t, st, chapters, `${id} ${cut} ${v}`));
    }
    if (!A.hero) res.issues.push({ cls: 'end card without a number', where: id, text: A.name });
    res.dump.push(`  end card: ${A.name}${A.hero ? ` · hero ${A.hero.big} (${A.hero.small})` : ' · (no hero number)'}`);
    for (const n of A.notes) { res.dump.push(`    ${n}`); res.issues.push(...lintText(n.replace(/^[^:]+: /, ''), `${id} end note`, 'note')); }
    res.dump.push(`  YouTube title: ${A.caps.shorts.title}`, `  TikTok: ${A.caps.tiktok.split('\n')[0]}`, `  tags: ${(A.caps.tiktok.match(/#\w+/g) ?? []).join(' ')}`);
    res.issues.push(...lintText(A.caps.shorts.title, `${id} title`, 'title'));
    if (A.caps.shorts.title.length > 100) res.issues.push({ cls: 'title too long', where: id, text: A.caps.shorts.title });
    const tag = foodTag(A.name), words = nameWords(A.name.replace(/\s+with\s+.*$/i, ''));
    if (GENERIC_TAGS.has(tag) && words.length >= 2) res.issues.push({ cls: 'generic hashtag', where: id, text: `#${tag} for ${A.name}` });
  }
}

export function auditCompares(pairs: { id: string; a: Analysis; b: Analysis; same: boolean }[], res: AuditResult, p: Profile = AUDIT_PROFILE) {
  for (const pr of pairs) {
    res.dump.push('', `=== ${pr.id}`);
    for (const cut of AUDIT_CUTS) {
      const o = auditCompare(pr.a, pr.b, cut, p), g = o.cp.guess, where = `${pr.id} ${cut}`;
      if (cut === 'long') {
        res.dump.push(`  hook: ${o.hook}   (B: ${o.hookB})`);
        if (g) res.dump.push(`  answer: ${g.answer1} ${g.answer2}  · recap: ${g.recap}`);
        res.dump.push(`  verdict: ${o.cp.verdict}`, `  title: ${o.caps.shorts.title}`, `  tags: ${(o.caps.tiktok.match(/#\w+/g) ?? []).join(' ')}`);
        res.issues.push(...lintText(o.cp.verdict, `${where} verdict`, 'verdict'), ...lintText(o.hook, `${where} hook`, 'hook'), ...lintText(o.hookB, `${where} hook B`, 'hook'), ...lintText(o.caps.shorts.title, `${where} title`, 'title'));
        if (g) for (const t of [g.answer1, g.answer2, g.recap]) res.issues.push(...lintText(t, `${where} answer`, 'answer'));
        // one tie rule for all the verdict text: an answer that names a winner never sits next to "It's close"
        if (g && !/^Almost the same/.test(g.answer1) && /^It’s close/.test(o.cp.verdict)) res.issues.push({ cls: 'contradiction', where, text: `${g.recap} / ${o.cp.verdict}` });
        if (g && /^Almost the same/.test(g.answer1) && /^🏆/.test(o.cp.verdict) && new RegExp(g.kind === 'sugarG' ? 'sugar' : g.kind === 'kcal' ? 'kcal' : '^$').test(o.cp.verdict)) res.issues.push({ cls: 'contradiction', where, text: `${g.recap} / ${o.cp.verdict}` });
      }
      if (!g) res.issues.push({ cls: 'compare without a guess', where, text: o.hook });
      const tA = new Map<number, string | undefined>(), tB = new Map<number, string | undefined>();
      for (const f of o.cp.plan.frames) if (f.stop !== undefined && f.beat === 'hold') { if (f.title && !tA.has(f.stop)) tA.set(f.stop, f.title); if (f.titleB && !tB.has(f.stop)) tB.set(f.stop, f.titleB); }
      if (cut === 'long') res.dump.push(`  long (${o.cp.plan.seconds.toFixed(1)} s):`);
      for (const pg of o.cp.plan.pages) {
        if (cut === 'long') res.dump.push(`    ${hm(pg.stop).padEnd(7)} ${pg.text || '—'}  ||  ${pg.textB || '—'}`);
        for (const t of [pg.text, pg.textB ?? '']) if (t) res.issues.push(...lintText(t, `${where} ${hm(pg.stop)}`, 'card'));
      }
      // the guessed number is not said before the answer (both sides alike)
      if (g && ['sugarG', 'kcal', 'alcohol'].includes(g.kind)) {
        const re = g.kind === 'sugarG' ? /\d+ g of sugar|teaspoons? of sugar/ : g.kind === 'kcal' ? /\d+ kcal/ : /\d+ g of alcohol/;
        const reveal = o.cp.plan.cues.find((c) => c.kind === 'peak')?.t ?? Infinity;
        const early = o.cp.plan.frames.find((f) => f.t + 0.01 < reveal && (re.test(f.cap ?? '') || re.test(f.capB ?? '')));
        if (early) res.issues.push({ cls: 'answer said before the reveal', where, text: `${early.cap ?? ''} || ${early.capB ?? ''}` });
      }
      for (const [st, t] of tA) res.issues.push(...lintMoment(t, st, pr.a.built.story.chapters, `${where} A`));
      for (const [st, t] of tB) res.issues.push(...lintMoment(t, st, pr.b.built.story.chapters, `${where} B`));
    }
  }
}

export function runAudit(nPairs = 300): AuditResult {
  const res: AuditResult = { issues: [], dump: [] };
  const items = auditItems();
  auditSingles(items, res);
  auditCompares(auditPairs(items, nPairs), res);
  return res;
}
