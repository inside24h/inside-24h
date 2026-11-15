// Phase 4e (critique 2026-11-14): the single video's end card.
//   M-B: beer's end card drew "↻ Now watch the first sip again." over "Which drink should we test next?" and its 👇
//        fell onto the next line, over the small print. The end card is laid out bottom up (share.ts layoutBodyOutro):
//        every item × cut, both formats and a wide and a narrow font: no text box over another, all of it inside the
//        safe frame, the 👇 on the call to action's last line.
//   M-C: lentils and pizza asked "How much has left you a day later?" and the end card answered another question
//        ("Blood sugar: back to usual"). Every hook pool has the words its answer must show on the end card (the 24 h
//        line or the peak line, video-story endCardOf); every item × cut × hook A and B is checked.
import { describe, expect, it } from 'vitest';
import { AUDIT_CUTS, AUDIT_PROFILE, auditItems, auditSingle } from './text-audit';
import { layoutBodyOutro, SAFE, type Overlay } from './share';
import { HOOK_POOL, hookClassOf, type HookClass } from './video-hook';
import { plainNote } from './video-body';
import { worstMoment } from './status';
import { sweep } from './sweep.testutil';

function fakeCtx(w: number): CanvasRenderingContext2D {
  const st: Record<string, unknown> = { font: '10px sans-serif', textAlign: 'left', textBaseline: 'alphabetic', globalAlpha: 1, fillStyle: '' };
  const px = () => Number(/(\d+(?:\.\d+)?)px/.exec(String(st.font))?.[1] ?? 10);
  const fns: Record<string, unknown> = { measureText: (s: string) => ({ width: [...s].length * px() * w }), save: () => {}, restore: () => {} };
  return new Proxy(st, { get: (t, k: string) => (k in fns ? fns[k] : k in t ? t[k] : () => {}), set: (t, k: string, v) => { t[k] = v; return true; } }) as unknown as CanvasRenderingContext2D;
}
const ITEMS = auditItems();
/** The single video's end card overlay, as AppV4 builds it for the recorder (the parts the end card draws). */
function endOverlay(it: (typeof ITEMS)[number], o: ReturnType<typeof auditSingle>): Overlay {
  const x = it.x, b = x.built, solid = /bite/i.test(b.story.chapters[0]?.title ?? '');
  return { hook: o.hook.line1, title: o.name, sub: '', clock: '', step: '', caption: '', where: '', color: '#fff', progress: 1, lights: [], handle: '@inside24h', stamp: '',
    hero: o.hero, after24: o.after24, alcohol: (b.alcoholG ?? 0) > 1, solid,
    summary: x.systems.map((s) => { const w = worstMoment(s), l = s.levels[w] as 0 | 1 | 2; return { icon: '•', label: s.label, level: l, unknown: !!s.unknown, note: plainNote(s.key as 'energy', l, w, b, '+0:00', !!s.unknown) }; }) } as unknown as Overlay;
}
const overlap = (a: { l: number; r: number; t: number; b: number }, b: { l: number; r: number; t: number; b: number }) => a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;

describe('phase 4e: the end card never draws text over text (M-B)', () => {
  it('every item × cut, reel and feed, a wide and a narrow font: no box over another, inside the safe frame, 👇 on its line', () => {
    const bad: string[] = [];
    let cards = 0;
    for (const it of sweep(ITEMS)) for (const cut of AUDIT_CUTS) {
      const o = auditSingle(it.x, cut, 'A', AUDIT_PROFILE, it.vname), ov = endOverlay(it, o);
      for (const format of ['reel', 'feed'] as const) for (const w of [0.56, 0.42]) {
        const S = SAFE[format], lay = layoutBodyOutro(fakeCtx(w), ov, format, S.top + 120, cut === 'short');
        cards++;
        const bx = lay.boxes;
        for (let i = 0; i < bx.length; i++) {
          if (bx[i].b > S.bottom + 0.5 || bx[i].t < lay.y0) bad.push(`${it.id} ${cut} ${format} ${w}: ${bx[i].kind} outside (${bx[i].t.toFixed(0)}-${bx[i].b.toFixed(0)})`);
          for (let j = i + 1; j < bx.length; j++) if (overlap(bx[i], bx[j])) bad.push(`${it.id} ${cut} ${format} ${w}: ${bx[i].kind} over ${bx[j].kind}`);
        }
        const cta = lay.items.find((x) => x.kind === 'cta');
        if (cta && cta.kind !== 'light' && /👇/.test(cta.lines.join(' ')) && !/\S\s👇$/.test(cta.lines[cta.lines.length - 1])) bad.push(`${it.id} ${cut} ${format} ${w}: the 👇 left its word ("${cta.lines.join(' / ')}")`);
      }
    }
    console.log(`[end card] ${cards} end cards laid out, ${bad.length} problems`, JSON.stringify(bad.slice(0, 5)));
    expect(bad.slice(0, 12)).toEqual([]);
  }, 900_000);
  it('the critic case: beer (Reels) keeps its call to action, loop line and warning apart', () => {
    const it = ITEMS.find((i) => i.id === 'beer')!, o = auditSingle(it.x, 'medium', 'A', AUDIT_PROFILE, it.vname);
    const lay = layoutBodyOutro(fakeCtx(0.56), endOverlay(it, o), 'reel', SAFE.reel.top + 120);
    const k = (n: string) => lay.boxes.find((b) => b.kind === n)!;
    expect(overlap(k('cta'), k('loop'))).toBe(false);
    expect(k('loop').b).toBeLessThanOrEqual(SAFE.reel.bottom);
    expect(lay.boxes.some((b) => b.kind === 'warn')).toBe(true); // (B1: the BAC on the card keeps its warning)
  });
});

/** Phase 4e (M-C): what the end card must say for each hook pool (its 24 h line and its peak line, together). */
export const ANSWER_OF: Record<HookClass, RegExp> = {
  day: /still in you|has left your body/i, dayN: /still in you|has left your body/i, fiberDay: /still in you|has left your body/i,
  fatBlood: /blood fat peak · .+ in$/im, stomach: /out of your stomach · /i, stomachN: /out of your stomach · /i, stomachFat: /out of your stomach · /i, blood: /in your blood|\bblood (?:sugar|fat|alcohol)\b|\bBAC\b/i, bloodN: /in your blood|\bblood (?:sugar|fat|alcohol)\b|\bBAC\b/i,
  alcoholGone: /gone after about/i, alcoholGoneN: /gone after about/i, alcoholWhere: /alcohol/i,
  protein: /protein|blood fat/i, proteinN: /protein|blood fat/i,
  // (a sugar without a measured curve shows its grams of sugar: the card says what it can)
  sugarGo: /sugar/i, sugarGoT: /sugar/i, sugarHit: /sugar/i, sugarHigh: /sugar/i, sugarWhere: /sugar/i, natural: /sugar/i, naturalN: /sugar/i, starch: /sugar/i,
  water: /urine|kidney|bladder|water|left your body|still in you|passed through|in your blood/i, bedtimeQ: /bedtime: \d+ mg of caffeine/i,
};
describe('phase 4e: the end card answers the hook (M-C)', () => {
  it('every hook pool has an answer rule', () => {
    for (const k of Object.keys(HOOK_POOL)) expect(ANSWER_OF[k as HookClass], k).toBeDefined();
  });
  it('every item × cut × hook A and B: the end card says the answer its hook asks for', () => {
    const bad: string[] = [], seen = new Set<string>();
    for (const it of sweep(ITEMS)) for (const cut of AUDIT_CUTS) for (const v of ['A', 'B'] as const) {
      const o = auditSingle(it.x, cut, v, AUDIT_PROFILE, it.vname), cls = hookClassOf(o.hook);
      if (!cls) continue;
      seen.add(cls);
      const card = [o.after24?.big, o.after24?.small, o.hero?.big, o.hero?.small].filter(Boolean).join('\n');
      if (!ANSWER_OF[cls].test(card)) bad.push(`${it.id} ${cut} ${v} [${cls}] "${o.hook.line1} / ${o.hook.line2}" → "${card.replace(/\n/g, ' | ')}"`);
    }
    console.log(`[hook answers] ${seen.size} hook pools seen, ${bad.length} end cards that do not answer`, JSON.stringify(bad.slice(0, (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env?.P4E_ALL ? 400 : 5)));
    expect(bad.slice(0, 12)).toEqual([]);
  }, 900_000);
  it('the critic case: lentils and pizza answer on the end card what they ask', () => {
    for (const id of ['lentils', 'pizza']) for (const cut of AUDIT_CUTS) {
      const it = ITEMS.find((i) => i.id === id)!, o = auditSingle(it.x, cut, 'A', AUDIT_PROFILE, it.vname);
      console.log(`[hook answers] ${id} ${cut}: "${o.hook.line2}" → "${o.after24?.big} / ${o.after24?.small}" · "${o.hero?.big}"`);
      expect(ANSWER_OF[hookClassOf(o.hook) as HookClass].test([o.after24?.big, o.after24?.small, o.hero?.big, o.hero?.small].join('\n')), `${id} ${cut}`).toBe(true);
    }
  });
});
