// Person-to-person spread, so the screen shows a range instead of one exact number where people differ (upute.md §2).
//
// Blood sugar: ±1 SD of the peak ≈ ±40% (cola.md B1: +2.4 ± 1.0 mmol/L in 26 healthy adults; digestion-generic.md
//   GL8: CV 68% for identical meals, Berry 2020). Our curve is a typical response, not yours.
// Blood alcohol: Widmark estimates are off by ≈ 22% with measured body weight and ≈ 37% with estimated weight
//   (alcohol.md W6, Maskell & Cooper 2020). We use the top of that range, ±40%, so nobody reads the low end as "safe".
export const GLUCOSE_SPREAD = 0.4;
export const BAC_SPREAD = 0.4;

export const spread = (v: number, f: number): [number, number] => [v * (1 - f), v * (1 + f)];

/** Peak sugar rise as a range in mmol/L, e.g. "+1.4–3.2". */
export function glucoseRangeText(peakMmol: number): string {
  const [lo, hi] = spread(peakMmol, GLUCOSE_SPREAD);
  return `+${lo.toFixed(1)}–${hi.toFixed(1)}`;
}

/** Blood alcohol (g/L = ‰) as a range, e.g. "0.16–0.38 ‰". Never a single number. */
export function bacRangeText(gPerL: number): string {
  const [lo, hi] = spread(gPerL, BAC_SPREAD);
  return `${lo.toFixed(2)}–${hi.toFixed(2)} ‰`;
}
