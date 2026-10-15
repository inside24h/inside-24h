# Espresso — research dossier

Status: **draft v1** · last updated 2026-10-08
Rule: see PLAN.md §1. Levels: **A** established · **B** supported, variable · **C** our estimate (math shown) · **?** unknown.
Raw abstracts used: `sources/espresso-abstracts.txt`. Full texts cached in `sources/*.xml`.

Items marked **VERIFY** were seen only in a secondary summary and must be read in the primary source before they ship.

---

## Product

| ID | Claim | Level | Source |
|---|---|---|---|
| P1 | Restaurant espresso contains **212 mg caffeine per 100 g**. One fl oz shot (29.6 g) ≈ **63 mg**. | A | USDA FoodData Central, SR Legacy FDC 171891 "Beverages, coffee, brewed, espresso, restaurant-prepared" |
| P2 | Energy 9 kcal/100 g, so a shot has ≈ **3 kcal**. Also 115 mg K, 80 mg Mg per 100 g. | A | USDA FDC 171891 |
| P3 | Real espressos vary a lot: 20 high-street espressos showed **6-fold** differences in caffeine; the highest single espresso had **322 mg**, three more had >200 mg. Main driver: amount of coffee used by the barista. | A (for that sample) | Crozier TW et al. 2012, Food Funct. PMID 22130653 |

App note: default dose 63 mg, with a slider (≈ 25–320 mg) and a line saying why.

## Absorption and distribution

| ID | Claim | Level | Source |
|---|---|---|---|
| D1 | Caffeine is rapidly and completely absorbed from the GI tract, with negligible first-pass metabolism. | A | Grzegorzewski J et al. 2021, Front Pharmacol. PMC8914174 (citing Yesair 1984) |
| D2 | Peak plasma concentration 30–120 min after oral intake. | A | Socias & Blancas 2026, PMC13562836 (citing Newton 1981) |
| D3 | 99% absorbed within 45 min; peak 15–120 min. | A · **VERIFY** | IOM 2001, *Caffeine for the Sustainment of Mental Task Performance*, ch. 2 (NAP 10219) |
| D3m | Model cross-check: with tmax fixed at 45 min (D2) and t½ 6 h, the model has absorbed **98%** by 45 min, consistent with D3. | C | `app/src/science/pk.test.ts` |
| D4 | Distributed throughout total body water; low plasma protein binding. | A | Grzegorzewski 2021 |
| D5 | Volume of distribution ≈ 0.7 L/kg (0.61 L/kg in non-smokers, 0.72 in smokers, n=13+13). | A | Socias 2026; Parsons & Neims 1978, PMID 657717 |
| D6 | Absorbed mostly in the small intestine, partly in the stomach. | **VERIFY** | needs primary source |
| D7 | Lipid- and water-soluble, so it passes the blood–brain barrier easily. | A | Merighi S et al. 2023, Int J Mol Sci, PMC10296091 (review) |

## Effects

| ID | Claim | Level | Source |
|---|---|---|---|
| F1 | Mechanism: antagonist of adenosine receptors A1, A2A, A2B, A3 (all expressed in neurons and glia), highest affinity for A2A. | A | Merighi 2023, PMC10296091 |
| F2 | EFSA: caffeine increases alertness and attention at **≥ 75 mg** per portion (basis of the approved EU health claim). | A | EFSA NDA Panel 2011, EFSA Journal 9(4):2054 |
| F3 | Measurable effects on reaction time and mood even at **12.5–100 mg**, with a flat dose–response. Measured after overnight abstinence, so part of the effect may be reversal of mild withdrawal. | B | Smit & Rogers 2000, Psychopharmacology. PMID 11057520 |
| F4 | Coffee raises stomach acid secretion. Dark roast stimulated less than a medium roast (n=9). | B | Rubach M et al. 2014, Mol Nutr Food Res. PMID 24510512 |
| F5 | **29%** of 99 young adults said coffee makes them want to defecate. In those responders, distal colon motility rose **within 4 minutes**, with both regular and decaf coffee, and lasted ≥ 30 min. Hot water did nothing. | B | Brown SR, Cann PA, Read NW 1990, Gut. PMID 2338272 |
| F6 | Caffeinated coffee (240 ml, 150 mg) stimulated colonic motor activity as much as a 1000 kcal meal: 60% more than water, 23% more than decaf (n=12). | B | Rao SS et al. 1998, Eur J Gastroenterol Hepatol. PMID 9581985 |
| F7 | Espresso volume (≈ 30 ml) has **not** been tested for the colon effect. | ? | Estimate: the response appeared within 4 min with decaf too, so it is likely triggered by coffee components and reflexes, not by absorbed caffeine. We expect the same type of response in responders, of unknown size. |
| F8 | In people with hypertension, 200–300 mg caffeine raised BP by **+8.1 / +5.7 mmHg** (systolic/diastolic), starting within 1 h and lasting ≥ 3 h. Longer-term coffee drinking did not raise BP. | A (hypertensives) | Mesas AE et al. 2011, AJCN. PMID 21880846 |
| F9 | BP effect of one 63 mg espresso in a healthy person. | C | Not measured directly. The dose is ~¼ of the tested 200–300 mg. Even assuming a linear dose response in a more sensitive population: 8.1 × 63/250 ≈ **+2 mmHg systolic**. Likely smaller in habitual drinkers (tolerance, **VERIFY** source). Show as "≈ 0–3 mmHg, our estimate". |

## Elimination

| ID | Claim | Level | Source |
|---|---|---|---|
| M1 | Metabolised almost entirely in the liver; ~95% of clearance via CYP1A2. | A | Grzegorzewski 2021 (citing Amchin 1999) |
| M2 | Metabolites: paraxanthine **84%**, theobromine **12%**, theophylline **4%**. | A | Socias 2026 (citing Chen 2010) |
| M3 | **≤ 3%** leaves unchanged in urine. | A | Grzegorzewski 2021 (citing Kot & Daniel 2008) |
| M4 | Half-life in healthy adults **2.5–10 h**. | A | Socias 2026 (citing Pohanka & Dobes 2013) |
| M5 | Mean half-life ~5 h, range 1.5–9.5 h. | A · **VERIFY** | IOM 2001 |
| M6 | Smokers clear it faster: half-life **3.5 h vs 6.0 h** in non-smokers. | A | Parsons & Neims 1978, PMID 657717 |
| M7 | Oral contraceptives slow it: **10.7 h vs 6.2 h** in women not on the pill. | A | Patwardhan RV et al. 1980, PMID 7359014 |
| M8 | Late pregnancy (38–40 wk): clearance only **39%** of non-pregnant values; recovers >3-fold after birth. | A | Parsons & Pelletier 1982, CMAJ. PMID 7104915 |
| M9 | So in late pregnancy the half-life is ≈ 2.6× longer (≈ 15 h from a 6 h baseline). | C | t½ = ln2·Vd/CL. If Vd is unchanged, t½ scales with 1/CL = 1/0.39 ≈ 2.6. |
| M10 | Caffeine metabolism falls during pregnancy, mostly in the 3rd trimester. | A | Yu T et al. 2016, J Clin Pharmacol. PMID 26358647 |

## Sleep and safety

| ID | Claim | Level | Source |
|---|---|---|---|
| S1 | 100 mg close to bedtime may lengthen time to fall asleep and shorten sleep in some adults. | A | EFSA NDA Panel 2015, Scientific Opinion on the safety of caffeine |
| S2 | 400 mg taken 0, 3 **or 6 h** before bed disrupted sleep vs placebo. | A (400 mg) | Drake C et al. 2013, J Clin Sleep Med. PMID 24235903 |
| S3 | Healthy adults: single doses ≤ 200 mg and ≤ 400 mg/day raise no safety concern. Pregnancy: ≤ 200 mg/day. | A | EFSA 2015 |
| S4 | Caffeine left at bedtime after one espresso. | C | Model below. With 63 mg at 16:00 and t½ = 6 h: at 23:00 ≈ 63·0.5^(7/6) ≈ **28 mg**; at 02:00 ≈ **20 mg**. Well under the 100 mg EFSA level, but not zero. |

---

## Added in v2 (profile, stomach, vitals)

| ID | Claim | Level | Source |
|---|---|---|---|
| G1 | A 240 mL glass of water leaves the fasted stomach with a half-emptying time of **13 ± 1 min**; the stomach is back to baseline by 45 min. Fasted stomach holds ~35 mL resting fluid. | A | Mudie DM et al. 2014, Mol Pharm. PMID 25115349 (MRI, n=12) |
| G2 | 20 mL of water empties at a nearly comparable relative rate (only slightly slower); caffeine kinetics did not differ between 20 and 240 mL. | B | Grimm M et al. 2023, Eur J Pharm Biopharm. PMID 36736963 (n=8) |
| G3 | Model consequence: if absorption waits for gastric emptying (t½ 13 min), the blood peak cannot come before ≈ 65 min. Peaks at 30–45 min would need absorption from the stomach itself (D6). **Open conflict with D3 (99% absorbed by 45 min)**, kept visible. | C | `espressoSim.test.ts` |
| W1 | Total body water (Watson): men 2.447 − 0.09516·age + 0.1074·height + 0.3362·weight; women −2.097 + 0.1069·height + 0.2466·weight (L, years, cm, kg). Derived from 723 adults. | A | Watson PE et al. 1980, Am J Clin Nutr. PMID 6986753; formula as given by MSD/Merck Manuals calculator |
| W2 | Caffeine Vd scaled by the person's total body water (caffeine distributes in body water, D4). | C | 0.65 L/kg × 70 kg = 45.5 L for a reference man with 41.45 L TBW → Vd = TBW × 1.098 |
| A1 | Young (20 y) vs elderly (71 y) men: same tmax, Cmax and bioavailability; Vd lower in the elderly; half-lives 2.27–9.87 h across subjects. | A | Blanchard J, Sawers SJ 1983, J Pharmacokinet Biopharm. PMID 6886969 |
| V1 | 1.5 and 3 mg/kg caffeine did **not** change resting heart rate (non-habitual young men, n=9). | B | McClaran SR, Wetter TJ 2007, JISSN. PMID 17925021 |
| V2 | 3 mg/kg raised resting systolic BP: 116 → 123 mmHg. | B | McClaran 2007 |
| V3 | One espresso has ~0.5 g carbohydrate and 0 g sugar (USDA: 1.67 g carbohydrate, 0 g sugars per 100 g), so no meaningful glucose rise is expected. | C | USDA FDC 171891 |
| V4 | Acute caffeine lowers insulin sensitivity (7 RCTs, SMD −2.06). Matters when sugar or carbs are eaten with or after the coffee. | A | Shi X et al. 2016, Nutr J. PMID 28031026 |
| V5 | No mechanism or data for an SpO2 change from one espresso. | ? | — |
| X1 | Breakdown products' plasma half-lives: paraxanthine 3.1 h, theophylline 6.2 h, theobromine 7.2 h (caffeine 4.1 h in that study; n=6 men). | A | Lelo A et al. 1986, Br J Clin Pharmacol. PMID 3756065 |
| R1 | Normal resting heart rate 60–100 bpm; normal BP < 120/80. | A | American Heart Association (heart.org) |
| R2 | Normal fasting glucose < 100 mg/dL (5.6 mmol/L); SpO2 95–100% at sea level. | A · **VERIFY** | ADA Standards of Care (primary page not yet read); SpO2 source pending |
| O1 | Organ volumes measured from the BodyParts3D meshes: brain 1.22 L, liver 1.70 L, heart 0.45 L (incl. chambers), kidneys 0.10 L each, stomach 0.57 L. Lung meshes are not closed shells, so no lung volume. | C | `pipeline/build-anatomy.mjs` → `organ-volumes.json` |

## Your body: personal factors (added 2026-10-15, science/personal.ts)

Each factor changes the model only because a study we read shows the effect. Abstracts read via `epmc.py abs`.

| ID | Claim | Level | Source |
|---|---|---|---|
| M6 ✔ | Re-read: smokers t½ **3.5 h vs 6.0 h** (n = 13 + 13, saliva); clearance 155 ± 16 vs 94 ± 18 ml/kg/h; Vd not different. → model ×0.58 (clears ≈ 1.7× faster). | A | Parsons & Neims 1978, PMID 657717 |
| M7 ✔ | Re-read: pill t½ **10.7 ± 3.0 h vs 6.2 ± 1.6 h** (9 + 9 women, 250 mg); Vd and binding similar. → model ×1.73. | A | Patwardhan 1980, PMID 7359014 |
| Y1 | Pregnancy: t½ rises from an average **3 h** (non-pregnant women) to **10.5 h** in the last 4 weeks (≈ 3.5×); the rise "is already occurring during the first part of pregnancy"; not explained by Vd; individual values not correlated with age, weight, coffee habit or smoking. Together with M8 (clearance 39% → ≈ 2.6×) the late-pregnancy factor is **2.6–3.5×**; model uses 2.6 (M9). Early/mid-pregnancy: no number read → **?**, not modelled. | A (late) · ? (earlier) | Knutti R et al. 1982, Arch Toxicol Suppl. PMID 6954898; Brazier 1983 (PMID 6628163, no numbers in abstract) |
| Y2 | Non-users given caffeine daily: **near-complete tolerance** of BP, HR, catecholamines and renin within **1–4 days** (double-blind). | B (small, 1981) | Robertson D et al. 1981, J Clin Invest. PMID 7009653 (PMC370671) |
| Y3 | After 5 days of 300 or 600 mg/day, 250 mg still raised systolic/diastolic BP on average (P < 0.006/0.001). **Half** of 97 adults lost the BP response **completely**, the other half showed **no loss**; men and women alike. | A (RCT, n = 97) | Lovallo WR et al. 2004, Hypertension. PMID 14967827 |
| Y4 | Model: "coffee or tea most days" → caffeine's BP rise × **0.5** (mean of Y3's two halves; person range 0–1). | C (on Y2–Y3) | — |
| Y5 | Age: no change modelled. Young vs elderly men had the same tmax, Cmax, F; elimination not significantly different (A1). | A1 | Blanchard & Sawers 1983, PMID 6886969 |
| Y6 | Habit and half-life: Knutti found t½ not correlated with coffee consumption (Y1) → the daily-user setting does not change the clock or the sleep answer. Whether the **sleep** effect fades in habitual users: not read → **?** | B · ? | Knutti 1982 |

Tests: `app/src/science/personal.test.ts`.

## Model parameters (default healthy adult, 70 kg, non-smoker, no oral contraceptives)

One-compartment model, first-order absorption:

`C(t) = F·D·ka / (Vd·(ka − ke)) · (e^(−ke·t) − e^(−ka·t))`

| Parameter | Value | Range | Basis |
|---|---|---|---|
| D | 63 mg | 25–320 | P1, P3 |
| F | 1.0 | 0.99–1 | D1 |
| Vd | 0.65 L/kg → 45.5 L | 0.6–0.72 L/kg | D5 |
| t½ | 6.0 h | 2.5–10 h | M6/M7 (non-smoker controls); M4 range |
| ke | ln2/t½ = 0.116 /h | | derived |
| ka | chosen so Tmax ≈ 45 min | Tmax 30–120 min | C: fitted to D2 |

Expected peak: ≈ 63/45.5 × ~0.9 ≈ **1.2 mg/L** (C, from the model).

Modifiers: smoker t½ ×0.58 (3.5/6.0) · oral contraceptives ×1.73 (10.7/6.2) · late pregnancy ×2.6 (M9).

## Open questions (to research next)
- Primary source for D3, D6, D7, F1, M5 and tolerance to BP effects.
- Diuretic effect of a single small dose.
- Heart rate effect at low doses.
- Gastric emptying half-time of a 30 ml warm drink (expected: minutes; needs a source).
