/**
 * BẢN ĐỒ TRUNG TÂM TƯƠNG LAI — thành phố chính dựng sẵn, cùng cách với
 * `sample-city.ts`: đúng luật của game (`canRoad`, `canPlace`), thuần + tất định.
 *
 * Bố cục kiểu Singapore / New York: lưới đại lộ khít (ô phố 7×6, mỗi ô phố hai
 * hàng cao ốc quay mặt ra hai đại lộ), một ô phố giữa là quảng trường + công
 * viên + ga tàu. MƯỜI cao ốc (`HUB_DOWNTOWN`) đã xong hẳn: không cần cẩu, không
 * cọc khảo sát. Năm tháp cộng đồng (`HUB_TOWERS`) là KHU MỞ RỘNG ở cạnh phía
 * đông: tiến độ thật của từng tháp (`hub.ts → hubProgress`) được áp lúc vẽ
 * (`hubSites`).
 *
 * Địa hình: đồng bằng seed 20261150 — một thềm phẳng rộng, sông chảy ngang ở
 * phía nam; lưới cao độ mịn của `generateTerrain` (không khối vuông).
 */
import { catalogItem, isTower } from '@/data/city/catalog';
import { floorsFor, type Site } from './construction';
import { HUB_DOWNTOWN, HUB_TOWERS, type HubProgress, type HubTower } from './hub';
import { MATERIAL_KINDS, type Materials } from './materials';
import { canPlace, canRoad, key, type RoadTile, type World } from './placement';
import { generateTerrain, REGIONS_PER_SIDE, type Terrain } from './terrain';

export const HUB_TERRAIN = { kind: 'plains' as const, seed: 20261150 };

/** Điểm nhìn mặc định (toạ độ thế giới x, z): giữa thành phố chính + khu mở rộng. */
export const HUB_FOCUS: [number, number] = [-2.2, -14.7];

export type HubLayout = {
  terrain: Terrain;
  roads: Record<string, RoadTile>;
  regions: number[];
  /** Công trình đã xong, không phải cao ốc (quảng trường, ga, công viên, nhà thấp tầng…). */
  decor: Site[];
  /** Mười cao ốc đã xong của thành phố chính, cùng thứ tự `HUB_DOWNTOWN`. */
  downtown: Site[];
  /** Chỗ của năm tháp khu mở rộng, cùng thứ tự `HUB_TOWERS`. */
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

// Lưới đại lộ: đại lộ dọc x = 8, 16, 24, 32 (ô phố rộng 7); đại lộ ngang y = 2, 9, 16 (ô phố sâu 6).
const BLOCK_X = (i: number) => 9 + 8 * i;
const BLOCK_Y = (j: number) => 3 + 7 * j;

/** Vị trí một tòa trong ô phố (i, j): hàng bắc quay ra đại lộ phía bắc, hàng nam quay ra đại lộ phía nam. */
type Slot = { i: number; j: number; row: 'n' | 's'; col: number };
const at = (s: Slot): { x: number; y: number; rot: 0 | 2 } => ({ x: BLOCK_X(s.i) + s.col, y: BLOCK_Y(s.j) + (s.row === 'n' ? 0 : 3), rot: s.row === 'n' ? 2 : 0 });

/** Chỗ của mười cao ốc thành phố chính, cùng thứ tự `HUB_DOWNTOWN`. */
const DOWNTOWN_SLOTS: Slot[] = [
  { i: 1, j: 0, row: 'n', col: 0 }, // Mũi Kim — đài quan sát cao nhất, giữa khu
  { i: 1, j: 0, row: 'n', col: 4 }, // Lăng Kính
  { i: 1, j: 0, row: 's', col: 0 }, // Song Tử (tháp đôi)
  { i: 1, j: 0, row: 's', col: 4 }, // Atlas
  { i: 0, j: 1, row: 'n', col: 0 }, // Bình Minh
  { i: 0, j: 0, row: 'n', col: 0 }, // Cảng Xanh
  { i: 0, j: 1, row: 'n', col: 4 }, // Hải Đăng Phố
  { i: 0, j: 0, row: 's', col: 0 }, // Lan Quý (tháp đôi)
  { i: 0, j: 0, row: 'n', col: 4 }, // Kinh Tuyến
  { i: 0, j: 1, row: 's', col: 0 }, // Đá Hoa
];

/** Chỗ của năm tháp khu mở rộng (cạnh đông), cùng thứ tự `HUB_TOWERS`. */
const EXPANSION_SLOTS: Slot[] = [
  { i: 2, j: 0, row: 'n', col: 0 },
  { i: 2, j: 0, row: 'n', col: 4 },
  { i: 2, j: 0, row: 's', col: 0 },
  { i: 2, j: 0, row: 's', col: 4 },
  { i: 2, j: 1, row: 'n', col: 0 },
];

let cache: HubLayout | null = null;

export function hubLayout(towers: readonly HubTower[] = HUB_TOWERS): HubLayout {
  if (cache && towers === HUB_TOWERS) return cache;
  const terrain = generateTerrain(HUB_TERRAIN.kind, HUB_TERRAIN.seed);
  const regions = Array.from({ length: REGIONS_PER_SIDE * REGIONS_PER_SIDE }, (_, i) => i);
  const roads: Record<string, RoadTile> = {};
  const sites: Site[] = [];
  const world = (): World => ({ terrain, works: {}, roads, zones: {}, regions, sites, era: 5 });

  const lay = (x: number, y: number) => {
    const r = canRoad(world(), x, y, 'asphalt', INF);
    if (r.ok) roads[key(x, y)] = r.tile;
  };
  for (const y of [2, 9, 16]) for (let x = 5; x <= 35; x++) lay(x, y);
  for (const x of [8, 16, 24, 32]) for (let y = 1; y <= 19; y++) lay(x, y);

  let id = 0;
  const put = (type: string, x: number, y: number, rot: 0 | 1 | 2 | 3, seed?: number, siteId?: string): Site | null => {
    const item = catalogItem(type);
    if (!item || !canPlace(world(), type, x, y, rot, { ignoreMax: true }).ok) return null;
    const s = seed ?? 9001 + id * 131;
    const site: Site = { id: siteId ?? `hub-${id}`, type, seed: s, x, y, rot, stageIdx: item.stages.length, shifts: 0, delivered: true, startedAt: STAMP, crew: null, createdAt: STAMP };
    id++;
    if (isTower(item)) {
      site.floors = floorsFor(item, s);
      site.floor = site.floors;
      site.floorStep = 0;
      site.craneUp = false;
    }
    sites.push(site);
    return site;
  };
  const putIn = (type: string, slot: Slot, seed?: number, siteId?: string) => {
    const p = at(slot);
    return put(type, p.x, p.y, p.rot, seed, siteId);
  };

  // Trạm điện (cao ốc cần có điện) ngoài lưới, phía tây, cổng ra đại lộ x = 8.
  put('power_station', 5, 3, 1);

  // Thành phố chính: mười cao ốc đã xong, mỗi tòa một seed riêng (hình + màu kính khác nhau).
  const downtown: Site[] = [];
  HUB_DOWNTOWN.forEach((t, i) => {
    const s = putIn(t.type, DOWNTOWN_SLOTS[i]!, seedForFloors(t.type, t.floors, 5101 + i * 1291), `hub-dt-${t.id}`);
    if (s) downtown.push(s);
  });

  // Khu mở rộng: năm tháp cộng đồng, tiến độ thật áp lúc vẽ.
  const expansion: Site[] = [];
  towers.forEach((t, i) => {
    const slot = EXPANSION_SLOTS[i];
    const s = slot ? putIn(t.type, slot, seedForFloors(t.type, t.floors, 7001 + i * 977), `hub-tower-${t.id}`) : null;
    if (s) expansion.push(s);
  });

  // Nhà trung tầng, quảng trường giữa, công viên, ga tàu.
  const slot = (i: number, j: number, row: 'n' | 's', col: number): Slot => ({ i, j, row, col });
  putIn('school', slot(0, 0, 's', 4));
  putIn('hospital', slot(0, 1, 's', 4));
  putIn('fountain_plaza', slot(1, 1, 'n', 2));
  putIn('park', slot(1, 1, 'n', 0));
  putIn('park', slot(1, 1, 'n', 5));
  put('station', 19, 13, 0);
  put('park', 17, 14, 0);
  putIn('market', slot(2, 1, 'n', 4));
  put('post_office', 25, 14, 0);
  put('library', 29, 14, 0);
  for (const [x, y] of [
    [12, 4],
    [20, 4],
    [28, 4],
    [12, 11],
    [28, 11],
    [12, 14],
    [23, 14],
    [17, 12],
    [23, 12],
  ] as [number, number][]) {
    put('lamp', x, y, 0);
  }

  const layout: HubLayout = { terrain, roads, regions, decor: sites.filter((s) => !isTower(catalogItem(s.type)!)), downtown, towers: expansion };
  if (towers === HUB_TOWERS) cache = layout;
  return layout;
}

/**
 * Công trình để vẽ với tiến độ thật: thành phố chính luôn nguyên tòa; tháp khu
 * mở rộng xong → nguyên tòa; đang xây → cần cẩu + đúng số tầng đã xong (bước
 * tầng theo phần vật liệu tầng đang có); chưa tới lượt → mới cắm mốc khảo sát.
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
  return [...layout.decor, ...layout.downtown, ...towers];
}
