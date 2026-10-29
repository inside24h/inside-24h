// Round 9 (2026-10-29): EVERY food and drink in the database makes a correct video, not only the 16 samples.
// The plans are built by the same code as the app (video-story.ts) from the real model (analyze), and checked for:
// readable captions, no card lingering, the length, numbers that agree with the gauges, no empty / NaN / Croatian
// text, alcohol never winning, and every frame's text inside the platforms' safe zones without overlaps.
import { describe, expect, it } from 'vitest';
import db from './food/fooddb.json';
import { parseMeal } from './food/parse';
import { analyze, type Analysis } from './analyze';
import { DEFAULT_PROFILE, type Profile } from '../science/profile';
import { chapterText } from './stories';
import { hookFor, hookForCompare } from './video-hook';
import { CMP_REPEAT_S, FPS, LENGTH, READ, readSeconds, type Plan, type PlanFx } from './video-plan';
import { numberConflict } from './video-beats';
import { worstMoment } from './status';
import { beatCtx, cmpName, plainLatin, comparePlan, gaugesAt, peakOf, shortName, singlePlan, singleStops } from './video-story';
import { drawCmpFrame, drawFrame, logText, SAFE, SIZE, type CmpOverlay, type Light, type Overlay, type TextBox } from './share';

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

function singlePlanOf(x: Analysis, cut: 'long' | 'short', p: Profile = P) {
  const b = x.built, story = b.story, name = shortName(x.label);
  const stops = singleStops(story, beatCtx(name, b, p.drinkAtMin));
  const hook = hookFor({ name, chapters: story.chapters.map((c) => ({ min: c.min, title: c.title, text: chapterText(c, c.min) })),
    alcohol: (b.alcoholG ?? 0) > 1, caffeine: b.caffeine.doseMg >= 10, solid: /bite/i.test(story.chapters[0]?.title ?? ''), kcal: b.energy.total,
    pace: b.pace ? { doses: b.pace.doses, round: 'drink' } : undefined, caffeineMg: b.caffeine.doseMg });
  const payoff = hook.payoff ? story.chapters.find((c) => c.title === hook.payoff)?.min : undefined;
  const fx: PlanFx = { peakMin: peakOf(b, x.glucose !== undefined), payoffMin: payoff, drinkAtMin: p.drinkAtMin, wakeMin: p.wakeMin,
    lights: x.systems.map((s) => s.levels[worstMoment(s)] as 0 | 1 | 2), heart: x.systems.find((s) => s.key === 'heart')?.levels };
  return { plan: singlePlan(stops, cut, fx), hook, stops };
}

/** Checks every plan shares: readable, no lingering, the length, real words. */
function checkPlan(plan: Plan, cut: 'long' | 'short', label: string, bad: string[], gaugeAt: (m: number) => string[]) {
  const lim = LENGTH[cut];
  if (!(plan.seconds >= (cut === 'long' ? 61.5 : lim.min) && plan.seconds <= lim.max + 0.5)) bad.push(`${label}: length ${plan.seconds.toFixed(1)} s`);
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
  for (const f of plan.frames) { textOk(f.cap, `${label} frame`, bad); if (f.next) textOk(f.next.title, `${label} next`, bad); if (!Number.isFinite(f.m) || !Number.isFinite(f.t)) { bad.push(`${label}: NaN frame`); break; } }
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
  for (const cut of ['long', 'short'] as const) {
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
    for (const [q, over, h] of cases) for (const cut of ['long', 'short'] as const) {
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
  for (const cut of ['long', 'short'] as const) it(`compare · ${cut}: readable, no lingering card, alcohol never wins, text in the safe zone`, () => {
    const bad: string[] = [];
    for (const [qa, qb] of PAIRS) {
      const a = run(qa), b = run(qb), label = `${qa} vs ${qb} ${cut}`;
      if (!a || !b) { bad.push(`${label}: no model`); continue; }
      const cp = comparePlan(a, b, P, cut === 'short');
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
