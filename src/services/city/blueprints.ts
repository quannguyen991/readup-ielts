import { hasMaterials, type Materials } from './materials';

/**
 * CÁC CÔNG TRÌNH của Thành phố Tri thức, từ nhỏ tới lớn. Người dùng đòi đủ
 * nhà 2 tầng, nhà cao tầng, tòa chọc trời và một đường chân trời đẹp.
 *
 * Mở khoá theo CẤP THÀNH PHỐ, cấp tính từ số dân: muốn xây tòa chọc trời thì
 * phải có dân ở nhà thấp trước — giống một thành phố lớn dần, và giữ cho người
 * học có mốc gần để với tới.
 *
 * Giá (xem `materials.ts`: 1 câu đúng ≈ 1 đơn vị): nhà 2 tầng ≈ một buổi học,
 * tòa chọc trời ≈ vài ngày, Tháp Tri thức ≈ hai tuần học đều.
 */
export type BlueprintId = 'park' | 'house2' | 'townhouse' | 'highrise' | 'skyscraper' | 'landmark';

export type Blueprint = {
  id: BlueprintId;
  name: string;
  /** Số tầng hiển thị (công viên = 0). */
  floors: number;
  population: number;
  cost: Partial<Materials>;
  unlockLevel: number;
  /** Chỉ được đặt ở vòng trong, sát quảng trường. */
  innerOnly?: boolean;
  /** Tối đa bao nhiêu cái trong một thành phố. */
  max?: number;
  glyph: string;
};

export const BLUEPRINTS: readonly Blueprint[] = [
  { id: 'park', name: 'Công viên', floors: 0, population: 0, cost: { wood: 15, stone: 5 }, unlockLevel: 1, glyph: '🌳' },
  { id: 'house2', name: 'Nhà 2 tầng', floors: 2, population: 8, cost: { wood: 30, brick: 20, glass: 4 }, unlockLevel: 1, glyph: '🏡' },
  { id: 'townhouse', name: 'Nhà phố 4 tầng', floors: 4, population: 24, cost: { wood: 10, brick: 45, stone: 25, glass: 10 }, unlockLevel: 2, glyph: '🏘️' },
  { id: 'highrise', name: 'Chung cư 12 tầng', floors: 12, population: 90, cost: { stone: 70, brick: 50, steel: 25, glass: 25 }, unlockLevel: 3, glyph: '🏢' },
  { id: 'skyscraper', name: 'Tòa chọc trời', floors: 28, population: 240, cost: { stone: 50, steel: 80, glass: 90 }, unlockLevel: 4, glyph: '🏙️' },
  {
    id: 'landmark',
    name: 'Tháp Tri thức',
    floors: 45,
    population: 400,
    cost: { stone: 120, steel: 180, glass: 200 },
    unlockLevel: 5,
    innerOnly: true,
    max: 1,
    glyph: '🗼',
  },
];

export function blueprint(id: string): Blueprint | undefined {
  return BLUEPRINTS.find((b) => b.id === id);
}

/** Số dân tối thiểu để lên từng cấp (chỉ số = cấp − 1). */
export const LEVEL_POPULATION = [0, 20, 80, 250, 600] as const;

export function levelFor(population: number): number {
  let level = 1;
  LEVEL_POPULATION.forEach((need, i) => {
    if (population >= need) level = i + 1;
  });
  return level;
}

/** Dân cần thêm để lên cấp sau; null khi đã cấp cao nhất. */
export function nextLevelNeed(population: number): { level: number; need: number } | null {
  const lv = levelFor(population);
  const next = LEVEL_POPULATION[lv];
  return next === undefined ? null : { level: lv + 1, need: next - population };
}

export type Placement = { type: BlueprintId; builtAt: string };
export type Plots = Record<string, Placement>;

export function populationOf(plots: Plots): number {
  return Object.values(plots).reduce((sum, p) => sum + (blueprint(p.type)?.population ?? 0), 0);
}

export type BuildCheck =
  | { ok: true }
  | { ok: false; reason: 'locked' | 'occupied' | 'materials' | 'inner' | 'max' | 'unknown' };

export function canBuild(
  type: BlueprintId,
  plotId: string,
  plots: Plots,
  inventory: Materials,
  isInner: (plotId: string) => boolean,
): BuildCheck {
  const bp = blueprint(type);
  if (!bp) return { ok: false, reason: 'unknown' };
  if (plots[plotId]) return { ok: false, reason: 'occupied' };
  if (levelFor(populationOf(plots)) < bp.unlockLevel) return { ok: false, reason: 'locked' };
  if (bp.innerOnly && !isInner(plotId)) return { ok: false, reason: 'inner' };
  if (bp.max !== undefined && Object.values(plots).filter((p) => p.type === type).length >= bp.max) {
    return { ok: false, reason: 'max' };
  }
  if (!hasMaterials(inventory, bp.cost)) return { ok: false, reason: 'materials' };
  return { ok: true };
}

export const BUILD_BLOCK_REASON: Record<Exclude<BuildCheck, { ok: true }>['reason'], string> = {
  locked: 'Chưa mở',
  occupied: 'Đã có nhà',
  materials: 'Thiếu vật liệu',
  inner: 'Chỉ xây sát quảng trường',
  max: 'Mỗi thành phố một tháp',
  unknown: 'Không có công trình này',
};

/** Phá dỡ hoàn lại một nửa vật liệu (làm tròn xuống). */
export function demolishRefund(type: BlueprintId): Partial<Materials> {
  const bp = blueprint(type);
  const out: Partial<Materials> = {};
  if (!bp) return out;
  for (const [k, v] of Object.entries(bp.cost)) out[k as keyof Materials] = Math.floor((v ?? 0) / 2);
  return out;
}
