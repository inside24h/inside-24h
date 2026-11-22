// Phase 4l (critique 2026-11-22, research/improvements/video-critique-2026-11-22.md: the v34 samples, aperol spritz
// Reels, spaghetti carbonara long, vodka and energy drink Shorts). Every 4k check passed on them; the critic still saw:
//   N1 "BEDTIME / There is still alcohol in your blood." at +0:11 (the render's first sip was just before bed), with no
//      time of day anywhere on screen: the clock, the one clock the viewer sees, could not read as bedtime;
//   N2 carbonara's 14 s of cards no other carbonara fact was in ("Your blood sugar climbs to its peak.", "Many people
//      feel sleepy after a big meal.", "The slump comes about 1.5 hours later."), while the clock ran 17 minutes, and
//      "sleepy" under an end card that said "Brain & sleep · Fine all day";
//   and, minor, +24:00 held 6.4 s before the end card ("24 HOURS LATER" and the day-done beat), "its 124 ml of water",
//   a lull counting the drink's water ("TAKEN UP SO FAR / 2 of 150 ml").
// The phase 4l checks (video-telemetry checkTimeline4l, run by checkTimeline on every filmed and rendered video, and
// the 4k clock hold, now at +24:00 too outside the labelled day-done beat) measure them on what is drawn; the sweeps
// below run them on every item × cut, with a first sip just before bed as well.
import { describe, expect, it } from 'vitest';
import { AUDIT_CUTS, AUDIT_PROFILE, auditItems, auditSingle, type AuditItem } from './text-audit';
import { filmSingleTimeline } from './telemetry.testutil';
import { checkTimeline, checkTimeline4k, checkTimeline4l, clockMinutes, endCardNote, GENERIC_RUN_MAX_S, PAUSE_CLOCK, CLOCK_HOLD_MAX_S, type TeleFrame, type Timeline } from './video-telemetry';
import { BED_TITLE, genericCard, MORNING_TITLE, TOD_MIN, timeOfDayOk } from './video-beats';
import { sweep } from './sweep.testutil';
import type { Profile } from '../science/profile';

/** A hand-made timeline: 30 fps, `seg(t)` gives each frame's clock, card and extras; `end` the end card's word blocks. */
function handMade(seconds: number, hook: string, seg: (t: number) => Partial<TeleFrame>, end: string[] = []): Timeline {
  const fs: TeleFrame[] = [];
  for (let i = 0; i < Math.round(seconds * 30); i++) { const t = i / 30; fs.push({ t, phase: 'main', beat: 'hold', rs: [], end: 0, ...seg(t) }); }
  for (let i = 0; i < 90; i++) fs.push({ t: seconds + i / 30, phase: 'outro', beat: 'end', rs: [], end: 1, ...(i % 3 === 0 ? { texts: end.map((text, k) => ({ x0: 0, y0: k * 40, x1: 10, y1: k * 40 + 30, text })) } : {}) });
  return { v: 1, kind: 'single', cut: 'medium', seconds: seconds + 3, fps: 30, hook, name: 'X', frames: fs };
}
const mmss = (m: number) => `+${Math.floor(m / 60)}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
const byId = (id: string, p: Profile = AUDIT_PROFILE): AuditItem => { const x = auditItems(p).find((i) => i.id === id); expect(x, id).toBeDefined(); return x!; };
const cards = (tl: Timeline) => [...new Set(tl.frames.filter((f) => f.phase === 'main' && f.card).map((f) => f.card!))];
/** The render's first sip at 22:45 (AppV4: the time of day, to 5 minutes), bedtime at 23:00, as in the v34 samples. */
const LATE: Profile = { ...AUDIT_PROFILE, drinkAtMin: 22 * 60 + 45 };
/** A first sip after the usual bedtime: the model's "Going to bed" moment 30 minutes after it. */
const AFTER_BED: Profile = { ...AUDIT_PROFILE, drinkAtMin: 23 * 60 + 30 };

describe('phase 4l: the checks catch what the critic saw in the v34 videos (timelines made by hand)', () => {
  it('N1: "BEDTIME" at +0:11, and a NEXT chip naming it', () => {
    const tl = handMade(20, 'When are 14 g out of you?\nAperol spritz: 14 g of alcohol.', (t) => ({
      clock: mmss(t < 7 ? 1 + t * 1.4 : 10 + (t - 7) * 1.2), bac: 'BAC 0.01 % US limit 0.08 % EU limit 0.05 % Never safe to drive after drinking.',
      card: t < 5.8 ? 'FIRST SIP | About 1 US standard drink.' : t < 7 ? undefined : 'BEDTIME | There is still alcohol in your blood.',
      ...(t >= 5.8 && t < 7 ? { next: true, texts: [{ x0: 0, y0: 0, x1: 10, y1: 10, text: 'NEXT · +0:11 · Bedtime' }] } : {}),
    }));
    const k = checkTimeline4l(tl).filter((i) => i.check === 'time of day').map((i) => i.text).join('\n');
    expect(k).toMatch(/"BEDTIME \| There is still alcohol in your blood\." at \+0:1\d .* before \+1:00/);
    expect(k).toMatch(/"NEXT · \+0:11 · Bedtime" \(5\.8 s\) names bedtime at \+0:11/);
    const chip = handMade(8, 'Q?\nX.', (t) => ({ clock: mmss(2 + t), next: true, texts: [{ x0: 0, y0: 0, x1: 10, y1: 10, text: 'NEXT · +3:00 · next morning' }] }));
    expect(checkTimeline4l(chip).map((i) => i.text).join(' ')).toMatch(/names next morning at \+3:00/);
  });
  it('N2: 14 s of generic cards; "sleepy" under "Brain & sleep · Fine all day"; +24:00 held 6.4 s before the end card', () => {
    const tl = handMade(40, 'How far have 584 kcal gotten by tomorrow?\n1 plate of spaghetti carbonara: 584 kcal.', (t) => ({
      clock: t < 14.7 ? mmss(t * 6) : t < 29 ? mmss(89 + (t - 14.7) * 1.2) : t < 31.4 ? mmss(120 + (t - 29) * 60) : PAUSE_CLOCK,
      beat: t >= 35.8 ? 'end' : 'hold',
      card: t < 14.7 ? 'FIRST BITE | 584 kcal, 61 g carbs.' : t < 19.3 ? 'BLOOD SUGAR PEAK | Your blood sugar climbs to its peak.' : t < 20.2 ? undefined : t < 25 ? 'SLEEPY AFTER EATING | Many people feel sleepy after a big meal.'
        : t < 29 ? 'SLEEPY AFTER EATING | The slump comes about 1.5 hours later.' : t < 31.4 ? 'KIDNEYS | Your kidneys filter its 155 ml of water.' : t < 35.8 ? '24 HOURS LATER | Most of the fiber is still in you.' : undefined,
    }), ['Blood sugar & energy', 'Sugar peak 1 h 30 min in', 'Brain & sleep', 'Fine all day']);
    const l = checkTimeline4l(tl).map((i) => `${i.check}: ${i.text}`).join('\n');
    expect(l).toMatch(/generic cards: 1\d\.\d s of cards with no number of their own from 14\.7 s/);
    expect(l).toMatch(/card contradiction: "Many people feel sleepy after a big meal\." in the story, "Brain & sleep · Fine all day"/);
    // (the 4k hold before phase 4l let +24:00 stand: now only the labelled day-done beat may hold it)
    expect(checkTimeline4k(tl).map((i) => i.text).join(' ')).toMatch(/\+24:00 held [4-9]\.\d s/);
    expect(endCardNote(tl, /^Brain & sleep$/)).toBe('Fine all day');
  });
  it('what is not filler: a number, the driving warning, an open loop, a lull\'s gauge break a run', () => {
    expect(genericCard('Your blood sugar climbs to its peak.')).toBe(true);
    expect(genericCard('61 g of carbs: blood sugar peaks.')).toBe(false);
    expect(genericCard('Don’t drive.')).toBe(false);
    expect(genericCard('A breath test can be positive.')).toBe(false);
    expect(genericCard('Coming up: the sugar dip.')).toBe(false);
    expect(timeOfDayOk({ min: 11, title: 'Bedtime' })).toBe(false);
    expect(timeOfDayOk({ min: 30, title: 'Going to bed' })).toBe(false);
    expect(timeOfDayOk({ min: 60, title: 'Bedtime' })).toBe(true);
    expect(timeOfDayOk({ min: 240, title: 'Next morning' })).toBe(false);
    expect(timeOfDayOk({ min: 11, title: 'Alcohol peak' })).toBe(true);
  });
});

describe('phase 4l: the critic\'s v34 videos, filmed as the app films them', () => {
  it('aperol spritz Reels with the first sip at 22:45: no bedtime at +0:15, no water count in the lulls, every check passes', () => {
    for (const cut of AUDIT_CUTS) {
      const it0 = byId('mojito.aperol-spritz', LATE), tl = filmSingleTimeline(it0, cut, LATE);
      expect(checkTimeline(tl).filter((i) => i.check !== 'region cap').map((i) => `${cut}: ${i.check}: ${i.text}`)).toEqual([]);
      expect(cards(tl).filter((c) => /^(?:BEDTIME|GOING TO BED)\b/.test(c))).toEqual([]);
      expect(cards(tl).filter((c) => /^TAKEN UP SO FAR/.test(c))).toEqual([]); // (the lull says the blood alcohol's way)
      expect(cards(tl).some((c) => /^BLOOD ALCOHOL \| (?:Still rising|At its highest|Coming down slowly|Back to zero)$/.test(c)) || !tl.frames.some((f) => f.beat === 'glide' && f.card)).toBe(true);
      expect(cards(tl).join(' ')).not.toMatch(/\bits \d+ ml\b|don’t speed it up/);
    }
    // (with its first sip at 22:00 the bedtime moment is an hour on, at +1:00: it may be in the video)
    expect(byId('mojito.aperol-spritz').x.built.story.chapters.find((c) => c.title === 'Bedtime')?.min).toBe(60);
  }, 600_000);
  it('carbonara long: one numbered card and the slump at +1:30, no "later" said at its own minute, the end card says the slump', () => {
    const tl = filmSingleTimeline(byId('spaghetti-bolognese.carbonara'), 'long');
    expect(checkTimeline(tl).filter((i) => i.check !== 'region cap').map((i) => `${i.check}: ${i.text}`)).toEqual([]);
    const cs = cards(tl), all = cs.join('\n');
    expect(all).toMatch(/BLOOD SUGAR PEAK \| 61 g of carbs: blood sugar peaks\./);
    expect(all).not.toMatch(/The slump comes about/);
    expect(all).toMatch(/KIDNEYS \| Kidneys filter the food’s 155 ml of water\./);
    expect(all).not.toMatch(/FAT IN YOUR BLOOD \| The fat joins your blood later\./);
    // (from the peak to the next moment with a number of its own, the clock moves on; the story's middle has its moments)
    const peak = tl.frames.findIndex((f) => /^BLOOD SUGAR PEAK/.test(f.card ?? '')), kid = tl.frames.findIndex((f) => /^KIDNEYS/.test(f.card ?? ''));
    expect(tl.frames[kid].t - tl.frames[peak].t).toBeLessThan(13);
    expect(clockMinutes(tl.frames[kid].clock) - clockMinutes(tl.frames[peak].clock)).toBeGreaterThanOrEqual(30);
    const brain = endCardNote(tl, /^Brain & sleep$/);
    if (brain) expect(brain).toMatch(/^Maybe sleepy 1 h 30 min in$/);
    // (+24:00 held at most CLOCK_HOLD_MAX_S outside the day-done beat: the last card runs the clock into it)
    const day = tl.frames.filter((f) => f.phase === 'main' && f.beat !== 'end' && f.clock === PAUSE_CLOCK);
    expect(day.length / 30).toBeLessThanOrEqual(CLOCK_HOLD_MAX_S + 0.05);
  }, 600_000);
  it('vodka and energy drink Shorts, every first sip: its caffeine dose on a card and "N mg caffeine: still in you" from the model', () => {
    for (const p of [AUDIT_PROFILE, LATE, AFTER_BED]) {
      const it0 = byId('mojito.vodka-energy', p), tl = filmSingleTimeline(it0, 'short', p), b = it0.x.built;
      expect(checkTimeline(tl).filter((i) => i.check !== 'region cap').map((i) => `${p.drinkAtMin}: ${i.check}: ${i.text}`)).toEqual([]);
      const main = cards(tl).join(' '), end = tl.frames.filter((f) => f.phase === 'outro').flatMap((f) => (f.texts ?? []).map((x) => x.text)).join(' ').replace(/\s+/g, ' ');
      expect(main).toMatch(new RegExp(`\\b${Math.round(b.caffeine.doseMg)} mg of caffeine\\.`));
      const gone = b.story.chapters.find((c) => c.title === 'Alcohol gone')!.min, left = Math.round(b.caffeine.body[Math.round(gone)]);
      expect(`${main} ${end}`).toMatch(new RegExp(`\\b${left} mg caffeine: still in you`));
    }
  }, 600_000);
});

describe('phase 4l: every item × cut with its first sip just before bed (22:45) and after it (23:30)', () => {
  // (alcohol or caffeine: the foods with a bedtime moment; the shown minutes and the claim against the model)
  it('a bedtime or next-morning moment only where the clock reads as that time, and what it says holds there', () => {
    const bad: string[] = [];
    let n = 0, beds = 0;
    for (const p of [LATE, AFTER_BED]) {
      const its = sweep(auditItems(p).filter((i) => (i.x.built.alcoholG ?? 0) > 1 || i.x.built.caffeine.doseMg >= 10));
      for (const it0 of its) for (const cut of AUDIT_CUTS) {
        n++;
        const tl = filmSingleTimeline(it0, cut, p), b = it0.x.built;
        bad.push(...checkTimeline4l(tl).filter((i) => i.check === 'time of day').map((i) => `${it0.id} ${cut} ${p.drinkAtMin}: ${i.text}`));
        const o = auditSingle(it0.x, cut, 'A', p, it0.vname);
        for (const f of o.plan.frames) {
          if (f.phase !== 'main' || f.beat !== 'hold' || !f.title) continue;
          const need = BED_TITLE.test(f.title) ? TOD_MIN.bed : MORNING_TITLE.test(f.title) ? TOD_MIN.morning : null;
          if (need === null) continue;
          if (BED_TITLE.test(f.title)) beds++;
          if (f.m < need - 1e-6) { bad.push(`${it0.id} ${cut} ${p.drinkAtMin}: "${f.title}" at ${mmss(f.m)}`); break; }
          // (what it says holds at the minute shown: alcohol still in the blood, some caffeine still in you)
          const m = Math.round(Math.min(1440, f.m)), cap = f.cap ?? '';
          if (/alcohol in your blood|alcohol is still in your blood/i.test(cap) && !((b.bac?.[m] ?? 0) > 0.005)) { bad.push(`${it0.id} ${cut} ${p.drinkAtMin}: "${cap}" at ${mmss(f.m)}, the model has no alcohol`); break; }
          if (/caffeine (?:is still in you|remains)/i.test(cap) && !(b.caffeine.body[m] >= 1)) { bad.push(`${it0.id} ${cut} ${p.drinkAtMin}: "${cap}" at ${mmss(f.m)}, the model has no caffeine`); break; }
        }
      }
    }
    expect(n).toBeGreaterThan(5);
    expect(bad.slice(0, 20)).toEqual([]);
    void beds;
  }, 1_800_000);
});

describe('phase 4l: the generic-card run on screen is bounded for every item × cut (checkTimeline, the 4h sweep)', () => {
  it('two generic cards fit under the bound, even stretched; the three of the v34 carbonara (4.6 + 4.8 + 3.9 s) do not', () => {
    expect(GENERIC_RUN_MAX_S).toBeGreaterThanOrEqual(2 * 6.5);
    expect(GENERIC_RUN_MAX_S).toBeLessThan(4.6 + 4.8 + 3.9);
  });
});
