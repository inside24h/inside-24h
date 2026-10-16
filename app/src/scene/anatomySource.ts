// Where the anatomy model's bytes come from, for both builds:
// - single-file build (vite.v4.config.ts, everything inlined): the import below is a base64 data: URL inside the
//   bundle and is decoded in memory. No fetch: sandboxed hosts (e.g. claude.ai previews) may block network
//   requests, data: URLs included.
// - hosted build (vite.site.config.ts): it is a hashed .glb file next to the page, fetched (and cached) normally.
// No three.js here, so the main chunk can start the download early (prefetchAnatomy) while three.js still loads.
import anatomyUrl from '../assets/anatomy.meshopt.glb?url';

export const ANATOMY_URL = anatomyUrl;

let bytes: Promise<ArrayBuffer> | null = null;

export function anatomyBytes(): Promise<ArrayBuffer> {
  if (!bytes) {
    bytes = (async () => {
      if (anatomyUrl.startsWith('data:')) {
        const bin = atob(anatomyUrl.slice(anatomyUrl.indexOf(',') + 1));
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out.buffer;
      }
      const r = await fetch(anatomyUrl);
      if (!r.ok) throw new Error(`Could not load the 3D body (${r.status})`);
      return r.arrayBuffer();
    })();
    bytes.catch(() => { bytes = null; }); // a failed download may be retried later
  }
  return bytes;
}

/** Start downloading the model now (hosted build); a no-op cost for the inlined single file. */
export function prefetchAnatomy() {
  if (!anatomyUrl.startsWith('data:')) anatomyBytes().catch(() => { /* Body reports it when it needs the model */ });
}
