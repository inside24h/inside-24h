// Test helper (not part of the app), audit C14 (2026-11-12): the test tiers.
// `npm run test:full` (and plain `npx vitest run`) sweeps everything. `npm run test:fast` (vitest.fast.config.ts) sets
// I24_SWEEP_EVERY=k: each sweep over the whole database then checks every k-th item / pair only (always the same ones,
// so a fast run is as repeatable as a full one) and the slowest whole-database audits are skipped. The assertions are
// the same in both tiers; only how much is swept changes.
// (process is read through globalThis: node types are not part of this app's tsconfig; vitest runs in node)
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const EVERY = Math.max(1, Math.floor(Number(env.I24_SWEEP_EVERY ?? 1)) || 1);

/** True in the fast tier. */
export const FAST_TIER = EVERY > 1;

/** Every item in the full tier; every k-th one (starting with the first) in the fast tier. */
export function sweep<T>(xs: readonly T[], every = EVERY): T[] {
  return every > 1 ? xs.filter((_, i) => i % every === 0) : [...xs];
}
