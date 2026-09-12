import { Platform } from 'react-native';
import { create } from 'zustand';

/**
 * Lựa chọn cookie đo lường của người dùng.
 *
 * MẶC ĐỊNH LÀ CHƯA CHỌN, VÀ CHƯA CHỌN NGHĨA LÀ KHÔNG TẢI. Không có kiểu "im lặng
 * là đồng ý": script quảng cáo chỉ được tải sau cú bấm "Đồng ý".
 *
 * Lưu ở localStorage của trình duyệt, không đồng bộ lên tài khoản — cookie của
 * Meta và Google cũng gắn với trình duyệt, không gắn với tài khoản.
 *
 * `hydrate()` chạy trong effect chứ không chạy lúc nạp module: trang được dựng
 * sẵn trên máy chủ (không có localStorage), đọc sớm thì bản dựng trên máy chủ và
 * bản trên trình duyệt lệch nhau.
 */

export type Consent = 'granted' | 'denied' | null;

const KEY = 'readup.consent.v1';

function read(): Consent {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

function write(value: Consent): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    if (value) window.localStorage.setItem(KEY, value);
    else window.localStorage.removeItem(KEY);
  } catch {
    // Trình duyệt chặn lưu trữ: lựa chọn chỉ sống trong phiên này, lần sau hỏi lại.
  }
}

type ConsentState = {
  consent: Consent;
  hydrated: boolean;
  hydrate: () => void;
  decide: (value: 'granted' | 'denied') => void;
  /** Mở lại thông báo cookie — nút "Cài đặt cookie" ở chân trang. */
  reopen: () => void;
};

export const useConsentStore = create<ConsentState>()((set) => ({
  consent: null,
  hydrated: false,
  hydrate: () => set({ consent: read(), hydrated: true }),
  decide: (value) => {
    write(value);
    set({ consent: value });
  },
  reopen: () => {
    write(null);
    set({ consent: null, hydrated: true });
  },
}));
