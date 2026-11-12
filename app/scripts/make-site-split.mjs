// dist-site/ (hosted, code-split build) → ../site/: ready to upload to Netlify / Cloudflare Pages.
// Run after `npx vite build --config vite.site.config.ts`. The single-file way (make-site.mjs) still works too;
// both write site/index.html, so the last one you run is what site/ holds (see DEPLOY.md).
// Never deletes anything: old hashed files in site/assets are kept (harmless, and pages already open in someone's
// browser can still load the chunks they expect). og.png (link preview) is made separately by scripts/make-og.ps1.
import fs from 'node:fs';
import path from 'node:path';
import { absolutize, siteUrl, writeHostFiles } from './site-meta.mjs';

const SRC = 'dist-site', OUT = '../site';
if (!fs.existsSync(`${SRC}/index-v4.html`)) { console.error('Run `npx vite build --config vite.site.config.ts` first.'); process.exit(1); }

fs.mkdirSync(`${OUT}/assets`, { recursive: true });
// audit C8(a): absolute link-preview tags when SITE_URL is set (site-meta.mjs)
const SITE = siteUrl();
const html = absolutize(fs.readFileSync(`${SRC}/index-v4.html`, 'utf8'), SITE);
fs.writeFileSync(`${OUT}/index.html`, html);
let bytes = fs.statSync(`${OUT}/index.html`).size, n = 0;
for (const f of fs.readdirSync(`${SRC}/assets`)) {
  fs.copyFileSync(path.join(SRC, 'assets', f), path.join(OUT, 'assets', f));
  bytes += fs.statSync(path.join(OUT, 'assets', f)).size; n++;
}
// every path serves the app (deep links like /#q=banana work anyway, this covers /anything)
fs.writeFileSync(`${OUT}/_redirects`, '/*  /index.html  200\n');
// _headers (cache rules as before + audit C10 security headers with a CSP for this exact index.html), robots.txt,
// sitemap.xml (with SITE_URL): see site-meta.mjs.
writeHostFiles(OUT, html, SITE);
if (!fs.existsSync(`${OUT}/og.png`)) console.warn('note: site/og.png is missing (link preview image) - run scripts/make-og.ps1');
console.log(`site ready (split build): index.html + ${n} assets, ${(bytes / 1e6).toFixed(2)} MB uncompressed`);
