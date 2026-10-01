/**
 * THẾ GIỚI Ô: đọc `CityMap` (lưới ký tự) thành dữ liệu để vẽ và đi lại. KHÔNG dùng DOM
 * nên test được bằng Node (xem `maps.test.ts`).
 *
 * Bảng ký tự (mọi bản đồ dùng chung):
 *   ground:  g cỏ · f cỏ hoa · p lát đá · P quảng trường · c đá cuội · s đường đất · S cát
 *            r đường nhựa · h vạch ngang · v vạch dọc · w NƯỚC · F sàn · C thảm · d ván gỗ
 *            t gạch sảnh · l ray
 *   objects: . trống · # nhà · % cửa hiệu · $ khách sạn · * tường vô hình (chặn)
 *            T U cây · N cọ · Y bách · b B bụi · H hàng rào cây · a e i bồn hoa (đi qua được)
 *            L đèn · E ghế · G biển chỉ đường · - | hàng rào · t bàn · P bàn dù · p chậu hoa
 *            n thùng rác · x thùng gỗ · k xe đẩy · s ghế chờ · o chậu cây · I cột đá · O thuyền
 *            J cầu Tháp · Q hộp điện thoại · W cối xay gió · C D F nhà kênh · X tháp Eiffel · V Colosseum · S siêu cây
 *            = tường sảnh (sân bay)
 *   roofs:   c mái che (vẽ đè lên nhân vật) · . trống
 */
import type { CityMap, Poi, Tile, TravelState } from '@/services/travel/types';
import type { PathField } from '@/services/travel/pathfinding';
import { hash2 } from '@/data/travel/sprites/paint';
import type { FacadeKind } from '@/data/travel/sprites/facades';
import type { TileKind } from '@/data/travel/sprites/tiles';

export const TS = 16;

export const GROUND_CHARS: Record<string, { kind: TileKind; variants?: number[]; walk: boolean }> = {
  g: { kind: 'grass', variants: [0, 0, 0, 1, 3, 6, 0, 4], walk: true },
  f: { kind: 'grass', variants: [2, 7, 2], walk: true },
  p: { kind: 'paving', walk: true },
  P: { kind: 'plaza', walk: true },
  c: { kind: 'cobble', walk: true },
  s: { kind: 'path', walk: true },
  S: { kind: 'sand', walk: true },
  r: { kind: 'road', walk: true },
  h: { kind: 'roadh', walk: true },
  v: { kind: 'roadv', walk: true },
  w: { kind: 'water', walk: false },
  F: { kind: 'floor', walk: true },
  C: { kind: 'carpet', walk: true },
  d: { kind: 'wood', walk: true },
  t: { kind: 'tilefloor', walk: true },
  l: { kind: 'rail', walk: true },
};

export type ObjDef = {
  sprite: string;
  /** Số ô chặn quanh chân: rộng × sâu, neo giữa-đáy. 0 = đi xuyên được. */
  block: { w: number; h: number };
  /** Vẽ vào lớp tĩnh (không cần xếp theo y). */
  flat?: boolean;
  light?: { r: number; warm: number };
  /** Cảnh ven đường: không xét nước. */
  onWater?: boolean;
};

const B1 = { w: 1, h: 1 };
const B0 = { w: 0, h: 0 };

export const OBJECT_CHARS: Record<string, ObjDef> = {
  T: { sprite: 'tree_a', block: B1 },
  U: { sprite: 'tree_b', block: B1 },
  N: { sprite: 'palm', block: B1 },
  Y: { sprite: 'cypress', block: B1 },
  b: { sprite: 'bush', block: B1 },
  B: { sprite: 'bush_berry', block: B1 },
  H: { sprite: 'hedge', block: B1 },
  a: { sprite: 'flowers_a', block: B0, flat: true },
  e: { sprite: 'flowers_b', block: B0, flat: true },
  i: { sprite: 'flowers_c', block: B0, flat: true },
  L: { sprite: 'lamp', block: B1, light: { r: 44, warm: 1 } },
  E: { sprite: 'bench', block: B1 },
  G: { sprite: 'signpost', block: B1 },
  '-': { sprite: 'fence_h', block: B1 },
  '|': { sprite: 'fence_v', block: B1 },
  t: { sprite: 'table', block: B1 },
  P: { sprite: 'parasol', block: B1 },
  p: { sprite: 'planter', block: B1 },
  n: { sprite: 'bin', block: B1 },
  x: { sprite: 'crate', block: B1 },
  k: { sprite: 'trolley', block: B1 },
  s: { sprite: 'seats', block: { w: 2, h: 1 } },
  o: { sprite: 'pot', block: B1 },
  I: { sprite: 'pillar', block: B1 },
  O: { sprite: 'boat_small', block: { w: 2, h: 1 }, onWater: true },
  J: { sprite: 'lm_tower_bridge', block: B0, onWater: true },
  Q: { sprite: 'lm_phonebox', block: B1, light: { r: 22, warm: 0 } },
  W: { sprite: 'lm_windmill', block: { w: 2, h: 1 } },
  C: { sprite: 'lm_canal_a', block: { w: 1, h: 1 } },
  D: { sprite: 'lm_canal_b', block: { w: 1, h: 1 } },
  F: { sprite: 'lm_canal_c', block: { w: 1, h: 1 } },
  X: { sprite: 'lm_eiffel', block: { w: 3, h: 2 } },
  V: { sprite: 'lm_colosseum', block: { w: 7, h: 2 } },
  S: { sprite: 'lm_supertree', block: { w: 2, h: 1 } },
};

/** Ký tự đối tượng dựng thành mặt tiền theo khối chữ nhật liền nhau. */
export const BUILDING_CHARS: Record<string, { kind: FacadeKind; text: string }> = {
  '#': { kind: 'house', text: '' },
  '%': { kind: 'shop', text: 'SHOP' },
  $: { kind: 'hotel', text: '' },
  '=': { kind: 'hall', text: '' },
};

export type Placed = {
  /** Mã sprite trong atlas; `fac:` là mặt tiền theo kích thước. */
  sprite: string;
  /** Vị trí GIỮA-ĐÁY, theo pixel nguồn. */
  px: number;
  py: number;
  /** Kích thước ô nếu là mặt tiền. */
  fac?: { w: number; h: number; doorCol: number; variant: number; kind: FacadeKind; text: string };
  flat: boolean;
  poi?: string;
  sortY: number;
  light?: { r: number; warm: number };
  /** Rộng/cao ước lượng để cắt theo khung nhìn. */
  w: number;
  h: number;
  /** Tên sprite chuyển động (cối xay) */
  anim?: boolean;
};

export type PoiRuntime = { poi: Poi; cx: number; cy: number };

export type World = {
  map: CityMap;
  w: number;
  h: number;
  /** 1 = chặn. */
  blocked: Uint8Array;
  ground: string[];
  placed: Placed[];
  /** Ô nước kèm 4 bit cạnh có đất liền: 1=n 2=e 4=s 8=w. */
  shore: { x: number; y: number; mask: number }[];
  water: { x: number; y: number }[];
  puddles: { x: number; y: number; r: number }[];
  covers: Tile[];
  lights: { x: number; y: number; r: number; warm: number; always?: boolean }[];
  pois: Map<string, Poi>;
};

export function char(rows: string[], x: number, y: number): string {
  return rows[y]?.[x] ?? '.';
}

export function isWaterAt(map: CityMap, x: number, y: number): boolean {
  return char(map.layers.ground, x, y) === 'w';
}

/** Hình chữ nhật hoá khối ký tự giống nhau (tham lam: mở rộng sang phải rồi xuống dưới). */
function rects(rows: string[], ch: string, w: number, h: number): { x: number; y: number; w: number; h: number }[] {
  const used = new Uint8Array(w * h);
  const out: { x: number; y: number; w: number; h: number }[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (used[y * w + x] || char(rows, x, y) !== ch) continue;
      let rw = 0;
      while (x + rw < w && char(rows, x + rw, y) === ch && !used[y * w + x + rw]) rw++;
      let rh = 1;
      outer: while (y + rh < h) {
        for (let i = 0; i < rw; i++) if (char(rows, x + i, y + rh) !== ch || used[(y + rh) * w + x + i]) break outer;
        rh++;
      }
      for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) used[(y + j) * w + x + i] = 1;
      out.push({ x, y, w: rw, h: rh });
    }
  return out;
}

export function buildWorld(map: CityMap): World {
  const { w, h } = map.size;
  const blocked = new Uint8Array(w * h);
  const ground = map.layers.ground;
  const placed: Placed[] = [];
  const lights: World['lights'] = [];
  const shore: World['shore'] = [];
  const water: World['water'] = [];
  const puddles: World['puddles'] = [];
  const covers: Tile[] = [];
  const pois = new Map<string, Poi>();

  const setBlock = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < w && y < h) blocked[y * w + x] = 1;
  };

  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const g = char(ground, x, y);
      const def = GROUND_CHARS[g];
      if (!def || !def.walk) {
        setBlock(x, y);
      }
      if (g === 'w') {
        water.push({ x, y });
        let mask = 0;
        if (y > 0 && char(ground, x, y - 1) !== 'w') mask |= 1;
        if (x < w - 1 && char(ground, x + 1, y) !== 'w') mask |= 2;
        if (y < h - 1 && char(ground, x, y + 1) !== 'w') mask |= 4;
        if (x > 0 && char(ground, x - 1, y) !== 'w') mask |= 8;
        if (mask) shore.push({ x, y, mask });
      } else if (def && (def.kind === 'paving' || def.kind === 'plaza' || def.kind === 'cobble' || def.kind === 'road') && hash2(x, y, 77) % 100 < 7) {
        puddles.push({ x, y, r: 3 + (hash2(x, y, 5) % 3) });
      }
      if (char(map.layers.roofs, x, y) === 'c') covers.push({ x, y });
    }

  // Đối tượng một ô + tòa nhà theo khối.
  const objs = map.layers.objects;
  for (const [ch, b] of Object.entries(BUILDING_CHARS)) {
    for (const r of rects(objs, ch, w, h)) {
      for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) setBlock(r.x + i, r.y + j);
      const doorCol = 1 + (hash2(r.x, r.y, 3) % Math.max(1, r.w - 2));
      placed.push({
        sprite: `fac:${b.kind}:${b.text}`,
        px: (r.x + r.w / 2) * TS,
        py: (r.y + r.h) * TS,
        fac: { w: r.w, h: r.h, doorCol: Math.min(r.w - 1, r.w > 2 ? doorCol : 0), variant: hash2(r.x, r.y, 9) % 3, kind: b.kind, text: b.text },
        flat: false,
        sortY: (r.y + r.h) * TS,
        w: r.w * TS,
        h: r.h * TS,
      });
    }
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const ch = char(objs, x, y);
      if (ch === '*') {
        setBlock(x, y);
        continue;
      }
      const d = OBJECT_CHARS[ch];
      if (!d) continue;
      // Khối chặn: neo giữa-đáy, rộng block.w, sâu block.h hướng lên.
      for (let j = 0; j < d.block.h; j++)
        for (let i = 0; i < d.block.w; i++) setBlock(x - Math.floor((d.block.w - 1) / 2) + i, y - j);
      placed.push({
        sprite: d.sprite,
        px: d.block.w > 0 ? (x - Math.floor((d.block.w - 1) / 2) + d.block.w / 2) * TS : x * TS + TS / 2,
        py: (y + 1) * TS,
        flat: !!d.flat,
        sortY: (y + 1) * TS,
        light: d.light,
        w: 32,
        h: 48,
        anim: d.sprite === 'lm_windmill',
      });
      if (d.light) lights.push({ x: x * TS + TS / 2, y: y * TS - 8, r: d.light.r, warm: d.light.warm });
    }

  // Công trình có địa điểm (POI): chiếm `footprint`, hình neo giữa-đáy.
  for (const poi of map.pois) {
    pois.set(poi.id, poi);
    const f = poi.footprint;
    for (let j = 0; j < f.h; j++) for (let i = 0; i < f.w; i++) setBlock(f.x + i, f.y + j);
    const sprite = poi.sprite ?? defaultPoiSprite(poi);
    const isFac = sprite.startsWith('fac:');
    placed.push({
      sprite,
      px: (f.x + f.w / 2) * TS,
      py: (f.y + f.h) * TS,
      fac: isFac
        ? { w: f.w, h: f.h, doorCol: Math.max(0, Math.min(f.w - 1, poi.door.x - f.x)), variant: 0, kind: sprite.split(':')[1] as FacadeKind, text: sprite.split(':').slice(2).join(':') }
        : undefined,
      flat: false,
      poi: poi.id,
      sortY: (f.y + f.h) * TS,
      w: f.w * TS,
      h: f.h * TS,
    });
    lights.push({ x: poi.door.x * TS + TS / 2, y: poi.door.y * TS + 2, r: 30, warm: 1 });
  }

  placed.sort((a, b) => a.sortY - b.sortY || a.px - b.px);
  return { map, w, h, blocked, ground, placed, shore, water, puddles, covers, lights, pois };
}

const DEFAULT_SIGN: Record<string, string> = {
  airport: 'GATE',
  counter: 'INFO',
  cafe: 'CAFE',
  restaurant: 'FOOD',
  hotel: 'HOTEL',
  station: 'MRT',
  market: 'MARKET',
  museum: 'MUSEUM',
  garden: 'GARDEN',
  landmark: '',
  secret: '',
};
const KIND_FACADE: Record<string, FacadeKind> = {
  airport: 'gate',
  counter: 'counter',
  cafe: 'cafe',
  restaurant: 'restaurant',
  hotel: 'hotel',
  station: 'station',
  market: 'market',
  museum: 'museum',
  garden: 'garden',
  landmark: 'house',
  secret: 'house',
};

export function defaultPoiSprite(poi: Poi): string {
  return `fac:${KIND_FACADE[poi.kind] ?? 'house'}:${DEFAULT_SIGN[poi.kind] ?? ''}`;
}

export function isBlockedAt(world: World, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= world.w || y >= world.h) return true;
  return world.blocked[y * world.w + x] === 1;
}

/** Trường đi cho `findPath` (A*). */
export function pathField(world: World): PathField {
  return { w: world.w, h: world.h, isBlocked: (x, y) => isBlockedAt(world, x, y) };
}

/** Địa điểm đang khoá theo tiến độ (so `unlock.after` + `minStars` với `state.poi`). */
export function isPoiLocked(poi: Poi, state: Pick<TravelState, 'poi'>): boolean {
  const u = poi.unlock;
  if (!u) return false;
  if (u.after) {
    const best = state.poi[u.after]?.best ?? 0;
    if (best < Math.max(1, u.minStars ?? 1)) return true;
  }
  return false;
}

/** Ô chân người (tâm ô) → toạ độ pixel giữa-đáy. */
export const tileFoot = (t: Tile): { x: number; y: number } => ({ x: t.x * TS + TS / 2, y: t.y * TS + TS - 2 });
