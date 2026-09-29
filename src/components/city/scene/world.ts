/**
 * Dựng hình ĐỊA HÌNH, NƯỚC, ĐƯỜNG và CÂY TỰ NHIÊN từ dữ liệu thuần
 * (`services/city/terrain`, `placement`) trên lưới cao độ mịn của `surface.ts`.
 *
 * Phong cách low-poly: mặt đất liền, mặt cắt tam giác phẳng, màu loang theo
 * nhiễu tần số thấp (không kẻ ô bàn cờ); bãi cát bám theo mép nước; sườn dốc
 * thành đất đá; đỉnh núi cao phủ tuyết. Mép bản đồ là vách sa bàn nhiều lớp.
 */
import * as THREE from 'three';

import { PALETTE } from '@/data/city/palette';
import { key, roadShape, type RoadTile } from '@/services/city/placement';
import { Builder, rng } from '@/services/city/procgen/parts';
import { bush, flowers, rock, treePalm, treePine, treeRound } from '@/services/city/procgen/props';
import { fbm, heightAt, isWater, regionOf, SNOW_H, tileAt, type LandWork, type Terrain, type Tile } from '@/services/city/terrain';
import { partsGeometry, rgb, Writer } from './geometry';
import { HS, sampleField, sampleGrid, vx, waterLevel, type Field } from './surface';

export { HS, WATER_OFF } from './surface';

const P = PALETTE;
const BASE = -1.3; // đáy sa bàn

/** Toạ độ thế giới của tâm ô. */
export function tileCenter(t: Terrain, x: number, y: number): [number, number] {
  return [x + 0.5 - t.size / 2, y + 0.5 - t.size / 2];
}

/** Ô dưới một điểm thế giới. */
export function tileOf(t: Terrain, wx: number, wz: number): [number, number] {
  return [Math.floor(wx + t.size / 2), Math.floor(wz + t.size / 2)];
}

/** Cao độ NỀN của ô (nơi đặt công trình; nước: dưới mặt nước một chút). */
export function topY(t: Terrain, works: Record<string, LandWork>, x: number, y: number): number {
  const tile = tileAt(t, x, y);
  if (!tile) return BASE;
  if (isWater(tile)) return tile.h * HS - 0.15;
  return heightAt(t, works, x, y) * HS;
}

export function waterY(tile: Tile): number {
  return waterLevel(tile);
}

function hashf(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + s * 97) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const smooth = (e0: number, e1: number, x: number) => {
  const k = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return k * k * (3 - 2 * k);
};

const C = {
  grassA: rgb(P.terrain.grass[0]!),
  grassB: rgb(P.terrain.grass[3]!),
  grassC: rgb(P.terrain.grass[2]!),
  meadow: rgb(P.terrain.meadow),
  grassDark: rgb(P.terrain.grassDark),
  sand: rgb(P.terrain.sand),
  sandWet: rgb(P.terrain.sandWet),
  bed: rgb('#B7A57A'),
  bedDeep: rgb('#8E8A70'),
  rock: rgb(P.terrain.rock),
  rockDark: rgb(P.terrain.rockDark),
  snow: rgb(P.terrain.snow),
  cliff: rgb(P.terrain.cliff),
  cliffDark: rgb(P.terrain.cliffDark),
  soilDark: rgb(P.terrain.soilDark),
  reinforce: rgb('#D9C79B'),
  terrace: rgb('#9CC56A'),
};

/** Màu một mặt tam giác theo: loại ô, độ dốc, cao độ, mực nước gần, nhiễu loang. */
function groundColor(t: Terrain, works: Record<string, LandWork>, cx: number, cy: number, cz: number, ny: number, level: number, sandW: number, rockW: number): RGB {
  const tx = Math.max(0, Math.min(t.size - 1, Math.floor(cx + t.size / 2)));
  const tz = Math.max(0, Math.min(t.size - 1, Math.floor(cz + t.size / 2)));
  const tile = t.tiles[tz * t.size + tx]!;
  const work = works[key(tx, tz)];
  const u = cx + t.size / 2;
  const v = cz + t.size / 2;
  if (!Number.isNaN(level)) {
    // Đáy nước: nông sáng, sâu sẫm.
    if (cy < level - 0.03) return mix(C.bed, C.bedDeep, smooth(0.05, 0.5, level - cy));
    // Bãi cát chạy theo mép nước.
    if (cy < level + 0.13 && tile.kind !== 'rock') return mix(C.sandWet, C.sand, smooth(level, level + 0.12, cy));
  }
  if (work === 'reinforce') return C.reinforce;
  const snowLine = SNOW_H * HS - 0.3;
  // Núi: đá theo cao độ (ngưỡng lượn theo nhiễu) chứ không theo ô → ranh cỏ/đá tự nhiên.
  const wobble = fbm(u / 3, v / 3, t.seed + 43) - 0.5;
  const rocky = t.kind === 'mountain' ? cy > (5.3 + (fbm(u / 4, v / 4, t.seed + 41) - 0.5) * 2.2) * HS : rockW > 0.45 + wobble * 0.3;
  if (rocky || ny < 0.6) {
    if (cy >= snowLine && ny > 0.45) return C.snow;
    const r = mix(C.rock, C.rockDark, smooth(0.35, 0.65, fbm(u / 3, v / 3, t.seed + 31)));
    return ny < 0.45 ? mix(r, C.rockDark, 0.6) : r;
  }
  if (sandW > 0.42 + wobble * 0.35) return mix(C.sand, C.sandWet, smooth(0.3, 0.7, fbm(u / 2, v / 2, t.seed + 3)) * 0.5);
  // Cỏ: ba sắc pha theo nhiễu tần số thấp + đồng cỏ sáng + sườn dốc sẫm lại.
  let g = mix(C.grassA, C.grassB, smooth(0.3, 0.7, fbm(u / 7, v / 7, t.seed + 21)));
  g = mix(g, C.grassC, smooth(0.55, 0.8, fbm(u / 4, v / 4, t.seed + 23)) * 0.6);
  g = mix(g, C.meadow, smooth(0.5, 0.72, fbm(u / 5, v / 5, t.seed + 9)) * 0.85);
  if (work === 'terrace') g = mix(g, C.terrace, 0.6);
  if (ny < 0.86) g = mix(g, ny < 0.72 ? C.cliff : C.grassDark, ny < 0.72 ? 0.75 : 0.55);
  return g;
}

/**
 * Lưới địa hình liền mạch. Vùng chưa mở tối hơn để người học thấy ranh giới đất
 * có thể mở rộng.
 */
export function terrainGeometry(t: Terrain, works: Record<string, LandWork>, regions: readonly number[], f: Field): THREE.BufferGeometry {
  const w = new Writer();
  w.setTransform(new THREE.Matrix4());
  const open = new Set(regions);
  const n = f.n;
  type V3 = [number, number, number];
  const pt = (i: number, j: number): V3 => [vx(f, i), f.h[j * n + i]!, vx(f, j)];
  const lv = (i: number, j: number) => f.lvl[j * n + i]!;
  const face = (a: V3, b: V3, c: V3, level: number, jitter: number) => {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const wx = c[0] - a[0];
    const wy = c[1] - a[1];
    const wz = c[2] - a[2];
    const nx = uy * wz - uz * wy;
    const nyv = uz * wx - ux * wz;
    const nz = ux * wy - uy * wx;
    const ny = nyv / (Math.hypot(nx, nyv, nz) || 1);
    const cx = (a[0] + b[0] + c[0]) / 3;
    const cy = (a[1] + b[1] + c[1]) / 3;
    const cz = (a[2] + b[2] + c[2]) / 3;
    const [tx, tz] = tileOf(t, cx, cz);
    const shade = (open.has(regionOf(Math.max(0, Math.min(t.size - 1, tx)), Math.max(0, Math.min(t.size - 1, tz)))) ? 1 : 0.8) * jitter;
    const col = groundColor(t, works, cx, cy, cz, ny, level, sampleGrid(f, f.sand, cx, cz), sampleGrid(f, f.rock, cx, cz));
    w.setRGB(col[0] * shade, col[1] * shade, col[2] * shade);
    w.tri(a, b, c);
  };
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const A = pt(i, j);
      const B = pt(i + 1, j);
      const Cc = pt(i + 1, j + 1);
      const D = pt(i, j + 1);
      const levels = [lv(i, j), lv(i + 1, j), lv(i + 1, j + 1), lv(i, j + 1)].filter((x) => !Number.isNaN(x));
      const level = levels.length ? Math.max(...levels) : NaN;
      const jit = 0.985 + hashf(i, j, 77) * 0.03;
      if (f.diag[j * (n - 1) + i] === 0) {
        face(A, D, Cc, level, jit);
        face(A, Cc, B, level, 0.985 + hashf(i, j, 78) * 0.03);
      } else {
        face(A, D, B, level, jit);
        face(B, D, Cc, level, 0.985 + hashf(i, j, 78) * 0.03);
      }
    }
  }

  // Vách sa bàn ở bốn mép: mép cỏ mỏng, lớp đất, lớp đất sẫm.
  const band = (a: V3, b: V3, lowA: number, lowB: number, topA: number, topB: number, col: RGB, shade: number) => {
    if (topA <= lowA + 1e-4 && topB <= lowB + 1e-4) return;
    w.setRGB(col[0] * shade, col[1] * shade, col[2] * shade);
    w.quad([a[0], lowA, a[2]], [a[0], topA, a[2]], [b[0], topB, b[2]], [b[0], lowB, b[2]]);
  };
  const skirt = (a: V3, b: V3, shade: number) => {
    const [ha, hb] = [a[1], b[1]];
    band(a, b, ha - 0.08, hb - 0.08, ha, hb, C.grassDark, shade);
    band(a, b, Math.max(BASE, ha - 0.75), Math.max(BASE, hb - 0.75), ha - 0.08, hb - 0.08, C.cliff, shade);
    band(a, b, BASE, BASE, Math.max(BASE, ha - 0.75), Math.max(BASE, hb - 0.75), C.cliffDark, shade);
  };
  for (let i = 0; i < n - 1; i++) {
    skirt(pt(i, 0), pt(i + 1, 0), 0.9); // mép bắc (nhìn về −z)
    skirt(pt(i + 1, n - 1), pt(i, n - 1), 1); // mép nam
    skirt(pt(0, i + 1), pt(0, i), 0.86); // mép tây
    skirt(pt(n - 1, i), pt(n - 1, i + 1), 0.95); // mép đông
  }
  w.setRGB(C.soilDark[0] * 0.8, C.soilDark[1] * 0.8, C.soilDark[2] * 0.8);
  const half = f.half;
  w.quad([-half, BASE, -half], [half, BASE, -half], [half, BASE, half], [-half, BASE, half]);
  return w.toGeometry();
}

/**
 * Mặt nước theo mực nước từng vùng: màu theo độ sâu (nông sáng, sâu sẫm) và
 * thuộc tính `shore` cho bọt ven bờ. Mép bản đồ có vách nước như bể kính.
 */
export function waterGeometry(t: Terrain, f: Field): THREE.BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  const shore: number[] = [];
  const n = f.n;
  const shallow = rgb(P.terrain.waterShallow);
  const deep = rgb(P.terrain.waterDeep);
  const push = (x: number, y: number, z: number, depth: number, side = false) => {
    pos.push(x, y, z);
    const c = mix(shallow, deep, smooth(0.08, 0.6, depth));
    const k = side ? 0.8 : 1;
    col.push(c[0] * k, c[1] * k, c[2] * k);
    shore.push(side ? 0 : 1 - smooth(0.02, 0.2, depth));
  };
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const idx = [j * n + i, j * n + i + 1, (j + 1) * n + i + 1, (j + 1) * n + i];
      const ls = idx.map((k) => f.lvl[k]!);
      const defined = ls.filter((x) => !Number.isNaN(x));
      if (!defined.length) continue;
      const top = Math.max(...defined);
      const L = ls.map((x) => (Number.isNaN(x) ? top : x));
      // Bỏ ô mà cả bốn góc đất đều cao hơn mặt nước (không nhìn thấy).
      if (idx.every((k, q) => f.h[k]! > L[q]! + 0.02)) continue;
      const v = (q: number): [number, number, number, number] => {
        const ii = i + (q === 1 || q === 2 ? 1 : 0);
        const jj = j + (q >= 2 ? 1 : 0);
        return [vx(f, ii), L[q]!, vx(f, jj), L[q]! - f.h[idx[q]!]!];
      };
      const [A, B, Cc, D] = [v(0), v(1), v(2), v(3)];
      for (const [p, q, r] of [
        [A, D, Cc],
        [A, Cc, B],
      ] as const) {
        push(p[0], p[1], p[2], p[3]);
        push(q[0], q[1], q[2], q[3]);
        push(r[0], r[1], r[2], r[3]);
      }
    }
  }
  // Vách nước ở mép bản đồ.
  const side = (i0: number, j0: number, i1: number, j1: number) => {
    const k0 = j0 * n + i0;
    const k1 = j1 * n + i1;
    const l0 = f.lvl[k0]!;
    const l1 = f.lvl[k1]!;
    if (Number.isNaN(l0) || Number.isNaN(l1)) return;
    const h0 = f.h[k0]!;
    const h1 = f.h[k1]!;
    if (h0 >= l0 && h1 >= l1) return;
    const a: [number, number, number] = [vx(f, i0), Math.min(h0, l0), vx(f, j0)];
    const b: [number, number, number] = [vx(f, i1), Math.min(h1, l1), vx(f, j1)];
    const a2: [number, number, number] = [a[0], l0, a[2]];
    const b2: [number, number, number] = [b[0], l1, b[2]];
    for (const p of [a, a2, b2, a, b2, b]) push(p[0], p[1], p[2], 0.6, true);
  };
  for (let i = 0; i < n - 1; i++) {
    side(i, 0, i + 1, 0);
    side(i + 1, n - 1, i, n - 1);
    side(0, i + 1, 0, i);
    side(n - 1, i, n - 1, i + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('shore', new THREE.Float32BufferAttribute(shore, 1));
  g.computeBoundingSphere();
  void t;
  return g;
}

/** Vật liệu nước: màu đỉnh + gợn sáng nhẹ chạy theo thời gian + bọt ven bờ. */
export function waterMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexColors: true,
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader: `
      attribute float shore;
      varying vec3 vColor; varying vec3 vPos; varying float vShore;
      void main(){ vColor = color; vShore = shore; vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform float time; varying vec3 vColor; varying vec3 vPos; varying float vShore;
      void main(){
        float w = sin(vPos.x*3.1 + time*1.2) * sin(vPos.z*2.7 - time*0.9);
        float band = smoothstep(0.82, 0.98, w);
        vec3 c = vColor + vec3(0.10,0.12,0.12) * band;
        float foam = vShore * (0.55 + 0.45*sin(vPos.x*6.0 + vPos.z*5.0 + time*2.0)) * 0.55;
        c = mix(c, vec3(0.95,0.99,1.0), clamp(foam, 0.0, 1.0));
        gl_FragColor = vec4(c, 0.9);
      }`,
  });
}

/**
 * Đường: tâm + nhánh về phía ô kề có đường (tự nối: thẳng / cua / ngã ba / ngã
 * tư). Mặt đường PHỦ theo mặt đất (cắt theo lưới cao độ). Cầu có mặt cầu phẳng,
 * lan can và trụ.
 */
export function roadGeometry(t: Terrain, works: Record<string, LandWork>, roads: Record<string, RoadTile>, f: Field): THREE.BufferGeometry {
  const w = new Writer();
  w.setTransform(new THREE.Matrix4());
  const half = t.size / 2;
  const W = 0.62;
  // Mặt đường phủ theo lưới thưa (nửa ô): đủ bám dốc, tốn ít tam giác hơn 4 lần lưới địa hình.
  const step = 0.5;
  const cuts = (a: number, b: number) => {
    const out = [a];
    for (let g = Math.ceil((a + half) / step + 1e-6) * step - half; g < b - 1e-6; g += step) out.push(g);
    out.push(b);
    return out;
  };
  /** Tấm phủ theo mặt đất, nhô `off` + dày `thick`. */
  const drape = (ax: number, az: number, bx: number, bz: number, off: number, c: string, thick = 0.025) => {
    w.setColor(c);
    const xs = cuts(ax, bx);
    const zs = cuts(az, bz);
    const y = (x: number, z: number) => sampleField(f, x, z) + off;
    for (let zi = 0; zi < zs.length - 1; zi++) {
      for (let xi = 0; xi < xs.length - 1; xi++) {
        const x0 = xs[xi]!;
        const x1 = xs[xi + 1]!;
        const z0 = zs[zi]!;
        const z1 = zs[zi + 1]!;
        w.quad([x0, y(x0, z1) + thick, z1], [x1, y(x1, z1) + thick, z1], [x1, y(x1, z0) + thick, z0], [x0, y(x0, z0) + thick, z0]);
      }
    }
    if (thick <= 0.004) return;
    // Mép dày ở bốn cạnh ngoài.
    for (let xi = 0; xi < xs.length - 1; xi++) {
      const x0 = xs[xi]!;
      const x1 = xs[xi + 1]!;
      w.quad([x0, y(x0, bz) - 0.02, bz], [x1, y(x1, bz) - 0.02, bz], [x1, y(x1, bz) + thick, bz], [x0, y(x0, bz) + thick, bz]);
      w.quad([x1, y(x1, az) - 0.02, az], [x0, y(x0, az) - 0.02, az], [x0, y(x0, az) + thick, az], [x1, y(x1, az) + thick, az]);
    }
    for (let zi = 0; zi < zs.length - 1; zi++) {
      const z0 = zs[zi]!;
      const z1 = zs[zi + 1]!;
      w.quad([bx, y(bx, z1) - 0.02, z1], [bx, y(bx, z0) - 0.02, z0], [bx, y(bx, z0) + thick, z0], [bx, y(bx, z1) + thick, z1]);
      w.quad([ax, y(ax, z0) - 0.02, z0], [ax, y(ax, z1) - 0.02, z1], [ax, y(ax, z1) + thick, z1], [ax, y(ax, z0) + thick, z0]);
    }
  };
  /** Khối phẳng (mặt cầu, lan can, trụ). */
  const rect = (ax: number, az: number, bx: number, bz: number, yy: number, c: string, thick = 0.03) => {
    w.setColor(c);
    w.quad([ax, yy + thick, bz], [bx, yy + thick, bz], [bx, yy + thick, az], [ax, yy + thick, az]);
    w.quad([ax, yy, bz], [bx, yy, bz], [bx, yy + thick, bz], [ax, yy + thick, bz]);
    w.quad([bx, yy, az], [ax, yy, az], [ax, yy + thick, az], [bx, yy + thick, az]);
    w.quad([bx, yy, bz], [bx, yy, az], [bx, yy + thick, az], [bx, yy + thick, bz]);
    w.quad([ax, yy, az], [ax, yy, bz], [ax, yy + thick, bz], [ax, yy + thick, az]);
  };
  for (const [k, kind] of Object.entries(roads)) {
    const [x, y] = k.split(',').map(Number) as [number, number];
    const tile = tileAt(t, x, y);
    if (!tile) continue;
    const bridge = kind === 'bridge_wood' || kind === 'bridge_stone';
    const cx = x + 0.5 - half;
    const cz = y + 0.5 - half;
    const sh = roadShape(roads, x, y);
    const color = kind === 'dirt' || kind === 'bridge_wood' ? (bridge ? P.wood.plank : P.terrain.dirt) : kind === 'stone' || kind === 'bridge_stone' ? P.stone.light : '#4E545E';
    const h2 = W / 2;
    const arms: [boolean, number, number, number, number][] = [
      [sh.n, cx - h2, cz - 0.5, cx + h2, cz - h2],
      [sh.s, cx - h2, cz + h2, cx + h2, cz + 0.5],
      [sh.e, cx + h2, cz - h2, cx + 0.5, cz + h2],
      [sh.w, cx - 0.5, cz - h2, cx - h2, cz + h2],
    ];
    if (bridge) {
      // Mặt cầu ngang mặt đất bờ cao nhất kề bên.
      let bank = tile.h * HS;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const nb = tileAt(t, x + dx, y + dy);
        if (nb && !isWater(nb)) bank = Math.max(bank, heightAt(t, works, x + dx, y + dy) * HS);
      }
      const y0 = Math.max(bank, waterLevel(tile) + 0.12) + 0.02;
      rect(cx - h2, cz - h2, cx + h2, cz + h2, y0, color, 0.05);
      for (const [on, ax, az, bx, bz] of arms) if (on) rect(ax, az, bx, bz, y0, color, 0.05);
      const wood = kind === 'bridge_wood';
      const rail = wood ? P.wood.dark : P.stone.mid;
      const along = sh.n || sh.s || !(sh.e || sh.w);
      if (along) {
        rect(cx - h2 - 0.02, cz - 0.5, cx - h2 + 0.02, cz + 0.5, y0 + 0.05, rail, 0.12);
        rect(cx + h2 - 0.02, cz - 0.5, cx + h2 + 0.02, cz + 0.5, y0 + 0.05, rail, 0.12);
      } else {
        rect(cx - 0.5, cz - h2 - 0.02, cx + 0.5, cz - h2 + 0.02, y0 + 0.05, rail, 0.12);
        rect(cx - 0.5, cz + h2 - 0.02, cx + 0.5, cz + h2 + 0.02, y0 + 0.05, rail, 0.12);
      }
      const bottom = tile.h * HS - 0.5;
      for (const [px, pz] of [
        [cx - h2 + 0.05, cz - h2 + 0.05],
        [cx + h2 - 0.05, cz + h2 - 0.05],
        [cx - h2 + 0.05, cz + h2 - 0.05],
        [cx + h2 - 0.05, cz - h2 + 0.05],
      ] as const)
        rect(px - 0.04, pz - 0.04, px + 0.04, pz + 0.04, bottom, wood ? P.wood.dark : P.stone.dark, y0 - bottom);
      continue;
    }
    const o = 0.012;
    drape(cx - h2, cz - h2, cx + h2, cz + h2, o, color);
    for (const [on, ax, az, bx, bz] of arms) if (on) drape(ax, az, bx, bz, o, color);
    // Chi tiết: đá có mạch lát, nhựa có vạch giữa + lề, đất có vệt bánh xe.
    const top = o + 0.027;
    if (kind === 'stone') {
      for (let i = -1; i <= 1; i++) drape(cx + i * 0.2 - 0.006, cz - h2, cx + i * 0.2 + 0.006, cz + h2, top, P.stone.mid, 0.002);
    } else if (kind === 'asphalt') {
      if (sh.n || sh.s) {
        drape(cx - 0.015, cz - 0.3, cx + 0.015, cz - 0.05, top, '#F2C53D', 0.002);
        drape(cx - 0.015, cz + 0.05, cx + 0.015, cz + 0.3, top, '#F2C53D', 0.002);
      }
      if (sh.e || sh.w) {
        drape(cx - 0.3, cz - 0.015, cx - 0.05, cz + 0.015, top, '#F2C53D', 0.002);
        drape(cx + 0.05, cz - 0.015, cx + 0.3, cz + 0.015, top, '#F2C53D', 0.002);
      }
      if (!sh.n) drape(cx - h2, cz - h2 - 0.05, cx + h2, cz - h2, o, P.concrete.light, 0.05);
      if (!sh.s) drape(cx - h2, cz + h2, cx + h2, cz + h2 + 0.05, o, P.concrete.light, 0.05);
      if (!sh.e) drape(cx + h2, cz - h2, cx + h2 + 0.05, cz + h2, o, P.concrete.light, 0.05);
      if (!sh.w) drape(cx - h2 - 0.05, cz - h2, cx - h2, cz + h2, o, P.concrete.light, 0.05);
    } else if (kind === 'dirt') {
      drape(cx - 0.14, cz - 0.12, cx - 0.1, cz + 0.12, top, P.terrain.soil, 0.002);
      drape(cx + 0.1, cz - 0.12, cx + 0.14, cz + 0.12, top, P.terrain.soil, 0.002);
    }
  }
  return w.toGeometry();
}

// ------------------------------------------------------------------ cây tự nhiên (instancing)

export type NatureKind = 'tree' | 'pine' | 'palm' | 'rock' | 'bush' | 'flowers';

/** Hình mẫu của từng loại (2 biến thể) — dựng một lần, vẽ bằng InstancedMesh. */
export function natureTemplates(): Record<NatureKind, THREE.BufferGeometry[]> {
  const make = (fn: (b: Builder, r: () => number) => void, seed: number) => {
    const b = new Builder();
    fn(b, rng(seed));
    return partsGeometry(b.parts, { stage: 9, fraction: 1, delivered: true, floorsDone: 0, floorStep: 0, craneUp: false }, undefined, undefined, { lowPoly: true }).toGeometry();
  };
  return {
    tree: [make((b, r) => treeRound(b, 0, 0, 1.25, r), 1), make((b, r) => treeRound(b, 0, 0, 1.05, r), 2)],
    pine: [make((b, r) => treePine(b, 0, 0, 1.3, r), 3), make((b, r) => treePine(b, 0, 0, 1.05, r), 4)],
    palm: [make((b, r) => treePalm(b, 0, 0, 1.1, r), 5), make((b, r) => treePalm(b, 0, 0, 0.9, r), 6)],
    rock: [make((b, r) => rock(b, 0, 0, 1.4, r), 7), make((b, r) => rock(b, 0, 0, 1, r), 8)],
    bush: [make((b, r) => bush(b, 0, 0, 1.3, r), 9), make((b, r) => bush(b, 0, 0, 1, r), 10)],
    flowers: [make((b, r) => flowers(b, 0, 0, r, 0, 7), 11), make((b, r) => flowers(b, 0, 0, r, 0, 5), 12)],
  };
}

export type NatureInstance = { kind: NatureKind; variant: number; x: number; y: number; z: number; ry: number; s: number };

/** Cây/đá/bụi của địa hình (đứng đúng trên mặt đất), bỏ ô có đường hoặc công trường đã dọn nền. */
export function natureInstances(t: Terrain, works: Record<string, LandWork>, hidden: Set<string>, f: Field): NatureInstance[] {
  const out: NatureInstance[] = [];
  for (let y = 0; y < t.size; y++) {
    for (let x = 0; x < t.size; x++) {
      const tile = t.tiles[y * t.size + x]!;
      if (!tile.nature || hidden.has(key(x, y)) || works[key(x, y)]) continue;
      const [cx, cz] = tileCenter(t, x, y);
      const h = hashf(x, y, 9);
      // Cụm 1–2 cây mỗi ô cho rừng dày, lệch tâm để khỏi thẳng hàng.
      const n = tile.nature === 'tree' || tile.nature === 'pine' ? 1 + (h < 0.45 ? 1 : 0) : 1;
      for (let i = 0; i < n; i++) {
        const px = cx + (hashf(x, y, 20 + i) - 0.5) * 0.6;
        const pz = cz + (hashf(x, y, 30 + i) - 0.5) * 0.6;
        out.push({ kind: tile.nature, variant: hashf(x, y, 40 + i) < 0.5 ? 0 : 1, x: px, y: sampleField(f, px, pz) - 0.02, z: pz, ry: hashf(x, y, 50 + i) * Math.PI * 2, s: 0.8 + hashf(x, y, 60 + i) * 0.45 });
      }
    }
  }
  return out;
}
