import { describe, expect, it } from 'vitest';
import { amountEliminated, amountInBody, amountInGut, concentration, kaFromTmax, keFromHalfLife, tmax } from './pk';
import { caffeineHalfLife, caffeineParams, DEFAULT_PERSON } from './caffeine';

describe('one-compartment model', () => {
  it('solves ka for a requested tmax', () => {
    const ke = keFromHalfLife(6);
    const ka = kaFromTmax(ke, 0.75);
    expect(tmax(ka, ke)).toBeCloseTo(0.75, 6);
  });

  it('conserves mass: gut + body + eliminated = dose', () => {
    const p = caffeineParams(63);
    for (const t of [0.1, 0.5, 1, 3, 8, 24]) {
      expect(amountInGut(p, t) + amountInBody(p, t) + amountEliminated(p, t)).toBeCloseTo(63, 9);
    }
  });

  it('halves every half-life once absorption is over', () => {
    const p = caffeineParams(63);
    expect(amountInBody(p, 16) / amountInBody(p, 10)).toBeCloseTo(0.5, 3);
  });
});

describe('caffeine (research/espresso.md)', () => {
  it('peaks at 45 min [D2]', () => {
    const p = caffeineParams(63);
    let best = 0, bestT = 0;
    for (let t = 0; t <= 3; t += 0.001) { const c = concentration(p, t); if (c > best) { best = c; bestT = t; } }
    expect(bestT).toBeCloseTo(0.75, 2);
  });

  it('peak ≈ 1.2 mg/L for 63 mg in a 70 kg adult (model estimate)', () => {
    const p = caffeineParams(63);
    expect(concentration(p, 0.75)).toBeGreaterThan(1.0);
    expect(concentration(p, 0.75)).toBeLessThan(1.4);
  });

  it('agrees with "99% absorbed within 45 min" [D3] using only tmax = 45 min [D2]', () => {
    // Two independent published numbers: tmax fixes ka, and that ka must reproduce near-complete absorption.
    const p = caffeineParams(63);
    const absorbed = 1 - amountInGut(p, 0.75) / 63;
    expect(absorbed).toBeGreaterThan(0.97);
  });

  it('leaves ≈ 28 mg at 7 h and ≈ 20 mg at 10 h [S4]', () => {
    const p = caffeineParams(63);
    expect(amountInBody(p, 7)).toBeGreaterThan(27);
    expect(amountInBody(p, 7)).toBeLessThan(31);
    expect(amountInBody(p, 10)).toBeGreaterThan(19);
    expect(amountInBody(p, 10)).toBeLessThan(22);
  });

  it('applies person modifiers [M6–M9]', () => {
    expect(caffeineHalfLife({ ...DEFAULT_PERSON, smoker: true })).toBeCloseTo(3.5, 6);
    expect(caffeineHalfLife({ ...DEFAULT_PERSON, oralContraceptives: true })).toBeCloseTo(6 * 10.7 / 6.2, 6);
    expect(caffeineHalfLife({ ...DEFAULT_PERSON, latePregnancy: true })).toBeCloseTo(15.4, 1);
  });
});
