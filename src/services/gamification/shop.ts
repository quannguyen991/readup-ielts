/**
 * Cửa hàng đổi điểm — danh mục và luật mua, dạng hàm thuần.
 *
 * ĐỒNG XU CHỈ ĐỔI ĐƯỢC THỨ KHÔNG PHẢI NỘI DUNG HỌC. Mua avatar, mua thẻ giữ
 * chuỗi, mua nền trang thì được; KHÔNG bán bài đọc, đề thi hay lời giải. Bán
 * nội dung bằng điểm nghĩa là người học cày điểm để mở bài, và động lực chuyển
 * từ "học được gì" sang "cày được gì" — đúng thứ trang Xếp hạng dễ làm hỏng nhất.
 *
 * Thẻ giữ chuỗi có tác dụng THẬT: ngày được giữ tính như ngày đã học trong
 * `currentStreak`. Nếu nó chỉ là huy hiệu thì đó là bán lời hứa suông.
 */

import type { ItemKind } from '@/services/game/rules';

export type ShopItemKind = 'freeze' | 'avatar' | 'theme' | 'powerup';

export type ShopItem = {
  id: string;
  kind: ShopItemKind;
  name: string;
  detail: string;
  price: number;
  /** Emoji làm hình — tự vẽ, không mượn ảnh của ai. */
  glyph: string;
  /** Mua nhiều lần được (thẻ giữ chuỗi) hay chỉ một lần (avatar, nền). */
  repeatable: boolean;
  /** Số ngày chuỗi mà một thẻ giữ được. */
  freezeDays?: number;
  /** Đồ chiến đấu: mua xong vào thẳng túi đồ của nhân vật (`useGameStore`). */
  grants?: ItemKind;
};

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'freeze-1',
    kind: 'freeze',
    name: 'Thẻ giữ chuỗi',
    detail: 'Giữ chuỗi cho một ngày bạn không kịp học.',
    price: 50,
    glyph: '❄️',
    repeatable: true,
    freezeDays: 1,
  },
  {
    id: 'freeze-3',
    kind: 'freeze',
    name: 'Thẻ giữ chuỗi 3 ngày',
    detail: 'Cho những đợt thi cử hoặc đi xa.',
    price: 130,
    glyph: '🧊',
    repeatable: true,
    freezeDays: 3,
  },
  { id: 'power-potion', kind: 'powerup', name: 'Bình máu', detail: 'Hồi 2 tim giữa trận.', price: 30, glyph: '🧪', repeatable: true, grants: 'potion' },
  { id: 'power-shield', kind: 'powerup', name: 'Khiên', detail: 'Chặn một câu sai, giữ combo.', price: 40, glyph: '🛡️', repeatable: true, grants: 'shield' },
  { id: 'power-hint', kind: 'powerup', name: 'Gợi ý của Cú', detail: 'Bỏ bớt 2 phương án sai.', price: 25, glyph: '🦉', repeatable: true, grants: 'hint' },
  { id: 'power-double', kind: 'powerup', name: 'Nhân đôi XP', detail: '10 câu đúng tiếp theo gấp đôi XP.', price: 60, glyph: '⚡', repeatable: true, grants: 'double' },
  { id: 'avatar-owl', kind: 'avatar', name: 'Cú đêm', detail: 'Avatar', price: 100, glyph: '🦉', repeatable: false },
  { id: 'avatar-cat', kind: 'avatar', name: 'Mèo lười', detail: 'Avatar', price: 100, glyph: '🐱', repeatable: false },
  { id: 'avatar-fox', kind: 'avatar', name: 'Cáo tinh ranh', detail: 'Avatar', price: 180, glyph: '🦊', repeatable: false },
  { id: 'avatar-whale', kind: 'avatar', name: 'Cá voi', detail: 'Avatar', price: 180, glyph: '🐳', repeatable: false },
  { id: 'avatar-dragon', kind: 'avatar', name: 'Rồng', detail: 'Avatar', price: 400, glyph: '🐉', repeatable: false },
  { id: 'avatar-rocket', kind: 'avatar', name: 'Tên lửa', detail: 'Avatar', price: 400, glyph: '🚀', repeatable: false },
  {
    id: 'theme-sepia',
    kind: 'theme',
    name: 'Nền giấy ngà',
    detail: 'Thêm một tông giấy cho màn đọc.',
    price: 220,
    glyph: '📜',
    repeatable: false,
  },
];

export function findItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}

export type PurchaseState = {
  /** Số lần đã mua từng món. */
  owned: Record<string, number>;
  spent: number;
};

export type BuyResult =
  | { ok: true; spent: number; owned: Record<string, number> }
  | { ok: false; reason: 'không-đủ-xu' | 'đã-sở-hữu' | 'không-có-món-này' };

export function buy(state: PurchaseState, itemId: string, balance: number): BuyResult {
  const item = findItem(itemId);
  if (!item) return { ok: false, reason: 'không-có-món-này' };
  if (!item.repeatable && (state.owned[itemId] ?? 0) > 0) return { ok: false, reason: 'đã-sở-hữu' };
  if (balance < item.price) return { ok: false, reason: 'không-đủ-xu' };

  return {
    ok: true,
    spent: state.spent + item.price,
    owned: { ...state.owned, [itemId]: (state.owned[itemId] ?? 0) + 1 },
  };
}

/** Số xu còn lại: tổng điểm đã kiếm trừ đi phần đã tiêu. */
export function balanceOf(lifetimeEarned: number, spent: number): number {
  return Math.max(0, Math.round(lifetimeEarned) - spent);
}
