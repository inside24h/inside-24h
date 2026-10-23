# Prelaunch QA + popravci (2026-10-23)

Polazište: HEAD 6a19b89. Ništa nije commitano. Backup svake dirnute datoteke (stanje prije): `backups/20261023-174214-prelaunch/`.
Line endings provjereni nakon svake izmjene (CRLF datoteke ostale CRLF; `parse.ts` je miješan i takav je ostao).

## 1. Presuda u usporedbi (verdictOf) — popravljeno
`app/src/v4/analyze.ts`. Prije: "Espresso vs Beer → 🏆 Beer wins." (3 espressa, ili 1 espresso navečer), "Rakija vs Cola → 🏆 Rakija wins: no blood sugar peak", "Red wine vs Espresso → It's close", te pobjede bez razloga ("🏆 Oatmeal wins.").
Uzrok: bodovanje je zbrajalo samo minute stresa (žuto/crveno) + kcal; alkohol je ulazio samo kroz "brain" svjetlo, pa je kofein navečer (blagi "maybe lighter sleep" sloj) težio više od piva.
Nova pravila:
- Samo jedna strana ima alkohol → pobjeđuje strana bez alkohola ("no alcohol" + ostali razlozi). Ako je ta strana po modelu jasno teža (veliki skok šećera, kofein pred spavanje, mnogo kcal) → **"No clear winner: Beer brings alcohol; Espresso brings caffeine at bedtime."** Alkohol nikad ne dobiva 🏆.
- Obje strane s alkoholom → odlučuje količina alkohola, bez pehara: "Red wine is the lighter choice: less alcohol (16 g vs 20 g), 89 fewer kcal."; ista količina → niži vrh alkohola, inače "about the same alcohol".
- Pobjednik se imenuje samo ako postoji razlog riječima (manji vrh šećera, kraće povišen šećer, manje kofeina / bez kofeina pred spavanje, manje kcal); inače "It's close".
- Vrh šećera u jedinici iz "Your body" (mmol/L ili mg/dL).
- Nova oznaka `label` u analizi: kad količina nije jedna uobičajena porcija, ime nosi količinu ("3 × 500 ml of beer", "2 espressos") — u stupcima usporedbe, presudi, naslovu i opisu usporednog videa. Prije je "3 piva vs 1 pivo" bilo "Beer vs Beer".
Provjereno skriptom na svim parovima baze (150 × 149 × 2 doba dana, ~45 000 presuda): 0 slučajeva gdje alkohol pobjeđuje, sve simetrično (A/B = B/A), max 112 znakova.
Testovi: `app/src/v4/verdict.test.ts` (5, uključujući sve parove pića u 16 i 22 h).

## 2. Nazivi / prvi titl — popravljeno
Nova datoteka `app/src/v4/food/naming.ts` (`amountPhrase`, `partsPhrase`), koristi se u prvom titlu priče/videa (`foodProduct.ts`, zamijenila lokalni `amountWith`), u hooku videa i tekstu "Share this moment" (`AppV4.tsx`).
Primjeri prije → poslije:
- "Whole · 1104 g pizza capricciosa." → "A whole pizza Capricciosa (1104 g)."
- "Kebab / doner (1 kebab)" → "1 kebab"; "2 large egg" → "2 large eggs"; "2 bread roll" → "2 bread rolls"; "2 potato" → "2 potatoes"
- "1 cup, 70 ml turkish coffee" → "1 cup of Turkish coffee (70 ml)"; "½ × 30 ml espresso" → "Half an espresso (15 ml)"; "3 × 30 ml espresso" → "3 espressos (3 × 30 ml)"
- "1 sandwich hamburger + 2 small portion french fries" → "1 hamburger, 2 small portions of french fries and 330 ml of cola"
- "2 cans (250 ml) energy drink" → "2 cans of energy drink (250 ml each)"
- Ime dodatka: "Coffee with milk with sugar" → "Coffee with milk and sugar" (`parse.ts` deriveFood).
Provjereno skriptom na ~1160 kombinacija (svaka hrana, vrsta, dodatak, preset, veličina × ½·1·2·3), lista: scratchpad `prelaunch/names-after.txt`. Testovi: `app/src/v4/food/naming.test.ts` (sweep >900 kombinacija bez "·", " × 1 ", "glases", malih "turkish/greek", duplih riječi, "with … with").

## 3. Fade reda obroka na 1440 px — popravljeno
`MealBar.tsx` + `mobile.css`: iznad 720 px red s namirnicama blijedi samo na strani na kojoj ima još čipova (klase `morel`/`morer`, ResizeObserver + scroll); kotačić miša pomiče red vodoravno dok ima što pomaknuti (na kraju stranica normalno scrolla). Mobitel zadržava postojeći fade. Provjereno u Chromeu: 2–3 stavke bez fadea (stanu), 4–5 stavki fade desno.

## 4. QA u pravom pregledniku (Chrome kroz Playwright, 360 / 390 / 1440)
Skripte: scratchpad `prelaunch/qa1.cjs`, `qa2.cjs`, `site.cjs`, snimke `prelaunch/shots/`. Prvi ekran, tražilica (HR), chooseri (tea, coffee, pizza, burger, kebab, sandwich), obroci 1–5 stavki, "Over how long?", Your body (težina 110 kg), Share + video dijalog, usporedbe. Horizontalni scroll 0 svugdje; 0 grešaka u konzoli na buildanom `site/` (u dev serveru jedno "createRoot" upozorenje dolazi od Vite HMR-a dok sam mijenjao datoteke, ne javlja se u buildu). CLS ≤ 0,06 kod učitavanja (≤ 0,125 nakon promjene težine, uzrokovano unosom).
Pronađeno i popravljeno:
- "Simulated for: man, 35 ·175 cm" (nedostaje razmak) → "man, age 35 · 175 cm · 70 kg" (`AppV4.tsx`).
- Video dijalog na 360 px: "Full · over 1 / min", "under 30 / s" lomilo se u novi red → nelomljivi razmak (`AppV4.tsx`, `Compare.tsx`).
- Graf šećera u usporedbi: oznake "1 h/2 h/3 h" bile su SVG tekst u `preserveAspectRatio="none"` pa su na mobitelu bile zgnječene → HTML oznake (`Compare.tsx`, `v4.css`). Napomena "Foods without…" → "Foods and drinks without a measured glycemic index get no curve." (pivo).
- Tražilica: "tuna sub" i "cold-cut sub" (imena s čipova!) nisu nalazila ništa → ime čipa s 2+ riječi je i alias (samo jela, ne pojedini sastojci: "chicken", "ham" ostaju obična hrana).
- Tražilica: "kava s mlijekom sa šećerom" / "kava sa šećerom i mlijekom" davalo je espresso + 250 ml mlijeka + šećer (3 stavke); "2 kave s mlijekom" → 2 espressa + mlijeko. Sada: Coffee with milk (+ sugar), 2 × coffee with milk. Na 1162 upita (svi testni + aliasi baze + kombinacije) promijenila su se samo ta 4 rezultata (`prelaunch/queries.txt`, skripta `app/scripts/_pl_searchdiff.ts`).
Video: 2 renderirana kroz pravi UI (`prelaunch/vids/`): dugi "A whole pizza" 73,3 s, kratka usporedba Espresso vs Beer 22,4 s; oba H.264 High 1080×1920 30 fps (nb_frames = trajanje × 30), AAC 48 kHz stereo; frameovi pregledani (`vids/f/sheet.png`): hook "A whole pizza (856 g): what happens inside your body in 24 hours?", presuda u usporednom videu ispravna.

## 5. Nije popravljeno / za vlasnika
- **"pecivo"** namjerno nije pronađen (audit 2026-10-17: znači i kiflu i bilo koje pecivo). Kratko sam ga dodao kao alias za Bread roll pa vratio (fooddb.json byte-identičan HEAD-u). Ako vlasnik želi "pecivo" → Bread roll, to je odluka.
- **"tea with honey and lemon"** → doda "Lemonade 250 ml" (prefiks "lemon"); limun nije u bazi. Prefiks-pravilo je namjerno ("ban" → banana); nisam dirao.
- **"kava sa šlagom"**: šlag nije u bazi, riječ se tiho ispušta (espresso). Nema poruke korisniku.
- **"krumpirići"** → kuhani krumpir (s izborom vrste); kolokvijalno često znači pomfrit. Dvosmisleno — ostaje izbor korisnika.
- Naslov priče na mobitelu za duge obroke skraćuje se "…" ("Cola + Banana + Pizza + E…") — postojeći dizajn.
- Kratki titl u videu može završiti dvotočkom kad je duga rečenica podijeljena na dvije stranice ("…lets it out slowly:") — pravilo video-plana, nije greška.
- Pomoćne skripte ostale u `app/scripts/_pl_*.ts` (nisu dio builda; ne brišem bez potvrde).

## Provjere (na kraju)
- `npx tsc --noEmit -p .`: čisto.
- `npx vitest run`: 31 datoteka, 510 testova, svi prolaze (+13 novih).
- `npx vite build --config vite.v4.config.ts`: OK (dist-v4/index-v4.html 2,82 MB).
- `npx vite build --config vite.site.config.ts && node scripts/make-site-split.mjs` (zadnje): OK, index.html + 19 assets, 2,64 MB.

## 6. Dodatak (nakon 139439a): parser nikad ne mijenja tiho ono što je upisano
`app/src/v4/food/parse.ts` (+ `SmartSearch.tsx`, `AppV4.tsx`, `meals.css`). Backup u istoj mapi `backups/20261023-174214-prelaunch/`.
- Novi `readMeal(text)` → `{ parts, extras, left, kept }` i `leftOutNote(text)`; `parseMeal` vraća samo `parts` kao prije.
- **Sitnice** (limun/limunom, kriška limuna, led/ledom, ice, cimet, sol, papar, menta, zaslađivač): ne pretvaraju se u hranu ("tea with honey and lemon" prije je dodavao 250 ml limunade, "beer with lemon" isto, "water with a slice of lemon" isto). Bilježe se kao "Not counted: “lemon” (too little to matter)." "tea with lemon and honey" i dalje stavlja med u čaj. Samo "lemon" više ne logira limunadu (lista je i dalje nudi, osoba bira).
- **Nepoznate riječi** (šlag, whipped cream, vrhnje, "something") više se ne gube: "Not in our database yet: “šlagom” — left out." (riječ kako je upisana, s dijakriticima).
- **"bez / without"** (prije: ništa nije pronađeno): uklanja dodatak ili prilog ako je unutra ("kava sa šećerom bez šećera" → espresso, "kebab bez luka" → without onion); "cola / energy drink / ledeni čaj bez šećera" → Diet cola / Sugar-free / Diet iced tea; ako se ne može ukloniti a dio je hrane → "We can’t take out “cheese” yet, so it’s counted." ("pizza without cheese"); ako hrana to ionako nema (espresso bez mlijeka) — ništa za reći.
- **Blizu riječ ≠ drugi prilog**: "pizza with peppers" davala je Pepperoni pizzu (stem "peppers"~"pepperoni") → sad se prvo traži točna riječ.
- Gdje se vidi: žuta napomena na vrhu liste prijedloga (glavna tražilica, "+ Add", Compare) i nakon odabira / otvaranja linka kao zatvoriva traka (ista kao link-napomena), do sljedećeg odabira. Kod dodavanja u obrok ("+ Add") vidi se samo u listi prije odabira.
- Sweep: milk chocolate / chocolate milk / orange juice / orange / iced tea / ice cream / apple juice / almond milk / peanut butter ostaju točni; na 1162 starih upita 0 promjena rezultata u odnosu na 139439a.
- Testovi: `naming.test.ts` +5 (ukupno 515, svi prolaze). tsc čist, oba builda OK (split zadnji), Chrome 360/1440 na `site/`: napomena u listi i nakon odabira, link `#q=tea with honey and lemon`, 0 grešaka, bez horizontalnog scrolla.
- Ostaje: "lemon tea", "coconut milk", "iced coffee", "gin and tonic" → "We don’t know … yet" (nema hrane; nove namirnice nisu dodavane). Napomena na mobitelu privremeno prekriva red ispod tražilice dok se ne zatvori (isti obrazac kao postojeća link-napomena).
