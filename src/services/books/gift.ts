import type { BookId } from './catalog';

/**
 * QUÀ SÁCH CHO NGƯỜI HỌC — luật tặng, không phải luật bán.
 *
 * - Đăng ký tài khoản → nhận đúng MỘT cuốn đầy đủ (`GIFT_FIRST_BOOK`). Máy chủ
 *   kiểm tra việc này khi tải (`/api/books/pdf`), không chỉ ẩn nút ở máy.
 * - Muốn mở TOÀN BỘ tủ sách thì phải dùng app: làm đủ nhiệm vụ và học đủ bài.
 *   Hai ngưỡng dưới đây là con số tạm; chỉnh ở đây, các màn khác đọc từ đây.
 *
 * Tiến độ nhiệm vụ và bài học hiện chỉ có trên máy người dùng, nên mở toàn bộ
 * CHƯA được máy chủ kiểm tra. Khi đồng bộ tiến độ lên máy chủ, hàm `fullSetUnlocked`
 * là chỗ quyết định.
 */

/** Cuốn tặng khi đăng ký. Đổi ở đây nếu muốn tặng cuốn khác. */
export const GIFT_FIRST_BOOK: BookId = 'ielts-reading';

/** Số nhiệm vụ hằng ngày đã nhận thưởng để mở toàn bộ sách. */
export const GIFT_QUEST_GOAL = 10;

/** Số bài học đã hoàn thành để mở toàn bộ sách. */
export const GIFT_LESSON_GOAL = 10;

export type GiftProgress = {
  questsDone: number;
  lessonsDone: number;
  questGoal: number;
  lessonGoal: number;
  /** Tỉ lệ hoàn thành 0–1, lấy phần thấp hơn của hai mục. */
  ratio: number;
  unlocked: boolean;
};

/** Tiến độ quà, từ số liệu đã đếm trên máy. Số âm hoặc không phải số thì coi như 0. */
export function giftProgress(questsDone: number, lessonsDone: number): GiftProgress {
  const q = Math.max(0, Math.floor(Number.isFinite(questsDone) ? questsDone : 0));
  const l = Math.max(0, Math.floor(Number.isFinite(lessonsDone) ? lessonsDone : 0));
  const ratio = Math.min(1, Math.min(q / GIFT_QUEST_GOAL, l / GIFT_LESSON_GOAL));
  return {
    questsDone: q,
    lessonsDone: l,
    questGoal: GIFT_QUEST_GOAL,
    lessonGoal: GIFT_LESSON_GOAL,
    ratio,
    unlocked: q >= GIFT_QUEST_GOAL && l >= GIFT_LESSON_GOAL,
  };
}

/** Đủ điều kiện mở toàn bộ tủ sách: đã đăng ký và đã đủ cả hai ngưỡng. */
export function fullSetUnlocked(signedIn: boolean, questsDone: number, lessonsDone: number): boolean {
  return signedIn && giftProgress(questsDone, lessonsDone).unlocked;
}
