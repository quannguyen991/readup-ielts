import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { GrammarLevel } from '@/services/hub/grammar-course';
import { type LevelTestBest, type LevelTestRecord } from '@/services/hub/level-test';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Kết quả đề kiểm tra ngữ pháp theo cấp độ: điểm cao nhất và số lần làm của từng cấp.
 * Đồng bộ qua store `grammar_tests` trong services/sync/stores.ts.
 */
type LevelTestState = {
  best: LevelTestRecord;
  record: (level: GrammarLevel, percent: number) => void;
};

export const useLevelTestStore = create<LevelTestState>()(
  persist(
    (set, get) => ({
      best: {},
      record: (level, percent) => {
        const prev = get().best[level];
        const attempts = (prev?.attempts ?? 0) + 1;
        const next: LevelTestBest = !prev || percent >= prev.percent
          ? { percent, at: new Date().toISOString(), attempts }
          : { ...prev, attempts };
        set((s) => ({ best: { ...s.best, [level]: next } }));
      },
    }),
    {
      name: `${STORAGE_PREFIX}level-test`,
      storage: storage<LevelTestState>(),
      version: 1,
      partialize: (s) => ({ best: s.best }) as LevelTestState,
    },
  ),
);
