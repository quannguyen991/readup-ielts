/**
 * THƯỞNG HẠNG THÁNG — cuối mỗi tháng, ai đứng trong top 10 bảng xếp hạng được
 * nhận sao ở tháng sau. Luật thuần để test được.
 *
 * Thưởng dựa trên ĐIỂM THÁNG (thời gian học + số câu, có trần mỗi ngày), nên
 * cách duy nhất để lên top là học nhiều ngày — một buổi cày không vượt được trần
 * 60 điểm/ngày. Nhận một lần cho mỗi tháng; hai máy cùng nhận thì chỉ tính một
 * (`mergeReward` gộp theo tháng).
 */

export const MONTH_PRIZES: { upTo: number; stars: number; label: string }[] = [
  { upTo: 1, stars: 300, label: 'Hạng nhất' },
  { upTo: 2, stars: 200, label: 'Hạng nhì' },
  { upTo: 3, stars: 150, label: 'Hạng ba' },
  { upTo: 10, stars: 50, label: 'Top 10' },
];

/** Số sao thưởng cho một hạng (hạng đếm từ 1); ngoài top 10 thì 0. */
export function prizeForRank(rank: number): number {
  if (!Number.isInteger(rank) || rank < 1) return 0;
  return MONTH_PRIZES.find((p) => rank <= p.upTo)?.stars ?? 0;
}

/** Mã tháng dạng YYYY-MM theo giờ máy. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Giây cuối cùng của tháng trước — đưa vào `monthPoints` để tính trọn tháng đó. */
export function endOfPreviousMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
}

/** Tổng sao đã nhận từ thưởng hạng tháng. */
export function prizeTotal(prizes: Record<string, number> | undefined): number {
  return Object.values(prizes ?? {}).reduce((sum, n) => sum + Math.max(0, n), 0);
}
