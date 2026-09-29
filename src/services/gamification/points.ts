/**
 * Điểm, hạng và chuỗi ngày — LUẬT THUẦN, không chạm React hay store.
 *
 * MỘT NGUỒN SỰ THẬT DUY NHẤT: mọi con số trên trang Xếp hạng và Cửa hàng đều
 * tính từ nhật ký học có sẵn (`useStudyStore.daily`), không có biến điểm riêng
 * nào được cộng tay ở chỗ khác. Cộng tay là cách chắc chắn nhất để bảng xếp
 * hạng lệch khỏi thời gian học thật, và khi đã lệch thì không ai lần lại được.
 *
 * ĐIỂM CÓ TRẦN NGÀY. Không có trần thì người cày một buổi mười tiếng đứng trên
 * người học đều mỗi ngày — trong khi thứ app muốn thưởng là nhịp đều.
 *
 * ĐỒNG XU = ĐIỂM ĐÃ KIẾM, không phải một loại tiền thứ hai. Mua gì thì trừ vào
 * tổng ấy; số dư = tổng điểm mọi thời − đã tiêu.
 */

import { dayBoost } from './promo';

export type DayLog = { minutes: number; questions: number };

/** Công mỗi phút học và mỗi câu đã làm, trước khi nhân hệ số chuỗi. */
export const POINT_PER_MINUTE = 1;
export const POINT_PER_QUESTION = 0.5;
/** Trần điểm một ngày, sau khi đã nhân hệ số. */
export const DAILY_POINT_CAP = 60;
/** Mỗi ngày chuỗi cộng thêm bao nhiêu vào hệ số, và trần hệ số. */
export const STREAK_STEP = 0.1;
export const MAX_MULTIPLIER = 2;

export function streakMultiplier(streakDays: number): number {
  const raw = 1 + Math.max(0, streakDays) * STREAK_STEP;
  return Math.min(MAX_MULTIPLIER, Math.round(raw * 100) / 100);
}

/** Điểm thô của một ngày: phút học + câu đã làm, chưa nhân hệ số. */
export function rawEffort(day: DayLog | undefined): number {
  if (!day) return 0;
  return Math.max(0, day.minutes) * POINT_PER_MINUTE + Math.max(0, day.questions) * POINT_PER_QUESTION;
}

/**
 * Sao của một ngày. `dayKey` (YYYY-MM-DD) để áp mùa khuyến mãi — trong mùa sao
 * nhân đôi và trần ngày cao hơn (`gamification/promo.ts`). Không truyền ngày thì
 * tính theo luật thường.
 */
export function dailyPoints(day: DayLog | undefined, streakDays: number, dayKey?: string): number {
  const boost = dayBoost(dayKey, DAILY_POINT_CAP);
  const points = rawEffort(day) * streakMultiplier(streakDays) * boost.multiplier;
  return Math.min(boost.cap, Math.round(points));
}

/** Trần sao của một ngày cụ thể (để hiện đúng "tối đa bao nhiêu" trên giao diện). */
export function dailyCapFor(dayKey: string): number {
  return dayBoost(dayKey, DAILY_POINT_CAP).cap;
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function shiftDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Chuỗi ngày học liên tiếp tính tới hôm nay.
 *
 * Hôm nay chưa học thì chuỗi CHƯA đứt — nó chỉ đứt khi hôm qua cũng trống.
 * Ngày nào nằm trong `frozen` (mua thẻ giữ chuỗi ở Cửa hàng) được tính như đã
 * học: đó chính là thứ người dùng đã trả đồng xu để mua.
 */
export function currentStreak(
  daily: Record<string, DayLog>,
  today: Date = new Date(),
  frozen: readonly string[] = [],
): number {
  const frozenSet = new Set(frozen);
  let streak = 0;
  for (let back = 0; back < 400; back += 1) {
    const key = dateKey(shiftDays(today, -back));
    const active = (daily[key]?.minutes ?? 0) > 0 || frozenSet.has(key);
    if (active) streak += 1;
    else if (back > 0) break;
  }
  return streak;
}

/**
 * Tổng điểm của một tháng.
 *
 * Hệ số của MỖI ngày tính theo chuỗi tính tới đúng ngày đó, không phải chuỗi
 * hôm nay: nếu không thì hôm nay đứt chuỗi là điểm cả tháng tụt xuống, và bảng
 * xếp hạng đổi thứ hạng của những ngày đã qua.
 */
export function monthPoints(
  daily: Record<string, DayLog>,
  month: Date = new Date(),
  frozen: readonly string[] = [],
): number {
  let total = 0;
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  for (let day = 1; day <= days; day += 1) {
    const date = new Date(year, monthIndex, day);
    if (date > month) break;
    const key = dateKey(date);
    if (!daily[key]) continue;
    total += dailyPoints(daily[key], currentStreak(daily, date, frozen) - 1, key);
  }
  return total;
}

/** Tổng điểm mọi thời — dùng làm số đồng xu đã kiếm. */
export function lifetimePoints(daily: Record<string, DayLog>, frozen: readonly string[] = []): number {
  let total = 0;
  for (const key of Object.keys(daily)) {
    const [y, m, d] = key.split('-').map(Number);
    if (!y || !m || !d) continue;
    total += dailyPoints(daily[key], currentStreak(daily, new Date(y, m - 1, d), frozen) - 1, key);
  }
  return total;
}

export type Tier = { key: string; name: string; from: number; stars: number };

/**
 * Bậc theo điểm THÁNG, không theo điểm mọi thời.
 *
 * Bậc tính theo tổng mọi thời thì người học lâu năm đứng mãi ở đỉnh dù tháng
 * này không học buổi nào, còn người mới thì không bao giờ với tới — bảng xếp
 * hạng khi đó chỉ đo tuổi tài khoản.
 */
export const TIERS: Tier[] = [
  { key: 'tan-binh', name: 'Tân binh', from: 0, stars: 1 },
  { key: 'cham-chi', name: 'Chăm chỉ', from: 150, stars: 2 },
  { key: 'ben-bi', name: 'Bền bỉ', from: 400, stars: 3 },
  { key: 'thien-xa', name: 'Thiện xạ', from: 800, stars: 4 },
  { key: 'thien-tai', name: 'Thiên tài', from: 1400, stars: 5 },
];

export function tierFor(points: number): Tier {
  let found = TIERS[0]!;
  for (const tier of TIERS) if (points >= tier.from) found = tier;
  return found;
}

/** Bậc kế tiếp và số điểm còn thiếu; đã ở bậc cao nhất thì trả null. */
export function nextTier(points: number): { tier: Tier; remaining: number } | null {
  const next = TIERS.find((t) => t.from > points);
  return next ? { tier: next, remaining: next.from - points } : null;
}

/** Số ngày còn lại tới khi bảng xếp hạng tháng đặt lại. */
export function daysUntilReset(today: Date = new Date()): number {
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return last - today.getDate() + 1;
}
