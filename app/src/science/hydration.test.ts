import { describe, expect, it } from 'vitest';
import { bsa, lossPerM2, simulateHydration, tempAt } from './hydration';
import { DEFAULT_PROFILE } from './profile';

const asleep = new Float64Array(1441);

describe('hydration', () => {
  it('body surface area 175 cm / 70 kg ≈ 1.85 m² (H14)', () => expect(bsa(DEFAULT_PROFILE)).toBeCloseTo(1.85, 2));
  it('loss per m² matches Meade 2024 at 22/26/31/36 °C', () => {
    expect(lossPerM2(22)).toBe(20); expect(lossPerM2(26)).toBe(26); expect(lossPerM2(31)).toBe(31); expect(lossPerM2(36)).toBeCloseTo(80, 0);
  });
  it('daily cycle: coolest at 06:00, warmest at 15:00', () => {
    const c = { tmin: 20, tmax: 30, rh: 50 };
    expect(tempAt(c, 6 * 60)).toBeCloseTo(20, 5);
    expect(tempAt(c, 15 * 60)).toBeCloseTo(30, 5);
    expect(tempAt(c, 3 * 60)).toBeGreaterThan(20);
  });
  it('a mild day costs nothing extra; at 36 °C you lose ≈ (80 − 20) × 1.85 = 111 ml/h more (hydration-climate.md)', () => {
    const mild = simulateHydration(DEFAULT_PROFILE, { tmin: 10, tmax: 20, rh: 60 }, 250, 13, asleep);
    expect(mild.extraPerDayMl).toBe(0);
    expect(mild.percent[1440]).toBe(100);
    const hot = simulateHydration(DEFAULT_PROFILE, { tmin: 36, tmax: 36, rh: 40 }, 0, 13, asleep);
    expect(hot.extraLossMl[60]).toBeGreaterThan(105);
    expect(hot.extraLossMl[60]).toBeLessThan(118);
    // 1400 ml (2% of 70 kg) lost after ≈ 13 h → red by the end of the day
    expect(hot.percent[1440]).toBe(0);
  });
  it('air-con caps the air at 24 °C', () => {
    const ac = simulateHydration({ ...DEFAULT_PROFILE }, { tmin: 30, tmax: 40, rh: 40 }, 0, 13, asleep, true);
    expect(ac.extraPerDayMl).toBeLessThan(200);
  });
});
