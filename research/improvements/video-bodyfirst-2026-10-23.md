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
