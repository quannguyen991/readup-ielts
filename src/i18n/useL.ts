import { useCallback } from 'react';

import { useHydrated } from '@/components/layout/useHydrated';
import type { Locale } from './keys';
import { useLocaleStore } from './useT';

/**
 * DỊCH NỘI TUYẾN — cách chính để đưa app sang hai thứ tiếng (01/10/2026: "thêm
 * phần chọn English hay Việt Nam để mở rộng quy mô").
 *
 *     const { L } = useL();
 *     <Text>{L('Bắt đầu học', 'Start learning')}</Text>
 *
 * Viết hai câu ngay tại chỗ dùng thay vì đặt khoá trong `vi.ts` / `en.ts`: hàng
 * nghìn câu giao diện đổ vào hai tệp từ điển chung thì mọi người sửa cùng lúc
 * đều đụng nhau, và người đọc mã phải nhảy qua lại mới biết chữ nào hiện ra.
 * Hệ khoá `useT` vẫn giữ cho những chỗ đã dùng.
 *
 * Bản dựng phía máy chủ và lượt vẽ đầu luôn là TIẾNG VIỆT (ngôn ngữ mặc định),
 * rồi mới đổi theo lựa chọn đã lưu — vẽ khác máy chủ ngay lượt đầu là lỗi
 * hydrate.
 */
export function useLocale(): Locale {
  const stored = useLocaleStore((s) => s.locale);
  const hydrated = useHydrated();
  return hydrated ? stored : 'vi';
}

export type L = (vi: string, en: string) => string;

export function useL(): { L: L; locale: Locale; en: boolean } {
  const locale = useLocale();
  const L = useCallback<L>((vi, en) => (locale === 'en' ? en : vi), [locale]);
  return { L, locale, en: locale === 'en' };
}

/** Ngoài component (hàm thuần, xử lý sự kiện): đọc ngôn ngữ hiện tại một lần. */
export function currentLocale(): Locale {
  return useLocaleStore.getState().locale;
}

/** Chọn câu theo ngôn ngữ đã biết (dùng khi đã có `locale` trong tay). */
export function pick(locale: Locale, vi: string, en: string): string {
  return locale === 'en' ? en : vi;
}

/** Cặp song ngữ cho dữ liệu khai báo sẵn (hằng số ngoài component). */
export type Bi = { vi: string; en: string };
export function bi(b: Bi, locale: Locale): string {
  return locale === 'en' ? b.en : b.vi;
}
