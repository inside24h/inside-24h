# Builder portions research: composite foods (pizza, burger, sandwich, kebab, burek, salad, coffee)

Research date: 2026-10-18. Every number below comes from a source that was actually opened and read, unless it is marked otherwise.

**Legend**
- **Q** = direct quote or verbatim table value from the source.
- **CALC** = my own arithmetic on a quoted value (oz to g uses 1 oz = 28.35 g).
- **SNIPPET** = text seen only in a search-engine result excerpt. The page itself could not be fetched (HTTP 403, DNS failure or JS-only page). These are weaker and are flagged as such.
- **USDA-SR** = USDA SR Legacy `food_portion.csv`, read locally from `C:\claudework\inside-24h\data\raw\usda\sr_legacy\FoodData_Central_sr_legacy_food_csv_2018-04\` (source: https://fdc.nal.usda.gov/download-datasets).
- **USDA-FNDDS** = USDA FNDDS 2021-2023 (FoodData Central "Survey (FNDDS)" CSV, release 2024-10-31, https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_survey_food_csv_2024-10-31.zip). I downloaded it to the scratchpad only, not into the project. It was read from `input_food.csv` (the recipe ingredient grams) and `food_portion.csv`. FNDDS recipes are USDA's own standard compositions of mixed dishes, so they match the app's USDA nutrient records directly.

---

## 1. Pizza

### 1a. Official spec: Pizza Napoletana TSG (Commission Regulation (EU) No 97/2010)
Source: https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32010R0097 (read; the annex text was read up to character 100 000).

| Component | Typical g | Range g | Per | Quote (Q) |
|---|---|---|---|---|
| Dough ball | ~215 (CALC midpoint) | 180–250 | whole pie, Ø ≤ 35 cm | "the dough balls must weigh between 180 and 250 g" |
| Diameter | — | ≤ 35 cm | — | "a round product … with a variable diameter not exceeding 35 cm" |
| Tomato (with mozzarella, i.e. Margherita-type) | 70 (CALC midpoint) | 60–80 | whole pie | "place 60 to 80 g of crushed, peeled tomatoes and/or chopped small fresh tomatoes" |
| Tomato (tomato-only, i.e. Marinara-type) | 85 (CALC) | 70–100 | whole pie | "place 70 to 100 g of crushed, peeled tomatoes in the centre of the disc of dough" |
| Mozzarella | 90 (CALC midpoint) | 80–100 | whole pie | "place 80 to 100 g of sliced 'Mozzarella di Bufala Campana AOP'" |
| Extra-virgin olive oil | 4.5 (CALC) | 4–5 | whole pie | "4 to 5 g of extra virgin olive oil" |
| Dough recipe (whole batch) | — | — | per 1 L water | Q: "a litre of water", "1,8 kg of W 220-380 flour", "between 50 and 55 g of sea salt", "3 g of brewer's yeast" |

Note: the fetch summary said the regulation's recipe section does not use the words "Margherita"/"Marinara". The two tomato variants are the regulation's own two methods (with and without mozzarella). Matching them to Margherita and Marinara is an inference.

### 1b. Pizza-industry portion chart (main source for 12" / 14" toppings)
Source: Burke Corporation, "Pizza Toppings Portion Guide", https://www.burkecorp.com/wp-content/uploads/2019/05/Portion-Guide.pdf. I read the PDF directly. Footnote (Q): "Numbers are generally rounded to the nearest ¼ oz. Guide from Choosing the Right Toppings for Your Pizza, Version 3.0, developed and published by PizzaMarketplace.com in collaboration with Burke Corporation." The same values appear on Upper Lakes Foods, "The Key to Perfect Pizzas" (https://upperlakesfoods.com/the-key-to-perfect-pizzas/, read, Dec 2024), so it is evidently the same chart.

All values are **per whole pie**. The oz values are Q; the g values are CALC (oz × 28.35, rounded). The chart's own "Square Inches" row (Q) gives 113 for 12" and 154 for 14".

| Component | 12" oz (Q) | 12" g (CALC) | 14" oz (Q) | 14" g (CALC) | Notes |
|---|---|---|---|---|---|
| Pizza sauce | 4 | 113 | 5.75 | 163 | |
| Cheese (base) | 6 | 170 | 7 | 198 | 16" = 10.5 oz, 18" = 12 oz |
| Pepperoni | 1.25 (20 slices) | 35 | 1.75 (28 slices) | 50 | about 1.77 g/slice (CALC) |
| Cooked sausage | 4.5 | 128 | 6 | 170 | |
| Raw sausage | 6 | 170 | 8 | 227 | |
| Bacon topping | 2.5 | 71 | 3.5 | 99 | |
| Canadian bacon (sliced cured pork loin, ham-like) | 1.25 | 35 | 1.75 | 50 | |
| Diced ham | 4.5 | 128 | 6 | 170 | |
| Chicken strips | 4.5 | 128 | 6 | 170 | |
| Cooked beef | 4.5 | 128 | 6 | 170 | |
| Peppers | 2.75 | 78 | 4 | 113 | |
| Onions | 2.75 | 78 | 4 | 113 | |
| Canned mushrooms | 3 | 85 | 4.5 | 128 | |
| Fresh sliced mushrooms | 1.75 | 50 | 2.75 | 78 | |
| Sliced olives | 2.75 | 78 | 4 | 113 | |
| Corn | 3 | 85 | 3.5 | 99 | |
| Diced tomatoes | 3.5 | 99 | 4.25 | 120 | |
| Pineapple | 3.5 | 99 | 4 | 113 | |
| Anchovy | 8 pieces | — | 10 pieces | — | |

**Not in the chart:** salami (use pepperoni as the closest analogue, an assumption), tuna, egg, extra cheese. See 1d.

### 1c. Pepperoni slice weight (cross-checks)
| Item | Value | Source | Quote |
|---|---|---|---|
| Hormel foodservice pepperoni | 14 slices/oz, so about 2.0 g/slice (CALC) | https://www.hormelfoodservice.com/products/hormelr-pepperoni-fresh-14-slicesoz-212-5-lb/ | Q: "14-slice-per-ounce target"; "1.75″ (44mm) diameter"; "Portion according to your operation's build standards." (no per-pizza amount given) |
| USDA "Pepperoni, beef and pork, sliced" (FDC 174575) | 1 piece = 2 g | USDA-SR | Q (table row): "1 piece = 2 g" |
| USDA FNDDS "Pizza with pepperoni, from frozen, thin crust" (2708635) | 50 g pepperoni on 1025 g cheese pizza (4.6 %, CALC) | USDA-FNDDS input_food | Q (row): "1025 Pizza, cheese topping, thin crust, frozen, cooked; 50 Pepperoni, beef and pork, sliced" |
| USDA FNDDS "Pizza with meat other than pepperoni, from frozen, thin crust" (2708646) | 75 g Italian sausage on 1025 g cheese pizza (6.8 %, CALC) | USDA-FNDDS | Q (row): "75 Sausage, Italian, pork, mild, cooked, pan-fried" |

### 1d. Cheese range, extra cheese, dough (weaker sources)
| Component | Typical | Range | Per | Source | Status |
|---|---|---|---|---|---|
| Cheese, 12" pie | 6 oz (170 g) | 3–10 oz (85–283 g) | 12" pie | PMQ Think Tank forum, https://thinktank.pmq.com/t/amount-of-cheese-on-pizza/10586 | SNIPPET (DNS failure): "the amount for a 12-inch pizza can vary from as little as 3-ounces to as much as 10-ounces, with about 6-ounces as the 'norm'" |
| Cheese, 12/14/16" (one operator) | 5 / 7 / 9 oz | — | pie | PMQ Think Tank, https://thinktank.pmq.com/t/cheese-portions/12868 | SNIPPET: "we use 5 oz, 7 oz & 9 oz for 12", 14" & 16" pizzas" |
| Extra cheese | about 50 % of the base cheese | 14" = 4 oz | pie | PMQ Think Tank, https://thinktank.pmq.com/t/how-much-extra-cheese/15619 | SNIPPET: "14" = 4 oz for extra cheese"; "big chains tend to go at 1/2 of what originally comes on the pizza" |
| Dough, 12" | 11 oz (312 g, CALC) | — | pie | Pizza Today, Dough Doctor (Tom Lehmann), https://pizzatoday.com/news/calculating-any-size-of-pizza-three-14-is-the-magic-number/131788/ | SNIPPET (403): 11 oz / 113.04 sq in = "0.0973106" oz per sq in |
| Dough, 14" | 15 oz (425 g, CALC) | — | pie | same | SNIPPET: "15 ounces of dough needed to make the 14-inch pizza crust"; 16" = 19.5 oz |
| Dough, other operators | — | 12" 12–14 oz; 14" 18–20 oz | pie | PMQ / pizzamaking.com forum posts | SNIPPET only, anecdotal |

### 1e. Whole-pie and slice weights (USDA) and slice count
| Item | Value | Source | Quote (Q) |
|---|---|---|---|
| Slices per 12" and 14" pie | **8** | Pizza Hut US nutrition PDF (Jan 2010), https://www.tlcsurgery.com/wp-content/uploads/2016/01/Pizza-Hut.pdf (read) | "12" Medium Pan Pizza 1 slice (1 slice = 1/8 pizza)"; "14" Large Hand-Tossed Style Pizza 1 slice (1 slice = 1/8 pizza)" |
| Pizza Hut slice weights | 12" thin cheese 70 g; 12" hand-tossed cheese 86 g; 12" pan cheese 91 g; 14" thin cheese 95 g; 14" hand-tossed cheese 126 g; 14" pan cheese 128 g | same PDF | Q (Serving Grams column) |
| USDA 14" chain pizza, cheese, regular crust (FDC 173292) | slice 107 g; whole pie 853 g (853/107 ≈ 8 slices, CALC) | USDA-SR | Q: "1 slice = 107 g; 1 pizza = 853 g" |
| USDA 14" chain pizza, pepperoni, regular crust (173295) | slice 111 g; pie 895 g | USDA-SR | Q |
| USDA 14" chain pizza, cheese, thin crust (173294) | slice 76 g; pie 590 g | USDA-SR | Q |
| USDA 14" chain pizza, sausage, regular crust (170367) | slice 116 g; pie 932 g | USDA-SR | Q |
| FNDDS cheese pizza, restaurant, medium crust (2708616) | medium 11–12" pie 691 g; large 13–15" pie 954 g; large piece 119 g | USDA-FNDDS | Q: "1 medium pizza (11-12" diameter)=691.0g", "1 large pizza (13-15" diameter)=954.0g" |
| FNDDS pepperoni pizza, restaurant, medium crust (2708640) | medium 11–12" 707 g; large 13–15" 996 g; large piece 124 g | USDA-FNDDS | Q |

### 1f. Single-item unit weights useful for pizza toppings (USDA-SR, Q table rows)
- Mushrooms, white, raw (169251): "1 slice = 6 g", "1 cup, pieces or slices = 70 g"
- Peppers, sweet, green, raw (170427): "1 ring (3" dia, 1/4" thick) = 10 g", "10 strips = 27 g"
- Onions, raw (170000): "1 slice, medium (1/8" thick) = 14 g", "1 slice, thin = 9 g"
- Olives, ripe, canned (169094): "1 large = 4.4 g", "1 tbsp = 8.4 g"
- Corn, sweet, canned, drained (169214): "1 cup = 164 g"
- Tuna, light, canned in water, drained (173709): "1 can = 165 g", "3 oz = 85 g". **No pizza-portion source was found for tuna.**
- Egg, whole, raw (171287): "1 large = 50 g", "1 medium = 44 g". **No pizza-portion source was found for egg** (one egg per pie would be an assumption).
- Pizza sauce, canned (172880): "0.25 cup = 63 g"

---

## 2. Burger

### 2a. Patties
| Component | Typical g | Range g | Per | Source | Quote / status |
|---|---|---|---|---|---|
| McDonald's Quarter Pounder patty, raw | 113.4 | 113.4–120.5 | 1 patty, before cooking | McDonald's USA Ingredients Listing (generated by McDonalds.com, effective 06-14-2012), https://www.motherjones.com/wp-content/uploads/mcd_ingred.pdf (read) | Q: "*Based on the weight before cooking 4 oz. (113.4g)"; also "++ Based on the weight before cooking 8 oz. (226.8g)" (Double QP) |
| Quarter Pounder after the 2015 increase, raw | 120.5 | — | 1 patty | Wikipedia "Quarter Pounder", https://en.wikipedia.org/wiki/Quarter_Pounder (pointer; it cites McDonalds.com and CNBC 2015) | Q: "a beef patty weighing 120.5 g (4.25 oz) before cooking". The CNBC primary page returned 403. |
| Quarter Pounder, cooked | 85 | — | 1 patty | Wikipedia (same page) | Q: "3 oz (85 g) prepared". This line has no citation, so it is weak. |
| McDonald's regular (10:1) patty, raw | 45 (1.6 oz) | — | 1 patty | blogs / Reddit only | SNIPPET only: "1.6-ounce '10-to-1' patty (ten patties from one pound of beef)". **Not verified on an official McDonald's source.** |
| FNDDS fast-food burger patty, **cooked** (USDA standard) | small 40; medium 85; large 115 | 20 (slider)–115 | 1 patty, cooked | USDA-FNDDS e.g. 2706921, 2706929, 2706930, 2706919 | Q rows: "40.0 g Beef, ground, patties, frozen, cooked, broiled" (from fast food, 1 small patty); "85.0 g" (1 medium patty); "115.0 g" (1 large patty); "20.0 g" (slider) |
| FNDDS home burger, small patty, cooked | 65 | — | 1 patty | USDA-FNDDS 2706927 | Q: "65.0 g Beef, ground, patties … cooked, broiled" |
| Raw vs cooked beef, USDA reference | 113 g raw ↔ 85 g cooked serving | — | — | USDA-SR 174036 / 171797 | Q: "Beef, ground, 80% lean … raw: 4 oz = 113 g"; "… patty, cooked, broiled: 3 oz = 85 g". The pairing 113 raw → 85 cooked (75 % yield) is CALC, consistent with the Wikipedia QP line. |

### 2b. Bun, cheese, bacon, vegetables, sauces
| Component | Typical g | Range g | Per | Source | Quote (Q) |
|---|---|---|---|---|---|
| Hamburger bun | 52 (small burger) / 60 (medium/large) | 28 (slider)–60 | 1 bun | USDA-FNDDS (2706921, 2706929, 2706919) | "52.0 g Rolls, hamburger or hotdog, plain"; "60.0 g …"; slider "28.0 g" |
| Hamburger bun (SR) | 44 | — | 1 roll | USDA-SR 172796 | "1 roll 1 serving = 44 g" |
| Cheese slice | 21 | 10 (slider)–32 (large) | 1 slice | USDA-FNDDS (2706889, 2706909); USDA-SR 171290 | FNDDS "21.0 g Cheese as ingredient in sandwiches"; large patty "32.0 g"; SR "1 slice (3/4 oz) = 21 g; 1 slice (1 oz) = 28 g" |
| Bacon on a sandwich | 16 (regular) | 16–24 | sandwich | USDA-FNDDS 2710256 | "Guideline amount on regular sandwich=16.0g; … large sandwich=24.0g" |
| Bacon slice, cooked | 11.5 | — | 1 slice | USDA-SR 168322 | "1 slice = 11.5 g" (raw slice 28 g, SR 168277) |
| Lettuce | 8 | 8–16 | sandwich | USDA-FNDDS 2710250; Whopper Jr recipe 2706923 | "Guideline amount on regular sandwich=8.0g; … large sandwich=16.0g"; Whopper Jr "8.0 g Lettuce, iceberg, raw" |
| Tomato | 20 | 20–40 | sandwich | USDA-FNDDS 2710255; Whopper Jr | "Guideline amount on regular sandwich=20.0g; … large=40.0g"; SR 170457 "1 slice, medium (1/4" thick) = 20 g" |
| Onion | 15 | 15–30 | sandwich | USDA-FNDDS 2710252 | "Guideline amount on regular sandwich=15.0g; … large sandwich=30.0g" |
| Pickles | 5–7 | 5–7 | burger | USDA-FNDDS 2706922 (BK hamburger), 2706923 (Whopper Jr); SR 168558 | "5.0 g Pickles, cucumber, dill"; "7.0 g …"; SR "1 slice = 7 g" |
| Ketchup | 5 (fast-food burger) / 17 (regular sandwich guideline) | 5–34 | burger | USDA-FNDDS 2706922; 2709733 | "5.0 g Catsup"; "Guideline amount on regular sandwich=17.0g; … large sandwich=34.0g"; "1 packet=10.0g" |
| Mustard | 5 | 5–10 | burger | USDA-FNDDS 2706922; 2710085 | "5.0 g Mustard, prepared, yellow"; "Guideline amount on regular sandwich=5.0g; … large=10.0g" |
| Mayonnaise | 14 | 9–28 | sandwich | USDA-FNDDS 2710204 | "Guideline amount on regular sandwich=14.0g; … large sandwich=28.0g; 1 packet=12.0g; 1 tablespoon=13.8g" |
| Burger sauce (Whopper Jr) | 10 | — | burger | USDA-FNDDS 2706923 | "10.0 g Sauce as ingredient in hamburgers" |

Whole-sandwich reference weights (USDA-SR, Q): McDonald's Hamburger 95 g; Cheeseburger 119 g; Quarter Pounder 171 g; QP with Cheese 199 g; Big Mac 219 g. FNDDS (Q): Whopper Jr 135 g; Whopper 270 g; Big Mac 205 g; QP 170 g.

### 2c. Pljeskavica (Balkan) and accompaniments
| Component | Typical g | Range g | Per | Source | Quote / status |
|---|---|---|---|---|---|
| Pljeskavica (menu weights; whether raw or cooked is not stated) | 150 / 200 | 100–350 | 1 patty | Glovo, Kod Čika Gurmana (Kragujevac), https://glovoapp.com/sr/rs/kragujevac/stores/kod-cika-gurmana-krg (read) | Q: "Mala pljeskavica 120g", "Srednja pljeskavica 150g", "Velika pljeskavica 200g", "Leskovačka pljeskavica 250g", "Leskovačka specijalka 350g" |
| Pljeskavica | — | 100 / 200 | 1 patty | Glovo, Sarajevo sub (Subotica), https://glovoapp.com/es/rs/subotica/stores/sarajevo-sub (read) | Q: "Pljeskavica mala … 100g", "Pljeskavica velika … 200g" |
| Pljeskavica (other menus) | — | 150–300 | 1 patty | Wolt: Leskovačka kuća (Borča), Klopica (Užice) | SNIPPET (JS page): 150 / 200 / 250 / 300 g |
| Lepinja | 150 | — | 1 piece | Glovo, Sarajevo sub (read) | Q: "Lepinja 91,00 RSD 150g" |
| Lepinja (home recipe) | about 250 raw dough per bread (CALC: 757 g dough / 3) | — | 1 bread, 20 cm | foodperestroika.com blog, https://foodperestroika.com/2016/08/09/bosnian-cevapi-with-kajmak-ajvar-and-lepinja/ | Q: "400 g bread flour", "300 g water", "Yields 6 servings (3 flatbreads)". Raw dough, not baked weight. Blog source. |
| Kajmak | 50–60 | 35–60 | per sandwich / side | Glovo Sarajevo sub (read); Wolt Sofronije 23 (Čačak) | Q: "Kajmak kugla 195,00 RSD 60g". SNIPPET: "6 ćevapa u lepinji + 50g kajmaka". The blog recipe gives 210 g for 6 servings, so 35 g per serving (CALC). |
| Ćevapi portion (cross-reference) | 100 (5 pcs) / 200 (10 pcs) | — | portion | Glovo Sarajevo sub (read) | Q: "Ćevapi mala porcija … 5 komada, 100g"; "velika porcija … 10 komada, 200g" |
| Onion with pljeskavica | **not found** in a Balkan source | — | — | — | Proxy only: USDA FNDDS onions on a sandwich, 15 g (regular) / 30 g (large) |

---

## 3. Sandwich / toast

| Component | Typical g | Range g | Per | Source | Quote (Q) |
|---|---|---|---|---|---|
| White bread, 2 slices | 60 | 50–60 | sandwich | USDA-FNDDS 2706964 (Ham sandwich on white) | "60.0 g Bread, white, commercially prepared" |
| White bread slice | 25–29 | 15 (very thin)–30 (large) | slice | USDA-SR 174924 | "1 slice = 29 g"; "1 slice = 25 g"; "1 slice, thin = 20 g"; "1 slice, large = 30 g"; "1 slice, very thin = 15 g" |
| Ham, home sandwich | 56 | 56–70 | sandwich | USDA-FNDDS 2706964 / 2706968 | "56.0 g Ham, sliced, pre-packaged, deli meat"; restaurant "70.0 g" |
| Ham slice | 28 | — | slice | USDA-SR 173864 | "1 slice = 28 g" |
| Cheese, ham & cheese sandwich | 21 | 21–28 | sandwich | USDA-FNDDS 2706965 / 2706969 | "21.0 g Cheese as ingredient in sandwiches"; restaurant "28.0 g" |
| Cheese, cheese-only sandwich | 42 | — | sandwich | USDA-FNDDS 2705795 | "42.0 g Cheese, American" |
| Butter/fat, grilled cheese | 14 | — | sandwich | USDA-FNDDS 2705802 | "14.0 g Table fat, NFS" (with 60 g bread and 42 g cheese, total 116 g) |
| Butter spread | 7 per slice; 14 per regular sandwich | 5–28 | slice / sandwich | USDA-FNDDS 2710154 | "Guideline amount per slice of bread/roll=7.0g"; "Guideline amount on regular sandwich=14.0g; … large sandwich=28.0g"; "1 pat=7.0g" |
| Mayonnaise spread | 14 | 9–28 | sandwich | USDA-FNDDS 2710204 | "Guideline amount on regular sandwich=14.0g" |
| Gouda slice (Croatian brands) | **not found** | — | — | Vindija / Zdenka 150 g packs seen in a SNIPPET (Wolt Market Split); no slice count | Proxy: USDA sandwich cheese 21 g |
| Toastie (ham & cheese, commercial EU product) | 110 g total: cheese 17 % (18.7 g, CALC), ham 13 % (14.3 g, CALC), rest bread | — | 1 tosti | PS in foodservice, "Tasty Tosti superior kaas ham", https://psinfoodservice.com/en/product/18227-tosti-superieur-kaas-ham-30x1-stuk (read) | "Per portion (110 g)"; "17% CHEESE"; "13% ham" |
| Ham & cheese sandwich (Czech retail) | 213 g: bread 52 % (110.8 g), ham 25 % (53.3 g), spread 14 % (29.8 g), Edam 9 % (19.2 g), all CALC | — | 1 sandwich | Rohlik "Simply Fresh sendvič šunka a sýr", https://www.rohlik.cz/1343399-simply-fresh-sendvic-sunka-a-syr (read) | "213 g"; "Toustový chléb světlý 26 %", "Toustový chléb tmavý 26 %", "Šunka 25 %", "Pomazánka 14 %", "Sýr eidam 9 %" |
| Croatian café "tost" | **not found** (no Croatian source with grams) | — | — | — | Closest: the commercial tosti above (about 19 g cheese, 14 g ham) and the USDA ham-and-cheese recipe (56 g ham, 21 g cheese) |

---

## 4. Kebab / döner

| Component | Typical g | Range g | Per | Source | Quote / status |
|---|---|---|---|---|---|
| Döner composition (legal definition, DE) | — | minced meat **≤ 60 %** of the spit; poultry: no minced meat, skin ≤ 18 % | spit | Stadt Kassel Lebensmittelüberwachung leaflet (08/2023), quoting the Leitsätze für Fleisch und Fleischerzeugnisse (version of 14.04.2022, amended 13.09.2022), https://www.kassel.de/service/media/Dateien_und_Verzeichnisse/14-Doener-Kebab.pdf (read) | Q: "ein mitverarbeiteter Hackfleischanteil … beträgt höchstens 60 %. Außer Salz und Gewürzen sowie gegebenenfalls Eiern, Zwiebeln, Öl, Milch und Joghurt enthält Döner Kebab keine weiteren Zutaten." "Bei Hähnchen-/Puten-Döner Kebab … wird kein zerkleinertes Fleisch eingesetzt; der maximale Hautanteil beträgt 18 %." **The Leitsätze set no portion weight.** |
| Meat per döner (weighed, consumer TV test) | ~170 | 80–173 | sandwich | Mallorca Revue reporting an RTL test, https://www.mallorca-revue.eu/doener-rtl-test-enthuellt-preis-leistungs-sieger (read) | Q table: "Lamm-Döner … 167 g", "Mittelklasse-Döner … 173 g", "Billig-Döner … 80 g". Secondary report; RTL programme and date not named. |
| Meat per döner (consumer agency estimate) | — | 100–150 | sandwich | Verbraucherzentrale Hamburg (2015), via secondary sites | SNIPPET only: "rund 100 bis 150 Gramm Fleisch". Not verified on the VZ page. |
| USDA Gyro sandwich (whole) | 200 | — | sandwich | USDA-FNDDS 2706962 | Q: "1 sandwich, any size=200.0g" |
| Gyro: pita | 60 (CALC: 30 % × 200) | — | sandwich | USDA-FNDDS 2706962 | Q recipe (per 100 g): "30.0 g Bread, pita, white, enriched" |
| Gyro: meat (lamb + beef) | 60 (CALC) | — | sandwich | same | Q: "15.0 g Lamb, ground"; "15.0 g Beef, ground" (per 100 g) |
| Gyro: tzatziki/yogurt sauce | 30 (CALC) | — | sandwich | same | Q: "15.0 g Tzatziki dip" (per 100 g) |
| Gyro: tomato | 30 (CALC) | — | sandwich | same | Q: "15.0 g Tomatoes, for use on a sandwich" |
| Gyro: onion | 20 (CALC) | — | sandwich | same | Q: "10.0 g Onions, for use on a sandwich" |
| Pita bread | 60 (large, 6.5") | 28 (small 4")–60 | 1 pita | USDA-SR 174915 | Q: "1 pita, large (6-1/2" dia) = 60 g; 1 pita, small (4" dia) = 28 g" |
| Flour tortilla / dürüm wrap | 72 (10") | 49 (7–8")–117 (12") | 1 wrap | USDA-SR 175037 | Q: "1 tortilla (approx 10" dia) = 72 g; 1 tortilla (approx 12" dia) = 117 g; 1 tortilla (approx 7-8" dia) = 49 g" |
| Tzatziki container | 60–70 | — | serving | USDA-FNDDS 2705448 | Q: "Quantity not specified=60.0g; 1 individual container=70.0g" |
| Döner bread (Fladenbrot) weight, salad and sauce grams | **not found in a reliable source** | — | — | personenwaage-online.de claims an 850 g döner with 400–500 g meat and 200 g bread. **Rejected:** the page itself says the figures are "nicht 100% verlässlich" and are estimates. | — |

Note: a typical German döner is visibly larger than the USDA gyro. The RTL meat weights (~170 g) are about 3 × the USDA gyro meat (60 g). Treat the USDA gyro as a "small/standard pita" and the RTL value as a "German döner" meat amount.

---

## 5. Burek

| Component | Typical | Range | Per | Source | Quote / status |
|---|---|---|---|---|---|
| Legal minimum filling (Croatia) | ≥ 20 % filling, **calculated on flour weight**; ≥ 10 % fat | — | product | Pravilnik o žitaricama, mlinskim i pekarskim proizvodima, tjestenini, tijestu i proizvodima od tijesta (NN 78/05, 135/09, 86/10, 72/11), Članak 46. FAOLEX copy https://faolex.fao.org/docs/pdf/cro108507.pdf (read) and zakon.hr consolidated text https://www.zakon.hr/cms.htm?id=27517 (read) | Q: "Burek je pekarski proizvod od brašna, masti i vode ili druge dopuštene tekućine s dodatkom najmanje 20% mljevenog mesa, sira, voća ili povrća računato na ukupnu količinu brašna. Burek mora sadržavati najmanje 10% masti računato na gotov proizvod s 45% vode." Whether this pravilnik is still the version in force was not checked further. |
| Legal minimum filling (Serbia) | ≥ 20 % filling of the **finished product mass** | — | product | Pravilnik o kvalitetu žita, mlinskih i pekarskih proizvoda i testenina (Sl. glasnik RS 68/2016, 56/2018), https://www.paragraf.rs/propisi_download/pravilnik_o_kvalitetu_zita_mlinskih_i_pekarskih_proizvoda_i_testenina.pdf (read) | Q: "Burek je pekarski proizvod dobijen od razvučenog testa i masnoće, sa ili bez dodataka. Ukoliko se proizvodi sa dodacima, treba da sadrži najmanje 20% slatkog ili slanog nadeva, računato na masu gotovog proizvoda." |
| Cheese burek, industrial label (HR) | cheese 34 % | — | product | Vindija Latica "Burek sa svježim sirom 940 g", Konzum, https://www.konzum.hr/web/products/latica-burek-sa-svjezim-sirom-800-g (read) | Q: "svježi polumasni SIR 34%, PŠENIČNO brašno bijelo tip 400, voda, biljna ulja …"; net "940 g"; 250 kcal / 100 g |
| Cheese burek, retail label (Lidl HR) | filling 44.4 %; the filling's cheese is 73 % fresh cheese | — | product | Lidl HR "Burek sa sirom", https://www.lidl.hr/p/burek-sa-sirom/p6905439 | SNIPPET only (page 404 when fetched) |
| Meat burek, industrial label (BiH) | beef 38.6 % | — | product | N1 report on "burek mini zaleđeno", Krajina Klas Banja Luka, https://n1info.rs/region/inspekcija-utvrdila-u-pekari-u-bih-prodavali-juneci-burek-sa-tragovima-svinjetine/ (read) | Q: "voda, pšenično brašno T-550, juneće meso (38,60%), suncokretovo ulje, sojine ljuspice, so, …" |
| Cheese burek, home recipe (HR) | 650 g phyllo + 500 g cheese + 100 ml oil + 500 ml mineral water, 4 portions. Cheese is about 40 % of the non-water ingredients (CALC: 500 / (650 + 500 + 92)) | — | whole pan | index.hr recepti, https://recepti.index.hr/recept/1328-burek-sa-sirom (read) | Q: "650 g gotovih kora za pite", "500 g svježeg kravljeg punomasnog sira", "100 ml suncokretovog ulja", "500 ml mineralne vode", "Broj porcija: 4" |
| Bakery piece weight (Split, HR) | 250 g (large) | 100–250 | piece | Wolt: Mlinar (Bosanska, Split), Pekara Panis (Split) | SNIPPET only (JS pages): "burek sa sirom 250 g", "burek s mesom 250 g", "Burek motani sa sirom 150g", plus 100 g options |
| Spinach/feta phyllo pie (USDA, closest analogue; not burek) | phyllo 12.4 %, spinach 37.3 %, ricotta 13.5 % + feta 12.4 %, eggs 11 %, butter 6.1 %, olive oil 3.1 % | piece 30–120 g | recipe | USDA-FNDDS 2708729 "Spanakopita" | Q rows: "226.8 g Phyllo dough", "680.4 g Spinach, mature", "246.0 g Cheese, ricotta", "226.8 g Cheese, feta", "200.0 g Eggs", "112.0 g Butter", "56.0 g Olive oil"; portions "1 regular/large=120.0g; 1 small/individual=30.0g". Percentages are CALC. |
| Potato burek and spinach burek, Balkan labels | **not found** | — | — | — | — |

---

## 6. Salad dressing

| Component | Typical g | Range g | Per | Source | Quote (Q) |
|---|---|---|---|---|---|
| Salad dressing, reference serving | 30 | — | serving (US label RACC) | 21 CFR 101.12, Table 2, https://www.law.cornell.edu/cfr/text/21/101.12 (read) | "Dressings for salads … 30 g" |
| Oil, reference serving | 1 tbsp | — | serving | same | "Butter, margarine, oil, shortening … 1 tbsp" |
| Vinegar, reference serving | 1 tbsp | — | serving | same | "Major condiments, e.g., catsup, steak sauce, soy sauce, vinegar … 1 tbsp" |
| Dressing, amount when unspecified (Italian, made with vinegar and oil) | 29 | 28–32 | serving | USDA-FNDDS 2710203 (and Caesar, French, Ranch rows) | "Quantity not specified=29.0g; 1 tablespoon=14.7g; 1 packet=44.0g" |
| Mayonnaise in a salad | 28 | — | salad | USDA-FNDDS 2710204 | "Guideline amount in salad=28.0g" |
| Olive oil, 1 tbsp / 1 tsp | 13.5–14 / 4.5 | — | spoon | USDA-SR 171413; FNDDS 2710186 | SR "1 tablespoon = 13.5 g; 1 tsp = 4.5 g"; FNDDS "1 tablespoon=14.0g" |
| Vinegar, 1 tbsp / 1 tsp | 14.9–15 / 5 | — | spoon | USDA-SR 173469 / 172237; FNDDS 2709351 | SR "1 tbsp = 14.9 g; 1 tsp = 5 g"; FNDDS "Vinegar … Quantity not specified=30.0g; 1 tablespoon=15.0g" |
| Side salad (no dressing) | 94 | 73–168 | salad | USDA-FNDDS 2709822 | "1 side salad=94.0g"; "1 McDonald's side salad=87.0g"; "1 Wendy's side salad=168.0g" |
| Oil vs vinegar split per side salad | **not found** in an authoritative source (dietary guidance or a recipe database) | — | — | — | Only the total-dressing figures above (≈ 30 g ≈ 2 tbsp) are sourced. |

---

## 7. Coffee add-ins

| Component | Typical g | Range g | Per | Source | Quote / status |
|---|---|---|---|---|---|
| Sugar sachet (EU foodservice, 5 g) | 5 | — | sachet | PS in foodservice, "Tiense Zucker Sachet 1000x5g", https://psinfoodservice.com/de/product/1835323-tiense-zucker-sachet-1000x5g-e (read) | Q: "Der Tiense Zucker Sachet enthält 5 Gramm Zucker in einer Portionsverpackung." |
| Sugar stick (Nespresso Croatia) | 3 | — | stick | https://www.nespresso.hr/en/8-vrecke-belega-sladkorja (read) | Q: "1 pack of 100 sticks of white sugar (3 g each)" |
| Sugar sachet (Serbia horeca, Hausbrandt) | 4 | — | sachet | eponuda.com listing | SNIPPET only (403): "Beli Šećer (4g - 500/1)" |
| Sugar sachet sizes made by an Italian producer | — | 3–6 | sachet | Personal Zucchero (Host Milano exhibitor page) | SNIPPET only (DNS failure): sizes "3, 4, 5 and 6 g" |
| Sugar packet (USDA) | 2.8 (SR) / 3.5 (FNDDS) | 2.8–3.5 | packet | USDA-SR 169655; FNDDS 2710258 | SR "1 serving packet = 2.8 g; 1 tsp = 4.2 g; 1 cube = 2.3 g"; FNDDS "1 individual packet=3.5g"; "Guideline amount per fl oz of beverage=1.4g" |
| Croatian café sugar sachet | **not confirmed** for a specific Croatian brand | 3–5 (EU range above) | — | — | — |
| Honey, 1 teaspoon | 7 (CALC: 21 g tbsp / 3) | 7 | tsp | USDA-SR 169640; FNDDS 2710281 | SR "1 tbsp = 21 g; 1 packet (0.5 oz) = 14 g"; FNDDS "1 tablespoon=20.0g; Quantity not specified=7.0g; 1 single serving container=14.0g" |
| Milk splash in coffee | 2.5 g per fl oz of coffee, so about 20 g in an 8 fl oz (240 g) cup (CALC) | — | per fl oz of beverage | USDA-FNDDS 2705385 / 2705386 | Q: "Guideline amount per fl oz of beverage=2.5g" (whole and 2 % milk) |
| Cream / creamer in coffee | 15 (individual container) | 15–20 | serving | USDA-FNDDS 2705594, 2705600; SR 171255; 21 CFR 101.12 | FNDDS "1 individual container (.5 fl oz)=15.0g"; "Quantity not specified=20.0g"; RACC "Cream or cream substitutes, fluid … 15 mL"; "Cream, half & half … 30 mL" |
| Sugar reference serving (US label) | 8 | — | serving | 21 CFR 101.12 | Q: "Sugar … 8 g" |

---

## What was NOT found (stated plainly)
- An official, fetchable Grande, Leprino or Hormel per-pizza portion sheet. Grande's guide is mentioned only in forum snippets. Hormel's page says "Portion according to your operation's build standards."
- Pizza toppings: tuna, egg, salami and extra cheese have no chart value (extra cheese has forum snippets only).
- Pizza dough weights for 12"/14" in a page I could read directly. Pizza Today returned 403; the values are from search snippets only.
- McDonald's 1.6 oz regular patty on an official source.
- Pljeskavica: whether menu grams are raw or cooked; onion amount; a lepinja/somun weight beyond one menu (150 g).
- Croatian "tost" with gram amounts; Croatian gouda slice weight.
- Döner Fladenbrot weight, salad and sauce grams from a reliable weighed test; the original Verbraucherzentrale or RTL primary pages.
- Spinach and potato burek labels; a Croatian bakery piece weight on a readable page.
- An authoritative oil-vs-vinegar split for a side salad.
- A specific Croatian café sugar-sachet brand weight.
- Unreadable pages: thinktank.pmq.com (DNS), pizzatoday.com (403), nxtbook Pizza Today (403), cnbc.com (403), McDonald's Arabia nutrition PDF (403), eponuda.com (403), tesco.com (403), lidl.hr product (404), the ah.nl recipe (403), Wolt pages (JS only), the Sysco pizza catalog PDF (image, not parsed).
