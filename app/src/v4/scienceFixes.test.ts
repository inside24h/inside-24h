// Science fixes 2026-10-16 (research/improvements/science-fixes-2026-10-16.md): one cola number, drink-specific
// glass sizes, honest late-caffeine wording, walking minutes that fall with body weight, the chosen sugar unit in
// Compare and the comparison video, and evidence letters that match what the studies can show.
import { describe, expect, it } from 'vitest';
import { macros, parseMeal } from './food/parse';
import { COLA } from '../science/colaSim';
import { PRODUCTS } from './products';
import { DEFAULT_PROFILE } from '../science/profile';
import { simulateEspresso } from '../science/espressoSim';
import { buildVitals } from '../science/daily';
import { sleepAnchors } from '../science/anchors';
import { walkingMinutes } from '../science/walking';
import { quickAnswers, type AnswerInput } from './Answers';
import { analyze, sugarDeltaText, sugarPeakText } from './analyze';
import { LONG_TERM } from '../content/longterm';

const ml = (text: string) => { const p = parseMeal(text)[0]; return Math.round(Number(/≈ (\d+) ml/.exec(p.amountLabel)?.[1] ?? NaN)); };

describe('1. cola: one source of truth (EU can label, cola.md P1/P5)', () => {
  it('search, meals and the cola story all say 139 kcal, 35 g sugar, 32 mg caffeine per 330 ml can', () => {
    for (const t of ['cola', '1 can of cola', 'coca cola']) {
      const m = macros(parseMeal(t));
      expect(Math.round(m.kcal), t).toBe(COLA.eu.kcal);
      expect(Math.round(m.sugars), t).toBe(COLA.eu.sugarG);
      expect(Math.round(m.caffeineMg), t).toBe(COLA.caffeineMg);
    }
    expect(PRODUCTS.cola.build(DEFAULT_PROFILE, 63).energy.total).toBe(COLA.eu.kcal);
  });
});

describe('2. a glass depends on the drink (level C sizes, shown as "≈ … ml")', () => {
  it('wine 150 ml, water and milk 250 ml, beer 300 ml, a cup of espresso is one 30 ml shot, an energy-drink can 250 ml', () => {
    expect(ml('a glass of wine')).toBe(150);
    expect(ml('glass of red wine')).toBe(150);
    expect(ml('čaša vina')).toBe(150);
    expect(ml('2 glasses of white wine')).toBe(150);
    expect(ml('glass of water')).toBe(250);
    expect(ml('glass of milk')).toBe(250);
    expect(ml('a glass of beer')).toBe(300);
    expect(ml('a cup of espresso')).toBe(30);
    expect(ml('a can of energy drink')).toBe(250);
    expect(ml('1 can of cola')).toBe(330);
  });
  it('"a glass of wine" is ≈ 127 kcal (150 ml), not 211 kcal (250 ml), and labels are English', () => {
    expect(Math.round(macros(parseMeal('a glass of wine')).kcal)).toBeLessThan(140);
    expect(parseMeal('čaša vina')[0].amountLabel).toBe('1 × glass (≈ 150 ml)');
    expect(parseMeal('2 glasses of white wine')[0].grams).toBeCloseTo(2 * parseMeal('glass of white wine')[0].grams, 6);
  });
});

describe('3. caffeine late in the day: no "too little to matter" above the meta-analysis level (VS1, VS4)', () => {
  const at = (dose: number, drinkAtMin: number) => {
    const p = { ...DEFAULT_PROFILE, drinkAtMin };
    return buildVitals(p, simulateEspresso(dose, p), sleepAnchors());
  };
  it('espresso 63 mg at 20:45 → ≈ 51 mg at 23:00: "sensitive", and the answer says sensitive people may sleep less', () => {
    const v = at(63, 20 * 60 + 45);
    expect(v.mgAtBed).toBeGreaterThan(45);
    expect(v.sleepRisk).toBe('sensitive');
    const base: AnswerInput = { systems: [], drinkAt: 20 * 60 + 45, bedtimeMin: 23 * 60, weightKg: 70, kcal: 3, extraSleepMin: v.extraLatencyMin, caffeineAtBedMg: v.mgAtBed, waterMl: 0, sleepRisk: v.sleepRisk };
    const a = quickAnswers(base).find((x) => x.q === 'Will I sleep well?')!;
    expect(a.a).not.toMatch(/too little/);
    expect(a.a).toMatch(/sensitive/);
    expect(a.tone).toBe(1);
  });
  it('espresso at 16:00 (≈ 30 mg left) stays "too little"; one right before bed is not (caffeine still rising, Drake 2013)', () => {
    expect(at(63, 16 * 60).sleepRisk).toBe('none');
    expect(at(63, 22 * 60 + 50).sleepRisk).not.toBe('none');
    expect(at(400, 19 * 60).sleepRisk).toBe('delay'); // 400 mg 4 h before bed [VS2]
  });
});

describe('4. walking minutes: fall as weight rises, sane at the extremes', () => {
  it('monotonic in body weight and independent of age and height', () => {
    let prev = Infinity;
    for (let kg = 35; kg <= 200; kg += 5) { const m = walkingMinutes(139, kg); expect(m).toBeLessThan(prev); prev = m; }
    expect(walkingMinutes(139, 300)).toBe(walkingMinutes(139, 200)); // held to the 35–200 kg the app accepts
    expect(walkingMinutes(139, 5)).toBe(walkingMinutes(139, 35));
    expect(walkingMinutes(139, NaN)).toBe(walkingMinutes(139, 70));
  });
  it('one can for 70 kg ≈ 48 min (≈ 4 km, activity.md D3): the model itself, kept on disk', () => {
    expect(Math.round(walkingMinutes(139, 70))).toBe(48);
  });
  // phase P1 (owner decision 2026-11-24): the answer says kcal and its share of a 2,000 kcal day, the same for every
  // body, and never minutes or km of walking
  it('the energy answer: kcal and % of a 2,000 kcal day, never walking', () => {
    const ans = (weightKg: number, kcal = 139) => quickAnswers({ systems: [], drinkAt: 16 * 60, bedtimeMin: 23 * 60, weightKg, kcal, extraSleepMin: 0, caffeineAtBedMg: 0, waterMl: 0 })
      .find((x) => x.q === 'How much energy is that?')!.a;
    expect(ans(70)).toBe('139 kcal · 7% of a 2,000 kcal day.');
    expect(ans(200)).toBe(ans(35));
    expect(ans(70, 945)).toBe('945 kcal · 47% of a 2,000 kcal day.');
    for (const kg of [35, 70, 200]) expect(ans(kg)).not.toMatch(/walk|min|km|burn/i);
  });
});

describe('6. Compare and the comparison video use the unit picked in "Your body"', () => {
  it('peak and change texts', () => {
    expect(sugarPeakText(2.3, 'mg/dL')).toBe('+41 mg/dL');
    expect(sugarPeakText(2.3, 'mmol/L')).toBe('+2.3 mmol/L');
    expect(sugarPeakText(0.1, 'mg/dL')).toBe('steady');
    expect(sugarPeakText(null, 'mg/dL')).toBe('not measured');
    expect(sugarDeltaText(-0.6, 'mg/dL')).toBe('−11 mg/dL');
  });
  it('the Compare answers for cola follow mg/dL', () => {
    const a = analyze(parseMeal('1 can of cola'), { ...DEFAULT_PROFILE, glucoseUnit: 'mg/dL' });
    const sugar = a.answers.find((x) => x.q === 'Will my blood sugar rise?')!.a;
    expect(sugar).toMatch(/mg\/dL/);
    expect(sugar).not.toMatch(/mmol/);
  });
});

describe('5. every-day panel: a link seen only by watching people is never level A', () => {
  it('association items are at most B', () => {
    for (const [p, x] of Object.entries(LONG_TERM)) for (const it of x.items) {
      if (it.kind === 'association') expect(['B', 'C', '?'], `${p}/${it.marker}`).toContain(it.level);
    }
  });
});
