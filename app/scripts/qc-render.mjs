// Audit C7 / phase 4 (2026-11-13): automatic checks of a RENDERED video (the MP4 the app exported), with ffprobe and
// ffmpeg, so every render round is checked the same way and the evidence is written down (owner brief §37: clear
// criteria and evidence instead of a single score).
//   npm run qc:render -- <file.mp4> [more.mp4 …] [--cut=long|medium|short] [--out=<dir>] [--no-strict]
// Per file it checks:
//   - format: 1080×1920 (9:16) or 1080×1350 (4:5), H.264 video, AAC audio, 30 fps constant;
//   - length for its cut (from --cut, else the file name: tiktok/long, reels/medium, shorts/short): the app's
//     platform lengths (video-caption.ts PLATFORM_LENGTH: 62-75 s, 45-55 s, 23-30 s; a long cut never under 60.5 s);
//   - A/V sync: the audio and video streams start together (≤ 50 ms) and end together (drift ≤ 100 ms);
//   - black frames (blackdetect: ≥ 0.25 s of black) and frozen frames (freezedetect: ≥ 2 s without change);
//   - loudness (ebur128): integrated -14 LUFS ± 1, true peak ≤ -1 dBTP;
//   - silence over 3 s (silencedetect at -50 dB) is reported (a warning: a hush before an impact is allowed).
// Writes <name>.qc.json and <name>.qc.md next to the file (or into --out) and prints a one-line verdict per file.
// Exit code 1 when a check fails (unless --no-strict). ffmpeg/ffprobe come from PATH (or FFMPEG / FFPROBE).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const files = args.filter((a) => !a.startsWith('--'));
const STRICT = !args.includes('--no-strict');
const FFMPEG = process.env.FFMPEG || 'ffmpeg', FFPROBE = process.env.FFPROBE || 'ffprobe';
if (!files.length) { console.error('usage: npm run qc:render -- <file.mp4> [--cut=long|medium|short] [--out=<dir>] [--no-strict]'); process.exit(2); }

/** Platform lengths (video-caption.ts PLATFORM_LENGTH), seconds, with half a second for the encoder's last frame. */
const LENGTH = { long: [60.5, 75.5], medium: [45, 55.5], short: [23, 30.5] };
const SIZES = [[1080, 1920, '9:16'], [1080, 1350, '4:5']];
const LUFS = -14, LUFS_TOL = 1, TP_MAX = -1;

const run = (bin, a) => {
  const r = spawnSync(bin, a, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, windowsHide: true });
  if (r.error) throw new Error(`${bin}: ${r.error.message} (install ffmpeg or set ${bin === FFMPEG ? 'FFMPEG' : 'FFPROBE'})`);
  return r;
};
const cutOf = (f) => {
  const c = opt('cut');
  if (c) return c;
  const n = path.basename(f).toLowerCase();
  return /shorts?\b|short[-_.]/.test(n) ? 'short' : /reels?\b|medium/.test(n) ? 'medium' : /tiktok|long|facebook/.test(n) ? 'long' : null;
};
const num = (x) => (x === undefined || x === null || x === 'N/A' ? null : Number(x));
const frac = (s) => { const [a, b] = String(s ?? '0/1').split('/').map(Number); return b ? a / b : a; };

function qc(file) {
  const checks = [];
  const add = (id, ok, value, rule, level = 'fail') => checks.push({ id, status: ok ? 'pass' : level, value, rule });
  const pr = run(FFPROBE, ['-v', 'error', '-show_streams', '-show_format', '-count_frames', '-of', 'json', file]);
  if (pr.status !== 0) return { file, error: pr.stderr.trim(), checks: [{ id: 'probe', status: 'fail', value: pr.stderr.trim().slice(0, 200), rule: 'ffprobe reads the file' }] };
  const info = JSON.parse(pr.stdout), v = info.streams.find((s) => s.codec_type === 'video'), a = info.streams.find((s) => s.codec_type === 'audio');
  const dur = num(info.format.duration);
  // format
  const size = v && SIZES.find(([w, h]) => v.width === w && v.height === h);
  add('resolution', !!size, v ? `${v.width}×${v.height}${size ? ` (${size[2]})` : ''}` : 'no video stream', '1080×1920 or 1080×1350');
  add('video codec', v?.codec_name === 'h264', v?.codec_name ?? '-', 'H.264');
  add('audio stream', !!a && a.codec_name === 'aac', a ? `${a.codec_name} ${a.sample_rate} Hz ${a.channels} ch` : 'none', 'AAC audio');
  const fpsR = frac(v?.r_frame_rate), fpsA = frac(v?.avg_frame_rate), nFr = num(v?.nb_read_frames ?? v?.nb_frames), vDur = num(v?.duration) ?? dur;
  const fpsCount = nFr && vDur ? nFr / vDur : null;
  add('fps', Math.abs(fpsR - 30) < 0.01 && Math.abs(fpsA - 30) < 0.05 && (!fpsCount || Math.abs(fpsCount - 30) < 0.1), `r ${fpsR.toFixed(3)} · avg ${fpsA.toFixed(3)}${fpsCount ? ` · counted ${fpsCount.toFixed(3)} (${nFr} frames)` : ''}`, '30 fps, constant');
  // length for the cut
  const cut = cutOf(file), lim = cut && LENGTH[cut];
  add('duration', !!lim && dur >= lim[0] && dur <= lim[1], `${dur?.toFixed(2)} s${cut ? ` (${cut})` : ' (cut unknown: pass --cut=)'}`, lim ? `${lim[0]}–${lim[1]} s for ${cut}` : 'a known cut');
  // A/V sync
  if (a && v) {
    const s0 = Math.abs((num(a.start_time) ?? 0) - (num(v.start_time) ?? 0)), aDur = num(a.duration), drift = aDur !== null && vDur !== null ? Math.abs(aDur - vDur) : null;
    add('A/V start', s0 <= 0.05, `${(s0 * 1000).toFixed(0)} ms`, 'audio and video start within 50 ms');
    add('A/V drift', drift !== null && drift <= 0.1, drift === null ? 'unknown' : `${(drift * 1000).toFixed(0)} ms (audio ${aDur.toFixed(3)} s, video ${vDur.toFixed(3)} s)`, 'stream lengths within 100 ms');
  }
  // black and frozen frames, loudness and silence: one decoding pass for the picture, one for the sound
  const fv = run(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-vf', 'blackdetect=d=0.25:pix_th=0.06:pic_th=0.98,freezedetect=n=0.001:d=2', '-an', '-f', 'null', '-']).stderr;
  const blacks = [...fv.matchAll(/black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)/g)].map((m) => ({ start: +m[1], end: +m[2], s: +m[3] }));
  const freezeStarts = [...fv.matchAll(/freeze_start: ([\d.]+)/g)].map((m) => +m[1]), freezeDur = [...fv.matchAll(/freeze_duration: ([\d.]+)/g)].map((m) => +m[1]);
  const freezes = freezeStarts.map((st, i) => ({ start: st, s: freezeDur[i] ?? (dur - st) }));
  add('black frames', !blacks.length, blacks.length ? blacks.map((b) => `${b.start.toFixed(2)}–${b.end.toFixed(2)} s`).join(', ') : 'none', 'no black stretch ≥ 0.25 s');
  add('frozen frames', !freezes.length, freezes.length ? freezes.map((f) => `${f.start.toFixed(2)} s for ${f.s.toFixed(2)} s`).join(', ') : 'none', 'the picture never stands still ≥ 2 s');
  let lufs = null, tp = null, lra = null, silences = [];
  if (a) {
    const fa = run(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', 'ebur128=peak=true,silencedetect=n=-50dB:d=3', '-f', 'null', '-']).stderr;
    const sum = fa.slice(fa.lastIndexOf('Summary:'));
    lufs = num(/I:\s+(-?[\d.]+) LUFS/.exec(sum)?.[1]); lra = num(/LRA:\s+(-?[\d.]+) LU/.exec(sum)?.[1]); tp = num(/Peak:\s+(-?[\d.]+|-inf) dBFS/.exec(sum)?.[1]);
    silences = [...fa.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_duration: ([\d.]+)/g)].map((m) => ({ start: +m[1], s: +m[2] }));
    add('loudness', lufs !== null && Math.abs(lufs - LUFS) <= LUFS_TOL, lufs === null ? 'unknown' : `${lufs.toFixed(1)} LUFS (LRA ${lra?.toFixed(1)} LU)`, `${LUFS} LUFS ± ${LUFS_TOL}`);
    add('true peak', tp !== null && tp <= TP_MAX, tp === null ? 'unknown' : `${tp.toFixed(1)} dBTP`, `≤ ${TP_MAX} dBTP`);
    add('silence', !silences.length, silences.length ? silences.map((x) => `${x.start.toFixed(1)} s for ${x.s.toFixed(1)} s`).join(', ') : 'none', 'no silence (−50 dB) over 3 s', 'warn');
  }
  const fails = checks.filter((c) => c.status === 'fail').length, warns = checks.filter((c) => c.status === 'warn').length;
  return { file: path.resolve(file), checkedAt: new Date().toISOString(), cut, duration: dur, verdict: fails ? 'FAIL' : warns ? 'PASS with warnings' : 'PASS', fails, warns, checks,
    raw: { blacks, freezes, silences, lufs, truePeak: tp, lra } };
}

const md = (r) => [`# Render QC: ${path.basename(r.file)}`, '', `**${r.verdict}** · ${r.cut ?? 'cut unknown'} · ${r.duration?.toFixed(2) ?? '?'} s · checked ${r.checkedAt}`, '',
  '| Check | Result | Value | Rule |', '|---|---|---|---|', ...r.checks.map((c) => `| ${c.id} | ${c.status.toUpperCase()} | ${String(c.value).replace(/\|/g, '/')} | ${c.rule} |`), '',
  'Generated by `npm run qc:render` (app/scripts/qc-render.mjs): ffprobe for the format, ffmpeg blackdetect, freezedetect, ebur128 and silencedetect.', ''].join('\n');

let bad = 0;
const all = [];
for (const f of files) {
  if (!fs.existsSync(f)) { console.error(`missing: ${f}`); bad++; continue; }
  const r = qc(f);
  all.push(r);
  const out = opt('out') ? path.resolve(opt('out')) : path.dirname(path.resolve(f)), base = path.join(out, path.basename(f).replace(/\.[^.]+$/, ''));
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(`${base}.qc.json`, JSON.stringify(r, null, 2));
  fs.writeFileSync(`${base}.qc.md`, md(r));
  if (r.verdict === 'FAIL' || r.error) bad++;
  console.log(`[qc] ${r.verdict.padEnd(18)} ${path.basename(f)} · ${r.checks.map((c) => `${c.id}: ${c.status === 'pass' ? 'ok' : `${c.status.toUpperCase()} ${c.value}`}`).join(' · ')}`);
}
if (files.length > 1) {
  const out = opt('out') ? path.resolve(opt('out')) : path.dirname(path.resolve(files[0]));
  fs.writeFileSync(path.join(out, 'qc-summary.md'), ['# Render QC summary', '', '| File | Verdict | Duration | Loudness | True peak | Failed / warned checks |', '|---|---|---|---|---|---|',
    ...all.map((r) => `| ${path.basename(r.file)} | ${r.verdict} | ${r.duration?.toFixed(2) ?? '?'} s | ${r.raw?.lufs?.toFixed(1) ?? '?'} LUFS | ${r.raw?.truePeak?.toFixed(1) ?? '?'} dBTP | ${r.checks.filter((c) => c.status !== 'pass').map((c) => `${c.id} (${c.value})`).join('; ') || '-'} |`), ''].join('\n'));
}
process.exit(bad && STRICT ? 1 : 0);
