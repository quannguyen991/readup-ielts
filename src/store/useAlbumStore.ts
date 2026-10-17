import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { recordCorrect, type CorrectByWeek } from '@/services/game/album';

/**
 * Số câu đúng theo TỪNG TUẦN cho album sưu tầm, khoá là mã tuần (thứ Hai, giờ VN).
 *
 * Chỉ `useGameStore.answer()` gọi `addCorrect`, và chỉ với câu đúng do máy chấm
 * (không phải câu tự chấm). Mỗi lần gọi ghi vào tuần của thời điểm hiện tại, nên
 * tuần cũ không bao giờ tăng thêm; tuần mới bắt đầu từ 0.
 */
type AlbumState = {
  correctByWeek: CorrectByWeek;
  addCorrect: () => void;
};

export const useAlbumStore = create<AlbumState>()(
  persist(
    (set) => ({
      correctByWeek: {},
      addCorrect: () => set((s) => ({ correctByWeek: recordCorrect(s.correctByWeek, new Date()) })),
    }),
    {
      name: `${STORAGE_PREFIX}album`,
      storage: storage<AlbumState>(),
      version: 1,
      partialize: (s) => ({ correctByWeek: s.correctByWeek }) as AlbumState,
    },
  ),
);
