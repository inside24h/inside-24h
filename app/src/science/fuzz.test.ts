// Robustness fuzz test (science audit 2026-10-16): EVERY food in the database at every chip amount (½, 1, 2, 3) and
// extreme bodies (40 kg / 200 kg, smoker, late pregnancy, the pill, 18 and 100 years, mg/dL). Meals: fuzzMeals.test.ts.
// Nothing may produce NaN / Infinity, negative amounts, times outside 0–24 h, curves that never come back, or text with
// "NaN", "undefined" or empty strings. Checks: fuzzKit.ts.
import { describe, it } from 'vitest';
import { simulateFood } from './foodSim';
import { DEFAULT_PROFILE } from './profile';
import { FOODS, FOOD_BY_ID, servingPart } from '../v4/food/parse';
import { ITEM_STEPS, toMeal } from '../v4/food/meal';
import { PROFILES, checkScreen, checkSim, peak } from './fuzzKit';

const amountsOf = (id: string) => ITEM_STEPS.map((n) => servingPart(FOOD_BY_ID[id], n));

describe('fuzz: every food × every amount', () => {
  it('runs the full screen for all foods at ½, 1, 2, 3 servings (default body)', () => {
    for (const f of FOODS) {
      let last: { kcal: number; glu: number; bac: number; caf: number; tg: number; t50: number } | null = null;
      for (const part of amountsOf(f.id)) {
        const where = `${f.id} ×${part.amountLabel}`;
        const meal = toMeal([part]);
        const s = simulateFood(meal, DEFAULT_PROFILE);
        checkSim(where, s, meal.alcoholG, meal.grams);
        checkScreen(where, [part], DEFAULT_PROFILE, part.grams === f.serving.grams || part.grams === f.serving.grams * 3); // quick answers at 1 and 3 servings
        const now = { kcal: meal.kcal, glu: s.glucosePeakMmol, bac: peak(s.bac), caf: peak(s.caffeine.conc), tg: peak(s.tgDelta), t50: s.t50 };
        if (last) {
          // more of the same food is never less effect (tolerance for rounding)
          for (const k of ['kcal', 'glu', 'bac', 'caf', 'tg'] as const)
            if (now[k] < last[k] - 1e-6) throw new Error(`${where}: ${k} fell from ${last[k]} to ${now[k]} with more food`);
          if (now.t50 < last.t50 - 1) throw new Error(`${where}: stomach emptied faster with more food (${last.t50} → ${now.t50})`);
        }
        last = now;
      }
    }
  }, 300_000);

  it('extreme bodies: numbers stay sane for every food at ½ and 3 servings', () => {
    for (const [name, p] of Object.entries(PROFILES)) {
      // the body only changes alcohol, caffeine and bedtime: all foods with either, plus every 6th other food
      const foods = FOODS.filter((f, i) => (f.p.alcoholG ?? 0) > 0 || (f.p.caffeineMg ?? 0) > 0 || i % 6 === 0);
      for (const f of foods) for (const n of [0.5, 3]) {
        const part = servingPart(f, n);
        const meal = toMeal([part]);
        checkSim(`${name}/${f.id}×${n}`, simulateFood(meal, p), meal.alcoholG, meal.grams);
      }
    }
  }, 300_000);

  it('extreme bodies: the full screen of the most popular items has no broken text', () => {
    const top = ['cola', 'espresso', 'energy-drink', 'beer', 'red-wine', 'rakija', 'water', 'orange-juice', 'banana', 'apple', 'bread-white', 'pizza',
      'hamburger', 'fries', 'chocolate-milk-bar', 'milk-whole', 'green-tea', 'rice-white', 'pasta', 'ice-cream', 'potato-chips'];
    for (const [name, p] of Object.entries(PROFILES)) for (const id of top) for (const n of [1, 3]) checkScreen(`${name}/${id}×${n}`, [servingPart(FOOD_BY_ID[id], n)], p);
  }, 300_000);
});

