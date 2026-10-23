// Minute-by-minute simulation of one espresso in one person.
// Compartments (mg caffeine): stomach → small intestine → body water → broken down → cleared.
// Every rate constant is tied to a claim in research/espresso.md.
import { DEFAULT_PROFILE, totalBodyWaterL, type Profile } from './profile';
import { caffeineBpFactor } from './personal';

const LN2 = Math.LN2;

export const ESPRESSO_ML = 30;
export const GASTRIC_HALF_MIN = 13; // [G1] Mudie 2014: water T50 13 ± 1 min; [G2] Grimm 2023: 20 mL empties at a similar relative rate
const CAFFEINE_HALF_H = 6.0; // [M6, M7] non-smoking controls
// Absorption from the small intestine. Caffeine is highly permeable, so absorption is assumed fast
// (half-time 5 min, level C). With the stomach as the only route the peak came at ≈ 74 min; part of the caffeine is
// also absorbed through the stomach wall (CAFFEINE_GASTRIC_SHARE below), which puts a shot's peak at ≈ 42 min [D2, G3].
const INTESTINE_HALF_MIN = 5;
// MODEL REVIEW 2026-10-20 (research/improvements/model-review-2026-10-20.md): with the stomach as the only gate the
// model peaked at 74 min for a shot, but measured peaks for water-like vehicles are earlier: coffee 42 ± 5 min (saliva,
// n = 13; Liguori 1997, PMID 9329065), capsules ≈ 30 min (plasma, n = 7; Mumford 1996, PMID 9010706), 29 ± 12 min
// fasted (n = 12; Wildgrube 2026, ML3). Caffeine is absorbed mainly in the small intestine "but also in the stomach"
// (ISSN position stand 2021, PMC7777221). So part of the caffeine goes straight from the stomach into the blood, at a
// rate tied to the drink's own emptying: GASTRIC_SHARE is FITTED (C), not measured, so that a water-like drink peaks at
// ≈ 42 min and sugary cola later (1 can ≈ 74 min; ≈ 2 cans ≈ 90 min vs 1.5–2 h measured by Mumford 1996). The liquid
// itself still empties at the drink's half-time (stomachMl).
export const CAFFEINE_GASTRIC_SHARE = 0.55;
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
  // pill and pregnancy only for women (as personal.ts activeFactors; an old link could carry the flags for a man), and
  // never both: nobody is on the pill in late pregnancy, and stacking them gave a 27 h half-life (model review 2026-10-20)
  const woman = p.sex === 'female';
  if (woman && p.latePregnancy) h *= 1 / 0.39; // [M8, M9]
  else if (woman && p.oralContraceptives) h *= 10.7 / 6.2; // [M7]
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

/** kg: stomach → intestine; ks: stomach → blood directly (gastric absorption) */
interface Rates { kg: number; ks: number; ki: number; ke: number; km: number[] }

function integrate(doseMg: number, r: Rates, minutes: number) {
  const n = minutes + 1;
  const out = {
    stomach: new Float64Array(n), intestine: new Float64Array(n), body: new Float64Array(n),
    metabolites: new Float64Array(n), cleared: new Float64Array(n),
  };
  let S = doseMg, I = 0, B = 0, C = 0;
  // Same RK4 arithmetic in the same order as before, without allocating arrays in the inner loop (audit 2026-10-16:
  // the old version spent most of a food simulation creating short arrays).
  const K = r.km.length, share = METABOLITES.map((x) => x.share);
  const M = new Float64Array(K), mt = new Float64Array(K);
  const d = [new Float64Array(K), new Float64Array(K), new Float64Array(K), new Float64Array(K)];
  const ds = [0, 0, 0, 0], di = [0, 0, 0, 0], db = [0, 0, 0, 0], dcs = [0, 0, 0, 0];
  const sub = 20, h = 1 / sub; // 3-second steps, explicit RK4 on the linear system
  const deriv = (q: number, s: number, i: number, b: number, m: Float64Array) => {
    const dm = d[q];
    let dc = 0;
    for (let k = 0; k < K; k++) { dm[k] = r.ke * b * share[k] - r.km[k] * m[k]; }
    for (let k = 0; k < K; k++) dc = dc + r.km[k] * m[k];
    ds[q] = -(r.kg + r.ks) * s; di[q] = r.kg * s - r.ki * i; db[q] = r.ks * s + r.ki * i - r.ke * b; dcs[q] = dc;
  };
  const shift = (q: number, f: number) => { for (let j = 0; j < K; j++) mt[j] = M[j] + f * d[q][j]; return mt; };
  for (let t = 0; t < n; t++) {
    out.stomach[t] = S; out.intestine[t] = I; out.body[t] = B;
    let msum = 0; for (let j = 0; j < K; j++) msum = msum + M[j];
    out.metabolites[t] = msum; out.cleared[t] = C;
    for (let k = 0; k < sub; k++) {
      deriv(0, S, I, B, M);
      deriv(1, S + h / 2 * ds[0], I + h / 2 * di[0], B + h / 2 * db[0], shift(0, h / 2));
      deriv(2, S + h / 2 * ds[1], I + h / 2 * di[1], B + h / 2 * db[1], shift(1, h / 2));
      deriv(3, S + h * ds[2], I + h * di[2], B + h * db[2], shift(2, h));
      S += h / 6 * (ds[0] + 2 * ds[1] + 2 * ds[2] + ds[3]);
      I += h / 6 * (di[0] + 2 * di[1] + 2 * di[2] + di[3]);
      B += h / 6 * (db[0] + 2 * db[1] + 2 * db[2] + db[3]);
      for (let j = 0; j < K; j++) M[j] += h / 6 * (d[0][j] + 2 * d[1][j] + 2 * d[2][j] + d[3][j]);
      C += h / 6 * (dcs[0] + 2 * dcs[1] + 2 * dcs[2] + dcs[3]);
    }
  }
  return out;
}

const argmax = (a: Float64Array) => a.reduce((best, v, i) => (v > a[best] ? i : best), 0);

/** Caffeine in any drink. `gastricHalfMin` = how fast that drink leaves the stomach (water-like 13 min [G1]; cola ≈ 32 min, cola.md G7). */
export function simulateEspresso(doseMg: number, p: Profile, minutes = 1440, gastricHalfMin = GASTRIC_HALF_MIN,
  /** for building blocks only (foodSim pacedCaffeine): share absorbed through the stomach wall, intestinal half-time */
  opts: { gastricShare?: number; intestineHalfMin?: number } = {}): Timeline {
  const halfLifeH = caffeineHalfLifeH(p);
  const kg = LN2 / gastricHalfMin;
  const share = opts.gastricShare ?? CAFFEINE_GASTRIC_SHARE;
  const ks = (kg * share) / (1 - share); // so that `share` of what leaves the stomach goes straight into the blood
  const ke = LN2 / (halfLifeH * 60);
  const ki = LN2 / (opts.intestineHalfMin ?? INTESTINE_HALF_MIN);
  const km = METABOLITES.map((m) => LN2 / (m.halfH * 60));
  const a = integrate(doseMg, { kg, ks, ki, ke, km }, minutes);
  const vdL = volumeOfDistributionL(p);
  const n = minutes + 1;
  const conc = a.body.map((b) => b / vdL);
  const peakConc = conc.reduce((m, v) => Math.max(m, v), 0);
  const conc3mgkg = peakConc * (3 * p.weightKg) / doseMg; // linear model: peak for a 3 mg/kg dose
  // daily caffeine users: about half the BP rise on average [Y2–Y4] Robertson 1981, Lovallo 2004 (B)
  const sbpRise = conc.map((c) => SBP_AT_3MGKG * caffeineBpFactor(p) * c / conc3mgkg);
  return {
    doseMg, minutes, ...a,
    // the LIQUID in the stomach empties at the drink's own half-time [G1]; the caffeine in it leaves faster, because
    // part of it is absorbed through the stomach wall (stomach[] = caffeine still in the stomach)
    stomachMl: a.stomach.map((_, t) => ESPRESSO_ML * Math.pow(2, -t / gastricHalfMin)),
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
