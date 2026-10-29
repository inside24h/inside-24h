// Timing rules of the shared video (video-plan.ts): every caption readable, the long cut over 60 s, the short cut
// under 30 s, no sentence cut off, no camera jumping back. Fixtures = the real chapter texts of seven foods / meals
// as the app wrote them on 2026-10-22 (cola, water, espresso, 3 beers over 2 h, a whole pizza, kebab, a 3-item meal).
import { describe, expect, it } from 'vitest';
import { minutesFromU, uFromMinutes } from '../time';
import { CMP_REPEAT_S, END_HOLD_S, FPS, LENGTH, mustCards, PEAK_BY_S, planCompare, planVideo, READ, readSeconds, RISER_S, sentences, splitPages, TEASE_OK, TEASE_PREFIX, wordCount, type StopIn } from './video-plan';
import { musicShape, HUSH_S } from './video-audio';
import fixtures from './video-plan.fixtures.json';
import { beatLines, BEAT_WORDS, DYNAMIC, goneRange, isCard, numberConflict, ruleCards } from './video-beats';
import { mainGauge, plainSugar, sugarPct } from './video-body';
import { parseMeal } from './food/parse';
import { analyze } from './analyze';
import { DEFAULT_PROFILE } from '../science/profile';

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
    expect(bed).toEqual(['There is still alcohol in your blood.', 'You may fall asleep faster, but sleep worse.', 'Later, your sleep is lighter and more broken.']);
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
    expect(beatLines({ min: 1440, title: '24 hours later', text: '2% has left your body so far.' })).toEqual(['Most of the fiber is still in you.']);
  });
});

// ROUND 5 (fresh-eyes critique 2026-10-24, research/improvements/video-critique-2026-10-24.md)
describe('round 5: every beat renders, payoffs, safety, no dead ends', () => {
  const DRINK_AT = 22 * 60; // the fixtures were written for a first sip at 22:00
  const withLines = (name: string, chapters: StopIn[]) => chapters.map((c) => ({ ...c, lines: beatLines(c, { name, caffeineMg: name === 'espresso' ? 63 : name === 'cola' ? 32 : undefined, drinkAtMin: DRINK_AT }) }));
  const corpus = Object.values(FIX).flatMap((cs) => cs.flatMap((c) => sentences(c.text)));
  it('no rule ever loses a card: everything a rule says is a valid card (no orphan "Even before the caffeine kicks in.")', () => {
    for (const sn of corpus) for (const c of ruleCards(sn)) expect(isCard(c), `${c} (from: ${sn.slice(0, 60)})`).toBe(true);
    expect(beatLines(FIX.espresso.find((c) => c.title === 'Your colon reacts')!)[0]).toBe('Coffee sends 1 in 3 to the toilet.');
  });
  for (const [name, chapters] of Object.entries(FIX)) for (const cut of ['long', 'short'] as const) {
    it(`${name} ${cut}: every planned card is on screen for its full time, and a moment starts with its first card`, () => {
      const stops = withLines(name, chapters), p = plan(stops, cut);
      for (const pg of p.pages) {
        const n = p.frames.filter((f) => f.cap === pg.text && f.stop === pg.stop && f.beat === 'hold').length;
        expect(n, pg.text).toBeGreaterThanOrEqual(Math.floor(READ.minPage * FPS) - 1);
      }
      for (const st of new Set(p.pages.map((x) => x.stop))) {
        const lines = stops.filter((x) => x.min === st).pop()?.lines ?? [];
        const first = p.pages.find((x) => x.stop === st)!.text;
        if (!first.startsWith(TEASE_PREFIX)) expect(first, `${name} @${st}`).toBe(lines[0]);
      }
      // the end of the day: at most END_HOLD_S of body without words after the clock reaches +24:00
      const iOut = p.frames.findIndex((f) => f.phase === 'outro'), i24 = p.frames.findIndex((f) => f.m >= 1440);
      expect((iOut - i24) / FPS).toBeLessThanOrEqual(cut === 'long' && chapters.some((c) => c.min >= 1440) ? 99 : END_HOLD_S + 0.05);
      // the glide to +24:00 names where it goes (no stretch without words)
      const glide24 = p.frames.filter((f) => f.beat === 'glide' && f.stop === 1440);
      if (glide24.length) expect(glide24.every((f) => (f.plateA ?? 1) > 0.5 || !!f.next)).toBe(true);
      // the camera reframes at least every 2.6 s while a moment is read
      let run = 1;
      for (let i = 1; i < p.frames.length; i++) { const a = p.frames[i - 1], b = p.frames[i]; run = a.beat === 'hold' && b.beat === 'hold' && a.pg === b.pg ? run + 1 : 1; expect(run).toBeLessThanOrEqual(Math.round(2.6 * FPS) + 1); }
    });
  }
  it('beer: "a breath test can be positive" and "Don’t drive." are in BOTH cuts, together, first on their moment', () => {
    const stops = withLines('beer', FIX['beer-3-over-2h']);
    const morning = stops.find((s) => s.title === 'Next morning')!;
    expect(mustCards(morning.lines!)).toBeGreaterThanOrEqual(2);
    expect(morning.lines![0]).toMatch(/breath test/); expect(morning.lines![1]).toBe('Don’t drive.');
    for (const cut of ['long', 'short'] as const) {
      const p = plan(stops, cut), texts = p.pages.map((x) => x.text);
      expect(texts.some((t) => /breath test/.test(t)), cut).toBe(true);
      expect(texts).toContain('Don’t drive.');
    }
  });
  it('beer at 19:00 (alcohol gone by morning): the hangover warning leads the morning and is in the short cut too', () => {
    const ch = { min: 720, title: 'Next morning', text: '07:00, waking up. The alcohol should be gone, but a hangover can still make you drive worse, even at 0 ‰. If you use insulin or diabetes tablets, watch for low blood sugar this morning: after an evening of drinking it can drop after breakfast.' };
    const lines = beatLines(ch, { name: 'beer' });
    expect(lines.slice(0, 2)).toEqual(['At 07:00, the alcohol should be gone.', 'A hangover can still make you drive worse.']);
    expect(mustCards(lines)).toBe(2);
    const stops = [...withLines('beer', FIX['beer-3-over-2h']).filter((s) => s.title !== 'Next morning'), { ...ch, lines }].sort((a, b) => a.min - b.min);
    const p = planVideo(stops, 'short', uFromMinutes, minutesFromU, { peakMin: 129 });
    expect(p.pages.map((x) => x.text)).toContain('A hangover can still make you drive worse.');
  });
  it('alcohol "gone" is a range of hours from the chapter’s own range (critic: 8.5 h vs a gauge that allowed ~12 h)', () => {
    const gone = withLines('beer', FIX['beer-3-over-2h']).find((s) => s.title === 'Alcohol gone')!;
    expect(gone.lines![0]).toMatch(/^The alcohol is gone after about \d+–\d+ h\.$/);
    expect(gone.lines!.join(' ')).not.toMatch(/Livers differ/);
  });
  it('short: the hook’s payoff (bedtime) is in, has its own card, and the story ends there', () => {
    const stops = withLines('espresso', FIX.espresso), bed = stops.find((s) => s.title === 'Going to bed')!;
    const p = planVideo(stops, 'short', uFromMinutes, minutesFromU, { peakMin: 43, payoffMin: bed.min });
    const own = p.pages.filter((x) => x.stop === bed.min);
    expect(own.length).toBeGreaterThan(0);
    expect(p.stops.filter((m) => m > Math.max(bed.min, 43) && m < 1440)).toEqual([]);
    expect(bed.lines![0]).toMatch(/^(?:About (?:a \w+|half|two thirds|three quarters) of the caffeine remains|Almost all the caffeine is still in you)\.$/);
  });
  it('long: the first impact lands by 15 s', () => {
    for (const [name, peak] of [['cola', 20], ['beer-3-over-2h', 129], ['espresso', 43]] as const) {
      const p = planVideo(withLines(name, FIX[name]), 'long', uFromMinutes, minutesFromU, { peakMin: peak });
      expect(p.peakT!, name).toBeLessThanOrEqual(PEAK_BY_S + 0.05);
      expect(p.seconds).toBeGreaterThanOrEqual(LENGTH.long.min);
    }
  });
  it('"Coming up: …" only names a turn worth waiting for', () => {
    for (const [name, chapters] of Object.entries(FIX)) {
      const t = plan(withLines(name, chapters), 'long').pages.find((x) => x.text.startsWith(TEASE_PREFIX));
      if (t) expect(t.text, name).toMatch(TEASE_OK);
      if (t) expect(t.text).not.toMatch(/building blocks/i);
    }
  });
  it('the music: a hush right before each impact, the full groove on it, quieter verses', () => {
    const cues = [{ t: 0, kind: 'sip' as const }, { t: 8.4, kind: 'riser' as const }, { t: 10, kind: 'peak' as const }, { t: 30, kind: 'outro' as const }];
    const pts = musicShape(cues, 36), at = (t: number) => { let v = 1; for (const [x, y] of pts) if (x <= t) v = y; return v; };
    expect(at(10 - HUSH_S / 2)).toBeLessThan(0.05);
    expect(at(10.2)).toBe(1);
    expect(at(5)).toBeLessThan(0.7);
  });
});

// ROUND 6 (second critique 2026-10-25, research/improvements/video-critique-2026-10-25.md)
describe('round 6: honest alcohol, one number per thing', () => {
  const alcCards = Object.entries(FIX).filter(([n]) => /beer/.test(n)).flatMap(([, cs]) => cs.flatMap((c) => beatLines(c, { name: 'beer', alcoholG: 60 })));
  const corpus = [...alcCards, ...Object.values(FIX).flatMap((cs) => cs.flatMap((c) => sentences(c.text).flatMap((x) => ruleCards(x))))];
  it('alcohol is never framed positively without its counterpart in the SAME card ("fall asleep faster, but sleep worse")', () => {
    for (const c of corpus) if (/fall asleep faster|relax|feel good/i.test(c)) expect(c, c).toMatch(/\bbut\b/);
    for (const v of ['clearly broken', 'lighter and more broken', 'a little lighter'])
      expect(beatLines({ min: 240, title: 'Bedtime', text: `You may fall asleep faster, but the second half of the night will be ${v}.` })[0]).toMatch(/^You may fall asleep faster, but sleep (worse|lighter)\.$/);
  });
  it('"gone" covers the gauge: the heaviest reading (+50 %) with the slowest liver (0.10 g/L an hour), from the peak', () => {
    const [lo, hi] = goneRange(0.8, 129);
    expect(hi).toBeGreaterThanOrEqual(0.8 * 1.5 / 0.1 + 129 / 60);
    expect(lo).toBeLessThan(8.5); expect(hi).toBeGreaterThan(8.5); // the typical body is inside it
    const card = beatLines({ min: 508, title: 'Alcohol gone', text: 'In a typical body like yours the alcohol is gone by now, about 8.5 h after the first sip. Livers differ (0.10–0.20 ‰ an hour), so for most people somewhere between 04:51 tomorrow and 09:18 tomorrow.' }, { bacPeak: { g: 0.8, min: 129 }, drinkAtMin: 1320 })[0];
    expect(card).toBe(`The alcohol is gone after about ${lo}–${hi} h.`);
  });
  it('a hangover warning only from 40 g of alcohol (one beer: "Don’t drive after drinking.")', () => {
    const ch = { min: 720, title: 'Next morning', text: '07:00, waking up. The alcohol should be gone, but a hangover can still make you drive worse, even at 0 ‰.' };
    expect(beatLines(ch, { alcoholG: 20 })).toContain('Don’t drive after drinking.');
    expect(beatLines(ch, { alcoholG: 60 })).toContain('A hangover can still make you drive worse.');
  });
  it('the cola single never says "No extra urine." alone', () => {
    for (const c of FIX.cola.flatMap((x) => beatLines(x))) expect(c).not.toBe('No extra urine.');
    expect(beatLines(FIX.cola.find((c) => c.title === 'Kidneys')!)).toEqual(['It hydrates like the same amount of water.']);
  });
  it('the blood sugar rise is the same range on the gauge and the end card, and a normal rise is said calmly', () => {
    const x = analyze(parseMeal('cola'), DEFAULT_PROFILE), g = x.built.effects.glucoseMgDl!;
    let pk = 0, at = 0; for (let m = 0; m < 600; m++) if (g[m] > g[at]) at = m; pk = g[at] / 18.016;
    const gauge = mainGauge(x.built, at, 0.2, 'mmol/L', true)!;
    expect(gauge.small).toContain(sugarPct(pk)); expect(plainSugar(pk)).toContain(sugarPct(pk));
    if (pk < 3) { expect(gauge.level).toBe(0); expect(gauge.small).toMatch(/normal rise/); }
  });
  it('the 24 h moment: plain words and the normal range (14–58 h), not "29 hours" alone', () => {
    const c = beatLines(FIX['pizza-whole'].find((x) => x.min === 1440)!);
    expect(c).toEqual(['Most of the fiber is still in you.', 'Mouth to toilet usually takes 14–58 hours.']);
  });
  it('"Building blocks" is never in the video', () => {
    for (const cut of ['long', 'short'] as const) expect(plan(FIX['pizza-whole'], cut).pages.map((x) => x.text).join(' ')).not.toMatch(/Protein pieces|building blocks/i);
  });
});

// ROUND 7 (third critique 2026-10-25-b)
describe('round 7: the morning follows the range, cards name what is left, no tease after its answer', () => {
  const morning = { min: 720, title: 'Next morning', text: '07:00, waking up. The alcohol should be gone, but a hangover can still make you drive worse, even at 0 ‰.' };
  it('the morning line follows the "gone" range across drink times and amounts', () => {
    for (const drinkAt of [17, 19, 21, 22].map((h) => h * 60)) for (const [g, pm] of [[0.2, 45], [0.5, 80], [0.8, 129], [1.2, 150]] as const) {
      const lines = beatLines(morning, { drinkAtMin: drinkAt, bacPeak: { g, min: pm }, alcoholG: 60 });
      const wakeH = ((7 * 60 - drinkAt + 1440) % 1440) / 60, [, hi] = goneRange(g, pm);
      const all = lines.join(' ');
      if (hi > wakeH) { expect(lines[0], `${drinkAt} ${g}`).toBe('At 07:00, a breath test may be positive.'); expect(all).not.toMatch(/should be gone/); }
      else expect(all).toMatch(/should be gone/);
      expect(all).toMatch(/drive/); // a driving warning in every case
    }
  });
  it('every "still in you" card names the substance', () => {
    for (const [name, cs] of Object.entries(FIX)) for (const c of cs) for (const card of beatLines(c, { name, caffeineMg: name === 'cola' ? 32 : 63, drinkAtMin: 1320 }))
      if (/still in you|remains/i.test(card)) expect(card, card).toMatch(/caffeine|alcohol|fiber|sugar/i);
  });
  it('comparison: "Answer at 24 h." never comes after the answer', () => {
    const ch = FIX.cola;
    const stops = [0, 20, 66, 90, 360, 720, 1440].map((m) => { const c = ch.filter((x) => x.min <= m).slice(-1)[0]; return { min: m, a: c.text, b: c.text, titleA: c.title, titleB: c.title }; });
    for (const hit of [20, 66, 360, 720]) {
      const p = planCompare(stops, 'long', uFromMinutes, minutesFromU, { peakMin: hit, verdict: true });
      const ans = p.cues.find((c) => c.kind === 'peak'), tease = p.cues.find((c) => c.kind === 'next' && c.data?.label === 'tease');
      if (ans && tease) expect(tease.t, `hit ${hit}`).toBeLessThan(ans.t);
    }
  });
});

// ROUND 8 (critique 2026-10-29 P1): no comparison card stays on one side for more than 6 s
describe('round 8: comparison cards never linger', () => {
  it('the same card stays on a side at most CMP_REPEAT_S (6 s), long and short', () => {
    const beer = FIX['beer-3-over-2h'], cola = FIX.cola;
    const at = (cs: StopIn[], m: number) => cs.filter((x) => x.min <= m).slice(-1)[0];
    const stops = [0, 20, 90, 180, 360, 720, 1440].map((m) => ({ min: m, a: at(cola, m).text, b: 'We can’t tell when you’re safe to drive.', titleA: at(cola, m).title, titleB: 'Alcohol gone',
      linesA: beatLines(at(cola, m)), linesB: ['We can’t tell when you’re safe to drive.'] }));
    void beer;
    for (const cut of ['long', 'short'] as const) {
      const p = planCompare(stops, cut, uFromMinutes, minutesFromU, {});
      // a card repeated over several pages (moments) adds up to at most CMP_REPEAT_S; one page alone may be longer
      for (const key of ['text', 'textB'] as const) {
        let run = 0, n = 0, prev = '';
        for (const pg of p.pages) {
          const c = pg[key] ?? '';
          if (c && c === prev) { run += pg.s; n++; } else { run = c ? pg.s : 0; n = c ? 1 : 0; }
          prev = c;
          if (n >= 2) expect(run, `${cut} ${key}: ${c}`).toBeLessThanOrEqual(CMP_REPEAT_S + 0.05);
        }
      }
    }
  });
});
