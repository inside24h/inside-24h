// Phase 4b (2026-11-13): renders ONE video sample from a built site/ with the app's own exporter, headless, for the
// render QC (npm run qc:render). The page is opened with the QA hash #render=<platform> (AppV4: it picks that cut and,
// for a single food, starts the export by itself; for a comparison, #vs=<food>, this script presses the panel's
// "Make this a Reel" button), waits for the finished file (window.__i24render) and writes it to --out.
//   node scripts/render-sample.mjs --q=beer --render=reels --out=<file.mp4> [--vs=croissant] [--site=../site]
// No voiceover (a fresh profile has it off: nothing is downloaded), music on. One headless browser, killed at the end;
// nothing leaves the machine (a local static server on 127.0.0.1).
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const SITE = path.resolve(arg('site', '../site'));
const OUT = path.resolve(arg('out', 'sample.mp4'));
const Q = arg('q', 'beer'), RENDER = arg('render', 'reels'), VS = arg('vs', '');
const LIMIT_MIN = Number(arg('minutes', '60'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += fs.existsSync(path.join(SITE, 'index.html')) ? 'index.html' : 'index-v4.html'; // site/ or a fresh dist-site/
  const f = path.join(SITE, p);
  if (!f.startsWith(SITE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] ?? 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const BASE = `http://127.0.0.1:${server.address().port}/`;

// ---- one headless browser ----
function findBrowser() {
  if (process.env.I24_BROWSER) return process.env.I24_BROWSER;
  const pw = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
  const linuxPw = path.join(os.homedir(), '.cache', 'ms-playwright');
  for (const root of [pw, linuxPw]) {
    if (!fs.existsSync(root)) continue;
    for (const d of fs.readdirSync(root).filter((n) => n.startsWith('chromium_headless_shell')).sort().reverse()) {
      for (const sub of ['chrome-headless-shell-win64', 'chrome-win', 'chrome-headless-shell-linux64']) {
        for (const exe of ['chrome-headless-shell.exe', 'chrome-headless-shell']) {
          const f = path.join(root, d, sub, exe);
          if (fs.existsSync(f)) return f;
        }
      }
    }
  }
  for (const f of ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/chromium', '/usr/bin/google-chrome']) if (fs.existsSync(f)) return f;
  throw new Error('No headless browser found: set I24_BROWSER');
}
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'i24-chk-'));
const proc = spawn(findBrowser(), ['--headless', `--user-data-dir=${profile}`, '--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--mute-audio', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--js-flags=--max-old-space-size=1536', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank'], { stdio: 'ignore' });
let killed = false;
function cleanup() {
  if (killed) return; killed = true;
  try { if (process.platform === 'win32') execSync(`taskkill /PID ${proc.pid} /T /F`, { stdio: 'ignore' }); else proc.kill('SIGKILL'); } catch { /* gone */ }
  server.close();
  setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* locked */ } }, 500);
}
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(130); });

const portFile = path.join(profile, 'DevToolsActivePort');
for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await new Promise((r) => setTimeout(r, 100));
const [port] = fs.readFileSync(portFile, 'utf8').split('\n');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- minimal CDP client (Node >= 22 has WebSocket) ----
async function openPage() {
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  const send = (method, params = {}) => new Promise((ok, no) => { const i = ++id; pending.set(i, (d) => (d.error ? no(new Error(`${method}: ${d.error.message}`)) : ok(d.result))); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'eval failed'); return r.result.value; };
  const close = async () => { try { ws.close(); await fetch(`http://127.0.0.1:${port}/json/close/${t.id}`); } catch { /* closed */ } };
  return { send, evaluate, close };
}


const page = await openPage();
try {
  await page.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  const hash = `#q=${encodeURIComponent(Q)}${VS ? `&vs=${encodeURIComponent(VS)}` : ''}&render=${RENDER}`;
  await page.send('Page.navigate', { url: BASE + hash });
  const t0 = Date.now();
  if (VS) {
    let clicked = false;
    for (let i = 0; i < 240 && !clicked; i++) {
      await wait(1000);
      clicked = await page.evaluate(`(() => { const b = [...document.querySelectorAll('button')].find((x) => /Make this a Reel/.test(x.textContent || '')); if (b && !b.disabled) { b.click(); return true; } return false; })()`);
    }
    if (!clicked) throw new Error('the comparison panel did not offer "Make this a Reel"');
  }
  let url = null, last = -1;
  while (!url && Date.now() - t0 < LIMIT_MIN * 60000) {
    await wait(5000);
    url = await page.evaluate('window.__i24render || null');
    const pct = await page.evaluate(`(() => { const e = document.querySelector('[role=progressbar], progress'); return e ? (e.getAttribute('aria-valuenow') || e.value || '') : ''; })()`);
    const m = Math.floor((Date.now() - t0) / 60000);
    if (m !== last) { last = m; console.log(`[render] ${Q}${VS ? ' vs ' + VS : ''} ${RENDER}: ${m} min${pct ? ' · ' + pct : ''}`); }
  }
  if (!url) throw new Error('no video after the time limit');
  const size = await page.evaluate(`fetch(${JSON.stringify(url)}).then((r) => r.blob()).then((b) => { window.__i24blob = b; return b.size; })`);
  const parts = [];
  for (let off = 0; off < size; off += 1 << 20) {
    const b64 = await page.evaluate(`window.__i24blob.slice(${off}, ${off + (1 << 20)}).arrayBuffer().then((a) => { let s = ''; const u = new Uint8Array(a); for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode(...u.subarray(i, i + 32768)); return btoa(s); })`);
    parts.push(Buffer.from(b64, 'base64'));
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, Buffer.concat(parts));
  console.log(`[render] wrote ${OUT} (${(size / 1e6).toFixed(1)} MB) in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
} finally {
  await page.close();
  cleanup();
}
process.exit(0);
