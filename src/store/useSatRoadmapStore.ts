import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import type { LevelBest, PracticeKey, RoadmapProgress } from '@/data/sat-roadmap/progress';

/**
 * Tiến độ Lộ trình SAT Math theo chủ đề: điểm cao nhất và số lượt đã làm của
 * từng (chương, mức). Đồng bộ lên tài khoản bằng khoá `sat_roadmap`.
 */
export type { LevelBest, PracticeKey, RoadmapProgress } from '@/data/sat-roadmap/progress';

type State = {
  progress: RoadmapProgress;
  record: (chapter: string, level: PracticeKey, correct: number, total: number) => void;
};

export const useSatRoadmapStore = create<State>()(
  persist(
    (set) => ({
      progress: {},
      record: (chapter, level, correct, total) =>
        set((s) => {
          const cur = s.progress[chapter]?.[level];
          const better = !cur || correct / total > cur.correct / cur.total;
          const next: LevelBest = better
            ? { correct, total, rounds: (cur?.rounds ?? 0) + 1, at: new Date().toISOString() }
            : { ...cur, rounds: cur.rounds + 1 };
          return { progress: { ...s.progress, [chapter]: { ...(s.progress[chapter] ?? {}), [level]: next } } };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}sat-roadmap`,
      storage: storage<State>(),
      version: 1,
      partialize: (s) => ({ progress: s.progress }) as State,
    },
  ),
);

export { mergeRoadmapProgress } from '@/data/sat-roadmap/progress';
