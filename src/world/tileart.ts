import { HARD, SOFT, T, TILE } from './constants';
import { PALETTES, type Palette, type RGB } from './palette';
import { hash2, vnoise } from './rng';
import type { World } from './raster';

/**
 * Autotile theo hàng xóm TOÀN CỤC: mỗi ô nhìn 8 ô quanh nó trong lưới thế giới (kể cả ô thuộc chunk khác),
 * nên mép chunk không bao giờ là mép địa hình. Hoạ tiết (gạch, đá, sóng) lấy theo toạ độ ĐIỂM ẢNH toàn cục
 * nên liền mạch qua ranh giới ô và chunk.
 */

type Rim = 'none' | 'wall' | 'bank' | 'shore' | 'edging' | 'kerb' | 'kerb2' | 'rail' | 'fringe';

/** Ô `self` nhìn sang `nb` thì cần viền gì ở cạnh đó. */
export function rimOf(self: number, nb: number): Rim {
  if (self === nb) return 'none';
  if (self === T.WATER) return nb === T.BRIDGE ? 'none' : 'shore';
  if (nb === T.WATER) {
    if (self === T.BRIDGE) return 'rail';
    return HARD.has(self) ? 'wall' : 'bank';
  }
  if (self === T.ASPHALT || self === T.BRIDGE) {
    if (SOFT.has(nb)) return 'kerb';
    return 'none';
  }
  if ((self === T.SIDEWALK || self === T.BRICK || self === T.PLAZA) && nb === T.ASPHALT) return 'kerb2';
  if (HARD.has(self) && SOFT.has(nb)) return 'edging';
  if (self === T.SAND && (nb === T.GRASS || nb === T.PARK)) return 'fringe';
  if ((self === T.GRASS || self === T.PARK) && nb === T.SAND) return 'fringe';
  return 'none';
}

const pick = <A>(a: readonly A[], h: number): A => a[Math.min(a.length - 1, Math.floor(h * a.length))]!;

export type Painter = {
  /** Vẽ ô toàn cục (wx, wy) vào buffer RGBA tại điểm (ox, oy), `stride` là số điểm mỗi hàng. */
  paintTile(world: World, wx: number, wy: number, out: Uint8ClampedArray, stride: number, ox: number, oy: number, phase?: number): void;
  pal: Palette;
};

export function makePainter(palName: 'hanoi' | 'saigon', seed: number): Painter {
  const pal = PALETTES[palName];

  function base(world: World, t: number, wx: number, wy: number, gx: number, gy: number, phase: number): RGB {
    switch (t) {
      case T.GRASS: {
        const h = hash2(gx, gy, seed);
        if (hash2(gx >> 1, gy >> 1, seed + 7) < 0.05 && h < 0.5) return pal.grass[2]!;
        return h < 0.6 ? pal.grass[0]! : h < 0.82 ? pal.grass[1]! : h < 0.94 ? pal.grass[2]! : pal.grass[3]!;
      }
      case T.PARK: {
        const h = hash2(gx, gy, seed + 1);
        if (hash2(gx, gy, seed + 3) < 0.012) return pick(pal.flowers, hash2(gx >> 2, gy >> 2, seed + 4));
        return h < 0.62 ? pal.park[0]! : h < 0.88 ? pal.park[1]! : pal.park[2]!;
      }
      case T.SAND: {
        const h = hash2(gx, gy, seed + 2);
        return h < 0.7 ? pal.sand[0]! : h < 0.92 ? pal.sand[1]! : pal.sand[2]!;
      }
      case T.PLAZA: {
        const row = Math.floor(gy / 8);
        const gxs = gx + (row & 1) * 4;
        const bx = Math.floor(gxs / 8);
        if (gy % 8 === 0 || gxs % 8 === 0) return pal.plazaJoint;
        const h = hash2(bx, row, seed + 5);
        return h < 0.5 ? pal.plaza[0]! : h < 0.8 ? pal.plaza[1]! : pal.plaza[2]!;
      }
      case T.ASPHALT: {
        const h = hash2(gx, gy, seed + 6);
        return h < 0.78 ? pal.asphalt[0]! : h < 0.93 ? pal.asphalt[1]! : pal.asphalt[2]!;
      }
      case T.BRICK: {
        const row = Math.floor(gy / 4);
        const gxs = gx + (row & 1) * 4;
        if (gy % 4 === 0 || gxs % 8 === 0) return pal.mortar;
        const h = hash2(Math.floor(gxs / 8), row, seed + 8);
        return h < 0.45 ? pal.brick[0]! : h < 0.8 ? pal.brick[1]! : pal.brick[2]!;
      }
      case T.SIDEWALK: {
        const row = Math.floor(gy / 8);
        if (gy % 8 === 0 || gx % 8 === 0) return pal.sidewalkJoint;
        const h = hash2(Math.floor(gx / 8), row, seed + 9);
        return h < 0.5 ? pal.sidewalk[0]! : h < 0.85 ? pal.sidewalk[1]! : pal.sidewalk[2]!;
      }
      case T.PATH: {
        const h = hash2(gx, gy, seed + 10);
        return h < 0.65 ? pal.path[0]! : h < 0.9 ? pal.path[1]! : pal.path[2]!;
      }
      case T.BRIDGE: {
        const dir = world.bridgeDir[world.idx(wx, wy)]!;
        const k = dir === 0 ? gx : gy;
        if (k % 4 === 0) return pal.woodDark;
        const h = hash2(Math.floor(k / 4), dir === 0 ? Math.floor(gy / 16) : Math.floor(gx / 16), seed + 11);
        return h < 0.4 ? pal.wood[0]! : h < 0.75 ? pal.wood[1]! : pal.wood[2]!;
      }
      case T.LOT: {
        if (gx % 16 === 0 || gy % 16 === 0) return pal.lotJoint;
        const h = hash2(gx, gy, seed + 12);
        return h < 0.7 ? pal.lot[0]! : h < 0.9 ? pal.lot[1]! : pal.lot[2]!;
      }
      case T.WATER: {
        const n = vnoise(gx / 11 + phase * 0.05, gy / 7, seed + 13);
        const w = Math.sin(gx * 0.42 + gy * 0.21 + n * 7 + phase);
        if (w > 0.94) return pal.waterHi;
        return n < 0.4 ? pal.water[1]! : n < 0.72 ? pal.water[0]! : pal.water[2]!;
      }
      default:
        return [0, 0, 0];
    }
  }

  /** Màu của viền tại độ sâu `d` (0 = sát mép) và vị trí dọc cạnh `a` (toạ độ toàn cục); null = không vẽ. */
  function rimColor(rim: Rim, d: number, a: number, h: number): RGB | 'swap' | null {
    switch (rim) {
      case 'wall': // kè đá: bóng nước ngoài cùng, thân đá, mũ sáng, rồi lát
        if (d === 0) return pal.stoneDark;
        if (d === 1 || d === 2) return a % 8 === 0 ? pal.stoneDark : pal.stone[(a >> 3) % 3 === 0 ? 1 : d === 1 ? 0 : 2]!;
        if (d === 3) return pal.stoneCap;
        return null;
      case 'bank':
        if (d <= 1) return h < 0.55 ? pal.mud[0]! : pal.mud[1]!;
        if (d === 2 && h < 0.5) return pal.mud[1]!;
        if (d === 3 && h < 0.08) return pal.reed;
        return null;
      case 'shore':
        if (d === 0) return pal.waterShadow;
        if (d === 1) return h < 0.7 ? pal.waterShadow : pal.water[1]!;
        if (d === 2 && h < 0.5) return pal.waterShallow;
        if (d === 3 && h < 0.2) return pal.waterShallow;
        return null;
      case 'edging':
        return d === 0 ? pal.edge : null;
      case 'kerb':
        return d === 0 ? pal.kerb : d === 1 ? pal.asphalt[1]! : null;
      case 'kerb2':
        return d === 0 ? pal.kerb : null;
      case 'rail':
        if (d <= 1) return a % 8 < 2 ? pal.woodDark : d === 0 ? pal.wood[2]! : pal.woodDark;
        if (d === 2) return pal.woodDark;
        return null;
      case 'fringe':
        return d <= 2 && h < 0.42 - d * 0.14 ? 'swap' : null;
      default:
        return null;
    }
  }

  function paintTile(world: World, wx: number, wy: number, out: Uint8ClampedArray, stride: number, ox: number, oy: number, phase = 0) {
    const t = world.terrainAt(wx, wy);
    const nN = world.terrainAt(wx, wy - 1), nS = world.terrainAt(wx, wy + 1), nE = world.terrainAt(wx + 1, wy), nW = world.terrainAt(wx - 1, wy);
    const nNE = world.terrainAt(wx + 1, wy - 1), nNW = world.terrainAt(wx - 1, wy - 1), nSE = world.terrainAt(wx + 1, wy + 1), nSW = world.terrainAt(wx - 1, wy + 1);
    const rN = rimOf(t, nN), rS = rimOf(t, nS), rE = rimOf(t, nE), rW = rimOf(t, nW);
    // góc trong: hai cạnh kề không có viền nhưng ô chéo có
    const cNE = rN === 'none' && rE === 'none' ? rimOf(t, nNE) : 'none';
    const cNW = rN === 'none' && rW === 'none' ? rimOf(t, nNW) : 'none';
    const cSE = rS === 'none' && rE === 'none' ? rimOf(t, nSE) : 'none';
    const cSW = rS === 'none' && rW === 'none' ? rimOf(t, nSW) : 'none';
    const gx0 = wx * TILE, gy0 = wy * TILE;
    const marks = world.marks;
    for (let py = 0; py < TILE; py++) {
      for (let px = 0; px < TILE; px++) {
        const gx = gx0 + px, gy = gy0 + py;
        let c: RGB = base(world, t, wx, wy, gx, gy, phase);
        const h = hash2(gx, gy, seed + 21);
        const apply = (rim: Rim, d: number, a: number) => {
          const rc = rimColor(rim, d, a, h);
          if (!rc) return;
          c = rc === 'swap' ? (t === T.SAND ? pal.grass[0]! : pal.sand[0]!) : rc;
        };
        if (rN !== 'none') apply(rN, py, gx);
        if (rS !== 'none') apply(rS, TILE - 1 - py, gx);
        if (rW !== 'none') apply(rW, px, gy);
        if (rE !== 'none') apply(rE, TILE - 1 - px, gy);
        // góc trong
        if (cNE !== 'none' && px >= TILE - 3 && py < 3 && (TILE - 1 - px) + py < 3) apply(cNE, Math.max(TILE - 1 - px, py), gx);
        if (cNW !== 'none' && px < 3 && py < 3 && px + py < 3) apply(cNW, Math.max(px, py), gx);
        if (cSE !== 'none' && px >= TILE - 3 && py >= TILE - 3 && (TILE - 1 - px) + (TILE - 1 - py) < 3) apply(cSE, Math.max(TILE - 1 - px, TILE - 1 - py), gx);
        if (cSW !== 'none' && px < 3 && py >= TILE - 3 && px + (TILE - 1 - py) < 3) apply(cSW, Math.max(px, TILE - 1 - py), gx);
        // vạch kẻ đường (lớp điểm ảnh toàn cục)
        if (t === T.ASPHALT || t === T.BRIDGE) {
          const m = marks[gy * world.marksW + gx]!;
          if (m === 1) c = pal.laneYellow;
          else if (m === 2) c = pal.laneWhite;
          else if (m === 3) c = pal.zebra;
        }
        const o = ((oy + py) * stride + (ox + px)) * 4;
        out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = 255;
      }
    }
  }

  return { paintTile, pal };
}
