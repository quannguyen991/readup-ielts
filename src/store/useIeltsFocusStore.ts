import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Lựa chọn các tính năng IELTS người học muốn học (xem src/navigation/ielts-focus.ts).
 * `features = null` nghĩa là chưa chọn lần nào: thanh bên hiện đủ mọi trang con.
 */
type IeltsFocusState = {
  features: string[] | null;
  setFeatures: (keys: string[]) => void;
};

export const useIeltsFocusStore = create<IeltsFocusState>()(
  persist(
    (set) => ({
      features: null,
      setFeatures: (keys) => set({ features: keys }),
    }),
    {
      name: `${STORAGE_PREFIX}ielts-focus`,
      storage: storage<IeltsFocusState>(),
      version: 1,
      partialize: (s) => ({ features: s.features }) as IeltsFocusState,
    },
  ),
);
