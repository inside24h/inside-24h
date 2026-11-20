# Kritika: v31 uzorci, nikad testirane namirnice (2026-11-17)

Autor: critic agent (Opus), read-only. Ništa nije renderirano, kod nije diran, ništa nije commitano.

**Uzorci:** `C:\claudework\video-samples\2026-11-17-v31\`
- black-tea-shorts (25,7 s)
- donut-shorts (26,7 s)
- prosecco-reels-medium (48,5 s)
- rice-salmon-avocado-cucumber-reels-medium (48,4 s)
- oatmeal-tiktok-long (71,4 s)
- compare-pretzel-vs-peanuts-tiktok-long (62,6 s)

**Metoda:** glavni izvor teksta je `*.timeline.json`. Tekstovi su sažeti u raspone vremena, uz pozicije kutija, kadar (`shot`), `lit` i sat. Zatim je sve provjereno vizualno: contact sheetovi i 37 frameova u `critic-frames\`. Pojedinačni frameovi su `<video>-<s>.jpg`, a trake po videu `strip-<video>.jpg`.

**SRT/naracija:** nisu u mapi. TTS fraziranje zato nije provjereno riječ po riječ.

**Glavni zaključak o generalizaciji:**
- Tehnika, audio, alkoholna pravila i end card (sada ≥ 2,5 s) drže se na novim namirnicama.
- Ne drže se tri stvari:
  - **logika brojeva između čipa i end carda** (čaj: urin);
  - **poštenost compare pitanja** (perec vs kikiriki, kcal po porciji);
  - **imenovanje obroka** ("One meal").
- Retenciju sustavno ruše isti predlošci:
  - prvih 7–13 s sat stoji;
  - "FIRST SIP" kartica ponavlja naslov;
  - "Your kidneys filter the extra water." ide u gotovo svakom videu;
  - glide dionice bez ijedne kartice.

## Tehnika i audio (ffmpeg)
- QC: svih 6 PASS. Format 1080×1920, 30 fps CFR, A/V drift ≤ 2 ms, bez crnih i zamrznutih frameova.
- Glasnoća: −14,2 do −14,3 LUFS, LRA 2,7–3,6 LU, true peak ≤ −1 dBTP.
- Govorni pojas (250–3500 Hz, `silencedetect −38 dB / 0,7 s`): **0 rupa u svih 6**.
- **Audio: PASS za svih 6.** Ograda: miks je jedna staza, pa glas i glazbu ne mogu odvojiti.

## Ocjena po kriterijima

Kriteriji:
1. hook ≤ 1,5 s, specifičan i odgovoren
2. znanost, procjene označene, alkohol (oba limita + upozorenje uz svaki BAC)
3. imenovani organ vidljiv i istaknut
4. titlovi (čitljivost, safe zone, tipfeleri, US English)
5. tempo (regija ≤ 12 s long / 9 s Reels / 6 s Shorts, bez mrtvih dionica)
6. audio
7. end card ≥ 2,5 s, bez preklopa
8. compare (porcije, fer presuda)
9. obrok od više dijelova imenovan i prikazan

| Video | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| black-tea-shorts | PASS (minor) | **FAIL** | PASS | PASS | **FAIL** | PASS | PASS (2,6 s) | – | – |
| donut-shorts | PASS (minor) | PASS (minor) | PASS | PASS (minor) | **FAIL** | PASS | PASS (2,6 s) | – | – |
| prosecco-reels-medium | PASS (minor) | PASS (minor) | PASS | PASS (minor) | **FAIL** | PASS | PASS (2,6 s) | – | – |
| rice-salmon-…-reels-medium | **FAIL** | PASS (minor) | PASS (minor) | PASS (minor) | **FAIL** | PASS | PASS (2,6 s) | – | **FAIL** |
| oatmeal-tiktok-long | PASS | PASS (minor) | PASS | PASS (minor) | **FAIL** | PASS | PASS (3,2 s) | – | – |
| compare-pretzel-vs-peanuts | PASS (minor) | **FAIL** | PASS (minor) | PASS (minor) | **FAIL** | PASS | PASS (3,2 s) | **FAIL** | – |

### black-tea-shorts (25,7 s)
1. **Hook (PASS, minor):**
   - "Where does the water end up? / 250 ml of black tea." stoji od 0,0 s, uz cold open "46 mg caffeine still in your body / PEAK".
   - Odgovor: "KIDNEYS / Your kidneys filter the extra water." (16,1–20,6 s, +2:00), a na end cardu "Peak: 150 ml urine · 2 h in".
   - Minor: hook o vodi je generički predložak (`video-hook.ts` r. 44, `water`) iako je priča čaja kofein. Teaser, kartica "CAFFEINE PEAK" i hero end carda ("3 mg of caffeine left") svi govore o kofeinu. Pitanje i glavni junak se razilaze.
2. **Znanost (FAIL):**
   - **Kontradikcija s urinom.** Čip "Urine made in the last 3 h" raste 150 → 186 ml od +2:00 do +2:39 (16,1–20,3 s) i 203 ml na +3:06 (20,7 s; `critic-frames\black-tea-shorts-18.0.jpg` pokazuje 168 ml). End card (22,5–25,4 s) tvrdi "**Peak: 150 ml urine · 2 h in**". "Vrh" je zapravo vrijednost u trenutku kartice bubrega, a ne maksimum.
   - Čip ne kaže je li to urin od čaja ili ukupni. 203 ml od 250 ml čaja u 3 h je previsoko da bi bio samo čaj. Prosecco iz iste serije pokazuje samo 82 ml.
   - Kofein 50 mg / 250 ml, vrh 46 mg na +0:44 i 3 mg nakon 24 h su uvjerljivi.
3. **Organ (PASS):** želudac (2,4–7,6 s), mozak (11,2–15,4 s) i bubrezi (16,1–20,6 s) svijetle uz svoje kartice.
4. **Titlovi (PASS):** bez tipfelera, kartice do y ≈ 1316 (68 %). Čip kofeina doseže x ≈ 982, ali u gornjoj polovici (y 573–846), iznad desne trake gumba.
5. **Tempo (FAIL):**
   - Sat stoji +0:00 → +0:03 od 1,0 do 8,4 s (**7,4 s** od 25,7 s).
   - Kartica "FIRST SIP / 250 ml of black tea." (5,0–7,8 s) doslovno ponavlja drugi red naslova.
   - Red ikona "AFTER 24 HOURS" bljesne samo "Blood sugar" (21,9–22,2 s). Ikona šećera za nezaslađeni čaj je nebitna.
   - QC cap PASS (5,2 s).
6. **Audio (PASS).**
7. **End card (PASS):** 22,67–25,23 s ≈ **2,6 s**, bez preklopa. Margina je samo 0,1 s.

### donut-shorts (26,7 s)
1. **Hook (PASS, minor):**
   - "1 doughnut: 5 teaspoons of sugar. / See what 18 g of sugar do." od 0,0 s.
   - Odgovor: "BLOOD SUGAR PEAK" (9,5–14,1 s) i end card "Blood sugar: back to usual / Peak … 1 h in".
   - Minor: "18 g of sugar **do**". US uzus za masu je "does". Varijanta je iz poola `sugarGo` (`video-hook.ts` r. 50).
2. **Znanost (PASS, minor):**
   - 85 g i 18 g šećera su uvjerljivi za glazirani doughnut.
   - Minor: "about 5 teaspoons": 18 / 4,2 ≈ 4,3, dakle "about 4" (isti obrazac kao "7 tsp" u 11-19).
   - Minor: kcal (~340) i masti (~19 g) nigdje se ne navode, iako je druga polovica videa "FAT IN YOUR BLOOD".
   - Minor: "+0.2 mmol/L triglycerides" je jedinica koju US publika ne koristi (mg/dL).
3. **Organ (PASS):** gušterača žuto svijetli uz gauge šećera (`donut-shorts-11.0.jpg`), a srce i krvne žile uz "Blood fat up". Napomena: `lit` u timelineu je prazan za te holdove (9,47–13,93 i 17,53–21,63 s), iako se vizualno vidi isticanje. Telemetrija ne bilježi gauge-highlight, pa QC organ ne može provjeriti.
4. **Titlovi (PASS, minor):** "do" (vidi 1).
5. **Tempo (FAIL):**
   - Mrtva dionica **13,9–17,5 s** (+1:14 → +3:30): glide preko tijela bez kartice, samo čip (`donut-shorts-15.5.jpg`). Za Shorts je to 3,6 s ničega.
   - Sat stoji +0:00 → +0:03 od 1,0 do 6,1 s.
   - Red ikona: "Blood sugar" 22,8–23,2 s (0,4 s, presječen).
6. **Audio (PASS).**
7. **End card (PASS):** 23,63–26,2 s ≈ **2,6 s**.

### prosecco-reels-medium (48,5 s)
1. **Hook (PASS, minor):**
   - "How does your body clear it? / 150 ml of sparkling wine." od 0,0 s.
   - Odgovor: "ALCOHOL GONE / Your liver breaks down almost all of it." (33,0–37,6 s, jetra svijetli).
   - Minor: prvi red je generički ("it"). **"Prosecco" se nigdje ne spominje**, iako je to traženi artikl i prepoznatljiv pojam.
2. **Znanost i alkohol (PASS, minor):**
   - Svaki BAC (teaser 0–0,4 s; gauge na mozgu 19,5–26,9 s; čip 27,0–27,2 s; end card 45,4–48,2 s) ima "for a 70 kg man", **US 0.08 %, EU 0.05 %** i "Never safe to drive after drinking." QC: 331 frame, svi ispravni.
   - Vrh 0,011–0,028 % je točan za ~13 g alkohola (150 ml × 11 %) i 70 kg (Widmark ≈ 0,027 %).
   - Minor: ABV i grami alkohola se nigdje ne navode.
   - Minor: naslov "ALCOHOL GONE" stoji već na +2:19 (33,0 s), dok je zadnji BAC (+2:00) još 0,003–0,008 %, a sljedeća kartica kaže "gone after about 1–4 h".
   - Minor: vrh 0,027 % u gaugeu i 0,028 % na end cardu.
3. **Organ (PASS):** mozak svijetli uz "ALCOHOL PEAK" (`prosecco-reels-medium-23.0.jpg`), a zatim bubrezi i jetra. Minor: od 37,7 do 41,5 s jetra je u kadru, ali bez isticanja.
4. **Titlovi (PASS, minor):**
   - BAC čip na 27,0–27,2 s bljesne 0,2 s dolje lijevo, prekratko da se pročita.
   - End card prelama "EU limit / 0.05 %", pa broj ostaje sam u redu.
5. **Tempo (FAIL):**
   - Sat stoji +0:00 → +0:03 od 1,0 do **13,9 s** (13 s od 48 s).
   - U tom dijelu idu: "FIRST SIP / 150 ml of sparkling wine." (ponavlja naslov) i glide bez kartice 5,9–8,4 s.
   - Jetra 32,9–41,5 s (8,6 s, tik ispod limita 9 s).
   - Red ikona 43,5–45,1 s.
6. **Audio (PASS).**
7. **End card (PASS):** 45,5–48,07 s ≈ **2,6 s**.

### rice-salmon-avocado-cucumber-reels-medium (48,4 s)
1. **Hook (FAIL):**
   - "How far have 844 kcal gotten by tomorrow? / **One meal: 844 kcal.**" Nijedna namirnica nije imenovana u prvih 1,5 s (ni u prvih 45 s).
   - Pitanje je odgovoreno ("All 844 kcal taken up by your body", end card), pa sama logika prolazi. Specifičnost ne prolazi.
2. **Znanost (PASS, minor):**
   - 773 g i 844 kcal su uvjerljivi.
   - Minor: vrh šećera "1 h 45 min in" je kasan za bijelu rižu, čak i uz mast i protein (tipično 45–90 min).
   - Minor: 11 g vlakana je na gornjoj granici (avokado ~7 g + riža + krastavac ≈ 9 g).
   - Minor: "Many people feel sleepy after a big meal." (7,1–12,1 s) je općenita tvrdnja koja ne dolazi iz modela.
   - Minor: "Your kidneys filter the extra water." (27,1–31,6 s) slabo pristaje krutom obroku.
3. **Organ (PASS, minor):** gušterača svijetli uz šećer, bubrezi i debelo crijevo kad su na redu. Uz "SLEEPY AFTER EATING" mozak je u kadru, ali samo u osnovnoj plavoj boji (`rice-…-9.0.jpg`).
4. **Titlovi (PASS, minor):**
   - Naslov "SUGAR RISES" se pojavljuje dvaput (13,0 i 21,2 s), a NEXT "+1:47 · Sugar rises" (20,4 s) najavljuje nešto što je već prikazano.
   - Na +1:47 čip pokazuje da šećer već pada.
   - "Blood fat up" čip skače lijevo-desno-lijevo između 32,2 i 33,1 s.
5. **Tempo (FAIL):**
   - Mrtva glide dionica 17,6–21,1 s bez kartice.
   - Isti naslov ponovljen (vidi 4).
   - "3 % has left your body" na end cardu je nejasno (od čega?).
6. **Audio (PASS).**
7. **End card (PASS):** 45,33–47,9 s ≈ **2,6 s**.
9. **Više dijelova (FAIL):**
   - Ime "White rice + Salmon + Avocado + Cucumber" vidi se **tek na end cardu (45,2 s)**.
   - Do tada naslov kaže "One meal", a dijelovi se spominju samo usput ("comes from the rice", "The salmon's fat…").
   - Avokado i krastavac se ne spominju ni u jednoj kartici.

### oatmeal-tiktok-long (71,4 s)
1. **Hook (PASS):** "1 bowl of oatmeal: 166 kcal. / How much of 166 kcal is left tomorrow?" od 0,0 s. Odgovor "All 166 kcal taken up by your body" je na end cardu.
2. **Znanost (PASS, minor):**
   - 234 g, 166 kcal i 3,8 g vlakana odgovaraju USDA vrijednostima.
   - Vrh +20–44 % na 45 min i "Mouth to toilet usually takes 14–58 hours" su uvjerljivi i označeni kao raspon.
   - Minor: "5 % has left your body" stoji uz "All 166 kcal taken up", pa gledatelj ne zna 5 % čega.
   - Minor: "Your kidneys filter the extra water." (28,4–33,0 s) je generički.
3. **Organ (PASS):** želudac, tanko crijevo, gušterača (vizualno), bubrezi i debelo crijevo svijetle uz svoje kartice.
4. **Titlovi (PASS, minor):**
   - "INTO THE SMALL INTESTINE / In the small intestine it is taken apart." je redundantno i neinformativno.
   - End card "Still in you: 3.8 g fiber · In your large intestine · 5 % has left your / body" u 3 retka.
5. **Tempo (FAIL):**
   - Sat stoji +0:00 → +0:05 od 1,0 do 11,1 s (**10 s**).
   - Glide bez kartice **44,3–47,9 s** (`oatmeal-tiktok-long-45.5.jpg`) i **53,2–56,8 s** (`-55.0.jpg`).
   - Debelo crijevo dominira 39,6–65,2 s (~25 s), a QC to ne vidi jer glide "resetira" percipirani boravak.
   - Broj "3.8 g fiber" se ne mijenja od 47,9 do 67,5 s (20 s).
6. **Audio (PASS).**
7. **End card (PASS):** 67,77–70,93 s ≈ **3,2 s**.

### compare-pretzel-vs-peanuts-tiktok-long (62,6 s)
1. **Hook (PASS, minor):**
   - "Guess: which has more calories?" uz oznake "Soft pretzel vs Peanuts / 115 g · 28 g" od 0,0 s.
   - Odgovor "More calories: Soft pretzel. 389 kcal vs 167 kcal." (36,4–41,5 s) i na end cardu.
   - Minor: pitanje je generičko i, uz ovako različite porcije, unaprijed riješeno (vidi 8).
2. **Znanost (FAIL):**
   - **Kontradikcija o šećeru kikirikija:**
     - "BOTH · INTO THE SMALL INTESTINE / Starch and sugar turn into blood sugar." (28,6–32,9 s);
     - čip kikirikija "0.5 g sugar / In your blood" (42,2–42,6 s);
     - end card kikirikija: "**Blood sugar: not tracked here**" (58,8–62,3 s; `compare-…-60.5.jpg`).
   - Za kikiriki (≈ 4 g ugljikohidrata) "Starch and sugar turn into blood sugar" je pogrešan naglasak.
   - **"24 HOURS LATER / The food is mostly in your large intestine."** (perec, 47,6–52,5 s) nije točno. Nakon 24 h je apsorbirana većina perca, a u debelom crijevu je samo ostatak (vlakna 1,9 g).
   - Brojke porcija su točne (USDA): perec 115 g / 389 kcal, kikiriki 28 g / 167 kcal.
   - Priča kikirikija je potpuno "šećerna" ("FIRST BITE / 1 g of natural sugar."). Mast (~14 g) i protein (~7 g) se ne navode, iako je pitanje o kalorijama.
3. **Organ (PASS, minor):** želuci, tanka i debela crijeva svijetle. Cijeli video je široki split bez bliskog plana. Od 3,0 do 13,6 s nijedan organ ne svijetli (`compare-…-5.0.jpg`, `-9.0.jpg`).
4. **Titlovi (PASS, minor):**
   - Kartica "FIRST BITE / **Soft pretzel.**" (8,0–10,7 s) je goli fragment, isti obrazac kao "Rakija." iz 11-19 (M1).
   - "Blood sugar: not tracked here" je interni jezik.
5. **Tempo (FAIL):**
   - Sat +0:00 → +0:06 od 1,0 do 13,6 s, kroz tri statične "first bite" kartice preko dva cijela tijela.
   - Glide bez kartice 32,8–36,4 s.
   - "small" 10,7 s (QC PASS ≤ 12 s).
6. **Audio (PASS).**
7. **End card (PASS):** 58,97–62,13 s ≈ **3,2 s**, bez preklopa.
8. **Compare (FAIL):**
   - Porcije su navedene ("A typical serving each: 115 g vs 28 g.", 3,0–7,9 s) i stoje ispod imena.
   - **Presuda "Peanuts: 222 fewer kcal." je nefer:** po gramu kikiriki ima ~585 kcal/100 g, a perec ~338 kcal/100 g. Pitanje "which has more calories?" uz porcije 4:1 unaprijed daje odgovor i sugerira da je kikiriki "lakši".
   - End card ne ponavlja porcije (gramaže fale u stupcima).
   - Za kikiriki ide "All lights green / Nothing flagged all day", a za perec se sol (~900+ mg natrija) ne spominje.

---

## Defekti po težini (vjerojatni uzrok u generatoru)

### Blocker
- Nema. Alkoholna pravila (oba limita, upozorenje, ništa ne sugerira da je vožnja sigurna) drže na svakom BAC frameu u proseccu. End card je ≥ 2,5 s u svih 6.

### Major
- **M1. Compare kcal pitanje i presuda po porciji, ne po gramu** (perec vs kikiriki: "Peanuts: 222 fewer kcal." 56,7–62,3 s; "More calories: Soft pretzel." 36,4 s).
  - Uzrok:
    - `v4/video-guess.ts` r. 173, `ask('kcal', …)`, je zadnji fallback **bez** `fair()` provjere koju ima pitanje o šećeru (r. 172).
    - `v4/analyze.ts` r. 133 (`why.push('… fewer kcal')`) daje kcal razlog bez `holdsPerGram`. Taj filter postoji samo u `trophyReasons` (r. 171).
  - Prijedlog: kad je omjer porcija > 1,3, pitati "per 100 g" ili "per serving", ili izabrati drugo pitanje. Na end card dodati gramaže.
- **M2. Kontradikcija čip ↔ end card, urin u čaju:** "Peak: 150 ml urine · 2 h in", a čip pokazuje 186–203 ml (20,3–20,7 s).
  - Uzrok: `v4/video-story.ts` r. 218–221 (`cls === 'water'`) uzima `whereGauge(b, kid.min)`, tj. vrijednost u minuti kartice bubrega, i lijepi joj "Peak". Treba uzeti stvarni maksimum serije ili ukloniti riječ "Peak".
  - Uz to treba razjasniti je li "Urine made in the last 3 h" višak od pića ili ukupni urin.
- **M3. Kontradikcija o šećeru kikirikija:** "BOTH · … Starch and sugar turn into blood sugar." (28,6 s) i čip "0.5 g sugar in your blood" (42,2 s), a end card "Blood sugar: not tracked here".
  - Uzrok:
    - spajanje u "Both" u `v4/share.ts` (~r. 1797–1803) i `video-plan.ts` bez provjere vrijedi li tvrdnja za obje strane (isto kao M3 iz 11-19);
    - `v4/video-body.ts` r. 298, `plainSugar(null)` → 'not tracked here'. Kikiriki ima `sugarPeak = null`, a model ipak crta čip šećera.
- **M4. Višedijelni obrok bez imena** ("One meal: 844 kcal.", 0–45 s; ime tek na end cardu).
  - Uzrok: `v4/video-hook.ts` r. 248. Kad `sized` i `named(...)` ne stanu u 9 riječi, pada na `One meal: ${k} kcal.`.
  - Prijedlog: skraćeno ime ("Salmon rice bowl" ili "Rice + salmon + 2 more") umjesto generičkog "One meal". Avokado i krastavac nemaju nijednu karticu.
- **M5. Mrtvo otvaranje u svim videima (retencija):**
  - sat stoji 7–13 s: prosecco 1,0–13,9 s, compare 1,0–13,6 s, oatmeal 1,0–11,1 s, čaj 1,0–8,4 s;
  - "FIRST SIP/BITE" kartica ponavlja naslov ("250 ml of black tea.", "150 ml of sparkling wine.", "Soft pretzel.").
  - QC "clock moves after ≤ 2,7 s" prolazi jer se sat pomakne za 1 min.
  - Uzrok:
    - raspored prvih beatova u `v4/video-plan.ts` (prvi chapter `min 0–5` dobiva 2–3 beata);
    - kartica prvog gutljaja u `v4/video-hook.ts` (`lead`) kad nema broja.
  - Prijedlog na razini sustava:
    - QC pravilo "sat mora doći do ≥ +0:20 do 6 s";
    - zabrana da lead kartica ponavlja red naslova;
    - prvi beat neka bude najzanimljiviji broj (kofein 50 mg, 13 g alkohola, 14 g masti u kikirikiju).
- **M6. Glide dionice bez kartice (mrtve 3–4 s):** donut 13,9–17,5 s; oatmeal 44,3–47,9 i 53,2–56,8 s; compare 32,8–36,4 s; prosecco 5,9–8,4 s; rice 17,6–21,1 s.
  - Uzrok: `v4/video-plan.ts` / kamera (`video-cam`) dodjeljuje glide beat preskoku sata bez narativne kartice. `region cap` u `video-telemetry.ts` glide računa kao reset.
  - Prijedlog: QC pravilo "≤ 2 s bez kartice ili promjene broja", a za preskoke sata kartica "+9 h: …".
- **M7. Netočna tvrdnja za perec:** "The food is mostly in your large intestine." (47,6–52,5 s).
  - Uzrok: odabir rečenice za "24 hours later" u `v4/video-body.ts` (~r. 235, round 18 zamjena) ili u compare putanji `video-beats.ts` (r. 122–124) za stranu s `pct ≥ 10`.

### Minor
- **m1. Generički, ponavljajući predlošci:**
  - "Your kidneys filter the extra water." u 4/5 single videa (čaj, oatmeal, prosecco, rice) dolazi iz `v4/video-beats.ts` r. 106.
  - "INTO THE SMALL INTESTINE / In the small intestine it is taken apart." ponavlja naslov.
  - Prijedlog: banka varijanti s brojem iz modela ("≈ 120 ml extra urine by +3 h"), i kartica bubrega samo kad je višak urina značajan.
- **m2. "has left your body" je nejasno** (oatmeal 5 %, rice 3 %): `v4/video-story.ts` r. 199.
- **m3. Prosecco nikad ne kaže "prosecco"** ni ABV/grame alkohola (ime normalizirano na "sparkling wine"). Hook "How does your body clear it?" je generički.
- **m4. Donut:**
  - "18 g of sugar do" (`video-hook.ts` r. 50, varijanta "See what {n} g of sugar do.");
  - "about 5 teaspoons" za 18 g (≈ 4,3);
  - kcal i mast se ne spominju.
- **m5. Red ikona "AFTER 24 HOURS" bljesne 0,3–0,4 s** sa samo "Blood sugar" (čaj 21,9 s, donut 22,8 s). Ikona šećera za čaj/prosecco je nebitna.
- **m6. Rice:** dvaput "SUGAR RISES", kasni vrh (1 h 45 min), "Blood fat up" čip skače stranama (32,2–33,1 s).
- **m7. Prosecco:** BAC čip na 0,2 s (27,0–27,2 s); "ALCOHOL GONE" prije gornje granice "1–4 h"; prijelom "EU limit / 0.05 %" na end cardu.
- **m8. mmol/L** (trigliceridi) umjesto mg/dL za US publiku.
- **m9. Telemetrija `lit` ne bilježi isticanje organa preko gaugea** (gušterača, mozak), pa QC ne može provjeriti kriterij "named organ highlighted". Treba dodati u `video-telemetry.ts`.
- **m10. Shorts i Reels end card je 2,6 s**, samo 0,1 s iznad limita (OUTRO_S medium bi trebao dati više, kao i u 11-19).

## Prijedlozi za retenciju (sustavno)
1. **Hook iz najjačeg broja artikla, ne iz predloška.** Za čaj kofein ("50 mg of caffeine: how much is left at bedtime?"), za prosecco grami alkohola, za kikiriki mast ili kalorijska gustoća. Pool `water`/`dayN` koristiti samo kad nema jačeg broja.
2. **Compare pitanje mora imati neočit odgovor.** Ako jedna strana trivijalno pobjeđuje zbog porcije, pitati po 100 g ("Gram for gram, which has more calories?"). To je pravi twist za kikiriki.
3. **Svaki beat mora mijenjati broj ili organ** (nema statičnih 3.8 g kroz 20 s). Telemetrija već ima podatke, pa je moguće QC pravilo "isti tekst i broj > 6 s".
