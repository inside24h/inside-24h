// Game-style health bars (0–100). This is OUR simplified scale (level C), not a medical measurement.
// Starting values come from the profile; each drink moves them by a rule tied to a researched number.
// Every rule is listed in `rules` so the "How is this calculated?" panel can show it word for word.
import { WALK_NET_KCAL_PER_KG_KM } from '../science/walking';
import { simulateEspresso } from '../science/espressoSim';
import { buildVitals, minutesToBed } from '../science/daily';
import { sleepAnchors } from '../science/anchors';
import { COLA } from '../science/colaSim';
import { widmarkR } from '../science/foodSim';
import type { Profile } from '../science/profile';
import { FOOD_BY_ID, type Per100 } from './food/parse';

// Per-serving numbers come from the food database (one source; audit 2026-10-17: wine was 14.2 g here vs 15.8 g there)
const perServing = (id: string, k: keyof Per100, grams = FOOD_BY_ID[id].serving.grams) => ((FOOD_BY_ID[id].p[k] ?? 0) * grams) / 100;
const r1 = (v: number) => Math.round(v * 10) / 10;
const DB = {
  espressoCaffeine: r1(perServing('espresso', 'caffeineMg')),
  teaCaffeine: r1(perServing('green-tea', 'caffeineMg')),
  juiceFree: r1(perServing('orange-juice', 'freeSugars')),
  chocolateFree40: r1(perServing('chocolate-milk-bar', 'freeSugars', 40)),
  beerAlcohol: r1(perServing('beer', 'alcoholG')),
  // one glass (150 ml) of wine: the mean of red and white
  wineAlcohol: r1((perServing('red-wine', 'alcoholG') + perServing('white-wine', 'alcoholG')) / 2),
};

export type BarKey = 'health' | 'sleep' | 'sugar' | 'cholesterol' | 'fat' | 'life';
export interface Bar { key: BarKey; label: string; value: number; base: number; notes: string[] }
export type Counts = Record<string, number>; // product id → servings today
export type Often = 'once' | 'weekly' | 'often' | 'daily';
export type HowLong = 'weeks' | 'months' | 'years';
export interface Habit { often: Often; howLong: HowLong }
export type Habits = Record<string, Habit>;
export const OFTEN: [Often, string, number][] = [['once', 'Just today', 0], ['weekly', '1–2× a week', 1.5 / 7], ['often', '3–5× a week', 4 / 7], ['daily', 'Every day', 1]];
export const HOW_LONG: [HowLong, string, number][] = [['weeks', 'Weeks', 0.3], ['months', 'Months', 0.7], ['years', 'Years', 1]];

/** Habitual servings per day, weighted by how long the habit has lasted (level C, see RULES). */
export function habitual(counts: Counts, habits: Habits, id: string): number {
  const n = counts[id] ?? 0, h = habits[id];
  if (!n || !h) return 0;
  const freq = OFTEN.find((o) => o[0] === h.often)![2];
  const dur = HOW_LONG.find((o) => o[0] === h.howLong)![2];
  return n * freq * dur;
}

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
export const bmi = (p: Profile) => p.weightKg / (p.heightCm / 100) ** 2;
export const sleepHours = (p: Profile) => (((p.wakeMin - p.bedtimeMin) % 1440 + 1440) % 1440) / 60;

/** Sleep bar start from habitual sleep length: AASM/SRS adults need ≥ 7 h; short and long sleep both linked to
 *  higher mortality (Cappuccio 2010: RR 1.12 short, 1.30 long). Point values are our own scale (C). */
function sleepBase(h: number): number {
  if (h < 6) return 55;
  if (h < 7) return 70;
  if (h <= 9) return 90;
  if (h <= 10) return 80;
  return 70;
}

/** Starting values from the profile alone. */
function baseline(p: Profile) {
  const b = bmi(p);
  // CDC adult BMI categories [long-term R7]: healthy 18.5–24.9, overweight 25–29.9, obesity ≥ 30.
  const fat = b < 18.5 ? 75 : b < 25 ? 90 : b < 30 ? 65 : b < 35 ? 45 : 30;
  // Life quality: our simple starting point from weight category and age (C). Older age lowers it gently.
  const h = sleepHours(p);
  const sleepLife = h < 7 ? -2 : h > 9 ? -3 : 0; // Cappuccio 2010 associations, our points
  const life = clamp(fat * 0.6 + 40 - Math.max(0, p.ageY - 40) * 0.3 + sleepLife);
  return { sleep: sleepBase(h), sugar: 100, cholesterol: 85, fat, life };
}

export const RULES: { bar: string; rule: string; source: string }[] = [
  { bar: 'Fat', rule: 'Starts from your BMI: healthy (18.5–24.9) = 90, overweight = 65, obesity = 45 or less.', source: 'CDC adult BMI categories' },
  { bar: 'Fat', rule: 'Each daily can of cola: −6. A liter a day raised liver fat 132–143% in 6 months; one can is a third of that.', source: 'Maersk 2012 (RCT)' },
  { bar: 'Free sugar', rule: 'Sugar you eat or drink, not blood sugar. Starts at 100 each day = your free-sugar budget. WHO limit: under 10% of energy, about 50 g. One cola (35 g) uses 70%.', source: 'WHO 2015' },
  { bar: 'Sleep', rule: 'Starts from how long you sleep: 7–9 h = 90, 6–7 h = 70, under 6 h = 55, 9–10 h = 80, over 10 h = 70. Adults need 7 or more hours; both short and very long sleep are linked to higher death risk (short 1.12×, long 1.30×).', source: 'AASM/SRS 2015 consensus; Cappuccio 2010 meta-analysis' },
  { bar: 'Sleep', rule: 'Then minus 1 point per extra minute you need to fall asleep, from the caffeine in your blood while you fall asleep (the highest level from bedtime to 90 min after).', source: 'Gardiner 2025 (RCT), our interpolation' },
  { bar: 'Cholesterol', rule: 'We cannot know your cholesterol without a blood test, so it starts at 85 and only shows what the drinks change. Cola daily: −4 per can (+3.6% total cholesterol). Espresso: −0.5 per shot (+0.8 mg/dL).', source: 'Maersk 2012; Svatun 2022 + cafestol trials' },
  { bar: 'Life quality', rule: 'Starts from your weight category and age. Daily cola: −3 per can (+4–15% death risk, a link not proof). Coffee: +1 per shot up to 3 (−17% at 3–4 cups, a link not proof).', source: 'Wang 2022; Poole 2017' },
  { bar: 'Activity', rule: 'Compared with under 5,000 steps and no exercise. Steps 5–10k / 10k+: Life quality +3 / +4, Sugar +2 / +3, Fat +1 / +2. Exercise 1–2× / 3+× a week: Life quality +3 / +4, Sleep +2 / +4, Sugar +2 / +4, Fat +2 / +4, Cholesterol +1 / +3. Each bar has a cap so you cannot count the same benefit twice. Every +1,000 steps was linked to 15% lower death risk (levels off around 8–10k under 60).', source: 'Banach 2023; Paluch 2022; Arem 2015; exercise RCT meta-analyses (research/activity.md)' },
  { bar: 'Activity', rule: 'Kilometers walked burn about 0.5 kcal per kg body weight per km (running ≈ 1.0). For 70 kg, one cola (139 kcal) ≈ 4 km, about 48 min of brisk walking. If your weekly walking covers your cola calories, the Fat penalty for the cola habit halves. This is calorie arithmetic only: activity did not cancel the link between sugary drinks and diabetes.', source: 'ACSM metabolic equations; UK Biobank 2024' },
  { bar: 'Foods', rule: `Sugar counts only FREE sugars (WHO): orange juice ${Math.round(DB.juiceFree)} g, milk chocolate (40 g) up to ${DB.chocolateFree40} g, cola ${COLA.eu.sugarG} g. Sugar inside whole fruit (banana) does not count. Habits: pizza −1.4 and chocolate −2.9 Cholesterol per daily serving (saturated fat raises LDL 0.036 mmol/L per 1% of energy); orange juice −1 Life (+7% type-2 diabetes per daily glass); green tea +0.8 Life per cup up to 2 (association).`, source: 'WHO 2015; Clarke 1997; Imamura 2015; research/foods.md' },
  { bar: 'Cigarettes', rule: 'Today: Sleep −2 (−5 for regular smokers). Habit: Cholesterol −0.4 per cigarette a day (max −5); Life quality −4 (1–4 a day), −6 (5–9), −8 (10–19), −10 (20+). Even 1–4 a day carried about 1.5× the death risk; lifelong smokers lose about 10 years.', source: 'Zhang 2006; Craig 1989; Bjartveit 2005; Doll 2004; Jha 2013' },
  { bar: 'Alcohol', rule: `Beer 0.5 L = ${DB.beerAlcohol} g alcohol, wine 150 ml = ${DB.wineAlcohol} g (USDA: beer about 5%, table wine about 13% alcohol by volume). Sleep: alcohol still in your blood at bedtime (Widmark estimate) costs 4 points per 0.2 g/L, up to 12. Habit: Fat −0.15 per gram a day (women ×1.5, max −15); Life quality only from 25 g a day upwards (death risk +5% at 25–44 g, +19% at 45–64 g, +35% above), because below that the pooled risk was not significant. WHO: no level is risk-free.`, source: 'Zhao 2023; WHO Europe; Mitchell 2014; research/alcohol.md' },
  { bar: 'Habits', rule: 'Sugar and Sleep look at today only. Cholesterol, Fat and Life quality look at your habit: servings × how often (every day = 1, 3–5× a week = 4/7, 1–2× a week = 1.5/7, just today = 0) × how long (years = 1, months = 0.7, weeks = 0.3). The studies behind these bars ran for months (trials) or years (cohorts).', source: 'our own scaling (level C)' },
  { bar: 'Health', rule: 'The average of the other five bars.', source: 'our own scale' },
];

/** Activity points per bar, from research/activity.md "Suggested bar rules" (relative to <5k steps, no exercise). */
function activityPoints(p: Profile) {
  const s = { low: 0, mid: 1, high: 2 }[p.steps], e = { none: 0, some: 1, regular: 2 }[p.exercise];
  const weeklyKcal = WALK_NET_KCAL_PER_KG_KM * p.weightKg * p.kmPerWeek; // walking cost, net of rest, conservative [E1–E2]; same formula as the quick answer (science/walking.ts)
  const pick = (arr: number[], i: number) => arr[i];
  const chol = p.kmPerWeek > 0 ? 4 * Math.min(1, weeklyKcal / 900) : pick([0, 1, 3], e);
  return {
    sleep: Math.min(4, pick([0, 2, 4], e)),
    sugar: Math.min(6, pick([0, 2, 3], s) + pick([0, 2, 4], e)),
    cholesterol: Math.min(4, chol),
    fat: Math.min(6, pick([0, 1, 2], s) + pick([0, 2, 4], e) + 3 * Math.min(1, weeklyKcal / 1500)),
    life: Math.min(7, pick([0, 3, 4], s) + pick([0, 3, 4], e)),
    weeklyKcal,
  };
}

/** Per-serving effects of each item. today = counts for today only; habit points are multiplied by habitual servings/day.
 *  Sources: research/<item>.md (cola, espresso, cigarettes, foods). All point values are our own scale (level C). */
export interface ItemFx { name: string; max: number; freeSugarG?: number; caffeineMg?: number; chol?: number; fat?: number; life?: number; lifeCapServings?: number }
export const ITEM_FX: Record<string, ItemFx> = {
  espresso: { name: 'Espresso', max: 10, caffeineMg: DB.espressoCaffeine, chol: -0.5, life: 1, lifeCapServings: 3 },
  cola: { name: 'Cola', max: 10, freeSugarG: COLA.eu.sugarG, caffeineMg: COLA.caffeineMg, chol: -4, fat: -6, life: -3 },
  water: { name: 'Water', max: 12 },
  banana: { name: 'Banana', max: 6 }, // sugar in whole fruit is not "free sugar" (WHO) → no Sugar penalty
  bread: { name: 'White bread (2 slices)', max: 6 }, // free sugars ≤ 3.3 g, not itemised → counted as 0
  pizza: { name: 'Pizza slice', max: 8, chol: -1.4 }, // saturated fat → LDL +2.2 mg/dL per daily slice (Clarke 1997)
  chocolate: { name: 'Milk chocolate (40 g)', max: 6, freeSugarG: DB.chocolateFree40, chol: -2.9 }, // upper bound, same rule as the database
  juice: { name: 'Orange juice', max: 6, freeSugarG: DB.juiceFree, life: -1 }, // fruit juice counts as free sugar; T2D +7% per daily serving
  tea: { name: 'Green tea', max: 8, caffeineMg: DB.teaCaffeine, life: 0.8, lifeCapServings: 2 },
  cigarettes: { name: 'Cigarettes', max: 40 },
  beer: { name: 'Beer (0.5 L)', max: 10 },
  wine: { name: 'Wine (glass)', max: 10 },
};
// grams of ethanol per serving, from the database: beer 500 ml (USDA 3.9 g/100 g ≈ 5% ABV), wine 150 ml (mean of red
// 10.6 and white 10.3 g/100 g ≈ 13% ABV). Was 19.7 / 14.2 (12% ABV) here while search showed 15.8 g for a glass.
export const ETHANOL_G: Record<string, number> = { beer: DB.beerAlcohol, wine: DB.wineAlcohol };

export function healthBars(p: Profile, counts: Counts, habits: Habits = {}): Bar[] {
  const b0 = baseline(p), act = activityPoints(p);
  const base = { sleep: clamp(b0.sleep + act.sleep), sugar: b0.sugar, cholesterol: clamp(b0.cholesterol + act.cholesterol), fat: clamp(b0.fat + act.fat), life: clamp(b0.life + act.life) };
  const colaH = habitual(counts, habits, 'cola'); // long-term cola, needed for the walking offset
  const notes: Record<BarKey, string[]> = { health: [], sleep: [], sugar: [], cholesterol: [], fat: [], life: [] };
  const ids = Object.keys(ITEM_FX).filter((id) => (counts[id] ?? 0) > 0);

  // sugar: WHO free-sugar budget 50 g, today only
  const sugarG = ids.reduce((a, id) => a + (counts[id] ?? 0) * (ITEM_FX[id].freeSugarG ?? 0), 0);
  const sugar = clamp(base.sugar - (sugarG / 50) * 100);
  if (sugarG) notes.sugar.push(`${+sugarG.toFixed(1)} g free sugar = ${Math.round((sugarG / 50) * 100)}% of the WHO daily limit`);

  // sleep: total caffeine from today's drinks, taken at the profile's drink time
  const caffeineMg = ids.reduce((a, id) => a + (counts[id] ?? 0) * (ITEM_FX[id].caffeineMg ?? 0), 0);
  let sleep = base.sleep;
  if (caffeineMg > 0) {
    const sim = simulateEspresso(caffeineMg, p);
    const v = buildVitals(p, sim, sleepAnchors());
    sleep = clamp(base.sleep - v.extraLatencyMin);
    notes.sleep.push(v.sleepRisk === 'delay' ? `≈ ${Math.max(1, Math.round(v.extraLatencyMin))} min longer to fall asleep`
      : v.sleepRisk === 'sensitive' ? `${Math.round(v.mgAtBed)} mg caffeine at bedtime: most people sleep normally, sensitive people may not`
      : `${Math.round(v.mgAtBed)} mg caffeine at bedtime: too little to affect sleep`);
  }
  // cigarettes: smokers took 5.4 min longer to fall asleep and slept 14 min less (Zhang 2006) → −5 as a habit, −2 one-off
  const cig = counts.cigarettes ?? 0, cigH = habitual(counts, habits, 'cigarettes');
  if (cig) { sleep = clamp(sleep - (cigH > 0 ? 5 : 2)); notes.sleep.push('nicotine: lighter sleep, slower to fall asleep'); }

  // alcohol today → blood alcohol left at bedtime (Widmark with the same body factor r as the main screen, Forrest
  // 1986 from BMI: was a flat 0.7 men / 0.6 women here, model review 2026-10-22; elimination 0.15 g/L per hour, the
  // middle of 0.10–0.20 [AL2]; all drunk at the drink time, absorbed within the first hour) [alcohol.md]; −4 Sleep per
  // 0.2 g/L, max −12
  const alcToday = (counts.beer ?? 0) * ETHANOL_G.beer + (counts.wine ?? 0) * ETHANOL_G.wine;
  if (alcToday > 0) {
    const r = widmarkR(p);
    const hoursToBed = minutesToBed(p) / 60; // a drink after the usual bedtime = bed right after it (wave 6)
    const bacBed = Math.max(0, alcToday / (r * p.weightKg) - 0.15 * Math.max(0, hoursToBed - 1));
    if (bacBed > 0) { sleep = clamp(sleep - Math.min(12, 4 * (bacBed / 0.2))); notes.sleep.push(`≈ ${bacBed.toFixed(2)} ‰ alcohol in your blood at bedtime: worse sleep in the second half of the night`); }
    else notes.sleep.push('alcohol is likely gone by bedtime');
    notes.health.push('Alcohol: no level is risk-free (WHO)');
  }
  const gDay = habitual(counts, habits, 'beer') * ETHANOL_G.beer + habitual(counts, habits, 'wine') * ETHANOL_G.wine;

  // habit effects (cholesterol, life) per habitual serving/day
  let chol = base.cholesterol, lifeFx = 0;
  for (const id of ids) {
    const fx = ITEM_FX[id], h = habitual(counts, habits, id);
    if (!h) continue;
    if (fx.chol) chol += fx.chol * h;
    if (fx.life) lifeFx += fx.life * Math.min(h, fx.lifeCapServings ?? Infinity);
  }
  if (gDay > 0) {
    // mortality step table (pooled RR, Zhao 2023 via alcohol.md L4): < 25 g/day not significant → 0
    const rr = gDay >= 65 ? 1.35 : gDay >= 45 ? 1.19 : gDay >= 25 ? 1.05 : 1;
    lifeFx -= ((rr - 1) * 100) / 3;
    notes.life.push(rr > 1 ? `≈ ${Math.round(gDay)} g alcohol a day: ${Math.round((rr - 1) * 100)}% higher death risk` : 'no level of alcohol is risk-free; breast cancer risk rises with each daily drink (women)');
  }
  if (cigH > 0) {
    chol -= Math.min(5, 0.4 * cigH); // HDL −5.7%, TG +9.1% in smokers, dose-related (Craig 1989)
    lifeFx -= cigH >= 20 ? 10 : cigH >= 10 ? 8 : cigH >= 5 ? 6 : 4; // even 1–4/day: death risk ×1.5 (Bjartveit 2005)
    notes.cholesterol.push('smoking lowers good (HDL) cholesterol');
    notes.life.push(`smoking ≈ ${cigH >= 1 ? Math.round(cigH) : '<1'} a day: about 10 years of life lost for lifelong smokers`);
  }
  chol = clamp(chol);
  if (colaH) notes.cholesterol.push(`cola habit: about +${(3.6 * colaH).toFixed(1)}% total cholesterol`);
  const relevant = ids.filter((id) => ITEM_FX[id].chol || ITEM_FX[id].fat || ITEM_FX[id].life);
  if (relevant.length && !relevant.some((id) => habitual(counts, habits, id))) notes.cholesterol.push('one day does not change cholesterol');

  // Calories from a cola habit can be walked off: 0.5 kcal per kg per km walking [activity E1–E2] (calorie
  // arithmetic only; activity did not change the sugary-drink → diabetes link in UK Biobank).
  const colaKcalWeek = colaH * 7 * COLA.eu.kcal;
  const offset = colaKcalWeek > 0 ? Math.min(1, act.weeklyKcal / colaKcalWeek) : 0;
  // alcohol and the liver: −0.15 per habitual g/day (women ×1.5), max −15 [alcohol.md, placeholder size, direction from cirrhosis risk]
  const alcFat = Math.min(15, 0.15 * gDay * (p.sex === 'female' ? 1.5 : 1));
  const fat = clamp(base.fat - colaH * 6 * (1 - 0.5 * offset) - alcFat);
  if (alcFat) notes.fat.push('regular alcohol strains the liver');
  if (colaH) notes.fat.push(`liver fat up to ≈ +${Math.round(45 * colaH)}% with this habit`);
  if (colaH && offset > 0) notes.fat.push(`your walking burns ${Math.round(offset * 100)}% of those cola calories`);

  const life = clamp(base.life + lifeFx);
  if (colaH) notes.life.push('regular sugary drinks: linked to shorter life');
  if (habitual(counts, habits, 'espresso')) notes.life.push('regular coffee: linked to longer life (not proof)');

  const health = clamp((sleep + sugar + chol + fat + life) / 5);
  const baseHealth = clamp((base.sleep + base.sugar + base.cholesterol + base.fat + base.life) / 5);
  return [
    { key: 'health', label: 'Health', value: health, base: baseHealth, notes: notes.health },
    { key: 'sleep', label: 'Sleep', value: sleep, base: base.sleep, notes: [`${+sleepHours(p).toFixed(1)} h a night`, ...notes.sleep] },
    { key: 'sugar', label: 'Free sugar', value: sugar, base: base.sugar, notes: notes.sugar },
    { key: 'cholesterol', label: 'Cholesterol', value: chol, base: base.cholesterol, notes: notes.cholesterol },
    { key: 'fat', label: 'Fat', value: fat, base: base.fat, notes: [`BMI ${bmi(p).toFixed(1)}`, ...notes.fat] },
    { key: 'life', label: 'Life quality', value: life, base: base.life, notes: notes.life },
  ];
}
