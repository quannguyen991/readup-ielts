import { dayKeyOf } from './daily';

/**
 * Thống kê "Từ của tôi" trên màn Tiến độ, kiểu Gia sư từ vựng: số từ đã lưu, số từ thành thạo,
 * số từ đang học, số lượt ôn hôm nay và biểu đồ số lượt ôn 7 ngày. Hàm thuần: nhận số liệu, không
 * chạm store, nên test được bằng bộ test của Node.
 */

/** Từ đạt mốc này trở lên thì tính là thành thạo. */
export const MASTERED_AT = 80;

export type WordStatsInput = {
  /** Phần trăm thuộc của từng từ đã lưu. */
  masteryPercent: number[];
  /** Thời điểm mỗi lượt ôn (ISO). */
  reviewedAt: string[];
};

export type WordStats = {
  total: number;
  mastered: number;
  learning: number;
  reviewedToday: number;
  /** 7 ngày gần nhất, cũ → mới; `count` là số lượt ôn trong ngày. */
  week: { day: string; count: number; isToday: boolean }[];
};

export function wordStats(input: WordStatsInput, now: Date = new Date()): WordStats {
  const total = input.masteryPercent.length;
  const mastered = input.masteryPercent.filter((p) => p >= MASTERED_AT).length;
  const learning = input.masteryPercent.filter((p) => p < MASTERED_AT).length;

  const today = dayKeyOf(now);
  const counts = new Map<string, number>();
  for (const iso of input.reviewedAt) {
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) continue;
    const key = dayKeyOf(t);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const week: WordStats['week'] = [];
  for (let back = 6; back >= 0; back -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
    const day = dayKeyOf(d);
    week.push({ day, count: counts.get(day) ?? 0, isToday: day === today });
  }

  return { total, mastered, learning, reviewedToday: counts.get(today) ?? 0, week };
}
