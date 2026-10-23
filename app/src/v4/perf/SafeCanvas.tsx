// The react-three-fiber <Canvas> with phone-friendly defaults:
// - no WebGL at all -> a friendly message instead of an error;
// - weak devices -> no antialiasing and a lower pixel-ratio ceiling;
// - pixel ratio follows the measured frame rate (drei PerformanceMonitor), frozen while a video is recorded;
// - WebGL context lost (phone backgrounded the tab, GPU reset) -> a notice with a reload button until it comes back;
// - preserveDrawingBuffer only where the video export needs it: the frame-exact WebCodecs path renders and reads
//   in the same task, so it does not; the MediaRecorder fallback (no WebCodecs) reads a frame later, so it does.
import { useMemo, useRef, useState } from 'react';
import { Canvas, type CanvasProps } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { canEncode } from '../share';
import { deviceTier, webglAvailable } from './device';

const NO_3D = "Your browser can't show 3D — try opening in Chrome/Safari.";

export function SafeCanvas({ children, gl, frameloop, onCreated, rec, ...rest }: CanvasProps & { /** a video is being recorded (2026-10-23: also the screen-recording fallback) */ rec?: boolean }) {
  // A throwaway test context costs 50–300 ms on slow phones during start-up; the API check is free. If the real
  // context then fails, the ErrorBoundary around the stage shows the same friendly message (AppV4 StageError).
  const ok = useMemo(() => (typeof window !== 'undefined' && 'WebGLRenderingContext' in window) || webglAvailable(), []);
  const tier = useMemo(deviceTier, []);
  const maxDpr = Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, tier === 'low' ? 1.5 : 2);
  const [dpr, setDpr] = useState(maxDpr);
  const [lost, setLost] = useState(false);
  const recording = useRef(false);
  recording.current = frameloop === 'never' || !!rec; // the recorder draws each frame itself: keep the size steady
  // while a video is recorded the body fills a 1080 × 1200 band: render at least 2× (max 3×) so it stays sharp
  // 2026-10-23 body-first: while recording, the canvas is 540 × 960 CSS px (v4.css .stage.recbox) at exactly 2× =
  // the video's 1080 × 1920, so the body fills the whole frame pixel for pixel
  const recDpr = rec ? 2 : Math.min(3, Math.max(dpr, 2));

  if (!ok) return <div className="stage-error nogl" role="alert"><b>{NO_3D}</b><p>Everything else still works.</p></div>;
  return (
    <>
      <Canvas {...rest} frameloop={frameloop} dpr={recording.current ? recDpr : dpr}
        gl={{ antialias: tier !== 'low', alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !canEncode(), ...(gl as object) }}
        onCreated={(state) => {
          const el = state.gl.domElement;
          el.addEventListener('webglcontextlost', () => setLost(true)); // three.js calls preventDefault, so it can be restored
          el.addEventListener('webglcontextrestored', () => setLost(false));
          onCreated?.(state);
        }}>
        <PerformanceMonitor factor={1} flipflops={3}
          onChange={({ factor }) => { if (!recording.current) setDpr(Math.round((1 + (maxDpr - 1) * factor) * 4) / 4); }}
          onFallback={() => { if (!recording.current) setDpr(1); }} />
        {children}
      </Canvas>
      {lost && (
        <div className="stage-error nogl" role="alert">
          <b>The 3D view was paused by your browser.</b>
          <p>It usually comes back by itself. If not: <button className="nogl-reload" onClick={() => location.reload()}>Reload</button></p>
        </div>
      )}
    </>
  );
}
