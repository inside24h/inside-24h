# Kritika e: runda 15 prema 10/10 launch baru (2026-10-31, b)

Autor: critic agent (Opus). Pregledan je trenutni kod: commit 8f033e2. Kod nije diran i ništa nije commitano.

Rubrika a–i i odbitci su isti kao u kritikama c i d: P0 = −2, P1 = −1, P2 = −0,5.

**Uzorci:** `C:\claudework\video-samples\2026-10-31-critique15\` sadrži:
- 25 MP4 datoteka:
  - cijeli set od 22 videa iz kritike d;
  - nove stavke iz baze: **tofu** (TT long) i **energy drink** (Shorts);
  - novi "Same amount" compare: **apple juice vs cola** (Reels);
- `sheets/`: kontakt listove, 1 frame svake 2 s, sa safe zonom;
- `frames/ends.png`: 8 end cardova;
- `frames/xs.png`: cola-OJ 13/25/41/63 s, decaf 31 s, tofu 37 s;
- `render-log.txt`: planove, kartice, cue-ove i opise.

**Render:** pravi UI, jedan headless Chrome i privremeni Vite. Na kraju je ostalo 0 node procesa.

Napomena o renderu: prvi pokušaj "Same amount" za oat milk vs milk nije uspio. Dijalog nije ponudio gumb, što je ispravno po pravilu `sameAmountOffer`, jer je tipična porcija ista (250 ml), pa izbor nema smisla. Umjesto toga renderiran je apple juice vs cola.

## Tehnika
- Svih 25 je 1080×1920 i 30 fps, s 0 grešaka u konzoli, 0 crnih frameova i 0 mrtvih zona.
- Glasnoća −14,1 do −14,5 LUFS, TP ≤ −1,7 dBTP.
- **Duljine:**
  - TT 62,2–70,4 s ✓;
  - Reels 47,9–50,7 s ✓;
  - Shorts: kaiser 26,4, oat 24,6, wine B 29,3, cinnamon B 24,5, cola-voda 25,2, energy 25,0 ✓. **L-1 je popravljen.**
- Tekst je u safe zoni. Brzina čitanja je ≤ 2,4 w/s u singlovima. U compareu je kartica "Both · …" do 3,9 w/s ukupno, ali to je jedna rečenica, pa je čitljivo.

## 1. Provjera nalaza iz kritike d, na frameovima

| Nalaz d | Status | Dokaz |
|---|---|---|
| L-1 Shorts > 30 s | **FIXED** | Sva 6 Shortsa imaju 24,5–29,3 s. |
| N-1 cola: hero 26 ≠ 20 min | **FIXED** | Hero "Blood sugar up · 20 min in", lampica 20 min, vrhunac +0:20 (`ends.png`). |
| N-2 sweet potato: lampica "Steady" | **FIXED** | Lampica "Normal rise, peak 1 h 2 min in". |
| H-1 hookovi bez imena | **FIXED** | "2 crepes with chocolate spread: 4 teaspoons of sugar.", "1 medium sweet potato: about 6 teaspoons of sugar." |
| N-3 "about 1 teaspoons" | **FIXED** | Hamburger: "6 g of sugar." |
| J-1 cola-OJ bez igre | **FIXED** | "Guess: which has more sugar?". Reveal "More sugar: Cola. 35 g vs 29 g" na 41 s od 64,6 (63 %). |
| J-2 "Starch and sugar…" uz sok | **NOT FIXED** | Cola-OJ na ~22–25 s: OJ kolona i dalje kaže "Starch and sugar turn into blood sugar." (`xs.png`, 2. frame). |
| J-3 odrezan chip | **FIXED** | "NEXT · +0:20 · Cola: sugar peak". |
| D-1 / D-2 decaf: vrhunac i mjerač | **FIXED** | Vrhunac je na stopu kofeina (+0:43), mjerač "2 mg caffeine in your body: a little" i PEAK. |
| D-3 decaf: hero broj | **FIXED** | "2 mg caffeine · 43 min in". |
| SA-2 salmon: spore kartice | **FIXED** | Kartice traju ≤ 4,6 s. Dodane su "Protein pieces in your blood peak now." i "They keep arriving for hours." |
| P2-K "Down the food pipe" | **FIXED** | Kartica više ne postoji. |
| T-1 hashtagovi | **FIXED** | `#sweetpotato`, `#decaf #caffeine`. |
| P2-PZ pizza 1154 g | Nije mijenjano (vlasnikova odluka o builderu) | Vidi P2-PZ. |

**Regresije u videima koji su u kritici d bili 10/10:** nema ih. Provjereni su:
- meal, espresso, beer ×1 i ×3, wine, cinnamon Reels, wine-beer, oat milk, cola-voda, espresso-pivo, beer hook B;
- tekst kartica, hero brojevi, end cardovi i trajanja.

Beer ×1 i wine su sada 65,5 s (prije 63,5) jer su dodani mikro-događaji, što je i dalje unutar TT pravila. Decaf sada kaže "about 2 mg" (prije "about 3"). 2,5 mg je točno na granici zaokruživanja, a broj je konzistentan unutar videa (kartica = mjerač = hero).

## 2. Sanity-check novih stavki (DB × porcija)

| Tvrdnja | Izračun | Presuda |
|---|---|---|
| Energy drink "27 g of sugar: about 7 teaspoons" | 10,6 g/100 g × 259,6 g = 27,5 g; /4 = 6,9 | ✓ |
| Tofu "22 g of protein", "181 kcal" | 17,3 × 1,26 = 21,8 g; 144 × 1,26 = 181 | ✓ |
| Apple juice vs cola, 250 ml: "25 g vs 27 g", "121 vs 105 kcal" | 25,2 g ✓; cola 10,2 × 2,6 = 26,5 ✓; kcal ✓ | ✓ |
| Cola vs OJ, 330 ml: "35 g vs 29 g" | ✓ (provjereno u d) | ✓ |

## 3. Ocjene (25 videa)

| # | Video | /10 | Što fali do 10 |
|---|---|---|---|
| 1 | meal burger+fries+cola (TT) | **10** | nema nalaza |
| 2 | pizza builder (TT) | **9,5** | P2-PZ |
| 3 | cola (TT) | **10** | nema nalaza |
| 4 | espresso (TT) | **10** | nema nalaza |
| 5 | beer ×1 (TT) | **10** | nema nalaza |
| 6 | beer ×3 (TT) | **10** | nema nalaza |
| 7 | red wine (TT) | **10** | nema nalaza |
| 8 | crepes (TT) | **10** | nema nalaza |
| 9 | salmon (TT) | **10** | nema nalaza |
| 10 | decaf coffee (TT) | **10** | nema nalaza |
| 11 | cinnamon roll (Reels) | **10** | nema nalaza |
| 12 | compare wine vs beer (Reels) | **10** | nema nalaza |
| 13 | kaiser roll (Shorts) | **10** | nema nalaza |
| 14 | oat milk (Shorts) | **10** | nema nalaza |
| 15 | red wine hook B (Shorts) | **10** | nema nalaza |
| 16 | compare cola vs water (Shorts) | **10** | nema nalaza |
| 17 | compare hamburger vs cola (TT) | **10** | nema nalaza |
| 18 | compare espresso vs beer (TT) | **10** | nema nalaza |
| 19 | compare cola vs OJ, Same amount (TT) | **8,5** | J-2 (P1), V-1 (P2) |
| 20 | sweet potato (TT) | **10** | nema nalaza |
| 21 | beer ×1 hook B (TT) | **10** | nema nalaza |
| 22 | cinnamon roll hook B (Shorts) | **10** | nema nalaza |
| 23 | tofu (TT, novo) | **10** | nema nalaza |
| 24 | energy drink (Shorts, novo) | **8** | E-1 (P1), E-2 (P1) |
| 25 | compare apple juice vs cola, Same amount (Reels, novo) | **8,5** | A-1 (P1), V-1 (P2) |

**Prosjek: 9,8/10** (prije 9,1). **21/25 je 10/10.** Bar "svi 10/10" još nije ispunjen: ostala su 4 P1 i 2 P2, ali **nema nijednog P0**.

## 4. Nalazi

### P1
- **J-2. Cola vs OJ (TT), ~22–25 s, desna kolona:** "Starch and sugar turn into blood sugar." Sok od naranče nema škroba.
  - Runda 15 navodi "starch/fiber cards only when the food has them", ali ova kartica je prošla. Vjerojatno filter gleda `carbs > sugars` (OJ: 30,3 g ugljikohidrata naspram 21,8 g šećera, jer USDA ugljikohidrati uključuju i organske kiseline), a ne pravi škrob.
  - **Popravak:**
    - kriterij za škrob: `carbs − sugars − fiber ≥ 3 g` **i** `kind !== 'liquid'`, ili eksplicitna oznaka `starch` u bazi;
    - za sokove koristiti "The sugar passes straight into your blood.";
    - test za sve tekućine iz baze: nijedna kartica ne sadrži "starch".
- **A-1. Compare apple juice vs cola (Reels), 0 s:** hook je samo "Apple juice vs Cola.", bez igre pogađanja. Cola vs OJ ga ima.
  - Razlika je samo 2 g šećera, pa je vjerojatno pao prag "guess ≥ 20 %" iz runde 12.
  - Upravo je "skoro isto" najviralnija poruka ("juice = soda").
  - **Popravak:** kad je razlika manja od praga, hook neka bude "Guess: apple juice or cola — which has more sugar?". Reveal na ≥ 55 %: "Almost the same: 25 g vs 27 g." Odgovor "about the same" je isplata, ne razlog za izostanak igre.
- **E-1. Energy drink (Shorts): nijedna riječ o kofeinu** (80 mg u limenci, iz baze). Video je cijeli o šećeru.
  - Za energy drink normie očekuje "when does it kick in / how long does it keep you awake". Ovo je propuštena srž priče (kriteriji b, c).
  - **Popravak:**
    - story signal za stavke s ≥ 50 mg kofeina i ≥ 15 g šećera neka bude "sugar + caffeine";
    - u Shortsu kartica na vrhuncu: "Caffeine peaks too: 80 mg, like a strong coffee.";
    - hook B: "1 energy drink: when does it kick in?".
- **E-2. Energy drink hashtag `#drink`.** Treba `#energydrink #caffeine`. Pravilo iz T-1 (cijelo kratko ime bez razmaka) ovdje je uzelo samo zadnju riječ.
  - **Popravak:** za ime iz više riječi koristiti cijelo ime ("energydrink"). Test: tag ≠ generička riječ (drink, food, roll, spread).

### P2
- **V-1. Rečenica presude "It's close: Cola and 330 ml of orange juice affect your body about the same."** i "Apple juice and 250 ml of cola…" ima asimetričnu i nespretnu konstrukciju (količina samo uz drugu stavku), na +24:00 i end cardu.
  - **Popravak:** u "Same amount" načinu: "It's close: the same amount of cola and orange juice hits your body about the same."
- **P2-PZ. Pizza 14" = 1154 g** (otprije, vlasnik ne mijenja builder). Ako vlasnik prihvaća, pizza je 10/10.

## 5. Top 5 (zadnji korak do bara)
1. **J-2:** pravi kriterij za škrob i test za sve tekućine (1 linija i 1 test).
2. **A-1:** igra pogađanja i kad je razlika mala. "Almost the same" je najdjeljiviji odgovor u nišu.
3. **E-1:** priča "sugar + caffeine" za energy drinkove. To je jedan od najtraženijih pojmova ("energy drink what happens to your body").
4. **E-2 i V-1:** hashtag iz cijelog imena i jasna rečenica presude za "Same amount".
5. Za objavu: prvi val su videi s 10/10 (21), dok se J-2, A-1 i E-1 rješavaju.

## Zaključak
- Runda 15 je na frameovima popravila sve iz kritike d osim jednog nalaza (J-2, škrob uz sok).
- Nema P0. Nema regresija u 10/10 videima.
- **Prosjek je 9,8/10, a 21/25 je 10/10.**
- Do vlasnikovog bara fale:
  - 4 P1: škrob uz sok, apple juice vs cola bez igre, energy drink bez kofeina, `#drink`;
  - 2 P2: rečenica presude, pizza veličina (ako vlasnik ne prihvaća).
