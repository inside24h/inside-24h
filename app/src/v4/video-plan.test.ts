// Timing rules of the shared video (video-plan.ts): every caption readable, the long cut over 60 s, the short cut
// under 30 s, no sentence cut off, no camera jumping back. Fixtures = the real chapter texts of seven foods / meals
// as the app wrote them on 2026-10-22 (cola, water, espresso, 3 beers over 2 h, a whole pizza, kebab, a 3-item meal).
import { describe, expect, it } from 'vitest';
import { minutesFromU, uFromMinutes } from '../time';
import { FPS, LENGTH, planCompare, planVideo, READ, readSeconds, RISER_S, sentences, splitPages, TEASE_PREFIX, wordCount, type StopIn } from './video-plan';
import fixtures from './video-plan.fixtures.json';
import { beatLines, BEAT_WORDS, DYNAMIC, isCard, numberConflict } from './video-beats';

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
        // 2026-10-24: every card is a complete short thought, and a moment's cards are its first beats in order
        const byStop = new Map<number, string[]>();
        for (const pg of p.pages) byStop.set(pg.stop, [...(byStop.get(pg.stop) ?? []), pg.text]);
        for (const [min, texts] of byStop) {
          const src = chapters.filter((c) => c.min === min).slice(-1)[0];
          expect(src).toBeTruthy();
          const beats = beatLines(src), own = texts.filter((t) => !t.startsWith(TEASE_PREFIX)); // + the mid-video "Coming up: …"
          expect(texts.length - own.length).toBeLessThanOrEqual(1);
          expect(beats.slice(0, own.length)).toEqual(own);
          for (const t of texts) expect(isCard(t) || t === src.title.trim(), `"${t}"`).toBe(true);
        }
        // time only moves forward (no camera jumping back), and the day ends at 24 h
        // (after the cold open and its rewind to +0:00, 2026-10-24)
        const mains = p.frames.filter((f) => f.phase !== 'outro' && f.beat !== 'teaser' && f.beat !== 'rewind');
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

// 2026-10-24: caption cards (video-beats.ts) — owner review: no broken fragments, no number that disagrees with a gauge
describe('caption cards', () => {
  const all = Object.values(FIX).flatMap((chs) => chs.map((c) => ({ c, cards: beatLines(c, { name: 'One can of cola' }) })));
  it('every card is a complete thought: capital first, full stop last, at most 8 words, never a mid-sentence chunk', () => {
    for (const { c, cards } of all) for (const t of cards) {
      if (t === c.title.trim()) continue; // a chapter title on its own is a label
      expect(t, `${c.title}: "${t}"`).toMatch(/^[A-Z0-9“"+]/); // never starts lowercase ("your stomach within …")
      expect(t, `${c.title}: "${t}"`).toMatch(/[.!?]$/);
      expect(t).not.toMatch(/[:;,]\.?$/); // never ends on ":" / "," ("… within about 40 minutes:")
      expect(wordCount(t), t).toBeLessThanOrEqual(BEAT_WORDS);
      expect(t, t).not.toMatch(/^(?:and|but|or|of|to|in|is|the|a|mainly|about)\b/); // not the tail of a sentence
    }
  });
  it('numbers that follow the clock (‰, mmol/L, caffeine left) are never on a card, only on the gauge', () => {
    for (const { cards } of all) for (const t of cards) expect(DYNAMIC.test(t), t).toBe(false);
    // the owner's case: bedtime said 0.33–0.83 ‰ while the gauge said 0.31–0.77 ‰
    const bed = beatLines({ min: 30, title: 'Bedtime', text: 'There is still alcohol in your blood (about 0.33–0.83 ‰). You may fall asleep faster, but the second half of the night will be lighter and more broken.' });
    expect(bed).toEqual(['There is still alcohol in your blood.', 'You may fall asleep faster.', 'Later, your sleep is lighter and more broken.']);
  });
  it('pacing: the last round is said as the model doses it (one every 40 minutes over 2 h: the third at +1:20)', () => {
    const pace = { doses: 3, overMin: 120, everyMin: 40, round: 'drink' };
    expect(beatLines({ min: 80, title: 'Last drink', text: '20:20: the last of the 3 drinks, 80 minutes after the first.' }, { pace }))
      .toEqual(['Drink 3 of 3, at +1:20.', 'One every 40 minutes, over 2 h.']);
    expect(beatLines({ min: 0, title: 'First sip', text: '3 × 500 ml beer. 648 kcal: 54 g carbohydrate.' }, { name: '3 × 500 ml of beer over 2 h', pace }).slice(0, 2)).toEqual(['3 × 500 ml of beer.', 'Over 2 h: one drink every 40 minutes.']);
  });
  it('the owner’s broken cards are now whole', () => {
    const t = (title: string, text: string) => beatLines({ min: 1, title, text });
    expect(t('In your stomach', 'Each drink: half of it leaves your stomach within about 40 minutes: the alcohol and the rest of the drink slow the stomach down (water would be gone in about 13).'))
      .toEqual(['Each drink: half leaves within 40 minutes.', 'The drink slows your stomach down.']);
    expect(t('The liver breaks it down', 'Your liver takes the caffeine apart: half of it is gone about every 6.0 hours (our estimate; in healthy adults it ranges from 2.5 to 10 hours).'))
      .toEqual(['Your liver takes the caffeine apart.', 'Half is gone every 6.0 hours.']);
    expect(t('Bedtime', 'About 12 mg of caffeine is still in you at 23:00. Too little to affect your sleep.')).toEqual(['Some caffeine is still in you.', 'Too little to affect your sleep.']);
  });
});

// 2026-10-24 creative spec: one cue timeline for picture and sound
describe('effects timeline', () => {
  for (const [name, chapters] of Object.entries(FIX)) for (const cut of ['long', 'short'] as const) {
    it(`${name} · ${cut}: cold open, rewind, sip, one peak with its riser, a new event at least every 3.2 s`, () => {
      const peak = chapters.find((c) => /peak/i.test(c.title))?.min;
      const p = planVideo(chapters, cut, uFromMinutes, minutesFromU, { peakMin: peak, drinkAtMin: 18 * 60, lights: [0, 1, 2, 0] });
      const at = (k: string) => p.cues.filter((c) => c.kind === k);
      expect(p.frames[0].beat).toBe('teaser'); // frame 0 = the thumbnail = the cold open
      expect(at('teaser')[0].t).toBe(0); expect(at('rewind').length).toBe(1); expect(at('sip').length).toBe(1);
      expect(p.frames[Math.round(at('sip')[0].t * FPS)].m).toBeLessThan(0.5); // rewound to +0:00 before the sip
      const impacts = at('peak').length + at('verdict').length;
      expect(impacts).toBeLessThanOrEqual(cut === 'short' ? 1 : 2);
      if (peak !== undefined) {
        expect(at('peak').length).toBe(1);
        const r = at('riser')[0], k = at('peak')[0];
        expect(k.t - r.t).toBeLessThanOrEqual(RISER_S + 1e-9);
        expect(k.t - r.t).toBeGreaterThan(0.5);
        expect(p.frames[Math.round(k.t * FPS)].beat).toBe('hold'); // the impact lands as the peak moment arrives
      }
      // never 3.2 s without a new visual event before the end card
      const outro = at('outro')[0].t;
      const ev = [0, ...p.cues.filter((c) => !['start', 'end', 'night'].includes(c.kind) && c.t <= outro).map((c) => c.t)].sort((a, b) => a - b);
      for (let i = 1; i < ev.length; i++) expect(ev[i] - ev[i - 1], `gap at ${ev[i - 1].toFixed(2)} s`).toBeLessThanOrEqual(3.2);
      // the end card lights come on one by one
      expect(at('lights').map((c) => c.data?.level)).toEqual([0, 1, 2, 0]);
      // NEXT chips name a moment that really comes next
      for (const c of at('next')) if (c.data?.label !== 'tease') expect(p.stops).toContain(c.data?.v);
    });
  }
  it('comparison: a guess at the start, one verdict impact, the race finish of each side', () => {
    const ch = FIX.cola;
    const stops = [0, 20, 90, 720, 1440].map((m) => { const c = ch.filter((x) => x.min <= m).slice(-1)[0]; return { min: m, a: c.text, b: c.text, titleA: c.title, titleB: c.title }; });
    const done = (at: number) => Float32Array.from({ length: 1441 }, (_, m) => (m >= at ? 1 : m / at));
    const p = planCompare(stops, 'long', uFromMinutes, minutesFromU, { peakMin: 20, verdict: true, lights: [0, 0, 1, 2], race: { a: done(60), b: done(120) } });
    expect(p.cues.filter((c) => c.kind === 'guess').length).toBe(1);
    expect(p.cues.filter((c) => c.kind === 'verdict').length).toBe(1);
    expect(p.cues.filter((c) => c.kind === 'race').map((c) => c.data?.side)).toEqual([0, 1]);
    expect(p.cues.filter((c) => c.kind === 'peak').length + p.cues.filter((c) => c.kind === 'verdict').length).toBeLessThanOrEqual(2);
  });
  it('short comparison: the hook, the answer (its impact) and the verdict all fit, readable', () => {
    const ch = FIX.cola;
    const mins = [0, 20, 57, 90, 240, 720, 1440];
    const stops = mins.map((m) => { const c = ch.filter((x) => x.min <= m).slice(-1)[0]; return { min: m, a: c.text, b: c.text, titleA: c.title, titleB: c.title }; });
    const p = planCompare(stops, 'short', uFromMinutes, minutesFromU, { peakMin: 57, teaserMin: 57, verdict: true, lights: [0, 0, 0, 0] });
    expect(p.seconds).toBeLessThanOrEqual(30.5);
    expect(p.stops).toContain(57); // the answer's moment is never dropped
    expect(p.cues.filter((c) => c.kind === 'peak').length).toBe(1);
    expect(p.cues.filter((c) => c.kind === 'verdict').length).toBe(1);
    for (const pg of p.pages) expect(pg.s).toBeGreaterThanOrEqual(READ.minPage - 1 / FPS);
  });
  it('night: the tone comes in after 22:00 and leaves at 07:00, never as a flicker', () => {
    const p = planVideo(FIX['beer-3-over-2h'], 'long', uFromMinutes, minutesFromU, { drinkAtMin: 19 * 60, wakeMin: 7 * 60 });
    const n = p.cues.filter((c) => c.kind === 'night');
    expect(n.length).toBeGreaterThanOrEqual(1);
    expect(n[0].data?.v).toBe(1);
    for (let i = 1; i < p.frames.length; i++) expect(Math.abs((p.frames[i].night ?? 0) - (p.frames[i - 1].night ?? 0))).toBeLessThan(0.1); // eased, ≤ 3 changes/s
  });
});

describe('card vs gauge numbers (owner review 2026-10-24)', () => {
  it('spots a card and a gauge that name the same thing with different numbers', () => {
    expect(numberConflict('22.7 g of fiber reach your large intestine.', ['20 g fiber'])).toBe(true);
    expect(numberConflict('22.7 g of fiber reach your large intestine.', ['22.7 g fiber'])).toBe(false);
    expect(numberConflict('35 g of sugar: about 9 teaspoons.', ['4.8 g sugar', '330 ml'])).toBe(true); // same thing, different number
    expect(numberConflict('63 mg of caffeine.', ['45 mg caffeine'])).toBe(true);
    expect(numberConflict('Half has moved on after 226 minutes.', ['1154 g'])).toBe(false);
  });
  it('the pizza fiber card has no number any more (the gauge counts it)', () => {
    const c = beatLines({ min: 732, title: 'Into the large intestine', text: 'What you can’t digest, 22.7 g of fiber, reaches the start of your large intestine. Your gut bacteria start fermenting it.' });
    for (const x of c) expect(numberConflict(x, ['20 g fiber'])).toBe(false);
    expect(beatLines({ min: 1440, title: '24 hours later', text: '2% has left your body so far.' })).toEqual(['Almost all of it is still inside you.']);
  });
});
