import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { type DialogueBest } from '@/services/hub/dialogue';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Điểm cao nhất của từng bài hội thoại mẫu (phần trăm câu điền đúng).
 * Đồng bộ qua store `dialogue_best` trong services/sync/stores.ts.
 */
type DialogueState = {
  best: DialogueBest;
  record: (id: string, percent: number) => void;
};

export const useDialogueStore = create<DialogueState>()(
  persist(
    (set, get) => ({
      best: {},
      record: (id, percent) => {
        const prev = get().best[id] ?? 0;
        if (percent <= prev) return;
        set((s) => ({ best: { ...s.best, [id]: percent } }));
      },
    }),
    {
      name: `${STORAGE_PREFIX}dialogue`,
      storage: storage<DialogueState>(),
      version: 1,
      partialize: (s) => ({ best: s.best }) as DialogueState,
    },
  ),
);
