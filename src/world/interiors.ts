import { hash2 } from './rng';

/** Nội thất: bản đồ riêng nhỏ, nối với thế giới ngoài trời bằng portal (xem types.Portal). */
export const I = { FLOOR: 0, WALL: 1, COUNTER: 2, TABLE: 3, RUG: 4, PLANT: 5, DOOR: 6, SHELF: 7 } as const;

export type InteriorMap = {
  id: string;
  name: string;
  w: number;
  h: number;
  tiles: Uint8Array;
  /** Ô cửa (portal ra ngoài), nằm ở hàng đáy. */
  door: [number, number];
  spawn: [number, number];
};

export const interiorWalk = (m: InteriorMap, x: number, y: number): boolean => {
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return false;
  const t = m.tiles[y * m.w + x]!;
  return t === I.FLOOR || t === I.RUG || t === I.DOOR;
};

export function buildCafe(id: string, name: string, seed = 1): InteriorMap {
  const w = 18;
  const h = 12;
  const tiles = new Uint8Array(w * h);
  const set = (x: number, y: number, v: number) => {
    if (x >= 0 && y >= 0 && x < w && y < h) tiles[y * w + x] = v;
  };
  for (let x = 0; x < w; x++) { set(x, 0, I.WALL); set(x, 1, I.WALL); }
  for (let y = 0; y < h; y++) { set(0, y, I.WALL); set(w - 1, y, I.WALL); }
  for (let x = 0; x < w; x++) set(x, h - 1, I.WALL);
  const door: [number, number] = [Math.floor(w / 2), h - 1];
  set(door[0], door[1], I.DOOR);
  for (let x = 2; x < 9; x++) set(x, 3, I.COUNTER);
  for (let x = 10; x < 16; x++) set(x, 2, I.SHELF);
  for (let x = door[0] - 1; x <= door[0] + 1; x++) for (let y = h - 3; y < h - 1; y++) set(x, y, I.RUG);
  for (const [tx, ty] of [[3, 6], [7, 6], [11, 6], [14, 8], [3, 9], [11, 9]] as const) {
    set(tx, ty, I.TABLE);
    if (hash2(tx, ty, seed) < 0.5) set(tx + 1, ty, I.FLOOR);
  }
  set(1, 2, I.PLANT); set(w - 2, 2, I.PLANT); set(1, h - 2, I.PLANT); set(w - 2, h - 2, I.PLANT);
  return { id, name, w, h, tiles, door, spawn: [door[0], door[1] - 1] };
}
