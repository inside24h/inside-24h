# Ponovna kritika videa nakon runde 12 (2026-10-30, b)

Autor: critic agent (Opus). Nastavak na `video-critique-2026-10-30.md`. Pregledan je trenutni kod: commit d688ec7. Kod nije diran i ništa nije commitano.

**Uzorci:** `C:\claudework\video-samples\2026-10-30-critique12\` sadrži:
- 16 MP4 datoteka: isti set od 13 videa, plus nove namirnice salmon (TT long) i oat milk (Shorts), plus compare red wine vs beer kao Reels rez;
- `sheets/`: kontakt listove, 1 frame svake 2 s, s ucrtanom safe zonom;
- `frames/ends.png`: end cardovi;
- `frames/grid1.png`: hookovi i vrhunci;
- `render-log.txt`: planove, kartice, cue-ove i opise za platforme.

Render je napravljen kroz pravi UI s jednim headless Chromeom i privremenim Viteom, koji su ugašeni nakon rendera.

## Tehnički rezultati (svi prolaze)

| Video | Rez | Trajanje | LUFS | TP dBTP | Crni / mrtvi kadrovi |
|---|---|---|---|---|---|
| meal burger+fries+cola | TT | 67,2 | −14,2 | −3,0 | 0/0 |
| pizza builder | TT | 67,3 | −14,1 | −3,0 | 0/0 |
| cola | TT | 65,9 | −14,2 | −3,3 | 0/0 |
| espresso | TT | 62,3 | −14,2 | −1,7 | 0/0 |
| beer ×1 | TT | 62,7 | −14,2 | −3,0 | 0/0 |
| beer ×3 kroz 2 h | TT | 67,1 | −14,1 | −2,9 | 0/0 |
| red wine | TT | 62,7 | −14,2 | −1,7 | 0/0 |
| crepes s čok. namazom | TT | 62,4 | −14,2 | −2,3 | 0/0 |
| salmon (novo) | TT | 62,1 | −14,1 | −3,4 | 0/0 |
| cinnamon roll | Reels | 49,7 | −14,2 | −2,6 | 0/0 |
| compare red wine vs beer (novo) | Reels | **54,8** | −14,2 | −3,1 | 0/0 |
| kaiser roll | Shorts | 29,6 | −14,3 | −2,7 | 0/0 |
| oat milk (novo) | Shorts | 26,6 | −14,3 | −3,0 | 0/0 |
| red wine, hook B | Shorts | 29,3 | −14,3 | −1,9 | 0/0 |
| compare hamburger vs cola | TT | 68,6 | −14,2 | −3,0 | 0/0 |
| compare espresso vs beer | TT | **74,6** | −14,3 | −2,8 | 0/0 |

- Svih 16: 1080×1920, 30 fps, 0 grešaka u konzoli. Sve duljine su unutar pravila.
- Dva videa su na rubu limita: compare espresso-pivo ima 0,4 s rezerve do 75 s, a wine-beer Reels ima 0,2 s do 55 s. Preporuka P2-4.
- Tekst je unutar safe zone. Brzina čitanja je ≤ 2,3 w/s.

---

## 1. Provjera nalaza iz `video-critique-2026-10-30.md`

| Nalaz | Status | Dokaz |
|---|---|---|
| P0-1 vino: zelena lampica mozga | **FIXED** | Vino TT end card: "Brain & sleep: Attention may be worse 41 min in" (žuto). Mjerač "Focus may dip, BAC 0.012–0.029 %, US 0.08 / EU 0.05" (`frames/grid1.png`). Vino i pivo sada imaju istu oznaku. |
| P0-2 compare: "peaks now" u krivo vrijeme | **FIXED** | Espresso vs pivo: espresso "peaks now" je na +0:43 s 58 mg (= single), pivo "highest now" na +0:48 s BAC 0.012–0.031 % (= single). `sheets/compare-espresso-vs-beer-…-sheet1/2`. |
| P0-3 crepes bez vrhunca i sat stoji | **FIXED za crepes**, ali **NOT FIXED kao klasa** | Crepes: vrhunac na +1:10 (PEAK), sat ide (+1:56, +2:00, +3:30, +4:13). Novi losos ima isti problem u drugom obliku, vidi P0-2 dolje. |
| P1-1 kaiser hook | **FIXED** | "1 kaiser roll: about 7 teaspoons of sugar. Watch the starch become blood sugar." |
| P1-2 hamburger vs cola bez igre | **FIXED**, s novim problemom | Hook je "Guess: which raises your blood sugar more?", a trofeja nema. Odgovor ("Bigger rise: Cola.") dolazi već na ~25 s, vidi P1-1. |
| P1-3 espresso druga petlja | **DJELOMIČNO** | Druga petlja postoji, ali glasi "Coming up: peak." (11,9 s). Normie ne zna što je "peak". |
| P1-4 hashtagovi | **FIXED**, s regresijom u gramatici | `#crepes #cinnamonroll #kaiserroll #caffeine #fastfood`, a `#inside24h` je uvijek tu. Ali Shorts naslov sada glasi "What 500 ml of beer **do**…", vidi P1-4. |
| P1-5 vino: granice na mjeraču | **FIXED** | |
| P1-6 kicker "ALCOHOL GONE" uz "safe to drive" | **FIXED** | |
| P2-1 red lampica u compareu | **FIXED** | Isključen. Nova traka "BLOOD SUGAR RISE" stoji na y ≈ 1450–1490, na rubu safe zone (P2-1). |
| P2-2 TP | **FIXED** | Sve je ≤ −1,7 dBTP. |
| P2-4 "Sugar up for a while" | **Promijenjeno u "Sugar peak N min in"**, a to je sada **netočno** | Vidi P0-1. |

---

## 2. Ocjene

H = hook, R = retencija, B = tijelo/vizual, C = jasnoća, S = zvuk, A = točnost, L = petlja.

| # | Video | H | R | B | C | S | A | L | **/10** | Presuda |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | meal burger+fries+cola | 7 | 7 | 8 | 8 | 8 | 6 | 8 | **7** | NOT READY (P0-1) |
| 2 | pizza builder | 7,5 | 7 | 8 | 8 | 8 | **4,5** | 8 | **6,5** | **NOT READY** (P0-1, P0-3) |
| 3 | cola | 8,5 | 8 | 8 | 8 | 8 | 6,5 | 8 | **7,5** | NOT READY (P0-1) |
| 4 | espresso | 7,5 | 7 | 8 | 7,5 | 8 | 8,5 | 8 | **7,5** | READY (P1-2) |
| 5 | beer ×1 | 6,5 | 7 | 8 | 8 | 8 | 8,5 | 8 | **7,5** | READY |
| 6 | beer ×3 kroz 2 h | 8 | 8 | 8,5 | 8 | 8 | 8,5 | 7,5 | **8** | READY |
| 7 | red wine | 7,5 | 7 | 8 | 8 | 8 | 8,5 | 7,5 | **7,5** | READY |
| 8 | crepes | 6 | 7 | 7,5 | 8 | 8 | 6,5 | 7,5 | **7** | NOT READY (P0-1) |
| 9 | salmon (novo) | 5 | **4** | 6,5 | 7 | 8 | 7,5 | 7 | **5,5** | **NOT READY** (P0-2) |
| 10 | cinnamon roll (Reels) | 8 | 7,5 | 8 | 8 | 8 | 6,5 | 8 | **7,5** | NOT READY (P0-1) |
| 11 | compare red wine vs beer (Reels) | 5 | **5** | 6 | 6,5 | 8 | 7 | 7 | **6** | **NOT READY** (P1-3) |
| 12 | kaiser roll (Shorts) | 8 | 7,5 | 8 | 8 | 8 | 8 | 8 | **8** | READY |
| 13 | oat milk (Shorts, novo) | 5 | 7 | 8 | 8 | 8 | 8 | 7,5 | **7** | READY (P1-5) |
| 14 | red wine hook B (Shorts) | 6,5 | 7,5 | 8 | 8 | 8 | 8,5 | 8 | **7,5** | READY |
| 15 | compare hamburger vs cola | 8 | 6 | 7,5 | 7,5 | 8 | 6 | 7,5 | **7** | NOT READY (P0-1) |
| 16 | compare espresso vs beer | 8 | 7,5 | 7,5 | 7,5 | 8 | 8 | 8 | **7,5** | READY |

**Prosjek: 7,1/10.** 7/16 je READY. Na istih 13 videa kao prošli put prosjek je 7,3 (prije 7,3).

Stari P0 nalazi su popravljeni, ali je runda 12 uvela novi sistemski P0 (end card). Nove namirnice (losos) i novi compare (vino-pivo) otkrivaju dvije slabosti koje testovi ne hvataju.

---

## 3. P0: blokira objavu

### P0-1. End card "Sugar peak N min in" ne odgovara vrhuncu u videu (sistemski, nastalo u rundi 12)
Svaki video sa šećerom kontradiktira sam sebi (`frames/ends.png`, `sheets/*-sheet4`):

| Video | Vrhunac u videu (kartica "climbs to its peak" + oznaka PEAK) | End card |
|---|---|---|
| cola | +0:20 | "Sugar peak **13** min in" |
| meal | +1:02 | "Sugar peak **39** min in" |
| pizza | +1:50 | "Sugar peak **51** min in" |
| crepes | +1:10 | "Sugar peak **38** min in" |
| cinnamon roll | +1:03 | "Sugar peak **43** min in" |
| compare hamburger vs cola | hamburger +1:04, cola +0:20 | "45 min", "13 min" |

Broj na end cardu je trenutak kad rast prijeđe prag, a ne vrh. Prije je pisalo "Sugar up for a while 43 min in", a runda 12 je to preimenovala u "peak", pa je tvrdnja postala netočna. Normie vidi "PEAK +1:50", a 60 s kasnije "peak 51 min in". U komentarima će to biti "your app can't count".

**Popravak:** u end cardu (status note) koristiti minutu vrha istog modela koji vodi "Blood sugar peak" poglavlje: "Sugar peak at 1 h 50 min". Ako se želi zadržati početak rasta, tekst treba glasiti "Sugar up from 51 min".

**Test:** za svaki item s GI broj minuta u end cardu = minuta poglavlja "Blood sugar peak" (±2 min).

### P0-2. Losos (i sva proteinsko-masna hrana bez GI): 40 s s 3 kartice i satom koji puže
**Gdje:** salmon TT, 14,0–54,5 s (`sheets/salmon-tiktok-long-sheet2/3`):
- "Then it joins your blood." traje **12,7 s**;
- "Blood fat is highest around now." traje **11,6 s**;
- "Almost all has moved on by 4 hours." traje **15,1 s**;
- brzina čitanja je 0,4–0,5 w/s;
- sat od ~18 s do ~36 s ide samo **+3:30 → +3:35**.

Dead-zone detektor je čist samo zato što se kamera njiše. Gledatelj vidi istu rečenicu 12–15 s. Na sredini ovakvog videa ljudi swipeaju.

Uz to, vrhunac ("Fat in your blood") nema mjerač. Na ekranu je samo "62 ml urine", pa vrhunac ničim nije pokazan. End card je četiri zelene lampice i nema isplate.

**Uzrok:** `climaxOf` je dao vrhunac, ali plan ima premalo poglavlja s karticama (5 kartica za 62 s), pa planer razvlači kartice da popuni minimalnu duljinu.

**Popravak:**
- (a) Nijedna kartica ne smije biti dulja od ~6 s. Ako fali materijala, treba ubaciti kartice iz postojećih poglavlja koja su preskočena ("Building blocks" m150: "The 31 g of protein arrive as amino acids…", "Kidneys" m120, "Into the large intestine", "24 hours later" / mouth-to-toilet).
- (b) Za vrhunac masti treba mjerač "Blood fat +0.3 mmol/L" uz srce i krv, kao što šećer ima svoj.
- (c) Hook s brojem iz najjače istine: "Half a salmon fillet: 31 g of protein. Watch your body use it." Ili, za omega-3, rečenicu "Watch the fat reach your blood in 3½ hours".
- (d) Test: max trajanje kartice ≤ 6 s i ≥ 1 mjerač vidljiv na climax stopu, za svih 178 + 83 stavki.

### P0-3. Pizza: dvije kartice si proturječe
- m225: "Half has moved on after 225 minutes." (24–29 s);
- m240: "Almost all has moved on by 4 hours." (≈ 29–35 s).

Pola hrane je otišlo u 3:45, a "skoro sve" već u 4:00. Za 1154 g pizze to je nemoguće. "By 4 hours" je fiksni predložak (isti tekst ima i kebab s t½ 164 min).

**Popravak:**
- "almost all" vrijeme izračunati iz istog modela pražnjenja (npr. t90). Za pizzu je to oko 7–8 h, pa kartica treba glasiti "Almost all has moved on by about 7 hours."
- Kad je t½ > ~150 min, karticu "by 4 hours" ne prikazivati.
- Test: t(almost all) > 1,5 × t½.

---

## 4. P1

1. **Compare hamburger vs cola: odgovor na pitanje dolazi na 25 s od 68 s** ("Bigger rise: Cola.", +0:26).
   - Ostalih 43 s nema otvoreno pitanje, a end card ponavlja "Did you guess right?".
   - **Popravak:** reveal pomaknuti na 55–70 % videa. Do tada traka "BLOOD SUGAR RISE" raste bez imena pobjednika. Druga mogućnost je odmah otvoriti drugu petlju: "Coming up: which one makes you hungry again first?" (cola dip na +1:30 već postoji u modelu).
2. **Espresso, druga petlja "Coming up: peak."** (11,9–14,5 s) je prazna za normieja.
   - **Popravak:** najava treba imenovati korist za gledatelja: "Coming up: when it hits hardest." ili "Coming up: how much is left at bedtime." Generički "Coming up: <chapter title>" treba zamijeniti tablicom ljudskih teasera po poglavlju.
3. **Compare red wine vs beer (Reels): dosadan i bez priče.**
   - Hook je samo "Red wine vs Beer.", bez igre.
   - Oba mozga su ista žuta 13–36 s, a na 36–48 s **obje strane imaju identičan tekst** ("At 07:00, the alcohol should be gone." ×2, "Don't drive after drinking." ×2).
   - Plan skače s +1:19 na +12:00 i preskače "Alcohol gone" (1–4 h), a to je jedino zanimljivo pitanje: koje se prvo očisti?
   - Presuda "Red wine is the lighter choice" zvuči kao preporuka alkohola.
   - **Popravak:**
     - hook "Guess: which leaves your blood first?";
     - zadržati "Alcohol gone" stop svake strane (race);
     - kad su kartice obiju strana iste, prikazati jednu centriranu karticu umjesto dvije;
     - presuda "Less alcohol: red wine (16 g vs 20 g)", bez "choice".
4. **Gramatika Shorts naslova** (regresija runde 12): "What 500 ml of beer **do**", "What 150 ml of red wine **do**", "What 250 ml of oat milk **do**", "What 3 × 500 ml of beer over 2 h **do**".
   - Popravak pluralizacije je zahvatio i količine. Množina vrijedi samo za brojive jedinice (2 crepes, 3 beers).
   - Bolje je izbjeći pravilo: "500 ml of beer: what it does inside you in 24 h".
5. **Oat milk Shorts: generički hook** "What happens inside you in 24 hours? 250 ml of oat milk."
   - Ovo je propuštena viralna prilika: oat milk ima GI 69, više od kravljeg mlijeka (~30). Hook: "Oat milk spikes blood sugar more than cow's milk. Watch." To je istina iz baze i kontra-intuitivno. Ako je usporedba izvan opsega singlea, onda "250 ml of oat milk: about 4 teaspoons of sugar in your blood" (škrobna formula kao kaiser).
   - End card kaže "Which **food** should we test next?" za piće. Treba "drink".
6. **Pivo u compareu: "Starch and sugar turn into blood sugar."** (espresso-pivo 25–37 s, vino-pivo 13–26 s), a end card kaže "Blood sugar: not tracked here".
   - Normie čita kontradikciju, i to je dosadna kartica uz alkoholni vrhunac.
   - **Popravak:** za alkoholna pića preskočiti generičku karticu tankog crijeva ili je zamijeniti alkoholnom: "Alcohol passes straight into your blood."
7. **End card u compareu je odrezan:** "Attention may be worse 48 min …" (pivska kolona, espresso-pivo i vino-pivo). Skratiti na "Attention ↓ 48 min in" ili prelomiti u 2 reda.

## 5. P2
1. Traka "BLOOD SUGAR RISE" u compare hamburger-cola stoji na y ≈ 1450–1490, na granici donje safe zone (TikTok opis). Podići je za ~40 px.
2. Pizza "A whole pizza (1154 g)" je i dalje obiteljska veličina (otprije).
3. Losos i crepes: "Watch it for 24 hours." je najslabiji generički hook. Uvijek treba broj ili pitanje.
4. Duljine na rubu: compare espresso-pivo 74,6/75 s, vino-pivo Reels 54,8/55 s. Ciljati sredinu raspona (TT ≤ 72 s, Reels ≤ 53 s), jer platforme pri transkodu mogu dodati frame.
5. Donjih ~25 % kadra je i dalje prazno (otprije).

---

## 6. Top 5 viralnih nadogradnji
1. **Brojevi koji se slažu od hooka do end carda (P0-1, P0-3).** Viralni health sadržaj živi od toga da gledatelj vjeruje broju. Jedna kontradikcija u komentarima ("peak at 1:50 or 51 min??") ubija dijeljenje. Treba jedan izvor istine za svaku minutu na ekranu.
2. **Kontra-intuitivni hook iz baze** ("Oat milk spikes blood sugar more than milk", "A kaiser roll = 7 teaspoons of sugar", "Salmon: 31 g protein, zero sugar spike"). Formula "škrob → žličice" već radi. Treba je proširiti na "iznenađujuće nisko" i "iznenađujuće visoko" za svaki GI i protein.
3. **Kasni reveal u svakom compareu (P1-1, P1-3).** Pitanje u kadru 0, reveal na 55–70 %, presuda na kraju. Hamburger-cola ga sada daje na 37 %, a vino-pivo ga uopće nema.
4. **Mjerač na svakom vrhuncu (P0-2b).** Tijelo je zvijezda, a vrhunac bez brojke koja raste pored organa je samo rečenica. Šećer i alkohol imaju mjerač, a mast, protein i hidracija ga trebaju.
5. **Ljudski teaseri umjesto naslova poglavlja (P1-2).** "Coming up: when it hits hardest / what's left at bedtime / when it leaves you" umjesto "Coming up: peak." Jeftino je, a izravno diže prosjek gledanosti iza 50 %.

## Zaključak
- **7/16 READY, prosjek 7,1/10.**
- Sva tri stara P0 nalaza su stvarno popravljena:
  - alkoholna ljestvica je ista za sva pića;
  - vrhovi u compareu odgovaraju singlovima;
  - crepes ima vrhunac i sat koji ide.
- Novi P0:
  - (1) end card "Sugar peak N min in" je netočan u **svakom** videu sa šećerom (regresija runde 12);
  - (2) losos razvlači 3 kartice na 40 s;
  - (3) pizza ima "half 225 min" i "almost all by 4 h".
- Prioritet: P0-1 popraviti prvi. To je jedna izmjena u status noteu i otključava 6 videa.
