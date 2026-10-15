// Plain-language wording for MEALS: the meal as a whole, and which item drives each effect
// ("the cola's sugar hits first; the burger's fat and protein slow it down"). Numbers come from science/foodSim.ts.
// Used by foodProduct.ts (story chapters) and meant for the quick answers (Answers.tsx → mealAnswerLines).
import { FOOD_MODEL, type FoodSim, type Meal, type MealItem } from '../../science/foodSim';
import type { Chapter } from '../stories';
import type { Part } from './parse';

const r0 = (v: number) => Math.round(v);
const lc = (s: string) => s.toLowerCase();
/** "the cola", "the burger": short everyday names for the sentences. */
export function itemNoun(name: string): string {
  const n = lc(name).replace(/\s*\(.*\)$/, '').split(' / ')[0].trim();
  const map: Record<string, string> = { hamburger: 'burger', 'french fries': 'fries' };
  return map[n] ?? n.replace(/^(white|whole|plain|semi-skimmed)\s+/, '');
}
const the = (name: string) => `the ${itemNoun(name)}`;
const poss = (name: string) => { const n = the(name); return /s$/.test(n) ? `${n}’` : `${n}’s`; };
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** Item that slows the rest the most through its fat and protein (≥ 5 g), with a word for what does it. */
function slower(items: MealItem[], exclude: number): { name: string; what: string } | null {
  const c = items.map((x, i) => ({ x, i, w: FOOD_MODEL.blunt.proteinPerG * x.protein + FOOD_MODEL.blunt.fatPerG * x.fat }))
    .filter((o) => o.i !== exclude && (o.x.fat >= 5 || o.x.protein >= 5)).sort((a, b) => b.w - a.w)[0];
  if (!c) return null;
  const what = c.x.fat >= 5 && c.x.protein >= 5 ? 'fat and protein' : c.x.fat >= 5 ? 'fat' : 'protein';
  return { name: c.x.name, what };
}

/** Single-food peak of one item on an empty stomach (same formula as foodSim for one food). */
const alonePeak = (x: MealItem) => ((x.gl ?? 0) <= 0 ? 0 : FOOD_MODEL.glucosePmax * (1 - Math.exp(-(x.gl ?? 0) / FOOD_MODEL.glucoseG0)) * FOOD_MODEL.kindFactor[x.kind]);

/** "The cola’s sugar hits first; the burger’s fat and protein slow it down (its own peak ≈ 35% lower than alone)." */
export function mealSugarNote(s: FoodSim, meal: Meal): string {
  const items = meal.items ?? [], gi = s.meal?.items ?? [];
  if (items.length < 2 || !gi.length) return '';
  const big = Math.max(...gi.map((g) => g.peakMmol));
  const main = gi.filter((g) => g.peakMmol >= 0.25 * big).sort((a, b) => a.peakMin - b.peakMin);
  if (!main.length) return '';
  const first = main[0];
  const sl = slower(items, first.index);
  // compare the whole meal with its main sugar source on an empty stomach
  const alone = alonePeak(items[first.index]);
  const diff = alone > 0 ? r0(100 * (s.glucosePeakMmol / alone - 1)) : 0;
  const lead = main.length > 1 ? `${poss(first.name)} sugar hits first, then ${list(main.slice(1).map((g) => the(g.name)))}` : `Most of the sugar comes from ${the(first.name)}`;
  const slow = sl ? `; ${poss(sl.name)} ${sl.what} slow${sl.what.includes(' and ') ? '' : 's'} it down` : '';
  const cmp = diff <= -10 ? ` Your peak is about ${-diff}% lower than after ${the(first.name)} alone${meal.availCarbs > 1.1 * items[first.index].availCarbs ? ', although the meal has more carbohydrate' : ''}.`
    : diff >= 10 ? ` Your peak is about ${diff}% higher than after ${the(first.name)} alone: there is more carbohydrate in total.` : '';
  return cap(`${lead}${slow}.${cmp}`);
}
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** The stomach chapter for a meal: two speeds. */
export function mealStomachText(s: FoodSim, parts: Part[]): string {
  const ph = s.meal?.phases;
  if (!ph?.drink || !ph.food) return `Everything is mixed into one paste: half of the meal has moved on after about ${s.t50} minutes.`;
  const drinks = list(ph.drink.items.map((i) => the(parts[i].food.name)));
  const foods = list(ph.food.items.map((i) => the(parts[i].food.name)));
  const slowed = ph.drink.t50 > ph.drink.aloneT50 + 1;
  return `Two speeds: ${drinks} runs ahead along the stomach wall, half gone in about ${r0(ph.drink.t50)} minutes${slowed ? ` (on an empty stomach ${r0(ph.drink.aloneT50)})` : ''}. ${foods[0].toUpperCase()}${foods.slice(1)} ${ph.food.items.length > 1 ? 'are' : 'is'} churned into a paste and let out slowly: half after about ${r0(s.meal!.foodT50)} minutes.`;
}

/** Caffeine with food peaks later. */
export function mealCaffeineNote(s: FoodSim): string {
  const a = s.meal?.caffeineTmaxAloneMin;
  if (!s.meal?.caffeineInDrink || a == null) return '';
  const d = s.caffeine.tmaxMin - a;
  return d >= 10 ? ` With food the caffeine arrives later: about ${r0(d)} minutes later than on an empty stomach, but just as much in total.` : '';
}

/** Short lines for the quick answers ("Your meal at a glance"). Answers.tsx can show these when foodParts.length > 1. */
export function mealAnswerLines(s: FoodSim, meal: Meal, parts: Part[]): string[] {
  if (parts.length < 2) return [];
  const out: string[] = [];
  const sugar = mealSugarNote(s, meal);
  if (sugar) out.push(sugar);
  const ph = s.meal?.phases;
  if (ph?.drink && ph.food) out.push(`Drink first, food later: half of the drink is out of your stomach in ≈ ${r0(ph.drink.t50)} min, half of the food in ≈ ${r0(s.meal!.foodT50)} min.`);
  if (meal.alcoholG > 1 && meal.fed) out.push('Eating with the alcohol: the peak is lower and later (roughly half of an empty stomach), but it is not zero. Don’t drive.');
  const caf = mealCaffeineNote(s).trim();
  if (caf) out.push(caf);
  return out;
}

/** Extra chapters only a meal has (inserted by foodProduct.ts). */
export function mealChapters(s: FoodSim, parts: Part[]): Chapter[] {
  const ph = s.meal?.phases;
  if (!ph?.drink || !ph.food) return [];
  return [{ min: Math.max(2, Math.round(ph.drink.t50)), title: 'The drink is ahead', focus: 'duodenum', claims: ['ML1', 'ML2', 'ML3', 'ML4'],
    text: `Half of ${list(ph.drink.items.map((i) => the(parts[i].food.name)))} has already left your stomach; most of ${list(ph.food.items.map((i) => the(parts[i].food.name)))} is still waiting there.` }];
}

/** "drink" note for the organ card. */
export const mealDrinkNote = (s: FoodSim) => (s.meal?.phases.drink ? `The drink part leaves first (half in ≈ ${r0(s.meal.phases.drink.t50)} min), the food part later (half in ≈ ${r0(s.meal.foodT50)} min).` : '');
