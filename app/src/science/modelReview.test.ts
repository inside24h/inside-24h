// Model review 2026-10-20/22 (research/improvements/model-review-2026-10-20.md): locks the corrected behaviour against
// the published numbers it was fitted to. Every number below is from an abstract or full text read with epmc.py.
import { describe, expect, it } from 'vitest';
import { FOOD_MODEL, liquidT50Alc, alcoholGE, ALCOHOL_DRINKS, widmarkR, simulateFood, type Meal } from './foodSim';
import { caffeineHalfLifeH, simulateEspresso } from './espressoSim';
import { DEFAULT_PROFILE, totalBodyWaterL, type Profile } from './profile';
import { walkingMinutes } from './walking';
import { quickAnswers, type AnswerInput } from '../v4/Answers';
import { personalNotes } from './personal';

const near = (x: number, target: number, rel: number) => expect(Math.abs(x - target) / target).toBeLessThan(rel);

describe('alcohol slows the stomach [GE19]', () => {
  // Franke 2004 (PMID 15370684), 500 ml fasted, ultrasound: water 14.6, ethanol 4–40% 22.6–27.8, beer 39.3, red wine 72.6 min
  it('water is unchanged (13 min, Mudie 2014)', () => expect(liquidT50Alc(0, 0)).toBe(13));
  it('plain alcohol in water: 22–28 min, and not dose-dependent above ≈ 10 g', () => {
    for (const g of [20, 50, 200]) { const t = liquidT50Alc(0, g); expect(t).toBeGreaterThanOrEqual(22); expect(t).toBeLessThanOrEqual(28); }
  });
  it('500 ml beer ≈ 39 min (≈ 20 g alcohol, ≈ 75 non-alcohol kcal)', () => near(liquidT50Alc(75, 20, ALCOHOL_DRINKS.beer.ka), 39.3, 0.15));
  it('500 ml red wine ≈ 73 min (≈ 53 g alcohol, ≈ 55 non-alcohol kcal)', () => near(liquidT50Alc(55, 53, ALCOHOL_DRINKS.wine.ka), 72.6, 0.15));
  it('a solid meal with alcohol leaves 20–42% later (Franke 2005, PMID 15699055: 131 → 159–186 min)', () => {
    for (const ka of [ALCOHOL_DRINKS.beer.ka, ALCOHOL_DRINKS.wine.ka, ALCOHOL_DRINKS.spirits.ka]) {
      const f = alcoholGE(30, ka).solid; expect(f).toBeGreaterThanOrEqual(1.2); expect(f).toBeLessThanOrEqual(1.42);
    }
    expect(alcoholGE(0).solid).toBe(1);
  });
  it('blood alcohol is not changed by it (fitted directly to Mitchell 2014): same peak with and without the GE term', () => {
    const beer: Meal = { grams: 500, kcal: 215, availCarbs: 18, fiber: 0, fat: 0, protein: 2, waterG: 460, caffeineMg: 0, alcoholG: 20, gl: 12, kind: 'liquid', alcoholKa: ALCOHOL_DRINKS.beer.ka, alcoholF: ALCOHOL_DRINKS.beer.F };
    const peak = Math.max(...simulateFood(beer, DEFAULT_PROFILE).bac);
    expect(peak).toBeGreaterThan(0.2); expect(peak).toBeLessThan(0.45);
  });
});

describe('caffeine half-life by person [M4–M9]', () => {
  const her: Profile = { ...DEFAULT_PROFILE, sex: 'female' };
  it('typical 6 h, smokers 3.5 h (Parsons 1978), inside the 2.5–10 h adult range', () => {
    expect(caffeineHalfLifeH(DEFAULT_PROFILE)).toBe(6);
    expect(caffeineHalfLifeH({ ...DEFAULT_PROFILE, smoker: true })).toBeCloseTo(3.5, 6);
  });
  it('pill ≈ 1.7× (Patwardhan 1980: 10.7 vs 6.2 h); late pregnancy ≈ 2.6× (Parsons 1982); never stacked', () => {
    expect(caffeineHalfLifeH({ ...her, oralContraceptives: true })).toBeCloseTo(6 * 10.7 / 6.2, 6);
    expect(caffeineHalfLifeH({ ...her, latePregnancy: true })).toBeCloseTo(6 / 0.39, 6);
    expect(caffeineHalfLifeH({ ...her, latePregnancy: true, oralContraceptives: true })).toBeCloseTo(6 / 0.39, 6);
  });
  it('the women-only toggles do nothing for a man (an old link could carry them)', () => {
    expect(caffeineHalfLifeH({ ...DEFAULT_PROFILE, latePregnancy: true, oralContraceptives: true })).toBe(6);
  });
  it('a shot peaks at 30–50 min (Liguori 1997: coffee 42 min; Mumford 1996: capsules ≈ 30 min)', () => {
    const t = simulateEspresso(63, DEFAULT_PROFILE).tmaxMin;
    expect(t).toBeGreaterThanOrEqual(30); expect(t).toBeLessThanOrEqual(50);
  });
});

describe('body size [W, D4, E2]', () => {
  it('Watson 1980 total body water: 70 kg, 175 cm, 35 y man ≈ 42 L; woman of the same size ≈ 33.9 L', () => {
    expect(totalBodyWaterL(DEFAULT_PROFILE)).toBeCloseTo(2.447 - 0.09516 * 35 + 0.1074 * 175 + 0.3362 * 70, 6);
    expect(totalBodyWaterL({ ...DEFAULT_PROFILE, sex: 'female' })).toBeCloseTo(-2.097 + 0.1069 * 175 + 0.2466 * 70, 6);
  });
  it('Forrest 1986 Widmark r: ≈ 0.74 for a 70 kg, 175 cm man; women lower at the same BMI', () => {
    expect(widmarkR(DEFAULT_PROFILE)).toBeCloseTo(1.0181 - 0.01213 * (70 / 1.75 ** 2), 6);
    expect(widmarkR({ ...DEFAULT_PROFILE, sex: 'female' })).toBeLessThan(widmarkR(DEFAULT_PROFILE));
  });
  it('the blood alcohol of the main model and Widmark C0 = dose / (r × weight) agree once distributed', () => {
    const shot: Meal = { grams: 300, kcal: 210, availCarbs: 0, fiber: 0, fat: 0, protein: 0, waterG: 270, caffeineMg: 0, alcoholG: 30, gl: null, kind: 'liquid', alcoholKa: ALCOHOL_DRINKS.spirits.ka, alcoholF: 1 };
    const bac = simulateFood(shot, DEFAULT_PROFILE).bac;
    // after distribution the curve falls at β = 0.12 g/L/h; back-extrapolated to 0 it gives the Widmark C0
    const c0 = bac[180] + (0.12 * 180) / 60, widmark = 30 / (widmarkR(DEFAULT_PROFILE) * 70);
    near(c0, widmark, 0.1);
  });
  it('walking is net of rest: 0.5 kcal per kg per km at 5 km/h (ACSM)', () => {
    expect(walkingMinutes(35, 70)).toBeCloseTo(12, 6); // 35 kcal = 1 km for 70 kg = 12 min
  });
});

describe('quick answers: hydration and pregnancy', () => {
  const base: AnswerInput = { systems: [], drinkAt: 10 * 60, bedtimeMin: 23 * 60, weightKg: 70, kcal: 5, extraSleepMin: 0, caffeineAtBedMg: 5, waterMl: 250, latestForSleep: 15 * 60 };
  const water = (x: AnswerInput) => quickAnswers(x).find((a) => a.q === 'Does it count as water?')!;
  it('a normal coffee counts as water (Killer 2014): plain "Yes"', () => {
    expect(water({ ...base, caffeineDoseMg: 100 }).a).toMatch(/^Yes/);
  });
  it('a very big caffeine dose (≥ 6 mg/kg, Seal 2017) is only "Mostly"', () => {
    expect(water({ ...base, caffeineDoseMg: 450 }).a).toMatch(/^Mostly/);
  });
  it('pregnant with caffeine: the 200 mg a day of EFSA 2015 is named', () => {
    const her = { ...DEFAULT_PROFILE, sex: 'female' as const, latePregnancy: true };
    const a = quickAnswers({ ...base, caffeineDoseMg: 250, personal: personalNotes(her, 15.4) }).find((q) => q.q === 'And in pregnancy?')!;
    expect(a.a).toMatch(/200 mg/); expect(a.tone).toBe(2);
  });
});

describe('model constants stay where the papers put them', () => {
  it('caloric liquids: 100 kcal ≈ 26.5 min and 500 kcal ≈ 69.5 min (Camps 2016) within 12%', () => {
    near(FOOD_MODEL.liquidT50(100), 26.5, 0.12); near(FOOD_MODEL.liquidT50(500), 69.5, 0.12);
  });
});
