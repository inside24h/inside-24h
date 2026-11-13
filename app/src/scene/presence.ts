// Phase 3 (master audit C5, owner decision 2026-11-12): the body shows the food or drink ONLY where the model has it at
// this minute, and only as much as is there. One source for every view: the route model (route.segs = where it is,
// route.held = what an organ holds), mapped here to
//  - the stream intensity of each part of the liquid route (scene/LiquidRoute, app and video),
//  - the drink colour in each organ (Body `liquid`: stomach level, tint of tubes and holding organs; also the 2D body),
//  - the glow of each organ that has some of it (Body `glow`).
// The scale is LINEAR: an organ with 90 % of the serving shows 0.9, one with 4 % shows 0.04 (barely), and below 2 %
// nothing (no whole-tract glow). No three.js here, so tests and the 2D body use the same numbers.
import volumesJson from '../assets/organ-volumes.json';
import type { Route, SegId, SegState } from './segments';

/** Below this share nothing is drawn (a speck of 1 % is not "there" for the eye, and would light the whole tract). */
export const SHOW_MIN = 0.02;
/** How strongly a share is drawn: linear, 0 under SHOW_MIN, at most 1. */
export const presence = (frac: number | undefined): number => (frac !== undefined && Number.isFinite(frac) && frac >= SHOW_MIN ? Math.min(1, frac) : 0);

/** Organs each part of the route runs through (the food is IN these; the pancreas and gallbladder only help). */
export const SEG_BODY: Record<SegId, string[]> = {
  swallow: ['tongue', 'esophagus'], stomach: ['stomach'], duodenum: ['duodenum'], small: ['jejunum', 'ileum'],
  portal: ['portal_vein'], blood: ['heart', 'aorta', 'vena_cava'], kidney: ['kidney_l', 'kidney_r'], bladder: ['bladder'],
  colon: ['cecum', 'colon_asc', 'colon_trans', 'colon_desc', 'rectum'],
};
/** Organs the stream of the liquid route runs through: with the stream drawn they get only a light wash (the stream shows it). */
const ON_STREAM = new Set(['tongue', 'esophagus', 'duodenum', 'jejunum', 'ileum', 'portal_vein', 'heart', 'aorta', 'vena_cava', 'kidney_l', 'kidney_r', 'cecum', 'colon_asc', 'colon_trans', 'colon_desc', 'rectum']);
/** Organs whose hologram glows with what they hold. Not the brain and heart: their many overlapping parts add up to white. */
const GLOWS = new Set(['stomach', 'duodenum', 'jejunum', 'ileum', 'liver', 'portal_vein', 'aorta', 'vena_cava', 'kidney_l', 'kidney_r', 'bladder', 'cecum', 'colon_asc', 'colon_trans', 'colon_desc', 'rectum', 'esophagus']);

/** Tint of an organ the stream runs through, per unit of share (the stream itself carries the colour). */
export const TINT_ON_STREAM = 0.3;
/** Tint of an organ that holds it without a stream (liver, brain) or of any organ when no stream is drawn (2D body). */
export const TINT_HELD = 0.85;
/** Stomach: the drink colour fills the whole organ in proportion to the share, plus the level by volume. */
export const TINT_STOMACH = 0.55;
/** Hologram glow of an organ with a full share. */
export const GLOW_FULL = 0.6;
const STOMACH_ML = (volumesJson as Record<string, number>).stomach * 1000; // ≈ 570 ml in the BodyParts3D model
const RESTING_ML = 35; // fasted stomach holds ~35 ml [water.md A1]; shown only while the meal is there
const BLADDER_ML = 400;

export interface Presence {
  /** stream intensity of each part of the route (0..1) */ seg: Partial<Record<SegId, number>>;
  /** share of each organ (0..1): what passes through it now or what it holds */ organ: Record<string, number>;
  /** the route state it came from (amounts for the stomach level and the bladder) */ segs: Partial<Record<SegId, SegState>>;
}
const EMPTY: Presence = { seg: {}, organ: {}, segs: {} };

/** Where the food or drink is at minute m, and how much, from the route model. */
export function presenceAt(route: Route | null | undefined, m: number): Presence {
  if (!route) return EMPTY;
  const segs = route.segs(m), seg: Partial<Record<SegId, number>> = {}, organ: Record<string, number> = {};
  for (const id of Object.keys(segs) as SegId[]) {
    const v = presence(segs[id]?.frac);
    seg[id] = v;
    if (v > 0) for (const o of SEG_BODY[id]) organ[o] = Math.max(organ[o] ?? 0, v);
  }
  // what organs hold: replaces the whole-segment share where it is more precise (each part of the colon)
  const held = route.held?.(m) ?? {};
  for (const [o, f] of Object.entries(held)) {
    const v = presence(f);
    if (o.startsWith('colon') || o === 'cecum' || o === 'rectum') { if (v > 0) organ[o] = v; else delete organ[o]; }
    else if (v > 0) organ[o] = Math.max(organ[o] ?? 0, v);
  }
  return { seg, organ, segs };
}

export type LiquidMap = Record<string, { fill?: number; tint?: number }>;
/** The drink colour in each organ (Body `liquid`, Body2D). `stream`: the liquid route is drawn on top (3D). */
export function presenceLiquid(p: Presence, stream: boolean): LiquidMap {
  const out: LiquidMap = {};
  for (const [o, v] of Object.entries(p.organ)) {
    if (o === 'stomach') {
      const ml = Math.max(0, p.segs.stomach?.amount ?? 0);
      out.stomach = { fill: Math.min(1, (ml + RESTING_ML * Math.min(1, ml / RESTING_ML)) / STOMACH_ML), tint: TINT_STOMACH * v };
    } else if (o === 'bladder') out.bladder = { fill: Math.min(1, Math.max(0, p.segs.bladder?.amount ?? 0) / BLADDER_ML) };
    else out[o] = { tint: (stream && ON_STREAM.has(o) ? TINT_ON_STREAM : TINT_HELD) * v };
  }
  return out;
}

/** Hologram glow of each organ in proportion to what it has now. */
export function presenceGlow(p: Presence): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [o, v] of Object.entries(p.organ)) if (GLOWS.has(o)) out[o] = GLOW_FULL * v;
  return out;
}

/** The organs that have some of it now (kept bright while the rest of the body dims). */
export const presentOrgans = (p: Presence): string[] => Object.keys(p.organ);

// ---- the liquid route's stream (LiquidRoute.tsx uses exactly these targets every frame) ----
/** Light drinks in the video are drawn a bit softer (a flow, not a bright tube over the organs). */
export const SUBTLE_K = 0.75;
/** Opacity target of one part of the stream: its share, linear. */
export const streamFill = (x: SegState | undefined, subtle = false): number => presence(x?.frac) * (subtle ? SUBTLE_K : 1);
/** Extra radius of the stream (×its base radius): a thin trace for a small share, swollen where most of it is. */
export const streamThick = (x: SegState | undefined, subtle = false): number => {
  const v = presence(x?.frac);
  return subtle ? -0.55 + 0.45 * v : -0.45 + 0.85 * v;
};
