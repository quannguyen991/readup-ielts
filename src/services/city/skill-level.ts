/**
 * Cấp của CÔNG TRÌNH KỸ NĂNG (Nhà Từ Vựng, Nhà Nghe, Nhà Đọc Hiểu, Thư viện,
 * Học viện) — lấy từ dữ liệu học THẬT trên máy. Chưa có dữ liệu thì trả về
 * `null` và giao diện hiện "—": không tự bịa một con số cho đẹp.
 */
import type { SkillMetric } from '@/data/city/catalog';

/** Mốc lên cấp theo từng thước đo (giá trị đạt mốc thứ k → cấp k). */
export const SKILL_LADDER: Record<SkillMetric, readonly number[]> = {
  vocab: [5, 20, 50, 100, 200, 350, 500, 800, 1200, 2000],
  listening: [10, 40, 100, 200, 400, 700, 1000, 1500, 2200, 3000],
  reading: [1, 3, 6, 10, 15, 25, 40, 60, 85, 120],
  library: [1, 3, 6, 10, 20, 35, 50, 75, 100, 150],
  overall: [100, 400, 1000, 2000, 3500, 5500, 8000, 11000, 15000, 20000],
};

export type SkillReading = { metric: SkillMetric; value: number; level: number; nextAt: number | null };

export function skillLevel(metric: SkillMetric, value: number): SkillReading | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  const ladder = SKILL_LADDER[metric];
  const level = ladder.filter((t) => value >= t).length;
  if (level === 0) return { metric, value, level: 0, nextAt: ladder[0]! };
  return { metric, value, level, nextAt: ladder[level] ?? null };
}

/** Số đo thô của từng mảng, tính từ dữ liệu trong các store học tập. */
export type SkillSources = {
  /** Trạng thái từ: đếm từ đã 'known'. */
  wordStatus: Record<string, { status: string }>;
  /** Lượt nghe chép chính tả: tổng số câu đã luyện. */
  dictationTotals: readonly number[];
  /** Số lượt làm bài đọc (luyện + thi thử). */
  readingSessions: number;
  /** Tiến độ đọc bài: bài đọc xong ≥ 90%. */
  readingProgress: readonly number[];
  xp: number;
};

export function skillValue(metric: SkillMetric, src: SkillSources): number {
  switch (metric) {
    case 'vocab':
      return Object.values(src.wordStatus).filter((w) => w.status === 'known').length;
    case 'listening':
      return src.dictationTotals.reduce((a, b) => a + Math.max(0, b), 0);
    case 'reading':
      return src.readingSessions;
    case 'library':
      return src.readingProgress.filter((p) => p >= 90).length;
    case 'overall':
      return src.xp;
  }
}
