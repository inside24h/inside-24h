// Phase 3 (master audit C13): a Short must not skip the middle of the day. Before, most Shorts of solid food ended
// their story around the first hour and glided straight to 24 h while the model's story had a moment in between (a
// pizza: +1:08 → 24 h, the large intestine never shown). Now one moment of the model's own story from inside that
// stretch comes in (the large intestine first) when the Short still fits in 30 s.
import { describe, expect, it } from 'vitest';
import db from './food/fooddb.json';
import { parseMeal } from './food/parse';
import { analyze, type Analysis } from './analyze';
import { DEFAULT_PROFILE, type Profile } from '../science/profile';
import { chapterText } from './stories';
import { hookFor } from './video-hook';
import { whereCard } from './video-body';
import { beatCtx, applyHook, climaxFx, payoffMinOf, surgeOf, surpriseOf, decafOf, shortName, singlePlan, singleStops } from './video-story';
import { worstMoment } from './status';
import { MID_GAP_MIN } from './video-plan';

type Food = { id: string; name: string; aliases?: string[]; variants?: { v: string; name: string }[] };
const P: Profile = { ...DEFAULT_PROFILE };
const run = (q: string): Analysis | null => { const parts = parseMeal(q); return parts.length ? analyze(parts, P) : null; };
function shortOf(x: Analysis) {
  const b = x.built, story = b.story, name = shortName(x.label);
  const ch = story.chapters.map((c) => ({ min: c.min, title: c.title, text: chapterText(c, c.min) }));
  const hin = { name, chapters: ch, alcohol: (b.alcoholG ?? 0) > 1, caffeine: b.caffeine.doseMg >= 10, solid: /bite/i.test(story.chapters[0]?.title ?? ''), kcal: b.energy.total, caffeineMg: b.caffeine.doseMg, surprise: surpriseOf(x.label, x.sugarPeak, P), decaf: decafOf(x.label, b, P) };
  const hook = hookFor(hin);
  const stops = applyHook(singleStops(story, beatCtx(name, b, P.drinkAtMin), (m) => whereCard(b, m)), hook, (b.alcoholG ?? 0) > 1 ? 0 : b.caffeine.doseMg);
  const fx = { ...climaxFx(b, x.glucose !== undefined, ch, hook), payoffMin: payoffMinOf(stops, hook), drinkAtMin: P.drinkAtMin, wakeMin: P.wakeMin, lights: x.systems.map((s) => s.levels[worstMoment(s)] as 0 | 1 | 2), heart: x.systems.find((s) => s.key === 'heart')?.levels, surge: surgeOf(b, x.glucose !== undefined) };
  return { plan: singlePlan(stops, 'short', fx), stops, solid: hin.solid };
}
/** A stretch of 10 h or more the Short glides through with nothing said, although its story has a moment inside it. */
function gapSkipped(plan: { stops: number[] }, stops: { min: number }[]) {
  const ms = plan.stops;
  for (let i = 1; i < ms.length; i++) if (ms[i] - ms[i - 1] >= MID_GAP_MIN && stops.some((s) => s.min >= ms[i - 1] + 60 && s.min <= ms[i] - 60)) return `${ms[i - 1]}→${ms[i]}`;
  return null;
}
/** The middle of the day (+4 h to +20 h): the story has a moment there, the Short shows none. */
const MID = (m: number) => m >= 240 && m <= 1200;
const skipped = (plan: { stops: number[] }, stops: { min: number }[]) => (stops.some((s) => MID(s.min)) && !plan.stops.some(MID) ? 'no middle' : null);

describe('C13: Shorts keep a moment from the middle of the day', () => {
  it('pizza: the large intestine is in the Short, and it stays within 30 s', () => {
    const { plan, stops } = shortOf(run('pizza')!);
    expect(plan.seconds).toBeLessThanOrEqual(30 + 1e-6);
    const li = stops.find((s) => /large intestine/i.test(s.title))!;
    expect(plan.stops).toContain(li.min);
    expect(skipped(plan, stops)).toBeNull();
  });
  it('the whole database: the Shorts show the middle of the day when the story has one, none over 30 s', () => {
    const items = (db as unknown as Food[]).flatMap((f) => [[f.name, f.aliases?.[0] ?? f.id], ...(f.variants ?? []).map((v) => [v.name])]);
    let n = 0, skip = 0, skipSolid = 0, gaps = 0; const long: string[] = [];
    for (const q of items) {
      const x = run(q[0]) ?? (q[1] ? run(q[1]) : null); if (!x) continue;
      const { plan, stops, solid } = shortOf(x); n++;
      if (plan.seconds > 30 + 1e-6) long.push(`${q[0]} ${plan.seconds.toFixed(2)} s`);
      if (skipped(plan, stops)) { skip++; if (solid) skipSolid++; }
      if (gapSkipped(plan, stops)) gaps++;
    }
    console.log(`[C13] ${n} Shorts: ${skip} without a middle moment (${skipSolid} solid); ${gaps} still glide 10 h or more past a moment`);
    expect(long).toEqual([]);
    expect(n).toBeGreaterThan(200);
    // (measured 2026-11-13: before 54 of 261 had no middle moment, 49 of them solid food; after 11, 8 solid. The rest
    // cannot fit the large intestine in 30 s next to their peak and payoff. Other stories end at their payoff, round 5.)
    expect(skipSolid).toBeLessThan(10);
    expect(skip).toBeLessThanOrEqual(12);
  }, 120000);
});
