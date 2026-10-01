/**
 * Ép ảnh về một bảng màu hữu hạn (tuỳ chọn có hoà sắc Bayer) khi nạp ảnh ngoài vào
 * Atlas — để tranh AI/hoạ sĩ lọt vào cùng bảng màu 32 vai như hình vẽ bằng mã. Hàm thuần.
 */
export type RGB = [number, number, number];

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Chỉ số màu gần nhất (khoảng cách có trọng số cảm nhận). */
export function nearest(palette: readonly RGB[], r: number, g: number, b: number): number {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const p = palette[i]!;
    const dr = r - p[0];
    const dg = g - p[1];
    const db = b - p[2];
    const d = 0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best;
}

/** Sửa tại chỗ `data` (RGBA). Điểm gần như trong suốt (alpha < 128) được giữ trong suốt. */
export function quantiseInPlace(data: Uint8ClampedArray, w: number, h: number, palette: readonly RGB[], dither: 'none' | 'bayer' = 'none', strength = 24): void {
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3]! < 128) {
        data[i + 3] = 0;
        continue;
      }
      let r = data[i]!;
      let g = data[i + 1]!;
      let b = data[i + 2]!;
      if (dither === 'bayer') {
        const t = (BAYER4[(y & 3) * 4 + (x & 3)]! / 15 - 0.5) * strength;
        r += t;
        g += t;
        b += t;
      }
      const p = palette[nearest(palette, r, g, b)]!;
      data[i] = p[0];
      data[i + 1] = p[1];
      data[i + 2] = p[2];
      data[i + 3] = 255;
    }
}
