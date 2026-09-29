/**
 * MẶT ĐẤT LIỀN MẠCH (không phải cột khối). Luật chơi vẫn tính theo ô và bậc cao
 * độ (`services/city/terrain`), nhưng hình vẽ là một lưới cao độ mịn: mỗi ô chia
 * `SUB`×`SUB`, đỉnh giữa ô giữ đúng cao độ của ô, đỉnh ở mép / góc lấy trung
 * bình với các ô kề → đồi dốc thoai thoải, bờ nước cong theo đường đồng mức,
 * núi có sườn dốc thay vì bậc thang.
 *
 * Công trình: nền dưới khu đất được SAN PHẲNG đúng cao độ ô, vành ngoài vuốt
 * dốc nửa ô — như đội thợ san nền trước khi xây.
 */
import { heightAt, isWater, tileAt, type LandWork, type Terrain, type Tile } from '@/services/city/terrain';

export const SUB = 4;
/** Số vòng làm mịn đất liền. */
const SMOOTH_PASSES = 8;
/** Trong số đó, bao nhiêu vòng làm mịn cả dải bờ nước. */
const SHORE_PASSES = 4;
export const HS = 0.5; // một bậc cao độ
export const WATER_OFF = 0.32; // mặt nước cao hơn mốc bậc của ô nước

/** Cao độ mặt nước của ô nước. */
export function waterLevel(tile: Tile): number {
  return tile.h * HS + WATER_OFF - (tile.kind === 'stream' ? 0.04 : 0);
}

/** Cao độ "mong muốn" của một ô: đất = bậc × HS; nước = đáy (biển sâu hơn bãi nông). */
function tileY(t: Terrain, works: Record<string, LandWork>, x: number, y: number): number {
  const cx = Math.max(0, Math.min(t.size - 1, x));
  const cy = Math.max(0, Math.min(t.size - 1, y));
  const tile = t.tiles[cy * t.size + cx]!;
  if (tile.kind === 'water') return tile.h * HS - 0.5;
  if (tile.kind === 'shallow') return tile.h * HS - 0.06;
  if (tile.kind === 'stream') return tile.h * HS - 0.1;
  return heightAt(t, works, cx, cy) * HS;
}

/** Khu đất đã đặt công trình: san phẳng về cao độ `h`. */
export type Pin = { x: number; y: number; w: number; d: number; h: number };

export type Field = {
  size: number;
  /** Số đỉnh mỗi cạnh = size·SUB + 1. */
  n: number;
  half: number;
  /** Cao độ mặt đất tại đỉnh (i, j). */
  h: Float32Array;
  /** Mực nước gần đỉnh (NaN nếu không gần nước). */
  lvl: Float32Array;
  /** Đường chéo của ô lưới (0: A–C, 1: B–D) — dùng chung cho vẽ và lấy mẫu. */
  diag: Uint8Array;
  /** Tỉ lệ cát / đá quanh đỉnh (0..1, đã làm mịn) — ranh màu mềm thay vì theo ô. */
  sand: Float32Array;
  rock: Float32Array;
};

function hash(i: number, j: number, s: number): number {
  let h = (i * 374761393 + j * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function buildField(t: Terrain, works: Record<string, LandWork>, pins: readonly Pin[] = []): Field {
  const n = t.size * SUB + 1;
  const h = new Float32Array(n * n);
  const lvl = new Float32Array(n * n).fill(NaN);
  const land = new Uint8Array(n * n);
  const sand = new Float32Array(n * n);
  const rockW = new Float32Array(n * n);
  // Nhân Gauss: ô gần đỉnh nặng nhất, chuyển tiếp trải ±nửa ô quanh mép ô.
  const SIGMA2 = 2 * 0.42 * 0.42;
  const CUT = 1.5;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const u = i / SUB;
      const v = j / SUB;
      let sum = 0;
      let wsum = 0;
      let sandSum = 0;
      let rockSum = 0;
      let msum = 0;
      let allLand = true;
      let allWet = true;
      let level = NaN;
      for (let ty = Math.floor(v - 2); ty <= Math.ceil(v + 1); ty++) {
        for (let tx = Math.floor(u - 2); tx <= Math.ceil(u + 1); tx++) {
          const d = Math.hypot(u - (tx + 0.5), v - (ty + 0.5));
          const tile = tileAt(t, Math.max(0, Math.min(t.size - 1, tx)), Math.max(0, Math.min(t.size - 1, ty)));
          if (tile && !isWater(tile) && d <= 1.0) allWet = false;
          if (tile && isWater(tile) && d <= 1.0) {
            allLand = false;
            const l = waterLevel(tile);
            level = Number.isNaN(level) ? l : Math.max(level, l);
          }
          if (tile && d < 1.3) {
            const mw = (1 - d / 1.3) ** 2;
            if (tile.kind === 'sand' && works[`${tx},${ty}`] !== 'reinforce') sandSum += mw;
            if (tile.kind === 'rock') rockSum += mw;
            msum += mw;
          }
          if (d >= CUT) continue;
          const wgt = Math.exp(-(d * d) / SIGMA2);
          sum += tileY(t, works, tx, ty) * wgt;
          wsum += wgt;
        }
      }
      h[j * n + i] = wsum > 0 ? sum / wsum : 0;
      lvl[j * n + i] = level;
      land[j * n + i] = allLand ? 1 : allWet ? 2 : 0;
      sand[j * n + i] = msum > 0 ? sandSum / msum : 0;
      rockW[j * n + i] = msum > 0 ? rockSum / msum : 0;
    }
  }
  // Làm tròn: vài vòng cho mọi đỉnh (bờ nước lượn tròn thay vì theo mép ô),
  // thêm vài vòng riêng cho đất liền (đồi tròn, không bào mòn lòng sông).
  const tmp = new Float32Array(n * n);
  for (let it = 0; it < SMOOTH_PASSES; it++) {
    tmp.set(h);
    for (let j = 1; j < n - 1; j++) {
      for (let i = 1; i < n - 1; i++) {
        const k = j * n + i;
        if (it >= SHORE_PASSES && land[k] !== 1) continue;
        const avg = (tmp[k - 1]! + tmp[k + 1]! + tmp[k - n]! + tmp[k + n]!) / 4;
        h[k] = tmp[k]! * 0.5 + avg * 0.5;
      }
    }
  }
  // Suối hẹp: lòng suối luôn dưới mặt nước (không để làm mịn lấp mất).
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const u = i / SUB;
      const v = j / SUB;
      for (let ty = Math.floor(v - 1); ty <= Math.floor(v); ty++) {
        for (let tx = Math.floor(u - 1); tx <= Math.floor(u); tx++) {
          const tile = tileAt(t, tx, ty);
          if (!tile || tile.kind !== 'stream') continue;
          if (Math.abs(u - (tx + 0.5)) <= 0.5 && Math.abs(v - (ty + 0.5)) <= 0.5) {
            const k = j * n + i;
            h[k] = Math.min(h[k]!, waterLevel(tile) - 0.1);
          }
        }
      }
    }
  }
  // Gợn rất nhẹ cho mặt đất có "mặt cắt" low-poly, không phẳng lì.
  for (let k = 0; k < n * n; k++) if (land[k] === 1) h[k] = h[k]! + (hash(k % n, Math.floor(k / n), t.seed) - 0.5) * 0.04;
  // San nền công trình.
  for (const p of pins) {
    const i0 = p.x * SUB;
    const j0 = p.y * SUB;
    const i1 = (p.x + p.w) * SUB;
    const j1 = (p.y + p.d) * SUB;
    for (let j = j0 - 1; j <= j1 + 1; j++) {
      for (let i = i0 - 1; i <= i1 + 1; i++) {
        if (i < 0 || j < 0 || i >= n || j >= n) continue;
        const inside = i >= i0 && i <= i1 && j >= j0 && j <= j1;
        const k = j * n + i;
        h[k] = inside ? p.h : (h[k]! + p.h) / 2;
      }
    }
  }
  // Chọn đường chéo ít chênh hơn → tránh tam giác gãy.
  const diag = new Uint8Array((n - 1) * (n - 1));
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const a = h[j * n + i]!;
      const b = h[j * n + i + 1]!;
      const c = h[(j + 1) * n + i + 1]!;
      const d = h[(j + 1) * n + i]!;
      diag[j * (n - 1) + i] = Math.abs(a - c) <= Math.abs(b - d) ? 0 : 1;
    }
  }
  // Làm mịn hai lớp tỉ lệ để ranh cát / đá lượn tròn.
  for (const m of [sand, rockW]) {
    for (let it = 0; it < 5; it++) {
      tmp.set(m);
      for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) {
        const k = j * n + i;
        m[k] = tmp[k]! * 0.4 + ((tmp[k - 1]! + tmp[k + 1]! + tmp[k - n]! + tmp[k + n]!) / 4) * 0.6;
      }
    }
  }
  return { size: t.size, n, half: t.size / 2, h, lvl, diag, sand, rock: rockW };
}

/** Toạ độ thế giới của đỉnh (i, j). */
export function vx(f: Field, i: number): number {
  return i / SUB - f.half;
}

/** Cao độ mặt đất ĐÚNG theo tam giác đã vẽ tại điểm thế giới (wx, wz). */
export function sampleField(f: Field, wx: number, wz: number): number {
  const u = Math.max(0, Math.min(f.n - 1 - 1e-6, (wx + f.half) * SUB));
  const v = Math.max(0, Math.min(f.n - 1 - 1e-6, (wz + f.half) * SUB));
  const i = Math.floor(u);
  const j = Math.floor(v);
  const fx = u - i;
  const fz = v - j;
  const n = f.n;
  const A = f.h[j * n + i]!;
  const B = f.h[j * n + i + 1]!;
  const C = f.h[(j + 1) * n + i + 1]!;
  const D = f.h[(j + 1) * n + i]!;
  if (f.diag[j * (n - 1) + i] === 0) {
    return fx >= fz ? A + (B - A) * fx + (C - B) * fz : A + (C - D) * fx + (D - A) * fz;
  }
  return fx + fz <= 1 ? A + (B - A) * fx + (D - A) * fz : C + (D - C) * (1 - fx) + (B - C) * (1 - fz);
}

/** Mực nước tại điểm (NaN nếu không có nước gần). */
export function sampleLevel(f: Field, wx: number, wz: number): number {
  const i = Math.round((wx + f.half) * SUB);
  const j = Math.round((wz + f.half) * SUB);
  if (i < 0 || j < 0 || i >= f.n || j >= f.n) return NaN;
  return f.lvl[j * f.n + i]!;
}

/** Lấy mẫu song tuyến một lớp theo đỉnh (tỉ lệ cát / đá). */
export function sampleGrid(f: Field, arr: Float32Array, wx: number, wz: number): number {
  const u = Math.max(0, Math.min(f.n - 1 - 1e-6, (wx + f.half) * SUB));
  const v = Math.max(0, Math.min(f.n - 1 - 1e-6, (wz + f.half) * SUB));
  const i = Math.floor(u);
  const j = Math.floor(v);
  const fx = u - i;
  const fz = v - j;
  const n = f.n;
  const a = arr[j * n + i]!;
  const b = arr[j * n + i + 1]!;
  const c = arr[(j + 1) * n + i + 1]!;
  const d = arr[(j + 1) * n + i]!;
  return (a * (1 - fx) + b * fx) * (1 - fz) + (d * (1 - fx) + c * fx) * fz;
}
