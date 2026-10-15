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

## Napomene
- Na vlastitoj domeni gumb „Save video“ sprema datoteku izravno (bez claude.ai potvrde).
- og.png = slika koja se pokaže kad netko podijeli link (WhatsApp, X, Instagram DM).
- Prognoza vremena uživo i „Javi mi kad Pro izađe“ mogu se dodati tek kad je stranica na domeni.
