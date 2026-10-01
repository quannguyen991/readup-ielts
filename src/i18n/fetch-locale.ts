import { Platform } from 'react-native';

import { LOCALE_HEADER } from '@/lib/server-locale';
import { useLocaleStore } from './useT';

/**
 * Gắn ngôn ngữ đang chọn vào MỌI lượt gọi API của chính app — một chỗ duy nhất.
 *
 * Máy chủ đọc header `x-band9-locale` (`src/lib/server-locale.ts`) để trả lời
 * nhắn lỗi/thông báo đúng thứ tiếng. Bọc `window.fetch` một lần lúc mở app thay
 * vì sửa từng chỗ gọi: vài chục chỗ `fetch('/api/...')` rải khắp app, thêm chỗ
 * mới là quên.
 *
 * Chỉ đụng tới yêu cầu CÙNG NGUỒN có đường dẫn `/api/...` — không gửi header lạ
 * sang Supabase, từ điển ngoài hay proxy AI (header lạ còn làm hỏng preflight
 * CORS). Header người gọi đã tự đặt thì giữ nguyên. Không đụng `body`, nên
 * FormData và luồng stream đi qua y như cũ.
 *
 * Gọi nhiều lần (HMR nạp lại `_layout`) vẫn chỉ bọc một lớp. Trên native bỏ qua:
 * native không có route `/api` cùng nguồn.
 */
const WRAPPED = Symbol.for('band9.fetchLocale');

type MarkedFetch = typeof fetch & { [WRAPPED]?: true };

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

export function isOwnApiUrl(raw: string, origin: string | undefined): boolean {
  if (raw.startsWith('/api/')) return true;
  if (!origin) return false;
  try {
    const url = new URL(raw, origin);
    return url.origin === origin && url.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

export function installLocaleFetch(): void {
  if (Platform.OS !== 'web') return;
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;

  const current = window.fetch as MarkedFetch;
  if (current[WRAPPED]) return;

  const original = current.bind(window);

  const wrapped: MarkedFetch = (input, init) => {
    let own = false;
    try {
      own = isOwnApiUrl(urlOf(input), window.location?.origin);
    } catch {
      own = false;
    }
    if (!own) return original(input, init);

    // `init.headers` (nếu có) THAY THẾ header của Request khi gọi fetch, nên gộp
    // từ đúng nguồn mà fetch sẽ dùng.
    const base = init?.headers ?? (typeof input === 'object' && 'headers' in input ? input.headers : undefined);
    const headers = new Headers(base);
    if (headers.has(LOCALE_HEADER)) return original(input, init);

    headers.set(LOCALE_HEADER, useLocaleStore.getState().locale === 'en' ? 'en' : 'vi');
    return original(input, { ...init, headers });
  };
  wrapped[WRAPPED] = true;

  window.fetch = wrapped;
}
