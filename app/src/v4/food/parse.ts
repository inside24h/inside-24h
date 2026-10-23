// Understands what people type: "1 jabuka", "2 kriške kruha", "pola pizze", "500 ml mlijeka", "kava s mlijekom",
// "pizza and a cola". Returns the foods with their amount in grams and the macros, computed from USDA SR Legacy
// (per 100 g) and GI from Atkinson 2008 (Table 1). Portion words without a USDA weight use OUR assumed sizes,
// marked `assumed`, so the screen can say so.
// DATA: ./fooddb.json is GENERATED (research/tools/build_fooddb.py build → sync_app_fooddb.py); never edit it or patch
// it here. Typical servings (`assumedServing`), the Atkinson Supplementary-Table GI values and the label overrides
// (cola EU can, Red Bull, Nutella …, each with its source in `src`) all live in research/tools/fooddb_spec.py now.
// Beer has no GI on purpose (Atkinson A1 lists 66): alcohol changes how the liver handles glucose.
import raw from './fooddb.json';

export interface Per100 {
  kcal: number; carbs: number | null; sugars: number | null; freeSugars: number | null; fiber: number | null; fat: number | null;
  satFat: number | null; protein: number | null; sodiumMg: number | null; caffeineMg: number | null; alcoholG: number | null; waterG: number | null;
}
/** A value that is not from USDA: which fields, the evidence level, the sentence for "How do we know?" and the source.
 *  `claim`: the claim id (content/food.ts) for variant, builder, add-in and size rows; base label rows use DBO-<id>-<i>. */
export interface FoodSource { fields: string[]; level: 'A' | 'B' | 'C'; text: string; cite: string; url: string; claim?: string }
/** 2026-10-18 (research/tools/build_variants.py): a variant keeps the base id and adds `v` ("beer.radler"). */
export interface Variant {
  v: string; chip: string; name: string; words: string[]; aliases: string[]; kind: Food['kind']; serving: { label: string; grams: number };
  p: Per100; gi: number | null; color: string; proxy: boolean; recipe: boolean; fdc: number | null; src: FoodSource[];
  assumedServing?: boolean; range?: Record<string, [number, number]>;
}
/** Named amounts for "How much?": `mult` × the serving, or an absolute `ml` (beer 0.3 l). */
export interface SizeOpt { k: string; label: string; mult?: number; ml?: number }
/** Sugar, honey, milk, an extra shot: folded INTO the drink (a mix), never a separate solid in the stomach. */
export interface AddIn { k: string; label: string; unit: string; grams: number; max: number; excl: string | null; p: Per100; gi: number | null; words: string[]; food: string | null; fdc: number | null; src: FoodSource[] }
export interface BuilderOpt { k: string; chip: string; name: string; grams: number; rng: [number, number] | null; on: boolean; p: Per100; gi: number | null; fdc: number | null; food: string | null; words: string[]; aliases: string[]; src: FoodSource[] }
export interface BuilderGroup { k: string; label: string; one: boolean; opts: BuilderOpt[] }
export interface Preset { k: string; chip: string; name: string; on: string[]; aliases: string[]; words: string[]; check?: { grams: number; kcal: number; fat: number; gi: number | null } }
export interface Builder { title: string; ask: string | null; unit: string; src: FoodSource[]; presets: Preset[]; groups: BuilderGroup[] }
/** One word, several foods ("čaj"): the app starts on the word's owner and shows "Which tea?". Options are food keys. */
export interface Chooser { k: string; ask: string; words: string[]; opts: { k: string; chip: string }[] }
export interface Food {
  id: string; name: string; aliases: string[]; kind: 'liquid' | 'semi' | 'solid';
  serving: { label: string; grams: number }; p: Per100; gi: number | null; color: string; proxy: boolean; recipe: boolean; fdc: number | null;
  /** a typical size we chose (level C), not a USDA or label portion */
  assumedServing?: boolean;
  /** one countable piece: "5 ćevapi", "10 olives" */
  piece?: { label: string; grams: number };
  /** a brand alias with its own pack: "monster" → 1 can (500 ml) */
  aliasServing?: Record<string, { label: string; grams: number }>;
  src?: FoodSource[];
  // ---- choices (only on foods that have them; see research/audit/VARIANTS-DONE.md) ----
  ask?: string; chip?: string; variants?: Variant[]; sizes?: { opts: SizeOpt[]; src: FoodSource[] }; addins?: AddIn[]; builder?: Builder; choose?: Chooser;
  // ---- a DERIVED food (variant / builder selection / add-ins); FOODS never contains one ----
  /** the database food this was made from */ base?: Food;
  v?: string;
  /** builder selection (option keys), only when it differs from the default */ on?: string[];
  /** add-ins and how many (sugar: 2) */ add?: Record<string, number>;
}
export const FOODS: Food[] = raw as unknown as Food[];
export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]));

/** `ask`: the text named several foods ("čaj"), so the screen shows "Which tea?" until the person picks. */
export interface Part { food: Food; grams: number; amountLabel: string; assumed: boolean; ask?: boolean }
export interface Macros {
  grams: number; kcal: number; carbs: number; availCarbs: number; sugars: number; fiber: number; fat: number; protein: number;
  waterG: number; caffeineMg: number; alcoholG: number; sodiumMg: number;
  /** Glycaemic load = Σ GI × available carbs / 100 over the parts with a measured GI; null when none of the
   *  carbohydrate has one. `missingGi` names parts left out, so the real load is at least this. */
  gl: number | null; gi: number | null; missingGi: string[];
}

export const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();

// "… kroz 2 sata", "… over 2 hours", "tijekom 3 h" (QA 2026-10-19): how long the servings were spread over. Before,
// the phrase was read as part of the last food, and "2 piva kroz 2 sata" found nothing. Not "u 2 sata" / "in 2 hours"
// / "za 2 sata": in Croatian and English those also mean a clock time or "later".
const PACE_NUM: Record<string, number> = { jedan: 1, jednog: 1, jedna: 1, one: 1, an: 1, a: 1, dva: 2, dvije: 2, two: 2, tri: 3, three: 3, cetiri: 4, four: 4, pet: 5, five: 5, pola: 0.5, half: 0.5 };
const PACE_RE = /(?:^|[ ,])(?:kroz|tijekom|over|during|across)( (?:\d+(?:[.,]\d+)?|jedan|jednog|jedna|one|an|a|dva|dvije|two|tri|three|cetiri|four|pet|five|pola|half(?: an?)?))? ?(h|hrs?|sat|sata|sati|hours?|min|mins|minuta|minute|minutes)\b(?: vremena)?/;
/** "tijekom večeri", "during the evening": no length given, so no pace (the "Over how long?" row asks), but the words
 *  must not be read as a food. */
const PACE_VAGUE = /(?:^|[ ,])(?:kroz|tijekom|over|during|across) (?:the )?(?:veceri|vecer|noci|noc|evening|night|party|zabave)\b/;
/** Minutes the text says the servings were spread over, rounded to the offered choices (1–4 h; longer = 4 h, the
 *  cautious end; under half an hour = all at once). 0 = not said. */
export function readPace(input: string): number {
  const m = fold(input ?? '').match(PACE_RE);
  if (!m) return 0;
  const w = (m[1] ?? '').trim().replace(/^half an?$/, 'half').replace(',', '.');
  const n = w ? PACE_NUM[w] ?? Number(w) : 1;
  const min = /^min/.test(m[2]) ? n : n * 60;
  if (!Number.isFinite(min) || min < 30) return 0;
  return Math.min(4, Math.max(1, Math.round(min / 60))) * 60;
}
/** The text without its pace phrase (the foods are read from what is left). */
const stripPace = (text: string) => text.replace(PACE_RE, ' ').replace(PACE_VAGUE, ' ').replace(/\s+/g, ' ').trim();

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, jedan: 1, jedna: 1, jedno: 1, jednu: 1, jednog: 1, two: 2, dva: 2, dvije: 2, dvi: 2, three: 3, tri: 3,
  four: 4, cetiri: 4, five: 5, pet: 5, six: 6, sest: 6, half: 0.5, pola: 0.5, polovica: 0.5, polovicu: 0.5, quarter: 0.25, cetvrt: 0.25,
};
// Measures that are a weight or volume
const MASS: [RegExp, number][] = [[/^(g|gr|gram|grama|grams|grami)$/, 1], [/^(kg|kila|kilo)$/, 1000], [/^(dag|deka)$/, 10]];
const VOLUME: [RegExp, number][] = [[/^(ml|mililitara|mililitra)$/, 1], [/^(dl|decilitar|decilitra|deci)$/, 100], [/^(cl)$/, 10], [/^(l|lit|litra|litre|litru|liter|liters|litres)$/, 1000]];
// Household portions: our own typical sizes (assumed), in ml for drinks. The default is per WORD; a few drinks are
// poured differently, so the size also depends on the DRINK (PORTION_BY_FOOD below).
type PortionWord = 'glass' | 'cup' | 'can' | 'bottle' | 'pint' | 'shot';
const PORTION_ML: [RegExp, number, PortionWord][] = [
  [/^(casa|case|casu|glass|glasses)$/, 250, 'glass'], [/^(salica|salice|salicu|cup|cups|soljica|soljicu)$/, 200, 'cup'], [/^(limenka|limenke|limenku|can|cans)$/, 330, 'can'],
  [/^(boca|boce|bocu|bottle|bottles)$/, 500, 'bottle'], [/^(krigla|kriglu|pint)$/, 500, 'pint'], [/^(shot|cuga|cugu|casica|casicu)$/, 30, 'shot'],
];
// A glass of wine is not a glass of water. Wine: 150 ml, the size our database already uses as one serving (UK pubs
// pour 125/175/250 ml; a US "standard drink" of wine is 5 fl oz ≈ 148 ml). Beer: 300 ml (a small beer glass, 0.3 l).
// Spirits (rakija): one pour, 40 ml, as in the database. A cup of espresso is one shot (30 ml), not a 200 ml mug.
// All level C (our assumption) and shown as "≈ … ml" so people can type the exact amount instead.
// A bottle of wine is 750 ml (EU nominal quantity for still wine, Directive 2007/45/EC). Croatian beer cans and bottles
// are mainly 0.5 l (Ožujsko, Karlovačko), so a can of beer is 500 ml; 0.33 l exists too and can be typed as "330 ml".
const PORTION_BY_FOOD: Record<string, Partial<Record<PortionWord, number>>> = {
  'red-wine': { glass: 150, cup: 150, bottle: 750 }, 'white-wine': { glass: 150, cup: 150, bottle: 750 },
  beer: { glass: 300, can: 500 }, rakija: { glass: 40, cup: 40, shot: 40 }, espresso: { cup: 30, glass: 30 },
};
/** ml of one portion word for this food: a per-drink size, else the food's own can size (energy drink 250 ml, a
 *  Monster 500 ml via its alias), else the word's default. */
function portionMlFor(food: Food, word: PortionWord, dflt: number, alias?: { label: string; grams: number }): number {
  const own = PORTION_BY_FOOD[food.id]?.[word];
  if (own !== undefined) return own;
  const can = alias && /^1 can( |$)/.test(alias.label) ? alias : /^1 can( |$)/.test(food.serving.label) ? food.serving : null;
  if (word === 'can' && can) return Math.round((can.grams * mlPerGram(food)) / 5) * 5;
  return dflt;
}
/** The brand alias typed ("monster", "1 can of monster"), if this food has a pack size for it. */
const aliasServingFor = (food: Food, rest: string) => {
  if (!food.aliasServing) return undefined;
  const words = rest.split(' ');
  const key = Object.keys(food.aliasServing).find((k) => rest === k || words.includes(k));
  return key ? food.aliasServing[key] : undefined;
};
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
  return aliasScore(text, [food.name, food.id.replace(/-/g, ' '), ...food.aliases].map(fold));
}
function aliasScore(text: string, aliases: string[]): number {
  if (!text) return 0;
  const words = text.split(' ').filter((w) => !FILLER.has(w));
  if (!words.length) return 0;
  let best = 0;
  for (const alias of aliases) {
    if (alias === text) return 10;
    // A typed prefix LOGS a food only when it is at least 3 letters and covers at least half of the alias ("ban" →
    // banana, "piz" → pizza). Shorter prefixes only SUGGEST (score between MIN_SCORE and MIN_LOG): "nar" is naranča as
    // much as narezak, "sun" is not šunka, "kro" is not krompir (QA 2026-10-19).
    if (alias.startsWith(text) && text.length >= 2) {
      const r = text.length / alias.length;
      best = Math.max(best, text.length >= 3 && r >= 0.5 ? 6 + r : MIN_SCORE + 0.25 * r);
    }
    const aw = alias.replace(/[()/,]/g, ' ').split(' ').filter(Boolean);
    let hit = 0;
    for (const w of words) {
      let h = 0;
      for (const x of aw) h = Math.max(h, stemMatch(w, x), x.startsWith(w) && w.length >= 3 && w.length / x.length >= 0.5 ? 0.7 : 0);
      hit += h;
    }
    // reward matching ALL words of a short alias; its "s"/"with" don't count ("kave s mlijekom" ~ "kava s mlijekom")
    const cover = hit / Math.max(words.length, aw.filter((x) => !FILLER.has(x)).length);
    if (hit >= words.length * 0.7) best = Math.max(best, 2 + 4 * cover);
  }
  return best;
}

/** Below this a match is too loose to log or suggest. One stem-matched word against a two-word alias scores 3.7
 *  ("maline" ~ "mala kava" → espresso, "cockta" ~ "coca cola", "smokvi" ~ "suhe smokve"); a whole word of a
 *  two-word alias scores 4 ("kava" in "filter kava"). Audit 2026-10-17: was 2.5. A "not found" beats a wrong food. */
export const MIN_SCORE = 3.8;
/** To LOG a food from typed text it must also beat one word of a two-word alias (4.0): "smokve" is fresh figs, not
 *  "suhe smokve"; "macchiato" is not "late macchiato". Those still show in the dropdown as an option. */
export const MIN_LOG = 4.1;

function bestFoods(text: string, n = 8): { food: Food; score: number }[] {
  const rank = (f: Food) => FOODS.indexOf(baseOf(f)) + (f.base ? 0.5 : 0);
  return [...FOODS.map((food) => ({ food, score: matchScore(text, food) })), ...altMatches(text)]
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || rank(a.food) - rank(b.food)) // ties: the database lists the everyday choice first, base before its variants
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

/** `typed`: the number came from the text ("5 ćevapa"), not from a serving step; `pieceWord`: "komada", "pieces". */
interface Qty { count: number | null; grams?: number; ml?: number; portionMl?: number; portionWord?: PortionWord; piece?: boolean; pieceWord?: boolean; spoonMl?: number; label?: string; typed?: boolean }
const PIECE_WORD = /^(kom|komad|komada|komadic|piece|pieces)$/;

/** Pull the amount out of one segment: returns what is left (the food words) and the quantity. */
function readQty(seg: string): { rest: string; q: Qty } {
  const toks = seg.replace(/(\d)([a-z])/g, '$1 $2').replace(/,(\d)/g, '.$1').split(' ').filter(Boolean);
  const q: Qty = { count: null };
  const rest: string[] = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    const num = /^\d+(\.\d+)?$/.test(t) ? Number(t) : Object.prototype.hasOwnProperty.call(NUMBER_WORDS, t) ? NUMBER_WORDS[t] : undefined;
    if (num !== undefined && q.count === null) { q.count = num; q.typed = true; continue; }
    const mass = MASS.find(([r]) => r.test(t)); if (mass) { q.grams = (q.count ?? 1) * mass[1]; q.label = `${q.count ?? 1} ${t}`; q.count = null; continue; }
    const vol = VOLUME.find(([r]) => r.test(t)); if (vol) { q.ml = (q.count ?? 1) * vol[1]; q.label = `${q.count ?? 1} ${t}`; q.count = null; continue; }
    const por = PORTION_ML.find(([r]) => r.test(t)); if (por) { q.portionMl = por[1]; q.portionWord = por[2]; q.label = por[2]; continue; } // English word on screen ("casa" → glass)
    const sp = SPOON.find(([r]) => r.test(t)); if (sp) { q.spoonMl = sp[1]; q.label = sp[1] === 15 ? 'tbsp' : 'tsp'; continue; }
    if (PIECE.test(t)) { q.piece = true; q.pieceWord = PIECE_WORD.test(t); q.label = t; continue; }
    rest.push(t);
  }
  return { rest: rest.join(' '), q };
}

/** "1 slice" → "2 slices"? Only for plain labels; "1 bowl, 245 g" or "1 steak (200 g raw)" become "2 × …". */
const NOUN_PLURAL = /^(slice|piece|can|bowl|fillet|chop|cookie|cake|date|doughnut|frankfurter|croissant|pancake|handful|portion|sub|steak|avocado|bar|container|link|leaf|stalk|fruit|olive|sandwich|cracker|egg)\b/;
const plural = (rest: string) => rest.replace(NOUN_PLURAL, (w) => (/(ch|sh)$/.test(w) ? `${w}es` : `${w}s`));
const countLabel = (n: number, one: string) => (n === 1 ? one : /^1 /.test(one) && !/, |\(\d+ g/.test(one) ? `${n} ${n > 1 ? plural(one.slice(2)) : one.slice(2)}` : `${n} × ${one}`);

function toPart(food: Food, q: Qty, rest = ''): Part {
  const n = q.count ?? 1;
  const nice = (g: number) => Math.round(g);
  const brand = aliasServingFor(food, rest);
  if (q.grams !== undefined) return { food, grams: q.grams, amountLabel: `${nice(q.grams)} g`, assumed: false };
  if (q.ml !== undefined) return { food, grams: q.ml / mlPerGram(food), amountLabel: `${nice(q.ml)} ml`, assumed: false };
  if (q.portionMl !== undefined) {
    const ml = q.portionWord ? portionMlFor(food, q.portionWord, q.portionMl, brand) : q.portionMl;
    return { food, grams: (n * ml) / mlPerGram(food), amountLabel: `${n === 1 ? '1' : n} × ${q.label} (≈ ${ml} ml)`, assumed: true };
  }
  if (q.spoonMl !== undefined) {
    const servMl = food.serving.label.match(/tbsp|tablespoon/) ? 15 : food.serving.label.match(/tsp|teaspoon/) ? 5 : null;
    const g = servMl ? (food.serving.grams * q.spoonMl) / servMl : q.spoonMl / mlPerGram(food);
    return { food, grams: n * g, amountLabel: `${n} × ${q.label}`, assumed: !servMl };
  }
  // a typed whole number of a countable food counts pieces ("5 ćevapa", "10 komada ćevapa", "8 maslina"); "2 porcije" stays servings
  if (food.piece && q.typed && Number.isInteger(n) && n >= 1 && (!q.piece || q.pieceWord)) {
    const pl = n === 1 ? food.piece.label : `${food.piece.label}s`.replace(/ss$/, 's');
    return { food, grams: n * food.piece.grams, amountLabel: `${n} ${pl}`, assumed: true };
  }
  if (brand) return { food, grams: n * brand.grams, amountLabel: countLabel(n, brand.label), assumed: false };
  return { food, grams: n * food.serving.grams, amountLabel: countLabel(n, servingText(food)), assumed: !!food.assumedServing };
}

const SPLIT = / (?:s|sa|i|and|with|uz|plus|\+) |,|\+|;/;
const SPLIT_KEEP = /( (?:s|sa|i|and|with|uz|plus|\+) |,|\+|;)/;
const WITH = /^ (?:s|sa|with|uz) $/;
const AND = /^(?: (?:i|and) |,)$/;

/** Best reading of the whole text. Tries the full phrase first (so "kava s mlijekom" stays one drink). After the
 *  split, "with …" (s/sa/with/uz) that names an add-in, a topping or a variant of the thing before it goes INTO that
 *  thing: "kava sa šećerom" = espresso with sugar, "pizza sa šunkom i gljivama" = one pizza, "burek sa sirom i jogurt"
 *  = burek with cheese + a yogurt. A plain "and" starts a new thing ("pizza i pivo"). */
export function parseMeal(input: string): Part[] {
  const text = stripPace(fold(input));
  if (!text) return [];
  const whole = readQty(text);
  const top = bestFoods(whole.rest, 1)[0];
  if (top && top.score >= 8) return [withAsk(toPart(top.food, whole.q, whole.rest), whole.rest)];
  const parts: Part[] = [];
  const pieces = text.split(SPLIT_KEEP);
  let chain = false, prevRaw = '', headRaw = '';
  for (let i = 0; i < pieces.length; i += 2) {
    const seg = (pieces[i] ?? '').trim();
    if (!seg) continue;
    const sep = i > 0 ? pieces[i - 1] ?? '' : '';
    const { rest, q } = readQty(seg);
    const prev = parts[parts.length - 1];
    if (prev && (WITH.test(sep) || (chain && AND.test(sep)))) {
      // "kava s mlijekom sa šećerom", "2 kave s mlijekom": the words before and after "s" may name ONE food together
      // (coffee with milk), which then takes the rest as add-ins; before, it became espresso + milk + sugar (QA 2026-10-23)
      // "kava sa šećerom i mlijekom": the first words + this one ("kava s mlijekom"), keeping the add-ins found so far
      const own = [prev.food, bestFoods(rest, 1)[0]?.food].filter(Boolean).map((x) => baseOf(x!).id);
      let joinedHit = false;
      for (const [joined, keep] of [[`${prevRaw}${sep}${seg}`, false], [`${headRaw} s ${seg}`, true]] as const) {
        if (!WITH.test(sep) && !keep) continue;
        const jq = readQty(joined), top = bestFoods(jq.rest, 1)[0];
        if (!top || top.score < 5.5 || own.includes(baseOf(top.food).id)) continue;
        const food = keep && prev.food.add ? withChoice(top.food, { add: { ...(top.food.add ?? {}), ...prev.food.add } }) : top.food;
        parts[parts.length - 1] = withAsk(toPart(food, jq.q, jq.rest), jq.rest); prevRaw = `${prevRaw}${sep}${seg}`; chain = true; joinedHit = true; break;
      }
      if (joinedHit) continue;
      const merged = applyWords(prev, rest, q);
      if (merged) { parts[parts.length - 1] = merged; prevRaw = `${prevRaw}${sep}${seg}`; chain = true; continue; }
    }
    chain = false; prevRaw = seg; headRaw = seg;
    const f = bestFoods(rest, 1)[0];
    if (f && f.score >= MIN_LOG) parts.push(withAsk(toPart(f.food, q, rest), rest));
  }
  if (!parts.length && top && top.score >= MIN_LOG) return [withAsk(toPart(top.food, whole.q, whole.rest), whole.rest)];
  return parts;
}

export interface Suggestion { parts: Part[]; text: string }
/** Suggestions for the dropdown: the full reading first, then other foods that match the last thing typed. */
export function suggest(input: string, n = 7): Suggestion[] {
  const text = stripPace(fold(input));
  if (!text) return POPULAR.map((t) => ({ text: t, parts: parseMeal(t) }));
  const main = parseMeal(input);
  const segs = text.split(SPLIT);
  const last = readQty(segs[segs.length - 1].trim());
  const head = main.length > 1 ? main.slice(0, -1) : [];
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  const push = (parts: Part[]) => {
    const key = parts.map((p) => `${foodKey(p.food)}:${Math.round(p.grams)}`).join('+');
    if (!parts.length || seen.has(key)) return;
    seen.add(key); out.push({ parts, text: parts.map((p) => p.food.name).join(' + ') });
  };
  push(main);
  for (const { food } of bestFoods(last.rest || text, n * 2).filter((x) => x.score >= MIN_SCORE)) push([...head, toPart(food, last.q, last.rest)]);
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

// ======================= CHOICES: variants, builders, add-ins, sizes, "Which …?" (2026-10-18) =======================
// Data: research/tools/fooddb_spec.py (section VARIANTS …) → build_variants.py → fooddb.json. A derived food keeps the
// base id (so isDrink, Browse groups, HABIT_OF and SWAPS keep working) and carries v / on / add; FOODS stays base-only.
// mixParts() is the same rule as build_variants.mix() (a test compares them): gram-weighted, null if any part is null,
// GI carbohydrate-weighted over parts with ≥ 3 g available carbohydrate and only if all of those have a measured GI.
// CARB_MIN was 1 g until 2026-10-20; 3 g is the same threshold macros() uses for a meal (no meaningful sugar response),
// so a kebab's tomato and onion (1–2 g each, never tested) no longer void its GI (VARIANTS-DONE.md, data round 3).

const hasOwn = <T,>(o: Record<string, T> | undefined | null, k: string): o is Record<string, T> => !!o && Object.prototype.hasOwnProperty.call(o, k);
export const baseOf = (f: Food): Food => f.base ?? f;
/** A database food as it is (the curated espresso/cola/water models and the label overrides apply only to these). */
export const isPlain = (f: Food) => !f.base;
export interface Choice { v?: string; on?: string[]; add?: Record<string, number> }
const NUM_KEYS: (keyof Per100)[] = ['kcal', 'carbs', 'sugars', 'freeSugars', 'fiber', 'fat', 'satFat', 'protein', 'sodiumMg', 'caffeineMg', 'alcoholG', 'waterG'];
export const CARB_MIN = 3;
export interface MixPart { p: Per100; gi: number | null; grams: number }
export function mixParts(parts: MixPart[]): { p: Per100; grams: number; gi: number | null } {
  const ps = parts.filter((x) => x.grams > 0);
  const tot = ps.reduce((s, x) => s + x.grams, 0);
  const p = {} as Record<keyof Per100, number | null>;
  for (const k of NUM_KEYS) {
    let s = 0, nul = false;
    for (const x of ps) { const v = x.p[k]; if (v === null || v === undefined) { nul = true; break; } s += v * x.grams; }
    p[k] = nul || !tot ? null : s / tot;
  }
  const carb = ps.map((x) => ({ x, a: (Math.max(0, (x.p.carbs ?? 0) - (x.p.fiber ?? 0)) * x.grams) / 100 })).filter((c) => c.a >= CARB_MIN);
  const gi = carb.length && carb.every((c) => c.x.gi !== null) ? Math.round(carb.reduce((s, c) => s + c.x.gi! * c.a, 0) / carb.reduce((s, c) => s + c.a, 0)) : null;
  return { p: { ...(p as unknown as Per100), kcal: p.kcal ?? 0 }, grams: tot, gi };
}

// ---- builders ----
const allOpts = (b: Builder) => b.groups.flatMap((g) => g.opts);
export const defaultSel = (b: Builder) => allOpts(b).filter((o) => o.on).map((o) => o.k);
/** Known keys only, exactly one per one-of group (the last one named wins, else the default), in builder order. */
export function normSel(b: Builder, keys: string[]): string[] {
  const out: string[] = [];
  for (const g of b.groups) {
    if (g.one) {
      const named = keys.filter((k) => g.opts.some((o) => o.k === k));
      out.push(named.length ? named[named.length - 1] : g.opts.find((o) => o.on)!.k);
    } else for (const o of g.opts) if (keys.includes(o.k)) out.push(o.k);
  }
  return out;
}
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
export const presetOf = (b: Builder, sel: string[]) => b.presets.find((p) => sameSet(p.on, sel));
export const selOf = (f: Food): string[] => { const b = baseOf(f).builder; return b ? f.on ?? defaultSel(b) : []; };
const cap1 = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const listWords = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const plainName = (f: Food) => f.name.replace(/\s*\(.*\)$/, '');
function builderName(base: Food, sel: string[]): string {
  const b = base.builder!;
  const pr = presetOf(b, sel);
  if (pr) return pr.name;
  const ones = b.groups.filter((g) => g.one);
  const chosen = ones.map((g) => g.opts.find((o) => sel.includes(o.k))!);
  const anyOn = (keys: string[]) => b.groups.filter((g) => !g.one).flatMap((g) => g.opts).filter((o) => keys.includes(o.k));
  let noun: string, ref: string[];
  const prOne = b.presets.find((p) => chosen.every((c) => p.on.includes(c.k)));
  if (ones.length === 1 && ones[0].opts.length === 1) { noun = plainName(base); ref = defaultSel(b); }
  else if (ones.length > 1 && prOne) { noun = prOne.name; ref = prOne.on; }
  else if (ones.length > 1) { noun = plainName(base); ref = defaultSel(b); }
  else { noun = cap1(chosen[0].name); ref = defaultSel(b); }
  const added = anyOn(sel).filter((o) => !ref.includes(o.k)).map((o) => o.name);
  const removed = anyOn(ref).filter((o) => !sel.includes(o.k)).map((o) => o.name);
  return `${noun}${added.length ? ` with ${listWords(added)}` : ''}${removed.length ? ` without ${listWords(removed)}` : ''}`;
}

// ---- add-ins ----
function normAdd(base: Food, add: Record<string, number> | undefined): Record<string, number> | undefined {
  if (!base.addins || !add) return undefined;
  const out: Record<string, number> = {};
  for (const k of Object.keys(add)) {
    const a = base.addins.find((x) => x.k === k);
    const n = Math.round(Number(add[k]));
    if (!a || !(n >= 1)) continue;
    if (a.excl) for (const o of base.addins) if (o.excl === a.excl && o.k !== a.k) delete out[o.k]; // honey replaces sugar
    out[k] = Math.min(a.max, n);
  }
  const ks = base.addins.map((a) => a.k).filter((k) => hasOwn(out, k));
  return ks.length ? Object.fromEntries(ks.map((k) => [k, out[k]])) : undefined;
}
const addWord = (a: AddIn, n: number) => (a.k === 'shot' ? (n > 1 ? `${n} extra shots` : 'an extra shot') : n > 1 ? `${n} tsp ${a.label.toLowerCase()}` : a.label.toLowerCase());
const addUnit = (a: AddIn, n: number) => (a.k === 'milk' ? 'a splash of milk' : a.k === 'shot' ? `${n} extra shot${n > 1 ? 's' : ''}` : `${n} tsp ${a.label.toLowerCase()}`);

/** "beer.radler", "espresso~sugar1", "pizza_base_ham_mushrooms": the same food always gets the same key. */
export function foodKey(f: Food): string {
  const b = baseOf(f);
  const add = f.add ? Object.entries(f.add).map(([k, n]) => `~${k}${n}`).join('') : '';
  return `${b.id}${f.v ? `.${f.v}` : ''}${add}${f.on ? f.on.map((k) => `_${k}`).join('') : ''}`;
}

const DERIVED = new Map<string, Food>();
/** The food for this choice (variant / builder selection / add-ins), cached; the plain database food when it is the
 *  default. Unknown or impossible choices fall back to the default (a link never breaks). */
export function deriveFood(food: Food, ch: Choice): Food {
  const base = baseOf(food);
  const vr = ch.v && base.variants ? base.variants.find((x) => x.v === ch.v) : undefined;
  let on: string[] | undefined;
  if (base.builder && ch.on) { const s = normSel(base.builder, ch.on); on = sameSet(s, defaultSel(base.builder)) ? undefined : s; }
  const add = normAdd(base, ch.add);
  if (!vr && !on && !add) return base;
  const probe = { id: base.id, base, v: vr?.v, on, add } as Food;
  const key = foodKey(probe);
  const hit = DERIVED.get(key);
  if (hit) return hit;
  const src: FoodSource[] = [];
  let parts: MixPart[], name: string, label: string, kind = base.kind, color = base.color, proxy = base.proxy, fdc = base.fdc, assumed = !!base.assumedServing;
  const baseSrc = (base.src ?? []).map((s, i) => ({ ...s, claim: s.claim ?? `DBO-${base.id}-${i}` }));
  if (base.builder) {
    const b = base.builder, sel = on ?? defaultSel(b);
    const opts = allOpts(b).filter((o) => sel.includes(o.k));
    parts = opts.map((o) => ({ p: o.p, gi: o.gi, grams: o.grams }));
    src.push(...b.src, ...opts.flatMap((o) => o.src));
    if (opts.some((o) => o.food === base.id)) src.push(...baseSrc);
    name = builderName(base, sel);
    const single = b.groups.find((g) => g.one && g.opts.length === 1);
    label = single ? base.serving.label : `1 ${b.unit || 'serving'}`;
    fdc = null; assumed = true; proxy = proxy && opts.some((o) => o.food === base.id);
  } else if (vr) {
    parts = [{ p: vr.p, gi: vr.gi, grams: vr.serving.grams }];
    src.push(...vr.src);
    name = vr.name; label = vr.serving.label; kind = vr.kind; color = vr.color; proxy = vr.proxy; fdc = vr.fdc; assumed = !!vr.assumedServing;
  } else {
    parts = [{ p: base.p, gi: base.gi, grams: base.serving.grams }];
    src.push(...baseSrc);
    name = plainName(base); label = base.serving.label;
  }
  if (add) {
    for (const a of base.addins!) if (hasOwn(add, a.k)) { parts.push({ p: a.p, gi: a.gi, grams: a.grams * add[a.k] }); src.push(...a.src); }
    const ws = base.addins!.filter((a) => hasOwn(add, a.k));
    const plain = name.replace(/\s*\(.*\)$/, ''); // "Coffee with milk and sugar", not "… with milk with sugar" (QA 2026-10-23)
    name = `${plain}${/ with /.test(plain) ? ' and ' : ' with '}${listWords(ws.map((a) => addWord(a, add[a.k])))}`;
    label = `${label} with ${listWords(ws.map((a) => addUnit(a, add[a.k])))}`;
  }
  const m = parts.length === 1 ? { p: parts[0].p, grams: parts[0].grams, gi: parts[0].gi } : mixParts(parts);
  const f: Food = {
    ...base, id: base.id, name, aliases: [], kind, color, proxy, fdc, recipe: base.builder || add ? true : vr ? vr.recipe : base.recipe,
    serving: { label, grams: Math.round(m.grams * 10) / 10 }, p: m.p, gi: m.gi, assumedServing: assumed || undefined,
    piece: undefined, aliasServing: undefined, src, base, v: vr?.v, on, add,
  };
  DERIVED.set(key, f);
  return f;
}
/** The same food with one more change ("+ sugar", another topping, another variant). */
export const withChoice = (f: Food, ch: Choice): Food => deriveFood(f, { v: f.v, on: f.on, add: f.add, ...ch });

/** A token like "pizza_ham_mushrooms" or "espresso.decaf~sugar1" → the food (unknown parts fall back to defaults). */
export function foodFromKey(key: string): Food | undefined {
  const m = /^([a-z0-9-]+)(?:\.([a-z0-9-]+))?((?:~[a-z]+\d+)*)((?:_[a-z0-9-]+)*)$/.exec(key);
  if (!m || !hasOwn(FOOD_BY_ID, m[1])) return undefined;
  const add: Record<string, number> = {};
  for (const x of m[3].match(/~[a-z]+\d+/g) ?? []) { const mm = /^~([a-z]+)(\d+)$/.exec(x)!; add[mm[1]] = Number(mm[2]); }
  const on = m[4] ? m[4].split('_').filter(Boolean) : undefined;
  return deriveFood(FOOD_BY_ID[m[1]], { v: m[2], on, add: Object.keys(add).length ? add : undefined });
}

// ---- search: variants, builder parts and presets as extra candidates ----
interface Alt { food: Food; aliases: string[]; words: string[] }
let ALTS: Alt[] | null = null;
function altList(): Alt[] {
  if (ALTS) return ALTS;
  const out: Alt[] = [];
  for (const base of FOODS) {
    for (const v of base.variants ?? []) out.push({ food: deriveFood(base, { v: v.v }), aliases: v.aliases.map(fold), words: v.words });
    const b = base.builder;
    if (!b) continue;
    // the name on a chip is also a search alias when it names a whole dish ("tuna sub", "cold-cut sub", "potato burek"),
    // not one ingredient ("chicken", "ham": those stay the plain foods) (QA 2026-10-23: "tuna sub" found nothing)
    const own = (name: string) => (name.trim().includes(' ') ? [fold(name)] : []);
    for (const g of b.groups) for (const o of g.opts) if (o.aliases.length || (g.one && own(o.name).length)) {
      out.push({ food: deriveFood(base, { on: [...defaultSel(b), o.k] }), aliases: [...o.aliases.map(fold), ...(g.one ? own(o.name) : [])], words: [] });
    }
    for (const p of b.presets) out.push({ food: deriveFood(base, { on: p.on }), aliases: [...p.aliases.map(fold), ...own(p.name)], words: p.words });
  }
  return (ALTS = out);
}
const hasWord = (text: string, w: string) => (w.includes(' ') ? ` ${text} `.includes(` ${w} `) : text.split(' ').includes(w));
/** Variant candidates appear only when one of their words is present; an exact alias is a whole-phrase hit (10). */
function altMatches(text: string): { food: Food; score: number }[] {
  if (!text) return [];
  const out: { food: Food; score: number }[] = [];
  for (const a of altList()) {
    if (a.aliases.includes(text)) { out.push({ food: a.food, score: 10 }); continue; }
    if (a.words.some((w) => hasWord(text, w))) { const s = aliasScore(text, a.aliases); if (s > 0) out.push({ food: a.food, score: Math.min(9, s) }); }
  }
  return out;
}

/** The text after "with" names one of this food's add-ins, toppings or variants. */
const wordHit = (rest: string, words: string[]) => !!rest && (words.includes(rest) || (!rest.includes(' ') && words.some((w) => !w.includes(' ') && stemMatch(rest, w) >= 0.85)));
function applyWords(prev: Part, rest: string, q: Qty): Part | null {
  const f = prev.food, base = baseOf(f);
  let ch: Choice | null = null;
  const a = base.addins?.find((x) => wordHit(rest, x.words));
  if (a) { const n = q.count && Number.isInteger(q.count) && q.count >= 1 ? q.count : 1; ch = { add: { ...(f.add ?? {}), [a.k]: n } }; }
  if (!ch && base.builder) {
    for (const g of base.builder.groups) {
      const o = g.opts.find((x) => wordHit(rest, x.words));
      if (o) { const sel = selOf(f); ch = { on: g.one ? [...sel, o.k] : [...sel.filter((k) => k !== o.k), o.k] }; break; }
    }
  }
  if (!ch && base.variants) { const v = base.variants.find((x) => wordHit(rest, x.words)); if (v) ch = { v: v.v }; }
  if (!ch) return null;
  const nf = withChoice(f, ch);
  const n = prev.grams / Math.max(1e-9, f.serving.grams);
  const q4 = Math.round(n * 4) / 4;
  const p = Math.abs(n - q4) * f.serving.grams < 1 && q4 > 0 ? servingPart(nf, q4) : gramsPart(nf, prev.grams);
  return { ...p, ask: prev.ask };
}
function withAsk(p: Part, rest: string): Part {
  const c = baseOf(p.food).choose;
  return c && wordHit(rest, c.words) ? { ...p, ask: true } : p;
}

// ---- what the screen offers for one food ----
export interface ChoiceOpt { key: string; chip: string; food: Food; on: boolean }
export interface ChoiceRow { ask: string; opts: ChoiceOpt[] }
const sameKind = (a: Food, b: Food) => baseOf(a).id === baseOf(b).id && (a.v ?? '') === (b.v ?? '');
/** Row A: the "Which …?" row (the word's foods, else this food's variants, presets or main builder group). */
export function choiceRow(f: Food): ChoiceRow | null {
  const base = baseOf(f);
  if (base.choose) {
    const opts = base.choose.opts.map((o) => {
      const food = foodFromKey(o.k)!;
      return { key: o.k, chip: o.chip, food, on: sameKind(food, f) || (!food.v && baseOf(food).id === base.id && !base.choose!.opts.some((x) => x.k === `${base.id}.${f.v}`)) };
    });
    return { ask: base.choose.ask, opts };
  }
  return ownRow(f);
}
/** Row B: this food's own variants when Row A is the word's chooser and does not list them. */
export function variantRow(f: Food): ChoiceRow | null {
  const base = baseOf(f);
  if (!base.choose) return null;
  const row = ownRow(f);
  if (!row) return null;
  const listed = new Set(base.choose.opts.map((o) => o.k));
  return row.opts.some((o) => !listed.has(o.key) && o.key !== base.id) ? row : null;
}
function ownRow(f: Food): ChoiceRow | null {
  const base = baseOf(f);
  if (base.variants?.length) {
    return { ask: base.ask ?? 'Which one?', opts: [{ key: base.id, chip: base.chip ?? 'Regular', food: base, on: !f.v },
      ...base.variants.map((v) => ({ key: `${base.id}.${v.v}`, chip: v.chip, food: deriveFood(base, { v: v.v }), on: f.v === v.v }))] };
  }
  const b = base.builder;
  if (!b) return null;
  const sel = selOf(f);
  if (b.presets.length) return { ask: b.ask ?? 'Which one?', opts: b.presets.map((p) => ({ key: p.k, chip: p.chip, food: deriveFood(base, { on: p.on }), on: sameSet(p.on, sel) })) };
  const g = b.groups.find((x) => x.one && x.opts.length > 1);
  if (!g) return null;
  return { ask: b.ask ?? 'Which one?', opts: g.opts.map((o) => ({ key: o.k, chip: o.chip, food: deriveFood(base, { on: [...sel, o.k] }), on: sel.includes(o.k) })) };
}
/** "· 5 kinds" in search and Browse. */
export const kindsOf = (f: Food): number => {
  const r = choiceRow(f);
  return r ? r.opts.length : 0;
};
/** Named sizes for "How much?" as multiples of this food's serving (beer 0.3 l = 0.6 × the 0.5 l serving). */
export function sizesOf(f: Food): { k: string; label: string; mult: number }[] | null {
  const s = baseOf(f).sizes;
  if (!s) return null;
  const m = /([\d.]+)\s*ml/.exec(f.serving.label);
  const out = s.opts.map((o) => ({ k: o.k, label: o.label, mult: o.mult ?? (m && o.ml ? o.ml / Number(m[1]) : NaN) })).filter((o) => Number.isFinite(o.mult) && o.mult > 0);
  return out.length ? out : null;
}
