import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { MeshoptDecoder as MeshoptDecoderJS } from './meshoptDecoderReference.js';
import anatomyData from '../assets/anatomy.meshopt.glb?inline';
import type { OrganKey } from '../content/types';

// The model ships inside the bundle as a base64 data URL and is decoded in memory.
// No fetch: sandboxed hosts (e.g. claude.ai previews) may block network requests, data: URLs included.
// It is meshopt-compressed (pipeline/compress-anatomy.mjs, ~2.6x smaller). The fast decoder is WebAssembly,
// embedded in the JS (no fetch); where WebAssembly is blocked, the slower pure-JS decoder takes over.
async function meshoptDecoder() {
  try {
    await MeshoptDecoder.ready;
    if (MeshoptDecoder.supported) return MeshoptDecoder;
  } catch { /* fall through to the JS decoder */ }
  return MeshoptDecoderJS;
}

let anatomyPromise: Promise<THREE.Group> | null = null;
function loadAnatomy(): Promise<THREE.Group> {
  if (!anatomyPromise) {
    anatomyPromise = meshoptDecoder().then((decoder) => new Promise((resolve, reject) => {
      const bin = atob(anatomyData.slice(anatomyData.indexOf(',') + 1));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      new GLTFLoader().setMeshoptDecoder(decoder as typeof MeshoptDecoder).parse(bytes.buffer, '', (gltf) => resolve(gltf.scene), reject);
    }));
  }
  return anatomyPromise;
}

// Colour per structure. `base` is how visible it is when idle (0 = only the rim shows).
const STYLE: Record<OrganKey, { color: string; base: number; rim: number }> = {
  skin: { color: '#58c6ff', base: 0.0, rim: 0.32 },
  brain: { color: '#b9cdfa', base: 0.05, rim: 0.7 },
  tongue: { color: '#ff8a9a', base: 0.05, rim: 0.7 },
  esophagus: { color: '#ffb4a0', base: 0.05, rim: 0.7 },
  stomach: { color: '#ff9e6b', base: 0.05, rim: 0.8 },
  duodenum: { color: '#f3a6c1', base: 0.05, rim: 0.7 },
  jejunum: { color: '#f3a6c1', base: 0.04, rim: 0.6 },
  ileum: { color: '#f3a6c1', base: 0.04, rim: 0.6 },
  cecum: { color: '#c79cff', base: 0.04, rim: 0.6 },
  colon_asc: { color: '#c79cff', base: 0.04, rim: 0.6 },
  colon_trans: { color: '#c79cff', base: 0.04, rim: 0.6 },
  colon_desc: { color: '#c79cff', base: 0.04, rim: 0.6 },
  rectum: { color: '#c79cff', base: 0.04, rim: 0.6 },
  liver: { color: '#d05a74', base: 0.05, rim: 0.7 },
  gallbladder: { color: '#7fdc8f', base: 0.05, rim: 0.7 },
  pancreas: { color: '#ffd27a', base: 0.05, rim: 0.7 },
  portal_vein: { color: '#7d95ff', base: 0.05, rim: 0.7 },
  kidney_l: { color: '#ffb07a', base: 0.05, rim: 0.7 },
  kidney_r: { color: '#ffb07a', base: 0.05, rim: 0.7 },
  bladder: { color: '#ffe08a', base: 0.05, rim: 0.7 },
  heart: { color: '#ff5a6a', base: 0.01, rim: 0.3 }, // 83 overlapping parts add up, so keep each faint
  aorta: { color: '#ff4d5e', base: 0.04, rim: 0.6 },
  vena_cava: { color: '#5a78ff', base: 0.04, rim: 0.6 },
  lung_l: { color: '#7fb5d6', base: 0.0, rim: 0.18 },
  lung_r: { color: '#7fb5d6', base: 0.0, rim: 0.18 },
};

const vertexShader = /* glsl */ `
  varying vec3 vN; varying vec3 vV; varying float vY;
  void main() {
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = normalize(-mv.xyz);
    vY = (modelMatrix * vec4(position, 1.0)).y;
    gl_Position = projectionMatrix * mv;
  }`;

const fragmentShader = /* glsl */ `
  uniform vec3 color; uniform float base; uniform float rim; uniform float glow; uniform float time; uniform float dimv;
  varying vec3 vN; varying vec3 vV; varying float vY;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
    float scan = exp(-pow((vY - (1.75 - mod(time * 0.12, 1.9))) * 40.0, 2.0)) * 0.25;
    float pulse = 0.85 + 0.15 * sin(time * 3.0);
    float k = base + f * rim + scan * rim + glow * (0.35 + f * 1.6) * pulse;
    gl_FragColor = vec4(color * k * dimv, 1.0);
  }`;

// The drink itself, drawn in its REAL colour on top of the glowing organ (normal blending, so a dark cola
// shows as a dark mass and milk as white). `fill` = level from the bottom of the organ (stomach, bladder) with a
// lighter, gently waving surface; `tint` = the drink spread through a tube or tissue (gut, blood, liver), with
// slow ripples running along it.
const liquidFragment = /* glsl */ `
  uniform vec3 liquid; uniform float fill; uniform float tint; uniform float yMin; uniform float yMax; uniform float time;
  varying vec3 vN; varying vec3 vV; varying float vY;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.5);
    float level = yMin + fill * (yMax - yMin) + 0.003 * sin(time * 2.2 + vY * 60.0);
    float inside = fill > 0.001 ? smoothstep(level + 0.002, level - 0.002, vY) : 0.0;
    float surface = fill > 0.001 ? exp(-pow((vY - level) * 300.0, 2.0)) : 0.0;
    float flow = 0.85 + 0.15 * sin(time * 3.0 - vY * 40.0);
    float a = max(inside * (0.8 + 0.15 * f), tint * (0.4 + 0.45 * f) * flow);
    a = max(a, surface * 0.95);
    // Edges show a lighter shade of the SAME colour (like cola held up to the light: dark core, amber rim),
    // so even near-black drinks keep their shape against the dark scene without changing their colour.
    vec3 rimCol = min(liquid * 4.5 + 0.06, vec3(1.0));
    vec3 c = mix(liquid, rimCol, 0.6 * f);
    c = mix(c, vec3(1.0), 0.4 * surface);
    if (a < 0.01) discard;
    gl_FragColor = vec4(c, clamp(a, 0.0, 0.95));
  }`;

export type Glow = Partial<Record<OrganKey, number>>;
export type Liquid = Record<string, { fill?: number; tint?: number }>;
export type Bounds = Record<string, THREE.Box3>;

// Structures you cannot click: they wrap or cover the organs in front of them.
const NOT_CLICKABLE = new Set(['skin', 'lung_l', 'lung_r']);

interface BodyProps {
  glow: Glow; selected: string | null; onSelect: (key: string | null) => void; onError: (e: unknown) => void;
  liquid?: Liquid; liquidColor?: string; onBounds?: (b: Bounds) => void;
  /** Focus mode: every structure not listed in keep fades to this brightness (1 = off), so the liquid stands out. */
  dim?: number; keep?: string[];
}

export function Body({ glow, selected, onSelect, onError, liquid = {}, liquidColor = '#ffffff', onBounds, dim = 1, keep = [] }: BodyProps) {
  const keepSet = useMemo(() => new Set(keep), [keep.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const bounds = useRef<Bounds>({});
  // each Body gets its own copy of the model (geometry shared), so two bodies can be shown side by side
  useEffect(() => { loadAnatomy().then((s) => setScene(s.clone(true)), onError); }, [onError]);

  const { materials, liquids } = useMemo(() => {
    const out = new Map<string, THREE.ShaderMaterial>();
    const liq = new Map<string, THREE.ShaderMaterial>();
    if (!scene) return { materials: out, liquids: liq };
    scene.updateMatrixWorld(true);
    const meshes: THREE.Mesh[] = [];
    scene.traverse((obj) => { if (obj instanceof THREE.Mesh && !obj.userData.isLiquid) meshes.push(obj); });
    for (const obj of meshes) {
      const key = obj.name as OrganKey;
      const style = STYLE[key] ?? { color: '#ffffff', base: 0.05, rim: 0.5 };
      obj.geometry.computeVertexNormals();
      const box = new THREE.Box3().setFromObject(obj);
      bounds.current[key] = box;
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(style.color) },
          base: { value: style.base },
          rim: { value: style.rim },
          glow: { value: 0 },
          time: { value: 0 },
          dimv: { value: 1 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      obj.material = mat;
      obj.renderOrder = key === 'skin' ? 2 : 1;
      if (NOT_CLICKABLE.has(key)) obj.raycast = () => {};
      out.set(key, mat);
      // the drink layer: same shape, drawn after the hologram in the drink's real colour
      if (key !== 'skin' && key !== 'lung_l' && key !== 'lung_r' && !obj.children.some((c) => c.userData.isLiquid)) {
        const lm = new THREE.ShaderMaterial({
          uniforms: { liquid: { value: new THREE.Color('#ffffff') }, fill: { value: 0 }, tint: { value: 0 }, yMin: { value: box.min.y }, yMax: { value: box.max.y }, time: { value: 0 } },
          vertexShader, fragmentShader: liquidFragment, transparent: true, depthWrite: false, depthTest: false,
          blending: THREE.NormalBlending, side: THREE.FrontSide,
        });
        const lmesh = new THREE.Mesh(obj.geometry, lm);
        lmesh.userData.isLiquid = true;
        lmesh.renderOrder = 4;
        lmesh.raycast = () => {};
        obj.add(lmesh);
        liq.set(key, lm);
      }
    }
    return { materials: out, liquids: liq };
  }, [scene]);

  useEffect(() => () => { materials.forEach((m) => m.dispose()); liquids.forEach((m) => m.dispose()); }, [materials, liquids]);
  useEffect(() => { if (scene && onBounds) onBounds({ ...bounds.current }); }, [scene, materials, onBounds]);
  const liquidCol = useMemo(() => new THREE.Color(liquidColor), [liquidColor]);

  useFrame((state, dt) => {
    const k = 1 - Math.exp(-dt * 4); // smooth toward target, frame-rate independent
    materials.forEach((m, key) => {
      const target = Math.max(glow[key as OrganKey] ?? 0, key === selected ? 0.8 : 0);
      m.uniforms.glow.value += (target - m.uniforms.glow.value) * k;
      m.uniforms.time.value = state.clock.elapsedTime;
      const d = keepSet.has(key) || key === selected ? 1 : dim;
      m.uniforms.dimv.value += (d - m.uniforms.dimv.value) * (1 - Math.exp(-dt * 2.5));
    });
    liquids.forEach((m, key) => {
      const l = liquid[key];
      m.uniforms.time.value = state.clock.elapsedTime;
      m.uniforms.fill.value += ((l?.fill ?? 0) - m.uniforms.fill.value) * k;
      m.uniforms.tint.value += (Math.min(1, l?.tint ?? 0) - m.uniforms.tint.value) * k;
      (m.uniforms.liquid.value as THREE.Color).lerp(liquidCol, k);
    });
  });

  if (!scene) return null;
  return (
    <primitive
      object={scene}
      onClick={(e: { stopPropagation: () => void; object: THREE.Object3D; delta: number }) => {
        if (e.delta > 4) return; // it was a drag to rotate, not a click
        e.stopPropagation();
        onSelect(e.object.name === selected ? null : e.object.name);
      }}
      onPointerOver={(e: { stopPropagation: () => void }) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    />
  );
}
