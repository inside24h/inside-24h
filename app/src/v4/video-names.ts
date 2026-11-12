// Round 18 (critique g, T-6 / V-5 / V-6): one place for the names a video says, so the single video, the comparison,
// its verdict and its captions all say the same name ("Cevapi", "Brie", "Fruit yogurt", "Beef wrap kebab",
// "Green salad with olive oil", "Pizza with tuna & egg"), lower case inside a sentence.

/** Round 9: on screen in plain American spelling ("Ćevapi" → "Cevapi"). */
export const plainLatin = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

// round 17 (critic G-8 / G-4): "Brie cheese" is "Brie", "Cod / white fish" is "Cod"
const CHEESE_NAMED = /\b(brie|camembert|cheddar|gouda|edam|parmesan|emmental|emmentaler|mozzarella|feta|gorgonzola|halloumi|ricotta|mascarpone) cheese\b/i;
/** The amount in front of a name ("1 portion of", "8 slices of", "A whole 14-inch", "half a"): not part of the name. */
export const AMOUNT_PREFIX = /^(?:\d+(?:[.,]\d+)?|½|a|an|one|half(?: a| an)?)\s+(?:whole\s+)?(?:\d+-inch\s+)?(?:(?:small|medium|large|side)\s+)?(?:(?:portions?|pieces?|slices?|cups?|glass(?:es)?|bowls?|cans?|bottles?|containers?|servings?|plates?|fillets?|scoops?|pots?|shakers?|ml|g|l|cl|dl)\s+of\s+)?/i; // (C18: "250 ml of" too, never a bare "Ml of cranberry juice")
const wordsOf = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
/** Round 18 (critic V-6 / T-6): the add-ons that change a food most come first (meat, fish, egg, cheese, fat). */
const KEY_ADDON = /\b(bacon|extra patty|patty|pepperoni|salami|ham|sausage|tuna|chicken|beef|egg|cheese|olive oil|sunflower oil|oil|butter|mayonnaise|cream|chocolate)\b/i;

/** The name a video says: no "(…)", the first of "A / B", the first add-ons that fit (round 17), never a bare noun
 *  that hides what was added. */
export const shortName = (n: string) => {
  const kind = /^Cheese \(([a-z]+)\)$/i.exec(plainLatin(n).trim())?.[1]; // "Cheese (cheddar)" is "Cheddar"
  if (kind && CHEESE_NAMED.test(`${kind} cheese`)) return kind.charAt(0).toUpperCase() + kind.slice(1);
  let s = plainLatin(n).replace(/\s*\([^)]*\)/g, '').replace(/\s+\/\s+[^,]*?(?=\s+(?:with|without)\s|,|$)/, '').replace(CHEESE_NAMED, '$1').trim();
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
/** A name inside a sentence ("orange juice"), unless an acronym or brand-like ("USDA", "McFlurry"). */
export const lowerName = (s: string) => (/^[A-Z][a-z]/.test(s) && !/^[A-Z][a-z]+[A-Z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
/** Round 18 (critic T-4: "Black olives wins"): a name that is a plural noun takes "win", "are" … */
const SINGULAR_S = /(?:ss|us|is|ous|hummus|couscous|asparagus|swiss|molasses|series|species)$/i;
const PLURAL_NOUN = /(?:fries|chips|cevapi|nuggets|sticks|cakes|olives|berries|beans|peas|lentils|nuts|seeds|almonds|walnuts|hazelnuts|peanuts|crackers|cookies|crepes|pancakes|grapes|dates|figs|strawberries|blueberries|raspberries|cherries|noodles|oats|flakes|sardines|mushrooms|vegetables|eggs|tomatoes|potatoes|sprouts|wings|ribs|shrimps?|prawns|mussels|pretzels|pieces|slices)$/i;
export const isPluralName = (name: string) => {
  const n = name.replace(/\s*\([^)]*\)/g, '').replace(/\s+(?:with|without|over)\s.*$/i, '').trim();
  if (/^(?:[2-9]|\d{2,}|½)\s/.test(n) && !/^\d+(?:[.,]\d+)?\s*(?:ml|g|l|cl)\b/i.test(n)) return true; // "2 crepes"; "500 ml of beer" is one
  const last = n.split(/\s+/).pop() ?? '';
  return PLURAL_NOUN.test(last) || (/[^s]s$/i.test(last) && !SINGULAR_S.test(last) && last.length > 3);
};
