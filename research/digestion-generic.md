# Generic digestion model (any food from its macros) — research dossier

Status: **draft v1** · last updated 2026-10-08
Rule: see upute.md §2. Levels: **A** established · **B** supported, variable · **C** our estimate (math shown) · **?** unknown.
Abstracts were read through the Europe PMC REST API (`resultType=core`); full texts through the Europe PMC `fullTextXML` endpoint (sentence grep). Nothing was taken from memory. Items marked **VERIFY** / **source pending** were not read in a primary source and must not ship.

Reused (not re-researched) from existing dossiers: `cola.md` G1, G3, G4, G7 (liquid emptying), A1/A2/A5 (sugar absorption), B1/B2/B4/B5/B7/B9 (glucose curve anchor), L-series (fructose); `water.md` A1/A2/A5 (water emptying, small-bowel pockets, absorption); `banana.md` G1/G2 (solid emptying), C1–C3 (orocecal transit), C5 (colonic SCFA), A1, R1 (starch/fibre reaching the colon).

Honest headline: we have good numbers for **liquid** emptying, for **one standard solid meal**, for **whole-gut and colon transit** and for the **glucose anchor**. We have only **weak** numbers for the effect of fat/fibre on emptying, for healthy small-bowel transit, for GL-to-peak scaling of solid foods and for the time of the triglyceride peak. These are marked and listed in "Open questions".

---

## 1. Stomach (gastric emptying)

| ID | Claim | Level | Source |
|---|---|---|---|
| GE1 | **Standard low-fat solid meal, scintigraphy, 123 healthy adults, 11 centres.** Median % retained in the stomach (95th percentile): **69% (90%) at 1 h, 24% (60%) at 2 h, 1.2% (10%) at 4 h**. >10% retained at 4 h = delayed. Men empty faster early, men and women equal at 4 h; faster in older subjects; independent of BMI. Power-exponential model fitted from 1/2/4 h data gave the same T50 as 10-min imaging. | A | Tougas G et al. 2000, Am J Gastroenterol. PMID 10894578 (abstract) |
| GE2 | Consensus: low-fat egg-white meal, imaging at 0, 1, 2, 4 h is the standardized test. | A | Abell TL et al. 2008, J Nucl Med Technol. PMID 18287197 (abstract) |
| GE3 | The GE1/GE2 test meal (read in the full text): 120 g liquid egg white, 2 slices white bread, 30 g jam, 120 mL water = **255 kcal (72% carbohydrate, 24% protein, 2% fat, 2% fibre)**. | A | Parkman HP et al. 2025, Dig Dis Sci. PMC11972169 (full text) |
| GE4 | **Meal size, same food, 24 normal adults:** T1/2 (power exponential) **full meal 94 ± 21 min; half meal 67 ± 19 min; quarter meal 69 ± 28 min**. Mean + 2 SD of T1/2: 105.2 min (half), 125.8 min (quarter). Retention at 2 h, mean + 2 SD: 41.6% (half), 59.5% (quarter). So small solid meals empty faster, but T1/2 does not fall below ~65 min. | B | Parkman 2025, PMID 39971826 (abstract + full text) |
| GE5 | **C fit of GE1**, power exponential R(t) = exp(−(t/τ)^β): ln(retention) at 1/2/4 h = −0.371/−1.427/−4.423 gives β between 1.63 and 1.94; with **β = 1.8, τ = 104 min** the model returns **69.0%, 27.5%, 1.1%** (data 69, 24, 1.2) and **T50 = 85 min**. (GE4 gives 94 min for the 255 kcal egg sandwich in a different cohort, so T50 ≈ 85–95 min.) | C | GE1, GE3, GE4 (arithmetic) |
| GE6 | Healthy 90 adults, 13C breath test: liquid test meal T½ 80.5 ± 22.1 min (Tlag 40.3 ± 10.2); solid test meal median T½ 127 min (IQR 112–168), Tlag 81.5 min (IQR 65.5–102); no effect of age, sex or BMI. Different method (breath test, larger meal) than GE1, so 127 min is an upper bound for a heavier solid meal. | B | Hellmig S 2006, PMID 17074022 (via banana.md G1) |
| GE7 | Ultrasound, solid and semi-solid meals (healthy, Sri Lanka): lag ≈ 60 min, half-emptying ≈ 120 min, roughly linear after the lag. | B | Amarasiri L 2025, PMC12476634 (via banana.md G2) |
| GE8 | **Lag phase depends on the marker, i.e. on what you track.** Same meal, same people: lag **30 ± 11 min** for 111In resin pellets vs **58 ± 12 min** for 131I-labelled fibre (post-lag slope not different). So "lag" is a property of the phase followed, not one number. | B | Camilleri M et al. 1989, Am J Physiol. PMID 2764112 (abstract) |
| GE9 | **Liquids empty at a calorie-driven rate.** 600 ml test drinks (n=6): T½ glucose 0.1 kcal/ml **9.4 ± 1.2 min**, peptide hydrolysates 0.2 kcal/ml 16.3 and 17.2 min, milk protein 0.7 kcal/ml **26.4 ± 10.0 min**. Caloric density was linearly related to T½ (r = 0.96); "the nature of the calories seems to play a minor role". | B (n=6) | Calbet JA, MacLean DA 1997, J Physiol. PMID 9032702 (abstract) |
| GE10 | Range of liquid energy delivery in health ≈ **1–4 kcal/min**; energy-dense and high-lipid feeds empty slower (at a specific kcal/min rate). | A | Murthy TA 2023 (PMC10236995, full text); cola.md G1 |
| GE11 | MRI, 500 ml shakes: **100 kcal → T½ 26.5 min; 500 kcal → 69.5 min**; energy density mattered more than viscosity. | A | Camps G 2016, AJCN. PMID 27281305 (cola.md G4) |
| GE12 | **C fit for liquids** through GE11: slope (69.5 − 26.5)/400 kcal = 0.1075 min/kcal; intercept at 0 kcal = 26.5 − 10.75 = 15.75 min, which is close to water (13 min, water.md A1). So **T50_liq ≈ 13 + 0.11 × kcal** (cola 139 kcal: 28 min vs cola.md G7 31 min; 500 kcal: 68 min). The 500 ml volume of GE11 is bigger than a can, so small drinks may be slightly quicker. GE9 (different method, glucose 60 kcal 9.4 min) is faster than this line: method spread of ±2×. | C | GE9, GE11, water.md A1 |
| GE13 | **Fibre in a solid meal slows emptying.** Ultrasound, 8 healthy, 870 kcal (36% fat) meals, fibre 20 vs 4 g per 1000 kcal: total gastric emptying time **231.7 ± 17.3 vs 186.0 ± 15.6 min** (+25%, p<0.05); glucose AUC lower with high fibre (160 vs 226). | B (n=8) | Benini L et al. 1995, Gut. PMID 7615267 (abstract) |
| GE14 | Soluble fibre added to liquids delays proximal emptying (oat beta-glucan 7.5 g in a 500 mL, 500 kcal liquid, ultrasound) and guar 9 g slowed emptying of 50 g glucose in T2D. No effect size in healthy people was available in the abstracts. | B | Yu K 2014, PMID 24901089 (healthy n=10 + T2D); Russo A 2003, PMID 12870776 (T2D) |
| GE15 | **Fat slows emptying of the lipid phase specifically.** In a mixed solid-liquid meal, the water phase empties quickly (comparable to meals containing natural fat), the non-absorbable fat analogue empties as fast as water, but **natural fat empties very slowly**: the slowing comes from receptors that sense fat's digestion products, not from low density. | B | Cortot A et al. 1982, Gastroenterology. PMID 7060909 (abstract) |
| GE16 | No read source gives a **numeric** slowing factor per gram of fat for the solid phase. Fat added to a carbohydrate meal "flattened the glucose curve, more so for fast-absorbed potato", "probably due to delayed gastric emptying" (37.5 g fat + 75 g carbohydrate). | B (direction) · ? (size) | Collier G 1984, Diabetologia. PMID 6368300 (abstract) |
| GE17 | Sex: men empty faster early (GE1), post-lag gastric emptying faster in men (Degen), women retained more liquid (cola.md G8). Size not quantified in the abstracts. | B | Tougas 2000; Degen LP, Phillips SF 1996, Gut. PMID 8977347 (abstract) |
| GE18 | Wireless-capsule "gastric emptying time" in 37 healthy adults (260 kcal SmartBar): median **2.5 h (IQR 1.9–3.6)**. That is the exit of an indigestible capsule (usually with the next migrating motor complex), **not** the emptying of a meal. Do not use as meal emptying. | B | Kornum DS 2025, PMC11986663 (full text) |

## 2. Small intestine (transit, absorption)

| ID | Claim | Level | Source |
|---|---|---|---|
| SI1 | **Orocecal transit (mouth to caecum), 17 healthy volunteers:** scintigraphy (50% of tracer in the caecum) **73–180 min**; lactulose breath H2 **60–130 min** (r = 0.79). Both liquid-bolus type tests. | B (preprint) | von Muhlenbrock C 2024, DOI 10.21203/rs.3.rs-4339707/v1 (banana.md C1) |
| SI2 | Lactulose itself speeds small-bowel transit, so breath-test OCTT is not equal to scintigraphy (r = 0.95 in 8 subjects). | A | Miller MA 1997, PMID 9009110 (banana.md C2) |
| SI3 | In a real mixed meal (sausage, potato, beans, custard; 14 healthy), the breath H2 rise coincided with the radioactivity rise over the caecum; **small-intestinal transit time did not correlate with gastric T½ or whole-gut transit**; lactulose (10–40 g) in the meal sped small-bowel transit without changing gastric emptying. Numeric transit times are not in the abstract. | B | Read NW et al. 1980, Gastroenterology. PMID 7439633 (abstract) |
| SI4 | **The ileum is a reservoir.** Solid-marker colonic filling occurs in boluses (10–80% of the isotope, mean 26%) separated by plateaus of 15–120 min (mean 51 min); half of the boluses happened within 1 h of a second meal. | B | Camilleri 1989, PMID 2764112 (abstract) |
| SI5 | Capsule endoscopy, 336 patients (not healthy controls): mean small-bowel transit **282 ± 132 min**; ageing and stenosis lengthen it; the same person varies by SD ≈ 98 min between studies. | B (patients) | Tominaga K 2020, Ann Transl Med. PMID 32355792 (abstract) |
| SI6 | Liquid scintigraphy in 35 healthy adults: reference liquid T½ **10–60 min**; "rapid" small-bowel transit = first activity in caecum/ascending colon within **1 h**. | B (n=35, 28 women) | Dhukia S 2024, PMC11232722 (abstract) |
| SI7 | **C estimate, healthy small-bowel transit for a solid meal:** no healthy-control capsule or scintigraphy median was retrieved. From SI1 (60–180 min mouth-to-caecum for a liquid test) and SI5 (patients, 282 min) we set the model value for the **unabsorbed residue: median 3 h from gastric exit to caecum, range 1.5–4.5 h**. | C | SI1, SI5 |
| SI7b | **Updated 2026-10-16 (supersedes the 3 h above):** systematic review of ingestible capsules in **healthy volunteers** (22 studies, 1,885 people): small-intestinal transit **3.3–7 h** across studies (gastric emptying 0.4–15.3 h, colon 15.9–28.9 h, whole gut 23.0–37.4 h); protocol (meal or not) changes the values. The model keeps **4 h** (2 × 120 min after gastric exit, `foodSim.ts` siTransit 240), inside this range; claim SI7 says the same. The old 3 h (1.5–4.5) was below the healthy capsule range. | B (non-digestible capsule, not food residue) | Nandhra GK et al. 2023, J Clin Med. PMID 37629314 (PMC10455695, abstract + full-text grep) |
| SI8 | Carbohydrate: sucrose is split at the brush border (sucrase-isomaltase); glucose enters by SGLT1, fructose by GLUT5; sugars are absorbed within ≈ 5–20 min of reaching the duodenum (not rate-limiting). | A (mechanism) · C (timing) | cola.md A1, A2, A5; banana.md A2 |
| SI9 | Segment of absorption (duodenum vs jejunum vs ileum) for carbohydrate, protein, fat (with bile) and water: **not obtained in a read source**. Mudie 2014 shows water moving through the small bowel in pockets and absorbed at ta½ ≈ 12 min (water.md A2, A5). | ? | open question 5 |
| SI10 | Dietary fibre (non-starch polysaccharide) is **completely recovered** at the ileum; resistant starch from unripe banana reached the ileum at up to 90% (ileostomy) / 83.7% (green banana flour, intubation). | A | Englyst HN, Cummings JH 1986, PMID 3014853; Faisant N 1995, PMID 7857906 (banana.md R1, A1) |
| SI11 | **Fat goes by lymph.** After a high-fat meal the thoracic duct widens on MR-lymphangiography (22 healthy adults, hourly for 6 h): **abdominal +21.5% and lower thoracic +16.8%, maximum at 5 h; upper thoracic +13.8%, maximum at 2 h.** No increase after a **fat-free** or a **medium-chain-triglyceride** meal (MCT does not use the lymph route). | B (n=22) | Padberg J et al. 2026, Sci Rep. PMID 42481617 (abstract) |
| SI12 | Dietary triglyceride clearance to the liver is **8–12% of meal fat** in lean people (10–16% in diabetes / fatty liver). | B (review) | Lambert JE, Parks EJ 2012, BBA. PMID 22281699 (abstract) |
| SI13 | "Chylomicrons appear in blood after 1–3 h": no primary source read for this exact number. TG significantly raised by 3 h and one study peaked at 120 min (see TG1–TG2); the lymph results (SI11) support lymph filling over 2–5 h. | **source pending** | — |

## 3. Colon (transit, fermentation, excretion)

| ID | Claim | Level | Source |
|---|---|---|---|
| CO1 | **Whole gut transit time, blue-dye first appearance, 863 healthy adults (PREDICT 1): median 28.7 h.** "Normal" 14–58 h; <14 h fast; ≥59 h slow. Classes: C1 fast (mean 0.38 d, n=79), C2 (mean 1.02 d, n=424), C3 (mean 2.01 d, n=186), C4 slow (mean 4.21 d, n=174). Transit times **cluster in steps about 24 h apart** (people tend to empty once a day). Stool form: Bristol type 1 median >5 days, type 6 median 1 day. | A | Asnicar F et al. 2021, Gut. PMID 33722860 (PMC8349893, full text) |
| CO2 | Wireless capsule, 37 healthy adults: **colonic transit median 20.8 h (IQR 14.0–28.8); whole-gut 28.7 h (IQR 22.0–42.7)**. | B | Kornum 2025, PMC11986663 |
| CO3 | **Radiopaque markers, 73 healthy:** total colonic transit **35.0 ± 2.1 h (mean ± SE)**; right colon 11.3 ± 1.1 h, left colon 11.4 ± 1.4 h, rectosigmoid 12.4 ± 1.1 h. Men shorter than women (p < 0.05). Age and a small fibre supplement did not change it. | A | Metcalf AM 1987, Gastroenterology. PMID 3023168 (abstract) |
| CO4 | Colonic transit faster in men; whole-gut scintigraphy and markers agreed for total colonic time; large within-person variation between two visits. Capsule: colonic transit slower in women (P = .02). | B | Degen & Phillips 1996 (PMID 8977347); Rao SS 2009, PMID 19418602 (abstracts) |
| CO5 | Regional norms: Western mean colonic transit 30–40 h; Indian 15.4 h, Korean 16.8 h, Hong Kong Chinese 24.5 h; total gut time "normal <3 days". | B (review) | Kalra S 2026, PMC12968637 (full text) |
| CO6 | The **first marker in stool coincided with the first carmine-red dye** from the same meal, so a dye or marker meal gives the first-appearance time of that meal. | B | Read 1980, PMID 7439633 (abstract) |
| CO7 | Stool weight over 48 h depended on whole-gut transit, not on small-bowel transit. | B | Read 1980 |
| CO8 | **Fraction showing first appearance before 24 h**, from the CO1 classes: C1 (79) + about half of C2 (≈ 212) ≈ 291/863 ≈ **34%**. Lognormal check: median 28.7 h with 14 h and 58 h as the 5th/95th percentiles gives σ = ln(58/14)/3.29 = 0.43, and P(T < 24 h) = Φ((ln24 − ln28.7)/0.43) = Φ(−0.42) = **34%**. IQR in CO2 implies σ ≈ 0.49. | C | CO1, CO2 |
| CO9 | **Fermentation.** SCFA in the caecum 131 ± 9 mmol/kg vs 80 ± 11 in the descending colon; pH 5.6 caecum to 6.6 descending; portal SCFA 375 µmol/l vs peripheral 79. Unabsorbed starch and fibre are fermented there. | A (autopsy) | Cummings JH 1987, PMID 3678950 (banana.md C5) |
| CO10 | Water and electrolyte absorption in the colon (how many ml/day, ileal output): **no read source**. | ? | open question 5 |
| CO11 | 50% excretion time of the marker (not the first appearance) for a single meal: not found as a number. Colonic mean residence 35 h (CO3) plus the small-bowel time (SI7) implies the bulk leaves **after** the 24 h mark for most people. | ? · C | CO3, SI7 |

## 4. Blood glucose

| ID | Claim | Level | Source |
|---|---|---|---|
| GL1 | **GI predicts the curve.** Database of 1,126 foods (8–12 healthy subjects each): GI correlates with the **incremental peak (r = 0.76), absolute peak (r = 0.73), incremental glucose at 60 min (r = 0.70)** and the maximum excursion (r = 0.68). | A | Brand-Miller JC et al. 2009, AJCN. PMID 19056599 (abstract) |
| GL2 | **GL is dose-proportional in healthy lean adults.** Ten foods at equal GL gave the same glucose AUC as one slice of white bread for 9 of 10 (lentils lower than predicted); stepwise increases of GL (1, 2, 3, 4, 6 slices equivalents) raised glycaemia and insulinaemia significantly and predictably. | A | Brand-Miller JC 2003, J Nutr. PMID 12949357 (abstract) |
| GL3 | **Free-living mixed meals (CGM, 514 adults, 3 h):** maximum rise only **up to 1.3 mg/dL (0.07 mmol/l) per 10 GL**; peak at **50 min after breakfast and 70 min after lunch/dinner**; higher after age (+1.9 to 3.5 mg/dL per 10 y) and BMI. | A | Calvo-Malvar M 2025, JAMA Netw Open. PMID 40986304 (PMC12457981) |
| GL4 | **Anchor (liquid sugar):** 35 g sucrose in 300 ml, GI ~59–65, GL ≈ 21: **+2.3 mmol/l peak** at 20–30 min, baseline by ~60 min, nadir ≈ −0.7 mmol/l at 60–120 min. | A | cola.md B1–B7, B10 |
| GL5 | **Protein and fat lower the glucose response of 50 g glucose in a linear, dose-dependent way** (doses 0, 5, 10, 30 g each, 10+ non-diabetic adults): gram for gram, protein ≈ **2×** (results) / **≈ 3×** (conclusion) the effect of fat. The abstract does not state the mmol/l per gram. Author caveat: may not apply to solid meals. | B | Moghaddam E, Vogt JA, Wolever TMS 2006, J Nutr. PMID 16988118 (abstract) |
| GL6 | 37.5 g fat flattened the glucose curve of 75 g carbohydrate; insulin was not reduced (fat made the insulin response relatively larger). | B | Collier 1984, PMID 6368300 |
| GL7 | Cola eaten with a muffin removed the post-peak dip (cola.md B4). A larger dip at 2–3 h predicts hunger and a shorter time to the next meal. | A | cola.md B4, B9 (Wyatt 2021, PMC7610681) |
| GL8 | Large between-person variation: CV of glucose response to identical meals **68%**, insulin 59%, triglyceride 103% (n = 1,002). Person-specific factors dominate triglyceride, meal macros dominate glucose (15.4% of variance). | A | Berry SE 2020, Nat Med. PMID 32528151 (abstract) |
| GL9 | **Size of GL-to-peak slope is not the same for liquids and mixed solids.** Liquid anchor: 2.3 mmol/l ÷ 21 GL = **0.11 mmol/l per GL**. Free-living mixed meals (GL3): 0.07 mmol/l per 10 GL = **0.007 per GL**, ~15× smaller (includes fibre, fat, mixed carbs and CGM noise; a regression slope, not a controlled dose-response). A controlled solid-food dose-response with mmol/l values was **not retrieved**. | C · ? | GL3, GL4 |
| GL10 | **Personal sugar curves can't be predicted from body facts.** 800 people, 46,898 meals with a glucose sensor: high variability in response to identical meals; prediction needed blood parameters, habits, anthropometrics, activity **and gut microbiota** (machine learning). → Inside 24h does **not** personalise the sugar curve by sex, age, weight or activity; it stays "typical" with a ±40% range (GL8) and the answer says so. | A (variability) · decision C | Zeevi D et al. 2015, Cell. PMID 26590418 (abstract) |

## 5. Triglycerides, amino acids

| ID | Claim | Level | Source |
|---|---|---|---|
| TG1 | **High-fat meal, 35 overweight/obese adults** (714 kcal: 50 g fat, 54 g carbohydrate, 12 g protein; hourly to 4 h): maximum TG rise **median +0.77, mean +1.04 mmol/l** (two people >4); iAUC median 1.70 mmol/l·4 h. 57% had a peak above 1.98 mmol/l. Large cohorts show maximal TG changes of only **+0.1 to +0.3 mmol/l after normal food** (secondary quote). | B | Wilson SM et al. 2021, Lipids Health Dis. PMC8451105 (full text) |
| TG2 | Systematic review of 16 single high-fat-meal trials: TG significantly raised at **3 h**; the lipaemic effect "evident at **3–4 h**"; in one trial TG peaked at **120 min** (two high-fat meals), in another TG was back near baseline by 5–6 h. | B (review) | Wilson ML 2025, Nutr Rev. PMID 39094053 (PMC11819491) |
| TG3 | 50 g fat breakfast, 16 postmenopausal women, 8 h sampling: the TAG peak was on average **90 min later** after the control meal than after the pomegranate-oil meal (so peak time varies by fat type, ±1.5 h). Absolute peak time not stated in the text read. | B | Almoraie MM 2026, J Nutr. PMC13014500 |
| TG4 | **C curve:** ΔTG(t) rises from ~1 h, peaks at **≈ 3.5 h** (3–4 h, TG2; thoracic duct maximum 2–5 h, SI11) and returns to baseline by **≈ 6–8 h**. Amplitude ≈ **0.77 mmol/l per 50 g fat (median)**, scaled linearly: 15 g fat → +0.23 mmol/l, which sits inside the +0.1–0.3 mmol/l of normal meals (TG1); 50 g → +0.77 (range up to +1.04 mean, >4 in outliers). | C | TG1, TG2, SI11 |
| AA1 | **Amino acids after a real meal (red meat / plant-based analogue, RCT crossover):** postprandial amino acids **peaked at 2–3 h**; total amino acids near **2 h**, essential amino acids near **3 h** (branched-chain slowest). | B | Pham T 2022, Curr Dev Nutr. PMID 35669048 (PMC9154224) |
| AA2 | Protein type changes kinetics: whey gave "a dramatic but short increase" in plasma amino acids; casein a "prolonged plateau of moderate hyperaminoacidaemia, probably because of slow gastric emptying" (leucine kinetics, healthy adults). | A | Boirie Y 1997, PNAS. PMID 9405716 (abstract) |
| AA3 | **C curve:** amino-acid appearance follows protein delivery from the stomach plus ~30–60 min absorption; peak ≈ **1 h** for liquid fast protein, ≈ **2–3 h** for a solid mixed meal. | C | AA1, AA2, GE1–GE11 |

## 6. Energy cost and "food coma"

| ID | Claim | Level | Source |
|---|---|---|---|
| TE1 | **Thermic effect by macronutrient:** fat **0–3%**, carbohydrate **5–10%**, protein **20–30%** of the energy ingested. Cost comes from absorption, initial metabolism and storage; sympathetic activity modulates it. | A (review) | Tappy L 1996, Reprod Nutr Dev. PMID 8878356 (abstract) |
| TE2 | Mixed Chinese diet in 20 young adults: TEF = **8.73% of total energy expenditure** (below the usual 10%). Aging review: diet-induced thermogenesis ≈ 10% of daily expenditure; measurement durations ≤ 240 min. | B | Tian Y 2023, PMID 37533382; Gonzalez K 2026, PMID 42371245 (abstracts) |
| TE3 | Higher-protein meals give more DIT in meta-analysis of acute studies (SMD 0.45, 95% CI 0.26–0.65). | A | Guarneiri LL 2024, Adv Nutr. PMID 39486625 (abstract) |
| TE4 | Endogenous rhythm: DIT is highest in the biological morning, trough in the evening (peak-to-trough amplitude 44%, ≈ 10 kcal/4 h). | B | Vujovic N 2026, Metabolism. PMID 42190872 (abstract) |
| TE5 | **C model:** TEF = 0.075 × carbohydrate kcal + 0.015 × fat kcal + 0.25 × protein kcal (mid-points of TE1). Check on a 50/35/15 diet: 0.5 × 7.5 + 0.35 × 1.5 + 0.15 × 25 = 8.0% of intake, consistent with TE2. Alcohol: not researched (?). Duration of the effect ≈ 3–5 h. | C | TE1, TE2 |
| FC1 | **"Food coma" is real but not macro-specific.** 16 adults, two ~760 kcal meals (high-fat vs high-carbohydrate): sleepiness (sleep latency test) was **greater 1.5 h after meals than before** (P = 0.004), and by the EEG sleepiness test at **3 h 20 min**; **no difference by meal composition**; not explained by circadian rhythm alone. | B (n=16) | Wells AS et al. 1998, J Appl Physiol. PMID 9475860 (abstract; energy of meals from Wells & Read 1996 3181–3599 kJ) |
| FC2 | In 18 men, lassitude rose after all four test meals; a lower-energy high-fat meal made them more fatigued than a higher-energy high-carbohydrate meal in the morning, but less so at lunch time. | B (n=18 men) | Wells AS, Read NW 1996, Physiol Behav. PMID 8737894 (abstract) |
| FC3 | Glucose dips 2–3 h after meals predict more hunger and earlier eating than the peak does (1,070 people on CGM). | A | Wyatt P 2021, Nat Metab. PMC7610681 |
| FC4 | Sleepiness after a **small** snack (below ~700 kcal): no data read. | ? | — |

---

## Suggested generic model

Inputs per food portion: `kcal`, `carbs_avail` (g, = carbohydrate − fibre), `sugars`, `fibre`, `fat`, `protein`, `alcohol` (g), `kind` ∈ {liquid, semi, solid}, `GI`, `mass` (g/ml). Derived: `GL = carbs_avail × GI / 100`. Sex and age multiply transit times (see 5).

### 1. Stomach emptying R(t) = fraction still in stomach (GE1–GE13)
- **Liquid** (kind = liquid; water and drinks): `R(t) = 2^(−t / T50)`, `T50 = 13 + 0.11 × kcal` min (GE12; water 13 min: water.md A1; cola 28–31 min; range ×0.5–×2 for method and person, GE9, GE10).
  - Cross-check: cap the caloric rate at 1–4 kcal/min (GE10): default 2 kcal/min means `kcal_empty_rate ≈ kcal × ln2 / T50` at start.
- **Solid** (kind = solid): `R(t) = exp(−(t/τ)^1.8)`, `τ = T50 / 0.693^(1/1.8)`, `T50 = max(65, 94 × sqrt(kcal / 255))` min (GE4, GE5; level C extrapolation above 255 kcal; GE6/GE7 give 120–127 min for heavier meals, so cap the default at ≈ 150 min). The power-exponential carries the lag (retention 69/24/1.2% at 1/2/4 h for the 255 kcal meal, GE1).
- **Semi-solid**: average of liquid and solid T50 weighted 50/50 (C; no data; banana.md G4 used a similar blend).
- **Modifiers** (all C, direction supported):
  - Fibre: `T50 × (1 + 0.0156 × (fibre_per_1000kcal − 4))`, i.e. +25% for 20 g/1000 kcal (GE13). Clamp to 0–25 g/1000 kcal.
  - Fat: no sourced factor (GE15, GE16). The kcal term already counts fat as 9 kcal/g. For the *fat fraction* only, add a slower tail: `fat_phase T50 = 1.5 × T50_meal` (C placeholder; direction GE15). Mark as "?" until a number is found.
  - Protein: via kcal only (GE9: nature of calories minor for liquids).
  - Mixed meal: water/soluble part uses the liquid curve, solids the solid curve (GE15: the water phase empties fast even inside a meal).
  - Alcohol: ?, not researched.
- Show emptying `E(t) = −dR/dt` as the flow of chyme into the duodenum.

### 2. Small-intestine arrival and absorption (SI6–SI11)
- Chyme arrives at the duodenum with flow `E(t)` and is processed in the jejunum.
- **Carbohydrate (sugars, digestible starch):** absorbed within ~10–20 min of arrival (SI8), so the absorbed-glucose input ≈ `E(t)` convolved with a 10–20 min kernel. Resistant starch fraction escapes (SI10): green-banana flour 84%, least-ripe banana up to 90%; set `escape = 0` for refined starch, sugars (C).
- **Protein:** same route, 30–60 min delay (AA3).
- **Fat:** needs bile and goes into lymph (SI11); appearance in blood is delayed by 1–3 h (SI13 pending). Medium-chain fat bypasses lymph (SI11).
- **Water:** absorbed with ta½ ≈ 12 min in the small bowel (water.md A5).
- **Fibre and escaped starch** pass the ileum intact (SI10) and arrive at the caecum with a median **3 h (1.5–4.5 h) after gastric exit** (SI7, C). Arrival at the caecum is in boluses (SI4), often triggered by the next meal.

### 3. Colon and exit (CO1–CO11)
- **Fermentation:** fibre + escaped starch begin to be fermented on caecum arrival; SCFA appear from ≈ 3–6 h and last beyond 12 h (CO9, banana.md C6, qualitative).
- **First appearance in stool:** `T_exit` ~ lognormal, **median 28.7 h, σ = 0.43** (CO1, CO8; 5th–95th percentile 14–58 h). So only **~34% of people** have the first residue out within 24 h. Sex: men shorter (CO3, CO4; use ×0.85 for men, ×1.1 for women: magnitude **C placeholder**, direction sourced). Offer a "fast/typical/slow" slider = 14 / 29 / 58 h.
- **Displaying the 24 h window:** show the residue in the right colon (≈ 11 h), left colon (≈ 11 h) and rectosigmoid (≈ 12 h), summing to the 35 h mean colonic transit of markers (CO3). Residue of a meal eaten at t=0 is in the caecum from ≈ 5–8 h (gastric T50 + SI7), the transverse/left colon by ≈ 12–20 h and still in the colon at 24 h for ~⅔ of people.
- **Bulk (50%) excretion:** not found; show as "after 24 h" (CO11).
- **Colon water absorption:** not quantified (CO10); show qualitatively.

### 4. Glucose curve from carbs × GI (GL1–GL9, GL4 anchor)
- **Delivery:** `Ec(t) = −dRc/dt` using `Rc(t) = 2^(−t / Tc)`, `Tc = 28 + 0.3 × (T50_meal − 28)` min. (The factor 0.3 is a C calibration: it is needed so that solids with a 94 min T50 peak at 50–70 min as seen by CGM, GL3, together with the delay below. Water-soluble sugar leaves faster than the solid phase, GE15.)
- **Plasma response:** `G(t) = S × GL × Φ(t) / Φ_ref`, with `Φ = Ec ∗ e^(−a t)`, `a = 0.055 /min` (clearance, tuned so the cola case peaks at 25–30 min, GL4), `Φ_ref = 0.2225` (the peak of `Φ` for the cola, T50 = 31). `S = 2.3 / 21 = 0.11 mmol/l per GL` (GL4, **liquid-sugar anchor**).
- **Peak-time shift (C, from GL3):** `t_peak = t_Φ + 20 min` for solids, `+10` for semi-solids, `+10` more if fat ≥ 20 g or protein ≥ 20 g. This puts banana at 50 min (banana.md B5: 30–60), mixed meals at 50–70 min (GL3).
- Model outputs (our run, C):

| Case | T50 meal | Tc | Peak (mmol/l) | Peak time |
|---|---|---|---|---|
| Cola 139 kcal, GL 21, liquid | 28 min | 28 | **+2.45** | 26 min |
| Banana 105 kcal, GL 12, solid | 65 | 39 | **+1.1** | 30 + 20 = **50 min** |
| 500 kcal shake, GL 21, liquid | 68 | 40 | +1.9 | 30 min (+10 if fat-rich) |
| 255 kcal egg sandwich, GL 30, solid | 94 | 48 | +2.5 | 52 min |
| 700 kcal solid, GL 21 | 156 | 66 | +1.35 | 57 min |

  A larger meal at the same GL gives a lower, later peak, as in GL5/GL6 (the fat effect appears through kcal and the fat-phase delay).
- **Solid-food amplitude caveat (GL9):** the liquid anchor says 0.11 mmol/l per GL; free-living CGM says 0.007 per GL (15× smaller). Until a controlled solid dose-response is read, use `S_solid = 0.11 × 0.5` as a **placeholder** (range 0.007–0.11) and label solid-food peaks "estimate, ±50%+".
- **Protein/fat on carbohydrate:** direction and linearity (GL5, GL6); implemented as delay (above), with optional extra reduction `−x%` per 10 g protein once Moghaddam's table is read (? size).
- **Undershoot (dip):** only for liquid, low fat/protein meals: `dip = −0.7 × GL/21` mmol/l at 60–120 min (cola.md B4/B10); none if fat + protein ≥ 10 g or kind ≠ liquid (cola.md B4, muffin).
- **Return to baseline:** ≈ 2 h for liquid (GL4), 2–3 h for solids (C, GL3 shows prolonged responses at lunch/dinner).
- **Spread:** show ±1 SD ≈ ±40% on the amplitude (cola.md B1: 2.4 ± 1.0; GL8 CV 68%).

### 5. Triglyceride curve (TG1–TG4, SI11)
`ΔTG(t) = 0.77 × (fat_g / 50) × g(t)` mmol/l, `g(t)` = gamma-shaped curve with start ≈ 1 h, peak 3.5 h (width so that it is back to baseline by 6–8 h). Gamma mode 3.5 h: shape k = 4, θ = 1.17 h, peak-normalised to 1. Upper bound mean ×1.35 (1.04/0.77); outliers more. MCT fat: no lymph route, no TG rise (SI11).
Amino acids: `AA(t)` same form, peak at 1 h (liquid fast protein) or 2–3 h (solid, AA1, AA3).

### 6. Energy cost and drowsiness (TE1–FC4)
- Heat: `TEF_kcal = 0.075 × carb_kcal + 0.015 × fat_kcal + 0.25 × protein_kcal` over 3–5 h, peak in the first 1–2 h (C, TE5). Morning slightly higher (TE4). Alcohol: ?.
- Drowsiness (optional): for meals ≳ 700 kcal show a drowsy hump from 1.5 to ≈ 3.5 h regardless of macros (FC1); smaller meals "no data" (FC4). Link to glucose dip + hunger at 2–3 h (FC3) only for liquid-sugar foods.

### Parameter summary
| Parameter | Value | Claim IDs |
|---|---|---|
| Liquid T50 | 13 + 0.11 kcal min | GE9, GE11, GE12 |
| Caloric rate range | 1–4 kcal/min | GE10 |
| Solid T50 | max(65, 94 √(kcal/255)) min, β 1.8, τ = T50/0.693^(1/1.8) | GE1, GE4, GE5 |
| Fibre factor | +25% at 20 g/1000 kcal | GE13 |
| Fat factor | unsourced, direction only | GE15, GE16 |
| Sugar absorption | 10–20 min | SI8 |
| Residue to caecum | +4 h (capsules 3.3–7 h) after gastric exit (was +3 h, 1.5–4.5; changed 2026-10-16) | SI7b |
| First stool | lognormal, median 28.7 h, σ 0.43 | CO1, CO8 |
| Colon segments | 11.3 / 11.4 / 12.4 h | CO3 |
| Glucose slope | 0.11 mmol/l per GL (liquid) | GL4 |
| Glucose peak time | 26 min liquid, 50–70 min solid | GL3, GL4 |
| TG | +0.77 mmol/l per 50 g fat, peak 3.5 h | TG1, TG2 |
| TEF | 7.5 / 1.5 / 25% for carb / fat / protein | TE1 |

## Open questions
1. **Fat and protein gastric slowing factors** (min per gram, healthy adults, solid and liquid phase separately). Read Moghaddam 2006 full text (numbers per gram) and a dual-isotope solid/liquid study (Houghton, Collins).
2. **Controlled solid-food glucose dose-response** (mmol/l vs GL, healthy, 15–30 min sampling). Brand-Miller 2003 full text may have it; resolves the 15× gap (GL9).
3. **Healthy small-bowel transit time for a solid meal** (scintigraphy or capsule, median and range, by sex). SI7 is built from a liquid-test range and patient data.
4. **Triglyceride peak time and size across fat doses** (10–80 g), healthy, hourly to 8 h; the 1–3 h chylomicron-appearance claim (SI13) needs a primary study (retinyl palmitate or ApoB48).
5. **Absorption sites**: share of carbohydrate, protein, fat, water absorbed in duodenum, jejunum, ileum, colon (a physiology text or Ferraris / Fordtran / Debongnie type study); colonic water absorption ml/day (CO10).
6. **Marker 50% excretion time** and distribution of the excretion window after a single meal (CO11); sex effect size on colonic and whole-gut transit (CO4).
7. **Alcohol:** gastric emptying (kcal 7/g, concentration effect) and thermic effect; not researched.
8. **Carbonation, temperature, particle size** on solids: not researched here (cola.md G5 for carbonation).
9. **Drowsiness after meals under ~700 kcal** and the size of the effect in sleep-latency minutes (FC1 gives only direction and timing).
10. **Tougas 2000 reports T50 values** that the abstract omits; read the full text to replace GE5's fitted 85 min.
11. Whether lymph (chylomicron) kinetics shift with fat type (long-chain vs medium-chain, TG3 shows ±90 min peak time between oils).

## Update 2026-10-15: meals (several things together)
Mixed meals now have their own dossier: **`research/meals.md`** (ML1–ML7). Changes to this model: (1) solid T50 cap 150 → **210 min** (Farivar 2026 MRI: 132 / 158 / 188 min for 441 / 726 / ≈ 1270 kcal; the √kcal line gives 124 / 159 / 210) — partly answers open question 1: fat slows the meal mainly through its calories; (2) a drink eaten with food is a separate, faster **liquid phase** (Collins 1983/1991/1996, Maddern 1985: 18 min, 11–35), slowed ×1–2 by the food (C); (3) protein and fat of the other items shrink each item's sugar peak (Moghaddam 2006, Wolever 2017, Mishra 2026; C: 0.57 / 0.23 % per g per 50 g carbohydrate, max 35%).
