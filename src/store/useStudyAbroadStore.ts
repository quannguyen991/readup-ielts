import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage, todayKey } from './persist';
import { DEFAULT_DORM_DECORATIONS, STUDY_ABROAD_DECORATIONS, type DormSlot } from '@/data/study-abroad-dorm';
import { SG_APARTMENT, buy, canEquip, checkBuy, currentStudyDay, recordShift, settleApartmentRent, shiftDayKey, type BuyCheck, type ShiftReason } from '@/services/study-abroad/economy';
import { chargeCapital, type CapitalReason } from '@/services/startup/economy';
import type { Ledger } from '@/services/travel/economy';

export type BuyOutcome = 'invalid' | 'locked' | BuyCheck;

type StudyAbroadState = {
  completed: string[];
  decorations: Record<DormSlot, string>;
  restedAt: string | null;
  ledger: Ledger;
  completeMission: (id: string) => void;
  setDecoration: (slot: DormSlot, itemId: string) => void;
  buyDecoration: (slot: DormSlot, itemId: string) => BuyOutcome;
  workShift: (attemptId: string, correct: number) => { paid: number; reason: ShiftReason };
  chargeShopCapital: (city: string) => CapitalReason;
  rest: () => void;
  reset: () => void;
};

export const useStudyAbroadStore = create<StudyAbroadState>()(
  persist(
    (set, get) => ({
      completed: [],
      decorations: { ...DEFAULT_DORM_DECORATIONS },
      restedAt: null,
      ledger: {},
      completeMission: (id) => set((state) => {
        if (state.completed.includes(id)) return state;
        const completed = [...state.completed, id];
        return { completed, ledger: settleApartmentRent(state.ledger, completed) };
      }),
      setDecoration: (slot, itemId) => set((state) => {
        const item = STUDY_ABROAD_DECORATIONS.find((decoration) => decoration.id === itemId && decoration.slot === slot);
        if (!item || !canEquip(item, state.completed, state.ledger)) return state;
        return { decorations: { ...state.decorations, [slot]: itemId } };
      }),
      buyDecoration: (slot, itemId) => {
        const state = get();
        const item = STUDY_ABROAD_DECORATIONS.find((decoration) => decoration.id === itemId && decoration.slot === slot);
        if (!item || !item.price) return 'invalid';
        if (item.unlockMission && !state.completed.includes(item.unlockMission)) return 'locked';
        // Thanh toán tiền thuê trước khi kiểm tra: một đồng đã kiếm được không bị báo "còn nợ" vì chưa kịp trừ.
        const settled = settleApartmentRent(state.ledger, state.completed);
        const check = checkBuy(settled, SG_APARTMENT.city, currentStudyDay(state.completed), item);
        if (check !== 'ok') {
          set({ ledger: settled });
          return check;
        }
        set({ ledger: buy(settled, item), decorations: { ...state.decorations, [slot]: item.id } });
        return 'ok';
      },
      workShift: (attemptId, correct) => {
        const state = get();
        const outcome = recordShift(state.ledger, shiftDayKey(state.completed, todayKey()), attemptId, correct);
        set({ ledger: settleApartmentRent(outcome.ledger, state.completed) });
        return { paid: outcome.paid, reason: outcome.reason };
      },
      chargeShopCapital: (city) => {
        const result = chargeCapital(get().ledger, city);
        if (result.reason === 'ok') set({ ledger: result.ledger });
        return result.reason;
      },
      rest: () => set({ restedAt: new Date().toISOString() }),
      reset: () => set({ completed: [], decorations: { ...DEFAULT_DORM_DECORATIONS }, restedAt: null, ledger: {} }),
    }),
    {
      name: `${STORAGE_PREFIX}study-abroad`,
      storage: storage<StudyAbroadState>(),
      // Giữ version 1: không có migrate, đổi version sẽ làm mất dữ liệu đã lưu.
      version: 1,
      partialize: (state) => ({ completed: state.completed, decorations: state.decorations, restedAt: state.restedAt, ledger: state.ledger }) as StudyAbroadState,
      merge: (persisted, current) => {
        const saved = persisted as Partial<StudyAbroadState>;
        return {
          ...current,
          ...saved,
          decorations: { ...DEFAULT_DORM_DECORATIONS, ...(saved.decorations ?? {}) },
          ledger: { ...(saved.ledger ?? {}) },
          completeMission: current.completeMission,
          setDecoration: current.setDecoration,
          buyDecoration: current.buyDecoration,
          workShift: current.workShift,
          chargeShopCapital: current.chargeShopCapital,
          rest: current.rest,
          reset: current.reset,
        };
      },
    },
  ),
);
