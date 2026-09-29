import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { buy as applyBuy, findItem, type PurchaseState, type RewardPayload } from '@/services/gamification/shop';
import { dateKey, shiftDays } from '@/services/gamification/points';
import type { MascotId } from '@/services/game/mascots';
import type { SkinId } from '@/components/game/sprites';

/**
 * Những gì người học ĐÃ ĐỔI và ĐANG ĐEO ở trang Đổi quà.
 *
 * Kho này KHÔNG giữ số sao kiếm được: sao luôn tính lại từ nhật ký học
 * (`services/gamification/points.ts`) cộng sao thưởng của game. Giữ thêm một biến
 * "tổng sao" ở đây là tạo ra nguồn sự thật thứ hai, và hai nguồn thì sớm muộn cũng
 * lệch — lúc ấy không ai biết số nào đúng. Ở đây chỉ có phần KHÔNG suy ra được:
 * đã tiêu bao nhiêu, sở hữu món gì, đang đeo gì, và những ngày đã dùng thẻ giữ chuỗi.
 */
export type WearSlot = 'avatar' | 'cover' | 'effect' | 'skin' | 'mascot' | 'theme' | 'studyBg';

type RewardState = PurchaseState & {
  /** Avatar đang đeo — mã món (emoji hoặc avatar động), hoặc null là chữ cái đầu tên. */
  avatar: string | null;
  cover: string | null;
  /** Hiệu ứng hồ sơ kiểu Discord đang đeo. */
  effect: string | null;
  /** Giao diện toàn diện đang áp dụng. */
  theme: string | null;
  /** Nền học đang dùng (sau mọi màn học), hoặc null là nền lưới mặc định. */
  studyBg: string | null;
  skin: string | null;
  mascot: string | null;
  wornAt: string;
  /** Ngày đã được thẻ giữ chuỗi bảo vệ, dạng YYYY-MM-DD. */
  frozenDays: string[];
  /** Thưởng hạng tháng đã nhận: YYYY-MM → số sao. Sao này cộng thẳng vào số dư. */
  prizes: Record<string, number>;
  buy: (itemId: string, balance: number) => { ok: boolean; reason?: string };
  equipAvatar: (itemId: string | null) => void;
  /** Đeo / bỏ đeo một món ở một ô. Chỉ đeo được món đã sở hữu. */
  equip: (slot: WearSlot, itemId: string | null) => void;
  /** Dùng một thẻ đã mua để giữ chuỗi cho các ngày trống gần nhất. */
  spendFreeze: (itemId: string, today?: Date) => boolean;
  /** Nhận thưởng hạng của một tháng; đã nhận tháng đó rồi thì trả false. */
  claimPrize: (month: string, stars: number) => boolean;
};

export const useRewardStore = create<RewardState>()(
  persist(
    (set, get) => ({
      owned: {},
      spent: 0,
      avatar: null,
      cover: null,
      effect: null,
      theme: null,
      studyBg: null,
      skin: null,
      mascot: null,
      wornAt: '',
      frozenDays: [],
      prizes: {},

      buy: (itemId, balance) => {
        const state = get();
        const result = applyBuy({ owned: state.owned, spent: state.spent }, itemId, balance);
        if (!result.ok) return { ok: false, reason: result.reason };
        set({ owned: result.owned, spent: result.spent });
        return { ok: true };
      },

      equipAvatar: (itemId) => get().equip('avatar', itemId),

      equip: (slot, itemId) => {
        // Chỉ đeo được món đã mua; gọi với null là bỏ đeo.
        if (itemId !== null && (get().owned[itemId] ?? 0) === 0) return;
        set({ [slot]: itemId, wornAt: new Date().toISOString() } as Partial<RewardState>);
      },

      spendFreeze: (itemId, today = new Date()) => {
        const item = findItem(itemId);
        const state = get();
        const left = (state.owned[itemId] ?? 0) - 0;
        if (!item || item.kind !== 'freeze' || left <= 0) return false;

        /*
          Giữ NGÀY HÔM QUA trở về trước, không giữ hôm nay: hôm nay vẫn còn cả
          ngày để học thật, tiêu thẻ vào đó là tiêu phí.
        */
        const days: string[] = [];
        for (let back = 1; days.length < (item.freezeDays ?? 1) && back < 14; back += 1) {
          const key = dateKey(shiftDays(today, -back));
          if (!state.frozenDays.includes(key)) days.push(key);
        }
        if (days.length === 0) return false;

        set({
          owned: { ...state.owned, [itemId]: left - 1 },
          frozenDays: [...state.frozenDays, ...days],
        });
        return true;
      },

      claimPrize: (month, stars) => {
        const prizes = get().prizes ?? {};
        if (stars <= 0 || (prizes[month] ?? 0) > 0) return false;
        set({ prizes: { ...prizes, [month]: stars } });
        return true;
      },
    }),
    {
      name: `${STORAGE_PREFIX}reward`,
      storage: storage(),
      version: 1,
      partialize: (s) => ({ owned: s.owned, spent: s.spent, avatar: s.avatar, cover: s.cover, effect: s.effect ?? null, theme: s.theme ?? null, studyBg: s.studyBg ?? null, skin: s.skin, mascot: s.mascot, wornAt: s.wornAt, frozenDays: s.frozenDays, prizes: s.prizes }) as RewardState,
    },
  ),
);

/** Skin đang đeo (mặc định Hiệp sĩ xanh). */
export function skinOf(skinItemId: string | null): SkinId {
  return findItem(skinItemId)?.skin ?? 'knight';
}

/** Linh vật đang đeo, hoặc null. */
export function mascotOf(mascotItemId: string | null): MascotId | null {
  return findItem(mascotItemId)?.mascot ?? null;
}

/** Dữ liệu để đồng bộ tài khoản (`services/sync/stores.ts`). */
export function rewardPayload(): RewardPayload {
  const s = useRewardStore.getState();
  // Phải mang ĐỦ mọi ô đang đeo. Bản cũ quên `theme` → mỗi lần đồng bộ, giao diện
  // đang dùng bị gộp thành rỗng và người dùng vào lại thấy mất (sửa 30/09/2026).
  return {
    owned: s.owned,
    spent: s.spent,
    avatar: s.avatar,
    cover: s.cover,
    effect: s.effect ?? null,
    theme: s.theme ?? null,
    studyBg: s.studyBg ?? null,
    skin: s.skin,
    mascot: s.mascot,
    wornAt: s.wornAt,
    frozenDays: s.frozenDays,
    prizes: s.prizes ?? {},
  };
}
