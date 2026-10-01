/**
 * BẢN ĐỒ TRUNG TÂM TƯƠNG LAI — khu phố chung dựng sẵn, cùng cách với
 * `sample-city.ts`: đúng luật của game (`canRoad`, `canPlace`), thuần + tất
 * định. Năm cao ốc cộng đồng quây quanh quảng trường; tiến độ thật của từng
 * tháp (`hub.ts → hubProgress`) được áp vào lúc vẽ (`hubSites`).
 *
 * Địa hình vẫn là lưới cao độ mịn của `generateTerrain` (không khối vuông).
 */
import { catalogItem, isTower } from '@/data/city/catalog';
import { floorsFor, type Site } from './construction';
import { HUB_TOWERS, type HubProgress, type HubTower } from './hub';
import { MATERIAL_KINDS, type Materials } from './materials';
import { canPlace, canRoad, footprint, key, type RoadTile, type World } from './placement';
import { generateTerrain, REGIONS_PER_SIDE, type Terrain } from './terrain';

export const HUB_TERRAIN = { kind: 'plains' as const, seed: 20261001 };

export type HubLayout = {
  terrain: Terrain;
  roads: Record<string, RoadTile>;
  regions: number[];
  /** Công trình trang trí (đã xong). */
  decor: Site[];
  /** Chỗ của năm tháp, cùng thứ tự `HUB_TOWERS`. */
  towers: Site[];
};

const INF = Object.fromEntries(MATERIAL_KINDS.map((k) => [k, 1e9])) as Materials;
const STAMP = '2026-10-01T00:00:00.000Z';

/** Seed ≥ `base` cho ra đúng `floors` tầng với loại cao ốc này (xem `floorsFor`). */
export function seedForFloors(type: string, floors: number, base: number): number {
  const it = catalogItem(type);
  if (!it?.floors) return base;
  const [lo, hi] = it.floors;
  const range = hi - lo + 1;
  const want = Math.max(0, Math.min(range - 1, floors - lo));
  return base + ((want - (base % range)) + range) % range;
}

let cache: HubLayout | null = null;

export function hubLayout(towers: readonly HubTower[] = HUB_TOWERS): HubLayout {
  if (cache && towers === HUB_TOWERS) return cache;
  const terrain = generateTerrain(HUB_TERRAIN.kind, HUB_TERRAIN.seed);
  const n = terrain.size;
  const c = n / 2;
  const regions = Array.from({ length: REGIONS_PER_SIDE * REGIONS_PER_SIDE }, (_, i) => i);
  const roads: Record<string, RoadTile> = {};
  const sites: Site[] = [];
  const world = (): World => ({ terrain, works: {}, roads, zones: {}, regions, sites, era: 5 });

  // Địa hình đồng bằng seed 20261001: sông chảy ngang phía nam (hàng ≥ 22). Khu
  // trung tâm nằm gọn ở bờ bắc: ba hàng đường ngang, năm trục dọc, ô phố 6×5.
  const rows = [4, 10, 16];
  const cols = [5, 12, 19, 26, 33];
  const lay = (x: number, y: number) => {
    const r = canRoad(world(), x, y, 'asphalt', INF);
    if (r.ok) roads[key(x, y)] = r.tile;
  };
  for (const y of rows) for (let x = 3; x <= 36; x++) lay(x, y);
  for (const x of cols) for (let y = 3; y <= 21; y++) lay(x, y);

  let id = 0;
  const place = (type: string, near: [number, number], seed?: number): Site | null => {
    const item = catalogItem(type);
    if (!item) return null;
    const [w, d] = footprint(item.size, 0);
    const cand: [number, number, number][] = [];
    for (let y = 1; y < n - 1; y++) for (let x = 1; x < n - 1; x++) cand.push([x, y, Math.hypot(x + w / 2 - near[0], y + d / 2 - near[1])]);
    cand.sort((a, b) => a[2] - b[2]);
    for (const [x, y] of cand) {
      for (const rot of [2, 1, 3, 0] as const) {
        if (!canPlace(world(), type, x, y, rot).ok) continue;
        const s = seed ?? 9001 + id * 131;
        const site: Site = { id: `hub-${id++}`, type, seed: s, x, y, rot, stageIdx: item.stages.length, shifts: 0, delivered: true, startedAt: STAMP, crew: null, createdAt: STAMP };
        if (isTower(item)) {
          site.floors = floorsFor(item, s);
          site.floor = site.floors;
          site.floorStep = 0;
          site.craneUp = false;
        }
        sites.push(site);
        return site;
      }
    }
    return null;
  };

  place('power_station', [37, 7]);
  // Năm tháp quây quanh quảng trường giữa: hai tháp đầu ở hàng trên, giữa khu.
  const spots: [number, number][] = [
    [16, 7.5],
    [23, 7.5],
    [9, 13],
    [30, 13],
    [30, 7.5],
  ];
  const towerSites: Site[] = [];
  towers.forEach((t, i) => {
    const s = place(t.type, spots[i] ?? [c, c], seedForFloors(t.type, t.floors, 7001 + i * 977));
    if (s) towerSites.push({ ...s, id: `hub-tower-${t.id}` });
  });
  // Tháp giữ mã riêng (để nhãn tên bám đúng tháp); thay lại trong danh sách.
  for (const t of towerSites) {
    const i = sites.findIndex((s) => s.x === t.x && s.y === t.y && s.type === t.type);
    if (i >= 0) sites[i] = t;
  }
  place('fountain_plaza', [19.5, 13.5]);
  place('library', [9, 7.5]);
  place('station', [30, 19]);
  for (const near of [[9, 19], [16, 19], [23, 19]] as [number, number][]) place('park', near);
  for (let i = 0; i < 8; i++) place('lamp', [15 + (i % 4) * 3, i < 4 ? 11.5 : 15.5]);

  const layout: HubLayout = { terrain, roads, regions, decor: sites.filter((s) => !s.id.startsWith('hub-tower-')), towers: towerSites };
  if (towers === HUB_TOWERS) cache = layout;
  return layout;
}

/**
 * Công trình để vẽ với tiến độ thật: tháp xong → nguyên tòa; tháp đang xây →
 * cần cẩu + đúng số tầng đã xong (bước tầng theo phần vật liệu tầng đang có);
 * tháp chưa tới lượt → mới cắm mốc khảo sát.
 */
export function hubSites(layout: HubLayout, progress: HubProgress): Site[] {
  const towers = layout.towers.map((site, i) => {
    const p = progress.towers[i];
    const item = catalogItem(site.type)!;
    if (!p || p.done) return { ...site, floor: site.floors, stageIdx: item.stages.length, craneUp: false };
    if (!p.active && p.floorsBuilt === 0) return { ...site, stageIdx: 0, floor: 0, floorStep: 0, craneUp: false, delivered: true };
    const step = Math.max(0, Math.min(3, Math.floor((p.floor?.fraction ?? 0) * 4)));
    return { ...site, stageIdx: item.stages.indexOf(4), craneUp: true, floor: p.floorsBuilt, floorStep: step, delivered: true, crew: 'tower' as const };
  });
  return [...layout.decor, ...towers];
}
