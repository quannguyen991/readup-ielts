import type { World } from './raster';

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

/** BFS 4 hướng trên lưới đi bộ; trả về mảng ô tới được (1) từ (sx, sy). */
export function reachFrom(world: World, sx: number, sy: number): Uint8Array {
  const seen = new Uint8Array(world.W * world.H);
  if (!world.isWalk(sx, sy)) return seen;
  const q = [sy * world.W + sx];
  seen[q[0]!] = 1;
  for (let h = 0; h < q.length; h++) {
    const c = q[h]!;
    const x = c % world.W;
    const y = (c / world.W) | 0;
    for (const [dx, dy] of N4) {
      const nx = x + dx;
      const ny = y + dy;
      if (!world.isWalk(nx, ny)) continue;
      const n = ny * world.W + nx;
      if (seen[n]) continue;
      seen[n] = 1;
      q.push(n);
    }
  }
  return seen;
}

/** A* 4 hướng; trả về danh sách ô hoặc null. */
export function findPath(world: World, a: [number, number], b: [number, number]): [number, number][] | null {
  if (!world.isWalk(a[0], a[1]) || !world.isWalk(b[0], b[1])) return null;
  const W = world.W;
  const start = a[1] * W + a[0];
  const goal = b[1] * W + b[0];
  const g = new Map<number, number>([[start, 0]]);
  const from = new Map<number, number>();
  const open: [number, number][] = [[Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]), start]];
  while (open.length) {
    open.sort((p, q) => p[0] - q[0]);
    const [, c] = open.shift()!;
    if (c === goal) {
      const path: [number, number][] = [];
      let cur: number | undefined = c;
      while (cur !== undefined) {
        path.push([cur % W, (cur / W) | 0]);
        cur = from.get(cur);
      }
      return path.reverse();
    }
    const x = c % W;
    const y = (c / W) | 0;
    for (const [dx, dy] of N4) {
      const nx = x + dx;
      const ny = y + dy;
      if (!world.isWalk(nx, ny)) continue;
      const n = ny * W + nx;
      const ng = g.get(c)! + 1;
      if (ng < (g.get(n) ?? Infinity)) {
        g.set(n, ng);
        from.set(n, c);
        open.push([ng + Math.abs(nx - b[0]) + Math.abs(ny - b[1]), n]);
      }
    }
  }
  return null;
}

/** Thành phần liên thông đi được: trả về nhãn mỗi ô (0 = không đi được) và kích thước từng nhãn. */
export function components(world: World): { label: Int32Array; sizes: Map<number, number>; first: Map<number, number> } {
  const label = new Int32Array(world.W * world.H);
  const sizes = new Map<number, number>();
  const first = new Map<number, number>();
  let next = 0;
  for (let i = 0; i < label.length; i++) {
    if (label[i] || !world.isWalk(i % world.W, (i / world.W) | 0)) continue;
    next++;
    const q = [i];
    label[i] = next;
    first.set(next, i);
    for (let h = 0; h < q.length; h++) {
      const c = q[h]!;
      const x = c % world.W;
      const y = (c / world.W) | 0;
      for (const [dx, dy] of N4) {
        const nx = x + dx;
        const ny = y + dy;
        if (!world.isWalk(nx, ny)) continue;
        const n = ny * world.W + nx;
        if (label[n]) continue;
        label[n] = next;
        q.push(n);
      }
    }
    sizes.set(next, q.length);
  }
  return { label, sizes, first };
}
