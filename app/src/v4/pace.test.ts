// "Over how long?" (PACING, 2026-10-19; research/improvements/pacing-2026-10-19.md): servings spread as equal rounds.
// Zero-order liver: spreading lowers the alcohol peak but barely moves the end (Widmark from the start of drinking,
// Searle 2015; Oshima 2022); caffeine rounds add up; all at once and every old link behave exactly as before.
import { describe, expect, it } from 'vitest';
import { FOOD_BY_ID, parseMeal, servingPart, type Part } from './food/parse';
import { DEFAULT_PROFILE, type Profile } from '../science/profile';
import { analyze } from './analyze';
import { alcoholClock } from '../science/alcoholClock';
import { paceStarts, simulateFood } from '../science/foodSim';
import { simulateEspresso } from '../science/espressoSim';
import { canPace, cleanPace, paceDoses, toMeal } from './food/meal';
import { parsePace, readLink, resolveLink, writeLink } from './deeplink';
import { makeFoodProduct } from './food/foodProduct';

const P = (o: Partial<Profile> = {}): Profile => ({ ...DEFAULT_PROFILE, drinkAtMin: 21 * 60, bedtimeMin: 23 * 60, wakeMin: 7 * 60, ...o });
const parts = (id: string, n: number): Part[] => [servingPart(FOOD_BY_ID[id], n)];
const sim = (ps: Part[], over: number, p = P()) => simulateFood(toMeal(ps, undefined, over), p);
const peakOf = (a: ArrayLike<number>) => { let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, a[i]); return m; };
const ans = (a: ReturnType<typeof analyze>, q: RegExp) => a.answers.find((x) => q.test(x.q));

describe('alcohol: lower peak, about the same end', () => {
  it('5 beers: the peak falls the longer they are spread; gone at the same minute (zero-order liver)', () => {
    const once = sim(parts('beer', 5), 0), peaks = [0, 60, 120, 180, 240].map((o) => peakOf(sim(parts('beer', 5), o).bac));
    for (let i = 1; i < peaks.length; i++) expect(peaks[i]).toBeLessThan(peaks[i - 1]);
    expect(peaks[3]).toBeLessThan(0.9 * peaks[0]); // over 3 h clearly lower
    const gOnce = alcoholClock(once.bac).goneMin;
    for (const o of [60, 120, 180, 240]) expect(Math.abs(alcoholClock(sim(parts('beer', 5), o).bac).goneMin - gOnce)).toBeLessThanOrEqual(15);
  });
  it('Widmark by hand (70 kg man): gone ≈ C0 / β from the first sip, paced peak ≈ C0 − β × time to the evening peak', () => {
    const p = P(), m = toMeal(parts('beer', 5));
    const bmi = p.weightKg / (p.heightCm / 100) ** 2, r = 1.0181 - 0.01213 * bmi; // Forrest (foodSim.ts)
    const c0 = (m.alcoholG * (m.alcoholF ?? 1)) / (r * p.weightKg); // g/L if it were all in the blood at once
    const s = sim(parts('beer', 5), 180), clk = alcoholClock(s.bac);
    expect(clk.goneMin / 60).toBeGreaterThan(0.95 * (c0 / 0.12)); // ≈ 14.2 h
    expect(clk.goneMin / 60).toBeLessThan(1.05 * (c0 / 0.12));
    expect(Math.abs(clk.peak - (c0 - 0.12 * (clk.peakMin / 60)))).toBeLessThan(0.1);
  });
  it('rakija and wine too; a slow liver needs about as long as with everything at once (pivot at the first round)', () => {
    for (const id of ['rakija', 'red-wine']) {
      if (!FOOD_BY_ID[id]) continue;
      const a = sim(parts(id, 3), 0), b = sim(parts(id, 3), 120);
      expect(peakOf(b.bac)).toBeLessThan(peakOf(a.bac));
      const ca = alcoholClock(a.bac), cb = alcoholClock(b.bac, ca.peakMin);
      expect(Math.abs(cb.goneMin - ca.goneMin)).toBeLessThanOrEqual(15);
      expect(Math.abs(cb.latestMin - ca.latestMin)).toBeLessThanOrEqual(30);
    }
  });
  it('drinks so far apart that the blood is clear in between: "gone" is after the LAST drink, never between two', () => {
    const s = sim(parts('rakija', 2), 240), clk = alcoholClock(s.bac);
    expect(clk.goneMin).toBeGreaterThan(paceStarts({ pace: { doses: 2, overMin: 240 } })[1]);
  });
  it('same calories and water reach the body; only later', () => {
    const a = sim(parts('beer', 5), 0), b = sim(parts('beer', 5), 240);
    expect(b.kcalAbsorbed[1440]).toBeCloseTo(a.kcalAbsorbed[1440], -1);
    expect(Math.abs(b.bladder[1440] - a.bladder[1440]) / a.bladder[1440]).toBeLessThan(0.02);
    expect(b.kcalAbsorbed[60]).toBeLessThan(a.kcalAbsorbed[60]);
  });
});

describe('caffeine and sugar in rounds', () => {
  it('4 espressos over 3 h = four single doses added up (water-like, the stomach is never the bottleneck)', () => {
    const p = P({ drinkAtMin: 9 * 60 });
    const s = sim(parts('espresso', 4), 180), starts = s.pace!.startsMin;
    expect(starts).toEqual([0, 45, 90, 135]);
    expect(s.caffeine.doseMg).toBeCloseTo(4 * toMeal(parts('espresso', 1)).caffeineMg, 3);
    const one = simulateEspresso(toMeal(parts('espresso', 1)).caffeineMg, p, 1440, Math.max(13, s.pace!.doseT50));
    // (the one-dose check uses the whole-minute half-time, 14 vs 13.2 min, so the first minutes differ a little)
    for (const [t, tol] of [[30, 0.06], [100, 0.02], [200, 0.02], [400, 0.02], [900, 0.02]]) {
      const sum = starts.reduce((v, s0) => v + (t >= s0 ? one.conc[t - s0] : 0), 0);
      expect(Math.abs(s.caffeine.conc[t] - sum) / sum, `t=${t}`).toBeLessThan(tol);
    }
    const once = sim(parts('espresso', 4), 0);
    expect(s.caffeine.peakConc).toBeLessThan(once.caffeine.peakConc);
    expect(s.caffeine.tmaxMin).toBeGreaterThan(once.caffeine.tmaxMin);
  });
  it('the stomach is never faster than all at once: 5 colas over 1 h are no higher in sugar or caffeine', () => {
    const a = sim(parts('cola', 5), 0), b = sim(parts('cola', 5), 60), c = sim(parts('cola', 5), 240);
    expect(b.glucosePeakMmol).toBeLessThanOrEqual(a.glucosePeakMmol + 1e-9);
    expect(b.caffeine.peakConc).toBeLessThan(1.02 * a.caffeine.peakConc);
    expect(c.glucosePeakMmol).toBeLessThan(a.glucosePeakMmol); // 1 can every 48 min: smaller waves
    expect(c.glucosePeakMmol).toBeGreaterThan(0.7 * sim(parts('cola', 1), 0).glucosePeakMmol); // each can still a rise
  });
});

describe('all at once = the old model exactly', () => {
  it('no pace, pace 0 and one serving give identical curves', () => {
    const ps = parts('beer', 3), a = simulateFood(toMeal(ps), P()), b = sim(ps, 0);
    expect(Array.from(b.bac)).toEqual(Array.from(a.bac));
    expect(Array.from(b.caffeine.conc)).toEqual(Array.from(a.caffeine.conc));
    expect(b.pace).toBeNull();
    const one = parts('beer', 1);
    expect(Array.from(sim(one, 180).bac)).toEqual(Array.from(simulateFood(toMeal(one), P()).bac));
    const meal = parseMeal('pizza and a beer');
    expect(Array.from(sim(meal, 120).glucoseDeltaMgDl)).toEqual(Array.from(simulateFood(toMeal(meal), P()).glucoseDeltaMgDl));
  });
  it('who gets the control: two or more servings, or a meal with two or more drinks', () => {
    expect(canPace(parts('beer', 1))).toBe(false);
    expect(paceDoses(parts('beer', 3))).toBe(3);
    expect(paceDoses(parseMeal('5 beers'))).toBe(5);
    const pizzaBeers = [...parseMeal('pizza'), ...parts('beer', 3)];
    expect(paceDoses(pizzaBeers)).toBe(3);
    expect(canPace(parseMeal('hamburger and cola'))).toBe(false);
    expect(cleanPace(90)).toBe(0); expect(cleanPace(180)).toBe(180);
  });
});

describe('deep link: over=3h', () => {
  it('round trip, and old links stay all at once', () => {
    const h = writeLink({ q: 'beer', n: 3, over: 180, t: 90 });
    expect(h).toMatch(/over=3h/);
    expect(readLink(h).over).toBe(180);
    expect(readLink(h).n).toBe(3);
    expect(readLink(writeLink(readLink(h))).over).toBe(180);
    expect(writeLink({ q: 'beer', n: 3, over: 0 })).not.toMatch(/over/);
    expect(readLink('#q=beer&n=3').over).toBeUndefined(); // old link: as before
    for (const bad of ['7h', '90m', 'zz', '-1h', '']) expect(readLink(`#q=beer&n=3&over=${bad}`).over).toBeUndefined();
    expect(parsePace('120')).toBe(120); expect(parsePace('2h')).toBe(120);
    expect(resolveLink('#m=pizza+beer*3&over=2h').link.over).toBe(120);
    // other keys pass through, and the app's own key is replaced, not doubled
    expect(writeLink({ q: 'beer', over: 60 }, '#over=4h&city=Zagreb')).toBe('#q=beer&over=1h&city=Zagreb');
  });
});

describe('what the screen says', () => {
  const p = P({ drinkAtMin: 21 * 60 });
  it('paced beers: the peak time, the all-at-once comparison, the same end, and tomorrow morning', () => {
    const a = analyze(parts('beer', 5), p, 180), once = analyze(parts('beer', 5), p);
    const gone = ans(a, /alcohol gone/)!.a;
    expect(gone).toMatch(/^Highest around \d{2}:\d{2}, after the last drink/);
    expect(gone).toMatch(/lowered the peak, not the end/);
    expect(ans(a, /^Can I drive\?/)!.a).toMatch(/5 drinks spread over 3 h; all at once about/);
    expect(ans(a, /^Can I drive\?/)!.a).not.toMatch(/\d{2}:\d{2}/); // still no clock time in the driving answer
    expect(ans(a, /tomorrow morning/)!.a).toMatch(/^No\./);
    expect(ans(once, /alcohol gone/)!.a).toMatch(/pick “Over how long\?” to spread it/);
    const ch = a.built.story.chapters;
    expect(ch.find((c) => c.title === 'Last drink')!.min).toBe(144);
    expect(ch.find((c) => c.title === 'Alcohol peak')!.text).toMatch(/Spread over 3 h\. All at once it would have been about/);
    expect(ch[0].text).toMatch(/Spread over 3 h: 5 drinks, one about every 36 minutes/);
    expect(a.built.story.chapters.find((c) => c.title === 'Alcohol peak')!.claims).toContain('AL16');
  });
  it('the 24 h overflow is still said out loud when paced', () => {
    const a = analyze(parts('beer', 10), p, 240);
    const gone = ans(a, /alcohol gone/)!.a;
    expect(gone).toMatch(/Not within the 24 hours shown here/);
    expect(gone).toMatch(/needs about \d+ h/);
    expect(a.built.story.chapters.some((c) => c.title === 'Still alcohol after 24 h')).toBe(true);
    expect(a.built.story.chapters.some((c) => c.title === 'Alcohol gone')).toBe(false);
  });
  it('a meal in rounds says so, and the product carries the pace for the answers', () => {
    const meal = [...parseMeal('pizza'), ...parts('beer', 3)];
    const def = makeFoodProduct(meal, 'food', 120), b = def.build(p, 63);
    expect(b.pace).toMatchObject({ doses: 3, overMin: 120 });
    expect(b.story.chapters[0].text).toMatch(/3 rounds, one about every 40 minutes \(each round a share of everything\)/);
    expect(b.story.chapters.some((c) => c.title === 'Last round')).toBe(true);
  });
});
