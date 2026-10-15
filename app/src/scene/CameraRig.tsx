// Flies the camera to the organ the story is talking about. Any drag by the user stops the flight,
// so people can always look around freely; the next chapter starts a new flight.
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Bounds } from './Body';

const HOME_TARGET = new THREE.Vector3(0, 1.15, 0);
const HOME_POS = new THREE.Vector3(0.05, 1.22, 2.05);

interface Controls extends THREE.EventDispatcher<{ start: object }> { target: THREE.Vector3; update: () => void }

export function CameraRig({ focus, bounds, flightKey, minDist = 0.5 }: { focus: string | null; bounds: Bounds; flightKey: string; minDist?: number }) {
  const { camera, controls } = useThree() as unknown as { camera: THREE.Camera; controls: Controls | null };
  const flying = useRef(true);
  const goal = useRef({ target: HOME_TARGET.clone(), pos: HOME_POS.clone() });

  useEffect(() => {
    const box = focus ? bounds[focus] : undefined;
    if (box) {
      const c = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3()).length();
      const dist = Math.min(1.4, Math.max(minDist, size * 2.6));
      goal.current = { target: c, pos: c.clone().add(new THREE.Vector3(0.08, 0.05, dist)) };
    } else if (focus === 'torso') {
      // closer whole-trunk view (head to hips) for the shared video
      goal.current = { target: new THREE.Vector3(0, 1.22, 0), pos: new THREE.Vector3(0.04, 1.26, 1.3) };
    } else {
      goal.current = { target: HOME_TARGET.clone(), pos: HOME_POS.clone() };
    }
    flying.current = true;
  }, [focus, bounds, flightKey, minDist]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => { flying.current = false; };
    controls.addEventListener('start', stop);
    return () => controls.removeEventListener('start', stop);
  }, [controls]);

  useFrame((_, dt) => {
    if (!flying.current || !controls) return;
    const k = 1 - Math.exp(-dt * 2.2);
    controls.target.lerp(goal.current.target, k);
    camera.position.lerp(goal.current.pos, k);
    controls.update();
    if (camera.position.distanceTo(goal.current.pos) < 0.003) flying.current = false;
  });
  return null;
}
