// Phase 4e (critique 2026-11-14) for the comparisons:
//   M-A: beer vs red wine showed "BAC 0.012–0.031 % / for a 70 kg man" with the warning but without the US 0.08 % and
//        EU 0.05 % limits, on the chip and on the end card. Every comparison with alcohol × cut: the chip of each
//        alcohol side keeps both limits and the warning; the end card shows the BAC peak, the body, both limits and the
//        warning, with no text over text.
//   M7: the comparison end card was fully on screen ~2.25 s. Every comparison × cut: at least END_CARD_MIN_S fully
//        shown (not fading), and a Short at most 30 s.
import { describe, expect, it } from 'vitest';
import { AUDIT_CUTS, auditCompare, auditItems, auditPairs } from './text-audit';
import { chipParts, drawCmpFrame, endTiming, logText, type CmpOverlay, type CmpSide, type TextBox } from './share';
import { bacPeakText, gaugesAt } from './video-story';
import { DRIVE_WARN } from './video-body';
import { END_CARD_MIN_S, FPS, LENGTH, type Plan } from './video-plan';
import { sweep } from './sweep.testutil';
import type { Analysis } from './analyze';

function fakeCtx(w: number): CanvasRenderingContext2D {
  const st: Record<string, unknown> = { font: '10px sans-serif', textAlign: 'left', textBaseline: 'alphabetic', globalAlpha: 1, fillStyle: '' };
  const stack: Record<string, unknown>[] = [];
  const px = () => Number(/(\d+(?:\.\d+)?)px/.exec(String(st.font))?.[1] ?? 10);
  const fns: Record<string, unknown> = { measureText: (s: string) => ({ width: [...s].length * px() * w }), save: () => { stack.push({ ...st }); }, restore: () => { Object.assign(st, stack.pop()); },
    createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) };
  return new Proxy(st, { get: (t, k: string) => (k in fns ? fns[k] : k in t ? t[k] : () => {}), set: (t, k: string, v) => { t[k] = v; return true; } }) as unknown as CanvasRenderingContext2D;
}
const SRC = { width: 2560, height: 1114 } as unknown as HTMLCanvasElement;
const ITEMS = auditItems();
const PAIRS = auditPairs(ITEMS, 300);
const alcoholic = (x: Analysis) => (x.built.alcoholG ?? 0) > 1;
/** A side as the end card draws it (AppV4 side(): the summary, its BAC peak). */
const side = (x: Analysis, name: string): CmpSide => ({ name, color: '#e8a33a', step: '', caption: '', sugar: '', sugarLevel: 0, lights: [], alcohol: alcoholic(x),
  summary: { kcal: x.kcal, sugarPeak: 'not tracked here', worst: [{ icon: '•', label: 'Brain', level: 1, note: 'Attention worse at +0:45' }], bac: bacPeakText(x.built) } });

describe('phase 4e: comparisons with alcohol keep both driving limits (M-A)', () => {
  const pairs = PAIRS.filter((p) => alcoholic(p.a) || alcoholic(p.b));
  it('there are comparisons with alcohol to check', () => expect(pairs.length).toBeGreaterThan(3));
  it('every alcohol comparison × cut: each alcohol chip keeps US 0.08 % and EU 0.05 % and the warning', () => {
    const bad: string[] = [];
    for (const pr of sweep(pairs)) for (const cut of AUDIT_CUTS) {
      const cp = auditCompare(pr.a, pr.b, cut).cp;
      for (const x of [pr.a, pr.b]) {
        if (!alcoholic(x)) continue;
        // (every moment of the video where the chip shows a blood alcohol number)
        for (const m of [...new Set(cp.plan.stops)]) {
          const g = gaugesAt(x.built, Math.min(1440, m), 'mmol/L', x.glucose !== undefined).find((y) => y.curve) ?? null;
          if (!g || !/\bBAC\b/.test(`${g.big} ${g.small}`)) continue;
          const lines = chipParts(g.small).join(' · ');
          if (!/US limit 0\.08 %/.test(lines) || !/EU limit 0\.05 %/.test(lines) || g.warn !== DRIVE_WARN) bad.push(`${pr.id} ${cut} @${m}: "${lines}" warn=${g.warn}`);
        }
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
  }, 600_000);
  it('every alcohol comparison × cut: the end card shows the BAC peak, the body, both limits and the warning, no text over text', () => {
    const bad: string[] = [];
    const overlap = (a: TextBox, b: TextBox) => a.x0 < b.x1 - 2 && b.x0 < a.x1 - 2 && a.y0 < b.y1 - 2 && b.y0 < a.y1 - 2;
    for (const pr of sweep(pairs)) for (const cut of AUDIT_CUTS) {
      const c = auditCompare(pr.a, pr.b, cut), p = c.cp.plan;
      const o: CmpOverlay = { hook: c.hook, clock: '', progress: 1, handle: '@inside24h', a: side(pr.a, c.an), b: side(pr.b, c.bn), verdict: c.cp.verdict,
        ...(c.cp.guess ? { guess: true, answer: { a1: c.cp.guess.answer1, a2: c.cp.guess.answer2, recap: c.cp.guess.recap, kind: c.cp.guess.kind, winner: c.cp.guess.winner } } : {}) } as CmpOverlay;
      const f = p.frames.filter((x) => x.phase === 'outro')[Math.round(0.6 * p.frames.filter((x) => x.phase === 'outro').length)];
      for (const w of [0.56, 0.42]) {
        const boxes = logText(() => drawCmpFrame(fakeCtx(w), 1080, 1920, SRC, o, f, { stopsU: [0, 1], introS: p.introS, outroS: p.outroS, cues: p.cues } as never, null));
        const all = boxes.map((b) => b.text).join(' | ');
        for (const need of [/BAC peak: /, /for a \d+\skg (?:man|woman)/, /US limit 0\.08\s%/, /EU limit 0\.05\s%/] /* (a number keeps its unit with a no-break space) */) if (!need.test(all)) bad.push(`${pr.id} ${cut} ${w}: no ${need}`);
        if ((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env?.P4E_T) console.log('TXT', all);
        if (!all.includes(DRIVE_WARN)) bad.push(`${pr.id} ${cut} ${w}: no warning`);
        const t = boxes.filter((b) => !b.deco);
        for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) if (overlap(t[i], t[j])) bad.push(`${pr.id} ${cut} ${w}: "${t[i].text}" × "${t[j].text}"`);
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
  }, 600_000);
});

describe('phase 4e: the comparison end card stays long enough (M7)', () => {
  const full = (p: Plan) => p.frames.filter((f) => f.phase === 'outro' && endTiming(f, p.outroS).end >= 0.95).length / FPS;
  it(`every comparison × cut: fully shown ≥ ${END_CARD_MIN_S} s, Shorts ≤ 30 s`, () => {
    const bad: string[] = [];
    let least = Infinity;
    for (const pr of sweep(PAIRS)) for (const cut of AUDIT_CUTS) {
      const p = auditCompare(pr.a, pr.b, cut).cp.plan;
      least = Math.min(least, full(p));
      if (full(p) < END_CARD_MIN_S) bad.push(`${pr.id} ${cut}: ${full(p).toFixed(2)} s`);
      if (p.seconds > LENGTH[cut].max + 1e-6) bad.push(`${pr.id} ${cut}: ${p.seconds.toFixed(1)} s long`);
    }
    console.log(`[compare end card] shortest full view ${least.toFixed(2)} s`);
    expect(bad.slice(0, 10)).toEqual([]);
  }, 600_000);
});
