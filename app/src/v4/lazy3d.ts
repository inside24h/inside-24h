// Lazy access to the 3D part (./scene3d: three.js, react-three-fiber, drei, the body, the liquid route).
// The hosted build splits it into its own chunk; main.tsx starts loading it right after the first paint, or at
// once when a deep link opens a food. The components below are drop-in replacements for the real ones; once the
// chunk is in they render without suspending (a synchronously resolved thenable).
import { lazy, type ComponentType } from 'react';
import type { RootState } from '@react-three/fiber';
import { prefetchAnatomy } from '../scene/anatomySource';

type Scene3D = typeof import('./scene3d');
let mod: Scene3D | null = null;
let loading: Promise<Scene3D> | null = null;

/** Start (or join) loading the 3D chunk and the anatomy model. Safe to call any number of times. */
export function load3d(): Promise<Scene3D> {
  if (!loading) {
    prefetchAnatomy(); // download the .glb in parallel with three.js
    loading = import('./scene3d').then((m) => (mod = m));
    loading.catch(() => { loading = null; }); // a dropped connection: the next call tries again
  }
  return loading;
}

type Comp = { [K in keyof Scene3D]: Scene3D[K] extends ComponentType<never> ? K : never }[keyof Scene3D];
function lazyPart<K extends Comp>(k: K) {
  return lazy(() => (mod
    ? ({ then: (ok: (m: { default: Scene3D[K] }) => void) => ok({ default: mod![k] }) } as unknown as Promise<{ default: Scene3D[K] }>)
    : load3d().then((m) => ({ default: m[k] }))));
}

export const SafeCanvas = lazyPart('SafeCanvas');
export const Body = lazyPart('Body');
export const Flow = lazyPart('Flow');
export const FlowPaths = lazyPart('FlowPaths');
export const LiquidRoute = lazyPart('LiquidRoute');
export const CameraRig = lazyPart('CameraRig');
export const CompareScene = lazyPart('CompareScene');
export const OrbitControls = lazyPart('OrbitControls');
export const ExposeState = lazyPart('ExposeState');

/** react-three-fiber's advance(); only called while recording a video, when the 3D chunk is long loaded. */
export function advance(timestamp: number, runGlobalEffects?: boolean, state?: RootState) {
  mod?.advance(timestamp, runGlobalEffects, state);
}
