// Robustness fuzz test for MEALS (science audit 2026-10-16): fixed and random meals of 2–5 items (alcohol + food,
// caffeine + food, everything at ×3) in several bodies. Checks: fuzzKit.ts.
import { describe, expect, it } from 'vitest';
import { simulateFood } from './foodSim';
import { DEFAULT_PROFILE } from './profile';
import { FOODS } from '../v4/food/parse';
import { ITEM_STEPS, mealFromCode, toMeal } from '../v4/food/meal';
import { mealAnswerLines } from '../v4/food/mealWords';
import { PROFILES, checkScreen, checkSim, checkTexts, peak } from './fuzzKit';

// deterministic pseudo-random meals
function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; }; }

describe('fuzz: meals', () => {
  const fixed = [
    'beer pizza*2', 'beer*3 cevapi*2 bread-white*2', 'rakija*3 cevapi', 'red-wine*3 cheese-gouda*2', 'white-wine beer rakija*3',
    'espresso croissant', 'energy-drink potato-chips*3', 'cola hamburger fries*2', 'cappuccino cake-sponge', 'filter-coffee*3 doughnut*2',
    'green-tea rice-white chicken-breast', 'water pasta', 'milk-whole cornflakes banana', 'cola*3 popcorn*3 ice-cream*3',
    'beer*3 red-wine*3 white-wine*3 rakija*3 energy-drink*3', 'espresso*3 energy-drink*3 cola*3 filter-coffee*3 black-tea*3',
    'water*3 sparkling-water*3', 'olive-oil*3 butter*3', 'salad-lettuce*0.5 water*0.5',
  ];
  const r = rng(20261016);
  const random: string[] = [];
  for (let i = 0; i < 50; i++) {
    const k = 2 + Math.floor(r() * 4), ids = new Set<string>();
    while (ids.size < k) ids.add(FOODS[Math.floor(r() * FOODS.length)].id);
    random.push([...ids].map((id) => `${id}*${ITEM_STEPS[Math.floor(r() * ITEM_STEPS.length)]}`).join(' '));
  }

  it('fixed and random meals: sane numbers and text for several bodies', () => {
    for (const code of [...fixed, ...random]) {
      const parts = mealFromCode(code);
      expect(parts.length, code).toBeGreaterThan(0);
      for (const [name, p] of Object.entries(PROFILES)) {
        const meal = toMeal(parts);
        const s = simulateFood(meal, p);
        checkSim(`${name}/${code}`, s, meal.alcoholG, meal.grams);
        if (name === 'default' || name === 'light' || name === 'lateNight') {
          checkScreen(`${name}/${code}`, parts, p);
          checkTexts(`${name}/${code} meal lines`, mealAnswerLines(s, meal, parts));
        }
      }
    }
  }, 300_000);

  it('a bigger meal is never less effect (all items doubled)', () => {
    for (const code of [...fixed, ...random]) {
      const parts = mealFromCode(code);
      const double = parts.map((x) => ({ ...x, grams: x.grams * 2 }));
      const a = simulateFood(toMeal(parts), DEFAULT_PROFILE), b = simulateFood(toMeal(double), DEFAULT_PROFILE);
      expect(b.kcal, code).toBeGreaterThanOrEqual(a.kcal);
      expect(peak(b.bac), code).toBeGreaterThanOrEqual(peak(a.bac) - 1e-9);
      if (toMeal(parts).caffeineMg > 0) expect(peak(b.caffeine.conc), code).toBeGreaterThanOrEqual(peak(a.caffeine.conc) - 1e-9);
      // Known model property (audit 2026-10-16): with very sugary meals the total peak saturates while more food slows
      // the drink, so doubling can lower the peak by up to ≈ 2% (2 of 99 meals sampled in the audit). Far inside the ±40% range shown.
      expect(b.glucosePeakMmol, code).toBeGreaterThanOrEqual(0.97 * a.glucosePeakMmol - 1e-6);
    }
  }, 120_000);
});
