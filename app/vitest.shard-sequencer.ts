// Phase 4i: a vitest sequencer for the full tier (vitest.full.config.ts). `--shard=k/n` gives each shard about the same
// total time (the files' measured seconds below, longest first into the shard with the least so far) instead of
// vitest's default, the same NUMBER of files by a hash of their paths, which could put the two slowest sweeps on one
// runner. Within a shard the slowest files start first. Every test file still runs in exactly one shard; a file not in
// the table counts as DEFAULT_S. The table only steers the split: refresh it from a CI run's per-file times when the
// shards drift apart (nothing breaks if it is stale).
import { BaseSequencer, type TestSpecification } from 'vitest/node';

/** Seconds per file on a CI runner (Tests (full), 2026-11-16, before the phase 4i memo; relative sizes are what count). */
const SECONDS: Record<string, number> = {
  'src/v4/video-4b.test.ts': 1558, 'src/v4/text-audit.test.ts': 1046, 'src/v4/video-telemetry.test.ts': 727, 'src/v4/video-endcard.test.ts': 630,
  'src/v4/video-variety.test.ts': 495, 'src/v4/video-retention.test.ts': 494, 'src/v4/video-narration.test.ts': 486, 'src/v4/video-camera.test.ts': 443,
  'src/v4/tts-normalize.test.ts': 440, 'src/v4/video-captions.test.ts': 328, 'src/v4/video-compare-end.test.ts': 303, 'src/v4/video-sameness.test.ts': 214,
  'src/v4/category-matrix.test.ts': 130, 'src/v4/video-story.test.ts': 78, 'src/v4/video-hook.test.ts': 55, 'src/science/fuzz.test.ts': 37,
  'src/science/fuzzMeals.test.ts': 28, 'src/v4/video-pins.test.ts': 23, 'src/v4/variants.test.ts': 10,
};
const DEFAULT_S = 3;

const rel = (spec: TestSpecification, root: string) => spec.moduleId.replace(/\\/g, '/').slice(root.replace(/\\/g, '/').length).replace(/^\/+/, '');

export class WeightedSequencer extends BaseSequencer {
  private weight(spec: TestSpecification) { return SECONDS[rel(spec, this.ctx.config.root)] ?? DEFAULT_S; }

  async shard(files: TestSpecification[]): Promise<TestSpecification[]> {
    const { index, count } = this.ctx.config.shard!;
    const order = [...files].sort((a, b) => this.weight(b) - this.weight(a) || rel(a, this.ctx.config.root).localeCompare(rel(b, this.ctx.config.root)));
    const load = Array.from({ length: count }, () => 0), mine: TestSpecification[] = [];
    for (const f of order) {
      let k = 0;
      for (let j = 1; j < count; j++) if (load[j] < load[k]) k = j;
      load[k] += this.weight(f);
      if (k === index - 1) mine.push(f);
    }
    return mine;
  }

  async sort(files: TestSpecification[]): Promise<TestSpecification[]> {
    return [...files].sort((a, b) => this.weight(b) - this.weight(a));
  }
}
