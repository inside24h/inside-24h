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
