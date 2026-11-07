/**
 * Thưởng khối lượng học trong ngày — LUẬT THUẦN, không chạm store.
 *
 * Học đủ số từ trong một ngày thì được cộng sao, mỗi mốc một lần mỗi ngày. Sao được nhân theo
 * chuỗi ngày học: cứ 7 ngày liên tiếp thêm 0,5 lần, tối đa 3 lần. Sao ghi vào `prizes` của kho
 * phần thưởng dưới khoá `daily:<ngày>:<số từ>`, cùng cách với thưởng mốc chuỗi.
 */

export type DailyTier = { words: number; stars: number };

/** Các mốc số từ trong ngày và sao gốc (trước khi nhân). */
export const DAILY_VOLUME_TIERS: readonly DailyTier[] = [
  { words: 20, stars: 10 },
  { words: 50, stars: 25 },
  { words: 100, stars: 60 },
];

export const DAILY_PRIZE_PREFIX = 'daily:';

export function dailyPrizeKey(day: string, words: number): string {
  return `${DAILY_PRIZE_PREFIX}${day}:${words}`;
}

/** Hệ số nhân theo chuỗi ngày: 1× ban đầu, +0,5× mỗi 7 ngày, trần 3×. */
export function dailyMultiplier(streakDays: number): number {
  const weeks = Math.max(0, Math.floor(streakDays / 7));
  return Math.min(3, 1 + weeks * 0.5);
}

/** Các mốc đã đạt trong ngày mà chưa được ghi sao. */
export function unclaimedDailyTiers(
  day: string,
  words: number,
  prizes: Record<string, number> | undefined,
): DailyTier[] {
  return DAILY_VOLUME_TIERS.filter((t) => t.words <= words && prizes?.[dailyPrizeKey(day, t.words)] === undefined);
}

/** Sao được cộng cho một danh sách mốc, đã nhân hệ số chuỗi và làm tròn. */
export function dailyBonusStars(tiers: readonly DailyTier[], streakDays: number): number {
  const base = tiers.reduce((sum, t) => sum + t.stars, 0);
  return Math.round(base * dailyMultiplier(streakDays));
}
