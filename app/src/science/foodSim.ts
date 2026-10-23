// Generic model for ANY food or drink from its macros, GI and kind. Claim IDs: research/digestion-generic.md
// (GE gastric emptying, GL glucose, CO colon, TG fat), research/alcohol.md (W, K, A, S), research/water.md.
// Every parameter below is a published number or a level-C fit to one; the screen shows level C for this model.
import { CAFFEINE_GASTRIC_SHARE, simulateEspresso, type Timeline } from './espressoSim';
import { glucoseDeltaMmol, insulinDelta } from './colaSim';
import type { Profile } from './profile';
import { fedForAlcohol } from './personal';

export interface Meal {
  grams: number; kcal: number; availCarbs: number; fiber: number; fat: number; protein: number;
  waterG: number; caffeineMg: number; alcoholG: number; gl: number | null;
  kind: 'liquid' | 'semi' | 'solid';
  /** drink with a meal (alcohol): slower absorption, faster elimination [alcohol A2, K1] */
  fed?: boolean;
  /** alcohol drink type sets absorption speed, per min (ALCOHOL_DRINKS; alcohol.md A1, A9: beer 62, wine 54, spirits 36 min to peak) */
  alcoholKa?: number;
  /** alcohol reaching the blood relative to spirits (ALCOHOL_DRINKS; Mitchell 2014: wine 0.96, beer 0.90) */
  alcoholF?: number;
  /** The separate things eaten together (a MEAL, e.g. burger + fries + cola). Two or more items, with at least one
   *  drink and one food, switch on the two-phase stomach (drinks leave faster than food, but slower than alone) and the
   *  per-item sugar curves. Absent or one item = the single-food model, unchanged. research/meals.md */
  items?: MealItem[];
  /** PACING (2026-10-19, research/improvements/pacing-2026-10-19.md): the amount is had as `doses` equal rounds spread
   *  evenly over `overMin` minutes, one round every overMin / doses minutes, the first at minute 0 (5 beers over 3 h =
   *  one every 36 min). Absent, doses < 2 or overMin 0 = all at once, exactly the old model. */
  pace?: { doses: number; overMin: number };
}

/** Most rounds we simulate (a link or a typed amount can ask for more; each round is one serving or a share of it). */
export const MAX_PACE_DOSES = 24;
/** Start minute of each round: [0] for all at once. */
export function paceStarts(meal: Pick<Meal, 'pace'>): number[] {
  const pc = meal.pace;
  if (!pc || !(pc.overMin > 0) || !(pc.doses >= 2)) return [0];
  const N = Math.min(MAX_PACE_DOSES, Math.floor(pc.doses)), every = pc.overMin / N;
  return Array.from({ length: N }, (_, i) => Math.round(i * every));
}
/** One round of the meal: every amount × f (kind, drink class and "with food" stay). */
export function scaleMeal(meal: Meal, f: number): Meal {
  const sc = <T extends MealItem | Meal>(x: T): T => ({ ...x, grams: x.grams * f, kcal: x.kcal * f, availCarbs: x.availCarbs * f, fiber: x.fiber * f, fat: x.fat * f,
    protein: x.protein * f, waterG: x.waterG * f, caffeineMg: x.caffeineMg * f, alcoholG: x.alcoholG * f, gl: x.gl === null ? null : x.gl * f });
  const out: Meal = { ...sc(meal), items: meal.items?.map(sc) };
  if (!meal.items) delete out.items;
  delete out.pace;
  return out;
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
  // ALCOHOL SLOWS THE STOMACH (model review 2026-10-20, claim GE19). Before, only non-alcohol calories counted, so beer
  // and rakija left "about as fast as water". Measured (Franke 2004, PMID 15370684; 10 fasted, ultrasound, 500 ml):
  // water 14.6 min; pure ethanol 4% / 10% / 40% 22.6 / 22.7 / 27.8 min (slower, but NOT dose-dependent); beer 39.3,
  // red wine 72.6, whisky 26.4 min (fermented drinks slow it more than their ethanol alone; distilled ones do not).
  // Okabe 2022 (PMID 35734752): whisky with water (≈ 10 g ethanol) slower than water, faster than glucose of the same
  // kcal. Stevens 2022 (PMID 35246999, scintigraphy, 600 ml): beer T50 75–89 min. Fit (C): liquid T50 =
  // (line(nutrient kcal) + 10 min) × class factor (beer 1.25 → 500 ml beer 39.6 min; wine 2.5 → 500 ml red wine 72 min,
  // measured for RED wine only; spirits 1). The ethanol part ramps in up to 10 g. Solid meals with alcohol (Franke 2005,
  // PMID 15699055; 16 men): food T50 131 → 159–166 min with 4–10% ethanol or beer (×1.2–1.26), 186 with red wine
  // (×1.42); Kasicka-Jonderko 2013 (PMID 23420574) agrees; Moore 1981 found no effect of wine with a meal (C, mid-range).
  alcoholGE: { addMin: 10, fullAtG: 10, liquid: { beer: 1.25, wine: 2.5, spirits: 1 }, solid: { beer: 1.22, wine: 1.4, spirits: 1.22 } },
  // Protein and fat eaten with carbohydrate lower its sugar response, linearly over 0–30 g [GL5, Moghaddam 2006];
  // per gram added to 50 g carbohydrate: tuna protein −0.57% iAUC, whey −1.4% [ML5, Wolever 2017]; fat ≈ 1/2–1/3 of
  // protein [GL5] → 0.23%/g (C). Only the OTHER items count: each food's own GI already includes its own fat and
  // protein. Scaled to the item's carbohydrate (per 50 g, C) and capped at 35% (largest read effect 28.5%, Mishra 2026).
  blunt: { proteinPerG: 0.0057, fatPerG: 0.0023, perCarbG: 50, max: 0.35 },
  solidBeta: 1.8, // [GE5] power-exponential fit of Tougas 2000 (69/24/1.2% at 1/2/4 h)
  fibreFactor: (fibrePer1000: number) => 1 + 0.0156 * (Math.min(25, Math.max(0, fibrePer1000)) - 4), // [GE13] Benini 1995
  absorbHalf: { carbs: 10, protein: 40, fat: 90, water: 12 }, // min in the small intestine [SI8; AA peak 2–3 h; TG peak 3–4 h] (C)
  kidneyHalfMin: 60, // [water B6–B8]
  siTransit: 240, // residue: 2 × 120 min after leaving the stomach; healthy capsules 3.3–7 h (Nandhra 2023) [SI7, SI7b]
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
  // Alcohol, two compartments (alcohol.md A9–A11, C fitted to A1 Mitchell 2014): the blood we measure first sees only
  // part of the body water (central fraction 0.6 of the Widmark volume), the rest fills over ≈ 30 min (exchange
  // 0.35 × Widmark volume per hour). That gives the early overshoot seen after fast drinks (vodka-tonic peaked at
  // 77 mg/dl, above the Widmark value of 72 for 0.5 g/kg); a single Widmark volume cannot reach it. Elimination
  // (β per litre of the whole Widmark volume, zero-order) is shared by both parts in proportion to their alcohol, so
  // after distribution the curve falls at β exactly as before.
  // kaFed 1.35/h: fitted (C) so that a drink taken right after a meal peaks at ≈ 40–57% of the same drink fasted, as
  // measured (Jones 1997: 13.3–17.7 vs 30.8 mg/dl; Kechagias 1999: 17.5 vs 43.8 mg/dl) [alcohol PF1–PF2, beer H1–H2].
  // With no drink type given, the spirits class is used (the highest peak: the cautious side, C).
  alcohol: { kaFasted: 3.6 / 60, kaFed: 1.35 / 60, betaFasted: 0.12 / 60, betaFed: 0.17 / 60, F: 1, central: 0.6, exchangePerMin: 0.35 / 60 }, // per min
};

/** Absorption by drink class, fasted (alcohol.md A9–A10). ka per min (C: fitted so the 0.5 g/kg fasted drinks of
 *  Mitchell 2014 peak at the measured time and height within 3%: beer 50.3 mg/dl at 62 min, wine 61.7 at 54, vodka-
 *  tonic 77.4 at 36; 82.7 kg men, BMI 26.4); F = bioavailability relative to spirits, measured in the same study
 *  (wine 0.96 ± 0.13, beer 0.90 ± 0.02, A). Classes by grams of alcohol per 100 g of drink (C): < 7 beer-like (beer,
 *  cider, alcopops ≈ 4–5%), 7–13 wine-like (≈ 9–16% vol), ≥ 13 spirits and mixed drinks (≥ ≈ 16% vol; Mitchell's
 *  vodka-tonic was 20% vol ≈ 16 g/100 g). Neat spirits (rakija 40%) were not measured; they get the fastest class. */
export const ALCOHOL_DRINKS = {
  beer: { ka: 1.6 / 60, F: 0.9 },
  wine: { ka: 2.0 / 60, F: 0.96 },
  spirits: { ka: 3.6 / 60, F: 1 },
} as const;
export type AlcoholClass = keyof typeof ALCOHOL_DRINKS;
export const alcoholClass = (gPer100g: number): AlcoholClass => (gPer100g < 7 ? 'beer' : gPer100g < 13 ? 'wine' : 'spirits');

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
  /** PACING only (else null): the rounds, when each starts (min after the first), and the stomach half-time of ONE
   *  round (`t50` above is then when half of everything has left the stomach, counting rounds not yet had as not left). */
  pace: { doses: number; overMin: number; everyMin: number; startsMin: number[]; doseT50: number;
    /** the rounds came faster than the stomach lets sugar out, so the sugar curve is the at-once one */ sugarAsOnce: boolean } | null;
}

const nutrientKcal = (x: { kcal: number; alcoholG: number }) => Math.max(0, x.kcal - 7 * x.alcoholG);
/** How alcohol slows the stomach [GE19]: extra minutes and factors on the liquid and solid half-times (1 / 0 without
 *  alcohol). The class comes from the drink's absorption rate (ALCOHOL_DRINKS; no class given = spirits). */
export function alcoholGE(alcoholG: number, alcoholKa?: number) {
  const A = FOOD_MODEL.alcoholGE, w = Math.min(1, Math.max(0, alcoholG) / A.fullAtG);
  const cls: AlcoholClass = alcoholKa === ALCOHOL_DRINKS.beer.ka ? 'beer' : alcoholKa === ALCOHOL_DRINKS.wine.ka ? 'wine' : 'spirits';
  return { addMin: A.addMin * w, liquid: 1 + (A.liquid[cls] - 1) * w, solid: 1 + (A.solid[cls] - 1) * w, cls };
}
/** Liquid half-time from nutrient kcal, with the alcohol term [GE12, GE19]. */
export const liquidT50Alc = (nKcal: number, alcoholG: number, alcoholKa?: number) => {
  const a = alcoholGE(alcoholG, alcoholKa);
  return (FOOD_MODEL.liquidT50(nKcal) + a.addMin) * a.liquid;
};
const isMixed = (meal: Meal) => !!meal.items && meal.items.length > 1 && meal.items.some((i) => i.drink) && meal.items.some((i) => !i.drink);

/** Drinks vs food in a meal; null phases when the meal is a single food or all drinks / all food. */
export function mealPhases(meal: Meal): MealPhases {
  if (!isMixed(meal)) return { drink: null, food: null };
  const items = meal.items!;
  const idx = (want: boolean) => items.map((x, i) => (x.drink === want ? i : -1)).filter((i) => i >= 0);
  const di = idx(true), fi = idx(false);
  const sum = (ix: number[], f: (x: MealItem) => number) => ix.reduce((s, i) => s + f(items[i]), 0);
  const drinkKcal = sum(di, nutrientKcal), foodKcal = sum(fi, nutrientKcal);
  const drinkAlc = sum(di, (x) => x.alcoholG);
  // [ML4] water still leaves fast after a meal (an alcoholic drink is not plain water: GE19, model review 2026-10-20)
  const plainWater = drinkKcal < 5 && sum(di, (x) => x.caffeineMg) < 1 && drinkAlc < 1;
  // the drinks on their own (semi-solid drinks such as cappuccino keep their single-food half-time, never faster)
  const semiDrink = di.some((i) => items[i].kind !== 'liquid');
  const aloneT50 = semiDrink ? halfOf((t) => singleRetention({ ...meal, kcal: sum(di, (x) => x.kcal), alcoholG: drinkAlc, fiber: sum(di, (x) => x.fiber), kind: 'semi' }, t)) : liquidT50Alc(drinkKcal, drinkAlc, meal.alcoholKa);
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
  const alc = alcoholGE(meal.alcoholG, meal.alcoholKa); // [GE19] alcohol slows the stomach (no-op without alcohol)
  const liquid = liquidT50Alc(kcal, meal.alcoholG, meal.alcoholKa) * (meal.kind === 'liquid' ? 1 : f);
  const solid = FOOD_MODEL.solidT50(kcal) * f * alc.solid;
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
  // PACING: N equal rounds `dm`, round i starting at starts[i]. Everything that is linear in the amount (stomach, gut,
  // water, colon, caffeine, blood fat) is the sum of the rounds shifted in time; alcohol is integrated once for the whole
  // evening, because its zero-order liver works on the total in the body (Searle 2015: full elimination rate from the
  // start of drinking). Each round is a smaller meal, so on its own it leaves the stomach faster (GE12), but never
  // faster than the whole amount had at once (`left` below, C). All at once: starts = [0], dm = meal, the old model exactly.
  const starts = paceStarts(meal), N = starts.length;
  const dm = N > 1 ? scaleMeal(meal, 1 / N) : meal;
  const R = new Float64Array(n);
  for (let t = 0; t < n; t++) R[t] = stomachRetention(dm, t);
  const half = (a: Float64Array) => { for (let t = 1; t < a.length; t++) if (a[t] <= 0.5) return t; return a.length - 1; };
  const doseT50 = half(R);
  // MEAL: each phase empties on its own curve and carries its own carbs, protein, fat, water and fibre into the gut.
  const ph = mealPhases(dm);
  type Load = { carbs: number; protein: number; fat: number; water: number; fibre: number; grams: number };
  const loadOf = (ix: number[]): Load => ix.reduce((s, i) => { const x = dm.items![i]; return { carbs: s.carbs + x.availCarbs, protein: s.protein + x.protein, fat: s.fat + x.fat, water: s.water + x.waterG, fibre: s.fibre + x.fiber, grams: s.grams + x.grams }; }, { carbs: 0, protein: 0, fat: 0, water: 0, fibre: 0, grams: 0 });
  const phases: { R: Float64Array; load: Load; drink: boolean }[] = [];
  if (ph.drink && ph.food) {
    const Rd = new Float64Array(n), Rf = new Float64Array(n);
    for (let t = 0; t < n; t++) { Rd[t] = drinkRetention(ph.drink.t50, t); Rf[t] = foodRetention(dm, ph.food.kind, t); }
    phases.push({ R: Rd, load: loadOf(ph.drink.items), drink: true }, { R: Rf, load: loadOf(ph.food.items), drink: false });
  } else phases.push({ R, load: { carbs: dm.availCarbs, protein: dm.protein, fat: dm.fat, water: dm.waterG, fibre: dm.fiber, grams: dm.grams }, drink: false });
  const foodT50 = ph.food ? half(phases[1].R) : doseT50;
  // PACED stomach, per phase, in "rounds": what has left = what the rounds would release on their own, but never more
  // than the stomach releases when everything is had at once. Nutrient drinks leave at a regulated, calorie-limited
  // pace (GE12: the bigger the load, the slower), so a round drunk while the last is still there waits its turn;
  // without this cap, 5 colas over 1 h would deliver sugar and caffeine faster than 5 colas at once (C).
  const started = (t: number) => { let c = 0; for (const s0 of starts) if (t >= s0) c++; return c; };
  const left: Float64Array[] = N === 1 ? [] : (() => {
    const ph0 = mealPhases(meal);
    return phases.map((q, j) => {
      const c = new Float64Array(n);
      for (let t = 0; t < n; t++) {
        let own = 0; for (const s0 of starts) if (t >= s0) own += 1 - q.R[t - s0];
        const once = 1 - (phases.length > 1 ? (j === 0 ? drinkRetention(ph0.drink!.t50, t) : foodRetention(meal, ph0.food!.kind, t)) : stomachRetention(meal, t));
        c[t] = Math.max(t ? c[t - 1] : 0, Math.min(own, N * once));
      }
      return c;
    });
  })();
  /** grams of phase j in the stomach at minute t, and how much leaves between t and t + 1 (all at once: the old curve) */
  const inStomach = (j: number, t: number) => phases[j].load.grams * (N === 1 ? phases[j].R[t] : started(t) - left[j][t]);
  const leaving = (j: number, t: number) => (N === 1 ? phases[j].R[t] - phases[j].R[t + 1] : left[j][t + 1] - left[j][t]);
  // paced: half of EVERYTHING has left the stomach (rounds not yet had count as not left), for hydration and old callers
  const t50 = N === 1 ? doseT50 : (() => { const all = left.length > 1 ? (t: number) => (phases[0].load.grams * left[0][t] + phases[1].load.grams * left[1][t]) / Math.max(1e-9, phases[0].load.grams + phases[1].load.grams) : (t: number) => left[0][t];
    for (let t = 1; t < n; t++) if (all(t) >= N / 2) return t; return n - 1; })();

  const M = FOOD_MODEL, sub = 20, h = 1 / sub;
  const k = (half: number) => Math.LN2 / half;
  const kc = k(M.absorbHalf.carbs), kp = k(M.absorbHalf.protein), kf = k(M.absorbHalf.fat), kw = k(M.absorbHalf.water), ku = k(M.kidneyHalfMin);
  const ks = 2 / M.siTransit;
  const residue = meal.fiber;
  // Fed (food in this meal, or the person has just eaten): slower absorption and faster elimination [alcohol A2, K1,
  // PF1]. The drink type sets the fasted speed; with food the slower fed rate wins (peak ≈ 40–57% of fasted).
  const fed = fedForAlcohol(meal.fed, p);
  const a = M.alcohol, ka = fed ? Math.min(meal.alcoholKa ?? a.kaFed, a.kaFed) : meal.alcoholKa ?? a.kaFasted, beta = fed ? a.betaFed : a.betaFasted;
  const aF = meal.alcoholF ?? a.F;
  // Widmark factor from BMI (Forrest, alcohol W3). The straight line only holds for ordinary BMIs: the screen accepts
  // 35–200 kg and 130–220 cm (BMI ≈ 7–118), where it would give r ≤ 0 and a negative or infinite blood alcohol.
  // BMI is held inside 16–45 (C, audit 2026-10-16); at BMI 45 r = 0.47 (men) / 0.38 (women), a little below Watson
  // body water ÷ (0.8 × weight) for a 150 kg, 182 cm body (0.58 / 0.45, alcohol.md W4–W5): the cautious side.
  const vd = widmarkR(p) * p.weightKg; // L
  const vc = a.central * vd, vp = vd - vc, q = a.exchangePerMin * vd; // central / peripheral litres, exchange L/min

  const out = { stomachG: mk(), intestineG: mk(), c0: mk(), c1: mk(), c2: mk(), exitedG: mk(), bodyWater: mk(), bladder: mk(), kcalAbsorbed: mk(), bac: mk(), carbsInBlood: mk() };
  // state in the small intestine
  // Alcohol: the fitted absorption rate (Mitchell 2014 peak times) already includes the stomach, so it starts at once.
  // Balc = alcohol in the central part (the blood we show), Bper = in the rest of the body water.
  // (each round's alcohol enters at its start minute, below)
  let Ic = 0, Ip = 0, If = 0, Iw = 0, Ir1 = 0, Ir2 = 0, Ia = 0;
  const C = new Array(3 * M.colonStages).fill(0);
  const kst = C.map((_, j) => M.colonStages / M.colonMin[Math.floor(j / M.colonStages)]);
  let X = 0, Bw = 0, U = 0, kcalAbs = 0, Balc = 0, Bper = 0, Bc = 0, Dg = 0;
  const drinkStomachG = mk(), foodStomachG = mk(), drinkIntestineG = mk();
  for (let t = 0; t < n; t++) {
    for (const s0 of starts) if (s0 === t) Ia += dm.alcoholG;
    out.stomachG[t] = N === 1 ? meal.grams * R[t] : phases.reduce((s2, _, j) => s2 + inStomach(j, t), 0);
    if (phases.length > 1) { drinkStomachG[t] = inStomach(0, t); foodStomachG[t] = inStomach(1, t); drinkIntestineG[t] = Dg; }
    out.intestineG[t] = Ic + Ip + If + Iw + Ir1 + Ir2 + Ia;
    const S = M.colonStages, seg = (q: number) => C.slice(q * S, (q + 1) * S).reduce((a2, b2) => a2 + b2, 0);
    out.c0[t] = seg(0); out.c1[t] = seg(1); out.c2[t] = seg(2); out.exitedG[t] = X;
    out.bodyWater[t] = Bw; out.bladder[t] = U; out.kcalAbsorbed[t] = kcalAbs; out.bac[t] = Balc / vc; out.carbsInBlood[t] = Bc;
    if (t === n - 1) break;
    const emptied = phases.map((_, j) => leaving(j, t) * h);
    for (let s = 0; s < sub; s++) {
      for (let j = 0; j < phases.length; j++) {
        const e = emptied[j], L = phases[j].load;
        Ic += L.carbs * e; Ip += L.protein * e; If += L.fat * e; Iw += L.water * e; Ir1 += L.fibre * e;
        if (phases[j].drink) Dg += L.grams * e;
      }
      Dg -= kw * Dg * h; // the drink part is absorbed about as fast as water (visual only, C)
      const ac = kc * Ic * h, ap = kp * Ip * h, af = kf * If * h, aw = kw * Iw * h, aa = ka * Ia * h;
      Ic -= ac; Ip -= ap; If -= af; Iw -= aw; Ia -= aa;
      kcalAbs += 4 * ac + 4 * ap + 9 * af + 7 * aa * aF;
      Bc += ac - (Math.LN2 / 15) * Bc * h; // extra glucose taken up by cells (as colaSim, C)
      Bw += aw - ku * Bw * h; U += ku * Bw * h;
      const flow = q * (Balc / vc - Bper / vp) * h, total = Balc + Bper, el = Math.min(total, beta * vd * h);
      const elC = total > 0 ? (el * Balc) / total : 0;
      Balc = Math.max(0, Balc + aa * aF - flow - elC); Bper = Math.max(0, Bper + flow - (el - elC));
      const r1 = ks * Ir1 * h, r2 = ks * Ir2 * h;
      Ir1 -= r1; Ir2 += r1 - r2;
      let inflowC = r2;
      for (let j = 0; j < C.length; j++) { const o = kst[j] * C[j] * h; C[j] += inflowC - o; inflowC = o; }
      X += inflowC;
    }
  }

  // Label calories (USDA) include some energy from fibre; scale so "absorbed" ends at the label value (C).
  const atwater = 4 * meal.availCarbs + 4 * meal.protein + 9 * meal.fat + 7 * meal.alcoholG * aF;
  if (atwater > 0) { const f = meal.kcal / atwater; for (let t = 0; t < n; t++) out.kcalAbsorbed[t] *= f; }

  const multi = !!meal.items && meal.items.length > 1;
  const sugarOf = (mm: Meal, phs: MealPhases, tHalf: number, fHalf: number) => {
    const single = glucoseResponse(mm, tHalf);
    const mg = multi ? mealGlucose(mm, phs, fHalf) : null;
    const g = mg ? { fn: mg.fn, peak: mg.peak, tPeak: mg.tPeak, stretch: single.stretch } : single;
    const peakRatio = g.peak / 2.3; // insulin scaled to the cola anchor (C)
    return { ...g, items: mg?.items, insulinAt: (t: number) => (mg ? mg.insulinFn(t) : peakRatio * insulinDelta(t / g.stretch)) };
  };
  const one = sugarOf(dm, ph, doseT50, foodT50);
  // PACED sugar: each round is a smaller serving with its own (smaller, quicker) curve, and the rounds are added up.
  // Spreading the same sugar flattens the curve: 50 g glucose sipped over 3.5 h vs drunk in 5–10 min gave a similar
  // 4-h glucose area with a flatter curve and about half the insulin (Jenkins 1990, PMID 2191884); 75 g sipped over
  // 3.25 h flattened glucose and insulin (Grant 2026, PMID 42072154). Our rounds keep the full insulin (C, high side).
  // An area-matched version was tried and dropped: the at-once curve saturates (GL curve), so it would shrink a cola
  // every 48 min below one cola on its own.
  const g = (() => {
    if (N === 1) return { fn: one.fn, peak: one.peak, tPeak: one.tPeak, insulinAt: one.insulinAt, capped: false };
    // the dip after a sugary drink only after the LAST round: the next round arrives before it (C)
    const last = starts[N - 1];
    const raw = (t: number) => { let v = 0; for (const s0 of starts) if (t > s0) v += s0 === last ? one.fn(t - s0) : Math.max(0, one.fn(t - s0)); return v; };
    const rawIns = (t: number) => { let v = 0; for (const s0 of starts) if (t > s0) v += one.insulinAt(t - s0); return v; };
    const ph0 = mealPhases(meal), t0 = halfOf((t) => stomachRetention(meal, t));
    const once = sugarOf(meal, ph0, t0, ph0.food ? halfOf((t) => foodRetention(meal, ph0.food!.kind, t)) : t0);
    let peak = 0, tPeak = 0;
    for (let t = 0; t < Math.min(n, 900); t++) { const v = raw(t); if (v > peak) { peak = v; tPeak = t; } }
    // the stomach lets sugar out no faster than when it is all had at once (the cap on `left` above), so the paced
    // peak can't be higher either: if it would be, the stomach is the bottleneck and the at-once curve stands (C)
    if (peak > once.peak) return { fn: once.fn, peak: once.peak, tPeak: once.tPeak, insulinAt: once.insulinAt, capped: true };
    return { fn: raw, peak, tPeak, insulinAt: rawIns, capped: false };
  })();
  const insulinAt = g.insulinAt;
  const glucoseDeltaMgDl = mk(), insulin = mk(), tg = mk(), hr = mk(), sbp = mk();
  const bacPeak = Math.max(...out.bac);
  const tgAmp = Math.min(1.2, (M.tgPer50gFat * dm.fat) / 50);
  // Alcohol on pulse and blood pressure within 6 h (Tasnim 2020 Cochrane, abstract read 2026-10-16): 14–28 g HR +4.6,
  // SBP −5.6; > 30 g HR +5.8, SBP −3.5 (the fall is smaller at high doses). Ramp up to 20 g, blend 28 → 30 g (C).
  const ag = meal.alcoholG, hiW = Math.min(1, Math.max(0, (ag - 28) / 2));
  const alcHr = Math.min(1, ag / 20) * ((1 - hiW) * 4.8 + hiW * 5.8);
  const alcSbp = Math.min(1, ag / 20) * ((1 - hiW) * -5.6 + hiW * -3.5);
  for (let t = 0; t < n; t++) {
    glucoseDeltaMgDl[t] = g.fn(t) * 18.016;
    insulin[t] = insulinAt(t);
    for (const s0 of starts) if (t >= s0) { const x = (t - s0) / M.tgPeakMin; tg[t] += tgAmp * Math.pow(x, 3) * Math.exp(3 * (1 - x)); }
    // Alcohol: HR +4.6–5.1 bpm and SBP −5.6 mmHg within 6 h after 14–28 g [alcohol S3]; scaled by blood alcohol (C)
    const bacFrac = bacPeak > 0 ? out.bac[t] / bacPeak : 0;
    hr[t] = alcHr * bacFrac + (3 * insulin[t]) / 30; // sugar part as cola [H2, H4]
    sbp[t] = alcSbp * bacFrac;
  }
  // Caffeine leaves the stomach with the phase it is in. In a meal the coffee's caffeine is held back by the food:
  // tmax 29 → 65–69 min with a 500–1000 kcal meal, same total amount absorbed [ML3, Wildgrube 2026].
  // PACED: the caffeine model is linear, so the evening is what each minute's caffeine leaving the stomach (the capped
  // `left` of the phase it travels in) does on its own, added up: a convolution with one dose put straight into the gut.
  const cafDrink = ph.drink ? ph.drink.items.reduce((s, i) => s + dm.items![i].caffeineMg, 0) : 0;
  const caffeineInDrink = !!ph.drink && cafDrink >= 0.5 * dm.caffeineMg;
  const cafHalf = ph.drink && ph.food ? (caffeineInDrink ? ph.drink.t50 : foodT50) : doseT50;
  const cafOne = simulateEspresso(Math.max(1e-4, dm.caffeineMg), p, minutes, Math.max(13, cafHalf));
  const cafPhase = ph.drink && ph.food && !caffeineInDrink ? 1 : 0;
  // PACED caffeine (model review 2026-10-20): caffeine leaves the stomach faster than the liquid, because part of it is
  // absorbed through the stomach wall (espressoSim CAFFEINE_GASTRIC_SHARE). So the rounds use caffeine's own stomach
  // curve, exactly as one dose does in simulateEspresso, with the same cap as the stomach (never faster than having it
  // all at once), and the impulse response is the mix of the two routes (gut, and straight into the blood).
  const caffeine = N === 1 ? cafOne : dm.caffeineMg < 0.01 ? { ...cafOne, doseMg: cafOne.doseMg * N } : (() => {
    const ph0 = mealPhases(meal);
    const once50 = ph0.drink && ph0.food ? (caffeineInDrink ? ph0.drink.t50 : halfOf((t) => foodRetention(meal, ph0.food!.kind, t))) : halfOf((t) => stomachRetention(meal, t));
    const kOne = Math.LN2 / Math.max(13, cafHalf) / (1 - CAFFEINE_GASTRIC_SHARE), kOnce = Math.LN2 / Math.max(13, once50) / (1 - CAFFEINE_GASTRIC_SHARE);
    const leftC = new Float64Array(n);
    for (let t = 0; t < n; t++) {
      let own = 0; for (const s0 of starts) if (t >= s0) own += 1 - Math.exp(-kOne * (t - s0));
      leftC[t] = Math.max(t ? leftC[t - 1] : 0, Math.min(own, N * (1 - Math.exp(-kOnce * t))));
    }
    const gut = simulateEspresso(1, p, minutes, 0.1, { gastricShare: 0 });
    const direct = simulateEspresso(1, p, minutes, 0.1, { gastricShare: 0, intestineHalfMin: 0.1 });
    const sh = CAFFEINE_GASTRIC_SHARE, mix = (a: Float64Array, b: Float64Array) => a.map((v, i) => (1 - sh) * v + sh * b[i]);
    const imp = { ...gut, intestine: mix(gut.intestine, direct.intestine), body: mix(gut.body, direct.body), metabolites: mix(gut.metabolites, direct.metabolites), cleared: mix(gut.cleared, direct.cleared), conc: mix(gut.conc, direct.conc) };
    return pacedCaffeine(cafOne, imp, (t) => dm.caffeineMg * (leftC[Math.min(n - 1, t + 1)] - leftC[t]), (t) => dm.caffeineMg * (started(t) - leftC[t]), N, p);
  })();
  void cafPhase;
  const caffeineTmaxAloneMin = ph.drink && caffeineInDrink && dm.caffeineMg >= 1 ? simulateEspresso(dm.caffeineMg, p, Math.min(minutes, 600), Math.max(13, ph.drink.aloneT50)).tmaxMin : null;
  return {
    minutes, t50, stomachG: out.stomachG, intestineG: out.intestineG, colonG: [out.c0, out.c1, out.c2], exitedG: out.exitedG, residueG: residue,
    bodyWater: out.bodyWater, bladder: out.bladder, kcalAbsorbed: out.kcalAbsorbed, kcal: meal.kcal,
    glucoseDeltaMgDl, insulin, glucosePeakMmol: g.peak, glucosePeakMin: g.tPeak, tgDelta: tg, bac: out.bac, hr, sbp, caffeine, carbsInBlood: out.carbsInBlood,
    meal: multi ? { phases: ph, drinkStomachG, foodStomachG, drinkIntestineG, foodT50, items: one.items ?? [], caffeineTmaxAloneMin, caffeineInDrink } : null,
    pace: N > 1 ? { doses: N, overMin: meal.pace!.overMin, everyMin: meal.pace!.overMin / N, startsMin: starts, doseT50, sugarAsOnce: g.capped } : null,
  };
}

/** Widmark factor r from BMI (Forrest 1986, alcohol.md W3), BMI held inside 16–45 (see simulateFood). One function
 *  for the whole app, so the health bars and the main screen use the same body (model review 2026-10-22). */
export function widmarkR(p: Pick<Profile, 'sex' | 'weightKg' | 'heightCm'>): number {
  const bmi = Math.min(45, Math.max(16, p.weightKg / Math.pow(p.heightCm / 100, 2)));
  return p.sex === 'female' ? 0.9367 - 0.0124 * bmi : 1.0181 - 0.01213 * bmi;
}

/** Caffeine had in rounds. `imp` = 1 mg that reaches the gut at once (gastric half-time 0.1 min); `inflow(t)` = mg leaving
 *  the stomach between minute t and t + 1; `inStomach(t)` = mg still there. The model after the stomach is linear
 *  (espressoSim.ts), so gut, blood, breakdown products and blood pressure are the inflow convolved with `imp`. Pulse,
 *  sugar and oxygen stay flat, as for one dose; half-life and body water are this person's, as for one round (`one`). */
export function pacedCaffeine(one: Timeline, imp: Timeline, inflow: (t: number) => number, inStomach: (t: number) => number, rounds: number, p: Profile): Timeline {
  const n = one.conc.length;
  const a = new Float64Array(n);
  for (let t = 0; t + 1 < n; t++) a[t] = Math.max(0, inflow(t));
  const conv = (x: Float64Array) => { const o = new Float64Array(n); for (let t = 1; t < n; t++) { let v = 0; for (let u = 0; u < t; u++) if (a[u]) v += a[u] * x[t - u]; o[t] = v; } return o; };
  const intestine = conv(imp.intestine), body = conv(imp.body), metabolites = conv(imp.metabolites), cleared = conv(imp.cleared), conc = conv(imp.conc);
  const stomach = new Float64Array(n);
  for (let t = 0; t < n; t++) stomach[t] = Math.max(0, inStomach(t));
  const dose = one.doseMg * rounds;
  // blood pressure rises in proportion to blood caffeine (espressoSim.ts): the same mmHg per mg/L as one round
  const tm = one.tmaxMin, kS = one.conc[tm] > 0 ? (one.sbp[tm] - p.sbp) / one.conc[tm] : 0, kD = one.conc[tm] > 0 ? (one.dbp[tm] - p.dbp) / one.conc[tm] : 0;
  let tmaxMin = 0, peakConc = 0;
  for (let t = 0; t < n; t++) { if (body[t] > body[tmaxMin]) tmaxMin = t; if (conc[t] > peakConc) peakConc = conc[t]; }
  return {
    ...one, doseMg: dose, stomach, intestine, body, metabolites, cleared, conc,
    stomachMl: stomach.map((s) => (one.stomachMl[0] * s) / Math.max(1e-9, one.doseMg)),
    sbp: conc.map((c) => p.sbp + kS * c), dbp: conc.map((c) => p.dbp + kD * c), tmaxMin, peakConc,
  };
}
