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
import { MORNING_NO_FACT } from './video-beats';
import { alikeCards, nearSame, plainLatin, sameWords } from './video-names';

/** One word block drawn on a frame (share.ts text(): one line of words), in video pixels. */
export interface TeleBox { x0: number; y0: number; x1: number; y1: number; text: string; deco?: boolean; a?: number }
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
}
export interface Timeline { v: 1; kind: 'single' | 'compare'; cut: string; seconds: number; fps: number; hook: string; name: string; frames: TeleFrame[] }
export interface TeleMeta { kind: 'single' | 'compare'; cut: string; seconds: number; fps: number; hook: string; name: string }

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
export function teleFrame(fr: { t: number; phase: string; beat?: string }, d: { boxes: readonly TeleBox[]; clock?: string; card?: string; next?: boolean; end: number }) {
  if (!rec) return;
  const n = rec.frames.length, s = rec.scene;
  const rs = [...new Set([...perceivedOf(s), ...(s && s.shotB !== undefined ? perceivedOf({ shot: s.shotB, lit: s.litB ?? [], topic: s.topicB ?? '' }) : [])])];
  const f: TeleFrame = { t: Math.round(fr.t * 1000) / 1000, phase: fr.phase, ...(fr.beat ? { beat: fr.beat } : {}), ...(d.clock ? { clock: d.clock } : {}), ...(d.card ? { card: d.card } : {}), ...(d.next ? { next: true } : {}),
    rs, ...(s ? { shot: s.shotB !== undefined ? `${s.shot}|${s.shotB}` : s.shot, lit: [...s.lit, ...(s.lead ? [s.lead] : []), ...(s.litB ?? [])] } : {}), end: Math.round(d.end * 1000) / 1000 };
  const ov = overlaps(d.boxes);
  if (ov.length) f.ov = ov;
  const words = d.boxes.filter((b) => (b.a ?? 1) >= 0.5).map((b) => b.text).join(' ');
  if (BAC_NUMBER.test(words)) f.bac = words;
  if (n % 3 === 0) f.texts = d.boxes.map((b) => ({ x0: Math.round(b.x0), y0: Math.round(b.y0), x1: Math.round(b.x1), y1: Math.round(b.y1), text: b.text, ...(b.deco ? { deco: true } : {}), ...((b.a ?? 1) < 1 ? { a: Math.round((b.a ?? 1) * 100) / 100 } : {}) }));
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
const LIVE_CARD = /^TAKEN UP SO FAR/i;
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
      if (story[i].clock !== PAUSE_CLOCK && s > CLOCK_HOLD_MAX_S + dt + 1e-6) { out.push({ check: 'clock pace', text: `${story[i].clock} held ${fmt(s)} s from ${fmt(story[i].t)} s (at most ${CLOCK_HOLD_MAX_S} s)` }); break; }
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
  // M2: a kidney card says the food's own number
  const kid = fs.find((f) => f.phase === 'main' && (f.card ?? '').split(' || ').some((c) => /\bkidneys? filter/i.test(cardBody(c)) && !/\d/.test(cardBody(c))));
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
