import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { isFlyerId, type FlyerId } from '@/services/rail/flyers';
import type { MusicStyle } from '@/services/rail/music';
import type { Weather } from '@/services/rail/scene';
import { nextOnRoute, routeById, routeOf, type TimeOfDay } from '@/services/rail/stations';

/**
 * Chuyến bay từ vựng: thành phố đang bay qua (khoá `station` giữ nguyên để không
 * mất dữ liệu cũ), nhân vật bay đã chọn, không khí, nhạc (theo máy), và dấu hộ
 * chiếu đã sưu tầm (khoá `tickets`: mỗi thành phố tới lần đầu được đóng một dấu).
 * Bản cũ là "chuyến tàu" — mọi khoá cũ còn nguyên, chỉ thêm `flyer`.
 */
export type AdvanceBy = 'answers' | 'time';

type RailState = {
  /** Thành phố đang bay qua. */
  station: string;
  route: string;
  /** Nhân vật bay đã chọn (mặc định máy bay). */
  flyer: FlyerId;
  /** Khoá cũ của bản "ngồi toa tàu" — không còn dùng, giữ lại để không mất dữ liệu đã lưu. */
  view: 'window' | 'outside';
  /** Dùng cảnh bay qua thành phố làm nền cho các màn ôn từ vựng (quiz, học, kiểm tra…). */
  backdrop: boolean;
  /** Số câu đúng đã bay được trên quãng tới thành phố kế (dùng chung trang bay và nền ôn từ). */
  toward: number;
  time: TimeOfDay | 'auto';
  weather: Weather;
  auto: boolean;
  advanceBy: AdvanceBy;
  /** Số câu đúng để tới thành phố kế (chế độ theo câu đúng). */
  perStation: number;
  /** Giây mỗi thành phố (chế độ theo thời gian). */
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
   * Một câu đúng: bay thêm một quãng; đủ `perStation` câu thì tới thành phố kế trên
   * hành trình và đóng dấu hộ chiếu. Trả về thành phố vừa tới (nếu có) và dấu đó có mới không.
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
      flyer: 'plane',
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
      version: 2,
      // v1 → v2: thêm `flyer`; giữ nguyên mọi khoá cũ (thành phố, dấu, tiến độ).
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Partial<RailState>;
        return { ...old, flyer: isFlyerId(old.flyer) ? old.flyer : 'plane' } as RailState;
      },
      // Giá trị `flyer` hỏng (sửa tay, bản lạ) thì về máy bay thay vì làm vỡ cảnh.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<RailState>;
        return { ...current, ...p, flyer: isFlyerId(p.flyer) ? p.flyer : current.flyer };
      },
      partialize: (s) => {
        const { set: _s, stamp: _t, count: _c, step: _p, ...data } = s;
        return data as RailState;
      },
    },
  ),
);
