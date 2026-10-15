import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE } from './profile';
import { simulateWater, waterSbpDelta } from './waterSim';

const w = simulateWater(DEFAULT_PROFILE);

describe('water, 250 ml [water.md]', () => {
  it('conserves the 250 ml', () => {
    for (const t of [0, 10, 60, 240, 1440]) expect(w.stomach[t] + w.intestine[t] + w.body[t] + w.bladder[t]).toBeCloseTo(250, 6);
  });
  it('half has left the stomach at 13 min [A1]', () => {
    expect(w.stomach[13] / 250).toBeCloseTo(0.5, 2);
  });
  it('is almost fully absorbed by 90 min [A5]', () => {
    expect((w.body[90] + w.bladder[90]) / 250).toBeGreaterThan(0.9);
  });
  it('most of it has left through the kidneys by 4 h (level C, scaled from 1 L [B6])', () => {
    expect(w.bladder[240] / 250).toBeGreaterThan(0.8);
  });
  it('blood pressure rise stays within 0–2 mmHg [V6]', () => {
    let max = 0; for (let t = 0; t < 300; t++) max = Math.max(max, waterSbpDelta(t));
    expect(max).toBeGreaterThan(1); expect(max).toBeLessThanOrEqual(2);
  });
});
