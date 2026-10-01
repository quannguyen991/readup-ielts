import type { Locale } from '@/i18n/keys';

/**
 * Ngôn ngữ của lời nhắn máy chủ trả về (lỗi, thông báo) — CHỈ đọc từ header.
 *
 * Client gắn header này vào mọi lượt gọi `/api/...` cùng nguồn (xem
 * `src/i18n/fetch-locale.ts`). KHÔNG đoán theo `Accept-Language`: app mặc định
 * tiếng Việt kể cả trên máy cài tiếng Anh (cùng lý do với `useLocaleStore`), nên
 * thiếu header hay header lạ đều rơi về tiếng Việt — và các test đang kiểm câu
 * tiếng Việt vẫn đúng.
 *
 * Chỉ dịch LỜI NHẮN cho người đọc. Mã máy (`code`, `reason`), mã HTTP và hình
 * dạng JSON giữ nguyên để client cũ vẫn chạy.
 */
export const LOCALE_HEADER = 'x-band9-locale';

/** Nguồn ngôn ngữ: một Request (đọc header) hoặc locale đã biết sẵn. */
export type LocaleSource = Request | Locale | null | undefined;

export function localeOf(source: LocaleSource): Locale {
  if (!source) return 'vi';
  if (typeof source === 'string') return source === 'en' ? 'en' : 'vi';
  const raw = source.headers?.get(LOCALE_HEADER) ?? '';
  return raw.trim().toLowerCase() === 'en' ? 'en' : 'vi';
}

/** Chọn câu theo ngôn ngữ của người gọi: `msg(request, 'Thiếu dữ liệu.', 'Missing data.')`. */
export function msg(source: LocaleSource, vi: string, en: string): string {
  return localeOf(source) === 'en' ? en : vi;
}

/**
 * Tiền tố tiếng Việt mà lớp dịch vụ gắn vào lỗi (chủ yếu `services/ai/errors.ts`
 * `toAiError` và `services/ai/fallback.ts`), kèm bản tiếng Anh. Phần đuôi sau
 * tiền tố là chi tiết kỹ thuật thô (đa phần đã là tiếng Anh) nên giữ nguyên.
 */
const KNOWN_PREFIXES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^Hết thời gian chờ: /, 'Timed out: '],
  [/^Lỗi mạng: /, 'Network error: '],
  [/^Bị giới hạn tần suất: /, 'Rate limited: '],
  [/^Lỗi phía server AI \((\d+)\): /, 'AI server error ($1): '],
  [/^Nội dung bị từ chối: /, 'Content rejected: '],
  [/^Yêu cầu không hợp lệ \((\d+)\): /, 'Invalid request ($1): '],
  [/^Cả (\d+) proxy AI đều không gọi được\./, 'All $1 AI proxies failed.'],
];

/** Còn chữ có dấu tiếng Việt (kể cả đ/Đ) — tức là chưa dịch được trọn câu. */
const VIETNAMESE = /[À-ÃÈ-ÊÌÍÒ-ÕÙÚÝà-ãè-êìíò-õùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ]/;

/**
 * Lời lỗi từ một `catch` cho người dùng đọc.
 *
 * Tiếng Việt: giữ nguyên `err.message` như trước. Tiếng Anh: dịch các tiền tố
 * đã biết; nếu câu vẫn còn tiếng Việt (lỗi do dịch vụ tự đặt câu) thì dùng câu
 * tiếng Anh dự phòng của route — thà chung chung còn hơn nửa Anh nửa Việt.
 * Lỗi kỹ thuật thô (Supabase, mạng…) vốn đã là tiếng Anh thì đi qua nguyên vẹn.
 */
export function errorText(source: LocaleSource, err: unknown, vi: string, en: string): string {
  if (!(err instanceof Error) || !err.message) return msg(source, vi, en);
  if (localeOf(source) === 'vi') return err.message;
  let text = err.message;
  for (const [pattern, replacement] of KNOWN_PREFIXES) text = text.replace(pattern, replacement);
  if (!VIETNAMESE.test(text)) return text;
  // "Cả 3 proxy AI đều không gọi được." kèm từng dòng lý do (có thể tiếng Việt):
  // dòng đầu đã dịch được thì giữ dòng đầu.
  const firstLine = text.split('\n')[0] ?? '';
  return firstLine && !VIETNAMESE.test(firstLine) ? firstLine : en;
}
