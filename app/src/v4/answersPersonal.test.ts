import { describe, expect, it } from 'vitest';
import { quickAnswers, type AnswerInput } from './Answers';
import { personalNotes } from '../science/personal';
import { DEFAULT_PROFILE } from '../science/profile';

const base: AnswerInput = { systems: [], drinkAt: 18 * 60, bedtimeMin: 23 * 60, weightKg: 70, kcal: 200, extraSleepMin: 0, caffeineAtBedMg: 40, waterMl: 0, latestForSleep: 15 * 60 };
const curve = (f: (m: number) => number) => Float64Array.from({ length: 1441 }, (_, m) => f(m));
const find = (l: ReturnType<typeof quickAnswers>, q: string) => l.find((x) => x.q === q)!;

describe('quick answers say when they are personalised', () => {
  it('without a profile: no "for you" tags (old behaviour)', () => {
    expect(quickAnswers(base).some((x) => x.tag === 'you')).toBe(false);
  });
  it('sleep and timing: "for you", with the person’s own half-life and the reason', () => {
    const l = quickAnswers({ ...base, personal: personalNotes({ ...DEFAULT_PROFILE, smoker: true }, 3.5) });
    expect(find(l, 'Will I sleep well?').tag).toBe('you');
    expect(find(l, 'Will I sleep well?').note).toMatch(/3\.5 h \(you smoke\)/);
    expect(find(l, 'When is the best time?').tag).toBe('you');
  });
  it('sugar always stays "typical" even with a profile', () => {
    const g = curve((m) => 2.3 * 18.016 * Math.exp(-(((m - 30) / 15) ** 2)));
    const a = find(quickAnswers({ ...base, glucoseDeltaMgDl: g, personal: personalNotes(DEFAULT_PROFILE, 6) }), 'Will my blood sugar jump?');
    expect(a.tag).toBe('typical');
  });
  it('alcohol after a meal: the driving answer says the peak is about half; pregnancy adds a clear warning', () => {
    const bac = curve((m) => Math.max(0, Math.min(0.3, m / 60) - 0.15 * Math.max(0, m - 60) / 60));
    const her = { ...DEFAULT_PROFILE, sex: 'female' as const, withMeal: true, latePregnancy: true };
    const l = quickAnswers({ ...base, bac, personal: personalNotes(her, 15) });
    expect(find(l, 'Can I drive?').note).toMatch(/40–57%/);
    expect(find(l, 'Can I drive?').a).toMatch(/Don’t drive/);
    expect(find(l, 'And in pregnancy?').tone).toBe(2);
  });
});
