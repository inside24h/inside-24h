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
