// Understands what people type: "1 jabuka", "2 kriške kruha", "pola pizze", "500 ml mlijeka", "kava s mlijekom",
// "pizza and a cola". Returns the foods with their amount in grams and the macros, computed from USDA SR Legacy
// (per 100 g) and GI from Atkinson 2008 (Table 1). Portion words without a USDA weight use OUR assumed sizes,
// marked `assumed`, so the screen can say so.
import raw from './fooddb.json';

export interface Per100 {
  kcal: number; carbs: number | null; sugars: number | null; freeSugars: number | null; fiber: number | null; fat: number | null;
  satFat: number | null; protein: number | null; sodiumMg: number | null; caffeineMg: number | null; alcoholG: number | null; waterG: number | null;
}
export interface Food {
  id: string; name: string; aliases: string[]; kind: 'liquid' | 'semi' | 'solid';
  serving: { label: string; grams: number }; p: Per100; gi: number | null; color: string; proxy: boolean; recipe: boolean; fdc: number | null;
  assumedServing?: boolean;
}
// A few USDA portions are odd for everyday use (a 139 g "slice" of baguette, 1/9 of a frozen pizza, a cup of seeds).
// These get a typical serving instead, marked `assumedServing` so the screen says "typical size" (level C).
const SERVING_FIX: Record<string, { label: string; grams: number }> = {
  'bread-french': { label: '1 slice', grams: 30 },
  pizza: { label: '1 slice', grams: 107 }, // one slice of a 14-inch pizza, about 1/8
  'sunflower-seeds': { label: '1 handful', grams: 30 },
  muesli: { label: '1 bowl', grams: 60 },
  'dried-apricots': { label: '1 handful', grams: 40 },
  'dried-figs': { label: '1 handful', grams: 40 },
  'chocolate-dark': { label: '4 squares', grams: 40 },
  'cheese-cottage': { label: '1/2 cup', grams: 105 },
  burek: { label: '1 piece', grams: 200 }, // a bakery piece of burek is far larger than the USDA turnover
};
// GI added from Atkinson 2008 Supplementary Table A1 (healthy subjects) — research/gi-additions.md. Only foods with
// one value for the same food; ranges and "nearest food only" (pizza, burek, croissant…) stay unmeasured. Beer (66 in
// the table) is left out on purpose: alcohol changes how the liver handles glucose, so a GL curve would mislead.
const GI_ADD: Record<string, number> = {
  doughnut: 75, 'cake-sponge': 46, hamburger: 66, grapes: 59, cherries: 63, kiwi: 58, strawberries: 40,
  melon: 65, peas: 51, 'beans-white': 31, hummus: 6,
};
export const FOODS: Food[] = (raw as Food[]).map((f) => {
  const g = f.gi === null && GI_ADD[f.id] !== undefined ? { ...f, gi: GI_ADD[f.id] } : f;
  return SERVING_FIX[g.id] ? { ...g, serving: SERVING_FIX[g.id], assumedServing: true } : g;
});
export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]));

export interface Part { food: Food; grams: number; amountLabel: string; assumed: boolean }
export interface Macros {
  grams: number; kcal: number; carbs: number; availCarbs: number; sugars: number; fiber: number; fat: number; protein: number;
  waterG: number; caffeineMg: number; alcoholG: number; sodiumMg: number;
  /** Glycaemic load = Σ GI × available carbs / 100 over the parts with a measured GI; null when none of the
   *  carbohydrate has one. `missingGi` names parts left out, so the real load is at least this. */
  gl: number | null; gi: number | null; missingGi: string[];
}

export const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, jedan: 1, jedna: 1, jedno: 1, jednu: 1, jednog: 1, two: 2, dva: 2, dvije: 2, dvi: 2, three: 3, tri: 3,
  four: 4, cetiri: 4, five: 5, pet: 5, six: 6, sest: 6, half: 0.5, pola: 0.5, polovica: 0.5, polovicu: 0.5, quarter: 0.25, cetvrt: 0.25,
};
// Measures that are a weight or volume
const MASS: [RegExp, number][] = [[/^(g|gr|gram|grama|grams|grami)$/, 1], [/^(kg|kila|kilo)$/, 1000], [/^(dag|deka)$/, 10]];
const VOLUME: [RegExp, number][] = [[/^(ml|mililitara|mililitra)$/, 1], [/^(dl|decilitar|decilitra|deci)$/, 100], [/^(cl)$/, 10], [/^(l|lit|litra|litre|litru|liter|liters|litres)$/, 1000]];
// Household portions: our own typical sizes (assumed), in ml for drinks
const PORTION_ML: [RegExp, number][] = [
  [/^(casa|case|casu|glass|glasses)$/, 250], [/^(salica|salice|salicu|cup|cups|soljica|soljicu)$/, 200], [/^(limenka|limenke|limenku|can|cans)$/, 330],
  [/^(boca|boce|bocu|bottle|bottles)$/, 500], [/^(krigla|kriglu|pint)$/, 500], [/^(shot|cuga|cugu|casica|casicu)$/, 30],
];
// Pieces: use the USDA serving weight (one piece / slice / serving)
const PIECE = /^(kom|komad|komada|komadic|piece|pieces|kriska|kriske|krisku|slice|slices|porcija|porcije|porciju|serving|servings|tanjur|tanjura|plate|zlica|zlice|zlicu|tbsp|zlicica|zlicice|tsp)$/;
const SPOON: [RegExp, number][] = [[/^(zlica|zlice|zlicu|tbsp)$/, 15], [/^(zlicica|zlicice|tsp)$/, 5]];
const FILLER = new Set(['a', 'an', 'of','od', 'the', 'some', 'malo', 'my', 'moja', 'moj', 'i', 'and', 'with', 's', 'sa', 'uz', 'plus', 'x']);

function stemMatch(a: string, b: string): number {
  // whole-word similarity tolerant of Croatian endings: mlijeko/mlijeka/mlijekom, kruh/kruha, riza/rize
  if (a === b) return 1;
  const n = Math.min(a.length, b.length);
  let k = 0; while (k < n && a[k] === b[k]) k++;
  if (k >= 3 && k >= Math.max(a.length, b.length) - 3 && k >= Math.min(a.length, b.length) - 1) return 0.85;
  return 0;
}

/** How well a text (already folded, no numbers) names this food. 0 = not at all. */
export function matchScore(text: string, food: Food): number {
  if (!text) return 0;
  const words = text.split(' ').filter((w) => !FILLER.has(w));
  if (!words.length) return 0;
  let best = 0;
  for (const alias of [food.name, food.id.replace(/-/g, ' '), ...food.aliases].map(fold)) {
    if (alias === text) return 10;
    if (alias.startsWith(text) && text.length >= 2) best = Math.max(best, 6 + text.length / alias.length);
    const aw = alias.replace(/[()/,]/g, ' ').split(' ').filter(Boolean);
    let hit = 0;
    for (const w of words) {
      let h = 0;
      for (const x of aw) h = Math.max(h, stemMatch(w, x), x.startsWith(w) && w.length >= 3 ? 0.7 : 0);
      hit += h;
    }
    const cover = hit / Math.max(words.length, aw.length); // reward matching ALL words of a short alias
    if (hit >= words.length * 0.7) best = Math.max(best, 2 + 4 * cover);
  }
  return best;
}

function bestFoods(text: string, n = 8): { food: Food; score: number }[] {
  return FOODS.map((food) => ({ food, score: matchScore(text, food) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || FOODS.indexOf(a.food) - FOODS.indexOf(b.food)) // ties: the database lists the everyday choice first
    .slice(0, n);
}

/** Display only: the serving label in metric, without USDA's inch measurements ("1 medium (3" dia)" → "1 medium",
 *  "3 oz" → "85 g", "1 can 8.4 fl oz" → "1 can (250 ml)"). The raw label stays in the data (and in mlPerGram). */
export function servingText(f: Food): string {
  let t = f.serving.label;
  t = t.replace(/\s*\d+ servings per [\d.]+ oz package/, '');            // "1 serving 9 servings per 24 oz package"
  t = t.replace(/of [\d.]+ oz cake/, 'of a cake');                       // "1 piece (1/12 of 16 oz cake)"
  t = t.replace(/\s*\(1 NLEA serving\)/, '').replace(/^1 NLEA serving$/, '1 serving'); // US label jargon
  t = t.replace(/^1 serving (\d.*)$/, '$1').replace(/\bTBSP\b/, 'tbsp').replace(/^1\/2 /, '½ '); // "1 serving 2 TBSP" → "2 tbsp"
  t = t.replace(/\s*\([^)]*(?:"|\bdia\b)[^)]*\)/g, '');               // "(3\" dia)", "(7\" to 7-7/8\" long)"
  t = t.replace(/\s(\d+(?:\.\d+)?) fl oz$/, (_m, x) => ` (${Math.round((Number(x) * 29.5735) / 5) * 5} ml)`);
  t = t.replace(/(\d+(?:\.\d+)?) fl oz/g, (_m, x) => `${Math.round((Number(x) * 29.5735) / 5) * 5} ml`);
  const ozCount = (t.match(/\d+(?:\.\d+)? oz\b/g) ?? []).length;
  t = t.replace(/(\d+(?:\.\d+)?) oz\b/g, (_m, x) => `${ozCount === 1 ? Math.round(f.serving.grams) : Math.round(Number(x) * 28.35)} g`);
  return t.trim();
}

const mlPerGram = (f: Food) => {
  const m = /([\d.]+)\s*ml/.exec(f.serving.label);
  return m ? Number(m[1]) / f.serving.grams : 1 / 1.03; // most drinks are close to water
};

interface Qty { count: number | null; grams?: number; ml?: number; portionMl?: number; piece?: boolean; spoonMl?: number; label?: string }

/** Pull the amount out of one segment: returns what is left (the food words) and the quantity. */
function readQty(seg: string): { rest: string; q: Qty } {
  const toks = seg.replace(/(\d)([a-z])/g, '$1 $2').replace(/,(\d)/g, '.$1').split(' ').filter(Boolean);
  const q: Qty = { count: null };
  const rest: string[] = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    const num = /^\d+(\.\d+)?$/.test(t) ? Number(t) : Object.prototype.hasOwnProperty.call(NUMBER_WORDS, t) ? NUMBER_WORDS[t] : undefined;
    if (num !== undefined && q.count === null) { q.count = num; continue; }
    const mass = MASS.find(([r]) => r.test(t)); if (mass) { q.grams = (q.count ?? 1) * mass[1]; q.label = `${q.count ?? 1} ${t}`; q.count = null; continue; }
    const vol = VOLUME.find(([r]) => r.test(t)); if (vol) { q.ml = (q.count ?? 1) * vol[1]; q.label = `${q.count ?? 1} ${t}`; q.count = null; continue; }
    const por = PORTION_ML.find(([r]) => r.test(t)); if (por) { q.portionMl = por[1]; q.label = t; continue; }
    const sp = SPOON.find(([r]) => r.test(t)); if (sp) { q.spoonMl = sp[1]; q.label = t; continue; }
    if (PIECE.test(t)) { q.piece = true; q.label = t; continue; }
    rest.push(t);
  }
  return { rest: rest.join(' '), q };
}

function toPart(food: Food, q: Qty): Part {
  const n = q.count ?? 1;
  const nice = (g: number) => Math.round(g);
  if (q.grams !== undefined) return { food, grams: q.grams, amountLabel: `${nice(q.grams)} g`, assumed: false };
  if (q.ml !== undefined) return { food, grams: q.ml / mlPerGram(food), amountLabel: `${nice(q.ml)} ml`, assumed: false };
  if (q.portionMl !== undefined) return { food, grams: (n * q.portionMl) / mlPerGram(food), amountLabel: `${n === 1 ? '1' : n} × ${q.label} (≈ ${q.portionMl} ml)`, assumed: true };
  if (q.spoonMl !== undefined) {
    const servMl = food.serving.label.match(/tbsp|tablespoon/) ? 15 : food.serving.label.match(/tsp|teaspoon/) ? 5 : null;
    const g = servMl ? (food.serving.grams * q.spoonMl) / servMl : q.spoonMl / mlPerGram(food);
    return { food, grams: n * g, amountLabel: `${n} × ${q.label}`, assumed: !servMl };
  }
  return { food, grams: n * food.serving.grams, amountLabel: n === 1 ? servingText(food) : /^1 /.test(servingText(food)) ? `${n} ${servingText(food).slice(2)}` : `${n} × ${servingText(food)}`, assumed: !!food.assumedServing };
}

const SPLIT = / (?:s|sa|i|and|with|uz|plus|\+) |,|\+|;/;

/** Best reading of the whole text. Tries the full phrase first (so "kava s mlijekom" stays one drink). */
export function parseMeal(input: string): Part[] {
  const text = fold(input);
  if (!text) return [];
  const whole = readQty(text);
  const top = bestFoods(whole.rest, 1)[0];
  if (top && top.score >= 8) return [toPart(top.food, whole.q)];
  const parts: Part[] = [];
  for (const seg of text.split(SPLIT).map((s) => s.trim()).filter(Boolean)) {
    const { rest, q } = readQty(seg);
    const f = bestFoods(rest, 1)[0];
    if (f && f.score >= 2.5) parts.push(toPart(f.food, q));
  }
  if (!parts.length && top && top.score >= 2.5) return [toPart(top.food, whole.q)];
  return parts;
}

export interface Suggestion { parts: Part[]; text: string }
/** Suggestions for the dropdown: the full reading first, then other foods that match the last thing typed. */
export function suggest(input: string, n = 7): Suggestion[] {
  const text = fold(input);
  if (!text) return POPULAR.map((t) => ({ text: t, parts: parseMeal(t) }));
  const main = parseMeal(input);
  const segs = text.split(SPLIT);
  const last = readQty(segs[segs.length - 1].trim());
  const head = main.length > 1 ? main.slice(0, -1) : [];
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  const push = (parts: Part[]) => {
    const key = parts.map((p) => `${p.food.id}:${Math.round(p.grams)}`).join('+');
    if (!parts.length || seen.has(key)) return;
    seen.add(key); out.push({ parts, text: parts.map((p) => p.food.name).join(' + ') });
  };
  push(main);
  for (const { food } of bestFoods(last.rest || text, n * 2)) push([...head, toPart(food, last.q)]);
  return out.slice(0, n);
}

export const POPULAR = ['1 can of cola', 'espresso', 'glass of water', '1 apple', 'banana', 'slice of pizza', 'coffee with milk', 'beer', 'red wine', 'white bread', 'orange juice', 'milk chocolate'];

export function macros(parts: Part[]): Macros {
  const sum = (f: (p: Per100) => number | null) => parts.reduce((s, x) => s + ((f(x.food.p) ?? 0) * x.grams) / 100, 0);
  const avail = (p: Per100) => Math.max(0, (p.carbs ?? 0) - (p.fiber ?? 0));
  let glSum = 0, knownCarbs = 0;
  const missingGi: string[] = [];
  for (const x of parts) {
    const c = (avail(x.food.p) * x.grams) / 100;
    if (c < 3) continue; // under 3 g of available carbs: no meaningful sugar response (an egg, cheese, meat)
    if (x.food.gi === null) missingGi.push(x.food.name); else { glSum += (x.food.gi * c) / 100; knownCarbs += c; }
  }
  const gl = knownCarbs > 0 ? glSum : null;
  const availCarbs = sum(avail);
  return {
    grams: parts.reduce((s, x) => s + x.grams, 0), kcal: sum((p) => p.kcal), carbs: sum((p) => p.carbs), availCarbs, sugars: sum((p) => p.sugars),
    fiber: sum((p) => p.fiber), fat: sum((p) => p.fat), protein: sum((p) => p.protein), waterG: sum((p) => p.waterG),
    caffeineMg: sum((p) => p.caffeineMg), alcoholG: sum((p) => p.alcoholG), sodiumMg: sum((p) => p.sodiumMg),
    gl, gi: gl !== null && !missingGi.length && knownCarbs >= 1 ? Math.round((100 * gl) / knownCarbs) : null, missingGi,
  };
}

/** The colour the drink/food really has; for a mix, weighted by amount. */
export function mixColor(parts: Part[]): string {
  if (!parts.length) return '#ffffff';
  const tot = parts.reduce((s, p) => s + p.grams, 0) || 1;
  const rgb = [0, 0, 0];
  for (const p of parts) {
    const c = parseInt(p.food.color.slice(1), 16);
    rgb[0] += ((c >> 16) & 255) * p.grams / tot; rgb[1] += ((c >> 8) & 255) * p.grams / tot; rgb[2] += (c & 255) * p.grams / tot;
  }
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

/** n servings of a food (½ → "½ slice"), or an exact weight: the same labels as typing it. Used by the meal builder. */
export function servingPart(food: Food, n: number): Part {
  const p = toPart(food, { count: n });
  return n === 0.5 ? { ...p, amountLabel: p.amountLabel.replace(/^0\.5 × /, '½ × ').replace(/^0\.5 /, '½ ') } : p;
}
export const gramsPart = (food: Food, grams: number): Part => toPart(food, { count: null, grams });
