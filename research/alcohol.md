# Alcohol (beer 0.5 L 5% and wine 150 ml 12%) — research dossier

Status: **draft v1, complements beer.md (do not duplicate; IDs below prefixed to avoid clashes)** · 2026-10-08
Rules: upute.md §2. Levels: **A** established · **B** supported, variable · **C** our estimate (math shown) · **?** not researched.
Type tags in the claim text: **[causal]** = trial / physiology / mechanism; **[assoc.]** = observational association (cohort meta-analysis), not proof of cause.
How sources were read: abstracts and open-access full text via Europe PMC (`epmc.py abs` / `grep`, plus the Europe PMC REST API for abstracts); web pages via WebFetch. Items marked **source pending** were seen only in a search-result summary or a secondary citation.
**USDA FoodData Central: still not available.** DEMO_KEY returned HTTP 429 with `Retry-After: 42335` (about 11.8 h) on 2026-10-08, so kcal/carbohydrate for wine remain unfetched (see P4, Open questions).
**App wording:** physiology, not encouragement to drink. No safe level (WHO); not in pregnancy.

Cross-reference: beer.md IDs used here as "beer.md H1" etc. (BAC after 0.30 g/kg, elimination M1–M2, sleep S1–S3, HR/BP V1–V3, diuresis U1–U3, glucose G1–G2, E1 divided attention).

---

## 1. Product and ethanol math

| ID | Claim | Level | Source |
|---|---|---|---|
| P1 | Density of ethanol = **0.7893 g/cm³ at 20 °C** (CRC Handbook, 95th ed., as listed by PubChem). Searle also uses "d = density of alcohol = 0.789 g/ml" in the grams-from-drink formula m = v·z·a·d (v volume ml, z ABV/100, a fraction absorbed). | A | PubChem ethanol, Density section (fetched via pug_view, CID 702): https://pubchem.ncbi.nlm.nih.gov/compound/702 ; Searle J. 2015, Med Sci Law, PMID 24644224 (PMC4361698, full text) |
| P2 | **Beer 0.5 L, 5%:** 500 ml × 0.05 = 25 ml ethanol; 25 × 0.789 = **19.7 g** (19.725). | C (arithmetic from P1) | P1 |
| P3 | **Wine 150 ml, 12%:** 150 × 0.12 = 18 ml; 18 × 0.789 = **14.2 g** (14.202). | C | P1 |
| P3b | NIAAA US standard drink = **14 g** pure alcohol = 12 oz beer 5% or 5 oz wine 12%. So beer 19.7/14 = **1.41** US drinks; wine 14.2/14 = **1.01** US drinks. Note: our wine glass equals one US standard drink; our beer is 1.4. (Studies on hypertension/liver below use 12 g/drink, GBD uses 10 g, see L-rows.) | A (definition) · C (ratio) | NIAAA "What is a standard drink?" — niaaa.nih.gov/alcohols-effects-health/what-standard-drink (page text seen in search-result summary; direct fetch gave 404 → **source pending** for wording, the 14 g figure is consistent with 12 oz × 5% = 355 ml × 0.05 × 0.789 = 14.0 g, C) |
| P4 | Energy of ethanol: Atwater general factor **29 kJ/g (7.0 kcal/g, unrounded 6.9)**. Ethanol energy: beer 19.7 × 7 = **138 kcal**; wine 14.2 × 7 = **99 kcal**. | A (factor) · C (product) | FAO, Food energy – methods of analysis and conversion factors (2003), https://www.fao.org/4/Y5022E/y5022e04.htm |
| P5 | Whole beer: 42 kcal/100 g (176 kJ), ethanol 3.96 g/100 g → ≈ 210 kcal per 0.5 L (beer.md P1/P4). **Wine total kcal and carbohydrate: not retrieved (USDA 429)**. Only the ethanol part (99 kcal) is sourced; residual sugar of wine varies widely and is unknown here. | B (beer) · **?** (wine) | beer.md P1 (Jiménez-Pavón 2015, PMID 26056515) |
| P6 | Do not assume purines, sugar content, gluten etc. | **?** | not researched (beer.md P5) |

Check: beer 3.96 g/100 g × 500 g ≈ 19.8 g, agrees with P2 (beer.md P3).

---

## 2. Absorption, food and first-pass

| ID | Claim | Level | Source |
|---|---|---|---|
| A1 | Fasted, 15 healthy men (25–65 y), **0.5 g ethanol/kg** in 20 min: peak BAC **beer 5.1%: 50.3 ± 9.8 mg/dl; white wine 12.5%: 61.7 ± 10.8 mg/dl; vodka-tonic 20%: 77.4 ± 17.0 mg/dl**. Time to peak **beer 62 ± 23 min, wine 54 ± 14 min, vodka 36 ± 10 min**. Relative bioavailability (AUC) lower after beer. Concentration of the drink, not only calories, set the rate. [causal, crossover] | A (n=15, men only) | Mitchell MC et al. 2014, Alcohol Clin Exp Res. PMID 24655007 (PMC4112772) |
| A2 | Food slows gastric emptying and lowers/delays the peak; solid meals delay more than liquid ones; fasted absorption is faster. Fed: peak ≈ 13–18 mg/dl vs 31 fasted at 0.30 g/kg; clearance 1–2 h shorter when fed. | A | beer.md A1–A3, H1–H2 (Jones 1997, PMID 9431825; Kechagias 1999, PMID 10594475); solid vs liquid meal statement: Mitchell 2014 introduction, citing Horowitz 1989 (secondary → B) |
| A3 | Speed of gastric emptying controls first-pass: in 16 volunteers (8 men, 8 women) at 0.225 g/kg, delayed emptying (N-butylscopolamine) significantly **increased** first-pass metabolism, faster emptying (metoclopramide) decreased it. Correlation gastric-emptying time vs FPM r = 0.43, p = 0.04. Gastric ADH activity did **not** significantly correlate with FPM in this study. [causal] | A (n=16; 7 in the drug arms) | Oneta CM et al. 1998, Gut. PMID 9824340 (PMC1727307) |
| A4 | **Sex:** in 20 men / 23 women (6 alcoholics per group), 0.3 g/kg oral vs IV: in non-alcoholic subjects **first-pass metabolism in women was 23% and gastric ADH activity 59% of men's**; correlation between the two r_s = 0.659. Authors: lower gastric oxidation increases bioavailability and may contribute to higher BAC in women. | A (n=43, 1990 study; later studies, e.g. A3, found weaker links with gastric ADH) | Frezza M et al. 1990, N Engl J Med. PMID 2248624 |
| A5 | Women reach higher BAC than men at the same dose per kg, partly due to lower total body water. Men and women eliminate about the same amount per kg body weight per hour; per kg lean mass women eliminate more. Menstrual cycle unlikely to alter pharmacokinetics. (Review.) | B (review) | Mumenthaler MS et al. 1999, Alcohol Res Health. PMID 10890798 (PMC6761697) |
| A6 | **Stomach vs small intestine split:** "about 20% stomach, 80% small intestine" appears in educational summaries only; no primary source read. Qualitatively: small intestine has far larger surface area, gastric emptying sets the pace (A2, A3). | **? / source pending** (do not ship the percentages) | search-result summaries only |
| A7 | Carbonation effect on absorption (beer, sparkling wine). | **?** | not researched |
| A8 | Presystemic metabolism: men with lower self-rated effects of alcohol had higher BAC during the first 2 h (p = 0.015) with no difference in elimination rate; authors interpret as presystemic (first-pass) differences. | B (n=20 men) | Bramness JG et al. 2023, Alcohol Alcohol. PMID 36715301 (PMC10008105) |
| A9 | **Full text re-read 2026-10-16** (epmc.py grep): subjects 15 men, mean **82.66 kg** (68.6–96.4), BMI **26.35** (21.9–29.9), age 37.8; 0.5 g/kg drunk over 20 min (half in each 10 min) at 8 am after an overnight fast; venous blood at 0, 10, 20, 30, 40, 60, 90 … 480 min; time zero = start of drinking. Cmax **beer 50.3 ± 9.8, wine 61.7 ± 10.8, vodka-tonic 77.4 ± 17.0 mg/dl**; Tmax **62 ± 23, 54 ± 14, 36 ± 10 min** (also given as 1.04 ± 0.38, 0.91 ± 0.23, 0.60 ± 0.17 h). Bioavailability relative to spirits: **wine 0.96 ± 0.13, beer 0.90 ± 0.02 (SE)**. Peak above 80 mg/dl after vodka-tonic in **7 of 15** (results; the abstract says six), in none after beer or wine; in 4 men the vodka peak was > 2× the beer peak. | A (n=15 men, crossover) | Mitchell MC, Teigen EL, Ramchandani VA 2014, Alcohol Clin Exp Res. PMC4112772 |
| A10 | **Model (2026-10-16), drink classes and fit:** two compartments: the measured blood sees a central part = **0.6 × Widmark volume** (r·W, Forrest r); the rest fills with exchange **0.35 × r·W per hour** (equilibration half-time ≈ 28 min); zero-order elimination β·r·W shared by both parts in proportion to their alcohol, so after distribution the curve falls at β as in plain Widmark. Absorption ka (fasted): **beer-like 1.6/h, F 0.90; wine-like 2.0/h, F 0.96; spirits & mixed drinks 3.6/h, F 1.0** (F from A9). Classes by g alcohol per 100 g: < 7 beer, cider, alcopops; 7–13 wine (≈ 9–16% vol); ≥ 13 spirits, mixed drinks, rakija (Mitchell's 20% vodka-tonic ≈ 16 g/100 g). Fit for the A9 subject (82.66 kg, BMI 26.35, β 0.12): **beer 51.7 mg/dl at 62 min, wine 61.5 at 54, vodka-tonic 77.9 at 36** (Cmax within 3%, Tmax exact; 70 kg default man: 47.8 / 57.2 / 72.9). Fed at 0.5 g/kg: 41.0 / 45.2 / 48.0 (spirits 0.62 of fasted, above the 0.40–0.57 measured at 0.30 g/kg: the cautious side). Before (one compartment, ka 2.5/3.3/5 per h, F 0.94; vodka-tonic counted as wine because 16 g/100 g < 20): beer 49.8 / wine 53.1 / spirits 56.9 mg/dl for the same man (70 kg default man ≈ 46 / 49 / 53). Why two compartments: the vodka-tonic mean (77.4) is above the Widmark value with no elimination at all (0.5/0.698 = 71.6 mg/dl), so no single-volume model can reach it; the early overshoot is the known distribution phase. Neat spirits (40%) not measured: given the fastest class (C). | C (fit to A9; test: alcoholMitchell.test.ts) | A9, W3, K1 |
| A11 | **Fed with the new model:** fed absorption **1.35/h** (was 1.5/h), β 0.17: Jones set-up (0.30 g/kg spirits, 70 kg) fed/fasted ≈ **0.47** (PF1: 0.40–0.57); 0.5 L beer ≈ 0.63; gone ≈ 1 h sooner. Small fed doses (one glass of wine or one rakija with a meal) give 0.2–0.4 of fasted: not measured, direction only. | C (fit to PF1) | PF1, A10 |
| A12 | **Range shown on screen: −40% / +50%** of the model peak. Mitchell's SDs are 17–22% of the mean, so mean + 2 SD is +39% (beer), +35% (wine), **+44% (vodka-tonic, 111 mg/dl)**; the old ±40% upper end (spirits model 53 → 75 mg/dl) was below the measured mean. With the A10 fit the upper end for vodka-tonic is ≈ 117 mg/dl and 80 mg/dl (7 of 15 men) is inside the range. Low side kept at −40% (W6). | C (from A9, W6) | A9, W6 |

### Personal factor: "I've just eaten" (added 2026-10-15, science/personal.ts)

| ID | Claim | Level | Source |
|---|---|---|---|
| PF1 | Abstracts re-read. 0.30 g/kg within 15 min **after** a breakfast: peak **13.3–17.7 mg/dl** vs **30.8 ± 4.3** fasted (9 men); AUC about halved; ethanol gone **1–2 h sooner**; meal type (fat, carbohydrate, protein) mattered little. 1 h after breakfast: **17.5 vs 43.8 mg/dl** fasted (10 men). → fed peak ≈ **40–57%** of fasted. | A (men only, n = 9–10) | Jones AW et al. 1997, PMID 9431825; Kechagias S et al. 1999, PMID 10594475 |
| PF2 | (Updated 2026-10-16: fed rate now 1.35/h with the two-compartment model, see A11.) Model: profile `withMeal` (or food ≥ 100 kcal in the same meal) → fed. Fed absorption rate **1.5/h** (was an unused 0.75/h placeholder) fitted so the Jones set-up gives fed/fasted ≈ 0.45 and a 0.5 L beer ≈ 0.54; with β 0.17 g/L/h fed the curve ends ≈ 1 h sooner. Also: with food in the meal the slower fed rate now wins over the drink-type rate (before, beer + pizza used the fasted beer rate). | C (fit to PF1) | test: personal.test.ts |
| PF3 | Sex and body size enter through Widmark r (W3, Forrest BMI formula). Women's lower first-pass (A4) is not added: no number to fix it (Open question 3). | — | W3, A4 |

---

## 3. Widmark model, distribution, elimination

| ID | Claim | Level | Source |
|---|---|---|---|
| W1 | **Widmark:** C = 100·m/(r·M) − β·t (mg/100 ml, m grams alcohol, M body mass kg, r "Widmark factor" l/kg, β mg%/h elimination). r = total body water ÷ (body mass × proportion of water in blood); depends on sex and BMI. Without elimination: C₀ = m/(r·M). | A (formula) | Searle J. 2015, Med Sci Law, PMID 24644224 (PMC4361698) |
| W2 | Textbook values: r **0.7 men, 0.6 women** ("commonly chosen"). | B (secondary citation; cites Seidl, Watson) | Reiter GS et al. 2020, PMC7518982 (beer.md W1) |
| W3 | **Forrest/Barbour BMI regression:** men r = 1.0181 − 0.01213 × BMI; women r = 0.9367 − 0.01240 × BMI. Example table (Forrest): men BMI 21.9 → 0.75, 24.7 → 0.72, 27.2 → 0.69; women BMI 20.1 → 0.69, 22.8 → 0.61 (Barbour 0.65), 25.3 → 0.58 (Barbour 0.62). Authors note Forrest's and Barbour's female values differ at high BMI. | B (primary data not opened; regression as printed in the review) | Searle 2015 (PMC4361698) |
| W4 | Watson total body water (L; height cm, weight kg, age y): men 2.447 − 0.09516·age + 0.1074·height + 0.3362·weight; women −2.097 + 0.1069·height + 0.2466·weight. Searle's text prints the women's intercept as "2.097" without the minus sign (likely typesetting); beer.md W3 has "−2.097". Original Watson 1981 (PMID 7289599) has no abstract in Europe PMC → **VERIFY intercept sign in the original**. | A (men) · **VERIFY** (women's sign) | Watson PE et al. 1981, J Stud Alcohol. PMID 7289599; Searle 2015 |
| W5 | Cross-check of r from W4 (ours): man 70 kg, 175 cm, 30 y: TBW = 2.447 − 2.855 + 18.795 + 23.534 = **41.9 L**; with blood water fraction 0.8 (assumed, not read) r = 41.9/(0.8×70) = **0.75**. Woman 60 kg, 165 cm: TBW = −2.097 + 17.64 + 14.80 = **30.3 L**; r = 30.3/(0.8×60) = **0.63**. Forrest (W3): man BMI 22.9 → **0.74**; woman BMI 22.0 → **0.66**. All three methods agree within ±0.04 of the textbook 0.7/0.6. | C | W2–W4; blood-water fraction 0.8 **VERIFY** |
| W6 | **Uncertainty:** Widmark BAC error ≈ **22%** with measured body mass and ≈ **37%** with estimated mass; V_d CV ≈ 10%. Online BAC calculators exceeded measured values by 39–49%. So any displayed BAC is an estimate ±20–40%. | A | Maskell PD, Cooper GAA 2020, J Forensic Sci. PMID 32421216; Stragierowicz 2026 (beer.md W4) |
| K1 | **Elimination:** fasted **10–15 mg/100 ml/h** (= 0.10–0.15 g/L/h), non-fasted **15–20**, physiological range **10–35**, average moderate drinker 15; slightly steeper in women (relative to lean mass). | A | Jones AW 2010, Forensic Sci Int. PMID 20304569 (abstract) |
| K2 | Elimination rate varies 42% between and 58% within people; all other PK parameters vary mostly between people. | A | Jones & Jönsson 1994, PMID 8054248 |
| K3 | Peak time (see A1): beer ~62 min, wine ~54 min after start of a 20-min drinking fasted. Fed peaks are lower and later (A2). | A | Mitchell 2014 |

### Worked examples (fasted; ours, level C)

Inputs: beer A = 19.725 g, wine A = 14.202 g. Man 70 kg r = 0.7 (W2); woman 60 kg r = 0.6 (W2). Units: Widmark gives g/kg ≈ g/L (blood density ≈ 1.05; difference < 6%, ignored).

| Case | Pure Widmark C₀ = A/(r·M) (no elimination, instant absorption) | Model A (below), β = 0.10–0.15 g/L/h | Model B: C₀ × Mitchell ratio |
|---|---|---|---|
| Man 70 kg, beer 19.7 g | 19.725/(0.7×70) = **0.40** | peak **0.21–0.25** g/L at 43–52 min; zero at ≈ 2.5–3.8 h after start | 0.40 × 0.70 = **0.28** |
| Man 70 kg, wine 14.2 g | 14.202/49 = **0.29** | **0.16–0.19** at 33–40 min; zero ≈ 1.9–2.9 h | 0.29 × 0.86 = **0.25** |
| Woman 60 kg, beer 19.7 g | 19.725/(0.6×60) = **0.55** | **0.33–0.38** at 50–59 min; zero ≈ 3.4–5.1 h | 0.55 × 0.70 = **0.38** |
| Woman 60 kg, wine 14.2 g | 14.202/36 = **0.39** | **0.25–0.29** at 39–46 min; zero ≈ 2.6–3.9 h | 0.39 × 0.86 = **0.34** |

Math for Model B ratios: Mitchell measured 0.503 g/L (beer) and 0.617 g/L (wine) at 0.5 g/kg. Widmark for a man with r = 0.7: 0.5/0.7 = 0.714 g/kg. Ratios 0.503/0.714 = **0.70** (beer), 0.617/0.714 = **0.86** (wine). Applied linearly to our smaller doses (assumption: ratio does not depend on dose; elimination during absorption is a bigger share at small doses, so Model B probably overestimates the peak, Model A may underestimate — report the **range**). The ratios come from men only; in women lower first-pass (A4) and lower body water push BAC higher, so ratios for women are an assumption.
Model A: see "Suggested acute model". Fed: use 45–55% of the fasted peak (beer.md H1, H2) and β 0.15–0.20 g/L/h (K1).
Time-to-zero example (hand check, man beer): peak 0.25 g/L ÷ 0.12 g/L/h ≈ 2.1 h after peak (≈ 1 h) → ≈ 3 h after start.

---

## 4. Acute effects and driving limits

| ID | Claim | Level | Source |
|---|---|---|---|
| D1 | Divided Attention Test impaired already at **0.2 g/L**; reaction time (PVT) and balance impaired at **0.5 and 0.8 g/L** (24 volunteers). [causal] | A | Jongen S et al. 2014, Psychopharmacology. PMID 24408210 (beer.md E1) |
| D2 | In a driving simulator (20 adults) alcohol at target BAC **0.08%** increased risk-taking (shorter time-to-collision) vs placebo; risk-taking at 0.05% was less than at 0.08%. [causal] | B (n=20) | Van Dyke NA, Fillmore MT 2017, Drug Alcohol Depend. PMID 28412303 |
| D3 | **Croatia:** general drivers **0.5 g/L** (Your Europe lists "0,5 mg/ml" = 0.5 g/L); **professional and novice drivers 0.0**; ETSC: novice (up to 24 y) and professional 0.0 g/L, zero limit introduced 2004. | A | European Commission "Your Europe" Croatia road rules, https://europa.eu/youreurope/citizens/travel/driving-abroad/road-rules-and-safety/croatia/index_en.htm ; ETSC https://etsc.eu/issues/drink-driving/drink-driving-in-croatia/ |
| D4 | **USA:** all states have a 0.08 g/dL per se limit except Utah (0.05, effective 30 Dec 2018). | A (NHTSA text as relayed by web-search summary → **source pending** for direct page) | NHTSA, Countermeasures That Work / lower BAC limits, https://www.nhtsa.gov/book/countermeasures-that-work/alcohol-impaired-driving/countermeasures/legislation-and-licensing/lower-bac-limits |
| D5 | Crash risk: BAC 0.8 g/L increases crash risk **2.7 times** vs zero BAC (ETSC page statement). | A (as quoted; underlying study not opened) | ETSC https://etsc.eu/issues/drink-driving/ |
| D6 | **EU:** "0.5 g/L common in EU; some countries 0.2 or 0.0" — country list **not obtained** (European Commission road-safety page returned 404; ETSC table is linked, not displayed). | **? / source pending** | — |
| D7 | Compare with worked examples (C): one beer or wine fasted gives roughly 0.16–0.38 g/L (table above): below 0.5 g/L (Croatia general limit) but **above 0.2 g/L** where divided attention is already impaired (D1), and **above 0.0** for novice/professional drivers (D3). Fed peaks ≈ half. Because of W6 (±20–40%) no one should use this to decide to drive. | C | D1, D3, W6 |

---

## 5. Sleep, heart, glucose, hydration, hangover, myths

Sleep, nocturnal heart rate/HRV, blood pressure, glucose and diuresis are already in beer.md (S1–S3, V1–V3, G1–G2, U1–U3). These effects are ethanol-dose driven; no wine-specific trial was read, so beer.md values are **assumed applicable to wine by gram of ethanol (C)**. Key numbers repeated for the rules:

| ID | Claim | Level | Source |
|---|---|---|---|
| S1 | Healthy volunteers, all doses: shorter sleep latency, more first-half slow-wave sleep, **more second-half disruption**; REM % decreased at moderate/high doses; first REM delayed at all doses. [causal, meta-analysis of lab studies] | A | Ebrahim IO 2013, PMID 23347102 (beer.md S1) |
| S2 | Pre-sleep alcohol raised nocturnal HR, reduced vagal HRV and baroreflex sensitivity; bedtime breath alcohol ≈ 0.02% after 1 drink (women) / 2 (men) and ≈ 0.05% after 3 / 4. [causal] | A (n=26) | de Zambotti 2021, PMID 32663278 (beer.md V3) |
| S2b | Dose-response in real life (wave 6): 4,098 Finnish employees, within-person nights with vs without alcohol; HRV-derived recovery in the first 3 h of sleep fell by 9.3 / 24.0 / 39.2 percentage units after low (≤ 0.25 g/kg; ~90% of these days were one drink) / moderate (0.25–0.75 g/kg) / high (> 0.75 g/kg) intake; effects also at low intake (P < .001); stronger in younger people. [observational] App claim AL8; the g/kg bands also pick the app's sleep wording (mapping onto Ebrahim's dose words = C). | B | Pietilä J 2018, JMIR Ment Health, PMID 29549064 (PMC5878366, abstract + full text read) |
| S3 | Next-day HR +4.6 to +5.1 bpm within 6 h for 14–28 g; SBP −5.6 / DBP −4.0 mmHg within 6 h. [causal] | A | Tasnim 2020 Cochrane, PMID 32609894 (beer.md V1) |
| S4 | Blood glucose: fasted alcohol lowered glucose in n=7 women; no change with 48 g + cycling (n=8). | B | beer.md G1, G2 |
| S5 | Diuresis: 1 L lager (n=72 men, fasted, 30 min) gave the same 4-h urine as 1 L water; ABV of the lager **not stated in the abstract**, the brief's "4%" is unverified. At ≈ 48 g ethanol the early diuresis rise was offset later (n=8). | A (lager) · B | Maughan 2016, PMID 26702122; Marley 2024, PMID 37981293 (beer.md U1–U2) |
| S6 | **Hangover:** a review of the physiology says changes during hangover "are largely unknown" (oxidative stress, hormones, dehydration, immune changes discussed). Summary via search: Penning/Verster review found vasopressin/dehydration markers not related to hangover severity; immune factors were. | B (Tipple 2016, abstract read) · **source pending** (Penning 2010 summary only) | Tipple CT et al. 2016, Curr Drug Abuse Rev. PMID 28176621; Penning R et al. 2010 (not opened) |
| S7 | Hangover treatments: 6 controlled human studies (2009–2016), some products improved some symptoms, none all; evidence insufficient. | B | Jayawardena R et al. 2017, Hum Psychopharmacol. PMID 28568743 |
| S8 | Appetite: in 20 lean women an alcohol preload (0.91 MJ ≈ 217 kcal) did not reduce food eaten at the next meal (2.62 vs 2.98 MJ no-alcohol, n.s.); authors: energy in drinks is not compensated, so intake rises short term. [causal, small] | B | Poppitt SD et al. 1996, Physiol Behav. PMID 8884934 |
| S9 | Caffeine: "caffeine does not change BAC / coffee gives a wide-awake drunk" is reported by Temple Univ. and others in news summaries; primary study **not read**. Mechanism-consistent: elimination is hepatic zero-order (K1). | **? / source pending** | news summaries (cbc.ca, abcnews) only |

Myth check (additions to beer.md):

| Myth | Verdict | Evidence |
|---|---|---|
| "Wine is gentler/ beer is weaker" | **Per gram of ethanol, no.** Fasted, the same 0.5 g/kg gave a peak 23% higher after wine than beer (61.7 vs 50.3 mg/dl) and 54% higher after 20% vodka-tonic; the dilute drink peaks lower and later. Our wine glass has 14.2 g vs beer 19.7 g, so in grams wine is smaller. | A1, P2, P3 |
| "Coffee sobers you up" | Not proven in a primary source read; elimination is liver-limited (K1). | S9, K1 |
| "Water between drinks prevents hangover" | **Not supported** by the hangover/dehydration summary (S6); no trial read. | S6 ? |
| "Women just need to drink less per kg" | Partly: lower body water and lower first-pass raise BAC (A4, A5); elimination per kg similar (A5). | A4–A5 |

---

## 6. Long-term risks

| ID | Claim | Level | Source |
|---|---|---|---|
| L1 | **WHO global fact sheet:** "There is no form of alcohol consumption that is risk-free. Even low levels … carry some risks." In 2019, **4.4% of cancers** and **401 000 cancer deaths** attributed to alcohol; ~**2.6 million deaths** from alcohol in 2019; the sheet calls alcohol "an established carcinogen". | A (official) | WHO fact sheet, https://www.who.int/news-room/fact-sheets/detail/alcohol |
| L2 | **WHO Europe statement (Lancet Public Health):** "There is no safe amount that does not affect health." IARC: alcohol is a **Group 1 carcinogen**, "the highest risk group, also includes asbestos, radiation and tobacco". Alcohol causes at least seven types of cancer, including bowel and female breast cancer. | A (official) | WHO/Europe news item "No level of alcohol consumption is safe for our health", https://www.who.int/europe/news/item/04-01-2023-no-level-of-alcohol-consumption-is-safe-for-our-health |
| L3 | **GBD 2016 (published Lancet 2018):** the level of consumption minimising health loss across outcomes was **zero (95% UI 0–0.8) standard drinks/week** (1 drink = 10 g); all-cause mortality and cancers rise with consumption; alcohol 7th leading risk factor in 2016. [modelled; assoc. + modelling] | B | GBD 2016 Alcohol Collaborators, Lancet 2018, PMID 30146330 |
| L4 | **All-cause mortality dose–response (107 cohorts, 4.84 M people, 425 564 deaths):** vs lifetime nondrinkers, adjusted for bias: 0–1.3 g/d RR 0.96 (0.86–1.06); **1.3–24 g/d RR 0.93 (P = 0.07, not significant)**; 25–44 g/d RR 1.05 (n.s.); **45–64 g/d RR 1.19**; **≥65 g/d RR 1.35**; women RR **1.22** (P = 0.03). Conclusion: low intake not significantly associated with mortality; risk evident at higher intake and starting lower in women. [assoc.] The "protective" J-curve in many studies is attributed to abstainer-group bias (former drinkers, young cohorts): low-volume RR 0.84 in lower-quality studies vs 0.98 (0.87–1.11) in higher-quality. | B (association; debated) | Zhao J et al. 2023, JAMA Netw Open. PMID 37000449; Stockwell T et al. 2024, J Stud Alcohol Drugs. PMID 38289182 |
| L5 | 2026 review (Rehm group): monotonic increasing dose–response with most attributable outcomes (infectious disease, cardiovascular, cancers, digestive); **J-shape for ischaemic heart disease, ischaemic stroke, type 2 diabetes** (lower risk at low-moderate intake, generally without heavy episodes); Mendelian randomisation evidence for IHD largely null or harmful but "insufficient to refute" J-shape. Chronic heavy drinking defined as ≥40 g/d (F) and ≥60 g/d (M). Acute risks reversible; chronic disease only partly. | B (review of reviews; debated) | Carr S et al. 2026, Addiction. PMID 42129601 (PMC13357654) |
| L6 | **Liver cirrhosis (7 cohorts + 2 case–control, 2.63 M, 5 505 cases):** no increased risk for occasional drinkers; **1 drink/day (12 g) increased risk in women but not in men**; ≥5 drinks/day: women RR 12.44 (5–6 drinks; CI 6.65–23.27), 24.58 (≥7; CI 14.77–40.90); men RR 3.80 (CI 0.85–17.02) and 6.93 (CI 1.07–44.99). Risk rises exponentially. Women higher at all levels. [assoc.; alcohol-related cirrhosis is by definition caused by alcohol, so causal in kind] | B (heterogeneous) | Roerecke M et al. 2019, Am J Gastroenterol. PMID 31464740 |
| L7 | **Fatty liver / liver fat per gram of alcohol:** no dose–response read. Alcohol-related cirrhosis is often irreversible; reducing intake slows progression (review statement). | **?** (fatty liver dose) · B (reversibility) | Carr 2026 (PMC13357654) |
| L8 | **Blood pressure, men/women cohorts:** vs abstainers, men RR for hypertension 1.19 (1.07–1.31) at 1–2 drinks/day (12 g), 1.51 at 3–4, 1.74 at ≥5; **women 0.94 (0.88–1.01) at 1–2 drinks, 1.42 above**. [assoc.] | B | Roerecke M et al. 2018, J Am Heart Assoc. PMID 29950485 |
| L9 | **Reduction trials:** 36 trials, 2 865 people: in those drinking ≤2 drinks/day, cutting intake did not significantly lower BP; in >2 drinks/day, reduction lowered SBP/DBP dose-dependently, strongest for ≥6 drinks/day halving intake (**SBP −5.50 mmHg, DBP −3.97**). [causal, RCT meta-analysis] "Roerecke 2017". | A | Roerecke M et al. 2017, Lancet Public Health. PMID 29253389 |
| L10 | **HDL / triglycerides:** interventional studies (44 meta-analysed): alcohol raised HDL-C by **0.094 mmol/L** (95% CI 0.064–0.123 ≈ 3.6 mg/dL), apoA1, adiponectin; lowered fibrinogen; **did not change triglycerides**; similar across wine, beer, spirits; dose–response for HDL (trend P = 0.013). Authors: "indirect pathophysiological support" for CHD protection; Carr 2026 (L5) says this is not settled. [causal for marker, not for outcome] | A (markers) · ? (clinical benefit) | Brien SE et al. 2011, BMJ. PMID 21343206 |
| L11 | **Breast cancer (22 cohorts, 45 350 cases):** each **+10 g/day** raised risk by **10.5%** (RR 1.10, 95% CI 1.08–1.13) for total alcohol, **RR 1.08 (1.04–1.14) for wine**; postmenopausal RR 1.11 (1.09–1.13) per 10 g. Beer alone not significant in this analysis. [assoc.] Our extension (C): a woman drinking one beer (19.7 g) daily: 1.10^(19.7/10) = **1.21**; one wine (14.2 g): 1.10^(1.42) = **1.14** (log-linear assumption; applies to relative, not absolute, risk). | B (assoc.) · C | Sun Q et al. 2020, Alcohol Alcohol. PMID 32090238 |
| L12 | **Pregnancy:** WHO fact sheet: alcohol in pregnancy increases the risk of FASD and FAS (developmental disabilities, birth defects). "No known safe amount, type or timing" is from WHO Europe 2026 (beer.md X1, **source pending**, PDF not opened). | A (FASD risk) · pending (wording) | WHO fact sheet (L1); beer.md X1 |
| L13 | **Weight:** energy in alcohol is not compensated at the next meal in lean women (S8); no long-term weight cohort/RCT read. | B (short term) · **?** (long term) | Poppitt 1996 |

---

## Suggested bar rules (all level C; Opus must verify before shipping)

Existing app rules: habit = servings/day × frequency × duration (healthBars.ts `habitual()`); Sleep/Sugar today only; Cholesterol, Fat, Life habit-based; Health = average of five bars. Define per serving: **g_beer = 19.7 g, g_wine = 14.2 g** (P2, P3); `gDay = habitual(beer)·19.7 + habitual(wine)·14.2` (g/day habit-weighted).

| Bar | Rule (conservative) | Math / tie to claims |
|---|---|---|
| **Sleep** (today) | Only if the model BAC at the profile's bedtime is > 0. Penalty = **−4 per 0.2 g/L of bedtime BAC, cap −12**. If BAC is 0 at bedtime: no penalty (no data read on sleep after alcohol is already cleared, so no effect is claimed either way). | S1: latency shorter, REM delayed/lower, second half disrupted — **direction only, no minutes**. S2: autonomic effects already at ≈ 0.2 g/L breath-equivalent. So 1 step = 0.2 g/L (−4), cap at 0.6 g/L (−12), about ⅓ of the 90-point sleep bar, which is deliberately mild. The coefficient −4 per 0.2 g/L is our choice, not a measured number. |
| **Sugar** (today) | **0 change** for beer and wine. | WHO free-sugar budget concerns free sugars; carbohydrate/sugar of beer and wine **not retrieved** (USDA 429; P5). Decide after the USDA fetch; do not invent. Possible later: wine residual sugar. |
| **Health** (today) | No own rule; average of bars. Show a **note**: "Alcohol: no safe level (WHO)". | L1, L2 |
| **Fat** (habit; liver + energy) | `Fat −= 0.15 × gDay` (i.e. −3 per habitual beer, −2.1 per habitual wine; women ×1.5). Cap −15. | No fatty-liver dose–response read (L7), so size is a placeholder; direction from cirrhosis: women at risk from ≈ 1 drink/day (12 g), men not until higher (L6); exponential rise; women ×1.5 (L6, "consistently higher"). Compare cola: −6/can (Maersk). 2 beers daily for years (39 g/day) → −5.9. Energy: 138 kcal/beer (P4) not added separately. |
| **Cholesterol** (habit) | **No change.** Add a note only: "Alcohol raises HDL slightly (+0.09 mmol/L) and does not change triglycerides in trials; this is not shown as a benefit." | L10: HDL rise and TG unchanged are marker findings; benefit for outcomes disputed (L5). A positive bar move would imply benefit, which no source here supports; a negative move has no source either. |
| **Life quality** (habit) | `Life −= (RR(gDay) − 1) × 100 / 3` with RR from a step table: gDay < 25 → 1.00; 25–44 → 1.05; 45–64 → 1.19; ≥ 65 → 1.35. No separate women step (see Open questions 8); the note below is shown instead. | Same conversion as the cola rule (−3 points per ≈ +9% risk, i.e. 1 point per 3% RR). L4 values: 1.05 → −1.7; 1.19 → −6.3; 1.35 → −11.7. Below 25 g/day the pooled RR is not significant (0.93, P = 0.07), so no penalty, **but the note** "No level is risk-free (WHO); breast cancer risk +10% per 10 g/day (women)" shows (L1, L2, L11). One beer a day (19.7 g) falls below the step → 0 points: this is the conservative choice (do not overstate), not a claim of safety. |
| Notes shown, no points | Breast cancer (women): 1 beer/day ≈ ×1.21, 1 wine ≈ ×1.14 relative risk (L11, C). Hypertension: men ×1.19 at 12–24 g/day (L8). | L8, L11 |
| Habit gating | Use the existing `habitual()` frequency/duration weights. | The evidence base is cohort-years (L4, L6, L11) so "weeks" gets 0.3. |

Unit check examples: daily beer for years: habitual = 1 × 1 × 1 = 1 → gDay = 19.7 → Fat −3 (men) / −4.4 (women); Life 0; Cholesterol 0. Three beers every day for years: gDay = 59 → Fat −8.9; RR step 1.19 → Life −6.3. Four beers daily: 79 g → RR 1.35 → Life −11.7.

## Suggested acute model (BAC curve parameters)

**Superseded 2026-10-16 by A10–A12** (two compartments, per-drink classes, −40/+50% range); kept below as the earlier version.

One-compartment Widmark with first-order absorption and zero-order elimination (our fit; per-minute step in code):
- State: gut amount G (g), body amount B (g). dG/dt = −ka·G; dB/dt = F·ka·G − min(B, β·r·W) (elimination stops at B = 0). BAC (g/L) = B/(r·W).
- A = 19.725 g (beer), 14.202 g (wine) (P2, P3). r = Forrest BMI formula (W3) or 0.7/0.6 (W2); W body weight.
- **ka, F fasted (fitted to Mitchell peak time and Cmax for 70 kg, r = 0.7, β = 0.12; fit error 1–9%):** beer ka ≈ **2.5/h**, F ≈ **0.94** (fit gives tmax 61 min, Cmax 0.50 g/L); wine ka ≈ **3.3/h**, F = **1.0** (tmax 54 min, Cmax 0.57 vs measured 0.62, i.e. −8%); vodka not needed.
- β: **0.10–0.15 g/L/h fasted, 0.15–0.20 fed** (K1); default 0.12 fasted / 0.17 fed. Below ≈ 0.02–0.10 g/L the Michaelis–Menten tail makes the decline first-order (beer.md M1); ignore for display, end curve at 0.
- **Fed:** scale the peak to 45–55% of fasted (beer.md H1/H2) and delay tmax; ka for fed (≈ 0.5–1/h) is **not fitted to data** (no fed beer/wine data read) → treat as a display choice.
- Drinking time: sip over 30–60 min lowers and delays the peak vs Mitchell's 20 min (direction only, C).
- Display always as a range and with the ±20–40% warning (W6). Sex enters through r only (A4 first-pass difference is in Mitchell-type men-only fit; for women consider raising F slightly — **no data to fix a number**).
- Outputs for the examples are in the worked-example table (§3). Examples: man beer peak 0.21–0.25 g/L at ≈ 45–50 min, zero at ≈ 3–3.5 h after start.

## Open questions

1. USDA FDC (Retry-After 11.8 h from 2026-10-08): beer 168746 and wine (table, red/white) kcal, carbohydrate, sugars per 100 g; then wine total kcal and Sugar bar.
2. EU country list of BAC limits (0.2 / 0.0): ETSC BAC table or European Commission page (404). NHTSA page itself was not opened (search summary).
3. Stomach vs small-intestine percentages and sex-specific first-pass magnitudes: primary review (e.g. Cederbaum 2012, Lieber) not accessible; Frezza 1990 vs Oneta 1998 disagree on the role of gastric ADH.
4. BAC curves for **small doses (14–20 g)** of beer/wine, sipped, in **women** and fed: all peaks here come from 0.5 g/kg men (Mitchell) or 0.30 g/kg cocktails (beer.md); Model A/B differ by up to 0.07 g/L.
5. Watson women's intercept sign (W4), blood water fraction 0.8 (W5).
6. Fatty liver dose–response (g/day → liver fat), sleep minutes per BAC, glucose after one beer/wine with food, purines.
7. Primary papers for: coffee/caffeine and BAC, Penning 2010 hangover, WHO Europe 2026 pregnancy PDF, NIAAA page, Maughan lager ABV.
8. Women Life-quality rule: Zhao reports women RR 1.22 for drinkers overall, but the intake band is not given in the abstract; breast-cancer risk (L11) is large relative risk but small absolute; decide with Opus whether to add a sex-specific penalty.
9. Whether to show the J-shaped HDL/CHD story at all (Carr 2026 says unsettled).
