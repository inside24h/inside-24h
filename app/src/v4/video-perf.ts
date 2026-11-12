// Phase 2A (2026-11-12): where an export's time goes. Every phase of a video export adds its milliseconds here
// (performance.now() is cheap), the progress badge uses it for an ETA, and QA runs (#perf or #vqa in the link) get a
// summary in the console and on window.__i24perf. Nothing leaves the device.
export interface ExportTimes { ms: Record<string, number>; frames: number; startedAt: number; renderer?: string; /** whole export, ms (set at the end) */ wallMs?: number }

/** The error message of an export the person cancelled (shown as "cancelled", never as a failure). */
export const CANCELLED = 'Cancelled.';

let cur: ExportTimes = { ms: {}, frames: 0, startedAt: 0 };

/** Starts a fresh record (one per export). */
export function perfReset(): ExportTimes {
  cur = { ms: {}, frames: 0, startedAt: typeof performance === 'undefined' ? 0 : performance.now() };
  if (typeof window !== 'undefined') (window as unknown as { __i24perf?: ExportTimes }).__i24perf = cur;
  return cur;
}
export const perfNow = () => cur;
/** Adds `ms` to phase `k`. */
export function perfAdd(k: string, ms: number) { cur.ms[k] = (cur.ms[k] ?? 0) + ms; }
/** Times a synchronous call into phase `k`. */
export function perfTime<T>(k: string, fn: () => T): T {
  const t0 = performance.now();
  try { return fn(); } finally { perfAdd(k, performance.now() - t0); }
}
/** Times a promise into phase `k`. */
export async function perfAwait<T>(k: string, p: Promise<T>): Promise<T> {
  const t0 = performance.now();
  try { return await p; } finally { perfAdd(k, performance.now() - t0); }
}
const qa = () => typeof location !== 'undefined' && /(^|[#&])(perf|vqa)\b/.test(location.hash);
/** Logs the summary for QA links: totals and per-frame averages of each phase. */
export function perfLog(label: string) {
  cur.wallMs = performance.now() - cur.startedAt;
  if (!qa()) return;
  const f = Math.max(1, cur.frames), r = (x: number) => Math.round(x * 10) / 10;
  const per = Object.fromEntries(Object.entries(cur.ms).map(([k, v]) => [k, { totalS: r(v / 1000), perFrameMs: r(v / f) }]));
  console.log(`[perf] ${label}`, JSON.stringify({ frames: cur.frames, wallS: r((performance.now() - cur.startedAt) / 1000), renderer: cur.renderer, per }));
}
/** The WebGL renderer's name (e.g. "ANGLE (… SwiftShader …)" = software rendering), for the QA summary. */
export function glRenderer(gl: WebGLRenderingContext | WebGL2RenderingContext | null | undefined): string | undefined {
  if (!gl) return undefined;
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  } catch { return undefined; }
}

/** Seconds left, from the frames done so far (null until there is enough to go on). */
export function etaSeconds(done: number, total: number, elapsedMs: number): number | null {
  if (done < 15 || done >= total || elapsedMs <= 0) return null;
  return Math.max(1, Math.round(((total - done) * elapsedMs) / done / 1000));
}
/** "about 3 min left" / "about 40 s left". */
export function etaText(s: number | null): string {
  if (s === null) return '';
  if (s >= 90) return `about ${Math.round(s / 60)} min left`;
  return `about ${Math.max(5, Math.round(s / 5) * 5)} s left`;
}
