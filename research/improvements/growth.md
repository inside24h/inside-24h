# Inside 24h - growth research (2026-10-15)

Napomena o pouzdanosti: web pretraga je vratila uglavnom marketinske blogove; primarnih podataka (Show HN, search volume, brojke velikih racuna) gotovo nema. Stavke oznacene [SOURCE] imaju URL; [EXPERIENCE] su opce prakse koje nisam uspio potvrditi izvorom - tretirati kao hipoteze za A/B test.

## 1. Viralni "what happens to your body after X" kratki video
- [SOURCE] Sources se ne slazu oko duzine: ~10-25 s (sweet spot ~17 s) za TikTok vs. studije koje kazu da 3-10 min dobije ~2x views od 6-10 s klipova (kompromis reach vs completion). Reels do 3 min od sijecnja 2025, Shorts do 3 min. Citaj vlastitu retention krivulju.
  - https://www.shortimize.com/blog/video-length-sweet-spots-tiktok-reels-shorts
  - https://www.shortimize.com/blog/compare-watch-time-tiktok-vs-reels-vs-shorts
- [SOURCE, vendor claim] 3-sekundna retencija <~70% ubija reach; prosjecni hook rate ~25-30%, top 40-50%. Tekst overlay i pokret u prvim sekundama.
  - https://virlo.ai/blog/why-the-first-few-seconds-matter
  - https://nestscale.com/?p=47200
- [SOURCE] Engagement benchmark: racuni <100K ~7.5%, >10M ~2.9%; Health & Beauty nize od prosjeka.
  - https://emplicit.co/tiktok-engagement-rate-benchmarks-2025/
- [SOURCE] Studija 2025: profesionalni kreatori u science TikToku cesto imaju nizi engagement od neprofesionalnih, a znanstvene tvrdnje su cesto bez izvora -> prostor za diferencijaciju: izvori na ekranu.
  - https://theses.liacs.nl/pdf/2025-2026-TuinAvanderAmber.pdf
- [EXPERIENCE] Format koji odgovara proizvodu: hook = brojka+vrijeme+namirnica u prvom kadru ("45 MIN nakon Red Bulla: 120 mg kofeina u krvi"); 3D tijelo kao vizual; 3-5 "X MIN LATER" rezova; zadnji kadar = pitanje za komentar ("Koju hranu da radim sljedecu?"); cover frame s velikim brojem i namirnicom; titlovi burned-in; 1 post dnevno po platformi, isti video reuse (Reels/TikTok/Shorts/X) bez watermarka.
- [EXPERIENCE] Serijski naslov ("Inside 24h #37: Red Bull") gradi naviku; komentari "radi X" daju beskonacan content backlog.

## 2. Shareable web-tool taktike
- [SOURCE] OG slika: 1200x630 (1.91:1); OG tagovi ne utjecu izravno na ranking, ali na CTR s drustvenih mreza. Dinamicki OG generatori postoje (npr. Cardstock, vendor) - ali u Next/Vite se moze samostalno (satori / @vercel/og).
  - https://swetrix.com/tools/og-preview?lng=fr
  - https://hunted.space/product/cardstock
- [EXPERIENCE] Deep linkovi: /food/red-bull?t=45min&compare=coffee -> otvara tocno taj trenutak; svaki od 149 foodova = statican SEO URL s title "What happens in your body after a Red Bull (0-24h)", FAQ schema, vlastita OG slika s brojkom. Search volume za "what happens after drinking coffee" nisam uspio potvrditi izvorom - provjeri u Google Search Console / Keyword Planner prije prioriteta.
- [EXPERIENCE] "Challenge a friend": share kartica "Tvoj kofein u 22:00 = 40 mg - usporedi s mojim"; embed iframe za blogere/novinare (backlinkovi); gumb "Share this moment" koji generira sliku 4:5 + link.
- [EXPERIENCE] Primarni funnel: video -> link u bio -> /food/X (ne homepage).

## 3. Launch kanali
- [SOURCE] Product Hunt: bez malog followinga ne stvara momentum, samo ga pojacava; relaunch s demo videom i interaktivnim demom (bez signupa) dosao do top 3-10; Uto/Sri bolje; dan pocinje ponoc PST. Pinggy 2026 tvrdi da PH radi pouzdano za uzi segment launcheva.
  - https://hackernoon.com/lite/i-turned-a-failed-product-hunt-launch-into-a-top-3-win-on-a-budget
  - https://www.indiehackers.com/post/how-to-successfully-launch-on-product-hunt-and-become-the-product-of-the-week-5a2ea67d90
  - https://pinggy.io/blog/best_producthunt_alternatives/
- [SOURCE] Show HN: ocekuje se da si maker i odgovaras u komentarima; novi racuni mogu biti uklonjeni kao self-promo (jedan 2020 anegdotski slucaj). Nema cvrstih 2025 podataka.
  - https://www.stackmatix.com/blog/launching-on-hacker-news
  - https://www.indiehackers.com/product/dual-kind/launched-on-hn-and-product-hunt-fail--MChQEqWpqJBpiigZLPW
- [SOURCE] Reddit: pravila su po subredditu; r/SideProject opisan kao popustljiv; 9:1 / 10:1 pravilo nepotvrdeno kao sluzbeno. Citaj sidebar, vrijednost prije linka.
  - https://www.teract.ai/resources/reddit-subreddit-marketing-2026
  - https://www.indiehackers.com/post/every-subreddit-has-different-unwritten-rules-and-heres-how-to-decode-them-before-posting-1wSck8RGykjDv4FAwS69
- [EXPERIENCE] Show HN naslov: "Show HN: Pick a food, watch it travel through a 3D body for 24h" (tehnicki kut: WebGL, bez signupa). Kandidati subredditi: r/SideProject, r/webdev (showoff subota), r/dataisbeautiful (samo ako vizual stoji sam), r/nutrition (vjerojatno zabranjeno - pitaj mod). Jedan veliki launch tek kad ima ~20 foodova s polish-om i demo GIF.

## 4. Kredibilitet i pravila platformi
- [SOURCE] TikTok zabranjuje dezinformacije koje mogu uzrokovati znacajnu stetu (medicinske ukljucene); smjernice azurirane 13.9.2025 - provjeri izvornik. Izvanjski nalazi: 1 od 5 predlozenih videa sadrzi dezinformacije; 42% videa o dijabetickom stopalu zavaravajuce.
  - https://www.tiktok.com/community-guidelines/en/integrity-authenticity
  - https://www.medicaleconomics.com/view/1-in-4-physicians-support-a-tiktok-ban-citing-health-misinformation
- [SOURCE] YouTube: uklanja sadrzaj koji proturjeci lokalnim zdravstvenim tijelima/WHO za prevenciju, tretman, ukljanjanje odredjenih stanja.
  - https://blog.youtube/inside-youtube/a-long-term-vision-for-medical-misinformation-policies/
- [EXPERIENCE] Zastita: u svakom videu burned-in "Procjena, prosjecna odrasla osoba, nije savjet"; izvor na zadnjem kadru; evidence grade vidljiv; nikad "lijeci/detox"; alkohol/voznja = uvijek "ne vozi", nikad prag "sigurno"; pregled od strane strucnjaka (dijetetičar/MD) = jaki trust signal; stranica /methods s izvorima i modelima.
- Prilika: studija iznad kaze da znanstveni TikTok cesto nema izvore - "evidence-graded" je USP.

## 5. Monetizacija
- [SOURCE] Freemium->paid mediana ~2.1-2.2% (RevenueCat/Adapty), top 6-8%; hard paywall ~10-12% trial conversion; health&fitness trial-to-paid median ~40% (samo trial modeli). Ovo su mobilne app brojke.
  - https://adapty.io/blog/freemium-to-premium-conversion-techniques
  - https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026.md
  - https://www.builtbyfoundry.io/blog/creator-app-benchmarks-numbers-to-hit-2026
  - https://athletechnews.com/fitness-apps-monetizable-winner-take-all-or-most/
- Donacije: pouzdanih benchmarka nisam nasao. [EXPERIENCE, hipoteza] tipicno <0.5% posjetitelja donira; uz 100k mjesecnih posjetitelja to je reda stotina EUR. Solana-only je nisko-konverzijski za siru publiku - dodaj kartice (Ko-fi/Buy Me a Coffee/Stripe link).
- Realno: Pro EUR 8/mj ima smisla tek uz ~50-100k MAU: 2% = 1-2k korisnika... ali prvo valja potvrditi trazenje. Pro ideje: spremi osobni dnevnik, vlastite kombinacije obroka, PDF/video export bez watermarka, batch Reels.
- Affiliate za zdravlje (suplementi) = konflikt interesa s evidence-grade USP; izbjegavati ili jasno oznaciti.
