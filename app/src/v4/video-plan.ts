// Timing of the shared video: which key moments it stops at, how long each caption stays up, and how long the whole
// video runs. Pure functions (no canvas, no DOM), so the reading rules are unit tested (video-plan.test.ts).
//
// READING RULE (research/improvements/video-polish-2026-10-22.md). Subtitle guides allow fast text for people who
// only read (Netflix English: up to 20 characters/s for adults, 17 for children; BBC: 160-180 words/min). A phone
// video is harder: the viewer is also watching the body, a stamp, a number and the place, often on a small screen.
// So we stay well under those limits: 14 characters/s (~2.5 words/s) plus 0.9 s to find the text, never less
// than 2.4 s per caption, and the first caption of every moment gets 0.8 s more for the new stamp and number.

import { beatLines } from './video-beats';

export const FPS = 30;
export const READ = {
  cps: 14,          // characters per second (≈ 2.5 words/s for English text with numbers)
  base: 0.9,        // seconds to notice and start reading a new caption
  minPage: 2.4,     // shortest time any caption is on screen
  newStop: 0.8,     // extra time on the first caption of a new moment (new stamp, number, place)
  fade: 0.2,        // a new caption fades in over this long (counted inside its time, never shortened)
  pageChars: 86,    // longest caption page (3 lines at the video size); longer chapter text is split into pages
  maxWps: 3,        // hard limit the tests check: no caption is ever faster than 3 words/s
} as const;
/** 2026-10-23 body-first redesign: the body is the star, words support it. A video caption is a short phrase
 *  (≤ 46 characters ≈ 6-8 words, two lines), paged through the chapter's sentence; the reading rule above is
 *  unchanged (every page still gets its full time, so short pages are calmer, never faster). */
export const CAP_PAGE = 46;

/** The chapter's words as the video says them: asides in brackets that are longer than four words are left out
 *  (e.g. "(a typical response, not personalized: most people land between 6.4 and 8.2 mmol/L)" — the range itself
 *  is on the gauge next to the body); short ones stay ("(about 9 teaspoons)"). Nothing is added or reworded. */
export function videoText(text: string): string {
  return text.replace(/\s*\(([^()]*)\)/g, (all, inner: string) => (inner.trim().split(/\s+/).length > 4 ? '' : all))
    .replace(/\s+([,.;:!?])/g, '$1').replace(/\s+/g, ' ').trim();
}

/** Seconds a caption needs on screen, by the reading rule. */
export function readSeconds(text: string, firstOfStop = false): number { return readChars(text.trim().length, firstOfStop); }
/** The same rule for a number of new characters on screen (the comparison video shows two captions at once). */
export function readChars(chars: number, firstOfStop = false): number {
  return Math.max(READ.minPage, READ.base + chars / READ.cps) + (firstOfStop ? READ.newStop : 0) + READ.fade;
}
/** Words in a caption (numbers and ranges count as one word each). */
export const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

/** Sentences of a text. A sentence end needs a space after it, so "2.4" and "0.5‰" stay whole. */
export function sentences(text: string): string[] {
  return text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=["“(A-Z0-9])/).map((s) => s.trim()).filter(Boolean);
}

/** Words a caption line should not end on (a break right after them reads as a cliff-hanger). */
const WEAK = new Set(['the', 'a', 'an', 'of', 'to', 'and', 'or', 'in', 'on', 'at', 'your', 'you', 'for', 'with', 'from', 'about', 'into', 'by', 'its', 'their', 'than', 'as', 'is', 'are', 'it', 'that', 'this', 'most', 'some', 'many', 'very', 'so', 'but', 'be', 'can', 'will', 'still', 'more', 'less', 'just', '×', '+', '–', 'per', 'up', 'down', 'one', 'two']);

/** Splits text into caption pages of at most `max` characters, at sentence ends where possible, else at a comma,
 *  colon or semicolon, else between words (balanced halves, so no page is a lonely word). */
export function splitPages(text: string, max: number = READ.pageChars): string[] {
  const out: string[] = [];
  const soft = Math.round(max * 1.12); // a sentence a little over the limit stays whole (the caption font shrinks a step)
  const pushLong = (s: string) => {
    if (s.length <= soft) { out.push(s); return; }
    // best break: near the middle, after a clause mark or before a bracket, never right after "the", "of", "your"…
    const mid = s.length / 2;
    let best = -1, bestScore = Infinity;
    for (const m of s.matchAll(/\s+/g)) {
      const i = m.index!, left = s.slice(0, i), right = s.slice(i + m[0].length);
      if (left.length < 14 || right.length < 14) continue;
      const prev = /(\S+)$/.exec(left)?.[1] ?? '';
      let score = Math.abs(i - mid) / s.length;
      if (/[,;:–—]$/.test(prev)) score -= 0.25;
      if (/^[(“"]/.test(right)) score -= /^\([^()]{0,30}\)/.test(right) && max < 60 ? -0.45 : 0.2; // short pages: a short aside stays with its words
      if (WEAK.has(prev.toLowerCase())) score += 0.4;
      if (/^\d/.test(right) && /^\d/.test(prev)) score += 0.4; // keep "5.0 mmol/L" and "3 × 500 ml" together
      // 2026-10-23 (short video pages): a number stays with its unit ("1.5 hours", "5.0 mmol/L"), a bracket stays
      // whole, and a break before "and / to / in …" reads naturally
      if (/\d$/.test(prev) && /^(?:h|ml|l|g|mg|kg|min|minutes?|hours?|mmol\/L|mg\/dL|‰|%|kcal|×|teaspoons?|cups?)\b/i.test(right)) score += 0.8;
      else if (/\d[.,]?\d*$/.test(prev)) score += 0.15;
      if ((left.match(/\(/g) ?? []).length > (left.match(/\)/g) ?? []).length) score += 0.5;
      if (/^(?:and|to|in|into|as|while|but|within|after|before|because|so|then|until|with|from|for)\b/i.test(right)) score -= 0.1;
      if (left.length > soft || right.length > soft) score += 0.2;
      if (score < bestScore) { bestScore = score; best = i; }
    }
    if (best <= 0) { out.push(s); return; }
    pushLong(s.slice(0, best).trim());
    pushLong(s.slice(best).trim());
  };
  let cur = '';
  for (const s of sentences(text)) {
    if (!cur) { cur = s; continue; }
    if (cur.length + 1 + s.length <= max) cur = `${cur} ${s}`;
    else { pushLong(cur); cur = s; }
  }
  if (cur) pushLong(cur);
  return out;
}

/** round 11: 'medium' = Instagram / Facebook Reels (45-55 s); 'long' = TikTok (62-75 s); 'short' = YouTube Shorts. */
export type Cut = 'long' | 'medium' | 'short';
export const isLongish = (cut: Cut) => cut !== 'short';
/** One key moment of the day: the minute, the chapter title and its words at that minute. */
/** `lines`: the moment's caption cards (video-beats.ts beatLines; computed from title + text when absent). */
export interface StopIn { min: number; title: string; text: string; lines?: string[]; /** never left out (round 5) */ keep?: boolean }
/** Safety cards (round 5, critic P0): with alcohol, "a breath test can be positive" and "Don't drive." are shown in
 *  EVERY cut, together, and their moment is never left out. */
export const SAFETY = /breath test|\bdrive\b/i;
/** How many of a moment's first cards must be shown: up to its last safety card among the first two ("At 07:00, the
 *  alcohol should be gone." / "A hangover can still make you drive worse."), else 0. */
export const mustCards = (lines: readonly string[]) => { let n = 0; for (let i = 0; i < Math.min(2, lines.length); i++) if (SAFETY.test(lines[i])) n = i + 1; return n; };
export interface Page { stop: number; text: string; textB?: string; s: number }
export interface VFrame {
  phase: 'intro' | 'main' | 'outro';
  m: number;          // minute of the day shown (the 3D body steps to it)
  t: number;          // seconds into the video
  cap?: string;       // caption page shown in this frame
  capB?: string;      // comparison video: the second food's caption
  title?: string;     // the chapter title over the caption (the moment the caption belongs to)
  titleB?: string;
  plateA?: number;    // caption panel opacity (1 by default; fades out on the way to the 24 h beat)
  capA: number;       // caption opacity (fades in at a page change)
  k: number;          // 0..1 progress through the phase (intro / outro animation)
  // 2026-10-23 body-first: what the camera and the clock need
  stop?: number;      // the moment (minute) whose words are on screen; during a glide, the moment it glides to
  /** round 11: 0..1 through the 24 h payoff beat ("AFTER 24 HOURS" and the lights, body in frame) */ celeb?: number;
  beat?: 'teaser' | 'rewind' | 'hook' | 'hold' | 'glide' | 'end'; // teaser = cold open, rewind = back to +0:00, hook = first sip, hold = at a moment, glide = to the next one, end = 24 h beat + end card
  from?: number;      // glide: the minute it started from (a long glide = a quiet stretch: the camera pulls back)
  u?: number;         // day position 0..1 (the app's clock axis)
  rate?: number;      // how fast the day runs here, minutes per second of video (the clock speeds up in quiet stretches)
  hk?: number;        // 0..1 through the current moment (the hook counts as part of the first one): the camera keeps moving
  next?: { min: number; title: string }; // glide: the moment ahead ("NEXT · +1:15 · The sugar dip")
  night?: number;     // 0..1 night tone (22:00–07:00 on the clock)
  tease?: boolean;    // this card is the mid-video "Coming up: …"
  pg?: number;        // round 5: shot number while moments are read (a new one with every card and every 2.6 s of a long card): the camera reframes, so the picture never stands still for 3 s
}
/** One timeline for picture and sound (2026-10-24 creative spec §2.1): every effect and every sound effect is placed
 *  from these cues, so they always land on the same frame. */
export type CueKind = 'start' | 'move' | 'stop' | 'page' | 'outro' | 'end'
  | 'teaser' | 'rewind' | 'sip' | 'riser' | 'peak' | 'next' | 'night' | 'lights' | 'verdict' | 'guess' | 'race' | 'micro' | 'heart' | 'surge' | 'day';
export interface Cue { t: number; kind: CueKind; data?: { level?: 0 | 1 | 2; side?: 0 | 1; v?: number; label?: string } }
export interface Plan { frames: VFrame[]; stops: number[]; stopsU: number[]; pages: Page[]; cues: Cue[]; seconds: number; introS: number; outroS: number; peakT?: number }
/** What the effects need from the model (all optional; the plan works without). */
export interface PlanFx {
  teaserMin?: number;     // the cold open (frame 0): the story's most dramatic minute (the main gauge's peak)
  peakMin?: number;       // the main gauge's peak: riser + impact (at most one per video, plus the comparison verdict)
  drinkAtMin?: number;    // clock time of the first sip, for the night time-lapse (22:00–07:00)
  wakeMin?: number;
  lights?: (0 | 1 | 2)[]; // the end card's lights, in the order they come on
  compare?: boolean; verdict?: boolean; verdictTrophy?: boolean;
  race?: { a?: ArrayLike<number>; b?: ArrayLike<number> }; // comparison: progress 0..1 per minute (1 = done)
  tease?: boolean;        // the mid-video "Coming up: …" card (long cut; default on)
  /** the heart light per minute (status.ts): a heartbeat is heard ONLY while the model says the heart is under stress */
  heart?: ArrayLike<number>;
  /** round 5: the minute of the moment that pays off the hook ("Still in you at bedtime" → bedtime). It is in every
   *  cut, and the short cut ends its story there (the payoff lands near the end). Default: the peak. */
  payoffMin?: number;
  /** round 5: the long cut's first impact lands by this second (critic: "the first wow at 27 s is too late"). */
  peakByS?: number;
  /** round 10: while the drink's main substance climbs in the blood (from SURGE_FROM of its peak, `min`, to the peak,
   *  `max`; video-story `surgeOf`), and which one: the bloodstream surges on screen and in the sound, once, at the
   *  first second of that stretch that is clear of the sip, the riser and the impact. */
  surge?: { min: number; max: number; kind: SurgeKind; side?: 0 | 1 };
  /** round 11: the 24 h "day done" beat is calm (no sparkle, no bright chord): alcohol is never celebrated */
  calmDay?: boolean;
  /** round 13: glides between moments take this many times their usual time (the planner fills a sparse story with the
   *  journey, not with one card held for 12 s) */
  glideK?: number;
  /** the same for the glides before the impact (only while it still lands by PEAK_BY_S) */
  glideK0?: number;
  /** round 15: how many times the planner has moved the impact later to keep cards short (internal) */
  retry?: number;
}
export type SurgeKind = 'sugar' | 'caffeine' | 'alcohol';
/** Round 10: the surge keeps this far from the sip, the riser and the impact (seconds), so no two big events overlap. */
export const SURGE_CLEAR_S = 1.4, SURGE_FROM = 0.25;
/** Round 13: the longest a single card stays (unless its own reading time is longer), and how much slower a glide may get. */
export const CARD_MAX_S = 5, GLIDE_K_MAX = 6, GLIDE_MAX_S = 3.8; // (round 15, critic SA-2: 6 s cards at 0.8 w/s read slow)
/** Round 14 (critic DC-1, owner): never longer than this without a card on screen (the 24 h beat and the end card aside). */
export const WORDLESS_MAX_S = 4;
/** Round 14: the short cut's glides take this share of the usual time (room for the peak AND the hook's answer). */
export const SHORT_GLIDE_K = 0.55;
export const TEASER_S = 0.45, REWIND_S = 0.5, RISER_S = 1.6, NEXT_MIN_S = 1.2, LIGHTS_FROM_S = 0.3, LIGHTS_STEP_S = 0.25, MICRO_GAP_S = 2.9;
/** Comparison end card: the verdict lands first (it is the answer to the guess, and must be read: + 1.5 s), then the
 *  lights come on, left and right in turn, faster. */
// (round 11, research R1: the lights and the verdict land in the 24 h beat, with the body in frame; the end card is
// short, so the comparison adds nothing to it)
export const CMP_OUTRO_EXTRA_S = 0, CMP_LIGHTS_FROM_S = 0.55, CMP_LIGHTS_STEP_S = 0.15;
export const outroSeconds = (cut: Cut, compare = false) => OUTRO_S[cut] + (compare ? CMP_OUTRO_EXTRA_S : 0);
export const TEASE_PREFIX = 'Coming up: ', TEASE_PREFIX2 = 'Still to come: ';
/** "Coming up: the sugar dip." (≤ 5 words), from a chapter title. */
/** Round 13 (critic P1-2: "Coming up: peak." meant nothing to most people): what the moment means for the viewer. */
export const TEASE_HUMAN: [RegExp, string][] = [
  [/sugar peak|blood sugar/i, 'when your blood sugar tops out'], [/alcohol peak/i, 'when the alcohol hits hardest'], [/peak/i, 'when it hits hardest'],
  [/dip|crash/i, 'the sugar crash'], [/going to bed|bedtime/i, 'what is left at bedtime'], [/sleep/i, 'what it does to your sleep'],
  [/morning/i, 'what is left the next morning'], [/gone/i, 'when it is finally gone'], [/large intestine/i, 'where the leftovers go'],
  [/toilet/i, 'when it reaches the toilet'], [/24 hours/i, 'what is left after 24 hours'],
];
export const teaseCard = (title: string) => { const h = TEASE_HUMAN.find(([re]) => re.test(title)); return h ? `${TEASE_PREFIX}${h[1]}.` : `${TEASE_PREFIX}${title.charAt(0).toLowerCase()}${title.slice(1)}.`; };

/** Length targets. Long: TikTok/Facebook reward 60 s+ (we aim 62-75 s so encoders never round it under 61 s).
 *  Short: 15-30 s for Shorts / Reels experiments. */
// (round 13, critic P2-4: 74.6 / 54.8 s sat on the platforms' edges; a frame more in the transcode must still fit)
export const LENGTH = { long: { min: 62, max: 73 }, medium: { min: 45, max: 53 }, short: { min: 24, max: 30 } } as const; /* (round 15: back to 30 s, the coordinator's call: over 30 s hurts Shorts retention) */ // (round 14: Shorts never under 24 s, critic P2-T1; up to 31.5 s so the peak AND the hook's answer fit) // (round 11: Shorts 23-30 s, research L2)
/** Long cut: more words are added to moments only up to this length (the rest of the minute is the body, not text). */
export const FILL_S = 68;
/** round 11: the same for each longer cut (medium: Reels). */
export const fillS = (cut: Cut) => (cut === 'medium' ? 51 : FILL_S);
/** While a moment's caption is read, the day keeps running slowly towards the next moment (this share of the way on
 *  the day axis), so the drink keeps moving and the clock keeps ticking. The first sip runs further: the swallow. */
export const DRIFT = 0.12, DRIFT_FIRST = 0.6;
export const MOVE_S = 1.0;        // glide between two moments (eased)
/** 2026-10-24: a glide over a long quiet stretch takes longer (up to 1.8 s), so hours never flash past. */
export const moveS = (toU: (m: number) => number, from: number, to: number) => MOVE_S + 0.8 * Math.max(0, Math.min(1, (toU(to) - toU(from)) / 0.35));
export const INTRO_S = { long: 3.0, medium: 2.7, short: 2.4 } as const; // big hook card (it then stays at the top as the headline)
/** The 24 h beat before the end card. Round 11 (research R1): the payoff beat with the body in frame: "AFTER 24
 *  HOURS", the day's lights come on one by one (and the comparison's verdict lands), then a "day done" ring. */
export const CELEB_S = { long: 2.2, medium: 2.0, short: 1.4 } as const;
export const END_HOLD_S = CELEB_S.long; // (the longest)
/** The glide to +24:00 names where it goes (a chip, so the end of the day is never a stretch without words). */
export const DAY_END_TITLE = '24 hours later';
/** Moments worth a "Coming up: …" (round 5, critic: "Coming up: building blocks." promised nothing). */
export const TEASE_OK = /peak|dip|crash|sleep|bed|gone|morning|24 hours|large intestine|toilet/i;
/** Moments that tell nothing a viewer can see or feel (round 6): never in the video. */
export const DULL = /^Building blocks$/i;
/** The long cut's first impact by this second (round 5). */
export const PEAK_BY_S = 15;
/** Round 15: the latest the long cut's impact may move to keep every card short (a sparse story, critic SA-2). */
export const PEAK_BY_MAX_S = 33;
/** End card: summary + call to action + a loop back to the start. Round 11 (research R1): ≤ 4 s long, ≤ 2.5 s short. */
export const OUTRO_S = { long: 4.0, medium: 3.0, short: 2.3 } as const; // (round 15: short 2.3 s, so the climax and the hook's answer both fit in 30 s)

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** How much a moment tells: numbers in its first sentence, plus the turning points people share (peak, dip, crash,
 *  sleep, gone). Used only to choose which moment to leave out when a video would run too long. */
export function stopValue(s: StopIn): number {
  const first = sentences(s.text)[0] ?? '';
  const nums = (first.match(/\d+(?:[.,]\d+)?/g) ?? []).length;
  const turn = /peak|dip|drop|crash|sleep|bed|gone|highest|lowest/i.test(`${s.title} ${first}`) ? 3 : 0;
  return Math.min(nums, 4) + turn;
}

/** Picks the moments and caption pages, then lays out every frame of the video.
 *  toU/fromU map minutes to the app's day position (the clock is not linear: early minutes get more room). */
export function planVideo(stopsIn: StopIn[], cut: Cut, toU: (m: number) => number, fromU: (u: number) => number, fx: PlanFx = {}): Plan {
  // one stop per minute (the later chapter wins, as on screen), in order, inside the day
  const byMin = new Map<number, StopIn>();
  for (const s of stopsIn) byMin.set(Math.max(0, Math.min(1440, s.min)), { ...s, min: Math.max(0, Math.min(1440, s.min)) });
  // round 6 (critic: "Building blocks / Protein pieces in your blood peak now." promised and showed nothing): left out
  // (round 14: a sparse story keeps them: a quiet moment is better than a long stretch without words)
  const all0 = [...byMin.values()], sparse = all0.filter((s) => !DULL.test(s.title.trim())).length < 8;
  let stops = all0.filter((s) => sparse || !DULL.test(s.title.trim()) || s.min === 0).sort((a, b) => a.min - b.min);
  if (!stops.length || stops[0].min !== 0) stops.unshift({ min: 0, title: stops[0]?.title ?? '', text: stops[0]?.text ?? '' });
  const story = stops; // the 24 h beat is added after the last moment (stamp only, the caption stays)
  // the peak's moment is never left out (it carries the impact); the cold open defaults to the most telling moment
  const peakAt = fx.peakMin === undefined ? -1 : nearestStop(story.map((x) => x.min), fx.peakMin, toU);
  const peakMin = peakAt >= 0 ? story[peakAt].min : undefined;
  const payAt = fx.payoffMin === undefined ? -1 : nearestStop(story.map((x) => x.min), fx.payoffMin, toU);
  const payoffMin = payAt >= 0 ? story[payAt].min : peakMin;
  const mustOf = (x: StopIn) => mustCards(x.lines?.length ? x.lines : beatLines(x));
  const forced = (x: StopIn) => x.min === peakMin || x.min === payoffMin || !!x.keep || mustOf(x) > 0;
  const val = (x: StopIn) => stopValue(x) + (forced(x) ? 10 : 0);
  const teaserMin = fx.teaserMin ?? peakMin ?? story.slice(1).reduce((b, x) => (stopValue(x) > stopValue(b) ? x : b), story[Math.min(1, story.length - 1)]).min;

  const lim = LENGTH[cut];
  // 2026-10-24 BEATS: every caption card is one short complete thought (video-beats.ts), one card per page; a moment
  // shows its first card(s), the long cut adds more of its cards while there is room
  const linesOf = (s: StopIn) => (s.lines?.length ? s.lines : beatLines(s));
  const gk = cut === 'short' ? SHORT_GLIDE_K : 1; // (round 14: the short cut travels a little faster)
  const glides = (list: StopIn[]) => gk * (list.reduce((a, s, i) => a + (i ? moveS(toU, list[i - 1].min, s.min) : 0), 0)
    + (list[list.length - 1].min < 1440 ? moveS(toU, list[list.length - 1].min, 1440) : 0));
  const fixed = INTRO_S[cut] + OUTRO_S[cut] + CELEB_S[cut]; // intro, the 24 h beat, end card (the glides are counted apart)
  // the start says what it is and its first number; a moment with safety cards shows all of them (round 5)
  const firstNOf = (s: StopIn, i: number) => Math.max(i === 0 ? 2 : 1, mustOf(s));
  let chosen: StopIn[];
  if (cut === 'short') {
    // the start + the moments that must be there (peak, payoff, safety) + the most telling ones that fit in 30 s,
    // in time order. Round 5 (critic: "the last 30 % of the shorts has nothing new"): the story ends at the payoff,
    // so it lands near the end; only a safety moment may come after it.
    chosen = [story[0]];
    const firstS = (s: StopIn, i: number) => linesOf(s).slice(0, firstNOf(s, i)).reduce((a, p, j) => a + readSeconds(p, j === 0), 0);
    const len = (list: StopIn[]) => fixed + glides(list) + list.reduce((a, s, i) => a + firstS(s, i), 0);
    const rank = (s: StopIn) => val(s) + (s.min >= 10 ? 1.5 : 0); // a short cut should travel, not wait at the stomach
    const endAt = Math.max(payoffMin ?? -1, peakMin ?? -1);
    const pool = story.slice(1).filter((s) => endAt < 0 || s.min <= endAt || mustOf(s) > 0 || !!s.keep);
    const ranked = pool.sort((a, b) => Number(forced(b)) - Number(forced(a)) || rank(b) - rank(a) || a.min - b.min);
    for (const c of ranked) {
      if (chosen.length >= 5 && !forced(c)) break;
      const next = [...chosen, c].sort((a, b) => a.min - b.min);
      if (len(next) <= lim.max || forced(c)) chosen = next;
    }
  } else chosen = story.slice();
  let sents = chosen.map(linesOf);
  let used = sents.map((x, i) => Math.min(firstNOf(chosen[i], i), x.length));
  const pagesFor = () => chosen.map((_s, i) => sents[i].slice(0, Math.max(1, used[i])));
  const stopS = (pp: string[]) => pp.reduce((a, p, j) => a + readSeconds(p, j === 0), 0);
  const total = (pp: string[][]) => fixed + glides(chosen) + pp.reduce((acc, p) => acc + stopS(p), 0);

  // 1) as many moments as fit, one card each: if too long, leave out the moment that says the least
  //    (stopValue; ties: the one closest in time to the moment before it). Text is never sped up.
  let pages = pagesFor();
  const dropped: StopIn[] = [];
  while (total(pages) > lim.max && chosen.length > 2) {
    let drop = 1, bestV = Infinity;
    for (let i = 1; i < chosen.length - (cut === 'short' && !forced(chosen[chosen.length - 1]) ? 0 : 1); i++) {
      const v = val(chosen[i]) + (toU(chosen[i].min) - toU(chosen[i - 1].min)); // the gap (0..1) only breaks ties
      if (v < bestV) { bestV = v; drop = i; }
    }
    // (round 5: before a peak, payoff or safety moment goes, the start says only its first card)
    if (forced(chosen[drop]) && used[0] > 1) { used[0] = 1; pages = pagesFor(); continue; }
    // (round 14: then every moment says only the cards it must; and the hook's payoff goes last, after the peak)
    if (forced(chosen[drop])) {
      const k = used.findIndex((u, i) => i > 0 && u > Math.max(1, mustOf(chosen[i])));
      if (k > 0) { used[k] = Math.max(1, mustOf(chosen[k])); pages = pagesFor(); continue; }
      if (chosen[drop].min === payoffMin) { const other = chosen.findIndex((c, i) => i > 0 && i !== drop && forced(c) && c.min !== payoffMin && mustOf(c) === 0); if (other > 0) drop = other; }
    }
    dropped.push(chosen[drop]);
    chosen = chosen.filter((_s, i) => i !== drop); sents = sents.filter((_s, i) => i !== drop); used = used.filter((_s, i) => i !== drop);
    pages = pagesFor();
  }
  // a later drop can free more room than needed: a left-out moment that now fits comes back
  if (isLongish(cut)) {
    for (const d of dropped.sort((a, b) => val(b) - val(a))) {
      const at = chosen.findIndex((c) => c.min > d.min), k = at < 0 ? chosen.length : at;
      const c2 = [...chosen.slice(0, k), d, ...chosen.slice(k)], s2 = [...sents.slice(0, k), linesOf(d), ...sents.slice(k)], u2 = [...used.slice(0, k), firstNOf(d, k), ...used.slice(k)];
      const keep = [chosen, sents, used] as const;
      chosen = c2; sents = s2; used = u2;
      const next = pagesFor();
      if (total(next) > lim.max) { [chosen, sents, used] = [keep[0], keep[1], keep[2]]; continue; }
      pages = next;
    }
  }
  // 1b) long cut, round 5 (critic: the first "wow" at 27-34 s is too late): the first impact lands by PEAK_BY_S.
  //    Before the peak each moment shows one card, and the quieter moments before it are left out (least telling
  //    first); the camera still travels the whole way in the glides.
  const peakIdx = () => (peakMin === undefined ? -1 : chosen.findIndex((c) => c.min === peakMin));
  if (isLongish(cut) && peakIdx() > 0) {
    const by = sparse ? Math.max(30, fx.peakByS ?? PEAK_BY_S) : fx.peakByS ?? PEAK_BY_S; // (round 14: a sparse story keeps its few moments)
    const tPeak = () => { let t = INTRO_S[cut]; for (let i = 0; i < peakIdx(); i++) t += stopS(pages[i]) + moveS(toU, chosen[i].min, chosen[i + 1].min); return t; };
    // the start says its first card only (the hook already says what it is); then the quietest moments go
    if (tPeak() > by && used[0] > 1) { used[0] = 1; pages = pagesFor(); }
    for (let guard = 0; guard < 20 && tPeak() > by; guard++) {
      let drop = -1, bestV = Infinity;
      for (let i = 1; i < peakIdx(); i++) if (!forced(chosen[i]) && val(chosen[i]) < bestV) { bestV = val(chosen[i]); drop = i; }
      if (drop < 0) {
        if (used[0] > 1) { used[0] = 1; pages = pagesFor(); continue; }
        break;
      }
      chosen = chosen.filter((_s, i) => i !== drop); sents = sents.filter((_s, i) => i !== drop); used = used.filter((_s, i) => i !== drop);
      pages = pagesFor();
    }
  }
  // 2) long cut: room left → more cards of a moment, one at a time, always to the moment with the fewest so far
  //    (ties: the more telling one, then the later one), up to FILL_S (the rest of the minute is the body); never
  //    before the peak (round 5: the first impact stays early)
  for (let guard = 0; isLongish(cut) && guard < 100; guard++) {
    const order = chosen.map((_s, i) => i).filter((i) => used[i] < sents[i].length && (peakIdx() <= 0 || i >= peakIdx() || sparse || (fx.peakByS ?? PEAK_BY_S) > PEAK_BY_S))
      .sort((a, b) => pages[a].length - pages[b].length || val(chosen[b]) - val(chosen[a]) || chosen[b].min - chosen[a].min);
    let grew = false;
    for (const i of order) {
      used[i]++; const next = pagesFor();
      if (total(next) > Math.min(lim.max, fillS(cut))) { used[i]--; continue; }
      pages = next; grew = true; break;
    }
    if (!grew) break;
  }
  // 3) long cut: one open loop at about half time (§2.4): "Coming up: the sugar dip." names a turn that is still to
  //    come (peak, dip, bedtime, next morning, gone), as a card of the moment then on screen
  if (isLongish(cut) && fx.tease !== false) {
    const starts: number[] = []; let t = INTRO_S[cut];
    chosen.forEach((c, i) => { if (i) t += moveS(toU, chosen[i - 1].min, c.min); starts.push(t); t += stopS(pages[i]); });
    const tot = total(pages);
    let i = -1, best = Infinity;
    starts.forEach((st, k) => { const d = Math.abs(st / tot - 0.47); if (k > 0 && st / tot >= 0.38 && st / tot <= 0.6 && d < best) { best = d; i = k; } });
    const turn = i < 0 ? undefined : chosen.slice(i + 1).find((c) => stopValue(c) >= 3 && TEASE_OK.test(c.title) && c.title.trim().split(/\s+/).length <= 3);
    if (i >= 0 && turn) {
      const card = teaseCard(turn.title.trim()), withIt = [...pages[i].slice(0, Math.max(1, pages[i].length - (pages[i].length >= 2 ? 1 : 0))), card];
      const next = pages.map((p, k) => (k === i ? withIt : p));
      if (total(next) <= lim.max) pages = next;
    }
    // round 12 (critic P1-3: the espresso answered its hook at 8 s and then had no open question for 54 s): when the
    // hook's payoff comes in the first third, a second loop opens right there: "Coming up: bedtime." (another turn,
    // later than the mid-video one, said as the payoff moment's last card)
    const pi = payoffMin === undefined ? -1 : chosen.findIndex((c) => c.min === payoffMin);
    const st2: number[] = []; let t2 = INTRO_S[cut];
    chosen.forEach((c, k) => { if (k) t2 += moveS(toU, chosen[k - 1].min, c.min); st2.push(t2); t2 += stopS(pages[k]); });
    if (pi >= 0 && st2[pi] / total(pages) < 0.33 && !pages[pi].some((p) => p.startsWith(TEASE_PREFIX))) {
      const used2 = new Set(pages.flat().filter((p) => p.startsWith(TEASE_PREFIX)));
      const turn2 = chosen.slice(pi + 1).reverse().find((c) => stopValue(c) >= 3 && TEASE_OK.test(c.title) && c.title.trim().split(/\s+/).length <= 3 && !used2.has(teaseCard(c.title.trim())));
      if (turn2) {
        const next = pages.map((p, k) => (k === pi ? [...p, teaseCard(turn2.title.trim())] : p));
        if (total(next) <= lim.max) pages = next;
      }
    }
  }
  // too short (few, short chapters): every card gets proportionally more time. Calmer, never repeated; the long
  // cut must reach its minimum (platforms count 60 s+), the short cut stretches at most 1.6×.
  // (round 5: in the long cut only the words from the peak on are stretched, so the first impact stays early)
  const from = isLongish(cut) && !sparse ? Math.max(0, peakIdx()) : 0;
  const t0 = total(pages), reading = pages.slice(from).reduce((a, p) => a + stopS(p), 0);
  let want = lim.min + 0.3; // a little over, so frame rounding never lands under the minimum
  const lay = () => {
    const stretch = t0 < want ? Math.min(isLongish(cut) ? Infinity : 1.6, 1 + (want - t0) / Math.max(0.1, reading)) : 1;
    // round 13 (critic P0-2: salmon held 3 cards for 12-15 s each): a card stays at most CARD_MAX_S (or its own reading
    // time); the rest of the time goes to the journey between moments (slower glides: the day and the body move)
    let lost = 0;
    const secs = chosen.map((_s, i) => pages[i].map((p, j) => { const r = readSeconds(p, j === 0), w = r * (i >= from ? stretch : 1), c = Math.min(w, Math.max(r, CARD_MAX_S)); lost += w - c; return c; }));
    // first the glides after the impact, then the ones before it (as long as the impact still lands by PEAK_BY_S)
    const pi = Math.max(0, peakIdx()), gl = glides(chosen.slice(pi));
    let preG = 0; for (let i = 1; i <= pi; i++) preG += moveS(toU, chosen[i - 1].min, chosen[i].min);
    let tp = INTRO_S[cut]; for (let i = 0; i < pi; i++) tp += stopS(pages[i]); tp += preG;
    // (round 14: each glide may grow only up to GLIDE_MAX_S, so the room the glides can take is counted glide by glide)
    const room = (list: StopIn[], from: number) => { let r = 0; for (let i = from + 1; i < list.length; i++) r += Math.max(0, GLIDE_MAX_S - moveS(toU, list[i - 1].min, list[i].min)); if (list[list.length - 1].min < 1440) r += Math.max(0, GLIDE_MAX_S - moveS(toU, list[list.length - 1].min, 1440)); return r; };
    const roomA = room(chosen, pi), useA = Math.min(lost, roomA);
    const glideK = Math.min(GLIDE_K_MAX, 1 + useA / Math.max(0.1, gl)), rem = Math.max(0, lost - useA);
    let roomB = 0; for (let i = 1; i <= pi; i++) roomB += Math.max(0, GLIDE_MAX_S - moveS(toU, chosen[i - 1].min, chosen[i].min));
    const useB = pi > 0 && preG > 0.1 ? Math.min(rem, roomB, Math.max(0, (fx.peakByS ?? PEAK_BY_S) - 0.3 - tp)) : 0;
    const glideK0 = pi > 0 && preG > 0.1 ? Math.min(GLIDE_K_MAX, 1 + useB / preG) : 1;
    const back = Math.max(0, rem - useB);
    // (what is left goes to the cards from the impact on, so the impact stays early)
    const nCards = secs.slice(from).reduce((a, x) => a + x.length, 0);
    return layFrames(chosen.map((s, i) => ({ min: s.min, title: s.title, pages: pages[i].map((p, j) => ({ cap: p, s: secs[i][j] + (i >= from ? back / Math.max(1, nCards) : 0) })) })), cut, toU, fromU, { ...fx, teaserMin, peakMin, glideK, glideK0 });
  };
  let out = lay();
  for (let k = 0; k < 3 && out.seconds < lim.min + 0.1 && t0 < want + 5; k++) { want += lim.min + 0.3 - out.seconds; out = lay(); }
  // round 15 (critic SA-2: cards held 6-8 s): when the early impact left too few moments for the length, the impact
  // may come a little later (up to PEAK_BY_MAX_S), so the moments before it come back and every card stays short
  const longest = (pl: Plan) => Math.max(0, ...pl.pages.map((pg) => pg.s - readSeconds(pg.text, true)));
  const by0 = fx.peakByS ?? PEAK_BY_S;
  if (isLongish(cut) && (fx.retry ?? 0) < 3 && by0 < PEAK_BY_MAX_S && longest(out) > CARD_MAX_S - 2.4) {
    const alt = planVideo(stopsIn, cut, toU, fromU, { ...fx, peakByS: Math.min(PEAK_BY_MAX_S, by0 + 6), retry: (fx.retry ?? 0) + 1 });
    if (longest(alt) < longest(out) - 0.2) return alt;
  }
  return out;
}

/** Comparison video: both foods at the same minutes. Each side shows the first sentence of its chapter at that
 *  minute (split into pages when long). A page's time counts only the words that are new on screen: a side whose
 *  chapter did not change since the last moment is not read again. Same length rules as the single video. */
export interface CmpStopIn { min: number; a: string; b: string; titleA?: string; titleB?: string; linesA?: string[]; linesB?: string[]; /** round 12: a side's own peak: never left out */ keep?: boolean;
  /** round 14 (critic C13-1: "NEXT · Peak" before the beer's "Alcohol gone"): the NEXT chip, in plain words, for the side that has the news */ chip?: string }
export const CMP_PAGE = 40;
/** Longest time one card stays on one side of the comparison (round 8). */
export const CMP_REPEAT_S = 6; // characters per side and page (2026-10-23 split screen: three short lines under each body)
export function planCompare(stopsIn: CmpStopIn[], cut: Cut, toU: (m: number) => number, fromU: (u: number) => number, fx: PlanFx = {}): Plan {
  const lim = LENGTH[cut];
  const fixed = INTRO_S[cut] + outroSeconds(cut, true) + CELEB_S[cut];
  const byMin = new Map<number, CmpStopIn>();
  for (const s of stopsIn) { const m = Math.max(0, Math.min(1440, s.min)); byMin.set(m, { ...s, min: m }); }
  let chosen = [...byMin.values()].sort((x, y) => x.min - y.min);
  if (!chosen.length) chosen = [{ min: 0, a: '', b: '' }];
  if (chosen[0].min !== 0) chosen.unshift({ ...chosen[0], min: 0 });
  // (round 13: before a side's own peak or "gone" moment is left out, its moments say one card each)
  const perMin = new Map<number, number>();
  // (round 14: a short comparison with few moments shows two cards a moment, never one card held for 7 s)
  let shortTwo = false;
  const pagesOf = (list: CmpStopIn[]) => {
    let pa = '', pb = '', ra = 0, rb = 0; // (round 8: seconds the same card has been on screen, per side)
    return list.map((s) => {
      // 2026-10-24 BEATS: each side shows its own short complete cards (video-beats.ts): one per moment in the
      // short cut, up to two in the long cut (the start: two in both)
      const side = (t: string, title: string | undefined, lines: string[] | undefined) => (lines?.length ? lines : beatLines({ min: s.min, title: title ?? '', text: t })).slice(0, Math.min(cut === 'short' && !shortTwo ? 1 : 2, perMin.get(s.min) ?? 2));
      const A = side(s.a, s.titleA, s.linesA), B = side(s.b, s.titleB, s.linesB);
      const n = Math.max(A.length, B.length, 1), out: { cap: string; capB: string; s: number }[] = [];
      for (let k = 0; k < n; k++) {
        let ca = A[Math.min(k, A.length - 1)] ?? '', cb = B[Math.min(k, B.length - 1)] ?? '';
        // (round 14: the same card on both sides is shown once, "Both · …", and read once)
        const fresh = (ca !== pa ? ca.length : 0) + (cb !== pb && cb !== ca ? cb.length : 0), s = readChars(fresh, k === 0);
        // round 8 (critic: "We can't tell when you're safe to drive." stood ~15 s, next to "ALCOHOL GONE"): a card
        // that would stay longer than CMP_REPEAT_S leaves; that side is quiet until it has something new
        if (ca && ca === pa && ra + s > CMP_REPEAT_S) ca = '';
        if (cb && cb === pb && rb + s > CMP_REPEAT_S) cb = '';
        ra = ca && ca === pa ? ra + s : ca ? s : 0; rb = cb && cb === pb ? rb + s : cb ? s : 0;
        out.push({ cap: ca, capB: cb, s });
        pa = ca; pb = cb;
      }
      return out;
    });
  };
  const glides = (list: CmpStopIn[]) => (cut === 'short' ? SHORT_GLIDE_K : 1) * (list.reduce((a, s, i) => a + (i ? moveS(toU, list[i - 1].min, s.min) : 0), 0)
    + (list[list.length - 1].min < 1440 ? moveS(toU, list[list.length - 1].min, 1440) : 0)); // (round 14: as layFrames times them)
  const total = (pp: { s: number }[][]) => fixed + glides(chosen) + pp.reduce((acc, p) => acc + p.reduce((a, x) => a + x.s, 0), 0);
  const peakAt = fx.peakMin === undefined ? -1 : nearestStop(chosen.map((x) => x.min), fx.peakMin, toU), peakMin = peakAt >= 0 ? chosen[peakAt].min : undefined;
  const value = (s: CmpStopIn) => stopValue({ min: s.min, title: '', text: s.a }) + stopValue({ min: s.min, title: '', text: s.b }) + (s.min === peakMin ? 10 : 0) + (s.keep ? 100 : 0);
  let pages = pagesOf(chosen);
  const dropped: CmpStopIn[] = [];
  while (total(pages) > lim.max && chosen.length > 2) {
    let drop = 1, best = Infinity;
    // (short cut: the last moment may go too, so the answer's moment always fits; the 24 h beat still closes the day)
    // (round 12: a side's own peak goes only when nothing else can)
    const free = chosen.some((c, i) => i > 0 && i < chosen.length - (cut === 'short' ? 0 : 1) && !c.keep);
    if (!free) { const two = chosen.slice(1).reverse().find((c) => (perMin.get(c.min) ?? 2) > 1); if (two) { perMin.set(two.min, 1); pages = pagesOf(chosen); continue; } }
    for (let i = 1; i < chosen.length - (cut === 'short' ? 0 : 1); i++) { if (free && chosen[i].keep) continue; const v = value(chosen[i]) + (toU(chosen[i].min) - toU(chosen[i - 1].min)); if (v < best) { best = v; drop = i; } }
    dropped.push(chosen[drop]); chosen = chosen.filter((_s, i) => i !== drop); pages = pagesOf(chosen);
  }
  for (const d of dropped.sort((x, y) => value(y) - value(x))) { // a left-out moment that fits again comes back
    const keep = chosen;
    chosen = [...chosen, d].sort((x, y) => x.min - y.min);
    const np = pagesOf(chosen);
    if (total(np) <= lim.max) pages = np; else chosen = keep;
  }
  if (cut === 'short' && total(pages) < lim.min + 1) { shortTwo = true; const keepPer = new Map(perMin); perMin.clear(); const two = pagesOf(chosen); if (total(two) > lim.max) { perMin.clear(); keepPer.forEach((v, k) => perMin.set(k, v)); } if (total(two) <= lim.max) pages = two; else shortTwo = false; }
  const t0 = total(pages), reading = t0 - fixed - glides(chosen), want = lim.min + 0.7; // (round 14: frame rounding and the cut never land under the minimum)
  const stretch = t0 < want ? Math.min(isLongish(cut) ? Infinity : 2.2, /* (round 14: Shorts ≥ 24 s) */ 1 + (want - t0) / Math.max(0.1, reading)) : 1;
  return layFrames(chosen.map((s, i) => ({ min: s.min, title: s.titleA, titleB: s.titleB, chip: s.chip, pages: pages[i].map((p) => ({ ...p, s: p.s * stretch })) })), cut, toU, fromU,
    { ...fx, compare: true, peakMin, teaserMin: fx.teaserMin ?? peakMin ?? chosen[Math.min(1, chosen.length - 1)].min });
}

/** Lays out every frame: the hook, then for each moment a glide (the new caption fades in as it starts) and its
 *  caption pages for their reading time, the 24 h beat, the end card. Also the sound cues. */
/** Round 12 (critics 10-29 P1-1, 10-30 P1-6: "We can't tell when you're safe to drive." under ALCOHOL GONE read as a
 *  contradiction): that card's label is "After drinking". */
const kicker = (title: string | undefined, cap: string | undefined) => (title && cap && /safe to drive/i.test(cap) && /gone/i.test(title) ? 'After drinking' : title);
function layFrames(stops: { min: number; title?: string; titleB?: string; chip?: string; pages: { cap: string; capB?: string; s: number }[] }[], cut: Cut,
  toU: (m: number) => number, fromU: (u: number) => number, fx: PlanFx = {}): Plan {
  const frames: VFrame[] = [], cues: Cue[] = [], pageList: Page[] = [];
  const F = (s: number) => Math.max(1, Math.round(s * FPS));
  const tNow = () => frames.length / FPS;
  // INTRO (2026-10-24 creative spec §2.2): a cold open on the story's peak (frame 0 = the thumbnail), a rewind to
  // +0:00, then the first sip. The rest of the intro plays the swallow while the hook is read.
  const nIntro = F(INTRO_S[cut]), nTeaser = F(TEASER_S), nRewind = F(REWIND_S), nPre = Math.min(nIntro - 1, nTeaser + nRewind);
  const teaserMin = Math.max(0, Math.min(1440, fx.teaserMin ?? 0));
  const holdN = (i: number) => stops[i].pages.reduce((a, p) => a + F(p.s), 0) + (i === 0 ? nIntro - nPre : 0);
  // while a moment is on screen the day drifts on towards the next moment (DRIFT of the way on the day axis), so
  // the drink keeps moving and the clock ticks; the first sip runs on to the stomach
  const driftTo = (i: number) => {
    const s = stops[i], next = stops[i + 1]?.min ?? 1440;
    if (s.min >= 1440) return s.min;
    if (i === 0) return fromU(Math.min(toU(Math.min(next, 3)), toU(s.min) + DRIFT_FIRST * (toU(next) - toU(s.min))));
    // (round 12, critic P0-3: the clock must not stand still under the cards): at least one minute of the day per
    // ~4.5 s of reading, never more than half the way to the next moment
    const share = fromU(toU(s.min) + DRIFT * (toU(next) - toU(s.min)));
    return Math.max(share, s.min + Math.min(0.5 * (next - s.min), holdN(i) / FPS / 4.5));
  };
  // (round 12: even in minutes, so the clock ticks at an even pace while the cards are read)
  const at = (i: number, k: number) => { const n = Math.max(1, holdN(i)); return stops[i].min + (driftTo(i) - stops[i].min) * Math.min(1, k / n); };
  cues.push({ t: 0, kind: 'start' });
  cues.push({ t: 0, kind: 'teaser' });
  for (let i = 0; i < nIntro; i++) {
    const t = tNow();
    if (i === nTeaser) cues.push({ t, kind: 'rewind' });
    if (i === nPre) { cues.push({ t, kind: 'sip' }); if (fx.compare) cues.push({ t, kind: 'guess' }); }
    const m = i < nTeaser ? teaserMin : i < nPre ? fromU(toU(teaserMin) * (1 - ease((i - nTeaser + 1) / nRewind))) : stops.length ? at(0, i - nPre) : 0;
    frames.push({ phase: 'intro', m, t, capA: 0, k: i / nIntro, stop: i < nTeaser ? teaserMin : stops[0]?.min ?? 0,
      beat: i < nTeaser ? 'teaser' : i < nPre ? 'rewind' : 'hook', hk: i < nPre ? 0 : stops.length ? (i - nPre) / Math.max(1, holdN(0)) : 0 });
  }
  let prevMin = 0, prevPage: { cap: string; capB?: string } | undefined, prevStop: { min: number; title?: string; titleB?: string } | null = stops[0] ?? null;
  // GLIDE: the words of the moment that ends leave (0.25 s), and while the day runs on, a "NEXT" chip names the
  // moment ahead (an open loop, §2.4). Its own words appear only when it is reached, so a card never says "now"
  // before its time.
  const glide = (from: number, to: number, nextStop: { min: number; title?: string; chip?: string } | null) => {
    // (round 14, critic DC-1: a glide is never longer than GLIDE_MAX_S: it is a stretch without words)
    const base = moveS(toU, from, to) * (cut === 'short' ? SHORT_GLIDE_K : 1);
    const n = F(Math.min(Math.max(GLIDE_MAX_S, base), base * (from >= (fx.peakMin ?? 0) ? fx.glideK ?? 1 : fx.glideK0 ?? 1))), out = F(0.25); // (round 13: only after the impact, which stays early)
    const g0 = frames.length;
    cues.push({ t: tNow(), kind: 'move', data: { v: Math.round(to - from) } }); // (round 9: how much of the day this glide skips, for the sound)
    const chip = !!nextStop?.title && (n / FPS >= NEXT_MIN_S || nextStop.min >= 1440); // (the day's end is always named)
    if (nextStop && chip) cues.push({ t: tNow() + 0.15, kind: 'next', data: { label: nextStop.title, v: nextStop.min } });
    for (let i = 1; i <= n; i++) {
      const m = fromU(toU(from) + (toU(to) - toU(from)) * ease(i / n));
      frames.push({ phase: 'main', m, t: tNow(), cap: prevPage?.cap, capB: prevPage?.capB, title: prevStop?.title, titleB: prevStop?.titleB, capA: 1,
        plateA: 1 - smooth01(i / out), k: 0, stop: nextStop?.min ?? to, beat: 'glide', from,
        ...(nextStop?.title && chip ? { next: { min: nextStop.min, title: nextStop.chip ?? nextStop.title } } : {}) });
    }
    return g0;
  };
  // the moment the peak arrives (the impact), and the riser 1.6 s before it (§2.5)
  const peakIdx = fx.peakMin === undefined ? -1 : nearestStop(stops.map((s) => s.min), fx.peakMin, toU);
  let pg = 0; const PG_N = F(2.6);
  stops.forEach((s, i) => {
    if (i > 0) glide(prevMin, s.min, s);
    if (i === peakIdx && i > 0) { const t = tNow(); cues.push({ t: Math.max(nPre / FPS + 0.2, t - RISER_S), kind: 'riser' }, { t, kind: 'peak', data: { v: s.min } }); }
    let k = i === 0 ? nIntro - nPre : 0;
    s.pages.forEach((p, j) => {
      const n = F(p.s), tease = p.cap.startsWith(TEASE_PREFIX) || p.cap.startsWith(TEASE_PREFIX2);
      cues.push({ t: tNow(), kind: j === 0 ? 'stop' : 'page' });
      if (tease) cues.push({ t: tNow(), kind: 'next', data: { label: 'tease' } });
      pageList.push({ stop: s.min, text: p.cap, textB: p.capB, s: n / FPS });
      pg++;
      for (let f = 0; f < n; f++, k++) frames.push({ phase: 'main', m: at(i, k), t: tNow(), cap: p.cap, capB: p.capB, title: kicker(s.title, p.cap), titleB: kicker(s.titleB, p.capB), capA: Math.min(1, (f + 1) / F(READ.fade)), k: 0, stop: s.min, beat: 'hold', hk: k / Math.max(1, holdN(i)), pg: pg + Math.floor(f / PG_N), ...(tease ? { tease: true } : {}) });
      pg += Math.floor((n - 1) / PG_N);
      prevPage = p;
    });
    prevStop = s; prevMin = driftTo(i);
  });
  // the 24 h beat: glide to the end of the day, then a short look at the body at 24 h (no words to read)
  const lastStop = stops[stops.length - 1], last = lastStop?.pages.slice(-1)[0];
  const endsAtDay = (lastStop?.min ?? 0) >= 1440;
  if (!endsAtDay) {
    const g0 = glide(prevMin, 1440, { min: 1440, title: DAY_END_TITLE }); cues.push({ t: tNow(), kind: 'stop' });
    for (let i = g0; i < frames.length; i++) frames[i].stop = 1440;
  }
  // round 11 (research R1): the payoff beat at +24:00, body in frame: the last words leave for "AFTER 24 HOURS", the
  // day's lights come on one by one (the comparison's verdict lands first), then a "day done" ring
  const tCeleb = tNow(), nCeleb = F(CELEB_S[cut]);
  for (let k = 0; k < nCeleb; k++) frames.push({ phase: 'main', m: 1440, t: tNow(), cap: k < F(0.25) ? last?.cap : undefined, capB: k < F(0.25) ? last?.capB : undefined, title: lastStop?.title, titleB: lastStop?.titleB, capA: k < F(0.25) ? 1 - k / F(0.25) : 0, plateA: 0, k: 0, stop: endsAtDay ? lastStop.min : 1440, beat: 'end', celeb: k / nCeleb, pg: pg + 1 });
  if (fx.compare && fx.verdict) cues.push({ t: tCeleb + 0.3, kind: 'verdict', data: { label: fx.verdictTrophy ? 'trophy' : 'plain' } });
  const lFrom = fx.compare ? CMP_LIGHTS_FROM_S : LIGHTS_FROM_S, lStep = fx.compare ? CMP_LIGHTS_STEP_S : LIGHTS_STEP_S;
  const lights = fx.lights ?? [];
  lights.forEach((level, i) => cues.push({ t: tCeleb + lFrom + i * lStep, kind: 'lights', data: { level, v: i, side: fx.compare ? ((i % 2) as 0 | 1) : undefined } }));
  cues.push({ t: Math.min(tCeleb + lFrom + lights.length * lStep + 0.1, tCeleb + CELEB_S[cut] - 0.5), kind: 'day', data: { label: fx.calmDay ? 'calm' : 'bright' } });
  // end card (short: ≤ 2.5 s; its last line hands over to the first frame: the loop)
  const tOut = tNow();
  cues.push({ t: tOut, kind: 'outro' });
  const nOut = F(outroSeconds(cut, !!fx.compare));
  for (let i = 0; i < nOut; i++) frames.push({ phase: 'outro', m: 1440, t: tNow(), capA: 0, k: i / nOut, stop: 1440, beat: 'end' });
  cues.push({ t: tNow(), kind: 'end' });
  // the clock: day position and speed of every frame
  frames.forEach((f, i) => {
    f.u = toU(f.m);
    const a = frames[Math.max(0, i - 1)].m, b = frames[Math.min(frames.length - 1, i + 1)].m;
    f.rate = ((b - a) / Math.max(1, Math.min(frames.length - 1, i + 1) - Math.max(0, i - 1))) * FPS;
  });
  // NIGHT time-lapse (§2.6): between 22:00 and 07:00 on the clock the picture gets a night tone and the music goes
  // under water; it eases in and out over 0.8 s, and only a night of at least 1.5 s counts
  if (fx.drinkAtMin !== undefined) {
    const wake = fx.wakeMin ?? 7 * 60;
    const isNight = (f: VFrame) => { const c = (((fx.drinkAtMin! + f.m) % 1440) + 1440) % 1440; return f.phase !== 'outro' && f.m > 1 && (c >= 22 * 60 || c < wake); };
    const raw = frames.map(isNight);
    // drop nights that are too short to read (no flicker)
    for (let i = 0; i < raw.length;) {
      if (!raw[i]) { i++; continue; }
      let j = i; while (j < raw.length && raw[j]) j++;
      if (j - i < F(1.5)) for (let x = i; x < j; x++) raw[x] = false;
      else { cues.push({ t: i / FPS, kind: 'night', data: { v: 1 } }); if (j < raw.length) cues.push({ t: j / FPS, kind: 'night', data: { v: 0 } }); }
      i = j;
    }
    let v = 0;
    frames.forEach((f, i) => { v += ((raw[i] ? 1 : 0) - v) * Math.min(1, 1 / F(0.8) * 2); f.night = Math.max(0, Math.min(1, v)); });
  }
  // HEART (round 4): while the heart light is yellow or red for at least 2 s of video, a calm heartbeat (≈ 55/min,
  // never faster: it must not suggest a racing pulse) and a soft glow on the heart
  if (fx.heart) {
    const on = frames.map((f) => f.phase !== 'outro' && f.beat !== 'teaser' && f.beat !== 'rewind' && (fx.heart![Math.round(Math.min(1440, Math.max(0, f.m)))] ?? 0) >= 1);
    for (let i = 0; i < on.length;) {
      if (!on[i]) { i++; continue; }
      let j = i; while (j < on.length && on[j]) j++;
      if (j - i >= F(2)) { cues.push({ t: i / FPS, kind: 'heart', data: { v: 1 } }, { t: j / FPS, kind: 'heart', data: { v: 0 } }); }
      i = j;
    }
  }
  // RACE (comparison, §4.1): the first frame each side is done (e.g. out of the stomach)
  if (fx.race) {
    ([fx.race.a, fx.race.b] as (ArrayLike<number> | undefined)[]).forEach((curve, side) => {
      if (!curve) return;
      const f = frames.findIndex((fr) => fr.phase === 'main' && curve[Math.min(1440, Math.max(0, Math.round(fr.m)))] >= 1);
      if (f >= 0) cues.push({ t: f / FPS, kind: 'race', data: { side: side as 0 | 1 } });
    });
  }
  // SURGE (round 10): the first frame while the drink's main substance climbs in the blood (model minutes) that is
  // clear of the sip, the riser and the impact (one big event at a time), and before the impact (it builds to it)
  if (fx.surge) {
    const sg = fx.surge, busy = cues.filter((c) => c.kind === 'sip' || c.kind === 'peak' || c.kind === 'verdict').map((c) => c.t);
    const riser = cues.find((c) => c.kind === 'riser'), peak = cues.find((c) => c.kind === 'peak');
    // (and 0.9 s from a new moment's organ hit and from the first heartbeat: never more than 3 glows in a second)
    const near = cues.filter((c) => c.kind === 'stop' || (c.kind === 'heart' && c.data?.v === 1)).map((c) => c.t);
    const free = (t: number) => t < tOut - 1 && !(peak && t > peak.t) && !(riser && peak && t >= riser.t - SURGE_CLEAR_S && t <= peak.t + SURGE_CLEAR_S) && busy.every((b) => Math.abs(b - t) >= SURGE_CLEAR_S)
      && near.every((b) => Math.abs(b - t) >= 0.9);
    const inWin = (fr: VFrame) => fr.phase === 'main' && fr.beat !== 'teaser' && fr.beat !== 'rewind' && fr.m >= sg.min && fr.m <= sg.max;
    const f = frames.findIndex((fr, i) => inWin(fr) && free(i / FPS));
    if (f >= 0) cues.push({ t: f / FPS, kind: 'surge', data: { label: sg.kind, side: sg.side } });
    // the climb happens during the glide into the peak (a drink: first sip → peak): the surge rides the riser instead,
    // building with it up to the impact (`v` = seconds to the impact; the sound leaves the riser alone)
    else if (riser && peak && frames.some((fr, i) => inWin(fr) && i / FPS >= riser.t - 0.5 && i / FPS <= peak.t)) cues.push({ t: riser.t, kind: 'surge', data: { label: sg.kind, side: sg.side, v: peak.t - riser.t } });
  }
  // the comparison's open loop at about half time: "Answer at 24 h." (§3.3)
  if (fx.compare && isLongish(cut)) {
    const st = cues.filter((c) => c.kind === 'stop' && c.t > tOut * 0.35 && c.t < tOut * 0.65).sort((x, y) => Math.abs(x.t - tOut * 0.5) - Math.abs(y.t - tOut * 0.5))[0];
    // (round 7, critic B4: "Answer at 24 h." came after "First out: Water." was shown): only before the answer
    const ans = cues.find((c) => c.kind === 'peak');
    if (st && !(ans && ans.t <= st.t + 0.3)) cues.push({ t: st.t + 0.3, kind: 'next', data: { label: 'tease' } });
  }
  // MICRO-BEATS (§2.3): no stretch of more than 3 s without something new on screen (camera turn, organ pulse,
  // gauge tick); never two within 2 s
  const visual = (c: Cue) => c.kind !== 'start' && c.kind !== 'end' && c.kind !== 'night' && c.kind !== 'heart';
  const outroT = tOut;
  let times = cues.filter(visual).map((c) => c.t).filter((t) => t < outroT).sort((a, b) => a - b);
  times = [0, ...times, outroT];
  let rot = 0;
  for (let i = 1; i < times.length; i++) {
    let a = times[i - 1];
    const b = times[i];
    while (b - a > MICRO_GAP_S) {
      const t = Math.min(a + Math.max(2.0, (b - a) / Math.ceil((b - a) / MICRO_GAP_S)), b - 1.0);
      if (t - a < 1.95 && b - t < 1.95) break; // (1.95: float-safe "never two within 2 s")
      cues.push({ t, kind: 'micro', data: { v: rot++ % 3 } });
      a = t;
    }
  }
  cues.sort((x, y) => x.t - y.t);
  const stopMins = [...stops.map((s) => s.min), ...(!endsAtDay ? [1440] : [])];
  return { frames, stops: stopMins, stopsU: stopMins.map(toU), pages: pageList, cues, seconds: frames.length / FPS, introS: nIntro / FPS, outroS: nOut / FPS, peakT: cues.find((c) => c.kind === 'peak')?.t };
}
const smooth01 = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
/** Index of the stop nearest `min` on the day axis (within 6 % of the day), or -1. */
function nearestStop(mins: number[], min: number, toU: (m: number) => number): number {
  let best = -1, d = 0.06;
  mins.forEach((m, i) => { const x = Math.abs(toU(m) - toU(min)); if (x <= d) { d = x; best = i; } });
  return best;
}
