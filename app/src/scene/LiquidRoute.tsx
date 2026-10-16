// The drink as a visible liquid running along its REAL route through the body, in its real colour.
// The route is built from points sampled inside each BodyParts3D organ (pipeline → organ-points.json), so the
// stream winds through the actual stomach, the coils of the small intestine and around the colon.
// Each part of the route fills, thickens and ripples according to how much of the drink is there at this minute,
// and floating labels say where it is and how much.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import pointsJson from '../assets/organ-points.json';

const PTS = pointsJson as Record<string, number[]>;

// Types and labels live in ./segments (no three.js) so the UI can use them before the 3D chunk loads.
import { SEG_LABEL, type SegId, type SegState, type Route } from './segments';
export { SEG_LABEL, type SegId, type SegState, type Route };

// ---------- route geometry from organ interior points ----------
const v3 = (a: number[], i: number) => new THREE.Vector3(a[i], a[i + 1], a[i + 2]);
function cloud(key: string): THREE.Vector3[] { const a = PTS[key] ?? []; const out: THREE.Vector3[] = []; for (let i = 0; i + 2 < a.length; i += 3) out.push(v3(a, i)); return out; }
function centroid(p: THREE.Vector3[]) { const c = new THREE.Vector3(); p.forEach((x) => c.add(x)); return c.multiplyScalar(1 / Math.max(1, p.length)); }

/** k cluster centres of an organ (deterministic k-means), so the path stays inside the organ. */
function clusters(key: string, k: number): THREE.Vector3[] {
  const p = cloud(key);
  if (p.length <= k) return p;
  let c = Array.from({ length: k }, (_, i) => p[Math.floor((i + 0.5) * p.length / k)].clone());
  for (let it = 0; it < 10; it++) {
    const sum = c.map(() => new THREE.Vector3()), n = c.map(() => 0);
    for (const x of p) { let b = 0, bd = Infinity; c.forEach((q, j) => { const d = q.distanceToSquared(x); if (d < bd) { bd = d; b = j; } }); sum[b].add(x); n[b]++; }
    c = c.map((q, j) => (n[j] ? sum[j].multiplyScalar(1 / n[j]) : q));
  }
  return c;
}
/** Order points into a path from `from` towards `to` (greedy nearest neighbour, end biased towards `to`). */
function walk(pts: THREE.Vector3[], from: THREE.Vector3, to?: THREE.Vector3): THREE.Vector3[] {
  const left = [...pts], out: THREE.Vector3[] = [];
  let cur = from;
  while (left.length) {
    let b = 0, bd = Infinity;
    left.forEach((q, j) => { const d = q.distanceTo(cur) + (to && left.length > 2 ? -0.15 * q.distanceTo(to) * (1 - left.length / pts.length) : 0); if (d < bd) { bd = d; b = j; } });
    cur = left.splice(b, 1)[0]; out.push(cur);
  }
  if (to && out.length > 2 && out[0].distanceTo(to) < out[out.length - 1].distanceTo(to)) out.reverse();
  return out;
}
const byY = (key: string, k: number, down = true) => clusters(key, k).sort((a, b) => (down ? b.y - a.y : a.y - b.y));

export function buildRoute(): Record<SegId, THREE.Vector3[]> {
  const tongue = centroid(cloud('tongue'));
  const eso = byY('esophagus', 6);
  const duoC = centroid(cloud('duodenum')), jejC = centroid(cloud('jejunum')), ileC = centroid(cloud('ileum'));
  const stom = walk(clusters('stomach', 6), eso[eso.length - 1], duoC);
  const duo = walk(clusters('duodenum', 5), stom[stom.length - 1], jejC);
  const cecum = centroid(cloud('cecum'));
  const jej = walk(clusters('jejunum', 14), duo[duo.length - 1], ileC);
  const ile = walk(clusters('ileum', 12), jej[jej.length - 1], cecum);
  const portal = byY('portal_vein', 3, false), liver = walk(clusters('liver', 4), portal[portal.length - 1]);
  const vc = byY('vena_cava', 5, false), heart = centroid(cloud('heart')), aorta = byY('aorta', 7);
  const kid = centroid(cloud('kidney_l')), blad = centroid(cloud('bladder'));
  const asc = byY('colon_asc', 4, false), trans = clusters('colon_trans', 6).sort((a, b) => a.x - b.x), desc = byY('colon_desc', 4), rect = byY('rectum', 3);
  const exit = rect[rect.length - 1].clone().add(new THREE.Vector3(0, -0.05, -0.01));
  return {
    swallow: [tongue, ...eso],
    stomach: [eso[eso.length - 1], ...stom],
    duodenum: [stom[stom.length - 1], ...duo],
    small: [duo[duo.length - 1], ...jej, ...ile],
    portal: [jejC, ...portal, ...liver],
    blood: [liver[liver.length - 1], ...vc.filter((p) => p.y > liver[liver.length - 1].y - 0.02), heart, ...aorta],
    kidney: [aorta[aorta.length - 1], kid, blad],
    bladder: [blad.clone().add(new THREE.Vector3(0, 0.015, 0)), blad, blad.clone().add(new THREE.Vector3(0, -0.015, 0))],
    colon: [ile[ile.length - 1], cecum, ...asc, ...trans, ...desc, ...rect, exit],
  };
}

// ---------- shaders ----------
const vert = /* glsl */ `
  uniform float thick; uniform float bead; uniform float len; uniform float time; uniform float flow;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vBead;
  void main() {
    vUv = uv;
    // droplets: small swellings that travel downstream, faster when more is flowing
    float b = smoothstep(0.82, 1.0, fract(uv.x * len * 22.0 - time * (0.5 + 2.5 * flow)));
    vBead = b;
    vec3 p = position + normal * (thick + bead * b); // swell where there is more liquid, bulge at each droplet
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
const frag = /* glsl */ `
  uniform vec3 color; uniform float time; uniform float fill; uniform float front; uniform float flow; uniform float len;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vBead;
  void main() {
    if (vUv.x > front) discard;                       // the liquid has not got this far yet
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.4);
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    // shading inside the real colour: light drinks get a soft darker edge, dark drinks a lighter one
    vec3 edgeCol = lum > 0.45 ? color * 0.62 : min(color * 4.0 + 0.08, vec3(1.0));
    vec3 c = mix(color, edgeCol, 0.55 * f);
    c = mix(c, vec3(1.0), 0.35 * vBead * (1.0 - f));   // glossy highlight on each droplet
    float edge = smoothstep(front, front - 0.03, vUv.x); // soft leading edge
    float a = fill * 0.96 * edge;
    if (a < 0.02) discard;
    gl_FragColor = vec4(c, a);
  }`;
// contrast outline drawn just behind the stream: dark for light drinks (milk, water), light for dark ones (cola, coffee)
const outlineFrag = /* glsl */ `
  uniform vec3 color; uniform float fill; uniform float front;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vBead;
  void main() {
    if (vUv.x > front) discard;
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    vec3 c = lum > 0.45 ? vec3(0.02, 0.05, 0.10) : min(color * 5.0 + 0.25, vec3(1.0));
    float a = fill * 0.9 * smoothstep(front, front - 0.03, vUv.x);
    if (a < 0.02) discard;
    gl_FragColor = vec4(c, a);
  }`;// soft glow of the same hue around the stream, so near-black drinks (cola, coffee) still read on the dark scene
const haloFrag = /* glsl */ `
  uniform vec3 color; uniform float time; uniform float fill; uniform float front; uniform float flow; uniform float len;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() {
    if (vUv.x > front) discard;
    float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
    float waves = 0.5 + 0.5 * sin((vUv.x * len * 90.0) - time * (1.0 + 7.0 * flow));
    vec3 lighter = min(color * 4.5 + 0.1, vec3(1.0));
    float dark = 1.0 - clamp(max(color.r, max(color.g, color.b)) * 1.6, 0.0, 1.0); // more glow for darker drinks
    gl_FragColor = vec4(lighter * fill * (0.03 + 0.6 * dark) * (1.0 - f) * (0.8 + 0.4 * waves), 1.0);
  }`;
const ghostFrag = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vV; uniform float time;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
    float dash = step(0.5, fract(vUv.x * 40.0 - time * 0.3));
    gl_FragColor = vec4(vec3(0.75, 0.88, 1.0), (0.05 + 0.10 * f) * (0.6 + 0.4 * dash));
  }`;

interface SegMesh { id: SegId; curve: THREE.CatmullRomCurve3; geo: THREE.TubeGeometry; ghost: THREE.TubeGeometry; halo: THREE.TubeGeometry; outline: THREE.TubeGeometry; mat: THREE.ShaderMaterial; ghostMat: THREE.ShaderMaterial; haloMat: THREE.ShaderMaterial; outlineMat: THREE.ShaderMaterial; len: number; seen: number }
const RADIUS: Record<SegId, number> = { swallow: 0.0055, stomach: 0.009, duodenum: 0.006, small: 0.0055, portal: 0.004, blood: 0.004, kidney: 0.0035, bladder: 0.008, colon: 0.006 };

export function LiquidRoute({ route, color, minute, labels = true, maxLabels = 3 }: { route: Route; color: string; minute: number; labels?: boolean; maxLabels?: number }) {
  const segs = useMemo<SegMesh[]>(() => {
    const paths = buildRoute();
    return (Object.keys(paths) as SegId[]).map((id) => {
      const curve = new THREE.CatmullRomCurve3(paths[id], false, 'centripetal', 0.5);
      const len = curve.getLength();
      const n = Math.max(24, Math.round(len * 900));
      const uniforms = { color: { value: new THREE.Color(color) }, time: { value: 0 }, fill: { value: 0 }, front: { value: 0 }, flow: { value: 0 }, thick: { value: 0 }, bead: { value: 0 }, len: { value: len } };
      const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, depthTest: false, blending: THREE.NormalBlending });
      const haloMat = new THREE.ShaderMaterial({ uniforms: { ...uniforms, thick: { value: 0 } }, vertexShader: vert, fragmentShader: haloFrag, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
      const outlineMat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: outlineFrag, transparent: true, depthWrite: false, depthTest: false, blending: THREE.NormalBlending });
      const ghostMat = new THREE.ShaderMaterial({ uniforms: { time: uniforms.time, thick: { value: 0 }, bead: { value: 0 }, len: uniforms.len, flow: { value: 0 } }, vertexShader: vert, fragmentShader: ghostFrag, transparent: true, depthWrite: false, depthTest: false });
      return { id, curve, len, seen: 0, mat, ghostMat, haloMat, outlineMat, outline: new THREE.TubeGeometry(curve, n, RADIUS[id] * 1.35, 10, false), halo: new THREE.TubeGeometry(curve, n, RADIUS[id] * 2.6, 10, false), geo: new THREE.TubeGeometry(curve, n, RADIUS[id], 10, false), ghost: new THREE.TubeGeometry(curve, n, RADIUS[id] * 0.35, 6, false) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => segs.forEach((s) => { s.geo.dispose(); s.ghost.dispose(); s.halo.dispose(); s.outline.dispose(); s.outlineMat.dispose(); s.mat.dispose(); s.ghostMat.dispose(); s.haloMat.dispose(); }), [segs]);
  const col = useMemo(() => new THREE.Color(color), [color]);
  const state = route.segs(minute);
  const lastMinute = useRef(minute);

  useFrame((st, dt) => {
    const k = 1 - Math.exp(-dt * 5);
    const back = minute < lastMinute.current - 0.5; // scrubbed backwards: reset how far the liquid has reached
    lastMinute.current = minute;
    for (const s of segs) {
      const u = s.mat.uniforms, x = state[s.id];
      u.time.value = st.clock.elapsedTime;
      (u.color.value as THREE.Color).lerp(col, k);
      const target = x && x.frac > 0.002 ? Math.min(1, 0.6 + x.frac * 3) : 0; // any liquid present is clearly visible
      u.fill.value += (target - u.fill.value) * k;
      u.flow.value += ((x?.flow ?? 0) - u.flow.value) * k;
      u.thick.value = RADIUS[s.id] * (0.1 + Math.min(0.35, (x?.frac ?? 0) * 1.5)); // always clearly thick once present
      u.bead.value = RADIUS[s.id] * 0.4 * Math.min(1, 0.3 + (x?.flow ?? 0));
      if (x?.front !== undefined) s.seen += (x.front - s.seen) * k; // progress known from the model
      else {
        // the front advances while liquid is in the segment (fast for drinks), and stays once reached
        if (back) s.seen = 0;
        if (x && x.frac > 0.002) s.seen = Math.min(1.02, s.seen + dt * (0.6 + 2.5 * (x.flow ?? 0)));
        else if (!x || x.frac <= 0.0005) s.seen = Math.max(0, s.seen - dt * 0.4);
      }
      u.front.value = s.seen;
    }
  });

  // labels: where most of it is now, plus up to two other places with a real share
  const ranked = (Object.entries(state) as [SegId, SegState][]).filter(([, v]) => v.frac >= 0.04).sort((a, b) => b[1].frac - a[1].frac).slice(0, maxLabels);
  const fmt = (v: number) => (v >= 100 ? Math.round(v).toString() : v >= 10 ? v.toFixed(0) : v.toFixed(1));
  return (
    <group>
      {segs.map((s) => (
        <group key={s.id}>
          <mesh geometry={s.ghost} material={s.ghostMat} renderOrder={5} />
          <mesh geometry={s.halo} material={s.haloMat} renderOrder={6} />
          <mesh geometry={s.outline} material={s.outlineMat} renderOrder={6} />
          <mesh geometry={s.geo} material={s.mat} renderOrder={7} />
        </group>
      ))}
      {labels && ranked.map(([id, v], i) => {
        const seg = segs.find((s) => s.id === id)!;
        const at = seg.curve.getPoint(id === 'small' || id === 'colon' ? 0.45 : 0.6);
        return (
          <Html key={id} position={at} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <div className={`rlabel ${i === 0 ? 'main' : ''}`}>
              <i style={{ background: color }} />{SEG_LABEL[id]} <b>{v.text ?? `${fmt(v.amount)} ${v.unit ?? route.unit}`}</b>
            </div>
          </Html>
        );
      })}
    </group>
  );
}
