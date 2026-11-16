// Test helper (not part of the app), phase 4h: films a video's TIMELINE headless, through the very drawing functions
// the exporter uses (share.ts drawFrame / drawCmpFrame, which record what they draw: video-telemetry teleFrame) and the
// scene the exporter sets for each frame (AppV4 startShare: shotOf / splitShot, the lead, video-telemetry sceneOf),
// with a canvas stand-in instead of WebGL. The result is judged by the same checkTimeline as a rendered video's
// <video>.timeline.json (npm run qc:render).
import { AUDIT_PROFILE, auditCompare, auditSingle, type AuditItem } from './text-audit';
import { drawCmpFrame, drawFrame, type CmpOverlay, type Light, type Overlay } from './share';
import { after24Of, cmpName, gaugesAt } from './video-story';
import { beatChapter, beatOrgans, camPlanOf, camSeedOf, camStyle, classOf, nextLead, shotOf, splitPlanOf, splitShot } from './video-cam';
import { presentAt, SEG_FOCUS_V } from './video-body';
import { seedOf } from './video-hook';
import { FPS, type Cut, type Plan } from './video-plan';
import { sceneOf, teleScene, teleStart, teleStop, type Timeline } from './video-telemetry';
import type { Analysis } from './analyze';
import type { SegId } from '../scene/segments';

/** A 2D canvas stand-in: text widths at `w` × the font size per character (Geist averages ~0.56). */
// (phase 4i: the same widths; the font size parsed once per font, and a drawing call makes no new function each time)
export function fakeCtx(w = 0.56): CanvasRenderingContext2D {
  const st: Record<string, unknown> = { font: '10px sans-serif', textAlign: 'left', textBaseline: 'alphabetic', globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1 };
  const stack: Record<string, unknown>[] = [];
  let pxFont = '', pxV = 10;
  const px = () => { const f = String(st.font); if (f !== pxFont) { pxFont = f; pxV = Number(/(\d+(?:\.\d+)?)px/.exec(f)?.[1] ?? 10); } return pxV; };
  const chars = (s: string) => (/[\uD800-\uDFFF]/.test(s) ? [...s].length : s.length);
  const grad = { addColorStop() {} }, noop = () => {};
  const fns: Record<string, unknown> = { measureText: (s: string) => ({ width: chars(s) * px() * w }), save: () => { stack.push({ ...st }); }, restore: () => { Object.assign(st, stack.pop()); },
    createLinearGradient: () => grad, createRadialGradient: () => grad };
  return new Proxy(st, { get: (t, k: string) => (k in fns ? fns[k] : k in t ? t[k] : noop), set: (t, k: string, v) => { t[k] = v; return true; } }) as unknown as CanvasRenderingContext2D;
}
const SRC = { width: 1080, height: 1920 } as unknown as HTMLCanvasElement;
const LIGHTS: Light[] = [{ icon: '⚡', label: 'Blood sugar', level: 0 }, { icon: '❤', label: 'Heart', level: 0 }, { icon: '💧', label: 'Water', level: 0 }, { icon: '🧠', label: 'Brain', level: 0 }];
const at = (p: Plan, i: number) => p.frames[i];

/** A single video's timeline, filmed as AppV4 films it (startShare: camPlanOf, cue → shotOf, the lead). */
export function filmSingleTimeline(it: AuditItem, cut: Cut): Timeline {
  const x = it.x, b = x.built, o = auditSingle(x, cut, 'A', AUDIT_PROFILE, it.vname), plan = o.plan, chapters = b.story.chapters;
  const cam = camPlanOf(plan.frames, camStyle(classOf(b), camSeedOf(seedOf(o.name), b.energy.total)), chapters);
  const hook = `${o.hook.line1}\n${o.hook.line2}`, ctx = fakeCtx();
  let lead: SegId | null = null, leadM = -1;
  teleStart({ kind: 'single', cut, seconds: plan.seconds, fps: FPS, hook, name: o.name });
  try {
    for (let i = 0; i < plan.frames.length; i++) {
      const fr = at(plan, i), m = Math.min(1440, fr.m);
      if (fr.m !== leadM) { const segs = b.route?.segs(fr.m); lead = nextLead(lead, presentAt(b, fr.m), (k) => segs?.[k]?.frac ?? 0); leadM = fr.m; }
      const ch = beatChapter(chapters, fr), bo = beatOrgans(fr.title, ch.focus);
      const shot = shotOf(fr, bo.organs, lead ? SEG_FOCUS_V[lead] : null, false, cam);
      teleScene(sceneOf(fr, chapters, shot, lead));
      const recChapter = chapters.reduce((acc, c) => ((fr.stop ?? fr.m) + 1e-6 >= c.min ? c : acc), chapters[0]);
      const gs = gaugesAt(b, m, 'mmol/L', x.glucose !== undefined, /caffeine/i.test(recChapter.title), fr.beat === 'hold' && (fr.stop ?? 0) > 0 ? bo.organs : undefined);
      const ov = { hook, title: o.name, sub: 'Man, 35 · 175 cm · 70 kg', clock: '22:00', step: recChapter.title, caption: fr.cap ?? '', progress: fr.u ?? 0, focus: recChapter.focus,
        lights: LIGHTS, summary: x.systems.slice(0, 4).map((s) => ({ icon: '•', label: s.label, level: 0 as const, note: 'Fine all day' })), handle: '@inside24h', hero: o.hero, after24: o.after24 ?? after24Of(b, x.glucose !== undefined),
        gauges: gs.map((g) => ({ ...g, at: null })), alcohol: (b.alcoholG ?? 0) > 1, solid: /bite/i.test(chapters[0]?.title ?? '') } as Overlay;
      drawFrame(ctx, 1080, 1920, SRC, ov, 'reel', fr, plan, null);
    }
  } finally { /* always stop */ }
  return teleStop()!;
}

/** A comparison's timeline, filmed as AppV4 films it (startCompare: splitPlanOf, cue → splitShot). */
export function filmCompareTimeline(a: Analysis, b: Analysis, cut: Cut): Timeline {
  const c = auditCompare(a, b, cut), plan = c.cp.plan, g = c.cp.guess, ctx = fakeCtx();
  const sides = (fr: Plan['frames'][number]) => ([[a, fr.title], [b, fr.titleB]] as const).map(([x, title]) => beatOrgans(title, beatChapter(x.built.story.chapters, { ...fr, title }).focus).organs) as [string[], string[]];
  const split = splitPlanOf(plan.frames, sides);
  teleStart({ kind: 'compare', cut, seconds: plan.seconds, fps: FPS, hook: c.hook, name: `${c.an} vs ${c.bn}` });
  for (const fr of plan.frames) {
    const m = Math.min(1440, fr.m), card = fr.beat === 'hold' || fr.beat === 'hook';
    const shot = splitShot(fr, card ? sides(fr).flat() : [], split);
    const sa = sceneOf(fr, a.built.story.chapters, shot, null), sb = sceneOf({ ...fr, title: fr.titleB, cap: fr.capB }, b.built.story.chapters, shot, null);
    teleScene({ ...sa, shotB: sb.shot, litB: sb.lit, topicB: sb.topic });
    const side = (x: Analysis, cap: string | undefined): CmpOverlay['a'] => {
      const gs = gaugesAt(x.built, m, 'mmol/L', x.glucose !== undefined), gg = gs.find((z) => z.curve) ?? gs[0];
      return { name: cmpName(x.label), color: x.color, step: x.built.story.chapters[0].title, caption: cap ?? '', sugar: '', sugarLevel: 0, lights: LIGHTS, serving: x.serving,
        gauge: gg ? { ...gg, at: null } : null, alcohol: (x.built.alcoholG ?? 0) > 1, summary: { kcal: x.kcal, sugarPeak: 'steady', worst: LIGHTS.map((l) => ({ ...l, note: 'fine all day' })) } } as CmpOverlay['a'];
    };
    const ov = { hook: c.hook, guess: !!g, clock: '22:00', progress: fr.u ?? 0, handle: '@inside24h', verdict: c.cp.verdict, answer: g ? { a1: g.answer1, a2: g.answer2, recap: g.recap, kind: g.kind, winner: g.winner } : undefined,
      a: side(a, fr.cap), b: side(b, fr.capB) } as CmpOverlay;
    drawCmpFrame(ctx, 1080, 1920, SRC, ov, fr, plan, null);
  }
  return teleStop()!;
}
