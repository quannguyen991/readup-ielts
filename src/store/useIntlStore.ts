import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage, uid } from './persist';

export type IntlExam = 'toeic' | 'toefl' | 'hsa';

export type IntlSessionRecord = {
  id: string;
  exam: IntlExam;
  activity: string;
  correct: number;
  total: number;
  finishedAt: string;
};

type IntlState = {
  /** Khoá dạng `${exam}:${word}` cho những từ người học đánh dấu đã thuộc. */
  known: Record<string, true>;
  sessions: IntlSessionRecord[];
  /** Bản nháp bài viết theo id nhiệm vụ, giữ lại khi rời màn hình. */
  drafts: Record<string, string>;
  setDraft: (taskId: string, text: string) => void;
  setKnown: (exam: IntlExam, word: string, value: boolean) => void;
  recordSession: (record: Omit<IntlSessionRecord, 'id' | 'finishedAt'>) => void;
  clearHistory: () => void;
};

export const useIntlStore = create<IntlState>()(
  persist(
    (set) => ({
      known: {},
      sessions: [],
      drafts: {},

      setDraft: (taskId, text) => set((state) => ({ drafts: { ...state.drafts, [taskId]: text } })),

      setKnown: (exam, word, value) =>
        set((state) => {
          const key = `${exam}:${word}`;
          const next = { ...state.known };
          if (value) next[key] = true;
          else delete next[key];
          return { known: next };
        }),

      recordSession: (record) =>
        set((state) => ({
          sessions: [{ ...record, id: uid(), finishedAt: new Date().toISOString() }, ...state.sessions].slice(0, 100),
        })),

      clearHistory: () => set({ sessions: [] }),
    }),
    { name: `${STORAGE_PREFIX}intl`, storage: storage<IntlState>() },
  ),
);

export function isKnown(known: Record<string, true>, exam: IntlExam, word: string): boolean {
  return known[`${exam}:${word}`] === true;
}
