# Sense audit, Inside 24h, 2026-10-18

The question for this pass: would a normal person, a doctor and a journalist all say the screen makes sense?

Backups: `backups/20261018-155559-sense/`. It holds 13 files, under the same paths as in the repo. Nothing was deleted, nothing was committed and no build was run.

**End state**
- `npx tsc --noEmit -p .` is clean.
- `npx vitest run` passes 25 files and 305 tests, 13 of them new in `app/src/v4/senseAudit.test.ts`.
- No browser check was run. The other agent is building in parallel.

## Method

**`app/scripts/sense-dump.ts`** (run with `npx vite-node scripts/sense-dump.ts <out> [regex]`) writes out every sentence a user can see. For each scenario it prints:
- the 4 lights (each light's sentence at its worst moment and at the start);
- the day summary;
- every quick answer, with its tone and note;
- every story chapter (live text);
- the liver, brain and pancreas cards.

**The matrix**
- All 149 foods at 1×.
- Every drink at 3, 5 and 10×. The alcoholic drinks also at 1 and 15×.
- Three times of day: 08:00, 19:00 and 23:00.
- Fasting and "just ate" (`withMeal`).
- Two bodies: a small woman (50 kg / 160 cm) and a big man (100 kg / 185 cm).

That makes about 40,000 lines. I normalized the numbers and grouped the lines into about 340 templates, then read every template.

**`app/scripts/sense-alcohol-table.ts`** lists, for beer, wine and rakija, the peak and the "gone" time at 1, 3, 5, 10 and 15 drinks.

`app/scripts/_sense_tmp.ts` is a small spot-check script I left behind. The no-delete rule applies, so it is still there.

## Issues found and fixed

| # | Sev | What a skeptic saw | Fix | Source |
|---|---|---|---|---|
| 1 | HIGH | **"Sugar fine/OK" on rakija.** People read it as "rakija has sugar, but it's OK". The label means *blood* sugar. | The light is now called "Blood sugar & energy". New `SHORT_LABEL.energy = 'Blood sugar'` (status.ts). Compare, the video chips and the share card (AppV4.tsx, Compare.tsx, share.ts) changed too. The health bar "Sugar" is now "Free sugar" ("Sugar you eat or drink, not blood sugar"). The summary now reads "Blood sugar, heart, …". The rule text says the light is about the sugar in your blood. **CalmBar.tsx is still open (see Open, item 1).** | — |
| 2 | HIGH | **Alcohol and blood sugar told only half the story.** Rakija said "No, it stays steady". Beer and wine said "Hard to say". | Every alcoholic item's answer and light now says that alcohol slows the liver's sugar-making for hours. In healthy people who have eaten, this rarely matters. After a long fast, heavy drinking, or with insulin or diabetes tablets, blood sugar can drop hours later, even the next morning. The answer gets a yellow edge above 0.75 g/kg (Turner's dose). After evening drinking at ≥ 0.5 g/kg, a new "Next morning" chapter warns people who take insulin or diabetes tablets. New claims **AL10 (B)** and **AL11 (B)**. | Siler 1998 PMID 9815011 (48 g, overnight-fasted men: gluconeogenesis −45% for 5 h, plasma glucose unchanged); Looi & Lawler 2025 PMID 40648766 ("hypoglycemia hardly occurs in healthy individuals"; the risks are fasting, binge drinking and diabetes); Turner 2001 PMID 11679452 (T1D, 0.75 g/kg wine at 21:00: 5 of 6 needed treatment for hypoglycemia after breakfast); Holt 2021 ADA/EASD PMID 34590174 (alcohol is a risk factor for level 3 hypoglycemia) |
| 3 | MED | **Does rakija contain sugar?** | Plain spirits now say in the first chapter: "No sugar: plain distilled spirits like this have none, so all the calories come from the alcohol (sweet liqueurs and honey brandy such as medica do have sugar)". New claim **AL15 (A)**. The rule is generic: a spirit (≥ 13 g alcohol per 100 g) with < 0.5 g sugar. A sweet liqueur added later will not get this sentence. | USDA FDC 174815 (distilled spirits, 80 proof: 0.0 g carbohydrate); 175097 (coffee liqueur: 46.8 g/100 g) |
| 4 | HIGH | **The friend who blew positive after 12 h of sleep.** The app showed only one "gone" time, gave no range, and had no next-morning answer. | Two new quick answers. **"When is the alcohol gone?"** gives the typical time and a range for livers clearing 0.10 to 0.20 ‰ an hour ("for most people somewhere between …"). It adds "Sleep, coffee, water or a shower don't speed it up". Above about one drink it adds "we assume all at once; spread out, the peak is lower but it is gone at about the same time" (**AL14, C**). **"Can I drive tomorrow morning?"** covers evening and night drinks. At the wake-up time it gives what a typical liver and a slow liver would have left. The four outcomes are "No …", "Not for sure …" and "gone, but a hangover can still make you drive worse". It never says "safe". It always ends with the Croatian limits: 0.5 ‰ for most drivers, 0 ‰ for novice and professional drivers. The "Alcohol gone" and "Still alcohol after 24 h" chapters now give the same range, and a new "Next morning" chapter repeats it. New `science/alcoholClock.ts`. New claim **AL12 (B)**. | Jones 2010 PMID 20304569 (0.10–0.15 fasted, 0.15–0.20 fed, physiological range 0.10–0.35 ‰/h; zero-order); Alford 2020 PMID 32408588 (52 social drinkers: half still positive on a morning breath test; both groups drove worse); Your Europe, Croatia (0.5 / 0.0 / 0.0 mg/ml, read 2026-10-18) |
| 5 | HIGH | **More than 24 h.** Fifteen rakija for a small woman still leave 2.5 ‰ at 24 h. The summary said "high stress 19:01–19:01", which looked like one minute. | The summary now says "19:01–past 24 h". The answer starts "Not within the 24 hours shown here. A typical body like yours needs about 42 h, until around …". The chapter now gives the total hours. Past 48 h the time is given in hours, not as a wrong day name. | — |
| 6 | HIGH | **Lethal levels were called "reaction time and balance are worse".** The 15-rakija peak was 3.95–9.87 ‰. | When the top of the range reaches 2.2 ‰, the light, the peak chapter, the changes row and a new answer **"Is this much dangerous?"** all say: dangerous; deaths from alcohol poisoning start from about 2.2 ‰; call 112 if someone can't be woken, breathes slowly, vomits or has a seizure; blood alcohol can keep rising after drinking stops. New claim **AL9 (A)**. | Jones & Holmgren 2003 PMID 12877310 (693 deaths: median 3.6 ‰, 5th–95th percentile 2.2–5.0 ‰); NIAAA overdose page (warning signs; "BAC can continue to rise …") |
| 7 | MED | **Water from 5 L of beer counted as a plain "Yes".** Wine got a plain "Yes" too. The beer sentence ("does not make you lose more water") showed for 10 beers. | "Does it count as water?": "Yes" for beer up to about 40 g of alcohol. "Mostly: wine and spirits make you pee a little more for a few hours" for wine and spirits. Above 40 g, "Not reliably: … studies only tested up to about 30–40 g". The beer sentence now shows only up to 40 g. New claim **AL13 (B)**. | Polhuis 2017 PMID 28657601 (30 g of alcohol: wine and spirits gave a small diuresis over 4 h, none over 24 h; beer none); Maughan 2016 (AL7) |
| 8 | MED | **"Sugar, heart, water and brain: no real effect"** while the sugar light was grey ("not measured", e.g. beer or pizza). | Unmeasured systems now read "Blood sugar & energy: not measured" in the summary. | — |
| 9 | MED | **One rakija for a big man:** the summary said "Brain: no real effect", while "Can I drive?" said "No". | A brain light that stays green but has alcohol above 0.02 ‰ now reads "a little alcohol in your blood 19:05–21:40, not zero: don't drive". | AL4 |
| 10 | MED | **"If your resting blood pressure is often 130 or higher, see a doctor"** as the next step after 10 beers or a few colas. The yellow came from the drink's pulse effect. | That tip now shows only when the person's own pressure is ≥ 130. | AHA (existing) |
| 11 | MED | **"A big meal: many people feel sleepy" after 10 beers.** | This chapter is now for food only, and alcohol calories no longer count toward "big". | FC1 (Wells 1998 is about meals) |
| 12 | LOW | **Rakija: "Half leaves within about 13 minutes: calories slow the stomach down (water would be gone in about 13)."** The sentence contradicted itself. | Only non-alcohol calories count, and the line now needs t50 ≥ 16. Otherwise it says "about as fast as water". | GE12 (kcal − 7 × alcohol) |
| 13 | LOW | **Odd names in the first chapter:** "1 pancake pancakes", "1 frankfurter frankfurter / hot-dog sausage", "1 croissant, medium croissant", "1 fruit plum". Kefir and smoothie were a "First bite". | When the amount already names the food, the name comes first: "Pancakes (1 pancake)". "1 plum". Kefir and smoothie are now a "First sip". | — |
| 14 | LOW | **"Alcohol is still in your blood at 23:00"** when the drink was taken at 23:00. | Now "… when you go to bed". | — |
| 15 | LOW | **Rakija + cola at 21:00: "Will I sleep well? Yes"**, because a little caffeine pushed it past the alcohol branch. | Now "Probably: by 23:00 almost no alcohol should be left …", as for alcohol alone. | AL6 |

Copy in How we know (HowWeKnow.tsx):
- The absorption bullet now says the liver clears 0.10–0.20 ‰ an hour, asleep or awake, that alcohol can still be there the next morning or after more than 24 h, and that we assume everything is drunk at once.
- The blood-sugar bullet now says "Blood sugar" means blood, not food, and adds the alcohol note.
- New study links: AL9–AL15.

## Numbers checked (default man 70 kg / 175 cm, fasting)

The gone-time grows with the number of drinks, roughly in proportion:
- **Beer:** 2.8 / 8.5 / 14.1 h for 1 / 3 / 5 drinks. Ten beers are not gone in 24 h: 0.52 ‰ is left, and the full time is about 28 h.
- **Rakija:** 2.0 / 6.0 / 10.1 / 20.1 h for 1 / 3 / 5 / 10.

**Hand check (Widmark):** 5 beers = 88.7 g absorbed. Body water volume (r × weight) is 51.9 L, so the liver removes 6.2 g/h at 0.12 ‰/h. That gives 14.3 h, against 14.1 h in the model.

**Small woman:** 5 beers take 21 h, and 10 rakija are not gone in 24 h.

**Friend scenario:** 10 beers at 23:00, default body. At 07:00 the answer is "No. At 07:00 a typical body like yours would still have about …".

## Tests added (`app/src/v4/senseAudit.test.ts`, 13 tests)

**Labels**
- No label, bar or chip reads "Sugar" on its own. A source scan covers v4/*.ts(x); only CalmBar.tsx is allowed, and that is listed as open.
- The summary never calls an unmeasured light "no real effect" and never prints "19:01–19:01".
- A little alcohol is not "Brain: no real effect".

**Alcohol timing**
- The gone-time strictly increases from 1 to 3, 5 and 10 drinks for beer, wine and rakija. The 10× / 5× ratio is 1.6–2.3. Earliest ≤ typical ≤ latest.
- The answer and the "Alcohol gone" chapter give the same clock time.
- "Can I drive tomorrow morning?" exists for 1, 3, 5 and 10 drinks at 19:00 and 23:00. It never says "Yes" or "safe", it always gives the Croatian limits, and its tone is ≥ 1. 10 and 5 beers at 23:00 get "No"; 1 beer gets the hangover sentence.
- The 24 h overflow is said out loud: "Not within the 24 hours", "needs about N h in total", and no "Alcohol gone" chapter.
- The danger warning appears at poisoning levels and not for one beer.

**Alcohol and blood sugar**
- The later-dip note appears for rakija, beer and both wines.
- The yellow edge appears only for heavy drinking.
- The morning insulin warning appears from 3 beers, not after 1.
- Rakija gets "No sugar: plain distilled spirits"; wine does not.

**Other**
- The water answer for alcohol: Yes, Mostly, or Not reliably.
- No "big meal" chapter for drinks, and the resting-pressure tip shows only when the person's own pressure is high.
- Rakija's stomach text does not claim that calories slowed it.

## Open

1. **CalmBar.tsx (owned by the parallel agent): line 11, `SHORT.energy: 'Sugar'`.** This is the Simple-view light that showed "Sugar fine". Change it to `'Blood sugar'`, or better, `import { SHORT_LABEL } from './status'`. The test lists CalmBar as the only allowed exception. Remove that exception once it is fixed.
2. **All at once.** The model takes every drink at the same moment, so for 10 or more drinks the peak is a ceiling, not a real evening. The screen now says so. Modeling drinks spread over time would need a multi-dose input in parse/meal, which belongs to the other agent.
3. **The range covers liver speed only.** The earliest and latest times use only the 0.10–0.20 ‰/h range. Body water (the ±40/50% peak range) can shift them further, and the tooltip says so. Heavy daily drinkers can clear up to 0.35 ‰/h (Jones 2010). We do not use that, so we stay on the cautious side.
4. **Fed elimination (0.17 ‰/h) runs for the whole night after "just ate".** It was measured over a few hours. Across 10–20 h it may be optimistic. That is a science decision for Opus.
5. **The yellow-edge thresholds for blood sugar (0.75 g/kg) and the morning warning (0.5 g/kg) are our choice (C).** They sit at or below Turner's 0.75 g/kg, which was measured only in type 1 diabetes. In healthy people we do not quantify the dip.
6. **Other countries.** "Limits differ by country" lists no other countries. The EU list (alcohol.md D6) is still marked source pending.
7. **Caffeine overdoses.** 10 energy drinks (≈ 800 mg) or 10 lattes give "Heart: high stress past 24 h" but no danger answer like the one for alcohol. This was not researched this round.
8. **No browser check was done**, and neither was a video check for the longer "Blood sugar" chip label. The share-card line now uses `fit()`. Do a visual check after the build at 360 px, in Compare and in the video.
9. **Beer and wine have no measured glycemic index in the database.** They stay "not measured". That is data for the other agent.
