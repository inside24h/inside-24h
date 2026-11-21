// Round 18 (critique g, T-6 / V-5 / V-6): one place for the names a video says, so the single video, the comparison,
// its verdict and its captions all say the same name ("Cevapi", "Brie", "Fruit yogurt", "Beef wrap kebab",
// "Green salad with olive oil", "Pizza with tuna & egg"), lower case inside a sentence.

/** Round 9: on screen in plain American spelling ("Ćevapi" → "Cevapi"). */
export const plainLatin = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

// round 17 (critic G-8 / G-4): "Brie cheese" is "Brie", "Cod / white fish" is "Cod"
const CHEESE_NAMED = /\b(brie|camembert|cheddar|gouda|edam|parmesan|emmental|emmentaler|mozzarella|feta|gorgonzola|halloumi|ricotta|mascarpone) cheese\b/i;
/** The amount in front of a name ("1 portion of", "8 slices of", "A whole 14-inch", "half a"): not part of the name. */
export const AMOUNT_PREFIX = /^(?:\d+(?:[.,]\d+)?|½|a|an|one|half(?: a| an)?)\s+(?:whole\s+)?(?:\d+-inch\s+)?(?:(?:small|medium|large|side|restaurant|regular|standard)\s+)?(?:(?:portions?|pieces?|slices?|cups?|glass(?:es)?|bowls?|cans?|bottles?|containers?|servings?|plates?|fillets?|scoops?|pots?|shakers?|drinks?|shots?|mugs?|ml|g|l|cl|dl)\s+of\s+)?/i; // (C18: "250 ml of" too, never a bare "Ml of cranberry juice"; phase 4j: "1 drink of mojito", "1 restaurant plate of")
const wordsOf = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
/** Round 18 (critic V-6 / T-6): the add-ons that change a food most come first (meat, fish, egg, cheese, fat). */
const KEY_ADDON = /\b(bacon|extra patty|patty|pepperoni|salami|ham|sausage|tuna|chicken|beef|egg|cheese|olive oil|sunflower oil|oil|butter|mayonnaise|cream|chocolate)\b/i;

/** The name a video says: no "(…)", the first of "A / B", the first add-ons that fit (round 17), never a bare noun
 *  that hides what was added. */
export const shortName = (n: string) => {
  const kind = /^Cheese \(([a-z]+)\)$/i.exec(plainLatin(n).trim())?.[1]; // "Cheese (cheddar)" is "Cheddar"
  if (kind && CHEESE_NAMED.test(`${kind} cheese`)) return kind.charAt(0).toUpperCase() + kind.slice(1);
  let s = plainLatin(n).replace(/\s*\([^)]*\)/g, '').replace(/\s+\/\s+[^,+]*?(?=\s+(?:with|without)\s|\s+\+\s|,|$)/g, '') /* (phase 4h, M1: "Rakija / brandy + Lemonade" is "Rakija + Lemonade", never "Rakija") */.replace(CHEESE_NAMED, '$1').trim();
  // (round 18: "Beef wrap kebab without tomato, lettuce and mayonnaise sauce": what was left out goes when it is long)
  if (wordsOf(s.replace(AMOUNT_PREFIX, '')) > 5 && / without /.test(s)) s = s.slice(0, s.indexOf(' without '));
  if (!(wordsOf(s.replace(AMOUNT_PREFIX, '')) > 5 && / with /.test(s))) return s;
  const core = s.slice(0, s.indexOf(' with '));
  const adds0 = s.slice(s.indexOf(' with ') + 6).split(/,\s*|\s+and\s+/).map((x) => x.trim()).filter(Boolean);
  const adds = [...adds0.filter((a) => KEY_ADDON.test(a)), ...adds0.filter((a) => !KEY_ADDON.test(a))];
  // (round 18: "baguette sandwich with cheese, butter & tomato": three when they fit)
  const three = adds.length >= 3 ? `${core} with ${adds[0]}, ${adds[1]} & ${adds[2]}` : '', two = `${core} with ${adds.slice(0, 2).join(' & ')}`, one = `${core} with ${adds[0]}`;
  return [three && wordsOf(three.replace(AMOUNT_PREFIX, '')) <= 7 ? three : '', two, one].filter(Boolean).find((x) => wordsOf(x.replace(AMOUNT_PREFIX, '')) <= 7) ?? core;
};
/** The comparison's name for a side (round 5): the amount moves to its own line ("330 ml of water" → "Water"). */
export const cmpName = (label: string) => { const s = shortName(plainLatin(label).replace(/^\d+(?:[.,]\d+)?\s*(?:ml|g|l|cl)\s+of\s+/i, '')); return s.charAt(0).toUpperCase() + s.slice(1); };
/** Phase 4j (critique 2026-11-17, M5: "FIRST SIP / 250 ml of black tea." under the headline "250 ml of black tea.",
 *  "FIRST BITE / Soft pretzel." over the body named "Soft pretzel"): two texts say the same words (case, punctuation
 *  and spacing aside), so a card would only repeat a title already on screen. */
export const sameWords = (a: string, b: string) => { const n = (s: string) => plainLatin(s).toLowerCase().replace(/[^a-z0-9%]+/g, ' ').trim(); return !!n(a) && n(a) === n(b); };
/** Phase 4k (critique 2026-11-21, M2: "FIRST SIP / 1 drink of aperol spritz." under the headline "Aperol spritz: 14 g
 *  of alcohol." passed sameWords): the words of a card that carry its meaning, case, punctuation, a serving's words
 *  ("1 drink of", "1 plate of") and filler aside. */
const CARD_STOP = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'and', 'or', 'it', 'its', 'is', 'are', 'your', 'you', 'this', 'that', '1', 'one', 'total', 'drink', 'drinks', 'plate', 'plates',
  'serving', 'servings', 'glass', 'cup', 'can', 'bottle', 'portion', 'restaurant', 'piece', 'slice', 'bowl', 'shot', 'mug']);
export const cardTokens = (s: string) => plainLatin(s).toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9%]+/).filter((w) => w && !CARD_STOP.has(w));
/** Phase 4k: a card that nearly repeats a title on screen: at least `k` of its words are the title's. */
export const nearSame = (card: string, title: string, k = 0.8) => { const c = cardTokens(card), t = new Set(cardTokens(title)); return c.length > 0 && c.filter((w) => t.has(w)).length / c.length >= k - 1e-9; };
/** Phase 4k: two cards that say nearly the same: at least `k` of all their words shared. */
export const alikeCards = (a: string, b: string, k = 0.8) => { const x = new Set(cardTokens(a)), y = new Set(cardTokens(b)); const both = [...x].filter((w) => y.has(w)).length, all = new Set([...x, ...y]).size; return all > 0 && both / all >= k - 1e-9; };
/** Phase 4k (critique 2026-11-21, M4: "1 drink of aperol spritz", "coca-Cola"): the food database's proper nouns and
 *  brands (from its names and its brand aliases, food/fooddb.json; video-4k.test checks each is there), which keep
 *  their capital inside a sentence. "French" only where it names the place ("French toast"; AP style "french fries"). */
export const PROPER_NAMES = ['Aperol', 'Campari', 'Red Bull', 'Coca-Cola', 'Pepsi', 'Monster', 'Powerade', 'Nutella', 'Medica', 'Negroni', 'Bloody Mary', 'Tom Collins', 'Manhattan',
  'Moscow', 'Russian', 'Thai', 'General Tso', 'Caesar', 'California', 'Croatian', 'English', 'Camembert', 'Trappist', 'Greek', 'Turkish', 'French'];
const PROPER_RE = new RegExp(`^(?:${PROPER_NAMES.map((n) => n.replace(/[-\s]/g, '[-\\s]')).join('|')})(?![a-z])`);
/** True when a name starts with a proper noun or brand ("Aperol spritz", "Coca-Cola"), never "French fries". */
export const startsProper = (s: string) => PROPER_RE.test(s) && !/^French fries\b/.test(s);
/** A name inside a sentence ("orange juice"), unless an acronym or brand-like ("USDA", "McFlurry") or a proper noun
 *  or brand of the food database ("Aperol spritz", "Coca-Cola": phase 4k). */
export const lowerName = (s: string) => (/^[A-Z][a-z]/.test(s) && !/^[A-Z][a-z]+[A-Z]/.test(s) && !startsProper(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
/** Round 18 (critic T-4: "Black olives wins"): a name that is a plural noun takes "win", "are" … */
const SINGULAR_S = /(?:ss|us|is|ous|hummus|couscous|asparagus|swiss|molasses|series|species)$/i;
const PLURAL_NOUN = /(?:fries|chips|cevapi|nuggets|sticks|cakes|olives|berries|beans|peas|lentils|nuts|seeds|almonds|walnuts|hazelnuts|peanuts|crackers|cookies|crepes|pancakes|grapes|dates|figs|strawberries|blueberries|raspberries|cherries|noodles|oats|flakes|sardines|mushrooms|vegetables|eggs|tomatoes|potatoes|sprouts|wings|ribs|shrimps?|prawns|mussels|pretzels|pieces|slices)$/i;
export const isPluralName = (name: string) => {
  const n = name.replace(/\s*\([^)]*\)/g, '').replace(/\s+(?:with|without|over)\s.*$/i, '').trim();
  if (/^(?:[2-9]|\d{2,}|½)\s/.test(n) && !/^\d+(?:[.,]\d+)?\s*(?:ml|g|l|cl)\b/i.test(n)) return true; // "2 crepes"; "500 ml of beer" is one
  const last = n.split(/\s+/).pop() ?? '';
  return PLURAL_NOUN.test(last) || (/[^s]s$/i.test(last) && !SINGULAR_S.test(last) && last.length > 3);
};
