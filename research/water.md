# Water (one glass, 250 ml, room temperature, fasted healthy adult) — research dossier

Status: **draft v1** · last updated 2026-10-08
Rule: see upute.md §2. Levels: **A** established · **B** supported, variable · **C** our estimate (math shown) · **?** unknown.
Abstracts and full texts were read through `tools/epmc.py` (abs / grep). EFSA figure read on efsa.europa.eu.
Items marked **VERIFY** / **source pending** were not read in a primary source and must not ship until they are.

Reused from `espresso.md` (not repeated): **G1** (240 mL water, T50 13 ± 1 min, back to baseline by 45 min, resting fluid 35 mL; Mudie 2014), **G2** (20 mL empties at a nearly comparable relative rate; Grimm 2023), **W1** (Watson total body water formula). Mudie 2014 is extended below with its small-bowel data (A2–A4).

---

## Product

| ID | Claim | Level | Source |
|---|---|---|---|
| P1 | Reference product: 250 ml still water at room temperature = **250 g**, 0 kcal, no solutes assumed (tap water mineral content ignored). | C | Assumption: density ~1 g/ml. Studies below used distilled / tap / D2O water of 240–500 ml; osmolality of the D2O drink was < 20 mOsm/kg (Péronnet 2012). |
| P2 | Energy to warm 250 ml from ~22 °C to 37 °C: 250 g × 4.18 J/g/K × 15 K ≈ **15.7 kJ ≈ 3.8 kcal**. Charrière quotes ~30–33 kJ for 500 ml, which matches. | C | arithmetic; Charrière 2015 (PMC4735055) for the 500 ml figure |

## Stomach and small intestine

| ID | Claim | Level | Source |
|---|---|---|---|
| A1 | See **G1**: 240 mL leaves the fasted stomach with T50 **13 ± 1 min**; gastric volume goes 35 → 242 mL after drinking and is back to baseline at 45 min. | A | Mudie DM et al. 2014, Mol Pharm. PMID 25115349 |
| A2 | Fasted small bowel holds **43 ± 14 mL** of resting water. 12 min after drinking 240 mL it peaks at **94 ± 24 mL**, held in **15 ± 2 pockets of 6 ± 2 mL** each. | A (n=12, MRI) | Mudie 2014, PMID 25115349 |
| A3 | At 45 min (stomach empty of the drink) the small bowel holds **77 ± 15 mL** in **16 ± 3 pockets of 5 ± 1 mL**. Water in the small intestine is distributed in small separate pockets, not a continuous column. | A | Mudie 2014 |
| A4 | The pocket data (A2–A3) mean that only a fraction of the drink is in the gut lumen at any time: absorption is running at about the same speed as emptying. Of 240 mL, ≤ ~94 mL sat in the small bowel at the peak. | C | Mudie 2014 numbers: peak 94 − resting 43 = ~51 mL "extra" at the peak |
| A5 | Ingested water appeared in plasma and blood cells within **5 min**; peak plasma D/H at **~20 min** (individual range 15–60); absorption half-life **~11–13 min**; absorption >99% complete by **~75–90 min** (7 × ta½). Dose 300 ml D2O-labelled water, n=36. Whole-body distribution (central to peripheral compartment) half-life 12.5 ± 4.3 min, even across the whole body water pool by ~90 min. | A | Péronnet F et al. 2012, Eur J Appl Physiol. PMID 21997675, PMC3351614 |
| A6 | Fast distribution matches the rapid emptying: T50 13 min (A1) and absorption ta½ 11–13 min (A5) have the same scale. Water is not "queued" for long in the stomach. | C | A1, A5 |
| A7 | **Volume effect on emptying:** 20 mL vs 240 mL give nearly comparable relative emptying rates (see G2). Emptying of volumes > 250 mL (e.g. 500 mL, 1 L) was **not found in a read source**. | ? | Needs a source: scintigraphy/MRI of 100–1000 mL water. Not found via Europe PMC. Expect T50 to grow with volume (our expectation, not shown). |
| A8 | **Temperature effect on emptying:** not found in any read source. | ? | Would need a study of cold vs room vs warm water emptying. Parsons 2022 studied cardiovascular effects of 0–3 °C vs 20 °C vs 45 °C water but not emptying (V4). |
| A9 | Where in the small intestine water is absorbed (jejunum vs ileum) and what share per segment. | ? | Not found in a read source. A MRI study shows a labelled drink reached distal small intestine within ~20 min in 9 of 12 volunteers (with a 10.6% glucose solution, not water, and it was slower than for water): Großmann L et al. 2026, Int J Pharm X. PMID 42253761. So the distal gut sees fluid early; the absorption site split is open. |

## Blood, kidney, hormones

| ID | Claim | Level | Source |
|---|---|---|---|
| B1 | Kidneys keep plasma osmolality within **±2% (280–290 mOsm/kg)**; **295–300** = mild/impending hyperosmotic state; >300 frank. Urine osmolality >1000 mOsm/L is elevated. | A (review) | Liska D et al. 2019, Nutrients. PMC6356561 |
| B2 | Thirst regulation holds plasma osmolality fluctuations within **1–2%**. | A (review) | Szczepanska-Sadowska E 2025, PMC12386622 |
| B3 | Change in plasma osmolality / sodium after 250 ml: no direct measurement found. Estimate if all water were spread over total body water (reference man 41.45 L, see W1) with no kidney removal: 250/(41,450+250) = 0.60% dilution, so osmolality 285 → **~283.3 mOsm/kg (−1.7)** and sodium 140 → **~139.2 mmol/L (−0.8)**. This is a **ceiling**: urine excretion starts within the hour (B6) and the true fall is smaller. Both are inside the 1–2% band of B1/B2. | C | W1 (espresso.md); arithmetic. Not measured; need a study of serial Na/osmolality after 250 ml water. |
| B4 | Vasopressin / copeptin falls after a water load. In 86 men given **15–20 ml/kg over 40–45 min** (≈ 1.05–1.4 L at 70 kg), serum copeptin, urinary AQP2/creatinine and hyaluronidase all **fell, reaching a nadir at 120 min**, then recovered gradually to baseline by 4 h. Men with a family history of hypertension had a blunted fall. | B | Calvi A et al. 2024, Front Endocrinol. PMID 38982989, PMC11231081 |
| B5 | For a single 250 ml glass the size and timing of the vasopressin drop were **not measured**. In a smaller drink study (tap water, 47 autonomic failure patients, 11 older and 8 young controls) plasma vasopressin did **not** change after drinking. | ? (250 ml) · B (Jordan) | Jordan J et al. 2000, Circulation. PMID 10662747 |
| B6 | Urine output after 1 L of still water in euhydrated fasted men (n=72): total urine mass over 4 h = **1337 ± 330 g** (the reference for the beverage hydration index; cola, coffee, tea, lager, juice, sparkling water did not differ from water). Milk and ORS gave less (≈ 1040–1050 g). Water retained at 2 h defines index 1.0. | A (1 L) | Maughan RJ et al. 2016, Am J Clin Nutr. PMID 26702122 |
| B7 | Urine output, diuresis onset, peak time and % excreted by 2–4 h for **250 ml**: not found. Honest reading of B6: the 4 h urine mass (1337 g) exceeded the 1 L drunk because it includes ongoing baseline urine production, so no clean "% of dose" can be taken from it. | ? | Needs a water-load study with timed urine collections for 250 ml. For the app: show onset and peak as a model assumption, see Model parameters (C). |
| B8 | Model-time estimate for diuresis: vasopressin nadir at ~120 min after a ~1 L-scale load (B4), absorption >99% done by 75–90 min (A5). So urine flow after a glass should be rising within the first hour and be clearly above baseline between roughly 30 and 120 min, back to baseline by ~4 h. A 250 ml dose is small (0.6% of body water) so the effect is modest. | C | A5, B4, B6 — a construct, not a measurement |
| B9 | **Blood volume did not change** after water drinking in patients and controls (nor did plasma renin activity). | B | Jordan 2000, PMID 10662747 |
| B10 | Expected blood-volume effect of 250 ml: 250 ml spread over total body water; plasma is ~7% of body mass volume-wise (not sourced), so the expansion would be a few mL at most. We therefore model **no visible change**. | C | B9; arithmetic: 250 ml × (plasma share of body water ≈ 3/42 ≈ 7%) ≈ 18 ml before any excretion (plasma ≈ 3 L is an unsourced assumption, **VERIFY**) |

## Heart rate and blood pressure (osmopressor response)

| ID | Claim | Level | Source |
|---|---|---|---|
| V1 | Water drinking raises sympathetic activity: plasma norepinephrine rose in both older and young controls. Seated systolic BP rose by **+11 ± 2.4 mmHg in older controls but not in young controls**; in autonomic failure it rose by +33 to +37 mmHg, max at 30–35 min. | B | Jordan 2000, PMID 10662747 |
| V2 | Meta-analysis of rapid **350–500 mL** water intake: **healthy** participants SBP **+2.33 mmHg** (95% CI 1.02–3.64), DBP **+2.73** (1.15–4.30), HR −2.06 bpm (95% CI −5.25 to +1.13, not significant). Orthostatic hypotension: SBP +24.2, DBP +12.0, HR −3.5. | A | Oyewunmi OA et al. 2023, J Am Heart Assoc. PMID 37929748, PMC10727389 |
| V3 | Pressor response timing: after ~15–20 ml/kg water over 40–45 min, BP rose in all groups with a peak at **20–40 min**. In autonomic failure, BP rose significantly by 5 min (PAF) / 13 min (MSA) after 480 ml. | B | Calvi 2024, PMID 38982989; Young TM, Mathias CJ 2004, J Neurol Neurosurg Psychiatry. PMID 15548493 |
| V4 | Water temperature: 500 mL of ice-cold (0–3 °C) vs room (20 °C) water in 14 healthy people gave lower HR and cardiac output and higher SBP, stroke volume, total peripheral resistance during tilt; orthostatic tolerance did not change (31 ± 3 vs 33 ± 3 min). | B | Parsons IT et al. 2022, Clin Auton Res. PMID 35461434 |
| V5 | In older people, 300 mL water raised SBP in those with postprandial hypotension and lowered HR in both groups (n=8+8), without changing stroke volume or cardiac output. | B | Trahair LG et al. 2017, Physiol Rep. PMID 28684639 |
| V6 | **250 ml in a healthy young adult**: expected change SBP ≈ **0 to +2 mmHg**, DBP ≈ 0 to +2, HR ≈ 0 to −2 bpm, peak ~30 min. Basis: V2 gives +2.3/+2.7 for 350–500 mL; a 250 ml dose is smaller; young controls in V1 showed no SBP rise. Show as "≈ 0–2 mmHg, our estimate". Not measured at 250 ml. | C | V1, V2 |

## Metabolism (water-induced thermogenesis)

| ID | Claim | Level | Source |
|---|---|---|---|
| T1 | 500 ml of water raised resting metabolic rate by **30%**, starting within 10 min, max at 30–40 min; total response ~100 kJ; ~40% of it was warming the water from 22 to 37 °C; blunted by beta-blockade (n=14). | B (claim contested, see T2) | Boschmann M et al. 2003, J Clin Endocrinol Metab. PMID 14671205 |
| T2 | Reassessment, n=27 healthy young adults, 500 ml distilled water at 21–22 °C vs a Sham drink, crossover: REE rose **<3%**, **not different from Sham**; RQ fall was the same with Sham. Across the authors' own and ~10 other labs, the 90-min change in REE after 280–750 ml was **<20 kJ on average**; the Boschmann values were "uniquely spectacular". | A (failed replication) | Charrière N et al. 2015, Nutr Diabetes. PMID 26690288, PMC4735055 |
| T3 | Heat cost of warming 500 ml of water at 21–22 °C to body temperature: ~30–33 kJ. | A | Charrière 2015 |
| T4 | For 250 ml: Boschmann scaled linearly = 100 × 0.5 = **≈ 50 kJ ≈ 12 kcal** (upper bound, contested); replication scaled = <20 × 0.5 = **<10 kJ ≈ <2.4 kcal**; pure warming = P2 ≈ 16 kJ. Whatever the truth, a glass costs a few kcal at most. | C | T1, T2, P2 |

## Daily needs and myths

| ID | Claim | Level | Source |
|---|---|---|---|
| N1 | EFSA adequate intake of **total water** (drinks + food moisture): **2.0 L/day women, 2.5 L/day men** (adults). | A | EFSA press release "EFSA sets European dietary reference values for nutrient intakes", 26 Mar 2010, efsa.europa.eu/en/press/news/nda100326 (EFSA NDA Panel, EFSA Journal 2010;8(3):1459) |
| N2 | EFSA assumes fluids provide 70–80% of total water and food 20–30%. | **source pending** | Only seen in a search summary (foodingredientsfirst.com), not on the EFSA page I read. |
| N3 | If N2 holds, drinks needed ≈ 70–80% × 2.0–2.5 L = **1.4–2.0 L** per day = about **6–8 glasses of 250 ml**. | C | N1, N2 arithmetic |
| M1 | Myth "8 glasses a day": the target is "often repeated" but was called into question by Valtin and others for **lack of evidence-based health outcomes**. 8 × 250 ml = 2.0 L, which coincides with EFSA's women total, but that EFSA figure includes food water (N1). | B | Perrier ET et al. 2021, Eur J Nutr (narrative review). PMC7987589, citing Valtin H 2002 |
| M2 | Myth "you are dehydrated when thirsty": thirst follows osmotic and volume signals; mild hyperosmolality begins around 295–300 mOsm/kg (B1). The exact thirst threshold in mOsm/kg was **not obtained**. Verdict: partly true (thirst appears after osmolality has risen by a few %), but thirst is an adequate guide for healthy people in the review's wording. Needs the exact threshold from a primary source. | ? · **VERIFY** | B1, B2; Perrier 2021 says thirst is "implicitly assumed" adequate, which the review then argues beyond |
| M3 | Myth "water boosts metabolism": see T1–T4. A single glass adds at most a few kcal, mostly the cost of warming it; the large effects of Boschmann 2003 did not replicate. | A (failed replication) | Charrière 2015 |
| M4 | Myth "coffee/tea dehydrate": 1 L of cola, diet cola, hot tea, iced tea, coffee, lager (not different from water) gave similar 4 h urine output. Not about water itself but useful for sibling products. | A | Maughan 2016 |

---

## Model parameters (default healthy adult, 70 kg, fasted, 250 ml at ~22 °C)

| Parameter | Value | Range | Basis |
|---|---|---|---|
| Gastric emptying | first order, T50 **13 min** (k = ln2/13 = 0.053 /min); empty by 45 min | T50 12–14 min | A1 / G1 (240 mL; scale to 250 ml is minimal) |
| Small-bowel water pockets | ~15 pockets of ~6 mL at 12 min, total ~94 mL peak; resting 43 mL | ±24 mL | A2, A3 |
| Water absorption | first order, ta½ **~12 min** (k ≈ 0.058 /min), >99% by 75–90 min; appears in blood at 5 min, peaks ~20 min | ta½ 11–13 min; peak 15–60 min | A5 (300 ml D2O) |
| Whole-body distribution | to peripheral water within ~12.5 min half-life; even by ~90 min | ±4 min | A5 |
| Plasma osmolality / Na | ceiling −1.7 mOsm/kg and −0.8 mmol/L, transient; kidney restores | 0 to −1.7 | B3 (C) |
| Vasopressin | falls, nadir ~120 min for large loads; 250 ml magnitude unknown, show as small dip | ? | B4, B5 |
| Urine flow | rises from ~30 min, up through ~120 min, back to baseline by ~4 h | ? | B7, B8 (C) |
| Blood volume | no visible change | | B9, B10 |
| Blood pressure | SBP/DBP 0 to +2 mmHg at 20–40 min; HR 0 to −2 bpm | | V2, V3, V6 (C) |
| Energy | 0 kcal ingested; extra expenditure ≤ ~4 kcal (warming) | 0–12 kcal | P2, T4 |
| Daily target (info panel) | 2.0 L women / 2.5 L men total water | | N1 |

## Open questions (to research next)
- Urine output time course for 250 ml and for larger loads (onset, peak, % excreted by 2 and 4 h): needs a primary water-load paper (not found via Europe PMC; try Hunt, Wolf, Kavouras/Armstrong classics).
- Measured plasma osmolality/sodium change and copeptin dip after a single 250 ml glass.
- Gastric emptying of water at other volumes (100, 500, 1000 ml) and temperatures (cold vs warm).
- Segmental small-bowel water absorption (jejunum/ileum) from a primary physiology source.
- Primary source for the EFSA 70–80% fluid share (N2) and for the osmotic thirst threshold (M2); original Valtin 2002 paper.
- Plasma volume (litres) source for B10; confirm vasopressin response size in young adults.
