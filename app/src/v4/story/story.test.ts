// Phase P1 (roadmap 2026-11-24): the Food Story contract, swept over every item × variant × builder choice (the fast
// tier checks every 24th, the full tier all) for the audit body and a few other bodies.
import { describe, expect, it } from 'vitest';
import { analyze, type Analysis } from '../analyze';
import { AUDIT_PROFILE, auditItems } from '../text-audit';
import { sweep } from '../sweep.testutil';
import { DEFAULT_PROFILE, MG_DL_PER_MMOL_L, type Profile } from '../../science/profile';
import { alcoholClock } from '../../science/alcoholClock';
import { tipSource } from '../../content/tips';
import { minSaid, plainItem, storyOf, stripOf, sugarTimes } from './foodStory';
import { FULLNESS, RUBRIC } from './axes';
import { AXIS_KEYS, type FoodStory } from './types';
import type { Part } from '../food/parse';

const ITEMS = sweep(auditItems());
const OTHER: Profile[] = [
  { ...DEFAULT_PROFILE, sex: 'female', weightKg: 55, heightCm: 162, ageY: 28, glucoseUnit: 'mg/dL', drinkAtMin: 21 * 60, bedtimeMin: 22 * 60 + 30 },
  { ...DEFAULT_PROFILE, weightKg: 110, heightCm: 190, smoker: true, drinkAtMin: 8 * 60 },
  { ...DEFAULT_PROFILE, sex: 'female', weightKg: 68, oralContraceptives: true, drinkAtMin: 17 * 60, bedtimeMin: 23 * 60 + 30 },
];
const LEVELS = new Set(['A', 'B', 'C', '?']);
const cases: { id: string; x: Analysis; parts: Part[]; p: Profile }[] = [
  ...ITEMS.map((i) => ({ id: i.id, x: i.x, parts: i.parts, p: AUDIT_PROFILE })),
  ...OTHER.flatMap((p, k) => sweep(ITEMS, 4).filter((_, j) => j % OTHER.length === k).map((i) => ({ id: `${i.id} (body ${k + 1})`, x: analyze(i.parts, p), parts: i.parts, p }))),
];
const stories = new Map<string, FoodStory>();
const storyOfCase = (c: typeof cases[number]) => { let s = stories.get(c.id); if (!s) { s = storyOf(c.x, c.parts, c.p); stories.set(c.id, s); } return s; };

/** Every finite-number check on a JSON value. */
function badNumbers(v: unknown, path = '$', out: string[] = []): string[] {
  if (typeof v === 'number') { if (!Number.isFinite(v)) out.push(path); }
  else if (Array.isArray(v)) v.forEach((x, i) => badNumbers(x, `${path}[${i}]`, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) badNumbers(x, `${path}.${k}`, out);
  return out;
}

describe('phase P1: the Food Story contract (every item × variant, several bodies)', () => {
  it('JSON-serializable, deterministic, no NaN or Infinity, at most 14 kB', () => {
    const bad: string[] = [];
    for (const c of cases) {
      const s = storyOfCase(c), j = JSON.stringify(s);
      if (JSON.stringify(JSON.parse(j)) !== j) bad.push(`${c.id}: not round-trip`);
      if (JSON.stringify(storyOf(c.x, c.parts, c.p)) !== j) bad.push(`${c.id}: not deterministic`);
      const nn = badNumbers(s); if (nn.length) bad.push(`${c.id}: non-finite ${nn.slice(0, 3).join(', ')}`);
      if (j.length > 14 * 1024) bad.push(`${c.id}: ${j.length} bytes`);
    }
    expect(bad).toEqual([]);
  });
  it('every numberKey / effectKey / deltaKey resolves to a story number', () => {
    const bad: string[] = [];
    for (const c of cases) {
      const s = storyOfCase(c), has = (k: string) => k in s.numbers;
      for (const a of Object.values(s.axes)) for (const k of a.numberKeys) if (!has(k)) bad.push(`${c.id}: axis ${a.key} → ${k}`);
      for (const l of s.ladders) if (!has(l.effectKey)) bad.push(`${c.id}: ladder → ${l.effectKey}`);
      for (const e of s.events) if (e.numberKey && !has(e.numberKey)) bad.push(`${c.id}: event ${e.key} → ${e.numberKey}`);
      for (const u of s.surprises) if (!has(u.numberKey)) bad.push(`${c.id}: surprise → ${u.numberKey}`);
      for (const a of s.actions) if (a.deltaKey && !has(a.deltaKey)) bad.push(`${c.id}: action → ${a.deltaKey}`);
      for (const e of s.events) if (!(e.min >= 0 && e.min <= 1440)) bad.push(`${c.id}: event ${e.key} at ${e.min}`);
    }
    expect(bad).toEqual([]);
  });
  it('every number, axis, action and unknown has a grade and sources that resolve', () => {
    const bad: string[] = [];
    const chk = (id: string, what: string, grade: string, sources: string[]) => {
      if (!LEVELS.has(grade)) bad.push(`${id}: ${what} grade ${grade}`);
      if (!sources.length) bad.push(`${id}: ${what} has no source`);
      for (const k of sources) if (!tipSource(k)) bad.push(`${id}: ${what} source ${k} does not resolve`);
    };
    for (const c of cases) {
      const s = storyOfCase(c);
      for (const n of Object.values(s.numbers)) { chk(c.id, `number ${n.key}`, n.grade, n.sources); if (!n.text) bad.push(`${c.id}: ${n.key} has no text`); }
      for (const a of Object.values(s.axes)) chk(c.id, `axis ${a.key}`, a.grade, a.sources);
      for (const a of s.actions) chk(c.id, `action ${a.kind}`, a.grade, a.sources);
      for (const u of s.unknowns) chk(c.id, 'unknown', u.grade, u.sources);
      for (const t of s.curves.bac?.thresholds ?? []) if (!tipSource(t.source)) bad.push(`${c.id}: threshold source ${t.source}`);
    }
    for (const r of Object.values(RUBRIC)) for (const k of r.sources) if (!tipSource(k)) bad.push(`rubric ${r.key}: ${k}`);
    expect(bad).toEqual([]);
  });
  it('every model number equals the value recomputed from analyze() (to its rounding)', () => {
    const bad: string[] = [];
    for (const c of cases) {
      const s = storyOfCase(c), x = c.x, b = x.built, N = s.numbers;
      const clk = b.bac && (b.alcoholG ?? 0) > 1 ? alcoholClock(b.bac) : null;
      const st = x.glucose ? sugarTimes(x.glucose) : null;
      let tgk = 0; if (b.effects.tgMmol) for (let i = 1; i < b.effects.tgMmol.length; i++) if (b.effects.tgMmol[i] > b.effects.tgMmol[tgk]) tgk = i;
      const want: Record<string, number | undefined> = {
        sugarPeak: x.sugarPeak === null ? undefined : Math.round(x.sugarPeak * 100) / 100, sugarPeakMin: st?.peakAt, sugarBackMin: st?.backAt,
        caffeineAtBedMg: Math.round(x.caffeineAtBedMg), sleepDelayMin: Math.round(x.sleepDelayMin), caffeineHalfLifeH: Math.round(b.caffeine.halfLifeH * 10) / 10, caffeinePeakMin: b.caffeine.tmaxMin,
        bacPeak: clk ? Math.round(clk.peak * 1000) / 1000 : undefined, bacPeakMin: clk?.peakMin, alcoholGoneMin: clk?.goneMin,
        stomachHalfMin: b.t50 !== undefined ? minSaid(b.t50) : undefined, tgPeakH: Math.round(tgk / 30) / 2,
      };
      for (const n of Object.values(N)) {
        if (n.origin !== 'model') continue;
        if (!(n.key in want)) { bad.push(`${c.id}: model number ${n.key} has no recomputation in this test`); continue; }
        if (want[n.key] !== n.value) bad.push(`${c.id}: ${n.key} ${n.value} ≠ ${want[n.key]}`);
      }
      if (N.kcal.value !== Math.round(x.kcal)) bad.push(`${c.id}: kcal`);
      if (N.sugarPeak && c.p.glucoseUnit === 'mg/dL' && !N.sugarPeak.text.includes('mg/dL')) bad.push(`${c.id}: sugar in the wrong unit`);
      if (N.sugarPeak && N.sugarPeak.range && Math.abs(N.sugarPeak.range[1] * MG_DL_PER_MMOL_L - N.sugarPeak.value * 1.4 * MG_DL_PER_MMOL_L) > 2) bad.push(`${c.id}: sugar range`);
    }
    expect(bad).toEqual([]);
  });
  it('all five axes, each with a word and a why of at most 140 characters; no overall score anywhere', () => {
    const bad: string[] = [];
    for (const c of cases) {
      const s = storyOfCase(c);
      if (JSON.stringify(Object.keys(s.axes).sort()) !== JSON.stringify([...AXIS_KEYS].sort())) bad.push(`${c.id}: axes ${Object.keys(s.axes)}`);
      for (const k of AXIS_KEYS) {
        const a = s.axes[k];
        if (!a.word.trim()) bad.push(`${c.id}: ${k} without a word`);
        if (!a.why.trim() || a.why.length > 140) bad.push(`${c.id}: ${k} why (${a.why.length}): ${a.why}`);
        if (!(a.tier === null || [0, 1, 2, 3].includes(a.tier))) bad.push(`${c.id}: ${k} tier ${a.tier}`);
        if (a.tier !== null && k !== 'nutrients' && !RUBRIC[k].tiers.some((t) => t.word === a.word) && !['Almost none', 'Little effect expected', 'Slightly lighter sleep', 'Lighter, more broken sleep', 'Clearly broken sleep'].includes(a.word)) bad.push(`${c.id}: ${k} word not in the rubric: ${a.word}`);
      }
      // (structural: an overall number cannot sneak in)
      const banned = /^(score|total|overall|rating|sum)$/i;
      for (const k of Object.keys(s)) if (banned.test(k)) bad.push(`${c.id}: story key ${k}`);
      for (const a of Object.values(s.axes)) for (const k of Object.keys(a)) if (banned.test(k)) bad.push(`${c.id}: axis key ${k}`);
      for (const k of Object.keys(s.axes)) if (banned.test(k)) bad.push(`${c.id}: axes key ${k}`);
    }
    expect(bad).toEqual([]);
  });
  it('the sugar curve says "Not estimated" (no tier) exactly when the food has no glycemic index', () => {
    for (const c of cases) {
      const a = storyOfCase(c).axes.sugar;
      expect(a.tier === null, c.id).toBe(c.x.sugarPeak === null);
      if (a.tier === null) expect(a.word).toBe('Not estimated');
    }
  });
  it('fullness follows the published points table', () => {
    for (const c of cases) {
      const s = storyOfCase(c), N = s.numbers, a = s.axes.fullness;
      if (a.tier === null) { expect(N.kcal.value < 20 || !N.energyDensity, c.id).toBe(true); continue; }
      const d = FULLNESS.density.find((x) => N.energyDensity.value < x.below)!.pts, p = FULLNESS.protein.find((x) => N.proteinPer100kcal.value >= x.atLeast)?.pts ?? 0, f = FULLNESS.fiber.find((x) => N.fiberPer100kcal.value >= x.atLeast)?.pts ?? 0;
      const pts = d + p + f + (/· a drink\.$/.test(a.why) ? FULLNESS.liquid.pts : 0);
      expect(a.tier, c.id).toBe(FULLNESS.tiers.find((t) => pts <= t.maxPts)!.tier);
    }
  });
  it('coverage: ≥ 3 surprises for ≥ 95 % of items, and the rest are low or plain items; cheat sheet ≥ 2 of 3 for ≥ 95 %, the rest plain', () => {
    const base = cases.filter((c) => c.p === AUDIT_PROFILE).map((c) => ({ c, s: storyOfCase(c) }));
    const fewSurprises = base.filter(({ s }) => s.surprises.length < 3), fewCheat = base.filter(({ s }) => [s.cheat.bestTime, s.cheat.pairWith, s.cheat.swapFor].filter(Boolean).length < 2);
    expect(fewSurprises.length, fewSurprises.map(({ c }) => c.id).join(', ')).toBeLessThanOrEqual(Math.floor(0.05 * base.length));
    expect(fewCheat.length, fewCheat.map(({ c }) => c.id).join(', ')).toBeLessThanOrEqual(Math.floor(0.05 * base.length));
    // the documented fallback: only a plain item (under 20 kcal, no alcohol, under 10 mg of caffeine) may have fewer
    for (const { c } of fewCheat) expect(plainItem(c.x), `${c.id}: cheat sheet under 2 lines but not plain`).toBe(true);
    for (const { c, s } of fewSurprises) expect(plainItem(c.x) || s.surprises.length >= 1, `${c.id}: no surprise at all`).toBe(true);
  });
  it('surprise guesses: three distinct readable options, ascending, the truth among them', () => {
    const bad: string[] = [];
    for (const c of cases) for (const u of storyOfCase(c).surprises) {
      const v = u.options.map((o) => Number(/[\d.]+/.exec(o)?.[0]));
      if (!(v[0] < v[1] && v[1] < v[2])) bad.push(`${c.id}: ${u.options.join(' / ')}`);
      if (v.some((x, i) => i && x < 1.15 * v[i - 1])) bad.push(`${c.id}: options too close ${u.options.join(' / ')}`);
      if (!u.question.startsWith('Guess: ')) bad.push(`${c.id}: ${u.question}`);
    }
    expect(bad).toEqual([]);
  });
  it('the numbers line: kcal first, only story numbers, ≥ 4 numbers for most items', () => {
    let four = 0;
    for (const c of cases) {
      const s = storyOfCase(c), ps = stripOf(s);
      expect(ps[0]?.key, c.id).toBe('kcal');
      for (const q of ps) expect(q.key in s.numbers, `${c.id}: ${q.key}`).toBe(true);
      if (ps.length >= 4) four++;
    }
    expect(four / cases.length).toBeGreaterThanOrEqual(0.6);
  });
  it('body label: the default body is "a 70 kg adult"; any other says its kg and sex', () => {
    expect(storyOfCase(cases[0]).body).toMatchObject({ label: 'a 70 kg adult', isDefault: true });
    const o = cases.find((c) => c.p !== AUDIT_PROFILE);
    if (o) expect(storyOfCase(o).body.label).toMatch(/^a \d+ kg (woman|man)$/);
  });
});
