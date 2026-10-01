/**
 * BÚT VẼ PIXEL: dựng lưới ký tự (palette-indexed) bằng mã. Mỗi ký tự là một VAI
 * MÀU của bảng màu thành phố (xem `data/travel/palettes.ts`), `.` là trong suốt.
 * Cùng một hình vẽ tự đổi màu theo thành phố — không có hex nào trong hình.
 *
 * Hàm thuần, có hạt giống → cùng đầu vào luôn ra cùng hình (có test).
 */
export type Grid = string[];

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Băm hai số nguyên (+hạt) → số nguyên không dấu, dùng chọn biến thể ô theo vị trí. */
export function hash2(x: number, y: number, seed = 0): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

export class Paint {
  readonly cells: string[][];
  constructor(
    readonly w: number,
    readonly h: number,
    fill = '.',
  ) {
    this.cells = Array.from({ length: h }, () => Array<string>(w).fill(fill));
  }
  get(x: number, y: number): string {
    return this.cells[y]?.[x] ?? '.';
  }
  px(x: number, y: number, c: string): this {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.cells[y]![x] = c;
    return this;
  }
  /** Chỉ vẽ lên điểm đang trong suốt. */
  under(x: number, y: number, c: string): this {
    if (this.get(x, y) === '.') this.px(x, y, c);
    return this;
  }
  rect(x: number, y: number, w: number, h: number, c: string): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
    return this;
  }
  frame(x: number, y: number, w: number, h: number, c: string): this {
    this.rect(x, y, w, 1, c).rect(x, y + h - 1, w, 1, c).rect(x, y, 1, h, c).rect(x + w - 1, y, 1, h, c);
    return this;
  }
  hline(x: number, y: number, n: number, c: string): this {
    return this.rect(x, y, n, 1, c);
  }
  vline(x: number, y: number, n: number, c: string): this {
    return this.rect(x, y, 1, n, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string): this {
    let dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    let dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
    dx = 0;
    return this;
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: string): this {
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + 0.25) + (y * y) / (ry * ry + 0.25) <= 1) this.px(cx + x, cy + y, c);
    return this;
  }
  /** Dán lưới khác (bỏ qua `.`). */
  stamp(g: Grid | Paint, x: number, y: number): this {
    const rows = g instanceof Paint ? g.toRows() : g;
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) if (row[i] !== '.') this.px(x + i, y + j, row[i]!);
    });
    return this;
  }
  /** Viền 1 điểm quanh phần đã vẽ (4 hướng), chỉ lấp điểm trong suốt. Cho `skip` là vai màu không cần viền (bóng). */
  outline(c = 'o'): this {
    const add: [number, number][] = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.cells[y]![x] !== '.') continue;
        if (this.get(x - 1, y) !== '.' || this.get(x + 1, y) !== '.' || this.get(x, y - 1) !== '.' || this.get(x, y + 1) !== '.') add.push([x, y]);
      }
    for (const [x, y] of add) this.cells[y]![x] = c;
    return this;
  }
  replace(map: Record<string, string>): this {
    for (const row of this.cells) for (let i = 0; i < row.length; i++) row[i] = map[row[i]!] ?? row[i]!;
    return this;
  }
  flipH(): Paint {
    const p = new Paint(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) p.cells[y]![x] = this.cells[y]![this.w - 1 - x]!;
    return p;
  }
  clone(): Paint {
    const p = new Paint(this.w, this.h);
    for (let y = 0; y < this.h; y++) p.cells[y] = [...this.cells[y]!];
    return p;
  }
  toRows(): Grid {
    return this.cells.map((r) => r.join(''));
  }
}

/** Đổi lưới ASCII thành Paint (cho sprite viết tay). */
export function fromRows(rows: Grid): Paint {
  const w = Math.max(...rows.map((r) => r.length));
  const p = new Paint(w, rows.length);
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) p.cells[y]![x] = r[x]!;
  });
  return p;
}
