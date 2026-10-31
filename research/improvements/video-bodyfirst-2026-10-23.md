# Video export: body-first redesign (2026-10-23)

Povod (vlasnik): "U usporednom videu se tijelo uopće ne vidi, tekst je u fokusu. Ljudima je puno zanimljivije GLEDATI kako hrana/piće prolazi kroz tijelo nego tekst preko ekrana."
Cilj: 3D tijelo je zvijezda svakog videa (TikTok / Reels / Shorts / FB / X), tekst samo podrška. Sve provjereno na stvarno renderiranim MP4-ovima kroz pravi UI (Chrome, Playwright), ffprobe + kontakt listovi koje sam pregledao.

## 1. Glavni uzrok "tijelo se ne vidi"
- 3D canvas je za vrijeme snimanja imao oblik ekrana (npr. 1280×557 ležeće), a kadar je 9:16 → tijelo je bilo izrezano iz sredine ležeće slike, u traci 1080×1200, ispod 4 sloja panela (naslov, pečat, semafor, pop kartica, pilula, titl).
- Usporedba: JEDNA široka kamera na dva mala tijela, slika prerezana na pola → u svakoj polovici rub tijela ili prazan prostor između tijela; dva titl-bloka po 3 retka preko donje polovice.

## 2. Što je napravljeno (dizajn)
1. **Canvas = kadar.** Dok se snima, 3D canvas dobije točno oblik videa (540×960 CSS @2× = 1080×1920; feed 540×675 = 1080×1350) — `.stage.recbox` u `v4.css`, `SafeCanvas rec` (dpr 2). Tijelo je renderirano piksel za piksel preko cijelog kadra (prije: povećani izrez).
2. **Video kamera** (`video-cam.ts`, `VideoCam.tsx`): kritično prigušena opruga (bez trzaja, bez prebačaja, testirano), polagano njihanje ±12° (3D dubina), "push-in" do 18 % dok je trenutak na ekranu.
   - Hook: počinje ŠIROKO (cijelo tijelo, frame 0 = thumbnail), pa prati gutljaj: usta → jednjak → želudac.
   - Svaki trenutak: kamera ide na organ iz poglavlja (`chapter.focus`: jetra, gušterača, mozak, bubrezi…), uz mjesto gdje je piće ako je blizu.
   - Mirna razdoblja (skok > 2 h): kamera se odmakne dok sat ubrzava, pa se primakne na sljedećem trenutku. 24 h + end card: široko.
   - Cilj kadra je uvijek u "prozoru" između teksta gore i titla dolje (lift 7 %).
3. **Organi rade** (`video-body.ts`): mozak svijetli dok je kofein/alkohol u krvi (sadržaj: "reaches your brain"), gušterača dok je šećer povišen ("pancreas releases insulin"), organ trenutka svijetli, putanja pića ostaje svijetla, ostalo tijelo prigušeno (0,32). Nema novih tvrdnji — sve iz postojećih modela/poglavlja.
4. **Mjerači pričvršćeni uz organe** (projekcija 3D → piksel): lijevo "gdje je sad" (npr. "315 ml · Stomach", "1154 g · Stomach", "309 ml urine · Bladder"), desno broj koji je bitan (‰ alkohola u krvi, porast šećera kao raspon, mg kofeina) s mini-krivuljom cijelog dana i točkom "sad". Tanka linija + pulsirajuća točka na organu. Isti broj dvaput se ne prikazuje.
5. **Sat** "+0:45 → +24:00" (vrijeme od prvog gutljaja/zalogaja), znamenke fiksne širine (ne titra), prsten = dio dana, ">>" svijetli kad dan ubrzava. Dok je trenutak na ekranu, dan polako teče dalje (12 % puta do sljedećeg trenutka; prvi gutljaj do 3 min) → piće se stalno miče, sat otkucava.
6. **Tekst je podrška:** hook ≤ 7 riječi ("One espresso — inside your body", "A whole pizza — inside your body", "Espresso vs Beer — inside your body"; drugi red uvijek "— inside your body"), titl = kratka fraza (≤ 46 znakova ≈ 6–8 riječi, 2 retka, uravnoteženi redovi) iznad naslova trenutka, bez pozadinske ploče (samo meki gradijent). Zagrade dulje od 4 riječi se izostavljaju (raspon je na mjeraču), kratke ostaju ("(about 9 teaspoons)"). Broj ostaje uz jedinicu ("1.5 hours", "5.0 mmol/L").
   - Short cut: nakon prve rečenice, trenutak čija rečenica traži > 1 stranicu pokazuje samo naslov poglavlja ("Blood sugar peak", "Alcohol peak") → više putovanja u 30 s.
   - Pravilo čitanja NEPROMIJENJENO (14 zn/s + 0,9 s, min 2,4 s, +0,8 s novi trenutak; testovi ≤ 3 riječi/s).
7. **Usporedba = split screen:** dva viewporta jednog renderera, svako tijelo svoja kamera, obje rade ISTI pokret (isti trenutak paralelno); imena iznad tijela s trakom u boji pića, VS značka na šavu, jedan zajednički sat, po jedan mjerač za svako tijelo (kofein vs ‰ alkohola, šećer vs voda u želucu), riječi svake strane samo na njenoj polovici (test). Long cut: strana s rečenicom > 2 stranice pokazuje naslov → stanu i "Peak"/"Alcohol peak". Presuda na end cardu iz `verdictOf` (alkohol nikad ne "pobjeđuje": "🏆 Espresso wins: no alcohol, 213 fewer kcal.").
8. **End card** preko zatamnjenog tijela (tijelo vidljivo iznad), sažetak 4 sustava + CTA + follow; zadnjih 0,5 s pretapanje u prvi frame (petlja) — zadržano.
9. Zvuk: zadržan proceduralni soundtrack (whoosh na svakom pokretu kamere/prijelazu, tick kad stigne trenutak, akord na end cardu), prekidač "None (add your own)" zadržan.

Zadržane garancije iz video-polish-2026-10-22: long 62–75 s (sva 8 long videa 68,1–73,5 s), short ≤ 30 s, 30 fps, nb_frames = trajanje × 30, H.264 High + AAC 48 kHz, sav tekst u safe zoni (testovi za single, feed, split), hook frame = thumbnail, petlja.

## 3. Datoteke
| Datoteka | Promjena |
|---|---|
| `app/src/v4/video-cam.ts` (novo) | organi (centri iz organ-points), snimci (wide/mid/close, push), opruga, pozicija kamere, projekcija |
| `app/src/v4/VideoCam.tsx` (novo) | kamera za vrijeme snimanja (zamjenjuje CameraRig/orbit dok snima) |
| `app/src/v4/video-body.ts` (novo) | sjaj organa, mjerači (glavni broj + gdje je) |
| `app/src/v4/video-cam.test.ts` (novo) | 6 testova: kadrovi, opruga bez prebačaja/trzaja, kamera izvan tijela, projekcija, videoText, kratke stranice |
| `app/src/v4/share.ts` | novi crtači `drawBodyFrame`/`drawSplitFrame` (+ end cardovi, sat, mjerači, `layoutBody`/`layoutSplit`, `elapsedText`); stari layout ostaje kao `drawFrameLegacy`/`drawCmpFrameLegacy`; `RecOpts.prepare/onSettled`, korak dobiva frame |
| `app/src/v4/video-plan.ts` | `CAP_PAGE` 46, `videoText`, frame meta (stop, beat, from, u, rate, hk), drift dana, short cut s naslovima, bolji prijelomi stranica, `FILL_S` 68 s, CMP_PAGE 40 |
| `app/src/v4/CompareVideo.tsx` | split screen: 2 kamere, 2 viewporta, sjaj organa po strani |
| `app/src/v4/AppV4.tsx` (CRLF) | snimci po frameu, mjerači + projekcija, kratki hook, canvas u obliku videa, sjaj tijela, split-screen podaci |
| `app/src/v4/perf/SafeCanvas.tsx` (CRLF) | `rec` prop (dpr 2 i za MediaRecorder fallback) |
| `app/src/v4/v4.css` | `.stage.recbox` |
| `app/src/v4/scene3d.tsx`, `lazy3d.ts` | izvoz `VideoCam` |
| `app/src/v4/share.test.ts`, `video-plan.test.ts` | +20 testova (safe zona s mjeračima na rubovima/izvan kadra, sredina tijela slobodna, ≥ 30 % visine otvoreni prozor, split: riječi ne prelaze šav), test cijelih rečenica dopušta naslov u short cutu |

Backup: `backups/20261023-201544-video2/`. Ništa nije commitano. Privremeno: `app/scripts/_v2_plans.ts` (ispis planova, može se obrisati uz potvrdu).

## 4. Provjera (stvarni MP4, pravi UI)
QA skripte: scratchpad `video2/render.cjs` (vite dev server na 5201 + jedan Chrome, fiksno vrijeme obroka), `sheet.sh` (ffprobe + kontakt list svakih 2,5 s), `shot.cjs`.
- Svih 16 videa (8 slučajeva × long/short): 1080×1920, 30 fps, H.264 High, AAC 48 kHz stereo, nb_frames = trajanje × 30; long 68,1–73,5 s, short 25,8–28,0 s; 0 grešaka u konzoli; 0 crnih frameova (ffmpeg blackdetect); glasnoća −16,3 LUFS na svih 16.
- `npx tsc --noEmit -p .` čisto; `npx vitest run` 544/544; `vite build` (v4) i split build (`make-site-split.mjs`, zadnji) prolaze.
- Dodatno: feed 4:5 (1080×1350) radi; MediaRecorder fallback (bez WebCodecs) radi: H.264 + AAC, 27,45 s.
- Pregledani kontakt listovi: tijelo vidljivo i veliko u svakom frameu, tekst samo u gornjoj/donjoj traci i u dva stupca mjerača uz rub, nema odrezanog teksta, nema crnih/treperećih frameova, kamera glatka.

Prije / poslije (scratchpad):
- Prije: `video-qa/final/f/cola-long-sheet.png`, `video-qa/final/f/cmp-cola-water-long-sheet.png` (tijelo malo/izrezano, usporedba bez tijela).
- Poslije: `video2/r3/*-sheet.png` (finalno), međukoraci `video2/r1`, `video2/r2`, `video2/t3/both.png`, `video2/t4/both.png` (feed + fallback).

Uzorci za vlasnika: `C:\claudework\video-samples\2026-10-23\` (16 MP4).

## 5. Otvoreno
- Mozak: sjaj smanjen (u fokusu 0,2, ostaje u prigušenom sloju) da ne bude izgoren u bijelo. I dalje, kad kroz njega prođe "scan" traka (postojeći efekt, svakih 16 s) ili je u fokusu, svijetli bijelo-plavo. Izgleda kao hologram, ali je jači od ostalih organa.
- Pivo/voda u usporedbi: debela svijetla cijev (LiquidRoute) dominira u crijevima — dobro pokazuje razliku, ali je vizualno "glasna".
- U usporedbi zaglavlje (hook + sat + imena + mjerači) zauzima ~40 % visine; glava je ispod zaglavlja kad su oba fokusa daleko (mozak + želudac). Za 9:16 split je to kompromis.
- Sadržaj poglavlja (ne video kod): "1 hamburger, 1 small portion of french fries…", "20:20: the last of the 3 drinks" i sl. dolaze iz `foodProduct.ts`.
- Short usporedba: 4 trenutka (0, 20, 90, 24 h) iz `CMP_SHORT`; srednji sati se preskaču brzo.
- Sljedeći korak za viralnost: voiceover (video-strategy §5.4) i A/B hookova.

---

# Runda 2 (2026-10-24): pregled vlasnika/koordinatora → popravci

Backup: `backups/20261023-232325-video3/`. Ništa nije commitano (runda 1 je commit c8967c4).

| # | Primjedba | Popravak |
|---|---|---|
| 1 | Titlovi su komadi rečenica ("your stomach within about 40 minutes:", "is still in you at 23:00.") | Novi `app/src/v4/video-beats.ts`: svaka kartica je JEDNA kratka cjelovita misao (≤ 8 riječi, veliko slovo, završava točkom). Kratka rečenica iz poglavlja ide kakva jest; duga se reže samo na vlastitim ":" / ";" ako je svaki dio cijela rečenica; ~70 čestih dugih rečenica ima kratki oblik istog značenja (npr. "Each drink: half leaves within 40 minutes." + "The drink slows your stomach down."). Ništa novo se ne tvrdi. Plan (video-plan) sad slaže kartice, ne stranice rečenica. |
| 2 | Broj na mjeraču ≠ broj u titlu (0.31–0.77 ‰ vs 0.33–0.83 ‰) | Vrijednosti koje se mijenjaju sa satom (‰, mmol/L, mg/dL, "mg of caffeine is left") NIKAD nisu na kartici — samo na mjeraču koji prati sat. Zagrade s takvim brojem se izbacuju ("There is still alcohol in your blood."). Test. |
| 3 | "Last drink 80 minutes after the first" vs naslov "over 2 h" | Model (foodSim) daje N rundi na početku svakog odsječka: 3 pića kroz 2 h = jedno svakih 40 min, na 0, 40 i 80 min; prozor od 2 h završava na 2:00. Video sad kaže: prva kartica "3 × 500 ml of beer." + "Over 2 h: one drink every 40 minutes.", zadnje piće "Drink 3 of 3, at +1:20." + "One every 40 minutes, over 2 h." (isti sat kao gore). Test. |
| 4 | Zaglavlje usporedbe ~40 % visine, prekriva glave/mozgove | Kompaktno: 1 red (brand mali) + hook i kompaktni sat u istom redu + red s imenima i brojem (čip) svakog tijela, sve do y≈435. Kamera usporedbe ima fiksni kadar (`splitPose`): vrh glave odmah ispod zaglavlja, mozak i želudac uvijek vidljivi, lagano "disanje" kadra. |
| 5 | End card usporedbe: duh "e your body" iza naslova, izblijedjeli CTA preko teksta | Uzrok: pretapanje u prvi frame (petlja) preko end carda + istovremeno nestajanje titlova i dolazak end carda. Sada strogo redom (`endTiming`): titlovi odu (0,3 s) → end card dođe (0,4 s) → end card i naslov odu (0,4 s) → tek onda prvi frame (0,5 s). Test provjerava da se nijedne dvije riječi ne preklapaju ni u jednom frameu prvih 3 s i zadnjih 6,5 s (single + split). |
| 6a | Mozak previše bijelo-plavo | Video paleta: mozak mirna ljubičasta (#6f5fd8), mekši rub, bez "scan" linije, slabiji sjaj. Pronađen i pravi uzrok bljeskanja u usporedbi: `onError={() => {}}` kao nova funkcija svaki frame → Body je svaki frame ponovno učitavao model (svježi materijali = bijeli mozak). Popravljeno u CompareVideo (stabilni NOOP) i u Body (učitava jednom, onError preko ref-a). |
| 6b | Pivo/voda kao debela svijetla cijev | `LiquidRoute subtle` za svijetla pića u videu: tanji, mekši tok bez halo/obrisa. |
| 6c | Kratka usporedba preskače srednje sate | CMP_SHORT = 0, 20, 90, 240, 720, 1440 (planer zadrži što stane), duga klizanja kroz tihe sate traju do 1,8 s (`moveS`), pravilo čitanja nepromijenjeno. |
| 7 | Donjih ~25 % kadra tamno | Tamni gradijent samo iza titla (ispod njega lagani veo), ostala tijela prigušena na 0,42 umjesto 0,32 → noge/zdjelica/crijeva vidljivi do dna. |

Dodatno: mjerač "gdje je" više ne pokazuje jednjak (prolaz traje sekunde, broj je bio besmislen, npr. "845 ml Food pipe").

Testovi (novo): `video-plan.test.ts` → kartice (cijele misli, bez ":" na kraju, ≤ 8 riječi, ne počinju malim slovom / veznikom), nijedna kartica nema broj koji prati sat, bedtime primjer vlasnika, pacing (+1:20, 40 min, 2 h), vlasnikove razbijene kartice; `share.test.ts` → nijedan tekst preko teksta (intro + end, single + split), redoslijed petlje.

Provjera runde 2: svih 16 videa ponovno renderirano kroz pravi UI → `C:\claudework\video-samples\2026-10-24\` (stara mapa 2026-10-23 netaknuta). Sve H.264 1080×1920 30 fps + AAC, 0 crnih frameova; long 63,9–74,4 s, short 27,4–29,4 s. Gusti kontakt listovi prvih 3 s (10 fps) i zadnjih 6 s (5 fps): `scratchpad/video2/r4/*-ends.png`, cijeli videi `r4/*-sheet.png` — bez treperenja mozga, bez teksta preko teksta, petlja ide redom (end card nestane → prvi frame). Usporedba se sad renderira ~2× brže (nema više ponovnog učitavanja modela svaki frame).
tsc čisto, vitest 551/551, oba builda (split zadnji) prolaze. Privremene QA skripte: `app/scripts/_v2_plans.ts`, `_v2_beats.ts`, `_v3_dbg.ts` (mogu se obrisati uz potvrdu).

---

# Runda 3 (2026-10-24): kreativni upgrade po `video-creative-spec-2026-10-24.md` + "normie" + popravci a–e

Backup: `backups/20261024-113448-video4/`. Ništa nije commitano (runda 2 = 7bd0fd4).

## Što je napravljeno (po rangiranom planu speca)
| # | Spec | Implementacija |
|---|---|---|
| 1 | Cue v2 (jedan izvor istine) | `video-plan.ts`: `CueKind` + `data`; planer emitira teaser, rewind, sip, riser (= peak − 1,6 s), peak (≤ 1), next (NEXT čipovi + najava), night (ulaz/izlaz), lights, verdict, guess, race, micro. Testovi: frame-točnost, ≤ 2 udarca (short ≤ 1), razmak vizualnih događaja ≤ 3,2 s u svim fixtureima, noć bez treperenja. |
| 2 | Zvuk v2 | `video-audio.ts` `renderSoundtrack2`: 2 busa (glazba / efekti, 4-kanalni render), 120 BPM, groove od gutljaja, half-time noću, 1 takt "dropa" na vrhuncu, ducking (−6 dB na udarcima, −3 dB na gutljaju), noćni lowpass 900 Hz + sunrise, lookahead limiter (5 ms), A1 hit, A2 rewind, A3 otvaranje limenke, A4 gutljaj/zalogaj, A5 pour, A6 fizz, A7 whoosh, A8 tick, A9 blip (lampice po razini), A11 riser, A12 impact + reverb, A14 ratchet, A16 sunrise, A17 stinger, A18 race ding, A19 shimmer. Izmjereno (ffmpeg ebur128): **−14,0 do −14,4 LUFS, true peak −1,5/−1,6 dBTP** na svih 16. SFX na svojim frameovima (onset analiza: udarac 0 ms, gutljaj −5 ms, blipovi ±10 ms; rewind/riser namjerno rastu postupno). Opcija **"Sound effects only"** (treći gumb), glasnoća efekata ista kao u punom miksu. |
| 3 | Teaser + rewind hook | Frame 0 = vrhunac priče (mjerač s PEAK, organ vrha u kadru), 0,45–0,95 s premotavanje (sat unatrag ◀◀, VHS linije, zvuk), gutljaj na 0,95 s; petlja se vraća na teaser. `video-hook.ts` `hookFor` računa 2 reda iz poglavlja ovog izvoza (cola: "9 teaspoons of sugar. / Watch where it goes."; pivo: "Still in your blood at 07:00." kad model to kaže; hrana: "A whole pizza: 2723 kcal."), test: svaki broj postoji u poglavljima, za alkohol zabranjene riječi best/wins/better/healthy/cure/hangover. |
| 4 | Peak paket | `video-fx.ts`: zoom punch (×1,085, 0,5 s), shake 0,22 s ≤ 0,6 % visine, prsten na organu, vinjeta rizera, mjerač ×1,15 + žig PEAK 1,4 s. Count-up NIJE napravljen: vrhovi su rasponi (‰, mmol/L) → spec §9.11 "sigurnija opcija". |
| 5 | Mikro-beatovi | dah kamere 3 %, puls sjaja organa, bljesak ruba mjerača; ≥ 2 s razmaka, ≤ 3 efekta/s (WCAG test). |
| 6 | Open loops | NEXT čip u svakom glideu ≥ 1,2 s ("NEXT · +0:20 · Blood sugar peak"); na ~47 % karta "Coming up: the sugar dip." (žuto, kicker "STILL TO COME"); u usporedbi čip "Answer at 24 h.". Riječi novog trenutka sad dolaze tek kad sat stigne (prije su se pojavljivale na početku glidea: zato je "Protein … peak now" stajalo na +2:04). |
| 7 | Usporedba = igra | hook "Guess: which leaves your stomach first?" + čip "Comment A or B before the end.", utrka "Out of the stomach" (iz modela: želudac < 3 % maksimuma) + scoreboard 4 lampice po strani u donjem dijelu kadra (noge, popravak d), neutralni "✓ OUT" bez trofeja i zelene, uz alkohol čip "Faster out ≠ better for you.", presuda (samo `verdictOf`) slijeće prva na end cardu s udarcem, prstenom i iskrama samo uz 🏆; end card usporedbe +1,5 s da se presuda stigne pročitati. Vrh dobiva svoj trenutak u usporedbi. |
| 8 | Prvi gutljaj | pljusak 24 kapi boje pića iz usta (seeded), u usporedbi oba usta. |
| 9 | Noć | 22:00–07:00 po satu: plavi veo + mjesec, half-time, lowpass, ratchet tickovi, sunrise na izlazu. |
| 10 | 24 h lampice | redovi end carda pale se jedan po jedan (0,35 s, pop), blip po razini; u usporedbi L/R naizmjence. |
| 11 | SFX only | gotovo (vidi 2). |
| 12 | Mozak heat | boja mozga iz modela: ljubičasta → zelena (kofein) / jantar (alkohol) po razini prema dnevnom maksimumu, nikad bijelo; primjenjuje se u frame petlji (prije je effect kasnio par frameova pa je boja skakala). Mjehurići/pjena (V10) i čestice krvotoka (V8) NISU napravljeni (otvoreno). |
| 13 | Share dialog | prijedlog opisa s hookom i CTA + "Pinned comment idea" (iskrena pitanja iz §7). |
| 14 | P2 | sunrise (V19) da; V12/V17/A20 ne. Heartbeat (A13) ne, jer nijedan od 8 slučajeva ga ne traži bez rizika da sugerira ubrzan puls. |

## Normie-friendly (vlasnik)
- Mjerači: najprije riječi, onda broj. Alkohol: "Low, not zero" / "Attention worse" / "Balance worse" (pragovi 0,2 i 0,5 ‰ iz AL4), ispod "Blood alcohol 0.46–1.16 ‰". Šećer: "Blood sugar up/dip", ispod "+1.3–3.0 mmol/L vs. before". Kofein: "45 mg caffeine / still in your body". "fructose/glucose" na mjeraču → "sugar".
- Kartice: bez žargona ("Your gut splits the sugar in two.", "Gut and liver catch 85% of the fruit sugar.", "Your liver turns 40% into blood sugar.", "It blocks your “I’m tired” signal.", "Coffee sends 1 in 3 people to the toilet.", "Bile helps break down the fat.", "Fat takes a slower route, via the lymph."), jedna misao po kartici.
- Hook: iznenađenje prvo ("9 teaspoons of sugar."), obećanje drugo.

## Popravci a–e
- (a) Kartica nikad nema količinu koja se mijenja sa satom (vlakna su na mjeraču: "The fiber reaches your large intestine."); plus sigurnosna mreža `numberConflict` (ista jedinica + ista riječ, drugi broj → taj mjerač se ne crta u tom frameu) + testovi.
- (b) "2% has left your body so far" → "Almost all of it is still inside you." (ispod 10 %), inače "N% of the leftovers have left you.".
- (c) Protein: "Protein pieces in your blood peak now." + "They keep arriving for hours." (model: vrh aminokiselina ~150 min, dolaze satima), i kartica se pojavi tek kad sat stigne na taj trenutak.
- (d) Usporedba: utrka + scoreboard u donjem dijelu kadra.
- (e) Sav tekst end carda/CTA u jednoj konstanti `VIDEO_COPY` (share.ts): "Which food/drink should we test next? 👇", "Did you guess right? 👇", "Follow @… for the next one" (bez obećanja novih namirnica).

Također pronađeno i popravljeno: tri regexa iz runde 1/2 imala su znak backspace umjesto `\b` (Python heredoc) — prijelomi stranica i jedan test nisu radili kako je zamišljeno.

## Provjera runde 3
- 16 videa kroz pravi UI → `C:\claudework\video-samples\2026-10-24-v3\` (stare mape netaknute). Sve H.264 1080×1920 30 fps + AAC 48 kHz; long 64,4–73,7 s, short 28,2–29,8 s; 0 crnih frameova; 0 grešaka u konzoli; feed 4:5 (1080×1350) provjeren.
- Zvuk: −14,0 do −14,4 LUFS, true peak −1,5 do −1,6 dBTP (ffmpeg ebur128 peak=true), bez klipanja (limiter). Onset analiza (`scratchpad/video2/onsets.cjs`, cue log iz `[vqa] plan`): udarac na vrhu 0 ms, gutljaj −5 ms, blipovi/lampice ±10 ms od svog cuea.
- Kontakt listovi: `scratchpad/video2/r6/*-sheet.png` (svake 2,5 s), `*-ends.png` (prvih 3 s @10 fps + zadnjih 6 s @5 fps), `*-peak.png` (±1,6 s oko vrha @8 fps), `r6/firsts.png`.
- tsc čisto, vitest 586/586 (novo: `video-hook.test.ts`, efekti/cue testovi u `video-plan.test.ts`, kartice vs mjerači), oba builda (split zadnji) prolaze.

## Otvoreno (runda 3)
- Spec V10 mjehurići/pjena, V8 čestice krvotoka, V12 kinetički hook, V17 brzinske linije, A13 heartbeat, A20 tape stop, count-up brojeva (rasponi) — nisu napravljeni.
- "Sound effects only" i dalje ima tihi efekt "pour/fizz"; za pravi test trebaju slušalice/mobitel (ja sam mjerio samo brojevima).
- Glazba je proceduralna i ugodna, ali nije "trending"; vlasnik može izabrati "Sound effects only" i dodati pjesmu u aplikaciji.
- Usporedba: čip "Comment A or B before the end." prelazi preko linija mjerača 2 s; utrka i scoreboard su u donjem dijelu koji TikTok djelomično pokriva (informacija je i u karticama).

---

# Runda 4 (2026-10-24): odgovor na pogađanje, otvorene stavke, jasniji kraj

Backup: `backups/20261024-171312-video5/`. Ništa nije commitano (runda 3 = 94348ab).

1. **Usporedba: pitanje sad ima odgovor.** Novi `app/src/v4/video-guess.ts` za svaki par bira pitanje koje model JASNO razdvaja: (1) "which leaves your stomach first?" (izlaz iz želuca, < 3 % maksimuma), inače (2) "which is out of your blood first?" (alkohol < 0,005 g/L, kofein < 10 mg), inače (3) "which raises your blood sugar more?". Jasno = razlika ≥ 15 min i ≥ 25 % (šećer: ≥ 0,5 mmol/L i ≥ 30 %); bez jasnog pitanja nema pogađanja (CTA tada "Which one would you pick?"). U trenutku kad je utrka odlučena (ta minuta je uvijek svoj trenutak plana, i u short cutu) dolazi **odgovor** s udarcem, prstenom i rizerom: "First out: Espresso. / Out of the stomach in about 1 h."; uz alkohol odmah nakon toga kartica "Faster out ≠ better for you.". End card: "✓ Answer: Espresso left the stomach first." pa ispod, kao zaseban red, presuda iz `verdictOf`, pa "Did you guess right? 👇". Trake utrke prate istu metriku (oznaka "Out of the stomach / Out of the blood / Blood sugar rise"). Test: svih 12 parova iz Compare + espresso/pivo + cola/voda u 8, 17 i 21 h — odgovor odgovara modelu, nikad blizu izjednačenog, bez "wins/better".
   - Parovi (17:00): cola/voda → želudac (voda), cola/diet cola → želudac, sok/naranča → želudac, pivo/vino → želudac, krafna/jabuka → šećer, espresso/energetsko → želudac, cornflakes/zob → želudac, čips/bademi → šećer, riža/leća → želudac, kava s mlijekom/cappuccino → želudac, espresso/pivo → želudac (espresso); bijeli/raženi kruh i mliječna/tamna čokolada → bez pogađanja (model ih ne razdvaja jasno).
2. **Otvorene stavke runde 3:** mjehurići u želucu gaziranih pića (+ pjena za pivo prve minute), krvotok (točkice crijevo → jetra → srce → mozak, gustoća i sjaj prema razini tvari u krvi iz modela), count-up (broj na mjeraču u boji razine dok dan ide prema vrhu; brojevi se mijenjaju frame po frame jer sat teče), otkucaj srca (zvuk ~55/min + blagi sjaj srca) SAMO dok je svjetlo "Heart" žuto/crveno u modelu (npr. 3 piva: 27,9–41,8 s), kinetički hook (drugi red ulazi riječ po riječ u prvoj sekundi; prvi red je na frameu 0 = thumbnail; "Save cover" ima cijeli hook), tape-stop zvuk na početku premotavanja.
3. **Kraj videa običnim riječima:** "Blood sugar not measured" → "Blood sugar: not tracked here" / "Not tracked for this one" (iskreno: za taj proizvod nema izmjerene krivulje; "no big change" bi bila tvrdnja koju model nema). "Mild stress at 13:13" → što i kada: "Sugar up for a while at 13:13", "Big sugar spike at …", "Pulse a little up at …", "A bit short of water at …", "Attention worse at …", "Balance worse at …", "Lighter sleep that night", "A lot of caffeine at …". Test za svih 8 slučajeva (u 8 i 19 h): bez "stress/measured/mmol/‰", ≤ 32 znaka.
4. **Short cutovi:** hook, teaser i jedan udarac (vrh, a u usporedbi odgovor) u svim; usporedba short sad smije izbaciti i zadnji trenutak da odgovor stane (24 h beat ostaje); test.

## Provjera runde 4
- 16 videa kroz pravi UI → `C:\claudework\video-samples\2026-10-24-v4\` (stare mape netaknute). Sve H.264 1080×1920 30 fps + AAC; 0 crnih frameova; −14,2 do −14,4 LUFS, true peak −1,5/−1,6 dBTP.
- Onset analiza (cue log iz `[vqa] plan`): najgori pomak 10–60 ms (premotavanje i rizer namjerno ulaze postupno); udarac odgovora poklapa se s cueom (espresso/pivo long 23,9 s, short 8,7 s; cola/voda long 30,0 s, short 10,4 s).
- Pregledani gusti kontakt listovi (`scratchpad/video2/r7/`): mjehurići u želucu (cola), pjena (pivo prva minuta), točkice krvotoka, sjaj srca kod 3 piva, kinetički hook, odgovor "First out: Water." u short usporedbi s ✓ OUT na traci.
- tsc čisto, vitest 648/648 (novo: `video-guess.test.ts`, short usporedba, svjetla običnim riječima), v4 build i site split build (zadnji) prolaze. Line endings: sve datoteke ostale u svom formatu, 0 backspace znakova u izvoru.

## Otvoreno (runda 4)
- Bijeli/raženi kruh i mliječna/tamna čokolada nemaju pogađanje (model ih ne razdvaja jasno) — CTA "Which one would you pick?".
- Spec V17 brzinske linije nisu napravljene. Zvuk otkucaja/tape-stopa provjeren brojevima, ne slušalicama.
- Vite dev server povremeno vrati 403 na stari dep-cache izvan roota (samo QA skripta; rješenje: nova cacheDir mapa).

---

# Runda 5 (2026-10-25): svi P0 i P1 iz video-critique-2026-10-24.md

Backup: `backups/20261024-221027-video6/`. Ništa nije commitano (runda 4 = be28736).

**P0**
1. Thumbnail: frame 0 ima cijeli hook. Kinetički efekt više ne skriva riječi, nego ih nakon gutljaja redom oboji i lagano podigne (`kineticWord`). Hook kaže što se jede ili pije, npr. "One can of cola: 9 teaspoons of sugar.", "A whole pizza (1154 g): 2723 kcal.", "A fifth is still in you at bedtime." Test: frame 0 crta oba reda.
2. Poštene usporedbe. Pitanje o želucu postavlja se samo kad su obje količine jednake (±10 %, `sameAmount`). Preset u Compare je sada cola vs 330 ml vode. Espresso vs pivo pita "which leaves your blood first?" (odgovor: pivo). Porcije se vide ispod imena ("330 ml" / "330 ml", "30 ml" / "500 ml"). Testovi pokrivaju sve parove, 30 vs 500 ml i 250 vs 330 ml.
3. "Faster out ≠ better for you." prikazuje se samo kad prva izađe strana s alkoholom. Test pokriva i slučaj kad prvi izađe espresso.
4. Pivo, sigurnosna poruka: sigurnosne kartice jutra vode i obavezne su u oba cuta (`SAFETY`, `mustCards`, forced moment).
   - Pivo počinje u 19:00, pa model kaže da alkohola ujutro nema. Zato poruka glasi "At 07:00, the alcohol should be gone." / "A hangover can still make you drive worse."
   - Kad alkohola ujutro ima: "At 07:00, a breath test can be positive." / "Don't drive." I to je testirano.
5. Nikad prazna labela ni siroče. Labela se crta samo uz svoju karticu. Pravilo čija prva kartica ne prolazi ne daje ništa. "Coffee sends 1 in 3 to the toilet." stane (8 riječi). Test provjerava da nijedno pravilo ne gubi karticu i da je svaka planirana kartica na ekranu puno vrijeme.
6. Isplata hooka (`payoffMin`) ulazi u svaki cut. Short završava priču na isplati, pa ona dolazi pri kraju. Espresso short sad ima bedtime karticu "About a fifth is still in you."
7. Kraj dana: vožnja do +24:00 nosi chip "NEXT · +24:00 · 24 hours later", a stajanje bez riječi traje 0,8 s. Kamera promijeni kadar sa svakom karticom i najmanje svake 2,6 s (`pg`), pa se mijenja i split kadar.
8. Mjehur: broj je urin nastao u zadnja 3 h. Natpis kaže "Urine made in the last 3 h", a iznad 500 ml "Made in 3 h: more than one pee".
9. "Gone" je raspon iz modela, npr. "The alcohol is gone after about 6–10 h."
10. Bubrezi i kofein: "Your kidneys flush out its broken-down pieces."
11. Hidracija: "Cola hydrates like the same amount of water."

**P1**
- Jedan broj po stvari: dok je gore mjerač šećera u krvi, mjerač "g sugar" se ne prikazuje.
  - Šećer se kaže kao "26–60 % above usual" (u odnosu na uobičajenih 5,0 mmol/L iz modela), alkohol kao "Blood alcohol 0.05–0.12 % (BAC)".
  - Kraći red u chipu se smanji, ne reže se.
- End card koristi vrijeme sa sata videa ("at +0:13"), bez golog "13:13".
  - Compare end card ima fontove 26–30 px i prikazuje samo svjetla koja nisu zelena; ako su sva zelena, piše "All lights green".
  - Šećer koji se ne prati prikazuje se sivo, ne zeleno.
- "Coming up:" prikazuje se samo za moment s popisa dozvoljenih, pa nema više "building blocks".
- 24 h: "Only 2% of the leftovers are out yet."
- Hook espressa kaže koliki je udio još u tijelu. Hook za hranu je pitanje "Where is it 24 hours later?", a odgovara mu moment od 24 h.
- Imena se slažu. End card pizze: "A whole pizza with extra cheese, ham and mushrooms".
- Compare chip: "Comment: espresso or beer?".
- Prvi udarac u long cutu je na 13,5–14,4 s (prije 27–34 s).
  - Prije vrhunca svaki moment pokazuje jednu karticu.
  - Najtiši momenti ispadnu; kamera i dalje putuje cijelim putem.
  - Rastezanje teksta radi se tek od vrhunca.
- Zvuk:
  - Glazba ima svoj oblik: tiši dijelovi, utihne pod riserom, 0,3 s tišine pred udarac, pun groove na udarcu.
  - Udarac ide kroz saturirani bus.
  - Glasnoća se mjeri po BS.1770 u JS-u i postavlja na −14 LUFS.

## Provjera runde 5
- 16 videa kroz pravi UI → `C:\claudework\video-samples\2026-10-24-v5\`. Sva su 1080×1920, 30 fps, AAC, bez crnih frameova. Long traju 62,3–74,0 s, short 24,5–29,2 s.
- Thumbnaili (`scratchpad/video2/r8/thumbs.png`): svih 16 ima cijeli hook na frameu 0.
- Mrtve zone (razlika frameova u pojasu tijela, prag 4, ≥ 3 s):
  - Usred videa ih nema, osim jedne od 3,3 s u compare cola-voda long (20 s).
  - Statičan je samo end card (3,7–6,2 s čitanja rezultata i CTA-a).
- Glasnoća (ebur128):
  - I = −14,1 do −14,3 LUFS, TP −1,0 do −1,7 dBTP.
  - LRA 3,3–5,2 LU (prije 0,5–1,5).
  - Udarac je +6,5 do +7,2 LU momentary iznad prosjeka (prije +1,4 do +1,8); prije udarca je −5 do −15 LU (tišina).
- Onseti: najgori pomak 10–60 ms.
- tsc je čist, vitest 681/681 (novi testovi rundi 5 u `video-plan.test.ts`, `video-hook.test.ts` i `video-guess.test.ts`). Oba builda prolaze (split zadnji).

## Otvoreno (runda 5)
- End card je i dalje statičan 4–6 s (čitanje). Jedna mrtva zona od 3,3 s ostaje u compare cola-voda long.
- Voda od 330 ml koristi generički model (5 poglavlja), pa su kartice za vodu tanje nego za čašu od 250 ml.
- P2 (donjih 25 % kadra, colu i burger razdvojiti u obroku, pinned komentari) nije rađeno. Zvuk je provjeren brojevima, ne slušalicama.

---

# Runda 6 (2026-10-25): P0 i P1 iz video-critique-2026-10-25.md

Backup: `backups/20261025-112241-video7/`. Ništa nije commitano (runda 5 = f7bcef6).

**P0**
1. **Spavanje uz alkohol:** jedna kartica, "You may fall asleep faster, but sleep worse." (ili "…but sleep lighter."). Pozitivna polovica nikad ne ide bez negativne. Test prolazi kroz cijeli korpus kartica.
2. **"Gone" iz istog raspona kao mjerač** (`goneRange`): od vrha, najlakše očitanje (−40 %) s najbržom jetrom (0,20 g/L/h) i najteže (+50 %) s najsporijom (0,10). Primjer: 3 piva daju "about 4–14 h", jedno pivo "1–4 h". Test: gornja granica ≥ vrh × 1,5 / 0,10 + vrijeme vrha.
3. **Siročad:** "No extra urine." je zamijenjen jednom karticom "It hydrates like the same amount of water.".
4. **Šećer:**
   - Isti raspon na mjeraču i na end cardu (`sugarPct`, npr. "+26–60 %").
   - Normalan porast je napisan mirno: "Blood sugar up · +26–60 % over usual: a normal rise", u mirnoj boji. "Up a lot" i crveno tek od +3 mmol/L.
   - Where-mjerač za stvar o kojoj kartica govori je skriven (šećer, vlakna).
   - Test: mjerač = end card.
5. **Cola short:** hook "Watch where it goes" isplaćuje "Your body burns half the fruit sugar." (180 min). Uz to je ispravljen regex koji je kao isplatu uzimao "Into the small intestine".
6. **"Building blocks"** se više nikad ne prikazuje (`DULL`), u oba cuta. Test.
7. **Espresso vs pivo:** uz alkohol na bilo kojoj strani više se ne pita "which leaves your blood first?". Pitanje je "Guess: which is still in you at bedtime?", a odgovor "Still in you at bedtime: Espresso. About 32 mg of caffeine. The beer is out." (prag je 5 mg i broj piše). Banner odgovora je neutralno siv kad je alkohol u igri, a utrka se ne crta. Testovi pokrivaju 3 para × 3 vremena.
8. **End card više nije zamrznut:** cijela kartica polako uđe 2,5 % (endDrift), a dodatak za compare je 1,5 → 0,5 s. Mjereno: end card single više nije statičan; compare long je 3,1 s.
9. **Compare cola-voda +24:00:**
   - Svaka strana kaže ono što je NOVO od zadnjeg momenta: prvo poglavlje tog trenutka, a u utrci za želudac prvo poglavlje želuca. Inače kaže sljedeće kartice istog poglavlja.
   - Moment u kojem nijedna strana nema ništa novo se izbacuje.
   - Kad planer izbaci neki moment, kartice se ponovno računaju za momente koji su ostali, pa se ništa ne gubi.
   - CMP_STOPS bez 5. minute.
   - Mrtvih zona nema.
10. **Voda 330 ml:** "Half leaves your stomach within 13 minutes." je vraćen i dolazi na moment odgovora. Kartica "About as fast as water." za vodu je uklonjena.

**P1**
- Espresso hook: "One espresso. / It sends 1 in 3 to the toilet." kad je udio u trenutku spavanja mali (inače ostaje bedtime hook).
- Alkohol na mjeraču:
  - "BAC 0.05–0.12 % · may top US limit (0.08 %)"; anchor stoji samo kad ga raspon doseže (EU 0.05 % isto).
  - Preciznost je 3 decimale kad je donja granica ispod 0.03 % (jedno pivo: "0.012–0.030 %").
  - Compare chip pokazuje samo raspon.
- 24 h: "Most of the fiber is still in you." / "Mouth to toilet usually takes 14–58 hours."
- Mamurluk se spominje tek od 40 g alkohola. Ispod toga piše "Don't drive after drinking.".
- End card govori riječima ("13 min in", "1½ h in"), ne "+0:13".
- Mrtve zone 5–6 s: veliki organi (mozak, debelo crijevo, jetra) u drugom kadru idu na "wide", pa se kadar stvarno mijenja.
- True peak: ceiling 0,76, TP je sada −1,4 do −2,2 dBTP.
- `bacRange` za jedno pivo nije dirano (model hrane / podaci se ne mijenjaju). Navodim to kao otvoreno pitanje za vlasnika.

## Provjera runde 6
- 16 videa → `C:\claudework\video-samples\2026-10-25-v6\`. Sva su 1080×1920, 30 fps, AAC, bez crnih frameova. Long traju 62,3–71,9 s, short 23,3–29,2 s.
- Thumbnaili: svih 16 ima cijeli hook na frameu 0.
- Mrtve zone (pojas tijela, prag 4, ≥ 3 s): nijedna u 15 videa. Compare espresso-pivo long ima 3,1 s na end cardu.
- Glasnoća: I −14,1 do −14,4 LUFS, TP −1,4 do −2,2 dBTP, LRA 3,2–5,0 LU, udarci +6,0 do +6,8 LU.
- Onseti: ≤ 60 ms.
- tsc je čist, vitest 689/689 (novi blok "round 6" u `video-plan.test.ts` + guess/hook testovi). Oba builda prolaze (split zadnji).

## Otvoreno (runda 6)
- `bacRange` jednog piva (0,01–0,03 %) je na donjem rubu Widmarka (critic očekuje 0,02–0,04 % natašte). Model za taj slučaj računa s hranom; podatke/model nisam mijenjao.
- Na compare vodi kartica "Your small intestine absorbs it within minutes." se još ponavlja na 2 momenta (generički model vode ima malo poglavlja).
- P2: donjih 25 % kadra, a naziv pizze na end cardu je duži od onog u hooku.

---

# Runda 7 (2026-10-29): treća kritika (video-critique-2026-10-25-b.md)

Backup: `backups/20261025-153639-video8/`. Ništa nije commitano (runda 6 = a28ad82).

1. **B1 jutro iz raspona.** Kad gornja granica raspona "gone" (`goneRange`, ista kao mjerač) padne nakon buđenja, jutro kaže "At 07:00, a breath test may be positive." / "Don't drive." umjesto "should be gone".
   - Pivo 19:00 (4–14 h) sada daje breath test. Jedno pivo (1–4 h) i dalje kaže "should be gone" + "Don't drive after drinking.".
   - Test: 4 vremena pića × 4 doze.
2. **B2 "still in you".** Kartica imenuje tvar: "About a third of the caffeine remains." / "Almost all the caffeine is still in you.".
   - U compareu svaka strana pokazuje samo poglavlje svog momenta (u utrci želuca i poglavlje želuca), pa nijedna kartica više ne stoji pod tuđim naslovom ili satom. Bedtime kartica više nije na +24:00.
   - Test: svaka "still in you/remains" kartica u svih 7 slučajeva imenuje tvar.
3. **B3 jedna jedinica i jedna granica.**
   - BAC % svuda u videu; i where-mjerač ("alcohol ‰" postaje "BAC …%").
   - Samo US granica (0.08 %), a EU anchor je uklonjen.
   - Dupli BAC mjerač je skriven.
4. **B4 teaser nakon odgovora.** "Answer at 24 h." više se ne planira ni ne crta nakon odgovora. Test za 4 trenutka odgovora.
5. **Partials.**
   - Gram-mjerači šećera se nikad ne prikazuju kad je krivulja šećera poznata (ni u dipu).
   - +24:00: mrtvih zona nema ni u jednom od 16 videa (pojas tijela, prag 4, ≥ 3 s).
6. **Kalibracija jednog piva:** NIJE promijenjena. Detalji su u `research/alcohol.md` A14.
   - F 0,94 ili ka 2,0/h podižu jedno pivo na 0,22–0,24 g/L, ali Mitchellovo pivo tada odstupa +8,6 % odnosno +13 % (fit tolerancija je 5 %, a F je izmjeren kao 0,90 ± 0,02).
   - Michaelis–Menten diže fed na 0,19–0,21 (Jones mjeri 0,13–0,18).
   - U ovom modelu omjer jedno pivo / Mitchellovo pivo je fiksan (≈ 0,40).
   - Novi test: natašte je model 0,19–0,30 g/L, a prikazani raspon (0,13–0,31) pokriva 0,22–0,30; fed je 0,11–0,20. Odluku ostavljam vlasniku.

## Provjera runde 7
- 16 videa → `C:\claudework\video-samples\2026-10-25-v7\`. Sva su 1080×1920, 30 fps, AAC, bez crnih frameova. Long traju 62,3–73,3 s, short 23,4–28,8 s.
- Thumbnaili imaju cijeli hook.
- Mrtvih zona: 0 (nijedna ≥ 3 s ni na end cardu).
- Glasnoća: −14,1 do −14,3 LUFS, TP −1,4 do −2,1 dBTP, LRA 3,2–4,0 LU.
- tsc je čist, vitest 694/694, oba builda prolaze (split zadnji). Line endings su očuvani.

## Otvoreno
- Kalibracija jednog piva natašte (vidi gore): treba odluka vlasnika ili novi izvor podataka.
- Na compare espresso-pivo long beer strana 2–3 puta ponovi "We can't tell when you're safe to drive." (isto poglavlje, nema novog teksta).

---

# Runda 9 (2026-10-29): svaka hrana iz baze, P2, V17, obje granice za vožnju

Backup: `C:\claudework\inside-24h-backups\20261029-180811-video9\` + git (HEAD prije runde = 16f5744).

1. **Robusnost za cijelu bazu.**
   - Logika plana je premještena iz `AppV4.tsx` u čisti modul `video-story.ts`, bez promjene ponašanja: `shortName`, `beatCtx`, `peakOf`, `gaugesAt`, `singleStops`, `comparePlan`. App i testovi sada grade isti plan.
   - Novi `video-story.test.ts` vrti svih **150** stavki iz `fooddb.json` (long i short), 8 slučajeva pića (vrijeme i količina) i 12 compare parova. Provjerava:
     - minimalno vrijeme čitanja;
     - da se ista kartica ne ponavlja dulje od 6 s;
     - trajanje plana;
     - da su brojevi isti kao na mjeraču;
     - da nema praznog teksta, `undefined` ni `NaN`;
     - da nema hrvatskog teksta;
     - da alkohol nikad ne pobjeđuje;
     - safe zone i tekst preko teksta na uzorkovanim frameovima (fake canvas).
   - Popravci u generatoru:
     - Kartica "About N mg of caffeine reaches your brain." više nema broj (mjerač pokazuje drugi broj). Sad je "The caffeine reaches your brain.".
     - Svaka kartica se kaže jednom po videu. Kod sve masne hrane "Fat takes a slower route, via the lymph." stajala je 9 s zaredom.
     - Kartica nestane prije nego što dođe NEXT čip, i u singlu i u splitu. Prije su se dva teksta pretapala na istom mjestu.
     - Kinetički hook se diže 3 px, ne 5, pa ne dira gornji redak.
     - Compare banner odgovora i NEXT čipovi su centrirani unutar kolone gumba. "Bigger rise: Kebab / doner." je prije ulazio pod gumbe.
     - Big i small u compare chipu se više ne preklapaju.
     - "Ćevapi" na ekranu postaje "Cevapi" (`plainLatin`).
2. **Odluka vlasnika: obje granice.**
   - Mjerač u videu ima tri retka: "BAC … %" / "US limit 0.08 %" / "EU limit 0.05 %", čim raspon dosegne 0,05 %. Kad je cijeli raspon iznad 0,08 %, piše "Over US limit …" / "Over EU limit …".
   - U appu se mijenja odgovor "Can I drive tomorrow morning?". Prije: "Limits differ by country. In Croatia…". Sada: "Driving limits: US 0.08 % (0.8 ‰) · EU 0.05 % (0.5 ‰), and 0 for novice and professional drivers in many countries, Croatia among them.".
   - Promijenjeni su i tekst pravila u `status.ts` i claim AL4.
3. **P2 iz kritike.**
   - "Attention is already worse." kaže se samo kad je cijeli raspon iznad 0,2 ‰. Inače piše "Attention may already be worse." (mjerač: "Focus may dip"; end card: "Attention may be worse …").
   - End card ima isto kratko ime kao hook (pizza).
   - Donjih ~25 % kadra namjerno ostaje bez teksta, jer je tamo UI platforme.
4. **Novi efekti.**
   - V17 brzinske linije u glideu (`drawSpeedLines`): rate > 30 min/s, samo bočni rubovi, alpha ≤ 0,12, tijelo ostaje čisto.
   - Cue `move` nosi koliko dana preskače (`data.v`). Skok od ≥ 4 h dobiva tihi padajući "air rush" (A7 reverse + highpass šum, pan). Glasnoća ide kroz isti −14 LUFS / limiter lanac.

## Provjera runde 9
- Uzorci u `C:\claudework\video-samples\2026-10-29-v9\`:
  - pizza-builder-long (66,1 s)
  - espresso-short (27,4 s)
  - beer-3-over-2h-long (65,6 s)
  - compare-espresso-vs-beer-long (72,7 s)
- Svi su 1080×1920, 30 fps, H.264 + AAC.
- Glasnoća: −14,1 do −14,2 LUFS, peak −1,5 do −1,9 dBFS.
- Pregledani kontakt listovi:
  - pivski mjerač ima tri retka i dvije granice;
  - "Attention may already be worse." je na compareu;
  - end card pizze je "A whole pizza";
  - kartica o limfi se više ne ponavlja.
- tsc je čist, vitest 705/705 (1 skip: privremeni `_dbg9.test.ts`, nije commitan). Oba builda prolaze (split zadnji).

---

# Runda 10 (2026-10-29): kritika zadržavanja gledatelja, krvotok, udarci organa, novi zvukovi

Backup: `C:\claudework\inside-24h-backups\20261029-193012-video10\` + git (HEAD prije runde = 4e3209b).

## Kritika (6 uzoraka prije promjena)
- **Prva sekunda:** hook frame = cijelo tijelo + hook, odmah gutljaj i premotavanje. Dobro, bez promjene.
- **Najveći vizualni problem:** tamna pića (cola, kava) su u crijevima bila crna/siva cijev. Najvažniji dio priče ("gdje ide") izgledao je kao mrtva crna zmija.
- **Krvotok:** točkice krvotoka (runda 4) su bile premale da se vide na mobitelu. Nije bilo trenutka "sad ulazi u krv".
- **Ritam:** novi trenutak (stop) imao je samo tihi "tick". Na tijelu se ništa nije dogodilo dok kamera ne stigne.
- **Ostalo (bez promjene):** kebab long 24:00 drži ~10 s s dvije kartice (sadržaj je važan payoff). Usporedba u splitu ima mala tijela (kompromis 9:16).

## Što je napravljeno
1. **Val u krvotoku (surge).** Novi cue `surge`, jedan po videu.
   - Minuta dolazi iz modela (`surgeOf` u `video-story.ts`): ista tvar kao vrh (alkohol, inače jasan porast šećera, inače kofein), od 25 % vrha do vrha.
   - Planer bira prvu slobodnu sekundu u tom rasponu. Mora biti ≥ 1,4 s od gutljaja, risera i udarca, ≥ 0,9 s od novog trenutka i prvog otkucaja, i uvijek prije udarca.
   - Kod pića se rast događa baš u glideu prema vrhu. Tada val "jaše" riser (`data.v` = sekunde do udarca) i raste zajedno s njim do udarca.
   - Slika: više i brže "komete" s repom od jetre do srca i mozga; srce pa mozak zasvijetle u boji tvari (šećer zlatno, kofein zeleno, alkohol jantar); šećer ima male iskre.
   - Bez teksta i broja, pa se nikad ne može razlikovati od mjerača.
2. **Krvotok uvijek vidljiv.** Komete s repom i blagim njihanjem (više nije "niz perli"). Gase se 50 px prije gornjeg teksta i titla.
3. **Udarac organa na svakom novom trenutku:** tanki prsten i sjaj na organu trenutka (0,5 s) + tihi "thump" (92 → 52 Hz) ispod ticka. Ne dolazi na sam vrh, jer vrh ima svoj udarac. U splitu je na organu mjerača obje strane.
4. **Zvukovi vala:** zračni "swell" + mekani niski puls. Uz to glas tvari:
   - šećer: pentatonske iskrice;
   - kofein: svijetli "switch on";
   - alkohol: topli, lagano padajući swell.
   - Kad val jaše riser, swell se ne svira (riser je swell), a glas tvari je tiši.
5. **Tamna pića svijetle (samo video).** `LiquidRoute vivid`: tamno piće dobije vlastitu nijansu u punoj jačini (cola je jantarno-crvena, ne crna). Uz to mekane trake svjetla putuju niz tok, brže dok se tok miče. App izvan snimanja je nepromijenjen.
6. **Testovi.** Sweep svih 150 namirnica sada provjerava i tajming efekata (`fxTiming`):
   - najviše 1 val, nikad na gutljaju, riseru ili udarcu;
   - val nikad poslije udarca ni na end cardu;
   - nikad više od 3 bljeska u 1 s (udarci organa, mikro-pulsevi, val, udarci, otkucaji srca).
   - Novi blok "round 10": `surgeOf` po tvari (voda nema val); val pada u model-raspon kod > 90 % namirnica s vrhom (80/80); glatka ovojnica bez skokova između frameova.
   - Test je odmah našao gomilu od 4 bljeska u 3 piva u 21 h, popravljeno.

Znanstveni modeli nisu mijenjani. Na ekranu nema novih brojeva ni riječi.

## Ocjena zadržavanja (0–10, prije → poslije)
| Uzorak | Prije | Poslije | Zašto |
|---|---|---|---|
| kebab long | 7,0 | 7,5 | udarac organa svakih ~4 s, šećerni val prije vrha; 24:00 i dalje dugo |
| cola short | 7,5 | 8,5 | cola je svijetleći jantarni tok, val sa iskrama raste u udarac |
| espresso short | 7,5 | 8,0 | kofeinski val na 10,5 s (mozak zeleno), thump na trenucima |
| pivo ×3 long | 8,0 | 8,5 | alkoholni val jaše riser u vrh |
| pizza long | 7,0 | 7,5 | zlatni val do mozga prije vrha, udarci organa |
| compare cola-voda short | 7,0 | 7,5 | val na strani cole, udarci na oba tijela |

## Provjera runde 10
- Uzorci u `C:\claudework\video-samples\2026-10-29-v10\` (6 MP4):
  - kebab-long (66,0 s)
  - cola-short (28,8 s)
  - espresso-short (27,4 s)
  - beer-3-over-2h-long (65,6 s)
  - pizza-builder-long (66,1 s)
  - compare-cola-vs-water-short (25,6 s)
- Svi su 1080×1920, 30 fps, H.264 + AAC, bez crnih frameova i bez grešaka u konzoli.
- Glasnoća: −14,1 do −14,3 LUFS, true peak −1,8 do −1,9 dBTP.
- Thump na stopu: +4,5 dB niskih frekvencija (< 130 Hz) u odnosu na prije.
- tsc je čist, vitest 724/724 (1 skip: `_dbg9.test.ts`). Oba builda prolaze (split zadnji).

## Za vlasnika
- **Otkucaji srca za kofein:** namjerno NISU dodani. Model kaže da se puls ne mijenja (spec A13), pa bi zvuk tvrdio nešto netočno. Otkucaji ostaju samo dok model kaže da je srce pod stresom (npr. pivo noću).
- **Krvotok ide okomito** (jetra → srce → mozak), pa kod širokog kadra izgleda kao uspravni stup kometa. Ako je previše, može se smanjiti broj kometa u valu.

## Runda 10b (2026-10-29): kraj koji živi, krvotok kao žile
Backup: `C:\claudework\inside-24h-backups\20261029-200558-video10b\`.
1. **Kraj videa više ne miruje.** Na 24 h beatu i ispod end carda kamera se polako primiče i odmiče (`idleDrift`, jedan dah svakih 10 s, uz postojeće njihanje). Isto vrijedi za split. Na organu gdje je ostatak hrane/pića je spori "dah" svjetla (`drawBreath`, alpha 0,08–0,2, nije bljesak).
2. **Krvotok kao žile.** Umjesto okomitog stupa točkica: tri zakrivljene žile koje se razilaze između organa i spajaju na njima (slabe linije), manje kometa, različite brzine i veličine, i fade po dubini.
3. **Kofein:** i dalje bez otkucaja srca (model kaže da se puls ne mijenja).
4. **Testovi:** sweep svih namirnica (single i compare) provjerava da slika nigdje ne stoji dulje od 3 s (`frameMoves`). Novi blok "round 10b": glatki drift na kraju, zakrivljene žile.
- Uzorci u `C:\claudework\video-samples\2026-10-29-v10b\`: kebab-long, pizza-builder-long, cola-short, compare-cola-vs-water-short. Glasnoća −14,1 do −14,3 LUFS, TP −1,8/−1,9 dBTP, bez crnih frameova.
- tsc je čist, vitest 772/772 (1 skip). Oba builda prolaze.
- Site build nije commitan jer sadrži necommitane promjene baze hrane drugog agenta.

---

# Runda 11 (2026-10-29): preporuke iz `viral-research-2026-10-29.md`

Backup: `C:\claudework\inside-24h-backups\20261029-201746-video11\` + git (HEAD prije runde = 0908dc8, zatim commitovi food-DB agenta).

## Što je napravljeno
1. **R1 kraj i petlja.**
   - Novi 24 h beat s tijelom u kadru (long 2,2 s, medium 2,0 s, short 1,7 s). Zadnja kartica ode, dođe "AFTER 24 HOURS" i četiri lampice dana (krug, ikona, kratki naziv) se pale jedna po jedna uz blip. Na kraju je prsten "day done" i kratki arpeggio.
   - Za alkohol je beat miran: samo prsten i jedno tiho zvono, bez iskri i durskog akorda. Alkohol se nikad ne slavi.
   - Usporedba: presuda iz `verdictOf` sleti u tom beatu (s udarcem) i ostaje na end cardu, pa se čita više od 4 s.
   - End card traje 4,0 s u longu, 3,0 s u mediumu i 2,5 s u shortu. U shortu ostaju samo naziv, pitanje i petlja.
   - Zadnji red "↻ Now watch the first sip/bite again." prelazi u frame 0 (hook). Handle je i dalje gore.
2. **R2 dva hooka.** `hookB` je drugi hook drugom formulom: prvo pitanje, onda činjenica iz A. Koristi samo A-ove brojeve. Primjeri:
   - "Where does all that sugar go? / One can of cola: 9 teaspoons of sugar."
   - "Does coffee send you to the toilet?"
   - "Is it gone by the next morning?"
   - Usporedba: "Cola or Water: which leaves your stomach first?"
   - U share dijalogu je izbor "Opening line: A / B" s oba teksta. Datoteka dobiva sufiks `-hookB`.
3. **R3 rez po platformi.** Novi `medium` rez (Instagram Reels, 45–55 s). Share dijalog i usporedba biraju platformu:
   - TikTok 62–75 s;
   - Instagram Reels 45–55 s;
   - YouTube Shorts 23–30 s;
   - Facebook Reels 62–75 s.
4. **R6 opisi po platformi** (`video-caption.ts`), svaki s gumbom "Copy":
   - Prvi red je fraza pretrage ("What happens in your body after one can of cola (24 hours)").
   - TikTok ima 5 hashtagova i jedno pitanje za komentare.
   - Instagram ima ≤ 5 hashtagova i ne traži komentar.
   - Facebook je bez hashtagova.
   - Shorts ima naslov ≤ 60 znakova, opis i 3 hashtaga.
   - Svaki tekst ima disclaimer i izvore (USDA FoodData Central + studije u appu, "How we know"). Alkohol dobiva i "Educational simulation · 18+ · Don't drink and drive."
   - Zabranjene riječi su testirane (cure, detox, burn it off, weight loss, best…).
5. **R7 usklađenost.** U videu više nema "Comment: …". Chip i hook usporedbe kažu "Guess before the answer.", a riječ "comment" postoji samo u TikTok opisu.
   - Zdravstveni tekst u videu nije mijenjan. Sve kartice dolaze iz postojećih poglavlja s izvorima, nema novih tvrdnji, a disclaimer je u svakom kadru.
   - Sigurnosne kartice za alkohol ("Don't drive.", "On diabetes medicine? Watch for low sugar.") su upozorenja, ne savjet o liječenju.
6. **R8 cover.** "Save cover image" sada crta hook velikim slovima u središnjem pojasu (y 560–1360, x 90–990), koji preživi crop 1:1 i 3:4. Uz hook je mala oznaka serije "INSIDE 24H" (test).
7. **R5 raznolikost.** Iz imena hrane se računa seed (`seedOf`). Određuje:
   - koji hook je A (rotacija formula);
   - tonalitet i početak progresije glazbe (5 tonaliteta × 4 rotacije);
   - boju whoosha;
   - smjer i fazu njihanja kamere.
   - Ista hrana uvijek daje isto.
8. **R10 x-ray zaron nije dodan kao novi kadar.** Gutljaj već prati kameru usta → jednjak → želudac odmah nakon rewinda. Frame 0 ostaje teaser s cijelim hookom, kao i prije.
9. **Glas: NE** (odluka vlasnika). Skripta za naraciju nije napravljena.

## Duljine (odluka vlasnika + istraživanje)
- **Long (TikTok, Facebook):** 62–75 s. Test zahtijeva ≥ 61,5 s za single i usporedbu, a izričito nikad < 60,5 s, na svih 178 namirnica i 12 parova.
- **Reels:** 45–55 s. Podaci za Reels pokazuju vrh na 45–60 s, a replay se broji.
- **Shorts:** 23–30 s (prije 15–30). Shorts publika gleda ~3× kraće. Ispod ~23 s naša priča (hook, gutljaj, vrh, isplata, 24 h) nema mjesta za čitanje, a iznad 30 s pada "viewed vs swiped". Kratki kraj (2,5 s) i petlja daju ponovno gledanje.

## Vodič za vlasnika: A/B hook
- Objavi A i B **različitih dana** (ili na Instagramu kao Trial Reel), uvijek isti video, mijenja se samo hook. **Jedna varijabla tjedno.**
- Uspoređuj:
  1. **prve 3 s**: Shorts "Viewed vs. swiped away", TikTok 2–3 s hold;
  2. **avg % viewed** i gdje pada krivulja (prije vrhunca? na end cardu?);
  3. **shares/sends po reachu**;
  4. komentare.
- Pobjednik je hook s boljim prvim 3 s **i** jednakim ili boljim avg % viewed. Nikad dva videa iste hrane i formata isti dan na istom kanalu.

## Provjera runde 11
- Uzorci kroz pravi UI u `C:\claudework\video-samples\2026-10-29-v11\`:
  - kebab-tiktok-long (64,9 s)
  - beer-3-over-2h-reels-medium (52,6 s)
  - cola-shorts (27,2 s)
  - espresso-shorts-hookB (25,8 s)
  - compare-cola-vs-water-reels-medium (53,0 s)
- Svi su 1080×1920, 30 fps, H.264 + AAC, bez grešaka u konzoli. Glasnoća −14,2/−14,3 LUFS, TP −1,5 do −1,8 dBTP.
- Pregledani krajevi: lampice se pale uz tijelo, end card je kratak, a "↻" se pretapa u frame 0.
- tsc je čist, vitest 822/822 (1 skip). Novi testovi:
  - sweep za sva tri reza, dulje od 60,5 s, end card ≤ 2,5/4 s, 24 h beat postoji;
  - hook B za svaku hranu;
  - opisi za svaku hranu;
  - cover u središnjem pojasu;
  - raznolikost.
- Oba builda prolaze. Site build je commitan, jer su promjene baze hrane commitane (14c8183).

---

# Runda 12 (2026-10-30): popravci iz `video-critique-2026-10-30.md`

Backup: `C:\claudework\inside-24h-backups\20261029-233333-video12\`. Sadrži `v4`, `science` i obje kopije fooddb.json. Git HEAD prije runde je 5f6c5c7.

## P0
1. **Alkohol: jedna ljestvica za sva pića** (`alcoholTier` u `science/alcoholClock.ts`, na vrijednost modela i njegov raspon). Pragovi:
   - **danger:** vrh raspona je na razini trovanja;
   - **balance:** ≥ 0,5 ‰;
   - **worse:** cijeli raspon ≥ 0,2 ‰;
   - **may:** raspon dosegne 0,2 ‰;
   - **low:** ima alkohola (> 0,02 ‰).

   Istu ljestvicu koriste lampica (app i video), mjerač, kartica poglavlja i end card.
   - Bilo koji alkohol u krvi znači da je lampica mozga barem žuta.
   - Vino 150 ml i pivo 500 ml na istoj razini sada se čitaju isto: "Focus may dip" i "Attention may already be worse."
   - Na end cardu nota imenuje vrh ("Attention may be worse 41 min in").
   - Verdict usporedbe više nije pomaknut: slatko piće ili piće koje odgađa san protiv alkohola je kompromis koji imenuje oba troška, a "3 espressos win" ima pravilan glagol.
   - Modeli (farmakokinetika) nisu dirani.
2. **Compare: vrh svake strane.**
   - **Uzrok:** zajednički stop na +1:30 je pokazivao karticu poglavlja "peak" (espresso +0:43, pivo +0:48) 40 minuta prekasno. BAC/mg na +1:30 su bili točni za +1:30, jer model je isti (provjereno: isti vrh i vrijednost u 17 h i 19 h).
   - **Popravak:**
     - vrh svake strane je vlastiti stop koji planer čuva;
     - obični stopovi unutar 8 min od vrha se izostavljaju;
     - kartica s "now" ide samo uz svoj trenutak;
     - "We can't tell when you're safe to drive." ima kicker "AFTER DRINKING".
3. **Hrana bez GI, crepes.**
   - **Podaci:** pipeline (`fooddb_spec.py`, `build_fooddb.py build`). Pancakes dobivaju GI 66 (Atkinson 2008 A1 row 30, homemade, the nearest tested food). Nutella dobiva GI 29 (A1 rows 1447–1449, mean of three). Za crepe se GI računa iz brašna u tijestu s GI palačinki, mlijeka i namaza: crepes 63, s džemom 59, s Nutellom 56. Pipeline to označava kao "COMPUTED (level C)" s izvorima. Allow-list u `variants.test.ts` je ažuriran.
   - **Generator:**
     - Svaki video ima vrhunac (`climaxOf`): vrh modela, inače najjači kasniji trenutak (blood fat, dip, large intestine…).
     - Kartica koja govori o kasnijem vremenu ("Half has moved on after 116 minutes.") dobiva vlastiti trenutak kad sat dođe tamo.
     - Sat teče barem 1 min po ~4,5 s čitanja (najviše pola puta do idućeg trenutka).

## P1 i jeftini P2
- **Škrobna hrana:** "1 kaiser roll: about 7 teaspoons of sugar. / Watch the starch become blood sugar." Broj je iskazan i u poglavlju ("In all, about 7 teaspoons of sugar reach your blood, over a few hours." = dostupni ugljikohidrati / 4 g).
- **Hamburger vs cola:** sad ima igru "Guess: which raises your blood sugar more?" (prag 20 %). Presuda više nema trofej kad "pobjednik" ima više kcal: "Hamburger: a smaller blood sugar peak (…). Cola: 112 fewer kcal."
- **Espresso:** kad hook dobije odgovor u prvoj trećini, odmah se otvara druga petlja ("Coming up: …").
- **Hashtagovi:**
  - #crepes, #cinnamonroll, #kaiserroll, #hamburger #fastfood;
  - kofein je #caffeine;
  - #inside24h je uvijek prisutan;
  - Shorts naslov "What 2 crepes … do";
  - opis se ne ponavlja.
- **Ostali sitni popravci:**
  - vino: granice US/EU stoje na svakom BAC mjeraču;
  - red lampica u compareu (y ≈ 1560) je isključen;
  - limiter je postavljen na −2 dBTP;
  - "Sugar peak 43 min in";
  - "Probably too little to affect most people's sleep."
- **Nije napravljeno:**
  - P2-5: veličina pizze ostaje podatak buildera;
  - P2-6: u usporedbi je naziv već iznad tijela, pa kartica s brojevima ostaje prva;
  - P2-8: donji dio kadra.

## Testovi
Novi blok "round 12" u sweepu:
- svih **178 namirnica + 83 varijante** (long i short) imaju vrhunac, nijednu karticu prije njenog vremena i sat koji ne stoji pod karticama;
- alkohol nikad nema zelenu lampicu mozga, a vino i pivo imaju istu oznaku;
- vrhovi u usporedbi su stopovi u minuti singlea;
- škrobni hook;
- hashtagovi.

vitest 827/827 (1 skip). tsc čist, oba builda prolaze.

## Uzorci
`C:\claudework\video-samples\2026-10-30-v12\`:
- red-wine-tiktok-long
- red-wine-shorts-hookB
- crepes-chocolate-tiktok-long
- compare-espresso-vs-beer-tiktok-long
- kaiser-roll-shorts
- compare-hamburger-vs-cola-tiktok-long

Svi su 1080×1920, 30 fps, bez grešaka i crnih frameova. Glasnoća −14,1 do −14,3 LUFS, TP ≤ −1,7 dBTP. Long traje 62,4–74,6 s, short 29,3–29,6 s.

---

# Runda 13 (2026-10-30): `video-critique-2026-10-30-b.md`

Backup: `C:\claudework\inside-24h-backups\20261030-083338-video13\`. Git HEAD prije runde je d688ec7.

## P0
1. **End card "Sugar peak N min in"** je pokazivao minutu kad šećer prijeđe prag. Sada pokazuje minutu trenutka "Blood sugar peak" iz videa (isti izvor kao oznaka PEAK).
   - Vremena na end cardu su točna do minute ("1 h 50 min in").
   - Alkoholna nota imenuje vrh BAC i koristi riječi mjerača ("Focus may dip 41 min in"), pa stane i u uski compare end card.
2. **Losos i sva masna/proteinska hrana:**
   - Vrhunac iz poglavlja (bez vrha u modelu) više ne povlači pravilo "udarac do 15 s", koje je izbacivalo sve trenutke prije vrhunca. Takav vrhunac dolazi do 40 s.
   - Kartica traje najviše ~6 s (`CARD_MAX_S`). Višak vremena ide u putovanje između trenutaka, najviše 6× sporije: prvo nakon udarca, zatim prije njega ako udarac i dalje stigne na vrijeme.
   - Novi mjerač "Blood fat up / +0.3 mmol/L triglycerides" iz modela (`tgDelta`), na srcu.
   - Hrana s puno proteina i malo ugljikohidrata ima hook "Half a fillet of salmon: 39 g of protein. / Watch your body use it."
3. **"Almost all … by 4 hours"** više nije fiksni predložak. Vrijeme se računa iz istog modela želuca (90 % izašlo): pizza "by 7 hours", losos "by 3 hours". Uz runde se ne kaže.

## P1
- **Hamburger vs cola:** odgovor stiže u drugoj polovici videa (`REVEAL_FROM` 0,55) ili na +24:00. Trake do tada rastu bez imena.
- **Teaseri su sada ljudskim riječima:**
  - "Coming up: when it hits hardest.";
  - "… what is left at bedtime.";
  - "… the sugar crash."
- **Red wine vs beer:**
  - Hook je "Guess: which brings more alcohol?" (iz grama modela, neutralno). Kad dva alkoholna pića izlaze iz krvi jasno različito, pita se "which leaves your blood first?".
  - "Alcohol gone" svake strane čuva se kao trenutak. Prije izbacivanja čuvanog trenutka, trenuci se skraćuju na jednu karticu.
  - Ista kartica na obje strane prikazuje se jednom, preko obje kolone ("Both · …").
  - Presuda je "Less alcohol: Red wine (16 g vs 20 g).", bez "lighter choice".
- **Shorts naslovi:** "500 ml of beer: what it does inside you in 24 h", "2 crepes: what they do …". Množina vrijedi samo za brojene stvari (test na svim stavkama).
- **Oat milk:** hook "250 ml of oat milk. / More blood sugar than cow's milk." (`surpriseOf`, provjereno modelom za isti profil: ≥ 0,5 mmol/L i ≥ 30 % više). Isto vrijedi za rice milk i juice vs whole fruit kad model to pokaže.
- **Pića:** end card pita "Which drink should we test next?".
- **Alkohol u tankom crijevu:** "Alcohol passes into your blood here." umjesto "Starch and sugar turn into blood sugar."

## P2
- Traka utrke je 40 px više.
- Duljine imaju marginu: long 62–73 s, Reels 45–53 s, Shorts 23–29,5 s.

## Testovi
Novi blok "round 13", na 178 + 83 stavki i compare parovima:
- minuta na end cardu = trenutak u videu (šećer i BAC);
- nota ≤ 32 znaka;
- nema "by 4 hours", a "almost all" je ≥ 1,3 × "half";
- kartica ≤ 6 s (rijetka pića poput decafa do ~9 s);
- mjerač na vrhuncu;
- duljine;
- reveal u drugoj polovici;
- igra za alkohol vs alkohol;
- gramatika naslova;
- oat milk hook;
- teaseri.

vitest 835/835 (1 skip). tsc je čist, oba builda prolaze.

## Uzorci
`C:\claudework\video-samples\2026-10-30-v13\` (10):
- meal, pizza, cola, crepes, salmon, espresso (TT);
- cinnamon roll, red wine vs beer (Reels);
- hamburger vs cola (TT);
- oat milk (Shorts).

Svi bez grešaka i crnih frameova. Glasnoća −14,1 do −14,3 LUFS, TP ≤ −1,8 dBTP.

---

# Runda 14 (2026-10-30/31): `video-critique-2026-10-30-c.md` i odluke vlasnika

Backup: `C:\claudework\inside-24h-backups\20261030-201915-video14\`. Git HEAD prije runde je 7b34dd4.

## Napravljeno
- **Nikad > 4 s bez kartice** (`WORDLESS_MAX_S`), za sve stavke, varijante i compare parove (sweep test). Pravila koja to drže:
  - glide traje najviše 3,6 s;
  - rijetke priče (< 7 trenutaka) zadržavaju i tihe trenutke ("Building blocks" i karticu gutljaja);
  - rano pravilo vrhunca ne izbacuje njihove trenutke;
  - Shorts glide je 0,75× brži.
- **Decaf (P0):**
  - Hook je "Decaf filter coffee: is there still caffeine in it?" / "Is decaf really caffeine-free?".
  - Odgovor ima vlastiti trenutak iz modela: "Yes, a little: about 3 mg." + "A regular cup has about 100 mg." (`decafOf`, regularna kava iste porcije).
- **Svaki hook ima broj ili pitanje, svako pitanje ima odgovor u videu, a svaki broj iz hooka je na kartici** (sweep A i B za 178 + 83 stavki). Pritom:
  - Hook nosi `answer` (kartica na trenutku isplate, uvijek zadržana) i `lead` (kartica s brojem odmah iza imena).
  - Oat milk: "2× the blood sugar rise of cow's milk." + kartica "About 2× the rise of cow's milk."
  - Jedno pivo ili vino: "How long does it stay in your blood?" s odgovorom "The alcohol is gone after about 1–4 h." B ima grame alkohola.
  - Crepes: "4 teaspoons of sugar."
  - Proteinska hrana ima karticu "39 g of protein.".
  - Facts se čitaju iz izvornog teksta (prije su se dugi zagradni dijelovi rezali).
- **Compare:**
  - **Prvi trenutak navodi porcije:** "A typical serving each: 150 ml vs 500 ml." (ili "Same amount: 250 ml each."), kao jedna kartica preko obje kolone.
  - **NEXT chip** imenuje stranu i njen trenutak ljudskim riječima ("Beer: when it is finally gone"). Test provjerava da strana taj trenutak stvarno ima.
  - **"Faster out ≠ better"** se prikazuje samo nakon utrke van.
  - **Alkoholna presuda** uvijek završava s "Both: don't drive.".
  - **Cola vs voda (Shorts):** igra "Guess: which leaves your stomach first?". Porcije u granicama ±30 % su fer jer su navedene na ekranu.
  - **Ista kartica s obje strane** čita se jednom; kratki compare s malo trenutaka pokazuje dvije kartice po trenutku.
- **"Same amount"** u Compareu se nudi samo za jednu stavku po strani, bez alkohola, iste vrste (piće/hrana) i s tipičnim porcijama unutar 2×: cola vs juice da; vino vs pivo, espresso vs cola ne (`sameAmountOffer`, test).
- **End card:** jedan istaknuti broj ("Blood sugar up · 20 min in" + raspon), isti kao mjerač na vrhuncu.
- **Shorts traju 24–31,5 s.** Shorts sada mora stati i vrhunac i odgovor na hook.

## Nije napravljeno
- PZ-1: veličina pizze ostaje podatak buildera.
- G-1: donji dio kadra (vlasnik je ranije odlučio).

## Provjera
- tsc je čist, vitest 842/842 (1 skip). Oba builda prolaze.
- Uzorci u `C:\claudework\video-samples\2026-10-30-v14\` (9): decaf, salmon, beer ×1, crepes (TT); oat milk, wine hook B, cola vs water (Shorts); espresso vs beer (TT); wine vs beer (Reels).
- Svi bez grešaka i crnih frameova. Glasnoća −14,2 do −14,5 LUFS, TP ≤ −1,8 dBTP.

## Runda 14b (2026-10-31): zadnja dva P2
Backup: `C:\claudework\inside-24h-backups\20261031-011203-video14b\`.
- **PZ-1, veličina pizze:** cijela i pola pizze sada navode veličinu, svugdje u appu i u videu: "A whole 14-inch pizza (1154 g): 2723 kcal." Podaci se nisu mijenjali: USDA-ova 14-inčna pizza (853 g) plus odabrani dodaci.
- **G-1, donja četvrtina kadra:** ispod bloka s titlom više nema tamnog vela, pa se tijelo tamo vidi cijelo. Uz to ga obasjava mekani "floor glow" u boji pića: dah od 4 s, alpha 0,10–0,18, nikad tekst ni bljesak. U singlu je jedan, u usporedbi po jedan za svako tijelo.
- vitest 842/842. Oba builda prolaze.
- Uzorci u `C:\claudework\video-samples\2026-10-31-v14b\`: pizza (TT), cola (Shorts), hamburger vs cola (TT).
