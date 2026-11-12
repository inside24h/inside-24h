// v19 (2026-11-05): the spoken-word captions (video-captions.ts, share.ts drawCaption) over every database item and
// the audit comparisons, with the speech engine mocked (each clip lasts its spoken words at a fixed-per-line 2.4-3.0 words/s):
// every caption page is readable (2 lines at most, a few words, long enough), and on the real frame of its moment
// (drawn with a fake canvas) it sits inside the platforms' safe zone, over no word on the frame and clear of the
// body's focal organ; a line the screen already shows is not captioned. Also: the music's arrangement (video-audio.ts).
import { describe, expect, it } from 'vitest';
import { AUDIT_PROFILE, auditCompare, auditItems, auditPairs, auditSingle, compareNarrIn, singleNarrIn } from './text-audit';
import { narrationFor, placeClips } from './video-narration';
import { mockDur } from './voice-mock.testutil';
import { captionPages, captionTrack, duplicateOnScreen, pausesOf, wordTimes, CAP_MAX_CHARS, CAP_MAX_WORDS, FOCUS_R, PAGE_MIN_S, type CapLine, type CapPage } from './video-captions';
import { drawCaption, drawCmpFrame, drawFrame, hushCards, lastFrameFocus, logText, SAFE, swallowing, SWALLOW_R, type CapState, type CmpOverlay, type Light, type Overlay, type TextBox } from './share';
import { arrangement, melodyOf, motifOf } from './video-audio';
import { gaugesAt, cmpName, plainLatin } from './video-story';
import { FPS, type Plan } from './video-plan';
import type { Analysis } from './analyze';
import { sweep } from './sweep.testutil';

// (mockDur: voice-mock.testutil.ts, each line's speed fixed by its own text)
function fakeCtx(w: number): CanvasRenderingContext2D {
  const st: Record<string, unknown> = { font: '10px sans-serif', textAlign: 'left', textBaseline: 'alphabetic', globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1, shadowColor: '', shadowBlur: 0, shadowOffsetY: 0, globalCompositeOperation: 'source-over' };
  const stack: Record<string, unknown>[] = [];
  const px = () => Number(/(\d+(?:\.\d+)?)px/.exec(String(st.font))?.[1] ?? 10);
  const fns: Record<string, unknown> = {
    measureText: (s: string) => ({ width: [...s].length * px() * w }),
    save: () => { stack.push({ ...st }); }, restore: () => { Object.assign(st, stack.pop()); },
    createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }),
  };
  return new Proxy(st, { get: (t, k: string) => (k in fns ? fns[k] : k in t ? t[k] : () => {}), set: (t, k: string, v) => { t[k] = v; return true; } }) as unknown as CanvasRenderingContext2D;
}
const SRC = { width: 1080, height: 1920 } as unknown as HTMLCanvasElement;
const W = 1080, H = 1920, S = SAFE.reel;
const ICON = { energy: '⚡', heart: '❤', water: '💧', brain: '🧠' } as const, SHORT = { energy: 'Blood sugar', heart: 'Heart', water: 'Water', brain: 'Brain' } as const;
const lightsAt = (x: Analysis, m: number): Light[] => x.systems.map((s) => ({ icon: ICON[s.key as keyof typeof ICON], label: SHORT[s.key as keyof typeof SHORT], level: s.levels[Math.round(Math.min(1440, m))] as 0 | 1 | 2 }));
const hit = (a: TextBox, b: TextBox) => a.x0 < b.x1 - 1 && b.x0 < a.x1 - 1 && a.y0 < b.y1 - 1 && b.y0 < a.y1 - 1;

type Tally = { pages: number; shown: number; dup: number; bad: string[] };
/** One page on the frame of its moment: drawn, then checked. */
function checkPage(pg: CapPage, frame: (t: number) => void, where: string, T: Tally, st: CapState) {
  if (pg.lines.length > 2) T.bad.push(`${where}: ${pg.lines.length} lines`);
  if (pg.words.length > CAP_MAX_WORDS) T.bad.push(`${where}: ${pg.words.length} words on a page`);
  if (pg.lines.some((l) => l.join(' ').length > CAP_MAX_CHARS && l.length > 1)) T.bad.push(`${where}: line too long "${pg.lines.map((l) => l.join(' ')).join(' / ')}"`);
  if (pg.t1 - pg.t0 < 0.3) T.bad.push(`${where}: page on screen only ${(pg.t1 - pg.t0).toFixed(2)} s "${pg.words.map((x) => x.w).join(' ')}"`);
  if (pg.words.some((x) => x.t1 - x.t0 < 0.07)) T.bad.push(`${where}: a word lit for < 0.07 s`);
  for (const t of [pg.t0 + 0.5 / FPS, (pg.t0 + pg.t1) / 2]) {
    T.pages++;
    const boxes = logText(() => frame(t)), focus = lastFrameFocus();
    let at: ReturnType<typeof drawCaption> = null;
    const cap = logText(() => { at = drawCaption(fakeCtx(0.56), W, H, pg, t, boxes, focus, st); });
    if (!at) { if (pg.line && duplicateOnScreen(pg.line, boxes)) T.dup++; continue; }
    T.shown++;
    const a = at as { x: number; y: number; w: number; h: number };
    for (const b of cap) {
      const w = `${where} t=${t.toFixed(2)} "${b.text}" [${Math.round(b.x0)},${Math.round(b.y0)}–${Math.round(b.x1)},${Math.round(b.y1)}]`;
      if (b.x0 < S.left - 0.5 || b.x1 > S.right + 0.5 || b.y0 < S.top - 0.5 || b.y1 > S.bottom + 0.5 || (b.y1 > S.lowFrom && b.x1 > S.rightLow + 0.5)) T.bad.push(`${w} outside the safe zone`);
      const o = boxes.find((x) => !x.deco && hit(x, b));
      if (o) T.bad.push(`${w} over "${o.text}"`);
    }
    for (const p of focus) if (p.x > a.x - (p.r ?? FOCUS_R) + 1 && p.x < a.x + a.w + (p.r ?? FOCUS_R) - 1 && p.y > a.y - (p.r ?? FOCUS_R) + 1 && p.y < a.y + a.h + (p.r ?? FOCUS_R) - 1) T.bad.push(`${where} t=${t.toFixed(2)}: caption on the focal organ (${Math.round(p.x)},${Math.round(p.y)})`);
    // (v20: a line that reads a card: that card is not on screen meanwhile; any other line: not a repeat of the screen)
    if (pg.card) { if (pg.card.split('|').some((c) => boxes.some((b) => !!b.text && b.text.trim().length >= Math.min(12, c.length) && c.startsWith(b.text.trim()) && (pg.side === 2 || pg.side === undefined || (pg.side === 0) === ((b.x0 + b.x1) / 2 < W / 2))))) T.bad.push(`${where}: the card and its caption at once "${pg.card}"`); }
    else if (duplicateOnScreen(pg.line ?? '', boxes)) T.bad.push(`${where}: caption repeats the screen "${pg.line}"`);
  }
}
const lastSwallow = (f: { r?: number }[]) => f.filter((p) => p.r === SWALLOW_R).length;
const frameAt = (plan: Plan, t: number) => plan.frames[Math.max(0, Math.min(plan.frames.length - 1, Math.round(t * FPS)))];
const linesOf = (nin: Parameters<typeof narrationFor>[0]): CapLine[] => {
  const lines = narrationFor(nin);
  return placeClips(lines, lines.map((l) => mockDur(l.say)), nin.plan.seconds).map((c) => ({ text: c.line.text, t: c.t, dur: c.dur, card: c.line.card, side: c.line.side }));
};

describe('v19 spoken-word captions (video-captions.ts)', () => {
  it('word timing: in order, inside the clip, by syllables, anchored to pauses', () => {
    const ws = wordTimes('See that? The sugar spike.', 10, 2);
    expect(ws.map((w) => w.w)).toEqual(['See', 'that?', 'The', 'sugar', 'spike.']);
    expect(ws[0].t0).toBeCloseTo(10, 6); expect(ws[ws.length - 1].t1).toBeCloseTo(12, 6);
    for (let i = 1; i < ws.length; i++) expect(ws[i].t0).toBeGreaterThanOrEqual(ws[i - 1].t1 - 1e-9);
    expect(ws[3].t1 - ws[3].t0).toBeGreaterThan(ws[2].t1 - ws[2].t0); // "sugar" (2) is longer than "The" (1)
    const an = wordTimes('See that? The sugar spike.', 0, 2, [0.9]);
    expect(an[2].t0).toBeGreaterThanOrEqual(0.9); expect(an[1].t1).toBeLessThanOrEqual(0.9);
    expect(wordTimes('Blood sugar: up 25–60 %.', 0, 2).map((w) => w.w)).toEqual(['Blood', 'sugar:', 'up', '25–60 %.']);
    // pauses: a 200 ms gap in a tone is found
    const sr = 24000, a = new Float32Array(sr * 2);
    for (let i = 0; i < a.length; i++) a[i] = i > sr * 0.9 && i < sr * 1.1 ? 0 : 0.2 * Math.sin(i / 7);
    const ps = pausesOf(a, sr); expect(ps.length).toBe(1); expect(ps[0]).toBeCloseTo(1, 1);
  });
  it('pages: 2-4 words, at most 2 short lines, no lone last word', () => {
    const pg = captionPages(wordTimes('Watch what this really does to your body.', 0, 3));
    expect(pg.map((p) => p.words.map((w) => w.w).join(' '))).toEqual(['Watch what', 'this really does', 'to your body.']);
    expect(captionPages(wordTimes('Follow this bite all the way.', 0, 2)).map((p) => p.lines.length)).toEqual([1, 1]);
    expect(captionPages(wordTimes('There it is: the sugar spike.', 0, 2)).map((p) => p.words.length)).toEqual([3, 3]);
    expect(pg.every((p) => p.lines.length <= 2 && p.words.length <= CAP_MAX_WORDS && p.words.length >= 2)).toBe(true);
    expect(pg[pg.length - 1].t1 - pg[pg.length - 1].t0).toBeGreaterThanOrEqual(PAGE_MIN_S);
    expect(duplicateOnScreen('The total? 434 kcal.', [{ x0: 0, y0: 0, x1: 1, y1: 1, text: '434 kcal' }])).toBe(true);
    expect(duplicateOnScreen('See that? The sugar spike.', [{ x0: 0, y0: 0, x1: 1, y1: 1, text: 'BLOOD SUGAR PEAK' }])).toBe(false);
  });

  it('every item (long cut): readable pages, in the safe zone, over no word, clear of the focal organ', () => {
    const T: Tally = { pages: 0, shown: 0, dup: 0, bad: [] };
    let k = 0;
    for (const it2 of sweep(auditItems())) {
      const x = it2.x, o = auditSingle(x, 'long', 'A', AUDIT_PROFILE, it2.vname), plan = o.plan, st0 = x.built.story;
      const solid = /bite/i.test(st0.chapters[0]?.title ?? '');
      const said = linesOf(singleNarrIn(x, o, solid)), caps = captionTrack(said);
      // the focal organ: seeded over the body's middle (where the stomach, liver and gut sit on the frame)
      const fy = 640 + ((k++ * 97) % 620), fx = 470 + ((k * 53) % 140);
      const frame = (t: number) => {
        const fr = frameAt(plan, t), m = Math.min(1440, fr.m), stop = fr.stop ?? m, ch = st0.chapters.reduce((a, c) => (stop + 1e-6 >= c.min ? c : a), st0.chapters[0]);
        const ov: Overlay = { hook: `${o.hook.line1}\n${o.hook.line2}`, title: plainLatin(x.label.replace(/\s*\([^)]*\)/g, '')), sub: 'Man, 35 · 178 cm · 80 kg', clock: '22:00', step: ch.title, caption: fr.cap ?? '',
          progress: fr.u ?? 0, lights: lightsAt(x, m), handle: '@inside24h', hero: o.hero, gauges: gaugesAt(x.built, m, 'mmol/L', x.glucose !== undefined).map((g, j) => ({ ...g, at: { x: fx + (j % 2 ? 60 : -40), y: fy - 140 * j } })),
          summary: lightsAt(x, m).map((l) => ({ ...l, note: 'Mild stress at 23:28' })), alcohol: (x.built.alcoholG ?? 0) > 1, solid, pins: { tongue: { x: 540, y: 470 }, esophagus: { x: 545, y: 760 }, stomach: { x: fx, y: fy } }, focus: 'stomach' };
        hushCards(said, t); // (v20: the card being read steps aside, as in the export)
        drawFrame(fakeCtx(0.56), W, H, SRC, ov, 'reel', fr, plan, null);
        // v19b: while the bite goes down, the whole mouth → food pipe → stomach path is kept clear (checkPage checks it)
        if (swallowing(fr) && lastSwallow(lastFrameFocus()) < 6) T.bad.push(`${it2.id} t=${t.toFixed(2)}: the swallow path is not kept clear`);
      };
      const st: CapState = {};
      caps.forEach((pg, i) => checkPage(pg, frame, `${it2.id} page ${i}`, T, st));
    }
    expect(T.bad.slice(0, 20)).toEqual([]);
    expect(T.shown / T.pages).toBeGreaterThan(0.6); // most of what is said is captioned
  }, 600_000);

  it('audit comparisons (long cut): the same rules on the split screen, both bodies clear', () => {
    const T: Tally = { pages: 0, shown: 0, dup: 0, bad: [] };
    for (const pr of sweep(auditPairs(auditItems(), 60))) {
      const o = auditCompare(pr.a, pr.b, 'long'), cp = o.cp, plan = cp.plan;
      const said = linesOf(compareNarrIn(pr.a, pr.b, cp)), caps = captionTrack(said);
      const side = (x: Analysis, m: number, stop: number, cap: string | undefined, gx: number): CmpOverlay['a'] => {
        const ch = x.built.story.chapters.reduce((acc, c) => (stop + 1e-6 >= c.min ? c : acc), x.built.story.chapters[0]);
        const g = gaugesAt(x.built, m, 'mmol/L', x.glucose !== undefined);
        return { name: cmpName(x.label), color: x.color, step: ch.title, caption: cap ?? '', sugar: 'Blood sugar steady', sugarLevel: 0, lights: lightsAt(x, m),
          gauge: (() => { const y = g.find((z) => z.curve) ?? g[0]; return y ? { ...y, at: { x: gx, y: 900 } } : null; })(), alcohol: (x.built.alcoholG ?? 0) > 1, serving: x.serving,
          summary: { kcal: x.kcal, sugarPeak: 'steady', worst: lightsAt(x, 1440).map((l) => ({ ...l, unknown: false, note: 'fine all day' })) } } as CmpOverlay['a'];
      };
      const frame = (t: number) => {
        const fr = frameAt(plan, t), m = Math.min(1440, fr.m), stop = fr.stop ?? m, g = cp.guess;
        const ov = { hook: o.hook, guess: !!g, clock: '22:00', progress: fr.u ?? 0, handle: '@inside24h', stamp: 'LATER', verdict: cp.verdict,
          answer: g ? { a1: g.answer1, a2: g.answer2, recap: g.recap, kind: g.kind, winner: g.winner } : undefined,
          a: { ...side(pr.a, m, stop, fr.cap, 270), pins: { tongue: { x: 270, y: 470 }, esophagus: { x: 272, y: 760 }, stomach: { x: 290, y: 1000 } } }, b: { ...side(pr.b, m, stop, fr.capB, 810), pins: { tongue: { x: 810, y: 470 }, esophagus: { x: 812, y: 760 }, stomach: { x: 830, y: 1000 } } } } as CmpOverlay;
        hushCards(said, t);
        drawCmpFrame(fakeCtx(0.56), W, H, SRC, ov, fr, plan, null);
        if (swallowing(fr) && lastSwallow(lastFrameFocus()) < 12) T.bad.push(`${pr.id} t=${t.toFixed(2)}: the swallow paths are not kept clear`);
      };
      const st: CapState = {};
      caps.forEach((pg, i) => checkPage(pg, frame, `${pr.id} page ${i}`, T, st));
    }
    expect(T.bad.slice(0, 20)).toEqual([]);
    expect(T.shown / T.pages).toBeGreaterThan(0.5);
  }, 600_000);
});

describe('v19 music arrangement (video-audio.ts)', () => {
  it('intro → build → drop on the climax hit → breakdown → outro, for every item; the melody is the food’s own', () => {
    const bad: string[] = [];
    for (const it2 of sweep(auditItems())) {
      const plan = auditSingle(it2.x, 'long', 'A', AUDIT_PROFILE, it2.vname).plan, arr = arrangement(plan.cues, plan.seconds);
      const names = arr.map((s) => s.name).join(' ');
      const hitT = plan.cues.filter((c) => c.kind === 'peak' || c.kind === 'verdict').map((c) => c.t).sort((a, b) => a - b)[0];
      if (arr[0].t0 !== 0 || Math.abs(arr[arr.length - 1].t1 - plan.seconds) > 1e-6) bad.push(`${it2.id}: does not cover the video`);
      for (let i = 1; i < arr.length; i++) if (Math.abs(arr[i].t0 - arr[i - 1].t1) > 1e-6) bad.push(`${it2.id}: gap in ${names}`);
      if (hitT !== undefined) {
        if (names !== 'intro build drop breakdown outro') bad.push(`${it2.id}: ${names}`);
        else if (Math.abs(arr[2].t0 - hitT) > 1e-6) bad.push(`${it2.id}: the drop is not on the hit`);
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
    expect(melodyOf(7)).toEqual(melodyOf(7));
    expect(motifOf(7).mel).toEqual(melodyOf(7));
    const all = new Set(Array.from({ length: 50 }, (_, i) => melodyOf(i).join()));
    expect(all.size).toBeGreaterThan(30);
    for (let i = 0; i < 50; i++) { const m = melodyOf(i); expect(m[0]).toBeGreaterThan(0); expect(m.filter((x) => x >= 0).length).toBeGreaterThanOrEqual(5); }
  }, 600_000);
});
