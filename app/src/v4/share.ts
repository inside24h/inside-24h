// "Share video": records the 3D body while the whole 24 h plays and draws a social-ready frame around it:
// a hook title, burned-in captions (most people watch muted), where the drink is and how much, the traffic lights,
// a day progress bar, and an end card with the day's summary and a call to comment. MP4 where the browser can,
// otherwise WebM. The WebGL canvas needs preserveDrawingBuffer.
// 2026-10-22 video polish: timing comes from video-plan.ts (reading-speed rule, 62-75 s long cut, ≤ 30 s short cut),
// every word stays inside the platform safe zone (SAFE below), our own soundtrack (video-audio.ts), brand fonts,
// a hook frame as the first frame (= thumbnail) and an end card that loops back to it.
import { FPS, INTRO_S, OUTRO_S, type Plan, type VFrame } from './video-plan';
import { aacConfig, encodeSoundtrack, playSoundtrack, renderSoundtrack, SAMPLE_RATE } from './video-audio';

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
const WORD = ['Fine', 'Mild stress', 'High stress'];
// the app's own fonts (self-hosted, assets/fonts), with system fallbacks
const SANS = '"Geist", system-ui, "Segoe UI", Roboto, sans-serif';
const SERIF = '"Instrument Serif", Georgia, "Times New Roman", serif';
const EMOJI = `"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", ${SANS}`;
export const SIZE: Record<Format, [number, number]> = { reel: [1080, 1920], feed: [1080, 1350] };
/** Video bitrate: high enough that the platforms' own re-encode starts from a clean picture, small enough to upload
 *  quickly (≈ 70 MB for 70 s). */
export const VIDEO_BITRATE = 8_000_000;

/** SAFE ZONES on the 1080×1920 frame: where TikTok, Instagram/Facebook Reels and YouTube Shorts draw their own
 *  buttons and text. Every word we draw stays inside (tested in share.test.ts). Union of the platforms' published
 *  templates (Shorts: top 288 / bottom 672 / right 192 are ad numbers; organic UI is smaller) with organic
 *  screenshots: top bar (tabs, search) above 280; name, caption, sound and progress below 1320; the like / comment
 *  / share column right of 888 from y = 840 down. The body itself may run under them; only words may not.
 *  Feed (4:5) has no overlays on the picture: plain margins. */
export const SAFE: Record<Format, { top: number; bottom: number; left: number; right: number; lowFrom: number; rightLow: number }> = {
  reel: { top: 280, bottom: 1320, left: 80, right: 1000, lowFrom: 840, rightLow: 888 },
  feed: { top: 50, bottom: 1290, left: 60, right: 1020, lowFrom: 1350, rightLow: 1020 },
};

/** Waits for the brand fonts, so the first frame is never drawn in a fallback font. */
export async function loadFonts() {
  try {
    if (typeof document === 'undefined' || !document.fonts) return;
    await Promise.race([
      Promise.all([`700 40px ${SANS}`, `600 40px ${SANS}`, `400 40px ${SERIF}`].map((f) => document.fonts.load(f, 'Aa 0–9 ‰'))),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  } catch { /* draw with the fallback fonts */ }
}

export function pickMime(): { mime: string; ext: 'mp4' | 'webm' } | null {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const [mime, ext] of [['video/mp4;codecs=avc1', 'mp4'], ['video/mp4', 'mp4'], ['video/webm;codecs=vp9', 'webm'], ['video/webm;codecs=vp8', 'webm'], ['video/webm', 'webm']] as const) {
    if (MediaRecorder.isTypeSupported(mime)) return { mime, ext };
  }
  return null;
}

/**
 * Screen recording for browsers without WebCodecs: plays the same plan in real time (same captions, same reading
 * times, same soundtrack), so only the smoothness depends on the computer. `seek(minute)` moves the day; the 3D view
 * keeps drawing itself.
 */
export async function record(source: HTMLCanvasElement, format: Format, overlay: () => Overlay, seek: (minute: number) => void,
  plan: Plan, opts: { sound: boolean; onTick?: (f: number) => void } = { sound: true }): Promise<{ blob: Blob; ext: string; audio: boolean }> {
  const fmt = pickMime();
  if (!fmt) throw new Error('This browser can’t record video.');
  await loadFonts();
  const [W, H] = SIZE[format];
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const ctx = out.getContext('2d')!;
  const stream = out.captureStream(FPS);
  let sound: ReturnType<typeof playSoundtrack> = null;
  if (opts.sound && typeof OfflineAudioContext !== 'undefined') {
    try { sound = playSoundtrack(await renderSoundtrack(plan.seconds, plan.cues, plan.introS)); } catch { sound = null; }
    if (sound) stream.addTrack(sound.track);
  }
  // with a sound track, name only the container: a codecs list naming just the video codec can refuse the audio
  const withAudio = fmt.ext === 'mp4'
    ? ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,opus', 'video/mp4']
    : ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  const mime = sound ? withAudio.find((m) => MediaRecorder.isTypeSupported(m)) ?? fmt.mime.split(';')[0] : fmt.mime;
  let rec: MediaRecorder;
  try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: VIDEO_BITRATE }); }
  catch { if (sound) { stream.removeTrack(sound.track); sound.stop(); sound = null; } rec = new MediaRecorder(stream, { mimeType: fmt.mime, videoBitsPerSecond: VIDEO_BITRATE }); }
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  let first: HTMLCanvasElement | null = null;
  return new Promise((resolve, reject) => {
    rec.onstop = () => resolve({ blob: new Blob(chunks, { type: fmt.mime.split(';')[0] }), ext: fmt.ext, audio: !!sound });
    rec.onerror = () => { sound?.stop(); reject(new Error('The recording failed. Please try again.')); };
    const t0 = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const i = Math.max(0, Math.floor(((now - t0) / 1000) * FPS)); // the first rAF time can be a little before t0
      if (i >= plan.frames.length) { cancelAnimationFrame(raf); rec.stop(); sound?.stop(); stream.getTracks().forEach((s) => s.stop()); return; }
      const fr = plan.frames[i];
      seek(fr.m);
      drawFrame(ctx, W, H, source, overlay(), format, fr, plan, first);
      if (!first) first = snapshot(out);
      opts.onTick?.(i / plan.frames.length);
      raf = requestAnimationFrame(frame);
    };
    rec.start(250); sound?.start();
    raf = requestAnimationFrame(frame);
  });
}
const snapshot = (c: HTMLCanvasElement) => { const s = document.createElement('canvas'); s.width = c.width; s.height = c.height; s.getContext('2d')!.drawImage(c, 0, 0); return s; };

// ---------- frame-exact recording (WebCodecs + MP4 muxer) ----------
// Each video frame is rendered on purpose and stamped at exactly 1/30 s, so the result is smooth and the right
// length on any computer, even a slow one (MediaRecorder above just films the screen in real time).
// Yield to the browser without setTimeout: timers are throttled to ~1/min in background tabs, message events are not.
const yieldNow = () => new Promise<void>((r) => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
export const canEncode = () => typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';

/** In-app browsers of social apps (Instagram, Facebook, TikTok, Snapchat, LINE…). They usually lack WebCodecs and
 *  their screen recording is unreliable, so we send people to their real browser instead. */
export const isInAppBrowser = (ua: string) => /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Bytedance|BytedanceWebview|Snapchat|\bLine\/|Twitter/i.test(ua);

/** How this browser can make the video: frame by frame (WebCodecs), by filming the screen (MediaRecorder), or not at all. */
export function videoSupport(env: { encode: boolean; mime: boolean; ua: string }): 'frames' | 'screen' | 'none' {
  if (env.encode) return 'frames';
  if (env.mime && !isInAppBrowser(env.ua)) return 'screen';
  return 'none';
}
export const videoSupportHere = () => videoSupport({ encode: canEncode(), mime: !!pickMime(), ua: typeof navigator === 'undefined' ? '' : navigator.userAgent });

/** H.264 config this browser can encode at W×H: High, then Main, then Baseline (all level 4.0+, enough for 1080×1920 @ 30). */
async function h264Config(W: number, H: number): Promise<VideoEncoderConfig> {
  for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.42e028', 'avc1.42003e']) {
    for (const hw of ['no-preference', 'prefer-software'] as const) {
      const c: VideoEncoderConfig = { codec, width: W, height: H, bitrate: VIDEO_BITRATE, bitrateMode: 'variable', framerate: FPS, avc: { format: 'avc' }, hardwareAcceleration: hw };
      try { if ((await VideoEncoder.isConfigSupported(c)).supported) return c; } catch { /* try the next one */ }
    }
  }
  throw new Error('This browser cannot encode H.264 video. Please try Chrome, Edge or Safari.');
}

/** Encodes frames drawn by `draw(i)` into an MP4 (plus our soundtrack when `sound` is given). Shared by the single
 *  video and the comparison video. Throttled by the encoder's queue, so memory stays flat on long videos. */
async function encodeMp4(out: HTMLCanvasElement, count: number, draw: (i: number) => void, sound: { seconds: number; cues: Plan['cues']; beatFrom: number } | null,
  onTick?: (frac: number) => void): Promise<{ blob: Blob; ext: string; audio: boolean }> {
  const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
  const W = out.width, H = out.height;
  const config = await h264Config(W, H);
  // sound: rendered offline first (a second or two), then encoded before the picture
  const acfg = sound ? await aacConfig() : null;
  let abuf: AudioBuffer | null = null;
  if (acfg && sound) { try { abuf = await renderSoundtrack(sound.seconds, sound.cues, sound.beatFrom); } catch { abuf = null; } }
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({ target, video: { codec: 'avc', width: W, height: H, frameRate: FPS },
    ...(abuf ? { audio: { codec: 'aac' as const, numberOfChannels: 2, sampleRate: SAMPLE_RATE } } : {}),
    fastStart: 'in-memory', firstTimestampBehavior: 'offset' });
  if (abuf && acfg) {
    try { await encodeSoundtrack(abuf, acfg, (c, m) => muxer.addAudioChunk(c, m)); }
    catch { return encodeMp4(out, count, draw, null, onTick); } // the sound failed: make the same video silent
  }
  let failed: Error | null = null;
  const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { failed = e as Error; } });
  enc.configure(config);
  for (let i = 0; i < count; i++) {
    draw(i);
    const frame = new VideoFrame(out, { timestamp: Math.round((i * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
    enc.encode(frame, { keyFrame: i % (FPS * 2) === 0 });
    frame.close();
    onTick?.((i + 1) / count);
    while (enc.encodeQueueSize > 6 && !failed) await enc.flush();
    if ((i + 1) % 10 === 0) await yieldNow(); // let the progress badge repaint
    if (failed) throw failed;
  }
  await enc.flush(); enc.close();
  if (failed) throw failed;
  muxer.finalize();
  return { blob: new Blob([target.buffer], { type: 'video/mp4' }), ext: 'mp4', audio: !!abuf };
}

/** step(minute) must set the day position and render one 1/30 s frame of the 3D scene synchronously.
 *  plan = every frame of the video (video-plan.ts). With sound on and an AAC encoder available, our own
 *  soundtrack goes in as a second track; otherwise the video is silent (still valid everywhere). */
export async function recordFrames(source: HTMLCanvasElement, format: Format, overlay: () => Overlay,
  step: (minute: number) => void, plan: Plan, opts: { sound: boolean; onTick?: (frac: number) => void } = { sound: true }): Promise<{ blob: Blob; ext: string; audio: boolean }> {
  await loadFonts();
  const [W, H] = SIZE[format];
  // WebCodecs without an H.264 encoder (some Firefox / Linux builds): film the same plan in real time instead;
  // `step` renders each frame itself, so this works while the 3D view is paused for recording
  try { await h264Config(W, H); } catch (e) { if (pickMime()) return record(source, format, overlay, step, plan, opts); throw e; }
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const ctx = out.getContext('2d')!;
  let first: HTMLCanvasElement | null = null;
  return encodeMp4(out, plan.frames.length, (i) => {
    // settle (after the encoder setup, when the 3D view has its recording size): camera flies in, liquid fades in
    if (i === 0) for (let f = 0; f < 20; f++) step(0);
    const fr = plan.frames[i];
    step(fr.m);
    drawFrame(ctx, W, H, source, overlay(), format, fr, plan, first);
    if (!first) first = snapshot(out); // the hook frame, for the loop back at the very end
  }, opts.sound ? { seconds: plan.seconds, cues: plan.cues, beatFrom: plan.introS } : null, opts.onTick);
}

/** One video frame of the plan: the main picture, plus the hook card (intro) or the end card (outro). */
export function drawFrame(ctx: CanvasRenderingContext2D, W: number, H: number, src: CanvasImageSource & { width: number; height: number },
  o: Overlay, format: Format, fr: VFrame, plan: Pick<Plan, 'stopsU' | 'introS' | 'outroS'> | null, first: HTMLCanvasElement | null) {
  // the hook card leaves first, then the headline and the panels come in (no two layers of words at once)
  const introS = plan?.introS ?? INTRO_S.long, ti = fr.k * introS;
  const hookA = fr.phase === 'intro' ? 1 - smooth((ti - (introS - 0.7)) / 0.35) : 0;
  const uiA = fr.phase === 'intro' ? smooth((ti - (introS - 0.35)) / 0.35) : 1;
  drawMain(ctx, W, H, src, o, format, { cap: fr.cap, capA: fr.capA, uiA, stopsU: plan?.stopsU, title: fr.title, plateA: fr.plateA });
  if (fr.phase === 'intro') drawIntro(ctx, W, H, o, hookA, format);
  if (fr.phase === 'outro') {
    const outS = plan?.outroS ?? OUTRO_S.long, t = fr.k * outS;
    drawOutro(ctx, W, H, o, smooth(t / 0.45), format);
    // loop: the last half second dissolves into the first frame, so a replay starts seamlessly
    if (first && t > outS - 0.5) { ctx.save(); ctx.globalAlpha = smooth((t - (outS - 0.5)) / 0.5); ctx.drawImage(first, 0, 0); ctx.restore(); }
  }
}
const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };

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
export function stampFor(minute: number, solid = false): string {
  if (minute < 1) return solid ? 'FIRST BITE' : 'FIRST SIP';
  if (minute < 59.5) return `${Math.round(minute)} MIN LATER`;
  // under 6 h to the half hour ("1½ HOURS LATER", not a rounded-up "2 HOURS"), later to the hour
  const h = minute < 360 ? Math.round(minute / 30) / 2 : Math.round(minute / 60);
  const whole = Math.floor(h), half = h - whole >= 0.5;
  return `${whole}${half ? '½' : ''} ${h === 1 ? 'HOUR' : 'HOURS'} LATER`;
}

/** The time stamp chip ("20 MIN LATER"), left edge at x, top at y, h tall. Returns its width. */
function drawStamp(ctx: CanvasRenderingContext2D, x: number, y: number, s: string, h: number): number {
  ctx.save(); ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(h * 0.62)}px ${SANS}`;
  const w = ctx.measureText(s).width + h * 0.7;
  ctx.fillStyle = 'rgba(92,211,255,.96)'; roundRect(ctx, x, y, w, h, h * 0.28); ctx.fill();
  ctx.fillStyle = '#04070c'; text(ctx, s, x + h * 0.35, y + h * 0.71);
  ctx.restore();
  return w;
}

// ---------- side-by-side comparison Reel ----------
export interface CmpSide { name: string; color: string; step: string; caption: string; where?: string; sugar: string; sugarLevel: 0 | 1 | 2; lights: Light[];
  summary: { kcal: number; sugarPeak: string; worst: (Light & { note: string })[] } }
export interface CmpOverlay { hook: string; clock: string; progress: number; handle: string; a: CmpSide; b: CmpSide; stamp?: string; verdict?: string }

/** Comparison Reel (9:16): both bodies side by side at the top, where the whole width is free of platform buttons;
 *  the two captions stacked below, inside the safe column. Timing from planCompare (video-plan.ts). */
export async function recordCompare(canvA: HTMLCanvasElement, overlay: () => CmpOverlay,
  step: (minute: number) => void, plan: Plan, opts: { sound: boolean; onTick?: (f: number) => void } = { sound: true }): Promise<{ blob: Blob; ext: string; audio: boolean }> {
  await loadFonts();
  const W = 1080, H = 1920;
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const ctx = out.getContext('2d')!;
  let first: HTMLCanvasElement | null = null;
  return encodeMp4(out, plan.frames.length, (i) => {
    if (i === 0) for (let f = 0; f < 20; f++) step(0);
    const fr = plan.frames[i];
    step(fr.m);
    drawCmpFrame(ctx, W, H, canvA, overlay(), fr, plan, first);
    if (!first) first = snapshot(out);
  }, opts.sound ? { seconds: plan.seconds, cues: plan.cues, beatFrom: plan.introS } : null, opts.onTick);
}

/** One comparison frame: main picture + hook card (intro) or end card (outro), as drawFrame for the single video. */
export function drawCmpFrame(ctx: CanvasRenderingContext2D, W: number, H: number, src: CanvasImageSource & { width: number; height: number },
  o: CmpOverlay, fr: VFrame, plan: Pick<Plan, 'stopsU' | 'introS' | 'outroS'> | null, first: HTMLCanvasElement | null) {
  const introS = plan?.introS ?? INTRO_S.long, ti = fr.k * introS;
  const hookA = fr.phase === 'intro' ? 1 - smooth((ti - (introS - 0.7)) / 0.35) : 0;
  const uiA = fr.phase === 'intro' ? smooth((ti - (introS - 0.35)) / 0.35) : 1;
  drawCmp(ctx, W, H, src, o, { cap: fr.cap ?? o.a.caption, capB: fr.capB ?? o.b.caption, capA: fr.phase === 'main' ? fr.capA : 0, uiA, stopsU: plan?.stopsU, title: fr.title, titleB: fr.titleB, plateA: fr.plateA });
  if (fr.phase === 'intro') drawCmpIntro(ctx, W, H, o, hookA);
  if (fr.phase === 'outro') {
    const outS = plan?.outroS ?? OUTRO_S.long, t = fr.k * outS;
    drawCmpOutro(ctx, W, H, o, smooth(t / 0.45));
    if (first && t > outS - 0.5) { ctx.save(); ctx.globalAlpha = smooth((t - (outS - 0.5)) / 0.5); ctx.drawImage(first, 0, 0); ctx.restore(); }
  }
}

/** Panel positions of the comparison frame (shared by drawing and tests). */
function layoutCmp(ctx: CanvasRenderingContext2D, o: CmpOverlay) {
  const S = SAFE.reel, kickY = S.top + 34;
  const head = fitWrap(ctx, o.hook, S.right - S.left, 2, 58, 40, (px) => `400 ${px}px ${SERIF}`);
  const head0 = kickY + 14 + head.px * 0.9, headLH = head.px * 1.04, headBot = head0 + (head.lines.length - 1) * headLH + head.px * 0.24;
  const stampH = 62, stampTop = headBot + 16;
  const nameY = stampTop + stampH + 58; // baseline of the two names
  const sugarTop = nameY + 18, sugarH = 58;
  const blockGap = 14, capFs = 36, capLH = 44, pad = 18;
  const blockH = pad + 30 + 12 + 3 * capLH + pad - 6;
  const blockB = S.bottom - blockH, blockA = blockB - blockGap - blockH;
  return { S, kickY, head, head0, headLH, stampH, stampTop, nameY, sugarTop, sugarH, blockA, blockB, blockH, capFs, capLH, pad };
}

function drawCmp(ctx: CanvasRenderingContext2D, W: number, H: number, src: CanvasImageSource & { width: number; height: number }, o: CmpOverlay,
  f: { cap: string; capB: string; capA: number; uiA: number; stopsU?: number[]; title?: string; titleB?: string; plateA?: number }) {
  const Lo = layoutCmp(ctx, o), S = Lo.S, L = S.left, R = S.right, RL = S.rightLow;
  // both bodies, side by side, big; the band reaches behind the captions and fades out
  const top = Lo.sugarTop + 10, bot = S.bottom - 40, colW = W / 2, hw = src.width / 2;
  stageBg(ctx, W, H, (top + bot) / 2);
  if (src.width && src.height) {
    for (let k = 0; k < 2; k++) {
      const half = { width: hw, height: src.height };
      const s = Math.max(colW / half.width, (bot - top) / half.height), sw = colW / s, sh = (bot - top) / s;
      ctx.drawImage(src, k * hw + (hw - sw) / 2, (src.height - sh) / 2, sw, sh, k * colW, top, colW, bot - top);
    }
    // fade the band's top and bottom into the background
    const g1 = ctx.createLinearGradient(0, top, 0, top + 160); g1.addColorStop(0, 'rgba(4,7,12,1)'); g1.addColorStop(1, 'rgba(4,7,12,0)');
    ctx.fillStyle = g1; ctx.fillRect(0, top, W, 160);
    const g2 = ctx.createLinearGradient(0, bot - 200, 0, bot); g2.addColorStop(0, 'rgba(4,7,12,0)'); g2.addColorStop(1, 'rgba(4,7,12,1)');
    ctx.fillStyle = g2; ctx.fillRect(0, bot - 200, W, 200); ctx.fillStyle = '#04070c'; ctx.fillRect(0, bot, W, H - bot);
  }
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.font = `700 28px ${SANS}`; ctx.fillStyle = '#5cd3ff'; shade(ctx, true); text(ctx, 'INSIDE 24H', L, Lo.kickY);
  if (o.handle) { ctx.textAlign = 'right'; ctx.fillStyle = '#c9d6e4'; ctx.font = `600 28px ${SANS}`; text(ctx, fit(ctx, o.handle, (R - L) / 2), R, Lo.kickY); ctx.textAlign = 'left'; }
  ctx.save(); ctx.globalAlpha = f.uiA;
  ctx.fillStyle = '#ffffff'; ctx.font = `400 ${Lo.head.px}px ${SERIF}`;
  Lo.head.lines.forEach((ln, i) => text(ctx, ln, L, Lo.head0 + i * Lo.headLH));
  shade(ctx, false);
  if (o.stamp) {
    const w = drawStamp(ctx, L, Lo.stampTop, o.stamp, Lo.stampH);
    ctx.font = `400 48px ${SERIF}`; ctx.fillStyle = '#e6edf5'; shade(ctx, true); text(ctx, o.clock, L + w + 20, Lo.stampTop + Lo.stampH * 0.72); shade(ctx, false);
  }
  // the two names and their blood sugar right now, each over its own body (top part: the whole width is safe)
  const halfL = [L, colW + 10], halfR = [colW - 10, R];
  [o.a, o.b].forEach((s, k) => {
    const x0 = halfL[k], x1 = halfR[k], cx = (x0 + x1) / 2, w = x1 - x0;
    ctx.textAlign = 'center'; shade(ctx, true);
    ctx.font = `400 50px ${SERIF}`; const nm = fit(ctx, s.name, w - 50), nw = ctx.measureText(nm).width;
    ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(cx - nw / 2 - 22, Lo.nameY - 15, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffffff'; text(ctx, nm, cx + 8, Lo.nameY); shade(ctx, false);
    let fs = 32; ctx.font = `700 ${fs}px ${SANS}`;
    while (fs > 22 && ctx.measureText(s.sugar).width + 44 > w) { fs -= 2; ctx.font = `700 ${fs}px ${SANS}`; }
    const sw = ctx.measureText(s.sugar).width + 44;
    ctx.fillStyle = 'rgba(6,12,20,.9)'; roundRect(ctx, cx - sw / 2, Lo.sugarTop, sw, Lo.sugarH, Lo.sugarH / 2); ctx.fill();
    ctx.strokeStyle = LIGHT[s.sugarLevel]; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = LIGHT[s.sugarLevel]; text(ctx, s.sugar, cx, Lo.sugarTop + Lo.sugarH / 2 + fs * 0.36);
    ctx.textAlign = 'left';
  });
  // VS badge between the bodies
  const vy = Lo.sugarTop + Lo.sugarH + 150;
  ctx.fillStyle = '#04070c'; ctx.beginPath(); ctx.arc(W / 2, vy, 38, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5cd3ff'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#5cd3ff'; ctx.font = `700 30px ${SANS}`; ctx.textAlign = 'center'; text(ctx, 'VS', W / 2, vy + 11); ctx.textAlign = 'left';
  // the two captions, stacked in the safe column
  ctx.save(); ctx.globalAlpha *= f.plateA ?? 1;
  [[o.a, f.cap, Lo.blockA, f.title], [o.b, f.capB, Lo.blockB, f.titleB]].forEach(([s0, cap0, y0, t0]) => {
    const s = s0 as CmpSide, cap = cap0 as string, y = y0 as number, title = (t0 as string | undefined) ?? s.step;
    ctx.fillStyle = 'rgba(6,12,20,.86)'; roundRect(ctx, L, y, RL - L, Lo.blockH, 22); ctx.fill();
    ctx.strokeStyle = 'rgba(220,235,250,.32)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(L + Lo.pad + 10, y + Lo.pad + 20, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = `700 26px ${SANS}`; ctx.fillStyle = '#ffffff';
    const nm = fit(ctx, s.name.toUpperCase(), (RL - L) * 0.45); text(ctx, nm, L + Lo.pad + 30, y + Lo.pad + 29);
    const nx = L + Lo.pad + 30 + ctx.measureText(nm).width + 14;
    ctx.fillStyle = '#5cd3ff'; ctx.font = `700 24px ${SANS}`; text(ctx, fit(ctx, `· ${title.toUpperCase()}`, RL - Lo.pad - nx), nx, y + Lo.pad + 29);
    if (cap) {
      const c = fitWrap(ctx, cap, RL - L - 2 * Lo.pad, 3, Lo.capFs, Lo.capFs - 12, (px) => `600 ${px}px ${SANS}`);
      ctx.save(); ctx.globalAlpha *= f.capA; ctx.fillStyle = '#ffffff';
      c.lines.forEach((ln, i) => text(ctx, ln, L + Lo.pad, y + Lo.pad + 30 + 12 + c.px * 0.86 + i * Lo.capLH));
      ctx.restore();
    }
  });
  ctx.restore(); // plateA
  ctx.restore();
  // below the safe zone: small print and the day bar
  ctx.textAlign = 'left'; ctx.fillStyle = '#7a899d'; ctx.font = `500 22px ${SANS}`;
  text(ctx, fit(ctx, 'Simulation for a typical body · not medical advice · anatomy: BodyParts3D, CC BY 4.0', R - L), L, S.bottom + 44, true);
  const py = S.bottom + 104;
  ctx.fillStyle = 'rgba(140,170,210,.22)'; roundRect(ctx, L, py, R - L, 10, 5); ctx.fill();
  ctx.fillStyle = '#5cd3ff'; roundRect(ctx, L, py, Math.max(10, (R - L) * Math.min(1, o.progress)), 10, 5); ctx.fill();
  for (const u of f.stopsU ?? []) { ctx.fillStyle = u <= o.progress + 1e-3 ? '#5cd3ff' : 'rgba(140,170,210,.55)'; ctx.beginPath(); ctx.arc(L + (R - L) * u, py + 5, 9, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#8292a7'; ctx.font = `500 24px ${SANS}`; text(ctx, '0 h', L, py + 48, true); ctx.textAlign = 'right'; text(ctx, '24 h', R, py + 48, true); ctx.textAlign = 'left';
}

function drawCmpIntro(ctx: CanvasRenderingContext2D, W: number, _H: number, o: CmpOverlay, alpha: number) {
  if (alpha <= 0.001) return;
  const S = SAFE.reel, L = S.left, R = S.right;
  ctx.save(); ctx.globalAlpha = alpha;
  const top = S.top + 40, bot = S.lowFrom + 120;
  const g = ctx.createLinearGradient(0, top - 120, 0, bot + 140);
  g.addColorStop(0, 'rgba(4,7,12,0)'); g.addColorStop(0.18, 'rgba(4,7,12,.74)'); g.addColorStop(0.8, 'rgba(4,7,12,.74)'); g.addColorStop(1, 'rgba(4,7,12,0)');
  ctx.fillStyle = g; ctx.fillRect(0, top - 120, W, bot - top + 260);
  const kY = top + 70;
  [o.a, o.b].forEach((s, k) => { ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(L + 26 + k * 40, kY - 12, 24, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4; ctx.stroke(); });
  ctx.textAlign = 'left'; ctx.fillStyle = '#5cd3ff'; ctx.font = `700 38px ${SANS}`; text(ctx, 'SIDE BY SIDE · 0–24 H', L + 108, kY);
  const room = S.lowFrom - 10 - (kY + 40);
  let best = fitWrap(ctx, o.hook, R - L, 4, 100, 56, (px) => `400 ${px}px ${SERIF}`);
  while (best.px > 56 && best.lines.length * best.px * 1.02 > room) best = fitWrap(ctx, o.hook, R - L, 4, best.px - 2, 56, (px) => `400 ${px}px ${SERIF}`);
  if (best.lines.length * best.px * 1.02 > room) best = fitWrap(ctx, o.hook, S.rightLow - L, 6, 64, 48, (px) => `400 ${px}px ${SERIF}`);
  ctx.fillStyle = '#ffffff'; ctx.font = `400 ${best.px}px ${SERIF}`; shade(ctx, true);
  best.lines.forEach((ln, i) => text(ctx, ln, L, kY + 30 + best.px * 0.92 + i * best.px * 1.02));
  shade(ctx, false);
  ctx.restore(); ctx.textAlign = 'left';
}

function drawCmpOutro(ctx: CanvasRenderingContext2D, W: number, H: number, o: CmpOverlay, alpha: number) {
  const S = SAFE.reel, L = S.left, RL = S.rightLow;
  ctx.save(); ctx.globalAlpha = alpha;
  bg(ctx, W, H);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  let y = S.top + 44;
  ctx.fillStyle = '#5cd3ff'; ctx.font = `700 32px ${SANS}`; text(ctx, 'AFTER 24 HOURS', L, y);
  y += 26;
  // one card per food: name, kcal, sugar peak, and its four lights in a 2 × 2 grid
  [o.a, o.b].forEach((s) => {
    const h = 300;
    ctx.fillStyle = 'rgba(12,21,34,.95)'; roundRect(ctx, L, y, RL - L, h, 24); ctx.fill();
    ctx.strokeStyle = 'rgba(220,235,250,.3)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(L + 40, y + 46, 16, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = `400 54px ${SERIF}`; text(ctx, fit(ctx, s.name, RL - L - 100), L + 70, y + 64);
    ctx.fillStyle = '#e6edf5'; ctx.font = `700 30px ${SANS}`;
    text(ctx, fit(ctx, `${Math.round(s.summary.kcal)} kcal · Blood sugar ${s.summary.sugarPeak}`, RL - L - 56), L + 28, y + 114);
    const cw = (RL - L - 56) / 2;
    s.summary.worst.slice(0, 4).forEach((l, j) => {
      const cx = L + 28 + (j % 2) * cw, cy = y + 150 + Math.floor(j / 2) * 72;
      ctx.fillStyle = LIGHT[l.level]; ctx.beginPath(); ctx.arc(cx + 18, cy + 22, 18, 0, Math.PI * 2); ctx.fill();
      ctx.textAlign = 'center'; ctx.font = `19px ${EMOJI}`; ctx.fillStyle = '#04070c'; ctx.fillText(l.icon, cx + 18, cy + 29); ctx.textAlign = 'left';
      ctx.fillStyle = '#e6edf5'; ctx.font = `700 25px ${SANS}`; text(ctx, fit(ctx, l.label, cw - 60), cx + 48, cy + 16);
      ctx.fillStyle = LIGHT[l.level]; ctx.font = `600 23px ${SANS}`; text(ctx, fit(ctx, l.note, cw - 60), cx + 48, cy + 46);
    });
    y += h + 18;
  });
  if (o.verdict) {
    const v = fitWrap(ctx, o.verdict, RL - L - 48, 2, 38, 30, (px) => `700 ${px}px ${SANS}`);
    const bh = 30 + v.lines.length * v.px * 1.2;
    ctx.fillStyle = 'rgba(61,220,132,.14)'; roundRect(ctx, L, y, RL - L, bh, 22); ctx.fill();
    ctx.strokeStyle = 'rgba(61,220,132,.7)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = `700 ${v.px}px ${SANS}`;
    v.lines.forEach((ln, i) => text(ctx, ln, L + 24, y + 15 + v.px * 0.95 + i * v.px * 1.2));
    y += bh + 30;
  }
  const cta = fitWrap(ctx, 'Which one would you pick? 👇', RL - L, 2, 46, 32, (px) => `700 ${px}px ${SANS}`);
  ctx.fillStyle = '#ffffff'; ctx.font = `700 ${cta.px}px ${SANS}`;
  cta.lines.forEach((ln, i) => text(ctx, ln, L, y + cta.px * 0.9 + i * cta.px * 1.18));
  y += cta.px * 0.9 + (cta.lines.length - 1) * cta.px * 1.18 + 46;
  ctx.fillStyle = '#5cd3ff'; ctx.font = `600 30px ${SANS}`;
  text(ctx, fit(ctx, o.handle ? `Follow ${o.handle} · a new comparison every day` : 'A new comparison every day', RL - L), L, y);
  ctx.fillStyle = '#7a899d'; ctx.font = `500 22px ${SANS}`;
  text(ctx, fit(ctx, 'Simulation for a typical body · not medical advice · anatomy: BodyParts3D, CC BY 4.0', S.right - L), L, S.bottom + 44, true);
  ctx.restore(); ctx.textAlign = 'left';
}

/** QA: one composed comparison frame (#cmpframe=<other food>&phase=intro|main|outro). */
export function composeCmpFrame(A: HTMLCanvasElement, o: CmpOverlay, phase: 'intro' | 'main' | 'outro'): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1920;
  const ctx = c.getContext('2d')!;
  drawCmpFrame(ctx, 1080, 1920, A, o, { phase, m: 0, t: 0, capA: phase === 'main' ? 1 : 0, k: phase === 'outro' ? 0.5 : 0 }, null, null);
  return c;
}

/** One composed video frame on a canvas (QA: #frame=reel-intro / reel-main / reel-outro). */
export function composeFrame(source: HTMLCanvasElement, format: Format, o: Overlay, phase: 'intro' | 'main' | 'outro'): HTMLCanvasElement {
  const [W, H] = SIZE[format];
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  // intro = exactly the video's first frame (the cover); outro = the end card fully in
  const fr: VFrame = { phase, m: 0, t: 0, cap: o.caption, capA: phase === 'main' ? 1 : 0, k: phase === 'outro' ? 0.5 : 0 };
  drawFrame(ctx, W, H, source, o, format, fr, null, null);
  return c;
}

// ---------- drawing ----------
export function bg(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const g = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H * 0.42, H * 0.8);
  g.addColorStop(0, '#0c1b2c'); g.addColorStop(1, '#04070c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ---- text helpers: every word goes through `text`, which (in tests) records its box for the safe-zone check ----
export interface TextBox { x0: number; y0: number; x1: number; y1: number; text: string; deco: boolean }
let textLog: TextBox[] | null = null;
/** Tests: the box of every word drawn while `fn` runs (deco = small print allowed under the platform UI). */
export function logText(fn: () => void): TextBox[] { textLog = []; try { fn(); return textLog; } finally { textLog = null; } }
const fontPx = (ctx: CanvasRenderingContext2D) => Number(/(\d+(?:\.\d+)?)px/.exec(ctx.font)?.[1] ?? 16);
function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, deco = false) {
  if (!s) return;
  ctx.fillText(s, x, y);
  if (textLog && ctx.globalAlpha > 0.02) {
    const w = ctx.measureText(s).width, px = fontPx(ctx), a = ctx.textAlign;
    const x0 = a === 'center' ? x - w / 2 : a === 'right' || a === 'end' ? x - w : x;
    textLog.push({ x0, x1: x0 + w, y0: y - px * 0.78, y1: y + px * 0.22, text: s, deco });
  }
}
/** Largest font (from `max` down to `min`) at which `s` wraps into at most `lines` lines of width `w`. */
function fitWrap(ctx: CanvasRenderingContext2D, s: string, w: number, lines: number, max: number, min: number, font: (px: number) => string): { px: number; lines: string[] } {
  for (let px = max; px >= min; px -= 2) {
    ctx.font = font(px);
    const ls = wrap(ctx, s, w, 99);
    if (ls.length <= lines && ls.every((l) => ctx.measureText(l).width <= w)) return { px, lines: ls };
  }
  // still too long at the smallest size: more lines rather than cutting words off (callers make room)
  ctx.font = font(min);
  return { px: min, lines: wrap(ctx, s, w, 99) };
}
/** Soft dark shadow under light text that sits over the body. */
const shade = (ctx: CanvasRenderingContext2D, on: boolean) => { ctx.shadowColor = on ? 'rgba(0,0,0,.75)' : 'transparent'; ctx.shadowBlur = on ? 14 : 0; ctx.shadowOffsetY = on ? 2 : 0; };

/** The 3D view, cover-cropped into a box (the camera keeps the drink in the middle of its view). */
function drawCover(ctx: CanvasRenderingContext2D, src: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number) {
  if (!src.width || !src.height) return;
  const s = Math.max(w / src.width, h / src.height), sw = w / s, sh = h / s;
  ctx.drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, x, y, w, h);
}

/** The app's stage background: a soft blue glow fading to near-black (v4.css .stage). */
function stageBg(ctx: CanvasRenderingContext2D, W: number, H: number, cy: number) {
  ctx.fillStyle = '#04070c'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, Math.max(W, H) * 0.5);
  g.addColorStop(0, '#0c1b2c'); g.addColorStop(1, 'rgba(4,7,12,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
let band: HTMLCanvasElement | OffscreenCanvas | null = null;
/** The 3D view in a horizontal band whose top and bottom fade to transparent. */
function drawBodyBand(ctx: CanvasRenderingContext2D, src: CanvasImageSource & { width: number; height: number }, W: number, y: number, h: number, fadeTop: number, fadeBot: number) {
  if (typeof OffscreenCanvas === 'undefined' && typeof document === 'undefined') { drawCover(ctx, src, 0, y, W, h); return; } // tests
  const mk = (w: number, hh: number) => (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, hh) : Object.assign(document.createElement('canvas'), { width: w, height: hh }));
  if (!band || band.width !== W || band.height !== h) band = mk(W, h);
  const b = band.getContext('2d') as CanvasRenderingContext2D | null;
  if (!b) { drawCover(ctx, src, 0, y, W, h); return; }
  b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, W, h);
  drawCover(b, src, 0, 0, W, h);
  b.globalCompositeOperation = 'destination-in';
  const g = b.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(fadeTop / h, 'rgba(0,0,0,1)'); g.addColorStop(1 - fadeBot / h, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  b.fillStyle = g; b.fillRect(0, 0, W, h);
  b.globalCompositeOperation = 'source-over';
  ctx.drawImage(band as CanvasImageSource, 0, y);
}

export interface MainIn { cap?: string; capA: number; uiA: number; stopsU?: number[]; title?: string; plateA?: number }
/** Positions of the panels on the main frame (shared by the drawing and the tests). */
function layoutMain(ctx: CanvasRenderingContext2D, o: Overlay, format: Format, cap = '') {
  const reel = format === 'reel', S = SAFE[format];
  const kickY = S.top + (reel ? 34 : 30);
  const head = fitWrap(ctx, o.hook, S.right - S.left, 2, reel ? 62 : 50, reel ? 44 : 38, (px) => `400 ${px}px ${SERIF}`);
  const headLH = head.px * 1.04, head0 = kickY + 14 + head.px * 0.9;
  const headBot = head0 + (head.lines.length - 1) * headLH + head.px * 0.24;
  const stampH = reel ? 68 : 60, stampTop = headBot + (reel ? 18 : 14);
  const lightsTop = stampTop + stampH + (reel ? 14 : 12), lightsH = reel ? 74 : 68;
  const lightsBot = lightsTop + lightsH;
  const capFs = reel ? 50 : 42, capLH = Math.round(capFs * 1.24), capPad = reel ? 26 : 22;
  const capFit = fitWrap(ctx, cap, S.rightLow - S.left - 2 * capPad, 3, capFs, capFs - 12, (px) => `600 ${px}px ${SANS}`);
  const plateH = capPad + 30 + 14 + Math.max(3, capFit.lines.length) * capLH + capPad - 8; // 3 lines, so it never jumps
  const plateTop = S.bottom - plateH;
  const whereH = reel ? 64 : 56, whereTop = plateTop - 14 - whereH;
  return { reel, S, kickY, head, headLH, head0, stampH, stampTop, lightsTop, lightsH, lightsBot, capFs, capLH, capPad, capFit, plateH, plateTop, whereH, whereTop };
}

function drawMain(ctx: CanvasRenderingContext2D, W: number, H: number, src: CanvasImageSource & { width: number; height: number }, o: Overlay, format: Format,
  f: MainIn = { cap: o.caption, capA: 1, uiA: 1 }) {
  const Lo = layoutMain(ctx, o, format, f.cap ?? ''), { reel, S } = Lo;
  const L = S.left, R = S.right, RL = S.rightLow;
  // the body, big, behind everything; centred a little above the middle so the organ in focus sits in the open
  // window between the panels at the top and the caption at the bottom. The 3D view is transparent: it sits on the
  // app's own glow, and its top and bottom edges dissolve (no visible box).
  const bTop = reel ? 220 : 120, bBot = reel ? 1420 : 1180;
  stageBg(ctx, W, H, (bTop + bBot) / 2);
  drawBodyBand(ctx, src, W, bTop, bBot - bTop, reel ? 200 : 120, reel ? 240 : 140);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';

  // brand + handle: small, always inside the safe zone (it is the watermark)
  ctx.font = `700 ${reel ? 28 : 24}px ${SANS}`; ctx.fillStyle = '#5cd3ff'; shade(ctx, true);
  text(ctx, 'INSIDE 24H', L, Lo.kickY);
  if (o.handle) { ctx.textAlign = 'right'; ctx.fillStyle = '#c9d6e4'; ctx.font = `600 ${reel ? 28 : 24}px ${SANS}`; text(ctx, fit(ctx, o.handle, (R - L) / 2), R, Lo.kickY); ctx.textAlign = 'left'; }

  ctx.save(); ctx.globalAlpha = f.uiA;
  // headline: the hook question stays up all video, so anyone who joins late knows what they are watching
  ctx.fillStyle = '#ffffff'; ctx.font = `400 ${Lo.head.px}px ${SERIF}`;
  Lo.head.lines.forEach((ln, i) => text(ctx, ln, L, Lo.head0 + i * Lo.headLH));
  shade(ctx, false);
  // time stamp + clock
  if (o.stamp) {
    const w = drawStamp(ctx, L, Lo.stampTop, o.stamp, Lo.stampH);
    ctx.font = `400 ${reel ? 54 : 46}px ${SERIF}`; ctx.fillStyle = '#e6edf5'; shade(ctx, true);
    text(ctx, o.clock, L + w + 22, Lo.stampTop + Lo.stampH * 0.72); shade(ctx, false);
  }
  // traffic lights: four chips, a dot in the light's colour + the system + the word
  const n = Math.max(1, o.lights.length), gap = 12, cw = (R - L - gap * (n - 1)) / n;
  o.lights.forEach((l, i) => {
    const x = L + i * (cw + gap), y = Lo.lightsTop, h = Lo.lightsH;
    ctx.fillStyle = 'rgba(6,12,20,.84)'; roundRect(ctx, x, y, cw, h, 16); ctx.fill();
    ctx.strokeStyle = l.level === 2 ? 'rgba(255,90,90,.85)' : l.level === 1 ? 'rgba(255,200,61,.5)' : 'rgba(140,170,210,.25)'; ctx.lineWidth = 2; ctx.stroke();
    const r = reel ? 17 : 15;
    ctx.fillStyle = LIGHT[l.level]; ctx.beginPath(); ctx.arc(x + 14 + r, y + h / 2, r, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = 'center'; ctx.font = `${reel ? 19 : 17}px ${EMOJI}`; ctx.fillStyle = '#04070c'; ctx.fillText(l.icon, x + 14 + r, y + h / 2 + 7); ctx.textAlign = 'left';
    const tx = x + 14 + 2 * r + 10, tw = cw - (tx - x) - 8;
    ctx.fillStyle = '#e6edf5'; ctx.font = `600 ${reel ? 25 : 22}px ${SANS}`; text(ctx, fit(ctx, l.label, tw), tx, y + h * 0.43);
    ctx.fillStyle = LIGHT[l.level]; ctx.font = `700 ${reel ? 25 : 22}px ${SANS}`; text(ctx, fit(ctx, WORD[l.level], tw), tx, y + h * 0.8);
  });
  // the number of this moment, big, so it reads without sound
  if (o.pop) {
    // right edge, above the button column; the side is chosen from the tallest card (3 lines), so it never
    // switches sides between moments of the same video
    const w = reel ? 300 : 290, bigFs0 = reel ? 54 : 48, sFs = reel ? 24 : 21, sLH = reel ? 28 : 25;
    const hOf = (lines: number) => 18 + bigFs0 + 8 + lines * sLH + 12;
    ctx.font = `600 ${sFs}px ${SANS}`;
    const small = wrap(ctx, o.pop.small, w - 36, 3), h = hOf(small.length);
    let x = R - w, y = Lo.lightsBot + 14;
    if (y + hOf(3) > S.lowFrom) x = L; // would reach the platforms' button column: the left edge is safe
    if (y + h > Lo.whereTop - 10) y = Math.max(Lo.lightsBot + 8, Lo.whereTop - 10 - h);
    ctx.fillStyle = 'rgba(6,12,20,.86)'; roundRect(ctx, x, y, w, h, 22); ctx.fill();
    ctx.strokeStyle = LIGHT[o.pop.level]; ctx.lineWidth = 4; ctx.stroke();
    let fs = bigFs0; ctx.font = `700 ${fs}px ${SANS}`;
    while (fs > 30 && ctx.measureText(o.pop.big).width > w - 36) { fs -= 2; ctx.font = `700 ${fs}px ${SANS}`; }
    ctx.fillStyle = LIGHT[o.pop.level]; text(ctx, o.pop.big, x + 18, y + 14 + bigFs0 * 0.86);
    ctx.fillStyle = '#e6edf5'; ctx.font = `600 ${sFs}px ${SANS}`;
    small.forEach((ln, i) => text(ctx, ln, x + 18, y + 18 + bigFs0 + 8 + (i + 0.78) * sLH));
  }
  // where the drink is now, with its real colour
  if (o.where) {
    ctx.font = `700 ${reel ? 34 : 30}px ${SANS}`;
    const t = fit(ctx, o.where, RL - L - 92), w = ctx.measureText(t).width + 92, y = Lo.whereTop;
    ctx.fillStyle = 'rgba(6,12,20,.9)'; roundRect(ctx, L, y, w, Lo.whereH, Lo.whereH / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(220,235,250,.4)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = o.color ?? '#fff'; ctx.beginPath(); ctx.arc(L + 34, y + Lo.whereH / 2, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.stroke();
    ctx.fillStyle = '#ffffff'; text(ctx, t, L + 62, y + Lo.whereH / 2 + (reel ? 12 : 11));
  }
  // caption plate: the step in plain words, big, on a dark plate (fixed height, so it never jumps between captions)
  ctx.save(); ctx.globalAlpha *= f.plateA ?? 1;
  ctx.fillStyle = 'rgba(6,12,20,.84)'; roundRect(ctx, L, Lo.plateTop, RL - L, Lo.plateH, 26); ctx.fill();
  ctx.strokeStyle = 'rgba(140,170,210,.22)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#5cd3ff'; ctx.font = `700 ${reel ? 28 : 24}px ${SANS}`;
  text(ctx, fit(ctx, (f.title ?? o.step).toUpperCase(), RL - L - 2 * Lo.capPad), L + Lo.capPad, Lo.plateTop + Lo.capPad + 22);
  const cap = f.cap ?? '';
  if (cap) {
    const fitC = Lo.capFit; ctx.font = `600 ${fitC.px}px ${SANS}`;
    ctx.save(); ctx.globalAlpha *= f.capA; ctx.fillStyle = '#ffffff';
    fitC.lines.forEach((ln, i) => text(ctx, ln, L + Lo.capPad, Lo.plateTop + Lo.capPad + 30 + 14 + fitC.px * 0.86 + i * Lo.capLH));
    ctx.restore();
  }
  ctx.restore(); // plateA
  ctx.restore();

  // below the safe zone: small print and the day bar (fine if a platform covers them; shown in full on X)
  ctx.textAlign = 'left'; ctx.fillStyle = '#7a899d'; ctx.font = `500 ${reel ? 22 : 19}px ${SANS}`;
  text(ctx, fit(ctx, 'Simulation for a typical body · not medical advice · anatomy: BodyParts3D, CC BY 4.0', R - L), L, S.bottom + (reel ? 44 : 34), true);
  if (reel) {
    const y = S.bottom + 104, x0 = L, x1 = R;
    ctx.fillStyle = 'rgba(140,170,210,.22)'; roundRect(ctx, x0, y, x1 - x0, 10, 5); ctx.fill();
    ctx.fillStyle = '#5cd3ff'; roundRect(ctx, x0, y, Math.max(10, (x1 - x0) * Math.min(1, o.progress)), 10, 5); ctx.fill();
    for (const u of f.stopsU ?? []) { ctx.fillStyle = u <= o.progress + 1e-3 ? '#5cd3ff' : 'rgba(140,170,210,.55)'; ctx.beginPath(); ctx.arc(x0 + (x1 - x0) * u, y + 5, 9, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#8292a7'; ctx.font = `500 24px ${SANS}`;
    text(ctx, '0 h', x0, y + 48, true); ctx.textAlign = 'right'; text(ctx, '24 h', x1, y + 48, true); ctx.textAlign = 'left';
  } else {
    ctx.fillStyle = 'rgba(140,170,210,.22)'; ctx.fillRect(0, H - 8, W, 8);
    ctx.fillStyle = '#5cd3ff'; ctx.fillRect(0, H - 8, W * Math.min(1, o.progress), 8);
  }
}

/** Hook card (the first frame = the thumbnail): the question, huge, over the body that is already moving. */
function drawIntro(ctx: CanvasRenderingContext2D, W: number, H: number, o: Overlay, alpha: number, format: Format = 'reel') {
  if (alpha <= 0.001) return;
  const reel = format === 'reel', S = SAFE[format];
  ctx.save(); ctx.globalAlpha = alpha;
  // darken behind the words only; the body stays visible below
  const top = S.top + 40, bot = reel ? S.lowFrom + 120 : H * 0.7;
  const g = ctx.createLinearGradient(0, top - 120, 0, bot + 140);
  g.addColorStop(0, 'rgba(4,7,12,0)'); g.addColorStop(0.18, 'rgba(4,7,12,.74)'); g.addColorStop(0.8, 'rgba(4,7,12,.74)'); g.addColorStop(1, 'rgba(4,7,12,0)');
  ctx.fillStyle = g; ctx.fillRect(0, top - 120, W, bot - top + 260);
  ctx.textAlign = 'left';
  // the drop in the food's colour + the kicker
  const L = S.left, R = S.right;
  const kY = top + (reel ? 70 : 50);
  ctx.fillStyle = o.color ?? '#fff'; ctx.beginPath(); ctx.arc(L + 26, kY - 12, 26, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = '#5cd3ff'; ctx.font = `700 ${reel ? 38 : 32}px ${SANS}`;
  text(ctx, 'MINUTE BY MINUTE · 0–24 H', L + 72, kY);
  // the question: as big as fits in the room above the button column
  const room = (reel ? S.lowFrom - 10 : bot) - (kY + 40);
  let best = fitWrap(ctx, o.hook, R - L, 4, reel ? 104 : 84, 56, (px) => `400 ${px}px ${SERIF}`);
  while (best.px > 56 && best.lines.length * best.px * 1.02 > room) best = fitWrap(ctx, o.hook, R - L, 4, best.px - 2, 56, (px) => `400 ${px}px ${SERIF}`);
  // a very long name still doesn't fit above the button column: narrow the lines so they clear it lower down
  if (reel && best.lines.length * best.px * 1.02 > room) best = fitWrap(ctx, o.hook, S.rightLow - L, 6, 64, 48, (px) => `400 ${px}px ${SERIF}`);
  ctx.fillStyle = '#ffffff'; ctx.font = `400 ${best.px}px ${SERIF}`; shade(ctx, true);
  best.lines.forEach((ln, i) => text(ctx, ln, L, kY + 30 + best.px * 0.92 + i * best.px * 1.02));
  shade(ctx, false);
  ctx.restore(); ctx.textAlign = 'left';
}

/** End card: what the day did, who it was simulated for, and one clear question to comment on. */
function drawOutro(ctx: CanvasRenderingContext2D, W: number, H: number, o: Overlay, alpha: number, format: Format = 'reel') {
  const reel = format === 'reel', S = SAFE[format], L = S.left, RL = S.rightLow;
  ctx.save(); ctx.globalAlpha = alpha;
  bg(ctx, W, H);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  let y = S.top + (reel ? 44 : 40);
  ctx.fillStyle = '#5cd3ff'; ctx.font = `700 ${reel ? 32 : 28}px ${SANS}`; text(ctx, 'AFTER 24 HOURS', L, y);
  const t = fitWrap(ctx, o.title, S.right - L, 2, reel ? 84 : 70, 52, (px) => `400 ${px}px ${SERIF}`);
  ctx.fillStyle = '#ffffff'; ctx.font = `400 ${t.px}px ${SERIF}`;
  t.lines.forEach((ln, i) => text(ctx, ln, L, y + 16 + t.px * 0.9 + i * t.px * 1.02));
  y += 16 + t.px * 0.9 + (t.lines.length - 1) * t.px * 1.02 + (reel ? 50 : 42);
  ctx.fillStyle = '#8fa3b8'; ctx.font = `500 ${reel ? 27 : 23}px ${SANS}`; text(ctx, fit(ctx, `Simulated for: ${o.sub}`, S.right - L), L, y);
  y += reel ? 34 : 26;
  const rows = o.summary.length || 1, rowH = Math.min(reel ? 116 : 96, ((reel ? 1000 : 860) - y) / rows + (reel ? 116 : 96) - (reel ? 116 : 96));
  const rh = Math.max(reel ? 96 : 84, Math.min(reel ? 116 : 96, rowH));
  o.summary.forEach((l, i) => {
    const ry = y + i * rh;
    ctx.fillStyle = 'rgba(12,21,34,.95)'; roundRect(ctx, L, ry, RL - L, rh - 14, 22); ctx.fill();
    ctx.fillStyle = LIGHT[l.level]; ctx.beginPath(); ctx.arc(L + 50, ry + (rh - 14) / 2, 28, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = 'center'; ctx.font = `28px ${EMOJI}`; ctx.fillStyle = '#04070c'; ctx.fillText(l.icon, L + 50, ry + (rh - 14) / 2 + 10); ctx.textAlign = 'left';
    ctx.fillStyle = '#e6edf5'; ctx.font = `700 ${reel ? 33 : 29}px ${SANS}`; text(ctx, fit(ctx, l.label, RL - L - 120), L + 100, ry + (rh - 14) * 0.45);
    ctx.fillStyle = LIGHT[l.level]; ctx.font = `600 ${reel ? 28 : 25}px ${SANS}`; text(ctx, fit(ctx, l.note, RL - L - 120), L + 100, ry + (rh - 14) * 0.82);
  });
  y += rows * rh + (reel ? 40 : 26);
  // call to action
  const cta = fitWrap(ctx, 'Which food should we test next? Comment 👇', RL - L, 2, reel ? 48 : 40, 34, (px) => `700 ${px}px ${SANS}`);
  ctx.fillStyle = '#ffffff'; ctx.font = `700 ${cta.px}px ${SANS}`;
  cta.lines.forEach((ln, i) => text(ctx, ln, L, y + cta.px * 0.9 + i * cta.px * 1.18));
  y += cta.px * 0.9 + (cta.lines.length - 1) * cta.px * 1.18 + (reel ? 52 : 44);
  ctx.fillStyle = '#5cd3ff'; ctx.font = `600 ${reel ? 32 : 28}px ${SANS}`;
  text(ctx, fit(ctx, o.handle ? `Follow ${o.handle} · a new food every day` : 'A new food every day', RL - L), L, y);
  ctx.fillStyle = '#7a899d'; ctx.font = `500 ${reel ? 22 : 19}px ${SANS}`;
  text(ctx, fit(ctx, 'Simulation for a typical body · not medical advice · anatomy: BodyParts3D, CC BY 4.0', S.right - L), L, S.bottom + (reel ? 44 : 34), true);
  ctx.restore(); ctx.textAlign = 'left';
}

export function fit(ctx: CanvasRenderingContext2D, t: string, w: number) {
  if (ctx.measureText(t).width <= w) return t;
  let s = t; while (s.length > 3 && ctx.measureText(`${s}…`).width > w) s = s.slice(0, -1);
  return `${s}…`;
}
export function wrap(ctx: CanvasRenderingContext2D, text: string, w: number, max: number): string[] {
  // a number stays on the line of its unit ("2 h", "500 ml", "7.3 mmol/L", "3 ×"): joined by a no-break space
  const kept = text.replace(/(\d)\s+(?=(?:h|ml|g|mg|kg|cm|min|minutes|hours|mmol\/L|mg\/dL|‰|%|kcal|×)(?![\p{L}]))/gu, '$1 ');
  const words = kept.split(/[ \t\n\r]+/), lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const t = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(t).width > w && cur) { lines.push(cur); cur = word; } else cur = t;
  }
  if (cur) lines.push(cur);
  if (lines.length > max) { lines.length = max; lines[max - 1] = fit(ctx, `${lines[max - 1]}…`, w); }
  return lines;
}
export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
