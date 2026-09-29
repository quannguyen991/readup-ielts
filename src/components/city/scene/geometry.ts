/**
 * Biến cây bộ phận (`services/city/procgen`) thành MỘT BufferGeometry có màu
 * đỉnh — mỗi công trình = một lệnh vẽ với vật liệu toon dùng chung. Tự ghi đỉnh
 * vào mảng số (không tạo hàng nghìn Geometry của three rồi gộp), nên dựng lại
 * một cao ốc 2.000 bộ phận vẫn nhanh.
 */
import * as THREE from 'three';

import { colorOf, type Part, type Visual } from '@/services/city/procgen/parts';

const tmpColor = new THREE.Color();
const colorCache = new Map<string, [number, number, number]>();
export function rgb(hex: string): [number, number, number] {
  let c = colorCache.get(hex);
  if (!c) {
    tmpColor.set(hex);
    c = [tmpColor.r, tmpColor.g, tmpColor.b];
    colorCache.set(hex, c);
  }
  return c;
}

export class Writer {
  pos: number[] = [];
  nor: number[] = [];
  col: number[] = [];
  // Phép biến đổi hiện hành (ma trận 3x3 quay + dịch).
  private m = new THREE.Matrix4();
  private nm = new THREE.Matrix3();
  private v = new THREE.Vector3();
  private n = new THREE.Vector3();
  private c: [number, number, number] = [1, 1, 1];

  setTransform(m: THREE.Matrix4): void {
    this.m.copy(m);
    this.nm.getNormalMatrix(m);
  }

  setColor(hex: string, shade = 1): void {
    const [r, g, b] = rgb(hex);
    this.c = [r * shade, g * shade, b * shade];
  }

  /** Màu trực tiếp (0..1) — cho màu pha trộn liên tục của mặt đất. */
  setRGB(r: number, g: number, b: number): void {
    this.c = [r, g, b];
  }

  /** Tam giác phẳng (pháp tuyến tính từ ba đỉnh, sau biến đổi). */
  tri(a: [number, number, number], b: [number, number, number], c: [number, number, number]): void {
    const pa = this.v.set(...a).applyMatrix4(this.m).toArray();
    const pb = this.v.set(...b).applyMatrix4(this.m).toArray();
    const pc = this.v.set(...c).applyMatrix4(this.m).toArray();
    const ux = pb[0] - pa[0];
    const uy = pb[1] - pa[1];
    const uz = pb[2] - pa[2];
    const vx = pc[0] - pa[0];
    const vy = pc[1] - pa[1];
    const vz = pc[2] - pa[2];
    this.n.set(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx).normalize();
    for (const p of [pa, pb, pc]) {
      this.pos.push(p[0], p[1], p[2]);
      this.nor.push(this.n.x, this.n.y, this.n.z);
      this.col.push(this.c[0], this.c[1], this.c[2]);
    }
  }

  quad(a: [number, number, number], b: [number, number, number], c: [number, number, number], d: [number, number, number]): void {
    this.tri(a, b, c);
    this.tri(a, c, d);
  }

  toGeometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  }

  get empty(): boolean {
    return this.pos.length === 0;
  }
}

// ------------------------------------------------------------------ hình cơ bản (toạ độ cục bộ: đáy ở y=0)

function box(w: Writer, sx: number, sy: number, sz: number, bottom = false) {
  const x = sx / 2;
  const z = sz / 2;
  const y0 = 0;
  const y1 = sy;
  // +y. Mặt đáy (−y) bỏ với khối đứng thẳng: camera luôn nhìn từ trên xuống nên
  // không bao giờ thấy — tiết kiệm 1/6 tam giác của mọi khối hộp (và của bóng đổ).
  // Khối nghiêng (thanh giằng, dốc mái) thì giữ vì đáy có thể lộ ra bên hông.
  w.quad([-x, y1, z], [x, y1, z], [x, y1, -z], [-x, y1, -z]);
  if (bottom) w.quad([-x, y0, -z], [x, y0, -z], [x, y0, z], [-x, y0, z]);
  w.quad([-x, y0, z], [x, y0, z], [x, y1, z], [-x, y1, z]);
  w.quad([x, y0, -z], [-x, y0, -z], [-x, y1, -z], [x, y1, -z]);
  w.quad([x, y0, z], [x, y0, -z], [x, y1, -z], [x, y1, z]);
  w.quad([-x, y0, -z], [-x, y0, z], [-x, y1, z], [-x, y1, -z]);
}

function gable(w: Writer, sx: number, sy: number, sz: number) {
  const x = sx / 2;
  const z = sz / 2;
  const h = sy;
  w.tri([-x, 0, z], [x, 0, z], [0, h, z]);
  w.tri([x, 0, -z], [-x, 0, -z], [0, h, -z]);
  w.quad([x, 0, z], [x, 0, -z], [0, h, -z], [0, h, z]);
  w.quad([-x, 0, -z], [-x, 0, z], [0, h, z], [0, h, -z]);
  w.quad([-x, 0, -z], [x, 0, -z], [x, 0, z], [-x, 0, z]);
}

function hip(w: Writer, sx: number, sy: number, sz: number) {
  const x = sx / 2;
  const z = sz / 2;
  const h = sy;
  if (sx >= sz) {
    const r = Math.max(0, x - z);
    w.quad([-x, 0, z], [x, 0, z], [r, h, 0], [-r, h, 0]);
    w.quad([x, 0, -z], [-x, 0, -z], [-r, h, 0], [r, h, 0]);
    w.tri([x, 0, z], [x, 0, -z], [r, h, 0]);
    w.tri([-x, 0, -z], [-x, 0, z], [-r, h, 0]);
  } else {
    const r = Math.max(0, z - x);
    w.quad([x, 0, z], [x, 0, -z], [0, h, -r], [0, h, r]);
    w.quad([-x, 0, -z], [-x, 0, z], [0, h, r], [0, h, -r]);
    w.tri([-x, 0, z], [x, 0, z], [0, h, r]);
    w.tri([x, 0, -z], [-x, 0, -z], [0, h, -r]);
  }
  w.quad([-x, 0, -z], [x, 0, -z], [x, 0, z], [-x, 0, z]);
}

function pyr(w: Writer, sx: number, sy: number, sz: number) {
  const x = sx / 2;
  const z = sz / 2;
  const a: [number, number, number] = [0, sy, 0];
  w.tri([-x, 0, z], [x, 0, z], a);
  w.tri([x, 0, z], [x, 0, -z], a);
  w.tri([x, 0, -z], [-x, 0, -z], a);
  w.tri([-x, 0, -z], [-x, 0, z], a);
  w.quad([-x, 0, -z], [x, 0, -z], [x, 0, z], [-x, 0, z]);
}

function cyl(w: Writer, sx: number, sy: number, sz: number, taper: number, seg: number) {
  const rx = sx / 2;
  const rz = sz / 2;
  const n = Math.max(3, seg);
  const ring = (i: number, t: number, y: number): [number, number, number] => {
    const a = (i / n) * Math.PI * 2;
    return [Math.cos(a) * rx * t, y, Math.sin(a) * rz * t];
  };
  for (let i = 0; i < n; i++) {
    const b0 = ring(i, 1, 0);
    const b1 = ring(i + 1, 1, 0);
    if (taper <= 0.001) {
      w.tri(b1, b0, [0, sy, 0]);
    } else {
      const t0 = ring(i, taper, sy);
      const t1 = ring(i + 1, taper, sy);
      w.quad(b1, b0, t0, t1);
      w.tri([0, sy, 0], t1, t0);
    }
    w.tri([0, 0, 0], b0, b1);
  }
}

// Khối cầu nhiều mặt (icosahedron) — phẳng mặt, hợp phong cách cartoon.
const ICO = (() => {
  const g = new THREE.IcosahedronGeometry(1, 0);
  const g1 = new THREE.IcosahedronGeometry(1, 1);
  const read = (geo: THREE.BufferGeometry) => {
    const p = geo.getAttribute('position');
    const out: [number, number, number][] = [];
    for (let i = 0; i < p.count; i++) out.push([p.getX(i), p.getY(i), p.getZ(i)]);
    return out;
  };
  return { low: read(g), high: read(g1) };
})();

function sphere(w: Writer, sx: number, sy: number, sz: number, lowPoly = false) {
  const verts = lowPoly || Math.max(sx, sz) < 0.14 ? ICO.low : ICO.high;
  const rx = sx / 2;
  const ry = sy / 2;
  const rz = sz / 2;
  for (let i = 0; i < verts.length; i += 3) {
    const t = (v: [number, number, number]): [number, number, number] => [v[0] * rx, v[1] * ry + ry, v[2] * rz];
    w.tri(t(verts[i]!), t(verts[i + 1]!), t(verts[i + 2]!));
  }
}

const M = new THREE.Matrix4();
const R = new THREE.Matrix4();
const E = new THREE.Euler();

/** Ghi một bộ phận vào `w` với phép đặt `base` (vị trí + hướng công trình). */
export function writePart(w: Writer, part: Part, base: THREE.Matrix4, color: string, shade = 1, lowPoly = false): void {
  E.set(part.rx ?? 0, part.ry ?? 0, part.rz ?? 0, 'YXZ');
  R.makeRotationFromEuler(E);
  M.makeTranslation(part.p[0], part.p[1], part.p[2]).multiply(R);
  M.premultiply(base);
  w.setTransform(M);
  w.setColor(color, shade);
  const [sx, sy, sz] = part.s;
  switch (part.shape) {
    case 'box':
      box(w, sx, sy, sz, Math.abs(part.rx ?? 0) > 0.3 || Math.abs(part.rz ?? 0) > 0.3);
      break;
    case 'gable':
      gable(w, sx, sy, sz);
      break;
    case 'hip':
      hip(w, sx, sy, sz);
      break;
    case 'pyr':
      pyr(w, sx, sy, sz);
      break;
    case 'cyl':
      cyl(w, sx, sy, sz, part.taper ?? 1, lowPoly ? Math.min(6, part.seg ?? 10) : (part.seg ?? 10));
      break;
    case 'sphere':
      sphere(w, sx, sy, sz, lowPoly);
      break;
  }
}

/** Nhiều bộ phận → một geometry. */
/**
 * Nhiều bộ phận → một geometry. `lowPoly`: cầu 20 mặt, trụ ≤ 6 cạnh — cho cây
 * cối vẽ bằng instancing (hàng trăm cây, mỗi tán cầu 80 mặt là quá tải GPU yếu).
 */
export function partsGeometry(parts: readonly Part[], v: Visual, base = new THREE.Matrix4(), w = new Writer(), opts: { lowPoly?: boolean } = {}): Writer {
  for (const p of parts) writePart(w, p, base, colorOf(p, v), 1, !!opts.lowPoly);
  return w;
}

/** Vật liệu toon dùng chung: 3 bậc sáng, màu lấy từ đỉnh. */
let toonGradient: THREE.DataTexture | null = null;
export function toonMaterial(opts: { transparent?: boolean; opacity?: number } = {}): THREE.MeshToonMaterial {
  if (!toonGradient) {
    const data = new Uint8Array([120, 190, 255]);
    toonGradient = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
    toonGradient.minFilter = THREE.NearestFilter;
    toonGradient.magFilter = THREE.NearestFilter;
    toonGradient.needsUpdate = true;
  }
  return new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonGradient, transparent: !!opts.transparent, opacity: opts.opacity ?? 1, depthWrite: !opts.transparent });
}

/** Vật liệu mặt đất: đổ sáng liên tục (không lượng tử) để đồi núi đọc được độ dốc. */
export function groundMaterial(): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ vertexColors: true });
}
