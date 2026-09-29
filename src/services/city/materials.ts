/**
 * VẬT LIỆU của Thành phố Tri thức — kiếm bằng bài học, không mua bằng tiền.
 *
 * Người dùng (29/09/2026): "người học sẽ xây nhà, kiếm vật liệu thông qua các
 * bài tập, tích điểm để lấy vật liệu". Nên có HAI đường:
 * 1. Làm đúng một câu (lần đầu, không phải câu tự chấm) → 1 đơn vị vật liệu
 *    của đúng mảng đó. Mỗi loại có trần mỗi ngày để không cày một mảng.
 * 2. Đổi sao (điểm tích từ việc học) lấy vật liệu ở Chợ vật liệu.
 *
 * Mỗi mảng một vật liệu để muốn xây tòa cao thì phải học đủ mảng: nhà gỗ gạch
 * xây được bằng từ vựng + nghe; tòa kính thép cần cả SAT.
 */
export type MaterialKind = 'wood' | 'stone' | 'brick' | 'steel' | 'glass';

export const MATERIAL_KINDS: readonly MaterialKind[] = ['wood', 'stone', 'brick', 'steel', 'glass'];

export type Materials = Record<MaterialKind, number>;

export const EMPTY_MATERIALS: Materials = { wood: 0, stone: 0, brick: 0, steel: 0, glass: 0 };

export const MATERIAL_INFO: Record<MaterialKind, { name: string; glyph: string; color: string; earn: string; href: string }> = {
  wood: { name: 'Gỗ', glyph: '🪵', color: '#B7791F', earn: 'Từ vựng', href: '/vocabulary/quiz' },
  stone: { name: 'Đá', glyph: '🪨', color: '#78716C', earn: 'Đọc hiểu', href: '/practice' },
  brick: { name: 'Gạch', glyph: '🧱', color: '#C2410C', earn: 'Nghe & chép, dịch câu', href: '/sentence' },
  steel: { name: 'Thép', glyph: '🔩', color: '#475569', earn: 'SAT Math', href: '/math' },
  glass: { name: 'Kính', glyph: '💎', color: '#0EA5E9', earn: 'SAT Verbal, đề tuần, đấu 1–1', href: '/sat-rw' },
};

/** Nguồn câu hỏi (cùng tên với `GameSource` của game khi học) → vật liệu. */
const SOURCE_MATERIAL: Record<string, MaterialKind> = {
  vocab: 'wood',
  read: 'stone',
  reading: 'stone',
  listen: 'brick',
  listening: 'brick',
  shadow: 'brick',
  translate: 'brick',
  math: 'steel',
  verbal: 'glass',
  weekly: 'glass',
  duel: 'glass',
};

export function materialForSource(source: string): MaterialKind | null {
  return SOURCE_MATERIAL[source] ?? null;
}

/** Trần mỗi ngày (giờ Việt Nam) cho vật liệu kiếm bằng bài học. Mua bằng sao thì không tính trần. */
export const DAILY_CAP: Materials = { wood: 60, stone: 60, brick: 60, steel: 40, glass: 40 };

export type DailyEarned = { day: string; earned: Materials };

/**
 * Cộng vật liệu cho `correct` câu đúng của một nguồn, tôn trọng trần ngày.
 * Trả vật liệu mới, sổ ngày mới và số thực nhận (0 khi chạm trần / nguồn lạ).
 */
export function earnFromAnswers(
  inventory: Materials,
  daily: DailyEarned | null,
  source: string,
  correct: number,
  day: string,
): { inventory: Materials; daily: DailyEarned; kind: MaterialKind | null; gained: number } {
  const book: DailyEarned = daily && daily.day === day ? daily : { day, earned: { ...EMPTY_MATERIALS } };
  const kind = materialForSource(source);
  const n = Math.max(0, Math.floor(correct));
  if (!kind || n === 0) return { inventory, daily: book, kind, gained: 0 };
  const room = Math.max(0, DAILY_CAP[kind] - book.earned[kind]);
  const gained = Math.min(room, n);
  if (gained === 0) return { inventory, daily: book, kind, gained: 0 };
  return {
    inventory: { ...inventory, [kind]: inventory[kind] + gained },
    daily: { day, earned: { ...book.earned, [kind]: book.earned[kind] + gained } },
    kind,
    gained,
  };
}

/** Giá mỗi đơn vị ở Chợ vật liệu, tính bằng sao. Vật liệu tòa cao đắt hơn. */
export const STAR_PRICE: Materials = { wood: 3, stone: 3, brick: 4, steel: 6, glass: 6 };

export function starCost(kind: MaterialKind, qty: number): number {
  return STAR_PRICE[kind] * Math.max(0, Math.floor(qty));
}

export function hasMaterials(inventory: Materials, cost: Partial<Materials>): boolean {
  return MATERIAL_KINDS.every((k) => (cost[k] ?? 0) <= inventory[k]);
}

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
