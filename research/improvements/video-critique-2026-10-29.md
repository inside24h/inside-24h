# Završna kritika videa v7 (2026-10-29)

Autor: critic agent (Opus). Nastavak na `video-critique-2026-10-25-b.md`. Pregledano je 16 uzoraka iz `C:\claudework\video-samples\2026-10-25-v7\`. Nijedna datoteka koda ni uzorak nisu dirani.

## Metoda
- **Frameovi:** 1 fps cijeli video, 2 fps prvih 5 s i 4 fps zadnjih 6 s, za svih 16 videa.
- **Zvuk:** `ebur128`.
- **Regresije:** usporedio sam v6 i v7 frame po frame (SSIM po sekundi). Svaku sekundu gdje je SSIM < 0,97 pogledao sam uživo.
  - Sva 16 videa su ponovno renderirana (različit MD5).
  - **Bitne promjene** (SSIM 0,66–0,90) ima samo espresso long, 19–55 s. To je nova kartica "About a fifth of the caffeine remains."
  - Ostalih 9 "već spremnih" videa ima samo sitne razlike (SSIM 0,93–0,97, pomak kamere i šuma). Provjereni primjeri su u `P\v7\diff_grid.jpg`, lijevo v6, desno v7: tekst je isti, a u kebabu je skriven gram-mjerač šećera (dobro).
- **Kontakt listovi pregledani u punoj veličini:** beer long i short, espresso long, cola long i short, compare cola-voda long i short, compare espresso-pivo long i short.

`P` = `C:\Users\TINCUC~1\AppData\Local\Temp\claude\C--Users-Tin-Cuculic\2c75f631-d1a9-45ff-8171-9d373e2eea3f\scratchpad\critic`. Frame za sekundu *t* je `P\v7\<video>\f1\t{t+1:03}.jpg`.

**Zvuk:** −14,1…−14,3 LUFS, LRA 3,2–5,0 LU, sample peak −1,4…−2,1 dBFS. OK, nema regresije.

---

## 1. Provjera 4 blokera iz 2026-10-25-b

| # | Stavka | Status | Dokaz |
|---|---|---|---|
| B1 | Pivo: 07:00 "should be gone" nasuprot 4–14 h | **FIXED** | Long i short sada kažu "At 07:00, a breath test may be positive." i zatim "Don't drive." (`P\v7\beer-3-over-2h-long\f1\t046.jpg`, `P\v7\beer-3-over-2h-short\f1\t016.jpg`). Slaže se s rasponom 4–14 h. |
| B2 | "About a third is still in you." | **FIXED** | Cola long: "About a third of the caffeine remains." (BEDTIME, `P\v7\cola-long\f1\t049.jpg`). Espresso long: "About a fifth of the caffeine remains." Compare cola-voda više nema tu karticu na +24:00. |
| B3 | Jedinica i granica u pivu | **FIXED** | Samo "BAC … %" i dosljedno "may top US limit (0.08 %)". Nema više ‰ i nema prelaska na EU granicu (`P\v7\beer-3-over-2h-long\f1\t021.jpg`, `t030.jpg`). |
| B4 | "Answer at 24 h." nakon odgovora | **FIXED** | Čipa više nema u compare cola-voda long. |

**Kalibracija jednog piva** (alcohol.md A14, namjerno nepromijenjena): prikaz "Low, not zero · BAC 0.009–0.023 %" (`P\v7\compare-espresso-vs-beer-long\f1\t012.jpg`) je raspon modela za 16:00. To je iskreno i ne flagiram ga.

---

## 2. Presude

| Video | v6 → **v7** | Presuda | Napomena |
|---|---|---|---|
| cola long | 7 → **8** | **READY** | |
| cola short | 7,5 → **7,5** | **READY** | bez promjene teksta |
| espresso long | 8 → **8** | **READY** | nova kartica o petini kofeina je jasnija |
| espresso short | 8 → **8** | **READY** | |
| pivo ×3 long | 6,5 → **8** | **READY** | sigurnosni slijed je kompletan |
| pivo ×3 short | 6,5 → **8** | **READY** | |
| pizza long | 7,5 → **7,5** | **READY** | |
| pizza short | 7 → **7** | **READY** | |
| kebab long | 7 → **7,5** | **READY** | gram-mjerač šećera skriven na kartici o masti |
| kebab short | 7 → **7** | **READY** | |
| meal long | 7 → **7** | **READY** | |
| meal short | 7 → **7** | **READY** | |
| compare espresso vs pivo long | 7,5 → **7** | **READY** (uz P1-1) | ponavljanje kartice (vidi dolje) |
| compare espresso vs pivo short | 7,5 → **7,5** | **READY** | |
| compare cola vs voda long | 6,5 → **7,5** | **READY** | |
| compare cola vs voda short | 7 → **7,5** | **READY** | provjereno frame po frame: nema "a third" ni čipa |

**16/16 READY**, prosjek **7,6/10** (prije 4,4 → 6,2 → 7,2). Nema regresija ni novih P0 grešaka.

---

## 3. Preostali popravci (nijedan ne blokira objavu)

### P1
1. **Compare espresso vs pivo long: "We can't tell when you're safe to drive."** stoji na pivskoj strani **neprekidno ~15 s**, kroz tri poglavlja: bedtime +6:04 do +6:31, pa +12:09 do +12:57 (`P\v7\compare-espresso-vs-beer-long\f1\t041.jpg` → `t055.jpg`), uz kicker "ALCOHOL GONE".
   - Potvrđujem poznati problem: kartica se ponavlja jer alkoholna strana nema novo poglavlje, pa planer zadrži zadnju karticu.
   - **Popravak:** u `planCompare` strana bez novog poglavlja treba pokazati praznu ili utišanu karticu, ili rotirati na sljedeću karticu poglavlja ("Coffee or water don't speed it up."). Ista kartica ne smije biti dulje od ~6 s.
   - Sitnica uz to: kicker "ALCOHOL GONE" uz "We can't tell when you're safe to drive." čita se kontradiktorno. Bolji je kicker "AFTER DRINKING".
2. **Compare cola-voda long, +12:01 → +24:00:** iste dvije kartice ("It hydrates like the same amount of water." / "It collects in your bladder for hours.") stoje ~6 s, pa slijedi +24:00 bez kartice ~2 s (`t061.jpg`–`t067.jpg`). Granično; treba mikro-pomak kamere ili skraćivanje.
3. **Pivo long:** "Coming up: alcohol gone." ima kicker BEDTIME na jednom frameu (+4:23, `P\v7\beer-3-over-2h-long\f1\t034.jpg`), a na prethodnim "STILL TO COME". To je kratki prijelaz, kozmetika.
4. **Pivo, gauge "may top US limit (0.08 %)"** za europsku publiku podcjenjuje rizik: EU/HR granica 0,05 % prijeđena je već od 0,05 % naviše. Ako se objavljuje za HR/EU, birati strožu granicu (dosljedno kroz cijeli video).

### P2 (otprije)
- Compare espresso-pivo: "Attention is already worse." kod ~0,01–0,02 % BAC je jaka formulacija.
- Pizza end card naziv ≠ hook.
- Donjih ~25 % kadra u singlovima je prazno.
- Kalibracija jednog piva namjerno nije mijenjana (A14). Prikaz je iskren, pa ostaje kako je.

---

## 4. Zaključak
Sve je spremno za objavu. Ako je cilj "nula sitnica", prije objave compare espresso-vs-pivo long popraviti samo P1-1 (deduplikacija kartice, jedna izmjena u `planCompare`). Sve ostalo je kozmetika.
