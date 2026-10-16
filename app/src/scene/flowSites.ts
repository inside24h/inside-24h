// Flow layer types and the standard anatomical sites/routes, without three.js: products.ts builds layers with
// these while the 3D chunk (Flow.tsx, three.js) may still be loading in the hosted build. Flow re-exports them.
import volumesJson from '../assets/organ-volumes.json';

const VOL = volumesJson as Record<string, number>;

export type Sites = [string, number][];
export interface FlowState { amount: Float64Array; sites: Sites; via?: string[]; color: string; dim?: number }
export interface FlowLayer { id: string; n: number; total: number; states: FlowState[] }

// Caffeine and other small molecules spread through body water, so organs get particles by volume.
export const BODY_WATER_SITES: Sites = (() => {
  const organs = ['brain', 'liver', 'heart', 'kidney_l', 'kidney_r', 'pancreas', 'aorta', 'vena_cava'];
  const water = organs.map((k) => [k, VOL[k] * 0.75] as [string, number]);
  return [...water, ['skin', 41.45 - water.reduce((a, [, v]) => a + v, 0)]];
})();
export const GUT_SITES: Sites = [['duodenum', 0.3], ['jejunum', 0.5], ['ileum', 0.2]];
export const BLOOD_SITES: Sites = [['heart', 0.3], ['aorta', 0.35], ['vena_cava', 0.2], ['portal_vein', 0.15]];
export const ROUTE_GUT_TO_BODY = ['portal_vein', 'liver', 'vena_cava', 'heart', 'aorta'];
export const ROUTE_THROUGH_LIVER = ['vena_cava', 'liver', 'vena_cava', 'heart', 'aorta'];
