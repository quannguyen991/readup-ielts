import { create } from 'zustand';

/**
 * Màn luyện câu (chép chính tả, viết câu) đang ở chế độ LÀM BÀI hay chưa. Nền
 * toa tàu chỉ chạy lúc làm bài, không chạy ở trang chọn bộ đề (người dùng yêu cầu
 * 30/09/2026). Không lưu — chỉ là trạng thái màn hình đang mở. Đếm số màn đang
 * báo để hai màn chồng lên nhau lúc chuyển trang không tắt nhầm của nhau.
 */
export const useTravelPractice = create<{ count: number; enter: () => void; leave: () => void }>()((set) => ({
  count: 0,
  enter: () => set((s) => ({ count: s.count + 1 })),
  leave: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
}));
