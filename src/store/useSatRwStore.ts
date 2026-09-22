import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import type { RwAttempt } from '@/services/sat-rw/progress';

/**
 * Lần làm gần nhất của từng câu SAT Verbal.
 *
 * Trước đây màn Verbal chỉ cộng "số câu đã làm" vào nhật ký học chung, nên
 * trang Verbal không biết kỹ năng nào đã làm, đúng bao nhiêu. Giữ theo id câu
 * (không theo lượt) để con số "đã làm" là số câu khác nhau — xem
 * `services/sat-rw/progress.ts`.
 */
type SatRwState = {
  attempts: Record<string, RwAttempt>;
  record: (questionId: string, correct: boolean, ms: number) => void;
};

export const useSatRwStore = create<SatRwState>()(
  persist(
    (set) => ({
      attempts: {},
      record: (questionId, correct, ms) =>
        set((s) => ({
          attempts: {
            ...s.attempts,
            // Trần 10 phút mỗi câu: bỏ máy đi ăn cơm không phải là thời gian nghĩ.
            [questionId]: { correct, ms: Math.min(Math.max(0, ms), 600_000), at: new Date().toISOString() },
          },
        })),
    }),
    {
      name: `${STORAGE_PREFIX}sat-rw`,
      storage: storage<SatRwState>(),
      version: 1,
      partialize: (s) => ({ attempts: s.attempts }) as SatRwState,
    },
  ),
);

/** Gọi từ handler chấm câu — không cần hook. */
export function recordRwAttempt(questionId: string, correct: boolean, ms: number): void {
  useSatRwStore.getState().record(questionId, correct, ms);
}
