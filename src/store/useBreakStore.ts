import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage, todayKey } from './persist';
import { advance, startClock, type BreakClock, type TickInput } from '@/services/break/break-clock';

/**
 * Nghỉ khi học — cài đặt THEO MÁY, không đồng bộ (cùng lý do với nhắc học: giờ
 * học hợp với máy ở nhà chưa chắc hợp với máy ở trường).
 *
 * `clock` cũng được lưu: giờ nghỉ đang chạy phải còn sau khi tải lại trang, nếu
 * không thì tải lại là thoát được giờ nghỉ.
 */
export const STUDY_MINUTE_OPTIONS = [15, 25, 45, 60] as const;
export const BREAK_MINUTE_OPTIONS = [5, 10] as const;

type BreakSettings = {
  enabled: boolean;
  studyMinutes: number;
  breakMinutes: number;
};

type TickArgs = Omit<TickInput, 'studyMs' | 'breakMs'>;

type BreakState = BreakSettings & {
  clock: BreakClock;
  setSettings: (patch: Partial<BreakSettings>) => void;
  tick: (input: TickArgs) => void;
};

export const useBreakStore = create<BreakState>()(
  persist(
    (set) => ({
      enabled: false,
      studyMinutes: 25,
      breakMinutes: 5,
      clock: startClock(todayKey()),
      setSettings: (patch) => set(patch),
      tick: (input) =>
        set((s) => {
          const next = advance(s.clock, {
            ...input,
            studyMs: s.studyMinutes * 60_000,
            breakMs: s.breakMinutes * 60_000,
          });
          // Trả về đúng state cũ khi không đổi gì, để zustand khỏi báo và khỏi ghi xuống máy.
          return next === s.clock ? s : { clock: next };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}break`,
      storage: storage<BreakState>(),
      version: 1,
      partialize: (s) =>
        ({ enabled: s.enabled, studyMinutes: s.studyMinutes, breakMinutes: s.breakMinutes, clock: s.clock }) as BreakState,
    },
  ),
);
