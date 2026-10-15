import { describe, expect, it } from 'vitest';
import { nextStep, quickAnswers, type AnswerInput } from './Answers';
import type { System } from './status';

const base: AnswerInput = { systems: [], drinkAt: 18 * 60, bedtimeMin: 23 * 60, weightKg: 70, kcal: 200, extraSleepMin: 0, caffeineAtBedMg: 0, waterMl: 0 };
const curve = (f: (m: number) => number) => Float64Array.from({ length: 1441 }, (_, m) => f(m));
const sys = (key: System['key'], level: 0 | 1 | 2, tip: System['tip']): System =>
  ({ key, label: key, organ: 'brain', levels: new Uint8Array(1441).fill(level), says: () => '', rule: '', tip });

describe('quick answers: honest about what we cannot know', () => {
  it('driving: never a clock time or a single blood-alcohol number; always "don’t drive"', () => {
    const bac = curve((m) => Math.max(0, Math.min(0.6, m / 60) - 0.12 * Math.max(0, m - 60) / 60)); // peak 0.6 at 1 h
    const a = quickAnswers({ ...base, bac }).find((x) => x.q === 'Can I drive?')!;
    expect(a.a).toMatch(/Don’t drive after drinking — this can’t tell you when you’re safe/);
    expect(a.a).not.toMatch(/\d{2}:\d{2}/); // no "safe from 21:40"
    expect(a.a).toMatch(/0\.36–0\.84 ‰/); // ±40% range around the 0.6 peak
    expect(a.tone).toBe(2);
  });
  it('sugar: a range and a "typical, not personalised" label', () => {
    const g = curve((m) => 2.3 * 18.016 * Math.exp(-(((m - 30) / 15) ** 2)));
    const a = quickAnswers({ ...base, glucoseDeltaMgDl: g }).find((x) => x.q === 'Will my blood sugar jump?')!;
    expect(a.a).toMatch(/\+1\.4–3\.2 mmol\/L/);
    expect(a.note).toBe('Typical response, not personalised');
  });
  it('next step: the worst light’s tip; the alcohol tip is not repeated next to the driving answer', () => {
    const energy = sys('energy', 1, () => 'sugarSpike');
    const brain = sys('brain', 2, () => 'alcohol');
    expect(nextStep([energy, brain], false)!.key).toBe('alcohol');
    expect(nextStep([energy, brain], true)!.key).toBe('sugarSpike');
    expect(nextStep([sys('heart', 0, () => null)], false)).toBeNull();
  });
});
