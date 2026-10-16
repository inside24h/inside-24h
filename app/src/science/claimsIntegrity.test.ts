// Every claim the app can show has an evidence level and real sources (upute.md §2; science audit 2026-10-16).
import { describe, expect, it } from 'vitest';
import { FOOD_CLAIMS } from '../content/food';
import { MEAL_CLAIMS } from '../content/mealClaims';
import { ESPRESSO } from '../content/espresso';
import { COLA_PRODUCT } from '../content/cola';
import { WATER_PRODUCT } from '../content/water';
import { SOURCES } from '../content/sources';
import { TIPS, tipSource } from '../content/tips';
import { LONG_TERM } from '../content/longterm';
import { FACTORS } from './personal';
import type { Claim } from '../content/types';

const ALL: [string, Record<string, Claim>][] = [
  ['food', FOOD_CLAIMS], ['meal', MEAL_CLAIMS], ['espresso', ESPRESSO.claims], ['cola', COLA_PRODUCT.claims], ['water', WATER_PRODUCT.claims],
];

describe('claims: level + source for everything shown', () => {
  it('every claim has a level, text and existing sources (A/B need a source, C a source or a method)', () => {
    for (const [set, claims] of ALL) for (const [id, c] of Object.entries(claims)) {
      expect(c.id, `${set}/${id}`).toBe(id);
      expect(['A', 'B', 'C', '?'], `${set}/${id} level`).toContain(c.level);
      expect(c.text.trim().length, `${set}/${id} text`).toBeGreaterThan(10);
      for (const s of c.sources) expect(SOURCES[s], `${set}/${id}: unknown source ${s}`).toBeDefined();
      if (c.level === 'A' || c.level === 'B') expect(c.sources.length, `${set}/${id}: ${c.level} without a source`).toBeGreaterThan(0);
      if (c.level === 'C') expect(c.sources.length + (c.method ? 1 : 0), `${set}/${id}: C without source or method`).toBeGreaterThan(0);
      if (c.level === '?') expect(c.method ?? c.text, `${set}/${id}: ? must say what is missing`).toBeTruthy();
    }
  });
  it('claim IDs never collide between the sets a food product merges (espresso + food + meal)', () => {
    const seen = new Map<string, string>();
    for (const [set, claims] of ALL.slice(0, 3)) for (const id of Object.keys(claims)) {
      expect(seen.get(id), `${id} in ${set} and ${seen.get(id)}`).toBeUndefined();
      seen.set(id, set);
    }
  });
  it('tips, long-term items and personal factors cite sources that exist', () => {
    for (const t of Object.values(TIPS)) { expect(t.sources.length).toBeGreaterThan(0); for (const s of t.sources) expect(tipSource(s), `tip ${t.key}: ${s}`).toBeDefined(); }
    for (const [p, x] of Object.entries(LONG_TERM)) for (const it of x.items) {
      for (const s of it.sources) expect(SOURCES[s], `${p}/${it.marker}: ${s}`).toBeDefined();
      if (it.level === 'C') expect(it.method, `${p}/${it.marker}: C without method`).toBeTruthy();
    }
    for (const f of Object.values(FACTORS)) for (const s of f.sources) expect(SOURCES[s], `factor ${f.id}: ${s}`).toBeDefined();
  });
});
