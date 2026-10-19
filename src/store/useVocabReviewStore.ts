import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Điểm cao nhất của từng bài ôn tập từ vựng, theo khoá "bài:chế độ" (ví dụ "A1-3:mcq").
 * Chỉ lưu điểm cao nhất, không lưu đáp án từng câu.
 */
type VocabReviewState = {
  best: Record<string, { score: number; total: number }>;
  record: (key: string, score: number, total: number) => void;
};

export const useVocabReviewStore = create<VocabReviewState>()(
  persist(
    (set, get) => ({
      best: {},
      record: (key, score, total) => {
        const prev = get().best[key];
        if (prev && prev.score >= score) return;
        set({ best: { ...get().best, [key]: { score, total } } });
      },
    }),
    {
      name: `${STORAGE_PREFIX}vocab-review`,
      storage: storage<VocabReviewState>(),
      version: 1,
      partialize: (s) => ({ best: s.best }) as VocabReviewState,
    },
  ),
);
