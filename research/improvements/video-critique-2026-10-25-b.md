# Treća kritika videa v6 (2026-10-25-b)

Autor: critic agent (Opus). Nastavak na `video-critique-2026-10-25.md`. Pregledano je 16 uzoraka iz `C:\claudework\video-samples\2026-10-25-v6\`. Nijedna datoteka koda ni uzorak nisu dirani.

**Metoda.** Ista kao prije:
- frameovi 1 fps cijeli video, 2 fps prvih 5 s i 4 fps zadnjih 6 s;
- zvuk: `ebur128` i `silencedetect`;
- dodatno sam pokrenuo **model aplikacije** (`simulateFood`, `bacRange`, samo čitanje) za jedno pivo, preko `vite-node` skripte u scratchpadu.

**Što je pregledano i kako:**
- Frame po frame: beer long, cola long, compare cola-vs-water long i compare espresso-vs-beer long.
- Samo pregled svaka 2 s: ostalih 12 videa (`P\ov_a.jpg`, `P\ov_b.jpg`, `P\ov_c.jpg`).

**Putanje frameova.** `P` = `C:\Users\TINCUC~1\AppData\Local\Temp\claude\C--Users-Tin-Cuculic\2c75f631-d1a9-45ff-8171-9d373e2eea3f\scratchpad\critic\v6`. Frame za sekundu *t* je `P\<video>\f1\t{t+1:03}.jpg`.

---

## 0. Presuda

**Spremno za objavu (READY): 10/16. Nije spremno (NOT READY): 6/16.** Svih 6 blokiraju 3 konkretne greške (B1–B3), sve su male izmjene teksta.

| Video | v4 → v5 → **v6** | Presuda | Razlog |
|---|---|---|---|
| cola long | 6 → 7 → **7** | **NOT READY** | B2: "About a third is still in you." (čita se kao trećina šećera) |
| cola short | 5 → 5 → **7,5** | **READY** | isplata "Your body burns half the fruit sugar." ✓ |
| espresso long | 5 → 7,5 → **8** | **READY** | novi hook "It sends 1 in 3 to the toilet." isplaćen u 4. s |
| espresso short | 4 → 6,5 → **8** | **READY** | |
| pivo ×3 long | 4 → 6 → **6,5** | **NOT READY** | B1 (07:00 "should be gone" nasuprot 4–14 h), B3 (US → EU granica se mijenja) |
| pivo ×3 short | 3 → 6,5 → **6,5** | **NOT READY** | B1 |
| pizza long | 5 → 7 → **7,5** | **READY** | "Mouth to toilet usually takes 14–58 hours." ✓ |
| pizza short | 5 → 6,5 → **7** | **READY** | |
| kebab long | 5 → 6,5 → **7** | **READY** | |
| kebab short | 5 → 6 → **7** | **READY** | |
| meal long | 5 → 6 → **7** | **READY** | "building blocks" je uklonjen. Mozak ~9 s je P1. |
| meal short | 4 → 6 → **7** | **READY** | |
| compare espresso vs pivo long | 3 → 5,5 → **7,5** | **READY** | novo pitanje "which is still in you at bedtime?" je pošteno |
| compare espresso vs pivo short | 3 → 5,5 → **7,5** | **READY** | |
| compare cola vs voda long | 4 → 6 → **6,5** | **NOT READY** | B2 (kartica pod KIDNEYS na +24:00), B4 ("Answer at 24 h." nakon što je odgovor već dan) |
| compare cola vs voda short | 4 → 6 → **7** | **NOT READY** (provjeriti B2) | isti generator teksta kao long. U pregledu nisam vidio karticu, ali nije potvrđeno frame po frame. |

Prosjek: 4,4 → 6,2 → **7,2/10**.

---

## 1. Provjera P0 iz 2026-10-25

| # | Stavka | Status | Dokaz |
|---|---|---|---|
| P0-1 | Spavanje uz pivo, obje polovice | **FIXED** | "You may fall asleep faster, but sleep worse." (`P\beer-3-over-2h-long\f1\t032.jpg`) |
| P0-2 | Raspon "gone" pokriva i tijelo | **FIXED, ali uvodi B1** | "The alcohol is gone after about 4–14 h." (`t037.jpg`), pa 8 s kasnije "At 07:00, the alcohol should be gone." (`t047.jpg`) |
| P0-3 | Parovi kartica (hidracija) | **FIXED** | "It hydrates like the same amount of water." (cola long, ~58 s) |
| P0-4 | Jedan broj za šećer | **PARTLY** | Mjerač i end card sada kažu isti raspon s riječima: "+26–62 % over usual: a normal rise" (cola), "+28–64 %, normal" (compare). Gram-mjerači i dalje izlaze dok krivulja kaže "dip": "4.3 g sugar · In your blood" (+0:59) i "7.4 g sugar · On its way to the liver" (+2:19, cola long ~31 s). |
| P0-5 | Isplata hooka u cola shortu | **FIXED** | `P\ov_a.jpg`, gornji red |
| P0-6 | "Building blocks" van | **FIXED** | meal long i pizza long |
| P0-7 | Compare espresso-pivo: drugo pitanje | **FIXED** | "Guess: which is still in you at bedtime?" → "Still in you at bedtime: Espresso. About 32 mg of caffeine. The beer is out." Presuda je i dalje "Espresso wins: no alcohol, 213 fewer kcal." Nema nagrade za alkohol. |
| P0-8 | Compare end card ≤ 5 s | **FIXED** | ~5 s (`P\compare-espresso-vs-beer-long\sheets\s1fps_04.jpg`) |
| P0-9 | 13 s istog kadra na +24:00 | **FIXED / PARTLY** | Kartice bubrega su sada na +6 h. +24:00 traje ~5 s prije end carda. |
| P0-10 | Voda 330 ml, ključna kartica | **FIXED** | "Half leaves your stomach within 13 minutes." (`P\compare-cola-vs-water-long\f1\t016.jpg`) |

Zvuk: −14,1…−14,4 LUFS, LRA 3,2–5,0 LU, sample peak −1,4…−2,1 dBFS. Sve OK.

---

## 2. Preostale greške i regresije

### NOT READY blokeri (P0)
- **B1. Pivo, jutro (long i short).**
  - Kartica kaže "The alcohol is gone after about 4–14 h". Prvi gutljaj je oko 19:00 (bedtime je na +4:00), pa gornja granica pada oko **09:00**.
  - Tri kartice kasnije stoji "At 07:00, the alcohol should be gone." To je kontradikcija unutar 10 s. Sigurnosno je to obrnut smjer: za sporu jetru u 07:00 alkohol još **nije** nestao.
  - **Popravak:** kad je `latestMin` iz `alcoholClock` kasnije od jutarnje minute, kartica mora biti "At 07:00 it's gone in a typical body." + "Some still have alcohol: a breath test can be positive." Rule za to već postoji u `video-beats.ts`.
  - Test: ako je `wakeMin < drinkAt + latestMin`, plan ne smije sadržavati `/should be gone/` bez `/breath test/`.
- **B2. "About a third is still in you."** (cola long ~48 s, `P\cola-long\f1\t049.jpg`; compare cola-voda long na +24:00 pod kickerom **KIDNEYS**, `P\compare-cola-vs-water-long\f1\t060.jpg`).
  - Hook je "9 teaspoons of sugar. Watch where it goes.", pa normie čita "trećina šećera je još u meni". Govori se zapravo o kofeinu.
  - Na +24:00 je to i netočno: na 24 h preostaje ~6–8 % kofeina, a ne trećina. Trećina vrijedi za bedtime.
  - **Popravak:** u `video-beats.ts` `fractionWord` grana mora imenovati tvar: "About a third of the caffeine is still in you." (8 riječi). Compare kartica mora ostati na svojoj minuti (bedtime), ne na +24:00, i pod kickerom BEDTIME.
- **B3. Pivo long: granica se mijenja usred videa.** Na vrhu piše "may top US limit (0.08 %)" (`P\beer-3-over-2h-long\f1\t021.jpg`), a na +4:11 "may top EU limit (0.05 %)" (`t031.jpg`). Gledatelj vidi dvije različite "granice" i zaključi da aplikacija ne zna koja vrijedi.
  - Uz to se istovremeno vide "alcohol 0.46–1.15 ‰" i "BAC 0.05–0.12 %" (isti broj u dvije jedinice).
  - **Popravak:** jedna jedinica po videu (za EU publiku ‰, a % BAC sitno ili nikako) i jedna granica (stroža, 0,5 ‰), uz "(US 0.8 ‰)" ako treba.
- **B4. Compare cola-voda long:** čip "Answer at 24 h." pojavi se na ~29 s (`t030.jpg`), a "First out: Water." je već prikazan na ~18 s (`t019.jpg`). Treba ga izbaciti kad je `answer` već prikazan (`share.ts` `drawSplitGame`: uvjet `tease.age < 2.6 && dec.age < 0`).

### P1
1. Gram-mjerači šećera ("4.3 g sugar · In your blood", "7.4 g sugar · On its way to the liver") sakriti kad je kartica ili krivulja "dip". Dva signala se suprotstavljaju.
2. Meal long: mozak ~9 s (sleepy → caffeine peak, 25–34 s). Treba mikro-pomak kamere svakih ≤ 3 s.
3. Espresso single ("A fifth at bedtime", piće u 8:00) nasuprot compare ("About half … at bedtime", piće u 16:00). Oboje je točno, ali bez sata pića izgleda kao kontradikcija. Kad se objavljuju zajedno, u compare treba dodati sat pića ("Espresso at 16:00").
4. Compare espresso-pivo: "Attention is already worse." na vrhu od ~0,1–0,2 ‰ (jedno pivo). Mjerljivi učinci kod ~0,2 ‰ postoje (podijeljena pažnja), ali su mali. Bolje "Attention starts to slip." ili "Small, but not zero."

### P2
1. Pizza end card naziv ("with extra cheese, ham and mushrooms") ≠ hook ("A whole pizza (1154 g)").
2. Donjih ~25 % kadra je u singlovima i dalje prazno.

---

## 3. Otvoreno pitanje: je li 0,01–0,03 % BAC za jedno pivo 500 ml realno?

**Ulazni podaci (alcohol.md P2):** 500 ml × 5 % × 0,789 = **19,7 g** etanola.

**Model aplikacije** (pokrenut `simulateFood` + `bacRange`, skripta `critic\bac1.ts`):

| Profil | Stanje | Vrh (g/L = ‰) | Vrijeme vrha | Prikazani raspon (−40 %/+50 %) | U % BAC | "Gone" (< 0,005) |
|---|---|---|---|---|---|---|
| muškarac 70 kg, 175 cm (default) | natašte | **0,21** | 48 min | 0,13–0,31 ‰ | **0,013–0,031 %** | 2,8 h |
| isti | s hranom | **0,13** | 41 min | 0,08–0,20 ‰ | 0,008–0,020 % | 1,8 h |
| žena 60 kg, 165 cm | natašte | **0,31** | 54 min | 0,19–0,47 ‰ | 0,019–0,047 % | 3,7 h |
| žena 60 kg | s hranom | **0,22** | 49 min | 0,13–0,34 ‰ | 0,013–0,034 % | 2,5 h |

Compare video (16:00) prikazuje "BAC 0.009–0.022 %", što je između fed i fasted varijante za default muškarca. Interno je konzistentno.

**Provjera prema literaturi:**
- **Widmark (Searle 2015, W1):** C₀ = A·F/(r·W) = 19,7 × 0,90 / (0,70 × 70) = **0,36 g/L** bez eliminacije i uz trenutnu apsorpciju.
  - Tijekom apsorpcije (~50 min) jetra izbaci β·t ≈ 0,12–0,15 × 0,8 h ≈ 0,10–0,12 g/L.
  - Uz rasprostiranje u dvije faze, realni vrh za piće sporo u želucu je **≈ 0,22–0,27 g/L**.
- **Mitchell 2014 (A9):** pivo 0,5 g/kg u muškaraca od 82,7 kg (natašte, 20 min) dalo je **0,503 ± 0,098 g/L**.
  - Isti račun za Mitchellovu dozu: 0,714 × 0,90 − ~0,13 ≈ 0,51 ✓.
  - Za našu dozu (0,28 g/kg) eliminacija tijekom apsorpcije pojede relativno više, pa skaliranje daje **≈ 0,24–0,28 g/L**.
  - alcohol.md "Model B" (C₀ × omjer Mitchell 0,70) daje 0,28 g/L. "Model A" daje 0,21–0,25.
- **Jones 1997 / Kechagias 1999 (A2):** 0,30 g/kg natašte ≈ **0,31 g/L**, a s obrokom **0,13–0,18 g/L**. Etanol tu nije bio u pivu, pa natašte apsorpcija ide brže nego kod piva.

**Zaključak:**
- **S hranom (0,13 g/L)** je fiziološki uvjerljivo, unutar Jonesovih 0,13–0,18.
- **Natašte (0,21 g/L)** je na **donjem rubu**, ~15–25 % ispod centralne procjene Widmark/Mitchell (≈ 0,25–0,28 g/L). Gornja granica raspona (0,31 g/L = 0,031 %) ipak pokriva realni vrh i tipičnu varijaciju (Mitchell SD ~20 %).
- **Žena 60 kg natašte (0,31 g/L)** je u skladu s Widmarkom (C₀ 0,49 × 0,9 − eliminacija ≈ 0,33–0,38, Model A: 0,33–0,38). I tu je ~10 % nisko.
- Tvrdnja "jedno pivo = 0,01–0,03 % BAC" je **uvjerljiva i nije opasno podcijenjena**, jer raspon pokriva realnost.

**Preporuka za model (bez hitnosti, P2):**
- Model ne treba strukturno mijenjati.
- Mala kalibracija za male doze natašte: centralni vrh za 19,7 g kod muškarca od 70 kg treba biti **≈ 0,24–0,25 g/L** (sada 0,21).
  - Najjednostavnije je F za pivo podići s 0,90 na **~0,94** (fit iz alcohol.md r. 174) ili beer ka natašte s 1,6/h na **~2,0/h**.
  - Zatim provjeriti da `alcoholMitchell.test.ts` (Cmax pri 0,5 g/kg unutar 5 %) i dalje prolazi.
  - Ako ne prolazi, ostaviti model i samo podići gornju granicu raspona za male doze na +60 %.
- Novi test: jedno pivo 500 ml, muškarac 70 kg natašte, vrh ∈ [0,22; 0,30] g/L. S hranom ∈ [0,11; 0,20] g/L. Žena 60 kg natašte ∈ [0,30; 0,42] g/L.
- Prikaz za EU publiku: "0.1–0.3 ‰" je razumljivije od "0.013–0.031 %". Vidi B3.

---

## 4. Rangirani preostali popravci

| Rang | Prioritet | Posao | Datoteke | Videi |
|---|---|---|---|---|
| 1 | P0 | B1: jutarnja kartica mora pratiti `latestMin` (breath test) | `video-beats.ts`, `video-plan.ts` | pivo long, short |
| 2 | P0 | B2: "About a third **of the caffeine** …", na vlastitoj minuti i pod pravim kickerom | `video-beats.ts`, `video-plan.ts` (`planCompare`) | cola long, compare cola-voda long (+ provjeriti short) |
| 3 | P0 | B3: jedna jedinica (‰) i jedna granica po videu | `video-body.ts` `bacPlain`, gauge label | pivo long (+ compare e-b) |
| 4 | P0 | B4: "Answer at 24 h." ne nakon prikazanog odgovora | `share.ts` `drawSplitGame` | compare cola-voda long |
| 5 | P1 | Sakriti gram-mjerače šećera tijekom "dip" | `video-body.ts` | cola, meal, kebab |
| 6 | P1 | Mikro-pomak kamere u dugim kadrovima mozga | `video-plan.ts` / `VideoCam.tsx` | meal long |
| 7 | P1 | Sat pića u compareu ("Espresso at 16:00") | `share.ts` | compare e-b |
| 8 | P1 | "Attention is already worse." → blaže za ≤ 0,2 ‰ | `stories.ts`/`video-beats.ts` | compare e-b |
| 9 | P2 | Kalibracija piva natašte (F 0,94 ili ka 2,0/h) + test | `science/foodSim.ts`, novi test | sve s pivom |
| 10 | P2 | Pizza end-card naziv = hook. Donjih 25 % kadra. | `share.ts` | pizza, singlovi |

Nakon rangova 1–4 (sve je izmjena teksta i uvjeta) svih 16 videa bi bilo READY.
