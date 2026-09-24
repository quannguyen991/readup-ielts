/**
 * Luật cho "bôi đen là tra": đoạn nào đáng tra, màn nào không được tra.
 * Hàm thuần để test được.
 */

/** Chỉ tra đoạn tiếng Anh ngắn: 1–5 từ, chữ cái Latin, dài tối đa 48 ký tự. Trả về đoạn đã gọt, hoặc null. */
export function lookupable(raw: string): string | null {
  const text = raw.replace(/\s+/g, ' ').trim().replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
  if (text.length < 2 || text.length > 48) return null;
  if (!/^[A-Za-z][A-Za-z'’\- ]*$/.test(text)) return null;
  if (text.split(' ').length > 5) return null;
  return text;
}
