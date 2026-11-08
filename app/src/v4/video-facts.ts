// v21c (coordinator review 2026-11-06: "gap-filler lines must be data-specific to the item, never generic"): the short
// lines the voiceover says between the story cards. Each is a fact of this food from the model (its calories, sugar,
// protein, fat, fiber, alcohol, caffeine, water, grams), said in one of several ways (the video's seed picks), so no
// wording is heard on more than a few videos. A comparison's facts name their side ("Muffin: 9 g of fat …").
import type { Macros } from './food/parse';
import { ANY_GL, ATTENTION_GL, alcoholClock } from '../science/alcoholClock';
import { bacRange } from '../science/ranges';

export interface FactIn {
  kcal: number; macros?: Macros | null; alcoholG?: number; caffeineMg?: number; waterMl?: number; /** half out of the stomach (min) */ t50?: number;
  /** a drink (ml) or a food (g) */ drink?: boolean;
  /** v22, the model curves (per minute from the first sip): blood alcohol (g/L), blood sugar change (mg/dL), blood fat
   *  change (mmol/L); the caffeine model's peak minute and half-life; caffeine left at bedtime (mg), minutes to bed */
  bac?: ArrayLike<number>; glucose?: ArrayLike<number>; tg?: ArrayLike<number>;
  cafTmaxMin?: number; cafHalfLifeH?: number; cafAtBedMg?: number; toBedMin?: number;
  /** v22: this person's total body water (L, profile totalBodyWaterL) and weight (kg) */ bodyWaterL?: number; weightKg?: number;
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
  // v22: facts computed from the model runs (alcoholClock, the glucose, blood fat and caffeine curves), never typed in
  stdDrinks: ['That counts as {n} standard drink{s}.', 'In US terms: {n} standard drink{s}.', 'It adds up to {n} standard drink{s}.', 'By US math, {n} standard drink{s}.'],
  bacPeak: ['Blood alcohol tops out about {n} {u} in.', 'The highest level hits about {n} {u} in.', 'It crests about {n} {u} after the drink.', 'Peak level: about {n} {u} in.'],
  clearH: ['Your liver needs about {n} hours to clear it.', 'Clearing it takes your liver about {n} hours.', 'Your liver burns it off in about {n} hours.', 'About {n} hours of liver work to break it down.'],
  liverRate: ['Your liver handles about {n} g an hour, no faster.', 'Liver speed: roughly {n} g an hour.', 'About {n} g an hour: your liver will not rush.', 'Your liver works through about {n} g an hour.'],
  limitUS: ['At the top of its range, it passes the US limit of 0.08.', 'It can push past the US driving limit, 0.08.'],
  limitEU: ['At its peak, it can top the 0.05 limit used in much of Europe.', 'Its peak can pass Europe’s common 0.05 limit.'],
  reaction: ['At its peak, your reaction time slows.', 'Your reactions can slow at this peak.', 'Even this peak can slow your reactions.'],
  alcKcal: ['{n} % of its kcal come from the alcohol itself.', 'The alcohol alone brings {n} % of its kcal.', 'Empty energy: {n} % of its kcal are alcohol.'],
  bedAlcohol: ['Still in your blood at bedtime, so sleep turns restless.', 'It goes to bed with you: lighter, broken sleep.', 'Still there at bedtime: more wake-ups later in the night.'],
  sugarPeak: ['Blood sugar tops out about {n} {u} in.', 'The sugar spike crests about {n} {u} in.', 'Glucose hits its high about {n} {u} in.', 'Peak sugar: about {n} {u} in.'],
  sugarBack: ['Back to where it started after about {n} {u}.', 'Glucose settles again after about {n} {u}.', 'The spike has passed after about {n} {u}.'],
  sugarDip: ['Then insulin overshoots: a dip about {n} {u} in.', 'A dip below normal follows, about {n} {u} in.', 'About {n} {u} in, it dips: the energy slump.'],
  cafPeak: ['Caffeine peaks about {n} {u} in.', 'The caffeine high crests about {n} {u} in.', 'Full effect: about {n} {u} in.'],
  cafHalf: ['Half of it is still there after {n} hours.', 'Its half-life in you: about {n} hours.', 'It takes {n} hours to clear just half.'],
  cafBed: ['At bedtime, {n} % of it is still in you.', '{n} % is still working at bedtime.', 'Bedtime: {n} % of the caffeine is left.'],
  tgPeak: ['Blood fat peaks about {n} hours in.', 'The fat wave crests about {n} hours in.', 'Fat in your blood is highest about {n} hours in.'],
  fatKcal: ['{n} % of its kcal come from fat.', 'Fat brings {n} % of the energy.', 'By energy, it is {n} % fat.'],
  protKcal: ['{n} % of its energy is protein.', 'Protein makes up {n} % of its kcal.', 'By energy, {n} % protein.'],
  zeroKcal: ['Zero kcal: nothing for your body to burn.', 'No energy at all: zero kcal.', 'Not a single kcal to burn.'],
  absent: ['No {a}.', 'It has no {a}.', 'Inside: no {a}.'],
  density: ['{n} kcal in every 100 g.', 'Per 100 g, that is {n} kcal.', 'Energy density: {n} kcal per 100 g.'],
  bodyWater: ['Your body already holds about {n} liters of water.', 'You carry about {n} liters of water already.', 'About {n} liters of water are in you already.'],
  waterShare: ['It tops up your body water by {n} %.', 'That adds {n} % to the water in you.', 'Your body water rises by just {n} %.'],
  walk: ['About {n} minutes of brisk walking would burn it.', 'Walking it off takes about {n} minutes.', 'To burn it: roughly {n} minutes of brisk walking.'],
  flatSugar: ['Your glucose barely moves.', 'Glucose stays nearly flat.', 'Barely a blip in glucose.', 'Your glucose line stays almost flat.', 'No real glucose spike from this.', 'Glucose hardly rises at all.'],
  dvKcal: ['That is {n} % of a whole day of calories.', 'It covers {n} % of a day’s calories.', 'Of a full day’s energy, that is {n} %.'],
  dvSodium: ['That is {n} % of a day’s sodium limit.', 'It uses up {n} % of your daily sodium.', 'Salt check: {n} % of a day’s sodium.'],
  dvFiber: ['{n} % of the fiber you need in a day.', 'It covers {n} % of a day’s fiber.', 'A day’s fiber? This is {n} % of it.'],
  dvProtein: ['{n} % of the protein you need in a day.', 'It covers {n} % of your daily protein.', 'Protein for the day: {n} % done.'],
  dvSatFat: ['{n} % of a day’s saturated fat limit.', 'It uses {n} % of your daily saturated fat.', 'Saturated fat: {n} % of the daily limit.'],
  waterPct: ['{n} % of it is water.', 'It is {n} % water by weight.', 'Mostly water: {n} %.', 'Water makes up {n} % of it.', 'By weight, it is {n} % water.', 'Nearly all water: {n} %.'],
  gi: ['Its glycemic index: {n}, out of 100.', 'On the glycemic index, it scores {n}.', 'Glycemic index: {n} of 100.'],
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
  stdDrinks: ['{n} standard drink{s}.', 'That is {n} standard drink{s}.'], bacPeak: ['Alcohol peak: {n} {u} in.', 'Blood alcohol highest at {n} {u}.'],
  clearH: ['{n} hours to clear the alcohol.', 'Alcohol cleared in {n} hours.'], liverRate: ['Liver pace: {n} g an hour.', 'The liver clears {n} g an hour.'],
  limitUS: ['Past the US 0.08 limit.'], limitEU: ['Over Europe’s 0.05 limit.'], reaction: ['Slower reactions at the peak.'],
  alcKcal: ['{n} % of the kcal: alcohol.', 'Alcohol: {n} % of the kcal.'], bedAlcohol: ['Still in you at bedtime.'],
  sugarPeak: ['Glucose high: {n} {u} in.', 'Glucose peaks at {n} {u}.'], sugarBack: ['Glucose settled after {n} {u}.', 'Glucose back down after {n} {u}.'], sugarDip: ['Glucose dips at {n} {u}.', 'A glucose dip at {n} {u}.'],
  cafPeak: ['Caffeine peak: {n} {u} in.', 'Caffeine strongest at {n} {u}.'], cafHalf: ['Caffeine half-life: {n} hours.', 'Caffeine drops by half in {n} hours.'], cafBed: ['{n} % left at bedtime.', 'Bedtime: {n} % left.'],
  tgPeak: ['Fat peaks at {n} hours.', 'Blood fat high: {n} hours.'], fatKcal: ['{n} % of the kcal: fat.', 'Fat: {n} % of the kcal.'], protKcal: ['{n} % of the kcal: protein.', 'Protein: {n} % of the kcal.'],
  zeroKcal: ['Zero kcal.'], absent: ['No {a}.'], density: ['{n} kcal per 100 g.', 'Per 100 g: {n} kcal.'],
  bodyWater: ['You hold {n} liters of water.'], waterShare: ['Plus {n} % body water.'],
  walk: ['{n} minutes of walking.', 'Walk {n} minutes to burn it.', 'Just walking {n} minutes burns it.', 'Burned in a {n}-minute walk.', '{n} minutes on foot to burn it.', 'Walking time: {n} minutes.'],
  flatSugar: ['Glucose stays flat.', 'No glucose spike.', 'Glucose: barely a bump.', 'A flat glucose line.', 'Hardly any glucose rise.'],
  dvKcal: ['{n} % of a day’s calories.', '{n} % of your daily calories.', 'Daily calories: {n} % used.', 'That is {n} % of a day’s energy.'], dvSodium: ['{n} % of a day’s sodium.', 'Daily sodium: {n} %.', '{n} % of your sodium for the day.'], dvFiber: ['{n} % of a day’s fiber.', 'Daily fiber: {n} %.', '{n} % of your daily fiber.'], dvProtein: ['{n} % of a day’s protein.', 'Daily protein: {n} %.', '{n} % of your daily protein.', 'Protein for the day: {n} %.'], dvSatFat: ['{n} % of the saturated fat limit.'],
  waterPct: ['{n} % water.', 'It is {n} % water.', 'Water makes up {n} %.', '{n} % of it: water.', 'Mainly water, {n} %.', 'By weight, {n} % water.'], gi: ['Glycemic index {n}.', 'A glycemic index of {n}.'],
};

/** v22: the derived numbers of one food, from its model curves (exported for the "fact = model" test). Rounded as
 *  said: minutes to 5 (under 2 h), else hours to the half; percentages whole. */
export const halfH = (min: number) => Math.round(min / 30) / 2;
export const timeAt = (min: number): [number, string] => (min < 120 ? [Math.max(5, Math.round(min / 5) * 5), 'minutes'] : [halfH(min), 'hours']);
const argmaxV = (xs: ArrayLike<number>, n = xs.length) => xs[argmax(xs, n)];
const argmax = (xs: ArrayLike<number>, n = xs.length) => { let k = 0; for (let i = 1; i < Math.min(n, xs.length); i++) if (xs[i] > xs[k]) k = i; return k; };
export function derivedFacts(f: FactIn) {
  const m = f.macros, out: { kind: FactKind; n?: number; u?: string; a?: string }[] = [];
  const kcal = f.kcal;
  // alcohol (g/L curve, alcoholClock: typical body)
  if ((f.alcoholG ?? 0) >= 1) {
    const sd = Math.round((f.alcoholG! / STD_DRINK_G) * 2) / 2;
    if (sd >= 0.5) out.push({ kind: 'stdDrinks', n: sd });
    if (f.bac && f.bac.length > 60) {
      const c = alcoholClock(f.bac), [, hi] = bacRange(c.peak);
      if (hi >= US_LIMIT_GL) out.push({ kind: 'limitUS' }); else if (hi >= EU_LIMIT_GL) out.push({ kind: 'limitEU' }); else if (hi >= ATTENTION_GL) out.push({ kind: 'reaction' });
      if (c.peak > ANY_GL) { const [n, u] = timeAt(c.peakMin); out.push({ kind: 'bacPeak', n, u }); }
      if (c.goneMin >= 60) {
        out.push({ kind: 'liverRate', n: Math.round(f.alcoholG! / (c.goneMin / 60)) });
        out.push({ kind: 'clearH', n: halfH(c.goneMin) });
      }
      if (f.toBedMin !== undefined && f.toBedMin < c.goneMin && f.toBedMin > 0) out.push({ kind: 'bedAlcohol' });
    }
    if (kcal >= 20) { const p = Math.round((700 * f.alcoholG!) / kcal); if (p >= 25 && p <= 100) out.push({ kind: 'alcKcal', n: p }); }
  }
  // caffeine (the model's own peak minute and this person's half-life)
  // (a decaf too: its trace of caffeine follows the same clock)
  if ((f.caffeineMg ?? 0) >= 10 || (f.drink && (f.caffeineMg ?? 0) >= 0.1)) {
    if ((f.cafTmaxMin ?? 0) >= 5) { const [n, u] = timeAt(f.cafTmaxMin!); out.push({ kind: 'cafPeak', n, u }); }
    if ((f.cafHalfLifeH ?? 0) > 0) out.push({ kind: 'cafHalf', n: Math.round(f.cafHalfLifeH! * 2) / 2 });
    if (f.cafAtBedMg !== undefined && f.cafAtBedMg > 0 && f.caffeineMg! >= 10) out.push({ kind: 'cafBed', n: Math.min(100, Math.round((100 * f.cafAtBedMg) / f.caffeineMg!)) });
  }
  // blood sugar (mg/dL change, the first 10 h)
  if (f.glucose && f.glucose.length > 60) {
    const k = argmax(f.glucose, 600), pk = f.glucose[k];
    if (pk >= 5 && k >= 5) {
      const [n, u] = timeAt(k); out.push({ kind: 'sugarPeak', n, u });
      let back = -1; for (let i = k; i < Math.min(900, f.glucose.length); i++) if (f.glucose[i] <= 0.1 * pk) { back = i; break; }
      if (back > k) { const [n2, u2] = timeAt(back); out.push({ kind: 'sugarBack', n: n2, u: u2 }); }
      let lo = k; for (let i = k; i < Math.min(900, f.glucose.length); i++) if (f.glucose[i] < f.glucose[lo]) lo = i;
      if (f.glucose[lo] <= -5) { const [n3, u3] = timeAt(lo); out.push({ kind: 'sugarDip', n: n3, u: u3 }); }
    }
  }
  // blood fat (mmol/L change)
  if (f.tg && f.tg.length > 60 && m && m.fat >= 5) { const k = argmax(f.tg); if (f.tg[k] >= 0.05 && k >= 60) out.push({ kind: 'tgPeak', n: halfH(k) }); }
  if (m && kcal >= 20) {
    const pf = Math.round((900 * m.fat) / kcal), pp = Math.round((400 * m.protein) / kcal);
    if (m.fat >= 5 && pf >= 30 && pf <= 100) out.push({ kind: 'fatKcal', n: pf });
    if (m.protein >= 5 && pp >= 20 && pp <= 100) out.push({ kind: 'protKcal', n: pp });
  }
  if (kcal < 1 && f.drink) out.push({ kind: 'zeroKcal' });
  // shares of the US Daily Values (FDA: 2000 kcal, 2300 mg sodium, 28 g fiber, 50 g protein, 20 g saturated fat)
  const dv = (kind: FactKind, v: number, ref: number, min: number) => { const p = Math.round((100 * v) / ref); if (p >= min && p <= 300) out.push({ kind, n: p }); };
  dv('dvKcal', kcal, DV.kcal, 1);
  if (m) { dv('dvSodium', m.sodiumMg, DV.sodiumMg, 5); dv('dvFiber', m.fiber, DV.fiber, 5); dv('dvProtein', m.protein, DV.protein, 5); dv('dvSatFat', m.satFat, DV.satFat, 5); }
  // brisk walking, 3.5 MET (Compendium of Physical Activities), kcal/min = MET × 3.5 × kg / 200 (ACSM); not for alcohol
  if (kcal >= 5 && (f.weightKg ?? 0) > 20 && (f.alcoholG ?? 0) < 0.5) out.push({ kind: 'walk', n: Math.max(1, Math.round(kcal / ((WALK_MET * 3.5 * f.weightKg!) / 200))) });
  if (f.glucose && f.glucose.length > 60 && m && m.availCarbs < 5 && argmaxV(f.glucose, 600) < 5) out.push({ kind: 'flatSugar' });
  if (f.drink && (f.waterMl ?? 0) >= 100 && (f.bodyWaterL ?? 0) > 10 && (f.alcoholG ?? 0) < 0.5 && kcal < 60) {
    out.push({ kind: 'bodyWater', n: Math.round(f.bodyWaterL!) });
    const p = Math.round((f.waterMl! / (10 * f.bodyWaterL!)) * 10) / 10;
    if (p >= 0.1) out.push({ kind: 'waterShare', n: p });
  }
  if (!f.drink && m && m.grams >= 30 && kcal >= 1) out.push({ kind: 'density', n: Math.round((100 * kcal) / m.grams) });
  if (!f.drink && m && m.grams >= 30 && m.waterG / m.grams >= 0.5) out.push({ kind: 'waterPct', n: Math.round((100 * m.waterG) / m.grams) });
  if (m && m.gi !== null && m.availCarbs >= 5) out.push({ kind: 'gi', n: Math.round(m.gi) });
  // what it does not have (said without a number): two or three of sugar, alcohol, caffeine
  // ("no caffeine" only for none at all: a decaf has about 1 mg)
  const none = [m && m.sugars < 0.5 ? 'sugar' : '', f.drink && (f.alcoholG ?? 0) < 0.05 ? 'alcohol' : '', f.drink && (f.caffeineMg ?? 0) < 0.05 && !(m && m.caffeineMg >= 0.05) ? 'caffeine' : ''].filter(Boolean);
  if (none.length >= 2 || (none[0] === 'sugar' && !f.drink)) out.push({ kind: 'absent', a: none.join(', no ') });
  return out;
}
/** US standard drink: 14 g of pure alcohol (NIAAA); driving limits as blood alcohol in g/L: US 0.08 %, much of Europe 0.05 %. */
export const DV = { kcal: 2000, sodiumMg: 2300, fiber: 28, protein: 50, satFat: 20 } as const;
export const STD_DRINK_G = 14, US_LIMIT_GL = 0.8, EU_LIMIT_GL = 0.5, WALK_MET = 3.5;

/** The facts of one food, one wording each (by seed), most telling first; `name` prefixes them (a comparison). */
export function factLines(f: FactIn, seed: number, name = ''): string[] {
  const m = f.macros, out: [FactKind, number, number?][] = [];
  if ((f.alcoholG ?? 0) >= 1) out.push(['alcohol', r(f.alcoholG!)]);
  if ((f.caffeineMg ?? 0) >= 10) out.push(['caffeine', r(f.caffeineMg!)]);
  if (m && m.sugars >= 3) out.push(['sugar', r(m.sugars), Math.max(1, r(m.sugars / 4.2))]);
  if (m && m.protein >= 5) out.push(['protein', r(m.protein)]);
  if (m && m.fat >= 5) out.push(['fat', r(m.fat)]);
  if (m && m.fiber >= 2) out.push(['fiber', r(m.fiber)]);
  if (m && m.availCarbs >= 5 && m.availCarbs - m.sugars >= 3 && (f.alcoholG ?? 0) < 1) out.push(['carbs', r(m.availCarbs)]);
  if (m && m.satFat >= 2) out.push(['satFat', r(m.satFat)]);
  if (f.kcal >= 20) out.push(['kcal', r(f.kcal)]); else if (f.kcal >= 1) out.push(['lowKcal', r(f.kcal)]);
  if ((f.caffeineMg ?? 0) >= 0.5 && (f.caffeineMg ?? 0) < 10) out.push(['lowCaffeine', r(f.caffeineMg!)]);
  if (m && m.sodiumMg >= 150) out.push(['sodium', r(m.sodiumMg)]);
  if ((f.t50 ?? 0) >= 5) out.push(['stomach', r(f.t50!)]);
  if (f.drink && (f.waterMl ?? 0) >= 100) out.push(['water', r(f.waterMl!)]);
  else if (!f.drink && m && m.grams >= 30) out.push(['grams', r(m.grams)]);
  // v22: a light food has few big numbers: its small ones too (a pause needs a fact, never a generic line)
  if (m && out.length < 7) {
    const has = (k: FactKind) => out.some((o) => o[0] === k);
    if (!has('protein') && m.protein >= 1) out.push(['protein', r(m.protein)]);
    if (!has('fat') && m.fat >= 1) out.push(['fat', r(m.fat)]);
    if (!has('fiber') && m.fiber >= 1) out.push(['fiber', r(m.fiber)]);
    if (!has('carbs') && !has('sugar') && m.availCarbs >= 2 && (f.alcoholG ?? 0) < 1) out.push(['carbs', r(m.availCarbs)]);
    if (!has('sodium') && m.sodiumMg >= 20) out.push(['sodium', r(m.sodiumMg)]);
  }
  const say = (w: string, n: number, t?: number, u = '', a = '') => {
    const x = w.replace('{n}', String(n)).replace('{t}', String(t ?? '')).replace('{u}', u).replace('{s}', n === 1 ? '' : 's').replace('{a}', a);
    return name ? `${name}: ${/^[A-Z][A-Z]/.test(x) ? x : x.charAt(0).toLowerCase() + x.slice(1)}` : x;
  };
  // (after a name, "Fish sticks: 12 g of protein …", never a second colon)
  const ok = (ws: readonly string[]) => { const y = name ? ws.filter((w) => !w.includes(':')) : ws; return y.length ? y : ws.map((w) => w.replace(/:\s*/, ', ')); };
  // v22: the derived facts (from the model curves) come after the food's main numbers, the most telling first; each
  // in two wordings when it has a number (the planner says a fact once: no number twice), so a pause has a choice
  const dv = derivedFacts(f), lead = out.slice(0, 2), rest = out.slice(2);
  const main = [...lead.map(([k, n, t], i) => say(pick(ok(FACT_WORDINGS[k]), seed, 31 + i * 7), n, t)),
    ...dv.map((d, i) => say(pick(ok(FACT_WORDINGS[d.kind]), seed, 131 + i * 11), d.n ?? 0, undefined, d.u, d.a)),
    ...rest.map(([k, n, t], i) => say(pick(ok(FACT_WORDINGS[k]), seed, 45 + i * 7), n, t))];
  const alt = dv.filter((d) => d.n !== undefined).map((d, i) => { const ws = ok(FACT_WORDINGS[d.kind]); return say(ws[(ws.indexOf(pick(ws, seed, 131 + i * 11) as never) + 1) % ws.length], d.n!, undefined, d.u, d.a); });
  return [...main, ...out.map(([k, n, t], i) => say(pick(ok(FACT_SHORT[k]), seed, 77 + i * 5), n, t)),
    ...dv.flatMap((d, i) => (d.n === undefined ? [] : [say(pick(ok(FACT_SHORT[d.kind]), seed, 177 + i * 5), d.n, undefined, d.u, d.a)])), ...alt.filter((x) => !main.includes(x))];
}

/** The facts of an analysed food (analyze.ts), and of a comparison: both sides, taking turns, each named. */
export const factInOf = (x: { kcal: number; macros: Macros; glucose?: ArrayLike<number>; caffeineAtBedMg?: number; toBedMin?: number; bodyWaterL?: number; waterMl?: number; weightKg?: number;
  built: { alcoholG?: number; bac?: ArrayLike<number>; effects?: { tgMmol?: ArrayLike<number> }; caffeine: { doseMg: number; tmaxMin?: number; halfLifeH?: number }; waterMl?: number; story: { chapters: { title: string }[] } } }): FactIn =>
  ({ kcal: x.kcal, macros: x.macros, alcoholG: x.built.alcoholG, caffeineMg: x.built.caffeine.doseMg, waterMl: x.waterMl ?? x.built.waterMl, t50: (x.built as { t50?: number }).t50, drink: !/bite/i.test(x.built.story.chapters[0]?.title ?? ''),
    bac: x.built.bac, glucose: x.glucose, tg: x.built.effects?.tgMmol, cafTmaxMin: x.built.caffeine.tmaxMin, cafHalfLifeH: x.built.caffeine.halfLifeH, cafAtBedMg: x.caffeineAtBedMg, toBedMin: x.toBedMin, bodyWaterL: x.bodyWaterL, weightKg: x.weightKg });
/** v22: a comparison's contrasts, both sides in one line ("Fat: cod 2 g, muffin 29 g."), the biggest gaps first. */
const CONTRAST = ['{K}: {a} {x} {u}, {b} {y} {u}.', '{K} check: {a} {x} {u}, {b} {y} {u}.', '{a} has {x} {u} of {k}, {b} {y} {u}.'] as const;
export function compareContrasts(a: FactIn, b: FactIn, names: [string, string], seed: number): string[] {
  const v = (f: FactIn) => ({ sugar: f.macros?.sugars ?? 0, fat: f.macros?.fat ?? 0, protein: f.macros?.protein ?? 0, fiber: f.macros?.fiber ?? 0, caffeine: f.caffeineMg ?? 0, alcohol: f.alcoholG ?? 0, kcal: f.kcal });
  const A = v(a), B = v(b), low = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
  const rows = (['kcal', 'sugar', 'fat', 'protein', 'fiber', 'caffeine', 'alcohol'] as const).map((k) => {
    const x = Math.round(A[k]), y = Math.round(B[k]), big = Math.max(x, y);
    const minGap = { kcal: 50, sugar: 5, fat: 5, protein: 5, fiber: 3, caffeine: 20, alcohol: 5 }[k];
    return { k, x, y, r: Math.abs(x - y) < minGap ? 0 : (big - Math.min(x, y)) / big };
  }).filter((q) => q.r >= 0.3).sort((p, q) => q.r - p.r);
  return rows.map(({ k, x, y }, i) => {
    const u = k === 'kcal' ? 'kcal' : k === 'caffeine' ? 'mg' : 'g', w = k === 'kcal' ? pick(['Energy: {a} {x} {u}, {b} {y} {u}.', '{a} brings {x} {u}, {b} {y} {u}.'], seed, 90 + i) : pick(CONTRAST, seed, 90 + i);
    // (a side with none: "Sugar: cod none, muffin 57 g.")
    const w0 = x === 0 || y === 0 ? '{K}: {a} {x} {u}, {b} {y} {u}.' : w;
    const s = w0.replace(/\{x\} \{u\}/, x === 0 ? 'none' : '{x} {u}').replace(/\{y\} \{u\}/, y === 0 ? 'none' : '{y} {u}').replace('{K}', k.charAt(0).toUpperCase() + k.slice(1)).replace('{k}', k).replace('{x}', String(x)).replace('{y}', String(y)).replace(/\{u\}/g, u).replace('{b}', low(names[1]));
    return s.startsWith('{a}') ? s.replace('{a}', names[0]) : s.replace('{a}', low(names[0]));
  });
}
export function compareFacts(a: FactIn, b: FactIn, names: [string, string], seed: number): string[] {
  const fa = factLines(a, seed, names[0]), fb = factLines(b, seed + 1, names[1]), out: string[] = [...compareContrasts(a, b, names, seed)];
  for (let i = 0; i < Math.max(fa.length, fb.length); i++) { if (fa[i]) out.push(fa[i]); if (fb[i]) out.push(fb[i]); }
  // (the shortest: the side instead of the name, "Left: 18 g of fat.", for a short pause between two cards)
  const sa = factLines(a, seed + 2, 'Left'), sb = factLines(b, seed + 3, 'Right');
  // (v22: every short one, five words or fewer, so a tight pause has a choice)
  const short = (x: string) => x.split(/\s+/).length <= 5;
  for (let i = 0; i < Math.max(sa.length, sb.length); i++) { if (sa[i] && short(sa[i])) out.push(sa[i]); if (sb[i] && short(sb[i])) out.push(sb[i]); }
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

// v23 (editor review 2026-11-07: "accurate, but it reads like a list of facts"): an editorial story arc per item class.
// setup (what is inside, one striking number) → rising tension (the cards, said in the present tense) → climax (the
// peak) → twist (a myth-buster or a surprise from the model) → payoff (the hook answered, timed from the first sip) →
// a loop line that sets up a rewatch. Every number below comes from the model (derivedFacts, the macros); alcohol is
// never framed as good; American English.
export type ArcClass = 'alcohol' | 'sugar' | 'starch' | 'caffeine' | 'fat' | 'meal' | 'drink' | 'water';
export interface Arc {
  cls: ArcClass;
  /** the hook's curiosity line (a statement said between the food and the hook card's question): counter-intuitive,
   *  numeric or personal; honest (each only when the model backs it) */ hook: string[];
  /** the striking number, said right after the hook */ setup: string[];
  /** the surprise after the climax (a myth-buster, a hidden cost) */ twist: string[];
  /** the closing line when the end card's number cannot be said (number-free, never a restatement) */ answer: string[];
  /** the loop line: sets up the rewatch (5 words at most) */ loop: string[];
  /** v23b: the answer to "how fast does it hit?": the model's peak, timed from the first sip (and its short form, said
   *  after the peak card: "About 25 minutes after the first sip.") */ fast?: string; fastShort?: string;
}
/** The class an item's story is told as (the hook, the twist and the close follow it). */
export function arcClass(f: FactIn): ArcClass {
  const m = f.macros, k = Math.max(1, f.kcal);
  if ((f.alcoholG ?? 0) >= 1) return 'alcohol';
  if (f.drink && f.kcal < 20 && (f.caffeineMg ?? 0) < 40) return 'water';
  if ((f.caffeineMg ?? 0) >= 40 && !(m && m.sugars >= 20)) return 'caffeine';
  if (m && m.sugars >= 8 && m.sugars >= 0.6 * Math.max(1, m.availCarbs) && (4 * m.sugars) / k >= 0.35) return 'sugar';
  if (m && m.availCarbs >= 15 && m.sugars < 0.4 * m.availCarbs && (4 * m.availCarbs) / k >= 0.45) return 'starch';
  if (m && (m.fat >= 5 || m.protein >= 10) && (9 * m.fat + 4 * m.protein) / k >= 0.6) return 'fat';
  // (a product without its macros here, a can of cola: its own glucose curve tells a sugar story)
  if (!m && f.kcal >= 50 && derivedFacts(f).some((x) => x.kind === 'sugarPeak')) return 'sugar';
  if (!f.drink && f.kcal >= 300) return 'meal';
  return f.drink ? 'drink' : 'meal';
}
const ARC_LOOP: Record<ArcClass, readonly string[]> = {
  alcohol: ['Now watch the peak again.', 'Back to the first sip.', 'Rewatch: spot the peak.'],
  sugar: ['Now watch the spike again.', 'Rewatch: spot the spike.', 'Back to the first sip.'],
  starch: ['Rewatch: spot the spike.', 'Now watch the starch again.', 'Back to the first bite.'],
  caffeine: ['Now watch it hit again.', 'Rewatch: spot the peak.', 'Back to the first sip.'],
  fat: ['Now watch the slow part.', 'Rewatch: follow the fat.', 'Back to the first bite.'],
  meal: ['Back to the first bite.', 'Now watch it again.', 'Rewatch: follow the meal.'],
  drink: ['Back to the first sip.', 'Now watch it again.', 'Rewatch: follow the sip.'],
  water: ['Rewatch: follow the water.', 'Back to the first sip.', 'Now watch it again.'],
};
/** The arc lines of one food (single videos). */
export function arcFor(f: FactIn, seed: number): Arc {
  const cls = arcClass(f), m = f.macros, dv = derivedFacts(f), d = (k: FactKind) => dv.find((x) => x.kind === k);
  const rot = (xs: string[], salt: number) => { if (xs.length < 2) return xs; const k = pick(xs.map((_, i) => i), seed, salt); return [...xs.slice(k), ...xs.slice(0, k)]; };
  const at = (x?: { n?: number; u?: string }) => (x?.n !== undefined ? `about ${x.n} ${x.u ?? 'hours'} in` : '');
  const hook: string[] = [], setup: string[] = [], twist: string[] = [], answer: string[] = [];
  const g = r(f.alcoholG ?? 0), sd = d('stdDrinks'), rate = d('liverRate'), walk = d('walk'), gi = d('gi');
  if (cls === 'alcohol') {
    // (no number here: the setup right after says it, "1 standard drink: 16 g, 127 kcal.")
    hook.push("Your liver can't rush it.", 'Feeling fine? Your blood may disagree.', "You'll feel sober before you are.");
    // (no "alcohol" here: the hook's question and the peak card say it; a word said a third time in 15 s is swapped out)
    if (sd?.n !== undefined) setup.push(`${sd.n} standard drink${sd.n === 1 ? '' : 's'}: ${g} g, ${r(f.kcal)} kcal.`, `${sd.n} standard drink${sd.n === 1 ? '' : 's'}: ${g} g for your liver.`, `${sd.n} standard drink${sd.n === 1 ? '' : 's'}: ${g} g.`);
    setup.push(`That's ${g} g your liver must clear.`, `${g} g for your liver to clear.`);
    if (sd?.n !== undefined) setup.push(`${sd.n} standard drink${sd.n === 1 ? '' : 's'}.`);
    twist.push("Coffee won't sober you up. Only time does.");
    if (rate?.n) twist.push(`Coffee won't help: your liver clears about ${rate.n} g an hour.`, `Nothing speeds it up: about ${rate.n} g an hour, no faster.`);
    if (d('bedAlcohol')) twist.push('It goes to bed with you: lighter, broken sleep.');
    answer.push('Feeling fine is not the same as sober.', 'One drink, hours of liver work.', 'Sober takes time.');
  } else {
    const sp = d('sugarPeak'), dip = d('sugarDip'), tg = d('tgPeak'), ch = d('cafHalf'), cp = d('cafPeak'), cb = d('cafBed'), bw = d('bodyWater'), ws = d('waterShare');
    const sug = m ? r(m.sugars) : 0, tsp = Math.max(1, r(sug / 4.2)), carbs = m ? r(m.availCarbs) : 0;
    if (cls === 'sugar') {
      if (dip) hook.push('Then comes the crash.');
      if (sp) hook.push(`Watch your blood sugar ${at(sp)}.`);
      hook.push('No chewing, no waiting: it hits fast.');
      if (sug >= 1) setup.push(`${sug} g of sugar, about ${tsp} teaspoons.`);
      if (walk?.n) twist.push(`Burning it off takes about ${walk.n} minutes of brisk walking.`, `Walking it off: about ${walk.n} minutes.`);
      if (dip) twist.push(`The twist: ${at(dip)}, it dips below where it started.`);
      if (sug >= 8) answer.push('Your blood felt every teaspoon.');
      if (sp?.u === 'minutes') answer.push('That sugar hit your blood within minutes.');
    } else if (cls === 'starch') {
      hook.push("It isn't sweet, but it turns into sugar.");
      if (sp) hook.push(`Watch your blood sugar ${at(sp)}.`);
      setup.push(`${carbs} g of carbs, most of it turned into glucose.`);
      if (gi?.n) twist.push(`Not sweet at all, yet its glycemic index is ${gi.n}.`);
      if (walk?.n) twist.push(`Burning it off takes about ${walk.n} minutes of brisk walking.`);
    } else if (cls === 'caffeine') {
      if (cp) hook.push(`You'll feel it ${at(cp)}.`);
      if (ch?.n) hook.push(`Half is still in you after ${ch.n} hours.`);
      setup.push(`${r(f.caffeineMg ?? 0)} mg of caffeine, heading for your brain.`);
      if (ch?.n) twist.push(`The catch: half of it is still in you after ${ch.n} hours.`);
      if (cb?.n) twist.push(`At bedtime, ${cb.n} % of it is still working.`);
      answer.push('Remember that at bedtime.');
    } else if (cls === 'fat') {
      if (tg?.n) hook.push(`Its fat peaks ${tg.n} hours later.`);
      hook.push('Your body takes it apart slowly.');
      if (m && m.fat >= 5) setup.push(`${r(m.fat)} g of fat, the slowest part.`);
      if (m && m.protein >= 5) setup.push(`${r(m.protein)} g of protein to take apart.`);
      if (tg?.n) twist.push(`The fat arrives late: blood fat peaks about ${tg.n} hours in.`);
      if (walk?.n) twist.push(`Burning it off takes about ${walk.n} minutes of brisk walking.`);
    } else if (cls === 'meal') {
      if ((f.t50 ?? 0) >= 30) hook.push(`Your stomach needs ${r(f.t50!)} minutes for just half.`);
      hook.push('Your gut has hours of work ahead.');
      const dk = d('dvKcal'); if (dk?.n) setup.push(`That's ${dk.n} % of a whole day of calories.`);
      if (walk?.n) twist.push(`Burning it off takes about ${walk.n} minutes of brisk walking.`);
      if (tg?.n) twist.push(`The fat arrives late: blood fat peaks about ${tg.n} hours in.`);
    } else if (cls === 'water') {
      if (bw?.n) hook.push(`You already hold about ${bw.n} liters of water.`);
      hook.push('No calories. So where does it go?');
      if (ws?.n) setup.push(`It tops up your body water by just ${ws.n} %.`);
      if (bw?.n && ws?.n) twist.push(`You already carry about ${bw.n} liters, so this adds only ${ws.n} %.`);
    } else {
      if (d('flatSugar')) hook.push('Your glucose barely moves.');
      if (sp) hook.push(`Watch your blood sugar ${at(sp)}.`);
      if (sug >= 3) setup.push(`${sug} g of sugar, about ${tsp} teaspoons.`);
      if (walk?.n) twist.push(`Burning it off takes about ${walk.n} minutes of brisk walking.`);
    }
    answer.push(f.drink ? 'Every sip, accounted for.' : 'Every bite, accounted for.');
  }
  const pk = d('sugarPeak') ?? d('cafPeak'), fast = pk?.n !== undefined ? `${d('sugarPeak') ? 'Your blood sugar' : 'Caffeine'} peaks about ${pk.n} ${pk.u} after the first ${f.drink ? 'sip' : 'bite'}.` : undefined;
  // (the alcohol myth-buster leads its twists: coffee will not sober you up)
  const fastShort = pk?.n !== undefined ? `About ${pk.n} ${pk.u} after the first ${f.drink ? 'sip' : 'bite'}.` : undefined;
  return { cls, hook: rot(hook, 201), setup, twist: cls === 'alcohol' ? twist : rot(twist, 203), answer, loop: rot([...ARC_LOOP[cls]], 205), ...(fast ? { fast, fastShort } : {}) };
}
