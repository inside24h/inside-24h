// Blood-caffeine anchors for the sleep-latency estimate, from the reference adult [VS2 Gardiner 2025]:
// 100 mg taken 4 h before bed had no effect; 400 mg 4 h before bed added 14.2 min to sleep latency.
import { simulateEspresso } from './espressoSim';
import { DEFAULT_PROFILE } from './profile';

// A third, cautious anchor from the meta-analysis [VS1 Gardiner 2023]: to avoid losing total sleep time, a 107 mg
// coffee should be drunk at least 8.8 h before bed. The blood level that leaves at bedtime is lower than the "none"
// anchor (≈ 39 vs ≈ 63 mg left in the body for the reference adult), so between the two the honest answer is
// "most people sleep normally, caffeine-sensitive people may not" [VS4 Rétey 2007], not "too little to matter".
let cached: { none: number; full: number; cautious: number } | null = null;
export function sleepAnchors() {
  if (!cached) {
    cached = {
      none: simulateEspresso(100, DEFAULT_PROFILE, 300).conc[240],
      full: simulateEspresso(400, DEFAULT_PROFILE, 300).conc[240],
      cautious: simulateEspresso(107, DEFAULT_PROFILE, 540).conc[528],
    };
  }
  return cached;
}
