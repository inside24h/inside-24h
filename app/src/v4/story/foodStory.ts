// Phase P1 (roadmap 2026-11-24): storyOf(), the ONE Food Story for any parts list, profile and cut. It runs nothing new
// in the science layer: it reads analyze() (the model run, vitals, answers), the caffeine timeline, blood alcohol
// (alcoholClock), the sleep anchors, the tips and swaps, the sources and video-facts' own numbers (DV, arcClass,
// factInOf). Pure and deterministic: the same input gives the same JSON, with no Date, no randomness and no DOM.
import { analyze, SWAPS, type Analysis } from '../analyze';
import { foodKey, parseMeal, type Part } from '../food/parse';
import { capFirst } from '../food/naming';
import { DEFAULT_PROFILE, MG_DL_PER_MMOL_L, type Profile } from '../../science/profile';
import { sleepAnchors } from '../../science/anchors';
import { alcoholSleepTier, caffeineLatencyMin, minutesToBed, SLEEP_WINDOW_MIN, sleepConc, sleepRiskAt, sleepRiskOf } from '../../science/daily';
import { alcoholClock } from '../../science/alcoholClock';
import { bacRange, GLUCOSE_SPREAD } from '../../science/ranges';
import type { Timeline } from '../../science/espressoSim';
import { FACTORS } from '../../science/personal';
import { TIPS } from '../../content/tips';
import { arcClass, DV, factInOf, timeAt } from '../video-facts';
import { ANCHORS, anchorCount, anchorText, REFERENCE } from './everyday';
import { energyAxis, fullnessAxis, nutrientsAxis, sleepAxis, sugarAxis, type SleepIn } from './axes';
import { surprisesOf } from './surprise';
import { unknownsOf } from './unknowns';
import type { AxisKey, CurveKey, FoodStory, Ladder, StoryAction, StoryCurve, StoryEvent, StoryNumber } from './types';

const hh = (m: number) => `${String(Math.floor((((m % 1440) + 1440) % 1440) / 60)).padStart(2, '0')}:${String(Math.floor(((m % 60) + 60) % 60)).padStart(2, '0')}`;
/** A model time as said everywhere (timeWords C12): to 5 min under 2 h, else to the half hour. */
export const minText = (min: number) => { const [n, u] = timeAt(min); return u === 'minutes' ? `${n} min` : `${n} h`; };
/** The minutes a model time is said as (minText), so a number and its text never disagree. */
export const minSaid = (min: number) => { const [n, u] = timeAt(min); return u === 'minutes' ? n : n * 60; };
const r1 = (x: number) => Math.round(x * 10) / 10;
const fmt = (x: number) => (x >= 1000 ? x.toLocaleString('en-US') : String(x));
/** A short stable hash (the guess options' seed). */
function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; return h; }

/** The glucose peak, its minute and when it is back near the start (the quick answer's definitions, Answers.tsx). */
export function sugarTimes(g: ArrayLike<number>): { peak: number; peakAt: number; backAt: number } {
  let peak = 0, peakAt = 0, backAt = -1;
  const end = Math.min(g.length, 600);
  for (let m = 0; m < end; m++) if (g[m] > peak) { peak = g[m]; peakAt = m; }
  for (let m = peakAt; m < end; m++) if (g[m] < 0.15 * peak) { backAt = m; break; }
  return { peak, peakAt, backAt };
}
/** Latest clock minute (5-min steps from 06:00) to have this caffeine and leave sleep untouched (AppV4's rule, the same
 *  scale as the sleep answer); null when under 10 mg. */
export function latestForSleep(sim: Timeline, p: Profile): number | null {
  if (sim.doseMg < 10) return null;
  const anchors = sleepAnchors();
  let best: number | null = null;
  for (let t = 6 * 60; t < p.bedtimeMin; t += 5) {
    const c = sleepConc(sim.conc, p.bedtimeMin - t);
    if (sleepRiskOf(caffeineLatencyMin(c, anchors), c, anchors) !== 'none') break;
    best = t;
  }
  return best;
}
/** Highest blood alcohol from lights-out to 90 min after (the sleep answer's window). */
export function bacAtBed(bac: ArrayLike<number>, bedRel: number): number {
  let v = 0;
  for (let m = bedRel; m <= Math.min(bac.length - 1, bedRel + SLEEP_WINDOW_MIN); m++) v = Math.max(v, bac[m]);
  return v;
}
const downsample = (y: ArrayLike<number>, scale = 1, dp = 3): number[] => {
  const out: number[] = [], k = 10 ** dp;
  for (let m = 0; m <= 1440 && m < y.length; m += 5) out.push(Math.round(y[m] * scale * k) / k || 0);
  return out;
};

/** True when the item is a drink (the story's first chapter is a sip, as everywhere: video-facts factInOf). */
const isDrink = (x: Analysis) => !/bite/i.test(x.built.story.chapters[0]?.title ?? '');

/** Every number of the story (exported for class-stats.gen.test.ts, which needs them without the surprises). */
export function numbersOf(x: Analysis, p: Profile): Record<string, StoryNumber> {
  const N: Record<string, StoryNumber> = {}, m = x.macros, b = x.built;
  const put = (key: string, value: number, unit: string, text: string, grade: StoryNumber['grade'], sources: readonly string[], origin: StoryNumber['origin'], extra: Partial<StoryNumber> = {}) => {
    if (!Number.isFinite(value)) return;
    N[key] = { key, value, unit, text, grade, sources: [...sources], origin, itemSpecific: true, ...extra };
  };
  const kcal = Math.round(x.kcal), grams = Math.round(m.grams);
  put('kcal', kcal, 'kcal', `${fmt(kcal)} kcal`, 'A', ['usdaSR'], 'db');
  const pct = Math.round((100 * x.kcal) / DV.kcal);
  put('kcalPct', pct, '%', pct < 1 && x.kcal > 0 ? 'under 1%' : `${pct}%`, 'A', REFERENCE.kcalDay.sources, 'rule');
  if (grams > 0) put('grams', grams, 'g', `${fmt(grams)} g`, 'A', ['usdaSR'], 'db');
  const g0 = (v: number) => (v >= 10 ? Math.round(v) : r1(v));
  const sug = g0(m.sugars);
  put('sugarG', sug, 'g', `${sug} g`, 'A', ['usdaSR'], 'db', anchorText(m.sugars, ANCHORS.sugarCube) ? { anchor: anchorText(m.sugars, ANCHORS.sugarCube) } : {});
  if (m.sugars >= 2) put('sugarCubes', anchorCount(m.sugars, ANCHORS.sugarCube), 'cubes', anchorText(m.sugars, ANCHORS.sugarCube).replace('≈ ', ''), 'A', ANCHORS.sugarCube.sources, 'rule');
  put('freeSugarG', g0(m.freeSugars), 'g', `${g0(m.freeSugars)} g`, 'B', ['usdaSR', 'who2015'], 'db');
  put('carbsG', g0(m.availCarbs), 'g', `${g0(m.availCarbs)} g`, 'A', ['usdaSR'], 'db');
  put('fiberG', g0(m.fiber), 'g', `${g0(m.fiber)} g`, 'A', ['usdaSR'], 'db');
  put('proteinG', g0(m.protein), 'g', `${g0(m.protein)} g`, 'A', ['usdaSR'], 'db');
  put('fatG', g0(m.fat), 'g', `${g0(m.fat)} g`, 'A', ['usdaSR'], 'db');
  put('satFatG', g0(m.satFat), 'g', `${g0(m.satFat)} g`, 'A', ['usdaSR'], 'db');
  put('sodiumMg', Math.round(m.sodiumMg), 'mg', `${fmt(Math.round(m.sodiumMg))} mg`, 'A', ['usdaSR'], 'db');
  const dv = (key: string, v: number, ref: number) => { const q = Math.round((100 * v) / ref); put(key, q, '% DV', `${q}%`, 'A', ['fdaDV', 'usdaSR'], 'rule'); };
  dv('proteinDv', m.protein, DV.protein); dv('fiberDv', m.fiber, DV.fiber); dv('sodiumDv', m.sodiumMg, DV.sodiumMg); dv('satFatDv', m.satFat, DV.satFat);
  dv('freeSugarDv', m.freeSugars, REFERENCE.dvAddedSugars.value);
  if (x.kcal >= 5 && m.grams > 0) {
    const ed = Math.round((100 * x.kcal) / m.grams) / 100;
    put('energyDensity', ed, 'kcal/g', `${ed.toFixed(ed < 10 ? 1 : 0)} kcal/g`, 'A', ['usdaSR', 'rolls2009'], 'rule');
    const pr = r1((100 * m.protein) / x.kcal), fi = r1((100 * m.fiber) / x.kcal);
    put('proteinPer100kcal', pr, 'g/100 kcal', `${pr} g`, 'A', ['usdaSR', 'dhillon2016'], 'rule');
    put('fiberPer100kcal', fi, 'g/100 kcal', `${fi} g`, 'A', ['usdaSR', 'clark2013'], 'rule');
  }
  if (m.gi !== null && m.availCarbs >= 5) put('gi', Math.round(m.gi), 'GI', `GI ${Math.round(m.gi)}`, 'B', ['atkinson2008'], 'db');
  // water
  if (x.waterMl >= 50) put('waterMl', Math.round(x.waterMl), 'ml', `${fmt(Math.round(x.waterMl))} ml`, 'A', ['usdaSR'], 'db', anchorText(x.waterMl, ANCHORS.glass) ? { anchor: anchorText(x.waterMl, ANCHORS.glass) } : {});
  if (b.t50 !== undefined && b.t50 > 0) put('stomachHalfMin', minSaid(b.t50), 'min', minText(b.t50), 'B', ['mudie2014', 'camps2016'], 'model');
  // caffeine
  const caf = b.caffeine.doseMg;
  if (caf >= 1) {
    put('caffeineMg', Math.round(caf), 'mg', `${Math.round(caf)} mg`, 'A', ['usdaSR'], 'db', anchorText(caf, ANCHORS.espresso) ? { anchor: anchorText(caf, ANCHORS.espresso) } : {});
    put('caffeineAtBedMg', Math.round(x.caffeineAtBedMg), 'mg', `${Math.round(x.caffeineAtBedMg)} mg`, 'B', ['grzegorzewski2021', 'iom2001'], 'model');
    if (b.caffeine.halfLifeH > 0) put('caffeineHalfLifeH', r1(b.caffeine.halfLifeH), 'h', `${r1(b.caffeine.halfLifeH)} h`, 'A', ['iom2001', 'parsons1978'], 'model', { range: [1.5, 9.5], itemSpecific: false });
    if (b.caffeine.tmaxMin >= 5) put('caffeinePeakMin', b.caffeine.tmaxMin, 'min', minText(b.caffeine.tmaxMin), 'B', ['iom2001'], 'model');
    put('sleepDelayMin', Math.round(x.sleepDelayMin), 'min', `${Math.round(x.sleepDelayMin)} min`, 'C', ['gardiner2025', 'gardiner2023'], 'model');
  }
  // alcohol (never one number for blood alcohol: a range)
  const alc = b.alcoholG ?? 0;
  if (alc > 1) {
    put('alcoholG', Math.round(alc), 'g', `${Math.round(alc)} g`, 'A', ['usdaSR'], 'db', anchorText(alc, ANCHORS.stdDrink) ? { anchor: anchorText(alc, ANCHORS.stdDrink) } : {});
    put('stdDrinks', anchorCount(alc, ANCHORS.stdDrink), 'drinks', anchorText(alc, ANCHORS.stdDrink).replace('≈ ', '') || 'under ½ US standard drink', 'A', ANCHORS.stdDrink.sources, 'rule');
    if (b.bac && b.bac.length > 60) {
      const c = alcoholClock(b.bac), [lo, hi] = bacRange(c.peak);
      put('bacPeak', Math.round(c.peak * 1000) / 1000, '‰', `${lo.toFixed(2)}–${hi.toFixed(2)} ‰`, 'B', ['jones2010', 'maskell2020'], 'model', { range: [Math.round(lo * 1000) / 1000, Math.round(hi * 1000) / 1000] });
      if (c.peakMin > 0) put('bacPeakMin', c.peakMin, 'min', minText(c.peakMin), 'B', ['jones2010'], 'model');
      if (c.goneMin > 0) put('alcoholGoneMin', c.goneMin, 'min', minText(c.goneMin), 'C', ['jones2010', 'jones2016'], 'model', { range: [c.earliestMin, c.latestMin] });
    }
  }
  // blood sugar (a typical curve, ±40% between people; none when its GI is unknown)
  if (x.sugarPeak !== null) {
    const unit = p.glucoseUnit, pk = x.sugarPeak, [lo, hi] = [pk * (1 - GLUCOSE_SPREAD), pk * (1 + GLUCOSE_SPREAD)];
    const t = unit === 'mg/dL' ? `${Math.round(lo * MG_DL_PER_MMOL_L)}–${Math.round(hi * MG_DL_PER_MMOL_L)} mg/dL` : `${lo.toFixed(1)}–${hi.toFixed(1)} mmol/L`;
    put('sugarPeak', Math.round(pk * 100) / 100, 'mmol/L', t, 'C', ['brandmiller2003', 'berry2020'], 'model', { range: [Math.round(lo * 100) / 100, Math.round(hi * 100) / 100] });
    const st = x.glucose ? sugarTimes(x.glucose) : { peak: 0, peakAt: 0, backAt: -1 };
    if (pk >= 0.3 && st.peakAt >= 5) put('sugarPeakMin', st.peakAt, 'min', minText(st.peakAt), 'C', ['calvo2025'], 'model');
    if (pk >= 0.3 && st.backAt > st.peakAt) put('sugarBackMin', st.backAt, 'min', minText(st.backAt), 'C', ['brandmiller2003'], 'model');
  }
  // blood fat
  const tg = b.effects.tgMmol;
  if (tg && m.fat >= 5) { let k = 0; for (let i = 1; i < tg.length; i++) if (tg[i] > tg[k]) k = i; if (tg[k] >= 0.05 && k >= 60) put('tgPeakH', Math.round(k / 30) / 2, 'h', `${Math.round(k / 30) / 2} h`, 'C', ['berry2020'], 'model'); }
  return N;
}

/** "Estimate for a 70 kg adult" (the default body) or "… a 62 kg woman". */
export function bodyOf(p: Profile): FoodStory['body'] {
  const isDefault = p.sex === DEFAULT_PROFILE.sex && p.weightKg === DEFAULT_PROFILE.weightKg && p.heightCm === DEFAULT_PROFILE.heightCm && p.ageY === DEFAULT_PROFILE.ageY;
  return { weightKg: p.weightKg, sex: p.sex, isDefault, label: isDefault ? `a ${p.weightKg} kg adult` : `a ${Math.round(p.weightKg)} kg ${p.sex === 'female' ? 'woman' : 'man'}` };
}

/** A plain item (water, sparkling water, plain tea): too little in it for a cheat sheet of two lines. */
export const plainItem = (x: Analysis) => x.kcal < 20 && (x.built.alcoholG ?? 0) <= 1 && x.built.caffeine.doseMg < 10;

export function storyOf(x: Analysis, parts: Part[], p: Profile): FoodStory {
  const N = numbersOf(x, p), b = x.built, m = x.macros, drink = isDrink(x);
  const fi = factInOf(x), cls = arcClass(fi);
  const id = parts.length ? parts.map((q) => `${foodKey(q.food)}@${Math.round(q.grams)}`).join('+') : x.name;
  const slug = x.label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'food';
  const bedRel = minutesToBed(p), bed = hh(p.bedtimeMin);
  const alc = b.alcoholG ?? 0, caf = b.caffeine.doseMg;
  const unknownSugar = x.sugarPeak === null;

  // ---- curves (5-minute steps, so a story stays small) ----
  const curves: FoodStory['curves'] = {};
  const curve = (k: CurveKey, y: ArrayLike<number> | undefined, unit: string, scale = 1, dp = 3, thresholds: StoryCurve['thresholds'] = []) => {
    if (!y || y.length < 1441) return;
    const ys = downsample(y, scale, dp);
    if (ys.some((v) => v !== 0)) curves[k] = { step: 5, unit, y: ys, thresholds };
  };
  if (x.glucose) curve('glucose', x.glucose, 'mmol/L', 1 / MG_DL_PER_MMOL_L, 2);
  if (b.bac && alc > 1) curve('bac', b.bac, '‰', 1, 3, [{ y: 0.5, label: 'EU limit 0.05 %', source: 'euCroatia' }, { y: 0.8, label: 'US limit 0.08 %', source: 'nhtsaBac' }]);
  if (caf >= 1) curve('caffeine', b.caffeine.body, 'mg', 1, caf >= 20 ? 0 : 1);
  if (b.effects.tgMmol && m.fat >= 5) curve('tg', b.effects.tgMmol, 'mmol/L', 1, 2);

  // ---- events ----
  const events: StoryEvent[] = [];
  if (N.sugarPeakMin) events.push({ min: N.sugarPeakMin.value, key: 'peak', numberKey: 'sugarPeak', organ: 'blood' });
  if (N.sugarBackMin) events.push({ min: N.sugarBackMin.value, key: 'backToUsual', numberKey: 'sugarBackMin', organ: 'blood' });
  if (caf >= 10) {
    const body = b.caffeine.body; let k = 0;
    for (let i = 1; i < Math.min(1441, body.length); i++) if (body[i] > body[k]) k = i;
    for (let i = k; i < Math.min(1441, body.length); i++) if (body[i] <= body[k] / 2) { events.push({ min: i, key: 'halfCaffeine', numberKey: 'caffeineHalfLifeH', organ: 'liver' }); break; }
    if (bedRel <= 1440) events.push({ min: bedRel, key: 'caffeineAtBed', numberKey: 'caffeineAtBedMg', organ: 'brain' });
  }
  if (N.alcoholGoneMin && N.alcoholGoneMin.value <= 1440) events.push({ min: N.alcoholGoneMin.value, key: 'alcoholZero', numberKey: 'alcoholGoneMin', organ: 'liver' });
  if (N.tgPeakH) events.push({ min: Math.round(N.tgPeakH.value * 60), key: 'fatPeak', numberKey: 'tgPeakH', organ: 'blood' });
  if (bedRel <= 1440) events.push({ min: bedRel, key: 'bedtime' });
  events.sort((e, f) => e.min - f.min || e.key.localeCompare(f.key));

  // ---- ladders (cause → effect → so what), each effect a story number ----
  const ladders: Ladder[] = [];
  if (N.stomachHalfMin) ladders.push({ min: N.stomachHalfMin.value, organ: 'stomach', cause: drink ? 'A drink leaves your stomach fast' : 'Your stomach churns it into a paste first', effectKey: 'stomachHalfMin', soWhat: 'Half of it has moved on to your small intestine.' });
  if (N.sugarPeakMin && N.carbsG) ladders.push({ min: N.sugarPeakMin.value, organ: 'blood', cause: `Its ${N.carbsG.text} of carbs become blood sugar`, effectKey: 'sugarPeak', soWhat: 'Insulin brings it back to your usual level.' });
  if (N.caffeinePeakMin && caf >= 10) ladders.push({ min: N.caffeinePeakMin.value, organ: 'brain', cause: `${N.caffeineMg.text} of caffeine reaches your brain`, effectKey: 'caffeineMg', soWhat: 'It blocks the signal that makes you sleepy.' });
  if (N.bacPeakMin && N.bacPeak) ladders.push({ min: N.bacPeakMin.value, organ: 'liver', cause: `${N.alcoholG.text} of alcohol reaches your blood`, effectKey: 'bacPeak', soWhat: 'Reactions slow down, even before you feel it.' });
  if (N.tgPeakH) ladders.push({ min: Math.round(N.tgPeakH.value * 60), organ: 'blood', cause: `Its ${N.fatG.text} of fat arrives through the lymph`, effectKey: 'tgPeakH', soWhat: 'Blood fat peaks hours after you ate.' });
  if (caf >= 10 && bedRel <= 1440) ladders.push({ min: bedRel, organ: 'brain', cause: 'Your liver clears caffeine slowly', effectKey: 'caffeineAtBedMg', soWhat: x.sleepDelayMin >= 1 ? 'Falling asleep can take longer.' : 'Most people sleep normally with this much.' });
  if (N.alcoholGoneMin && N.alcoholGoneMin.value <= 1440) ladders.push({ min: N.alcoholGoneMin.value, organ: 'liver', cause: 'Your liver clears alcohol at a fixed speed', effectKey: 'alcoholGoneMin', soWhat: 'Nothing speeds it up: not coffee, water or sleep.' });
  ladders.sort((l1, l2) => l1.min - l2.min);

  // ---- the cheat sheet: best time · pair with · swap for ----
  const a = (kind: StoryAction['kind'], text: string, grade: StoryAction['grade'], sources: string[], deltaKey?: string): StoryAction => ({ kind, text, grade, sources: [...sources], ...(deltaKey ? { deltaKey } : {}) });
  let bestTime: StoryAction | null;
  if (alc > 1) bestTime = a('bestTime', 'Well before bed: alcohol still in your blood at bedtime makes the second half of the night lighter.', 'A', ['ebrahim2013']);
  else if (caf >= 10) {
    const late = latestForSleep(b.caffeine, p);
    bestTime = late === null || p.bedtimeMin - late <= 30 ? a('bestTime', 'Any time today: this much caffeine is too little to touch your sleep.', 'B', ['gardiner2023', 'gardiner2025'])
      : a('bestTime', `Before ${hh(late)}, so its caffeine is low by your ${bed} bedtime.`, 'B', ['gardiner2023', 'gardiner2025', 'drake2013']);
  } else bestTime = a('bestTime', caf >= 1 ? 'Any time: too little caffeine to touch your sleep.' : 'Any time: no caffeine or alcohol in it to touch your sleep.', 'B', ['drake2013', 'ebrahim2013']);
  let pairWith: StoryAction | null = null;
  if (alc > 1) pairWith = b.alcoholFed ? a('pairWith', 'This meal has food in it already, and food keeps the alcohol peak lower.', 'A', FACTORS.withMeal.sources)
    : a('pairWith', 'Have it with a meal: food keeps the alcohol peak at roughly half (40–57%).', 'A', FACTORS.withMeal.sources);
  else if (drink && m.freeSugars >= 8) pairWith = a('pairWith', TIPS.sugarDip.text, TIPS.sugarDip.level, TIPS.sugarDip.sources);
  else if (!drink && x.kcal >= 30 && (N.fiberPer100kcal?.value ?? 0) < 1.5) pairWith = a('pairWith', 'Add vegetables or whole grains: their fiber makes a meal more filling for few kcal.', 'B', ['clark2013', 'rolls2009']);
  else if (!drink && x.kcal >= 5 && (N.energyDensity?.value ?? 9) < 0.6) pairWith = a('pairWith', 'Have it first in a meal: in studies, starting with a low-energy-density food (salad, soup) meant fewer kcal at that meal.', 'B', ['rolls2009']);
  let swapFor: StoryAction | null = null;
  const base = parts.length === 1 ? parts[0].food.id : null;
  const swaps = base ? SWAPS[base] ?? [] : [];
  if (swaps.length && x.sugarPeak !== null && x.sugarPeak >= 0.5) {
    for (const s of swaps) {
      const sp = parseMeal(s);
      if (!sp.length) continue;
      const y = analyze(sp, p);
      if (y.sugarPeak !== null && y.sugarPeak <= x.sugarPeak - 0.3) {
        const u = p.glucoseUnit, v = (z: number) => (u === 'mg/dL' ? `${Math.round(z * MG_DL_PER_MMOL_L)}` : z.toFixed(1));
        swapFor = a('swapFor', y.sugarPeak < 0.3 ? `${capFirst(s)}: blood sugar barely rises (about ${v(x.sugarPeak)} ${u} with this).` : `${capFirst(s)}: blood sugar up about ${v(y.sugarPeak)} instead of ${v(x.sugarPeak)} ${u}.`, 'C', ['brandmiller2003', 'berry2020'], 'sugarPeak');
        break;
      }
    }
  }
  if (!swapFor && alc > 1 && alc >= 10) swapFor = a('swapFor', `Half the amount: ${Math.round(alc / 2)} g of alcohol instead of ${Math.round(alc)} g.`, 'A', ['usdaSR', 'niaaaStdDrink'], 'alcoholG');
  else if (!swapFor && caf >= 20) swapFor = a('swapFor', `Half the amount: ${Math.round(caf / 2)} mg of caffeine instead of ${Math.round(caf)} mg.`, 'A', ['usdaSR', 'efsa2015'], 'caffeineMg');
  else if (!swapFor && x.kcal >= 20) swapFor = a('swapFor', `Half a serving: ${Math.round(x.kcal / 2)} kcal instead of ${Math.round(x.kcal)}.`, 'A', ['usdaSR'], 'kcal');
  const actions = [bestTime, pairWith, swapFor].filter((z): z is StoryAction => !!z);

  // ---- the five axes ----
  const anchors = sleepAnchors();
  const risk = caf >= 1 ? sleepRiskAt(b.caffeine, bedRel, anchors) : { risk: 'none' as const, extra: 0 };
  const atBed = b.bac && alc > 1 ? bacAtBed(b.bac, bedRel) > 0.02 : false;
  const sIn: SleepIn = { bed, risk: risk.risk, extraMin: x.sleepDelayMin, hasCaffeine: caf >= 1, alcoholAtBed: atBed, alcoholTier: alc > 1 ? alcoholSleepTier(alc / Math.max(30, p.weightKg)) : null, hasAlcohol: alc > 1 };
  const axes: Record<AxisKey, ReturnType<typeof energyAxis>> = {
    energy: energyAxis(N), sugar: sugarAxis(N, unknownSugar), fullness: fullnessAxis(N, drink), sleep: sleepAxis(N, sIn), nutrients: nutrientsAxis(N),
  };

  const surprises = surprisesOf(N, cls, hash(id), { bed, name: x.label, unit: p.glucoseUnit });
  const unknowns = unknownsOf({ hasCurve: !!x.glucose, unknownSugar, carbsG: m.availCarbs, caffeineMg: caf, alcoholG: alc, kcal: x.kcal,
    sweetener: drink && /\b(diet|zero|light|sugar[- ]free)\b/i.test(x.label) && m.sugars < 1 }).map((u) => ({ text: u.text, grade: u.grade, sources: [...u.sources] }));

  return {
    v: 1, id, slug, name: x.label, cls, body: bodyOf(p), numbers: N, curves, events, ladders, surprises, actions, axes,
    cheat: { bestTime, pairWith, swapFor }, unknowns, safety: { alcohol: alc > 1, caffeineHigh: caf >= REFERENCE.caffeineSingle.value },
  };
}

/** The numbers line above the fold (the Story card's strip): kcal and its share of the day, then the item's most
 *  telling numbers, within `budget` characters. A part with `glue` joins the one before it with a space ("35 g sugar
 *  ≈ 9 cubes"), the others with " · ". */
export interface StripPart { key: string; n: string; t: string; glue?: boolean }
export function stripOf(s: FoodStory, budget = 50): StripPart[] {
  const N = s.numbers, groups: StripPart[][] = [];
  const g = (...ps: (StripPart | null)[]) => { const xs = ps.filter((q): q is StripPart => !!q && !!N[q.key]); if (xs.length) groups.push(xs); };
  const P = (key: string, n: string | undefined, t: string, glue = false): StripPart | null => (n ? { key, n, t, ...(glue ? { glue } : {}) } : null);
  if (N.kcal) g(P('kcal', fmt(N.kcal.value), 'kcal'));
  if ((N.kcal?.value ?? 0) >= 5 && N.kcalPct) g(P('kcalPct', N.kcalPct.text, 'of day'));
  const alc = () => { if (s.safety.alcohol && N.alcoholG) g(P('alcoholG', N.alcoholG.text, 'alcohol'), N.stdDrinks && N.stdDrinks.value >= 0.5 ? P('stdDrinks', `≈ ${N.stdDrinks.value}`.replace('.5', '½').replace('≈ 0½', '≈ ½'), N.stdDrinks.value <= 1 ? 'drink' : 'drinks', true) : null); };
  const cafe = () => { if (N.caffeineMg && N.caffeineMg.value >= 10) { g(P('caffeineMg', N.caffeineMg.text, 'caffeine')); if (s.cls === 'caffeine' && N.caffeineAtBedMg && N.caffeineAtBedMg.value >= 5) g(P('caffeineAtBedMg', N.caffeineAtBedMg.text, 'at bedtime')); } };
  const sugar = () => { if ((N.sugarG?.value ?? 0) >= 2) g(P('sugarG', N.sugarG.text, 'sugar'), N.sugarCubes && N.sugarCubes.value >= 1 ? P('sugarCubes', `≈ ${N.sugarCubes.value}`, N.sugarCubes.value === 1 ? 'cube' : 'cubes', true) : null); };
  const peak = () => { if (N.sugarPeak && N.sugarPeak.value >= 0.3 && N.sugarPeakMin) g(P('sugarPeakMin', N.sugarPeakMin.text, 'to peak')); };
  const body = () => {
    if ((N.proteinG?.value ?? 0) >= 5) g(P('proteinG', N.proteinG.text, 'protein'));
    if ((N.fiberG?.value ?? 0) >= 3) g(P('fiberG', N.fiberG.text, 'fiber'));
    if ((N.fatG?.value ?? 0) >= 5) g(P('fatG', N.fatG.text, 'fat'));
  };
  // the class decides what leads (alcohol, caffeine, sugar, or protein / fat / fiber)
  const order = s.cls === 'alcohol' ? [alc, cafe, sugar, peak, body] : s.cls === 'caffeine' ? [cafe, sugar, peak, body]
    : s.cls === 'sugar' || s.cls === 'starch' || s.cls === 'drink' ? [sugar, cafe, peak, body] : [body, sugar, cafe, peak];
  for (const f of order) f();
  if (N.waterMl) g(P('waterMl', N.waterMl.text, 'water'));
  if (N.stomachHalfMin) g(P('stomachHalfMin', N.stomachHalfMin.text, 'half out'));
  const out: StripPart[] = [];
  let len = 0;
  const w = (ps: StripPart[], first: boolean) => ps.reduce((a, q, i) => a + q.n.length + 1 + q.t.length + (i ? 1 : first ? 0 : 3), 0);
  for (const grp of groups) {
    // a group that does not fit whole may still fit without its glued part
    for (const ps of [grp, grp.slice(0, 1)]) {
      const add = w(ps, !out.length);
      if (len + add <= budget) { out.push(...ps); len += add; break; }
    }
  }
  return out;
}
/** The strip as one line of text ("139 kcal · 7% of day · 35 g sugar ≈ 9 cubes"). */
export const stripText = (ps: StripPart[]) => ps.map((q, i) => `${i ? (q.glue ? ' ' : ' · ') : ''}${q.n} ${q.t}`).join('');
