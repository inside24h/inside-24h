// Phase P1: the Body Score. Five axes (Energy, Sugar curve, Fullness, Sleep, Nutrients), each with a word tier and a
// one-line "why", and deliberately NO overall number (owner decision 2026-11-24). The rubric is data (RUBRIC), so the
// method page (HowWeKnow → "Body Score method") renders exactly what the code uses.
// Tiers describe size, never good or bad: Energy is a portion size, Fullness is "for its kcal", Nutrients uses the FDA
// label rule (20% DV or more is high), and a sugar curve we cannot estimate is "Not estimated", never a guess.
import type { Level } from '../../content/types';
import type { Axis, AxisKey, StoryNumber } from './types';

export interface TierRule { tier: 0 | 1 | 2 | 3; word: string; rule: string }
export interface AxisRubric { key: AxisKey; label: string; measures: string; tiers: TierRule[]; none: string; grade: Level; sources: string[]; note: string }

/** Fullness: a population heuristic from four food properties (not a dynamic model): points, then a tier. */
export const FULLNESS = {
  // energy density bands (kcal per gram), Rolls 2009: very low < 0.6, low 0.6–1.5, medium 1.5–4, high > 4
  density: [{ below: 0.6, pts: 2, label: 'under 0.6 kcal/g' }, { below: 1.5, pts: 1, label: '0.6–1.5 kcal/g' }, { below: 4, pts: 0, label: '1.5–4 kcal/g' }, { below: Infinity, pts: -1, label: 'over 4 kcal/g' }],
  // protein per 100 kcal (5 g = 20% of energy from protein), Dhillon 2016: more protein, more fullness
  protein: [{ atLeast: 10, pts: 2, label: '10 g or more per 100 kcal' }, { atLeast: 5, pts: 1, label: '5–10 g per 100 kcal' }],
  // fiber per 100 kcal, Clark & Slavin 2013: fiber adds fullness in many (not all) studies
  fiber: [{ atLeast: 3, pts: 2, label: '3 g or more per 100 kcal' }, { atLeast: 1.5, pts: 1, label: '1.5–3 g per 100 kcal' }],
  // kcal you drink fill you less than the same kcal you chew, DiMeglio & Mattes 2000
  liquid: { pts: -1, label: 'a drink' },
  tiers: [{ maxPts: 0, tier: 0 }, { maxPts: 1, tier: 1 }, { maxPts: 2, tier: 2 }, { maxPts: Infinity, tier: 3 }] as { maxPts: number; tier: 0 | 1 | 2 | 3 }[],
} as const;

/** Under this, fullness is not rated (a diet soda's few kcal would make any ratio meaningless). */
export const FULLNESS_MIN_KCAL = 20;

export const RUBRIC: Record<AxisKey, AxisRubric> = {
  energy: {
    key: 'energy', label: 'Energy', measures: 'kcal in this serving, and its share of the 2,000 kcal reference day on food labels',
    tiers: [
      { tier: 0, word: 'Light', rule: 'under 150 kcal' }, { tier: 1, word: 'Moderate', rule: '150–399 kcal' },
      { tier: 2, word: 'Large', rule: '400–699 kcal' }, { tier: 3, word: 'Very large', rule: '700 kcal or more' },
    ],
    none: 'Almost no energy (under 5 kcal)', grade: 'A', sources: ['usdaSR', 'fdaDV'],
    note: 'Portion-size words, not a judgment. The 2,000 kcal day is a label reference, not a target for you.',
  },
  sugar: {
    key: 'sugar', label: 'Sugar curve', measures: 'how far blood sugar rises in a typical body (range ±40% between people) and when it is back to usual',
    tiers: [
      { tier: 0, word: 'Steady', rule: 'rise under 0.3 mmol/L' }, { tier: 1, word: 'Gentle rise', rule: '0.3–0.9 mmol/L' },
      { tier: 2, word: 'Clear rise', rule: '1.0–1.9 mmol/L' }, { tier: 3, word: 'Big rise', rule: '2.0 mmol/L or more' },
    ],
    none: 'Not estimated: no measured glycemic index, so no curve', grade: 'C', sources: ['brandmiller2003', 'berry2020', 'zeevi2015'],
    note: 'Our curve is a typical response from the glycemic load, not yours: the same food can raise one person’s blood sugar twice as much as another’s.',
  },
  fullness: {
    key: 'fullness', label: 'Fullness', measures: 'energy density (kcal per gram), protein and fiber per 100 kcal, and whether you drink or chew it',
    tiers: [
      { tier: 0, word: 'Not very filling for its kcal', rule: '0 points or fewer' }, { tier: 1, word: 'Somewhat filling for its kcal', rule: '1 point' },
      { tier: 2, word: 'Filling for its kcal', rule: '2 points' }, { tier: 3, word: 'Very filling for its kcal', rule: '3 points or more' },
    ],
    none: 'Not rated: under 20 kcal', grade: 'B', sources: ['rolls2009', 'dhillon2016', 'clark2013', 'dimeglio2000', 'holt1995'],
    note: 'Estimate: a population rule of thumb from four food properties, not a measurement of how full you will feel.',
  },
  sleep: {
    key: 'sleep', label: 'Sleep', measures: 'caffeine left at your bedtime and how much longer falling asleep may take; alcohol still in your blood at bedtime',
    tiers: [
      { tier: 0, word: 'No effect expected', rule: 'no caffeine or alcohol left that matters at bedtime' },
      { tier: 1, word: 'Sensitive sleepers may notice', rule: 'caffeine above the cautious level, or a low dose of alcohol at bedtime' },
      { tier: 2, word: 'Slower to fall asleep', rule: 'caffeine that adds minutes to falling asleep, or a moderate dose of alcohol at bedtime' },
      { tier: 3, word: 'Much slower to fall asleep', rule: '20 or more extra minutes, or a high dose of alcohol at bedtime' },
    ],
    none: 'No effect expected', grade: 'B', sources: ['gardiner2023', 'gardiner2025', 'drake2013', 'ebrahim2013', 'pietila2018'],
    note: 'Caffeine: a level-C interpolation between two measured doses. Alcohol: the direction is level A, the size level B.',
  },
  nutrients: {
    key: 'nutrients', label: 'Nutrients', measures: 'protein, fiber, sodium, saturated fat and free sugars as % of the Daily Value on food labels',
    tiers: [
      { tier: 0, word: 'Nothing at 20% DV or more', rule: 'no nutrient at 20% DV or more' }, { tier: 1, word: 'High in one', rule: 'one nutrient at 20% DV or more' },
      { tier: 2, word: 'High in two', rule: 'two nutrients' }, { tier: 3, word: 'High in three or more', rule: 'three or more' },
    ],
    none: 'Not rated', grade: 'A', sources: ['fdaDV', 'usdaSR', 'who2015'],
    note: 'The FDA label rule: 5% DV or less is low, 20% DV or more is high. A Daily Value is a label reference, not a target or a limit set for you.',
  },
};

const n = (N: Record<string, StoryNumber>, k: string) => N[k]?.value ?? 0;
const has = (N: Record<string, StoryNumber>, k: string) => N[k] !== undefined;
const ax = (key: AxisKey, tier: Axis['tier'], word: string, why: string, numberKeys: string[], grade: Level = RUBRIC[key].grade, sources = RUBRIC[key].sources): Axis =>
  ({ key, tier, word, why, numberKeys: numberKeys.filter(Boolean), grade, sources: [...sources] });

export function energyAxis(N: Record<string, StoryNumber>): Axis {
  const k = n(N, 'kcal');
  if (k < 5) return ax('energy', 0, 'Almost none', `${Math.max(0, Math.round(k))} kcal: almost no energy.`, ['kcal']);
  const t = k < 150 ? 0 : k < 400 ? 1 : k < 700 ? 2 : 3;
  return ax('energy', t, RUBRIC.energy.tiers[t].word, `${Math.round(k)} kcal · ${N.kcalPct.text} of a 2,000 kcal day.`, ['kcal', 'kcalPct']);
}

export function sugarAxis(N: Record<string, StoryNumber>, unknownSugar: boolean): Axis {
  if (unknownSugar || !has(N, 'sugarPeak')) {
    return ax('sugar', null, 'Not estimated', 'Its glycemic index hasn’t been measured, so we don’t draw a curve rather than guess.', has(N, 'carbsG') ? ['carbsG'] : []);
  }
  const p = n(N, 'sugarPeak');
  const t = p < 0.3 ? 0 : p < 1 ? 1 : p < 2 ? 2 : 3;
  if (t === 0) return ax('sugar', 0, 'Steady', has(N, 'carbsG') && n(N, 'carbsG') >= 2 ? `Its ${Math.round(n(N, 'carbsG'))} g of carbs barely move blood sugar in a typical body.` : 'Almost no sugar or starch to raise blood sugar.', ['sugarPeak', has(N, 'carbsG') ? 'carbsG' : '']);
  const when = has(N, 'sugarPeakMin') ? ` about ${N.sugarPeakMin.text} in` : '';
  const back = has(N, 'sugarBackMin') ? `; back to usual after about ${N.sugarBackMin.text}` : '';
  return ax('sugar', t, RUBRIC.sugar.tiers[t].word, `Up ${N.sugarPeak.text}${when}${back}.`, ['sugarPeak', has(N, 'sugarPeakMin') ? 'sugarPeakMin' : '', has(N, 'sugarBackMin') ? 'sugarBackMin' : '']);
}

/** The Fullness points and their parts (shown as the inputs, so the rubric is never a black box). */
export function fullnessPoints(N: Record<string, StoryNumber>, drink: boolean): { pts: number; parts: string[] } {
  const ed = n(N, 'energyDensity'), pr = n(N, 'proteinPer100kcal'), fi = n(N, 'fiberPer100kcal');
  const d = FULLNESS.density.find((b) => ed < b.below)!;
  const p = FULLNESS.protein.find((b) => pr >= b.atLeast), f = FULLNESS.fiber.find((b) => fi >= b.atLeast);
  const parts = [`${d.label} (${d.pts >= 0 ? '+' : ''}${d.pts})`];
  if (p) parts.push(`protein ${p.label} (+${p.pts})`);
  if (f) parts.push(`fiber ${f.label} (+${f.pts})`);
  if (drink) parts.push(`${FULLNESS.liquid.label} (${FULLNESS.liquid.pts})`);
  return { pts: d.pts + (p?.pts ?? 0) + (f?.pts ?? 0) + (drink ? FULLNESS.liquid.pts : 0), parts };
}
export function fullnessAxis(N: Record<string, StoryNumber>, drink: boolean): Axis {
  if (n(N, 'kcal') < FULLNESS_MIN_KCAL || !has(N, 'energyDensity')) return ax('fullness', null, 'Not rated', `Under ${FULLNESS_MIN_KCAL} kcal: too little energy to rate how filling it is.`, ['kcal']);
  const { pts } = fullnessPoints(N, drink);
  const t = FULLNESS.tiers.find((x) => pts <= x.maxPts)!.tier;
  const why = `${N.energyDensity.text} · ${N.proteinPer100kcal.text} protein, ${N.fiberPer100kcal.text} fiber per 100 kcal${drink ? ' · a drink' : ''}.`;
  return ax('fullness', t, RUBRIC.fullness.tiers[t].word, why, ['energyDensity', 'proteinPer100kcal', 'fiberPer100kcal']);
}

export interface SleepIn {
  bed: string; /** caffeine */ risk: 'none' | 'sensitive' | 'delay'; extraMin: number; hasCaffeine: boolean;
  /** alcohol in the blood while you fall asleep (above 0.02 ‰), its dose tier */ alcoholAtBed: boolean; alcoholTier: 'low' | 'moderate' | 'high' | null; hasAlcohol: boolean;
}
export function sleepAxis(N: Record<string, StoryNumber>, s: SleepIn): Axis {
  const cafT = !s.hasCaffeine ? 0 : s.risk === 'delay' ? (s.extraMin >= 20 ? 3 : 2) : s.risk === 'sensitive' ? 1 : 0;
  const alcT = s.alcoholAtBed ? (s.alcoholTier === 'high' ? 3 : s.alcoholTier === 'moderate' ? 2 : 1) : 0;
  const cafKeys = s.hasCaffeine ? ['caffeineAtBedMg', s.risk === 'delay' ? 'sleepDelayMin' : ''] : [];
  if (alcT > 0 && alcT >= cafT) {
    const word = alcT === 3 ? 'Clearly broken sleep' : alcT === 2 ? 'Lighter, more broken sleep' : 'Slightly lighter sleep';
    return ax('sleep', alcT as 1 | 2 | 3, word, `Alcohol still in your blood at ${s.bed}: the second half of the night gets lighter.`, ['alcoholG', 'bacPeak', ...cafKeys], 'B', ['ebrahim2013', 'pietila2018']);
  }
  if (cafT > 0) {
    const why = s.risk === 'delay' ? `${N.caffeineAtBedMg.text} of caffeine left at ${s.bed} · about ${N.sleepDelayMin.text} longer to fall asleep.`
      : `${N.caffeineAtBedMg.text} of caffeine left at ${s.bed}: most sleep normally, sensitive people may not.`;
    return ax('sleep', cafT as 1 | 2 | 3, RUBRIC.sleep.tiers[cafT].word, why, cafKeys, 'C', ['gardiner2025', 'gardiner2023', 'drake2013']);
  }
  if (s.hasAlcohol) return ax('sleep', 0, 'Little effect expected', `Almost no alcohol should be left by ${s.bed}.`, ['alcoholG', ...(has(N, 'alcoholGoneMin') ? ['alcoholGoneMin'] : [])], 'C', ['ebrahim2013', 'jones2010']);
  if (s.hasCaffeine) return ax('sleep', 0, 'No effect expected', `Only ${N.caffeineAtBedMg.text} of caffeine left at ${s.bed}: too little to matter.`, ['caffeineAtBedMg'], 'B', ['gardiner2023', 'drake2013']);
  return ax('sleep', 0, 'No effect expected', 'No caffeine or alcohol in it.', [], 'A', ['drake2013', 'ebrahim2013']);
}

export const NUTRIENT_DV: { key: string; name: string; dir: 'provides' | 'limit' }[] = [
  { key: 'proteinDv', name: 'protein', dir: 'provides' }, { key: 'fiberDv', name: 'fiber', dir: 'provides' },
  { key: 'sodiumDv', name: 'sodium', dir: 'limit' }, { key: 'satFatDv', name: 'sat fat', dir: 'limit' }, { key: 'freeSugarDv', name: 'free sugars', dir: 'limit' },
];
export function nutrientsAxis(N: Record<string, StoryNumber>): Axis {
  const rows = NUTRIENT_DV.filter((r) => has(N, r.key));
  const high = rows.filter((r) => n(N, r.key) >= 20);
  const t = Math.min(3, high.length) as 0 | 1 | 2 | 3;
  const names = high.map((r) => r.name);
  const word = !high.length ? RUBRIC.nutrients.tiers[0].word : `High in ${names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`}`;
  const why = rows.length ? `${rows.map((r, i) => `${i ? r.name : r.name.charAt(0).toUpperCase() + r.name.slice(1)} ${N[r.key].value}%`).join(' · ')} DV.` : 'No nutrient values for this item.';
  return ax('nutrients', t, word, why, rows.map((r) => r.key));
}
