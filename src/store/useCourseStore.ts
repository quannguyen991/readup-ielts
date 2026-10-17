import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { mergeCourseDone, type DoneMap } from '@/services/hub/presentation-course';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Tiến độ các khoá có cấp độ (Presentation Coach). Tách riêng khỏi `useHubStore` để không
 * đụng vào store Hub đang được đồng bộ. Hiện lưu trên máy này; chưa đưa vào đồng bộ đám mây.
 */

type CourseState = {
  /** Bài đã xong theo id bài học. Với bài kiểm tra, giữ điểm cao nhất. */
  done: DoneMap;
  markDone: (lessonId: string, score?: number) => void;
};

export const useCourseStore = create<CourseState>()(
  persist(
    (set) => ({
      done: {},
      markDone: (lessonId, score) =>
        set((s) => {
          const prev = s.done[lessonId];
          const best = score === undefined ? prev?.score : Math.max(prev?.score ?? -1, score);
          return {
            done: {
              ...s.done,
              [lessonId]: {
                at: prev?.at ?? new Date().toISOString(),
                ...(best === undefined ? {} : { score: best }),
              },
            },
          };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}course`,
      storage: storage<CourseState>(),
      version: 1,
      partialize: (s) => ({ done: s.done }) as CourseState,
    },
  ),
);
/** Đăng ký đồng bộ: tiến độ khoá đi theo tài khoản như các store khác. */
export const courseSyncStore = {
  key: 'course',
  read: () => ({ done: useCourseStore.getState().done }),
  write: (payload: unknown) => {
    const p = payload as { done?: DoneMap } | null;
    if (!p || typeof p !== 'object') return;
    useCourseStore.setState({ done: p.done ?? {} });
  },
  merge: (local: unknown, remote: unknown | null) => mergeCourseDone(local, remote),
};
