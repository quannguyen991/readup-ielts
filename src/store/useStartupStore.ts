import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage, todayKey, uid } from './persist';
import { useStudyAbroadStore } from './useStudyAbroadStore';
import { BASE_RECIPES, CUSTOM_NAMES, SHOP_CITIES, SHOP_COLORS, SHOP_NAMES, type Recipe } from '@/data/startup-menu';
import type { ShopOrder } from '@/data/startup-orders';
import { recordSale, recordWaste, shopBalance, type CapitalReason, type SaleReason } from '@/services/startup/economy';
import { createCustomRecipe, recipeCost, type CustomReason } from '@/services/startup/recipes';
import { findRecipe, scoreServe, type ServePick } from '@/services/startup/orders';
import { type Shop } from '@/services/startup/sync';
import type { Ledger } from '@/services/travel/economy';

export type OpenOutcome = 'ok' | 'already' | 'poor' | 'invalid';
export type ServeOutcome = { correct: boolean; paid: number; reason: SaleReason | 'wrong' | 'no-shop' };
export type CustomOutcome = { ok: true; recipe: Recipe } | { ok: false; reason: CustomReason };

type StartupState = {
  shops: Record<string, Shop>;
  ledger: Ledger;
  customRecipes: Recipe[];
  openShop: (city: string, nameIndex: number, colorIndex: number) => OpenOutcome;
  serve: (city: string, order: ShopOrder, pick: ServePick, attemptId: string) => ServeOutcome;
  addCustomRecipe: (nameIndex: number, ingredients: readonly string[]) => CustomOutcome;
  reset: () => void;
};

export const useStartupStore = create<StartupState>()(
  persist(
    (set, get) => ({
      shops: {},
      ledger: {},
      customRecipes: [],
      openShop: (city, nameIndex, colorIndex) => {
        const state = get();
        if (state.shops[city]) return 'already';
        const name = SHOP_NAMES[nameIndex];
        const color = SHOP_COLORS[colorIndex];
        if (!name || !color || !(SHOP_CITIES as readonly string[]).includes(city)) return 'invalid';
        // Vốn trừ trong sổ đồng du học TRƯỚC; lần mở sau nếu đã trừ rồi (`already`) thì mở mà không trừ lại.
        const charge: CapitalReason = useStudyAbroadStore.getState().chargeShopCapital(city);
        if (charge === 'poor') return 'poor';
        set({ shops: { ...state.shops, [city]: { city, name, color, openedAt: new Date().toISOString() } } });
        return 'ok';
      },
      serve: (city, order, pick, attemptId) => {
        const state = get();
        if (!state.shops[city]) return { correct: false, paid: 0, reason: 'no-shop' };
        const recipe = findRecipe(pick.drinkId, [...BASE_RECIPES, ...state.customRecipes]);
        if (!recipe) return { correct: false, paid: 0, reason: 'wrong' };
        if (!scoreServe(order, recipe, pick).correct) {
          // Đơn sai: không doanh thu, nhưng nguyên liệu đã dùng bị trừ (một lần cho mỗi khách).
          set({ ledger: recordWaste(state.ledger, todayKey(), attemptId, recipeCost(recipe.ingredients)) });
          return { correct: false, paid: 0, reason: 'wrong' };
        }
        const sale = recordSale(state.ledger, todayKey(), attemptId, recipe.price, recipeCost(recipe.ingredients));
        set({ ledger: sale.ledger });
        return { correct: true, paid: sale.paid, reason: sale.reason };
      },
      addCustomRecipe: (nameIndex, ingredients) => {
        const state = get();
        const name = CUSTOM_NAMES[nameIndex];
        if (!name) return { ok: false, reason: 'bad-name' };
        const outcome = createCustomRecipe({ id: `custom-${uid()}`, name, ingredients }, [...BASE_RECIPES, ...state.customRecipes]);
        if (!outcome.ok) return outcome;
        set({ customRecipes: [...state.customRecipes, outcome.recipe] });
        return outcome;
      },
      reset: () => set({ shops: {}, ledger: {}, customRecipes: [] }),
    }),
    {
      name: `${STORAGE_PREFIX}startup`,
      storage: storage<StartupState>(),
      version: 1,
      partialize: (state) => ({ shops: state.shops, ledger: state.ledger, customRecipes: state.customRecipes }) as StartupState,
      merge: (persisted, current) => {
        const saved = persisted as Partial<StartupState>;
        return {
          ...current,
          ...saved,
          shops: { ...(saved.shops ?? {}) },
          ledger: { ...(saved.ledger ?? {}) },
          customRecipes: [...(saved.customRecipes ?? [])],
          openShop: current.openShop,
          serve: current.serve,
          addCustomRecipe: current.addCustomRecipe,
          reset: current.reset,
        };
      },
    },
  ),
);

/** Số dư quán để hiển thị. Đọc ở đây để màn hình không tự tính lại luật. */
export const selectShopBalance = (state: { ledger: Ledger }) => shopBalance(state.ledger);
