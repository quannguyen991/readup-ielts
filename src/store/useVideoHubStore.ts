import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Thói quen học video trên máy này: chế độ nào đã mở, mở bao nhiêu lần, và chế độ
 * mở gần nhất. Dùng để đưa chế độ người học hay dùng lên đầu trang Học qua video.
 */
type VideoHubState = {
  counts: Record<string, number>;
  last: string | null;
  touch: (mode: string) => void;
};

export const useVideoHubStore = create<VideoHubState>()(
  persist(
    (set, get) => ({
      counts: {},
      last: null,
      touch: (mode) => set({ last: mode, counts: { ...get().counts, [mode]: (get().counts[mode] ?? 0) + 1 } }),
    }),
    {
      name: `${STORAGE_PREFIX}video-hub`,
      storage: storage<VideoHubState>(),
      version: 1,
      partialize: (s) => ({ counts: s.counts, last: s.last }) as VideoHubState,
    },
  ),
);

/** Chế độ được mở nhiều nhất; hoà thì lấy cái đến trước. Chưa có lần nào thì null. */
export function favouriteMode(counts: Record<string, number>): string | null {
  let best: string | null = null;
  let bestN = 0;
  for (const [key, n] of Object.entries(counts)) {
    if (n > bestN) {
      best = key;
      bestN = n;
    }
  }
  return best;
}
