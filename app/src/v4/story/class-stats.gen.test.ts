// Phase P1: story/class-stats.json, the class medians the surprise score compares a number with (story/surprise.ts).
// Generated from the same code as the app, over every database item, variant and builder choice (text-audit auditItems,
// the audit profile). Regenerate after a database or model change:
//   I24_WRITE_CLASS_STATS=1 npx vitest run src/v4/story/class-stats.gen.test.ts
// Both tiers fail while the committed file differs from what the code gives (stale medians); it takes seconds.
import { describe, expect, it } from 'vitest';
// @ts-ignore (node types are not part of this app's tsconfig; vitest runs in node)
import { writeFileSync } from 'node:fs';
import { AUDIT_PROFILE, auditItems } from '../text-audit';
import { arcClass, factInOf } from '../video-facts';
import { numbersOf } from './foodStory';
import { CLASS_STATS, SURPRISE_KEYS, type ClassStats } from './surprise';

const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const FILE = new URL('./class-stats.json', import.meta.url);
const sig = (x: number) => Number(x.toPrecision(4));
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };

export function makeClassStats(): ClassStats {
  const by = new Map<string, Map<string, number[]>>();
  const add = (cls: string, key: string, v: number) => { let m = by.get(cls); if (!m) by.set(cls, (m = new Map())); let l = m.get(key); if (!l) m.set(key, (l = [])); l.push(v); };
  const items = auditItems(AUDIT_PROFILE);
  for (const it0 of items) {
    const N = numbersOf(it0.x, AUDIT_PROFILE), cls = arcClass(factInOf(it0.x));
    for (const k of SURPRISE_KEYS) { const v = N[k]?.value; if (v !== undefined && v > 0 && Number.isFinite(v)) { add(cls, k, v); add('all', k, v); } }
  }
  const medians: Record<string, Record<string, number>> = {};
  for (const cls of [...by.keys()].sort()) {
    medians[cls] = {};
    for (const k of SURPRISE_KEYS) { const l = by.get(cls)!.get(k); if (l && l.length >= 3) medians[cls][k] = sig(median(l)); }
  }
  return { v: 1, profile: 'AUDIT_PROFILE', items: items.length, medians };
}

describe('phase P1: class-stats.json (surprise medians) is up to date', () => {
  it('matches the medians the code gives over every item', () => {
    const fresh = makeClassStats();
    if (env.I24_WRITE_CLASS_STATS) writeFileSync(FILE, `${JSON.stringify(fresh, null, 1)}\n`, 'utf8');
    else expect(CLASS_STATS).toEqual(fresh);
  }, 900_000);
});
