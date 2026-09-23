import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import type { WordStage } from '@/services/vocab/topic-study';

/**
 * Tiến độ học theo từng bộ từ chủ đề: mỗi từ đang ở chặng nào, và điểm cao của
 * trò chơi.
 *
 * Tách khỏi sổ từ FSRS (`useVocabStore`) có chủ ý: sổ từ là những từ người học
 * CHỌN giữ lại để ôn dài hạn; còn đây chỉ ghi "trong bộ 50 từ này, tôi đã đi
 * tới đâu". Học xong một từ ở đây không tự đẩy nó vào lịch ôn — người học tự
 * bấm lưu nếu muốn.
 */
export type GameScore = { score: number; at: string };

type TopicStudyState = {
  /** slug → từ → chặng (0 chưa học, 1 nhận ra, 2 nhớ được). */
  stages: Record<string, Record<string, WordStage>>;
  /** slug → năm điểm cao nhất của trò chơi, giảm dần. */
  scores: Record<string, GameScore[]>;
  setStage: (slug: string, word: string, stage: WordStage) => void;
  addScore: (slug: string, score: number) => void;
  resetTopic: (slug: string) => void;
};

export const useTopicStudyStore = create<TopicStudyState>()(
  persist(
    (set) => ({
      stages: {},
      scores: {},
      setStage: (slug, word, stage) =>
        set((s) => ({ stages: { ...s.stages, [slug]: { ...(s.stages[slug] ?? {}), [word]: stage } } })),
      addScore: (slug, score) =>
        set((s) => ({
          scores: {
            ...s.scores,
            [slug]: [...(s.scores[slug] ?? []), { score, at: new Date().toISOString() }]
              .sort((a, b) => b.score - a.score)
              .slice(0, 5),
          },
        })),
      resetTopic: (slug) =>
        set((s) => {
          const stages = { ...s.stages };
          delete stages[slug];
          return { stages };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}topic-study`,
      storage: storage<TopicStudyState>(),
      version: 1,
      partialize: (s) => ({ stages: s.stages, scores: s.scores }) as TopicStudyState,
    },
  ),
);

/** Số từ đã NHỚ được (chặng 2) trong một bộ. */
export function masteredCount(stages: Record<string, WordStage> | undefined): number {
  return Object.values(stages ?? {}).filter((v) => v === 2).length;
}
