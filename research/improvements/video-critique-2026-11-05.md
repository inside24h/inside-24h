# Kritika g: runda 17, tekstualni audit i generalizacija (2026-11-05)

Autor: critic agent (Opus). Pregledan je trenutni kod: commit 0673c1e. Kod nije diran i ništa nije commitano.

Rubrika a–i i vlasnikov bar su isti kao u kritikama c–f. Odbitci: P0 = −2, P1 = −1, P2 = −0,5.

**Uzorci:** `C:\claudework\video-samples\2026-11-05-critique17\` sadrži:
- 26 MP4 datoteka:
  - 10 videa koji u kritici f nisu bili 10/10;
  - 3 provjere regresije (espresso, beer ×3, kaiser);
  - **13 neviđenih**:
    - 5 buildera s vlastitim dodacima: kebab wrap+beef+onion+yogurt, spinach burek, baguette sandwich+cheese+butter+tomato, green salad+olive oil+salt, pizza+tuna+egg+olives+onion;
    - pljeskavica+bacon+onion;
    - ćevapi, avocado, hot chocolate, sardines;
    - 3 neobična comparea: ćevapi vs tofu, almonds vs potato chips, honey vs jam;
- `sheets/`: kontakt listove;
- `frames/ends.png`: end cardove;
- `render-log.txt`: render log.

Render je napravljen kroz pravi UI s jednim headless Chromeom i privremenim Viteom. Na kraju je ostalo 0 node procesa.

## Tehnika (svih 26 prolazi)
- 1080×1920, 30 fps, 0 grešaka u konzoli, 0 crnih frameova, 0 mrtvih zona.
- −14,1 do −14,5 LUFS, TP ≤ −1,8 dBTP.
- **Duljine:** TT 62,2–70,3 s, Reels 45,4–50,3 s, Shorts 24,6–29,5 s. Sve su unutar pravila.

---

## 1. Tekstualni audit (`text-audit-2026-11-05.txt`: 579 stavki i 300 parova)

Lint skripta javlja "Lint classes with findings: none", ali kao copy editor i normie gledatelj našao sam sljedeće.

### P0
- **T-1. Alcohol-free beer** (`=== beer.alcohol-free`, redovi 2015–2054). Video o pivu bez alkohola govori o alkoholu kojeg nema:
  - "The alcohol is gone after about **0 h**." (+0:01, u sva tri reza);
  - "Livers differ, so for some it takes longer.";
  - "At 07:00, the alcohol should be gone.";
  - "A hangover can still make you drive worse.";
  - hook A "How long does it stay in your blood?";
  - hook B "Where does the alcohol go?";
  - tag `#alcohol`.

  Uz to, "40 g of sugar: about 10 teaspoons." znači da su svi ugljikohidrati (8 g/100 ml) prikazani kao šećer. Kod bezalkoholnog piva većina ugljikohidrata su maltodekstrini, a ne šećer, pa to treba provjeriti prema USDA zapisu. Paradoksalno, end card kaže "Blood sugar & energy: Not tracked for this one".

  **Popravak:**
  - ispod ~0,5 % vol (ili < 2 g alkohola po porciji) stavka nema alkoholnu priču: ni lampicu, ni karticu, ni hook, ni `#alcohol`;
  - priča neka bude "Alcohol-free beer: X teaspoons of sugar" s krivuljom šećera;
  - provjeriti `sugars` u bazi.
- **T-2. Trofej za nezdravu stranu u compareu.** Copy kruniše "pobjednika" po jednoj metrici, a za normieja je 🏆 zdravstvena preporuka. Primjeri:
  - `sugar vs cranberry-juice`: "🏆 Sugar wins: a smaller blood sugar peak…";
  - `energy-drink vs sugar`: "🏆 Sugar wins";
  - `butter vs lemonade` / `oat-milk vs butter` / `cola vs butter` / `butter vs cinnamon-roll`: "🏆 Butter wins: no blood sugar peak";
  - `salami vs energy-drink`: "🏆 Salami wins";
  - `potato-boiled vs nutella`: "🏆 Hazelnut chocolate spread wins";
  - `beer vs fries`: "🏆 French fries wins: no alcohol";
  - `potato-chips vs hamburger`: "🏆 Potato chips wins".

  To je nepošteno (h) i mamac za ruganje u komentarima ("app says butter is healthier than oat milk").

  **Popravak:**
  - trofej samo kad je pobjednik bolji ili jednak na **svim** prikazanim metrikama (šećer, kcal, alkohol, kofein, zasićene masti) i nije u kategoriji "treat/fat/processed meat";
  - inače neutralna presuda dva reda: "Butter: no sugar spike. Oat milk: 4× fewer kcal." (ovaj format već postoji: "Ćevapi: no blood sugar peak. Latte: N fewer kcal.");
  - "Sugar" kao stavka (1 žličica protiv 250 ml soka) treba "Same amount" ili se ne prikazuje u paru.
- **T-3. Hot chocolate: herojski broj "2 mg caffeine · 8 h 33 min in"** (audit red 1645, video `hot-chocolate-tiktok-long` end card).
  - Kofein od 5 mg doseže vrh za ~1 h. "8 h 33 min in" je kriva minuta, a kofein je kriv hero za piće sa 7 žličica šećera.
  - Uz to, hot chocolate ima `gi: null`, pa nema krivulje šećera, iako hook obećava "7 teaspoons of sugar".
  - **Popravak:**
    - hero za kofein uzeti iz minute vrha (ista funkcija kao espresso);
    - za stavke s kofeinom < 10 mg kofein nikad nije hero;
    - hot chocolate treba GI (Atkinson 2008: cocoa drinks, ~40–50) da bi priča bila šećer.

### P1
- **T-4. "wins" uz množinu (27×):** "🏆 Black olives wins", "Blueberries wins", "Rice cakes wins", "Potato chips wins", "Lentils wins", "Hummus wins"… Popravak: `plural()` već postoji ("85 g of sardines win"), pa ga treba primijeniti na imena u množini.
- **T-5. Siročad zamjenica:**
  - "These pass into your blood." (49× u singlovima, 136 ukupno) dolazi nakon "In the small intestine it is taken apart." ili nakon "The sugar passes into your blood." "These" nema na što se odnositi.
  - "Then it joins your blood." (149×) često dolazi bez prethodne kartice o masti, jer je "Fat takes a slower route, via the lymph." prikazana samo 20 puta. Normie čita "it" = hrana.
  - "They keep arriving for hours." u compareu ćevapi vs tofu (m180) dolazi bez "Protein pieces…".

  **Popravak:** kartice-nastavci nose vlastiti subjekt: "The pieces pass into your blood.", "The fat joins your blood.", "Protein keeps arriving for hours." Lint: kartica koja počinje s It/They/These/Then mora imati prethodnicu u istom kadru.
- **T-6. Generička imena gube varijantu.**
  - "Yogurt: 8 teaspoons of sugar." (fruit yogurt), "Milk" (skimmed), "Cheese: 6 g of fat." (mozzarella), "Egg: 7 g of fat." (fried);
  - u videu: builder kebab wrap+beef+onion+yogurt zove se "**1 kebab**: 659 kcal", a green salad s maslinovim uljem "**1 portion of green salad: 14 g of fat**". Normie misli da salata ima 14 g masti.

  Burger i sandwich su popravljeni u rundi 17 ("1 hamburger with bacon & extra patty", "1 baguette sandwich with cheese & butter"), ali kebab i salate nisu.

  **Popravak:** varijanta ili dodaci uvijek u kratkom imenu: "Fruit yogurt", "Fried egg", "Mozzarella", "Beef wrap kebab", "Green salad with olive oil".
- **T-7. Ponavljanje na razini kanala:**
  - "/ Watch where it goes." 62×;
  - "/ How long does it stay in your stomach?" 58×;
  - svih 20 alkoholnih hook A je identično "How long does it stay in your blood?";
  - "Almost all is still in you at bedtime." 18×.

  Gledatelj serije vidi isti hook svaki drugi dan.

  **Popravak:** 3–4 formule po story signalu, birane `seedOf` rotacijom (kao tonalitet glazbe). Primjeri za alkohol: "How long until it's out of your blood?", "1 glass of X: still in you at midnight?", "Can you drive 2 hours after X?"
- **T-8. Nejasna tvrdnja "Almost all is still in you at bedtime."** (kava). "All" čega? Popravak: "Almost all its caffeine is still in you at bedtime."

### P2
- "The food is mostly in your blood." (11×) i "The drink is mostly in your blood.": u krv ulaze hranjive tvari, a ne hrana. Bolje: "Most of it has been absorbed now."
- "Almost all has moved on by 100 minutes." treba biti "by about 1 h 40 min".
- Voda: "It travels in small, teaspoon-sized pockets." je nejasno i nije normie jezik.
- Svaki šećerni hero kaže "a normal rise". To je iskreno, ali gasi "spike" priču. Za GI ≥ 70 bolje "a fast rise".
- Hook B "Rakija 45%." / "Wine spritzer." su fragmenti bez pitanja.
- `cola vs orange-juice` (typical serving): "More sugar: Cola. 35 g vs 22 g" uz 330 ml prema 250 ml je nepošteno. Za dva pića treba po defaultu ponuditi "Same amount".

---

## 2. Provjera nalaza iz kritike f, na frameovima

| Nalaz f | Status |
|---|---|
| P0-1 "250 ml of 250 ml" | **FIXED**: "It's close: the same amount of apple juice and cola hits your body the same way." i "Apart from that, the same amount of cola and orange juice…" |
| G-1 brie-banana kontradikcija | **FIXED**: "Answer: Banana raised blood sugar more." i "Apart from that, banana and brie cheese affect your body about the same." |
| G-2 kartica u krivo vrijeme | **FIXED**: brie kartica je na m62. |
| G-3 ", in 24 hours" | **FIXED**: brie "1 portion of brie: 8 g of fat. How long does it stay in your stomach?", ice cream "How fast does it hit your blood sugar?" |
| G-4 cod "water" | **FIXED**: "How long does it stay in your stomach?" |
| G-5 burger ime | **FIXED**: "1 hamburger with bacon & extra patty." Ali vidi T-6 za kebab i salatu. |
| G-6 "sleep" teaser | **FIXED**: "Coming up: the after-meal slump." |
| G-7 hero za brie/cod | FIXED (end card ima broj) |
| G-8 "brie cheese" | Djelomično: video kaže "Brie", ali presuda i dalje "banana and brie cheese". |
| G-9 žličice | **FIXED**: muesli "14 g of sugar: about 4 teaspoons". |
| P2-C cola žargon | **FIXED**: "Your body burns some sugar for energy." |
| P2-CR crepes "it" | Promijenjeno u "The food is mostly in your blood." (P2, vidi gore). |
| P2-OJ asimetrija | **FIXED**: "Cola. \| Orange juice." |

**Regresije:** espresso, beer ×3 i kaiser imaju iste kartice i trajanja. Nema regresija.

## 3. Novi nalazi u renderima
- **V-1 (P0 = T-3).** Hot chocolate end card: "2 mg caffeine · 8 h 33 min in". Video nema šećernu priču, iako hook kaže "7 teaspoons of sugar". Tag je `#chocolate #digestion`, a bolje je `#hotchocolate #bloodsugar`.
- **V-2 (P1 = T-6).** Kebab builder "1 kebab", salata "1 portion of green salad: 14 g of fat".
- **V-3 (P1).** Almonds vs potato chips (Shorts), 0–30 s: oznaka porcije u zaglavlju "28 g 23 whole ker…" je **odrezana** (`sheets/compare-almonds-…-sheet1`). Sat skače s +0:31 na +24:00 bez ijednog koraka između, pa video nema srednji dio.
  - **Popravak:** label porcije ≤ 16 znakova ("28 g", bez "23 whole kernels"). Shorts compare treba barem jedan stop između.
- **V-4 (P1 = T-5).** Ćevapi vs tofu, m180: "They keep arriving for hours." je siroče.
- **V-5 (P2).** Pravopis imena nije dosljedan: u istom end cardu stoji "Answer: **Cevapi** and tofu, almost the same." i "It's close: tofu and **Ćevapi**…", s velikim "Ć" usred rečenice. Singl kaže "5 pieces of cevapi". Treba jedno ime ("ćevapi"), malim slovom usred rečenice.
- **V-6 (P2).** Pizza+tuna+egg+olives+onion zove se samo "A whole 14-inch pizza with toppings". Za neobične dodatke ime treba navesti 1–2 glavna ("…with tuna & egg").
- **V-7 (P2).** Pljeskavica ima tag `#bloodsugar`. Za meso je bolje `#protein` ili `#fastfood`.

## 4. Ocjene

| # | Video | /10 |
|---|---|---|
| 1 | cola | 10 |
| 2 | crepes | 9,5 |
| 3 | cola vs OJ (same) | 10 |
| 4 | apple juice vs cola (same) | 10 |
| 5 | brie | 10 |
| 6 | ice cream | 10 |
| 7 | burger s dodacima | 10 |
| 8 | cod | 10 |
| 9 | muesli | 10 |
| 10 | brie vs banana | 9,5 |
| 11 | espresso (regresija) | 10 |
| 12 | beer ×3 (regresija) | 10 |
| 13 | kaiser (regresija) | 10 |
| 14 | kebab wrap builder (novo) | 8,5 |
| 15 | spinach burek (novo) | 10 |
| 16 | baguette sandwich builder (novo) | 9,5 (rajčica nije u imenu) |
| 17 | green salad + olive oil (novo) | 8,5 |
| 18 | pizza tuna/egg/olives (novo) | 9,5 |
| 19 | pljeskavica + bacon + onion (novo) | 9,5 |
| 20 | ćevapi (novo) | 9,5 |
| 21 | avocado (novo) | 10 |
| 22 | hot chocolate (novo) | 6,5 |
| 23 | sardines (novo) | 10 |
| 24 | ćevapi vs tofu (novo) | 8,5 |
| 25 | almonds vs potato chips (novo) | 8,5 |
| 26 | honey vs jam (novo) | 10 |

- **Prosjek svih 26: 9,5/10. 15/26 je 10/10.**
- **Generalizacija (13 neviđenih): prosjek 9,1/10**, a 4/13 je 10/10 (burek, avocado, sardines, honey vs jam). Kritika f imala je 9,1 na 10 neviđenih, pa je razina ostala ista.
- Ponovljeni sub-10 videi iz f: prosjek 9,9.

## 5. Top 5
1. **T-2:** trofej samo kad je pobjednik bolji na svim metrikama i nije "treat". Inače neutralna dvoredna presuda. Ovo je najveći rizik za vjerodostojnost i komentare.
2. **T-1 i T-3:** prag za alkohol (bezalkoholno pivo nema alkoholnu priču) i hero minuta kofeina iz vrha. Hot chocolate treba GI.
3. **T-5:** kartice-nastavci s vlastitim subjektom, plus lint za It/They/These/Then bez prethodnice.
4. **T-6:** varijanta i glavni dodaci u kratkom imenu za sve buildere (kebab, salate, pizza) i varijante (fruit yogurt, fried egg, mozzarella).
5. **T-7:** 3–4 rotirajuće hook formule po story signalu (seedOf), da serija ne izgleda kao predložak (YouTube "inauthentic content" rizik).
