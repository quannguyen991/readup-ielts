import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Huy hiệu nào đã được chúc mừng. Lần đầu mở Hub, mọi huy hiệu đang có sẵn được đánh dấu đã xem
 * để không bật hiệu ứng hàng loạt; từ đó chỉ huy hiệu mới mở khoá mới được chúc mừng.
 */
type BadgeSeenState = {
  initialized: boolean;
  seen: Record<string, true>;
  init: (unlockedIds: string[]) => void;
  markSeen: (id: string) => void;
};

export const useBadgeSeenStore = create<BadgeSeenState>()(
  persist(
    (set, get) => ({
      initialized: false,
      seen: {},
      init: (unlockedIds) => {
        if (get().initialized) return;
        const seen: Record<string, true> = {};
        for (const id of unlockedIds) seen[id] = true;
        set({ initialized: true, seen });
      },
      markSeen: (id) => {
        if (get().seen[id]) return;
        set((s) => ({ seen: { ...s.seen, [id]: true } }));
      },
    }),
    {
      name: `${STORAGE_PREFIX}badge-seen`,
      storage: storage<BadgeSeenState>(),
      version: 1,
      partialize: (s) => ({ initialized: s.initialized, seen: s.seen }) as BadgeSeenState,
    },
  ),
);
