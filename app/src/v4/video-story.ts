// Round 9 (2026-10-29): what a video says, as pure functions (moved out of AppV4.tsx unchanged, so the app and the
// tests build the SAME plan for any food or drink in the database: video-story.test.ts runs every one of them).
import { minutesFromU, uFromMinutes } from '../time';
import type { Profile } from '../science/profile';
import { chapterText } from './stories';
import { beatLines, eventMin, tooEarly, type BeatCtx } from './video-beats';
import { chooseGuess, guessSideOf, type Guess } from './video-guess';
import { DULL, planCompare, planVideo, stopValue, SURGE_FROM, TEASE_HUMAN, type Cut, type Plan, type PlanFx, type StopIn, type SurgeKind } from './video-plan';
import { mainGauge, whereGauge, type BuiltLike } from './video-body';
import { worstMoment } from './status';
import { analyze, verdictOf, type Analysis } from './analyze';
import { parseMeal } from './food/parse';
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

/** Round 12 (critic P0-3: crepes had no climax at all): the video's climax. The model's peak (peakOf) when there is
 *  one; else the story's most telling later moment, so every video has its impact and a clock that goes somewhere:
 *  a peak, the blood fat high, a dip, the large intestine, bedtime, then the most telling moment left. */
export const CLIMAX_TITLES = /peak|highest|Fat in your blood|dip|large intestine|Alcohol gone|Bedtime|Going to bed/i;
export function climaxOf(b: PeakIn, sugarKnown: boolean, chapters: { min: number; title: string; text?: string }[]): number | undefined {
  const p = peakOf(b, sugarKnown);
  if (p !== undefined) return p;
  const later = chapters.filter((c) => c.min >= 5 && c.min < 1440 && !DULL.test(c.title.trim()));
  const named = later.find((c) => CLIMAX_TITLES.test(c.title));
  if (named) return named.min;
  let best: (typeof later)[number] | undefined;
  for (const c of later) if (!best || stopValue({ min: c.min, title: c.title, text: c.text ?? '' }) > stopValue({ min: best.min, title: best.title, text: best.text ?? '' })) best = c;
  return best?.min;
}

/** Round 13 (critic P1-5: oat milk had a generic hook, though its GI is 69 against cow's milk's ~30): surprising facts
 *  the model itself shows, a drink against the thing people think it is like. Said only when the model's blood sugar
 *  peak is clearly higher (≥ 0.5 mmol/L and ≥ 30 % more), for the same profile. */
export const SURPRISE: [RegExp, string, string][] = [
  [/\boat milk\b/i, 'glass of milk', 'cow’s milk'], [/\brice milk\b/i, 'glass of milk', 'cow’s milk'],
  [/\borange juice\b/i, '1 orange', 'a whole orange'], [/\bapple juice\b/i, '1 apple', 'a whole apple'],
];
export function surpriseOf(label: string, sugarPeak: number | null, profile: Profile): { than: string; ratio: number } | undefined {
  const hit = SURPRISE.find(([re]) => re.test(label));
  if (!hit || sugarPeak === null) return undefined;
  const parts = parseMeal(hit[1]); if (!parts.length) return undefined;
  const ref = analyze(parts, profile);
  if (ref.sugarPeak === null) return undefined;
  return sugarPeak - ref.sugarPeak >= 0.5 && sugarPeak >= 1.3 * Math.max(0.01, ref.sugarPeak) ? { than: hit[2], ratio: sugarPeak / Math.max(0.01, ref.sugarPeak) } : undefined;
}

/** Round 14 (critic DC-1: decaf had no story, two 10 s stretches without a word): decaf's own caffeine, from the
 *  model, against the same serving of the regular drink, and the minute its (small) caffeine level peaks. */
export function decafOf(label: string, b: { caffeine: { doseMg: number; body: Float64Array } }, profile: Profile): { mg: number; regularMg: number; min: number } | undefined {
  if (!/\bdecaf/i.test(label) || !(b.caffeine.doseMg > 0)) return undefined;
  const parts = parseMeal(label.replace(/\bdecaf(?:feinated)?\s*/i, '')); if (!parts.length) return undefined;
  const reg = analyze(parts, profile).built.caffeine.doseMg;
  if (!(reg > 10 * b.caffeine.doseMg)) return undefined;
  let pk = 1; for (let m = 1; m <= Math.min(1440, b.caffeine.body.length - 1); m++) if (b.caffeine.body[m] > b.caffeine.body[pk]) pk = m;
  return { mg: b.caffeine.body[pk], regularMg: reg, min: Math.max(5, Math.min(240, pk)) }; // (round 15: the gauge's own number)
}

/** Round 14 (critic: every hook question is answered on screen): the hook's own moment (decaf's caffeine) joins the
 *  story, and its answer card is said first at the payoff moment, which is then never left out. */
export function applyHook(stops: StopIn[], hook: { payoff?: string; payoffMin?: number; answer?: string; lead?: string; extra?: { min: number; title: string; lines: string[] } }): StopIn[] {
  let out = stops.map((s) => ({ ...s, lines: s.lines ? [...s.lines] : undefined }));
  // the hook's number is said right after the name, on the first moment
  const s0 = out[0];
  if (hook.lead && s0) { const ls = (s0.lines ?? []).filter((l) => l !== hook.lead); s0.lines = [...ls.slice(0, 1), hook.lead, ...ls.slice(1)]; }
  if (hook.extra) {
    const near = out.find((s) => Math.abs(s.min - hook.extra!.min) <= 5 && s.min > 0);
    if (near) near.lines = [...hook.extra.lines, ...(near.lines ?? []).filter((l) => !hook.extra!.lines.includes(l))];
    else out = [...out, { min: hook.extra.min, title: hook.extra.title, text: hook.extra.lines.join(' '), lines: [...hook.extra.lines], keep: true }].sort((x, y) => x.min - y.min);
  }
  const at = payoffMinOf(out, hook);
  const st = at === undefined ? undefined : out.find((s) => s.min === at) ?? out.find((s) => Math.abs(s.min - at) <= 5 && s.min > 0);
  if (st) { st.keep = true; if (hook.answer) st.lines = [hook.answer, ...(st.lines ?? []).filter((l) => l !== hook.answer)]; }
  return out;
}
/** The minute of the hook's payoff: its own moment, or the chapter it names. */
export function payoffMinOf(stops: { min: number; title: string }[], hook: { payoff?: string; payoffMin?: number }): number | undefined {
  if (hook.payoffMin !== undefined) return hook.payoffMin;
  return hook.payoff ? stops.find((s) => s.title === hook.payoff)?.min : undefined;
}

/** Round 13 (critic P0-2: salmon kept 3 cards for 40 s): a story-moment climax (no model peak) is not pulled to the
 *  first 15 s, which would leave out every moment before it; it lands by CLIMAX_BY_S. */
export const CLIMAX_BY_S = 40;
export const climaxFx = (b: PeakIn, sugarKnown: boolean, chapters: { min: number; title: string; text?: string }[], hook?: { extra?: { min: number } }) => {
  // (round 15, critic D-1: decaf's climax was the urine): the hook's own moment (decaf's caffeine) is the climax
  if (hook?.extra) return { peakMin: hook.extra.min, peakByS: CLIMAX_BY_S };
  // (round 15, critic N-1: cola's hero said 26 min, its lamp and its PEAK moment 20 min): a sugar climax is the
  // "Blood sugar peak" moment itself, the one minute the video, the gauge, the lamp and the hero all use
  const p = peakOf(b, sugarKnown), alc = (b.alcoholG ?? 0) > 1 && !!b.bac, sugarIsPeak = !alc && p !== undefined && p === peakOfSugar(b);
  const sugarMoment = sugarIsPeak ? chapters.find((c) => /^(Blood sugar peak|Sugar rises)$/.test(c.title))?.min : undefined;
  return { peakMin: sugarMoment ?? climaxOf(b, sugarKnown, chapters), ...(p === undefined ? { peakByS: CLIMAX_BY_S } : {}) };
};
/** The minute of the sugar curve's top (for climaxFx, which then prefers the story's own moment). */
const peakOfSugar = (b: PeakIn) => { const g = b.effects.glucoseMgDl; if (!g) return undefined; let k = 0; for (let i = 1; i <= Math.min(1440, g.length - 1); i++) if (g[i] > g[k]) k = i; return k; };

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
export function singleStops(story: { chapters: ChapterLike[] }, ctx: BeatCtx, where?: (m: number) => string | null): StopIn[] {
  // (round 9: a card is said once per video; "Fat takes a slower route, via the lymph." ended one moment and began
  // the next, 9 s in a row, for every fatty food)
  const seen = new Set<string>();
  // (round 14: the swallow, "Down the food pipe", adds its card to the first moment, used when there is room)
  const pipe = story.chapters.find((c) => c.min > 0 && c.min < 1);
  // (round 15, critic P2-K: never its bare title "Down the food pipe" as a card, only a sentence)
  const pipeLines = (pipe ? beatLines({ min: pipe.min, title: pipe.title, text: chapterText(pipe as never, pipe.min) }, ctx) : []).filter((l) => /[.!?]$/.test(l));
  const sparse = story.chapters.filter((c) => c.min >= 1).length < 8;
  const base: StopIn[] = story.chapters.filter((c) => c.min === 0 || c.min >= 1).map((c) => {
    const text = chapterText(c as never, c.min), all = beatLines({ min: c.min, title: c.title, text }, ctx);
    const fresh = all.filter((l) => !seen.has(l));
    for (const l of all) seen.add(l);
    const ls = fresh.length ? fresh : all;
    // (round 15: a sparse story also says where most of it is, after its own cards, used only when there is room)
    const w = sparse && c.min >= 1 && where ? where(c.min) : null;
    const ls2 = w && !ls.includes(w) && !seen.has(w) ? (seen.add(w), [...ls, w]) : ls;
    return { min: c.min, title: c.title, text, lines: c.min === 0 ? [...ls2, ...pipeLines.filter((l) => !ls2.includes(l))] : ls2 };
  });
  // round 12 (critic P0-3): a card that speaks of a later minute ("Half has moved on after 116 minutes.") is said when
  // the clock gets there, as its own moment under the same title (never while the clock still stands at +0:01)
  const out: StopIn[] = [];
  for (const s of base) {
    const now = (s.lines ?? []).filter((l) => !tooEarly(l, s.min)), later = (s.lines ?? []).filter((l) => tooEarly(l, s.min));
    out.push({ ...s, lines: now.length ? now : (s.lines ?? []).slice(0, 1) });
    for (const l of now.length ? later : later.slice(1)) {
      const at = Math.min(1439, Math.round(eventMin(l)!));
      const near = out.find((x) => Math.abs(x.min - at) <= 5) ?? base.find((x) => Math.abs(x.min - at) <= 5 && x !== s);
      if (near && out.includes(near)) near.lines = [...(near.lines ?? []), l];
      else out.push({ min: at, title: s.title, text: l, lines: [l] });
    }
  }
  return out.sort((a, b) => a.min - b.min);
}

export interface ComparePlan { plan: Plan; guess: Guess | null; race: { a: Float32Array; b: Float32Array } | null; fx: PlanFx; verdict: string }
/** The comparison video's plan (2026-10-23 split screen; rounds 4-8): the guess, each side's cards per moment, the
 *  moments that say something new, and the plan for them. */
/** Round 14 (owner decision): a comparison says its amounts early: "A typical serving each: 150 ml vs 500 ml." (or
 *  "Same amount: 330 ml each."), from each side's serving text ("1 glass · 250 ml" → "250 ml"). */
export function servingsCard(sa: string, sb: string): string {
  const amt = (s: string) => /(\d+(?:[.,]\d+)?\s*(?:ml|g|l|cl))\b/i.exec(s.split('·').pop() ?? s)?.[1] ?? s.trim();
  const x = amt(sa), y = amt(sb);
  return x === y ? `Same amount: ${x} each.` : `A typical serving each: ${x} vs ${y}.`;
}
/** Round 15: a NEXT chip's words fit the chip ("NEXT · +0:20 · " + these, ≤ 900 px). */
export const CHIP_MAX = 34;
export const CHIP_SHORT: [RegExp, string][] = [[/sugar peak|blood sugar/i, 'sugar peak'], [/alcohol peak/i, 'alcohol peak'], [/peak/i, 'its peak'], [/dip|crash/i, 'sugar dip'],
  [/going to bed|bedtime/i, 'bedtime'], [/morning/i, 'next morning'], [/gone/i, 'all gone'], [/large intestine/i, 'large intestine'], [/24 hours/i, '24 hours later']];
/** Round 13: the comparison's answer is revealed no earlier than this share of the video. */
export const REVEAL_FROM = 0.55;
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
    lights: wa.flatMap((l, i) => [l, wb[i] ?? 0]).slice(0, 8), race: gq && gq.kind !== 'sugar' && gq.kind !== 'bedtime' && gq.kind !== 'alcohol' && gq.kind !== 'sugarG' ? race ?? undefined : undefined,
    heart: (() => { const ha = a.systems.find((s) => s.key === 'heart')?.levels, hb = b.systems.find((s) => s.key === 'heart')?.levels; return ha && hb ? Uint8Array.from(ha, (v, i) => Math.max(v, hb[i] ?? 0)) : undefined; })() };
  // the peak gets a moment of its own (its impact lands when both bodies are there)
  // round 12 (critic P0-2: both sides said "peaks now" at +1:30, the singles peak at +0:43 / +0:48): each side's own
  // peak moment (its story's peak chapter, as in its single video) is a moment of the comparison, kept by the planner;
  // the regular moments within 8 minutes of a peak make room for it
  // (round 13, critic P1-3: wine vs beer skipped "Alcohol gone", the one moment that answers which clears first)
  const peaksOf = (x: Analysis) => x.built.story.chapters.filter((c) => c.min > 0 && /peak|Alcohol gone/i.test(c.title)).map((c) => c.min);
  const sidePeaks = [...new Set([...peaksOf(a), ...peaksOf(b)])].filter((m) => m < 1440);
  const base = (shortVid ? CMP_SHORT : CMP_STOPS).filter((m) => m === 0 || m >= 1440 || !sidePeaks.some((p) => Math.abs(p - m) <= 8));
  const cmpMins0 = [...new Set([...base, ...sidePeaks, ...(hit !== undefined && hit > 0 ? [hit] : [])])].sort((x, y) => x - y);
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
        // (round 12: a card that says "now" only under its own moment, never minutes later)
        const lines = fresh.flatMap((c) => cards(x, c.min).filter((l) => !(/\bnow\b/i.test(l) && Math.abs(at - c.min) > Math.max(10, 0.15 * c.min)) && !tooEarly(l, at)));
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
    // round 14 (owner): the amounts, said once and early: a typical serving each (or the same amount)
    if (sa[0] && sb[0]) { const card = servingsCard(a.serving, b.serving); sa[0].lines = [card, ...sa[0].lines]; sb[0].lines = [card, ...sb[0].lines]; }
    const keepAt = mins0.map((at, i) => i === 0 || at === hit || sa[i].isNew || sb[i].isNew);
    const mins = mins0.filter((_m, i) => keepAt[i]);
    const pick = <T,>(xs: T[]) => xs.filter((_x, i) => keepAt[i]);
    const SA = pick(sa), SB = pick(sb);
    // (round 14, critic C13-1: the chip named the other side's chapter): the side with the news, in plain words
    const human = (t: string) => TEASE_HUMAN.find(([re]) => re.test(t))?.[1] ?? t.charAt(0).toLowerCase() + t.slice(1);
    const chipOf = (i: number) => {
      const own = (x: Analysis) => peaksOf(x).includes(mins[i]);
      const k = own(b) && !own(a) ? 1 : own(a) ? 0 : SB[i].isNew && !SA[i].isNew ? 1 : 0;
      const x = k ? b : a, t = chap(x, mins[i]).title, long = `${cmpName(x.label)}: ${human(t)}`; // (the moment's own chapter, what that side is at)
      // (round 15, critic J-3: "Cola: when your blood sugar …" was cut off): the short plain words when the long ones do not fit
      return long.length <= CHIP_MAX ? long : `${cmpName(x.label)}: ${CHIP_SHORT.find(([re]) => re.test(t))?.[1] ?? t.toLowerCase()}`;
    };
    return planCompare(mins.map((at, i) => ({ min: at, a: SA[i].text, b: SB[i].text, titleA: SA[i].title, titleB: SB[i].title, linesA: SA[i].lines, linesB: SB[i].lines, keep: sidePeaks.includes(at), chip: chipOf(i) })),
      cut, uFromMinutes, minutesFromU, fx);
  };
  let used = cmpMins0, plan = build(used);
  for (let k = 0; k < 3; k++) { const kept = cmpMins0.filter((m) => plan.stops.includes(m)); if (kept.length === used.length) break; used = kept; plan = build(used); }
  // round 13 (critic P1-1: hamburger vs cola answered its question at 25 of 68 s, then nothing was open): the answer
  // lands at REVEAL_FROM of the video or later, at the first moment after the race is decided (the bars show it on the way)
  if (gq && hit !== undefined) {
    const tOf = (m: number) => plan.frames.find((f) => f.stop === m && (f.beat === 'hold' || (f.beat === 'end' && f.phase === 'main')))?.t;
    const pkT = plan.cues.find((c) => c.kind === 'peak')?.t;
    if (pkT !== undefined && pkT < REVEAL_FROM * plan.seconds) {
      // (the +24:00 moment counts too: the answer is then the day's payoff)
      const later = plan.stops.filter((m) => m >= hit && (tOf(m) ?? 0) >= REVEAL_FROM * plan.seconds).sort((x, y) => x - y)[0];
      if (later !== undefined) { fx.peakMin = later; plan = build(used); }
    }
  }
  return { plan, guess: gq, race, fx, verdict: verdictNow };
}

/** The single video's plan inputs (AppV4 reelPlan) from a model run. */
export function singlePlan(stops: StopIn[], cut: Cut, fx: PlanFx): Plan {
  return planVideo(stops, cut, uFromMinutes, minutesFromU, fx);
}
