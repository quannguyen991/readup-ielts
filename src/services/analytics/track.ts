import { Platform } from 'react-native';

import { TRACKERS } from './config';
import { useConsentStore, type Consent } from './consent';
import { toGa, toMeta, type AppEvent } from './events';

/**
 * Tải và gọi Meta Pixel / Google Analytics — CHỈ SAU KHI người dùng bấm đồng ý.
 *
 * Không có thẻ <script> nào trong HTML. Script được chèn lúc chạy, lần đầu có
 * một sự kiện cần gửi mà người dùng đã đồng ý. Chưa khai mã, chưa đồng ý, hay
 * đang chạy trên máy chủ / trên app native thì mọi hàm ở đây không làm gì.
 *
 * Hai đoạn khởi tạo dưới đây là bản viết lại của đoạn mã mẫu chính thức, không
 * phải tự chế: hàng đợi `fbq.queue` được fbevents.js đọc lại khi tải xong, và
 * `dataLayer` được gtag.js đọc lại — nên gọi trước khi script tải xong vẫn không
 * mất sự kiện.
 */

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: unknown;
};

type TrackerWindow = Window & {
  fbq?: Fbq;
  _fbq?: Fbq;
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

let loaded = false;

function trackerWindow(): TrackerWindow | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') return null;
  return window as TrackerWindow;
}

function addScript(src: string): void {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function loadMeta(w: TrackerWindow, pixelId: string): void {
  if (!w.fbq) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    }) as Fbq;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.push = fbq;
    w.fbq = fbq;
    w._fbq = fbq;
    addScript('https://connect.facebook.net/en_US/fbevents.js');
  }
  w.fbq('init', pixelId);
}

function loadGa(w: TrackerWindow, measurementId: string): void {
  w.dataLayer = w.dataLayer ?? [];
  if (!w.gtag) {
    const layer = w.dataLayer;
    w.gtag = function gtag() {
      // gtag.js chỉ hiểu đúng đối tượng `arguments`. Đẩy một mảng vào thì lệnh bị
      // bỏ qua mà không báo lỗi — lỗi kinh điển khi viết lại đoạn mã mẫu bằng TS.
      // eslint-disable-next-line prefer-rest-params
      layer.push(arguments);
    };
    addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`);
  }
  w.gtag('js', new Date());
  // Tắt lượt xem trang tự động: app một trang đổi đường dẫn không tải lại, nên
  // lượt xem trang do `useAnalyticsBootstrap` gửi theo từng lần đổi đường dẫn.
  w.gtag('config', measurementId, { send_page_view: false });
}

function ready(): TrackerWindow | null {
  const w = trackerWindow();
  if (!w || useConsentStore.getState().consent !== 'granted') return null;
  if (!TRACKERS.metaPixelId && !TRACKERS.ga4Id) return null;
  if (!loaded) {
    loaded = true;
    if (TRACKERS.metaPixelId) loadMeta(w, TRACKERS.metaPixelId);
    if (TRACKERS.ga4Id) loadGa(w, TRACKERS.ga4Id);
  }
  return w;
}

/** Gửi một sự kiện. Trả `false` nếu không gửi (chưa đồng ý, chưa khai mã, không phải web). */
export function track(event: AppEvent): boolean {
  const w = ready();
  if (!w) return false;

  if (TRACKERS.metaPixelId && w.fbq) {
    const call = toMeta(event);
    if (call.eventId) w.fbq('track', call.event, call.params ?? {}, { eventID: call.eventId });
    else w.fbq('track', call.event, call.params ?? {});
  }
  if (TRACKERS.ga4Id && w.gtag) {
    const call = toGa(event);
    w.gtag('event', call.event, call.params);
  }
  return true;
}

const SENT_PREFIX = 'readup.tracked.';

/**
 * Gửi đúng một lần cho mỗi `key` trên trình duyệt này — tải lại trang thanh toán
 * không được đếm thêm một đơn.
 *
 * Chỉ đánh dấu "đã gửi" khi THẬT SỰ gửi. Người chưa bấm đồng ý mà đã mua, về sau
 * đồng ý, thì đơn ấy vẫn còn cơ hội được đếm.
 */
export function trackOnce(key: string, event: AppEvent): void {
  const w = trackerWindow();
  if (!w) return;
  try {
    if (w.localStorage.getItem(SENT_PREFIX + key)) return;
  } catch {
    // Không đọc được bộ nhớ thì vẫn gửi: trùng một lần còn hơn mất hẳn.
  }
  if (!track(event)) return;
  try {
    w.localStorage.setItem(SENT_PREFIX + key, '1');
  } catch {
    // Bỏ qua: lần sau có thể gửi trùng, Meta tự khử bằng mã sự kiện.
  }
}

/** Báo lựa chọn mới cho các script ĐÃ tải. Chưa tải thì không có gì để báo. */
export function applyConsent(consent: Consent): void {
  const w = trackerWindow();
  if (!w || !loaded) return;
  const granted = consent === 'granted';
  w.fbq?.('consent', granted ? 'grant' : 'revoke');
  const state = granted ? 'granted' : 'denied';
  w.gtag?.('consent', 'update', {
    ad_storage: state,
    analytics_storage: state,
    ad_user_data: state,
    ad_personalization: state,
  });
}
