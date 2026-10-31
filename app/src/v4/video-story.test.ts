// Round 9 (2026-10-29): EVERY food and drink in the database makes a correct video, not only the 16 samples.
// The plans are built by the same code as the app (video-story.ts) from the real model (analyze), and checked for:
// readable captions, no card lingering, the length, numbers that agree with the gauges, no empty / NaN / Croatian
// text, alcohol never winning, and every frame's text inside the platforms' safe zones without overlaps.
import { describe, expect, it } from 'vitest';
import db from './food/fooddb.json';
import { parseMeal } from './food/parse';
import { analyze, verdictOf, type Analysis } from './analyze';
import { sameAmountOffer, sameAs } from './Compare';
import { DEFAULT_PROFILE, type Profile } from '../science/profile';
import { chapterText } from './stories';
import { compareHookB, HOOK_NUMBER, hookB, hookFor, hookForCompare, numbersIn, seedOf } from './video-hook';
import { ALCOHOL_LINE, BANNED, captionsFor, pluralName, DISCLAIMER, PLATFORM_CUT, PLATFORMS, SOURCES_LINE } from './video-caption';
import { motifOf } from './video-audio';
import { inText, plainNote } from './video-body';
import { CARD_MAX_S, CMP_REPEAT_S, TEASE_HUMAN, WORDLESS_MAX_S, FPS, LENGTH, OUTRO_S, READ, readSeconds, SURGE_CLEAR_S, teaseCard, type Cut, type Plan, type PlanFx } from './video-plan';
const CUTS: Cut[] = ['long', 'medium', 'short']; // (round 11: TikTok, Reels, Shorts)
import { HIT_S, surgeLevel, vesselLine, VESSEL_BEND } from './video-fx';
import { frameMoves, idleDrift } from './video-cam';
import { numberConflict, tooEarly } from './video-beats';
import { alcoholTier, ANY_GL } from '../science/alcoholClock';
import { worstMoment } from './status';
import { beatCtx, cmpName, plainLatin, applyHook, climaxFx, comparePlan, decafOf, servingsCard, gaugesAt, payoffMinOf, peakOf, surgeOf, surpriseOf, shortName, singlePlan, singleStops } from './video-story';
import { COVER_BAND, drawCmpFrame, drawCoverFrame, drawFrame, logText, SAFE, SIZE, VIDEO_COPY, type CmpOverlay, type Light, type Overlay, type TextBox } from './share';

type Food = { id: string; name: string; aliases?: string[] };
const FOODS = db as unknown as Food[];
const P: Profile = { ...DEFAULT_PROFILE, drinkAtMin: 22 * 60 }; // late: bedtime and the night are in every story
const run = (q: string, over = 0, p: Profile = P): Analysis | null => { const parts = parseMeal(q); return parts.length ? analyze(parts, p, over) : null; };
const foodOf = (f: Food) => run(f.name) ?? run(f.aliases?.[0] ?? f.id);

/** Every string a video shows must be real words: no "undefined", "NaN", "null", "[object", "Infinity", nor empty. */
const BROKEN = /undefined|NaN|\bnull\b|\[object|Infinity|\$\{/;
/** No Croatian on screen (the app speaks American English): letters and the commonest words. */
const CROATIAN = /[čćšžđČĆŠŽĐ]|\b(je|sat[ai]?|minuta|nakon|šećer|kava|pivo|voda|tijelo|krv|želudac|jetra|bubrezi|dana|ujutro|navečer)\b/i;
const textOk = (s: string | undefined, where: string, bad: string[]) => {
  if (s === undefined) return;
  if (BROKEN.test(s)) bad.push(`${where}: broken "${s}"`);
  if (CROATIAN.test(s)) bad.push(`${where}: Croatian? "${s}"`);
};

function singlePlanOf(x: Analysis, cut: Cut, p: Profile = P, v: 'A' | 'B' = 'A') {
  const b = x.built, story = b.story, name = shortName(x.label);
  const hin = { name, chapters: story.chapters.map((c) => ({ min: c.min, title: c.title, text: chapterText(c, c.min) })),
    alcohol: (b.alcoholG ?? 0) > 1, caffeine: b.caffeine.doseMg >= 10, solid: /bite/i.test(story.chapters[0]?.title ?? ''), kcal: b.energy.total,
    pace: b.pace ? { doses: b.pace.doses, round: 'drink' } : undefined, caffeineMg: b.caffeine.doseMg, surprise: surpriseOf(x.label, x.sugarPeak, p), decaf: decafOf(x.label, b, p) };
  const hookA = hookFor(hin), hook = v === 'A' ? hookA : hookB(hin, hookA);
  const stops = applyHook(singleStops(story, beatCtx(name, b, p.drinkAtMin)), hook);
  const payoff = payoffMinOf(stops, hook);
  const fx: PlanFx = { ...climaxFx(b, x.glucose !== undefined, story.chapters.map((c) => ({ min: c.min, title: c.title, text: chapterText(c, c.min) }))), payoffMin: payoff, drinkAtMin: p.drinkAtMin, wakeMin: p.wakeMin,
    lights: x.systems.map((s) => s.levels[worstMoment(s)] as 0 | 1 | 2), heart: x.systems.find((s) => s.key === 'heart')?.levels, surge: surgeOf(b, x.glucose !== undefined) };
  return { plan: singlePlan(stops, cut, fx), hook, stops };
}

/** Checks every plan shares: readable, no lingering, the length, real words. */
function checkPlan(plan: Plan, cut: Cut, label: string, bad: string[], gaugeAt: (m: number) => string[]) {
  const lim = LENGTH[cut];
  if (!(plan.seconds >= (cut === 'long' ? 61.5 : lim.min) && plan.seconds <= lim.max + 0.5)) bad.push(`${label}: length ${plan.seconds.toFixed(1)} s`);
  if (cut === 'long' && !(plan.seconds >= 60.5)) bad.push(`${label}: a long cut under 60.5 s (owner: never)`);
  // round 11 (research R1): the end card is short (≤ 2.5 s short, ≤ 4 s long) and the 24 h beat has words
  if (plan.outroS > OUTRO_S[cut] + 1e-6 || plan.outroS > (cut === 'short' ? 2.5 : 4) + 1e-6) bad.push(`${label}: end card ${plan.outroS.toFixed(2)} s`);
  if (!plan.frames.some((f) => f.celeb !== undefined)) bad.push(`${label}: no 24 h payoff beat`);
  if (plan.frames.length !== Math.round(plan.seconds * FPS)) bad.push(`${label}: frame count`);
  for (const key of ['text', 'textB'] as const) {
    let run = 0, prev = '';
    for (const pg of plan.pages) {
      const c = pg[key];
      if (c === undefined) continue;
      if (c) {
        textOk(c, `${label} @${pg.stop}`, bad);
        if (pg.s < READ.minPage - 1 / FPS) bad.push(`${label}: "${c}" only ${pg.s.toFixed(2)} s`);
        if (pg.s < readSeconds(c) - 1 / FPS) bad.push(`${label}: "${c}" ${pg.s.toFixed(2)} s < reading time ${readSeconds(c).toFixed(2)} s`);
        if (numberConflict(c, gaugeAt(pg.stop))) bad.push(`${label}: "${c}" disagrees with gauge ${gaugeAt(pg.stop).join(' / ')}`);
      }
      // the same card on screen again right after itself, longer than CMP_REPEAT_S in all
      if (c && c === prev) { run += pg.s; if (run > CMP_REPEAT_S + 0.05) bad.push(`${label}: "${c}" repeats ${run.toFixed(1)} s`); } else run = c ? pg.s : 0;
      prev = c;
    }
  }
  for (const c of plan.cues) textOk(c.data?.label, `${label} cue ${c.kind}`, bad);
  fxTiming(plan, label, bad);
  // round 10b: the picture never stands still for more than 3 s (the day, the camera, or the end's slow breath)
  for (let i = 1, still = 0; i < plan.frames.length; i++) {
    still = frameMoves(plan.frames[i - 1], plan.frames[i]) ? 0 : still + 1;
    if (still > 3 * FPS) { bad.push(`${label}: still picture for > 3 s at ${plan.frames[i].t.toFixed(1)} s`); break; }
  }
  for (const f of plan.frames) { textOk(f.cap, `${label} frame`, bad); if (f.next) textOk(f.next.title, `${label} next`, bad); if (!Number.isFinite(f.m) || !Number.isFinite(f.t)) { bad.push(`${label}: NaN frame`); break; } }
}

/** Round 10: the effects never pile up. At most one bloodstream surge, clear of the sip, the riser and the impact, and
 *  in the main part; and in any 1 s window at most 3 light changes (WCAG 2.3.1): organ hits on new moments, organ
 *  pulses of the micro-beats, the surge's two glows, the impacts, the heartbeat glows. */
function fxTiming(plan: Plan, label: string, bad: string[]) {
  const at = (k: string) => plan.cues.filter((c) => c.kind === k);
  const surge = at('surge'), peak = at('peak')[0], riser = at('riser')[0], outro = at('outro')[0]?.t ?? plan.seconds;
  if (surge.length > 1) bad.push(`${label}: ${surge.length} surges`);
  for (const s of surge) {
    for (const c of [...at('sip'), ...at('peak'), ...at('verdict')]) if (Math.abs(c.t - s.t) < SURGE_CLEAR_S - 1e-6) bad.push(`${label}: surge ${s.t.toFixed(2)} s on top of ${c.kind}`);
    const ride = (s.data?.v ?? 0) > 0; // (the surge that rides the riser starts with it and builds to the impact)
    if (ride && !(riser && peak && Math.abs(s.t - riser.t) < 1e-6 && Math.abs(s.t + (s.data?.v ?? 0) - peak.t) < 1e-6)) bad.push(`${label}: riding surge not on the riser`);
    if (!ride && riser && peak && s.t >= riser.t - SURGE_CLEAR_S && s.t <= peak.t + SURGE_CLEAR_S) bad.push(`${label}: surge in the riser`);
    if (s.t > outro - 1) bad.push(`${label}: surge on the end card`);
    if (peak && s.t > peak.t) bad.push(`${label}: surge after the impact`);
    if (!s.data?.label) bad.push(`${label}: surge without a substance`);
  }
  const flashes: number[] = [];
  for (const c of at('stop')) if (c.t > 1.2 && !(peak && Math.abs(peak.t - c.t) <= 0.3)) flashes.push(c.t);
  for (const c of at('micro')) if (c.data?.v === 1) flashes.push(c.t);
  for (const c of surge) flashes.push(c.t + 0.15, c.t + 0.5);
  for (const c of [...at('peak'), ...at('verdict')]) flashes.push(c.t);
  for (const c of at('day')) flashes.push(c.t); // (round 11: the "day done" ring)
  const hearts = at('heart');
  hearts.forEach((c, i) => { if (c.data?.v !== 1) return; const end = hearts.slice(i + 1).find((h) => h.data?.v === 0)?.t ?? outro; for (let t = c.t + 0.2; t < end; t += 1.1) flashes.push(t); });
  flashes.sort((a, b) => a - b);
  for (let i = 0; i + 3 < flashes.length; i++) if (flashes[i + 3] - flashes[i] < 1) { bad.push(`${label}: 4 flashes within 1 s at ${flashes[i].toFixed(2)} s`); break; }
}

// ---- drawing: a fake 2D context that measures text by its font size (share.test.ts) ----
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
const overlap = (a: TextBox, b: TextBox) => a.x0 < b.x1 - 2 && b.x0 < a.x1 - 2 && a.y0 < b.y1 - 2 && b.y0 < a.y1 - 2;
function checkBoxes(boxes: TextBox[], label: string, bad: string[]) {
  const S = SAFE.reel, [W, H] = SIZE.reel;
  for (const b of boxes) {
    textOk(b.text, label, bad);
    const where = `${label}: "${b.text}" [${Math.round(b.x0)},${Math.round(b.y0)}–${Math.round(b.x1)},${Math.round(b.y1)}]`;
    if (b.x0 < -0.5 || b.x1 > W + 0.5 || b.y0 < -0.5 || b.y1 > H + 0.5) { bad.push(`${where} off the frame`); continue; }
    if (b.deco) continue;
    if (b.x0 < S.left - 0.5 || b.x1 > S.right + 0.5 || b.y0 < S.top - 0.5 || b.y1 > S.bottom + 0.5 || (b.y1 > S.lowFrom && b.x1 > S.rightLow + 0.5)) bad.push(`${where} outside the safe zone`);
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (!boxes[i].deco && !boxes[j].deco && overlap(boxes[i], boxes[j])) bad.push(`${label}: "${boxes[i].text}" over "${boxes[j].text}"`);
}
const ICON = { energy: '⚡', heart: '❤', water: '💧', brain: '🧠' } as const, SHORT = { energy: 'Blood sugar', heart: 'Heart', water: 'Water', brain: 'Brain' } as const;
const lightsAt = (x: Analysis, m: number): Light[] => x.systems.map((s) => ({ icon: ICON[s.key as keyof typeof ICON], label: SHORT[s.key as keyof typeof SHORT], level: s.levels[Math.round(Math.min(1440, m))] as 0 | 1 | 2 }));
const sampleFrames = (plan: Plan) => plan.frames.filter((f, i) => i % 20 === 0 || i === plan.frames.length - 1 || (i > 0 && plan.frames[i - 1].cap !== f.cap));

/** Single videos: the overlay the app builds (AppV4 overlayRef), with this food's own words and gauges. */
function drawSingle(x: Analysis, plan: Plan, hook: { line1: string; line2: string }, label: string, bad: string[]) {
  const st = x.built.story;
  for (const fr of sampleFrames(plan)) {
    const m = Math.min(1440, fr.m), stop = fr.stop ?? m, ch = st.chapters.reduce((a, c) => (stop + 1e-6 >= c.min ? c : a), st.chapters[0]);
    const o: Overlay = { hook: `${hook.line1}\n${hook.line2}`, title: plainLatin(x.label.replace(/\s*\([^)]*\)/g, '')), sub: 'Man, 35 · 178 cm · 80 kg', clock: '22:00', step: ch.title, caption: fr.cap ?? '',
      progress: fr.u ?? 0, lights: lightsAt(x, m), handle: '@inside24h', gauges: gaugesAt(x.built, m, 'mmol/L', x.glucose !== undefined).map((g) => ({ ...g, at: { x: 540, y: 900 } })),
      summary: lightsAt(x, m).map((l) => ({ ...l, note: 'Mild stress at 23:28' })), alcohol: (x.built.alcoholG ?? 0) > 1, solid: /bite/i.test(st.chapters[0]?.title ?? '') };
    checkBoxes(logText(() => drawFrame(fakeCtx(0.56), 1080, 1920, SRC, o, 'reel', fr, plan, null)), `${label} t=${fr.t.toFixed(1)} ${fr.phase}`, bad);
  }
}

const ALL = FOODS.map((f) => ({ f, x: foodOf(f) }));
const failed = (bad: string[]) => [...new Set(bad)].slice(0, 40);

describe('round 9: every food and drink in the database makes a correct video', () => {
  it('every database item has a model (parse → analyze)', () => {
    expect(ALL.filter((y) => !y.x).map((y) => y.f.id)).toEqual([]);
  });
  for (const cut of CUTS) {
    it(`single · ${cut}: readable, the right length, real words, numbers agree with the gauges (${FOODS.length} items)`, () => {
      const bad: string[] = [];
      for (const { f, x } of ALL) {
        if (!x) continue;
        const { plan, hook } = singlePlanOf(x, cut);
        textOk(hook.line1, `${f.id} hook`, bad); textOk(hook.line2, `${f.id} hook`, bad);
        checkPlan(plan, cut, `${f.id} ${cut}`, bad, (m) => gaugesAt(x.built, m, 'mmol/L', x.glucose !== undefined).map((g) => `${g.big} ${g.small}`));
      }
      expect(failed(bad)).toEqual([]);
    });
    it(`single · ${cut}: every sampled frame keeps its text in the safe zone, never text over text`, () => {
      const bad: string[] = [];
      for (const { f, x } of ALL) { if (!x) continue; const { plan, hook } = singlePlanOf(x, cut); drawSingle(x, plan, hook, `${f.id} ${cut}`, bad); }
      expect(failed(bad)).toEqual([]);
    });
  }
  it('drinks at different times and amounts (beer over 2 h, 2 espressos, late cola): same rules', () => {
    const bad: string[] = [];
    const cases: [string, number, number][] = [['3 beers', 120, 17], ['3 beers', 120, 21], ['1 beer', 0, 19], ['2 glasses of wine', 60, 20], ['2 espressos', 0, 15], ['cola', 0, 21], ['energy drink', 0, 8], ['coffee', 0, 7]];
    for (const [q, over, h] of cases) for (const cut of CUTS) {
      const p = { ...P, drinkAtMin: h * 60 }, x = run(q, over, p);
      if (!x) { bad.push(`${q}: no model`); continue; }
      const { plan, hook } = singlePlanOf(x, cut, p);
      checkPlan(plan, cut, `${q}@${h} ${cut}`, bad, (m) => gaugesAt(x.built, m, 'mmol/L', x.glucose !== undefined).map((g) => `${g.big} ${g.small}`));
      drawSingle(x, plan, hook, `${q}@${h} ${cut}`, bad);
    }
    expect(failed(bad)).toEqual([]);
  });
});

const PAIRS: [string, string][] = [['espresso', 'beer'], ['cola', '330 ml of water'], ['pizza', 'kebab'], ['red wine', 'beer'], ['energy drink', 'coffee'],
  ['orange juice', 'cola'], ['apple', 'banana'], ['milk', 'water'], ['hamburger', 'salad'], ['beer', 'water'], ['croissant', 'oatmeal'], ['white rice', 'chocolate']];
describe('round 9: comparison videos over a representative set of pairs', () => {
  for (const cut of CUTS) it(`compare · ${cut}: readable, no lingering card, alcohol never wins, text in the safe zone`, () => {
    const bad: string[] = [];
    for (const [qa, qb] of PAIRS) {
      const a = run(qa), b = run(qb), label = `${qa} vs ${qb} ${cut}`;
      if (!a || !b) { bad.push(`${label}: no model`); continue; }
      const cp = comparePlan(a, b, P, cut);
      checkPlan(cp.plan, cut, label, bad, (m) => [...gaugesAt(a.built, m, 'mmol/L', a.glucose !== undefined), ...gaugesAt(b.built, m, 'mmol/L', b.glucose !== undefined)].map((g) => `${g.big} ${g.small}`));
      textOk(cp.verdict, `${label} verdict`, bad);
      for (const x of [a, b]) if ((x.built.alcoholG ?? 0) > 1 && new RegExp(`^🏆\\s*${cmpName(x.label).split(' ')[0]}`, 'i').test(cp.verdict)) bad.push(`${label}: alcohol wins "${cp.verdict}"`);
      if (cp.guess) for (const s of [cp.guess.question, cp.guess.answer1, cp.guess.answer2, cp.guess.recap]) textOk(s, `${label} guess`, bad);
      const hook = cp.guess ? cp.guess.question : hookForCompare(cmpName(a.label), cmpName(b.label), false).line1;
      textOk(hook, `${label} hook`, bad);
      // the split screen's text, frame by frame (sampled), with each side's own words and gauges
      const side = (x: Analysis, m: number, stop: number, cap: string | undefined): CmpOverlay['a'] => {
        const ch = x.built.story.chapters.reduce((acc, c) => (stop + 1e-6 >= c.min ? c : acc), x.built.story.chapters[0]);
        const g = gaugesAt(x.built, m, 'mmol/L', x.glucose !== undefined);
        return { name: cmpName(x.label), color: x.color, step: ch.title, caption: cap ?? '', sugar: 'Blood sugar steady', sugarLevel: 0, lights: lightsAt(x, m),
          gauge: (() => { const y = g.find((z) => z.curve) ?? g[0]; return y ? { ...y, at: { x: 270, y: 900 } } : null; })(), alcohol: (x.built.alcoholG ?? 0) > 1, serving: x.serving,
          summary: { kcal: x.kcal, sugarPeak: 'steady', worst: lightsAt(x, 1440).map((l) => ({ ...l, unknown: false, note: 'fine all day' })) } } as CmpOverlay['a'];
      };
      for (const fr of sampleFrames(cp.plan)) {
        const m = Math.min(1440, fr.m), stop = fr.stop ?? m;
        const o: CmpOverlay = { hook, guess: !!cp.guess, clock: '22:00', progress: fr.u ?? 0, handle: '@inside24h', stamp: 'LATER', verdict: cp.verdict,
          answer: cp.guess ? { a1: cp.guess.answer1, a2: cp.guess.answer2, recap: cp.guess.recap, kind: cp.guess.kind, winner: cp.guess.winner } : undefined,
          a: side(a, m, stop, fr.cap), b: side(b, m, stop, fr.capB) } as CmpOverlay;
        checkBoxes(logText(() => drawCmpFrame(fakeCtx(0.56), 1080, 1920, SRC, o, fr, cp.plan, null)), `${label} t=${fr.t.toFixed(1)} ${fr.phase}`, bad);
      }
    }
    expect(failed(bad)).toEqual([]);
  }, 60000);
});

describe('round 9: owner decisions and new effects', () => {
  it('the blood alcohol gauge names BOTH driving limits (US 0.08 %, EU 0.05 %) once the range reaches one', () => {
    const x = run('3 beers', 120)!, pk = peakOf(x.built, false)!;
    const g = gaugesAt(x.built, pk, 'mmol/L', false).find((y) => /BAC/.test(y.small))!;
    expect(g.small).toMatch(/US limit 0\.08 % · EU limit 0\.05 %/);
  });
  it('a long jump through the day says how much it skips (the air rush and the speed lines follow it)', () => {
    const x = run('espresso')!, { plan } = singlePlanOf(x, 'long');
    const moves = plan.cues.filter((c) => c.kind === 'move');
    expect(moves.length).toBeGreaterThan(2);
    expect(moves.every((c) => Number.isFinite(c.data?.v))).toBe(true);
    expect(moves.some((c) => (c.data?.v ?? 0) >= 240)).toBe(true);
    expect(plan.frames.some((f) => f.beat === 'glide' && (f.rate ?? 0) > 60)).toBe(true);
  });
});

describe('round 10: the bloodstream surge and the organ hits', () => {
  it('surgeOf follows the main substance and its climb (sugar, caffeine, alcohol), and nothing for water', () => {
    const k = (q: string) => { const x = run(q)!; return surgeOf(x.built, x.glucose !== undefined); };
    expect(k('cola')?.kind).toBe('sugar');
    expect(k('espresso')?.kind).toBe('caffeine');
    expect(k('beer')?.kind).toBe('alcohol');
    expect(k('glass of water')).toBeUndefined();
    for (const q of ['cola', 'espresso', 'beer', 'kebab']) { const s = k(q)!; expect(s.min).toBeGreaterThan(0); expect(s.max).toBeGreaterThanOrEqual(s.min); }
  });
  it('the surge lands while the level climbs (model minutes), once, in most videos with a peak', () => {
    let withPeak = 0, withSurge = 0;
    for (const { x } of ALL) {
      if (!x) continue;
      const s = surgeOf(x.built, x.glucose !== undefined); if (!s) continue;
      withPeak++;
      const { plan } = singlePlanOf(x, 'long'), c = plan.cues.filter((y) => y.kind === 'surge');
      expect(c.length).toBeLessThanOrEqual(1);
      if (!c.length) continue;
      withSurge++;
      const v = c[0].data?.v ?? 0, ms = plan.frames.slice(Math.round(c[0].t * FPS), Math.round((c[0].t + v) * FPS) + 1).map((f) => f.m);
      expect(ms.some((m) => m >= s.min - 1e-6 && m <= s.max + 1e-6), `${x.label}: surge outside the climb`).toBe(true);
      expect(c[0].data?.label).toBe(s.kind);
    }
    expect(withSurge).toBeGreaterThan(withPeak * 0.9);
  });
  it('the surge eases in and out; an organ hit is short', () => {
    expect(surgeLevel(-0.1)).toBe(0); expect(surgeLevel(Infinity)).toBe(0); expect(surgeLevel(0.25)).toBeCloseTo(1, 5);
    expect(surgeLevel(1.5)).toBeLessThan(0.3); expect(surgeLevel(3)).toBe(0);
    for (let a = 0; a < 2.6; a += 1 / FPS) expect(Math.abs(surgeLevel(a + 1 / FPS) - surgeLevel(a))).toBeLessThan(0.2); // no jump between frames
    expect(HIT_S).toBeLessThanOrEqual(0.6);
  });
});

describe('round 10b: a living end, organic vessels', () => {
  it('the end breathes: the camera drifts on every frame of the 24 h beat and the end card, smoothly', () => {
    const x = run('kebab')!, { plan } = singlePlanOf(x, 'long');
    const end = plan.frames.filter((f) => f.beat === 'end');
    expect(end.length).toBeGreaterThan(3 * FPS);
    for (let i = 1; i < end.length; i++) {
      const a = idleDrift(end[i - 1])!, b = idleDrift(end[i])!;
      expect(b).toBeGreaterThanOrEqual(0); expect(b).toBeLessThanOrEqual(1);
      expect(Math.abs(b - a)).toBeLessThan(0.02); // no jump between frames
    }
    expect(idleDrift(plan.frames.find((f) => f.beat === 'hold'))).toBeNull();
  });
  it('the old end (no breath) would have failed: a frozen 24 h beat counts as still', () => {
    const f = { m: 1440, t: 60, beat: 'end' }, g = { ...f, t: 60 + 1 / FPS };
    expect(frameMoves(f, g)).toBe(true);
    expect(frameMoves({ m: 1440, t: 1, beat: 'hold' }, { m: 1440, t: 1 + 1 / FPS, beat: 'hold' })).toBe(false);
  });
  it('the vessels wind: each bows away from the straight line between organs, and they part between them', () => {
    const pts = [{ x: 540, y: 1300 }, { x: 530, y: 1050 }, { x: 545, y: 800 }, { x: 540, y: 500 }]; // a wide shot: nearly a vertical line
    const lines = VESSEL_BEND.map((b) => vesselLine(pts, b));
    for (const l of lines) {
      expect(Math.max(...l.p.map((q) => Math.abs(q.x - 540)))).toBeGreaterThan(10);
      expect(l.p.every((q) => Number.isFinite(q.x) && Number.isFinite(q.y))).toBe(true);
      expect(l.at(l.len * 3.5).y).toBeGreaterThan(0); // wraps round
    }
    const mid = lines.map((l) => l.at(l.len * 0.2).x);
    expect(Math.max(...mid) - Math.min(...mid)).toBeGreaterThan(15);
  });
});

describe('round 11: platforms, two hooks, captions, cover, variety', () => {
  const hooksOf = (x: Analysis) => { const { hook } = singlePlanOf(x, 'long'); const b = hookB({ name: shortName(x.label), chapters: x.built.story.chapters.map((c) => ({ min: c.min, title: c.title, text: chapterText(c, c.min) })), alcohol: (x.built.alcoholG ?? 0) > 1, caffeine: x.built.caffeine.doseMg >= 10, solid: /bite/i.test(x.built.story.chapters[0]?.title ?? '') }, hook); return [hook, b]; };
  it('hook B (every food): another formula, only A\'s own numbers, short lines, a real question, no command to comment', () => {
    const bad: string[] = [];
    for (const { f, x } of ALL) {
      if (!x) continue;
      const [a, b] = hooksOf(x);
      if (`${b.line1}` === `${a.line1}`) bad.push(`${f.id}: B = A`);
      const nA: string[] = [...numbersIn(`${a.line1} ${a.line2}`)];
      for (const n of numbersIn(`${b.line1} ${b.line2}`)) if (n !== '24' && !nA.includes(n)) bad.push(`${f.id}: B has ${n}`); // (24: the hours of the series itself)
      for (const s of [b.line1, b.line2]) { textOk(s, `${f.id} hook B`, bad); if (s.split(/\s+/).length > 9) bad.push(`${f.id}: long "${s}"`); if (/comment/i.test(s)) bad.push(`${f.id}: "${s}"`); }
      if (b.payoff !== a.payoff && !x.built.story.chapters.some((c) => c.title === b.payoff)) bad.push(`${f.id}: B pays off at a moment the story does not have`); // (round 14: B may ask its own question)
    }
    expect(failed(bad)).toEqual([]);
  });
  it('the video never asks for a comment (Meta): the guess chip, the comparison hook', () => {
    expect(VIDEO_COPY.guessChip).toBe('Guess before the answer.');
    expect(hookForCompare('Cola', 'Water', true).line2).not.toMatch(/comment/i);
    expect(compareHookB('Guess: which leaves your stomach first?', 'Cola', 'Water')).toBe('Cola or Water: which leaves your stomach first?');
  });
  it('captions (every food): search phrase first, ≤ 5 hashtags on Instagram, Shorts title ≤ 60, sources and disclaimer, comment ask only on TikTok', () => {
    const bad: string[] = [];
    for (const { f, x } of ALL) {
      if (!x) continue;
      const [a] = hooksOf(x), alc = (x.built.alcoholG ?? 0) > 1;
      const c = captionsFor({ name: shortName(x.label), hook: a, alcohol: alc, caffeine: x.built.caffeine.doseMg >= 10 });
      if (!c.reels.startsWith('What happens in your body after')) bad.push(`${f.id}: reels first line`);
      if ((c.reels.match(/#\w+/g) ?? []).length > 5) bad.push(`${f.id}: > 5 hashtags`);
      if (c.shorts.title.length > 60) bad.push(`${f.id}: title ${c.shorts.title.length}`);
      for (const [k, s] of Object.entries({ tiktok: c.tiktok, reels: c.reels, facebook: c.facebook, shorts: c.shorts.description })) {
        textOk(s, `${f.id} ${k}`, bad);
        if (BANNED.test(s)) bad.push(`${f.id} ${k}: banned word`);
        if (!s.includes(DISCLAIMER) || !s.includes(SOURCES_LINE)) bad.push(`${f.id} ${k}: no sources / disclaimer`);
        if (alc && !s.includes(ALCOHOL_LINE)) bad.push(`${f.id} ${k}: no 18+ line`);
        if (k !== 'tiktok' && /comment/i.test(s)) bad.push(`${f.id} ${k}: asks for comments`);
      }
      for (const n of numbersIn(`${a.line1} ${a.line2}`)) if (!c.tiktok.includes(n)) bad.push(`${f.id}: caption lost ${n}`);
    }
    expect(failed(bad)).toEqual([]);
  });
  it('each platform gets its cut: TikTok and Facebook long, Reels medium, Shorts short', () => {
    expect(PLATFORMS.map((p) => PLATFORM_CUT[p])).toEqual(['long', 'medium', 'short', 'long']);
    const x = run('cola')!;
    for (const p of PLATFORMS) { const pl = singlePlanOf(x, PLATFORM_CUT[p]).plan, lim = LENGTH[PLATFORM_CUT[p]]; expect(pl.seconds).toBeGreaterThanOrEqual(lim.min); expect(pl.seconds).toBeLessThanOrEqual(lim.max + 0.5); }
  });
  it('the cover keeps the hook and the series tag in the grid-safe centre band', () => {
    for (const hook of ['One can of cola: 9 teaspoons of sugar.\nWatch where it goes.', 'A whole pizza (1154 g): 2723 kcal.\nWhere is it 24 hours later?', 'Guess: which leaves your stomach first?']) {
      const boxes = logText(() => drawCoverFrame(fakeCtx(0.56), 1080, 1920, null, hook));
      expect(boxes.length).toBeGreaterThanOrEqual(2);
      for (const b of boxes) { expect(b.x0).toBeGreaterThanOrEqual(COVER_BAND.left - 1); expect(b.x1).toBeLessThanOrEqual(COVER_BAND.right + 1); expect(b.y0).toBeGreaterThanOrEqual(COVER_BAND.top - 1); expect(b.y1).toBeLessThanOrEqual(COVER_BAND.bottom + 1); }
      expect(boxes.some((b) => b.text === 'INSIDE 24H')).toBe(true);
    }
  });
  it('variety (YouTube): the music motif, hook order and sway come from the food, the same on every export', () => {
    const seeds = ALL.filter((y) => y.x).map((y) => seedOf(shortName(y.x!.label)));
    expect(seedOf('One can of cola')).toBe(seedOf('One can of cola'));
    const motifs = new Set(seeds.map((s) => JSON.stringify(motifOf(s))));
    expect(motifs.size).toBeGreaterThanOrEqual(10);
    expect(new Set(seeds.map((s) => s % 2)).size).toBe(2); // both hook formulas lead somewhere
  });
});

describe('round 12: every item has a climax and a clock that keeps up; one alcohol ladder; compare peaks = singles', () => {
  type V = { v: string; name: string };
  const VARIANTS = (db as unknown as { id: string; variants?: V[] }[]).flatMap((f) => (f.variants ?? []).map((v) => ({ id: `${f.id}.${v.v}`, x: run(v.name) })));
  const EVERY = [...ALL.map(({ f, x }) => ({ id: f.id, x })), ...VARIANTS];
  it(`every database item and variant (${FOODS.length} + ${VARIANTS.length}): a real climax, no card before the clock reaches its time, the clock never stuck under cards`, () => {
    const bad: string[] = [];
    for (const { id, x } of EVERY) {
      if (!x) { bad.push(`${id}: no model`); continue; }
      for (const cut of ['long', 'short'] as const) {
        const { plan } = singlePlanOf(x, cut);
        if (!plan.cues.some((c) => c.kind === 'peak')) bad.push(`${id} ${cut}: no climax`);
        const shownFrom = new Map<string, number>();
        for (const f of plan.frames) if (f.cap && f.beat === 'hold' && !shownFrom.has(f.cap)) shownFrom.set(f.cap, f.m);
        for (const [cap, m] of shownFrom) if (!/^(Coming up|Still to come)/.test(cap) && tooEarly(cap, m)) bad.push(`${id} ${cut}: "${cap}" at +${Math.round(m)} min`);
        // (the clock may rest only where the next moment is under 10 min away, or at +24:00)
        const gapAt = (st: number) => { const nx = plan.stops.find((s) => s > st + 1e-6); return nx === undefined ? 0 : nx - st; };
        let run0 = 0, last = -1;
        for (const f of plan.frames) {
          const shown = f.phase === 'main' && f.beat === 'hold' && !!f.cap && (f.stop ?? 0) < 1440 && gapAt(f.stop ?? 0) >= 10, minute = Math.floor(f.m);
          run0 = shown && minute === last ? run0 + 1 : 0; last = shown ? minute : -1;
          if (run0 > 6 * FPS) { bad.push(`${id} ${cut}: clock stuck at +${minute} min under cards`); break; }
        }
      }
    }
    expect(failed(bad)).toEqual([]);
  }, 120000);
  it('any alcohol: the brain light is never green while it is in the blood, and beer and wine at the same level read the same', () => {
    const bad: string[] = [];
    for (const { id, x } of EVERY) {
      if (!x || !((x.built.alcoholG ?? 0) > 1) || !x.built.bac || !Array.from(x.built.bac).some((v) => v > ANY_GL)) continue; // (alcohol-free beer never reaches the blood level that counts)
      const brain = x.systems.find((s) => s.key === 'brain')!;
      for (let m = 0; m < Math.min(1440, brain.levels.length); m += 5) if (x.built.bac[m] > ANY_GL && brain.levels[m] === 0) { bad.push(`${id}: green at +${m} min`); break; }
      const w = x.systems.map((s) => s.levels[worstMoment(s)]);
      if (w[x.systems.findIndex((s) => s.key === 'brain')] === 0) bad.push(`${id}: end card brain green`);
    }
    expect(failed(bad)).toEqual([]);
    const beer = run('beer')!, wine = run('red wine')!;
    const label = (x: Analysis) => { const b = x.built.bac!; let pm = 0; for (let m = 0; m < 1441; m++) if (b[m] > b[pm]) pm = m; return [alcoholTier(b[pm]), gaugesAt(x.built, pm, 'mmol/L', false).find((g) => g.curve)?.big]; };
    expect(label(wine)).toEqual(label(beer));
  });
  it('compare: each side\'s peak moment is its own stop, at the minute of its single video, with its peak card there', () => {
    const bad: string[] = [];
    for (const [qa, qb] of [['espresso', 'beer'], ['cola', 'glass of water'], ['espresso', 'cola'], ['red wine', 'beer'], ['hamburger', 'cola']]) {
      const a = run(qa)!, b = run(qb)!, cp = comparePlan(a, b, P, 'long');
      for (const [x, key] of [[a, 'text'], [b, 'textB']] as const) {
        for (const c of x.built.story.chapters.filter((ch) => ch.min > 0 && ch.min < 1440 && /peak/i.test(ch.title))) {
          if (!cp.plan.stops.includes(c.min)) bad.push(`${qa} vs ${qb}: ${x.label} peak +${c.min} is not a stop (${cp.plan.stops.join(',')})`);
          for (const pg of cp.plan.pages) if (/peaks now|highest now/i.test(pg[key] ?? '') && Math.abs(pg.stop - c.min) > 10) bad.push(`${qa} vs ${qb}: "${pg[key]}" at +${pg.stop}`);
        }
      }
    }
    expect(failed(bad)).toEqual([]);
  });
  it('a starchy food leads with its teaspoons, the number the video itself says (available carbohydrate / 4 g)', () => {
    const x = run('kaiser roll')!, { hook } = singlePlanOf(x, 'short');
    const n = /about (\d+) teaspoons of sugar/.exec(hook.line1)?.[1];
    expect(n).toBeDefined();
    const said = x.built.story.chapters.map((c) => chapterText(c, c.min)).join(' ');
    expect(said).toContain(`In all, about ${n} teaspoons of sugar reach your blood`);
  });
  it('captions: hashtags name the item and its story, and #inside24h is always there', () => {
    const tagsOf = (name: string, o: Partial<Parameters<typeof captionsFor>[0]> = {}) => captionsFor({ name, hook: { line1: 'A.', line2: 'B.' }, ...o });
    expect(tagsOf('2 crepes with chocolate spread').tiktok).toMatch(/#crepes\b/);
    expect(tagsOf('1 cinnamon roll').tiktok).toMatch(/#cinnamonroll\b/);
    expect(tagsOf('1 hamburger, a small portion of french fries and 330 ml of cola').tiktok).toMatch(/#hamburger .*#fastfood/);
    expect(tagsOf('One espresso', { caffeine: true }).tiktok).toMatch(/#caffeine/);
    expect(tagsOf('One espresso', { caffeine: true }).tiktok).not.toMatch(/#bloodsugar/);
    for (const c of [tagsOf('Cola vs Water', { compare: { a: 'Cola', b: 'Water' } }), tagsOf('One can of cola', { sugar: true })]) {
      for (const s of [c.tiktok, c.reels, c.shorts.description]) expect(s).toMatch(/#inside24h/);
    }
    expect(tagsOf('2 crepes with chocolate spread').shorts.title).toMatch(/: (what they do )?inside/); // (round 13)
    expect(tagsOf('2 crepes').shorts.title).toBe('2 crepes: what they do inside you in 24 h');
  });
});

describe('round 13: one source of truth for every number and time; lively pacing for every item class', () => {
  type V = { v: string; name: string };
  const VARIANTS = (db as unknown as { id: string; variants?: V[] }[]).flatMap((f) => (f.variants ?? []).map((v) => ({ id: `${f.id}.${v.v}`, x: run(v.name) })));
  const EVERY = [...ALL.map(({ f, x }) => ({ id: f.id, x })), ...VARIANTS].filter((y): y is { id: string; x: Analysis } => !!y.x);
  const minOf = (s: string) => { const m = /(\d+) h(?: (\d+) min)? in|(\d+) min in/.exec(s); return m ? (m[3] ? Number(m[3]) : Number(m[1]) * 60 + Number(m[2] ?? 0)) : null; };
  const argmax = (s: ArrayLike<number>) => { let k = 0; for (let i = 1; i <= Math.min(1440, s.length - 1); i++) if (s[i] > s[k]) k = i; return k; };
  it('the end card says the same peak minute as the video (sugar: the "Blood sugar peak" moment; alcohol: the BAC peak)', () => {
    const bad: string[] = [];
    for (const { id, x } of EVERY) {
      for (const s of x.systems) {
        const at0 = worstMoment(s), lvl = s.levels[at0] as 0 | 1 | 2;
        const note = plainNote(s.key, lvl, at0, x.built, inText(at0), x.glucose === undefined && s.key === 'energy');
        const m = minOf(note);
        if (s.key === 'energy' && m !== null && /peak|spike/i.test(note)) {
          const ch = x.built.story.chapters.find((c) => /^(Blood sugar peak|Sugar rises)$/.test(c.title));
          if (ch && Math.abs(ch.min - m) > 2) bad.push(`${id}: "${note}" vs moment +${ch.min}`);
        }
        if (s.key === 'brain' && m !== null && x.built.bac && Math.max(...Array.from(x.built.bac)) > 0.02 && Math.abs(argmax(x.built.bac) - m) > 2) bad.push(`${id}: "${note}" vs BAC peak`);
        if (note.length > 32) bad.push(`${id}: note too long "${note}"`);
      }
    }
    expect(failed(bad)).toEqual([]);
  });
  it('time statements never contradict each other: "almost all" comes well after "half" (the same stomach model)', () => {
    const bad: string[] = [];
    for (const { id, x } of EVERY) for (const c of x.built.story.chapters) {
      const t = chapterText(c, c.min), h = /half has moved on after about (\d+) minutes/.exec(t), a = /almost all of it by about (\d+) (minutes|hours)/.exec(t);
      if (/by 4 hours/.test(t)) bad.push(`${id}: the old template "by 4 hours"`);
      if (h && a) { const am = Number(a[1]) * (a[2] === 'hours' ? 60 : 1); if (!(am >= 1.3 * Number(h[1]))) bad.push(`${id}: half ${h[1]} min, almost all ${am} min`); }
    }
    expect(failed(bad)).toEqual([]);
  });
  it('every item and cut: no card held longer than CARD_MAX_S (unless its own reading time), a gauge at the climax, lengths with margins', () => {
    const bad: string[] = [];
    for (const { id, x } of EVERY) for (const cut of CUTS) {
      const { plan } = singlePlanOf(x, cut);
      for (const pg of plan.pages) if (pg.s > Math.max(CARD_MAX_S, readSeconds(pg.text, true)) + 1.2) /* (≈ 7 s at most) */ /* (≈ 6 s: a very sparse drink may run a frame or two over) */ { bad.push(`${id} ${cut}: "${pg.text}" ${pg.s.toFixed(1)} s`); break; }
      const pk = plan.cues.find((c) => c.kind === 'peak');
      if (pk) { const m = plan.frames[Math.round(pk.t * FPS)].m; if (!gaugesAt(x.built, m, 'mmol/L', x.glucose !== undefined).length) bad.push(`${id} ${cut}: no gauge at the climax (+${Math.round(m)})`); }
      if (plan.seconds > LENGTH[cut].max + 0.5) bad.push(`${id} ${cut}: ${plan.seconds.toFixed(1)} s`);
    }
    expect(failed(bad)).toEqual([]);
  }, 180000);
  it('compare: a guessed answer is revealed in the second half of the video, never in the first', () => {
    const bad: string[] = [];
    for (const [qa, qb] of [['hamburger', 'cola'], ['cola', 'glass of water'], ['espresso', 'beer'], ['red wine', 'beer'], ['orange juice', 'cola']]) for (const cut of CUTS) {
      const cp = comparePlan(run(qa)!, run(qb)!, P, cut), pk = cp.plan.cues.find((c) => c.kind === 'peak');
      if (cp.guess && pk && pk.t < 0.5 * cp.plan.seconds) bad.push(`${qa} vs ${qb} ${cut}: answer at ${pk.t.toFixed(1)} of ${cp.plan.seconds.toFixed(1)} s`);
    }
    expect(failed(bad)).toEqual([]);
  });
  it('alcohol vs alcohol: a guess game, and the verdict never frames alcohol as a choice', () => {
    const a = run('red wine')!, b = run('beer')!, cp = comparePlan(a, b, P, 'medium');
    expect(cp.guess?.question).toMatch(/^Guess: which (leaves your blood first|brings more alcohol)\?$/);
    expect(cp.verdict).not.toMatch(/choice|wins|🏆|better/i);
  });
  it('Shorts titles agree in number with the name, for every item', () => {
    const bad: string[] = [];
    for (const { id, x } of EVERY) {
      const name = shortName(x.label), t = captionsFor({ name, hook: { line1: 'A.', line2: 'B.' } }).shorts.title;
      if (/\b(ml|g|l)\b.*\bthey do\b/.test(t) || (pluralName(name) && !/they do/.test(t)) || (!pluralName(name) && /they do/.test(t) && t.includes(name))) bad.push(`${id}: "${t}"`);
    }
    expect(failed(bad)).toEqual([]);
    expect(pluralName('500 ml of beer')).toBe(false); expect(pluralName('3 × 500 ml of beer over 2 h')).toBe(false); expect(pluralName('2 crepes')).toBe(true);
  });
  it('oat milk leads with what the model shows: more blood sugar than cow’s milk', () => {
    const x = run('oat milk')!, { hook } = singlePlanOf(x, 'short');
    expect(hook.line2).toMatch(/^\d(\.\d)?× the blood sugar rise of cow’s milk\.$/); // (round 14: with the model's number)
  });
  it('teasers say what is coming in plain words, never a bare chapter title like "peak"', () => {
    expect(teaseCard('Caffeine peak')).toBe('Coming up: when it hits hardest.');
    expect(teaseCard('Bedtime')).toBe('Coming up: what is left at bedtime.');
  });
});

describe('round 14: no stretch without words, every hook carries a number or a question and is answered', () => {
  type V = { v: string; name: string };
  const VARIANTS = (db as unknown as { id: string; variants?: V[] }[]).flatMap((f) => (f.variants ?? []).map((v) => ({ id: `${f.id}.${v.v}`, x: run(v.name) })));
  const EVERY = [...ALL.map(({ f, x }) => ({ id: f.id, x })), ...VARIANTS].filter((y): y is { id: string; x: Analysis } => !!y.x);
  /** the longest stretch of the main part with no card on screen (the 24 h beat and the end card aside) */
  const wordless = (plan: Plan) => {
    let run0 = 0, worst = 0, at = 0;
    for (const f of plan.frames) {
      if (f.phase !== 'main' || f.beat === 'teaser' || f.beat === 'rewind' || f.beat === 'end') { run0 = 0; continue; }
      const card = !!(f.cap || f.capB) && (f.beat === 'hold' || f.beat === 'hook' || (f.plateA ?? 1) > 0.5);
      run0 = card ? 0 : run0 + 1; if (run0 > worst) { worst = run0; at = f.t; }
    }
    return { s: worst / FPS, at };
  };
  it(`every item and variant, every cut: never more than ${WORDLESS_MAX_S} s without a card`, () => {
    const bad: string[] = [];
    for (const { id, x } of EVERY) for (const cut of CUTS) { const w = wordless(singlePlanOf(x, cut).plan); if (w.s > WORDLESS_MAX_S + 0.05) bad.push(`${id} ${cut}: ${w.s.toFixed(1)} s at ${w.at.toFixed(1)}`); }
    expect(failed(bad)).toEqual([]);
  }, 240000);
  it('compare pairs, every cut: never more than WORDLESS_MAX_S without a card', () => {
    const bad: string[] = [];
    for (const [qa, qb] of [['cola', 'glass of water'], ['espresso', 'beer'], ['red wine', 'beer'], ['hamburger', 'cola'], ['orange juice', 'cola'], ['pizza', 'kebab']]) for (const cut of CUTS) {
      const w = wordless(comparePlan(run(qa)!, run(qb)!, P, cut).plan); if (w.s > WORDLESS_MAX_S + 0.05) bad.push(`${qa} vs ${qb} ${cut}: ${w.s.toFixed(1)} s at ${w.at.toFixed(1)}`);
    }
    expect(failed(bad)).toEqual([]);
  });
  it('every hook (A and B) has a number or a question; a question is answered on screen; the hook\'s numbers are on a card', () => {
    const bad: string[] = [];
    for (const { id, x } of EVERY) for (const v of ['A', 'B'] as const) {
      const { plan, hook, stops } = singlePlanOf(x, 'short', P, v), both = `${hook.line1} ${hook.line2}`, pages = plan.pages.map((p) => p.text);
      if (!HOOK_NUMBER.test(both) && !/\?/.test(both)) bad.push(`${id} ${v}: no number, no question: "${both}"`);
      if (/\?/.test(both)) {
        const pm = payoffMinOf(stops, hook);
        if (pm === undefined) bad.push(`${id} ${v}: a question with no answer moment: "${both}"`);
        else if (!plan.pages.some((p) => Math.abs(p.stop - pm) <= 5)) bad.push(`${id} ${v}: answer moment +${pm} not in the video`);
      }
      if (hook.answer && !pages.includes(hook.answer)) bad.push(`${id} ${v}: answer "${hook.answer}" not shown`);
      for (const n of numbersIn(both)) if (n !== '24' && !pages.some((p) => p.includes(n)) && !shortName(x.label).includes(n)) bad.push(`${id} ${v}: ${n} only in the hook`);
    }
    expect(failed(bad)).toEqual([]);
  }, 240000);
});

describe('round 14: compares say their amounts, chips name the next payoff, "Same amount" only where it is fair', () => {
  const PAIRS: [string, string][] = [['cola', 'glass of water'], ['espresso', 'beer'], ['red wine', 'beer'], ['hamburger', 'cola'], ['orange juice', 'cola']];
  it('the first moment says the servings ("A typical serving each: 150 ml vs 500 ml.")', () => {
    for (const [qa, qb] of PAIRS) {
      const cp = comparePlan(run(qa)!, run(qb)!, P, 'short');
      expect(cp.plan.pages.filter((p) => p.stop === 0).some((p) => /^(A typical serving each: .+ vs .+\.|Same amount: .+ each\.)$/.test(p.text)), `${qa} vs ${qb}`).toBe(true);
    }
  });
  it('a NEXT chip names the side and a moment that side really has there, in plain words', () => {
    const bad: string[] = [];
    for (const [qa, qb] of PAIRS) for (const cut of CUTS) {
      const a = run(qa)!, b = run(qb)!, cp = comparePlan(a, b, P, cut);
      for (const f of cp.plan.frames) {
        const nx = f.next; if (!nx || nx.min >= 1440) continue;
        const [who, what] = nx.title.split(': ');
        const side = [a, b].find((x) => cmpName(x.label) === who);
        if (!side) { bad.push(`${qa} vs ${qb} ${cut}: chip "${nx.title}"`); continue; }
        const ch = side.built.story.chapters.filter((c) => c.min <= nx.min + 0.5).pop();
        const human = (t: string) => TEASE_HUMAN.find(([re]) => re.test(t))?.[1] ?? t.charAt(0).toLowerCase() + t.slice(1);
        if (!ch || human(ch.title) !== what) bad.push(`${qa} vs ${qb} ${cut}: "${nx.title}" at +${nx.min}, ${side.label} has "${ch?.title}"`);
      }
    }
    expect(failed([...new Set(bad)])).toEqual([]);
  });
  it('"Same amount" is offered for two drinks (or two foods) without alcohol and with servings within 2×', () => {
    const p = (q: string) => parseMeal(q);
    expect(sameAmountOffer(p('cola'), p('orange juice'))).toBe(true);
    expect(sameAmountOffer(p('cola'), p('glass of water'))).toBe(true);
    expect(sameAmountOffer(p('red wine'), p('beer'))).toBe(false);
    expect(sameAmountOffer(p('espresso'), p('cola'))).toBe(false);
    expect(sameAmountOffer(p('cola'), p('hamburger'))).toBe(false);
    const s = sameAs(p('glass of water')[0], p('cola')[0])!;
    expect(s[0].amountLabel).toMatch(/250 ml/);
    expect(servingsCard('250 ml', '250 ml')).toBe('Same amount: 250 ml each.');
    expect(servingsCard('1 glass · 250 ml', '330 ml')).toBe('A typical serving each: 250 ml vs 330 ml.');
  });
  it('alcohol verdicts always carry the safety line', () => {
    for (const [qa, qb] of [['red wine', 'beer'], ['beer', '2 beers'], ['beer', 'beer']]) expect(verdictOf(run(qa)!, run(qb)!)).toMatch(/Both: don’t drive\.$/);
  });
});
