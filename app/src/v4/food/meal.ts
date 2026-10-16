// MEALS: several things eaten together (burger + fries + cola) followed as ONE 24 h story.
// Pure helpers for the meal builder (chips, "+ add"), the deep-link code and the popular presets.
// Science: science/foodSim.ts (two-phase stomach, per-item sugar curves); evidence: research/meals.md.
import { ALCOHOL_DRINKS, alcoholClass, type Meal, type MealItem } from '../../science/foodSim';
import { FOOD_BY_ID, gramsPart, macros, servingPart, type Food, type Macros, type Part } from './parse';

/** More than ~5 things stops being "a meal" on a phone screen. */
export const MAX_ITEMS = 5;
/** Amount steps on each chip, in servings of that food. */
export const ITEM_STEPS = [0.5, 1, 2, 3] as const;

export const shortName = (f: Food) => f.name.replace(/\s*\(.*\)$/, '');

/** Drinks leave the stomach with the liquid phase. Coffee drinks stored as "semi" (milk foam) count as drinks. */
export const isDrink = (f: Food) => f.kind === 'liquid' || (f.kind === 'semi' && /coffee|cappuccino|latte|shake|smoothie|kefir|buttermilk/.test(f.id));

/** The per-item macros the meal model needs. */
export function mealItems(parts: Part[]): MealItem[] {
  return parts.map((p) => {
    const m = macros([p]);
    return {
      name: shortName(p.food), kind: p.food.kind, drink: isDrink(p.food), grams: p.grams, kcal: m.kcal, availCarbs: m.availCarbs, fiber: m.fiber,
      fat: m.fat, protein: m.protein, waterG: m.waterG, caffeineMg: m.caffeineMg, alcoholG: m.alcoholG, gl: m.gl,
    };
  });
}

export function mealKind(parts: Part[]): Meal['kind'] {
  if (parts.every((p) => p.food.kind === 'liquid')) return 'liquid';
  return parts.some((p) => p.food.kind === 'solid') ? 'solid' : 'semi';
}

/** Parts → the model input. Two or more parts also carry `items` (the meal model). */
export function toMeal(parts: Part[], m: Macros = macros(parts)): Meal {
  const kind = mealKind(parts);
  // g alcohol per 100 g of the strongest drink: with two drinks the faster class is used (the higher peak, C)
  const abv = parts.reduce((m, p) => Math.max(m, p.food.p.alcoholG ?? 0), 0);
  // [AL1, alcohol.md A9–A10] Mitchell 2014: beer 62, wine 54, spirits 36 min to the peak → class rates and F
  const cls = abv > 0 ? ALCOHOL_DRINKS[alcoholClass(abv)] : undefined;
  const alcoholKa = cls?.ka, alcoholF = cls?.F;
  // with food: ≥ 100 kcal of something that is not a drink in the same meal [alcohol A2, PF1]
  const fed = parts.some((p) => !isDrink(p.food) && ((p.food.p.kcal ?? 0) * p.grams) / 100 >= 100);
  return { ...m, kind, alcoholKa, alcoholF, fed, ...(parts.length > 1 ? { items: mealItems(parts) } : {}) };
}

/** Servings of this part (1 = one USDA/typical serving). */
export const servingsOf = (p: Part) => p.grams / Math.max(1e-9, p.food.serving.grams);
/** The chip step this part sits on, or null when it was typed as a weight that is not a step (e.g. "200 g rice"). */
export function stepOf(p: Part): number | null {
  const s = servingsOf(p);
  return ITEM_STEPS.find((x) => Math.abs(x - s) * p.food.serving.grams < 1) ?? null;
}

/** Add to the meal (same food again → one more serving of it); never more than MAX_ITEMS things. */
export function addParts(meal: Part[], add: Part[]): Part[] {
  const out = [...meal];
  for (const a of add) {
    const i = out.findIndex((p) => p.food.id === a.food.id);
    if (i >= 0) { const n = Math.min(3, servingsOf(out[i]) + servingsOf(a)); out[i] = stepOrGrams(out[i].food, n); continue; }
    if (out.length >= MAX_ITEMS) break;
    out.push(a);
  }
  return out;
}
export const removePart = (meal: Part[], i: number): Part[] => meal.filter((_, j) => j !== i);
export const setServings = (meal: Part[], i: number, n: number): Part[] => meal.map((p, j) => (j === i ? servingPart(p.food, n) : p));
const stepOrGrams = (f: Food, n: number) => (ITEM_STEPS as readonly number[]).includes(n) ? servingPart(f, n) : gramsPart(f, n * f.serving.grams);

// ---- deep-link code: "hamburger fries*2 cola" (servings) or "rice-white*200g" (grams). Space-separated, so it reads
// as "m=hamburger+fries*2+cola" in the address bar. Unknown ids are skipped, so a link never breaks the app.
export function mealCode(parts: Part[]): string {
  return parts.map((p) => {
    const s = servingsOf(p), q = Math.round(s * 4) / 4;
    if (Math.abs(s - q) * p.food.serving.grams < 0.5 && q > 0) return q === 1 ? p.food.id : `${p.food.id}*${q}`;
    return `${p.food.id}*${Math.round(p.grams)}g`;
  }).join(' ');
}
export function mealFromCode(code: string | null | undefined): Part[] {
  if (!code) return [];
  const out: Part[] = [];
  for (const tok of code.trim().split(/[\s+,]+/).filter(Boolean)) {
    const m = /^([a-z0-9-]+)(?:\*(\d+(?:\.\d+)?)(g)?)?$/.exec(tok.toLowerCase());
    const f = m && Object.prototype.hasOwnProperty.call(FOOD_BY_ID, m[1]) ? FOOD_BY_ID[m[1]] : undefined; // never Object.prototype keys
    if (!m || !f) continue;
    const v = m[2] === undefined ? 1 : Number(m[2]);
    if (!(v > 0) || v > (m[3] ? 5000 : 10)) continue;
    out.push(m[3] ? gramsPart(f, v) : stepOrGrams(f, v));
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

// ---- popular meals (amounts: USDA servings; "typical size" where parse.ts marks it) ----
export interface Preset { id: string; name: string; sub: string; code: string }
export const PRESETS: Preset[] = [
  { id: 'burger', name: 'Burger + fries + cola', sub: 'fast-food lunch', code: 'hamburger fries*2 cola' },
  { id: 'coffee-croissant', name: 'Coffee + croissant', sub: 'café breakfast', code: 'cappuccino croissant' },
  { id: 'beer-cevapi', name: 'Beer + ćevapi + bread', sub: 'a night out', code: 'beer cevapi*2 bread-white*2' },
  { id: 'oat-breakfast', name: 'Oatmeal + banana + milk', sub: 'breakfast', code: 'oatmeal banana milk-semi-skimmed' },
  { id: 'pizza-beer', name: 'Pizza + beer', sub: '2 slices and a pint', code: 'pizza*2 beer' },
  { id: 'burek-yogurt', name: 'Burek + yogurt', sub: 'bakery breakfast', code: 'burek yogurt-plain' },
  { id: 'eggs-toast-oj', name: 'Eggs + toast + orange juice', sub: 'breakfast', code: 'egg-fried*2 bread-white*2 orange-juice' },
  { id: 'wine-cheese', name: 'Red wine + cheese', sub: 'evening', code: 'red-wine cheese-gouda*2' },
  { id: 'movie', name: 'Popcorn + cola', sub: 'at the movies', code: 'popcorn*3 cola' },
];
export const presetParts = (p: Preset) => mealFromCode(p.code);
