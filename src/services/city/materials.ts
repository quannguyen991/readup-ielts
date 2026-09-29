/**
 * VẬT LIỆU của Thành Phố Tri Thức. Chỉ kiếm bằng học tập — không mua bằng tiền
 * thật, không đổi bằng sao (sao chỉ đổi đồ trang trí). Luật cộng ở `economy.ts`.
 */
export type MaterialKind = 'wood' | 'stone' | 'brick' | 'steel' | 'glass';

export const MATERIAL_KINDS: readonly MaterialKind[] = ['wood', 'stone', 'brick', 'steel', 'glass'];

export type Materials = Record<MaterialKind, number>;

export const EMPTY_MATERIALS: Materials = { wood: 0, stone: 0, brick: 0, steel: 0, glass: 0 };

/**
 * Tên + nơi học để kiếm. `href` là màn học SINH ra vật liệu đó — màn "Học để
 * nhận" dẫn thẳng tới đây, không có đường nào khác để lấy vật liệu.
 */
export const MATERIAL_INFO: Record<
  MaterialKind,
  { vi: string; en: string; glyph: string; color: string; earnVi: string; earnEn: string; href: string }
> = {
  wood: { vi: 'Gỗ', en: 'Wood', glyph: '🪵', color: '#B7791F', earnVi: 'Trả lời đúng câu từ vựng', earnEn: 'Answer vocabulary questions correctly', href: '/vocabulary/quiz' },
  stone: { vi: 'Đá', en: 'Stone', glyph: '🪨', color: '#78716C', earnVi: 'Nộp bài đọc hiểu Reading', earnEn: 'Submit a Reading exercise', href: '/practice' },
  brick: { vi: 'Gạch', en: 'Brick', glyph: '🧱', color: '#C2410C', earnVi: 'Trả lời đúng câu luyện nghe', earnEn: 'Answer listening questions correctly', href: '/sentence' },
  steel: { vi: 'Thép', en: 'Steel', glyph: '🔩', color: '#475569', earnVi: 'Làm đề thi thử đầy đủ hoặc nộp Writing được chấm', earnEn: 'Finish a full mock test or get a Writing essay graded', href: '/sat/full-test' },
  glass: { vi: 'Kính', en: 'Glass', glyph: '💎', color: '#0EA5E9', earnVi: 'Giữ chuỗi ngày học 7, 14, 30 ngày', earnEn: 'Keep a 7, 14 or 30-day study streak', href: '/dashboard' },
};

export function hasMaterials(inventory: Materials, cost: Partial<Materials>): boolean {
  return MATERIAL_KINDS.every((k) => (cost[k] ?? 0) <= inventory[k]);
}

/** Còn thiếu bao nhiêu từng loại (chỉ loại thiếu > 0). */
export function shortfall(inventory: Materials, cost: Partial<Materials>): Partial<Materials> {
  const out: Partial<Materials> = {};
  for (const k of MATERIAL_KINDS) {
    const miss = (cost[k] ?? 0) - inventory[k];
    if (miss > 0) out[k] = miss;
  }
  return out;
}

/** Trừ vật liệu. Không bao giờ âm — gọi sau `hasMaterials`. */
export function subtract(inventory: Materials, cost: Partial<Materials>): Materials {
  const out = { ...inventory };
  for (const k of MATERIAL_KINDS) out[k] = Math.max(0, out[k] - (cost[k] ?? 0));
  return out;
}

export function add(inventory: Materials, extra: Partial<Materials>): Materials {
  const out = { ...inventory };
  for (const k of MATERIAL_KINDS) out[k] = out[k] + Math.max(0, Math.floor(extra[k] ?? 0));
  return out;
}

export function isEmptyCost(cost: Partial<Materials>): boolean {
  return MATERIAL_KINDS.every((k) => (cost[k] ?? 0) <= 0);
}
