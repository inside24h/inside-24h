# Model review: physiology models of Inside 24h (2026-10-20, finished 2026-10-22)

Scope: the simulation models, not the food data. Two runs. The first (2026-10-20) was stopped by a rate limit
during step 9; the second (2026-10-22) checked its edits, then finished steps 7–9 and the tests.
Backups: `backups/20261020-151540-models/` and `backups/20261022-224424-models/`. Nothing was committed.
Papers were read with `research/tools/epmc.py` (abstracts, plus full text where a PMC id is given).

Verdicts: **correct**, **simplified-but-honest** (S-H), **wrong → fixed**.

## 1. Gastric emptying — S-H (one gap fixed)
- Liquids: first order, T50 = 13 + 0.11 × nutrient kcal. Water is 13 min (Mudie 2014, PMID 25115349). Camps 2016 gives
  100 kcal 26.5 and 500 kcal 69.5 min; the line gives 24 and 68. Solids: power-exponential, β 1.8, which gives the lag
  shoulder (Tougas 2000). T50 scales with √kcal and is capped at 210 min (Farivar 2026 MRI). Fibre adds about 25% per
  +16 g/1000 kcal (Benini 1995). Fat acts through its calories, a C-level simplification.
- Meals use two phases (Collins, Maddern 1985, Großmann 2025: water still leaves fast). OK.
- **Wrong → fixed: alcohol slowing.** Before, ethanol calories were ignored, so beer and rakija "left like water". Now:
  `alcoholGE` adds a fit to Franke 2004 (PMID 15370684: ethanol solutions 22.6–27.8 min, beer 39.3, red wine 72.6,
  water 14.6). The alcohol solutions were not dose-dependent. Solids with alcohol take ×1.2–1.42 longer (Franke 2005,
  PMID 15699055). Also consulted: Okabe 2022 (PMID 35734752), Stevens 2022 (PMID 35246999), Kasicka-Jonderko 2013.
  The wine factor was measured for red wine only, and this is said in claim GE19. Blood alcohol stays fitted directly
  to Mitchell 2014, so this changes only how fast the drink's water, sugar and caffeine arrive.

## 2. Glucose — S-H
- The peak saturates with GL (3.14·(1−e^(−GL/16))) and is anchored on cola (+2.3 mmol/L) and a 50 g OGTT (≈ +3).
  Solids run ×0.8. The cola curve shape is stretched by the stomach speed. The dip after the peak appears only for
  sugary liquids without fat or protein (Kim 2025).
- Blunting by the protein and fat of the other foods: Moghaddam 2006, Wolever 2017, Mishra 2026. Capped at 35%.
- **Honesty for mixed meals added (ML8):** Wolever 2006 (PMID 16762941) found that GI × carbohydrate explained ≈ 90%
  of the differences between meals. Flint 2004 (PMID 15182401) found that table values did not predict the measured
  meal GI. So the meal curve is labelled a rough estimate.
- Spread between people: ±40% (Zeevi 2015, Berry 2020). It is always shown as a range and labelled "typical, not
  personalized".
- If fasting glucose is ≥ 126 mg/dL, the text now says the curve is for people without diabetes.
- Second-meal effect: not modelled. Each simulation is one eating event, so it does not apply. Stated here.

## 3. Insulin — S-H (label fixed)
- Insulin is scaled from the glucose curve (cola anchor 33 mU/L). Protein raises insulin by 35–83% that the model does
  not draw (Mishra 2026). The pancreas label and ML5 now say so.

## 4. Caffeine — wrong → fixed
- **Absorption:** with the stomach as the only gate, a shot peaked at 74 min. Measured peaks: coffee 42 ± 5 min
  (Liguori 1997, PMID 9329065), capsules ≈ 30 min (Mumford 1996, PMID 9010706), fasted 29 min (Wildgrube 2026). The
  ISSN 2021 position stand (PMC7777221) says caffeine is also absorbed in the stomach. Now 55% of the caffeine goes
  through the stomach wall straight into the blood. This share is FITTED (C), not measured, and claim G3 says so.
  Results: a shot peaks at ≈ 43 min, cola later (≈ 74 min; Mumford found 1.5–2 h for ≈ 2 cans), coffee with a meal at
  ≈ 65–80 min (Wildgrube 65–69). The liquid itself still empties at its own half-time (`stomachMl`). Paced rounds use
  the same two routes. Stomach and portal-vein labels updated.
- **Half-life:** 6 h; smokers 3.5 h (Parsons 1978); the pill 10.7/6.2 (Patwardhan 1980); late pregnancy ÷0.39
  (Parsons 1982). **Wrong → fixed:** pill and pregnancy stacked to 27 h and also applied to men (old links). They are
  now women-only and never combined. The headline and story now give the half-life as "our estimate; healthy adults
  2.5–10 h".
- Sleep anchors (Gardiner 2023/2025) are computed with the same model, so they stay internally consistent.
- `science/caffeine.ts` is an old module with stacking modifiers. It is used only by `pk.test.ts`, not by the app, so
  it was left as is.

## 5. Alcohol — correct, within the stated range
- Two compartments (central 0.6), ka/F by drink class, fitted to Mitchell 2014 (PMC4112772): beer 50.3 mg/dl at 62 min,
  wine 61.7 at 54, vodka-tonic 77.4 at 36. All are within 5% (alcoholMitchell.test.ts).
- Fed: ka 1.35/h, giving a peak of 40–57% of fasted (Jones 1997, Kechagias 1999). β is 0.12 fasted and 0.17 fed
  (Jones 2010).
- Widmark r from BMI (Forrest 1986; Watson-consistent), so sex differences come through r.
- Range −40/+50% (Maskell 2020; Mitchell SD). Pacing follows Searle 2015 / Oshima 2022.
- Limit: elimination is zero-order to the end. Below ≈ 0.1 g/L it really slows (Michaelis–Menten), so "gone" times
  can be slightly early. The 0.10–0.20 ‰/h slow-liver bound partly covers this.
- **Fixed:** the health bars used a flat r 0.7/0.6. They now use the same `widmarkR` as the main model. A test checks
  the main model against Widmark C0.
- **Fixed:** the liver label said "Nothing speeds it up", which contradicts AL2 (faster after food). It now says
  "nearly fixed (a little faster after a meal); coffee, water or sleep don't speed it up".
- AL17 is new: alcohol is absorbed through the stomach wall and the small intestine, then goes to the liver first
  (Mumenthaler 1999, PMC6761697).

## 6. Hydration — S-H (myth handled)
- Water: absorption t½ 12 min, kidney t½ 60 min (Maughan 2016: 1 L → 1.3 kg urine in 4 h). Beer up to ≈ 40 g counts
  like water (Maughan 2016). Wine and spirits give slightly more urine for 4 h (Polhuis 2017).
- **Added WK2:** coffee counts as water (Killer 2014, PMID 24416202, 50 men, 4 cups a day). Only ≥ 6 mg/kg of caffeine,
  or ≥ 300 mg in people not used to it, gives a "Mostly" answer (Seal 2017, PMID 28868290; Maughan & Griffin 2003).
- No "dehydrates you" claim remains. The existing ones say the opposite and are sourced (KW1, AL7).

## 7. Energy — correct
- Walking is net of rest, 0.5 kcal/kg/km (ACSM), and the same formula is used everywhere.
- TEF (Tappy 1996): the wording was changed from "digesting costs" to "processing food (absorbing, using or storing)".
  Most of the TEF is post-absorptive.
- Fructose → fat: "< 1% directly" (Sun 2012), which is correct. There are no other "stored as fat" claims.

## 8. Personalization — S-H
- What each input changes:
  - Sex, age, height and weight: Watson body water (caffeine Vd), Forrest r (alcohol), walking (weight).
  - Smoking, the pill, pregnancy: caffeine half-life only.
  - "Just ate": alcohol absorption.
  - Daily caffeine: BP bump ×0.5 (Lovallo 2004).
  - Glucose and BP inputs: starting values only. The rise is not personalized (Zeevi 2015), and the caffeine BP rise is
    similar in people with and without high BP (McClaran 2007: 7 mmHg; Mesas 2011: 8 mmHg).
- **Added:** pregnancy + caffeine answer: EFSA 2015, ≤ 200 mg a day in pregnancy.
- There is no diabetes input. Only the fasting-glucose note above.

## 9. Organ flows and labels — fixed where wrong
- **Fructose:** the label said "goes straight to the liver, which captures 85%". 85% is SPLANCHNIC, gut plus liver
  (Francey 2019, PMID 30661675: 14.5% escapes). Now it says "gut wall and liver together". New claim KL4: in mice the
  small intestine clears about 90% of small doses (Jang 2018, PMID 29414685); this is unknown in humans. Fructose
  metabolism is "mainly in the liver", not "your liver burns".
- **Fat:** goes by lymph, not the portal vein. The small-intestine and liver texts are fixed, with new claim SI11
  (Padberg 2026, PMID 42481617).
- **Caffeine:** stomach wall plus small intestine (D6). The portal vein carries blood from the stomach AND the intestine.
- **Cola dip:** the text said "insulin overshoots" (a mechanism we never measured). It now describes only what was
  measured (Kim 2025).
- Alcohol and sleep: "will be lighter" was softened to "is often lighter". The dose tiers in daily.ts were already
  in place.

## Tests
- New: `app/src/science/modelReview.test.ts` (18 tests). It checks Franke 2004/2005, Camps 2016, the half-life
  factors without stacking, the shot tmax against Liguori/Mumford, Watson, Forrest/Widmark C0, ACSM, Killer/Seal and
  EFSA pregnancy.
- Updated: espressoSim, colaSim and mealSim tests (new tmax windows).
- `npx tsc --noEmit -p .`: clean. `npx vitest run`: 28 files, 422 tests passed.
