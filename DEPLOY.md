# Kako staviti Inside 24h na vlastitu domenu

Mapa `C:\claudework\inside-24h\site` je gotova web stranica (index.html + og.png + _redirects). Ne treba server.

## Najlakše: Netlify (besplatno)
1. Napravi račun na netlify.com (ti, ne Claude).
2. Sites → „Add new site“ → „Deploy manually“ → povuci mapu `site` u prozor.
3. Dobiješ link tipa `ime.netlify.app` — radi odmah, svatko ga može otvoriti.
4. Domena: kupi npr. `inside24h.com` (Namecheap, Cloudflare, ~10 €/god) → u Netlifyju „Domain settings“ → dodaj domenu → slijedi upute za DNS.

Alternativa: Cloudflare Pages (pages.cloudflare.com → „Upload assets“ → ista mapa).

## Nova verzija
U `C:\claudework\inside-24h\app`:
```
npx vite build --config vite.v4.config.ts
node scripts/make-site.mjs
```
pa ponovno povuci mapu `site` u Netlify (Deploys → povuci).

## Brža verzija za web (preporučeno za domenu)
Za ljude koji dolaze s mobitela (TikTok/Instagram) postoji i **podijeljena** verzija: prvo se učita samo
početni ekran i sučelje (~175 KB gzip kôda + baza hrane i klima ~67 KB gzip, paralelno; izrada videa
se učitava tek u pozadini nakon prvog ekrana), a 3D tijelo (three.js + model `.glb`) stiže odmah iza toga u pozadini.
Link koji odmah otvara hranu (`#q=…`, `#m=…`) 3D počne skidati odmah.
```
npx vite build --config vite.site.config.ts
node scripts/make-site-split.mjs
```
`site/` tada sadrži `index.html` + mapu `assets/` (datoteke s hashom u imenu) + `_redirects` + `_headers` + `og.png`.
`_headers` (Netlify i Cloudflare Pages ga čitaju sami): `assets/*` se cachira godinu dana (ime se mijenja sa svakom
novom verzijom), `index.html` se uvijek provjerava, pa nova objava vrijedi odmah. Povuci cijelu mapu `site` kao i prije.

Obje verzije i dalje rade:
| | naredbe | rezultat |
|---|---|---|
| jedna datoteka (offline, artifact, slanje datoteke) | `npx vite build --config vite.v4.config.ts` + `node scripts/make-site.mjs` | `site/index.html` (~2,6 MB, sve unutra) |
| podijeljena (web hosting, brža) | `npx vite build --config vite.site.config.ts` + `node scripts/make-site-split.mjs` | `site/index.html` + `site/assets/` |

Zadnja pokrenuta `make-site*` naredba određuje što je u `site/index.html`. Stare datoteke u `site/assets/` se ne
brišu (ne smetaju). Veličine po dijelovima: `SITE_REPORT=1 npx vite build --config vite.site.config.ts`.

## Napomene
- Na vlastitoj domeni gumb „Save video“ sprema datoteku izravno (bez claude.ai potvrde).
- og.png = slika koja se pokaže kad netko podijeli link (WhatsApp, X, Instagram DM).
- Prognoza vremena uživo i „Javi mi kad Pro izađe“ mogu se dodati tek kad je stranica na domeni.

## Adresa stranice za pregled linka (og:image) — audit C8(a)
Stranica još nema domenu, pa nijedna adresa nije upisana. Kad stranica dobije adresu, postavi je **na jednom mjestu**,
varijablom `SITE_URL` (može i `VITE_SITE_URL`) prije `make-site*` naredbe, npr. u PowerShellu:
```
$env:SITE_URL='https://tvoja-adresa.netlify.app'; node scripts/make-site-split.mjs
```
Tada `og:image`, `og:url` i `twitter:image` postanu apsolutni (Facebook, LinkedIn i X to traže), doda se `canonical`,
a uz `robots.txt` nastane i `sitemap.xml`. Bez `SITE_URL` oznake ostaju relativne (WhatsApp/iMessage i dalje rade) i
skripta ispiše napomenu. Kod je u `app/scripts/site-meta.mjs`.

## Sigurnosna zaglavlja — audit C10
`make-site.mjs` i `make-site-split.mjs` pišu `site/_headers` (Netlify i Cloudflare Pages ga čitaju sami) s:
Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, X-Frame-Options, Permissions-Policy i
Cross-Origin-Opener-Policy, uz dosadašnja cache pravila. CSP dopušta samo ovu stranicu, `cdn.jsdelivr.net` (glasovni
engine kokoro-js) i Hugging Face (glasovni model, ~90 MB, tek kad netko uključi glas u videu); inline skripte u
`index.html` dopuštene su točnim sha256 hashom, izračunatim pri svakom buildu. Ako hosting ne čita `_headers`
(npr. GitHub Pages), ista zaglavlja treba upisati u njegove postavke — vrijednosti su u `site/_headers`.
