import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Hộp "Hướng dẫn" ở trang tổng quan SAT: lần đầu vào thì MỞ SẴN, từ lần sau
 * thì gập (trừ khi người học tự mở lại). Nhớ qua phiên vì đây là sở thích xem.
 */
type SatGuideState = {
  /** Đã từng vào trang tổng quan SAT chưa. */
  seen: boolean;
  /** Lựa chọn mở/gập do người học bấm; null = chưa bấm lần nào. */
  open: boolean | null;
  markSeen: () => void;
  setOpen: (open: boolean) => void;
};

export const useSatGuideStore = create<SatGuideState>()(
  persist(
    (set) => ({
      seen: false,
      open: null,
      markSeen: () => set({ seen: true }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: `${STORAGE_PREFIX}sat-guide`,
      storage: storage<SatGuideState>(),
      version: 1,
      partialize: (s) => ({ seen: s.seen, open: s.open }) as SatGuideState,
    },
  ),
);
