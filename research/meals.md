# Meals: several things eaten together — research dossier

Status: **v1** · 2026-10-15
Rule: upute.md §2. Levels: **A** established · **B** supported, variable · **C** our estimate (math shown) · **?** unknown.
Abstracts read with `python -I research/tools/epmc.py abs`, full texts with `epmc.py grep` (Europe PMC). One letter (Wolever 2017) read through PMC via web fetch. Nothing from memory. Builds on `digestion-generic.md` (GE, GL, TG), `alcohol.md` (A, K, PF) and `espresso.md`.

## What existed before (audit, 2026-10-15)
- The parser already accepted combos ("pizza i cola", "118 g Banana + 250 g Milk"); `macros()` summed them and computed one GL.
- The model treated the whole meal as **one blob**: kind = solid if anything was solid, so a cola eaten with a burger emptied on the **solid** curve (lag, T50 ≈ 1.5–2.5 h). Wrong: the drink phase leaves first (ML1, ML2, ML4).
- Sugar: one curve from the summed GL. Protein and fat from other foods had **no effect on the size** of the peak (only a +10 min delay at ≥ 20 g). Cola + burger peaked about as high as cola alone. Wrong in direction (ML5).
- Caffeine: gastric half-time = the whole meal's T50 (e.g. 95 min for burger + fries + cola) → caffeine peaked hours late. Too slow (ML3).
- Alcohol with food: a binary "fed" switch (≥ 100 kcal of solid food) → peak ≈ 45–55% of fasted (alcohol.md PF1). Kept.
- Solid T50 was capped at 150 min; real big meals measured by MRI take up to ≈ 190 min (ML6).

## 1. Stomach: drinks and food in one meal

| ID | Claim | Level | Source |
|---|---|---|---|
| ML1 | **Dual-isotope studies of solid + liquid meals.** In all 24 normal subjects solid emptying was slower than liquid; solids had a lag then linear emptying; liquids emptied roughly single-exponentially. Making the liquid more caloric (water → 10% → 25% dextrose) slowed the liquid **and** prolonged the solid lag. The liquid disperses through the stomach and empties after a minimal lag; solids first sit in the proximal stomach and move distally while the liquid empties. A larger solid portion (400 vs 100 g beef with 150 ml 10% dextrose, n=8) lengthened the solid lag (56 vs 31 min) and slowed liquid emptying (P < 0.001). | B | Collins PJ 1983, Gut, PMID 6642275; Collins PJ 1991, Gut, PMID 2060870; Collins PJ 1996, Am J Physiol, PMID 8897871 (abstracts) |
| ML2 | **Liquid inside a mixed meal, 22 healthy controls:** median T50 of the liquid marker **18 min (range 11–35)**; solid post-lag emptying 1.25 %/min (0.7–2.3). Meal not described in the abstract (same group's standard meal elsewhere: 100 g beef + 150 ml 10% dextrose, Jones 1995 PMID 8523109 — **source pending** for Maddern's exact meal). | B | Maddern GJ 1985, Gut, PMID 4018631 (abstract) |
| ML3 | **Caffeine with food (12 healthy, crossover, saliva):** tmax **29 ± 12 min fasted → 65 ± 35 min after a ≈ 500 kcal light meal and 69 ± 46 min after a ≈ 1000 kcal high-fat meal**; Cmax lower fed; AUC0–1440 not different (rate, not extent). Tablet taken with 240 ml water 30 min after starting the meal. | B | Wildgrube T 2026, Int J Pharm X, PMC13293696 (full text) |
| ML4 | **Water after a meal still leaves fast ("Magenstrasse"):** 50–150 ml water after a light meal emptied in ≈ 20 min regardless of volume (MRI, n=12); caffeine dissolved from a tablet in the same water was delayed (mixed with chyme). | B | Großmann L 2025, Int J Pharm X, PMC12320173 (abstract + full text) |
| ML6 | **Real mixed meals by MRI (15 healthy, 200 ml water with each):** T50 **132 ± 33 min** (high-carb, 441 kcal), **158 ± 37** (high-protein, 726 kcal), **188 ± 41** (high-fat, ≈ 1210–1340 kcal). Women slower (significant only for high-protein). | B | Farivar D 2026, Int J Legal Med, PMC13499749 (abstract + full text) |

**Model (C), `science/foodSim.ts`:**
- A meal with at least one drink and one food has **two phases**. Drink phase: exponential, `T50 = liquidT50(drink kcal) × (1 + 1.0 × min(1, food kcal / 500))`. Check: ≈ 250 kcal food → ×1.5 (Maddern 18 vs 13 min water alone = ×1.4); ≥ 500 kcal → ×2 (Wildgrube tmax ratio 65/29 = 2.2, capped at 2). Range in people: liquid T50 11–35 min in a meal (ML2).
- Plain water (< 5 kcal, no caffeine) is not slowed (ML4).
- Food phase: the single-food curve with **all** the meal's energy (nutrient drinks also slow solids, ML1) and fibre.
- `solidT50` cap raised **150 → 210 min**: the √kcal line gives 124 / 159 / 210 min for 441 / 726 / 1270 kcal vs MRI 132 / 158 / 188 (ML6). So fat slows mostly through its calories; no separate fat factor needed for the meal T50 (C). MRI counts secretions, so it reads slightly long.
- Semi-solid drinks (cappuccino) count as drinks; their "alone" half-time is their single-food value.
- Output for burger + 20 fries + cola (635 kcal): drink T50 57 min (alone 29), food T50 155 min.

## 2. Blood sugar of a meal

| ID | Claim | Level | Source |
|---|---|---|---|
| ML5a | Protein and fat each lower the glucose response to 50 g glucose **linearly over 0–30 g**, independently; protein ≈ 2× (results) to 3× (conclusion) fat per gram. Author caveat: may not apply to solid meals. | B | Moghaddam E 2006, J Nutr, PMID 16988118 (abstract; full text not reachable) |
| ML5b | Per gram added to 50 g available carbohydrate: **tuna protein −0.57% glucose iAUC/g; whey −1.4%/g**. Butter on bread: small, non-significant. | B | Wolever TMS 2017, Am J Clin Nutr (letter), PMC5525124 |
| ML5c | Protein with potato / pasta / rice (15 healthy): iAUC **−11 to −18.5% (lamb, soy) for potato, −14.6 / −28.5% pasta, 0 / −18% rice**; insulin **+35 to +83%**. Differences between staples shrink in a mixed meal. | B (pilot) | Mishra SS 2026, Nutrients, PMC13415058 (full text) |
| ML5d | 20 g fat (margarine) on 110 g bread reduced the glycaemic response in people without diabetes (no number in the text read). | B | Wolever TMS 2013, Diabetes Care comment, PMC3836146 |
| GL7 | Cola with a muffin: no dip after the peak (reused, cola.md B4). | A | — |

**Model (C), `mealGlucose()`:**
- One curve per item with carbohydrate (its own GL), summed. Total size = the single-food saturating curve of the **total** GL, shared by GL.
- Each item: its own solid/liquid factor; drinks use the drink-phase speed and their peak is scaled by `(T50 alone / T50 in meal)^0.3` — exponent from our own convolution model (digestion-generic §4: T50 28 → 68 min lowers the peak 2.45 → 1.9 → exponent 0.28).
- **Blunting by the OTHER items** (each food's GI already includes its own fat and protein): `0.57%/g protein + 0.23%/g fat` per 50 g of the item's carbohydrate, max 35% (largest read effect 28.5%). Fat = protein / 2.5 (ML5a).
- No sugar dip when the meal has ≥ 10 g fat + protein (GL7).
- One item alone → exactly the old single-food curve (anchors unchanged: cola +2.3 mmol/L at ≈ 26 min).
- Outputs: cola alone +2.29 mmol/L at 26 min; burger + fries + cola **+1.71 at 53 min** (−25%); white bread ×2 + gouda ×2 lower than bread alone; popcorn + cola +2.06.
- Spread: people differ by ±50% or more (GL8, CV 68%); shown as a range on screen as before.
- Insulin: sum of the item curves (cola anchor). **Not modelled:** protein raises insulin (ML5c, +35–83%) — open.

## 3. Alcohol with food (reused)
Fed peak ≈ 40–57% of fasted (alcohol.md PF1; beer.md H1–H2). In the meal model "fed" = ≥ 100 kcal of non-drink food in the same meal (C). Beer + 2 ćevapi + 2 slices of bread: 0.11 g/L vs 0.21 fasted (ratio 0.53). Peak **time** fed vs fasted: no number read (**?**).

## 4. Caffeine with food
Coffee's caffeine leaves with the drink phase (ML3). Cappuccino alone tmax 148 min (model) → with a croissant 188 min (+40; Wildgrube +36–40). Total caffeine unchanged. Note: the espresso model's fasted tmax (≈ 74 min for a shot) is already later than Wildgrube's 29 min (espresso.md G3 conflict), so absolute times run late; the **shift** matches for one cup + one pastry, and is larger (+80 min) for double portions (C, upper end of the ±46 min SD).

## Open questions
1. Moghaddam 2006 full text (mmol/L per gram) — would replace the 0.57/0.23 %/g mix.
2. A controlled glucose study of **sugary drink + solid meal** vs drink alone (healthy, 15-min sampling).
3. Maddern 1985 exact meal; healthy liquid-phase T50 for **large** meals (> 600 kcal).
4. Fed alcohol **tmax** (min) and graded effect of meal size (snack vs full meal).
5. Protein's insulin boost in mixed meals (ML5c) for the insulin curve.
6. Sequence effects (drink before vs after the food; "vegetables first") — not modelled; the model assumes everything at minute 0.
