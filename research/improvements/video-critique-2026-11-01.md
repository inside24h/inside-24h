# Kritika f: runda 16 i test generalizacije (2026-11-01)

Autor: critic agent (Opus). Pregledan je trenutni kod: 8e67668 (videi iz 2c86827). Kod nije diran i ništa nije commitano.

Rubrika a–i je ista kao u kritikama c–e. Odbitci: P0 = −2, P1 = −1, P2 = −0,5.

**Uzorci:** `C:\claudework\video-samples\2026-11-01-critique16\` sadrži:
- 35 MP4 datoteka:
  - set od 25 videa iz kritike e;
  - 8 novih stavki:
    - banana (voće);
    - brie (sir);
    - ice cream (desert);
    - rakija (žestoko piće);
    - green tea (čaj);
    - burger builder s dodacima (bacon, extra patty, onion, mayo);
    - cod (riba);
    - muesli (doručak);
  - 2 neobična comparea: ice cream vs green tea (TT) i brie vs banana (Shorts);
- `sheets/`: kontakt listovi;
- `frames/ys.png`: hookovi i ključni kadrovi;
- `frames/ends.png`: end cardovi novih videa;
- `render-log.txt`: render log.

**Render:** pravi UI, jedan headless Chrome i privremeni Vite. Nakon pauze (reset limita) provjereno je da nisu ostali node ni headless Chrome procesi: 0 i 0. Nijedan render nije ponovljen.

## Tehnika (svih 35 prolazi)
- 1080×1920, 30 fps, 0 grešaka u konzoli, 0 crnih frameova, 0 mrtvih zona.
- −14,1 do −14,5 LUFS, TP ≤ −1,8 dBTP.
- **Duljine:** TT 62,1–71,5 s, Reels 47,6–50,7 s, Shorts 24,2–29,3 s. Sve su unutar pravila.
- Tekst je u safe zoni, a brzina čitanja u singlovima je ≤ 2,3 w/s.

## 1. Provjera nalaza iz kritike e, na frameovima

| Nalaz e | Status | Dokaz |
|---|---|---|
| J-2 škrob uz sok | **FIXED** | Cola-OJ, OJ kolona: "The sugar passes into your blood." |
| A-1 apple juice vs cola bez igre | **FIXED** | "Guess: which has more sugar?" i "Answer: Apple juice and Cola, almost the same." |
| E-1 energy drink bez kofeina | **FIXED** | "7 teaspoons of sugar, 80 mg of caffeine." i kartica "The caffeine reaches your brain." |
| E-2 `#drink` | **FIXED** | `#energydrink` |
| V-1 rečenica presude | **REGRESIJA** | Vidi P0-1. |
| P2-PZ pizza | **Ublaženo** | "A whole 14-inch pizza with toppings." / "2723 kcal in total." To je iskreno. |

**Regresije u ostalim videima koji su bili 10/10:** tekstovi i trajanja su se malo pomaknuli. Prvi kadar sad ima zbirnu karticu ("9 teaspoons of sugar, 32 mg of caffeine."), što je dobro. Ostale promjene:
- **cola:** kartica "Probably too little to affect most people's sleep." je ispala. Na bedtime ostaje samo "About a third of the caffeine remains." To je OK, odgovor je dan. Ali kartice "Your body burns half the fruit sugar." i "Your liver turns 40% into blood sugar." (~43–51 s) su žargon (P2-C).
- Ostali videi nemaju novih nalaza.

## 2. Generalizacija: što testovi još ne hvataju

### P0
**P0-1. Svaki "Same amount" compare ima pokvarenu rečenicu presude na +24:00 i na end cardu** (`frames/ends.png`):
- apple juice vs cola: "It's close: the same **250 ml of 250 ml of cola** and apple juice hits your body about the same.";
- cola vs OJ: "It's close: the same **330 ml of 330 ml of orange juice** and cola hits your body about…".

Uzrok je sljedeći. Popravak V-1 umeće "the same 250 ml of", a ime druge strane već nosi količinu ("250 ml of cola"), pa se količina ponovi. Uz to je glagol "hits" u jednini uz dva subjekta. Tekst na najvažnijem kadru (isplata i zadnji frame prije petlje) je pokvaren.

**Popravak:**
- u "Same amount" načinu koristiti gola imena: "It's close: the same amount of cola and apple juice hits your body about the same way.";
- test: nijedan verdict ne sadrži dvaput istu količinu, i ne sadrži `of \d+ ml of \d+ ml`.

### P1
- **G-1. Brie vs banana (Shorts), +24:00 i end card:** "Answer: **Banana raised blood sugar more.**", a odmah ispod "It's close: Brie cheese and Banana affect your body about the same." Brie ima steady, a banana +16–38 %. Video sam sebi proturječi.
  - **Popravak:** "It's close" samo kad je razlika u guess metrici ispod praga. Inače presuda imenuje razliku ("Banana: a normal sugar rise. Brie: none.").
  - Sitnica: "Banana" je velikim slovom usred rečenice.
- **G-2. Brie vs banana, ~17–19 s:** lijeva kolona "INTO THE SMALL INTESTINE · Protein is broken into building blocks." stoji dok sat pokazuje **+24:00**, uz desnu karticu "24 HOURS LATER". Kartica je prikazana u krivo vrijeme (`ys.png`, 3. kadar).
  - **Popravak:** u compareu se kartica jedne strane ne smije prikazivati na stopu kojemu ne pripada. Na +24:00 lijeva strana dobiva svoju 24 h karticu ili "Both · …".
- **G-3. Brie (Shorts), hook:** "1 portion of brie cheese: 95 kcal, **in 24 hours. Watch it for 24 hours.**"
  - Gramatika je pokvarena, hook ponavlja "24 hours" i nema ni pitanje ni zanimljiv broj. Slično je kod ice creama: "1 portion of ice cream: 4 teaspoons of sugar, **in 24 hours.** Watch where it goes."
  - **Popravak:** ukloniti fragment ", in 24 hours" iz predloška. Za sir koristiti broj masti ili proteina, npr. "Brie: 8 g of fat. Watch when it reaches your blood."
  - Test: hook ne sadrži "24 hours" dvaput i ne sadrži ", in 24 hours.".
- **G-4. Cod (TT), hook:** "**Where does the water go?** 1 fillet of cod: 41 g of protein." Pitanje o vodi uz ribu je besmisleno, a priča je protein (vrhunac "Protein pieces in your blood peak now.").
  - **Popravak:** hook formulu birati prema story signalu (protein, pa "Watch your body use it."), nikad "water" za krutu hranu.
  - Za green tea "Where does the water go?" je prihvatljivo, ali slabo. Bolji je kofein: "Green tea: 28 mg of caffeine. When does it hit?"
- **G-5. Burger builder s dodacima (bacon, extra patty, onion, mayo):** ime na ekranu je "**1 hamburger: 538 kcal**".
  - Gledatelj ne zna da je burger s duplim mesom i baconom. Isti naziv "1 hamburger" u drugom videu ima 251 kcal, pa brojevi djeluju kontradiktorno.
  - Pizza ovo rješava s "with toppings".
  - **Popravak:** builder ime iz dodataka ("1 double bacon burger" ili "1 hamburger with bacon & extra patty"), kao kod pizze.
- **G-6. Burger builder, ~20 s:** "Coming up: **what it does to your sleep.**", a ispunjenje je "Many people feel sleepy after a big meal." Teaser obećava san (noć), a dobije se popodnevna pospanost. To je zavaravajuće.
  - **Popravak:** "Coming up: the after-lunch slump."

### P2
- **G-7. Brie i cod end card bez herojskog broja.** Za brie bi to mogao biti "Blood fat up · 3 h 30 min" (kao tofu i losos), a cod "41 g protein used".
- **G-8. Rečenica "Brie cheese":** "brie cheese" je suvišno, dovoljno je "Brie". Ista stvar u hashtagu `#briecheese` (bolje `#brie`).
- **G-9. Zaokruživanje žličica:** muesli "14 g of sugar: about 3 teaspoons", a banana i ice cream "14 g of sugar: about 4 teaspoons". Isti prikazani broj grama daje različit broj žličica (stvarno 13,6 vs 14,4 g). Zaokruživati iz prikazanog (zaokruženog) broja grama, ili prikazati "about 3½".
- **P2-C. Cola, ~43–51 s:** "Your body burns half the fruit sugar." / "Your liver turns 40% into blood sugar." Normie ne zna da cola ima "fruit sugar". Bolje: "Half of the sugar is burned for energy." / "Your liver turns some of the rest back into blood sugar."
- **P2-CR. Crepes, ~29–33 s:** "It collects in your bladder for hours." pa odmah "Most of it is in your blood now." "It" čita se kao urin. Bolje: "Most of the food is in your blood now."
- **P2-OJ. Cola vs OJ, 3,7–7,5 s:** "Cola. | 29 g of sugar: about 7 teaspoons." je asimetrično. Šećer cole je skriven zbog igre, ali je šećer soka otkriven. Sakriti oba ("Cola." / "Orange juice.").

## 3. Ocjene (35)

| # | Video | /10 |
|---|---|---|
| 1 | meal | 10 |
| 2 | pizza builder | 10 |
| 3 | cola | 9,5 (P2-C) |
| 4 | espresso | 10 |
| 5 | beer ×1 | 10 |
| 6 | beer ×3 | 10 |
| 7 | red wine | 10 |
| 8 | crepes | 9,5 (P2-CR) |
| 9 | salmon | 10 |
| 10 | decaf | 10 |
| 11 | cinnamon Reels | 10 |
| 12 | wine vs beer | 10 |
| 13 | kaiser | 10 |
| 14 | oat milk | 10 |
| 15 | wine hook B | 10 |
| 16 | cola vs water | 10 |
| 17 | hamburger vs cola | 10 |
| 18 | espresso vs beer | 10 |
| 19 | cola vs OJ (same) | 7,5 (P0-1, P2-OJ) |
| 20 | sweet potato | 10 |
| 21 | beer hook B | 10 |
| 22 | cinnamon hook B | 10 |
| 23 | tofu | 10 |
| 24 | energy drink | 10 |
| 25 | apple juice vs cola (same) | 8 (P0-1) |
| 26 | banana (novo) | 10 |
| 27 | brie (novo) | 8 (G-3, G-7, G-8) |
| 28 | ice cream (novo) | 9 (G-3) |
| 29 | rakija (novo) | 10 |
| 30 | green tea (novo) | 10 (slab hook, ali nije greška) |
| 31 | burger builder (novo) | 8 (G-5, G-6) |
| 32 | cod (novo) | 8,5 (G-4, G-7) |
| 33 | muesli (novo) | 9,5 (G-9) |
| 34 | compare ice cream vs green tea (novo) | 10 |
| 35 | compare brie vs banana (novo) | 8 (G-1, G-2) |

**Prosjek: 9,6/10. 25/35 je 10/10.**
- Stari set od 25 videa: prosjek 9,8, a 21 video je 10/10.
- Novih 10 videa: prosjek 9,1, a 4 su 10/10 (banana, rakija, green tea, ice cream vs green tea).

**Zaključak o generalizaciji:** jezgra (vrijeme, brojevi, alkohol, šećer, duljine, zvuk) generalizira odlično. Rubovi u kojima se još javljaju greške su ovi:
- (1) predlošci teksta za presudu i hook (P0-1, G-1, G-3, G-4);
- (2) builder imena (G-5);
- (3) raspored kartica u compareu kad jedna strana nema poglavlje na nekom stopu (G-2).

## 4. Top 5 popravaka
1. **P0-1:** "Same amount" presuda s golim imenima, plus test bez ponovljene količine.
2. **G-1:** "It's close" samo ispod praga guess metrike, plus test da se answer i verdict ne kontradiktiraju.
3. **G-3 i G-4:** hook predložak bez fragmenta ", in 24 hours". Hook formula prema story signalu (protein, mast, kofein, šećer, alkohol), nikad "water" za krutu hranu. Sweep test nad svih 178 + 83 stavki: hook ne ponavlja "24 hours", a pitanje mora odgovarati signalu.
4. **G-5 i G-6:** builder ime iz dodataka i teaser bez riječi "sleep" za popodnevnu pospanost.
5. **G-2:** u compareu nikad kartica jedne strane na stopu kojemu ne pripada.
