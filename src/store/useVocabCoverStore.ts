import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

type VocabCoverState = {
  /** Bìa đầu trang Từ vựng khi xem trên điện thoại: bật (mặc định) hoặc tắt để trang gọn hơn. */
  coverOnPhone: boolean;
  setCoverOnPhone: (on: boolean) => void;
};

/** Tuỳ chọn bìa Từ vựng trên điện thoại, nhớ lại ở lần mở sau. */
export const useVocabCoverStore = create<VocabCoverState>()(
  persist(
    (set) => ({
      coverOnPhone: true,
      setCoverOnPhone: (coverOnPhone) => set({ coverOnPhone }),
    }),
    {
      name: `${STORAGE_PREFIX}vocab-cover`,
      storage: storage<VocabCoverState>(),
      version: 1,
      partialize: (s) => ({ coverOnPhone: s.coverOnPhone }) as VocabCoverState,
    },
  ),
);
