# GI estimates and alcohol-free beer: verification against the sources (2026-11-05)

Round 18 (commit 51a96e2) added `app/src/v4/food/giEstimate.ts`: a food with no measured glycemic index, at least
10 g available carbohydrate and under 0.6 g alcohol per 100 g counts with "the typical GI of its kind". The values
were written from memory as "Atkinson-table category means" and were never checked. The alcohol-free beer variant
(`beer.alcohol-free`) kept USDA's 8.05 g sugar per 100 g. This note re-reads every value in the primary tables.

## Sources read

- **T08**: Atkinson FS, Foster-Powell K, Brand-Miller JC. International tables of glycemic index and glycemic load
  values: 2008. Diabetes Care 2008;31:2281-3 (PMC2584181), Table 1 ("The average GI of 62 common foods derived from
  multiple studies"), read in `research/sources/PMC2584181.xml`.
- **A1 / A2**: the same paper's online Supplementary Tables A1 and A2 (`dc08-1239_1.pdf`, `dc08-1239_2.pdf`),
  read with `pdftotext -raw`.
- **S21**: Atkinson FS, Brand-Miller JC, Foster-Powell K, Buyken AE, Goletzke J. International tables of glycemic
  index and glycemic load values 2021: a systematic review. Am J Clin Nutr 2021;114:1625-32
  (doi 10.1093/ajcn/nqab233), Supplemental Table 1 (studies using ISO 26642:2010 methods), read with
  `pdftotext -raw` (PDF copy: nutritotal.com.br/pro/wp-content/uploads/2021/09/Tabela1_IG.pdf, 139 pages);
  Supplemental Table 2 (other methods) for beetroot and soda crackers.
- **Alcohol-free beer**: USDA FoodData Central SR Legacy 174863 "Malt beverage, includes non-alcoholic beer" (local
  SR Legacy CSV, April 2018); Heineken 0.0 product page of Grupa Żywiec (Heineken Poland,
  https://grupazywiec.pl/?p=3824); Open Food Facts 8712000050115 (Heineken 0.0), 8594404001302 (Birell),
  4102430315207 (Bitburger Pils 0.0%).

**How we computed category values.** S21 prints a "mean of n foods" for some groups, and we used it where one fits.
For a whole category we took the **median of every food listed in that section of S21 Supplemental Table 1**. A
script parsed each row's GI ("GI ± SEM, GL, Subjects") from the raw PDF text and checked the row numbers for
completeness: every row number in the range is present once (a few rows' numbers show up as page numbers after a
page break, but their GI is still counted once). T08 Table 1 values are means of many studies and win where the
food matches. Medians are rounded half up.

## Results: category values

"Items now" = the foods in the app that get this estimate (from `auditItems()`, every item, variant and builder
choice).

| Kind (giEstimate.ts) | Old value | Verified value | Source / computation | Items now |
|---|---|---|---|---|
| Malted drinks / beer (alcohol-free only) | 66 ("beer and malt beverages in the tables, ~66") | **80** ("alcohol-free beer") | S21 row 74: Beer, non-alcoholic (0.0%), Nikolai Lager (Finland), 80 ± 6, 10 subjects, the only alcohol-free beer tested. The 66 is a single non-ISO test of Toohey's New, a beer with alcohol (S21 Suppl. Table 2 row 2133, 9 subjects, 10 g portions). S21 beer with alcohol: mean of two foods **104** (119 and 89). | none now: alcohol-free beer gets the measured 80 directly (GI key `t21_nab`) |
| Cocoa drinks made with milk | 40 | **41** | A1 row 98: Quik chocolate made with 1.5% fat milk, 41 ± 4 (nearest tested food; S21 chocolate-flavored milks 26-37; the same powder in water 53, A1 row 97) | Hot chocolate (homemade, with milk) |
| Ice cream | 51 | **51** ✓ | T08 Table 1: Ice cream 51 ± 3 | Chocolate ice cream |
| Custard (was inside ice cream, 51) | 51 | **33** | S21: Custard, mean of four foods 33 (rows 891-894) | none |
| Pudding (was inside ice cream, 51) | 51 | **46** | S21: Flavored milk pudding, mean of three foods 46 (rows 965-967) | none |
| Cakes and pastries | 55 | split, see the next three rows | the 55 was not a printed value | |
| Pastries and other bakery products | 55 | **56** | S21 Bakery products, median of all 71 rows (1-71), 56 (mean 57.7) | Burek, Spinach burek, Apple strudel |
| Cakes | 55 | **53** | S21 Cakes, median of the 19 rows 1-19 (20, 37, 38, 38, 42, 43, 47, 50, 51, **53**, 56, 57, 58, 60, 60, 61, 66, 66, 73), mean 51.4 | Cheesecake, Cream cake |
| Cookies and biscuits | 55 | **48** | S21 Cookies, median of the 135 rows 715-849, 48 (mean 49.2) | none |
| Beetroot | 64 ("~64", called a category value) | **64**, value ✓, source corrected | A2 row 2369: Beetroot (Canada), 64 ± 16, **5 subjects, a single test** (also S21 Suppl. Table 2 row 3588). No ISO test exists. The card says "from one small test". | Pickled beetroot |
| Dairy foods | 35 | **34** | S21 Dairy products and alternatives, median of the 187 rows read in 891-1078, 34 (mean 35.9). Printed means for comparison: full-fat milk 37, all yoghurts 33, plain kefir 36. | Lactose-free milk, Buttermilk / ayran, Protein shake (whey + milk), Soy yogurt |
| Ham subs and cheese toast (matched the dairy kind because of "cheese") | 35 | **75** (white bread) | Their carbohydrate is the bread. The bread kind now comes before the dairy kind and also matches "sandwich", "sub" and "toast". T08 Table 1: white wheat bread 75 ± 2. | 2 ham subs, Ham and cheese toast |
| Fruit juices | 46 | **47** | S21 Fruit and vegetable juices rows 1180-1206 without the tomato and carrot juices: median of 24 fruit juices, 47 (mean 49.0). T08: apple juice 41, orange juice 50. | Apricot nectar, Peach nectar, Pear nectar |
| Sugars and sweets | 65 | split: sugar, syrup **65**; honey **61**; jam **49**; sugar sweets **69** | T08 Table 1: sucrose 65 ± 4, honey 61 ± 3, strawberry jam 49 ± 3. S21 sugar sweets, median of rows 1606, 1607, 1610, 1611, 1615, 1616, 1629, 1635, 1636 (53, 76, 69, 78, 62, 67, 70, 76, 43) = 69 | none |
| White bread | 75 | **75** ✓ | T08 Table 1: white wheat bread 75 ± 2 (S21: white wheat flour bread, mean of 35 foods 73) | Baguette / French bread, Baguette sandwich |
| Saltines / soda crackers (were "white bread and crackers", 75) | 75 | **74** | A2 row 2140: Premium Soda Crackers (Canada) 74 (people with diabetes); A1 rows 740-741: water crackers 63 and 78. Median of the three is 74. | Crackers (saltines) |
| Other crackers | 75 | **56** | S21 Crackers, median of the 41 rows 850-890, 56 (mean 54.7) | none |
| Legumes | 30 | **36** | S21 Legumes, median of the 32 rows 1278-1309, 36 (mean 33.6). T08 Table 1: chickpeas 28, kidney beans 24, lentils 32, soya beans 16 (mean 25). | none |
| Bean and lentil soups (were "legumes", 30) | 30 | **55** | S21 Soups with beans or lentils: rows 1720 (57), 1721 (46), 1725 (62), 1726 (57), 1731 Pasta & Fagioli (52), 1738 Vegetarian Chili (36): median 54.5, rounded to 55 (mean 51.7) | Bean soup (with ham), Bean soup with sausage |
| Breaded foods | 40 ("fish fingers ~38") | **42**; fish fingers **38** | A2 row 2246: Fish Fingers (Canada) 38 ± 6, 5 subjects; A1 row 1183: chicken nuggets 46 ± 4. Mean of the two is 42. The 2021 tables have no breaded foods. | Fish sticks (38) |
| Soups and mixed dishes | 50 | **48** | S21 Soups, median of all 21 rows 1719-1739, 48 (mean 49.4) | none |
| Potato salad (was "mixed dishes", 50) | 50 | **49** | S21: Potato cooked then cooled, mean of eight foods 49 | Potato salad (with mayonnaise) |
| Nuts (were in the default, 25) | 25 | **22** | S21 Nuts, the three rows 1431-1433 (22, 21, 24): median 22 | none |
| Default: vegetables and similar foods | 25 | **40** | T08 text: "In the case of low-carbohydrate products, a GI value of 40 for vegetables, 70 for flour products, and 30 for dairy foods could be assigned." | none |

**Count.** 13 categories went in. Three values were right: ice cream 51, white bread 75, and sucrose 65 for sugar.
Beetroot 64 had the right number but the wrong source: it is one small test, not a category mean. Ten values were
wrong: malted/alcohol-free beer, cocoa, cakes and pastries, dairy, fruit juices, crackers, legumes (bean soups
above all), breaded foods, mixed dishes and the default. A matching bug also gave three ham sandwiches/toasts the
dairy value. The biggest corrections for items that are in the app now are:

- bean soups 30 → 55
- ham subs and cheese toast 35 → 75 (matching bug)
- alcohol-free beer 66 (estimate) → 80 (measured)

**Limitation.** Lactose-free milk takes the milk-products value 34. Its lactose is split into glucose and galactose,
so its real GI is probably higher, but no lactose-free milk appears in either table. The value is an estimate and
the card says so.

## Alcohol-free beer: nutrition

| Field per 100 ml | Old (USDA 174863) | Verified, used now | Source |
|---|---|---|---|
| Energy | 37 kcal | **21 kcal** | Heineken 0.0 label (Grupa Żywiec page; Open Food Facts 8712000050115): 89 kJ / 21 kcal |
| Carbohydrate | 8.05 g | **4.8 g** | the same label |
| Sugars | 8.05 g (USDA sets sugars = all carbohydrate) | **1.3 g** | the same label |
| Fat / saturates / protein | 0.12 / 0.02 / 0.21 g | **0 / 0 / 0 g** | the same label |
| Alcohol | 0.3 g | **0.0** | the same label, 0.0% vol. |
| GI | none (estimate 66) | **80** (measured) | S21 row 74 (Nikolai 0.0% lager) |
| Range | 105-186 kcal per 0.5 l | **105-165 kcal per 0.5 l**; per 100 ml kcal 21-33, carbohydrate 3.9-7.8 g, sugars 1.3-4.4 g | Birell 21 kcal / 5.0 g / 2.4 g; Bitburger Pils 0.0% 33 kcal / 7.8 g / 4.4 g; Nikolai in S21 row 74: 25 g available carbohydrate in 640 g = 3.9 g per 100 g |

The old 8.05 g was copied correctly from USDA. The USDA record is a US "malt beverage" (sweet malt drinks included),
and its sugar equals its whole carbohydrate. That is 2 to 6 times the sugar on EU 0.0% lager labels. The new values
are a label override (`override("beer.alcohol-free", "per100ml", …)` in `research/tools/fooddb_spec.py`, level A
for that product), following the cola and energy-drink EU-label overrides. Sodium, water and minerals stay from
USDA. The label gives salt < 0.01 g, which is under 4 mg sodium (USDA has 13 mg); the note says so.

## What changed in the code

- `app/src/v4/food/giEstimate.ts`: verified values, split kinds, a source comment on every row, and the bread kind
  before the dairy kind.
- `app/src/v4/food/parse.ts`: `macros()` returns `giEstimated` (name, GI, kind) next to `missingGi`.
- `app/src/v4/food/foodProduct.ts`: the first card now says "…has not been measured, so the sugar curve uses an
  estimate: GI 41, the typical value for cocoa drinks made with milk." A part with no estimate (an alcoholic
  drink, or under 10 g carbohydrate) is now said to be left out. Before, the card claimed a "typical value" was
  used for it.
- `app/src/content/food.ts`: claim DB3 still said "Foods without a measured GI show no sugar curve rather than a
  guess", which has been false since round 18. It now describes the estimate. A new source `atkinson2021` was
  added.
- `app/src/v4/variants.test.ts`: the NO_GI allow-list entry `'beer.alcohol-free': 'no alcohol-free beer tested'`
  was wrong (S21 row 74 is one) and became a comment.
- `research/tools/build_fooddb.py`: new GI key `t21_nab` (80, S21 row 74).
- `research/tools/fooddb_spec.py`: `beer.alcohol-free` now has `gi="t21_nab"`, the EU label override and the new
  range. The database was rebuilt (`python -I -X utf8 build_fooddb.py build`: 178 foods, 0 fails).

Checks: `npx tsc --noEmit -p .` shows no errors in these files. The one error it prints is in the untracked
`app/src/v4/voice-tts.ts`, which belongs to other work. `npx vitest run`: 40 files passed, 867 tests, including
category-matrix and text-audit.

Card examples after the change:
- "The glycemic index of bean soup (with ham) has not been measured, so the sugar curve uses an estimate: GI 55,
  the typical value for bean and lentil soups."
- "500 ml of alcohol-free beer. 105 kcal: 24 g carbohydrate (7 g sugar, about 2 teaspoons) … Glycemic index 80 (high)."
