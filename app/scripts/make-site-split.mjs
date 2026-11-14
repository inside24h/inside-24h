// dist-site/ (hosted, code-split build) → ../site/: ready to upload to Netlify / Cloudflare Pages.
// Run after `npx vite build --config vite.site.config.ts`. The single-file way (make-site.mjs) still works too;
// both write site/index.html, so the last one you run is what site/ holds (see DEPLOY.md).
// Phase 4c (2026-11-14, audit C9, owner-approved): stale hashed files in site/assets (what no file reachable from
// index.html, _headers, _redirects or a manifest mentions, and not part of this build) are first COPIED to
// C:\claudework\inside-24h-backups\<timestamp>-site-assets-prune\ (or I24_PRUNE_BACKUP), checked byte for byte, and
// only then removed from site/assets. `--no-prune` keeps everything (the old behaviour). Then run
// `node scripts/check-site.mjs` to prove every reference still resolves.
// og.png (link preview) is made separately by scripts/make-og.ps1.
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

// ---- prune stale hashed assets (backup first) ----
const fresh = new Set(fs.readdirSync(`${SRC}/assets`));
/** Files in site/assets reachable from the site's entry files, following every mention of a file name (a plain
 *  substring match, the same rule as check-site.mjs: it errs on the side of "referenced"). */
function reachable(site) {
  const dir = path.join(site, 'assets'), names = fs.readdirSync(dir), TEXT = /\.(html|js|mjs|css|json|webmanifest|txt|svg|xml)$/i;
  const roots = ['index.html', '_headers', '_redirects', 'manifest.webmanifest', 'manifest.json', 'sw.js', 'robots.txt', 'sitemap.xml', ...fs.readdirSync(site).filter((f) => /\.html$/i.test(f))]
    .map((f) => path.join(site, f)).filter((f, i, a) => fs.existsSync(f) && a.indexOf(f) === i);
  const seen = new Set(), queue = [...roots];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    if (!TEXT.test(file) && !roots.includes(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    for (const nm of names) if (src.includes(nm)) queue.push(path.join(dir, nm));
  }
  return new Set(names.filter((nm) => seen.has(path.join(dir, nm))));
}
if (!process.argv.includes('--no-prune')) {
  const live = reachable(OUT), dir = path.join(OUT, 'assets');
  const stale = fs.readdirSync(dir).filter((nm) => !live.has(nm) && !fresh.has(nm) && fs.statSync(path.join(dir, nm)).isFile());
  if (!live.size) console.warn('prune skipped: nothing in site/assets is referenced (is site/index.html the split build?)');
  else if (stale.length) {
    const d = new Date(), z = (x) => String(x).padStart(2, '0'); // (local time, as the other backups)
    const stamp = `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`;
    const backup = path.join(process.env.I24_PRUNE_BACKUP ?? 'C:/claudework/inside-24h-backups', `${stamp}-site-assets-prune`);
    fs.mkdirSync(backup, { recursive: true });
    let freed = 0;
    for (const nm of stale) {
      const from = path.join(dir, nm), to = path.join(backup, nm);
      fs.copyFileSync(from, to);
      // (removed only once its copy is there, byte for byte)
      if (!fs.readFileSync(from).equals(fs.readFileSync(to))) { console.error(`prune stopped: the backup of ${nm} differs`); process.exit(1); }
    }
    for (const nm of stale) { freed += fs.statSync(path.join(dir, nm)).size; fs.rmSync(path.join(dir, nm)); }
    console.log(`pruned ${stale.length} stale assets (${(freed / 1e6).toFixed(2)} MB), backed up first to ${backup}`);
  } else console.log('prune: no stale assets');
}
console.log(`site ready (split build): index.html + ${n} assets, ${(bytes / 1e6).toFixed(2)} MB uncompressed`);
