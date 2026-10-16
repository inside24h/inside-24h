// dist-site/ (hosted, code-split build) → ../site/: ready to upload to Netlify / Cloudflare Pages.
// Run after `npx vite build --config vite.site.config.ts`. The single-file way (make-site.mjs) still works too;
// both write site/index.html, so the last one you run is what site/ holds (see DEPLOY.md).
// Never deletes anything: old hashed files in site/assets are kept (harmless, and pages already open in someone's
// browser can still load the chunks they expect). og.png (link preview) is made separately by scripts/make-og.ps1.
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'dist-site', OUT = '../site';
if (!fs.existsSync(`${SRC}/index-v4.html`)) { console.error('Run `npx vite build --config vite.site.config.ts` first.'); process.exit(1); }

fs.mkdirSync(`${OUT}/assets`, { recursive: true });
fs.copyFileSync(`${SRC}/index-v4.html`, `${OUT}/index.html`);
let bytes = fs.statSync(`${OUT}/index.html`).size, n = 0;
for (const f of fs.readdirSync(`${SRC}/assets`)) {
  fs.copyFileSync(path.join(SRC, 'assets', f), path.join(OUT, 'assets', f));
  bytes += fs.statSync(path.join(OUT, 'assets', f)).size; n++;
}
// every path serves the app (deep links like /#q=banana work anyway, this covers /anything)
fs.writeFileSync(`${OUT}/_redirects`, '/*  /index.html  200\n');
// Netlify + Cloudflare Pages: hashed files never change → cache for a year; the page itself always revalidates,
// so a new deploy is picked up at once.
fs.writeFileSync(`${OUT}/_headers`, [
  '/assets/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '',
  '/',
  '  Cache-Control: no-cache',
  '',
  '/index.html',
  '  Cache-Control: no-cache',
  '',
  '/og.png',
  '  Cache-Control: public, max-age=86400',
  '',
].join('\n'));
if (!fs.existsSync(`${OUT}/og.png`)) console.warn('note: site/og.png is missing (link preview image) - run scripts/make-og.ps1');
console.log(`site ready (split build): index.html + ${n} assets, ${(bytes / 1e6).toFixed(2)} MB uncompressed`);
