/**
 * Nạp model trang trí đã chuẩn hoá (public/city/models/<id>.glb — màu đỉnh,
 * nén meshopt) và tính vị trí đặt theo `data/city/decor-map.ts`.
 *
 * Chỉ nạp model mà thành phố đang CẦN (có công trình dùng tới, kỷ đã mở); mỗi
 * model tải một lần, vẽ bằng một InstancedMesh.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

import { catalogItem } from '@/data/city/catalog';
import { DECOR, MODEL_ERA, SITE_TOOLS, type DecorModel, type DecorPlacement } from '@/data/city/decor-map';
import { generateBuilding } from '@/services/city/procgen/buildings';
import type { ProcBuilding } from '@/services/city/procgen/parts';
import type { Site } from '@/services/city/construction';
import { toVisual } from './visual';

const cache = new Map<DecorModel, Promise<THREE.BufferGeometry>>();
let loader: GLTFLoader | null = null;

/** Gộp mọi lưới của một GLB thành MỘT BufferGeometry (vị trí + màu, mặt phẳng). */
export function loadDecor(id: DecorModel): Promise<THREE.BufferGeometry> {
  let p = cache.get(id);
  if (p) return p;
  loader ??= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  p = loader.loadAsync(`/city/models/${id}.glb`).then((gltf) => {
    gltf.scene.updateMatrixWorld(true);
    const pos: number[] = [];
    const col: number[] = [];
    const v = new THREE.Vector3();
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const g = mesh.geometry;
      const P = g.getAttribute('position');
      const Cc = g.getAttribute('color');
      const idx = g.getIndex();
      const n = idx ? idx.count : P.count;
      for (let k = 0; k < n; k++) {
        const i = idx ? idx.getX(k) : k;
        v.fromBufferAttribute(P as THREE.BufferAttribute, i).applyMatrix4(mesh.matrixWorld);
        pos.push(v.x, v.y, v.z);
        if (Cc) col.push(Cc.getX(i), Cc.getY(i), Cc.getZ(i));
        else col.push(0.8, 0.8, 0.8);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals(); // không chỉ số → pháp tuyến theo mặt (đổ bóng phẳng)
    geo.computeBoundingSphere();
    return geo;
  });
  cache.set(id, p);
  return p;
}

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const Y = new THREE.Vector3(0, 1, 0);

function place(base: THREE.Matrix4, pb: ProcBuilding, d: DecorPlacement): THREE.Matrix4 | null {
  const anchors = pb.anchors;
  let x = 0;
  let y = 0;
  let z = 0;
  let ry = d.ry ?? 0;
  if (d.anchor) {
    const a = anchors.find((q) => q.tag === d.anchor);
    if (!a) return null;
    [x, y, z] = a.p;
    ry += a.ry;
  } else if (d.rel) {
    x = (d.rel[0] * pb.size[0]) / 2;
    z = (d.rel[1] * pb.size[1]) / 2;
  }
  if (d.offset) {
    x += d.offset[0];
    y += d.offset[1];
    z += d.offset[2];
  }
  const s = d.scale ?? 1;
  M.compose(new THREE.Vector3(x, Math.max(0, y), z), Q.setFromAxisAngle(Y, ry), new THREE.Vector3(s, s, s));
  return base.clone().multiply(M);
}

/** Ma trận đặt từng model trang trí cho cả thành phố. */
export function decorInstances(
  sites: readonly Site[],
  era: number,
  siteMatrix: (s: Site) => THREE.Matrix4,
): Partial<Record<DecorModel, THREE.Matrix4[]>> {
  const out: Partial<Record<DecorModel, THREE.Matrix4[]>> = {};
  for (const site of sites) {
    const item = catalogItem(site.type);
    if (!item) continue;
    const v = toVisual(site);
    const pb = generateBuilding(site.type, site.seed, item.era);
    const base = siteMatrix(site);
    const list: DecorPlacement[] = [];
    for (const d of DECOR[item.decor ?? item.id] ?? DECOR[item.id] ?? []) if (v.stage >= (d.from ?? 8)) list.push(d);
    if (site.crew && v.stage >= 1 && v.stage <= 7) list.push(...SITE_TOOLS);
    for (const d of list) {
      if (MODEL_ERA[d.model] > Math.max(era, item.era)) continue;
      const m = place(base, pb, d);
      if (m) (out[d.model] ??= []).push(m);
    }
  }
  return out;
}
