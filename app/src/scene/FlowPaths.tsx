// Glowing streams that show the drink moving BETWEEN organs. Each path runs through the real organ
// positions (centres of the BodyParts3D meshes); its brightness follows how much is flowing there right now.
import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Bounds } from './Body';

export interface Flows { swallow: number; empty: number; absorb: number; blood: number; kidney: number; colon?: number }

const center = (b: Bounds, k: string) => b[k]?.getCenter(new THREE.Vector3());
const top = (b: Bounds, k: string) => { const c = center(b, k); return c && b[k] ? new THREE.Vector3(c.x, b[k].max.y - 0.01, c.z) : undefined; };
const bottom = (b: Bounds, k: string) => { const c = center(b, k); return c && b[k] ? new THREE.Vector3(c.x, b[k].min.y + 0.01, c.z) : undefined; };

const vertex = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const fragment = /* glsl */ `
  uniform vec3 color; uniform float time; uniform float amount; uniform float speed;
  varying vec2 vUv;
  void main() {
    float pulse = smoothstep(0.55, 1.0, fract(vUv.x * 9.0 - time * speed));
    // real drink colour with a lighter moving pulse, so dark drinks (cola, coffee) stay visible
    vec3 lighter = min(color * 4.5 + 0.06, vec3(1.0)); // same hue, lit from behind
    vec3 c = mix(color, lighter, 0.35 + 0.5 * pulse);
    gl_FragColor = vec4(c, amount * (0.75 + 0.25 * pulse));
  }`;

// Soft halo around the stream (additive, very faint) so it reads from across the room even when the drink is dark.
const haloFragment = /* glsl */ `
  uniform vec3 color; uniform float time; uniform float amount; uniform float speed;
  varying vec2 vUv;
  void main() {
    float pulse = smoothstep(0.4, 1.0, fract(vUv.x * 9.0 - time * speed));
    vec3 lighter = min(color * 4.5 + 0.08, vec3(1.0));
    gl_FragColor = vec4(lighter * amount * (0.12 + 0.18 * pulse), 1.0);
  }`;

export interface Tube { core: THREE.TubeGeometry; halo: THREE.TubeGeometry }

function useTube(points: (THREE.Vector3 | undefined)[], radius: number): Tube | null {
  return useMemo(() => {
    const pts = points.filter(Boolean) as THREE.Vector3[];
    if (pts.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(pts);
    return { core: new THREE.TubeGeometry(curve, 160, radius, 10, false), halo: new THREE.TubeGeometry(curve, 160, radius * 2.4, 10, false) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.map((p) => p?.toArray().join()).join('|'), radius]);
}

function Stream({ geo, color, amount, speed }: { geo: Tube | null; color: string; amount: number; speed: number }) {
  const [mat, halo] = useMemo(() => {
    const uniforms = { color: { value: new THREE.Color(color) }, time: { value: 0 }, amount: { value: 0 }, speed: { value: speed } };
    return [
      new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, depthTest: false, blending: THREE.NormalBlending }),
      new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: haloFragment, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }),
    ];
  }, [color, speed]);
  useEffect(() => () => { mat.dispose(); halo.dispose(); }, [mat, halo]);
  useEffect(() => () => { geo?.core.dispose(); geo?.halo.dispose(); }, [geo]);
  useFrame((st, dt) => {
    mat.uniforms.time.value = st.clock.elapsedTime; // uniforms object is shared with the halo
    mat.uniforms.amount.value += (Math.min(1, amount) - mat.uniforms.amount.value) * (1 - Math.exp(-dt * 4));
  });
  if (!geo) return null;
  return (
    <group>
      <mesh geometry={geo.halo} material={halo} renderOrder={5} />
      <mesh geometry={geo.core} material={mat} renderOrder={6} />
    </group>
  );
}

export function FlowPaths({ bounds, color, flows, toKidneys }: { bounds: Bounds; color: string; flows: Flows; toKidneys: boolean }) {
  const b = bounds;
  const swallowGeo = useTube([center(b, 'tongue'), top(b, 'esophagus'), bottom(b, 'esophagus'), center(b, 'stomach')], 0.016);
  const emptyGeo = useTube([center(b, 'stomach'), center(b, 'duodenum'), center(b, 'jejunum')], 0.017);
  const absorbGeo = useTube([center(b, 'jejunum'), center(b, 'portal_vein'), center(b, 'liver'), center(b, 'vena_cava'), center(b, 'heart')], 0.013);
  const bloodGeo = useTube([center(b, 'heart'), top(b, 'aorta'), bottom(b, 'aorta')], 0.013);
  const kidneyGeo = useTube([bottom(b, 'aorta'), center(b, 'kidney_l'), center(b, 'bladder')], 0.013);
  // leftovers: end of the small intestine → caecum → up the right side → across → down the left side → out
  const colonGeo = useTube([center(b, 'ileum'), center(b, 'cecum'), top(b, 'colon_asc'), center(b, 'colon_trans'), top(b, 'colon_desc'), bottom(b, 'colon_desc'), center(b, 'rectum'), bottom(b, 'rectum')], 0.015);
  return (
    <group>
      <Stream geo={swallowGeo} color={color} amount={flows.swallow} speed={3} />
      <Stream geo={emptyGeo} color={color} amount={flows.empty} speed={1.2} />
      <Stream geo={absorbGeo} color={color} amount={flows.absorb} speed={1.4} />
      <Stream geo={bloodGeo} color={color} amount={flows.blood} speed={1.8} />
      {toKidneys && <Stream geo={kidneyGeo} color={color} amount={flows.kidney} speed={1} />}
      {flows.colon !== undefined && <Stream geo={colonGeo} color={color} amount={flows.colon} speed={0.5} />}
    </group>
  );
}
