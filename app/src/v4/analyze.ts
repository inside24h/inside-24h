// One place that turns "this food + this person + this city" into everything the screen needs to judge it:
// the model run, vitals, traffic lights and quick answers. Used for the second item in Compare and for swaps.
import { buildVitals } from '../science/daily';
import { sleepAnchors } from '../science/anchors';
import { simulateHydration } from '../science/hydration';
import { MG_DL_PER_MMOL_L, type Profile } from '../science/profile';
import { bodyStatus } from './status';
import { quickAnswers } from './Answers';
import { climateNow, findCity, cityLabel } from './climate/cities';
import { isPlain, macros, type Part } from './food/parse';
import { makeFoodProduct } from './food/foodProduct';
import { PRODUCTS } from './products';

const WATER_ML: Record<string, number> = { espresso: 29, cola: 295, water: 250 };
const T50_OF: Record<string, number> = { espresso: 13, cola: 32, water: 13 };
const CURATED = new Set(['espresso', 'cola', 'water']);

export function analyze(parts: Part[], p: Profile) {
  const one = parts.length === 1 ? parts[0] : null;
  // the curated models only for the plain default (a decaf espresso or a 500 ml cola uses the generic model)
  const curated = one && isPlain(one.food) && CURATED.has(one.food.id) && Math.abs(one.grams - one.food.serving.grams) < 1 ? one.food.id : null;
  const def = curated ? PRODUCTS[curated] : makeFoodProduct(parts, 'food');
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
    extraSleepMin: v.extraLatencyMin, caffeineAtBedMg: v.mgAtBed, caffeineDoseMg: built.caffeine.doseMg, sleepRisk: v.sleepRisk, bac: built.bac, alcoholG: built.alcoholG, wakeMin: p.wakeMin, waterMl,
    glucoseUnit: p.glucoseUnit, // Compare shows the unit picked in "Your body"
  });
  const g = built.effects.glucoseMgDl;
  const sugarPeak = unknownSugar ? null : g ? Math.max(0, ...Array.from(g.subarray(0, 600))) / 18.016 : 0;
  return { name: def.content.name, color: built.story.color, built, systems, answers, sugarPeak, glucose: unknownSugar ? undefined : g, kcal: built.energy.total, macros: m };
}
export type Analysis = ReturnType<typeof analyze>;

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
 * Which one is easier on the body over the day, in one plain sentence. Score = minutes any system is under stress
 * (yellow 1, red 3; systems without data are skipped) + energy (1 point per 50 kcal). Close scores = a draw.
 */
export function verdictOf(a: Analysis, b: Analysis): string {
  const stress = (x: Analysis, skipSugar: boolean) => x.systems.reduce((sum, s) => {
    if (s.unknown || (skipSugar && s.key === 'energy')) return sum;
    let t = 0; for (let m = 0; m < s.levels.length; m++) t += s.levels[m] === 2 ? 3 : s.levels[m];
    return sum + t;
  }, 0);
  const skip = a.sugarPeak === null || b.sugarPeak === null; // compare like with like
  const score = (x: Analysis) => stress(x, skip) + x.kcal / 50;
  const sa = score(a), sb = score(b);
  if (Math.abs(sa - sb) < Math.max(3, 0.1 * Math.max(sa, sb))) return `It’s close: ${a.name} and ${b.name} affect your body about the same.`;
  const [w, l] = sa < sb ? [a, b] : [b, a];
  const why: string[] = [];
  if (!skip && w.sugarPeak !== null && l.sugarPeak !== null && l.sugarPeak - w.sugarPeak >= 0.4)
    why.push(w.sugarPeak < 0.3 ? 'no blood sugar peak' : `a smaller blood sugar peak (+${w.sugarPeak.toFixed(1)} vs +${l.sugarPeak.toFixed(1)})`);
  if (l.kcal - w.kcal >= 30) why.push(`${Math.round(l.kcal - w.kcal)} fewer kcal`);
  const lBac = l.built.bac ? Math.max(...Array.from(l.built.bac)) : 0, wBac = w.built.bac ? Math.max(...Array.from(w.built.bac)) : 0;
  if (lBac - wBac >= 0.05) why.push(wBac < 0.01 ? 'no alcohol' : 'a lower blood alcohol peak');
  return `🏆 ${w.name} wins${why.length ? `: ${why.slice(0, 2).join(', ')}` : ''}.`;
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
