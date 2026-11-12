// Audit C14 (2026-11-12): the fast test tier, `npm run test:fast` (about a minute; CI runs it on every push).
// Every test file runs with the same assertions as the full tier (`npm run test:full`, plain vitest on vite.config.ts),
// but the sweeps over the whole database check every 24th item / pair and the whole-database text audit is skipped:
// see src/v4/sweep.testutil.ts. Scratch probes (`_*.test.ts`, never committed) are left out.
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig((env) => mergeConfig(viteConfig(env), {
  test: {
    env: { I24_SWEEP_EVERY: '24' },
    exclude: [...configDefaults.exclude, 'dist-*/**', '**/_*.test.ts'],
  },
}));
