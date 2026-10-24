# Video creative spec: viralnost i gledanje do kraja (2026-10-24)

Autor: research agent (Opus). Samo spec, nijedna datoteka koda nije dirana. Nadovezuje se na `video-strategy.md` (§3, §5), `video-polish-2026-10-22.md` i `video-bodyfirst-2026-10-23.md` (runde 1 i 2).
Za koga: coding agent koji radi na `app/src/v4/video-plan.ts`, `video-audio.ts`, `share.ts`, `VideoCam.tsx`, `CompareVideo.tsx`, `video-body.ts`.

Oznake dokaza: **[PRIMARY]** = službena stranica platforme ili standard. **[SECONDARY]** = medij ili analiza koja citira primarni izvor. **[UNVERIFIED]** = vendor ili blog bez metodologije. **[OPINION]** = moja preporuka.

Jezik: obrazloženja su na hrvatskom, sav tekst na ekranu je na engleskom (kao u aplikaciji).

---

## 0. Dijagnoza trenutnih uzoraka (`C:\claudework\video-samples\2026-10-23\`)

Pregledao sam kontakt listove (frame svake 3 s) za cola-long, espresso-vs-beer-long, beer-3-short i meal-long, plus prvi frame cole u punoj veličini.

Što radi:
- Tijelo je zvijezda, kamera je glatka, mjerači su uz organe, sat ubrzava i tekst je u safe zoni.

Što ubija zadržavanje gledatelja ([OPINION], na temelju istraživanja u §1):
1. **Frame 0 je miran i bez obećanja.** Vidi se tijelo u širokom kadru, "One can of cola — inside your body" i "+0:00". Nema broja, pitanja, pokreta ni razloga da gledatelj ostane do 0:03. Donjih ~30 % kadra je prazno i crno.
2. **Nema vrhunca.** Šećerni ili alkoholni vrh dođe kao bilo koja druga kartica: isti whoosh, isti tick, ista kamera. Gledatelj ne osjeti da je nešto važno.
3. **Nema otvorenih petlji.** Video nikad ne kaže "ono najbolje tek dolazi". Kad kartica nestane, nema razloga čekati sljedeću.
4. **Dugi mirni dijelovi.** Npr. cola od +3:03 do +3:22 je četiri framea zaredom gotovo isti kadar (jetra, isti broj). Između vizualnih događaja prođe više od 6 s.
5. **Zvuk je ambijent**, 100 BPM, −16,3 LUFS. Nema udarca, rizera ni folija (gutljaj, šum gazirane tekućine).
6. **Usporedba nema igru.** Nema "pogodi", utrke ni bodova. Presuda je sitan tekst na zadnjoj kartici.
7. **End card je tekstualni zid** (4 sustava × 2 stupca). Čita se, ali ne puca.

Cilj ovog speca je zadržati sve garancije (pravilo čitanja, safe zona, duljine, petlja, iskrenost) i dodati **hook, vrhunac, petlje, ritam i zvuk**.

---

## 1. Glavni nalazi (kratko, s izvorima)

| # | Nalaz | Dokaz |
|---|---|---|
| 1 | TikTok: "introduce your content proposition in the first 3 seconds" i "prioritize your hook in the first 6 seconds" (suspense, surprise). Tekst preko videa: "5–10 words per second" (za oglase). | [PRIMARY] TikTok Ads Help, *Creative best practices for performance ads* (06/2025): https://ads.tiktok.com/help/article/creative-best-practices |
| 2 | Više od 63 % videa s najvišim CTR-om pokaže ključnu poruku u prve 3 s. **Brze pjesme iznad 120 BPM često daju viši VTR.** Vertikalni videi imaju 25 % viši watch-through na 6 s. | [PRIMARY, ali za oglase] TikTok for Business blog *9 creative tips*: https://ads.tiktok.com/business/en-US/blog/9-creative-tips-to-drive-auction-ad-performance |
| 3 | 88 % korisnika TikToka kaže da je zvuk bitan za iskustvo. | [SECONDARY, studija koju je naručio TikTok] https://newsroom.tiktok.com/en-ca/moving-to-the-beat-of-our-global-community-with-our-sonic-identity-ca |
| 4 | 69 % ljudi gleda video bez zvuka na javnim mjestima (25 % privatno). 80 % kaže da će češće pogledati do kraja ako ima titlova. → Titlovi moraju nositi priču i bez zvuka. | [SECONDARY] Verizon Media + Publicis, n=5.616, 2019: https://www.3playmedia.com/blog/verizon-media-and-publicis-media-find-viewers-want-captions/ |
| 5 | Instagram rangira Reels po watch timeu, likes per reach i **sends per reach** (slanje u DM je najjači signal za ne-pratitelje). | [SECONDARY, Mosseri 01/2025 preko blogova] https://blog.hootsuite.com/instagram-algorithm/ |
| 6 | YouTube Shorts od 31. 3. 2025. broji view na svaki start i **svaki loop**. "Engaged views" su stara metrika. "Viewed vs swiped away" je metrika hooka. → Bešavna petlja direktno diže brojke. | [SECONDARY] https://9to5google.com/2025/03/26/youtube-shorts-views-metric/ ; https://vidiq.com/blog/post/youtube-shorts-algorithm/ |
| 7 | Shorts i Reels do 3 min. Duljina više nije ograničenje, odlučuje zadržavanje. | [SECONDARY] https://www.tubefilter.com/?p=182474 ; https://buffer.com/resources/instagram-reels-length |
| 8 | Teorija informacijskog jaza (Loewenstein): znatiželja je najjača kad je jaz malen, ali postoji, i drži samo ako se odgovor da na vrijeme. Više kandidata za odgovor znači više znatiželje i bolje pamćenje (Oxford, trivia). → "Pogodi" prompt i najava "+1:15" rade. | [SECONDARY, psihologija, ne video] https://www.psy.ox.ac.uk/publication/2440158 ; https://learningloop.io/plays/psychology/curiosity-effect |
| 9 | Češći rezovi pomažu samo do točke, a "agresivni" rezovi drže pažnju samo umjereno. → Svakih 2–4 s mikro-događaj, ne stalni kaos. | [SECONDARY, konf. rad 2026] https://archives.marketing-trends-congress.com/2026/pages/PDF/paper_professor_DOST_HUANG.pdf |
| 10 | Zvučne tehnike (zvučni efekti, tempo, glazba) usmjeravaju pažnju neovisno o sadržaju. | [SECONDARY, starija TV istraživanja] https://tecfa.unige.ch/tecfa/teaching/methodo/Moreno_Mayer00.pdf |
| 11 | Glasnoća: konsenzus je −14 LUFS integrirano i ≤ −1 dBTP. YouTube tiše ne pojačava. Platforme nemaju službenu specifikaciju. | [UNVERIFIED, konsenzus alata] https://vloggingpro.com/tools/audio-loudness/ |
| 12 | Fotosenzitivnost: ne više od **3 bljeska u sekundi** (WCAG 2.3.1). Vrijedi za bljeskove, pulsove i shake. | [PRIMARY] https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html |
| 13 | Brojke "60 % više zadržavanja s hookom" i "40 % više completiona sa SFX-om" su vendor tvrdnje bez metode. Ne oslanjati se na njih, nego mjeriti svoje (3 s hold, % pogledano, swipe-away). | [UNVERIFIED] https://virlo.ai/blog/why-the-first-few-seconds-matter |

**Zaključak [OPINION]:**
- Hook u 0–1 s mora biti broj ili pitanje plus nešto što se već miče.
- Svaki video treba jedan glasni vrhunac (zvuk i slika) i 2–3 najave unaprijed ("open loops").
- Mikro-događaj svakih ≤ 3 s, glazba 120 BPM, −14 LUFS, a titlovi nose sve bez zvuka.
- Usporedba je igra (pogodi → utrka → otkrivanje).
- Kraj se vraća u frame 0 (loop = view na Shortsima).

---

## 2. Novi koncepti (zajednički za sve templateove)

Svi efekti su **deterministički po indeksu framea** (bez `Math.random()` i `performance.now()`). Za šum se koristi seeded PRNG (kao `noiseBuffer` seed 7), da isti video uvijek bude isti i da testovi rade.

### 2.1 Novi cue tipovi (jedan izvor istine za sliku i zvuk)
`Cue.kind` treba proširiti:

```
'start' | 'move' | 'stop' | 'page' | 'outro' | 'end'          // postojeći
| 'teaser'   // frame 0: cold-open na vrhuncu (vidi 2.2)
| 'rewind'   // 0,45 s: premotavanje na +0:00
| 'sip'      // prvi gutljaj ili zalogaj (t ≈ 0,9 s)
| 'riser'    // počinje 1,6 s prije 'peak'
| 'peak'     // vrhunac glavnog mjerača (max |curve|), udarac
| 'next'     // "Up next" čip tijekom glide-a (open loop)
| 'night'    // početak/kraj noćnog time-lapsea (sat > 22:00 ili rate > 60 min/s)
| 'lights'   // svaka od 4 lampice sažetka na 24 h (t, index, level)
| 'verdict'  // presuda u usporedbi ili sažetak u single videu, udarac
| 'guess'    // usporedba: "Guess" prompt
| 'race'     // usporedba: jedna strana prođe ciljnu liniju utrke (side, label)
```

Cue dobiva opcionalni `data?: { level?: 0|1|2; side?: 0|1; v?: number; label?: string }`.
`layFrames` emitira sve cueove, `renderSoundtrack` i `drawBodyFrame`/`drawSplitFrame` ih čitaju. Tako je sinkronizacija zajamčena (test: svaki SFX na frameu svog cuea ± 0).

### 2.2 Cold-open teaser + premotavanje (najvažnija promjena hooka)
Frame 0 (= thumbnail) više nije +0:00, nego **najdramatičniji trenutak priče**: vrh mjerača (šećerni vrh, vrh alkohola, vrh kofeina) ili za hranu "stomach still full at +3:46".
- Tijelo svijetli, mjerač je na vrhu, hook tekst je velik.
- 0,0–0,45 s drži se taj kadar. Kamera se već giba (push-in 2 %, ne smije biti statična).
- 0,45–0,95 s je **premotavanje**: sat se vrti unatrag do +0:00 ("◀◀"), kamera klizne na usta, overlay ima kratke horizontalne "scan" linije (VHS rewind, alpha ≤ 0,25), a zvuk je `rewind`.
- Od 0,95 s ide prvi gutljaj s pljuskom (`sip`).
- Hook tekst ostaje kroz cijeli intro (3,0 s long / 2,4 s short), pa se smanji u naslov (kao sada).
- Petlja: zadnjih 0,5 s pretapa se u frame 0, a to je sada vrhunac. Gledatelj u petlji vidi "spoiler" pa premotavanje, što je prirodan razlog za drugi krug.

Planer: `planVideo` dobiva `teaserMin` (minuta vrha iz `mainGauge` krivulje, inače minuta s najvećim `stopValue`). Intro frameovi su: 0–0,45 s `m = teaserMin`, pa ease natrag na 0. Tekst: hook formula iz §5.

### 2.3 Mikro-događaji ("pattern interrupt" svakih ≤ 3 s)
Pravilo planera: unutar svakog `hold` bloka, ako je razmak do sljedećeg vizualnog događaja > 3,0 s, umetni mikro-beat na sredini. Rotira se redom:
1. promjena smjera kamere (njihanje ±12° → suprotna strana, push-in skok 4 %),
2. puls sjaja organa u fokusu (§4 V3),
3. count-up / tick mjerača na novu vrijednost,
4. "where" mjerač bljesne pri promjeni organa.

Nikad više od 1 mikro-beata po 2 s, a pulsovi sjaja ≤ 1 Hz (WCAG, nalaz 12). Test: najveći razmak između vizualnih događaja ≤ 3,2 s u svih 16 videa.

### 2.4 Otvorene petlje ("Up next" čip)
Tijekom svakog glide-a duljeg od 1,2 s, iznad titla 1,2 s piše mali čip `NEXT · +1:15 · The sugar dip` (naslov poglavlja i sat sljedećeg trenutka, oboje već iz plana).
Na ~45–55 % videa dolazi jedna **velika najava** onog najboljeg što još slijedi, ako je zadnji ili predzadnji trenutak "turn" (`stopValue` ≥ 3: peak/dip/bed/gone):

`Coming up: 07:00 tomorrow.` · `Coming up: the sugar dip.` · `Still to come: bedtime.`

Najava stoji 1,6 s, ≤ 5 riječi, i prati pravilo čitanja (2,4 s min). Stavlja se kao zasebna kartica umjesto drugog titla tog trenutka, da se video ne produlji.

### 2.5 Vrhunac (peak beat paket)
Za minutu vrha glavnog mjerača (alkohol > šećer > kofein, ista logika kao `mainGauge`):
- −1,6 s **riser** (zvuk), vinjeta se lagano zatvara (0 → 0,25), kamera polagano ulazi.
- 0 s **impact**: zoom punch (viewH × 0,92, kritično prigušena opruga natrag za 0,5 s), shake 0,22 s (amplituda 0,6 % visine, prigušeni sinus), shockwave prsten oko organa, mjerač skoči ×1,15 pa se vrati, žig `PEAK` na mjeraču 1,4 s.
- Broj na mjeraču se **odbroji** od trenutne vrijednosti do vrha (count-up 0,6 s, tick po koraku).
- Glazba se 0,4 s spusti za −6 dB (ducking), pa na vrhuncu ide "drop": kick + sub + puni akord.
- Najviše 2 impacta po videu (vrh i presuda). Više od toga gubi težinu.

### 2.6 Noćni time-lapse
Kad dan prođe 22:00 ili `rate > 60 min/s`:
- overlay dobije noćni ton (plavi gradijent, alpha 0,18),
- sat ima "ratchet" tickove čija gustoća prati `rate` (najviše 12/s, zvučno spojeni),
- glazba ide kroz lowpass 900 Hz ("san, pod vodom"),
- u kutu je mala ikona mjeseca.

Na izlasku iz noći (07:00) filter se otvori, a "sunrise" je sweep od 0,5 s. Tako se jasno osjeti "preskočili smo noć", što je pravi pattern interrupt.

---

## 3. Beat-by-beat templateovi

Vrijeme je orijentacijsko: planer ga i dalje računa iz pravila čitanja (14 zn/s + 0,9 s, min 2,4 s). Templateovi daju **redoslijed i sadržaj**, ne mijenjaju pravilo. Tekst na ekranu je ≤ 8 riječi i cjelovita misao (`video-beats.ts`). Brojevi koji se mijenjaju sa satom su **samo na mjeraču** (pravilo iz runde 2).

### 3.1 Single, LONG (~70 s)

| t (s) | Beat | Kamera | VFX | SFX | Tekst (uzorak) | Svrha |
|---|---|---|---|---|---|---|
| 0,00–0,45 | Teaser (frame 0 = thumbnail) | mid, na organu vrha, push-in 2 % | organ jako svijetli, mjerač na vrhu s `PEAK`, vinjeta | sub-swell (postojeći) + kratki "hit" na 0,00 | Hook red 1 (§5), npr. **"9 teaspoons of sugar."** + red 2 **"Watch where it goes."** | Zaustavi scroll: broj + obećanje |
| 0,45–0,95 | Rewind | spline natrag na usta | sat se vrti na +0:00, rewind linije | `rewind` | hook ostaje | Jaz: "vidio sam kraj, kako se tamo stiže?" |
| 0,95–3,0 | Prvi gutljaj | wide → usta → jednjak | pljusak čestica na ustima (V1), puls niz jednjak | `sip` (gutljaj ×2), za colu `canOpen` na 0,95 | hook ostaje, kicker "+0:00 · FIRST SIP" | Pokret od prvog framea |
| 3,0–9 | Želudac se puni | close na želudac | fluid fill (V4), mjehurići ili pjena (V5), "where" mjerač broji ml | `pour` ispod, `fizz` (cola, pivo), blip na mjeraču | "One can: 35 g of sugar." → "Water would leave twice as fast." | Zadovoljavajući proces |
| 9–12 | Glide + Up next | push-out, put dalje | `NEXT · +0:20 · Blood sugar peak` čip | whoosh | (čip) | Otvorena petlja |
| 12–20 | Krv / jetra | mid, jetra/gušterača | puls krvotoka (V8), sjaj organa | blip-ovi, tick | "Straight to the liver." | Novi organ = novi vizual |
| 18,4–20 | Riser | lagani push-in | vinjeta se zatvara | `riser` 1,6 s | | Napetost |
| 20–26 | **VRHUNAC** | punch zoom + shake | shockwave, count-up, `PEAK` žig | `impact` + drop + count tickovi | "Blood sugar peak." / "Your pancreas releases insulin." | Isplata #1 |
| 26–32 | Pad / sljedeći turn | gušterača → mozak | krivulja mjerača crta pad (plava) | tihi "down" sweep | "Many people feel hungry again." | Kontrast nakon vrha |
| ~33–35 | **Velika najava** (50 %) | odmak | kartica "Coming up: bedtime." | `next` stinger | "Coming up: bedtime." | Drugi hook na sredini |
| 35–50 | 2–3 srednja trenutka | organ po organ | mikro-beatovi svakih ≤ 3 s | whoosh, blip | kartice iz poglavlja | Ritam |
| 50–58 | Noćni time-lapse | wide, polagani orbit | noćni ton, ratchet sat, mozak (V9 heat) | lowpass glazba, ratchet tickovi | "About 11 mg of caffeine is left." | Pattern interrupt + isplata najave |
| 58–60 | Jutro / 24 h | wide | sunrise sweep, tijelo posvijetli | sunrise | "+24:00" | Rezolucija |
| 60–63,5 | 4 lampice | wide | lampice se pale jedna po jedna (0,35 s razmak), boja po razini | 4 blipa (pitch po razini) | "After 24 hours" | Scoreboard, vrijedi screenshot |
| 63,5–69,5 | End card | dim tijelo | presuda ili sažetak, CTA | `outro` akord + mekani "verdict" udarac | CTA (§6) | Komentar / follow |
| zadnjih 0,5 | Petlja | → frame 0 | crossfade na teaser | fade 0,3 s (postoji) | — | Rewatch = view |

### 3.2 Single, SHORT (~25 s)

| t (s) | Beat | Kamera | VFX | SFX | Tekst | Svrha |
|---|---|---|---|---|---|---|
| 0–0,4 | Teaser | na vrhuncu | kao long | hit | Hook (≤ 6 riječi) | Hook |
| 0,4–0,85 | Rewind | → usta | sat unatrag | rewind | | Jaz |
| 0,85–2,4 | Gutljaj | usta → želudac | pljusak | sip | hook | Pokret |
| 2,4–6 | Želudac | close | fill + mjehurići | pour/fizz | 1 kartica | Proces |
| 6–7 | Glide + NEXT čip | | čip | whoosh | NEXT čip | Petlja |
| 7–8,6 | Riser | push | vinjeta | riser | | |
| 8,6–12 | **Vrhunac** | punch | shockwave, count-up | impact + drop | "Blood sugar peak." | Isplata |
| 12–16 | 1 turn (dip / bedtime / gone) | organ | heat / krivulja | whoosh, blip | 1 kartica | Druga isplata |
| 16–18 | Noćni skok do +24 | wide | ratchet, sunrise | ratchet | | Ritam |
| 18–20 | 4 lampice | | flip | 4 blipa | | Scoreboard |
| 20–25 | End card (5 s) + petlja | | | akord | CTA | Komentar, loop |

Short cut ima **točno jedan** impact (vrhunac). Presuda u singleu je bez udarca.

### 3.3 Compare, LONG (~70 s)

| t (s) | Beat | Kamera (obje strane isti pokret) | VFX | SFX | Tekst | Svrha |
|---|---|---|---|---|---|---|
| 0–0,45 | Teaser | split, oba tijela na trenutku najveće razlike | oba mjerača na vrhu, VS značka pulsira | hit | **"Guess: which one ___?"** (§5) | Pitanje = jaz |
| 0,45–0,95 | Rewind | → usta (oba) | sat unatrag | rewind | | |
| 0,95–3,0 | Gutljaj | usta | pljusak u boji svakog pića | sip L, sip R (pan −0,5 / +0,5, 120 ms razmaka) | Guess red 2: **"Comment A or B before the end."** | Komentar prije kraja |
| 3–10 | Želudac | close | fill + race bar se pojavi (V13) | pour/fizz po strani | po strani 1 kartica | Utrka počinje |
| 10–24 | Krv / vrh A | mid | race bar napreduje, mjerači | riser → impact na vrhu **one strane koja ima vrh** | "Blood sugar peak." / "Barely notices one glass." | Isplata #1 |
| ~24 | Race finish #1 | — | strana koja prva prođe "liniju" dobije oznaku `✓ GONE` / `✓ OUT` (bez trofeja, bez boje pobjede) | `race` ding | | Mini-isplata |
| 30–35 | **Velika najava** | | "Answer at 24 h." | stinger | "Answer at 24 h." | Drži do kraja |
| 35–55 | Srednji trenutci, noć | | scoreboard čipovi (V14) na rubovima, noćni ton | whoosh, ratchet | | Ritam |
| 55–60 | 24 h + lampice | wide | lampice obje strane naizmjence (L1, R1, L2…) | blipovi L/R | | Scoreboard |
| 60–61,5 | **Presuda** | lagani punch | presuda tekst (iz `verdictOf`, ništa drugo), shockwave iza teksta | `verdict` impact + shimmer | "🏆 Water wins: no blood sugar peak…" ili "No clear winner: …" | Isplata pitanja |
| 61,5–69,5 | End card | dim | 2 stupca, CTA | akord | "Did you guess right? 👇" | Komentar |
| zadnjih 0,5 | Petlja → teaser | | | | | Rewatch |

### 3.4 Compare, SHORT (~25 s)
Teaser + guess (0–3 s) → želudac i utrka (3–8) → riser + vrh (8–13) → race finish ili turn (13–17) → noćni skok + lampice (17–19,5) → presuda s impactom (19,5–21) → end card 4 s → petlja.
Guess prompt mora biti ≤ 7 riječi na ekranu ≥ 2,4 s (već u introu 2,4 s).

---

## 4. VFX lista (implementacija, cijena, prioritet)

Nema `postprocessing`/`EffectComposer` u depsima (provjereno u `package.json`: three 0.169, r3f 8.18, drei 9.122). **Ne dodavati bloom pass** (cijena, rizik, GPU). Sve "glow" efekte treba raditi kao 2D aditivne slojeve na projiciranim pozicijama organa (`project()` u `video-cam.ts` već postoji), ili kao `emissive` i opacity u 3D.

| ID | Efekt | Sketch | Cijena | Prioritet |
|---|---|---|---|---|
| V0 | **Teaser + rewind** (2.2) | planer: intro frameovi `m = teaserMin` → ease na 0; overlay: sat crta unatrag, 6 horizontalnih linija `globalAlpha 0,2`, y se pomiče po frameu; kamera: `VideoCam` cue `start = pose(teaser)` pa glide | M | **P0** |
| V1 | Pljusak na prvom gutljaju | canvas 2D: 24 čestice iz projicirane točke usta, kut −160°…−20°, v0 300–600 px/s, gravitacija 1400 px/s², život 0,5 s, radijus 3–7 px, boja `story.color`, `globalCompositeOperation='lighter'`; seeded PRNG po indeksu čestice | S | **P0** |
| V2 | Shockwave prsten (peak, verdict, organ aktivacija) | canvas: krug na projekciji organa, r 20 → 220 px u 0,45 s (easeOutCubic), lineWidth 10 → 1, alpha 0,8 → 0, boja razine (`LIGHT`) | S | **P0** |
| V3 | Puls sjaja organa | 2D radialGradient (r = 1,4 × projicirani radijus organa), `lighter`, alpha 0 → 0,35 → 0 u 0,6 s; u 3D: `glow[organ]` × (1 + 0,4 · pulse); ≤ 1 Hz | S | **P0** |
| V4 | Zoom punch + shake | `stepRig` dobiva kick: `viewH *= 0,92` na peak frameu (opruga ga vraća). Shake: offset kamere `A·e^(−t/0,08)·sin(2π·18t)`, A = 0,006 · viewH, samo 0,22 s, x i y s faznim pomakom; deterministički po frameu | S | **P0** |
| V5 | Count-up broja na mjeraču | `drawGauge`: prikazana vrijednost = lerp(stara, nova, easeOutExpo(0,6 s)), formatirana istim formatterom (raspon za ‰/mmol kao sada); tick SFX po promjeni zadnje znamenke, max 15/s | S | **P0** |
| V6 | `PEAK` žig + mjerač bounce | mjerač scale 1 → 1,15 → 1 (0,35 s, overshoot dopušten samo ovdje), žig `PEAK` 1,4 s, boja razine | S | **P0** |
| V7 | "Up next" čip + velika najava | `drawBodyFrame`: čip ispod titla, alpha in/out 0,2 s, u safe zoni (test) | S | **P0** |
| V8 | Puls krvotoka | three `Points` (60 točaka) uzduž `LiquidRoute` krivulje / krvnog puta (jetra → srce → mozak), pozicija `u = (frame·0,015 + i/60) % 1`, size attenuation, aditivni materijal, opacity ∝ koncentracija tvari | M | P1 |
| V9 | Toplinska mapa mozga | `VIDEO_PALETTE.brain` lerpa ljubičasta (#6f5fd8) → kofein tirkizno-zelena (#3ddc84) / alkohol jantar (#ffb02e) po **normaliziranoj vrijednosti modela** (`at(series, m)/max`), emissive 0,1 → 0,45; nikad bijelo (runda 2) | S | P1 |
| V10 | Fluid fill + mjehurići / pjena | postoji `liquid.stomach`; dodati `Points` mjehuriće u volumenu želuca (gazirano: cola, pivo, `isFizzy` iz proizvoda) koji se dižu 0,2 j/s i nestaju na vrhu; pjena za pivo = svijetliji sloj na vrhu u prvih 3 min | M | P1 |
| V11 | Noćni time-lapse ton | overlay: linearni gradijent #0b1a3a alpha 0,18, ikona mjeseca, sat ">>" svijetli jače; 3D: dim tijela 0,42 → 0,36 | S | P1 |
| V12 | Kinetička tipografija hooka | riječi hooka ulaze s 50 ms staggerom (y +18 px → 0, alpha 0 → 1, 0,18 s); **frame 0 mora imati cijeli hook vidljiv** (thumbnail), pa animacija ide samo na drugi red ili na "settle" u naslov | S | P1 |
| V13 | Race bar (usporedba) | dvije trake ispod imena (u safe zoni, y < 435 postojećeg zaglavlja ili umjesto čipa): napredak = 1 − preostalo/početno za odabranu metriku (§4.1); ciljna linija; kad strana dođe do 0, oznaka `✓ OUT` | M | **P0 za compare** |
| V14 | Scoreboard čipovi | 4 mala kruga po strani (energy/heart/water/brain) koji se pale kad sustav prvi put postane žut/crven (iz `analysis.systems[].levels`), blip | S | P1 |
| V15 | Presuda s udarcem | end card: tekst presude scale 1,25 → 1 (0,3 s), shockwave iza, 12 iskri ako postoji 🏆 (nikad za alkohol, jer `verdictOf` to ne daje) | S | **P0 za compare** |
| V16 | Vinjeta za riser | radijalni gradijent rub alpha 0 → 0,25 kroz 1,6 s, pa natrag | XS | P1 |
| V17 | Brzinske linije u glide-u | 8–12 vertikalnih poteza alpha ≤ 0,12 kad `rate > 30 min/s` | XS | P2 |
| V18 | Lampice flip na 24 h | lampice end carda ulaze jedna po jedna (0,35 s), scale-pop | S | P1 |
| V19 | "Sunrise" | gradijent topli 0,4 s na 07:00 izlazu iz noći | XS | P2 |

**Sigurnost i kvaliteta za sve VFX:** ≤ 3 bljeska/s; shake ≤ 0,6 % visine; ništa ne smije prekriti tekst ni izaći iz safe zone za tekst (proširiti postojeći `logText` test na čipove i žigove); čestice su deterministične; feed 4:5 dobiva iste efekte skalirane.

### 4.1 Metrika utrke (usporedba): samo iz modela
Bira se prva koja postoji za **obje** strane:
1. **"Out of your stomach"**: `whereGauge` stomach količina → 0 (cola vs voda: voda pola za ~13 min, cola pola nakon ~30 min).
2. **"Out of your blood"**: kofein/alkohol pod pragom mjerača.
3. Šećerni porast natrag na početak.

**Pravilo za alkohol:** utrka se prikazuje, ali ciljna oznaka je neutralna (`✓ OUT`), bez trofeja, zelene boje "pobjede" i riječi "wins". Ako je jedna strana alkohol, uz utrku stoji kartica **"Faster out ≠ better for you."** (≤ 5 riječi). Presuda je uvijek i samo `verdictOf`.

---

## 5. SFX lista (WebAudio recepti, bez licenci)

Sve se renderira u `OfflineAudioContext` (postojeći `renderSoundtrack`). Arhitektura v2:
- **Dva busa:** `musicBus` (pad, beat, arp) i `sfxBus`. Ducking je automatizacija gaina `musicBus` iz cue liste (deterministički sidechain): −6 dB za 0,08 s attack i 0,4 s release na `impact`/`verdict`, −3 dB tijekom `sip`.
- **Tempo:** 120 BPM (TikTok: > 120 BPM često daje viši VTR, nalaz 2). Polovični takt (half-time, samo kick na 1) u mirnim/noćnim dijelovima. Puni groove od gutljaja do vrhunca.
- **Razine** su vršni gain prije normalizacije, u istoj skali kao postojeći kod (kick 0,42, whoosh 0,16).
- **Normalizacija:** cilj **−14 LUFS** integrirano (sada −16,3), true peak ≤ −1 dBTP. Postojeći RMS-cilj podići s 0,13 na ~0,165 i **mjeriti ffmpeg `ebur128=peak=true`** u QA, uz toleranciju ±1 LU. Zamijeniti `tanh` limiter lookahead limiterom (5 ms lookahead, max-hold po bloku), jer se impacti inače izobliče.

| ID | Zvuk | Recept | Gain | Kad |
|---|---|---|---|---|
| A1 | **hit** (frame 0) | sine 55 Hz, env 0 → 1 u 4 ms, exp decay 0,5 s + šum burst lowpass 1,2 kHz, 60 ms | 0,45 | t = 0 (zvuk od prvog framea) |
| A2 | **rewind** | sawtooth 200 → 1600 Hz exp ramp 0,45 s kroz bandpass Q 2 koji prati ×1,5; + šum highpass 3 kHz s AM 30 → 60 Hz (LFO square); gain 0,6 → 0 na kraju; na kraju "tape-catch" klik (10 ms šum) | 0,12 | `rewind` |
| A3 | **canOpen** (cola, pivo) | klik (2 ms šum, highpass 2 kHz, 0,3) + "pssht": šum bandpass 4,5 kHz Q 0,8, env 5 ms attack, exp decay 0,35 s, frekvencija pada 4,5 → 3 kHz | 0,14 | `sip` − 0,25 s, samo gazirana pića |
| A4 | **sip / gulp** | 2 gutljaja razmaka 0,32 s: sine 320 → 110 Hz exp 0,09 s + bandpass šum 700 Hz Q 3, 40 ms; env attack 5 ms, decay 0,12 s; drugi gutljaj −10 % pitch | 0,22 | `sip`; za hranu "bite": šum bandpass 2,2 kHz, 3 zrna po 25 ms + nizak "thud" 140 Hz |
| A5 | **pour** | šum lowpass 1,4 kHz, AM LFO 9 Hz (sine, dubina 0,6) = "glug", gain fade-in 0,2 s, trajanje = punjenje želuca (≤ 2,5 s) | 0,05 | nakon `sip` |
| A6 | **fizz** | 40–120 zrna/s (seeded Poisson) po 3–8 ms, šum highpass 5 kHz, random pan ±0,6, gustoća exp pada τ = 4 s | 0,03 po zrnu | gazirano u želucu |
| A7 | **whoosh** (postojeći) | zadržati; dodati reverse varijantu (sweep 2,8 k → 350 Hz) za odmak kamere | 0,16 | `move` |
| A8 | **tick** (postojeći) | zadržati za `stop` | 0,07 | `stop` |
| A9 | **UI blip** | sine 880 → 1320 Hz lin 60 ms, env 3 ms / 90 ms, + oktava gore 0,3 | 0,06 | promjena mjerača, `next` čip, lampice (pitch: zeleno 1320, žuto 1047, crveno 784) |
| A10 | **count tick** | sine 1800 + n·40 Hz (raste po koraku), 25 ms | 0,03 | po koraku count-upa, max 15/s |
| A11 | **riser** | (a) šum bandpass 300 → 6 kHz exp, Q 1 → 4; (b) 2 detunirana saw-a 220 → 880 Hz exp; obje grane gain 0,0001 → 1 exp kroz 1,6 s; (c) snare roll: šum 20 ms udarci, razmak 1/8 → 1/32 takta; sve stane točno na `peak` | 0,10 | `riser` |
| A12 | **impact / drop** | sub: sine 60 → 35 Hz exp 0,6 s, attack 3 ms; tijelo: šum lowpass 800 Hz, 0,15 s; rep: `ConvolverNode` s generiranim IR (eksp. decay šum 1,2 s, seeded); istovremeno kick + puni akord na `musicBus` | 0,55 sub, 0,25 tijelo, 0,12 rep | `peak`, `verdict` |
| A13 | **heartbeat** | lub: sine 55 Hz 70 ms + lowpass šum 150 Hz; dub 0,14 s kasnije, −30 %; ponavljanje 1,1 s (≈ 55/min, mirno, **ne sugerira ubrzan puls**) | 0,18 | **samo** dok je sustav `heart` razine ≥ 1 u modelu (npr. pivo noću: "your heart rests much less"). Za kofein **NE** ("Your pulse doesn't change") |
| A14 | **ratchet** | klik 4 ms (šum highpass 3 kHz) + sine 2,2 kHz 8 ms, gustoća = min(12, rate/10) /s | 0,025 | noćni time-lapse |
| A15 | **night lowpass** | `musicBus` → BiquadFilter lowpass 18 kHz → 900 Hz kroz 0,8 s, natrag na izlazu | — | `night` |
| A16 | **sunrise** | šum highpass sweep 200 → 8 kHz 0,5 s + gornji akord (major 9) 1 s | 0,06 | izlaz iz noći |
| A17 | **stinger "next"** | 2 note (kvinta gore), triangle, 0,12 s razmak | 0,05 | velika najava |
| A18 | **race ding** | sine 1568 + 2349 Hz, decay 0,8 s, pan na stranu | 0,07 | `race` |
| A19 | **shimmer** (presuda) | 6 sine nota arpeggio (A dur 9), 40 ms razmak, decay 1,2 s, + šum highpass 8 kHz 0,6 s | 0,05 | `verdict` iza impacta |
| A20 | **tape stop** (opcija za petlju) | glazba renderirana u buffer pa `AudioBufferSourceNode.playbackRate` 1 → 0,3 u 0,4 s; zahtijeva 2-pass render | — | P2 |

**Glazba v2:**
- isti A-mol, ali 120 BPM;
- groove ulazi na `sip`, half-time u noći;
- na `peak` 1 takt "dropa" (kick na svaku četvrtinu + bas oktava);
- na end cardu akord (postojeći).

**Opcija "Sound effects only"** (P1, treći izbor uz "Our music" / "None"): SFX bus bez glazbe. Vlasnik u TikTok editoru doda trending pjesmu, a efekti (gutljaj, impact) ostaju.

**Bez zvuka mora raditi:** svaki SFX ima vizualni par (impact ↔ shockwave/punch, riser ↔ vinjeta, rewind ↔ sat unatrag, sip ↔ pljusak). Nijedna informacija nije samo u zvuku (nalaz 4).

---

## 6. Hook formule po slučaju (samo činjenice modela)

Izvor činjenica: `video-plan.fixtures.json` (tekst poglavlja), `verdict.test.ts` i uzorci. **Brojevi u hooku moraju se računati iz analize u trenutku izvoza**, ne hardkodirati. Primjer: espresso "Going to bed" ovisi o vremenu pića (fixture 57 mg). Dolje su vrijednosti iz fixturea i uzoraka, kao primjer.

**Formule** (red 1 = broj ili tvrdnja, red 2 = obećanje / open loop; ≤ 7 riječi svaki):
- **F1 broj + "watch":** "{broj} {stvar}." / "Watch where it goes."
- **F2 vrijeme + iznenađenje:** "Still in you at {sat}."
- **F3 mit / pitanje:** "{uvjerenje}?" / "Watch inside." (odgovor u videu)
- **F4 race (usporedba):** "Guess: which one {metrika}?"
- **F5 kontraintuitivno:** "{neočekivana činjenica iz modela}."

| Slučaj | Hook A (preporuka) | Hook B (A/B test) | Teaser frame | Činjenica u modelu |
|---|---|---|---|---|
| **Cola** | "9 teaspoons of sugar." / "Watch where it goes." | "Hungry again 75 minutes later?" / "Here's why." | šećerni vrh +0:20 | "35 g of sugar (about 9 teaspoons)"; "The sugar dip … Many people feel hungry again around now" (75 min) |
| Cola (F3, komentari) | "Does cola sugar turn into fat?" | — | jetra +3:00 | "Less than 1% becomes fat right away." Mora biti doslovno "right away", u kartici. |
| **Espresso** | "One espresso." / "Still in you at bedtime." | "Why coffee sends you to the toilet." | kofein vrh +0:43 | "About {X} mg of caffeine is still in you as you go to bed"; "In about 1 in 3 people coffee makes the lower bowel start moving within minutes" → hook B mora reći "1 in 3": **"Coffee sends 1 in 3 to the toilet."** |
| **Pivo ×3 kroz 2 h** | "3 beers tonight." / "Still in your blood at 07:00." | "Coffee won't sober you up." / "Watch why." | vrh alkohola +2:09 | "07:00 … still has about 0.05–0.13 ‰ … a breath test can be positive. Don't drive."; "Sleep, coffee, water or fresh air don't speed it up." Ton je upozorenje, nikad slavlje. |
| **Pizza (cijela)** | "A whole pizza: 2572 kcal." / "Watch it for 24 hours." | "24 hours later, only 2% is out." | želudac pun +3:46 (pola tek nakon ~226 min) | "half has moved on after about 226 minutes"; "2% has left your body so far"; "about 29 hours from mouth to toilet" |
| **Kebab** | "One kebab, hour by hour." / "Watch inside your body." | "Still in your stomach at +2:44." | želudac +2:44 | "half has moved on after about 164 minutes"; "A big meal: many people feel sleepy about 1.5 hours later, **whatever the meal was**". Zato NE "kebab makes you sleepy". |
| **Burger + krumpirići + cola** | "The cola races ahead." / "Watch your stomach." | "Burger + cola: a lower sugar peak?" | želudac +0:57 (cola izašla, burger čeka) | "Two speeds: the cola runs ahead…"; "Your peak is about 21% lower than after the cola alone". Uz hook B obavezna kartica **"Lower peak, but 833 kcal."** (bez implicirane "zdravije") |
| **Espresso vs pivo** | "Guess: which one ruins your sleep?" → **ne**, nije točno za sva vremena. Koristiti: **"Guess: which one is still in you tomorrow?"** | "Espresso vs beer at {sat}." / "Guess the verdict." | oba na vrhu | Uzorak: alkohol "gone" ~+3 h, kofein još ~5 mg na +22 h. Presuda ovisi o satu: 16:00 → "🏆 Espresso wins: no alcohol, 213 fewer kcal."; 22:00 → "No clear winner: Beer brings alcohol; Espresso brings caffeine at bedtime." Utrka "Out of your blood" pokazuje pivo brže → obavezna kartica "Faster out ≠ better for you." |
| **Cola vs voda** | "Guess: which leaves your stomach first?" | "Does cola hydrate you?" / "Watch both." | oba želuca puna | voda: "half of it moves on within about 13 minutes"; cola: "half is still here after about 30 minutes. Water would leave twice as fast."; cola kartica: "a can of cola hydrates you about as well as the same amount of water"; presuda "🏆 Water wins: no blood sugar peak, 139 fewer kcal." Paziti: uzorak ima 250 ml vode vs 330 ml cole. Za "hydrate" hook koristiti isti volumen ili ga ne koristiti. |

**Implementacija:** `hookFor(analysis, kind)` vraća `{ line1, line2, teaserMin }` iz whitelista formula. Test: svaki broj u hooku mora postojati u tekstu poglavlja istog videa ili u vrijednosti mjerača na teaser minuti (isti formatter). Za alkohol se ne smiju pojaviti riječi "best/wins/better/healthy/cure/hangover".

**Opis posta (share dialog, za search i komentare):** prvi red ponavlja hook i ključne riječi:
- "What happens in your body after one can of cola (24 h)" + 1 pitanje + izvori/link.
- Za usporedbu: "Espresso vs beer: what happens inside you in 24 hours. Did you guess right? 👇".

---

## 7. Komentari, share, CTA (iskreni okidači)

**End card CTA** (≤ 7 riječi, rotirati, A/B):
- Single: "Which food should we test next? 👇" (postojeći) · "What should we put inside next? 👇" · "Send this to your cola friend." (sends per reach, nalaz 5; samo za ne-alkoholne teme)
- Compare: "Did you guess right? 👇" · "A or B? Tell us before the answer." (u guess introu)
- Alkohol: "Which drink should we test next? 👇". Nikad "tag your drinking buddy".

**Pinned comment** (vlasnik ga ručno pina; aplikacija ga predlaže u share dialogu):
- Cola: "How many teaspoons did you guess before the video? 🥄 Sources + try your own weight: inside24h…/food/cola"
- Espresso: "What time is your last coffee? ☕ We'll simulate the most common answer."
- Pivo: "Myth check: does coffee or a cold shower sober you up? (No: only time does.) Simulation for a typical body, not medical advice."
- Pizza / kebab: "Guess how many hours food takes mouth to toilet? Answer: typically ~29 h (14–58 h is normal)."
- Meal: "Should we try the burger WITHOUT the cola next?"
- Espresso vs pivo: "Did the answer surprise you? The verdict changes with the time of day. Try it at 22:00 in the app."
- Cola vs voda: "Team cola or team water? 💧"

Okidači su istiniti, ne izmišljaju kontroverzu, ne tvrde ništa medicinsko izvan modela i ne potiču konzumaciju.

---

## 8. Platforme (sažetak za vlasnika)

| Platforma | Cut | Tekst / titl | Zvuk |
|---|---|---|---|
| TikTok | long 68–75 s (60 s+), test short | burned-in + TikTok auto-captions uključiti | trending zvuk u editoru: opcija "Sound effects only" + trending pjesma tiho (~10–20 %) |
| YouTube Shorts | short 25–30 s prvo, A/B long | burned-in | naša glazba (Shorts trending audio manje važan) [OPINION] |
| Instagram Reels | short ili long (do 3 min) | burned-in, opis s ključnim riječima | trending audio pomaže u Reels feedu [UNVERIFIED]; opcija "SFX only" |
| Facebook Reels | long | burned-in | naša glazba |
| X | short, native upload + thread s izvorima | burned-in (autoplay je nijem) | naša glazba |

Safe zone je riješena (polish §3). Novi elementi (čipovi, žigovi, race bar, guess) moraju proći isti `logText` test.

---

## 9. Checklist iskrenosti (blokira objavu ako nije zeleno)

1. **Svaki broj na ekranu** (hook, kartica, mjerač, čip, presuda) dolazi iz modela istog izvoza. Hook prolazi test "broj postoji u poglavlju ili na mjeraču".
2. **Brojevi koji se mijenjaju sa satom** su samo na mjeraču (pravilo iz runde 2), a count-up završava točno na vrijednosti mjerača.
3. **Alkohol nikad ne "pobjeđuje"**:
   - presuda je samo `verdictOf` (testovi u `verdict.test.ts`),
   - race oznaka `✓ OUT` je bez trofeja i bez zelene,
   - uz utrku s alkoholom ide kartica "Faster out ≠ better for you.",
   - nema iskri ni "celebration" efekta za alkoholnu stranu,
   - nema "best/wins" u hooku za alkohol.
4. **Alkohol je upozoravajući**: "Don't drive." kartice iz modela ostaju u long cutu. Planer ih ne smije izbaciti kad postoji trenutak "Next morning" (test). Nema ljudi koji piju, nema "hangover cure".
5. **Heartbeat SFX** samo kad je sustav `heart` ≥ 1 u modelu, a tempo nikad ne sugerira ubrzan puls. Kofein: model kaže "Your pulse doesn't change".
6. **Hook ne smije generalizirati** ono što model kaže općenito ("sleepy after a big meal, whatever the meal was"): nikad "X makes you sleepy".
7. **Kontraintuitivne tvrdnje** imaju uvjet uz sebe: "right away" (fruktoza → mast), "1 in 3 people" (kolon), "lower peak, but {kcal}" (meal), "about as well as the same amount" (cola hidracija).
8. **"Simulation for a typical body · not medical advice"** ostaje na svakom frameu (sitni tisak) i na end cardu u safe zoni. Atribucija BodyParts3D CC BY 4.0 ostaje.
9. **Bez bljeskanja** > 3/s, shake ≤ 0,6 % visine (WCAG 2.3.1).
10. **Bez tuđih brendova u kadru** (logotipi), samo generička imena kad je moguće ("cola").
11. **Raspon umjesto točke** gdje model daje raspon (‰, mmol/L). Count-up ide na raspon (animira se gornja granica, donja se prikaže na kraju) ili se ne radi count-up za raspone (sigurnija opcija).

---

## 10. Rangirani plan implementacije (za coding agenta)

Svaki korak:
- backup (`backups/<timestamp>-video4/`),
- testovi (`npx vitest run`, `npx tsc --noEmit -p .`),
- render 16 uzoraka (scratchpad `video2/render.cjs`) + kontakt listovi + `ebur128`.

Ništa se ne briše. Stari putevi ostaju iza flaga dok vlasnik ne potvrdi.

| Rang | Posao | Datoteke | Gotovo kad |
|---|---|---|---|
| 1 | **Cue v2** (2.1): novi tipovi + `data`, planer emitira `teaser/rewind/sip/riser/peak/next/night/lights/verdict/guess/race` | `video-plan.ts`, testovi | test: cue na frameu ± 0; riser = peak − 1,6 s; ≤ 2 impacta/video |
| 2 | **Audio v2**: 2 busa, ducking, 120 BPM, A1–A12 + A14–A19, −14 LUFS ±1, TP ≤ −1 dBTP, lookahead limiter | `video-audio.ts` | ffmpeg ebur128 na 16 videa; nema klipanja; SFX čujni na mobitelu |
| 3 | **Teaser + rewind hook** (2.2, V0) + `hookFor` (§6) + test brojeva u hooku | `video-plan.ts`, `share.ts`, `AppV4.tsx` (hook), `VideoCam.tsx` | frame 0 = vrhunac s hookom; petlja vraća na njega |
| 4 | **Peak paket** (2.5): V2, V4, V5, V6, V16 + A11/A12 | `share.ts`, `video-cam.ts`/`VideoCam.tsx`, `video-body.ts` | punch/shake deterministički; count-up završava na vrijednosti mjerača |
| 5 | **Mikro-beatovi** (2.3) + V3 puls | `video-plan.ts`, `share.ts`, `video-body.ts` | test: max razmak vizualnih događaja ≤ 3,2 s |
| 6 | **Open loops** (2.4, V7) | `video-plan.ts`, `share.ts` | čip u safe zoni; velika najava na 45–55 % |
| 7 | **Compare igra**: guess intro, V13 race bar (§4.1), V15 presuda s udarcem, pravila za alkohol | `share.ts` (`drawSplitFrame`, `drawSplitOutro`), `AppV4.tsx` (cmp overlay), `CompareVideo.tsx` | test: alkohol nikad nema trofej / ✓ zeleno; "Faster out ≠ better for you." prisutno |
| 8 | **Prvi gutljaj**: V1 pljusak + A3/A4/A5 | `share.ts`, `video-audio.ts` | vidljivo u prvoj sekundi |
| 9 | **Noć**: V11 + A14/A15/A16 | `share.ts`, `video-audio.ts` | ton i lowpass simetrično ulaze i izlaze |
| 10 | **24 h lampice flip** (V18) + blipovi | `share.ts` | |
| 11 | **Opcija "Sound effects only"** | `AppV4.tsx`, `Compare.tsx`, `video-audio.ts` | 3 opcije zvuka |
| 12 | **Mozak heat** (V9), **mjehurići/pjena** (V10), **krvotok** (V8) | `video-body.ts`, `CompareVideo.tsx`, `scene/*` | bez bijelog mozga; performanse snimanja nepromijenjene ±10 % |
| 13 | **Share dialog**: opis posta s hookom i ključnim riječima + prijedlog pinned commenta (§7) | `AppV4.tsx` | |
| 14 | P2: V17, V19, A20 tape stop, kinetički hook (V12) | | |

**QA prije predaje vlasniku** (proširuje postojeće):
- 0 grešaka u konzoli, 0 crnih frameova, nb_frames = trajanje × 30;
- −14 ±1 LUFS, TP ≤ −1 dBTP;
- kontakt listovi svakih 1 s za prvih 5 s (hook) i oko vrhunca;
- sva pravila iz §9 kao testovi gdje je moguće;
- jedan pregled bez zvuka (priča razumljiva?) i jedan sa zvukom na mobitelu ako je moguće.

**Mjerenje nakon objave** (vlasnik, tjedno):
- 3 s hold / "viewed vs swiped away",
- prosječni % gledanja,
- gdje pada krivulja (je li pad prije vrhunca?),
- sends i komentari.

Jedna varijabla po tjednu (hook A vs B iz §6).
