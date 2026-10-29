# Chooser gaps (2026-10-29)

Generic words now open a "Which …?" chooser of foods the database already has. Nothing new was added to the
database. This list is the common kinds people will expect that the database does **not** have yet. The owner decides
which ones to add (via fooddb_spec.py, as `add()` / `var()`, then they join the chooser).

## New choosers in this round
| Word(s) | Row | Options (existing foods) | Starts on |
|---|---|---|---|
| pecivo, peciva, pastry, pastries | Which roll or pastry? | Roll, Croissant, Doughnut | pecivo → Roll, pastry → Croissant |
| meso, mesa, meat | Which meat? | Chicken, Beef, Pork, Lamb | meso → Pork, meat → Chicken |
| salata, salad | Which salad? | Green, Cabbage, Sauerkraut | Green |
| grickalice, snack(s) | Which snack? | Chips, Popcorn, Crackers, Rice cakes | Chips |

Already covered before this round (checked): čaj/tea, kava/coffee, sok/juice, mlijeko/milk, sir/cheese, kruh/bread,
vino/wine, kobasica, juha/soup, grah, čokolada, kakao, riba/fish, žitarice, sušeno voće, jaja, narezak, tjestenina,
krumpir, riža, jogurt, orašasti plodovi. Pivo/beer, kolač/cake, sladoled, rakija show their own variant row.

## Missing variants, by chooser
**Roll / pastry (pecivo)**
- pecivo s makom / sezamom / sjemenkama (poppy, sesame, seeded roll)
- integralno / raženo pecivo (wholemeal, rye roll)
- slano pecivo: perec (pretzel), slanac, štapići
- slatko pecivo: kroasan s čokoladom / marmeladom, buhtla, savijača s jabukom (already a cake variant), kroafna
- pužić s grožđicama (cinnamon/raisin roll), muffin
- kifla is the plain roll now; sweet kifla (kiflice s pekmezom) is missing
- Burek kept its own "Which burek?" row (fillings); the owner may want it in this row too (it can be in only one row
  per food: then its fillings would move to the second row, as espresso's Decaf does)
- pita (zeljanica, krumpiruša, pita od jabuka), pizza slice from a bakery

**Bread (kruh)**: kukuruzni kruh (corn bread), tost (sandwich bread slice), pita/lepinja (flatbread), tortilla, bezglutenski kruh

**Meat (meso)**: chicken thigh / wings, chicken schnitzel (pohani odrezak), turkey breast (puretina), minced meat /
bolognese, pork schnitzel, veal (teletina), meatballs (ćufte), sarma, gulaš, roast chicken with skin, pljeskavica (only a
hamburger option now), ćevapi is in the database but not in this row (it is a dish, not a meat; owner decide)
- "pizza s mesom" now gives pizza + "Which meat?" (as "pizza s piletinom" already gives pizza + chicken); owner decide
  whether "s mesom" should be a pizza topping instead

**Salad (salata)**: tomato salad (salata od rajčice), cucumber salad, mixed salad, potato salad (krumpir salata),
coleslaw, Caesar salad, Greek/Shopska salad, rocket (rikola), beetroot (cikla), tuna salad

**Snacks (grickalice)**: pretzel sticks (štapići), salted peanuts (peanuts are in "Which nuts?"), tortilla chips,
flips (Smoki), protein / cereal bar, crackers with cheese

**Fish (riba)**: hake as its own food (oslić is now under cod), mackerel (skuša), sea bass / bream (brancin, orada),
fried calamari (lignje), fish sticks, shrimp, canned mackerel

**Cheese (sir)**: Emmental, Trappist as its own, cream cheese (namazni sir), Paški sir, Camembert/Brie, processed slices

**Yogurt (jogurt)**: drinkable yogurt (tekući jogurt, very common in HR), skyr, plant yogurt

**Milk (mlijeko)**: lactose-free milk, oat milk (zobeno mlijeko; plant-milk row has soy, almond, rice only)

**Juice (sok)**: multivitamin, grapefruit, cranberry, carrot, juice drinks / nectar (sokovi s 30–50 % voća, the most
sold kind in HR shops), cedevita (instant vitamin drink)

**Tea (čaj)**: mint and chamomile are inside "Herbal"; fruit tea with sugar, tea with honey is an add-in already

**Coffee (kava)**: iced coffee (ledena kava), flat white, americano, coffee with whipped cream (bečka kava)

**Wine (vino)**: sparkling (pjenušac / prosecco), gemišt is "Spritzer"; mulled wine (kuhano vino)

**Beer (pivo)**: dark beer / stout (tamno pivo), wheat beer (pšenično), craft IPA

**Cake / cookie (kolač, keks)**: "keks" has only butter cookies; missing chocolate-chip cookies, Plazma-type tea
biscuits, wafers (napolitanke), digestive; cakes: Sacher, Rapska, Bajadera, muffin, brownie, palačinke (Croatian thin
crêpes; the database has US-style pancakes only)

## Words still without a chooser (owner decide)
- voće / fruit, povrće / vegetables: very broad; a row on every apple ("Which fruit?") may be more noise than help
- voda / water: tap vs. sparkling (both near zero; a row on every water would be noise)
- namaz / spread: butter, jam, honey, Nutella, peanut butter
- slatkiši / sweets, desert / dessert: chocolate, cake, ice cream, cookies
- piletina / chicken: only roasted breast exists (see Meat above)

## DONE in round 2 (2026-10-29, owner: "more detailed choices, a plain word still one tap")
Spec block "MORE DETAIL IN THE CHOOSERS" at the end of research/tools/fooddb_spec.py; tests in
app/src/v4/variants.test.ts ("more detailed choices (2026-10-29 round 2)"). Every value is a USDA SR Legacy record or
our recipe from USDA parts (level C); stand-ins are marked proxy (level B) and say which record they use.

**New foods (15)**: Soft pretzel (+ Sticks), Pita bread (lepinja, somun), Muffin, Cinnamon roll (pužić), Turkey breast,
Breaded schnitzel (veal record, proxy for pork; + Breaded chicken), Ground beef (+ Ground pork, Mixed 50/50 recipe),
Mackerel, Squid (fried calamari), Tomato salad and Cucumber salad (with the dressing builder), Potato salad (mayonnaise,
USDA; + Croatian oil-and-vinegar recipe, which "krumpir salata" opens), Fruit nectar (apricot; + Peach, Pear), Gummy
candy (+ Hard candy), Mixed vegetables.

**New variants on existing foods**: roll → Kaiser (poppy/sesame/seeded roll words), Wholemeal roll, Rye roll;
croissant → Chocolate (our recipe: croissant + 10 g dark chocolate), Cheese; cookies → Tea biscuits (Marie record,
Plazma type, proxy), Chocolate chip, Wafers (napolitanke); pancakes → with jam, with chocolate spread (recipes);
beer → Dark (proxy: regular beer values); white wine → Sparkling (proxy: white table wine values); plain yogurt →
Drinkable (proxy: plain whole-milk yogurt as 250 ml).

**Rows extended**: Which roll or pastry? + Pretzel, Muffin, Cinnamon roll; Which bread? + Pita; Which meat? + Turkey,
Schnitzel, Ground; Which salad? + Tomato, Cucumber, Potato; Which fish? + Mackerel, Squid; Which juice? + Nectar;
Which wine? + Sparkling.

**New choosers**: voće/fruit → Which fruit? (apple first; 10 fruits); povrće/vegetables → Which vegetables? (mixed
first); namaz/spread → Which spread? (butter, jam, honey, chocolate spread, peanut butter, hummus); slatkiši/sweets/
candy → Which sweets? (gummy candy first, chocolate, cookies, cake, ice cream). New chooser flag "see"
(build_variants.py): chocolate is listed in "Which sweets?" but keeps its own "Which chocolate?" row.

**Not done, and why**
- voda/water chooser: tap and sparkling water are both ~0 kcal; a row on every glass of water is noise, not precision.
- Oat milk, crêpe-style palačinke, a hake record of its own, sea bass/bream, Emmental/Trappist/cream cheese, skyr, plant
  yogurt, multivitamin/cranberry/carrot juice, flat white/iced coffee, mulled wine, wheat beer, Sacher/Rapska: not in
  this round (no SR Legacy record for several; the rest can follow the same pattern).
- GI of the new carbohydrate foods (pretzel, muffin, cinnamon roll, nectar, candy, cheese croissant, tea biscuits,
  wafers, potato salad) is left null, not guessed: not yet read from the Atkinson 2008/2021 supplementary tables
  (allow-list with this reason in variants.test.ts NO_GI). Pita bread has its GI (68, A1 row 295).

## DONE in round 3 (2026-10-29, coordinator: GIs, the rest of the list, names and aliases)
**GI filled from the tables** (rows read in Atkinson 2021 Suppl. Table 1, ISO method, and 2008 Suppl. Table A1; text in
`giSource`, keys in build_fooddb.py GI_SUPP): soft pretzel 80 (Ditsch, Germany), pretzel sticks 84, muffin 50 (blueberry),
cinnamon roll 66 (nearest: hot cross bun with dried fruit), gummy candy 76, tea biscuits 40 (Rich Tea UK), cream wafers 61
(Tronky, hazelnut cream-filled), chocolate chip cookie 42, cheese croissant 56 (the croissant's value), rye roll 60 (rye
breads mean), breaded chicken 46 (chicken nuggets, nearest), oat milk 69 (Vitasoy), cranberry juice drink 59, carrot
juice 43, flour tortilla 30 (the kebab wrap's row).
**Still null, with the reason in variants.test.ts NO_GI** (no test of the food in either edition): nectars (only a grape
nectar was tested), potato salad, crepes (and with jam / chocolate spread), mulled wine and dark/wheat beer (wine and beer
have no GI here), lactose-free milk, soy yogurt (only sweetened flavored ones tested), fish sticks, pickled beetroot.

**New foods (13)**: Oat milk (Oatly EU label via Open Food Facts, level B; the USDA rice drink only carries water and
density), Emmental cheese (USDA Swiss), Trappist cheese (USDA port de salut; "trapist" moved from gouda), Cream cheese,
Brie cheese (+ Camembert), Cranberry juice drink, Carrot juice, Sea bass (orada/sea bream as proxy), Shrimp (škampi too),
Fish sticks, Rocket salad (dressing builder), Pickled beetroot (cikla), Flour tortilla.
**New variants (12)**: Crepes, Crepes with jam, Crepes with chocolate spread (our recipe from USDA flour, milk, egg, oil;
"palačinke" moved from US pancakes to the crepe), Skyr (proxy: USDA nonfat Greek yogurt), Soy yogurt (USDA SILK plain),
Lactose-free milk (proxy: 2% milk values), Mulled wine (our recipe: 200 ml red wine + 20 g sugar, all alcohol counted),
Wheat beer (proxy), Americano and Espresso with whipped cream (recipes), Chicken thigh, Chicken wings, Roast veal.
**Names and search**: squid → "Fried calamari", nectar → "Apricot nectar", cheeses without parentheses (deep links use the
short name); misspellings and forms without diacritics added (zobeno mljeko, kajzerca, mufin, napolitanki, plasma keks,
palacinke sa dzemom, kamember, linje, gluvajn …). Matching already ignores diacritics. "pohani" alone (also "pohani sir")
and "oatly" (fuzzy-matched "oats") were removed.

**Still not added**: hake as its own fish (no USDA record; oslić stays under cod), multivitamin and grapefruit juice
(no GI and no shop-type record), iced coffee, flat white (= cappuccino), Sacher/Rapska/Bajadera, brownie, tortilla chips
(the two corn-chip GI tests disagree, 42 vs 72), Smoki, protein bars, coleslaw/Caesar/Greek/shopska salads, sarma, gulaš,
meatballs, pita pies, gluten-free bread, cedevita.
