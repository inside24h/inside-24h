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

/** The bloodstream: soft dots travelling gut → liver → heart → brain along the organs' projected positions, as many
 *  and as bright as the level of the drink's main substance in the blood (`level` 0..1). */
export function drawBloodFlow(ctx: CanvasRenderingContext2D, path: ({ x: number; y: number } | null | undefined)[], t: number, level: number, color: string) {
  const pts = path.filter((p): p is { x: number; y: number } => !!p);
  if (pts.length < 2 || level <= 0.03) return;
  const seg = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y)), total = seg.reduce((a, b) => a + b, 0);
  if (total < 20) return;
  const pos = (d: number) => { let x = d % total; for (let i = 0; i < seg.length; i++) { if (x <= seg[i]) { const k = x / (seg[i] || 1); return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * k, y: pts[i].y + (pts[i + 1].y - pts[i].y) * k }; } x -= seg[i]; } return pts[pts.length - 1]; };
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = color;
  const n = Math.round(4 + 10 * level);
  for (let i = 0; i < n; i++) {
    const p = pos(t * 160 + (i / n) * total);
    ctx.globalAlpha = 0.5 * level; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.18 * level; ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** Kinetic words (the hook's second line): each word punches in (scale 1.4 → 1, 0.12 s), one after the other from
 *  `from` seconds. Returns the alpha and scale of word i at time t. */
export function punchIn(t: number, i: number, from = 0.15, step = 0.12): { a: number; s: number } {
  const k = Math.max(0, Math.min(1, (t - from - i * step) / 0.12));
  return { a: k, s: 1 + 0.4 * (1 - k) };
}
