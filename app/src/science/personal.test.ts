// Each "your body" factor moves the result in the published direction and by about the published amount.
import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE, type Profile } from './profile';
import { simulateEspresso } from './espressoSim';
import { ALCOHOL_DRINKS, simulateFood, type Meal } from './foodSim';
import { buildVitals } from './daily';
import { sleepAnchors } from './anchors';
import { activeFactors, FED_PEAK_RATIO, personalNotes } from './personal';

const P: Profile = { ...DEFAULT_PROFILE, drinkAtMin: 16 * 60, bedtimeMin: 23 * 60 };
const her: Profile = { ...P, sex: 'female', heightCm: 165, weightKg: 60 };
const peak = (a: Float64Array) => a.reduce((m, v) => Math.max(m, v), 0);
// one 0.5 l beer (19.7 g alcohol, alcohol.md P2), as a drink on its own
const beer: Meal = { grams: 500, kcal: 215, availCarbs: 18, fiber: 0, fat: 0, protein: 2, waterG: 460, caffeineMg: 0, alcoholG: 19.7, gl: null,
  kind: 'liquid', alcoholKa: ALCOHOL_DRINKS.beer.ka, alcoholF: ALCOHOL_DRINKS.beer.F, fed: false };
// Jones 1997 set-up: 0.30 g/kg as a ~20% cocktail drunk in 15 min
const cocktail = (kg: number): Meal => ({ ...beer, grams: 150, kcal: 7 * 0.3 * kg, availCarbs: 0, protein: 0, waterG: 110, alcoholG: 0.3 * kg, alcoholKa: ALCOHOL_DRINKS.spirits.ka, alcoholF: ALCOHOL_DRINKS.spirits.F });

describe('caffeine: half-life factors (espresso.md M6–M9)', () => {
  const left = (p: Profile) => simulateEspresso(100, p, 1440).body[7 * 60]; // mg still in the body 7 h later
  it('smoking: half-life 3.5 h vs 6 h → much less left at bedtime', () => {
    expect(simulateEspresso(100, { ...P, smoker: true }, 60).halfLifeH).toBeCloseTo(3.5, 5);
    expect(left({ ...P, smoker: true }) / left(P)).toBeLessThan(0.6);
  });
  it('the pill: half-life 10.7 vs 6.2 h (×1.73) → more left at bedtime', () => {
    expect(simulateEspresso(100, { ...her, oralContraceptives: true }, 60).halfLifeH / simulateEspresso(100, her, 60).halfLifeH).toBeCloseTo(10.7 / 6.2, 5);
    // analytic: 2^(7/6.2 − 7/10.7) ≈ 1.39 more left 7 h later
    expect(left({ ...her, oralContraceptives: true }) / left(her)).toBeGreaterThan(1.3);
  });
  it('late pregnancy: half-life ≈ 2.6× (clearance 39%), inside the 2.6–3.5× read (Parsons 1982, Knutti 1982)', () => {
    const r = simulateEspresso(100, { ...her, latePregnancy: true }, 60).halfLifeH / simulateEspresso(100, her, 60).halfLifeH;
    expect(r).toBeGreaterThanOrEqual(2.5); expect(r).toBeLessThanOrEqual(3.5);
  });
  it('age does not change the half-life (Blanchard 1983)', () => {
    expect(simulateEspresso(100, { ...P, ageY: 70 }, 60).halfLifeH).toBe(simulateEspresso(100, P, 60).halfLifeH);
  });
  it('a smaller body → higher blood level from the same cup (body water, Watson)', () => {
    expect(simulateEspresso(100, her, 300).peakConc).toBeGreaterThan(simulateEspresso(100, P, 300).peakConc * 1.15);
  });
  it('sleep: the same late coffee costs a pill user more minutes, a smoker fewer', () => {
    const extra = (p: Profile) => buildVitals(p, simulateEspresso(200, p), sleepAnchors()).extraLatencyMin;
    const late = { ...her, drinkAtMin: 19 * 60 };
    expect(extra({ ...late, oralContraceptives: true })).toBeGreaterThan(extra(late));
    expect(extra({ ...late, smoker: true })).toBeLessThan(extra(late));
  });
});

describe('caffeine every day: smaller blood-pressure bump (espresso.md Y2–Y4)', () => {
  it('about half the systolic rise on average (Lovallo 2004: half full tolerance, half none)', () => {
    const rise = (p: Profile) => { const s = simulateEspresso(200, p); return peak(s.sbp) - s.sbp[0]; };
    expect(rise({ ...P, caffeineDaily: true }) / rise(P)).toBeCloseTo(0.5, 5);
  });
  it('does not change how long caffeine stays (Knutti 1982: no link with coffee habit)', () => {
    expect(simulateEspresso(100, { ...P, caffeineDaily: true }).body[600]).toBeCloseTo(simulateEspresso(100, P).body[600], 9);
  });
});

describe('alcohol: body and stomach (alcohol.md W3, A2, PF1)', () => {
  it('just ate: peak about 40–57% of the empty-stomach peak (Jones 1997, Kechagias 1999), with a margin', () => {
    const fasted = peak(simulateFood(cocktail(70), P).bac);
    const fed = peak(simulateFood(cocktail(70), { ...P, withMeal: true }).bac);
    const r = fed / fasted;
    expect(r).toBeGreaterThan(FED_PEAK_RATIO[0] - 0.1);
    expect(r).toBeLessThan(FED_PEAK_RATIO[1] + 0.1);
  });
  it('just ate: alcohol gone sooner (Jones 1997: 1–2 h)', () => {
    const goneAt = (p: Profile) => { const b = simulateFood(cocktail(70), p).bac; const i = b.findIndex((v, m) => m > 30 && v < 0.005); return i; };
    const d = goneAt(P) - goneAt({ ...P, withMeal: true });
    expect(d).toBeGreaterThan(30); expect(d).toBeLessThan(150);
  });
  it('food in the meal itself and "just ate" give the same result', () => {
    expect(peak(simulateFood({ ...beer, fed: true }, P).bac)).toBeCloseTo(peak(simulateFood(beer, { ...P, withMeal: true }).bac), 9);
  });
  it('same beer, smaller woman: higher peak (Forrest r by sex and BMI)', () => {
    expect(peak(simulateFood(beer, her).bac)).toBeGreaterThan(peak(simulateFood(beer, P).bac) * 1.2);
  });
  it('the fasted cocktail peak sits near the measured 0.31 g/L (Jones 1997), within ±40%', () => {
    const b = peak(simulateFood(cocktail(70), P).bac);
    expect(b).toBeGreaterThan(0.31 * 0.6); expect(b).toBeLessThan(0.31 * 1.4);
  });
});

describe('personal notes', () => {
  it('lists only the factors that are on; pill and pregnancy only for women', () => {
    expect(activeFactors(P)).toEqual(['body']);
    expect(activeFactors({ ...P, oralContraceptives: true, latePregnancy: true })).toEqual(['body']);
    expect(activeFactors({ ...her, smoker: true, oralContraceptives: true, withMeal: true })).toEqual(['body', 'smoker', 'pill', 'withMeal']);
    expect(personalNotes({ ...her, smoker: true, oralContraceptives: true }, 6).halfLifeWhy).toBe('you smoke + the pill');
    expect(personalNotes(P, 6).halfLifeWhy).toBeNull();
  });
});
