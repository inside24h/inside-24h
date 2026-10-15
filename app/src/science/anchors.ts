// Blood-caffeine anchors for the sleep-latency estimate, from the reference adult [VS2 Gardiner 2025]:
// 100 mg taken 4 h before bed had no effect; 400 mg 4 h before bed added 14.2 min to sleep latency.
import { simulateEspresso } from './espressoSim';
import { DEFAULT_PROFILE } from './profile';

let cached: { none: number; full: number } | null = null;
export function sleepAnchors() {
  if (!cached) {
    cached = {
      none: simulateEspresso(100, DEFAULT_PROFILE, 300).conc[240],
      full: simulateEspresso(400, DEFAULT_PROFILE, 300).conc[240],
    };
  }
  return cached;
}
