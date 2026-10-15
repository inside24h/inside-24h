import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE, healthyTwin, totalBodyWaterL } from './profile';
import { at, simulateEspresso } from './espressoSim';

const sim = simulateEspresso(63, DEFAULT_PROFILE);

describe('Watson total body water', () => {
  it('matches hand calculation for the default man', () => {
    // 2.447 − 0.09516·35 + 0.1074·175 + 0.3362·70 = 41.45 L
    expect(totalBodyWaterL(DEFAULT_PROFILE)).toBeCloseTo(41.45, 2);
  });
  it('women: −2.097 + 0.1069·165 + 0.2466·60 = 30.34 L', () => {
    expect(totalBodyWaterL({ sex: 'female', ageY: 30, heightCm: 165, weightKg: 60 })).toBeCloseTo(30.3375, 4);
  });
});

describe('espresso simulation', () => {
  it('conserves caffeine at every minute', () => {
    for (const t of [0, 5, 30, 120, 600, 1440]) {
      const total = sim.stomach[t] + sim.intestine[t] + sim.body[t] + sim.metabolites[t] + sim.cleared[t];
      expect(total).toBeCloseTo(63, 6);
    }
  });
  it('empties half the stomach in 13 minutes [G1]', () => {
    expect(at(sim.stomach, 13) / 63).toBeCloseTo(0.5, 2);
  });
  it('peaks in blood inside the published 30–120 min window [D2]', () => {
    // Gastric emptying (t½ 13 min) limits how early the peak can be: ≈ 65–75 min here.
    expect(sim.tmaxMin).toBeGreaterThanOrEqual(60);
    expect(sim.tmaxMin).toBeLessThanOrEqual(80);
  });
  it('uses Vd = 45.5 L for the default 70 kg man [D5]', () => {
    expect(sim.vdL).toBeCloseTo(45.5, 6);
  });
  it('peak blood level about 1.1–1.3 mg/L', () => {
    expect(sim.peakConc).toBeGreaterThan(1.0);
    expect(sim.peakConc).toBeLessThan(1.35);
  });
  it('raises systolic BP by 7 mmHg at the peak of a 3 mg/kg dose [V2], ~2 mmHg for one espresso [F9]', () => {
    const big = simulateEspresso(3 * 70, DEFAULT_PROFILE);
    expect(Math.max(...big.sbp) - DEFAULT_PROFILE.sbp).toBeCloseTo(7, 6);
    const rise = Math.max(...sim.sbp) - DEFAULT_PROFILE.sbp;
    expect(rise).toBeGreaterThan(1.5);
    expect(rise).toBeLessThan(2.5);
  });
  it('leaves about 28 mg at 7 h [S4]', () => {
    expect(sim.body[420]).toBeGreaterThan(26);
    expect(sim.body[420]).toBeLessThan(31);
  });
  it('healthy twin keeps body size but resets modifiers and vitals', () => {
    const twin = healthyTwin({ ...DEFAULT_PROFILE, weightKg: 95, smoker: true, sbp: 140 });
    expect(twin.weightKg).toBe(95);
    expect(twin.smoker).toBe(false);
    expect(twin.sbp).toBe(115);
  });
});
