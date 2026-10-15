// Real climate per city (Open-Meteo / ERA5, 2015–2024 monthly means; pipeline/build-climate.mjs) and a small search.
// claude.ai pages cannot fetch live weather, so "today" = the typical day of this month in that city.
import data from './climate.json';
import { fold } from '../food/parse';
import type { Climate } from '../../science/hydration';

export interface City { name: string; country: string; cc: string; admin: string; lat: number; lon: number; m: [number, number, number][] }
export const CITIES: City[] = (data as unknown as { cities: City[] }).cities;
export const CLIMATE_SOURCE = (data as { source: string }).source;
export const cityLabel = (c: City) => `${c.name}, ${c.country}`;

export function findCity(label?: string): City | undefined {
  if (!label) return undefined;
  const f = fold(label);
  return CITIES.find((c) => fold(cityLabel(c)) === f) ?? CITIES.find((c) => fold(c.name) === f.split(',')[0].trim());
}

export function searchCities(q: string, n = 8): City[] {
  const f = fold(q);
  if (!f) return CITIES.filter((c) => c.cc === 'HR').slice(0, n);
  return CITIES.map((c) => {
    const name = fold(c.name), full = fold(`${c.name} ${c.country} ${c.admin}`);
    const s = name === f ? 4 : name.startsWith(f) ? 3 : full.split(' ').some((w) => w.startsWith(f)) ? 2 : full.includes(f) ? 1 : 0;
    return [c, s] as const;
  }).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).slice(0, n).map(([c]) => c);
}

/** The typical day for this month in the city. */
export function climateNow(c: City, date = new Date()): Climate & { month: string } {
  const i = date.getMonth();
  const [tmin, tmax, rh] = c.m[i];
  return { tmin, tmax, rh, month: date.toLocaleString('en', { month: 'long' }) };
}
