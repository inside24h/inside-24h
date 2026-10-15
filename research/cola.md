# Cola (regular, sugar-sweetened, 330 ml can) — research dossier

Status: **draft v1** · last updated 2026-10-08
Rule: see PLAN.md §1. Levels: **A** established · **B** supported, variable · **C** our estimate (math shown) · **?** unknown.
Abstracts were read through `tools/epmc.py abs`. Full texts were read through `tools/epmc.py grep`, which caches them in `sources/<PMCID>.xml`. Product data comes from USDA FoodData Central (API) and the manufacturer / retailer data sheets listed below.

Items marked **VERIFY** were seen only in a search snippet or secondary summary and must be read in the primary source before they ship.

Caffeine pharmacokinetics are **not** re-researched here. Reuse `espresso.md` D1–D5 (absorption, Vd), M1–M10 (elimination), F1/F2/F8 (effects), S1–S4 (sleep), V1/V2/V4 (vitals, insulin sensitivity), G1 (gastric emptying of water). Only the cola caffeine **dose** is new (P5).

Recipe split used throughout:
- **EU/UK** = sucrose ("Sugar" on the label).
- **US** = high-fructose corn syrup (HFCS-55).

---

## Product

| ID | Claim | Level | Source |
|---|---|---|---|
| P1 | **EU/UK** Coca-Cola Original Taste: per 100 ml **42 kcal (180 kJ), carbohydrate 10.6 g, of which sugars 10.6 g**, fat 0, protein 0, **salt 0 g**. Per 330 ml can: **139 kcal (594 kJ), 35 g sugars**. Ingredients: carbonated water, **sugar**, caramel E150d, **phosphoric acid**, natural flavourings including caffeine. | A | CCEP GB / NielsenIQ Brandbank product sheet, EAN 5449000058386 (a.storyblok.com/f/43212/x/4a44e4815b/coca-cola-original-taste-8x330ml-product-information.pdf). Note: the sheet's table prints "39g" sugars per can, but that is the %RI column (39%); 10.6 × 3.3 = 35 g and the front-of-pack box says 35 g. |
| P2 | **US** Coca-Cola, 12 fl oz (355 ml) can: **39 g sugars (all added), 39 g carbohydrate, 138 kcal, 46.2 mg sodium**; per 100 ml 11.0 g sugars, 39 kcal, 13 mg Na. Ingredients: carbonated water, **high fructose corn syrup**, caramel color, phosphoric acid, natural flavors, caffeine. | A | USDA FDC Branded 2743960 "Coca-Cola Can, 12 fl oz" (pub. 2025-09-18). coca-cola.com/us FAQ "How much sugar is in Coca-Cola?": 12 oz = 39 g sugar, 140 calories. |
| P2c | US recipe scaled to 330 ml: 39 × 330/355 = **36.3 g sugars**, 138 × 330/355 ≈ **128 kcal**, 46.2 × 330/355 ≈ **43 mg sodium**. | C | arithmetic from P2 |
| P3 | Generic "cola, regular" (SR Legacy, US): per 100 g **9.94 g total sugars = 5.84 g fructose + 4.10 g glucose, 0 g sucrose**; 42 kcal; **9 mg caffeine**; 9 mg phosphorus; 3 mg sodium; 5 mg K. So fructose is 5.84/9.94 = **59%** of sugars. | A | USDA FDC 174852 "Beverages, carbonated, cola, regular" |
| P4 | Fructose share in HFCS-sweetened US sodas: **55.58%** of total sugars (95% CI 55.51–55.65; 80 beverages, 2 labs). A different group reported **60.6 ± 2.7%** (fructose:glucose ≈ 60:40). Industry HFCS-55 vs. the disputed higher figure: treat 55–60% as the range. | B | White JS et al. 2015, Int J Obes. PMID 24798032 (PMC4285619); Walker RW et al. 2014, Nutrition. PMID 24985013 |
| P4b | FDA: the common forms of HFCS contain **42% or 55% fructose**, the rest glucose and water. Sucrose is a 1:1 bound glucose–fructose molecule. | A | FDA, "High Fructose Corn Syrup Questions and Answers" (fda.gov) |
| P4c | Monosaccharides delivered per can. **EU**: 35 g sucrose → after hydrolysis 35 × 360/342 = **36.8 g hexose = 18.4 g glucose + 18.4 g fructose**. **US (330 ml)**: 36.3 g × 0.556 = **20.2 g fructose + ≈16.1 g glucose**. | C | P1, P2c, P4; molar masses sucrose 342, hexose 180 |
| P5 | **Caffeine.** Coca-Cola measured by HPLC: **33.9 mg / 12 oz** (= 9.5 mg/100 ml). Canadian label (sugar/glucose-fructose recipe): **48 mg / 500 ml** (= 9.6 mg/100 ml). USDA generic: 9 mg/100 g. Per 330 ml: **≈ 31–32 mg**. UK sheet only says "contains caffeine", no mg figure. | A (US, CA) · C (EU, assumed same) | Chou KH, Bell LN 2007, J Food Sci. PMID 17995675; coca-cola.com/ca "Coca-Cola Original Taste"; USDA FDC 174852. US brand page figure "34 mg/12 oz" seen only in search snippet (**VERIFY**, page blocked). |
| P6 | FDA: caffeinated soft drinks range **23–83 mg per 12 fl oz**. | A | FDA Consumer Update "Spilling the Beans: How Much Caffeine is Too Much?" |
| P7 | **pH of Coca-Cola: 2.36 ± 0.05** (lowest of 5 drinks tested; orange juice 3.68). Titratable acidity 5.27 ml 0.5 M NaOH (vs Red Bull 10.93, orange juice 10.00); buffering capacity 1.12. | B (one lab, one market) | AlHelal F et al. 2025, PMC12512267 (Table 1) |
| P8 | Phosphorus per can ≈ 9 mg/100 g × 3.3 ≈ **30 mg P** (assuming ~1 g/ml). EFSA group ADI for phosphate additives: **40 mg P/kg bw/day** (≈ 2,800 mg/day at 70 kg). One can ≈ **1%** of that ADI. | A (ADI) · C (per-can math) | USDA FDC 174852; EFSA FAF Panel 2019, EFSA J. PMC7009158 |
| P9 | WHO: free sugars **< 10%** of energy; **< 5% (≈ 25 g, 6 tsp)** gives extra benefit. "A single can of sugar-sweetened soda contains **up to 40 g (around 10 teaspoons)** of free sugars." | A | WHO news release 4 Mar 2015 (who.int) |
| P9c | One EU can (35 g) = 35/4 ≈ **8.75 tsp**; = **70%** of the 10% limit at 2,000 kcal (200 kcal ÷ 4 = 50 g) and **140%** of the 5% target (25 g). UK label: 39% of the 90 g total-sugars reference intake. | C | P1, P9 (4 g/tsp from WHO's 40 g ≈ 10 tsp) |

App note: default EU can = 35 g sucrose, 139 kcal, 32 mg caffeine. A US toggle switches to 36 g HFCS-55, 128 kcal (per 330 ml). Sodium is negligible in both (EU salt 0 g; US ≈ 43 mg).

## Stomach (gastric emptying)

| ID | Claim | Level | Source |
|---|---|---|---|
| G1 | Liquid nutrients leave the stomach at a fairly constant **caloric rate**. Between people the rate varies **≈ 1–4 kcal/min** in health. Energy-dense feeds empty more slowly. | A | Arunachala Murthy T et al. 2023 (review), PMC10236995; Jalleh RJ et al. 2023, PMC10534830 |
| G2 | Older healthy adults, 75 g glucose drink: measured caloric rate **1.10–1.78 kcal/min**, T50 **104–141 min**. | B (older adults, 75 g) | Jalleh 2023, PMC10534830 |
| G3 | Glucose 20 g/L empties like water; **≥ 40 g/L slows emptying after the first 10 min of rapid emptying** (600 ml, n=6 men). Cola is ≈ 106 g/L, so its emptying is set by its energy, not its volume. | A | Vist GE, Maughan RJ 1994, Med Sci Sports Exerc. PMID 7799770 |
| G4 | MRI, 500 ml thin shakes: **100 kcal → GE t½ 26.5 ± 3.0 min**, **500 kcal → 69.5 ± 5.9 min**. Energy density slowed emptying more than viscosity. The authors note sodas are "empty calories" with little satiety. | A | Camps G et al. 2016, AJCN. PMID 27281305 |
| G5 | Carbonation (500 ml, 50 g glucose) did **not** change gastric emptying or the glucose response. It briefly enlarged the antrum (first 20 min). | B (n=15) | Lau ERL, Henry CJ 2017, Nutrition. PMID 28606564 |
| G6 | 150 ml with 16.8 g glucose (67 kcal) emptied more slowly than water (ultrasound, antral area larger at 20–40 min). | B | Okabe T et al. 2022, PMC9209003 |
| G7 | **Cola estimate.** 139 kcal at 2 kcal/min (middle of G1) → stomach empty in ≈ **70 min**, half in ≈ **35 min**. Range 1–4 kcal/min → **35–140 min** to empty. Cross-check from G4 by linear interpolation on kcal: 26.5 + (139−100)/(500−100) × (69.5−26.5) ≈ **31 min** t½. Default **t½ ≈ 30–35 min**, vs **13 min** for 240 ml water (espresso G1). | C | G1, G4 |
| G8 | Women retained more gastric liquid than men after 500 ml soda (MRI). | B | Camps G et al. 2018, J Nutr. PMID 30517723 |

## Digestion and absorption

| ID | Claim | Level | Source |
|---|---|---|---|
| A1 | Sucrose is split at the brush border by **sucrase-isomaltase (SI)**, which is solely responsible for sucrose hydrolysis. SI is ~3× more abundant than maltase-glucoamylase. | A | Tannous S et al. 2023, PMC10030609 |
| A2 | Glucose enters enterocytes via **SGLT1** (Na⁺-coupled, apical) and leaves to portal blood via **GLUT2** (basolateral). Fructose enters by facilitated diffusion via **GLUT5** (Km 6–14 mM, carrier-limited capacity). | A | Lee HJ, Cha JY 2018 (review), PMC6177502 |
| A3 | In mice the small intestine converts ~**42%** of fructose to glucose, ~20% to lactate and ~10% to alanine (low doses). Human equivalent not measured. | B (mouse) | PMC6177502 (citing Jang 2018) |
| A4 | Sucrose, honey, 50:50 glucose–fructose mixtures and HFCS "appear to be similarly absorbed". | B | Sun SZ, Empie MW 2012 (review of tracer studies), PMC3533803 |
| A5 | **EU vs US**: 35 g of fully inverted sucrose (17.5 g glucose + 17.5 g fructose in 300 ml) gave glucose and insulin responses **similar to intact sucrose** (incremental peaks 2.4 vs 2.3 mmol/l glucose; 27.9 vs 33.4 mU/l insulin). So sucrase is not a rate-limiting step, and sucrose vs free glucose + fructose (≈ HFCS) behave alike. | B (n=18 vs earlier study) | Törrönen R et al. 2017, J Nutr Sci. PMC5465854 |
| A6 | Main EU–US difference that matters: ≈ **18 g vs 20 g fructose** and **18 g vs 16 g glucose** per 330 ml (P4c). That is ≈ 2 g difference either way, inside the person-to-person variation of A5/B1. | C | P4c |

## Blood glucose and insulin

| ID | Claim | Level | Source |
|---|---|---|---|
| B1 | **Sugary water, 31 g sugars in 300 ml** (n=26 healthy, fasting glucose 5.4): incremental **glucose peak 2.4 ± 1.0 mmol/l**, incremental **insulin peak 32 ± 19 mU/l**. Glucose fell **below fasting** after the peak, reached its lowest level by ~1 h, and **stayed below fasting until 180 min** with a rebound rise in NEFA. | A (for that drink) | Lappi J et al. 2021, Br J Nutr. PMC8340457 |
| B2 | **35 g sucrose in 300 ml water** (closest match to one EU can): incremental glucose peak **2.3 mmol/l**, insulin peak **33.4 mU/l**, and a "sucrose-induced late postprandial hypoglycaemic response". | A | Törrönen R et al. 2012, AJCN. PMID 22854401 (abstract); peaks quoted in Törrönen 2017, PMC5465854 |
| B3 | Time above fasting ≈ glycaemic profile × peak: 23.9 × 2.4 ≈ **57 min** (B1) and 25.2 × 2.4 ≈ **60 min** (A5). So glucose is back at baseline about **1 h** after drinking. | C | B1, A5 (GP = time above fasting ÷ incremental peak) |
| B4 | **Regular cola, CGM, 66 healthy young adults** (23 g carbohydrate serving): **peak at 20 min**, back to baseline at **60 min**, **below baseline after 75 min**. Mean peak **127–130 mg/dL**, lowest **76–81 mg/dL** (interstitial). Dip at 120 min **−13.7%** of baseline (vs −2.4% for 75 g OGTT, −5.5% zero cola). Dips persisted at 180 min. Eating it with a muffin removed the dip. | A (cola-specific, CGM) | Kim S, Song Y 2025, Nutr J. PMC12269098 |
| B5 | 355 ml **sucrose-sweetened cola** (n=20): glucose and insulin highest at **30 min** (samples every 30 min). | B | Galicia-Ayala C et al. 2026, Nutrition. PMID 41016269 (abstract) |
| B6 | 50 g sucrose drink (n=14): glucose and insulin rose, then returned **near baseline within 2 h**. | B | Jameel F et al. 2014, PMC4290803 |
| B7 | **Glycaemic index.** International tables: **soft drink/soda GI 59 ± 3** (sucrose 65, glucose 103, fructose 15). A UK sucrose cola (236 ml) tested at **GI 77 ± 9** (n=10). | A (table) · B (single study) | Atkinson FS et al. 2008, Diabetes Care. PMC2584181 (Table 1); Solomi L et al. 2019, PMID 30892106 |
| B7c | Glycaemic load of one EU can = 59 × 35/100 ≈ **21** (high); with GI 77 ≈ **27**. | C | B7, P1 |
| B8 | **How common is a dip?** Kim & Song (B4) found a group-mean dip after cola, i.e. typical, not rare. Among 69 non-diabetic adults with obesity, **19 (28%)** met curve criteria for reactive hypoglycaemia after a mixed liquid meal (≥ 5 mg/dL below fasting, nadir < 80 min). In symptomatic patients given 75 g glucose, **92%** went < 70 mg/dL at 240–300 min. That last group was selected for complaints, so it is not a healthy-population rate. | B | PMC12269098; Sweatt SK et al. 2026, PMC12986748; Mizoguchi T et al. 2025, PMC11971238 |
| B9 | In 1,070 people on CGM, larger glucose dips 2–3 h after standard meals predicted more hunger (r = 0.16), a shorter time to the next meal and higher energy intake over 3–4 h and 24 h. The OGTT (sugar drink) produced the largest dips. | A | Wyatt P et al. 2021, Nat Metab. PMC7610681 |
| B10 | Converting B4's −13.7% to plasma units: with fasting ≈ 5.0 mmol/l (90 mg/dL), dip ≈ **−0.7 mmol/l (≈ −12 mg/dL)** at 2 h. | C | 5.0 × 0.137 = 0.69 |
| B11 | Insulin units: 32 mU/l × 6.945 ≈ **220 pmol/l** incremental peak. | C | conversion factor from PMC5465854 |

## Fructose in the liver

| ID | Claim | Level | Source |
|---|---|---|---|
| L1 | Absorbed fructose is extracted and processed mainly by the liver. Little circulates. Glucose mostly passes through to the periphery. | A | Sun & Empie 2012, PMC3533803 |
| L2 | **First-pass:** after a drink with 30.4 g glucose + 30.4 g fructose (n=9), **14.5 ± 0.8%** (4.4 g) of the fructose escaped splanchnic (gut + liver) extraction over 4 h. So ≈ **85% is extracted on first pass**. Fasting plasma fructose was **17.9 µmol/l**. | B (n=9, single study) | Francey C et al. 2019, Clin Nutr ESPEN. PMID 30661675 (abstract) |
| L3 | **Fate of fructose (tracer studies, 3–6 h):** oxidised **45.0 ± 10.7%**; converted to glucose **41 ± 10.5%**; to lactate **≈ 25%**; directly to plasma TG **< 1%**. Pathways overlap (glucose made from fructose can later be oxidised), so these do not add to 100%. Glycogen share is not directly quantified in humans. | A | Sun & Empie 2012, PMC3533803 |
| L4 | With glucose co-ingested (mixed liquid meal, 0.5 g/kg each): **19.0%** of fructose carbons appeared as plasma glucose and **32.2%** as CO₂ over 6 h (less than fructose alone: 26.5% and 36.6%). Plasma fructose peaked at **231 ± 37 µmol/l at 180 min** (fat and protein slowed it). | A (for that meal) | Theytaz F et al. 2014, Nutrients. PMC4113761 |
| L5 | Cola estimate: EU can 18.4 g fructose × 14.5% ≈ **2.7 g** reaches the systemic circulation; US 20.2 g → ≈ **2.9 g**. | C | L2, P4c |
| L6 | Peak plasma fructose after one can: not measured for cola. Dose is ≈ ½ of L4 (18 g vs ≈ 35 g at 70 kg), so linear scaling gives ≈ 120 µmol/l. A fat-free drink empties faster, so the peak should come earlier (≈ 30–60 min) and may be higher. Show as **≈ 100–250 µmol/l, peak 30–60 min, our estimate**. | C | 231 × 18.4/35 ≈ 121; G7 |
| L7 | A 500 ml HFCS soft drink raised serum **uric acid +0.3 mg/dL** at 30 min (vs water/diet) and raised renal vascular resistance. A sucrose drink did not significantly raise renal resistance. | B (n=12–13) | Chapman CL et al. 2020, Am J Physiol Renal. PMID 32174139 |
| L8 | Lipogenesis: the hyperlipidaemic effect of fructose shows up with larger, repeated intakes. Acute direct conversion of one dose to TG is < 1% (L3). | A | PMC3533803 |

## Caffeine in cola

| ID | Claim | Level | Source |
|---|---|---|---|
| K1 | Dose ≈ **32 mg** (P5) ≈ **0.45 mg/kg** at 70 kg. PK: reuse espresso D1–D5, M1–M10. | C | 32/70 |
| K2 | Caffeine lowers insulin sensitivity acutely (7 RCTs, SMD −2.06). All trials used 3–6 mg/kg. | A | espresso V4; Shi X et al. 2016, PMC5192567 |
| K3 | **Dose-dependent with no threshold** above zero: each +1 mg/kg caffeine raised glucose AUC by **11.2 mmol·min/l** and insulin AUC by **5.8%** in a 2 h OGTT (caffeine given 1 h before, n=24, 1–5 mg/kg). | A | Beaudoin MS et al. 2013, Appl Physiol Nutr Metab. PMID 23438224 |
| K4 | Cola estimate: 0.45 × 11.2 ≈ **+5 mmol·min/l** glucose AUC. That is ≈ 7% of a cola's glucose iAUC (72.8, B4). Small. Caffeine taken **at the same time** as sugar is not tested, and absorption from cola is slower (G7), so the real effect is probably smaller. | C | K3, B4 |
| K5 | 5 mg/kg caffeine before 75 g glucose: insulin AUC **+60%**, glucose AUC +24% (n.s.). Shows the direction at high dose only. | B | Graham TE et al. 2001, PMID 11478588 |

## Teeth and bones (phosphoric acid)

| ID | Claim | Level | Source |
|---|---|---|---|
| T1 | Coca-Cola pH **2.36**. Caries demineralisation occurs below **pH 5.5**. Erosion has **no fixed critical pH**: it depends on acid type, titratable acidity and mineral saturation. | A | AlHelal 2025, PMC12512267 |
| T2 | A single **5 min** in-vitro exposure to Coca-Cola roughened enamel (0.06–0.12 µm change across drinks) and altered the phosphate FTIR signal. | B (in vitro) | AlHelal 2025, PMC12512267 |
| T3 | **In the mouth:** 20 ml Coca-Cola held 30 s → mean minimum **salivary pH 6.3**, back to baseline in **27 min**. Rinsing with tap water did not differ from oral-care products. | B (n small, single study) | Polyakova M et al. 2024, PMC11049306 |
| T4 | Carbonated drinks and adolescent dental erosion: systematic review and meta-analysis exists. Not yet read in full. | **VERIFY** | Juárez López MLA et al. 2026, PMC13161764 |
| T5 | **Bones, acute:** in women drinking 567 ml, only **caffeinated** drinks raised urine calcium (≈ **0.25 mmol** excess over 5 h). **Phosphoric acid without caffeine produced no excess calciuria.** Later-day compensation makes the net effect "negligible". The authors attribute skeletal links mainly to **milk displacement**. | A | Heaney RP, Rafferty K 2001, AJCN. PMID 11522558 |
| T6 | **Bones, long-term (observational):** in Framingham women, daily cola was linked to **3.7% lower femoral-neck BMD** (5.4% Ward's area) vs < 1 serving/month. Not seen in men or at the spine; also seen with diet cola and, more weakly, decaf cola. Not seen with non-cola sodas. Calcium:phosphorus ratio was lower in cola drinkers. | B (association, not causation) | Tucker KL et al. 2006, AJCN. PMID 17023723 |
| T7 | Korean 12–25 y: male cola drinkers had **4–5% lower BMD**. Cola drinkers drank milk less often. Cross-sectional. | B (association) | Kim YA, Yoo JH 2020, PMC7737184 |
| T8 | App wording: one can has **no measurable acute effect on bone**. Habitual cola is *associated* with lower hip BMD in women. The cause is unproven (milk displacement is the leading explanation). | C | T5–T7 |

## Heart rate and blood pressure

| ID | Claim | Level | Source |
|---|---|---|---|
| H1 | **Cola-like drink** (60 g sucrose + 50 mg caffeine in 500 ml, 7 young men): sucrose **raised cardiac output** (with trends up for HR and stroke volume) and **lowered peripheral resistance**. Caffeine alone raised diastolic BP by **+9.6 ± 4.6 mmHg** at 45–60 min. **Adding sucrose cancelled the caffeine BP rise.** No HR > 100 bpm. | B (pilot, n=7) | Ravussin Y et al. 2022, Front Nutr. PMC9386265 |
| H2 | 1 g/kg glucose + fructose in 300 ml: mean HR over 2 h **65 ± 2 bpm vs 59 ± 2** with sucralose placebo. HR variability fell (RMSSD 43 vs 54). | B (n=15, dose ≈ 2× a can) | Eckstein ML et al. 2022, PMC8869760 |
| H3 | In older adults (≈ 74 y), glucose drinks **lower** BP after meals (postprandial hypotension). A larger volume (600 ml) attenuates the fall and initially raises BP. | A (elderly) | Jones KL et al. 2005, Am J Physiol GI. PMID 15774941 |
| H4 | One can in a healthy young adult: HR **+0 to +6 bpm** (H2 scaled down by dose) and BP ≈ unchanged (H1: sugar offsets caffeine; espresso F9 logic: 8.1 × 32/250 ≈ +1 mmHg from caffeine). | C | H1, H2, espresso F8/F9 |

## Hydration

| ID | Claim | Level | Source |
|---|---|---|---|
| W1 | 1 litre of **cola** produced **no more urine over 4 h than 1 L water** (n=72 men; same for diet cola, coffee, tea, lager). | A | Maughan RJ et al. 2016, AJCN. PMID 26702122 |
| W2 | Caffeine diuresis meta-analysis: median dose **300 mg** → +109 ml urine at rest. Negated by exercise. | A | Zhang Y et al. 2015, J Sci Med Sport. PMC4725310 |

---

## Debunk check: "What happens one hour after drinking a Coke" (Niraj Naik, "The Renegade Pharmacist", 2015)

Claims as reported by WTVR/WTKR (2015-07-30/31).

| Time | Infographic claim | Verdict | Evidence |
|---|---|---|---|
| 10 min | "10 teaspoons of sugar… 100% of your recommended daily intake" | **Partly true.** EU can ≈ 8.75 tsp, US 12 oz ≈ 9.75 tsp. "100%" is wrong either way: it is 70% of WHO's 10% limit, 140% of the 5% target and 39% of the UK RI. | P1, P2, P9, P9c |
| 10 min | "You don't vomit because phosphoric acid cuts the sweetness" | **Unsupported.** No study found. | ? |
| 20 min | "Blood sugar spikes, insulin burst" | **True.** CGM peak at 20 min, plasma peak ≈ 30 min, +2.3–2.4 mmol/l. Insulin +28–33 mU/l. | B1, B2, B4, B5 |
| 20 min | "Liver turns any sugar it can into fat" | **Mostly false acutely.** Of fructose, ≈ 45% is oxidised and ≈ 41% becomes glucose; < 1% goes directly to blood fat. Glucose mainly passes to muscle and other tissues. Lipogenesis matters with repeated large intakes. | L1, L3, L8 |
| 40 min | "Caffeine absorption complete" | **Roughly true** for absorption kinetics (espresso D3), though a sugary drink empties more slowly (G7). | espresso D2/D3, G7 |
| 40 min | "Pupils dilate, blood pressure rises" | **Pupils: not studied** at this dose. **BP: not supported for cola.** Sugar cancelled caffeine's BP rise in a cola-like drink. | H1, H4 |
| 40 min | "Liver dumps more sugar into the bloodstream" | **No evidence** at 32 mg caffeine. Caffeine reduces insulin sensitivity a little (≈ +7% glucose AUC estimate). | K3, K4 |
| 40 min | "Adenosine receptors blocked, preventing drowsiness" | **Mechanism correct** (espresso F1, VERIFY). But 32 mg is under EFSA's 75 mg alertness level. | espresso F1, F2, F3 |
| 45 min | "Dopamine up… the same way heroin works" | **Unsupported.** No human study measured dopamine after one cola. The heroin comparison has no basis in the sources read. | ? |
| 60 min | "Phosphoric acid binds Ca, Mg, Zn in the lower intestine… sugar and sweeteners raise urinary calcium" | **False for phosphoric acid**: no excess calciuria. A small caffeine calciuria (≈ 0.25 mmol) is compensated later. The sugar/sweetener part was not tested in the sources read. | T5 |
| >60 min | "Caffeine's diuretic effect makes you urinate out the bonded minerals, electrolytes and water" | **False at this dose.** 1 L cola produced no more urine than water. Diuresis needs ≈ 300 mg caffeine. | W1, W2 |
| >60 min | "Sugar crash: irritable, sluggish" | **Half true.** A dip below baseline is typical: ≈ −14% at 2 h, starting ≈ 75 min. Dips predict hunger and later eating. "Irritable/sluggish" was not measured in healthy people. | B1, B4, B9 |

---

## Model parameters (default healthy adult, 70 kg, fasting, can drunk in ≈ 5 min)

| Parameter | Value | Range | Basis |
|---|---|---|---|
| Sugar dose, EU | 35 g sucrose → 18.4 g glucose + 18.4 g fructose | — | P1, P4c |
| Sugar dose, US (330 ml) | 16.1 g glucose + 20.2 g fructose | fructose 55–60% | P2c, P4, P4c |
| Energy | 139 kcal (EU), 128 kcal (US 330 ml) | — | P1, P2c |
| Caffeine | 32 mg; reuse espresso PK model | 30–34 | P5, espresso Model parameters |
| Gastric emptying | **caloric, zero-order 2 kcal/min** → empty ≈ 70 min. First-order alternative: **t½ 30–35 min** (k = ln2/32 ≈ 0.022 /min) | 1–4 kcal/min → 35–140 min | G1, G4, G7 (C) |
| First 10 min | faster initial emptying phase (show a visible early drop) | — | G3 (shape only, no number) |
| Intestinal sugar absorption | not rate-limiting: absorb within ≈ 5–10 min of reaching duodenum (choose ka so plasma glucose peaks at 20–30 min) | — | A5, B4, B5 (C: fitted) |
| Glucose curve (venous plasma) | baseline 5.0 → **+2.4 mmol/l at 30 min** → baseline at **≈ 60 min** → **nadir −0.7 mmol/l at 60–120 min** (B1 lowest at ≈ 1 h; B4 measured the dip at 2 h) → back to baseline by **180–240 min** | peak +1.4–3.4 (±1 SD); dip 0 to −1.2 | B1–B4, B10; recovery time C (B1 still below at 180 min; B4 dips persisted at 180 min) |
| Glucose curve shape | rise–overshoot–undershoot (underdamped). Mixing with food removes the undershoot. | — | B1, B4 |
| Insulin | incremental peak **≈ 30 mU/l (≈ 210–230 pmol/l) at 30 min**, back near baseline by **≈ 120 min** | 13–51 mU/l (±1 SD of B1) | B1, B2, B6, B11 |
| Fructose first-pass (gut + liver) | **85%** extracted | 84–86% (n=9) | L2 |
| Systemic fructose | ≈ 2.7 g escapes; plasma peak ≈ 100–250 µmol/l at 30–60 min, from 18 µmol/l fasting | — | L2, L5, L6 (C) |
| Fructose fate over 6 h | ≈ 40% → glucose, ≈ 45% oxidised, ≈ 25% → lactate, < 1% → blood TG (overlapping) | ±10% | L3, L4 |
| Caffeine × glucose | glucose AUC × 1.07 when caffeinated | 1.00–1.07 | K4 (C) |
| HR | +0 to +6 bpm for ≈ 2 h | — | H2, H4 (C) |
| BP | ≈ 0 change | — | H1, H4 (C) |
| Mouth pH | drink pH 2.4; saliva dips to ≈ 6.3, recovers in ≈ 27 min | — | P7, T3 |

Animation note: show the stomach emptying **2–3× slower than water** (G7 vs espresso G1), and the glucose line crossing **below** baseline at ≈ 75 min with a "hunger" cue near 2–3 h (B9).

## Open questions (to research next)
- Primary source for the US caffeine figure on coca-cola.com (P5, page returned 403).
- An official EU caffeine figure for Coca-Cola Original Taste (mg/100 ml).
- Peak plasma fructose after an actual 330 ml cola (L6 is an estimate). Francey 2019 full text may contain a concentration curve.
- Measured gastric emptying t½ of a ≈ 140 kcal / 330 ml soft drink (G7 is interpolated).
- Plasma (not CGM) glucose time course with 15-min sampling after one 330 ml can, and how big the nadir is in mmol/l.
- How much sucrose inverts to glucose + fructose inside the acidic can during storage (affects only the EU recipe; A5 suggests it hardly matters for glucose response).
- Whether caffeine taken *together* with sugar (not 1 h before) changes the glucose response.
- Pupil effect of ≈ 30 mg caffeine (infographic claim) — no source found.
- Read T4 (dental erosion meta-analysis) in full.
- Dopamine response to a sweet drink in humans (infographic claim): no data read.
