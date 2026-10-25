// One place that turns "this food + this person + this city" into everything the screen needs to judge it:
// the model run, vitals, traffic lights and quick answers. Used for the second item in Compare and for swaps.
import { buildVitals } from '../science/daily';
import { sleepAnchors } from '../science/anchors';
import { simulateHydration } from '../science/hydration';
import { MG_DL_PER_MMOL_L, type Profile } from '../science/profile';
import { bodyStatus, type System } from './status';
import { quickAnswers } from './Answers';
import { climateNow, findCity, cityLabel } from './climate/cities';
import { isPlain, macros, type Part } from './food/parse';
import { makeFoodProduct } from './food/foodProduct';
import { amountPhrase, capFirst } from './food/naming';
import { canPace, cleanPace } from './food/meal';
import { PRODUCTS } from './products';

const WATER_ML: Record<string, number> = { espresso: 29, cola: 295, water: 250 };
const T50_OF: Record<string, number> = { espresso: 13, cola: 32, water: 13 };
const CURATED = new Set(['espresso', 'cola', 'water']);

/** `overMin` = "Over how long?" (PACING, 2026-10-19; 0 = all at once). One serving has nothing to spread. */
export function analyze(parts: Part[], p: Profile, overMin = 0) {
  const one = parts.length === 1 ? parts[0] : null;
  // the curated models only for the plain default (a decaf espresso or a 500 ml cola uses the generic model)
  const curated = one && isPlain(one.food) && CURATED.has(one.food.id) && Math.abs(one.grams - one.food.serving.grams) < 1 ? one.food.id : null;
  const def = curated ? PRODUCTS[curated] : makeFoodProduct(parts, 'food', cleanPace(overMin));
  const built = def.build(p, 63);
  const v = buildVitals(p, built.caffeine, sleepAnchors(), true, built.effects);
  const city = findCity(p.city);
  const waterMl = built.waterMl ?? (curated ? WATER_ML[curated] : 0);
  const hyd = city ? { ...simulateHydration(p, climateNow(city), waterMl, built.t50 ?? (curated ? T50_OF[curated] : 13), v.asleep, !!p.airCon), city: cityLabel(city) } : undefined;
  const m = macros(parts);
  const unknownSugar = !curated && m.gl === null && m.availCarbs >= 3;
  const systems = bodyStatus(built.caffeine, v, waterMl, built.bac, hyd, unknownSugar);
  const answers = quickAnswers({
    systems, drinkAt: p.drinkAtMin, bedtimeMin: p.bedtimeMin, weightKg: p.weightKg, kcal: built.energy.total,
    glucoseDeltaMgDl: unknownSugar ? undefined : built.effects.glucoseMgDl ?? new Float64Array(1441),
    extraSleepMin: v.extraLatencyMin, caffeineAtBedMg: v.mgAtBed, caffeineDoseMg: built.caffeine.doseMg, sleepRisk: v.sleepRisk, bac: built.bac, alcoholG: built.alcoholG, alcoholFed: built.alcoholFed, wakeMin: p.wakeMin, waterMl,
    glucoseUnit: p.glucoseUnit, // Compare shows the unit picked in "Your body"
    pace: built.pace, canPace: !curated && canPace(parts),
  });
  const g = built.effects.glucoseMgDl;
  const sugarPeak = unknownSugar ? null : g ? Math.max(0, ...Array.from(g.subarray(0, 600))) / 18.016 : 0;
  return { name: def.content.name, color: built.story.color, built, systems, answers, sugarPeak, glucose: unknownSugar ? undefined : g, kcal: built.energy.total, macros: m,
    sleepDelayMin: v.extraLatencyMin, // minutes caffeine adds to falling asleep (verdictOf)
    // the name for Compare, its video and verdict: with the amount when it is not one usual serving ("2 espressos",
    // "3 × 500 ml of beer"), so "Beer vs Beer" or "Espresso … 127 mg" never hides how much (QA 2026-10-23)
    label: one && Math.abs(one.grams - one.food.serving.grams) > 1 ? capFirst(amountPhrase(one).replace(/ \([^)]*\)/g, '')) : def.content.name,
    // how much, in a few words, for the comparison video (round 5: "1 can · 330 ml" vs "330 ml")
    serving: one ? servingText(one.amountLabel) : `${Math.round(parts.reduce((a, x) => a + x.grams, 0))} g` };
}
export type Analysis = ReturnType<typeof analyze>;
/** "1 × can (≈ 330 ml)" → "1 can · 330 ml"; "330 ml" stays; "Whole · 1104 g" stays. */
export function servingText(label: string): string {
  const m = /^(\d+(?:\.\d+)?|½) × ([^(]+?) \(≈ ([^)]+)\)$/.exec(label.trim());
  if (m) return `${m[1]} ${m[2].trim()} · ${m[3]}`;
  return label.replace(/[()≈]/g, '').replace(/\s+/g, ' ').trim();
}

type Unit = Profile['glucoseUnit'];
/** "+2.3 mmol/L" or "+41 mg/dL": a sugar CHANGE (given in mmol/L) in the unit picked in "Your body". */
export function sugarDeltaText(mmol: number, unit: Unit = 'mmol/L', withUnit = true): string {
  const sign = mmol > 0 ? '+' : mmol < 0 ? '−' : '';
  const v = unit === 'mg/dL' ? `${Math.round(Math.abs(mmol) * MG_DL_PER_MMOL_L)}` : Math.abs(mmol).toFixed(1);
  return `${sign}${v}${withUnit ? ` ${unit}` : ''}`;
}
/** The peak for Compare and the comparison video: "not measured", "steady" or "+2.3 mmol/L" / "+41 mg/dL". */
export const sugarPeakText = (peakMmol: number | null, unit: Unit = 'mmol/L') =>
  peakMmol === null ? 'not measured' : peakMmol < 0.3 ? 'steady' : sugarDeltaText(peakMmol, unit);

/**
 * Which one is easier on the body over the day, in one plain sentence (Compare, the comparison video and its caption).
 * Score = minutes any system is under stress (yellow 1, red 3; systems without data are skipped) + energy (1 point per
 * 50 kcal). Close scores = a draw.
 *
 * Alcohol is a different kind of harm from a sugar peak or a late coffee (a toxin, WHO/IARC Group 1; impaired attention,
 * lighter sleep), and the minute score does not weigh that, so (prelaunch QA 2026-10-23):
 * - only one side has alcohol: the alcohol-free side wins ("no alcohol"), unless its own score is clearly worse (a big
 *   sugar peak, caffeine at bedtime) — then it is a trade-off that names both costs. Alcohol never "wins".
 * - both have alcohol: the one with less alcohol is "the lighter choice" (no trophy); same alcohol → a lower peak, else close.
 * - a winner is only named when we can say why in words; otherwise it is close.
 */
export function verdictOf(a: Analysis, b: Analysis, unit: Unit = 'mmol/L'): string {
  const skip = a.sugarPeak === null || b.sugarPeak === null; // compare like with like
  const stressOf = (x: Analysis, key: System['key']) => {
    const s = x.systems.find((y) => y.key === key);
    if (!s || s.unknown || (skip && key === 'energy')) return 0;
    let t = 0; for (let m = 0; m < s.levels.length; m++) t += s.levels[m] === 2 ? 3 : s.levels[m];
    return t;
  };
  const score = (x: Analysis) => stressOf(x, 'energy') + stressOf(x, 'heart') + stressOf(x, 'water') + stressOf(x, 'brain') + x.kcal / 50;
  const near = (x: number, y: number) => Math.abs(x - y) < Math.max(3, 0.1 * Math.max(x, y));
  const alc = (x: Analysis) => ((x.built.alcoholG ?? 0) > 1 ? x.built.alcoholG! : 0);
  const bacPeak = (x: Analysis) => (x.built.bac ? Math.max(0, ...Array.from(x.built.bac)) : 0);
  const caf = (x: Analysis) => x.built.caffeine.doseMg;
  const cafStress = (x: Analysis) => stressOf(x, 'brain') + stressOf(x, 'heart'); // only used when the other side has no alcohol
  const sugarOk = (x: Analysis, y: Analysis) => !skip && x.sugarPeak !== null && y.sugarPeak !== null;
  const close = `It’s close: ${a.label} and ${b.label} affect your body about the same.`;

  /** why w is easier on the body than l, in words (alcohol aside) */
  const reasons = (w: Analysis, l: Analysis) => {
    const why: string[] = [];
    if (sugarOk(w, l) && l.sugarPeak! - w.sugarPeak! >= 0.4)
      why.push(w.sugarPeak! < 0.3 ? 'no blood sugar peak' : `a smaller blood sugar peak (${sugarDeltaText(w.sugarPeak!, unit, false)} vs ${sugarDeltaText(l.sugarPeak!, unit)})`);
    else if (sugarOk(w, l) && stressOf(l, 'energy') - stressOf(w, 'energy') >= 30 && stressOf(l, 'energy') >= 1.5 * stressOf(w, 'energy'))
      why.push('less time with raised blood sugar');
    if (!alc(w) && !alc(l) && caf(l) - caf(w) >= 20 && cafStress(l) - cafStress(w) >= 10) {
      if (l.sleepDelayMin >= 5 && w.sleepDelayMin <= l.sleepDelayMin - 3) why.push(caf(w) < 1 ? 'no caffeine to keep you awake' : 'less caffeine at bedtime');
      else why.push(caf(w) < 1 ? 'no caffeine' : `less caffeine (${Math.round(caf(w))} vs ${Math.round(caf(l))} mg)`);
    }
    if (l.kcal - w.kcal >= 30) why.push(`${Math.round(l.kcal - w.kcal)} fewer kcal`);
    return why;
  };
  /** what n costs the body that d does not (for a trade-off against an alcoholic d) */
  const costs = (n: Analysis, d: Analysis) => {
    const out: string[] = [];
    if (!skip && n.sugarPeak !== null && n.sugarPeak >= 0.3 && (d.sugarPeak === null || n.sugarPeak - d.sugarPeak >= 0.4) && stressOf(n, 'energy') > 0)
      out.push(d.sugarPeak !== null && d.sugarPeak >= 0.3 ? 'a bigger blood sugar peak' : 'a blood sugar peak');
    // a delay we can count; a lot by day (heart or ≥ 200 mg, EFSA); else the "maybe lighter sleep" tier at bedtime
    if (caf(n) >= 20 && cafStress(n) >= 10)
      out.push(n.sleepDelayMin >= 5 ? 'caffeine that delays your sleep' : stressOf(n, 'heart') >= 10 || caf(n) >= 200 ? 'a lot of caffeine' : 'caffeine at bedtime');
    if (n.kcal - d.kcal >= 100) out.push(`${Math.round(n.kcal - d.kcal)} more kcal`);
    return out;
  };

  const alcA = alc(a), alcB = alc(b);
  if (!!alcA !== !!alcB) { // one side has alcohol
    const [n, d] = alcA ? [b, a] : [a, b];
    const sn = score(n), sd = score(d), cost = costs(n, d);
    if (sn > sd && !near(sn, sd) && cost.length) return `No clear winner: ${d.label} brings alcohol; ${n.label} brings ${cost.slice(0, 2).join(' and ')}.`;
    return `🏆 ${n.label} wins: ${['no alcohol', ...reasons(n, d)].slice(0, 2).join(', ')}.`;
  }
  if (alcA && alcB) { // both have alcohol: the amount of alcohol decides first, never a trophy
    const lo = Math.min(alcA, alcB), hi = Math.max(alcA, alcB);
    const lighter = (w: Analysis, l: Analysis, first: string) => `${w.label} is the lighter choice: ${[first, ...reasons(w, l)].slice(0, 2).join(', ')}.`;
    if (hi - lo >= 3 && hi >= 1.2 * lo) {
      const [w, l] = alcA < alcB ? [a, b] : [b, a];
      const k = Math.round(hi / lo), hiG = Math.abs(hi / lo - k) < 0.03 ? k * Math.round(lo) : Math.round(hi); // 1 vs 2 beers: "20 g vs 40 g", not "vs 39 g"
      return lighter(w, l, `less alcohol (${Math.round(lo)} g vs ${hiG} g)`);
    }
    const pa = bacPeak(a), pb = bacPeak(b);
    if (Math.abs(pa - pb) >= 0.05) { const [w, l] = pa < pb ? [a, b] : [b, a]; return lighter(w, l, 'a lower blood alcohol peak'); }
    return `It’s close: ${a.label} and ${b.label} bring about the same alcohol (about ${Math.round((alcA + alcB) / 2)} g).`;
  }
  const sa = score(a), sb = score(b);
  if (near(sa, sb)) return close;
  const [w, l] = sa < sb ? [a, b] : [b, a];
  const why = reasons(w, l);
  return why.length ? `🏆 ${w.label} wins: ${why.slice(0, 2).join(', ')}.` : close; // never a winner we can't explain
}

// Slower or lighter everyday swaps, by database id. Each is checked with the model before it is shown,
// so a swap only appears when it really lowers the sugar peak.
export const SWAPS: Record<string, string[]> = {
  cola: ['diet cola', 'glass of water', 'sparkling water'],
  'energy-drink': ['filter coffee', 'espresso'],
  'iced-tea': ['herbal tea', 'green tea'],
  lemonade: ['sparkling water'],
  'orange-juice': ['1 orange'],
  'apple-juice': ['1 apple'],
  smoothie: ['1 apple', '1 banana'],
  'chocolate-milk': ['glass of milk'],
  'hot-chocolate': ['glass of milk'],
  cornflakes: ['oatmeal', 'muesli'],
  'rice-cakes': ['almonds', 'peanuts'],
  'potato-boiled': ['pasta', 'lentils'],
  'potato-mashed': ['pasta', 'lentils'],
  'rice-white': ['pasta', 'lentils'],
  'bread-white': ['rye bread', 'chickpeas'],
  doughnut: ['1 apple', 'plain yogurt'],
  'cake-sponge': ['1 apple', 'strawberries'],
  'yogurt-fruit': ['greek yogurt'],
  honey: ['strawberries'],
  sugar: ['strawberries'],
  jam: ['peanut butter'],
  fries: ['pasta'],
  watermelon: ['strawberries', '1 apple'],
  raisins: ['grapes', '1 apple'],
  'dried-apricots': ['1 apple'],
  dates: ['1 apple'],
};
