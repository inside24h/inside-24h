// Two bodies for the side-by-side comparison video, in the app's one 3D canvas (extra hidden canvases are never
// drawn by some browsers). 2026-10-23 body-first redesign: SPLIT SCREEN. Each body has its own camera and its own
// half of the canvas (two viewports of one renderer), both cameras make exactly the same moves (video-cam.ts), so
// the same moment happens side by side and the difference is what you see. The recorder steps it frame by frame.
// (Before: one wide camera on two small bodies, cut into halves; see backups/*-video2.)
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Body } from '../scene/Body';
import { LiquidRoute } from '../scene/LiquidRoute';
import type { Analysis } from './analyze';
import { bodyGlowAt, bodyLiquidAt, isLightDrink, paletteAt } from './video-body';
import { cameraOf, poseOf, rigAt, SIDE_X, stepRig, type Rig } from './video-cam';
import type { ShotCue } from './VideoCam';

export { SIDE_X };
/** Kept for older callers: the comparison no longer depends on the canvas shape. */
export function halfOffset(_aspect: number) { return SIDE_X[1]; }

/** Stable no-op handlers: a new function on every frame made Body load a fresh copy of the model each frame (the
 *  brain flickered white while the copies swapped, found 2026-10-24). */
const NOOP = () => {};

/** The cameras, for pinning gauges to organs (AppV4 projects organ centres with them). */
export interface CmpCams { cams: THREE.PerspectiveCamera[]; w: number; h: number }

function Side({ a, minute, x, focus, named = [], group }: { a: Analysis; minute: number; x: number; focus: string | null; named?: string[]; group: (g: THREE.Group | null) => void }) {
  const story = a.built.story;
  // Phase 3 (C5): the drink colour only where the model has it now, as much as is there (the same map as the app)
  const soft = a.built.route ? bodyLiquidAt(a.built, minute) : story.liquid(minute);
  // the organs at work light up, the rest of the body dims (video-body.ts)
  // (phase 4b, B2: the organ this side's card names is lit, the organs in front of it fade)
  const { glow, keep, hide } = bodyGlowAt(a.built, minute, focus, a.glucose !== undefined, named);
  return (
    <group position={[x, 0, 0]} ref={group}>
      <Body glow={glow} selected={null} onSelect={NOOP} onError={NOOP} liquid={soft} liquidColor={story.color} dim={0.42} keep={keep} hide={hide} palette={paletteAt(a.built, minute)} />
      {a.built.route && <LiquidRoute route={a.built.route} color={story.color} minute={minute} labels={false} subtle={isLightDrink(story.color)} vivid />}
    </group>
  );
}

export function CompareScene({ a, b, minute, cue, cams, focus, named, only }: {
  a: Analysis; b: Analysis; minute: number; cue?: MutableRefObject<ShotCue | null>; cams?: MutableRefObject<CmpCams | null>;
  /** the organ each side's current moment is about */ focus?: [string | null, string | null];
  /** phase 4b (B2): the organs each side's card names */ named?: [string[], string[]];
  /** Phase 3 (C17, phones): one side over the whole canvas (the same camera), the other one hidden */ only?: 0 | 1;
}) {
  const { controls } = useThree() as unknown as { controls: { enabled: boolean } | null };
  const groups = useRef<(THREE.Group | null)[]>([null, null]);
  const cameras = useMemo(() => [0, 1].map(() => new THREE.PerspectiveCamera(33, 0.5, 0.05, 20)), []);
  const rig = useRef<Rig | null>(null);
  useEffect(() => {
    if (controls) controls.enabled = false;
    return () => { if (controls) controls.enabled = true; };
  }, [controls]);
  // priority 1: this scene renders itself (two viewports); react-three-fiber then skips its own render
  useFrame((state, dt) => {
    const { gl, scene, size } = state;
    const c = cue?.current;
    if (c?.start) { rig.current = rigAt(poseOf(c.start)); c.start = null; }
    const goal = poseOf(c?.shot ?? { focus: [], zoom: 'wide' });
    rig.current = rig.current ? stepRig(rig.current, goal, Math.min(0.1, Math.max(0, dt))) : rigAt(goal);
    const w = only === undefined ? size.width / 2 : size.width, h = size.height;
    const { pos, look } = cameraOf(rig.current, 33, 0); // split screen: framed exactly (video-cam splitPose)
    cameras.forEach((cam, k) => {
      cam.aspect = w / h; cam.updateProjectionMatrix();
      cam.position.set(pos[0] + SIDE_X[k], pos[1], pos[2]);
      cam.lookAt(look[0] + SIDE_X[k], look[1], look[2]);
      cam.updateMatrixWorld();
    });
    if (cams) cams.current = { cams: cameras, w, h };
    const autoClear = gl.autoClear;
    gl.autoClear = false;
    gl.setScissorTest(false); gl.clear(true, true, true);
    gl.setScissorTest(true);
    for (let k = 0; k < 2; k++) {
      if (only !== undefined && k !== only) continue;
      const x0 = only === undefined ? k * w : 0;
      groups.current.forEach((g, j) => { if (g) g.visible = j === k; });
      gl.setViewport(x0, 0, w, h); gl.setScissor(x0, 0, w, h);
      gl.render(scene, cameras[k]);
    }
    groups.current.forEach((g) => { if (g) g.visible = true; });
    gl.setScissorTest(false); gl.setViewport(0, 0, size.width, size.height);
    gl.autoClear = autoClear;
  }, 1);
  return (<>
    <Side a={a} minute={minute} x={SIDE_X[0]} focus={focus?.[0] ?? null} named={named?.[0]} group={(g) => { groups.current[0] = g; }} />
    <Side a={b} minute={minute} x={SIDE_X[1]} focus={focus?.[1] ?? null} named={named?.[1]} group={(g) => { groups.current[1] = g; }} />
  </>);
}
