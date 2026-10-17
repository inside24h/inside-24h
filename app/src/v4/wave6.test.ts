// Wave 6 (research/improvements/science-fixes-2026-10-16.md): honest, dose-aware sleep answers for alcohol near
// bedtime (Ebrahim 2013 [AL6, A]; Pietilä 2018 [AL8, B]), drinks after the usual bedtime judged against tonight,
// and a Brain & sleep light that is never calmer than the sleep answer.
import { describe, expect, it } from 'vitest';
import { parseMeal } from './food/parse';
import { DEFAULT_PROFILE, type Profile } from '../science/profile';
import { alcoholSleepTier, minutesToBed, SLEEP_WINDOW_MIN } from '../science/daily';
import { quickAnswers, type AnswerInput } from './Answers';
import { analyze } from './analyze';
import { FOOD_CLAIMS } from '../content/food';
import { SOURCES } from '../content/sources';

const at = (h: number, m = 0): Profile => ({ ...DEFAULT_PROFILE, drinkAtMin: h * 60 + m, bedtimeMin: 23 * 60, wakeMin: 7 * 60 });
const sleepOf = (text: string, p: Profile) => {
  const a = analyze(parseMeal(text), p);
  const ans = a.answers.find((x) => x.q === 'Will I sleep well?')!;
  const brain = a.systems.find((s) => s.key === 'brain')!;
  const toBed = minutesToBed(p);
  let light = 0;
  for (let m = toBed; m <= Math.min(1440, toBed + SLEEP_WINDOW_MIN); m++) light = Math.max(light, brain.levels[m]);
  return { ans, light, brain, a };
};
const OVERCLAIM = /won.t affect|not affect your sleep|Nothing from this/i;

describe('wave 6: alcohol near bedtime', () => {
  it('a glass of wine at 23:50 never says it won’t affect your sleep, and names the second half of the night', () => {
    const { ans } = sleepOf('a glass of wine', at(23, 50));
    expect(ans.a).not.toMatch(OVERCLAIM);
    expect(ans.a).not.toMatch(/^Yes/);
    expect(ans.a).toMatch(/second half of the night/);
    expect(ans.a).toMatch(/one drink the effect is small/i);
    expect(ans.tone).toBeGreaterThanOrEqual(1);
    expect(ans.note).toMatch(/Evidence A .* B/);
  });
  it('beer, rakija and a meal with alcohol near bedtime are flagged too; bigger doses get stronger wording', () => {
    for (const t of ['beer', 'rakija', 'burger and a beer', '3 glasses of wine', '5 rakija']) {
      for (const p of [at(22, 30), at(23, 50), at(0, 30)]) {
        const { ans } = sleepOf(t, p);
        expect(ans.a, `${t} @ ${p.drinkAtMin}`).not.toMatch(OVERCLAIM);
        expect(ans.a, `${t} @ ${p.drinkAtMin}`).toMatch(/alcohol is still in your blood/);
        expect(ans.tone, `${t} @ ${p.drinkAtMin}`).toBeGreaterThanOrEqual(1);
      }
    }
    expect(sleepOf('5 rakija', at(22, 30)).ans.a).toMatch(/clearly broken|less dream \(REM\)/);
    expect(alcoholSleepTier(14 / 70)).toBe('low');
    expect(alcoholSleepTier(0.5)).toBe('moderate');
    expect(alcoholSleepTier(0.8)).toBe('high');
  });
  it('wine in the early afternoon: "Probably", never a flat "won’t affect"', () => {
    const { ans } = sleepOf('a glass of wine', at(13));
    expect(ans.a).toMatch(/^Probably/);
    expect(ans.a).not.toMatch(OVERCLAIM);
  });
  it('the alcohol sleep claims are listed with their sources', () => {
    expect(FOOD_CLAIMS.AL6.level).toBe('A');
    expect(FOOD_CLAIMS.AL6.sources).toContain('ebrahim2013');
    expect(FOOD_CLAIMS.AL8.level).toBe('B');
    expect(FOOD_CLAIMS.AL8.sources).toContain('pietila2018');
    expect(SOURCES.pietila2018?.url).toMatch(/PMC5878366/);
  });
});

describe('wave 6: the Brain & sleep light matches the sleep answer', () => {
  const cases: [string, Profile][] = [
    ['espresso', at(20, 45)], ['espresso', at(22, 50)], ['espresso', at(23, 50)], ['espresso', at(9)],
    ['a glass of wine', at(23, 50)], ['a glass of wine', at(21)], ['5 rakija', at(22)], ['cola', at(23)], ['glass of water', at(23, 50)],
  ];
  for (const [t, p] of cases) {
    it(`${t} at ${String(Math.floor(p.drinkAtMin / 60)).padStart(2, '0')}:${String(p.drinkAtMin % 60).padStart(2, '0')}`, () => {
      const { ans, light } = sleepOf(t, p);
      expect(ans.tone).toBe(light);
      if (ans.tone === 0) expect(ans.a).toMatch(/^Yes|^Probably/);
    });
  }
  it('espresso at 20:45: the cautious tier lights yellow at night and the evening text points to bedtime', () => {
    const { ans, brain } = sleepOf('espresso', at(20, 45));
    expect(ans.a).toMatch(/^Probably, unless caffeine affects you easily/);
    const night = minutesToBed(at(20, 45)) + 30;
    expect(brain.levels[night]).toBe(1);
    expect(brain.says(1, night)).toMatch(/sensitive people/);
    expect(brain.says(0, 10)).toMatch(/still be in you at bedtime/);
  });
  it('espresso at 23:50 (after the usual bedtime) is judged against tonight, not tomorrow night', () => {
    expect(minutesToBed(at(23, 50))).toBe(0);
    expect(minutesToBed(at(20, 45))).toBe(135);
    expect(minutesToBed(at(9))).toBe(14 * 60);
    const { ans } = sleepOf('espresso', at(23, 50));
    expect(ans.a).not.toMatch(OVERCLAIM);
    expect(ans.a).not.toMatch(/^Yes/);
  });
  it('the plain answer without lights still never calls alcohol harmless for sleep', () => {
    const bac = new Float64Array(1441); for (let m = 0; m < 1441; m++) bac[m] = m < 180 ? 0.2 : 0;
    const x: AnswerInput = { systems: [], drinkAt: 23 * 60 + 50, bedtimeMin: 23 * 60, wakeMin: 7 * 60, weightKg: 70, kcal: 120, extraSleepMin: 0, caffeineAtBedMg: 0, waterMl: 130, bac, alcoholG: 14 };
    const s = quickAnswers(x).find((a) => a.q === 'Will I sleep well?')!;
    expect(s.a).toMatch(/second half of the night/);
    expect(s.tone).toBe(1);
  });
});
