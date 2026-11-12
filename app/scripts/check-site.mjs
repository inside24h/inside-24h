// Audit C9 (2026-11-12): what in site/ is actually used, and does every reference resolve?
//   node scripts/check-site.mjs            -> verify: every asset URL in index.html, the chunks and the CSS exists
//   node scripts/check-site.mjs --unused   -> also list the files in site/assets that nothing reachable references
// "Reachable" starts at site/index.html (+ _headers, _redirects) and follows, file by file, every mention of a file
// name in site/assets (imports, import() calls, Vite's preload lists, CSS url(), new URL(..., import.meta.url), the
// .glb path) - a plain substring match, so it errs on the side of "referenced". Exit code 1 when something is missing.
import fs from 'node:fs';
import path from 'node:path';

const SITE = path.resolve(process.argv.find((a) => a.startsWith('--site='))?.slice(7) ?? '../site');
const ASSETS = path.join(SITE, 'assets');
const names = fs.existsSync(ASSETS) ? fs.readdirSync(ASSETS) : [];
const TEXT = /\.(html|js|mjs|css|json|webmanifest|txt|svg)$/i;

// --index=<file>: start from another index.html (e.g. the previous release's, from git show) instead of site/index.html
const INDEX = process.argv.find((a) => a.startsWith('--index='))?.slice(8);
const roots = [INDEX ? path.resolve(INDEX) : 'index.html', '_headers', '_redirects', 'manifest.webmanifest', 'sw.js'].map((f) => path.resolve(SITE, f)).filter((f) => fs.existsSync(f));
const seen = new Set(), queue = [...roots], missing = [];
// any asset-looking reference: assets/<name>, ./<name>.<ext> inside a chunk, url(<name>)
const REF = /(?:\/?assets\/|\.\/)([\w.@-]+\.(?:js|mjs|css|glb|gltf|bin|wasm|onnx|woff2?|ttf|otf|png|jpe?g|webp|avif|gif|svg|mp3|wav|ogg|mp4|webm|json))(?=[?#"'`)\s,]|$)/g;
while (queue.length) {
  const file = queue.pop();
  if (seen.has(file)) continue;
  seen.add(file);
  if (!TEXT.test(file) && !roots.includes(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  for (const n of names) if (src.includes(n)) queue.push(path.join(ASSETS, n));
  for (const m of src.matchAll(REF)) {
    const n = m[1];
    if (!names.includes(n) && !missing.some((x) => x.n === n)) missing.push({ n, from: path.relative(SITE, file) });
  }
  if (file === roots[0]) for (const m of src.matchAll(/(?:href|src|content)="\/?([\w.-]+\.(?:png|jpe?g|svg|ico|webmanifest|txt|xml))"/g))
    if (!fs.existsSync(path.join(SITE, m[1]))) missing.push({ n: m[1], from: 'index.html' });
}
const used = names.filter((n) => seen.has(path.join(ASSETS, n)));
const size = (ns) => ns.reduce((s, n) => s + fs.statSync(path.join(ASSETS, n)).size, 0);
const unused = names.filter((n) => !used.includes(n));
console.log(`site/assets: ${names.length} files, ${(size(names) / 1e6).toFixed(2)} MB; referenced from index.html: ${used.length} (${(size(used) / 1e6).toFixed(2)} MB); unreferenced: ${unused.length} (${(size(unused) / 1e6).toFixed(2)} MB)`);
if (process.argv.includes('--unused')) for (const n of unused) console.log(`unused ${n}`);
if (process.argv.includes('--used')) for (const n of used) console.log(`used ${n}`);
for (const m of missing) console.error(`MISSING ${m.n} (referenced from ${m.from})`);
if (!used.length) { console.error('no asset is referenced: is site/index.html the split build?'); process.exit(1); }
process.exit(missing.length ? 1 : 0);
