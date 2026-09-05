import { en } from './en';
import { vi } from './vi';
import type { Dictionary, Locale, MessageKey } from './keys';

export type { Locale, MessageKey } from './keys';

export const DICTIONARIES: Readonly<Record<Locale, Dictionary>> = { vi, en };

export const LOCALE_LABEL: Record<Locale, string> = { vi: 'Tiếng Việt', en: 'English' };

/**
 * Tra một câu và thay tham số.
 *
 * Tham số viết dạng `{ten}`.
 *
 * SỐ NHIỀU: viết hai dạng cách nhau bằng `|`, dạng số ít đứng trước —
 * `"{n} observation|{n} observations"`. Chọn theo tham số `n`.
 *
 * Chỉ đúng chừng ấy, và cố ý không hơn. Tiếng Anh có hai dạng, tiếng Việt không
 * chia số nhiều, nên hai nhánh là đủ cho hai ngôn ngữ đang có. Không có định
 * dạng số theo vùng, không có giống — một cơ chế chưa dùng tới chỉ tổ làm người
 * sau tưởng nó đã được kiểm.
 *
 * THIẾU KHOÁ THÌ TRẢ VỀ CHÍNH KHOÁ, không trả chuỗi rỗng. Chuỗi rỗng biến thành
 * một khoảng trống im lặng trong giao diện và có thể sống sót nhiều tháng; nhìn
 * thấy `mastery.title` nằm chình ình thì sửa ngay trong ngày.
 */
export function translate(
  locale: Locale,
  key: MessageKey,
  params?: Readonly<Record<string, string | number>>,
): string {
  const dict = DICTIONARIES[locale] ?? vi;
  let text: string = dict[key] ?? vi[key] ?? key;

  if (text.includes('|')) {
    const [one = '', many = ''] = text.split('|');
    const n = Number(params?.n);
    text = Number.isFinite(n) && Math.abs(n) === 1 ? one : many;
  }

  if (!params) return text;
  for (const [name, value] of Object.entries(params)) {
    text = text.split(`{${name}}`).join(String(value));
  }
  return text;
}
