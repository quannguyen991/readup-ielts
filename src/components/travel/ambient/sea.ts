/**
 * MẶT NẠ BIỂN của bản đồ thế giới (lưới 418×235): chỗ nào là nước để đặt tàu, cá voi, sóng, bóng mây.
 * Tệp `world-sea.json` do scripts/art/clean_world.py sinh ra, nén theo đoạn liên tiếp mỗi hàng.
 */
export type SeaJson = { w: number; h: number; rows: number[][][] };

export type SeaMask = {
  w: number;
  h: number;
  isSea(x: number, y: number): boolean;
  /** Hình chữ nhật [x, y, w, h] có TOÀN nước không. */
  clear(x: number, y: number, w: number, h: number): boolean;
};

export function decodeSea(j: SeaJson): SeaMask {
  const { w, h } = j;
  const cells = new Uint8Array(w * h);
  j.rows.forEach((runs, y) => {
    for (const [x0, len] of runs) cells.fill(1, y * w + x0!, y * w + x0! + len!);
  });
  const isSea = (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    return ix >= 0 && iy >= 0 && ix < w && iy < h && cells[iy * w + ix] === 1;
  };
  return {
    w,
    h,
    isSea,
    clear(x, y, cw, ch) {
      for (let yy = Math.floor(y); yy < y + ch; yy += 1) for (let xx = Math.floor(x); xx < x + cw; xx += 1) if (!isSea(xx, yy)) return false;
      return true;
    },
  };
}

/** Mặt nạ rỗng (khi chưa tải được tệp): coi toàn bộ là đất, nên không đặt gì lên biển. */
export const NO_SEA: SeaMask = { w: 418, h: 235, isSea: () => false, clear: () => false };

/** Bộ sinh số ngẫu nhiên xác định (mulberry32): cùng hạt giống → cùng cảnh. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
