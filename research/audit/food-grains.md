# Food audit: grains, meals, sweets, snacks (2026-10-17)

Scope: 35 foods (bread-white … sandwich-ham) plus the Popular meals `PRESETS` in `app/src/v4/food/meal.ts`.
Method: I read the spec (`research/tools/fooddb_spec.py`), the build script and its GI table, `research/fooddb.json`, the app copy `app/src/v4/food/fooddb.json` and the app-side overrides in `parse.ts` (`SERVING_FIX`, `GI_ADD`, `servingText`), `healthBars.ts` and `meal.ts`. I read every USDA record through `usda_sr.py` (nutrients and portions), and checked each GI against Atkinson 2008 Table 1 as parsed from the cached full text `research/sources/PMC2584181.xml`. For A1/A2 values I relied on `research/gi-additions.md`.

What the app shows: the per-100 g values are identical between `research/fooddb.json` and the app JSON for all 34 foods in the app. Kebab is left out of the app JSON. The only difference is pancake aliases, see below. `satFat`, `freeSugars` and `sodiumMg` are in the data but are not displayed per food today. Sugars and fiber are shown only when they are ≥ 1 g, so null values show as nothing, never as 0.

Severity: **H** = a number the user sees, or a high-traffic mapping, is clearly wrong. **M** = misleading in common use. **L** = cosmetic, documentation or consistency.

## GI check (Atkinson 2008 Table 1, read from the cached XML)
All Table 1 values used in this group match exactly: white wheat bread 75±2, whole meal bread 74±2, cornflakes 81±6, porridge rolled oats 55±2, muesli 57±2, white rice boiled 73±4, brown rice 68±4, spaghetti white 49±2, spaghetti whole meal 48±5, potato boiled 78±4, french fries 63±5, chocolate 40±3, ice cream 51±3, popcorn 65±5, potato crisps 56±3, rice crackers/crisps 87±2, sucrose 65±4, honey 61±3, strawberry jam/jelly 49±3.
The Table 1 footnote "*Low-GI varieties were also identified" applies to **white wheat bread and white rice**. In other words, these two are type-dependent (basmati or parboiled rice, sourdough). The giSource text does not say so.
No food in this group with almost no carbs carries a GI. The 2021 AJCN update (114:1625) was **not** read; see Open questions.

## Per-food verdicts
- **bread-white**: USDA 174924 is OK. The 29 g slice is realistic. GI 75 is correct. The alias "kruh" sits on 4 breads and white wins on DB order, which is sensible. Issue (L/open): the US commercial white bread has 5.67 g sugar/100 g, while European white bread is typically about 1–3 g. The GI source does not mention the "low-GI varieties exist" footnote.
- **bread-wholemeal**: OK record, GI 74 OK. **M**: the alias "polubijeli kruh" (semi-white, T-850 flour) maps to wholemeal. Semi-white is closer to white. "crni kruh" is acceptable.
- **bread-rye**: OK. This is US "Bread, rye", which is a mixed rye-wheat bread and close to a typical Croatian raženi. No Table 1 GI, so null is correct.
- **bread-french**: The record is OK. The raw USDA "slice" of 139 g is wrong as a slice, but the app overrides it to 30 g "1 slice" (SERVING_FIX, flagged assumed), so the user sees 30 g. **L**: the research JSON still says 139 g "1 slice". No GI is defensible: A1 has 57, but the A2 healthy rows range 78–81, so the values disagree.
- **burek**: **H**. It is a proxy, the US frozen breakfast turnover, and it is flagged. The 200 g serving override is realistic: a bakery piece is about 200–250 g. But the proxy has 228 kcal, 12.6 g fat and **7.87 g sugar**/100 g. European burek labels and entries give about **284–349 kcal and 14.6–20.8 g fat**/100 g: Mlinar burek s mesom 284 kcal/14.6 g fat (fddb, user-entered); the Čakovečki mlinovi cheese burek label 297 kcal/16 g fat. Real burek has very little sugar. So kcal is about 20–35% too low and sugar is about 5× too high. **M**: the alias "pastry" is a generic English word that people use for sweet pastries. "pita" means any pie in Croatian (pita od jabuka).
- **pizza**: The record is a frozen cheese pizza, 268 kcal. The app shows "1 slice 107 g, one slice of a 14-inch pizza". **L**: that 107 g comes from a different USDA record, 173292 "Fast Food, Pizza Chain, 14" pizza, cheese topping, regular crust" (slice = 107 g, 266 kcal). Using 173292 directly would make the serving a real USDA portion instead of an assumption. No GI is correct: only proxies or diabetic tests exist.
- **pasta**: The record is OK, GI 49 OK. **M**: the serving is 124 g cooked (about 50 g dry) and is labelled "1 cup spaghetti not packed". That label is American and confusing, and servingText does not clean it. A European plate is 80 g dry, about 190 g cooked. **M**: the alias "njoki" (gnocchi, potato dumplings) maps to pasta.
- **pasta-wholewheat**: The record is OK, GI 48 OK. It has the same serving and label issue as pasta.
- **rice-white**: The record is OK (long-grain enriched, cooked), the 158 g cup is OK and GI 73 is correct. The type dependence is not mentioned (open).
- **rice-brown**: OK. GI 68 is correct.
- **potato-boiled**: OK. 136 g, GI 78 correct. Potato GI is cultivar-dependent (paper: "lower GI cultivars were identified").
- **potato-mashed**: OK, with milk, butter and salt. GI null is defensible: Table 1 only lists instant mash (87), and A1 fresh mash is 91–102 from 2 single tests.
- **fries**: OK. Deep-fried fast-food record, 71 g "1 small portion" is a real USDA portion, GI 63 correct, free sugars none is correct.
- **oatmeal**: The record and GI 55 are OK. **H**: the aliases "zobene pahuljice" and "oats" mean DRY rolled oats, but they map to cooked porridge at 71 kcal/100 g. "50 g zobenih pahuljica" would show 36 kcal; dry oats (USDA 173904) give 190 kcal. That is a 5× error.
- **cornflakes**: The GI is OK. The record is the US store brand RALSTON. **L**: sodium is 571 mg vs about 450 mg for the EU Kellogg's label (salt about 1.13 g); not verified this session. The 28 g serving is close to the EU 30 g. Caffeine and alcohol are null (USDA reports none), which is harmless. The upper free-sugar rule is fine. **L**: the alias "pahuljice" is ambiguous with zobene pahuljice.
- **muesli**: The record (Familia) is OK and GI 57 is correct. The raw 122 g cup is overridden to 60 g "1 bowl"; EU packs say 40–50 g, so it is acceptable. Free sugars null is correct (dried fruit).
- **crackers**: OK, US saltines. **L**: the alias "grisini" (breadsticks) is a proxy. Calories are similar.
- **pancake**: **M**. The name says "Pancakes (crêpes)", but the record is a US fluffy pancake (baking powder), 4" diameter, 38 g. Croatian palačinke are crêpes. The record is not flagged as a proxy. Sugars and fiber are null (USDA gives none); they are shown as nothing, which is fine. **L**: the app JSON is stale: the alias "pancakes (palačinke)" is a former name, so the app JSON was not rebuilt after the last spec edit.
- **chocolate-milk-bar**: The record is OK and the 44 g bar is a real USDA portion. Caffeine 20 mg/100 g is from USDA. GI 40 is a class value and flagged. **L**: free sugars is null because USDA has no lactose value, while healthBars hard-codes 20.6 g free sugar per 40 g (all sugars, "upper bound"). The two places use different rules for the same food.
- **chocolate-dark**: OK. Free sugars = sugars − lactose (0), which is correct. Caffeine 80 mg/100 g is from USDA. The serving override of 40 g "4 squares" assumes a bar of 10 × 10 g; with a Milka-style bar, 4 squares is about 17 g (L).
- **ice-cream**: OK. ½ cup 66 g, GI 51 correct. Free sugars is null because USDA reports no lactose (defensible).
- **biscuits**: OK. Butter cookies, 5 g each, upper free-sugar rule. **L**: the alias "biskvit" means sponge cake in Croatian, not a biscuit. The common Croatian name "plazma" is missing.
- **croissant**: OK. 57 g medium, GI null is correct (only A2 diabetic). Free sugars null; doughnut and cake use the upper rule, which is a minor inconsistency.
- **cake-sponge**: **M**. The aliases "torta", "kolač", "cake" map to a 38 g slice of plain commercial sponge (290 kcal). A Croatian torta or kolač is usually a cream or filled cake, and a slice is about 100–150 g. **L**: sodium 623 mg/100 g in the commercial record (the recipe record 172707 has 228). GI_ADD 46 comes from **A2** row 1883 (5 subjects), while the `DB3` text says "Table 1 and Supplementary Table A1".
- **doughnut**: **M**. The record is a US glazed yeast doughnut, 421 kcal. A Croatian "krafna" (also the alias "krafna s marmeladom") is jam-filled; USDA 172759 "Doughnuts, yeast-leavened, with jelly filling" has 340 kcal, 18.7 g fat, 21.1 g sugar, portion 85 g. **L**: GI_ADD 75 is "Doughnut, wheat dough, deep-fried (China)", a different, unsweetened product, but it is not marked as the nearest class.
- **honey**: OK. Free sugars = all, which follows WHO. GI 61 correct. 304 kcal is below 4/9/4 Atwater (330) because USDA uses specific sugar factors; this is fine.
- **sugar**: OK. 387 kcal (USDA factor 3.87 kcal/g), free sugars = all, GI 65 correct.
- **jam**: The free-sugar rule (all) is correct; the sugars are added or come from cooked fruit, which SACN counts as free. GI 49 is correct. **L/open**: USDA sugars are 48.5 g while carbs are 68.9 g. EU "jam" must have ≥ 60% soluble solids, so free sugars may be underestimated by about 10 g/100 g.
- **nutella**: **H**. satFat is **28.42 g/100 g** (96% of the fat), which is a USDA record error. The Ferrero label gives **10.6 g** saturates, and hazelnut and palm fat cannot be 96% saturated. **H**: the serving is 37 g ("2 tbsp", US). The EU label portion is **15 g**. The upper free-sugar rule is fine and labelled: label sugars are 56.3 g, minus about 4 g of lactose from 8.7% skimmed milk powder.
- **potato-chips**: The record (plain, salted), 28 g and GI 56 are OK. **M**: free sugars is null, but plain crisps contain potato, oil and salt only, so it should be "none" (0), the same as fries.
- **popcorn**: The air-popped record and GI 65 are correct. The 8 g cup is fine as a unit. See the presets for the cinema-popcorn problem.
- **rice-cakes**: OK. GI 87 is the nearest class and flagged.
- **hamburger**: The McDonald's hamburger record (95 g) is OK and close to the EU McDonald's hamburger. GI_ADD 66 is correct (A1, same 95 g serve). **H**: the alias "pljeskavica" maps to a 95 g McDonald's burger. A pljeskavica is a grilled patty of about 150–250 g of meat, often in a lepinja, several times the energy.
- **kebab**: All values null, and the food is excluded from the app, which is correct and honest. Typing kebab/döner/gyros gives no result. See Open questions.
- **sandwich-ham**: **M**. The aliases "sendvič", "sandwich" and "sendvic sa sunkom" map to a lean US turkey + roast beef + ham sub (146 kcal, 2.4 g fat/100 g, 207 g). USDA 170707 "submarine sandwich, ham on white bread" (6-inch = 184 g) matches the alias "sa šunkom" better. A Croatian ham-and-cheese sendvič with butter or mayo is more energy-dense. "1 six-inch sub" is US wording (L).

## Popular meal presets (meal.ts)
- burger (`hamburger fries*2 cola`): 95 g + 142 g fries + 330 ml cola. Realistic (about an EU medium/large fries). OK.
- coffee-croissant: 57 g croissant. OK.
- beer-cevapi (`bread-white*2`): **M**. The bread is 2 slices of white toast (58 g), but ćevapi come in a lepinja of about 100–130 g. Pita bread (USDA 174915) at about 100 g would be closer (open: lepinja size).
- oat-breakfast: 234 g cooked oatmeal (about 40 g dry). OK.
- pizza-beer: 2 × 107 g slices. OK, and the sub "2 slices and a pint" matches.
- burek-yogurt: burek 200 g. The weight is OK, but the burek numbers are the weak proxy above (H).
- eggs-toast-oj: 2 slices, 58 g. OK.
- movie (`popcorn*3 cola`): **M**. This is 24 g of air-popped popcorn (about 93 kcal). Cinema and microwave popcorn is oil-popped (USDA 170247: 500 kcal/100 g; 167549 microwave: 583 kcal), and a cinema portion is several times larger. So the energy is underestimated about 4–6×.

## Proposed changes

| food id | field | current | proposed | source (exact) | confidence |
|---|---|---|---|---|---|
| nutella | per100g.satFat | 28.42 | 10.6 (or a label override of the whole row: fat 30.9, satFat 10.6, carbs 57.5, sugars 56.3, protein 6.3, sodium 43 mg = salt 0.107 g × 400, kcal 539), the same way COLA.eu is handled | Ferrero Foodservice UK, Nutella 3 kg page: per 100 g 539 kcal, fat 30.9, saturates 10.6, carbohydrate 57.5, sugars 56.3, protein 6.3, salt 0.107 g; portion 15 g | high (satFat), med (full override) |
| nutella | serving | 37 g "2 tbsp" | 15 g "1 portion (1 tbsp)" | same Ferrero page: "Portion size 15 g", 80 kcal | high |
| oatmeal | aliases | includes "zobene pahuljice", "oats" | remove both from oatmeal; add food `oats-dry` = USDA 173904 "Cereals, oats, regular and quick, not fortified, dry" (379 kcal; portion ⅓ cup 27 g or 40 g assumed) | USDA SR Legacy 173904 | high (remove), med (new food) |
| hamburger | aliases | includes "pljeskavica" | remove "pljeskavica" (or map it to the ćevapi beef patty record with a larger assumed weight) | definition of the dish; record is a 95 g McDonald's hamburger | high (remove) |
| potato-chips | free rule | null | none (0) | ingredients of plain salted crisps: potato, oil, salt; WHO definition (no added mono/disaccharides) | high |
| pasta | aliases | includes "njoki" | remove "njoki" (gnocchi are potato dumplings) | the dish | high |
| doughnut | usda | 172758 glazed (421 kcal), 60 g | 172759 "Doughnuts, yeast-leavened, with jelly filling" (340 kcal, 18.7 g fat, 21.1 g sugar), portion 85 g; keep the upper rule | USDA SR Legacy 172759 | med |
| doughnut | GI_ADD note | 75, not flagged | keep 75 but mark it as the nearest class ("Doughnut, wheat dough, deep-fried (China)", A1 row 13) | research/gi-additions.md | high |
| pancake | name / proxy | "Pancakes (crêpes)", proxy false | "Pancakes" with proxy true and a note "US-style pancake; crêpes are thinner", or keep the name and flag it as a proxy | USDA 175009 = "Pancakes, plain, prepared from recipe" (4" diameter) | high |
| pizza | usda | 170317 frozen + SERVING_FIX 107 g | 173292 "Fast Food, Pizza Chain, 14" pizza, cheese topping, regular crust" with its native portion slice = 107 g, then drop the SERVING_FIX | USDA SR Legacy 173292 portions (slice 107 g, pizza 853 g) | med |
| pasta, pasta-wholewheat | serving | 124 g / 117 g "1 cup spaghetti not packed" | ('g', 190, "1 plate (80 g dry)", assumed). 80 g dry × yield (371/158 kcal ratio ≈ 2.35) ≈ 190 g | Italian standard portion 80 g dry (SINU LARN), our assumption; USDA dry vs cooked kcal | med |
| bread-wholemeal | aliases | includes "polubijeli kruh" | move to bread-white | definition (semi-white flour) | med |
| sandwich-ham | usda | 170308 turkey/roast beef/ham sub, 207 g | 170707 "submarine sandwich, ham on white bread with lettuce and tomato", 6-inch = 184 g; name "Ham sandwich (sub)" | USDA SR Legacy 170707 | med |
| burek | aliases | includes "pastry" | remove "pastry" | ambiguity (sweet pastries) | med |
| cake-sponge | GI source text | DB3 says Table 1 + A1 | note that 46 is from A2 row 1883 (5 healthy subjects) | research/gi-additions.md | high |
| movie preset | code | popcorn*3 (24 g air-popped) | add a food `popcorn-oil` = USDA 170247 "Snacks, popcorn, oil-popped, white popcorn, salt added" and use about 50–60 g in the preset | USDA SR Legacy 170247 (500 kcal/100 g, cup = 11 g) | med (record), low (amount) |
| app JSON | build | stale pancake alias | rebuild app/src/v4/food/fooddb.json from the spec | diff research vs app JSON | high |

## Open questions
1. **Burek values.** No USDA record exists. The options are (a) a label override from a Croatian producer label (Čakovečki mlinovi cheese burek 297 kcal/16 g fat; meat burek labels or entries 284–349 kcal, 14.6–20.8 g fat), or (b) a `mix` of USDA phyllo dough 172791 + cooked ground beef or cheese + oil, flagged as our recipe. Either is better than the US turnover, whose sugar of 7.87 g is the clearest error. Proposed range to show: about 280–350 kcal/100 g.
2. **Kebab.** Keep it out of the app, or add a flagged recipe? An example recipe: pita 174915 about 90 g + cooked lamb/beef about 120 g + vegetables about 60 g + yogurt sauce about 30 g, about 300 g in total. A German or Croatian döner in pita is about 350–450 g. Today typing "kebab" gives nothing, which is honest but a gap for a very common food.
3. **cake-sponge aliases "torta/kolač/cake".** Should they map to a cream-cake entry instead? SR Legacy has no generic European torta. The sponge-from-recipe record 172707 lowers sodium (228 vs 623) but has no sugars value.
4. **White bread and cornflakes, European vs US products.** US bread sugar 5.67 g vs about 1–3 g in Europe; Ralston sodium 571 vs Kellogg's EU about 450 mg. This would mean a label override; the EU values were not verified this session.
5. **Jam sugars.** USDA 48.5 g vs the EU legal minimum of 60% soluble solids for "jam". Should freeSugars use about 60 (label-based) instead?
6. **Milk chocolate free sugars.** DB null vs healthBars 20.6 g/40 g (all sugars). Pick one rule. Upper bound is consistent with Nutella; true free sugars are about 42–44 g/100 g if lactose is about 8–10 g, but that is not sourced.
7. **Type-dependent GI.** Add to the giSource for white bread and white rice the Table 1 footnote "Low-GI varieties were also identified". The potato GI is cultivar-dependent.
8. **The 2021 GI update** (AJCN 114:1625) was not read. The values above are verified against the 2008 Table 1 only.
9. **Ćevapi preset bread.** Lepinja size and record: pita 174915 or "Rolls, hard (includes kaiser)" 175031 (a 57 g roll).
10. **"pecivo"** maps to a 30 g baguette slice (it wins over croissant on DB order). A Croatian pecivo is a roll of about 60–80 g, so "Rolls, hard" 175031 may fit better.

## Sources read
- USDA SR Legacy 2018-04 (local CSV through usda_sr.py): records listed per food above.
- Atkinson, Foster-Powell & Brand-Miller 2008, Diabetes Care 31:2281, Table 1 and footnotes (research/sources/PMC2584181.xml); A1/A2 rows as given in research/gi-additions.md.
- [Ferrero Foodservice, Nutella 3 kg](https://www.ferrerofoodservice.com/uk/en/products/nutella/nutella-3kg)
- Burek ranges: [fddb, Mlinar burek s mesom](https://fddb.info/db/de/lebensmittel/diverse_burek__s_mesom/index.html), [FatSecret DE, Burek mit Fleisch](https://www.fatsecret.de/Kalorien-Ernährung/nostja/burek-mit-fleisch/100g), [Čakovečki mlinovi baked goods](https://cak-mlinovi.hr/en/kategorija_proizvoda/baked-goods/). These are crowd-sourced or producer pages and are used as a range only.
