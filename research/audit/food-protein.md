# Food audit: dairy, eggs, meat, fish, fats (2026-10-17)

Auditor scope: yogurt-plain, yogurt-lowfat, yogurt-greek, yogurt-fruit, cheese-cheddar, cheese-gouda, cheese-mozzarella,
cheese-feta, cheese-cottage, cheese-parmesan, egg-boiled, egg-fried, butter, chicken-breast, beef-steak, cevapi, pork-chop,
lamb-roast, tuna-canned, salmon, cod, sardines, ham, sausage, frankfurter, salami, bacon, tofu, olive-oil.

Method: read `fooddb_spec.py`, `build_fooddb.py`, `app/src/v4/food/parse.ts` (alias matching, `SERVING_FIX`), and compared
`app/src/v4/food/fooddb.json` (what the app ships) with `research/fooddb.json`. For all 29 foods the app values match the
research build 1:1, and the build matches the raw USDA SR Legacy CSV (`food_nutrient.csv`, `food_portion.csv`, read
directly with awk/grep). Missing USDA values are null, not 0 (sausage/salami/tofu sugars, tuna/sausage/tofu caffeine
and alcohol). kcal is within about 3% of 4/4/9 Atwater for all foods. The small gaps (chicken 165 vs 156, parmesan 392 vs 381,
olive oil 884 vs 900) come from USDA's food-specific energy factors, which is expected. No GI is set on any of these
foods except yogurt-fruit (41, Atkinson 2008 Table 1 "Yogurt, fruit"), which is correct.

**Alias resolution rule** (parse.ts `bestFoods`): an exact alias scores 10, and a **tie goes to whichever food comes first in the database**.
This rule causes two of the high-severity findings below.

Severity: **H** = the user sees a wrong food or a value off by a large factor; **M** = an unrepresentative record or serving for a
Croatian/EU user; **L** = labels, wording, minor issues.

## Per-food verdicts

| food | verdict |
|---|---|
| yogurt-plain | OK on numbers (171284, 3.25% fat, close to EU 2.8–3.2% jogurt). L: alias "navlaka" is wrong, since navlaka is the cream skin/kajmak-type layer, not yogurt. L: serving label "1 cup (8 fl oz)" = 245 g is a US cup. Croatian cups are 180 g, bottles 500 g/1 L. |
| yogurt-lowfat | M: 170886 is US low-fat yogurt fortified with milk solids (protein 5.25 g, sugars 7.04 g/100 g). A Croatian "jogurt 1.5%" (alias) has roughly 3.5 g protein and 4–5 g sugars. EU label values were not verified, so this is an open question. L: same US cup label. |
| yogurt-greek | OK on record (170903 Greek plain lowfat, 1.9% fat). M/open: "grčki jogurt" on the Croatian market is often the full-fat "Greek-style" product. 171304 "Yogurt, Greek, plain, whole milk" (97 kcal, 5 g fat) also exists. Serving 200 g is fine. |
| yogurt-fruit | OK record and GI. Open: freeSugars is null because USDA gives no lactose. A defensible estimate is possible (total minus the lactose of a plain low-fat yogurt base), but it is our assumption. |
| cheese-cheddar | Numbers OK (170899, Na 644 mg). L: aliases "trapist", "ementaler" map here although USDA has 171251 "Cheese, swiss". The **"gouda" alias here is a bug** (see gouda). |
| cheese-gouda | Numbers OK (171241, Na 819). **H: typing "gouda" opens cheddar.** Both cheddar and gouda carry the exact alias "gouda", and cheddar comes first. |
| cheese-mozzarella | M/open: 170845 "mozzarella, whole milk" (50% water, 299 kcal, Na 486) is the US block style. A fresh mozzarella ball (fior di latte), which is what most people in HR/IT mean, has about 60% water and roughly 250–270 kcal. One generic Italian table gives 268 kcal, 20.3 g fat, 20.6 g protein, sodium not reported. No EU label was confirmed, so this is an open question. |
| cheese-feta | Numbers OK (173420, Na 1139, plausible for brined feta). M: alias "ovčji sir" in Croatia usually means a hard sheep cheese (Paški sir), not feta. "bijeli sir" often means fresh cow cheese (closer to cottage, Na 315 vs 1139). |
| cheese-cottage | Numbers OK (172179). App `SERVING_FIX` 105 g "1/2 cup" is reasonable, but "cup" is a US unit (L). L: alias "vrhnje sir" is not a real term. |
| cheese-parmesan | M: 170848 "parmesan, hard" Na **1175 mg** vs the Parmigiano Reggiano Consortium mean of **650 mg** (salt 1.6 g). The Consortium also gives protein 32.4 (USDA 35.75), fat 29.7 (USDA 25.0), sat 19.6 (USDA 14.85) and 402 kcal (USDA 392). The USDA record is a US product. |
| egg-boiled | OK (173424, large 50 g edible, 155 kcal). |
| egg-fried | OK (173423, 46 g). L: alias "pohano jaje" means a breaded egg, which is not a fried egg. "pečeno jaje" is listed twice (harmless). |
| butter | M: record is "Butter, salted" (Na 643 mg). Butter in Croatia ("maslac") is normally unsalted. 173430 "Butter, without salt" has Na 11 mg with identical energy and fat. |
| chicken-breast | OK (171477 roasted, meat only, 86 g). L: label "0.5 breast, bone and skin removed" is long and US-style. |
| beef-steak | Numbers OK (168727 top sirloin broiled). M: serving "3 oz" = 85 g is a USDA reference amount, not a steak. A restaurant steak is 200–250 g raw (~150–180 g cooked). |
| cevapi | **H: sodium 83 mg/100 g.** The proxy is unsalted ground beef, but ćevapi are salted meat. Product labels: Rewe ćevapčići 1.70 g salt/100 g, Metzgerfrisch 1.38 g, Aldi AU beef chevapi 616 mg Na (≈ 550–680 mg Na). A 170 g "night out" preset (`beer cevapi*2`) shows ~140 mg Na instead of ~1,000+. Correctly flagged `proxy`. M: alias "ground meat / minced meat / mljeveno meso" sends raw cooking mince to a cooked salted-dish proxy. M: serving "3 oz / 85 g" is not a ćevapi portion (people count pieces: 5 or 10). Meat mix: beef-only is defensible (Sarajevo style is beef). Croatian style is often beef + pork or + lamb. Fat 15.9 g and protein 24 g are in the label range (fat 16–19 g). L: alias "ćevapi (grilled minced meat)" is a display string sitting among the aliases. |
| pork-chop | OK (167821 loin roasted, 89 g/chop). L: label "1 chop, excluding refuse (yield from 1 raw chop, with refuse, weighing 151 g)" is shown almost verbatim and is confusing. |
| lamb-roast | OK (174312 leg roasted, 85 g). |
| tuna-canned | M: record 171986 is "canned in water, **without salt**" (Na 50 mg). EU canned tuna (in brine or in oil) is salted. USDA's standard record 173709 "canned in water, drained solids" has Na 247 mg. Note: 173709 also has lower energy/protein (86 kcal, 19.4 g) than 171986 (116 kcal, 25.5 g). L/open: serving "1 can" = 165 g is a US 5-oz can drained. EU cans are 80 g or 160 g net (drained weight was not verified). Open: in Croatia tuna in oil is very common. 173708 "light, canned in oil, drained" is 198 kcal, Na 416. |
| salmon | OK (175168 farmed Atlantic, dry heat). L: 0.5 fillet = 178 g is a large portion (EU portions are 120–150 g raw). |
| cod | OK (171956 Atlantic, dry heat). L: alias "bakalar" in Croatia usually means stockfish/salt cod (bakalar na bijelo), which has different sodium. "oslić" (hake) as a white-fish proxy is fine. |
| sardines | OK (175139 in oil, drained, with bone, Na 307, 92 g can). |
| ham | Na 814 OK for cooked ham (EU ~2 g salt). M: **satFat 0.5 g with fat 8.8 g** is implausible (pork fat is ~35% saturated, so ~3 g). It is the USDA record's value, but it is internally inconsistent. L: fiber 1.3 g in ham is odd (USDA value, added binders?). M: alias "pureća šunka" (turkey ham) maps to an 11%-fat pork ham. 168092 "Ham, turkey, sliced, extra lean" exists. |
| sausage | Numbers match 174577 "Polish sausage, pork" (Na 876). L: display name "Sausage (pork, cooked)" hides that it is a smoked Polish sausage. That is OK as a proxy for "kranjska". **H: alias "hrenovka"** sits here and in frankfurter. Sausage comes first, so "hrenovka" opens the Polish sausage (326 kcal) instead of the frankfurter. |
| frankfurter | M: 174614 "Frankfurter, **beef**, heated". Croatian hrenovke are pork/poultry, which matches 171633 "Frankfurter, meat and poultry, cooked, boiled" better (298 kcal, Na 914, 26.3 g fat). Serving 48 g per piece is fine. |
| salami | OK (172938 dry pork, Na 2260, 10 g slice). "kulen" as an alias is an acceptable proxy. |
| bacon | Numbers OK for 167914 "bacon, cooked, baked" (548 kcal, Na 2193). M: the aliases "slanina", "pancetta/panceta" in Croatia usually mean raw dry-cured/smoked bacon eaten uncooked, and they get weighed raw. 168277 "Pork, cured, bacon, unprepared" is 393 kcal, Na 751. L: freeSugars is null but sugars is 0, so it could be 0. |
| tofu | OK (172475 firm, Ca sulfate). Sugars correctly null. L: label "0.5 cup" is a US unit (126 g). |
| olive-oil | OK (171413, 1 tablespoon 13.5 g, 884 kcal). L: aliases "ulje"/"oil" map to olive oil, while sunflower oil is the most common oil in Croatian kitchens. Energy is identical, satFat differs. L: label "1 tablespoon" vs "tbsp" elsewhere. |

Other alias ties (L, sensible enough): "sir"/"cheese" → cheddar; "riba"/"fish" → canned tuna (first listed, which is debatable for "fish"); "jaja"/"egg" → boiled egg; "narezak" → ham; "jogurt"/"yogurt" → plain whole yogurt; "odrezak" → beef steak (in Croatia "odrezak" is often a pork schnitzel).

## Proposed changes

| food id | field | current | proposed | source (exact) | confidence |
|---|---|---|---|---|---|
| cheese-cheddar | aliases | includes "gouda" | remove "gouda" | parse.ts `matchScore` returns 10 for both, so the tie goes to the first DB entry (cheddar) | high |
| sausage | aliases | includes "hrenovka" | remove "hrenovka" (frankfurter already has it) | same tie rule; frankfurter's own aliases | high |
| cevapi | usda/mix + sodiumMg | 171798 alone, Na 83 mg | computed mix `[(171798, 98.5), (173468 "Salt, table", 1.5)]` → Na ≈ 655 mg/100 g; note "salt 1.5 g/100 g is our assumption from product labels" | Labels: Rewe Ćevapčići 1.70 g salt/100 g, Metzgerfrisch 1.38 g (wikifit.de); Aldi AU beef chevapi 616 mg Na/100 g (fatsecret.com.au); USDA 173468 Na 38758 mg/100 g | med |
| cevapi | aliases | "ground meat", "minced meat", "mljeveno meso" | remove (or map to a separate raw ground beef 174036 entry) | 174036 "Beef, ground, 80% lean / 20% fat, raw" exists in SR Legacy | high (remove) |
| butter | usda | "Butter, salted" (173410), Na 643 | "Butter, without salt" (173430), Na 11; name "Butter" | USDA SR 173430; EU/HR maslac is normally unsalted | med |
| tuna-canned | usda | 171986 (without salt, Na 50) | 173709 "Fish, tuna, light, canned in water, drained solids" (Na 247) | USDA SR 173709. EU canned tuna is salted | med |
| frankfurter | usda | 174614 beef, heated | 171633 "Frankfurter, meat and poultry, cooked, boiled" | USDA SR 171633; HR hrenovke are pork/poultry | med |
| ham | aliases | includes "pureća šunka" | remove (or add a turkey-ham entry on 168092) | USDA SR 168092 | high (remove) |
| cheese-feta | aliases | "ovčji sir", "ovcji sir", "bijeli sir" | remove | the HR meaning (Paški sir; fresh cow cheese) is not feta | med |
| yogurt-plain | aliases | "navlaka" | remove | navlaka is not yogurt | high |
| egg-fried | aliases | "pohano jaje" | remove | breaded egg ≠ fried egg | med |
| beef-steak | serving | 3 oz = 85 g | ('g', 170, "1 steak (cooked)", "our assumption") | none exact. A 200–250 g raw steak gives ~150–180 g cooked | low (size), med (85 g is too small) |

## Open questions

1. **Ćevapi portion**: a weight per piece, so the app can say "5 ćevapi". About 25 g cooked per piece is my guess and is **not sourced**. A 5-piece (~125 g) or 10-piece (~250 g) default needs a source (restaurant menus list "10 kom" without a weight). Meat mix: should we keep beef-only (Sarajevo) or use beef+pork (Croatian)? 168374 pork 84/16 pan-broiled and 172544 lamb ground broiled exist if wanted. Salt: labels are for raw product, and cooking loss raises salt per 100 g cooked. A defensible range is 550–900 mg Na/100 g cooked.
2. **Parmesan**: switch to Consortium values (650 mg Na, 402 kcal, 32.4 P, 29.7 F, 19.6 SFA), which are not USDA? That would break the "SR Legacy only" model. Alternatively, add a note that USDA US parmesan has nearly twice the sodium of Parmigiano Reggiano.
3. **Mozzarella**: fresh ball vs block. No EU label with sodium was confirmed.
4. **yogurt-lowfat / yogurt-greek**: US records vs Croatian products (sugar and protein of lowfat, fat level of Greek). An EU label check is needed (e.g. Dukat).
5. **Bacon / slanina**: should "slanina" go to raw cured bacon (168277), with "bacon" staying cooked?
6. **Tuna**: water vs oil default for Croatia, and the EU can drained weight for the "1 can" serving.
7. **Ham satFat 0.5 g**: keep the USDA value, null it, or note it as a likely USDA data error?
8. **yogurt-fruit freeSugars**: leave null or estimate it?
9. **US-unit labels** ("1 cup (8 fl oz)", "0.5 cup", "1/2 cup", "1 tablespoon", the long pork-chop and chicken labels): `servingText` converts oz but not cups. Should these get metric labels?
10. "riba" → canned tuna and "sir" → cheddar as defaults. Is that the everyday choice we want?

## Sources read
- USDA SR Legacy 2018-04 CSV (local): food.csv, food_nutrient.csv, food_portion.csv. FDC ids as cited.
- Parmigiano Reggiano Consortium, "Nutritional Features": https://www.parmigianoreggiano.com/made/nutritional_features/default.aspx (moisture 31.4 g, protein 32.4 g, energy 402 kcal, fat 29.7 g, sat 19.6 g, salt 1.6 g, sodium 650 mg per 100 g).
- Ćevapi labels via search summaries (not fetched page-by-page, so treat as med): wikifit.de Rewe Ćevapčići gewürzt (204 kcal, 18 g protein, 1.70 g salt), Metzgerfrisch Ćevapčići (244 kcal, 1.38 g salt), fatsecret.com.au Aldi beef chevapi (15.7 g protein, 616 mg Na).
- Fior di latte generic table (torrinomedica.it / my-personaltrainer.it via search: 268 kcal, 20.3 g fat, 20.6 g protein, Na not reported).
