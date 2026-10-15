// One glass of water (250 ml). Claim IDs refer to research/water.md.
import { simulateEspresso, type Timeline } from './espressoSim';
import type { Profile } from './profile';

export const WATER = {
  ml: 250,
  gastricHalfMin: 13, // [A1] Mudie 2014, T50 13 ± 1 min
  absorbHalfMin: 12, // [A5] Péronnet 2012, absorption half-life 11–13 min
  // [B6–B8, level C] Maughan 2016: 1 L → 1337 g urine in 4 h, more than the dose once baseline urine is added,
  // so in a well-hydrated person essentially the whole extra water leaves within ~4 h. We scale that to 250 ml
  // with first-order removal, half-time 60 min (→ 94% gone by 4 h; urine flow peaks at ~1–2 h as in B8).
  kidneyHalfMin: 60,
};

export interface WaterSim {
  minutes: number;
  stomach: Float64Array; intestine: Float64Array; body: Float64Array; bladder: Float64Array; // ml
  caffeine: Timeline; // zero dose, so shared code (sleep, readings) keeps working
}

export function simulateWater(p: Profile, ml = WATER.ml, minutes = 1440): WaterSim {
  const kg = Math.LN2 / WATER.gastricHalfMin, ka = Math.LN2 / WATER.absorbHalfMin, ku = Math.LN2 / WATER.kidneyHalfMin;
  const n = minutes + 1, mk = () => new Float64Array(n);
  const out = { stomach: mk(), intestine: mk(), body: mk(), bladder: mk() };
  let S = ml, I = 0, B = 0, U = 0;
  const sub = 20, h = 1 / sub;
  for (let t = 0; t < n; t++) {
    out.stomach[t] = S; out.intestine[t] = I; out.body[t] = B; out.bladder[t] = U;
    for (let k = 0; k < sub; k++) {
      const e = kg * S * h, a = ka * I * h, u = ku * B * h;
      S -= e; I += e - a; B += a - u; U += u;
    }
  }
  return { minutes, ...out, caffeine: simulateEspresso(0.0001, p, minutes) };
}

// Blood pressure: 350–500 ml raised SBP ≈ +2.3 mmHg in healthy adults [V2]; for 250 ml we show +1.5 at ~30 min,
// fading by ~2 h (level C, [V6] range 0–2 mmHg).
export const waterSbpDelta = (t: number) => (t <= 0 ? 0 : 1.5 * (t / 30) * Math.exp(1 - t / 30));
