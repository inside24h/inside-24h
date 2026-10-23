# Video export: polish (2026-10-22/23)

Cilj: video iz aplikacije (Reel/TikTok/Shorts/FB/X) bez grešaka, tekst nikad prebrz, sve vidljivo izvan UI-ja platformi.
Sve provjereno na stvarno renderiranim MP4-ovima (Chrome kroz Playwright, pravi UI klikovi, ffprobe + izvučeni frameovi).

## 1. Što je promijenjeno (datoteke)

| Datoteka | Promjena |
|---|---|
| `app/src/v4/video-plan.ts` (novo) | Planer videa: pravilo brzine čitanja, izbor trenutaka, stranice titlova (samo cijele rečenice), duljina long 62–75 s / short 15–30 s, svi frameovi + zvučni "cue"-ovi. `planVideo` (jedan proizvod) i `planCompare` (usporedba). |
| `app/src/v4/video-audio.ts` (novo) | Vlastiti proceduralni soundtrack (WebAudio, OfflineAudioContext, bez uzoraka/licenci) → AAC (WebCodecs AudioEncoder) u MP4; za fallback stazu reprodukcija u MediaStream. |
| `app/src/v4/share.ts` | Novi layout kadra unutar safe zone (SAFE), brand fontovi (Geist / Instrument Serif), hook-frame kao prvi frame (thumbnail), headline-pitanje stalno gore, panel titla fiksne visine, pop-kartica, "where" pilula, traka dana s točkama trenutaka, end card s CTA i petljom natrag na prvi frame, zajednički H.264 encoder (High→Main→Baseline, VBR 8 Mbps), audio track, MediaRecorder fallback vozi isti plan u stvarnom vremenu (H.264+AAC gdje može), usporedni video potpuno prerađen (tijela gore, titlovi složeni dolje). |
| `app/src/v4/AppV4.tsx` (samo video dio) | `reelPlan()` umjesto 58 s `storyFrames`; prekidač zvuka ("Our music / None (add your own)"); oznake duljine "over 1 min / under 30 s"; hook "X: what happens inside your body in 24 hours?" (umjesto "1 sandwich hamburger + 2 small portion…"); "FIRST BITE" za hranu; usporedba preko `planCompare`; poruka ako preglednik ne može dodati zvuk. |
| `app/src/v4/perf/SafeCanvas.tsx` | Za vrijeme snimanja 3D se renderira na ≥ 2× (max 3×) piksela → oštro tijelo u 1080×1920. |
| `app/src/v4/Compare.tsx` | Samo oznake duljine ("over 1 min / under 30 s"). |
| `app/src/v4/VideoFallback.tsx` | "Chrome, Edge or Safari". |
| `app/src/v4/video-plan.test.ts`, `video-plan.fixtures.json` (novo), `share.test.ts` | 19 + 56 testova (vidi §6). |

Backup svih dirnutih datoteka: `backups/20261022-224920-video/`. Ništa nije commitano. AppV4.tsx i Compare.tsx vraćeni na CRLF.

## 2. Pravilo čitanja (istraženo)
- Netflix Timed Text Style Guide: min 5/6 s po titlu, max 7 s; engleski do 20 znakova/s (odrasli), 17 (djeca). BBC: 160–180 riječi/min.
- Na mobitelu gledatelj istovremeno prati tijelo, pečat vremena, broj i mjesto → idemo daleko ispod: **14 znakova/s (~2,5 riječi/s) + 0,9 s za pronalazak teksta, minimum 2,4 s, +0,8 s za prvi titl novog trenutka, +0,2 s fade.** Tvrdi test: nijedan titl brži od 3 riječi/s.
- Titl se nikad ne reže usred rečenice (dugačka rečenica → 2 stranice, prijelom na zarezu/zagradi, nikad iza "the/of/your", broj ostaje uz jedinicu: "2 h", "7.3 mmol/L").
- Kad je video predug: prvo se izbacuje trenutak koji najmanje govori (broj brojki + "peak/dip/bed/gone" u prvoj rečenici), pa se vraćaju rečenice; tekst se nikad ne ubrzava. Hook ostaje gore kao naslov cijelo vrijeme (tko uđe kasnije zna što gleda).

## 3. Safe zone (9:16, 1080×1920)
Izvori: predlošci platformi za oglase (YouTube Shorts top 288 / bottom 672 / right 192; Meta Reels top 269 / bottom 672; TikTok top 240 / bottom 660, gumbi od y≈840) + organski UI je manji.
Jedan layout za sve: **sav tekst u x 80–1000, y 280–1320; ispod y 840 desni rub ≤ 888** (stupac like/comment/share). Tijelo smije ići ispod UI-ja, riječi ne. Ispod 1320 samo sitni tisak (disclaimer + BodyParts3D atribucija) i traka dana — dekoracija koja je na X-u vidljiva, a na TikToku smije biti pokrivena; atribucija je i na end cardu u safe zoni.
Feed 4:5: margine 50/60 (nema overlaya).

## 4. Zvuk
- Isplati se: platforme favoriziraju video sa zvukom, a mnogi gledaju bez zvuka → titlovi ostaju glavni nositelj. Licencirana glazba = rizik → **vlastiti proceduralni soundtrack** (A-mol pad, tihi beat 100 BPM koji kreće nakon hooka, "whoosh" na svakom prijelazu, "tick" kad sleti pečat, akord na end cardu, zvuk od prvog framea, fade 0,3 s na kraju za petlju).
- Glasnoća: **−16,3 LUFS** izmjereno (ffmpeg ebur128) na svih 12 videa; vrhovi meko limitirani < −1 dBFS. Malo ispod −14 da vlasnikov glas / trending zvuk ostane iznad.
- Ako preglednik nema AAC encoder → video bez zvuka + poruka "Add a sound when you post it". Prekidač "None (add your own)" za objavu s trending zvukom u TikTok/IG editoru.
- Preporuka vlasniku: za najveći reach u TikToku/Reelsima dodati trending zvuk u aplikaciji pri objavi (naš track utišati ili izabrati "None"); voiceover = sljedeći korak (video-strategy.md §5.4 P1).

## 5. Izmjereno: prije / poslije

| | Prije (HEAD) | Poslije |
|---|---|---|
| Duljina long | 58,0 s (cap "Reels 61 s") | 70,7–74,9 s (svih 9 testiranih), usporedba 66,9 s |
| Duljina short | ~22 s | 22,2–29,8 s |
| Brzina titla | hold 4,3 s + 1,1 s za ~22 riječi ≈ **4 riječi/s**; hook 11 riječi u 1,9 s ≈ **5,8 riječi/s** | ≤ ~2,5 riječi/s, svaki titl ≥ 2,4 s; hook ostaje cijeli video |
| Tekst u UI zonama | pečat, sat, titl, disclaimer u donjoj zoni; pop krug pod desnim gumbima; "INSIDE 24H" u gornjoj traci | 0 riječi izvan safe zone (testirano za 2 širine fonta, intro/main/outro, reel/feed/usporedba) |
| Odrezan tekst | pop label izlazi iz kruga; usporedba "…" na svakom titlu, 31 px slova | nigdje "…" u realnim slučajevima; titl 50 px (feed 42), usporedba 36 px |
| Zvuk | nema | AAC 48 kHz stereo 160 kbps, −16,3 LUFS |
| Codec / fps / frameovi | H.264 High, 30 fps | H.264 High, 30 fps, VBR 8 Mbps (5,5–7,6 Mbps stvarno), nb_frames = trajanje × 30 točno |
| Veličina | 55 MB / 58 s | 50–68 MB / 70–75 s; short 17–27 MB |
| Prvi frame | zatamnjen hook preko statičnog panela | hook pitanje veliko preko tijela koje se već kreće (= thumbnail), "Save cover image" daje točno taj frame |
| Kraj | end card 3,2 s | end card 6,5 s + zadnjih 0,5 s pretapanje u prvi frame (bešavna petlja); prije end carda 24 h beat bez teksta |

Fallback bez WebCodecs (simulirano brisanjem VideoEncoder): isti plan u stvarnom vremenu, MP4 H.264 + AAC, 29,4 s (plan 29,8 s), 29,7 fps. Popravljen bug: prvi rAF prije t0 → negativan indeks → rušenje.

Pronađeni i popravljeni bugovi tijekom QA: pogrešan font titla (titl crtan u 28 px nakon refaktora — uhvatio test), naslov poglavlja ≠ titl u 24 h beatu, "1½ h" se zaokruživao na "2 HOURS", "FIRST SIP" za pizzu, "2 / h" prijelom.

## 6. Testovi
- `video-plan.test.ts` (19): pravilo čitanja, rečenice/brojevi, stranice bez gubitka riječi i bez "cliff-hanger" prijeloma; za 7 stvarnih priča (cola, voda, espresso, 3 piva kroz 2 h, cijela pizza capricciosa, kebab, hamburger+krumpirići+cola) × long/short: long ≥ 61,5 s i ≤ 75,5 s, short 15–30 s, broj frameova = trajanje × 30, prvi frame hook, zadnji end card, svaki titl ≥ svoje vrijeme čitanja i ≤ 3 riječi/s, samo cijele rečenice, vrijeme ide samo naprijed, kraj na 24 h; cola zadržava 0/20/75 min; mala priča ipak ≥ 61 s.
- `share.test.ts` (+56): safe zona za svaku riječ (reel/feed/usporedba, intro/main/outro, uska i široka mjera fonta, ekstremni nazivi), nema "…" u realnim slučajevima, titl ≥ 42 px, ništa < 20 px osim sitnog tiska.
- Cijeli suite: `npx vitest run` 497/497, `npx tsc --noEmit -p .` čisto.

## 7. Snimke za pregled (scratchpad)
`C:\Users\TINCUC~1\AppData\Local\Temp\claude\C--Users-Tin-Cuculic\2c75f631-d1a9-45ff-8171-9d373e2eea3f\scratchpad\video-qa\`
- `before\cola-long.mp4`, `before\f\cola-sheet.png`, `before\f\first.png` — stanje prije.
- `final\*.mp4` (12 videa) i `final\f\*-sheet.png` (kontakt listovi svakih 4 s), `final\f\*-first.png` (thumbnails), `final\f\firsts.png`.
- `final2\f\pair.png` (hook frame + 24 h beat, pivo), `v5\f\meal3-t36.png` (glavni kadar), `v5\f\meal3-t67.png` (end card), `v5\f\cmp-first-last.png` (petlja), `cmp1\f\t31.png` (usporedba), `fallback\` (MediaRecorder staza).
- QA skripta: `render.cjs` (vite dev server + jedan Chrome; `JOBS`, `NOWEBCODECS=1`, `SILENT=1`).

## 8. Otvoreno / za druge
- **Sadržaj (science/UI agent):** prvi titl builder-pizze glasi "Whole · 1104 g pizza capricciosa." (iz `foodProduct.ts`), kebab "Kebab / doner (1 kebab)." — rade, ali nisu lijepi; obrok "1 hamburger + 2 small portion french fries" (amountLabel).
- **verdictOf** (AppV4, usporedba): "Espresso vs Beer → 🏆 Beer wins." — provjeriti logiku presude prije objave usporedbi s alkoholom.
- Za mnogo teksta long cut mora izostaviti neke trenutke (npr. cola: 1, 6, 45 min); short cut za tešku hranu ponekad nema "blood sugar peak" jer je ta rečenica preduga za 30 s. Kraće prve rečenice poglavlja (science) bi dale više trenutaka.
- Safari: AudioEncoder/AAC nije svugdje → tada video bez zvuka s porukom; nije testirano na pravom Safariju/iOS-u (nema na ovom PC-u). Edge = isti Chromium, Chrome testiran.
- Usporedni video koristi isti prekidač zvuka kao glavni dijalog (u Compare panelu nema vlastitog prekidača).
- `drawMomentCard` ("Share this moment" slika) i dalje koristi `stampFor(minute)` bez "FIRST BITE" za hranu (MomentShare nije video kod).
- Moguće dalje: voiceover, .srt export, 1:1/16:9 (ne postoje sad, nisu dodani).
