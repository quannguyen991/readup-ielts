import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import type { QuestSource } from '@/services/vocab/quest-words';

/**
 * Bộ từ người học chọn để hỏi trong Quest (Toa Từ Vựng, câu cá trong Thành
 * phố). Chỉ lưu trên máy — là tuỳ chọn hiển thị, không phải tiến độ học (tiến
 * độ thật ghi vào `useTopicStudyStore.review`).
 */
type State = { source: QuestSource; setSource: (s: QuestSource) => void };

export const useQuestVocabStore = create<State>()(
  persist(
    (set) => ({
      source: 'auto',
      setSource: (source) => set({ source }),
    }),
    { name: `${STORAGE_PREFIX}quest-vocab`, storage: storage<State>(), version: 1, partialize: (s) => ({ source: s.source }) as State },
  ),
);
