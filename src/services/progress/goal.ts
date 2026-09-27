/**
 * Tiến độ tới band mục tiêu — tính từ số người dùng TỰ KHAI, không bịa.
 *
 * Trước 27/09/2026 trang Tiến độ in "Target Band 7.0" lấy từ giá trị mặc định
 * cứng của store (không chỗ nào cho đặt), và "on track" là band hiện tại chia
 * mục tiêu: người mới làm một bài được 2.5 thấy "36%". Người dùng bắt phải
 * theo đúng trình độ của từng người.
 *
 * Nguồn:
 * - mục tiêu: Lộ trình (ô "band mục tiêu" lúc lập) → cột target_band của hồ sơ;
 * - điểm xuất phát: band hiện tại khai ở Lộ trình → bài chấm band đầu tiên;
 * - điểm bây giờ: bài chấm band gần nhất.
 * Tiến độ = quãng đã đi / quãng phải đi, từ điểm xuất phát tới mục tiêu.
 */
export type GoalProgress =
  | { state: 'no-goal' }
  | { state: 'no-score'; target: number }
  | { state: 'progress' | 'reached'; target: number; start: number; current: number; pct: number; left: number };

export function goalProgress({
  roadmapTarget,
  profileTarget,
  roadmapNow,
  firstBand,
  current,
}: {
  roadmapTarget: number | null | undefined;
  profileTarget: number | null | undefined;
  /** Band hiện tại người dùng khai ở Lộ trình; null = "chưa biết". */
  roadmapNow: number | null | undefined;
  /** Band của bài chấm đầu tiên từng làm. */
  firstBand: number | null | undefined;
  /** Band của bài chấm gần nhất. */
  current: number | null | undefined;
}): GoalProgress {
  const target = roadmapTarget ?? profileTarget ?? null;
  if (target == null || target <= 0) return { state: 'no-goal' };
  if (current == null) return { state: 'no-score', target };

  const start = roadmapNow ?? firstBand ?? current;
  const left = Math.max(0, round1(target - current));
  if (current >= target) return { state: 'reached', target, start, current, pct: 100, left: 0 };

  const span = target - start;
  // Xuất phát đã ở trên mục tiêu mà giờ tụt xuống dưới: coi như chưa đi được gì.
  const pct = span <= 0 ? 0 : Math.round(Math.min(1, Math.max(0, (current - start) / span)) * 100);
  return { state: 'progress', target, start, current, pct, left };
}

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

/**
 * Band của bài mẫu Writing theo mục tiêu người học. Máy chủ chỉ soạn ở 6, 7, 8
 * (có hướng dẫn chấm cho từng mức), nên làm tròn rồi kẹp vào khoảng đó.
 * Chưa đặt mục tiêu thì 7 — mức phổ biến nhất người học nhắm tới.
 */
export function modelEssayBand(target: number | null | undefined): 6 | 7 | 8 {
  if (target == null || !Number.isFinite(target)) return 7;
  return Math.min(8, Math.max(6, Math.round(target))) as 6 | 7 | 8;
}
