import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { useRewardStore } from './useRewardStore';
import { blueprint, canBuild, demolishRefund, type BlueprintId, type BuildCheck } from '@/services/city/blueprints';
import { isInnerLot } from '@/services/city/layout';
import { add, earnFromAnswers, EMPTY_MATERIALS, starCost, subtract, type MaterialKind } from '@/services/city/materials';
import { EMPTY_CITY, type CityPayload } from '@/services/city/sync';
import { vnToday } from '@/services/gamification/golden';

/**
 * Thành phố Tri thức của người học: vật liệu đang có, nhà đã xây, sổ vật liệu
 * đã kiếm trong ngày (để tính trần). Luật nằm ở `src/services/city/*`.
 */
type CityActions = {
  /** Cộng vật liệu cho `correct` câu đúng của một nguồn. Trả số thực nhận. */
  earn: (source: string, correct: number) => number;
  build: (plotId: string, type: BlueprintId) => BuildCheck;
  demolish: (plotId: string) => boolean;
  /** Mua vật liệu bằng sao ở Chợ vật liệu. */
  buy: (kind: MaterialKind, qty: number, starBalance: number) => boolean;
  /** Quà khởi công một lần: vừa đủ ngôi nhà 2 tầng đầu tiên. */
  claimGift: () => boolean;
};

export type CityState = CityPayload & CityActions;

/** Đủ đúng một Nhà 2 tầng — người mới vào thấy ngay thành phố mọc lên. */
export const STARTER_GIFT = { wood: 30, brick: 20, glass: 4 } as const;

const stamp = () => new Date().toISOString();

export const useCityStore = create<CityState>()(
  persist(
    (set, get) => ({
      ...EMPTY_CITY,

      earn: (source, correct) => {
        const s = get();
        const r = earnFromAnswers(s.inventory, s.daily, source, correct, vnToday(new Date()).key);
        if (r.gained > 0) set({ inventory: r.inventory, daily: r.daily, updatedAt: stamp() });
        return r.gained;
      },

      build: (plotId, type) => {
        const s = get();
        const check = canBuild(type, plotId, s.plots, s.inventory, isInnerLot);
        if (!check.ok) return check;
        set({
          inventory: subtract(s.inventory, blueprint(type)!.cost),
          plots: { ...s.plots, [plotId]: { type, builtAt: stamp() } },
          updatedAt: stamp(),
        });
        return check;
      },

      demolish: (plotId) => {
        const s = get();
        const p = s.plots[plotId];
        if (!p) return false;
        const rest = { ...s.plots };
        delete rest[plotId];
        set({ plots: rest, inventory: add(s.inventory, demolishRefund(p.type)), updatedAt: stamp() });
        return true;
      },

      buy: (kind, qty, starBalance) => {
        const cost = starCost(kind, qty);
        if (cost <= 0) return false;
        if (!useRewardStore.getState().spendStars(cost, starBalance)) return false;
        const s = get();
        set({ inventory: add(s.inventory, { [kind]: qty }), updatedAt: stamp() });
        return true;
      },

      claimGift: () => {
        const s = get();
        if (s.giftClaimed) return false;
        set({ giftClaimed: true, inventory: add(s.inventory, STARTER_GIFT), updatedAt: stamp() });
        return true;
      },
    }),
    {
      name: `${STORAGE_PREFIX}city`,
      storage: storage<CityState>(),
      version: 3,
      // Bản cũ (bộ thành phố thử nghiệm trước 29/09) khác hẳn cấu trúc: bắt đầu lại sạch.
      migrate: () => ({ ...EMPTY_CITY }) as CityState,
      partialize: (s) =>
        ({ inventory: s.inventory, plots: s.plots, daily: s.daily, giftClaimed: s.giftClaimed, updatedAt: s.updatedAt }) as CityState,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CityPayload>;
        return { ...current, ...p, inventory: { ...EMPTY_MATERIALS, ...(p.inventory ?? {}) }, plots: p.plots ?? {} };
      },
    },
  ),
);

export function cityPayload(): CityPayload {
  const s = useCityStore.getState();
  return { inventory: s.inventory, plots: s.plots, daily: s.daily, giftClaimed: s.giftClaimed, updatedAt: s.updatedAt };
}
