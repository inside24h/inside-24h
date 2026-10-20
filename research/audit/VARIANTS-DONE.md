# Variants, builders and choosers: what was built (2026-10-18/19)

Plan: `VARIANTS-PLAN.md` (the OWNER OVERRIDES won). Backup of every touched file: `backups/20261018-154610-variants/`.
Portion research: `builder-portions-research.md` (research agent, every number with its URL and quote).

## Data flow

`fooddb_spec.py` (new section "VARIANTS, SIZES, ADD-INS, BUILDERS, CHOOSERS") → `python -I research/tools/build_fooddb.py build`
→ `build_variants.py` (new, called by the build) → `research/fooddb.json` → `sync_app_fooddb.py` → `app/src/v4/food/fooddb.json`.

- `build_fooddb.py`: the old main loop is now `build_entry(e)`. Output was byte-identical before any new data was added; both JSON hashes matched the backup.
- New keys on base foods only: `ask`, `chip`, `variants`, `sizes`, `addins`, `builder`, `choose`.
- **Gate:** every old key of every food is compared with the frozen baseline in `research/audit/baseline-20261018/`. The build fails on any change not listed in `CHANGED_ON_PURPOSE`. The only changes are:
  - kebab: back, as a builder;
  - bread-white: lost the alias "tost";
  - burek: its filling aliases moved to the fillings.
- **Build checks (the build fails on any of these):**
  - unique keys;
  - a source row with a claim id on every variant, part and add-in;
  - "COMPUTED" in recipe notes;
  - Atwater ±15% for variants and for **all 11,237 builder combinations**;
  - chips at most 16 characters, with no Croatian letters;
  - variant names without parentheses;
  - no exact alias that names two things;
  - variant words must not be the name of another food;
  - every word that the spec puts on several foods must be covered by a chooser (found systematically from the shared aliases);
  - part grams must sit inside their range.
- **Mixing rule** (Python and the app are identical; a test checks this):
  - values per 100 g are weighted by grams;
  - a value is null if any part is null;
  - free sugars are summed, each part using its own WHO rule;
  - GI is weighted by carbohydrate over the parts with at least 1 g of available carbohydrate, and is null unless all of those parts have a measured GI (level C).

## What the user gets

- **"Which …?" (23 choosers):** tea, coffee, juice, milk, plant milk, cheese, bread, wine, sausage, soup, beans, chocolate, cocoa, fish, cereal, dried fruit, eggs, cold cuts, pasta, potatoes, rice, yogurt, nuts.
  - The app starts on the alias owner, and the row stays highlighted ("We started with black: pick yours.") until the person picks.
  - Picking switches the simulation and keeps the minute, the play state and the size.
  - A food's own variants that are not in the chooser appear in a second small row (for example, espresso: Regular · Decaf).
- **Builders ("What's on it?"; a bottom sheet on phones):**
  - **pizza:** 13 toppings and the presets Margherita, Capricciosa, Pepperoni, Veggie and Loaded; sizes Slice · Half · Whole.
  - **burger:** Hamburger, Cheeseburger, Double, Large or Pljeskavica, plus 9 extras.
  - **sandwich:** Ham sub, Cold-cut sub, Tuna sub, Baguette or Toast, plus 6 extras.
  - **kebab:** pita or wrap, chicken or beef/veal, vegetables and sauces.
  - **burek:** Bakery (the label), Cheese, Meat, Spinach or Potato.
  - **green salad and cabbage:** dressing (olive oil, sunflower oil, vinegar, salt).
  - The default works with zero taps and is exactly the old database food.
- **Variants (48), all with sources:**
  - Beer: light, strong, alcohol-free, radler.
  - Wine: dessert, with water (bevanda), spritzer (gemišt), rosé.
  - Rakija: 43%, 45%, 50%.
  - Energy drink: sugar-free.
  - Espresso: decaf.
  - Filter coffee: instant, decaf.
  - Coffee with milk: macchiato, instant.
  - Cappuccino and latte, each with 2%, skim, soy or almond milk.
  - Iced tea: diet.
  - Hot chocolate, protein shake and oatmeal: made with water or milk.
  - Cake: chocolate, cheesecake, strudel, cream.
  - Ice cream: chocolate.
  - Chocolate: white.
  - Fries: oven-baked.
  - Soups: vegetable broth, cream soup, beef noodle, tomato with milk, beans with sausage.
  - Sausage: smoked, bratwurst, chicken.
  - Ham: turkey.
  - Tuna: in oil.
  - Cottage cheese: low-fat.
  - Bread: roll.
- **Add-ins folded into the drink** (never a separate solid):
  - Sugar (1 tsp, 4.2 g USDA; sachets 3–5 g), Honey (7 g), Milk (a splash, 30 ml) and Extra shot.
  - Sugar cycles 1 → 2 → off.
  - Honey replaces sugar.
  - Add-ins scale with servings.
- **Sizes ("How much?"):**
  - beer 0.3 / 0.33 / 0.5 l
  - wine 1 / 1.5 / 2 / 3 dl
  - rakija 3 / 4 / 5 cl
  - energy drink 250 / 355 / 500 ml
  - cola 250 / 330 / 500 ml
  - espresso Single / Double
  - ice cream 1 / 2 / 3 scoops
  - fries Small / Medium / Large (USDA)
  - ćevapi 5 / 10 pieces
  - pizza Slice / Half / Whole
- **Search keeps these as one thing** (the merge happens after "s/sa/with/uz", and after "i/and" while a topping list is still going):
  - "pizza sa šunkom i gljivama" → Pizza Capricciosa
  - "burek sa sirom"
  - "kava sa šećerom" → espresso with sugar, still asking "Which coffee?"
  - "gemišt", "radler", "bezalkoholno pivo"
  - "pizza i pivo" stays 2 items.
  - Search and Browse show "· N kinds".
- **Deep links:**
  - Formats: `#q=beer&v=radler`, `#q=espresso&add=sugar1`, `#q=pizza&on=base+ham+mushrooms&s=whole`; meal tokens like `pizza_base_ham*2 beer.radler espresso~sugar1`.
  - An unknown or hostile v, s, add or on falls back to the default, with no "not found".
  - Old links work unchanged.
  - The curated espresso, cola and water models apply only to the plain default.
- **"How do we know?"** shows a claim for every variant, part, add-in and size: DBV-, DBB-, DBA- and DBS- ids, registered in `content/food.ts` from the JSON.

## Sources (short; the details are in the spec and in builder-portions-research.md)

- **USDA SR Legacy:** every record was checked with `usda_sr.py`.
- **Pizza:**
  - topping amounts: Burke / PizzaMarketplace "Pizza Toppings Portion Guide" v3.0 (14-inch pie ÷ 8 slices; the range runs down to the 12-inch amount);
  - check against USDA: our pepperoni slice is 113 g, 316 kcal, 13.2 g fat; USDA's 14-inch pepperoni slice is 111 g, 313 kcal, 13.2 g fat.
- **Burger and sandwich:** USDA FNDDS guideline amounts for sandwich ingredients (lettuce 8, tomato 20, onion 15, ketchup 17, mayonnaise 14, butter 14, bacon 16 g; cheese 21 g).
- **Pljeskavica:** 150 g on Glovo menus; lepinja 150 g.
- **Kebab:** USDA FNDDS gyro (pita 60 g; meat 60 g) and an RTL weighing of döner (80–173 g of meat).
- **Burek:**
  - Vindija label: 34% cheese;
  - Krajina Klas label: 38.6% beef;
  - Croatian Pravilnik NN 78/05, art. 46: at least 10% fat.
- **Alcohol-free beer:** Heineken 0.0, 21 kcal per 100 ml (FatSecret NZ; a secondary source).

## Open points (for the owner)

1. **`science/fuzzKit.ts:85`** (the other agent's area; I did not edit it): the curated check should also require `isPlain(one.food)`. Fuzz runs only on base foods today, so nothing is wrong yet.
2. **Weaker or estimated amounts, all labelled "our estimate":**
   - extra cheese: a PMQ forum excerpt;
   - tuna and egg on pizza: no portion source;
   - salami: uses the pepperoni amount;
   - spinach and potato burek proportions;
   - kebab meat: 110 g;
   - pljeskavica: we don't know whether the menu weight is raw or cooked, and its sodium is low (unsalted USDA beef).
3. **Not done:**
   - medica / honey liqueur;
   - pasta and rice sizes (no source read);
   - oat milk (no SR record; the app says so);
   - kajmak and ajvar (no USDA record);
   - a label check for radler and Red Bull Sugarfree (it uses USDA, about 75 mg caffeine, against 80 mg on the label);
   - sponge cake's 38 g piece is unchanged.
4. **Decided by me, so please check:**
   - burek with no filling named stays the bakery label, with the chip "Bakery";
   - Capricciosa = ham + mushrooms (the Croatian menu version);
   - "pecivo" is still not found, as in the audit;
   - "goveđa juha" → beef noodle soup (the closest record).
5. **Bundle size:** the app fooddb.json went from 78 KB to about 211 KB; the gzip build grew about 0.2 MB.
6. **Tests:**
   - `variants.test.ts` is new (62 tests);
   - `foodData.test.ts`: 5 golden "must find nothing" entries changed on purpose (pljeskavica, kebab, pureća šunka, goveđa juha, macchiato);
   - `senseAudit.test.ts`: the CalmBar exception was removed (CalmBar now uses SHORT_LABEL, "Blood sugar").
7. **Browser QA** (390, 360 split site, 1440):
   - no page overflow and no console errors;
   - screenshots in `scratchpad/qa/shots-var/`.

## Data round 2 (2026-10-19)

Backup of every touched file: `backups/20261019-142350-data2/`. Build: `python -I research/tools/build_fooddb.py build` (fails 0; gate passes; 50 variants, 14 sized foods). The app was NOT built (the pacing agent builds). `npx tsc --noEmit -p .` clean; `npx vitest run` 391/391.

### Weak estimates, now sourced

| item | before | after | source (read) |
|---|---|---|---|
| pizza: extra cheese / slice | 14.2 g (forum excerpt) | **6.3 g**, range 5.2–14.2 | USDA FNDDS 2021-23 recipes (`input_food.csv`): 2708622 "Pizza, extra cheese, thin crust" = 691 g chain cheese pizza + 41 g mozzarella (5.9%); 2708623 thick = 1060 g + 52 g (4.9%). × our 107 g slice. Forum 4 oz/14" kept as the top. |
| pizza: tuna / slice | 21.2 g (meat-topping amount) | **11.9 g**, range 10.8–12.8 | EU frozen tuna-pizza labels, QUID % (Open Food Facts): Dr. Oetker Ristorante Tonno 9.2%, Dr. Oetker Pizza Tonno 10%, Casino 9.4%, Auchan 10.7%. t = 107 × s/(1−s). |
| pizza: egg / slice | 6.2 g (no source) | 6.2 g, range 5.5–7.0 (unchanged number, now sourced) | one egg per pizza: Great British Chefs "Pizza Fiorentina" (1 pizza base, 1 egg); USDA egg sizes 44/50/56 g ÷ 8. |
| kebab meat | 110 g (our estimate) | **150 g**, range 60–227 | Panozzo et al. 2015, Ital J Food Saf 4:4535 (PDF read): 20 döner kebabs bought and weighed, meat 34.8% / 39.5% (median 36.7%), mean kebab 402 g (274–618) → 148 g. Cross-checks: RTL 80–173 g; USDA gyro 60 g. Default kebab is now 290 g, 464 kcal. Note: the same study's bread was 22–27% (≈100 g); our pita stays USDA 60 g. |
| burek spinach / potato | "our estimate" | same recipes (262 / 268 kcal per 100 g), now checked | no label with the shares exists that we could find (OFF, Konzum, web). Label energy as a check: spinach burek 230 / 281 / 282 kcal (OFF 3871832005535, 3800047770372, 3811832016414); potato burek 253 kcal, 9.5 g fat (OFF 7350039279179). Text says so. |
| Turkish coffee | not in the app ("turska kava" found nothing) | **filter-coffee variant "turkish"**: 70 ml, 148 mg caffeine, range 112–196 mg; in the "Which coffee?" row | Derossi et al. 2018 (J Sci Food Agric, PMID 29230816, abstract): Turkish cup 112 mg; 2.01–2.21 mg/mL (quoted in PMC8228209); Elsahoryi et al. 2025 (PMC11901579) 2.8 mg/mL; cup 70 ml (PMC10440973), 7 g + 75 ml water (PMC12581726). USDA espresso record (2.1 mg/g) used as the proxy. FNDDS 2710377 "Coffee, Turkish" rejected: it is filter coffee + sugar. |

### Missing items added (variants/sizes of existing foods only)

- **Medica** = `rakija.medica`: 24 ml 40% spirit + 4.9 g honey + 12.6 ml water per 40 ml → 24% vol, 4.0 g sugar (100 g/l), 67 kcal. Badel Medica 24% vol, "blending the base spirit, Benkovac Komovica, with natural honey" (LCBO 33641; badel1862.hr). Sugar is not published, so the EU liqueur minimum is used: Reg. (EU) 2019/787 Annex I cat. 33 "100 grams per litre in all other cases" (PDF read). The text says real medica can be sweeter.
- **Pasta / rice sizes** (Side · Plate · Large, cooked): pasta 124 / 199 / 250 g; whole-wheat pasta 117 / 199 / 250 g; white rice 120 / 158 / 224 g. Source: Irish Food Portion Sizes Database (Lyons & Giltinan, IUNA 2013, NANS 2008-10, adults 18-64, Table 4, PDF read): boiled pasta median 199 g (IQR 113–250), boiled rice median 173 g (IQR 120–224). Cross-check: SINU/LARN standard 80 g dry (IEO SmartFood sheet) = 188 g cooked pasta / 225 g cooked rice by USDA energy (371→158; 365→130 kcal). FNDDS's "1 oz dry yields 80 g" (×2.8) was not used: it does not match the energy of the USDA cooked record. Brown rice has no sizes (its USDA cup is 202 g, above the Irish IQR).

### FIXES.md undecided items

- **Melon GI: 65 stays.** Atkinson A1 rows re-read: 1021 = 65 ± 9, 8 subjects, footnote 8 (25 g carbohydrate portions), published (ref 1); 1022 = 70, no SEM, footnote 7 (only 10 g portions), unpublished (UO4). The stronger test wins; giSource now says why.
- **Canned tuna:** the default stays **in water** (no Croatian sales split of water vs oil was found; the water record is drained fish). The portion changed from the US 5-oz can (165 g) to **80 g** (Irish adults' median canned-tuna portion, IQR 50–105; Croatian/EU cans are 80 g: Eva 2 × 80 g, Rio Mare 80 g). The oil variant says that eating the oil about doubles the calories (OFF entry for Eva tuna in oil: 391 kcal, 35 g fat per 100 g). Owner may still prefer oil as default.
- **"nar" → ham:** not fixable in the data. `parse.ts` `aliasScore` gives any prefix of ≥ 2 letters 6 + len/aliasLen (6.43 for "nar"/"narezak"), above MIN_LOG 4.1, so the prefix is LOGGED. Suggested fix (parse.ts, other agent's area, NOT edited): log a prefix match only when it covers at least half of the alias (`text.length / alias.length >= 0.5`; "ban"/"banana" = 0.5 still logs, "nar"/"narezak" = 0.43 only suggests).

### Burek default (task 4)

- The Čakovečki mlinovi page (EN and HR, read 2026-10-19) describes the burek as "layers of dough and cheese filling" ("slojevi tijesta i sirnog nadjeva"): the default is a **cheese** burek, not an unnamed filling. The bakery option's text and the override text now say so (chip still "Bakery").
- Per 100 g basis: the table has no header. Verified indirectly (level B): EU 1169/2011 Art. 32(2) "shall be expressed per 100 g or per 100 ml"; the same page's 400 g breads show 222 and 260 kcal (only possible per 100 g); Atwater 299 ≈ 297; per piece it would be 198 kcal/100 g, below every burek label (247–316). The app's source note says this was checked on the web page, not on the pack.

### Tests

- `variants.test.ts`: new block "data round 2" (7 tests: Turkish coffee, medica, pasta/rice sizes, tuna portion, pizza toppings, kebab meat, burek + melon); golden: kebab 290 g, turska kava, bosanska kava, medica, tuna u ulju; "Which coffee?" now has Turkish.
- `foodData.test.ts`: "turska kava" moved from must-find-nothing to found; tuna 80 g; kebab 464 kcal.

### Open (owner)

1. "burek sa sirom" still opens our cheese recipe (289 kcal/100 g), while plain "burek" shows the producer's cheese burek (297). Merge them, or rename the base "Burek (meat/cheese pastry)"?
2. Tuna default water vs oil (see above).
3. Kebab bread: weighed Italian kebabs carry ≈ 100 g of bread; we keep USDA's 60 g pita.
4. Medica sugar is a legal minimum; a pack label would settle it.

## Data round 3 (2026-10-19): kebab vs the weighed study, GI for pizza and every carb food

Backup of every touched file: `backups/20261019-191951-data3/`. Files changed: `research/tools/build_fooddb.py` (GI rows, `gi_lookup`), `research/tools/build_variants.py` (builder option GI override), `research/tools/fooddb_spec.py`, `app/src/v4/foodData.test.ts`, `app/src/v4/variants.test.ts`, this file. Nothing deleted, nothing committed, no app build.

**The build was NOT run into the project.** `python -I research/tools/build_fooddb.py build` was refused by the permission system (it writes `research/fooddb.json` and `app/src/v4/food/fooddb.json`). A dry run of exactly the same steps, writing only to the session scratchpad, gave `fails 0` (gate passes; 50 variants, 7 builders, 11,236 combinations). Against that dry JSON: `npx tsc --noEmit -p .` clean, `npx vitest run` **27 files, 402/402**. Against the stale project JSON, 11 kebab/GI tests fail until the build runs. **Next step: run the build, then `npx vitest run`.**

### 1. Kebab: recalibrated to the composition the study measured, not to "226 kcal"

Panozzo et al. 2015, Ital J Food Saf 4:4535 (PDF re-read; Table 1 with `pdftotext -raw`):
- Table 1 (% of the kebab, Verona / Vicenza, mean ± SD): meat 34.8 ± 10.2 / 39.5 ± 6.8; bread 26.9 ± 3.4 / 22.5 ± 6.1; vegetables 24.7 ± 9.1 / 25.8 ± 7.4; sauces 13.6 ± 2.7 / 12.2 ± 4.5.
- Table 2 / Table 4 / text: energy 226.1 ± 25.7 kcal/100 g; fat 8.6 g (town SD 1.8); protein 12.95 ± 2.12 g; carbohydrate 11.3 ± 3.7 g (starch only, enzymatic AOAC 979.10); fibre 1.15 g; 402 g serving = 900.9 kcal, 34.7 g fat, 51.7 g protein, 43.8 g carbohydrate.
- **The 226 is gross energy.** Methods: "Gross energy was measured by combustion of 1 g of sample … in a bomb calorimeter". Food labels and USDA give metabolizable (Atwater) energy, which is lower (protein burns at about 5.65 kcal/g but gives the body 4). The study's own macros give 12.95×4 + 8.6×9 + 11.3×4 + 1.15×2 = **177 kcal/100 g** (town and meat-group means 170–187; sugars were not measured, so a few kcal more). Matching 226 would overstate the energy by about a quarter. So the target was the measured **composition**.
- Our old default (330 g, 174 kcal/100 g) was about right in energy, but by accident: half the study's fat (4.4 g vs 8.6 g/100 g), half its vegetables (50 g vs about 100 g) and too little sauce (30 g vs about 52 g).

| part | before | after | why |
|---|---|---|---|
| chicken | USDA 172388 thigh meat only (8.2% fat), 150 g | **USDA 173625 thigh meat and skin** (14.7% fat), 150 g | The study: collagen "increases as a function of the amount of skin that is inserted in the Döner preparation". Without skin, the measured 8.6 g fat/100 g cannot be reached at the measured sauce share. |
| vegetables | tomato 30 + onion 20 = 50 g | **tomato 40 + onion 25 + lettuce 30 (now on) = 95 g** | 25.25% × 402 g = 101 g. The split between them is ours; lettuce stands in for the study's salad and cabbage. |
| sauce | yogurt 30 g | **yogurt 38 g + mayonnaise 14 g (now on) = 52 g** | 12.9% × 402 g = 52 g. The study: "the sauces used, like mayonnaise and ketchup, were bought at the supermarket"; the sauce pH points to "frequent use of yoghurt". The yogurt/mayo split is ours. |
| pita | 100 g | 100 g | unchanged (24.7% × 402 g) |

- **Result** (default chicken in pita): 397 g, **192 kcal/100 g, 762 kcal**; fat 8.85, protein 11.7 g/100 g. Fat and protein sit inside the study's mean ± SD. The energy lies between the study's Atwater value (177) and its gross value (226). The meat, bread, vegetable and sauce shares also sit inside the study's ranges.
- Beef/veal pita: 820 kcal. Chicken wrap: 708 kcal.
- The presets now include lettuce and mayo. The builder note in the app explains gross vs usable energy in one sentence.
- Test: `variants.test.ts` "the default kebab sits inside the weighed Italian study" (serving 274–618 g; fat 8.6 ± 1.8; protein 12.95 ± 2.12; kcal between 170 and 226.1; the four shares inside Table 1's mean ± SD).

### 2. GI: pizza and every food with > 10 g available carbohydrate

**Sources read:**
- Atkinson 2008 Suppl. Tables A1 (healthy) and A2 (`dc08-1239_1/_2.pdf`, `pdftotext -raw`).
- The 2021 edition, Atkinson FS, Brand-Miller JC, Foster-Powell K, Buyken AE, Goletzke J. AJCN 114:1625 (PMID 34258626):
  - The OUP page returned HTTP 403.
  - The online supplement was read as PDF from a mirror: `nutritotal.com.br/pro/wp-content/uploads/2021/09/Tabela1_IG.pdf` and `Tabela2_IG.pdf`. The header reads "Online Supplemental Material - Atkinson FS … 2021".
  - Suppl. Table 1 follows ISO 26642 (≥ 10 healthy adults). Suppl. Table 2 uses less robust methods.
- The 2021 edition has no mixed-meal section: no pizza chain or hamburger rows.

**Decision: the measured whole-food GI wins.**
- Where a whole food of the same kind was tested in healthy people, the builder uses that value for every combination.
  - Mechanism: `opt(..., gi=KEY, gi_why=...)` in the spec. Each carbohydrate part counts at the whole-food GI, so the app's unchanged mixing rule gives the same number. The reason is appended to the option's "How do we know?" text.
- Otherwise the GI is the carbohydrate-weighted mean of parts that have tested GIs (level C). It is null if any part with ≥ 1 g carbohydrate has none. That is the existing rule (`CARB_MIN`), and `parse.ts` is unchanged.

| food | GI | rows |
|---|---|---|
| **pizza** (base and all 5 presets, every topping) | **43** | Healthy whole-pizza tests: A1 1222–1224 Pizza Hut Super Supreme pan 36 ± 6, thin 30 ± 4, Vegetarian Supreme thin 49 ± 6; 2021 T2 3761 ham/mozzarella/onion pizza (Lebanon) 56 ± 7, 12 subjects. Mean 43, range 30–56. Not used: whole-wheat pizza (A1 1225, 54); people with diabetes (A2 2248 cheese pizza 60, 2249 plain dough 80). No plain cheese pizza was tested in healthy people. The dough alone (2021 T1 68, Boboli base) is 52. |
| **burger** (all 5 types, every extra) | **66** | A1 1175–1178: hamburger 66 ± 8, lean beef burger with cheese 66 ± 4, Fillet-O-Fish 66 ± 10, McChicken 66 ± 3 (10 subjects each). The tested hamburger had ketchup and onion, so extras count at 66. |
| **sandwich** (ham, cold-cut, tuna sub; toast) | **75** | Table 1 white wheat bread 75 ± 2. No sub was tested; the roll carries the carbohydrate (level C). Whole sandwiches on white vary with the filling: A1 1259 tandoori chicken on a white French roll 78 ± 7; 1264 white roll with cheese 50 ± 5; 1270 white toast with cheddar 35 ± 2. |
| kebab pita / wrap (parts) | 68 / 30 | A1 295 white pita (UK) 68 ± 5 (also 2021 T1 347); A1 1845 wheat tortilla (Mexico) 30, 8 subjects (2021 T2). |
| kefir | 36 | 2021 T1 933 Lifeway low-fat plain kefir 36 ± 9: the same product as the USDA record |
| yogurt, plain / low-fat | 17 / 35 | 2021 T1 1046 natural yoghurt, no added sugar 17 ± 2; 1047 low-fat natural (UK) 35 ± 10, 9 subjects |
| croissant | 56 | 2021 T1 "Croissant, mean of two foods 56" (45 ± 6 and 67 ± 2) |
| mashed potato | 79 | 2021 T1 "Mashed potato, mean of five studies 79" (73–91) |
| chocolate milk | 29 | 2021 T1 "Milk, reduced- or low-fat, flavored, mean of seven foods 29" |
| smoothie | 39 | 2021 T1 123 Innocent strawberry & banana 39 ± 4 (class mean of 9: 38) |
| mandarin | 52 | 2021 T1 1140, Italy, 52 ± 8, 9 subjects |
| rye bread | 60 | 2021 T1 "Rye breads, mean of 13 foods 60" |
| iced tea | 74 | 2021 T1 89 RTD black tea with lemon (Singapore) 74 ± 7, 14 subjects; Estathé lemon 72 ± 6 |
| peach | 76 | 2021 T1 1155, Italy, 76 ± 9, 9 subjects (the only raw peach; canned 30–64) |
| pear | 33 | 2021 T1 1161 Williams, ripe 33 ± 4 (unripe 24 ± 3) |
| blueberries | 53 | 2021 T1 1092 = A1 965, wild blueberries 53 ± 7 (nearest tested: wild, not cultivated) |
| latte, cappuccino | 39 | Table 1 full-fat milk 39 ± 3: all their carbohydrate is milk lactose. The 2% and skim variants already had their milk's GI, so the plain drink did not. |
| white chocolate (variant) | 41 | 2021 T1 "Chocolate, white, mean of four studies 41" |
| chocolate cake (variant) | 38 | A1 4, packet-mix chocolate cake with frosting 38 ± 3 |
| hot chocolate with water (variant) | 51 | A1 85, Nestlé hot chocolate mix made with hot water 51 ± 3 |
| bread roll (variant) | 75 | inherits white bread (Table 1 class) |

**Still no GI (> 10 g available carbohydrate). This allow-list, with its reasons, is in `variants.test.ts`, and the test fails on any new gap:**
- **beer**: 2021 T1 has two beers, 119 ± 10 and 89 ± 2 (mean 104). Not adopted: the two disagree by 30, and a beer glucose curve would change the alcohol story and its tests. **Owner decision.** Alcohol-free beer and radler: no test.
- **kebab** (every combination with tomato or onion): pita, wrap and yogurt have tested GIs, but tomato (1.1 g carbohydrate) and onion (1.9 g) have none, and the rule needs every part with ≥ 1 g. **Proposal (parse.ts, not my file):** set the builder `CARB_MIN` to 3 g in both `parse.ts` and `build_variants.py`, the same 3 g that `macros()` already uses for a meal ("no meaningful sugar response"). The default kebab would then get 66, from pita 68 and yogurt 17. A test proves the mechanism today: a kebab without tomato and onion shows 66.
- **burek** (all four): no burek or phyllo pie was tested. The nearest disagree: fatayer pastries 78–80 (2021 T2, Qatar, 19 subjects) vs puff pastry 47 and 56 (2021 T1).
- **Other foods:**
  - hot chocolate made with milk: no test;
  - buttermilk: not listed;
  - dessert wine: no test;
  - protein shake: the powder is untested;
  - baguette and the baguette sandwich: tests disagree, as decided in the 2026-10-17 audit;
  - saltine crackers: not tested;
  - US pancakes: 46–102 by recipe;
  - bean soup with or without sausage: no test;
  - chocolate ice cream: only one low-fat brand was tested;
  - cheesecake, strudel and cream cake: no test;
  - sub with ketchup: ketchup was never tested.
- **What the app shows then** (`foodProduct.ts`, `CalmBar`):
  - a single food: "Its glycemic index has not been measured, so we don't draw a sugar curve." and "Blood sugar: not measured";
  - in a meal: "The glycemic index of … has not been measured, so the sugar curve leaves it out: the real rise is likely higher."
  - This is honest: there is no invented curve, and the user is told that a missing part means a higher real rise.

### Tests (all in my files)

- `variants.test.ts`, new block "data round 3" (7 tests):
  - GI coverage over every food, variant, preset and one-tap builder change, with the allow-list;
  - the allow-list is not stale;
  - pizza 43 everywhere;
  - burger 66 everywhere;
  - subs 75, kebab parts 68/30 and a kebab without tomato/onion at 66;
  - the new GI values;
  - the kebab inside the study.
- Golden updates:
  - kebab 397 g;
  - "kebab s teletinom" now has the key `kebab_pita_beef_tomato_onion_lettuce_yogurt_mayo`;
  - the kebab name test.
- `foodData.test.ts`: kebab 397 g / 762 kcal.

### Open (owner)

1. **Run the build** (`python -I research/tools/build_fooddb.py build`). It was refused by the permission system for me; the dry run is clean.
2. Beer GI 104 (two tests, 89 and 119): adopt or keep it null?
3. Builder `CARB_MIN` 1 → 3 g (`parse.ts` + `build_variants.py`), so that the kebab gets its GI.
4. Kebab chicken skin: no döner-skewer label could be read (REWE pages 403; Open Food Facts search down). A label would make the meat record firmer than "thigh with skin".
