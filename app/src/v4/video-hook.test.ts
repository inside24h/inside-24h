// 2026-10-24 creative upgrade: hooks come from the model (no number that the video does not show), alcohol is never
// celebrated, the comparison game stays honest, and nothing flashes too often (WCAG 2.3.1).
import { describe, expect, it } from 'vitest';
import { minutesFromU, uFromMinutes } from '../time';
import { hookFor, hookForCompare, numbersIn } from './video-hook';
import { planVideo, type StopIn } from './video-plan';
import { drawCmpFrame, logText, VIDEO_COPY, type CmpOverlay } from './share';
import fixtures from './video-plan.fixtures.json';

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
    expect(words(k.line1)).toBeLessThanOrEqual(7); expect(words(k.line2)).toBeLessThanOrEqual(7);
    const source = `${h.name} ${h.chapters.map((c) => c.text).join(' ')}`;
    for (const n of numbersIn(`${k.line1} ${k.line2}`)) if (n !== '24') expect(source, `${name}: ${n}`).toContain(n); // ("24 hours" is the format itself)
    if (h.alcohol) expect(`${k.line1} ${k.line2}`).not.toMatch(/\b(best|wins?|better|healthy|cure|hangover)\b/i);
  });
  it('cola leads with its teaspoons (the surprise first)', () => {
    expect(hookFor(cases[0][1]).line1).toBe('9 teaspoons of sugar.');
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
