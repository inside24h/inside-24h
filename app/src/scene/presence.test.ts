// Phase 3 (master audit C5, owner decision 2026-11-12): what the 3D body draws (stream intensity of each part of the
// route, drink colour and glow of each organ) matches the model's own compartment amounts at that minute, for a sample
// of foods and drinks and times. The expected shares are read straight from the model outputs (the "Where" rows, the
// blood alcohol curve), not from the route, so a drawing that drifts from the model fails here.
import { describe, expect, it } from 'vitest';
import { parseMeal } from '../v4/food/parse';
import { analyze } from '../v4/analyze';
import { DEFAULT_PROFILE } from '../science/profile';
import { at } from '../science/espressoSim';
import { GLOW_FULL, presence, presenceAt, presenceGlow, presenceLiquid, SHOW_MIN, streamFill, SUBTLE_K, TINT_HELD, TINT_STOMACH } from './presence';
import { bodyGlowAt, bodyLiquidAt } from '../v4/video-body';

const TOL = 0.02;
const TIMES = [5, 36, 90, 180, 360, 480, 900, 1440];
const FOODS = ['pizza', 'banana', 'beer', 'glass of milk', 'big mac'];

/** What LiquidRoute's frame loop converges to (it eases each uniform toward its target every frame). */
function rendered(target: number, frames = 240, dt = 1 / 30) {
  let u = 0; const k = 1 - Math.exp(-dt * 5);
  for (let i = 0; i < frames; i++) u += (target - u) * k;
  return u;
}

describe('C5: the body shows the food only where the model has it, as much as is there', () => {
  for (const q of FOODS) {
    const x = analyze(parseMeal(q), DEFAULT_PROFILE), b = x.built, route = b.route!;
    const row = (re: RegExp) => b.where.find((w) => re.test(w.label));
    const stomachRow = row(/stomach/i)!, gutRow = row(/small intestine/i)!, fibreRow = row(/large intestine/i);
    it(`${q}: stream, organ colour and glow follow the stomach, gut and colon amounts`, () => {
      expect(route).toBeTruthy();
      for (const t of TIMES) {
        const p = presenceAt(route, t), segs = route.segs(t);
        const st = stomachRow.value(t) / stomachRow.max, gut = gutRow.value(t) / gutRow.max;
        // stream (LiquidRoute) per part of the route
        expect(Math.abs(rendered(streamFill(segs.stomach)) - presence(st))).toBeLessThan(TOL);
        expect(Math.abs(rendered(streamFill(segs.duodenum)) - presence(0.25 * gut))).toBeLessThan(TOL);
        expect(Math.abs(rendered(streamFill(segs.small)) - presence(0.75 * gut))).toBeLessThan(TOL);
        expect(Math.abs(streamFill(segs.stomach, true) - SUBTLE_K * presence(st))).toBeLessThan(1e-9);
        // organs: glow and drink colour in proportion
        const glow = presenceGlow(p), liq = presenceLiquid(p, true);
        expect(Math.abs((glow.stomach ?? 0) - GLOW_FULL * presence(st))).toBeLessThan(TOL);
        expect(Math.abs((liq.stomach?.tint ?? 0) - TINT_STOMACH * presence(st))).toBeLessThan(TOL);
        expect(Math.abs((glow.jejunum ?? 0) - GLOW_FULL * presence(0.75 * gut))).toBeLessThan(TOL);
        if (fibreRow) expect(Math.abs((p.seg.colon ?? 0) - presence(fibreRow.value(t) / (0.8 * fibreRow.max)))).toBeLessThan(TOL);
        // nothing is drawn where the model has (almost) nothing
        for (const [, v] of Object.entries(p.organ)) expect(v).toBeGreaterThanOrEqual(SHOW_MIN);
        // the video uses the same numbers
        expect(bodyLiquidAt(b, t)).toEqual(liq);
        const vg = bodyGlowAt(b, t, null, false).glow;
        for (const [k, v] of Object.entries(glow)) expect(vg[k]).toBeGreaterThanOrEqual(v - 1e-9);
      }
    });
  }

  it('pizza at +36 min: the stomach glows, the rest of the tract does not', () => {
    const b = analyze(parseMeal('pizza'), DEFAULT_PROFILE).built, p = presenceAt(b.route, 36);
    expect(p.organ.stomach).toBeGreaterThan(0.85);
    for (const o of ['duodenum', 'jejunum', 'ileum', 'cecum', 'colon_asc', 'colon_trans', 'colon_desc', 'rectum', 'esophagus', 'liver'])
      expect(p.organ[o] ?? 0).toBeLessThan(0.12);
    const glow = presenceGlow(p);
    expect(glow.stomach).toBeGreaterThan(0.5);
    for (const [k, v] of Object.entries(glow)) if (k !== 'stomach') expect(v).toBeLessThan(0.1);
    // later the glow has moved on: at +8 h the fibre is in the colon and the stomach is empty
    const late = presenceAt(b.route, 480);
    expect(late.organ.stomach ?? 0).toBe(0);
    expect(Math.max(late.organ.colon_asc ?? 0, late.organ.colon_trans ?? 0, late.organ.colon_desc ?? 0)).toBeGreaterThan(0.3);
  });

  it('beer: the liver shows it holds alcohol in proportion to blood alcohol, fading as the model clears it', () => {
    const b = analyze(parseMeal('3 beers'), DEFAULT_PROFILE).built, bac = b.bac!;
    const peak = bac.reduce((m, v) => Math.max(m, v), 0), pk = bac.indexOf(peak);
    let last = Infinity;
    for (const t of [pk, pk + 60, pk + 120, pk + 240, pk + 360, pk + 480].filter((t) => t <= 1440)) {
      const p = presenceAt(b.route, t), want = presence(at(bac, t) / peak);
      expect(Math.abs((p.organ.liver ?? 0) - want)).toBeLessThan(TOL);
      expect(Math.abs((presenceLiquid(p, true).liver?.tint ?? 0) - TINT_HELD * want)).toBeLessThan(TOL);
      expect(p.organ.liver ?? 0).toBeLessThanOrEqual(last + 1e-9);
      last = p.organ.liver ?? 0;
    }
    expect(presenceAt(b.route, 1440).organ.liver ?? 0).toBe(0);
  });

  it('fat from a fatty meal is shown in the blood vessels while the triglyceride rise lasts', () => {
    const b = analyze(parseMeal('big mac'), DEFAULT_PROFILE).built, tg = b.effects.tgMmol!;
    const peak = tg.reduce((m, v) => Math.max(m, v), 0);
    if (peak < 0.05) return;
    for (const t of [60, 180, 300, 600]) expect(Math.abs((presenceAt(b.route, t).organ.aorta ?? 0) - Math.max(presence(at(tg, t) / peak), presence(b.route!.segs(t).blood?.frac)))).toBeLessThan(TOL);
  });
});
