// What the body shows in the shared video at a given minute (2026-10-23, body-first redesign), shared by the single
// video and both sides of the comparison: which organs light up, and the two small gauges pinned to the body
// (where the food or drink is now, and the one number that matters: blood alcohol, blood sugar or caffeine).
// Everything comes from the product's own model (built); nothing here makes a new claim:
// - the brain lights while caffeine or alcohol is in the blood (chapters: "reaches your brain");
// - the pancreas lights while blood sugar is up (chapters: "your pancreas releases insulin");
// - the organ the current moment is about lights (its chapter's focus);
// - the organs the drink is passing through stay bright, the rest of the body dims.
import { at } from '../science/espressoSim';
import { bacRangeText, glucoseRangeTextIn } from '../science/ranges';
import { minutesFromU } from '../time';
import { SEG_LABEL, type Route, type SegId, type SegState } from '../scene/segments';

/** Organs each part of the drink's route runs through (as AppV4 SEG_ORGANS) and where its gauge points. */
export const SEG_ORGANS_V: Record<SegId, string[]> = {
  swallow: ['tongue', 'esophagus'], stomach: ['stomach'], duodenum: ['duodenum', 'pancreas', 'gallbladder'], small: ['jejunum', 'ileum'],
  portal: ['portal_vein', 'liver'], blood: ['heart', 'aorta', 'vena_cava'], kidney: ['kidney_l', 'kidney_r'], bladder: ['bladder'],
  colon: ['cecum', 'colon_asc', 'colon_trans', 'colon_desc', 'rectum'],
};
export const SEG_FOCUS_V: Record<SegId, string> = {
  swallow: 'esophagus', stomach: 'stomach', duodenum: 'duodenum', small: 'jejunum', portal: 'liver', blood: 'heart', kidney: 'kidney_l', bladder: 'bladder', colon: 'colon_trans',
};

export interface BuiltLike {
  bac?: Float64Array; caffeine: { doseMg: number; body: Float64Array }; effects: { glucoseMgDl?: Float64Array }; route?: Route | null;
}
type Unit = 'mmol/L' | 'mg/dL';

/** Parts of the route with a real share of the drink now, most first. */
export function presentAt(b: BuiltLike, m: number): [SegId, SegState][] {
  const segs = b.route?.segs(m);
  return segs ? (Object.entries(segs) as [SegId, SegState][]).filter(([, v]) => v.frac >= 0.04).sort((x, y) => y[1].frac - x[1].frac) : [];
}

/** Organ glow (0..1) and the organs that stay bright at minute m. `focus` = the organ the current moment is about. */
export function bodyGlowAt(b: BuiltLike, m: number, focus?: string | null, sugarKnown = true): { glow: Record<string, number>; keep: string[] } {
  const mi = Math.max(0, Math.min(1440, m));
  const glow: Record<string, number> = {};
  const caf = b.caffeine.doseMg >= 10 ? at(b.caffeine.body, mi) : 0;
  const bac = b.bac ? at(b.bac, mi) : 0;
  // the brain is many overlapping parts and turns white when shown at full brightness: it stays in the dimmed
  // layer (not in `keep`) and its glow carries it
  const brain = Math.max(caf >= 8 ? Math.min(0.45, 0.15 + caf / 250) : 0, bac >= 0.05 ? Math.min(0.5, 0.18 + bac / 1) : 0);
  if (brain > 0) glow.brain = brain;
  const g = sugarKnown && b.effects.glucoseMgDl ? at(b.effects.glucoseMgDl, mi) / 18.016 : 0;
  if (g >= 0.5) glow.pancreas = Math.min(0.75, 0.25 + g / 4);
  const present = presentAt(b, mi);
  if (present.some(([id]) => id === 'portal')) glow.liver = Math.max(glow.liver ?? 0, 0.3);
  if (focus) glow[focus] = Math.max(glow[focus] ?? 0, focus === 'brain' ? 0.15 : 0.5);
  const keep = [...new Set([...present.flatMap(([id]) => SEG_ORGANS_V[id]), ...Object.keys(glow)])].filter((k) => k !== 'brain');
  return { glow, keep };
}

/** A gauge pinned to an organ: a big number, a short label, and (for the main number) its curve over the day. */
export interface Gauge {
  big: string; small: string; level: 0 | 1 | 2; organ: string;
  /** the value over the day, sampled evenly on the video's day axis (u = 0..1), and where we are now */
  curve?: number[]; u?: number;
  color?: string;
}
const SAMPLES = 64;
const curveOf = (series: Float64Array, scale = 1) => Array.from({ length: SAMPLES }, (_, i) => at(series, Math.min(1440, minutesFromU(i / (SAMPLES - 1)))) * scale);

/** The headline number at minute m (same choice and words as the app's video pop: alcohol, else a clear blood
 *  sugar change, else caffeine), pinned to the organ it acts on. */
export function mainGauge(b: BuiltLike, m: number, u: number, unit: Unit, sugarKnown: boolean): Gauge | null {
  const mi = Math.max(0, Math.min(1440, m));
  const bac = b.bac ? at(b.bac, mi) : 0;
  // plain words first, the number second (owner, 2026-10-24); the words are the app's own levels [AL4]:
  // from 0.2 ‰ attention is worse, from 0.5 ‰ reaction time and balance (typical value, the range is underneath)
  if (bac >= 0.1) return { big: bac >= 0.5 ? 'Balance worse' : bac >= 0.2 ? 'Attention worse' : 'Low, not zero', small: `Blood alcohol ${bacRangeText(bac)}`, level: bac >= 0.5 ? 2 : 1, organ: 'brain', curve: curveOf(b.bac!), u };
  const gs = sugarKnown ? b.effects.glucoseMgDl : undefined;
  const g = gs ? at(gs, mi) / 18.016 : 0;
  if (gs && Math.abs(g) >= 0.5) {
    const n = g > 0 ? glucoseRangeTextIn(g, unit).replace(/ .*$/, '') : unit === 'mg/dL' ? `${Math.round(g * 18.016)}` : g.toFixed(1);
    return { big: g > 0 ? 'Blood sugar up' : 'Blood sugar dip', small: `${n} ${unit} vs. before`, level: g >= 3 || g <= -1 ? 2 : 1, organ: 'pancreas', curve: curveOf(gs, 1 / 18.016), u };
  }
  const caf = b.caffeine.doseMg >= 10 ? at(b.caffeine.body, mi) : 0;
  if (caf >= 20) return { big: `${Math.round(caf)} mg caffeine`, small: 'still in your body', level: caf >= 200 ? 1 : 0, organ: 'brain', curve: curveOf(b.caffeine.body), u };
  return null;
}

/** Where most of the food or drink is right now ("Stomach · 214 ml"), pinned to that organ. */
export function whereGauge(b: BuiltLike, m: number): Gauge | null {
  // the food pipe is only passed through in seconds: its amount is not a reading worth pinning (2026-10-24)
  const top = presentAt(b, m).filter(([id]) => id !== 'swallow')[0];
  if (!top || !b.route) return null;
  const v = top[1].amount;
  // everyday words: fructose and glucose are "sugar" on the video (one word anyone knows)
  const big = (top[1].text ?? `${v >= 10 ? Math.round(v) : v.toFixed(1)} ${top[1].unit ?? b.route.unit}`).replace(/\b(?:fructose|glucose)\b/g, 'sugar');
  return { big, small: SEG_LABEL[top[0]], level: 0, organ: SEG_FOCUS_V[top[0]] };
}

/** Video colours (2026-10-24, owner review: the brain glowed white-blue): a calm violet tint for the brain, whose
 *  many overlapping parts add up to white in its usual pale colour. */
export const VIDEO_PALETTE: Record<string, string> = { brain: '#6f5fd8' };
/** Light drinks (beer, water, milk) are drawn as a thin, soft stream in the video, not a thick bright tube. */
export function isLightDrink(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.4;
}

/** The brain's colour on the video (creative spec V9, never white): calm violet, warming to green with caffeine or to
 *  amber with alcohol, in proportion to the model's level now against its peak of the day. */
export function paletteAt(b: BuiltLike, m: number): Record<string, string> {
  const mi = Math.max(0, Math.min(1440, m));
  const rel = (sr?: Float64Array) => { if (!sr) return 0; let mx = 0; for (let i = 0; i < sr.length; i += 5) mx = Math.max(mx, sr[i]); return mx > 0 ? at(sr, mi) / mx : 0; };
  const alc = b.bac ? rel(b.bac) : 0, caf = b.caffeine.doseMg >= 10 ? rel(b.caffeine.body) : 0;
  const k = Math.round(Math.max(alc, caf) * 10) / 10; // steps of 10 %: the colour changes calmly
  const to = alc >= caf ? [0xff, 0xb0, 0x2e] : [0x3d, 0xdc, 0x84], from = [0x6f, 0x5f, 0xd8];
  const c = from.map((v, i) => Math.round(v + (to[i] - v) * k * 0.85));
  return { brain: `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}` };
}
