import type { BookId } from './catalog';

/**
 * TỦ SÁCH MỞ DẦN — luật mở sách theo tiến độ học, dùng chung cho app và máy chủ.
 *
 * - Đăng ký tài khoản → nhận đúng MỘT cuốn đầy đủ (`GIFT_FIRST_BOOK`).
 * - Các cuốn còn lại mở dần: mỗi cuốn có chỉ tiêu riêng về số nhiệm vụ đã nhận
 *   thưởng và số bài đã học xong (`BOOK_REQUIREMENTS`). Đạt chỉ tiêu thì tải được.
 * - Người đã trả tiền gói Max hoặc gói năm (xem `entitlement.ts`) tải được cả tủ,
 *   không cần đạt chỉ tiêu.
 *
 * Máy chủ tự đọc tiến độ từ kho đồng bộ (`user_state`, khoá `game` và `lessons`)
 * và kiểm ở `/api/books/pdf`, không tin con số do máy gửi lên khi tải. Chỉ tiêu
 * là con số tạm: chỉnh ở `BOOK_REQUIREMENTS`, các màn khác đọc từ đây.
 */

/** Cuốn tặng khi đăng ký. Đổi ở đây nếu muốn tặng cuốn khác. */
export const GIFT_FIRST_BOOK: BookId = 'ielts-reading';

/** Chỉ tiêu để mở một cuốn: số nhiệm vụ đã nhận thưởng và số bài đã học xong. */
export type BookRequirement = { quests: number; lessons: number };

/** Thứ tự mở của 11 cuốn. Cuốn quà mở ngay khi đăng ký (0/0). */
export const BOOK_REQUIREMENTS: Record<BookId, BookRequirement> = {
  'ielts-reading': { quests: 0, lessons: 0 },
  'ielts-listening': { quests: 2, lessons: 2 },
  'ielts-vocab': { quests: 4, lessons: 4 },
  'ielts-task1': { quests: 6, lessons: 6 },
  'ielts-task2': { quests: 8, lessons: 8 },
  'ielts-speaking': { quests: 10, lessons: 10 },
  'sat-math-20w': { quests: 12, lessons: 12 },
  'sat-math-30u': { quests: 15, lessons: 15 },
  'sat-rw-16w': { quests: 18, lessons: 18 },
  'sat-rw-16u': { quests: 21, lessons: 21 },
  bilingual: { quests: 25, lessons: 25 },
};

/** Tiến độ của một người: nhiệm vụ đã nhận thưởng, bài đã học xong. */
export type BookProgress = { quests: number; lessons: number };

/** Số đếm hợp lệ: số âm, NaN hoặc không phải số thì coi như 0. */
export function cleanCount(value: unknown): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : 0;
  return Math.max(0, n);
}

/** Cuốn này đã đủ chỉ tiêu để mở chưa. */
export function bookUnlocked(id: BookId, progress: BookProgress): boolean {
  const need = BOOK_REQUIREMENTS[id];
  return cleanCount(progress.quests) >= need.quests && cleanCount(progress.lessons) >= need.lessons;
}

/** Các cuốn đã mở theo tiến độ (chưa tính quyền trả tiền). */
export function unlockedBooks(progress: BookProgress): BookId[] {
  return (Object.keys(BOOK_REQUIREMENTS) as BookId[]).filter((id) => bookUnlocked(id, progress));
}

/** Tiến độ còn thiếu để mở một cuốn, dùng cho dòng hướng dẫn trên bìa. */
export function bookGap(id: BookId, progress: BookProgress): { quests: number; lessons: number } {
  const need = BOOK_REQUIREMENTS[id];
  return {
    quests: Math.max(0, need.quests - cleanCount(progress.quests)),
    lessons: Math.max(0, need.lessons - cleanCount(progress.lessons)),
  };
}
