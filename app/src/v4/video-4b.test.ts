// Phase 4b (critique 2026-11-13, research/improvements/video-critique-2026-11-13.md): each defect the critic found in
// the v25 samples is guarded here as a CLASS, over every database item (or the fast tier's sample of them) and the
// audit comparisons, in every cut, not just for the sample that showed it:
//   B1 a blood alcohol number or a driving limit is never on a card without "Never safe to drive after drinking." on
//      that same card, from its first frame (gauges, chips, end cards), and every BAC range names its body;
//   B2 an organ a card names is lit above every other organ, and what sits in front of it fades;
//   M1 no amount shown in the stomach or gut is more than the serving;  M2 the end card's "AFTER 24 HOURS" line is the
//   value at 24 h (the climax is labelled as the peak);  M3 no rendered text is cut ("a nor…");  M4 a hook never
//   contradicts its payoff;  M5 no organ held over SHOT_MAX_S, comparison questions in more than one wording;
//   M6 no clock time and no gone/still-there contradiction on the cards;  M7 the end card is readable ≥ 2.5 s in every
//   cut, Shorts still ≤ 30 s;  M8 one caption track at a time on the split screen.
import { describe, expect, it } from 'vitest';
import { AUDIT_CUTS, AUDIT_PROFILE, auditCompare, auditItems, auditPairs, auditSingle, lintHookPayoff, lintTimeline, type AuditItem } from './text-audit';
import { bodyGlowAt, cardNamed, CONTENT_SEGS, DRIVE_WARN, FRONT_OF, namedGlow, namedOrgans, presentAt, shownAmount, SHOWS_BAC, whereGauge } from './video-body';
import { after24Of, cmpName, gaugesAt } from './video-story';
import { drawCmpFrame, drawFrame, endTiming, fit, logText, VIDEO_COPY, type CmpOverlay, type Light, type Overlay } from './share';
import { END_CARD_MIN_S, FPS, LENGTH, type Plan } from './video-plan';
import { beatChapter, beatOrgans, camPlanOf, camStyle, classOf, organKey, REGION, SHOT_MAX_S } from './video-cam';
import { seedOf } from './video-hook';
import { servingMlOf } from './food/foodProduct';
import { at } from '../science/espressoSim';
import { FAST_TIER, sweep } from './sweep.testutil';
import type { Analysis } from './analyze';
import type { SegId } from '../scene/segments';

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
const LIGHTS: Light[] = [{ icon: '⚡', label: 'Blood sugar', level: 0 }, { icon: '❤', label: 'Heart', level: 0 }, { icon: '💧', label: 'Water', level: 0 }, { icon: '🧠', label: 'Brain', level: 1 }];

const ITEMS = auditItems();
const by = (id: string) => ITEMS.find((i) => i.id === id)!;
// the critic's samples and every alcoholic item are always checked; the rest as the tier sweeps them
const MUST = ['beer', 'lentils', 'pizza', 'espresso', 'cola', 'orange-juice', 'banana', 'croissant'];
const ALC = ITEMS.filter((i) => (i.x.built.alcoholG ?? 0) > 1 && !/[.+]/.test(i.id));
const SAMPLE = [...new Map([...MUST.map(by).filter(Boolean), ...ALC, ...sweep(ITEMS)].map((i) => [i.id, i])).values()];
const PAIRS = auditPairs(ITEMS, FAST_TIER ? 40 : 120);
const PAIR_SAMPLE = [...PAIRS.slice(0, 8), ...sweep(PAIRS.slice(8))];

/** A single video's overlay at a frame, built from the model as AppV4 builds it (gauges, hero, the 24 h value). */
function singleOverlay(it: AuditItem, o: ReturnType<typeof auditSingle>, fr: Plan['frames'][number]): Overlay {
  const x = it.x, m = Math.min(1440, fr.m), ch = x.built.story.chapters;
  return { hook: `${o.hook.line1}\n${o.hook.line2}`, title: o.name, sub: 'Man, 35 · 175 cm · 70 kg', clock: '22:00', step: ch[0].title, caption: fr.cap ?? '', progress: fr.u ?? 0,
    lights: LIGHTS, summary: LIGHTS.map((l) => ({ ...l, note: 'Fine all day' })), handle: '@inside24h', hero: o.hero, after24: after24Of(x.built, x.glucose !== undefined),
    gauges: gaugesAt(x.built, m, 'mmol/L', x.glucose !== undefined).map((g, j) => ({ ...g, at: { x: 520 + 40 * j, y: 900 - 140 * j } })),
    alcohol: (x.built.alcoholG ?? 0) > 1, solid: /bite/i.test(ch[0].title), pins: { stomach: { x: 560, y: 1000 } }, focus: 'stomach' };
}
function cmpOverlay(a: Analysis, b: Analysis, o: ReturnType<typeof auditCompare>, fr: Plan['frames'][number]): CmpOverlay {
  const m = Math.min(1440, fr.m), g = o.cp.guess;
  const side = (x: Analysis, cap: string | undefined, gx: number): CmpOverlay['a'] => {
    const gs = gaugesAt(x.built, m, 'mmol/L', x.glucose !== undefined), y = gs.find((z) => z.curve) ?? gs[0];
    return { name: cmpName(x.label), color: x.color, step: x.built.story.chapters[0].title, caption: cap ?? '', sugar: '', sugarLevel: 0, lights: LIGHTS, serving: x.serving,
      gauge: y ? { ...y, at: { x: gx, y: 900 } } : null, alcohol: (x.built.alcoholG ?? 0) > 1, summary: { kcal: x.kcal, sugarPeak: 'steady', worst: LIGHTS.map((l) => ({ ...l, note: 'fine all day' })) } } as CmpOverlay['a'];
  };
  return { hook: o.hook, guess: !!g, clock: '22:00', progress: fr.u ?? 0, handle: '@inside24h', verdict: o.cp.verdict, answer: g ? { a1: g.answer1, a2: g.answer2, recap: g.recap, kind: g.kind, winner: g.winner } : undefined,
    a: side(a, fr.cap, 270), b: side(b, fr.capB, 810) } as CmpOverlay;
}
const textsOf = (boxes: { text: string }[]) => boxes.map((b) => b.text);
/** B1: a frame whose words show a BAC number or a limit also shows the warning (the gauge's lines are wrapped). */
const bacUnwarned = (ts: string[]) => ts.some((t) => SHOWS_BAC.test(t)) && !ts.join(' ').includes(DRIVE_WARN.split(' ').slice(0, 3).join(' '));

describe('phase 4b: B1 alcohol: no BAC or limit without the warning on the same card; the body is named', () => {
  it('every gauge with a BAC number or a limit carries DRIVE_WARN and its body, at every minute of every alcoholic item', () => {
    const bad: string[] = [];
    for (const it of ALC) for (let m = 0; m <= 1440; m += 5) for (const g of gaugesAt(it.x.built, m, 'mmol/L', it.x.glucose !== undefined)) {
      const t = `${g.big} ${g.small}`;
      if (SHOWS_BAC.test(t) && (g.warn !== DRIVE_WARN || !/for a \d+ kg (?:man|woman)/.test(g.small))) bad.push(`${it.id} +${m}: ${t}`);
      if (/\bBAC\b/.test(t) && !(/US limit 0\.08 %/.test(t) && /EU limit 0\.05 %/.test(t)) && g.curve) bad.push(`${it.id} +${m}: both limits missing: ${t}`);
    }
    expect(ALC.length).toBeGreaterThanOrEqual(3);
    expect(bad.slice(0, 10)).toEqual([]);
  });
  it('the rendered frames (cold open on: every phase, every cut) and the end card never show a BAC without the warning', () => {
    const bad: string[] = [];
    for (const it of ALC.slice(0, FAST_TIER ? 3 : ALC.length)) for (const cut of AUDIT_CUTS) {
      const o = auditSingle(it.x, cut, 'A', AUDIT_PROFILE, it.vname), fs = o.plan.frames;
      for (let i = 0; i < fs.length; i += i < 30 ? 1 : 7) {
        const ts = textsOf(logText(() => drawFrame(fakeCtx(0.56), 1080, 1920, SRC, singleOverlay(it, o, fs[i]), 'reel', fs[i], o.plan, null)));
        if (bacUnwarned(ts)) { bad.push(`${it.id} ${cut} frame ${i} (${fs[i].phase}/${fs[i].beat}): ${ts.filter((t) => SHOWS_BAC.test(t)).join(' | ')}`); break; }
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
  }, 600_000);
  it('the beer sample: the cold open (frame 0) shows the warning and the body, and the end card repeats the warning', () => {
    const it = by('beer'), o = auditSingle(it.x, 'medium', 'A', AUDIT_PROFILE, it.vname), fs = o.plan.frames;
    const first = textsOf(logText(() => drawFrame(fakeCtx(0.56), 1080, 1920, SRC, singleOverlay(it, o, fs[0]), 'reel', fs[0], o.plan, null))).join(' ');
    expect(first).toMatch(/BAC/); expect(first).toMatch(/Never safe to drive/); expect(first).toMatch(/for a 70\skg man/); // (a number keeps its unit: a no-break space)
    const out = fs.find((f) => f.phase === 'outro' && endTiming(f, o.plan.outroS).end > 0.9)!;
    const end = textsOf(logText(() => drawFrame(fakeCtx(0.56), 1080, 1920, SRC, singleOverlay(it, o, out), 'reel', out, o.plan, null))).join(' ');
    expect(end).toMatch(/BAC/); expect(end).toMatch(/Never safe to drive/);
  });
});

describe('phase 4b: B2 the organ a card names is lit, above every other, not hidden behind the gut', () => {
  it('every card that names an organ (every item × cut): its organs at the named glow, kept bright; the rest below; the organs in front faded', () => {
    const bad: string[] = []; let n = 0;
    for (const it of SAMPLE) for (const cut of AUDIT_CUTS) {
      const o = auditSingle(it.x, cut, 'A', AUDIT_PROFILE, it.vname), chs = it.x.built.story.chapters;
      for (const fr of o.plan.frames) {
        const named = cardNamed(fr); if (!named.length) continue;
        expect(named).toEqual(namedOrgans(fr.title, fr.cap)); n++;
        const ch = chs.reduce((a, c) => ((fr.stop ?? fr.m) + 1e-6 >= c.min ? c : a), chs[0]);
        const { glow, keep, hide } = bodyGlowAt(it.x.built, fr.m, ch.focus, it.x.glucose !== undefined, named);
        const top = Math.min(...named.map((k) => glow[k] ?? 0));
        for (const k of named) if ((glow[k] ?? 0) < namedGlow(k) - 1e-9 || (k !== 'brain' && !keep.includes(k))) bad.push(`${it.id} ${cut} "${fr.title} / ${fr.cap}": ${k} not lit`);
        for (const [k, v] of Object.entries(glow)) if (!named.includes(k) && v >= top) bad.push(`${it.id} ${cut} "${fr.cap}": ${k} (${v.toFixed(2)}) outshines ${named.join('+')} (${top.toFixed(2)})`);
        for (const k of named) for (const f of FRONT_OF[k] ?? []) if (!named.includes(f) && (keep.includes(f) || !hide.includes(f))) bad.push(`${it.id} ${cut}: ${f} in front of ${k} not faded`);
        if (bad.length > 20) break;
      }
    }
    expect(n).toBeGreaterThan(20);
    expect(bad.slice(0, 10)).toEqual([]);
  }, 600_000);
  it('beer\'s "Kidneys" card: the kidneys glow, the bladder (full of urine) stays below them', () => {
    const it = by('beer'), o = auditSingle(it.x, 'long', 'A', AUDIT_PROFILE, it.vname);
    const fr = o.plan.frames.find((f) => f.beat === 'hold' && /kidneys/i.test(`${f.title} ${f.cap}`))!;
    expect(fr).toBeTruthy();
    const { glow, hide } = bodyGlowAt(it.x.built, fr.m, 'bladder', false, cardNamed(fr));
    expect(glow.kidney_l).toBeGreaterThan(0.9); expect(glow.kidney_r).toBeGreaterThan(0.9);
    expect(glow.bladder ?? 0).toBeLessThan(0.5 * glow.kidney_l);
    expect(hide).toEqual(expect.arrayContaining(['jejunum', 'ileum', 'colon_trans']));
    // the camera frames the same organs the body lights
    expect(beatOrgans(fr.title, 'bladder').organs).toEqual(['kidney_l', 'kidney_r']);
  });
});

describe('phase 4b: M1 nothing in the stomach or gut is shown as more than the serving', () => {
  it('every item, every minute: the content shown ≤ the serving (ml for drinks, from their own density)', () => {
    const bad: string[] = [];
    for (const it of SAMPLE) {
      const b = it.x.built, r = b.route; if (!r) continue;
      const drink = r.unit === 'ml' && it.parts.every((p) => p.food.serving.grams > 0);
      const serving = drink && b.story && it.parts.length ? servingMlOf(it.parts) : it.x.macros.grams;
      for (let m = 0; m <= 1440; m += m < 60 ? 1 : 15) {
        const segs = r.segs(m);
        for (const id of CONTENT_SEGS) { const s = segs[id as SegId]; if (s && !s.text && !s.unit && shownAmount(id, s) > serving * 1.005 + 0.05) bad.push(`${it.id} +${m} ${id}: ${shownAmount(id, s).toFixed(1)} of ${serving.toFixed(1)}`); }
        const w = whereGauge(b, m), n = w && /^([\d.]+) (?:ml|g)$/.exec(w.big);
        if (n && presentAt(b, m)[0] && CONTENT_SEGS.includes(presentAt(b, m).filter(([k]) => k !== 'swallow')[0]?.[0] ?? '') && Number(n[1]) > serving * 1.005 + 0.5) bad.push(`${it.id} +${m} gauge ${w!.big} of ${serving.toFixed(0)}`);
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });
  it('the samples: beer 500 ml, orange juice 330 ml stay at their serving at +0', () => {
    const beer = by('beer').x.built.route!.segs(0.9).stomach!, oj = auditItems().find((i) => i.id === 'orange-juice')!;
    expect(beer.amount).toBeLessThanOrEqual(500.01);
    expect(oj.x.built.route!.segs(0.9).stomach!.amount).toBeLessThanOrEqual(servingMlOf(oj.parts) + 0.01);
  });
});

describe('phase 4b: M2 the end card under "AFTER 24 HOURS" says the value at 24 h, the climax is called the peak', () => {
  it('every item: after24Of is the model at minute 1440; drawn after the heading, the hero as "Peak:"', () => {
    const bad: string[] = [];
    for (const it of SAMPLE) {
      const b = it.x.built, a = after24Of(b, it.x.glucose !== undefined);
      const caf = /^(\d+) mg of caffeine left$/.exec(a.big);
      if (caf && Number(caf[1]) !== Math.round(at(b.caffeine.body, 1440))) bad.push(`${it.id}: ${a.big} vs ${at(b.caffeine.body, 1440).toFixed(1)}`);
      const o = auditSingle(it.x, 'short', 'A', AUDIT_PROFILE, it.vname);
      if (o.hero && a.big === o.hero.big) bad.push(`${it.id}: the 24 h line is the peak`);
      const fr = o.plan.frames.find((f) => f.phase === 'outro' && endTiming(f, o.plan.outroS).end > 0.9)!;
      const boxes = logText(() => drawFrame(fakeCtx(0.56), 1080, 1920, SRC, singleOverlay(it, o, fr), 'reel', fr, o.plan, null)), ts = textsOf(boxes);
      // (the end card grew: its lines never overlap, the call to action and the loop line included)
      const card = boxes.slice(Math.max(0, boxes.findIndex((b) => b.text === 'AFTER 24 HOURS'))).filter((b) => !b.deco);
      for (let p = 0; p < card.length; p++) for (let q = p + 1; q < card.length; q++) { const A = card[p], B = card[q]; if (Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0) > 2 && Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0) > 2) bad.push(`${it.id}: end card lines overlap: "${A.text}" / "${B.text}"`); }
      const h = ts.indexOf('AFTER 24 HOURS'), nb = (t: string) => t.replace(/ /g, ' ');
      const j = h < 0 ? -1 : ts.slice(h + 1, h + 5).findIndex((t) => nb(t).length >= 3 && nb(a.big).startsWith(nb(t)));
      if (h < 0 || j < 0) bad.push(`${it.id}: the 24 h value is not under the heading (${ts.slice(0, 6).join(' | ')})`);
      if (o.hero && !ts.some((t) => t.startsWith('Peak:'))) bad.push(`${it.id}: the hero is not labelled as the peak`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
    // the critic's espresso: the peak's 58 mg is never said to be left after 24 h
    const esp = after24Of(by('espresso').x.built, false);
    expect(esp.big).toMatch(/mg of caffeine left$/); expect(Number(/\d+/.exec(esp.big)![0])).toBeLessThan(10);
  });
});

describe('phase 4b: M3 no rendered text is cut mid-word, no callout or caption cut at all in the comparisons', () => {
  it('fit() cuts between words only', () => {
    const ctx = fakeCtx(0.5); ctx.font = '700 20px x';
    expect(fit(ctx, '+16–38 % over usual: a normal rise', 200)).toBe('+16–38 % over usual…');
    expect(fit(ctx, 'short', 200)).toBe('short');
  });
  it('every comparison × cut: no frame shows "…" in a caption, callout, name or end card', () => {
    const bad: string[] = [];
    for (const pr of PAIR_SAMPLE) for (const cut of AUDIT_CUTS) {
      const o = auditCompare(pr.a, pr.b, cut), fs = o.cp.plan.frames;
      for (let i = 0; i < fs.length; i += 5) {
        const ts = textsOf(logText(() => drawCmpFrame(fakeCtx(0.56), 1080, 1920, SRC, cmpOverlay(pr.a, pr.b, o, fs[i]), fs[i], o.cp.plan, null)));
        const cut0 = ts.find((t) => /…/.test(t));
        if (cut0) { bad.push(`${pr.id} ${cut} frame ${i}: ${cut0}`); break; }
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
  }, 600_000);
});

describe('phase 4b: M4 / M6 the words agree with themselves', () => {
  it('no hook that contradicts its own payoff (teaspoons of starch "sugar" vs "a normal rise"), no clock time, no gone/still contradiction', () => {
    const bad: string[] = [];
    for (const it of SAMPLE) for (const v of ['A', 'B'] as const) for (const cut of AUDIT_CUTS) {
      const o = auditSingle(it.x, cut, v, AUDIT_PROFILE, it.vname);
      bad.push(...[...lintHookPayoff(o.hook, o.hero, it.x.macros.sugars, it.id), ...lintTimeline(o.plan.pages, `${it.id} ${cut} ${v}`)].map((i) => `${i.cls}: ${i.where}: ${i.text}`));
    }
    expect(bad.slice(0, 10)).toEqual([]);
    const len = auditSingle(by('lentils').x, 'long', 'A', AUDIT_PROFILE, by('lentils').vname).hook;
    expect(`${len.line1} ${len.line2}`).not.toMatch(/teaspoons? of sugar/);
    const beer = auditSingle(by('beer').x, 'long', 'A', AUDIT_PROFILE, by('beer').vname).plan.pages.map((p) => p.text).join(' | ');
    expect(beer).not.toMatch(/\d\d:\d\d/);
  });
  it('the lints catch the critic\'s two cases', () => {
    expect(lintTimeline([{ stop: 166, text: 'The alcohol is gone after about 1–4 h.' }, { stop: 540, text: 'At 07:00, the alcohol should be gone.' }], 'x').map((i) => i.cls)).toContain('clock time on a card');
    expect(lintTimeline([{ stop: 166, text: 'The alcohol is gone after about 1–4 h.' }, { stop: 540, text: 'A breath test may be positive.' }], 'x').map((i) => i.cls)).toContain('temporal contradiction');
    expect(lintHookPayoff({ line1: '1 portion of lentils: about 6 teaspoons of sugar.', line2: 'Watch it turn into blood sugar.' }, { big: 'Blood sugar up · 1 h 15 min in', small: '+12–26 % over usual: a normal rise' }, 2, 'x')).toHaveLength(1);
  });
});

describe('phase 4b: M5 no template video: shots capped, comparison questions vary', () => {
  it('every item × cut: the camera never stays on one organ over SHOT_MAX_S', () => {
    const bad: string[] = [];
    for (const it of SAMPLE) for (const cut of AUDIT_CUTS) {
      const o = auditSingle(it.x, cut, 'A', AUDIT_PROFILE, it.vname), b = it.x.built, chs = b.story.chapters;
      const cam = camPlanOf(o.plan.frames, camStyle(classOf(b), seedOf(o.name)), chs);
      let key = '', t0 = 0, worst = 0;
      for (const f of o.plan.frames) {
        const k = [...cam.wide, ...(cam.body ?? [])].some(([a, z]) => f.t >= a - 1e-6 && f.t < z) ? '' : organKey(f, chs);
        if (k !== key) { if (key) worst = Math.max(worst, f.t - t0); key = k; t0 = f.t; }
      }
      if (worst > SHOT_MAX_S) bad.push(`${it.id} ${cut}: ${worst.toFixed(1)} s on one organ`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  }, 600_000);
  it('the comparisons do not all ask the same question the same way', () => {
    const qs = new Map<string, number>(); let n = 0;
    for (const pr of PAIRS) { const g = auditCompare(pr.a, pr.b, 'short').cp.guess; if (g) { qs.set(g.question, (qs.get(g.question) ?? 0) + 1); n++; } }
    const top = Math.max(...qs.values());
    expect(qs.size).toBeGreaterThanOrEqual(5);
    expect(top / n).toBeLessThan(0.4);
  }, 600_000);
});

describe('phase 4b: M7 / M8 the end card is readable, one caption track at a time', () => {
  const visible = (p: Plan) => p.frames.filter((f) => f.phase === 'outro' && endTiming(f, p.outroS).end >= 0.5).length / FPS;
  it('every item and comparison, every cut: end card ≥ END_CARD_MIN_S, Shorts ≤ 30 s', () => {
    const bad: string[] = [];
    for (const it of SAMPLE) for (const cut of AUDIT_CUTS) {
      const p = auditSingle(it.x, cut, 'A', AUDIT_PROFILE, it.vname).plan;
      if (visible(p) < END_CARD_MIN_S) bad.push(`${it.id} ${cut}: ${visible(p).toFixed(2)} s`);
      if (p.seconds > LENGTH[cut].max + 1e-6) bad.push(`${it.id} ${cut}: ${p.seconds.toFixed(1)} s long`);
    }
    for (const pr of PAIR_SAMPLE) for (const cut of AUDIT_CUTS) {
      const p = auditCompare(pr.a, pr.b, cut).cp.plan;
      if (visible(p) < END_CARD_MIN_S) bad.push(`${pr.id} ${cut}: ${visible(p).toFixed(2)} s`);
      if (p.seconds > LENGTH[cut].max + 1e-6) bad.push(`${pr.id} ${cut}: ${p.seconds.toFixed(1)} s long`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  }, 600_000);
  it('every comparison × cut: never two different cards on screen at once', () => {
    const bad: string[] = [];
    for (const pr of PAIRS) for (const cut of AUDIT_CUTS) {
      const p = auditCompare(pr.a, pr.b, cut).cp.plan;
      const f = p.frames.find((x) => x.cap?.trim() && x.capB?.trim() && x.cap.trim() !== x.capB.trim());
      if (f) bad.push(`${pr.id} ${cut} @${f.t.toFixed(1)}: ${f.cap} || ${f.capB}`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
  }, 600_000);
  it('a food comparison asks to watch from the first bite, a food vs a drink from the start', () => {
    expect(VIDEO_COPY.loop(true, true)).toMatch(/first bite/);
    expect(VIDEO_COPY.loop(false, true, true)).toMatch(/from the start/);
  });
});

// Phase 4c (2026-11-14, critique minor: "0.6 g fiber" pinned next to "The fat joins your blood later." in pizza,
// "80 ml urine" next to "In your stomach …" in lentils): while a card is read, the where-callout is only shown in the
// card's region of the body (AppV4 passes the card's organs to gaugesAt, as here).
describe('phase 4c: a callout never contradicts the card it stands next to', () => {
  it('every item (sample), long cut: no where-callout outside the card region; both critic cases are hidden', () => {
    const bad: string[] = [];
    let hidden = 0;
    for (const it of SAMPLE) {
      const o = auditSingle(it.x, 'long', 'A', AUDIT_PROFILE, it.vname), b = it.x.built, chs = b.story.chapters;
      o.plan.frames.forEach((fr, i) => {
        if (fr.beat !== 'hold' || (fr.stop ?? 0) === 0 || i % 6) return;
        const organs = beatOrgans(fr.title, beatChapter(chs, fr).focus).organs, regs = new Set(organs.map((k) => REGION[k]));
        const w = whereGauge(b, Math.min(1440, fr.m)), gs = gaugesAt(b, Math.min(1440, fr.m), 'mmol/L', it.x.glucose !== undefined, false, organs);
        if (!organs.length || !w) return;
        const shown = gs.some((g) => g.big === w.big && g.organ === w.organ);
        if (!regs.has(REGION[w.organ]) && shown) bad.push(`${it.id} @${fr.t.toFixed(1)} "${fr.cap}" next to ${w.big}`);
        if (!regs.has(REGION[w.organ])) hidden++;
      });
    }
    expect(bad.slice(0, 10)).toEqual([]);
    expect(hidden).toBeGreaterThan(0);
    const at = (id: string, re: RegExp) => { const it = by(id), o = auditSingle(it.x, 'long', 'A', AUDIT_PROFILE, it.vname), chs = it.x.built.story.chapters; const fr = o.plan.frames.find((f) => f.beat === 'hold' && re.test(f.cap ?? ''))!; return gaugesAt(it.x.built, Math.min(1440, fr.m), 'mmol/L', it.x.glucose !== undefined, false, beatOrgans(fr.title, beatChapter(chs, fr).focus).organs).map((g) => g.big).join(' | '); };
    expect(at('pizza', /fat joins your blood/i)).not.toMatch(/fiber/);
    expect(at('lentils', /^In your stomach|has moved on by/i)).not.toMatch(/urine/);
  }, 600_000);
});
