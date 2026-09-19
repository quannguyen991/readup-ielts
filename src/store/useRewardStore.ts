import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { buy as applyBuy, findItem, type PurchaseState } from '@/services/gamification/shop';
import { dateKey, shiftDays } from '@/services/gamification/points';

/**
 * Những gì người học ĐÃ TIÊU và ĐÃ SỞ HỮU ở Cửa hàng.
 *
 * Kho này KHÔNG giữ số điểm kiếm được: điểm luôn tính lại từ nhật ký học
 * (`services/gamification/points.ts`). Giữ thêm một biến "tổng điểm" ở đây là
 * tạo ra nguồn sự thật thứ hai, và hai nguồn thì sớm muộn cũng lệch — lúc ấy
 * không ai biết số nào đúng. Ở đây chỉ có phần KHÔNG suy ra được: đã tiêu bao
 * nhiêu, sở hữu món gì, đang đeo avatar nào, và những ngày đã dùng thẻ giữ chuỗi.
 */
type RewardState = PurchaseState & {
  /** Avatar đang đeo — id món trong cửa hàng, hoặc null là chữ cái đầu tên. */
  avatar: string | null;
  /** Ngày đã được thẻ giữ chuỗi bảo vệ, dạng YYYY-MM-DD. */
  frozenDays: string[];
  buy: (itemId: string, balance: number) => { ok: boolean; reason?: string };
  equipAvatar: (itemId: string | null) => void;
  /** Dùng một thẻ đã mua để giữ chuỗi cho các ngày trống gần nhất. */
  spendFreeze: (itemId: string, today?: Date) => boolean;
};

export const useRewardStore = create<RewardState>()(
  persist(
    (set, get) => ({
      owned: {},
      spent: 0,
      avatar: null,
      frozenDays: [],

      buy: (itemId, balance) => {
        const state = get();
        const result = applyBuy({ owned: state.owned, spent: state.spent }, itemId, balance);
        if (!result.ok) return { ok: false, reason: result.reason };
        set({ owned: result.owned, spent: result.spent });
        return { ok: true };
      },

      equipAvatar: (itemId) => {
        // Chỉ đeo được món đã mua; gọi với null là bỏ đeo.
        if (itemId !== null && (get().owned[itemId] ?? 0) === 0) return;
        set({ avatar: itemId });
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
    }),
    {
      name: `${STORAGE_PREFIX}reward`,
      storage: storage(),
      version: 1,
    },
  ),
);
