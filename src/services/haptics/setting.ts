/** Khoá localStorage của công tắc rung — màn làm bài cũng đọc đúng khoá này. */
export const HAPTICS_KEY = 'band9.haptics';

/** Thuần: giá trị lưu → đang bật hay không. Không có giá trị = bật; chỉ 'off' mới tắt. */
export function parseHapticsSetting(raw: string | null | undefined): boolean {
  return raw !== 'off';
}
