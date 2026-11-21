// Phase 4k (critique 2026-11-21, research/improvements/video-critique-2026-11-21.md: the v33 samples, aperol spritz
// Reels, spaghetti carbonara long, vodka and energy drink Shorts). M1 (the clock nearly frozen) and M2 ("FIRST SIP"
// repeating the title) had been declared fixed in phase 4j and came back: the 4j checks were too weak, not the videos
// new. "clock open" judged only the first CLOCK_MOVES_BY_S of the story and the stands before the first glide (aperol
// then stood at +0:10 for 6.4 s, carbonara at +1:29 for 9.6 s, both after it), and "card repeats title" asked for the
// very same words ("1 drink of aperol spritz." is not word for word "Aperol spritz: 14 g of alcohol."). The phase 4k
// checks (video-telemetry checkTimeline4k, run by checkTimeline on every filmed and every rendered video) measure:
//   M1 the clock's pace in every rolling PACE_WINDOW_S window after PACE_FROM_S (PACE_MIN by class: alcohol or caffeine
//      "fast", else "meal"), and no clock value held over CLOCK_HOLD_MAX_S (the +24:00 pause aside);
//   M2 no card that nearly repeats a title (≥ 80 % of its words) or another card; no kcal card with alcohol unless the
//      hook asks about kcal; a NEXT chip names a time ahead; a kidney card says its own number; "NEXT MORNING" without
//      a fact of its own at most MORNING_MAX_S;
//   M3 alcohol with caffeine says the caffeine dose and, at the end, the caffeine still in you when the alcohol is gone;
//   M4 the food database's proper nouns and brands keep their capital inside a sentence (video-names lowerName).
import { describe, expect, it } from 'vitest';
import { AUDIT_CUTS, AUDIT_PROFILE, auditItems, auditSingle, type AuditItem } from './text-audit';
import { analyze } from './analyze';
import { parseMeal, FOODS } from './food/parse';
import { nameInSentence } from './food/naming';
import db from './food/fooddb.json';
import { filmSingleTimeline } from './telemetry.testutil';
import { checkTimeline, checkTimeline4j, checkTimeline4k, clockMinutes, PACE_FROM_S, PACE_MIN, PACE_WINDOW_S, paceClassOf, type TeleFrame, type Timeline } from './video-telemetry';
import { lowerName, PROPER_NAMES, startsProper } from './video-names';

const item = (q: string): AuditItem => { const parts = parseMeal(q); expect(parts.length, q).toBeGreaterThan(0); const x = analyze(parts, AUDIT_PROFILE); return { id: q, x, parts, vname: x.label }; };
const words = (tl: Timeline, phase?: string) => tl.frames.filter((f) => !phase || f.phase === phase).flatMap((f) => [f.card ?? '', ...(f.texts ?? []).map((b) => b.text)]).join(' ').replace(/\s+/g, ' ');

/** A hand-made timeline: 30 fps, `seg(t)` gives each frame's clock, card and extras. */
function handMade(seconds: number, hook: string, seg: (t: number) => Partial<TeleFrame>): Timeline {
  const fs: TeleFrame[] = [];
  for (let i = 0; i < Math.round(seconds * 30); i++) { const t = i / 30; fs.push({ t, phase: 'main', beat: 'hold', rs: [], end: 0, ...seg(t) }); }
  for (let i = 0; i < 90; i++) fs.push({ t: seconds + i / 30, phase: 'outro', beat: 'end', rs: [], end: 1 });
  return { v: 1, kind: 'single', cut: 'medium', seconds: seconds + 3, fps: 30, hook, name: 'Aperol spritz', frames: fs };
}
const mmss = (m: number) => `+${Math.floor(m / 60)}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

describe('phase 4k: why the 4j checks let M1 and M2 through, and the 4k checks do not', () => {
  it('the v33 aperol opening (moves in its first 3 s, then +0:10 for 6.4 s; "1 drink of aperol spritz."): 4j passes it, 4k fails it', () => {
    const tl = handMade(24, 'When are 14 g out of you?\nAperol spritz: 14 g of alcohol.', (t) => ({
      clock: mmss(t < 5 ? t * 1.6 : t < 9.1 ? 8 + (t - 5) * 0.5 : t < 15.5 ? 10 : 10 + (t - 15.5) * 3),
      beat: t >= 5 && t < 6 ? 'glide' : 'hold', bac: 'BAC 0.01 %',
      card: t < 5 ? 'FIRST SIP | 1 drink of aperol spritz.' : t < 9.1 ? 'IN YOUR STOMACH | 17 g of sugar: about 4 teaspoons.' : 'IN YOUR STOMACH | Half leaves your stomach within 75 minutes.',
    }));
    const j = checkTimeline4j(tl).map((i) => i.check), k = checkTimeline4k(tl);
    expect(j).not.toContain('clock open');
    expect(j).not.toContain('card repeats title');
    expect(k.map((i) => i.check)).toEqual(expect.arrayContaining(['clock pace', 'card repeats title']));
    expect(k.filter((i) => i.check === 'clock pace').map((i) => i.text).join(' ')).toMatch(/\+0:10 held 6\.\d s/);
  });
  it('the v33 carbonara stand (+1:29 for 9.6 s, a meal), the fillers and the missing caffeine story are each caught', () => {
    const meal = handMade(30, 'How far have 584 kcal gotten by tomorrow?\n1 plate of spaghetti carbonara: 584 kcal.', (t) => ({
      clock: mmss(t < 14.6 ? t * 6 : t < 24.2 ? 89 : 89 + (t - 24.2) * 2), beat: t >= 6 && t < 7 ? 'glide' : 'hold',
      card: t < 6 ? 'FIRST BITE | 584 kcal in total.' : t < 20 ? 'BLOOD SUGAR PEAK | Your blood sugar climbs to its peak.' : 'KIDNEYS | Your kidneys filter the extra water.',
    }));
    expect(paceClassOf(meal)).toBe('meal');
    expect(checkTimeline4j(meal).map((i) => i.check)).not.toContain('clock open');
    const mk = checkTimeline4k(meal);
    expect(mk.map((i) => i.check)).toEqual(expect.arrayContaining(['clock pace', 'card repeats title', 'filler card']));
    expect(mk.map((i) => i.text).join(' ')).toMatch(/\+1:29 held (?:9|10)\.\d s/);
    expect(mk.map((i) => i.text).join(' ')).toMatch(/kidneys filter the extra water/);
    // alcohol (with caffeine): a kcal lull card, a NEXT chip naming the present, a long empty morning, no caffeine dose
    const alc = handMade(30, 'How long do 19 g stay in you?\nVodka and energy drink: 19 g of alcohol.', (t) => ({
      clock: mmss(t < 20 ? t * 4 : 1080 + (t - 20) * 10), bac: 'BAC 0.02 %',
      card: t < 6 ? 'TAKEN UP SO FAR | 128 of 203 kcal' : t < 12 ? 'ALCOHOL PEAK | Caffeine masks drowsiness, not impairment.' : t < 20 ? 'ALCOHOL GONE | The alcohol is gone after about 1–5 h.' : 'NEXT MORNING | The alcohol should be gone.',
      ...(t >= 3 && t < 4 && Math.round(t * 30) % 3 === 0 ? { texts: [{ x0: 0, y0: 0, x1: 10, y1: 10, text: `NEXT · ${mmss(Math.floor(t * 4))} · In your stomach` }] } : {}),
    }));
    const ak = checkTimeline4k(alc), at = ak.map((i) => `${i.check}: ${i.text}`).join('\n');
    expect(paceClassOf(alc)).toBe('fast');
    expect(at).toMatch(/filler card: "TAKEN UP SO FAR \| 128 of 203 kcal"/);
    expect(at).toMatch(/filler card: "NEXT · \+0:\d\d · In your stomach" .* names no time ahead/);
    expect(at).toMatch(/filler card: "NEXT MORNING" [\d.]+ s with no fact of its own/);
    expect(at).toMatch(/caffeine and alcohol: no card says the caffeine dose/);
    expect(at).toMatch(/caffeine and alcohol: nothing says the caffeine still in you/);
  });
});

describe('phase 4k: the critic\'s v33 videos, filmed as the app films them', () => {
  const VIDEOS = [['aperol spritz', 'medium'], ['spaghetti carbonara', 'long'], ['vodka red bull', 'short']] as const;
  it('aperol spritz Reels, carbonara long, vodka and energy drink Shorts: every check passes; the clock runs in every window', () => {
    for (const [q, cut] of VIDEOS) {
      const tl = filmSingleTimeline(item(q), cut);
      expect(checkTimeline(tl).filter((i) => i.check !== 'region cap').map((i) => `${q} ${cut}: ${i.check}: ${i.text}`)).toEqual([]);
      // (the clock values themselves: from PACE_FROM_S on, every PACE_WINDOW_S window runs PACE_MIN of its class)
      const st = tl.frames.filter((f) => f.phase === 'main' && f.clock && f.t >= PACE_FROM_S && f.clock !== '+24:00' && f.beat !== 'end'), need = PACE_MIN[paceClassOf(tl)];
      for (const f of st) {
        const g = [...st].reverse().find((x) => x.t <= f.t + PACE_WINDOW_S + 1e-6)!;
        if (g.t < f.t + PACE_WINDOW_S - 0.1) break; // (the last window reaches the end)
        expect(clockMinutes(g.clock) - clockMinutes(f.clock), `${q} ${cut} ${f.clock} at ${f.t.toFixed(1)} s`).toBeGreaterThanOrEqual(need);
      }
    }
  }, 600_000);
  it('M3: vodka and an energy drink says its caffeine dose and the caffeine left when the alcohol is gone; M4: "Aperol" keeps its capital', () => {
    const v = filmSingleTimeline(item('vodka red bull'), 'short'), main = words(v, 'main');
    expect(main).toMatch(/\b\d+ mg of caffeine\b/);
    expect(`${main} ${words(v, 'outro')}`).toMatch(/\b\d+ mg caffeine: still in you/);
    expect(main).toMatch(/Caffeine masks drowsiness, not impairment\./);
    for (const cut of AUDIT_CUTS) {
      const a = filmSingleTimeline(item('aperol spritz'), cut);
      expect(words(a), cut).not.toMatch(/\baperol\b/);
      expect(words(a, 'main'), cut).not.toMatch(/\bkcal\b/); // (the hook asks about alcohol)
    }
  }, 600_000);
});

describe('phase 4k: every drink with alcohol and caffeine, every cut (M3)', () => {
  it('says the caffeine dose (mg) and, at the end, the caffeine still in you when the alcohol is gone, from the model', () => {
    const its = auditItems().filter((i) => (i.x.built.alcoholG ?? 0) > 1 && i.x.built.caffeine.doseMg >= 10);
    expect(its.length).toBeGreaterThanOrEqual(2);
    const bad: string[] = [];
    for (const it0 of its) for (const cut of AUDIT_CUTS) {
      const tl = filmSingleTimeline(it0, cut);
      bad.push(...checkTimeline4k(tl).filter((i) => i.check === 'caffeine and alcohol').map((i) => `${it0.id} ${cut}: ${i.text}`));
      // (the mg the card says is the model's: the dose said is the drink's own, rounded)
      const dose = /\b(\d+) mg of caffeine\b/.exec(words(tl, 'main'))?.[1];
      if (dose && Math.abs(Number(dose) - it0.x.built.caffeine.doseMg) > 0.5 + 1e-9) bad.push(`${it0.id} ${cut}: says ${dose} mg, the model ${it0.x.built.caffeine.doseMg.toFixed(1)} mg`);
    }
    expect(bad.slice(0, 20)).toEqual([]);
  }, 600_000);
});

describe('phase 4k: proper nouns and brands keep their capital (M4)', () => {
  type DbFood = { name: string; aliases?: string[]; src?: unknown; variants?: { name: string }[] };
  const DB = db as unknown as DbFood[];
  it('every name on the list is in the food database (its names, aliases or sources)', () => {
    const text = JSON.stringify(DB).toLowerCase();
    expect(PROPER_NAMES.filter((n) => !text.includes(n.toLowerCase()))).toEqual([]);
  });
  it('lowerName and nameInSentence over every name in the database: a name that starts with a proper noun or brand keeps it, others are lowered', () => {
    const names = [...new Set([...DB.flatMap((f) => [f.name, ...(f.variants ?? []).map((v) => v.name)]), ...FOODS.map((f) => f.name)])];
    const bad: string[] = [];
    for (const n of names) {
      const l = lowerName(n), s = nameInSentence(n);
      if (startsProper(n) && l !== n) bad.push(`lowerName "${n}" → "${l}"`);
      if (startsProper(n) && s.split(' ')[0] !== n.split(' ')[0]) bad.push(`nameInSentence "${n}" → "${s}"`);
      if (!startsProper(n) && /^[A-Z][a-z]+(?:\s|$)/.test(n) && !/^[A-Z][a-z]+[A-Z]/.test(n) && l.charAt(0) !== n.charAt(0).toLowerCase()) bad.push(`lowerName "${n}" → "${l}" (not lowered)`);
    }
    expect(bad).toEqual([]);
    expect(lowerName('Aperol spritz')).toBe('Aperol spritz');
    expect(lowerName('Coca-Cola')).toBe('Coca-Cola');
    expect(lowerName('Red Bull')).toBe('Red Bull');
    expect(lowerName('Orange juice')).toBe('orange juice');
    expect(lowerName('French fries')).toBe('french fries');
    expect(lowerName('French toast')).toBe('French toast');
  });
  it('no card, hook or end card of a brand-named item writes the brand in lower case (every item named so, every cut)', () => {
    const re = new RegExp(`\\b(?:${PROPER_NAMES.map((n) => n.toLowerCase().replace(/[-\s]/g, '[-\\s]')).join('|')})\\b`);
    const its = auditItems().filter((i) => startsProper(i.vname) || startsProper(i.x.label));
    expect(its.length).toBeGreaterThanOrEqual(5);
    const bad: string[] = [];
    for (const it0 of its) for (const cut of AUDIT_CUTS) {
      const o = auditSingle(it0.x, cut, 'A', AUDIT_PROFILE, it0.vname);
      const all = [o.hook.line1, o.hook.line2, ...o.plan.pages.map((p) => p.text)];
      for (const s of all) { const m = re.exec(s); if (m && !/^french fries/.test(s.slice(m.index).toLowerCase())) bad.push(`${it0.id} ${cut}: "${s}"`); }
    }
    expect(bad.slice(0, 20)).toEqual([]);
  }, 600_000);
});
