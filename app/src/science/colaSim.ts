// One 330 ml can of regular cola. Claim IDs refer to research/cola.md.
import { simulateEspresso, type Timeline } from './espressoSim';
import type { Profile } from './profile';

export type Recipe = 'eu' | 'us';
export const COLA = {
  eu: { sugarG: 35, glucoseG: 18.4, fructoseG: 18.4, kcal: 139 }, // [P1, P4c] sucrose
  us: { sugarG: 36.3, glucoseG: 16.1, fructoseG: 20.2, kcal: 128 }, // [P2c, P4c] HFCS-55, scaled to 330 ml
  caffeineMg: 32, // [P5]
  volumeMl: 330,
  gastricHalfMin: 32, // [G7] caloric emptying, interpolated from Camps 2016 (level C)
  intestineHalfMin: 5, // [A5] sugar absorption is not rate-limiting (C)
  fructoseFirstPass: 0.855, // [L2] 14.5% escapes splanchnic extraction
  bloodGlucoseHalfMin: 15, // extra glucose taken up by cells (visual mass model, C)
  liverFructoseHalfMin: 90, // fructose processed over 3–6 h in tracer studies [L3, L4] (C)
};

// Blood glucose change after one can (mmol/L), fitted to [B1, B2, B4, B10]:
// +2.2–2.4 at ~30 min, back to baseline ~60 min, below baseline from ~65 min, ≈ −0.7 at 120 min, ~0 by 240 min.
const g = (t: number, k: number, th: number) => (t <= 0 ? 0 : Math.pow(t / th, k - 1) * Math.exp(-(t - (k - 1) * th) / th));
const FIT = { a: 2.6301, k1: 3.0679, t1: 25.7615, b: 0.9223, k2: 3.6184, t2: 23.437 };
export const glucoseDeltaMmol = (t: number) => FIT.a * g(t, FIT.k1, FIT.t1) - FIT.b * g(t, FIT.k2, FIT.t2);
// Insulin rise (mU/L): ≈ 30 above baseline at 30 min, near baseline by 120 min [B1, B2, B6]. Shape level C.
export const insulinDelta = (t: number) => (t <= 0 ? 0 : 30 * Math.pow(t / 30, 2) * Math.exp(2 * (1 - t / 30)));
// Heart rate: +0 to +6 bpm for ≈ 2 h [H2, H4]; we show the middle (+3) following the insulin shape (level C).
const hrDelta = (t: number) => 3 * insulinDelta(t) / 30;

export interface ColaSim {
  caffeine: Timeline;
  minutes: number;
  sugarG: number;
  // grams of sugar (as glucose + fructose) per place
  stomach: Float64Array; intestine: Float64Array;
  bloodGlucose: Float64Array; usedGlucose: Float64Array;
  liverFructose: Float64Array; processedFructose: Float64Array;
  stomachMl: Float64Array;
  glucoseMgDl: Float64Array; insulin: Float64Array; hr: Float64Array;
  glucoseDeltaMgDl: Float64Array;
}

export function simulateCola(p: Profile, recipe: Recipe = 'eu', minutes = 1440): ColaSim {
  const r = COLA[recipe];
  const hexose = r.glucoseG + r.fructoseG;
  const fShare = r.fructoseG / hexose;
  const kg = Math.LN2 / COLA.gastricHalfMin, ki = Math.LN2 / COLA.intestineHalfMin;
  const ku = Math.LN2 / COLA.bloodGlucoseHalfMin, kl = Math.LN2 / COLA.liverFructoseHalfMin;
  const n = minutes + 1, mk = () => new Float64Array(n);
  const out = { stomach: mk(), intestine: mk(), bloodGlucose: mk(), usedGlucose: mk(), liverFructose: mk(), processedFructose: mk() };
  let S = hexose, I = 0, B = 0, U = 0, L = 0, P = 0;
  const sub = 20, h = 1 / sub; // explicit Euler with 3 s steps is accurate for these slow rates
  for (let t = 0; t < n; t++) {
    out.stomach[t] = S; out.intestine[t] = I; out.bloodGlucose[t] = B; out.usedGlucose[t] = U; out.liverFructose[t] = L; out.processedFructose[t] = P;
    for (let k = 0; k < sub; k++) {
      const empt = kg * S * h, abs = ki * I * h;
      const toLiver = abs * fShare * COLA.fructoseFirstPass; // fructose kept by the liver
      const toBlood = abs - toLiver; // glucose + escaping fructose
      const used = ku * B * h, proc = kl * L * h;
      S -= empt; I += empt - abs; B += toBlood - used; U += used; L += toLiver - proc; P += proc;
    }
  }
  const scale = r.sugarG / COLA.eu.sugarG; // linear in sugar dose (level C)
  const caffeine = simulateEspresso(COLA.caffeineMg, p, minutes, COLA.gastricHalfMin);
  return {
    caffeine, minutes, sugarG: hexose, ...out,
    stomachMl: out.stomach.map((s) => (COLA.volumeMl * s) / hexose),
    glucoseMgDl: out.stomach.map((_, t) => p.glucoseMgDl + glucoseDeltaMmol(t) * scale * 18.016),
    glucoseDeltaMgDl: out.stomach.map((_, t) => glucoseDeltaMmol(t) * scale * 18.016),
    insulin: out.stomach.map((_, t) => insulinDelta(t)),
    hr: out.stomach.map((_, t) => hrDelta(t)),
  };
}
