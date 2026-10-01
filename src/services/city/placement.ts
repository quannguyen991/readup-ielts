/**
 * LUẬT ĐẶT CÔNG TRÌNH, ĐƯỜNG, XỬ LÝ ĐẤT VÀ MỞ VÙNG — thuần, có test.
 *
 * Mục tiêu: dễ hiểu. Mỗi lần không đặt được, trả MỘT lý do cụ thể (`reason`)
 * để giao diện nói thẳng "vì sao", thay vì bắt người học đoán luật đô thị.
 *
 * Toạ độ: (x, y) là góc nhỏ nhất của khu đất; công trình chiếm `size` ô, xoay
 * theo bậc 90° (xoay 1 và 3 đổi rộng ↔ sâu). Cổng ở mặt trước: xoay 0 nhìn +y,
 * xoay 1 nhìn +x, xoay 2 nhìn −y, xoay 3 nhìn −x.
 */
import { BRIDGES, catalogItem, LAND_WORKS, ROADS, type CatalogBuilding, type Era, type RoadKind, type ZoneKind } from '@/data/city/catalog';
import { isDone, type Site } from './construction';
import { hasMaterials, type Materials } from './materials';
import { heightAt, isSteep, isWater, MAP, NEIGHBORS, regionBounds, regionOf, REGIONS_PER_SIDE, tileAt, type LandWork, type Terrain } from './terrain';

export type RoadTile = RoadKind | 'bridge_wood' | 'bridge_stone';

export type World = {
  terrain: Terrain;
  works: Record<string, LandWork>;
  roads: Record<string, RoadTile>;
  zones: Record<string, ZoneKind>;
  regions: readonly number[];
  sites: readonly Site[];
  era: number;
};

export const key = (x: number, y: number) => `${x},${y}`;

export function footprint(size: [number, number], rot: number): [number, number] {
  return rot % 2 === 0 ? [size[0], size[1]] : [size[1], size[0]];
}

export function footprintTiles(x: number, y: number, size: [number, number], rot: number): [number, number][] {
  const [w, d] = footprint(size, rot);
  const out: [number, number][] = [];
  for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

/** Ô cổng: ô ngay trước giữa mặt trước. */
export function entranceTile(x: number, y: number, size: [number, number], rot: number): [number, number] {
  const [w, d] = footprint(size, rot);
  switch (rot % 4) {
    case 0:
      return [x + Math.floor((w - 1) / 2), y + d];
    case 1:
      return [x + w, y + Math.floor((d - 1) / 2)];
    case 2:
      return [x + Math.floor((w - 1) / 2), y - 1];
    default:
      return [x - 1, y + Math.floor((d - 1) / 2)];
  }
}

/** Ô nào đang có công trình (kể cả công trường). */
export function occupancy(sites: readonly Site[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const s of sites) {
    const it = catalogItem(s.type);
    if (!it) continue;
    for (const [tx, ty] of footprintTiles(s.x, s.y, it.size, s.rot)) m.set(key(tx, ty), s.id);
  }
  return m;
}

export function isUnlocked(w: Pick<World, 'regions'>, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < MAP.size && y < MAP.size && w.regions.includes(regionOf(x, y));
}

const ROAD_RANK: Record<RoadTile, number> = { dirt: 1, bridge_wood: 1, stone: 2, bridge_stone: 2, asphalt: 3 };
const NEED_RANK = { none: 0, any: 1, stone: 2, asphalt: 3 } as const;

export type PlaceReason =
  | 'outside'
  | 'locked_region'
  | 'water'
  | 'rock'
  | 'steep'
  | 'uneven'
  | 'occupied'
  | 'road_on_tile'
  | 'sand'
  | 'zone'
  | 'no_road'
  | 'road_kind'
  | 'no_power'
  | 'not_waterfront'
  | 'not_coast_point'
  | 'terrain'
  | 'era'
  | 'max';

export type PlaceCheck = { ok: true; tiles: [number, number][] } | { ok: false; reason: PlaceReason; tiles: [number, number][]; bad: [number, number][]; zone?: ZoneKind };

const SMALL_ON_SAND = (it: CatalogBuilding) => it.size[0] * it.size[1] === 1;

/** `ignoreMax`: bản đồ dựng sẵn của Trung tâm (nhiều đài quan sát hơn mức một thành phố riêng được xây). */
export function canPlace(w: World, type: string, x: number, y: number, rot: number, opts: { ignoreMax?: boolean } = {}): PlaceCheck {
  const it = catalogItem(type);
  const tiles = it ? footprintTiles(x, y, it.size, rot) : [];
  const fail = (reason: PlaceReason, bad: [number, number][] = [], zone?: ZoneKind): PlaceCheck => ({ ok: false, reason, tiles, bad, zone });
  if (!it) return fail('outside');
  if (it.era > (w.era as Era)) return fail('era');
  if (it.terrains !== 'all' && !it.terrains.includes(w.terrain.kind)) return fail('terrain');
  if (!opts.ignoreMax && it.max !== undefined && w.sites.filter((s) => s.type === type).length >= it.max) return fail('max');

  const occ = occupancy(w.sites);
  const bad = (pred: (x: number, y: number) => boolean) => tiles.filter(([tx, ty]) => pred(tx, ty));

  const outside = bad((tx, ty) => !tileAt(w.terrain, tx, ty));
  if (outside.length) return fail('outside', outside);
  const locked = bad((tx, ty) => !isUnlocked(w, tx, ty));
  if (locked.length) return fail('locked_region', locked);
  const taken = bad((tx, ty) => occ.has(key(tx, ty)));
  if (taken.length) return fail('occupied', taken);
  const roadOn = bad((tx, ty) => !!w.roads[key(tx, ty)]);
  if (roadOn.length) return fail('road_on_tile', roadOn);

  if (it.place.on === 'waterfront') {
    // Bến thuyền: sàn trên mặt nước, cổng quay vào bờ (ô đất liền có đường).
    const dry = bad((tx, ty) => !isWater(tileAt(w.terrain, tx, ty)));
    if (dry.length) return fail('not_waterfront', dry);
    const [ex, ey] = entranceTile(x, y, it.size, rot);
    const gate = tileAt(w.terrain, ex, ey);
    if (!gate || isWater(gate)) return fail('not_waterfront', [[ex, ey]]);
  } else {
    const wet = bad((tx, ty) => isWater(tileAt(w.terrain, tx, ty)));
    if (wet.length) return fail('water', wet);
    if (it.place.on !== 'coast_point') {
      const rocky = bad((tx, ty) => tileAt(w.terrain, tx, ty)!.kind === 'rock');
      if (rocky.length) return fail('rock', rocky);
    }
    const steep = bad((tx, ty) => isSteep(w.terrain, w.works, tx, ty));
    if (steep.length) return fail('steep', steep);
    const h0 = heightAt(w.terrain, w.works, x, y);
    const uneven = bad((tx, ty) => heightAt(w.terrain, w.works, tx, ty) !== h0);
    if (uneven.length) return fail('uneven', uneven);
    // Cát: công trình lớn cần gia cố nền; cao ốc và công trình "noSand" cần nền đất liền hoặc đã gia cố.
    const sandy = bad((tx, ty) => tileAt(w.terrain, tx, ty)!.kind === 'sand' && w.works[key(tx, ty)] !== 'reinforce');
    if (sandy.length && (it.place.noSand || !SMALL_ON_SAND(it)) && it.place.on !== 'coast_point') return fail('sand', sandy);
    if (it.place.on === 'coast_point') {
      // Hải đăng: ở rìa bờ hoặc mũi đất — nhiều ô nước trong bán kính 3.
      let water = 0;
      for (let dy = -3; dy <= 3 + it.size[1]; dy++) {
        for (let dx = -3; dx <= 3 + it.size[0]; dx++) if (isWater(tileAt(w.terrain, x + dx, y + dy))) water++;
      }
      if (water < 14) return fail('not_coast_point', tiles);
    }
  }

  // Phân khu: ô đã khoanh vùng phải đúng loại.
  const zoned = tiles.filter(([tx, ty]) => w.zones[key(tx, ty)] && w.zones[key(tx, ty)] !== it.zone);
  if (zoned.length) return fail('zone', zoned, w.zones[key(zoned[0]![0], zoned[0]![1])]);

  // Cổng nối đường.
  const need = NEED_RANK[it.place.road];
  if (need > 0) {
    const [ex, ey] = entranceTile(x, y, it.size, rot);
    const road = w.roads[key(ex, ey)];
    if (!road) return fail('no_road', [[ex, ey]]);
    if (ROAD_RANK[road] < need) return fail('road_kind', [[ex, ey]]);
  }
  if (it.place.power && !w.sites.some((s) => s.type === 'power_station' && isDone(s))) return fail('no_power');
  return { ok: true, tiles };
}

// ------------------------------------------------------------------ đường & cầu

export type RoadCheck = { ok: true; tile: RoadTile; cost: Partial<Materials> } | { ok: false; reason: PlaceReason | 'materials' };

/** Số ô nước liên tiếp theo một trục (để giới hạn chiều dài cầu). */
function waterRun(w: World, x: number, y: number): number {
  let best = 0;
  for (const [dx, dy] of [
    [1, 0],
    [0, 1],
  ] as const) {
    let n = 1;
    for (const s of [1, -1]) {
      let k = 1;
      while (isWater(tileAt(w.terrain, x + dx * k * s, y + dy * k * s)) && k < 20) {
        n++;
        k++;
      }
    }
    best = Math.max(best, n);
  }
  return best;
}

export function canRoad(w: World, x: number, y: number, kind: RoadKind, inventory: Materials): RoadCheck {
  const tile = tileAt(w.terrain, x, y);
  if (!tile) return { ok: false, reason: 'outside' };
  if (!isUnlocked(w, x, y)) return { ok: false, reason: 'locked_region' };
  if (occupancy(w.sites).has(key(x, y))) return { ok: false, reason: 'occupied' };
  if (ROADS[kind].era > (w.era as Era)) return { ok: false, reason: 'era' };
  if (tile.kind === 'rock') return { ok: false, reason: 'rock' };
  let place: RoadTile = kind;
  let cost: Partial<Materials> = ROADS[kind].cost;
  if (isWater(tile)) {
    // Cầu: gỗ từ Kỷ 2, đá từ Kỷ 4; phải bắc từ bờ hoặc nối cầu có sẵn; khe hẹp.
    const bridge = w.era >= BRIDGES.stone.era && kind !== 'dirt' ? 'stone' : 'wood';
    if (w.era < BRIDGES.wood.era) return { ok: false, reason: 'era' };
    const touches = NEIGHBORS.some(([dx, dy]) => {
      const n = tileAt(w.terrain, x + dx, y + dy);
      return (!!n && !isWater(n)) || !!w.roads[key(x + dx, y + dy)];
    });
    if (!touches || waterRun(w, x, y) > 7) return { ok: false, reason: 'water' };
    place = bridge === 'stone' ? 'bridge_stone' : 'bridge_wood';
    cost = BRIDGES[bridge].cost;
  } else if (isSteep(w.terrain, w.works, x, y)) {
    return { ok: false, reason: 'steep' };
  }
  const cur = w.roads[key(x, y)];
  if (cur === place) return { ok: false, reason: 'road_on_tile' };
  if (!hasMaterials(inventory, cost)) return { ok: false, reason: 'materials' };
  return { ok: true, tile: place, cost };
}

/** Hình dạng đường tự nối: bit N/E/S/W có đường kề. */
export type RoadShape = { n: boolean; e: boolean; s: boolean; w: boolean; kind: 'end' | 'straight' | 'corner' | 'tee' | 'cross' | 'single' };

export function roadShape(roads: Record<string, RoadTile>, x: number, y: number): RoadShape {
  const n = !!roads[key(x, y - 1)];
  const s = !!roads[key(x, y + 1)];
  const e = !!roads[key(x + 1, y)];
  const w = !!roads[key(x - 1, y)];
  const count = [n, e, s, w].filter(Boolean).length;
  const kind = count === 0 ? 'single' : count === 1 ? 'end' : count === 2 ? ((n && s) || (e && w) ? 'straight' : 'corner') : count === 3 ? 'tee' : 'cross';
  return { n, e, s, w, kind };
}

// ------------------------------------------------------------------ xử lý đất

export type WorkCheck = { ok: true; cost: Partial<Materials> } | { ok: false; reason: 'outside' | 'locked_region' | 'not_needed' | 'water' | 'era' | 'materials' | 'occupied' };

export function canLandWork(w: World, x: number, y: number, work: LandWork, inventory: Materials): WorkCheck {
  const tile = tileAt(w.terrain, x, y);
  if (!tile) return { ok: false, reason: 'outside' };
  if (!isUnlocked(w, x, y)) return { ok: false, reason: 'locked_region' };
  if (isWater(tile)) return { ok: false, reason: 'water' };
  if (occupancy(w.sites).has(key(x, y))) return { ok: false, reason: 'occupied' };
  if (LAND_WORKS[work].era > w.era) return { ok: false, reason: 'era' };
  if (w.works[key(x, y)]) return { ok: false, reason: 'not_needed' };
  if (work === 'terrace' && !isSteep(w.terrain, w.works, x, y) && tile.kind !== 'rock') return { ok: false, reason: 'not_needed' };
  if (work === 'reinforce' && tile.kind !== 'sand') return { ok: false, reason: 'not_needed' };
  const cost = LAND_WORKS[work].cost;
  if (!hasMaterials(inventory, cost)) return { ok: false, reason: 'materials' };
  return { ok: true, cost };
}

// ------------------------------------------------------------------ mở vùng đất

export const REGION = {
  /** Chi phí mở một vùng; nhân theo số vùng đã mở thêm. */
  cost: { wood: 16, stone: 12 } as Partial<Materials>,
} as const;

export type RegionCheck = { ok: true; cost: Partial<Materials> } | { ok: false; reason: 'open' | 'not_adjacent' | 'era' | 'no_road' | 'materials' };

/** Kỷ cần để mở vùng: vùng cạnh (không phải góc) từ Kỷ 2, vùng góc từ Kỷ 3. */
export function regionEra(id: number): number {
  const rx = id % REGIONS_PER_SIDE;
  const ry = Math.floor(id / REGIONS_PER_SIDE);
  const corner = (rx === 0 || rx === REGIONS_PER_SIDE - 1) && (ry === 0 || ry === REGIONS_PER_SIDE - 1);
  return corner ? 3 : 2;
}

export function regionCost(extraOpened: number): Partial<Materials> {
  const f = 1 + extraOpened * 0.5;
  return { wood: Math.round((REGION.cost.wood ?? 0) * f), stone: Math.round((REGION.cost.stone ?? 0) * f) };
}

export function canUnlockRegion(w: World, id: number, inventory: Materials, startCount: number): RegionCheck {
  if (w.regions.includes(id)) return { ok: false, reason: 'open' };
  const rx = id % REGIONS_PER_SIDE;
  const ry = Math.floor(id / REGIONS_PER_SIDE);
  const adjacent = w.regions.some((r) => {
    const ax = r % REGIONS_PER_SIDE;
    const ay = Math.floor(r / REGIONS_PER_SIDE);
    return Math.abs(ax - rx) + Math.abs(ay - ry) === 1;
  });
  if (!adjacent) return { ok: false, reason: 'not_adjacent' };
  if (w.era < regionEra(id)) return { ok: false, reason: 'era' };
  // Hạ tầng: phải có đường chạm tới mép vùng.
  const b = regionBounds(id);
  let reach = false;
  for (let y = b.y0 - 1; y <= b.y1 + 1 && !reach; y++) {
    for (let x = b.x0 - 1; x <= b.x1 + 1 && !reach; x++) {
      const inside = x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;
      if (!inside && w.roads[key(x, y)] && isUnlocked(w, x, y)) reach = true;
    }
  }
  if (!reach) return { ok: false, reason: 'no_road' };
  const cost = regionCost(w.regions.length - startCount);
  if (!hasMaterials(inventory, cost)) return { ok: false, reason: 'materials' };
  return { ok: true, cost };
}
