/**
 * Dựng từng loại công trình bằng hình khối three.js — không mô hình tải ngoài.
 *
 * Mọi hàm trả một `Group` đứng trên mặt khu đất (y = 0), tâm ở giữa khu,
 * nằm gọn trong `LOT`. Chi tiết (ban công, mái, bồn nước, chóp tháp) là thứ làm
 * tòa nhà trông "thật"; khối hộp trơn là thứ người dùng đã chê ở bản trước.
 *
 * `lit(mat, base)` đăng ký một vật liệu phát sáng để cảnh chỉnh độ sáng theo
 * giờ (cửa sổ sáng đèn ban đêm, chóp tháp nhấp nháy).
 */
import * as THREE from 'three';

import type { BlueprintId } from '@/services/city/blueprints';
import { LOT } from '@/services/city/layout';
import { glassFacade, grassTexture, pavingTexture, rng, shade, windowFacade } from './city-textures';

export type Lit = (mat: THREE.MeshStandardMaterial, base: number) => void;

const FLOOR = 3.1;

function std(color: string | number, rough = 0.75, metal = 0.02, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Hộp có đáy ở y (không phải tâm). */
function box(w: number, h: number, d: number, mat: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0): THREE.Mesh {
  return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y + h / 2, z);
}

/** Vật liệu mặt tiền cho 6 mặt hộp: 4 mặt đứng có cửa sổ, nóc/đáy trơn. */
function facadeMaterials(front: THREE.MeshStandardMaterial, side: THREE.MeshStandardMaterial, top: THREE.Material): THREE.Material[] {
  // thứ tự mặt BoxGeometry: +x, -x, +y, -y, +z, -z
  return [side, side, top, top, front, front];
}

function facadeMat(
  f: { map: THREE.Texture; emissive: THREE.Texture },
  lit: Lit,
  opts: { rough?: number; metal?: number; physical?: boolean; base?: number } = {},
): THREE.MeshStandardMaterial {
  const params: THREE.MeshPhysicalMaterialParameters = {
    map: f.map,
    emissiveMap: f.emissive,
    emissive: new THREE.Color('#ffffff'),
    emissiveIntensity: 0,
    roughness: opts.rough ?? 0.8,
    metalness: opts.metal ?? 0.02,
  };
  const m = opts.physical
    ? new THREE.MeshPhysicalMaterial({ ...params, clearcoat: 0.6, clearcoatRoughness: 0.15, envMapIntensity: 1.3 })
    : new THREE.MeshStandardMaterial(params);
  lit(m, opts.base ?? 1);
  return m;
}

// ------------------------------------------------------------------ cây, đèn, ghế

export function tree(r: () => number, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const h = (2.2 + r() * 1.4) * scale;
  g.add(mesh(new THREE.CylinderGeometry(0.18 * scale, 0.26 * scale, h, 6), std('#8B5E3C', 0.9), 0, h / 2, 0));
  const greens = ['#4E9F3D', '#5DAA45', '#3F8F3A', '#6BB352', '#7AB648'];
  const col = greens[Math.floor(r() * greens.length)]!;
  const conifer = r() < 0.35;
  if (conifer) {
    for (let i = 0; i < 3; i++) {
      const cr = (1.5 - i * 0.35) * scale;
      g.add(mesh(new THREE.ConeGeometry(cr, 1.9 * scale, 7), std(col, 0.85), 0, h + i * 1.0 * scale, 0));
    }
  } else {
    const cr = (1.3 + r() * 0.5) * scale;
    g.add(mesh(new THREE.IcosahedronGeometry(cr, 1), std(col, 0.85, 0, { flatShading: true }), 0, h + cr * 0.6, 0));
    g.add(mesh(new THREE.IcosahedronGeometry(cr * 0.7, 1), std(shade(col, 0.12), 0.85, 0, { flatShading: true }), cr * 0.5, h + cr * 0.3, cr * 0.2));
  }
  return g;
}

export function lamp(lit: Lit): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.2, 6), std('#374151', 0.5, 0.6), 0, 2.1, 0));
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.12, 0.2), std('#374151', 0.5, 0.6), 0.35, 4.2, 0));
  const headMat = std('#FFF3C4', 0.4, 0, { emissive: new THREE.Color('#FFD37A'), emissiveIntensity: 0 });
  lit(headMat, 2.4);
  const head = mesh(new THREE.SphereGeometry(0.22, 10, 8), headMat, 0.72, 4.05, 0);
  head.castShadow = false;
  g.add(head);
  return g;
}

function bench(): THREE.Group {
  const g = new THREE.Group();
  const wood = std('#A16207', 0.8);
  const iron = std('#334155', 0.5, 0.5);
  g.add(box(1.8, 0.1, 0.5, wood, 0, 0.45, 0));
  g.add(box(1.8, 0.45, 0.08, wood, 0, 0.55, -0.24));
  g.add(box(0.08, 0.45, 0.45, iron, -0.8, 0, 0));
  g.add(box(0.08, 0.45, 0.45, iron, 0.8, 0, 0));
  return g;
}

function flowerBed(r: () => number, w: number, d: number): THREE.Group {
  const g = new THREE.Group();
  g.add(box(w, 0.35, d, std('#6B4F3A', 0.95)));
  const petals = ['#F472B6', '#FACC15', '#F87171', '#A78BFA', '#FB923C', '#FFFFFF'];
  const n = Math.round(w * d * 2.2);
  for (let i = 0; i < n; i++) {
    const c = petals[Math.floor(r() * petals.length)]!;
    const f = mesh(new THREE.SphereGeometry(0.16, 6, 5), std(c, 0.7), (r() - 0.5) * (w - 0.3), 0.45, (r() - 0.5) * (d - 0.3));
    f.castShadow = false;
    g.add(f);
  }
  return g;
}

/** Mặt khu đất: cỏ trong hàng rào vỉa hè. */
function lawn(size: number): THREE.Mesh {
  const tex = grassTexture().clone();
  tex.needsUpdate = true;
  tex.repeat.set(size / 12, size / 12);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), std('#ffffff', 0.95, 0, { map: tex }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  m.receiveShadow = true;
  return m;
}

// ------------------------------------------------------------------ nhà 2 tầng

const HOUSE_WALLS = ['#F5EDE0', '#EBD9C6', '#DCE6EE', '#F3E1D3', '#E6E0F2', '#E3EFDF'];
const HOUSE_ROOFS = ['#B45309', '#7C2D12', '#475569', '#9A3412', '#1E3A5F'];

function house2(r: () => number, lit: Lit): THREE.Group {
  const g = new THREE.Group();
  g.add(lawn(LOT - 1.6));
  const wall = HOUSE_WALLS[Math.floor(r() * HOUSE_WALLS.length)]!;
  const roof = HOUSE_ROOFS[Math.floor(r() * HOUSE_ROOFS.length)]!;
  const w = 8;
  const d = 6.4;
  const h = FLOOR * 2;
  const front = facadeMat(windowFacade({ cols: 3, rows: 2, wall, glass: '#5B7FA6', frame: '#FFFFFF', lit: 0.5 }), lit);
  const side = facadeMat(windowFacade({ cols: 2, rows: 2, wall, glass: '#5B7FA6', frame: '#FFFFFF', lit: 0.4 }), lit);
  const body = box(w, h, d, facadeMaterials(front, side, std(wall)), 0, 0, -0.8);
  g.add(body);
  // gờ trắng giữa hai tầng
  g.add(box(w + 0.3, 0.22, d + 0.3, std('#FFFFFF', 0.6), 0, FLOOR - 0.1, -0.8));
  // mái dốc hai mái
  const shape = new THREE.Shape();
  shape.moveTo(-(w / 2 + 0.6), 0);
  shape.lineTo(w / 2 + 0.6, 0);
  shape.lineTo(0, 2.8);
  shape.lineTo(-(w / 2 + 0.6), 0);
  const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: d + 1, bevelEnabled: false });
  roofGeo.translate(0, 0, -(d + 1) / 2);
  g.add(mesh(roofGeo, std(roof, 0.7), 0, h, -0.8));
  // ống khói
  g.add(box(0.8, 2.2, 0.8, std('#9CA3AF', 0.8), w / 4, h + 0.8, -1.8));
  // cửa chính + bậc thềm
  g.add(box(1.3, 2.3, 0.15, std('#7C4A21', 0.6), 0, 0, d / 2 - 0.8 + 0.05));
  g.add(box(2.2, 0.25, 1.2, std('#D6D3D1', 0.9), 0, 0, d / 2 - 0.2));
  // ban công tầng 2
  g.add(box(3.4, 0.18, 1.1, std('#FFFFFF', 0.6), 0, FLOOR + 0.1, d / 2 - 0.2));
  const rail = std('#334155', 0.5, 0.5);
  g.add(box(3.4, 0.9, 0.06, rail, 0, FLOOR + 0.28, d / 2 + 0.33));
  // lối đi + hàng rào cây + cây ăn quả
  const path = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 4.2), std('#E7E1D6', 0.9, 0, { map: pavingTexture() }));
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.04, 5.2);
  path.receiveShadow = true;
  g.add(path);
  const hedge = std('#3F7F35', 0.9);
  g.add(box(5.6, 0.8, 0.6, hedge, -3.9, 0, 6.8));
  g.add(box(5.6, 0.8, 0.6, hedge, 3.9, 0, 6.8));
  const t1 = tree(r, 0.9);
  t1.position.set(-5.4, 0, 3.6);
  g.add(t1);
  const t2 = tree(r, 0.8);
  t2.position.set(5.6, 0, -5.2);
  g.add(t2);
  const bed = flowerBed(r, 2.4, 0.9);
  bed.position.set(3.4, 0, 4.2);
  g.add(bed);
  return g;
}

// ------------------------------------------------------------------ nhà phố 4 tầng

const TOWN_COLORS = ['#F4A261', '#E9C46A', '#2A9D8F', '#E76F51', '#8AB17D', '#A8DADC', '#F28482', '#84A59D', '#CDB4DB'];

function townhouse(r: () => number, lit: Lit): THREE.Group {
  const g = new THREE.Group();
  g.add(lawn(LOT - 1.6));
  const unitW = 4.4;
  const d = 9;
  const floors = 4;
  for (let i = 0; i < 3; i++) {
    const color = TOWN_COLORS[Math.floor(r() * TOWN_COLORS.length)]!;
    const extra = r() < 0.4 ? 1 : 0;
    const h = (floors + extra) * FLOOR;
    const x = (i - 1) * (unitW + 0.08);
    const front = facadeMat(windowFacade({ cols: 2, rows: floors + extra, wall: color, glass: '#46607D', frame: '#FFFFFF', lit: 0.5, shopFront: true, windowW: 0.62 }), lit);
    const side = std(shade(color, -0.08), 0.85);
    g.add(box(unitW, h, d, facadeMaterials(front, side, std('#D1D5DB')), x, 0, -1.5));
    // mái bằng có tường chắn
    g.add(box(unitW, 0.6, 0.25, std(shade(color, -0.15)), x, h, -1.5 + d / 2 - 0.12));
    // ban công mỗi tầng trên trệt
    for (let f = 1; f < floors + extra; f++) {
      g.add(box(unitW - 0.8, 0.14, 0.8, std('#F8FAFC', 0.6), x, f * FLOOR + 0.05, -1.5 + d / 2 + 0.4));
      g.add(box(unitW - 0.8, 0.7, 0.05, std('#1F2937', 0.4, 0.6), x, f * FLOOR + 0.19, -1.5 + d / 2 + 0.78));
      if (r() < 0.6) {
        const pot = mesh(new THREE.SphereGeometry(0.28, 8, 6), std('#4E9F3D', 0.9), x + unitW / 2 - 0.9, f * FLOOR + 0.45, -1.5 + d / 2 + 0.5);
        g.add(pot);
      }
    }
    // mái hiên cửa hàng tầng trệt
    const awning = std(['#DC2626', '#2563EB', '#16A34A', '#F59E0B'][Math.floor(r() * 4)]!, 0.7);
    const aw = mesh(new THREE.BoxGeometry(unitW - 0.4, 0.12, 1.3), awning, x, FLOOR - 0.35, -1.5 + d / 2 + 0.6);
    aw.rotation.x = 0.28;
    g.add(aw);
    // vườn trên mái
    if (r() < 0.6) {
      const rt = tree(r, 0.55);
      rt.position.set(x, h, -3);
      g.add(rt);
    }
  }
  const pave = new THREE.Mesh(new THREE.PlaneGeometry(LOT - 1.6, 4), std('#ffffff', 0.9, 0, { map: pavingTexture('#E2DCCF') }));
  pave.rotation.x = -Math.PI / 2;
  pave.position.set(0, 0.04, 5.2);
  pave.receiveShadow = true;
  g.add(pave);
  for (const x of [-5.5, 5.5]) {
    const t = tree(r, 0.8);
    t.position.set(x, 0, 6.4);
    g.add(t);
  }
  return g;
}

// ------------------------------------------------------------------ chung cư 12 tầng

const CONCRETE = ['#E7E2DA', '#D9DEE5', '#EDE3D4', '#D6D3E6', '#E4E8DC'];

function highrise(r: () => number, lit: Lit): THREE.Group {
  const g = new THREE.Group();
  const pave = new THREE.Mesh(new THREE.PlaneGeometry(LOT - 1.6, LOT - 1.6), std('#ffffff', 0.9, 0, { map: pavingTexture('#DDD6C9') }));
  pave.rotation.x = -Math.PI / 2;
  pave.position.y = 0.03;
  pave.receiveShadow = true;
  g.add(pave);
  const wall = CONCRETE[Math.floor(r() * CONCRETE.length)]!;
  const floors = 12;
  const w = 11;
  const d = 10;
  const lobby = 4.2;
  const h = floors * FLOOR;
  // sảnh kính tầng trệt, lùi vào
  const lobbyMat = std('#2F4A63', 0.15, 0.6, { emissive: new THREE.Color('#FFE3A8'), emissiveIntensity: 0 });
  lit(lobbyMat, 0.9);
  g.add(box(w - 1.2, lobby, d - 1.2, lobbyMat));
  g.add(box(w + 0.6, 0.5, d + 0.6, std('#F8FAFC', 0.6), 0, lobby, 0));
  const front = facadeMat(windowFacade({ cols: 6, rows: floors - 1, wall, glass: '#4D6E8E', frame: '#F8FAFC', lit: 0.45, windowW: 0.7 }), lit);
  const side = facadeMat(windowFacade({ cols: 5, rows: floors - 1, wall, glass: '#4D6E8E', frame: '#F8FAFC', lit: 0.4, windowW: 0.7 }), lit);
  const bodyH = h - lobby;
  g.add(box(w, bodyH, d, facadeMaterials(front, side, std('#CBD5E1')), 0, lobby + 0.5));
  // ban công dài mặt trước + mặt sau mỗi tầng
  const slab = std('#FFFFFF', 0.6);
  const glassRail = new THREE.MeshPhysicalMaterial({ color: '#BFDBFE', transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.1 });
  for (let f = 1; f < floors; f++) {
    const y = lobby + 0.5 + (f - 1) * FLOOR + FLOOR - 0.35;
    for (const s of [1, -1]) {
      g.add(box(w - 0.6, 0.16, 1, slab, 0, y, s * (d / 2 + 0.5)));
      const railM = box(w - 0.6, 0.8, 0.05, glassRail, 0, y + 0.16, s * (d / 2 + 0.98));
      railM.castShadow = false;
      g.add(railM);
    }
  }
  const top = lobby + 0.5 + bodyH;
  g.add(box(w + 0.3, 0.8, d + 0.3, std(shade(wall, -0.1)), 0, top));
  // bồn nước + máy lạnh + lồng thang máy
  g.add(mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.2, 14), std('#94A3B8', 0.4, 0.6), -2.6, top + 1.9, -1.8));
  g.add(box(2.6, 2.2, 2.2, std('#CBD5E1', 0.7), 2.2, top + 0.8, 1.6));
  for (let i = 0; i < 3; i++) g.add(box(0.9, 0.7, 0.9, std('#E2E8F0', 0.6, 0.3), -3 + i * 1.3, top + 0.8, 2.8));
  for (const [x, z] of [[-6.4, 6.4], [6.4, 6.4], [-6.4, -6.4]] as const) {
    const t = tree(r, 0.85);
    t.position.set(x, 0, z);
    g.add(t);
  }
  return g;
}

// ------------------------------------------------------------------ tòa chọc trời

const GLASS_TINTS = ['#5E91BE', '#4F8FA8', '#6B98C9', '#5A9A8C', '#8C7A64', '#6A7FB5'];

function skyscraper(r: () => number, lit: Lit): THREE.Group {
  const g = new THREE.Group();
  const pave = new THREE.Mesh(new THREE.PlaneGeometry(LOT - 1.6, LOT - 1.6), std('#ffffff', 0.9, 0, { map: pavingTexture('#D4D0C8') }));
  pave.rotation.x = -Math.PI / 2;
  pave.position.y = 0.03;
  pave.receiveShadow = true;
  g.add(pave);
  const tint = GLASS_TINTS[Math.floor(r() * GLASS_TINTS.length)]!;
  const tiers = [
    { s: 12.6, floors: 11 },
    { s: 10.6, floors: 10 },
    { s: 8.4, floors: 7 },
  ];
  // bệ đá + sảnh
  g.add(box(13.6, 1.2, 13.6, std('#9CA3AF', 0.6, 0.1)));
  let y = 1.2;
  for (const t of tiers) {
    const h = t.floors * FLOOR;
    const f = glassFacade({ cols: Math.round(t.s * 1.2), rows: t.floors, tint, mullion: '#D8DEE6', lit: 0.35 });
    const glass = facadeMat(f, lit, { rough: 0.08, metal: 0.55, physical: true });
    g.add(box(t.s, h, t.s, facadeMaterials(glass, glass, std('#94A3B8', 0.5, 0.4)), 0, y));
    // gờ thép giữa các bậc lùi
    g.add(box(t.s + 0.5, 0.5, t.s + 0.5, std('#CBD5E1', 0.35, 0.7), 0, y + h));
    // cột góc
    const fin = std('#E2E8F0', 0.35, 0.6);
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
      g.add(box(0.35, h, 0.35, fin, (sx * t.s) / 2, y, (sz * t.s) / 2));
    }
    y += h + 0.5;
  }
  // vương miện: sân đỗ trực thăng hoặc cột ăng-ten
  if (r() < 0.5) {
    g.add(mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.4, 28), std('#475569', 0.6, 0.3), 0, y + 0.2, 0));
    const hMat = std('#FDE68A', 0.5, 0, { emissive: new THREE.Color('#FACC15'), emissiveIntensity: 0 });
    lit(hMat, 1.2);
    g.add(box(0.5, 0.05, 2.4, hMat, -0.8, y + 0.4, 0));
    g.add(box(0.5, 0.05, 2.4, hMat, 0.8, y + 0.4, 0));
    g.add(box(1.6, 0.05, 0.5, hMat, 0, y + 0.4, 0));
  } else {
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.5, 14, 8), std('#CBD5E1', 0.3, 0.8), 0, y + 7, 0));
    const tipMat = std('#FCA5A5', 0.4, 0, { emissive: new THREE.Color('#EF4444'), emissiveIntensity: 0 });
    lit(tipMat, 3);
    g.add(mesh(new THREE.SphereGeometry(0.4, 10, 8), tipMat, 0, y + 14.2, 0));
  }
  return g;
}

// ------------------------------------------------------------------ Tháp Tri thức

function landmark(_r: () => number, lit: Lit): THREE.Group {
  const g = new THREE.Group();
  const pave = new THREE.Mesh(new THREE.PlaneGeometry(LOT - 1.6, LOT - 1.6), std('#ffffff', 0.9, 0, { map: pavingTexture('#E5DECF') }));
  pave.rotation.x = -Math.PI / 2;
  pave.position.y = 0.03;
  pave.receiveShadow = true;
  g.add(pave);
  // bệ bậc thang
  g.add(box(14.6, 0.8, 14.6, std('#D6D3D1', 0.7)));
  g.add(box(13.4, 0.8, 13.4, std('#E7E5E4', 0.7), 0, 0.8));
  const segs = 30;
  const segH = 4.6;
  const f = glassFacade({ cols: 12, rows: 2, tint: '#4B7FB8', mullion: '#E6EEF8', lit: 0.4, seed: 42 });
  const glass = facadeMat(f, lit, { rough: 0.06, metal: 0.6, physical: true });
  const ledMat = std('#E0F2FE', 0.3, 0.2, { emissive: new THREE.Color('#7DD3FC'), emissiveIntensity: 0 });
  lit(ledMat, 2.2);
  const ledge = std('#F1F5F9', 0.3, 0.6);
  let y = 1.6;
  for (let i = 0; i < segs; i++) {
    const t = i / (segs - 1);
    const s = 11.8 - t * 5.2;
    const seg = new THREE.Group();
    seg.position.y = y;
    seg.rotation.y = i * (Math.PI / 90) * 1.6;
    seg.add(box(s, segH - 0.25, s, facadeMaterials(glass, glass, ledge)));
    seg.add(box(s + 0.35, 0.25, s + 0.35, ledge, 0, segH - 0.25));
    // dải đèn LED ở bốn góc — ban đêm thành đường xoắn sáng
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
      const led = box(0.22, segH - 0.25, 0.22, ledMat, (sx * s) / 2, 0, (sz * s) / 2);
      led.castShadow = false;
      seg.add(led);
    }
    g.add(seg);
    y += segH;
  }
  // vương miện kính + chóp
  const crown = new THREE.MeshPhysicalMaterial({ color: '#BFDBFE', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.7, emissive: new THREE.Color('#93C5FD'), emissiveIntensity: 0 });
  lit(crown, 1.4);
  g.add(mesh(new THREE.CylinderGeometry(2.4, 3.6, 7, 12, 1, true), crown, 0, y + 3.5, 0));
  g.add(mesh(new THREE.ConeGeometry(1.2, 26, 12), std('#E2E8F0', 0.25, 0.85), 0, y + 7 + 13, 0));
  const tipMat = std('#FFFFFF', 0.2, 0, { emissive: new THREE.Color('#FDE68A'), emissiveIntensity: 0 });
  lit(tipMat, 4);
  const tip = mesh(new THREE.SphereGeometry(0.7, 14, 10), tipMat, 0, y + 7 + 26.4, 0);
  tip.name = 'beacon';
  g.add(tip);
  return g;
}

// ------------------------------------------------------------------ công viên

function park(r: () => number, lit: Lit): THREE.Group {
  const g = new THREE.Group();
  g.add(lawn(LOT - 1.6));
  // lối đi chữ thập
  const pave = std('#ffffff', 0.9, 0, { map: pavingTexture('#E8DFC9') });
  for (const rot of [0, Math.PI / 2]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.8, LOT - 1.6), pave);
    p.rotation.set(-Math.PI / 2, 0, rot);
    p.position.y = 0.04;
    p.receiveShadow = true;
    g.add(p);
  }
  // hồ nước tròn giữa
  g.add(mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.5, 32), std('#D6D3D1', 0.8), 0, 0.25, 0));
  const water = new THREE.MeshPhysicalMaterial({ color: '#4FA3D9', roughness: 0.05, metalness: 0.2, clearcoat: 1, envMapIntensity: 1.2 });
  g.add(mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.1, 32), water, 0, 0.52, 0));
  const lily = std('#65A30D', 0.8);
  for (let i = 0; i < 5; i++) {
    const a = r() * Math.PI * 2;
    const rr = 0.6 + r() * 1.6;
    const l = mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 10), lily, Math.cos(a) * rr, 0.6, Math.sin(a) * rr);
    l.castShadow = false;
    g.add(l);
  }
  for (const [x, z] of [[-4.6, -4.6], [4.6, -4.6], [-4.6, 4.6], [4.6, 4.6], [-6.3, 0.2], [6.3, -0.4], [0.3, -6.4]] as const) {
    const t = tree(r, 0.9 + r() * 0.3);
    t.position.set(x + (r() - 0.5), 0, z + (r() - 0.5));
    g.add(t);
  }
  for (const [x, z, ry] of [[-2.2, 4.4, 0], [2.4, -4.4, Math.PI]] as const) {
    const b = bench();
    b.position.set(x, 0, z);
    b.rotation.y = ry;
    g.add(b);
  }
  const bed = flowerBed(r, 3, 1);
  bed.position.set(4.3, 0, 1.8);
  g.add(bed);
  const l1 = lamp(lit);
  l1.position.set(1.4, 0, 5.8);
  g.add(l1);
  return g;
}

const BUILDERS: Record<BlueprintId, (r: () => number, lit: Lit) => THREE.Group> = {
  park,
  house2,
  townhouse,
  highrise,
  skyscraper,
  landmark,
};

export function buildBlueprint(type: BlueprintId, seed: number, lit: Lit): THREE.Group {
  const g = BUILDERS[type](rng(seed), lit);
  g.userData.type = type;
  return g;
}

// ------------------------------------------------------------------ quảng trường trung tâm

export function plaza(lit: Lit): { group: THREE.Group; jets: THREE.Mesh[] } {
  const g = new THREE.Group();
  const r = rng(99);
  const pave = new THREE.Mesh(new THREE.CircleGeometry(LOT / 2 - 0.4, 48), std('#ffffff', 0.85, 0, { map: pavingTexture('#EDE6D6') }));
  pave.rotation.x = -Math.PI / 2;
  pave.position.y = 0.04;
  pave.receiveShadow = true;
  g.add(pave);
  // vòng cỏ + hoa quanh quảng trường
  const ring = new THREE.Mesh(new THREE.RingGeometry(LOT / 2 - 2.6, LOT / 2 - 1.2, 48), std('#7FBF5A', 0.9));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  ring.receiveShadow = true;
  g.add(ring);
  // đài phun nước ba tầng
  const stone = std('#E7E5E4', 0.55);
  g.add(mesh(new THREE.CylinderGeometry(4, 4.2, 0.8, 40), stone, 0, 0.4, 0));
  const water = new THREE.MeshPhysicalMaterial({ color: '#5DB6E8', roughness: 0.04, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.9 });
  g.add(mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.12, 40), water, 0, 0.78, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.5, 0.7, 2.6, 16), stone, 0, 1.3, 0));
  g.add(mesh(new THREE.CylinderGeometry(2, 1.4, 0.4, 32), stone, 0, 2.7, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.08, 32), water, 0, 2.92, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.6, 12), stone, 0, 3.6, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.9, 0.6, 0.3, 24), stone, 0, 4.4, 0));
  // tia nước (co giãn theo thời gian ở vòng vẽ)
  const jetMat = new THREE.MeshPhysicalMaterial({ color: '#E0F2FE', transparent: true, opacity: 0.75, roughness: 0.02, emissive: new THREE.Color('#7DD3FC'), emissiveIntensity: 0 });
  lit(jetMat, 0.8);
  const jets: THREE.Mesh[] = [];
  const top = mesh(new THREE.CylinderGeometry(0.06, 0.18, 2.4, 8), jetMat, 0, 5.8, 0);
  top.castShadow = false;
  jets.push(top);
  g.add(top);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const j = mesh(new THREE.CylinderGeometry(0.04, 0.1, 1.6, 6), jetMat, Math.cos(a) * 2.6, 1.6, Math.sin(a) * 2.6);
    j.rotation.z = Math.cos(a) * 0.5;
    j.rotation.x = -Math.sin(a) * 0.5;
    j.castShadow = false;
    jets.push(j);
    g.add(j);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const t = tree(r, 0.8);
    t.position.set(Math.cos(a) * (LOT / 2 - 1.9), 0, Math.sin(a) * (LOT / 2 - 1.9));
    g.add(t);
    const b = bench();
    b.position.set(Math.cos(a + 0.4) * 5.6, 0, Math.sin(a + 0.4) * 5.6);
    b.rotation.y = -a - 0.4 - Math.PI / 2;
    g.add(b);
  }
  for (const a of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
    const l = lamp(lit);
    l.position.set(Math.cos(a) * 6.2, 0, Math.sin(a) * 6.2);
    l.rotation.y = -a;
    g.add(l);
  }
  return { group: g, jets };
}
