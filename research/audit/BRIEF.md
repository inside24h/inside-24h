# Food data audit: brief for auditor agents (2026-10-17)

Owner's goal: every number we show about every food and drink must be **exactly right, 1:1, with no errors**.
We need to be able to defend each value to a journalist or a dietitian.

## Where the data lives
- `research/tools/fooddb_spec.py`: the spec for each food. It sets the USDA record, serving rule, free-sugar rule, GI key, aliases, recipe mixes and notes.
- `research/tools/build_fooddb.py`: resolves the USDA SR Legacy records from `data/raw/usda` and writes `research/fooddb.json`. It also holds the GI table and its sources.
- `research/tools/usda_sr.py`: helper to read the local USDA SR Legacy data. Use it to check that each record really is the food we claim it is.
- `research/fooddb.json`: the generated output. The app reads it, see `app/src/v4/food/parse.ts` and `app/src/content/food.ts`.
- App-side overrides change what the user sees, so audit them too. Grep `app/src` for hard-coded nutrition, caffeine, alcohol and volume numbers. Known examples:
  - `COLA.eu` (cola uses EU label values);
  - drink-specific "glass"/"cup" volumes in `parse.ts`;
  - caffeine and alcohol constants in `foodSim.ts`, `content/food.ts`, `stories.ts`, `products.ts`, `headlines.ts`, `healthBars.ts`.
- Background reading: `research/foods.md`, `research/fooddb-notes.md`, `research/alcohol.md`, and the reports in `research/improvements/`.

## Check EVERY field of EVERY food in your group
1. **USDA record match.** Is it the most representative record for what a normal person means by the name? Check cooked vs raw, the right cut and fat level, and the European vs US product. Read the actual record via `usda_sr.py`.
2. **Nutrients per 100 g.** Look for kcal, carbs, sugars, fiber, fat, satFat, protein, sodium, caffeine, alcohol and water that are off or missing. A missing value must not be shown as 0. kcal should roughly match 4/4/9/7 Atwater, or explain why not.
3. **Serving.** Is it realistic for a European adult? Is the label honest? Are ml and g converted with the correct density?
   - Typical references: can 330 ml (EU) vs 355 ml (US); beer 500 ml in Croatia/EU; a wine glass is 150 ml; a rakija shot is 30–50 ml.
   - Check the alcohol ABV: beer ~5%, wine 12–13.5%, rakija 40%. Compare with the USDA alcohol g/100 g.
4. **Caffeine.** Compare with authoritative sources: USDA, the EFSA 2015 caffeine opinion, product labels (Red Bull 32 mg/100 ml = 80 mg/250 ml), and published espresso/brewed coffee ranges. Show a range where products vary.
5. **GI.** Does the value and source match the International Tables (Atkinson, Foster-Powell & Brand-Miller 2008 Diabetes Care 31:2281, and the 2021 update in AJCN 114:1625)? Is the food mapped to the right GI entry? Does it have a GI when it should not (e.g. foods with almost no carbs)?
6. **Free-sugar rule.** Check against the WHO definition: all / none / minusLactose. Watch for honey, juice, smoothie, dried fruit, flavored yogurt and chocolate milk.
7. **Recipes (`mix`) and proxies.** Are the weights realistic? Are they clearly flagged as our assumption?
8. **Aliases.** Look for any Croatian or English alias that maps to the wrong food, or that is ambiguous in a misleading way. For example, "sok" mapping to cola, or "kava" mapping to both espresso and filter coffee. Then decide which one wins and whether that is sensible. Look for common missing names, Croatian and English.
9. **Display.** Look for any name or serving label that is not American English, or that could confuse people.

## Sources
- Use `python -I research/tools/epmc.py search|abs|grep ...` from the repo root for papers.
- WebSearch/WebFetch are fine for product labels and the GI tables.
- Cite exactly what you read; never invent a value.
- If something is genuinely uncertain, say so and propose a range.

## Rules
- **READ-ONLY on project files.** Do not edit any code or data. Write only your findings file.
- Never delete anything.
- No servers, no browsers.

## Output
Write `research/audit/food-<group>.md`. For each food, give a one-line verdict: OK, or the problems.
Then add a **Proposed changes** table with these columns:

| food id | field | current | proposed | source (exact) | confidence (high/med/low) |

Only propose a change when you are confident it is more correct. Put the doubtful cases under **Open questions**.
