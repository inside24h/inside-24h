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

/** Minutes from the drink to lights-out. A drink taken during the usual sleep time (after bedtime, before waking,
 *  e.g. 23:50 with bedtime 23:00) means you go to bed right after it: 0, not "tomorrow's bedtime" ~23 h later.
 *  Without this, wine or an espresso just after the set bedtime was judged against the next night (wave 6). */
export function minutesToBed(p: { drinkAtMin: number; bedtimeMin: number; wakeMin?: number }): number {
  const toBed = ((p.bedtimeMin - p.drinkAtMin) % 1440 + 1440) % 1440;
  const sleepLen = (((p.wakeMin ?? 7 * 60) - p.bedtimeMin) % 1440 + 1440) % 1440;
  return toBed > 0 && toBed > 1440 - sleepLen ? 0 : toBed;
}

/** Alcohol and sleep, by dose (g of alcohol per kg of body weight), one wording for every screen.
 *  Direction [AL6, A]: at every dose you fall asleep faster but the second half of the night is more broken; total
 *  dream (REM) sleep falls at moderate and high doses (Ebrahim 2013 review). Size [AL8, B]: heart "recovery" during
 *  the first 3 h of sleep fell by 9, 24 and 39 points after low (≤ 0.25 g/kg), moderate and high (> 0.75 g/kg)
 *  intake (Pietilä 2018, 4,098 people, observational). Using Pietilä's g/kg bands for Ebrahim's dose words is our
 *  assumption (C). */
export type AlcoholSleepTier = 'low' | 'moderate' | 'high';
export const alcoholSleepTier = (gPerKg: number): AlcoholSleepTier => (gPerKg > 0.75 ? 'high' : gPerKg > 0.25 ? 'moderate' : 'low');
export function alcoholSleepSentence(tier: AlcoholSleepTier): string {
  // two sentences, so the short caption (share.ts captionOf) still carries the meaning, not only the number (wave 7)
  if (tier === 'high') return 'You may fall asleep faster, but the second half of the night will be clearly broken. You’ll get less dream (REM) sleep, and your heart rests much less in the first hours.';
  if (tier === 'moderate') return 'You may fall asleep faster, but the second half of the night will be lighter and more broken. You’ll likely get less dream (REM) sleep, and your heart rests less.';
  return 'You may fall asleep faster, but the second half of the night will be a little lighter and more broken. With one drink the effect is small; more drinks make it bigger.';
}
/** Extra sentence for a meal or drink with BOTH alcohol and caffeine near bed: the alcohol answer leads, and this adds
 *  the caffeine when it is above its own threshold (sleepRiskOf), with the same words as the caffeine-only answers
 *  (VS1–VS4). Empty when the caffeine is too low to matter (wave 7). */
export function caffeineAlsoSentence(risk: SleepRisk, extraLatencyMin: number): string {
  if (risk === 'delay' && extraLatencyMin >= 5) return ` Its caffeine may also add about ${Math.round(extraLatencyMin)} min to the time it takes you to fall asleep.`;
  if (risk !== 'none') return ' It also has some caffeine, which may make your sleep a little lighter if caffeine affects you easily.';
  return '';
}

/** Extra minutes to fall asleep from caffeine still in the body at bedtime (level C interpolation).
 *  [VS2] 100 mg taken 4 h before bed: no measurable effect. 400 mg 4 h before bed: +14.2 min sleep latency.
 *  We interpolate linearly on blood caffeine at bedtime (mg/L) between those two anchors. */
export function caffeineLatencyMin(concAtBed: number, anchors: { none: number; full: number }): number {
  if (concAtBed <= anchors.none) return 0;
  return Math.min(1.5, (concAtBed - anchors.none) / (anchors.full - anchors.none)) * 14.2;
}

/** Minutes after lights-out over which we look at blood caffeine ("falling asleep"). */
export const SLEEP_WINDOW_MIN = 90;
/** Blood caffeine the brain sees while you fall asleep: the HIGHEST level from bedtime to 90 min after. Taken late,
 *  caffeine is still rising at bedtime (it peaks ~45–60 min after drinking), and caffeine taken right at bedtime
 *  disrupted sleep [S2 Drake 2013], so the level at the bedtime minute alone would miss it. For caffeine taken
 *  hours earlier the level is already falling, so this equals the level at bedtime (the anchors are unchanged). */
export function sleepConc(conc: ArrayLike<number>, toBed: number): number {
  const last = conc.length - 1;
  let hi = 0;
  for (let m = Math.min(last, toBed); m <= Math.min(last, toBed + SLEEP_WINDOW_MIN); m++) hi = Math.max(hi, conc[m]);
  return hi;
}

/** What caffeine left at bedtime means for sleep, one scale for every screen:
 *  'delay'     the model predicts a longer time to fall asleep (above the "none" anchor, VS2/VS3);
 *  'sensitive' below that, but above the level the meta-analysis says can already cut sleep (VS1): most people
 *              sleep normally, caffeine-sensitive people may sleep less or more lightly (VS4);
 *  'none'      below both. */
export type SleepRisk = 'none' | 'sensitive' | 'delay';
export function sleepRiskOf(extraLatencyMin: number, conc: number, anchors: { cautious?: number }): SleepRisk {
  if (extraLatencyMin >= 1) return 'delay';
  return anchors.cautious !== undefined && conc > anchors.cautious ? 'sensitive' : 'none';
}
/** Risk and extra minutes for a caffeine run and a bedtime (minutes after the drink): for screens without vitals. */
export function sleepRiskAt(sim: Timeline, toBed: number, anchors: { none: number; full: number; cautious?: number }): { risk: SleepRisk; extra: number } {
  if (sim.doseMg < 1) return { risk: 'none', extra: 0 };
  const c = sleepConc(sim.conc, toBed);
  const extra = caffeineLatencyMin(c, anchors);
  return { risk: sleepRiskOf(extra, c, anchors), extra };
}
/** The sentence after "About N mg of caffeine is still in you", the same on every screen. */
export function sleepSentence(risk: SleepRisk, extraLatencyMin: number): string {
  if (risk === 'delay') return `You may need about ${Math.max(1, Math.round(extraLatencyMin))} min longer to fall asleep.`;
  if (risk === 'sensitive') return 'Most people sleep normally with this much, but if caffeine affects you easily, you may sleep a little less or more lightly.';
  return 'Too little to affect your sleep.';
}

export interface Vitals {
  hr: Float64Array; sbp: Float64Array; dbp: Float64Array; glucose: Float64Array; spo2: Float64Array;
  asleep: Float64Array; // 0..1 per minute, for shading
  effect: { hr: Float64Array; sbp: Float64Array; dbp: Float64Array; glucose: Float64Array; spo2: Float64Array };
  latencyMin: number; extraLatencyMin: number; mgAtBed: number;
  /** what the caffeine left at bedtime means for sleep (sleepRiskOf) */
  sleepRisk: SleepRisk;
  /** minutes from the drink to lights-out (minutesToBed): 0 when the drink comes after the usual bedtime */
  toBedMin?: number;
  /** blood caffeine of the cautious anchor (VS1): the night light stays yellow for the 'sensitive' tier only while the
   *  level is above it, not the whole night (wave 7) */
  cautiousConc?: number;
}

/** Body rhythm + the drink's effect. `sim` provides the caffeine-driven changes (BP) and caffeine left at bedtime. */
/** Extra effects a product adds on top of its caffeine: per-minute deltas, and a factor on caffeine's BP effect
 *  (cola: sugar cancels caffeine's BP rise, cola.md H1 → 0). */
export interface ProductEffects { hr?: Float64Array; glucoseMgDl?: Float64Array; bpScale?: number; bp?: Float64Array }

export function buildVitals(p: Profile, sim: Timeline, anchors: { none: number; full: number; cautious?: number }, withDrink = true, fx: ProductEffects = {}): Vitals {
  const n = sim.minutes + 1;
  const toBed = minutesToBed(p);
  const mgAtBed = withDrink ? sim.body[Math.min(sim.minutes, toBed)] : 0;
  // compare blood concentration (what the brain sees), so body size is accounted for
  const concSleep = withDrink ? sleepConc(sim.conc, toBed) : 0;
  const extra = withDrink ? caffeineLatencyMin(concSleep, anchors) : 0;
  const sleepRisk = withDrink && sim.doseMg >= 1 ? sleepRiskOf(extra, concSleep, anchors) : 'none';
  const latency = SLEEP.baseLatencyMin + extra;
  const mk = () => new Float64Array(n);
  const v: Vitals = { hr: mk(), sbp: mk(), dbp: mk(), glucose: mk(), spo2: mk(), asleep: mk(),
    effect: { hr: mk(), sbp: mk(), dbp: mk(), glucose: mk(), spo2: mk() }, latencyMin: latency, extraLatencyMin: extra, mgAtBed, sleepRisk, toBedMin: toBed, cautiousConc: anchors.cautious };
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
