// Compresses app/src/assets/anatomy.glb (output of build-anatomy.mjs) with EXT_meshopt_compression into
// app/src/assets/anatomy.meshopt.glb, which the app ships. The source GLB is left untouched.
// 'medium' level = quantization + meshopt codec, NO filters, so the pure-JS reference decoder in
// app/src/scene/meshoptDecoderReference.js can decode it when WebAssembly is blocked (sandboxed previews).
// Run: node compress-anatomy.mjs
import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'app/src/assets/anatomy.glb');
const OUT = path.join(ROOT, 'app/src/assets/anatomy.meshopt.glb');

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder,
});

const doc = await io.read(SRC);
await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(OUT, doc);

// Check: every organ keeps the same triangle count and bounding box after a decode round trip.
const summary = async (d) => {
  const out = {};
  for (const node of d.getRoot().listNodes()) {
    const prim = node.getMesh()?.listPrimitives()[0];
    if (!prim) continue;
    const pos = prim.getAttribute('POSITION');
    const n = pos.getNormalized() ? 1 : 1;
    out[node.getName()] = { tris: prim.getIndices().getCount() / 3, attrs: prim.listSemantics().join(','), min: pos.getMinNormalized([]).map((v) => +v.toFixed(5)), max: pos.getMaxNormalized([]).map((v) => +v.toFixed(5)), n };
  }
  return out;
};
const a = await summary(await io.read(SRC));
const b = await summary(await io.read(OUT));
let bad = 0;
for (const k of Object.keys(a)) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) { bad++; console.log('DIFF', k, a[k], b[k]); }
console.log(Object.keys(a).length, 'meshes,', bad, 'differ');
console.log('before', fs.statSync(SRC).size, 'bytes; after', fs.statSync(OUT).size, 'bytes');
