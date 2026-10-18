import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Lựa chọn các tính năng SAT người học muốn học (xem src/navigation/sat-focus.ts).
 * `features = null` nghĩa là chưa chọn lần nào: thanh bên hiện đủ mọi trang con.
 */
type SatFocusState = {
  features: string[] | null;
  setFeatures: (keys: string[]) => void;
};

export const useSatFocusStore = create<SatFocusState>()(
  persist(
    (set) => ({
      features: null,
      setFeatures: (keys) => set({ features: keys }),
    }),
    {
      name: `${STORAGE_PREFIX}sat-focus`,
      storage: storage<SatFocusState>(),
      version: 1,
      partialize: (s) => ({ features: s.features }) as SatFocusState,
    },
  ),
);
