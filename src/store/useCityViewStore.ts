import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import type { Visual } from '@/services/city/procgen/parts';

/**
 * Trạng thái XEM của Thành Phố Tri Thức trên máy này (không đồng bộ): lần cuối
 * người học nhìn thấy mỗi công trường ở tiến độ nào. Mở thành phố sau khi học
 * → công nhân "làm" đúng phần tiến độ vừa có (tường lên từng hàng, tầng lên
 * từng bước), rồi đứng nghỉ. Không có ca mới thì không có hoạt cảnh làm việc.
 */
type ViewState = {
  seen: Record<string, Visual>;
  camera: { rot: number; zoom: number } | null;
  markSeen: (siteId: string, v: Visual) => void;
  forget: (siteId: string) => void;
  setCamera: (c: { rot: number; zoom: number }) => void;
};

export const useCityViewStore = create<ViewState>()(
  persist(
    (set, get) => ({
      seen: {},
      camera: null,
      markSeen: (siteId, v) => set({ seen: { ...get().seen, [siteId]: v } }),
      forget: (siteId) => {
        const seen = { ...get().seen };
        delete seen[siteId];
        set({ seen });
      },
      setCamera: (camera) => set({ camera }),
    }),
    { name: `${STORAGE_PREFIX}city-view`, storage: storage<ViewState>(), partialize: (s) => ({ seen: s.seen, camera: s.camera }) as ViewState },
  ),
);
