# Kritika: v34 uzorci, alkohol + kofein, koktel i jelo (2026-11-22)

Autor: critic agent (Opus), read-only. Ništa nije renderirano, kod nije diran, ništa nije commitano ni obrisano.

**Uzorci:** `C:\claudework\video-samples\2026-11-21-v34\`
- vodka-red-bull-shorts (29,9 s)
- aperol-spritz-reels (50,3 s)
- carbonara-long-tiktok (71,9 s)

**Važno o verziji:** uzorci su renderirani u fazi 4k **prije** commitova `b4c9daa` i `5b6d091`. Ti commitovi mijenjaju:
- tajming hooka (pitanje izgovoreno prije prvog udarca);
- tekst jutarnje kartice: renderirano je "Alcohol-free for over N h. Still, don't drive.", a trenutni kod daje "Alcohol-free N+ h. Don't drive." (`video-beats.ts` r. 291);
- naraciju odgovora na hook kod žestokih pića ("About 1 US standard drink." naspram "1–5 h", `video-narration.ts` r. 79);
- bubrežnu karticu: "Your kidneys filter all of it." kad je voda cijelo piće iz hooka (`video-story.ts` r. 187).

Svaki nalaz na koji ti commitovi mogu utjecati provjeren je u trenutnom kodu i označen je u tekstu.

**Metoda:**
- Glavni izvor teksta je `*.timeline.json`. Skripte su iz njega izvukle segmente (`phase/beat/shot/lit/card`), sat po frameu (prozori od 6 s i najdulje držanje iste vrijednosti), dionice bez kartice, NEXT čipove naspram sata i sve jedinstvene retke s trajanjem i kutijom.
- Vizualna provjera: 30 frameova u `critic-frames\` (`<video>-<s>.jpg`) i tri contact sheeta `sheet-<video>.jpg`.
- Govorni pojas je provjeren ffmpegom (250–3500 Hz, `silencedetect −38 dB / 0,7 s`).
- `.srt` i naracija nisu u mapi, pa TTS fraziranje i novi tajming pitanja iz hooka nisu provjerljivi riječ po riječ.

**Glavni zaključak:**
- **Blockera nema.**
- **M1–M4 iz 2026-11-21 su popravljeni**, uz male ostatke (vidi tablicu statusa).
- Ostaju dva nova major nalaza:
  - **N1:** u aperolu se "BEDTIME / There is still alcohol in your blood." pojavljuje na **+0:11**, a video nigdje ne kaže koliko je sati, pa to izgleda kao besmislica;
  - **N2:** carbonara troši 14 s (14,7–29,0 s) na generičke kartice o šećeru i pospanosti dok sat prijeđe 17 min, a "pospanost" proturječi end cardu "Brain & sleep · Fine all day".

## Status M1–M4 (iz video-critique-2026-11-21.md)

| # | Zahtjev | Status | Dokaz (timeline / frame) |
|---|---|---|---|
| M1 | sat napreduje u svakom prozoru od 6 s; nijedna vrijednost se ne drži > 3 s | **POPRAVLJENO** | Najsporiji prozor je +7 min/6 s (aperol 5,7–11,7 s; carbonara 15–29 s). Najdulje držanje iste vrijednosti u priči je 0,63 s (vodka, +0:44), 0,77 s (aperol, +0:41) i 0,77 s (carbonara, +1:33). Ostatak (minor): carbonara stoji na +24:00 6,4 s prije end carda (kartica "24 HOURS LATER" 61,4–65,7 s + 2,2 s `main/end`). |
| M2a | nijedna kartica ne ponavlja naslov | **POPRAVLJENO** | FIRST SIP/BITE sada kaže novu činjenicu: "50 mg of caffeine." (vodka 2,4 s), "About 1 US standard drink." (aperol 2,7 s), "584 kcal, 61 g carbs." (carbonara 3,0 s; ponavlja broj iz hooka, ali dodaje ugljikohidrate). |
| M2b | bez kcal fillera u alkoholu | **POPRAVLJENO** (s ostatkom) | Nijedan "kcal" nije u vodki ni aperolu. Lull kartica i dalje postoji, samo s vodom: "TAKEN UP SO FAR / 2 of 150 ml" (aperol 11,9 s, +0:17) i "60 of 222 ml" (vodka 11,2 s). To je i dalje filler, vidi minor. |
| M2c | "NEXT" pokazuje budućnost | **POPRAVLJENO** | Svih 11 NEXT čipova pokazuje vrijeme veće od sata. Najmanji razmak: aperol "NEXT · +0:11 · Bedtime" na +0:10 (1 min, praktički sadašnjost) i carbonara "+12:00" na +11:53. |
| M2d | bubrežna kartica s vlastitim brojem | **POPRAVLJENO** | "Your kidneys filter its 124 ml of water." (aperol 20,9 s) i "… its 155 ml of water." (carbonara 29,9 s). Ostatak (minor): "its" je nespretan engleski. U trenutnom kodu (`video-beats.ts` r. 115) i dalje stoji, osim slučaja "all of it". |
| M2e | statični "NEXT MORNING" | **POPRAVLJENO** | Jedna kartica od 5,1 s, a sat ide +8:05 → +9:12. Kontradikcija "should be gone" je nestala. |
| M3 | doza kofeina + "N mg caffeine: still in you" | **POPRAVLJENO** (djelomično) | Doza "50 mg of caffeine." je na 2,4 s. Čip "38 mg caffeine / still in your body" je na ekranu 13,2–23,1 s, i uz ALCOHOL GONE (`-16.5.jpg`). End card kaže "Gone after about 3 h (typical) · 38 mg caffeine: still in you" (`-28.0.jpg`). Ostatak (minor): kartica "Alcohol: gone. N mg caffeine: still in you." izbačena je u Shortsu, jer `video-story.ts` r. 496–503 stavlja tu rečenicu kao drugi redak kartice "Alcohol gone" samo kad ima mjesta. Hook i dalje pita samo za grame alkohola. |
| M4 | kapitalizacija Aperol / Red Bull / Campari | **POPRAVLJENO** | "Aperol spritz" u hooku i "1 drink of Aperol spritz" na end cardu (`-48.5.jpg`). "Red Bull" i "Campari" se u ovim videima ne pojavljuju: vodka se zove generički "vodka and energy drink". Sva tri su u `PROPER_NAMES` (`video-names.ts` r. 48–52). |

## Tehnika i audio (ffmpeg / QC)
- QC: sva 3 PASS. Format 1080×1920, 30 fps CFR, A/V drift ≤ 5 ms, bez crnih i zamrznutih frameova.
- Glasnoća: −14,2 LUFS, LRA 2,9–3,6 LU, true peak −2,5 do −3,1 dBTP.
- Govorni pojas: **0 rupa u sva 3**.
- **Audio: PASS za sva 3.** Ograda: miks je jedna staza, a narracija nije spremljena.

## Ocjena po kriterijima

Kriteriji:
1. hook ≤ 1,5 s, specifičan i kasnije odgovoren
2. znanost (kofein, ABV / standardna pića, BAC za navedeno tijelo, kcal, šećer; procjene označene)
3. alkohol: US 0.08 % + EU 0.05 % + upozorenje uz svaki BAC; nikad "sigurno voziti"; kofein ne trijezni
4. imenovani organ vidljiv i istaknut
5. titlovi (čitljivost, safe zone, tipfeleri, US English, prirodno fraziranje)
6. tempo (region cap, dionice bez kartice ≤ 2 s, mrtve dionice)
7. audio
8. end card ≥ 2,5 s, bez preklopa
9. imenovanje više dijelova

| Video | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| vodka-red-bull-shorts | PASS (minor) | PASS (minor) | PASS | PASS (minor) | PASS (minor) | PASS (minor) | PASS | PASS (2,67 s) | PASS |
| aperol-spritz-reels | PASS (minor) | **FAIL** (N1) | PASS (minor) | PASS (minor) | PASS (minor) | PASS (minor) | PASS | PASS (2,67 s) | PASS (minor) |
| carbonara-long-tiktok | PASS (minor) | PASS (minor) | – | PASS (minor) | PASS (minor) | **FAIL** (N2) | PASS | PASS (3,27 s) | PASS (minor) |

Izmjereno iz timelinea:
- Dionice bez kartice u priči (bez `main/end` reda ikona) su najviše 1,43 s (vodka, 25,0–26,5 s), 1,33 s (aperol, 5,7–7,1 s) i 1,2 s (carbonara). **Sve su ≤ 2 s.**
- Region cap prema QC-u: 5,9 s od 6 (vodka, head @5 s), 8,1 s od 9 (aperol, liver @26,7 s) i 11,6 s od 12 (carbonara, large @54,1 s). **Sve PASS, ali vodka i aperol su na samoj granici.**
- Preklopa teksta nema (0 frameova). Svaki BAC ima oba limita i upozorenje (387 i 478 frameova).

### vodka-red-bull-shorts (29,9 s)
1. **Hook (PASS, minor):**
   - Na 0,0 s "How long do 19 g stay in you? / Vodka and energy drink: 19 g of alcohol." stoji uz cold open na mozgu (PEAK, BAC panel).
   - Odgovor: "ALCOHOL GONE / The alcohol is gone after about 1–5 h." (14,5–19,3 s), a na end cardu "Gone after about 3 h (typical)".
   - Minor: hook i dalje ne koristi kofein. To je najjača priča ovog pića ("The alcohol leaves. The caffeine doesn't."), a model je već ima.
   - Tajming izgovorenog pitanja mijenja `5b6d091` i nije provjerljiv bez naracije.
2. **Znanost (PASS, minor):**
   - 19 g alkohola u 222 ml ≈ 60 ml votke od 40 % + ~160 ml energetskog pića. 50 mg kofeina = 160 ml × ~32 mg/100 ml. Točno.
   - Vrh BAC-a 0.015–0.037 % na 45 min je uvjerljiv uz Widmarkov maksimum 0,040 % (70 kg, r 0,68).
   - Minor: 19 g su **~1,4 US standardna pića**. Kartica standardnih pića je ovdje zamijenjena dozom kofeina (to je ispravan izbor), ali broj pića nigdje ne stoji.
   - Minor: "1–5 h" (kartica) naspram "about 3 h" (end card) i trenutka ALCOHOL GONE na +2:51. Donja granica od 1 h nije moguća kad je vrh na 45 min. Kartica dolazi iz `goneRange`, a `b4c9daa` mijenja samo naraciju, ne tekst.
   - Minor: krivulja kofeina je čudna:
     - 38 mg na +2:09 i 37 mg na +3:13 (−1 mg/h);
     - 21 mg na +8:34 (−3 mg/h);
     - uz poluživot ~5 h očekivano je ~33 mg na 3 h i ~16 mg na 8,5 h.
     - Vjerojatno čip zbraja kofein u crijevu i u krvi; treba provjeriti `caffeineLeft`.
3. **Alkohol (PASS):**
   - Svi BAC frameovi imaju US 0.08 %, EU 0.05 % i "Never safe to drive after drinking." Vizualno provjereno na `-0.3`, `-4.0`, `-8.0`, `-12.0` i `-28.0`.
   - "ALCOHOL PEAK / Caffeine masks drowsiness, not impairment." (6,0–11,1 s) ne sugerira da kofein trijezni.
   - "38 mg caffeine: still in you" stoji uz "Blood alcohol: back to zero", ali ne tvrdi ništa o budnosti.
   - "NEXT MORNING / Alcohol-free for over 3 h. Still, don't drive." (19,8–25,1 s) ne sugerira sigurnu vožnju. Za "Don't drive" kad je BAC nula vidi minor.
4. **Organ (PASS, minor):**
   - Želudac je istaknut uz FIRST SIP. Mozak svijetli žuto uz vrh (`-8.0.jpg`), iako je `lit=[]`, jer boja dolazi iz BAC tinte.
   - Minor (ponavlja se): kadar na jetri 14,5–19,1 s ima `lit=[]`, a kartica ne kaže što jetra radi (`-16.5.jpg`).
5. **Titlovi (PASS, minor):**
   - Bez tipfelera, US English, unutar safe zona (vrh 290 px, kartice 1160–1316, disclaimer 1347).
   - Minor (ponavlja se): end card prelama "… · EU limit" / "0.05 %" (`-28.0.jpg`).
   - Minor: čip "BAC 0.006–0.014 % / In your blood" traje 0,07 s (13,20–13,27 s). Nitko ga ne može pročitati.
6. **Tempo (PASS, minor):**
   - Sat se kreće cijelo vrijeme.
   - Minor: "TAKEN UP SO FAR / 60 → 155 of 222 ml" (11,2–13,7 s) je filler (vidi M2b).
   - Minor (ponavlja se): red ikona "After 24 hours" je presječen. Prikazuju se samo "Blood sugar" (26,0 s) i "Heart" 0,17 s prije end carda (`-26.2.jpg`).
   - Region cap je 5,9 s od 6.
7. **Audio (PASS).**
8. **End card (PASS):** prema QC-u 2,67 s (26,7–29,6 s). Bez preklopa. Zaglavlje "AFTER 24 HOURS" pripada end cardu.
9. **Više dijelova (PASS):** "Vodka and energy drink" je u hooku i na end cardu, a doza kofeina na FIRST SIP.

### aperol-spritz-reels (50,3 s)
1. **Hook (PASS, minor):**
   - "When are 14 g out of you? / Aperol spritz: 14 g of alcohol." (0,0 s).
   - Odgovor: "The alcohol is gone after about 1–3 h." (26,7–31,3 s), a na end cardu "Gone after about 2 h (typical)".
   - Minor (ponavlja se): "When are 14 g out of you?" je neprirodan engleski.
2. **Znanost (FAIL, N1):**
   - **"NEXT · +0:11 · Bedtime" (5,8 s), zatim "BEDTIME / There is still alcohol in your blood." (7,0–11,8 s, +0:11 → +0:17, `-9.0.jpg`).** Profil rendera pije tik pred spavanje (ikona mjeseca u satu), ali video nikad ne kaže koliko je sati. Gledatelj vidi "spavanje 11 minuta nakon prvog gutljaja" i trivijalnu tvrdnju da je alkohol u krvi 11 minuta nakon pića. To ruši vjerodostojnost cijelog videa. Detalji su u N1.
   - Ostalo je točno:
     - 14 g = "About 1 US standard drink.";
     - BAC 0.009–0.023 % na 40 min (Widmarkov maksimum 0,029 %);
     - ALCOHOL GONE na +2:07 naspram "about 2 h";
     - 124 ml vode u 150 ml spritza.
   - Minor (gramatika i znanost): "Coffee or water don't speed it up." Uz "or" glagol se slaže s bližim subjektom, pa je ispravno "doesn't". Izvor je `food/foodProduct.ts`, rečenica "coffee, water or fresh air don't".
3. **Alkohol (PASS, minor):**
   - Svih 478 BAC frameova ima oba limita i upozorenje.
   - "Coffee or water don't speed it up." (31,3–35,1 s) je dobar dodatak.
   - Minor: "NEXT MORNING / Alcohol-free for over 5 h. Still, don't drive." (38,4–43,7 s, `-41.0.jpg`). U trenutnom kodu tekst glasi "Alcohol-free 5+ h. Don't drive." (`5b6d091`).
4. **Organ (PASS, minor):**
   - Želudac je istaknut uz FIRST SIP, a bubrezi uz KIDNEYS (`-22.5.jpg`, jasno vidljivi).
   - Mozak svijetli uz vrh (`-17.0.jpg`).
   - Minor: jetra je u kadru 8,1 s (26,7–34,8 s, region cap 8,1/9) s `lit=[]` (`-29.0.jpg`, `-33.0.jpg`).
5. **Titlovi (PASS, minor):**
   - M4 je riješen: "Aperol" je svugdje velikim slovom.
   - Minor: "1 drink of Aperol spritz" na end cardu je i dalje nespretno. Prirodno je "1 Aperol spritz".
   - Minor: "Your kidneys filter its 124 ml of water." ("its" bez jasnog antecedenta).
   - Minor (ponavlja se): end card prelama "EU limit" / "0.05 %".
   - Minor: čip "BAC … In your blood" traje 0,17 s (20,30–20,47 s).
6. **Tempo (PASS, minor):**
   - Sat se kreće (najsporije +7 min/6 s). Mrtvo otvaranje iz v33 je nestalo: ALCOHOL PEAK je već na 15,2 s, a v33 je trebao 19,2 s.
   - Minor: 6 s (5,8–11,8 s) odlazi na BEDTIME (N1).
   - Minor: "TAKEN UP SO FAR / 2 of 150 ml" (11,9 s) je filler.
   - Minor: ALCOHOL GONE ima dvije kartice na jetri, ukupno 8,1 s.
   - Red ikona je 4 od 4 (OK).
7. **Audio (PASS).**
8. **End card (PASS):** prema QC-u 2,67 s (47,1–50,1 s). Bez preklopa.
9. **Više dijelova (PASS, minor):** sastav spritza (Aperol + prosecco + soda) se i dalje ne spominje (ponavlja se).

### carbonara-long-tiktok (71,9 s)
1. **Hook (PASS, minor):**
   - "How far have 584 kcal gotten by tomorrow? / 1 plate of spaghetti carbonara: 584 kcal." (0,0 s).
   - Odgovor je tek na end cardu (68,1 s): "All 584 kcal taken up by your body".
   - Minor (ponavlja se): pitanje je apstraktno.
2. **Znanost (PASS, minor):**
   - 584 kcal / 269 g, 61 g ugljikohidrata (~75 g suhe tjestenine) je uvjerljivo.
   - Šećer "+24–58 % over usual: a normal rise" na 1 h 30 min je uvjerljiv, a raspon je označen.
   - Trigliceridi +0,4 mmol/L su uvjerljivi.
   - Vlakna "1.6 g fiber / In your large intestine" na +5:50 su uvjerljiva (ileocekalni prolaz za 4–6 h).
   - Minor (ponavlja se): "mmol/L" (US: ≈ +35 mg/dL), "3 % has left your body" je nejasno, a "SLEEPY AFTER EATING" proturječi end cardu "Brain & sleep · Fine all day".
   - Minor: "The slump comes about 1.5 hours later." stoji na +1:42 (25,0–29,0 s), dakle "kasnije" nakon trenutka koji je već prošao.
   - Minor: "The fat joins your blood later." stoji na +3:30, a čip već pokazuje +0,4.
3. **Alkohol:** nije primjenjivo.
4. **Organ (PASS, minor):**
   - Istaknuti su želudac, bubrezi (`-32.0.jpg`) i debelo crijevo (`-49.0.jpg`).
   - Minor: na `-32.0.jpg` žuta gušterača (tinta inzulina) i čip "Blood sugar up" zaklanjaju desni bubreg, pa svijetle dva organa, a kartica imenuje samo jedan.
   - Minor (ponavlja se): tanko crijevo se nikad ne imenuje. "BLOOD SUGAR PEAK", "SLEEPY" (mozak plav, nije istaknut, `-23.0.jpg`) i "FAT IN YOUR BLOOD" imaju `lit=[]`.
5. **Titlovi (PASS, minor):**
   - Bez tipfelera, unutar safe zona.
   - Minor: "its 155 ml of water" i "kcal".
   - Minor (ponavlja se): end card prelama "…3 % has left your" / "body" (`-70.0.jpg`).
6. **Tempo (FAIL, N2):**
   - **Na 14,7–29,0 s (14,3 s, 20 % videa) sat prijeđe samo +1:29 → +1:46**, a kartice su generičke:
     - "Your blood sugar climbs to its peak." (4,6 s);
     - "Many people feel sleepy after a big meal." (4,8 s);
     - "The slump comes about 1.5 hours later." (3,7 s).
   - Kadar je na glavi 8,6 s bez istaknutog organa.
   - Minor: kraj stoji na +24:00 6,4 s prije end carda.
   - Druga polovica (30–61 s) ima dobar tempo.
7. **Audio (PASS).**
8. **End card (PASS):** prema QC-u 3,27 s (68,1–71,6 s). Bez preklopa.
9. **Više dijelova (PASS, minor):** sastojci (jaja, guanciale/slanina, sir, tjestenina) i dalje nisu povezani s krivuljama (ponavlja se).

---

## Defekti po težini (vjerojatni uzrok u generatoru)

### Blocker
- **Nema.** Alkoholna pravila (oba limita + upozorenje uz svaki BAC, "never safe to drive", kofein ne trijezni) prolaze u svakom frameu, a end card je ≥ 2,5 s u sva tri videa.

### Major
- **N1. "BEDTIME" 11 minuta nakon prvog gutljaja, bez sata koji to objašnjava** (aperol 5,8–11,8 s; `-9.0.jpg`).
  - Uzrok: `app/src/v4/food/foodProduct.ts` r. ~352–366.
    - Poglavlje "Bedtime" se stavlja na `chMin = toBed` za svaki `toBed > 0`, pa i za 11 min. Profil rendera ima `drinkAtMin` tik pred `bedtimeMin`.
    - `video-beats.ts` r. 90 ga skraćuje u "There is still alcohol in your blood.".
    - Planer (`video-plan.ts`) ga onda uzima kao zasebnu stanicu s NEXT čipom.
  - Sat (`+0:11 since the first sip`) i jedini noćni znak (mjesec) ne govore gledatelju da je 22:45 → 23:00.
  - Commitovi `b4c9daa` i `5b6d091` ovo **ne diraju**.
  - Prijedlog sustava:
    - (a) u videu preskočiti poglavlje Bedtime kad je `toBed < ~60 min`, ili ga spojiti s prvim trenutkom;
    - (b) gdje god kartica ovisi o dobu dana (Bedtime, Next morning), dodati stvarni sat u karticu ili NEXT čip ("Bedtime · 11 PM") ili jednom u otvaranju ("10:45 PM, first sip");
    - (c) tvrdi test u `video-sameness`/`video-4k` testovima: nijedna kartica "Bedtime"/"Next morning" ne smije biti na < 60 min / < 5 h bez vidljivog sata.
- **N2. Carbonara: 14 s generičkog sadržaja o šećeru i pospanosti dok sat prijeđe 17 min** (14,7–29,0 s).
  - Pospanost proturječi end cardu "Brain & sleep · Fine all day", a "about 1.5 hours later" se izgovara na +1:42.
  - Uzrok:
    - `food/foodProduct.ts` r. 341 (tekst "Sleepy after eating" s "1.5 hours later");
    - `video-beats.ts` ga dijeli u dvije kartice;
    - `video-plan.ts` daje stanici obje kartice jer su trenuci +1:29 (peak) i +1:30 (sleepy) spojeni u jednu duljinu;
    - end card (`video-story.ts`, `endCardOf` / redovi ikona) ne zna za to poglavlje.
  - Prijedlog sustava:
    - jedna kartica po stanici kad stanice dijele < 10 min;
    - izbaciti redak "… later" kad je sat ≥ `min` poglavlja;
    - red "Brain & sleep" na end cardu uskladiti s poglavljem ("Sleepy ~1.5 h in");
    - umjesto generičke rečenice reći mehanizam iz sastojaka ("61 g carbs from the pasta: sugar peaks at 1.5 h").

### Minor
- vodka:
  - hook ne koristi kofein;
  - kartica "Alcohol: gone. 38 mg caffeine: still in you." izbačena je u Shortsu (`video-story.ts` r. 496–503: drugi redak samo gdje ima mjesta), iako je to payoff ovog pića;
  - "1–5 h" naspram "about 3 h" (ponavlja se);
  - krivulja kofeina 38 → 37 mg od +2:09 do +3:13, pa 21 mg na +8:34 (provjeriti `caffeineLeft`);
  - ~1,4 standardna pića se ne navode.
- Jutarnja kartica "Alcohol-free N+ h. Don't drive." (trenutni kod, `video-beats.ts` r. 291):
  - savjet "ne vozi" kad je BAC nula zvuči proturječno i propovjednički;
  - prijedlog: "BAC back to zero by ~1 AM. Sleep was still lighter." uz trajni disclaimer "Never safe to drive after drinking." na BAC panelu.
  - To je odluka vlasnika (pravila sigurnosti), ne greška.
- Lull kartica "TAKEN UP SO FAR / N of 150 ml" (vode) u alkoholnim videima:
  - zamijenila je kcal filler, ali i dalje ne govori ništa (vodka 11,2 s, aperol 11,9 s);
  - uzrok: `video-plan.ts` `LULL_TITLE`;
  - prijedlog: za alkohol lull = BAC trend ("BAC falling ~0.015 %/h") ili čip kofeina.
- "Your kidneys filter its N ml of water." (`video-beats.ts` r. 115): "its" bez antecedenta. Bolje je "The drink's 124 ml of water goes to your kidneys." / "…the meal's 155 ml…".
- "Coffee or water don't speed it up." → "doesn't" (`food/foodProduct.ts`).
- Bljeskovi čipova ≤ 0,2 s: "BAC … In your blood" u vodki (0,07 s) i aperolu (0,17 s). Treba minimalno trajanje čipa od 1 s ili ga ne prikazati (ponavlja se).
- End card prelama "EU limit" / "0.05 %" (vodka, aperol) i "…left your" / "body" (carbonara). `share.ts` outro, ponavlja se.
- Red ikona "After 24 hours" je presječen u Shortsu (vodka 2/4, "Heart" 0,17 s). Ponavlja se.
- Jetra na kraju alkoholne priče je u kadru 4,5–8,1 s s `lit=[]` (vodka, aperol). Ponavlja se.
- aperol:
  - "When are 14 g out of you?";
  - "1 drink of Aperol spritz";
  - sastav spritza se ne spominje;
  - "NEXT · +0:11" je samo 1 min ispred sata.
- carbonara:
  - kraj stoji na +24:00 6,4 s;
  - hook je apstraktan;
  - "mmol/L", "kcal", "3 % has left your body", "The fat joins your blood later." na +3:30;
  - tanko crijevo se ne prikazuje;
  - gušterača i čip zaklanjaju bubreg na KIDNEYS;
  - sastojci nisu povezani s krivuljama.
- `.srt` i naracija se i dalje ne spremaju uz uzorke, pa tajming pitanja iz hooka (`5b6d091`) i TTS fraziranje ("over 3 hours", "Some of it is still in you") nisu provjerljivi.

## Prijedlozi za retenciju (sustavno)
1. **Kartice ovisne o dobu dana trebaju sat.** Bez "10:45 PM" na početku, "BEDTIME" i "NEXT MORNING" izgledaju proizvoljno (N1). Jedan čip s dobom dana u otvaranju rješava obje.
2. **Payoff za alkohol + kofein mora biti kartica, ne samo čip.** "Alcohol: gone. 38 mg caffeine: still in you." treba imati prioritet `must` i u Shortsu, ispred druge kartice ALCOHOL GONE. Hook-klasa "The alcohol leaves. The caffeine doesn't." za mješavine.
3. **Jedna kartica po bliskim trenucima.** Kad su stanice < 10 min jedna od druge (carbonara peak/sleepy), planer neka ih spoji u jednu karticu, a ne dvije-tri generičke.
4. **Mehanizam uz svaki kadar organa:**
   - jetra: "Your liver clears about 1 drink an hour.";
   - tanko crijevo: "584 kcal cross into your blood here.".
   - Organ treba zasvijetliti (`lit`), a ne samo biti u kadru.
5. **Lull nikad bez informacije:** "TAKEN UP SO FAR N of 150 ml" zamijeniti trendom ključne veličine (BAC, kofein, šećer).
