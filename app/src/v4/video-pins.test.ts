// Phase 4g (critique of the 4f samples): in beer vs red wine the BAC chip's pin line ran from inside the chip over its
// own words ("for a 70 kg man", "Never safe to drive…") to the brain, which sat under the chip. Every alcohol item and
// every comparison with alcohol × cut, with the organ put all over the body (a grid, so also under the chips and the
// cards): every pin drawn has its line, its dot and its ring clear of every word of its frame and of the other gauges,
// and never runs through its own gauge.
import { describe, expect, it } from 'vitest';
import { AUDIT_CUTS, auditCompare, auditItems, auditPairs, auditSingle, type AuditItem } from './text-audit';
import { circleHitsRect, drawCmpFrame, drawFrame, logPins, segHitsRect, type CmpOverlay, type Light, type Overlay, type PinDrawn } from './share';
import { after24Of, cmpName, gaugesAt } from './video-story';
import { sweep } from './sweep.testutil';
import type { Plan } from './video-plan';
import type { Analysis } from './analyze';

function fakeCtx(w: number): CanvasRenderingContext2D {
  const st: Record<string, unknown> = { font: '10px sans-serif', textAlign: 'left', textBaseline: 'alphabetic', globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1 };
  const stack: Record<string, unknown>[] = [];
  const px = () => Number(/(\d+(?:\.\d+)?)px/.exec(String(st.font))?.[1] ?? 10);
  const fns: Record<string, unknown> = { measureText: (s: string) => ({ width: [...s].length * px() * w }), save: () => { stack.push({ ...st }); }, restore: () => { Object.assign(st, stack.pop()); },
    createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) };
  return new Proxy(st, { get: (t, k: string) => (k in fns ? fns[k] : k in t ? t[k] : () => {}), set: (t, k: string, v) => { t[k] = v; return true; } }) as unknown as CanvasRenderingContext2D;
}
const SRC = { width: 1080, height: 1920 } as unknown as HTMLCanvasElement;
const LIGHTS: Light[] = [{ icon: '⚡', label: 'Blood sugar', level: 0 }, { icon: '❤', label: 'Heart', level: 0 }, { icon: '💧', label: 'Water', level: 0 }, { icon: '🧠', label: 'Brain', level: 1 }];
const ITEMS = auditItems();
const alcoholic = (x: Analysis) => (x.built.alcoholG ?? 0) > 1;
const ALC = ITEMS.filter((i) => alcoholic(i.x) && !/[.+]/.test(i.id));
const PAIRS = auditPairs(ITEMS, 300).filter((p) => alcoholic(p.a) || alcoholic(p.b));
const by = (id: string) => ITEMS.find((i) => i.id === id);
// the critic's pair always, then every alcohol comparison the tier sweeps
const beer = by('beer'), wine = by('red-wine');
const CMPS = [...(beer && wine ? [{ id: 'beer-vs-red-wine', a: beer.x, b: wine.x }] : []), ...sweep(PAIRS)];
/** Where the organ may be on the frame: a grid over each half / the whole body, from under the top band to the card. */
const YS = [560, 700, 820, 960, 1120, 1280];
const XS_HALF = [0.1, 0.25, 0.4];
/** A few frames of each video: through the main part, the peak and the end card. */
const framesOf = (p: Plan) => { const fs = p.frames, main = fs.filter((f) => f.phase === 'main'); return [...[0.05, 0.3, 0.55, 0.8].map((u) => main[Math.floor(u * (main.length - 1))]), fs.find((f) => f.phase === 'outro')].filter((f): f is Plan['frames'][number] => !!f); };

function check(pins: PinDrawn[], label: string, bad: string[]) {
  for (const p of pins) {
    for (const w of p.words) {
      if (segHitsRect(p.from, p.to, w)) bad.push(`${label}: line × "${w.text}"`);
      if (circleHitsRect(p.to, 8, w)) bad.push(`${label}: dot × "${w.text}"`);
      if (p.ring && circleHitsRect(p.to, 32, w)) bad.push(`${label}: ring × "${w.text}"`);
    }
    for (const b of p.boxes) {
      const inner = { x0: b.x0 + 2, y0: b.y0 + 2, x1: b.x1 - 2, y1: b.y1 - 2 };
      if (segHitsRect(p.from, p.to, inner)) bad.push(`${label}: line through a gauge`);
      if (circleHitsRect(p.to, 8, inner)) bad.push(`${label}: dot on a gauge`);
    }
  }
}

describe('phase 4g: the gauges\' pins never cross a word', () => {
  it('the critic\'s pair (beer vs red wine) is among the comparisons checked', () => expect(CMPS[0]?.id).toBe('beer-vs-red-wine'));
  it('every alcohol item × cut, the organ anywhere: no pin line, dot or ring over a word or a gauge', () => {
    const bad: string[] = [];
    let drawn = 0;
    for (const it of ALC as AuditItem[]) for (const cut of AUDIT_CUTS) {
      const o = auditSingle(it.x, cut, 'A', undefined, it.vname), x = it.x;
      for (const fr of framesOf(o.plan)) for (const y of YS) for (const xs of [0.3, 0.5, 0.7]) {
        const gs = gaugesAt(x.built, Math.min(1440, fr.m), 'mmol/L', x.glucose !== undefined);
        const ov = { hook: `${o.hook.line1}\n${o.hook.line2}`, title: o.name, sub: 'Man, 35 · 175 cm · 70 kg', clock: '22:00', step: x.built.story.chapters[0].title, caption: fr.cap ?? '', progress: fr.u ?? 0,
          lights: LIGHTS, summary: LIGHTS.map((l) => ({ ...l, note: 'Fine all day' })), handle: '@inside24h', hero: o.hero, after24: after24Of(x.built, x.glucose !== undefined),
          gauges: gs.map((g, j) => ({ ...g, at: { x: 1080 * xs + 120 * j, y: y - 160 * j } })), alcohol: true, pins: { stomach: { x: 560, y: 1000 } }, focus: 'stomach' } as Overlay;
        const pins = logPins(() => drawFrame(fakeCtx(0.56), 1080, 1920, SRC, ov, 'reel', fr, o.plan, null));
        drawn += pins.length;
        check(pins, `${it.id} ${cut} m=${fr.m} at ${xs},${y}`, bad);
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
    expect(drawn).toBeGreaterThan(0);
  }, 600_000);

  it('every comparison with alcohol × cut (beer vs red wine always), the organ anywhere: no pin over a word or a gauge', () => {
    const bad: string[] = [];
    let drawn = 0;
    for (const pr of CMPS) for (const cut of AUDIT_CUTS) {
      const c = auditCompare(pr.a, pr.b, cut), g = c.cp.guess;
      for (const fr of framesOf(c.cp.plan)) for (const y of YS) for (const xs of XS_HALF) {
        const m = Math.min(1440, fr.m);
        const side = (x: Analysis, cap: string | undefined, gx: number): CmpOverlay['a'] => {
          const gs = gaugesAt(x.built, m, 'mmol/L', x.glucose !== undefined), gg = gs.find((z) => z.curve) ?? gs[0];
          return { name: cmpName(x.label), color: x.color, step: x.built.story.chapters[0].title, caption: cap ?? '', sugar: '', sugarLevel: 0, lights: LIGHTS, serving: x.serving,
            gauge: gg ? { ...gg, at: { x: gx, y } } : null, alcohol: alcoholic(x), summary: { kcal: x.kcal, sugarPeak: 'steady', worst: LIGHTS.map((l) => ({ ...l, note: 'fine all day' })) } } as CmpOverlay['a'];
        };
        const ov = { hook: c.hook, guess: !!g, clock: '22:00', progress: fr.u ?? 0, handle: '@inside24h', verdict: c.cp.verdict, answer: g ? { a1: g.answer1, a2: g.answer2, recap: g.recap, kind: g.kind, winner: g.winner } : undefined,
          a: side(pr.a, fr.cap, 540 * xs), b: side(pr.b, fr.capB, 1080 - 540 * xs) } as CmpOverlay;
        const pins = logPins(() => drawCmpFrame(fakeCtx(0.56), 1080, 1920, SRC, ov, fr, c.cp.plan, null));
        drawn += pins.length;
        check(pins, `${pr.id} ${cut} m=${fr.m} at ${xs},${y}`, bad);
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
    expect(drawn).toBeGreaterThan(0);
  }, 600_000);
});
