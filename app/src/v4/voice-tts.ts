// 2026-11-05: the in-browser voiceover. Kokoro-82M (Apache-2.0) through kokoro-js (transformers.js / ONNX Runtime
// Web): no server, no API key, nothing about the user is sent anywhere (only the script's generic lines are spoken,
// on this device). The engine and the model are fetched only when a video is made with the voiceover on, never
// bundled (the single-file and the site builds stay as they were), and cached by the browser (HTTP cache for the
// script, transformers.js' Cache Storage for the model): later videos start at once.
// Every failure (offline, no WebAssembly, a slow phone, a timeout) returns null: the video is made exactly as before,
// without the voice.
import { OVERRUN_S, placeClips, ttsText, type NarrLine } from './video-narration';
import { SAMPLE_RATE } from './video-audio';
import { pausesOf, type CapLine } from './video-captions';
import { perfAdd } from './video-perf';

/** Exact versions (pinned): the engine's browser build and the model repo on the Hugging Face hub. */
export const KOKORO_JS = 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js';
export const KOKORO_MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
/** One voice for every video: American English, warm and bright (Kokoro's best-rated). */
export const VOICE_ID = 'af_heart';
/** v20: a touch slower than the engine's default (af_heart runs ~3 words/s): clearer, and the story fills the video. */
export const VOICE_SPEED = 0.92;
/** 8-bit weights: 92 MB, the same file for WebGPU and WebAssembly. */
export const VOICE_DTYPE = 'q8';
export const VOICE_DOWNLOAD_NOTE = 'Downloads a voice model once (~90 MB, from Hugging Face). The voice is made on your device.'; // (phase 4c, audit C10: say where it comes from; VoicePick.tsx shows the same words)
const LOAD_TIMEOUT_MS = 240_000, LINE_TIMEOUT_MS = 45_000;
const READY_KEY = 'i24-voice-ready';

export interface VoiceTrack { /** mono, SAMPLE_RATE, the video's length, already processed (EQ + compression) */ data: Float32Array;
  /** where the voice speaks (s), for the music's ducking */ spans: [number, number][]; device: string; said: string[];
  /** v19: the spoken lines as placed (for the word-by-word captions) and each clip's own pauses (s from its start) */
  lines: CapLine[]; pauses: number[][] }
export type VoiceProgress = (frac: number, stage: 'load' | 'speak') => void;

type Raw = { audio: Float32Array; sampling_rate: number };
type Tts = { generate: (text: string, o: { voice: string; speed?: number }) => Promise<Raw> };
let engine: Promise<{ tts: Tts; device: string }> | null = null;

export const voiceCached = () => { try { return localStorage.getItem(READY_KEY) === '1'; } catch { return false; } };

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> => new Promise((res, rej) => {
  const id = setTimeout(() => rej(new Error('timeout')), ms);
  p.then((v) => { clearTimeout(id); res(v); }, (e) => { clearTimeout(id); rej(e); });
});
const rms = (a: Float32Array) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * a[i]; return Math.sqrt(s / Math.max(1, a.length)); };
const sane = (r: Raw | null | undefined) => !!r && r.audio.length > 0.15 * r.sampling_rate && r.audio.length < 6 * r.sampling_rate && Number.isFinite(rms(r.audio)) && rms(r.audio) > 0.003;

let onLoadNow: ((f: number) => void) | null = null; // (the latest caller hears the download progress)

// Phase 2A: the engine runs in a Web Worker, so speaking (~1-5 s of WebAssembly per line) never freezes the page:
// the preview stays responsive while the voice is made, and the progress badge keeps moving. The same engine, model,
// voice and settings as on the page (WebAssembly, deterministic), only on another thread. If a worker can't be made
// or can't load the engine (old browser, a strict policy), the page runs it itself, as before.
const WORKER_SRC = `let tts = null;
self.onmessage = async ({ data: m }) => {
  try {
    if (m.type === 'open') {
      const { KokoroTTS } = await import(m.url);
      tts = await KokoroTTS.from_pretrained(m.model, { dtype: m.dtype, device: m.device,
        progress_callback: (e) => { if (e && e.status === 'progress') self.postMessage({ progress: { status: 'progress', file: e.file, loaded: e.loaded, total: e.total } }); } });
      self.postMessage({ id: m.id, ok: true });
    } else if (m.type === 'gen') {
      const r = await tts.generate(m.text, { voice: m.voice, speed: m.speed });
      const audio = new Float32Array(r.audio);
      self.postMessage({ id: m.id, ok: true, audio, sampling_rate: r.sampling_rate }, [audio.buffer]);
    }
  } catch (err) { self.postMessage({ id: m.id, ok: false, error: String((err && err.message) || err) }); }
};`;
type Progress = { status?: string; file?: string; loaded?: number; total?: number };
async function workerEngine(progress: (e: Progress) => void): Promise<Tts> {
  if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) throw new Error('no worker');
  const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
  const w = new Worker(url, { type: 'module' });
  const calls = new Map<number, { res: (m: { audio?: Float32Array; sampling_rate?: number }) => void; rej: (e: Error) => void }>();
  let next = 0;
  w.onmessage = (e: MessageEvent) => {
    const m = e.data;
    if (m.progress) { progress(m.progress); return; }
    const c = calls.get(m.id); if (!c) return;
    calls.delete(m.id);
    if (m.ok) c.res(m); else c.rej(new Error(m.error));
  };
  const fail = () => { for (const c of calls.values()) c.rej(new Error('worker failed')); calls.clear(); };
  w.onerror = fail; w.onmessageerror = fail;
  const call = (msg: object) => new Promise<{ audio?: Float32Array; sampling_rate?: number }>((res, rej) => { const id = ++next; calls.set(id, { res, rej }); w.postMessage({ ...msg, id }); });
  try {
    await call({ type: 'open', url: KOKORO_JS, model: KOKORO_MODEL, dtype: VOICE_DTYPE, device: 'wasm' });
  } catch (e) { w.terminate(); URL.revokeObjectURL(url); throw e; }
  return { generate: async (text, o) => { const m = await call({ type: 'gen', text, voice: o.voice, speed: o.speed }); return { audio: m.audio!, sampling_rate: m.sampling_rate! }; } };
}

function loadEngine(onLoad: (f: number) => void) {
  onLoadNow = onLoad;
  if (engine) return engine;
  engine = (async () => {
    const files = new Map<string, [number, number]>();
    const progress_callback = (e: Progress) => {
      if (e.status === 'progress' && e.file && e.total) { files.set(e.file, [e.loaded ?? 0, e.total]); let l = 0, t = 0; for (const [a, b] of files.values()) { l += a; t += b; } onLoadNow?.(t ? l / t : 0); }
    };
    if (!/[#&]voice=page/.test(typeof location === 'undefined' ? '' : location.hash)) { // (#voice=page: the old way, to compare)
      try { const tts = await workerEngine(progress_callback); if (sane(await tts.generate('Okay.', { voice: VOICE_ID }))) return { tts, device: 'wasm-worker' }; } catch { /* the page runs it */ }
    }
    const mod = await import(/* @vite-ignore */ KOKORO_JS) as { KokoroTTS: { from_pretrained: (id: string, o: object) => Promise<Tts> } };
    const open = (device: 'webgpu' | 'wasm') => KokoroTTS.from_pretrained(KOKORO_MODEL, { dtype: VOICE_DTYPE, device, progress_callback });
    const { KokoroTTS } = mod;
    // WebAssembly first (QA 2026-11-05: with these 8-bit weights it is deterministic and was as fast as WebGPU, whose
    // output drifted from it, envelope r ≈ 0.5); WebGPU (the same cached file) when WebAssembly cannot run it
    try { const tts = await open('wasm'); if (sane(await tts.generate('Okay.', { voice: VOICE_ID }))) return { tts, device: 'wasm' }; } catch { /* fall back */ }
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) throw new Error('no speech engine');
    const tts = await open('webgpu');
    return { tts, device: 'webgpu' };
  })();
  engine.catch(() => { engine = null; }); // a failed load is tried again next time
  return engine;
}

/** Phase 2A: each spoken line is kept for this visit (text + speed → clip), and every request goes through one queue
 *  (the engine runs one line at a time): the voice can be made while the person looks at the preview, the render
 *  then takes the same clips, and "Try another opening" says only the new line. Memory only, never stored. */
const said = new Map<string, Promise<Raw>>();
let queue: Promise<unknown> = Promise.resolve();
const SAID_MAX = 80;
function speak(tts: Tts, text: string, speed: number): Promise<Raw> {
  const key = speed.toFixed(3) + "|" + text;
  const hit = said.get(key);
  if (hit) return hit;
  const p = queue.then(() => withTimeout(tts.generate(text, { voice: VOICE_ID, speed }), LINE_TIMEOUT_MS));
  queue = p.catch(() => undefined);
  said.set(key, p);
  p.catch(() => { said.delete(key); }); // a failed line is tried again next time
  if (said.size > SAID_MAX) said.delete(said.keys().next().value as string);
  return p;
}
/** Starts the engine (and the model download, the first time) ahead of the render; failures are ignored here. */
export function warmVoice(onLoad?: (f: number) => void): void { void loadEngine((f) => onLoad?.(f)).catch(() => undefined); }

/** Leading and trailing silence off (the engine leaves ~0.1-0.3 s), 30 ms kept. */
function trim(r: Raw): Raw {
  const a = r.audio, th = 0.01, pad = Math.round(0.03 * r.sampling_rate);
  let i = 0, j = a.length - 1;
  while (i < a.length && Math.abs(a[i]) < th) i++;
  while (j > i && Math.abs(a[j]) < th) j--;
  return { audio: a.slice(Math.max(0, i - pad), Math.min(a.length, j + pad)), sampling_rate: r.sampling_rate };
}

/** Speaks the script and lays it on the video's timeline (null: no voice, the video is made as before). */
export async function makeVoice(lines: NarrLine[], seconds: number, onProgress?: VoiceProgress): Promise<VoiceTrack | null> {
  if (!lines.length || typeof OfflineAudioContext === 'undefined') return null;
  try {
    const tl = performance.now();
    const { tts, device } = await withTimeout(loadEngine((f) => onProgress?.(f, 'load')), LOAD_TIMEOUT_MS);
    const ts = performance.now(); perfAdd('voiceLoad', ts - tl);
    try { localStorage.setItem(READY_KEY, '1'); } catch { /* private mode */ }
    const clips: (Raw | null)[] = [];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      onProgress?.(i / lines.length, 'speak');
      let r: Raw | null = null;
      try {
        r = trim(await speak(tts, ttsText(l.say), VOICE_SPEED));
        const d = r.audio.length / r.sampling_rate;
        // a little long for its slot: said a little faster (at most 1.2×), else left out by placeClips
        if (d > l.slotS + OVERRUN_S) r = trim(await speak(tts, ttsText(l.say), Math.min(1.2, (VOICE_SPEED * d) / l.slotS)));
      } catch { r = null; }
      clips.push(r && sane(r) ? r : null);
    }
    onProgress?.(1, 'speak');
    perfAdd('voiceSpeak', performance.now() - ts);
    const placed = placeClips(lines, clips.map((c) => (c ? c.audio.length / c.sampling_rate : null)), seconds);
    if (!placed.length) return null;
    // the voice bus: high-pass (no rumble on phone speakers), a little presence, light compression
    const sr = SAMPLE_RATE, len = Math.ceil(seconds * sr);
    const ctx = new OfflineAudioContext(1, len, sr);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 110; hp.Q.value = 0.7;
    const mud = ctx.createBiquadFilter(); mud.type = 'peaking'; mud.frequency.value = 300; mud.Q.value = 1; mud.gain.value = -2;
    const pres = ctx.createBiquadFilter(); pres.type = 'peaking'; pres.frequency.value = 3200; pres.Q.value = 0.9; pres.gain.value = 3;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -22; comp.knee.value = 6; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.12;
    hp.connect(mud); mud.connect(pres); pres.connect(comp); comp.connect(ctx.destination);
    const spans: [number, number][] = [], capLines: CapLine[] = [], pauses: number[][] = [];
    for (const p of placed) {
      const c = clips[lines.indexOf(p.line)]!;
      const b = ctx.createBuffer(1, c.audio.length, c.sampling_rate); b.getChannelData(0).set(c.audio);
      const s = ctx.createBufferSource(); s.buffer = b; s.connect(hp); s.start(p.t);
      spans.push([p.t, p.t + p.dur]);
      capLines.push({ text: p.line.text, t: p.t, dur: p.dur, ...(p.line.card ? { card: p.line.card, side: p.line.side } : {}) }); pauses.push(pausesOf(c.audio, c.sampling_rate));
    }
    const out = await ctx.startRendering();
    return { data: out.getChannelData(0).slice(), spans, device, said: placed.map((p) => p.line.text), lines: capLines, pauses };
  } catch {
    return null;
  }
}
