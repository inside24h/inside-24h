// Compare verdicts (prelaunch QA 2026-10-23): "Espresso vs Beer → 🏆 Beer wins." must never happen again.
// Alcohol never wins a trophy against an alcohol-free item; two alcoholic drinks are ranked by alcohol first;
// a winner is only named with a reason; the sentence reads the same whichever side an item is on.
import { describe, expect, it } from 'vitest';
import { FOODS, parseMeal, servingPart } from './food/parse';
import { DEFAULT_PROFILE, type Profile } from '../science/profile';
import { analyze, verdictOf, type Analysis } from './analyze';

const P = (h: number, o: Partial<Profile> = {}): Profile => ({ ...DEFAULT_PROFILE, drinkAtMin: h * 60, ...o });
const an = (t: string, p: Profile) => { const ps = parseMeal(t); expect(ps.length, t).toBeGreaterThan(0); return analyze(ps, p); };
const hasAlc = (x: Analysis) => (x.built.alcoholG ?? 0) > 1;
const winnerOf = (v: string) => (v.startsWith('🏆 ') ? v.slice(3, v.indexOf(' wins')) : null);

describe('verdictOf', () => {
  it('espresso (1 or 3) never loses to a beer, at any time of day, on either side', () => {
    for (const h of [8, 12, 16, 19, 22]) for (const e of ['espresso', '3 espressos']) {
      const p = P(h), a = an(e, p), b = an('beer', p);
      for (const v of [verdictOf(a, b), verdictOf(b, a)]) {
        expect(v).not.toMatch(/Beer (wins|is the lighter)/);
        expect(v).toMatch(/Espresso wins: no alcohol|3 espressos win: no alcohol|No clear winner: Beer brings alcohol; (3 espressos|Espresso) brings/); // (round 12: any alcohol weighs on the brain light)
      }
    }
    expect(verdictOf(an('espresso', P(16)), an('beer', P(16)))).toBe('🏆 Espresso wins: no alcohol, 213 fewer kcal.');
  });

  it('a sugary or late caffeinated drink against alcohol is a trade-off that names both costs', () => {
    expect(verdictOf(an('rakija', P(16)), an('1 can of cola', P(16)))).toBe('No clear winner: Rakija / brandy brings alcohol; Cola brings a blood sugar peak.');
    expect(verdictOf(an('espresso', P(22)), an('beer', P(22)))).toBe('No clear winner: Beer brings alcohol; Espresso brings caffeine at bedtime.');
  });

  it('two alcoholic drinks: less alcohol is "the lighter choice", never a trophy', () => {
    const p = P(16), beer = an('beer', p), wine = an('glass of red wine', p);
    expect(verdictOf(beer, wine)).toBe('Red wine is the lighter choice: less alcohol (16 g vs 20 g), 89 fewer kcal.');
    expect(verdictOf(beer, an('beer', p))).toBe('It’s close: Beer and Beer bring about the same alcohol (about 20 g).');
    expect(verdictOf(beer, an('2 beers', p))).toMatch(/^Beer is the lighter choice: less alcohol \(20 g vs 40 g\)/);
  });

  it('everyday alcohol-free pairs keep their plain answers', () => {
    const p = P(16);
    expect(verdictOf(an('1 can of cola', p), an('glass of water', p))).toBe('🏆 Water wins: no blood sugar peak, 139 fewer kcal.');
    expect(verdictOf(an('orange juice', p), an('1 orange', p))).toBe('🏆 Orange wins: a smaller blood sugar peak (+0.7 vs +1.9 mmol/L), 67 fewer kcal.');
    expect(verdictOf(an('orange juice', p), an('1 orange', p), 'mg/dL')).toMatch(/\(\+\d+ vs \+\d+ mg\/dL\)/);
    expect(verdictOf(an('espresso', P(8)), an('glass of water', P(8)))).toMatch(/^It’s close/); // a morning espresso is fine
    expect(verdictOf(an('espresso', P(22)), an('glass of water', P(22)))).toBe('🏆 Water wins: no caffeine.');
    expect(verdictOf(an('espresso', P(22)), an('green tea', P(22)))).toBe('🏆 Green tea wins: less caffeine (30 vs 63 mg).');
  });

  it('every pair of drinks: alcohol never wins, every winner has a reason, order does not matter', () => {
    const drinks = FOODS.filter((f) => f.kind === 'liquid');
    expect(drinks.length).toBeGreaterThan(20);
    for (const h of [16, 22]) {
      const p = P(h), xs = drinks.map((f) => analyze([servingPart(f, 1)], p));
      for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) {
        const a = xs[i], b = xs[j], v = verdictOf(a, b), w = winnerOf(v);
        if (w) {
          expect(v, v).toMatch(/ wins: .+\.$/);
          const win = w === a.name ? a : b;
          if (hasAlc(a) !== hasAlc(b)) expect(hasAlc(win), v).toBe(false);
          expect(hasAlc(a) && hasAlc(b), v).toBe(false); // two alcoholic drinks never get a trophy
        }
        expect(v).not.toMatch(/NaN|undefined|null/);
        expect(v.length, v).toBeLessThanOrEqual(120); // fits the 2-line verdict box of the comparison video
        expect(verdictOf(b, a).replace(`${b.name} and ${a.name}`, `${a.name} and ${b.name}`), v).toBe(v);
      }
    }
  });
});
