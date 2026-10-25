# Ponovna kritika videa v5 (2026-10-25)

Autor: critic agent (Opus). Nastavak na `video-critique-2026-10-24.md`. Pregledano je 16 uzoraka iz `C:\claudework\video-samples\2026-10-24-v5\`. Nijedna datoteka koda ni uzorak nisu dirani.

**Metoda** je ista kao u v4:
- frameovi 1 fps cijeli video, 2 fps prvih 5 s i 4 fps zadnjih 6 s, složeni u kontakt listove;
- zvuk: `ebur128`, `silencedetect`, waveform i spektrogram;
- činjenice provjerene u kodu (`video-body.ts` `sugarPlain`/`bacPlain`, `video-beats.ts` gone-range, `science/alcoholClock.ts`).

**Putanje frameova.** `P` = `C:\Users\TINCUC~1\AppData\Local\Temp\claude\C--Users-Tin-Cuculic\2c75f631-d1a9-45ff-8171-9d373e2eea3f\scratchpad\critic\v5`
- Frame za sekundu *t* je `P\<video>\f1\t{t+1:03}.jpg`. Primjer: 27 s = `t028.jpg`.
- Kontakt listovi su u `P\<video>\sheets\s1fps_0N.jpg`. List 01 = 0–19 s, 02 = 20–39 s, 03 = 40–59 s, 04 = 60 s+.

**Ograničenje:** cola, pizza, kebab i meal short pregledani su samo preko pregleda svakih 2 s (`P\shorts_overview.jpg`), ne frame po frame.

---

## 0. Presuda u jednoj rečenici

Veliki napredak (prosjek 4,4 → **6,2/10**), ali **nijedan video još nije spreman za objavu bez ijedne izmjene.** Najbliže su espresso long, pizza long i kebab long: kod njih su ostale samo P1 stavke.

### Spremno za objavu kakvo jest?
| Video | Ocjena v4 → v5 | Spremno? | Što blokira |
|---|---|---|---|
| cola long | 6 → **7** | NE | P0-3 (siroče "No extra urine."), P0-4 (dva broja za šećer) |
| cola short | 5 → **5** | NE | P0-5 (hook "Watch where it goes" nema isplatu; 11 s → 24 h bez riječi) |
| espresso long | 5 → **7,5** | uvjetno DA (nakon P1-1) | antiklimaks hooka, 6 s mozga |
| espresso short | 4 → **6,5** | uvjetno DA | kao long |
| pivo ×3 long | 4 → **6** | NE | **P0-1** ("You may fall asleep faster." bez loše polovice), P0-2 (raspon 6–10 h) |
| pivo short | 3 → **6,5** | uvjetno DA (nakon P1-2) | % BAC |
| pizza long | 5 → **7** | uvjetno DA | 29 h bez raspona; ime na end cardu ≠ hook |
| pizza short | 5 → **6,5** | uvjetno DA | kao long |
| kebab long | 5 → **6,5** | uvjetno DA | 10 s statično na 24 h |
| kebab short | 5 → **6** | uvjetno DA | |
| meal long | 5 → **6** | NE | P0-6 (teaser "building blocks", 13 s mozga i dalje) |
| meal short | 4 → **6** | uvjetno DA | |
| compare espresso vs pivo long | 3 → **5,5** | NE | P0-7 (utrka koju "pobjeđuje" pivo), P0-8 (end card 8 s) |
| compare espresso vs pivo short | 3 → **5,5** | NE | P0-7 |
| compare cola vs voda long | 4 → **6** | NE | P0-4 (+45 % ≠ 26–62 %), P0-9 (13 s istog kadra), P0-10 (tanka voda) |
| compare cola vs voda short | 4 → **6** | NE | P0-4, P0-10 |

"Uvjetno DA" znači da se može objaviti ako vlasnik prihvati P1 rizik. Za cilj "nula grešaka" najprije treba popraviti P1-1/P1-2.

---

## 1. Provjera v4 stavki (fixed / partly / not fixed)

| # (v4) | Stavka | Status | Dokaz |
|---|---|---|---|
| P0-1 | Frame 0 = cijeli hook + ime proizvoda | **FIXED** | Svih 16: npr. "One can of cola: 9 teaspoons of sugar. / Watch where it goes." na frameu 0 (`P\cola-long\head\h01.jpg`). Teaser je sada vrhunac (+0:19, +2:03, +1:45) s ◀◀ premotavanjem. |
| P0-2 | Fer usporedbe | **FIXED / PARTLY** | Voda je 330 ml (`P\compare-cola-vs-water-long\f1\t002.jpg`). Espresso vs pivo više nije "stomach" nego "which leaves your blood first?" (volumen tu nije bitan). Novi problem utrke opisan je u P0-7. |
| P0-3 | "Faster out ≠ better for you." samo kad vodi alkohol | **FIXED** | Pojavi se nakon "First out: Beer." (`P\compare-espresso-vs-beer-long\f1\t045.jpg`), a u cola-vs-voda je nema. |
| P0-4 | Sigurnosna jutarnja kartica za alkohol | **FIXED** (u novom obliku) | Long: "Don't drive." na vrhuncu (23–25 s) + "A hangover can still make you drive worse." (50–53 s). Short: isto (`P\beer-3-over-2h-short\f1\t016.jpg`). "Breath test can be positive" je nestao jer model sada kaže "At 07:00, the alcohol should be gone." To je konzistentno s modelom za ovo vrijeme pića. |
| P0-5 | Nema praznog kickera / siročadi | **PARTLY** | Colon je OK ("Coffee sends 1 in 3 to the toilet." pa "Even before the caffeine kicks in."). Siročad i dalje postoje: cola long "No extra urine." sam (46–49 s, `P\cola-long\f1\t048.jpg`), pivo long "You may fall asleep faster." sam (31–36 s, **sigurnosno**, vidi P0-1). |
| P0-6 | Isplata hooka u svakom cutu | **PARTLY** | Espresso short ima "About a fifth is still in you." ✓ (`P\espresso-short\f1\t017.jpg`). Pizza i kebab short imaju "Only 2 %/3 % … out yet" ✓. **Cola short** obeća "Watch where it goes", a nakon vrhunca ide +0:30 → +11:28 → +24:00 bez ijedne kartice (`P\cola-short\f1\t012.jpg`–`t015.jpg`). |
| P0-7 | Ubiti statični +24:00 | **PARTLY** | Singlovi: +24:00 sada nosi karticu ("Only 2 % …", "Food takes about 29 hours"). Ali isti kadar crijeva traje **~10 s** (pizza 47–57 s, kebab 50–59 s, meal 49–58 s). Compare cola-voda: **13 s** istog kadra na +24:00 (46–59 s, `P\compare-cola-vs-water-long\sheets\s1fps_03.jpg`), a mijenjaju se samo titlovi. |
| P0-8 | Mjehur 857 ml | **FIXED** | "531 ml urine · Made in 3 h: more than one pee" i "159 ml · Urine made in the last 3 h" (`P\beer-3-over-2h-long\f1\t034.jpg`). Pošteno. |
| P0-9 | Raspon za "alcohol gone" | **PARTLY** | "The alcohol is gone after about 6–10 h." Raspon postoji, ali gornja granica se ne slaže s vlastitim mjeračem (P0-2). |
| P0-10 | Kofein → bubrezi | **FIXED** | "Your kidneys flush out its broken-down pieces." (`P\espresso-long\f1\t041.jpg`) |
| P0-11 | Hidracija "the same amount" | **PARTLY** | Compare: "Cola hydrates like the same amount of water." ✓. Single cola: samo "No extra urine." ✗ |
| P1-12 | Jedan broj po stvari | **PARTLY** | ‰ i mmol/L više ne stoje kao glavni red. I dalje se na ekranu istovremeno vide "4.3 g sugar · In your blood" i "Blood sugar dip · a little below usual" (cola 28–30 s, `P\cola-long\f1\t029.jpg`): grami šećera u krvi dok krivulja kaže "ispod normale". |
| P1-13 | End card bez satova | **FIXED** (oblik) | "Sugar up for a while at +0:13", "Pulse a little up at +1:36". "+0:13" je i dalje šifra: treba "13 min after the first sip". |
| P1-14 | Teaser kartice koje obećavaju | **PARTLY** | "Coming up: bedtime." ✓ (cola). Meal long još ima "BUILDING BLOCKS / Protein pieces in your blood peak now." (5 s), pizza long isto (8 s). |
| P1-15 | "Almost all … still inside you" | **FIXED** | "Only 2 % of the leftovers are out yet." + "Food takes about 29 hours, mouth to toilet." (vidi §2c) |
| P1-16 | Veličina porcije | **FIXED** | "A whole pizza (1154 g): 2723 kcal." End card i dalje kaže "A whole pizza with extra cheese, ham and mushrooms" (dulji naziv, nije greška). |
| P1-17 | Espresso hook nasuprot "Fine all day" | **FIXED** | "A fifth is still in you at bedtime." pa "Too little to affect your sleep." Iskreno, ali je antiklimaks (P1-1). |
| P1-18 | "Not tracked" zeleno | **FIXED** | Siva ikona (`P\beer-3-over-2h-long\f1\t064.jpg`). |
| P1-19 | Dinamika zvuka | **FIXED** | LRA 3,3–5,2 LU (bilo je 0,5–1,5). Momentary max −7,0…−7,6 LUFS, a prosjek −14,5…−15,4, pa impact ima +7 LU. Integrirano −14,1…−14,3 LUFS. |
| P1-20 | "Comment A or B" | **FIXED** | "Comment: cola or water?" / "Comment: espresso or beer?" |
| P1-21 | Vrhunac ranije | **FIXED** | Teaser na frameu 0 je vrhunac. Cola PEAK je na 19 s (bio 27 s), pivo na 13 s (bio 34 s). |

---

## 2. Ciljane provjere

### a) "BAC %": faktor konverzije
- Model računa alkohol u **g/L** (`alcoholClock.ts`, ‰ u kodu = g/L). `bacPlain` dijeli s 10. 1 g/L = 0,1 g/dL = **0,1 % BAC** (US/UK konvencija g/100 ml). **Faktor je točan.**
- Ali:
  1. **Preciznost.** `toFixed(2)` na malim vrijednostima gubi informaciju. Jedno pivo daje "0.01–0.02 %" (`P\compare-espresso-vs-beer-long\f1\t027.jpg`): 0,015 se prikaže kao "0.01", pa raspon izgleda kao dvostruka razlika iz zaokruživanja.
  2. **Fiziolog:** 500 ml piva (~20 g alkohola) prema Widmarku daje vrh ~0,2–0,4 g/L (0,02–0,04 %) natašte. Gornja granica 0,02 % je na donjem rubu. Treba provjeriti `bacRange` za jedan napitak (moguće je da je model "s hranom").
  3. **Normie:** za europsku publiku "0.12 %" zvuči kao "skoro ništa" (pivo ima 5 %), a "‰" je ono što zna iz zakona (0,5 ‰). Riskiramo komentar "0.12 % lol to je ništa". Rješenje je u P1-2.

### b) "% above usual" za šećer
- Matematika je OK: `(Δ mmol / 5,0) × 100`; +1,3–3,1 mmol/L daje "26–62 % above usual".
- **Greška:** end card u compareu kaže "**Blood sugar: up to +45 %**" (`P\compare-cola-vs-water-long\f1\t063.jpg`), a mjerač u istom videu kaže "26–62 %". Dva različita broja za isti vrh (vjerojatno sredina raspona protiv raspona). Za "zero mistakes" to je **P0-4**.
- **Iskrenost:** +60 % zvuči alarmantno, a vrh ~8 mmol/L nakon 35 g šećera je **normalan odgovor zdravog čovjeka**. Uz broj treba sidro ("normal after a sweet drink") ili riječi ("a big rise"), inače izgleda kao strašenje. Pizza "30–70 %" isto.

### c) "Only 2 % of the leftovers are out yet"
- Činjenično je u skladu s modelom (izbačeni ostatak/rezidua do 24 h) i odmah ga prati "Food takes about 29 hours, mouth to toilet." Dobra isplata hooka "Where is it 24 hours later?".
- **Rupe:**
  1. "29 hours" bez raspona. Izvor CO1 kaže medijan 28,7 h, **normalno 14–58 h**. Treba "about 29 h (14–58 h is normal)" ili "1–2 days".
  2. "Leftovers" nije definiran. Normie može misliti na "ostatke pizze". Bolje: "Only 2 % has come out the other end."
  3. Mjerač "22 g fiber" uz "2 %" je treći broj. Taj mjerač dok traje ta kartica treba sakriti.

### d) Statični end card (4–6 s)
Izmjereno iz frameova:
| Video | End card (punih, mirnih) | Ocjena |
|---|---|---|
| cola long | ~5 s (59–64 s) | OK |
| pivo long | ~5 s | OK |
| espresso long/short | ~5 s / ~4 s | OK |
| pizza long | ~5 s | OK |
| compare cola-voda long | **~7 s** (61–68 s) | predugo |
| compare espresso-pivo long | **~8 s** (65–73 s) | predugo |
| compare shorts | ~5–6 s | OK |

- 4–5 s za 4 reda + CTA je razumno (čitanje ~3 s), ali **ništa se ne miče**. Uz 10–13 s mirnog +24:00 prije toga, posljednjih ~18 s compare-cola-voda long je praktički still. To je najveći rizik swipe-awaya u setu.
- U compareu treba skratiti na ≤ 5 s i dodati suptilan pokret (lampice pulsiraju jedna po jedna, presuda "pop").

### e) Tanki tekst za 330 ml vode
- Voda u long compareu ima samo 4 kartice u 60 s:
  1. "330 ml of water." / "0 kcal in total." (2–14 s)
  2. "Your small intestine absorbs it within minutes." stoji **~28 s bez promjene** (17–45 s, `P\compare-cola-vs-water-long\f1\t030.jpg`)
  3. "Your kidneys filter the extra water."
  4. "It collects in your bladder for hours."
- **Nedostaje ključna činjenica igre:** "Water barely stops here: half moves on within ~13 minutes." Bez nje gledatelj ne zna **zašto** je voda prva. Kod 250 ml ta je kartica postojala. Sumnja: tekst priče za vodu ovisi o volumenu, pa za 330 ml pada u granu "generic" bez stomach rule-a.
- Cola strana ima ~10 kartica, pa je split vizualno neuravnotežen (lijevo se priča, desno 28 s isto).

### f) "Alcohol gone about 6–10 h" nasuprot modelu
- Kod (`video-beats.ts` r. 190–197) uzima raspon satova iz poglavlja ("between 04:51 and 09:18"), a model ga računa samo iz **brzine jetre** 0,10–0,20 g/L/h (`ELIM_RANGE`) na **tipičnoj** krivulji.
- Mjerač pri vrhu istovremeno pokazuje **0.05–0.12 %**, a taj raspon dolazi od tijela (masa, spol).
- Kombinacija "visok vrh 1,2 g/L + spora jetra 0,10 g/L/h" daje ~12 h nakon vrha, odnosno ~13–14 h od prvog gutljaja. Kartica kaže 10 h.
- Na **mjeraču u 7:29 piše "Low, not zero · 0.01–0.02 %"** (`P\beer-3-over-2h-long\f1\t038.jpg`), a 1 s kasnije kartica kaže "gone after 6–10 h". Unutar raspona, ali hostile komentar napiše: "your own gauge says not zero at 7.5 h and the upper bound says 10, yet a big guy at 0.12 % needs 12+".
- **Model je interno konzistentan za tipično tijelo, ali raspon kartice ne pokriva raspon mjerača.** Za alkohol (sigurnost) gornja granica mora biti konzervativna. Vidi P0-2.

---

## 3. NOVI problemi koje su uvele izmjene
1. **Pivo long: "You may fall asleep faster." bez druge polovice** ("Later, your sleep is lighter and more broken."). Na ekranu stoji ~6 s (`P\beer-3-over-2h-long\sleep_30-37.jpg`). Jedina rečenica o spavanju u videu je *pozitivna* za alkohol. Krši spec §9.3/9.4 ("alkohol nikad ne izgleda bolje"). **P0.**
2. **Compare espresso vs pivo: utrka "out of blood" pobjeđuje pivo.** Žuti banner "First out: Beer." s udarcem, pa "✓ OUT" na pivu (`P\compare-espresso-vs-beer-long\f1\t045.jpg`).
   - "Faster out ≠ better" pomaže, ali **igra nagrađuje alkohol**, a gledatelj koji je pogodio "beer" osjeća da je "pobijedio".
   - Prag "out" za kofein je **< 10 mg** (proizvoljan, ne piše nigdje). Kofein nikad ne izađe (4 mg na 24 h), pa je utrka strukturno namještena da pivo pobijedi.
3. **Compare cola-voda end card +45 % ≠ mjerač 26–62 %** (gore).
4. **"Blood sugar dip · a little below usual" uz "4.3 g sugar · In your blood"** (cola 28–30 s). Novi tekst "below usual" jasno je u sukobu sa starim gram-mjeračem.
5. **"+0:13" na end cardu:** format sata-od-početka se vidi i u hooku teasera ("+0:19 ◀◀"), ali na end cardu bez riječi "after" nije jasan.
6. **"A hangover can still make you drive worse."** u compareu nakon **jednog** piva od 500 ml (`P\compare-espresso-vs-beer-long\sheets\s1fps_04.jpg`). Fiziolog: mamurluk od ~20 g alkohola nije tipičan, pa je tvrdnja pretjerana za tu dozu. Treba je vezati uz dozu (npr. ≥ 40 g) ili zamijeniti s "Don't drive after drinking." P1.
7. **True peak:** compare-espresso-vs-beer-short ima sample peak −1,0 dBFS. True peak može prijeći −1 dBTP nakon AAC transkodiranja na platformi. P2: cilj TP ≤ −1,5.

---

## 4. Rangirani popravci (v5)

### P0: prije objave
1. **Pivo long: dovršiti spavanje.** Kartica "You may fall asleep faster." mora uvijek ići u paru s "Later, your sleep is lighter and more broken." (ista RULE, dvije kartice, `video-plan.ts` ne smije odrezati drugu).
   - Test: za svaki alkoholni plan, ako je prisutna "fall asleep faster", prisutna je i `/sleep is .*(broken|lighter)/`.
2. **Raspon "gone" pokriva i tijelo, ne samo jetru.** Gornja granica = vrijeme kad *gornja* krivulja mjerača (bacRange hi) padne na 0 uz `ELIM_RANGE.slow`. Donja = donja krivulja uz `fast`. Očekivano ~5–13 h za ovaj uzorak.
   - Test: `goneSpan.hi ≥ (bacHiPeak / 0.10) + tPeak`.
   - Ako je raspon širi od 5 h, napisati "after about 6–13 h, longer for some".
3. **Cola single: "No extra urine." uvijek s parom** "Cola hydrates like the same amount of water." (ista provjera kao u compareu). Općenito: test da druga kartica rule-a nikad ne nedostaje kad je prva prisutna i obrnuto, za sve rule s dvije kartice.
4. **Jedan broj za šećer.**
   - End card compare (`drawSplitOutro`) mora koristiti isti `sugarPlain` raspon kao mjerač ("up to +26–62 %") ili riječi.
   - Sakriti "g sugar · In your blood"/"On its way to the liver" mjerače kad je vidljiv "Blood sugar up/dip".
   - Test: `numberConflict` proširiti na `%`.
5. **Cola short: isplata hooka.** Između vrhunca i +24:00 mora biti barem jedna kartica "gdje je otišlo" ("Your body burns half the fruit sugar." ili "The sugar dip …"). Zabrana glide-a > 6 s bez kartice.
6. **Meal long / pizza long:** ukloniti "BUILDING BLOCKS / Protein pieces in your blood peak now." iz prioritetnih trenutaka. Taj prostor dati drugom trenutku ili skratiti video (ostaje ≥ 60 s).
7. **Compare espresso vs pivo: promijeniti pitanje.** Ne "which leaves your blood first?" (pobjeđuje alkohol, prag za kofein je proizvoljan). Bolje: "Guess: which is still in you at bedtime?" (oba modela to znaju) ili bez utrke, samo presuda.
   - Ako utrka ostaje: prag mora pisati na ekranu ("out = under 10 mg") i pivo ne smije dobiti udarac/žuti banner. Neutralni sivi banner, a "Faster out ≠ better for you." **u istom banneru**, ne 3 s kasnije.
8. **Compare long end card ≤ 5 s** (sada 7–8 s), s minimalnim pokretom (lampice pop 0,35 s razmak, presuda scale-in).
9. **Compare cola-voda long: 13 s istog kadra na +24:00.**
   - Kartice bubrega pokazati na njihovoj minuti (12:00), ne na +24:00.
   - Kamera se mora maknuti barem svake 3 s (bubrezi → mjehur → wide).
   - Test: najveći razmak promjene kamere ≤ 3,2 s.
10. **Voda 330 ml: vratiti "Water barely stops here. / Half moves on within ~13 minutes."** Provjeriti zašto `products.ts`/`stories.ts` za 330 ml ne daje taj tekst. Dodati 1–2 kartice na desnu stranu (17–45 s), npr. "Water reaches your blood within 5 minutes." (rule postoji).

### P1
1. **Espresso hook** je iskren, ali antiklimaks. A/B test: hook B "Coffee sends 1 in 3 to the toilet." (F5, s "even decaf" iz izvora).
2. **Alkohol u riječima + ‰ za Europu.**
   - Glavni red mjerača: "Over the 0.5 ‰ driving limit" / "Under the limit, not zero".
   - Mali red: "0.5–1.2 ‰ (0.05–0.12 % BAC)".
   - Za jedno pivo koristiti 3 decimale u % ili ‰ s 1 decimalom (`toFixed` 3).
3. **Šećer "% above usual"** dobiva sidro: "a normal rise after sugar" ili riječi "small / big rise". Spriječiti dojam da je +60 % bolest.
4. **"Food takes about 29 hours"** → "about 29 h (14–58 h is normal)". "Leftovers" → "Only 2 % has come out so far.". Sakriti "g fiber" mjerač na toj kartici.
5. **"A hangover can still make you drive worse."** samo kad je alkohol ≥ ~40 g.
6. **End card "+0:13"** → "13 min in" / "1 h 36 min in".
7. **Mrtve zone 5–6 s** koje su ostale: mozak "sleepy" (pizza 8–12 s, kebab 8–12 s, meal 25–29 s), mozak "bedtime" (cola 44–50 s), "The fiber reaches your large intestine." (5–7 s). Treba mikro-beat (kamera, puls) svake ≤ 3 s.
8. **Provjeriti `bacRange` za jedno pivo** prema Widmarku (očekivano 0,02–0,04 % natašte).

### P2
1. TP cilj ≤ −1,5 dBTP (compare-espresso-beer-short je −1,0).
2. Pizza end card naziv skratiti na ime iz hooka.
3. Donjih ~25 % kadra u singlu i dalje je prazno ili tamno.

---

## 5. Zvuk (v5)
| | v4 | v5 |
|---|---|---|
| Integrirano | −14,2…−14,4 LUFS | −14,1…−14,3 LUFS ✓ |
| LRA | 0,5–1,5 LU | **3,3–5,2 LU** ✓ |
| Momentary max − prosjek | ~+2 LU | **~+7 LU** ✓ (impact se čuje) |
| Sample peak | −1,5…−1,6 | −1,0…−1,7 (jedan na granici) |

Udarci se sada vide i u waveformu (`P\cola-long\wave.png`). Zvuk više nije problem.
