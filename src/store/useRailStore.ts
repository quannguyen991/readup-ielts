import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import type { MusicStyle } from '@/services/rail/music';
import type { Weather } from '@/services/rail/scene';
import { nextOnRoute, routeById, routeOf, type TimeOfDay } from '@/services/rail/stations';

/**
 * Chuyến tàu từ vựng: ga đang ở, không khí, nhạc (theo máy), và VÉ đã sưu tầm
 * (mỗi ga tới nơi lần đầu được đóng dấu một vé).
 */
export type AdvanceBy = 'answers' | 'time';

type RailState = {
  station: string;
  route: string;
  view: 'window' | 'outside';
  /** Dùng cảnh tàu chạy làm nền cho các màn ôn từ vựng (quiz, học, kiểm tra…). */
  backdrop: boolean;
  /** Số câu đúng đã đi được trên quãng tới ga kế (dùng chung trang tàu và nền ôn từ). */
  toward: number;
  time: TimeOfDay | 'auto';
  weather: Weather;
  auto: boolean;
  advanceBy: AdvanceBy;
  /** Số câu đúng để tới ga kế (chế độ theo câu đúng). */
  perStation: number;
  /** Giây mỗi ga (chế độ theo thời gian). */
  seconds: number;
  style: MusicStyle;
  volume: number;
  track: number;
  autoTrack: boolean;
  rainSound: boolean;
  tickets: Record<string, string>;
  correct: number;
  answered: number;
  set: (patch: Partial<Omit<RailState, 'set' | 'stamp' | 'count' | 'step'>>) => void;
  /**
   * Một câu đúng: tàu tiến một quãng; đủ `perStation` câu thì tới ga kế trên
   * tuyến và đóng dấu hộ chiếu. Trả về ga vừa tới (nếu có) và dấu đó có mới không.
   */
  step: () => { arrived: string | null; fresh: boolean };
  stamp: (station: string) => boolean;
  count: (correct: boolean) => void;
};

export const useRailStore = create<RailState>()(
  persist(
    (set, get) => ({
      station: 'hanoi',
      route: 'vn',
      view: 'window',
      backdrop: true,
      toward: 0,
      time: 'auto',
      weather: 'clear',
      auto: true,
      advanceBy: 'answers',
      perStation: 5,
      seconds: 60,
      style: 'piano',
      volume: 0.5,
      track: 0,
      autoTrack: true,
      rainSound: true,
      tickets: {},
      correct: 0,
      answered: 0,
      set: (patch) => set(patch),
      stamp: (station) => {
        if (get().tickets[station]) return false;
        set({ tickets: { ...get().tickets, [station]: new Date().toISOString().slice(0, 10) } });
        return true;
      },
      step: () => {
        const s = get();
        const toward = s.toward + 1;
        if (toward < s.perStation) {
          set({ toward });
          return { arrived: null, fresh: false };
        }
        const route = routeById(s.route).stops.includes(s.station) ? routeById(s.route) : routeOf(s.station);
        const next = nextOnRoute(route, s.station).id;
        set({ station: next, route: route.id, toward: 0 });
        return { arrived: next, fresh: get().stamp(next) };
      },
      count: (correct) => set((s) => ({ answered: s.answered + 1, correct: s.correct + (correct ? 1 : 0) })),
    }),
    {
      name: `${STORAGE_PREFIX}rail`,
      storage: storage<RailState>(),
      version: 1,
      partialize: (s) => {
        const { set: _s, stamp: _t, count: _c, step: _p, ...data } = s;
        return data as RailState;
      },
    },
  ),
);
