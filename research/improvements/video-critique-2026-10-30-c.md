# Kritika videa nakon runde 13 prema 10/10 launch baru (2026-10-30, c)

Autor: critic agent (Opus). Pregledan je trenutni kod: commit 7b34dd4. Kod nije diran i ništa nije commitano.

**Uzorci:** `C:\claudework\video-samples\2026-10-30-critique13\` sadrži:
- 18 MP4 datoteka:
  - isti set od 16 videa;
  - novo: decaf coffee (TT long) i compare cola vs water (Shorts);
  - salmon, oat milk i compare red wine vs beer (Reels) su ponovno renderirani;
- `sheets/`: kontakt listove, 1 frame svake 2 s, s ucrtanom safe zonom (gore y = 210, dolje y = 1480, x 60–940);
- `frames/`:
  - `ends.png` (9 end cardova);
  - `cw-end.png` (cola-voda Shorts, kraj);
  - `dc.png` (decaf, 31–47 s);
  - `sa.png` (salmon, 43–57 s);
- `render-log.txt`: planove, kartice s trajanjem, cue-ove i sve opise za platforme.

Render je napravljen kroz pravi UI s jednim headless Chromeom i privremenim Viteom. Server i Chrome su ugašeni nakon rendera (`tasklist`: 0 node procesa).

## Rubrika 10/10 (vlasnikov bar)
Video je 10/10 samo ako je **svih 9 kriterija** ispunjeno bez ijednog nalaza:
- **a** nula grešaka u činjenicama, brojevima, vremenima, gramatici i pravopisu; svi brojevi konzistentni;
- **b** prvi frame i prva sekunda zaustavljaju scroll;
- **c** razlog za gledanje svake 2–3 s, bez mrtvog trenutka;
- **d** tijelo i proces su vizualni junak;
- **e** svaka kartica je čitljiva normie tempom i unutar safe zone;
- **f** zvuk je uredan i po specifikaciji glasnoće;
- **g** vrhunac i petlja;
- **h** iskreno, u skladu s politikama, alkohol nikad pozitivno;
- **i** opis i hashtagovi su točni.

Ocjena je 10 minus odbitci: P0 = −2, P1 = −1, P2 = −0,5, s podom 5. Svaki odbitak ispod ima timestamp i popravak.

## Tehnika (za sve videe prolazi kriterije e i f)
| Video | Rez | s | LUFS | TP | crni / mrtvi |
|---|---|---|---|---|---|
| meal | TT | 67,2 | −14,2 | −3,0 | 0/0 |
| pizza builder | TT | 65,8 | −14,1 | −3,1 | 0/0 |
| cola | TT | 66,9 | −14,2 | −3,2 | 0/0 |
| espresso | TT | 62,3 | −14,2 | −1,8 | 0/0 |
| beer ×1 | TT | 63,5 | −14,2 | −3,0 | 0/0 |
| beer ×3 | TT | 68,9 | −14,1 | −2,9 | 0/0 |
| red wine | TT | 63,6 | −14,2 | −1,7 | 0/0 |
| crepes | TT | 62,4 | −14,2 | −2,3 | 0/0 |
| salmon | TT | 62,3 | −14,3 | −3,1 | 0/0 |
| decaf coffee | TT | 62,3 | −14,2 | −2,9 | 0/0 |
| cinnamon roll | Reels | 49,7 | −14,2 | −2,6 | 0/0 |
| compare wine vs beer | Reels | 48,7 | −14,3 | −2,8 | 0/0 |
| kaiser roll | Shorts | 23,9 | −14,3 | −2,6 | 0/0 |
| oat milk | Shorts | 26,6 | −14,3 | −3,0 | 0/0 |
| wine hook B | Shorts | 29,3 | −14,3 | −1,9 | 0/0 |
| compare cola vs water | Shorts | 23,4 | −14,5 | −3,0 | 0/0 |
| compare hamburger vs cola | TT | 68,6 | −14,3 | −2,9 | 0/0 |
| compare espresso vs beer | TT | 64,0 | −14,2 | −3,1 | 0/0 |

- Svih 18: 1080×1920, 30 fps, 0 grešaka u konzoli. Duljine su unutar pravila (TT ≥ 60, Reels 45–55, Shorts 23–30).
- Brzina čitanja je 0,6–2,6 w/s. Kartice su unutar safe zone. Trake "BLOOD SUGAR RISE / BLOOD ALCOHOL" u compareu su na y ≈ 1400–1460, ispod granice 1480.
- **Sitnica (P2-T1):** kaiser Shorts (23,9 s) i cola-voda Shorts (23,4 s) imaju samo 0,4–0,9 s rezerve do minimuma od 23 s. Ciljati 25–28 s.

---

## 1. Provjera nalaza iz `video-critique-2026-10-30-b.md`, na frameovima

| Nalaz | Status | Dokaz |
|---|---|---|
| P0-1 "Sugar peak N min in" ≠ vrhunac | **FIXED** | `frames/ends.png`: end card se sada slaže s vrhuncem u videu: cola 20 min, meal 1 h 2 min, pizza 1 h 50 min, crepes 1 h 10 min, cinnamon roll 1 h 3 min. Wine "Focus may dip 41 min in" i beer "48 min" se slažu s mjeračem. |
| P0-2 losos: 3 kartice na 40 s | **FIXED** | Plan ima 9 kartica, a najdulja traje 6,0 s. Sat ide (+0:29 → +4:23). Mjerač "Blood fat up +0.2/+0.3 mmol/L" je uz srce (`sheets/salmon-…-sheet2/3`). Hook: "39 g of protein". |
| P0-3 pizza: "half 225 min" i "almost all by 4 h" | **FIXED** | Sad piše "Almost all has moved on by 7 hours." (m420). Crepes "by 4 hours" uz t½ 116 min i cinnamon "by 3 hours" uz t½ 92 min su konzistentni. |
| P1-1 hamburger-cola reveal na 25 s | **FIXED** | "Bigger rise: Cola." je na +24:00, video 51 s od 68,6 (74 %). |
| P1-2 "Coming up: peak." | **FIXED** u singlu | "Coming up: when it hits hardest." Ali u compareu je još generički chip, vidi C13-1. |
| P1-3 compare vino-pivo | **DJELOMIČNO** | Popravljeno: "Guess: which brings more alcohol?", "Both · …" kartica umjesto dupliciranja, "Less alcohol: Red wine (16 g vs 20 g)". Novi problem: chip "Faster out ≠ better for you." (vidi W-1). |
| P1-4 gramatika naslova | **FIXED** | "500 ml of beer: what it does inside you in 24 h". |
| P1-5 oat milk hook | **DJELOMIČNO** | Hook "More blood sugar than cow's milk?" je dobar, ali video **nikad ne odgovori** na pitanje (O-1). End card "drink" je popravljen. |
| P1-6 "Starch and sugar…" uz pivo | **FIXED** | "Alcohol passes into your blood here." |
| P1-7 odrezan end card u compareu | **FIXED** | "Focus may dip 48 min in" stane u karticu. |
| P2-1 traka na rubu safe zone | **FIXED** | Podignuta. |

**Svi P0 iz kritike b su popravljeni.** Ostali nalazi su novi ili su ostali od prije.

---

## 2. Ocjene i put do 10/10

| # | Video | Ocjena | Presuda | Što fali do 10/10 |
|---|---|---|---|---|
| 1 | meal burger+fries+cola (TT) | **8,5** | NOT 10 | G-1, G-3 |
| 2 | pizza builder (TT) | **8** | NOT 10 | G-1, G-3, PZ-1 |
| 3 | cola (TT) | **9** | NOT 10 | G-1, G-3 |
| 4 | espresso (TT) | **9** | NOT 10 | G-1, G-3 |
| 5 | beer ×1 (TT) | **8** | NOT 10 | G-1, G-2, G-3 |
| 6 | beer ×3 (TT) | **9** | NOT 10 | G-1, G-3 |
| 7 | red wine (TT) | **9** | NOT 10 | G-1, G-3 |
| 8 | crepes (TT) | **8** | NOT 10 | G-1, G-2, G-3 |
| 9 | salmon (TT) | **7,5** | NOT 10 | G-1, G-3, SA-1, SA-2 |
| 10 | decaf coffee (TT, novo) | **5,5** | **NOT READY** | DC-1 (P0), DC-2, DC-3, G-3 |
| 11 | cinnamon roll (Reels) | **9** | NOT 10 | G-1, G-3 |
| 12 | compare wine vs beer (Reels) | **7,5** | NOT 10 | W-1, W-2, G-1 |
| 13 | kaiser roll (Shorts) | **8,5** | NOT 10 | K-1, P2-T1, G-1 |
| 14 | oat milk (Shorts) | **7,5** | NOT 10 | O-1, G-1, G-3 |
| 15 | red wine hook B (Shorts) | **8,5** | NOT 10 | G-2, G-1 |
| 16 | compare cola vs water (Shorts, novo) | **7,5** | NOT 10 | CW-1, P2-T1, G-1 |
| 17 | compare hamburger vs cola (TT) | **9** | NOT 10 | G-1 |
| 18 | compare espresso vs beer (TT) | **8** | NOT 10 | C13-1, G-1 |

**Prosjek: 8,2/10** (prije: 7,1 → 7,3 → 8,2). **Nijedan video nije 10/10.** Jedan je NOT READY (decaf). Ostali su objavljivi, ali ne prolaze vlasnikov launch bar.

---

## 3. Nalazi (svaki ima timestamp i popravak)

### P0
**DC-1. Decaf coffee (TT): dva prazna prolaza po ~10 s i vrhunac je mokraća** (kriteriji b, c, d, g). `frames/dc.png`, `sheets/decaf-…-sheet2/3`:
- **22–32 s:** nema kartice. Stoji samo chip "NEXT · +2:00 · Kidneys", sat ide +0:08 → +1:50, a tijelo prazno.
- **46–56 s:** opet nema kartice. Stoji chip "NEXT · +24:00 · 24 hours later", sat ide +2:50 → +22:55.
- "Climax" cue (33,9 s) je "It collects in your bladder for hours." To nije vrhunac.
- Hook (0 s) je generički "What happens inside you in 24 hours? 250 ml of decaf filter coffee."

**Popravak:**
- (1) Decaf treba svoju priču, isto kao espresso. Hook: "Decaf: is there still caffeine in it?" Odgovor ide sredinom videa iz modela, npr. "About 2 mg, a regular cup has ~95 mg", s mjeračem kofeina u mozgu (`caffeineMg` iz baze).
- (2) Dodati espresso-toilet karticu: "Even decaf gets the colon moving in some people". Literatura (Rao 1998) to pokazuje i za decaf, pa je istinito i poznato normiejima.
- (3) Planer: chip "NEXT" bez kartice ne smije trajati dulje od 4 s. Višak vremena treba ići u glide s mikro-događajem (kamera prema organu, mjerač urina raste) ili skratiti video na 62 s s gušćim karticama.
- (4) Test: najdulji interval bez kartice u singlu ≤ 4 s (osim 24 h beata i end carda).

### P1
**O-1. Oat milk (Shorts): hook-pitanje nema odgovor** (a, g, h).
- Kadar 0 pita "More blood sugar than cow's milk?". Do 26,6 s video pokazuje samo "Your blood sugar climbs to its peak." (+20–46 %). Usporedbe s mlijekom nema nigdje.
- Pitanje bez odgovora je clickbait (rizik za Meta/YouTube politike), a gledatelj ostaje bez isplate.
- **Popravak:** kartica na vrhuncu (≈ 16–20 s): "Yes: about 2× the rise of the same glass of cow's milk." Broj iz modela: usporediti `peak` za oat milk i milk-whole istog volumena. Kartica ide uz mjerač s oznakom "cow's milk" (tanka siva crta na istom grafu). Ako model ne daje jasnu razliku (< 20 %), hook se ne smije koristiti. Test: svaki hook-pitanje ima karticu-odgovor u istom videu.

**C13-1. Compare espresso vs beer, ~36 s: chip "NEXT · +2:46 · Peak"**, a sljedeća kartica je "ALCOHOL GONE: The alcohol is gone after about 1–4 h." (`sheets/compare-espresso-…-sheet2`, frame 9).
- Kriv je naslov poglavlja (a, e). Normie čita "Peak" i očekuje vrhunac, a dobije "alcohol gone".
- **Popravak:** u `planCompare` chip uzima naslov poglavlja strane koja ima sljedeći stop (pivo: "Alcohol gone"), a ne naslov stopa druge strane. Bolje je koristiti ljudski teaser kao u singlu: "Coming up: when the beer is gone."

**W-1. Compare wine vs beer (Reels), 38–43 s: chip "Faster out ≠ better for you."** (`sheets/compare-red-wine-…-sheet3`, prva 2 framea).
- Nijedna kartica prije ne govori tko je "faster out". Chip je izvan konteksta i zbunjuje (a, e).
- **Popravak:** chip prikazati samo kad je prethodno izrečena razlika u "gone" vremenu ("Wine is out ~25 min sooner"). Inače ga izostaviti.

**SA-1. Salmon (TT), 51–56 s: chip "NEXT · +24:00" stoji ~5 s bez kartice** (`frames/sa.png`, +4:52 → +23:59) (c).
- **Popravak:** isto pravilo kao DC-1 (3). Najbolje je kartica "The protein is now building and repairing you." iz poglavlja "Building blocks" (m150), koje se uopće ne prikazuje.

**DC-2 / G-2. Slabi hookovi bez broja ili pitanja** (b):
- beer ×1: "500 ml of beer. Watch what alcohol does.";
- wine hook B: "150 ml of red wine. Watch what alcohol does." Hook B je slabiji od A ("Is it gone by the next morning?"), pa A/B test nema smisla;
- crepes: "434 kcal. Watch it for 24 hours.";
- decaf (vidi DC-1).

**Popravak:** formula za alkohol: "1 beer: how long until it's out of your blood?", s odgovorom "1–4 h" na kartici. Za crepes: "2 Nutella crepes: about 5 teaspoons of sugar in your blood." Formula "škrob → žličice" već postoji za kaiser. Hook B mora biti druga formula, a ne opisni fallback. Test: hook sadrži broj ili "?".

**CW-1. Compare cola vs water (Shorts), 0 s: hook "Cola vs Water."**, bez igre pogađanja (b, c). TikTok opis kaže "Comment: cola or water?", a ništa nije pitano. Long verzija i ostali comparei imaju "Guess: …".
- **Popravak:** kao hamburger-cola: "Guess: which leaves your stomach first?" (voda 13 min, cola ~30 min), reveal na ≥ 55 %. Shorts compare mora imati isti guess mehanizam.

**W-2. Compare wine vs beer: verdict "Less alcohol: Red wine (16 g vs 20 g)." na +24:00 i end cardu** (h).
- Tekst je točan, ali kao jedina poruka na kraju čita se kao preporuka vina.
- **Popravak:** dodati drugi red "Both: don't drive." ili "Both: Focus may dip.", tako da presuda nikad ne stoji sama.

### P2
- **G-1. Prazni donji dio kadra (y 1480–1920) u svim videima:** to je ispravno zbog UI platforme, ali tijelo tamo izgleda odrezano i tamno. Na nekim stopovima kamera može spustiti fokus organa za ~5 % (ostalo otprije, vlasnik je odlučio ne mijenjati). Ne broji se kao greška ako vlasnik to prihvati.
- **G-3. End card single videa ima 4 lampice, a 3–4 su "Fine all day" / "Normal all day"** (`frames/ends.png`). To je najmanje zanimljiva informacija na kraju. Isplatu bi pojačao jedan istaknuti broj ("Peak +2.3 mmol/L at 20 min", "39 g protein used") iznad lampica.
- **K-1. Kaiser Shorts:** hook kaže "about 7 teaspoons of sugar", ali nijedna kartica to ne ponavlja. Treba kartica na vrhuncu (+1:00): "About 7 teaspoons of sugar reach your blood." Broj je u poglavlju, ali Shorts ga izreže.
- **PZ-1. Pizza:** "A whole pizza (1154 g)" je obiteljska pizza (otprije). Builder bi trebao ponuditi "medium 30 cm" kao default za "whole".
- **SA-2. Salmon:** kartice na 39–51 s su "Then it joins your blood." (6 s, 0,8 w/s) i "Blood fat is highest around now." (6 s). Sporo je. Treba skratiti na 4,5 s i dodati broj na karticu ("+0.3 mmol/L, a normal rise").
- **P2-T1.** Duljina Shortsa je na rubu minimuma (vidi gore).

---

## 4. Top 5 nadogradnji koje vode do 10/10 i viralnosti
1. **Svaki hook mora imati broj ili pitanje, i svako pitanje mora dobiti odgovor u videu (G-2, O-1, CW-1).** Test-pravilo umjesto ručnog odabira: hook ⊃ (broj ∨ "?") i (hook ima "?" ⇒ ∃ kartica-odgovor). To diže prvu sekundu i isplatu.
2. **Pravilo bez praznog hoda: ≤ 4 s bez kartice ili mikro-događaja (DC-1, SA-1).** Jedan sweep test za 178 + 83 stavki. Rješava decaf, losos i svaku "dosadnu" hranu odjednom.
3. **Priča za "dosadnu" hranu iz najjačeg kontrasta u bazi:** decaf ↔ kofein, losos ↔ protein, voda ↔ brzina. Svaka stavka dobiva "story signal". Bez toga decaf i voda nikad neće biti 10/10.
4. **End card s jednim herojskim brojem (G-3).** Lampice ostaju, ali iznad njih ide najveći broj iz videa. To je zadnji frame prije petlje i najviše se screenshota i dijeli.
5. **Compare: chip i teaser uvijek ljudskim riječima za stranu koja ide sljedeća (C13-1, W-1),** plus drugi red sigurnosti uz svaku alkoholnu presudu (W-2).

## Zaključak
- Runda 13 je stvarno popravila sva tri P0 iz kritike b. Provjereno na frameovima:
  - end card prikazuje istu minutu vrhunca kao video;
  - losos ima 9 kartica i mjerač masti;
  - pizza kaže "by 7 hours".
- Prosjek je **8,2/10**. 17/18 je objavljivo.
- **0/18 je 10/10.**
- Do vlasnikovog bara dijele nas jedan P0 (decaf: 2 × ~10 s praznog hoda i hook bez priče) i 8 P1 nalaza:
  - oat milk pitanje bez odgovora;
  - chip "Peak" umjesto "Alcohol gone" u espresso-pivo compareu;
  - chip "Faster out ≠ better" bez konteksta;
  - salmon 5 s bez kartice;
  - slabi hookovi za pivo ×1, vino B i crepes;
  - Shorts cola-voda bez igre pogađanja;
  - presuda za vino bez sigurnosnog reda.
