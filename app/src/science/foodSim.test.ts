import { describe, expect, it } from 'vitest';
import { simulateFood, stomachRetention, type Meal } from './foodSim';
import { DEFAULT_PROFILE } from './profile';
import { macros, parseMeal } from '../v4/food/parse';

const meal = (text: string, extra: Partial<Meal> = {}): Meal => {
  const parts = parseMeal(text);
  const m = macros(parts);
  const kind = parts.every((p) => p.food.kind === 'liquid') ? 'liquid' : parts.some((p) => p.food.kind === 'solid') ? 'solid' : 'semi';
  return { ...m, kind, ...extra };
};

describe('parser', () => {
  it('understands simple Croatian and English phrases', () => {
    expect(parseMeal('1 jabuka')[0].food.id).toBe('apple');
    expect(parseMeal('pizza')[0].food.id).toBe('pizza');
    expect(parseMeal('kava s mlijekom').map((p) => p.food.id)).toEqual(['coffee-with-milk']);
    expect(parseMeal('kruh')[0].food.id).toBe('bread-white');
    expect(parseMeal('2 kriške kruha')[0]).toMatchObject({ grams: 58 });
    expect(parseMeal('500 ml mlijeka')[0].food.id).toMatch(/^milk/);
    expect(Math.round(parseMeal('200g riže')[0].grams)).toBe(200);
    expect(parseMeal('pizza i cola').map((p) => p.food.id)).toEqual(['pizza', 'cola']);
    expect(parseMeal('half a banana')[0].grams).toBeCloseTo(59, 0);
  });
  it('computes macros and GL from the database', () => {
    const m = macros(parseMeal('1 apple'));
    expect(m.kcal).toBeCloseTo(94.6, 0); // 182 g × 52 kcal/100 g (USDA SR Legacy)
    expect(m.gi).toBe(36); // Atkinson 2008
  });
});

describe('generic food model', () => {
  it('solid meal empties as in Tougas 2000 / Parkman 2025 (T50 85–95 min, ≈1% left at 4 h)', () => {
    const m: Meal = { grams: 300, kcal: 255, availCarbs: 30, fiber: 2, fat: 10, protein: 15, waterG: 150, caffeineMg: 0, alcoholG: 0, gl: 20, kind: 'solid' };
    expect(stomachRetention(m, 60)).toBeGreaterThan(0.6);
    expect(stomachRetention(m, 120)).toBeGreaterThan(0.2);
    expect(stomachRetention(m, 120)).toBeLessThan(0.4);
    expect(stomachRetention(m, 240)).toBeLessThan(0.1); // > 10% at 4 h = delayed (Tougas 2000)
  });
  it('water empties with T50 13 min and cola ≈ 28 min', () => {
    expect(simulateFood(meal('glass of water'), DEFAULT_PROFILE).t50).toBe(13);
    expect(simulateFood(meal('1 can of cola'), DEFAULT_PROFILE).t50).toBeGreaterThanOrEqual(26);
  });
  it('cola glucose peak ≈ +2.3 mmol/L at ~25 min (anchor)', () => {
    const s = simulateFood(meal('1 can of cola'), DEFAULT_PROFILE);
    expect(s.glucosePeakMmol).toBeGreaterThan(1.9);
    expect(s.glucosePeakMmol).toBeLessThan(2.7);
    expect(s.glucosePeakMin).toBeLessThan(35);
  });
  it('banana peaks later and lower than cola, no dip', () => {
    const s = simulateFood(meal('1 banana'), DEFAULT_PROFILE);
    expect(s.glucosePeakMin).toBeGreaterThan(40);
    expect(s.glucosePeakMin).toBeLessThan(75);
    expect(Math.min(...s.glucoseDeltaMgDl)).toBeGreaterThanOrEqual(0);
  });
  it('fibre reaches the colon and most is still inside at 24 h (first stool before 24 h in only 34%)', () => {
    const s = simulateFood(meal('1 apple'), DEFAULT_PROFILE);
    const inColon = s.colonG.reduce((a, c) => a + c[1440], 0);
    expect(inColon / s.residueG).toBeGreaterThan(0.5);
    expect(s.exitedG[1440] / s.residueG).toBeLessThan(0.34);
  });
  it('one beer fasted: blood alcohol peak 0.2–0.35 g/L at 40–75 min, gone by ~5 h (alcohol.md worked example)', () => {
    const s = simulateFood(meal('beer'), DEFAULT_PROFILE);
    const peak = Math.max(...s.bac), tPeak = s.bac.indexOf(peak);
    expect(peak).toBeGreaterThan(0.2);
    expect(peak).toBeLessThan(0.35);
    expect(tPeak).toBeGreaterThan(40);
    expect(tPeak).toBeLessThan(75);
    expect(s.bac[300]).toBeLessThan(0.01);
  });
  it('nearly all energy is absorbed within 24 h', () => {
    const s = simulateFood(meal('pizza'), DEFAULT_PROFILE);
    expect(s.kcalAbsorbed[1440] / s.kcal).toBeGreaterThan(0.9);
  });
});
