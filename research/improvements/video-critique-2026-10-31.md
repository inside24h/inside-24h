# Kritika d: rundi 14 i 14b prema 10/10 launch baru (2026-10-31)

Autor: critic agent (Opus). Pregledan je trenutni kod: commit 010b4dc. Kod nije diran i ništa nije commitano. Rubrika a–i je ista kao u `video-critique-2026-10-30-c.md`. Odbitci: P0 = −2, P1 = −1, P2 = −0,5.

**Uzorci:** `C:\claudework\video-samples\2026-10-31-critique14\` sadrži:
- 22 MP4 datoteke:
  - set od 18 videa iz kritike c;
  - compare cola vs orange juice s opcijom "Same amount";
  - nova nasumična stavka: sweet potato;
  - hook B za beer ×1 (TT) i cinnamon roll (Shorts);
- `sheets/`: kontakt listove, 2 s, sa safe zonom;
- `frames/`:
  - `ends.png` i `ends2.png`: 16 end cardova s herojskim brojem;
  - `g1.png`: hookovi i ključni frameovi;
  - `ceb.png`: espresso-pivo chip;
  - `wb.png`: vino-pivo 27–51 s;
  - `cwend.png`: kraj cola-voda;
- `render-log.txt`: planove, kartice, cue-ove i opise.

Render je napravljen kroz pravi UI s jednim headless Chromeom i privremenim Viteom. "Same amount" je kliknut u Compare dijalogu. Na kraju je ostalo 0 node procesa.

## Tehnika
- Svih 22 je 1080×1920, 30 fps, 0 grešaka u konzoli i 0 crnih ili mrtvih kadrova (deadzone detektor).
- Glasnoća −14,1 do −14,5 LUFS, TP ≤ −1,7 dBTP.
- Brzina čitanja je ≤ 2,6 w/s. Tekst je u safe zoni, a race bar je na y ≈ 1410–1470.
- **Duljine:** TT 62,2–71,5 s ✓, Reels 49,7 / 50,7 s ✓, Shorts:

| Shorts | trajanje | pravilo 23–30 s |
|---|---|---|
| kaiser roll | **30,7 s** | ✗ |
| red wine hook B | **30,9 s** | ✗ |
| cinnamon roll hook B | **30,2 s** | ✗ |
| oat milk | 26,0 | ✓ |
| cola vs water | 26,4 | ✓ |

## 1. Provjera nalaza iz kritike c, na frameovima

| Nalaz c | Status | Dokaz |
|---|---|---|
| DC-1 decaf: prazan hod, nema priče | **FIXED** (vrhunac je i dalje slab, vidi D-1) | Hook "Is decaf really caffeine-free? Watch your blood find out." Odgovor na 31 s: "Yes, a little: about 3 mg." / "A regular cup has about 100 mg." Nema chipa duljeg od ~4 s (`sheets/decaf-…-sheet2/3`). |
| O-1 oat milk bez odgovora | **FIXED** | 16 s: "About 2× the rise of cow's milk." (`g1.png`) |
| C13-1 chip "Peak" umjesto "gone" | **FIXED** | 37–38 s: "NEXT · +2:46 · Beer: when it is finally gone" (`ceb.png`) |
| W-1 "Faster out ≠ better" | **FIXED** | Chip više nije prisutan (`wb.png`). |
| SA-1 salmon 5 s bez kartice | **FIXED** | Razmak od chipa do stopa je 3,3 s (52,7 → 56,0). |
| G-2 slabi hookovi | **FIXED** za beer i wine B | Beer A: "Where does the alcohol go?", B: "How long does it stay in your blood?". Crepes sada imaju broj, ali nemaju ime hrane (vidi H-1). |
| CW-1 cola-voda bez igre | **FIXED** | "Guess: which leaves your stomach first?" Reveal "First out: Water." je na 14,9 s (56 %). |
| W-2 vino bez sigurnosnog reda | **FIXED** | "Less alcohol: Red wine (16 g vs 20 g). Both: don't drive." |
| G-3 herojski broj na end cardu | **FIXED**, ali s novom greškom kod cole (vidi N-1) | |
| K-1 kaiser broj | **FIXED** | Kartica "About 7 teaspoons of sugar, from starch." |
| PZ-1 pizza veličina | **FIXED** | "A whole 14-inch pizza." |
| P2-T1 Shorts na rubu minimuma | **PREBAČENO PREKO GORNJEG RUBA** | 3 Shortsa su > 30 s (vidi L-1). |
| SA-2 salmon spore kartice | **NOT FIXED** | "Then it joins your blood." i "Blood fat is highest around now." traju po 6,1 s pri 0,8–1,0 w/s (40–52 s). |
| G-1 donja četvrtina kadra | **FIXED** (14b) | Tijelo je vidljivo i ima floor glow. |

## 2. Sanity-check brojeva (DB `fooddb.json`, vrijednosti na 100 g × porcija)

| Tvrdnja u videu | Izračun | Presuda |
|---|---|---|
| Pizza "14-inch (1154 g): 2723 kcal" | 2723/1154 = 236 kcal/100 g, a cheese pizza u bazi ima 266. Kalorije po gramu su konzistentne. USDA cijela 14" cheese pizza ima ~8 × 107 g ≈ 856 g, a builder dodaje šunku, gljive i sir. | **Plauzibilno, ali na gornjem rubu** (+35 % na cheese pizzu, P2-PZ) |
| Decaf "about 3 mg" / "regular cup about 100 mg" | decaf 1,0 mg/100 g × 250 g = **2,5 mg** → "about 3" ✓; filter 40 mg/100 g × 250 g = **100 mg** ✓ | **Točno** |
| Oat milk "About 2× the rise of cow's milk" | ugljikohidrati 7,9 × 2,54 = 20 g, GI 69 → GL 13,8; punomasno mlijeko 4,8 × 2,58 = 12,4 g, GI 39 → GL 4,8. GL omjer je 2,9×. Video prikazuje porast iz modela (+20–48 %), koji nije linearan s GL. | **Konzervativno i iskreno** ✓ |
| Kaiser "about 7 teaspoons" | (30,0 − 1,3 vlakana)/4 = 7,2 ✓ | Točno |
| Sweet potato "about 6 teaspoons" | (26,8 − 3,8)/4 = 5,7 ✓ | Točno |
| Cola vs OJ, isti volumen "35 g vs 29 g" | 8,31 g/100 g × 347 g = 28,8 ✓; kcal 139 vs 170 ✓ | Točno |
| Hamburger "6 g of sugar: about 1 teaspoons" | 5,7 g / 4 = 1,4 | **Krivo zaokruženo i gramatički krivo** (N-3) |

## 3. Ocjene (22 videa)

| # | Video | /10 | Što fali do 10 |
|---|---|---|---|
| 1 | meal burger+fries+cola (TT) | **10** | nema nalaza |
| 2 | pizza builder (TT) | **9,5** | P2-PZ |
| 3 | cola (TT) | **8** | N-1 (P0) |
| 4 | espresso (TT) | **10** | nema nalaza |
| 5 | beer ×1 (TT) | **10** | nema nalaza |
| 6 | beer ×3 (TT) | **10** | nema nalaza |
| 7 | red wine (TT) | **10** | nema nalaza |
| 8 | crepes (TT) | **9** | H-1 |
| 9 | salmon (TT) | **9,5** | SA-2 |
| 10 | decaf coffee (TT) | **7,5** | D-1, D-2, D-3 |
| 11 | cinnamon roll (Reels) | **10** | nema nalaza |
| 12 | compare wine vs beer (Reels) | **10** | nema nalaza |
| 13 | kaiser roll (Shorts) | **7,5** | L-1 (P0), P2-K |
| 14 | oat milk (Shorts) | **10** | nema nalaza |
| 15 | red wine hook B (Shorts) | **8** | L-1 (P0) |
| 16 | compare cola vs water (Shorts) | **10** | nema nalaza |
| 17 | compare hamburger vs cola (TT) | **9** | N-3 |
| 18 | compare espresso vs beer (TT) | **10** | nema nalaza |
| 19 | compare cola vs OJ, Same amount (TT, novo) | **7** | J-1, J-2, J-3 |
| 20 | sweet potato (TT, novo nasumično) | **7,5** | H-1, N-2, T-1 |
| 21 | beer ×1 hook B (TT) | **10** | nema nalaza |
| 22 | cinnamon roll hook B (Shorts) | **8** | L-1 (P0) |

**Prosjek: 9,1/10** (prije 8,2). **11/22 je 10/10.** Vlasnikov bar ("svi 10/10") **još nije ispunjen**: ostala su 4 P0 u 4 videa i 7 P1.

## 4. Nalazi

### P0
**L-1. Tri Shortsa su dulja od 30 s:**
- kaiser 30,7 s;
- wine hook B 30,9 s;
- cinnamon hook B 30,2 s.

Ovo je regresija runde 14. Kartice su produljene ("Down the food pipe", sugar kartica), a Shorts plan nije skraćen. Krši pravilo 23–30 s i test runde 11 (koji ili ne pokriva hook B i nove kartice, ili mjeri plan bez end carda i petlje).

**Popravak:**
- u `video-plan.ts` short budžet mora uključiti 24 h beat i end card;
- kad je zbroj > 29,5 s, prvo ispustiti "Down the food pipe" / prvu stomach karticu, zatim skratiti glide;
- test: `seconds ≤ 29,5` za sve 178 + 83 stavke × hook A/B × short, mjereno na **finalnom MP4 trajanju** (plan.seconds).

**N-1. Cola: herojski broj "Blood sugar up · 26 min in" ≠ "Sugar peak 20 min in"** (lampica na istom end cardu) **≠ vrhunac u videu (+0:20)** (`frames/ends.png`, 62–67 s). To je kontradikcija na istom ekranu. Ostali videi se slažu (pizza 1 h 50, kaiser 1 h, oat 25 min, sweet potato 1 h 2, crepes 1 h 10, cinnamon 1 h 3).

**Popravak:** hero broj uzeti iz istog izvora kao lampica i poglavlje "Blood sugar peak" (round 13 "one source of truth"). Vjerojatno hero za tekućine koristi vrh krivulje porasta (26 min), a poglavlje koristi pomaknuti stop. Test: hero minuta = lampica minuta = minuta "peak" poglavlja, za sve stavke.

### P1
- **N-2. Sweet potato end card:** hero "Blood sugar up · 1 h 2 min in, +18–42 %" (žuto), a lampica ispod kaže "Blood sugar & energy: **Steady all day**" (zeleno) (`frames/ends.png`). Isti ekran si proturječi.
  - **Popravak:** kad hero prijavi porast šećera, lampica ne smije biti "Steady". Neka je "Sugar peak 1 h 2 min in" kao kod kaisera, uz isti prag.
- **H-1. Hook bez imena hrane:**
  - crepes: "4 teaspoons of sugar. Watch where it goes.";
  - sweet potato: "About 6 teaspoons of sugar. Watch the starch become blood sugar."

  Naslov stoji cijeli video, a ime je samo na prvoj kartici. Normie koji uskoči na 10 s ne zna o čemu je video (`frames/ends2.png`, `g1.png`).

  **Popravak:** formula "<ime>: about N teaspoons of sugar." (kao kaiser i cinnamon), pa "2 crepes with chocolate spread: about 4 teaspoons of sugar." Ako je predugo, koristiti kratko ime ("Nutella crepes", "1 sweet potato"). Test: hook sadrži `shortName`.
- **N-3. Hamburger vs cola, 5–10 s:** "6 g of sugar: about 1 teaspoons."
  - Gramatika je kriva (1 → teaspoon), a 5,7 g je ~1½ žličice.
  - **Popravak:** pluralizacija `teaspoon(s)`; ispod 2 žličice prikazati "about 1½ teaspoons" ili samo "6 g of sugar".
- **J-1. Cola vs OJ (Same amount), 0 s:** hook je samo "Cola vs Orange juice."
  - Ovo je najviralniji par u setu ("juice is healthy?"), a nema igre pogađanja.
  - **Popravak:** "Guess: which has more sugar?" ili "Same amount: which spikes blood sugar more?". Reveal na ≥ 55 %: "29 vs 35 g: almost the same."
- **J-2. Cola vs OJ, 21–23 s:** kartica soka "Starch and sugar turn into blood sugar.", a sok nema škroba. Nakon nje (25–27 s) slijede "These pass into your blood." / "Fiber goes on undigested." uz 1 g vlakana.
  - **Popravak:** za tekućine bez škroba koristiti "The sugar passes straight into your blood." (isti mehanizam kao alkoholna kartica u rundi 13).
- **J-3. Cola vs OJ, ~12 s:** chip "NEXT · +0:20 · Cola: when your blood sugar …" je **odrezan** (`sheets/compare-cola-vs-orange-juice-…-sheet1`, frame 7).
  - **Popravak:** kraći teaser ("Cola: sugar peak") ili prelom chipa u 2 reda. Test: širina chipa ≤ 900 px.
- **D-1. Decaf: vrhunac (41,9 s) je i dalje "Your kidneys filter the extra water."** / mokraća. Pravi isplatni trenutak je odgovor na 31 s ("about 3 mg").
  - **Popravak:** `climaxOf` za decaf neka bude stop "A little caffeine" (udarac, PEAK oznaka), a bubrezi ostaju obična kartica.
- **D-2. Decaf: "Watch your blood find out."**, ali nijedan mjerač ne prikazuje kofein u krvi. Na 44–47 s vidi se "38 ml in your small intestine" i "39 ml urine".
  - **Popravak:** na stopu "A little caffeine" prikazati mjerač mozga "3 mg caffeine · a regular cup: 100 mg" (isti gauge kao espresso).

### P2
- **D-3. Decaf end card nema herojski broj** (svi drugi videi ga imaju). Primjer: "3 mg caffeine · a regular cup 100 mg".
- **SA-2. Salmon, 40–52 s:** dvije kartice po 6,1 s pri 0,8–1,0 w/s. Skratiti na ≤ 4,5 s ili dodati broj na karticu ("+0.3 mmol/L").
- **P2-K. "Down the food pipe"** (kaiser 2,4–5 s, decaf 5–8 s) jedina je kartica bez točke. Uskladiti interpunkciju. Kartica je ujedno uzrok L-1 i u Shortsu je suvišna.
- **P2-PZ. Pizza 14" = 1154 g** je na gornjem rubu (vidi §2). Provjeriti grame dodataka u builderu (šunka, gljive, sir) prema USDA porcijama za 14" pizzu.
- **T-1. Sweet potato hashtag `#potato`.** Treba `#sweetpotato`. Decaf ima `#coffee #digestion`, a bolje je `#decaf #caffeine`. Pravilo: glavni tag je cijelo kratko ime bez razmaka.

## 5. Top 5 do launch bara
1. **L-1:** Shorts budžet ≤ 29,5 s na finalnom MP4. Test mora pokriti hook B i nove kartice. Otključava 3 videa.
2. **N-1 i N-2:** jedan izvor za hero broj, lampicu i peak poglavlje, plus test da se ne kontradiktiraju na istom ekranu. Otključava colu i sweet potato.
3. **H-1:** hook uvijek sadrži ime hrane. Otključava crepes i sweet potato.
4. **J-1 do J-3:** "Same amount" compare dobiva guess hook, karticu bez škroba za tekućine i chip ≤ 900 px. To je najdjeljiviji format ("juice ≈ cola").
5. **D-1 i D-2:** decaf vrhunac je odgovor s mjeračem kofeina, a ne mokraća.

## Zaključak
- Runda 14 i 14b popravile su gotovo sve iz kritike c. Provjereno na frameovima:
  - decaf ima priču;
  - oat milk dobiva odgovor;
  - chipovi u compareu su ljudskim riječima;
  - postoji sigurnosni red za vino;
  - cola-voda ima igru;
  - pizza navodi veličinu;
  - dodan je herojski broj.
- Prosjek je **9,1/10**, a **11/22 je 10/10**.
- Do vlasnikovog bara nedostaju:
  - **4 P0**: 3 Shortsa > 30 s i cola 26 ≠ 20 min;
  - **7 P1**: kontradikcija lampice kod sweet potata, hookovi bez imena, "1 teaspoons", cola-OJ (hook, škrob, odrezan chip), decaf vrhunac i mjerač;
  - nekoliko P2.
