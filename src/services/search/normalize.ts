/**
 * Chuẩn hoá chữ cho ô tìm bài: bỏ dấu tiếng Việt, đ → d, chữ thường, tách từ.
 *
 * Người học gõ "moi truong" trên bàn phím không bộ gõ cũng phải ra "Môi trường",
 * nên mọi so khớp đều làm trên bản ĐÃ BỎ DẤU của cả câu hỏi lẫn dữ liệu.
 *
 * Tách từ bằng `\p{L}` / `\p{N}` kèm cờ `u`, KHÔNG dùng `\b`: `\b` của JS chỉ
 * hiểu chữ ASCII, nên "trường" bị cắt vụn ở chữ có dấu (xem bộ nhớ dự án).
 * Ở đây dấu đã bỏ trước khi tách, nhưng giữ `\p{L}` để chữ lạ (é, ñ…) không làm
 * vỡ từ.
 */

const MARKS = /\p{M}+/gu;
const TOKEN = /[\p{L}\p{N}]+/gu;

/** "Môi Trường – Đà Lạt" → "moi truong – da lat". */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(MARKS, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/** Các từ đã bỏ dấu, theo thứ tự xuất hiện. */
export function tokenize(text: string): string[] {
  return fold(text).match(TOKEN) ?? [];
}

/** Các từ GIỮ NGUYÊN dấu (chỉ hạ chữ thường) — để ưu tiên mục khớp đúng dấu người gõ. */
export function tokenizeRaw(text: string): string[] {
  return text.normalize('NFC').toLowerCase().match(TOKEN) ?? [];
}

/** Bản gọn để so cụm: các từ nối bằng một dấu cách. */
export function foldPhrase(text: string): string {
  return tokenize(text).join(' ');
}
