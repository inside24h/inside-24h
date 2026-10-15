# Physical activity as an input — evidence for the health bars

Status: **draft v1** · 2026-10-08 · Levels: **A** established · **B** supported, variable · **C** our estimate (math shown) · **?** unknown.
Every number was read in an abstract (via `epmc.py abs` / Europe PMC REST) or on an official page in this session, unless marked **source pending**.
**Causal vs. association:** RCT or RCT meta-analysis = causal for the tested dose and population. Cohort = association only (confounding, reverse causation: sick people walk less). Steps/mortality rows are all cohort data.

---

## 1. Steps, mortality, CVD (all cohort = association)

| ID | Claim | Level | Source |
|---|---|---|---|
| S1 | Pooled 15 cohorts, n = 47,471, 3,013 deaths, median follow-up 7.1 y. Quartile median steps: Q1 3,553 / Q2 5,801 / Q3 7,842 / Q4 10,901. Adjusted HR for all-cause mortality vs Q1: **Q2 0.60 (0.51–0.71), Q3 0.55 (0.49–0.62), Q4 0.47 (0.39–0.57)** | A (consistent cohorts, not causal) | Paluch 2022 Lancet Public Health, PMID 35247352, DOI 10.1016/s2468-2667(21)00302-9 |
| S2 | **Plateau by age:** risk fell progressively up to **6,000–8,000 steps/day in adults ≥ 60 y** and up to **8,000–10,000 steps/day in adults < 60 y** | A (assoc.) | Paluch 2022 (same) |
| S3 | Stepping rate (cadence) adds little once total steps are counted (peak-30-min cadence HR 0.67 attenuated but significant in Paluch; not significant in NHANES after adjusting for steps: HR 0.90, 0.65–1.27) | B | Paluch 2022; Saint-Maurice 2020 JAMA, PMID 32207799 |
| S4 | NHANES, n = 4,840, 10.1 y, 1,165 deaths. Incidence per 1,000 person-years: **76.7** (<4,000 steps), **21.4** (4,000–7,999), **6.9** (8,000–11,999), **4.8** (≥12,000) (unadjusted). Adjusted HR vs 4,000 steps/day: **8,000 steps 0.49 (0.44–0.55); 12,000 steps 0.35 (0.28–0.45)** | A (assoc.) | Saint-Maurice 2020, PMID 32207799, DOI 10.1001/jama.2020.1382 |
| S5 | **HR per 1,000 steps:** each +1,000 steps = **HR 0.85 (0.81–0.91) all-cause mortality** (17 cohorts, n = 226,889, median follow-up 7.1 y); each +500 steps = **HR 0.93 (0.91–0.95) CV mortality**. Non-linear (P < 0.001): benefit above a reference of 3,867 steps (all-cause) and 2,337 (CV mortality) | A for direction, B for slope (heterogeneous cohorts, reference groups differ) | Banach 2023 Eur J Prev Cardiol, PMID 37555441, DOI 10.1093/eurjpc/zwad229 |
| S6 | Newest meta-analysis (57 studies / 35 cohorts; 31 studies in dose-response). Inflection points at **~5,000–7,000 steps/day** for all-cause mortality, CVD incidence, dementia, falls. **7,000 vs 2,000 steps/day:** all-cause mortality **HR 0.53 (0.46–0.60)**; CVD incidence **0.75 (0.67–0.85)**; CVD mortality **0.53 (0.37–0.77)**; cancer mortality 0.63 (0.55–0.72); **type 2 diabetes 0.86 (0.74–0.99)**; dementia 0.62; **depressive symptoms 0.78 (0.73–0.83)**; falls 0.72. Cancer incidence 0.94 (0.87–1.01), not significant. GRADE moderate for most outcomes. Authors: 7,000 is a realistic target; 10,000 viable for the more active | A (assoc., GRADE moderate) | Ding 2025 Lancet Public Health, PMID 40713949, DOI 10.1016/s2468-2667(25)00164-1 |
| S7 | Our per-1,000 conversion of S6: HR 0.53 over +5,000 steps → 0.53^(1/5) = **0.88 per +1,000 steps** (compare S5 0.85). Assumes a log-linear curve, but S6 itself says the curve flattens, so it is only valid between ~2,000 and ~7,000. | C | S6 math |
| S8 | "10,000 steps" has no special threshold in the data: curves flatten at 6,000–10,000 depending on age (S2, S6). Tiers <5,000 / 5,000–10,000 / >10,000 are therefore reasonable, but the top tier adds only a small extra benefit. | B | S1, S2, S6 |

## 2. WHO guideline and benefit of meeting it

| ID | Claim | Level | Source |
|---|---|---|---|
| G1 | WHO 2020: all adults **150–300 min moderate** or **75–150 min vigorous** aerobic activity per week (or equivalent mix); regular muscle-strengthening recommended; reduce sedentary behaviour (evidence insufficient to give a threshold). "Some activity is better than none; more is better." | A | Bull 2020 BJSM, PMID 33239350, DOI 10.1136/bjsports-2020-102955 (abstract) |
| G2 | The "muscle strengthening on **2 or more days/week**" figure was **not** in the abstract or the WHO fact-sheet text I could read. | source pending | open the WHO guideline document itself |
| G3 | WHO fact sheet: insufficiently active people have a **20–30% increased risk of death** vs sufficiently active | A (assoc., official) | WHO Physical activity fact sheet, who.int/news-room/fact-sheets/detail/physical-activity (page read) |
| G4 | Pooled 6 US/EU cohorts, n = 661,137, 116,686 deaths, 14.2 y. Mortality HR vs no leisure activity: **0.80 (0.78–0.82)** below the minimum (<7.5 MET-h/wk); **0.69 (0.67–0.70)** at 1–2× the minimum (= guideline); **0.63 (0.62–0.65)** at 2–3×; **0.61 (0.59–0.62)** at 3–5× (plateau); **0.69 (0.59–0.78)** at ≥ 10× (no harm). Same pattern for CVD and cancer mortality | A (assoc.) | Arem 2015 JAMA Intern Med, PMID 25844730, DOI 10.1001/jamainternmed.2015.0533 |
| G5 | Accelerometer cohorts (8 studies, n = 36,383, 2,149 deaths, 5.8 y): total activity quartiles HR **1.00 / 0.48 / 0.34 / 0.27**; light activity **1.00 / 0.60 / 0.44 / 0.38**; moderate-vigorous **1.00 / 0.64 / 0.55 / 0.52**. Any intensity counts. Quartile cut-offs not in abstract. | B (assoc.) | Ekelund 2019 BMJ, PMID 31434697, DOI 10.1136/bmj.l4570 |

## 3. Exercise and bars

### 3a. Sleep

| ID | Claim | Level | Source |
|---|---|---|---|
| Z1 | Meta-analysis of 66 studies: **regular exercise** has small benefit on total sleep time and sleep efficiency, **small-to-medium on sleep-onset latency**, **moderate on sleep quality**. Acute exercise: small benefit on total sleep time, onset latency. Moderators: sex, age, baseline activity, exercise type, time of day, duration. **No moderation by intensity.** Effect sizes (g) not in abstract. | B | Kredlow 2015 J Behav Med, PMID 25596964, DOI 10.1007/s10865-015-9617-6 |
| Z2 | RCTs in people **with insomnia** (9 studies, n = 557): Pittsburgh Sleep Quality Index **−2.87 points (−3.95 to −1.79)**, Insomnia Severity Index **−3.22 points (−5.36 to −1.07)**; sleep efficiency no change (−0.56%). GRADE low/very low; high selection-bias risk | B (RCT, but patients, low quality) | Banno 2018 PeerJ, PMID 30018855, DOI 10.7717/peerj.5172 |
| Z3 | Steps and sleep: **not found** in the sources read. | ? | needs a steps–sleep cohort/RCT |

### 3b. Glucose / insulin

| ID | Claim | Level | Source |
|---|---|---|---|
| M1 | RCTs, **non-diabetic sedentary adults**, combined aerobic + resistance training (24 RCTs): fasting glucose **SMD −0.47 (−0.83 to −0.12)**, fasting insulin **SMD −1.02 (−1.50 to −0.55)**, HOMA-IR **SMD −0.95 (−1.45 to −0.44)**; **HbA1c: no significant effect**. SMD in mg/dL not given in abstract. | A for direction (RCT MA), size B (high heterogeneity likely, CIs wide) | Silva 2024 Sci Rep/PMC10803738, PMID 38253590 |
| M2 | Overweight/obese adults, exercise alone vs control (Cochrane, 43 RCTs, n = 3,476): **fasting glucose −0.2 mmol/L (−0.3 to −0.1)** (about −3.6 mg/dL, conversion ours ×18.0), triglycerides −0.2 mmol/L, diastolic BP −2 mmHg, **improved even if no weight lost**. Higher intensity: further −0.3 mmol/L glucose | A (RCT MA, 2006 data) | Shaw 2006 Cochrane, PMID 17054187, DOI 10.1002/14651858.cd003817.pub3 |
| M3 | Steps and T2D incidence: HR 0.86 (0.74–0.99) at 7,000 vs 2,000 steps | A (assoc.) | S6 |

### 3c. Lipids

| ID | Claim | Level | Source |
|---|---|---|---|
| L1 | 148 RCTs, n = 8,673, exercise vs sedentary control (mean differences, mg/dL): **TC −5.90 (−8.14, −3.65); HDL +2.11 (1.43, 2.79); LDL −7.22 (−9.08, −5.35); TG −8.01 (−10.45, −5.58)** — "modest, 3.5–11.7%". Combined aerobic + resistance best. Prediction intervals: TC, HDL, LDL, TG improved in only ~one-quarter of studies. | A (RCT MA, modest, variable) | Smart 2025 Sports Med, PMID 39331324, DOI 10.1007/s40279-024-02115-z |
| L2 | **HDL +2.53 mg/dL** (25 RCTs). **Minimum weekly volume for HDL gain: ~900 kcal/week or ~120 min/week.** +1.4 mg/dL per extra 10 min per session; **no association with frequency or intensity**. Larger gain in people with BMI < 28 and TC ≥ 220 mg/dL | A (RCT MA, 1966–2005) | Kodama 2007 Arch Intern Med, PMID 17533202, DOI 10.1001/archinte.167.10.999 |
| L3 | Smart meta-regression: each extra weekly aerobic session lowered TC by 7.68 mg/dL (as printed in abstract; unit of the other slope ambiguous in the abstract) | B · treat with caution | Smart 2025 |

### 3d. Weight, waist, liver fat

| ID | Claim | Level | Source |
|---|---|---|---|
| F1 | Exercise alone gives **small** weight loss vs no treatment; exercise + diet beat diet alone by **−1.1 kg (−1.5 to −0.6)**; higher intensity extra −1.5 kg (−2.3 to −0.7) (overweight/obese adults) | A (RCT MA) | Shaw 2006, PMID 17054187 |
| F2 | **Liver fat falls with exercise even with minimal or no weight loss**: 12 controlled trials, ES **−0.37 (−0.69 to −0.06)** after omitting diet+exercise-vs-diet trials; no effect on ALT (ES −0.15). Benefit seen below the exercise levels recommended for weight loss | A (RCT MA, small trials) | Keating 2012 J Hepatol, PMID 22414768, DOI 10.1016/j.jhep.2012.02.023 |
| F3 | RCT, 8 weeks, inactive overweight/obese adults, n = 47 (12/group): liver fat fell **−2.38 pp (3 d/wk, 45 min, 70% VO2peak)**, **−2.62 pp (4 d/wk, 60 min, 50%)**, **−0.84 pp (3 d/wk, 45 min, 50%)** vs **+1.10 pp placebo**; visceral fat −213 to −387 cm³ vs +93 cm³; **no clinically significant weight loss; no dose/intensity difference** | A for direction, B for size (n = 12/arm) | Keating 2015 J Hepatol, PMID 25863524, DOI 10.1016/j.jhep.2015.02.022 |
| F4 | Waist circumference without weight loss: **no meta-analysis found** that I read. | ? | |

### 3e. Quality of life / mental health

| ID | Claim | Level | Source |
|---|---|---|---|
| Q1 | 15 cohorts, n = 191,130: vs no activity, **half the recommended volume (4.4 marginal MET-h/wk): 18% (13–23%) lower depression risk; full recommended volume (8.8): 25% (18–32%) lower**; diminishing returns above. Curvilinear: steepest benefit at low volumes. ~11.5% of cases potentially preventable if inactive met the guideline (assuming causality) | A for direction (assoc.); causal size B | Pearce 2022 JAMA Psychiatry, PMID 35416941, DOI 10.1001/jamapsychiatry.2022.0609 |
| Q2 | Depressive symptoms HR 0.78 (0.73–0.83) at 7,000 vs 2,000 steps/day | A (assoc.) | S6 |
| Q3 | **Treatment** RCTs in people **with major depression** (218 studies, n = 14,170): walking/jogging g **−0.62 (−0.80 to −0.45)** vs active controls; yoga −0.55; strength −0.49. Effect proportional to intensity. GRADE low/very low. **Not evidence for healthy people.** | B (RCT, clinical population) | Noetel 2024 BMJ, PMID 38355154, DOI 10.1136/bmj-2023-075847 |

## 4. Energy cost of walking and running

| ID | Claim | Level | Source |
|---|---|---|---|
| E1 | ACSM metabolic equations (mL O2·kg⁻¹·min⁻¹, speed S in m/min, grade G as fraction): **walking VO2 = 0.1·S + 1.8·S·G + 3.5** (valid ~50–100 m/min); **running VO2 = 0.2·S + 0.9·S·G + 3.5** (valid > ~134 m/min). **~5 kcal per litre O2**. The 3.5 term is resting. | A (standard equations) | open-exam-prep.com/study-guides/acsm-cep/exercise-physiology/metabolic-calculations (page read; secondary summary of ACSM Guidelines, **source pending** vs. the ACSM text itself); validated vs measurement in E3 |
| E2 | **Our derivation, net of rest, level ground (G = 0):** the speed-dependent term gives walking 0.1 mL/kg/m = 100 mL/kg/km = 0.1 L × 5 = **0.5 kcal/kg/km**; running 0.2 mL/kg/m → **1.0 kcal/kg/km**. Independent of speed. **Gross** (including rest) at 5 km/h walking (12 min/km): (100 + 3.5×12) = 142 mL/kg/km → **0.71 kcal/kg/km**; running at 10 km/h (6 min/km): (200 + 21) = 221 → **1.10 kcal/kg/km**. So the "0.5–0.7 walking, ~1 running" rule of thumb is net-to-gross. | C | E1, math shown |
| E3 | Measured (indirect calorimetry, 24 people, treadmill, 1,600 m): walking at 1.41 m/s (5.1 km/h) **340 ± 14 kJ**, running at 2.82 m/s (10.2 km/h) **481 ± 20 kJ**. = **51 and 72 kcal per km** (kJ ÷ 4.184 ÷ 1.6). ACSM, Leger and Pandolf equations predicted within ~20 kJ; McArdle table over-estimated. Body mass not in abstract, so kcal/kg/km not checked directly. | A (measured; supports E1) | Hall 2004 Med Sci Sports Exerc, PMID 15570150, DOI 10.1249/01.mss.0000147584.87788.0e |
| E4 | Worked example (C): 70 kg, 5 km. Net: walk 0.5 × 70 × 5 = **175 kcal**; run 1.0 × 70 × 5 = **350 kcal**. Gross walk 0.71 × 350 = 249 kcal. E3 check: 5 km walk × 51 = 254 kcal (consistent with gross, 70 kg assumed). | C | E1–E3 |

## 5. Does exercise offset sugary drinks?

| ID | Claim | Level | Source |
|---|---|---|---|
| D1 | UK Biobank, n = 153,862, 11.8 y, 6,631 incident T2D: **SSB > 2 units/day vs 0: HR 1.17 (1.05–1.31)**. **No significant interaction between physical activity and SSB** (P-interaction 0.204) — i.e. no evidence that being active cancelled the SSB–diabetes association (low-power tests of interaction can miss effects, so absence of proof is not proof of absence). Activity was by questionnaire (IPAQ) | B (assoc.) | Ding 2024 Nutr J, PMID 39511567, PMC11542413 |
| D2 | SSB amplifies the genetic risk of obesity (BMI per 10 risk alleles: 1.00 → 1.78 from <1/month to ≥1/day). Physical activity was **not** the modifier in the abstract. | B (assoc.) | Qi 2012 NEJM, PMID 22998338, DOI 10.1056/nejmoa1203039 |
| D3 | **Calorie arithmetic only:** a 330 ml can ≈ 140 kcal (long-term.md). Net km needed = 140 ÷ (k × kg), k = 0.5 walk / 1.0 run. 70 kg: **4.0 km walk or 2.0 km run**; 90 kg: 3.1 / 1.6 km; 55 kg: 5.1 / 2.5 km. Says nothing about glucose spikes, liver fat or the SSB–disease association (D1), and assumes no extra eating afterwards. | C | E1, D1 |
| D4 | Studies where activity stratifies SSB–**weight gain**: **none read.** | ? | would need a targeted search (e.g. Nurses' Health / HPFS SSB-weight-change papers stratified by activity) |

## 6. Sedentary time

| ID | Claim | Level | Source |
|---|---|---|---|
| T1 | Sedentary time was associated, independent of physical activity, with: all-cause mortality **HR 1.24 (1.09–1.41)**, CV mortality 1.18, CVD incidence 1.14, cancer mortality 1.17, **type 2 diabetes 1.91 (1.64–2.22)**. More pronounced at low activity. 47 studies, mostly self-reported. | B (assoc.) | Biswas 2015 Ann Intern Med, PMID 25599350, DOI 10.7326/m14-1651 |
| T2 | 13 cohorts, 1,005,791 people: sitting > 8 h/day in the most active quartile (> 35.5 MET-h/wk, **about 60–75 min/day moderate activity**) had **HR 1.04 (0.99–1.10)**: no excess risk. Sitting > 8 h in the least active quartile: HR 1.59 (1.52–1.66). TV ≥ 3 h/day still raised risk unless very active. | B (assoc.) | Ekelund 2016 Lancet, PMID 27475271, DOI 10.1016/s0140-6736(16)30370-1 |
| T3 | Accelerometer sedentary time quartiles (least → most): HR 1.00 / 1.28 / 1.71 / 2.63 | B (assoc.) | Ekelund 2019 |

---

## Suggested bar rules (simplified, conservative)

Convention: all changes are **additive points on the 0–100 bar**, relative to the sedentary reference (<5,000 steps, no exercise, 0 km). Design anchor (C): a mortality HR of ~0.5 vs the least active ≈ **+10 points** on Health; other bars scale by how much the best evidence moves their marker. Steps tier, exercise tier and km are **partly overlapping** (walking km are in the step count), so caps are applied per bar and km is never added on top of steps for the same bar.

Derived input: **weekly net kcal = k × body mass (kg) × km/week**, k = 0.5 walk, 1.0 run (E1–E2). If walking and running km are not separated, use the walking k (conservative).

| Bar | Steps (<5k / 5–10k / >10k) | Exercise (none / 1–2× / 3+×) | km/week | Cap |
|---|---|---|---|---|
| **Health** | 0 / **+6** / **+8** | 0 / **+3** / **+5** | not used (covered by the other two) | **+12** |
| **Sleep** | 0 / 0 / 0 (Z3 = ?) | 0 / **+2** / **+4** | not used | +4 |
| **Sugar** (glycaemic resilience) | 0 / **+2** / **+3** | 0 / **+2** / **+4** | not used | +6 |
| **Cholesterol** | 0 / 0 / 0 (no evidence) | 0 / **+1** / **+3** | replace exercise score with 4 × min(1, weekly net kcal ÷ 900) if km is entered | +4 |
| **Fat** | 0 / **+1** / **+2** | 0 / **+2** / **+4** | add 3 × min(1, weekly net kcal ÷ 1,500) | +6 |
| **Life quality** | 0 / **+3** / **+4** | 0 / **+3** / **+4** | not used | +7 |

Rationale and math per bar:

- **Health (S1, S2, S4–S8, G4):** S1 Q2/Q3/Q4 HR 0.60/0.55/0.47 and S6 0.53 at 7,000. Anchor HR 0.5 = +10. Steps 5–10k (HR ~0.55–0.6, plateau 6–8k if ≥60 y) ≈ +6; >10k (HR 0.47, but flattening, S8) = +8, not +10. Exercise: G4 HR 0.80 below the guideline, 0.69 at guideline, 0.63 at 2–3× → 1–2 sessions (usually below 150 min) +3, 3+ sessions (about the guideline) +5. Sum capped at +12, because steps and exercise overlap (G5: light activity counts too). Association, not causation, so we do not go above the anchor.
- **Sleep (Z1, Z2):** Z1 gives "moderate" benefit on quality but no g in the abstract; Z2 PSQI −2.9 points on a 0–21 scale = ~14% of scale in insomniacs, a clinical group. In healthy people the effect is probably smaller, so max +4. 1–2 sessions = half (+2), because Z1 found moderation by duration/adherence. Steps: no evidence read, so 0 (honest "?").
- **Sugar (M1, M2, S6):** RCT evidence for fasting glucose/insulin from exercise; Shaw −0.2 mmol/L = −3.6 mg/dL is small against the 99→126 mg/dL normal-to-diabetes gap (27 mg/dL), so the bar gain stays small; HbA1c showed no effect (M1). Exercise 3+ = +4, 1–2 = +2. Steps: S6 T2D HR 0.86 at 7,000 → 0.86 vs a large anchor of HR 0.5 for +10 means ~+3 (14% vs 50%: 10 × 0.14/0.5 = +2.8); 5–10k +2, >10k +3. Cap +6.
- **Cholesterol (L1, L2, L3):** best-case changes are modest (HDL +2.1 mg/dL = +3–4% of a 55 mg/dL HDL; LDL −7.2 mg/dL ≈ −6% of 120). Exercise 3+ = +3, 1–2 = +1 because Kodama's minimum for HDL is ~120 min or 900 kcal per week (1–2 short sessions usually fall short; frequency itself did not matter, volume did). If km is given: credit = 4 × min(1, kcal ÷ 900). Example (C): 70 kg walking 20 km/wk = 0.5 × 70 × 20 = 700 kcal → 4 × 700/900 = +3.1; running 10 km/wk = 700 kcal → same. Steps give nothing here (no evidence).
- **Fat (F1–F3, E2):** exercise alone causes only small weight loss (F1), so weight-type credit is small; liver fat/visceral fat benefit is real even without weight loss (F2, F3). Exercise +2/+4; steps +1/+2. km term: the same net kcal figure, scaled so 1,500 kcal/week (about three 70-kg 6-km runs per week) earns the full +3. The 1,500 kcal/week scale is our choice (C), not from a source.
- **Life quality (Q1, Q2):** Q1: half guideline 18% lower depression risk, full guideline 25%, so 1–2 sessions ≈ 0.72 of the full guideline benefit: +3 vs +4 (0.18/0.25 = 0.72; 4 × 0.72 = 2.9). Steps from Q2 (HR 0.78 at 7,000 steps) agree in size → +3 (5–10k), +4 (>10k). Cap +7 (overlap). Q3 (treatment RCT) is not used for scoring healthy users.

**Kcal/km formula for the drink offset (C, from E1–E2):**

```
net_kcal  = k * body_mass_kg * km        k = 0.5 walking, 1.0 running
km_needed = drink_kcal / (k * body_mass_kg)
e.g. 140 kcal can, 70 kg: 4.0 km walking or 2.0 km running
```
Use net (above resting) because resting energy is spent anyway. If the app shows gross kcal, use 0.7 (walk, ~5 km/h) and 1.1 (run, ~10 km/h) kcal/kg/km (E2). Show the result as energy balance only; wording must not claim exercise cancels the metabolic effects of sugar (D1: no evidence of interaction; D4: unknown).

Optional (T1–T3): a small **sitting penalty** is justified (HR 1.24 mortality, 1.91 T2D independent of activity) but is mitigated at ~60–75 min/day of moderate activity (T2). The app has no sitting input, so none is proposed now.

---

## Open questions

1. **Muscle-strengthening "2+ days"** (G2) — need the WHO guideline text itself; no mortality dose-response for resistance training read.
2. **Step-to-km conversion** — no sourced figure for steps per km (depends on stride/height); needed to avoid double counting steps and km. Not researched.
3. **Waist circumference** without weight change (F4), HbA1c in non-diabetic adults (M1 shows no effect), and sleep onset in healthy adults in minutes (Kredlow printed g not in abstract) — all need full text.
4. **Steps and sleep/cholesterol** (Z3, no evidence found): bars deliberately get 0 from steps.
5. **Activity × SSB on weight gain** (D4); D1 is a single cohort with questionnaire activity.
6. **Age-specific steps targets** (S2: ≥60 y plateau at 6–8k, <60 y at 8–10k): should the app ask age? Ding 2025 explicitly lacked age-specific analysis.
7. **Bar magnitudes** (anchor "HR 0.5 = +10") are our design choice (C); Opus should confirm. Cohort HRs are associations (reverse causation likely inflates them; Paluch/Saint-Maurice adjusted for baseline illness but residual confounding remains).
8. **Secondary sources:** ACSM equations (E1) read via a study-guide page, not the ACSM text; 5 kcal/L is a standard conversion. Should be verified against the ACSM Guidelines or Pandolf/Leger (Hall 2004 supports the equations).
9. **Compensatory eating** after exercise (offsets part of the kcal deficit) — not researched; kcal offset therefore an upper bound.

## Walking after meals (tip "A 10-minute easy walk after eating makes the sugar spike smaller", app content/tips.ts)

| ID | Finding | Level | Source |
|---|---|---|---|
| PW1 | Meta-analysis of 7 one-day randomised crossover trials (mixed-sex adults, mostly overweight/obesity): breaking up sitting with frequent short bouts of light-intensity walking lowered postprandial glucose vs continued sitting (SMD −0.72, 95% CI −1.03 to −0.41) and insulin (SMD −0.83); walking beat standing for glucose (SMD −0.30). No effect on SBP. | B (small trials, not healthy-weight adults) | Buffey AJ et al. 2022, Sports Med. PMID 35147898, PMC9325803 (abstract read via epmc.py) |
| PW2 | 41 adults with type 2 diabetes, randomised crossover, 2 weeks each: advice to walk 10 min after each main meal gave lower 3-h postprandial glucose iAUC than one 30-min walk a day (ratio 0.88, 95% CI 0.78–0.99); after the evening meal 0.78. | B (T2D, not healthy people) | Reynolds AN et al. 2016, Diabetologia. PMID 27747394 (abstract read via epmc.py) |
