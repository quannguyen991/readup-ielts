/**
 * TÌM ĐƯỜNG A* trên lưới ô, đi 4 hướng. Dùng chung cho bộ vẽ (chạm để đi, NPC đi
 * lại) và cho test bản đồ (mọi cửa phải tới được từ điểm xuất phát).
 */
import type { Tile } from './types';

export type PathField = {
  w: number;
  h: number;
  /** true = ô bị chặn (không đi vào được). */
  isBlocked: (x: number, y: number) => boolean;
};

/** Nhận lưới `boolean[][]` (true = chặn, theo [y][x]) hoặc `PathField`. */
export type PathInput = PathField | readonly (readonly boolean[])[];

export function toField(input: PathInput): PathField {
  if (!Array.isArray(input)) return input as PathField;
  const grid = input as readonly (readonly boolean[])[];
  return { w: grid[0]?.length ?? 0, h: grid.length, isBlocked: (x, y) => grid[y]?.[x] === true };
}

const DIRS: readonly [number, number][] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export type FindPathOptions = {
  /** Ô đích luôn được phép bước vào dù bị đánh dấu chặn (cửa nằm sát chân toà nhà). Mặc định bật. */
  allowBlockedGoal?: boolean;
  /** Giới hạn số ô duyệt, để một bản đồ hỏng không treo máy. */
  maxVisited?: number;
};

function inside(f: PathField, x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < f.w && y < f.h;
}

/** Đống nhị phân tối giản theo khoá f. */
class MinHeap {
  private items: { key: number; tie: number; node: number }[] = [];
  get size() {
    return this.items.length;
  }
  private less(a: number, b: number) {
    const x = this.items[a]!;
    const y = this.items[b]!;
    return x.key < y.key || (x.key === y.key && x.tie < y.tie);
  }
  push(key: number, tie: number, node: number) {
    this.items.push({ key, tie, node });
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(i, parent)) break;
      [this.items[i], this.items[parent]] = [this.items[parent]!, this.items[i]!];
      i = parent;
    }
  }
  pop(): number | undefined {
    const top = this.items[0];
    if (!top) return undefined;
    const last = this.items.pop()!;
    if (this.items.length) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < this.items.length && this.less(l, m)) m = l;
        if (r < this.items.length && this.less(r, m)) m = r;
        if (m === i) break;
        [this.items[i], this.items[m]] = [this.items[m]!, this.items[i]!];
        i = m;
      }
    }
    return top.node;
  }
}

/**
 * Đường ngắn nhất từ `from` tới `to`, KHÔNG gồm ô xuất phát, GỒM ô đích.
 * `[]` nếu đã đứng ở đích; `null` nếu không có đường (hoặc toạ độ ngoài bản đồ,
 * hoặc ô xuất phát bị chặn).
 * Hoà thì ưu tiên đi thẳng (ít ngoặt) để đường trông tự nhiên.
 */
export function findPath(input: PathInput, from: Tile, to: Tile, opts: FindPathOptions = {}): Tile[] | null {
  const f = toField(input);
  if (!inside(f, from.x, from.y) || !inside(f, to.x, to.y)) return null;
  if (from.x === to.x && from.y === to.y) return [];
  if (f.isBlocked(from.x, from.y)) return null;
  const allowGoal = opts.allowBlockedGoal ?? true;
  const goalBlocked = f.isBlocked(to.x, to.y);
  if (goalBlocked && !allowGoal) return null;

  const idx = (x: number, y: number) => y * f.w + x;
  const total = f.w * f.h;
  const g = new Float64Array(total).fill(Infinity);
  const parent = new Int32Array(total).fill(-1);
  const dirOf = new Int8Array(total).fill(-1);
  const closed = new Uint8Array(total);
  const heap = new MinHeap();
  const h = (x: number, y: number) => Math.abs(x - to.x) + Math.abs(y - to.y);

  const start = idx(from.x, from.y);
  const goal = idx(to.x, to.y);
  g[start] = 0;
  heap.push(h(from.x, from.y), 0, start);
  const limit = opts.maxVisited ?? total;
  let visited = 0;

  while (heap.size) {
    const cur = heap.pop()!;
    if (closed[cur]) continue;
    closed[cur] = 1;
    if (cur === goal) break;
    if (++visited > limit) return null;
    const cx = cur % f.w;
    const cy = (cur / f.w) | 0;
    for (let d = 0; d < 4; d += 1) {
      const nx = cx + DIRS[d]![0];
      const ny = cy + DIRS[d]![1];
      if (!inside(f, nx, ny)) continue;
      const n = idx(nx, ny);
      if (closed[n]) continue;
      if (n !== goal && f.isBlocked(nx, ny)) continue;
      const ng = g[cur]! + 1;
      if (ng < g[n]!) {
        g[n] = ng;
        parent[n] = cur;
        dirOf[n] = d;
        // Phạt nhẹ khi đổi hướng: cùng độ dài thì chọn đường ít ngoặt hơn.
        const turn = dirOf[cur] !== -1 && dirOf[cur] !== d ? 1 : 0;
        heap.push(ng + h(nx, ny), turn, n);
      }
    }
  }
  if (parent[goal] === -1) return null;
  const out: Tile[] = [];
  for (let n = goal; n !== start; n = parent[n]!) out.push({ x: n % f.w, y: (n / f.w) | 0 });
  return out.reverse();
}

/** Mọi ô đi tới được từ `from` (gồm cả `from`). Dùng để kiểm bản đồ. */
export function reachableTiles(input: PathInput, from: Tile): Set<string> {
  const f = toField(input);
  const seen = new Set<string>();
  if (!inside(f, from.x, from.y) || f.isBlocked(from.x, from.y)) return seen;
  const stack: Tile[] = [from];
  seen.add(`${from.x},${from.y}`);
  while (stack.length) {
    const t = stack.pop()!;
    for (const [dx, dy] of DIRS) {
      const nx = t.x + dx;
      const ny = t.y + dy;
      const key = `${nx},${ny}`;
      if (!inside(f, nx, ny) || seen.has(key) || f.isBlocked(nx, ny)) continue;
      seen.add(key);
      stack.push({ x: nx, y: ny });
    }
  }
  return seen;
}

/** Có đường từ `from` tới `to` không (ô đích được phép bị chặn như `findPath`). */
export function hasPath(input: PathInput, from: Tile, to: Tile, opts?: FindPathOptions): boolean {
  return findPath(input, from, to, opts) !== null;
}
