import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PathExam } from '@/data/learning-path/types';
import { STORAGE_PREFIX, storage } from './persist';

/**
 * Lựa chọn của người học ở màn Lộ trình học (`app/lo-trinh-hoc.tsx`): kỳ thi,
 * trình độ đã chọn cho từng kỳ, và những bài TỰ ĐÁNH DẤU là xong (chỉ loại bài
 * app không đo được — xem `services/learning-path/progress.ts`).
 *
 * Chỉ lưu trên máy, không đồng bộ: tiến độ thật của các bài đo được vốn đã
 * nằm trong những kho học có đồng bộ; ở đây chỉ còn lựa chọn giao diện và vài
 * dấu tự đánh.
 *
 * `exam` / `levels` là null cho tới khi người học tự chọn — lúc đó màn hình
 * lấy mặc định từ lộ trình cá nhân (`defaultExamFor` / `defaultLevelFor`).
 */
type LearningPathState = {
  exam: PathExam | null;
  levels: Partial<Record<PathExam, string>>;
  manual: Record<string, true>;
  setExam: (exam: PathExam) => void;
  setLevel: (exam: PathExam, levelId: string) => void;
  toggleManual: (nodeId: string) => void;
};

export const useLearningPathStore = create<LearningPathState>()(
  persist(
    (set) => ({
      exam: null,
      levels: {},
      manual: {},
      setExam: (exam) => set({ exam }),
      setLevel: (exam, levelId) => set((s) => ({ exam, levels: { ...s.levels, [exam]: levelId } })),
      toggleManual: (nodeId) =>
        set((s) => {
          const manual = { ...s.manual };
          if (manual[nodeId]) delete manual[nodeId];
          else manual[nodeId] = true;
          return { manual };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}learning-path`,
      storage: storage<LearningPathState>(),
      version: 1,
      partialize: (s) => ({ exam: s.exam, levels: s.levels, manual: s.manual }) as LearningPathState,
    },
  ),
);
