/**
 * ĐỔI SAO — danh mục và luật mua, dạng hàm thuần.
 *
 * SAO ⭐ LÀ TIỀN DUY NHẤT CỦA APP, và chỉ kiếm được bằng việc học: thời gian học
 * và số câu làm (có trần mỗi ngày, `gamification/points.ts`), cộng sao thưởng từ
 * trận đấu khi học (hạ quái, boss, lên cấp, nhiệm vụ, huy hiệu). Không có nút
 * nạp sao bằng tiền — thứ gì đổi được bằng sao đều là phần thưởng cho công học.
 *
 * ĐỔI ĐƯỢC GÌ:
 *  - Vé gói Plus/Pro CÓ HẠN (7 ngày). Trước đây cửa hàng cấm hẳn mọi thứ dính tới
 *    nội dung học; người dùng chốt lại (24/09/2026) là cho đổi sao lấy gói — học
 *    đều thì được dùng bản đầy đủ. Trần điểm mỗi ngày vẫn là chốt chặn cày điểm:
 *    không ai "cày" nổi một vé Pro trong một buổi.
 *  - Linh vật đồng hành: giúp câu hỏi bằng mã (bỏ bớt phương án sai, đỡ một câu
 *    sai, hồi tim, chém mạnh hơn) — không bao giờ làm hộ.
 *  - Skin nhân vật, avatar động, bìa hồ sơ chuyển động, avatar emoji, nền đọc.
 *  - Thẻ giữ chuỗi (có tác dụng THẬT với `currentStreak`) và đồ chiến đấu.
 *
 * KHÔNG BÁN: bài đọc, đề thi hay lời giải lẻ — nội dung chỉ mở theo gói.
 */

import type { ItemKind } from '@/services/game/rules';
import type { MascotId } from '@/services/game/mascots';
import type { SkinId } from '@/components/game/sprites';

export type ShopItemKind = 'plan' | 'mascot' | 'skin' | 'avatarAnim' | 'cover' | 'powerup' | 'freeze' | 'avatar' | 'theme';

/** Kiểu avatar động — `components/profile/AnimatedAvatar.tsx` vẽ theo mã này. */
export type AvatarLook = 'hero' | 'slime' | 'ghost' | 'owl' | 'dragon' | 'star';
/** Kiểu bìa hồ sơ chuyển động — `components/profile/ProfileCover.tsx`. */
export type CoverLook = 'stars' | 'aurora' | 'sunset' | 'ocean';

export type ShopItem = {
  id: string;
  kind: ShopItemKind;
  name: string;
  detail: string;
  price: number;
  /** Emoji làm hình — tự vẽ, không mượn ảnh của ai. */
  glyph: string;
  /** Mua nhiều lần được (vé gói, thẻ giữ chuỗi, đồ chiến đấu) hay chỉ một lần. */
  repeatable: boolean;
  /** Số ngày chuỗi mà một thẻ giữ được. */
  freezeDays?: number;
  /** Đồ chiến đấu: mua xong vào thẳng túi đồ của nhân vật (`useGameStore`). */
  grants?: ItemKind;
  /** Vé gói: gói nào, bao nhiêu ngày. */
  plan?: { id: 'plus' | 'pro'; days: number };
  mascot?: MascotId;
  skin?: SkinId;
  avatarLook?: AvatarLook;
  cover?: CoverLook;
};

export const SHOP_ITEMS: ShopItem[] = [
  // ---------------------------------------------------------------- vé gói
  // Vé ghi ở máy như bản dùng thử: mở phần nội dung bị khoá. Lượt gọi AI do máy
  // chủ đếm theo gói ĐÃ TRẢ TIỀN — vé không cộng lượt AI, nên mô tả không hứa điều đó.
  { id: 'pass-plus-7', kind: 'plan', name: 'Vé Plus 7 ngày', detail: 'Đọc, thi thử và sổ từ không giới hạn trong 7 ngày. Đang có vé Plus thì cộng dồn.', price: 700, glyph: '🎟️', repeatable: true, plan: { id: 'plus', days: 7 } },
  { id: 'pass-pro-7', kind: 'plan', name: 'Vé Pro 7 ngày', detail: 'Mọi thứ của Plus, thêm bài mẫu đã kiểm định và chatbox trợ giảng, trong 7 ngày.', price: 1400, glyph: '👑', repeatable: true, plan: { id: 'pro', days: 7 } },

  // ---------------------------------------------------------------- linh vật
  { id: 'mascot-owl', kind: 'mascot', name: 'Cú Thông Thái', detail: '3 lượt Hỏi Cú miễn phí mỗi ngày.', price: 500, glyph: '🦉', repeatable: false, mascot: 'owl' },
  { id: 'mascot-fox', kind: 'mascot', name: 'Cáo Tinh Ranh', detail: 'Đỡ câu sai đầu tiên mỗi ngày.', price: 600, glyph: '🦊', repeatable: false, mascot: 'fox' },
  { id: 'mascot-cat', kind: 'mascot', name: 'Mèo Lười', detail: 'Cứ 10 câu đúng hồi 1 tim.', price: 450, glyph: '🐱', repeatable: false, mascot: 'cat' },
  { id: 'mascot-dragon', kind: 'mascot', name: 'Rồng Con', detail: 'Mỗi nhát chém mạnh thêm 20%.', price: 800, glyph: '🐲', repeatable: false, mascot: 'dragon' },

  // ---------------------------------------------------------------- skin nhân vật
  { id: 'skin-ninja', kind: 'skin', name: 'Ninja bóng đêm', detail: 'Áo đen, khăn đỏ.', price: 300, glyph: '🥷', repeatable: false, skin: 'ninja' },
  { id: 'skin-mage', kind: 'skin', name: 'Pháp sư tím', detail: 'Áo choàng vàng, gậy phép hồng.', price: 350, glyph: '🧙', repeatable: false, skin: 'mage' },
  { id: 'skin-samurai', kind: 'skin', name: 'Samurai đỏ', detail: 'Giáp đỏ, chuôi kiếm vàng.', price: 400, glyph: '⚔️', repeatable: false, skin: 'samurai' },
  { id: 'skin-astronaut', kind: 'skin', name: 'Phi hành gia', detail: 'Bộ đồ trắng, kiếm tia xanh.', price: 450, glyph: '🧑‍🚀', repeatable: false, skin: 'astronaut' },
  { id: 'skin-gold', kind: 'skin', name: 'Hiệp sĩ vàng', detail: 'Giáp vàng, áo choàng tím — bản hiếm.', price: 800, glyph: '🏆', repeatable: false, skin: 'gold' },

  // ---------------------------------------------------------------- avatar động
  { id: 'anim-hero', kind: 'avatarAnim', name: 'Hiệp sĩ nhún nhảy', detail: 'Mặc đúng skin bạn đang đeo.', price: 200, glyph: '🗡️', repeatable: false, avatarLook: 'hero' },
  { id: 'anim-slime', kind: 'avatarAnim', name: 'Nhớt nảy tưng', detail: 'Nảy liên tục, mắt chớp.', price: 150, glyph: '🫧', repeatable: false, avatarLook: 'slime' },
  { id: 'anim-ghost', kind: 'avatarAnim', name: 'Ma bay lượn', detail: 'Bay lên xuống, mờ tỏ.', price: 180, glyph: '👻', repeatable: false, avatarLook: 'ghost' },
  { id: 'anim-owl', kind: 'avatarAnim', name: 'Cú lắc đầu', detail: 'Nghiêng đầu nhìn bạn.', price: 220, glyph: '🦉', repeatable: false, avatarLook: 'owl' },
  { id: 'anim-star', kind: 'avatarAnim', name: 'Sao lấp lánh', detail: 'Chùm sao phát sáng xoay quanh.', price: 250, glyph: '✨', repeatable: false, avatarLook: 'star' },
  { id: 'anim-dragon', kind: 'avatarAnim', name: 'Rồng phun lửa', detail: 'Vỗ cánh, phì lửa — bản hiếm.', price: 400, glyph: '🔥', repeatable: false, avatarLook: 'dragon' },

  // ---------------------------------------------------------------- bìa hồ sơ
  { id: 'cover-stars', kind: 'cover', name: 'Bầu trời sao', detail: 'Sao nhấp nháy, thỉnh thoảng một vệt sao băng.', price: 250, glyph: '🌌', repeatable: false, cover: 'stars' },
  { id: 'cover-sunset', kind: 'cover', name: 'Hoàng hôn pixel', detail: 'Mặt trời lặn sau đồi, mây trôi.', price: 300, glyph: '🌅', repeatable: false, cover: 'sunset' },
  { id: 'cover-ocean', kind: 'cover', name: 'Sóng biển', detail: 'Sóng vỗ, mặt trời lấp lánh trên nước.', price: 300, glyph: '🌊', repeatable: false, cover: 'ocean' },
  { id: 'cover-aurora', kind: 'cover', name: 'Cực quang', detail: 'Dải sáng loang chậm trên nền đêm.', price: 350, glyph: '🌠', repeatable: false, cover: 'aurora' },

  // ---------------------------------------------------------------- đồ chiến đấu
  { id: 'power-potion', kind: 'powerup', name: 'Bình máu', detail: 'Hồi 2 tim giữa trận.', price: 30, glyph: '🧪', repeatable: true, grants: 'potion' },
  { id: 'power-shield', kind: 'powerup', name: 'Khiên', detail: 'Chặn một câu sai, giữ combo.', price: 40, glyph: '🛡️', repeatable: true, grants: 'shield' },
  { id: 'power-hint', kind: 'powerup', name: 'Gợi ý của Cú', detail: 'Bỏ bớt 2 phương án sai.', price: 25, glyph: '🦉', repeatable: true, grants: 'hint' },
  { id: 'power-double', kind: 'powerup', name: 'Nhân đôi XP', detail: '10 câu đúng tiếp theo gấp đôi XP.', price: 60, glyph: '⚡', repeatable: true, grants: 'double' },

  // ---------------------------------------------------------------- vật phẩm
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

  // ---------------------------------------------------------------- avatar emoji & giao diện
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

export function findItem(id: string | null | undefined): ShopItem | undefined {
  return id ? SHOP_ITEMS.find((i) => i.id === id) : undefined;
}

export type PurchaseState = {
  /** Số lần đã mua từng món. */
  owned: Record<string, number>;
  spent: number;
};

export type BuyResult =
  | { ok: true; spent: number; owned: Record<string, number> }
  | { ok: false; reason: 'không-đủ-sao' | 'đã-sở-hữu' | 'không-có-món-này' };

export function buy(state: PurchaseState, itemId: string, balance: number): BuyResult {
  const item = findItem(itemId);
  if (!item) return { ok: false, reason: 'không-có-món-này' };
  if (!item.repeatable && (state.owned[itemId] ?? 0) > 0) return { ok: false, reason: 'đã-sở-hữu' };
  if (balance < item.price) return { ok: false, reason: 'không-đủ-sao' };

  return {
    ok: true,
    spent: state.spent + item.price,
    owned: { ...state.owned, [itemId]: (state.owned[itemId] ?? 0) + 1 },
  };
}

/** Số sao còn lại: sao từ việc học + sao thưởng trận đấu − đã đổi. Không bao giờ âm. */
export function starBalance(studyStars: number, bonusStars: number, spent: number): number {
  return Math.max(0, Math.round(studyStars) + Math.max(0, Math.round(bonusStars)) - spent);
}

/** Cách cũ (chỉ có sao từ việc học) — giữ cho nơi gọi chưa có sao thưởng. */
export function balanceOf(lifetimeEarned: number, spent: number): number {
  return starBalance(lifetimeEarned, 0, spent);
}

/** Số hiển thị gọn: 1.234 · 12,3k. */
export function formatStars(n: number): string {
  return n >= 10000 ? `${(n / 1000).toFixed(1).replace('.', ',')}k` : n.toLocaleString('vi-VN');
}

// ---------------------------------------------------------------- đồng bộ hai máy

export type RewardPayload = PurchaseState & {
  avatar: string | null;
  cover: string | null;
  skin: string | null;
  mascot: string | null;
  frozenDays: string[];
  /** Lúc đổi đồ đang đeo gần nhất — máy nào đổi sau thì máy đó thắng phần đang đeo. */
  wornAt: string;
  /** Thưởng hạng tháng đã nhận: mã tháng YYYY-MM → số sao. */
  prizes?: Record<string, number>;
};

/**
 * Gộp hai máy: món đã mua lấy số lớn hơn, sao đã tiêu lấy số lớn hơn (không bao
 * giờ để số dư phình ra vì gộp), ngày giữ chuỗi lấy hợp, đồ đang đeo theo máy đổi sau.
 */
export function mergeReward(local: RewardPayload | null, remote: RewardPayload | null): RewardPayload | null {
  if (!local) return remote;
  if (!remote) return local;
  const owned: Record<string, number> = { ...remote.owned };
  for (const [id, n] of Object.entries(local.owned ?? {})) owned[id] = Math.max(owned[id] ?? 0, n);
  const worn = (local.wornAt ?? '') >= (remote.wornAt ?? '') ? local : remote;
  // Thưởng tháng: mỗi tháng một lần — hai máy cùng nhận thì vẫn chỉ là một khoản.
  const prizes: Record<string, number> = { ...(remote.prizes ?? {}) };
  for (const [month, n] of Object.entries(local.prizes ?? {})) prizes[month] = Math.max(prizes[month] ?? 0, n);
  return {
    owned,
    spent: Math.max(local.spent ?? 0, remote.spent ?? 0),
    frozenDays: [...new Set([...(local.frozenDays ?? []), ...(remote.frozenDays ?? [])])].sort(),
    avatar: worn.avatar ?? null,
    cover: worn.cover ?? null,
    skin: worn.skin ?? null,
    mascot: worn.mascot ?? null,
    wornAt: worn.wornAt ?? '',
    prizes,
  };
}
