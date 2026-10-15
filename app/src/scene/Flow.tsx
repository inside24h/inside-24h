// Generic particle flow for any product. A layer is one substance (caffeine, glucose, fructose...).
// Its states are listed in the order mass flows through them; the simulation gives the amount in each
// state per minute. Particles are assigned so that each one only moves forward in time, and when it moves
// it travels the listed anatomical route (e.g. portal vein → liver → vena cava → heart → aorta).
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import pointsJson from '../assets/organ-points.json';
import volumesJson from '../assets/organ-volumes.json';
import { at } from '../science/espressoSim';

const PTS = pointsJson as Record<string, number[]>;
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

const TRAVEL_S = 1.6;
const rand = (seed: number) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
function pick(sites: Sites, r: number): string {
  const total = sites.reduce((a, [, w]) => a + w, 0);
  let x = r * total;
  for (const [k, w] of sites) { if ((x -= w) <= 0) return k; }
  return sites[sites.length - 1][0];
}
const pointOf = (organ: string, r: number) => {
  const p = PTS[organ];
  const i = Math.floor(r * (p.length / 3)) * 3;
  return new THREE.Vector3(p[i], p[i + 1], p[i + 2]);
};

/** Index of the state particle i is in at `minute` (later states fill first). */
function stateOf(layer: FlowLayer, i: number, minute: number): number {
  const q = ((i + 0.5) / layer.n) * layer.total;
  let acc = 0;
  for (let s = layer.states.length - 1; s >= 0; s--) { acc += at(layer.states[s].amount, minute); if (q < acc) return s; }
  return 0;
}

interface P { layer: number; idx: number; state: number; path: THREE.Vector3[]; start: number; homes: THREE.Vector3[]; via: THREE.Vector3[][] }

export function Flow({ layers, minute }: { layers: FlowLayer[]; minute: number }) {
  const key = layers.map((l) => `${l.id}:${l.n}:${l.states.length}`).join('|');
  const { parts, colors, count } = useMemo(() => {
    const parts: P[] = [];
    layers.forEach((layer, li) => {
      for (let i = 0; i < layer.n; i++) {
        const r = rand((li + 1) * 100003 + i * 7919);
        const homes = layer.states.map((s) => pointOf(pick(s.sites, r()), r()));
        const via = layer.states.map((s) => (s.via ?? []).map((o) => pointOf(o, r())));
        parts.push({ layer: li, idx: i, state: 0, path: [homes[0]], start: -1e9, homes, via });
      }
    });
    const colors = layers.map((l) => l.states.map((s) => new THREE.Color(s.color).multiplyScalar(s.dim ?? 1)));
    return { parts, colors, count: parts.length };
    // layers' arrays change every profile edit; the particle layout only depends on the shape
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  const sprite = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d')!, gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
  // free GPU buffers when the product (and so the particle count) changes or the scene unmounts
  useEffect(() => () => geo.dispose(), [geo]);
  useEffect(() => () => sprite.dispose(), [sprite]);
  const tmp = useRef(new THREE.Vector3());

  useFrame((st) => {
    const now = st.clock.elapsedTime;
    const pos = geo.attributes.position.array as Float32Array, col = geo.attributes.color.array as Float32Array;
    for (let k = 0; k < count; k++) {
      const p = parts[k], layer = layers[p.layer];
      if (!layer) continue;
      const s = stateOf(layer, p.idx, minute);
      const cur = tmp.current;
      along(p.path, Math.min(1, (now - p.start) / TRAVEL_S), cur);
      if (s !== p.state) {
        p.path = s === p.state + 1 ? [cur.clone(), ...p.via[s], p.homes[s]] : [p.homes[s]]; // forward one step: real route
        p.start = now; p.state = s; along(p.path, 0, cur);
      }
      pos[k * 3] = cur.x; pos[k * 3 + 1] = cur.y; pos[k * 3 + 2] = cur.z;
      const c = colors[p.layer][p.state];
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
  });

  return (
    <points geometry={geo} frustumCulled={false} renderOrder={5}>
      <pointsMaterial size={0.012} map={sprite} vertexColors transparent depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

function along(path: THREE.Vector3[], f: number, out: THREE.Vector3) {
  if (path.length === 1 || f >= 1) return out.copy(path[path.length - 1]);
  const e = f * f * (3 - 2 * f);
  const x = e * (path.length - 1), i = Math.floor(x);
  return out.copy(path[i]).lerp(path[i + 1], x - i);
}
