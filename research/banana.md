# Banana (raw, one medium, 118 g peeled) — research dossier

Status: **draft v1** · last updated 2026-10-08
Rule: see upute.md §2. Levels: **A** established · **B** supported, variable · **C** our estimate (math shown) · **?** unknown.
Abstracts were read through `tools/epmc.py abs` or the Europe PMC REST API (`resultType=core`). Full texts were read through `tools/epmc.py grep`. Product data come from USDA FoodData Central (API, SR Legacy FDC 173944).
Items marked **VERIFY** or **source pending** were seen only in a search snippet, a secondary summary or background knowledge and must be read in the primary source before they ship.

Reused from other dossiers (not re-researched; those items were read by earlier agents): fructose/glucose transporters and fructose first-pass (`cola.md` A1, A2, L1–L3), glucose-curve anchor of a sugar drink (`cola.md` B1–B2), liquid gastric emptying (`cola.md` G1, G4).

Note on "the" banana: a banana is not one product. Ripeness changes starch vs sugar (R1–R4), and the USDA record does not say which ripeness stage it describes (open question 2).

---

## Product (composition)

Per 100 g from USDA FDC 173944 "Bananas, raw" (SR Legacy). Portion "1 medium (7" to 7-7/8" long)" = **118 g** (API foodPortions). Per-banana values = value × 1.18 (our arithmetic).

| ID | Claim | Level | Source |
|---|---|---|---|
| P1 | Per 100 g: water **74.91 g**, energy **89 kcal (371 kJ)**, protein 1.09 g, fat 0.33 g, **carbohydrate (by difference) 22.84 g**, **fibre 2.6 g**. Per medium banana (118 g): **≈ 105 kcal, 26.9 g carbohydrate, 3.1 g fibre**, 88 g water. Available carbohydrate (carb − fibre) = 20.24 g/100 g → **23.9 g per banana**. | A (database) · C (scaling) | USDA FDC 173944 (api.nal.usda.gov/fdc/v1/food/173944); 118 g portion from the same record |
| P2 | Sugars per 100 g: **total 12.23 g = glucose 4.98 + fructose 4.85 + sucrose 2.39** (+ maltose 0.01, galactose 0). Per banana: **14.4 g total = glucose 5.9 + fructose 5.7 + sucrose 2.8 g**. | A (database) · C (scaling) | USDA FDC 173944 |
| P3 | **Starch 5.38 g/100 g** → **6.3 g per banana**. Fibre + starch + sugars = 2.6 + 5.38 + 12.23 = 20.2 g, so ≈ 2.6 g/100 g of "carbohydrate by difference" is not itemised (rounding, other carbohydrate). | A (database) · C (sum) | USDA FDC 173944 |
| P4 | Per 100 g: **potassium 358 mg**, **magnesium 27 mg**, **vitamin B-6 0.367 mg**, sodium 1 mg. Per banana: **K 422 mg (≈ 10.8 mmol)**, **Mg 32 mg**, **B6 0.43 mg**, Na 1.2 mg. Conversion: 422 mg ÷ 39.1 mg/mmol = 10.8 mmol. | A (database) · C (scaling) | USDA FDC 173944 |
| P5 | Monosaccharides after hydrolysis of sucrose (2.8 g × 180/342 = 1.5 g each): free + sucrose-derived **glucose ≈ 7.4 g and fructose ≈ 7.2 g**, plus **≈ 6.3 g starch** (digestible share depends on ripeness, R1–R4). | C | P2, P3; molar masses sucrose 342, hexose 180 |
| P6 | USDA does **not** report resistant starch separately for this record. | A (absence) | USDA FDC 173944 nutrient list |

## Ripeness (starch vs sugar)

| ID | Claim | Level | Source |
|---|---|---|---|
| R1 | Ileostomy subjects fed bananas of six different ripeness batches: starch was **37% of dry weight in the least ripe and 3% in the most ripe**. Carbohydrate in ileostomy effluent was 4–19 g/day and tracked starch content (r = 0.99); up to **90% of the starch** appeared in the effluent. Non-starch polysaccharide (fibre) was **completely recovered**. Starch reaching the colon "may be up to 8 times more than the NSP" and depends on ripeness. | A (classic, ileostomy subjects) | Englyst HN, Cummings JH 1986, Am J Clin Nutr 44:42-50. PMID 3014853 (abstract) |
| R2 | Banana stores starch at **15–35% of fresh weight** depending on cultivar. At commercial harvest 12–35% starch; late in ripening **15% to < 1%**. Soluble sugars rise to **up to 20% of fresh pulp** in the ripe fruit, with **sucrose ≈ 80%** of them and glucose and fructose the remaining ≈ 20% in equal parts. | B (review citing older studies) | Cordenunsi-Lysenko BR et al. 2019, Front Plant Sci. PMID 31001305 (PMC6454214, `epmc.py grep`) |
| R3 | Cross-check of the USDA record: dry matter = 100 − 74.91 = 25.09 g/100 g; starch 5.38 g ÷ 25.09 = **21% of dry weight**. That lies between Englyst's 3% (most ripe) and 37% (least ripe), so the USDA sample is a **mid-ripe yellow banana**. Its sucrose share is 2.39/12.23 = **20%** of sugars, which disagrees with the ≈ 80% in R2 for ripe fruit (different cultivar or stage, or analysis). | C | P2, P3, R1, R2 |
| R4 | Under-ripe banana: starch is **80–90% of the carbohydrate**; ripening turns it into free sugars. | B (authors' statement) | Hermansen K et al. 1992, Diabet Med. PMID 1395467 (abstract) |
| R5 | Sugar/starch split for the green and spotted presets at the same source level as the yellow one: only the dry-weight endpoints (R1) are sourced. | ? | open question 1 |

## Mouth (chewing, salivary amylase)

| ID | Claim | Level | Source |
|---|---|---|---|
| M1 | Raw banana starch is **hydrolysed only slowly by alpha-amylase in humans** (the authors' explanation for the low glycaemic response of under-ripe banana). Starch that escaped the small intestine was still insoluble granules like raw banana starch. | B | Hermansen 1992, PMID 1395467; Faisant N et al. 1995, Br J Nutr. PMID 7857906 |
| M2 | Salivary amylase activity did **not** change the glycaemic index of cooked rice: healthy adults with low (< 50 U/mL) vs high (> 105 U/mL) activity, n = 20 per group, randomised crossover. | A (one RCT, rice) | Wolever TMS et al. 2021, Am J Clin Nutr. PMID 34293081 (abstract) |
| M3 | Opposite signal: healthy people with high salivary amylase (n = 7) vs low (n = 7) had better glycaemic homeostasis after a starch drink. | B (n = 14, drink) | Mandel AL, Breslin PA 2012, J Nutr. PMID 22492122 (abstract) |
| M4 | Banana in the mouth: ≈ 6.3 g starch mostly in raw granules, soft pulp, short contact time. Our estimate is that only a small share of starch is hydrolysed in the mouth, so the app shows chewing as mechanical (pulp + saliva), not as a separate sugar event. No banana-specific oral study found. | C | M1–M3 |

## Stomach (gastric emptying)

| ID | Claim | Level | Source |
|---|---|---|---|
| G1 | Reference values in 90 healthy adults (13C breath test): fluid test meal T½ **80.5 ± 22.1 min**, Tlag 40.3 ± 10.2 min. Solid test meal: median **T½ 127 min** (IQR 112–168), median **Tlag 81.5 min** (IQR 65.5–102). No effect of age, sex or BMI. These are for a standard solid test meal (larger than a banana), not for fruit. | B (method-dependent) | Hellmig S et al. 2006, J Gastroenterol Hepatol. PMID 17074022 (abstract) |
| G2 | Ultrasound in healthy Sri Lankan adults, identical solid vs semi-solid meals: **lag ≈ 60 min, half-emptying ≈ 120 min** for both; after the lag emptying is roughly linear. | B (one meal, one population) | Amarasiri L et al. 2025, PMC12476634 (`epmc.py grep`) |
| G3 | Liquid nutrient: 500 ml shake with **100 kcal → T½ 26.5 min**; 500 kcal → 69.5 min (MRI). Energy density slows emptying. | A | Camps G et al. 2016, AJCN. PMID 27281305 (via cola.md G4) |
| G4 | **Banana estimate** (soft ripe fruit, ≈ 105 kcal, chewed to pulp). Calorie rule: 105 kcal ÷ 2 kcal/min = **≈ 52 min**; add a short lag (our guess 10–20 min for a soft, low-fat solid) → empty at **≈ 60–75 min**, **T½ ≈ 35–50 min**. With 1–4 kcal/min the range is 26–105 min plus lag. G1/G2 (120–127 min) are for heavier meals and give an upper bound. No gastric-emptying study of banana itself was found. | C | G1–G3, cola.md G1 (1–4 kcal/min), P1 |
| G5 | Whether 3.1 g fibre and raw starch slow emptying at this dose: not tested. | ? | no source |

## Small intestine (digestion and absorption)

| ID | Claim | Level | Source |
|---|---|---|---|
| A1 | **Raw green banana flour**, intubation in 6 healthy subjects over 14 h: **83.7% of alpha-glucans reached the terminal ileum** and were almost totally fermented in the colon. The resistant part was mostly intact granules; passage through the small intestine made them more susceptible to amylase. | A for green banana flour · not a ripe banana | Faisant N et al. 1995, Br J Nutr. PMID 7857906 (abstract) |
| A2 | Ripe fruit has little starch (3% of dry weight in the ripest batch, R1), so most carbohydrate is soluble sugar absorbed in the small intestine. Sucrose is hydrolysed at the brush border by sucrase-isomaltase; glucose enters via SGLT1 (exit GLUT2), fructose via GLUT5. | A (transporters) · C (application) | cola.md A1, A2 (Tannous 2023 PMC10030609; Lee & Cha 2018 PMC6177502); R1 |
| A3 | Starch escaping small-intestinal digestion in a mid-ripe banana (USDA 6.3 g starch): if 50–90% escapes (R1 up to 90% for least ripe; A1 83.7% for green flour) → **3–6 g** reaches the colon. For the most ripe batch (3% of dry weight = 0.03 × 25.09 = 0.75 g/100 g fresh = **0.9 g per banana**) it would be **≤ 1 g**. A range between ripeness extremes, not a measurement for a yellow banana. | C | R1, A1, P3 |
| A4 | Fibre 3.1 g per banana passes the small intestine intact (complete ileostomy recovery) and reaches the colon. | A | R1, P1 |
| A5 | Fructose from the banana (≈ 7.2 g, P5) is about 1/3 of that in one can of cola (cola.md P4c: 18–20 g). With ≈ 14.5% escaping first-pass extraction (cola.md L2, n = 9) → **≈ 1.0 g** reaches the systemic circulation (7.2 × 0.145). | C | P5, cola.md L2, P4c |

## Blood glucose and insulin

| ID | Claim | Level | Source |
|---|---|---|---|
| B1 | **Glycaemic index of raw banana: 51 ± 3** (International Tables 2008, glucose = 100). "Plantain/green banana" listed separately at 55 ± 6. | A (table) | Atkinson FS, Foster-Powell K, Brand-Miller JC 2008, Diabetes Care. PMC2584181 (Table 1) |
| B2 | **Glycaemic load** = available carbohydrate × GI ÷ 100 (formula stated in the same paper). Banana: 23.9 g × 51/100 = **≈ 12** per 118 g banana (GI 48–54 → 11.5–12.9). The banana row of the table in the text we read gives GI only. | C | B1, P1, formula from PMC2584181 |
| B3 | **Ripeness, type 2 diabetes (n = 10, 120 g banana):** 4-h glucose response area under-ripe **62 ± 17**, over-ripe **106 ± 17**, white bread (40 g) **181 ± 45** mmol/l × 240 min. **GI under-ripe 43 ± 10 vs over-ripe 74 ± 9** (p < 0.01). Insulin areas were similar (white bread 6618, under-ripe 7464, over-ripe 8292 pmol/l × 240 min). | B (diabetic subjects) | Hermansen K et al. 1992, Diabet Med. PMID 1395467 (abstract) |
| B4 | Healthy-person GI by ripeness: not read. A Thai study (n = 10 healthy, 50 g carbohydrate) was reported with GI 36.8–46.7 for ripe and over-ripe cultivars in a search snippet only. | **source pending** (do not use) | search snippet; primary not located |
| B5 | **Peak estimate.** Scale the peak with carbohydrate × GI from the sugar-drink anchor cola.md B2 (35 g sucrose, GI 65 → incremental glucose peak **+2.3 mmol/l**): 2.3 × (23.9 × 51)/(35 × 65) = **≈ +1.2 mmol/l** (range +0.8 to +1.8). Peak time **≈ 30–60 min** (liquid cola peaks 20–30 min; a solid with fibre and starch should be slower). Back to baseline in **≈ 2 h**. No banana glucose curve in healthy adults was read. | C | B1, P1, cola.md B2 |
| B6 | Insulin: for diabetics banana insulin areas were similar to white bread (B3). For healthy adults not read. Estimate: incremental peak ≈ 0.54 × 30 mU/l (cola.md B1/B2) = **≈ 16 mU/l** (range 10–25), same timing as glucose. | C | B5, cola.md B1, B2 |
| B7 | Undershoot ("sugar crash") after one banana: **not studied**. The cola dip (cola.md B4) follows a large, fast sugar load. | ? | needs CGM data |

## Potassium (absorption, blood, kidney)

| ID | Claim | Level | Source |
|---|---|---|---|
| K1 | Normal people eating 90 mEq K/day absorb **about 90%** (81 mEq) and excrete an equal amount in urine; faecal K ≈ 9 mEq/day. Nearly all absorption is in the small intestine, mainly passive. | A | Agarwal R, Afzalpurkar R, Fordtran JS 1994, Gastroenterology. PMID 8039632 (abstract) |
| K2 | One banana: 10.8 mmol × 0.9 = **≈ 9.7 mmol absorbed**. | C | P4, K1 |
| K3 | **Healthy people (n = 32), larger load than a banana:** a potassium-deficient meal **plus 35 mmol K** did **not raise serum potassium**, while **hourly urinary K excretion rose sharply**, also with aldosterone blocked (eplerenone). The authors propose a gut-to-kidney signal independent of serum K and aldosterone. 35 mmol ≈ 3.2 bananas (35 ÷ 10.8). | A (one clinical pharmacology study) | Preston RA et al. 2015, Kidney Int. PMID 26308672 (abstract) |
| K4 | 40 mmol K (citrate or chloride) as a fasting oral load in 18 healthy people: plasma K rose similarly for all interventions over 4 h (size not in abstract); citrate gave more red-cell K uptake and kaliuresis. | B (n = 18, salt not food) | Wouda RD et al. 2023, CJASN. PMID 37382933 (abstract) |
| K5 | **Banana in dialysis patients (worst case for K handling):** ≈ 250 g banana (≈ 2.1 bananas, ≈ 22 mmol K) at the start of haemodialysis did **not cause hyperkalaemia**. Serum K at 2 h 3.9 ± 0.5 vs 3.6 ± 0.3 mmol/l control, at 4 h 3.5 vs 3.3. Arrhythmias 8.2% vs 29.5%; hypokalaemia 52.5% vs 80.3% (dialysis removes K). | B (RCT n = 122, patients) | Quan Z et al. 2024, Int J Nurs Sci. PMID 38707694 (abstract) |
| K6 | **Blood K after one banana, healthy adult:** not measured in a study we read. Upper bound if all 9.7 mmol stayed in extracellular water (≈ 14 L, **VERIFY**, background value) with no cell uptake or urinary loss: **+0.7 mmol/l**. Real rise is smaller (cell uptake, renal loss; K3 saw none after 35 mmol with a meal). Show **≈ 0 to +0.2 mmol/l, brief**, as our estimate. A meta-analysis snippet (+0.14 mmol/l for supplements) is **source pending**. | C | P4, K1, K3, K4 |
| K7 | Renal excretion: at steady state urine carries what is absorbed (K1); after a K-rich meal excretion rises within hours (K3). Share of one banana's K excreted in the first 6 h: **not measured**. Assume most of the 9.7 mmol leaves in urine over ≈ 24 h. | C | K1, K3 |
| K8 | Magnesium 32 mg (≈ 1.3 mmol) and B6 0.43 mg: no acute effect source read. | ? | — |

## Colon (fibre, resistant starch, fermentation)

| ID | Claim | Level | Source |
|---|---|---|---|
| C1 | **Orocecal transit** in healthy volunteers (n = 17): scintigraphy (50% of tracer in caecum) **73–180 min**; lactulose breath H₂ **60–130 min**; the two correlated (r = 0.79). | B (preprint, n = 17) | von Muhlenbrock C et al. 2024, preprint, DOI 10.21203/rs.3.rs-4339707/v1 (abstract) |
| C2 | In 8 normal subjects lactulose breath test and scintigraphy correlated (r = 0.95), but **lactulose itself speeds small-bowel transit**, so the tests are not equivalent. | A (n = 8) | Miller MA et al. 1997, Dig Dis Sci. PMID 9009110 (abstract) |
| C3 | Breath-test OCTT is the sum of oesophageal, gastric and small bowel transit; an H₂ peak within 90 min of lactulose should not be accepted without an independent transit measurement. | B (monograph) | Xiao Y et al. 2026, PMC13071411 (`epmc.py grep`) |
| C4 | **Banana arrival at the caecum.** Gastric emptying done by ≈ 60–75 min (G4) and OCTT 73–180 min from ingestion (C1) → first unabsorbed starch and fibre reach the caecum at **≈ 2–3 h**, bulk **≈ 3–6 h** (liquid bolus data; solid fibre is slower). | C | G4, C1 |
| C5 | Colonic SCFA (autopsy within 4 h of sudden death): total SCFA **131 ± 9 mmol/kg in caecum**, 80 ± 11 in descending colon, 13 ± 6 in terminal ileum; pH 5.6 caecum → 6.6 descending. Blood SCFA (µmol/l): **portal 375 ± 70, hepatic 148 ± 42, peripheral 79 ± 22**; acetate dominant; liver takes up propionate, colon wall takes up butyrate. | A (autopsy) | Cummings JH et al. 1987, Gut. PMID 3678950 (abstract) |
| C6 | Fermentation of banana carbohydrate: green banana flour starch "almost totally fermented" (A1). No human dose–time curve of SCFA after one ripe banana was found. Fermentable load ≈ 0.9–6 g starch (A3) + up to 3.1 g fibre. Show a **qualitative SCFA rise from ≈ 3 h, lasting beyond 12 h**, without grams. | ? (amount) · C (timing) | A1, A3, C4 |
| C7 | Gas: unabsorbed starch/fibre can raise breath H₂. No banana-specific breath-H₂ study found. | ? | needs study |

## Heart rate and blood pressure

| ID | Claim | Level | Source |
|---|---|---|---|
| H1 | No study of acute heart rate or blood pressure after a single banana in healthy adults was found. | ? | Europe PMC searches 2026-10-08 |
| H2 | Reference from cola.md H2: 1 g/kg glucose + fructose raised mean HR 65 vs 59 bpm (n = 15). A banana is ≈ 0.34 g/kg carbohydrate (23.9 g ÷ 70 kg); scaled: 6 bpm × 0.34 ≈ 2. So **0 to +2 bpm**; no caffeine. BP: acute effect of 422 mg K **negligible**. | C | cola.md H2; P1, P4 |

---

## Myth check

| Claim | Verdict | Evidence |
|---|---|---|
| "Bananas raise blood potassium dangerously" | **False for healthy people, and not shown even for dialysis patients at 250 g.** One banana = 10.8 mmol K. A 35 mmol load with a meal did not raise serum K in 32 healthy adults; urinary excretion rose within hours. In haemodialysis, 250 g banana did not cause hyperkalaemia and reduced arrhythmias. People with advanced kidney disease or on K-sparing drugs are outside this model. | P4, K1, K3, K4, K5 |
| "Banana = instant energy" | **Partly true.** GI 51 (moderate) and GL ≈ 12; estimated peak at ≈ 30–60 min and small (≈ +1.2 mmol/l), not a spike like a sugar drink. Over-ripe is faster (GI 74 vs 43 under-ripe in type 2 diabetes). | B1, B2, B3, B5 |
| "Banana sugar causes a crash" | **Not supported.** No dip data for banana; the cola dip comes from a larger, faster sugar load. | B7 |
| "Green bananas give resistant starch, ripe ones don't" | **True.** Starch 37% of dry weight (least ripe) vs 3% (most ripe); up to 90% of starch escaped digestion in least ripe batches; 83.7% of green banana flour starch reached the ileum. | R1, A1, A3 |
| "Ripe bananas have no fibre" | **False.** Fibre fully recovered at the ileum at every ripeness; USDA 2.6 g/100 g. | R1, P1 |
| "Magnesium and B6 in bananas calm you or help sleep" | **Unsupported at this dose** (32 mg Mg, 0.43 mg B6). | K8 |

---

## Model parameters (default healthy adult, 70 kg, fasting, one medium banana 118 g eaten in ≈ 3 min, yellow/mid-ripe)

| Parameter | Value | Range | Basis |
|---|---|---|---|
| Energy | 105 kcal | 98–113 | P1 |
| Available carbohydrate | 23.9 g: glucose 5.9 + fructose 5.7 + sucrose 2.8 + starch 6.3 (+ ≈ 3 g other) | starch vs sugar depends on ripeness | P1–P3, R1–R3 |
| Fibre | 3.1 g, reaches colon intact | 2.8–3.4 | P1, R1, A4 |
| Potassium | 422 mg = 10.8 mmol | ±15% | P4 |
| Mg / B6 | 32 mg / 0.43 mg | — | P4 |
| Ripeness presets | green starch ≈ 37% DW; yellow ≈ 21% DW (USDA); spotted ≈ 3% DW | only endpoints sourced | R1, R3 (R5 = ?) |
| Chewing/saliva | mechanical; small starch breakdown, not shown separately | — | M1–M4 (C) |
| Gastric emptying | calorie-driven 2 kcal/min after 10–20 min lag → empty ≈ 60–75 min; **T½ ≈ 35–50 min** (first-order k ≈ ln2/42 ≈ 0.016 /min) | 1–4 kcal/min; upper bound T½ ≈ 120 min | G1–G4 (C) |
| Sugar absorption | glucose and fructose absorbed within ≈ 10–20 min of reaching duodenum | — | A2, cola.md A5 (C) |
| Glucose (plasma) | **+1.2 mmol/l at 30–60 min**, baseline at ≈ 2 h, no undershoot | +0.8 to +1.8 | B1, B2, B5 (C) |
| Insulin | incremental peak ≈ 16 mU/l at 30–60 min | 10–25 | B6 (C) |
| GI / GL | 51 ± 3 / ≈ 12 | under-ripe 43, over-ripe 74 (diabetics) | B1–B3 |
| Fructose to circulation | ≈ 1.0 g | — | A5 (C) |
| Potassium absorbed | 9.7 mmol (90%) over ≈ 1–3 h | 85–95% | K1, K2 |
| Plasma K change | 0 to +0.2 mmol/l, brief | upper bound +0.7 | K3, K6 (C) |
| Urinary K | most of 9.7 mmol excreted over ≈ 24 h, faster in first hours | — | K1, K3, K7 (C) |
| Colon arrival | first residue ≈ 2–3 h, bulk ≈ 3–6 h | OCTT 60–180 min | C1, C4 (C) |
| Starch to colon | yellow ≈ 3–6 g if 50–90% escapes; ripest ≤ 1 g; green more | wide | A3 (C) |
| Fermentation | qualitative SCFA rise from ≈ 3 h, > 12 h, no grams | — | C5, C6 (?) |
| HR / BP | 0 to +2 bpm / ≈ 0 | — | H2 (C) |

Animation note: soft pulp chewed, stomach emptying about 2× slower than water but faster than a mixed meal, a gentle glucose bump (not a spike), a very small potassium rise in blood with kidney excretion running for hours, and a colon phase scaled by the ripeness slider (more starch and fermentation when green).

## Open questions (to research next)
1. Sugar/starch split for green and spotted bananas at the same source level as yellow (Cordenunsi 2019 full text, Soares 2011, Marriott 1981 were not read in full).
2. Which ripeness does USDA FDC 173944 describe? R3 says mid-ripe, but its sucrose share (20%) disagrees with R2 (80%).
3. Healthy-adult glucose and insulin curve after a real banana with 15-min sampling; the Thai ripeness study (B4) must be located and read.
4. Banana-specific gastric emptying (G4 is built from calories).
5. Plasma and urinary K time course after a ~10 mmol K food load in healthy adults. Wouda 2023 full text (PMC10578626) likely has plasma K numbers; the page was captcha-blocked and the API text was not parsed.
6. SCFA after a single banana (breath H₂, plasma acetate over 12 h) and yield per gram of fermented starch/fibre.
7. Extracellular fluid volume (14 L, K6) and small-bowel transit time need citations.
8. Acute HR/BP after a banana: no study found.
9. Fructose malabsorption threshold, to judge whether 7 g fructose causes gas: no primary study retrieved.
