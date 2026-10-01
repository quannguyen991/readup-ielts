/** Máy Apple dùng ⌘ thay cho Ctrl. Chỉ gọi sau khi đã chạy trên trình duyệt. */
export function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

/** Nhãn phím tắt mở ô tìm bài: "⌘K" trên Mac, "Ctrl K" chỗ khác. */
export function shortcutLabel(): string {
  return isMac() ? '⌘K' : 'Ctrl K';
}
