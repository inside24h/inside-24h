# "If you have this every day" — long-term health markers

Status: **draft v1** · 2026-10-08 · Levels: **A** established · **B** supported, variable · **C** our estimate (math shown) · **?** unknown.
Every number below was read in an abstract (or the full text via `epmc.py grep`) in this session unless marked **source pending**.
Doses used: **1 espresso = 63 mg caffeine** (espresso.md P1, ~30 ml); **3 shots = 189 mg**; **1 can = 330 ml, 35 g sugar ≈ 140 kcal** (35 g × 4 kcal/g; cola.md P9c).
Unit conversion used (standard, not a study result): cholesterol mmol/L × 38.67 = mg/dL; triglycerides mmol/L × 88.6 = mg/dL.

**Honest headline.** Almost no long-term trial used one espresso or one can per day. Most RCTs used 5–6 cups of unfiltered coffee or 1 L of cola. Scaling down to one serving is level **C** and assumes a linear dose–response, which was never shown for small doses. Cohort findings are **associations** (confounding possible).

---

## 1. Reference ranges (for "healthy zone" bars)

| ID | Marker | Reference range | Level | Source (what was read) |
|---|---|---|---|---|
| R1 | Total cholesterol | healthy adult: **< 200 mg/dL** (< 5.2 mmol/L, conversion ours) | A | MedlinePlus "Cholesterol Levels" (medlineplus.gov/lab-tests/cholesterol-levels/), page read |
| R2 | LDL cholesterol | **< 100 mg/dL** "healthy" (MedlinePlus). ESC/EAS 2019 risk-based goals: low risk **< 116 mg/dL (3.0 mmol/L)**, moderate **< 100**, high **< 70**, very high **< 55** (+ ≥ 50% reduction). Use <116 mg/dL as the green limit for a healthy low-risk adult, and note the goal is risk-based. | A | MedlinePlus; ESC/EAS 2019 Eur Heart J, Mach F et al., via ACC "Ten points to remember" (acc.org, page read) and web search summary of the guideline. Full guideline text not read |
| R3 | HDL cholesterol | **≥ 60 mg/dL** best; low: **< 40 mg/dL men, < 50 mg/dL women** | A | MedlinePlus (same page) |
| R4 | Triglycerides (fasting) | normal **< 150 mg/dL**; borderline high 150–199; high 200–499; very high ≥ 500; optimal < 100 | A | AHA Scientific Statement "Triglycerides and Cardiovascular Disease" (2011), via web-search excerpt (acc.org journal scan). **source pending**: open the statement itself |
| R5 | Fasting glucose | normal **≤ 99 mg/dL**; prediabetes **100–125**; diabetes **≥ 126** | A | CDC diabetes testing page (cdc.gov/diabetes/diabetes-testing), page read; criteria are the ADA ones, ADA Standards of Care 2023 PMC9810477 (full text not retrievable, so ADA wording **source pending**) |
| R6 | HbA1c | normal **< 5.7%**; prediabetes **5.7–6.4%**; diabetes **≥ 6.5%** | A | CDC page (read) |
| R7 | BMI | underweight < 18.5; **healthy 18.5 to < 25**; overweight 25 to < 30; obesity ≥ 30 | A | CDC adult BMI categories (page read); WHO fact sheet (page read) confirms ≥ 25 and ≥ 30 |
| R8 | Serum uric acid | hyperuricemia: **≥ 7.0 mg/dL men, ≥ 6.0 mg/dL women** (so "healthy" is below these) | B | web-search excerpt of US epidemiologic usage (Merck/NCBI-type sources; not opened). **source pending** |
| R9 | Blood pressure | not requested; not researched here | ? | use ESH from the existing vitals dossier |

---

## 2. Espresso daily (1 shot = 63 mg caffeine; 3 shots = 189 mg)

### 2a. Cholesterol and the diterpene question

| ID | Marker | Effect (size, units, time) | Causal or association | Level | Source |
|---|---|---|---|---|---|
| E1 | Why coffee changes LDL | Diterpenes **cafestol and kahweol** raise serum cholesterol. Content depends on brewing; paper filters retain them; espresso has an **intermediate** content. | mechanism, from RCTs | A | Svatun 2022 intro, PMID 35537850 (PMC8995942); Urgert & Katan 1996, PMID 9135590: brews "not … prepared with a paper filter or with soluble coffee granules" contain them; raise cholesterol and triglycerides; "both effects are transient after withdrawal" |
| E2 | Cafestol per litre by brew | Boiled **232 mg/L**; espresso machines **54 mg/L**; mocha pot 36 mg/L; capsules, pods, vending machines **10–43 mg/L**; filtered **5 mg/L** | measurement (Moeenfard review) | B · **source pending** (quoted from Svatun, citing Moeenfard et al.; primary not opened. Also Moeenfard 2016, PMC5156634 exists, full text failed to download) | Svatun 2022 discussion |
| E3 | Cafestol per cup (our math) | Espresso 30 ml × 54 mg/L = **1.6 mg**; capsule range 30 ml × 10–43 mg/L = **0.3–1.3 mg**. 3 shots: **4.9 mg** (range 0.9–3.9 for capsules). Boiled coffee 150 ml × 232 mg/L = **35 mg**; filtered 150 ml × 5 mg/L = **0.75 mg**. (Cup volumes are our assumption.) | arithmetic | C | E2 |
| E4 | Dose–response | Every **10 mg cafestol (plus a similar amount of kahweol) raised total cholesterol by 0.13 mmol/L** (about 5 mg/dL). Also: pure cafestol 73 mg/d + kahweol 58 mg/d for 6 weeks raised cholesterol by **1.7 mmol/L (66 mg/dL)** in 3 volunteers. | RCT (feeding trials, small) | A for direction; B for slope | Svatun 2022 (quoting Weusten-van der Wouw); Mellbye 2024 PMID n/a, PMC11478357 (quotes the same 0.13 mmol/L per 10 mg); Weusten-van der Wouw 1994, PMID 7911820 (abstract read) |
| E5 | **1 shot: LDL/total cholesterol** | Using E3 and E4: 1.6 mg × 0.13/10 = **+0.02 mmol/L (≈ +0.8 mg/dL)**. Capsule range 0.3–1.3 mg → +0.004 to +0.017 mmol/L. Below measurement noise. | none directly; derived | C | E3, E4. Assumes linearity and that the 0.13 slope (cafestol + equal kahweol) applies to espresso kahweol ratio |
| E6 | **3 shots: LDL/total cholesterol** | 4.9 mg × 0.13/10 = **+0.06 mmol/L (≈ +2.5 mg/dL)**. Time to appear: weeks (see E8). | derived | C | E3, E4 |
| E7 | Tromsø espresso (observed) | **3–5 cups espresso/day vs 0 cups: total cholesterol +0.09 mmol/L (95% CI 0.01–0.17) in women, +0.16 mmol/L (0.07–0.24) in men** (about +3.5 and +6.2 mg/dL). n = 21,083, age ≥ 40, cross-sectional. No standard cup size in the questionnaire; Norwegian "espresso" cups may be bigger than 30 ml. The 1–2 cup result was not given in the abstract. | association (cross-sectional) | B | Svatun 2022, PMID 35537850, DOI 10.1136/openhrt-2021-001946 |
| E7b | Espresso RCTs | Svatun's discussion states that two RCTs (D'Amicis; Martini) and one cross-sectional Italian study "found no significant association between consumption of espresso coffee and increased S-TC". Italian cup = 30 ml. | RCT, per Svatun | B · **source pending** (primaries not opened) | Svatun 2022 discussion |
| E8 | Time course (unfiltered, large dose) | 5–6 strong cups (0.9 L) cafetière/day for 24 wk vs filtered: **LDL +0.26 mmol/L (0.04–0.47) at 24 wk; +9–14% overall**. Triglycerides rose **26%** initially but **returned close to baseline within 6 months**. ALT +45% at 24 wk. All reversible after stopping. n = 46. | RCT | A (for that dose) | Urgert 1996 BMJ, PMID 8956701, DOI 10.1136/bmj.313.7069.1362 |
| E9 | Meta-analysis, total cholesterol | On average, drinking coffee for **45 days: TC +8.1 mg/dL (4.5–11.6), LDL +5.4 mg/dL (1.4–9.5), TG +12.6 mg/dL** (CI printed "3.5, 12.6" in the abstract, probably a typo; use point value only with caution). Larger for unfiltered and caffeinated, and in people with hyperlipidemia. 12 RCTs, 1,017 people. The daily cup number is not in the abstract. | RCT meta-analysis | A | Cai 2012, PMID 22713771, DOI 10.1038/ejcn.2012.68 |
| E10 | Meta-analysis, filtered vs unfiltered | Dose–response for TC and LDL (p < 0.01); larger with boiled coffee; "trials using filtered coffee demonstrated very little increase". | RCT meta-analysis | A | Jee 2001, PMID 11207153, DOI 10.1093/aje/153.4.353 |
| E11 | Boiled coffee observed | ≥ 6 cups/day boiled or plunger: TC **+0.30 mmol/L (women), +0.23 (men)**. ≥ 6 filtered: +0.11 mmol/L women, not significant in men. | association | B | Svatun 2022 |
| E12 | HDL with coffee | **Not in any abstract read.** | | ? | Needs full text of Jee 2001 / Cai 2012 or a dedicated analysis |

### 2b. Other markers

| ID | Marker | Effect (size, units, time) | Causal or association | Level | Source |
|---|---|---|---|---|---|
| E13 | Type 2 diabetes | Versus none or rare coffee, RR **0.92 (0.90–0.94) for 1 cup/day, 0.85 for 2, 0.79 for 3, 0.75 for 4, 0.71 for 5, 0.67 for 6**. Per +1 cup: caffeinated 0.91, decaf 0.94. 28 cohorts, 1.1 M people, follow-up 10 months to 20 years. "Cup" size is not defined in the abstract. | association | A (consistent) but not causal | Ding 2014, PMID 24459154, DOI 10.2337/dc13-1203 |
| E14 | T2D, applied to espresso | One 30 ml shot has about **¼ of the caffeine of one 237-ml brewed cup** (63 vs about 95 mg, our assumption, not read). The Ding RR cannot be transferred shot-for-cup. Decaf also lowered risk, so caffeine is not the whole story. Show **"RR ≈ 0.92 per cup-equivalent; 1 shot ≈ less than 1 cup"** with a caveat; do not give a number for 1 shot. | n/a | ? | Ding 2014 |
| E15 | Blood pressure, regular habit | RCTs ≥ 7 days: **coffee** (median 725 ml/day) SBP **+1.22 mmHg (0.52–1.92)**, DBP +0.49 (−0.06 to 1.04); **caffeine** (median 410 mg/day) SBP **+4.16 (2.13–6.20)**, DBP +2.41. 16 RCTs, 1,010 people. | RCT meta-analysis | A | Noordzij 2005, PMID 15834273 |
| E16 | BP, other meta-analysis | 10 RCTs: SBP **−0.55 mmHg (−2.46 to 1.36)**, DBP −0.45 (−1.52 to 0.61). Cohorts: hypertension RR **1.03 (0.98–1.08)**. "Low-quality evidence", no significant effect. | RCT + cohort meta-analysis | B | Steffen 2012, PMID 23032138 |
| E17 | Hypertension, cohorts | 13 cohorts, 314,827 people: RR **0.97 (0.90–1.05)**, not significant. Another meta-analysis: **−1% risk per extra cup** (linear). | association | B | Han 2022, PMID 36413800; Grosso 2017, PMID 28817085 |
| E18 | Tolerance | After 5 days of regular caffeine (300 or 600 mg/day), 250 mg still raised BP; **half of 97 subjects lost the BP response fully, half lost none**. | RCT crossover | A | Lovallo 2004, PMID 14967827 |
| E19 | BP, our estimate | Scaling Noordzij's caffeine slope (4.16 mmHg at 410 mg): 1 shot 63 mg → 4.16 × 63/410 = **+0.6 mmHg SBP**; 3 shots 189 mg → **+1.9 mmHg**. Upper bound: assumes no tolerance. Cohorts show no hypertension signal. | derived | C | E15 |
| E20 | Mortality | Versus none: **3–4 cups/day all-cause mortality RR 0.83 (0.79–0.88), cardiovascular mortality 0.81 (0.72–0.90), CVD 0.85 (0.80–0.90)**. Umbrella review of 201 observational meta-analyses. Authors say RCTs are needed to know whether causal. | association | B | Poole 2017, PMID 29167102, DOI 10.1136/bmj.j5024 |
| E21 | Bone | "Association between coffee drinking and risk of **fracture in women** but not in men." No size in abstract. | association | B (direction only) | Poole 2017 |
| E22 | Uric acid and gout | Coffee lowers serum uric acid; effective amount **1–3 cups/day men, 4–6 cups women**; ≥ 1 cup/day associated with lower gout risk. 9 studies, 175,310 people. No size in the abstract. | association | B | Park 2016, PMID 26905267 |
| E23 | Weight | Cafestol 12 mg/day (6 mg twice) for 12 wk in people with raised waist circumference: weight **−2%**, visceral fat **−5%**, GGT **−15%** vs placebo; no change in insulin sensitivity. Small RCT; a supplement dose, not coffee. | RCT | B | Mellbye 2024, PMC11478357 |
| E24 | Sleep, daily intake | Meta-analysis of caffeine given before bed: **total sleep time −45 min, sleep efficiency −7%, onset latency +9 min**, deep sleep −11.4 min. Coffee (107 mg per 250 ml) should be taken **≥ 8.8 h before bedtime**. These are acute, mostly high doses, not 63 mg. | RCT meta-analysis | A (acute) | Gardiner 2023, PMID 36870101, DOI 10.1016/j.smrv.2023.101764 |
| E25 | Sleep, habitual | Mendelian randomisation (UK Biobank n = 485,511; HypnoLaus n = 1,702): **≥ 4 caffeinated drinks/day shorten total sleep by 11–229 min**; self-rated sleep quality did not differ. One week of caffeine abstinence in habitual users with poor sleep did **not** change total sleep time or efficiency (n = 66). | genetic-causal / small trial | B | Stucky 2025, PMID 41109744; Irish 2021, PMID 32374052 |
| E26 | Sleep, EFSA | Single doses of **100 mg** (about 1.4 mg/kg) may affect sleep in some adults, especially near bedtime. 1 shot is 63 mg; 3 shots in one go (189 mg) exceeds it. | official body | A | EFSA 2015 caffeine opinion (efsa.europa.eu/en/efsajournal/pub/4102, DOI 10.2903/j.efsa.2015.4102), read via search summary; Wiley page blocked. **source pending** for exact wording |
| E27 | Pregnancy | **≤ 200 mg caffeine/day** (all sources) no concern for the fetus; adults ≤ 400 mg/day; single doses ≤ 200 mg. 1 shot = 63 mg (32% of 200 mg); **3 shots = 189 mg (95%)**, leaving almost no room for tea, cola or chocolate. Real shots vary up to 322 mg (espresso.md P3). | official body | A | EFSA 2015 (as E26) |
| E28 | Pregnancy, observed | High vs low/no coffee: low birth weight **OR 1.31 (1.03–1.67)**, pregnancy loss **OR 1.46 (1.06–1.99)**, preterm birth first trimester 1.22 (1.00–1.49). | association | B | Poole 2017 |

---

## 3. Cola daily (1 can = 330 ml, 35 g sugar)

| ID | Marker | Effect (size, units, time) | Causal or association | Level | Source |
|---|---|---|---|---|---|
| C1 | Liver fat | RCT in overweight adults (n = 47): **1 L/day regular cola for 6 months** → liver fat **+132–143%** (relative change vs milk, diet cola, water; P < 0.01), skeletal-muscle fat +117–221%, visceral fat +24–31%. Total fat mass: no significant difference. | RCT (small, 6 mo) | A for direction, B for size | Maersk 2012, AJCN, PMID 22205311, DOI 10.3945/ajcn.111.022533 |
| C2 | Liver fat, 1 can | 1 L cola ≈ 106 g sugar (35 g × 1000/330); 1 can = 0.33 of that. Linear scaling: **+44–47% relative** (132–143% × 0.33). Start level was not read, so absolute % liver fat is unknown. Dose–response at low dose is not shown and may be non-linear. | derived | C | C1 |
| C3 | Triglycerides | Maersk: regular cola **+32%** vs the other three groups (P < 0.01), at 1 L/day, 6 mo. Pooled RCTs of higher vs lower free sugar: **+0.11 mmol/L (0.07–0.15), about +10 mg/dL**. Hernández-Cordero (n = 240 women): swapping SSB for water, TG −28.9 vs +8.5 mg/dL in obese women only; no effect in the full group at 9 mo. | RCT | A (direction), B (size) | Maersk 2012; Te Morenga 2014, PMID 24808490, DOI 10.3945/ajcn.113.081521; Hernández-Cordero 2014, PMID 25332472 |
| C4 | TG, 1 can | 32% × 0.33 ≈ **+10%** (upper estimate; baseline TG not read, so mg/dL not given). Meta-analysis gives about +10 mg/dL for any higher-sugar diet; sugar dose in those trials was not in the abstract. | derived | C | C3 |
| C5 | Total cholesterol | Maersk **+11%** (1 L, 6 mo). Meta-analysis: **+0.16 mmol/L (0.10–0.24)**, about +6 mg/dL. 1 can: 11% × 0.33 ≈ **+3.6%** (C). | RCT | A / C | Maersk 2012; Te Morenga 2014 |
| C6 | LDL | Meta-analysis higher vs lower sugar: **+0.12 mmol/L (0.05–0.19), about +4.6 mg/dL**. Fructose-sweetened beverages at 25% of energy for 10 weeks raised fasting LDL, apoB, small-dense and oxidised LDL; glucose did not. Fasting TG rose about 10% on glucose drinks, not fructose drinks. | RCT | A (direction) | Te Morenga 2014; Stanhope 2009, PMID 19381015, DOI 10.1172/JCI37385 |
| C7 | Stanhope dose context | 25% of energy ≈ 500 kcal/day for a 2,000 kcal diet (our assumption); one can = 140 kcal ≈ **7%** of energy (35 g × 4 ÷ 2000). So one can is about **¼ of the Stanhope dose**; linear scaling is a guess. | derived | C | C6 |
| C8 | HDL | Meta-analysis: **+0.02 mmol/L (0.00–0.03)** higher with more sugar, which is practically zero. | RCT meta-analysis | B (null-ish) | Te Morenga 2014. Note: epidemiology often links SSB to lower HDL; not read here |
| C9 | Type 2 diabetes | Per **1 serving/day**: incidence **+18% (9–28%)**, or **+13% (6–21%)** after adjusting for adiposity. 17 cohorts, 38,253 cases. High heterogeneity (I² 79–89%). Serving size is not defined in the abstract. | association | A (consistent) but not causal | Imamura 2015 BMJ, PMID 26199070, DOI 10.1136/bmj.h3576 |
| C10 | T2D, absolute (our math) | The paper's modelled 10-year event rate: US **11.0%**, UK **5.8%**. 11.0% × 0.13 = **+1.4 percentage points**; 5.8% × 0.13 = **+0.75 points** over 10 years, assuming the adiposity-adjusted RR is causal and the serving ≈ a can. Population attributable fraction: US 8.7%, UK 3.6%. | derived | C | C9 |
| C11 | Hypertension | Per +1 serving/day: incident hypertension **RR 1.08 (1.04–1.12)**; coronary heart disease **1.17 (1.10–1.24)**; stroke 1.06 (0.97–1.15, not significant). | association | B | Xi 2015, PMID 25735740, DOI 10.1017/S0007114514004383 |
| C12 | Blood pressure, trials | Sugar trials ≥ 8 weeks: SBP **+6.9 mmHg (3.4–10.3)**, DBP +5.6 (high vs low sugar; dose not in abstract). Maersk: milk and diet cola lowered SBP by 10–15% vs regular cola. | RCT | B | Te Morenga 2014; Maersk 2012 |
| C13 | Body weight, adults | RCTs adding SSB: **+0.85 kg (0.50–1.20)** (5 trials, n = 292, duration not in abstract). Cohorts: per daily serving **+0.12 to +0.22 kg per year**. In Maersk's 6-month trial total fat mass did not differ between groups. | RCT + cohort | A (direction) | Malik 2013, PMID 23966427, DOI 10.3945/ajcn.113.058362; Maersk 2012 |
| C14 | Weight, 1 can (our math) | 0.12–0.22 kg/yr × 5 yr = **0.6–1.1 kg after 5 years** (linear; cohort estimates, 1-year slope). Liquid-calorie compensation was not quantified in the sources read. | derived | C | C13 |
| C15 | Uric acid and gout | Men, 12 y, vs < 1 serving/month: gout RR **1.45 (1.02–2.08) for 1 serving/day**, 1.29 (1.00–1.68) for 5–6/week, 1.85 (1.08–3.16) for ≥ 2/day. Diet soft drinks: no link. Women not studied here. | association (men only) | B | Choi & Curhan 2008 BMJ, PMID 18244959, DOI 10.1136/bmj.39449.819271.be |
| C16 | Uric acid, trial | Title only read: sucrose-sweetened soft drinks raised plasma uric acid in overweight people (Bruun 2015, PMID 26081486). Size not read. | RCT | B (direction) · **source pending** | epmc title |
| C17 | Dental caries | Cohort evidence of moderate quality: **caries is lower when sugars < 10% of energy**; lower still at < 5% (low quality). One can = about 7% of a 2,000 kcal diet and 140% of the WHO 5% target (25 g) (cola.md P9c). No per-can caries number exists in the sources read. Enamel erosion from cola acidity: not researched. | association | B (caries), ? (can-level, erosion) | Moores 2022, PMID 35302414; Moynihan 2016, PMID 26773022 |
| C18 | Bone density | Women with **daily cola** intake had BMD **3.7% lower at the femoral neck and 5.4% lower at Ward's area** vs < 1 serving/month; no effect at the spine; **not in men**. Diet cola showed similar results, so sugar is not the cause. 1,413 women, 1,125 men. | association (cross-sectional) | B | Tucker 2006 AJCN, PMID 17023723, DOI 10.1093/ajcn/84.4.936 |
| C19 | Mortality | Per **250 ml/day** SSB: all-cause RR **1.07 (1.03–1.11)**, stroke 1.09, cancer 1.17 (non-linear). High vs low intake: CVD mortality +13%. | association | B | Wang 2022, PMID 35215425, DOI 10.3390/nu14040777 |
| C20 | Mortality, 1 can (our math) | 330/250 = 1.32; RR = 1.07^1.32 = **1.09** (ln 1.07 = 0.0677; × 1.32 = 0.0893; e^0.0893 = 1.093). Assumes log-linear. | derived | C | C19 |
| C21 | Sleep | Cola has about 9 mg caffeine/100 g (cola.md P3) = about 30 mg per can, below EFSA's 100 mg sleep-relevant single dose. No long-term cola sleep data read. | | C / ? | EFSA 2015 (see E26), cola.md |
| C22 | Pregnancy | Caffeine in a can (about 30 mg) counts toward EFSA's 200 mg/day. No SSB-specific pregnancy data were researched. | | ? | EFSA 2015 |

---

## 4. Suggested display

General rule: draw the **reference bar** (section 1) with a **tick for "typical adult"** only if the user supplies their own value; otherwise show the **shift** (arrow + size). Each shift should carry label "association" or "trial" and a level badge. Never show a personal prediction.

| Marker | Espresso 1/day | Espresso 3/day | Cola 1 can/day |
|---|---|---|---|
| LDL / total cholesterol | **≈ +0.8 mg/dL (≈ +0.02 mmol/L)**: effectively zero; "below measurement error". C. Math: 1.6 mg cafestol × 0.13 mmol/L per 10 mg. Note: filtered/instant coffee ≈ 0. | **≈ +2.5 mg/dL (+0.06 mmol/L)**, appears within weeks, reverses after stopping. C. Observed in Tromsø: 3–5 cups, +0.09–0.16 mmol/L (association, B). | TC **≈ +3.6%** (Maersk 11% × 0.33), LDL meta-analysis range +0.12 mmol/L (≈ +4.6 mg/dL) for sugar-rich diets. C. Dose unclear, so show as a range "0 to +5 mg/dL". |
| HDL | no data (?) | no data (?) | ≈ 0 (+0.02 mmol/L, B) |
| Triglycerides | ≈ 0; transient rise with unfiltered large doses (Urgert: +26%, back to baseline by 6 mo). C/B | same; no number | **≈ +10%** (Maersk 32% × 0.33) or ≈ +10 mg/dL from meta-analysis; C |
| Type 2 diabetes | RR **< 1 (protective association)**; no number for 1 shot (E14). ? | RR roughly 0.85–0.92 if 3 shots ≈ 1–2 cups; do not claim. ? | RR **1.13–1.18**; absolute **+0.75 to +1.4 points over 10 y** (UK/US baselines). A for association, C for absolute |
| Blood pressure | **+0.6 mmHg** (upper bound); cohort hypertension RR 0.97 (ns). C / B | **+1.9 mmHg** upper bound; tolerance in half of people. C | hypertension RR **1.08**; trial SBP effect of sugar large (+6.9 mmHg) but dose unknown. B |
| Body weight | no effect expected; cafestol RCT: −2% (supplement only). ? | same | **+0.6–1.1 kg after 5 years** (0.12–0.22 kg/yr). C |
| Liver fat | not studied; cafestol RCT reduced visceral fat 5%. ? | ? | **≈ +44–47% relative** (linear scaling), shown as "up to" and labelled "trial at 1 L, scaled down". C |
| Uric acid / gout | lower (association; 1–3 cups in men). B | same | men: gout RR **1.45** per daily serving. B |
| Dental | not researched (?) | ? | caries risk higher when sugars > 10% energy; one can = 7% of energy. B |
| Bone | fracture association in women (size not read). B | same | women: **−3.7% femoral-neck BMD** (also with diet cola). B |
| Mortality | 1 cup-equivalent: size not read; 3–4 cups: **RR 0.83**. B | RR 0.83 only for 3–4 full cups; 3 shots ≈ fewer cups; show as range 0.83–1.0. B | **RR 1.09** (1.07^1.32). C |
| Sleep | 63 mg: below EFSA's 100 mg; keep ≥ 8.8 h before bed if effects (Gardiner). B | 189 mg total; any single dose > 100 mg late in the day can shorten sleep. A | about 30 mg per can; low. C |
| Pregnancy | 63 mg = 32% of 200 mg/day | 189 mg = **95% of limit** | about 30 mg ≈ 15% of limit |

Show with each espresso bar a "brew type" selector: espresso 1.6 mg cafestol per shot vs French press/boiled 35 mg per 150 ml cup (about 20 times more) vs filter 0.75 mg.

---

## 5. Open questions

1. **Cafestol per espresso shot** comes from a secondary quote (Svatun citing Moeenfard). Open the primary and get kahweol content too; the 0.13 mmol/L slope is for cafestol plus equal kahweol.
2. **Espresso RCTs (D'Amicis, Martini)**: read the primaries; they could replace the derived E5/E6 with measured data.
3. **Coffee and HDL/triglycerides** at ordinary doses: not found in abstracts; need full text of Jee 2001 and Cai 2012 (the Cai TG confidence interval "3.5, 12.6" looks like a typo).
4. **Cup size** in the coffee–diabetes and mortality meta-analyses (Ding, Poole): need the per-study cup definitions to map 1 shot onto "cups".
5. **Imamura "serving"** size (probably about a can; verify in the full text, PMC4510779).
6. **Liver-fat and TG dose–response below 1 L**: no data. Stanhope-type trials at 10–25% of energy exist; a low-dose RCT would settle the linear-scaling assumption.
7. **Enamel erosion** from cola acidity: not researched. Per-can caries risk: unknown.
8. **Uric acid trial size** (Bruun 2015, PMID 26081486): open abstract.
9. **Reference sources still pending**: ESC/EAS 2019 TG/HDL wording (full guideline), ADA 2023 wording (PMC9810477 full text failed), AHA TG statement, uric acid thresholds (primary).
10. **Women, older adults, CYP1A2 slow metabolisers**: BP and sleep responses differ; not quantified.
11. **Coffee BP tolerance**: Lovallo shows half of people keep the BP response; show as a range, not a mean.
12. Cola's caffeine effects over years (sleep, BP) are confounded by sugar and not separately studied in the sources read.
