import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';

/**
 * Thanh bên mở rộng (hiện tên mục) hay thu gọn (chỉ biểu tượng).
 *
 * Mặc định MỞ RỘNG: tên đầy đủ là cách nhanh nhất để tìm đúng chỗ, còn thu
 * gọn là lựa chọn của người đã thuộc vị trí các biểu tượng. Nhớ qua phiên vì
 * đây là sở thích, không phải trạng thái của một lần xem.
 */
type SidebarState = {
  collapsed: boolean;
  toggle: () => void;
};

export const SIDEBAR_WIDTH = { expanded: 248, collapsed: 76 } as const;

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
    }),
    {
      name: `${STORAGE_PREFIX}sidebar`,
      storage: storage<SidebarState>(),
      version: 1,
      partialize: (s) => ({ collapsed: s.collapsed }) as SidebarState,
    },
  ),
);
