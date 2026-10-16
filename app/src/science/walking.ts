// Food energy as minutes of brisk walking. ONE formula for the whole app (quick answers and the health bars).
// ACSM walking equation, net of rest, level ground (research/activity.md E1–E2): the speed term 0.1 mL O2/kg per metre
// = 100 mL/kg/km × ~5 kcal per litre O2 = 0.5 kcal per kg per km, whatever the speed. "Burning off" a food means the
// energy spent ON TOP of sitting, so the net cost is the honest one (the gross 3.5-MET figure counts resting energy
// you would have spent anyway). Measured walking (Hall 2004, E3) agrees with the gross version within ~20 kJ.
// The cost grows in proportion to body mass, so a heavier body walks it off sooner: the result can only fall as
// weight rises. Age and height are not in the equation. Weight is held to the range the app accepts (35–200 kg).

export const WALK_NET_KCAL_PER_KG_KM = 0.5; // [E2] level C (derived from E1)
export const BRISK_KMH = 5; // "brisk walking" in the app: 5 km/h (12 min per km)
export const WEIGHT_RANGE_KG: [number, number] = [35, 200];

/** Minutes of brisk walking (5 km/h, net of rest) that use this many kcal for this body weight. */
export function walkingMinutes(kcal: number, weightKg: number): number {
  const kg = Math.min(WEIGHT_RANGE_KG[1], Math.max(WEIGHT_RANGE_KG[0], Number.isFinite(weightKg) ? weightKg : 70));
  const km = Math.max(0, kcal) / (WALK_NET_KCAL_PER_KG_KM * kg);
  return (km / BRISK_KMH) * 60;
}

/** The same, as km (for "about 4 km"). */
export const walkingKm = (kcal: number, weightKg: number) => (walkingMinutes(kcal, weightKg) / 60) * BRISK_KMH;
