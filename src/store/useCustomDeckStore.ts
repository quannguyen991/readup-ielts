import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import type { StudyWord } from '@/services/vocab/topic-study';

/**
 * Bộ học người dùng TỰ TẠO từ một bài họ dán vào (`app/vocabulary/import.tsx`).
 * Mỗi bộ mở được như mọi bộ khác ở `/vocabulary/topic/my-<id>` — đủ các chế độ
 * lật thẻ, Học, Điền vào câu, Kiểm tra, Bóng bay.
 */
export type CustomDeck = { id: string; name: string; createdAt: string; words: StudyWord[] };

export const CUSTOM_PREFIX = 'my-';

type CustomDeckState = {
  decks: Record<string, CustomDeck>;
  addDeck: (name: string, words: StudyWord[]) => string;
  removeDeck: (id: string) => void;
};

export const useCustomDeckStore = create<CustomDeckState>()(
  persist(
    (set) => ({
      decks: {},
      addDeck: (name, words) => {
        const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({ decks: { ...s.decks, [id]: { id, name: name.trim() || 'Bộ từ của tôi', createdAt: new Date().toISOString(), words } } }));
        return id;
      },
      removeDeck: (id) =>
        set((s) => {
          const decks = { ...s.decks };
          delete decks[id];
          return { decks };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}custom-decks`,
      storage: storage<CustomDeckState>(),
      version: 1,
      partialize: (s) => ({ decks: s.decks }) as CustomDeckState,
    },
  ),
);
