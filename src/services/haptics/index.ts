import { Platform } from 'react-native';

import { HAPTICS_KEY, parseHapticsSetting } from './setting';

/**
 * Rung rất nhẹ (8ms) khi chạm các thao tác chính. Chỉ có tác dụng trên Android
 * (Chrome) — iOS Safari không có `navigator.vibrate`. Không bao giờ ném lỗi.
 *
 * Công tắc lưu ở localStorage khoá `band9.haptics` ('off' = tắt, mặc định bật):
 * màn làm bài (đáp án đúng/sai) cũng đọc đúng khoá này nên bật/tắt ở Cài đặt có
 * hiệu lực mọi nơi.
 */
export { HAPTICS_KEY, parseHapticsSetting } from './setting';

export function hapticsSupported(): boolean {
  return Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function hapticsEnabled(): boolean {
  try {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
    return parseHapticsSetting(window.localStorage.getItem(HAPTICS_KEY));
  } catch {
    return true;
  }
}

export function setHapticsEnabled(on: boolean): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(HAPTICS_KEY, on ? 'on' : 'off');
  } catch {
    // Chặn lưu trữ: công tắc chỉ có hiệu lực tới khi tải lại.
  }
}

export function haptic(ms = 8): void {
  if (!hapticsSupported() || !hapticsEnabled()) return;
  try {
    navigator.vibrate(ms);
  } catch {
    // Trình duyệt chặn rung (chưa có cử chỉ người dùng…): bỏ qua.
  }
}
