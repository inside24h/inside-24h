// Wave 7 (research/improvements/qa-final-2026-10-16.md): the night light for the cautious caffeine tier only covers
// the hours the caffeine is above the cautious level, the day summary words it as a "maybe", and a meal or drink with
// both alcohol and caffeine near bed names both in the sleep answer and in the bed chapter.
import { describe, expect, it } from 'vitest';
import { parseMeal } from './food/parse';
import { DEFAULT_PROFILE, type Profile } from '../science/profile';
import { caffeineAlsoSentence, minutesToBed, SLEEP_WINDOW_MIN } from '../science/daily';
import { analyze } from './analyze';
import { verdict } from './status';

const at = (h: number, m = 0): Profile => ({ ...DEFAULT_PROFILE, drinkAtMin: h * 60 + m, bedtimeMin: 23 * 60, wakeMin: 7 * 60 });
const run = (text: string, p: Profile) => {
  const a = analyze(parseMeal(text), p);
  const ans = a.answers.find((x) => x.q === 'Will I sleep well?')!;
  const brain = a.systems.find((s) => s.key === 'brain')!;
  const toBed = minutesToBed(p);
  let light = 0;
  for (let m = toBed; m <= Math.min(1440, toBed + SLEEP_WINDOW_MIN); m++) light = Math.max(light, brain.levels[m]);
  return { a, ans, brain, light, sum: verdict(a.systems, p.drinkAtMin) };
};
const clock = (p: Profile, m: number) => (p.drinkAtMin + m) % 1440;

describe('wave 7: cautious caffeine tier, honest day summary', () => {
  for (const p of [at(20, 45), at(23, 10)]) {
    it(`espresso at ${Math.floor(p.drinkAtMin / 60)}:${String(p.drinkAtMin % 60).padStart(2, '0')}: yellow only while the caffeine is there, worded as a maybe`, () => {
      const { ans, brain, light, sum } = run('espresso', p);
      expect(ans.a).toMatch(/^Probably, unless caffeine affects you easily/);
      expect(ans.tone).toBe(1);
      expect(light).toBe(1); // the light still matches the answer while falling asleep
      // the summary no longer says "mild stress" for the brain, and no longer runs to the morning
      expect(sum).not.toMatch(/Brain & sleep: mild stress/);
      expect(sum).toMatch(/Brain & sleep: maybe lighter sleep \d\d:\d\d–\d\d:\d\d if caffeine affects you easily/);
      expect(sum).not.toMatch(/–0[5-7]:\d\d if caffeine/);
      // green again well before waking: the last yellow minute is before 04:00
      let last = -1; for (let m = 0; m < brain.levels.length; m++) if (brain.levels[m] > 0) last = m;
      const c = clock(p, last);
      expect(c < 4 * 60 || c > 20 * 60).toBe(true);
      expect(brain.says(0, last + 30)).toBe('Sleeping normally.');
    });
  }
  it('a strong delay (5+ min) keeps its plain "stress" wording', () => {
    const { ans, sum } = run('3 espresso', at(21));
    expect(ans.a).toMatch(/min longer to fall asleep/);
    expect(sum).toMatch(/Brain & sleep: (mild|high) stress/);
  });
});

describe('wave 7: alcohol and caffeine together near bed', () => {
  it('rakija with an espresso at 22:30: the sleep answer names the alcohol first, then the caffeine', () => {
    const { ans, light, a } = run('rakija and an espresso', at(22, 30));
    expect(ans.a).toMatch(/^Not (quite|as well): alcohol is still in your blood/);
    expect(ans.a).toMatch(/caffeine/i);
    expect(ans.a).not.toMatch(/won.t affect/i);
    expect(ans.tone).toBe(light);
    const bed = a.built.story.chapters.find((c) => c.title === 'Bedtime' || c.title === 'Going to bed')!;
    expect(bed.text).toMatch(/alcohol/);
    expect(bed.text).toMatch(/caffeine/i);
  });
  it('the caffeine sentence follows the caffeine tiers', () => {
    expect(caffeineAlsoSentence('none', 0)).toBe('');
    expect(caffeineAlsoSentence('sensitive', 0)).toMatch(/if caffeine affects you easily/);
    expect(caffeineAlsoSentence('delay', 2)).toMatch(/if caffeine affects you easily/);
    expect(caffeineAlsoSentence('delay', 9)).toMatch(/about 9 min to the time it takes you to fall asleep/);
    const { ans } = run('rakija and 3 espresso', at(21, 30));
    expect(ans.a).toMatch(/alcohol is still in your blood/);
    expect(ans.a).toMatch(/min to the time it takes you to fall asleep/);
  });
  it('alcohol without caffeine says nothing about caffeine', () => {
    for (const t of ['beer', 'a glass of wine', '3 rakija']) {
      const { ans } = run(t, at(22, 30));
      expect(ans.a, t).toMatch(/alcohol is still in your blood/);
      expect(ans.a, t).not.toMatch(/caffeine/i);
    }
  });
});

describe('wave 7: drinks right at bedtime', () => {
  it('cola at 23:00 (= bedtime) never says the caffeine is "gone", and its bed chapter is not on the first sip', () => {
    const p = at(23);
    const { ans, a } = run('cola', p);
    expect(ans.a).not.toMatch(/gone|no caffeine/);
    expect(ans.a).toMatch(/^Yes. There is only a little caffeine in it/);
    const bed = a.built.story.chapters.find((c) => c.title === 'Bedtime' || c.title === 'Going to bed')!;
    expect(bed.title).toBe('Going to bed');
    expect(bed.min).toBe(30);
    expect(bed.text).not.toMatch(/About 0 mg/);
  });
  it('wine at 22:45 (15 min before bed) gets a bed chapter about the alcohol', () => {
    const { a } = run('a glass of wine', at(22, 45));
    const bed = a.built.story.chapters.find((c) => c.title === 'Bedtime' || c.title === 'Going to bed');
    expect(bed?.text).toMatch(/alcohol is still in your blood|still alcohol in your blood/i);
  });
  it('wine at 23:00 (= bedtime) gets a "Going to bed" chapter', () => {
    const { a } = run('a glass of wine', at(23));
    const bed = a.built.story.chapters.find((c) => c.title === 'Going to bed');
    expect(bed?.min).toBe(30);
  });
});
