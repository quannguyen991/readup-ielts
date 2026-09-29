/**
 * THÀNH PHỐ MẪU — một đô thị Kỷ 5 dựng sẵn CHỈ ĐỂ XEM: cao ốc đủ 4 kiểu, ga
 * tàu, quảng trường, trường học, khu nhà phố, một tòa đang lên tầng với cần
 * cẩu. Thành phố của người học vẫn bắt đầu từ đất trống; bản mẫu là "đích đến".
 *
 * Dựng bằng ĐÚNG luật của game (`canRoad`, `canPlace`): lưới đường nhựa (qua
 * sông thì thành cầu), trạm điện xây trước rồi mới tới cao ốc, mỗi công trình
 * tìm chỗ hợp lệ gần khu của nó nhất. Thuần + tất định: cùng kết quả mọi lần.
 */
import { catalogItem, isTower } from '@/data/city/catalog';
import { floorsFor, type Site } from './construction';
import { MATERIAL_KINDS, type Materials } from './materials';
import { canPlace, canRoad, footprint, key, type RoadTile, type World } from './placement';
import { generateTerrain, REGIONS_PER_SIDE, type Terrain } from './terrain';

export const SAMPLE_TERRAIN = { kind: 'plains' as const, seed: 20260929 };

export type SampleCity = {
  terrain: Terrain;
  roads: Record<string, RoadTile>;
  sites: Site[];
  regions: number[];
  era: number;
  /** Tòa cao ốc đang xây (để phát hoạt cảnh công nhân + cần cẩu). */
  buildingTowerId: string | null;
};

const INF = Object.fromEntries(MATERIAL_KINDS.map((k) => [k, 1e9])) as Materials;
const STAMP = '2026-09-29T00:00:00.000Z';

/** Khu và danh sách công trình, theo thứ tự xây. Tâm khu tính theo ô. */
type Plan = { type: string; count: number; near: [number, number] };

function plan(size: number): Plan[] {
  const c = size / 2;
  const down: [number, number] = [c, c - 9]; // trung tâm cao ốc (phía bắc sông)
  const civic: [number, number] = [c - 8, c - 6];
  const homes: [number, number] = [c, c + 11]; // khu nhà (phía nam)
  return [
    { type: 'power_station', count: 1, near: [c + 12, c - 14] },
    { type: 'tower_twin', count: 1, near: down },
    { type: 'tower_glass', count: 2, near: down },
    { type: 'tower_observation', count: 1, near: down },
    { type: 'tower_office', count: 2, near: down },
    { type: 'fountain_plaza', count: 1, near: [c - 2, c - 5] },
    { type: 'station', count: 1, near: [c + 10, c - 6] },
    { type: 'academy', count: 1, near: civic },
    { type: 'library', count: 1, near: civic },
    { type: 'hospital', count: 1, near: [c + 10, c + 2] },
    { type: 'school', count: 1, near: homes },
    { type: 'post_office', count: 1, near: civic },
    { type: 'market', count: 1, near: [c - 6, c + 8] },
    { type: 'reading_house', count: 1, near: civic },
    { type: 'vocab_house', count: 1, near: homes },
    { type: 'listen_house', count: 1, near: homes },
    { type: 'townhouse', count: 8, near: [c + 2, c + 6] },
    { type: 'park', count: 3, near: homes },
    { type: 'house_brick', count: 8, near: homes },
    { type: 'house_wood', count: 4, near: [c - 10, c + 12] },
    { type: 'warehouse', count: 1, near: [c + 12, c + 10] },
    { type: 'dock', count: 1, near: [c, c + 5] },
    { type: 'lamp', count: 8, near: down },
  ];
}

let cache: SampleCity | null = null;

export function sampleCity(): SampleCity {
  if (cache) return cache;
  const terrain = generateTerrain(SAMPLE_TERRAIN.kind, SAMPLE_TERRAIN.seed);
  const n = terrain.size;
  const regions = Array.from({ length: REGIONS_PER_SIDE * REGIONS_PER_SIDE }, (_, i) => i);
  const roads: Record<string, RoadTile> = {};
  const sites: Site[] = [];
  const world = (): World => ({ terrain, works: {}, roads, zones: {}, regions, sites, era: 5 });

  // 1) Lưới đường nhựa (qua nước hẹp thì thành cầu đá).
  const rows = [7, 13, 19, 31, 36];
  const cols = [5, 12, 19, 26, 33];
  const lay = (x: number, y: number) => {
    const r = canRoad(world(), x, y, 'asphalt', INF);
    if (r.ok) roads[key(x, y)] = r.tile;
  };
  for (const y of rows) for (let x = 3; x <= n - 4; x++) lay(x, y);
  for (const x of cols) for (let y = 4; y <= n - 4; y++) lay(x, y);
  // Cầu phải nối được hai bờ: đoạn cầu nào cụt một đầu (sông quá rộng) thì bỏ.
  const isBridge = (x: number, y: number) => (roads[key(x, y)] ?? '').startsWith('bridge');
  const isLand = (x: number, y: number) => !!roads[key(x, y)] && !isBridge(x, y);
  const prune = (line: [number, number][]) => {
    for (let i = 0; i < line.length; i++) {
      if (!isBridge(...line[i]!)) continue;
      let j = i;
      while (j + 1 < line.length && isBridge(...line[j + 1]!)) j++;
      const ok = i > 0 && j + 1 < line.length && isLand(...line[i - 1]!) && isLand(...line[j + 1]!);
      if (!ok) for (let q = i; q <= j; q++) delete roads[key(...line[q]!)];
      i = j;
    }
  };
  for (const y of rows) prune(Array.from({ length: n }, (_, x) => [x, y] as [number, number]));
  for (const x of cols) prune(Array.from({ length: n }, (_, y) => [x, y] as [number, number]));

  // 2) Công trình: mỗi cái vào chỗ hợp lệ gần tâm khu nhất.
  let id = 0;
  for (const p of plan(n)) {
    const item = catalogItem(p.type);
    if (!item) continue;
    for (let k = 0; k < p.count; k++) {
      const [w, d] = footprint(item.size, 0);
      const cand: [number, number, number, number][] = [];
      for (let y = 1; y < n - 1; y++)
        for (let x = 1; x < n - 1; x++) cand.push([x, y, 0, Math.hypot(x + w / 2 - p.near[0], y + d / 2 - p.near[1])]);
      cand.sort((a, b) => a[3] - b[3]);
      let placed = false;
      for (const [x, y] of cand) {
        for (const rot of [2, 1, 3, 0] as const) {
          if (!canPlace(world(), p.type, x, y, rot).ok) continue;
          const seed = 7001 + id * 131;
          const site: Site = {
            id: `mau-${id++}`,
            type: p.type,
            seed,
            x,
            y,
            rot,
            stageIdx: item.stages.length,
            shifts: 0,
            delivered: true,
            startedAt: STAMP,
            crew: null,
            createdAt: STAMP,
          };
          if (isTower(item)) {
            site.floors = floorsFor(item, seed);
            site.floor = site.floors;
            site.floorStep = 0;
            site.craneUp = false;
          }
          sites.push(site);
          placed = true;
          break;
        }
        if (placed) break;
      }
    }
  }

  // 3) Một tòa kính đang lên tầng (cần cẩu, công nhân) và một nhà gạch đang xây tường.
  let buildingTowerId: string | null = null;
  const tower = sites.find((s) => s.type === 'tower_glass');
  if (tower) {
    const it = catalogItem(tower.type)!;
    tower.stageIdx = it.stages.indexOf(4);
    tower.craneUp = true;
    tower.floor = Math.floor((tower.floors ?? 12) * 0.55);
    tower.floorStep = 1;
    tower.crew = 'tower';
    buildingTowerId = tower.id;
  }
  const house = sites.filter((s) => s.type === 'house_brick')[3];
  if (house) {
    house.stageIdx = catalogItem(house.type)!.stages.indexOf(5);
    house.shifts = 2;
    house.crew = 'builder';
  }

  cache = { terrain, roads, sites, regions, era: 5, buildingTowerId };
  return cache;
}

/** Số liệu nhanh để hiện trên nhãn. */
export function sampleStats(c: SampleCity): { towers: number; buildings: number } {
  return { towers: c.sites.filter((s) => isTower(catalogItem(s.type))).length, buildings: c.sites.length };
}

