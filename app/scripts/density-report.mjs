// Phase P2 (roadmap 2026-11-24, "Cross-phase measurement"): the v5 density report, from the headless timeline of the
// text audit's videos (no renders): facts per 10 s, the item-specific share, the generic share, the question time and
// the actions, per item × cut and for a seeded set of comparisons (src/v4/density.ts, bundled with esbuild).
//   node scripts/density-report.mjs [--every=24] [--pairs=300] [--only=espresso,beer] [--cuts=long,short]
//                                   [--label="after (P2)"] [--prev=<an earlier report to keep as "before">] [--out=<file>]
// Default --out: research/improvements/density-<today>.txt. Nothing leaves the machine.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const every = Number(arg('every', '24')), pairs = Number(arg('pairs', '300'));
const only = (arg('only', '') || '').split(',').map((s) => s.trim()).filter(Boolean), cuts = (arg('cuts', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const today = new Date().toISOString().slice(0, 10);
const out = path.resolve(arg('out', path.join(here, '..', '..', 'research', 'improvements', `density-${today}.txt`)));
const label = arg('label', 'now');

const { build } = await import('esbuild');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'i24-density-'));
const outfile = path.join(tmp, 'density.mjs');
await build({ entryPoints: [path.join(here, '..', 'src', 'v4', 'density.ts')], bundle: true, platform: 'node', format: 'esm', outfile, logLevel: 'error',
  loader: { '.json': 'json', '.css': 'empty', '.png': 'empty', '.svg': 'empty', '.glb': 'empty' }, jsx: 'automatic', define: { 'import.meta.env': '{}' },
  // (vite's asset imports, "anatomy.glb?url": nothing a headless timeline loads)
  plugins: [{ name: 'vite-query', setup(b) { b.onResolve({ filter: /\?(?:url|raw|worker|inline)$/ }, (a) => ({ path: a.path, namespace: 'stub' })); b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export default "";', loader: 'js' })); } }] });
const mod = await import(pathToFileURL(outfile).href);
const t0 = Date.now();
const rows = mod.densityRows({ every, pairs, only, cuts });
const head = `Inside 24h · video density report (${label}) · ${new Date().toISOString()} · every ${every}${only.length ? ` · only ${only.join(',')}` : ''} · ${pairs} seeded comparisons · ${((Date.now() - t0) / 1000).toFixed(0)} s`;
let text = mod.densityText(rows, head);
const prev = arg('prev', '');
if (prev && fs.existsSync(prev)) text = `${fs.readFileSync(prev, 'utf8').replace(/\s+$/, '')}\n\n${'='.repeat(100)}\n\n${text}`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${text}\n`, 'utf8');
for (const l of text.split('\n').filter((l) => l.startsWith('SUMMARY') || l.startsWith('All videos'))) console.log(l);
console.log(`written: ${out}`);
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* locked */ }
