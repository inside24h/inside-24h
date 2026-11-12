// Master audit 2026-11-12 (C12): one rounding rule for every time a model ESTIMATES (stomach half-times, peaks, dips,
// walking minutes), so no card, voiceover line, caption or end card is more precise than the model is: under 10 min to
// the minute, under an hour to 5 minutes, from an hour on to 15 minutes ("about 1 hour", never "62 minutes"). The
// video's running clock (+0:28) is a clock, not a claim, and stays to the minute. The model itself is unchanged.

/** A model's minutes, rounded as said. */
export const roundMin = (m: number): number => {
  const r = Math.max(1, Math.round(m));
  return r < 10 ? r : r < 60 ? Math.round(r / 5) * 5 : Math.round(r / 15) * 15;
};
/** "25 minutes", "1 hour", "75 minutes", "2.5 hours": under 2 h in (rounded) minutes, from 2 h on to the half hour
 *  (as the voiceover facts say it, video-facts timeAt); short enough for an 8-word card. */
export const minWords = (m: number): string => {
  const r = roundMin(m);
  if (r === 60) return '1 hour';
  if (r < 120) return `${r} minute${r === 1 ? '' : 's'}`;
  const h = Math.round(r / 30) / 2;
  return `${h} hours`;
};

/** C12 / phase 1A: a blood sugar "dip" is only said (a moment, a teaser, a voiceover line) when the model's curve goes at
 *  least this far below where it started (mg/dL); and it is a "dip", never a "crash". */
export const SUGAR_DIP_MGDL = 5;
