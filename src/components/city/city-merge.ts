/**
 * Gộp các khối TĨNH cùng vật liệu thành một lưới — giảm số lệnh vẽ.
 *
 * Mỗi tòa nhà là hàng chục khối nhỏ (ban công, lan can, cây, ghế...). Để
 * nguyên thì thành phố mẫu tốn ~3.600 lệnh vẽ mỗi khung hình, máy yếu và điện
 * thoại giật. Gộp theo vật liệu thì mỗi tòa còn vài lệnh, cả cảnh vài trăm.
 *
 * Bỏ qua: khối có tên (chóp tháp nhấp nháy, mũi tên chọn — cảnh còn tìm theo
 * tên), khối nhiều vật liệu (mặt tiền 6 mặt), khối trong suốt (gộp làm sai thứ
 * tự vẽ kính).
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function mergeStatic(root: THREE.Object3D): void {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; cast: boolean; receive: boolean }>();
  const merged: THREE.Mesh[] = [];

  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || m.name || Array.isArray(m.material)) return;
    const mat = m.material as THREE.Material;
    if (mat.transparent) return;
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
    }
    if (!g.attributes.uv) return;
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
    const b = buckets.get(mat) ?? { geos: [], cast: false, receive: false };
    b.geos.push(g);
    b.cast ||= m.castShadow;
    b.receive ||= m.receiveShadow;
    buckets.set(mat, b);
    merged.push(m);
  });

  for (const m of merged) {
    m.geometry.dispose();
    m.removeFromParent();
  }
  for (const [mat, b] of buckets) {
    const geo = mergeGeometries(b.geos, false);
    b.geos.forEach((g) => g.dispose());
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    mesh.userData = { ...root.userData };
    root.add(mesh);
  }
  // Nhóm con rỗng sau khi gộp thì bỏ cho nhẹ cây cảnh.
  const empty: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (o !== root && o.type === 'Group' && o.children.length === 0) empty.push(o);
  });
  empty.forEach((o) => o.removeFromParent());
}
