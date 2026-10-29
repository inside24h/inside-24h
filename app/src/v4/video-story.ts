// Round 9 (2026-10-29): what a video says, as pure functions (moved out of AppV4.tsx unchanged, so the app and the
// tests build the SAME plan for any food or drink in the database: video-story.test.ts runs every one of them).
import { minutesFromU, uFromMinutes } from '../time';
import type { Profile } from '../science/profile';
import { chapterText } from './stories';
import { beatLines, type BeatCtx } from './video-beats';
import { chooseGuess, guessSideOf, type Guess } from './video-guess';
import { planCompare, planVideo, SURGE_FROM, type Cut, type Plan, type PlanFx, type StopIn, type SurgeKind } from './video-plan';
import { mainGauge, whereGauge, type BuiltLike } from './video-body';
import { worstMoment } from './status';
import { verdictOf, type Analysis } from './analyze';
import type { PinnedGauge } from './share';

export const CMP_STOPS = [0, 20, 45, 90, 180, 360, 720, 1440]; // (round 6: the first minutes in one moment, so each side's stomach fact is never dropped with a short early stop)
export const CMP_SHORT = [0, 20, 90, 240, 720, 1440]; // 2026-10-24: the planner keeps what fits in 30 s; long gaps glide slower (video-plan moveS)

/** The video's short name: no grams in brackets; a long name keeps its first part ("A whole pizza with extra
 *  cheese, ham and mushrooms" → "A whole pizza"); the end card has the full name. */
/** Round 9: on screen in plain American spelling ("Ćevapi" → "Cevapi"). */
export const plainLatin = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
export const shortName = (n: string) => { const s = plainLatin(n).replace(/\s*\([^)]*\)/g, ''); return s.split(/\s+/).length > 5 && / with /.test(s) ? s.slice(0, s.indexOf(' with ')) : s; };
/** The comparison's name for a side (round 5): the amount moves to its own line ("330 ml of water" → "Water"). */
export const cmpName = (label: string) => { const s = plainLatin(label).replace(/^\d+(?:[.,]\d+)?\s*(?:ml|g|l|cl)\s+of\s+/i, ''); return s.charAt(0).toUpperCase() + s.slice(1); };

/** What the caption cards need to know (video-beats.ts): the short name, and the pacing as the model doses it. */
export function beatCtx(name: string, built: { pace?: { doses: number; overMin: number; everyMin: number }; story: { chapters: { title: string }[] }; caffeine?: { doseMg: number }; bac?: ArrayLike<number>; alcoholG?: number }, drinkAtMin?: number): BeatCtx {
  const last = built.story.chapters.find((c) => /^Last (drink|serving|round)$/.test(c.title));
  // (round 6: the blood alcohol peak, so "gone" is said from the gauge's own range)
  let pk = 0, pm = 0; if (built.bac && (built.alcoholG ?? 0) > 1) for (let m = 0; m <= Math.min(1440, built.bac.length - 1); m++) if (built.bac[m] > pk) { pk = built.bac[m]; pm = m; }
  return { name, pace: built.pace ? { ...built.pace, round: last ? last.title.split(' ')[1] : 'round' } : undefined,
    caffeineMg: built.caffeine && built.caffeine.doseMg >= 10 ? built.caffeine.doseMg : undefined, drinkAtMin,
    ...(pk > 0.01 ? { bacPeak: { g: pk, min: pm }, alcoholG: built.alcoholG } : {}) };
}

/** The minute of the main gauge's peak (alcohol, else a clear blood sugar rise, else caffeine), as mainGauge chooses:
 *  the video's cold open and its impact (2026-10-24 creative spec §2.2, §2.5). */
export type PeakIn = { bac?: Float64Array; alcoholG?: number; effects: { glucoseMgDl?: Float64Array }; caffeine: { doseMg: number; body: Float64Array } };
export function peakOf(b: PeakIn, sugarKnown: boolean): number | undefined {
  const arg = (sr: Float64Array) => { let bi = 0; for (let i = 1; i <= Math.min(1440, sr.length - 1); i++) if (sr[i] > sr[bi]) bi = i; return bi; };
  if ((b.alcoholG ?? 0) > 1 && b.bac) return arg(b.bac);
  const g = sugarKnown ? b.effects.glucoseMgDl : undefined;
  if (g && arg(g) > 0 && g[arg(g)] / 18.016 >= 0.5) return arg(g);
  if (b.caffeine.doseMg >= 20) return arg(b.caffeine.body);
  return undefined;
}

/** Round 10: the bloodstream surge. The same substance as peakOf (alcohol, else a clear sugar rise, else caffeine),
 *  and the stretch of the day while its model level climbs from a quarter of its peak to the peak (the video picks
 *  the first free second in it). Picture and sound only
 *  (no words, no number), so it can never disagree with the gauge. */
export function surgeOf(b: PeakIn, sugarKnown: boolean): { min: number; max: number; kind: SurgeKind } | undefined {
  const g = sugarKnown ? b.effects.glucoseMgDl : undefined, gMax = g ? Math.max(...Array.from(g.subarray(0, 1441))) : 0;
  const pick: [Float64Array, SurgeKind] | undefined = (b.alcoholG ?? 0) > 1 && b.bac ? [b.bac, 'alcohol']
    : g && gMax / 18.016 >= 0.5 ? [g, 'sugar'] // (peakOf's "clear rise": at least 0.5 mmol/L)
      : b.caffeine.doseMg >= 20 ? [b.caffeine.body, 'caffeine'] : undefined;
  if (!pick) return undefined;
  const [sr, kind] = pick, end = Math.min(1440, sr.length - 1);
  let pm = 0; for (let i = 1; i <= end; i++) if (sr[i] > sr[pm]) pm = i;
  if (!(sr[pm] > 0) || pm < 2) return undefined;
  for (let m = 1; m <= pm; m++) if (sr[m] >= SURGE_FROM * sr[pm]) return { min: m, max: pm, kind };
  return undefined;
}

/** Where the drink is + the number that matters, at minute m (where is left out when it says the same). */
export function gaugesAt(b: BuiltLike, m: number, unit: Profile['glucoseUnit'], sugarKnown: boolean): PinnedGauge[] {
  const main = mainGauge(b, m, uFromMinutes(Math.min(1440, m)), unit, sugarKnown);
  // one number per thing (round 5, critic: "4.8 g sugar · Blood" next to "Blood sugar up"): no sugar where-gauge
  // while the blood sugar gauge is up
  // (round 7: never a "g sugar" gauge in a video whose blood sugar curve is known, even in a dip or between peaks)
  const w0 = whereGauge(b, m), where = w0 && (main?.organ === 'pancreas' || (sugarKnown && !!b.effects.glucoseMgDl)) && /sugar/.test(w0.big) ? null : w0;
  // the same number twice (blood alcohol in "Blood", caffeine in "Blood"): only the main gauge
  const num = (s: string) => /[\d.,–]+/.exec(s)?.[0] ?? s;
  const same = !!main && !!where && ((/alcohol|BAC/.test(main.small) && /‰|BAC/.test(where.big)) || num(where.big) === num(main.big));
  return [where && !same ? where : null, main].filter((g): g is NonNullable<typeof g> => !!g);
}

type ChapterLike = { min: number; title: string; text: string; live?: (m: number) => string; focus?: string | null };
/** The single video's moments: every chapter's words at its own minute and its caption cards. */
export function singleStops(story: { chapters: ChapterLike[] }, ctx: BeatCtx): StopIn[] {
  // (round 9: a card is said once per video; "Fat takes a slower route, via the lymph." ended one moment and began
  // the next, 9 s in a row, for every fatty food)
  const seen = new Set<string>();
  return story.chapters.filter((c) => c.min === 0 || c.min >= 1).map((c) => {
    const text = chapterText(c as never, c.min), all = beatLines({ min: c.min, title: c.title, text }, ctx);
    const fresh = all.filter((l) => !seen.has(l));
    for (const l of all) seen.add(l);
    return { min: c.min, title: c.title, text, lines: fresh.length ? fresh : all };
  });
}

export interface ComparePlan { plan: Plan; guess: Guess | null; race: { a: Float32Array; b: Float32Array } | null; fx: PlanFx; verdict: string }
/** The comparison video's plan (2026-10-23 split screen; rounds 4-8): the guess, each side's cards per moment, the
 *  moments that say something new, and the plan for them. */
export function comparePlan(a: Analysis, b: Analysis, profile: Profile, cutIn: boolean | Cut): ComparePlan {
  // (round 11: a cut, or the old flag: true = short)
  const cut: Cut = typeof cutIn === 'boolean' ? (cutIn ? 'short' : 'long') : cutIn, shortVid = cut === 'short';
  // each side's words at each moment (as on screen); planCompare sets the reading times and the length
  const chap = (x: Analysis, at: number) => x.built.story.chapters.reduce((acc, c) => (at + 1e-6 >= c.min ? c : acc), x.built.story.chapters[0]);
  const cards = (x: Analysis, at: number) => { const c = chap(x, at); return beatLines({ min: c.min, title: c.title, text: chapterText(c, c.min) }, { ...beatCtx(shortName(x.label), x.built, profile.drinkAtMin), factsFirst: true }); };
  // the game's facts from the model (spec §3.3): the race out of the stomach, the peak, the lights, the verdict
  // round 4: the question this pair answers clearly (out of the stomach / out of the blood / bigger sugar rise),
  // or none; its race bars and its answer come from the same model
  const bedMin = ((((profile.bedtimeMin - profile.drinkAtMin) % 1440) + 1440) % 1440);
  const gq = chooseGuess(guessSideOf(a, cmpName(a.label)), guessSideOf(b, cmpName(b.label)), { bedMin });
  const race = gq && gq.kind !== 'bedtime' ? { a: gq.progress[0], b: gq.progress[1] } : null; // (no race for "still in you at bedtime")
  const worst = (x: Analysis) => x.systems.map((s) => s.levels[worstMoment(s)] as 0 | 1 | 2);
  const wa = worst(a), wb = worst(b), verdictNow = verdictOf(a, b, profile.glucoseUnit);
  const nonAlc = [a, b].filter((x) => (x.built.alcoholG ?? 0) <= 1), pk = [...nonAlc, a, b].map((x) => peakOf(x.built, x.glucose !== undefined)).find((x) => x !== undefined);
  // the impact lands on the answer when there is a guess (the moment the race is decided), else on the peak
  const hit = gq ? Math.round(gq.decidedMin) : pk;
  // round 10: the bloodstream surge on the first side that has one (the same order as the peak: no alcohol first)
  const sg = ([...nonAlc, a, b].map((x) => { const s = surgeOf(x.built, x.glucose !== undefined); return s && { ...s, side: (x === a ? 0 : 1) as 0 | 1 }; })).find((x) => !!x);
  const fx: PlanFx = { calmDay: [a, b].some((x) => (x.built.alcoholG ?? 0) > 1), surge: sg, peakMin: hit, teaserMin: hit, drinkAtMin: profile.drinkAtMin, wakeMin: profile.wakeMin, verdict: true, verdictTrophy: /^🏆/.test(verdictNow),
    lights: wa.flatMap((l, i) => [l, wb[i] ?? 0]).slice(0, 8), race: gq && gq.kind !== 'sugar' && gq.kind !== 'bedtime' ? race ?? undefined : undefined,
    heart: (() => { const ha = a.systems.find((s) => s.key === 'heart')?.levels, hb = b.systems.find((s) => s.key === 'heart')?.levels; return ha && hb ? Uint8Array.from(ha, (v, i) => Math.max(v, hb[i] ?? 0)) : undefined; })() };
  // the peak gets a moment of its own (its impact lands when both bodies are there)
  const cmpMins0 = [...new Set([...(shortVid ? CMP_SHORT : CMP_STOPS), ...(hit !== undefined && hit > 0 ? [hit] : [])])].sort((x, y) => x - y);
  // round 6 (critic: water showed one card for 28 s, and the same kidney cards ran 13 s at +24:00): each side says
  // what is NEW since the last moment (every chapter passed on the way, in order), else the next cards of the
  // chapter it is in; a moment with nothing new on either side is left out (the 24 h beat still ends the day)
  const perStop = shortVid ? 1 : 2;
  const sideCards = (x: Analysis, mins: number[]) => {
    let prev = -1, seen = 0, lastLines: string[] = [], lastCh: unknown = null;
    return mins.map((at) => {
      const fresh0 = x.built.story.chapters.filter((c) => c.min > prev && c.min <= at && (c.min === 0 || c.min >= 1));
      // the chapter of this moment first (what is true NOW), then the ones passed on the way; in a stomach race
      // the stomach chapter leads (it is the game's fact)
      const rank = (c: typeof fresh0[number]) => (gq?.kind === 'stomach' && /stomach/i.test(c.title) ? 0 : c === fresh0[fresh0.length - 1] ? 1 : 2);
      // round 7 (critic B2: a bedtime card showed at +24:00 under KIDNEYS): only the chapter of this moment (and,
      // in a stomach race, the stomach chapter), so a card is never shown under another moment's title or time
      const fresh = fresh0.map((c, i) => ({ c, i })).sort((p, q) => rank(p.c) - rank(q.c) || p.i - q.i).map((p) => p.c).filter((c) => rank(c) < 2);
      prev = at;
      if (fresh.length) {
        const lines = fresh.flatMap((c) => cards(x, c.min));
        lastLines = lines; seen = Math.min(lines.length, perStop); lastCh = fresh0[fresh0.length - 1];
        return { lines, title: fresh[0].title, text: chapterText(fresh[0], fresh[0].min), isNew: true };
      }
      const c = chap(x, at);
      const rest = lastCh === c ? lastLines.slice(seen) : [];
      seen = Math.min(lastLines.length, seen + perStop);
      // (round 8: nothing new = this side is quiet, never the same card again under a later moment)
      return { lines: rest.length ? rest : lastCh === c ? [''] : cards(x, c.min).slice(-1), title: c.title, text: chapterText(c, at), isNew: rest.length > 0 };
    });
  };
  // (the planner may leave moments out to fit: the words are then worked out again for the moments it kept, so
  // nothing a left-out moment would have said is lost; twice is enough)
  const build = (mins0: number[]) => {
    const sa = sideCards(a, mins0), sb = sideCards(b, mins0);
    const keepAt = mins0.map((at, i) => i === 0 || at === hit || sa[i].isNew || sb[i].isNew);
    const mins = mins0.filter((_m, i) => keepAt[i]);
    const pick = <T,>(xs: T[]) => xs.filter((_x, i) => keepAt[i]);
    const SA = pick(sa), SB = pick(sb);
    return planCompare(mins.map((at, i) => ({ min: at, a: SA[i].text, b: SB[i].text, titleA: SA[i].title, titleB: SB[i].title, linesA: SA[i].lines, linesB: SB[i].lines })),
      cut, uFromMinutes, minutesFromU, fx);
  };
  let used = cmpMins0, plan = build(used);
  for (let k = 0; k < 3; k++) { const kept = cmpMins0.filter((m) => plan.stops.includes(m)); if (kept.length === used.length) break; used = kept; plan = build(used); }
  return { plan, guess: gq, race, fx, verdict: verdictNow };
}

/** The single video's plan inputs (AppV4 reelPlan) from a model run. */
export function singlePlan(stops: StopIn[], cut: Cut, fx: PlanFx): Plan {
  return planVideo(stops, cut, uFromMinutes, minutesFromU, fx);
}
