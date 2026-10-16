# Science fixes, Inside 24h, 2026-10-16 (wave 4)

These fixes close the open items 1–6 in `qa-final-2026-10-16.md`.
Every file was backed up before it was edited, to `backups/20261016-211946-wave4/` (20 files). No files were deleted and nothing was committed.
Two files are new: `app/src/science/walking.ts` and `app/src/v4/scienceFixes.test.ts`.
End state: `tsc` is clean and vitest passes 21 files / 151 tests (10 of them new). Both builds are OK: `vite.v4.config.ts` first, then `vite.site.config.ts` with `make-site-split.mjs` (site/ = split build). I did not check the pages in a browser.

## 1. Cola: 144 vs 139 kcal → one source of truth
- **Root cause.** The search and meals took cola from USDA SR Legacy 174852 (42 kcal and 9.94 g sugar **per 100 g**) × 342.6 g, which gives 144 kcal and 34 g sugar. The curated story uses the EU can label (cola.md P1: 42 kcal **per 100 ml**), which gives 139 kcal and 35 g. The two sources are the same number on different bases (g vs ml).
- **Fix.** `food/parse.ts` (`labelFix`) now takes the cola entry's per-100 g values from `COLA` in `science/colaSim.ts`: 139 kcal, 35 g sugar (all free sugar), 0 g fat and 32 mg caffeine per 330 ml can, spread over the 342.6 g serving. Search, Browse, meals ("burger + fries + cola"), Compare and the story now all show 139 kcal, 35 g and 32 mg. Water content and GI did not change.

## 2. "Glass" = 250 ml for every drink
- **Root cause.** In `parse.ts`, `PORTION_ML` mapped each word to one fixed volume, whatever the drink. The same bug made "a cup of espresso" 200 ml (≈ 424 mg caffeine), and "a can of energy drink" became 330 ml even though the database can is 250 ml.
- **Fix.** Portion size now depends on the drink (`PORTION_BY_FOOD` + `portionMlFor`). All of these are level C assumptions, and the screen shows them as "≈ … ml":
  - Wine: 150 ml. This is the database serving. UK pubs pour 125/175/250 ml, and a US standard drink is 5 fl oz ≈ 148 ml.
  - Beer: a glass is 300 ml (0.3 l).
  - Rakija: a glass is 40 ml (the database pour).
  - Espresso: a cup or glass is 30 ml (one shot).
  - Can: the food's own can size if it has one (energy drink 250 ml). Otherwise 330 ml.
  - Water, milk and juice keep 250 ml for a glass.
- "A glass of wine" is now 150 ml / 127 kcal, down from 250 ml / 211 kcal.
- **Small fix along the way.** Amount labels showed the typed Croatian word ("1 × casa", "1 × zlica"). They now always use the English word ("1 × glass (≈ 150 ml)", "tbsp").

## 3. Espresso at 23:00, "too little to matter"
**What I read** (abstracts from Europe PMC):
- Gardiner 2023, Sleep Med Rev, meta-analysis of 24 studies, **PMID 36870101**. Caffeine cut total sleep by 45 min, cut sleep efficiency by 7%, and added 9 min to falling asleep. To avoid losing total sleep, a coffee of **107 mg should be drunk ≥ 8.8 h before bed**, and 217.5 mg ≥ 13.2 h before.
- Gardiner 2025, Sleep, randomised crossover trial, 23 men, **PMID 39377163**. 100 mg taken 12, 8 or 4 h before bed had **no significant effect**. 400 mg taken within 12 h of bed did affect sleep.
- Drake 2013, J Clin Sleep Med, n = 12, **PMID 24235903**. 400 mg taken 0, 3 or 6 h before bed disrupted sleep in every case.
- Rétey 2007, Clin Pharmacol Ther, **PMID 17329997**. Habitual caffeine went with worse sleep in people who rate themselves caffeine-sensitive, but not in insensitive people. A common ADORA2A variant contributes. Reichert 2022 (PMID 35575450) supports this.

**Root cause.** The app used only the Gardiner 2025 anchor: below the blood level that 100 mg leaves after 4 h (≈ 66 mg in the body), the effect was 0. Anything below that was called "too little to matter". 51 mg sits below that anchor but above the level the meta-analysis links to shorter sleep (107 mg after 8.8 h leaves ≈ 41 mg). The app also read blood caffeine **at the bedtime minute only**. An espresso taken at 22:50 has barely been absorbed by 23:00, so the "best time" search reported "Any time today" for very late drinks.

**Fix** (`science/daily.ts`, `science/anchors.ts`):
- A third, cautious anchor: the blood level that 107 mg leaves after 8.8 h (VS1).
- Blood caffeine while falling asleep is now the **highest level from bedtime to 90 min after** (`sleepConc`). Drinks taken hours earlier get the same values as before.
- One scale for every screen (`sleepRiskOf` → `none` / `sensitive` / `delay`) and one sentence (`sleepSentence`). Quick answers, Simple cards, the cola, espresso and food bedtime chapters, the headlines and the health-bar notes all use them.
- Espresso 63 mg at 20:45 now reads: *"Probably, unless caffeine affects you easily. About 51 mg is still in you at 23:00: most people sleep normally with that much, but sensitive people may sleep a little less or more lightly."* It has a yellow edge.
- "When is the best time?" now uses the same cautious scale and stops at the first time that is not safe.
- New claim **VS4** (level B, Rétey 2007). The VS3 method text describes the new rule.
- **Small fix along the way.** Claim S2 (Drake 2013, n = 12, a single small study) went from level A to **B**. vitals-circadian.md already rated it B.

## 4. Walking minutes "rise" for 200 kg / 130 cm / 100 y
- **Root cause.** The formula itself was monotonic: kcal ÷ (3.5 MET × 3.5 × kg / 200). The QA script (`fq5.js`) typed weight 200 and later typed **"5"** into the weight field. The field clamps that to **35 kg**, so the run was really for 35 kg, and 139 kcal at 35 kg ≈ 65 min. Age and height were never in the formula.
- The real inconsistency was elsewhere. The quick answer used **gross** MET (32 min for 70 kg). The health bars and activity.md D3 use the **net** ACSM cost, 0.5 kcal/kg/km (≈ 4 km ≈ 48 min for one can).
- **Fix.** New `science/walking.ts`, one formula for the whole app: net ACSM, 0.5 kcal/kg/km, at 5 km/h. Weight is held to 35–200 kg, and NaN falls back to 70 kg. The quick answer now reads "139 kcal ≈ 48 min of brisk walking for you (about 4 km)". It adds the note "Energy used on top of sitting still, at 5 km/h, for your weight". The health bars use the same constant.
- **Tests.** The result falls strictly from 35 to 200 kg. 200 kg ≈ 17 min, 35 kg ≈ 1 h 35 min, 70 kg = 48 min.

## 5. Every-day panel: "A · Link, not proof" and "+9% early death (C)"
**What I read:**
- Imamura 2015, BMJ, **PMID 26199070**. 17 cohorts. Per daily serving: +18% (9–28%, I² = 89%), and **+13% (6–21%, I² = 79%)** after adjusting for adiposity.
- Ding 2014, Diabetes Care, **PMID 24459154**. 28 cohorts, 1.1 million people. RR 0.91 per daily cup of caffeinated coffee.
- Wang 2022, Nutrients, **PMID 35215425**. All-cause mortality RR **1.07 (1.03–1.11) per 250 ml/day**.
- Poole 2017, BMJ, **PMID 29167102**. Umbrella review. The authors themselves say RCTs are needed to show cause.

**Rule now used.** The letter says how sure we are of the sentence shown. A link seen only by observing people is **at most B**, however large the study, because observation cannot show cause. High heterogeneity (I² 79–89%) also argues against A.
- Cola, type 2 diabetes: A → **B**. The text now says the studies watched people, so they show a link, not proof.
- Espresso, type 2 diabetes: A → **B**.
- Cola, risk of dying early: "≈ +9%, C, Our estimate" became **"+4–15% (link)", B, Link, not proof**. The range comes from the CI: 1.03^1.32 to 1.11^1.32. The text says the result is about groups, not about you.
- The panel note now explains the letters, including "never above B" for links.
- A test enforces that no `association` item is level A.

## 6. Compare and the video used mmol/L only
- **Root cause.** `analyze()` did not pass `glucoseUnit` to `quickAnswers`. Compare (cards and chart label) and the comparison Reel (sugar chip and end card) had "mmol/L" hard-coded.
- **Fix.** New `sugarDeltaText` / `sugarPeakText` in `analyze.ts`, used by Compare (cards and chart aria-label) and the Reel (chip and summary). The Reel chip font shrinks if the unit makes the text too wide for its half.
- **Same bug elsewhere, also fixed.** The cola "Blood sugar peak" headline, the cola pancreas panel ("Blood sugar now") and the food heart panel ("Blood sugar change") were also mmol/L-only.
- **Test.** Cola in Compare with mg/dL shows mg/dL and no mmol/L.

## Still uncertain
- **Late caffeine.** The cautious band (≈ 41–66 mg left in the body for the reference adult) comes from two sources that disagree. Gardiner 2023 is a meta-regression across studies. Gardiner 2025 found no effect from 100 mg at 4 h, in 23 young men. How large the effect is for sensitive people is not quantified. We only say "may", at level B. Cola (32 mg) is never flagged, even right before bed, because its peak stays below the cautious level. The 90-min "falling asleep" window is our own choice (C).
- **Glass sizes** are assumptions (C). Beer glasses vary (0.2–0.5 l). Old shared links that say "glass of wine" now open 150 ml instead of 250 ml.
- **Walking** is net of rest. Gross values (which include the energy you would spend sitting) are about 40% higher. Hall 2004 measured gross values. For very heavy or very old people the ACSM equation is less validated.
- The cola label values assume that the EU recipe matches the generic database entry (P5 caffeine: EU is assumed to be the same as US/CA).
- Not checked in a real browser this round. The unit change in the Reel was checked only by type and test, not by recording a video.
