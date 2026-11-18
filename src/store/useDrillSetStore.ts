import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/** Điểm các set luyện theo dạng: lưu điểm tốt nhất và lần làm gần nhất của từng set (chỉ ở máy). */
export type DrillSetResult = { best: number; last: number; total: number; at: number };

/** Cộng dồn độ chính xác của từng dạng câu hỏi qua mọi lượt làm. */
export type TypeTally = { correct: number; total: number };

/** Một lượt làm đã chấm: dùng vẽ xu hướng band và lịch sử. */
export type DrillAttempt = { at: number; skill: 'reading' | 'listening'; label: string; correct: number; total: number; band: number; seconds: number };

const MAX_ATTEMPTS = 40;

type State = {
  results: Record<string, DrillSetResult>;
  typeStats: Record<string, TypeTally>;
  attempts: DrillAttempt[];
  record: (setId: string, score: number, total: number) => void;
  /** Ghi một lượt đã chấm chi tiết: cộng dồn theo dạng và thêm vào lịch sử. */
  recordReport: (attempt: DrillAttempt, byType: Array<{ typeId: string; correct: number; total: number }>) => void;
};

export const useDrillSetStore = create<State>()(
  persist(
    (set) => ({
      results: {},
      typeStats: {},
      attempts: [],
      record: (setId, score, total) =>
        set((s) => {
          const prev = s.results[setId];
          return { results: { ...s.results, [setId]: { best: Math.max(prev?.best ?? 0, score), last: score, total, at: Date.now() } } };
        }),
      recordReport: (attempt, byType) =>
        set((s) => {
          const typeStats = { ...s.typeStats };
          for (const t of byType) {
            const cur = typeStats[t.typeId] ?? { correct: 0, total: 0 };
            typeStats[t.typeId] = { correct: cur.correct + t.correct, total: cur.total + t.total };
          }
          return { typeStats, attempts: [attempt, ...s.attempts].slice(0, MAX_ATTEMPTS) };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}drill-sets`,
      storage: storage<State>(),
      version: 2,
      partialize: (s) => ({ results: s.results, typeStats: s.typeStats, attempts: s.attempts }) as State,
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<State>;
        return { results: p.results ?? {}, typeStats: p.typeStats ?? {}, attempts: p.attempts ?? [] } as State;
      },
    },
  ),
);

/** Độ chính xác tích lũy (%) của một dạng, hoặc null nếu chưa làm câu nào. */
export function typeAccuracy(stats: Record<string, TypeTally>, typeId: string): number | null {
  const t = stats[typeId];
  return t && t.total > 0 ? Math.round((t.correct / t.total) * 100) : null;
}
