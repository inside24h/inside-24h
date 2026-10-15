// "Share video": records the 3D body while the whole 24 h plays and draws a social-ready frame around it:
// a hook title, burned-in captions (most people watch muted), where the drink is and how much, the traffic lights,
// a day progress bar, and an end card with the day's summary and a call to comment. MP4 where the browser can,
// otherwise WebM. The WebGL canvas needs preserveDrawingBuffer.

export type Format = 'reel' | 'feed';
export interface Light { icon: string; label: string; level: 0 | 1 | 2 }
export interface Overlay {
  hook: string; title: string; sub: string; clock: string; step: string; caption: string;
  where?: string; color?: string; progress: number; lights: Light[];
  summary: (Light & { note: string })[]; handle: string;
  stamp?: string; // big 'X MIN LATER' line
  pop?: { big: string; small: string; level: 0 | 1 | 2 }; // headline number of this moment
}
const LIGHT = ['#3ddc84', '#ffc83d', '#ff5a5a'];
const WORD = ['Good', 'Mild stress', 'Overload'];
const SANS = 'system-ui, "Segoe UI", Roboto, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
export const SIZE: Record<Format, [number, number]> = { reel: [1080, 1920], feed: [1080, 1350] };
const INTRO_MS = 1900, OUTRO_MS = 3200;

export function pickMime(): { mime: string; ext: 'mp4' | 'webm' } | null {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const [mime, ext] of [['video/mp4;codecs=avc1', 'mp4'], ['video/mp4', 'mp4'], ['video/webm;codecs=vp9', 'webm'], ['video/webm;codecs=vp8', 'webm'], ['video/webm', 'webm']] as const) {
    if (MediaRecorder.isTypeSupported(mime)) return { mime, ext };
  }
  return null;
}

/**
 * Intro (hook) → calls `onPlay` so the day starts → records until `done()` → end card. Total ≈ 20 s.
 */
export function record(source: HTMLCanvasElement, format: Format, overlay: () => Overlay, onPlay: () => void, done: () => boolean): Promise<{ blob: Blob; ext: string }> {
  const fmt = pickMime();
  if (!fmt) return Promise.reject(new Error('This browser cannot record video.'));
  const [W, H] = SIZE[format];
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const ctx = out.getContext('2d')!;
  const stream = out.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: fmt.mime, videoBitsPerSecond: 8_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  return new Promise((resolve, reject) => {
    rec.onstop = () => resolve({ blob: new Blob(chunks, { type: fmt.mime.split(';')[0] }), ext: fmt.ext });
    rec.onerror = () => reject(new Error('Recording failed.'));
    const t0 = performance.now();
    let played = false, endAt = 0, raf = 0;
    const frame = (now: number) => {
      const t = now - t0, o = overlay();
      if (!played && t > INTRO_MS * 0.6) { played = true; onPlay(); }
      if (played && !endAt && done()) endAt = now;
      drawMain(ctx, W, H, source, o, format);
      if (t < INTRO_MS) drawIntro(ctx, W, H, o, Math.min(1, (INTRO_MS - t) / 500));
      if (endAt) {
        const e = now - endAt;
        drawOutro(ctx, W, H, o, Math.min(1, e / 400));
        if (e > OUTRO_MS) { cancelAnimationFrame(raf); rec.stop(); stream.getTracks().forEach((s) => s.stop()); return; }
      }
      raf = requestAnimationFrame(frame);
    };
    rec.start(250);
    raf = requestAnimationFrame(frame);
  });
}

// ---------- frame-exact recording (WebCodecs + MP4 muxer) ----------
// Each video frame is rendered on purpose and stamped at exactly 1/30 s, so the result is smooth and the right
// length on any computer, even a slow one (MediaRecorder above just films the screen in real time).
// Yield to the browser without setTimeout: timers are throttled to ~1/min in background tabs, message events are not.
const yieldNow = () => new Promise<void>((r) => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
export const canEncode = () => typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';
const FPS = 30, INTRO_F = Math.round((INTRO_MS / 1000) * FPS), OUTRO_F = Math.round((OUTRO_MS / 1000) * FPS);

/** step(minute) must set the day position and render one 1/30 s frame of the 3D scene synchronously.
 *  rames = the minute shown in each video frame (see storyFrames). */
export async function recordFrames(source: HTMLCanvasElement, format: Format, overlay: () => Overlay,
  step: (minute: number) => void, frames: number[], onTick?: (frac: number) => void): Promise<{ blob: Blob; ext: string }> {
  const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
  const [W, H] = SIZE[format];
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const ctx = out.getContext('2d')!;
  let config: VideoEncoderConfig | null = null;
  for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.42003e']) {
    const c: VideoEncoderConfig = { codec, width: W, height: H, bitrate: 10_000_000, framerate: FPS, avc: { format: 'avc' } };
    if ((await VideoEncoder.isConfigSupported(c)).supported) { config = c; break; }
  }
  if (!config) throw new Error('This browser cannot encode H.264 video.');
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({ target, video: { codec: 'avc', width: W, height: H, frameRate: FPS }, fastStart: 'in-memory' });
  let failed: Error | null = null;
  const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { failed = e as Error; } });
  enc.configure(config);

  const total = INTRO_F + frames.length + OUTRO_F, last = frames[frames.length - 1] ?? 1440;
  let i = 0;
  const push = async (draw: () => void) => {
    draw();
    const frame = new VideoFrame(out, { timestamp: Math.round((i * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
    enc.encode(frame, { keyFrame: i % (FPS * 2) === 0 });
    frame.close();
    i++;
    onTick?.(i / total);
    if (enc.encodeQueueSize > 8) await enc.flush();
    if (i % 10 === 0) await yieldNow(); // let the progress badge repaint
    if (failed) throw failed;
  };
  for (let f = 0; f < 20; f++) step(0); // settle: camera flies in, liquid fades in
  for (let f = 0; f < INTRO_F; f++) { step(0); const o = overlay(); await push(() => { drawMain(ctx, W, H, source, o, format); drawIntro(ctx, W, H, o, Math.min(1, (INTRO_F - f) / 15)); }); }
  for (const m of frames) { step(m); const o = overlay(); await push(() => drawMain(ctx, W, H, source, o, format)); }
  for (let f = 0; f < OUTRO_F; f++) { step(last); const o = overlay(); await push(() => { drawMain(ctx, W, H, source, o, format); drawOutro(ctx, W, H, o, Math.min(1, f / 12)); }); }
  await enc.flush(); enc.close(); muxer.finalize();
  return { blob: new Blob([target.buffer], { type: 'video/mp4' }), ext: 'mp4' };
}

// ---------- pacing: stop at the moments that matter ----------
// A day in 15 s is unreadable. Instead the video glides to each key moment (0.9 s, eased) and then lingers there
// (2.4 s, drifting slowly towards the next moment so the liquid keeps moving), like "5 minutes later…" clips.
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export function storyFrames(stops: number[], toU: (m: number) => number, fromU: (u: number) => number, holdS = 2.4, moveS = 0.9, driftFrac = 0.12): number[] {
  const s = [...new Set(stops.map((m) => Math.max(0, Math.min(1440, m))))].sort((a, b) => a - b);
  const out: number[] = [];
  let prev = s[0] ?? 0;
  s.forEach((stop, k) => {
    const next = s[k + 1] ?? stop;
    if (k > 0) { const mf = Math.round(moveS * FPS); for (let i = 1; i <= mf; i++) out.push(fromU(toU(prev) + (toU(stop) - toU(prev)) * ease(i / mf))); }
    const hf = Math.round(holdS * FPS), drift = driftFrac * (toU(next) - toU(stop));
    for (let i = 0; i < hf; i++) out.push(fromU(toU(stop) + drift * (i / hf)));
    prev = fromU(toU(stop) + drift);
  });
  return out;
}
/** "5 MIN LATER", "2 HOURS LATER" for the big stamp. */
export function stampFor(minute: number): string {
  if (minute < 1) return 'FIRST SIP';
  if (minute < 60) return `${Math.round(minute)} MIN LATER`;
  const h = Math.round(minute / 60);
  return `${h} ${h === 1 ? 'HOUR' : 'HOURS'} LATER`;
}

function drawStamp(ctx: CanvasRenderingContext2D, cx: number, y: number, text: string, size = 64) {
  ctx.save(); ctx.textAlign = 'center'; ctx.font = `800 ${size}px ${SANS}`;
  const w = ctx.measureText(text).width + 70;
  ctx.fillStyle = 'rgba(92,211,255,.95)'; roundRect(ctx, cx - w / 2, y - size * 0.95, w, size * 1.35, size * 0.3); ctx.fill();
  ctx.fillStyle = '#04070c'; ctx.fillText(text, cx, y);
  ctx.restore();
}

// ---------- side-by-side comparison Reel ----------
export interface CmpSide { name: string; color: string; step: string; caption: string; where?: string; sugar: string; sugarLevel: 0 | 1 | 2; lights: Light[];
  summary: { kcal: number; sugarPeak: string; worst: (Light & { note: string })[] } }
export interface CmpOverlay { hook: string; clock: string; progress: number; handle: string; a: CmpSide; b: CmpSide; stamp?: string; verdict?: string }

export async function recordCompare(canvA: HTMLCanvasElement, overlay: () => CmpOverlay,
  step: (minute: number) => void, frames: number[], onTick?: (f: number) => void): Promise<{ blob: Blob; ext: string }> {
  const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
  const W = 1080, H = 1920;
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const ctx = out.getContext('2d')!;
  let config: VideoEncoderConfig | null = null;
  for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.42003e']) {
    const c: VideoEncoderConfig = { codec, width: W, height: H, bitrate: 10_000_000, framerate: FPS, avc: { format: 'avc' } };
    if ((await VideoEncoder.isConfigSupported(c)).supported) { config = c; break; }
  }
  if (!config) throw new Error('This browser cannot encode H.264 video.');
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({ target, video: { codec: 'avc', width: W, height: H, frameRate: FPS }, fastStart: 'in-memory' });
  let failed: Error | null = null;
  const enc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => { failed = e as Error; } });
  enc.configure(config);
  const total = INTRO_F + frames.length + OUTRO_F, last = frames[frames.length - 1] ?? 1440;
  let i = 0;
  const push = async (draw: () => void) => {
    draw();
    const f = new VideoFrame(out, { timestamp: Math.round((i * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
    enc.encode(f, { keyFrame: i % (FPS * 2) === 0 }); f.close(); i++; onTick?.(i / total);
    if (enc.encodeQueueSize > 8) await enc.flush();
    if (i % 10 === 0) await yieldNow();
    if (failed) throw failed;
  };
  for (let f = 0; f < 20; f++) step(0);
  for (let f = 0; f < INTRO_F; f++) { step(0); const o = overlay(); await push(() => { drawCmp(ctx, W, H, canvA, o); drawCmpIntro(ctx, W, H, o, Math.min(1, (INTRO_F - f) / 15)); }); }
  for (const m of frames) { step(m); const o = overlay(); await push(() => drawCmp(ctx, W, H, canvA, o)); }
  for (let f = 0; f < OUTRO_F; f++) { step(last); const o = overlay(); await push(() => { drawCmp(ctx, W, H, canvA, o); drawCmpOutro(ctx, W, H, o, Math.min(1, f / 12)); }); }
  await enc.flush(); enc.close(); muxer.finalize();
  return { blob: new Blob([target.buffer], { type: 'video/mp4' }), ext: 'mp4' };
}

/** src holds both bodies: the left half is the first item, the right half the second. */
function drawCmp(ctx: CanvasRenderingContext2D, W: number, H: number, src: HTMLCanvasElement, o: CmpOverlay) {
  bg(ctx, W, H);
  const top = 250, bodyH = 1000, colW = W / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5cd3ff'; ctx.font = `700 30px ${SANS}`; ctx.fillText('INSIDE 24H', W / 2, 80);
  [o.a, o.b].forEach((s, k) => {
    const cx = colW * k + colW / 2, hw = src.width / 2;
    // body: cover-crop this half of the shared canvas
    const sc = Math.max(colW / hw, bodyH / src.height), sw = colW / sc, sh = bodyH / sc;
    ctx.drawImage(src, k * hw + (hw - sw) / 2, (src.height - sh) / 2, sw, sh, colW * k, top, colW, bodyH);
    // name
    ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(cx, 150, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = `400 58px ${SERIF}`; ctx.fillText(fit(ctx, s.name, colW - 40), cx, 225);
    // sugar chip
    const LIGHTC = ['#3ddc84', '#ffc83d', '#ff5a5a'];
    ctx.font = `800 46px ${SANS}`;
    const sw2 = ctx.measureText(s.sugar).width + 70;
    ctx.fillStyle = 'rgba(8,16,26,.92)'; roundRect(ctx, cx - sw2 / 2, top + 14, sw2, 78, 39); ctx.fill();
    ctx.strokeStyle = LIGHTC[s.sugarLevel]; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = LIGHTC[s.sugarLevel]; ctx.fillText(s.sugar, cx, top + 69);
    // where + step
    ctx.fillStyle = '#ffffff'; ctx.font = `600 32px ${SANS}`;
    if (s.where) { const t = fit(ctx, s.where, colW - 70), tw = ctx.measureText(t).width + 40; ctx.fillStyle = 'rgba(4,7,12,.85)'; roundRect(ctx, cx - tw / 2, top + bodyH - 72, tw, 56, 28); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillText(t, cx, top + bodyH - 33); }
    ctx.fillStyle = '#5cd3ff'; ctx.font = `700 28px ${SANS}`; ctx.fillText(fit(ctx, s.step.toUpperCase(), colW - 40), cx, top + bodyH + 60);
    // four dots
    s.lights.forEach((l, j) => {
      const x = cx - 150 + j * 100, y = top + bodyH + 130;
      ctx.fillStyle = LIGHTC[l.level]; ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
      ctx.font = `22px "Segoe UI Emoji", "Apple Color Emoji", ${SANS}`; ctx.fillStyle = '#04070c'; ctx.fillText(l.icon, x, y + 8);
      ctx.font = `600 20px ${SANS}`; ctx.fillStyle = '#b9c5d3'; ctx.fillText(l.label, x, y + 52);
    });
    // what is happening on this side, in plain words
    ctx.fillStyle = '#e6edf5'; ctx.font = `500 31px ${SANS}`;
    wrap(ctx, s.caption, colW - 60, 3).forEach((ln, i) => ctx.fillText(ln, cx, top + bodyH + 245 + i * 40));
  });
  ctx.fillStyle = 'rgba(140,170,210,.35)'; ctx.fillRect(W / 2 - 1, top, 2, bodyH + 220);
  // vs badge
  ctx.fillStyle = '#04070c'; ctx.beginPath(); ctx.arc(W / 2, top + bodyH / 2, 44, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5cd3ff'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#5cd3ff'; ctx.font = `700 34px ${SANS}`; ctx.fillText('VS', W / 2, top + bodyH / 2 + 12);
  // clock + progress
  const py = H - 170;
  if (o.stamp) {
    drawStamp(ctx, W / 2, py - 70, o.stamp, 66);
    ctx.textAlign = 'center'; ctx.fillStyle = '#b9c5d3'; ctx.font = `500 30px ${SANS}`; ctx.fillText(o.clock, W / 2, py - 18);
  } else { ctx.fillStyle = '#e6edf5'; ctx.font = `400 80px ${SERIF}`; ctx.fillText(o.clock, W / 2, py - 30); }
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(140,170,210,.25)'; roundRect(ctx, 60, py, W - 120, 10, 5); ctx.fill();
  ctx.fillStyle = '#5cd3ff'; roundRect(ctx, 60, py, (W - 120) * Math.max(0.01, o.progress), 10, 5); ctx.fill();
  ctx.fillStyle = '#56657a'; ctx.font = `20px ${SANS}`;
  ctx.fillText(`${o.handle} · simulation for a typical body · not medical advice · anatomy BodyParts3D CC BY 4.0`, 60, H - 60);
}

function drawCmpIntro(ctx: CanvasRenderingContext2D, W: number, H: number, o: CmpOverlay, alpha: number) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(4,7,12,.45)'; ctx.fillRect(0, 0, W, H); { const g = ctx.createLinearGradient(0, H * 0.22, 0, H * 0.75); g.addColorStop(0, 'rgba(4,7,12,0)'); g.addColorStop(0.25, 'rgba(4,7,12,.82)'); g.addColorStop(0.8, 'rgba(4,7,12,.82)'); g.addColorStop(1, 'rgba(4,7,12,0)'); ctx.fillStyle = g; ctx.fillRect(0, H * 0.22, W, H * 0.53); }
  ctx.textAlign = 'center';
  [o.a, o.b].forEach((s, k) => { ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(W / 2 + (k ? 90 : -90), H * 0.3, 60, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4; ctx.stroke(); });
  ctx.fillStyle = '#5cd3ff'; ctx.font = `700 34px ${SANS}`; ctx.fillText('24 HOURS INSIDE YOU', W / 2, H * 0.3 + 140);
  ctx.fillStyle = '#ffffff'; ctx.font = `400 84px ${SERIF}`;
  wrap(ctx, o.hook, W - 140, 4).forEach((ln, i) => ctx.fillText(ln, W / 2, H * 0.3 + 260 + i * 98));
  ctx.restore(); ctx.textAlign = 'left';
}

function drawCmpOutro(ctx: CanvasRenderingContext2D, W: number, H: number, o: CmpOverlay, alpha: number) {
  ctx.save(); ctx.globalAlpha = alpha;
  bg(ctx, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5cd3ff'; ctx.font = `700 32px ${SANS}`; ctx.fillText('AFTER 24 HOURS', W / 2, 220);
  const LIGHTC = ['#3ddc84', '#ffc83d', '#ff5a5a'];
  [o.a, o.b].forEach((s, k) => {
    const cx = W / 4 + k * (W / 2);
    ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(cx, 330, 34, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = `400 60px ${SERIF}`; ctx.fillText(fit(ctx, s.name, W / 2 - 60), cx, 430);
    ctx.font = `700 40px ${SANS}`; ctx.fillStyle = '#e6edf5'; ctx.fillText(`${Math.round(s.summary.kcal)} kcal`, cx, 520);
    ctx.font = `600 32px ${SANS}`; ctx.fillStyle = '#9fd7ff'; ctx.fillText(`Sugar ${s.summary.sugarPeak}`, cx, 575);
    s.summary.worst.forEach((l, j) => {
      const y = 680 + j * 120;
      ctx.fillStyle = LIGHTC[l.level]; ctx.beginPath(); ctx.arc(cx - 170, y, 28, 0, Math.PI * 2); ctx.fill();
      ctx.font = `26px "Segoe UI Emoji", "Apple Color Emoji", ${SANS}`; ctx.fillStyle = '#04070c'; ctx.fillText(l.icon, cx - 170, y + 9);
      ctx.textAlign = 'left'; ctx.fillStyle = '#e6edf5'; ctx.font = `700 30px ${SANS}`; ctx.fillText(l.label, cx - 125, y - 4);
      ctx.fillStyle = LIGHTC[l.level]; ctx.font = `600 24px ${SANS}`; ctx.fillText(fit(ctx, l.note, W / 2 - 200), cx - 125, y + 30); ctx.textAlign = 'center';
    });
  });
  ctx.fillStyle = 'rgba(140,170,210,.35)'; ctx.fillRect(W / 2 - 1, 300, 2, 900);
  if (o.verdict) {
    ctx.font = `800 44px ${SANS}`;
    const lines = wrap(ctx, o.verdict, W - 160, 3);
    const bh = 40 + lines.length * 56;
    ctx.fillStyle = 'rgba(61,220,132,.14)'; roundRect(ctx, 60, H - 470 - bh, W - 120, bh, 28); ctx.fill();
    ctx.strokeStyle = 'rgba(61,220,132,.7)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#ffffff'; lines.forEach((ln, i) => ctx.fillText(ln, W / 2, H - 470 - bh + 62 + i * 56));
  }
  ctx.fillStyle = '#ffffff'; ctx.font = `700 46px ${SANS}`; ctx.fillText('Which one would you pick? 👇', W / 2, H - 330);
  ctx.fillStyle = '#5cd3ff'; ctx.font = `600 34px ${SANS}`; ctx.fillText(`Follow ${o.handle} · a new comparison every day`, W / 2, H - 260);
  ctx.restore(); ctx.textAlign = 'left';
}

/** QA: one composed comparison frame (#cmpframe=<other food>&phase=intro|main|outro). */
export function composeCmpFrame(A: HTMLCanvasElement, o: CmpOverlay, phase: 'intro' | 'main' | 'outro'): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1920;
  const ctx = c.getContext('2d')!;
  drawCmp(ctx, 1080, 1920, A, o);
  if (phase === 'intro') drawCmpIntro(ctx, 1080, 1920, o, 1);
  if (phase === 'outro') drawCmpOutro(ctx, 1080, 1920, o, 1);
  return c;
}

/** One composed video frame on a canvas (QA: #frame=reel-intro / reel-main / reel-outro). */
export function composeFrame(source: HTMLCanvasElement, format: Format, o: Overlay, phase: 'intro' | 'main' | 'outro'): HTMLCanvasElement {
  const [W, H] = SIZE[format];
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  drawMain(ctx, W, H, source, o, format);
  if (phase === 'intro') drawIntro(ctx, W, H, o, 1);
  if (phase === 'outro') drawOutro(ctx, W, H, o, 1);
  return c;
}

// ---------- drawing ----------
function bg(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const g = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H * 0.42, H * 0.8);
  g.addColorStop(0, '#0c1b2c'); g.addColorStop(1, '#04070c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function drawMain(ctx: CanvasRenderingContext2D, W: number, H: number, src: HTMLCanvasElement, o: Overlay, format: Format) {
  const reel = format === 'reel';
  bg(ctx, W, H);
  // the body: cover-crop the 3D view into the middle band
  const top = reel ? 300 : 210, bottom = reel ? H - 610 : H - 400;
  const bandH = bottom - top;
  const s = Math.max(W / src.width, bandH / src.height);
  const sw = W / s, sh = bandH / s;
  ctx.drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, top, W, bandH);
  fadeEdge(ctx, W, top, 90, false); fadeEdge(ctx, W, bottom, 90, true);

  // header
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#5cd3ff'; ctx.font = `700 30px ${SANS}`;
  ctx.fillText('INSIDE 24H', 60, reel ? 96 : 76);
  ctx.fillStyle = '#e6edf5'; ctx.font = `400 ${reel ? 72 : 60}px ${SERIF}`;
  ctx.fillText(fit(ctx, o.title, W - 120), 60, reel ? 180 : 145);
  ctx.fillStyle = '#8292a7'; ctx.font = `28px ${SANS}`;
  ctx.fillText(fit(ctx, o.sub, W - 120), 60, reel ? 230 : 188);

  // traffic lights: a row of four chips over the top of the body
  const n = o.lights.length, gap = 14, cw = (W - 120 - gap * (n - 1)) / n, ly = top + 16;
  o.lights.forEach((l, i) => {
    const x = 60 + i * (cw + gap);
    ctx.fillStyle = 'rgba(8,16,26,.82)'; roundRect(ctx, x, ly, cw, 92, 18); ctx.fill();
    ctx.strokeStyle = l.level === 2 ? 'rgba(255,90,90,.8)' : 'rgba(140,170,210,.25)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = LIGHT[l.level]; ctx.beginPath(); ctx.arc(x + 38, ly + 46, 24, 0, Math.PI * 2); ctx.fill();
    ctx.font = `24px "Segoe UI Emoji", "Apple Color Emoji", ${SANS}`; ctx.textAlign = 'center'; ctx.fillStyle = '#04070c';
    ctx.fillText(l.icon, x + 38, ly + 55); ctx.textAlign = 'left';
    ctx.fillStyle = '#e6edf5'; ctx.font = `600 21px ${SANS}`; ctx.fillText(fit(ctx, l.label, cw - 80), x + 72, ly + 40);
    ctx.fillStyle = LIGHT[l.level]; ctx.font = `700 21px ${SANS}`; ctx.fillText(WORD[l.level], x + 72, ly + 68);
  });

  // the number of the moment, big, so it reads on a phone without sound
  if (o.pop) {
    const cx = W - 200, cy = top + 240, r = reel ? 120 : 100;
    ctx.save(); ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(4,7,12,.88)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = LIGHT[o.pop.level]; ctx.lineWidth = 8; ctx.stroke();
    ctx.fillStyle = LIGHT[o.pop.level]; ctx.font = `800 ${reel ? 64 : 54}px ${SANS}`; ctx.fillText(o.pop.big, cx, cy + 12);
    ctx.fillStyle = '#e6edf5'; ctx.font = `600 ${reel ? 26 : 22}px ${SANS}`; ctx.fillText(o.pop.small, cx, cy + 52);
    ctx.restore();
  }
  // where the drink is now, with its real colour
  if (o.where) {
    ctx.font = `700 ${reel ? 36 : 32}px ${SANS}`;
    const w = ctx.measureText(o.where).width, x = (W - w) / 2 + 22, y = bottom - 40;
    ctx.fillStyle = 'rgba(8,16,26,.9)'; roundRect(ctx, x - 64, y - 42, w + 92, 62, 31); ctx.fill();
    ctx.strokeStyle = 'rgba(220,235,250,.45)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = o.color ?? '#fff'; ctx.beginPath(); ctx.arc(x - 32, y - 11, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillText(o.where, x, y);
  }

  // caption: the current step in plain words, big enough to read muted on a phone
  const capTop = bottom + (reel ? 34 : 18);
  ctx.fillStyle = '#5cd3ff'; ctx.font = `700 ${reel ? 30 : 26}px ${SANS}`;
  ctx.fillText(o.step.toUpperCase(), 60, capTop + 30);
  ctx.fillStyle = '#ffffff'; ctx.font = `600 ${reel ? 46 : 34}px ${SANS}`;
  const lines = wrap(ctx, o.caption, W - 120, reel ? 4 : 2);
  lines.forEach((ln, i) => ctx.fillText(ln, 60, capTop + (reel ? 92 : 78) + i * (reel ? 60 : 44)));

  // clock + day progress
  const py = H - (reel ? 150 : 96);
  if (o.stamp) {
    drawStamp(ctx, W / 2, py - 46, o.stamp, reel ? 60 : 46);
    ctx.textAlign = 'center'; ctx.fillStyle = '#b9c5d3'; ctx.font = `500 ${reel ? 28 : 24}px ${SANS}`; ctx.fillText(o.clock, W / 2, py + 44); ctx.textAlign = 'left';
  } else { ctx.fillStyle = '#e6edf5'; ctx.font = `400 ${reel ? 76 : 58}px ${SERIF}`; ctx.fillText(o.clock, 60, py - 34); }
  ctx.fillStyle = 'rgba(140,170,210,.25)'; roundRect(ctx, 60, py, W - 120, 10, 5); ctx.fill();
  ctx.fillStyle = '#5cd3ff'; roundRect(ctx, 60, py, (W - 120) * Math.max(0.01, o.progress), 10, 5); ctx.fill();
  ctx.font = `22px ${SANS}`; ctx.fillStyle = '#8292a7'; ctx.textAlign = 'right';
  ctx.fillText('0 h', 60 + 30, py + 44); ctx.fillText('24 h', W - 60, py + 44); ctx.textAlign = 'left';
  ctx.fillStyle = '#56657a'; ctx.font = `20px ${SANS}`;
  ctx.fillText(`${o.handle} · simulation for a typical body · not medical advice · anatomy BodyParts3D CC BY 4.0`, 60, H - (reel ? 52 : 26));
}

function drawIntro(ctx: CanvasRenderingContext2D, W: number, H: number, o: Overlay, alpha: number) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(4,7,12,.45)'; ctx.fillRect(0, 0, W, H); { const g = ctx.createLinearGradient(0, H * 0.22, 0, H * 0.75); g.addColorStop(0, 'rgba(4,7,12,0)'); g.addColorStop(0.25, 'rgba(4,7,12,.82)'); g.addColorStop(0.8, 'rgba(4,7,12,.82)'); g.addColorStop(1, 'rgba(4,7,12,0)'); ctx.fillStyle = g; ctx.fillRect(0, H * 0.22, W, H * 0.53); }
  ctx.textAlign = 'center';
  ctx.fillStyle = o.color ?? '#fff'; ctx.beginPath(); ctx.arc(W / 2, H * 0.3, 60, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = '#5cd3ff'; ctx.font = `700 34px ${SANS}`; ctx.fillText('24 HOURS INSIDE YOU', W / 2, H * 0.3 + 130);
  ctx.fillStyle = '#ffffff'; ctx.font = `400 84px ${SERIF}`;
  wrap(ctx, o.hook, W - 140, 4).forEach((ln, i) => ctx.fillText(ln, W / 2, H * 0.3 + 250 + i * 98));
  ctx.restore(); ctx.textAlign = 'left';
}

function drawOutro(ctx: CanvasRenderingContext2D, W: number, H: number, o: Overlay, alpha: number) {
  ctx.save(); ctx.globalAlpha = alpha;
  bg(ctx, W, H);
  const y0 = H * 0.16;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5cd3ff'; ctx.font = `700 32px ${SANS}`; ctx.fillText('YOUR 24 HOURS', W / 2, y0);
  ctx.fillStyle = '#ffffff'; ctx.font = `400 70px ${SERIF}`;
  wrap(ctx, o.title, W - 140, 2).forEach((ln, i) => ctx.fillText(ln, W / 2, y0 + 90 + i * 80));
  ctx.textAlign = 'left';
  const rowH = Math.min(150, (H * 0.42) / Math.max(1, o.summary.length));
  o.summary.forEach((l, i) => {
    const y = y0 + 260 + i * rowH;
    ctx.fillStyle = 'rgba(12,21,34,.95)'; roundRect(ctx, 60, y, W - 120, rowH - 18, 22); ctx.fill();
    ctx.fillStyle = LIGHT[l.level]; ctx.beginPath(); ctx.arc(120, y + (rowH - 18) / 2, 32, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = 'center'; ctx.font = `30px "Segoe UI Emoji", "Apple Color Emoji", ${SANS}`; ctx.fillStyle = '#04070c';
    ctx.fillText(l.icon, 120, y + (rowH - 18) / 2 + 11); ctx.textAlign = 'left';
    ctx.fillStyle = '#e6edf5'; ctx.font = `700 32px ${SANS}`; ctx.fillText(l.label, 180, y + 52);
    ctx.fillStyle = LIGHT[l.level]; ctx.font = `600 27px ${SANS}`; ctx.fillText(fit(ctx, l.note, W - 300), 180, y + 92);
  });
  ctx.textAlign = 'center';
  const cy = H - H * 0.17;
  ctx.fillStyle = '#ffffff'; ctx.font = `700 44px ${SANS}`; ctx.fillText('Which food tomorrow? Comment 👇', W / 2, cy);
  ctx.fillStyle = '#5cd3ff'; ctx.font = `600 34px ${SANS}`; ctx.fillText(`Follow ${o.handle} · a new food every day`, W / 2, cy + 64);
  ctx.restore(); ctx.textAlign = 'left';
}

function fadeEdge(ctx: CanvasRenderingContext2D, W: number, y: number, h: number, up: boolean) {
  const g = ctx.createLinearGradient(0, up ? y : y, 0, up ? y - h : y + h);
  g.addColorStop(0, 'rgba(4,7,12,1)'); g.addColorStop(1, 'rgba(4,7,12,0)');
  ctx.fillStyle = g; ctx.fillRect(0, up ? y - h : y, W, h);
}
function fit(ctx: CanvasRenderingContext2D, t: string, w: number) {
  if (ctx.measureText(t).width <= w) return t;
  let s = t; while (s.length > 3 && ctx.measureText(`${s}…`).width > w) s = s.slice(0, -1);
  return `${s}…`;
}
function wrap(ctx: CanvasRenderingContext2D, text: string, w: number, max: number): string[] {
  const words = text.split(/\s+/), lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const t = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(t).width > w && cur) { lines.push(cur); cur = word; } else cur = t;
  }
  if (cur) lines.push(cur);
  if (lines.length > max) { lines.length = max; lines[max - 1] = fit(ctx, `${lines[max - 1]}…`, w); }
  return lines;
}
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/** First sentence(s) of a chapter, short enough for a caption. */
export function captionOf(text: string, max = 130): string {
  const parts = text.split(/(?<=[.!?])\s+/); // sentence ends need a space after them, so 2.4 stays one number
  let out = '';
  for (const p of parts) { if ((out + ' ' + p).length > max && out) break; out = out ? `${out} ${p}` : p; }
  return out.trim();
}

type Downloads = { save: (r: { filename: string; data: Blob }) => Promise<{ status: string }> };
type ClaudeHost = { use: (name: string) => Promise<unknown> };

/** Offers the file: through the claude.ai viewer when available, otherwise a normal browser download. */
export async function saveFile(filename: string, blob: Blob): Promise<'saved' | 'declined' | 'unavailable'> {
  const host = (window as unknown as { claude?: ClaudeHost }).claude;
  const dl = host ? ((await host.use('downloads')) as Downloads | null) : null;
  if (dl) {
    try { await dl.save({ filename, data: blob }); return 'saved'; } catch (e) { return (e as { code?: string }).code === 'declined' ? 'declined' : 'unavailable'; }
  }
  if (host) return 'unavailable';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  return 'saved';
}
