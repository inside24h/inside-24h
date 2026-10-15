// Debug: which organ meshes does a camera ray hit when aiming at a target point? (helps fix click picking)
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const buf = fs.readFileSync(new URL('../app/src/assets/anatomy.glb', import.meta.url));
const gltf = await new Promise((res, rej) => new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej));
const scene = gltf.scene;
scene.updateMatrixWorld(true);
const cam = new THREE.Vector3(0.05, 1.22, 2.05);
const targets = { brain: [0, 1.55, 0.0], stomach: [0.07, 1.1, 0.05], heart: [0.02, 1.23, 0.04] };
for (const [name, t] of Object.entries(targets)) {
  const dir = new THREE.Vector3(...t).sub(cam).normalize();
  const rc = new THREE.Raycaster(cam, dir);
  const hits = rc.intersectObject(scene, true).map((h) => `${h.object.name}@${h.distance.toFixed(3)}`);
  console.log(name, '→', hits.slice(0, 8).join('  ') || '(no hits)');
}
scene.traverse((o) => { if (o.isMesh && o.name === 'brain') { o.geometry.computeBoundingBox(); console.log('brain bbox', o.geometry.boundingBox, 'scale', o.scale, 'pos', o.position); } });
