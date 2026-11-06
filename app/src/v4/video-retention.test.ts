// v20 (2026-11-06, owner: "not a boring reel", hold attention from the first second to the last): the retention sweep.
// Every database item (all three cuts) and the audit comparisons, with the speech engine mocked (each clip lasts its
// spoken word count at a seeded 2.4-3.0 words/s): the voice tells the story (coverage, no long silence except the hush
// before an impact), something changes on screen every few seconds (cues, caption pages, punch-ins), what is said is
// what the card says, and every cut keeps its length.
import { describe, expect, it } from 'vitest';
import { AUDIT_CUTS, AUDIT_PROFILE, auditCompare, auditItems, auditPairs, auditSingle, compareNarrIn, singleNarrIn } from './text-audit';
import { IMPACT_POST_S, IMPACT_PRE_S, OVERRUN_S, cardSpans, narrationFor, placeClips, wordsOf, type NarrIn } from './video-narration';
import { captionTrack, punchTimes, type CapLine } from './video-captions';
import { LENGTH, type Cut } from './video-plan';

let rnd = 20261106;
const rand = () => { rnd = (rnd * 1664525 + 1013904223) >>> 0; return rnd / 4294967296; };
const mockDur = (say: string) => wordsOf(say) / (2.4 + 0.6 * rand()) + 0.12;
/** As voice-tts makeVoice: a clip a little long for its slot is said again faster (at most 1.2×). */
export const spoken = (say: string, slotS: number) => { const d = mockDur(say); return d > slotS + OVERRUN_S ? d / Math.min(1.2, d / slotS) : d; };

/** The retention numbers of one video: voice coverage, the longest silence (not counting the hush before an impact),
 *  the longest stretch without a visual event, and any line that does not match its card on screen. */
export function retention(nin: NarrIn) {
  const lines = narrationFor(nin), { seconds, cues } = nin.plan;
  const placed = placeClips(lines, lines.map((l) => spoken(l.say, l.slotS)), seconds);
  const impacts = cues.filter((c) => c.kind === 'peak' || c.kind === 'verdict').map((c) => c.t);
  const outro = cues.find((c) => c.kind === 'outro')?.t ?? seconds;
  let voiced = 0, gap = 0, gapAt = 0, prev = 0;
  const hush = (a: number, b: number) => impacts.some((p) => a < p + IMPACT_POST_S + 0.6 && b > p - IMPACT_PRE_S);
  for (const c of placed) {
    voiced += c.dur;
    if (!hush(prev, c.t) && c.t - prev > gap) { gap = c.t - prev; gapAt = prev; }
    prev = c.t + c.dur;
  }
  // (the last second or so after the loop line is the hand-over to frame 0)
  if (outro - prev > gap && !hush(prev, outro)) { gap = outro - prev; gapAt = prev; }
  const capLines: CapLine[] = placed.map((c) => ({ text: c.line.text, t: c.t, dur: c.dur, card: c.line.card, side: c.line.side }));
  const pages = captionTrack(capLines);
  const punches = punchTimes(pages, impacts, seconds).map((p) => p.t);
  const VIS = new Set(['page', 'micro', 'move', 'stop', 'peak', 'verdict', 'next', 'lights', 'riser', 'surge', 'day', 'outro', 'sip', 'rewind', 'guess', 'race', 'heart', 'night', 'teaser']);
  const ev = [0, ...cues.filter((c) => VIS.has(c.kind)).map((c) => c.t), ...pages.map((p) => p.t0), ...punches, outro].filter((t) => t <= outro).sort((a, b) => a - b);
  let still = 0, stillAt = 0;
  for (let i = 1; i < ev.length; i++) if (ev[i] - ev[i - 1] > still) { still = ev[i] - ev[i - 1]; stillAt = ev[i - 1]; }
  // what is said is what the card says, while that card is on screen
  const spans = nin.plan.frames ? cardSpans(nin.plan.frames) : [];
  const mismatch = placed.filter((c) => c.line.card && !c.line.card.split('|').every((x) => spans.some((s) => (s.a === x || s.b === x) && s.t0 <= c.t + 0.05 && s.t1 >= c.t)))
    .map((c) => `${c.t.toFixed(1)} ${c.line.text}`);
  return { cov: voiced / seconds, gap, gapAt, still, stillAt, mismatch, seconds, lines: placed.length, punches: punches.length };
}

const check = (r: ReturnType<typeof retention>, cut: Cut, where: string, bad: string[]) => {
  if (r.cov < 0.45) bad.push(`${where}: voice covers only ${(100 * r.cov).toFixed(0)} %`);
  if (r.gap > 5.5) bad.push(`${where}: ${r.gap.toFixed(1)} s without voice at ${r.gapAt.toFixed(1)} s`);
  if (r.still > 3.2) bad.push(`${where}: ${r.still.toFixed(1)} s without a visual event at ${r.stillAt.toFixed(1)} s`);
  if (r.mismatch.length) bad.push(`${where}: said while its card is not on screen: ${r.mismatch.join(' / ')}`);
  const L = LENGTH[cut];
  if (r.seconds < L.min - 0.05 || r.seconds > L.max + 0.05) bad.push(`${where}: ${r.seconds.toFixed(1)} s is outside ${L.min}-${L.max} s`);
};
const stats = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return { min: s[0], median: s[Math.floor(s.length / 2)], max: s[s.length - 1] }; };

describe('v20 retention sweep (voice coverage, silences, visual events, said = shown, lengths)', () => {
  it('every item, every cut', () => {
    const bad: string[] = [], cov: Record<Cut, number[]> = { long: [], medium: [], short: [] }, gaps: number[] = [];
    for (const it of auditItems()) for (const cut of AUDIT_CUTS) {
      const o = auditSingle(it.x, cut, 'A', AUDIT_PROFILE, it.vname);
      const r = retention(singleNarrIn(it.x, o, /bite/i.test(it.x.built.story.chapters[0]?.title ?? '')));
      check(r, cut, `${it.id} ${cut}`, bad); cov[cut].push(r.cov); gaps.push(r.gap);
    }
    for (const cut of AUDIT_CUTS) console.log(`[retention] singles ${cut}: voice coverage`, JSON.stringify(stats(cov[cut]), (_k, v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v)));
    console.log('[retention] singles: longest silence', JSON.stringify(stats(gaps)));
    expect(bad.slice(0, 25)).toEqual([]);
    for (const cut of AUDIT_CUTS) expect(stats(cov[cut]).median).toBeGreaterThan(0.6);
    expect(stats(gaps).median).toBeLessThan(3.5); // (the typical video: no silence over ~3 s but the hush before the hit)
  }, 600_000);

  it('audit comparisons, every cut', () => {
    const bad: string[] = [], cov: number[] = [];
    for (const pr of auditPairs(auditItems(), 120)) for (const cut of AUDIT_CUTS) {
      const o = auditCompare(pr.a, pr.b, cut);
      const r = retention(compareNarrIn(pr.a, pr.b, o.cp));
      check(r, cut, `${pr.id} ${cut}`, bad); cov.push(r.cov);
    }
    console.log('[retention] comparisons: voice coverage', JSON.stringify(stats(cov), (_k, v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v)));
    expect(bad.slice(0, 25)).toEqual([]);
    expect(stats(cov).median).toBeGreaterThan(0.55);
  }, 600_000);
});
