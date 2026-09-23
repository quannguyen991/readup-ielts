import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Kết quả ĐỌC THEO (`app/shadow`): điểm cao nhất của từng câu trong từng bài,
 * và những từ hay bị máy nghe hụt — để người học thấy mình vấp ở âm nào.
 */
type ShadowState = {
  /** id bài → mã câu (`sentenceKey`, tính từ nội dung câu) → điểm cao nhất (0–100). */
  best: Record<string, Record<string, number>>;
  /** từ (chữ thường) → số lần đọc hụt. */
  missed: Record<string, number>;
  record: (lessonId: string, key: string, score: number, missedWords: string[]) => void;
  resetLesson: (lessonId: string) => void;
};

export const useShadowStore = create<ShadowState>()(
  persist(
    (set) => ({
      best: {},
      missed: {},
      record: (lessonId, key, score, missedWords) =>
        set((s) => {
          const lesson = s.best[lessonId] ?? {};
          const missed = { ...s.missed };
          for (const w of missedWords) missed[w] = (missed[w] ?? 0) + 1;
          return {
            best: { ...s.best, [lessonId]: { ...lesson, [key]: Math.max(lesson[key] ?? 0, score) } },
            missed,
          };
        }),
      resetLesson: (lessonId) =>
        set((s) => {
          const best = { ...s.best };
          delete best[lessonId];
          return { best };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}shadow`,
      storage: storage<ShadowState>(),
      version: 1,
      partialize: (s) => ({ best: s.best, missed: s.missed }) as ShadowState,
    },
  ),
);
