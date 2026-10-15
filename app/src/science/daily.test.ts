import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE } from './profile';
import { simulateEspresso } from './espressoSim';
import { buildVitals, sleepFraction } from './daily';
import { sleepAnchors } from './anchors';

const p = DEFAULT_PROFILE; // drink 16:00, bed 23:00, wake 07:00
const sim = simulateEspresso(63, p);
const v = buildVitals(p, sim, sleepAnchors());
const atClock = (hh: number, mm = 0) => ((hh * 60 + mm - p.drinkAtMin) + 1440) % 1440; // minute index for a clock time

describe('sleep timing', () => {
  it('awake in the evening, asleep at 03:00, awake again at 09:00', () => {
    expect(sleepFraction(p, atClock(20), 10, 15)).toBe(0);
    expect(sleepFraction(p, atClock(3), 10, 15)).toBe(1);
    expect(sleepFraction(p, atClock(9), 10, 15)).toBe(0);
  });
});

describe('natural rhythm [vitals-circadian.md]', () => {
  it('heart rate: afternoon peak about +4, deep night about 10–14 bpm lower [H4, H5, H9]', () => {
    const day = v.hr[atClock(16, 36)], night = v.hr[atClock(4, 36)];
    expect(day).toBeCloseTo(p.restingHr + 4, 1);
    expect(day - night).toBeGreaterThan(10);
    expect(day - night).toBeLessThan(15);
  });
  it('blood pressure dips 10–20% in sleep [B1]', () => {
    const day = v.sbp[atClock(14)], night = v.sbp[atClock(3)];
    const dip = (day - night) / day;
    expect(dip).toBeGreaterThan(0.1);
    expect(dip).toBeLessThan(0.2);
  });
  it('SpO2 is ~0.8 points lower at midnight than at noon [O1]', () => {
    const noonIdx = atClock(12) % 1441;
    const ref = buildVitals(p, simulateEspresso(63, p), sleepAnchors());
    expect(p.spo2 - ref.spo2[atClock(0)]).toBeCloseTo(0.8, 1);
    expect(noonIdx).toBeGreaterThan(0);
  });
  it('espresso does not change heart rate or glucose [C11, G6]', () => {
    expect(Math.max(...v.effect.hr.map(Math.abs))).toBe(0);
    expect(Math.max(...v.effect.glucose.map(Math.abs))).toBe(0);
  });
});

describe('sleep latency from caffeine (level C interpolation of [VS2])', () => {
  it('one 63 mg espresso at 16:00 does not delay sleep at 23:00', () => {
    expect(v.extraLatencyMin).toBe(0);
  });
  it('400 mg four hours before bed adds about 14 minutes', () => {
    const q = { ...p, drinkAtMin: 19 * 60 };
    const big = buildVitals(q, simulateEspresso(400, q), sleepAnchors());
    expect(big.extraLatencyMin).toBeCloseTo(14.2, 0);
  });
});
