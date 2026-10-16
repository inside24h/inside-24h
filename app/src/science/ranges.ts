// Person-to-person spread, so the screen shows a range instead of one exact number where people differ (upute.md §2).
//
// Blood sugar: ±1 SD of the peak ≈ ±40% (cola.md B1: +2.4 ± 1.0 mmol/L in 26 healthy adults; digestion-generic.md
//   GL8: CV 68% for identical meals, Berry 2020). Our curve is a typical response, not yours.
// Blood alcohol: Widmark estimates are off by ≈ 22% with measured body weight and ≈ 37% with estimated weight
//   (alcohol.md W6, Maskell & Cooper 2020). Low side −40%. High side +50% (alcohol.md A12): in Mitchell 2014 the same
//   0.5 g/kg drink gave peaks with SD 17–22% of the mean (vodka-tonic 77.4 ± 17.0 mg/dl, 7 of 15 men above 80), so
//   mean + 2 SD is +35% (wine), +39% (beer) and +44% (spirits). +50% keeps that inside the range with a margin.
export const GLUCOSE_SPREAD = 0.4;
export const BAC_SPREAD = 0.4;
export const BAC_SPREAD_UP = 0.5;

export const spread = (v: number, f: number): [number, number] => [v * (1 - f), v * (1 + f)];

/** Peak sugar rise as a range in mmol/L, e.g. "+1.4–3.2". */
export function glucoseRangeText(peakMmol: number): string {
  const [lo, hi] = spread(peakMmol, GLUCOSE_SPREAD);
  return `+${lo.toFixed(1)}–${hi.toFixed(1)}`;
}
/** The same range with its unit, in the unit the person chose in "Your body" (display only), e.g. "+1.4–3.2 mmol/L" / "+25–58 mg/dL". */
export function glucoseRangeTextIn(peakMmol: number, unit: 'mmol/L' | 'mg/dL' = 'mmol/L'): string {
  if (unit === 'mmol/L') return `${glucoseRangeText(peakMmol)} mmol/L`;
  const [lo, hi] = spread(peakMmol * 18.016, GLUCOSE_SPREAD);
  return `+${Math.round(lo)}–${Math.round(hi)} mg/dL`;
}
/** One rise with its unit, e.g. "+2.3 mmol/L" / "+41 mg/dL" (display only). */
export const glucoseRiseText = (mmol: number, unit: 'mmol/L' | 'mg/dL' = 'mmol/L') =>
  unit === 'mmol/L' ? `+${mmol.toFixed(1)} mmol/L` : `+${Math.round(mmol * 18.016)} mg/dL`;

/** Blood alcohol (g/L = ‰) as a range: −40% to +50% of the model value. Never a single number. */
export const bacRange = (gPerL: number): [number, number] => [gPerL * (1 - BAC_SPREAD), gPerL * (1 + BAC_SPREAD_UP)];

/** Blood alcohol (g/L = ‰) as a range, e.g. "0.16–0.41 ‰". Never a single number. */
export function bacRangeText(gPerL: number): string {
  const [lo, hi] = bacRange(gPerL);
  return `${lo.toFixed(2)}–${hi.toFixed(2)} ‰`;
}
