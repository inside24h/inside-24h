// MEALS: several things eaten together. Magnitudes from research/meals.md (ML1–ML7) and the existing anchors.
import { describe, expect, it } from 'vitest';
import { simulateFood, stomachRetention } from './foodSim';
import { DEFAULT_PROFILE } from './profile';
import { mealFromCode, toMeal } from '../v4/food/meal';
import { mealSugarNote } from '../v4/food/mealWords';

const sim = (code: string) => simulateFood(toMeal(mealFromCode(code)), DEFAULT_PROFILE);
const peak = (a: Float64Array) => a.reduce((m, v) => Math.max(m, v), 0);

describe('meal model', () => {
  it('one item gives exactly the single-food model (no change for single foods)', () => {
    const one = toMeal(mealFromCode('cola'));
    expect(one.items).toBeUndefined();
  });

  it('cola alone peaks higher and earlier than cola with burger + fries [ML3, ML5]', () => {
    const alone = sim('cola'), meal = sim('hamburger fries*2 cola');
    expect(alone.glucosePeakMmol).toBeGreaterThan(meal.glucosePeakMmol);
    expect(meal.glucosePeakMin).toBeGreaterThan(alone.glucosePeakMin);
    // the cola's own curve inside the meal: 20–50% smaller (slower delivery ×(1/2)^0.3 ≈ 0.81, blunting ≤ 35%)
    const colaItem = meal.meal!.items.find((i) => i.drink)!;
    const ratio = colaItem.peakMmol / alone.glucosePeakMmol;
    // compare with the cola's share of the same total (alone peak for its GL)
    expect(ratio).toBeLessThan(0.8);
    expect(ratio).toBeGreaterThan(0.2);
    // no sugar dip after the peak when food comes along [GL7]
    expect(Math.min(...meal.glucoseDeltaMgDl)).toBeGreaterThanOrEqual(0);
    expect(Math.min(...alone.glucoseDeltaMgDl)).toBeLessThan(0);
  });

  it('the drink leaves the stomach first, but slower than alone: liquid T50 ≈ 1.5–2.2× [ML2, ML3]', () => {
    const s = sim('hamburger fries*2 cola');
    const d = s.meal!.phases.drink!;
    expect(d.t50 / d.aloneT50).toBeGreaterThanOrEqual(1.5);
    expect(d.t50 / d.aloneT50).toBeLessThanOrEqual(2.2);
    expect(d.t50).toBeLessThan(s.meal!.foodT50);
    // the food part takes 1.5–3.5 h for half (Farivar 2026: 132–188 min for 440–1300 kcal meals) [ML6]
    expect(s.meal!.foodT50).toBeGreaterThan(90);
    expect(s.meal!.foodT50).toBeLessThan(215);
    // stomach mass is the sum of both phases
    expect(s.stomachG[30]).toBeCloseTo(s.meal!.drinkStomachG[30] + s.meal!.foodStomachG[30], 6);
  });

  it('plain water with a meal is not slowed (Magenstrasse) [ML4]', () => {
    const s = sim('water hamburger');
    expect(s.meal!.phases.drink!.t50).toBeCloseTo(13, 5);
  });

  it('drink with a small meal ≈ 1.4–1.6× slower (Maddern 1985: 18 vs 13 min)', () => {
    const m = toMeal(mealFromCode('water hamburger'));
    // a caloric drink with ~250 kcal food: factor 1 + 250/500 = 1.5
    const s = sim('orange-juice hamburger');
    const d = s.meal!.phases.drink!;
    expect(d.t50 / d.aloneT50).toBeGreaterThan(1.4);
    expect(d.t50 / d.aloneT50).toBeLessThan(1.6);
    expect(stomachRetention(m, 0)).toBeCloseTo(1, 9);
  });

  // Peak TIME is not asserted: no fed tmax was read (alcohol.md open question); the fed model lowers the peak only.
  it('beer with ćevapi + bread: blood alcohol peak lower, ≈ 40–60% of fasted [alcohol PF1, beer H1–H2]', () => {
    const fasted = sim('beer'), fed = sim('beer cevapi*2 bread-white*2');
    const pf = peak(fasted.bac), pm = peak(fed.bac);
    expect(pm / pf).toBeGreaterThan(0.35);
    expect(pm / pf).toBeLessThan(0.7);
  });

  it('coffee with a croissant: caffeine peaks later, same total [ML3: +36–40 min with 500–1000 kcal]', () => {
    const alone = sim('cappuccino'), meal = sim('cappuccino croissant');
    const shift = meal.caffeine.tmaxMin - alone.caffeine.tmaxMin;
    expect(shift).toBeGreaterThan(25);
    expect(shift).toBeLessThan(60);
    // same total caffeine absorbed by 12 h
    const absorbed = (s: typeof alone) => s.caffeine.body[720] + s.caffeine.metabolites[720];
    expect(absorbed(meal) / absorbed(alone)).toBeGreaterThan(0.95);
  });

  it('a big fast-food meal still empties within the 24 h day, energy nearly all absorbed', () => {
    const s = sim('hamburger fries*2 cola');
    expect(s.stomachG[480] / s.stomachG[0]).toBeLessThan(0.05);
    expect(s.kcalAbsorbed[1440] / s.kcal).toBeGreaterThan(0.9);
  });

  it('bread with cheese: the cheese’s protein and fat blunt the bread’s sugar [ML5]', () => {
    const bread = sim('bread-white*2'), both = sim('bread-white*2 cheese-gouda*2');
    expect(both.glucosePeakMmol).toBeLessThan(bread.glucosePeakMmol);
    expect(both.glucosePeakMmol / bread.glucosePeakMmol).toBeGreaterThan(0.6);
  });

  it('says who drives the sugar in plain words', () => {
    const parts = mealFromCode('hamburger fries*2 cola');
    const m = toMeal(parts);
    const txt = mealSugarNote(simulateFood(m, DEFAULT_PROFILE), m);
    expect(txt).toMatch(/cola/);
    expect(txt).toMatch(/burger|fries/);
  });
});
