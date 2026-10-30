// 2026-10-24 creative upgrade: hooks come from the model (no number that the video does not show), alcohol is never
// celebrated, the comparison game stays honest, and nothing flashes too often (WCAG 2.3.1).
import { describe, expect, it } from 'vitest';
import { minutesFromU, uFromMinutes } from '../time';
import { hookFor, hookForCompare, numbersIn } from './video-hook';
import { planVideo, type StopIn } from './video-plan';
import { drawBodyFrame, drawCmpFrame, kineticWord, logText, VIDEO_COPY, type CmpOverlay, type Overlay } from './share';
import { bacPlain, mainGauge, sugarPlain } from './video-body';
import fixtures from './video-plan.fixtures.json';
import { parseMeal } from './food/parse';
import { DEFAULT_PROFILE } from '../science/profile';
import { analyze } from './analyze';
import { worstMoment } from './status';
import { plainNote, plainSugar } from './video-body';

const FIX = fixtures as Record<string, StopIn[]>;
const words = (s: string) => s.trim().split(/\s+/).length;

describe('hooks', () => {
  const cases: [string, Parameters<typeof hookFor>[0]][] = [
    ['cola', { name: 'One can of cola', chapters: FIX.cola, caffeine: true }],
    ['espresso', { name: 'One espresso', chapters: FIX.espresso, caffeine: true }],
    ['beer', { name: '3 × 500 ml of beer over 2 h', chapters: FIX['beer-3-over-2h'], alcohol: true, pace: { doses: 3, round: 'drink' } }],
    ['pizza', { name: 'A whole pizza', chapters: FIX['pizza-whole'], solid: true, kcal: 2572 }],
    ['kebab', { name: '1 kebab', chapters: FIX.kebab, solid: true, kcal: 762 }],
    ['meal', { name: 'Hamburger + French fries + Cola', chapters: FIX['meal-burger-fries-cola'], solid: true, kcal: 833, caffeine: true }],
    ['water', { name: 'One glass of water', chapters: FIX.water }],
  ];
  for (const [name, h] of cases) it(`${name}: two short lines, every number comes from the video's own chapters`, () => {
    const k = hookFor(h);
    expect(words(k.line1)).toBeLessThanOrEqual(8); expect(words(k.line2)).toBeLessThanOrEqual(8);
    const source = `${h.name} ${h.chapters.map((c) => c.text).join(' ')}`;
    for (const n of numbersIn(`${k.line1} ${k.line2}`)) if (n !== '24') expect(source, `${name}: ${n}`).toContain(n); // ("24 hours" is the format itself)
    if (h.alcohol) expect(`${k.line1} ${k.line2}`).not.toMatch(/\b(best|wins?|better|healthy|cure|hangover)\b/i);
  });
  it('cola leads with its teaspoons, and says it is cola (round 5: the thumbnail says what it is)', () => {
    expect(hookFor(cases[0][1]).line1).toBe('One can of cola: 9 teaspoons of sugar.');
    expect(hookFor(cases[0][1]).payoff).toBe('The liver finishes'); // round 6: "Watch where it goes" is paid off where the sugar ends up
  });
  it('round 5: espresso says how much is still in you at bedtime, and that moment pays it off', () => {
    const k = hookFor({ ...cases[1][1], caffeineMg: 63 });
    expect(k.line2).toBe('Most is still in you at bedtime.'.replace('Most', 'Almost all'));
    expect(k.payoff).toBe('Going to bed');
  });
  it('round 5: a big food number comes with its size; the 24 h moment answers the promise', () => {
    const k = hookFor({ ...cases[3][1], grams: 1104 });
    expect(k.line1).toBe('A whole pizza (1104 g): 2572 kcal.'); expect(k.line2).toBe('Where is it 24 hours later?'); expect(k.payoff).toBe('24 hours later');
  });
  it('the comparison asks a question the race answers', () => {
    const k = hookForCompare('Espresso', 'Beer', true);
    expect(k.line1).toMatch(/^Guess: /); expect(words(k.line1)).toBeLessThanOrEqual(7);
  });
});

describe('comparison game honesty', () => {
  const side = (name: string, alcohol: boolean) => ({ name, color: alcohol ? '#e8a33a' : '#3a1d0e', step: 'Peak', caption: '', sugar: '', sugarLevel: 0 as const, alcohol,
    lights: [{ icon: '⚡', label: 'Blood sugar', level: 0 as const }, { icon: '❤', label: 'Heart', level: 0 as const }, { icon: '💧', label: 'Water', level: 0 as const }, { icon: '🧠', label: 'Brain', level: 1 as const }],
    summary: { kcal: 3, sugarPeak: 'steady', worst: [] } });
  const o: CmpOverlay = { hook: 'Guess: which leaves your stomach first?', clock: '', progress: 0.3, handle: '@inside24h', a: side('Espresso', false), b: side('Beer', true), guess: true, race: { a: 1, b: 1 } };
  const fake = () => new Proxy({ font: '10px x', globalAlpha: 1, textAlign: 'left' } as Record<string, unknown>, {
    get: (t, k: string) => (k === 'measureText' ? (s: string) => ({ width: s.length * 12 }) : k in t ? t[k] : () => ({ addColorStop() {} })),
    set: (t, k: string, v) => { t[k] = v; return true; },
  }) as unknown as CanvasRenderingContext2D;
  it('with alcohol on one side, the race finish says "Faster out ≠ better for you." and nobody gets a trophy', () => {
    const cues = [{ t: 5, kind: 'race' as const, data: { side: 1 as const } }];
    const boxes = logText(() => drawCmpFrame(fake(), 1080, 1920, { width: 1080, height: 1920 } as HTMLCanvasElement, o,
      { phase: 'main', m: 120, t: 6, capA: 1, k: 0, cap: 'Some caffeine is still in you.', capB: 'The alcohol is gone after about 3 h.' }, { stopsU: [0, 1], introS: 3, outroS: 8, cues }, null));
    const all = boxes.map((b) => b.text).join(' | ');
    expect(all).toContain(VIDEO_COPY.fasterOut);
    expect(all).not.toMatch(/🏆|wins/);
    expect(all).toContain('✓ OUT');
  });
  it('round 5: when the side WITHOUT alcohol is out first, "Faster out ≠ better for you." never shows (it read as "espresso is bad")', () => {
    const cues = [{ t: 5, kind: 'race' as const, data: { side: 0 as const } }, { t: 5, kind: 'peak' as const }];
    for (const t of [5.5, 7, 9, 11]) {
      const ans = { a1: 'First out: Espresso.', a2: 'Out of the stomach in about 25 min.', recap: 'Answer: Espresso left the stomach first.', kind: 'stomach' as const, winner: 0 as const };
      const boxes = logText(() => drawCmpFrame(fake(), 1080, 1920, { width: 1080, height: 1920 } as HTMLCanvasElement, { ...o, answer: ans },
        { phase: 'main', m: 120, t, capA: 1, k: 0, cap: 'x.', capB: 'y.' }, { stopsU: [0, 1], introS: 3, outroS: 8, cues }, null));
      expect(boxes.map((b) => b.text).join(' | ')).not.toContain(VIDEO_COPY.fasterOut);
    }
  });
  it('round 11 (was round 5): the guess chip asks for a guess, never a comment (Meta), never "A or B"', () => {
    const boxes = logText(() => drawCmpFrame(fake(), 1080, 1920, { width: 1080, height: 1920 } as HTMLCanvasElement, o,
      { phase: 'intro', m: 0, t: 1.5, capA: 0, k: 0.5, beat: 'hook' }, { stopsU: [0, 1], introS: 3, outroS: 8, cues: [] }, null));
    const all = boxes.map((b) => b.text).join(' ');
    expect(all).toContain('Guess before the answer.'); expect(all).not.toMatch(/\bA or B\b|comment/i);
  });
  it('round 5: frame 0 (the thumbnail) shows the WHOLE hook, both lines', () => {
    const ov: Overlay = { hook: 'One can of cola: 9 teaspoons of sugar.\nWatch where it goes.', title: 'One can of cola', sub: '', clock: '', step: '', caption: '', progress: 0, lights: [], summary: [], handle: '@inside24h' };
    const boxes = logText(() => drawBodyFrame(fake(), 1080, 1920, { width: 1080, height: 1920 } as HTMLCanvasElement, ov, 'reel',
      { phase: 'intro', m: 20, t: 0, capA: 0, k: 0, beat: 'teaser' }, { stopsU: [0, 1], introS: 3, outroS: 6.5, cues: [] }, null));
    const all = boxes.map((b) => b.text).join(' ');
    for (const w of ['Watch', 'where', 'it', 'goes.']) expect(all).toContain(w);
    expect(all).toContain('One can of cola: 9 teaspoons of sugar.');
    expect(kineticWord(-0.5, 0)).toBe(0); expect(kineticWord(0.15, 0)).toBeGreaterThan(0);
  });
});

describe('round 5: plain numbers on the gauges', () => {
  it('blood sugar is said against your usual level, blood alcohol as BAC %, no mmol/L or ‰', () => {
    expect(sugarPlain(2.0)).toMatch(/^\+\d+–\d+ % over usual: a normal rise$/);
    expect(bacPlain(0.8)).toBe('BAC 0.05–0.12 % · US limit 0.08 % · EU limit 0.05 %'); // (only where the range reaches a limit)
    expect(bacPlain(0.4)).toBe('BAC 0.024–0.060 % · US limit 0.08 % · EU limit 0.05 %'); // (round 9, owner: both limits)
    expect(bacPlain(0.3)).toBe('BAC 0.018–0.045 % · US limit 0.08 % · EU limit 0.05 %'); // (round 12, critic P1-5: the limits on every BAC gauge, also under both)
    expect(bacPlain(1.2)).toBe('BAC 0.07–0.18 % · US limit 0.08 % · EU limit 0.05 %');
    expect(bacPlain(0, [0.9, 1.5])).toBe('BAC 0.09–0.15 % · Over US limit 0.08 % · Over EU limit 0.05 %');
    expect(bacPlain(0.2)).toBe('BAC 0.012–0.030 % · US limit 0.08 % · EU limit 0.05 %'); // (round 6: honest precision for one beer, never "0.01")
    const x = analyze(parseMeal('cola'), DEFAULT_PROFILE);
    for (const m of [20, 40, 75]) { const g = mainGauge(x.built, m, 0.2, 'mmol/L', true); if (g) expect(`${g.big} ${g.small}`).not.toMatch(/mmol|‰/); }
  });
});

describe('no flashing (WCAG 2.3.1)', () => {
  for (const [name, ch] of Object.entries(FIX)) it(`${name}: small effects at least 2 s apart, at most one peak impact`, () => {
    const p = planVideo(ch, 'long', uFromMinutes, minutesFromU, { peakMin: ch.find((c) => /peak/i.test(c.title))?.min });
    const micro = p.cues.filter((c) => c.kind === 'micro').map((c) => c.t);
    for (let i = 1; i < micro.length; i++) expect(micro[i] - micro[i - 1]).toBeGreaterThanOrEqual(1.99);
    expect(p.cues.filter((c) => c.kind === 'peak').length).toBeLessThanOrEqual(1);
    // per second: never more than 3 effect cues that light something up
    const lit = p.cues.filter((c) => ['peak', 'micro', 'sip', 'next', 'lights', 'verdict'].includes(c.kind)).map((c) => c.t);
    for (const t of lit) expect(lit.filter((x) => x >= t && x < t + 1).length, `at ${t.toFixed(2)} s`).toBeLessThanOrEqual(3);
  });
});

describe('end card lights in plain words (round 4)', () => {
  const cases = ['cola', 'espresso', 'glass of water', '3 beers', 'whole pizza', 'kebab', 'hamburger, fries and cola', 'beer'];
  for (const c of cases) for (const h of [8, 19]) it(`${c} at ${h}:00: every light says what and when, no jargon`, () => {
    const x = analyze(parseMeal(c), { ...DEFAULT_PROFILE, drinkAtMin: h * 60 });
    for (const s of x.systems) {
      const w = worstMoment(s), l = s.levels[w] as 0 | 1 | 2;
      const n = plainNote(s.key, l, w, x.built, '+13:13', !!s.unknown);
      expect(n, `${c} ${s.key}`).toMatch(/^[A-Z]/);
      expect(n.length, n).toBeLessThanOrEqual(32);
      expect(n, n).not.toMatch(/stress|measured|glyc|mmol|‰/i);
    }
    expect(plainSugar(x.sugarPeak, 'x')).not.toMatch(/measured/);
  });
});
