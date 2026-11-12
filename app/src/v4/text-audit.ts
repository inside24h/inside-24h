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
import { captionFlags, captionsFor, foodTag } from './video-caption';
import { amountPhrase, capFirst, distinctName, sharedBaseName } from './food/naming';
import { isTreat } from './analyze';
import { isPluralName } from './video-names';
import { ALCOHOL_FREE_MAX_G100, hasStarch } from './food/foodProduct';
import { plainNote, inText, whereCard } from './video-body';
import { FPS, readSeconds, type Cut, type Plan, type PlanFx, type StopIn } from './video-plan';
import { BEAT_WORDS } from './video-beats';
import { worstMoment } from './status';
import { lintNarration, narrationFor, type NarrIn } from './video-narration';
import { arcFor, compareDiffs, compareFacts, factInOf, factLines } from './video-facts';
import { seedOf } from './video-hook';
import { sameAmountOffer, sameAs } from './Compare';
/** AppV4 HOOK_OF: the curated products' own names. */
const CURATED_NAME: Record<string, string> = { cola: 'One can of cola', espresso: 'One espresso', water: 'One glass of water' };
import { applyHook, beatCtx, climaxFx, cmpName, comparePlan, servingAmount, decafOf, heroOf, payoffMinOf, shortName, singlePlan, singleStops, staleAt, surgeOf, surpriseOf, REVEAL_FROM, type ComparePlan } from './video-story';

export const AUDIT_PROFILE: Profile = { ...DEFAULT_PROFILE, drinkAtMin: 22 * 60 };
export const AUDIT_CUTS: Cut[] = ['long', 'medium', 'short'];
const SYS = ['energy', 'heart', 'water', 'brain'] as const;

export interface AuditItem { id: string; x: Analysis; /** the app's video name (AppV4 videoName) */ vname: string; parts: Part[] }
/** Every database food, every variant, every builder preset and "everything on", each at one serving. */
export function auditItems(p: Profile = AUDIT_PROFILE): AuditItem[] {
  const out: AuditItem[] = [];
  const add = (id: string, parts: Part[]) => { if (!parts.length) return; const x = analyze(parts, p); out.push({ id, x, parts, vname: parts.length === 1 && CURATED_NAME[parts[0].food.id] && Math.abs(parts[0].grams - parts[0].food.serving.grams) < 1 && !parts[0].food.base ? CURATED_NAME[parts[0].food.id] : parts.length === 1 ? capFirst(amountPhrase(parts[0])) : x.label }); };
  let seed = 18; const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 2 ** 32; };
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
      // (round 18: custom toppings, sampled: one choice per single-choice group, a random handful of extras)
      for (let k = 0; k < 4; k++) {
        const on = b.groups.flatMap((g) => (g.one ? [g.opts[Math.floor(rnd() * g.opts.length)]] : g.opts.filter(() => rnd() < 0.4))).map((o) => o.k);
        add(`${f0.id}+custom${k}(${on.join(',')})`, [servingPart(deriveFood(f, { on }), 1)]);
      }
    }
  }
  return out;
}

export interface SingleOut { hook: Hook; plan: Plan; stops: StopIn[]; payoff?: number; name: string; hero?: { big: string; small: string }; notes: string[]; caps: ReturnType<typeof captionsFor> }
/** The single video exactly as AppV4 builds it (reelPlan, overlay, captions). */
export function auditSingle(x: Analysis, cut: Cut, v: 'A' | 'B', p: Profile = AUDIT_PROFILE, vname = x.label): SingleOut {
  const b = x.built, story = b.story, name = shortName(vname);
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
  const caps = captionsFor({ name, hook, ...captionFlags({ alcoholG: b.alcoholG, caffeineMg: b.caffeine.doseMg, decaf: /\bdecaf/i.test(x.label), sugarPeak: x.sugarPeak, solid, macros: x.macros }) });
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
  // round 18 (critique g): time math, plural agreement, pronouns that lean on nothing
  if (/\babout 0 h\b|\bafter 0 (?:h|min)|by (?:9\d|\d{3,}) minutes/.test(s)) bad('time math');
  const won = /🏆 (.+?) (wins?):/.exec(s);
  if (won && (won[2] === 'wins') === isPluralName(won[1])) bad('subject-verb agreement');
  // master audit 2026-11-12 (section B, C12, C18): the classes that were still found in the v23d dump
  if (falsePrecision(s)) bad('false precision');
  if (truncatedName(s)) bad('truncated name');
  if (/\bcrash(?:es|ing)?\b/i.test(s)) bad('sugar crash wording'); // ("dip", and only when the model dips: SUGAR_DIP_MGDL)
  if (/\bYour stomach fills up\b/i.test(s)) bad('stomach fills up');
  return out;
}

/** C12: a model's time said more precisely than it is known: under an hour to 5 minutes (from 10 min on), from an hour
 *  on to 15 minutes ("1 h 2 min in", "after about 107 minutes"). A pace the person set ("every 23 minutes") is exact. */
export function falsePrecision(s: string): boolean {
  for (const m of s.matchAll(/\b(\d+) h (\d+) min\b/g)) if (Number(m[2]) % 15) return true;
  for (const m of s.matchAll(/(?<!every |\d h |[:.,]|\d )\b(\d+)(?:-minute\b| ?min(?:utes?)?\b)/g)) {
    const n = Number(m[1]);
    if ((n >= 60 && n % 15) || (n >= 10 && n < 60 && n % 5)) return true;
  }
  return false;
}
/** C18: a name cut after a participle or preposition ("hot chocolate made:"), a bare unit ("Ml of cranberry juice"),
 *  or the same word on both sides of "of" ("Gummy bears of gummy candy"). */
export function truncatedName(s: string): boolean {
  return /\b(?:made|cooked|served|topped|filled|mixed|with|without|of|and|or|from)\s*:/i.test(s)
    || /(?:^|[.:!?]\s+)(?:Ml|G|L|Cl|Dl|ml|cl|dl) of\b/.test(s)
    || /\b([a-z]{4,})\s+[a-z]+\s+of\s+\1\b/i.test(s);
}
/** C2: natural sugar framed as added sugar ("Latte with 2% milk: 3 teaspoons of sugar."); starch's teaspoons say "starch". */
export const NATURAL_AS_TSP = /teaspoons? of sugar|about \d+ teaspoons|every teaspoon/i;
export const naturalAsTeaspoons = (s: string) => NATURAL_AS_TSP.test(s) && !/starch/i.test(s);

/** C1: a trophy needs at least two independent, health-relevant reasons (blood sugar, saturated fat, alcohol, caffeine
 *  that delays sleep, kcal, fiber), at least one of them blood sugar, saturated fat, alcohol or sleep; "no caffeine"
 *  alone is never one; and at unequal portions (beyond ±30 %) every reason must still hold per gram. */
export function trophyIssues(v: string, a: Analysis, b: Analysis, where: string): Issue[] {
  const m = /^🏆 (.+?) wins?: (.+)\.$/.exec(v);
  if (!m) return [];
  const out: Issue[] = [], bad = (cls: string) => out.push({ cls, where, text: v });
  const rs = m[2].split(/, (?![^(]*\))/);
  const HEALTH = /blood sugar|saturated fat|no alcohol|keep you awake|caffeine at bedtime|fewer kcal|more fiber/, KEY = /blood sugar|saturated fat|no alcohol|keep you awake|caffeine at bedtime/;
  const h = rs.filter((r) => HEALTH.test(r));
  if (rs.length < 2) bad('single-reason trophy');
  else if (h.length < 2 || !h.some((r) => KEY.test(r))) bad('trophy without two health reasons');
  if (rs.some((r) => /caffeine/.test(r) && !/keep you awake|at bedtime/.test(r))) bad('caffeine as a win reason');
  const win = [a, b].find((x) => cmpName(x.label) === m[1] || x.label === m[1] || x.name === m[1]), lose = win === a ? b : a;
  if (win) {
    const ga = Math.max(1, win.macros.grams), gb = Math.max(1, lose.macros.grams);
    if (Math.max(ga, gb) > 1.3 * Math.min(ga, gb)) {
      const d = (x: Analysis, k: 'kcal' | 'satFat' | 'fiber' | 'availCarbs') => (k === 'kcal' ? x.kcal : x.macros[k]) / Math.max(1, x.macros.grams);
      const flips = rs.some((r) => (/fewer kcal/.test(r) && d(win, 'kcal') >= d(lose, 'kcal')) || (/saturated fat/.test(r) && d(win, 'satFat') >= d(lose, 'satFat'))
        || (/more fiber/.test(r) && d(win, 'fiber') <= d(lose, 'fiber')) || (/blood sugar/.test(r) && d(win, 'availCarbs') > d(lose, 'availCarbs')));
      if (flips) bad('portion-driven trophy');
    }
  }
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

/** 2026-11-05: the voiceover input exactly as AppV4 builds it (single and comparison). */
export const singleNarrIn = (x: Analysis, o: SingleOut, solid: boolean): NarrIn => ({ plan: o.plan, kind: 'single', seed: seedOf(o.name), alcohol: (x.built.alcoholG ?? 0) > 1, caffeine: x.built.caffeine.doseMg >= 10, solid, hero: o.hero, hook: o.hook, name: o.name, facts: factLines(factInOf(x), seedOf(o.name)), arc: arcFor(factInOf(x), seedOf(o.name)) });
export const compareNarrIn = (a: Analysis, b: Analysis, cp: ComparePlan): NarrIn => {
  const an = cmpName(a.label), bn = cmpName(b.label), hook = cp.guess ? cp.guess.question : hookForCompare(an, bn, false).line1;
  return { plan: cp.plan, kind: 'compare', seed: seedOf(`${a.label} vs ${b.label}`), alcohol: [a, b].some((y) => (y.built.alcoholG ?? 0) > 1), guess: !!cp.guess,
    hook: { line1: hook, line2: '' }, names: [an, bn], answer: cp.guess?.answer1,
    facts: compareFacts(factInOf(a), factInOf(b), [an, bn], seedOf(`${a.label} vs ${b.label}`)), lateFacts: compareDiffs(factInOf(a), factInOf(b), [an, bn], seedOf(`${a.label} vs ${b.label}`)), verdict: cp.verdict };
};

export interface AuditResult { issues: Issue[]; dump: string[] }
const hm = (m: number) => `+${Math.floor(m / 60)}:${String(Math.round(m % 60)).padStart(2, '0')}`;

export function auditSingles(items: AuditItem[], res: AuditResult, p: Profile = AUDIT_PROFILE) {
  const tplA = new Map<string, string[]>(), tplB = new Map<string, string[]>();
  for (const { id, x, vname, parts } of items) {
    const chapters = x.built.story.chapters;
    const solid = /bite/i.test(chapters[0]?.title ?? '');
    const all = (cut: Cut, v: 'A' | 'B') => auditSingle(x, cut, v, p, vname);
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
      // the hook template (numbers and the food's name taken out), counted over all items (round 18, critic T-7)
      const tpl = both.replace(new RegExp(o.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'X').replace(/\d+(?:[.,]\d+)?/g, 'N');
      const map = v === 'A' ? tplA : tplB; map.set(tpl, [...(map.get(tpl) ?? []), id]);
      const nw = nameWords(o.name);
      if (nw.length && !(x.built.alcoholG && x.built.pace) && !nw.some((n) => both.toLowerCase().includes(n))) res.issues.push({ cls: 'hook without the food', where: `${id} hook ${v}`, text: both });
    }
    const said: string[] = []; // (everything this item's videos show or say, for the item-level checks)
    for (const cut of AUDIT_CUTS) for (const v of ['A', 'B'] as const) {
      const o = cut === 'long' ? (v === 'A' ? A : B) : all(cut, v);
      const titleAt = new Map<number, string | undefined>();
      for (const f of o.plan.frames) if (f.stop !== undefined && f.title && f.beat === 'hold' && !titleAt.has(f.stop)) titleAt.set(f.stop, f.title);
      if (v === 'A') res.dump.push(`  ${cut} (${o.plan.seconds.toFixed(1)} s):`);
      // a question is answered in every cut: its moment is in the video
      if (/\?/.test(`${o.hook.line1} ${o.hook.line2}`) && (o.payoff === undefined || !o.plan.stops.some((m) => Math.abs(m - o.payoff!) <= 1))) res.issues.push({ cls: 'question never answered', where: `${id} ${cut} ${v}`, text: `${o.hook.line1} ${o.hook.line2} (answer at ${o.payoff ?? 'none'})` });
      let prevStop = -1;
      for (const pg of o.plan.pages) {
        if (!pg.text) continue;
        // a card that starts with a pronoun leans on the card before it, at the same moment (round 18, critic T-5)
        if (/^(It|They|These|Then|This|That)\b/.test(pg.text) && prevStop !== pg.stop) res.issues.push({ cls: 'pronoun without its noun', where: `${id} ${cut} ${v} ${hm(pg.stop)}`, text: pg.text });
        prevStop = pg.stop;
        if (v === 'A') res.dump.push(`    ${hm(pg.stop).padEnd(7)} ${(titleAt.get(pg.stop) ?? '').toUpperCase().padEnd(26)} ${pg.text}`);
        res.issues.push(...lintText(pg.text, `${id} ${cut} ${v} ${hm(pg.stop)}`, 'card'));
        if (pg.s < readSeconds(pg.text) - 1 / FPS) res.issues.push({ cls: 'reading time', where: `${id} ${cut} ${v}`, text: `${pg.text} (${pg.s.toFixed(2)} s)` });
        if (/^Coming up: .*\bsleep\b/.test(pg.text) && !chapters.some((c) => /bed|^Sleep\b|night/i.test(c.title))) res.issues.push({ cls: 'teaser promises the wrong thing', where: `${id} ${cut}`, text: pg.text });
      }
      for (const [st, t] of titleAt) res.issues.push(...lintMoment(t, st, chapters, `${id} ${cut} ${v}`));
      // 2026-11-05: the voiceover script of this cut (video-narration.ts), as the app builds it
      const nin = singleNarrIn(x, o, solid), vo = narrationFor(nin);
      for (const i of lintNarration(vo, nin)) res.issues.push({ cls: i.cls, where: `${id} ${cut} ${v} voice`, text: i.text });
      for (const l of vo) res.issues.push(...lintText(l.text, `${id} ${cut} ${v} voice`, 'note')); // (v20: a spoken line may read a card with its lead-in; its length is linted per slot, lintNarration)
      if (v === 'A' && cut === 'long') res.dump.push(`    voice: ${vo.map((l) => `[${l.t.toFixed(1)} s] ${l.text}`).join('  ')}`);
      if (v === 'A' && cut === 'long') countScript(vo.map((l) => l.text), id);
      said.push(...o.plan.pages.map((q) => q.text), ...vo.map((l) => l.text));
    }
    if (!A.hero) res.issues.push({ cls: 'end card without a number', where: id, text: A.name });
    // master audit 2026-11-12 (C18, C2): the video's name is whole, and natural sugar is never "teaspoons of sugar"
    if (truncatedName(`${A.name}.`) || / (?:made|cooked|served|with|without|of|and)$/i.test(A.name)) res.issues.push({ cls: 'truncated name', where: id, text: A.name });
    // (a starchy food's "about N teaspoons of sugar" is its starch turned into glucose, said with "Watch the starch …"; its
    // own sugar is a small share, so the natural-sugar class is about foods whose carbohydrate is mostly sugar)
    if (x.macros.sugarSource && x.macros.sugars >= 0.5 * x.macros.availCarbs) {
      said.push(A.hook.line1, A.hook.line2, B.hook.line1, B.hook.line2, A.hook.lead ?? '', A.hero?.big ?? '', A.hero?.small ?? '', A.caps.shorts.title, A.caps.tiktok);
      for (const t of new Set(said)) if (naturalAsTeaspoons(t)) res.issues.push({ cls: 'natural sugar as teaspoons', where: id, text: t });
    }
    // round 18 (critique g): the story fits the food's class
    const alc100 = Math.max(0, ...parts.map((q) => q.food.p.alcoholG ?? 0)), alcoholic = (x.built.alcoholG ?? 0) > 1;
    const allText = [A.hook.line1, A.hook.line2, B.hook.line1, B.hook.line2, ...A.plan.pages.map((q) => q.text), A.caps.tiktok].join(' | ');
    if (alc100 < ALCOHOL_FREE_MAX_G100 && /\balcohol\b(?!-free)|hangover|#alcohol/i.test(allText.replace(/alcohol-?free/gi, ''))) res.issues.push({ cls: 'alcohol story for an alcohol-free item', where: id, text: (/[^|]*(?:alcohol|hangover)[^|]*/i.exec(allText.replace(/alcohol-?free/gi, ''))?.[0] ?? '').trim() });
    if (A.hero && /caffeine/.test(A.hero.big) && x.built.caffeine.doseMg < 10) res.issues.push({ cls: 'wrong hero', where: id, text: `${A.hero.big} (${Math.round(x.built.caffeine.doseMg)} mg in it)` });
    if (!alcoholic && x.macros.availCarbs >= 10 && x.glucose === undefined) res.issues.push({ cls: 'no sugar story for a carb food', where: id, text: `${Math.round(x.macros.availCarbs)} g of carbohydrate` });
    if (!alcoholic && x.macros.sugars >= 15 && x.glucose !== undefined && A.hero && !/Blood sugar/.test(A.hero.big) && x.built.caffeine.doseMg < 100) res.issues.push({ cls: 'wrong hero', where: id, text: `${A.hero.big} for ${Math.round(x.macros.sugars)} g of sugar` });
    if (!alcoholic && /Starch/.test(allText) && !hasStarch(x.macros)) res.issues.push({ cls: 'card that does not fit the food', where: id, text: 'a starch card' });
    if (parts.length === 1 && sharedBaseName(parts[0].food.name) && !A.name.toLowerCase().includes(distinctName(parts[0].food.name).toLowerCase())) res.issues.push({ cls: 'generic name', where: id, text: `${A.name} (${parts[0].food.name})` });
    if (parts.length === 1 && parts[0].food.base?.builder && parts[0].food.on && !/ with | without /.test(A.name) && A.name.toLowerCase().replace(/^\S+ /, '') === parts[0].food.base.name.replace(/\s*\(.*\)$/, '').split(' / ')[0].toLowerCase()) res.issues.push({ cls: 'generic name', where: id, text: `${A.name} for ${parts[0].food.name}` });
    res.dump.push(`  end card: ${A.name}${A.hero ? ` · hero ${A.hero.big} (${A.hero.small})` : ' · (no hero number)'}`);
    for (const n of A.notes) { res.dump.push(`    ${n}`); res.issues.push(...lintText(n.replace(/^[^:]+: /, ''), `${id} end note`, 'note')); }
    res.dump.push(`  YouTube title: ${A.caps.shorts.title}`, `  TikTok: ${A.caps.tiktok.split('\n')[0]}`, `  tags: ${(A.caps.tiktok.match(/#\w+/g) ?? []).join(' ')}`);
    res.issues.push(...lintText(A.caps.shorts.title, `${id} title`, 'title'));
    if (A.caps.shorts.title.length > 100) res.issues.push({ cls: 'title too long', where: id, text: A.caps.shorts.title });
    const tag = foodTag(A.name), words = nameWords(A.name.replace(/\s+with\s+.*$/i, ''));
    if (GENERIC_TAGS.has(tag) && words.length >= 2) res.issues.push({ cls: 'generic hashtag', where: id, text: `#${tag} for ${A.name}` });
  }
  lastTpl.A = tplA; lastTpl.B = tplB;
}

const lastTpl: { A: Map<string, string[]>; B: Map<string, string[]> } = { A: new Map(), B: new Map() };
/** v19: the voiceover scripts (numbers taken out), counted over every video: no script on more than 10 % of them. */
const scripts = new Map<string, string[]>();
const countScript = (lines: string[], id: string) => { const k = lines.join(' | ').replace(/\d+(?:[.,]\d+)?/g, 'N'); scripts.set(k, [...(scripts.get(k) ?? []), id]); };
export function scriptRepeats(res: AuditResult, max = 0.1) {
  const n = [...scripts.values()].reduce((a, b) => a + b.length, 0);
  const top = [...scripts.entries()].sort((p, q) => q[1].length - p[1].length).slice(0, 5);
  res.dump.splice(0, 0, '', `=== voiceover scripts: ${scripts.size} different over ${n} videos, the most used`, ...top.map(([k, ids]) => `  ${ids.length}× ${k}`));
  for (const [k, ids] of top) if (ids.length > max * n) res.issues.push({ cls: 'voiceover script overused', where: 'voice', text: `${ids.length}/${n}: ${k}` });
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
        const champ = /^🏆 (.+?) wins?:/.exec(o.cp.verdict)?.[1];
        const champX = champ === undefined ? undefined : [pr.a, pr.b].find((x) => x.label === champ);
        if (champX && isTreat(champX)) res.issues.push({ cls: 'trophy for a treat', where, text: o.cp.verdict });
        res.issues.push(...trophyIssues(o.cp.verdict, pr.a, pr.b, where)); // (master audit 2026-11-12, C1)
        for (const x of [pr.a, pr.b]) if (servingAmount(x).length > 16) res.issues.push({ cls: 'serving label too long', where, text: servingAmount(x) });
        // one tie rule for all the verdict text: an answer that names a winner never sits next to "It's close"
        if (g && !/^Almost the same/.test(g.answer1) && /^It’s close/.test(o.cp.verdict)) res.issues.push({ cls: 'contradiction', where, text: `${g.recap} / ${o.cp.verdict}` });
        if (g && /^Almost the same/.test(g.answer1) && /^🏆/.test(o.cp.verdict) && new RegExp(g.kind === 'sugarG' ? 'sugar' : g.kind === 'kcal' ? 'kcal' : '^$').test(o.cp.verdict)) res.issues.push({ cls: 'contradiction', where, text: `${g.recap} / ${o.cp.verdict}` });
      }
      if (!g) res.issues.push({ cls: 'compare without a guess', where, text: o.hook });
      // round 18b: the answer is revealed at 55 % of the video or later (REVEAL_FROM), in every cut
      const pkT = o.cp.plan.cues.find((c) => c.kind === 'peak')?.t;
      if (g && (pkT === undefined || pkT < REVEAL_FROM * o.cp.plan.seconds - 1 / FPS)) res.issues.push({ cls: 'answer revealed too early', where, text: `${pkT === undefined ? 'no answer' : (pkT / o.cp.plan.seconds * 100).toFixed(0) + ' %'} (${o.cp.plan.stops.join(', ')})` });
      if (!o.cp.plan.stops.some((m) => m >= 60 && m < 1440)) res.issues.push({ cls: 'compare without a middle', where, text: o.cp.plan.stops.join(', ') });
      let prevA = -1, prevB = -1;
      for (const pg of o.cp.plan.pages) {
        if (pg.text && /^(It|They|These|Then|This|That)\b/.test(pg.text) && prevA !== pg.stop) res.issues.push({ cls: 'pronoun without its noun', where: `${where} A ${hm(pg.stop)}`, text: pg.text });
        if (pg.textB && /^(It|They|These|Then|This|That)\b/.test(pg.textB) && prevB !== pg.stop) res.issues.push({ cls: 'pronoun without its noun', where: `${where} B ${hm(pg.stop)}`, text: pg.textB });
        if (pg.text) prevA = pg.stop; if (pg.textB) prevB = pg.stop;
      }
      const tA = new Map<number, string | undefined>(), tB = new Map<number, string | undefined>();
      for (const f of o.cp.plan.frames) if (f.stop !== undefined && f.beat === 'hold') { if (f.title && !tA.has(f.stop)) tA.set(f.stop, f.title); if (f.titleB && !tB.has(f.stop)) tB.set(f.stop, f.titleB); }
      if (cut === 'long') res.dump.push(`  long (${o.cp.plan.seconds.toFixed(1)} s):`);
      for (const pg of o.cp.plan.pages) {
        if (cut === 'long') res.dump.push(`    ${hm(pg.stop).padEnd(7)} ${pg.text || '—'}  ||  ${pg.textB || '—'}`);
        for (const t of [pg.text, pg.textB ?? '']) if (t) res.issues.push(...lintText(t, `${where} ${hm(pg.stop)}`, 'card'));
        for (const [t, x] of [[pg.text, pr.a], [pg.textB ?? '', pr.b]] as const) if (t && x.macros.sugarSource && naturalAsTeaspoons(t)) res.issues.push({ cls: 'natural sugar as teaspoons', where: `${where} ${hm(pg.stop)}`, text: t });
      }
      // the guessed number is not said before the answer (both sides alike)
      if (g && ['sugarG', 'kcal', 'alcohol'].includes(g.kind)) {
        const re = g.kind === 'sugarG' ? /\d+ g of sugar|teaspoons? of sugar/ : g.kind === 'kcal' ? /\d+ kcal/ : /\d+ g of alcohol/;
        const reveal = o.cp.plan.cues.find((c) => c.kind === 'peak')?.t ?? Infinity;
        const early = o.cp.plan.frames.find((f) => f.t + 0.01 < reveal && (re.test(f.cap ?? '') || re.test(f.capB ?? '')));
        if (early) res.issues.push({ cls: 'answer said before the reveal', where, text: `${early.cap ?? ''} || ${early.capB ?? ''}` });
      }
      for (const [st, t] of tA) res.issues.push(...lintMoment(t, st, pr.a.built.story.chapters, `${where} A`));
      const nin = compareNarrIn(pr.a, pr.b, o.cp), vo = narrationFor(nin);
      for (const i of lintNarration(vo, nin)) res.issues.push({ cls: i.cls, where: `${where} voice`, text: i.text });
      if (cut === 'long') res.dump.push(`  voice: ${vo.map((l) => `[${l.t.toFixed(1)} s] ${l.text}`).join('  ')}`);
      if (cut === 'long') countScript(vo.map((l) => l.text), pr.id);
      for (const [st, t] of tB) res.issues.push(...lintMoment(t, st, pr.b.built.story.chapters, `${where} B`));
    }
  }
}

export function runAudit(nPairs = 300): AuditResult {
  const res: AuditResult = { issues: [], dump: [] };
  const items = auditItems();
  auditSingles(items, res);
  // (round 18, critic T-7) no hook template on more than 10 % of the items
  res.dump.splice(0, 0, '', '=== hook templates (A / B), the most used');
  for (const [v, m] of [['A', lastTpl.A], ['B', lastTpl.B]] as const) {
    const top = [...m.entries()].sort((p, q) => q[1].length - p[1].length).slice(0, 8);
    res.dump.splice(2, 0, ...top.map(([t, ids]) => `  ${v} ${ids.length}× ${t}`));
    for (const [t, ids] of top) if (ids.length > 0.1 * items.length) res.issues.push({ cls: 'hook template overused', where: `hook ${v}`, text: `${ids.length}/${items.length}: ${t}` });
  }
  auditCompares(auditPairs(items, nPairs), res);
  scriptRepeats(res);
  scripts.clear();
  return res;
}
