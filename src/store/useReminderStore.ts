import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Nhắc học mỗi ngày — cài đặt THEO MÁY (giờ nhắc hợp với điện thoại chưa chắc
 * hợp với máy tính ở trường), nên không đồng bộ lên tài khoản.
 */
type ReminderState = {
  enabled: boolean;
  time: string;
  lastFired: string | null;
  set: (patch: Partial<Pick<ReminderState, 'enabled' | 'time'>>) => void;
  fired: (day: string) => void;
};

export const useReminderStore = create<ReminderState>()(
  persist(
    (set) => ({
      enabled: false,
      time: '20:00',
      lastFired: null,
      set: (patch) => set(patch),
      fired: (day) => set({ lastFired: day }),
    }),
    {
      name: `${STORAGE_PREFIX}reminder`,
      storage: storage<ReminderState>(),
      version: 1,
      partialize: (s) => ({ enabled: s.enabled, time: s.time, lastFired: s.lastFired }) as ReminderState,
    },
  ),
);
