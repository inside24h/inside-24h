// Two bodies in the MAIN 3D canvas, one on each half, for the side-by-side comparison Reel. Using the one
// canvas the app already renders (instead of extra hidden canvases, which some browsers never draw) keeps it
// reliable; the recorder steps it frame by frame and cuts the left and right halves.
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Body } from '../scene/Body';
import { LiquidRoute } from '../scene/LiquidRoute';
import type { Analysis } from './analyze';

const FOV = 33, DIST = 1.45, CENTER_Y = 1.1;
/** World x of each body: the middle of each half of the screen. */
export function halfOffset(aspect: number) {
  const viewW = 2 * DIST * Math.tan((FOV / 2) * Math.PI / 180) * aspect;
  return viewW / 4;
}

function Side({ a, minute, x }: { a: Analysis; minute: number; x: number }) {
  const story = a.built.story;
  const liquid = story.liquid(minute);
  const soft: typeof liquid = {};
  for (const [k, v] of Object.entries(liquid)) soft[k] = k === 'stomach' || k === 'bladder' ? v : { ...v, tint: Math.min(0.18, (v.tint ?? 0) * 0.25) };
  return (
    <group position={[x, 0, 0]}>
      <Body glow={{}} selected={null} onSelect={() => {}} onError={() => {}} liquid={soft} liquidColor={story.color} dim={0.45} keep={[]} />
      {a.built.route && <LiquidRoute route={a.built.route} color={story.color} minute={minute} labels={false} />}
    </group>
  );
}

export function CompareScene({ a, b, minute }: { a: Analysis; b: Analysis; minute: number }) {
  const { camera, size, controls } = useThree() as unknown as { camera: import('three').PerspectiveCamera; size: { width: number; height: number }; controls: { enabled: boolean; target: { set: (x: number, y: number, z: number) => void }; update: () => void } | null };
  const off = halfOffset(size.width / size.height);
  useEffect(() => {
    camera.position.set(0, CENTER_Y + 0.05, DIST);
    camera.lookAt(0, CENTER_Y, 0);
    if (controls) { controls.target.set(0, CENTER_Y, 0); controls.update(); controls.enabled = false; }
    return () => { if (controls) controls.enabled = true; };
  }, [camera, controls, size.width, size.height]);
  return (<>
    <Side a={a} minute={minute} x={-off} />
    <Side a={b} minute={minute} x={off} />
  </>);
}
