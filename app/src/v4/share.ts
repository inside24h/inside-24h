// "Share video": records the 3D body while the whole 24 h plays and draws a social-ready frame around it:
// a hook title, burned-in captions (most people watch muted), where the drink is and how much, the traffic lights,
// a day progress bar, and an end card with the day's summary and a call to comment. MP4 where the browser can,
// otherwise WebM. The WebGL canvas needs preserveDrawingBuffer.
// 2026-10-22 video polish: timing comes from video-plan.ts (reading-speed rule, 62-75 s long cut, ≤ 30 s short cut),
// every word stays inside the platform safe zone (SAFE below), our own soundtrack (video-audio.ts), brand fonts,
// a hook frame as the first frame (= thumbnail) and an end card that loops back to it.
import { FPS, INTRO_S, OUTRO_S, type Plan, type VFrame } from './video-plan';
import { aacConfig, encodeSoundtrack, playSoundtrack, renderSoundtrack2, SAMPLE_RATE, type SoundMode } from './video-audio';
import type { Gauge } from './video-body';
import { numberConflict } from './video-beats';
import { bodyMotion, drawBloodFlow, drawBreath, drawBubbles, drawGlowPulse, drawNight, drawOrganHit, drawRewindLines, drawShockwave, drawSparks, drawSpeedLines, drawSplash, drawSunrise, drawVignette, since, speedAlpha, surgeLevel, vignetteAlpha } from './video-fx';
import { CMP_OUTRO_EXTRA_S, readChars, REWIND_S, TEASER_S } from './video-plan';

/** ALL wording of the end cards and calls to action, in one place, so the owner can change it (2026-10-24). Honest:
 *  no promise of new foods on a schedule. */
export const VIDEO_COPY = {
  ctaSingle: 'Which food should we test next? 👇',
  ctaDrink: 'Which drink should we test next? 👇', // alcohol: never "tag your drinking buddy"
  ctaCompare: 'Did you guess right? 👇',
  ctaComparePick: 'Which one would you pick? 👇', // when the video asked no guess (no clear answer for this pair)
  follow: (handle: string) => (handle ? `Follow ${handle} for the next one` : 'Follow for the next one'),
  guess2: 'Comment A or B before the end.', // (round 11: not in the video any more, Meta counts it as comment bait)
  guessChip: 'Guess before the answer.', // round 11 (research R7): the question, without a command to comment
  // round 11 (research R1): the end card's last line hands over to frame 0 (the loop)
  loop: (solid?: boolean, compare?: boolean) => (compare ? '↻ Watch both again from the first sip.' : solid ? '↻ Now watch the first bite again.' : '↻ Now watch the first sip again.'),
  answerAt: 'Answer at 24 h.',
  fasterOut: 'Faster out ≠ better for you.', // the race with alcohol on one side (spec §4.1)
  raceLabel: { stomach: 'Out of the stomach', blood: 'Out of the blood', sugar: 'Blood sugar rise', bedtime: 'Still in you at bedtime', alcohol: 'Blood alcohol', sugarG: 'Sugar in it' },
  smallPrint: 'Simulation for a typical body · not medical advice · anatomy: BodyParts3D, CC BY 4.0',
} as const;
/** The plan as the drawing needs it (the cues place every effect). */
export type PlanView = Pick<Plan, 'stopsU' | 'introS' | 'outroS'> & { cues?: Plan['cues'] };

export type Format = 'reel' | 'feed';
export interface Light { icon: string; label: string; level: 0 | 1 | 2; /** round 5: not tracked (grey, never a green "fine") */ unknown?: boolean }
const lightCol = (l: Pick<Light, 'level' | 'unknown'>) => (l.unknown ? '#8292a7' : LIGHT[l.level]);
export interface Overlay {
  hook: string; title: string; sub: string; clock: string; step: string; caption: string;
  where?: string; color?: string; progress: number; lights: Light[];
  summary: (Light & { note: string })[]; handle: string;
  /** round 14 (critic G-3): the end card's one big number: the main gauge at the climax, its words and its range */ hero?: { big: string; small: string };
  stamp?: string; // big 'X MIN LATER' line
  pop?: { big: string; small: string; level: 0 | 1 | 2 }; // headline number of this moment
  // 2026-10-23 body-first video
  gauges?: PinnedGauge[]; // where the drink is + the number that matters, pinned to their organs
  solid?: boolean;        // food (the clock says "since the first bite")
  // 2026-10-24 effects: organ positions on the frame, the organ of this moment, alcohol (wording of the end card)
  pins?: Record<string, { x: number; y: number } | null>; focus?: string | null; alcohol?: boolean;
  /** round 4: fizzy drink still in the stomach (0..1), beer foam, the main substance in the blood (0..1) */ fizz?: number; foam?: boolean; flow?: number;
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
/** Recording options: sound on/off, progress, and (2026-10-23) `prepare` (resolves once the 3D view has the video's
 *  size) and `onSettled` (called after the warm-up frames, right before the first real frame). */
export interface RecOpts { sound: boolean; onTick?: (f: number) => void; prepare?: () => Promise<void>; onSettled?: () => void;
  /** 2026-10-24: our music + effects, or effects only (the owner adds a trending song); and what the drink is like */
  soundMode?: SoundMode; soundFx?: { fizzy?: boolean; solid?: boolean; seed?: number } }
type SoundIn = { seconds: number; cues: Plan['cues']; beatFrom: number; music: boolean; fizzy?: boolean; solid?: boolean };
const soundOf = (plan: Plan, opts: RecOpts): SoundIn | null => (opts.sound ? { seconds: plan.seconds, cues: plan.cues, beatFrom: plan.introS, music: opts.soundMode !== 'sfx', ...opts.soundFx } : null);
export async function record(source: HTMLCanvasElement, format: Format, overlay: () => Overlay, seek: (minute: number, fr?: VFrame) => void,
  plan: Plan, opts: RecOpts = { sound: true }): Promise<{ blob: Blob; ext: string; audio: boolean }> {
  const fmt = pickMime();
  if (!fmt) throw new Error('This browser can’t record video.');
  await loadFonts();
  await opts.prepare?.();
  seek(0, plan.frames[0]); opts.onSettled?.();
  const [W, H] = SIZE[format];
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const ctx = out.getContext('2d')!;
  const stream = out.captureStream(FPS);
  let sound: ReturnType<typeof playSoundtrack> = null;
  if (opts.sound && typeof OfflineAudioContext !== 'undefined') {
    try { const so = soundOf(plan, opts)!; sound = playSoundtrack(await renderSoundtrack2(so.seconds, so.cues, so)); } catch { sound = null; }
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
      seek(fr.m, fr);
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
async function encodeMp4(out: HTMLCanvasElement, count: number, draw: (i: number) => void, sound: SoundIn | null,
  onTick?: (frac: number) => void): Promise<{ blob: Blob; ext: string; audio: boolean }> {
  const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
  const W = out.width, H = out.height;
  const config = await h264Config(W, H);
  // sound: rendered offline first (a second or two), then encoded before the picture
  const acfg = sound ? await aacConfig() : null;
  let abuf: AudioBuffer | null = null;
  if (acfg && sound) { try { abuf = await renderSoundtrack2(sound.seconds, sound.cues, sound); } catch { abuf = null; } }
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
  step: (minute: number, fr?: VFrame) => void, plan: Plan, opts: RecOpts = { sound: true }): Promise<{ blob: Blob; ext: string; audio: boolean }> {
  await loadFonts();
  const [W, H] = SIZE[format];
  // WebCodecs without an H.264 encoder (some Firefox / Linux builds): film the same plan in real time instead;
  // `step` renders each frame itself, so this works while the 3D view is paused for recording
  try { await h264Config(W, H); } catch (e) { if (pickMime()) return record(source, format, overlay, step, plan, opts); throw e; }
  await opts.prepare?.();
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const ctx = out.getContext('2d')!;
  let first: HTMLCanvasElement | null = null;
  return encodeMp4(out, plan.frames.length, (i) => {
    // settle (after the encoder setup, when the 3D view has its recording size): the liquid fades in; then the
    // camera is put at its opening shot
    if (i === 0) { for (let f = 0; f < 60; f++) step(0, plan.frames[0]); opts.onSettled?.(); }
    const fr = plan.frames[i];
    step(fr.m, fr);
    drawFrame(ctx, W, H, source, overlay(), format, fr, plan, first);
    if (!first) first = snapshot(out); // the hook frame, for the loop back at the very end
  }, soundOf(plan, opts), opts.onTick);
}

/** One video frame of the plan: the main picture, plus the hook card (intro) or the end card (outro). */
export function drawFrame(ctx: CanvasRenderingContext2D, W: number, H: number, src: CanvasImageSource & { width: number; height: number },
  o: Overlay, format: Format, fr: VFrame, plan: PlanView | null, first: HTMLCanvasElement | null) {
  // 2026-10-23: the body-first frame (below). The 2026-10-22 layout (body in a band under panels) stays as
  // drawFrameLegacy for reference.
  drawBodyFrame(ctx, W, H, src, o, format, fr, plan, first);
}
/** The 2026-10-22 frame: hook card, headline, stamp, traffic lights and a caption plate over a band of the body. */
export function drawFrameLegacy(ctx: CanvasRenderingContext2D, W: number, H: number, src: CanvasImageSource & { width: number; height: number },
  o: Overlay, format: Format, fr: VFrame, plan: PlanView | null, first: HTMLCanvasElement | null) {
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
  summary: { kcal: number; sugarPeak: string; worst: (Light & { note: string })[] };
  gauge?: PinnedGauge | null; // 2026-10-23 split screen: this body's number, pinned to its organ
  pins?: Record<string, { x: number; y: number } | null>; alcohol?: boolean; fizz?: number; foam?: boolean; flow?: number;
  /** round 5: how much ("330 ml", "1 shot · 30 ml"), shown under the name */ serving?: string }
export interface CmpOverlay { hook: string; clock: string; progress: number; handle: string; a: CmpSide; b: CmpSide; stamp?: string; verdict?: string; solid?: boolean;
  /** 2026-10-24 game: the guess line, the race (0..1 per side); round 4: the answer, shown when it is decided */ guess?: boolean; race?: { a: number; b: number };
  answer?: { a1: string; a2: string; recap: string; kind: 'stomach' | 'blood' | 'sugar' | 'bedtime' | 'alcohol' | 'sugarG'; winner: 0 | 1 } }

/** Comparison Reel (9:16): both bodies side by side at the top, where the whole width is free of platform buttons;
 *  the two captions stacked below, inside the safe column. Timing from planCompare (video-plan.ts). */
export async function recordCompare(canvA: HTMLCanvasElement, overlay: () => CmpOverlay,
  step: (minute: number, fr?: VFrame) => void, plan: Plan, opts: RecOpts = { sound: true }): Promise<{ blob: Blob; ext: string; audio: boolean }> {
  await loadFonts();
  await opts.prepare?.();
  const W = 1080, H = 1920;
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const ctx = out.getContext('2d')!;
  let first: HTMLCanvasElement | null = null;
  return encodeMp4(out, plan.frames.length, (i) => {
    if (i === 0) { for (let f = 0; f < 60; f++) step(0, plan.frames[0]); opts.onSettled?.(); }
    const fr = plan.frames[i];
    step(fr.m, fr);
    drawCmpFrame(ctx, W, H, canvA, overlay(), fr, plan, first);
    if (!first) first = snapshot(out);
  }, soundOf(plan, opts), opts.onTick);
}

/** One comparison frame: main picture + hook card (intro) or end card (outro), as drawFrame for the single video. */
export function drawCmpFrame(ctx: CanvasRenderingContext2D, W: number, H: number, src: CanvasImageSource & { width: number; height: number },
  o: CmpOverlay, fr: VFrame, plan: PlanView | null, first: HTMLCanvasElement | null) {
  drawSplitFrame(ctx, W, H, src, o, fr, plan, first); // 2026-10-23 split screen; the earlier layout: drawCmpFrameLegacy
}
/** The 2026-10-22 comparison frame (two small bodies at the top, two caption blocks below). */
export function drawCmpFrameLegacy(ctx: CanvasRenderingContext2D, W: number, H: number, src: CanvasImageSource & { width: number; height: number },
  o: CmpOverlay, fr: VFrame, plan: PlanView | null, first: HTMLCanvasElement | null) {
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
  const fr: VFrame = { phase, m: 0, t: phase === 'intro' ? 2 : 0, cap: o.caption, capA: phase === 'main' ? 1 : 0, k: phase === 'outro' ? 0.5 : 0 }; // (t 2: the kinetic hook is complete on the cover)
  drawFrame(ctx, W, H, source, o, format, fr, null, null);
  return c;
}

/** Round 11 (research R8): the grid-safe cover. Platforms crop the 9:16 cover to 1:1 or 3:4 on the profile grid, so
 *  the hook (big) and a small "INSIDE 24H" series tag sit in the centre band (y 560-1360, x 90-990), over the body. */
export const COVER_BAND = { top: 560, bottom: 1360, left: 90, right: 990 } as const;
export function drawCoverFrame(ctx: CanvasRenderingContext2D, W: number, H: number, src: (CanvasImageSource & { width: number; height: number }) | null, hook: string) {
  stageBg(ctx, W, H, H * 0.45);
  if (src) drawCover(ctx, src, 0, 0, W, H);
  const B = COVER_BAND, g = ctx.createLinearGradient(0, B.top - 80, 0, B.bottom + 80);
  g.addColorStop(0, 'rgba(4,7,12,0)'); g.addColorStop(0.25, 'rgba(4,7,12,.62)'); g.addColorStop(0.75, 'rgba(4,7,12,.62)'); g.addColorStop(1, 'rgba(4,7,12,0)');
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, B.top - 80, W, B.bottom - B.top + 160);
  const lines = hook.split('\n').map((s) => s.trim()).filter(Boolean), w = B.right - B.left;
  const fits = lines.map((s) => fitWrap(ctx, s, w, 3, 96, 48, (px) => `400 ${px}px ${SERIF}`));
  const px = Math.min(...fits.map((f) => f.px)), all = fits.flatMap((f) => f.lines), lh = px * 1.08;
  const blockH = 64 + all.length * lh, y0 = Math.max(B.top, (B.top + B.bottom) / 2 - blockH / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.font = `700 30px ${SANS}`; const tag = 'INSIDE 24H', tw = ctx.measureText(tag).width + 36;
  ctx.fillStyle = 'rgba(92,211,255,.16)'; roundRect(ctx, W / 2 - tw / 2, y0, tw, 46, 23); ctx.fill();
  ctx.fillStyle = ACCENT; text(ctx, tag, W / 2, y0 + 33);
  ctx.fillStyle = '#ffffff'; ctx.font = `400 ${px}px ${SERIF}`; shade(ctx, true);
  all.forEach((ln, i) => text(ctx, ln, W / 2, y0 + 64 + px * 0.9 + i * lh));
  shade(ctx, false); ctx.restore(); ctx.textAlign = 'left';
}
export function composeCover(source: HTMLCanvasElement | null, hook: string): HTMLCanvasElement {
  const [W, H] = SIZE.reel, c = document.createElement('canvas'); c.width = W; c.height = H;
  drawCoverFrame(c.getContext('2d')!, W, H, source, hook);
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

// =====================================================================================================================
// BODY-FIRST FRAMES (2026-10-23 redesign; research/improvements/video-bodyfirst-2026-10-23.md)
// The owner: "people find it far more interesting to WATCH how the food goes through the body than text over the
// screen". So the 3D body now fills the whole 9:16 frame, rendered at the video's own size (AppV4 sizes the canvas
// to 1080×1920 while recording) and filmed by the video camera (video-cam.ts): wide → push in → follow the drink →
// pull back. Words are a frame around it: a short hook and the running clock at the top, one short caption at the
// bottom, and small gauges pinned to the organs (where the drink is, and the number that matters). The comparison
// is a split screen: two bodies, two colours, one clock.
// Every word still goes through `text` (safe-zone tests); the reading rule (video-plan.ts) is unchanged.
// =====================================================================================================================

/** A gauge with its organ's position on the frame (null = the organ is out of the picture). */
export type PinnedGauge = Gauge & { at?: { x: number; y: number } | null };
const ACCENT = '#5cd3ff';
const GLASS = 'rgba(6,12,20,.66)';
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** "+0:45", "+12:05", "+24:00": time since the first sip, hours:minutes. */
export function elapsedText(m: number): string {
  const r = Math.max(0, Math.min(1440, Math.floor(m + 1e-6)));
  return `+${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`;
}

/** Text drawn in fixed-width digit cells, so a running clock never wobbles. Returns its width. */
function monoText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, measureOnly = false): number {
  const cell = ctx.measureText('0').width;
  let w = 0;
  for (const ch of s) w += /\d/.test(ch) ? cell : ctx.measureText(ch).width;
  if (measureOnly) return w;
  // logged as one word (safe-zone tests), drawn cell by cell
  if (textLog && ctx.globalAlpha > 0.02) { const px = fontPx(ctx); textLog.push({ x0: x, x1: x + w, y0: y - px * 0.78, y1: y + px * 0.22, text: s, deco: false }); }
  let cx = x;
  const a = ctx.textAlign; ctx.textAlign = 'center';
  for (const ch of s) { const cw = /\d/.test(ch) ? cell : ctx.measureText(ch).width; ctx.fillText(ch, cx + cw / 2, y); cx += cw; }
  ctx.textAlign = a;
  return w;
}

/** The same lines, evened out: the narrowest width that still gives the same number of lines (no lonely "you."
 *  on the second line). The font (set by fitWrap) stays. */
function balanced(ctx: CanvasRenderingContext2D, f: { px: number; lines: string[] }, s: string, w: number): { px: number; lines: string[] } {
  if (f.lines.length < 2) return f;
  let lo = w * 0.5, hi = w, best = f.lines;
  for (let k = 0; k < 10; k++) {
    const mid = (lo + hi) / 2, ls = wrap(ctx, s, mid, 99);
    if (ls.length <= f.lines.length && ls.every((l) => ctx.measureText(l).width <= mid + 0.5)) { best = ls; hi = mid; } else lo = mid;
  }
  return { px: f.px, lines: best };
}

/** The hook in at most two lines; when it needs two, "— inside your body" gets the second one to itself. */
function hookLines(ctx: CanvasRenderingContext2D, hook: string, w: number, max: number, min: number) {
  const font = (px: number) => `400 ${px}px ${SERIF}`;
  if (hook.includes('\n')) { // line 1 / line 2 (video-hook.ts): each its own line, as big as both fit
    const ls = hook.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 2);
    for (let px = max; px >= min; px -= 2) { ctx.font = font(px); if (ls.every((l) => ctx.measureText(l).width <= w)) return { px, lines: ls }; }
    return balanced(ctx, fitWrap(ctx, ls.join(' '), w, 2, min, min, font), ls.join(' '), w);
  }
  const one = fitWrap(ctx, hook, w, 1, max, max, font);
  if (one.lines.length === 1 && ctx.measureText(one.lines[0]).width <= w) return one;
  const at = hook.lastIndexOf(' — ');
  if (at > 0) {
    const a = hook.slice(0, at), b = hook.slice(at + 1);
    for (let px = max; px >= min; px -= 2) { ctx.font = font(px); if (ctx.measureText(a).width <= w && ctx.measureText(b).width <= w) return { px, lines: [a, b] }; }
  }
  return balanced(ctx, fitWrap(ctx, hook, w, 2, max, min, font), hook, w);
}

/** Positions of everything on the body-first frame (shared by drawing and tests). `settle` 0 → 1: the hook shrinks
 *  from its first-frame size to the headline size during the intro. */
export function layoutBody(ctx: CanvasRenderingContext2D, o: { hook: string }, format: Format, settle = 1) {
  const reel = format === 'reel', S = SAFE[format];
  const L = S.left, R = S.right, RL = S.rightLow;
  const kickY = S.top + (reel ? 30 : 26);
  const big = reel ? 84 : 66, small = reel ? 58 : 48;
  const head = hookLines(ctx, o.hook, R - L, Math.round(lerp(big, small, settle)), reel ? 40 : 34);
  const headLH = head.px * 1.04, head0 = kickY + 14 + head.px * 0.88;
  const headBot = head0 + (head.lines.length - 1) * headLH + head.px * 0.24;
  const clockH = reel ? 72 : 60, clockTop = headBot + (reel ? 14 : 10);
  const topBot = clockTop + clockH;
  const capFs = reel ? 52 : 42, capLH = Math.round(capFs * 1.2), kickFs = reel ? 28 : 24;
  const capTop = S.bottom - (kickFs + 16 + 2 * capLH); // room for a kicker + two lines, so it never jumps
  return { reel, S, L, R, RL, kickY, head, headLH, head0, headBot, clockH, clockTop, topBot, capFs, capLH, kickFs, capTop };
}

/** The running clock: a ring for the day so far, "+0:45" in fixed-width digits, and fast-forward marks while the
 *  day runs fast (quiet stretches). */
function drawClock(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, m: number, u: number, rate: number, solid: boolean, reel: boolean, back = false) {
  const fs = Math.round(h * 0.62), label = solid ? 'since the first bite' : 'since the first sip';
  ctx.save();
  ctx.font = `700 ${fs}px ${SANS}`;
  const tW = monoText(ctx, '+24:00', 0, 0, true);
  ctx.font = `500 ${reel ? 24 : 21}px ${SANS}`;
  const lW = ctx.measureText(label).width;
  const r = h * 0.3, ffW = h * 0.5;
  const w = h * 0.22 + 2 * r + h * 0.22 + tW + h * 0.22 + ffW + h * 0.14 + lW + h * 0.3;
  ctx.fillStyle = GLASS; roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = 'rgba(92,211,255,.55)'; ctx.lineWidth = 2; ctx.stroke();
  // ring: the day so far
  const cx = x + h * 0.22 + r, cy = y + h / 2;
  ctx.lineWidth = h * 0.09; ctx.strokeStyle = 'rgba(140,170,210,.25)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = ACCENT; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.002, Math.min(1, u))); ctx.stroke(); ctx.lineCap = 'butt';
  let tx = cx + r + h * 0.22;
  ctx.font = `700 ${fs}px ${SANS}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left';
  monoText(ctx, elapsedText(m), tx, y + h * 0.7);
  tx += tW + h * 0.22;
  // fast-forward: two chevrons, brighter the faster the day runs
  const ff = back ? 1 : Math.max(0, Math.min(1, (rate - 6) / 40));
  ctx.save(); ctx.globalAlpha *= 0.18 + 0.82 * ff; ctx.fillStyle = back ? '#ffc83d' : ACCENT;
  for (let k = 0; k < 2; k++) {
    const bx = tx + k * ffW * 0.48; ctx.beginPath();
    if (back) { ctx.moveTo(bx + ffW * 0.42, cy - h * 0.16); ctx.lineTo(bx, cy); ctx.lineTo(bx + ffW * 0.42, cy + h * 0.16); } // ◀◀ rewind
    else { ctx.moveTo(bx, cy - h * 0.16); ctx.lineTo(bx + ffW * 0.42, cy); ctx.lineTo(bx, cy + h * 0.16); }
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  tx += ffW + h * 0.14;
  ctx.font = `500 ${reel ? 24 : 21}px ${SANS}`; ctx.fillStyle = '#b8c7d8';
  text(ctx, label, tx, y + h * 0.62);
  ctx.restore();
}

/** One small gauge: big number, short label, optional curve of the day with a dot at "now". Returns its height. */
const gaugeSmall = (ctx: CanvasRenderingContext2D, g: Gauge, w: number, reel: boolean) => {
  ctx.font = `600 ${reel ? 23 : 20}px ${SANS}`;
  // (round 9: "BAC … % · US limit 0.08 % · EU limit 0.05 %" breaks at its dots, one thing per line, when each part fits)
  const parts = g.small.split(' · '), room = w - 2 * (reel ? 18 : 14);
  if (parts.length > 1 && parts.length <= 3 && parts.every((p) => ctx.measureText(p).width <= room)) return parts;
  return wrap(ctx, g.small, room, 2);
};
function gaugeHeight(ctx: CanvasRenderingContext2D, g: Gauge, reel: boolean, w: number) {
  const n = gaugeSmall(ctx, g, w, reel).length, lh = reel ? 27 : 24;
  return (reel ? 14 + 46 + 4 : 12 + 40 + 4) + n * lh + (g.curve ? (reel ? 52 : 44) : 0) + (reel ? 12 : 10);
}
function drawGauge(ctx: CanvasRenderingContext2D, g: PinnedGauge, x: number, y: number, w: number, reel: boolean, fx: { bounce?: number; flash?: number; count?: boolean } = {}) {
  const h = gaugeHeight(ctx, g, reel, w), col = g.level === 0 && !g.curve ? '#ffffff' : LIGHT[g.level];
  const small = gaugeSmall(ctx, g, w, reel), lh = reel ? 27 : 24;
  ctx.save();
  // the peak: a short bounce (×1.15); a micro-beat: the border lights up once
  const sc = 1 + 0.15 * (fx.bounce ?? 0);
  if (sc !== 1) { ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-(x + w / 2), -(y + h / 2)); }
  ctx.fillStyle = GLASS; roundRect(ctx, x, y, w, h, 20); ctx.fill();
  ctx.strokeStyle = g.curve ? LIGHT[g.level] : 'rgba(220,235,250,.35)'; ctx.lineWidth = 3 + 3 * (fx.flash ?? 0); ctx.stroke();
  const pad = reel ? 18 : 14, bigFs = reel ? 46 : 40, smFs = reel ? 23 : 20;
  let fs = bigFs; ctx.font = `700 ${fs}px ${SANS}`;
  while (fs > 28 && ctx.measureText(g.big).width > w - 2 * pad) { fs -= 2; ctx.font = `700 ${fs}px ${SANS}`; }
  ctx.fillStyle = col; ctx.textAlign = 'left'; text(ctx, g.big, x + pad, y + (reel ? 14 : 12) + bigFs * 0.82);
  ctx.font = `${fx.count ? 700 : 600} ${smFs}px ${SANS}`; ctx.fillStyle = fx.count ? LIGHT[g.level] : '#d5e0ec'; // counting up to the peak
  const sy = y + (reel ? 14 + 46 + 4 : 12 + 40 + 4);
  small.forEach((ln, i) => text(ctx, ln, x + pad, sy + i * lh + smFs * 0.86));
  if (g.curve && g.curve.length > 1) {
    const cy0 = sy + small.length * lh + 10, ch = reel ? 34 : 28, cx0 = x + pad, cw = w - 2 * pad;
    const lo = Math.min(0, ...g.curve), hi = Math.max(1e-6, ...g.curve);
    const P = (i: number) => [cx0 + (i / (g.curve!.length - 1)) * cw, cy0 + ch - ((g.curve![i] - lo) / (hi - lo || 1)) * ch] as const;
    ctx.beginPath(); g.curve.forEach((_v, i) => { const [px, py] = P(i); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
    ctx.strokeStyle = 'rgba(220,235,250,.35)'; ctx.lineWidth = 3; ctx.stroke();
    // the part of the day already lived, in colour, and a dot at "now"
    const f = Math.max(0, Math.min(1, g.u ?? 0)) * (g.curve.length - 1), i0 = Math.floor(f), i1 = Math.min(g.curve.length - 1, i0 + 1);
    ctx.beginPath(); for (let i = 0; i <= i0; i++) { const [px, py] = P(i); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    const [ax, ay] = P(i0), [bx, by] = P(i1), t = f - i0, nx = lerp(ax, bx, t), ny = lerp(ay, by, t);
    ctx.lineTo(nx, ny); ctx.strokeStyle = LIGHT[g.level]; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(nx, ny, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  return h;
}
/** The pin: a thin line from the gauge to its organ, a dot and a soft pulsing ring on the organ. */
function drawPin(ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }, col: string, t: number) {
  ctx.save();
  ctx.strokeStyle = col; ctx.globalAlpha *= 0.85; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(to.x, to.y, 8, 0, Math.PI * 2); ctx.fill();
  const pulse = (t * 0.9) % 1;
  ctx.globalAlpha *= 0.6 * (1 - pulse); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(to.x, to.y, 10 + 22 * pulse, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
const onFrame = (p: { x: number; y: number } | null | undefined, W: number, top: number, bot: number) => !!p && p.x > 20 && p.x < W - 20 && p.y > top && p.y < bot;

/** Soft dark bands behind the words at the top and the bottom; the body in between stays untouched. */
function scrims(ctx: CanvasRenderingContext2D, W: number, H: number, topBot: number, capTop: number) {
  const g1 = ctx.createLinearGradient(0, 0, 0, topBot + 90);
  g1.addColorStop(0, 'rgba(4,7,12,.8)'); g1.addColorStop(0.7, 'rgba(4,7,12,.45)'); g1.addColorStop(1, 'rgba(4,7,12,0)');
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, topBot + 90);
  // behind the caption only (2026-10-24: below it the body shows again, under a light veil for the small print)
  const y0 = capTop - 90, y1 = Math.min(H, capTop + 330);
  const g2 = ctx.createLinearGradient(0, y0, 0, y1);
  // (round 14b, critic G-1: the bottom quarter read as cut off and dark): no veil below the caption block, the body
  // shows there in full (no words ever go there: it is under the platforms' captions)
  g2.addColorStop(0, 'rgba(4,7,12,0)'); g2.addColorStop(0.3, 'rgba(4,7,12,.55)'); g2.addColorStop(0.75, 'rgba(4,7,12,.5)'); g2.addColorStop(1, 'rgba(4,7,12,0)');
  ctx.fillStyle = g2; ctx.fillRect(0, y0, W, y1 - y0);
}

/** Round 14b (critic G-1): the bottom quarter of the frame (under the platforms' captions, never any words) is lit
 *  from below in the drink's colour, a slow breath (period 4 s, alpha 0.10-0.18), so the body there reads as part of
 *  the picture, not as an empty dark band. Drawn under the words; a glow, never a flash. */
export const FLOOR_FROM = 0.75;
export function drawFloorGlow(ctx: CanvasRenderingContext2D, W: number, H: number, color: string, t: number) {
  const y0 = H * FLOOR_FROM, a = 0.1 + 0.08 * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 4));
  const g = ctx.createRadialGradient(W / 2, H * 1.02, 10, W / 2, H * 1.02, H * 0.36);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(0, y0 - 80, W, H - y0 + 80); ctx.restore();
}

/** Small print and the day bar under the safe zone (fine if a platform covers them; the end card repeats the credit). */
function footer(ctx: CanvasRenderingContext2D, W: number, H: number, format: Format, u: number, stopsU?: number[]) {
  const S = SAFE[format], L = S.left, R = S.right, reel = format === 'reel';
  ctx.textAlign = 'left'; ctx.fillStyle = '#7a899d'; ctx.font = `500 ${reel ? 22 : 19}px ${SANS}`;
  text(ctx, fit(ctx, VIDEO_COPY.smallPrint, R - L), L, S.bottom + (reel ? 44 : 34), true);
  if (reel) {
    const y = S.bottom + 104;
    ctx.fillStyle = 'rgba(140,170,210,.22)'; roundRect(ctx, L, y, R - L, 10, 5); ctx.fill();
    ctx.fillStyle = ACCENT; roundRect(ctx, L, y, Math.max(10, (R - L) * Math.min(1, u)), 10, 5); ctx.fill();
    for (const s of stopsU ?? []) { ctx.fillStyle = s <= u + 1e-3 ? ACCENT : 'rgba(140,170,210,.55)'; ctx.beginPath(); ctx.arc(L + (R - L) * s, y + 5, 9, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#8292a7'; ctx.font = `500 24px ${SANS}`;
    text(ctx, '0 h', L, y + 48, true); ctx.textAlign = 'right'; text(ctx, '24 h', R, y + 48, true); ctx.textAlign = 'left';
  } else {
    ctx.fillStyle = 'rgba(140,170,210,.22)'; ctx.fillRect(0, H - 8, W, 8);
    ctx.fillStyle = ACCENT; ctx.fillRect(0, H - 8, W * Math.min(1, u), 8);
  }
}

/** Brand line, hook and clock at the top (single and split screen). */
function topBand(ctx: CanvasRenderingContext2D, Lo: ReturnType<typeof layoutBody>, kicker: string, handle: string, m: number, u: number, rate: number, solid: boolean, back = false, kinT = 9) {
  const { reel, L, R } = Lo;
  ctx.font = `700 ${reel ? 26 : 22}px ${SANS}`; ctx.fillStyle = ACCENT; shade(ctx, true); ctx.textAlign = 'left';
  text(ctx, kicker, L, Lo.kickY);
  const kw = ctx.measureText(kicker).width;
  if (handle) { ctx.textAlign = 'right'; ctx.fillStyle = '#c9d6e4'; ctx.font = `600 ${reel ? 26 : 22}px ${SANS}`; const room = R - L - kw - 40; if (room > 120) text(ctx, fit(ctx, handle, room), R, Lo.kickY); ctx.textAlign = 'left'; }
  ctx.fillStyle = '#ffffff'; ctx.font = `400 ${Lo.head.px}px ${SERIF}`;
  Lo.head.lines.forEach((ln, i) => {
    const y = Lo.head0 + i * Lo.headLH;
    if (i === 0 || kinT < 0 || kinT >= 2 || Lo.head.lines.length < 2) { text(ctx, ln, L, y); return; }
    // the promise line's words light up one after another (round 4 kinetic hook). Round 5 (critic: frame 0 showed half
    // the hook): every word is on screen from frame 0, the punch only colours and lifts each word in turn
    let x = L;
    ln.split(' ').forEach((wd, j) => {
      const k = kineticWord(kinT, j);
      const ww = ctx.measureText(wd + ' ').width;
      ctx.save(); if (k > 0) ctx.fillStyle = `rgb(255,${Math.round(255 - 55 * k)},${Math.round(255 - 194 * k)})`;
      text(ctx, wd, x, y - 3 * k); ctx.restore(); // (round 9: a 3 px lift never touches the line above)
      x += ww;
    });
  });
  shade(ctx, false);
  drawClock(ctx, L, Lo.clockTop, Lo.clockH, m, u, rate, solid, reel, back);
}

/** 0..1 highlight of word `j` of the hook's promise line at `t` seconds after the sip (each word 0.12 s after the
 *  last, up to the colour then back to white in 0.4 s). Frame 0 (t < 0) shows every word plain. */
export function kineticWord(t: number, j: number): number {
  const u = t - 0.1 - j * 0.12;
  return u < 0 || u >= 0.4 ? 0 : u < 0.08 ? u / 0.08 : 1 - (u - 0.08) / 0.32;
}
/** How the end of the video hands over, so that two texts are NEVER on screen at the same time (2026-10-24):
 *  the moment's words leave (0.3 s) → the end card comes in (0.4 s) → … → the end card and the headline leave
 *  (0.4 s) → the first frame comes back (0.5 s, the loop). Outside the end card: main = 1, top = 1. */
export function endTiming(fr: Pick<VFrame, 'phase' | 'k'>, outS: number) {
  if (fr.phase !== 'outro') return { main: 1, end: 0, top: 1, first: 0 };
  const tt = fr.k * outS, leave = 1 - smooth((tt - (outS - 0.95)) / 0.4);
  return { main: 1 - smooth(tt / 0.3), end: smooth((tt - 0.3) / 0.4) * leave, top: leave, first: smooth((tt - (outS - 0.5)) / 0.5) };
}

/** Round 4 effects on one body: bubbles in a fizzy stomach (foam on beer), the bloodstream gut → liver → heart → brain
 *  as bright as the level in the blood, and a soft glow on the heart with each heartbeat (only in the model's
 *  heart-stress spans, video-plan 'heart' cues; 1.1 s apart, well under 3 flashes a second). */
function bodyLife(ctx: CanvasRenderingContext2D, pin: (k: string) => { x: number; y: number } | null, side: { fizz?: number; foam?: boolean; flow?: number; color?: string }, cues: Plan['cues'] | undefined, t: number,
  sg: { age: number; kind?: string; build?: number } = { age: Infinity }, win?: [number, number]) {
  const st = pin('stomach'), pa = pin('pancreas');
  if (st && pa) drawBubbles(ctx, st, Math.hypot(st.x - pa.x, st.y - pa.y) * 1.1, t, side.fizz ?? 0, !!side.foam);
  // round 10: the bloodstream surges as the substance reaches half its peak (video-plan 'surge'): more, faster
  // comets, and the heart then the brain light up in the substance's colour as the wave reaches them
  const sl = surgeLevel(sg.age, sg.build ?? 0), sc = SURGE_COLOR[sg.kind ?? ''] ?? lighten(side.color ?? ACCENT);
  drawBloodFlow(ctx, ['jejunum', 'portal_vein', 'liver', 'heart', 'brain'].map(pin), t, side.flow ?? 0, lighten(side.color ?? ACCENT), sl, sg.kind === 'sugar' && sl > 0.02, win);
  if (sl > 0) { drawGlowPulse(ctx, pin('heart'), sg.age - 0.15, sc, 110); drawGlowPulse(ctx, pin('brain'), sg.age - 0.5, sc, 130); }
  const hb = since(cues, 'heart', t);
  if (hb.cue?.data?.v === 1 && hb.age > 0.2) drawGlowPulse(ctx, pin('heart'), (hb.age - 0.2) % 1.1, '#ff5a6a', 90);
}

/** Round 10: the colour of the bloodstream surge by substance (the brain's colours, video-body paletteAt). */
const SURGE_COLOR: Record<string, string> = { sugar: '#ffd27a', caffeine: '#5ef0a8', alcohol: '#ffb02e' };

/** Body-first frame of the single video. 2026-10-24 creative upgrade: the cold open and its rewind, the sip splash,
 *  the peak (riser vignette → punch, shake, ring, PEAK), micro-beats, NEXT chips, the night tone (video-fx.ts). */
export function drawBodyFrame(ctx: CanvasRenderingContext2D, W: number, H: number, src: CanvasImageSource & { width: number; height: number },
  o: Overlay, format: Format, fr: VFrame, plan: PlanView | null, first: HTMLCanvasElement | null) {
  const introS = plan?.introS ?? INTRO_S.long, ti = fr.k * introS, cues = plan?.cues;
  const settle = fr.phase === 'intro' ? smooth((ti - (introS - 1.0)) / 0.9) : 1;
  const Lo = layoutBody(ctx, o, format, settle), { reel, S, L, R, RL } = Lo;
  const u = fr.u ?? o.progress, t = fr.t;
  const main = (o.gauges ?? []).find((g) => g.curve);
  // 1) the body fills the frame; it moves with the impacts (pivot: the organ of the main number)
  const mo = bodyMotion(cues, t, H, fr.beat);
  const pivot = main?.at && onFrame(main.at, W, 0, H) ? main.at : { x: W / 2, y: H * 0.45 };
  const tf = (p: { x: number; y: number } | null | undefined) => (p ? { x: (p.x - pivot.x) * mo.scale + pivot.x + mo.dx, y: (p.y - pivot.y) * mo.scale + pivot.y + mo.dy } : null);
  stageBg(ctx, W, H, H * 0.45);
  ctx.save(); ctx.translate(pivot.x + mo.dx, pivot.y + mo.dy); ctx.scale(mo.scale, mo.scale); ctx.translate(-pivot.x, -pivot.y);
  drawCover(ctx, src, 0, 0, W, H); ctx.restore();
  const pinOf = (k: string | null | undefined) => (k ? tf(o.pins?.[k] ?? null) : null);
  const micro = since(cues, 'micro', t);
  if (micro.cue?.data?.v === 1) drawGlowPulse(ctx, pinOf(o.focus) ?? tf(main?.at), micro.age, lighten(o.color ?? ACCENT));
  drawSplash(ctx, pinOf('tongue'), since(cues, 'sip', t).age, lighten(o.color ?? '#ffffff'));
  const sg = since(cues, 'surge', t);
  bodyLife(ctx, pinOf, o, cues, t, { age: sg.age, kind: sg.cue?.data?.label, build: sg.cue?.data?.v }, [Lo.topBot, Lo.capTop]);
  // round 10b: the 24 h afterglow: a slow breath of light on the organ where the rest still is (under the end card too)
  if (fr.beat === 'end') { const where = (o.gauges ?? []).find((g) => !g.curve) ?? main; drawBreath(ctx, (where?.at ? tf(where.at) : null) ?? pinOf(o.focus), t, lighten(o.color ?? ACCENT), 130, fr.phase === 'outro' ? 0.6 : 1); }
  const peak = since(cues, 'peak', t);
  // round 10: each new moment lands with a hit on its organ (and a thump in the sound), not on the impact itself
  const hit = since(cues, 'stop', t);
  if (hit.cue && hit.cue.t > 1.2 && Math.abs(hit.cue.t - (peak.cue?.t ?? -9)) > 0.3) drawOrganHit(ctx, pinOf(o.focus) ?? tf(main?.at), hit.age, lighten(o.color ?? ACCENT));
  drawShockwave(ctx, tf(main?.at) ?? pinOf(o.focus), peak.age, LIGHT[main?.level ?? 1]);
  drawDayDone(ctx, cues, t, [tf({ x: W / 2, y: H * 0.47 })]);
  if (fr.beat === 'rewind') drawRewindLines(ctx, W, H, (t - TEASER_S) / REWIND_S);
  if (fr.beat === 'glide') drawSpeedLines(ctx, W, t, speedAlpha(fr.rate), Lo.topBot, Lo.capTop); // V17 (round 9)
  drawFloorGlow(ctx, W, H, lighten(o.color ?? ACCENT), t); // (round 14b)
  scrims(ctx, W, H, Lo.topBot, Lo.capTop);
  drawNight(ctx, W, H, fr.night ?? 0, { x: R - 24, y: Lo.clockTop + Lo.clockH / 2 });
  drawSunrise(ctx, W, H, since(cues, 'night', t, (c) => c.data?.v === 0).age);
  drawVignette(ctx, W, H, vignetteAlpha(cues, t));
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const outS = plan?.outroS ?? OUTRO_S.long, E = endTiming(fr, outS);
  // 2) gauges pinned to the organs: where the drink is (left), the number that matters (right)
  if (E.main > 0.001) {
    ctx.save(); ctx.globalAlpha = E.main * (fr.phase === 'intro' && fr.beat !== 'teaser' ? smooth((ti - 0.8) / 0.5) : 1);
    const top = Lo.topBot + 14, bot = Lo.capTop - 14, gw = reel ? 300 : 280;
    // never a gauge that names the same thing as the card on screen with another number (safety net, video-beats.ts)
    const capNow = fr.phase === 'intro' ? '' : fr.cap ?? '';
    // (round 6: nor a where-gauge for the thing the card talks about: "22 g fiber" next to "Most of the fiber is still
    // in you", "4 g sugar" next to a blood sugar card; one number per thing)
    const noun = (g: Gauge) => (!g.curve ? /\b(fiber|sugar|caffeine|alcohol)\b/i.exec(g.big)?.[1]?.toLowerCase() : undefined);
    const gs = (o.gauges ?? []).filter((g) => !numberConflict(capNow, [g.big]) && !(noun(g) && capNow.toLowerCase().includes(noun(g)!))).slice(0, 2);
    gs.forEach((g, i) => {
      const h = gaugeHeight(ctx, g, reel, gw), right = gs.length === 1 ? !!g.curve : i === 1;
      const at = tf(g.at), pin = onFrame(at, W, top, bot) ? at! : null;
      let y = pin ? pin.y - h / 2 : right ? top + (bot - top) * 0.15 : top + (bot - top) * 0.55;
      y = Math.max(top, Math.min(bot - h - (g.curve ? 44 : 0), y));
      const x = right ? (y + h > S.lowFrom ? RL : R) - gw : L;
      if (pin && ctx.globalAlpha > 0.01) drawPin(ctx, { x: right ? x : x + gw, y: Math.max(y + 18, Math.min(y + h - 18, pin.y)) }, pin, g.curve ? LIGHT[g.level] : '#e6edf5', t + i * 0.45);
      // the peak: the main number bounces (×1.15) and gets a PEAK stamp for 1.4 s; it also shows on the cold open
      const isMain = g === main, pk = isMain ? (fr.beat === 'teaser' ? 0.6 : peak.age) : Infinity;
      const flash = isMain && micro.cue?.data?.v === 2 && micro.age < 0.5 ? 1 - micro.age / 0.5 : 0;
      const counting = isMain && (vignetteAlpha(cues, t) > 0.01 && peak.age > 0.5 || peak.age < 0.4);
      drawGauge(ctx, g, x, y, gw, reel, { bounce: pk < 0.35 ? Math.sin(Math.PI * pk / 0.35) : 0, flash, count: counting });
      if (pk <= 1.4) drawStamp2(ctx, 'PEAK', x + (right ? gw - 10 : 10), y + h + 8, LIGHT[g.level], right, Math.min(1, (1.4 - pk) / 0.25));
    });
    ctx.restore();
  }
  // 3) top: brand, hook, clock (it runs backwards in the rewind)
  if (E.top > 0.001) { ctx.save(); ctx.globalAlpha = E.top; topBand(ctx, Lo, fr.phase === 'intro' ? 'INSIDE 24H · WATCH THE NEXT 24 HOURS' : 'INSIDE 24H', o.handle, fr.m, u, fr.rate ?? 0, !!o.solid, fr.beat === 'rewind', fr.phase === 'intro' ? t - TEASER_S - REWIND_S : 9); ctx.restore(); }
  // 4) bottom: the moment's title and its short card; in a glide, the NEXT chip
  if (E.main > 0.001) {
    // (round 9: the card leaves BEFORE the NEXT chip comes in, never a cross-fade of two texts in the same place)
    const plate = fr.beat === 'glide' && fr.next ? Math.max(0, 2 * (fr.plateA ?? 1) - 1) : fr.plateA ?? 1;
    ctx.save(); ctx.globalAlpha = E.main * plate;
    const title = (fr.title ?? o.step ?? '').trim(), cap = (fr.phase === 'intro' ? '' : fr.cap ?? '').trim();
    const titleOnly = !!cap && cap.replace(/\.$/, '').toLowerCase() === title.toLowerCase();
    const capFit = balanced(ctx, fitWrap(ctx, cap, RL - L, 2, Lo.capFs, 42, (px) => `${titleOnly ? 700 : 600} ${px}px ${SANS}`), cap, RL - L);
    const capBot = S.bottom - 4, capY0 = capBot - (capFit.lines.length - 1) * Lo.capLH - capFit.px * 0.22;
    shade(ctx, true);
    if (fr.tease && cap) { ctx.font = `700 ${Lo.kickFs}px ${SANS}`; ctx.fillStyle = '#ffc83d'; text(ctx, 'STILL TO COME', L, capY0 - capFit.px * 0.86 - 16); }
    else if (title && !titleOnly && cap) { // (round 5: never a label without its card)
      ctx.font = `700 ${Lo.kickFs}px ${SANS}`; ctx.fillStyle = ACCENT;
      text(ctx, fit(ctx, title.toUpperCase(), RL - L), L, capY0 - capFit.px * 0.86 - 16);
    }
    if (cap) {
      ctx.save(); ctx.globalAlpha *= fr.capA; ctx.fillStyle = fr.tease ? '#ffe2a0' : '#ffffff'; ctx.font = `${titleOnly ? 700 : 600} ${capFit.px}px ${SANS}`;
      capFit.lines.forEach((ln, i) => text(ctx, ln, L, capY0 + i * Lo.capLH));
      ctx.restore();
    }
    shade(ctx, false);
    ctx.restore();
    if (fr.beat === 'glide' && fr.next) {
      ctx.save(); ctx.globalAlpha = E.main * Math.max(0, 1 - 2 * (fr.plateA ?? 1));
      drawNextChip(ctx, `NEXT · ${elapsedText(fr.next.min)} · ${fr.next.title}`, L, S.bottom - 62, RL - L, reel);
      ctx.restore();
    }
  }
  if (fr.celeb !== undefined && fr.phase === 'main') drawCeleb(ctx, Lo, o, fr, cues);
  if (E.top > 0.001) { ctx.save(); ctx.globalAlpha = E.top; footer(ctx, W, H, format, u, plan?.stopsU); ctx.restore(); }
  if (fr.phase === 'outro') {
    drawBodyOutro(ctx, W, H, o, E.end, format, Lo.topBot, fr.k * outS, outS <= 2.6);
    if (first && E.first > 0.001) { ctx.save(); ctx.globalAlpha = E.first; ctx.drawImage(first, 0, 0); ctx.restore(); }
  }
}

/** Round 11 (research R1): the 24 h payoff beat over the body: "AFTER 24 HOURS" and the day's lights, each coming on
 *  with its blip (video-plan 'lights' cues), where the caption was. The body stays in frame. */
function drawCeleb(ctx: CanvasRenderingContext2D, Lo: ReturnType<typeof layoutBody>, o: Overlay, fr: VFrame, cues: Plan['cues'] | undefined) {
  const { S, L, RL, reel } = Lo, t = fr.t, items = o.summary.slice(0, 4);
  const lc = (cues ?? []).filter((c) => c.kind === 'lights');
  const a0 = smooth(((fr.celeb ?? 0) * 10 - 1.2) / 1.5); // after the last card has gone (0.25 s)
  if (a0 <= 0.01) return;
  ctx.save(); ctx.globalAlpha = a0; shade(ctx, true);
  const r = reel ? 34 : 28, cy = S.bottom - (reel ? 86 : 72), cw = (RL - L) / Math.max(1, items.length);
  ctx.textAlign = 'left'; ctx.fillStyle = ACCENT; ctx.font = `700 ${Lo.kickFs}px ${SANS}`; text(ctx, 'AFTER 24 HOURS', L, cy - r - 30);
  items.forEach((l, i) => {
    const cue = lc.find((c) => c.data?.v === i), k = cue ? smooth((t - cue.t) / 0.2) : 1;
    if (k <= 0.01) return;
    const cx = L + cw * i + cw / 2, pop = 1 + 0.18 * Math.sin(Math.PI * k);
    ctx.save(); ctx.globalAlpha *= k;
    ctx.fillStyle = lightCol(l); ctx.beginPath(); ctx.arc(cx, cy, r * pop, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = 'center'; ctx.font = `${Math.round(r * 1.05)}px ${EMOJI}`; ctx.fillStyle = '#04070c'; ctx.fillText(l.icon, cx, cy + r * 0.38);
    ctx.fillStyle = '#e6edf5'; ctx.font = `700 ${reel ? 26 : 22}px ${SANS}`; text(ctx, fit(ctx, l.label.split(' & ')[0], cw - 8), cx, cy + r + (reel ? 34 : 28));
    ctx.restore();
  });
  shade(ctx, false); ctx.restore(); ctx.textAlign = 'left';
}
/** Round 11: "day done": a wide ring out from the body (or each body) as the 24 h beat completes, with sparks when
 *  the day was not about alcohol ('day' cue label 'bright'; 'calm' = a ring only: alcohol is never celebrated). */
function drawDayDone(ctx: CanvasRenderingContext2D, cues: Plan['cues'] | undefined, t: number, at: ({ x: number; y: number } | null)[]) {
  const d = since(cues, 'day', t);
  if (!(d.age >= 0 && d.age < 0.9)) return;
  for (const p of at) {
    if (!p) continue;
    drawShockwave(ctx, p, d.age, ACCENT);
    if (d.cue?.data?.label === 'bright') drawSparks(ctx, p.x, p.y, d.age, '#9fe8ff');
  }
}

/** "NEXT · +1:15 · The sugar dip": the moment ahead, in a glass chip (an open loop). */
function drawNextChip(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, maxW: number, reel: boolean, center = false) {
  const fs = reel ? 30 : 26;
  ctx.font = `700 ${fs}px ${SANS}`;
  const t = fit(ctx, s, maxW - 36), w = ctx.measureText(t).width + 36, h = fs + 26, x0 = center ? x - w / 2 : x;
  ctx.fillStyle = GLASS; roundRect(ctx, x0, y, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,200,61,.7)'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#ffe2a0'; ctx.textAlign = 'left'; text(ctx, t, x0 + 18, y + h / 2 + fs * 0.36);
}
/** A small coloured stamp ("PEAK") under a gauge. */
function drawStamp2(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, col: string, alignRight: boolean, a: number) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.font = `800 24px ${SANS}`; const w = ctx.measureText(s).width + 26, h = 36, x0 = alignRight ? x - w : x;
  ctx.fillStyle = col; roundRect(ctx, x0, y, w, h, 8); ctx.fill();
  ctx.fillStyle = '#04070c'; ctx.textAlign = 'left'; text(ctx, s, x0 + 13, y + 26);
  ctx.restore();
}

/** Round 6 (critic: the end card stood frozen for 4-8 s): the whole card drifts in slowly (a 2.5 % push-in over 6 s),
 *  so the picture never stands still while it is read. */
function endDrift(ctx: CanvasRenderingContext2D, W: number, H: number, tt: number) {
  const s = 1 + 0.025 * Math.max(0, Math.min(1, tt / 6));
  ctx.translate(W / 2, H * 0.42); ctx.scale(s, s); ctx.translate(-W / 2, -H * 0.42);
}
/** End card over the body: what the day did (the lights come on one by one) and one line to comment on. The hook and
 *  the clock (+24:00) stay at the top; the body stays visible behind the glass. Wording: VIDEO_COPY. */
function drawBodyOutro(ctx: CanvasRenderingContext2D, W: number, H: number, o: Overlay, alpha: number, format: Format, topBot: number, tt = 9, short = false) {
  if (alpha <= 0.001) return;
  const reel = format === 'reel', S = SAFE[format], L = S.left, RL = S.rightLow;
  ctx.save(); ctx.globalAlpha = alpha;
  endDrift(ctx, W, H, tt);
  const y0 = topBot + (reel ? 40 : 24);
  const g = ctx.createLinearGradient(0, y0 - 60, 0, y0 + 40);
  g.addColorStop(0, 'rgba(4,7,12,0)'); g.addColorStop(1, 'rgba(4,7,12,.86)');
  ctx.fillStyle = g; ctx.fillRect(0, y0 - 60, W, 100); ctx.fillStyle = 'rgba(4,7,12,.86)'; ctx.fillRect(0, y0 + 40, W, H - y0 - 40);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  let y = y0 + (reel ? 40 : 30);
  ctx.fillStyle = ACCENT; ctx.font = `700 ${reel ? 30 : 26}px ${SANS}`; text(ctx, 'AFTER 24 HOURS', L, y);
  const t = fitWrap(ctx, o.title, S.right - L, 2, reel ? 64 : 52, 40, (px) => `400 ${px}px ${SERIF}`);
  ctx.fillStyle = '#ffffff'; ctx.font = `400 ${t.px}px ${SERIF}`;
  t.lines.forEach((ln, i) => text(ctx, ln, L, y + 12 + t.px * 0.9 + i * t.px * 1.02));
  y += 12 + t.px * 0.9 + (t.lines.length - 1) * t.px * 1.02 + (reel ? 24 : 16);
  // round 14 (critic G-3): one highlighted number above the lights, the climax as the gauge showed it
  if (o.hero) {
    const hb = fitWrap(ctx, o.hero.big, RL - L, 1, reel ? 40 : 34, 26, (px) => `800 ${px}px ${SANS}`);
    ctx.fillStyle = '#ffd27a'; ctx.font = `800 ${hb.px}px ${SANS}`; text(ctx, hb.lines[0] ?? o.hero.big, L, y + hb.px * 0.9);
    y += hb.px * 0.9 + 10;
    const hs = fitWrap(ctx, o.hero.small, RL - L, 1, reel ? 26 : 22, 18, (px) => `600 ${px}px ${SANS}`);
    ctx.fillStyle = '#e6edf5'; ctx.font = `600 ${hs.px}px ${SANS}`; text(ctx, hs.lines[0] ?? o.hero.small, L, y + hs.px * 0.9);
    y += hs.px * 0.9 + (reel ? 24 : 16);
  }
  const rows = short ? 0 : Math.max(1, o.summary.length); // (round 11: the short end card is ≤ 2.5 s: the name, the question, the loop)
  const room = S.bottom - y - (reel ? 150 : 120);
  const rh = Math.max(reel ? 70 : 58, Math.min(reel ? 92 : 78, room / rows));
  o.summary.forEach((l, i) => {
    // each light comes on in turn (with its blip, video-plan 'lights' cues), a small pop
    const k = 1; // (round 11: the lights came on in the 24 h beat, with the body in frame)
    if (k <= 0.01 || short) return;
    const ry = y + i * rh, hh = rh - 10, pop = 1 + 0.08 * Math.sin(Math.PI * k);
    ctx.save(); ctx.globalAlpha *= k;
    ctx.translate(L + (RL - L) / 2, ry + hh / 2); ctx.scale(pop, pop); ctx.translate(-(L + (RL - L) / 2), -(ry + hh / 2));
    ctx.fillStyle = 'rgba(16,28,44,.92)'; roundRect(ctx, L, ry, RL - L, hh, 18); ctx.fill();
    const r = Math.min(24, hh * 0.32);
    ctx.fillStyle = lightCol(l); ctx.beginPath(); ctx.arc(L + 18 + r, ry + hh / 2, r, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = 'center'; ctx.font = `${Math.round(r * 1.05)}px ${EMOJI}`; ctx.fillStyle = '#04070c'; ctx.fillText(l.icon, L + 18 + r, ry + hh / 2 + r * 0.38); ctx.textAlign = 'left';
    const tx = L + 18 + 2 * r + 18, tw = RL - tx - 16;
    ctx.fillStyle = '#e6edf5'; ctx.font = `700 ${reel ? 28 : 24}px ${SANS}`; text(ctx, fit(ctx, l.label, tw), tx, ry + hh * 0.44);
    ctx.fillStyle = lightCol(l); ctx.font = `600 ${reel ? 24 : 21}px ${SANS}`; text(ctx, fit(ctx, l.note, tw), tx, ry + hh * 0.82);
    ctx.restore();
  });
  y += rows * rh + (reel ? 18 : 12);
  const cta = fitWrap(ctx, o.alcohol || !o.solid ? VIDEO_COPY.ctaDrink : VIDEO_COPY.ctaSingle, RL - L, /* (round 13: a drink asks for the next drink) */ 2, reel ? 46 : 38, 32, (px) => `700 ${px}px ${SANS}`);
  ctx.fillStyle = '#ffffff'; ctx.font = `700 ${cta.px}px ${SANS}`;
  cta.lines.forEach((ln, i) => text(ctx, ln, L, y + cta.px * 0.9 + i * cta.px * 1.16));
  y += cta.px * 0.9 + (cta.lines.length - 1) * cta.px * 1.16 + (reel ? 44 : 36);
  ctx.fillStyle = ACCENT; ctx.font = `600 ${reel ? 30 : 26}px ${SANS}`;
  text(ctx, fit(ctx, VIDEO_COPY.loop(o.solid), RL - L), L, Math.min(y, S.bottom - 8)); // (round 11: the loop, not "follow": the handle is at the top)
  ctx.restore(); ctx.textAlign = 'left';
}

// ---------- the comparison: split screen ----------
/** Positions of the split-screen frame (shared by drawing and tests). 2026-10-24: a compact header (owner review:
 *  it took ~40 % of the height and covered the heads): one line with the hook and the clock, one line with the two
 *  names and their numbers; the bodies, heads and brains included, are visible below it. */
export function layoutSplit(ctx: CanvasRenderingContext2D, o: { hook: string }, settle = 1) {
  const S = SAFE.reel, L = S.left, R = S.right, RL = S.rightLow;
  const kickY = S.top + 22;
  ctx.font = `700 34px ${SANS}`;
  const clockW = 46 + 14 + monoText(ctx, '+24:00', 0, 0, true) + 12 + 30 + 14, clockH = 52;
  const hookW = R - L - clockW - 18;
  const head = fitWrap(ctx, o.hook, hookW, 2, Math.round(lerp(52, 44, settle)), 28, (px) => `400 ${px}px ${SERIF}`);
  const headLH = head.px * 1.04, head0 = kickY + 12 + head.px * 0.88;
  const headBot = head0 + (head.lines.length - 1) * headLH + head.px * 0.24;
  const clockTop = Math.max(kickY + 12, head0 - head.px * 0.62 - (clockH - head.px * 0.7) / 2);
  const topBot = Math.max(headBot, clockTop + clockH);
  const nameY = topBot + 46; // baseline of the two names (and the middle of their number chips)
  const chipH = 62, chipTop = nameY - 42, headerBot = chipTop + chipH;
  // each side's words sit under its own body: left column, and a right column that clears the platform buttons
  const colW = 340, cols: [number, number][] = [[L + 6, L + 6 + colW], [RL - colW, RL]];
  const capFs = 32, capLH = 40, kickFs = 24;
  const capTop = S.bottom - (kickFs + 12 + 3 * capLH);
  return { reel: true, S, L, R, RL, kickY, head, headLH, head0, headBot, clockW, clockH, clockTop, topBot, nameY, chipH, chipTop, headerBot, cols, capFs, capLH, kickFs, capTop };
}

/** The compact clock of the split screen: day ring, "+0:45", fast-forward marks. */
function drawClockCompact(ctx: CanvasRenderingContext2D, x1: number, y: number, w: number, h: number, m: number, u: number, rate: number, back = false) {
  const x = x1 - w;
  ctx.save();
  ctx.fillStyle = GLASS; roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = 'rgba(92,211,255,.55)'; ctx.lineWidth = 2; ctx.stroke();
  const r = h * 0.3, cx = x + 14 + r, cy = y + h / 2;
  ctx.lineWidth = h * 0.09; ctx.strokeStyle = 'rgba(140,170,210,.25)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = ACCENT; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.002, Math.min(1, u))); ctx.stroke(); ctx.lineCap = 'butt';
  ctx.font = `700 34px ${SANS}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left';
  const tw = monoText(ctx, elapsedText(m), cx + r + 14, y + h * 0.69);
  const ff = back ? 1 : Math.max(0, Math.min(1, (rate - 6) / 40)), fx = cx + r + 14 + tw + 12;
  ctx.globalAlpha *= 0.18 + 0.82 * ff; ctx.fillStyle = back ? '#ffc83d' : ACCENT;
  for (let k = 0; k < 2; k++) { const bx = fx + k * 13; ctx.beginPath(); if (back) { ctx.moveTo(bx + 11, cy - 9); ctx.lineTo(bx, cy); ctx.lineTo(bx + 11, cy + 9); } else { ctx.moveTo(bx, cy - 9); ctx.lineTo(bx + 11, cy); ctx.lineTo(bx, cy + 9); } ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

/** A body's number as a compact chip next to its name: the value, and what it is underneath. Returns its width. */
function drawChip(ctx: CanvasRenderingContext2D, g: PinnedGauge, x: number, y: number, maxW: number, h: number, alignRight: boolean): number {
  ctx.save();
  let bf = 30; ctx.font = `700 ${bf}px ${SANS}`;
  while (bf > 22 && ctx.measureText(g.big).width > maxW - 28) { bf -= 2; ctx.font = `700 ${bf}px ${SANS}`; } // smaller, never cut
  const bw = ctx.measureText(g.big).width;
  // (round 5: the small line shrinks to fit, never cut to "0.12–…")
  // (round 6: the chip has room for the range only; the limit anchor stays on the single video's gauge)
  const gs = g.small.replace(/ · .*$/, '');
  let sf = 20; ctx.font = `600 ${sf}px ${SANS}`; while (sf > 15 && ctx.measureText(gs).width > maxW - 28) { sf -= 1; ctx.font = `600 ${sf}px ${SANS}`; }
  const small = fit(ctx, gs, maxW - 28); const sw = ctx.measureText(small).width;
  const w = Math.min(maxW, Math.max(bw, sw) + 28), x0 = alignRight ? x - w : x;
  ctx.fillStyle = GLASS; roundRect(ctx, x0, y, w, h, 16); ctx.fill();
  ctx.strokeStyle = g.curve ? LIGHT[g.level] : 'rgba(220,235,250,.35)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.textAlign = 'left';
  ctx.font = `700 ${bf}px ${SANS}`; ctx.fillStyle = g.curve ? LIGHT[g.level] : '#ffffff'; text(ctx, fit(ctx, g.big, w - 28), x0 + 14, y + 29);
  ctx.font = `600 ${sf}px ${SANS}`; ctx.fillStyle = '#d5e0ec'; text(ctx, small, x0 + 14, y + h - 12);
  ctx.restore();
  return w;
}

/** Split-screen frame of the comparison video: two bodies, each with its colour, name, number and words. */
export function drawSplitFrame(ctx: CanvasRenderingContext2D, W: number, H: number, src: CanvasImageSource & { width: number; height: number },
  o: CmpOverlay, fr: VFrame, plan: PlanView | null, first: HTMLCanvasElement | null) {
  const introS = plan?.introS ?? INTRO_S.long, ti = fr.k * introS, cues = plan?.cues;
  const settle = fr.phase === 'intro' ? smooth((ti - (introS - 1.0)) / 0.9) : 1;
  const Lo = layoutSplit(ctx, o, settle), { S, L, R } = Lo;
  const u = fr.u ?? o.progress, t = fr.t;
  // the bodies move with the impacts (both halves together, pivot between them)
  const mo = bodyMotion(cues, t, H, fr.beat), pv = { x: W / 2, y: H * 0.45 };
  const tf = (p: { x: number; y: number } | null | undefined) => (p ? { x: (p.x - pv.x) * mo.scale + pv.x + mo.dx, y: (p.y - pv.y) * mo.scale + pv.y + mo.dy } : null);
  stageBg(ctx, W, H, H * 0.45);
  ctx.save(); ctx.translate(pv.x + mo.dx, pv.y + mo.dy); ctx.scale(mo.scale, mo.scale); ctx.translate(-pv.x, -pv.y);
  drawCover(ctx, src, 0, 0, W, H); ctx.restore();
  const sipAge = since(cues, 'sip', t).age, peak = since(cues, 'peak', t);
  [o.a, o.b].forEach((sd, k) => {
    drawSplash(ctx, tf(sd.pins?.tongue ?? null), sipAge - k * 0.12, lighten(sd.color), 11 + k);
    const sg = since(cues, 'surge', t);
    bodyLife(ctx, (key) => tf(sd.pins?.[key] ?? null), sd, k === 0 ? cues : undefined, t, (sg.cue?.data?.side ?? 0) === k ? { age: sg.age, kind: sg.cue?.data?.label, build: sg.cue?.data?.v } : undefined, [Lo.headerBot, Lo.capTop]); // one heartbeat glow is enough (left)
    if (fr.beat === 'end') drawBreath(ctx, tf(sd.gauge?.at ?? sd.pins?.stomach ?? null), t + k * 0.8, lighten(sd.color), 95, fr.phase === 'outro' ? 0.6 : 1); // (round 10b)
    const hit = since(cues, 'stop', t);
    if (sd.gauge && hit.cue && hit.cue.t > 1.2 && Math.abs(hit.cue.t - (peak.cue?.t ?? -9)) > 0.3) drawOrganHit(ctx, tf(sd.gauge.at), hit.age - k * 0.08, lighten(sd.color), 0.7);
    if (sd.gauge?.curve) drawShockwave(ctx, tf(sd.gauge.at), peak.age, LIGHT[sd.gauge.level]);
  });
  drawDayDone(ctx, cues, t, [tf({ x: W / 4, y: H * 0.5 }), tf({ x: (3 * W) / 4, y: H * 0.5 })]);
  if (fr.beat === 'rewind') drawRewindLines(ctx, W, H, (t - TEASER_S) / REWIND_S);
  if (fr.beat === 'glide') drawSpeedLines(ctx, W, t, speedAlpha(fr.rate), Lo.headerBot, Lo.capTop); // V17 (round 9)
  drawFloorGlow(ctx, W / 2, H, lighten(o.a.color), t); ctx.save(); ctx.translate(W / 2, 0); drawFloorGlow(ctx, W / 2, H, lighten(o.b.color), t + 2); ctx.restore(); // (round 14b: each body lit in its drink's colour)
  scrims(ctx, W, H, Lo.headerBot - 70, Lo.capTop);
  drawNight(ctx, W, H, fr.night ?? 0, { x: W / 2, y: Lo.headerBot + 30 });
  drawSunrise(ctx, W, H, since(cues, 'night', t, (c) => c.data?.v === 0).age);
  drawVignette(ctx, W, H, vignetteAlpha(cues, t));
  const outS = plan?.outroS ?? OUTRO_S.long + CMP_OUTRO_EXTRA_S, E = endTiming(fr, outS);
  // the seam between the two bodies
  const sg = ctx.createLinearGradient(0, Lo.headerBot, 0, Lo.capTop);
  sg.addColorStop(0, 'rgba(92,211,255,0)'); sg.addColorStop(0.2, 'rgba(92,211,255,.35)'); sg.addColorStop(0.8, 'rgba(92,211,255,.35)'); sg.addColorStop(1, 'rgba(92,211,255,0)');
  ctx.fillStyle = sg; ctx.fillRect(W / 2 - 1.5, Lo.headerBot, 3, Lo.capTop - Lo.headerBot);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const sides = [o.a, o.b];
  if (E.main > 0.001) {
    ctx.save(); ctx.globalAlpha = E.main;
    // names (each in its colour) and numbers, one line; VS on the seam
    sides.forEach((s, k) => {
      const x0 = k ? W / 2 + 34 : L, x1 = k ? R : W / 2 - 34, half = x1 - x0;
      const g = s.gauge && !numberConflict((k ? fr.capB : fr.cap) ?? '', [s.gauge.big]) ? s.gauge : null;
      ctx.save(); ctx.globalAlpha *= fr.phase === 'intro' && fr.beat !== 'teaser' ? smooth((ti - 0.8) / 0.5) : 1;
      const cw = g ? drawChip(ctx, g, k ? x1 : x0, Lo.chipTop, Math.min(250, half * 0.55), Lo.chipH, !!k) : 0;
      ctx.restore();
      const nx0 = k ? x0 : x0 + cw + 14, nx1 = k ? x1 - cw - 14 : x1;
      const nm = fitWrap(ctx, s.name, nx1 - nx0, 1, 40, 26, (px) => `400 ${px}px ${SERIF}`);
      ctx.font = `400 ${nm.px}px ${SERIF}`; shade(ctx, true);
      const line = fit(ctx, nm.lines[0] ?? s.name, nx1 - nx0), nw = ctx.measureText(line).width;
      ctx.textAlign = k ? 'left' : 'right'; ctx.fillStyle = '#ffffff';
      const tx = k ? nx0 : nx1;
      text(ctx, line, tx, Lo.nameY);
      // round 5 (critic: the servings were never said): how much, under the name ("1 can · 330 ml")
      if (s.serving) { ctx.font = `600 24px ${SANS}`; ctx.fillStyle = '#c9d6e4'; text(ctx, fit(ctx, s.serving, nx1 - nx0), tx, Lo.nameY + 40); ctx.font = `400 ${nm.px}px ${SERIF}`; }
      shade(ctx, false);
      ctx.fillStyle = s.color; roundRect(ctx, k ? tx : tx - nw, Lo.nameY + 9, nw, 5, 2.5); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.textAlign = 'left';
      // the number's pin to its organ, in this body's half
      const at = tf(g?.at), pin = g && onFrame(at, W, Lo.headerBot + 10, Lo.capTop - 10) && (k ? at!.x > W / 2 + 10 : at!.x < W / 2 - 10) ? at! : null;
      if (g && pin && cw) drawPin(ctx, { x: k ? x1 - cw / 2 : x0 + cw / 2, y: Lo.chipTop + Lo.chipH }, pin, g.curve ? LIGHT[g.level] : '#e6edf5', t + k * 0.45);
    });
    ctx.fillStyle = '#04070c'; ctx.beginPath(); ctx.arc(W / 2, Lo.nameY - 10, 24, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = ACCENT; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = ACCENT; ctx.font = `700 21px ${SANS}`; ctx.textAlign = 'center'; text(ctx, 'VS', W / 2, Lo.nameY - 2); ctx.textAlign = 'left';
    // each side's moment: its title, its short card
    // (round 9: the cards leave before the NEXT chip comes in, never two texts cross-fading in one place)
    ctx.save(); ctx.globalAlpha *= fr.beat === 'glide' && fr.next ? Math.max(0, 2 * (fr.plateA ?? 1) - 1) : fr.plateA ?? 1;
    const caps: [string, string][] = [[fr.title ?? o.a.step, fr.phase === 'intro' ? '' : fr.cap ?? ''], [fr.titleB ?? o.b.step, fr.phase === 'intro' ? '' : fr.capB ?? '']];
    // (round 13, critic P1-3: wine vs beer showed the same sentence twice, side by side): one card across both columns
    const same = !!caps[0][1].trim() && caps[0][1].trim() === caps[1][1].trim();
    sides.forEach((s, k) => {
      if (same && k === 1) return;
      const [x0, x1] = same ? [Lo.cols[0][0], Lo.cols[1][1]] : Lo.cols[k], w = x1 - x0;
      const title = same ? `Both · ${(caps[0][0] ?? '').trim()}` : (caps[k][0] ?? '').trim(), cap = (caps[k][1] ?? '').trim();
      const titleOnly = !!cap && cap.replace(/\.$/, '').toLowerCase() === title.toLowerCase();
      shade(ctx, true);
      const c = balanced(ctx, fitWrap(ctx, cap, w, 3, Lo.capFs, 26, (px) => `600 ${px}px ${SANS}`), cap, w);
      const capBot = S.bottom - 4, y0 = capBot - (c.lines.length - 1) * Lo.capLH - c.px * 0.22;
      if (title && !titleOnly && cap) { // (round 5: never a label without its card)
        ctx.font = `700 ${Lo.kickFs}px ${SANS}`; ctx.fillStyle = lighten(s.color);
        const tl = cap ? wrap(ctx, title.toUpperCase(), w, 2) : [title.toUpperCase()], ty = cap ? y0 - c.px * 0.86 - 14 : capBot - 6;
        tl.forEach((ln, i) => text(ctx, fit(ctx, ln, w), x0, ty - (tl.length - 1 - i) * (Lo.kickFs + 6)));
      }
      if (cap) {
        ctx.save(); ctx.globalAlpha *= fr.phase === 'main' ? fr.capA : 1; ctx.fillStyle = '#ffffff'; ctx.font = `${titleOnly ? 700 : 600} ${c.px}px ${SANS}`;
        c.lines.forEach((ln, i) => text(ctx, ln, x0, y0 + i * Lo.capLH));
        ctx.restore();
      }
      shade(ctx, false);
    });
    ctx.restore();
    ctx.restore();
  }
  // the game (spec §3.3): the guess, the open loop, the race out of the stomach and the scoreboard (lower part)
  if (E.main > 0.001) drawSplitGame(ctx, W, H, o, fr, cues, Lo, E.main);
  if (fr.celeb !== undefined && fr.phase === 'main') drawCelebSplit(ctx, W, o, fr, cues, Lo);
  // top line: brand, hook, clock
  if (E.top > 0.001) {
    ctx.save(); ctx.globalAlpha = E.top;
    ctx.font = `700 22px ${SANS}`; ctx.fillStyle = ACCENT; shade(ctx, true);
    const kick = fr.phase === 'intro' ? 'INSIDE 24H · SIDE BY SIDE, 24 HOURS' : 'INSIDE 24H';
    text(ctx, kick, L, Lo.kickY);
    if (o.handle) { const kw = ctx.measureText(kick).width; ctx.textAlign = 'right'; ctx.fillStyle = '#c9d6e4'; ctx.font = `600 22px ${SANS}`; const room = R - L - kw - 40; if (room > 120) text(ctx, fit(ctx, o.handle, room), R, Lo.kickY); ctx.textAlign = 'left'; }
    ctx.fillStyle = '#ffffff'; ctx.font = `400 ${Lo.head.px}px ${SERIF}`;
    Lo.head.lines.forEach((ln, i) => text(ctx, ln, L, Lo.head0 + i * Lo.headLH));
    shade(ctx, false);
    drawClockCompact(ctx, R, Lo.clockTop, Lo.clockW, Lo.clockH, fr.m, u, fr.rate ?? 0, fr.beat === 'rewind');
    footer(ctx, W, H, 'reel', u, plan?.stopsU);
    ctx.restore();
  }
  if (fr.phase === 'outro') {
    drawSplitOutro(ctx, W, H, o, E.end, Lo.topBot, fr.k * outS, cues);
    if (first && E.first > 0.001) { ctx.save(); ctx.globalAlpha = E.first; ctx.drawImage(first, 0, 0); ctx.restore(); }
  }
}
/** A drink colour light enough to read as text on the dark frame (cola is near black, water near white). */
export function lighten(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return ACCENT;
  const n = parseInt(m[1], 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lum = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  if (lum >= 0.55) return `#${m[1]}`;
  const k = (0.62 - lum) / (1 - lum);
  return `rgb(${c.map((v) => Math.round(v + (255 - v) * k)).join(',')})`;
}

/** Comparison end card: both days in two columns, the verdict (analyze.ts verdictOf: alcohol never "wins"), and a
 *  question to comment on. The hook and the clock stay at the top. */
/** The comparison as a game (2026-10-24 creative spec §3.3, §4.1): "Comment A or B before the end." under the guess,
 *  "Answer at 24 h." at about half time, NEXT chips, and in the lower part of the frame (the legs) the race out of the
 *  stomach with a scoreboard of the four lights for each body. The race finish is a neutral "✓ OUT": never a trophy,
 *  never green, and with alcohol on one side "Faster out ≠ better for you." The verdict is verdictOf's only. */
const SCOREBOARD = false;
function drawSplitGame(ctx: CanvasRenderingContext2D, W: number, _H: number, o: CmpOverlay, fr: VFrame, cues: Plan['cues'] | undefined, Lo: ReturnType<typeof layoutSplit>, alpha: number) {
  const { S, L, R } = Lo, t = fr.t;
  ctx.save(); ctx.globalAlpha = alpha;
  // one chip at a time above the captions: the guess (intro), "Answer at 24 h." (half time), "Faster out ≠ …" (race)
  const sip = since(cues, 'sip', t), tease = since(cues, 'next', t, (c) => c.data?.label === 'tease'), race = since(cues, 'race', t);
  const anyAlcohol = !!(o.a.alcohol || o.b.alcohol);
  // THE ANSWER (round 4): when the race is decided (the plan's 'peak' cue of a comparison), a banner names it, with
  // the impact; the honesty card follows it when alcohol is on either side
  const ans = o.answer, dec = since(cues, 'peak', t), ansS = ans ? readChars(ans.a1.length + ans.a2.length) + 0.6 : 0;
  const showAns = !!ans && dec.age >= 0 && dec.age < ansS;
  // round 5 (critic P0): "Faster out ≠ better for you." only ever frames the ALCOHOL side, i.e. only when the side
  // that is out first has alcohol (it read as "espresso is bad" after "First out: Espresso")
  // (round 14, critic W-1: after "More alcohol: Beer." the chip had no race to refer to): only after a race out
  const raceKind = !ans || ans.kind === 'stomach' || ans.kind === 'blood';
  const sidesAB = [o.a, o.b], alcWon = raceKind && (ans ? !!sidesAB[ans.winner]?.alcohol : !!sidesAB[race.cue?.data?.side ?? 0]?.alcohol);
  void anyAlcohol;
  const chip = showAns ? '' : o.guess && fr.phase === 'intro' && fr.beat !== 'teaser' && fr.beat !== 'rewind' ? VIDEO_COPY.guessChip
    : tease.age < 2.6 && !(ans && dec.age >= 0) ? VIDEO_COPY.answerAt : alcWon && ans && dec.age >= ansS && dec.age < ansS + 3.2 ? VIDEO_COPY.fasterOut
    : alcWon && !ans && race.age < 3.2 && o.race ? VIDEO_COPY.fasterOut : '';
  void sip;
  if (chip) { ctx.save(); drawNextChip(ctx, chip, W / 2, Lo.capTop - 92, 2 * (S.rightLow - W / 2), true, true); ctx.restore(); } // (round 9: centred, so it clears the button column)
  // (round 6: with alcohol on either side the answer is neutral grey, never the winner's colour)
  if (showAns && ans) drawAnswer(ctx, W, Lo, ans, o.a.alcohol || o.b.alcohol ? '#8a9bb0' : [o.a, o.b][ans.winner].color, dec.age, ansS);
  // the NEXT chip while the day runs on (the captions are away then)
  if (fr.beat === 'glide' && fr.next) {
    ctx.save(); ctx.globalAlpha *= Math.max(0, 1 - 2 * (fr.plateA ?? 1));
    drawNextChip(ctx, `NEXT · ${elapsedText(fr.next.min)} · ${fr.next.title}`, W / 2, S.bottom - 62, 2 * (S.rightLow - W / 2), true, true);
    ctx.restore();
  }
  // lower part (below the captions; graphics, its small words are decoration): the race and the scoreboard
  if (o.race) {
    const y = S.bottom + 110, bh = 20; // (round 13, critic P2-1: 40 px higher, clear of the platforms' captions)
    ctx.fillStyle = '#9fb0c4'; ctx.font = `700 22px ${SANS}`; ctx.textAlign = 'center';
    text(ctx, VIDEO_COPY.raceLabel[o.answer?.kind ?? 'stomach'].toUpperCase(), W / 2, y - 14, true); ctx.textAlign = 'left';
    [o.a, o.b].forEach((sd, k) => {
      const x0 = k ? W / 2 + 24 : L, x1 = k ? R : W / 2 - 24, p = Math.max(0, Math.min(1, k ? o.race!.b : o.race!.a));
      ctx.fillStyle = 'rgba(140,170,210,.22)'; roundRect(ctx, x0, y, x1 - x0, bh, bh / 2); ctx.fill();
      ctx.fillStyle = lighten(sd.color); roundRect(ctx, x0, y, Math.max(bh, (x1 - x0) * p), bh, bh / 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1 - 2, y - 6); ctx.lineTo(x1 - 2, y + bh + 6); ctx.stroke(); // the finish line
      if (p >= 1 && o.answer?.kind !== 'sugar') { ctx.fillStyle = '#e6edf5'; ctx.font = `700 24px ${SANS}`; ctx.textAlign = k ? 'right' : 'left'; text(ctx, '✓ OUT', k ? x1 : x0, y + bh + 34, true); ctx.textAlign = 'left'; }
    });
  }
  // scoreboard: the four lights of each body, as they are now. Round 12 (critic P2-1: at y ≈ 1560 it sat under the
  // platforms' captions): off; the lights come on in the 24 h beat instead (round 11). Kept behind SCOREBOARD.
  if (SCOREBOARD) [o.a, o.b].forEach((sd, k) => {
    const y = S.bottom + 250, x0 = k ? W / 2 + 24 : L, step = 62;
    sd.lights.slice(0, 4).forEach((l, i) => {
      const cx = x0 + 22 + i * step;
      ctx.fillStyle = LIGHT[l.level]; ctx.globalAlpha = alpha * (l.level ? 1 : 0.55); ctx.beginPath(); ctx.arc(cx, y, 20, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = alpha; ctx.textAlign = 'center'; ctx.font = `20px ${EMOJI}`; ctx.fillStyle = '#04070c'; ctx.fillText(l.icon, cx, y + 7); ctx.textAlign = 'left';
    });
  });
  ctx.restore();
}

/** The answer banner: "First out: Espresso." / "Out of the stomach in about 1 h.", over the bodies' middle, with a
 *  pop and a ring (the impact); it leaves before the next words come. */
function drawAnswer(ctx: CanvasRenderingContext2D, W: number, Lo: ReturnType<typeof layoutSplit>, a: NonNullable<CmpOverlay['answer']>, color: string, age: number, dur: number) {
  // (round 9: centred between the bodies, so its half-width is what clears the button column: "Bigger rise: Kebab / doner." ran under it)
  const { S } = Lo, maxW = 2 * (S.rightLow - W / 2) - 40;
  const k1 = fitWrap(ctx, a.a1, maxW, 1, 52, 34, (px) => `800 ${px}px ${SANS}`), k2 = fitWrap(ctx, a.a2, maxW, 2, 34, 26, (px) => `600 ${px}px ${SANS}`);
  ctx.font = `800 ${k1.px}px ${SANS}`; const w1 = ctx.measureText(k1.lines[0] ?? '').width;
  ctx.font = `600 ${k2.px}px ${SANS}`; const w2 = Math.max(...k2.lines.map((l) => ctx.measureText(l).width));
  const w = Math.min(2 * (S.rightLow - W / 2), Math.max(w1, w2) + 60), h = 30 + k1.px + 14 + k2.lines.length * k2.px * 1.2 + 18;
  const cx = W / 2, y = Lo.capTop - 130 - h, x = cx - w / 2;
  const a0 = Math.min(1, age / 0.12) * (1 - Math.max(0, (age - (dur - 0.3)) / 0.3)), sc = 1 + 0.18 * (1 - smooth(age / 0.35));
  drawShockwave(ctx, { x: cx, y: y + h / 2 }, age, lighten(color));
  ctx.save(); ctx.globalAlpha *= Math.max(0, a0);
  ctx.translate(cx, y + h / 2); ctx.scale(sc, sc); ctx.translate(-cx, -(y + h / 2));
  ctx.fillStyle = 'rgba(6,12,20,.86)'; roundRect(ctx, x, y, w, h, 24); ctx.fill();
  ctx.strokeStyle = lighten(color); ctx.lineWidth = 4; ctx.stroke();
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; ctx.font = `800 ${k1.px}px ${SANS}`;
  text(ctx, k1.lines[0] ?? '', cx, y + 22 + k1.px * 0.86);
  ctx.fillStyle = '#d5e0ec'; ctx.font = `600 ${k2.px}px ${SANS}`;
  k2.lines.forEach((ln, i) => text(ctx, ln, cx, y + 22 + k1.px + 14 + k2.px * 0.9 + i * k2.px * 1.2));
  ctx.textAlign = 'left'; ctx.restore();
}

/** Comparison end card: both days in two columns (the lights come on in turn, left and right), the verdict lands
 *  (verdictOf only: alcohol never "wins"; sparks only with its 🏆), and one line to comment on (VIDEO_COPY). */
function drawSplitOutro(ctx: CanvasRenderingContext2D, W: number, H: number, o: CmpOverlay, alpha: number, topBot: number, tt = 9, cues?: Plan['cues']) {
  if (alpha <= 0.001) return;
  const S = SAFE.reel, L = S.left, RL = S.rightLow;
  ctx.save(); ctx.globalAlpha = alpha;
  endDrift(ctx, W, H, tt);
  const y0 = topBot + 24;
  const g = ctx.createLinearGradient(0, y0 - 60, 0, y0 + 40);
  g.addColorStop(0, 'rgba(4,7,12,0)'); g.addColorStop(1, 'rgba(4,7,12,.88)');
  ctx.fillStyle = g; ctx.fillRect(0, y0 - 60, W, 100); ctx.fillStyle = 'rgba(4,7,12,.88)'; ctx.fillRect(0, y0 + 40, W, H - y0 - 40);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  let y = y0 + 40;
  ctx.fillStyle = ACCENT; ctx.font = `700 30px ${SANS}`; text(ctx, 'AFTER 24 HOURS', L, y);
  y += 20;
  // round 5 (critic: "two cards of ~10 px text"): bigger words (≥ 26 px), and only the lights that were not green
  // (all green = one line)
  const shown = (s: CmpSide) => { const w = s.summary.worst.filter((l) => l.level > 0).slice(0, 3); return w.length ? w : null; };
  const rowsMax = Math.max(1, ...[o.a, o.b].map((s) => shown(s)?.length ?? 1)), RH = 64;
  const gap = 16, cw = (RL - L - gap) / 2, ch = 150 + rowsMax * RH + 8;
  [o.a, o.b].forEach((s, k) => {
    const x = L + k * (cw + gap);
    ctx.fillStyle = 'rgba(16,28,44,.94)'; roundRect(ctx, x, y, cw, ch, 22); ctx.fill();
    ctx.strokeStyle = lighten(s.color); ctx.lineWidth = 3; ctx.stroke();
    const nm = fitWrap(ctx, s.name, cw - 40, 1, 44, 26, (px) => `400 ${px}px ${SERIF}`);
    ctx.fillStyle = '#ffffff'; ctx.font = `400 ${nm.px}px ${SERIF}`; text(ctx, fit(ctx, nm.lines[0] ?? s.name, cw - 40), x + 20, y + 54);
    ctx.fillStyle = '#e6edf5'; ctx.font = `700 30px ${SANS}`;
    text(ctx, fit(ctx, `${Math.round(s.summary.kcal)} kcal`, cw - 40), x + 20, y + 98);
    const sg = fitWrap(ctx, `Blood sugar: ${s.summary.sugarPeak}`, cw - 40, 1, 26, 22, (px) => `600 ${px}px ${SANS}`);
    ctx.font = `600 ${sg.px}px ${SANS}`; ctx.fillStyle = '#b8c7d8';
    text(ctx, fit(ctx, sg.lines[0] ?? '', cw - 40), x + 20, y + 134);
    const rows = shown(s) ?? [{ icon: '✓', label: 'All lights green', level: 0 as const, note: 'Nothing flagged all day' }];
    rows.forEach((l, j) => {
      const k2 = 1; // (round 11: the lights and the verdict landed in the 24 h beat)
      if (k2 <= 0.01) return;
      const ry = y + 152 + j * RH;
      ctx.save(); ctx.globalAlpha *= k2;
      ctx.fillStyle = LIGHT[l.level]; ctx.beginPath(); ctx.arc(x + 34, ry + 20, 13 * (1 + 0.2 * Math.sin(Math.PI * k2)), 0, Math.PI * 2); ctx.fill();
      const lb = fitWrap(ctx, l.label, cw - 80, 1, 28, 22, (px) => `700 ${px}px ${SANS}`), nt = fitWrap(ctx, l.note, cw - 80, 1, 26, 20, (px) => `600 ${px}px ${SANS}`);
      ctx.fillStyle = '#e6edf5'; ctx.font = `700 ${lb.px}px ${SANS}`; text(ctx, fit(ctx, l.label, cw - 80), x + 58, ry + 18);
      ctx.fillStyle = LIGHT[l.level]; ctx.font = `600 ${nt.px}px ${SANS}`; text(ctx, fit(ctx, l.note, cw - 80), x + 58, ry + 48);
      ctx.restore();
    });
  });
  y += ch + 16;
  // the guess's answer first ("Did you guess right?" is about this), the overall verdict on its own line below
  if (o.answer) {
    const r = fitWrap(ctx, `✓ ${o.answer.recap}`, RL - L - 20, 2, 34, 26, (px) => `700 ${px}px ${SANS}`);
    ctx.fillStyle = '#ffe2a0'; ctx.font = `700 ${r.px}px ${SANS}`;
    r.lines.forEach((ln, i) => text(ctx, ln, L + 4, y + r.px * 0.9 + i * r.px * 1.18));
    y += r.px * 0.9 + (r.lines.length - 1) * r.px * 1.18 + 22;
  }
  if (o.verdict) {
    const vd = since(cues, 'verdict', 1e9).cue, age = vd ? tt - (vd.t - (cues?.find((c) => c.kind === 'outro')?.t ?? 0)) : 1;
    const v = fitWrap(ctx, o.verdict, RL - L - 44, 3, 34, 24, (px) => `700 ${px}px ${SANS}`);
    const bh = 24 + v.lines.length * v.px * 1.22, cx = L + (RL - L) / 2, cy = y + bh / 2;
    if (age >= 0) {
      const sc = 1 + 0.25 * (1 - smooth(age / 0.3));
      if (/^🏆/.test(o.verdict)) drawSparks(ctx, cx, cy, age);
      drawShockwave(ctx, { x: cx, y: cy }, age, ACCENT);
      ctx.save(); ctx.globalAlpha *= smooth(age / 0.15);
      ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
      ctx.fillStyle = 'rgba(92,211,255,.12)'; roundRect(ctx, L, y, RL - L, bh, 20); ctx.fill();
      ctx.strokeStyle = 'rgba(92,211,255,.6)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.font = `700 ${v.px}px ${SANS}`;
      v.lines.forEach((ln, i) => text(ctx, ln, L + 22, y + 12 + v.px * 0.92 + i * v.px * 1.22));
      ctx.restore();
    }
    y += bh + 16; // its place is kept before it lands, so nothing below moves
  }
  const cta = fitWrap(ctx, o.answer ? VIDEO_COPY.ctaCompare : VIDEO_COPY.ctaComparePick, RL - L, 1, 42, 30, (px) => `700 ${px}px ${SANS}`);
  ctx.fillStyle = '#ffffff'; ctx.font = `700 ${cta.px}px ${SANS}`;
  const cy = Math.min(y + cta.px * 0.9, S.bottom - 46);
  text(ctx, cta.lines[0] ?? '', L, cy);
  ctx.fillStyle = ACCENT; ctx.font = `600 26px ${SANS}`;
  text(ctx, fit(ctx, VIDEO_COPY.loop(false, true), RL - L), L, Math.min(cy + 42, S.bottom - 4)); // (round 11: the loop)
  ctx.restore(); ctx.textAlign = 'left';
}

/** Round 11: the comparison's 24 h payoff beat: "AFTER 24 HOURS" and the verdict (verdictOf), centred where the
 *  captions were, landing with the verdict impact; it stays on the end card below, so it is read for 4 s or more. */
function drawCelebSplit(ctx: CanvasRenderingContext2D, W: number, o: CmpOverlay, fr: VFrame, cues: Plan['cues'] | undefined, Lo: ReturnType<typeof layoutSplit>) {
  if (!o.verdict) return;
  const vd = since(cues, 'verdict', fr.t), a0 = smooth(((fr.celeb ?? 0) * 10 - 1.2) / 1.5);
  if (a0 <= 0.01) return;
  const { S, L } = Lo, w = 2 * (S.rightLow - W / 2) - 20, cx = W / 2;
  ctx.save(); ctx.globalAlpha = a0; shade(ctx, true); ctx.textAlign = 'center';
  ctx.fillStyle = ACCENT; ctx.font = `700 28px ${SANS}`; text(ctx, 'AFTER 24 HOURS', cx, Lo.capTop + 28);
  if (vd.age >= 0) {
    const v = fitWrap(ctx, o.verdict, w, 2, 36, 26, (px) => `700 ${px}px ${SANS}`), sc = 1 + 0.2 * (1 - smooth(vd.age / 0.3)), cy = Lo.capTop + 40 + v.lines.length * v.px * 0.6;
    ctx.globalAlpha *= smooth(vd.age / 0.15); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
    ctx.fillStyle = '#ffffff'; ctx.font = `700 ${v.px}px ${SANS}`;
    v.lines.forEach((ln, i) => text(ctx, ln, cx, Lo.capTop + 36 + v.px * 0.95 + i * v.px * 1.18));
  }
  void L; shade(ctx, false); ctx.restore(); ctx.textAlign = 'left';
}
