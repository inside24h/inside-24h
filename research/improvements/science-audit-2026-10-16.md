# Science audit, 2026-10-16

Scope: `app/src/science/**`, `app/src/content/**`, `app/src/v4/food/**`, `research/*.md`, `research/fooddb.json` + `research/tools/build_fooddb.py`.
Backups of every changed file: `backups/20261016-143900-science/` (same folder layout). Nothing deleted, no git commit, no vite build.
Verification: `npx tsc --noEmit -p .` clean; `npx vitest run` 130/130 pass (was 122).

## 1. Robustness fuzz test (new)

Files: `app/src/science/fuzz.test.ts` (foods), `fuzzMeals.test.ts` (meals), `fuzzKit.ts` (shared checks), `claimsIntegrity.test.ts`.

What runs:
- All 149 foods × ½, 1, 2, 3 servings, default body: simulation + full screen (story chapters, "what changes" at 18 minutes, liquid map, flows, organ cards, headline, quick answers).
- 10 bodies: 40 kg woman, 150 kg man, 200 kg / 130 cm (BMI 118, the UI allows it) woman and man, 35 kg / 220 cm, smoker + daily caffeine, late pregnancy, pill + just ate + mg/dL, drink at 23:50 with bedtime 23:00.
- 19 fixed meals (beer + pizza, rakija ×3 + ćevapi, 5 drinks ×3 each, espresso + croissant, energy drink + chips, …) and 50 seeded random meals of 2–5 items.

Asserted: arrays finite and the right length; amounts never negative; t50, sugar peak, caffeine peak inside 0–24 h; stomach empty, sugar/insulin/blood fat back to baseline by 24 h; caffeine falling; energy absorbed never above the label; more of a food never gives less kcal / sugar peak / blood alcohol / caffeine / blood fat or a faster stomach; chapters ordered, non-empty, no "NaN / undefined / Infinity / null"; every chapter/organ claim ID exists; every chapter that shows a number has a claim; "Alcohol gone" only when blood alcohol is really ≈ 0; the caffeine-peak chapter sits at the model's peak. `claimsIntegrity.test.ts`: every claim has a level, A/B have a real source, C has a source or a method, all source keys exist (claims, tips, long-term, personal factors), no ID collisions between the merged claim sets.

## 2. Bugs found and fixed

| # | Bug | Fix |
|---|---|---|
| B1 | **Negative / exploding blood alcohol for very heavy, short bodies.** Forrest's Widmark line (r = 1.0181 − 0.01213·BMI; women 0.9367 − 0.0124·BMI) goes to 0 at BMI ≈ 75–84; the UI allows BMI up to ≈ 118 (200 kg, 130 cm). Result: BAC −2.9 ‰ even for water, −4.3 ‰ for beer + pizza. | `foodSim.ts`: BMI held in 16–45 for r (C). At 45, r = 0.47/0.38, slightly below Watson body water ÷ (0.8 × weight) → the cautious side. |
| B2 | **"Alcohol gone" chapter at 24 h while 0.56 ‰ was still in the blood** (very large amounts). | `foodProduct.ts`: if not gone by 24 h, chapter "Still alcohol after 24 h" with the range and "Don't drive." |
| B3 | Wine/spirits got the sentence "A beer does not make you lose more water than you drank" (AL7 was measured with lager only). | Sentence + AL7 only for beer-strength drinks; other foods cite a new water claim WK1 (Maughan 2016, 1 L water → 1337 g urine in 4 h). |
| B4 | Caffeine simulation spent ~70% of each food run allocating arrays (26 ms per run). | `espressoSim.ts` RK4 rewritten without allocations, same arithmetic in the same order: verified **bit-identical** on 3 scenarios, 3.5× faster (7 ms). Faster app too. |
| B5 | Caffeine peak of sugary drinks (cola 123 min, energy drink 114) was shown with only D2 "peaks 30–120 min". | Adds GE12 (calories slow the stomach) to that chapter. |
| B6 | Kidney organ card for every food cited only the beer claim. | WK1 (+ AL7 with alcohol). Caffeine chapters now also cite D2 / M4 / VS1 (espresso claims merged into food products; no ID collisions, tested). |

Known model property, not fixed (documented in the test): for very sugary meals the total sugar peak saturates while more food slows the drink, so doubling a meal can lower the peak by up to ≈ 2% (2 of 99 meals). Far inside the ±40% range shown.

## 3. Accuracy spot-audit

**Food database vs USDA:** all 149 app entries re-read from the USDA SR Legacy CSV (kcal, carbs, sugars, fibre, fat, protein, caffeine, alcohol, water): **0 mismatches**. GI values for cola 59, banana 51, white bread 75, white rice 73, crisps 56, ice cream 51, whole milk 39, orange juice 50, apple 36, spaghetti 49, fries 63, chocolate 40 re-read in Atkinson 2008 Table 1 (cached PMC2584181): all correct.

**Numbers corrected**
- **French fries**: record was "frozen, home-prepared, oven heated" (169264): 158 kcal, 5.5 g fat /100 g, "10 fries" = 76 g → 120 kcal. People (and the "burger + fries + cola" preset) mean deep-fried fries → **USDA 170698 "Fast foods, potato, french fried in vegetable oil": 312 kcal, 14.7 g fat /100 g, 1 small portion = 71 g → 222 kcal.** Changed in `fooddb_spec.py`, rebuilt `research/fooddb.json` (also picked up a pending pancake rename already in the spec), patched only the fries entry of `app/src/v4/food/fooddb.json`, noted in `fooddb-notes.md`.
- "chips" was an alias of both fries and potato crisps (fries won the tie). Now crisps only.
- Alcohol pulse/pressure above 30 g: model used −5.6 mmHg for every dose ≥ 20 g; Cochrane (Tasnim 2020) gives **−3.5 mmHg and +5.8 bpm for > 30 g** (−5.6 / +4.6 for 14–28 g). Model and AL5 text updated.

**Claims opened with epmc.py (21 checked, abstract or full text):** Parsons 1978 (t½ 3.5 vs 6.0 h) ✓, Patwardhan 1980 (10.7 vs 6.2 h) ✓, Parsons & Pelletier 1982 (39%) ✓, Knutti 1982 (3 → 10.5 h) ✓, Mesas 2011 (+8.1/5.7 mmHg) ✓, Gardiner 2023 (−45 min, 107 mg ≥ 8.8 h) ✓, Tougas 2000 (69/24/1.2%) ✓, Asnicar 2021 (median 28.7 h, 14–58 h, full text) ✓, Maughan 2016 (lager = water, 72 men) ✓, Tasnim 2020 ✓ (dose bands, see above), Jones 2010 (0.10–0.15 fasted, 0.15–0.20 fed g/L/h) ✓, Mitchell 2014 (62/54/36 min) ✓, Wilson 2021 (median +0.77, full text) ✓ but **in 35 overweight adults** (now said), Wells 1998 (1.5 h) ✓, Jongen 2014 (0.2 / 0.5 g/L) ✓, Wyatt 2021 ✓ (dips at **2–3 h**, claim said 1–2 h: fixed, Kim 2025 added for the cola dip), Brand-Miller 2009 (r = 0.76, 1,126 foods) ✓, Jones 1997 + Kechagias 1999 (fed peaks 13.3–17.7 vs 30.8; 17.5 vs 43.8 mg/dl) ✓, Maddern 1985 (18 min, 11–35) ✓, Benini 1995 (231.7 vs 186 min ≈ +25%) ✓, Lovallo 2004 (half full tolerance, half none) ✓, Ebrahim 2013 ✓ (REM cut only at moderate/high doses: wording fixed), Camps 2016 (26.5 / 69.5 min) ✓, Parkman 2025 (94 / 67 / 69 min) ✓.

**Claim text corrected**
- TG1: dropped "0.1–0.3 mmol/L with everyday meals" (only seen in a secondary quote) and "peaks after 3–4 h" (not found verbatim in Wilson 2025); now: median +0.8 in 35 overweight adults, clearly raised at ≈ 3 h and falling after ≈ 5 h (Wilson 2025 full text, source added). Story: "falls again over the next few hours" instead of the unsourced "back to normal within 6–8 hours".
- GE12: formula and measured values no longer mixed (13 + 0.11·kcal is ours; 26.5 / 69.5 min are measured).
- GL4, ML7: "±50% or more" contradicted the ±40% range on screen → "the range we show (±40%) covers about two in three people".
- AL7: "in 72 men … stronger drinks were not tested". AL6: REM effect "at moderate and higher amounts".
- Tip "sugar dip": level A → **B** (one 66-person study).

## 4. Wording (calm, no medical-advice tone)
- "Sugar rush" (title and note) → "Blood sugar peak" / "big rise" ("sugar rush" suggests the debunked hyperactivity myth). "Food coma" → "Sleepy after eating".
- Sugar dip: "Insulin overshoots…" → "Your blood sugar drops a little below where you started. Many people feel hungry again around now."
- Alcohol peak ≥ 0.5 g/L now says "Reaction time and balance are worse" (AL4) instead of only "attention".
- Caffeine tip: "No more caffeine today" → "If you want good sleep, skip more caffeine today: …"; "EFSA calls up to 400 mg safe" → "EFSA sees no safety concern up to 400 mg a day".
- "On average food takes about 29 hours" → "Typically … (the middle value)".

## 5. Still uncertain / for the main session (not changed)
1. **Blood alcohol is underestimated for fast drinks.** Model vs Mitchell 2014 (0.5 g/kg, fasted, 70 kg default man): beer 46 vs 50 mg/dl ✓, wine 49 vs 62 (−20%), spirits 53 vs 77 (−31%; the ±40% range tops out at 75). Widmark ignores the early distribution overshoot. Options: a per-drink peak calibration (C) or a two-compartment model. Safety-relevant, so a model decision for Opus.
2. Cola (1 can, curated) shows EU label 35 g sugar / 139 kcal / 32 mg; 2 cans use USDA (34.1 g, 144 kcal, 31 mg per can). Small, but a careful reader can notice.
3. Energy drink: USDA Red Bull 29 mg caffeine/100 g → 75 mg per 8.4 oz can; the label says 80 mg / 250 ml. Kept USDA; consider a note.
4. Small-bowel residue time: code uses 240 min (2 × 120) after the stomach, claim SI7 says 5–8 h mouth-to-caecum, dossier SI7 says 3 h (1.5–4.5). All level C; worth aligning.
5. The caffeine peak for sugary drinks (cola ≈ 2 h) comes from our calorie-based emptying (C); the only cola-specific study found (Marks & Kelly 1973, PMID 4121243) has no abstract in Europe PMC.
6. Alcohol rebound: Tasnim 2020 found +3.7 mmHg ≥ 13 h after > 30 g; not modelled.
7. UI wording outside my files (`v4/status.ts`, `CalmBar.tsx`, `stories.ts`, `simple.ts`): red light = "overload" / "your heart is overloaded" for changes of a few bpm or mmHg, and "Sugar rush" in the curated cola story and the simple card. Suggest "high" / "working hard" and "Blood sugar peak".
8. AL4 (Croatian limits) cites an official EU page, not re-opened here (not in Europe PMC).
9. Fuzz tests add ≈ 20–60 s to `vitest run` (depends on machine load); they run in two files in parallel.
