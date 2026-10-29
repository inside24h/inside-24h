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
