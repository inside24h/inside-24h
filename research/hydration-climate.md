# Hydration vs body size and climate (resting adult, 24 h) — research dossier

Status: **draft v1** · 2026-10-08
Rule: see upute.md §2. Levels: **A** established · **B** supported, variable · **C** our estimate (math shown) · **?** unknown.
How sources were read: abstracts and full texts through `tools/epmc.py` and Europe PMC full-text XML (Meade, Seal, Millard-Stafford, Wang). The IOM 2005 chapter was read on nationalacademies.org through a page-fetch tool that returns a machine summary of the page, so IOM quotes are marked **recheck wording** until opened by hand. EFSA full opinion could not be opened (HTTP 403); only the press page already used in water.md (N1).
Reused from `water.md` (not repeated): **N1** (EFSA 2.0/2.5 L total water), **N2** (EFSA 70-80% fluid share, source pending), **B1** (plasma osmolality 280-290 normal; 295-300 mild hyperosmotic; >300 frank), **B2**, **B6** (Maughan 2016, 1 L water, 4 h urine 1337 +/- 330 g), **B7/B8** (no 250 ml urine data), **A1/A5** (gastric emptying T50 13 min; absorption ta1/2 11-13 min), **M2** (thirst threshold open), **W1** (Watson TBW), **M4** (coffee/tea myth).
New IDs use prefix **H**.

---

## 1. Daily water turnover at rest, temperate climate

| ID | Claim | Level | Source |
|---|---|---|---|
| H1 | IOM 2005: adult **total water AI 3.7 L/day (men) and 2.7 L/day (women)**, age 19-30. (EFSA lower: 2.5 / 2.0 L, see N1, and EFSA applies to moderate temperature and PAL 1.6, seen only in a search summary: source pending.) | A | IOM Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, Sulfate (2005), ch. "Water", nationalacademies.org/read/10925/chapter/6 (**recheck wording**) |
| H2 | **Insensible diffusion (skin): "approximately 450 mL/day"** for the average adult (IOM cites Kuno 1956). | A (official body; underlying study old) | IOM 2005 (as H1), **recheck wording** |
| H3 | **Respiratory water loss: 250-350 mL/day for sedentary persons**, 500-600 mL/day for active persons in temperate climate at sea level. | A | IOM 2005 (as H1), **recheck wording** |
| H4 | H2+H3 together: skin + lungs at rest, temperate = **~700-800 mL/day = 29-33 mL/h**, which for 70 kg is **0.42-0.48 mL/kg/h**. | C | arithmetic: (450+250..350)/24 = 29..33 mL/h; /70 kg |
| H5 | Equation-based estimate in 21 Chinese students (Beijing, **25 C, 30% RH assumed**): skin ~8.3% and respiratory ~8.4% of a total loss of 1931 +/- 504 mL/day, i.e. **~160 mL + ~160 mL/day** (~13 mL/h), much lower than H4. These were computed from published equations, not measured. **The equations use ambient absolute humidity in a way that makes skin loss rise with humidity, which is physically the wrong direction, so we do not adopt them.** | B- (modelled) | Wang X et al. 2026, Nutrients. PMID 42075081, PMC13118442 |
| H6 | **Measured 22 C, 45% RH, 8 h seated, n=16 older adults (median 72 y):** mean whole-body loss estimated from hourly body-mass change corrected for urine, food and drink = **20 +/- 30 g/h/m2**. For 1.85 m2 this is 37 g/h = **0.89 L/day = 0.53 mL/kg/h (70 kg)**, same order as H4 (it also contains net carbon loss as CO2, a few tens of g/day). | B (n=16, older) | Meade RD et al. 2024, Environ Health Perspect. PMID 38329752, PMC10852046, Table 5 |
| H7 | **Metabolic water production 0.25-0.35 L/day** (sedentary; IOM: ~250-350 mL, up to 500-600 for active). Measured/estimated 275 mL (9.1% of intake) in H12. | A | Perrier ET 2021, Eur J Nutr (PMC7987589); IOM 2005 (as H1); Wang 2026 (as H5) |
| H8 | **Urine** in adults generally **1-2 L/day**. **Minimum (obligatory) urine ~500 mL/day** if urine is maximally concentrated (~1200 mOsm/kg). Faecal water ~100-200 mL/day. | A | IOM 2005 (as H1), **recheck wording** |
| H9 | Measured 24 h urine volume 2409 +/- 660 mL (coffee, 4x200 mL) and 2428 +/- 669 mL (water) in 50 coffee-drinking men on controlled intake (3 days). Shows the upper typical range when drinking a lot. | A (n=50) | Killer SC et al. 2014, PLoS One. PMID 24416202, PMC3886980 |
| H10 | Free-living young adults, Beijing (n=21, 3-day collections): **urine 1634 mL/day (median) = 81% of measured losses (1931 mL = 32.9 mL/kg/day)**, faeces 76 mL/day. | B (n=21) | Wang 2026 (as H5) |
| H11 | Proposed optimal hydration: urine 2-3 L/day of dilute (<500 mOsm/kg) urine, needing total water intake 2.5-3.5 L/day. This is a "hydration for health" hypothesis, not a requirement. | B (narrative review) | Perrier 2021 (PMC7987589) |
| H12 | Intake split in the same 21 adults: total **3023 mL/day = beverages 54.1% (~1636 mL), food 36.7% (~1110 mL), metabolic 9.1% (~275 mL)**. Note: intake 3023 mL exceeds measured loss 1931 mL by 1.1 L, which cannot be a real steady state, so one side is incomplete (probably urine collection) and these totals are shaky. | B- | Wang 2026 (as H5); inconsistency noted by us (C) |
| H13 | Body-size scaling of water turnover and sweat: sweat output is almost proportional to the **2/3 power of body weight** (a 91 kg man ~30% more than a 59 kg man, same hard exercise); women sweat less than men in hot-wet conditions, similar per m2 in temperate and hot-dry. Older people start sweating later. Total water turnover (DLW, 5604 people) depends on age, body size, composition, activity, air temperature and humidity; the paper's prediction equations are in the supplement and were **not read**. | B (review for the sweat statement) | Orysiak J et al. 2025, review, PMC12787638; Yamada Y et al. 2022, Science. PMID 36423296 (abstract only) |
| H14 | Body surface area, Du Bois form used in the Wang paper: BSA (m2) = 0.007184 x height(cm)^0.725 x weight(kg)^0.425. Check: 175 cm, 70 kg gives 0.007184 x 42.3 x 6.083 = **1.85 m2**. | C (formula shown in source; arithmetic ours) | Wang 2026 (as H5), section 2.9.4 (the paper states height in "m" but the constant only works with cm) |
| H15 | Sleep: no source found for insensible loss while asleep. Respiratory water loss follows energy expenditure and ventilation (positive association with TEE, p<0.001), so sleep should be lower than awake; skin loss follows temperature and sweat. Size of the drop not measured here. | ? | Wang 2026 (association only). Needs overnight weighing or calorimetry/hygrometry data. |

---

## 2. Rise of resting loss with air temperature and humidity

Best data found: **Meade 2024** (H6), the only source read with resting whole-body loss at several temperatures in one design. Same 8 h seated exposure, 45% RH, light clothing, older adults.

| ID | Claim | Level | Source |
|---|---|---|---|
| H20 | **Average whole-body loss (g/h/m2), mean (SD), 8 h, 45% RH:** 22 C **20 (30)** · 26 C **26 (15)** · 31 C **31 (15)** · 36 C **80 (24)**. Difference vs 22 C: 26 C +7 (-6..20, n.s.); 31 C +22 (8..35, p=0.011); 36 C +60 (47..73, p<0.001). | B (n=16, older, one humidity) | Meade 2024 Table 5 (PMID 38329752) |
| H21 | Same trial, **fluid drunk in 8 h:** 0.48 / 0.54 / 0.76 / 1.22 L at 22 / 26 / 31 / 36 C. Core temperature +0.2 C (26), +0.7 C (31), +0.9 C (36) vs 22 C. Net body-mass loss over 8 h was -0.6 / -0.7 / -0.5 / -0.5% (equal in all conditions because people drank more; plasma volume actually rose in 31 and 36 C). | B | Meade 2024 |
| H22 | Converted to mL/h for **BSA 1.85 m2 (175 cm, 70 kg)** by linear interpolation between the H20 points: **20 C ~37 (plateau at 22 C value), 25 C ~45, 30 C ~55, 35 C ~130 g/h**. Per kg per hour (70 kg): 0.53 / 0.65 / 0.79 / 1.85. Per day: ~0.9 / 1.1 / 1.3 / 3.1 L. 40 C is **outside the measured range**: linear extension of the 31-36 C slope (9.8 g/h/m2 per C) gives ~119 g/h/m2 = 220 g/h = 5.3 L/day, which we treat as an upper guess only. | C | arithmetic on H20: 25 C = 20 + (3/4)x6 = 24.5; 30 C = 26 + (4/5)x5 = 30; 35 C = 31 + (4/5)x49 = 70; x1.85 m2 |
| H23 | Why 20 C was set equal to 22 C: no data below 22 C in the same design. Cold-air respiratory loss would be slightly higher in reality (dry air); not quantified here. | ? | needs data at 10-20 C |
| H24 | Independent check on direction and size: older Japanese adults (n=26) measured by DLW in May (mean 19 C, 57% RH) and August (mean 29 C, 66% RH): **water turnover rose 2.939 -> 3.579 L/day (+0.640 L/day)**; total body water +0.8 kg. For comparison, H20 gives (29 C: 29 g/h/m2) - (19 C: 20 g/h/m2) = 9 g/h/m2 x 1.85 x 24 = **+0.40 L/day** from resting evaporative loss alone. Turnover also includes extra urine and drinking, so the two numbers are consistent in order of magnitude. | B (Kim) · C (comparison) | Kim HK et al. 2026, Sci Rep. PMID 41714756, PMC13018177; Meade 2024 |
| H25 | IOM: "Higher intakes of total water will be required for those who are physically active or who are exposed to hot environments"; sweat >several L/day in hot climates; occupational sweating 0.3-1.2 L/h in very hot desert climates. IOM gives **no table of resting sweat vs temperature**. | A (qualitative) | IOM 2005 (as H1), **recheck wording** |
| H26 | **Humidity:** no quantitative resting data at several humidities were found in a read source. Qualitative: sweat that does not evaporate (high wettedness) drips off and is wasted, so sweating is partly suppressed and women sweat less in hot-wet air (Orysiak). Respiratory loss also falls as inhaled air carries more water vapour. Our **physics check (C, constants not from a read source: VERIFY):** saturated exhaled air at ~35 C holds ~39 mg/L; inhaled 20 C/50% RH ~8.7 mg/L, so at ~7 L/min resting ventilation (10,000 L/day) loss = 10,000 x (39-8.7)/1000 = ~300 g/day, which matches H3. At 35 C/60% RH inhaled air carries ~24 mg/L, so only ~15 mg/L is added, about half as much (~150 g/day). | C (VERIFY constants) / ? | Orysiak 2025 (PMC12787638); H3; vapour densities are textbook values not read in a source |
| H27 | Dependence of water need on time of day or clothing: not researched. | ? | |
| H28 | Cheuvront 2023 shows exercise sweat loss can be forecast from air temperature and energy expenditure (concordance 0.91 between forecast and observed in 33 runners). This is for exercise, not rest, so it is **not used** here; it would be the starting point if the app later adds exercise. | B (exercise only) | Cheuvront SN et al. 2023, Front Sports Act Living. PMID 38111903, PMC10725974 |

---

## 3. Thirst and dehydration thresholds

| ID | Claim | Level | Source |
|---|---|---|---|
| H30 | Normal daily variation of body water is **<2% body mass loss (~3% of total body water)**; **hypohydration is defined as >=2% body-mass deficit**. | A (review) | Liska D et al. 2019, Nutrients. PMC6356561 |
| H31 | Thirst appears at **~1-2% body-mass loss**, but varies a lot between and within people. Thirst can vanish after a single drink while a deficit of 2.1% (osmolality still +14 mOsm/kg) remains. | B | Adams WM et al. 2019, Nutrients. PMID 31703247, PMC6893511 (12 men after exercise in heat) |
| H32 | Cognition: meta-analysis of 33 studies (413 people, 1-6% body-mass loss): overall small impairment (ES -0.21, 95% CI -0.31..-0.11); worse for losses **>2% (ES -0.28)** than <=2% (ES -0.14, CI -0.27..0.00); attention, executive function and motor coordination most affected. | A (meta-analysis) | Wittbrodt MT, Millard-Stafford M 2018, Med Sci Sports Exerc. PMID 29933347 |
| H33 | Physical/mental performance impairment when losses exceed 2% body mass, dose-response, heat-dependent. | B | Millard-Stafford ML et al. 2025, Sports Med Health Sci. PMID 40936662 |
| H34 | Plasma osmolality: set-point 280-290 mOsm/kg, rarely varies beyond +/-2%. Mild hyperosmotic state 295-300; >300 frank. (= B1 in water.md.) | A | IOM 2005 (as H1); Liska 2019 |
| H35 | Osmotic **threshold for vasopressin release 290-295 mOsm/kg**, thirst is triggered mainly by serum osmolality; thirst "triggered with body water loss of 1-2%". Seen only in a Nordic scoping review (secondary, citing a clinical review). | **source pending** | Iversen PO, Fogelholm M 2023, PMC10710856 (cites Sterns / NEJM-type reviews, not opened) |
| H36 | Older adults: reduced thirst; many elders report no thirst although plasma osmolality is >300 mOsm/kg. | A (qualitative) | IOM 2005 (as H1), **recheck wording**; Iversen 2023 |
| H37 | TBW day-to-day varies within 0.5% under healthy regulation. | **source pending** | Iversen 2023 (secondary) |
| H38 | Mapping to ml for a 70 kg person: **1% = 700 g, 2% = 1400 g** (1 g water = 1 ml). Reference TBW 41.45 L from W1, so 2% BM = 1.4/41.45 = **3.4% of TBW**, consistent with the "~3% of TBW" of H30. | C | H30, W1 |
| H39 | Time to reach those deficits with **no intake at all**, resting, awake, 70 kg: loss = skin+lungs (H22) + obligatory urine floor 500/24 = 21 mL/h (H8). At 22 C: 37+21 = 58 mL/h, so 1% in 12 h and 2% in 24 h. At 35 C: 130+21 = 151 mL/h, 1% in 4.6 h, 2% in 9.3 h. Real life is different because food provides ~1.1 L/day (H12) and the kidneys do not stop at the floor immediately. | C | H22, H8, H12 |

---

## 4. Kidney handling of a water load (250 ml vs 1 L)

| ID | Claim | Level | Source |
|---|---|---|---|
| H40 | 1 L still water drunk over 30 min, euhydrated fasted men (n=72, after a standard pre-load): total urine over 4 h **1337 +/- 330 g** (=B6). | A (1 L) | Maughan RJ et al. 2016, Am J Clin Nutr. PMID 26702122 |
| H41 | Time course after 1 L water (n=28, men and women, same BHI protocol; fasted, 500 mL extra water the night before). **% of the 1 L still retained (negative = urine exceeded dose): 60 min +22.2 +/- 3.9; 90 min -1.8 +/- 25.9; 120 min -18.7 +/- 24.5; 180 min -36.3 +/- 3.7; 240 min about -48** (last value cut off in the text I read, check). Net fluid balance at 90 min -17.6 +/- 258.8 mL. | A/B (n=28, one lab) | Millard-Stafford M et al. 2025, Nutrients. PMID 41010440, PMC12472760, Table 4 and text |
| H42 | Converted to cumulative urine (our reading: retained % = (1000 - urine)/1000 x 100, which the 90 min net balance of -17.6 mL supports): **~780 mL by 60 min, ~1190 by 120, ~1360 by 180, ~1480 by 240**. | C (derived) | H41 arithmetic: urine = 1000 x (1 - retained/100) |
| H43 | Fit of H42 with a simple model, urine(t) = b t + D (1 - exp(-t/tau)), D = 1000 mL: **b = 120 mL/h and tau = 55 min** reproduce all four points (60 min: 120+664 = 784 vs 778; 120: 240+887 = 1127 vs 1187; 180: 360+962 = 1322 vs 1363; 240: 480+986 = 1466 vs 1480; max error 4%). b = 120 mL/h is high because subjects had pre-loaded water the evening before. | C | H42 |
| H44 | **Measured small dose:** 200 mL water after an overnight fast plus a small breakfast, n=10 (89.5 kg): urine **128 +/- 92, 128 +/- 100, 101 +/- 65 mL in hours 1, 2, 3 (357 mL in 3 h)**. Coffee with 269 mg caffeine (3 mg/kg) gave 316 mL (not different from water); 537 mg (6 mg/kg) gave 613 mL (p<0.05). | A/B (n=10) | Seal AD et al. 2017, Front Nutr. PMID 28868290, PMC5563313 |
| H45 | Baseline hourly urine of an undisturbed resting adult: free-living mean 1634 mL/day / 24 = **68 mL/h** (H10); fasting + pre-load subjects ~85-120 mL/h (H43); small-breakfast subject ~119 mL/h incl. the 200 mL (H44). So baseline ranges **~40-120 mL/h** depending on recent drinking. No measured no-drink control inside H44. | C | H10, H43, H44 |
| H46 | **Scaling from 1 L to 250 ml (our proposal):** (a) the whole dose is excreted eventually if the person is at or above set-point (H40: 4 h urine exceeded dose); (b) excess urine follows a first-order curve E(t) = D (1 - exp(-t/tau)); (c) tau is shorter for big doses (55 min for 1 L, H43) and longer for small ones. Check with H44, assuming baseline b = 60 mL/h (assumption) and D = 200: tau = 90 min gives cumulative 60 + 200 x 0.487 = 157 (obs 128), 120 + 200 x 0.736 = 267 (obs 256), 180 + 200 x 0.865 = 353 (obs 357). tau = 55 min would overshoot (193 at 1 h). Use **tau = 90 min for <=250 ml, interpolate to 55 min at 1 L**. For 250 ml: about 60% excreted by 90 min and 86% by 3 h on top of baseline. | C | H43, H44; the baseline 60 mL/h is not measured |
| H47 | Deficit case: if the person is dehydrated (B < 0), ADH keeps urine near the obligatory floor (~21 mL/h, H8) and the drink first fills the deficit. How fast urine falls with the deficit was not found in a read source. | ? | needs a study with serial urine after the same dose in euhydrated vs 1-2% hypohydrated adults |
| H48 | Absorption lag before water counts: 240 mL gastric T50 13 min (A1); absorption ta1/2 ~12 min, appearance in blood in 5 min, >99% by 75-90 min (A5). Our fit (H43, H46) lumps this into tau; for a small dose the gut delay is already inside the 90 min. | A (water.md) | A1, A5 |

---

## 5. Caffeine and sugar in drinks

| ID | Claim | Level | Source |
|---|---|---|---|
| H50 | 13 drinks, 1 L each, n=72 men: **cola, diet cola, hot tea, iced tea, coffee, lager, orange juice, sparkling water, sports drink did not differ from still water in 4 h urine.** ORS, full-fat milk and skimmed milk gave less urine (~1040-1050 g vs 1337; BHI 1.5-1.6). (= B6, M4.) | A (1 L, men) | Maughan 2016 (PMID 26702122) |
| H51 | Meta-analysis (16 studies, median caffeine dose **300 mg**): caffeine raises urine volume by **109 +/- 195 mL (16 +/- 19%)**; at rest ES 0.54 (0.22-0.85), in exercise 0.10 (n.s.); women more susceptible (ES 0.75) than men (0.13). | A (meta-analysis) | Zhang Y et al. 2015, J Sci Med Sport. PMID 25154702 |
| H52 | **Dose matters:** 269 mg caffeine in 200 mL coffee no diuresis vs water (316 vs 356 mL in 3 h); 537 mg +257 mL vs water (613 vs 356). | B (n=10) | Seal 2017 (PMID 28868290) |
| H53 | Energy drinks, 500 mL water + 500 mL drink: **280 mg caffeine** (no carbohydrate) BHI 0.86 +/- 0.16 at 240 min vs water 1.0; with electrolytes 0.91; with carbohydrate+electrolytes and only 106 mg caffeine **1.01**. Habitual caffeine intake (0-535 mg/day) had no effect on BHI (naive 0.92 vs habitual 0.93). | B (n=28) | Millard-Stafford 2025 (PMID 41010440) |
| H54 | 50 coffee-drinking men, 3 days, 4 x 200 mL coffee (4 mg/kg caffeine) vs water: **no differences in 24 h urine volume, total body water (D2O), body mass, haematological markers**; urinary Na higher with coffee. Conclusion: moderate habitual coffee hydrates like water. | A (n=50, men) | Killer 2014 (PMID 24416202) |
| H55 | **Doses of our drinks:** espresso 63 mg and cola 32 mg (from product files). For 70 kg: 0.9 mg/kg and 0.46 mg/kg, **4-8 times below** the 269 mg "no effect" dose of H52. | C | arithmetic: 63/70, 32/70; 269/63 = 4.3, 269/32 = 8.4 |
| H56 | **Upper bound of the caffeine effect on urine** by linear scaling of H51 (109 mL per 300 mg = 0.36 mL/mg): espresso **<= 23 mL**, cola **<= 12 mL** extra urine. Given H52 (no effect at 269 mg) the true value is probably ~0 and well inside the person-to-person noise (+/-195 mL in H51). Model: extra urine = 0 below 200 mg caffeine, otherwise 0.36 mL per mg above 200 mg (C, soft), but show the drink as "hydrates like water". | C | H51, H52, H55 |
| H57 | Sugar: cola and orange juice (1 L, with sugar) and a sports drink gave urine equal to water (H50), so at normal drink sugar levels no measurable extra diuresis. Sugar's role in retention is only shown for ORS/milk (sodium, energy, protein) which retained more. Nothing found for high-sugar drinks in small volumes or for glucosuria in healthy people. | B (1 L, men) | Maughan 2016 |
| H58 | Water content of a drink: assumed equal to its volume in ml (cola ~89% water, espresso ~98% in reality, not from a read source). Impact on net hydration: <=11 mL for 330 mL cola; ignore. | C (VERIFY) | assumption |

---

## Suggested model

All parameters tied to claim IDs. Units: ml (= g), min, kg. Reference person 175 cm, 70 kg.

### A. Loss rate per hour while awake and resting

```
BSA   = 0.007184 * height_cm^0.725 * mass_kg^0.425            (H14)
s(T)  = g/h/m2 skin+lung loss at air temperature T, 45% RH:     (H20, H22)
        T <= 22 : 20
        22..26  : 20 + (T-22)*1.5
        26..31  : 26 + (T-26)*1.0
        31..36  : 31 + (T-31)*9.8
        >36     : 80 + (T-36)*9.8   capped at 120 (extrapolation, level "?" above 36 C)
L_insens(T) = BSA * s(T)            ml/h (awake, resting)
```
Reference at 22 C: 37 ml/h = 0.53 ml/kg/h (H6). Sleep: multiply by **0.85-0.9** for the lung part (~50% of 22 C loss, H3/H4) so about **0.93** overall; this number is an assumption (H15, level ?). Show sleep as "lower", not a precise number.
Humidity: optional, applied to the lung part only and only as a note: at T >= 30 C and RH > 60% do **not** raise the estimate (sweat produced may not evaporate, but it is still lost from the body) (H26, level ?). Keep RH as display only until a source is found.
Size: loss scales with BSA, so a 91 kg and a 59 kg adult differ ~30% by the 2/3-power rule (H13). Women: no factor (H13 says similar per m2 in temperate/dry-hot; lower in hot-wet; level ?).
Older adults: the measured group was old (median 72); young adults probably sweat more at 31-36 C (H13). Expect our curve to be conservative at the top end.

### B. Other outflow

- Obligatory urine floor: **500 ml/day = 21 ml/h** (H8).
- Baseline urine when hydrated: **~68 ml/h (range 40-120)** (H10, H45). Use 68 as default.
- Faeces: 100-200 ml/day = ~6 ml/h (H8). Optional, can be folded into baseline.
- Metabolic water **+275 ml/day = +11 ml/h** (H7, H12).
- Food water: ~1.1 L/day in a measured sample (H12) or 20-30% of total intake by EFSA (N2, source pending). Needed only if the app is run as a full balance (see D).

### C. Urine response to a drink (dose D = drink volume, net of caffeine adjustment)

```
Absorb:   input to body-water pool, first order, ta1/2 = 12 min     (A5, H48)
Surplus:  B(t) is body-water balance relative to set-point (ml); a drink adds D to B
Urine:    u(t) = u_base * h(B) + max(0, B)/tau                       (H43, H46)
          u_base = 68 ml/h ; tau = 90 min for D <= 250, linearly to 55 min at D = 1000
          h(B)  = 1 for B >= 0, falling linearly to 21/68 = 0.31 at B = -0.5% mass   (H8; slope is a guess, H47 level ?)
Caffeine: extra urine = 0 if caffeine < 200 mg; else 0.36 ml/mg x (mg - 200) spread over 3 h   (H51, H52, H56)
Sugar:    none (H50, H57)
```
Worked example, 250 ml water to a hydrated person at t=0: excess urine on top of baseline = 250 x (1 - exp(-t/90)): 60 min 122 ml, 120 min 184 ml, 180 min 216 ml, 4 h ~ 233 ml (level C, H46). Net balance bump: +250 at drink, back to about +60 after 2 h, ~+20 after 4 h. Espresso 40 ml: +40 ml, +0 for caffeine (63 mg, H55). Cola 330 ml: +330 with the same curve, caffeine 32 mg and sugar add nothing measurable.
For a person already 1% down (B = -700 ml, 70 kg), the same glass first fills the deficit: B goes -700 -> -450 and urine stays near the floor (H47, level ?).

### D. Hydration indicator 0-100% (honest version)

Define body-water balance **B** (ml) relative to a comfortable set-point (the reference day: one that has enough drinks and food so that B stays about 0 at the default climate).

```
deficit = max(0, -B)
Hydration% = 100 * (1 - deficit / (0.02 * body_mass_g))        clipped to 0..100
  100%  : B >= 0 (at or above set-point; any surplus is shown as 100% and "will be excreted in ~hours", H46)
  50%   : deficit = 1% body mass (700 ml at 70 kg) = thirst zone begins (1-2%, H31, H35)
  0%    : deficit = 2% body mass (1400 ml at 70 kg) = clinical hypohydration, performance and cognition measurably worse (H30, H32, H33)
```
Two honest ways to define B in the app:
1. **Reference-day (recommended, simplest):** assume the user eats and drinks a typical 22 C day (EFSA/IOM AI, H1/N1), so B changes only by what is **different** from that: `dB/dt = drink_absorbed - (L_insens(T) - L_insens(22 C)) - (urine - u_base) ...` plus a note that the starting point is not measured. At 35 C awake this loses (130-37) = 93 ml/h more than at 22 C, 1% in 7.5 h without any extra drinking (C, from H22/H38).
2. **Full-log:** B starts at 0 on waking and the app counts only logged drinks plus a stated background food water (1.1 L/day = 46 ml/h, H12) + metabolic water (11 ml/h, H7); outflows as in A and B. Honest but needs the user to log every drink, otherwise indicator drifts to 0 (H39: 24 h at 22 C with no intake, 35 C: 9 h).
Label on screen: "model estimate, not a measurement; ranges from published studies; real thirst varies (H31)" and show 1-2% band as colored region. Do not display plasma osmolality as an individual value (H34) unless as a range.

---

## Open questions

- IOM and EFSA wording: open the IOM chapter by hand (H1-H3, H8, H25, H36) and the EFSA opinion (EFSA Journal 2010;8(3):1459) for the fluid share (N2) and for scope (moderate temperature, PAL 1.6). Neither could be read directly.
- Resting loss at 20 C and below, at 40 C, and at several humidities in young adults; the sedentary-heat study set (Meade) is old people at one humidity (H20, H26).
- Yamada 2022 supplement equations (water turnover vs temperature/humidity/body size): only the abstract was read.
- Sleep insensible loss factor (H15).
- Urine response in a mildly dehydrated person after 250 ml (H47) and for 250 ml in euhydrated people with timed collections (also water.md B7/B8): the tau = 90 min is fitted on n=10 with an assumed baseline (H46).
- Last value of H41 (240 min) and exact definition of "% retained" in Millard-Stafford 2025 (we inferred net balance = intake - urine).
- Plasma osmolality threshold for thirst from a primary physiology paper (H35, M2).
- Whether to apply sex and age factors for sweat (H13); sweat curve may be too low for young adults above 31 C.
- Wang 2026 intake vs loss mismatch (1.1 L, H12) suggests incomplete urine collection; do not use its absolute levels for calibration.
