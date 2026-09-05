import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { applyOutcome, emptyLedger, record, type ProbeOutcome } from '@/services/mastery/ledger';
import type { Ledger, Observation } from '@/services/mastery/types';

/**
 * Sổ bằng chứng học tập, lưu trên máy người dùng.
 *
 * Store này CỐ Ý MỎNG: mọi luật nằm trong `services/mastery/ledger.ts`, ở đây chỉ
 * có lưu trữ. Luật quyết định "đã hiểu hay chưa" phải kiểm được bằng test thuần,
 * không kéo theo React và không kéo theo tầng lưu trữ — vì đó là phần dễ bị sửa
 * lén nhất và cũng là phần đắt nhất nếu sai.
 */

type State = {
  ledger: Ledger;
  observe: (obs: Observation) => void;
  resolve: (outcome: ProbeOutcome) => void;
  clear: () => void;
};

export const useMasteryStore = create<State>()(
  persist(
    (set) => ({
      ledger: emptyLedger(),
      observe: (obs) => set((s) => ({ ledger: record(s.ledger, obs) })),
      resolve: (outcome) => set((s) => ({ ledger: applyOutcome(s.ledger, outcome) })),
      clear: () => set({ ledger: emptyLedger() }),
    }),
    { name: `${STORAGE_PREFIX}mastery`, storage: storage<State>() },
  ),
);

/**
 * Ghi một quan sát mà KHÔNG cần component phải là hook-aware.
 *
 * Các màn luyện gọi từ trong handler, đôi khi từ callback sâu; bắt chúng lấy hook
 * ra rồi truyền xuống chỉ làm rối. `getState()` ở đây là đúng chỗ dùng của nó.
 */
export function observeSkill(obs: Observation): void {
  useMasteryStore.getState().observe(obs);
}

export function resolveProbe(outcome: ProbeOutcome): void {
  useMasteryStore.getState().resolve(outcome);
}
