# Next-level format: video + web (istraživanje, 2026-11-22)

Autor: research agent (Opus). Samo istraživanje, nijedna datoteka koda nije dirana. Nadovezuje se na `video-creative-spec-2026-10-24.md` (hook, vrhunac, petlje, zvuk) i `competitors.md`. Ovdje se ne ponavlja ono što je tamo već riješeno, nego se dodaje **sloj korisnosti**: zašto se netko vraća, sprema i dijeli.

Oznake dokaza (iste kao u ranijim izvješćima):
- **[PRIMARY]**: službena stranica platforme ili regulatora, ili recenzirana studija.
- **[SECONDARY]**: medij ili analiza koja citira primarni izvor.
- **[UNVERIFIED]**: blog ili vendor bez metodologije.
- **[OPINION]**: moja preporuka ili zaključak.

Jezik: obrazloženje je na hrvatskom, a primjeri teksta na ekranu su na engleskom (kao u aplikaciji).

---

## 0. Dijagnoza u jednoj rečenici

"Hrana prođe kroz tijelo i malo informacija" je **opis bez pitanja**. Gledatelj nema hipotezu koju bi provjerio, nema ulog za sebe i nema odluku koju bi donio na kraju. Najbolji primjeri iz žanra ([Zack D. Films](https://danielrusnok.substack.com/p/how-a-faceless-channel-engineered), NYT "You Draw It", Ciechanowski, ZOE) uvijek rade isto: **postave pitanje, natjeraju te da pogodiš, pokažu mehanizam i daju ti nešto što možeš primijeniti**. Prijedlog je da svaki video i svaka stranica hrane imaju istu kralježnicu:

> **Pitanje → tvoj pogodak → mehanizam (vidljiv u tijelu) → broj koji te iznenadi → "što to znači za tebe" → jedna akcija → presuda/scorecard.**

To je format koji se može generirati automatski za bilo koju hranu, jer svaki korak čita iste podatke (nutrijenti + model).

---

# DIO A: VIDEO

## A1. Što platforme stvarno nagrađuju (mehanizmi, ne vibe)

| # | Nalaz | Dokaz |
|---|---|---|
| 1 | YouTube Shorts ima metriku **"Viewed vs. swiped away"**, a to je zapravo test hooka. Službenih benchmarka nema. | [PRIMARY] [YouTube Help](https://support.google.com/youtube/answer/12220281); [SECONDARY] [1of10](https://1of10.com/blog/youtube-shorts-analytics/), [Buffer](https://buffer.com/resources/the-creators-guide-to-youtube-shorts-analytics) |
| 2 | Od 31. 3. 2025. Shorts broji view na svaki start i replay. "Engaged views" se broje odvojeno, bez loopova. Loop dakle povećava broj, ali sam po sebi ne dokazuje kvalitetu. | [SECONDARY] [vidIQ](https://vidiq.com/blog/post/double-youtube-watch-time-looping-shorts), [vidIQ algoritam](https://vidiq.com/blog/post/youtube-shorts-algorithm/) |
| 3 | Instagram (Mosseri, 2025) kao glavne signale navodi **watch time, likes per reach i sends per reach**. Sends (DM dijeljenje) su najvažniji za doseg izvan pratitelja. | [SECONDARY] [Social Media Today](https://www.socialmediatoday.com/news/instagram-shares-algorithm-2025/738034/), [Fanpage Karma](https://www.fanpagekarma.com/insights/instagram-reels-algorithm/), [t3n](https://t3n.de/news/reels-instagram-bewerten-mosseri-1744320/) |
| 4 | TikTok: watch time i completion su temelj. Shares i saves sve više nose težinu kao signal da je video koristan. Točne težine nisu javne. | [SECONDARY/UNVERIFIED] [Buffer](https://buffer.com/library/tiktok-algorithm/), [Hootsuite](https://blog.hootsuite.com/tiktok-algorithm/), [Sendible](https://www.sendible.com/insights/how-does-tiktok-algorithm-work) |
| 5 | Zack D. Films, "How Stitches Work": 253 M pregleda, 31 s, oko 1,4 pregleda po gledatelju. Mehanizam je da prva sekunda postavi pitanje ("ugovor"), a video **završi točno kad je pitanje odgovoreno**. Kanal ima oko 29 M pretplatnika i oko 81 mlrd pregleda. | [SECONDARY] [Rusnok analiza](https://danielrusnok.substack.com/p/how-a-faceless-channel-engineered); [vidIQ stats](https://vidiq.com/youtube-stats/channel/@zackdfilms/) |
| 6 | Znatiželja (information gap) poboljšava pamćenje ciljane informacije, ali i usputnog sadržaja naučenog u tom stanju (dopamin i hipokampus). Najjači je **mali, jasan gap**, a ne "nećeš vjerovati". | [PRIMARY] [Gruber et al. 2014, Neuron](https://pmc.ncbi.nlm.nih.gov/articles/PMC4252494); [PACE okvir](https://pmc.ncbi.nlm.nih.gov/articles/PMC6891259); Loewenstein [CMU PDF](https://www.cmu.edu/dietrich/sds/docs/loewenstein/WickCandleLearning.pdf) |
| 7 | Edukativni video: kraći je angažiraniji, brz i entuzijastičan govor je angažiraniji, a sadržaj treba **segmentirati**. Segmentiranje i signalling imaju umjerenu podršku i za učenje i za angažman. | [PRIMARY] [Guo, Kim, Rubin 2014](https://pg.ucsd.edu/publications/edX-MOOC-video-production-and-engagement_LAS-2014.txt); [PMC9377621](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9377621/) |
| 8 | Ispravljanje mitova: struktura **fakt → mit (jednom) → zašto je pogrešan → fakt**. Mit se ne ponavlja više puta jer se tako učvrsti. | [PRIMARY] [Debunking Handbook 2020](https://sciencelearning.umd.edu/files/2020/10/DebunkingHandbook2020.pdf) |
| 9 | Prikaz "kalorije kao minute aktivnosti" (PACE) smanjio je odabrane kalorije za oko 65 kcal po obroku. Jedna starija meta-analiza nije našla značajan učinak. To je dobar format usporedbe, ali s oprezom (vidi rizike). | [PRIMARY] [Daley et al. JECH](https://pubmed.ncbi.nlm.nih.gov/31822568/); [Seyedhamzeh 2018](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6137736/) |
| 10 | Kurzgesagt uz svaki video objavljuje **sources sheet** i koristi stručne recenzente. Kad je tema sporna, izvori su i na ekranu. To je signal povjerenja koji se isplati kopirati. | [PRIMARY] [kurzgesagt.org/youtube](https://kurzgesagt.org/youtube/) |

## A2. Hookovi za tijelo i hranu (tipovi koji se mogu generirati)

Svaki tip se generira iz podataka. Generator bira tip s najvećim "surprise score" (vidi A8).

| Tip | Predložak (EN, na ekranu) | Podaci | Zašto radi |
|---|---|---|---|
| **Ulog + "ti"** | "Your liver is about to work 3 hours for this." | trajanje alkohola/fruktoze u jetri | Osobni ulog, plus otvoreno pitanje "zašto 3 sata?" |
| **Iznenađujući broj** | "This 'healthy' smoothie = 9 sugar cubes." | g šećera / 4 g po kocki | Konkretna slika, odmah usporediva |
| **Pogodi** | "Guess: how long is this coffee still in you at midnight?" (3 opcije) | poluživot kofeina, vrijeme | Gledatelj se obveže na pogodak, pa ostaje do odgovora (NYT You Draw It mehanizam) |
| **Mit** | "'Beer before liquor'? Your liver doesn't care. Here's what does." | model BAC | Ispravljanje mita uz dokaz (Debunking Handbook) |
| **Versus** | "Banana vs. energy bar: same kcal, opposite curves." | dvije krivulje glukoze | Utrka, jasan pobjednik, poziv na komentar |
| **Vrijeme** | "Same croissant at 8 am vs 11 pm." | cirkadijalni modifikator, san | Neočekivana varijabla, osobna akcija |
| **Kontraintuitivno** | "Diet cola: 0 sugar, but watch the hunger line." | sladila, oznaka dokaza B/C | "Nisam znao", uz pošten prikaz nesigurnosti |
| **Skriveni trošak** | "The real cost of this pint: 47 min of REM." | model sna (raspon) | Gubitak je jači motiv od dobitka |

Pravila [OPINION, temeljeno na #5 i #6]:
- Pitanje mora biti izgovoreno ili napisano **do 1,0 s**, a vizualni udarac (zoom u organ ili broj) do 1,5 s.
- Odgovor na hook ide u **posljednje 2–3 s**, prije presude. Tako je ugovor ispunjen i nema razloga za swipe prije kraja.
- Hook nikad ne smije biti strah bez akcije ("this is killing you"). Platforme to sve češće deprioritiziraju, a uz to ruši povjerenje.

## A3. Gustoća informacija: "ljestve" umjesto prolaza

Glavni problem je što svaka kartica sada nosi **jedan fakt na istoj razini**. Prijedlog je da svaki "beat" (4–7 s) bude ljestva od 4 prečke:

1. **Uzrok** (vidljiv u 3D): "Fructose goes straight to the liver."
2. **Učinak** (broj ili krivulja): "Liver turns ~X g into fat-building signals." (oznaka B/C)
3. **So what** (za tebe): "That's why soda doesn't fill you up like the same kcal of bread."
4. **Akcija** (jedna): "Drink it with a meal, not alone."

Gustoća [OPINION, temeljeno na Guo 2014 i segmentiranju]:
- **Short 30–45 s**: hook, 3 beata, presuda. To je oko 1 novi broj svakih 4–6 s i najviše 5 brojeva ukupno.
- **Long 60–90 s**: hook, 5–6 beatova, "plot twist" (pairing ili timing), presuda i cheat-sheet.
- Vizualni događaj (rez, zoom, brojka ili krivulja) mora se dogoditi **svake 2–3 s**. Ritam govora neka bude oko 160–180 riječi u minuti (Kokoro speed oko 1,05–1,1 ako zvuči prirodno). "Brzo i entuzijastično" ima podršku u Guo 2014.
- Svaki beat završi **mikro-petljom** prema sljedećem ("…but the real surprise is at hour 6").

## A4. Osobna relevantnost i svakodnevne usporedbe

- **Tijelo**: masa i spol mijenjaju BAC (Widmark), a veličina porcije mijenja sve. U videu se to pokaže kao **"3 bodies" strip**: 55 kg, 75 kg i 95 kg jedan do drugog, svaki sa svojim BAC/kofein brojem. Gledatelj se nađe u jednom od njih, i to je razlog za komentar "I'm the 55 kg one" [OPINION].
- **Doba dana**: kofein u 8 h prema kofeinu u 16 h. Drake 2013 je pokazao da 400 mg 6 h prije spavanja skraćuje san za više od 1 h, a ispitanici to nisu ni primijetili. [PRIMARY] [PMC3805807](https://pmc.ncbi.nlm.nih.gov/articles/PMC3805807). Poluživot je oko 5 h, s rasponom 1,5–9,5 h (pušenje ga ubrzava, oralni kontraceptivi i trudnoća ga produljuju). [PRIMARY] [NBK223808](https://www.ncbi.nlm.nih.gov/books/NBK223808/), [Grzegorzewski 2021](https://frontiersin.org/articles/10.3389/fphar.2021.752826/full)
- **S čime jedeš**: redoslijed hrane (povrće i protein prije ugljikohidrata) snizio je iAUC glukoze za oko 39 % u predijabetesu. [PRIMARY] [PubMed 30101510](https://pubmed.ncbi.nlm.nih.gov/30101510/); [Shukla 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4876745)
- **Hodanje nakon jela**: lagano hodanje snižava postprandijalnu glukozu i inzulin u usporedbi sa sjedenjem. [PRIMARY] [Buffey 2022](https://pubmed.ncbi.nlm.nih.gov/35147898/). Hodanje odmah nakon obroka djeluje jače nego kasnije. [PRIMARY] [PMC10036272](https://pmc.ncbi.nlm.nih.gov/articles/pmc10036272)
- **Usporedbe** (generator ima tablicu "everyday anchors"):
  - šećer: kocke od 4 g ili čajne žličice;
  - kcal: minute hoda, stepenice ili "km bicikla", uz oprez zbog poremećaja prehrane (A10);
  - kofein: "1 espresso ≈ 63 mg", "EFSA single-dose comfort ≈ 200 mg";
  - alkohol: "standard drinks", "hours until ~0", s eliminacijom oko 0,15 g/L/h (raspon 0,10–0,25). [PRIMARY] [Jones 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6474506)
  - voda: čaše od 250 ml;
  - vlakna: "% of the 25–30 g day".

## A5. "Nisam znao": iznenađenja i mitovi po klasi hrane

Generator treba **bazu mitova po klasi** (svaki mit ima oznaku dokaza i izvor). Primjeri:

| Klasa | Mit / iznenađenje | Smjer |
|---|---|---|
| Alkohol | "Coffee sobers you up" | Ne, BAC pada istom brzinom. Osjećaš se budnije, a to je opasna kombinacija. |
| Alkohol | "A nightcap helps sleep" | Brže zaspiš, ali REM je potisnut već kod niže doze (≤0,5 g/kg, oko 2 pića). [PRIMARY] [Gardiner 2025 meta](https://research.monash.edu/en/publications/the-effect-of-alcohol-on-subsequent-sleep-in-healthy-adults-a-sys/); [Ebrahim 2013](https://pubmed.ncbi.nlm.nih.gov/23347102/) |
| Kofein | "I can drink coffee at 5 pm and sleep fine" | Kod Drakea su ispitanici subjektivno spavali dobro, ali objektivno je san bio kraći. |
| Voće/sok | "Juice = fruit" | Isti šećer, ali bez vlakana, pa brži vrh i manja sitost. |
| Gazirano | "Diet soda spikes insulin like sugar" | Dokazi su miješani (oznaka B/C). Pošteno je reći "mostly no, here's what we don't know". |
| Kruh | "Brown = whole grain" | Boja nije vlakno. Gledaju se grami vlakana. |
| Voda | "8 glasses a day for everyone" | Potreba ovisi o klimi, aktivnosti i hrani. Hrana pokriva oko 20 %. |
| Glukoza | "Every spike is dangerous" | Kod zdravih ljudi kratki vrhovi nisu povezani s dugoročnom štetom. Važan je kontekst. [SECONDARY] [Science News](https://www.sciencenews.org/?p=3158468), [WebMD](https://www.webmd.com/diabetes/news/20231212/continuous-glucose-monitors-for-those-without-diabetes) |

Zadnji red je važan: **anti-hype je i sam iznenađenje**. Kanal koji kaže "relax, this spike is normal" razlikuje se od glukoza-influencera i gradi povjerenje [OPINION].

## A6. Serijski format za povratne gledatelje

Potpis formata (uvijek isti, mijenja se samo hrana) [OPINION, temeljeno na Kurzgesagt i Zack D. dosljednosti]:

1. **Cold open s pogotkom** (0–2 s): "Guess the peak." Na ekranu je ljestvica za pogodak.
2. **Journey** (3D): 3 do 6 "stanica" s ljestvama iz A3.
3. **Plot twist** (oko 70 % trajanja): "Now watch what happens if you eat it *after* a salad / walk 10 min / have it at 8 am." Krivulja se iscrta preko stare, kao ghost line.
4. **Body Score / Verdict** kartica: uvijek isti raspored, 5 osi s ikonama:
   - Energy (kcal prema danu)
   - Sugar curve (vrh i trajanje)
   - Fullness (sitost po kcal)
   - Sleep (kofein ili alkohol u odnosu na san)
   - Nutrients (mikronutrijenti i vlakna)

   Uz to: jedna rečenica presude i jedna "best time / best pairing" akcija. **Ne zbrajati u jednu ocjenu 0–100** (vidi kritiku Yuke u B6). Bolje je imati 5 malih mjerača i riječ, npr. "Fine with a meal".
5. **Cheat-sheet frame** (zadnje 2 s, idealan za screenshot ili save): 3 retka, "Best time", "Pair with", "Swap for". To je element koji potiče saves.
6. **Loop**: posljednji kadar (hrana na stolu) identičan je prvom kadru.

Ponavljajući segmenti (serije):
- "**Ranked**": tjedna ljestvica, npr. "5 breakfasts ranked by fullness per kcal".
- "**Same kcal, different day**": 200 kcal od 3 hrane.
- "**Myth Monday**".
- "**You asked**": hrana iz komentara. To je etičan comment bait: "Comment a food, we'll run it through the body." To je stvarna usluga, ne mamac.
- "**Night shift**": što radi u tijelu dok spavaš.

Etični comment bait:
- "Which body are you, 55/75/95?"
- "Guess before the reveal."
- "What should we test next?"

Nikad "tag someone who eats this trash" ni body-shaming.

## A7. Vizualne tehnike za 3D anatomiju

| Tehnika | Kad | Napomena |
|---|---|---|
| **Zoom-through** (tijelo → organ → stanica → molekula) | na vrhuncu (vrh glukoze, alkohol u jetri, adenozinski receptor) | Treba 3 razine assetova: organ (postoji), "cell card" 2.5D i ikona molekule. Ne treba prava molekularna animacija, dovoljna je stilizirana kartica. |
| **X-ray / ghost body** | stalno kao pozadina, organ u fokusu svijetli | već dijelom postoji |
| **Split-screen tijela** | versus, 3 tijela, prije/poslije | CompareBodies.tsx postoji, treba ga proširiti na N=3 |
| **Speed ramp sata** | +0:10 sporo, zatim 6 h brzo, pa usporenje na događaju | "time-lapse ↔ slow-mo" daje osjećaj važnosti |
| **Live mini-graf uz organ** | glukoza, BAC, kofein u mg, sitost | Krivulja se crta u stvarnom vremenu sata, a točka "you are here" putuje po njoj. **Najjači pojedinačni dodatak**, jer pretvara prolaz u priču s vrhom. |
| **Ghost line** | pairing ili timing twist | stara krivulja siva, nova u boji, a razlika osjenčana i označena "−38 %" (samo gdje postoji izvor) |
| **Counter / odometar** | kcal izgorene, mg kofeina preostalo | brojke se odbrojavaju, što daje osjećaj kretanja |
| **Threshold lines** | BAC 0,5 ‰ EU / 0,08 % US, kofein 200/400 mg EFSA, šećer 25/50 g WHO | Prag čini broj smislenim. |
| **"Body weather" overlay** | san ili budnost kao noćno nebo iznad glave | vizualna metafora za san bez medicinskih tvrdnji |

## A8. Audio i ritam

Nadovezuje se na `video-creative-spec-2026-10-24.md` §zvuk. Dodaci [OPINION]:
- **Sonifikacija krivulje**: ton blago raste s glukozom ili BAC-om (jedan sinusni pad). Mozak čuje vrh prije nego ga vidi.
- **Riser 1 s prije vrha**, zatim "hit" na broju i 0,3 s tišine nakon velikog broja da sjedne.
- **Foleyji po klasi** (fizz, gutljaj, hrskanje) u prve 0,5 s.
- Glas: brži u journeyju, za ton niži i sporiji na presudi. To daje autoritet.
- Rez ili vizualna promjena svake 2–3 s. Duže je dopušteno samo kad se krivulja crta, jer kretanje linije je samo po sebi vizualni događaj.

## A9. Točnost i signali povjerenja

- Oznake A/B/C/? **na ekranu** uz svaki broj (mali badge). To je već diferencijator, pa ga treba isticati, a ne skrivati.
- "**Estimate for a 75 kg adult**" stalno u kutu kad je broj iz modela.
- **Rasponi** umjesto točaka gdje je varijabilnost velika: kofein 1,5–9,5 h, BAC eliminacija 0,10–0,25 g/L/h. Glukoza: ZOE PREDICT pokazuje velike razlike među ljudima, a geni objašnjavaju oko 30 % varijacije. [PRIMARY/vendor] [ZOE PREDICT](https://zoe.com/learn/zoe-predict-studies-what-we-ve-learned), [Nature Med 2024](https://link.springer.com/article/10.1038/s41591-024-02951-6)
- **Sources frame**: 1 s na kraju plus pinned comment, link na stranicu hrane s izvorima (Kurzgesagt model).
- "Not medical advice" je kratko, a nije cijeli ekran.

## A10. Rizici politika platformi

| Platforma | Pravilo | Što izbjegavati |
|---|---|---|
| TikTok | "Disordered Eating, Risky Weight Management and Body Image" (verzija 2025). Zabranjeni su promocija poremećaja prehrane, rizičnih metoda mršavljenja i štetne usporedbe tijela. Dio sadržaja je 18+ ili nije podoban za For You feed. | Kalorije kao "kazna" ("burn it off in 2 h of running"), "what I eat in a day" ekstremi, before/after tijela, preporuke za post. [SECONDARY] [conductatlas copy](https://conductatlas.com/diff/tiktok/tiktok-community-guidelines/2148/29/); [PRIMARY, 2024] [TikTok mental health](https://www.tiktok.com/community-guidelines/en/mental-behavioral-health); [AOL/news](https://www.aol.com/news/tiktok-crack-down-content-promotes-120052618.html) |
| TikTok | Medicinske dezinformacije i alkohol. Prikaz alkohola je osjetljiv. | Ne prikazivati opijanje kao zabavu i ne davati "how to sober up" savjete. Ne reći "safe to drive at X". Uvijek: "Estimate. Never use it to decide if you can drive." |
| YouTube | Medical misinformation policy: zabranjen je sadržaj suprotan smjernicama lokalnih zdravstvenih vlasti (prevencija, liječenje, negiranje). | Tvrdnje da hrana liječi ili sprječava bolest ("cinnamon fixes diabetes"). [PRIMARY] [YouTube policy](https://support.google.com/youtube/answer/13813322) |
| Meta | Slična pravila. Health/wellness oglašavanje ne smije implicirati osobne zdravstvene karakteristike gledatelja (pravila za oglase). | U oglasima ne pisati "Are you diabetic?". |

Posebno za **"minute hoda"**: koristiti neutralno ("energy equivalent"), nikad "you need to walk X to earn it". Na mlađoj publici ga po potrebi ugasiti. Daley 2019 pokazuje učinak, ali TikTok-pravila naglašavaju kompenzacijsko vježbanje kao rizik [OPINION].

## A11. 30 "wow" segmenata za video (generiraju se automatski)

Stupci: **Podaci** (što generator mora imati) · **Zašto zadržava** · **Rizik ako je netočno**.

| # | Segment | Podaci | Zašto zadržava | Rizik |
|---|---|---|---|---|
| 1 | **Live glucose curve s "you are here" točkom** | GI/GL, ugljikohidrati, vlakna, masti, proteini, model | Vrh je prirodni vrhunac i daje oblik priči | Visok. Individualna varijabilnost, pa uvijek raspon i "typical adult" |
| 2 | **Guess-the-peak** (3 opcije, otkrivanje) | isto kao 1 | Obveza na pogodak drži gledatelja do odgovora | Srednji |
| 3 | **Pairing ghost line** ("after salad / with protein") | model + efekt pairinga iz literature | Konkretna akcija i "plot twist" | Visok ako se postotak izmisli. Koristiti samo mjere s izvorom (Shukla) i oznaku B |
| 4 | **Walk-after toggle** (10 min hoda) | Buffey 2022 efekt | Akcija koju svatko može napraviti | Srednji. Efekt je u laboratorijskim uvjetima |
| 5 | **Caffeine at bedtime** (mg preostalo u 23 h) | mg kofeina, poluživot 5 h (raspon), vrijeme konzumacije | Osobno, kontraintuitivno | Srednji. Pokazati raspon 1,5–9,5 h |
| 6 | **"Latest sensible time" za kofein** | isto, prag oko 6 h prije spavanja (Drake) | Spremljivi savjet | Nizak/srednji |
| 7 | **BAC 3 tijela** (55/75/95 kg, M/Ž) | Widmark, g alkohola | Identifikacija i komentari | Visok. Nikad "safe to drive". Prikazati pragove US/EU |
| 8 | **Hours-to-zero** sat za alkohol | 0,15 g/L/h (0,10–0,25) | Iznenađujuće dugo | Visok. Isto upozorenje |
| 9 | **REM cost** noćnog pića | doza g/kg → REM efekt (Gardiner 2025) | Skriveni trošak | Srednji. Kvalitativno ("less REM"), bez točnih minuta osim uz raspon |
| 10 | **Sugar cubes drop** (kocke padaju u čašu) | g šećera | Vizualni udarac | Nizak |
| 11 | **% dnevnog limita** (WHO 25/50 g slobodnih šećera, sol 5 g) | nutrijenti | Kontekst za broj | Nizak. Razlikovati slobodni od ukupnog šećera |
| 12 | **Fullness per 100 kcal** (sitost po kcal, ljestvica) | proteini, vlakna, voda, energetska gustoća, satiety index (Holt 1995) | Iznenađuje (krumpir visoko) | Srednji. Indeks je star i mali uzorak, oznaka B |
| 13 | **Hunger return clock** ("hungry again at +2:40") | model sitosti | Osobno, iskustveno | Srednji/visok. Velika varijabilnost |
| 14 | **Transit map** (usta → želudac → crijevo, vrijeme po stanici) | pražnjenje želuca po makronutrijentima i obliku (tekuće/kruto) | Daje osnovu 3D prolazu | Srednji. Raspon |
| 15 | **Liquid vs solid** (isti kcal kao sok vs voće) | dvije hrane | Versus, jednostavno | Nizak |
| 16 | **Fiber → microbiome "feeding time"** (+6–24 h, debelo crijevo) | g vlakana, tip | Događa se kasno, pa je razlog da se gleda do kraja | Srednji. Ne tvrditi specifične bakterije |
| 17 | **Micronutrient hero** (jedan nutrijent s najvećim % DV) | puni profil mikronutrijenata (USDA) | "Nisam znao da banana…" | Nizak, ako se koristi USDA |
| 18 | **Hydration balance** (+ / − ml, alkohol i kofein diureza) | voda u hrani, alkohol | Mit-buster ("coffee doesn't dehydrate habitual drinkers much") | Srednji |
| 19 | **Energy budget bar** (kcal kao % dana za tvoju veličinu) | kcal, BMR/TDEE procjena | Osobno | Srednji. Paziti na poremećaje prehrane |
| 20 | **Same kcal, 3 foods** (split-screen) | 3 hrane | Rankable, spremljivo | Nizak |
| 21 | **Morning vs night** isti obrok | cirkadijalni modifikator tolerancije glukoze | Neočekivana varijabla | Srednji/visok, oznaka B |
| 22 | **Myth card** (fakt-mit-fakt) | baza mitova | Shareable | Visok ako je mit krivo prikazan |
| 23 | **Swap that changes the curve** ("swap X for Y: −Z g sugar, +N h fullness") | dvije hrane iz baze | Akcija i spremanje | Nizak/srednji |
| 24 | **"What your liver is doing right now"** (alkohol/fruktoza, tekst + organ glow) | model | Zoom do stanice daje "wow" | Srednji |
| 25 | **Adenosine block** (zoom do receptora, kofein) | mg, poluživot | Molekularni wow trenutak | Nizak (mehanizam je čvrst) |
| 26 | **Peak-to-crash** ("energy dip at +1:50"?) | model glukoze, reaktivna hipoglikemija | Iskustveno ("that's my 3 pm slump") | **Visok**. Reaktivna hipoglikemija kod zdravih je manje česta nego što se misli, pa koristiti samo uz oznaku B/C |
| 27 | **24 h replay u 3 s** (cijeli dan na sat-ubrzanju, krivulje se iscrtaju) | sve | Loop-friendly završetak | Nizak |
| 28 | **Body Score card** (5 osi) | sve | Serijski potpis, usporedivo između videa | Srednji. Metodologija mora biti javna |
| 29 | **Cheat-sheet frame** (best time / pair with / swap) | iz 3, 6, 23 | Saves | Nizak |
| 30 | **"Your version"** CTA: "Run your body on inside24h…" s QR/URL za istu hranu | link na stranicu hrane | Most video → site | Nizak |

---

# DIO B: WEB STRANICA / APLIKACIJA

## B1. Što rade najbolji (mehanizmi)

| Primjer | Mehanizam | Dokaz |
|---|---|---|
| **NYT Upshot "You Draw It"** (2015) | Čitatelj prvo nacrta svoju krivulju, zatim vidi stvarnu. Sudjelovalo je stotine tisuća čitatelja i mnogi su pogriješili, pa je otkrivenje snažnije. | [SECONDARY] [FlowingData](https://flowingdata.com/2015/05/28/compare-your-curve-to-reality-for-income-percentile-versus-college-attendance/), [Opportunity Insights](https://opportunityinsights.org/press/how-family-income-affects-childrens-college-chances/) |
| **Explorable explanations** (Bret Victor, Nicky Case) | Aktivno čitanje: korisnik testira pretpostavke. Razlika od "sandbox widgeta" je u tome što autor **vodi pažnju** prema fenomenu. Caseovi obrasci: "go too far → fail → step back", "end with a sandbox". | [PRIMARY] [worrydream.com](https://worrydream.com/ExplorableExplanations/), [Nicky Case blog](https://blog.ncase.me/explorable-explanations-4-more-design-patterns/) |
| **Distill: interaktivni članci** | Pregled literature: interaktivni članci povećavaju angažman i umjereno poboljšavaju zadržavanje znanja u odnosu na statične. Najjači su kad se sustav može simulirati u stvarnom vremenu s parametrima. | [PRIMARY] [Hohman et al. 2020](https://distill.pub/2020/communicating-with-interactive-articles/) |
| **Ciechanowski** | "Gold standard" manipulabilnih figura: svaki koncept ima svoj mali, direktno manipulirani model, a ne jedan veliki. | [SECONDARY] [handbook](https://arashshahidi1997.github.io/projio/handbook/00-frame/why-interactivity/); princip direct manipulation: [Hutchins/Hollan/Norman](https://cs.pomona.edu/classes/cs181dt/assets/readings/dm-interfaces.pdf) |
| **ZOE** | Personalizacija kroz osobni odgovor. Poruka "averages hide big differences" zvuči znanstveno i osobno. | [PRIMARY/vendor] [ZOE PREDICT](https://zoe.com/learn/zoe-predict-studies-what-we-ve-learned) |
| **Yuka** | Jednostavna ocjena 0–100 (60 % nutrijenti, 30 % aditivi, 10 % organsko) pokreće ponašanje i reformulaciju. Kritika: težine nisu obrazložene, a aditivi se penaliziraju i u bezopasnim količinama. **Lekcija: score privlači, ali mora biti transparentan.** | [SECONDARY] [NPR 2025](https://www.npr.org/2025/05/26/nx-s1-5391915/phone-apps-food-nutrition-health), [FoodNavigator 2026](https://www.foodnavigator.com/Article/2026/02/09/yuka-drives-reformulation-but-shuts-out-food-makers/), [Yuka metodologija](https://help.yuka.io/l/en/article/ijzgfvi1jq) |
| **CGM aplikacije (Levels, Lingo)** | Krivulja nakon obroka plus "meal score" plus eksperimenti ("try a walk"). Kritika: kod zdravih ljudi nema dokaza o koristi, a aplikacije mogu stvarati anksioznost. | [SECONDARY] [Science News](https://www.sciencenews.org/?p=3158468), [WebMD](https://www.webmd.com/diabetes/news/20231212/continuous-glucose-monitors-for-those-without-diabetes); Levels cijene: [competitors.md](competitors.md) |
| **Spotify Wrapped** | Osobni podaci kao priča u karticama, format za stories i identitet ("this is me"). U 2021. oko 60 M dijeljenja. | [SECONDARY] [TechCrunch](https://techcrunch.com/?p=2449677), [UX Collective](https://uxdesign.cc/why-is-spotify-wrapped-so-popular-5c503e79a3ee) |
| **Duolingo streak** | Streak wager: +14 % D7 retencije (podatak same tvrtke). "Freeze" smanjuje kaznu. Kritika: loss aversion potiče "minimalni rad za streak". | [PRIMARY/company] [Duolingo blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit), [Duolingo research](https://blog.duolingo.com/duolingo-streak-research/); kritika [DEV](https://dev.to/pocket_linguist/why-duolingos-gamification-works-and-when-it-doesnt-1d4) |
| **Cronometer / MyFitnessPal / Yazio** | Log obroka, mikronutrijenti, dnevni cilj. Retencija dolazi iz navike logiranja, a churn iz napora logiranja. | [OPINION, opće znanje; nije ponovno provjereno u ovoj rundi] |
| **BioDigital / Complete Anatomy** | Slojevi (koža → mišići → organi), izolacija organa, "bookmarked views", kvizovi. | [OPINION, opće znanje] |

## B2. UX obrasci (što primijeniti i kako)

1. **Time scrubber kao glavni kontroler.** Sat od 24 h je i timeline i navigacija. Na scrubberu su "event pins" (vrh, sitost gotova, kofein na pola, alkohol na 0, vlakna stigla u debelo crijevo). Klik na pin skače na događaj i zumira organ. Pinovi pretvaraju 24 h u poglavlja [OPINION, temeljeno na Victor: vođenje pažnje].
2. **What-if slideri, ali vođeni.** Ne treba 12 slidera odjednom. Treba **3 kontekstualna**, ovisno o klasi hrane:
   - kofein: vrijeme pića, spavanje, poluživot (sporo / tipično / brzo);
   - alkohol: masa, hrana u želucu, broj pića;
   - šećer: s čime, hod poslije, doba dana.

   Svaki slider ima "ghost line" prethodne vrijednosti.
3. **Predict-then-reveal** (You Draw It): prije simulacije korisnik povuče svoj pogodak krivulje. Na kraju vidi "you were 40 min off". To je gotov share moment.
4. **Usporedba je prvoklasni objekt.** URL `/compare/cola-vs-orange-juice` daje dva tijela i iste osi. Compare.tsx i CompareBodies.tsx postoje, treba im dati **vlastite stranice i SEO**.
5. **Personalizacija u 2 koraka**: masa, visina i spol (opcionalno), vrijeme spavanja. Sve ostalo ima zadane vrijednosti. Pokazati "**what changed because of you**" (npr. "Your BAC is 0.12‰ higher than the 75 kg default"). Tako personalizacija postaje vidljiva, a ne samo pretpostavljena.
6. **Scores i presude**: 5 osi (kao u videu, A6) s riječima i ikonama. Klik na os otvara "why" s izvorom. Ne prikazivati jedan broj 0–100 (Yuka lekcija).
7. **Spremanje i dijeljenje**: svaki state (hrana, tijelo, vrijeme, slideri) ima svoj URL. "Share this moment" daje karticu 9:16 i 1:1 (MomentShare.tsx postoji).
8. **Onboarding**: ne tour, nego **prvi pogodak** ("Guess: how long is a coffee in you?"). Interakcija je onboarding.
9. **Pretraga**: tolerantna na tipfelere, sinonime i brendove ("coke", "flat white"). Prazan rezultat predlaže najbližu hranu ("We don't have 'kombucha' yet, closest: …") i daje "request" gumb. Requestovi idu u ArtifactData/feedback i hrane "You asked" video seriju.

## B3. Slojevi dubine (početnik → ekspert)

- **Razina 1 "Story"** (zadano): 3D, krivulje, presude, 1 rečenica po događaju.
- **Razina 2 "Why"**: klik na bilo koji broj otvara mehanizam u 2–3 rečenice plus mini-dijagram.
- **Razina 3 "Science"**: formula ili model, parametri, raspon, oznaka A/B/C/?, citat s linkom (HowWeKnow.tsx postoji). Ovdje može ići i "**what we don't know**", što je rijetkost i gradi povjerenje (Kurzgesagt lekcija).
- **Razina 4 "Pro"** (Pro.tsx): CSV ili JSON izvoz krivulje, svi parametri. To je za nutricioniste i studente, koji su usput i backlink izvor.

## B4. Petlje povratka (etične)

| Petlja | Opis | Etika |
|---|---|---|
| **"Your day" simulator** | Doručak, kava, ručak, pivo: slaže se cijeli dan, a krivulje se zbrajaju (kofein se akumulira, alkohol, glukoza po obroku, sitost). EveryDay.tsx i MealBar.tsx su temelj. | Bez ocjene "dobar/loš dan". Prikazati "what moved the needle". |
| **Favoriti i "My usuals"** | 5 hrana koje često koristiš, jedan tap. | Lokalno (localStorage), bez računa. |
| **History** | Zadnjih 20 simulacija. | Lokalno. |
| **"Try one change" eksperiment** | Predloži 1 promjenu (kava 2 h ranije, hod poslije ručka). Sutra pita "did you sleep better?" (samoprocjena). | Bez streak-kazne. Ako se koristi streak, onda **"weekly experiments"** umjesto dnevnog, s automatskim freezeom. |
| **"New this week"** | Nova hrana ili mit tjedno, sinkronizirano s video serijom. | — |
| **Passport / kolekcija** (Passport.tsx) | "You've explored 23/149 foods", značke po klasama (all coffees). | Nagrađuje istraživanje, a ne konzumaciju. Ključno je da značka nikad ne bude za "ate X". |

Streakovi: Duolingo pokazuje učinak, ali i rizik "minimalnog rada". Za zdravlje i hranu dnevni streak potiče kompulzivno logiranje, što je rizik kod poremećaja prehrane. **Preporuka: bez dnevnog streaka za jelo**, eventualno tjedna "curiosity" serija za istraživanje novih hrana [OPINION].

## B5. Shareable izlazi

1. **Moment card** (postoji): dodati krivulju, "you are here" i 1 iznenađujući broj.
2. **"My 24h" Wrapped-style story** (5 slajdova, 9:16) iz "Your day": "Your caffeine was still 60 mg at midnight", "Your fullest meal: …". Wrapped mehanizam: identitet i priča.
3. **Auto-video vlastitog izbora**: isti pipeline kao kanal (VideoCam.tsx, Kokoro), personaliziran tijelom korisnika. Watermark plus URL, što daje **UGC distribuciju**. Trajanje 15–20 s, renderira se u pregledniku ili na serveru.
4. **Versus card**: "Cola vs. OJ: who wins fullness?" Dobro za DM-dijeljenje (Mosseri: sends).
5. **Guess result card**: "I guessed 2 h. Truth: 5 h 40 min." Jednostavno, a izaziva prijatelje ("can you beat me?").
6. **Open Graph slika po URL-u**: svaka hrana i usporedba ima vlastiti OG preview s krivuljom, jer link u chatu tada već priča priču.

## B6. SEO i programatske stranice

- Stranice: `/food/{slug}`, `/compare/{a}-vs-{b}`, `/what-happens-after/{food}`, `/how-long/{caffeine|alcohol}-{food}-stays-in-body`, `/myth/{slug}`.
- **Rizik: Google "scaled content abuse"** (ožujak 2024). Masovno generirane stranice koje ne pomažu kažnjavaju se bez obzira na metodu. Zdravlje je YMYL, pa se traži jači E-E-A-T. [PRIMARY] [Google Search Central](https://developers.google.com/search/blog/2024/03/core-update-spam-policies), [helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [Google blog](https://blog.google/products/search/google-search-update-march-2024/)
- Kako proći test [OPINION]:
  1. **Svaka stranica ima jedinstvenu vrijednost**: stvarnu simulaciju, krivulju i brojeve specifične za tu hranu, a ne predložak s promijenjenim imenom.
  2. Iznad pregiba je **odgovor na upit** ("Caffeine from 1 espresso: ~63 mg, half gone by ~5 h (range 1.5–9.5 h)"), zatim interaktivni 3D.
  3. Vidljiv "**Reviewed by / Method / Sources**" blok (E-E-A-T). Idealno je imati stvarnog stručnog recenzenta za metodologiju.
  4. Ne generirati sve parove za compare (149² parova je očiti scaled abuse), nego samo **parove koje ljudi stvarno traže** (kava vs čaj, pivo vs vino, cola vs diet cola), možda 100–300.
  5. Server-render ili prerender teksta. 3D se učitava lijeno, tako da tekst i schema (FAQPage gdje je primjereno, NutritionInformation) ne čekaju WebGL.
- **TikTok i YouTube su također tražilice**: naslov videa = upit ("what happens 1 hour after coffee"). Isti slug kao web stranica.

## B7. Mobilne performanse

- Core Web Vitals (p75): **LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1**. [PRIMARY] [web.dev](https://web.dev/articles/defining-core-web-vitals-thresholds)
- Praksa [OPINION]:
  - Poster ili 2D tijelo (Body2D.tsx postoji) je LCP. 3D se hidrira nakon toga.
  - Organi su Draco/meshopt komprimirani, s LOD-om za mobitel.
  - Scrubber računa model u Web Workeru (INP!), a crta se samo vidljiva krivulja.
  - `prefers-reduced-motion` daje 2D način.
  - Za low-end Android: auto-downgrade po FPS-u u prvih 2 s.

## B8. Povjerenje i usklađenost (EU/US)

- **EU Uredba 1924/2006** (prehrambene i zdravstvene tvrdnje) vrijedi za "commercial communications" o hrani: označavanje, prezentaciju i oglašavanje. Neutralna edukacija bez prodaje proizvoda je manje rizična. **Ako se ikad uvede sponzorstvo ili affiliate brendova, svaka tvrdnja o zdravlju mora biti s EU registra odobrenih tvrdnji.** [PRIMARY] [EUR-Lex 1924/2006](https://eur-lex.europa.eu/eli/reg/2006/1924). Pitanje primjene na aplikacije nije razjašnjeno u ovoj rundi, pa preporučujem pravni savjet prije monetizacije s brendovima.
- **FDA General Wellness (siječanj 2026)**: softver koji ostaje na wellness tvrdnjama, bez dijagnoze, liječenja ili usmjeravanja kliničkih odluka, nije medicinski uređaj. **Izbjegavati**: "detects prediabetes", "manage your diabetes", "safe dose for your condition", "insulin dosing". [PRIMARY] [FDA guidance](https://fda.gov/regulatory-information/search-fda-guidance-documents/general-wellness-policy-low-risk-devices); [SECONDARY] [Faegre Drinker](https://faegredrinker.com/en/insights/publications/2026/1/key-updates-in-fdas-2026-general-wellness-and-clinical-decision-support-software-guidance), [Cooley](https://www.cooley.com/news/insight/2026/2026-01-20-fda-opens-aperture-for-wearables-in-latest-general-wellness-guidance)
- Za alkohol: nikad "you can drive", a BAC uvijek s pragovima i upozorenjem. Personalizacija za trudnice, djecu i lijekove: ili isključiti, ili prikazati "talk to a professional" umjesto broja.
- **GDPR**: masa, spol i obroci su zdravstveno osjetljivi podaci (čl. 9 je moguć). Najjednostavnije je **sve držati lokalno** u pregledniku, bez računa i bez slanja na server. Ako se uvede sinkronizacija, potrebni su eksplicitna privola i minimalizacija.
- **Poremećaji prehrane**: prekidač "hide calories" i zadano bez "burn it off". Bez ocjena "bad food". Copy "everyday context", a ne "guilt".

## B9. 30 "wow" funkcija za web (automatski za svaku hranu)

| # | Funkcija | Podaci | Zašto zadržava | Rizik |
|---|---|---|---|---|
| 1 | **Predict-then-reveal krivulja** (nacrtaj svoj pogodak) | model krivulje za hranu | Najjači mehanizam angažmana u data-journalismu (You Draw It) | Srednji. Krivulja mora imati raspon |
| 2 | **Event pins na 24 h scrubberu** | događaji iz modela | 24 h postaje poglavlja | Nizak |
| 3 | **Kontekstualni what-if slideri s ghost line** (3 po klasi) | parametri modela | Uzrok i posljedica direktnom manipulacijom | Srednji/visok. Pairing efekti samo s izvorom |
| 4 | **"Your day" stack** (više obroka, zbrojene krivulje) | sve hrane, interakcije | Dnevni povratak, realno ponašanje | Srednji. Interakcije su nesigurne, pa ih označiti |
| 5 | **Best time to eat/drink it** (heatmap 24 h) | kofein ili san, alkohol, cirkadijalno | Spremljiv, akcijski odgovor | Srednji |
| 6 | **Pairing finder** ("eat with X → curve −N %") | baza pairinga s oznakom dokaza | Akcija i druga hrana, pa daljnje istraživanje | Visok bez izvora |
| 7 | **Swap suggester** (slična hrana, bolja os) | nutrijenti 149 hrana, Swap.tsx | Korisno, duboko klikanje | Nizak/srednji |
| 8 | **Body Score 5 osi + "why" po osi** | sve | Usporedivo, objašnjivo | Srednji. Javna metodologija |
| 9 | **"What changed because of you"** diff | personalizacija | Vidljiva vrijednost personalizacije | Nizak |
| 10 | **Versus stranice s pobjednikom po osi** | 2 hrane | SEO i share | Nizak |
| 11 | **Caffeine stack meter** (koliko mg u krvi u svakom trenutku dana) | sve kave i čajevi dana | Iznenađenje "still 90 mg at midnight" | Srednji |
| 12 | **Sleep forecast** (kofein i alkohol u odnosu na tvoje vrijeme spavanja) | vrijeme spavanja, modeli | Osobno, povratak sutra | Srednji/visok. Kvalitativno |
| 13 | **Hours-to-zero alkohol + pragovi zemlje** (auto po locale: HR 0,5‰, US 0,08 %) | Widmark, locale | Praktično | **Visok**. Jasna zabrana "safe to drive" |
| 14 | **Fullness per 100 kcal ljestvica** (globalna, filtrirana po klasi) | sitost | Rangiranje, istraživanje | Srednji |
| 15 | **Sugar cubes / spoons / % WHO limit** vizualizacija | šećer | Instant razumijevanje | Nizak |
| 16 | **Micronutrient hero + "pairs well for absorption"** (npr. vitamin C + željezo) | mikronutrijenti | "Nisam znao" | Srednji |
| 17 | **Fiber journey** (kada vlakna stignu u debelo crijevo, "microbiome meal") | vlakna | Kasni događaj, razlog za scrub do kraja | Srednji |
| 18 | **Hydration ledger** (ml in/out) | voda, alkohol, kofein, klima (hydration-climate.md) | Mit-buster | Srednji |
| 19 | **Zoom-to-cell mode** na događaju (receptor, hepatocit, beta-stanica) | statični assetovi po mehanizmu | Wow i dubina | Nizak |
| 20 | **3 bodies compare** (min/tip/max osoba) | personalizacija | Pokazuje varijabilnost i edukaciju o rasponima | Nizak |
| 21 | **Myth cards po hrani** (fakt-mit-fakt, glasaj "I believed this") | baza mitova | Interakcija i share | Visok ako je krivo |
| 22 | **"What we don't know"** blok | oznake ? i C | Povjerenje, diferencijacija | Nizak |
| 23 | **Guess result share card** | rezultat pogotka | Izazov prijateljima (DM sends) | Nizak |
| 24 | **Auto-video moje simulacije** (15–20 s, moje tijelo) | video pipeline | UGC, vrhunski share | Srednji. Isti disclaimeri, watermark |
| 25 | **"My week" Wrapped** (lokalna povijest → 5 kartica) | lokalni history | Tjedni povratak, identitet | Nizak, ako je sve lokalno |
| 26 | **Food passport** (istraživanje, značke po klasama) | history | Kolekcionarstvo bez nagrađivanja jela | Nizak |
| 27 | **"Request a food"** + glasanje | feedback | Zajednica i video pipeline | Nizak |
| 28 | **Energy context** (kcal kao % tvog dana, opcionalno minute hoda; skrivivo) | TDEE | Kontekst | Srednji. ED-rizik, pa default isključen za "burn" jezik |
| 29 | **Explain-like-I'm level toggle** (Story / Why / Science / Pro) | content slojevi | Početnici i eksperti na istoj stranici | Nizak |
| 30 | **Embed widget** ("put this coffee curve on your blog") | iframe stanje | Backlinkovi i distribucija | Nizak/srednji. Kontrola verzija i izvora |

---

## C. Kako sve to postaje jedan sustav (za generator)

Jedan **"Food Story JSON"** po hrani, iz kojeg se rade i video i web:

```
food -> nutrients (USDA) + class
     -> model outputs (curves: glucose, BAC, caffeine, fullness, hydration; events with times)
     -> ranges (min/typ/max body) + evidence labels per number
     -> surprise candidates: each {claim, number, anchor ("= 3 sugar cubes"), evidence, source, surprise_score}
     -> myths[] (class-level + food-level)
     -> actions: best_time, pairing[], swap[], walk_effect
     -> verdict: 5 axes + one-word label + one sentence
```

- **surprise_score** [OPINION]: odstupanje broja od onoga što ljudi očekuju (npr. od prosjeka klase ili od tipičnog "guess" odgovora iz web pogađanja!). Web pogodci postaju **podaci za video hookove**: ako 70 % ljudi podcijeni kofein u ponoć, to je hook.
- Video bira: hook = najveći surprise; 3–5 beatova = ljestve s najvećim brojevima; twist = action s najvećim efektom i oznakom A/B; kraj = verdict plus cheat-sheet.
- Web prikazuje isti JSON kao pinove, kartice, slidere i SEO tekst.

## D. Rangirani prioriteti (očekivani utjecaj)

**Video mehanizmi (top 10):**
1. Live krivulja s "you are here" točkom (pretvara prolaz u priču s vrhom).
2. Hook = pitanje ili pogodak do 1 s, odgovor u zadnje 2–3 s (ugovor, Zack D.).
3. Ljestva uzrok → učinak → so what → akcija u svakom beatu.
4. Plot twist s ghost lineom (pairing, hod, vrijeme).
5. Fiksni Body Score (5 osi) + cheat-sheet frame (saves).
6. Svakodnevni anchori (kocke, espresso, sati do nule).
7. "3 bodies" personalizacija (identifikacija i komentari).
8. Mit-format fakt-mit-fakt, uključujući anti-hype.
9. Vizualni događaj svake 2–3 s, zoom-to-cell na vrhuncu, riser i hit.
10. Oznake A/B/C i rasponi na ekranu, sources frame (povjerenje i sigurnost platforme).

**Web ideje (top 10):** predict-then-reveal; "Your day" stack; event pins na scrubberu; kontekstualni slideri s ghost lineom; best-time heatmap; versus stranice (kurirani parovi) sa SEO-om; auto-video vlastite simulacije; Body Score s "why"; guess/moment share kartice s OG slikama; slojevi Story/Why/Science/Pro + "What we don't know".

**Video segmenti (top 10):** #1 live glucose, #2 guess-the-peak, #3 pairing ghost line, #5 caffeine at bedtime, #7 BAC 3 tijela, #23 swap, #12 fullness per 100 kcal, #9 REM cost, #29 cheat-sheet, #28 Body Score.

## E. Otvorena pitanja za vlasnika

1. Body Score: 5 osi bez ukupne ocjene (moja preporuka) ili jedan broj (privlačniji, ali Yuka-kritika)?
2. Kalorije kao "minute hoda": uključiti (Daley pokazuje učinak) ili izostaviti zbog ED-rizika i TikTok pravila?
3. Auto-video za korisnike: render u pregledniku (besplatno, sporije) ili server (trošak)?
4. Stručni recenzent (nutricionist ili liječnik) za metodologiju: postoji li netko? To znatno pomaže i SEO-u (YMYL) i povjerenju.
5. Monetizacija s brendovima: ako da, prvo pravni pregled EU 1924/2006.

## Izvori (pregled)

Platforme: [YouTube Shorts analytics](https://support.google.com/youtube/answer/12220281) · [YouTube medical misinformation](https://support.google.com/youtube/answer/13813322) · [TikTok mental & behavioral health](https://www.tiktok.com/community-guidelines/en/mental-behavioral-health) · [TikTok guidelines copy 2025](https://conductatlas.com/diff/tiktok/tiktok-community-guidelines/2148/29/) · [Instagram 2025 signals](https://www.socialmediatoday.com/news/instagram-shares-algorithm-2025/738034/) · [Buffer TikTok](https://buffer.com/library/tiktok-algorithm/) · [vidIQ loops](https://vidiq.com/blog/post/double-youtube-watch-time-looping-shorts)
Kreatori: [Zack D. analiza](https://danielrusnok.substack.com/p/how-a-faceless-channel-engineered) · [Kurzgesagt process](https://kurzgesagt.org/youtube/)
Učenje i komunikacija: [Gruber 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC4252494) · [Guo 2014](https://pg.ucsd.edu/publications/edX-MOOC-video-production-and-engagement_LAS-2014.txt) · [Debunking Handbook](https://sciencelearning.umd.edu/files/2020/10/DebunkingHandbook2020.pdf) · [Distill interactive articles](https://distill.pub/2020/communicating-with-interactive-articles/) · [Explorable Explanations](https://worrydream.com/ExplorableExplanations/) · [Nicky Case patterns](https://blog.ncase.me/explorable-explanations-4-more-design-patterns/) · [You Draw It (FlowingData)](https://flowingdata.com/2015/05/28/compare-your-curve-to-reality-for-income-percentile-versus-college-attendance/)
Fiziologija: [Drake 2013 kofein](https://pmc.ncbi.nlm.nih.gov/articles/PMC3805807) · [Kofein poluživot NBK223808](https://www.ncbi.nlm.nih.gov/books/NBK223808/) · [Grzegorzewski 2021](https://frontiersin.org/articles/10.3389/fphar.2021.752826/full) · [Jones 2019 alkohol](https://pmc.ncbi.nlm.nih.gov/articles/PMC6474506) · [Ebrahim 2013](https://pubmed.ncbi.nlm.nih.gov/23347102/) · [Gardiner 2025](https://research.monash.edu/en/publications/the-effect-of-alcohol-on-subsequent-sleep-in-healthy-adults-a-sys/) · [Shukla 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4876745) · [Food order prediabetes](https://pubmed.ncbi.nlm.nih.gov/30101510/) · [Buffey 2022](https://pubmed.ncbi.nlm.nih.gov/35147898/) · [Exercise timing meta](https://pmc.ncbi.nlm.nih.gov/articles/pmc10036272) · [ZOE PREDICT](https://zoe.com/learn/zoe-predict-studies-what-we-ve-learned) · [CGM kod zdravih](https://www.sciencenews.org/?p=3158468) · [PACE Daley](https://pubmed.ncbi.nlm.nih.gov/31822568/) · [PACE Seyedhamzeh](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6137736/)
Proizvodi: [Yuka metodologija](https://help.yuka.io/l/en/article/ijzgfvi1jq) · [NPR o score aplikacijama](https://www.npr.org/2025/05/26/nx-s1-5391915/phone-apps-food-nutrition-health) · [Duolingo streak](https://blog.duolingo.com/how-duolingo-streak-builds-habit) · [Spotify Wrapped UX](https://uxdesign.cc/why-is-spotify-wrapped-so-popular-5c503e79a3ee)
Web i regulativa: [Core Web Vitals](https://web.dev/articles/defining-core-web-vitals-thresholds) · [Google spam policies 2024](https://developers.google.com/search/blog/2024/03/core-update-spam-policies) · [Helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) · [EU 1924/2006](https://eur-lex.europa.eu/eli/reg/2006/1924) · [FDA General Wellness 2026](https://fda.gov/regulatory-information/search-fda-guidance-documents/general-wellness-policy-low-risk-devices)

Napomena o ograničenjima: Platforme ne objavljuju težine signala, pa su težine u A1 sekundarne. Za BioDigital, Complete Anatomy, Cronometer, Levels i Lingo nisam provjeravao trenutne značajke u ovoj rundi (označeno kao opće znanje). Satiety index (Holt 1995) i cirkadijalni efekti glukoze nisu ponovno provjereni ovdje. Prije korištenja u videu treba ih provjeriti u `research/`.
