// "Does this make sense to a normal person?" audit (research/improvements/sense-audit-2026-10-18.md):
// unambiguous labels, alcohol gone-times that scale with the number of drinks, an honest next-morning answer,
// the 24 h overflow said out loud, and the alcohol / blood sugar note.
import { describe, expect, it } from 'vitest';
import { FOOD_BY_ID, servingPart } from './food/parse';
import { DEFAULT_PROFILE, type Profile } from '../science/profile';
import { analyze } from './analyze';
import { SHORT_LABEL, verdict } from './status';
import { healthBars } from './healthBars';
import { alcoholClock } from '../science/alcoholClock';
import { FOOD_CLAIMS } from '../content/food';

const P = (over: Partial<Profile> = {}): Profile => ({ ...DEFAULT_PROFILE, drinkAtMin: 19 * 60, bedtimeMin: 23 * 60, wakeMin: 7 * 60, ...over });
const SMALL: Partial<Profile> = { sex: 'female', weightKg: 50, heightCm: 160 };
const run = (id: string, n: number, p: Profile = P()) => analyze([servingPart(FOOD_BY_ID[id], n)], p);
const ans = (a: ReturnType<typeof analyze>, q: RegExp) => a.answers.find((x) => q.test(x.q));

describe('labels say what they are about', () => {
  it('no light, bar or chip is called "Sugar" on its own', () => {
    expect(Object.values(SHORT_LABEL)).not.toContain('Sugar');
    expect(SHORT_LABEL.energy).toBe('Blood sugar');
    const a = run('rakija', 1);
    for (const s of a.systems) expect(s.label).not.toMatch(/^(Energy & )?sugar$/i);
    expect(a.systems.find((s) => s.key === 'energy')!.label).toMatch(/^Blood sugar/);
    for (const b of healthBars(DEFAULT_PROFILE, { cola: 1 })) expect(b.label).not.toBe('Sugar');
    // every source file: no `: 'Sugar'` label value (CalmBar.tsx now uses SHORT_LABEL too, 2026-10-18).
    const files = import.meta.glob(['./*.ts', './*.tsx', '!./*.test.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    expect(Object.keys(files).length).toBeGreaterThan(20);
    const offenders = Object.entries(files).filter(([, src]) => /:\s*'Sugar'|'Sugar \?'|'Sugar steady'|`Sugar \$\{/.test(src)).map(([f]) => f.replace('./', ''));
    expect(offenders).toEqual([]);
  });
  it('the day summary never calls a grey "not measured" light "no real effect", and never prints 19:01–19:01', () => {
    const beer = run('beer', 1);
    const v = verdict(beer.systems, 19 * 60);
    expect(v).toMatch(/Blood sugar & energy: not measured/);
    expect(v).not.toMatch(/Blood sugar[^.]*no real effect/);
    const huge = run('rakija', 15, P(SMALL));
    const hv = verdict(huge.systems, 19 * 60);
    expect(hv).toMatch(/past 24 h/);
    expect(hv).not.toMatch(/(\d\d:\d\d)–\1/);
  });
  it('a little alcohol is not "no real effect" for the brain', () => {
    const big = run('rakija', 1, P({ sex: 'male', weightKg: 100, heightCm: 185 }));
    expect(verdict(big.systems, 19 * 60)).toMatch(/Brain & sleep: a little alcohol in your blood .* don’t drive/);
  });
});

describe('alcohol: gone-time, next morning, overflow', () => {
  it('the gone-time grows with the number of drinks, about in proportion, and the range brackets it', () => {
    for (const id of ['beer', 'red-wine', 'rakija']) {
      const g = [1, 3, 5, 10].map((n) => alcoholClock(run(id, n).built.bac!));
      for (let i = 1; i < g.length; i++) expect(g[i].goneMin, `${id} ${i}`).toBeGreaterThan(g[i - 1].goneMin);
      const r = g[3].goneMin / g[2].goneMin;
      expect(r, id).toBeGreaterThan(1.6); expect(r, id).toBeLessThan(2.3);
      for (const c of g) { expect(c.earliestMin).toBeLessThanOrEqual(c.goneMin); expect(c.latestMin).toBeGreaterThanOrEqual(c.goneMin); }
    }
  });
  it('the answer and the chapter give the same typical time', () => {
    const a = run('beer', 3);
    const gone = a.built.story.chapters.find((c) => c.title === 'Alcohol gone')!;
    const t = `${String(Math.floor((19 * 60 + gone.min) / 60) % 24).padStart(2, '0')}:${String((19 * 60 + gone.min) % 60).padStart(2, '0')}`;
    expect(ans(a, /When is the alcohol gone/)!.a).toContain(t);
  });
  it('"Can I drive tomorrow morning?" exists for evening drinks, is honest at 1, 5, 10 drinks and never says safe', () => {
    for (const id of ['beer', 'red-wine', 'rakija']) for (const n of [1, 3, 5, 10]) for (const t of [19 * 60, 23 * 60]) {
      const a = run(id, n, P({ drinkAtMin: t }));
      const m = ans(a, /Can I drive tomorrow morning/);
      expect(m, `${id}×${n}@${t}`).toBeDefined();
      expect(m!.a).not.toMatch(/^Yes|you are safe|you’re safe to|safe to drive(?! )/i);
      expect(m!.a).toMatch(/Croatia: 0\.5 ‰ for most drivers and 0 ‰ for novice and professional drivers/);
      expect(m!.tone).toBeGreaterThanOrEqual(1);
    }
    // the friend who blew positive after 12 h of sleep: 10 beers at 23:00 are still in the blood at 07:00
    expect(ans(run('beer', 10, P({ drinkAtMin: 23 * 60 })), /tomorrow morning/)!.a).toMatch(/^No\. At 07:00/);
    expect(ans(run('beer', 5, P({ drinkAtMin: 23 * 60 })), /tomorrow morning/)!.a).toMatch(/^No/);
    // one beer at 19:00 is gone, but the hangover sentence stays
    expect(ans(run('beer', 1), /tomorrow morning/)!.a).toMatch(/hangover/);
  });
  it('more than 24 h is said out loud, never cut off silently', () => {
    const a = run('rakija', 15, P(SMALL));
    expect(ans(a, /When is the alcohol gone/)!.a).toMatch(/^Not within the 24 hours/);
    expect(a.built.story.chapters.find((c) => c.title === 'Still alcohol after 24 h')!.text).toMatch(/needs about \d+ h in total/);
    expect(a.built.story.chapters.some((c) => c.title === 'Alcohol gone')).toBe(false);
  });
  it('the danger warning appears at poisoning levels only', () => {
    expect(ans(run('rakija', 10, P(SMALL)), /dangerous/)).toBeDefined();
    expect(ans(run('beer', 1), /dangerous/)).toBeUndefined();
    expect(FOOD_CLAIMS.AL9.sources).toContain('jonesHolmgren2003');
  });
});

describe('alcohol and blood sugar', () => {
  it('rakija: "no sugar in it" AND the later-dip note; the story says plain spirits have no sugar', () => {
    const a = run('rakija', 1);
    const s = ans(a, /blood sugar rise/)!;
    expect(s.a).toMatch(/almost no sugar/);
    expect(s.a).toMatch(/lower blood sugar later/);
    expect(s.a).toMatch(/insulin or diabetes tablets/);
    expect(a.built.story.chapters[0].text).toMatch(/No sugar: plain distilled spirits/);
    expect(a.systems.find((x) => x.key === 'energy')!.says(0, 60)).toMatch(/slows your liver’s sugar-making/);
    expect(run('red-wine', 1).built.story.chapters[0].text).not.toMatch(/No sugar/);
  });
  it('beer and wine get the note too; heavy drinking gets a yellow edge; the morning chapter warns only after a few drinks', () => {
    for (const id of ['beer', 'red-wine', 'white-wine']) expect(ans(run(id, 1), /blood sugar rise/)!.a).toMatch(/lower blood sugar later/);
    expect(ans(run('rakija', 1), /blood sugar rise/)!.tone).toBe(0);
    expect(ans(run('rakija', 10), /blood sugar rise/)!.tone).toBe(1);
    const morning = (n: number) => run('beer', n).built.story.chapters.find((c) => c.title === 'Next morning')!.text;
    expect(morning(1)).not.toMatch(/insulin/);
    expect(morning(3)).toMatch(/insulin or diabetes tablets/);
    expect(FOOD_CLAIMS.AL10.level).toBe('B');
    expect(FOOD_CLAIMS.AL11.sources).toContain('turner2001');
  });
  it('water from alcohol: no plain "Yes" beyond the tested amounts', () => {
    expect(ans(run('beer', 1), /count as water/)!.a).toMatch(/^Yes/);
    expect(ans(run('red-wine', 1), /count as water/)!.a).toMatch(/^Mostly/);
    expect(ans(run('beer', 5), /count as water/)!.a).toMatch(/^Not reliably/);
  });
  it('a drink is not "a big meal", and the resting-pressure tip only shows when YOUR pressure is high', () => {
    const a = run('beer', 10);
    expect(a.built.story.chapters.some((c) => c.title === 'Sleepy after eating')).toBe(false);
    expect(a.answers.some((x) => /resting blood pressure/.test(x.a))).toBe(false);
    const hi = run('beer', 10, P({ sbp: 142, dbp: 90 }));
    expect(hi.answers.some((x) => /resting blood pressure/.test(x.a))).toBe(true);
  });
  it('rakija leaves the stomach as fast as water and the text does not claim calories slowed it', () => {
    const st = run('rakija', 1).built.story.chapters.find((c) => c.title === 'In your stomach')!.text;
    expect(st).not.toMatch(/calories slow/);
  });
});
