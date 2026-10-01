import { create } from 'zustand';

/**
 * Bảng tìm bài đang mở hay đóng. Không lưu qua phiên: đây là trạng thái của một
 * lần bấm, không phải sở thích. Nhiều nút mở (thanh bên, thanh trên, phím tắt)
 * cùng dùng một kho này nên chỉ có MỘT bảng được gắn trong khung app.
 */
type SearchState = {
  open: boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
};

export const useSearchStore = create<SearchState>()((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
