import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { addToCollection, EMPTY_HOME, mergeCollection, type Collection, type HomeLayout } from '@/services/city/life';

/**
 * Đời sống trong Thành phố Tri thức: bộ sưu tập cá / bọ và cách bày trong nhà.
 * Đồng bộ lên tài khoản bằng khoá `city_life` (bảng `user_state` sẵn có).
 * Sao câu cá KHÔNG nằm ở đây — ghi vào `prizes` của kho phần thưởng theo ngày.
 */
export type CityLifePayload = { collection: Collection; home: HomeLayout; homeAt: string | null };

type CityLifeState = CityLifePayload & {
  addCatch: (speciesId: string) => void;
  setHome: (home: HomeLayout) => void;
};

export const useCityLifeStore = create<CityLifeState>()(
  persist(
    (set) => ({
      collection: {},
      home: EMPTY_HOME,
      homeAt: null,
      addCatch: (speciesId) => set((s) => ({ collection: addToCollection(s.collection, speciesId, new Date().toISOString().slice(0, 10)) })),
      setHome: (home) => set({ home, homeAt: new Date().toISOString() }),
    }),
    {
      name: `${STORAGE_PREFIX}city-life`,
      storage: storage<CityLifeState>(),
      version: 1,
      partialize: (s) => ({ collection: s.collection, home: s.home, homeAt: s.homeAt }) as CityLifeState,
    },
  ),
);

export function cityLifePayload(): CityLifePayload {
  const s = useCityLifeStore.getState();
  return { collection: s.collection, home: s.home, homeAt: s.homeAt };
}

/** Gộp hai máy: bộ sưu tập lấy hợp; phòng lấy bản bày sau cùng. */
export function mergeCityLife(local: CityLifePayload | null, remote: CityLifePayload | null): CityLifePayload {
  if (!local) return remote ?? { collection: {}, home: EMPTY_HOME, homeAt: null };
  if (!remote) return local;
  const homeFromRemote = (remote.homeAt ?? '') > (local.homeAt ?? '');
  return {
    collection: mergeCollection(local.collection, remote.collection),
    home: homeFromRemote ? remote.home ?? EMPTY_HOME : local.home ?? EMPTY_HOME,
    homeAt: homeFromRemote ? remote.homeAt : local.homeAt,
  };
}
