// The video camera (2026-10-23, body-first redesign): while a video is recorded it takes over the app's camera and
// films the shots the recorder asks for (video-cam.ts): it starts wide, pushes in to the organ each moment is about,
// follows the drink, and pulls back for the quiet hours and the end. The user's orbit controls rest meanwhile.
import { useEffect, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { cameraOf, poseOf, rigAt, stepRig, type Rig, type Shot } from './video-cam';

/** What the recorder wants filmed next. `start` (set once) puts the camera there at once, before the first frame. */
export interface ShotCue { shot: Shot; start?: Shot | null; /** round 11: the food's variety seed (the sway) */ seed?: number }

type Ctl = { enabled: boolean; target: { set: (x: number, y: number, z: number) => void } } | null;

export function VideoCam({ cue }: { cue: MutableRefObject<ShotCue | null> }) {
  const { camera, controls } = useThree() as unknown as { camera: PerspectiveCamera; controls: Ctl };
  const rig = useRef<Rig | null>(null);
  useEffect(() => {
    if (controls) controls.enabled = false;
    return () => { if (controls) controls.enabled = true; };
  }, [controls]);
  useFrame((_, dt) => {
    const c = cue.current;
    if (!c) return;
    if (c.start) { rig.current = rigAt(poseOf(c.start)); c.start = null; }
    const goal = poseOf(c.shot);
    rig.current = rig.current ? stepRig(rig.current, goal, Math.min(0.1, Math.max(0, dt))) : rigAt(goal);
    const { pos, look } = cameraOf(rig.current, camera.fov, undefined, c.seed);
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(look[0], look[1], look[2]);
    camera.updateMatrixWorld();
    controls?.target.set(look[0], look[1], look[2]); // the user's controls resume from here afterwards
  });
  return null;
}
