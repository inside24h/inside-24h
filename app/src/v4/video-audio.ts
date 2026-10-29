// Our own soundtrack for the shared video, made in the browser (no samples, no licences, nothing downloaded):
// a calm pad, a soft beat that starts when the hook ends, a whoosh on every glide to the next moment, a small tick
// when the time stamp lands, and a resolving chord under the end card. It follows the video plan exactly, so every
// sound sits on its frame. Rendered offline (faster than real time) and encoded to AAC inside the MP4.
// Platforms favour videos with sound, and people who prefer a trending track can lower ours in the app's editor.
import type { Cue } from './video-plan';

export const SAMPLE_RATE = 48000;
export const AAC: AudioEncoderConfig = { codec: 'mp4a.40.2', sampleRate: SAMPLE_RATE, numberOfChannels: 2, bitrate: 160_000 };

/** AAC config this browser can encode, or null (then the video is made without a sound track). */
export async function aacConfig(): Promise<AudioEncoderConfig | null> {
  try {
    if (typeof AudioEncoder === 'undefined' || typeof AudioData === 'undefined' || typeof OfflineAudioContext === 'undefined') return null;
    return (await AudioEncoder.isConfigSupported(AAC)).supported ? AAC : null;
  } catch { return null; }
}

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
// A minor, curious and calm: Am9 → Fmaj7 → Cadd9 → G6, two bars each
const CHORDS = [[45, 52, 55, 59, 60], [41, 48, 52, 57, 64], [48, 55, 62, 64, 67], [43, 50, 59, 62, 64]];
const TARGET_RMS = 0.13; // ≈ -17.7 dBFS RMS ≈ -16 LUFS for this mix
const BPM = 100, BEAT = 60 / BPM, BAR = 4 * BEAT, CHORD_S = 2 * BAR;

/** Seeded noise, so the same video always gets the same sound. */
function noiseBuffer(ctx: BaseAudioContext, seconds: number, seed = 7): AudioBuffer {
  const b = ctx.createBuffer(1, Math.ceil(seconds * ctx.sampleRate), ctx.sampleRate);
  const d = b.getChannelData(0);
  let s = seed >>> 0;
  for (let i = 0; i < d.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = (s / 4294967296) * 2 - 1; }
  return b;
}

/** Renders the soundtrack for a video of `seconds` with these cues. `musicEnd` = when the beat stops (end card). */
export async function renderSoundtrack(seconds: number, cues: Cue[], beatFrom: number): Promise<AudioBuffer> {
  const sr = SAMPLE_RATE, len = Math.ceil(seconds * sr);
  const ctx = new OfflineAudioContext(2, len, sr);
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
  const master = ctx.createGain(); master.gain.value = 1;
  master.connect(comp); comp.connect(ctx.destination);
  const noise = noiseBuffer(ctx, 2);
  const outro = cues.find((c) => c.kind === 'outro')?.t ?? seconds - 6;

  // --- pad: detuned saws through a soft low-pass, one chord every two bars, the first chord again under the end card
  const padBus = ctx.createBiquadFilter(); padBus.type = 'lowpass'; padBus.frequency.value = 1100; padBus.Q.value = 0.5;
  const padGain = ctx.createGain(); padGain.gain.value = 0.05; padBus.connect(padGain); padGain.connect(master);
  const chordAt = (t: number) => (t >= outro ? 0 : Math.floor(t / CHORD_S) % CHORDS.length);
  const segs: { from: number; to: number; c: number }[] = [];
  for (let t = 0; t < seconds;) {
    const c = chordAt(t), next = t >= outro ? seconds : Math.min(outro, (Math.floor(t / CHORD_S) + 1) * CHORD_S);
    segs.push({ from: t, to: next, c }); t = next;
  }
  for (const sg of segs) {
    CHORDS[sg.c].forEach((n, i) => {
      for (const det of [-7, 6]) {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = det;
        const g = ctx.createGain(); const a = sg.from === 0 ? 0.03 : 0.5, r = 0.9, top = i === 0 ? 1.2 : 0.8;
        g.gain.setValueAtTime(0, sg.from); g.gain.linearRampToValueAtTime(top, sg.from + a);
        g.gain.setValueAtTime(top, Math.max(sg.from + a, sg.to - 0.05));
        g.gain.linearRampToValueAtTime(0, Math.min(seconds, sg.to + r));
        const p = ctx.createStereoPanner(); p.pan.value = det < 0 ? -0.35 : 0.35;
        o.connect(g); g.connect(p); p.connect(padBus); o.start(sg.from); o.stop(Math.min(seconds, sg.to + r));
      }
    });
  }
  // a soft swell on the very first frame, so the video never opens silent
  {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(110, 0); o.frequency.exponentialRampToValueAtTime(55, 1.2);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, 0); g.gain.exponentialRampToValueAtTime(0.35, 0.03); g.gain.exponentialRampToValueAtTime(0.0001, 1.6);
    o.connect(g); g.connect(master); o.start(0); o.stop(1.7);
  }

  // --- beat: soft kick on beats 1 and 3, quiet hats on off-beats, a plucked bass and a light arpeggio
  const beatEnd = outro;
  const kick = (t: number, v: number) => {
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.35);
  };
  const hat = (t: number, v: number) => {
    const s = ctx.createBufferSource(); s.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500;
    const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, (t * 7.3) % 1.5, 0.06);
  };
  const pluck = (t: number, freq: number, v: number, type: OscillatorType, dur: number, pan = 0) => {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2600;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    o.connect(f); f.connect(g); g.connect(p); p.connect(master); o.start(t); o.stop(t + dur + 0.02);
  };
  const first = Math.ceil(beatFrom / BEAT) * BEAT;
  for (let t = first, k = Math.round(first / BEAT); t < beatEnd - 0.05; t += BEAT, k++) {
    const inBar = k % 4, ch = CHORDS[chordAt(t)];
    if (inBar === 0 || inBar === 2) kick(t, inBar === 0 ? 0.42 : 0.3);
    hat(t + BEAT / 2, 0.05);
    if (inBar === 0 || inBar === 2) pluck(t, midi(ch[0]), 0.16, 'triangle', 0.45);
    // arpeggio: chord tones two octaves up, eighth notes, alternating left / right
    for (let e = 0; e < 2; e++) {
      const tt = t + e * BEAT / 2; if (tt >= beatEnd) break;
      const note = ch[1 + ((k * 2 + e) % (ch.length - 1))] + 24;
      pluck(tt, midi(note), 0.028, 'triangle', 0.28, e ? 0.4 : -0.4);
    }
  }

  // --- moments: a whoosh on each glide, a tick when the stamp lands, a softer tick on a new caption
  for (const c of cues) {
    if (c.kind === 'move') {
      const s = ctx.createBufferSource(); s.buffer = noise;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
      f.frequency.setValueAtTime(350, c.t); f.frequency.exponentialRampToValueAtTime(2800, c.t + 0.75);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, c.t); g.gain.exponentialRampToValueAtTime(0.16, c.t + 0.55); g.gain.exponentialRampToValueAtTime(0.0001, c.t + 0.95);
      s.connect(f); f.connect(g); g.connect(master); s.start(c.t, 0.2, 1.0);
    } else if (c.kind === 'stop' && c.t > 0.5) {
      pluck(c.t, 1318.5, 0.07, 'sine', 0.22); pluck(c.t + 0.004, 1975.5, 0.035, 'sine', 0.16);
    } else if (c.kind === 'page') {
      pluck(c.t, 987.8, 0.035, 'sine', 0.16);
    } else if (c.kind === 'outro') {
      [69, 72, 76, 81].forEach((n, i) => pluck(c.t + i * 0.12, midi(n), 0.05, 'sine', 1.6, (i - 1.5) * 0.25));
    }
  }

  const buf = await ctx.startRendering();
  // level: about -16 LUFS (social apps play at about -14; ours sits a little under so a voice or a trending sound
  // added in the app stays on top), drum hits softly limited under -1 dBFS, and a short fade at the very end so the
  // loop back to the start is smooth
  let sum = 0, n = 0;
  for (let ch = 0; ch < buf.numberOfChannels; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) { sum += d[i] * d[i]; n++; } }
  const rms = Math.sqrt(sum / Math.max(1, n)) || 1e-6, gain = TARGET_RMS / rms, fade = Math.round(0.3 * sr), ceil = 0.89;
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < d.length; i++) d[i] = ceil * Math.tanh((d[i] * gain) / ceil) * (i > d.length - fade ? (d.length - i) / fade : 1);
  }
  return buf;
}

/** Encodes the soundtrack to AAC chunks for the muxer. */
export async function encodeSoundtrack(buf: AudioBuffer, config: AudioEncoderConfig,
  onChunk: (c: EncodedAudioChunk, m?: EncodedAudioChunkMetadata) => void): Promise<void> {
  let failed: Error | null = null;
  const enc = new AudioEncoder({ output: onChunk, error: (e) => { failed = e as Error; } });
  enc.configure(config);
  const n = buf.length, step = 4800, L = buf.getChannelData(0), R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
  for (let off = 0; off < n; off += step) {
    const k = Math.min(step, n - off), data = new Float32Array(k * 2);
    data.set(L.subarray(off, off + k), 0); data.set(R.subarray(off, off + k), k);
    const ad = new AudioData({ format: 'f32-planar', sampleRate: buf.sampleRate, numberOfFrames: k, numberOfChannels: 2, timestamp: Math.round((off / buf.sampleRate) * 1e6), data });
    enc.encode(ad); ad.close();
    if (failed) throw failed;
  }
  await enc.flush(); enc.close();
  if (failed) throw failed;
}

/** For screen recording (no WebCodecs): plays the rendered soundtrack into a MediaStream track. */
export function playSoundtrack(buf: AudioBuffer): { track: MediaStreamTrack; start: () => void; stop: () => void } | null {
  try {
    const ctx = new AudioContext({ sampleRate: buf.sampleRate });
    const dest = ctx.createMediaStreamDestination();
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(dest);
    return { track: dest.stream.getAudioTracks()[0], start: () => { void ctx.resume(); src.start(); }, stop: () => { try { src.stop(); } catch { /* not started */ } void ctx.close(); } };
  } catch { return null; }
}

// =====================================================================================================================
// SOUND v2 (2026-10-24 creative spec §5): music on one bus, sound effects on another, both placed from the same cue
// list as the pictures (video-plan.ts), so every sound lands on its frame. 120 BPM, the groove starts with the first
// sip, half time at night (and the music goes "under water"), a one-bar drop at the peak. The music ducks under the
// impacts. Loudness about −14 LUFS, true peak under −1 dBTP (lookahead limiter). All sounds are made here (oscillators
// and seeded noise): no samples, no licences. `music: false` = "Sound effects only" (the owner adds a trending song).
// =====================================================================================================================
export type SoundMode = 'music' | 'sfx';
export interface SoundOpts { music: boolean; fizzy?: boolean; solid?: boolean; /** round 11 (research R5): the food's variety seed (video-story seedOf) */ seed?: number }
/** Round 11 (research R5, YouTube "repetitive content"): each food gets its own motif, deterministically: the key
 *  (A minor, G minor, C minor, D minor, E minor), where the progression starts, and the whoosh's colour. */
export const MOTIF_KEYS = [0, -2, 3, 5, -5] as const;
export function motifOf(seed = 0): { tr: number; rot: number; whoosh: number } {
  const s = Math.abs(Math.floor(seed));
  return { tr: MOTIF_KEYS[s % MOTIF_KEYS.length], rot: Math.floor(s / 5) % CHORDS.length, whoosh: [1, 0.8, 1.25][Math.floor(s / 20) % 3] };
}
const BPM2 = 120, BEAT2 = 60 / BPM2, BAR2 = 4 * BEAT2, CHORD2_S = 2 * BAR2;
/** RMS of the full mix that measures about −14 LUFS for this material (calibrated with ffmpeg ebur128, QA 2026-10-24). */
export const TARGET_RMS2 = 0.17;
/** Sample ceiling of the limiter: ≈ −1.9 dBFS, so the AAC true peak stays under −1 dBTP (round 5: denser impacts). */
export const CEIL2 = 0.76;

/** Lookahead limiter (5 ms): the gain is lowered just BEFORE a loud hit instead of clipping it, then recovers. */
export function limit(chs: Float32Array[], ceil: number, sr: number) {
  const n = chs[0].length, blk = Math.max(1, Math.round(sr * 0.0025)), nb = Math.ceil(n / blk);
  const peak = new Float32Array(nb);
  for (let b = 0; b < nb; b++) { let m = 0; for (const d of chs) for (let i = b * blk, e = Math.min(n, i + blk); i < e; i++) { const a = Math.abs(d[i]); if (a > m) m = a; } peak[b] = m; }
  const want = new Float32Array(nb);
  for (let b = 0; b < nb; b++) { const m = Math.max(peak[b], peak[Math.min(nb - 1, b + 1)], peak[Math.min(nb - 1, b + 2)]); want[b] = m > ceil ? ceil / m : 1; }
  // release: the gain may rise again only slowly (≈ 120 ms), falls at once (the lookahead already gave it time)
  const g = new Float32Array(nb); let cur = 1; const rel = 1 - Math.exp(-blk / (sr * 0.12));
  for (let b = 0; b < nb; b++) { cur = want[b] < cur ? want[b] : cur + (want[b] - cur) * rel; g[b] = cur; }
  for (const d of chs) for (let i = 0; i < n; i++) {
    const b = Math.floor(i / blk), f = (i % blk) / blk, gi = g[b] + (g[Math.min(nb - 1, b + 1)] - g[b]) * f;
    d[i] = Math.max(-ceil, Math.min(ceil, d[i] * gi));
  }
}

export const LUFS_TARGET = -14;
/** Integrated loudness (ITU-R BS.1770-4: K-weighting, 400 ms blocks with 75 % overlap, −70 LUFS absolute and −10 LU
 *  relative gates) of a stereo signal, in LUFS. The K-weighting coefficients are the standard's for 48 kHz. */
export function lufs(L: Float32Array, R: Float32Array, sr = SAMPLE_RATE): number {
  const kw = (x: Float32Array) => {
    const y = new Float64Array(x.length);
    const b1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], a1 = [-1.69065929318241, 0.73248077421585];
    const b2 = [1, -2, 1], a2 = [-1.99004745483398, 0.99007225036621];
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0, z1 = 0, z2 = 0, w1 = 0, w2 = 0;
    for (let i = 0; i < x.length; i++) {
      const s = b1[0] * x[i] + b1[1] * x1 + b1[2] * x2 - a1[0] * y1 - a1[1] * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = s;
      const v = b2[0] * s + b2[1] * z1 + b2[2] * z2 - a2[0] * w1 - a2[1] * w2; z2 = z1; z1 = s; w2 = w1; w1 = v; y[i] = v;
    }
    return y;
  };
  const kl = kw(L), kr = kw(R), blk = Math.round(0.4 * sr), hop = Math.round(0.1 * sr), ms: number[] = [];
  for (let s = 0; s + blk <= kl.length; s += hop) { let e = 0; for (let i = s; i < s + blk; i++) e += kl[i] * kl[i] + kr[i] * kr[i]; ms.push(e / blk); }
  const lk = (m: number) => -0.691 + 10 * Math.log10(Math.max(1e-12, m));
  const abs = ms.filter((m) => lk(m) > -70);
  if (!abs.length) return -Infinity;
  const rel = lk(abs.reduce((a, b) => a + b, 0) / abs.length) - 10, gated = abs.filter((m) => lk(m) > rel);
  return lk(gated.reduce((a, b) => a + b, 0) / Math.max(1, gated.length));
}

/** The music's level over the video (round 5), as [time, gain] points (linear between them), from the cue list:
 *  full under the cold open, quieter verses after the sip (−5 dB), fuller after the first impact (−2 dB), quieter at
 *  night and under the end card. Under a riser the music falls away, then 0.3 s of near silence, and the impact lands
 *  on the full groove for one bar. Pure (tested in video-plan.test.ts). */
export const HUSH_S = 0.3;
export function musicShape(cues: Cue[], seconds: number): [number, number][] {
  const at = (k: Cue['kind']) => cues.filter((c) => c.kind === k).map((c) => c.t);
  const sip = at('sip')[0] ?? 1, outro = at('outro')[0] ?? seconds - 6;
  const impacts = [...at('peak'), ...at('verdict')].sort((a, b) => a - b), risers = at('riser');
  const nights: [number, number][] = [];
  cues.filter((c) => c.kind === 'night').forEach((c) => { if (c.data?.v === 1) nights.push([c.t, outro]); else if (nights.length) nights[nights.length - 1][1] = c.t; });
  const level = (t: number) => {
    let v = t < sip + 1 ? 1 - 0.45 * Math.max(0, Math.min(1, (t - sip) / 1)) : impacts.some((p) => p < t) ? 0.8 : 0.55;
    if (nights.some(([a, b]) => t >= a && t < b)) v = Math.min(v, 0.5);
    if (t >= outro) v = 0.7;
    for (const p of impacts) {
      const r = risers.filter((x) => x < p && x > p - 3).pop() ?? p - 1.2;
      if (t >= r && t < p - HUSH_S) v *= 1 - 0.65 * ((t - r) / Math.max(0.1, p - HUSH_S - r)); // falls away under the riser
      else if (t >= p - HUSH_S && t < p) v = 0.03;                                               // the hush
      else if (t >= p && t < p + BAR2) v = 1;                                                    // the drop lands
      else if (t >= p + BAR2 && t < p + BAR2 + 1) v = 1 + (v - 1) * (t - p - BAR2);              // back to the verse
    }
    return v;
  };
  const pts: [number, number][] = [];
  for (let i = 0, n = Math.ceil(seconds * 100); i <= n; i++) {
    const t = i / 100, v = level(t);
    if (!pts.length || Math.abs(v - pts[pts.length - 1][1]) > 0.004 || i === n) pts.push([t, v]);
  }
  // exact edges around each hush (no 10 ms ramp into or out of the silence)
  for (const p of impacts) pts.push([p - HUSH_S + 0.012, 0.03], [p - 0.002, 0.03], [p + 0.004, 1]);
  return pts.sort((a, b) => a[0] - b[0]);
}

/** Renders the v2 soundtrack: picture and sound from one cue list. */
export async function renderSoundtrack2(seconds: number, cues: Cue[], o: SoundOpts): Promise<AudioBuffer> {
  const sr = SAMPLE_RATE, len = Math.ceil(seconds * sr);
  // 4 channels: music L/R and effects L/R, mixed after rendering (so "effects only" keeps the same levels)
  const ctx = new OfflineAudioContext(4, len, sr);
  const merger = ctx.createChannelMerger(4); merger.connect(ctx.destination);
  const toBus = (ch0: number) => { const sp = ctx.createChannelSplitter(2), g = ctx.createGain(); g.connect(sp); sp.connect(merger, 0, ch0); sp.connect(merger, 1, ch0 + 1); g.channelCount = 2; g.channelCountMode = 'explicit'; return g; };
  const musicOut = toBus(0), sfx = toBus(2);
  const duck = ctx.createGain(); duck.gain.value = 1;
  // round 5 (critic: "the sound is a wall", LRA 0.5–1.5 LU, impacts only +2 LU): the music has a shape of its own
  // (`dyn`, musicShape): quieter verses, a build that falls away under the riser, a short hush right before each
  // impact, then the full groove on the impact; quieter at night and under the end card
  const dyn = ctx.createGain(); dyn.gain.value = 1;
  const under = ctx.createBiquadFilter(); under.type = 'lowpass'; under.frequency.value = 18000; under.Q.value = 0.7;
  duck.connect(dyn); dyn.connect(under); under.connect(musicOut);
  const noise = noiseBuffer(ctx, 3, 7);
  const mo = motifOf(o.seed), CH = CHORDS.map((_c, i) => CHORDS[(i + mo.rot) % CHORDS.length].map((n) => n + mo.tr));
  const at = (k: Cue['kind']) => cues.filter((c) => c.kind === k);
  const outro = at('outro')[0]?.t ?? seconds - 6;
  const sip = at('sip')[0]?.t ?? 1;
  const peaks = at('peak').map((c) => c.t), verdicts = at('verdict').map((c) => c.t);
  const nights: [number, number][] = [];
  at('night').forEach((c) => { if (c.data?.v === 1) nights.push([c.t, outro]); else if (nights.length) nights[nights.length - 1][1] = c.t; });
  const inNight = (t: number) => nights.some(([a, b]) => t >= a && t < b);
  // ---- helpers
  const env = (g: GainNode, t: number, a: number, peak: number, d: number) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  const osc = (type: OscillatorType, f0: number, f1: number | null, t: number, dur: number, peak: number, out: AudioNode, pan = 0, a = 0.004) => {
    const o2 = ctx.createOscillator(); o2.type = type; o2.frequency.setValueAtTime(f0, t); if (f1) o2.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); env(g, t, a, peak, dur); const p = ctx.createStereoPanner(); p.pan.value = pan;
    o2.connect(g); g.connect(p); p.connect(out); o2.start(t); o2.stop(t + a + dur + 0.02);
  };
  const nz = (t: number, dur: number, peak: number, out: AudioNode, filt: { type: BiquadFilterType; f: number; f1?: number; q?: number }, pan = 0, a = 0.004, offset = 0) => {
    const s = ctx.createBufferSource(); s.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = filt.type; f.frequency.setValueAtTime(filt.f, t); if (filt.f1) f.frequency.exponentialRampToValueAtTime(filt.f1, t + dur); f.Q.value = filt.q ?? 0.7;
    const g = ctx.createGain(); env(g, t, a, peak, dur); const p = ctx.createStereoPanner(); p.pan.value = pan;
    s.connect(f); f.connect(g); g.connect(p); p.connect(out); s.start(t, (offset + t * 7.3) % 2.5, a + dur + 0.05);
  };
  // reverb tail for the impacts: a generated, seeded impulse response
  const ir = ctx.createBuffer(2, Math.round(sr * 1.2), sr);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let s = 99 + c >>> 0; for (let i = 0; i < d.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = ((s / 4294967296) * 2 - 1) * Math.exp(-i / (sr * 0.32)); } }
  const verb = ctx.createConvolver(); verb.buffer = ir; const verbG = ctx.createGain(); verbG.gain.value = 0.5; verb.connect(verbG); verbG.connect(sfx);
  // the impacts' own bus (round 5): a soft saturator, so the hit is dense (loud for the ear and the meter) without a
  // sharp peak the limiter would have to cut
  const imp = ctx.createWaveShaper(); imp.curve = Float32Array.from({ length: 1025 }, (_, i) => Math.tanh(2.6 * ((i / 512) - 1)) / Math.tanh(2.6)); imp.oversample = '2x';
  const impG = ctx.createGain(); impG.gain.value = 0.5; imp.connect(impG); impG.connect(sfx);

  // ---- MUSIC (always rendered: the loudness is measured on the full mix, also for "effects only")
  {
    const padBus = ctx.createBiquadFilter(); padBus.type = 'lowpass'; padBus.frequency.value = 1300; padBus.Q.value = 0.5;
    const padGain = ctx.createGain(); padGain.gain.value = 0.045; padBus.connect(padGain); padGain.connect(duck);
    const chordAt = (t: number) => (t >= outro ? 0 : Math.floor(t / CHORD2_S) % CHORDS.length);
    const CHORDS = CH; // (round 11: this food's motif)
    for (let t = 0; t < seconds;) {
      const c = chordAt(t), next = t >= outro ? seconds : Math.min(outro, (Math.floor(t / CHORD2_S) + 1) * CHORD2_S);
      CHORDS[c].forEach((n, i) => {
        for (const det of [-7, 6]) {
          const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = midi(n); o2.detune.value = det;
          const g = ctx.createGain(); const a = t === 0 ? 0.03 : 0.4, top = i === 0 ? 1.2 : 0.8, end2 = Math.min(seconds, next + 0.8);
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(top, t + a); g.gain.setValueAtTime(top, Math.max(t + a, next - 0.05)); g.gain.linearRampToValueAtTime(0, end2);
          const p = ctx.createStereoPanner(); p.pan.value = det < 0 ? -0.35 : 0.35;
          o2.connect(g); g.connect(p); p.connect(padBus); o2.start(t); o2.stop(end2);
        }
      });
      t = next;
    }
    // groove from the first sip: kick, off-beat hats, plucked bass, light arpeggio; half time at night; a drop at the peak
    const kick = (t: number, v: number) => { osc('sine', 140, 46, t, 0.3, v, duck, 0, 0.005); };
    const hat = (t: number, v: number) => nz(t, 0.045, v, duck, { type: 'highpass', f: 7500 });
    const pluck = (t: number, f: number, v: number, type: OscillatorType, d: number, pan = 0) => osc(type, f, null, t, d, v, duck, pan, 0.008);
    const drops = peaks.map((p) => [p, p + BAR2] as [number, number]);
    const first = Math.ceil(sip / BEAT2) * BEAT2;
    for (let t = first, k = Math.round(first / BEAT2); t < outro - 0.05; t += BEAT2, k++) {
      const inBar = k % 4, ch = CHORDS[chordAt(t)], night = inNight(t), drop = drops.some(([a, b]) => t >= a - 1e-6 && t < b);
      if (drop) { kick(t, 0.5); pluck(t, midi(ch[0] - 12), 0.2, 'triangle', 0.35); continue; }
      if (night) { if (inBar === 0) { kick(t, 0.3); pluck(t, midi(ch[0]), 0.12, 'triangle', 0.6); } continue; }
      if (inBar === 0 || inBar === 2) { kick(t, inBar === 0 ? 0.42 : 0.3); pluck(t, midi(ch[0]), 0.15, 'triangle', 0.4); }
      hat(t + BEAT2 / 2, 0.045);
      for (let e = 0; e < 2; e++) { const tt = t + (e * BEAT2) / 2; pluck(tt, midi(ch[1 + ((k * 2 + e) % (ch.length - 1))] + 24), 0.025, 'triangle', 0.22, e ? 0.4 : -0.4); }
    }
    // the resolving chord under the end card
    const tO = outro; [69, 72, 76, 81].forEach((n, i) => pluck(tO + i * 0.12, midi(n + mo.tr), 0.05, 'sine', 1.6, (i - 1.5) * 0.25));
    // ducking (a sidechain written from the cue list): −6 dB under each impact, −3 dB under the sip
    for (const t of [...peaks, ...verdicts]) { duck.gain.setValueAtTime(1, Math.max(0, t - 0.4)); duck.gain.linearRampToValueAtTime(0.5, t - 0.32); duck.gain.setValueAtTime(0.5, t); duck.gain.linearRampToValueAtTime(1, t + 0.45); }
    duck.gain.setValueAtTime(1, Math.max(0, sip - 0.05)); duck.gain.linearRampToValueAtTime(0.7, sip + 0.03); duck.gain.linearRampToValueAtTime(1, sip + 0.7);
    // the music's shape (see `dyn`), from the same cue list
    dyn.gain.setValueAtTime(1, 0);
    for (const [t, v] of musicShape(cues, seconds)) dyn.gain.linearRampToValueAtTime(v, t);
    // night: the music goes under water and comes back up at sunrise
    for (const [a, b] of nights) {
      under.frequency.setValueAtTime(18000, a); under.frequency.exponentialRampToValueAtTime(900, a + 0.8);
      under.frequency.setValueAtTime(900, Math.max(a + 0.8, b)); under.frequency.exponentialRampToValueAtTime(18000, Math.max(a + 0.8, b) + 0.8);
    }
  }

  // ---- SOUND EFFECTS (A1–A19, without the heartbeat, which the model never asks for here)
  // A1 hit on the very first frame (the cold open)
  osc('sine', 55, 40, 0, 0.5, 0.45, sfx, 0, 0.004); nz(0, 0.06, 0.25, sfx, { type: 'lowpass', f: 1200 });
  for (const c of cues) {
    const t = c.t;
    switch (c.kind) {
      case 'rewind': { // A20 tape stop (round 4): the cold open's sound slows to a halt, then the rewind
        { const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.setValueAtTime(320, t); o2.frequency.exponentialRampToValueAtTime(38, t + 0.24);
          const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(200, t + 0.24);
          const g = ctx.createGain(); g.gain.setValueAtTime(0.13, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
          o2.connect(f); f.connect(g); g.connect(sfx); o2.start(t); o2.stop(t + 0.28); }
        // A2 tape rewind: a rising saw through a sweeping band, hiss, and a catch at the end
        const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.setValueAtTime(200, t); o2.frequency.exponentialRampToValueAtTime(1600, t + 0.45);
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2400, t + 0.45);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.04); g.gain.linearRampToValueAtTime(0.0001, t + 0.47);
        o2.connect(f); f.connect(g); g.connect(sfx); o2.start(t); o2.stop(t + 0.5);
        nz(t, 0.45, 0.05, sfx, { type: 'highpass', f: 3000 }); nz(t + 0.47, 0.01, 0.2, sfx, { type: 'highpass', f: 2000 }, 0, 0.001);
        break;
      }
      case 'sip': {
        if (o.fizzy && !o.solid) { nz(t - 0.25, 0.002, 0.3, sfx, { type: 'highpass', f: 2000 }, 0, 0.001); nz(t - 0.24, 0.35, 0.14, sfx, { type: 'bandpass', f: 4500, f1: 3000, q: 0.8 }, 0, 0.005); } // A3 can opening
        if (o.solid) { for (let i = 0; i < 3; i++) nz(t + i * 0.05, 0.025, 0.12, sfx, { type: 'bandpass', f: 2200, q: 2 }); osc('sine', 140, 90, t, 0.12, 0.2, sfx); } // bite
        else for (let i = 0; i < 2; i++) { const tt = t + i * 0.32, k = i ? 0.9 : 1; osc('sine', 320 * k, 110 * k, tt, 0.12, 0.22, sfx, 0, 0.005); nz(tt, 0.04, 0.1, sfx, { type: 'bandpass', f: 700, q: 3 }); } // A4 gulps
        if (!o.solid) { // A5 pour: a lowpassed "glug" for about 2 s
          const s = ctx.createBufferSource(); s.buffer = noise; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
          const am = ctx.createGain(); am.gain.value = 0.4; const lfo = ctx.createOscillator(); lfo.frequency.value = 9; const lg = ctx.createGain(); lg.gain.value = 0.6; lfo.connect(lg); lg.connect(am.gain);
          const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + 0.6); g.gain.exponentialRampToValueAtTime(0.05, t + 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
          s.connect(f); f.connect(am); am.connect(g); g.connect(sfx); s.start(t + 0.6, 0.3, 2.2); lfo.start(t + 0.6); lfo.stop(t + 2.8);
        }
        if (o.fizzy) { // A6 fizz: seeded grains, fading over ~4 s
          let sd = 4242;
          const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
          for (let tt = t + 0.3; tt < t + 7; ) { const dens = 120 * Math.exp(-(tt - t) / 4); if (dens < 8) break; tt += -Math.log(1 - rnd()) / dens; nz(tt, 0.003 + rnd() * 0.005, 0.03, sfx, { type: 'highpass', f: 5000 }, (rnd() - 0.5) * 1.2, 0.001); }
        }
        break;
      }
      case 'move': nz(t, 0.95, 0.16, sfx, { type: 'bandpass', f: 350 * mo.whoosh, f1: 2800 * mo.whoosh, q: 1.4 }, 0, 0.55); // A7 whoosh (round 11: its colour per food)
        // round 9 (A7 reverse + V17): a long jump through the day (≥ 4 h) adds a soft falling air rush as the camera
        // pulls back and the speed lines run, panned slowly across
        if ((c.data?.v ?? 0) >= 240) { nz(t + 0.12, 1.15, 0.05, sfx, { type: 'bandpass', f: 2800, f1: 350, q: 0.8 }, -0.35, 0.45); nz(t + 0.3, 0.9, 0.03, sfx, { type: 'highpass', f: 4200 }, 0.35, 0.35); }
        break;
      case 'stop': if (t > 1.2) {
        osc('sine', 1318.5, null, t, 0.22, 0.07, sfx); osc('sine', 1975.5, null, t + 0.004, 0.16, 0.035, sfx); // A8 tick
        // round 10: the organ thump under the tick (the picture's organ hit), not on the impact (it has its own)
        if (!peaks.some((p) => Math.abs(p - t) < 0.3)) { osc('sine', 92, 52, t, 0.2, 0.2, sfx, 0, 0.004); nz(t, 0.03, 0.06, sfx, { type: 'lowpass', f: 320 }, 0, 0.002); }
      } break;
      case 'day': { // round 11: the 24 h beat completes: a soft rising arpeggio (calm: one low bell, alcohol is never celebrated)
        if (c.data?.label === 'calm') { osc('sine', midi(57), null, t, 1.2, 0.06, sfx); osc('sine', midi(69), null, t + 0.01, 0.9, 0.025, sfx); }
        else { [69, 73, 76, 81, 85].forEach((n, i) => osc('sine', midi(n + 12), null, t + i * 0.05, 0.9, 0.04, sfx, (i - 2) * 0.25)); nz(t, 0.5, 0.025, sfx, { type: 'highpass', f: 7000 }, 0, 0.05); }
        break;
      }
      case 'surge': { // round 10: the bloodstream surge: an upward air swell and a soft low pulse, then a voice per substance
        // (riding the riser, `v` > 0: the riser is the swell, so only the substance's own voice, a little quieter)
        const ride = (c.data?.v ?? 0) > 0, vg = ride ? 0.7 : 1;
        if (!ride) { nz(t - 0.2, 0.75, 0.07, sfx, { type: 'bandpass', f: 500, f1: 3600, q: 1.2 }, -0.2, 0.3); osc('sine', 72, 50, t + 0.05, 0.32, 0.12, sfx, 0, 0.01); }
        const kind = c.data?.label;
        if (kind === 'sugar') { // sparkle: high pentatonic glints, seeded, spread across the stereo field
          let sd = 913; const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
          const notes = [88, 90, 93, 95, 97, 100];
          for (let i = 0; i < 9; i++) osc('sine', midi(notes[Math.floor(rnd() * notes.length)]), null, t + 0.05 + i * 0.07 + rnd() * 0.03, 0.28, 0.03 * vg, sfx, (rnd() - 0.5) * 1.2, 0.002);
        } else if (kind === 'caffeine') { // a bright "switch on": a quick upward zap and a clear ping
          osc('triangle', 660, 1320, t, 0.22, 0.05 * vg, sfx, -0.25, 0.005); osc('triangle', 990, 1980, t + 0.03, 0.2, 0.03 * vg, sfx, 0.25, 0.005);
          osc('sine', 1760, null, t + 0.24, 0.35, 0.035 * vg, sfx, 0, 0.003);
        } else if (kind === 'alcohol' && !ride) { // a warm, slightly sagging swell
          for (const det of [-8, 8]) { const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.detune.value = det; o2.frequency.setValueAtTime(220, t); o2.frequency.exponentialRampToValueAtTime(196, t + 1.0);
            const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.035, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
            const p = ctx.createStereoPanner(); p.pan.value = det < 0 ? -0.3 : 0.3; o2.connect(f); f.connect(g); g.connect(p); p.connect(sfx); o2.start(t); o2.stop(t + 1.15); }
        }
        break;
      }
      case 'page': osc('sine', 987.8, null, t, 0.16, 0.035, sfx); break;
      case 'micro': osc('sine', 1567.98, null, t, 0.09, 0.022, sfx, c.data?.v === 1 ? -0.3 : 0.3); break; // a soft beat with each small picture event
      case 'next': if (c.data?.label === 'tease') { osc('triangle', 659.25, null, t, 0.3, 0.1, sfx); osc('triangle', 987.77, null, t + 0.12, 0.4, 0.1, sfx); } // A17 stinger
        else { osc('sine', 880, 1320, t, 0.12, 0.11, sfx); osc('sine', 1760, 2640, t, 0.1, 0.03, sfx); } break; // A9 blip (audible over the music on a phone)
      case 'guess': osc('sine', 880, 1320, t + 0.2, 0.09, 0.05, sfx, -0.4); osc('sine', 1047, 1568, t + 0.35, 0.09, 0.05, sfx, 0.4); break;
      case 'riser': { // A11: a filtered noise sweep + two detuned saws + a snare roll that speeds up, all ending on the impact
        const dur = Math.max(0.3, (peaks.find((p) => p >= t) ?? t + 1.6) - t);
        nz(t, dur, 0.1, sfx, { type: 'bandpass', f: 300, f1: 6000, q: 2 }, 0, dur * 0.9);
        for (const det of [-12, 12]) { const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.detune.value = det; o2.frequency.setValueAtTime(220, t); o2.frequency.exponentialRampToValueAtTime(880, t + dur);
          const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.04, t + dur - 0.01); g.gain.linearRampToValueAtTime(0, t + dur);
          o2.connect(f); f.connect(g); g.connect(sfx); o2.start(t); o2.stop(t + dur + 0.01); }
        for (let tt = t, step = BEAT2 / 2; tt < t + dur - 0.02; tt += step, step = Math.max(BEAT2 / 8, step * 0.82)) nz(tt, 0.02, 0.04 + 0.06 * ((tt - t) / dur), sfx, { type: 'bandpass', f: 1800, q: 1 }, 0, 0.002);
        break;
      }
      case 'peak': case 'verdict': { // A12 impact: sub drop, a body of noise, a reverb tail; the verdict also shimmers (A19)
        osc('sine', 60, 35, t, 0.6, 0.55, sfx, 0, 0.003);
        // round 5: weight where the ear (and the loudness meter) hears it, after the hush: a mid boom, a body and a
        // wide crash with a tail (≥ +5 LU momentary over the mix, checked with ffmpeg ebur128)
        // (held for 0.3 s, then a 0.6 s decay: the meter's 400 ms window, and the ear, get a real hit)
        const held = (src: AudioScheduledSourceNode, node: AudioNode, peak: number, pan: number) => {
          const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.004); g.gain.setValueAtTime(peak, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
          const p = ctx.createStereoPanner(); p.pan.value = pan; node.connect(g); g.connect(p); p.connect(imp); src.start(t); src.stop(t + 0.95);
        };
        { const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.setValueAtTime(150, t); o2.frequency.exponentialRampToValueAtTime(55, t + 0.8); held(o2, o2, 0.5, 0); }
        for (const [pan, f0, off] of [[-0.3, 2600, 0.4], [0.3, 2100, 1.3]] as const) {
          const s2 = ctx.createBufferSource(); s2.buffer = noise; s2.playbackRate.value = 1; const bf = ctx.createBiquadFilter(); bf.type = 'bandpass'; bf.Q.value = 0.5;
          bf.frequency.setValueAtTime(f0, t); bf.frequency.exponentialRampToValueAtTime(f0 * 0.4, t + 0.9); s2.connect(bf);
          const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.45, t + 0.003); g.gain.setValueAtTime(0.45, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
          const p = ctx.createStereoPanner(); p.pan.value = pan; bf.connect(g); g.connect(p); p.connect(imp); s2.start(t, off, 1); s2.stop(t + 0.95);
        }
        nz(t, 0.9, 0.25, verb, { type: 'bandpass', f: 2000, f1: 800, q: 0.6 }, 0, 0.002, 0.9);
        const s = ctx.createBufferSource(); s.buffer = noise; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 800; const g = ctx.createGain(); env(g, t, 0.003, 0.25, 0.15);
        s.connect(f); f.connect(g); g.connect(sfx); g.connect(verb); s.start(t, 1.1, 0.25);
        osc('sine', 110, 55, t, 0.25, 0.12, verb);
        if (c.kind === 'verdict') { [69, 73, 76, 80, 81, 85].forEach((n, i) => osc('sine', midi(n + 12), null, t + 0.12 + i * 0.04, 1.2, 0.05, sfx, (i - 2.5) * 0.2)); nz(t + 0.1, 0.6, 0.03, sfx, { type: 'highpass', f: 8000 }); }
        break;
      }
      case 'lights': { const f = [1318.5, 1046.5, 784][c.data?.level ?? 0]; osc('sine', f * 0.66, f, t, 0.12, 0.11, sfx, c.data?.side === 1 ? 0.4 : c.data?.side === 0 ? -0.4 : 0); osc('sine', f * 2, null, t, 0.1, 0.03, sfx); break; } // A9 by level
      case 'race': osc('sine', 1568, null, t, 0.8, 0.07, sfx, c.data?.side ? 0.5 : -0.5); osc('sine', 2349, null, t, 0.8, 0.04, sfx, c.data?.side ? 0.5 : -0.5); break; // A18
      case 'night': if (c.data?.v === 0) { nz(t, 0.5, 0.06, sfx, { type: 'highpass', f: 200, f1: 8000 }, 0, 0.2); [69, 73, 76, 83].forEach((n, i) => osc('sine', midi(n), null, t + 0.05 * i, 1.0, 0.03, sfx)); } break; // A16 sunrise
      default: break;
    }
  }
  // A13 heartbeat: lub-dub every 1.1 s (≈ 55/min, calm), only inside the model's heart-stress spans
  const hearts: [number, number][] = [];
  at('heart').forEach((c) => { if (c.data?.v === 1) hearts.push([c.t, outro]); else if (hearts.length) hearts[hearts.length - 1][1] = Math.min(hearts[hearts.length - 1][1], c.t); });
  for (const [a, b] of hearts) for (let t = a + 0.2; t < b - 0.3; t += 1.1) {
    osc('sine', 55, 48, t, 0.07, 0.18, sfx, 0, 0.004); nz(t, 0.07, 0.06, sfx, { type: 'lowpass', f: 150 });
    osc('sine', 52, 45, t + 0.14, 0.06, 0.12, sfx, 0, 0.004);
  }
  // A14 ratchet: the clock's soft ticks through the night time-lapse
  for (const [a, b] of nights) for (let t = a + 0.2; t < b - 0.1; t += 1 / 8) { nz(t, 0.004, 0.025, sfx, { type: 'highpass', f: 3000 }, 0, 0.001); osc('sine', 2200, null, t, 0.008, 0.012, sfx, 0, 0.001); }

  const buf = await ctx.startRendering();
  // mix: music + effects (or effects only), loudness from the full mix, lookahead limiter, a short fade for the loop
  const m0 = buf.getChannelData(0), m1 = buf.getChannelData(1), s0 = buf.getChannelData(2), s1 = buf.getChannelData(3);
  const out = new AudioBuffer({ numberOfChannels: 2, length: len, sampleRate: sr });
  const L = out.getChannelData(0), R = out.getChannelData(1);
  let sum = 0;
  for (let i = 0; i < len; i++) { const l = m0[i] + s0[i], r = m1[i] + s1[i]; sum += l * l + r * r; }
  const rms = Math.sqrt(sum / Math.max(1, 2 * len)) || 1e-6;
  // round 5: the full mix is measured as the platforms measure it (ITU-R BS.1770 integrated loudness, after the
  // limiter) and set to −14 LUFS in two steps; "effects only" gets the same gain as the full mix (the effects stay at
  // their level, they are not pushed to −14 LUFS)
  let gain = TARGET_RMS2 / rms;
  for (let k = 0; k < 2; k++) {
    for (let i = 0; i < len; i++) { L[i] = (m0[i] + s0[i]) * gain; R[i] = (m1[i] + s1[i]) * gain; }
    limit([L, R], CEIL2, sr);
    const I = lufs(L, R, sr);
    if (isFinite(I)) gain *= Math.pow(10, (LUFS_TARGET - I) / 20);
  }
  if (!o.music) gain = Math.min(gain, 6);
  for (let i = 0; i < len; i++) { L[i] = ((o.music ? m0[i] : 0) + s0[i]) * gain; R[i] = ((o.music ? m1[i] : 0) + s1[i]) * gain; }
  limit([L, R], CEIL2, sr);
  const fade = Math.round(0.3 * sr);
  for (let i = len - fade; i < len; i++) { const k = (len - i) / fade; L[i] *= k; R[i] *= k; }
  return out;
}
