import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Các từ người học đã đánh dấu "đã thuộc" trong bộ Oxford, lưu trên máy này.
 * Khoá là từ viết thường, để cùng một từ ở hai bộ chỉ đếm một lần.
 */
type OxfordState = {
  learned: Record<string, true>;
  toggle: (word: string) => void;
};

export const useOxfordStore = create<OxfordState>()(
  persist(
    (set, get) => ({
      learned: {},
      toggle: (word) => {
        const key = word.toLowerCase();
        const next = { ...get().learned };
        if (next[key]) delete next[key];
        else next[key] = true;
        set({ learned: next });
      },
    }),
    {
      name: `${STORAGE_PREFIX}oxford`,
      storage: storage<OxfordState>(),
      version: 1,
      partialize: (s) => ({ learned: s.learned }) as OxfordState,
    },
  ),
);

export function isLearnedWord(learned: Record<string, true>, word: string): boolean {
  return learned[word.toLowerCase()] === true;
}
