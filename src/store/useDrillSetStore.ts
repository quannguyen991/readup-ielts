import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/** Điểm các set luyện theo dạng: lưu điểm tốt nhất và lần làm gần nhất của từng set (chỉ ở máy). */
export type DrillSetResult = { best: number; last: number; total: number; at: number };

type State = {
  results: Record<string, DrillSetResult>;
  record: (setId: string, score: number, total: number) => void;
};

export const useDrillSetStore = create<State>()(
  persist(
    (set) => ({
      results: {},
      record: (setId, score, total) =>
        set((s) => {
          const prev = s.results[setId];
          return { results: { ...s.results, [setId]: { best: Math.max(prev?.best ?? 0, score), last: score, total, at: Date.now() } } };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}drill-sets`,
      storage: storage<State>(),
      version: 1,
      partialize: (s) => ({ results: s.results }) as State,
    },
  ),
);
