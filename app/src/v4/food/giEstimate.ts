// Round 18 (critique g, T-3: hot chocolate showed "7 teaspoons of sugar" and then no sugar story, because its
// glycemic index was never measured): the sugar story must never depend on a measured GI being present. A food
// without a measured GI gets the typical GI of its kind, from the category values of the international GI tables
// (Atkinson, Foster-Powell & Brand-Miller 2008, Diabetes Care 31:2281, Table A1), and the first card says that it is
// an estimate. A measured GI always wins.
import type { Food } from './parse';

/** [what, GI] in order: the first kind that fits. Values: the tables' typical (median) GI for the category. */
const KINDS: [(f: Food, n: string) => boolean, number, string][] = [
  // malted drinks and beer: maltose (beer and malt beverages in the tables, ~66)
  [(_f, n) => /\b(beer|malt|radler|shandy)\b/.test(n), 66, 'malted drinks'],
  // cocoa drinks made with milk (~40)
  [(_f, n) => /\b(hot chocolate|cocoa|chocolate milk)\b/.test(n), 40, 'cocoa milk drinks'],
  // ice cream and creamy desserts (~51)
  [(_f, n) => /\b(ice cream|gelato|pudding|custard)\b/.test(n), 51, 'ice cream'],
  // cakes, cookies, pastries (~55)
  [(_f, n) => /\b(cake|cheesecake|strudel|cookie|cookies|biscuit|biscuits|pastry|burek|croissant|muffin|donut|doughnut|pie)\b/.test(n), 55, 'cakes and pastries'],
  // beetroot (~64)
  [(_f, n) => /\b(beetroot|beet)\b/.test(n), 64, 'beetroot'],
  // milk, yogurt, cheese, kefir, buttermilk, milk coffees and shakes: lactose (~35)
  [(_f, n) => /\b(milk|yogurt|yoghurt|skyr|kefir|buttermilk|ayran|cheese|cream|macchiato|latte|cappuccino|whey|protein shake)\b/.test(n), 35, 'dairy foods'],
  // fruit juices and nectars (~46), wine and fruit-sweetened drinks
  [(_f, n) => /\b(juice|nectar|smoothie|wine|cider|coconut water)\b/.test(n), 46, 'fruit juices'],
  // sweets: candy, honey, jam, syrups (~65)
  [(_f, n) => /\b(candy|sweets|gummy|jelly beans|honey|jam|syrup|sugar)\b/.test(n), 65, 'sugars and sweets'],
  // white bread, baguette, crackers (~75)
  [(_f, n) => /\b(bread|baguette|bun|roll|crackers?|saltines?|toast)\b/.test(n), 75, 'white bread and crackers'],
  // legumes and bean soups (~30)
  [(_f, n) => /\b(bean|beans|lentil|lentils|chickpea|chickpeas|peas)\b/.test(n), 30, 'legumes'],
  // breaded or battered fish and meat (fish fingers ~38)
  [(_f, n) => /\b(breaded|schnitzel|fish sticks|fish fingers|calamari|nuggets)\b/.test(n), 40, 'breaded foods'],
  // soups and mixed dishes (~50)
  [(_f, n) => /\b(soup|stew|salad)\b/.test(n) && !/\b(green|rocket|tomato|cucumber|lettuce)\b/.test(n), 50, 'mixed dishes'],
  // nuts, seeds, olives, avocado, vegetables, cured meats: little sugar, slow (~25)
  [() => true, 25, 'vegetables, nuts and similar foods'],
];

/** The typical GI of this food's kind, for a food whose GI was never measured. */
export function estimatedGi(f: Food): { gi: number; kind: string } {
  const n = `${f.name} ${f.base?.name ?? ''}`.toLowerCase();
  const k = KINDS.find(([t]) => t(f, n))!;
  return { gi: k[1], kind: k[2] };
}
