import type { Bi } from '@/i18n/useL';

import type { SearchEntry } from './types';

/**
 * Nhãn hiển thị của mục tìm kiếm. Tách khỏi `catalog.ts` để bảng tìm (vốn gắn
 * trong khung app và mở ngay khi tải trang) không phải kéo theo toàn bộ chỉ mục
 * và các bộ từ vựng vào lúc khởi động.
 */

/** Nhãn trình độ có hai thứ tiếng (bài học lý thuyết, độ khó bộ dịch câu). */
const LEVEL_LABEL: Record<string, Bi> = {
  'Nền tảng': { vi: 'Nền tảng', en: 'Foundation' },
  'Trung bình': { vi: 'Trung bình', en: 'Intermediate' },
  'Nâng cao': { vi: 'Nâng cao', en: 'Advanced' },
  easy: { vi: 'Dễ', en: 'Easy' },
  medium: { vi: 'Vừa', en: 'Medium' },
  hard: { vi: 'Khó', en: 'Hard' },
};

/** Tiêu đề theo ngôn ngữ, thiếu bản tiếng Anh thì dùng bản tiếng Việt. */
export function entryTitle(entry: Pick<SearchEntry, 'title'>, locale: 'vi' | 'en'): string {
  return (locale === 'en' ? entry.title.en : entry.title.vi) || entry.title.vi;
}

/** Nhãn trình độ theo ngôn ngữ ("Nền tảng" → "Foundation", "easy" → "Dễ"; nhãn khác giữ nguyên). */
export function levelLabel(level: string, locale: 'vi' | 'en'): string {
  const known = LEVEL_LABEL[level];
  return known ? known[locale] : level;
}

export function entrySubtitle(entry: Pick<SearchEntry, 'subtitle'>, locale: 'vi' | 'en'): string {
  if (!entry.subtitle) return '';
  return (locale === 'en' ? entry.subtitle.en : entry.subtitle.vi) || entry.subtitle.vi;
}
