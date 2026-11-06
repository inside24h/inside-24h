// v21c (coordinator review 2026-11-06: "gap-filler lines must be data-specific to the item, never generic"): the short
// lines the voiceover says between the story cards. Each is a fact of this food from the model (its calories, sugar,
// protein, fat, fiber, alcohol, caffeine, water, grams), said in one of several ways (the video's seed picks), so no
// wording is heard on more than a few videos. A comparison's facts name their side ("Muffin: 9 g of fat …").
import type { Macros } from './food/parse';

export interface FactIn {
  kcal: number; macros?: Macros | null; alcoholG?: number; caffeineMg?: number; waterMl?: number; /** half out of the stomach (min) */ t50?: number;
  /** a drink (ml) or a food (g) */ drink?: boolean;
}

const pick = <T,>(xs: readonly T[], seed: number, salt: number) => {
  let h = Math.imul((seed >>> 0) ^ Math.imul(salt + 7, 0x9e3779b1), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return xs[((h ^ (h >>> 16)) >>> 0) % xs.length];
};
const r = (x: number) => Math.round(x);

/** Each fact's wordings ({n}: its number, {t}: teaspoons). */
export const FACT_WORDINGS = {
  kcal: ['That is {n} kcal of energy.', '{n} kcal on board.', 'Energy in: {n} kcal.', '{n} kcal for your body to use.', 'All told, {n} kcal.',
    '{n} kcal, put to work slowly.', 'Your body gets {n} kcal from it.', 'In energy terms: {n} kcal.', '{n} kcal, heading for your cells.', 'Fuel count: {n} kcal.',
    '{n} kcal to burn or store.', 'Calories in it: {n} kcal.'],
  sugar: ['{n} g of sugar, about {t} teaspoons.', 'Sugar in it: {n} g.', '{t} teaspoons of sugar in there.', '{n} g of sugar reaches your gut.', 'The sugar: {n} g.',
    'Sugar count: {n} g.', '{n} g of it is sugar.', 'About {t} teaspoons of sugar, all told.', 'Inside: {n} g of sugar.', 'Sweet part: {n} g of sugar.'],
  protein: ['{n} g of protein to take apart.', 'Protein: {n} g, in building blocks.', '{n} g of protein, arriving slowly.', '{n} g of protein on its way.', 'Protein count: {n} g.',
    'Inside: {n} g of protein.', '{n} g of protein to digest.', 'The protein: {n} g.', '{n} g of protein, piece by piece.', 'Building blocks: {n} g of protein.'],
  fat: ['{n} g of fat, the slow part.', 'Fat: {n} g, and it takes its time.', '{n} g of fat slows things down.', 'The fat: {n} g.', '{n} g of fat, headed for the lymph.',
    'Fat count: {n} g.', 'Inside: {n} g of fat.', '{n} g of fat, last to leave.', '{n} g of fat to split with bile.', 'Slowest part: {n} g of fat.'],
  fiber: ['{n} g of fiber, food for your gut bacteria.', 'Fiber: {n} g, it stays longest.', '{n} g of fiber moves on slowly.', '{n} g of fiber, untouched until your colon.', 'The fiber: {n} g.',
    'Fiber count: {n} g.', '{n} g of fiber, a feast for gut bacteria.', 'Inside: {n} g of fiber.'],
  alcohol: ['{n} g of pure alcohol for your liver.', 'Pure alcohol in it: {n} g.', 'Your liver has {n} g of alcohol to clear.', 'That is {n} g of pure alcohol.', 'Alcohol count: {n} g.',
    '{n} g of alcohol, all through your liver.', 'Inside: {n} g of pure alcohol.', 'The alcohol: {n} g.'],
  caffeine: ['{n} mg of caffeine on board.', 'Caffeine in it: {n} mg.', '{n} mg of caffeine, heading for your brain.', 'That is {n} mg of caffeine.', 'Caffeine count: {n} mg.',
    'Your brain gets {n} mg of caffeine.', 'Inside: {n} mg of caffeine.', 'The caffeine: {n} mg.'],
  water: ['{n} ml of water to handle.', '{n} ml of fluid for your kidneys.', 'Water in it: {n} ml.', '{n} ml of water, absorbed fast.', 'The water: {n} ml.',
    'Fluid count: {n} ml.', 'Inside: {n} ml of water.', 'Your kidneys get {n} ml of water.'],
  grams: ['{n} g of food to break down.', '{n} g in your stomach to start.', 'All {n} g of it, inside you.', 'The whole thing: {n} g.', '{n} g for your gut to handle.',
    'Weight in: {n} g.', '{n} g, bite by bite.', 'Your stomach takes {n} g.'],
  lowKcal: ['Almost no energy: {n} kcal.', 'Barely any energy: {n} kcal.', 'Only {n} kcal in it.', 'Energy: just {n} kcal.', '{n} kcal, next to nothing.'],
  lowCaffeine: ['Only {n} mg of caffeine.', 'A trace of caffeine: {n} mg.', 'Caffeine: just {n} mg.', '{n} mg of caffeine, a trace.'],
  sodium: ['{n} mg of sodium for your kidneys.', 'Sodium in it: {n} mg.', 'The salty side: {n} mg of sodium.', '{n} mg of sodium to balance.', 'Inside: {n} mg of sodium.'],
  carbs: ['{n} g of carbs, most of it turned into glucose.', 'Carbs in it: {n} g.', '{n} g of carbs to digest.', 'All the carbs: {n} g.', '{n} g of carbs, fuel for later.', 'Inside: {n} g of carbs.'],
  satFat: ['{n} g of it is saturated fat.', 'Saturated fat: {n} g.', '{n} g of saturated fat inside.', 'The saturated part: {n} g.'],
  stomach: ['Half leaves the stomach in about {n} minutes.', 'Stomach time: half is out in {n} minutes.', 'About {n} minutes until half moves on.', 'Half is through in {n} minutes.'],
} as const;
export type FactKind = keyof typeof FACT_WORDINGS;
/** v21c: the short forms, said only where a longer wording does not fit (between two close cards). */
export const FACT_SHORT: Record<FactKind, readonly string[]> = {
  kcal: ["That's {n} kcal.", '{n} kcal in all.', 'Energy: {n} kcal.', '{n} kcal, total.', 'All in: {n} kcal.', '{n} kcal inside.', 'It brings {n} kcal.'],
  sugar: ['{n} g of sugar.', 'Sugar: {n} g.', '{n} g of sugar, total.', 'It has {n} g of sugar.', '{n} g of sugar inside.', 'Sugar, {n} g.'],
  protein: ['{n} g of protein.', 'Protein: {n} g.', '{n} g of protein, total.', 'It has {n} g of protein.', '{n} g of protein inside.', 'Protein, {n} g.'],
  fat: ['{n} g of fat.', 'Fat: {n} g.', '{n} g of fat, total.', 'It has {n} g of fat.', '{n} g of fat inside.', 'Fat, {n} g.'],
  fiber: ['{n} g of fiber.', 'Fiber: {n} g.', '{n} g of fiber, total.', 'It has {n} g of fiber.', '{n} g of fiber inside.'],
  alcohol: ['{n} g of alcohol.', 'Alcohol: {n} g.', '{n} g of alcohol, total.', 'It has {n} g of alcohol.', '{n} g of alcohol inside.'],
  caffeine: ['{n} mg of caffeine.', 'Caffeine: {n} mg.', '{n} mg of caffeine, total.', 'It has {n} mg of caffeine.', '{n} mg of caffeine inside.'],
  water: ['{n} ml of water.', 'Water: {n} ml.', '{n} ml of fluid.', 'It brings {n} ml of water.', '{n} ml of water inside.'],
  grams: ['{n} g in all.', 'Weight: {n} g.', '{n} g of food.', 'It weighs {n} g.', '{n} g, all told.'], lowKcal: ['Only {n} kcal.', 'Just {n} kcal.'], lowCaffeine: ['{n} mg of caffeine.', 'Caffeine: {n} mg.'],
  sodium: ['{n} mg of sodium.', 'Sodium: {n} mg.', 'It has {n} mg of sodium.'], carbs: ['{n} g of carbs.', 'Carbs: {n} g.', 'It has {n} g of carbs.', '{n} g of carbs inside.'],
  satFat: ['{n} g saturated fat.', 'Saturated: {n} g.', '{n} g of it saturated.'], stomach: ['Half out in {n} minutes.', 'Half gone in {n} minutes.', 'Half through in {n} minutes.', '{n} minutes, half out.'],
};

/** The facts of one food, one wording each (by seed), most telling first; `name` prefixes them (a comparison). */
export function factLines(f: FactIn, seed: number, name = ''): string[] {
  const m = f.macros, out: [FactKind, number, number?][] = [];
  if ((f.alcoholG ?? 0) >= 1) out.push(['alcohol', r(f.alcoholG!)]);
  if ((f.caffeineMg ?? 0) >= 10) out.push(['caffeine', r(f.caffeineMg!)]);
  if (m && m.sugars >= 3) out.push(['sugar', r(m.sugars), Math.max(1, r(m.sugars / 4.2))]);
  if (m && m.protein >= 5) out.push(['protein', r(m.protein)]);
  if (m && m.fat >= 5) out.push(['fat', r(m.fat)]);
  if (m && m.fiber >= 2) out.push(['fiber', r(m.fiber)]);
  if (m && m.availCarbs >= 5 && m.availCarbs - m.sugars >= 3) out.push(['carbs', r(m.availCarbs)]);
  if (m && m.satFat >= 2) out.push(['satFat', r(m.satFat)]);
  if (f.kcal >= 20) out.push(['kcal', r(f.kcal)]); else if (f.kcal >= 1) out.push(['lowKcal', r(f.kcal)]);
  if ((f.caffeineMg ?? 0) >= 1 && (f.caffeineMg ?? 0) < 10) out.push(['lowCaffeine', r(f.caffeineMg!)]);
  if (m && m.sodiumMg >= 150) out.push(['sodium', r(m.sodiumMg)]);
  if ((f.t50 ?? 0) >= 5) out.push(['stomach', r(f.t50!)]);
  if (f.drink && (f.waterMl ?? 0) >= 100) out.push(['water', r(f.waterMl!)]);
  else if (!f.drink && m && m.grams >= 30) out.push(['grams', r(m.grams)]);
  const say = (w: string, n: number, t?: number) => { const x = w.replace('{n}', String(n)).replace('{t}', String(t ?? '')); return name ? `${name}: ${x.charAt(0).toLowerCase()}${x.slice(1)}` : x; };
  // (after a name, "Fish sticks: 12 g of protein …", never a second colon)
  const ok = (ws: readonly string[]) => (name ? ws.filter((w) => !w.includes(':')) : ws);
  return [...out.map(([k, n, t], i) => say(pick(ok(FACT_WORDINGS[k]), seed, 31 + i * 7), n, t)), ...out.map(([k, n, t], i) => say(pick(ok(FACT_SHORT[k]), seed, 77 + i * 5), n, t))];
}

/** The facts of an analysed food (analyze.ts), and of a comparison: both sides, taking turns, each named. */
export const factInOf = (x: { kcal: number; macros: Macros; built: { alcoholG?: number; caffeine: { doseMg: number }; waterMl?: number; story: { chapters: { title: string }[] } } }): FactIn =>
  ({ kcal: x.kcal, macros: x.macros, alcoholG: x.built.alcoholG, caffeineMg: x.built.caffeine.doseMg, waterMl: x.built.waterMl, t50: (x.built as { t50?: number }).t50, drink: !/bite/i.test(x.built.story.chapters[0]?.title ?? '') });
export function compareFacts(a: FactIn, b: FactIn, names: [string, string], seed: number): string[] {
  const fa = factLines(a, seed, names[0]), fb = factLines(b, seed + 1, names[1]), out: string[] = [];
  for (let i = 0; i < Math.max(fa.length, fb.length); i++) { if (fa[i]) out.push(fa[i]); if (fb[i]) out.push(fb[i]); }
  // (the shortest: the side instead of the name, "Left: 18 g of fat.", for a short pause between two cards)
  const sa = factLines(a, seed + 2, 'Left'), sb = factLines(b, seed + 3, 'Right');
  for (let i = Math.floor(sa.length / 2); i < Math.max(sa.length, sb.length); i++) { if (sa[i]) out.push(sa[i]); if (sb[i]) out.push(sb[i]); }
  return out;
}

/** v21c: a comparison's differences ("Butter has 12 g more fat."), said only after the answer (they would give the
 *  guess away). */
const DIFF = [['{a} has {d} {u} more {k}.', '{d} {u} more {k} in {a}.', 'More {k} in {a}, by {d} {u}.', '{a} carries {d} {u} more {k}.', 'The gap in {k}: {d} {u}, more in {a}.'],
  ['{a} has {d} more kcal.', '{d} kcal more in {a}.', '{a} brings {d} extra kcal.', 'The energy gap: {d} kcal, more in {a}.']] as const;
export function compareDiffs(a: FactIn, b: FactIn, names: [string, string], seed: number): string[] {
  const v = (f: FactIn) => ({ sugar: f.macros?.sugars ?? 0, fat: f.macros?.fat ?? 0, protein: f.macros?.protein ?? 0, fiber: f.macros?.fiber ?? 0, caffeine: f.caffeineMg ?? 0, alcohol: f.alcoholG ?? 0, kcal: f.kcal });
  const A = v(a), B = v(b), out: string[] = [];
  (['kcal', 'sugar', 'fat', 'protein', 'fiber', 'caffeine', 'alcohol'] as const).forEach((k, i) => {
    const d = Math.round(Math.abs(A[k] - B[k])), more = A[k] > B[k] ? names[0] : names[1];
    if (d < (k === 'kcal' ? 20 : k === 'caffeine' ? 10 : 2)) return;
    const w = k === 'kcal' ? pick(DIFF[1], seed, 50 + i) : pick(DIFF[0], seed, 50 + i);
    out.push(w.replace('{a}', more).replace('{d}', String(d)).replace('{u}', k === 'caffeine' ? 'mg' : 'g').replace('{k}', k).replace(/^./, (c) => c.toUpperCase()));
  });
  return out;
}

/** The template of a fact line (numbers and the name out), for the "no wording on more than 10 % of videos" lint. */
export const factTemplate = (line: string, names: readonly string[] = []) => {
  let s = line;
  for (const nm of names) if (nm) s = s.replace(new RegExp(`^${nm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*`, 'i'), '');
  return s.replace(/\d+(?:[.,]\d+)?/g, '#').toLowerCase();
};
