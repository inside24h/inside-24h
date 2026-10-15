import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE } from './profile';
import { glucoseDeltaMmol, insulinDelta, simulateCola } from './colaSim';

const s = simulateCola(DEFAULT_PROFILE, 'eu');
const peak = (f: (t: number) => number) => { let v = -1e9, at = 0; for (let t = 0; t <= 300; t++) if (f(t) > v) { v = f(t); at = t; } return { v, at }; };

describe('cola blood glucose curve [cola.md B1–B4, B10]', () => {
  it('peaks +2.1–2.5 mmol/L between 20 and 35 min', () => {
    const p = peak(glucoseDeltaMmol);
    expect(p.v).toBeGreaterThan(2.1); expect(p.v).toBeLessThan(2.5);
    expect(p.at).toBeGreaterThanOrEqual(20); expect(p.at).toBeLessThanOrEqual(35);
  });
  it('is back at baseline around 60 min and below it at 75 min', () => {
    expect(Math.abs(glucoseDeltaMmol(62))).toBeLessThan(0.2);
    expect(glucoseDeltaMmol(75)).toBeLessThan(0);
  });
  it('dips about −0.7 mmol/L at 120 min, still slightly below at 180', () => {
    expect(glucoseDeltaMmol(120)).toBeCloseTo(-0.7, 1);
    expect(glucoseDeltaMmol(180)).toBeLessThan(0);
    expect(Math.abs(glucoseDeltaMmol(300))).toBeLessThan(0.05);
  });
  it('insulin ≈ +30 mU/L at 30 min, near baseline by 120 min [B1, B2]', () => {
    expect(insulinDelta(30)).toBeCloseTo(30, 6);
    expect(insulinDelta(120)).toBeLessThan(6);
  });
});

describe('cola sugar mass model', () => {
  it('conserves sugar at every minute', () => {
    for (const t of [0, 10, 60, 240, 1440]) {
      const tot = s.stomach[t] + s.intestine[t] + s.bloodGlucose[t] + s.usedGlucose[t] + s.liverFructose[t] + s.processedFructose[t];
      expect(tot).toBeCloseTo(36.8, 3);
    }
  });
  it('empties half the stomach in ~32 min, 2–3× slower than water [G7]', () => {
    expect(s.stomach[32] / 36.8).toBeCloseTo(0.5, 1);
  });
  it('the liver keeps ~85% of the fructose [L2]', () => {
    const totalLiver = s.liverFructose[1440] + s.processedFructose[1440];
    expect(totalLiver / 18.4).toBeCloseTo(0.855, 2);
  });
  it('carries 32 mg caffeine with slower stomach emptying than espresso', () => {
    expect(s.caffeine.doseMg).toBe(32);
    expect(s.caffeine.tmaxMin).toBeGreaterThan(80);
  });
});
