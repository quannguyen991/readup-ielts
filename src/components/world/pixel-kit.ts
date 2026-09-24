/**
 * Đồ nghề vẽ pixel dùng chung cho bản đồ tổng và map trong đảo: màu, số ngẫu
 * nhiên có hạt, chữ số pixel 3×5 (chỉ số — chữ tiếng Việt nằm ở lớp React).
 */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/** Trộn hai màu hex, trả về hex. */
export function mixHex(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  const m = (i: number) => Math.round(x[i]! + (y[i]! - x[i]!) * t);
  return `#${((1 << 24) | (m(0) << 16) | (m(1) << 8) | m(2)).toString(16).slice(1)}`;
}

/** Chữ số pixel 3×5: mỗi số là 5 hàng, mỗi hàng 3 bit. */
const DIGITS: Record<string, number[]> = {
  '0': [7, 5, 5, 5, 7],
  '1': [2, 6, 2, 2, 7],
  '2': [7, 1, 7, 4, 7],
  '3': [7, 1, 7, 1, 7],
  '4': [5, 5, 7, 1, 1],
  '5': [7, 4, 7, 1, 7],
  '6': [7, 4, 7, 5, 7],
  '7': [7, 1, 2, 2, 2],
  '8': [7, 5, 7, 5, 7],
  '9': [7, 5, 7, 1, 7],
};

export function drawNumber(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, color: string) {
  const w = text.length * 4 - 1;
  let x = Math.round(cx - w / 2);
  ctx.fillStyle = color;
  for (const ch of text) {
    const rows = DIGITS[ch];
    if (rows)
      rows.forEach((bits, r) => {
        for (let c = 0; c < 3; c += 1) if (bits & (4 >> c)) ctx.fillRect(x + c, Math.round(y) + r, 1, 1);
      });
    x += 4;
  }
}

/** Hình người chơi 8×14 (tóc, mặt, áo, ba lô, chân bước). */
export function drawHero(ctx: CanvasRenderingContext2D, x: number, groundY: number, facing: number, walking: boolean, time: number) {
  const px = (a: number, b: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(a), Math.round(b), w, h);
  };
  const bob = walking ? Math.round(Math.sin(time * 14)) : 0;
  const y = Math.round(groundY) - 2 + bob;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(Math.round(x) - 4, Math.round(groundY), 8, 2);
  px(x - 3, y - 14, 6, 3, '#3b2a20');
  px(x - 3, y - 11, 6, 4, '#f5c9a0');
  px(x + (facing > 0 ? 1 : -2), y - 10, 1, 1, '#1f1530');
  px(x - 3, y - 7, 6, 5, '#6366f1');
  px(x - (facing > 0 ? 5 : -3), y - 7, 2, 4, '#f59e0b');
  const leg = walking ? Math.floor(time * 10) % 2 : 0;
  px(x - 3, y - 2, 2, 2 + (leg ? 0 : 1), '#1e293b');
  px(x + 1, y - 2, 2, 2 + (leg ? 1 : 0), '#1e293b');
}
