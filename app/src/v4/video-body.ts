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
import { roundMin } from './timeWords';
import { SEG_LABEL, type Route, type SegId, type SegState } from '../scene/segments';
import { presenceAt, presenceGlow, presenceLiquid, presentOrgans } from '../scene/presence';

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
  bac?: Float64Array; /** B1: the body its BAC is computed for ("70 kg man") */ bacBody?: string; caffeine: { doseMg: number; body: Float64Array }; effects: { glucoseMgDl?: Float64Array; tgMmol?: Float64Array }; route?: Route | null;
  /** round 13: the story, so a note names the minute of the moment the video shows */ story?: { chapters: { min: number; title: string }[] };
}
type Unit = 'mmol/L' | 'mg/dL';

/** Parts of the route with a real share of the drink now, most first. */
export function presentAt(b: BuiltLike, m: number): [SegId, SegState][] {
  const segs = b.route?.segs(m);
  return segs ? (Object.entries(segs) as [SegId, SegState][]).filter(([, v]) => v.frac >= 0.04).sort((x, y) => y[1].frac - x[1].frac) : [];
}

// ---- Phase 4b (critique 2026-11-13, B2: "KIDNEYS / Your kidneys filter the extra water." while the kidneys did not
// light up and the bladder glowed brightest) ----
// A DISPLAY layer on top of the model's glow (scene/presence.ts stays the one source for how much is where): the organ
// a card names is lit, every other organ is held below it, and the organs drawn in front of a back organ (the gut coil
// over the kidneys, for a frontal camera) fade while it is named.
/** Organs a card's words name ("Your kidneys …", "In the small intestine …"): every part of each organ named. */
const ORGAN_WORDS: [RegExp, string[]][] = [
  [/\bkidneys?\b/i, ['kidney_l', 'kidney_r']], [/\bbladder\b/i, ['bladder']], [/\bliver\b/i, ['liver']], [/\bstomach\b/i, ['stomach']],
  [/\bsmall intestine\b/i, ['duodenum', 'jejunum', 'ileum']], [/\blarge intestine\b|\bcolon\b|\bbowel\b/i, ['cecum', 'colon_asc', 'colon_trans', 'colon_desc', 'rectum']],
  [/\bbrain\b/i, ['brain']], [/\bheart\b/i, ['heart']], [/\bpancreas\b/i, ['pancreas']], [/\bfood pipe\b|\besophagus\b/i, ['esophagus']], [/\blungs?\b/i, ['lung_l', 'lung_r']],
];
export function namedOrgans(...texts: (string | undefined | null)[]): string[] {
  const t = texts.filter(Boolean).join(' \n ');
  return [...new Set(ORGAN_WORDS.filter(([re]) => re.test(t)).flatMap(([, o]) => o))];
}
/** The organs the card on screen in a video frame names (its kicker title and its card), while a card is shown (a
 *  moment being read, or the first sip); side 1 = the comparison's right body. The app and the tests use this one. */
export function cardNamed(fr: { beat?: string; phase?: string; title?: string; cap?: string; titleB?: string; capB?: string } | null | undefined, side: 0 | 1 = 0): string[] {
  if (!fr || fr.phase !== 'main' || (fr.beat !== 'hold' && fr.beat !== 'hook')) return [];
  return side ? namedOrgans(fr.titleB, fr.capB) : namedOrgans(fr.title, fr.cap);
}
/** How bright a named organ is drawn (the brain and heart are many overlapping parts: softer, never white). */
export const NAMED_GLOW = 0.95;
export const namedGlow = (o: string) => (o === 'brain' ? 0.5 : o === 'heart' ? 0.42 : o.startsWith('lung') ? 0.35 : NAMED_GLOW);
/** Any other organ stays at most this share of the named organ's brightness (never outshines it). */
export const OTHER_MAX = 0.45;
/** Organs in front of a back organ for the frontal camera (organ boxes, video-cam ORGAN_BOX: z of the kidneys 0.06-0.11,
 *  of the gut coil up to 0.19): faded while the back organ is named, so it is not hidden behind their hologram. */
const GUT_FRONT = ['stomach', 'duodenum', 'jejunum', 'ileum', 'cecum', 'colon_asc', 'colon_trans', 'colon_desc', 'liver', 'gallbladder', 'portal_vein', 'vena_cava'];
export const FRONT_OF: Record<string, string[]> = {
  kidney_l: GUT_FRONT, kidney_r: GUT_FRONT, pancreas: ['stomach', 'colon_trans', 'jejunum', 'duodenum'], aorta: ['jejunum', 'ileum', 'colon_trans'], rectum: ['ileum', 'bladder'],
};
/** The display emphasis for the organs a card names: their glow, the cap on the others, and the organs to fade. */
export function spotlight(glow: Record<string, number>, keep: string[], named: readonly string[]): { glow: Record<string, number>; keep: string[]; hide: string[] } {
  if (!named.length) return { glow, keep, hide: [] };
  const out: Record<string, number> = {}, top = Math.min(...named.map(namedGlow));
  const hide = [...new Set(named.flatMap((o) => FRONT_OF[o] ?? []))].filter((o) => !named.includes(o));
  for (const [k, v] of Object.entries(glow)) out[k] = named.includes(k) ? v : Math.min(v, OTHER_MAX * top * (hide.includes(k) ? 0.4 : 1));
  for (const o of named) out[o] = Math.max(glow[o] ?? 0, namedGlow(o));
  return { glow: out, keep: [...new Set([...keep.filter((k) => !hide.includes(k)), ...named.filter((o) => o !== 'brain')])], hide };
}

/** Organ glow (0..1) and the organs that stay bright at minute m. `focus` = the organ the current moment is about;
 *  `named` (phase 4b, B2) = the organs the card on screen names (namedOrgans), lit above everything else. */
export function bodyGlowAt(b: BuiltLike, m: number, focus?: string | null, sugarKnown = true, named: readonly string[] = []): { glow: Record<string, number>; keep: string[]; hide: string[] } {
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
  // Phase 3 (C5): the organs that have the food or drink now glow in proportion to how much they have (or hold: the
  // liver clearing alcohol), the same numbers as the app (scene/presence.ts); nothing else of the tract lights up
  const p = presenceAt(b.route, mi);
  for (const [k, v] of Object.entries(presenceGlow(p))) glow[k] = Math.max(glow[k] ?? 0, v);
  if (focus) glow[focus] = Math.max(glow[focus] ?? 0, focus === 'brain' ? 0.15 : 0.3);
  const keep = [...new Set([...presentOrgans(p), ...Object.keys(glow)])].filter((k) => k !== 'brain');
  return spotlight(glow, keep, named);
}

/** The drink colour in each organ on the video at minute m (the stream is drawn on top): the app's own map. */
export const bodyLiquidAt = (b: BuiltLike, m: number) => presenceLiquid(presenceAt(b.route, Math.max(0, Math.min(1440, m))), true);

/** A gauge pinned to an organ: a big number, a short label, and (for the main number) its curve over the day. */
export interface Gauge {
  big: string; small: string; level: 0 | 1 | 2; organ: string;
  /** the value over the day, sampled evenly on the video's day axis (u = 0..1), and where we are now */
  curve?: number[]; u?: number;
  color?: string;
  /** Phase 4b (critique 2026-11-13, B1): a warning drawn on the SAME card, in every frame the card is drawn (a BAC
   *  number is never shown without "Never safe to drive after drinking.") */
  warn?: string;
}
/** Phase 4b (critique 2026-11-13, B1: "BAC 0.012–0.031 % · US limit 0.08 %" read as "far under the limit, safe"):
 *  every card, chip or end card that shows a blood alcohol number or a driving limit carries this line. */
export const DRIVE_WARN = 'Never safe to drive after drinking.';
/** B1: a text shows a blood alcohol number or a driving limit (it then needs DRIVE_WARN on the same card). */
export const SHOWS_BAC = /\bBAC\b|\blimit 0\.0\d\b/;
/** B1: the body the BAC range is computed for ("70 kg man"); the range itself is that body's person-to-person spread. */
export const bodyWords = (p: { sex?: string; weightKg: number }) => `${Math.round(p.weightKg)} kg ${p.sex === 'female' ? 'woman' : 'man'}`;
export const DEFAULT_BAC_BODY = '70 kg man'; // (science/profile DEFAULT_PROFILE)
const SAMPLES = 64;
const curveOf = (series: Float64Array, scale = 1) => Array.from({ length: SAMPLES }, (_, i) => at(series, Math.min(1440, minutesFromU(i / (SAMPLES - 1)))) * scale);

/** The headline number at minute m (same choice and words as the app's video pop: alcohol, else a clear blood
 *  sugar change, else caffeine), pinned to the organ it acts on. */
/** Round 13: blood fat shows on the gauge from this rise (mmol/L): what the "Fat in your blood" moment reports. */
export const TG_GAUGE = 0.1;
export function mainGauge(b: BuiltLike, m: number, u: number, unit: Unit, sugarKnown: boolean): Gauge | null {
  const mi = Math.max(0, Math.min(1440, m));
  const bac = b.bac ? at(b.bac, mi) : 0;
  // plain words first, the number second (owner, 2026-10-24); the words are the app's own levels [AL4]:
  // from 0.2 ‰ attention is worse, from 0.5 ‰ reaction time and balance (typical value, the range is underneath)
  const tier = alcoholTier(bac); // (round 12: one ladder for every drink: beer and wine at the same level read the same)
  if (bac >= 0.1) return { big: tier === 'balance' || tier === 'danger' ? 'Balance worse' : tier === 'worse' ? 'Attention worse' : tier === 'may' ? 'Focus may dip' : 'Low, not zero', small: bacPlain(bac, undefined, b.bacBody), level: tier === 'balance' || tier === 'danger' ? 2 : 1, organ: 'brain', curve: curveOf(b.bac!), u, warn: DRIVE_WARN };
  const gs = sugarKnown ? b.effects.glucoseMgDl : undefined;
  const g = gs ? at(gs, mi) / 18.016 : 0;
  if (gs && Math.abs(g) >= 0.5) {
    void unit; // (round 5: said against your usual level, the same in any unit)
    // round 6 (owner): a normal rise after a meal or a sweet drink is said calmly (calm colour), unless it is high
    // (round 18, critic: every rise read "a normal rise"): a rise that tops out within 45 min is "a fast rise"
    let pk = 0; for (let k = 1; k <= Math.min(240, gs.length - 1); k++) if (gs[k] > gs[pk]) pk = k;
    const fast = pk <= 45 && gs[pk] / 18.016 >= 1.5;
    return { big: g >= 3 ? 'Blood sugar up a lot' : g > 0 ? 'Blood sugar up' : 'Blood sugar dip', small: sugarPlain(g, fast), level: g >= 3 ? 2 : g > 0 ? 0 : g <= -1 ? 2 : 1, organ: 'pancreas', curve: curveOf(gs, 1 / 18.016), u };
  }
  const caf = b.caffeine.doseMg >= 10 ? at(b.caffeine.body, mi) : 0;
  if (caf >= 20) return { big: `${Math.round(caf)} mg caffeine`, small: 'still in your body', level: caf >= 200 ? 1 : 0, organ: 'brain', curve: curveOf(b.caffeine.body), u };
  // (round 15, critic D-2: decaf said "watch your blood" and showed no caffeine): a small dose has its gauge too
  const small = b.caffeine.doseMg >= 1 && b.caffeine.doseMg < 10 ? at(b.caffeine.body, mi) : 0;
  if (small >= 0.5) return { big: `${Math.round(small)} mg caffeine`, small: 'in your body: a little', level: 0, organ: 'brain', curve: curveOf(b.caffeine.body), u };
  // round 13 (critic P0-2: salmon's climax, "Blood fat is highest around now", had no gauge): blood fat, the same
  // model number the moment says ("roughly +0.3 mmol/L", foodSim tgDelta), pinned to the heart
  const tgs = b.effects.tgMmol, tg = tgs ? at(tgs, mi) : 0;
  if (tgs && tg >= TG_GAUGE) return { big: 'Blood fat up', small: `+${tg.toFixed(1)} mmol/L triglycerides`, level: 0, organ: 'heart', curve: curveOf(tgs), u };
  return null;
}

/** Round 5 (critic: "‰ and mmol/L mean nothing to most people"): blood sugar against your usual level (the model
 *  starts every curve at a usual 5.0 mmol/L), as a range of percent; blood alcohol as BAC in % (the usual English
 *  way, = ‰ ÷ 10), as a range. */
export const USUAL_MMOL = 5.0;
/** Phase 4b (critique M4): the words the gauge and the end card give a blood sugar curve's peak ("a normal rise", "a fast
 *  rise", "a big rise"), so a hook can be checked against them; undefined without a clear rise. */
export function riseOf(gs: ArrayLike<number> | undefined | null): 'normal' | 'fast' | 'big' | undefined {
  if (!gs || !gs.length) return undefined;
  let pk = 0; for (let k = 1; k <= Math.min(240, gs.length - 1); k++) if (gs[k] > gs[pk]) pk = k; // (as mainGauge)
  const g = gs[pk] / 18.016;
  if (g < 0.5) return undefined;
  return g >= 3 ? 'big' : pk <= 45 && g >= 1.5 ? 'fast' : 'normal';
}
export function sugarPlain(g: number, fast = false): string {
  if (g < 0) return g <= -1 ? 'clearly below usual' : 'a little below usual';
  return `${sugarPct(g)} over usual: ${g >= 3 ? 'a big rise' : fast ? 'a fast rise' : 'a normal rise'}`;
}
/** "+26–62 %": the blood sugar rise as a range against the usual level (the same on the gauge and the end card). */
export function sugarPct(g: number): string {
  const [lo, hi] = glucoseRangeText(g).replace('+', '').split('–').map(Number);
  return `+${Math.round((lo / USUAL_MMOL) * 100)}–${Math.round((hi / USUAL_MMOL) * 100)} %`;
}
export function bacPlain(gPerL: number, range?: [number, number], body = DEFAULT_BAC_BODY): string {
  // round 6: honest precision (one beer: "0.012–0.030 %", never a rounded "0.01–0.03" that reads as zero), and an
  // anchor only where the range reaches it
  const [lo, hi] = (range ?? bacRange(gPerL)).map((x) => x / 10), d = lo < 0.03 ? 3 : 2;
  // (round 7, critic B3: the anchor switched from US to EU mid-video: one limit, the US one, as the UI is US English)
  // (round 9, owner: both driving limits, the US 0.08 % and the EU 0.05 %, wherever the range reaches the lower one)
  // (round 12, critic P1-5: wine at 0.012–0.029 % showed no limit at all, beer did): the limits on every BAC gauge
  const anchor = lo >= 0.08 ? ' · Over US limit 0.08 % · Over EU limit 0.05 %' : ' · US limit 0.08 % · EU limit 0.05 %'; void hi;
  // (phase 4b, critique B1: the range is the spread around ONE body, said with it: "for a 70 kg man")
  return `BAC ${lo.toFixed(d)}–${hi.toFixed(d)} % · for a ${body}${anchor}`;
}
/** Where words for the gauge (round 5: "146 ml · Blood" said nothing). */
const WHERE_SMALL: Partial<Record<SegId, string>> = {
  stomach: 'In your stomach', duodenum: 'In your gut', small: 'In your small intestine', portal: 'On its way to the liver',
  blood: 'In your blood', kidney: 'In your kidneys', colon: 'In your large intestine',
};

const fmtAmount = (v: number) => (v >= 10 ? String(Math.round(v)) : v.toFixed(1));
/** Phase 4b (critique M1): an amount on screen, never more than the serving: `frac` is amount ÷ serving (routes.ts
 *  st()), so a share over 1 is rounding or overshoot of the display, held at the serving. */
export const CONTENT_SEGS: readonly string[] = ['swallow', 'stomach', 'duodenum', 'small'];
export const shownAmount = (id: string, s: { amount: number; frac: number }) => (CONTENT_SEGS.includes(id) && s.frac > 1 && s.amount > 0 ? s.amount / s.frac : s.amount);
export const amountText = (id: string, s: { amount: number; frac: number }) => fmtAmount(shownAmount(id, s));
/** Where most of the food or drink is right now ("Stomach · 214 ml"), pinned to that organ. */
export function whereGauge(b: BuiltLike, m: number): Gauge | null {
  // the food pipe is only passed through in seconds: its amount is not a reading worth pinning (2026-10-24)
  const top = presentAt(b, m).filter(([id]) => id !== 'swallow')[0];
  if (!top || !b.route) return null;
  const v = top[1].amount;
  // everyday words: fructose and glucose are "sugar" on the video (one word anyone knows)
  const big = (top[1].text ?? `${amountText(top[0], top[1])} ${top[1].unit ?? b.route.unit}`).replace(/\b(?:fructose|glucose)\b/g, 'sugar')
    // (round 7: one unit in the video, BAC %, never ‰ next to it)
    .replace(/alcohol ([\d.]+)–([\d.]+) ‰/, (_m, a: string, c: string) => bacPlain(0, [Number(a), Number(c)]).replace(/ · .*$/, ''));
  // the bladder number is the urine made in the last 3 h (routes.ts recent()); over a bladderful it says so
  // (critic: "857 ml in the bladder" is not possible: people pee before that)
  const small = top[0] === 'bladder' ? (v > 500 ? 'Made in 3 h: more than one pee' : 'Urine made in the last 3 h') : WHERE_SMALL[top[0]] ?? SEG_LABEL[top[0]];
  return { big, small, level: 0, organ: SEG_FOCUS_V[top[0]], ...(SHOWS_BAC.test(big) ? { small: `${small} · for a ${b.bacBody ?? DEFAULT_BAC_BODY}`, warn: DRIVE_WARN } : {}) };
}

/** Round 15 (sparse stories, critic SA-2): where most of it is at minute m, as a card ("Most of it is in your small
 *  intestine now."), from the same route model as the where-gauge; null for the bladder and unknown places. */
export function whereCard(b: BuiltLike, m: number): string | null {
  const top = presentAt(b, m).filter(([id]) => id !== 'swallow')[0];
  const small = top ? WHERE_SMALL[top[0]] : undefined;
  // (round 17, critic P2-CR: "It collects in your bladder." then "Most of it is in your blood now." read as urine): it says what
  const t0 = b.story?.chapters[0]?.title ?? '', what = /bite and sip/i.test(t0) ? 'the meal' : /bite/i.test(t0) ? 'the food' : 'the drink';
  // (round 18, critic: "The food is mostly in your blood.": nutrients go into the blood, not the food)
  if (top?.[0] === 'blood') return `Most of ${what} has been absorbed now.`;
  return small && /^In your /.test(small) ? `${what.charAt(0).toUpperCase()}${what.slice(1)} is mostly ${small.charAt(0).toLowerCase()}${small.slice(1)}.` : null;
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
    // (round 15, critic N-2: the hero said "Blood sugar up" over a green "Steady all day"): a rise the gauge shows is
    // named, as a normal one, at the same minute as the hero
    if (level === 0) { const gs0 = b.effects.glucoseMgDl; if (gs0) { let pk0 = 0; for (let k = 1; k <= Math.min(1440, gs0.length - 1); k++) if (gs0[k] > gs0[pk0]) pk0 = k; const mo = b.story?.chapters.find((c) => /^(Blood sugar peak|Sugar rises)$/.test(c.title)); if (gs0[pk0] / 18.016 >= 0.5) return `Normal rise, peak ${inText(mo ? mo.min : pk0)}`; } return 'Steady all day'; }
    const g = b.effects.glucoseMgDl ? at(b.effects.glucoseMgDl, mi) / 18.016 : 0;
    // (round 13, critic P0-1: "Sugar peak 13 min in" was the minute the rise crossed the line, the video's PEAK was at
    // +0:20): the peak's own minute, the same argmax the "Blood sugar peak" moment uses (foodSim glucosePeakMin)
    if (g < 0) return `Dips below normal ${t}`;
    const gs = b.effects.glucoseMgDl!; let pk = 0; for (let k = 1; k <= Math.min(1440, gs.length - 1); k++) if (gs[k] > gs[pk]) pk = k;
    const moment = b.story?.chapters.find((c) => /^(Blood sugar peak|Sugar rises)$/.test(c.title)); if (moment) pk = moment.min; // (the video's own PEAK moment)
    return level === 2 ? `Big sugar spike ${inText(pk)}` : `Sugar peak ${inText(pk)}`;
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
  // (round 13: the gauge's own words, short enough for the comparison's narrow end card)
  if (tier === 'worse') return `Attention worse ${t}`;
  if (tier === 'may') return `Focus may dip ${t}`;
  if (tier === 'low') return `Alcohol in blood ${t}`;
  if (caf >= 200) return level === 2 ? `Too much caffeine ${t}` : `A lot of caffeine ${t}`;
  return 'Sleep may be a little lighter';
}
/** The end card's blood sugar line in plain words ("not measured" read like an error). */
// (round 6: the same range as the gauge, critic P0: "+45 %" on the end card vs "26–62 %" on the gauge)
export const plainSugar = (peak: number | null, _text?: string) => (peak === null ? 'not tracked here' : peak < 0.3 ? 'steady' : `${sugarPct(peak)}, ${peak >= 3 ? 'a big rise' : 'normal'}`);
/** When in the day, in words: "13 min in", "1½ h in" (round 6: "+0:13" read like a code). */
export function inText(m: number): string {
  // (round 13: "1 h 50 min in", never a rounded "2 h"; master audit 2026-11-12, C12: but never more precise than the
  // model either: to 5 min under an hour, to 15 min from an hour on, roundMin; "1 h 2 min in" is "1 h in")
  const r = roundMin(m);
  if (r < 60) return `${r} min in`;
  const h = Math.floor(r / 60), mm = r % 60;
  return mm ? `${h} h ${mm} min in` : `${h} h in`;
}
