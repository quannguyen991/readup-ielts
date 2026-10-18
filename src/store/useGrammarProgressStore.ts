import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Tiến độ ngữ pháp của người học trên máy: bài nào đã đạt (kiểm tra cuối ≥ 4/5),
 * và điểm cao nhất của từng bài. Dùng để gợi ý "bài tiếp theo" và hiện huy hiệu.
 */
type GrammarProgressState = {
  best: Record<string, number>;
  record: (id: string, score: number) => void;
};

export const PASS_SCORE = 4;

export const useGrammarProgressStore = create<GrammarProgressState>()(
  persist(
    (set, get) => ({
      best: {},
      record: (id, score) => {
        const prev = get().best[id] ?? -1;
        if (score > prev) set({ best: { ...get().best, [id]: score } });
      },
    }),
    {
      name: `${STORAGE_PREFIX}grammar-progress`,
      storage: storage<GrammarProgressState>(),
      version: 1,
      partialize: (s) => ({ best: s.best }) as GrammarProgressState,
    },
  ),
);

export function isPassed(best: Record<string, number>, id: string): boolean {
  return (best[id] ?? -1) >= PASS_SCORE;
}
