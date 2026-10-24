// Camera direction for the shared video (2026-10-23, body-first redesign). Pure maths, no three.js, so the shots are
// unit tested and the comparison video can drive two cameras with exactly the same moves.
//
// A SHOT says what must be in the picture (one organ, or the organs both bodies are busy with) and how tight; the
// rig glides there with a critically damped spring (starts gently, never overshoots, no jitter) and adds a slow
// sway around the body so the 3D reads as 3D. Every frame is a fixed 1/30 s step, so the same plan always films
// the same way.

export type V3 = [number, number, number];

/** Centres of the organs in the anatomy model (mean of the interior points, pipeline → organ-points.json), metres. */
export const ORGAN_AT: Record<string, V3> = {
  brain: [0, 1.563, 0.07], tongue: [0.002, 1.451, 0.137], esophagus: [0.004, 1.233, 0.088], stomach: [0.055, 1.1, 0.14],
  duodenum: [-0.03, 1.029, 0.129], jejunum: [0.006, 0.97, 0.156], ileum: [-0.012, 0.884, 0.148], cecum: [-0.063, 0.89, 0.122],
  colon_asc: [-0.092, 0.954, 0.115], colon_trans: [0.006, 1.026, 0.158], colon_desc: [0.067, 0.918, 0.103], rectum: [0.004, 0.83, 0.039],
  liver: [-0.039, 1.132, 0.136], pancreas: [-0.007, 1.039, 0.125], portal_vein: [-0.027, 1.12, 0.144], kidney_l: [0.065, 1.039, 0.079],
  kidney_r: [-0.06, 1.018, 0.087], bladder: [0, 0.812, 0.083], heart: [0.016, 1.226, 0.124], aorta: [0.013, 1.23, 0.1],
  vena_cava: [-0.014, 1.087, 0.116], gallbladder: [-0.03, 1.08, 0.14], lung_l: [0.076, 1.232, 0.082], lung_r: [-0.05, 1.24, 0.08],
};
/** The whole story at once: head to hips. */
export const WIDE_AT: V3 = [0, 1.2, 0.1];
export const FOV = 33; // the app's camera (AppV4 <SafeCanvas camera fov>)
/** Comparison video: world x of the two bodies, far enough apart that neither shows up in the other's half. */
export const SIDE_X = [-0.7, 0.7] as const;

export type Zoom = 'wide' | 'mid' | 'close';
/** Height of the picture in metres at each zoom (the frame is 9:16, the comparison halves narrower). */
export const VIEW_H: Record<Zoom, number> = { wide: 1.25, mid: 0.82, close: 0.56 };
/** Organs that are long or spread out: never closer than 'mid' (the whole coil stays in the picture). */
const BIG = new Set(['jejunum', 'ileum', 'colon_asc', 'colon_trans', 'colon_desc', 'cecum', 'aorta', 'vena_cava', 'liver', 'brain']); // brain: the whole head, not a wall of grey matter

/** `tight` 0..1: a slow push-in while a moment is on screen (up to 18 % closer). */
export interface Shot { focus: string[]; zoom: Zoom; tight?: number; /** a fixed framing (split screen) */ pose?: Pose }
export interface Pose { target: V3; viewH: number }

/** Where the camera should look and how much height it should show, for a shot. Several organs (the comparison:
 *  one per body) are framed together; organs we don't know frame the whole body. */
export function poseOf(shot: Shot): Pose {
  const pts = shot.focus.map((k) => ORGAN_AT[k]).filter(Boolean);
  if (shot.pose) return shot.pose;
  const push = 1 - 0.18 * Math.max(0, Math.min(1, shot.tight ?? 0));
  if (!pts.length || shot.zoom === 'wide') return { target: WIDE_AT, viewH: VIEW_H.wide * push };
  let zoom = shot.zoom;
  if (zoom === 'close' && shot.focus.some((k) => BIG.has(k))) zoom = 'mid';
  const ys = pts.map((p) => p[1]), lo = Math.min(...ys), hi = Math.max(...ys);
  const c: V3 = [pts.reduce((a, p) => a + p[0], 0) / pts.length * 0.6, (lo + hi) / 2, pts.reduce((a, p) => a + p[2], 0) / pts.length];
  // both organs in the picture with room around them; never wider than the whole-body shot
  const viewH = Math.min(VIEW_H.wide, Math.max(VIEW_H[zoom], (hi - lo) * 1.5 + 0.3)) * push;
  return { target: c, viewH };
}

/** Camera distance that shows `viewH` metres of height. */
export const distFor = (viewH: number, fovDeg = FOV) => viewH / (2 * Math.tan((fovDeg / 2) * Math.PI / 180));

/** Critically damped spring towards a moving goal (Game Programming Gems 4, "smooth damp"): continuous speed, no
 *  overshoot. `half` = seconds to cover half the distance. */
export function damp(x: number, v: number, goal: number, half: number, dt: number): [number, number] {
  const omega = 1.6783 / Math.max(1e-3, half); // ln(2)-ish: half the way after `half` seconds
  const k = omega * dt, e = 1 / (1 + k + 0.48 * k * k + 0.235 * k * k * k);
  const d = x - goal, tmp = (v + omega * d) * dt;
  const nv = (v - omega * tmp) * e;
  return [goal + (d + tmp) * e, nv];
}

/** The rig's state: where it looks, how much it shows, and their speeds. */
export interface Rig { t: number; x: number[]; v: number[] }
export const rigAt = (p: Pose): Rig => ({ t: 0, x: [...p.target, p.viewH], v: [0, 0, 0, 0] });

/** One 1/30 s step of the rig towards `goal`. */
export function stepRig(r: Rig, goal: Pose, dt: number, half = 0.55): Rig {
  const g = [...goal.target, goal.viewH], x = r.x.slice(), v = r.v.slice();
  for (let i = 0; i < 4; i++) [x[i], v[i]] = damp(x[i], v[i], g[i], i === 3 ? half * 1.15 : half, dt);
  return { t: r.t + dt, x, v };
}

/**
 * Camera position and look-at point for the rig: in front of the body, a slow sway left and right (±12°, one swing
 * every 12 s) and slightly from above. `lift` moves the look-at point down by that share of the picture, so the
 * target sits in the open window between the words at the top and the caption at the bottom (0.07 = 134 px higher
 * on a 1920 px frame).
 */
export function cameraOf(r: Rig, fovDeg = FOV, lift = 0.07): { pos: V3; look: V3 } {
  const [tx, ty, tz, viewH] = r.x;
  const d = distFor(viewH, fovDeg);
  const yaw = 0.21 * Math.sin((2 * Math.PI * r.t) / 12), pitch = 0.07;
  const look: V3 = [tx, ty - lift * viewH, tz];
  const pos: V3 = [look[0] + d * Math.sin(yaw) * Math.cos(pitch), look[1] + d * Math.sin(pitch), look[2] + d * Math.cos(yaw) * Math.cos(pitch)];
  return { pos, look };
}

/** Projects a world point with a camera's matrices (column-major, as three.js stores them) to pixels of a W×H
 *  viewport; null when it is behind the camera. */
export function project(p: V3, view: ArrayLike<number>, proj: ArrayLike<number>, W: number, H: number): { x: number; y: number } | null {
  const m = (e: ArrayLike<number>, v: number[]) => [0, 1, 2, 3].map((r) => e[r] * v[0] + e[4 + r] * v[1] + e[8 + r] * v[2] + e[12 + r] * v[3]);
  const c = m(proj, m(view, [p[0], p[1], p[2], 1]));
  if (c[3] <= 1e-6) return null;
  return { x: ((c[0] / c[3] + 1) / 2) * W, y: ((1 - c[1] / c[3]) / 2) * H };
}

/** Split screen (2026-10-24, owner review): both bodies framed so the top of the head sits just under the compact
 *  header (`headPx` from the top of a 1920 px frame) and the stomach stays above the captions; the camera only
 *  breathes in and out a little (`viewH` 1.5–1.62 m). Use with cameraOf(…, lift 0). */
export function splitPose(viewH: number, headPx = 450, frameH = 1920): Pose {
  const top = 1.64 + (headPx / frameH) * viewH; // world height at the top edge of the frame (1.64 = just above the brain)
  return { target: [0, top - viewH / 2, 0.1], viewH };
}
