/**
 * Thưởng mốc chuỗi ngày — LUẬT THUẦN, không chạm store.
 *
 * Đạt một mốc (3, 7, 14… ngày liên tiếp) thì được cộng sao MỘT LẦN. Sao ghi vào `prizes`
 * của kho phần thưởng dưới khoá `streak:<số ngày>`, nên đi cùng đồng bộ tài khoản và được
 * tính vào số dư như mọi khoản thưởng khác. Đã nhận thì mất chuỗi cũng không bị thu lại.
 */

export type StreakMilestone = { days: number; stars: number };

/** Các mốc và số sao thưởng. Chỉnh số ở đây là đủ: màn hình và số dư đọc từ bảng này. */
export const STREAK_MILESTONES: readonly StreakMilestone[] = [
  { days: 3, stars: 10 },
  { days: 7, stars: 30 },
  { days: 14, stars: 60 },
  { days: 30, stars: 150 },
  { days: 60, stars: 300 },
  { days: 100, stars: 500 },
];

export const STREAK_PRIZE_PREFIX = 'streak:';

export function streakPrizeKey(days: number): string {
  return `${STREAK_PRIZE_PREFIX}${days}`;
}

export function isStreakPrizeKey(key: string): boolean {
  return key.startsWith(STREAK_PRIZE_PREFIX);
}

/** Các mốc đã đạt tới `streak` ngày mà chưa được ghi sao. Trả về đúng thứ cần cộng lúc này. */
export function unclaimedMilestones(
  streak: number,
  prizes: Record<string, number> | undefined,
): StreakMilestone[] {
  return STREAK_MILESTONES.filter((m) => m.days <= streak && prizes?.[streakPrizeKey(m.days)] === undefined);
}

/** Tổng sao đã nhận từ mốc chuỗi. Các khoá khác trong `prizes` không tính ở đây. */
export function streakBonusTotal(prizes: Record<string, number> | undefined): number {
  return Object.entries(prizes ?? {}).reduce(
    (sum, [key, stars]) => (isStreakPrizeKey(key) ? sum + Math.max(0, stars) : sum),
    0,
  );
}

/** Mốc kế tiếp chưa đạt, và còn thiếu bao nhiêu ngày. Đã qua mốc cuối thì trả null. */
export function nextStreakMilestone(streak: number): { milestone: StreakMilestone; remaining: number } | null {
  const milestone = STREAK_MILESTONES.find((m) => m.days > streak);
  return milestone ? { milestone, remaining: milestone.days - streak } : null;
}
