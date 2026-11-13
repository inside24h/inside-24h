# Kritika: v25 uzorci (2026-11-13)

Autor: critic agent (Opus), read-only. Ništa nije renderirano, kod nije diran i ništa nije commitano.

**Uzorci:** `C:\claudework\video-samples\2026-11-13-v25\`, ukupno 6 MP4 datoteka: beer-reels, espresso-shorts, pizza-tiktok-long, lentils-tiktok-long, compare-banana-vs-croissant-shorts i compare-cola-vs-orange-juice-same-reels.

**Dodatni frameovi:** `critic-frames\` sadrži 21 frame, 6 tile pregleda i 2 cropa/stacka.

**SRT:** uz MP4 datoteke nema `.srt`. Tekst glasa zato nije provjeren riječ po riječ: zaključci o naraciji idu iz kartica na ekranu. Word-by-word karaoke titlovi ne vide se na statičnim frameovima, pa ih ovdje ne mogu potvrditi.

## Tehnika i audio (ffmpeg)
- **QC skripta:** svih 6 prolazi. Format je 1080×1920 i 30 fps CFR, a A/V drift je 0 ms.
- **Glasnoća:** −14,2 do −14,5 LUFS, true peak −1,7 do −3,1 dBTP. Nema clippinga.
- **Govorni pojas (250–3500 Hz):** `silencedetect −38 dB / 0,7 s` ne nalazi nijednu rupu ni u jednom videu.
- **Momentary loudness:** krivulja je ravna (LRA ≈ 3 LU), pa ducking na stillovima/mjerenju ne mogu odvojeno potvrditi.
- **Tiši odsječci (−21 do −25 dB):** noćni segmenti, i to cola 37–45 s, pizza 40–49 s i lentils 35–47 s. To je namjerni "under water" (video-audio.ts), a ne tišina.
- **Trajanje:** Shorts 28,1–28,6 s, Reels 51,2–52,0 s, TT 65,3–66,6 s.

## Ocjena po kriterijima

Kriteriji:
1. hook u prvih 1,5 s;
2. znanost i oznake procjena / alkohol;
3. imenovani organ je vidljiv i istaknut;
4. titlovi: čitljivost, safe zone, tipfeleri, US English;
5. tempo i raznolikost;
6. audio;
7. end card / CTA;
8. compare: porcije i fer presuda.

| Video | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| beer-reels | PASS | **FAIL** | **FAIL** | PASS (minor) | PASS (minor) | PASS | PASS (minor) | – |
| espresso-shorts | PASS | **FAIL** | PASS | PASS | PASS | PASS | PASS (major hero) | – |
| pizza-tiktok-long | PASS | PASS | PASS | PASS (minor) | **FAIL** | PASS | PASS | – |
| lentils-tiktok-long | PASS (misleading) | **FAIL** | **FAIL** | PASS (minor) | **FAIL** | PASS | PASS | – |
| compare banana vs croissant | PASS (generic) | PASS | PASS | **FAIL** | **FAIL** | PASS | **FAIL** | PASS |
| compare cola vs OJ | PASS (generic) | **FAIL** | **FAIL** | **FAIL** | PASS (minor) | PASS | PASS | PASS (note) |

### beer-reels (51,2 s)
1. **Hook (PASS):** na 0,0 s je "How long until it is out of your blood? 500 ml of beer.", specifično. Cold open pokazuje vrh na mozgu.
2. **Znanost i alkohol (FAIL):**
   - Već na 0,0–1,5 s (cold open, `critic-frames\beer-reels-0.4s.jpg`) i ponovno na 17–21 s stoji kartica "Focus may dip · BAC 0.012–0.031 % · US limit 0.08 % · EU limit 0.05 %". Upozorenja o vožnji nema ni u toj kartici ni u istom kadru.
   - Prvo "Don't drive after drinking." dolazi tek na ~42–45 s. Gledatelj u prvoj sekundi čita: "pivo od 0,5 l je daleko ispod oba limita".
   - Raspon se računa za zadano tijelo (muškarac od 70 kg; alcoholMitchell.test: 0,19–0,30 g/L). Žena od 55–60 kg po Widmarku dolazi na ~0,04–0,06 %, dakle do EU limita ili preko njega. Video ne kaže za koje tijelo vrijedi broj.
   - US 0.08 % i EU 0.05 % jesu oba prikazana (pravilo je zadovoljeno), ali sama jukstapozicija implicira "safe".
   - End card (49–50,5 s) ponavlja "BAC 0.012–0.031 %" bez limita i bez upozorenja.
   - Kartica na 31–36 s kaže "The alcohol is gone after about 1–4 h.", a ona na 38–41 s "At 07:00, the alcohol should be gone.". Vrijeme prvog gutljaja nigdje nije rečeno, pa to čita kao kontradikcija.
   - Vrh je dan kao tri različite minute: NEXT "+0:48", na kartici timer "+0:49", na end cardu "50 min in".
3. **Organ vidljiv i istaknut (FAIL):** **poznati problem je potvrđen.**
   - Na 21,5–28 s kartica "KIDNEYS / Your kidneys filter the extra water." traje dok je kamera na visini bubrega (`sheets\beer-kidneys-24.5s.jpg`).
   - U centru kadra svijetle gušterača/duodenum (žuto), a bubrezi se ne vide: ne svijetle i skriveni su iza holograma crijeva.
   - Jedino jako svijetli organ je **mjehur**, na dnu kadra (y ≈ 1500–1700 px), dakle u donjoj UI zoni.
4. **Titlovi (PASS):**
   - Kartice su na ~62–68 % visine, timeline na 74 %, a desni callouti završavaju na x ≈ 888 px. Sve je izvan UI zona.
   - Minor: hologram mozga prolazi iza naslova i timera (17,5 s).
5. **Tempo (PASS):**
   - Početak je raznolik.
   - Minor: od 37 do 46 s isti je kadar jetre (+16:15 → +24:00), ~9 s bez novog vizuala.
6. **Audio (PASS).**
7. **End card (PASS):** CTA "Which drink should we test next? 👇 / Now watch the first sip again.". Hero broj je s vrha, a ne od 24 h (vidi M2), uz "Blood sugar & energy: Not tracked for this one".

### espresso-shorts (28,6 s)
1. **Hook (PASS):** na 0,0 s "How much caffeine is left at bedtime? One espresso.". Konkretno i obećava payoff.
2. **Znanost (FAIL zbog end carda):**
   - Payoff "About a third of the caffeine remains." (+8:19, 20–23 s; 25/63 mg) je razumna procjena (t½ ≈ 5–6 h).
   - Na end cardu (27,0–28,0 s) piše "AFTER 24 HOURS / Espresso / **58 mg caffeine · 45 min in** / still in your body". To čita kao "58 mg je još u tebi nakon 24 h".
   - "Bedtime" nije vezan uz sat. Postoji samo ikona mjeseca (minor).
3. **Organ (PASS):** "Your liver takes the caffeine apart." na 13–16 s, jetra je u kadru i crvena. Mozak je u kadru kod bedtimea.
4. **Titlovi (PASS).**
5. **Tempo (PASS):** 25,0 s je kratak kadar bez kartice, prijelaz u end card.
6. **Audio (PASS).**
7. **End card (PASS):** CTA je u redu, ali hero je kriv (M2).

### pizza-tiktok-long (66,6 s)
1. **Hook (PASS):** "When does your blood sugar peak? 1 slice of pizza: about 8 teaspoons of sugar.". Minor: serifna "1" izgleda kao "l" (`critic-frames\pizza-hook-crop.jpg`).
2. **Znanost (PASS):** na 13,9 s "About 8 teaspoons of sugar, from starch." pa je škrob označen. Raspon "+18–42 % over usual" je označen kao raspon.
3. **Organ (PASS):** želudac, gušterača i debelo crijevo svijetle kad su imenovani.
4. **Titlovi (PASS):**
   - Minor: na 36 s callout "0.6 g fiber" stoji uz karticu "The fat joins your blood later.", što je neusklađeno.
5. **Tempo (FAIL):**
   - Debelo crijevo je u kadru ~41–64 s (≈22 s, trećina videa).
   - Kartice su iste kao kod leće (M5).
6. **Audio (PASS).**
7. **End card (PASS).**

### lentils-tiktok-long (65,3 s)
1. **Hook (PASS formalno, sadržajno zavaravajući):** "How far does your blood sugar climb? 1 portion of lentils: about 6 teaspoons of sugar.".
2. **Znanost (FAIL):**
   - Leća (niski GI, ~15 g vlakana) dobiva hook "6 teaspoons of sugar". Vlastiti payoff to pobija: "+12–26 % over usual: a normal rise".
   - Normie pamti "leća = 6 žličica šećera".
3. **Organ (FAIL):** "KIDNEYS / Your kidneys filter the extra water." traje na ~22,5–27 s (+2:02). Bubrezi se ne vide, a mjehur svijetli na dnu (`critic-frames\mid-trio.jpg`, desno). Kartica o "extra water" za leću je ionako slaba.
4. **Titlovi (PASS):**
   - Minor: na 29,9 s (+4:05) stoji callout "80 ml urine", a kartica kaže "In your stomach: Almost all has moved on by 4 hours.". Kamera je na srcu.
5. **Tempo (FAIL):** debelo crijevo je u kadru ~35–62 s, ≈27 s ili ~40 % videa. Pet kartica zaredom je o crijevu i vlaknima.
6. **Audio (PASS).**
7. **End card (PASS):** "Blood sugar up · 1 h 15 min in" je identično kao kod pizze (M5).

### compare banana vs croissant (28,1 s)
1. **Hook (PASS, generičan):** "Guess: which has more sugar?" uz "Banana 118 g vs Croissant 57 g". Isti hook ima i drugi compare.
2. **Znanost (PASS):** 14 g vs 6 g šećera i 105 vs 231 kcal su točni za te porcije.
3. **Organ (PASS):** "Into the small intestine" ima istaknuto tanko crijevo. Callout "Blood sugar up" vodi do gušterače.
4. **Titlovi (FAIL):**
   - Callout je **odrezan** u "+16–38 % over usual: a nor…" i "+18–40 % over usual: a nor…" već u hooku (0,0 s) i do ~13 s.
   - Na 10–16 s dva različita titla stoje istodobno: lijevo "Your blood sugar climbs to its peak.", desno "In the small intestine it is taken apart.". To je dvostruko čitanje u Shortsu.
   - CTA "Watch both again from the first **sip**." je kriv za hranu.
5. **Tempo i raznolikost (FAIL):** cijeli video je isti široki kadar dva tijela, bez ijednog bliskog plana.
6. **Audio (PASS).**
7. **End card (FAIL):** potpuni end card (dva panela, "Answer: Banana had more sugar.", "🏆 Banana wins: less saturated fat, 126 fewer kcal.", CTA) vidi se samo ~26,3–27,5 s, oko 1,2 s, što je nečitljivo.
8. **Compare (PASS):**
   - Porcije su na ekranu cijelo vrijeme, a trofej je opravdan (kcal i zasićene masti).
   - Minor: croissant je "All lights green / Nothing flagged all day".

### compare cola vs orange juice (52,0 s)
1. **Hook (PASS, generičan):** isti hook kao kod banane.
2. **Znanost (FAIL):**
   - Na 0,0–0,5 s stoji "**344 ml** in your stomach" za OJ, a porcija je 330 ml.
   - "Cola hydrates like the same amount of water." je u redu (BHI, Maughan 2016).
3. **Organ (FAIL):**
   - "KIDNEYS" s obje strane traje na ~36–45 s (+12:15–12:38). Na OJ strani svijetle debelo crijevo i mjehur, a bubrezi ne.
   - Na cola strani bubreg se jedva nazire.
4. **Titlovi (FAIL):**
   - Callout je odrezan u "+20–44 % over usual: a fas…" (0–13 s).
   - Na 7–10 s istodobno stoje dva titla, "Your blood sugar climbs to its peak." i "Your small intestine absorbs it within minutes.".
5. **Tempo (PASS):** minor: 37–45 s je tiši noćni dio.
6. **Audio (PASS).**
7. **End card (PASS):** "Did you guess right? 👇 / Watch both again from the first sip." traje ~3 s.
8. **Compare (PASS, s napomenom):**
   - "330 ml vs 330 ml" je na ekranu, a presuda "More sugar: Cola. 35 g vs 29 g" je točna.
   - Napomena: "Cola: 31 fewer kcal." je jedina istaknuta poruka nakon odgovora i čita se kao plus za colu. OJ kalij i vitamin C nisu spomenuti, ali trofeja nema, pa je granično fer.

---

## Defekti po težini (s vjerojatnim uzrokom u generatoru)

### Blocker
- **B1. Alkohol: BAC uz limite bez upozorenja implicira "safe to drive".**
  - Gdje: beer 0,0–1,5 s (cold open), 17–21 s i end card.
  - Uzrok:
    - `app/src/v4/video-body.ts` `bacPlain()` (r. 119–128) uvijek dodaje "US limit 0.08 % · EU limit 0.05 %" kao neutralno sidro;
    - cold open (`video-cam.ts` `shotOf` teaser + `video-plan.ts`) otvara na tom gaugeu;
    - raspon dolazi iz `science/ranges.ts` (`bacRange`) za zadani profil, a nigdje ne piše za koje tijelo vrijedi;
    - "Don't drive after drinking." `video-beats.ts` (r. ~245) ubacuje tek u "Next morning" poglavlje (alcoholG < 40);
    - end card hero (`share.ts` `drawOutro` / payoff) ponavlja BAC bez upozorenja.
- **B2. "Kidneys" kartica bez vidljivih ili istaknutih bubrega (potvrđeno), sistemski u 3/6 videa.**
  - Gdje: beer 21,5–28 s, lentils ~22,5–27 s, cola 36–45 s.
  - Uzrok, podijeljena odgovornost:
    - kamera cilja imenovani organ (`AppV4.tsx` `cue()` → `video-cam.ts` `beatOrgans`/`shotOf`);
    - sjaj dolazi isključivo iz modela prisutnosti (`scene/presence.ts`: linearni udio, `TINT_ON_STREAM 0.3`);
    - u `v4/routes.ts` bubreg je `k(m) * ml * 0.1`, dakle ≤ 10 % udjela, pa je sjaj ≈ 0,03, odnosno nevidljiv;
    - mjehur drži urin (velik udio) pa jako svijetli;
    - bubrezi su retroperitonealni (z ≈ 0,06–0,11 u `video-cam.ts` BOX), iza holograma crijeva (jejunum z do 0,17), a kamera je frontalna;
    - nema "named-organ spotlight" puta (`scene/Body.tsx` kidney `base 0.05`), a ni prigušivanja organa ispred.

### Major
- **M1. Količina u želucu veća od porcije.**
  - Gdje: beer "501/502 ml" (0–1 s, porcija 500), cola/OJ "344 ml" (0 s, porcija 330).
  - Uzrok: `v4/routes.ts` `st()` ne ograničava `amount` na `total`; sim želuca (water/cola/food sim) uključuje sekreciju ili overshoot.
  - Mamac je za "math is wrong" komentare.
- **M2. End card hero je vrijednost s vrha pod naslovom "AFTER 24 HOURS".**
  - Gdje: espresso "58 mg caffeine · 45 min in / still in your body" (27–28 s), beer "Focus may dip · 50 min in / BAC…".
  - Uzrok: `v4/share.ts` `drawOutro`/payoff hero uzima peak gauge (`video-body.ts` small text "still in your body").
- **M3. Odrezan tekst callouta ("a nor…", "a fas…") u oba comparea, već u hooku.**
  - Uzrok: `v4/share.ts` `fit()` (r. 972) u split layoutu skraćuje dugi `sugarPlain()` (`video-body.ts` r. 110–113). Za uski split treba kraća varijanta teksta.
- **M4. Leća: hook "about 6 teaspoons of sugar" za hranu niskog GI-ja; payoff ga pobija.**
  - Uzrok: `v4/video-hook.ts` r. ~150–151 (starch → teaspoons za krutine) nema uvjet na GI ni vlakna.
- **M5. Šablonska istost i dugi kadar crijeva.**
  - Pizza i leća imaju identičan niz kartica i identičan "Blood sugar up · 1 h 15 min in".
  - Kod leće je ~27 s debelog crijeva (35–62 s), kod pizze ~22 s.
  - Oba comparea imaju isti hook "Guess: which has more sugar?".
  - Uzrok:
    - `v4/video-beats.ts` regex pravila (r. 41–42, 120) pretvaraju isti tekst iz `food/foodProduct.ts` (r. 248) u iste kartice;
    - `v4/video-guess.ts` r. 130/156 daje fiksno pitanje;
    - raspored poglavlja dolazi iz `video-plan.ts`/`video-story.ts`;
    - isto vrijeme vrha vjerojatno potječe iz zajedničkog modela pražnjenja krutog obroka u `science/foodSim.ts` (treba provjeriti).
- **M6. Beer: "gone after about 1–4 h" pa "At 07:00, the alcohol should be gone".** Vrijeme pića nije prikazano, pa se čita kao kontradikcija.
  - Uzrok: `v4/video-beats.ts` emitira i `goneCard` (r. 222–230) i "Next morning" SAFE_CARD granu (r. 252–262).
- **M7. Compare Shorts end card je vidljiv ~1,2 s (banana 26,3–27,5 s).**
  - Uzrok: duljina outroa za `shorts` cut u `v4/video-plan.ts` (PLATFORM_LENGTH / outro), uz ~0,5 s loop fadea.
- **M8. Dva istodobna titla u split prikazu** (banana 10–16 s, cola 7–10 s). To je dvostruko opterećenje čitanja na ~36 px.
  - Uzrok: `CompareVideo.tsx` / `AppV4.tsx` `cardOrgans` (r. 839) i `video-captions.ts`. Svaka strana dobiva vlastiti `title`/`titleB` beat bez sinkronizacije.

### Minor
- Compare CTA "Watch both again from the first sip." za hranu (banana vs croissant). `v4/share.ts` r. 29 `loop()` ignorira `solid` kad je `compare`.
- Serifna "1" čita se kao "l" ("l slice of pizza", "l portion of lentils"). To je SERIF font u `share.ts` headlineu.
- Mjehur svijetli na samom donjem rubu, u donjoj UI zoni (beer 24–29 s).
- Hologram mozga je iza naslova i timera (beer 17,5 s), a disclaimer leži preko crijeva s niskim kontrastom (banana 13 s).
- Neusklađen callout i kartica: pizza 36 s ("0.6 g fiber" uz "The fat joins your blood later."), lentils 29,9 s ("80 ml urine" uz "In your stomach…").
- Beer: vrh kao +0:48, +0:49 i "50 min in". End card ima "Blood sugar & energy: Not tracked for this one".
- Espresso: "bedtime" nije vezan uz sat.
- Croissant "All lights green / Nothing flagged all day" pri 231 kcal i zasićenim mastima, što je slabo.
- Cola compare: "Cola: 31 fewer kcal." je jedini istaknuti zaključak.
- Beer 37–46 s: ~9 s istog kadra jetre.
- `.srt` se ne sprema uz uzorke, pa titlove i naraciju nije moguće auditirati iz renderiranih datoteka.
