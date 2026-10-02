import { create } from 'zustand';

/**
 * Trạng thái khung điều hướng trên điện thoại (không lưu): thanh tab dưới đang
 * ẩn vì cuộn xuống, hay vì bàn phím ảo đang mở.
 */
type ChromeState = {
  barHidden: boolean;
  keyboardOpen: boolean;
  setBarHidden: (hidden: boolean) => void;
  setKeyboardOpen: (open: boolean) => void;
};

export const useChromeStore = create<ChromeState>((set) => ({
  barHidden: false,
  keyboardOpen: false,
  setBarHidden: (barHidden) => set((s) => (s.barHidden === barHidden ? s : { barHidden })),
  setKeyboardOpen: (keyboardOpen) => set((s) => (s.keyboardOpen === keyboardOpen ? s : { keyboardOpen })),
}));

/** Chiều cao thanh tab dưới, chưa tính vùng an toàn. */
export const BOTTOM_BAR_HEIGHT = 56;
/** Biến CSS trên <html>: phần đáy đang bị thanh tab chiếm (0 khi ẩn). Dùng cho nút nổi, thanh dính đáy. */
export const BOTTOM_BAR_VAR = '--bb-h';
