// Shared checks for the robustness fuzz tests (fuzz.test.ts, fuzzMeals.test.ts; science audit 2026-10-16): EVERY food in the database at every chip amount (½, 1, 2, 3),
// a sample of meals (2–5 items, alcohol + food, caffeine + food) and extreme bodies (40 kg / 200 kg, smoker,
// late pregnancy, the pill, 18 and 100 years, mg/dL). Nothing may produce NaN / Infinity, negative amounts,
// times outside 0–24 h, curves that never come back, or text with "NaN", "undefined" or empty strings.
import type { FoodSim } from './foodSim';
import { DEFAULT_PROFILE, type Profile } from './profile';
import type { Part } from '../v4/food/parse';
import { makeFoodProduct } from '../v4/food/foodProduct';
import { analyze } from '../v4/analyze';
import { PRODUCTS } from '../v4/products';
import { buildVitals } from './daily';
import { at } from './espressoSim';
import { sleepAnchors } from './anchors';

export const PROFILES: Record<string, Profile> = {
  default: DEFAULT_PROFILE,
  light: { ...DEFAULT_PROFILE, sex: 'female', weightKg: 40, heightCm: 150, ageY: 18 },
  heavy: { ...DEFAULT_PROFILE, sex: 'male', weightKg: 150, heightCm: 190, ageY: 60 },
  // the UI allows 35–200 kg and 130–220 cm: BMI from ≈ 7 to ≈ 118
  extremeBmiF: { ...DEFAULT_PROFILE, sex: 'female', weightKg: 200, heightCm: 130, ageY: 100 },
  extremeBmiM: { ...DEFAULT_PROFILE, sex: 'male', weightKg: 200, heightCm: 130, ageY: 100 },
  extremeThin: { ...DEFAULT_PROFILE, sex: 'male', weightKg: 35, heightCm: 220, ageY: 18 },
  smoker: { ...DEFAULT_PROFILE, smoker: true, caffeineDaily: true },
  pregnantLate: { ...DEFAULT_PROFILE, sex: 'female', weightKg: 75, heightCm: 165, latePregnancy: true, oralContraceptives: false },
  pillFed: { ...DEFAULT_PROFILE, sex: 'female', weightKg: 55, heightCm: 160, oralContraceptives: true, withMeal: true, glucoseUnit: 'mg/dL' },
  lateNight: { ...DEFAULT_PROFILE, drinkAtMin: 23 * 60 + 50, bedtimeMin: 23 * 60, wakeMin: 7 * 60 },
};

export const BAD_TEXT = /NaN|undefined|Infinity|\bnull\b|\[object/;
export const peak = (a: Float64Array) => a.reduce((m, v) => Math.max(m, v), -Infinity);
const allFinite = (a: ArrayLike<number>) => { for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) return false; return true; };
const minOf = (a: Float64Array) => a.reduce((m, v) => Math.min(m, v), Infinity);

/** Every string anywhere inside a value (objects, arrays), with the path for the error message. */
function strings(x: unknown, path = '', out: [string, string][] = []): [string, string][] {
  if (typeof x === 'string') out.push([path, x]);
  else if (Array.isArray(x)) x.forEach((v, i) => strings(v, `${path}[${i}]`, out));
  else if (x && typeof x === 'object' && !(x instanceof Float64Array)) for (const [k, v] of Object.entries(x)) if (typeof v !== 'function') strings(v, `${path}.${k}`, out);
  return out;
}
export function checkTexts(where: string, x: unknown) {
  for (const [path, s] of strings(x)) {
    if (BAD_TEXT.test(s) || (s.trim() === '' && !/\.(note|title|label)$/.test(path) && !/icon/.test(path)))
      throw new Error(`${where} ${path}: bad text "${s}"`);
  }
}

/** Numbers the model produces: finite, never negative where they are amounts, inside 0–24 h, back toward baseline. */
export function checkSim(where: string, s: FoodSim, alcoholG: number, grams: number) {
  const arrays: [string, Float64Array, boolean][] = [
    ['stomachG', s.stomachG, true], ['intestineG', s.intestineG, true], ['exitedG', s.exitedG, true],
    ['colon0', s.colonG[0], true], ['colon1', s.colonG[1], true], ['colon2', s.colonG[2], true],
    ['bodyWater', s.bodyWater, true], ['bladder', s.bladder, true], ['kcalAbsorbed', s.kcalAbsorbed, true],
    ['insulin', s.insulin, true], ['tgDelta', s.tgDelta, true], ['bac', s.bac, true], ['carbsInBlood', s.carbsInBlood, true],
    ['caffeineConc', s.caffeine.conc, true], ['caffeineBody', s.caffeine.body, true],
    ['glucoseDelta', s.glucoseDeltaMgDl, false], ['hr', s.hr, false], ['sbp', s.sbp, false],
  ];
  for (const [name, a, nonNeg] of arrays) {
    if (a.length !== 1441) throw new Error(`${where} ${name}: length ${a.length}`);
    if (!allFinite(a)) throw new Error(`${where} ${name}: not finite`);
    if (nonNeg && minOf(a) < -1e-6) throw new Error(`${where} ${name}: negative ${minOf(a)}`);
  }
  for (const [name, v] of [['t50', s.t50], ['glucosePeakMin', s.glucosePeakMin], ['caffeineTmax', s.caffeine.tmaxMin]] as const)
    if (!(v >= 0 && v <= 1440)) throw new Error(`${where} ${name} = ${v}`);
  if (!(s.glucosePeakMmol >= 0 && Number.isFinite(s.glucosePeakMmol))) throw new Error(`${where} glucose peak ${s.glucosePeakMmol}`);
  // back toward baseline by 24 h
  if (s.stomachG[1440] > 0.01 * grams + 0.01) throw new Error(`${where} stomach not empty at 24 h: ${s.stomachG[1440]}`);
  if (Math.abs(s.glucoseDeltaMgDl[1440]) > 1) throw new Error(`${where} glucose not back: ${s.glucoseDeltaMgDl[1440]}`);
  if (s.tgDelta[1440] > 0.01) throw new Error(`${where} blood fat not back: ${s.tgDelta[1440]}`);
  if (s.insulin[1440] > 0.5) throw new Error(`${where} insulin not back: ${s.insulin[1440]}`);
  const cp = peak(s.caffeine.conc); // late pregnancy (half-life ≈ 15 h) + a slow, fatty food: up to ≈ 2/3 left at 24 h
  if (s.caffeine.doseMg >= 1 && s.caffeine.conc[1440] > 0.8 * cp) throw new Error(`${where} caffeine not falling: ${s.caffeine.conc[1440]} vs ${cp}`);
  const bp = peak(s.bac);
  if (alcoholG <= 1 && bp > 1e-9) throw new Error(`${where} alcohol without alcohol`);
  if (bp > 0 && s.bac[1440] > bp) throw new Error(`${where} alcohol rising at 24 h`);
  // energy absorbed never above the label and reaches most of it
  const kAbs = s.kcalAbsorbed[1440];
  if (kAbs > s.kcal * 1.001 + 0.5) throw new Error(`${where} absorbed ${kAbs} > label ${s.kcal}`);
}

/** The whole screen for one food or meal: story chapters, changes at many minutes, organ cards, quick answers. */
export function checkScreen(where: string, parts: Part[], p: Profile, answers = true) {
  // the same product analyze() picked: the curated espresso / cola / water at one serving, else the generic food model
  const one = parts.length === 1 ? parts[0] : null;
  const curated = one && PRODUCTS[one.food.id] && Math.abs(one.grams - one.food.serving.grams) < 1;
  const def = curated ? PRODUCTS[one!.food.id] : makeFoodProduct(parts, 'food');
  const b = def.build(p, 63);
  if (answers) {
    const a = analyze(parts, p);
    checkTexts(`${where} answers`, a.answers);
    checkTexts(`${where} name`, { name: a.name });
  }
  const ch = b.story.chapters;
  if (!ch.length) throw new Error(`${where}: no chapters`);
  for (const c of ch) {
    if (!(c.min >= 0 && c.min <= 1440)) throw new Error(`${where} chapter "${c.title}" at ${c.min}`);
    if (!c.title || !c.text) throw new Error(`${where} empty chapter "${c.title}"`);
    for (const id of c.claims) if (!def.content.claims[id]) throw new Error(`${where} chapter "${c.title}": unknown claim ${id}`);
    // every number on screen has a claim (level + source) behind it
    if (/\d/.test(c.text) && !c.claims.length) throw new Error(`${where} chapter "${c.title}" shows numbers without a claim`);
  }
  checkTexts(`${where} chapters`, ch);
  // what the words say must match the numbers at that minute
  const gone = ch.find((c) => c.title === 'Alcohol gone');
  if (gone && b.bac && at(b.bac, gone.min) > 0.01) throw new Error(`${where}: "Alcohol gone" at ${gone.min} min but blood alcohol is ${at(b.bac, gone.min).toFixed(2)} g/L`);
  const cafPeak = ch.find((c) => c.title === 'Caffeine peak');
  if (cafPeak && Math.abs(cafPeak.min - b.caffeine.tmaxMin) > 1) throw new Error(`${where}: caffeine peak chapter at ${cafPeak.min}, model ${b.caffeine.tmaxMin}`);
  for (let i = 1; i < ch.length; i++) if (ch[i].min < ch[i - 1].min) throw new Error(`${where} chapters out of order`);
  const v = buildVitals(p, b.caffeine, sleepAnchors(), true, b.effects);
  for (const m of [0, 1, 5, 15, 30, 45, 60, 90, 120, 180, 240, 360, 480, 720, 960, 1200, 1439, 1440]) {
    const changes = b.story.changes(m, v, p);
    checkTexts(`${where} changes@${m}`, changes);
    for (const c of changes) if (!c.label || !c.value) throw new Error(`${where} empty change at ${m}: ${JSON.stringify(c)}`);
    const liquid = b.story.liquid(m);
    for (const [k, o] of Object.entries(liquid)) for (const [kk, val] of Object.entries(o as Record<string, number>))
      if (!Number.isFinite(val)) throw new Error(`${where} liquid ${k}.${kk} at ${m} = ${val}`);
    const fl = b.story.flows(m);
    for (const [k, val] of Object.entries(fl)) if (!Number.isFinite(val as number)) throw new Error(`${where} flow ${k} at ${m}`);
    for (const w of b.where) { const x = w.value(m); if (!Number.isFinite(x) || x < -1e-6) throw new Error(`${where} where "${w.label}" at ${m} = ${x}`); }
    for (const key of ['stomach', 'jejunum', 'colon_trans', 'pancreas', 'liver', 'heart', 'brain', 'bladder'] as const) {
      const card = def.organ(key, b, m);
      if (card) {
        checkTexts(`${where} organ ${key}@${m}`, card);
        for (const id of card.claims) if (!def.content.claims[id]) throw new Error(`${where} organ ${key}: unknown claim ${id}`);
      }
    }
  }
  const h = def.headline(ch[0].min, b, p, 0);
  checkTexts(`${where} headline`, h);
}

