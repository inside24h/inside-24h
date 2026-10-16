import { describe, expect, it } from 'vitest';
import { bacRangeText, glucoseRangeText, spread } from './ranges';

describe('ranges where people differ', () => {
  it('glucose: one can of cola (+2.3) → about +1.4 to +3.2, close to the measured ±1 SD (+1.4–3.4, cola.md B1)', () => {
    expect(glucoseRangeText(2.3)).toBe('+1.4–3.2');
  });
  it('alcohol: always a range, never one number', () => {
    // −40% / +50% (alcohol.md A12: Mitchell 2014 mean + 2 SD reaches +44% after vodka-tonic)
    expect(bacRangeText(0.27)).toBe('0.16–0.41 ‰');
    const [lo, hi] = spread(0.5, 0.4);
    expect(lo).toBeCloseTo(0.3); expect(hi).toBeCloseTo(0.7);
  });
});
