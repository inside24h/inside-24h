// Natural 24 h rhythm of vital signs, plus the drink's effect on top.
// Every parameter points to research/vitals-circadian.md (IDs in brackets).
import type { Timeline } from './espressoSim';
import type { Profile } from './profile';

const cosC = (clockH: number, peakH: number) => Math.cos((2 * Math.PI * (clockH - peakH)) / 24);
const smooth = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };

export const SLEEP = {
  baseLatencyMin: 10, // time from bedtime to sleep onset without caffeine (level C, typical value)
  onsetRampMin: 20, // [model] sleep deepens over ~20 min (C; H7 stepwise falls)
  wakeRampMin: 15, // HR, SpO2, glucose return within ~15 min of waking (C)
  bpWakeRampMin: 75, // BP returns to day level over 1–2 h → morning surge (B6, B8; C)
};
const HR_AMP = 4, HR_PEAK = 16.6; // [H4, H5] semi-amplitude 4 bpm, peak 16:36
const HR_SLEEP_DROP = 6; // [H9] 4–8 bpm, derived
const BP_DIP = 0.13; // [B1, B2] normal dip 10–20%
const BP_AMP = 2, BP_PEAK = 13.7; // [B3, B4] peak-to-trough 4 mmHg, trough 01:40
const GLU_SLEEP_DROP = 3; // [G2, G4] flat overnight; −3 mg/dL is a modelling choice (C)
const SPO2_AMP = 0.4, SPO2_PEAK = 12; // [O1] day 96.2 vs night 95.4, peak near noon

/** Minutes after midnight → hours on a 0–24 clock. */
const clockH = (min: number) => (((min / 60) % 24) + 24) % 24;

/** 0 = awake, 1 = asleep, for minute m after drinking. `ramp` sets how fast the value returns on waking. */
export function sleepFraction(p: Profile, m: number, latencyMin: number, wakeRampMin: number): number {
  const clock = ((p.drinkAtMin + m) % 1440 + 1440) % 1440;
  const onset = (p.bedtimeMin + latencyMin) % 1440;
  const wake = p.wakeMin % 1440;
  // minutes since sleep onset and since waking, on a 24 h circle
  const since = (from: number) => ((clock - from) % 1440 + 1440) % 1440;
  const sleepLen = ((wake - onset) % 1440 + 1440) % 1440;
  const sOn = since(onset);
  if (sOn < sleepLen) return smooth(sOn / SLEEP.onsetRampMin); // asleep (deepening)
  const sWake = sOn - sleepLen; // minutes since waking
  return 1 - smooth(sWake / wakeRampMin);
}

/** Extra minutes to fall asleep from caffeine still in the body at bedtime (level C interpolation).
 *  [VS2] 100 mg taken 4 h before bed: no measurable effect. 400 mg 4 h before bed: +14.2 min sleep latency.
 *  We interpolate linearly on blood caffeine at bedtime (mg/L) between those two anchors. */
export function caffeineLatencyMin(concAtBed: number, anchors: { none: number; full: number }): number {
  if (concAtBed <= anchors.none) return 0;
  return Math.min(1.5, (concAtBed - anchors.none) / (anchors.full - anchors.none)) * 14.2;
}

export interface Vitals {
  hr: Float64Array; sbp: Float64Array; dbp: Float64Array; glucose: Float64Array; spo2: Float64Array;
  asleep: Float64Array; // 0..1 per minute, for shading
  effect: { hr: Float64Array; sbp: Float64Array; dbp: Float64Array; glucose: Float64Array; spo2: Float64Array };
  latencyMin: number; extraLatencyMin: number; mgAtBed: number;
}

/** Body rhythm + the drink's effect. `sim` provides the caffeine-driven changes (BP) and caffeine left at bedtime. */
/** Extra effects a product adds on top of its caffeine: per-minute deltas, and a factor on caffeine's BP effect
 *  (cola: sugar cancels caffeine's BP rise, cola.md H1 → 0). */
export interface ProductEffects { hr?: Float64Array; glucoseMgDl?: Float64Array; bpScale?: number; bp?: Float64Array }

export function buildVitals(p: Profile, sim: Timeline, anchors: { none: number; full: number }, withDrink = true, fx: ProductEffects = {}): Vitals {
  const n = sim.minutes + 1;
  const toBed = (p.bedtimeMin - p.drinkAtMin + 1440) % 1440;
  const mgAtBed = withDrink ? sim.body[Math.min(sim.minutes, toBed)] : 0;
  // compare blood concentration (what the brain sees), so body size is accounted for
  const extra = withDrink ? caffeineLatencyMin(sim.conc[Math.min(sim.minutes, toBed)], anchors) : 0;
  const latency = SLEEP.baseLatencyMin + extra;
  const mk = () => new Float64Array(n);
  const v: Vitals = { hr: mk(), sbp: mk(), dbp: mk(), glucose: mk(), spo2: mk(), asleep: mk(),
    effect: { hr: mk(), sbp: mk(), dbp: mk(), glucose: mk(), spo2: mk() }, latencyMin: latency, extraLatencyMin: extra, mgAtBed };
  for (let m = 0; m < n; m++) {
    const h = clockH(p.drinkAtMin + m);
    const s = sleepFraction(p, m, latency, SLEEP.wakeRampMin);
    const sBp = sleepFraction(p, m, latency, SLEEP.bpWakeRampMin);
    // caffeine-driven BP rise, from the espresso simulation [V2, F9]; HR effect 0 [C11]; glucose 0 [G6]; SpO2 0 [O4]
    const bpScale = fx.bpScale ?? 1;
    const extraBp = withDrink && fx.bp ? fx.bp[m] : 0; // non-caffeine BP effect (e.g. water's pressor response)
    const dS = withDrink ? (sim.sbp[m] - sim.sbp[0]) * bpScale + extraBp : 0;
    const dD = withDrink ? (sim.dbp[m] - sim.dbp[0]) * bpScale + extraBp : 0;
    const dHr = withDrink && fx.hr ? fx.hr[m] : 0;
    const dG = withDrink && fx.glucoseMgDl ? fx.glucoseMgDl[m] : 0;
    v.asleep[m] = s;
    v.hr[m] = p.restingHr + HR_AMP * cosC(h, HR_PEAK) - HR_SLEEP_DROP * s + dHr;
    v.sbp[m] = p.sbp * (1 - BP_DIP * sBp) + BP_AMP * cosC(h, BP_PEAK) + dS;
    v.dbp[m] = p.dbp * (1 - BP_DIP * sBp) + BP_AMP * cosC(h, BP_PEAK) + dD;
    v.glucose[m] = p.glucoseMgDl - GLU_SLEEP_DROP * s + dG;
    v.spo2[m] = p.spo2 + SPO2_AMP * (cosC(h, SPO2_PEAK) - 1);
    v.effect.sbp[m] = dS; v.effect.dbp[m] = dD; v.effect.hr[m] = dHr; v.effect.glucose[m] = dG;
  }
  return v;
}
