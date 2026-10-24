// The comparison video's guess is always answered, never a tie (round 4, 2026-10-24): for every pair the app offers
// (Compare PAIRS) plus the owner's two sample pairs, at several times of day.
import { describe, expect, it } from 'vitest';
import { parseMeal } from './food/parse';
import { DEFAULT_PROFILE } from '../science/profile';
import { analyze } from './analyze';
import { aboutTime, chooseGuess, clearlyApart, guessSideOf, outAt } from './video-guess';

const PAIRS: [string, string][] = [ // = Compare.tsx PAIRS (a React file; the list is repeated here on purpose)
  ['1 can of cola', 'glass of water'], ['1 can of cola', 'diet cola'], ['orange juice', '1 orange'],
  ['beer', 'glass of red wine'], ['doughnut', '1 apple'], ['white bread', 'rye bread'],
  ['espresso', 'energy drink'], ['cornflakes', 'oatmeal'], ['potato chips', 'almonds'],
  ['milk chocolate', 'dark chocolate'], ['white rice', 'lentils'], ['coffee with milk', 'cappuccino'],
  ['espresso', 'beer'], ['cola', 'glass of water'],
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
        const t = [outAt(A.stomach), outAt(B.stomach)];
        expect(t[g.winner]).toBe(g.decidedMin);
        expect(t[g.winner]!).toBeLessThan(t[loser]!);
        expect(clearlyApart(t[0]!, t[1]!)).toBe(true); // never a near-tie
        expect(g.answer2).toContain(aboutTime(g.decidedMin));
      }
      if (g.kind === 'blood') expect(g.decidedMin).toBeLessThan(1440);
      // the race bars end where the answer says: the winner's bar is full at the decided minute, the loser's not yet
      if (g.kind !== 'sugar') { expect(g.progress[g.winner][g.decidedMin]).toBe(1); expect(g.progress[loser][g.decidedMin]).toBeLessThan(1); }
      expect(`${g.question} ${g.answer1} ${g.answer2} ${g.recap}`).not.toMatch(/\b(wins?|best|better|healthy)\b/i);
    });
  }
  it('espresso vs beer asks about the stomach and the espresso is out first', () => {
    const a = analyze(parseMeal('espresso'), DEFAULT_PROFILE), b = analyze(parseMeal('beer'), DEFAULT_PROFILE);
    const g = chooseGuess(guessSideOf(a), guessSideOf(b))!;
    expect(g.kind).toBe('stomach'); expect(g.winner).toBe(0);
    expect(g.answer1).toBe('First out: Espresso.');
  });
  it('a near-tie is never asked', () => {
    const flat = (t: number) => Float32Array.from({ length: 1441 }, (_, m) => (m < 1 ? 0 : m < t ? 100 : 0));
    expect(chooseGuess({ name: 'A', stomach: flat(60) }, { name: 'B', stomach: flat(66) })).toBeNull();
    expect(chooseGuess({ name: 'A', stomach: flat(30) }, { name: 'B', stomach: flat(90) })?.winner).toBe(0);
  });
  it('plain times', () => { expect(aboutTime(23)).toBe('about 25 min'); expect(aboutTime(95)).toBe('about 1½ h'); expect(aboutTime(180)).toBe('about 3 h'); });
});
