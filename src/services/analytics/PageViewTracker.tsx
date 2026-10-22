import { useEffect, useRef } from 'react';
import { isLegacyHost } from '@/lib/site';
import { Platform } from 'react-native';
import { usePathname } from 'expo-router';

import { useAuthStore } from '@/store/useAuthStore';
import { rememberFirstUtm } from '@/services/analytics/utm';
import { WELCOME_SEEN_KEY } from '@/lib/welcome-page';

/**
 * Đếm lượt xem trang cho trang quản trị (`/api/track` → bảng `page_views`).
 *
 * Mỗi lần đổi đường dẫn gửi MỘT gói nhỏ: mã khách ngẫu nhiên (localStorage),
 * mã phiên (sessionStorage), đường dẫn, trang giới thiệu, bề ngang màn hình.
 * Không cookie, không định danh con người — cùng tinh thần với Vercel Analytics
 * đang chạy song song.
 *
 * KHÔNG ĐẾM: bản chạy trên máy (localhost), trình duyệt tự động (webdriver),
 * và chính trang quản trị (người xem trang đó là mình).
 */
function randomId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 20);
}

function stored(storage: Storage | undefined, key: string): string {
  try {
    const old = storage?.getItem(key);
    if (old && /^[A-Za-z0-9_-]{8,40}$/.test(old)) return old;
    const id = randomId();
    storage?.setItem(key, id);
    return id;
  } catch {
    return randomId();
  }
}

export function PageViewTracker(): null {
  const pathname = usePathname();
  const signedIn = useAuthStore((s) => !!s.user);
  const last = useRef<string | null>(null);
  const firstReferrer = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || navigator.webdriver) return;
    // Tên miền cũ chỉ còn là cửa chuyển sang Band 9: không đếm ở đây, kẻo một
    // người bị tính hai lần (một ở tên miền cũ, một ở Band 9).
    if (isLegacyHost(window.location.host)) return;
    if (!pathname || pathname.startsWith('/admin') || last.current === pathname) return;
    last.current = pathname;

    // Khách vào bằng link sâu: đánh dấu đã xem để bỏ qua hoàn toàn màn chào 5 bước (/gioi-thieu)
    if (pathname !== '/' && pathname !== '/gioi-thieu') {
      try {
        window.localStorage.setItem(WELCOME_SEEN_KEY, '1');
      } catch {
        /* bỏ qua nếu private mode */
      }
    }

    // Ghi nhớ và giữ nguyên UTM lần ĐẦU khách truy cập
    const utm = rememberFirstUtm(window.location.search, window.localStorage);

    // Trang giới thiệu chỉ có nghĩa ở lượt xem ĐẦU của phiên; đổi trang trong app thì không còn.
    if (firstReferrer.current === null) firstReferrer.current = document.referrer || '';
    const referrer = firstReferrer.current;
    firstReferrer.current = '';

    const body = JSON.stringify({
      visitor: stored(window.localStorage, 'readup:vid'),
      session: stored(window.sessionStorage, 'readup:sid'),
      path: pathname,
      referrer,
      width: window.innerWidth,
      signedIn,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_content: utm.utm_content,
    });
    try {
      const blob = new Blob([body], { type: 'application/json' });
      if (!navigator.sendBeacon?.('/api/track', blob)) {
        void fetch('/api/track', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
      }
    } catch {
      /* đếm hỏng thì thôi, không làm phiền người học */
    }
  }, [pathname, signedIn]);

  return null;
}
