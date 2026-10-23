// Timing rules of the shared video (video-plan.ts): every caption readable, the long cut over 60 s, the short cut
// under 30 s, no sentence cut off, no camera jumping back. Fixtures = the real chapter texts of seven foods / meals
// as the app wrote them on 2026-10-22 (cola, water, espresso, 3 beers over 2 h, a whole pizza, kebab, a 3-item meal).
import { describe, expect, it } from 'vitest';
import { minutesFromU, uFromMinutes } from '../time';
import { FPS, LENGTH, planVideo, READ, readSeconds, sentences, splitPages, videoText, wordCount, type StopIn } from './video-plan';
import fixtures from './video-plan.fixtures.json';

const FIX = fixtures as Record<string, StopIn[]>;
const plan = (s: StopIn[], cut: 'long' | 'short') => planVideo(s, cut, uFromMinutes, minutesFromU);
const norm = (t: string) => t.replace(/\s+/g, ' ').trim();

describe('reading rule', () => {
  it('gives every caption at least the minimum and never more than ~3 words per second', () => {
    for (const t of ['Fine.', 'Your stomach fills up.', 'One can: 35 g of sugar (about 9 teaspoons) and 32 mg of caffeine.',
      'Over the next hours your body burns about half of the fructose for energy and, mainly in the liver, turns it into glucose.']) {
      const s = readSeconds(t);
      expect(s).toBeGreaterThanOrEqual(READ.minPage);
      expect(wordCount(t) / s).toBeLessThanOrEqual(READ.maxWps);
      expect(t.length / s).toBeLessThanOrEqual(15); // well under Netflix's 17-20 characters/s
    }
    expect(readSeconds('A short line.', true)).toBeGreaterThan(readSeconds('A short line.')); // new moment: extra time
  });
  it('keeps numbers whole when splitting sentences', () => {
    expect(sentences('Peak 2.4 mmol/L. Then 0.5‰ later. Done!')).toEqual(['Peak 2.4 mmol/L.', 'Then 0.5‰ later.', 'Done!']);
  });
  it('splits long text into pages that fit, without losing or reordering a word', () => {
    for (const chapters of Object.values(FIX)) for (const c of chapters) {
      const pages = splitPages(c.text);
      expect(norm(pages.join(' '))).toBe(norm(c.text));
      for (const p of pages) expect(p.length).toBeLessThanOrEqual(Math.round(READ.pageChars * 1.12));
      for (const p of pages.slice(0, -1)) expect(p).not.toMatch(/\b(the|a|an|of|to|your)$/i); // no cliff-hanger line ends
    }
  });
});

describe('video plan', () => {
  for (const [name, chapters] of Object.entries(FIX)) {
    for (const cut of ['long', 'short'] as const) {
      it(`${name} · ${cut}: right length, readable captions, whole sentences, smooth time`, () => {
        const p = plan(chapters, cut);
        const lim = LENGTH[cut];
        // length: long ≥ 61 s with margin (platforms' 60 s+ threshold), short within 15-30 s
        expect(p.seconds).toBeGreaterThanOrEqual(cut === 'long' ? 61.5 : lim.min);
        expect(p.seconds).toBeLessThanOrEqual(lim.max + 0.5);
        expect(p.frames.length).toBe(Math.round(p.seconds * FPS));
        // the first frame is the hook (the thumbnail), the last is the end card
        expect(p.frames[0].phase).toBe('intro');
        expect(p.frames[p.frames.length - 1].phase).toBe('outro');
        // every caption page is up long enough for its words
        for (const pg of p.pages) {
          expect(pg.s).toBeGreaterThanOrEqual(readSeconds(pg.text) - 1 / FPS);
          expect(wordCount(pg.text) / pg.s).toBeLessThanOrEqual(READ.maxWps);
        }
        // captions change only after their full time (count frames each caption stays on screen)
        const runs: { cap: string; n: number }[] = [];
        for (const f of p.frames) if (f.cap) { const r = runs[runs.length - 1]; if (r && r.cap === f.cap) r.n++; else runs.push({ cap: f.cap, n: 1 }); }
        for (const r of runs) expect(r.n / FPS).toBeGreaterThanOrEqual(readSeconds(r.cap) - 1 / FPS);
        // a caption is never a sentence cut off: the pages of a moment are its first whole sentences
        const byStop = new Map<number, string[]>();
        for (const pg of p.pages) byStop.set(pg.stop, [...(byStop.get(pg.stop) ?? []), pg.text]);
        for (const [min, texts] of byStop) {
          const src = chapters.filter((c) => c.min === min).slice(-1)[0];
          expect(src).toBeTruthy();
          const all = sentences(videoText(src.text)), joined = norm(texts.join(' '));
          // whole sentences, or (short cut, 2026-10-23) just the chapter title of a moment whose sentence is long
          expect(all.some((_s, k) => norm(all.slice(0, k + 1).join(' ')) === joined) || (cut === 'short' && joined === norm(src.title))).toBe(true);
        }
        // time only moves forward (no camera jumping back), and the day ends at 24 h
        const mains = p.frames.filter((f) => f.phase !== 'outro');
        for (let i = 1; i < mains.length; i++) expect(mains[i].m).toBeGreaterThanOrEqual(mains[i - 1].m - 1e-9);
        expect(p.stops[p.stops.length - 1]).toBe(1440);
        // the start (first sip / bite) is always in
        expect(p.stops[0]).toBe(0);
      });
    }
  }
  it('long cut: keeps the moments people share (peaks, dips, bedtime) when it has to leave some out', () => {
    const p = plan(FIX.cola, 'long');
    expect(p.stops).toEqual(expect.arrayContaining([0, 20, 75]));
  });
  it('a tiny story still makes a long cut over 61 s (calmer captions, nothing repeated)', () => {
    const p = plan([{ min: 0, title: 'First sip', text: 'One glass of water.' }, { min: 30, title: 'Kidneys', text: 'Your kidneys filter it.' }], 'long');
    expect(p.seconds).toBeGreaterThanOrEqual(61.5);
    expect(new Set(p.pages.map((x) => x.text)).size).toBe(p.pages.length);
  });
});
