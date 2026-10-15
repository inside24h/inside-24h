// Builds app/public/anatomy.glb from BodyParts3D OBJ files.
// BodyParts3D, Â© The Database Center for Life Science, licensed under CC Attribution 4.0 International.
//
// Coordinates: BodyParts3D is in millimetres, Z up, anterior = -Y.
// Output is in metres, Y up, anterior = +Z (three.js convention).
import fs from 'node:fs';
import path from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { weld, simplify, dedup, prune, quantize } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import { KHRMeshQuantization } from '@gltf-transform/extensions';
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW = path.join(ROOT, 'data/raw/bodyparts3d');
const OBJ_DIR = path.join(RAW, 'obj/partof_BP3D_4.0_obj_99');
const OUT = path.join(ROOT, 'app/src/assets/anatomy.glb');

const config = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'organs.json'), 'utf8').replace(/^﻿/, ''));
const elements = new Map(); // FMA concept id -> [{file, name}]
for (const line of fs.readFileSync(path.join(RAW, 'partof_element_parts.txt'), 'utf8').split(/\r?\n/).slice(1)) {
  const [fma, name, file] = line.split('\t');
  if (!file) continue;
  if (!elements.has(fma)) elements.set(fma, []);
  elements.get(fma).push({ file, name });
}

function readObj(file, positions, indices) {
  const base = positions.length / 3;
  for (const line of fs.readFileSync(path.join(OBJ_DIR, `${file}.obj`), 'utf8').split(/\r?\n/)) {
    if (line.startsWith('v ')) {
      const [, x, y, z] = line.trim().split(/\s+/).map(Number);
      positions.push(x / 1000, z / 1000, -y / 1000);
    } else if (line.startsWith('f ')) {
      const v = line.trim().split(/\s+/).slice(1).map((t) => parseInt(t, 10) - 1 + base);
      for (let i = 1; i + 1 < v.length; i++) indices.push(v[0], v[i], v[i + 1]);
    }
  }
}

await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;

// Random points strictly inside an organ's surface, used by the app to place particles where the
// substance really is. A point counts as inside when rays along x, y and z mostly cross the surface
// an odd number of times (majority vote tolerates small holes in the mesh).
const points = {};
const volumes = {};
// Enclosed volume in litres: sum of signed tetrahedra (origin, triangle). Parts are closed shells, so
// the absolute value of each part's sum is used via the total (all shells share an orientation).
function meshVolumeL(pos, idx) {
  let v = 0;
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    v += (pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1])
      - pos[a + 1] * (pos[b] * pos[c + 2] - pos[b + 2] * pos[c])
      + pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c])) / 6;
  }
  return +(Math.abs(v) * 1000).toFixed(4); // m³ → L
}
function sampleInterior(pos, idx, n, key) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeBoundingBox();
  const bvh = new MeshBVH(geo);
  const { min, max } = geo.boundingBox;
  const dirs = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
  const ray = new THREE.Ray(), p = new THREE.Vector3(), out = [];
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let tries = 0; out.length < n * 3 && tries < n * 400; tries++) {
    p.set(min.x + rnd() * (max.x - min.x), min.y + rnd() * (max.y - min.y), min.z + rnd() * (max.z - min.z));
    let votes = 0;
    for (const d of dirs) { ray.set(p, d); if (bvh.raycast(ray, THREE.DoubleSide).length % 2 === 1) votes++; }
    if (votes >= 2) out.push(+p.x.toFixed(4), +p.y.toFixed(4), +p.z.toFixed(4));
  }
  if (out.length < n * 3) console.warn(`  ${key}: only ${out.length / 3}/${n} interior points`);
  return out;
}

const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene('body');
const report = [];

for (const organ of config.organs) {
  const positions = [], names = new Set();
  let indices = [];
  for (const fma of organ.fma) {
    const parts = elements.get(fma);
    if (!parts) throw new Error(`No element files for ${fma} (${organ.key})`);
    for (const p of parts) { readObj(p.file, positions, indices); names.add(p.name); }
  }
  // Weld vertices that share a position (to 0.01 mm) so the simplifier can collapse edges.
  const remap = new Map(), welded = [], idx = new Uint32Array(indices.length);
  const vid = new Uint32Array(positions.length / 3);
  for (let i = 0; i < vid.length; i++) {
    const k = `${Math.round(positions[i * 3] * 1e5)},${Math.round(positions[i * 3 + 1] * 1e5)},${Math.round(positions[i * 3 + 2] * 1e5)}`;
    let v = remap.get(k);
    if (v === undefined) { v = welded.length / 3; remap.set(k, v); welded.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]); }
    vid[i] = v;
  }
  for (let i = 0; i < indices.length; i++) idx[i] = vid[indices[i]];
  indices = idx;
  const pos = new Float32Array(welded);
  if (organ.points) points[organ.key] = sampleInterior(pos, indices, organ.points, organ.key);
  volumes[organ.key] = meshVolumeL(pos, indices);
  // Each organ keeps its own detail budget: ratio of triangles, capped by a relative geometric error (fraction of the organ's size).
  const target = Math.max(300, Math.floor((indices.length * organ.ratio) / 3) * 3);
  const [simplified] = MeshoptSimplifier.simplify(indices, pos, 3, target, organ.error ?? 0.01);
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(pos).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(simplified).setBuffer(buffer));
  const mesh = doc.createMesh(organ.key).addPrimitive(prim);
  const node = doc.createNode(organ.key).setMesh(mesh).setExtras({ fma: organ.fma, parts: [...names] });
  scene.addChild(node);
  report.push({ key: organ.key, trianglesIn: indices.length / 3, trianglesOut: simplified.length / 3 });
}

// drop vertices no longer referenced after simplification, then merge duplicates
await doc.transform(weld(), dedup(), prune());

// Bounds + triangle counts per organ for the report and the app
const bounds = {};
for (const node of scene.listChildren()) {
  const arr = node.getMesh().listPrimitives()[0].getAttribute('POSITION').getArray();
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < arr.length; i += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], arr[i + k]); max[k] = Math.max(max[k], arr[i + k]); }
  const tris = node.getMesh().listPrimitives()[0].getIndices().getCount() / 3;
  bounds[node.getName()] = { min: min.map((v) => +v.toFixed(4)), max: max.map((v) => +v.toFixed(4)), tris };
}

// Quantization only (natively supported by three's GLTFLoader). No meshopt compression: it needs a WASM
// decoder, which sandboxed previews may block. Size cost is small because the page is gzipped anyway.
doc.createExtension(KHRMeshQuantization).setRequired(true);
await doc.transform(quantize());
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const io = new NodeIO().registerExtensions([KHRMeshQuantization]);
fs.writeFileSync(path.join(path.dirname(OUT), 'organ-points.json'), JSON.stringify(points));
fs.writeFileSync(path.join(path.dirname(OUT), 'organ-volumes.json'), JSON.stringify(volumes, null, 1));
console.log('volumes (L):', Object.entries(volumes).map(([k, v]) => `${k} ${v}`).join(', '));
await io.write(OUT, doc);
fs.writeFileSync(path.join(import.meta.dirname, 'anatomy-report.json'), JSON.stringify({ report, bounds }, null, 2));
console.log('wrote', OUT, (fs.statSync(OUT).size / 1e6).toFixed(2), 'MB');
for (const [k, b] of Object.entries(bounds)) console.log(k.padEnd(12), String(b.tris).padStart(7), 'tris  y', b.min[1], 'â†’', b.max[1]);

