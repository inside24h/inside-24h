# Upute za rad na projektu Inside 24h

Ove upute vrijede za svaku sesiju rada na projektu (za Claudea i za sve agente).

## 0. Srž projekta (zapamtiti zauvijek)

Inside 24h je **normie-friendly simulacija JEDNOG proizvoda** (hrane ili pića): kuda ulazi, kojim točno crijevima prolazi, gdje ide, koliko dugo ostaje i što od 0 do 24 h radi organizmu — običnim jezikom: što raste, što pada, na što utječe. Vizualno: **tekućina** koja prolazi kroz dijelove tijela (ne točkice), što jasnije i ljepše. Svaki čovjek mora razumjeti u sekundi. Ne radimo dnevnik "što sam sve pojeo"; skupljamo samo podatke potrebne da što točnije izračunamo kako npr. jedna čaša cole djeluje na tu osobu. Detaljni prikazi su opcija, ne glavni ekran.

## 1. Podjela posla po modelima

| Posao | Model | Napomena |
|---|---|---|
| Znanstveni modeli (kofein, šećer, ...), odluke o točnosti, arhitektura | **Opus** (glavna sesija) | Sve brojke ulaze u aplikaciju tek nakon Opusove provjere |
| Istraživanje radova i izvlačenje brojki za novi proizvod | **Sonnet** agent | Piše samo `research/<proizvod>.md`, ništa drugo ne mijenja |
| Testiranje aplikacije (klikanje, snimke, popis grešaka) | **Haiku** agent | Nakon svake veće promjene; samo prijavljuje, ne popravlja |
| Jednostavne izmjene koda (tekst, stil) | **Sonnet** agent | Opus pregleda prije objave |

Pravila:
- Istraživanje više proizvoda radi se **paralelno** (jedan agent po proizvodu).
- Agenti vraćaju **kratak sažetak**; detalji ostaju u datotekama, ne u razgovoru.
- Snimke ekrana samo kad nešto stvarno treba provjeriti.

## 2. Pravilo točnosti (najvažnije)

Svaka tvrdnja ima razinu dokaza i izvor:

| Razina | Značenje |
|---|---|
| **A** | Utvrđeno: dosljedne studije na ljudima ili službeno tijelo (EFSA, ESH, ADA...) |
| **B** | Podržano: studije na ljudima, ali male ili s velikim razlikama |
| **C** | Naša procjena: pokazana računica i pretpostavke |
| **?** | Nije istraženo: piše zašto i što bi trebalo izmjeriti |

- Brojke se uzimaju samo iz izvora koji je stvarno pročitan (sažetak ili cijeli tekst). Nikad po sjećanju.
- Gdje se ljudi razlikuju, prikazuje se raspon.
- Tvrdnja viđena samo u sekundarnom izvoru označava se kao **"source pending"** dok se ne provjeri.
- Opus nasumično provjerava ključne brojke iz agentskih izvještaja (otvori izvor i usporedi) prije ugradnje.
- Proizvod je u tražilici **"Ready"** tek kad je istražen do kraja i ima testirani model. Do tada stoji **"In research"**.

## 3. Alati za istraživanje

```
cd research/tools
python epmc.py search '<upit>' 10        # ~ umjesto navodnika u upitu
python epmc.py abs <PMID ili PMCID>      # citat + sažetak
python epmc.py grep <PMCID> '<regex>'    # rečenice iz cijelog teksta (open access)
```
- PubMed/NCBI stranice blokira captcha, pa se koristi Europe PMC (ovaj alat).
- USDA FoodData Central: API s `api_key=DEMO_KEY`.

## 4. Struktura

```
research/        dosjei po proizvodu (espresso.md, cola.md, vitals-circadian.md) + alati + izvori
pipeline/        pretvorba anatomije (BodyParts3D → anatomy.glb, točke unutar organa, volumeni)
app/src/science  modeli s testovima (Vitest)
app/src/content  tvrdnje, izvori, opisi organa
app/src/v4       trenutno sučelje (verzija 0.4+)
```

## 5. Izgradnja i objava

```
cd app
npx vitest run                                  # svi testovi moraju proći
npx tsc --noEmit                                # bez grešaka u tipovima
npx vite build --config vite.v4.config.ts
node scripts/to-artifact-v4.mjs                 # → dist-v4/artifact.html
```
Objava: isti link https://claude.ai/artifact/MNAAYw76bCR6rqEqbAdopH

Brza provjera u pregledniku: `dist-v4/index-v4.html#t=<minute>&organ=<organ>&dose=<mg>` otvara točan trenutak.

## 6. Datoteke

- Prije **brisanja** ili **prepisivanja cijele** datoteke pitati korisnika (osobna pravila).
- Ako korisnik nije dostupan, nova verzija ide u **novu datoteku** pod drugim imenom.
- Anatomija: obavezno navesti *"BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International"*.

## 7. Jezik i ton

- Razgovor s korisnikom: hrvatski, latinica.
- Sadržaj aplikacije: engleski (publika na X-u je globalna); tražilica razumije i hrvatske nazive.
- Sučelje mora biti jednostavno za sve dobi: jedna jasna rečenica po fazi, detalji na klik.
