// Blood alcohol reproduces Mitchell, Teigen & Ramchandani 2014 (PMC4112772, full text read 2026-10-16 with epmc.py):
// 15 fasted men (mean 82.66 kg, BMI 26.35), 0.5 g ethanol/kg drunk over 20 min, venous blood.
// Cmax (mg/dl, mean ± SD): beer 5.1% 50.3 ± 9.8, white wine 12.5% 61.7 ± 10.8, vodka-tonic 20% 77.4 ± 17.0.
// Tmax (min): beer 62 ± 23, wine 54 ± 14, vodka-tonic 36 ± 10. 7 of 15 men exceeded 80 mg/dl after vodka-tonic.
// alcohol.md A1, A9–A12. Model: science/foodSim.ts (ALCOHOL_DRINKS, two compartments).
import { describe, expect, it } from 'vitest';
import { ALCOHOL_DRINKS, alcoholClass, simulateFood, type Meal } from './foodSim';
import { DEFAULT_PROFILE, type Profile } from './profile';
import { bacRange } from './ranges';
import { toMeal } from '../v4/food/meal';
import { FOOD_BY_ID } from '../v4/food/parse';

const KG = 82.66;
const mitchellMan: Profile = { ...DEFAULT_PROFILE, sex: 'male', weightKg: KG, heightCm: 100 * Math.sqrt(KG / 26.35) };
const DOSE = 0.5 * KG; // g ethanol
const ETHANOL_DENSITY = 0.789; // g/ml

// % vol → g per 100 g, taking the drink as ≈ 1 g/ml (C; enough to pick the class)
const gPer100 = (abvPct: number) => abvPct * ETHANOL_DENSITY;
const drink = (abvPct: number): Meal => {
  const cls = ALCOHOL_DRINKS[alcoholClass(gPer100(abvPct))];
  const grams = (100 * DOSE) / gPer100(abvPct);
  return { grams, kcal: 7 * DOSE, availCarbs: 0, fiber: 0, fat: 0, protein: 0, waterG: grams - DOSE, caffeineMg: 0, alcoholG: DOSE, gl: null,
    kind: 'liquid', alcoholKa: cls.ka, alcoholF: cls.F, fed: false };
};
const peakOf = (m: Meal, p: Profile = mitchellMan) => {
  const b = simulateFood(m, p).bac;
  let i = 0; for (let t = 1; t < b.length; t++) if (b[t] > b[i]) i = t;
  return { mgdl: b[i] * 100, min: i };
};

const MITCHELL = [
  { name: 'beer 5.1%', abv: 5.1, cls: 'beer', cmax: 50.3, sd: 9.8, tmax: 62 },
  { name: 'white wine 12.5%', abv: 12.5, cls: 'wine', cmax: 61.7, sd: 10.8, tmax: 54 },
  { name: 'vodka-tonic 20%', abv: 20, cls: 'spirits', cmax: 77.4, sd: 17.0, tmax: 36 },
] as const;

describe('blood alcohol vs Mitchell 2014 (0.5 g/kg, fasted, 82.7 kg men)', () => {
  for (const d of MITCHELL) {
    it(`${d.name}: class ${d.cls}, peak ${d.cmax} mg/dl at ${d.tmax} min, each within 5%`, () => {
      expect(alcoholClass(gPer100(d.abv))).toBe(d.cls);
      const p = peakOf(drink(d.abv));
      expect(Math.abs(p.mgdl - d.cmax) / d.cmax).toBeLessThan(0.05);
      expect(Math.abs(p.min - d.tmax) / d.tmax).toBeLessThan(0.05);
    });
    it(`${d.name}: the shown range holds the measured mean and mean + 2 SD; the low end is below mean − 1 SD`, () => {
      const [lo, hi] = bacRange(peakOf(drink(d.abv)).mgdl);
      expect(hi).toBeGreaterThan(d.cmax + 2 * d.sd);
      expect(lo).toBeLessThan(d.cmax - d.sd);
      expect(lo).toBeLessThan(d.cmax); expect(hi).toBeGreaterThan(d.cmax);
    });
  }
  it('vodka-tonic: 80 mg/dl (reached by 7 of 15 men) lies inside the shown range', () => {
    const [lo, hi] = bacRange(peakOf(drink(20)).mgdl);
    expect(lo).toBeLessThan(80); expect(hi).toBeGreaterThan(80);
  });
  it('order of peaks: spirits > wine > beer, and spirits peak first', () => {
    const [b, w, s] = MITCHELL.map((d) => peakOf(drink(d.abv)));
    expect(s.mgdl).toBeGreaterThan(w.mgdl); expect(w.mgdl).toBeGreaterThan(b.mgdl);
    expect(s.min).toBeLessThan(w.min); expect(w.min).toBeLessThanOrEqual(b.min);
  });
  it('the app foods get the right class: beer → beer, wine → wine, rakija → spirits', () => {
    const cls = (id: string) => { const f = FOOD_BY_ID[id]; return toMeal([{ food: f, grams: f.serving.grams, amountLabel: '', assumed: false }]).alcoholKa; };
    expect(cls('beer')).toBe(ALCOHOL_DRINKS.beer.ka);
    expect(cls('white-wine')).toBe(ALCOHOL_DRINKS.wine.ka);
    expect(cls('red-wine')).toBe(ALCOHOL_DRINKS.wine.ka);
    expect(cls('rakija')).toBe(ALCOHOL_DRINKS.spirits.ka);
  });
  it('fed (just ate): every drink peaks lower than fasted, spirits about 40–57% (Jones 1997) with a margin', () => {
    for (const d of MITCHELL) {
      const fasted = peakOf(drink(d.abv)).mgdl, fed = peakOf({ ...drink(d.abv), fed: true }).mgdl;
      expect(fed).toBeLessThan(fasted);
      if (d.cls === 'spirits') { expect(fed / fasted).toBeGreaterThan(0.3); expect(fed / fasted).toBeLessThan(0.67); }
    }
  });
});
