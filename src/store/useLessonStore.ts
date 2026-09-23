import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Bài lý thuyết SAT nào đã học xong. Khoá `math:<skill>` / `verbal:<skill>` →
 * thời điểm bấm "Đã học xong". Chỉ ghi khi người học tự xác nhận ở cuối bài,
 * không tự đánh dấu chỉ vì mở trang — mở ra đọc lướt chưa phải là đã học.
 */
type LessonState = {
  done: Record<string, string>;
  markDone: (key: string) => void;
};

export const useLessonStore = create<LessonState>()(
  persist(
    (set) => ({
      done: {},
      markDone: (key) => set((s) => ({ done: { ...s.done, [key]: new Date().toISOString() } })),
    }),
    {
      name: `${STORAGE_PREFIX}lessons`,
      storage: storage<LessonState>(),
      version: 1,
      partialize: (s) => ({ done: s.done }) as LessonState,
    },
  ),
);

export function lessonKey(subject: 'math' | 'verbal', skill: string): string {
  return `${subject}:${skill}`;
}
