/**
 * ĐỒ HOẠ PIXEL cho các cảnh thành phố vẽ bằng mã: bút vẽ trên canvas độ phân giải thấp (320×180),
 * toàn số nguyên, không làm mờ. Gồm: hình chữ nhật/đường/đĩa, chữ pixel 3×5, dải màu có rung (dither Bayer),
 * quầng sáng cộng màu và bộ sinh số ngẫu nhiên xác định.
 */
export type G2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export const rng = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const hex = (c: string): [number, number, number] => {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mix = (a: string, b: string, t: number): string => {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const f = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${f(r1, r2)},${f(g1, g2)},${f(b1, b2)})`;
};

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

const FONT: Record<string, string> = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101111011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110',
  '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110',
  '-': '000000111000000', '!': '010010010000010', '.': '000000000000010', ':': '000010000010000', ' ': '000000000000000',
};

export class Gfx {
  constructor(
    public ctx: G2D,
    public w: number,
    public h: number,
  ) {}

  rect(x: number, y: number, w: number, h: number, color: string, a = 1) {
    this.ctx.globalAlpha = a;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  px(x: number, y: number, color: string, a = 1) {
    this.ctx.globalAlpha = a;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  line(x0: number, y0: number, x1: number, y1: number, color: string, a = 1) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let n = 0; n < 2000; n += 1) {
      this.px(x0, y0, color, a);
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
  }
  disc(cx: number, cy: number, r: number, color: string, a = 1) {
    for (let y = -r; y <= r; y += 1) {
      const w = Math.floor(Math.sqrt(r * r - y * y) + 0.5);
      this.rect(cx - w, cy + y, w * 2 + 1, 1, color, a);
    }
  }
  /** Chữ pixel 3×5; trả về bề rộng đã vẽ. */
  text(s: string, x: number, y: number, color: string, a = 1, scale = 1): number {
    let cx = Math.round(x);
    for (const ch of s.toUpperCase()) {
      const g = FONT[ch] ?? FONT[' ']!;
      for (let i = 0; i < 15; i += 1) if (g[i] === '1') this.rect(cx + (i % 3) * scale, y + Math.floor(i / 3) * scale, scale, scale, color, a);
      cx += 4 * scale;
    }
    return cx - Math.round(x) - scale;
  }
  textW(s: string, scale = 1): number {
    return s.length * 4 * scale - scale;
  }
  /** Dải màu dọc có rung Bayer giữa các mức (kiểu pixel-art cổ điển). */
  vgrad(y0: number, y1: number, stops: string[], levels = 10, x0 = 0, x1 = this.w) {
    const cols: string[] = [];
    for (let i = 0; i < levels; i += 1) {
      const t = (i / (levels - 1)) * (stops.length - 1);
      const k = Math.min(stops.length - 2, Math.floor(t));
      cols.push(mix(stops[k]!, stops[k + 1]!, t - k));
    }
    this.ctx.globalAlpha = 1;
    for (let y = y0; y < y1; y += 1) {
      const v = ((y - y0) / Math.max(1, y1 - y0 - 1)) * (levels - 1);
      const b = Math.min(levels - 2, Math.floor(v));
      const f = v - b;
      for (let x = x0; x < x1; x += 1) {
        this.ctx.fillStyle = f > BAYER[(y & 3) * 4 + (x & 3)]! ? cols[b + 1]! : cols[b]!;
        this.ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  /** Quầng sáng CỘNG màu (phải gọi trong lớp động). Vòng đồng tâm theo bậc, nhìn như pixel. */
  glow(cx: number, cy: number, r: number, color: string, power = 1, squash = 1) {
    const prev = this.ctx.globalCompositeOperation;
    this.ctx.globalCompositeOperation = 'lighter';
    this.ctx.fillStyle = color;
    const steps = Math.max(4, Math.min(10, Math.round(r / 3)));
    for (let s = steps; s >= 1; s -= 1) {
      const rr = (r * s) / steps;
      const a = (power * 0.05) / (1 + (steps - s) * 0.2);
      this.ctx.globalAlpha = a;
      for (let y = -rr; y <= rr; y += 1) {
        const w = Math.floor(Math.sqrt(Math.max(0, rr * rr - y * y)) + 0.5);
        this.ctx.fillRect(Math.round(cx - w), Math.round(cy + y * squash), w * 2 + 1, 1);
      }
    }
    this.ctx.globalCompositeOperation = prev;
    this.ctx.globalAlpha = 1;
  }
}
