# Inside 24h - video strategija i monetizacija (research 2026-10-16)

Autor: research agent (Opus), 2026-10-16. Nadovezuje se na `growth.md` (2026-10-15).

Oznake pouzdanosti (isti duh kao upute.md §2):
- **[PRIMARY]** = procitano na sluzbenoj stranici platforme (help centar, uvjeti programa, newsroom). Datum stranice naveden gdje postoji.
- **[SECONDARY]** = ugledni medij / analiza koja citira primarni izvor, ali primarni izvor nisam sam otvorio.
- **[UNVERIFIED]** = blogovi/agregatori bez metodologije ili kontradiktorni izvori; tretirati kao hipotezu.
- **[OPINION]** = moja preporuka / zakljucak, ne cinjenica.

Napomena o metodi: TikTokove help/policy stranice su JS-renderirane i WebFetch ih ne moze procitati (vraca samo naslov). Zato su TikTok pravila citirana iz (a) stranica s uvjetima programa koje su se ucitale, (b) TikTok newsrooma i (c) Open Terms Archive kopije Community Guidelinesa (GitHub, verzija "Released Aug 14 2025, effective Sep 13 2025"). X help centar vraca 403, pa su X podaci iz sekundarnih izvora koji citiraju X. Prije bilo kakve odluke s novcem: otvoriti linkove rucno u pregledniku.

---

## 0. TL;DR

1. **TikTok Creator Rewards Program (CRP) NIJE dostupan osobi koja zivi u Hrvatskoj.** Uvjet je *pravno prebivaliste (legal residence)* u zemlji gdje program postoji; EEA uvjeti izricito zabranjuju VPN. **US kartica ne mijenja nista** - ona je samo nacin isplate, a isplatni racun mora biti na tvoje ime; laziranje prebivalista (VPN, US SIM, US adresa) = krsenje uvjeta -> iskljucenje, povrat isplacenog novca (clawback) i rizik za racun + porezni problem (laziranje US poreznih obrazaca). Detalji §1.1.
2. **YouTube Shorts je jedini veliki program s oglasnim prihodom koji je sluzbeno dostupan u Hrvatskoj** (YPP lista ukljucuje Croatia). Prag: 1.000 pretplatnika + 10 M Shorts pregleda u 90 dana (ili 4.000 h). Nizi "expanded YPP" (500 pretpl.) daje samo fan-funding. §1.2.
3. Facebook Content Monetization = samo na poziv; Hrvatska nije potvrdena. Instagram nema opci revenue share. X je u kolovozu 2026 ugasio Creator Revenue Sharing i uveo "Original Content Rewards" (Premium + 500 verificiranih followera + 500k impresija u 90 dana); lista zemalja nije potvrdena. §1.3-1.5.
4. **Realna strategija**: TikTok/Reels = doseg i funnel prema aplikaciji (+ LIVE darovi, brand deals kasnije); YouTube Shorts = jedini "pasivni" prihod; glavni novac dugorocno = vlastiti proizvod (Pro), sponzorstva i licenciranje animacija. [OPINION]
5. **Kriticni nalaz u kodu**: dugi video export je trenutno ograniceni na ~58 s (`AppV4.tsx` l.459/495, komentar "Reels limit 61 s" - zastarjelo, Reels su do 3 min od sijecnja 2025). Video nema **audio stazu** (mp4-muxer samo `video`). Za 60+ s i za retenciju treba VO + glazba. §5.3.
6. Rizici za demonetizaciju u nasoj nisi: "lijek za mamurluk" tvrdnje, ekstremni post/dijete (TikTok: "extended intermittent fasting" = nije za For You), AI-glas koji glumi doktora (YouTube: AI persona kao zdravstveni strucnjak = ne monetizira), templatirani masovni video bez nove vrijednosti (YouTube "inauthentic content" od 15.7.2025). §4.

---

## 1. Programi monetizacije po platformi

### 1.1 TikTok Creator Rewards Program (CRP)

**Pragovi** [PRIMARY]
- Uvjeti CRP-a (US verzija), "Last Update: July 20, 2026": kreator je *"a legal resident of a country where the Program is made available"*, ima *"18 years of age or older or the age of majority in their place of residence"*, *"at least 10,000 authentic followers"*, *"at least 100,000 authentic total video views in the last 30 days"*; video *"duration of at least 1 minute publicly posted"*; *"at least one valid linked digital payment account with an approved third party"*, registriran na ime kreatora; onboarding ukljucuje porezne dokumente; isplata 15. u mjesecu, minimum 50 USD. *"You represent and warrant that all application information you submit is truthful, complete, and accurate."* *"TikTok may offset any future rewards by the amount of rewards erroneously paid"*; ako nema buducih isplata, povrat u 30 dana od obavijesti.
  - https://www.tiktok.com/legal/page/global/creator-rewards-program-us/en (procitano 2026-10-16)
- Uvjeti CRP-a (EEA verzija), "Last Update: Apr 2025": kreator mora *"reside in a country in which Creator Rewards Program is available and do not use a VPN or other similar tool"*; program je *"available only in selected countries"*; *"at least 10,000 authentic followers"*, *"at least 100,000 authentic video views in total over the last 30 days"*; video *"one minute or longer"*; sadrzaj *"original content and produced entirely by the creator and/or adds new ideas to preexisting content"*. **Qualified view**: *"Qualified views are those that a user views for five seconds or more"*, ne racunaju se pregledi oznaceni "not interested", ponovljeni pregledi istog racuna = 1, umjetni/samogenerirani pregledi iskljuceni. Neprikupljeno stanje propada nakon 2 godine bez onboardinga.
  - https://www.tiktok.com/legal/page/global/tiktok-creator-rewards-program-eea/en (procitano 2026-10-16)
- Newsroom (18.3.2024): nagradjuje se po 4 metrike - **originality, play duration (watch time + finish rate), search value, audience engagement**; plus "ad value" publike. Racun mora biti *personal account* (ne Business).
  - https://newsroom.tiktok.com/introducing-the-new-creator-rewards-program?lang=en

**Zemlje** [SECONDARY]
- TikTok uvjeti NE objavljuju listu zemalja. Lista koja se moze potvrditi preko TikTok newsrooma: US, UK, Njemacka, Francuska, Japan, Juzna Koreja, Brazil (izvorni "Creativity Program Beta" markete) + **Meksiko od 1.10.2025**. Quasa (27.7.2026) nije nasla sluzbenu potvrdu sireg prosirenja u 2026.
  - https://quasa.io/media/tiktok-creator-rewards-program-eligible-countries-in-2026 (citira newsroom.tiktok.com/unlocking-even-more-opportunities-for-creators-with-the-creativity-program-beta-uk i newsroom.tiktok.com/programa-recompensas-creadores-tiktok-mexico)
- [UNVERIFIED] neki blogovi navode i Italiju, Spanjolsku, Kanadu, Australiju - kontradiktorno, bez primarnog izvora. **Nitko (ni sekundarni izvor) ne navodi Hrvatsku ni bilo koju zemlju Srednje/Istocne Europe.** Juzna Koreja: dob 19 (sekundarno).
- Konacna provjera: TikTok Studio -> Monetization (ako program nije ponuden racunu, nije dostupan).

**Kako se odreduje regija** [PRIMARY + UNVERIFIED]
- Pravni kriterij (primarno): *prebivaliste* kreatora, ne lokacija publike, ne valuta kartice. Publika iz SAD-a ne cini racun eligibilnim (Quasa, sekundarno).
- Tehnicki signali (neprimarno, SEO izvori): SIM drzava pri registraciji, IP, GPS, jezik uredaja; regija racuna je u praksi tesko promjenjiva. TikTok nema javnu dokumentaciju toga. [UNVERIFIED]

**US kartica - izricito** [OPINION utemeljen na PRIMARY tekstu]
- Kartica/US bankovni racun je nebitan za eligibilnost. Uvjeti traze (1) prebivaliste u zemlji programa, (2) isplatni racun *na tvoje ime*, (3) istinite podatke u prijavi + porezne dokumente. Za US program to znaci US porezni status (W-9 = US osoba). Stranac bez US prebivalista koji bi se predstavio kao US rezident krsi uvjete i lazno potpisuje porezni obrazac.
- Posljedice krsenja (iz uvjeta): suspenzija/ukidanje sudjelovanja, gubitak neisplacenih nagrada, offset/povrat vec isplacenog, EEA: VPN izricito zabranjen. Prakticno: rizik za cijeli racun (i rast koji je na njemu izgraden).
- Legitimni put: stvarno preseljenje u eligibilnu zemlju (prebivaliste + lokalni porezni status). Tvrtka ne pomaze - CRP trazi *personal* racun.

**RPM** [UNVERIFIED - creator-reported, nema sluzbene tablice]
- Najcesce navedeno: ~0,40-1,00 USD na 1.000 *qualified* pregleda; US > UK > DE (npr. 0,85 / 0,70 / 0,62 USD); finance/tech do 1,5-2 USD; zabava 0,2-0,45. Qualified pregledi ~40-70% ukupnih.
  - https://www.elev8or.io/blog/tiktok-creator-rewards-rpm-2026 ; https://ttcalculator.net/learn/tiktok-pay-per-1000-views/ ; https://www.soundstripe.com/blogs/how-much-does-tiktok-pay-per-view
- Racunica [OPINION]: 1 M pregleda/mj x ~55% qualified x 0,7 USD = ~385 USD/mj. Dakle CRP ni u eligibilnoj zemlji nije "glavni prihod" bez vrlo velikog volumena.

**Originalnost / AI / templati** [PRIMARY]
- CRP: original *"produced entirely by the creator and/or adds new ideas"*.
- Community Guidelines (eff. 13.9.2025): *"Content is also ineligible for the FYF if it includes unoriginal or reused material without anything new"*; primjeri: tudji watermark/logo, *"Low-quality or minimally edited content"*. AI: *"we require creators to label AI-generated or significantly edited content that shows realistic-looking scenes or people"*.
  - https://github.com/OpenTermsArchive/contrib-versions/blob/main/TikTok/Community%20Guidelines.md
- Za nas [OPINION]: 3D tijelo nije "realisticna scena/osoba" u smislu labela, ali ako se koristi AI glas/AI generirane slike ljudi -> ukljuciti TikTok "AI-generated" oznaku (nije kazna za doseg po pravilima; neoznaceno moze biti uklonjeno). Rizik "templated" sadrzaja: ako 30 videa ima identican kostur i samo zamijenjen naziv proizvoda, algoritam i moderatori to mogu vidjeti kao "minimally edited". Svaki video mora imati jedinstven narativ (vlastiti "plot twist", drugaciji kut kamere, drugaciji hook).

**Ostali TikTok prihodi dostupni i van CRP zemalja** [UNVERIFIED]
- LIVE darovi / LIVE Subscriptions: 18+, ~1.000 followera (TechCrunch citira TikTok, starije). TikTok Shop affiliate nije dostupan u HR (nije provjereno). Brand deals preko TikTok One/Creator Marketplace - regionalno ogranicen.

**Kontekst SAD** [SECONDARY]: TikTok USDS joint venture osnovan 22.1.2026; algoritam za US se re-trenira na US podacima. Utjecaj na doseg europskih kreatora prema US publici nepoznat. https://www.bgr.com/2083488/tiktok-us-owned-changes-coming/

### 1.2 YouTube Shorts (YPP)

[PRIMARY]
- Puni YPP: *"1,000 subscribers with 10 million qualified Shorts views in the last 90 days"* ili 1.000 + 4.000 h long-form u 12 mj; 2-Step Verification, AdSense for YouTube, bez aktivnih strikeova, prebivaliste u YPP zemlji. https://support.google.com/youtube/answer/72851
- Expanded YPP (fan funding: memberships, Super Thanks, Shopping): 500 pretplatnika + 3 javna uploada u 90 dana + 3 M Shorts pregleda u 90 dana (ili 3.000 h). **Hrvatska je na listi.** https://support.google.com/youtube/answer/13429240
- Shorts revenue share: oglasni prihod Shorts feeda se pooluje; dio ide za glazbu (1 pjesma u Shortu -> pola tog Shorta u Creator Pool, 2 -> trecina); kreator dobiva udio poola po *engaged views* po zemlji i **zadrzava 45%**. Neoriginalni Shorts (reuploadi, kompilacije bez dodane vrijednosti), lazni pregledi i sadrzaj koji krsi advertiser-friendly smjernice = neeligibilni pregledi. Shorts >1 min s claimanim sadrzajem blokirani su od monetizacije. Novo na stranici: od **1.2.2027** za udio u Shorts prihodu svaki mjesec treba 10 M qualified Shorts pregleda u zadnjih 90 dana (moja interpretacija teksta - procitati rucno). https://support.google.com/youtube/answer/12504220
- "Inauthentic content" (bivse "repetitious", azurirano 15.7.2025): ne monetizira se sadrzaj koji *"looks like it's made with a template"*, slideshowi/scrolling tekst s malo naracije, AI sadrzaj na generickim templatima bez autorskog uvida; **dozvoljeno**: isti intro/outro, serije istog formata gdje svaki video ima *distinct storyline, focus, or concept*, AI alati ako finalni proizvod pokazuje kreativnu viziju. **AI persone koje se predstavljaju kao ljudski strucnjaci za zdravlje = ne monetizira.** https://support.google.com/youtube/answer/1311392
- Disclosure (AI): treba samo za realisticno izmijenjen/generiran sadrzaj; neralisticna animacija ne treba; *kloniranje vlastitog glasa* za voiceover i AI pomoc pri scenariju = "minor", bez oznake. https://support.google.com/youtube/answer/14328491
- Shorts do 3 min (od listopada 2024) [SECONDARY].
- RPM Shorts [UNVERIFIED]: kreatori cesto prijavljuju reda velicine ~0,03-0,10 USD / 1.000 pregleda - nisam nasao pouzdan izvor, provjeriti nakon ulaska u YPP.

### 1.3 Facebook (Content Monetization / Reels)

[PRIMARY - Meta newsroom 18.3.2026]
- Facebook je kreatorima 2025. isplatio gotovo 3 mlrd USD (+35%); 60% na Reels. Content Monetization je **samo na poziv** - interes se prijavljuje u Professional Dashboard -> Monetization -> Content Monetization. Nove metrike: Qualified Views, Earnings Rate (po 1.000 qualified), Non-Qualified Views.
- "Creator Fast Track": 1.000 USD/mj (100k+ followera na IG/TikTok/YT) ili 3.000 USD/mj (1M+) kroz 3 mjeseca + odmah Content Monetization. Zemlje nisu navedene.
  - https://about.fb.com/news/2026/03/creator-fast-track-grow-your-audience-earn-money-on-facebook/
- Hrvatska: **nepotvrdeno** (samo jedan stari blog je navodi). Provjeriti u Professional Dashboardu. [UNVERIFIED]
- Neoriginalni sadrzaj (Meta, 14.7.2025): racuni koji opetovano repostaju tudji sadrzaj gube monetizaciju na odredeno vrijeme i dobivaju manju distribuciju; duplikati videa smanjena distribucija. https://techcrunch.com/2025/07/14/following-youtube-meta-announces-crackdown-on-unoriginal-facebook-content [SECONDARY]
- Monetizacijske politike: "misleading medical information" = *ineligible to monetize* (citirano u Boing Boing / ABC Verify, 8/2026). [SECONDARY] https://boingboing.net/2026/08/07/facebook-pays-ragebait-creators.html

### 1.4 Instagram

- Nema opceg revenue sharea za Reels. Bonusi (Reels Play) uglavnom ugaseni / samo US-JP-KR pilotski; Gifts najprije US. [UNVERIFIED, kontradiktorno]
- Reels do 3 min od 20.1.2025 (Mosseri: "still focused on short form"). https://www.socialmediatoday.com/news/instagram-officially-expands-reels-length-to-3-minutes/737766/ [SECONDARY]
- Originalnost: od 2022 originalni sadrzaj rangiran iznad repostova; travanj 2026 prosireno na cijelu platformu. https://petapixel.com/2026/04/30/new-instagram-policies-target-reposted-content/ [SECONDARY]
- Instagram za nas = doseg + link u bio + brand deals; ne izravan prihod.

### 1.5 X (Twitter)

[SECONDARY - citiraju @XCreators 7.8.2026 i X Help Center]
- Creator Revenue Sharing (od 7/2023) se gasi: zarada do 7.9.2026, zadnja isplata ~11.9.2026.
- Zamjena: **Original Content Rewards**. Uvjeti: 18+, prebivaliste u podrzanoj zemlji ("100+ zemalja", lista na help.x.com - nisam mogao procitati, 403), Personal ili Business racun u dobrom stanju, **aktivna X Premium/Premium+/Premium Business pretplata**, 500+ verificiranih followera i 500.000+ Home Timeline impresija od verificiranih korisnika u 90 dana (replies se ne broje), redovito originalni sadrzaj. Isplata po *valid impression* = jedinstvena impresija Premium korisnika gdje je >50% posta vidljivo; svaka 2 tjedna, min. 30 USD; verifikacija identiteta.
- **Iskljuceno**: kopirani/minimalno izmijenjeni postovi, *"Content reuploaded from other platforms"*, agregacija bez perspektive. [OPINION] Nase video na X objavljivati nativno, bez TikTok watermarka, s X-specificnim tekstom (thread s izvorima) - "reupload s druge platforme" je siva zona za vlastiti video; pratiti.
  - https://gigazine.net/gsc_news/en/20260808-x-original-content-rewards-program/
  - https://www.netinfluencer.com/x-details-eligibility-rules-for-new-original-content-rewards-program/ (3.9.2026)
  - https://help.x.com/en/using-x/original-content-rewards (primarni, nije procitan)

### 1.6 Sazetak za osobu s prebivalistem u Hrvatskoj [OPINION]

| Platforma | Izravni prihod iz HR | Uvjet |
|---|---|---|
| TikTok CRP | **NE** | prebivaliste u US/UK/DE/FR/JP/KR/BR/MX |
| TikTok LIVE darovi | vjerojatno da [UNVERIFIED] | 18+, ~1k followera |
| YouTube Shorts (YPP) | **DA** | 1k pretpl. + 10M Shorts pregleda/90 d |
| YouTube expanded YPP | DA (samo fan funding) | 500 + 3 uploada + 3M/90 d |
| Facebook Content Monetization | nepotvrdeno, na poziv | Dashboard interest form |
| Instagram | prakticki ne | - |
| X Original Content Rewards | moguce, lista nepotvrdena | Premium + 500 ver. followera + 500k impr. |

---

## 2. Verifikacija (plava kvacica)

| Platforma | Moze se kupiti? | Uvjeti / cijena | Izvor |
|---|---|---|---|
| **YouTube** | Ne | 100.000 pretplatnika, 2SV, banner/opis/avatar, autenticnost; promjena imena kanala brise kvacicu | [PRIMARY] https://support.google.com/youtube/answer/3046484 |
| **TikTok** | Ne (besplatno) | autentican, kompletan profil, aktivan, **"notable"** (vise neovisnih medijskih clanaka; PR/sponzorirano se ne broji); followeri nisu formalni uvjet | [UNVERIFIED - blogovi, TikTok stranica JS] https://socialbu.com/blog/get-verified-on-tiktok |
| **Meta Verified** (IG/FB) | Da, pretplata | 18+, 2FA, osobna iskaznica; US ~11,99 USD web / 14,99 USD app; DE app 16,99 EUR/mj; EU web cijena nepotvrdena | [SECONDARY/UNVERIFIED] https://blog.hootsuite.com/meta-verified/ ; leinetal24.de |
| **X** | Da, Premium | plava kvacica dolazi s Premium (pribl. 8 USD/mj, Basic ~3 USD nema kvacicu, Premium+ ~16+ USD); EU cijene nepotvrdene; Premium je ujedno uvjet za Original Content Rewards | [UNVERIFIED] https://subger.com/en/service/x-premium |

[OPINION] Redoslijed: X Premium tek kad se X koristi ozbiljno (inace bacen novac; kvacica na X daje prioritet u odgovorima). Meta Verified ima smisla za zastitu od impersonacije kad brand naraste (i za support). TikTok kvacica dolazi s medijskim spominjanjem - PR plan (Product Hunt, tech/health mediji u HR i EU) je put. YouTube kvacica = 100k.

---

## 3. Sto drzi gledatelje u 60-90 s edukativnim/health videima

### 3.1 Sto kazu platforme
- TikTok nagradjuje *play duration (watch time + finish rate)*, originalnost, search value, engagement [PRIMARY newsroom]. Search value -> izgovoriti i napisati kljucne rijeci ("what happens to your body after drinking Red Bull") u VO, tekstu na ekranu i opisu.
- TikTok for Business (citirano sekundarno): "Introduce your content proposition in the first 3 seconds". [SECONDARY] https://teleprompter.com/blog/tiktok-3-second-rule
- YouTube: serije istog formata su OK ako svaki video ima *distinct storyline/focus* [PRIMARY].

### 3.2 Podaci (oprez - vecinom vendor) [UNVERIFIED]
- Prosjecni hook rate (3 s) ~25-30%, top 40-50% (Motion via NestScale).
- Reels 60-90 s imali najvise prosjecnih pregleda i engagementa u jednoj 2025 analizi; prosjecni Short ~33 s, top Shorts 25-35 s. Metricool (7/2026, 799.718 videa): Shorts pregledi +127% YoY, ali 3x manje vremena po Shortu. https://metricool.com/press-release-youtube-study-2026/ [SECONDARY, velik uzorak]
- AI vs ljudski glas: Adobe anketa (850 potrosaca) - 88% se pitalo je li glas AI, 77% vise vjeruje ljudskom glasu. Nema neovisnog kontroliranog testa za short-form. https://www.adobe.com/express/learn/blog/ai-audio-consumer-trust [SECONDARY, sponzorirano]

### 3.3 Prakse (sinteza; testirati A/B) [OPINION/EXPERIENCE]
- **Hook (0-2 s)**: prvi frame vec u pokretu i vec s obecanjem; nikakav fade-in naslov. Formule: (a) brojka + vrijeme: "20 minuta nakon Red Bulla tvoja jetra..."; (b) kontra-intuicija: "Cola ne podize secer najvise - ovo podize"; (c) direktno "ti": "Evo sto se dogada u tvom tijelu kad popijes kavu na prazan zeludac"; (d) vizualni sok: kamera ulijece u zeludac dok se tekucina izlijeva.
- **Open loop**: najaviti payoff koji dolazi kasnije ("...a sat 6 je najgori dio").
- **Ritam**: novi vizualni dogadaj svakih 2-4 s (rez, zoom, pop-up broj, promjena boje tekucine). Nas "X MIN LATER" + pop-up broj je dobar kostur.
- **Naracija**: ljudski glas (vlasnik, kloniran vlastiti glas za skaliranje) > genericki TTS za povjerenje; brzina ~160-190 rijeci/min; nikad se ne predstavljati kao doktor.
- **Titlovi**: burned-in, 2-4 rijeci po prikazu, sinkronizirani s VO, kljucne rijeci obojene; drzati se safe zone (izbjeci donjih ~20% i desnih ~15% gdje je UI platforme) [UNVERIFIED tocni postoci].
- **Zvuk**: tihi ambient/beat ispod VO (-18 do -24 dB ispod glasa), SFX na pop-up brojeve ("pop", "whoosh" na prijelaz u organ, otkucaj srca kod kofeina). Trending zvukove dodavati u aplikaciji platforme (licenca), ne u export.
- **Loop**: zadnja recenica se spaja s prvom ("...i zato se u 2 ujutro budis - jer 20 minuta nakon Red Bulla..."), zadnji frame = prvi frame.
- **Serija**: "Inside 24h #12" / "Dan 12 od 30" - gradi naviku, potice follow; playlist/Series na TikToku i YT.
- **Cover frame**: veliki broj + namirnica + organ ("+45 mg/dL", "6 h"), konzistentan dizajn za grid profila.
- **CTA**: pitanje koje generira komentare s novim temama ("Koje pice da radim sljedece?") - ujedno besplatan backlog.
- **Izvori na ekranu**: mali chip "EFSA 2015 · razina A" - diferencijacija (vecina science TikToka nema izvore - vidi growth.md).

### 3.4 Primjeri racuna u nisi
| Racun | Velicina | Sto rade | Izvor |
|---|---|---|---|
| Zack D. Films | YouTube ~28,7 M, Instagram ~11,2 M (4.10.2026); ~33 posta tjedno; TikTok podatak nepouzdan | kratki 3D animirani "explainer" klipovi (tijelo, povijest, inzenjering), brz curiosity hook, glas bez lica; navodno tim od 50+ animatora [UNVERIFIED] | https://creatordb.app/creatorstats/zackdfilms/ |
| Institute of Human Anatomy | TikTok ~10,6 M, YouTube ~8,8 M, IG ~2,4 M (7/2026) | stvarna anatomija (kadaveri), pitanja publike, edukatori na kameri | https://creatordb.app/creatorstats/institute-of-human-anatomy/ |
| Nucleus Medical Media | YouTube ~6,9 M (10/2026) | klasicna 3D medicinska animacija, dugi + kratki | https://creatordb.app/creatorstats/nucleusmedicalmedia/ |
| Glucose Goddess (J. Inchauspe) | Instagram ~6,3 M (10/2026) | glukozne krivulje, jednostavni "hackovi" - najblizi nasoj temi (hrana -> krvni secer) | https://creatordb.app/creatorstats/glucosegoddess/ |
| Dr Karan Rajan | IG ~2,2 M; ~7 M+ ukupno (izdavac) | NHS kirurg, brzi mitovi o tijelu/hrani, humor, lice na kameri | https://creatordb.app/creatorstats/drkaranrajan/ |

[OPINION] Nasa pozicija: vizual Zack D. Filmsa + tema Glucose Goddess + izvori/razine dokaza kojih oni nemaju + interaktivna aplikacija iza svakog videa ("probaj sa svojom tezinom").

---

## 4. Health politike - sto nas moze ograniciti i kako ostati siguran

### 4.1 TikTok [PRIMARY - Community Guidelines eff. 13.9.2025, Open Terms Archive]
- **Uklanja se**: *"Health misinformation that could cause significant harm, such as promoting unproven treatments that may be fatal"*, odvracanje od lijecenja.
- **Nije za For You (FYF)**: *"Health misinformation that can result in moderate harm, such as false claims about treating non-life threatening conditions"* -> npr. "ovo lijeci mamurluk/migrenu".
- **Alkohol**: *"In some regions, showing adults having or consuming alcohol"* = FYF ineligible; trgovina alkoholom zabranjena; maloljetnici + alkohol uklonjeno.
- **Dijete/post**: *"Restrictive low-calorie diets, including extended intermittent fasting"* = FYF ineligible; *"Extremely low-calorie diets"*, "fast or drastic weight changes" = uklanja se.
- **AI**: labelirati realisticne AI scene/ljude.
- **Neoriginalno**: FYF ineligible bez "anything new".

### 4.2 YouTube [PRIMARY]
- Medical misinformation: ne smije proturjeciti smjernicama lokalnih zdravstvenih tijela o prevenciji/lijecenju; iznimka za edukativan sadrzaj s kontekstom i za *"Content discussing the results of a specific medical study"*. https://support.google.com/youtube/answer/13813322
- Advertiser-friendly: alkohol - puni oglasi za *"Presence of alcohol or adults drinking alcohol ... without promoting or glorifying irresponsible drinking"*; maloljetnici + alkohol = limited/no ads. Zdravlje - *"Videos that encourage or provide instructions for scientifically unproven remedies"* = bez oglasa; debunking = puni oglasi. Sokantno: edukativni prikaz postupka OK; unobscured organi/tekucine koji dominiraju = limited/no ads. https://support.google.com/youtube/answer/6162278
- [OPINION] Nase stilizirano 3D tijelo (bez krvi, bez stvarnih organa) je zelena zona; izbjegavati "gore" realizam (npr. ciroza jetre fotorealisticno).

### 4.3 Meta [SECONDARY]
- "Misleading medical information" = ne monetizira. Recommendation guidelines: ne preporucuje se *"exaggerated health claims, such as 'miracle cures'"* i prodaja proizvoda na zdravstvenim tvrdnjama. https://help.instagram.com/313829416281232
- Alkohol: oglasi strogo regulirani (to je za oglasivace); za organski sadrzaj nisam nasao specificno ogranicenje osim "prekomjerne konzumacije". [UNVERIFIED]

### 4.4 Pravila za nas (checklist) [OPINION]
1. Nikad "lijeci", "detox", "spaljuje masnoce", "cure". Pisati "u studijama ...", "kod vecine ljudi ...", raspon.
2. Alkohol: prikazivati samo 3D tijelo i case/boce kao ikonu - **nikad ljude koji piju**, nikad "kako se napiti brze", nikad "lijek za mamurluk". Zavrsiti neutralno (ne glorificirati). U opisu: "Educational. 18+ for alcohol topics." Ocekivati da alkohol videi u nekim regijama dobiju manje FYF distribucije -> ne graditi vise od ~1 u 7 videa na alkoholu.
3. Post/dijete: bez "72 h posta", bez "jedi 800 kcal". "Sto se dogada kad preskocis dorucak" je OK ako je neutralno.
4. Kofein: prikazati limite (EFSA 400 mg/dan za odrasle) - ne poticati challenge ("popio sam 5 Red Bulla").
5. Svaka brojka s izvorom (chip na ekranu + izvori u opisu/pinned commentu + link na /food/X).
6. Narrator = "Inside 24h", ne lazni doktor; ako ikad AI avatar - nikad kao lijecnik.
7. AI label na TikToku/YouTubeu kad je sadrzaj realistican; nase 3D tijelo - ne treba (YouTube: neralisticna animacija ne treba disclosure), ali TikTok oznaka "AI-generated" za AI glas nije obavezna po tekstu pravila (odnosi se na scene/ljude) [interpretacija].
8. Disclaimer na kraju: "Not medical advice. Ranges vary between people."

---

## 5. Preporuceni video sustav

### 5.1 Formati (rangirano po procijenjenom viralnom potencijalu) [OPINION]
1. **"What happens in your body after X"** (jedan proizvod, timeline 0-24 h) - core, search-friendly.
2. **"X vs Y"** split-screen (vec imamo CompareVideo): Red Bull vs kava, cola vs cola zero, sok vs voce.
3. **"Your body at 2 AM after ..."** - jedan trenutak (npr. 2 ujutro nakon vecernje kave: kofein jos ~50% u krvi).
4. **Myth-busting** "Diet cola does/doesn't spike insulin?" - komentari + debunking (YouTube: debunking = puni oglasi).
5. **"Ranked"** (5 pica po skoku secera) - list format, visok completion.
6. **"Ti vs prosjek"** - personalizacija (tezina, spol) -> "probaj sa svojim brojkama" CTA za app.
7. **Komentar-odgovor** ("@user pitao: a pivo?") - TikTok reply-to-comment video, besplatan engagement.

### 5.2 Duljina po platformi [OPINION + podaci gore]
| Platforma | Preporuka | Zasto |
|---|---|---|
| TikTok | 62-75 s "full" | search value + watch time; 60 s+ je prag CRP-a ako se ikad preseli; >61 s s marginom za zaokruzivanje encodera |
| YouTube Shorts | 30-45 s "cut" (A/B s 62 s) | prihod po engaged view, kraci = visi completion; top Shorts 25-35 s |
| Instagram Reels | 30-60 s | Mosseri: fokus short-form; test 60-90 s |
| Facebook Reels | 45-75 s | FB placa po qualified views + watch time |
| X | 30-60 s nativno + tekst/thread s izvorima | Premium publika, originalnost |

### 5.3 Struktura 65 s TikToka (sekunda po sekunda)
| Vrijeme | Vizual | VO / tekst |
|---|---|---|
| 0,0-2,0 | Kamera vec leti prema ustima/zelucu, tekucina tece; veliki tekst "1 RED BULL" + "24 h" | "Evo sto jedan Red Bull radi tvom tijelu iducih 24 sata." |
| 2-5 | Open loop: flash-forward na sat "02:00" + mozak treperi | "...a najgori dio dolazi u 2 ujutro." |
| 5-12 | 0-10 MIN: zeludac, pop-up "27 g secera" | konkretna brojka + usporedba ("6 kockica") |
| 12-22 | 20 MIN LATER: krv, secer krivulja raste, pop-up "+X mg/dL" (raspon) | "secer u krvi skace..." |
| 22-32 | 45 MIN: kofein vrh, srce (SFX otkucaj), pop-up "80 mg" | "kofein dostize vrhunac..." |
| 32-38 | Pattern interrupt: crash secera, boja prelazi u plavo, zoom out | "...i onda pad." |
| 38-50 | 5-6 H: pola kofeina jos u krvi, jetra | "Poluzivot kofeina ~5 h (raspon 2-8)" + chip "EFSA · A" |
| 50-58 | 02:00 payoff: mozak, san plici, adenozin | "Zato u 2 ujutro..." |
| 58-63 | Sazetak 3 "lampice" (secer/srce/san) | "Ukratko: ..." |
| 63-66 | CTA + loop: "Sto da napravim sljedece?" + "Probaj sa svojom tezinom: inside24h..." -> kamera se vraca na pocetni kadar | zadnja recenica se spaja s prvom |

Brojke u tablici su ilustrativne - u stvarnom videu dolaze iz modela aplikacije s razinom dokaza (upute.md §2).

### 5.4 Sto treba video engine (gap analiza prema `app/src/v4/share.ts`, `AppV4.tsx`)
Stanje (procitano, nista mijenjano): export 1080x1920 / 1080x1350, 30 fps, H.264 kroz WebCodecs + mp4-muxer (fallback MediaRecorder), intro 1,9 s + outro 3,2 s, "X MIN LATER" pecati, pop-up brojevi, compare split-screen; **samo video staza, bez zvuka**; duzina capped na ~58 s (komentar "Reels limit 61 s").

Prioriteti [OPINION]:
1. **Audio staza** (P0): mp4-muxer `audio` + WebCodecs `AudioEncoder` (AAC `mp4a.40.2`; provjeriti podrsku po pregledniku) ili server-side ffmpeg mux. Slojevi: VO, ambient beat (royalty-free, vlastiti), SFX na dogadaje (pop-up, prijelaz organa, otkucaj srca).
2. **Duljina 62-75 s opcija** (P0): ukloniti 58 s cap za "TikTok full"; zadrzati "short cut" 30-40 s.
3. **Hook-first** (P0): prvi frame bez fade-ina; intro naslov preko vec pokretne scene; opcija "open loop" flash-forward kadar.
4. **Voiceover** (P1): skripta generirana iz istih podataka (headlines/stories) + (a) snimanje vlasnikovog glasa u browseru (MediaRecorder mikrofon, s teleprompter tekstom) ili (b) TTS kloniranim vlastitim glasom (ElevenLabs i sl.; YouTube: vlastiti klonirani glas = minor). Timing videa se prilagodava VO-u (forced alignment ili word timestamps iz TTS-a).
5. **Word-level titlovi** (P1): burned-in, sinkronizirani, safe zone, kljucne rijeci u boji; plus .srt export za nativne titlove (search/accessibility).
6. **3D kamera** (P1): skriptirani pokreti po trenutku - push-in na organ, orbit, cut na detalj; ne staticno tijelo.
7. **Data overlay** (P1): mini graf (krivulja secera/kofeina) koji se crta u realnom vremenu; chip izvora + razina dokaza.
8. **Loop end** (P2): outro koji vizualno vraca na pocetni kadar.
9. **Cover frame PNG** (P2) export + konzistentan dizajn.
10. **Varijante u jednom kliku** (P2): 9:16 full / 9:16 short / 4:5 / bez VO (za trending zvuk u appu) / jezici (EN, kasnije ES/DE/PT/HR; YouTube multi-language audio).
11. **Branding** (P2): mali handle + URL, bez tudjih watermarka; isti font/boje.
12. **Batch / CLI render** (P3): headless render (Playwright + isti kod) za 7 videa odjednom.

### 5.5 Workflow za dnevne uploade [OPINION]
- **Ponedjeljak (2-3 h)**: odabir 7 tema iz kalendara + komentara; za svaku: provjera brojki (Ready proizvod u appu), skripta (hook, open loop, 5 trenutaka, payoff, CTA), snimanje VO.
- **Utorak (2 h)**: batch render 7 x (full + short + 4:5), cover, .srt, opisi s izvorima, hashtag/keyword lista.
- **Svaki dan (20-30 min)**: upload nativno na svaku platformu (TikTok -> Reels -> Shorts -> FB -> X), bez watermarka; prvih 60 min odgovarati na komentare; pinned comment s izvorima + linkom /food/X.
- **Nedjelja (1 h)**: analitika - 3-s hold, prosjecni % gledanja, gdje pada retention krivulja; 1 varijabla A/B po tjednu (hook tip, duljina, VO vs bez).
- Alati za zakazivanje: Meta Business Suite (IG+FB), YouTube Studio, TikTok web scheduler. Izbjegavati third-party auto-poster prvih tjedana (rizik detekcije "automated").
- Ne objavljivati identican video na vise racuna iste platforme; ne koristiti umjetne preglede.

### 5.6 30-dnevni kalendar (rangirano po procijenjenom viralnom potencijalu; [OPINION])
Kriteriji: poznatost proizvoda, iznenadenje, kontroverza bez dezinformacije, search volumen (nije mjeren), sigurnost politike. A = alkohol tema (ogranicen FYF u nekim regijama).

| # | Dan | Tema | Format |
|---|---|---|---|
| 1 | 1 | Red Bull - sto radi 24 h | What happens |
| 2 | 2 | Kava na prazan zeludac | What happens |
| 3 | 3 | Coca-Cola vs Coca-Cola Zero | X vs Y |
| 4 | 4 | Tvoje tijelo u 2 ujutro nakon vecernje kave | 2 AM |
| 5 | 5 | Monster vs Red Bull | X vs Y |
| 6 | 6 | Mit: "diet cola dize inzulin" | Myth |
| 7 | 7 | Jedno pivo - 24 h (A) | What happens |
| 8 | 8 | Narancin sok vs naranca | X vs Y |
| 9 | 9 | 5 pica rangirano po skoku secera | Ranked |
| 10 | 10 | Matcha vs kava | X vs Y |
| 11 | 11 | Krafna/donut - 24 h | What happens |
| 12 | 12 | Reply: najtrazenija tema iz komentara | Reply |
| 13 | 13 | Case vina navecer i san (A) | 2 AM |
| 14 | 14 | Bijeli kruh vs integralni | X vs Y |
| 15 | 15 | Mit: "secer daje energiju" | Myth |
| 16 | 16 | Banana prije treninga | What happens |
| 17 | 17 | Ti (60 kg) vs ti (90 kg) - ista cola | Ti vs prosjek |
| 18 | 18 | Energetsko pice vs espresso - kofein | X vs Y |
| 19 | 19 | Riza + jaje vs riza sama (obrok) | Meal |
| 20 | 20 | Reply / remake najboljeg videa s novim hookom | Reply |
| 21 | 21 | Pizza navecer - 24 h | What happens |
| 22 | 22 | Mit: "kava dehidrira" | Myth |
| 23 | 23 | Shot zestice vs pivo (A) | X vs Y |
| 24 | 24 | Sportski napitak vs voda | X vs Y |
| 25 | 25 | Cokolada (tamna vs mlijecna) | X vs Y |
| 26 | 26 | Ledeni caj u boci | What happens |
| 27 | 27 | 5 dorucaka rangirano | Ranked |
| 28 | 28 | Tvoje tijelo 6 h nakon energetskog pica | Moment |
| 29 | 29 | Reply / serija sazetak "30 pica, sto sam naucio" | Recap |
| 30 | 30 | Glasanje: publika bira temu 31 | CTA |

Napomena: svaki proizvod mora biti "Ready" u aplikaciji (upute.md §2) prije videa; ako nije, zamijeniti temom koja jest. Brand imena (Red Bull, Coca-Cola) - pricati cinjenicno, bez logotipa u kadru (trademark / branded content pravila) [OPINION].

---

## 6. Otvorena pitanja (za vlasnika)
1. Vlasnikov vlastiti glas na engleskom ili kloniranje? (utjece na povjerenje i YouTube "AI persona" pravilo)
2. Jezik kanala: EN (globalno, najveci RPM na YT iz US/UK publike) vs HR? Preporuka: EN.
3. Prihvatljiv li je cilj YouTube YPP kao prvi prihodni milestone (10 M Shorts pregleda u 90 d) umjesto TikTok CRP-a?
4. Plan preseljenja u CRP zemlju ne postoji? Ako ne - CRP izbaciti iz plana i ne optimizirati duljinu iskljucivo za 60 s.

## 7. Izvori (pristupljeno 2026-10-16)
- TikTok CRP uvjeti US (upd. 20.7.2026): https://www.tiktok.com/legal/page/global/creator-rewards-program-us/en
- TikTok CRP uvjeti EEA (upd. 4/2025): https://www.tiktok.com/legal/page/global/tiktok-creator-rewards-program-eea/en
- TikTok newsroom CRP (18.3.2024): https://newsroom.tiktok.com/introducing-the-new-creator-rewards-program?lang=en
- TikTok Community Guidelines (eff. 13.9.2025) via Open Terms Archive: https://github.com/OpenTermsArchive/contrib-versions/blob/main/TikTok/Community%20Guidelines.md
- Quasa, CRP zemlje (27.7.2026): https://quasa.io/media/tiktok-creator-rewards-program-eligible-countries-in-2026
- RPM procjene: https://www.elev8or.io/blog/tiktok-creator-rewards-rpm-2026 , https://ttcalculator.net/learn/tiktok-pay-per-1000-views/
- TikTok USDS: https://www.bgr.com/2083488/tiktok-us-owned-changes-coming/
- YouTube YPP: https://support.google.com/youtube/answer/72851 ; expanded: https://support.google.com/youtube/answer/13429240 ; Shorts revenue: https://support.google.com/youtube/answer/12504220 ; monetization policies: https://support.google.com/youtube/answer/1311392 ; AI disclosure: https://support.google.com/youtube/answer/14328491 ; ad-friendly: https://support.google.com/youtube/answer/6162278 ; medical misinfo: https://support.google.com/youtube/answer/13813322 ; verifikacija: https://support.google.com/youtube/answer/3046484
- Inauthentic content coverage: https://www.plagiarismtoday.com/2025/07/08/youtube-targets-inauthentic-content/
- Meta Creator Fast Track (18.3.2026): https://about.fb.com/news/2026/03/creator-fast-track-grow-your-audience-earn-money-on-facebook/
- Meta unoriginal crackdown: https://techcrunch.com/2025/07/14/following-youtube-meta-announces-crackdown-on-unoriginal-facebook-content
- Meta monetization/medical: https://boingboing.net/2026/08/07/facebook-pays-ragebait-creators.html
- Instagram recommendation guidelines: https://help.instagram.com/313829416281232 ; Reels 3 min: https://www.socialmediatoday.com/news/instagram-officially-expands-reels-length-to-3-minutes/737766/ ; repost policy 2026: https://petapixel.com/2026/04/30/new-instagram-policies-target-reposted-content/
- X Original Content Rewards: https://gigazine.net/gsc_news/en/20260808-x-original-content-rewards-program/ , https://www.netinfluencer.com/x-details-eligibility-rules-for-new-original-content-rewards-program/ , https://help.x.com/en/using-x/original-content-rewards
- Meta Verified: https://blog.hootsuite.com/meta-verified/ ; X Premium: https://subger.com/en/service/x-premium ; TikTok verifikacija: https://socialbu.com/blog/get-verified-on-tiktok
- Retencija/glas: https://metricool.com/press-release-youtube-study-2026/ , https://www.adobe.com/express/learn/blog/ai-audio-consumer-trust , https://teleprompter.com/blog/tiktok-3-second-rule
- Racuni: https://creatordb.app/creatorstats/zackdfilms/ , https://creatordb.app/creatorstats/institute-of-human-anatomy/ , https://creatordb.app/creatorstats/nucleusmedicalmedia/ , https://creatordb.app/creatorstats/glucosegoddess/ , https://creatordb.app/creatorstats/drkaranrajan/
