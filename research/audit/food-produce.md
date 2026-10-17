# Food audit: fruit, vegetables, legumes, nuts, soups (2026-10-17)

Auditor scope: 53 foods (list in the brief). I am read-only. I changed no project file and wrote only this file.

## What I checked and how

- **Spec**: `research/tools/fooddb_spec.py` lines 202-311. **Build**: `research/tools/build_fooddb.py`, which holds the GI table and the free-sugar logic.
- **App data**: `app/src/v4/food/fooddb.json` uses a slimmer schema, but for all 53 foods it matches `research/fooddb.json` field by field (name, aliases, serving, per-100 g values, GI). I compared them with a script.
- **App overrides** in `app/src/v4/food/parse.ts`:
  - `SERVING_FIX`: sunflower-seeds = 30 g; dried-apricots and dried-figs = 1 handful, 40 g.
  - `GI_ADD`: grapes 59, cherries 63, kiwi 58, strawberries 40, melon 65, peas 51, beans-white 31, hummus 6.
  - Nothing else in `app/src` hard-codes nutrition for these foods. `analyze.ts` SWAPS and `catalog.ts` only hold names.
- **USDA**: every record was read with `usda_sr.py show <fdc>`, along with the alternative records named below. All per-100 g values in fooddb.json equal the USDA values.
  - kcal fit USDA's specific Atwater factors. The plain 4/4/9 sum overshoots only because total carbohydrate includes fiber, so there are no outliers.
  - Missing USDA values are null, not 0, in the data. The one exception at the meal level is listed under P-L6.
- **GI**:
  - Table 1 values were checked in the cached full text `research/sources/PMC2584181.xml`.
  - Supplementary Table A1 (healthy subjects) was downloaded from Europe PMC (`/PMC2584181/supplementaryFiles`, file `dc08-1239_1.pdf`) into my scratchpad and converted with `pdftotext -raw`. That mode keeps each row's name and numbers on one line; `-layout` misaligns them.
  - Row numbers below are A1 row numbers.
- **Alias resolution**: I ported `matchScore` from `parse.ts` into a Python script, line for line, and ran Croatian and English inputs through it.

## Verdict per food

### Fruit
| id | verdict |
|---|---|
| apple | OK. Record 171688 (raw, with skin), 182 g medium. Table 1 "Apple, raw" 36 ± 2. |
| banana | OK. 118 g medium. Table 1 51 ± 3. Free sugars 0. |
| orange | OK. 131 g. Table 1 43 ± 3. |
| mandarin | OK. GI null is correct: A1 has only canned segments in juice (row 989, 47 ± 2). |
| grapes | OK. GI 59 (app) = A1 row 984, black grapes, 11 normal subjects, bread reference, one test. |
| strawberries | OK. GI 40 (app) = A1 row 1023, 40 ± 7. |
| watermelon | **Serving unrealistic.** The "1 cup, balls" portion (154 g) is picked because `cup` comes first in the regex. USDA also has "wedge (approx 1/16 of melon)" = 286 g and NLEA serving = 280 g. A slice of watermelon in Croatia is ~250-400 g, so GL is understated about 2×. GI 76 ± 4 (Table 1) is OK. |
| melon | Minor. A1 has two cantaloupe tests: row 1021 = 65 ± 9 (bread reference, 8 subjects) and row 1022 = 70 (glucose reference, 10 subjects). The app uses 65. The parse.ts comment says "only foods with one value", which is not true here. |
| pear | OK. GI null is correct: fresh pear was tested only in people with diabetes (A2). |
| peach | Alias `nektarina` maps to peach. Nectarine is its own USDA record: 169914, 44 kcal vs 39. Low. GI null is correct. |
| cherries | **Alias `višnje`/`visnje` = sour cherries**, which is a different fruit: USDA 173954 has 50 kcal and 8.5 g sugar, vs sweet 63 kcal and 12.8 g. The GI 63 is for dark sweet cherries (A1 row 970). Sour cherries tested 41 ± 5 (row 971, canned). |
| plum | OK. GI null is correct (A2, people with diabetes only). |
| kiwi | OK. GI 58 = A1 row 987, 58 ± 7, 7 subjects. |
| pineapple | OK. Table 1 59 ± 8. |
| blueberries | OK. GI null. The only healthy test is wild blueberries, 53 ± 7 (row 965, bread reference). It could be added as a proxy (see Open questions). |
| avocado | **Record and serving**: 171705 is "all commercial varieties". Its whole-fruit portion is "1 avocado, NS as to Florida or California" = 201 g. The EU market is mostly Hass: USDA 171706 "Avocados, raw, California" has 167 kcal, 15.4 g fat, and 1 fruit without skin and seed = 136 g. The label "NS as to Florida or California" also shows on screen. |
| raisins | Free sugars 0: OK (see the free-sugar section). Serving 43 g (small box) is OK. **GI missing** although A1 has Raisins (Canada) 64 ± 11 (row 1018, 6 subjects). Sultanas have a "mean of three studies" of 57 (rows 1029-1031). |
| dried-apricots | Free sugars 0: OK. App serving 40 g handful: OK. **GI missing** although A1 gives a "mean of three studies" = **31** (rows 950-952: 30 ± 7, 31 ± 6, 32 ± 7, all normal subjects). That is the strongest dried-fruit value in the table. **Alias `marelice` alone maps here**, so fresh apricots (a summer staple) get dried values: 241 vs 48 kcal per 100 g. |
| dried-figs | Free sugars 0: OK. App serving 40 g: OK. **GI missing**: A1 row 979 "Figs, dried, tenderised" 61 ± 6, 10 normal subjects. **Aliases `smokve`/`smokva` map here**, so fresh figs (very common in Dalmatia) get dried values: 249 kcal and 48 g sugar per 100 g, vs ~74 kcal for fresh. |
| dates | OK. Deglet Noor, 1 date = 7.1 g. Table 1 "Dates, raw" 42 ± 4 is the mean of five dried-date studies (A1 rows 973-977), so the mapping fits. |

### Vegetables
| id | verdict |
|---|---|
| salad-lettuce | Low. The record is romaine. Croatian "zelena salata" is mostly butterhead or leaf lettuce: 168429 has 13 kcal, 169249 has 15 kcal, vs 17. The difference is small. Alias `zelena` alone maps to lettuce, which is acceptable. |
| cabbage | OK. |
| sauerkraut | OK. US canned, sodium 661 mg/100 g, which is plausible for kiseli kupus. Alias `kiseli` alone maps here, so "kiseli krastavci" (pickles) does not resolve. Pickles are missing from the database. Low. |
| tomato | OK. |
| cucumber | Low. One serving = the whole cucumber, 301 g, because the regex matches "cucumber" first. That is literally right for "1 krastavac", but heavy as a default "serving". USDA also has ½ cup slices = 52 g. |
| carrot | **GI note is factually wrong.** The note says "raw carrot is not separately listed". A1 rows 1621-1622 list "Carrots, raw, diced" 35 ± 5 and "raw, ground" 39 ± 1, both normal subjects, 7 each. A medium carrot has 4.1 g of available carbohydrate, so it does show up in `missingGi`. |
| broccoli | OK. Labelled raw, and per 100 g it is almost the same as cooked. |
| onion | **Alias `bijeli luk` = garlic.** "bijeli luk" resolves to onion with score 10: 1 medium onion = 110 g, 44 kcal. Garlic (169230) has 149 kcal per 100 g and 1 clove = 3 g. "češnjak" finds nothing. |
| pepper-red | Low. Alias `paprika` covers green and yellow peppers too, which are the most common in Croatia (green 170427: 20 kcal). The name says red, so this is honest. |
| spinach | **Alias `blitva` = Swiss chard** (169991: 19 kcal, sodium 213 mg vs 79). **Serving**: 1 cup raw = 30 g, but in Croatia špinat is eaten cooked. USDA 168463 (boiled) is almost the same per 100 g (23 kcal) and gives 1 cup = 180 g. "kuhani špinat" does not resolve at all. |
| zucchini | OK. |
| mushrooms | OK. |
| sweet-corn | OK. Table 1 "Sweet corn" 52 ± 5. Croatians mostly buy canned. Open question on sodium. |
| sweet-potato | OK. Table 1 "Sweet potato, boiled" 63 ± 6. |
| olives | **Record and serving.** 169094 is US "ripe" black olives (lye-cured): sodium 735 mg, fat 10.9 g. Mediterranean or Croatian brine-cured olives are closer to 169096 "Olives, pickled, canned or bottled, green": sodium 1556 mg, fat 15.3 g, 145 kcal. So sodium is understated about 2×. One serving = 1 large olive (4.4 g), which is not a portion. The name "Olives (canned, ripe)" is US jargon. |

### Legumes
| id | verdict |
|---|---|
| beans-kidney | OK. Boiled from dry, without salt. Table 1 "Kidney beans" 24 ± 4. The aliases `grah`, `beans` and `pasulj` win ties here, which is acceptable. |
| beans-white | OK. GI 31 = A1 row 1099, haricot/navy, boiled, 6 subjects. Alias `tavče gravče` is a baked dish, so it is a proxy (low). |
| lentils | Low. Alias `grah` (beans) is wrong for lentils. It never wins because of DB order, but it shows in suggestions. Alias `lećа` contains a **Cyrillic а (U+0430)**, which is junk. Table 1 "Lentils" 32 ± 5: OK. |
| chickpeas | **Alias `leblebije`** means roasted dry chickpeas, a snack of about 360+ kcal per 100 g. It maps to boiled chickpeas (164 kcal). Table 1 "Chickpeas" 28 ± 9: OK for boiled. Canned tested 38 ± 3 (A1 row 1096). |
| peas | OK. GI 51 = A1 row 1611 (frozen, boiled, 6 subjects). |
| hummus | Serving 1 tbsp = 15 g is small: the A1 test serve was 30 g, and a normal portion is 30-50 g. GI 6 is A1 row 1730, "Hummus (chickpea salad dip)". The commercial dip tested 22 ± 5 (row 1097), and the record is "Hummus, commercial". Low, see Open questions. Free sugars null is defensible (sugars 0.6 g). |

### Nuts and seeds
| id | verdict |
|---|---|
| almonds | OK. 1 oz = 28.4 g, which is a realistic handful. |
| walnuts | OK. |
| hazelnuts | OK. |
| peanuts | OK. Dry-roasted, salted (sodium 410 mg). Unsalted 173806 exists; see Open questions. 28 g carries 3.6 g of available carbohydrate, so it appears in `missingGi`. A1 row 1324 "Peanuts, crushed" 7 ± 4 (6 subjects) exists. |
| sunflower-seeds | **Aliases `bundeva sjemenke` (pumpkin seeds) and, by prefix, `bundeva` (pumpkin) map here.** "bundeva" scores 6.44 and logs a 30 g handful of sunflower seeds (175 kcal) for a pumpkin. The record is "dried" kernels (sodium 9 mg). Croatian "sjemenke" are usually roasted and salted (169418: sodium 655 mg). |
| peanut-butter | OK. Smooth, salted, 2 tbsp = 32 g. Free sugars null; see Open questions. |

### Soups
| id | verdict |
|---|---|
| vegetable-soup | OK. US canned, prepared with water, sodium 338 mg/100 g (815 mg per bowl). Table 1 "Vegetable soup" 48 ± 5 is flagged as nearest class. The note says proxy but `usdaProxy` = false (low). |
| chicken-soup | Low. Aliases `goveđa juha`/`govedja juha` (beef soup) map to chicken noodle soup. The note says proxy but `usdaProxy` = false. Sodium 335 mg/100 g is plausible. |
| tomato-soup | **GI missing although an exact match exists**: A1 row 1555 "Tomato soup, condensed, prepared with water (Campbell's Soup Company, Camden, NJ, USA)" 52 ± 4, 10 normal subjects, glucose reference. The USDA record is the same kind of product. Free sugars null; see Open questions. |
| bean-soup | Proxy, correctly flagged. USDA reports no sugars, caffeine or alcohol (null). `macros()` in the app sums null as 0 (see P-L6). Serving 243 g is smaller than a Croatian bowl of grah varivo (~300-350 g), see Open questions. The name "Bean soup (grah, with ham)" has a Croatian word in the English UI. |

## Focus areas

- **GI mapping (fruit)**:
  - Every Table 1 value I checked is right: apple 36, orange 43, banana 51, pineapple 59, watermelon 76, dates 42, sweet corn 52, sweet potato 63, vegetable soup 48, chickpeas 28, kidney beans 24, lentils 32. The app's A1 additions match the A1 rows.
  - The gaps are foods that do have healthy-subject A1 values: dried apricots 31 (3 studies), tomato soup 52, raw carrot 35, dried figs 61, raisins 64.
  - Correctly left null: mandarin, pear, peach, plum.
- **Raw vs cooked legumes**: all four are "cooked, boiled, without salt". Good, and consistent with Table 1. Canned (salted) legumes are absent: kidney beans canned have sodium 231 mg, chickpeas canned 246 mg. That is an open question, not an error.
- **Serving realism**:
  - Nuts at 28 g are right.
  - Watermelon (154 g), olive (4.4 g) and hummus (15 g) are too small.
  - Spinach (30 g raw) does not match how people eat it.
  - Cucumber (301 g) and avocado (201 g) are too large.
- **Sodium in canned and soup records**: the values are plausible for US canned soups (186-400 mg/100 g). Olives are understated for European olives.
- **Free sugars in dried fruit**: 0 is consistent with WHO 2015 as quoted in foods.md G1. Dried fruit is not listed; only honey, syrups, fruit juices and juice concentrates are named. fooddb-notes.md already states this caveat.
  - Keep 0 for plain dried fruit.
  - Note that sweetened dried fruit (e.g. sweetened cranberries, candied fruit) would need "all" or "upper". None is in the database today.

## Proposed changes

| food id | field | current | proposed | source (exact) | confidence |
|---|---|---|---|---|---|
| onion | aliases | includes `bijeli luk` | remove `bijeli luk`; optionally add a garlic entry (USDA 169230 "Garlic, raw", 1 clove 3 g) with `bijeli luk`, `češnjak`, `garlic` | USDA SR Legacy 169230 vs 170000 | high |
| dried-apricots | aliases | includes `marelice` | remove bare `marelice`; keep `suhe marelice`, `marelice sušene` | Croatian: "marelica" = fresh apricot; USDA "Apricots, dried" 241 kcal vs fresh "Apricots, raw" ~48 kcal | high |
| dried-figs | aliases | includes `smokve`, `smokva` | remove both; keep `suhe smokve`, `dried figs` (optionally add a fresh fig entry, USDA "Figs, raw") | USDA 174665 (dried, 249 kcal) | high |
| sunflower-seeds | aliases | includes `bundeva sjemenke` (and "bundeva" matches by prefix) | remove `bundeva sjemenke`; optionally add pumpkin seeds (USDA 170557 "Seeds, pumpkin and squash seed kernels, roasted, without salt") | USDA 170557 vs 170562 | high |
| spinach | aliases | includes `blitva` | remove (or add chard, USDA 169991 "Chard, swiss, raw") | USDA 169991 | high |
| cherries | aliases | includes `višnje`, `visnje` | remove (or add sour cherries, USDA 173954 "Cherries, sour, red, raw") | USDA 173954; A1 row 971 (sour, canned) 41 ± 5 vs row 970 (dark sweet) 63 ± 6 | high |
| chickpeas | aliases | includes `leblebije` | remove | Leblebija = roasted dry chickpea snack, not boiled chickpeas | high |
| lentils | aliases | `grah`, `lećа` (Cyrillic а) | remove both | inspection (U+0430 in alias) | high |
| carrot | gi / note | null; note says raw carrot is not listed | gi 35; note "A1 row 1621 Carrots, raw, diced (Australia) 35 ± 5, 7 normal subjects, single test" | Atkinson 2008 Suppl. Table A1 rows 1621-1622 (dc08-1239_1.pdf) | med (single test; the raw ground row is 39 ± 1) |
| dried-apricots | gi | null | 31 | A1 rows 950-952, "mean of three studies 31" (30 ± 7, 31 ± 6, 32 ± 7; normal subjects) | high |
| tomato-soup | gi | null | 52 | A1 row 1555 "Tomato soup, condensed, prepared with water (Campbell's)" 52 ± 4, 10 normal, glucose ref | high (single test, but same product type as the USDA record) |
| dried-figs | gi | null | 61 | A1 row 979 "Figs, dried, tenderised, Dessert Maid brand" 61 ± 6, 10 normal | med (single test) |
| raisins | gi | null | 64 | A1 row 1018 "Raisins (Canada)" 64 ± 11, 6 normal, glucose ref | med (alternative: sultanas mean of three = 57, rows 1029-1031) |
| watermelon | serving | 1 cup, balls, 154 g | 1 wedge (≈1/16 melon), 286 g. In spec: `('p', r'wedge')` | USDA 167765 portion "wedge (approx 1/16 of melon)" 286 g (NLEA serving 280 g) | med |
| avocado | usda + serving | 171705 all varieties; 1 avocado 201 g ("NS as to Florida or California") | 171706 "Avocados, raw, California" (Hass); serving ½ fruit = 68 g (or 1 fruit 136 g) | USDA 171706 portion "fruit, without skin and seed" 136 g | med |
| olives | serving | 1 large, 4.4 g | 5 olives ≈ 22 g (5 × USDA "large" 4.4 g), marked assumed | USDA 169094 portion "large" 4.4 g | med |
| hummus | serving | 1 tbsp, 15 g | 2 tbsp, 30 g (assumed) | A1 row 1730 test serve 30 g; USDA 174289 tbsp = 15 g | med |
| spinach | serving / record | raw, 1 cup 30 g | keep raw, and add a cooked entry (USDA 168463 "Spinach, cooked, boiled, drained, without salt", 1 cup 180 g) with alias `kuhani špinat`; leave plain `špinat` on raw only if the label stays "(raw)" | USDA 168463 | med |
| chicken-soup | aliases / proxy | `goveđa juha`, `govedja juha`; usdaProxy false | remove the beef aliases (or flag proxy=true and say so in the note) | note text "proxy for home-made broth soup" | med |
| vegetable-soup | proxy | false | true (the note already says proxy) | spec note | med |
| bean-soup | name | "Bean soup (grah, with ham)" | "Bean soup (with ham)" | Quality bar: 100% English UI | high |

## Open questions (not confident enough to change)

1. **Olive record.** Should we switch to 169096 "Olives, pickled, canned or bottled, green" (sodium 1556 mg, 145 kcal)? It is closer to European brine-cured olives, but Croatians also eat black olives. SR Legacy has no Mediterranean black olive. A range for sodium per 100 g could be shown instead: 735-1556 mg.
2. **Sunflower seeds.** In Croatia "sjemenke" are usually roasted, salted and in the shell. USDA 169418 (dry roasted, salted) has sodium 655 mg vs 9 mg. Should "sjemenke" use that record? The 30 g handful is also ambiguous: kernels or in shell?
3. **Peanuts salted.** "kikiriki" covers unsalted roasted peanuts too (173806: sodium 6 vs 410 mg). Keep salted as the default?
4. **Free sugars in tomato soup and peanut butter.** Both US products contain added sugar. Peanut butter has 10.5 g sugar vs 4.9 g in dry-roasted peanuts; Campbell's tomato soup contains HFCS. Null means they add 0 to the sugar bar. The "upper" rule would overstate, and 10.49 − 4.9 ≈ 5.6 g for peanut butter is our estimate. Owner decision.
5. **Melon GI.** A1 has two tests, 65 (bread reference) and 70 (glucose reference). Use 65, 70 or a range?
6. **Hummus GI.** Row 1730 gives 6 ± 4 for a "chickpea salad dip"; row 1097 gives 22 ± 5 for a commercial dip. Either way GL ≈ 0 at a 15-30 g serve, so the shown effect is the same.
7. **Blueberries.** Use wild blueberries 53 ± 7 (A1 row 965, bread reference) as a proxy for cultivated? I lean no.
8. **Peanuts / peanut butter GI.** A1 row 1324 "Peanuts, crushed" 7 ± 4 (6 subjects). Peanut butter rows 1164, 1167 and 1172 give 23, 22 and 37. Low carb, so the effect is minor.
9. **Bean soup / grah varivo.** The canned US chunky soup has 95 kcal/100 g. A home-made grah with sausage is probably denser, and the bowl is larger (~300-350 g vs 243 g). I found no measured Croatian recipe, so the range is uncertain.
10. **Canned legumes and corn.** Many people use canned ones: canned kidney beans have sodium 231 mg/100 g (174285), chickpeas 246 mg (173800), and canned chickpea GI is 38 (A1 row 1096). Should we add canned variants?
11. **Lettuce.** Swap romaine for green leaf (169249) or butterhead (168429)? The values differ by only 2-4 kcal.
12. **Missing common foods** (Croatian and English), several of which currently mis-resolve:
   - "maline" (raspberries) resolves to **espresso**: the stem match on "mala kava" gives score 3.7, which is ≥ 2.5, so it gets logged.
   - "nar" (pomegranate) resolves to ham/salami via the "narezak" prefix.
   - "limun" resolves to lemonade.
   - "mango" finds nothing, although Table 1 has 51 ± 5.
   - Also missing: fresh apricot, fresh fig, prunes/suhe šljive (A1 row 1017, 29 ± 4), garlic, chard, pumpkin, cauliflower, green beans (mahune), eggplant, pickles, cooked spinach, cooked broccoli.

## Additional low-severity notes

- **P-L6.** `macros()` in `parse.ts` sums null nutrients as 0, so a meal with bean soup reports sugars as if 0 was measured. The data is null-correct; the meal display is not. Applies app-wide.
- **Display labels.** These are US-centric even after `servingText`:
  - "1 avocado, NS as to Florida or California";
  - "1 cup, balls" (melon);
  - "1 cup cut" (sweet corn);
  - "1 serving" (cherries, from NLEA);
  - "Olives (canned, ripe)".
  Cups in general are unfamiliar to EU users, and grams are already shown.

## Count by severity

- **High (4):** bijeli luk → onion; marelice → dried apricots; smokve/smokva → dried figs; bundeva / bundeva sjemenke → sunflower seeds.
- **Medium (11):**
  - blitva → spinach;
  - višnje → sweet cherries;
  - leblebije → boiled chickpeas;
  - "maline" → espresso (false match);
  - watermelon serving;
  - olive record/sodium/serving;
  - avocado record/serving;
  - spinach serving (raw vs cooked);
  - carrot GI note wrong and value missing;
  - missing healthy GI for dried apricots, tomato soup, dried figs and raisins;
  - free sugars null for tomato soup and peanut butter, which contain added sugar.
- **Low (10):**
  - lentils `grah` and Cyrillic alias;
  - goveđa juha → chicken soup;
  - proxy flags false on vegetable and chicken soup;
  - nektarina → peach;
  - melon GI picks one of two tests;
  - hummus serving and GI row choice;
  - cucumber whole as serving;
  - `paprika` and `zelena` generic aliases;
  - null-summed-as-0 in `macros()`;
  - display labels (Croatian word in the bean soup name, US portion jargon).
