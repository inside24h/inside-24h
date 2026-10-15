// Caffeine as particles. Each particle is a fixed share of the dose (dose / N mg).
// The simulation says how many mg sit in each compartment; particles are assigned in order of mass flow
// (stomach → intestine → body → broken down → cleared), so a particle only moves forward in time.
// When a particle changes compartment it travels the real anatomical route (e.g. gut → portal vein → liver
// → vena cava → heart → aorta → tissue).
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import pointsJson from '../assets/organ-points.json';
import volumesJson from '../assets/organ-volumes.json';
import { at, type Timeline } from '../science/espressoSim';

const PTS = pointsJson as Record<string, number[]>;
const VOL = volumesJson as Record<string, number>;
export const PARTICLES = 1500;

export enum Where { Cleared, Metabolite, Body, Intestine, Stomach }

// Where in the body a particle in the "body" compartment sits: caffeine spreads through body water [D4],
// so organs get particles in proportion to their volume (measured from the meshes). The rest of the body's
// water is shown in the outer tissue layer.
const BODY_SITES: [string, number][] = (() => {
  const organs = ['brain', 'liver', 'heart', 'kidney_l', 'kidney_r', 'pancreas', 'aorta', 'vena_cava'];
  const organWater = organs.map((k) => [k, VOL[k] * 0.75] as [string, number]); // ~75% water (estimate)
  const tbw = 41.45; // reference adult (Watson)
  const rest = tbw - organWater.reduce((a, [, v]) => a + v, 0);
  return [...organWater, ['skin', rest]];
})();
const GUT_SITES: [string, number][] = [['duodenum', 0.3], ['jejunum', 0.5], ['ileum', 0.2]];

function pick<T>(sites: [T, number][], r: number): T {
  const total = sites.reduce((a, [, w]) => a + w, 0);
  let x = r * total;
  for (const [k, w] of sites) { if ((x -= w) <= 0) return k; }
  return sites[sites.length - 1][0];
}

const rand = (seed: number) => { let s = seed; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const pointOf = (organ: string, r: number) => {
  const p = PTS[organ];
  const i = Math.floor(r * (p.length / 3)) * 3;
  return new THREE.Vector3(p[i], p[i + 1], p[i + 2]);
};

interface P { where: Where; path: THREE.Vector3[]; start: number; home: Record<Where, THREE.Vector3>; via: Record<string, THREE.Vector3> }

const COLORS: Record<Where, THREE.Color> = {
  [Where.Stomach]: new THREE.Color('#ffc46b'),
  [Where.Intestine]: new THREE.Color('#ffc46b'),
  [Where.Body]: new THREE.Color('#ffd98a'),
  [Where.Metabolite]: new THREE.Color('#b48cff'),
  [Where.Cleared]: new THREE.Color('#8fa3b8'),
};
const TRAVEL_S = 1.6; // seconds of screen time for one journey, independent of playback speed

function route(p: P, from: Where, to: Where, pos: THREE.Vector3): THREE.Vector3[] {
  const v = p.via;
  if (to < from - 1 || to > from) return [p.home[to]]; // scrubbing backwards or jumps: go straight there
  switch (to) {
    case Where.Intestine: return [pos, v.duodenum, p.home[to]];
    case Where.Body: return [pos, v.portal, v.liver, v.cava, v.heart, v.aorta, p.home[to]];
    case Where.Metabolite: return [pos, v.cava, v.liver, v.cava, v.heart, v.aorta, p.home[to]];
    case Where.Cleared: return [pos, v.aorta, v.kidney, p.home[to]];
    default: return [p.home[to]];
  }
}

export function whereAt(i: number, sim: Timeline, minute: number): Where {
  const q = ((i + 0.5) / PARTICLES) * sim.doseMg;
  let acc = at(sim.cleared, minute); if (q < acc) return Where.Cleared;
  acc += at(sim.metabolites, minute); if (q < acc) return Where.Metabolite;
  acc += at(sim.body, minute); if (q < acc) return Where.Body;
  acc += at(sim.intestine, minute); if (q < acc) return Where.Intestine;
  return Where.Stomach;
}

export function Particles({ sim, minute }: { sim: Timeline; minute: number }) {
  const particles = useMemo<P[]>(() => Array.from({ length: PARTICLES }, (_, i) => {
    const r = rand(i * 7919 + 17);
    const kidney = r() < 0.5 ? 'kidney_l' : 'kidney_r';
    const home = {
      [Where.Stomach]: pointOf('stomach', r()),
      [Where.Intestine]: pointOf(pick(GUT_SITES, r()), r()),
      [Where.Body]: pointOf(pick(BODY_SITES, r()), r()),
      [Where.Metabolite]: pointOf(pick(BODY_SITES, r()), r()),
      [Where.Cleared]: pointOf('bladder', r()),
    } as Record<Where, THREE.Vector3>;
    const via = {
      duodenum: pointOf('duodenum', r()), portal: pointOf('portal_vein', r()), liver: pointOf('liver', r()),
      cava: pointOf('vena_cava', r()), heart: pointOf('heart', r()), aorta: pointOf('aorta', r()), kidney: pointOf(kidney, r()),
    };
    return { where: Where.Stomach, path: [home[Where.Stomach]], start: -1e9, home, via };
  }), []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PARTICLES * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(PARTICLES * 3), 3));
    return g;
  }, []);
  const sprite = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d')!, gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
  const tmp = useRef(new THREE.Vector3());

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    const pos = geo.attributes.position.array as Float32Array, col = geo.attributes.color.array as Float32Array;
    for (let i = 0; i < PARTICLES; i++) {
      const p = particles[i];
      const w = whereAt(i, sim, minute);
      const cur = tmp.current;
      // current position along its path
      const f = Math.min(1, (now - p.start) / TRAVEL_S);
      along(p.path, f, cur);
      if (w !== p.where) { p.path = route(p, p.where, w, cur.clone()); p.start = now; p.where = w; along(p.path, 0, cur); }
      pos[i * 3] = cur.x; pos[i * 3 + 1] = cur.y; pos[i * 3 + 2] = cur.z;
      const c = COLORS[p.where];
      // cleared particles are drawn dimmer: they have left the blood (when the bladder empties is not modelled)
      const fade = p.where === Where.Cleared ? 0.35 : 1;
      col[i * 3] = c.r * fade; col[i * 3 + 1] = c.g * fade; col[i * 3 + 2] = c.b * fade;
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
  });

  return (
    <points geometry={geo} frustumCulled={false} renderOrder={5}>
      <pointsMaterial size={0.012} map={sprite} vertexColors transparent depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

/** Point at fraction f along a polyline (by segment count, eased). */
function along(path: THREE.Vector3[], f: number, out: THREE.Vector3) {
  if (path.length === 1 || f >= 1) return out.copy(path[path.length - 1]);
  const e = f * f * (3 - 2 * f);
  const x = e * (path.length - 1), i = Math.floor(x);
  return out.copy(path[i]).lerp(path[i + 1], x - i);
}
