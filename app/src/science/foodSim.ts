// Generic model for ANY food or drink from its macros, GI and kind. Claim IDs: research/digestion-generic.md
// (GE gastric emptying, GL glucose, CO colon, TG fat), research/alcohol.md (W, K, A, S), research/water.md.
// Every parameter below is a published number or a level-C fit to one; the screen shows level C for this model.
import { simulateEspresso, type Timeline } from './espressoSim';
import { glucoseDeltaMmol, insulinDelta } from './colaSim';
import type { Profile } from './profile';
import { fedForAlcohol } from './personal';

export interface Meal {
  grams: number; kcal: number; availCarbs: number; fiber: number; fat: number; protein: number;
  waterG: number; caffeineMg: number; alcoholG: number; gl: number | null;
  kind: 'liquid' | 'semi' | 'solid';
  /** drink with a meal (alcohol): slower absorption, faster elimination [alcohol A2, K1] */
  fed?: boolean;
  /** alcohol drink type sets absorption speed [alcohol A1: beer 62, wine 54, spirits 36 min to peak] */
  alcoholKa?: number;
  /** The separate things eaten together (a MEAL, e.g. burger + fries + cola). Two or more items, with at least one
   *  drink and one food, switch on the two-phase stomach (drinks leave faster than food, but slower than alone) and the
   *  per-item sugar curves. Absent or one item = the single-food model, unchanged. research/meals.md */
  items?: MealItem[];
}

/** One thing in a meal (macros of the amount eaten). `drink` = empties with the liquid phase (drinks, coffee). */
export interface MealItem {
  name: string; kind: Meal['kind']; drink: boolean;
  grams: number; kcal: number; availCarbs: number; fiber: number; fat: number; protein: number;
  waterG: number; caffeineMg: number; alcoholG: number; gl: number | null;
}

/** How much one item drove the sugar curve in a meal (for the plain-language "who does what"). */
export interface ItemGlucose {
  index: number; name: string; drink: boolean;
  /** its own peak in mmol/L within the meal, the minute of that peak, and what changed it */
  peakMmol: number; peakMin: number;
  /** fraction taken off by the protein and fat of the OTHER items [ML5]; slower emptying with food [ML3] */
  blunt: number; slowFactor: number;
}

/** The meal in the stomach as two phases: drinks and food (Collins 1983, Maddern 1985, research/meals.md ML1–ML4). */
export interface MealPhases {
  drink: { grams: number; kcal: number; t50: number; aloneT50: number; items: number[] } | null;
  food: { grams: number; kcal: number; kind: Meal['kind']; items: number[] } | null;
}

export const FOOD_MODEL = {
  liquidT50: (kcal: number) => 13 + 0.11 * kcal, // [GE12] Camps 2016 fit; water 13 min
  // [GE4, GE5]; upper cap 210 min from MRI of real mixed meals (Farivar 2026: 441 kcal 132, 726 kcal 158, ≈ 1270 kcal
  // high-fat 188 ± 41 min; the √kcal line gives 124 / 159 / 210) [ML6]. Fat slows mostly through its calories.
  solidT50: (kcal: number) => Math.min(210, Math.max(65, 94 * Math.sqrt(kcal / 255))),
  // MEALS (research/meals.md). A drink taken with food leaves the stomach first, but slower than on its own: liquid
  // T50 inside a mixed meal 18 min (11–35) vs water alone 13 [ML2, Maddern 1985]; caffeine with a 500 or 1000 kcal
  // meal peaks 65–69 vs 29 min fasted (×2.2) [ML3, Wildgrube 2026]; more solid → slower liquid [ML1, Collins 1996].
  // C fit: drink-phase T50 × (1 + 1.0 × min(1, food kcal / 500)): ×1.5 at 250 kcal (Maddern ≈ 18/13), ×2 from 500.
  drinkWithFood: (foodKcal: number) => 1 + 1.0 * Math.min(1, Math.max(0, foodKcal) / 500),
  // Plain water drunk after a meal still leaves in ≈ 20 min (the "Magenstrasse", Großmann 2025) [ML4]: no slowing.
  // A slower delivery gives a lower sugar peak: exponent 0.3 from our convolution model (digestion-generic §4 table:
  // T50 28 → 68 min at the same GL lowers the peak 2.45 → 1.9, i.e. (28/68)^0.28) (C).
  glucoseSpeedExp: 0.3,
  // Protein and fat eaten with carbohydrate lower its sugar response, linearly over 0–30 g [GL5, Moghaddam 2006];
  // per gram added to 50 g carbohydrate: tuna protein −0.57% iAUC, whey −1.4% [ML5, Wolever 2017]; fat ≈ 1/2–1/3 of
  // protein [GL5] → 0.23%/g (C). Only the OTHER items count: each food's own GI already includes its own fat and
  // protein. Scaled to the item's carbohydrate (per 50 g, C) and capped at 35% (largest read effect 28.5%, Mishra 2026).
  blunt: { proteinPerG: 0.0057, fatPerG: 0.0023, perCarbG: 50, max: 0.35 },
  solidBeta: 1.8, // [GE5] power-exponential fit of Tougas 2000 (69/24/1.2% at 1/2/4 h)
  fibreFactor: (fibrePer1000: number) => 1 + 0.0156 * (Math.min(25, Math.max(0, fibrePer1000)) - 4), // [GE13] Benini 1995
  absorbHalf: { carbs: 10, protein: 40, fat: 90, water: 12 }, // min in the small intestine [SI8; AA peak 2–3 h; TG peak 3–4 h] (C)
  kidneyHalfMin: 60, // [water B6–B8]
  siTransit: 240, // residue: mouth-to-caecum ≈ 5–8 h for solids [SI7, C] → 2 × 120 min after leaving the stomach
  // Colon: right, left, rectosigmoid ≈ 11, 11, 12 h by markers (Metcalf 1987, mean 35 h) [CO3]. The first stool
  // with a meal's dye comes earlier (median 28.7 h, 34% before 24 h; Asnicar 2021) because that is the leading edge.
  colonMin: [660, 660, 720],
  // Each colon segment is 4 compartments in a row, so contents move as a column (first traces leave after about a
  // day, like the dye study) instead of leaking out within hours as one mixing tank would (C).
  colonStages: 4,
  // Glucose: peak = Pmax (1 − e^(−GL/16)); anchored on cola (GL 21 → +2.3 mmol/L [GL4]) and a 50 g glucose drink
  // (GL 50 → ≈ +3.0 mmol/L, typical OGTT peak; C). Solids peak lower at the same GL [GL9] (C, ±50%).
  glucosePmax: 3.14, glucoseG0: 16, kindFactor: { liquid: 1, semi: 0.9, solid: 0.8 },
  tgPer50gFat: 0.77, tgPeakMin: 210, // [TG] Wilson 2021: median +0.77 mmol/L after 50 g fat, peak 3–4 h
  // kaFed 1.5/h: fitted (C) so that a drink taken right after a meal peaks at ≈ 45–55% of the same drink fasted,
  // as measured (Jones 1997: 13.3–17.7 vs 30.8 mg/dl; Kechagias 1999: 17.5 vs 43.8 mg/dl) [alcohol PF1, beer H1–H2]
  alcohol: { kaFasted: 2.5 / 60, kaFed: 1.5 / 60, betaFasted: 0.12 / 60, betaFed: 0.17 / 60, F: 0.94 }, // [alcohol §3–4] per min
};

export interface FoodSim {
  minutes: number;
  t50: number; // half of the meal has left the stomach (min)
  stomachG: Float64Array; intestineG: Float64Array; colonG: [Float64Array, Float64Array, Float64Array]; exitedG: Float64Array;
  residueG: number; // what reaches the colon (fibre)
  bodyWater: Float64Array; bladder: Float64Array; // ml
  kcalAbsorbed: Float64Array; kcal: number;
  glucoseDeltaMgDl: Float64Array; insulin: Float64Array; glucosePeakMmol: number; glucosePeakMin: number;
  tgDelta: Float64Array; // mmol/L
  bac: Float64Array; // g/L
  hr: Float64Array; sbp: Float64Array;
  caffeine: Timeline;
  carbsInBlood: Float64Array; // g absorbed and not yet used (for the visual)
  /** MEALS only (else null): the two phases, grams of each still in the stomach, the drink part in the small intestine,
   *  and how each item drove the sugar curve. */
  meal: {
    phases: MealPhases; drinkStomachG: Float64Array; foodStomachG: Float64Array; drinkIntestineG: Float64Array;
    foodT50: number; items: ItemGlucose[]; caffeineTmaxAloneMin: number | null; caffeineInDrink: boolean;
  } | null;
}

const nutrientKcal = (x: { kcal: number; alcoholG: number }) => Math.max(0, x.kcal - 7 * x.alcoholG);
const isMixed = (meal: Meal) => !!meal.items && meal.items.length > 1 && meal.items.some((i) => i.drink) && meal.items.some((i) => !i.drink);

/** Drinks vs food in a meal; null phases when the meal is a single food or all drinks / all food. */
export function mealPhases(meal: Meal): MealPhases {
  if (!isMixed(meal)) return { drink: null, food: null };
  const items = meal.items!;
  const idx = (want: boolean) => items.map((x, i) => (x.drink === want ? i : -1)).filter((i) => i >= 0);
  const di = idx(true), fi = idx(false);
  const sum = (ix: number[], f: (x: MealItem) => number) => ix.reduce((s, i) => s + f(items[i]), 0);
  const drinkKcal = sum(di, nutrientKcal), foodKcal = sum(fi, nutrientKcal);
  const plainWater = drinkKcal < 5 && sum(di, (x) => x.caffeineMg) < 1; // [ML4] water still leaves fast after a meal
  // the drinks on their own (semi-solid drinks such as cappuccino keep their single-food half-time, never faster)
  const semiDrink = di.some((i) => items[i].kind !== 'liquid');
  const aloneT50 = semiDrink ? halfOf((t) => singleRetention({ ...meal, kcal: sum(di, (x) => x.kcal), alcoholG: sum(di, (x) => x.alcoholG), fiber: sum(di, (x) => x.fiber), kind: 'semi' }, t)) : FOOD_MODEL.liquidT50(drinkKcal);
  return {
    drink: { grams: sum(di, (x) => x.grams), kcal: drinkKcal, aloneT50, t50: aloneT50 * (plainWater ? 1 : FOOD_MODEL.drinkWithFood(foodKcal)), items: di },
    food: { grams: sum(fi, (x) => x.grams), kcal: foodKcal, kind: fi.some((i) => items[i].kind === 'solid') ? 'solid' : 'semi', items: fi },
  };
}

/** Fraction of the meal still in the stomach at minute t (for a meal: drinks and food weighted by weight). */
export function stomachRetention(meal: Meal, t: number): number {
  const ph = mealPhases(meal);
  if (!ph.drink || !ph.food) return singleRetention(meal, t);
  return (ph.drink.grams * drinkRetention(ph.drink.t50, t) + ph.food.grams * foodRetention(meal, ph.food.kind, t)) / Math.max(1e-9, ph.drink.grams + ph.food.grams);
}
const drinkRetention = (t50: number, t: number) => Math.pow(2, -t / t50);
const halfOf = (R: (t: number) => number) => { for (let t = 1; t <= 1440; t++) if (R(t) <= 0.5) return t; return 1440; };
/** The food phase: its pace is set by ALL the energy in the stomach (nutrient drinks also slow solids, Collins 1983
 *  [ML1]) and the meal's fibre; kind = solid if anything solid, else semi-solid. */
const foodRetention = (meal: Meal, kind: Meal['kind'], t: number) => singleRetention({ ...meal, kind }, t);

function singleRetention(meal: Meal, t: number): number {
  const kcal = nutrientKcal(meal); // nutrient energy sets the pace (Camps 2016 used nutrient drinks)
  const fibre1000 = kcal > 0 ? (1000 * meal.fiber) / kcal : 0;
  const f = FOOD_MODEL.fibreFactor(fibre1000);
  const liquid = FOOD_MODEL.liquidT50(kcal) * (meal.kind === 'liquid' ? 1 : f);
  const solid = FOOD_MODEL.solidT50(kcal) * f;
  const exp = (T: number) => Math.pow(2, -t / T);
  const pexp = (T: number, b: number) => Math.exp(-Math.pow(t / (T / Math.pow(Math.LN2, 1 / b)), b));
  if (meal.kind === 'liquid') return exp(liquid);
  if (meal.kind === 'solid') return pexp(solid, FOOD_MODEL.solidBeta);
  return 0.5 * exp(liquid) + 0.5 * pexp(solid, FOOD_MODEL.solidBeta); // semi-solid: 50/50 blend (C, no data)
}

const shapeCache = new Map<boolean, { peak: number; tPeak: number }>();
function colaShape(withDip: boolean) {
  let s = shapeCache.get(withDip);
  if (!s) {
    let peak = 0, tPeak = 0;
    for (let t = 0; t < 200; t += 0.25) { const v = glucoseDeltaMmol(t); if (v > peak) { peak = v; tPeak = t; } }
    s = { peak, tPeak }; shapeCache.set(withDip, s);
  }
  return s;
}

/** `amp` (mmol/L) overrides the peak computed from the GL — used for one item inside a meal. */
export function glucoseResponse(meal: Meal, t50: number, amp?: number) {
  const gl = meal.gl ?? 0;
  const peak = amp !== undefined ? Math.max(0, amp) : gl <= 0 ? 0 : FOOD_MODEL.glucosePmax * (1 - Math.exp(-gl / FOOD_MODEL.glucoseG0)) * FOOD_MODEL.kindFactor[meal.kind];
  const tc = 28 + 0.3 * (t50 - 28); // [§4] sugar leaves faster than the solid phase
  const shift = (meal.kind === 'solid' ? 20 : meal.kind === 'semi' ? 10 : 0) + (meal.fat >= 20 || meal.protein >= 20 ? 10 : 0);
  const base = colaShape(true);
  const tPeak = (base.tPeak * tc) / 28 + shift;
  const stretch = tPeak / base.tPeak;
  // the dip after the peak only for sugary drinks without fat or protein [GL7, cola B4]
  const dip = meal.kind === 'liquid' && meal.fat + meal.protein < 10;
  const fn = (t: number) => {
    if (peak === 0 || t <= 0) return 0;
    const v = glucoseDeltaMmol(t / stretch) / base.peak;
    return peak * (dip ? v : Math.max(0, v));
  };
  return { fn, peak, tPeak, stretch };
}

/** One sugar curve per carbohydrate item of a meal, summed. Total size from the meal's total GL (same saturating
 *  curve as one food), shared by GL; each item keeps its own speed (drinks with the drink phase, food with the food
 *  phase), its own solid/liquid factor, a lower peak when a drink is slowed by food [ML3, C], and the blunting by the
 *  OTHER items' protein and fat [ML5]. One item alone gives exactly the single-food curve. */
export function mealGlucose(meal: Meal, ph: MealPhases, foodT50: number) {
  const items = meal.items ?? [];
  const M = FOOD_MODEL;
  const glTot = items.reduce((s, x) => s + (x.gl ?? 0), 0);
  const total = glTot <= 0 ? 0 : M.glucosePmax * (1 - Math.exp(-glTot / M.glucoseG0));
  const slow = ph.drink ? Math.pow(ph.drink.aloneT50 / ph.drink.t50, M.glucoseSpeedExp) : 1;
  const P = meal.protein, F = meal.fat;
  const curves = items.map((x, index) => {
    const gl = x.gl ?? 0;
    if (gl <= 0) return null;
    const otherP = Math.max(0, P - x.protein), otherF = Math.max(0, F - x.fat);
    const blunt = Math.min(M.blunt.max, (M.blunt.proteinPerG * otherP + M.blunt.fatPerG * otherF) * (M.blunt.perCarbG / Math.max(10, x.availCarbs)));
    const inDrink = !!ph.drink && x.drink;
    const slowFactor = inDrink ? slow : 1;
    const amp = total * (gl / glTot) * M.kindFactor[x.kind] * slowFactor * (1 - blunt);
    // timing: the item's own phase; meal-level fat/protein delay and "no dip with food" use the whole meal [GL7]
    const t50 = inDrink ? ph.drink!.t50 : foodT50;
    const r = glucoseResponse({ ...meal, kind: x.kind, gl }, t50, amp);
    return { index, name: x.name, drink: x.drink, r, blunt, slowFactor };
  }).filter((c): c is NonNullable<typeof c> => c !== null);
  const fn = (t: number) => curves.reduce((s, c) => s + c.r.fn(t), 0);
  const insulinFn = (t: number) => curves.reduce((s, c) => s + (c.r.peak / 2.3) * insulinDelta(t / c.r.stretch), 0); // cola anchor (C)
  let peak = 0, tPeak = 0;
  for (let t = 0; t <= 400; t++) { const v = fn(t); if (v > peak) { peak = v; tPeak = t; } }
  const out: ItemGlucose[] = curves.map((c) => ({ index: c.index, name: c.name, drink: c.drink, peakMmol: c.r.peak, peakMin: c.r.tPeak, blunt: c.blunt, slowFactor: c.slowFactor }));
  return { fn, insulinFn, peak, tPeak, items: out };
}

export function simulateFood(meal: Meal, p: Profile, minutes = 1440): FoodSim {
  const n = minutes + 1, mk = () => new Float64Array(n);
  const R = new Float64Array(n);
  for (let t = 0; t < n; t++) R[t] = stomachRetention(meal, t);
  const half = (a: Float64Array) => { for (let t = 1; t < a.length; t++) if (a[t] <= 0.5) return t; return a.length - 1; };
  const t50 = half(R);
  // MEAL: each phase empties on its own curve and carries its own carbs, protein, fat, water and fibre into the gut.
  const ph = mealPhases(meal);
  type Load = { carbs: number; protein: number; fat: number; water: number; fibre: number; grams: number };
  const loadOf = (ix: number[]): Load => ix.reduce((s, i) => { const x = meal.items![i]; return { carbs: s.carbs + x.availCarbs, protein: s.protein + x.protein, fat: s.fat + x.fat, water: s.water + x.waterG, fibre: s.fibre + x.fiber, grams: s.grams + x.grams }; }, { carbs: 0, protein: 0, fat: 0, water: 0, fibre: 0, grams: 0 });
  const phases: { R: Float64Array; load: Load; drink: boolean }[] = [];
  if (ph.drink && ph.food) {
    const Rd = new Float64Array(n), Rf = new Float64Array(n);
    for (let t = 0; t < n; t++) { Rd[t] = drinkRetention(ph.drink.t50, t); Rf[t] = foodRetention(meal, ph.food.kind, t); }
    phases.push({ R: Rd, load: loadOf(ph.drink.items), drink: true }, { R: Rf, load: loadOf(ph.food.items), drink: false });
  } else phases.push({ R, load: { carbs: meal.availCarbs, protein: meal.protein, fat: meal.fat, water: meal.waterG, fibre: meal.fiber, grams: meal.grams }, drink: false });
  const foodT50 = ph.food ? half(phases[1].R) : t50;

  const M = FOOD_MODEL, sub = 20, h = 1 / sub;
  const k = (half: number) => Math.LN2 / half;
  const kc = k(M.absorbHalf.carbs), kp = k(M.absorbHalf.protein), kf = k(M.absorbHalf.fat), kw = k(M.absorbHalf.water), ku = k(M.kidneyHalfMin);
  const ks = 2 / M.siTransit;
  const residue = meal.fiber;
  // Fed (food in this meal, or the person has just eaten): slower absorption and faster elimination [alcohol A2, K1,
  // PF1]. The drink type sets the fasted speed; with food the slower fed rate wins (peak ≈ 40–57% of fasted).
  const fed = fedForAlcohol(meal.fed, p);
  const a = M.alcohol, ka = fed ? Math.min(meal.alcoholKa ?? a.kaFed, a.kaFed) : meal.alcoholKa ?? a.kaFasted, beta = fed ? a.betaFed : a.betaFasted;
  // Widmark factor from BMI (Forrest, alcohol W3)
  const bmi = p.weightKg / Math.pow(p.heightCm / 100, 2);
  const r = p.sex === 'female' ? 0.9367 - 0.0124 * bmi : 1.0181 - 0.01213 * bmi;
  const vd = r * p.weightKg; // L

  const out = { stomachG: mk(), intestineG: mk(), c0: mk(), c1: mk(), c2: mk(), exitedG: mk(), bodyWater: mk(), bladder: mk(), kcalAbsorbed: mk(), bac: mk(), carbsInBlood: mk() };
  // state in the small intestine
  // Alcohol: the fitted absorption rate (Mitchell 2014 peak times) already includes the stomach, so it starts at once.
  let Ic = 0, Ip = 0, If = 0, Iw = 0, Ir1 = 0, Ir2 = 0, Ia = meal.alcoholG;
  const C = new Array(3 * M.colonStages).fill(0);
  const kst = C.map((_, j) => M.colonStages / M.colonMin[Math.floor(j / M.colonStages)]);
  let X = 0, Bw = 0, U = 0, kcalAbs = 0, Balc = 0, Bc = 0, Dg = 0;
  const drinkStomachG = mk(), foodStomachG = mk(), drinkIntestineG = mk();
  for (let t = 0; t < n; t++) {
    out.stomachG[t] = meal.grams * R[t];
    if (phases.length > 1) { drinkStomachG[t] = phases[0].load.grams * phases[0].R[t]; foodStomachG[t] = phases[1].load.grams * phases[1].R[t]; drinkIntestineG[t] = Dg; }
    out.intestineG[t] = Ic + Ip + If + Iw + Ir1 + Ir2 + Ia;
    const S = M.colonStages, seg = (q: number) => C.slice(q * S, (q + 1) * S).reduce((a2, b2) => a2 + b2, 0);
    out.c0[t] = seg(0); out.c1[t] = seg(1); out.c2[t] = seg(2); out.exitedG[t] = X;
    out.bodyWater[t] = Bw; out.bladder[t] = U; out.kcalAbsorbed[t] = kcalAbs; out.bac[t] = Balc / vd; out.carbsInBlood[t] = Bc;
    if (t === n - 1) break;
    const emptied = phases.map((q) => (q.R[t] - q.R[t + 1]) * h);
    for (let s = 0; s < sub; s++) {
      for (let j = 0; j < phases.length; j++) {
        const e = emptied[j], L = phases[j].load;
        Ic += L.carbs * e; Ip += L.protein * e; If += L.fat * e; Iw += L.water * e; Ir1 += L.fibre * e;
        if (phases[j].drink) Dg += L.grams * e;
      }
      Dg -= kw * Dg * h; // the drink part is absorbed about as fast as water (visual only, C)
      const ac = kc * Ic * h, ap = kp * Ip * h, af = kf * If * h, aw = kw * Iw * h, aa = ka * Ia * h;
      Ic -= ac; Ip -= ap; If -= af; Iw -= aw; Ia -= aa;
      kcalAbs += 4 * ac + 4 * ap + 9 * af + 7 * aa * a.F;
      Bc += ac - (Math.LN2 / 15) * Bc * h; // extra glucose taken up by cells (as colaSim, C)
      Bw += aw - ku * Bw * h; U += ku * Bw * h;
      Balc += aa * a.F - Math.min(Balc, beta * vd * h);
      const r1 = ks * Ir1 * h, r2 = ks * Ir2 * h;
      Ir1 -= r1; Ir2 += r1 - r2;
      let inflowC = r2;
      for (let j = 0; j < C.length; j++) { const o = kst[j] * C[j] * h; C[j] += inflowC - o; inflowC = o; }
      X += inflowC;
    }
  }

  // Label calories (USDA) include some energy from fibre; scale so "absorbed" ends at the label value (C).
  const atwater = 4 * meal.availCarbs + 4 * meal.protein + 9 * meal.fat + 7 * meal.alcoholG * a.F;
  if (atwater > 0) { const f = meal.kcal / atwater; for (let t = 0; t < n; t++) out.kcalAbsorbed[t] *= f; }

  const multi = !!meal.items && meal.items.length > 1;
  const single = glucoseResponse(meal, t50);
  const mg = multi ? mealGlucose(meal, ph, foodT50) : null;
  const g = mg ? { fn: mg.fn, peak: mg.peak, tPeak: mg.tPeak, stretch: single.stretch } : single;
  const peakRatio = g.peak / 2.3; // insulin scaled to the cola anchor (C)
  const insulinAt = (t: number) => (mg ? mg.insulinFn(t) : peakRatio * insulinDelta(t / g.stretch));
  const glucoseDeltaMgDl = mk(), insulin = mk(), tg = mk(), hr = mk(), sbp = mk();
  const bacPeak = Math.max(...out.bac);
  const tgAmp = Math.min(1.2, (M.tgPer50gFat * meal.fat) / 50);
  for (let t = 0; t < n; t++) {
    glucoseDeltaMgDl[t] = g.fn(t) * 18.016;
    insulin[t] = insulinAt(t);
    const x = t / M.tgPeakMin; tg[t] = tgAmp * Math.pow(x, 3) * Math.exp(3 * (1 - x));
    // Alcohol: HR +4.6–5.1 bpm and SBP −5.6 mmHg within 6 h after 14–28 g [alcohol S3]; scaled by blood alcohol (C)
    const bacFrac = bacPeak > 0 ? out.bac[t] / bacPeak : 0;
    const dose = Math.min(1, meal.alcoholG / 20);
    hr[t] = 4.8 * dose * bacFrac + (3 * insulin[t]) / 30; // sugar part as cola [H2, H4]
    sbp[t] = -5.6 * dose * bacFrac;
  }
  // Caffeine leaves the stomach with the phase it is in. In a meal the coffee's caffeine is held back by the food:
  // tmax 29 → 65–69 min with a 500–1000 kcal meal, same total amount absorbed [ML3, Wildgrube 2026].
  const cafDrink = ph.drink ? ph.drink.items.reduce((s, i) => s + meal.items![i].caffeineMg, 0) : 0;
  const caffeineInDrink = !!ph.drink && cafDrink >= 0.5 * meal.caffeineMg;
  const cafHalf = ph.drink && ph.food ? (caffeineInDrink ? ph.drink.t50 : foodT50) : t50;
  const caffeine = simulateEspresso(Math.max(1e-4, meal.caffeineMg), p, minutes, Math.max(13, cafHalf));
  const caffeineTmaxAloneMin = ph.drink && caffeineInDrink && meal.caffeineMg >= 1 ? simulateEspresso(meal.caffeineMg, p, Math.min(minutes, 600), Math.max(13, ph.drink.aloneT50)).tmaxMin : null;
  return {
    minutes, t50, stomachG: out.stomachG, intestineG: out.intestineG, colonG: [out.c0, out.c1, out.c2], exitedG: out.exitedG, residueG: residue,
    bodyWater: out.bodyWater, bladder: out.bladder, kcalAbsorbed: out.kcalAbsorbed, kcal: meal.kcal,
    glucoseDeltaMgDl, insulin, glucosePeakMmol: g.peak, glucosePeakMin: g.tPeak, tgDelta: tg, bac: out.bac, hr, sbp, caffeine, carbsInBlood: out.carbsInBlood,
    meal: multi ? { phases: ph, drinkStomachG, foodStomachG, drinkIntestineG, foodT50, items: mg?.items ?? [], caffeineTmaxAloneMin, caffeineInDrink } : null,
  };
}
