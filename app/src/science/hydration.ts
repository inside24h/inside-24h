// Hydration over the day, compared with an ordinary mild (22 °C) day on which you eat and drink as usual.
// Claim IDs: research/hydration-climate.md. Model level C on top of Meade 2024 (resting skin + lung water loss vs
// air temperature), Maughan 2016 (urine after a drink) and Liska 2019 (≥ 2% body-mass loss = hypohydration).
import type { Profile } from './profile';

export interface Climate { tmin: number; tmax: number; rh: number }

/** Body surface area, Du Bois (H14). */
export const bsa = (p: Pick<Profile, 'heightCm' | 'weightKg'>) => 0.007184 * Math.pow(p.heightCm, 0.725) * Math.pow(p.weightKg, 0.425);

/** Resting skin + lung water loss, g/h per m² of skin, at air temperature T (H20, H22; above 36 °C extrapolated). */
export function lossPerM2(T: number): number {
  if (T <= 22) return 20;
  if (T <= 26) return 20 + (T - 22) * 1.5;
  if (T <= 31) return 26 + (T - 26) * 1.0;
  return Math.min(120, 31 + (T - 31) * 9.8);
}

/** Air temperature at a clock time: lowest around 06:00, highest around 15:00 (usual daily cycle; C). */
export function tempAt(c: Climate, clockMin: number): number {
  const h = ((clockMin / 60) % 24 + 24) % 24;
  const mid = (c.tmin + c.tmax) / 2, amp = (c.tmax - c.tmin) / 2;
  // rising half 06→15 h (9 h), falling half 15→06 h (15 h)
  const phase = h >= 6 && h < 15 ? Math.PI * (1 - (h - 6) / 9) : Math.PI * ((h >= 15 ? h - 15 : h + 9) / 15);
  return mid + amp * Math.cos(phase);
}

export interface Hydration {
  temp: Float64Array; // °C by minute after the drink
  extraLossMl: Float64Array; // cumulative extra loss vs a 22 °C day
  drinkMl: Float64Array; // water from this drink/food still in you
  balanceMl: Float64Array; // drink − extra loss
  percent: Float64Array; // 100 = as hydrated as on a normal day; 50 = 1% body mass short; 0 = 2% short
  extraPerDayMl: number; // what an ordinary day here costs on top of a mild day (24 h)
}

export const HYD = {
  sleepFactor: 0.93, // lungs lose less asleep (H15, assumption)
  absorbHalfMin: 12, // [water A5]
  urineTauMin: 90, // extra urine after a drink (H43, H46)
};

/**
 * @param waterMl water the product brings
 * @param emptyHalfMin how long the stomach holds it (from the product model)
 * @param airCon true = mostly indoors with climate control (air temperature capped at 24 °C)
 */
export function simulateHydration(p: Profile, c: Climate, waterMl: number, emptyHalfMin: number, asleep: Float64Array, airCon = false, minutes = 1440): Hydration {
  const n = minutes + 1, mk = () => new Float64Array(n);
  const out = { temp: mk(), extraLossMl: mk(), drinkMl: mk(), balanceMl: mk(), percent: mk() };
  const area = bsa(p);
  const ks = Math.LN2 / Math.max(5, emptyHalfMin), ka = Math.LN2 / HYD.absorbHalfMin, ku = 1 / HYD.urineTauMin;
  let S = waterMl, G = 0, B = 0, loss = 0;
  const deficit2 = 0.02 * p.weightKg * 1000; // 2% of body mass in ml (H30, H38)
  const lossAt = (clock: number, sleepFrac: number) => {
    const T = Math.min(airCon ? 24 : 99, tempAt(c, clock));
    const extra = area * (lossPerM2(T) - lossPerM2(22)); // ml/h above a mild day
    return { T, perMin: (extra * (1 - (1 - HYD.sleepFactor) * sleepFrac)) / 60 };
  };
  for (let t = 0; t < n; t++) {
    const { T, perMin } = lossAt(p.drinkAtMin + t, asleep[t] ?? 0);
    out.temp[t] = T; out.extraLossMl[t] = loss; out.drinkMl[t] = G + B;
    const bal = B + G - loss; out.balanceMl[t] = bal;
    out.percent[t] = Math.max(0, Math.min(100, 100 * (1 + Math.min(0, bal) / deficit2)));
    // one-minute step (slow processes)
    const e = ks * S, a = ka * G, u = ku * B;
    S -= e; G += e - a; B += a - u; loss += perMin;
  }
  let day = 0;
  for (let m = 0; m < 1440; m += 10) day += lossAt(m, 0).perMin * 10; // whole day, awake (upper estimate)
  return { ...out, extraPerDayMl: day };
}
