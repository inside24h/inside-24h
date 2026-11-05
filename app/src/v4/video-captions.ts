// 2026-11-05 (v19): spoken-word captions. While the voiceover speaks, its line is shown TikTok style: a short page
// of 2-4 words at a time, the word being said lit up. Pure (timing, paging, placement, duplicate check); share.ts
// draws it (drawCaption) over every exported frame, in the encoder loop, so every video benefits.
// - timing: Kokoro (kokoro-js 1.2.1) returns only the waveform, no word or phoneme durations, so the words share the
//   clip's real length in proportion to their syllables (numbers and units as spoken), with a pause after a comma or
//   a full stop; where the clip's own audio has clear pauses, the sentence breaks are anchored to them;
// - placement: a centered band inside the platforms' safe zone that touches no word on the frame (cards, gauges,
//   chips) and keeps clear of the body's focal organ(s); nowhere clear: no caption on that frame (the voice still
//   speaks, the card wins);
// - no duplicate: a line whose words are already on screen (the end card's number) is not captioned.
import { speakable } from './video-narration';

export interface CapWord { w: string; t0: number; t1: number }
export interface CapPage { words: CapWord[]; t0: number; t1: number; lines: string[][]; /** the whole spoken line */ line?: string }
export interface CapLine { text: string; t: number; dur: number }
export interface Box { x0: number; y0: number; x1: number; y1: number; text?: string; deco?: boolean }
/** A point to keep clear of, with its own clearance (default FOCUS_R: the organ of the moment). */
export interface Pt { x: number; y: number; r?: number }

/** Caption look (px on the 1080×1920 frame). */
export const CAP_FS = 66, CAP_LH = 78, CAP_MAX_CHARS = 17, CAP_MAX_WORDS = 4, CAP_PAD = 22;
/** Clearance around the focal organ(s) and around other words (px). */
export const FOCUS_R = 120, PIN_R = 60, BOX_MARGIN = 18;
/** A page stays this long at least (s), and a little after the last word. */
export const PAGE_MIN_S = 0.45, HOLD_S = 0.15;
/** Pause weights in syllables: after a comma / a colon, after a full stop / question / exclamation. */
const PAUSE_COMMA = 0.7, PAUSE_STOP = 1.1;

/** Syllables of one English word (vowel groups, silent final e), at least 1. */
export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 1;
  const g = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, g ? g.length : 1);
}
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function numSyl(n: number): number {
  if (n < 20) return syllables(ONES[n]) + (n === 7 ? 1 : 0);
  if (n < 100) return syllables(TENS[Math.floor(n / 10)]) + (n % 10 ? numSyl(n % 10) : 0);
  if (n < 1000) return numSyl(Math.floor(n / 100)) + 2 + (n % 100 ? numSyl(n % 100) : 0);
  return numSyl(Math.floor(n / 1000)) + 2 + (n % 1000 ? numSyl(n % 1000) : 0);
}
/** Spoken weight of a written token (as shown: "146", "g", "25–60", "%"), in syllables. */
export function tokenWeight(tok: string): number {
  const sp = speakable(tok.replace(/^\W+|\W+$/g, '') || tok);
  let s = 0;
  for (const part of sp.split(/[\s-]+/)) {
    if (!part) continue;
    const m = /^(\d+)(?:\.(\d+))?$/.exec(part.replace(/[^\d.]/g, ''));
    s += m && /\d/.test(part) ? numSyl(Number(m[1])) + (m[2] ? 1 + m[2].length : 0) : syllables(part);
  }
  return Math.max(1, s);
}
/** A caption's words: the line as written (numbers as on screen), a unit glued to its number ("146 g"), "%" too. */
export function captionTokens(text: string): string[] {
  const raw = text.trim().split(/\s+/).filter(Boolean), out: string[] = [];
  for (const w of raw) {
    if (out.length && /\d$/.test(out[out.length - 1]) && /^(%|g|mg|kcal|ml|h|min)[.,!?]?$/.test(w)) out[out.length - 1] += ` ${w}`;
    else out.push(w);
  }
  return out;
}

/** Internal pauses in a spoken clip (s from its start): stretches ≥ minS quieter than th (RMS, 10 ms frames). */
export function pausesOf(audio: Float32Array, sr: number, minS = 0.09, th = 0.012): number[] {
  const hop = Math.max(1, Math.round(sr * 0.01)), n = Math.floor(audio.length / hop), quiet: boolean[] = [];
  for (let f = 0; f < n; f++) { let e = 0; for (let i = f * hop; i < (f + 1) * hop; i++) e += audio[i] * audio[i]; quiet.push(Math.sqrt(e / hop) < th); }
  const out: number[] = [], need = Math.round(minS / 0.01);
  let f = 0;
  while (f < n) {
    if (!quiet[f]) { f++; continue; }
    let g = f; while (g < n && quiet[g]) g++;
    if (g - f >= need && f > 5 && g < n - 5) out.push(((f + g) / 2) * 0.01);
    f = g;
  }
  return out;
}

/** Word timing for a spoken line: [t, t + dur] shared by syllables, sentence breaks anchored to the clip's pauses
 *  (when given and as many as the breaks). */
export function wordTimes(text: string, t: number, dur: number, pauses: number[] = []): CapWord[] {
  const toks = captionTokens(text);
  if (!toks.length || !(dur > 0)) return [];
  const w = toks.map(tokenWeight), gap = toks.map((x) => (/[.!?]$/.test(x) ? PAUSE_STOP : /[,:;]$/.test(x) ? PAUSE_COMMA : 0));
  gap[gap.length - 1] = 0;
  // segments split at the breaks; anchored when the clip has exactly as many clear pauses as there are breaks
  const breaks = gap.map((g, i) => (g > 0 ? i : -1)).filter((i) => i >= 0);
  const anchors = pauses.length === breaks.length && breaks.length ? pauses.filter((p) => p > 0 && p < dur) : [];
  const segs: [number, number, number, number][] = []; // [first word, last word, start, end]
  if (anchors.length === breaks.length && anchors.length) {
    let a = 0, s0 = 0;
    breaks.forEach((b, k) => { segs.push([a, b, s0, anchors[k]]); a = b + 1; s0 = anchors[k]; });
    segs.push([a, toks.length - 1, s0, dur]);
  } else segs.push([0, toks.length - 1, 0, dur]);
  const out: CapWord[] = [];
  for (const [a, b, s0, s1] of segs) {
    let tot = 0; for (let i = a; i <= b; i++) tot += w[i] + (i < b ? gap[i] : 0);
    let c = s0;
    for (let i = a; i <= b; i++) {
      const d = ((s1 - s0) * w[i]) / Math.max(1e-6, tot), g = i < b ? ((s1 - s0) * gap[i]) / Math.max(1e-6, tot) : 0;
      out.push({ w: toks[i], t0: t + c, t1: t + c + d }); c += d + g;
    }
  }
  return out;
}

/** Pages of up to CAP_PAGE words, balanced (6 words: 3 + 3, never 4 + 2), ending at a full stop or a comma when
 *  the line has one; one line each when it fits CAP_MAX_CHARS, at most two. */
export const CAP_PAGE = 3;
export function captionPages(words: CapWord[], nextT = Infinity): CapPage[] {
  const pages: CapWord[][] = [];
  const chars = (ws: CapWord[]) => ws.reduce((s, x) => s + x.w.length + 1, -1);
  // phrases: split after punctuation
  const phrases: CapWord[][] = [[]];
  words.forEach((x, i) => { phrases[phrases.length - 1].push(x); if (/[.!?,:;]$/.test(x.w) && i < words.length - 1) phrases.push([]); });
  for (const ph of phrases) {
    // (the shorter page first: "Where does | the alcohol go?", an article stays with its noun)
    const cut = (k: number) => Array.from({ length: k }, (_, j) => ph.slice(Math.floor((j * ph.length) / k), Math.floor(((j + 1) * ph.length) / k)));
    let k = Math.ceil(ph.length / CAP_PAGE);
    while (k < ph.length && cut(k).some((g) => chars(g) > 2 * CAP_MAX_CHARS - 2)) k++;
    pages.push(...cut(k));
  }
  // a lone last word joins the page before when it fits
  const last = pages[pages.length - 1], prev = pages[pages.length - 2];
  if (last && prev && last.length === 1 && prev.length < CAP_MAX_WORDS && chars([...prev, ...last]) <= 2 * CAP_MAX_CHARS - 2) { prev.push(...last); pages.pop(); }
  return pages.map((ws, k) => {
    const lines: string[][] = [[]];
    for (const x of ws) { const l = lines[lines.length - 1]; if (l.length && [...l, x.w].join(' ').length > CAP_MAX_CHARS) lines.push([x.w]); else l.push(x.w); }
    const nx = pages[k + 1];
    const t0 = ws[0].t0, end = nx ? nx[0].t0 : Math.min(nextT, ws[ws.length - 1].t1 + HOLD_S);
    return { words: ws, t0, t1: Math.max(end, Math.min(nextT, t0 + PAGE_MIN_S)), lines };
  });
}

/** Every caption page of a voiceover (lines with their real start and length; pauses per line when known). */
export function captionTrack(lines: CapLine[], pauses: number[][] = []): CapPage[] {
  const out: CapPage[] = [];
  lines.forEach((l, i) => {
    const nx = lines[i + 1];
    out.push(...captionPages(wordTimes(l.text, l.t, l.dur, pauses[i] ?? []), nx ? nx.t - 0.05 : Infinity).map((p) => ({ ...p, line: l.text })));
  });
  return out;
}
export const pageAt = (pages: CapPage[], t: number) => pages.find((p) => t >= p.t0 && t < p.t1) ?? null;

const STOP = new Set('a an and the of to in on at it is its it’s it\'s this that there here here’s here\'s there’s there\'s your you by for with from now one up s right just what how did do does all so watch see go goes look first bite sip after then more time really'.split(' '));
const content = (s: string) => s.toLowerCase().replace(/[’']/g, "'").split(/[^a-z0-9']+/).map((w) => w.replace(/'s$/, '')).filter((w) => w && !STOP.has(w));
/** The line says what the screen already shows: most of its words (and every number) are in the frame's text. */
export function duplicateOnScreen(line: string, boxes: Box[]): boolean {
  const scr = new Set(content(boxes.map((b) => b.text ?? '').join(' ')));
  const ws = content(line);
  if (!ws.length) return false;
  const hit = ws.filter((w) => scr.has(w)).length, nums = ws.filter((w) => /\d/.test(w));
  // (a number the screen shows is the strong sign; plain words need most of the line, and at least three of them)
  return (nums.length > 0 && nums.every((n) => scr.has(n)) && hit / ws.length >= 0.4) || (hit >= 3 && hit / ws.length >= 0.75);
}

export interface Safe { top: number; bottom: number; left: number; right: number; lowFrom: number; rightLow: number }
/** The caption block's size for n lines of the given widths (px). */
export const blockOf = (widths: number[]) => ({ w: Math.max(...widths, 0) + 2 * CAP_PAD, h: widths.length * CAP_LH + CAP_PAD });
/** Preferred block centres (fraction of the frame height): the lower middle first (where people read captions). */
export const CAP_YS = [0.6, 0.55, 0.65, 0.5, 0.45, 0.4, 0.35, 0.3, 0.275, 0.25, 0.225, 0.2, 0.575, 0.525, 0.475, 0.425, 0.375, 0.325, 0.625] as const;
/** Where the caption block goes (its top-left), or null when no place is clear: inside the safe zone, over no word on
 *  the frame, clear of every focal point. */
export function placeCaption(widths: number[], boxes: Box[], focus: Pt[], W: number, H: number, S: Safe, prefer?: number): { x: number; y: number; w: number; h: number; f: number } | null {
  const { w, h } = blockOf(widths), x = (W - w) / 2;
  // (the page's previous place first: a caption does not jump while it is read)
  for (const f of [...(prefer === undefined ? [] : [prefer]), ...CAP_YS]) {
    const y = Math.round(f * H - h / 2);
    if (y < S.top || y + h > S.bottom || x < S.left || x + w > S.right) continue;
    if (y + h > S.lowFrom && x + w > S.rightLow) continue;
    if (boxes.some((b) => !b.deco && b.x0 < x + w + BOX_MARGIN && b.x1 > x - BOX_MARGIN && b.y0 < y + h + BOX_MARGIN && b.y1 > y - BOX_MARGIN)) continue;
    if (focus.some((p) => { const r = p.r ?? FOCUS_R; return p.x > x - r && p.x < x + w + r && p.y > y - r && p.y < y + h + r; })) continue;
    return { x, y, w, h, f };
  }
  return null;
}
