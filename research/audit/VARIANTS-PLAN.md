# Variants plan (Plan agent, 2026-10-17)

## OWNER OVERRIDES (2026-10-18). These win over anything below.
1. **When a word is ambiguous, ask; never guess.** Searching "tea" or "čaj" shows "Which tea?" with Black · Green · Herbal · Iced. "kava"/"coffee" shows Espresso · Filter · With milk · Cappuccino · Latte. "sok"/"juice" shows Orange · Apple · Tomato. Apply this to every word that matches several foods.
   - The simulation may start on the most common choice, but the chooser stays visible and obvious until the user picks.
2. **Composite foods are BUILDERS, not just a few presets.** Pizza: a base (dough, tomato, mozzarella), then the user ticks what is on it: extra cheese, salami/pepperoni, ham, sausage, bacon, mushrooms, peppers, onion, olives, corn, tuna, egg, and so on. Each topping has a sourced USDA record and a sourced typical grams-per-slice (or per-pie), labeled "our estimate" with a range.
   - Size is still separate: Slice · Half · Whole.
   - A few one-tap presets (Margherita, Capricciosa, Pepperoni, Veggie, Loaded) just pre-tick toppings.
   - Use the same builder for sandwich, burger/pljeskavica, kebab, salad, burek filling, and coffee/tea add-ins.
3. **Kebab comes back as a builder:** pita or wrap, chicken or beef/veal, vegetables, sauces. It is an existing DB food, not a new one.
4. Every number must be sourced, with honest ranges. No guessing.

Read-only design. Implement only **after** the food data fixes in FIXES.md are done.

## Key facts
- Pizza records are close per 100 g: 240–300 kcal across 11 SR Legacy records.
  - Sodium varies more: 447–783 mg.
  - Weight varies most. A slice is 69–153 g; a whole 12" pie is 532–1107 g.
  - So for pizza the **size** control matters as much as the variant. The same holds for burgers: 95 g to 399 g.
- `app/src/v4/food/fooddb.json` is a hand-maintained second file. The build must write both files; see FIXES.md, step 1.
- The app has overrides keyed by id: SERVING_FIX, GI_ADD, labelFix and PORTION_BY_FOOD in parse.ts, plus CURATED (espresso, cola, water) in AppV4.tsx, analyze.ts, deeplink.ts and science/fuzzKit.ts.
  - These must apply **only to defaults** (`!f.v && !f.with`).
  - Otherwise a decaf espresso gets the curated caffeine model, and a cheesecake gets the sponge-cake GI.
- Variants **keep the base id** and add the key `v`. This keeps the regex-based isDrink, the Browse groups, HABIT_OF and SWAPS working.
- "kava sa šećerom" is split today into espresso + sugar. The sugar becomes a separate *solid* and enters the stomach food phase, which is wrong. Fix this with add-ins.
- `per100()` in mixes: if any component is missing a nutrient, the whole mix gets null. Use complete records: tap water 173647, not Perrier; 173176, not 173202.
- Mix free sugars = sum per component, using each component's own rule. Mix GI = carb-weighted when every carb-bearing part has a GI, otherwise null. Both get evidence level C.

## Foods with variants
Default first. Source codes: FDC id = SR Legacy record; R = our recipe; P = proxy.

### Meals and savory
- **pizza**
  - Cheese/Margherita 170317 (keep the 107 g slice).
  - Ham & mushroom: R = 170317 + ham 173864 15 g + mushrooms 10 g.
  - Pepperoni 172096 / 173279.
  - Loaded: Super Supreme 173281 (slice 127 g, pie 1107 g).
  - Veggie: R.
  - Sizes: Slice · Half (×4) · Whole (×8).
- **burek**: all variants are recipes. The current proxy 168963 has 7.9 g sugar, which is wrong.
  - Cheese: phyllo 172791 45 + cottage cheese 172179 30 + feta 8 + egg 5 + sunflower oil 171017 12 per 100 g, about 299 kcal/100 g.
  - Meat: phyllo 45 + beef 171798 30 + onion 8 + oil 12, about 334 kcal/100 g.
  - Spinach & cheese (zeljanica), about 276 kcal/100 g.
  - Potato, about 281 kcal/100 g.
  - Piece range 150–300 g, plus about 10% because baking water loss is not modeled.
- **hamburger**
  - Hamburger 170717 (95 g).
  - Cheeseburger 170320 (119 g).
  - Big Mac-type 170720 (219 g).
  - Whopper-type 170728 (316 g).
  - Pljeskavica: R = beef 171798 150 + pita 174915 100 + onion 20 + sour cream 171257 10, about 670 kcal. The "pljeskavica" alias moves here.
- **kebab**: returns via sourced parts. **NEEDS OWNER SIGN-OFF** (no-new-foods rule).
  - Chicken in pita: R = pita 80 + chicken thigh 172388 110 + vegetables 50 + yogurt 15 + mayonnaise 5, about 470 kcal.
  - Beef: P 171797, about 570 kcal.
  - Wrap: P = tortilla 167535, about 560 kcal.
- **sandwich-ham**
  - Sub 170308 (current).
  - Ham sub 170707.
  - Bakery ham-cheese baguette: R = 172675 100 + ham 40 + gouda 25.
  - Toast ("tost"): R = 2 slices 174924 + ham 28 + gouda 20.
  - Cold-cut 170696, tuna 170299.
- **fries**: deep-fried 170698 · oven-baked 169264. Sizes: Small 71 · Medium 117 · Large 154 g.
- **Soups**
  - Vegetable: canned 174564 · clear broth 171583 · cream 172915.
  - Chicken: noodle · beef noodle 172906 · broth 171538.
  - Tomato: water 171176 · milk 174546.
  - Bean: ham 171144 · sausage 172905.

### Sweets and dairy
- **smoothie**: juice 168214 · yogurt 170775 · homemade milk & banana R.
- **cake-sponge**
  - Sponge 172706 (the 38 g piece is too small).
  - Chocolate frosted 174934 (138 g).
  - Cheesecake 172711.
  - Strudel 175032.
  - Cream cake P 172696.
- **ice-cream**: vanilla 167575 · chocolate 168809 · sorbet P 167577 (flagged: contains milk) · soft-serve 167981. Sizes: 1 · 2 · 3 scoops (66 g each).
- **chocolate-milk-bar**: milk 167587 · nuts 168754 · white 167571.
- **yogurt-fruit**: low-fat fruit 170889 · Greek fruit 170905 · vanilla 170888 · sweetener 172218.
- **muesli**: Familia 169076 · crunchy granola 172975 · homemade granola 171646 · no added sugar R.
- **croissant**: butter 174987 · cheese 174989 · chocolate R (+ spread 168000 15 g) · jam R (+ jam 169641 15 g).
- **doughnut**: glazed · jam-filled 172759 (the "krafna" alias moves here) · cream 172757.
- **popcorn**: air-popped · oil-popped 169861 · microwave butter 167549. The movie preset uses oil-popped.

### Coffee and tea
- **espresso**: regular · decaf 174125. Sizes: single · double. Add-in: sugar.
- **filter-coffee**: brewed · instant 174130 · decaf 171889. Add-ins: sugar, milk. Turkish coffee: no record (open question).
- **coffee-with-milk**: current R · macchiato R (espresso 30 + milk 30; the alias moves here) · instant + milk R. Add-in: sugar.
- **cappuccino / latte**
  - Milk: whole · 2% 171267 · skim 171269 · soy · almond 174832. No oat: there is no SR record; say so.
  - Add-ins: sugar, extra shot. Latte sizes: Regular · Large.
- **black-tea**: add-ins sugar, honey, milk. **green-tea, herbal-tea**: add-ins sugar, honey.
- **iced-tea**: sweetened 171888 · diet 171892.
- **hot-chocolate**: milk 171277 · mix with water 174123.
- **protein-shake**: milk · water R (whey 173180 30 + water 250).
- **oatmeal**: water · milk R (oats 173904 40 + 2% milk 200).

### Alcohol
- **beer**
  - Regular 5% 168746 · light 4% 168749.
  - Strong 171906, about 9–10%; label it honestly.
  - Alcohol-free 174863: a malt beverage; its sugar likely overstates EU lagers, so give a range.
  - Radler: R = 50% beer + 50% lemonade 173217.
  - Sizes: 0.3 · 0.33 · **0.5 l**.
- **red-wine**: table 173190 · bevanda R (1:1 with tap water) · dessert/prošek 173176. Sizes: 1 · **1.5** · 2 dl.
- **white-wine**: table · gemišt R · rosé 171908 · sweet 173176. Do not use 173202 (it has no sugar value).
- **rakija**
  - 40% (current) · 43% 171919 · 45% 171920 · 50% 173664.
  - Sweet liqueur (medica): R = spirit 70 + honey 15 + water 15, about 25%.
  - Do not use 173665 (it contains caffeine).
  - Sizes: 3 · **4** · 5 cl.

### Soft drinks, bread, meat, vegetables
- **energy-drink**: Red Bull 173210 · sugar-free 171870. Sizes: **250** · 355 · 500 ml.
- **cola**: sizes only (glass 250 · **can 330** · bottle 500). The curated model applies only to the default can.
- **bread-white**: sliced · roll (kifla) 172793.
- **cheese-cottage**: creamed 172179 · low-fat 172182.
- **sausage**: pork 174577 · smoked 174584 · bratwurst 171620 · chicken/turkey 173871.
- **frankfurter**: beef 174614 · pork & chicken 171633 · chicken 171624.
- **ham**: pork · turkey 168092 (the "pureća šunka" alias moves here).
- **tuna-canned**: water 171986 · oil 173708.
- **chicken-breast**: roasted · breaded P.
- **salad-lettuce, cabbage**: plain · with oil & vinegar R (+ olive oil 171413 10 + vinegar 172240 5).
- **Size only**
  - cevapi: 5 · 10 pieces (piece weight is level C).
  - pasta, rice-white: Side (1 cup) · Plate · Large (C).

About 100 other foods need no variants.

## Controls
- **Variant** ("Which …?" chip row) and **size** are separate controls.
- Named sizes are shown in the existing CalmBar "How much?". Use at most 4 buttons with labels of 7 characters or fewer; otherwise fall back to ½·1·2·3×. No 2-D grid.

## Data model
- **Spec API**
  - `add(..., ask="Which pizza?", chip="Cheese")`
  - `var(base, v, chip, name, mix|usda, serving, words, aliases, gi, proxy, rng, note)`
  - `size(base, [(key, label, mult)], src)`
  - `ADDINS = {sugar: 4.2 g (USDA 169655 tsp), honey: 7.0 g, milk: 30 ml whole, shot: espresso 30}` and `addins(base, [...])`
- **Names and GI**
  - Variant names must have no parentheses, because describe/shortName/itemNoun strip them.
  - A variant's GI is not inherited unless the spec says `gi="inherit"`.
- **Build**
  - Refactor `build_entry(e)`.
  - Add checks: unique slug keys; a source on every variant; "COMPUTED" in recipe notes; Atwater within ±15%; warn on nulls from incomplete parts; chip ≤ 16 ASCII characters; a variant's words must not equal another food's alias.
  - Write both JSONs. The app JSON adds `ask`, `chip`, `variants[{v, chip, name, words, aliases, serving, p, gi, proxy, recipe, fdc, src, range}]`, `sizes` and `addins`.
  - Move SERVING_FIX into the spec.
- **parse.ts**
  - `Food` gets `v?`, `variants?`, `sizes?`, `addins?`, `with?` and `range?`.
  - FOODS stays base-only.
  - New helpers: `foodKey` = `id[.v][~sugar2]`, `variantOf` and `withAddins`. `withAddins` gives a cached derived Food, gram-weighted from DB foods.
  - `Part` gets `servings?`.
- **Deep links**
  - Single item: `#q=pizza&v=ham-mushroom&s=whole` and `#q=espresso&add=sugar1`. `s` beats `n`.
  - An unknown v/s/add falls back to the default without setting miss. Use own-keys only (`__proto__` safe).
  - Meal tokens: `<id>[.<v>][~<addin><n>]*[*<n>[g]]`.
  - `chooseFood` must use `writeLink(linkFor(parts))`.
- **Search**
  - Variant candidates appear only when one of their `words` is present.
  - Exact variant aliases score 10, so the whole phrase wins before the s/sa/with split.
  - After the split, merge two cases into the previous part. A variant word ("sirom", "mesom", "sojinim mlijekom") selects that variant. Sugar or honey after an add-in drink becomes an add-in.
  - "kava s mlijekom" stays coffee-with-milk.

## UX
- **Simple / Full / Detailed**
  - The "Which …?" row goes in MealBar under search, in every mode, only for foods with variants.
  - The default is preselected. The row is one line with horizontal scroll, at most 5 chips, `role=radiogroup`.
  - A muted caption shows kcal per serving, the range and the source ("our recipe" / "USDA record").
  - Switching variant keeps the current minute and the paused state.
- **Add-ins** sit after a divider as toggles. "+ Sugar" cycles 1 → 2 → off. Honey replaces sugar.
- **Meal mode**: a chip shows "Pizza·Ham ▾". On desktop it opens a popover, on mobile a bottom sheet. There are no per-item rows.
- **Search and Browse**: show a "· 5 kinds" hint. Browse never lists variants as rows.
- **Add-ins are folded into the drink.** They are not meal items (sugar would be modeled as a solid) and not variants (the combinations explode).
  - Sugar and honey count fully as free sugars.
  - The add-in amount scales with servings.

## Steps
1. Spec/build refactor and dual JSON. Gate: unchanged foods must produce an identical app JSON.
2. Phase 1 data: pizza, burek, hamburger, kebab, sandwich, fries, soups, beer, wines, rakija, energy drink, coffee + add-ins, tea add-ins, cake.
3. parse.ts.
4. meal.ts (`foodKey` in addParts, token grammar, setVariant, stepOf for named sizes).
5. deeplink.ts (v/s/add; curated and sameMeal checks use foodKey).
6. AppV4.tsx, analyze.ts and fuzzKit.ts: curated guard, writeLink, chooseVariant, toggleAddin.
7. UI: VariantPicker.tsx, MealBar, CalmBar sizes, "N kinds" hints, CSS.
8. Phase 2 data and the movie preset.
9. Browser QA, tests, builds.

## Tests
- **Compatibility**: base foods keep their values, except an allow-list.
- **Variant integrity**: every variant has a source, passes Atwater, has an ASCII chip, a unique key, a sane range and recipe flags.
- **Search golden cases**: pizza capricciosa; burek sa sirom/s mesom; bezalkoholno pivo; radler; gemišt; bevanda; kava sa šećerom; kava s mlijekom; pizza and a beer.
- **Deep-link round-trips**, including unknown v and `__proto__`.
- **Meals**: two variants of the same food stay two items; setVariant keeps servings; espresso + 1 sugar = +4.2 g sugar, about +16 kcal, still a drink.
- **Overrides** must not apply to variants.

## Risks
- **Defaults change** (burek about 456 → 600 kcal; kebab gets data), so old shared links will show new numbers. Needs owner sign-off.
- **Curated espresso/cola** id checks in 4 places must check `v` and `with`.
- **Recipe honesty**: label as "our recipe" / "closest record" with ranges.
- **Search collisions**: "sirom" (cheese) and "kava".
- **Null propagation** in mixes.
- **UI creep**: cap of 5 chips.
- **Bundle size**: about +50 KB.
