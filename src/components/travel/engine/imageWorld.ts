/**
 * THẾ GIỚI CHẾ ĐỘ ẢNH: tranh nền dựng sẵn + lưới thô mô tả mặt đất (đi được / nước / chặn), mỗi ô
 * `cell` điểm nguồn. Không dùng DOM → test được bằng Node. Đường đi: A* trên lưới thô (dùng lại
 * `findPath` của logic), rồi "kéo căng" các điểm quanh góc bằng kiểm tra tầm nhìn trên lưới để người đi
 * thẳng thay vì bậc thang.
 */
import { findPath } from '@/services/travel/pathfinding';
import type { CityMap, ImageLayer, Tile } from '@/services/travel/types';

export type Pt = { x: number; y: number };

export type ImgWorld = {
  /** Cỡ ảnh theo điểm nguồn. */
  w: number;
  h: number;
  cell: number;
  mw: number;
  mh: number;
  walk: Uint8Array;
  water: Uint8Array;
  /** Chỉ số các ô nước (để rắc ánh lấp lánh). */
  waterCells: Int32Array;
  /** Chỉ số các ô đi được. */
  walkCells: Int32Array;
};

export function buildImgWorld(layer: ImageLayer): ImgWorld {
  const { cell, rows } = layer.mask;
  const mh = rows.length;
  const mw = Math.max(0, ...rows.map((r) => r.length));
  const walk = new Uint8Array(mw * mh);
  const water = new Uint8Array(mw * mh);
  const wc: number[] = [];
  const kc: number[] = [];
  for (let j = 0; j < mh; j++)
    for (let i = 0; i < mw; i++) {
      const ch = rows[j]![i];
      if (ch === '#') {
        walk[j * mw + i] = 1;
        kc.push(j * mw + i);
      } else if (ch === '~') {
        water[j * mw + i] = 1;
        wc.push(j * mw + i);
      }
    }
  return { w: layer.size.w, h: layer.size.h, cell, mw, mh, walk, water, waterCells: Int32Array.from(wc), walkCells: Int32Array.from(kc) };
}

export function isWalkPx(w: ImgWorld, x: number, y: number): boolean {
  const i = Math.floor(x / w.cell);
  const j = Math.floor(y / w.cell);
  if (i < 0 || j < 0 || i >= w.mw || j >= w.mh) return false;
  return w.walk[j * w.mw + i] === 1;
}

/** Cả đoạn thẳng đều đi được? (lấy mẫu mỗi nửa ô) */
export function lineWalkable(w: ImgWorld, a: Pt, b: Pt): boolean {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  const n = Math.max(1, Math.ceil(d / (w.cell * 0.5)));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    if (!isWalkPx(w, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false;
  }
  return true;
}

/** Ô đi được gần nhất (vòng tìm tăng dần), trả về tâm ô theo điểm nguồn. */
export function nearestWalkable(w: ImgWorld, p: Pt, maxR = 12): Pt | null {
  const ci = Math.floor(p.x / w.cell);
  const cj = Math.floor(p.y / w.cell);
  for (let r = 0; r <= maxR; r++) {
    let best: Pt | null = null;
    let bd = Infinity;
    for (let j = cj - r; j <= cj + r; j++)
      for (let i = ci - r; i <= ci + r; i++) {
        if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== r) continue;
        if (i < 0 || j < 0 || i >= w.mw || j >= w.mh || !w.walk[j * w.mw + i]) continue;
        const cx = i * w.cell + w.cell / 2;
        const cy = j * w.cell + w.cell / 2;
        const d = (cx - p.x) ** 2 + (cy - p.y) ** 2;
        if (d < bd) {
          bd = d;
          best = { x: cx, y: cy };
        }
      }
    if (best) return best;
  }
  return null;
}

/**
 * Đường đi từ `from` tới `to` (điểm nguồn). Điểm đầu KHÔNG gồm `from`; điểm cuối là `to` (đã kéo về ô đi
 * được gần nhất nếu `to` nằm ngoài). `null` nếu không có đường.
 */
export function findPathPx(w: ImgWorld, from: Pt, to: Pt): Pt[] | null {
  const start = isWalkPx(w, from.x, from.y) ? from : nearestWalkable(w, from, 4);
  const goal = isWalkPx(w, to.x, to.y) ? to : nearestWalkable(w, to, 12);
  if (!start || !goal) return null;
  const field = { w: w.mw, h: w.mh, isBlocked: (x: number, y: number) => w.walk[y * w.mw + x] !== 1 };
  const c0: Tile = { x: Math.floor(start.x / w.cell), y: Math.floor(start.y / w.cell) };
  const c1: Tile = { x: Math.floor(goal.x / w.cell), y: Math.floor(goal.y / w.cell) };
  const cells = findPath(field, c0, c1, { allowBlockedGoal: false });
  if (!cells) return null;
  const pts: Pt[] = cells.map((c) => ({ x: c.x * w.cell + w.cell / 2, y: c.y * w.cell + w.cell / 2 }));
  if (pts.length) pts[pts.length - 1] = { x: goal.x, y: goal.y };
  else pts.push({ x: goal.x, y: goal.y });
  // kéo căng: từ điểm hiện tại nhảy tới điểm xa nhất còn nhìn thấy
  const out: Pt[] = [];
  let cur: Pt = from;
  let i = 0;
  while (i < pts.length) {
    let j = pts.length - 1;
    while (j > i && !lineWalkable(w, cur, pts[j]!)) j--;
    out.push(pts[j]!);
    cur = pts[j]!;
    i = j + 1;
  }
  return out;
}

/** Lập bản đồ ảnh có hợp lệ không (dùng ở test và khi nạp). */
export function isImageMap(map: CityMap): map is CityMap & { image: ImageLayer } {
  return !!map.image;
}
