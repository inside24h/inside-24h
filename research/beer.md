# Beer (regular lager, 0.5 L, ~5% ABV) — research dossier

Status: **draft v1, INCOMPLETE** · last updated 2026-10-08
Rule: see upute.md §2. Levels: **A** established · **B** supported, variable · **C** our estimate (math shown) · **?** unknown.
Abstracts were read through `tools/epmc.py abs`. Full texts through `tools/epmc.py grep` (open access only; non-OA PMC IDs return HTTP 500). Web pages were read through WebFetch / WebSearch.

**Why incomplete:** the research session hit a usage limit and the USDA API returned HTTP 429 (DEMO_KEY rate limit) on every attempt. Items marked **VERIFY** were seen only in a search snippet, a secondary citation, or are standard textbook values not yet opened in a primary source. Items marked **?** were not researched. They must be finished before the product is "Ready".

**Health note (app wording):** this dossier describes physiology. It does not encourage drinking. Alcohol is not recommended in pregnancy (see X1).

---

## Product and ethanol math

| ID | Claim | Level | Source |
|---|---|---|---|
| P1 | Regular beer, per 100 g edible portion: **ethanol 3.96 g, 176 kJ (42 kcal), protein 0.5 g, fat 0, water 92.4 g**. (A "stout" is 6.15 g ethanol, 67 kcal; low-alcohol beer 3.50 g?; the table in the open-access text is truncated at the carbohydrate row.) | B (one paper's table; origin database not named in the text I could read) | Jiménez-Pavón D et al. 2015, J Int Soc Sports Nutr. PMID 26056515 (PMC4459073), Table 1, via `epmc.py grep` |
| P1b | USDA FoodData Central SR Legacy "Alcoholic beverage, beer, regular, all" (FDC 168746): carbohydrate, sugars, sodium, potassium, B-vitamins. **Not retrieved** (API 429). | **VERIFY** | USDA FDC 168746 (ID from memory, check) |
| P2 | Typical regular beer is **4–4.5% ABV** according to the authors. A "regular beer" in that paper has 3.96 g ethanol/100 g. | B | PMC4459073 |
| P3 | **Ethanol math (ours).** 500 ml × 0.05 = **25 ml** ethanol. Density of ethanol ≈ 0.789 g/ml → 25 × 0.789 = **19.7 g**. Check against P1: 3.96 g/100 g × ~500 g ≈ 19.8 g (beer density ≈ 1.0, so 500 ml ≈ 500 g). Both agree. | C (density value from memory, **VERIFY**) | arithmetic; P1 |
| P3b | The brief's figure 19.7 g is **1.4 US standard drinks**: NIAAA defines one US standard drink as **14 g** pure alcohol = 12 oz of 5% beer. 19.7/14 = **1.41**. | A (14 g definition) · C (ratio) | NIAAA "What is a standard drink" (search result summary, niaaa.nih.gov/alcohols-effects-health/what-standard-drink; page itself returned 404 on direct fetch → **VERIFY**) |
| P4 | Energy of the ethanol: 19.7 g × 7 kcal/g ≈ **138 kcal**. Whole beer by P1: 42 kcal/100 g × 5 ≈ **210 kcal** per 0.5 L, so ≈ 70 kcal are non-ethanol (carbs, protein). | C (7 kcal/g Atwater factor from memory, **VERIFY**) | P1, P3 |
| P5 | Purines (relevant for uric acid / gout), sugar content (maltose), caffeine (none expected). | **?** | Not researched. Needs USDA/literature on purine content of beer and acute serum uric acid. |

App note: default dose 19.7 g ethanol (0.5 L × 5%), slider for ABV 0.5–8% and volume.

## Stomach and absorption

| ID | Claim | Level | Source |
|---|---|---|---|
| A1 | Ethanol absorption is faster on an empty stomach and slower after food, because gastric emptying is slower with food in the stomach. Delivery to duodenum and liver becomes variable. | A | Jones AW et al. 1997, Br J Clin Pharmacol. PMID 9431825 (PMC2042884, abstract); Kechagias S et al. 1999, PMID 10594475 (PMC2014355, abstract) |
| A2 | Speeding gastric emptying with cisapride raised Cmax from **3.8 ± 1.7 to 5.6 ± 2.3 mmol/l** (fed, 0.30 g/kg, n=10). Curves converged at about 2 h. Fasted Cmax was higher still (**9.5 ± 1.7 mmol/l**). | B | Kechagias 1999, PMID 10594475 |
| A3 | Women after gastric bypass absorbed ethanol faster (tmax **10 vs 30 min**) and peaked higher (**0.741 vs 0.577 g/l**) than matched controls. Shows that the pace of delivery from stomach to small intestine sets the peak. The 0.577 g/l control value is a normal-gut fasted woman, 0.30 g/kg, bolus finished in 5 min. | B | Klockhoff H et al. 2002, Br J Clin Pharmacol. PMID 12492605 (PMC1874483, abstract) |
| A4 | **Stomach vs small intestine split of absorption.** Standard teaching: a minor share through the stomach wall, most through the duodenum and jejunum. | **? / VERIFY** | No primary source read. A4 is consistent with A1–A3 (gastric emptying controls the peak) but the percentages are not sourced. |
| A5 | Carbonation and drink concentration effects on ethanol absorption (beer ≈ 5% is a dilute, carbonated drink). | **?** | Not researched. |

## Gastric first-pass metabolism and sex

| ID | Claim | Level | Source |
|---|---|---|---|
| F1 | ADH1C, ADH3 and ADH4 are expressed in the human stomach and "may contribute to ethanol oxidation with quantitative significance". Gastric first-pass can influence bioavailability. | B (review statement) | PMC3525274 review (title/authors not captured; WebFetch summary) → **VERIFY** |
| F2 | Baraona et al. are cited as reporting that sex differences in BAC may be associated with sex differences in gastric ADH3 (χ-ADH) activity. Secondary citation only. | B · **source pending** (secondary) | Haseba T 2025, Int J Mol Sci review, PMC12525187 (citing Baraona) |
| F3 | The size of first-pass loss at ~20 g of beer, and whether it is physiologically important, is disputed. Jones 1997 argued that with food, part of the dose is cleared by **hepatic** first-pass because Michaelis-Menten kinetics apply at low portal concentrations. | B | Jones 1997, PMID 9431825 |
| F4 | Numbers (e.g. ~10–20% fasted first-pass in men, less in women) | **?** | Not read from any source; do **not** ship. |

## Distribution (Widmark)

| ID | Claim | Level | Source |
|---|---|---|---|
| W1 | Widmark: c = A / (p · r), c blood alcohol (g/kg), A grams ethanol, p body weight (kg), r factor = ratio of whole-body to blood ethanol concentration, "commonly chosen as **0.7 for men and 0.6 for women**". | B (secondary citation) | Reiter GS et al. 2020, PMC7518982 (full text, `grep`) |
| W2 | Ethanol is hydrophilic and distributes in water-containing compartments. Higher total body water (TBW) goes with lower BAC and lower subjective response; BMI effect on response is explained by TBW. | A | Reiter 2020 (PMC7518982); Vergeer RR et al. 2025, J Stud Alcohol Drugs. PMID 39812388 (abstract) |
| W3 | Total body water (Watson): men 2.447 − 0.09516·age + 0.1074·height + 0.3362·weight; women −2.097 + 0.1069·height + 0.2466·weight (L, y, cm, kg). | A | espresso.md W1 (Watson PE 1980, PMID 6986753) |
| W4 | Online BAC calculators overestimate: mean values exceeded measured reference concentrations by **39–49%** (16 volunteers, fasted and fed). A simple Widmark model therefore needs the empirical correction in H1. | A | Stragierowicz J et al. 2026, PMID 42478675 (abstract) |
| W5 | Whole-blood-to-TBW-based r (≈ ethanol conc. in TBW × 0.8 water content of blood) and the exact value of r from Watson/Forrest/Seidl. | **? / VERIFY** | Not read in a primary source. |

## BAC time course after ~20 g

Dose in the studies below is **0.30 g/kg** (≈ 21 g at 70 kg), which is within 7% of our beer (19.7/70 = 0.28 g/kg).

| ID | Claim | Level | Source |
|---|---|---|---|
| H1 | Fasted men, 0.30 g/kg: **peak 30.8 ± 4.3 mg/dl** (0.31 g/l). After fat, carbohydrate, protein-rich breakfast: **16.6 ± 4.0, 17.7 ± 7.1, 13.3 ± 4.0 mg/dl**. IV infusion over 30 min: 54.3 ± 6.4. AUC: fasted 3210, meals 1270–1767, IV 4786 mg/dl·min. **Time to eliminate ethanol shortened by 1–2 h when fed.** Profiles in the fed state varied a lot between and within people. (Drink was ~20% v/v ethanol cocktail, finished in ≤ 15 min.) | A (n=9 men, crossover) | Jones 1997, PMID 9431825 |
| H2 | Second dataset, 0.30 g/kg, 10 men: fasted **Cmax 9.5 ± 1.7 mmol/l = 43.8 mg/dl**; 1 h after breakfast **3.8 ± 1.7 mmol/l = 17.5 mg/dl**. Conversion: 9.5 × 46.07 g/mol = 437.7 mg/l. | B (n=10) · C (unit conversion) | Kechagias 1999, PMID 10594475 |
| H3 | Fasted women, 0.30 g/kg bolus in 5 min: **Cmax 0.577 ± 0.112 g/l, median tmax 30 min** (controls). | B (n=12) | Klockhoff 2002, PMID 12492605 |
| H4 | Peak range for our model: fasted men **≈ 0.31–0.44 g/l** (H1, H2), fasted women **≈ 0.58 g/l** (H3), fed **≈ 0.13–0.18 g/l** (H1, H2). tmax fasted **≈ 30 min** (H3; other times not read). Sources used a concentrated cocktail in ≤ 15 min. A 0.5 L beer sipped over 30–60 min gives a **lower and later** peak (C, direction only). | B · C | H1–H3 |
| H5 | **Pure-Widmark cross-check (ours), ignoring elimination during absorption:** man 70 kg, r = 0.7: 19.7 / (70 × 0.7) = **0.40 g/kg**. Woman 60 kg, r = 0.6: 19.7 / (60 × 0.6) = **0.55 g/kg**. Measured fasted peaks (H1) are ≈ 30.8/(0.30/0.7 × 1000/…) — i.e. 0.31 vs Widmark 0.43 g/l for 0.30 g/kg — about **0.72×** the Widmark value, because ethanol is already being eliminated while absorbing. | C | W1, H1 |
| H6 | **Our default peak for 19.7 g:** fasted 70 kg man ≈ 0.40 × 0.72 ≈ **0.29 g/l**, range 0.25–0.40; fasted 60 kg woman ≈ 0.55 × 0.72 ≈ **0.40 g/l** (H3 scaled: 0.577 × 0.328/0.30 ≈ 0.63 g/l for a 5-min bolus; a slow beer lowers it); fed ≈ **0.12–0.17 g/l**. | C | H1–H5 |
| H7 | Time to zero BAC (ours): peak ≈ 0.30–0.40 g/l ÷ 0.15 g/l/h ≈ **2–3 h** plus the absorption time, fasted man; ≈ 1–2 h shorter when fed (H1). Slower for women and low body-water people. | C | H1, M1 |
| H8 | Between-person variation dominates all pharmacokinetic parameters except the elimination rate; elimination varies 42% between and **58% within** people (12 men, 4 occasions, 0.80 g/kg). | A | Jones AW, Jönsson KA 1994, Br J Clin Pharmacol. PMID 8054248 (abstract) |

## Liver metabolism and elimination

| ID | Claim | Level | Source |
|---|---|---|---|
| M1 | Elimination is mainly oxidative in the liver by class I ADH. The Km of class I ADH is at BAC **2–10 mg/100 ml**, so the enzyme is saturated after the first drinks and **zero-order kinetics** describes the declining phase when BAC > 20 mg/100 ml. | A | Jones AW 2010, Forensic Sci Int. PMID 20304569 (abstract) |
| M2 | **Rate:** fasted **10–15 mg/100 ml/h**; non-fasted **15–20 mg/100 ml/h**; alcoholics in detox **25–35**; physiological range **10–35**; population average for moderate drinkers **15**; apprehended drivers **19**. Slope is slightly steeper in women, linked to liver weight relative to lean mass. | A | Jones 2010, PMID 20304569 |
| M2b | In an IV-clamp study of 66 young adult moderate-to-heavy drinkers, males had a higher elimination rate than females (p < 0.001). Two weeks of abstinence did not consistently change it. | A | Etkins J et al. 2026, Alcohol. PMID 42456997 (abstract) |
| M3 | Elimination in g/h (ours): 0.15 g/l/h × (r × weight) = 0.15 × (0.7 × 70) ≈ **7.4 g/h**; so 19.7 g needs ≈ **2.7 h** of clearance after all is absorbed. With 10–20 mg/100 ml/h → 5–10 g/h (C). | C | M2, W1 |
| M4 | Pathway: ADH oxidises ethanol to **acetaldehyde** ("highly toxic, known carcinogen"), ALDH converts it to acetate → water + CO₂. **CYP2E1 is active only after large amounts of alcohol**; catalase handles only a small fraction. Acetaldehyde is short-lived. | A | NIAAA "Alcohol Metabolism" (niaaa.nih.gov/publications/alcohol-metabolism, WebFetch summary) |
| M5 | Class I ADH Km for ethanol ~1 mM, Vmax around ~15 mM (1 mM ≈ 4.6 mg/dl). | B (review) | Haseba 2025, PMC12525187 |
| M6 | **ALDH2*2 (East Asian variant):** homozygous *2/*2 carriers have peak blood acetaldehyde **1.6–3.3×** higher than *1/*2 heterozygotes after low-to-moderate ethanol, with near-complete protection against alcoholism through unpleasant reactions. ADH1B*2 carriers show higher elimination rate. | B (review statement) | PMC3525274 review → **VERIFY title / authors**; also Liu ME et al. 2026, PMC13419686 (ALDH2 rs671 and ADH1B rs1229984, not read in detail) |
| M7 | Acetaldehyde peak concentrations after one beer in the general population (µM), flushing prevalence. | **?** | Not read. |

## Effects on brain and performance at these BAC levels

| ID | Claim | Level | Source |
|---|---|---|---|
| E1 | 24 healthy volunteers, BAC 0.2, 0.5, 0.8 g/l: **Divided Attention Test impaired already at 0.2 g/l**; Psychomotor Vigilance Test (mean reaction time) and postural balance impaired at **0.5 and 0.8 g/l**. Largest effects: balance with eyes open and mean reaction time. | A | Jongen S et al. 2014, Psychopharmacology. PMID 24408210 |
| E2 | Our beer: fasted peak ≈ 0.3–0.4 g/l (H6) is in the range where divided attention is already impaired and approaches the 0.5 g/l level of E1 in smaller or female drinkers. Fed peak ≈ 0.15 g/l is below the lowest dose tested. | C | E1, H6 |
| E3 | Brain-region effects (GABA-A, NMDA, dopamine) at 0.3 g/l, subjective stimulation vs sedation on rising vs falling limb. | **?** | Not researched. |

## Diuresis and hydration

| ID | Claim | Level | Source |
|---|---|---|---|
| U1 | **1 L of lager** (n=72 men, euhydrated, fasted, drunk in 30 min) produced **no more urine over 4 h than 1 L still water** (water 1337 ± 330 g). Only ORS and milks reduced urine output. The abstract does not give the lager's ABV (**VERIFY**: likely ~4%). | A (for that lager) | Maughan RJ et al. 2016, AJCN. PMID 26702122 (abstract) |
| U2 | Moderate dose (~48 g ethanol in 750 ml squash over 70 min): urine production **rose initially, then fell** (p < 0.001); total cumulative urine did not differ from control (p = 0.331). HR was 7% higher during exercise. | B (n=8 men) | Marley A et al. 2024, Alcohol Alcohol. PMID 37981293 (abstract) |
| U3 | After a dehydrating run (−2.4% body mass), up to **660 ml regular beer** (3.96 g ethanol/100 g) followed by water: fluid balance and urine excretion **did not differ** from water only (n=16 men). | B | Jiménez-Pavón 2015, PMID 26056515 |
| U4 | **Vasopressin suppression** as mechanism of ethanol diuresis; urine volume per gram of ethanol. | **? / VERIFY** | No primary source read. Mechanism is widely taught; U1–U3 say net effect at ~20 g in beer is small. |
| U5 | Hangover and dehydration: whether hangover severity is explained by dehydration. | **?** | Not researched. Needs Verster/Penning reviews. |

## Heart rate and blood pressure

| ID | Claim | Level | Source |
|---|---|---|---|
| V1 | Cochrane review, 32 RCTs, 767 people (mostly healthy men, mean 33 y): **Low dose (< 14 g)** within 6 h: BP unchanged, **HR +5.1 bpm** (95% CI 1.9–8.2). **Medium dose (14–28 g)** within 6 h: **SBP −5.6 mmHg** (−8.3 to −3.0), **DBP −4.0** (−6.0 to −2.0), **HR +4.6 bpm** (3.1–6.1). Medium dose at 7–12 h and > 13 h: no effect. Our 19.7 g is in the medium bin. | A | Tasnim S et al. 2020, Cochrane. PMID 32609894 |
| V2 | High dose (> 30 g): SBP −3.5, HR +5.8 within 6 h; BP **rises** (SBP +3.7, DBP +2.4, HR +2.7) > 13 h later. Only small numbers of women. | A | Tasnim 2020 |
| V3 | Overnight: pre-sleep alcohol raised nocturnal HR, reduced vagal HRV and baroreflex sensitivity, increased sympathetic activity. Doses led to bedtime breath alcohol ≈ 0.02% (1 drink women / 2 men) and ≈ 0.05% (3 / 4). | A (n=26) | de Zambotti M et al. 2021, Sleep. PMID 32663278 (abstract) |

## Sleep

| ID | Claim | Level | Source |
|---|---|---|---|
| S1 | In healthy volunteers, at **all** doses alcohol shortens sleep onset latency, gives more consolidated first-half sleep and **more disruption in the second half**. Low and moderate doses: no clear trend for REM in the first half. Total-night REM % is **decreased at moderate and high doses** (no clear trend at low). **Onset of first REM is delayed at all doses.** Slow-wave sleep in the first half increased. | A | Ebrahim IO et al. 2013, Alcohol Clin Exp Res. PMID 23347102 (review abstract) |
| S2 | 2015–2025 evidence: lower latency but disrupted architecture, suppressed REM, more fragmentation, worse breathing in the second half. Alcohol "should not be considered a sleep aid". Earlier drinking may reduce some harm. | A | Chaput JP 2026, Nutrients. PMID 41754102 (abstract) |
| S3 | High dose (1.0 g/kg men, 0.85 g/kg women) lowered total sleep time and sleep efficiency and caused tachycardia; effects on next-morning mood and performance were modest. | B (n=31) | Pabon E et al. 2022, Alcohol Clin Exp Res. PMID 35953878 |

## Blood glucose

| ID | Claim | Level | Source |
|---|---|---|---|
| G1 | Acute alcohol in the **fasted state** reduced plasma glucose in women before and after metabolic surgery ("alcohol-induced reductions in glucose"); GLP-1 fell and FGF21 rose sharply. Size of the drop not in abstract. | B (n=7) | Molina-Castro M et al. 2025, Front Pharmacol. PMID 40474966 (abstract) |
| G2 | 48 g ethanol + prolonged cycling: blood glucose **not different** from control. | B (n=8) | Marley 2024, PMID 37981293 |
| G3 | Healthy-adult glucose response to ~20 g ethanol in beer (carbohydrate ~ 3–4 g/100 ml adds a small glucose rise); whether the fed state protects from lowering. | **?** | Not researched. Needs a primary RCT; do not ship a number. |

## Legal limits (context)

| ID | Claim | Level | Source |
|---|---|---|---|
| L1 | EU: most member states use 0.5 g/L; US 0.08%. | **? / source pending** | Stated from general knowledge in the brief; official EU Commission / NHTSA pages not opened. |
| L2 | Compare with H6: a fasted 70 kg man's estimated peak (≈ 0.3 g/l) after one 0.5 L beer is below 0.5 g/l; a lighter or female drinker on an empty stomach can reach ≈ 0.4–0.6 g/l (H3, W4 caution). Impairment starts below the legal limit (E1). | C | H6, E1 |

## Pregnancy and public health (x-ref)

| ID | Claim | Level | Source |
|---|---|---|---|
| X1 | WHO Europe 2026 fact sheet on alcohol in pregnancy / FASD (as summarised in search results): "**no known safe amount, type or timing** of alcohol use during pregnancy"; alcohol crosses the placenta; harm can occur before pregnancy is recognised (60% do not recognise it until week 6–7). | A · **source pending** (snippet only; PDF at epicentro.iss.it/alcol_fetale/pdf/WHO-EURO-2026-10632-50404-83131-eng.pdf not opened) | WHO Regional Office for Europe 2026 |
| X2 | WHO global alcohol fact sheet (no safe level, Group 1 carcinogen). | **?** | who.int fact sheet fetch failed (usage limit). |
| X3 | EFSA position on alcohol in pregnancy. | **?** | Not found. EFSA has no dedicated opinion that I located; do not cite EFSA until one is found. |
| X4 | App wording: "Alcohol is not recommended in pregnancy. No safe level has been established (WHO Europe)." | C (wording) | X1 |

---

## Myth check

| Myth | Verdict | Evidence |
|---|---|---|
| "Beer before liquor, never felt sicker" (order of drinks) | **Not researched.** The BAC curve depends on dose, drink concentration, food and gastric emptying (A1–A3, H1). Nothing read tests drink order. | ? |
| "Coffee sobers you up" | **Not researched.** Elimination is zero-order liver metabolism at 10–35 mg/100 ml/h (M1–M2), which no beverage speeds up in the sources read. Caffeine counteracts sleepiness, not BAC; no study read on whether it restores performance. | M1, M2; ? |
| "Sweating it out / a cold shower / exercise" | **Not researched.** Elimination is by the liver (M1). No data read on sweat/breath excretion fractions. | ? |
| "Beer dehydrates you" | **Largely false at this dose in healthy men.** 1 L of lager gave the same 4 h urine as water; up to 660 ml of beer did not change fluid balance after exercise. A short early rise in urine rate with more alcohol (≈ 48 g) is offset later. Evidence is mostly in young men. | U1–U3 |
| "A full stomach stops alcohol" | **Partly true.** Food halves the BAC peak (≈ 31 → 13–18 mg/dl) and shortens the clearance by 1–2 h, but alcohol is still absorbed and has to be cleared. | H1, H2 |
| "Alcohol helps you sleep" | **False beyond falling asleep faster.** Second-half disruption, delayed and reduced REM, higher nocturnal HR. | S1–S3, V3 |
| "Alcohol lowers blood pressure, so it is good for the heart" | **Misleading.** A 14–28 g dose lowers BP ≈ 4–6 mmHg for a few hours with +5 bpm HR; high doses raise BP the next day. This is not a health benefit claim. | V1, V2 |

---

## Model parameters (default healthy adult, 70 kg man, 19.7 g ethanol in 0.5 L over ≈ 30 min)

Widmark-based one-compartment model with zero-order elimination and first-order absorption from gut:

`C(t) = [A_abs(t) / (r · W)] − β · t` for C > 0 (g/l), with A_abs rising to 19.7 g.

| Parameter | Value | Range | Basis |
|---|---|---|---|
| Ethanol dose A | **19.7 g** (500 ml × 5% × 0.789 g/ml) | 4–40 g (ABV, volume) | P1, P3 |
| Energy | ≈ 210 kcal total, 138 kcal from ethanol | — | P1, P4 |
| Widmark r | **0.7 men, 0.6 women** (or TBW-based: Watson TBW ÷ weight × 0.8 **VERIFY**) | 0.6–0.8 **VERIFY** | W1–W3, W5 |
| Body weight W | 70 kg (men), 60 kg (women) | — | default |
| Absorption (fasted) | tmax ≈ 30 min from the end of drinking; first-order ka chosen so the model peak is at 30–45 min | 10–60 min | H3 (A3) (C: fitted) |
| Absorption (fed) | slow gastric emptying; absorption spread over 1–2 h; peak lowered to **≈ 45–55%** of fasted (13–18 vs 31 mg/dl; 17.5 vs 43.8) | 40–60% | H1, H2 (C) |
| Peak-reduction factor vs Widmark | **0.72** fasted (elimination during absorption plus incomplete absorption) | 0.6–0.9 | H5 (C) |
| Elimination β (zero order) | **15 mg/100 ml/h = 0.15 g/l/h** ≈ 7.4 g/h for 70 kg man | fasted 10–15, fed 15–20, extremes 10–35 | M2, M3 |
| Elimination, women | slightly steeper slope (higher per-kg liver mass) but higher peak from lower r | — | M2, M2b |
| Michaelis-Menten switch | below ≈ 2–10 mg/100 ml elimination becomes first-order (Km) | — | M1 |
| Peak BAC, fasted man | **≈ 0.29 g/l** (~30 mg/100 ml) | 0.25–0.40 | H1, H2, H6 |
| Peak BAC, fasted 60 kg woman | **≈ 0.40 g/l** | 0.35–0.63 | H3, H5 (C) |
| Peak BAC, fed | **≈ 0.15 g/l** | 0.12–0.18 | H1, H2 |
| Time to zero BAC (fasted man) | **≈ 3–4 h after start** | 2–5 h | H7 |
| Acetaldehyde | low and short-lived in ALDH2*1/*1; ALDH2*2/*2 carriers 1.6–3.3× higher peak vs heterozygotes | — | M4, M6 |
| Diuresis | no net urine excess over water over 4 h at this volume | — | U1–U3 |
| HR | **+4.6 to +5.1 bpm** within 6 h | CI 1.9–8.2 | V1 |
| BP | SBP −5.6 / DBP −4.0 mmHg within 6 h (14–28 g) | CI −8.3 to −3.0 / −6.0 to −2.0 | V1 |
| Sleep | latency shorter; first-REM delayed; second half fragmented; nocturnal HR up | — | S1–S3, V3 |
| Performance | divided attention impaired at 0.2 g/l; RT and balance at 0.5 g/l | — | E1 |

Animation note: stomach empties slower when fed; liver bar shows constant zero-order throughput (about 7 g/h) so the BAC curve falls in a straight line; kidneys show no extra water loss versus drinking water; heart rate +5 bpm, small BP dip; sleep panel at night with second-half fragmentation.

## Open questions (to research next)
- USDA FDC 168746 (carbohydrate, sugars, sodium, K, Mg, niacin per 100 g) and purine content; the carbohydrate row of Jiménez-Pavón Table 1 was cut off.
- Primary source for the ethanol density (0.789 g/ml) and the 7 kcal/g Atwater factor.
- Fraction of ethanol absorbed in the stomach vs small intestine; first-pass percentages by sex (Frezza 1990, Baraona 2001, Mumenthaler 1999 not found in Europe PMC search).
- Widmark r values (Watson, Forrest, Seidl) from primary papers; TBW-based r.
- Beer-specific BAC curves (5% ABV, 0.5 L, sipped) in fasted vs fed adults. All peaks above come from 0.30 g/kg in concentrated cocktails.
- Vasopressin suppression and urine volume per g ethanol; hangover vs dehydration evidence.
- Glucose response to one beer in healthy adults, with and without food.
- Brain effects (fMRI/EEG) at BAC 0.2–0.4 g/l.
- WHO global fact sheet, WHO Europe PDF (X1), EFSA position (X3); EU Commission / NHTSA driving limits (L1).
- Myths: drink order, coffee, sweating, cold showers.
- ALDH2*2 prevalence and acetaldehyde levels after one beer; read PMC3525274 title/authors and Liu 2026 (PMC13419686).
