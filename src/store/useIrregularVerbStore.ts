import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/** Động từ bất quy tắc nào người học đã đánh dấu "đã thuộc", lưu trên máy. */
type IrregularVerbState = {
  known: Record<string, true>;
  toggle: (base: string) => void;
  /** Đánh dấu thuộc (dùng khi làm đúng cả V2 và V3 trong bài kiểm tra nhanh). */
  markKnown: (bases: readonly string[]) => void;
  reset: () => void;
};

export const useIrregularVerbStore = create<IrregularVerbState>()(
  persist(
    (set, get) => ({
      known: {},
      toggle: (base) => {
        const next = { ...get().known };
        if (next[base]) delete next[base];
        else next[base] = true;
        set({ known: next });
      },
      markKnown: (bases) => {
        if (bases.length === 0) return;
        const next = { ...get().known };
        for (const b of bases) next[b] = true;
        set({ known: next });
      },
      reset: () => set({ known: {} }),
    }),
    {
      name: `${STORAGE_PREFIX}irregular-verbs`,
      storage: storage<IrregularVerbState>(),
      version: 1,
      partialize: (s) => ({ known: s.known }) as IrregularVerbState,
    },
  ),
);
