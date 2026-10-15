// Minute-by-minute simulation of one espresso in one person.
// Compartments (mg caffeine): stomach → small intestine → body water → broken down → cleared.
// Every rate constant is tied to a claim in research/espresso.md.
import { DEFAULT_PROFILE, totalBodyWaterL, type Profile } from './profile';

const LN2 = Math.LN2;

export const ESPRESSO_ML = 30;
export const GASTRIC_HALF_MIN = 13; // [G1] Mudie 2014: water T50 13 ± 1 min; [G2] Grimm 2023: 20 mL empties at a similar relative rate
const CAFFEINE_HALF_H = 6.0; // [M6, M7] non-smoking controls
// Absorption from the small intestine. Caffeine is highly permeable, so absorption is assumed fast
// (half-time 5 min, level C). With gastric emptying at t½ 13 min this puts the blood peak near 65–70 min,
// inside the published 30–120 min [D2]. Faster peaks would require absorption from the stomach itself [D6, open].
const INTESTINE_HALF_MIN = 5;
const VD_PER_TBW = 45.5 / totalBodyWaterL(DEFAULT_PROFILE); // [D5] 0.65 L/kg at 70 kg, scaled by body water [D4]
// Breakdown products and their plasma half-lives [M2] Socias 2026; [X1] Lelo 1986
const METABOLITES = [
  { name: 'paraxanthine', share: 0.84, halfH: 3.1 },
  { name: 'theobromine', share: 0.12, halfH: 7.2 },
  { name: 'theophylline', share: 0.04, halfH: 6.2 },
];
// Blood pressure: +7 mmHg systolic at rest after 3 mg/kg in non-habitual young men [V2] McClaran 2007;
// diastolic/systolic ratio 5.7/8.1 from [F8] Mesas 2011. Scaled linearly with blood caffeine (level C).
const SBP_AT_3MGKG = 7;
const DBP_PER_SBP = 5.7 / 8.1;

export function caffeineHalfLifeH(p: Profile): number {
  let h = CAFFEINE_HALF_H;
  if (p.smoker) h *= 3.5 / 6.0; // [M6]
  if (p.oralContraceptives) h *= 10.7 / 6.2; // [M7]
  if (p.latePregnancy) h *= 1 / 0.39; // [M8, M9]
  return h;
}

export const volumeOfDistributionL = (p: Profile) => totalBodyWaterL(p) * VD_PER_TBW;

export interface Timeline {
  doseMg: number;
  minutes: number; // length; arrays have minutes + 1 entries (one per minute)
  stomach: Float64Array; intestine: Float64Array; body: Float64Array; metabolites: Float64Array; cleared: Float64Array;
  stomachMl: Float64Array;
  conc: Float64Array; // mg/L
  hr: Float64Array; sbp: Float64Array; dbp: Float64Array; glucose: Float64Array; spo2: Float64Array;
  vdL: number; halfLifeH: number; tmaxMin: number; peakConc: number;
}

interface Rates { kg: number; ki: number; ke: number; km: number[] }

function integrate(doseMg: number, r: Rates, minutes: number) {
  const n = minutes + 1;
  const out = {
    stomach: new Float64Array(n), intestine: new Float64Array(n), body: new Float64Array(n),
    metabolites: new Float64Array(n), cleared: new Float64Array(n),
  };
  let S = doseMg, I = 0, B = 0, C = 0;
  const M = r.km.map(() => 0);
  const sub = 20, h = 1 / sub; // 3-second steps, explicit RK4 on the linear system
  const deriv = (s: number, i: number, b: number, m: number[]) => {
    const dm = m.map((x, k) => r.ke * b * METABOLITES[k].share - r.km[k] * x);
    const dc = m.reduce((acc, x, k) => acc + r.km[k] * x, 0);
    return { s: -r.kg * s, i: r.kg * s - r.ki * i, b: r.ki * i - r.ke * b, m: dm, c: dc };
  };
  for (let t = 0; t < n; t++) {
    out.stomach[t] = S; out.intestine[t] = I; out.body[t] = B;
    out.metabolites[t] = M.reduce((a, b) => a + b, 0); out.cleared[t] = C;
    for (let k = 0; k < sub; k++) {
      const k1 = deriv(S, I, B, M);
      const k2 = deriv(S + h / 2 * k1.s, I + h / 2 * k1.i, B + h / 2 * k1.b, M.map((x, j) => x + h / 2 * k1.m[j]));
      const k3 = deriv(S + h / 2 * k2.s, I + h / 2 * k2.i, B + h / 2 * k2.b, M.map((x, j) => x + h / 2 * k2.m[j]));
      const k4 = deriv(S + h * k3.s, I + h * k3.i, B + h * k3.b, M.map((x, j) => x + h * k3.m[j]));
      S += h / 6 * (k1.s + 2 * k2.s + 2 * k3.s + k4.s);
      I += h / 6 * (k1.i + 2 * k2.i + 2 * k3.i + k4.i);
      B += h / 6 * (k1.b + 2 * k2.b + 2 * k3.b + k4.b);
      for (let j = 0; j < M.length; j++) M[j] += h / 6 * (k1.m[j] + 2 * k2.m[j] + 2 * k3.m[j] + k4.m[j]);
      C += h / 6 * (k1.c + 2 * k2.c + 2 * k3.c + k4.c);
    }
  }
  return out;
}

const argmax = (a: Float64Array) => a.reduce((best, v, i) => (v > a[best] ? i : best), 0);

/** Caffeine in any drink. `gastricHalfMin` = how fast that drink leaves the stomach (water-like 13 min [G1]; cola ≈ 32 min, cola.md G7). */
export function simulateEspresso(doseMg: number, p: Profile, minutes = 1440, gastricHalfMin = GASTRIC_HALF_MIN): Timeline {
  const halfLifeH = caffeineHalfLifeH(p);
  const kg = LN2 / gastricHalfMin;
  const ke = LN2 / (halfLifeH * 60);
  const ki = LN2 / INTESTINE_HALF_MIN;
  const km = METABOLITES.map((m) => LN2 / (m.halfH * 60));
  const a = integrate(doseMg, { kg, ki, ke, km }, minutes);
  const vdL = volumeOfDistributionL(p);
  const n = minutes + 1;
  const conc = a.body.map((b) => b / vdL);
  const peakConc = conc.reduce((m, v) => Math.max(m, v), 0);
  const conc3mgkg = peakConc * (3 * p.weightKg) / doseMg; // linear model: peak for a 3 mg/kg dose
  const sbpRise = conc.map((c) => SBP_AT_3MGKG * c / conc3mgkg);
  return {
    doseMg, minutes, ...a,
    stomachMl: a.stomach.map((s) => ESPRESSO_ML * s / doseMg),
    conc,
    hr: new Float64Array(n).fill(p.restingHr), // [V1] no change at rest at 1.5–3 mg/kg
    sbp: sbpRise.map((d) => p.sbp + d),
    dbp: sbpRise.map((d) => p.dbp + d * DBP_PER_SBP),
    glucose: new Float64Array(n).fill(p.glucoseMgDl), // [V3] 0.5 g carbohydrate, 0 g sugar per shot
    spo2: new Float64Array(n).fill(p.spo2), // [V4] no mechanism or data for a change
    vdL, halfLifeH, tmaxMin: argmax(a.body), peakConc,
  };
}

/** Value at fractional minute t (linear interpolation). */
export function at(series: Float64Array, t: number): number {
  const i = Math.max(0, Math.min(series.length - 1, t));
  const i0 = Math.floor(i), i1 = Math.min(series.length - 1, i0 + 1), f = i - i0;
  return series[i0] * (1 - f) + series[i1] * f;
}
