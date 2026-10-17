# fooddb.json: method, sources, gaps (draft v1, 2026-10-08)

File: `research/fooddb.json` (150 foods and drinks, 43 with a glycemic index). Built by `research/tools/build_fooddb.py` from the spec `research/tools/fooddb_spec.py`, using the lookup module `research/tools/usda_sr.py`. Rule: upute.md section 2, every number comes from a source that was actually read; missing means `null`.

## Data flow (single source, since the 2026-10-17 audit)

```
research/tools/fooddb_spec.py   ← the ONLY place to change a food (record, serving, aliases, GI key, overrides)
        │  python -I research/tools/build_fooddb.py build
        ▼
research/fooddb.json            ← full record per food (USDA ids, sources, overrides with the USDA values they replace)
        │  research/tools/sync_app_fooddb.py (run automatically at the end of `build`; can be run alone)
        ▼
app/src/v4/food/fooddb.json     ← slim copy the app imports (parse.ts, content/food.ts). Never edit by hand.
```

- Before 2026-10-17 the app copy was hand-patched (fries, renames) and had drifted: `kebab` missing (intended) and the pancake aliases stale. It also carried app-side corrections in `parse.ts` (`SERVING_FIX`, `GI_ADD`, cola `labelFix`). All of these now live in the spec, and `parse.ts` reads the data as it is.
- `sync_app_fooddb.py` `EXCLUDE`: `kebab` (no SR Legacy record, all values null). It stays in research/fooddb.json.
- **Overrides** (`override()` at the bottom of the spec): where USDA is wrong for our market or contradicts the manufacturer. Each one has its own level, plain-English text, source string and URL. The build keeps the replaced USDA values in `overrides[].usdaBefore`. The app turns each override into a claim (`DBO-<food>-<n>`, content/food.ts) that is shown in the food's first chapter, in the caffeine chapter when caffeine is replaced, and on the "How we know" page. Current overrides: cola (EU can label), energy drink (Red Bull EU label), Nutella (Ferrero label), parmesan sodium (Parmigiano Reggiano Consortium), olives sodium (3 EU labels), ćevapi sodium (EU labels, scaled to cooked weight), burek (Čakovečki mlinovi label). EU labels give carbohydrate without fiber, so an overridden label row sets fiber to the label value or null.
- **Alias owners** (`ALIAS_OWNER`): a word on several foods ("kava", "sir", "juice") belongs to one food; the build drops it from the others and fails on an undecided shared word. A test checks that no exact alias names two foods.
- **Servings**: `('g', …)` servings are "assumed" (typical size, level C) unless the reason starts with USDA / label / producer. `piece` gives one countable piece (ćevapi 16 g, olive 4.4 g) used when a whole number is typed. `alias_serving` gives a brand its own pack (Monster 500 ml). `('mlx', …)` takes the density from another USDA record where a record's own portion is physically impossible (iced tea, almond milk, smoothie).
- **GI**: Table 1 values plus single healthy-subject tests from Supplementary Tables A1/A2 (`GI_SUPP` in the build), each with its row number.
- Tests: `app/src/v4/foodData.test.ts` (golden queries, alias uniqueness, Atwater ±15 %, every override).

## Sources

1. **USDA FoodData Central, SR Legacy** (CSV release 2018-04, `FoodData_Central_sr_legacy_food_csv_2018-04.zip` from fdc.nal.usda.gov/fdc-datasets/). Downloaded to `data/raw/usda/` (new folder). The FDC API with `DEMO_KEY` returned HTTP 429 (Too Many Requests) on the first call, so the CSV bulk download was used; the records and FDC IDs are the same ones the API serves. Per-100 g values are read from `food_nutrient.csv` (nutrient numbers: 208 energy, 205 carbohydrate, 269 total sugars, 291 fibre, 204 fat, 606 saturated fat, 203 protein, 307 sodium, 262 caffeine, 221 alcohol, 255 water, 213 lactose, 539 added sugars). Serving sizes come from `food_portion.csv` (the portion text is quoted in `serving.label`).
   - Every entry has `usdaFdcId` and the exact USDA description in `usdaDescription`. Dataset is SR Legacy for all entries (no Foundation, Survey or Branded records were used; a few SR Legacy records are brand-named, e.g. Red Bull, Perrier, Lifeway kefir, Naked Juice smoothie).
2. **Glycemic index: Atkinson FS, Foster-Powell K, Brand-Miller JC. International Tables of Glycemic Index and Glycemic Load Values: 2008. Diabetes Care 31:2281-2283, PMC2584181.** Only the **Table 1** summary (62 common foods, mean +/- SEM, glucose scale = 100) is in the open full text and was read from the cached text (`research/sources/PMC2584181.xml`). The full Tables A1/A2 are in an online-only appendix that was **not** read, so any food not in Table 1 has `gi: null`. Each GI entry states the Table 1 row it uses in `giSource`.
3. **WHO free-sugar definition** as already recorded in `foods.md` G1 (free sugars = sugars added by manufacturer, cook or consumer plus sugars naturally present in honey, syrups, fruit juices and fruit juice concentrates). The WHO fact sheet was read in that earlier dossier, not re-read here.

## Units and conventions

- `per100g` is per 100 g of food as listed by USDA (liquids are per 100 g, not per 100 ml; `serving.grams` already converts ml to grams).
- `serving` is a real USDA portion where possible (`serving.source` says which). For liquids, `serving.label` is a volume (for example 250 ml, 330 ml) and `grams` = volume x the density derived from the USDA fluid-ounce or cup portion of the same record. The volumes themselves (250 ml glass, 330 ml can, 500 ml beer, 150 ml wine, 40 ml spirits, 30 ml espresso) are **our choices of a common serving, not USDA values**.
- `caffeineMg`, `alcoholG`, `sugars` and other fields are `null` when SR Legacy has no value for that food (null means not reported by USDA; it does not prove zero). Where the app needs zero it must decide itself; for caffeine and alcohol USDA reports an explicit 0 for most foods.
- `freeSugars` follows the rules below; `freeSugarsBasis` says which rule produced it.
- `usdaProxy: true` marks a record that is the closest available USDA class, not the real product.
- `color` values are our design choice (appearance of the food as swallowed), not data.
- `aliases` hold Croatian and English names, with and without diacritics (generated automatically; the letter dj/d variants of the Croatian d-bar are both included).

## Free-sugar rules

| Rule | Applied to | Result |
|---|---|---|
| none | whole fruit, vegetables, legumes, plain milk, plain yoghurt, kefir, buttermilk, cheese, eggs, meat, fish, nuts, grains and pasta, coffee, tea, wine, beer, spirits, unsweetened plant milks, tomato juice, dried whole fruit (raisins, apricots, figs, dates) | 0. Dried whole fruit is not in the WHO list as quoted (juices, honey, syrups, added sugars). Other bodies may count it differently; not researched. Tomato juice: the WHO text read names fruit juice only. |
| all | cola, iced tea, lemonade, energy drink, orange and apple juice, juice-based smoothie, honey, sugar, jam | freeSugars = total sugars (juice, honey and syrup count by the WHO definition; soft drinks, sugar and jam are added sugar) |
| minusLactose | chocolate milk, hot chocolate, milk chocolate, dark chocolate, ice cream, fruit yoghurt | freeSugars = USDA total sugars minus USDA lactose (milk sugar is not free). If USDA lists no lactose value, freeSugars is null |
| upper | cornflakes, biscuits, sponge cake, doughnut, hazelnut spread, soy milk, pancakes | UPPER BOUND: all total sugars are assumed to be added (USDA added-sugar value 539 is used if it exists; it did not for these). Real free sugars may be a little lower |
| null | breads, burek, pizza, crackers, muesli, ham, sausages, bacon, salami, hummus, canned soups, peanut butter, croissant, crisps, hamburger, sandwich, coconut water, rice milk, protein shake, kebab | cannot separate added from natural sugars with the sources read |
| (mix) | coffee with milk, cappuccino, latte, protein shake | 0 (milk lactose only; coffee and whey powder have 0 g sugar in USDA) |

Changed 2026-10-17: potato chips null → none; tomato soup, peanut butter and milk chocolate → upper (they contain added sugar; null had counted as 0, and milk chocolate now uses the same rule as the health bars); protein shake null → 0. The per-item table below is the v1 snapshot; research/fooddb.json and research/audit/FIXES.md are current.

## Per-item table

| id | USDA record (FDC id) | serving | GI | free-sugar basis |
|---|---|---|---|---|
| water | Beverages, water, tap, drinking (173647) | 250 ml = 250.2 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| sparkling-water | Beverages, water, bottled, PERRIER (173233) | 250 ml = 250.2 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| cola | Beverages, carbonated, cola, regular (174852) | 330 ml = 342.6 g | 59 | all sugars counted as free (juice, honey, sugar, syrup/soft drink or jam) |
| diet-cola | Beverages, carbonated, low calorie, cola or pepper-type, with aspartame, contains caffeine (175099) | 330 ml = 330.3 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| orange-juice | Orange juice, chilled, includes from concentrate (169100) | 250 ml = 262.9 g | 50 | all sugars counted as free (juice, honey, sugar, syrup/soft drink or jam) |
| apple-juice | Apple juice, canned or bottled, unsweetened, without added ascorbic acid (173933) | 250 ml = 262.1 g | 41 | all sugars counted as free (juice, honey, sugar, syrup/soft drink or jam) |
| tomato-juice | Tomato juice, canned, without salt added (170545) | 250 ml = 257.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| coconut-water | Nuts, coconut water (liquid from coconuts) (170174) | 250 ml = 253.6 g | null | cannot be separated from natural sugars with the sources read |
| energy-drink | Beverages, Energy drink, RED BULL (173210) | 1 can 8.4 fl oz = 258.0 g | 59 | all sugars counted as free (juice, honey, sugar, syrup/soft drink or jam) |
| espresso | Beverages, coffee, brewed, espresso, restaurant-prepared (171891) | 30 ml = 30.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| filter-coffee | Beverages, coffee, brewed, prepared with tap water (171890) | 250 ml = 250.2 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| coffee-with-milk | computed mix of 150 g 171890 + 50 g 171265 | 1 cup, 200 g = 200 g | null | whole milk lactose and coffee: no free sugars (WHO definition) |
| cappuccino | computed mix of 30 g 171891 + 120 g 171265 | 1 cup, 150 g = 150 g | null | whole milk lactose and coffee: no free sugars (WHO definition) |
| latte | computed mix of 30 g 171891 + 220 g 171265 | 1 glass, 250 g = 250 g | null | whole milk lactose and coffee: no free sugars (WHO definition) |
| black-tea | Beverages, tea, black, brewed, prepared with tap water (173227) | 250 ml = 250.2 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| green-tea | Beverages, tea, green, brewed, regular (171917) | 250 ml = 250.2 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| herbal-tea | Beverages, tea, herb, other than chamomile, brewed (173232) | 250 ml = 250.2 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| iced-tea | Beverages, tea, black, ready-to-drink, lemon, sweetened (171888) | 250 ml = 286.4 g | null | all sugars counted as free (juice, honey, sugar, syrup/soft drink or jam) |
| milk-whole | Milk, whole, 3.25% milkfat, with added vitamin D (171265) | 250 ml = 257.8 g | 39 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| milk-semi-skimmed | Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D (171267) | 250 ml = 257.8 g | 39 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| milk-skimmed | Milk, nonfat, fluid, with added vitamin A and vitamin D (fat free or skim) (171269) | 250 ml = 258.9 g | 37 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| chocolate-milk | Milk, chocolate, fluid, commercial, reduced fat, with added vitamin A and vitamin D (170880) | 250 ml = 264.2 g | null | total sugars minus USDA lactose (milk sugar is not free) |
| hot-chocolate | Milk, chocolate beverage, hot cocoa, homemade (171277) | 250 ml = 264.2 g | null | total sugars minus USDA lactose (milk sugar is not free) |
| soy-milk | Soymilk, original and vanilla, unfortified (172446) | 250 ml = 256.8 g | 34 | UPPER BOUND: all total sugars assumed added (no added-sugar value in SR Legacy) |
| almond-milk | Beverages, almond milk, unsweetened, shelf stable (174832) | 250 ml = 276.9 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| rice-milk | Beverages, rice milk, unsweetened (171942) | 250 ml = 253.6 g | 86 | cannot be separated from natural sugars with the sources read |
| buttermilk | Milk, buttermilk, fluid, cultured, lowfat (170874) | 250 ml = 258.9 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| kefir | Kefir, lowfat, plain, LIFEWAY (170904) | 250 ml = 256.8 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| beer | Alcoholic beverage, beer, regular, all (168746) | 500 ml = 502.1 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| red-wine | Alcoholic beverage, wine, table, red (173190) | 150 ml = 149.1 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| white-wine | Alcoholic beverage, wine, table, white (174837) | 150 ml = 149.1 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| rakija | Alcoholic beverage, distilled, all (gin, rum, vodka, whiskey) 80 proof (174815) | 40 ml = 37.6 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| smoothie | Fruit juice smoothie, NAKED JUICE, strawberry banana (168214) | 250 ml = 240.9 g | null | all sugars counted as free (juice, honey, sugar, syrup/soft drink or jam) |
| protein-shake | computed mix of 30 g 173180 + 250 g 171267 | 1 shaker, 280 g = 280 g | null | not determined |
| lemonade | Lemonade, frozen concentrate, white, prepared with water (173217) | 250 ml = 261.2 g | 59 | all sugars counted as free (juice, honey, sugar, syrup/soft drink or jam) |
| yogurt-plain | Yogurt, plain, whole milk (171284) | 1 cup (8 fl oz) = 245.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| yogurt-lowfat | Yogurt, plain, low fat (170886) | 1 cup (8 fl oz) = 245.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| yogurt-greek | Yogurt, Greek, plain, lowfat (170903) | 1 container (7 oz) = 200.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| yogurt-fruit | Yogurt, fruit, low fat,9 g protein/8 oz (170889) | 1 container (6 oz) = 170.0 g | 41 | USDA reports no lactose value, split not possible |
| cheese-cheddar | Cheese, cheddar, sharp, sliced (170899) | 1 slice (1 oz) = 28.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| cheese-gouda | Cheese, gouda (171241) | 1 oz = 28.4 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| cheese-mozzarella | Cheese, mozzarella, whole milk (170845) | 1 oz = 28.4 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| cheese-feta | Cheese, feta (173420) | 1 oz = 28.4 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| cheese-cottage | Cheese, cottage, creamed, large or small curd (172179) | 1 cup, large curd (not packed) = 210.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| cheese-parmesan | Cheese, parmesan, hard (170848) | 1 oz = 28.4 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| egg-boiled | Egg, whole, cooked, hard-boiled (173424) | 1 large = 50.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| egg-fried | Egg, whole, cooked, fried (173423) | 1 large = 46.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| butter | Butter, salted (173410) | 1 tbsp = 14.2 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| bread-white | Bread, white, commercially prepared (includes soft bread crumbs) (174924) | 1 slice = 29.0 g | 75 | cannot be separated from natural sugars with the sources read |
| bread-wholemeal | Bread, whole-wheat, commercially prepared (172688) | 1 slice = 32.0 g | 74 | cannot be separated from natural sugars with the sources read |
| bread-rye | Bread, rye (172684) | 1 slice, regular = 32.0 g | null | cannot be separated from natural sugars with the sources read |
| bread-french | Bread, french or vienna (includes sourdough) (172675) | 1 slice = 139.0 g | null | cannot be separated from natural sugars with the sources read |
| burek | Turnover, filled with egg, meat and cheese, frozen (168963) **PROXY** | 1 piece turnover 1 serving = 127.0 g | null | cannot be separated from natural sugars with the sources read |
| pizza | Pizza, cheese topping, regular crust, frozen, cooked (170317) | 1 serving 9 servings per 24 oz package = 81.0 g | null | cannot be separated from natural sugars with the sources read |
| pasta | Pasta, cooked, enriched, without added salt (169737) | 1 cup spaghetti not packed = 124.0 g | 49 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| pasta-wholewheat | Pasta, whole-wheat, cooked (Includes foods for USDA's Food Distribution Program) (168910) | 1 cup spaghetti not packed = 117.0 g | 48 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| rice-white | Rice, white, long-grain, regular, enriched, cooked (168878) | 1 cup = 158.0 g | 73 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| rice-brown | Rice, brown, long-grain, cooked (Includes foods for USDA's Food Distribution Program) (169704) | 1 cup = 202.0 g | 68 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| potato-boiled | Potatoes, boiled, cooked in skin, flesh, without salt (170438) | 1 potato (2-1/2" dia, sphere) = 136.0 g | 78 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| potato-mashed | Potatoes, mashed, home-prepared, whole milk and butter added (168555) | 1 cup = 210.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| fries | Fast foods, potato, french fried in vegetable oil (170698). **Changed 2026-10-16** (science audit): was the oven-heated frozen record 169264 (158 kcal, 5.5 g fat per 100 g, "10 fries" = 76 g); people and the burger + fries preset mean deep-fried fries (312 kcal, 14.7 g fat per 100 g) | 1 small portion = 71.0 g (USDA portion "serving small") | 63 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| oatmeal | Cereals, oats, regular and quick, unenriched, cooked with water (includes boiling and microwaving), without salt (173905) | 1 cup = 234.0 g | 55 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| cornflakes | Cereals ready-to-eat, RALSTON Corn Flakes (174648) | 1 cup (1 NLEA serving) = 28.0 g | 81 | UPPER BOUND: all total sugars assumed added (no added-sugar value in SR Legacy) |
| muesli | Cereals ready-to-eat, FAMILIA (169076) | 1 cup = 122.0 g | 57 | cannot be separated from natural sugars with the sources read |
| crackers | Crackers, saltines (includes oyster, soda, soup) (172746) | 5 crackers = 14.9 g | null | cannot be separated from natural sugars with the sources read |
| pancake | Pancakes, plain, prepared from recipe (175009) | 1 pancake (4" dia) = 38.0 g | null | UPPER BOUND: all total sugars assumed added (no added-sugar value in SR Legacy) |
| chicken-breast | Chicken, broilers or fryers, breast, meat only, cooked, roasted (171477) | 0.5 breast, bone and skin removed = 86.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| beef-steak | Beef, top sirloin, steak, separable lean and fat, trimmed to 1/8" fat, all grades, cooked, broiled (168727) | 3 oz = 85.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| cevapi | Beef, ground, 80% lean meat / 20% fat, patty, cooked, pan-broiled (171798) **PROXY** | 3 oz = 85.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| pork-chop | Pork, fresh, loin, whole, separable lean and fat, cooked, roasted (167821) | 1 chop, excluding refuse (yield from 1 raw chop, with refuse, weighing 151 g) = 89.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| lamb-roast | Lamb, leg, whole (shank and sirloin), separable lean and fat, trimmed to 1/4" fat, choice, cooked, roasted (174312) | 3 oz = 85.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| tuna-canned | Fish, tuna, light, canned in water, without salt, drained solids (171986) | 1 can = 165.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| salmon | Fish, salmon, Atlantic, farmed, cooked, dry heat (175168) | 0.5 fillet = 178.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| cod | Fish, cod, Atlantic, cooked, dry heat (171956) | 1 fillet = 180.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| sardines | Fish, sardine, Atlantic, canned in oil, drained solids with bone (175139) | 1 can (3.75 oz) = 92.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| ham | Ham, sliced, regular (approximately 11% fat) (173864) | 1 slice = 28.0 g | null | cannot be separated from natural sugars with the sources read |
| sausage | Polish sausage, pork (174577) | 3 oz = 85.0 g | null | cannot be separated from natural sugars with the sources read |
| frankfurter | Frankfurter, beef, heated (174614) | 1 frankfurter = 48.0 g | null | cannot be separated from natural sugars with the sources read |
| salami | Salami, dry or hard, pork (172938) | 1 slice (3-1/8" dia x 1/16" thick) = 10.0 g | null | cannot be separated from natural sugars with the sources read |
| bacon | Pork, cured, bacon, cooked, baked (167914) | 1 slice cooked = 8.1 g | null | cannot be separated from natural sugars with the sources read |
| tofu | Tofu, raw, firm, prepared with calcium sulfate (172475) | 0.5 cup = 126.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| beans-kidney | Beans, kidney, red, mature seeds, cooked, boiled, without salt (175194) | 1 cup = 177.0 g | 24 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| beans-white | Beans, white, mature seeds, cooked, boiled, without salt (175203) | 1 cup = 179.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| lentils | Lentils, mature seeds, cooked, boiled, without salt (172421) | 1 cup = 198.0 g | 32 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| chickpeas | Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt (173757) | 1 cup = 164.0 g | 28 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| peas | Peas, green, cooked, boiled, drained, without salt (170420) | 1 cup = 160.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| hummus | Hummus, commercial (174289) | 1 tbsp = 15.0 g | null | cannot be separated from natural sugars with the sources read |
| salad-lettuce | Lettuce, cos or romaine, raw (169247) | 1 cup shredded = 47.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| cabbage | Cabbage, raw (169975) | 1 cup, chopped = 89.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| sauerkraut | Sauerkraut, canned, solids and liquids (169279) | 1 cup = 142.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| tomato | Tomatoes, red, ripe, raw, year round average (170457) | 1 medium whole (2-3/5" dia) = 123.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| cucumber | Cucumber, with peel, raw (168409) | 1 cucumber (8-1/4") = 301.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| carrot | Carrots, raw (170393) | 1 medium = 61.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| broccoli | Broccoli, raw (170379) | 1 cup chopped = 91.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| onion | Onions, raw (170000) | 1 medium (2-1/2" dia) = 110.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| pepper-red | Peppers, sweet, red, raw (170108) | 1 medium (approx 2-3/4" long, 2-1/2 dia.) = 119.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| spinach | Spinach, raw (168462) | 1 cup = 30.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| zucchini | Squash, summer, zucchini, includes skin, raw (169291) | 1 medium = 196.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| mushrooms | Mushrooms, white, raw (169251) | 1 cup, pieces or slices = 70.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| sweet-corn | Corn, sweet, yellow, cooked, boiled, drained, without salt (169999) | 1 cup cut = 149.0 g | 52 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| sweet-potato | Sweet potato, cooked, boiled, without skin (168484) | 1 medium = 151.0 g | 63 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| olives | Olives, ripe, canned (small-extra large) (169094) | 1 large = 4.4 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| olive-oil | Oil, olive, salad or cooking (171413) | 1 tablespoon = 13.5 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| vegetable-soup | Soup, vegetarian vegetable, canned, prepared with equal volume water (174564) | 1 cup = 241.0 g | 48 | cannot be separated from natural sugars with the sources read |
| chicken-soup | Soup, chicken noodle, canned, prepared with equal volume water (172909) | 1 serving 1 cup = 248.0 g | null | cannot be separated from natural sugars with the sources read |
| tomato-soup | Soup, tomato, canned, prepared with equal volume water, commercial (171176) | 1 serving 1 cup = 248.0 g | null | cannot be separated from natural sugars with the sources read |
| bean-soup | Soup, bean with ham, canned, chunky, ready-to-serve (171144) **PROXY** | 1 cup (8 fl oz) = 243.0 g | null | cannot be separated from natural sugars with the sources read |
| apple | Apples, raw, with skin (Includes foods for USDA's Food Distribution Program) (171688) | 1 medium (3" dia) = 182.0 g | 36 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| banana | Bananas, raw (173944) | 1 medium (7" to 7-7/8" long) = 118.0 g | 51 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| orange | Oranges, raw, all commercial varieties (169097) | 1 fruit (2-5/8" dia) = 131.0 g | 43 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| mandarin | Tangerines, (mandarin oranges), raw (169105) | 1 medium (2-1/2" dia) = 88.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| grapes | Grapes, red or green (European type, such as Thompson seedless), raw (174683) | 1 cup = 151.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| strawberries | Strawberries, raw (167762) | 1 cup, halves = 152.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| watermelon | Watermelon, raw (167765) | 1 cup, balls = 154.0 g | 76 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| melon | Melons, cantaloupe, raw (169092) | 1 cup, balls = 177.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| pear | Pears, raw (169118) | 1 medium = 178.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| peach | Peaches, yellow, raw (169928) | 1 medium (2-2/3" dia) = 150.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| cherries | Cherries, sweet, raw (171719) | 1 NLEA serving = 140.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| plum | Plums, raw (169949) | 1 fruit (2-1/8" dia) = 66.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| kiwi | Kiwifruit, green, raw (168153) | 1 fruit (2" dia) = 69.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| pineapple | Pineapple, raw, all varieties (169124) | 1 cup, chunks = 165.0 g | 59 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| blueberries | Blueberries, raw (171711) | 1 cup = 148.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| avocado | Avocados, raw, all commercial varieties (171705) | 1 avocado, NS as to Florida or California = 201.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| raisins | Raisins, dark, seedless (Includes foods for USDA's Food Distribution Program) (168165) | 1 small box (1.5 oz) = 43.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| dried-apricots | Apricots, dried, sulfured, uncooked (173941) | 1 cup, halves = 130.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| dried-figs | Figs, dried, uncooked (174665) | 1 cup = 149.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| dates | Dates, deglet noor (171726) | 1 date, pitted = 7.1 g | 42 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| almonds | Nuts, almonds (170567) | 1 oz (23 whole kernels) = 28.4 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| walnuts | Nuts, walnuts, english (170187) | 1 oz (14 halves) = 28.4 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| hazelnuts | Nuts, hazelnuts or filberts (170581) | 1 oz (21 whole kernels) = 28.4 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| peanuts | Peanuts, all types, dry-roasted, with salt (174262) | 1 oz = 28.4 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| sunflower-seeds | Seeds, sunflower seed kernels, dried (170562) | 1 cup = 140.0 g | null | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| peanut-butter | Peanut butter, smooth style, with salt (Includes foods for USDA's Food Distribution Program) (174266) | 2 tbsp = 32.0 g | null | cannot be separated from natural sugars with the sources read |
| nutella | Chocolate-flavored hazelnut spread (168000) | 1 serving 2 TBSP = 37.0 g | null | UPPER BOUND: all total sugars assumed added (no added-sugar value in SR Legacy) |
| chocolate-milk-bar | Candies, milk chocolate (167587) | 1 bar (1.55 oz) = 44.0 g | 40 | USDA reports no lactose value, split not possible |
| chocolate-dark | Chocolate, dark, 70-85% cacao solids (170273) | 1 bar = 101.0 g | 40 | total sugars minus USDA lactose (milk sugar is not free) |
| ice-cream | Ice creams, vanilla (167575) | 1 serving 1/2 cup = 66.0 g | 51 | USDA reports no lactose value, split not possible |
| biscuits | Cookies, butter, commercially prepared, enriched (174950) | 1 cookie = 5.0 g | null | UPPER BOUND: all total sugars assumed added (no added-sugar value in SR Legacy) |
| croissant | Croissants, butter (174987) | 1 croissant, medium = 57.0 g | null | cannot be separated from natural sugars with the sources read |
| cake-sponge | Cake, sponge, commercially prepared (172706) | 1 piece (1/12 of 16 oz cake) = 38.0 g | null | UPPER BOUND: all total sugars assumed added (no added-sugar value in SR Legacy) |
| doughnut | Doughnuts, yeast-leavened, glazed, enriched (includes honey buns) (172758) | 1 doughnut (3-3/4" dia) = 60.0 g | null | UPPER BOUND: all total sugars assumed added (no added-sugar value in SR Legacy) |
| honey | Honey (169640) | 1 tbsp = 21.0 g | 61 | all sugars counted as free (juice, honey, sugar, syrup/soft drink or jam) |
| sugar | Sugars, granulated (169655) | 1 tsp = 4.2 g | 65 | all sugars counted as free (juice, honey, sugar, syrup/soft drink or jam) |
| jam | Jams and preserves (169641) | 1 tbsp = 20.0 g | 49 | all sugars counted as free (juice, honey, sugar, syrup/soft drink or jam) |
| potato-chips | Snacks, potato chips, plain, salted (169677) | 1 oz = 28.0 g | 56 | cannot be separated from natural sugars with the sources read |
| popcorn | Snacks, popcorn, air-popped (167959) | 1 cup = 8.0 g | 65 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| rice-cakes | Snacks, rice cakes, brown rice, plain, unsalted (170250) | 1 cake = 9.0 g | 87 | WHO: sugars in whole fruit, vegetables, plain milk/dairy, meat etc. are not free sugars |
| hamburger | McDONALD'S, Hamburger (170717) | 1 sandwich = 95.0 g | null | cannot be separated from natural sugars with the sources read |
| kebab | none **PROXY** | none | null | n/a |
| sandwich-ham | Fast foods, submarine sandwich, turkey, roast beef and ham on white bread with lettuce and tomato (170308) | 1 six-inch sub = 207 g | null | cannot be separated from natural sugars with the sources read |

## Values that are missing (null) or weak

- **No SR Legacy record, left null or proxied**: kebab/doner (all numbers null, any value would be a guess), prosciutto/pršut (dropped; no dry-cured ham record, the sliced boiled ham record would be misleading), oat milk (not in SR Legacy 2018, dropped), plain hot dog (no matching record, dropped).
- **Proxies (usdaProxy true)**: burek (USDA 'Turnover, filled with egg, meat and cheese, frozen'), ćevapi (ground beef 80/20 patty, pan-broiled), bean soup / grah (canned bean-with-ham soup), kebab (none). The US pizza record is a frozen cheese pizza, the sandwich is a US submarine sandwich.
- **Computed mixes (our assumption for the proportions, USDA for the ingredients)**: coffee with milk (150 g filter coffee + 50 g whole milk), cappuccino (30 g espresso + 120 g whole milk), latte (30 g espresso + 220 g whole milk), protein shake (30 g whey-based protein powder USDA 173180 + 250 g 2% milk). The ratios are not sourced; powders vary a lot by brand. Foam and sugar are not modelled. Sugar added to a coffee is not included (add it as a second item).
- **Other data gaps**: total sugars are null for sparkling mineral water (Perrier), pancakes, Polish sausage, salami, tofu, bean soup, kebab; fibre is null for pancakes. Caffeine and alcohol are null where USDA reports nothing (for example cornflakes, tuna, tofu, sausage).
- **GI coverage**: 43 of 150 foods. GI is the Table 1 average of many studies in healthy people. Where the product differs from the Table 1 row, `giSource` says 'nearest tested class' (cola and energy drink and lemonade use 'soft drink/soda'; semi-skimmed milk uses full-fat milk; rice cakes use 'rice crackers/crisps'; milk and dark chocolate use generic 'chocolate'; canned vegetable soup uses 'vegetable soup'). Carrot has no GI here: Table 1 lists 'carrots, boiled' (39) and the text mentions carrots GI 39, but raw carrot is not separately listed. Potato mash, pizza, burek, meat, fish, eggs, cheese, beer, wine and most fruit have no Table 1 row, so null.
- **Possible problems for the app**: the USDA reference is US foods (US flour, enrichment, salt levels, 2% milk). European products differ (for example cola is made with sucrose in the EU vs HFCS in the US; see cola.md P1/P2). Sodium in canned, processed and cured foods is high and brand dependent.
- **Not done**: no values were taken from memory. Dietary reference figures (WHO) were not re-checked here.
