import { describe, expect, it } from 'vitest';
import { SRT_ROW, srtOf } from './srt';

describe('srtOf (audit C16: subtitles from the voiceover lines)', () => {
  it('numbers cues and writes SRT timestamps', () => {
    const s = srtOf([{ text: 'One can of cola.', t: 1.25, dur: 1.5 }, { text: 'Sugar hits your blood.', t: 62.5, dur: 2 }]);
    expect(s).toBe('1\n00:00:01,250 --> 00:00:02,750\nOne can of cola.\n\n2\n00:01:02,500 --> 00:01:04,500\nSugar hits your blood.\n');
  });
  it('keeps rows short and splits long lines into two-row cues within the line\'s time', () => {
    const text = 'Twenty minutes in, the sugar from this can is already in your blood and your pancreas answers with insulin right away.';
    const s = srtOf([{ text, t: 10, dur: 6 }]);
    const cues = s.trim().split('\n\n');
    expect(cues.length).toBeGreaterThan(1);
    for (const c of cues) { const rows = c.split('\n').slice(2); expect(rows.length).toBeLessThanOrEqual(2); for (const r of rows) expect(r.length).toBeLessThanOrEqual(SRT_ROW); }
    expect(cues[0]).toContain('00:00:10,000 -->');
    expect(cues[cues.length - 1]).toContain('--> 00:00:16,000');
    expect(cues.map((c) => c.split('\n').slice(2).join(' ')).join(' ')).toBe(text);
  });
  it('sorts by time and skips empty lines', () => {
    const s = srtOf([{ text: 'b', t: 5, dur: 1 }, { text: ' ', t: 1, dur: 1 }, { text: 'a', t: 2, dur: 1 }]);
    expect(s.indexOf('a')).toBeLessThan(s.indexOf('b'));
    expect(srtOf([])).toBe('');
  });
});
