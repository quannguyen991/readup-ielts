import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { MAX_ATTEMPTS, type SpeakingAttempt } from '@/services/speaking/attempts';
import type { SpeakingGrade } from '@/services/speaking/grade';

/**
 * Phòng luyện nói: các lượt thi (bản chữ, chỉ số đo tại máy, điểm AI).
 * Đồng bộ lên tài khoản bằng khoá `speaking` — gộp theo id, giữ 50 lượt mới nhất.
 */
type State = {
  attempts: SpeakingAttempt[];
  add: (attempt: SpeakingAttempt) => void;
  setGrade: (id: string, grade: SpeakingGrade) => void;
  setGradeError: (id: string, message: string | null) => void;
  markAwarded: (id: string) => void;
  remove: (id: string) => void;
};

const patch = (list: SpeakingAttempt[], id: string, fn: (a: SpeakingAttempt) => SpeakingAttempt) =>
  list.map((a) => (a.id === id ? fn(a) : a));

export const useSpeakingStore = create<State>()(
  persist(
    (set) => ({
      attempts: [],
      add: (attempt) =>
        set((s) => ({ attempts: [attempt, ...s.attempts.filter((a) => a.id !== attempt.id)].slice(0, MAX_ATTEMPTS) })),
      setGrade: (id, grade) => set((s) => ({ attempts: patch(s.attempts, id, (a) => ({ ...a, grade, gradeError: null })) })),
      setGradeError: (id, message) => set((s) => ({ attempts: patch(s.attempts, id, (a) => ({ ...a, gradeError: message })) })),
      markAwarded: (id) => set((s) => ({ attempts: patch(s.attempts, id, (a) => ({ ...a, awarded: true })) })),
      remove: (id) => set((s) => ({ attempts: s.attempts.filter((a) => a.id !== id) })),
    }),
    {
      name: `${STORAGE_PREFIX}speaking`,
      storage: storage<State>(),
      version: 1,
      partialize: (s) => ({ attempts: s.attempts }) as State,
    },
  ),
);
