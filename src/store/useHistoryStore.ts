import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  answerQuestion,
  completeScene,
  DEFAULT_PREFS,
  normalizeHistory,
  openScene,
  type HistoryPrefs,
  type HistoryProgress,
} from '@/services/history/progress';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Tiến độ "Khám phá lịch sử Việt Nam song ngữ": cảnh đang đọc dở, cảnh đã đọc xong, đáp án câu hỏi.
 * `progress` được đồng bộ (khoá `history`); `prefs` (ngôn ngữ hiển thị / thuyết minh, tốc độ, tự chuyển cảnh)
 * chỉ nằm trên máy này.
 */
type HistoryState = HistoryProgress & {
  prefs: HistoryPrefs;
  open: (topicId: string, sceneId: string) => void;
  complete: (topicId: string, sceneId: string) => void;
  answer: (topicId: string, sceneId: string, questionId: string, choice: number) => void;
  setPrefs: (patch: Partial<HistoryPrefs>) => void;
};

const now = () => new Date().toISOString();

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      topics: {},
      prefs: DEFAULT_PREFS,
      open: (topicId, sceneId) => set((s) => openScene(s, topicId, sceneId, now())),
      complete: (topicId, sceneId) => set((s) => completeScene(s, topicId, sceneId, now())),
      answer: (topicId, sceneId, questionId, choice) => set((s) => answerQuestion(s, topicId, sceneId, questionId, choice, now())),
      setPrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),
    }),
    {
      name: `${STORAGE_PREFIX}history`,
      storage: storage<HistoryState>(),
      version: 1,
      partialize: (s) => ({ topics: s.topics, prefs: s.prefs }) as HistoryState,
      merge: (persisted, current) => {
        const p = persisted as Partial<HistoryState> | undefined;
        const prefs = { ...DEFAULT_PREFS, ...(p?.prefs ?? {}) };
        // Existing installs saved the old 1× default; start those readers at the new, slower pace.
        if (prefs.speed === 1 || prefs.speed === 0.85) prefs.speed = DEFAULT_PREFS.speed;
        return { ...current, topics: normalizeHistory(p).topics, prefs };
      },
    },
  ),
);

export const historyPayload = (): HistoryProgress => ({ topics: useHistoryStore.getState().topics });
