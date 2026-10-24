# Kritika videa v4 (2026-10-24): fresh-eyes pregled 16 uzoraka

Autor: critic agent (Opus). Pregledani su samo uzorci iz `C:\claudework\video-samples\2026-10-24-v4\`. Nijedna datoteka koda ni uzorak nisu dirani.
Gledište: viralni producent + običan gledatelj bez znanja o znanosti + fiziolog koji provjerava činjenice.

**Metoda**
- Iz svakog videa izvučeni su frameovi: 1 fps cijeli video, 2 fps prvih 5 s i 4 fps zadnjih 6 s. Od njih su složeni kontakt listovi.
- Zvuk je izmjeren s `ebur128`, `silencedetect`, `showwavespic` i `showspectrumpic`.
- Činjenice su provjerene u kodu: `video-beats.ts`, `video-guess.ts`, `share.ts`, `stories.ts`, `content/espresso.ts` i `food/foodProduct.ts`.

**Putanje frameova.** `P` = `C:\Users\TINCUC~1\AppData\Local\Temp\claude\C--Users-Tin-Cuculic\2c75f631-d1a9-45ff-8171-9d373e2eea3f\scratchpad\critic`
- Frame za sekundu *t* je `P\<video>\f1\t{t+1:03}.jpg`. Primjer: 27 s = `t028.jpg`.
- Kontakt listovi su u `P\<video>\sheets\`, a slike zvuka u `P\<video>\wave.png` i `spec.png`.

---

## 0. Sažetak u 6 točaka

1. **Thumbnail (frame 0) ima pola hooka.** Drugi red se još "tipka" pa na frameu 0 piše "Watch where it", "Watch it  for" ili "Still in  you". U svih 16 videa prvi frame izgleda kao bug. Uz to hook singla ne kaže **što** se pije (frame 0 cole: "9 teaspoons of sugar." bez riječi cola).
2. **Usporedbe su nepoštene (P0).** Espresso 30 ml protiv piva 500 ml (**16,7× volumena**). Cola 330 ml protiv vode 250 ml (**+32 % volumena**). U oba slučaja pitanje je "which leaves your stomach first?". Odgovor je zapravo "manje tekućine izađe prije", pa će ga svaki komentator srušiti. Uz to se kartica "Faster out ≠ better for you." pojavi odmah **nakon što pobijedi espresso**, pa izgleda kao da je espresso loš (bug: `share.ts` `drawSplitGame` je prikazuje kad god alkohol postoji *bilo gdje*, a ne samo kad alkohol vodi).
3. **Isplate obećane hookom nestaju.** Pivo short nema "Don't drive / breath test" ujutro (samo prazan "NEXT MORNING"). Pivo long ima samo "Waking up at 07:00." Espresso short obeća "Still in you at bedtime", a kartica za bedtime je **prazna**. Espresso i compare espresso-vs-beer pokazuju siroče "Even before the caffeine kicks in." bez prve rečenice ("Coffee sends 1 in 3 people to the toilet.").
4. **Mrtve zone i kraj.** Svaki video ima 3–6 s istog kadra kod sna ili debelog crijeva. Svi long videi imaju 4–10 s statičnog +24:00 prije end carda (compare cola-voda 44–53 s, **10 s** istog kadra). Shortovi zadnjih ~30 % trajanja nemaju ništa novo.
5. **Normie jasnoća.** "+1.3–3.0 mmol/L vs. before", "0.46–1.15 ‰", "4.8 g sugar · Blood" i "Blood sugar up" stoje na ekranu u isto vrijeme (dva različita broja za isti šećer). "Sugar up for a while at 13:13" i "Pulse a little up at 20:36" su satovi bez konteksta. Tu su i "Coming up: building blocks." i "857 ml urine · Bladder".
6. **Zvuk je zid.** LRA je 0,5–1,5 LU. Momentary loudness je cijeli video unutar −19…−12 LUFS (vrh samo ~2 LU iznad prosjeka). Impact na vrhuncu se jedva vidi i čuje (cola: 27 s). Integrirano je −14,2…−14,4 LUFS i TP ≈ −1,5 dBFS (OK). Tišine nema. Glazba je fino izmiješana, ali SFX ne "puca".

Duljine: long 64,4–73,7 s (sve ≥ 60 s ✓), short 27,8–29,8 s ✓. Safe zone su OK (tekst je unutar ~8–72 % visine). Donjih ~25 % kadra je crno ili prazno (vidi `P\cola-long\full_00.png`).

---

## 1. Ocjene po videu (1–10) i 3 najveća problema

### Cola long: **6/10**
| # | t | Problem | Frame |
|---|---|---|---|
| 1 | 0,0 s | Thumbnail: "9 teaspoons of sugar." + "Watch where it" (nedovršeno). Ne piše cola. Ispod je prazna labela "BLOOD SUGAR PEAK" bez teksta. | `P\cola-long\head\h01.jpg`, `P\cola-long\full_00.png` |
| 2 | 33–39 s | Dva mjerača za isti šećer: "4.8 g sugar · Blood" i "Blood sugar up +0.7–1.7 mmol/L vs. before". Normie ne zna koji je "pravi". Kasnije se pojavi i "6.0 g sugar · To the liver" (47 s). | `P\cola-long\f1\t034.jpg`, `P\cola-long\f1\t048.jpg` |
| 3 | 59–64 s | "No extra urine." stoji sam, bez "Cola hydrates about as well as water." Nakon toga +24:00 bez titla (63–64 s), pa end card "Sugar up for a while at 13:13". | `P\cola-long\f1\t061.jpg`, `P\cola-long\f1\t064.jpg` |

Plus: vrhunac je na 27 s (38 % videa). To je kasno za prvi "wow", a impact je slab.

### Cola short: **5/10**
| # | t | Problem | Frame |
|---|---|---|---|
| 1 | 0 s | Isti krnji thumbnail. | `P\cola-short\head\h01.jpg` |
| 2 | 21–24 s | +13:03 → +24:00 bez titla, pa end card. 4 s se ništa ne kaže. | `P\cola-short\f1\t023.jpg` |
| 3 | 24 s+ | End card je 4 retka po ~11 px na mobitelu. "13:13" nije objašnjen. Kraj nema isplatu ("9 žličica završi gdje?"). | `P\cola-short\f1\t026.jpg` |

### Espresso long: **5/10**
| # | t | Problem | Frame |
|---|---|---|---|
| 1 | 15–19 s | **Siroče:** "YOUR COLON REACTS / Even before the caffeine kicks in." Prva rečenica ("Coffee sends 1 in 3 people to the toilet.") nedostaje, a to je najviralnija činjenica videa. | `P\espresso-long\f1\t017.jpg` |
| 2 | 51–55 s | Isplata hooka "Still in you at bedtime" je "Some caffeine is still in you." uz 11–12 mg. End card zatim kaže "Brain & sleep: Fine all day". Hook obeća problem, a model kaže da ga nema. Hostile komentar: "12 mg je manje od čokolade". | `P\espresso-long\f1\t053.jpg`, `P\espresso-long\f1\t061.jpg` |
| 3 | 46–49 s | "Your kidneys flush out what is left." Fiziološki je netočno da bubrezi izbacuju "ostatak kofeina": ~97 % razgradi jetra, a bubrezi izbace metabolite. Plus 5 s istog kadra jetre (40–44 s). | `P\espresso-long\f1\t048.jpg` |

### Espresso short: **4/10**
| # | t | Problem | Frame |
|---|---|---|---|
| 1 | 23 s | Labela "BEDTIME" je prazna. **Hook nikad nije isplaćen.** | `P\espresso-short\f1\t024.jpg` |
| 2 | 0 s | Thumbnail "Still in  you" je krnji. | `P\espresso-short\head\h01.jpg` |
| 3 | 20–28 s | +19:38 → +24:00 bez titla, pa sve zeleni end card. Nema nikakvog payoffa. | `P\espresso-short\f1\t022.jpg` |

### Pivo ×3 kroz 2 h long: **4/10** (sigurnost)
| # | t | Problem | Frame |
|---|---|---|---|
| 1 | 54–59 s | Ujutro samo "Waking up at 07:00." **Nema "A breath test can be positive" ni "Don't drive"**, iako model to ima (rule u `video-beats.ts`). To krši checklist iskrenosti §9.4 iz speca. Slijedi +24:00 bez titla. | `P\beer-3-over-2h-long\f1\t056.jpg` |
| 2 | 48–52 s | "The alcohol is gone after about 8.5 h." je rečeno kao činjenica. Mjerač pri vrhu je pokazivao do 1.15 ‰, a uz ~0,15 ‰/h gornja granica izlazi tek nakon ~10–12 h. Točka bez raspona proturječi vlastitom mjeraču. | `P\beer-3-over-2h-long\f1\t050.jpg`, `P\beer-3-over-2h-long\f1\t035.jpg` |
| 3 | 34–39 s | Vrhunac "Balance worse · Blood alcohol 0.46–1.15 ‰" je sitan, a ‰ normiju ne znači ništa. Isti kadar mozga traje 6 s. End card: "Blood sugar & energy: Not tracked for this one" sa **zelenom** ikonom (izgleda kao "OK", a za alkohol to nije zajamčeno), te "Pulse a little up at 20:36". | `P\beer-3-over-2h-long\f1\t035.jpg`, `P\beer-3-over-2h-long\f1\t063.jpg` |

### Pivo short: **3/10**
| # | t | Problem | Frame |
|---|---|---|---|
| 1 | 24 s | "NEXT MORNING" je labela **bez teksta**. Sigurnosna poruka je potpuno izbačena. | `P\beer-3-over-2h-short\f1\t025.jpg` |
| 2 | 20–21 s | "857 ml urine · Bladder", pa "816 ml". Mjehur s 857 ml je fiziološki nerealan (normalni kapacitet ~400–600 ml). Fiziolog će to odmah prozvati. | `P\beer-3-over-2h-short\f1\t021.jpg` |
| 3 | 22–23 s | +16:54 → +24:00 je jetra bez ijedne riječi. | `P\beer-3-over-2h-short\f1\t023.jpg` |

### Pizza builder long: **5/10**
| # | t | Problem | Frame |
|---|---|---|---|
| 1 | 0 s / 5 s | "A whole pizza: 2723 kcal" uz 1154 g. Običnom gledatelju "a whole pizza" znači ~550–700 g i ~1300–1800 kcal. Bez veličine to izgleda kao napuhan broj ("fake!" komentari). End card pak kaže "Pizza with extra cheese, ham and mushrooms", što se ne slaže s hookom. | `P\pizza-builder-long\f1\t006.jpg` |
| 2 | 60–66 s | "Almost all of it is still inside you." je misleading: hranjive tvari su davno apsorbirane, a "2 %" se odnosi samo na izbačeni ostatak. Gledatelj zaključi da pizza 24 h stoji neprobavljena. | `P\pizza-builder-long\f1\t063.jpg` |
| 3 | 22–27 s; 40–59 s | 6 s istog mozga ("sleepy"). "Coming up: building blocks." je kriptično. ~12 s istog kadra debelog crijeva ("20 g fiber" se ne mijenja). | `P\pizza-builder-long\f1\t025.jpg`, `P\pizza-builder-long\f1\t050.jpg` |

### Pizza short: **5/10**
Problemi: (1) krnji thumbnail ("Watch it  for"), `P\pizza-builder-short\head\h01.jpg`. (2) 21–24 s +9:34 → +24:00 bez titla, `P\pizza-builder-short\f1\t023.jpg`. (3) Brojka 2723 kcal bez veličine. Najjači trenutak "almost nothing has left after 24 h" je izbačen iz shorta.

### Kebab long: **5/10**
| # | t | Problem | Frame |
|---|---|---|---|
| 1 | 0 s | "1 kebab: 762 kcal. / Watch it  for", krnje. Hook je dosadan ("watch it for 24 hours" ništa ne obećava). | `P\kebab-long\head\h01.jpg` |
| 2 | 22–27 s, 38–40 s | 6 s istog mozga. "Coming up: building blocks." ne govori ništa. | `P\kebab-long\f1\t025.jpg`, `P\kebab-long\f1\t039.jpg` |
| 3 | 55–66 s | "The fiber reaches your large intestine." traje 5 s, pa "Almost all of it is still inside you." uz mjerač "3.3 g fiber". Gledatelj vidi 3 g i čita "almost all", što je kontradikcija. | `P\kebab-long\f1\t063.jpg` |

### Kebab short: **5/10**
(1) Krnji thumbnail. (2) 21–24 s +9:42 → +24:00 bez titla, `P\kebab-short\f1\t023.jpg`. (3) "13:47" na end cardu bez konteksta.

### Burger + krumpirići + cola long: **5/10**
| # | t | Problem | Frame |
|---|---|---|---|
| 1 | 29–42 s | **~13 s istog kadra mozga.** Sleepy (4 s) → caffeine (5 s) → "Coming up: building blocks." (3 s). Najduža mrtva zona u setu. | `P\meal-burger-fries-cola-long\f1\t036.jpg` |
| 2 | 0 s | "One meal: 611 kcal." Za burger + krumpiriće + colu to je mali meni (hostile: "611? lol"). Veličina porcija se nigdje ne vidi. Thumbnail je krnji. | `P\meal-burger-fries-cola-long\head\h01.jpg` |
| 3 | 7–13 s | Najbolja priča ("cola jures ahead, burger čeka") je samo tekst "Your stomach works at two speeds.". Vizualno se ništa ne razdvaja. | `P\meal-burger-fries-cola-long\f1\t012.jpg` |

### Meal short: **4/10**
(1) Krnji thumbnail. (2) 22–24 s bez titla, `P\meal-burger-fries-cola-short\f1\t024.jpg`. (3) Bez isplate: najjača činjenica modela ("your peak is ~21 % lower than cola alone, but 833 kcal") nije ni u jednom cutu.

### Compare espresso vs pivo long: **3/10**
| # | t | Problem | Frame |
|---|---|---|---|
| 1 | 1 s → 30 s | **Nepoštena utrka:** 30 ml protiv 500 ml (16,7×), pitanje "which leaves your stomach first?". Odgovor "First out: Espresso" je trivijalan i nema veze s presudom ("no alcohol, 213 fewer kcal"). | `P\compare-espresso-vs-beer-long\f1\t002.jpg`, `P\compare-espresso-vs-beer-long\f1\t031.jpg` |
| 2 | 29–33 s | "Faster out ≠ better for you." se pojavi odmah nakon "First out: Espresso", pa čita kao "espresso nije bolji". Obrnuta poruka. | `P\compare-espresso-vs-beer-long\f1\t031.jpg` |
| 3 | 11–19 s; 52–61 s | Siroče "Even before the caffeine kicks in." (vjerojatno zato što je "Coffee sends 1 in 3 people to the toilet." 41 zn > `CMP_PAGE` 40). Na kraju ~9 s statičnog +24:00. "Low, not zero / Blood alcohol 0.12–…" je odrezano. | `P\compare-espresso-vs-beer-long\f1\t017.jpg`, `P\compare-espresso-vs-beer-long\f1\t057.jpg` |

Plus: "Comment A or B before the end." (1–2 s), a na ekranu nigdje ne piše A ni B.

### Compare espresso vs pivo short: **3/10**
Isti problemi 1 i 2 (`P\compare-espresso-vs-beer-short\f1\t011.jpg`, `t015.jpg`). Plus 21–23 s +21:28 → +24:00 bez titla.

### Compare cola vs voda long: **4/10**
| # | t | Problem | Frame |
|---|---|---|---|
| 1 | 1 s → 30 s | **330 ml protiv 250 ml (+32 %, 80 ml više).** "First out: Water. Out of the stomach in about 1 h." Model kaže da bi voda i pri istom volumenu bila brža (pola vode za ~13 min, pola cole tek za ~30 min zbog šećera). Zaključak vjerojatno stoji, ali test **nije fer i izgleda namješteno**, a to je prvo što će netko komentirati. | `P\compare-cola-vs-water-long\f1\t002.jpg`, `P\compare-cola-vs-water-long\f1\t031.jpg` |
| 2 | 44–53 s | **10 s istog kadra** na +24:00 (dva tijela, mijenjaju se samo titlovi). Kartica "Cola hydrates about as well as water." je izgubila "the same amount" (KW1). Uz različite volumene to je dodatno misleading. | `P\compare-cola-vs-water-long\f1\t048.jpg` |
| 3 | 54 s+ | End card: dvije kartice s ~10 px tekstom, "+2.3 mmol/L", "13:13", "Answer:" i "🏆 Water wins" u 3 retka. Previše za 1 s pogleda. Mjerač "146 ml · Blood" (30–40 s) normiju ne znači ništa. | `P\compare-cola-vs-water-long\f1\t058.jpg`, `t031.jpg` |

### Compare cola vs voda short: **4/10**
Isti problem volumena (`P\compare-cola-vs-water-short\f1\t002.jpg`). "First out" se fade-a preko titla (10 s, `t011.jpg`). 19–21 s statično.

**Prosjek: 4,4/10.** Ni jedan video nije spreman za objavu. Tehnička osnova (tijelo, kamera, sat, safe zone, glasnoća) je solidna. Problem su priča, poštenje usporedbi i isplate.

---

## 2. Rangirani popravci za coding agenta

### P0: obavezno prije objave
1. **Frame 0 = cijeli hook.** U `share.ts` (kinetička tipografija, V12) frame 0 i teaser (0–0,45 s) moraju imati oba reda potpuno ispisana. Animacija smije biti samo nakon rewind-a.
   - Test: OCR-free provjera da `drawBodyFrame` na `t=0` crta oba retka sa alpha = 1.
   - Hook red 1 mora sadržavati ime proizvoda ("One can of cola: 9 teaspoons of sugar.") ako `hookFor` broj nema imenicu proizvoda.
2. **Fer usporedbe** (`video-guess.ts` `chooseGuess`):
   - Pitanje `stomach` dopustiti samo kad su volumeni/mase unutar ±10 % (dodati `GuessSide.amount`). Inače preskočiti na `blood`/`sugar` ili na novi tip `tomorrow` ("Which one is still in you tomorrow?").
   - Kod zadanih parova (cola vs voda) postaviti vodu na **330 ml** u `products.ts`/Compare presetu kad je druga strana limenka, ili renderirati obje strane po istom volumenu.
   - Test: `chooseGuess` s 30 ml vs 500 ml ne vraća `stomach`.
3. **"Faster out ≠ better for you."** prikazati samo kad je pobjednik utrke strana s alkoholom (`share.ts` `drawSplitGame`: uvjet `[o.a,o.b][ans.winner].alcohol`). Test u `video-hook.test.ts`.
4. **Sigurnosna jutarnja kartica za alkohol se nikad ne izbacuje.** U `video-plan.ts`, kad postoji trenutak "Next morning" s alkoholom, njegovi `lines` moraju uključiti karticu s "breath test"/"drive" u oba cuta. U shortu treba zamijeniti "Waking up at 07:00." tom karticom. Prazna labela (samo kicker) nikad ne smije biti prikazana.
   - Test: za `beer-3-over-2h` short i long plan sadrži `/breath test|drive/`.
5. **Nikad prazan kicker / siroče.** Planer ne smije emitirati stranicu bez teksta ispod labele (pivo short 24 s, espresso short 23 s, sva 24:00 mjesta). Druga kartica rule-a (npr. "Even before the caffeine kicks in.", "Cola hydrates…") ne smije ići bez prve.
   - Uzrok u compareu je `CMP_PAGE = 40`, a "Coffee sends 1 in 3 people to the toilet." ima 41 znak. Treba povisiti na 44 ili skratiti u "Coffee sends 1 in 3 to the toilet." (35 zn).
   - Test: svaka `pages[i][0]` mora biti prva kartica svog rule-a.
6. **Isplata hooka mora biti u svakom cutu.** Ako hook ima "bedtime", "07:00" ili "24 hours", trenutak koji ga isplaćuje je obavezan u short planu (kao `peakMin`) i mora imati vlastitu karticu. Test po hooku.
7. **Ubiti statični +24:00.** Nakon +24:00 je najviše 1,2 s do end carda, a bez titla najviše 0,8 s. Tih 4–10 s treba dati sadržaju ili skratiti video (long ostaje ≥ 60 s).
   - Test: najveći razmak bez promjene kadra **ili** teksta ≤ 3,2 s (spec §2.3 to traži, ali ga uzorci ne zadovoljavaju: meal 29–42 s, compare cola 44–53 s).
8. **Mjehur.** Mjerač "ml urine · Bladder" ograničiti fiziološki (mokrenje kad pređe ~400 ml, kao u long pivu na 6:18 → 8:29) ili ga preimenovati u "Urine made so far". 857 ml u mjehuru je greška.
9. **Raspon ili ograda za "alcohol is gone after about X h".** Kad mjerač pokazuje raspon, kartica mora reći "In a typical body: about 8.5 h. Some need up to ~12 h." Gornja granica se računa iz istog raspona. Već postoji kartica "Livers differ…", pa je treba uvijek staviti uz "gone".
10. **Kofein → bubrezi.** "Your kidneys flush out what is left." zamijeniti s "Your kidneys flush out its broken-down pieces." (u skladu s modelom: "breakdown products").
11. **Hidracija.** Rule u `video-beats.ts` vratiti na "Cola hydrates about as well as the same amount of water." (8 riječi). Kvalifikator je obavezan (spec §9.7).

### P1: prije skaliranja
12. **Jedan broj po stvari.** Ukloniti "g sugar · Blood" i "g sugar · To the liver" dok je vidljiv mjerač "Blood sugar up". Normie treba jedan broj, i to u riječima: "Blood sugar: up a lot / a little". mmol/L i ‰ ostaju sitni ispod.
    - Za alkohol u glavni red staviti razinu u riječima ("Like 2–3 drinks' worth", "Balance worse"), a ‰ manjim fontom.
    - Odrezani "Blood alcohol 0.12–…" mora stati (fitWrap).
13. **End card bez satova.** "Sugar up for a while at 13:13" → "Sugar up for ~1 h after drinking". Koristiti `elapsed` (+0:20), ne sat. Font end carda u compareu je ≥ 28 px na 1080 (sad ~20 px).
14. **Teaser kartice moraju obećavati.** "Coming up: building blocks." → "Coming up: why you get sleepy." ili "Coming up: 24 h later, still inside." Whitelist naslova za tease, a ne `stopValue ≥ 3` bilo što.
15. **"Almost all of it is still inside you."** → "Only 2 % has come out so far." ili "Most of it isn't out yet: ~29 h mouth to toilet." Nema kontradikcije s mjeračem od 3 g.
16. **Veličina porcije u hooku:** "A 1.1 kg pizza: 2723 kcal." / "Small burger meal: 611 kcal.". Ime u hooku i na end cardu moraju se slagati.
17. **Brain/sleep zeleno nasuprot hooku.** Kad je espresso end card "Fine all day", hook "Still in you at bedtime" mora biti iskren: "One espresso: 1/5 still in you at bedtime." (iz modela: 12/63 mg) ili treba odabrati hook B ("Coffee sends 1 in 3 to the toilet.").
18. **Beer end card** "Blood sugar: not tracked" ne smije biti zelen. Treba sivu ikonu ili sakriti red.
19. **Zvuk: dinamika.** Music bus mora ducking −6 dB oko `peak`/`verdict` (spec A12). Impact treba biti ≥ +6 LU momentary iznad prosjeka (sad +2). U QA dodati `ebur128` momentary-max − integrirano ≥ 5 LU, a LRA cilj 3–6 LU.
20. **Compare intro:** "Comment A or B" → "Comment: cola or water?". Imena moraju biti ono što piše na ekranu.
21. **Vrhunac ranije:** prvi impact u long cutu ≤ 15 s (cola 27 s, pivo 34 s). Skratiti uvodni želudac.

### P2
22. Donjih 25 % kadra iskoristiti (velik scoreboard / race bar u singlu ili niži kadar tijela). Sad je prazno.
23. Meal: vizualno razdvojiti colu (brzo) i burger (sporo) u želucu, dvije boje i dva ml mjerača.
24. Dodati "Sound effects only" opciju (spec §5) za trending audio.
25. Pinned-comment prijedlozi u share dialogu (spec §7). Trenutno ih nema u videu.

---

## 3. Top 5 ideja "više viralno", poštene i u postojećem engineu

1. **"Same glass" race** (cola vs voda, isti 330 ml): split, oba želuca se prazne s race barom i countdown "ml left". Model već ima `stomach` seriju. Komentar-okidač je pošten ("Team cola or team water?"), a test je fer.
2. **"Still in you tomorrow" cliffhanger za alkohol:** hook "3 beers at 21:00. / Still in your blood at 07:00?" (pitanje). Payoff je kartica "A breath test can be positive." uz velik mjerač i crveni impact. Upozorenje je sam vrhunac, a ne fusnota. Alkohol nikad ne izgleda "cool".
3. **Countdown-sat kao lik:** veliki "+X h" sat koji se vrti noću i lupa na isplati ("07:00"), plus "skipping the night" ratchet (A14 već postoji). Gledatelj čeka sat, a to je retention bez novih tvrdnji.
4. **Serija "Guess the hours"** za hranu: "How long until a pizza leaves your body?" Komentari nagađaju, a payoff je "~29 h, normal is 14–58 h" (CO1, s rasponom). Isti engine, isti planer, nova `guess` vrsta `transit` za single video.
5. **Toilet hook za kavu (hook B iz speca):** "Coffee sends 1 in 3 to the toilet." / "Even decaf." (F5 kaže "with decaf too"). Vizual je debelo crijevo koje pulsira u 4. minuti. Kratko, smiješno, dijeli se ("tag your coffee friend"), istinito i s izvorom.

---

## 4. Zvučni nalazi (brojke)

| Video | I (LUFS) | LRA (LU) | TP (dBFS) | M min…max |
|---|---|---|---|---|
| cola-long | −14,3 | 1,5 | −1,5 | −19,3…−12,3 |
| compare-cola-vs-water-long | −14,3 | 0,6 | −1,6 | −17,8…−12,2 |
| beer-short | −14,3 | 0,7 | −1,6 | −17,0…−12,3 |
| ostalih 13 | −14,2…−14,4 | 0,5–0,8 | −1,5…−1,6 | n/a |

- Spektrogram cole (`P\cola-long\spec.png`) pokazuje širokopojasni impact na ~27 s (sinkron s PEAK frameom) i noćni ratchet 53–63 s.
- Sve ostalo je kontinuirana glazba ispod ~2 kHz. Waveform (`P\cola-long\wave.png`) je ravna traka s tankim klikovima: SFX su prisutni, ali ne nose emociju.
- Kraj: fade na ~0 u zadnjoj sekundi pa nagli ulazak hita u loopu. Prihvatljivo, ali tape-stop (A20) bi bolje prodao loop.
