# Audit trenutnog formata: video + web/app (2026-11-22)

Autor: audit agent, read-only. Ništa nije renderirano, kod nije diran, git stanje nije dirano (drugi agent radi Phase 4l u `app/src/v4`). Nijedan dev server nije pokrenut; web dio je audit koda i već buildanog `site/`.

**Izvori:**
- Uzorci: `C:\claudework\video-samples\2026-11-22-v35\` (najnoviji: aperol-spritz-reels, burger-fries-reels, carbonara-long-tiktok, vodka-red-bull-shorts, white-wine-vs-red-wine-shorts), `2026-11-21-v34\` (iste tri single), i stariji tipovi za kofein / obrok / usporedbu: `2026-11-19-v30\` (cappuccino-tiktok-long, chicken-rice-broccoli-reels-medium, lemonade-vs-pear-reels-medium, grapes-shorts, oatmeal-tiktok-long), `2026-11-17-v32\` (black-tea-shorts, compare-pretzel-vs-peanuts-tiktok-long).
- Kod: `app/src/v4/*`, `app/src/science/*`, `app/src/scene/*`, `app/src/content/*`, `app/scripts/*`, `site/`.
- Prethodna kritika: `research/improvements/video-critique-2026-11-22.md`.

**Metoda mjerenja (timeline):** skripte su iz `*.timeline.json` izvukle segmente po (phase, beat, shot, card), sve tekstove na ekranu (bez `deco`), čipove i end card. Sve se mjeri iz onoga što je stvarno nacrtano (`video-telemetry.ts`).

**Važna ograda o zvuku:** QC uzorci se renderiraju **bez voiceovera** (`app/scripts/render-sample.mjs`, zaglavlje: "No voiceover (a fresh profile has it off…), music on"). Naracija i `.srt` nisu spremljeni uz uzorke. Ono što bi glas rekao izvedeno je iz koda (`video-narration.ts narrationFor`), ne iz uzorka. Ako vlasnik gleda ove uzorke, gleda verziju samo s glazbom i tekstom.

---

## 0. Sažetak

**Najveći razlozi dosade (detalji u A5):**
1. Isti kostur u svakom videu, bez obzira na hranu: prvi gutljaj/zalogaj → želudac → vrh → bubrezi → nestalo / debelo crijevo → jutro / 24 h → end card.
2. Kartice su većinom generičke, na razini klase: 54–93 % vremena kartica u videima o hrani su rečenice bez ijednog broja ("Your stomach churns it into a paste." u 6 od 9 videa o hrani).
3. Gustoća je ~1–2 činjenice na 10 s, a većina ih ponavlja hook.
4. Kod alkohola pravni blok (BAC + US + EU + upozorenje, 6–7 redaka) stoji na ekranu 30–38 % trajanja.
5. Glas (kad je uključen) čita kartice od riječi do riječi, pa audio kanal ne nosi novu informaciju.
6. Nema grafova: model ima krivulje glukoze, inzulina, BAC-a, kofeina, masti u krvi, pulsa i tlaka, a video pokazuje jedan mali gauge.
7. Nijedan savjet "što učiniti", osim "Don't drive".
8. Usporedbe s istim ishodom ("Almost the same. 15 g vs 16 g") i dva identična tijela.
9. Uvijek isto tijelo (70 kg muškarac). Nema "ti naspram nekog drugog" ni "što ako".
10. Hook pita apstraktno, a odgovor je predvidljiv ("All 584 kcal taken up by your body").

**Najveće neiskorištene mogućnosti (detalji u A2):**
- per-item krivulje šećera u obroku (`ItemGlucose`: vrh, vrijeme, "blunt");
- krivulje inzulina, pulsa i tlaka (`FoodSim.insulin/hr/sbp`);
- hidracija prema gradu i klimi (`simulateHydration`);
- san (`sleepRiskAt`, `caffeineLatencyMin`, `alcoholSleepTier`);
- "kad je najbolje" i "zadnje vrijeme za kofein" (`Answers.quickAnswers`);
- dokazani savjeti (`content/tips.ts TIPS`) i zamjene (`analyze.ts SWAPS`, `Swap.tsx`);
- hodanje (`walkingMinutes`);
- dugoročni učinak (`healthBars`, `content/longterm.ts`);
- personalizacija (spol, težina, pušenje, kontracepcija, trudnoća, svakodnevni kofein, uz obrok, tempo pijenja);
- razine dokaza i izvori (A/B/C) po tvrdnji;
- organske kartice s live brojevima (`organInfo` u `food/foodProduct.ts`);
- "The whole trip" (`Passport.tsx`).

**Web (detalji u B):**
- Jedan URL, SPA s hash rutama: nema stranice po hrani, sitemap ima 1 URL, nema strukturiranih podataka ni dinamičkog `<title>`.
- Zadani "calm" prikaz pokazuje jednu rečenicu i 4 svjetla. Sve bogato (sparklineovi, inzulin, puls, tlak, putovanje) je iza "Full" / "Detailed".
- Ništa ne pamti povijest: navike (`habits`) se ne spremaju, nema dnevnika, favorita, streaka ni "što je novo".
- Početni download je ~283 kB gz, a s 3D-om ~960 kB gz.
- 25 CSS pravila koristi font od 10–11,5 px.

---

# DIO A: VIDEO

## A1. Inventar sadržaja

### A1.1 Zajednički kostur (svi tipovi)
Isti u svih 12 izmjerenih videa (`video-plan.ts planVideo / planCompare`):

| Vrijeme | Beat | Što je na ekranu |
|---|---|---|
| 0,00–0,47 s | `intro/teaser` | cold open na vrhu priče (BAC ili gauge šećera), hook, sat na vrhu (npr. +0:38) |
| 0,47–0,97 s | `intro/rewind` | sat se vrti natrag na +0:00 |
| 0,97–2,4/3,0 s | `intro/hook` | kinetički hook (riječ po riječ), čip "N ml/g · In your stomach" |
| od 2,4–3,1 s | `main/hold` | **FIRST SIP / FIRST BITE**: kartica s 1 brojem (doza ili makro) |
| – | `hold` ↔ `glide` | naizmjence: kartica 4–5 s (`CARD_MAX_S = 5`), pa glide 0,6–3,8 s (često "TAKEN UP SO FAR" ili "NEXT · +h:mm · …" čip) |
| zadnjih ~5–7 s | `main/end` + `outro/end` | "AFTER 24 HOURS" + red ikona (Blood sugar / Heart / Hydration / Brain), pa end card (≥ 2,5 s), CTA "Which food/drink should we test next? 👇", loop linija |

Stalno na ekranu:
- zaglavlje "INSIDE 24H · WATCH THE NEXT 24 HOURS", `@inside24h`, hook u 2 retka, sat "+h:mm since the first sip";
- disclaimer i traka 0 h–24 h (`share.ts footer`).

### A1.2 Single, alkohol: aperol-spritz-reels (v35, medium, 47,7 s)
Hook: "How soon are 14 g gone? / Aperol spritz: 14 g of alcohol."

| s | sat | shot | kartica | čip / gauge |
|---|---|---|---|---|
| 0,0–1,0 | +0:38→0:00 | – | – | Focus may dip · BAC 0.009–0.023 % + limiti |
| 1,0–2,7 | +0:00 | – | (hook) | 150 ml · In your stomach |
| 2,8–5,5 | +0:03 | head→chest | FIRST SIP · About 1 US standard drink. | 145 ml |
| 5,7–9,1 | +0:07 | upper | FIRST SIP · 17 g of sugar: about 4 teaspoons. | 140 ml |
| 9,5–11,9 | +0:11 | body | BLOOD ALCOHOL · Still rising | BAC blok |
| 12,8–17,7 | +0:16 | upper (stomach lit) | IN YOUR STOMACH · Half leaves your stomach within 75 minutes. | 129 ml + BAC blok |
| 19,3–23,7 | +0:38 | head | ALCOHOL PEAK · Blood alcohol is at its highest now. | Focus may dip · BAC 0.009–0.023 % |
| 25,1–30,0 | +2:00 | urinary (kidneys lit) | KIDNEYS · Kidneys filter the drink's 124 ml of water. | – |
| 31,0–35,6 | +2:07 | liver (lit=[]) | ALCOHOL GONE · The alcohol is gone after about 1–3 h. | – |
| 37,0–41,0 | +8:16 | body | NEXT MORNING · Alcohol-free 5+ h. Don't drive. | – |
| 42,3–44,3 | +24:00 | body | AFTER 24 HOURS + 4 ikone, samo nazivi | – |
| 44,3–47,7 | – | – | End card: "Blood alcohol: back to zero · Gone after about 2 h (typical) · Peak: Focus may dip · 40 min in · BAC … · Never safe to drive…" | – |

Mjere:
- 7 činjeničnih kartica, od toga 6 s brojem;
- 1,9 činjenica / 10 s;
- BAC pravni blok 14,5 s (30 %);
- glavni dio bez kartice 9,6 s (20 %);
- intro + outro 6,1 s (13 %).

Neusklađenost: kartica kaže "1–3 h" (31 s), end card "about 2 h".

### A1.3 Single, alkohol + kofein: vodka-red-bull-shorts (v35, short, 30 s)
Hook: "How long do 19 g stay in you? / Vodka and energy drink: 19 g of alcohol."

Kartice:
- FIRST SIP · 50 mg of caffeine. (2,5–6,2)
- ALCOHOL PEAK · Caffeine masks drowsiness, not impairment. (7,3–12,1)
- BLOOD ALCOHOL · Coming down slowly (12,7–14,8)
- ALCOHOL GONE · … about 1–5 h. (15,8–20,3)
- NEXT MORNING · Alcohol-free 3+ h. Don't drive. (21,1–25,1)
- end card od 26,6 s

Čip "38 mg caffeine / still in your body" stoji 14,8–23 s. Najjača priča ("alkohol odlazi, kofein ostaje") je samo čip, nije kartica.

Mjere: 2,3 činjenice / 10 s; BAC blok 11,2 s (37 %); 24 h red ikona prekinut nakon 2 od 4.

### A1.4 Single, kofein: cappuccino-tiktok-long (v30, long, 66,1 s), black-tea-shorts (v32, 26,4 s)
Cappuccino:
- **Tri uzastopne kartice "CAFFEINE PEAK" 17,3–34,2 s** (17 s) dok sat ide samo +1:25 → +1:30:
  - "The caffeine reaches your brain."
  - "Caffeine blocks the tiredness signal a little."
  - "Most of the drink has been absorbed now."
- Čip "54 mg caffeine" je nepromijenjen 16,5–37,0 s (~20 s).
- "STILL TO COME · Coming up: what is left at bedtime." (42,4–45,9).
- "BEDTIME · About half of the caffeine remains. / Probably too little to affect most people's sleep." (49,6–58,6).
- Mjere: 93 % vremena kartica generičko; 0,6 činjenica / 10 s (najniže); 21,4 s (32 %) glavnog dijela bez kartice.

Black tea: 3 kartice, od toga 2 generičke; 1,5 činjenica / 10 s.

### A1.5 Single, obrok: burger-fries-reels (v35, medium, 45,3 s), chicken-rice-broccoli (v30)
Burger, hook: "Hamburger + French fries: 20 g of fat. / When are those 20 g in your blood?"

| s | sat | kartica |
|---|---|---|
| 2,8–5,3 | +0:05 | FIRST BITE · 20 g fat, 58 g carbs. |
| 6,4–10,8 | +0:11 | IN YOUR STOMACH · Your stomach churns it into a paste. *(generičko)* |
| 11,1–13,5 | +0:17→ | TAKEN UP SO FAR · 1 … 17 of 472 kcal *(brojač, filler)* |
| 14,4–19,6 | +1:25 | BLOOD SUGAR PEAK · The burger's sugar hits first, then the fries. *(bez broja, iako model ima vrh po stavci)* |
| 19,9–22,3 | +1:36 | TAKEN UP SO FAR · 77 of 472 kcal |
| 23,2–27,3 | +3:30 | FAT IN YOUR BLOOD · The fat joins your blood later. *(odgovor na hook bez broja; broj +0.3 mmol/L je samo u čipu)* |
| 28,4–32,7 | +4:00 | IN YOUR STOMACH · Almost all has moved on by 4 hours. |
| 34,0–38,7 | +10:19 | INTO THE LARGE INTESTINE · The fiber reaches your large intestine. *(generičko)* |
| 39,9–45,3 | +24:00 | 24 h ikone, pa end card: "Blood sugar: back to usual · Long after its peak · Blood fat peak · 3 h 30 min in · +0.3 mmol/L" |

Mjere: 73 % vremena kartica generičko; 1,5 činjenica / 10 s; 0 savjeta.

Chicken + rice + broccoli: 91 % generičko, a jedini konkretni redak je "378 kcal in total.". "Most of the sugar comes from the rice." je jedina rečenica o sastavu obroka.

### A1.6 Single, long, hrana: carbonara-long-tiktok (v35, 69,3 s)
- 10 kartica, od toga 5 generičkih:
  - churns into a paste;
  - "Many people feel sleepy after a big meal.";
  - fiber reaches;
  - "leftovers creep";
  - "Most of the fiber is still in you."
- "TAKEN UP SO FAR · # of 584 kcal" se pojavljuje tri puta (11,4 / 42,6 / 51,4 s).
- 24 HOURS LATER: dvije kartice 54,8–63,1 s.
- End card odgovara na hook s "All 584 kcal taken up by your body".
- Mjere: 1,4 činjenice / 10 s; shot "body" (cijelo tijelo) 20,7 s = 30 %.

### A1.7 Usporedba: white-wine-vs-red-wine-shorts (v35, 24,5 s), pretzel-vs-peanuts (v32, 62 s), lemonade-vs-pear (v30, 49,9 s)
Vino, hook: "Guess: which brings more alcohol?"

Kartice:
- BOTH · FIRST SIP · Same amount: 150 ml each. (2,5–6,8)
- BOTH · ALCOHOL PEAK · Blood alcohol is at its highest now. (7,8–13,1)
- BOTH · ALCOHOL GONE + ANSWER · Almost the same. 15 g vs 16 g of alcohol. (13,9–18,3)

Oba tijela pokazuju gotovo identične brojeve (BAC 0.011–0.028 naspram 0.012–0.029 %; 55 naspram 54 ml urina), a dva BAC bloka zauzimaju 38 % trajanja. Usporedba bez razlike je antiklimaks. Guess logika (`video-guess.ts`) u zaglavlju kaže da se pitanje s izjednačenim odgovorom ne postavlja, a ovdje je postavljeno, pa treba provjeriti `chooseGuess` za alkohol.

Pretzel vs peanuts: odgovor na 41,9 s ("More per serving: Soft pretzel. 389 kcal vs 167 kcal") je dobar i ima twist na end cardu (per 100 g kikiriki ima više). Ipak, 45 od 62 s je shot `body|body`.

### A1.8 Tablica gustoće (svi izmjereni)

"Generic %" = udio vremena kartica bez ijedne znamenke. "Činjenice/10 s" = (kartice s brojem + vrste brojčanih čipova) / trajanje.

| video | tip/cut | s | kartice | s brojem | generičke | generic % | činj./10 s | BAC blok | bez kartice (main) | intro+outro | savjeti |
|---|---|---|---|---|---|---|---|---|---|---|---|
| aperol-spritz (v35) | single/medium | 47,7 | 7 | 6 | 1 | 15 % | 1,9 | 30 % | 20 % | 13 % | 1 ("Don't drive") |
| vodka-red-bull (v35) | single/short | 30,0 | 4 | 3 | 1 | 28 % | 2,3 | 37 % | 14 % | 19 % | 1 ("Don't drive") |
| burger-fries (v35) | single/medium | 45,3 | 6 | 2 | 4 | 73 % | 1,5 | – | 19 % | 13 % | 0 |
| carbonara (v35) | single/long | 69,3 | 10 | 5 | 5 | 54 % | 1,4 | – | 16 % | 10 % | 0 |
| white vs red wine (v35) | compare/short | 24,5 | 4 | 3 | 1 | 35 % | 2,4 | 38 % | 13 % | 24 % | 0 |
| cappuccino (v30) | single/long | 66,1 | 10 | 1 | 9 | 93 % | 0,6 | – | 32 % | 11 % | 0 |
| black tea (v32) | single/short | 26,4 | 3 | 1 | 2 | 77 % | 1,5 | – | 15 % | 22 % | 0 |
| chicken-rice-broccoli (v30) | single/medium | 50,6 | 7 | 1 | 6 | 91 % | 1,0 | – | 28 % | 12 % | 0 |
| oatmeal (v30) | single/long | 71,4 | 11 | 3 | 8 | 77 % | 1,0 | – | 23 % | 10 % | 0 |
| grapes (v30) | single/short | 28,0 | 5 | 2 | 3 | 69 % | 2,1 | – | 14 % | 21 % | 0 |
| pretzel vs peanuts (v32) | compare/long | 62,0 | 12 | 7 | 5 | 53 % | 1,8 | – | 15 % | 11 % | 0 |
| lemonade vs pear (v30) | compare/medium | 49,9 | 8 | 4 | 4 | 51 % | 1,6 | – | 22 % | 12 % | 0 |

Zaključci:
- **Gustoća je 0,6–2,4 činjenice na 10 s.** Brojčane kartice često samo ponavljaju hook ("584 kcal, 61 g carbs." uz hook "584 kcal").
- **Generičko vrijeme kartica:** 54–93 % kod hrane, 15–35 % kod alkohola. Kod alkohola je ostatak pravni blok.
- **Bez kartice:** 13–32 % glavnog dijela je samo kamera i gauge. Uz intro i outro je 25–45 % videa bez nove kartice.
- **Savjeti:** 2 od 12 videa imaju ijedan, a u oba je to "Don't drive". Ostale kartice su opisne.
- **Iste rečenice u različitim videima:**
  - "Your stomach churns it into a paste." u 6 od 9 videa o hrani;
  - "The fiber reaches your large intestine." u 4;
  - "Most of the fiber is still in you." u 5;
  - "Your blood sugar climbs to its peak." u 5;
  - "Your kidneys filter the extra water." u 4.

### A1.9 Što se govori (iz koda, ne iz uzorka)
`video-narration.ts` (zaglavlje v20) kaže: "the voice now TELLS THE STORY. It reads the hook card, then every card of the story as it comes up … Spoken = on screen, word for word".

Pune se slotovi:
- `hook` / `card` / `climax` / `tease` / `day` / `payoff` / `answer` / `loop`;
- ubacivanja: `EXCL` ("Boom.", "There it is."), `TEASE_LEAD` ("Wait for it.", "Don't scroll yet."), `BEAT` ("Watch it happen.", "Look closely."…), `ORGAN_BEAT`;
- činjenice iz `video-facts.ts FACT_WORDINGS` kao filleri u pauzama (npr. `walk`, `dvKcal`, `liverRate`, `cafHalf`).

Ti filleri su **jedino mjesto** gdje video ima dodatne činjenice (dnevni %, hodanje, brzina jetre). Postoje samo u audiu i TikTok-stil titlovima, i samo kad je glas uključen, a QC uzorci ga nemaju.

## A2. Inventar mogućnosti: postoji, a video ne koristi

| Mogućnost | Gdje (datoteka · funkcija / polje) | Video danas | App danas |
|---|---|---|---|
| Per-nutrijent po 100 g: kcal, carbs, sugars, freeSugars, fiber, fat, satFat, protein, sodiumMg, caffeineMg, alcoholG, waterG, GI | `src/v4/food/fooddb.json` (249 stavki, polje `p`, `gi`, `fdc`), `food/parse.ts macros()` | 1–2 broja na FIRST BITE. satFat, sodium i freeSugars samo kao glasovni filler (`video-facts.ts FACT_WORDINGS.satFat/sodium/dvSodium`) | SmartSearch prikazuje kcal i brzinu šećera |
| Mikronutrijenti | **Ne postoje u DB-u.** Postoji samo `fdc` ID (USDA FoodData Central), pa bi se mogli dohvatiti offline u pipelineu | – | – |
| Krivulja glukoze | `science/foodSim.ts simulateFood → glucoseDeltaMgDl`, `glucosePeakMmol/Min`, `ranges.ts glucoseRangeTextIn` | mali gauge (`video-body.ts mainGauge`, 64 uzorka) i "Blood sugar up +x–y % over usual" | Readings sparkline (`AppV4.tsx Readings/Spark`), Compare graf s dvije krivulje (`Compare.tsx`) |
| Krivulja inzulina | `FoodSim.insulin`, `colaSim.ts insulinDelta` | samo rečenica "Insulin brings your blood sugar back down." | Readings "Insulin (above your baseline)" + sparkline |
| Per-item šećer u obroku (koja stavka diže koliko i kada; "blunt" od proteina i masti) | `FoodSim.meal.items: ItemGlucose {peakMmol, peakMin, blunt, slowFactor}`, `mealGlucose()`, `FOOD_MODEL.blunt` | jedna rečenica ("The burger's sugar hits first, then the fries.") | `Answers` "How does this meal work?" (`mealLinesFor`) |
| Dvofazni želudac (piće izlazi prije hrane) | `FoodSim.meal.phases`, `drinkStomachG/foodStomachG`, `mealPhases()` | ne | organ dialog "Drink still here / Food still here" (`foodProduct.ts organInfo`) |
| Tranzit po organima (želudac, tanko, 3 dijela kolona, izašlo) | `FoodSim.stomachG / intestineG / colonG[3] / exitedG`, `residueG` | čip "N g · In your stomach / large intestine" | `Passport.tsx` "The whole trip" (svako mjesto, koliko dugo), Where/Journey |
| Energija apsorbirana u vremenu | `FoodSim.kcalAbsorbed` | brojač "TAKEN UP SO FAR N of M kcal" (filler) | Readings "Energy from this …" bar |
| Masti u krvi (TG) | `FoodSim.tgDelta` | gauge "+0.3 mmol/L" | Readings (details) |
| Alkohol: BAC krivulja, Widmark po tijelu, fed/fasted, tip pića (ka, F), tempo (doses/overMin) | `foodSim.ts ALCOHOL_DRINKS`, `widmarkR()`, `alcoholGE()`, `Meal.pace`, `paceStarts()`; `alcoholClock.ts alcoholClock()`, `alcoholTier()`, `poisonRisk()`, `ELIM_RANGE` | BAC raspon + tier riječ, "gone 1–3 h". **Nema** "što ako uz obrok", "pivo naspram žestice istom brzinom" ni tempa "3 pića kroz 2 h" | MealBar "Over how long?" (pace), Answers "Can I drive?", "When is the alcohol gone?" |
| Kofein: krivulja, poluživot po profilu (pušač, kontracepcija, trudnoća), tmax | `espressoSim.ts simulateEspresso`, `caffeineHalfLifeH()`, `caffeine.ts caffeineHalfLife()` | "N mg caffeine still in your body", "half remains at bedtime" | Readings "Caffeine in blood mg/L" + sparkline |
| San: kašnjenje usnivanja od kofeina, rizik, alkohol i san | `science/daily.ts sleepRiskAt()`, `caffeineLatencyMin()`, `alcoholSleepTier()/alcoholSleepSentence()`, `sleepFraction()` | jedna generička kartica "Probably too little to affect most people's sleep." | Answers "Will I sleep well?", "When is the best time?" ("Before HH:MM…") |
| Hidracija prema klimi grada, klima uređaju, BSA | `science/hydration.ts simulateHydration()`, `src/v4/climate/climate.json`, `CityField.tsx` | samo "N ml urine made in the last 3 h" i ikona "Hydration · Fine all day" | Answers "Does it count as water?", status svjetlo vode |
| Puls i tlak | `FoodSim.hr / sbp`, `daily.ts buildVitals()`, `waterSim waterSbpDelta` | samo zvuk otkucaja kad je srce "pod stresom" (`PlanFx.heart`) i ikona "Heart · Normal all day" | Readings Pulse, Blood pressure, Oxygen, s "healthy person your size" (`healthyTwin`) |
| Aktivnost: hodanje za kcal po težini | `science/walking.ts walkingMinutes()/walkingKm()` | samo glasovni filler `walk` | Answers "How much energy is that?" |
| Dnevni udio (DV) | `video-facts.ts DV`, `dvKcal/dvFiber/dvProtein/dvSodium/dvSatFat` | samo glasovni filler | – |
| Personalizacija (spol, dob, visina, težina, pušenje, kontracepcija, trudnoća, svakodnevni kofein, uz obrok, vrijeme pijenja, spavanje, buđenje, koraci, vježbanje, grad) | `science/profile.ts Profile`, `personal.ts personalNotes()/activeFactors()/FACTORS` | uvijek "for a 70 kg man" (`video-body.ts DEFAULT_BAC_BODY`; `text-audit.ts AUDIT_PROFILE`) | YourBody, BodyStart, nudge "Personalize" |
| Dokazani savjeti | `content/tips.ts TIPS` (walk 10 min after eating, sugary drinks with a meal, caffeine cut-off, glass of water, alcohol: only time), `Answers.tsx nextStep()` | **ne** | Answers "What can I do?" |
| Zamjene ("better swap", provjereno modelom) | `analyze.ts SWAPS`, `Swap.tsx` | ne | SwapCard |
| Dugoročno (svaki dan: kolesterol, šećer, masnoća, san, "life") | `healthBars.ts healthBars()/RULES/ITEM_FX`, `content/longterm.ts LONG_TERM`, `EveryDay.tsx`, `HealthPanel.tsx` | ne | "If you have this every day" |
| Glad i dip šećera | `foodProduct.ts` chapter "The sugar dip", `Answers` "Will I get hungry again soon?" | samo ako je dip poglavlje | da |
| Razina dokaza i izvori po tvrdnji | `content/sources.ts`, `claims` na svakom poglavlju, `HowWeKnow.tsx`, `Levels` | ne (samo disclaimer i "Sources" u opisu posta, `video-caption.ts SOURCES_LINE`) | "How do we know?", "Why?" |
| Organske kartice s live brojevima | `food/foodProduct.ts` (organInfo: Stomach, Small intestine, Large intestine, Pancreas, Liver, Heart and blood, Brain, Kidneys and bladder) | ne | klik na organ |
| Čestice po tvari (kofein, glukoza, fruktoza) | `scene/Flow.tsx`, `scene/Particles.tsx`, `built.layers` | ne (video koristi Body + LiquidRoute) | Detailed prikaz |
| Varijante i builderi (pizza s dodacima, kava + šećer) | `parse.ts deriveFood/Builder/AddIn` | video samo imenuje | Choices |
| Surprise ratio ("N× more sugar than…"), decaf usporedba | `video-story.ts surpriseOf()`, `decafOf()` | uglavnom hook | – |

Što app pokazuje, a video ne: sparklineovi i raspon "healthy", inzulin, puls, tlak, kisik, kompletno putovanje (Passport), quick answers (12 pitanja), savjet, zamjena, dugoročni barovi, razine dokaza, personalni nudge.

## A3. Rendering: što već postoji, što je jeftino, a što skupo

### Što već postoji
- **3D:**
  - BodyParts3D tijelo (`scene/Body.tsx`, `anatomy.meshopt.glb` 501 kB) sa 24 imenovana organa (`video-cam.ts ORGAN_AT`, `ORGAN_BOX`);
  - glow / dim / hide po organu (`video-body.ts bodyGlowAt`, `spotlight`);
  - tekućina na stvarnoj ruti (`scene/LiquidRoute.tsx`) i prisutnost (`scene/presence.ts`);
  - paleta po fazi (`paletteAt`).
- **Kamera:**
  - zoomovi `wide | far | mid | close | body` (`video-cam.ts VIEW_H`);
  - opružni rig, sway, yaw arc, push-in (`tight`);
  - split screen s dva viewporta jednog renderera (`CompareVideo.tsx`, `splitPose`, `splitClosePose`);
  - stil po klasi priče (`camStyle`).
- **2D overlay (`share.ts`):**
  - kartica (title + text);
  - pinned gauge s **mini krivuljom dana i točkom "sad"** (`drawGauge`, `Gauge.curve`, `gaugeHeight`): jedan glavni gauge, prioritet alkohol > šećer > kofein > masti;
  - čipovi (`drawChip`), NEXT čip, sat (`drawClock`), traka dana s točkama stanica (`footer`);
  - TikTok titlovi riječ po riječ (`video-captions.ts`, `drawCaption`);
  - end card s redovima i svjetlima (`layoutBodyOutro`), split outro (`drawSplitOutro`), answer banner (`drawAnswer`), guess game (`drawSplitGame`).
- **FX (`video-fx.ts`):** vignette, splash, shockwave, glow pulse, rewind lines, speed lines, noć i izlazak sunca, sparks, bubbles, blood flow po krivulji žile (`drawBloodFlow`, `vesselLine`), breath, organ hit, punch zoom.
- **Audio (`video-audio.ts`):** pad, beat, whoosh, tick, riser, drop, heartbeat, duck pod glas, LUFS −14.
- **Telemetrija:** svaki nacrtani tekst se automatski logira (`share.ts text()` → `textLog` → `teleFrame`), pa novi overlay **automatski** prolazi provjeru preklopa i ostale QC provjere.

### Cijena dodavanja

| Dodatak | Cijena | Zašto |
|---|---|---|
| Veći live graf (glukoza, BAC, kofein, TG, inzulin) s referentnim linijama (US/EU limit, "usual 5.0", spavanje) | **jeftino** | `Gauge.curve` i `drawGauge` već crtaju krivulju s točkom. Treba novi layout (veći panel), oznake osi i druga krivulja. Podaci postoje (`curveOf`, 64 uzorka) |
| Dvije krivulje u usporedbi (A naspram B na istom grafu) | jeftino | Isti crtač; podaci su po strani (`ComparePlan.race`, gaugesAt po strani) |
| Scorecard / tablica (makro bar, DV %, hodanje, san, hidracija) | jeftino | Čisti canvas 2D; brojevi iz `factInOf` / `derivedFacts` / `quickAnswers`. End card već ima mehaniku redova (`layoutBodyOutro`) |
| Stacked bar "tko diže šećer" po stavci obroka | jeftino | `ItemGlucose[]` već postoji |
| "Ti naspram drugog tijela" (70 kg muškarac naspram 55 kg žene) kao drugi broj ili split | jeftino do srednje | Model je funkcija profila (`simulateFood(meal, p)`). Split screen već postoji (`CompareScene`), a usporedba istog jela s dva profila traži samo novi `comparePlan` ulaz |
| "Što ako" (uz obrok, tempo, manja porcija) | jeftino (podaci), srednje (planer) | `Meal.fed`, `Meal.pace`, `scaleMeal()` postoje |
| Timeline ribbon s ikonama događaja (vrh, dip, spavanje, nula) | jeftino | `footer` već crta stanice. Dodati ikone i oznake |
| Picture-in-picture (organ blizu + cijelo tijelo) | srednje | Dva viewporta već postoje u usporedbi; treba novi raspored |
| Highlight podorgana ili dijela organa (npr. duodenum naspram jejunum, žučni mjehur) | srednje | Organi su zasebni meshovi (24). Dublja podjela traži novi pipeline (`pipeline/compress-anatomy.mjs`) |
| 2D ilustrirani "insert" mehanizma (enzim, inzulin otvara stanicu, ADH u jetri) | srednje | Novi canvas crtač i assetovi (SVG/Path2D), bez 3D-a |
| Cell-level 3D zoom (resice, hepatocit, neuron) | **skupo** | Nema assetova ni shadera. BodyParts3D je makro anatomija; trebao bi novi model, prijelaz kamere i licence |
| Novi zvuk po segmentu | jeftino | `video-audio.ts arrangement`, cue tipovi (`CueKind`) |

Napomena o trošku rendera: 2D dodaci su zanemarivi. Render ide preko headless Chromiuma na GPU-u (`render-sample.mjs`; SwiftShader je odbijen jer je trošio memoriju), a skupo je samo ono što dodaje 3D geometriju ili drugi 3D prolaz.

## A4. Arhitektura: kako nastaje video i gdje se uključuje novi segment

### Tok (single)
1. **Model:** `analyze.ts analyze(parts, profile)` → `food/foodProduct.ts makeFoodProduct()` → `science/foodSim.ts simulateFood()`. Izlaz je `built` (krivulje, ruta, `story.chapters`: {min, title, focus, text, claims}). Poglavlja su fiksni popis s pragovima, npr. "Sleepy after eating" ako kcal ≥ 500, "Building blocks" ako protein ≥ 10, "Fat in your blood" ako fat ≥ 10, "Kidneys" ako water ≥ 100 (`foodProduct.ts` r. 244–351).
2. **Rečenice za karticu:** `video-beats.ts beatLines()` reže tekst poglavlja u beatove ≤ 8 riječi (`BEAT_WORDS`) i ništa novo ne tvrdi. `genericCard()` već prepoznaje generičke kartice.
3. **Stanice:**
   - `video-story.ts singleStops()` → `StopIn[] {min, title, text, lines, keep, must}`;
   - `applyHook()` ubacuje payoff hooka;
   - `byNutrient()` / `NUTRIENT_CARDS` daju zamjenske brojčane kartice.
4. **Hook:** `video-hook.ts hookFor()` / `hookB()`, `HOOK_POOL` po klasi; `seedOf(name)` rotira formule.
5. **Plan:** `video-story.ts singlePlan()` → `video-plan.ts planVideo()` (1247 redaka pravila: čitanje, `CARD_MAX_S`, `GLIDE_MAX_S`, `PEAK_BY_S`, region cap, `NEAR_STOP_MIN`, tease) → `withLullCards()` (TAKEN UP SO FAR / BLOOD ALCOHOL) → `placesOnScreen()`. Izlaz je `Plan {frames: VFrame[], cues, pages}`.
6. **Overlay po frameu:** `AppV4.tsx` sastavlja `Overlay` (gauges `gaugesAt()`, end card `endCardOf()` / `heroOf()` / `after24Of()`, život tijela `lifeOf`). Kamera dolazi iz `video-cam.ts camPlanOf()/shotOf()`, glow iz `video-body.ts`.
7. **Crtanje i enkodiranje:** `share.ts recordFrames()` → `drawBodyFrame()` / `drawSplitFrame()` → `encodeMp4()` (WebCodecs + mp4-muxer).
8. **Zvuk:**
   - `video-narration.ts narrationFor()` → `voice-tts.ts` (Kokoro);
   - `video-captions.ts captionTrack()`;
   - `video-audio.ts renderSoundtrack2()`.
9. **Usporedba:** `video-story.ts comparePlan()` → `planCompare()`, `video-guess.ts chooseGuess()`, `analyze.ts verdictOf()`.
10. **Postovi:** `video-caption.ts captionsFor()` (platforme, hashtagovi, `BANNED`).

### Provjere
- **Unit sweepovi preko cijelog DB-a:**
  - `video-story.test.ts` (svaka stavka, svi cutovi);
  - `video-retention.test.ts`, `video-narration.test.ts`, `video-variety.test.ts`;
  - `video-sameness.test.ts` (parovi iste klase ne smiju imati isti hook **i** iste kartice);
  - `video-arc.test.ts`.
- **Text audit:** `text-audit.ts runAudit()` → `auditSingles()` / `auditCompares()`, `lintText`, `lintTimeline`, `lintHookPayoff`, `trophyIssues` (svaka stavka × varijanta × cut + 300 parova).
- **Telemetrija:** `video-telemetry.ts checkTimeline / 4j / 4k / 4l` (region cap, end card, BAC limiti, sat, cardless ≤ 2 s, generic run ≤ 13 s `GENERIC_RUN_MAX_S`, sleepy proturječja), headless kroz `telemetry.testutil.ts`, i na renderu `scripts/qc-render.mjs`.

### Dijagnoza arhitekture
- Jedinica sadržaja je **kartica = rečenica iz poglavlja**. Sve ostalo (planer, narator, kamera, testovi) optimizira kada i koliko dugo je ta rečenica na ekranu.
- Nema tipa sadržaja "graf", "scorecard", "usporedba profila" ni "savjet". Zato je svaka nova ideja do sada završila kao još jedno pravilo u `planVideo` (faze 4a–4l) ili kao još jedan glasovni filler.
- Testovi uglavnom sprječavaju greške (proturječja, sigurnost, preklope, ponavljanja). Mjere gustoće informacija ne postoje, osim `GENERIC_RUN_MAX_S` i `video-sameness`.

### Predložene točke proširenja za novi "segment" (radi za svaku stavku × cut)
1. **Tip segmenta u `StopIn`:** npr. `kind?: 'card' | 'graph' | 'score' | 'versus' | 'tip' | 'mechanism'` i `data` (čisti podaci, bez teksta za crtanje). `planVideo` treba poštivati `minS/maxS` po tipu, umjesto `readSeconds(text)`.
2. **Generator segmenata (čiste funkcije):** `segmentsFor(built: BuiltLike & PeakIn, x: Analysis, profile, cut): StopIn[]` u novom modulu (npr. `video-segments.ts`), uz pravila dostupnosti po podacima (npr. graf šećera samo kad je `sugarClaimTrue(peak)`, per-item bar samo kad `built.meal.items.length ≥ 2`, savjet iz `TIPS` po stanju iz `status.ts`). Poziva se u `singleStops` / `comparePlan`, pa ga automatski dobivaju i app (`AppV4.tsx` r. ~936) i audit (`text-audit.ts auditSingle` r. 92).
3. **Overlay i crtač:** novo polje u `Overlay` / `VFrame` (npr. `seg?: {kind, data, a}`) i jedan `drawSegment(ctx, …)` u `share.ts`, pozvan iz `drawBodyFrame` / `drawSplitFrame`. Tekst ide kroz postojeći `text()`, pa telemetrija, provjera preklopa i `numberConflict` rade bez dodatnog rada.
4. **Narator:** novi `NarrId` (npr. `'seg'`) sa `SLOT_WORDS`. `lintNarration` već traži da broj koji se kaže bude broj na ekranu.
5. **Cue i zvuk:** po potrebi novi `CueKind` (npr. `'graph'`) za whoosh ili tick.
6. **Testovi:**
   - sweep `segmentsFor` preko svih stavki DB-a (nema NaN, broj = model, segment postoji gdje podaci kažu);
   - text audit lint za segmentske tekstove;
   - telemetrija: nova provjera **gustoće** (npr. ≥ N različitih brojčanih činjenica po 10 s, generic share ≤ X %, savjet ≥ 1 kod hrane);
   - `video-sameness` proširiti na tipove segmenata.

---

## A5. 10 najvećih razloga zašto je dosadno (s dokazima)

1. **Isti kostur za sve.**
   - Svih 12 videa: teaser 0,0–0,47 → rewind → hook → FIRST SIP/BITE (2,4–3,1 s) → IN YOUR STOMACH → PEAK → KIDNEYS → GONE / LARGE INTESTINE → NEXT MORNING / 24 HOURS LATER → AFTER 24 HOURS ikone → end card (A1.1).
   - Uzrok: fiksni popis poglavlja u `food/foodProduct.ts` r. 244–351 i jedan planer `video-plan.ts planVideo`.
2. **Generičke kartice na razini klase.**
   - Generic % kod hrane je 54–93 % (A1.8).
   - Primjeri: burger 6,4–10,8 s, carbonara 6,7–11,1 s, chicken 9,0–13,4 s: "Your stomach churns it into a paste."; cappuccino 17,3–34,2 s: tri generičke "CAFFEINE PEAK" kartice.
   - Uzrok: tekstovi poglavlja (`foodProduct.ts` r. 245, 349–351) i `video-beats.ts beatLines`.
3. **Niska gustoća, brojevi koji ponavljaju hook.**
   - 0,6–2,4 činjenice / 10 s.
   - Carbonara: hook "584 kcal", pa FIRST BITE "584 kcal, 61 g carbs." (3,1 s), pa tri puta "TAKEN UP SO FAR # of 584 kcal" (11,4 / 42,6 / 51,4 s), pa end card "All 584 kcal taken up".
4. **Fillerske stanke umjesto informacije.**
   - Lull kartica "TAKEN UP SO FAR" broji 1, 2, 3 … of 472 kcal (burger 11,1–13,5 s), uzrok `video-plan.ts withLullCards` / `LULL_TITLE`.
   - Glide bez kartice: 13–32 % glavnog dijela (cappuccino 21,4 s).
   - Statičan čip "54 mg caffeine" ~20 s (cappuccino 16,5–37,0 s).
5. **Pravni blok guta alkoholne videe.**
   - Svaki BAC ima 6–7 redaka ("Focus may dip / BAC … / for a 70 kg man / US limit 0.08 % / EU limit 0.05 % / Never safe to drive after drinking.") na 30 % (aperol), 37 % (vodka) i 38 % (vino, i to dvaput, po tijelu) trajanja.
   - Uzrok: `video-body.ts DRIVE_WARN`, `SHOWS_BAC`, telemetrija "BAC limits". Sigurnost se mora zadržati, ali ne mora biti 7 redaka svaki frame (vidi preporuku u planu).
6. **Glas ne dodaje informaciju.**
   - Naracija čita karticu od riječi do riječi (`video-narration.ts` zaglavlje v20), uz pool fraza ("Boom.", "Wait for it.", "Watch it happen.").
   - Jedine dodatne činjenice su filleri iz `video-facts.ts`, koji ne postoje kad je glas isključen. QC uzorci su bez glasa (`render-sample.mjs`).
7. **Nema vizualizacije podataka.**
   - Model ima ≥ 10 krivulja po minuti (glukoza, inzulin, BAC, kofein, TG, HR, SBP, voda u tijelu, mjehur, kcal, želudac, crijevo, kolon). Video pokazuje jedan mali gauge s mini krivuljom (`share.ts drawGauge`).
   - Usporedba (vino, 2,5–20,3 s) ne crta dvije krivulje, iako app to radi (`Compare.tsx`).
8. **Nema "što učiniti".**
   - 0 savjeta u 10 od 12 videa (A1.8). App ima "What can I do?" (`content/tips.ts`: walk 10 min after eating, sugary drink with a meal, caffeine before HH:MM), "When is the best time?" i zamjenu (`SWAPS`).
   - Kraj videa je CTA "Which food should we test next? 👇", ne korisna poruka.
9. **Bez uloga: uvijek isto tijelo, nema razlike, antiklimaks.**
   - "for a 70 kg man" na svakom BAC-u (`DEFAULT_BAC_BODY`).
   - Usporedba "white vs red" daje "Almost the same. 15 g vs 16 g" (13,9 s) uz dva identična tijela; zaglavlje `video-guess.ts` kaže da se izjednačeno pitanje ne postavlja.
   - Nema "ti naspram prijatelja", "natašte naspram uz obrok", "3 pića kroz 1 h naspram 3 h", iako model sve to računa (`Meal.fed`, `Meal.pace`, `Profile`).
10. **Hook i odgovor su predvidljivi ili prazni.**
    - Burger pita "When are those 20 g in your blood?", a odgovor je "The fat joins your blood later." (23,2–27,3 s, bez broja; broj je samo u čipu).
    - Carbonara pita "How far have 584 kcal gotten by tomorrow?", odgovor na end cardu "All 584 kcal taken up".
    - 24 h red ikona pokazuje samo nazive (Blood sugar / Heart / Hydration / Brain, aperol 42,6–44,3 s), "Blood sugar" i za koktel, a u Shortsu je prekinut (vodka 2 od 4).

Manje, ali vidljivo:
- neusklađena vremena ("1–3 h" naspram "about 2 h");
- "NEXT MORNING · Alcohol-free 5+ h. Don't drive." zvuči propovjednički kad je BAC nula;
- sastav obroka ili koktela se ne spominje (aperol + prosecco + soda; sastojci carbonare).

---

# DIO B: WEB / APP

## B1. Ekrani i tokovi (`app/src/v4/AppV4.tsx` i komponente)

| Ekran / tok | Datoteka | Što radi |
|---|---|---|
| Start ("What should we follow through your body?") | `AppV4.tsx` r. 1183–1199, `SmartSearch.tsx`, `START_TILES` | jedno pitanje, pretraga "type like you talk" (HR i EN aliasi), pločice, "Simulated for: man, 35 · 175 cm · 70 kg · Personalize" |
| Odabir varijante i dodataka | `Choices.tsx`, `parse.ts chooserOf/variantRow/Builder` | "Which tea?", "What's on it?", + Sugar |
| Obrok | `MealBar.tsx`, `food/meal.ts` (max 5, ½·1·2·3, `PRESETS`), pace "Over how long?" | da |
| Tijelo / profil | `BodyStart.tsx`, `YourBody.tsx`, `ui/ProfilePanel.tsx`, `CityField.tsx`, `NumberField.tsx` | predlošci tijela, točni brojevi, grad (klima) |
| Calm prikaz (zadani) | `CalmBar.tsx`, `StatusBar.tsx StatusLights` | 1 rečenica, sat, play, slider, 4 svjetla (energija, srce, voda, mozak) s objašnjenjem |
| Full (simple) | `StoryPanel.tsx`, `StatusStrips`, `nav.moments` | poglavlje, "what changes in you", health barovi po učestalosti, svjetla kroz 24 h, gumbi poglavlja |
| Detailed | `section.now`, `Where`, `Journey`, `Readings`, `TimelineBar`, `Flow` čestice | sat, headline (`headlines.ts`), "How do we know?", Where/Journey, Readings (Energy, Caffeine, Insulin, Pulse, BP, Glucose, SpO2 + sparkline i "healthy your size"), timeline s fazama i bedtime oznakom |
| Organ | `AppV4.tsx` r. 1171, `organInfo` u `foodProduct.ts`, `content/organs.ts` | dialog s live linijama |
| Quick answers | `Answers.tsx quickAnswers()` | 12 pitanja (šećer, san, vožnja, glad, energija i hodanje, best time, water, meal, pregnancy, dangerous, what can I do) |
| Putovanje | `Passport.tsx` | svako mjesto, koliko dugo, sada |
| Usporedba | `Compare.tsx`, `CompareBodies.tsx` | dva tijela, sugar krivulje na jednom grafu, svjetla, odgovori, popularni parovi |
| Svaki dan | `EveryDay.tsx`, `HealthPanel.tsx`, `healthBars.ts`, `content/longterm.ts` | smjer i veličina, ±50 %, kolesterol, dijabetes, težina |
| Zamjena | `Swap.tsx`, `analyze.ts SWAPS` | samo ako model potvrdi niži vrh |
| Browse | `Browse.tsx` | sve stavke grupirano |
| Share trenutka | `MomentShare.tsx`, `shareCard.ts` | 4:5 slika + link |
| Video | `VideoSteps.tsx` (Choose → Preview → Render), `VoicePick.tsx`, `VideoFallback.tsx` (in-app browseri bez WebCodecs) | MP4, .srt, cover, captions za platforme |
| Metoda / About / Support / Pro | `HowWeKnow.tsx`, `About`, `Support` (PayPal, crypto), `Pro.tsx` ("coming soon") | – |
| Tour | `Tour.tsx` | 3 balončića, jednom |
| Bez WebGL-a | `Body2D.tsx` | 2D tijelo s istim brojevima |
| Notice "still in research" | `AppV4.tsx` r. 532, 1258 | za stavke `catalog.ts` sa `status: 'research'` (12 od 16 kuriranih) |

## B2. Informacije po ekranu naspram onoga što model zna
- **Zadani prikaz je najsiromašniji:** calm prikaz ima jednu rečenicu (`captionOf(chapterText, 170)`) i 4 svjetla. Brojevi (sparklineovi, inzulin, puls, tlak, energija) su tek u "Detailed", a putovanje i odgovori iza dodatnih klikova. Novi korisnik vidi "app koji kaže jednu rečenicu", isto kao video.
- **Nedostaje svugdje (ni app ni video):**
  - mikronutrijenti;
  - per-item graf šećera u obroku (postoji samo tekst `mealLinesFor`);
  - "što ako" usporedba istog jela (uz obrok, natašte, pola porcije, sporije) kao jedan klik; pace postoji samo za alkohol i ponovljene porcije;
  - usporedba "ti naspram tipičnog" u jednom pogledu (`healthyTwin` se koristi samo za vitalne znakove).
- **"Zašto":** svako poglavlje ima `claims` i "Why?", ali calm prikaz nema vidljiv "zašto" uz rečenicu. Svjetla objašnjavaju sama sebe tek na tap (`CalmBar`).

## B3. Mobile, performance, bundle (izmjereno na `site/assets`, 2026-11-22 build)

| Chunk | raw | gzip | kada |
|---|---|---|---|
| `index-v4-*.js` (UI) | 517 kB | 184 kB | prvi download |
| `fooddb-*.js` | 431 kB | 79 kB | prvi (modulepreload) |
| `index-v4-*.css` | 104 kB | 20 kB | prvi (neblokirajući) |
| `climate-*.js` | 47 kB | 14 kB | – |
| `scene3d-*.js` (three, r3f, drei) | 1085 kB | 294 kB | odmah nakon prvog painta, ili odmah kod deep linka |
| `anatomy.meshopt-*.glb` | 501 kB | 382 kB (slabo se komprimira) | paralelno s 3D |
| `video-audio`, `share`, `video-kit`, `mp4-muxer`, `video-caption`, `video-beats` | ~333 kB | ~110 kB | lazy, na Share |

- **Ukupno do prve hrane u 3D-u: ~960 kB gzip.** Shell se pojavi brzo (inline CSS, `boot` animacija), ali UI je jedan chunk od 184 kB gz.
- **DB od 249 stavki** je cijeli u prvom downloadu (79 kB gz). Za per-food stranice bi se mogao dijeliti.
- **Mobile:** `mobile.css` (525 redaka, 33 media queryja), `scripts/check-mobile-layout.mjs` mjeri udio canvasa na 360/390/430 px. To je dobra osnova, ali gestu, landscape i jednoručno korištenje treba provjeriti uživo.
- **Rizici:**
  - 3D je obavezan za "wow". Na slabim mobitelima 3D chunk + glb (~676 kB gz) je glavno čekanje;
  - video izvoz traži WebCodecs, pa in-app browseri (Instagram, TikTok, odakle dolazi promet iz videa) ne mogu napraviti video (`share.ts isInAppBrowser`, `VideoFallback.tsx`).

## B4. SEO i stranice po hrani
- **Jedan URL.**
  - `site/index.html` je SPA;
  - `_redirects` šalje `/* → /index.html 200`;
  - stanje je u **hashu** (`deeplink.ts`: `#q=`, `#m=`, `#vs=`, `#t=`, `&v=`, `&s=`, `&add=`, `&on=`, `&over=`), koji tražilice ne indeksiraju.
- `site-meta.mjs writeHostFiles` piše sitemap sa **samo `/`** (i to samo uz `SITE_URL`). `robots.txt` trenutno nema Sitemap liniju jer `SITE_URL` nije postavljen.
- Ne postoje:
  - dinamički `document.title` i meta opis po hrani (grep: nema `document.title`);
  - JSON-LD (0 `ld+json`);
  - og:image po hrani (jedan statični `og.png`);
  - prerenderani sadržaj (`<noscript>` kaže samo "needs JavaScript").
- **Prilika:** 249 stavki (+ varijante, + popularni parovi usporedbe) kao statične stranice `/food/<id>` i `/compare/<a>-vs-<b>`, generirane u `make-site-split.mjs` iz istog modela. Na stranici: ključni brojevi, krivulja kao SVG, quick answers, FAQ, JSON-LD (FAQPage / NutritionInformation), og slika iz `shareCard.ts` / `composeCover`. Stranica zatim pokreće app s `#q=<id>`.
- Jezik je samo engleski (`lang="en"`), iako pretraga prihvaća hrvatske aliase. Hrvatske ili druge stranice nisu napravljene.

## B5. Pristupačnost
Dobro:
- `aria-label` i `role` na svim dialozima i grupama, `useModal` (fokus, Esc);
- live regija za stanje tijela (`#stage-now`, sr);
- "Skip to the search";
- `prefers-reduced-motion` (boot i autoplay: `setPlaying(!prefersReducedMotion())`);
- slider s `aria-valuetext`;
- 2D fallback;
- video FX limitira bljeskove (`MAX_FLASHES_PER_S = 3`).

Rizici:
- **25 CSS pravila s fontom 10–11,5 px** (`*.css`) i 24 pravila s 12,5 px: sitno za mobitel i slabovidne;
- sparklineovi i graf usporedbe vjerojatno nemaju tekstualnu alternativu. Treba provjeriti `Spark` (SVG) i `Compare.tsx` graf; nije provjereno uživo;
- 3D tijelo nema opis organa za čitače osim live rečenice;
- kontrast (#7a899d / #8292a7 na #04070c za sitni tekst) treba izmjeriti, nije mjereno.

## B6. Prazna i dosadna stanja, slijepe ulice, nedostaje "zašto"
- Calm prikaz nakon odabira: jedna rečenica koja se mijenja s poglavljima, svjetla većinom zelena ("Nothing flagged all day", "Fine all day" u istim podacima kao end cardovi). Za većinu hrane nema napetosti.
- "X is still in research" notice za 12 kuriranih `catalog.ts` stavki je slijepa ulica bez prijedloga alternative. Notice nudi samo zatvaranje; nije provjereno uživo.
- `Pro · coming soon` u zaglavlju je obećanje bez sadržaja.
- Usporedba izjednačenih parova (kao u videu "Almost the same") nema "zato što…" objašnjenje razlike na razini sastava.
- Kraj 24 h u appu: ništa ne predlaže sljedeći korak (sljedeća hrana, zamjena, "probaj uz obrok"), osim ako korisnik sam otvori odgovore.
- "Zašto" (claims) postoji, ali je skriven iza malih linkova ("How do we know?", "Why?").

## B7. Što bi spriječilo povratak
- **Nema memorije:**
  - u `localStorage` se spremaju samo `i24-profile`, `i24-personalized`, `i24-start-v2`, `i24-handle`, `i24-voice*` i tour;
  - `habits` je samo state (`AppV4.tsx` r. 316, `useState<Habits>({})`), ne sprema se;
  - nema povijesti pretraga, favorita, dnevnika dana ("danas sam pojeo…"), streaka ni "tvoj tjedan".
- **Nema razloga za povratak:** nema dnevnog izazova ni nove hrane tjedna, nema obavijesti (nema service workera ni manifesta, pa ni PWA instalacije).
- **Jedan prolaz je dovoljan:** kad se vidi jedna hrana, druga izgleda isto (isti kostur kao video).
- **Dijeljenje** vodi na hash link koji u in-app browseru ne može napraviti video.

## B8. Mapa točaka proširenja za nove site featuree
| Feature | Gdje se uključuje |
|---|---|
| Novi podatak za ekran (za svaku hranu) | `analyze.ts analyze()`: jedno mjesto za "hrana + osoba + grad → sve". Dodati polje i koristiti ga u UI-u i videu |
| Novo quick-answer pitanje | `Answers.tsx quickAnswers()` (vraća `Answer[]`), testovi `answers.test.ts`, `answersPersonal.test.ts` |
| Novi savjet | `content/tips.ts TIPS` + `Answers.nextStep()` |
| Novi panel ili drawer | `AppV4.tsx setPanel('<key>')` + `Drawer.tsx`; lazy chunk kroz `lazyUi.tsx` (`prefetchUi`) |
| Novi parametar linka (deep link) | `deeplink.ts Link`, `readLink()`/`writeLink()`, test `deeplink.test.ts`; `vite.site.config.ts DEEP_LINK` regex (preload 3D) |
| Novi graf | `AppV4.tsx Spark` / `Readings`, `Compare.tsx` graf |
| Stanje svjetala | `status.ts bodyStatus()`, `StatusBar.tsx` |
| Stranice po hrani i usporedbi (SEO) | `scripts/make-site-split.mjs` (nakon kopiranja: generirati `/food/<id>/index.html` iz `FOODS` + `analyze`), `scripts/site-meta.mjs writeHostFiles()` (sitemap sa svim URL-ovima, CSP hash za nove inline skripte), `scripts/check-site.mjs` (proširiti `roots` na nove HTML-ove), `_redirects` (iznimke prije `/*`) |
| Per-food og slika | `shareCard.ts` / `share.ts composeCover()` (canvas). Za build bi trebao node canvas ili headless render, kao `render-sample.mjs` |
| Memorija i dnevnik | novi ključ u `localStorage` (uzorak `PROFILE_KEY`, `AppV4.tsx` r. 282–314); `healthBars.ts Counts/Habits` već modeliraju "koliko puta danas" |
| Mobile regresija | `scripts/check-mobile-layout.mjs` (dodati nove ekrane i `--food`) |
| Bundle kontrola | `vite.site.config.ts manualChunks` + `SITE_REPORT=1` size report |

---

## Ograničenja ovog audita
- Naracija nije izmjerena iz uzoraka (nisu spremljeni, a QC render je bez glasa), nego izvedena iz koda.
- Pristupačnost, kontrast i mobile UX nisu provjereni uživo (nema pokrenutog servera ni screenshotova); navedeno je ono što se vidi iz koda i CSS-a.
- Stariji uzorci (v30 i v32) su prije faza 4k i 4l, pa neki brojevi danas mogu biti drugačiji. Kostur i generičke kartice su isti i u v35.
- Pomoćne skripte za mjerenje su u scratchpadu ove sesije (`seg2.py`, `ana.py`, `dens.py`, `shots.py`), ne u repou.
