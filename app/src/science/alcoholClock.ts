// When is the alcohol gone, and what is left at a given minute, for a typical body and across people
// (sense audit 2026-10-18; research/improvements/sense-audit-2026-10-18.md).
// Elimination is zero-order: the liver removes a fixed amount per hour once the enzyme is saturated (above ≈ 0.2 ‰),
// about 0.10–0.15 g/L/h fasted and 0.15–0.20 g/L/h after food (Jones 2010, PMID 20304569; claim AL2, A). Nothing in the
// model (or in the sources read) makes it faster during sleep. The typical curve is the model's own; the "fast" and
// "slow" livers re-run the same downslope at 0.20 and 0.10 g/L/h (C: same body water, only the liver speed changes).
import { BAC_SPREAD_UP } from './ranges';

/** Liver speeds most people fall inside, g/L (= ‰) per hour [AL2, Jones 2010]. */
export const ELIM_RANGE = { fast: 0.20, slow: 0.10 } as const;
/** "Gone" = below this (g/L): the same cut-off as the story's "Alcohol gone" chapter. */
export const GONE_GL = 0.005;
/** Lowest blood alcohol among deaths from acute alcohol poisoning, 5th percentile 2.2 ‰ (Jones & Holmgren 2003,
 *  693 deaths; claim AL9). The warning shows when the TOP of our range (model × 1.5) reaches it. */
export const POISON_GL = 2.2;
export const poisonRisk = (modelGl: number) => modelGl * (1 + BAC_SPREAD_UP) >= POISON_GL;

/** Clock time m minutes after the drink, with the day: "06:02 tomorrow", "13:03 the day after tomorrow"; further
 *  out only the hours ("about 59 h after the first sip"), never a wrong day name. */
export function clockLabel(drinkAtMin: number, m: number): string {
  const c = drinkAtMin + m, d = Math.floor(c / 1440);
  const hh = `${String(Math.floor(c / 60) % 24).padStart(2, '0')}:${String(Math.floor(c) % 60).padStart(2, '0')}`;
  return d === 0 ? hh : d === 1 ? `${hh} tomorrow` : d === 2 ? `${hh} the day after tomorrow` : `${Math.round(m / 60)} h after the first sip`;
}

export interface AlcoholClock {
  peak: number; peakMin: number;
  /** typical body: first minute below GONE_GL after the peak; extrapolated past 1440 when still there at 24 h */
  goneMin: number; beyond24: boolean;
  /** fastest and slowest livers (ELIM_RANGE) */
  earliestMin: number; latestMin: number;
  /** liver speed the model curve uses (g/L/h), read off the curve's straight downslope */
  beta: number;
  typicalAt: (m: number) => number; slowAt: (m: number) => number;
}

/** `pivotMin` (PACING, 2026-10-19): where the other livers' downslope starts. All at once that is the peak. Spread over
 *  hours the liver has been working since the first drink (Searle 2015: full elimination rate from the start of the
 *  session), so the pivot is where ONE round would peak (the all-at-once peak minute), not the late evening peak;
 *  otherwise a slow liver would look done too early. */
export function alcoholClock(bac: ArrayLike<number>, pivotMin?: number): AlcoholClock {
  const n = bac.length;
  let peak = 0, peakMin = 0;
  for (let t = 0; t < n; t++) if (bac[t] > peak) { peak = bac[t]; peakMin = t; }
  // the straight part of the downslope: from 150 min after the peak (distribution, half-time ≈ 28 min, is over;
  // 60 min for small amounts that are gone sooner) to where it reaches 0.05 g/L
  const slope = (from: number) => {
    const a = Math.min(n - 1, peakMin + from);
    let b = a; while (b < n - 1 && bac[b] > 0.05) b++;
    return b - a >= 30 ? Math.max(0.05, ((bac[a] - bac[b]) * 60) / (b - a)) : null;
  };
  const beta = slope(150) ?? slope(60) ?? 0.12;
  // gone = after the LAST minute with alcohol (the same as the first one after the peak for one curve; with rounds
  // spread far apart the blood can be clear between two of them)
  let gone = n - 1; while (gone > peakMin && bac[gone - 1] <= GONE_GL) gone--;
  const beyond24 = bac[n - 1] > GONE_GL;
  const goneMin = beyond24 ? n - 1 + (60 * bac[n - 1]) / beta : gone;
  // a liver at speed v clears the same downslope in (gone − peak) × beta / v
  const pv = pivotMin !== undefined ? Math.min(peakMin, Math.max(0, pivotMin)) : peakMin;
  const earliestMin = beta >= ELIM_RANGE.fast ? goneMin : Math.max(peakMin, pv + ((goneMin - pv) * beta) / ELIM_RANGE.fast);
  const latestMin = beta <= ELIM_RANGE.slow ? goneMin : pv + ((goneMin - pv) * beta) / ELIM_RANGE.slow;
  const typicalAt = (m: number) => {
    if (m <= n - 1) return bac[Math.max(0, Math.round(m))];
    return Math.max(0, bac[n - 1] - (beta * (m - (n - 1))) / 60);
  };
  // slow liver: from the same level one hour after the peak, a straight line down to zero at latestMin
  const a0 = peakMin + 60, la = typicalAt(a0);
  const slowAt = (m: number) => (m <= a0 ? typicalAt(m) : m >= latestMin || latestMin <= a0 ? 0 : (la * (latestMin - m)) / (latestMin - a0));
  return { peak, peakMin, goneMin, beyond24, earliestMin, latestMin, beta, typicalAt, slowAt };
}
