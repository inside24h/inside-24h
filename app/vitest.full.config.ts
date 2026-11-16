// Phase 4i: the full test tier (`npm run test:full`; CI "Tests (full)" runs it in parallel shards, `--shard=k/n`).
// The same tests and assertions as plain `vitest run` on vite.config.ts; this config only leaves out the scratch probes
// (`_*.test.ts`, never committed) and splits the files between shards by how long each takes (vitest.shard-sequencer.ts),
// not by a hash of their names, so no shard waits on two of the slowest files.
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';
import { WeightedSequencer } from './vitest.shard-sequencer';

export default defineConfig((env) => mergeConfig(viteConfig(env), {
  test: {
    exclude: [...configDefaults.exclude, 'dist-*/**', '**/_*.test.ts'],
    sequence: { sequencer: WeightedSequencer },
  },
}));
