// Turns whatever the person typed ("1 banana", "pizza and a beer") into a full product for the screen:
// guided story, liquid in each organ, plain-language changes, organ cards and traffic lights.
// Model: science/foodSim.ts (level C on top of published numbers); claims: content/food.ts.
import { at } from '../../science/espressoSim';
import { alcoholSleepSentence, alcoholSleepTier, caffeineAlsoSentence, minutesToBed, sleepRiskAt, sleepSentence } from '../../science/daily';
import { sleepAnchors } from '../../science/anchors';
import { simulateFood, type FoodSim, type Meal } from '../../science/foodSim';
import { formatGlucose, formatGlucoseRise, type Profile } from '../../science/profile';
import { bacRangeText, GLUCOSE_SPREAD } from '../../science/ranges';
import { FOOD_CLAIMS } from '../../content/food';
import { ESPRESSO } from '../../content/espresso';
import type { OrganKey, Product, Stage } from '../../content/types';
import { BLOOD_SITES, GUT_SITES, ROUTE_GUT_TO_BODY } from '../../scene/Flow';
import type { Built, ProductDef, WhereRow } from '../products';
import type { Change, Chapter, Dir, LiquidMap, Story } from '../stories';
import { macros, mixColor, type Macros, type Part } from './parse';
import { mealKind, toMeal } from './meal';
import { MEAL_CLAIMS } from '../../content/mealClaims';
import { mealCaffeineNote, mealChapters, mealDrinkNote, mealStomachText, mealSugarNote } from './mealWords';
import { foodRoute } from '../routes';
import volumesJson from '../../assets/organ-volumes.json';

const STOMACH_ML = (volumesJson as Record<string, number>).stomach * 1000;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const peakOf = (a: Float64Array) => a.reduce((m, x) => Math.max(m, x), 1e-9);
const dirOf = (d: number, eps: number): Dir => (d > eps ? 'up' : d < -eps ? 'down' : 'same');
const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(Math.floor(min) % 60).padStart(2, '0')}`;
const r0 = (v: number) => Math.round(v);
const r1 = (v: number) => (Math.round(v * 10) / 10).toString();
function rate(a: Float64Array) { let max = 1e-9; for (let i = 0; i + 1 < a.length; i++) max = Math.max(max, a[i] - a[i + 1]); return (m: number) => Math.max(0, at(a, m) - at(a, m + 1)) / max; }
function inflow(a: Float64Array) { let max = 1e-9; for (let i = 0; i + 1 < a.length; i++) max = Math.max(max, a[i + 1] - a[i]); return (m: number) => Math.max(0, at(a, m + 1) - at(a, m)) / max; }

export { mealKind, toMeal }; // moved to ./meal.ts (pure, testable without the 3D scene)

export function describe(parts: Part[]): string {
  return parts.map((p) => `${p.food.name.replace(/\s*\(.*\)$/, '')}`).join(' + ');
}

export function makeFoodProduct(parts: Part[], id: string): ProductDef {
  const m = macros(parts);
  const meal = toMeal(parts, m);
  const name = describe(parts);
  const serving = parts.map((p) => p.amountLabel).join(' + ');
  const color = mixColor(parts);
  const isDrink = meal.kind === 'liquid';
  const noun = parts.length > 1 ? 'meal' : isDrink ? 'drink' : 'food';
  const cache = new WeakMap<Built, FoodSim>();
  const unitOf = new WeakMap<Built, Profile['glucoseUnit']>(); // the unit picked in "Your body", for organ panels

  const build = (p: Profile): Built => {
    const s = simulateFood(meal, p);
    const story = foodStory(s, meal, m, p, color, isDrink, parts);
    const g = (label: string, a: Float64Array, cls: string, organ: string, max: number): WhereRow => ({ label, value: (t) => at(a, t), unit: 'g', max, cls, organ });
    const colon = (t: number) => s.colonG.reduce((acc, c) => acc + at(c, t), 0);
    // MEAL with a drink and food: two coloured streams, so the drink visibly leaves the stomach first [ML1–ML4]
    const mix = s.meal?.phases.drink && s.meal.phases.food ? s.meal : null;
    const dColor = mix ? mixColor(mix.phases.drink!.items.map((i) => parts[i])) : color;
    const fColor = mix ? mixColor(mix.phases.food!.items.map((i) => parts[i])) : color;
    const foodIntestine = mix ? s.intestineG.map((v, i) => Math.max(0, v - mix.drinkIntestineG[i])) : s.intestineG;
    const built: Built = {
      caffeine: s.caffeine,
      layers: mix ? [
        { id: 'drink', n: Math.max(120, Math.round(900 * mix.phases.drink!.grams / meal.grams)), total: mix.phases.drink!.grams, states: [
          { amount: mix.drinkStomachG, sites: [['stomach', 1]], color: dColor },
          { amount: mix.drinkIntestineG, sites: GUT_SITES, via: ['duodenum'], color: dColor },
        ] },
        { id: 'food', n: Math.max(120, Math.round(900 * mix.phases.food!.grams / meal.grams)), total: mix.phases.food!.grams + s.residueG, states: [
          { amount: mix.foodStomachG, sites: [['stomach', 1]], color: fColor },
          { amount: foodIntestine, sites: GUT_SITES, via: ['duodenum'], color: fColor },
          { amount: s.carbsInBlood, sites: BLOOD_SITES, via: ROUTE_GUT_TO_BODY, color: '#9fe7ff' },
          { amount: s.colonG[0], sites: [['cecum', 0.4], ['colon_asc', 0.6]], via: ['ileum'], color: fColor },
          { amount: s.colonG[1], sites: [['colon_trans', 0.6], ['colon_desc', 0.4]], color: fColor },
          { amount: s.colonG[2], sites: [['colon_desc', 0.4], ['rectum', 0.6]], color: fColor },
        ] },
      ] : [{
        id: 'food', n: 900, total: meal.grams, states: [
          { amount: s.stomachG, sites: [['stomach', 1]], color },
          { amount: s.intestineG, sites: GUT_SITES, via: ['duodenum'], color },
          { amount: s.carbsInBlood, sites: BLOOD_SITES, via: ROUTE_GUT_TO_BODY, color: '#9fe7ff' },
          { amount: s.colonG[0], sites: [['cecum', 0.4], ['colon_asc', 0.6]], via: ['ileum'], color },
          { amount: s.colonG[1], sites: [['colon_trans', 0.6], ['colon_desc', 0.4]], color },
          { amount: s.colonG[2], sites: [['colon_desc', 0.4], ['rectum', 0.6]], color },
        ],
      }],
      effects: { hr: s.hr, glucoseMgDl: s.glucoseDeltaMgDl, bp: s.sbp, bpScale: meal.caffeineMg > 1 ? 1 : 0 },
      where: [
        g('In the stomach', s.stomachG, 'caf', 'stomach', meal.grams),
        g('In the small intestine', s.intestineG, 'caf', 'jejunum', meal.grams),
        ...(s.residueG > 0.3 ? [{ label: 'Fiber in the large intestine', value: colon, unit: 'g', max: s.residueG, cls: 'met', organ: 'colon_trans' } as WhereRow] : []),
        { label: 'Energy in your blood so far', value: (t) => at(s.kcalAbsorbed, t), unit: 'kcal', max: Math.max(1, meal.kcal), cls: 'glu', organ: 'heart' },
      ],
      legend: mix
        ? [{ color: dColor, label: mix.phases.drink!.items.map((i) => describe([parts[i]])).join(' + ').toLowerCase() }, { color: fColor, label: mix.phases.food!.items.map((i) => describe([parts[i]])).join(' + ').toLowerCase() }, { color: '#9fe7ff', label: 'sugar in blood' }]
        : [{ color, label: name.toLowerCase() }, { color: '#9fe7ff', label: 'sugar in blood' }],
      dotNote: `1 dot ≈ ${(meal.grams / 900).toFixed(2)} g`,
      insulin: s.glucosePeakMmol > 0.05 ? s.insulin : undefined,
      energy: { total: r0(meal.kcal), absorbed: (t) => at(s.kcalAbsorbed, t) },
      journey: [
        { label: 'Stomach', organ: 'stomach', amount: (t) => at(s.stomachG, t) },
        { label: 'Intestine', organ: 'jejunum', amount: (t) => at(s.intestineG, t) },
        { label: 'Blood', organ: 'heart', amount: (t) => inflow(s.kcalAbsorbed)(t) * meal.grams * 0.2 },
        ...(s.residueG > 0.3 ? [{ label: 'Large intestine', organ: 'colon_trans', amount: colon }] : []),
        ...(meal.waterG > 50 ? [{ label: 'Bladder', organ: 'bladder', amount: (t: number) => at(s.bladder, t) }] : []),
      ],
      journeyUnit: 'g',
      story,
      route: foodRoute(s, meal.grams, meal.waterG, isDrink, meal.alcoholG > 1),
      t50: s.t50,
      traits: { drink: isDrink, fat: m.fat >= 10, sugar: m.sugars >= 10, alcohol: meal.alcoholG > 1, caffeine: meal.caffeineMg >= 10, fibre: m.fiber >= 1 },
      bac: meal.alcoholG > 1 ? s.bac : undefined,
      alcoholG: meal.alcoholG > 1 ? meal.alcoholG : undefined,
      waterMl: meal.waterG,
    };
    cache.set(built, s); unitOf.set(built, p.glucoseUnit);
    return built;
  };

  // detailed-mode stages = the story chapters (built once for the default profile, timing barely depends on it)
  const content: Product = { id, name, serving, claims: { ...ESPRESSO.claims, ...FOOD_CLAIMS, ...MEAL_CLAIMS }, stages: [] }; // espresso claims: caffeine peak and half-life (D2, M4)
  const def: ProductDef = {
    id, content, hasDose: false,
    vitalClaims: { caffeine: ['DB1'], hr: meal.alcoholG > 1 ? ['AL5'] : ['GL4'], bp: meal.alcoholG > 1 ? ['AL5'] : ['DB1'], glucose: ['DB3', 'GL1', 'GL4'], spo2: ['DB1'] },
    build: (p) => {
      const b = build(p);
      content.stages = b.story.chapters.map((c): Stage => ({ min: c.min, title: c.title, organs: c.focus ? [c.focus as OrganKey] : [], claims: c.claims }));
      return b;
    },
    headline: (stageMin, b) => {
      const c = b.story.chapters.find((x) => x.min === stageMin) ?? b.story.chapters[0];
      return { label: c.title, text: c.text, claims: c.claims };
    },
    organ: (key, b, t) => {
      const s = cache.get(b);
      if (!s) return null;
      const grams = (v: number) => `${v < 10 ? r1(v) : r0(v)} g`;
      switch (key) {
        case 'stomach': return s.meal?.phases.drink && s.meal.phases.food
          ? { name: 'Stomach', claims: ['GE1', 'ML1', 'ML2', 'ML3'], text: mealDrinkNote(s), lines: [{ label: 'Drink still here', value: grams(at(s.meal.drinkStomachG, t)) }, { label: 'Food still here', value: grams(at(s.meal.foodStomachG, t)) }] }
          : { name: 'Stomach', claims: ['GE1', 'GE12'], text: `Half of this ${noun} has left your stomach after about ${s.t50} minutes.`, lines: [{ label: 'Still here', value: grams(at(s.stomachG, t)) }] };
        case 'duodenum': case 'jejunum': case 'ileum': return { name: 'Small intestine', claims: ['SI10', 'TE1'], text: 'Here sugars, protein and fat are taken apart and absorbed into your blood and lymph. Fiber passes through untouched.', lines: [{ label: 'Being digested here', value: grams(at(s.intestineG, t)) }, { label: 'Energy absorbed so far', value: `${r0(at(s.kcalAbsorbed, t))} kcal` }] };
        case 'cecum': case 'colon_asc': case 'colon_trans': case 'colon_desc': case 'rectum': return { name: 'Large intestine', claims: ['SI10', 'CO1', 'CO3'], text: 'Fiber and leftovers arrive here. Bacteria ferment part of it while water is taken back. The trip through takes about 1–2 days.', lines: [{ label: 'Fiber here now', value: grams(s.colonG.reduce((a, c) => a + at(c, t), 0)) }, { label: 'Already out', value: grams(at(s.exitedG, t)) }] };
        case 'pancreas': return { name: 'Pancreas', claims: ['GL1', 'GL4'], text: 'It answers sugar in your blood with insulin.', lines: [{ label: 'Insulin above baseline', value: `+${r0(at(s.insulin, t))} mU/L` }] };
        case 'liver': case 'portal_vein': return meal.alcoholG > 1
          ? { name: 'Liver', claims: ['AL2'], text: 'Your liver removes alcohol at a fixed speed. Nothing speeds it up.', lines: [{ label: 'Blood alcohol now', value: bacRangeText(at(s.bac, t)) }] }
          : { name: 'Liver', claims: ['TE1'], text: 'Blood from the gut passes the liver first: it stores sugar and sorts what you absorbed.', lines: [{ label: 'Energy absorbed so far', value: `${r0(at(s.kcalAbsorbed, t))} kcal` }] };
        case 'heart': case 'aorta': case 'vena_cava': return { name: 'Heart and blood', claims: meal.alcoholG > 1 ? ['AL5'] : ['GL4', 'TG1'], text: 'Everything you absorb travels in your blood.', lines: [{ label: 'Blood sugar change', value: (() => { const u = unitOf.get(b) ?? 'mmol/L', d = at(s.glucoseDeltaMgDl, t); return u === 'mg/dL' ? `${d >= 0.5 ? '+' : ''}${Math.round(d)} mg/dL` : `${d >= 0.05 ? '+' : ''}${(d / 18.016).toFixed(1)} mmol/L`; })() }, ...(meal.fat >= 5 ? [{ label: 'Blood fat change', value: `+${at(s.tgDelta, t).toFixed(2)} mmol/L` }] : [])] };
        case 'brain': return meal.alcoholG > 1
          ? { name: 'Brain', claims: ['AL3', 'AL4'], text: 'Alcohol reaches your brain with the blood: from 0.2 ‰ your attention is already worse.', lines: [{ label: 'Blood alcohol now', value: bacRangeText(at(s.bac, t)) }] }
          : { name: 'Brain', claims: ['FC1'], text: 'Your brain runs on glucose. After a big meal many people feel sleepy for a while.', lines: [] };
        case 'kidney_l': case 'kidney_r': case 'bladder': return { name: 'Kidneys and bladder', claims: meal.alcoholG > 1 ? ['WK1', 'AL7'] : ['WK1'], text: 'Extra water leaves through your kidneys within a few hours.', lines: [{ label: 'In the bladder from this', value: `${r0(at(s.bladder, t))} ml` }] };
        default: return null;
      }
    },
  };
  return def;
}

function foodStory(s: FoodSim, meal: Meal, m: Macros, p: Profile, color: string, isDrink: boolean, parts: Part[]): Story {
  const toBed = minutesToBed(p);
  // had it at or after the usual bedtime: bed right after (wave 7: "at bedtime" too, else there was no bed chapter)
  const afterBed = toBed === 0;
  const isMeal = parts.length > 1;
  const noun = isMeal ? 'meal' : isDrink ? 'drink' : 'food';
  const mixed = !!(s.meal?.phases.drink && s.meal.phases.food);
  const g = (mgdl: number) => `${formatGlucose(mgdl, p.glucoseUnit)} ${p.glucoseUnit}`;
  const sugarTsp = r0(m.sugars / 4); // 1 teaspoon of sugar ≈ 4 g
  const bacPeak = peakOf(s.bac), bacPeakMin = s.bac.indexOf(bacPeak);
  const kcalR = inflow(s.kcalAbsorbed), emptyR = rate(s.stomachG), kidneyR = inflow(s.bladder);
  const colonIn = inflow(s.colonG[0]);
  const peakBloodCarb = peakOf(s.carbsInBlood), peakIns = peakOf(s.insulin), peakCaf = peakOf(s.caffeine.conc);
  const colonMax = Math.max(1e-9, ...s.colonG.map(peakOf));
  const cecumMin = s.colonG[0].indexOf(peakOf(s.colonG[0]));
  const hasFibre = s.residueG >= 0.5;
  const gl = m.gl;
  let dipMin = -1; { let lo = 0; for (let t = 0; t < 400; t++) { if (s.glucoseDeltaMgDl[t] < lo) { lo = s.glucoseDeltaMgDl[t]; dipMin = t; } } if (lo > -5) dipMin = -1; }

  // "10 fries" + "french fries" → "10 french fries"; "1 sandwich" + "hamburger" → "1 hamburger" (no doubled words)
  const amountWith = (amount: string, name: string) => {
    const m = /^(\S+) (\S+)$/.exec(amount);
    if (m && (name.split(' ').pop() === m[2] || /^(sandwich|piece|item|serving|portion)s?$/.test(m[2]))) return `${m[1]} ${name}`;
    return `${amount} ${name}`;
  };
  const what = parts.map((x) => amountWith(x.amountLabel, x.food.name.replace(/\s*\(.*\)$/, '').toLowerCase())).join(' + ');
  const macroLine = `${r0(meal.kcal)} kcal: ${r0(m.carbs)} g carbohydrate${m.sugars >= 1 ? ` (${r0(m.sugars)} g sugar${sugarTsp >= 1 ? `, about ${sugarTsp} teaspoon${sugarTsp > 1 ? 's' : ''}` : ''})` : ''}, ${r0(m.fat)} g fat, ${r0(m.protein)} g protein${m.fiber >= 1 ? `, ${r0(m.fiber)} g fiber` : ''}.`;
  const giLine = m.gi !== null && m.availCarbs >= 5 ? ` Glycemic index ${m.gi} (${m.gi >= 70 ? 'high' : m.gi >= 56 ? 'medium' : 'low'}).`
    : m.missingGi.length && gl !== null ? ` The glycemic index of ${m.missingGi.join(', ').toLowerCase()} has not been measured, so the sugar curve leaves it out: the real rise is likely higher.`
    : m.missingGi.length ? ' Its glycemic index has not been measured, so we don’t draw a sugar curve.' : '';
  const ch: Chapter[] = [
    { min: 0, title: mixed ? 'First bite and sip' : isDrink ? 'First sip' : 'First bite', focus: 'tongue', claims: ['DB1', 'DB2', 'DB3'], text: `${(what[0] ?? '').toUpperCase()}${what.slice(1)}. ${macroLine}${giLine}` },
    { min: 0.3, title: 'Down the food pipe', focus: 'esophagus', claims: [], text: isDrink ? 'It runs down your food pipe into your stomach.' : 'You chew and swallow, and it slides down your food pipe into your stomach.' },
    { min: 1, title: 'In your stomach', focus: 'stomach', claims: mixed ? ['ML1', 'ML2', 'ML3', 'GE5', ...(m.fat >= 15 ? ['GE15'] : [])] : isDrink ? ['GE12'] : ['GE1', 'GE4', 'GE5', ...(m.fiber >= 3 ? ['GE13'] : []), ...(m.fat >= 15 ? ['GE15'] : [])],
      text: mixed ? mealStomachText(s, parts) : isDrink
        ? `Half of it leaves your stomach within about ${s.t50} minutes${meal.kcal > 30 ? ': calories slow the stomach down (water would be gone in about 13)' : ''}.`
        : `Your stomach churns it into a paste and lets it out slowly: half has moved on after about ${s.t50} minutes, almost all of it by 4 hours.${m.fat >= 15 ? ' The fat leaves last.' : ''}` },
    { min: isDrink ? 6 : 25, title: 'Into the small intestine', focus: 'jejunum', claims: ['SI10', 'TE1'],
      text: (() => {
        const steps = [m.availCarbs >= 2 && 'starch and sugar become glucose', m.protein >= 3 && 'protein becomes amino acids', m.fat >= 3 && 'fat is split with bile from your gallbladder'].filter(Boolean);
        const what = [meal.caffeineMg >= 10 && 'caffeine', meal.alcoholG > 1 && 'alcohol', meal.waterG >= 50 && 'water'].filter(Boolean).join(' and ');
        return steps.length
          ? `In the small intestine it is taken apart: ${steps.join(', ')}. These pass into your blood.${hasFibre ? ' Fiber goes on undigested.' : ''}`
          : `Your small intestine absorbs the ${what || 'drink'} into your blood within minutes.`;
      })() },
  ];
  if (gl !== null && s.glucosePeakMmol >= 0.2) {
    const big = s.glucosePeakMmol >= 1.5;
    const who = isMeal ? mealSugarNote(s, meal) : '';
    ch.push({ min: r0(s.glucosePeakMin), title: big ? 'Blood sugar peak' : 'Sugar rises', focus: 'pancreas', claims: isMeal ? ['GL1', 'GL4', 'ML5', 'ML7'] : ['GL1', 'GL4'], text: `${who ? `${who} ` : ''}Your blood sugar goes from ${g(p.glucoseMgDl)} to about ${formatGlucoseRise(p.glucoseMgDl, s.glucosePeakMmol * 18.016 * (1 - GLUCOSE_SPREAD), p.glucoseUnit)}–${formatGlucoseRise(p.glucoseMgDl, s.glucosePeakMmol * 18.016 * (1 + GLUCOSE_SPREAD), p.glucoseUnit)} ${p.glucoseUnit} (a typical response, not personalized). Your pancreas releases insulin to bring it back down.${big ? '' : ' A gentle rise.'}` });
  }
  if (dipMin > 0) ch.push({ min: dipMin, title: 'The sugar dip', focus: 'brain', claims: ['GL7'], text: 'Your blood sugar drops a little below where you started. Many people feel hungry again around now.' });
  if (meal.alcoholG > 1) {
    // a range, never one number or a "safe" time: Widmark estimates are off by 20–40% [AL3, alcohol.md W6]
    const drive = (b: number) => (b >= 0.5 ? 'Reaction time and balance are worse. Don’t drive.' : b >= 0.2 ? 'Attention is already worse. Don’t drive.' : 'Low, but not zero. Don’t drive.'); // [AL4]
    const fedNote = meal.fed ? ', lower than on an empty stomach' : '';
    // `live`: the number follows the clock with the same formatter as the label on the body (routes.ts), so both always match
    ch.push({ min: bacPeakMin, title: 'Alcohol peak', focus: 'brain', claims: ['AL1', 'AL3', 'AL4'], text: `Blood alcohol is at its highest now: about ${bacRangeText(bacPeak)}${fedNote}. ${drive(bacPeak)}`,
      live: (t) => {
        const b = at(s.bac, t);
        return t - bacPeakMin < 5 ? `Blood alcohol is at its highest now: about ${bacRangeText(b)}${fedNote}. ${drive(b)}`
          : `Blood alcohol is now about ${bacRangeText(b)}, slowly coming down from its peak${fedNote}. ${drive(b)}`;
      } });
    let zero = bacPeakMin; while (zero < 1440 && s.bac[zero] > 0.005) zero++;
    // a very large amount is not gone within the 24 h we show: say so instead of "gone" (audit 2026-10-16)
    if (s.bac[zero] > 0.005) ch.push({ min: 1440, title: 'Still alcohol after 24 h', focus: 'liver', claims: ['AL2'], text: `A day later there is still alcohol in your blood (about ${bacRangeText(s.bac[zero])}). Your liver works at a fixed speed: coffee, water or fresh air don’t speed it up. Don’t drive.` });
    else ch.push({ min: zero, title: 'Alcohol gone', focus: 'liver', claims: ['AL2'], text: 'In a typical body the alcohol is gone by now, but some people need hours longer. Your liver works at a fixed speed: coffee, water or fresh air don’t speed it up. This app can’t tell you when you’re safe to drive.' });
  }
  const nutrientKcal = meal.kcal - 7 * meal.alcoholG; // calories slow the stomach, so caffeine peaks later [GE12, C]
  if (meal.caffeineMg >= 10) ch.push({ min: r0(s.caffeine.tmaxMin), title: 'Caffeine peak', focus: 'brain', claims: s.meal?.caffeineInDrink ? ['DB1', 'D2', 'ML3'] : nutrientKcal > 30 ? ['DB1', 'D2', 'GE12'] : ['DB1', 'D2'], text: `About ${r0(meal.caffeineMg)} mg of caffeine reaches your brain and blocks the tiredness signal a little.${mealCaffeineNote(s)}` });
  if (meal.kcal >= 500) ch.push({ min: 90, title: 'Sleepy after eating', focus: 'brain', claims: ['FC1'], text: 'A big meal: many people feel sleepy about 1.5 hours later, whatever the meal was.' });
  if (m.protein >= 10) ch.push({ min: 150, title: 'Building blocks', focus: 'heart', claims: ['AA1', 'TE1'], text: `The ${r0(m.protein)} g of protein arrive in your blood as amino acids, peaking about now. Your body spends about a quarter of protein’s calories just digesting it.` });
  if (m.fat >= 10) ch.push({ min: 210, title: 'Fat in your blood', focus: 'heart', claims: ['TG1'], text: `The fat travels through your lymph into the blood. Blood fat (triglycerides) is highest around now, roughly +${(s.tgDelta[210]).toFixed(1)} mmol/L, and falls again over the next few hours.` });
  // [AL7] was measured with lager only (Maughan 2016): wine and spirits don't get the beer sentence (audit 2026-10-16)
  const beerOnly = meal.alcoholG > 1 && parts.every((x) => (x.food.p.alcoholG ?? 0) === 0 || (x.food.p.alcoholG ?? 0) < 6);
  if (meal.waterG >= 100) ch.push({ min: 120, title: 'Kidneys', focus: 'bladder', claims: beerOnly ? ['WK1', 'AL7'] : ['WK1'], text: `The extra water (${r0(meal.waterG)} ml) is filtered by your kidneys into your bladder over the next few hours.${beerOnly ? ' A beer does not make you lose more water than you drank.' : ''}` });
  if (hasFibre) {
    ch.push({ min: cecumMin, title: 'Into the large intestine', focus: 'cecum', claims: ['SI10', 'SI7'], text: `What you can’t digest, ${r1(s.residueG)} g of fiber, reaches the start of your large intestine. Your gut bacteria start fermenting it.` });
    ch.push({ min: 720, title: 'Through the colon', focus: 'colon_trans', claims: ['CO3'], text: 'The leftovers creep along your large intestine while water is taken back. This is the slowest part of the journey.' });
    ch.push({ min: 1440, title: '24 hours later', focus: 'colon_desc', claims: ['CO1', 'CO3'], text: `${r0((100 * s.exitedG[1440]) / s.residueG)}% has left your body so far. Food typically takes about 29 hours from mouth to toilet (the middle value); anywhere from 14 to 58 hours is normal.` });
  }
  if (afterBed || (toBed > 0 && toBed < 1440)) { // wave 7: also 1–30 min before bed (e.g. wine at 22:45)
    // after the usual bedtime: the chapter sits 30 min after the drink ("going to bed"), judged from lights-out now
    const chMin = afterBed ? 30 : toBed;
    const caf = at(s.caffeine.body, chMin), bac = at(s.bac, chMin);
    // dose-aware (science/daily.ts): direction AL6 (A), size AL8 (B)
    const tier = alcoholSleepTier(meal.alcoholG / Math.max(30, p.weightKg));
    const sl = sleepRiskAt(s.caffeine, toBed, sleepAnchors());
    // alcohol leads; caffeine above its own threshold adds one sentence (wave 7, same words as the sleep answer)
    const alcoholMsg = (b: number) => `There is still alcohol in your blood (about ${bacRangeText(b)}). ${alcoholSleepSentence(tier)}${caffeineAlsoSentence(sl.risk, sl.extra)}`;
    const msg = bac > 0.02 ? alcoholMsg(bac) : caf >= 20 ? `About ${r0(caf)} mg of caffeine is still in you ${afterBed ? 'as you go to bed' : `at ${hhmm(p.bedtimeMin)}`}. ${sleepSentence(sl.risk, sl.extra)}` : null;
    if (msg) ch.push({ min: chMin, title: afterBed ? 'Going to bed' : 'Bedtime', focus: 'brain', claims: bac > 0.02 ? ['AL6', 'AL8'] : ['DB1', 'M4', 'VS1', 'VS2', 'VS3', 'VS4'], text: msg,
      ...(bac > 0.02 ? { live: (t: number) => (at(s.bac, t) > 0.02 ? alcoholMsg(at(s.bac, t)) : msg) } : {}) });
  }
  ch.push(...mealChapters(s, parts));
  ch.sort((a, b) => a.min - b.min);

  const toLiquid = (t: number): LiquidMap => {
    const inGut = at(s.intestineG, t) / Math.max(1, meal.grams);
    const blood = Math.max(peakBloodCarb > 0.5 ? at(s.carbsInBlood, t) / peakBloodCarb : 0, bacPeak > 0.01 ? at(s.bac, t) / bacPeak : 0, kcalR(t));
    const col = (k: number) => clamp01(1.4 * at(s.colonG[k], t) / colonMax);
    return {
      tongue: { tint: t < 0.4 ? 1 : 0 }, esophagus: { tint: t < 0.8 ? 1 - t : 0 },
      stomach: { fill: clamp01((35 + at(s.stomachG, t)) / STOMACH_ML) },
      duodenum: { tint: 3 * inGut }, jejunum: { tint: 2.4 * inGut }, ileum: { tint: 1.2 * inGut + 0.8 * clamp01(at(s.intestineG, t) > 0.5 && t > 200 ? 0.5 : 0) },
      portal_vein: { tint: 2 * kcalR(t) }, gallbladder: { tint: m.fat >= 3 ? 0.6 * kcalR(t) : 0 },
      heart: { tint: 0.8 * blood }, aorta: { tint: 0.8 * blood }, vena_cava: { tint: 0.6 * blood },
      liver: { tint: bacPeak > 0.01 ? at(s.bac, t) / bacPeak : 0.7 * kcalR(t) },
      pancreas: { tint: peakIns > 1 ? at(s.insulin, t) / peakIns : 0 },
      brain: { tint: Math.max(meal.caffeineMg >= 10 ? 0.6 * at(s.caffeine.conc, t) / peakCaf : 0, bacPeak > 0.01 ? at(s.bac, t) / bacPeak : 0) },
      cecum: { tint: col(0) }, colon_asc: { tint: col(0) }, colon_trans: { tint: col(1) }, colon_desc: { tint: Math.max(col(1) * 0.6, col(2)) }, rectum: { tint: col(2) },
      kidney_l: { tint: 0.8 * kidneyR(t) }, kidney_r: { tint: 0.8 * kidneyR(t) },
      bladder: { fill: clamp01((at(s.bladder, t) - at(s.bladder, Math.max(0, t - 180))) / 400) }, // emptied every few hours (C)
    };
  };

  return {
    color,
    chapters: ch,
    toKidneys: meal.waterG >= 100,
    liquid: toLiquid,
    flows: (t) => ({ swallow: t < 0.8 ? 1 : 0, empty: emptyR(t), absorb: kcalR(t), blood: 0.6 * Math.max(kcalR(t), bacPeak > 0.01 ? at(s.bac, t) / bacPeak : 0), kidney: kidneyR(t), colon: hasFibre ? Math.max(colonIn(t), clamp01(2 * at(s.colonG[1], t) / colonMax) * 0.5) : 0 }),
    changes: (t, v, p2) => {
      const out: Change[] = [];
      if (gl !== null && m.availCarbs >= 2) {
        const dG = at(s.glucoseDeltaMgDl, t) / 18.016, ins = at(s.insulin, t);
        out.push({ label: 'Blood sugar', dir: dirOf(dG, 0.1), value: g(at(v.glucose, t)), note: dG > 1.5 ? 'big rise' : dG > 0.1 ? 'gently up' : dG < -0.1 ? 'dip: hunger may come back' : t < 10 ? 'not changed yet' : 'normal' });
        out.push({ label: 'Insulin', dir: ins > 2 ? 'up' : 'same', value: ins > 2 ? `+${r0(ins)} mU/L` : 'normal', note: ins > 2 ? 'pancreas clearing the sugar' : 'resting' });
      }
      out.push({ label: `Energy from this ${noun}`, dir: at(s.kcalAbsorbed, t) > 1 ? 'up' : 'same', value: `${r0(at(s.kcalAbsorbed, t))} / ${r0(meal.kcal)} kcal`, note: 'reached your body so far' });
      if (meal.alcoholG > 1) { const b = at(s.bac, t); out.push({ label: 'Blood alcohol', dir: b > 0.01 ? 'up' : 'same', value: b > 0.01 ? bacRangeText(b) : '0', note: b >= 0.2 ? 'attention worse: don’t drive' : b > 0.01 ? 'low, not zero: don’t drive' : 'none' }); }
      if (meal.caffeineMg >= 10) { const mg = at(s.caffeine.body, t); out.push({ label: 'Caffeine', dir: mg > 3 ? 'up' : 'same', value: `${r0(mg)} mg`, note: mg >= 75 ? 'clear boost' : mg >= 10 ? 'mild lift' : 'almost gone' }); }
      if (m.fat >= 5) { const tg = at(s.tgDelta, t); out.push({ label: 'Blood fat', dir: tg > 0.05 ? 'up' : 'same', value: tg > 0.05 ? `+${tg.toFixed(2)} mmol/L` : 'normal', note: tg > 0.05 ? 'fat from the meal' : t < 120 ? 'arrives in 2–4 h' : 'back to normal' }); }
      if (hasFibre) { const c = s.colonG.reduce((a, x) => a + at(x, t), 0); out.push({ label: 'Fiber in your large intestine', dir: c > 0.1 ? 'up' : 'same', value: `${r1(c)} g`, note: c > 0.1 ? 'feeding your gut bacteria' : t < 200 ? 'still on its way' : 'mostly passed' }); }
      const dHr = at(v.effect.hr, t), dBp = at(v.effect.sbp, t);
      out.push({ label: 'Pulse', dir: dirOf(dHr, 0.5), value: `${r0(at(v.hr, t))} bpm`, note: Math.abs(dHr) >= 0.5 ? `${dHr > 0 ? '+' : ''}${dHr.toFixed(0)} from this ${noun}` : `unchanged by this ${noun}` });
      out.push({ label: 'Blood pressure', dir: dirOf(dBp, 0.5), value: `${r0(at(v.sbp, t))}/${r0(at(v.dbp, t))}`, note: Math.abs(dBp) >= 0.5 ? `${dBp > 0 ? '+' : ''}${dBp.toFixed(1)} mmHg` : `unchanged by this ${noun}` });
      void p2;
      return out;
    },
  };
}
