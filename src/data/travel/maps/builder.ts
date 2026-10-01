/**
 * BỘ DỰNG BẢN ĐỒ: viết bản đồ bằng các lệnh tô chữ nhật/đường thẳng/rải ngẫu nhiên có hạt giống,
 * rồi xuất ra ĐÚNG ba lưới ký tự của `CityMap` (ground / objects / roofs). Dữ liệu cuối
 * vẫn là lưới ký tự để soát bằng mắt và test (xem `engine/grid.ts` cho bảng ký tự).
 */
import type { CityId, CityMap, Npc, Poi, Route, Tile, WeatherPlan } from '@/services/travel/types';
import { mulberry32 } from '../sprites/paint';

export class MapBuilder {
  readonly ground: string[][];
  readonly objs: string[][];
  readonly roofs: string[][];

  constructor(
    readonly w: number,
    readonly h: number,
    fill = 'g',
  ) {
    this.ground = Array.from({ length: h }, () => Array<string>(w).fill(fill));
    this.objs = Array.from({ length: h }, () => Array<string>(w).fill('.'));
    this.roofs = Array.from({ length: h }, () => Array<string>(w).fill('.'));
  }

  private inb(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  /** Tô chữ nhật đất. */
  g(x: number, y: number, w: number, h: number, c: string): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (this.inb(x + i, y + j)) this.ground[y + j]![x + i] = c;
    return this;
  }

  /** Đặt vật (một ô) hoặc tô chữ nhật vật. */
  o(x: number, y: number, c: string, w = 1, h = 1): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (this.inb(x + i, y + j)) this.objs[y + j]![x + i] = c;
    return this;
  }

  /** Mái che. */
  r(x: number, y: number, w: number, h: number, c = 'c'): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (this.inb(x + i, y + j)) this.roofs[y + j]![x + i] = c;
    return this;
  }

  /** Đường thẳng đứng/ngang bằng vật (hàng rào, hàng đèn…): từ (x,y) bước (dx,dy) `n` lần, cách `gap`. */
  row(x: number, y: number, dx: number, dy: number, n: number, c: string, gap = 1): this {
    for (let i = 0; i < n; i++) this.o(x + dx * i * gap, y + dy * i * gap, c);
    return this;
  }

  /** Rải ngẫu nhiên vật `c` lên các ô đất trong `on` còn trống ở vùng chữ nhật. */
  scatter(x: number, y: number, w: number, h: number, c: string, density: number, seed: number, on = 'g'): this {
    const rnd = mulberry32(seed);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const xx = x + i;
        const yy = y + j;
        if (!this.inb(xx, yy)) continue;
        if (rnd() >= density) continue;
        if (this.objs[yy]![xx] !== '.' || !on.includes(this.ground[yy]![xx]!)) continue;
        this.objs[yy]![xx] = c;
      }
    return this;
  }

  /** Rải chọn ký tự theo bảng `cs` (đều xác suất). */
  scatterMix(x: number, y: number, w: number, h: number, cs: string, density: number, seed: number, on = 'g'): this {
    const rnd = mulberry32(seed);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const xx = x + i;
        const yy = y + j;
        if (!this.inb(xx, yy)) continue;
        const roll = rnd();
        const pick = cs[Math.floor(rnd() * cs.length)]!;
        if (roll >= density) continue;
        if (this.objs[yy]![xx] !== '.' || !on.includes(this.ground[yy]![xx]!)) continue;
        this.objs[yy]![xx] = pick;
      }
    return this;
  }

  /** Xoá vật trong một chữ nhật (để mở đường). */
  clear(x: number, y: number, w: number, h: number): this {
    return this.o(x, y, '.', w, h);
  }

  build(meta: {
    id: CityId;
    name: { vi: string; en: string };
    utcOffsetHours: number;
    palette: string;
    spawn: Tile;
    pois: Poi[];
    npcs: Npc[];
    routes?: Route[];
    weather?: WeatherPlan;
    sounds?: string[];
  }): CityMap {
    return {
      id: meta.id,
      name: meta.name,
      utcOffsetHours: meta.utcOffsetHours,
      palette: meta.palette,
      size: { w: this.w, h: this.h },
      layers: { ground: this.ground.map((r) => r.join('')), objects: this.objs.map((r) => r.join('')), roofs: this.roofs.map((r) => r.join('')) },
      spawn: meta.spawn,
      pois: meta.pois,
      npcs: meta.npcs,
      routes: meta.routes,
      ambience: { weather: meta.weather ?? { kind: 'clear', intensity: 0 }, sounds: meta.sounds ?? [] },
    };
  }
}

/** Ô đứng vào địa điểm: giữa-đáy mép dưới của `footprint`. */
export function doorOf(f: { x: number; y: number; w: number; h: number }): Tile {
  return { x: f.x + Math.floor(f.w / 2), y: f.y + f.h };
}
