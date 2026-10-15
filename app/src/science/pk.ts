// One-compartment pharmacokinetic model with first-order absorption and elimination.
// C(t) = F·D·ka / (Vd·(ka − ke)) · (e^(−ke·t) − e^(−ka·t))
// Times in hours, doses in mg, volumes in litres, concentrations in mg/L.

export interface PKParams {
  doseMg: number;
  bioavailability: number; // F, 0..1
  vdL: number; // apparent volume of distribution
  ka: number; // absorption rate constant, 1/h
  ke: number; // elimination rate constant, 1/h
}

export const keFromHalfLife = (halfLifeH: number) => Math.LN2 / halfLifeH;

/** Time of peak concentration for given ka, ke (ka ≠ ke). */
export function tmax(ka: number, ke: number): number {
  return Math.log(ka / ke) / (ka - ke);
}

/** Solve ka (> ke) so that the model peaks at `tmaxH`. tmax(ka) decreases monotonically for ka > ke. */
export function kaFromTmax(ke: number, tmaxH: number): number {
  let lo = ke * (1 + 1e-9), hi = 1000;
  if (tmaxH >= tmax(lo * 1.000001, ke)) throw new Error('tmax too long for this ke');
  for (let i = 0; i < 200; i++) {
    const mid = Math.sqrt(lo * hi);
    if (tmax(mid, ke) > tmaxH) lo = mid; else hi = mid;
  }
  return Math.sqrt(lo * hi);
}

/** Amount still in the gut, not yet absorbed (mg). */
export const amountInGut = (p: PKParams, t: number) => (t < 0 ? p.doseMg : p.bioavailability * p.doseMg * Math.exp(-p.ka * t));

/** Amount in the body's circulation and tissues (mg). */
export function amountInBody(p: PKParams, t: number): number {
  if (t <= 0) return 0;
  const { ka, ke } = p;
  return (p.bioavailability * p.doseMg * ka / (ka - ke)) * (Math.exp(-ke * t) - Math.exp(-ka * t));
}

/** Plasma concentration (mg/L). */
export const concentration = (p: PKParams, t: number) => amountInBody(p, t) / p.vdL;

/** Amount already eliminated (metabolised or excreted), mg. Mass balance: gut + body + eliminated = F·D. */
export const amountEliminated = (p: PKParams, t: number) =>
  t <= 0 ? 0 : p.bioavailability * p.doseMg - amountInGut(p, t) - amountInBody(p, t);
