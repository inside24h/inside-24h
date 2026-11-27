// Phase 4h (critique 2026-11-19: the unit tests said "region caps <= 12/9/6 s, end card >= 2.5 s, BAC limits with every
// BAC" while the rendered videos showed 12-28 s on one organ, ~2.25 s end cards and a BAC chip without limits; the
// tests checked a model of the plan, not what was drawn). The video's TIMELINE: what each frame really draws, recorded
// by the drawing code itself (share.ts drawBodyFrame / drawCmp call teleFrame with the words they put on the frame,
// the clock they show and the end card's opacity) plus what the body shows (the region the camera frames and the
// organs lit, set by the exporter for the frame: teleScene). The app records it only while the QA render harness asks
// for it (AppV4 #render=, scripts/render-sample.mjs writes <video>.timeline.json); the unit tests record it from the
// SAME drawing functions in a headless frame loop (video-telemetry.test.ts), and both are judged by checkTimeline here
// (scripts/qc-render.mjs bundles this file), so the tests and the rendered videos can no longer disagree.
import { perceivedRuns, regionMaxS, REGION, regionOf, topicRegion, type Shot } from './video-cam';
import { cardNamed, SEG_FOCUS_V } from './video-body';
import { hookAnswerIssue } from './video-hook';
import { BED_TITLE, genericCard, MORNING_NO_FACT, MORNING_TITLE, TOD_MIN } from './video-beats';
import { alikeCards, nearSame, plainLatin, sameWords } from './video-names';

/** One word block drawn on a frame (share.ts text(): one line of words), in video pixels. */
export interface TeleBox { x0: number; y0: number; x1: number; y1: number; text: string; deco?: boolean; a?: number;
  /** phase P2: the story number key this word block shows (an item-specific number, story/types StoryNumber.key, or a
   *  live model value 'live:…'), and the visual it is part of (a segment, the curve panel, the end frame…) */ k?: string; v?: string;
  /** phase P2: what the block is for the v5 checks ('bacRow' the compact limits row, 'bacFull' the full legal block,
   *  'q' the question, 'guess', 'reveal', 'action', 'score', 'cheat', 'sources') */ r?: string }
/** What the body shows on a frame: the region the camera frames ('body' = whole body), the organs lit for the card
 *  (and, while the first bite goes down, where it is), the region of the card's topic. Comparisons: both sides. */
export interface TeleScene { shot: string; lit: string[]; topic: string; /** the organ the first bite or sip is in while it goes down */ lead?: string; shotB?: string; litB?: string[]; topicB?: string }
export interface TeleFrame {
  /** seconds into the video */ t: number; phase: string; beat?: string;
  /** the clock as drawn ("+1:05"; absent when no clock is on screen) */ clock?: string;
  /** the card on screen ("TITLE | words") */ card?: string;
  /** phase 4j: the NEXT chip is on screen (the moment ahead, named with its time) */ next?: boolean;
  /** the regions the viewer perceives this frame to be about (perceivedOf) */ rs: string[];
  shot?: string; lit?: string[];
  /** the end card's opacity (1 = fully on screen, the loop's first frame not over it) */ end: number;
  /** text blocks that overlap another (both at least half opaque), "a × b" */ ov?: string[];
  /** every word block on the frame (every 3rd frame: 10 per second) */ texts?: TeleBox[];
  /** all words of the frame, joined (every frame that shows a blood alcohol number) */ bac?: string;
  /** phase P2 (every frame): the item-specific number keys drawn (tagged blocks, at least half opaque), the visuals
   *  that carry them, the v5 roles on screen (TeleBox.r), and a visual event starting on this frame (a cue: a new
   *  moment, page, impact, micro-beat, graph or reveal) */
  nums?: string[]; vis?: string[]; roles?: string[]; ev?: true;
}
/** Phase P2: a story number as the timeline knows it (for matching the words drawn: an untagged "35 g of sugar"). */
export interface TeleNum { key: string; value: number; unit: string; range?: [number, number] }
/** The item-specific, non-zero numbers of a story (story/foodStory numbersOf), as the timeline keeps them; `prefix`
 *  marks a comparison's second side ("b:"). */
export const teleNumsOf = (N: Record<string, { key: string; value: number; unit: string; range?: [number, number]; itemSpecific: boolean }>, prefix = ''): TeleNum[] =>
  Object.values(N).filter((n) => n.itemSpecific && n.value > 0 && Number.isFinite(n.value)).map((n) => ({ key: prefix + n.key, value: n.value, unit: n.unit, ...(n.range ? { range: n.range } : {}) }));
export interface Timeline { v: 1; kind: 'single' | 'compare'; cut: string; seconds: number; fps: number; hook: string; name: string; frames: TeleFrame[];
  /** phase P2: the item's story numbers (a comparison: both sides, the second side's keys prefixed "b:"), and what the
   *  story offers (`guess`: its question has 3 options; `cheat`: how many cheat-sheet lines it has; `alcohol`) */
  nums?: TeleNum[]; story?: { guess: boolean; cheat: number; alcohol: boolean } }
export interface TeleMeta { kind: 'single' | 'compare'; cut: string; seconds: number; fps: number; hook: string; name: string; nums?: TeleNum[]; story?: Timeline['story'] }

let rec: { meta: TeleMeta; frames: TeleFrame[]; scene: TeleScene | null } | null = null;
/** Starts recording a video's timeline (the exporter, before its first frame). */
export function teleStart(meta: TeleMeta) { rec = { meta, frames: [], scene: null }; }
export const teleOn = () => !!rec;
/** What the body shows on the frame about to be drawn (the exporter, after it has set the camera and the glow). */
export function teleScene(s: TeleScene) { if (rec) rec.scene = s; }
/** The timeline so far, and recording stops. */
export function teleStop(): Timeline | null { const r = rec; rec = null; return r ? { v: 1, ...r.meta, frames: r.frames } : null; }

/** A blood alcohol number on the frame (a range in % or ‰). */
export const BAC_NUMBER = /\bBAC\s+\d|\d\s*‰/;
const opaque = (b: TeleBox) => (b.a ?? 1) >= 0.5 && !b.deco;
/** Two word blocks overlap when they share more than 3 px both ways. */
export function overlaps(boxes: readonly TeleBox[]): string[] {
  const out: string[] = [], bs = boxes.filter(opaque);
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
    const p = bs[i], q = bs[j];
    if (Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0) > 3 && Math.min(p.y1, q.y1) - Math.max(p.y0, q.y0) > 3) out.push(`${p.text} × ${q.text}`);
  }
  return out;
}
/** The regions a frame is perceived to be about: its card's topic, the organs lit for it, the region filmed. */
export function perceivedOf(s: Pick<TeleScene, 'shot' | 'lit' | 'topic' | 'lead'> | null): string[] {
  if (!s) return [];
  // (the organs lit for a card read as the place most of them are in: "small intestine" lights the duodenum too)
  const n = new Map<string, number>();
  for (const o of s.lit) if (REGION[o]) n.set(REGION[o], (n.get(REGION[o]) ?? 0) + 1);
  const lit = [...n].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  return [...new Set([s.topic, lit, s.lead ? REGION[s.lead] ?? '' : '', s.shot])].filter((r) => !!r && r !== 'body' && r !== '?');
}
/** The drawing code, once a frame is drawn: its words, its clock, its card and the end card's opacity. */
export function teleFrame(fr: { t: number; phase: string; beat?: string }, d: { boxes: readonly TeleBox[]; clock?: string; card?: string; next?: boolean; end: number; ev?: boolean }) {
  if (!rec) return;
  const n = rec.frames.length, s = rec.scene;
  const rs = [...new Set([...perceivedOf(s), ...(s && s.shotB !== undefined ? perceivedOf({ shot: s.shotB, lit: s.litB ?? [], topic: s.topicB ?? '' }) : [])])];
  const f: TeleFrame = { t: Math.round(fr.t * 1000) / 1000, phase: fr.phase, ...(fr.beat ? { beat: fr.beat } : {}), ...(d.clock ? { clock: d.clock } : {}), ...(d.card ? { card: d.card } : {}), ...(d.next ? { next: true } : {}),
    rs, ...(s ? { shot: s.shotB !== undefined ? `${s.shot}|${s.shotB}` : s.shot, lit: [...s.lit, ...(s.lead ? [s.lead] : []), ...(s.litB ?? [])] } : {}), end: Math.round(d.end * 1000) / 1000 };
  const ov = overlaps(d.boxes);
  if (ov.length) f.ov = ov;
  const words = d.boxes.filter((b) => (b.a ?? 1) >= 0.5).map((b) => b.text).join(' ');
  if (BAC_NUMBER.test(words)) f.bac = words;
  if (n % 3 === 0) f.texts = d.boxes.map((b) => ({ x0: Math.round(b.x0), y0: Math.round(b.y0), x1: Math.round(b.x1), y1: Math.round(b.y1), text: b.text, ...(b.deco ? { deco: true } : {}), ...((b.a ?? 1) < 1 ? { a: Math.round((b.a ?? 1) * 100) / 100 } : {}),
    ...(b.k ? { k: b.k } : {}), ...(b.v ? { v: b.v } : {}), ...(b.r ? { r: b.r } : {}) }));
  // (phase P2: the tagged numbers, their visuals and the v5 roles, on every frame)
  const op = d.boxes.filter((b) => (b.a ?? 1) >= 0.5);
  const nums = [...new Set(op.filter((b) => b.k).flatMap((b) => b.k!.split(',')))], vis = [...new Set(op.filter((b) => b.k && b.v).map((b) => b.v!))], roles = [...new Set(op.filter((b) => b.r).map((b) => b.r!))];
  if (nums.length) f.nums = nums;
  if (vis.length) f.vis = vis;
  if (roles.length) f.roles = roles;
  if (d.ev) f.ev = true;
  rec.frames.push(f);
}

/** A single video's scene for a frame, as the exporter films it: `shot` (video-cam shotOf), `lead` (the part of the
 *  route most of the food or drink is in, AppV4 leadRef). The organs lit are the ones the card names (lit above all
 *  else, video-body bodyGlowAt), and while the first bite or sip goes down, where it is (the stomach glows with it). */
export function sceneOf(fr: { phase: string; beat?: string; stop?: number; m: number; t: number; title?: string; cap?: string; hk?: number; pipe?: number; next?: { min: number; title: string }; lull?: boolean; from?: number; k: number },
  chapters: { min: number; title: string; focus?: string | null }[], shot: Shot, lead: string | null): TeleScene {
  // (the 24 h beat counts as well: what the camera frames then is seen; it has no card and lights no organ for one)
  const main = fr.phase === 'main' && fr.beat !== 'teaser' && fr.beat !== 'rewind', day = fr.beat === 'end';
  const named = day ? [] : cardNamed(fr as Parameters<typeof cardNamed>[0]);
  const first = main && !day && (fr.stop ?? 0) === 0 && lead ? SEG_FOCUS_V[lead as keyof typeof SEG_FOCUS_V] : undefined;
  return { shot: !main ? '' : shot.zoom === 'wide' || shot.zoom === 'body' || !shot.focus.length ? 'body' : regionOf(shot.focus), lit: main ? named : [],
    topic: main ? topicRegion(fr as Parameters<typeof topicRegion>[0], chapters) : '', ...(first ? { lead: first } : {}) };
}

// ---- the checks (the unit tests and npm run qc:render) ----
export const END_CARD_MIN_S = 2.5, CLOCK_MOVES_BY_S = 3.0;
export interface TeleIssue { check: string; text: string }
const fmt = (x: number) => x.toFixed(1);
/** Everything the timeline must show: perceived stays under their cap, the end card fully on screen >= 2.5 s, no word
 *  block over another, every blood alcohol number with both driving limits and the warning, the clock moving within
 *  the first seconds, and the hook's question answered by what is on screen. */
export function checkTimeline(tl: Timeline): TeleIssue[] {
  const out: TeleIssue[] = [], dt = 1 / tl.fps, fs = tl.frames;
  // 1) perceived stays
  const seq = fs.filter((f) => f.phase === 'main' && f.beat !== 'teaser' && f.beat !== 'rewind').map((f) => ({ t: f.t, rs: f.rs }));
  const cap = regionMaxS(tl.seconds) + dt + 1e-6;
  for (const r of perceivedRuns(seq, dt).filter((x) => x.s > cap).sort((a, b) => a.at - b.at)) out.push({ check: 'region cap', text: `${fmt(r.s)} s on ${r.r} from ${fmt(r.at)} s (cap ${regionMaxS(tl.seconds)} s)` });
  // 2) the end card, fully on screen
  let best = 0, run = 0;
  for (const f of fs) { if (f.end >= 0.98) { run += dt; best = Math.max(best, run); } else run = 0; }
  if (best < END_CARD_MIN_S - 1e-6) out.push({ check: 'end card', text: `fully on screen ${best.toFixed(2)} s (at least ${END_CARD_MIN_S} s)` });
  // 3) no words over words
  const ov = fs.filter((f) => f.ov?.length);
  if (ov.length) out.push({ check: 'text overlap', text: `${ov.length} frames, first at ${fmt(ov[0].t)} s: ${ov[0].ov![0]}` });
  // 4) blood alcohol: both limits and the warning with every number
  const bad = fs.filter((f) => f.bac && !(/0\.08\s*%/.test(f.bac) && /0\.05\s*%/.test(f.bac) && /Never safe to\s+drive/.test(f.bac)));
  if (bad.length) out.push({ check: 'BAC limits', text: `${bad.length} frames, first at ${fmt(bad[0].t)} s: "${bad[0].bac!.slice(0, 160)}"` });
  // 5) the clock moves within the first seconds of the story (no long frozen opening)
  const clocked = fs.filter((f) => f.phase === 'main' && f.clock);
  if (clocked.length) {
    const t0 = clocked[0].t, c0 = clocked[0].clock, moved = clocked.find((f) => f.clock !== c0);
    if (!moved || moved.t - t0 > CLOCK_MOVES_BY_S + dt) out.push({ check: 'clock', text: `${c0} from ${fmt(t0)} s until ${moved ? fmt(moved.t) : 'the end'} s (moves within ${CLOCK_MOVES_BY_S} s)` });
  }
  // 6) the hook's question is answered on screen
  // (the headline repeats the hook at the top all through: its own lines are not an answer)
  const hookFlat = tl.hook.replace(/\s+/g, ' ');
  const said = [...new Set(fs.filter((f) => f.phase !== 'intro').flatMap((f) => [f.card ?? '', ...(f.texts ?? []).map((b) => b.text)]))].filter((x) => x && !hookFlat.includes(x.trim())).join(' ');
  const endSaid = [...new Set(fs.filter((f) => f.phase === 'outro').flatMap((f) => (f.texts ?? []).map((b) => b.text)))].filter((x) => x && !hookFlat.includes(x.trim())).join(' ');
  const h = hookAnswerIssue(tl.hook, said, endSaid);
  if (h) out.push({ check: 'hook answered', text: h });
  out.push(...checkTimeline4j(tl));
  out.push(...checkTimeline4k(tl));
  out.push(...checkTimeline4l(tl));
  out.push(...checkTimeline5(tl));
  return out;
}
// ---- Phase 4j (critique 2026-11-17, v31 samples: never-tested foods). What the critic saw, checked on what is drawn ----
/** M5: the opening's clock moves at least this many minutes of the day within CLOCK_MOVES_BY_S of the story's first
 *  frame, and stands on one value at most OPEN_STILL_S under the first moment's cards (before its first glide). */
export const CLOCK_OPEN_MIN = 3, OPEN_STILL_S = 2;
/** M6: the longest stretch of the story with neither a card nor the NEXT chip (the 24 h beat aside). */
export const CARDLESS_MAX_S = 2;
/** "+1:05" → 65 (minutes since the first sip); NaN for anything else. */
export const clockMinutes = (c: string | undefined) => { const m = /^\+?(\d+):(\d\d)$/.exec((c ?? '').trim()); return m ? Number(m[1]) * 60 + Number(m[2]) : NaN; };
const NAME_SKIP = new Set(['of', 'with', 'and', 'the', 'ml', 'portion', 'portions', 'slice', 'slices', 'cup', 'cups', 'glass', 'can', 'bottle', 'bowl', 'serving', 'piece', 'pieces', 'whole', 'small', 'medium', 'large', 'one', 'half', 'made', 'cooked', 'plain', 'without', 'over']);
/** M4: a hook names the food (a word of its name, plural or not), so its first number is never said before the food. */
export function hookNamesFood(hook: string, name: string): boolean {
  const stem = (w: string) => w.slice(0, Math.max(3, Math.min(5, w.length - 1)));
  const ws = plainLatin(name).toLowerCase().replace(/\([^)]*\)/g, ' ').split(/[^a-z]+/).filter((w) => w.length >= 3 && !NAME_SKIP.has(w));
  const hw = plainLatin(hook).toLowerCase().split(/[^a-z]+/).filter(Boolean);
  return !ws.length || ws.some((w) => hw.some((x) => x.startsWith(stem(w))));
}
/** The phase 4j checks: the opening's clock (M5), no card that repeats a title on screen (M5), no long stretch without a
 *  card (M6), an end card's peak is the highest the video shows (M2), the hook names the food (M4). */
export function checkTimeline4j(tl: Timeline): TeleIssue[] {
  const out: TeleIssue[] = [], dt = 1 / tl.fps, fs = tl.frames;
  // M5: the opening's clock
  const clocked = fs.filter((f) => f.phase === 'main' && f.clock);
  if (clocked.length) {
    const t0 = clocked[0].t, v0 = clockMinutes(clocked[0].clock), by = [...clocked].reverse().find((f) => f.t <= t0 + CLOCK_MOVES_BY_S + dt);
    const d = by ? clockMinutes(by.clock) - v0 : 0;
    if (!(d >= CLOCK_OPEN_MIN)) out.push({ check: 'clock open', text: `${clocked[0].clock} at ${fmt(t0)} s, ${by?.clock ?? '?'} ${CLOCK_MOVES_BY_S} s later (at least ${CLOCK_OPEN_MIN} min)` });
    const g = fs.findIndex((f) => f.phase === 'main' && f.beat === 'glide');
    const open = clocked.filter((f) => g < 0 || f.t < fs[g].t);
    for (let i = 0, j = 0; i < open.length; i = j) {
      for (j = i; j < open.length && open[j].clock === open[i].clock; j++);
      const s = open[j - 1].t - open[i].t + dt;
      if (s > OPEN_STILL_S + dt) { out.push({ check: 'clock open', text: `${open[i].clock} stands ${fmt(s)} s from ${fmt(open[i].t)} s (at most ${OPEN_STILL_S} s)` }); break; }
    }
  }
  // M5: no card repeats a title on screen (a line of the hook, the headline; a comparison's side names)
  const titles = [...tl.hook.split('\n'), ...(tl.kind === 'compare' ? tl.name.split(' vs ') : [])].map((x) => x.trim()).filter(Boolean);
  const dups = new Set<string>();
  for (const f of fs) if (f.phase === 'main' && f.card) for (const c of f.card.split(' || ')) { const w = c.includes(' | ') ? c.slice(c.indexOf(' | ') + 3) : c; if (titles.some((x) => sameWords(w, x))) dups.add(c); }
  if (dups.size) out.push({ check: 'card repeats title', text: [...dups].join(' / ') });
  // M6: no stretch of the story without a card or the NEXT chip
  {
    let a = -1, prev = -1, worst = 0, at = 0;
    const close = () => { if (a >= 0) { const s = prev - a + dt; if (s > worst) { worst = s; at = a; } } a = -1; };
    for (const f of fs.filter((x) => x.phase === 'main' && x.beat !== 'teaser' && x.beat !== 'rewind' && x.beat !== 'end')) {
      const empty = !f.card && !f.next;
      if (empty && a >= 0 && f.t - prev < 2 * dt) { prev = f.t; continue; }
      close();
      if (empty) { a = f.t; prev = f.t; }
    }
    close();
    if (worst > CARDLESS_MAX_S + dt + 1e-6) out.push({ check: 'no card', text: `${fmt(worst)} s without a card from ${fmt(at)} s (at most ${CARDLESS_MAX_S} s)` });
  }
  // M2: an end card's "Peak: N unit noun" is the highest N of that noun the video shows
  const endText = fs.filter((f) => f.phase === 'outro').flatMap((f) => (f.texts ?? []).map((b) => b.text)).join(' ').replace(/\s+/g, ' ');
  // (and "Peak" names a highest value, never a moment's: "Peak: At bedtime: 45 mg of caffeine")
  const pkWord = /Peak:\s*(?:At|Half|In your|Your|Then)\b[^·|]*/.exec(endText);
  if (pkWord) out.push({ check: 'peak', text: `end card "${pkWord[0].trim()}" is no peak` });
  const pk = /Peak:\s*\+?(\d+(?:\.\d+)?)\s*(ml|mg|g)\s+([a-z]+)/i.exec(endText);
  if (pk) {
    const v = Number(pk[1]), re = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${pk[2]}\\s+${pk[3]}`, 'gi');
    let mx = 0;
    for (const f of fs) if (f.phase === 'main') for (const b of f.texts ?? []) for (const m of b.text.matchAll(re)) mx = Math.max(mx, Number(m[1]));
    if (mx > v + (v >= 10 ? 0.5 : 0.05)) out.push({ check: 'peak', text: `end card "Peak: ${pk[1]} ${pk[2]} ${pk[3]}", the video shows ${mx} ${pk[2]} ${pk[3]}` });
  }
  // M4: a single video's hook names the food
  if (tl.kind === 'single' && !hookNamesFood(tl.hook, tl.name)) out.push({ check: 'hook names food', text: `"${tl.hook.replace(/\n/g, ' / ')}" does not name ${tl.name}` });
  return out;
}
/** Numbers for a report: the longest perceived stay, the end card's full view, the clock's first move. */
export function teleSummary(tl: Timeline) {
  const dt = 1 / tl.fps, fs = tl.frames;
  const seq = fs.filter((f) => f.phase === 'main' && f.beat !== 'teaser' && f.beat !== 'rewind').map((f) => ({ t: f.t, rs: f.rs }));
  const stay = perceivedRuns(seq, dt).reduce((b, x) => (x.s > b.s ? x : b), { s: 0, r: '', at: 0 });
  let best = 0, run = 0; for (const f of fs) { if (f.end >= 0.98) { run += dt; best = Math.max(best, run); } else run = 0; }
  const clocked = fs.filter((f) => f.phase === 'main' && f.clock), moved = clocked.find((f) => f.clock !== clocked[0]?.clock);
  return { longestStay: { s: Math.round(stay.s * 10) / 10, region: stay.r, at: Math.round(stay.at * 10) / 10, cap: regionMaxS(tl.seconds) }, endCardS: Math.round(best * 100) / 100,
    clockMovesAfterS: moved && clocked[0] ? Math.round((moved.t - clocked[0].t) * 10) / 10 : null, bacFrames: fs.filter((f) => f.bac).length, overlapFrames: fs.filter((f) => f.ov?.length).length };
}
// ---- Phase 4k (critique 2026-11-21, v33 samples: aperol spritz, spaghetti carbonara, vodka and energy drink) ----
// The 4j checks let two of their own defects through: "clock open" judged only the first 3 s of the story and the
// stands before the first glide (aperol stood at +0:10 to +0:11 from 9 to 17.5 s, carbonara at +1:29 for 9.6 s, both
// after it), and "card repeats title" asked for the very same words ("1 drink of aperol spritz." is not word for word
// "Aperol spritz: 14 g of alcohol."). These checks measure the whole story.
/** M1: the clock's pace, in every rolling PACE_WINDOW_S window from PACE_FROM_S into the video on: at least this many
 *  minutes of the day, by class (alcohol or caffeine act within minutes; a meal over hours). */
export const PACE_WINDOW_S = 6, PACE_FROM_S = 2, CLOCK_HOLD_MAX_S = 3;
export const PACE_MIN = { fast: 6, meal: 3 } as const;
/** The one deliberate, labelled pause: the day done ("24 HOURS LATER" / "AFTER 24 HOURS") at +24:00. */
export const PAUSE_CLOCK = '+24:00';
/** M2: a "NEXT MORNING" stretch with no fact of its own on screen at most this long. */
export const MORNING_MAX_S = 2.5;
/** A morning card that says nothing new: video-beats MORNING_NO_FACT. */
export { MORNING_NO_FACT };
const allWords = (tl: Timeline, phase?: string) => tl.frames.filter((f) => !phase || f.phase === phase).flatMap((f) => [f.card ?? '', ...(f.texts ?? []).map((b) => b.text)]).join(' ').replace(/\s+/g, ' ');
/** The pace class of a video, from what it draws: a blood alcohol number or caffeine is "fast", else "meal". */
export const paceClassOf = (tl: Timeline): keyof typeof PACE_MIN => (tl.frames.some((f) => f.bac) || /\bcaffeine\b/i.test(allWords(tl, 'main')) ? 'fast' : 'meal');
const cardBody = (c: string) => (c.includes(' | ') ? c.slice(c.indexOf(' | ') + 3) : c);
const cardHead = (c: string) => (c.includes(' | ') ? c.slice(0, c.indexOf(' | ')) : '');
/** A live counter, its number running with the clock (the lull's "TAKEN UP SO FAR | 28 of 164 kcal"): not a card that
 *  repeats, a gauge. */
const LIVE_CARD = /^(?:TAKEN UP SO FAR|BLOOD ALCOHOL|RIGHT NOW)$/i; // (phase P2: the lull's live curve value, video-story LIVE_TITLE) // (phase 4l: with alcohol the lull's gauge is the blood alcohol's way, video-body bacTrendAt)
/** The phase 4k checks: the clock's pace all through (M1), no card that nearly repeats a title or another card, no
 *  filler (a kcal card with alcohol, a NEXT chip naming the present, a kidney card without its number, a long empty
 *  "NEXT MORNING") (M2), alcohol with caffeine says the dose and what is left when the alcohol is gone (M3). */
export function checkTimeline4k(tl: Timeline): TeleIssue[] {
  const out: TeleIssue[] = [], dt = 1 / tl.fps, fs = tl.frames;
  // M1: the clock's pace (every window) and no clock value held over CLOCK_HOLD_MAX_S (the +24:00 pause aside)
  const story = fs.filter((f) => f.clock && f.phase !== 'outro' && f.beat !== 'teaser' && f.beat !== 'rewind' && f.beat !== 'end' && f.t >= PACE_FROM_S - 1e-6);
  if (story.length) {
    const cls = paceClassOf(tl), need = PACE_MIN[cls], tEnd = story[story.length - 1].t;
    let worst: { d: number; at: number; a: string; b: string } | null = null;
    for (let i = 0, j = 0; i < story.length; i++) {
      const f = story[i];
      if (f.clock === PAUSE_CLOCK || f.t + PACE_WINDOW_S > tEnd + dt) continue;
      if (j < i) j = i;
      while (j + 1 < story.length && story[j + 1].t <= f.t + PACE_WINDOW_S + 1e-6) j++;
      // (a window that reaches the day-done pause has arrived: the last glide eases into +24:00)
      if (story[j].clock === PAUSE_CLOCK) continue;
      const d = clockMinutes(story[j].clock) - clockMinutes(f.clock);
      if (d < need && (!worst || d < worst.d)) worst = { d, at: f.t, a: f.clock!, b: story[j].clock! };
    }
    if (worst) out.push({ check: 'clock pace', text: `${worst.a} → ${worst.b} in ${PACE_WINDOW_S} s from ${fmt(worst.at)} s (${cls}: at least ${need} min in every ${PACE_WINDOW_S} s)` });
    for (let i = 0, j = 0; i < story.length; i = j) {
      for (j = i + 1; j < story.length && story[j].clock === story[i].clock && story[j].t - story[j - 1].t < 2 * dt + 1e-6; j++);
      const s = story[j - 1].t - story[i].t + dt;
      // (phase 4l, critique 2026-11-22, minor: carbonara held +24:00 for 6.4 s, its "24 HOURS LATER" card and then the
      // day-done beat: +24:00 too is held at most CLOCK_HOLD_MAX_S outside that beat, the one labelled "AFTER 24 HOURS")
      if (s > CLOCK_HOLD_MAX_S + dt + 1e-6) { out.push({ check: 'clock pace', text: `${story[i].clock} held ${fmt(s)} s from ${fmt(story[i].t)} s (at most ${CLOCK_HOLD_MAX_S} s)` }); break; }
    }
  }
  // M2: no card that (nearly) says a title on screen (the hook's lines; a comparison's side names) or, in a single
  // video, what another of its cards said (a comparison says each side's fact in turn, alike by design)
  // (a single's name is the end card's title, not on screen in the story: its headline is the hook)
  const titles = [...tl.hook.split('\n'), ...(tl.kind === 'compare' ? tl.name.split(' vs ') : [])].map((x) => x.trim()).filter(Boolean);
  const bodies: string[][] = [[], []], dupT = new Set<string>(), dupC = new Set<string>();
  for (const f of fs) if (f.phase === 'main' && f.card) f.card.split(' || ').forEach((c, side) => { const w = cardBody(c).trim(); if (w && side < 2 && !LIVE_CARD.test(cardHead(c)) && !bodies[side].includes(w)) bodies[side].push(w); });
  for (const side of bodies) {
    for (const w of side) if (titles.some((x) => nearSame(w, x))) dupT.add(w);
    if (tl.kind === 'single') for (let i = 0; i < side.length; i++) for (let j = i + 1; j < side.length; j++) if (alikeCards(side[i], side[j])) dupC.add(`${side[i]} ≈ ${side[j]}`);
  }
  if (dupT.size) out.push({ check: 'card repeats title', text: [...dupT].join(' / ') });
  if (dupC.size) out.push({ check: 'card repeats card', text: [...dupC].join(' / ') });
  // M2: a kcal card in a video about a drink with alcohol only when the hook asks about kcal (calories); (a comparison's
  // other side, a food, may say its own)
  if (tl.kind === 'single' && fs.some((f) => f.bac) && !/\bkcal\b|\bcalorie/i.test(tl.hook)) {
    const k = fs.find((f) => f.phase === 'main' && /\bkcal\b/i.test(f.card ?? ''));
    if (k) out.push({ check: 'filler card', text: `"${k.card}" at ${fmt(k.t)} s in a video about alcohol` });
  }
  // M2: a NEXT chip names a time still ahead of the clock when it appears
  {
    let last = '';
    for (const f of fs) {
      if (!f.texts) continue;
      const chip = f.phase === 'main' ? f.texts.map((b) => b.text).find((x) => /^NEXT · \+\d+:\d\d/.test(x)) ?? '' : '';
      if (chip && chip !== last && f.clock && !(clockMinutes(/\+\d+:\d\d/.exec(chip)![0]) > clockMinutes(f.clock))) { out.push({ check: 'filler card', text: `"${chip}" at ${f.clock} (${fmt(f.t)} s): the chip names no time ahead` }); break; }
      last = chip;
    }
  }
  // M2: a kidney card says the food's own number (or, when its water is the whole drink the hook names, "all of it")
  const kid = fs.find((f) => f.phase === 'main' && (f.card ?? '').split(' || ').some((c) => /\bkidneys? filter/i.test(cardBody(c)) && !/\d/.test(cardBody(c)) && !/\ball of it\b/.test(cardBody(c))));
  if (kid) out.push({ check: 'filler card', text: `"${kid.card}" at ${fmt(kid.t)} s says no number of its own` });
  // M2: a "NEXT MORNING" stretch without a fact of its own
  {
    let s = 0, fact = false;
    for (const f of fs) if (f.phase === 'main' && f.card) for (const c of f.card.split(' || ')) if (/^NEXT MORNING/i.test(cardHead(c))) { s += dt; if (!MORNING_NO_FACT.test(cardBody(c))) fact = true; break; }
    if (!fact && s > MORNING_MAX_S + 2 * dt) out.push({ check: 'filler card', text: `"NEXT MORNING" ${fmt(s)} s with no fact of its own (at most ${MORNING_MAX_S} s)` });
  }
  // M3: alcohol with caffeine says the caffeine dose and, at the end, the caffeine still in you when the alcohol is gone
  if (tl.kind === 'single' && fs.some((f) => f.bac) && /\bcaffeine\b/i.test(allWords(tl, 'main'))) {
    const main = fs.filter((f) => f.phase === 'main').map((f) => f.card ?? '').join(' ');
    if (!/\b\d+ mg of caffeine\b/.test(main)) out.push({ check: 'caffeine and alcohol', text: 'no card says the caffeine dose ("N mg of caffeine")' });
    if (!/\b\d+ mg (?:of )?caffeine: still in you/i.test(`${main} ${allWords(tl, 'outro')}`)) out.push({ check: 'caffeine and alcohol', text: 'nothing says the caffeine still in you when the alcohol is gone' });
  }
  return out;
}

// ---- Phase 4l (critique 2026-11-22, v34 samples: aperol spritz, spaghetti carbonara, vodka and energy drink) ----
/** N2: a run of generic cards on screen (video-beats genericCard: no number of its own; safety cards, open loops, a
 *  lull's gauge and the NEXT chip break it) at most this long: two cards at their longest (a card holds up to about
 *  6.5 s when a sparse story is stretched to its length), never three: the v34 carbonara read three, 13.3 s. */
export const GENERIC_RUN_MAX_S = 13;
/** N2: a card that says the viewer feels sleepy, and the end card lines it contradicts. */
export const SLEEPY_CLAIM = /\b(?:feels?|gets?|become|becomes)\s+(?:sleepy|drowsy|tired)\b|\bslump\b|\bsleepy after\b/i;
export const AWAKE_CLAIM = /\bwide awake\b|\bmore alert\b|\benergy boost\b|\bfull of energy\b|\bno slump\b/i;
const ALL_FINE = /^(?:Fine|Normal|Steady) all day$/i;
/** The end card's line for one of the day's lights ("Brain & sleep" → "Fine all day"): the word block after its label. */
export function endCardNote(tl: Timeline, label: RegExp): string | null {
  for (const f of tl.frames) if (f.phase === 'outro' && f.end >= 0.98 && f.texts) {
    const i = f.texts.findIndex((b) => label.test(b.text.trim()));
    if (i >= 0 && f.texts[i + 1]) return f.texts[i + 1].text.trim();
  }
  return null;
}
/** The phase 4l checks: a time-of-day moment only where the story's clock reads as that time (N1; what it says holds at
 *  the minute shown, against the model: video-4l.test); no card that contradicts another or the end card, no long run
 *  of generic cards (N2). */
export function checkTimeline4l(tl: Timeline): TeleIssue[] {
  const out: TeleIssue[] = [], dt = 1 / tl.fps, fs = tl.frames;
  const main = fs.filter((f) => f.phase === 'main' && f.beat !== 'teaser' && f.beat !== 'rewind');
  // N1: "BEDTIME" / "GOING TO BED" from TOD_MIN.bed minutes on the clock, "NEXT MORNING" from TOD_MIN.morning; a NEXT
  // chip that names one of them, too
  const todMin = (t: string) => (BED_TITLE.test(t.trim()) ? TOD_MIN.bed : MORNING_TITLE.test(t.trim()) ? TOD_MIN.morning : null);
  let tod: string | null = null, todChip: string | null = null;
  for (const f of main) {
    for (const c of (f.card ?? '').split(' || ')) {
      const need = c ? todMin(cardHead(c)) : null;
      if (!tod && need !== null && f.clock && clockMinutes(f.clock) < need) tod = `"${c}" at ${f.clock} (${fmt(f.t)} s): the clock does not read as ${cardHead(c).toLowerCase()} before +${Math.floor(need / 60)}:${String(need % 60).padStart(2, '0')}`;
    }
    const chip = (f.texts ?? []).map((b) => b.text).find((x) => /^NEXT · \+\d+:\d\d · /.test(x));
    if (!todChip && chip) { const m = /^NEXT · (\+\d+:\d\d) · (.+)$/.exec(chip)!, need = todMin(m[2]); if (need !== null && clockMinutes(m[1]) < need) todChip = `"${chip}" (${fmt(f.t)} s) names ${m[2].toLowerCase()} at ${m[1]}`; }
  }
  if (tod) out.push({ check: 'time of day', text: tod });
  if (todChip) out.push({ check: 'time of day', text: todChip });
  // N2: cards that contradict each other or the end card (a single video's: sleepy vs a brain line "Fine all day")
  const cards = [...new Set(main.flatMap((f) => (f.card ?? '').split(' || ').filter(Boolean).filter((c) => !LIVE_CARD.test(cardHead(c))).map(cardBody)))];
  const sleepy = cards.find((c) => SLEEPY_CLAIM.test(c)), awake = cards.find((c) => AWAKE_CLAIM.test(c));
  if (sleepy && awake) out.push({ check: 'card contradiction', text: `"${sleepy}" and "${awake}"` });
  const brain = tl.kind === 'single' ? endCardNote(tl, /^Brain & sleep$/i) : null;
  if (sleepy && brain && ALL_FINE.test(brain)) out.push({ check: 'card contradiction', text: `"${sleepy}" in the story, "Brain & sleep · ${brain}" on the end card` });
  // N2: generic cards back to back at most GENERIC_RUN_MAX_S on screen (a single video's: a comparison's split cards say
  // each side's fact under its name, laid out by planCompare, not by the single video's planner)
  if (tl.kind === 'single') {
    let run = 0, best = 0, at = 0, a0 = 0, said: string[] = [], bestSaid: string[] = [];
    for (const f of main) {
      if (f.beat === 'end') { run = 0; said = []; continue; }
      const c = f.card ?? '';
      if (!c) { if (f.next) { run = 0; said = []; } continue; }
      const gen = !LIVE_CARD.test(cardHead(c)) && c.split(' || ').every((x) => genericCard(cardBody(x)));
      if (!gen) { run = 0; said = []; continue; }
      if (run === 0) a0 = f.t;
      run += dt; if (!said.includes(c)) said.push(c);
      if (run > best) { best = run; at = a0; bestSaid = [...said]; }
    }
    if (best > GENERIC_RUN_MAX_S + dt + 1e-6) out.push({ check: 'generic cards', text: `${fmt(best)} s of cards with no number of their own from ${fmt(at)} s (at most ${GENERIC_RUN_MAX_S} s): ${bestSaid.join(' / ')}` });
  }
  return out;
}

// ---- Phase P2 (roadmap 2026-11-24, "Video spine v5 + live curve"): the density of what is drawn ----
// The v4 videos told the food's story in cards that any food could show ("Your stomach churns it into a paste."):
// 0.6-2.4 facts every 10 s, 54-93 % of a food's card time with no number of its own, a question at 2.4-3.1 s and no
// answer, no tip in 10 of 12 videos (current-format-audit 2026-11-22, A1.8). These checks measure the spine on the
// timeline, from the words each frame draws (every 3rd frame holds them: TeleFrame.texts), so the unit tests, the
// density report (scripts/density-report.mjs) and every rendered video are judged alike:
//   - facts per 10 s: (the item-specific numbers drawn + the visuals that carry one) / the video's length;
//   - the share of the story with an item-specific number on screen;
//   - generic text: the share of the card time whose card has no number at all (the audit's own measure);
//   - the question fully on screen by QUESTION_BY_S, its 3 options by GUESS_BY_S and held until the reveal, the reveal
//     in the last REVEAL_WINDOW_S before the end frame, which shows the 5 axes, the cheat sheet and the sources;
//   - at least one action in the story; each item-specific number in at most PER_NUMBER_MAX visuals;
//   - something new on screen at least every EVENT_GAP_S (a new card or visual, a cue: a moment, a page, a beat);
//   - with alcohol: the compact limits row in at most 2 lines, the full legal block at most LEGAL_MAX of the video.
// An item-specific number is one the drawing code tags (TeleBox.k: a story number or a live model value), or one whose
// value and unit match one of the item's story numbers (Timeline.nums), so an untagged "35 g of sugar" counts too.
export const SPINE = {
  FACTS_PER_10S: 3.0, FACTS_MEDIAN: 3.5, ITEM_SHARE: 0.7, GENERIC_MAX: 0.15, QUESTION_BY_S: 1.0, GUESS_BY_S: 3.0, REVEAL_WINDOW_S: 3.0,
  END_MIN_S: 2.5, PER_NUMBER_MAX: 2, ACTIONS_MIN: 1, EVENT_GAP_S: 3.0, BAC_ROW_LINES: 2, LEGAL_MAX: 0.12,
} as const;
/** The five axes of the Body Score, as the end frame labels them (story/axes RUBRIC). */
export const AXIS_LABELS = ['Energy', 'Sugar curve', 'Fullness', 'Sleep', 'Nutrients'] as const;
/** A number with its unit in drawn words ("35 g", "1.4–2.6 mmol/L", "0.01–0.03 %", "1 h 30 min"). */
const NUM_RE = /(\d+(?:[.,]\d+)?)(?:\s*[–-]\s*(\d+(?:[.,]\d+)?))?\s*(kcal\/g|kcal|mg\/dL|mmol\/L|mg|ml|g|%|‰|min(?:utes?)?|h(?:ours?)?|(?:sugar )?cubes?|teaspoons?|US standard drinks?)(?![a-zA-Z])/g;
const unitOf = (u: string): string => (/^min/.test(u) ? 'min' : /^h/.test(u) ? 'h' : /cube|teaspoon/.test(u) ? 'cubes' : /drink/.test(u) ? 'drinks' : u);
const storyUnit = (u: string): string => (u === '% DV' ? '%' : u);
/** The item-specific story numbers a block of drawn words shows (by value and unit), the day's "24 hours" aside. */
export function numbersShown(text: string, nums: readonly TeleNum[]): string[] {
  const s = text.replace(/(\d+)\s*h\s+(\d+)\s*min/g, (_a, h: string, m: string) => `${Number(h) * 60 + Number(m)} min`);
  const out: string[] = [];
  const near = (a: number, b: number) => Math.abs(a - b) <= Math.max(b >= 100 ? 1 : b >= 10 ? 0.6 : b >= 1 ? 0.06 : 0.006, 0.02 * Math.abs(b));
  for (const m of s.matchAll(NUM_RE)) {
    const v = Number(m[1].replace(',', '.')), v2 = m[2] !== undefined ? Number(m[2].replace(',', '.')) : undefined, u = unitOf(m[3]);
    if (u === 'h' && (v === 24 || v === 0) && v2 === undefined) continue; // ("AFTER 24 HOURS", the day bar)
    for (const n of nums) {
      const nu = storyUnit(n.unit);
      let hit = false;
      if (v2 !== undefined && n.range) {
        // a range: as the story has it, or a blood alcohol range in % (‰ / 10)
        const k = nu === '‰' && u === '%' ? 10 : nu === u ? 1 : 0;
        hit = k > 0 && near(v * k, n.range[0]) && near(v2 * k, n.range[1]);
        // (a time range said in hours, the story's in minutes: "1–4 h" for 75–235 min, to the half hour it is said in)
        if (!hit && nu === 'min' && u === 'h') hit = Math.abs(v * 60 - n.range[0]) <= 30 && Math.abs(v2 * 60 - n.range[1]) <= 30;
      } else if (v2 === undefined) {
        if (nu === u) hit = near(v, n.value);
        else if (nu === 'min' && u === 'h') hit = near(v * 60, n.value);
        else if (nu === 'h' && u === 'min') hit = near(v / 60, n.value);
      }
      if (hit) { out.push(n.key); break; }
    }
  }
  return [...new Set(out)];
}
export interface Density5 {
  seconds: number; facts: number; factsPer10: number; keys: string[]; visuals: number;
  itemShare: number; genericShare: number; questionT: number; guessT: number; guessHeld: number; revealT: number; endStartT: number; endS: number;
  axes: number; cheat: number; sources: boolean; actions: number; overused: string[]; /** each number's visuals */ uses: Record<string, string[]>; eventGap: { s: number; at: number }; bacRowMax: number; legalShare: number; bacFrames: number;
}
const sp1 = (x: string) => x.replace(/[\s ]+/g, ' ').trim(); // (a number keeps its unit with a no-break space)
const isHead = (text: string, hook: string) => sp1(text).length >= 3 && sp1(hook).includes(sp1(text));
/** The v5 density of a timeline (see SPINE). */
export function density5(tl: Timeline): Density5 {
  const dt = 1 / tl.fps, fs = tl.frames, nums = tl.nums ?? [];
  const hookNums = numbersShown(tl.hook.replace(/\n/g, ' '), nums);
  const sampled = fs.filter((f) => f.texts);
  const keys = new Set<string>(), visOf = new Map<string, Set<string>>(), visuals = new Set<string>();
  // (the serving's own size, "115 g" under a name, is what is compared, like the name: not a fact of its own)
  const SERVING = new Set(['grams', 'b:grams']);
  const use = (k: string, v: string) => { if (SERVING.has(k)) return; keys.add(k); visuals.add(v); let s = visOf.get(k); if (!s) visOf.set(k, (s = new Set())); s.add(v); };
  /** a sampled frame's item-specific numbers (and the visuals that carry them are counted) */
  // (a label that stands all through the story, the same words in nine of ten frames, e.g. a comparison's servings
  // under the names, counts once as a visual; it is not the story's own number on screen, as the headline is not)
  const mainS = sampled.filter((f) => f.phase === 'main'), seenN = new Map<string, number>();
  for (const f of mainS) for (const t of new Set((f.texts ?? []).filter((b) => (b.a ?? 1) >= 0.5 && !b.deco).map((b) => b.text))) seenN.set(t, (seenN.get(t) ?? 0) + 1);
  const label = (t: string) => mainS.length >= 10 && (seenN.get(t) ?? 0) >= 0.9 * mainS.length;
  const frameNums = (f: TeleFrame) => {
    const ks = new Set<string>((f.nums ?? []).filter((k) => !(f.texts ?? []).some((b) => !!b.k && b.k.split(',').includes(k) && label(b.text))));
    let head = false;
    for (const b of f.texts ?? []) {
      // (the guess's options are not facts until the reveal says which one is)
      if ((b.a ?? 1) < 0.5 || b.deco || b.r === 'guess' || b.r === 'sources') continue; // (nor the sources line's name)
      if (b.k) { for (const k of b.k.split(',')) { if (!label(b.text) && !SERVING.has(k)) ks.add(k); use(k, b.v ?? `t:${k}`); } continue; }
      if (isHead(b.text, tl.hook)) { head = true; continue; }
      const found = numbersShown(b.text, nums);
      if (!found.length) continue;
      // (a card whose number runs with the clock, a lull's counter, is one visual: its words with the numbers out)
      const v = b.v ?? (f.card && f.card.includes(b.text.trim()) ? `card:${f.card.replace(/\d+(?:[.,]\d+)?/g, '#')}` : `t:${b.text.replace(/\d+(?:[.,]\d+)?/g, '#')}`);
      for (const k of found) { if (!label(b.text) && !SERVING.has(k)) ks.add(k); use(k, v); }
    }
    // (the headline, the hook at the top all through, counts once as a visual; it is not the story's own number on screen)
    if (head) for (const k of hookNums) use(k, 'head');
    return ks;
  };
  let withNum = 0;
  for (const f of sampled) { const ks = frameNums(f); if (f.phase === 'main' && ks.size) withNum++; }
  // generic text: the card time whose card says no number at all (every side of a comparison)
  const carded = fs.filter((f) => f.phase === 'main' && f.card);
  // (video-beats genericCard, the project's own measure: no number, and neither a safety card nor an open loop)
  // (a lull's live gauge, "BLOOD ALCOHOL | Coming down slowly", is a gauge, not a card: as for the generic runs, 4l)
  // (and a safety card is no generic card, as genericCard has it: "Don't drive.", "Caffeine masks drowsiness, not impairment.")
  const generic = carded.filter((f) => f.card!.split(' || ').every((c) => { const w = c.includes(' | ') ? c.slice(c.indexOf(' | ') + 3) : c; return !LIVE_CARD.test(c.includes(' | ') ? c.slice(0, c.indexOf(' | ')) : '') && ((genericCard(w) && !/\bimpair|won[’']t speed it up|\bsober/i.test(w)) || !w.trim()); }));
  // the question: the hook's line that asks, every word of it at full opacity
  const qLine = tl.hook.split('\n').map((x) => x.trim()).find((x) => /\?$/.test(x));
  const qWords = qLine ? qLine.split(/\s+/).filter(Boolean) : [];
  const full = (f: TeleFrame) => { const ws = (f.texts ?? []).filter((b) => (b.a ?? 1) >= 0.98).map((b) => b.text).join(' ').split(/\s+/); return qWords.length > 0 && qWords.every((w) => ws.includes(w)); };
  const qf = qLine ? sampled.find(full) : undefined;
  const has = (f: TeleFrame, r: string) => !!f.roles?.includes(r);
  const endIdx = fs.findIndex((f) => f.end >= 0.98), endStartT = endIdx >= 0 ? fs[endIdx].t : tl.seconds;
  let best = 0, run = 0; for (const f of fs) { if (f.end >= 0.98) { run += dt; best = Math.max(best, run); } else run = 0; }
  const gf = fs.find((f) => has(f, 'guess')), rf = fs.find((f) => has(f, 'reveal'));
  const revealT = rf ? rf.t : Infinity, guessT = gf ? gf.t : Infinity;
  const between = fs.filter((f) => f.t >= SPINE.GUESS_BY_S && f.t < Math.min(revealT, endStartT) && f.phase !== 'outro');
  const guessHeld = between.length ? between.filter((f) => has(f, 'guess') || has(f, 'reveal')).length / between.length : 0;
  const endTexts = fs.filter((f) => f.phase === 'outro' && f.end >= 0.98).flatMap((f) => f.texts ?? []);
  const endWords = endTexts.map((b) => b.text.trim());
  const axes = AXIS_LABELS.filter((l) => endWords.some((w) => w === l || w.startsWith(`${l} `) || w.startsWith(`${l}:`))).length;
  const cheat = new Set(endTexts.filter((b) => b.r === 'cheat').map((b) => b.v ?? b.text)).size;
  const sources = endTexts.some((b) => b.r === 'sources' && /^Sources:/.test(b.text.trim()));
  // (a single video's action is in its story; a comparison's on its end frame)
  const actions = new Set(fs.filter((f) => f.phase === 'main' || (tl.kind === 'compare' && f.phase === 'outro')).flatMap((f) => (f.texts ?? []).filter((b) => b.r === 'action' && (b.a ?? 1) >= 0.5).map((b) => b.text))).size;
  const overused = [...visOf].filter(([, v]) => v.size > SPINE.PER_NUMBER_MAX).map(([k, v]) => `${k} ×${v.size}`);
  // something new on screen: a cue (ev), a new card, a new visual or role, a NEXT chip, a beat change
  let lastEv = 0, gap = { s: 0, at: 0 };
  for (let i = 1; i < fs.length && fs[i].t < endStartT; i++) {
    const f = fs[i], p = fs[i - 1];
    const ev = f.ev || f.card !== p.card || f.beat !== p.beat || (!!f.next && !p.next) || (f.vis ?? []).some((v) => !(p.vis ?? []).includes(v)) || (f.roles ?? []).some((r) => !(p.roles ?? []).includes(r));
    if (ev) { if (f.t - lastEv > gap.s) gap = { s: f.t - lastEv, at: lastEv }; lastEv = f.t; }
  }
  if (endStartT - lastEv > gap.s) gap = { s: endStartT - lastEv, at: lastEv };
  const bacF = fs.filter((f) => f.bac);
  const bacRowMax = Math.max(0, ...sampled.map((f) => (f.texts ?? []).filter((b) => b.r === 'bacRow' && (b.a ?? 1) >= 0.5).length));
  // (the full legal block: tagged in v5; a v4 timeline drew the full block with every blood alcohol number)
  const v5 = fs.some((f) => f.roles?.length);
  const legal = v5 ? fs.filter((f) => has(f, 'bacFull')).length : bacF.length;
  const facts = keys.size + visuals.size;
  return {
    seconds: tl.seconds, facts, factsPer10: (10 * facts) / Math.max(1, tl.seconds), keys: [...keys], visuals: visuals.size,
    itemShare: mainS.length ? withNum / mainS.length : 0, genericShare: carded.length ? generic.length / carded.length : 0,
    questionT: qf ? qf.t : Infinity, guessT, guessHeld, revealT, endStartT, endS: best, axes, cheat, sources, actions, overused, uses: Object.fromEntries([...visOf].map(([k, v]) => [k, [...v]])), eventGap: gap, bacRowMax, legalShare: legal / Math.max(1, fs.length), bacFrames: bacF.length,
  };
}
/** The v5 spine's checks (thresholds: SPINE); every video is about a food or a drink, so each applies to all. A
 *  comparison asks its own question (which of the two) and shows both sides' axes on its end frame. */
export function checkTimeline5(tl: Timeline): TeleIssue[] {
  const out: TeleIssue[] = [], d = density5(tl), S = SPINE, cmp = tl.kind === 'compare';
  const pct = (x: number) => `${Math.round(100 * x)} %`;
  if (d.factsPer10 < S.FACTS_PER_10S - 1e-9) out.push({ check: 'density', text: `${d.factsPer10.toFixed(2)} facts per 10 s (${d.keys.length} numbers + ${d.visuals} visuals in ${fmt(d.seconds)} s; at least ${S.FACTS_PER_10S})` });
  if (d.itemShare < S.ITEM_SHARE - 1e-9) out.push({ check: 'item number', text: `an item-specific number on screen ${pct(d.itemShare)} of the story (at least ${pct(S.ITEM_SHARE)})` });
  if (d.genericShare > S.GENERIC_MAX + 1e-9) out.push({ check: 'generic text', text: `${pct(d.genericShare)} of the card time says no number (at most ${pct(S.GENERIC_MAX)})` });
  if (!(d.questionT <= S.QUESTION_BY_S + 1e-6)) out.push({ check: 'question', text: d.questionT === Infinity ? 'no question fully on screen' : `the question fully on screen at ${fmt(d.questionT)} s (by ${S.QUESTION_BY_S} s)` });
  const wantGuess = !cmp && (tl.story ? tl.story.guess : true);
  if (wantGuess) {
    if (!(d.guessT <= S.GUESS_BY_S + 1e-6)) out.push({ check: 'guess', text: d.guessT === Infinity ? 'no guess options on screen' : `the guess options from ${fmt(d.guessT)} s (by ${S.GUESS_BY_S} s)` });
    else if (d.guessHeld < 0.95) out.push({ check: 'guess', text: `the guess held ${pct(d.guessHeld)} of the time until the reveal` });
  }
  // (a single video reveals its guess; one with no guess, its own question answered by the story, has nothing to reveal)
  if ((cmp || wantGuess) && !(d.revealT >= d.endStartT - S.REVEAL_WINDOW_S - 1e-6 && d.revealT < d.endStartT)) out.push({ check: 'reveal', text: d.revealT === Infinity ? 'no reveal on screen' : `the reveal at ${fmt(d.revealT)} s, the end frame at ${fmt(d.endStartT)} s (within the last ${S.REVEAL_WINDOW_S} s before it)` });
  if (d.endS < S.END_MIN_S - 1e-6) out.push({ check: 'end frame', text: `fully on screen ${d.endS.toFixed(2)} s (at least ${S.END_MIN_S} s)` });
  if (d.axes < AXIS_LABELS.length) out.push({ check: 'end frame', text: `${d.axes} of the ${AXIS_LABELS.length} axes on the end frame` });
  const cheatNeed = cmp ? 0 : Math.min(3, tl.story?.cheat ?? 3);
  if (d.cheat < cheatNeed) out.push({ check: 'end frame', text: `${d.cheat} cheat-sheet lines on the end frame (the story has ${tl.story?.cheat ?? '?'})` });
  if (!d.sources) out.push({ check: 'end frame', text: 'no "Sources:" line on the end frame' });
  if (d.actions < S.ACTIONS_MIN) out.push({ check: 'action', text: `${d.actions} actions in the story (at least ${S.ACTIONS_MIN})` });
  if (d.overused.length) out.push({ check: 'number repeats', text: `in more than ${S.PER_NUMBER_MAX} visuals: ${d.overused.join(', ')}` });
  if (d.eventGap.s > S.EVENT_GAP_S + 1e-6) out.push({ check: 'visual events', text: `${fmt(d.eventGap.s)} s with nothing new from ${fmt(d.eventGap.at)} s (at most ${S.EVENT_GAP_S} s)` });
  if (d.bacRowMax > S.BAC_ROW_LINES) out.push({ check: 'BAC row', text: `the compact limits row in ${d.bacRowMax} lines (at most ${S.BAC_ROW_LINES})` });
  if (d.legalShare > S.LEGAL_MAX + 1e-9) out.push({ check: 'BAC row', text: `the full legal block on screen ${pct(d.legalShare)} of the video (at most ${pct(S.LEGAL_MAX)})` });
  return out;
}
