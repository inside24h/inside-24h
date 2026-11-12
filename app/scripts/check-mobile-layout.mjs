// Audit C4 / C11 (2026-11-12): phone layout regression check, run against a built site/ (no dev server needed).
//   node scripts/check-mobile-layout.mjs                  -> check ../site at 360x740, 390x844, 430x932 (+ 1440x900 info)
//   node scripts/check-mobile-layout.mjs --site=../site --out=<dir> --food=cola --no-strict
// For each phone size it opens a food (#q=<food>), waits for the body, and measures in the page:
//   - canvas share: visible canvas area / viewport area, and the share NOT covered by overlays (a grid of
//     elementFromPoint samples over the canvas); the body must get >= 55 % of the screen;
//   - horizontal overflow: the page must not scroll sideways and no visible element may stick out on the right;
//   - primary controls (search, play, timeline, quick answers, menu, ...) must be on screen, not covered, >= 44 px.
// Then the same page with WebGL switched off must show the 2D body (C11) with a friendly message, and the first
// screen (nothing chosen yet) must not overflow and must keep its search, tiles and menu reachable.
// Screenshots go to --out (default: a temp folder). One headless browser at a time (Playwright's chrome-headless-shell,
// or Edge, with its own throwaway profile; the user's Chrome is never touched); it is killed at the end.
// Exit code 1 when a check fails (unless --no-strict).
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const SITE = path.resolve(arg('site', '../site'));
const OUT = path.resolve(arg('out', path.join(os.tmpdir(), 'i24-mobile-check')));
const FOOD = arg('food', 'cola');
const STRICT = !process.argv.includes('--no-strict');
const MIN_SHARE = 0.55, MIN_TAP = 44;
const SIZES = [[360, 740], [390, 844], [430, 932]];
fs.mkdirSync(OUT, { recursive: true });

// ---- a tiny static server for site/ ----
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
  '--disable-extensions', '--mute-audio', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--js-flags=--max-old-space-size=512', 'about:blank'], { stdio: 'ignore' });
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

// Everything measured inside the page. `mode`: 'gl' (the 3D canvas) or 'nogl' (the 2D body, .body2d).
const MEASURE = (mode) => `(() => {
  const W = innerWidth, H = innerHeight;
  const vis = (el) => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05 && el.getClientRects().length > 0; };
  const target = document.querySelector(${JSON.stringify(mode === 'nogl' ? '.stage .body2d svg' : '.stage canvas')});
  let share = 0, clear = 0, covered = [];
  if (target) {
    const r = target.getBoundingClientRect();
    const x0 = Math.max(0, r.left), x1 = Math.min(W, r.right), y0 = Math.max(0, r.top), y1 = Math.min(H, r.bottom);
    share = Math.max(0, x1 - x0) * Math.max(0, y1 - y0) / (W * H);
    // the canvas share nobody covers: sample a 24 x 40 grid over the visible canvas
    let n = 0, ok = 0; const by = {};
    for (let i = 0; i < 24; i++) for (let j = 0; j < 40; j++) {
      const x = x0 + (i + 0.5) * (x1 - x0) / 24, y = y0 + (j + 0.5) * (y1 - y0) / 40; n++;
      const e = document.elementFromPoint(x, y);
      if (e && (e === target || target.contains(e) || (e.closest && e.closest('.stage > div:first-child') && !e.closest('button,a,input,[role=dialog]')))) ok++;
      else if (e) { const k = (e.closest('[class]')?.className || e.tagName).toString().split(' ')[0]; by[k] = (by[k] || 0) + 1; }
    }
    clear = share * ok / n;
    covered = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => k + ' ' + Math.round(100 * v / n) + '%');
  }
  // horizontal overflow
  const docW = document.documentElement.scrollWidth;
  const wide = [...document.querySelectorAll('body *')].filter((e) => vis(e) && !e.closest('svg') && !e.closest('.sr')).filter((e) => {
    const r = e.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return false;
    if (r.right <= W + 1 && r.left >= -1) return false;
    // clipped by a scrolling / hidden-overflow ancestor (e.g. a sideways chip row) is fine
    for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o !== 'visible') { const pr = p.getBoundingClientRect(); return pr.right > W + 1 || pr.left < -1; } }
    return true;
  }).slice(0, 8).map((e) => (e.className || e.tagName).toString().slice(0, 40) + ' ' + Math.round(e.getBoundingClientRect().right));
  // primary controls: [label, selector, required]
  const PRIMARY = ${JSON.stringify(mode === 'cold' ? [
    ['search', '.startsheet input', true],
    ['first tile', '.startsheet .tile', true],
    ['menu', '.menubtn', true],
  ] : mode === 'gl' ? [
    ['search', '.topsearch input, .topsearch button.mealchip, .topsearch button', true],
    ['play', '.calmbar .play, .calmbar button[aria-label="Play"], .calmbar button[aria-label="Pause"], .moments .play', true],
    ['timeline', '.calmbar input[type=range], .tl input[type=range]', true],
    ['quick answers', '.anstoggle', true],
    ['menu', '.menubtn', true],
    ['your body', '.topactions > .primary', false],
    ['share', '.sharebtn', false],
  ] : [
    ['search', '.topsearch input, .topsearch button', true],
    ['play', '.calmbar .play, .calmbar button[aria-label="Play"], .calmbar button[aria-label="Pause"], .moments .play', true],
    ['timeline', '.calmbar input[type=range], .tl input[type=range]', true],
    ['menu', '.menubtn', true],
  ])};
  const controls = PRIMARY.map(([label, sel, req]) => {
    const el = [...document.querySelectorAll(sel)].find(vis);
    if (!el) return { label, req, found: false };
    const r = el.getBoundingClientRect();
    const onScreen = r.top >= -1 && r.left >= -1 && r.bottom <= H + 1 && r.right <= W + 1;
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const reachable = !!hit && (hit === el || el.contains(hit) || hit.contains(el) || (hit.tagName === 'LABEL' && hit.control === el));
    // a range slider's touch box is its own height or its row's (the thumb is what is dragged)
    const h = el.type === 'range' ? Math.max(r.height, el.parentElement.getBoundingClientRect().height) : r.height;
    return { label, req, found: true, w: Math.round(r.width), h: Math.round(h), onScreen, reachable, big: r.width >= ${MIN_TAP} - 0.5 && h >= ${MIN_TAP} - 0.5 };
  });
  const msg = document.querySelector('.body2d .b2msg')?.textContent ?? null;
  return { W, H, share, clear, covered, docW, wide, controls, msg, started: !!document.querySelector('.calmbar, .moments') };
})()`;

async function shot(page, file) {
  const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT, file), Buffer.from(data, 'base64'));
}

async function run(w, h, mode) {
  const page = await openPage();
  await page.send('Page.enable'); await page.send('Runtime.enable');
  await page.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 720, screenWidth: w, screenHeight: h });
  if (w < 720) await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  // the "Personalize" prompt and the gesture hint are first-visit extras: measured as a first visit
  // no WebGL: getContext('webgl') gives null; I24_KEEP_API=1 keeps window.WebGLRenderingContext (the 3D part then fails
  // while starting, the other path to the 2D body)
  if (mode === 'nogl') await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; ${process.env.I24_KEEP_API ? '' : 'try { delete window.WebGLRenderingContext; delete window.WebGL2RenderingContext; } catch {}'} })();` });
  await page.send('Page.navigate', { url: mode === 'cold' ? BASE : `${BASE}#q=${encodeURIComponent(FOOD)}` });
  const sel = mode === 'nogl' ? '.stage .body2d svg' : mode === 'cold' ? '.startsheet input' : '.stage canvas';
  let okSel = false;
  for (let i = 0; i < 120 && !okSel; i++) { await wait(250); okSel = await page.evaluate(`!!document.querySelector(${JSON.stringify(sel)})`).catch(() => false); }
  await wait(mode === 'gl' ? 4500 : 1500); // the camera flight and the first frames
  if (process.env.I24_EVAL) console.log(`[${w}x${h} ${mode}]`, await page.evaluate(process.env.I24_EVAL).catch((e) => e.message)); // debugging aid
  const m = await page.evaluate(MEASURE(mode));
  await shot(page, `${w}x${h}-${mode}.png`);
  await page.close();
  return m;
}

const fails = [];
const pct = (x) => `${(100 * x).toFixed(1)} %`;
try {
  for (const [w, h] of [...SIZES, [1440, 900]]) {
    for (const mode of ['gl', 'nogl', 'cold']) {
      if (w > 720 && mode !== 'gl') continue;
      const m = await run(w, h, mode);
      const tag = `${w}x${h} ${mode}`;
      console.log(`${tag}${w > 720 ? ' (desktop, information only: mouse-sized controls are fine here)' : ''}: body ${pct(m.share)} of the screen, uncovered ${pct(m.clear)}${m.covered.length ? ` (covered by: ${m.covered.join(', ')})` : ''}; page width ${m.docW}${m.msg ? `; message: "${m.msg}"` : ''}`);
      for (const c of m.controls) console.log(`    ${c.found ? `${c.big ? 'ok ' : 'SMALL'} ${c.label} ${c.w}x${c.h}${c.onScreen ? '' : ' OFF-SCREEN'}${c.reachable ? '' : ' COVERED'}` : `${c.req ? 'MISSING' : '(none)'} ${c.label}`}`);
      if (w > 720) continue; // desktop: information only
      if (mode !== 'cold' && !m.started) fails.push(`${tag}: the simulation did not start`);
      // (the first screen keeps its start sheet under the body: only overflow and controls are checked there)
      if (mode !== 'cold' && m.share < MIN_SHARE) fails.push(`${tag}: body only ${pct(m.share)} of the screen (< ${pct(MIN_SHARE)})`);
      if (mode === 'gl' && m.clear < MIN_SHARE - 0.05) fails.push(`${tag}: only ${pct(m.clear)} of the screen shows the body uncovered`);
      if (m.docW > m.W + 1) fails.push(`${tag}: the page scrolls sideways (${m.docW} > ${m.W})`);
      if (m.wide.length) fails.push(`${tag}: sticks out on the right: ${m.wide.join('; ')}`);
      for (const c of m.controls) {
        if (!c.found) { if (c.req) fails.push(`${tag}: ${c.label} is missing`); continue; }
        if (!c.onScreen || !c.reachable) fails.push(`${tag}: ${c.label} is ${!c.onScreen ? 'off-screen' : 'covered'}`);
        if (!c.big) fails.push(`${tag}: ${c.label} is ${c.w}x${c.h} (< ${MIN_TAP} px)`);
      }
      if (mode === 'nogl' && !m.msg) fails.push(`${tag}: no friendly 2D-fallback message`);
    }
  }
} finally { cleanup(); }
console.log(`screenshots: ${OUT}`);
if (fails.length) { console.log(`\n${fails.length} problem(s):\n  ${fails.join('\n  ')}`); if (STRICT) process.exitCode = 1; }
else console.log('\nall phone layout checks passed');
