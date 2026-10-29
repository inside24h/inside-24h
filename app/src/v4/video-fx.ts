// Video effects (2026-10-24 creative spec §4): small 2D layers over the 3D body, all placed from the plan's cue list
// (video-plan.ts), so picture and sound always agree. Deterministic: every effect is a function of the frame time and
// the cues (seeded noise only), so the same plan always makes the same video and the tests can check it.
// Safety (WCAG 2.3.1): nothing flashes more than 3 times a second; the shake is at most 0.6 % of the height.
import type { Cue } from './video-plan';

/** Seconds since the last cue of this kind at or before t (Infinity if none), and that cue. */
export function since(cues: readonly Cue[] | undefined, kind: Cue['kind'], t: number, pick?: (c: Cue) => boolean): { age: number; cue?: Cue } {
  let best: Cue | undefined;
  for (const c of cues ?? []) if (c.kind === kind && c.t <= t + 1e-6 && (!pick || pick(c)) && (!best || c.t > best.t)) best = c;
  return best ? { age: t - best.t, cue: best } : { age: Infinity };
}
/** Seconds until the next cue of this kind after t (Infinity if none). */
export function until(cues: readonly Cue[] | undefined, kind: Cue['kind'], t: number): { left: number; cue?: Cue } {
  let best: Cue | undefined;
  for (const c of cues ?? []) if (c.kind === kind && c.t > t + 1e-6 && (!best || c.t < best.t)) best = c;
  return best ? { left: best.t - t, cue: best } : { left: Infinity };
}
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const easeOutCubic = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

/** The body layer's motion at time t: impact punch (zoom ×1.085 easing back over 0.5 s), a short damped shake
 *  (0.22 s, ≤ 0.6 % of the height), the cold open's slow push-in, the micro-beat zoom pulse. */
export function bodyMotion(cues: readonly Cue[] | undefined, t: number, H: number, beat?: string): { scale: number; dx: number; dy: number } {
  let scale = 1, dx = 0, dy = 0;
  for (const kind of ['peak', 'verdict'] as const) {
    const { age } = since(cues, kind, t);
    if (age < 0.5) scale *= 1 + 0.085 * (1 - easeOutCubic(age / 0.5));
    if (age < 0.22) {
      const a = 0.006 * H * Math.exp(-age / 0.08);
      dx += a * Math.sin(2 * Math.PI * 18 * age); dy += a * Math.sin(2 * Math.PI * 18 * age + 1.3);
    }
  }
  if (beat === 'teaser') scale *= 1 + 0.02 * clamp01(t / 0.45);
  const m = since(cues, 'micro', t);
  if (m.cue?.data?.v === 0 && m.age < 0.9) scale *= 1 + 0.03 * Math.sin(Math.PI * clamp01(m.age / 0.9)); // one gentle breath
  return { scale, dx, dy };
}

/** Riser vignette: the edges close in (to 0.25) for the 1.6 s before the impact, and open again after it. */
export function vignetteAlpha(cues: readonly Cue[] | undefined, t: number): number {
  const r = since(cues, 'riser', t), p = until(cues, 'peak', t), after = since(cues, 'peak', t);
  if (r.cue && p.cue && r.age >= 0 && p.left < 2.5) return 0.25 * smooth(r.age / Math.max(0.3, r.age + p.left));
  if (after.age < 0.5) return 0.25 * (1 - smooth(after.age / 0.5));
  return 0;
}
export function drawVignette(ctx: CanvasRenderingContext2D, W: number, H: number, a: number) {
  if (a <= 0.003) return;
  const g = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.45, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a.toFixed(3)})`);
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}

/** Seeded random numbers (the same splash every time). */
function rng(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/** The first sip's splash: 24 drops of the drink's colour from the mouth, falling under gravity for 0.5 s. */
export function drawSplash(ctx: CanvasRenderingContext2D, at: { x: number; y: number } | null | undefined, age: number, color: string, seed = 11) {
  if (!at || age < 0 || age > 0.55) return;
  const r = rng(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 24; i++) {
    const ang = (-160 + 140 * r()) * Math.PI / 180, v = 300 + 300 * r(), rad = 3 + 4 * r();
    const x = at.x + Math.cos(ang) * v * age, y = at.y + Math.sin(ang) * v * age + 0.5 * 1400 * age * age;
    ctx.globalAlpha = 0.85 * (1 - age / 0.55);
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** A ring that runs out from an organ (the peak, the verdict): radius 20 → 220 px in 0.45 s, fading. */
export function drawShockwave(ctx: CanvasRenderingContext2D, at: { x: number; y: number } | null | undefined, age: number, color: string) {
  if (!at || age < 0 || age > 0.45) return;
  const k = easeOutCubic(age / 0.45);
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = 0.8 * (1 - age / 0.45); ctx.lineWidth = 10 - 9 * k;
  ctx.beginPath(); ctx.arc(at.x, at.y, 20 + 200 * k, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}

/** A soft glow that swells and fades on an organ (0.6 s, once: under 2 pulses a second). */
export function drawGlowPulse(ctx: CanvasRenderingContext2D, at: { x: number; y: number } | null | undefined, age: number, color: string, r = 120) {
  if (!at || age < 0 || age > 0.6) return;
  const a = 0.35 * Math.sin(Math.PI * (age / 0.6));
  const g = ctx.createRadialGradient(at.x, at.y, 0, at.x, at.y, r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(at.x - r, at.y - r, 2 * r, 2 * r); ctx.restore();
}

/** The rewind: a few soft horizontal tape lines rolling down the frame (alpha ≤ 0.22). */
export function drawRewindLines(ctx: CanvasRenderingContext2D, W: number, H: number, k: number) {
  if (k <= 0 || k >= 1) return;
  ctx.save(); ctx.globalAlpha = 0.22 * Math.sin(Math.PI * k); ctx.fillStyle = '#cfe8ff';
  for (let i = 0; i < 6; i++) { const y = ((i / 6 + k * 1.7) % 1) * H; ctx.fillRect(0, y, W, 3 + (i % 3) * 3); }
  ctx.restore();
}

/** V17 (round 9): speed lines while the day races through a quiet stretch. `rate` = minutes of the day per second of
 *  video; they start at 30 min/s and are full at 120. Only a few faint streaks in the frame's side margins (the
 *  body in the middle stays clear), tapered at both ends, running down the frame. */
export const speedAlpha = (rate: number | undefined) => clamp01(((rate ?? 0) - 30) / 90);
export function drawSpeedLines(ctx: CanvasRenderingContext2D, W: number, t: number, a: number, top: number, bot: number) {
  if (a <= 0.01 || bot <= top) return;
  const r = rng(17);
  ctx.save();
  for (let i = 0; i < 10; i++) {
    const side = i % 2, x = side ? W - (0.02 + 0.1 * r()) * W : (0.02 + 0.1 * r()) * W;
    const len = 120 + 160 * r(), sp = 1300 + 900 * r(), ph = r(), op = 0.5 + 0.5 * r();
    const span = bot - top + len, y = top - len + (((t * sp) / span + ph) % 1) * span;
    const g = ctx.createLinearGradient(0, y, 0, y + len);
    g.addColorStop(0, 'rgba(207,232,255,0)'); g.addColorStop(0.6, 'rgba(207,232,255,1)'); g.addColorStop(1, 'rgba(207,232,255,0)');
    ctx.globalAlpha = 0.12 * a * op; ctx.fillStyle = g; ctx.fillRect(x, Math.max(top, y), 2 + (i % 3), Math.min(bot, y + len) - Math.max(top, y));
  }
  ctx.restore();
}

/** Night tone (22:00–07:00 on the clock): a deep blue veil and a small moon. */
export function drawNight(ctx: CanvasRenderingContext2D, W: number, H: number, a: number, moonAt: { x: number; y: number }) {
  if (a <= 0.003) return;
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(11,26,58,1)'); g.addColorStop(1, 'rgba(11,26,58,0.6)');
  ctx.globalAlpha = 0.18 * a; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.9 * a; ctx.fillStyle = '#dfe9ff';
  ctx.beginPath(); ctx.arc(moonAt.x, moonAt.y, 16, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(moonAt.x + 7, moonAt.y - 5, 14, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
/** Sunrise when the night ends: a warm wash for 0.5 s. */
export function drawSunrise(ctx: CanvasRenderingContext2D, W: number, H: number, age: number) {
  if (age < 0 || age > 0.5) return;
  ctx.save(); ctx.globalAlpha = 0.14 * Math.sin(Math.PI * age / 0.5);
  const g = ctx.createLinearGradient(0, H, 0, 0); g.addColorStop(0, '#ffb347'); g.addColorStop(1, 'rgba(255,179,71,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}

/** Sparks behind a winner's verdict (12, seeded). Only ever used when verdictOf gave a 🏆, which it never does for alcohol. */
export function drawSparks(ctx: CanvasRenderingContext2D, cx: number, cy: number, age: number, color = '#ffd27a') {
  if (age < 0 || age > 0.9) return;
  const r = rng(77);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) {
    const ang = r() * Math.PI * 2, v = 260 + 260 * r(), d = v * easeOutCubic(age / 0.9);
    ctx.globalAlpha = 0.9 * (1 - age / 0.9); ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d * 0.6, 4 * (1 - age / 0.9) + 1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** Number of light changes per second anywhere in these effects (for the WCAG test): the pulses, rings and flashes
 *  each last ≥ 0.45 s and come from cues at least 0.9 s apart, except the impacts (≤ 2 per video). */
export const MAX_FLASHES_PER_S = 3;

// ---- round 4 (2026-10-24): bubbles, the bloodstream, the kinetic hook ----

/** Bubbles rising in the stomach of a fizzy drink (and a foam rim for beer in its first minutes). `fill` 0..1 = how
 *  much is still in the stomach; r = the stomach's size on screen. Seeded: the same bubbles every time. */
export function drawBubbles(ctx: CanvasRenderingContext2D, at: { x: number; y: number } | null | undefined, r: number, t: number, fill: number, foam = false) {
  if (!at || fill <= 0.02 || r < 8) return;
  const rnd = rng(31);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const n = Math.round(10 + 14 * fill);
  for (let i = 0; i < n; i++) {
    const x0 = (rnd() * 2 - 1) * r * 0.7, period = 1.3 + rnd() * 1.1, ph = rnd(), size = 2 + rnd() * 4;
    const k = ((t / period + ph) % 1); // 0 → 1 as the bubble rises
    const y = at.y + r * 0.6 - k * r * 1.2, x = at.x + x0 + Math.sin((k + ph) * 6.28) * 4;
    ctx.globalAlpha = 0.55 * fill * Math.sin(Math.PI * k);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.stroke();
  }
  if (foam) {
    ctx.globalAlpha = 0.45 * Math.min(1, fill * 1.5); ctx.fillStyle = '#fff6e0';
    for (let i = 0; i < 16; i++) { const a = Math.PI * (1.15 + 0.7 * (i / 15)); ctx.beginPath(); ctx.arc(at.x + Math.cos(a) * r * 0.75, at.y - r * 0.45 + Math.sin(a) * r * 0.12, 4 + (i % 3) * 2, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}

/** The bloodstream: soft comets travelling gut → liver → heart → brain along the organs' projected positions, as many
 *  and as bright as the level of the drink's main substance in the blood (`level` 0..1).
 *  Round 10b (critic: "a vertical column of dots" in wide shots): three curved vessels that part between the organs
 *  and meet at them (each bends its own way), drawn as faint lines, with fewer comets of varied speed and size that
 *  dip in and out of depth (smaller and dimmer when "behind"). `speedK` slows the whole stream (the 24 h afterglow). */
export function drawBloodFlow(ctx: CanvasRenderingContext2D, path: ({ x: number; y: number } | null | undefined)[], t: number, level: number, color: string, surge = 0, sparkle = false, win?: [number, number], speedK = 1) {
  const pts = path.filter((p): p is { x: number; y: number } => !!p);
  const lv = Math.min(1, Math.max(level, 0.6 * surge));
  if (pts.length < 2 || lv <= 0.03) return;
  const vessels = VESSEL_BEND.map((bend) => vesselLine(pts, bend));
  const lens = vessels.map((v) => v.len);
  if (Math.max(...lens) < 20) return;
  // (only inside the picture's window between the top text and the caption, fading out 50 px before its edges)
  const vis = (y: number) => (win ? clamp01((y - win[0]) / 50) * clamp01((win[1] - y) / 50) : 1);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = color; ctx.strokeStyle = color;
  // the vessels themselves, faint
  ctx.lineWidth = 2;
  for (const v of vessels) for (let k = 1; k < v.p.length; k++) {
    const q0 = v.p[k - 1], q1 = v.p[k];
    ctx.globalAlpha = 0.07 * lv * vis((q0.y + q1.y) / 2); ctx.beginPath(); ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y); ctx.stroke();
  }
  const r = rng(53);
  const n = Math.round(3 + 6 * lv + 5 * surge), speed = 150 * (1 + 1.2 * surge) * speedK, r0 = 5.5 * (1 + 0.35 * surge);
  const head = (0.55 + 0.25 * surge) * lv;
  for (let i = 0; i < n; i++) {
    const v = vessels[i % vessels.length], sp = speed * (0.65 + 0.7 * r()), size = r0 * (0.65 + 0.6 * r()), ph = r(), dph = r() * 6.28;
    const d0 = t * sp + ph * v.len, depth = (d: number) => 0.5 + 0.5 * Math.sin(d * 0.012 + dph);
    for (let j = 3; j >= 0; j--) {
      const d = d0 - j * size * 2.2, p = v.at(d), dp = depth(d), fade = 1 - j / 4;
      ctx.globalAlpha = head * fade * (j ? 0.5 : 1) * (0.3 + 0.7 * dp) * vis(p.y);
      ctx.beginPath(); ctx.arc(p.x, p.y, size * (0.7 + 0.45 * dp) * (j ? 0.75 * fade : 1), 0, Math.PI * 2); ctx.fill();
    }
    const p = v.at(d0), dp = depth(d0);
    ctx.globalAlpha = 0.18 * lv * (1 + surge) * (0.3 + 0.7 * dp) * vis(p.y); ctx.beginPath(); ctx.arc(p.x, p.y, size * 2.6, 0, Math.PI * 2); ctx.fill();
    if (sparkle && i % 3 === 0) { // a small four-point glint, twinkling (each at its own phase, < 3 per second)
      const tw = Math.max(0, Math.sin(t * 5.2 + i * 1.7)), L = size * (1.6 + 1.6 * tw);
      ctx.globalAlpha = 0.6 * lv * tw * vis(p.y); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p.x - L, p.y); ctx.lineTo(p.x + L, p.y); ctx.moveTo(p.x, p.y - L); ctx.lineTo(p.x, p.y + L); ctx.stroke();
    }
  }
  ctx.restore();
}
/** Round 10b: how far each of the three vessels bows out between two organs (share of the distance; the sign
 *  alternates organ to organ, so the vessels wind instead of running straight). */
export const VESSEL_BEND = [0.16, -0.1, 0.3] as const;
/** A vessel through the points: quadratic curves bowing out by `bend` × the distance, sampled every ~8 px, and its
 *  position at a distance `d` along it (wrapping round). */
export function vesselLine(pts: { x: number; y: number }[], bend: number): { p: { x: number; y: number }[]; len: number; at: (d: number) => { x: number; y: number } } {
  const p: { x: number; y: number }[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy), sg = i % 2 ? 1 : -1;
    const c = { x: (a.x + b.x) / 2 - (dy / (l || 1)) * l * bend * sg, y: (a.y + b.y) / 2 + (dx / (l || 1)) * l * bend * sg };
    const m = Math.max(2, Math.ceil(l / 8));
    for (let k = 1; k <= m; k++) { const u = k / m, w = 1 - u; p.push({ x: w * w * a.x + 2 * w * u * c.x + u * u * b.x, y: w * w * a.y + 2 * w * u * c.y + u * u * b.y }); }
  }
  const seg = p.slice(1).map((q, i) => Math.hypot(q.x - p[i].x, q.y - p[i].y)), len = seg.reduce((x, y) => x + y, 0);
  const at = (d: number) => {
    let x = len > 0 ? ((d % len) + len) % len : 0;
    for (let i = 0; i < seg.length; i++) { if (x <= seg[i]) { const k = x / (seg[i] || 1); return { x: p[i].x + (p[i + 1].x - p[i].x) * k, y: p[i].y + (p[i + 1].y - p[i].y) * k }; } x -= seg[i]; }
    return p[p.length - 1];
  };
  return { p, len, at };
}

/** Round 10b: the 24 h afterglow: a slow breath of light on the organ where the rest still is (period 3.2 s, alpha
 *  0.08–0.2: a breath, never a flash), so the picture is never still under the last words and the end card. */
export const BREATH_S = 3.2;
export function drawBreath(ctx: CanvasRenderingContext2D, at: { x: number; y: number } | null | undefined, t: number, color: string, r = 120, k = 1) {
  if (!at || k <= 0.01) return;
  const a = (0.08 + 0.12 * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / BREATH_S))) * k;
  const g = ctx.createRadialGradient(at.x, at.y, 0, at.x, at.y, r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(at.x - r, at.y - r, 2 * r, 2 * r); ctx.restore();
}

/** Round 10: how strong the bloodstream surge is, `age` seconds after its cue: up in 0.25 s, then easing off (≈ 2.5 s).
 *  With `build` (the surge that rides the riser): up to 0.4 in 0.25 s, building to 1 at the impact, then easing off. */
export function surgeLevel(age: number, build = 0): number {
  if (!(age >= 0) || age > build + 2.6) return 0;
  if (build > 0.25) {
    if (age < build) return age < 0.25 ? 0.4 * smooth(age / 0.25) : 0.4 + 0.6 * smooth((age - 0.25) / (build - 0.25));
    return Math.exp(-(age - build) / 0.8);
  }
  return age < 0.25 ? smooth(age / 0.25) : Math.exp(-(age - 0.25) / 0.8);
}

/** Round 10: the organ "hit" as a new moment lands: a thin ring out from the organ (r 16 → 120 px in 0.5 s) and a soft
 *  glow, in time with the thump in the sound. One per moment (moments are ≥ 2.4 s apart: far under 3 flashes a second). */
export const HIT_S = 0.5;
export function drawOrganHit(ctx: CanvasRenderingContext2D, at: { x: number; y: number } | null | undefined, age: number, color: string, scale = 1) {
  if (!at || age < 0 || age > HIT_S) return;
  const k = easeOutCubic(age / HIT_S);
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = 0.6 * (1 - age / HIT_S); ctx.lineWidth = (5 - 4 * k) * scale;
  ctx.beginPath(); ctx.arc(at.x, at.y, (16 + 104 * k) * scale, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  drawGlowPulse(ctx, at, age * (0.6 / HIT_S), color, 100 * scale);
}

/** Kinetic words (the hook's second line): each word punches in (scale 1.4 → 1, 0.12 s), one after the other from
 *  `from` seconds. Returns the alpha and scale of word i at time t. */
export function punchIn(t: number, i: number, from = 0.15, step = 0.12): { a: number; s: number } {
  const k = Math.max(0, Math.min(1, (t - from - i * step) / 0.12));
  return { a: k, s: 1 + 0.4 * (1 - k) };
}
