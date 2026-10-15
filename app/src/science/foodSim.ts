// Generic model for ANY food or drink from its macros, GI and kind. Claim IDs: research/digestion-generic.md
// (GE gastric emptying, GL glucose, CO colon, TG fat), research/alcohol.md (W, K, A, S), research/water.md.
// Every parameter below is a published number or a level-C fit to one; the screen shows level C for this model.
import { simulateEspresso, type Timeline } from './espressoSim';
import { glucoseDeltaMmol, insulinDelta } from './colaSim';
import type { Profile } from './profile';

export interface Meal {
  grams: number; kcal: number; availCarbs: number; fiber: number; fat: number; protein: number;
  waterG: number; caffeineMg: number; alcoholG: number; gl: number | null;
  kind: 'liquid' | 'semi' | 'solid';
  /** drink with a meal (alcohol): slower absorption, faster elimination [alcohol A2, K1] */
  fed?: boolean;
  /** alcohol drink type sets absorption speed [alcohol A1: beer 62, wine 54, spirits 36 min to peak] */
  alcoholKa?: number;
}

export const FOOD_MODEL = {
  liquidT50: (kcal: number) => 13 + 0.11 * kcal, // [GE12] Camps 2016 fit; water 13 min
  solidT50: (kcal: number) => Math.min(150, Math.max(65, 94 * Math.sqrt(kcal / 255))), // [GE4, GE5]
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
  alcohol: { kaFasted: 2.5 / 60, kaFed: 0.75 / 60, betaFasted: 0.12 / 60, betaFed: 0.17 / 60, F: 0.94 }, // [alcohol §3–4] per min
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
}

/** Fraction of the meal still in the stomach at minute t. */
export function stomachRetention(meal: Meal, t: number): number {
  const kcal = Math.max(0, meal.kcal - 7 * meal.alcoholG); // nutrient energy sets the pace (Camps 2016 used nutrient drinks)
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

export function glucoseResponse(meal: Meal, t50: number) {
  const gl = meal.gl ?? 0;
  const peak = gl <= 0 ? 0 : FOOD_MODEL.glucosePmax * (1 - Math.exp(-gl / FOOD_MODEL.glucoseG0)) * FOOD_MODEL.kindFactor[meal.kind];
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

export function simulateFood(meal: Meal, p: Profile, minutes = 1440): FoodSim {
  const n = minutes + 1, mk = () => new Float64Array(n);
  const R = new Float64Array(n);
  for (let t = 0; t < n; t++) R[t] = stomachRetention(meal, t);
  let t50 = minutes; for (let t = 1; t < n; t++) if (R[t] <= 0.5) { t50 = t; break; }

  const M = FOOD_MODEL, sub = 20, h = 1 / sub;
  const k = (half: number) => Math.LN2 / half;
  const kc = k(M.absorbHalf.carbs), kp = k(M.absorbHalf.protein), kf = k(M.absorbHalf.fat), kw = k(M.absorbHalf.water), ku = k(M.kidneyHalfMin);
  const ks = 2 / M.siTransit;
  const residue = meal.fiber;
  const a = M.alcohol, ka = meal.alcoholKa ?? (meal.fed ? a.kaFed : a.kaFasted), beta = meal.fed ? a.betaFed : a.betaFasted;
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
  let X = 0, Bw = 0, U = 0, kcalAbs = 0, Balc = 0, Bc = 0;
  for (let t = 0; t < n; t++) {
    out.stomachG[t] = meal.grams * R[t];
    out.intestineG[t] = Ic + Ip + If + Iw + Ir1 + Ir2 + Ia;
    const S = M.colonStages, seg = (q: number) => C.slice(q * S, (q + 1) * S).reduce((a2, b2) => a2 + b2, 0);
    out.c0[t] = seg(0); out.c1[t] = seg(1); out.c2[t] = seg(2); out.exitedG[t] = X;
    out.bodyWater[t] = Bw; out.bladder[t] = U; out.kcalAbsorbed[t] = kcalAbs; out.bac[t] = Balc / vd; out.carbsInBlood[t] = Bc;
    if (t === n - 1) break;
    const emptiedFrac = R[t] - R[t + 1];
    for (let s = 0; s < sub; s++) {
      const e = emptiedFrac * h;
      Ic += meal.availCarbs * e; Ip += meal.protein * e; If += meal.fat * e; Iw += meal.waterG * e; Ir1 += residue * e;
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

  const g = glucoseResponse(meal, t50);
  const peakRatio = g.peak / 2.3; // insulin scaled to the cola anchor (C)
  const glucoseDeltaMgDl = mk(), insulin = mk(), tg = mk(), hr = mk(), sbp = mk();
  const bacPeak = Math.max(...out.bac);
  const tgAmp = Math.min(1.2, (M.tgPer50gFat * meal.fat) / 50);
  for (let t = 0; t < n; t++) {
    glucoseDeltaMgDl[t] = g.fn(t) * 18.016;
    insulin[t] = peakRatio * insulinDelta(t / g.stretch);
    const x = t / M.tgPeakMin; tg[t] = tgAmp * Math.pow(x, 3) * Math.exp(3 * (1 - x));
    // Alcohol: HR +4.6–5.1 bpm and SBP −5.6 mmHg within 6 h after 14–28 g [alcohol S3]; scaled by blood alcohol (C)
    const bacFrac = bacPeak > 0 ? out.bac[t] / bacPeak : 0;
    const dose = Math.min(1, meal.alcoholG / 20);
    hr[t] = 4.8 * dose * bacFrac + (peakRatio * 3 * insulinDelta(t / g.stretch)) / 30; // sugar part as cola [H2, H4]
    sbp[t] = -5.6 * dose * bacFrac;
  }
  const caffeine = simulateEspresso(Math.max(1e-4, meal.caffeineMg), p, minutes, Math.max(13, t50));
  return {
    minutes, t50, stomachG: out.stomachG, intestineG: out.intestineG, colonG: [out.c0, out.c1, out.c2], exitedG: out.exitedG, residueG: residue,
    bodyWater: out.bodyWater, bladder: out.bladder, kcalAbsorbed: out.kcalAbsorbed, kcal: meal.kcal,
    glucoseDeltaMgDl, insulin, glucosePeakMmol: g.peak, glucosePeakMin: g.tPeak, tgDelta: tg, bac: out.bac, hr, sbp, caffeine, carbsInBlood: out.carbsInBlood,
  };
}
