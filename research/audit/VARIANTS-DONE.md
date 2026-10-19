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
