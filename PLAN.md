# Inside 24h — plan projekta

Aplikacija koja u 3D-u pokazuje što se događa u tijelu nakon što nešto pojedeš ili popiješ:
kamo hrana ide, gdje se zadržava, što ulazi u krv, koji organi reagiraju i koliko dugo.

Cilj: najtočniji i vizualno najjači prikaz "hrane u tijelu" na internetu. Publika i ime na X-u
kroz dnevne objave ("Što se događa u tijelu 45 minuta nakon Red Bulla").

---

## 1. Pravilo točnosti (najvažnije pravilo projekta)

Svaka tvrdnja u aplikaciji ima **razinu dokaza** i **izvor ili izračun**. Bez toga ne ide u aplikaciju.

| Razina | Značenje | Što prikazujemo |
|---|---|---|
| **A · Utvrđeno** | Dosljedni rezultati na ljudima, autoritativni izvor (EFSA, FDA, USDA, udžbenik fiziologije, meta-analiza) | Tvrdnja + citat |
| **B · Podržano** | Postoje studije na ljudima, ali malo njih ili velika varijabilnost | Tvrdnja + citat + "rezultati variraju" |
| **C · Naša procjena** | Nema izravnih podataka. Izvodimo iz poznatih parametara modelom | Tvrdnja + formula + pretpostavke + raspon nesigurnosti |
| **? · Nepoznato** | Ne može se ni razumno procijeniti | "Još nije istraženo" + zašto + što bi trebalo izmjeriti |

Pravila:
- Nikad jedan broj bez raspona kad se ljudi razlikuju (npr. poluživot kofeina 2,5–10 h, tipično ~5 h).
- Izvore čitam i provjeravam sam. Ništa se ne citira po sjećanju.
- Procjene (C) uvijek pokazuju računicu, da je svatko može provjeriti.
- Nema senzacionalizma. Ako viralna infografika tvrdi nešto netočno, mi pokazujemo što je stvarno.
- Aplikacija nije medicinski savjet. To stoji jasno, ali nenametljivo.

## 2. Modeli (matematika iza animacije)

Animacija se ne crta "od oka". Pokreću je modeli s parametrima iz literature:

- **Pražnjenje želuca:** tekućine eksponencijalno (poluvrijeme ovisi o kalorijama), krutine kao lag faza + linearno pražnjenje.
- **Prolaz kroz crijeva:** tanko crijevo, pa debelo crijevo, s rasponima prolaza.
- **Apsorpcija i krv (farmakokinetika):** jednokompartmentni model s apsorpcijom prvog reda
  `C(t) = F·D·ka / (Vd·(ka−ke)) · (e^(−ke·t) − e^(−ka·t))`, s parametrima po tvari (kofein, alkohol, ...).
- **Glukoza:** izmjerene krivulje odgovora i glikemijski indeks/opterećenje iz objavljenih tablica, prikazane s rasponom.
- **Personalizacija (kasnije):** masa, spol, dob, pušenje, trudnoća i slično mijenjaju parametre (npr. Vd, poluživot).

Modeli imaju automatske testove: izračun mora reproducirati objavljene vrijednosti (npr. vrijeme vrha kofeina).

## 3. 3D anatomija

- Izvor: **BodyParts3D** (DBCLS), stvarni anatomski modeli organa.
  Licenca CC BY 4.0. Obavezno navesti: *"BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International"*.
- Pipeline: OBJ → odabir organa → spajanje → glTF + kompresija (meshopt) za brzo učitavanje u browseru.
- Prikaz: poluprozirno tijelo, organi u pravim pozicijama i oblicima, probavni trakt kao put kojim hrana stvarno putuje.
- Hrana se prikazuje u stvarnom stanju: zalogaj, kaša u želucu (himus), tekućina, apsorbirane molekule u krvi.

## 4. Tehnologija

- Web aplikacija: Vite + TypeScript + React + Three.js (react-three-fiber).
- Podaci: svaki proizvod je datoteka s događajima, tvrdnjama, razinama dokaza i izvorima.
- Testovi: Vitest za modele.
- Objava: statički hosting (npr. Cloudflare Pages ili Vercel) kad bude spremno.

## 5. Struktura mape

```
inside-24h/
  PLAN.md            ovaj dokument
  research/          istraživanje po proizvodu: tvrdnje, izvori, razine dokaza
  pipeline/          skripte za pretvorbu anatomskih modela
  data/raw/          preuzeti izvorni podaci (ne mijenjaju se)
  app/               web aplikacija
```

## 6. Faze

1. **Temelj:** anatomski model u browseru (organi na pravim mjestima), struktura podataka za tvrdnje i izvore.
2. **Prvi proizvod do kraja:** espresso, jer je kofein najbolje istražena tvar s preciznim farmakokinetičkim podacima. Služi kao zlatni standard za sve ostale.
3. **Drugi i treći proizvod:** cola, banana.
4. **Personalizacija:** masa, dob, spol i slično.
5. **Alati za objave:** export videa i slika za X (vertikalni format, 15–60 s).
6. **Proširenje:** novi proizvodi svaki tjedan (energetsko piće, alkohol, pizza, proteinski shake, ...).
