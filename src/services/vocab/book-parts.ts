/**
 * Chia một bộ sách từ vựng thành các phần (chủ đề lớn), mỗi phần 30–50 từ.
 *
 * Từ trong bộ sách giữ đúng thứ tự của sách gốc (xem `book-vocab.json`), nên
 * cắt liên tiếp theo thứ tự đó vẫn giữ được các nhóm chủ đề gần nhau.
 * Số phần = ⌈N / 50⌉, các phần chia đều nên mỗi phần luôn nằm trong 30–50 từ
 * (khi N > 50).
 */

export const BOOK_PART_SEP = '--p';
const BOOK_PART_SUFFIX = /^(.*)--p(\d+)$/;

export type BookPartRange = { start: number; end: number };

export function bookPartRanges(total: number): BookPartRange[] {
  if (total <= 0) return [];
  const count = Math.ceil(total / 50);
  const base = Math.floor(total / count);
  const extra = total % count;
  const ranges: BookPartRange[] = [];
  let start = 0;
  for (let i = 0; i < count; i++) {
    const size = base + (i < extra ? 1 : 0);
    ranges.push({ start, end: start + size });
    start += size;
  }
  return ranges;
}

/** Tách `bo--p3` thành slug bộ gốc và số phần (bắt đầu từ 1). Không khớp thì trả về null. */
export function splitBookPartSlug(slug: string): { base: string; part: number } | null {
  const m = BOOK_PART_SUFFIX.exec(slug);
  return m ? { base: m[1]!, part: Number(m[2]) } : null;
}
