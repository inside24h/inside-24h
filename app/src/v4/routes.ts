// How much of the product is in each part of the visible route at a given minute (feeds scene/LiquidRoute).
import { at, type Timeline } from '../science/espressoSim';
import type { ColaSim } from '../science/colaSim';
import type { WaterSim } from '../science/waterSim';
import type { FoodSim } from '../science/foodSim';
import type { Route, SegState } from '../scene/LiquidRoute';

/** Outflow per minute of a compartment, scaled so the busiest minute = 1. */
function rate(a: Float64Array) { let max = 1e-9; for (let i = 0; i + 1 < a.length; i++) max = Math.max(max, a[i] - a[i + 1]); return (m: number) => Math.max(0, at(a, m) - at(a, m + 1)) / max; }
function inflow(a: Float64Array) { let max = 1e-9; for (let i = 0; i + 1 < a.length; i++) max = Math.max(max, a[i + 1] - a[i]); return (m: number) => Math.max(0, at(a, m + 1) - at(a, m)) / max; }
// Bladder: people empty it every few hours, so show only urine made in the last 3 h (C), not the day's total.
const recent = (a: Float64Array, m: number) => at(a, m) - at(a, Math.max(0, m - 180));
const st = (amount: number, total: number, flow: number, unit?: string): SegState => ({ amount, frac: total > 0 ? Math.max(0, amount) / total : 0, flow: Math.max(0, Math.min(1, flow)), ...(unit ? { unit } : {}) });
const swallow = (m: number, total: number, unit: string) => (m < 0.8 ? st(total * (1 - m / 0.8) * 0.6, total, 1, unit) : st(0, total, 0));

export function waterRoute(w: WaterSim, ml: number): Route {
  const e = rate(w.stomach), a = rate(w.intestine), k = inflow(w.bladder);
  return {
    unit: 'ml',
    segs: (m) => ({
      swallow: swallow(m, ml, 'ml'),
      stomach: st(at(w.stomach, m), ml, e(m)),
      duodenum: st(0.3 * at(w.intestine, m), ml, a(m)),
      small: st(0.7 * at(w.intestine, m), ml, a(m)),
      portal: st(a(m) * ml * 0.15, ml, a(m)),
      blood: st(at(w.body, m), ml, 0.4 + 0.6 * a(m)),
      kidney: st(k(m) * ml * 0.1, ml, k(m)),
      bladder: st(recent(w.bladder, m), ml, k(m)),
    }),
  };
}

export function espressoRoute(sim: Timeline, dose: number, ml = 30): Route {
  const e = rate(sim.stomach), a = rate(sim.intestine), k = inflow(sim.cleared);
  const toMl = ml / dose;
  return {
    unit: 'ml',
    segs: (m) => ({
      swallow: swallow(m, ml, 'ml'),
      stomach: st(at(sim.stomach, m) * toMl, ml, e(m)),
      duodenum: st(0.3 * at(sim.intestine, m) * toMl, ml, a(m)),
      small: st(0.7 * at(sim.intestine, m) * toMl, ml, a(m)),
      portal: st(a(m) * dose * 0.2, dose, a(m), 'mg caffeine'),
      blood: st(at(sim.body, m), dose, 0.5, 'mg caffeine'),
      kidney: st(k(m) * dose * 0.1, dose, k(m), 'mg'),
    }),
  };
}

export function colaRoute(s: ColaSim, ml = 330): Route {
  const hex = s.sugarG, e = rate(s.stomach), a = rate(s.intestine);
  return {
    unit: 'ml',
    segs: (m) => ({
      swallow: swallow(m, ml, 'ml'),
      stomach: st(at(s.stomachMl, m), ml, e(m)),
      duodenum: st((0.3 * ml * at(s.intestine, m)) / hex, ml, a(m)),
      small: st((0.7 * ml * at(s.intestine, m)) / hex, ml, a(m)),
      portal: st(at(s.liverFructose, m), hex, a(m), 'g fructose'),
      blood: st(at(s.bloodGlucose, m), hex * 0.3, 0.5 + 0.5 * a(m), 'g sugar'),
    }),
  };
}

export function foodRoute(s: FoodSim, grams: number, waterMl: number, isDrink: boolean): Route {
  const e = rate(s.stomachG), k = inflow(s.bladder), abs = inflow(s.kcalAbsorbed);
  const colon = (m: number) => s.colonG.reduce((acc, c) => acc + at(c, m), 0);
  const cIn = inflow(s.colonG[0]), cOut = inflow(s.exitedG);
  // How far the leading edge has got along the colon path (≈ right side 0–0.35, across 0.35–0.6, left side + rectum
  // 0.6–1): a section counts as reached once 10% of the fibre has arrived there or beyond.
  const colonFront = (m: number) => {
    const R = Math.max(1e-6, s.residueG), c0 = at(s.colonG[0], m), c1 = at(s.colonG[1], m), c2 = at(s.colonG[2], m), x = at(s.exitedG, m);
    const reach = (g: number) => Math.min(1, g / (0.1 * R));
    return 0.35 * reach(c0 + c1 + c2 + x) + 0.25 * reach(c1 + c2 + x) + 0.4 * reach(c2 + x);
  };
  const peakCarb = s.carbsInBlood.reduce((x, v) => Math.max(x, v), 1e-9);
  const unit = isDrink ? 'ml' : 'g';
  return {
    unit,
    segs: (m) => ({
      swallow: swallow(m, grams, unit),
      stomach: st(at(s.stomachG, m), grams, e(m)),
      duodenum: st(0.25 * at(s.intestineG, m), grams, abs(m)),
      small: st(0.75 * at(s.intestineG, m), grams, abs(m)),
      portal: st(abs(m) * grams * 0.08, grams, abs(m)),
      blood: peakCarb > 0.3 ? st(at(s.carbsInBlood, m), peakCarb * 2, 0.4 + 0.6 * abs(m), 'g sugar') : st(abs(m) * grams * 0.08, grams, abs(m)),
      ...(waterMl >= 50 ? { kidney: st(k(m) * waterMl * 0.1, waterMl, k(m), 'ml'), bladder: st(recent(s.bladder, m), waterMl, k(m), 'ml urine') } : {}),
      ...(s.residueG > 0.3 ? { colon: { ...st(colon(m), s.residueG * 0.8, Math.max(cIn(m), cOut(m), colon(m) > 0.05 ? 0.15 : 0), 'g fibre'), front: colonFront(m) } } : {}),
    }),
  };
}
