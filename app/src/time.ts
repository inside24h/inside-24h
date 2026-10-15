// The timeline is logarithmic: the first minutes get as much room as the last hours.
export const MAX_MIN = 24 * 60;
export const minutesFromU = (u: number) => Math.exp(u * Math.log(MAX_MIN + 1)) - 1;
export const uFromMinutes = (m: number) => Math.log(m + 1) / Math.log(MAX_MIN + 1);

export function formatClock(min: number): string {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  return `T+${h}:${String(m % 60).padStart(2, '0')}`;
}

export const formatShort = (min: number) => (min < 60 ? `${Math.round(min)} min` : `${+(min / 60).toFixed(1)} h`);
