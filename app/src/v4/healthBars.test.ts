import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE } from '../science/profile';
import { healthBars } from './healthBars';

const get = (bars: ReturnType<typeof healthBars>, k: string) => bars.find((b) => b.key === k)!.value;

describe('health bars (our simplified scale)', () => {
  it('more activity raises life quality; none lowers it', () => {
    const lazy = get(healthBars({ ...DEFAULT_PROFILE, steps: 'low', exercise: 'none' }, {}), 'life');
    const active = get(healthBars({ ...DEFAULT_PROFILE, steps: 'high', exercise: 'regular' }, {}), 'life');
    expect(active - lazy).toBeGreaterThanOrEqual(6); // +7 cap, minus clamping at 100
    expect(active - lazy).toBeLessThanOrEqual(7);
  });
  it('starts from the profile: healthy BMI → fat 90+; overweight → lower', () => {
    expect(get(healthBars({ ...DEFAULT_PROFILE, steps: 'low' }, {}), 'fat')).toBe(90);
    expect(get(healthBars({ ...DEFAULT_PROFILE, weightKg: 95 }, {}), 'fat')).toBeLessThan(90);
  });
  it('one cola uses 70% of the WHO sugar budget', () => {
    expect(get(healthBars(DEFAULT_PROFILE, { cola: 1 }), 'sugar')).toBe(30);
  });
  it('one cola just today does not move long-term bars; a daily habit for years does', () => {
    const sedentary = { ...DEFAULT_PROFILE, steps: 'low' as const };
    const once = healthBars(sedentary, { cola: 1 }, { cola: { often: 'once', howLong: 'weeks' } });
    expect(get(once, 'fat')).toBe(90);
    const habit = healthBars(sedentary, { cola: 1 }, { cola: { often: 'daily', howLong: 'years' } });
    expect(get(habit, 'fat')).toBe(84);
    const walker = healthBars({ ...sedentary, kmPerWeek: 30 }, { cola: 1 }, { cola: { often: 'daily', howLong: 'years' } });
    expect(get(walker, 'fat')).toBeGreaterThan(84); // walking offsets the cola calories
    expect(get(habit, 'sugar')).toBe(30); // sugar is about today either way
  });
  it('a banana does not use the sugar budget; orange juice does (free sugars only)', () => {
    expect(get(healthBars(DEFAULT_PROFILE, { banana: 1 }), 'sugar')).toBe(100);
    expect(get(healthBars(DEFAULT_PROFILE, { juice: 1 }), 'sugar')).toBe(56);
  });
  it('smoking every day for years costs life quality; alcohol at bedtime costs sleep', () => {
    const smoker = healthBars(DEFAULT_PROFILE, { cigarettes: 10 }, { cigarettes: { often: 'daily', howLong: 'years' } });
    expect(get(smoker, 'life')).toBeLessThan(get(healthBars(DEFAULT_PROFILE, {}), 'life') - 7);
    const lateBeers = healthBars({ ...DEFAULT_PROFILE, drinkAtMin: 21 * 60 }, { beer: 3 });
    expect(get(lateBeers, 'sleep')).toBeLessThan(get(healthBars(DEFAULT_PROFILE, {}), 'sleep'));
  });
  it('water changes nothing', () => {
    expect(healthBars(DEFAULT_PROFILE, { water: 3 })).toEqual(healthBars(DEFAULT_PROFILE, {}));
  });
  it('one espresso at 16:00 does not hurt sleep; four do', () => {
    expect(get(healthBars(DEFAULT_PROFILE, { espresso: 1 }), 'sleep')).toBe(90);
    expect(get(healthBars(DEFAULT_PROFILE, { espresso: 4 }), 'sleep')).toBeLessThan(90);
  });
});
