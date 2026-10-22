import { create } from 'zustand';

/**
 * Trạng thái khung điều hướng trên điện thoại (không lưu): hiện đang có bàn phím ảo
 * mở, nên thanh tab dưới tạm ẩn để không che ô đang gõ.
 */
type ChromeState = {
  keyboardOpen: boolean;
  setKeyboardOpen: (open: boolean) => void;
};

export const useChromeStore = create<ChromeState>((set) => ({
  keyboardOpen: false,
  setKeyboardOpen: (keyboardOpen) => set((s) => (s.keyboardOpen === keyboardOpen ? s : { keyboardOpen })),
}));

/** Chiều cao thanh tab dưới, chưa tính vùng an toàn. */
export const BOTTOM_BAR_HEIGHT = 68;
/** Biến CSS trên <html>: phần đáy đang bị thanh tab chiếm (0 khi ẩn). Dùng cho nút nổi, thanh dính đáy. */
export const BOTTOM_BAR_VAR = '--bb-h';
