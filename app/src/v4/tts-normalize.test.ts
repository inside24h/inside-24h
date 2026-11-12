// v21 (video review 2026-11-06): what the speech engine is given. Units, symbols, clock times and durations are said
// the way people say them ("63 milligrams", "7 in the morning", "an hour and a half"), never as raw symbols or
// abbreviations; the captions show the same words in a readable form; no line repeats an earlier one.
import { describe, expect, it } from 'vitest';
import { AUDIT_CUTS, AUDIT_PROFILE, auditCompare, auditItems, auditPairs, auditSingle, compareNarrIn, singleNarrIn } from './text-audit';
import { narrationFor, numbersOf, repeats, shownText, speakable, ttsText, type NarrLine } from './video-narration';
import { sweep } from './sweep.testutil';

const tts = (s: string) => ttsText(speakable(s));
/** What may reach the speech engine: words, whole or decimal numbers, a clock time, plain punctuation. */
const ALLOWED = /^[A-Za-z0-9 ,.?!'’“”:;\-—]+$/;
const RAW = /[%×&+~≈/°µ]|\b(h|min|mg|ml|g|kg|kcal|cal|vs|BAC|oz|AM|PM|am|pm|approx|e\.g|i\.e)\b|\b\d+\.0\b|(^|[^\d.,])1 (hours|minutes|grams|milligrams|milliliters|calories|teaspoons)\b|\d:\d\d(?! (in the|at night))/;
export const ttsIssues = (say: string) => { const t = ttsText(say); return !ALLOWED.test(t) || RAW.test(t) ? [t] : []; };

describe('v21 speech text normalization', () => {
  it('units, symbols, clock times and durations as words', () => {
    expect(tts('63 mg of caffeine.')).toBe('63 milligrams of caffeine.');
    expect(tts('Blood alcohol 0.05%.')).toBe('Blood alcohol 0.05 percent.');
    expect(tts('Blood sugar: up 26–60 %.')).toBe('Blood sugar: up 26 to 60 percent.');
    expect(tts('+1:30')).toBe('an hour and a half later');
    expect(tts('Sugar peak 1 h 30 min in.')).toBe('Sugar peak an hour and a half in.');
    expect(tts('Out after 1 h 50 min.')).toBe('Out after an hour and 50 minutes.');
    expect(tts('Gone after about 2 h.')).toBe('Gone after about 2 hours.');
    expect(tts('The slump comes about 1.5 hours later.')).toBe('The slump comes about an hour and a half later.');
    expect(tts('Half is gone every 6.0 hours.')).toBe('Half is gone every 6 hours.');
    expect(tts('At 07:00, the alcohol should be gone.')).toBe('At 7 in the morning, the alcohol should be gone.');
    expect(tts('Bedtime 22:30.')).toBe('Bedtime 10:30 at night.');
    expect(tts('1 g of sugar.')).toBe('1 gram of sugar.');
    expect(tts('250 ml of oat milk. 2× the rise of cow’s milk.')).toBe('250 milliliters of oat milk. 2 times the rise of cow’s milk.');
    expect(tts('1 ham sub with butter & lettuce: 454 kcal.')).toBe('1 ham sub with butter and lettuce: 454 calories.');
    expect(shownText('At 07:00, gone after about 1–4 h & more.')).toBe('At 7 AM, gone after about 1–4 hours and more.');
    expect(numbersOf('6.0 hours')).toEqual(numbersOf('6 hours'));
  });
  it('two lines that say the same thing are a repeat; a card that answers the hook is not', () => {
    expect(repeats('Your kidneys filter the extra water.', 'Your kidneys filter extra water now.')).toBe(true);
    expect(repeats('When is the alcohol gone?', 'The alcohol is gone after about 1–4 h.')).toBe(false);
    expect(repeats('Your blood sugar climbs to its peak.', 'Insulin brings your blood sugar back down.')).toBe(false);
  });

  it('every narration line of every item, cut and audit comparison: nothing raw reaches the voice', () => {
    const bad = new Set<string>(), rep: string[] = [];
    let n = 0;
    const scan = (lines: NarrLine[], where: string) => {
      for (const l of lines) { n++; for (const t of ttsIssues(l.say)) bad.add(`${t}  <= ${l.text}`); if (/\b\d{1,2}:\d\d\b/.test(l.text) && !/\b(AM|PM)\b/.test(l.text)) bad.add(`caption not in 12 h: ${l.text}`); }
      const drive = lines.filter((l) => /\bdriv/i.test(l.text));
      if (drive.length > 1) rep.push(`${where}: ${drive.map((l) => l.text).join(' / ')}`);
    };
    for (const it of sweep(auditItems())) for (const cut of AUDIT_CUTS) {
      const o = auditSingle(it.x, cut, 'A', AUDIT_PROFILE, it.vname);
      const lines = narrationFor(singleNarrIn(it.x, o, /bite/i.test(it.x.built.story.chapters[0]?.title ?? '')));
      scan(lines, `${it.id} ${cut}`);
      const ded = lines.filter((l) => l.id === 'card' || l.id === 'beat' || l.id === 'tease');
      ded.forEach((l, i) => { if (lines.slice(0, lines.indexOf(l)).some((o) => o.id !== 'hook' && repeats(l.text, o.text))) rep.push(`${it.id} ${cut}: ${l.text}`); void i; });
    }
    for (const pr of sweep(auditPairs(auditItems(), 120))) for (const cut of AUDIT_CUTS) {
      const o = auditCompare(pr.a, pr.b, cut);
      scan(narrationFor(compareNarrIn(pr.a, pr.b, o.cp)), `${pr.id} ${cut}`);
    }
    console.log(`[tts] ${n} lines scanned`);
    expect([...bad].slice(0, 30)).toEqual([]);
    expect(rep.slice(0, 30)).toEqual([]);
  }, 600_000);
});
