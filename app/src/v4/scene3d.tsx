// Everything that needs three.js / react-three-fiber / drei, in one module. AppV4 reaches it only through
// ./lazy3d (dynamic import), so the hosted build (vite.site.config.ts) puts it in its own chunk that loads after
// the first paint; the single-file build inlines it as before.
import { useThree, type RootState } from '@react-three/fiber';
export { advance } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import type { ComponentProps } from 'react';
/** drei's OrbitControls as a plain function component (React.lazy needs one; no ref is used). */
export function OrbitControls(props: ComponentProps<typeof DreiOrbitControls>) { return <DreiOrbitControls {...props} />; }
export { Body } from '../scene/Body';
export { Flow } from '../scene/Flow';
export { CameraRig } from '../scene/CameraRig';
export { FlowPaths } from '../scene/FlowPaths';
export { LiquidRoute } from '../scene/LiquidRoute';
export { CompareScene } from './CompareVideo';
export { VideoCam } from './VideoCam';
export { SafeCanvas } from './perf/SafeCanvas';

/** Hands the r3f state to the app (the video recorder renders and steps frames itself). */
export function ExposeState({ into }: { into: React.MutableRefObject<RootState | null> }) {
  into.current = useThree();
  return null;
}
