/**
 * CATALOG CÔNG TRÌNH của Thành Phố Tri Thức — năm kỷ, từ lều khai hoang tới cao
 * ốc 20 tầng. Chỉ là DỮ LIỆU: luật đặt ở `services/city/placement.ts`, luật xây
 * ở `services/city/construction.ts`, hình ở `services/city/procgen/*`.
 *
 * Quy ước kích thước: 1 ô lưới = 1 đơn vị cảnh. `size` = [rộng, sâu] ở góc
 * xoay 0; mặt trước (cổng) nhìn về +z.
 *
 * Chi phí `cost` là TỔNG cho các công đoạn không theo tầng; được chia cho từng
 * công đoạn theo `STAGE_WEIGHT` trong `construction.ts` — không trừ một lần lúc
 * đặt bản thiết kế. Cao ốc có thêm `floorCost` cho mỗi tầng.
 */
import type { Materials } from '@/services/city/materials';

export type Era = 1 | 2 | 3 | 4 | 5;
export type TerrainKind = 'plains' | 'coast' | 'mountain';
export type ZoneKind = 'residential' | 'learning' | 'commercial' | 'public' | 'infrastructure' | 'waterfront' | 'highrise';
export type CrewId = 'pioneer' | 'builder' | 'tower';
export type RoadKind = 'dirt' | 'stone' | 'asphalt';

export type GeneratorId =
  | 'tent'
  | 'campfire'
  | 'well'
  | 'depot'
  | 'house_wood'
  | 'warehouse'
  | 'dock'
  | 'fence'
  | 'house_brick'
  | 'school'
  | 'library'
  | 'market'
  | 'lamp'
  | 'townhouse'
  | 'post_office'
  | 'hospital'
  | 'fountain_plaza'
  | 'lighthouse'
  | 'park'
  | 'station'
  | 'power_station'
  | 'skill_vocab'
  | 'skill_listen'
  | 'skill_reading'
  | 'academy'
  | 'tower_stepped'
  | 'tower_rounded'
  | 'tower_twin'
  | 'tower_observation';

/** Số đo học tập thật mà công trình kỹ năng phản ánh (xem `skill-level.ts`). */
export type SkillMetric = 'vocab' | 'listening' | 'reading' | 'library' | 'overall';

export type Placement = {
  /** Loại mặt đất đặt được. */
  on: 'land' | 'waterfront' | 'coast_point';
  /** Đường cần nối vào cổng: 'none' | 'any' (mọi loại đường) | loại tối thiểu. */
  road: 'none' | 'any' | 'stone' | 'asphalt';
  /** Cần trạm điện đã hoàn thành trong thành phố. */
  power?: boolean;
  /** Không đặt trên cát (cao ốc, công trình lớn). */
  noSand?: boolean;
};

export type CatalogBuilding = {
  id: string;
  vi: string;
  en: string;
  era: Era;
  size: [number, number];
  terrains: readonly TerrainKind[] | 'all';
  zone: ZoneKind;
  place: Placement;
  crew: CrewId;
  /** Các công đoạn (0..8) công trình đi qua, theo thứ tự. */
  stages: readonly number[];
  cost: Partial<Materials>;
  /** Tổng số ca cho các công đoạn không theo tầng. */
  shifts: number;
  population?: number;
  /** Cao ốc: số tầng [ít nhất, nhiều nhất] theo seed, và chi phí mỗi tầng. */
  floors?: [number, number];
  floorCost?: Partial<Materials>;
  source: 'procgen' | 'model' | 'hybrid';
  gen: GeneratorId;
  /** Khoá trong `decor-map.ts` — model tải về gắn vào điểm neo. */
  decor?: string;
  /** Công trình kỹ năng: nhấn vào mở đúng mảng học. */
  skill?: { route: string; metric: SkillMetric };
  /** Tối đa bao nhiêu cái trong một thành phố. */
  max?: number;
  glyph: string;
};

const FULL = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
/** Công trình nhỏ (bếp lửa, giếng, đèn, hàng rào): ít công đoạn nhưng vẫn không bỏ bước. */
const SMALL = [0, 2, 5, 8] as const;
const OPEN = [0, 1, 5, 8] as const;
/** Cao ốc: tường không phải công đoạn riêng — mặt dựng lắp trong chu kỳ từng tầng của công đoạn 4. */
const TOWER = [0, 1, 2, 3, 4, 6, 7, 8] as const;

export const CATALOG: readonly CatalogBuilding[] = [
  // ------------------------------------------------------------ Kỷ 1 — Khai hoang
  { id: 'tent', vi: 'Lều', en: 'Tent', era: 1, size: [1, 1], terrains: 'all', zone: 'residential', place: { on: 'land', road: 'none' }, crew: 'pioneer', stages: [0, 1, 4, 6, 8], cost: { wood: 8 }, shifts: 5, population: 2, source: 'hybrid', gen: 'tent', decor: 'tent', glyph: '⛺' },
  { id: 'campfire', vi: 'Bếp lửa', en: 'Campfire', era: 1, size: [1, 1], terrains: 'all', zone: 'public', place: { on: 'land', road: 'none' }, crew: 'pioneer', stages: OPEN, cost: { wood: 4, stone: 2 }, shifts: 4, source: 'hybrid', gen: 'campfire', decor: 'campfire', max: 3, glyph: '🔥' },
  { id: 'well', vi: 'Giếng', en: 'Well', era: 1, size: [1, 1], terrains: 'all', zone: 'infrastructure', place: { on: 'land', road: 'none' }, crew: 'pioneer', stages: SMALL, cost: { wood: 4, stone: 6 }, shifts: 4, source: 'procgen', gen: 'well', glyph: '🪣' },
  { id: 'depot', vi: 'Điểm tập kết', en: 'Supply depot', era: 1, size: [2, 2], terrains: 'all', zone: 'infrastructure', place: { on: 'land', road: 'none' }, crew: 'pioneer', stages: [0, 1, 2, 4, 8], cost: { wood: 10 }, shifts: 5, source: 'hybrid', gen: 'depot', decor: 'depot', max: 2, glyph: '📦' },

  // ------------------------------------------------------------ Kỷ 2 — Làng gỗ
  { id: 'house_wood', vi: 'Nhà gỗ', en: 'Wooden house', era: 2, size: [2, 2], terrains: 'all', zone: 'residential', place: { on: 'land', road: 'any' }, crew: 'pioneer', stages: FULL, cost: { wood: 26, stone: 6 }, shifts: 9, population: 6, source: 'hybrid', gen: 'house_wood', decor: 'house_wood', glyph: '🏡' },
  { id: 'warehouse', vi: 'Kho', en: 'Warehouse', era: 2, size: [2, 3], terrains: 'all', zone: 'infrastructure', place: { on: 'land', road: 'any' }, crew: 'pioneer', stages: FULL, cost: { wood: 30, stone: 8 }, shifts: 9, source: 'hybrid', gen: 'warehouse', decor: 'warehouse', glyph: '🏚️' },
  { id: 'dock', vi: 'Bến thuyền', en: 'Boat dock', era: 2, size: [2, 2], terrains: ['plains', 'coast'], zone: 'waterfront', place: { on: 'waterfront', road: 'any' }, crew: 'pioneer', stages: [0, 2, 3, 4, 7, 8], cost: { wood: 24, stone: 6 }, shifts: 6, source: 'hybrid', gen: 'dock', decor: 'dock', glyph: '⛵' },
  { id: 'fence', vi: 'Hàng rào', en: 'Fence', era: 2, size: [1, 1], terrains: 'all', zone: 'residential', place: { on: 'land', road: 'none' }, crew: 'pioneer', stages: [0, 4, 8], cost: { wood: 3 }, shifts: 1, source: 'procgen', gen: 'fence', glyph: '🪵' },
  { id: 'vocab_house', vi: 'Nhà Từ Vựng', en: 'Vocabulary House', era: 2, size: [2, 2], terrains: 'all', zone: 'learning', place: { on: 'land', road: 'any' }, crew: 'pioneer', stages: FULL, cost: { wood: 28, stone: 6 }, shifts: 9, source: 'procgen', gen: 'skill_vocab', skill: { route: '/vocabulary/quiz', metric: 'vocab' }, max: 1, glyph: '📗' },
  { id: 'listen_house', vi: 'Nhà Nghe', en: 'Listening House', era: 2, size: [2, 2], terrains: 'all', zone: 'learning', place: { on: 'land', road: 'any' }, crew: 'pioneer', stages: FULL, cost: { wood: 24, brick: 8, stone: 4 }, shifts: 9, source: 'procgen', gen: 'skill_listen', skill: { route: '/sentence', metric: 'listening' }, max: 1, glyph: '🎧' },

  // ------------------------------------------------------------ Kỷ 3 — Thị trấn gạch
  { id: 'house_brick', vi: 'Nhà gạch hai tầng', en: 'Two-storey brick house', era: 3, size: [2, 2], terrains: 'all', zone: 'residential', place: { on: 'land', road: 'any' }, crew: 'builder', stages: FULL, cost: { brick: 40, stone: 14, wood: 10 }, shifts: 12, population: 12, source: 'hybrid', gen: 'house_brick', decor: 'house_brick', glyph: '🏠' },
  { id: 'school', vi: 'Trường học', en: 'School', era: 3, size: [3, 3], terrains: 'all', zone: 'public', place: { on: 'land', road: 'stone' }, crew: 'builder', stages: FULL, cost: { brick: 60, stone: 24, wood: 16 }, shifts: 14, source: 'procgen', gen: 'school', glyph: '🏫' },
  { id: 'library', vi: 'Thư Viện', en: 'Library', era: 3, size: [3, 2], terrains: 'all', zone: 'learning', place: { on: 'land', road: 'stone' }, crew: 'builder', stages: FULL, cost: { brick: 50, stone: 24, wood: 14 }, shifts: 13, source: 'procgen', gen: 'library', skill: { route: '/library', metric: 'library' }, max: 1, glyph: '📚' },
  { id: 'reading_house', vi: 'Nhà Đọc Hiểu', en: 'Reading House', era: 3, size: [2, 2], terrains: 'all', zone: 'learning', place: { on: 'land', road: 'any' }, crew: 'builder', stages: FULL, cost: { brick: 36, stone: 16, wood: 8 }, shifts: 11, source: 'procgen', gen: 'skill_reading', skill: { route: '/practice', metric: 'reading' }, max: 1, glyph: '📖' },
  { id: 'market', vi: 'Chợ', en: 'Market', era: 3, size: [3, 3], terrains: 'all', zone: 'commercial', place: { on: 'land', road: 'stone' }, crew: 'builder', stages: FULL, cost: { wood: 30, brick: 30, stone: 16 }, shifts: 12, source: 'hybrid', gen: 'market', decor: 'market', glyph: '🧺' },
  { id: 'lamp', vi: 'Đèn đường', en: 'Street lamp', era: 3, size: [1, 1], terrains: 'all', zone: 'public', place: { on: 'land', road: 'none' }, crew: 'pioneer', stages: SMALL, cost: { stone: 2, steel: 1 }, shifts: 1, source: 'model', gen: 'lamp', decor: 'lamp', glyph: '💡' },
  { id: 'park', vi: 'Công viên', en: 'Park', era: 3, size: [2, 2], terrains: 'all', zone: 'public', place: { on: 'land', road: 'any' }, crew: 'pioneer', stages: [0, 1, 2, 8], cost: { wood: 12, stone: 8 }, shifts: 4, source: 'hybrid', gen: 'park', decor: 'park', glyph: '🌳' },

  // ------------------------------------------------------------ Kỷ 4 — Thành phố
  { id: 'townhouse', vi: 'Nhà phố', en: 'Townhouse', era: 4, size: [2, 2], terrains: 'all', zone: 'residential', place: { on: 'land', road: 'stone', noSand: true }, crew: 'builder', stages: FULL, cost: { brick: 60, stone: 30, wood: 12, glass: 2 }, shifts: 15, population: 24, source: 'procgen', gen: 'townhouse', glyph: '🏘️' },
  { id: 'post_office', vi: 'Bưu điện', en: 'Post office', era: 4, size: [3, 2], terrains: 'all', zone: 'commercial', place: { on: 'land', road: 'stone' }, crew: 'builder', stages: FULL, cost: { brick: 56, stone: 30, wood: 10, glass: 2 }, shifts: 14, source: 'procgen', gen: 'post_office', glyph: '📮' },
  { id: 'hospital', vi: 'Bệnh viện', en: 'Hospital', era: 4, size: [3, 3], terrains: 'all', zone: 'public', place: { on: 'land', road: 'stone', noSand: true }, crew: 'builder', stages: FULL, cost: { brick: 80, stone: 44, steel: 6, glass: 4 }, shifts: 18, source: 'procgen', gen: 'hospital', glyph: '🏥' },
  { id: 'fountain_plaza', vi: 'Quảng trường đài phun nước', en: 'Fountain plaza', era: 4, size: [3, 3], terrains: 'all', zone: 'public', place: { on: 'land', road: 'stone' }, crew: 'builder', stages: [0, 1, 2, 3, 5, 7, 8], cost: { stone: 50, brick: 16 }, shifts: 10, source: 'procgen', gen: 'fountain_plaza', max: 2, glyph: '⛲' },
  { id: 'lighthouse', vi: 'Hải đăng', en: 'Lighthouse', era: 4, size: [2, 2], terrains: ['coast'], zone: 'waterfront', place: { on: 'coast_point', road: 'none' }, crew: 'builder', stages: FULL, cost: { stone: 50, brick: 24, glass: 4, steel: 4 }, shifts: 14, source: 'procgen', gen: 'lighthouse', max: 1, glyph: '🗼' },
  { id: 'academy', vi: 'Học Viện Ngôn Ngữ', en: 'Language Academy', era: 4, size: [3, 3], terrains: 'all', zone: 'learning', place: { on: 'land', road: 'stone', noSand: true }, crew: 'builder', stages: FULL, cost: { brick: 70, stone: 40, glass: 4, steel: 4 }, shifts: 18, source: 'procgen', gen: 'academy', skill: { route: '/dashboard', metric: 'overall' }, max: 1, glyph: '🎓' },

  // ------------------------------------------------------------ Kỷ 5 — Đô thị
  { id: 'power_station', vi: 'Trạm điện', en: 'Power station', era: 5, size: [3, 3], terrains: 'all', zone: 'infrastructure', place: { on: 'land', road: 'asphalt', noSand: true }, crew: 'builder', stages: FULL, cost: { steel: 20, stone: 40, brick: 30 }, shifts: 12, source: 'procgen', gen: 'power_station', glyph: '⚡' },
  { id: 'station', vi: 'Ga tàu', en: 'Train station', era: 5, size: [4, 3], terrains: 'all', zone: 'infrastructure', place: { on: 'land', road: 'asphalt', noSand: true }, crew: 'builder', stages: FULL, cost: { steel: 24, stone: 50, brick: 30, glass: 6 }, shifts: 18, source: 'procgen', gen: 'station', max: 1, glyph: '🚉' },
  { id: 'tower_office', vi: 'Tháp văn phòng bậc thang', en: 'Stepped office tower', era: 5, size: [3, 3], terrains: 'all', zone: 'highrise', place: { on: 'land', road: 'asphalt', power: true, noSand: true }, crew: 'tower', stages: TOWER, cost: { stone: 40, steel: 12, glass: 4, brick: 10 }, shifts: 10, floors: [10, 16], floorCost: { steel: 1, stone: 2, glass: 1 }, population: 90, source: 'procgen', gen: 'tower_stepped', glyph: '🏢' },
  { id: 'tower_glass', vi: 'Tháp kính bo góc', en: 'Rounded glass tower', era: 5, size: [3, 3], terrains: 'all', zone: 'highrise', place: { on: 'land', road: 'asphalt', power: true, noSand: true }, crew: 'tower', stages: TOWER, cost: { stone: 40, steel: 14, glass: 6 }, shifts: 10, floors: [12, 20], floorCost: { steel: 1, stone: 1, glass: 1 }, population: 110, source: 'procgen', gen: 'tower_rounded', glyph: '🏙️' },
  { id: 'tower_twin', vi: 'Tháp đôi nối đế', en: 'Twin towers on a podium', era: 5, size: [4, 3], terrains: 'all', zone: 'highrise', place: { on: 'land', road: 'asphalt', power: true, noSand: true }, crew: 'tower', stages: TOWER, cost: { stone: 56, steel: 16, glass: 6, brick: 12 }, shifts: 12, floors: [12, 18], floorCost: { steel: 2, stone: 2, glass: 1 }, population: 150, source: 'procgen', gen: 'tower_twin', glyph: '🏬' },
  { id: 'tower_observation', vi: 'Đài quan sát', en: 'Observation tower', era: 5, size: [3, 3], terrains: 'all', zone: 'highrise', place: { on: 'land', road: 'asphalt', power: true, noSand: true }, crew: 'tower', stages: TOWER, cost: { stone: 44, steel: 18, glass: 8 }, shifts: 12, floors: [14, 20], floorCost: { steel: 2, stone: 1, glass: 1 }, population: 60, max: 1, source: 'procgen', gen: 'tower_observation', glyph: '🗼' },
];

export function catalogItem(id: string): CatalogBuilding | undefined {
  return CATALOG.find((b) => b.id === id);
}

export function isTower(b: CatalogBuilding | undefined): boolean {
  return !!b?.floors;
}

/** Đường: đặt bằng công cụ vẽ đường, một công đoạn (giao vật liệu là xong), không có ca. */
export const ROADS: Record<RoadKind, { vi: string; en: string; era: Era; cost: Partial<Materials> }> = {
  dirt: { vi: 'Đường đất', en: 'Dirt road', era: 1, cost: { wood: 1 } },
  stone: { vi: 'Đường lát đá', en: 'Stone road', era: 3, cost: { stone: 2 } },
  asphalt: { vi: 'Đường nhựa', en: 'Asphalt road', era: 5, cost: { stone: 2, steel: 1 } },
};

/** Cầu: đường đặt trên ô nước / khe suối. */
export const BRIDGES = {
  wood: { vi: 'Cầu gỗ', en: 'Wooden bridge', era: 2 as Era, cost: { wood: 6 } as Partial<Materials> },
  stone: { vi: 'Cầu đá', en: 'Stone bridge', era: 4 as Era, cost: { stone: 8, brick: 2 } as Partial<Materials> },
};

/** Xử lý đất: san thềm (miền núi) và gia cố nền cát (ven biển). */
export const LAND_WORKS = {
  terrace: { vi: 'San thềm đất', en: 'Level a terrace', era: 1 as Era, cost: { stone: 6, wood: 2 } as Partial<Materials> },
  reinforce: { vi: 'Gia cố nền cát', en: 'Reinforce sand', era: 2 as Era, cost: { stone: 4 } as Partial<Materials> },
};

export const ERA_INFO: Record<Era, { vi: string; en: string; glyph: string }> = {
  1: { vi: 'Khai hoang', en: 'Pioneer camp', glyph: '⛺' },
  2: { vi: 'Làng gỗ', en: 'Wooden village', glyph: '🏡' },
  3: { vi: 'Thị trấn gạch', en: 'Brick town', glyph: '🏠' },
  4: { vi: 'Thành phố', en: 'City', glyph: '🏘️' },
  5: { vi: 'Đô thị', en: 'Metropolis', glyph: '🏙️' },
};

export const ZONE_INFO: Record<ZoneKind, { vi: string; en: string; color: string }> = {
  residential: { vi: 'Khu dân cư', en: 'Residential', color: '#F2A33A' },
  learning: { vi: 'Khu học tập', en: 'Learning', color: '#3E7CC4' },
  commercial: { vi: 'Khu thương mại', en: 'Commercial', color: '#E0533D' },
  public: { vi: 'Khu công cộng', en: 'Public', color: '#3AA65D' },
  infrastructure: { vi: 'Khu hạ tầng', en: 'Infrastructure', color: '#8A8F98' },
  waterfront: { vi: 'Khu ven nước', en: 'Waterfront', color: '#2BB3C0' },
  highrise: { vi: 'Khu cao tầng', en: 'High-rise', color: '#8A63D2' },
};
