# Foods: banana, white bread, cheese pizza, milk chocolate, orange juice, green tea — research dossier

Status: **draft v1** · 2026-10-08
Rule: upute.md §2. Levels: **A** established · **B** supported, variable · **C** our estimate (math shown) · **?** unknown. "source pending" = seen only in a snippet/secondary source.
Abstracts were read with `tools/epmc.py abs` or the Europe PMC REST API. Banana is reused from `banana.md` (not re-researched).

**Data-source note (USDA).** The FDC API with DEMO_KEY returned HTTP 429 on every call (Retry-After 42485 s, about 11.8 h, shared limit). Instead the official **FoodData Central SR Legacy CSV download** (`FoodData_Central_sr_legacy_food_csv_2018-04.zip`, fdc.nal.usda.gov/fdc-datasets/) was read; the records are the same FDC IDs the API serves. Values are per 100 g from `food_nutrient.csv`, portions from `food_portion.csv`; per-serving values are our scaling (C).

**Serving definitions** (all from USDA `food_portion.csv` unless noted)
- White bread, 2 slices: `slice` = 29 g each → **58 g**.
- Cheese pizza, 1 slice: the only per-piece USDA portion is "1 serving, 9 per 24 oz package" = **81 g** (frozen, cooked). This is smaller than a typical restaurant slice; per-100 g values are given so the app can rescale (open question 1).
- Milk chocolate: **40 g** (task brief; USDA bar = 44 g).
- Orange juice 250 ml: USDA `fl oz` = 31 g → 31 ÷ 29.57 ml = 1.048 g/ml → 250 ml = **262 g** (our arithmetic).
- Green tea 250 ml: `fl oz` = 29.6 g → ≈ 1.0 g/ml → **250 g**.

Shared references used by several foods:

| ID | Claim | Level | Source |
|---|---|---|---|
| G1 | WHO: free sugars should be **< 10% of total daily energy, ≈ 50 g** for a 2000 kcal diet. Definition: monosaccharides and disaccharides added to foods and drinks by manufacturer, cook or consumer, **plus sugars naturally present in honey, syrups, fruit juices and fruit juice concentrates**. (That whole fruit and milk sugars are excluded follows from this definition; the exclusion wording itself was not quoted.) Saturated fat: **≤ 10% of energy**. | A (official body) | WHO Healthy diet fact sheet (who.int/news-room/fact-sheets/detail/healthy-diet, page read); WHO Guideline: Sugars intake for adults and children 2015, PMID 25905159 (abstract only) |
| G2 | Metabolic-ward meta-analysis (395 experiments, median 1 month): replacing saturated fat with complex carbohydrate for **10% of calories** lowered LDL by **0.36 mmol/L (SE 0.05)** → **0.036 mmol/L per 1% of energy**. | A (RCT/feeding studies, all saturated fats pooled) | Clarke R et al. 1997, BMJ. PMID 9006469, DOI 10.1136/bmj.314.7074.112 (abstract) |
| G3 | Same effect in the WHO 2016 report (Mensink): SFA → carbohydrate **−0.033 mmol/L per 1% energy** (95% CI −0.039 to −0.027), SFA → cis-PUFA −0.055, SFA → cis-MUFA −0.042. Consistent with G2. | **source pending** (numbers from a web-search snippet; the WHO PDF was blocked / unreadable) | Mensink RP 2016, WHO. Use G2 until the primary is read |
| G4 | GL = available carbohydrate (g) × GI ÷ 100 (glucose = 100). | A (formula) | Atkinson FS et al. 2008, Diabetes Care. PMC2584181, PMID 18835944 (full text) |
| G5 | Caffeine and sleep (RCT, n = 23 men): **100 mg caffeine had no significant effect** on objective or subjective sleep, even 4 h before bed; 400 mg did. | A (one crossover RCT, men only) | Gardiner CL et al. 2025, Sleep. PMID 39377163 (abstract) |
| G6 | Energy conversion used below: saturated fat 9 kcal/g; reference diet 2000 kcal (WHO fact sheet). Sat-fat % of energy = g × 9 ÷ 2000 × 100. | C (Atwater factor, assumption) | G1 |

---

## 1. Banana (1 medium, 118 g) — from banana.md

| ID | Claim | Level | Source |
|---|---|---|---|
| BN1 | 105 kcal, 26.9 g carbohydrate, 3.1 g fibre, total sugars 14.4 g (glucose 5.9 + fructose 5.7 + sucrose 2.8), starch 6.3 g, fat ≈ 0.4 g (0.33 g/100 g), protein 1.3 g, Na 1.2 mg, caffeine 0. | A (database) · C (scaling) | banana.md P1–P3; USDA FDC 173944 |
| BN2 | **Free sugars = 0 g**: banana sugars are in intact whole fruit, outside the WHO definition. | A (definition) · C (application) | G1 |
| BN3 | GI **51 ± 3**; GL ≈ **12** (23.9 g × 51/100). | A (GI) · C (GL) | banana.md B1, B2; Atkinson 2008 |
| BN4 | Banana intake and type 2 diabetes in three US cohorts (HR per 3 servings/week): bananas **0.95 (0.91–0.98)**; total whole fruit 0.98 (0.97–0.99). | Association (B) | Muraki I et al. 2013, BMJ. PMID 23990623 (abstract) |
| BN5 | Fruit + vegetables, per 200 g/day: all-cause mortality RR **0.90 (0.87–0.93)**; CVD 0.92 (0.90–0.95); "similar associations for fruits and vegetables separately" (fruit-only numbers not in the abstract). | Association (A for direction) | Aune D et al. 2017, Int J Epidemiol. PMID 28338764 (abstract) |
| BN6 | Life-quality estimate: assume RR scales log-linearly with grams: 0.90^(118/200) = **0.94** (−6%). | C (uses combined fruit+veg RR; fruit-only value **source pending**) | BN5 |

## 2. White bread (2 slices, 58 g) — USDA FDC 174924 "Bread, white, commercially prepared"

Per 100 g: 266 kcal; carbohydrate 49.42 g; fibre 2.7 g; sugars 5.67 g (glucose 1.57, fructose 2.43, maltose 1.67, sucrose 0); starch 37.17 g; fat 3.33 g; saturated 0.698 g; protein 8.85 g; sodium 490 mg; caffeine 0.

| ID | Claim | Level | Source |
|---|---|---|---|
| WB1 | Per 58 g: **154 kcal**, carbohydrate **28.7 g**, fibre **1.6 g**, total sugars **3.3 g**, starch 21.6 g, fat **1.9 g**, saturated **0.41 g**, protein **5.1 g**, sodium **284 mg**, caffeine 0. | A (database) · C (×0.58) | USDA FDC 174924 |
| WB2 | Free/added sugars are **not itemised** in SR Legacy. Sugar profile is glucose + fructose + maltose with zero sucrose and zero lactose, so no table sugar was added as sucrose; part may be from starch breakdown or added syrup. **Upper bound for free sugars: 3.3 g = 6.6% of the WHO 50 g.** | C (upper bound) | WB1, G1 |
| WB3 | GI of white wheat bread **75 ± 2** (glucose = 100). | A (table, one aggregate row) | Atkinson 2008, Table 1, PMC2584181 |
| WB4 | Available carbohydrate = (49.42 − 2.7) × 0.58 = 27.1 g; **GL = 27.1 × 75/100 = 20.3** (GI 73–77 → 19.8–20.9). A GL ≥ 20 is the conventional "high" band; band cut-offs not read in the text we have, so we do not rely on them. | C | WB1, WB3, G4 |
| WB5 | Refined grains (cohorts, 22 studies): apart from a positive spline association with **all-cause mortality**, "no significant influence of refined grain intake on stroke, CHD, HF and CVD"; all refined-grain evidence graded **low quality**. Whole grains per 30 g/day: all-cause mortality RR **0.94 (0.92–0.97)**. | Association (B, low quality) | Hu H et al. 2023, Am J Clin Nutr. PMID 36789934 (abstract) |
| WB6 | Bread-specific long-term effect on lifespan or diabetes: **not found** in the abstracts read. | ? | needs search for "white bread" cohort/RCT |

## 3. Cheese pizza (1 slice, 81 g, frozen cooked) — USDA FDC 170317 "Pizza, cheese topping, regular crust, frozen, cooked"

Per 100 g: 268 kcal; carbohydrate 29.02 g; fibre 2.2 g; sugars 3.57 g (glucose 0.93, fructose 1.20, maltose 0.74, sucrose 0.31, lactose 0.39); starch 18.74 g; fat 12.28 g; saturated 4.272 g; protein 10.36 g; cholesterol 14 mg; sodium 447 mg; caffeine 0.

| ID | Claim | Level | Source |
|---|---|---|---|
| PZ1 | Per 81 g: **217 kcal**, carbohydrate **23.5 g**, fibre **1.8 g**, sugars **2.9 g** (of which lactose 0.32 g), fat **9.9 g**, saturated **3.46 g**, protein **8.4 g**, cholesterol 11 mg, sodium **362 mg**, caffeine 0. | A (database) · C (×0.81) | USDA FDC 170317 |
| PZ2 | Free sugars not itemised. Sugars minus lactose = 2.9 − 0.3 = 2.6 g (flour, tomato, any added sugar). **Upper bound 2.6 g = 5% of the WHO 50 g.** | C (upper bound) | PZ1, G1 |
| PZ3 | Saturated fat = 3.46 g × 9 = 31.1 kcal = **14% of the slice's energy** and **1.56% of a 2000 kcal day**. | C | PZ1, G6 |
| PZ4 | **LDL if eaten daily, replacing carbohydrate energy:** 1.56 × 0.036 = **+0.056 mmol/L = +2.2 mg/dL** (× 38.67 mg/dL per mmol/L; 38.67 is the standard LDL conversion, not read in a source here). | C (G2 slope applied to cheese-pizza fat; cheese-matrix effects not included) | PZ3, G2 |
| PZ5 | GI of pizza: **not in the Atkinson Table 1 text we read** (appendix not read). GL cannot be stated; available carbohydrate = (29.02 − 2.2) × 0.81 = 21.7 g. | ? | Atkinson 2008 appendix needed |
| PZ6 | Ultra-processed food (NOVA) umbrella review: highly suggestive link to all-cause mortality (RR **1.21**, 1.15–1.27, GRADE low) and type 2 diabetes (dose-response RR **1.12**, 1.11–1.13, GRADE moderate). The review does not give a per-slice unit, and whether a given pizza is "ultra-processed" depends on the product. | Association (B) | Lane MM et al. 2024, BMJ. PMID 38418082 (abstract) |
| PZ7 | Salami/processed-meat pizza is out of scope (not modelled). | — | task brief |

## 4. Milk chocolate (40 g) — USDA FDC 167587 "Candies, milk chocolate"

Per 100 g: 535 kcal; carbohydrate 59.4 g; fibre 3.4 g; sugars 51.5 g (not itemised); fat 29.66 g; saturated 18.509 g; protein 7.65 g; cholesterol 23 mg; sodium 79 mg; **caffeine 20 mg**.

| ID | Claim | Level | Source |
|---|---|---|---|
| MC1 | Per 40 g: **214 kcal**, carbohydrate **23.8 g**, fibre **1.4 g**, sugars **20.6 g**, fat **11.9 g**, saturated **7.40 g**, protein **3.1 g**, sodium **32 mg**, caffeine **8 mg**. | A (database) · C (×0.4) | USDA FDC 167587 |
| MC2 | Sugars are not split into sucrose/lactose in SR Legacy. Milk chocolate holds added sucrose plus lactose from milk solids (lactose is excluded by WHO). **Upper bound for free sugars: 20.6 g = 41% of the WHO 50 g**; the real value is lower by the lactose share (not found). | C (upper bound) | MC1, G1 |
| MC3 | GI of "Chocolate" **40 ± 3**. Available carbohydrate 23.76 − 1.36 = 22.4 g; **GL = 22.4 × 40/100 = 9.0** (GI 37–43 → 8.3–9.6). The table row is generic "chocolate", not specifically milk chocolate. Authors note many confectionery items have low GI "but their high saturated fat content reduces their nutritional value". | A (table) · C (GL) | Atkinson 2008, PMC2584181 |
| MC4 | Saturated fat 7.40 g × 9 = 66.6 kcal = **31% of the bar's energy**, **3.33% of a 2000 kcal day**. | C | MC1, G6 |
| MC5 | **LDL upper bound if eaten daily, replacing carbohydrate:** 3.33 × 0.036 = **+0.120 mmol/L = +4.6 mg/dL**. It is an upper bound because cocoa butter contains stearic acid, which Mensink 2003 says "reduced the [total:HDL] ratio slightly" (stearic share of this product not read; LDL effect of stearic acid not read). | C | MC4, G2; Mensink RP et al. 2003, Am J Clin Nutr, PMID 12716665 (abstract) |
| MC6 | Flavanol-rich chocolate/cocoa lowers BP: 35 RCTs, 1804 mainly healthy people, 2–18 weeks (mean 9): SBP **−1.76 mmHg (−3.09 to −0.43)**, DBP **−1.76 (−2.57 to −0.94)**; moderate-quality evidence; no significant effect in normotensive people. Doses were 30–1218 mg flavanols (mean 670 mg) in 1.4–105 g of cocoa product. **Milk chocolate flavanol content is not stated** and is usually low, so this does not transfer to the 40 g serving. | A (moderate quality) for flavanol-rich products · ? for milk chocolate | Ried K et al. 2017, Cochrane. PMID 28439881 (abstract) |
| MC7 | Cohorts: ATBC (n = 27,111 men) overall mortality HR **0.88–0.91** across higher chocolate categories vs lowest; meta-analysis (21 estimates) **RR 0.98 per 5 g/day** for CVD incidence and mortality, non-linear. Gram cut-offs of the categories are not in the abstract. Authors: "calorie-balanced" intake, "low-to-moderate". | Association (B), not causal | Zhao B et al. 2022, Eur J Epidemiol. PMID 35460393 (abstract) |
| MC8 | Caffeine 8 mg per 40 g: far below the 100 mg that showed no sleep effect (G5). | A (G5) · C (comparison) | MC1, G5 |

## 5. Orange juice (250 ml, 262 g) — USDA FDC 169098 "Orange juice, raw"

Per 100 g: 45 kcal; carbohydrate 10.4 g; sugars 8.4 g; fibre 0.2 g; fat 0.2 g; saturated 0.024 g; protein 0.7 g; potassium 200 mg; sodium 1 mg; caffeine 0.

| ID | Claim | Level | Source |
|---|---|---|---|
| OJ1 | Per 262 g: **118 kcal**, carbohydrate **27.3 g**, sugars **22.0 g**, fibre **0.5 g**, fat 0.5 g, saturated 0.06 g, protein 1.8 g, potassium 524 mg, sodium 2.6 mg, caffeine 0. | A (database) · C (×2.62) | USDA FDC 169098 |
| OJ2 | **Free sugars = all 22.0 g = 44% of the WHO 50 g** (sugars in fruit juice count as free). Banana (same fruit family) = 0, a 23-point difference in classification for 14 g vs 22 g. | A (definition) · C | G1, OJ1 |
| OJ3 | GI of orange juice **50 ± 2**. Available carbohydrate (10.4 − 0.2) × 2.62 = 26.7 g; **GL = 26.7 × 50/100 = 13.4** (GI 48–52 → 12.8–13.9). | A (GI) · C (GL) | Atkinson 2008; OJ1 |
| OJ4 | Fruit juice and type 2 diabetes (17 cohorts): **+5% per serving/day (−1% to +11%)**, **+7% (1% to 14%)** after adiposity adjustment; non-significant in studies with objectively ascertained T2D (P heterogeneity 0.008); authors judge it "likely to involve bias". | Association (B) | Imamura F et al. 2015, BMJ. PMID 26199070 (abstract) |
| OJ5 | Three US cohorts: fruit juice HR **1.08 (1.05–1.11)** per 3 servings/week for T2D (whole fruit 0.98). | Association (B) | Muraki 2013, PMID 23990623 |
| OJ6 | Umbrella review of 100% juice (15 reviews, 51 MAs, 50–1200 ml/day): **74.5% no effect** (lipids, body composition, liver function, metabolic health), 19.6% benefit (BP, vascular function, inflammation, stroke mortality), 5.9% adverse (CVD mortality, prostate cancer, T2D risk). Risks came only from cohort studies. | B | Beckett EL et al. 2025, Nutr Rev. PMID 38679915 (abstract) |
| OJ7 | Acute glucose/insulin curve of 250 ml juice: not read (cola.md B2 anchor could scale it, not done here). | ? | open question |

## 6. Green tea (250 ml, 250 g, brewed regular) — USDA FDC 171917

Per 100 g: 1 kcal; protein 0.22 g; carbohydrate 0; sugars 0; fat 0; potassium 8 mg; sodium 1 mg; **caffeine 12 mg**.

| ID | Claim | Level | Source |
|---|---|---|---|
| GT1 | Per 250 g: **≈ 2.5 kcal**, protein 0.55 g, carbohydrate 0, sugars 0, fat 0, sodium 2.5 mg, potassium 20 mg, **caffeine 30 mg** (12 × 2.5). Matches the "about 30 mg per cup" in the brief. Real brews vary with leaf, time and temperature (not read). | A (database) · C (scaling) | USDA FDC 171917 |
| GT2 | Free sugars 0; GL 0 (no carbohydrate); GI not applicable. | A | GT1, G4 |
| GT3 | Caffeine 30 mg is 30% of the 100 mg dose that had no sleep effect (G5). | A (G5) · C | GT1, G5 |
| GT4 | **Lipids, Cochrane (RCTs ≥ 3 months, 7 green-tea trials):** LDL **−0.64 mmol/L (−0.77 to −0.52)**, total cholesterol −0.62, SBP −3.18 mmHg, DBP −3.42; "only a small number of studies … results were **not stable to sensitivity analysis**"; no CVD events reported. Doses and forms varied (beverage, extract). | B | Hartley L et al. 2013, Cochrane. PMID 23780706 (abstract) |
| GT5 | **Lipids, meta-analysis of 14 RCTs (n = 1136), green tea beverage or extract:** TC **−7.20 mg/dL (−8.19 to −6.21)**, LDL **−2.19 mg/dL (−3.16 to −1.21)**, HDL unchanged; no heterogeneity; change not influenced by dose or type. | A/B (RCT meta-analysis; effect small, dose per cup not in abstract) | Zheng XX et al. 2011, Am J Clin Nutr. PMID 21715508 (abstract) |
| GT6 | Tea (all types) and mortality, 38 cohort data sets: highest vs lowest all-cause **RR 0.90 (0.86–0.95)**; at **2 cups/day RR 0.91 (0.88–0.94)**, no further reduction beyond (non-linear). | Association (B), not causal | Kim Y, Je Y 2024, Epidemiol Health. PMID 38938012 (abstract) |
| GT7 | Per cup (236.6 ml): **−1.5% all-cause mortality**, −4% CVD mortality; strength of evidence "low" for all-cause. | Association (B, low) | Chung M et al. 2020, Adv Nutr. PMID 32073596 (abstract) |
| GT8 | Shanghai cohorts (green tea): all-cause HR **0.95 (0.90–1.01)**, CVD mortality HR **0.86 (0.77–0.97)**, cancer mortality 1.01 (0.93–1.10). | Association (B) | Zhao LG et al. 2017, J Epidemiol. PMID 28135196 (abstract) |
| GT9 | Type 2 diabetes (tea, 16 cohorts): **−4.6% (0.9–8.1%) per 2 cups/day**; predicted RR 0.95 (0.92–0.98) at 2 cups. Heterogeneity I² 60%. | Association (B) | Yang WS et al. 2014, Br J Nutr. PMID 24331002 (abstract) |
| GT10 | Catechin (EGCG) content per cup: not in the USDA record read; not researched. | ? | open question |

---

## Per-serving summary (our scaling, level C from the A-level USDA values above)

| Per serving | kcal | Free sugars g (% of 50 g) | Fibre g | Fat g | Sat fat g (% of 2000 kcal) | Protein g | Na mg | Caffeine mg | GI | GL |
|---|---|---|---|---|---|---|---|---|---|---|
| Banana 118 g | 105 | **0** (0%) | 3.1 | 0.4 | n/r | 1.3 | 1 | 0 | 51 | 12 |
| White bread 58 g | 154 | ≤ 3.3 (≤ 7%) | 1.6 | 1.9 | 0.41 (0.18%) | 5.1 | 284 | 0 | 75 | 20 |
| Cheese pizza 81 g | 217 | ≤ 2.6 (≤ 5%) | 1.8 | 9.9 | 3.46 (1.56%) | 8.4 | 362 | 0 | ? | ? |
| Milk chocolate 40 g | 214 | ≤ 20.6 (≤ 41%) | 1.4 | 11.9 | 7.40 (3.33%) | 3.1 | 32 | 8 | 40 | 9 |
| Orange juice 250 ml | 118 | **22.0** (44%) | 0.5 | 0.5 | 0.06 (0.03%) | 1.8 | 3 | 0 | 50 | 13 |
| Green tea 250 ml | 2.5 | 0 | 0 | 0 | 0 | 0.6 | 3 | **30** | n/a | 0 |

---

## Suggested bar rules (per serving; Cholesterol, Fat and Life are habit-scaled like cola/espresso; Sugar and Sleep are today-only)

Calibration of points (from the existing healthBars.ts rules): espresso 0.8 mg/dL = −0.5 point → **1.6 mg/dL per Cholesterol point**; cola +9% death risk = −3 → **0.33 point per 1% RR (harm)**; coffee −17% at 3 cups ≈ +3 → **0.18 point per 1% RR (benefit)**. Cola Fat −6 at 70% of the sugar budget → **0.086 point per 1% of a budget**. All C.

| Bar | Rule (per serving) | Banana | White bread | Cheese pizza | Milk choc. | Orange juice | Green tea | Math / claims |
|---|---|---|---|---|---|---|---|---|
| **Sugar** (today) | −(free sugars g ÷ 50 × 100); count **0 for bread and pizza** (free sugars not determinable, bound ≤ 7% / ≤ 5%) | 0 | 0 | 0 | **−41** (upper bound; lower if lactose known) | **−44** | 0 | 20.6/50 = 41%; 22.0/50 = 44%. BN2, WB2, PZ2, MC2, OJ2, G1 |
| **Cholesterol** (habit) | −(sat fat % of 2000 kcal × 0.036 mmol/L × 38.67) ÷ 1.6; tea +1 | 0 | −0.2 (≈ 0) | **−1.4** | **−2.9** | 0 | **+1** (cap) | Pizza: 1.56 × 0.036 × 38.67 = 2.17 mg/dL ÷ 1.6 = 1.4. Choc: 3.33 → 4.64 mg/dL ÷ 1.6 = 2.9. Bread: 0.18 → 0.25 ÷ 1.6 = 0.2. Tea: 2.19 mg/dL ÷ 1.6 = +1.4 → cap +1 (dose unknown). PZ3–PZ4, MC4–MC5, WB1, GT5, G2 |
| **Fat** (habit) | −0.086 × (sat fat % of 10% WHO limit); design choice, not a measured outcome | 0 | −0.2 | **−1.3** | **−2.9** | 0 | 0 | Pizza: 1.56/10 = 15.6% × 0.086 = 1.3 (rounded from 1.34). Choc: 33.3% × 0.086 = 2.9. G1, G6, PZ3, MC4 |
| **Life quality** (habit) | Benefit 0.18 pt per 1% lower RR; harm 0.33 pt per 1% higher RR; use only where a meta-analysis exists; cap ±2 | **+1** (6% × 0.18) | 0 | 0 | 0 | **−1** (7% × 0.18 = 1.3, conservative) | **+0.8 per cup, max 2 cups (+1.6)** | Banana BN6. Bread: refined-grain evidence low quality (WB5). Pizza: no per-slice RR (PZ6). Choc: gram cut-offs unread, non-linear (MC7). OJ: Imamura +7% T2D, with bias (OJ4). Tea: 1.5%/cup × 0.18 = 0.27 per cup by Chung (GT7), or 9% at 2 cups × 0.18 = 1.6 by Kim (GT6); we use the larger-effect 2-cup point, split 0.8/cup |
| **Sleep** (today) | add caffeine mg to the existing caffeine total: tea 30 mg, chocolate 8 mg; no extra rule | 0 | 0 | 0 | 8 mg (no effect alone) | 0 | 30 mg (no effect alone) | G5: 100 mg had no effect; the sim only matters if tea/chocolate add to coffee/cola. GT1, MC1 |

Display notes (all C): the bread GL (20) and chocolate GL (9) show why GI alone misleads (chocolate low GI, high saturated fat; MC3 quote). Sodium has no bar; show 284 mg (bread) and 362 mg (pizza) as text against WHO's sodium goal only after that goal is read (not read here).

## Open questions
1. **Pizza slice size.** USDA 81 g is small; a restaurant slice is larger. A second source for a typical slice (g) is needed, or let the user choose size.
2. **Pizza GI** is not in the Atkinson Table 1 text; read the appendix (2,480 foods) for pizza and verify bread (75) and chocolate (40) rows against it.
3. **Free sugars in bread, pizza, milk chocolate** are not itemised in SR Legacy. FDC Branded/Foundation records with "added sugars" (nutrient 1235) or label data would settle the 3.3 / 2.6 / 20.6 g upper bounds; lactose share of milk chocolate unknown.
4. **Mensink 2016 (WHO)** primary report not readable (PDF blocked or image slides); G3 stays "source pending". Clarke 1997 (G2) covers the slope but mixes all saturated fats.
5. **Cheese and cocoa-butter saturated fat** may raise LDL less than the pooled slope (food-matrix and stearic-acid effects); no source on cheese pizza or milk chocolate read. Our LDL numbers are upper bounds.
6. **Green tea dose per cup** in the lipid trials (GT4, GT5) is not in the abstracts; the +1 Cholesterol credit is a placeholder. Catechin content per cup unknown (GT10); caffeine varies with brewing.
7. **Orange juice** acute glucose/insulin response and whether the Imamura +7% is causal (OJ4: non-significant in objectively diagnosed studies).
8. **Chocolate flavanols** in milk chocolate: MC6 applies to flavanol-rich cocoa; no milk-chocolate BP trial read, so no BP credit.
9. **Banana fruit-only mortality RR** (BN6) needs the full text of Aune 2017 (PMID 28338764), or the fruit-specific dose-response.
10. **Energy / weight gain** per serving: no sourced rule, so Fat does not use plain kcal. A defensible rule needs an RCT on added snack energy and body fat.
11. **Points calibration** (1.6 mg/dL per point, 0.18/0.33 per 1% RR, 0.086 per 1% of a budget) is our design reading of the existing rules; Opus should confirm it is the intended scale.
12. The USDA API (DEMO_KEY) was rate-limited for ~12 h; re-verify five FDC IDs (174924, 170317, 167587, 169098, 171917) via the API when the key resets.
