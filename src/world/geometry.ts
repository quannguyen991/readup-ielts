export type Pt = { x: number; y: number };

/** Làm phẳng đường gấp khúc có điểm điều khiển cong (Catmull-Rom nhẹ) thành đa tuyến dày đặc. */
export function flatten(pts: readonly (readonly [number, number])[], curve = false, step = 0.5): Pt[] {
  const p = pts.map(([x, y]) => ({ x, y }));
  if (!curve || p.length < 3) return p;
  const out: Pt[] = [];
  const at = (i: number): Pt => p[Math.max(0, Math.min(p.length - 1, i))]!;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const n = Math.max(2, Math.ceil(len / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(p[p.length - 1]!);
  return out;
}

export type NearestOnPoly = { d: number; side: number; t: number; px: number; py: number; seg: number };

/** Điểm gần nhất trên đa tuyến: khoảng cách, phía (+/-), tham số cung (đơn vị ô), toạ độ hình chiếu. */
export function nearestOnPoly(poly: readonly Pt[], x: number, y: number): NearestOnPoly {
  let best: NearestOnPoly = { d: Infinity, side: 1, t: 0, px: 0, py: 0, seg: 0 };
  let acc = 0;
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i]!, b = poly[i + 1]!;
    const dx = b.x - a.x, dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    const len = Math.sqrt(l2);
    let u = l2 === 0 ? 0 : ((x - a.x) * dx + (y - a.y) * dy) / l2;
    u = Math.max(0, Math.min(1, u));
    const px = a.x + dx * u, py = a.y + dy * u;
    const d = Math.hypot(x - px, y - py);
    if (d < best.d) best = { d, side: dx * (y - a.y) - dy * (x - a.x) >= 0 ? -1 : 1, t: acc + len * u, px, py, seg: i };
    acc += len;
  }
  return best;
}

export function polyLength(poly: readonly Pt[]): number {
  let s = 0;
  for (let i = 0; i < poly.length - 1; i++) s += Math.hypot(poly[i + 1]!.x - poly[i]!.x, poly[i + 1]!.y - poly[i]!.y);
  return s;
}

/** Điểm và hướng tại độ dài cung s. */
export function pointAt(poly: readonly Pt[], s: number): { x: number; y: number; dx: number; dy: number } {
  let acc = 0;
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i]!, b = poly[i + 1]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (acc + len >= s || i === poly.length - 2) {
      const u = len === 0 ? 0 : Math.max(0, Math.min(1, (s - acc) / len));
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, dx: len ? (b.x - a.x) / len : 1, dy: len ? (b.y - a.y) / len : 0 };
    }
    acc += len;
  }
  const a = poly[0]!;
  return { x: a.x, y: a.y, dx: 1, dy: 0 };
}

export function inPolygon(poly: readonly (readonly [number, number])[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!, [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
