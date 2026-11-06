// 2026-11-05: the voiceover script (video-narration.ts) over every database item (all three cuts) and the audit
// comparisons, with the speech engine mocked: each clip lasts its spoken word count at a seeded 2.4–3.0 words/s.
import { describe, expect, it } from 'vitest';
import { AUDIT_CUTS, AUDIT_PROFILE, auditCompare, auditItems, auditPairs, auditSingle, compareNarrIn, singleNarrIn } from './text-audit';
import { HOOK_QUIET_S, IMPACT_PRE_S, IMPACT_POST_S, OVERRUN_S, TAIL_S, lintNarration, narrationFor, numbersOf, placeClips, speakable, wordsOf, type NarrIn } from './video-narration';

let rnd = 20261105;
const rand = () => { rnd = (rnd * 1664525 + 1013904223) >>> 0; return rnd / 4294967296; };
const mockDur = (say: string) => wordsOf(say) / (2.4 + 0.6 * rand()) + 0.12; // + the engine's lead-in/out silence

function check(nin: NarrIn, where: string, bad: string[]) {
  const lines = narrationFor(nin);
  for (const i of lintNarration(lines, nin)) bad.push(`${where}: ${i.cls}: ${i.text}`);
  if (!lines.some((l) => l.id === 'hook')) bad.push(`${where}: no hook line`);
  if (!lines.some((l) => l.id === 'answer')) bad.push(`${where}: no end line`);
  // (as voice-tts makeVoice: a clip a little long for its slot is said again faster, at most 1.2×)
  const placed = placeClips(lines, lines.map((l) => { const d = mockDur(l.say); return d > l.slotS + OVERRUN_S ? d / Math.min(1.2, d / l.slotS) : d; }), nin.plan.seconds);
  const cues = nin.plan.cues, impacts = cues.filter((c) => c.kind === 'peak' || c.kind === 'verdict').map((c) => c.t);
  const outro = cues.find((c) => c.kind === 'outro')!.t;
  placed.forEach((c, i) => {
    const e = c.t + c.dur;
    if (c.t < HOOK_QUIET_S) bad.push(`${where}: voice in the hook frame`);
    if (e > nin.plan.seconds - TAIL_S + 1e-6) bad.push(`${where}: voice past the end`);
    if (placed[i + 1] && e > placed[i + 1].t) bad.push(`${where}: clips overlap`);
    if (impacts.some((p) => c.t < p + IMPACT_POST_S && e > p - IMPACT_PRE_S + OVERRUN_S + 1e-6)) bad.push(`${where}: voice over an impact: ${c.line.text}`);
    // one source: a number said is on the screen text the line reads (v20: the hook card, a story card, the end
    // card's hero), and the hero's only while the end card is up
    const nums = numbersOf(c.line.say);
    if (nums.length) {
      const src = numbersOf(c.line.source);
      if (nums.some((n) => !src.includes(n))) bad.push(`${where}: number not on screen: ${c.line.text}`);
      if (c.line.id === 'answer' && c.t < outro) bad.push(`${where}: number said before the end card`);
      if (c.line.id === 'answer' && nin.hero && nums.some((n) => !numbersOf(`${nin.hero!.big} ${nin.hero!.small}`).includes(n))) bad.push(`${where}: end line number not the hero's: ${c.line.text}`);
    }
  });
  return { lines, placed };
}

describe('voiceover script (video-narration.ts)', () => {
  it('speech text keeps every number and spells out the units', () => {
    expect(speakable('Blood sugar: up 30–50 %.')).toBe('Blood sugar: up 30 to 50 percent.');
    expect(speakable('That’s 434 kcal in total.')).toContain('434 calories');
    expect(speakable('95 mg of caffeine, still in your body.')).toContain('95 milligrams');
    expect(numbersOf(speakable('Sugar: up 18–44 %.'))).toEqual(['18', '44']);
    expect(wordsOf('up 22 percent')).toBe(4); // "twenty two" is two words
    expect(wordsOf('0.04')).toBe(4);           // zero point zero four
  });

  it('every item, every cut: timing, sync, numbers, lints (mocked clip lengths)', () => {
    const bad: string[] = [];
    let n = 0, clips = 0;
    for (const it of auditItems()) for (const cut of AUDIT_CUTS) {
      const o = auditSingle(it.x, cut, 'A', AUDIT_PROFILE, it.vname);
      const solid = /bite/i.test(it.x.built.story.chapters[0]?.title ?? '');
      const r = check(singleNarrIn(it.x, o, solid), `${it.id} ${cut}`, bad);
      n++; clips += r.placed.length;
      if (cut === 'long' && r.lines.length < 3) bad.push(`${it.id} long: only ${r.lines.length} lines`);
      if ((it.x.built.alcoholG ?? 0) > 1 && r.lines.some((l) => /\b(fun|enjoy|relax|cheers|reward|celebrate)\b/i.test(l.text))) bad.push(`${it.id}: alcohol framed positively`);
    }
    expect(bad.slice(0, 20)).toEqual([]);
    expect(clips / n).toBeGreaterThan(2.5); // on average at least 2.5 clips survive real-ish lengths
  }, 600_000);

  it('audit comparisons, every cut', () => {
    const bad: string[] = [];
    for (const pr of auditPairs(auditItems(), 120)) for (const cut of AUDIT_CUTS) {
      const o = auditCompare(pr.a, pr.b, cut);
      const r = check(compareNarrIn(pr.a, pr.b, o.cp), `${pr.id} ${cut}`, bad);
      if (!o.cp.guess && r.lines.some((l) => /guess/i.test(l.text))) bad.push(`${pr.id}: a guess line without the game`);
    }
    expect(bad.slice(0, 20)).toEqual([]);
  }, 600_000);
});
