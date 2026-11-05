// Round 18 (critique g, T-3: hot chocolate showed "7 teaspoons of sugar" and then no sugar story, because its
// glycemic index was never measured): the sugar story must never depend on a measured GI being present. A food
// without a measured GI gets the typical GI of its kind, and the first card says that it is an estimate and for which
// kind of food (foodProduct.ts giLine). A measured GI always wins.
//
// 2026-11-05 verification (research/improvements/gi-estimates-verification-2026-11-05.md): every value below was
// re-read in the tables, replacing values first written from memory. Sources and how each number was computed:
//  T08 = Atkinson, Foster-Powell & Brand-Miller 2008, Diabetes Care 31:2281 (PMC2584181), Table 1 (means of many studies)
//  A1 / A2 = its online Supplementary Tables A1 (healthy subjects) / A2 (other data)
//  S21 = Atkinson et al. 2021, Am J Clin Nutr 114:1625 (doi 10.1093/ajcn/nqab233), Supplemental Table 1 (ISO 26642
//        methods); "median of n rows" = our median of every food listed in that section, rows named
import type { Food } from './parse';

/** [test, GI, kind] in order: the first kind that fits. `kind` completes "the typical value for …". */
const KINDS: [(f: Food, n: string) => boolean, number, string][] = [
  // S21 row 74: Beer, non-alcoholic (0.0%), Nikolai Lager (Finland), 80 ± 6, the only alcohol-free beer tested
  // (only alcohol-free drinks reach this table: parse.ts gives no estimate from 0.6 g alcohol per 100 g)
  [(_f, n) => /\b(beer|malt|radler|shandy)\b/.test(n) && !/\b(ginger|root) beer\b/.test(n), 80, 'alcohol-free beer'],
  // A1 row 98: Quik chocolate powder made with 1.5% fat milk, 41 ± 4 (nearest tested food; flavored milks S21 26-37)
  [(_f, n) => /\b(hot chocolate|cocoa|chocolate milk)\b/.test(n), 41, 'cocoa drinks made with milk'],
  // T08: Ice cream, 51 ± 3
  [(_f, n) => /\b(ice cream|gelato)\b/.test(n), 51, 'ice cream'],
  // S21: Custard, mean of four foods 33 (rows 891-894)
  [(_f, n) => /\bcustard\b/.test(n), 33, 'custard'],
  // S21: Flavored milk pudding, mean of three foods 46 (rows 965-967)
  [(_f, n) => /\bpudding\b/.test(n), 46, 'milk puddings'],
  // S21 bakery products, median of all 71 rows (1-71: cakes, croissants, pastries, muffins, doughnut, buns), 56
  [(_f, n) => /\b(pastry|burek|strudel|croissant|donut|doughnut|danish|pie)\b/.test(n), 56, 'pastries and other bakery products'],
  // S21 cakes, median of the 19 rows 1-19, 53 (mean 51)
  [(_f, n) => /\b(cake|cheesecake|gateau|torte|muffin|muffins)\b/.test(n), 53, 'cakes'],
  // S21 cookies, median of the 135 rows 715-849, 48 (mean 49)
  [(_f, n) => /\b(cookie|cookies|biscuit|biscuits)\b/.test(n), 48, 'cookies and biscuits'],
  // A2 row 2369: Beetroot (Canada), 64 ± 16, 5 subjects: the only beetroot test (also S21 Suppl. Table 2 row 3588)
  [(_f, n) => /\b(beetroot|beet)\b/.test(n), 64, 'beetroot, from one small test'],
  // S21: Potato cooked then cooled, mean of eight foods 49
  [(_f, n) => /\bpotato salad\b/.test(n), 49, 'cooked and cooled potatoes'],
  // S21 soups made with beans or lentils, median of rows 1720, 1721, 1725, 1726, 1731, 1738 (57, 46, 62, 57, 52, 36): 54.5
  [(_f, n) => /\b(soup|stew)\b/.test(n) && /\b(bean|beans|lentil|lentils|chickpea|chickpeas|pea|peas|fagioli)\b/.test(n), 55, 'bean and lentil soups'],
  // A2 row 2140: Premium Soda Crackers (Canada) 74; water crackers A1 rows 740-741: 63 and 78 (median of the three 74)
  [(_f, n) => /\b(saltines?|soda crackers?|water crackers?)\b/.test(n), 74, 'soda crackers'],
  // S21 crackers, median of the 41 rows 850-890, 56
  [(_f, n) => /\bcrackers?\b/.test(n), 56, 'crackers'],
  // T08: White wheat bread, 75 ± 2 (sandwiches too: their carbohydrate is the bread, before the cheese of the dairy kind)
  [(_f, n) => /\b(bread|baguette|bun|roll|toast|sandwich|sub)\b/.test(n), 75, 'white bread'],
  // S21 dairy products and alternatives, median of the 187 rows read in 891-1078, 34 (mean 36)
  [(_f, n) => /\b(milk|yogurt|yoghurt|skyr|kefir|buttermilk|ayran|cheese|cream|macchiato|latte|cappuccino|whey|protein shake)\b/.test(n), 34, 'milk products'],
  // S21 fruit juices, median of the 24 fruit juices in rows 1180-1206 (tomato and carrot juices left out), 47
  [(_f, n) => /\b(juice|nectar|smoothie|wine|cider|coconut water)\b/.test(n), 47, 'fruit juices'],
  // T08: Honey, 61 ± 3
  [(_f, n) => /\bhoney\b/.test(n), 61, 'honey'],
  // T08: Strawberry jam/jelly, 49 ± 3
  [(_f, n) => /\b(jam|marmalade|jelly)\b/.test(n) && !/\bjelly beans?\b/.test(n), 49, 'jam'],
  // S21 sugar sweets, median of rows 1606, 1607, 1610, 1611, 1615, 1616, 1629, 1635, 1636 (jelly, jelly beans,
  // licorice ×2, marshmallows ×2, Skittles, Sour Straws, lollies): 69
  [(_f, n) => /\b(candy|sweets|gummy|gummies|jelly beans?|lollies|marshmallows?|licorice|liquorice)\b/.test(n), 69, 'sugar sweets'],
  // T08: Sucrose, 65 ± 4
  [(_f, n) => /\b(sugar|syrup)\b/.test(n), 65, 'table sugar'],
  // A2 row 2246: Fish Fingers (Canada), 38 ± 6, 5 subjects
  [(_f, n) => /\b(fish sticks|fish fingers)\b/.test(n), 38, 'fish fingers'],
  // mean of fish fingers 38 (A2 row 2246) and chicken nuggets 46 ± 4 (A1 row 1183): 42
  [(_f, n) => /\b(breaded|schnitzel|calamari|nuggets)\b/.test(n), 42, 'breaded foods'],
  // S21 soups, median of all 21 rows 1719-1739, 48 (mean 49)
  [(_f, n) => /\b(soup|stew|salad)\b/.test(n) && !/\b(green|rocket|tomato|cucumber|lettuce)\b/.test(n), 48, 'soups and mixed dishes'],
  // S21 legumes, median of all 32 rows 1278-1309, 36 (mean 34)
  [(_f, n) => /\b(bean|beans|lentil|lentils|chickpea|chickpeas|peas)\b/.test(n), 36, 'beans and lentils'],
  // S21 nuts, median of the three rows 1431-1433 (22, 21, 24): 22
  [(_f, n) => /\b(nut|nuts|almonds?|walnuts?|cashews?|peanuts?|hazelnuts?|pistachios?|seeds)\b/.test(n), 22, 'nuts'],
  // T08 text: "In the case of low-carbohydrate products, a GI value of 40 for vegetables, 70 for flour products, and 30
  // for dairy foods could be assigned" (the authors' own default for foods without data)
  [() => true, 40, 'vegetables and similar foods'],
];

/** The typical GI of this food's kind, for a food whose GI was never measured. */
export function estimatedGi(f: Food): { gi: number; kind: string } {
  const n = `${f.name} ${f.base?.name ?? ''}`.toLowerCase();
  const k = KINDS.find(([t]) => t(f, n))!;
  return { gi: k[1], kind: k[2] };
}
