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

export type Zoom = 'wide' | 'far' | 'mid' | 'close' | 'body';
/** Height of the picture in metres at each zoom (the frame is 9:16, the comparison halves narrower). */
export const VIEW_H: Record<Zoom, number> = { wide: 1.25, far: 1.05, mid: 0.82, close: 0.56, body: 1.25 }; // (phase 4: 'far' = wide, but on the organ: a big organ's other framing, with the body around it)
/** Organs that are long or spread out: never closer than 'mid' (the whole coil stays in the picture). */
const BIG = new Set(['jejunum', 'ileum', 'colon_asc', 'colon_trans', 'colon_desc', 'cecum', 'aorta', 'vena_cava', 'liver', 'brain']); // brain: the whole head, not a wall of grey matter

/** `tight` 0..1: a slow push-in while a moment is on screen (up to 18 % closer). */
export interface Shot { focus: string[]; zoom: Zoom; tight?: number; /** a fixed framing (split screen) */ pose?: Pose; /** phase 4: the arc of a glide (radians) */ yaw?: number }
export interface Pose { target: V3; viewH: number; /** phase 4: an extra turn around the body (radians), the arc of a glide */ yaw?: number }

/** Where the camera should look and how much height it should show, for a shot. Several organs (the comparison:
 *  one per body) are framed together; organs we don't know frame the whole body. */
export function poseOf(shot: Shot): Pose {
  const pts = shot.focus.map((k) => ORGAN_AT[k]).filter(Boolean);
  if (shot.pose) return shot.pose;
  const push = 1 - 0.18 * Math.max(0, Math.min(1, shot.tight ?? 0)), yaw = shot.yaw ? { yaw: shot.yaw } : {};
  if (shot.zoom === 'body') return { ...bodyPose(shot.focus), ...yaw };
  if (!pts.length || shot.zoom === 'wide') return { target: WIDE_AT, viewH: VIEW_H.wide * push, ...yaw };
  let zoom = shot.zoom;
  if (zoom === 'close' && shot.focus.some((k) => BIG.has(k))) zoom = 'mid';
  const ys = pts.map((p) => p[1]), lo = Math.min(...ys), hi = Math.max(...ys);
  const c: V3 = [pts.reduce((a, p) => a + p[0], 0) / pts.length * 0.6, (lo + hi) / 2, pts.reduce((a, p) => a + p[2], 0) / pts.length];
  // both organs in the picture with room around them; never wider than the whole-body shot
  const viewH = Math.min(VIEW_H.wide, Math.max(VIEW_H[zoom], (hi - lo) * 1.5 + 0.3)) * push;
  return { target: c, viewH, ...yaw };
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
export const rigAt = (p: Pose): Rig => ({ t: 0, x: [...p.target, p.viewH, p.yaw ?? 0], v: [0, 0, 0, 0, 0] });

/** One 1/30 s step of the rig towards `goal`. */
export function stepRig(r: Rig, goal: Pose, dt: number, half = 0.55): Rig {
  const g = [...goal.target, goal.viewH, goal.yaw ?? 0], x = r.x.slice(), v = r.v.slice();
  for (let i = 0; i < 5; i++) [x[i], v[i]] = damp(x[i] ?? 0, v[i] ?? 0, g[i], i === 3 ? half * 1.15 : i === 4 ? half * 1.6 : half, dt);
  return { t: r.t + dt, x, v };
}

/**
 * Camera position and look-at point for the rig: in front of the body, a slow sway left and right (±12°, one swing
 * every 12 s) and slightly from above. `lift` moves the look-at point down by that share of the picture, so the
 * target sits in the open window between the words at the top and the caption at the bottom (0.07 = 134 px higher
 * on a 1920 px frame).
 */
export function cameraOf(r: Rig, fovDeg = FOV, lift = 0.07, seed = 0, style?: Pick<CamStyle, 'sway' | 'swayS' | 'pitch'>): { pos: V3; look: V3 } {
  const [tx, ty, tz, viewH] = r.x, arc = r.x[4] ?? 0;
  const d = distFor(viewH, fovDeg);
  // (round 11, research R5: each food's sway starts its own way, from its variety seed; phase 4: its class sets how
  // wide and how slow the sway is and how much from above, camStyle)
  const s = Math.abs(Math.floor(seed)), dir = s % 2 ? -1 : 1, ph = (s % 7) * 1.3;
  const yaw = dir * (style?.sway ?? 0.21) * Math.sin((2 * Math.PI * (r.t + ph)) / (style?.swayS ?? 12)) + arc, pitch = style?.pitch ?? 0.07;
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

/** Round 10b (critic: "a still picture for ~10 s at the end"): the 24 h beat and the end card keep the camera alive
 *  with a slow push in and out (one breath every IDLE_S seconds, as `tight` 0..1, on top of the sway), from the
 *  frame's own time, so it never jumps. null outside the end. */
export const IDLE_S = 10;
export function idleDrift(fr: { phase?: string; beat?: string; t: number } | null | undefined): number | null {
  if (!fr || (fr.phase !== 'outro' && fr.beat !== 'end')) return null;
  return 0.5 - 0.5 * Math.cos((2 * Math.PI * fr.t) / IDLE_S);
}
/** Round 10b, for the tests: does the picture move from frame a to frame b? The day (and the drink) moves, the
 *  camera glides, pushes in while a moment is read (hk), or breathes at the end (idleDrift). */
export function frameMoves(a: { m: number; t: number; beat?: string; phase?: string; hk?: number }, b: { m: number; t: number; beat?: string; phase?: string; hk?: number }): boolean {
  if (Math.abs(b.m - a.m) > 1e-3) return true;
  if (b.beat === 'teaser' || b.beat === 'rewind' || b.beat === 'glide') return true;
  if (b.hk !== undefined && a.hk !== undefined && Math.abs(b.hk - a.hk) > 1e-6) return true;
  const ia = idleDrift(a), ib = idleDrift(b);
  return ia !== null && ib !== null && Math.abs(ib - ia) > 1e-6;
}

// =====================================================================================================================
// Phase 4 (2026-11-13, owner brief §20-22, §37; master audit Faza 4): the shots as pure functions (moved here from
// AppV4 so the tests film every video of the database exactly as the app does), framed on the organ the card names,
// a whole-body shot for orientation in every video, and a camera style per story class (sway, height, pace, the arc
// of a glide, where the orientation shot falls), so the series is not one template.
// =====================================================================================================================

/** Extents of the organs (2nd-98th percentile of the interior points, pipeline → organ-points.json), metres: [min, max]. */
export const ORGAN_BOX: Record<string, [V3, V3]> = {
  brain: [[-0.058, 1.502, 0.003], [0.058, 1.619, 0.149]], tongue: [[-0.013, 1.434, 0.114], [0.016, 1.463, 0.161]], esophagus: [[-0.006, 1.122, 0.07], [0.02, 1.383, 0.117]],
  stomach: [[0.002, 1.051, 0.091], [0.098, 1.147, 0.185]], duodenum: [[-0.061, 0.989, 0.11], [0.015, 1.074, 0.146]], jejunum: [[-0.08, 0.92, 0.128], [0.091, 1.017, 0.179]],
  ileum: [[-0.073, 0.822, 0.121], [0.082, 0.945, 0.172]], cecum: [[-0.079, 0.872, 0.095], [-0.036, 0.92, 0.138]], colon_asc: [[-0.114, 0.876, 0.095], [-0.071, 1.035, 0.133]],
  colon_trans: [[-0.072, 1.002, 0.117], [0.083, 1.056, 0.191]], colon_desc: [[-0.006, 0.832, 0.058], [0.108, 1.044, 0.132]], rectum: [[-0.018, 0.774, 0.016], [0.032, 0.867, 0.063]],
  liver: [[-0.102, 1.076, 0.058], [0.053, 1.176, 0.195]], pancreas: [[-0.055, 1.007, 0.102], [0.059, 1.068, 0.142]], portal_vein: [[-0.067, 1.083, 0.062], [0.019, 1.155, 0.179]],
  kidney_l: [[0.043, 0.989, 0.064], [0.086, 1.079, 0.097]], kidney_r: [[-0.083, 0.97, 0.069], [-0.037, 1.058, 0.108]], bladder: [[-0.029, 0.796, 0.06], [0.026, 0.826, 0.111]],
  heart: [[-0.03, 1.187, 0.083], [0.06, 1.264, 0.168]], aorta: [[-0.001, 0.997, 0.053], [0.031, 1.313, 0.132]], vena_cava: [[-0.024, 0.959, 0.106], [-0.004, 1.182, 0.125]],
  lung_l: [[0.041, 1.145, 0.038], [0.115, 1.319, 0.135]], lung_r: [[-0.101, 1.157, 0.037], [-0.005, 1.312, 0.133]],
};

/** Organs a card's title names ("Kidneys", "Straight to the liver", "Into the large intestine"): `all` frames every
 *  one of them (both kidneys), else the chapter's own organ when it is one of them, or the first. */
const NAMED: { re: RegExp; organs: string[]; all?: boolean }[] = [
  { re: /\bkidneys?\b/i, organs: ['kidney_l', 'kidney_r'], all: true }, { re: /\bbladder\b/i, organs: ['bladder'] }, { re: /\bliver\b/i, organs: ['liver'] },
  { re: /\bstomach\b/i, organs: ['stomach'] }, { re: /\bsmall intestine\b/i, organs: ['jejunum', 'ileum', 'duodenum'] },
  { re: /\blarge intestine\b|\bcolon\b|\bbowel\b/i, organs: ['colon_trans', 'cecum', 'colon_asc', 'colon_desc', 'rectum'] }, { re: /\bbrain\b/i, organs: ['brain'] },
  { re: /\bheart\b/i, organs: ['heart'] }, { re: /\bpancreas\b/i, organs: ['pancreas'] }, { re: /\bfood pipe\b|\besophagus\b/i, organs: ['esophagus'] },
  { re: /\bmouth\b|\btongue\b/i, organs: ['tongue'] }, { re: /\blungs?\b/i, organs: ['lung_l', 'lung_r'], all: true },
];
/** The organs a beat is about: those its title names, else the chapter's own organ (the one the body highlights).
 *  (Phase 4 bug: beer's "Kidneys" card had the bladder as its chapter organ, so the camera filmed the bladder.) */
export function beatOrgans(title: string | undefined, chapterFocus: string | null | undefined): { organs: string[]; named: boolean } {
  const hits = title ? NAMED.filter((n) => n.re.test(title)) : [];
  if (!hits.length) return { organs: chapterFocus && ORGAN_AT[chapterFocus] ? [chapterFocus] : [], named: false };
  const out = hits.flatMap((n) => (n.all ? n.organs : [chapterFocus && n.organs.includes(chapterFocus) ? chapterFocus : n.organs[0]]));
  return { organs: [...new Set(out)], named: true };
}

/** Story classes (owner brief §23: "videos must not be template-identical"): each films its own way. */
export type StoryClass = 'alcohol' | 'caffeine' | 'sugar' | 'meal' | 'plain';
export function storyClass(f: { alcohol?: boolean; caffeine?: boolean; solid?: boolean; sugar?: boolean }): StoryClass {
  return f.alcohol ? 'alcohol' : f.caffeine ? 'caffeine' : f.solid ? 'meal' : f.sugar ? 'sugar' : 'plain';
}
/** A model run's class (the app and the tests use this one): alcohol, caffeine (≥ 10 mg), a bite, a drink whose
 *  blood sugar rises by 20 mg/dL or more in its first 10 hours, else plain. */
export function classOf(b: { alcoholG?: number; caffeine: { doseMg: number }; story: { chapters: { title: string }[] }; effects: { glucoseMgDl?: ArrayLike<number> } }): StoryClass {
  const g = b.effects.glucoseMgDl;
  let rise = 0;
  if (g && g.length) for (let i = 1; i < Math.min(600, g.length); i++) rise = Math.max(rise, g[i] - g[0]);
  return storyClass({ alcohol: (b.alcoholG ?? 0) > 1, caffeine: b.caffeine.doseMg >= 10, solid: /bite/i.test(b.story.chapters[0]?.title ?? ''), sugar: rise >= 20 });
}
/** How a class films: the spring's pace (`half`, s), the sway (radians each way, seconds per swing), the height (pitch,
 *  radians from above), the arc a glide swings round the body (radians), which framing a moment opens with, and
 *  where in the video the whole-body orientation shot falls. */
export interface CamStyle { cls: StoryClass; half: number; sway: number; swayS: number; pitch: number; arc: number; wideFirst: boolean; orient: 'early' | 'middle' | 'late' }
const CLASS_STYLE: Record<StoryClass, Omit<CamStyle, 'cls'>> = {
  // a night out: slow, low, a long sway; the orientation shot late (the night, the morning after)
  alcohol: { half: 0.62, sway: 0.24, swayS: 14, pitch: 0.05, arc: 0.16, wideFirst: false, orient: 'late' },
  // a jolt: quicker moves, a short sway, a little more from above
  caffeine: { half: 0.48, sway: 0.17, swayS: 10, pitch: 0.09, arc: 0.1, wideFirst: true, orient: 'middle' },
  // a rush: the orientation shot early, then close on the rise
  sugar: { half: 0.52, sway: 0.2, swayS: 11, pitch: 0.07, arc: 0.13, wideFirst: false, orient: 'early' },
  // a long digestion: calm, wide arcs along the gut
  meal: { half: 0.58, sway: 0.22, swayS: 13, pitch: 0.08, arc: 0.18, wideFirst: true, orient: 'middle' },
  // water and plain drinks: the round 11 look
  plain: { half: 0.55, sway: 0.21, swayS: 12, pitch: 0.07, arc: 0.12, wideFirst: false, orient: 'early' },
};
/** The class's style for this food: the seed flips the arc's first direction and nudges the pace (-6 % to +6 %), so
 *  two foods of a class are kin, never copies; the same food films the same way on every export. */
export function camStyle(cls: StoryClass, seed = 0): CamStyle {
  const s = Math.abs(Math.floor(seed)), b = CLASS_STYLE[cls];
  // (phase 4c, structural sameness: pizza and lentils were filmed shot for shot alike; the seed also sets which framing
  // a moment opens with and, for one food in three, moves the orientation shot to the class's neighbouring place)
  const h = Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) >>> 0; // (mixed: two foods' seeds that share low bits still part)
  const ORDER = ['early', 'middle', 'late'] as const, oi = ORDER.indexOf(b.orient), shift = (h >>> 20) % 3;
  const orient = shift === 1 ? ORDER[oi === 2 ? 1 : oi + 1] : b.orient;
  return { cls, ...b, half: b.half * (0.94 + (0.12 * ((s >>> 3) % 11)) / 10), arc: (s >>> 1) % 2 ? -b.arc : b.arc, wideFirst: (h >>> 27) % 2 ? !b.wideFirst : b.wideFirst, orient };
}

/** The camera's plan for a video: its style and the glides (by the moment they lead to) filmed whole-body for
 *  orientation. A glide over a long quiet stretch is wide anyway; one more falls where the class wants it. */
export interface CamPlan { style: CamStyle; /** when the camera pulls back to the whole body, video seconds [from, to) */ wide: [number, number][]; /** phase 4c: whole-body beats that break a long stay on one region of the body, video seconds [from, to) (the organs the card is about stay in the safe frame) */ body?: [number, number][] }
/** A glide this long can carry the orientation shot; the shot lasts at least ORIENT_S (into the next moment's first
 *  second when the glide is short: the camera then pushes in from the whole body to the organ). */
export const ORIENT_MIN_S = 0.9, ORIENT_S = 2.0, ORIENT_SPILL_S = 1.0;
/** Phase 4b (critique M5: lentils kept the large intestine in frame for ~27 s, pizza ~22 s): the camera holds one
 *  organ for at most SHOT_MAX_S; a glide that would carry the same organ on after SHOT_BREAK_S pulls back to the whole
 *  body instead (a real cut in what is seen, between two moments, never over a card being read). */
export const SHOT_BREAK_S = 5, SHOT_MAX_S = 16, SHOT_HOLD_S = 6, HOLD_BREAK_S = 1.0;
type ShotFrame = { beat?: string; phase?: string; stop?: number; from?: number; t: number; m?: number; title?: string; cap?: string };
/** The organs a frame is filmed on, as a key ('' = none: the end, the cold open, the whole body). */
export function organKey(fr: ShotFrame, chapters: { min: number; title: string; focus?: string | null }[]): string {
  if (fr.phase === 'outro' || fr.beat === 'end' || fr.beat === 'teaser' || fr.beat === 'rewind' || fr.phase === 'intro') return '';
  const ch = beatChapter(chapters, { stop: fr.stop, m: fr.m ?? fr.stop ?? 0, title: fr.title });
  return beatOrgans(fr.title, ch.focus).organs.slice().sort().join('+');
}
// ---- Phase 4c (2026-11-14, critique M5 leftover: lentils' long cut still spent ~25 s on the large intestine, broken
// only by a 1 s pull-back): the camera's time on one REGION of the body is capped, and a pull-back shorter than
// REGION_BREAK_S does not reset the count. Past the cap, a whole-body beat (REGION_BREAK_S or longer, with the organs
// the card is about kept in the safe frame and lit) is cut in between two cards, at a glide or at a reframe. ----
/** The regions of the body the camera can stay on (organs that sit together and read as one place on a phone). */
export const REGION: Record<string, string> = {
  brain: 'head', tongue: 'head', esophagus: 'chest', heart: 'chest', aorta: 'chest', lung_l: 'chest', lung_r: 'chest',
  stomach: 'upper', liver: 'upper', pancreas: 'upper', duodenum: 'upper', gallbladder: 'upper', portal_vein: 'upper', vena_cava: 'upper',
  jejunum: 'small', ileum: 'small', cecum: 'large', colon_asc: 'large', colon_trans: 'large', colon_desc: 'large', rectum: 'large',
  kidney_l: 'urinary', kidney_r: 'urinary', bladder: 'urinary',
};
/** The region a list of organs is in (the first one's; 'body' = none: the whole body). */
export const regionOf = (organs: readonly string[]): string => (organs.length ? REGION[organs[0]] ?? 'body' : 'body');
/** A view of another region (or the whole body) breaks a stay only when it lasts this long. */
export const REGION_BREAK_S = 2.5;
/** The longest stay on one region: ~12 s in the long cut, less in Reels (medium) and Shorts, by the video's length. */
export const regionMaxS = (seconds: number) => (seconds > 56 ? 12 : seconds > 33 ? 9 : 6);
/** Whole-body framing whose organs (the card's) sit inside the reel's safe frame: the picture's height grows from
 *  the whole-body shot's until both fit (head to bladder in the picture, the organs between the headline and the
 *  caption). Fractions of the picture from the top: the safe frame (ORGAN_SAFE.reel, with a margin) and the body. */
function bodyPose(focus: readonly string[]): Pose {
  const bx = focus.map((k) => ORGAN_BOX[k]).filter(Boolean);
  const yt = bx.length ? Math.max(...bx.map((b) => b[1][1])) : 1.1, yb = bx.length ? Math.min(...bx.map((b) => b[0][1])) : 1.1;
  const a = 300 / 1920, b = 1290 / 1920, m = 0.03, lift = 0.07;
  let V = VIEW_H.wide, lo = 0, hi = 0;
  for (; V <= 1.6; V += 0.025) {
    lo = Math.max(yt - (0.5 - a) * V, 1.619 - (0.5 - m) * V); hi = Math.min(yb + (b - 0.5) * V, 0.796 + (0.5 - m) * V);
    if (lo <= hi) break;
  }
  const look = lo <= hi ? (lo + hi) / 2 : hi;
  return { target: [0, look + lift * V, WIDE_AT[2]], viewH: Math.min(V, 1.6) };
}
/** The region a frame is filmed on ('' = none: the cold open, the end). */
const regionKey = (k: string) => (k ? regionOf(k.split('+')) : '');
/** The region shotOf films a frame on: the first sip / bite follows the food down (mouth, food pipe, stomach). */
const frameRegion = (f: ShotFrame & { hk?: number }, chapters: { min: number; title: string; focus?: string | null }[]) =>
  (f.stop ?? 0) === 0 && (f.beat === 'hook' || f.beat === 'hold') && f.phase !== 'outro' ? ((f.hk ?? 0) < 0.28 ? 'head' : (f.hk ?? 0) < 0.55 ? 'chest' : 'upper') : regionKey(organKey(f, chapters));
/** Phase 4c: the whole-body beats that keep every stay on one region under regionMaxS. `inView(t)`: the planned
 *  whole-body shots already there. Candidate cut points: a glide's start, a new card, a reframe of a long one. */
function regionBreaks(frames: ShotFrame[], chapters: { min: number; title: string; focus?: string | null }[], wide: [number, number][]): [number, number][] {
  const out: [number, number][] = [], seconds = frames[frames.length - 1]?.t ?? 0, cap = regionMaxS(seconds);
  const endT = frames.find((f) => f.beat === 'end' || f.phase === 'outro')?.t ?? seconds;
  const wideAt = (t: number) => wide.find(([a, b]) => t >= a - 1e-6 && t < b), inOut = (t: number) => out.some(([a, b]) => t >= a - 1e-6 && t < b);
  // (the first sip / bite follows the food down whatever the plan: shotOf films it before any pull-back)
  const first = (f: ShotFrame) => (f.stop ?? 0) === 0 && (f.beat === 'hook' || f.beat === 'hold');
  // (a card with no organ of its own is filmed where the food is, which the plan does not know: '?' counts as the
  // region the camera is on, so the stay goes on)
  const regs = frames.map((f) => (f.beat === 'end' || f.phase !== 'main' ? '' : !first(f) && wideAt(f.t) ? 'body' : frameRegion(f, chapters) || '?'));
  const cand = frames.map((f, i) => {
    const p = frames[i - 1] as (ShotFrame & { pg?: number }) | undefined, q = f as ShotFrame & { pg?: number };
    return !!p && f.t < endT && !first(f) && ((f.beat === 'glide' && p.beat !== 'glide') || (f.beat === 'hold' && p.beat === 'hold' && (f.cap !== p.cap || q.pg !== p.pg)));
  });
  /** when the stay on `reg` running at frame i ends: the next cut point the camera can use, or the start of a view
   *  elsewhere that lasts REGION_BREAK_S, whichever comes first */
  const stayEnd = (i: number, reg: string) => {
    let off: number | null = null;
    for (let k = i + 1; k < frames.length; k++) {
      const t = frames[k].t, r = regs[k] === '?' ? reg : regs[k];
      if (t >= endT) return off ?? endT;
      if (cand[k] && r !== 'body' && off === null && t <= endT - REGION_BREAK_S) return t; // (a cut point too close to the end has no room for the whole body)
      if (r === reg) off = null; else { if (off === null) off = t; if (t - off >= REGION_BREAK_S - 1e-6) return off; }
    }
    return off ?? endT;
  };
  let reg = '', since = 0, other = '', otherSince = 0;
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (f.t >= endT) break;
    const r = inOut(f.t) ? 'body' : regs[i] === '?' ? reg || '?' : regs[i];
    if (!r) { reg = ''; other = ''; continue; }
    // a cut point while a stay runs: would it pass the cap before it ends? then the whole body now (a pull-back
    // already here is held on to REGION_BREAK_S)
    if (cand[i] && reg && reg !== 'body' && !inOut(f.t) && stayEnd(i, reg) - since > cap) {
      const w = wideAt(f.t), t0 = w ? w[0] : f.t, t1 = Math.min(t0 + REGION_BREAK_S + 0.2, endT);
      if (t1 - t0 >= REGION_BREAK_S) {
        if (!w) out.push([f.t, t1]); else if (t1 > w[1]) out.push([w[1], t1]);
        reg = 'body'; since = t0; other = '';
        continue;
      }
    }
    // the stay: another region (or the whole body) counts only once it has lasted REGION_BREAK_S
    if (r === reg) { other = ''; continue; }
    if (r !== other) { other = r; otherSince = f.t; }
    if (!reg || f.t - otherSince >= REGION_BREAK_S - 1e-6) { reg = r; since = otherSince; other = ''; }
  }
  return out;
}

export function camPlanOf(frames: ShotFrame[], style: CamStyle, chapters?: { min: number; title: string; focus?: string | null }[]): CamPlan {
  const base = camPlanBase(frames, style);
  if (!chapters) return base;
  const wide = base.wide.slice(), inWide = (t: number) => wide.some(([a, b]) => t >= a - 1e-6 && t < b);
  let key = '', since = 0;
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (f.beat === 'end' || f.phase === 'outro') break;
    if (inWide(f.t)) { key = ''; continue; }
    const k = organKey(f, chapters);
    const glideStart = f.beat === 'glide' && frames[i - 1]?.beat !== 'glide' && (f.stop ?? 0) < 1440;
    if (glideStart && k && k === key && f.t - since >= SHOT_BREAK_S) {
      let j = i; while (j + 1 < frames.length && frames[j + 1].beat === 'glide') j++;
      const t1 = Math.min(Math.max(frames[j].t + 1 / 30, f.t + ORIENT_S), frames[j].t + ORIENT_SPILL_S);
      wide.push([f.t, t1]); key = ''; continue;
    }
    // a long moment (many cards on one organ): at a new card after SHOT_HOLD_S, a short pull-back (under the 1.2 s a
    // shot needs to settle, so the card's organ is framed again right after)
    const prev = frames[i - 1];
    if (k && k === key && f.beat === 'hold' && prev?.beat === 'hold' && f.cap && prev.cap && f.cap !== prev.cap && f.t - since >= SHOT_HOLD_S) {
      wide.push([f.t, f.t + HOLD_BREAK_S]); key = ''; continue;
    }
    if (k !== key) { key = k; since = f.t; }
  }
  const sorted = wide.sort((a, b) => a[0] - b[0]);
  return { style: base.style, wide: sorted, body: regionBreaks(frames, chapters, sorted) };
}
function camPlanBase(frames: { beat?: string; stop?: number; from?: number; t: number }[], style: CamStyle): CamPlan {
  const glides: { stop: number; t0: number; s: number }[] = [];
  let endT = Infinity;
  for (const f of frames) {
    if (f.beat === 'end') { endT = Math.min(endT, f.t); continue; }
    if (f.beat !== 'glide' || f.stop === undefined) continue;
    const g = glides[glides.length - 1];
    if (g && g.stop === f.stop) g.s = f.t - g.t0; else glides.push({ stop: f.stop, t0: f.t, s: 0 });
  }
  // (not the glide into the 24 h beat: the end card is wide already)
  const ok = glides.filter((g) => g.t0 + g.s < endT - 0.5 && g.stop < 1440);
  const long = ok.filter((g) => g.s >= ORIENT_MIN_S);
  const pool = long.length ? long : ok.length ? [ok.reduce((a, g) => (g.s > a.s ? g : a))] : [];
  if (!pool.length) return { style, wide: [] };
  const mid = (ok[0].t0 + ok[ok.length - 1].t0 + ok[ok.length - 1].s) / 2;
  const pick = style.orient === 'early' ? pool[0] : style.orient === 'late' ? pool[pool.length - 1] : pool.reduce((a, g) => (Math.abs(g.t0 - mid) < Math.abs(a.t0 - mid) ? g : a));
  // (phase 4b: into the next moment by at most ORIENT_SPILL_S, so the organ its card names is framed before it is read on)
  return { style, wide: [[pick.t0, Math.min(pick.t0 + Math.max(pick.s, ORIENT_S), pick.t0 + pick.s + ORIENT_SPILL_S)]] };
}

type FrameLike = { beat?: string; phase?: string; t: number; stop?: number; from?: number; hk?: number; pg?: number };
/** The camera's shot for one video frame: the organ the moment is about plus where the drink is; close while a
 *  moment is read, pulled back while the day races through a quiet stretch, wide for the 24 h beat and the end.
 *  (Moved from AppV4, 2026-11-13; `cam`: the video's CamPlan, phase 4.) */
export function shotOf(fr: FrameLike | null | undefined, beat: (string | null | undefined)[], lead: string | null | undefined = null, union = false, cam?: CamPlan): Shot {
  if (!fr || fr.beat === 'end' || fr.phase === 'outro') return { focus: [], zoom: 'wide', tight: idleDrift(fr) ?? 0 }; // (round 10b: a slow breath, never still)
  const known = beat.filter((x): x is string => !!x && !!ORGAN_AT[x]);
  // the cold open: on the organ of the peak (the chapter's focus at that minute)
  if (fr.beat === 'teaser') return { focus: known.length ? known.slice(0, 1) : lead && ORGAN_AT[lead] ? [lead] : [], zoom: 'mid' };
  // the first sip / bite: follow it down, mouth → food pipe → stomach (the hook is the first part of it)
  if ((fr.stop ?? 0) === 0 && (fr.beat === 'hook' || fr.beat === 'hold')) {
    const h = fr.hk ?? 0;
    return h < 0.28 ? { focus: ['tongue'], zoom: 'mid' } : { focus: [h < 0.55 ? 'esophagus' : 'stomach'], zoom: union ? 'mid' : 'close', tight: Math.max(0, (h - 0.55) / 0.45) };
  }
  // the moment's organs (named by its card, else its chapter's); where the drink is joins them only when it is close
  // to every one of them (phase 4: "close by" was 22 cm from the first one, which pushed beer's kidneys out of the
  // picture under the heart), else the organ would leave the safe frame
  const withLead = lead && ORGAN_AT[lead] && !known.includes(lead) && (union || !known.length || known.every((k) => Math.abs(ORGAN_AT[lead][1] - ORGAN_AT[k][1]) < 0.1)) ? [lead] : [];
  const focus = [...known, ...withLead];
  // phase 4: the glide swings round the body a little (the class's arc, its side turning with each moment), and one
  // glide per video pulls back to the whole body for orientation
  const arc = cam ? cam.style.arc * (Math.round(fr.stop ?? 0) % 2 ? 1 : -1) : 0;
  if (cam?.wide.some(([a, b]) => fr.t >= a - 1e-6 && fr.t < b)) return { focus: [], zoom: 'wide', yaw: fr.beat === 'glide' ? arc : 0 };
  // phase 4c: a whole-body beat that breaks a long stay on one region (the card's organs stay in the safe frame, lit)
  if (cam?.body?.some(([a, b]) => fr.t >= a - 1e-6 && fr.t < b)) return { focus: [...new Set(known)], zoom: 'body', yaw: fr.beat === 'glide' ? arc : 0 };
  if (fr.beat === 'glide') {
    return { focus: [...new Set(focus)], zoom: union || (fr.from !== undefined && (fr.stop ?? 0) - fr.from > 120) ? 'wide' : 'mid', yaw: arc };
  }
  // round 5 (critic: up to 13 s of the same shot): every new card, and every 2.6 s of a long one (fr.pg), reframes:
  // close on the organ, then wider, in turn (phase 4: a class may open wider first, camStyle.wideFirst)
  // (round 6: a big organ - brain, colon, liver - is never closer than 'mid', so its other framing is 'wide')
  // (phase 4: the wider framing keeps to the moment's organs; the drink joins only when it is close by, so the organ
  // the card names stays in the safe frame)
  const alt = ((fr.pg ?? 0) % 2 === 1) !== !!cam?.style.wideFirst;
  if (alt) { const f2 = [...new Set(focus)]; return { focus: f2, zoom: f2.length && f2.every((k) => BIG.has(k)) ? 'far' : 'mid', tight: 0.5 * (fr.hk ?? 0) }; } // (phase 4: 'far', not 'wide': the whole-body shot put the brain under the headline)
  return { focus: [...new Set(focus)], zoom: union ? 'mid' : 'close', tight: fr.hk ?? 0 };
}

/** Where the drink "is" for the camera (AppV4 leadRef): the part of its route with the biggest share, kept until
 *  another has 1.4× its share or it falls under 4 % (hysteresis: no camera ping-pong). */
export function nextLead<K extends string>(cur: K | null, present: [K, { frac: number }][], fracOf: (k: K) => number): K | null {
  if (!present.length) return cur;
  const best = present[0], curFrac = cur ? fracOf(cur) : 0;
  return !cur || best[1].frac > 1.4 * curFrac || curFrac < 0.04 ? best[0] : cur;
}

/** A world point in pixels of a W×H picture filmed from `pos` looking at `look` (vertical field of view `fovDeg`,
 *  three.js's camera with "up" = +y); null behind the camera. */
export function projectFrom(p: V3, pos: V3, look: V3, fovDeg: number, W: number, H: number): { x: number; y: number } | null {
  const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const f = norm(sub(look, pos)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f), d = sub(p, pos);
  const z = dot(d, f);
  if (z <= 1e-6) return null;
  const k = H / 2 / Math.tan((fovDeg / 2) * Math.PI / 180);
  return { x: W / 2 + (dot(d, r) / z) * k, y: H / 2 - (dot(d, u) / z) * k };
}
/** An organ's box on the picture (its 8 corners projected); `dx` = the body's offset (the comparison's sides). */
export function organRect(organ: string, cam: { pos: V3; look: V3 }, fovDeg: number, W: number, H: number, dx = 0): { l: number; r: number; t: number; b: number } | null {
  const bx = ORGAN_BOX[organ];
  if (!bx) return null;
  const ps = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => projectFrom([bx[i & 1][0] + dx, bx[(i >> 1) & 1][1], bx[(i >> 2) & 1][2]], [cam.pos[0] + dx, cam.pos[1], cam.pos[2]], [cam.look[0] + dx, cam.look[1], cam.look[2]], fovDeg, W, H));
  if (ps.some((p) => !p)) return null;
  const xs = ps.map((p) => p!.x), ys = ps.map((p) => p!.y);
  return { l: Math.min(...xs), r: Math.max(...xs), t: Math.min(...ys), b: Math.max(...ys) };
}
/** Where an organ the card is about must be on the picture: inside the platforms' safe zone (share.ts SAFE: no
 *  platform button or caption bar over it). */
export const ORGAN_SAFE = { reel: { l: 80, r: 1000, t: 280, b: 1320 }, feed: { l: 60, r: 1020, t: 50, b: 1290 } } as const;
/** Is the whole body (head to pelvis: brain, liver, stomach and bladder) in the picture? (the orientation shot) */
export function wholeBody(cam: { pos: V3; look: V3 }, fovDeg: number, W: number, H: number, dx = 0): boolean {
  return ['brain', 'bladder', 'liver', 'stomach'].every((o) => { const r = organRect(o, cam, fovDeg, W, H, dx); return !!r && r.l >= 0 && r.r <= W && r.t >= 0 && r.b <= H; });
}

/** Split screen: heads, brains and stomachs of both bodies in view all the time; it breathes in a little while a
 *  moment is read and out again for the quiet hours and the end. (Moved from AppV4, 2026-11-13.) */
export function splitShot(fr: FrameLike | null | undefined, organs: string[] = []): Shot {
  const viewH = !fr || fr.beat === 'hold' || fr.beat === 'hook' ? ((fr?.pg ?? 0) % 2 ? 1.47 : 1.6) - 0.06 * (fr?.hk ?? 0) : 1.62 - 0.1 * (idleDrift(fr) ?? 0); // (round 5: breathes in and out with each card)
  // phase 4: the organs the two cards are about stay inside the safe frame: for a low one (the intestine, the
  // bladder) the camera pans down, the heads slide up under the names (never out of the picture)
  const pose = splitPose(viewH), top0 = pose.target[1] + viewH / 2, px = (y: number) => (y / 1920) * viewH;
  let lo = -Infinity, hi = Infinity;
  for (const o of organs) { const b = ORGAN_BOX[o]; if (!b) continue; lo = Math.max(lo, b[1][1] + px(ORGAN_SAFE.reel.t + 30)); hi = Math.min(hi, b[0][1] + px(ORGAN_SAFE.reel.b - 30)); }
  const top = lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, top0));
  return { focus: [], zoom: 'wide', pose: { target: [0, top - viewH / 2, pose.target[2]], viewH } };
}
/** The chapter a frame's card belongs to: the one with the card's title (the latest at or before its moment), else
 *  the chapter running at that minute. (A card said later keeps its chapter's title: "Half has moved on …".) */
export function beatChapter<C extends { min: number; title: string }>(chapters: C[], fr: { stop?: number; m: number; title?: string }): C {
  const at = (fr.stop ?? fr.m) + 1e-6;
  const byTitle = fr.title ? chapters.filter((c) => c.title === fr.title && c.min <= at + 6) : [];
  if (byTitle.length) return byTitle.reduce((a, c) => (c.min <= at && c.min >= a.min ? c : a), byTitle[0]);
  return chapters.reduce((acc, c) => (at >= c.min ? c : acc), chapters[0]);
}
