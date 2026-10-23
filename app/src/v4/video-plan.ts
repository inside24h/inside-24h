// Timing of the shared video: which key moments it stops at, how long each caption stays up, and how long the whole
// video runs. Pure functions (no canvas, no DOM), so the reading rules are unit tested (video-plan.test.ts).
//
// READING RULE (research/improvements/video-polish-2026-10-22.md). Subtitle guides allow fast text for people who
// only read (Netflix English: up to 20 characters/s for adults, 17 for children; BBC: 160-180 words/min). A phone
// video is harder: the viewer is also watching the body, a stamp, a number and the place, often on a small screen.
// So we stay well under those limits: 14 characters/s (~2.5 words/s) plus 0.9 s to find the text, never less
// than 2.4 s per caption, and the first caption of every moment gets 0.8 s more for the new stamp and number.

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
      if (/^[(“"]/.test(right)) score -= 0.2;
      if (WEAK.has(prev.toLowerCase())) score += 0.4;
      if (/^\d/.test(right) && /^\d/.test(prev)) score += 0.4; // keep "5.0 mmol/L" and "3 × 500 ml" together
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

export type Cut = 'long' | 'short';
/** One key moment of the day: the minute, the chapter title and its words at that minute. */
export interface StopIn { min: number; title: string; text: string }
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
}
export interface Cue { t: number; kind: 'start' | 'move' | 'stop' | 'page' | 'outro' | 'end' }
export interface Plan { frames: VFrame[]; stops: number[]; stopsU: number[]; pages: Page[]; cues: Cue[]; seconds: number; introS: number; outroS: number }

/** Length targets. Long: TikTok/Facebook reward 60 s+ (we aim 62-75 s so encoders never round it under 61 s).
 *  Short: 15-30 s for Shorts / Reels experiments. */
export const LENGTH = { long: { min: 62, max: 75 }, short: { min: 15, max: 30 } } as const;
export const MOVE_S = 1.0;        // glide between two moments (eased)
export const INTRO_S = { long: 3.0, short: 2.4 } as const; // big hook card (it then stays at the top as the headline)
export const END_HOLD_S = 1.4;    // the "24 HOURS LATER" beat before the end card (body, stamp and lights only)
export const OUTRO_S = { long: 6.5, short: 5.0 } as const;   // end card: summary + call to action (+ a loop back to the start)

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
export function planVideo(stopsIn: StopIn[], cut: Cut, toU: (m: number) => number, fromU: (u: number) => number): Plan {
  // one stop per minute (the later chapter wins, as on screen), in order, inside the day
  const byMin = new Map<number, StopIn>();
  for (const s of stopsIn) byMin.set(Math.max(0, Math.min(1440, s.min)), { ...s, min: Math.max(0, Math.min(1440, s.min)) });
  let stops = [...byMin.values()].sort((a, b) => a.min - b.min);
  if (!stops.length || stops[0].min !== 0) stops.unshift({ min: 0, title: stops[0]?.title ?? '', text: stops[0]?.text ?? '' });
  const story = stops; // the 24 h beat is added after the last moment (stamp only, the caption stays)

  const lim = LENGTH[cut];
  const fixed = INTRO_S[cut] + OUTRO_S[cut] + MOVE_S + END_HOLD_S; // intro, glide to 24 h, the 24 h beat, end card
  let chosen: StopIn[];
  if (cut === 'short') {
    // the start + the most telling moments that fit in 30 s (first sentence each), in time order
    chosen = [story[0]];
    const firstS = (s: StopIn) => splitPages(sentences(s.text)[0] ?? '').reduce((a, p, j) => a + readSeconds(p, j === 0), 0);
    const len = (list: StopIn[]) => fixed + list.reduce((a, s, i) => a + (i ? MOVE_S : 0) + firstS(s), 0);
    const rank = (s: StopIn) => stopValue(s) + (s.min >= 10 ? 1.5 : 0); // a short cut should travel, not wait at the stomach
    const ranked = story.slice(1).sort((a, b) => rank(b) - rank(a) || a.min - b.min);
    for (const c of ranked) {
      if (chosen.length >= 4) break;
      const next = [...chosen, c].sort((a, b) => a.min - b.min);
      if (len(next) <= lim.max) chosen = next;
    }
  } else chosen = story.slice();
  // whole sentences only: a caption is never cut off mid-sentence; a long sentence is split over two pages
  let sents = chosen.map((s) => sentences(s.text));
  let used = sents.map((x) => Math.min(1, x.length)); // every moment starts with its first sentence
  const pagesFor = () => chosen.map((_s, i) => splitPages(sents[i].slice(0, Math.max(1, used[i])).join(' ')));
  const stopS = (pp: string[]) => pp.reduce((a, p, j) => a + readSeconds(p, j === 0), 0);
  const total = (pp: string[][]) => fixed + pp.reduce((acc, p, i) => acc + (i ? MOVE_S : 0) + stopS(p), 0);

  // 1) as many moments as fit, one sentence each: if too long, leave out the moment that says the least
  //    (stopValue; ties: the one closest in time to the moment before it). Text is never sped up.
  let pages = pagesFor();
  const dropped: StopIn[] = [];
  while (total(pages) > lim.max && chosen.length > 2) {
    let drop = 1, bestV = Infinity;
    for (let i = 1; i < chosen.length - 1; i++) {
      const v = stopValue(chosen[i]) + (toU(chosen[i].min) - toU(chosen[i - 1].min)); // the gap (0..1) only breaks ties
      if (v < bestV) { bestV = v; drop = i; }
    }
    dropped.push(chosen[drop]);
    chosen = chosen.filter((_s, i) => i !== drop); sents = sents.filter((_s, i) => i !== drop); used = used.filter((_s, i) => i !== drop);
    pages = pagesFor();
  }
  // a later drop can free more room than needed: a left-out moment that now fits comes back (more of the journey
  // beats more words about one moment)
  if (cut === 'long') {
    for (const d of dropped.sort((a, b) => stopValue(b) - stopValue(a))) {
      const at = chosen.findIndex((c) => c.min > d.min), k = at < 0 ? chosen.length : at;
      const c2 = [...chosen.slice(0, k), d, ...chosen.slice(k)], s2 = [...sents.slice(0, k), sentences(d.text), ...sents.slice(k)], u2 = [...used.slice(0, k), 1, ...used.slice(k)];
      const keep = [chosen, sents, used] as const;
      chosen = c2; sents = s2; used = u2;
      const next = pagesFor();
      if (total(next) > lim.max) { [chosen, sents, used] = [keep[0], keep[1], keep[2]]; continue; }
      pages = next;
    }
  }
  // 2) long cut: room left → more of a moment's story, one sentence at a time: always to the moment with the
  //    fewest caption pages so far (ties: the more telling one, then the later one), so the opening seconds never
  //    stall on one place while the payoff moments get one line
  for (let guard = 0; cut === 'long' && guard < 100; guard++) {
    const order = chosen.map((_s, i) => i).filter((i) => used[i] < sents[i].length)
      .sort((a, b) => pages[a].length - pages[b].length || stopValue(chosen[b]) - stopValue(chosen[a]) || chosen[b].min - chosen[a].min);
    let grew = false;
    for (const i of order) {
      used[i]++; const next = pagesFor();
      if (total(next) > lim.max) { used[i]--; continue; }
      pages = next; grew = true; break;
    }
    if (!grew) break;
  }
  // too short (a story with few, short chapters): every caption gets proportionally more time. Calmer, never
  // repeated; the long cut must reach its minimum (platforms count 60 s+), the short cut stretches at most 1.6×.
  const endGlide = chosen[chosen.length - 1].min < 1440 ? 0 : -MOVE_S; // no glide when the story already ends at 24 h
  const t0 = total(pages) + endGlide, reading = t0 - fixed - endGlide - MOVE_S * (chosen.length - 1);
  const want = lim.min + 0.3; // a little over, so frame rounding never lands under the minimum
  const stretch = t0 < want ? Math.min(cut === 'long' ? Infinity : 1.6, 1 + (want - t0) / Math.max(0.1, reading)) : 1;

  return layFrames(chosen.map((s, i) => ({ min: s.min, title: s.title, pages: pages[i].map((p, j) => ({ cap: p, s: readSeconds(p, j === 0) * stretch })) })), cut, toU, fromU);
}

/** Comparison video: both foods at the same minutes. Each side shows the first sentence of its chapter at that
 *  minute (split into pages when long). A page's time counts only the words that are new on screen: a side whose
 *  chapter did not change since the last moment is not read again. Same length rules as the single video. */
export interface CmpStopIn { min: number; a: string; b: string; titleA?: string; titleB?: string }
export const CMP_PAGE = 110; // characters per side and page (3 lines in a comparison caption block)
export function planCompare(stopsIn: CmpStopIn[], cut: Cut, toU: (m: number) => number, fromU: (u: number) => number): Plan {
  const lim = LENGTH[cut];
  const fixed = INTRO_S[cut] + OUTRO_S[cut] + MOVE_S + END_HOLD_S;
  const byMin = new Map<number, CmpStopIn>();
  for (const s of stopsIn) { const m = Math.max(0, Math.min(1440, s.min)); byMin.set(m, { ...s, min: m }); }
  let chosen = [...byMin.values()].sort((x, y) => x.min - y.min);
  if (!chosen.length) chosen = [{ min: 0, a: '', b: '' }];
  if (chosen[0].min !== 0) chosen.unshift({ ...chosen[0], min: 0 });
  const pagesOf = (list: CmpStopIn[]) => {
    let pa = '', pb = '';
    return list.map((s) => {
      const A = splitPages(sentences(s.a)[0] ?? '', CMP_PAGE), B = splitPages(sentences(s.b)[0] ?? '', CMP_PAGE);
      const n = Math.max(A.length, B.length, 1), out: { cap: string; capB: string; s: number }[] = [];
      for (let k = 0; k < n; k++) {
        const ca = A[Math.min(k, A.length - 1)] ?? '', cb = B[Math.min(k, B.length - 1)] ?? '';
        const fresh = (ca !== pa ? ca.length : 0) + (cb !== pb ? cb.length : 0);
        out.push({ cap: ca, capB: cb, s: readChars(fresh, k === 0) });
        pa = ca; pb = cb;
      }
      return out;
    });
  };
  const total = (pp: { s: number }[][]) => fixed + pp.reduce((acc, p, i) => acc + (i ? MOVE_S : 0) + p.reduce((a, x) => a + x.s, 0), 0);
  const value = (s: CmpStopIn) => stopValue({ min: s.min, title: '', text: s.a }) + stopValue({ min: s.min, title: '', text: s.b });
  let pages = pagesOf(chosen);
  const dropped: CmpStopIn[] = [];
  while (total(pages) > lim.max && chosen.length > 2) {
    let drop = 1, best = Infinity;
    for (let i = 1; i < chosen.length - 1; i++) { const v = value(chosen[i]) + (toU(chosen[i].min) - toU(chosen[i - 1].min)); if (v < best) { best = v; drop = i; } }
    dropped.push(chosen[drop]); chosen = chosen.filter((_s, i) => i !== drop); pages = pagesOf(chosen);
  }
  for (const d of dropped.sort((x, y) => value(y) - value(x))) { // a left-out moment that fits again comes back
    const next = [...chosen, d].sort((x, y) => x.min - y.min), np = pagesOf(next);
    if (total(np) <= lim.max) { chosen = next; pages = np; }
  }
  const endGlide = chosen[chosen.length - 1].min < 1440 ? 0 : -MOVE_S;
  const t0 = total(pages) + endGlide, reading = t0 - fixed - endGlide - MOVE_S * (chosen.length - 1), want = lim.min + 0.3;
  const stretch = t0 < want ? Math.min(cut === 'long' ? Infinity : 1.6, 1 + (want - t0) / Math.max(0.1, reading)) : 1;
  return layFrames(chosen.map((s, i) => ({ min: s.min, title: s.titleA, titleB: s.titleB, pages: pages[i].map((p) => ({ ...p, s: p.s * stretch })) })), cut, toU, fromU);
}

/** Lays out every frame: the hook, then for each moment a glide (the new caption fades in as it starts) and its
 *  caption pages for their reading time, the 24 h beat, the end card. Also the sound cues. */
function layFrames(stops: { min: number; title?: string; titleB?: string; pages: { cap: string; capB?: string; s: number }[] }[], cut: Cut,
  toU: (m: number) => number, fromU: (u: number) => number): Plan {
  const frames: VFrame[] = [], cues: Cue[] = [], pageList: Page[] = [];
  const F = (s: number) => Math.max(1, Math.round(s * FPS));
  const tNow = () => frames.length / FPS;
  // intro: the hook over the first minute of the day
  cues.push({ t: 0, kind: 'start' });
  const nIntro = F(INTRO_S[cut]);
  for (let i = 0; i < nIntro; i++) frames.push({ phase: 'intro', m: 0, t: tNow(), capA: 0, k: i / nIntro });
  let prevMin = 0;
  const glide = (from: number, to: number, st: { title?: string; titleB?: string } | null, pg: { cap: string; capB?: string } | undefined, fadeIn: boolean) => {
    const n = F(MOVE_S);
    cues.push({ t: tNow(), kind: 'move' });
    for (let i = 1; i <= n; i++) {
      const m = fromU(toU(from) + (toU(to) - toU(from)) * ease(i / n));
      // no next caption = the way to the 24 h beat: the caption panel fades out (its words belong to an earlier moment)
      frames.push({ phase: 'main', m, t: tNow(), cap: pg?.cap, capB: pg?.capB, title: st?.title, titleB: st?.titleB, capA: !pg ? 0 : fadeIn ? Math.min(1, i / F(READ.fade)) : 1,
        plateA: pg ? 1 : 0, k: 0 });
    }
  };
  stops.forEach((s, i) => {
    if (i > 0) glide(prevMin, s.min, s, s.pages[0], true); // the new caption fades in as the glide starts
    s.pages.forEach((p, j) => {
      const n = F(p.s);
      const already = i > 0 && j === 0 ? F(MOVE_S) : 0; // the first page was already up during the glide
      cues.push({ t: tNow(), kind: j === 0 ? 'stop' : 'page' });
      pageList.push({ stop: s.min, text: p.cap, textB: p.capB, s: (n + already) / FPS });
      for (let k = 0; k < n; k++) frames.push({ phase: 'main', m: s.min, t: tNow(), cap: p.cap, capB: p.capB, title: s.title, titleB: s.titleB, capA: already ? 1 : Math.min(1, (k + 1) / F(READ.fade)), k: 0 });
    });
    prevMin = s.min;
  });
  // the 24 h beat: glide to the end of the day with the caption panel fading out, then a short look at the body,
  // the stamp and the lights at 24 h (no words to read). A story that already ends at 24 h keeps its last caption.
  const lastStop = stops[stops.length - 1], last = lastStop?.pages.slice(-1)[0];
  if (prevMin < 1440) {
    const g0 = frames.length;
    glide(prevMin, 1440, lastStop, last, false); cues.push({ t: tNow(), kind: 'stop' });
    const n = frames.length - g0;
    for (let i = 0; i < n; i++) frames[g0 + i].plateA = 1 - ease((i + 1) / n);
  }
  for (let k = 0, n = F(END_HOLD_S); k < n; k++) frames.push({ phase: 'main', m: 1440, t: tNow(), cap: last?.cap, capB: last?.capB, title: lastStop?.title, titleB: lastStop?.titleB, capA: 1, plateA: prevMin < 1440 ? 0 : 1, k: 0 });
  // end card
  cues.push({ t: tNow(), kind: 'outro' });
  const nOut = F(OUTRO_S[cut]);
  for (let i = 0; i < nOut; i++) frames.push({ phase: 'outro', m: 1440, t: tNow(), capA: 0, k: i / nOut });
  cues.push({ t: tNow(), kind: 'end' });
  const stopMins = [...stops.map((s) => s.min), ...(prevMin < 1440 ? [1440] : [])];
  return { frames, stops: stopMins, stopsU: stopMins.map(toU), pages: pageList, cues, seconds: frames.length / FPS, introS: nIntro / FPS, outroS: nOut / FPS };
}
