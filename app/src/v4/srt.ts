// Audit C16 (2026-11-12): subtitles (.srt) next to the video, for YouTube / Facebook uploads (accessibility, and
// the platforms index the words). Built from the voiceover's own placed lines (voice-tts.ts VoiceTrack.lines, the
// same CapLine[] the burned-in word-by-word captions come from), so the file says exactly what the voice says, when
// it says it. No new wording here: only timing and line breaks.
import type { CapLine } from './video-captions';

/** Characters per subtitle row (the usual broadcast limit); a cue holds at most two rows. */
export const SRT_ROW = 42;

const stamp = (s: number) => {
  const ms = Math.max(0, Math.round(s * 1000));
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3_600_000))}:${p(Math.floor(ms / 60_000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

/** Words into rows of at most SRT_ROW characters (a longer single word gets a row of its own). */
function rows(text: string): string[] {
  const out: string[] = [];
  let cur = '';
  for (const w of text.trim().split(/\s+/).filter(Boolean)) {
    if (cur && cur.length + 1 + w.length > SRT_ROW) { out.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) out.push(cur);
  return out;
}

/** The SRT file for these spoken lines (times in seconds from the video's start). Empty when there is nothing said. */
export function srtOf(lines: readonly CapLine[]): string {
  const cues: { t0: number; t1: number; text: string }[] = [];
  const sorted = [...lines].filter((l) => l.text.trim() && l.dur > 0).sort((a, b) => a.t - b.t);
  for (const l of sorted) {
    const rs = rows(l.text);
    // more than two rows: split into cues of two rows, each timed by its share of the characters
    const groups: string[][] = [];
    for (let i = 0; i < rs.length; i += 2) groups.push(rs.slice(i, i + 2));
    const total = groups.reduce((a, g) => a + g.join(' ').length, 0) || 1;
    let t = l.t;
    for (const g of groups) {
      const d = (l.dur * g.join(' ').length) / total;
      cues.push({ t0: t, t1: t + d, text: g.join('\n') });
      t += d;
    }
  }
  return cues.map((c, i) => `${i + 1}\n${stamp(c.t0)} --> ${stamp(c.t1)}\n${c.text}\n`).join('\n');
}
