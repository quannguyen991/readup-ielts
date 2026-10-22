import { Platform } from 'react-native';

import { readStoredUtm } from './utm';
import type { AppEventName } from './app-event-rules';

/**
 * Gửi một sự kiện (start_lesson, complete_lesson, sign_up) lên /api/event kèm utm lần đầu và đường dẫn.
 * Chỉ chạy trên web. Lỗi mạng bị bỏ qua: đo lường không được làm chậm trang của người học.
 */
export function trackAppEvent(name: AppEventName, signedIn = false): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    const body = JSON.stringify({
      name,
      visitor: window.localStorage.getItem('readup:vid'),
      session: window.sessionStorage.getItem('readup:sid'),
      path: window.location.pathname,
      signedIn,
      utm: readStoredUtm(window.localStorage),
    });
    void fetch('/api/event', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
  } catch {
    // Bỏ qua: chế độ riêng tư hoặc storage bị chặn.
  }
}
