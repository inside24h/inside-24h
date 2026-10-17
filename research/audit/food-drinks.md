# Food data audit: drinks (2026-10-17)

Auditor: drinks group (35 foods). Read-only audit. Every number below was read from `research/fooddb.json`, the USDA SR Legacy CSV through `research/tools/usda_sr.py`, or the app code. The app's behavior was checked by bundling `app/src/v4/food/parse.ts` with esbuild into a scratch script and running `parseMeal()` / `macros()` on typed phrases. No project file was changed.

**Count: 3 high, 11 medium, 9 low** (plus 1 info note on data sync and 8 open questions).

## Method notes
- `app/src/v4/food/fooddb.json` (the file the app imports) matches `research/fooddb.json` for all 35 drinks: the same per-100 g values, serving, aliases, kind and GI. Outside this group the app copy is out of sync. `kebab` is missing in the app copy, and the `pancake` aliases differ. This is INFO for the owner of that group.
- App-side overrides that touch drinks:
  - `parse.ts labelFix`: cola only. It uses EU label values from `COLA.eu` (139 kcal, 35 g sugar, 0 fat, 32 mg caffeine per 330 ml).
  - `parse.ts PORTION_ML` / `PORTION_BY_FOOD`: glass 250, cup 200, can 330, bottle 500, pint 500, shot 30. Wine glass 150, beer glass 300, rakija 40, espresso 30. The energy drink can is 250.
  - `healthBars.ts`: `ETHANOL_G` beer 19.7 g, wine 14.2 g. `ITEM_FX` espresso 63 mg, cola 32 mg, green tea 30 mg caffeine, orange juice 22 g free sugar.
  - `colaSim.ts` COLA, `content/espresso.ts` (63 mg/shot), `stories.ts`, `products.ts` and `headlines.ts` all repeat 32 mg / 35 g / 139 kcal for cola and about 63 mg for espresso. These agree with the database.
- ABV check, done as alcohol g/100 g × density ÷ 0.789:
  - beer 3.9 × 1.004 / 0.789 = **4.96 %**
  - red wine 10.6 × 0.994 / 0.789 = **13.4 %**
  - white wine 10.3 × 0.994 / 0.789 = **13.0 %**
  - rakija 33.4 × 0.940 / 0.789 = **39.8 %**

  All four are realistic.

## Verdict per food

| food | verdict |
|---|---|
| water | OK. 250 ml, 0 kcal, Na 4 mg/100 g. |
| sparkling-water | LOW: `sugars`, `caffeineMg` and `alcoholG` are null (the Perrier record has no value). Perrier sodium is 1 mg/100 g, while Croatian mineral waters can have far more sodium (open question Q6). |
| cola | OK after the app override: 139 kcal, 35 g sugar, 32 mg caffeine per 330 ml (EU label). Coca-Cola's own FAQ says 33 mg per 330 ml, which is close enough. The raw USDA record (US cola, fat 0.25 g, 30.8 mg/can) is correctly overridden. GI 59 is "soft drink/soda", flagged as nearest class. **Aliases: HIGH, "sok" → cola** (see energy-drink/orange-juice). **MED: "soda" → cola**, and **MED: "cockta" fuzzy-matches cola**. |
| diet-cola | OK. 12 mg/100 g = 39.6 mg/330 ml, inside the brand range of roughly 32–43 mg (Pepsi Max UK 42.6 mg/330 ml per caffeineinformer). Could show a range. |
| orange-juice | OK. USDA chilled juice, GI 50 (Atkinson Table 1), free sugars = all (WHO). It is the intended winner for "juice" and "sok", but "sok" currently goes to cola. |
| apple-juice | OK. GI 41, free sugars = all. |
| tomato-juice | MED: the record is "without salt added" (Na 10 mg/100 g). Typical shop tomato juice is salted. The USDA "with salt added" record 170458 has Na 253 mg/100 g with the same other nutrients. Free-sugar rule "none" is debatable (Q3). |
| coconut-water | OK. freeSugars null with an honest note (Q3). |
| energy-drink | **MED: caffeine 29 mg/100 g (USDA) gives 74.8 mg per can. The Red Bull label is 80 mg/250 ml (32 mg/100 ml).** Sugar 10.22 g/100 g ≈ 10.6 g/100 ml, against 11 g/100 ml on the label (minor). LOW: the data label is "1 can 8.4 fl oz" (US units; `servingText` shows "1 can (250 ml)"). **HIGH: the alias "monster" maps to a 250 ml Red Bull.** A Monster EU can is 500 ml with 160 mg caffeine (32 mg/100 ml) and about 42 g sugar, so the app shows about half of both. |
| espresso | OK. 212 mg/100 g gives 63.6 mg per 30 ml shot (USDA 171891). Published range: 48–317 mg per serving in 104 coffee-shop espressos (Ludwig et al. 2014). EFSA/EUFIC uses 80 mg per 60 ml espresso. The story text already mentions the variation. "kava", "crna kava", "kafa" and "šalica kave" all resolve to espresso, which is sensible in Croatia. Missing: "dupli/double espresso", "produženi" (lungo). |
| filter-coffee | OK. 40 mg/100 g gives 100 mg per 250 ml (EFSA/EUFIC: 90 mg per 200 ml). "coffee" → filter coffee is fine in English. **MED: the alias "turska kava" → 250 ml of filter coffee.** Turkish coffee is an unfiltered drink in a small cup of about 60–90 ml, so the volume is wrong and the caffeine is a guess (Q4). |
| coffee-with-milk | OK as a flagged mix: 150 g coffee + 50 g milk, 60 mg caffeine. LOW: the aliases "macchiato"/"makijato" map here (200 g). A Croatian macchiato is an espresso with milk foam, about 60–100 ml. Caffeine is similar (60 vs 64 mg), but the volume and kcal are off. LOW: sugars 1.26 > carbs 1.2 (USDA milk quirk, see milks). |
| cappuccino | OK as a flagged mix: 30 g espresso + 120 g whole milk, 63.6 mg caffeine, 77 kcal. LOW: `kind` is "semi", so a cappuccino alone gets `meal.kind = semi`. `foodProduct.ts` then treats it as not-a-drink (stomach claims GE1/GE4/GE5 for solid food instead of GE12). Latte is "liquid". |
| latte | OK as a flagged mix: 30 g espresso + 220 g milk, 63.5 mg caffeine. "latte macchiato" → latte is good. |
| black-tea | OK. 20 mg/100 g gives 50 mg per 250 ml (EFSA/EUFIC: tea 220 ml ≈ 50 mg). The plain "čaj"/"tea" → black tea (50 mg) is ambiguous (Q5). |
| green-tea | OK. 12 mg/100 g gives 30 mg per 250 ml, which matches healthBars `tea: 30`. |
| herbal-tea | OK. 0 mg caffeine. |
| iced-tea | **MED: the density is wrong.** The USDA record 171888 has one portion, "cup = 271 g", which gives 1.145 g/ml. That is impossible for a drink with about 10 % sugar. As a result, 250 ml becomes 286.4 g and every value per serving is about 10.7 % too high (129 kcal and 27.2 g sugar instead of about 116 kcal and 24.6 g). Comparable USDA RTD lemon teas give 1 fl oz = 30.6 g → 1.035 g/ml (Lipton Brisk 175111, Nestea 174847). Caffeine 9 mg/100 g (26 mg per 250 ml) is above those two US records (2–3 mg/100 g), and EU products differ (Q7). |
| milk-whole | OK. USDA 3.25 % (HR 3.2 %), density 1.031, GI 39 (Table 1, full-fat milk). "mlijeko"/"milk" → whole milk is a sensible default. LOW (all milks): USDA sugars (5.05) > carbs (4.8) is a by-difference artefact that is visible on screen. |
| milk-semi-skimmed | LOW: this is a US 2 % record (fat 1.98, 50 kcal), but it carries the aliases "mlijeko 1.5", "semi-skimmed milk" and "polumasno mlijeko". European semi-skimmed milk is about 1.5–1.8 % fat. The name says "2 %" honestly. GI 39 is flagged as nearest class (Q1). |
| milk-skimmed | OK. GI 37 (Table 1, skim milk). |
| chocolate-milk | OK. Free sugars = sugars − lactose = 5.72 g/100 g (WHO-consistent). Caffeine 1 mg/100 g. "kakao" → chocolate milk (it beats hot chocolate) is acceptable. |
| hot-chocolate | OK. Homemade with milk, caffeine 2 mg/100 g, free sugars minus lactose. A café "topla čokolada" from a mix is thicker and sweeter (Q8). |
| soy-milk | OK. Free sugars use an upper bound (sweetened original/vanilla). GI 34 (Table 1). |
| almond-milk | **MED: the density is wrong.** The USDA portion "cup = 262 g" gives 1.107 g/ml, so 250 ml becomes 276.9 g (+9 %). The other USDA almond milks (168751, 174820, 173187) give 1 cup = 240 g → 1.014 g/ml. |
| rice-milk | OK. GI 86 (Table 1). freeSugars null (Q3). |
| buttermilk | OK as a proxy for mlaćenica. Ayran is salted yogurt and water, and the 148 mg Na/100 g is plausible. |
| kefir | OK. US Lifeway 1 % record (HR kefir is often 2.8–3.2 %, Q1). `kind` "semi" (same note as cappuccino). |
| beer | OK. 3.9 g/100 g = 4.96 % ABV, 500 ml = 19.6 g alcohol (healthBars 19.7, consistent). 216 kcal per 500 ml, Atwater check passes. **MED: "limenka piva"/"can of beer" → 330 ml.** The standard Croatian beer can is 0.5 l. LOW: "pint" = 500 ml (UK pint 568 ml, US 473 ml). Missing: "bezalkoholno pivo", "tamno pivo", "radler", "cider". Correctly, they do not fall back to regular beer. |
| red-wine | Values OK: 13.4 % ABV, 150 ml = 15.8 g alcohol. **HIGH: "boca vina"/"bottle of wine" → 500 ml.** A wine bottle is 750 ml, so alcohol shows as 52.7 g instead of about 79 g. **MED: healthBars uses wine 150 ml = 14.2 g (12 % ABV)** while the database shows 15.8 g (red) and 15.4 g (white), so the same glass has two alcohol figures in the app. "vino"/"wine" → red wine (first listed) is acceptable. Missing: rosé (USDA 171908), gemišt, bambus, spritzer, prošek. |
| white-wine | Values OK: 13.0 % ABV, 150 ml = 15.4 g. Bottle and healthBars issues as for red wine. |
| rakija | OK. Proxy is USDA 80-proof spirits: 39.8 % ABV, 40 ml = 12.6 g alcohol. Density 0.940 (USDA fl oz) vs the textbook 0.948 for 40 % v/v is a negligible difference (0.1 g). Shot 40 ml is inside the 30–50 ml reference. LOW: "vodka"/"whiskey" display as "Rakija / brandy (40%)". Homemade rakija is often 45–50 % (Q2). Missing: gin, rum, liker, pelinkovac. |
| smoothie | **MED: the density is below 1.** The USDA portion "cup = 228 g" gives 0.964 g/ml, so 250 ml becomes 240.9 g. A fruit-juice drink with about 10 % sugar is denser than water. All USDA smoothie cup weights are < 1 g/ml (Bolthouse/Odwalla 233 g), so they look like volume-fill weights, not densities. Free sugars "all" (juice-based) is OK. |
| protein-shake | **MED: freeSugars is null ("not determined"), but both parts are known.** The whey powder (USDA 173180) has sugars 0.0, and 2 % milk sugar is lactose, so by WHO free sugars = 0. The mix weights are flagged as our assumption (OK). "shake" → protein shake: a milkshake would be misread (missing). |
| lemonade | OK. Frozen concentrate prepared with water (the drinkable state, matches "ready to drink"), free sugars all, GI 59 soft-drink class flagged. |

### Alias resolution tested (through `parseMeal`)
| typed | resolves to | verdict |
|---|---|---|
| sok, čaša soka | cola 330 ml, 32 mg caffeine, 35 g sugar | **HIGH**: "sok" in Croatian means juice or any soft drink. The tie is broken by database order (cola is listed first), not by meaning. |
| soda, gazirani sok | cola | soda: **MED** (in HR "soda" = soda water). gazirani sok: acceptable. |
| cockta | cola (fuzzy stem "coc…" ≈ "coca") | **MED**: Cockta original is caffeine-free and has no phosphoric acid (Wikipedia "Cockta"; retailer listings), but the app adds 32 mg caffeine. |
| monster, 1 can monster | Red Bull 250 ml, 75 mg | **HIGH** (see energy-drink) |
| boca vina | 500 ml | **HIGH** (750 ml) |
| limenka piva | 330 ml | MED (0.5 l) |
| turska kava | filter coffee 250 ml | MED |
| macchiato | coffee with milk 200 g | LOW |
| kava, crna kava, šalica kave | espresso 30 ml | OK |
| coffee, 1 cup of coffee | filter 250 / 200 ml | OK |
| čaj, tea | black tea 50 mg | open (Q5) |
| mlijeko, milk | whole milk | OK |
| kakao | chocolate milk | OK |
| vodka, whisky, travarica | rakija 40 ml | OK (name LOW) |
| not found: dupli espresso, double espresso, produženi, gin, fanta, sprite, cedevita, jamnica, radler, cider, bezalkoholno pivo, tamno pivo, gemišt, bambus, spritzer, milkshake, liker, pelinkovac, prošek | none | LOW (missing names; better than a wrong match) |

## Proposed changes

| food id | field | current | proposed | source (exact) | confidence |
|---|---|---|---|---|---|
| cola | aliases | includes "sok" | remove "sok" from cola (keep it on orange-juice / apple-juice, so orange juice wins as the first juice) | Croatian usage: "sok" = juice / soft drink. Brief §8 names this exact case. | high |
| red-wine, white-wine | `PORTION_BY_FOOD` bottle (parse.ts) | default 500 ml | `bottle: 750` | Standard EU wine bottle 75 cl (Directive 2007/45/EC nominal quantity for still wine: 750 ml) | high |
| energy-drink | aliases | includes "monster" | remove "monster" from energy-drink, or add a separate "monster" entry: USDA 171935 (Monster, 33 mg caffeine/100 g, 10.93 g sugar) with a 500 ml can | Monster EU 500 ml can: 160 mg caffeine, 32 mg/100 ml label warning (fitadium.com, sainsburys.co.uk, rewe.de listings); USDA SR 171935 | high |
| energy-drink | caffeineMg (app override like `labelFix`) | 29 mg/100 g → 74.8 mg per can | 80 mg per 250 ml can = 31.0 mg/100 g (80 × 100 / 258) | Red Bull label: 80 mg caffeine per 250 ml (32 mg/100 ml); brief §4; carrefouruae.com / winelivery Red Bull 25 cl sheet | high |
| iced-tea | serving.grams | 286.4 g (density 1.145 from "cup = 271 g") | 258.7 g (250 ml × 1.035 g/ml) | USDA SR 175111 LIPTON BRISK lemon and 174847 NESTEA lemon: 1 fl oz = 30.6 g → 30.6/29.5735 = 1.035 g/ml | high |
| almond-milk | serving.grams | 276.9 g (density 1.107 from "cup = 262 g") | 253.6 g (250 ml × 1.014 g/ml) | USDA SR 168751, 174820, 173187 almond milks: 1 cup = 240 g → 1.014 g/ml | high |
| protein-shake | freeSugars | null ("not determined") | 0 (rule "none") | USDA SR 173180 whey powder sugars = 0.0 g/100 g; the rest is 2 % milk lactose (WHO: milk sugars are not free) | med |
| tomato-juice | usda record | 170545 "without salt added" (Na 10 mg/100 g) | 170458 "Tomato juice, canned, with salt added" (Na 253 mg/100 g; all other nutrients identical) | USDA SR 170458 read via usda_sr.py; most shop tomato juices are salted | med |
| (healthBars) wine | ETHANOL_G.wine | 14.2 g (assumes 12 % ABV) | 15.6 g (mean of the database: red 15.8, white 15.4; 13.0–13.4 % ABV), or else document why 12 % is used | USDA SR 173190 / 174837 alcohol 10.6 / 10.3 g/100 g; research/alcohol.md P3 | med |
| beer | `PORTION_BY_FOOD` can | default 330 ml | `can: 500` | Standard Croatian beer can 0.5 l (Ožujsko/Karlovačko cans are sold mainly as 0.5 l; 0.33 l also exists) | med |
| smoothie | serving.grams | 240.9 g (density 0.964) | ≈ 262 g (250 ml × 1.048, the density of the USDA apple juice record 173933: 1 fl oz = 31 g) | USDA SR 173933; a 10 % sugar solution has density > 1 | med |
| cola | aliases | "soda" | remove "soda" from cola (in HR it means soda water; "soda voda" is already on sparkling-water) | Croatian usage | med |

## Open questions
- **Q1 EU vs US milk fat.** "mlijeko 1.5" / "semi-skimmed" map to US 2 % (1.98 g fat, 50 kcal). An EU 1.5 % milk lies between USDA 1 % (170872: 0.97 g fat, 42 kcal) and 2 %. Should we add a 1.5 % entry (interpolated, flagged) or relabel? Kefir has the same issue (US 1 % vs HR 2.8–3.2 %).
- **Q2 Rakija strength.** Homemade rakija is often 45–50 % ABV, against 40 % now. Should the screen show a range or note "commercial 40 %"?
- **Q3 Free sugars in vegetable juice, coconut water and rice drink.** The WHO text names fruit juices only. The UK PHE/SACN guidance, as I remember it but did not re-read here, also counts vegetable juices and smoothies. Tomato-juice "none", coconut-water null and rice-milk null need a decision with a cited source.
- **Q4 Turkish coffee.** It needs its own entry (cup of about 60–90 ml, caffeine to be sourced) or the alias "turska kava" should be removed. I did not find a sourced caffeine value in this pass.
- **Q5 "čaj" → black tea (50 mg caffeine).** In Croatia "čaj" often means fruit or herbal tea. Should herbal win, or should the app ask? This is a usage question, not a data question.
- **Q6 Mineral water sodium.** Perrier (Na about 1 mg/100 g) stands in for "mineralna voda". Croatian waters differ widely; I did not verify a value. Also, should null sugars/caffeine/alcohol be stored as 0 for water?
- **Q7 EU iced tea.** Lipton/Nestea ice teas sold in the EU are reformulated (lower sugar, sweeteners). The USDA US record has 9.49 g sugar/100 g and 9 mg caffeine. I did not verify an EU label in this pass.
- **Q8 Café hot chocolate.** The USDA homemade cocoa (77 kcal/100 g) may underestimate a thick café "topla čokolada" made from a mix. A label is needed.
- **Display note (no change proposed).** The cappuccino, kefir and smoothie `kind: "semi"` routes a single item to the solid-food stomach claims. Decide whether that is intended (foam/thickness) or whether they should count as drinks the way `isDrink()` in meal.ts already treats them.

## Sources read
- USDA FoodData Central SR Legacy 2018-04 CSV (local), records 173647, 173233, 174852, 175099, 169100, 173933, 170545, 170458, 170174, 173210, 171935, 171891, 171890, 173227, 171917, 173232, 171888, 175111, 174847, 171265, 171267, 170872, 171269, 170880, 171277, 172446, 174832, 168751, 174820, 173187, 171942, 170874, 170904, 168746, 173190, 174837, 174815, 168214, 167799, 168213, 173180, 173217.
- Ludwig IA et al. 2014, Food Funct, PMID 25014672 (abstract via epmc.py): 104 espressos, 48–317 mg caffeine per serving.
- EUFIC summary of the EFSA 2015 caffeine opinion: https://eufic.org/en/whats-in-food/article/efsa-opinion-on-the-safety-of-caffeine (filter coffee 200 ml 90 mg; espresso 60 ml 80 mg).
- Red Bull 250 ml, 80 mg caffeine: https://carrefouruae.com/mafuae/en/regular-energy-drinks/red-bull-energy-drink-250ml/p/768 ; https://cdn.winelivery.com/public/products/nutritional-values/red-bull-energy-drink-25-cl-red-bull-gmbh.pdf (11 g sugar/100 ml).
- Monster 500 ml, 160 mg / 32 mg per 100 ml: https://www.fitadium.com/5268-monster-energy-original-500ml.html ; https://www.sainsburys.co.uk/gol-ui/product/monster-energy-drink-lando-norris-zero-sugar-500ml ; https://www.caffeineinformer.com/caffeine-content/monster
- Coca-Cola, 33 mg per 330 ml: https://www.coca-cola.com/xe/en/about-us/faq/how-much-caffeine-is-in-a-cocacola ; Pepsi Max UK 42.6 mg/330 ml: https://www.caffeineinformer.com/caffeine-content/uk-pepsi-max
- Cockta, caffeine-free: https://en.wikipedia.org/wiki/Cockta
- App code: parse.ts, colaSim.ts, healthBars.ts, foodSim.ts, meal.ts, content/espresso.ts, content/cola.ts, stories.ts, products.ts, headlines.ts; research/alcohol.md P2–P3, research/fooddb-notes.md.
