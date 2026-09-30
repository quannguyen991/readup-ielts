import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { dropOldMathQuiz } from '@/services/vocab/sat-slug-migration';

/**
 * Điểm cao nhất của quiz ôn từ vựng SAT, theo "chủ đề:mức". Chỉ ghi khi người
 * học làm xong một lượt — chưa làm thì không có dòng nào, và màn chủ đề hiện
 * "chưa làm" chứ không hiện 0/10.
 */
export type SatQuizBest = { score: number; total: number; at: string };

type SatQuizState = {
  best: Record<string, SatQuizBest>;
  record: (slug: string, level: number, score: number, total: number) => void;
};

export const satQuizKey = (slug: string, level: number) => `${slug}:${level}`;

export const useSatQuizStore = create<SatQuizState>()(
  persist(
    (set) => ({
      best: {},
      record: (slug, level, score, total) =>
        set((s) => {
          const key = satQuizKey(slug, level);
          const old = s.best[key];
          if (old && old.score / old.total >= score / total) return s;
          return { best: { ...s.best, [key]: { score, total, at: new Date().toISOString() } } };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}sat-quiz`,
      storage: storage<SatQuizState>(),
      version: 1,
      partialize: (s) => ({ best: s.best }) as SatQuizState,
      // Điểm quiz SAT Math làm trên bài cũ (6–8 từ) không còn đúng với bài 32 từ.
      merge: (persisted, current) => ({ ...current, best: dropOldMathQuiz((persisted as Partial<SatQuizState> | undefined)?.best) }),
    },
  ),
);
