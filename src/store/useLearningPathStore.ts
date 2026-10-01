import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PathExam } from '@/data/learning-path/types';
import { mergeRequests, type FocusId, type RequestItem } from '@/services/learning-path/schedule';
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
  /** Phần muốn tập trung theo từng kỳ thi (thêm bài ở trình độ kế tiếp). */
  focus: Partial<Record<PathExam, FocusId[]>>;
  /** Bài AI tìm theo yêu cầu người học gõ. */
  requests: RequestItem[];
  /** Nhịp học riêng cho lịch; null = lấy theo "Lộ trình của tôi". */
  rhythm: { minutesPerDay: number; studyDays: number[] } | null;
  setExam: (exam: PathExam) => void;
  setLevel: (exam: PathExam, levelId: string) => void;
  toggleManual: (nodeId: string) => void;
  toggleFocus: (exam: PathExam, id: FocusId) => void;
  addRequests: (items: RequestItem[]) => void;
  removeRequest: (id: string) => void;
  setRhythm: (rhythm: { minutesPerDay: number; studyDays: number[] } | null) => void;
};

export const useLearningPathStore = create<LearningPathState>()(
  persist(
    (set) => ({
      exam: null,
      levels: {},
      manual: {},
      focus: {},
      requests: [],
      rhythm: null,
      setExam: (exam) => set({ exam }),
      setLevel: (exam, levelId) => set((s) => ({ exam, levels: { ...s.levels, [exam]: levelId } })),
      toggleManual: (nodeId) =>
        set((s) => {
          const manual = { ...s.manual };
          if (manual[nodeId]) delete manual[nodeId];
          else manual[nodeId] = true;
          return { manual };
        }),
      toggleFocus: (exam, id) =>
        set((s) => {
          const cur = s.focus[exam] ?? [];
          return { focus: { ...s.focus, [exam]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] } };
        }),
      addRequests: (items) => set((s) => ({ requests: mergeRequests(s.requests, items) })),
      removeRequest: (id) => set((s) => ({ requests: s.requests.filter((r) => r.id !== id) })),
      setRhythm: (rhythm) => set({ rhythm }),
    }),
    {
      name: `${STORAGE_PREFIX}learning-path`,
      storage: storage<LearningPathState>(),
      version: 2,
      migrate: (persisted) => ({ focus: {}, requests: [], rhythm: null, ...(persisted as object) }) as unknown as LearningPathState,
      partialize: (s) =>
        ({ exam: s.exam, levels: s.levels, manual: s.manual, focus: s.focus, requests: s.requests, rhythm: s.rhythm }) as LearningPathState,
    },
  ),
);
