# Kritika videa nakon runde 11 (2026-10-30)

Autor: critic agent (Opus). Nastavak na `video-critique-2026-10-29.md`. Kod nije diran i ništa nije commitano.

**Uzorci:** `C:\claudework\video-samples\2026-10-29-critique11\` sadrži:
- 13 MP4 datoteka;
- `sheets/`: kontakt listove, 1 frame svake 2 s, s ucrtanom safe zonom;
- `render-log.txt`: planove, kartice, cue-ove i opise za platforme.

Svi su renderirani kroz pravi UI: `render11.cjs`, jedan headless Chrome i privremeni Vite na 5201. Server i Chrome su ugašeni nakon rendera.

## Metoda
- **Tehnika:** ffprobe, `ebur128 peak=true`, `blackdetect` i dead-zone detektor (`deadzone.cjs`, prag 2,0, ≥ 3 s).
- **Kontakt listovi:** 1 frame svake 2 s, 360×640. Crvene linije su konzervativna safe zona: gore y = 210, dolje y = 1480, lijevo x = 60, desno x = 940.
- **Ciljani frameovi:** frame 0, kraj i petlja, usporedba peak frameova compare ↔ single.
- **Kartice:** brzina čitanja iz `[vqa] plan` (trajanje svake kartice i riječi u sekundi).
- **Opisi:** tekst opisa za TikTok, IG, FB i YT iz share dijaloga.

## Tehnički rezultati (svi prolaze)

| Video | Rez | Trajanje | Pravilo | LUFS | TP dBTP | Crni / mrtvi kadrovi |
|---|---|---|---|---|---|---|
| meal-burger-fries-cola | TikTok | 66,3 s | ≥ 60 ✓ | −14,1 | −2,1 | 0 / 0 |
| pizza-builder | TikTok | 65,0 s | ✓ | −14,1 | −1,7 | 0 / 0 |
| cola | TikTok | 69,0 s | ✓ | −14,2 | −1,9 | 0 / 0 |
| espresso | TikTok | 62,3 s | ✓ | −14,2 | **−1,1** | 0 / 0 |
| beer ×1 | TikTok | 62,7 s | ✓ | −14,2 | −1,8 | 0 / 0 |
| beer ×3 kroz 2 h | TikTok | 64,5 s | ✓ | −14,2 | −2,1 | 0 / 0 |
| red wine | TikTok | 62,3 s | ✓ | −14,1 | **−1,2** | 0 / 0 |
| crepes s čokoladnim namazom (novo) | TikTok | 65,2 s | ✓ | −14,1 (LRA **1,6**) | −1,9 | 0 / 0 |
| cinnamon roll (novo) | Reels | 49,3 s | 45–55 ✓ | −14,2 | −2,0 | 0 / 0 |
| kaiser roll (novo) | Shorts | 29,6 s | 23–30 ✓ | −14,2 | −1,9 | 0 / 0 |
| red wine, hook B | Shorts | 29,3 s | ✓ | −14,2 | −1,7 | 0 / 0 |
| compare hamburger vs cola | TikTok | 71,6 s | ✓ | −14,2 | −1,5 | 0 / 0 |
| compare espresso vs beer | TikTok | 71,1 s | ✓ | −14,2 | −1,9 | 0 / 0 |

- Svih 13: 1080×1920, 30 fps, nb_frames = trajanje × 30, 0 grešaka u konzoli.
- **Brzina teksta:**
  - single kartice imaju 0,6–2,2 riječi/s (najbrža je "Almost all has moved on by 4 hours.", 2,2 w/s kroz 3,6 s);
  - compare kartice imaju 1,7–2,5 riječi/s za oba stupca zajedno;
  - ništa nije prebrzo.
- **Safe zona:**
  - Sav tekst u singlovima je unutar okvira. Najniži element je traka napretka na y ≈ 1430.
  - Hook i handle dosežu x ≈ 1000, ali samo na y < 420, iznad desnog stupca ikona. To je OK.
  - Jedino odstupanje: red lampica u compareu (y ≈ 1560) vidi P2-1.

---

## Ocjene po videu

H = hook, R = retencija, B = tijelo/vizual, C = jasnoća, S = zvuk, A = točnost, L = petlja.

| # | Video | H | R | B | C | S | A | L | **/10** | Presuda |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | meal burger+fries+cola (TT) | 7 | 7 | 8 | 8 | 8 | 8 | 8 | **7,5** | READY |
| 2 | pizza builder (TT) | 7,5 | 7 | 8 | 8 | 8 | 7,5 | 8 | **7,5** | READY |
| 3 | cola (TT) | 8,5 | 8 | 8 | 8 | 8 | 8,5 | 8 | **8** | READY |
| 4 | espresso (TT) | 7,5 | 6,5 | 8 | 8 | 7,5 | 8,5 | 8 | **7,5** | READY (P1-3) |
| 5 | beer ×1 (TT) | 6,5 | 7 | 8 | 8 | 8 | 8 | 8 | **7,5** | READY |
| 6 | beer ×3 kroz 2 h (TT) | 8 | 8 | 8,5 | 8 | 8 | 8,5 | 7,5 | **8** | READY |
| 7 | red wine (TT) | 7,5 | 7 | 8 | 8 | 7,5 | **5,5** | 7,5 | **7** | **NOT READY** (P0-1) |
| 8 | crepes s čok. namazom (TT) | 6 | **5** | 7 | 8 | 6,5 | 7,5 | 7 | **6** | **NOT READY** (P0-3) |
| 9 | cinnamon roll (Reels) | 8 | 7,5 | 8 | 8 | 8 | 8 | 8 | **8** | READY |
| 10 | kaiser roll (Shorts) | **5,5** | 7,5 | 8 | 8 | 8 | 8 | 8 | **7** | READY (P1-1) |
| 11 | red wine hook B (Shorts) | 6,5 | 7,5 | 8 | 8 | 8 | **5,5** | 8 | **7** | **NOT READY** (P0-1) |
| 12 | compare hamburger vs cola (TT) | **5,5** | 7 | 7,5 | 7 | 8 | 7 | 7,5 | **7** | READY (P1-2) |
| 13 | compare espresso vs beer (TT) | 8 | 7,5 | 7,5 | 7,5 | 8 | **5** | 8 | **7** | **NOT READY** (P0-2) |

**Prosjek: 7,3/10** (prošla kritika: 7,6/10 na 16 starih slučajeva). 9/13 je READY, a 4 su NOT READY zbog 3 P0 nalaza.

Pad prosjeka nije regresija. Ovaj put su uključene nove namirnice (crepes, kaiser), vino i compare hamburger vs cola, koji ranije nisu testirani.

---

## P0: blokira objavu

### P0-1. Vino: lampica "Brain & sleep: Fine all day" je zelena nakon alkohola
**Gdje:**
- Red wine TT, lampice na 56,4–57,1 s i end card na 58,3–62,3 s (`sheets/red-wine-tiktok-long-sheet3.png`, zadnji frame).
- Red wine Shorts hook B, lampice na 25,4–26,2 s i end card na 26,8–29,3 s.

**Problem:**
- 150 ml vina ima vrh BAC 0,012–0,029 % (gauge "Low, not zero") i dobiva zeleno "Fine all day".
- 500 ml piva ima vrh BAC 0,012–0,031 % (gauge "Focus may dip") i dobiva žuto "Attention may be worse 37 min in", plus karticu "Attention may already be worse."
- Gotovo ista izloženost dobiva suprotne presude. Granica oko 0,03 % je oštar rez.
- To krši pravilo "alkohol se nikad ne slavi". Zelena lampica uz alkohol je i komunikacijski rizik (Meta i TikTok politike za alkohol).

**Popravak:**
- Za svaku stavku s alkoholom > 0 lampica Brain ne smije biti zelena. Minimalno je žuta: "Low alcohol for ~1–2 h" ili "Alcohol in blood until ~HH:MM".
- Gauge label i karticu treba izjednačiti po istom pragu za pivo i vino: "Low, not zero" ↔ "Focus may dip". Najbolje je uvesti jedan prag u `alcohol` modelu, s hysteresisom ili rasponom, umjesto ruba na 0,030 %.
- Dodati test: alkohol > 0 g ⇒ brain lamp ≠ green.

### P0-2. Compare espresso vs pivo: "peaks now" u krivo vrijeme i drugačiji BAC od singlea
**Gdje:** stop na +1:30, video 11,9–24,0 s (`sheets/compare-espresso-vs-beer-tiktok-long-sheet1.png`, frameovi 7–10).

**Problem:**
- Espresso strana kaže "Caffeine in your blood peaks now." na +1:30. Vlastiti chip pokazuje 54 mg, a single espresso ima vrh **58 mg na +0:43**. Kofein je na +1:30 već u padu.
- Pivska strana kaže "Blood alcohol is at its highest now." na +1:30. Single pivo (isto 500 ml) ima vrh na **+0:48** s BAC 0,012–0,031 %. Compare na +1:30 pokazuje 0,009–0,024 %.
- Ista namirnica u dva videa ima različit vrh i različit raspon. Ili compare tjera zajednički stop (m90) na obje strane, ili compare koristi drugi model (npr. obrok u 17:00). U oba slučaja tekst na ekranu nije točan.
- Okvir za usporedbu: `cmpcheck.png` u scratchpadu, compare +0:02 / +1:30 / single beer +0:48 / single espresso +0:43.

**Popravak:**
- U `planCompare` svaka strana dobiva svoj "peak" stop u svoje vrijeme, kao u singleu: espresso ~+0:43, pivo ~+0:48.
- Ako se zadrži zajednički stop, kartica mora reći što je istina u tom trenutku: "Caffeine: past its peak, ~54 mg left." / "Blood alcohol: just past its peak."
- Provjeriti zašto BAC istog piva nije isti u compareu i singleu. Ako je razlog vrijeme obroka ili hrana, to treba pisati na ekranu ("with lunch" / "after a meal").
- Dodati test: peak-vrijeme i peak-vrijednost svake strane u compareu = single istog unosa (±5 %).

### P0-3. Crepes (i svaka hrana bez GI): nema vrhunca, a sat stoji 15 s
**Gdje:** crepes TT, 6–22 s.
- Četiri kartice zaredom ("Your stomach churns it into a paste." → "Half has moved on after 116 minutes." → "Almost all has moved on by 4 hours." → "The fat leaves last.") idu dok sat stoji na **+0:01**, a mjerač pokazuje "199 g".
- Kamera se miče (dead-zone detektor je čist), ali radnje nema.
- Cue log nema `peak` ni `riser`: nema udarca ni trenutka "wow". LRA je 1,6 LU, najravnija glazba u setu.
- End card kaže "Blood sugar & energy: Not tracked for this one". To je za palačinke s Nutellom antiklimaks: normie upravo to želi vidjeti.

**Uzrok:** `gi: null` za sve tri crepe varijante (u fooddb.json). Bez GI nema krivulje šećera, pa nema ni vrhunca. Sve stomach kartice se zato skupe u prvoj minuti.

**Popravak:**
- (a) Generator: kad nema `peak` cuea, vrhunac je drugi najjači događaj. Primjeri: "Fat in your blood is highest" na +3:30, ili "Half has left your stomach" na t½, kao **pravi stop sa satom** na t½, ne kartica na +0:01. Sat mora biti na vremenu o kojem kartica govori.
- (b) Kartice s vremenom ("after 116 minutes", "by 4 hours") moraju se prikazati kad sat dođe do tog vremena. Mogu ići i kao "Coming up" najava, ali nikad dok sat stoji na +0:01.
- (c) Podaci: za crepes postaviti GI preko proxyja (pancake ili wheat flour + sucrose), označen "estimated" u "How we know". Ili barem prikazati šećerni gram-mjerač ("16 g sugar, about 4 teaspoons"), koji je ionako najjači hook za ovu hranu.
- (d) Test: nijedan single video nema > 6 s kartica dok sat stoji, a svaki single ima ≥ 1 `peak` cue.

---

## P1: jako diže viralnost i kvalitetu

1. **Kaiser roll Shorts, hook na 0 s:** "1 kaiser roll. Watch where it goes."
   - Hook nema broj ni ulog, pa je ovo najslabiji hook u setu. Na Shortsima je to prvi uzrok swipea.
   - **Popravak:** za škrobnu hranu formula "škrob → šećer". Primjer: "1 kaiser roll = ~8 teaspoons of sugar in your blood. Watch it happen." Broj je glukoza iz škroba (≈ 30 g ugljikohidrata / 4 g). Istinito je i jako. Treba kartica "Starch turns into blood sugar" na +0:25 (već postoji).
   - Isto vrijedi za pecivo, kruh, rižu i krumpir.
2. **Compare hamburger vs cola, hook na 0 s:** samo "Hamburger vs Cola."
   - Nema pitanja ni igre pogađanja, iako espresso vs pivo ima odličan "Guess: which is still in you at bedtime?". Uz to opis kaže "Did you guess right?", a ništa nije pitano.
   - **Popravak:** compare hook uvijek iz `verdictOf` metrike. Primjer: "Guess: which spikes your blood sugar more?" Odgovor je već u kadru na 65,7 s.
   - Presuda "Hamburger wins: a smaller blood sugar peak" uz 251 vs 139 kcal zvuči kao "burger je zdraviji". Bolje je "Smaller sugar spike: Hamburger (+1.7 vs +2.3 mmol/L)", bez riječi "wins" kad presuda gleda samo jednu metriku.
3. **Espresso TT: odgovor na hook je potrošen na ~8 s.**
   - "Coffee sends 1 in 3 to the toilet." odgovara na "Does coffee send you to the toilet?" već u 8. sekundi. Ostalih 54 s nema otvoreno pitanje.
   - Kartice su najsporije u setu: 1,0–1,1 w/s, a "Your kidneys flush out its broken-down pieces." traje 6,3 s.
   - **Popravak:** odmah nakon odgovora otvoriti drugu petlju: "Coming up: how much is still in you at bedtime?" Odgovor ide na BEDTIME ("About a fifth of the caffeine remains."). Kartice ispod 1,2 w/s skratiti na ≤ 4,5 s.
4. **Opisi za platforme: krivi hashtagovi**, svi u `video-caption.ts`, izbor glavnog taga:
   - crepes → `#spread`, treba `#crepes`;
   - cinnamon roll i kaiser roll → `#roll`, treba `#cinnamonroll` / `#kaiserroll` ili `#bread`;
   - meal → samo `#cola`, treba `#fastfood #burger`;
   - espresso → `#bloodsugar` (kofein ne mijenja šećer), treba `#caffeine #coffee`;
   - compare TikTok → nema `#inside24h` (brend serije ispada).

   **Popravak:** glavni tag iz imena hrane bez generičkih riječi (spread, roll, with), a tematski tag iz glavnog "story" signala (kofein → `#caffeine`, alkohol → `#alcohol`, šećer → `#bloodsugar`). `#inside24h` uvijek ostaje.
5. **Vino TT, 13–17 s:** kartica "Low, but not zero." traje 2,6 s, ali gauge pokazuje BAC 0,012–0,029 % bez ijedne granice (pivo pokazuje US i EU granicu). Dodati granice ili jednu usporedbu ("about a tenth of the US driving limit") za kontekst.
6. **Compare espresso vs pivo, 38–50 s:** "We can't tell when you're safe to drive." stoji uz kicker "ALCOHOL GONE". Kontradikcija je zabilježena i u kritici 10-29 (P1-1) i još nije popravljena. Kicker treba biti "AFTER DRINKING".

## P2: polish

1. **Compare, red lampica na y ≈ 1560 kroz cijeli video:** to je ispod safe zone, a TikTok i Reels opis ga prekrivaju. Pomaknuti iznad y = 1480 ili sakriti u reel exportu (lampice ionako dolaze u end beatu).
2. **True peak espresso −1,1 dBTP, vino −1,2 dBTP:** to je unutar pravila (≤ −1), ali bez rezerve. AAC transkod na platformi može dodati +0,3–0,5 dB. Postaviti ceiling limitera na −1,5 dBTP.
3. **Gramatika Shorts naslova:**
   - "What 2 crepes with chocolate spread **does**" i "What 3 × 500 ml of beer over 2 h **does**" → "do" za množinu. Bolje: "What 2 chocolate crepes do inside you in 24 h".
   - Shorts opis ponavlja frazu: "Watch where it goes. An hour-by-hour simulation of where it goes…".
4. **Cinnamon roll end card (46,3–49,3 s):** "Sugar up for a while 43 min in" se čita nespretno. Bolje: "Sugar peak at 43 min, then back down".
5. **Pizza, frame 0:** "A whole pizza (1154 g): 2723 kcal". 1154 g je obiteljska pizza od ~40 cm, a normie pod "whole pizza" misli ~30 cm (700–900 g). Provjeriti veličinu u builderu ili napisati "A whole family pizza". Komentari "to nije cijela pizza" su vjerojatni.
6. **Compare hamburger vs cola, redoslijed na 3–8 s:** "251 kcal in total." dolazi prije "Hamburger.". Naziv treba ići prvi.
7. **Compare espresso vs pivo, "Too little to affect your sleep." uz 32 mg na bedtime:** za osjetljive je to prejaka tvrdnja. Bolje: "Probably too little to affect most people's sleep."
8. **Singlovi, donjih ~25 % kadra (y 1480–1920):** samo tamno tijelo, poznato otprije. Tu se može spustiti kamera ili organ u fokusu.

---

## Top 5 promjena koje bi najviše podigle viralni potencijal
1. **Hook s brojem za svaku hranu (P1-1, P0-3c).** Formula "X = N teaspoons of sugar in your blood" za škrob i slatko je najdjeljiviji format u nišu. Trenutno je dobivaju samo cola i cinnamon roll, a kaiser, crepes i pivo ×1 imaju gole hookove.
2. **Svaki video mora imati vrhunac i sat koji ide (P0-3).** Za hranu bez GI treba sintetizirati vrhunac (masnoća u krvi, t½ želuca). Bez toga nove namirnice izgledaju kao "ništa se ne događa" i padaju ispod 50 % gledanosti.
3. **Igra pogađanja u svakom compareu (P1-2).** "Guess: which…?" plus odgovor sredinom videa i presuda na kraju je najjača retencijska mehanika koju aplikacija ima (espresso vs pivo). Hamburger vs cola je bez nje mlak.
4. **Druga otvorena petlja odmah nakon ranog odgovora (P1-3).** Kad hook-pitanje dobije odgovor u < 15 s, odmah treba "Coming up: …" s odgovorom na 60–70 % videa. Tako se drže espresso, kava i svi "toilet" hookovi.
5. **Search-first opisi s točnim hashtagovima (P1-4).** `#crepes`, `#cinnamonroll`, `#caffeine` i `#fastfood` su stvarni pojmovi koje ljudi traže. `#spread` i `#roll` ne donose ništa. Uz to `#inside24h` uvijek treba zadržati kao seriju.

## Zaključak
- **9/13 READY**, prosjek **7,3/10**.
- **P0 su tri:**
  - vino ima zelenu "Brain: Fine all day" (alkohol);
  - compare espresso vs pivo kaže "peaks now" u krivo vrijeme i ima BAC drugačiji od singlea;
  - crepes nema vrhunac, a sat stoji 15 s, što je sistemski problem za svu hranu bez GI.
- Prva dva su pitanje točnosti i sigurnosti i moraju se riješiti prije objave alkoholnih videa. Treći treba riješiti prije objave novih namirnica.
- Tehnika je besprijekorna: duljine po rezu, −14,1/−14,2 LUFS, 0 crnih i mrtvih kadrova, tekst u safe zoni, čitljiv tempo.
