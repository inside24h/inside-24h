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

/** One word block drawn on a frame (share.ts text(): one line of words), in video pixels. */
export interface TeleBox { x0: number; y0: number; x1: number; y1: number; text: string; deco?: boolean; a?: number }
/** What the body shows on a frame: the region the camera frames ('body' = whole body), the organs lit for the card
 *  (and, while the first bite goes down, where it is), the region of the card's topic. Comparisons: both sides. */
export interface TeleScene { shot: string; lit: string[]; topic: string; /** the organ the first bite or sip is in while it goes down */ lead?: string; shotB?: string; litB?: string[]; topicB?: string }
export interface TeleFrame {
  /** seconds into the video */ t: number; phase: string; beat?: string;
  /** the clock as drawn ("+1:05"; absent when no clock is on screen) */ clock?: string;
  /** the card on screen ("TITLE | words") */ card?: string;
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
export function teleFrame(fr: { t: number; phase: string; beat?: string }, d: { boxes: readonly TeleBox[]; clock?: string; card?: string; end: number }) {
  if (!rec) return;
  const n = rec.frames.length, s = rec.scene;
  const rs = [...new Set([...perceivedOf(s), ...(s && s.shotB !== undefined ? perceivedOf({ shot: s.shotB, lit: s.litB ?? [], topic: s.topicB ?? '' }) : [])])];
  const f: TeleFrame = { t: Math.round(fr.t * 1000) / 1000, phase: fr.phase, ...(fr.beat ? { beat: fr.beat } : {}), ...(d.clock ? { clock: d.clock } : {}), ...(d.card ? { card: d.card } : {}),
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
