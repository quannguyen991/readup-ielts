import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import type { WeeklyResult } from '@/services/weekly/challenge';

/**
 * Kết quả Đề của tuần của người dùng này, theo mã tuần.
 *
 * CHỈ GHI LẦN ĐẦU: `record` bỏ qua nếu tuần đó đã có kết quả — lần làm lại là
 * luyện tập, không đổi điểm trên bảng. Đồng bộ lên tài khoản qua `sync/stores.ts`
 * (khoá `weekly`), và máy chủ đọc chính khoá ấy để xếp hạng cả nước.
 */
type WeeklyState = {
  results: Record<string, WeeklyResult>;
  record: (week: string, result: WeeklyResult) => boolean;
};

export const useWeeklyStore = create<WeeklyState>()(
  persist(
    (set, get) => ({
      results: {},
      record: (week, result) => {
        if (get().results[week]) return false;
        set((s) => ({ results: { ...s.results, [week]: result } }));
        return true;
      },
    }),
    {
      name: `${STORAGE_PREFIX}weekly`,
      storage: storage<WeeklyState>(),
      version: 1,
      partialize: (s) => ({ results: s.results }) as WeeklyState,
    },
  ),
);
