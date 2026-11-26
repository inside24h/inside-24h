// Phase P1: the shared compliance lexicon (story/compliance.ts) over everything the app and the video say about a food:
// the Food Story, the quick answers and the posted captions, every item × variant (fast tier: every 24th), plus a
// source scan that keeps the walking-minutes model (science/walking.ts, kept on disk) out of every screen and video.
import { describe, expect, it } from 'vitest';
import { AUDIT_PROFILE, auditItems, auditSingle } from '../text-audit';
import { sweep } from '../sweep.testutil';
import { quickAnswers } from '../Answers';
import { derivedFacts, factInOf, FACT_SHORT, FACT_WORDINGS, WALK_FACT } from '../video-facts';
import { BANNED as CAPTION_BANNED } from '../video-caption';
import { BANNED, complianceHits, LEXICON, passesCompliance } from './compliance';
import { storyOf, stripOf, stripText } from './foodStory';
import { BodyScoreMethod } from './BodyScoreMethod';
import { RUBRIC } from './axes';
import { UNKNOWNS } from './unknowns';
import type { FoodStory } from './types';

const ITEMS = sweep(auditItems());

/** Every string a person can read in a story. */
export function storyStrings(s: FoodStory): string[] {
  return [
    s.name, s.body.label, stripText(stripOf(s)),
    ...Object.values(s.numbers).flatMap((n) => [n.text, n.anchor ?? '']),
    ...Object.values(s.axes).flatMap((a) => [a.word, a.why]),
    ...s.actions.map((a) => a.text), ...s.unknowns.map((u) => u.text),
    ...s.surprises.flatMap((u) => [u.claim, u.question, ...u.options]),
    ...s.ladders.flatMap((l) => [l.cause, l.soWhat]),
    ...Object.values(s.curves).flatMap((c) => c!.thresholds.map((t) => t.label)),
  ].filter(Boolean);
}

describe('phase P1: the compliance lexicon itself', () => {
  const FAIL = ['Walking it off takes about 40 minutes.', 'Walk 25 minutes to burn it.', 'Burning it off takes about 48 minutes of brisk walking.', 'To burn it: roughly 30 minutes of brisk walking.',
    '139 kcal ≈ 48 min of brisk walking for you.', 'You are safe to drive by 7:00.', 'OK to drive after 2 hours.', 'A coffee will sober you up.', 'It helps you sober up faster.',
    'Green tea cures hangovers.', 'This drink can prevent diabetes.', 'A detox juice.', 'It may reverse insulin resistance.', 'We diagnose prediabetes.', 'Use it to manage your diabetes.',
    'Pizza is a bad food.', 'Guilt-free dessert.', 'Saturday is cheat day.', 'You have to earn it first.', 'Burned in a 30-minute walk.', 'It treats your blood pressure.'];
  const PASS = ['Coffee won’t sober you up. Only time does.', "Coffee won't sober you up.", 'Nothing sobers you up but time.', 'No, this app can’t tell you when you’re safe.', 'We never show a time when you are safe to drive.',
    '139 kcal · 7% of a 2,000 kcal day.', 'Your liver works on it for about 3 hours.', 'Your cells can burn this sugar right away.', 'A treat now and then.', 'Cheat sheet', 'An easy 10-minute walk after eating makes the blood sugar peak smaller.',
    'Insulin brings it back to your usual level.', 'Zero kcal: no fuel for your body at all.'];
  for (const s of FAIL) it(`flags: ${s}`, () => expect(complianceHits(s).length).toBeGreaterThan(0));
  for (const s of PASS) it(`passes: ${s}`, () => expect(complianceHits(s).map((e) => e.id)).toEqual([]));
  it('the caption list is the shared one (moved, re-exported) and every entry has a reason', () => {
    expect(CAPTION_BANNED).toBe(BANNED);
    for (const e of LEXICON) expect(e.why.length).toBeGreaterThan(3);
  });
});

describe('phase P1: 0 compliance hits in what the app and the video say (every item × variant)', () => {
  it('the Food Story, the quick answers and the captions', () => {
    const bad: string[] = [];
    for (const it0 of ITEMS) {
      const s = storyOf(it0.x, it0.parts, AUDIT_PROFILE);
      for (const t of storyStrings(s)) if (!passesCompliance(t)) bad.push(`${it0.id} story: ${t}`);
      for (const a of it0.x.answers) for (const t of [a.q, a.a, a.note ?? '', a.title ?? '']) if (t && !passesCompliance(t)) bad.push(`${it0.id} answer: ${t}`);
      const caps = auditSingle(it0.x, 'short', 'A').caps;
      for (const t of [caps.tiktok, caps.reels, caps.facebook, caps.shorts.title, caps.shorts.description]) if (!passesCompliance(t) || BANNED.test(t)) bad.push(`${it0.id} caption: ${t.slice(0, 80)}`);
    }
    expect(bad).toEqual([]);
  });
  it('the energy answer is kcal and % of a 2,000 kcal day for every item, never walking', () => {
    for (const it0 of ITEMS) {
      const a = it0.x.answers.find((q) => q.q === 'How much energy is that?')!;
      expect(a.a, it0.id).toMatch(/^(\d[\d,]* kcal · (under 1|\d+)% of a 2,000 kcal day\.|Almost none: \d+ kcal\.)$/);
    }
    const one = quickAnswers({ systems: [], drinkAt: 960, bedtimeMin: 1380, weightKg: 70, kcal: 472, extraSleepMin: 0, caffeineAtBedMg: 0, waterMl: 0 }).find((q) => q.q === 'How much energy is that?')!;
    expect(one.a).toBe('472 kcal · 24% of a 2,000 kcal day.');
  });
  it('the rubric, the method page and the unknowns pass too', () => {
    const texts = [...Object.values(RUBRIC).flatMap((r) => [r.label, r.measures, r.note, r.none, ...r.tiers.flatMap((t) => [t.word, t.rule])]), ...Object.values(UNKNOWNS).map((u) => u.text)];
    for (const t of texts) expect(complianceHits(t).map((e) => e.id), t).toEqual([]);
    expect(typeof BodyScoreMethod).toBe('function');
  });
  it('alcohol always carries safety.alcohol, and its cheat sheet never talks about driving', () => {
    for (const it0 of ITEMS) {
      const s = storyOf(it0.x, it0.parts, AUDIT_PROFILE), alc = (it0.x.built.alcoholG ?? 0) > 1;
      expect(s.safety.alcohol, it0.id).toBe(alc);
      if (alc) for (const a of [s.cheat.bestTime, s.cheat.pairWith, s.cheat.swapFor, ...s.actions]) expect(a?.text ?? '', it0.id).not.toMatch(/\b(driv|wheel|car\b|sober)/i);
    }
  });
});

describe('phase P1: walking minutes stay retired', () => {
  it('no video fact says walking minutes (the code path is kept behind a guard)', () => {
    expect(WALK_FACT).toBe(false);
    expect(FACT_WORDINGS.walk.length + FACT_SHORT.walk.length).toBe(0);
    for (const it0 of ITEMS) expect(derivedFacts(factInOf(it0.x)).some((f) => f.kind === 'walk'), it0.id).toBe(false);
    for (const ws of [...Object.values(FACT_WORDINGS), ...Object.values(FACT_SHORT)]) for (const w of ws) expect(complianceHits(w).map((e) => e.id), w).toEqual([]);
  });
  it('no UI, video or page module imports walkingMinutes / walkingKm (science/walking.ts stays on disk, unused by them)', () => {
    const files = import.meta.glob(['../../**/*.{ts,tsx}', '!../../**/*.test.{ts,tsx}', '!../../**/_*', '!../../science/**'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    expect(Object.keys(files).length).toBeGreaterThan(50);
    const users = Object.entries(files).filter(([, src]) => /import[^;]*walking(?:Minutes|Km)/.test(src)).map(([f]) => f);
    expect(users).toEqual([]);
  });
});
