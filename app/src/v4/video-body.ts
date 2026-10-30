// What the body shows in the shared video at a given minute (2026-10-23, body-first redesign), shared by the single
// video and both sides of the comparison: which organs light up, and the two small gauges pinned to the body
// (where the food or drink is now, and the one number that matters: blood alcohol, blood sugar or caffeine).
// Everything comes from the product's own model (built); nothing here makes a new claim:
// - the brain lights while caffeine or alcohol is in the blood (chapters: "reaches your brain");
// - the pancreas lights while blood sugar is up (chapters: "your pancreas releases insulin");
// - the organ the current moment is about lights (its chapter's focus);
// - the organs the drink is passing through stay bright, the rest of the body dims.
import { at } from '../science/espressoSim';
import { bacRange, glucoseRangeText } from '../science/ranges';
import { alcoholTier, ANY_GL } from '../science/alcoholClock';
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
  const tier = alcoholTier(bac); // (round 12: one ladder for every drink: beer and wine at the same level read the same)
  if (bac >= 0.1) return { big: tier === 'balance' || tier === 'danger' ? 'Balance worse' : tier === 'worse' ? 'Attention worse' : tier === 'may' ? 'Focus may dip' : 'Low, not zero', small: bacPlain(bac), level: tier === 'balance' || tier === 'danger' ? 2 : 1, organ: 'brain', curve: curveOf(b.bac!), u };
  const gs = sugarKnown ? b.effects.glucoseMgDl : undefined;
  const g = gs ? at(gs, mi) / 18.016 : 0;
  if (gs && Math.abs(g) >= 0.5) {
    void unit; // (round 5: said against your usual level, the same in any unit)
    // round 6 (owner): a normal rise after a meal or a sweet drink is said calmly (calm colour), unless it is high
    return { big: g >= 3 ? 'Blood sugar up a lot' : g > 0 ? 'Blood sugar up' : 'Blood sugar dip', small: sugarPlain(g), level: g >= 3 ? 2 : g > 0 ? 0 : g <= -1 ? 2 : 1, organ: 'pancreas', curve: curveOf(gs, 1 / 18.016), u };
  }
  const caf = b.caffeine.doseMg >= 10 ? at(b.caffeine.body, mi) : 0;
  if (caf >= 20) return { big: `${Math.round(caf)} mg caffeine`, small: 'still in your body', level: caf >= 200 ? 1 : 0, organ: 'brain', curve: curveOf(b.caffeine.body), u };
  return null;
}

/** Round 5 (critic: "‰ and mmol/L mean nothing to most people"): blood sugar against your usual level (the model
 *  starts every curve at a usual 5.0 mmol/L), as a range of percent; blood alcohol as BAC in % (the usual English
 *  way, = ‰ ÷ 10), as a range. */
export const USUAL_MMOL = 5.0;
export function sugarPlain(g: number): string {
  if (g < 0) return g <= -1 ? 'clearly below usual' : 'a little below usual';
  return `${sugarPct(g)} over usual: ${g >= 3 ? 'a big rise' : 'a normal rise'}`;
}
/** "+26–62 %": the blood sugar rise as a range against the usual level (the same on the gauge and the end card). */
export function sugarPct(g: number): string {
  const [lo, hi] = glucoseRangeText(g).replace('+', '').split('–').map(Number);
  return `+${Math.round((lo / USUAL_MMOL) * 100)}–${Math.round((hi / USUAL_MMOL) * 100)} %`;
}
export function bacPlain(gPerL: number, range?: [number, number]): string {
  // round 6: honest precision (one beer: "0.012–0.030 %", never a rounded "0.01–0.03" that reads as zero), and an
  // anchor only where the range reaches it
  const [lo, hi] = (range ?? bacRange(gPerL)).map((x) => x / 10), d = lo < 0.03 ? 3 : 2;
  // (round 7, critic B3: the anchor switched from US to EU mid-video: one limit, the US one, as the UI is US English)
  // (round 9, owner: both driving limits, the US 0.08 % and the EU 0.05 %, wherever the range reaches the lower one)
  // (round 12, critic P1-5: wine at 0.012–0.029 % showed no limit at all, beer did): the limits on every BAC gauge
  const anchor = lo >= 0.08 ? ' · Over US limit 0.08 % · Over EU limit 0.05 %' : ' · US limit 0.08 % · EU limit 0.05 %'; void hi;
  return `BAC ${lo.toFixed(d)}–${hi.toFixed(d)} %${anchor}`;
}
/** Where words for the gauge (round 5: "146 ml · Blood" said nothing). */
const WHERE_SMALL: Partial<Record<SegId, string>> = {
  stomach: 'In your stomach', duodenum: 'In your gut', small: 'In your small intestine', portal: 'On its way to the liver',
  blood: 'In your blood', kidney: 'In your kidneys', colon: 'In your large intestine',
};

/** Where most of the food or drink is right now ("Stomach · 214 ml"), pinned to that organ. */
export function whereGauge(b: BuiltLike, m: number): Gauge | null {
  // the food pipe is only passed through in seconds: its amount is not a reading worth pinning (2026-10-24)
  const top = presentAt(b, m).filter(([id]) => id !== 'swallow')[0];
  if (!top || !b.route) return null;
  const v = top[1].amount;
  // everyday words: fructose and glucose are "sugar" on the video (one word anyone knows)
  const big = (top[1].text ?? `${v >= 10 ? Math.round(v) : v.toFixed(1)} ${top[1].unit ?? b.route.unit}`).replace(/\b(?:fructose|glucose)\b/g, 'sugar')
    // (round 7: one unit in the video, BAC %, never ‰ next to it)
    .replace(/alcohol ([\d.]+)–([\d.]+) ‰/, (_m, a: string, c: string) => bacPlain(0, [Number(a), Number(c)]).replace(/ · .*$/, ''));
  // the bladder number is the urine made in the last 3 h (routes.ts recent()); over a bladderful it says so
  // (critic: "857 ml in the bladder" is not possible: people pee before that)
  const small = top[0] === 'bladder' ? (v > 500 ? 'Made in 3 h: more than one pee' : 'Urine made in the last 3 h') : WHERE_SMALL[top[0]] ?? SEG_LABEL[top[0]];
  return { big, small, level: 0, organ: SEG_FOCUS_V[top[0]] };
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

/** The end card's line for one light, in plain words (round 4, owner: "Mild stress at 13:13" was cryptic): what
 *  happened and when, from the same model numbers that set the light. `t` is the clock time of that minute. */
export function plainNote(key: 'energy' | 'heart' | 'water' | 'brain', level: 0 | 1 | 2, m: number, b: BuiltLike, t: string, sugarUnknown = false): string {
  const mi = Math.max(0, Math.min(1440, m));
  if (key === 'energy') {
    if (sugarUnknown) return 'Not tracked for this one';
    if (level === 0) return 'Steady all day';
    const g = b.effects.glucoseMgDl ? at(b.effects.glucoseMgDl, mi) / 18.016 : 0;
    return g < 0 ? `Dips below normal ${t}` : level === 2 ? `Big sugar spike ${t}` : `Sugar peak ${t}`; // (round 12, critic P2-4: "Sugar up for a while" read badly)
  }
  if (key === 'heart') return level === 0 ? 'Normal all day' : level === 2 ? `Pulse clearly up ${t}` : `Pulse a little up ${t}`;
  if (key === 'water') return level === 0 ? 'Fine all day' : level === 2 ? `Short of water ${t}` : `A bit short of water ${t}`;
  if (level === 0) return 'Fine all day';
  // (round 12: with alcohol the light is yellow from the first minutes; the note names its peak, "… 41 min in", not "2 min in")
  let pm = mi; if (b.bac) for (let k = 0; k <= Math.min(1440, b.bac.length - 1); k++) if (b.bac[k] > b.bac[pm]) pm = k;
  const atPeak = !!b.bac && b.bac[pm] > ANY_GL, bac = b.bac ? at(b.bac, atPeak ? pm : mi) : 0, caf = b.caffeine.doseMg >= 1 ? at(b.caffeine.body, mi) : 0;
  if (atPeak) t = inText(pm);
  const tier = alcoholTier(bac); // (round 12: the same ladder as the gauge and the light)
  if (tier === 'balance' || tier === 'danger') return `Balance worse ${t}`;
  if (tier === 'worse') return `Attention worse ${t}`;
  if (tier === 'may') return `Attention may be worse ${t}`;
  if (tier === 'low') return `Alcohol in your blood ${t}`;
  if (caf >= 200) return level === 2 ? `Too much caffeine ${t}` : `A lot of caffeine ${t}`;
  return 'Sleep may be a little lighter';
}
/** The end card's blood sugar line in plain words ("not measured" read like an error). */
// (round 6: the same range as the gauge, critic P0: "+45 %" on the end card vs "26–62 %" on the gauge)
export const plainSugar = (peak: number | null, _text?: string) => (peak === null ? 'not tracked here' : peak < 0.3 ? 'steady' : `${sugarPct(peak)}, ${peak >= 3 ? 'a big rise' : 'normal'}`);
/** When in the day, in words: "13 min in", "1½ h in" (round 6: "+0:13" read like a code). */
export function inText(m: number): string {
  if (m < 55) return `${Math.max(1, Math.round(m))} min in`;
  const h = Math.round(m / 30) / 2, w = Math.floor(h);
  return `${w}${h - w >= 0.5 ? '½' : ''} h in`;
}
