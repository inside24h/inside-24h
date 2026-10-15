// Device checks for the 3D stage: can it do WebGL at all, is it a weak phone, is it a touch screen.

/** True when the browser can create a WebGL context (a throwaway one, released straight away). */
export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** 'low' = few cores or little memory (budget Android phones): no antialiasing, lower pixel ratio. */
export function deviceTier(): 'low' | 'high' {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency || 8, memGb = nav.deviceMemory ?? 8;
  return cores <= 4 || memGb <= 4 ? 'low' : 'high';
}

/** A finger is the main pointer (phones, tablets): swipe and pinch instead of drag and scroll. */
export const isTouch = () => typeof matchMedia !== 'undefined' && matchMedia('(hover: none) and (pointer: coarse)').matches;
