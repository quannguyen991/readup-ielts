/**
 * Tìm một trích dẫn trong bài viết. Dùng chung cho phần chấm điểm và biên nhận
 * kiểm chứng, để hai bên không bao giờ có hai luật "thế nào là có thật" khác nhau.
 *
 * So khớp từng ký tự thì bỏ oan dẫn chứng đúng: model hay đổi nháy cong thành
 * nháy thẳng, hay gộp hai khoảng trắng thành một. Ở đây mọi khoảng trắng khớp với
 * mọi khoảng trắng, mọi loại nháy khớp với nhau, hoa thường không phân biệt.
 */

const APOSTROPHE = "['‘’]";
const DOUBLE_QUOTE = '["“”]';

/** Biểu thức khớp trích dẫn trong bài, `null` khi trích dẫn rỗng. */
export function quotePattern(quote: string): RegExp | null {
  const words = quote.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return null;
  const body = words
    .map((w) => escapeRegExp(w).replace(/['‘’]/g, APOSTROPHE).replace(/["“”]/g, DOUBLE_QUOTE))
    .join('\\s+');
  return new RegExp(body, 'iu');
}

/** Đoạn NGUYÊN VĂN trong `text` khớp với `quote`, hoặc `null` nếu không có. */
export function findVerbatim(quote: string, text: string): string | null {
  const hit = quotePattern(quote)?.exec(text);
  return hit ? hit[0] : null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
