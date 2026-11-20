// Phase 4j (critique 2026-11-17, research/improvements/video-critique-2026-11-17.md: the v31 samples, foods never
// tested before). Each defect class the critic found is guarded here on what the video DRAWS (the headless timeline,
// telemetry.testutil.ts: the same drawing functions and the same checkTimeline that `npm run qc:render` runs on a
// rendered video), for every item and comparison in the sweep and every cut:
//   M1 a comparison's per-serving claims name both servings, never a win the grams turn round (verdict.test.ts too);
//   M2 an end card's "Peak" is the highest value of that number the video shows (checkTimeline "peak");
//   M3 a card about blood sugar only for a side whose model has a blood sugar rise, so "Both · …" is true for both;
//   M4 the hook names the food with its first number (checkTimeline "hook names food");
//   M5 the opening's clock moves (checkTimeline "clock open"), no card repeats a title on screen ("card repeats title");
//   M6 no stretch of the story over 2 s without a card or the NEXT chip (checkTimeline "no card");
//   M7 a card that says where the food is says where the model has most of it at that minute (dominantAt).
import { describe, expect, it } from 'vitest';
import { AUDIT_CUTS, AUDIT_PROFILE, auditCompare, auditItems, auditPairs, auditSingle, type AuditItem } from './text-audit';
import { analyze, verdictOf, type Analysis } from './analyze';
import { parseMeal } from './food/parse';
import { filmCompareTimeline, filmSingleTimeline } from './telemetry.testutil';
import { checkTimeline, clockMinutes, type TeleFrame, type Timeline } from './video-telemetry';
import { dominantAt, SUGAR_CLAIM, sugarClaimTrue, urinePeak } from './video-body';
import { sweep } from './sweep.testutil';
import type { VFrame } from './video-plan';

const item = (q: string): AuditItem => { const parts = parseMeal(q); expect(parts.length, q).toBeGreaterThan(0); const x = analyze(parts, AUDIT_PROFILE); return { id: q, x, parts, vname: x.label }; };
const words = (tl: Timeline, phase?: string) => tl.frames.filter((f) => !phase || f.phase === phase).flatMap((f) => [f.card ?? '', ...(f.texts ?? []).map((b) => b.text)]).join(' ').replace(/\s+/g, ' ');

/** M7: the place a card says the food or drink mostly is ("… is mostly in your stomach.", "Most of … has been absorbed
 *  now."), as dominantAt names it; null for a card that says no place. */
const PLACE: [RegExp, string][] = [[/has been absorbed/, 'absorbed'], [/is mostly in your stomach/, 'stomach'], [/is mostly in your gut/, 'duodenum'], [/is mostly in your small intestine/, 'small'], [/is mostly in your large intestine/, 'colon']];
export const placeClaim = (card: string) => PLACE.find(([re]) => re.test(card))?.[1] ?? null;
/** Every card of a plan that says a place, against where the model has most of it at each frame it is on screen. */
function placeIssues(frames: readonly VFrame[], sides: [Analysis, Analysis?], where: string): string[] {
  const out = new Set<string>();
  for (const f of frames) {
    // (on screen: a moment's cards, and a glide's while its card is still at least half there, plateA)
    if (f.phase !== 'main' || !(f.beat === 'hold' || (f.beat === 'glide' && (f.plateA ?? 1) >= 0.5))) continue;
    ([[f.cap, sides[0]], [f.capB, sides[1]]] as const).forEach(([cap, x]) => {
      const p = cap && x ? placeClaim(cap) : null;
      if (!p || !x) return;
      const d = dominantAt(x.built, Math.min(1440, f.m));
      if (d !== p) out.add(`${where} +${Math.round(f.m)} min: "${cap}" but most of it is ${d}`);
    });
  }
  return [...out];
}

describe('phase 4j: the checks catch what the critic saw (timelines made by hand)', () => {
  it('a frozen opening, a card that repeats the headline, 3.6 s without a card, a "Peak" under what the chip showed, an unnamed meal', () => {
    const fs: TeleFrame[] = [];
    const fr = (t: number, o: Partial<TeleFrame> = {}): TeleFrame => ({ t, phase: 'main', beat: 'hold', rs: [], end: 0, ...o });
    for (let i = 0; i < 30 * 26; i++) {
      const t = i / 30;
      fs.push(fr(t, { clock: t < 8.4 ? `+0:0${Math.min(3, Math.floor(t / 2.5))}` : '+2:00', card: t < 5 ? 'FIRST SIP | 50 mg of caffeine.' : t < 7.6 ? 'FIRST SIP | 250 ml of black tea.' : t < 11.2 ? undefined : 'KIDNEYS | Your kidneys filter the extra water.',
        beat: t >= 7.6 && t < 11.2 ? 'glide' : 'hold', ...(i % 3 === 0 ? { texts: [{ x0: 0, y0: 0, x1: 10, y1: 10, text: t > 20 ? '203 ml urine' : '150 ml urine' }] } : {}) }));
    }
    for (let i = 0; i < 30 * 3.4; i++) fs.push(fr(26 + i / 30, { phase: 'outro', beat: 'end', end: 1, ...(i % 3 === 0 ? { texts: [{ x0: 0, y0: 0, x1: 10, y1: 10, text: 'Peak: 150 ml urine · 2 h in' }] } : {}) }));
    const tl: Timeline = { v: 1, kind: 'single', cut: 'short', seconds: 29.4, fps: 30, hook: 'Where does the water end up?\n250 ml of black tea.', name: 'Black tea', frames: fs };
    expect(checkTimeline(tl).map((i) => i.check)).toEqual(expect.arrayContaining(['clock open', 'card repeats title', 'no card', 'peak']));
    const meal: Timeline = { ...tl, hook: 'How far have 844 kcal gotten by tomorrow?\nOne meal: 844 kcal.', name: 'White rice + Salmon + Avocado + Cucumber' };
    expect(checkTimeline(meal).map((i) => i.check)).toContain('hook names food');
    expect(clockMinutes('+1:05')).toBe(65);
  });
});

describe('phase 4j: the critic\'s v31 videos, filmed as the app films them', () => {
  it('black tea, Shorts: the end card\'s urine peak is the urine series\' own highest value; the opening moves; no card repeats the headline', () => {
    const it0 = item('black tea'), tl = filmSingleTimeline(it0, 'short');
    expect(checkTimeline(tl)).toEqual([]);
    const up = urinePeak(it0.x.built)!, o = auditSingle(it0.x, 'short', 'A');
    expect(up).not.toBeNull();
    // (the chip never shows more than the peak; a hero that names the urine names this peak)
    const chips = [...words(tl, 'main').matchAll(/(\d+) ml urine/g)].map((m) => Number(m[1]));
    for (const v of chips) expect(v).toBeLessThanOrEqual(Math.round(up.ml) + 0.5);
    if (o.hero && /urine/.test(o.hero.big)) expect(o.hero.big).toMatch(new RegExp(`^${Math.round(up.ml)} ml urine`));
    const t0 = tl.frames.find((f) => f.phase === 'main' && f.clock)!, t3 = [...tl.frames].reverse().find((f) => f.phase === 'main' && f.clock && f.t <= t0.t + 3)!;
    expect(clockMinutes(t3.clock) - clockMinutes(t0.clock)).toBeGreaterThanOrEqual(3);
  });

  it('soft pretzel vs peanuts, long: servings named, no win the grams turn round, no "Both" blood sugar card, no "not tracked", the 24 h place is the model\'s', () => {
    const a = item('soft pretzel').x, b = item('peanuts').x, tl = filmCompareTimeline(a, b, 'long'), c = auditCompare(a, b, 'long');
    expect(checkTimeline(tl).filter((i) => i.check !== 'region cap')).toEqual([]);
    const v = verdictOf(a, b);
    expect(v).not.toMatch(/fewer kcal|wins?:/);
    expect(v).toMatch(/\(115 g\)/); expect(v).toMatch(/\(28 g\)/); expect(v).toMatch(/Per 100 g/);
    expect(c.cp.guess?.question).toMatch(/serving/);
    expect(c.cp.guess?.answer2).toMatch(/115 g vs 28 g/);
    const end = words(tl, 'outro');
    expect(end).not.toMatch(/not tracked/);
    expect(end).toMatch(/only \d+ g of carbs/);
    expect(tl.frames.filter((f) => /^BOTH ·[^|]*\| [^|]*\bblood sugar\b/i.test(f.card ?? ''))).toEqual([]);
    expect(tl.frames.filter((f) => /mostly in your large intestine/.test(f.card ?? ''))).toEqual([]);
    expect(tl.frames.filter((f) => /\| (Soft pretzel|Peanuts)\.$/.test(f.card ?? ''))).toEqual([]);
  });

  it('the rice bowl, the doughnut, prosecco and oatmeal: every check passes, the meal is named in its hook', () => {
    const cases: [string, 'long' | 'medium' | 'short'][] = [['white rice + salmon + avocado + cucumber', 'medium'], ['doughnut', 'short'], ['prosecco', 'medium'], ['oatmeal', 'long']];
    for (const [q, cut] of cases) {
      const tl = filmSingleTimeline(item(q), cut);
      expect(checkTimeline(tl).map((i) => `${q}: ${i.check}: ${i.text}`)).toEqual([]);
      expect(tl.hook).not.toMatch(/One meal/);
    }
    expect(filmSingleTimeline(item('white rice + salmon + avocado + cucumber'), 'medium').hook).toMatch(/rice/i);
  }, 120_000);
});

describe('phase 4j: every item and comparison, every cut', () => {
  it('M3: a comparison side says a blood sugar card only when its model has a blood sugar rise ("Both" only when true for both)', () => {
    const bad: string[] = [];
    for (const pr of sweep(auditPairs(auditItems(), 120))) for (const cut of AUDIT_CUTS) {
      const { cp } = auditCompare(pr.a, pr.b, cut);
      for (const f of cp.plan.frames) {
        if (f.phase !== 'main' || f.beat !== 'hold') continue;
        if (f.cap && SUGAR_CLAIM.test(f.cap) && !sugarClaimTrue(pr.a.sugarPeak)) bad.push(`${pr.id} ${cut}: ${f.cap}`);
        if (f.capB && SUGAR_CLAIM.test(f.capB) && !sugarClaimTrue(pr.b.sugarPeak)) bad.push(`${pr.id} ${cut}: ${f.capB}`);
      }
    }
    expect([...new Set(bad)].slice(0, 20)).toEqual([]);
  }, 600_000);

  it('M7: a card that says where it mostly is says where the model has most of it, at every frame it is on screen', () => {
    const bad: string[] = [];
    for (const it0 of sweep(auditItems())) for (const cut of AUDIT_CUTS) bad.push(...placeIssues(auditSingle(it0.x, cut, 'A').plan.frames, [it0.x], `${it0.id} ${cut}`));
    for (const pr of sweep(auditPairs(auditItems(), 120))) for (const cut of AUDIT_CUTS) bad.push(...placeIssues(auditCompare(pr.a, pr.b, cut).cp.plan.frames, [pr.a, pr.b], `${pr.id} ${cut}`));
    expect(bad.slice(0, 20)).toEqual([]);
  }, 600_000);

  it('M4 / M5: no hook leaves the food unnamed, no opening card says a hook line again (hooks A and B)', () => {
    const bad: string[] = [];
    for (const it0 of sweep(auditItems())) for (const v of ['A', 'B'] as const) {
      const o = auditSingle(it0.x, 'long', v);
      if (/^One (meal|drink|coffee)\b/.test(o.hook.line1) || /^One (meal|drink|coffee)\b/.test(o.hook.line2)) bad.push(`${it0.id} ${v}: ${o.hook.line1} / ${o.hook.line2}`);
      const s0 = o.stops[0]?.lines ?? [];
      const n = (s: string) => s.toLowerCase().replace(/[^a-z0-9%]+/g, ' ').trim();
      for (const l of s0) if ([o.hook.line1, o.hook.line2].some((h) => n(h) === n(l))) bad.push(`${it0.id} ${v}: card "${l}" repeats the hook`);
    }
    expect(bad.slice(0, 20)).toEqual([]);
  }, 600_000);
});
