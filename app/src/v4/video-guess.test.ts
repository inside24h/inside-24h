// The comparison video's guess is always answered, never a tie (round 4, 2026-10-24): for every pair the app offers
// (Compare PAIRS) plus the owner's two sample pairs, at several times of day.
import { describe, expect, it } from 'vitest';
import { parseMeal } from './food/parse';
import { DEFAULT_PROFILE } from '../science/profile';
import { analyze } from './analyze';
import { aboutTime, chooseGuess, clearlyApart, guessSideOf, outAt } from './video-guess';

const PAIRS: [string, string][] = [ // = Compare.tsx PAIRS (a React file; the list is repeated here on purpose)
  ['1 can of cola', '330 ml of water'], ['1 can of cola', 'diet cola'], ['orange juice', '1 orange'],
  ['beer', 'glass of red wine'], ['doughnut', '1 apple'], ['white bread', 'rye bread'],
  ['espresso', 'energy drink'], ['cornflakes', 'oatmeal'], ['potato chips', 'almonds'],
  ['milk chocolate', 'dark chocolate'], ['white rice', 'lentils'], ['coffee with milk', 'cappuccino'],
  ['espresso', 'beer'], ['cola', 'glass of water'], ['cola', '330 ml of water'],
];
const words = (s: string) => s.trim().split(/\s+/).length;

describe('the comparison guess', () => {
  for (const [x, y] of PAIRS) for (const h of [8, 17, 21]) {
    it(`${x} vs ${y} at ${h}:00: a clear question or none, and its answer is right`, () => {
      const p = { ...DEFAULT_PROFILE, drinkAtMin: h * 60 };
      const a = analyze(parseMeal(x), p), b = analyze(parseMeal(y), p);
      const A = guessSideOf(a), B = guessSideOf(b);
      const g = chooseGuess(A, B);
      if (!g) return; // nothing clear to ask: the video asks no guess (and its end card asks no "Did you guess right?")
      expect(words(g.question)).toBeLessThanOrEqual(7);
      expect(g.answer1.length + g.answer2.length).toBeLessThan(90);
      expect(g.recap).toContain([A, B][g.winner].name);
      const loser = 1 - g.winner;
      if (g.kind === 'stomach') {
        // round 5: a fair race (about the same amount); round 14 (owner): ±30 %, the typical servings are said on screen first
        expect(Math.abs(A.amount! - B.amount!)).toBeLessThanOrEqual(0.3 * Math.max(A.amount!, B.amount!));
        const t = [outAt(A.stomach), outAt(B.stomach)];
        expect(t[g.winner]).toBe(g.decidedMin);
        expect(t[g.winner]!).toBeLessThan(t[loser]!);
        expect(clearlyApart(t[0]!, t[1]!)).toBe(true); // never a near-tie
        expect(g.answer2).toContain(aboutTime(g.decidedMin));
      }
      if (g.kind === 'blood') expect(g.decidedMin).toBeLessThan(1440);
      // the race bars end where the answer says: the winner's bar is full at the decided minute, the loser's not yet
      if (g.kind !== 'sugar' && g.kind !== 'sugarG') { expect(g.progress[g.winner][g.decidedMin]).toBe(1); expect(g.progress[loser][g.decidedMin]).toBeLessThan(1); }
      if (g.kind === 'sugarG') expect([A, B][g.winner].sugarG!).toBeGreaterThan([A, B][loser].sugarG!); // (round 15)
      expect(`${g.question} ${g.answer1} ${g.answer2} ${g.recap}`).not.toMatch(/\b(wins?|best|better|healthy)\b/i);
    });
  }
  it('round 6: espresso vs beer is never a race the beer wins: it asks what is still in you at bedtime', () => {
    const p = { ...DEFAULT_PROFILE, drinkAtMin: 17 * 60 };
    const a = analyze(parseMeal('espresso'), p), b = analyze(parseMeal('beer'), p);
    const bedMin = (((p.bedtimeMin - p.drinkAtMin) % 1440) + 1440) % 1440;
    expect(chooseGuess(guessSideOf(a), guessSideOf(b))?.kind ?? 'none').not.toMatch(/stomach|blood/);
    const g = chooseGuess(guessSideOf(a), guessSideOf(b), { bedMin })!;
    expect(g.kind).toBe('bedtime'); expect(g.winner).toBe(0); // the espresso's caffeine is still there, the beer is out
    expect(g.answer2).toMatch(/^About \d+ mg of caffeine\. The beer is out\.$/);
    expect(`${g.answer1} ${g.recap}`).not.toMatch(/\b(wins?|best|better)\b/i);
  });
  it('round 6: with alcohol on a side the blood race is never asked', () => {
    for (const [x, y] of [['espresso', 'beer'], ['beer', 'glass of red wine'], ['espresso', 'glass of red wine']]) for (const h of [8, 17, 21]) {
      const p = { ...DEFAULT_PROFILE, drinkAtMin: h * 60 };
      const g = chooseGuess(guessSideOf(analyze(parseMeal(x), p)), guessSideOf(analyze(parseMeal(y), p)), { bedMin: (((p.bedtimeMin - p.drinkAtMin) % 1440) + 1440) % 1440 });
      expect(g?.kind ?? 'none', `${x}/${y} ${h}`).not.toBe('blood');
    }
  });
  it('round 14 (owner: typical servings, said on screen): cola vs a glass (250 ml) is a stomach race too; so is cola vs 330 ml of water, and water is out first', () => {
    const c = analyze(parseMeal('cola'), DEFAULT_PROFILE);
    expect(chooseGuess(guessSideOf(c), guessSideOf(analyze(parseMeal('glass of water'), DEFAULT_PROFILE)))?.kind).toBe('stomach');
    const g = chooseGuess(guessSideOf(c, 'Cola'), guessSideOf(analyze(parseMeal('330 ml of water'), DEFAULT_PROFILE), 'Water'))!;
    expect(g.kind).toBe('stomach'); expect(g.answer1).toBe('First out: Water.');
  });
  it('round 5: unequal amounts never get the stomach question', () => {
    const flat = (t: number, v: number) => Float32Array.from({ length: 1441 }, (_, m) => (m < 1 ? 0 : m < t ? v : 0));
    expect(chooseGuess({ name: 'A', stomach: flat(30, 30) }, { name: 'B', stomach: flat(90, 500) })).toBeNull();
    expect(chooseGuess({ name: 'A', stomach: flat(30, 330) }, { name: 'B', stomach: flat(90, 340) })?.kind).toBe('stomach');
  });
  it('a near-tie is never asked', () => {
    const flat = (t: number) => Float32Array.from({ length: 1441 }, (_, m) => (m < 1 ? 0 : m < t ? 100 : 0));
    expect(chooseGuess({ name: 'A', stomach: flat(60) }, { name: 'B', stomach: flat(66) })).toBeNull();
    expect(chooseGuess({ name: 'A', stomach: flat(30) }, { name: 'B', stomach: flat(90) })?.winner).toBe(0);
  });
  it('plain times', () => { expect(aboutTime(23)).toBe('about 25 min'); expect(aboutTime(95)).toBe('about 1½ h'); expect(aboutTime(180)).toBe('about 3 h'); });
});
