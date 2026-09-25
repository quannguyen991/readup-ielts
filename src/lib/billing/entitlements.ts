import {
  PLANS,
  PLAN_ORDER,
  QUOTA_PERIOD,
  TRIAL_AI_PLAN,
  planOf,
  type Feature,
  type PlanId,
  type Quota,
  type QuotaPeriod,
} from './plans';

/**
 * Ai được làm gì, và còn được làm bao nhiêu lần nữa.
 *
 * Toàn bộ file này là HÀM THUẦN. Không đọc store, không gọi mạng, không biết
 * React. Nhờ vậy mọi luật chặn đều test được bằng ca cụ thể — mà đây đúng là chỗ
 * phải chắc: chặn nhầm người đã trả tiền là mất khách, chặn sót là mất doanh thu.
 *
 * ⚠️ ĐÂY LÀ TẦNG TRẢI NGHIỆM, KHÔNG PHẢI TẦNG BẢO MẬT. Gói hiện lưu ở client,
 * nên người biết mở DevTools sửa được. Chấp nhận được lúc CHƯA CÓ THANH TOÁN.
 * Khi nối cổng thanh toán thì gói phải do máy chủ ghi vào `profiles.plan` (đã
 * thu hồi quyền UPDATE cột đó của `authenticated` trong migration), và mọi API
 * tốn tiền — `/api/chat`, `/api/questions`, `/api/writing/*` — phải tự kiểm gói
 * ở phía server chứ không tin client.
 */

export type Entitlement =
  | { allowed: true }
  | { allowed: false; reason: 'plan'; requiredPlan: PlanId }
  | { allowed: false; reason: 'quota'; quota: Quota; limit: number; used: number };

export function hasFeature(plan: PlanId, feature: Feature): boolean {
  return planOf(plan).features.includes(feature);
}

/**
 * Gói RẺ NHẤT mở được tính năng này — để câu mời nâng cấp không đòi quá tay.
 *
 * Duyệt theo `PLAN_ORDER` chứ không liệt kê tay từng gói: thêm một bậc vào bảng
 * giá thì hàm này đúng ngay, còn bản viết tay thì âm thầm đòi người dùng mua
 * gói đắt hơn mức cần.
 */
export function requiredPlanFor(feature: Feature): PlanId {
  for (const id of PLAN_ORDER) {
    if (PLANS[id].features.includes(feature)) return id;
  }
  // Không gói nào mở được: đòi gói cao nhất, vì đó là câu trả lời ít sai nhất.
  return PLAN_ORDER[PLAN_ORDER.length - 1]!;
}

/**
 * Gói dùng để TÍNH HẠN MỨC. Đang học thử thì mọi thứ theo gói thử, riêng lượt
 * AI vẫn theo `TRIAL_AI_PLAN` (Free) — khớp với máy chủ, xem plans.ts.
 */
export function quotaPlan(plan: PlanId, quota: Quota, onTrial: boolean): PlanId {
  return onTrial && quota === 'ai_calls_per_month' ? TRIAL_AI_PLAN : plan;
}

/** `null` = không giới hạn. */
export function quotaLimit(plan: PlanId, quota: Quota): number | null {
  return planOf(plan).quotas[quota];
}

export function checkFeature(plan: PlanId, feature: Feature): Entitlement {
  if (hasFeature(plan, feature)) return { allowed: true };
  return { allowed: false, reason: 'plan', requiredPlan: requiredPlanFor(feature) };
}

export function checkQuota(plan: PlanId, quota: Quota, used: number): Entitlement {
  const limit = quotaLimit(plan, quota);
  if (limit === null) return { allowed: true };
  if (used < limit) return { allowed: true };
  return { allowed: false, reason: 'quota', quota, limit, used };
}

export function remainingQuota(plan: PlanId, quota: Quota, used: number): number | null {
  const limit = quotaLimit(plan, quota);
  return limit === null ? null : Math.max(0, limit - used);
}

/**
 * Chỉ số chặng SAT Math mà gói này mở được.
 *
 * Free được TRỌN chặng 1 chứ không phải vài bài lẻ. Cho nửa chặng rồi chặn giữa
 * chừng là kiểu chặn khó chịu nhất: người học đang có đà thì bị dừng, và cảm
 * giác còn lại là bị gài chứ không phải được dùng thử.
 */
export const FREE_STAGE_COUNT = 1;

export function unlockedStageCount(plan: PlanId): number | null {
  return hasFeature(plan, 'math_all_stages') ? null : FREE_STAGE_COUNT;
}

export function isStageUnlocked(plan: PlanId, stageIndex: number): boolean {
  const unlocked = unlockedStageCount(plan);
  return unlocked === null || stageIndex < unlocked;
}

// ------------------------------------------------------------ chu kỳ hạn mức

/**
 * Khoá của chu kỳ hiện tại. Khoá đổi thì bộ đếm về 0.
 *
 * Lưu khoá chu kỳ thay vì lưu "lần reset gần nhất" là có lý do: máy để yên qua
 * đêm rồi mở lại vẫn tính đúng ngày mới, không cần hẹn giờ chạy nền, và không
 * lệch khi người dùng đổi múi giờ hay chỉnh đồng hồ máy.
 */
export function periodKey(period: QuotaPeriod, now: Date = new Date()): string {
  switch (period) {
    case 'forever':
      return 'all';
    case 'day':
      return toLocalDate(now);
    case 'month':
      return toLocalDate(now).slice(0, 7);
    case 'week':
      return isoWeekKey(now);
  }
}

export function quotaPeriodKey(quota: Quota, now: Date = new Date()): string {
  return periodKey(QUOTA_PERIOD[quota], now);
}

/** YYYY-MM-DD theo giờ ĐỊA PHƯƠNG. `toISOString()` là giờ UTC, lệch ngày ở VN. */
function toLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Tuần theo chuẩn ISO-8601: tuần bắt đầu THỨ HAI, và tuần số 1 là tuần chứa
 * ngày thứ Năm đầu tiên của năm.
 *
 * Dùng chuẩn có sẵn thay vì tự chia 7 ngày kể từ lúc cài app, vì "mỗi tuần một
 * lượt thi thử" phải trùng với tuần trong đầu người dùng, không phải tuần tính
 * từ một mốc ngẫu nhiên.
 */
function isoWeekKey(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // Đẩy về thứ Năm cùng tuần rồi mới lấy năm — nhờ vậy tuần vắt qua giao thừa
  // được xếp vào đúng năm mà ISO quy định.
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Gói còn hiệu lực không.
 *
 * Hết hạn thì rơi về Free chứ không khoá app — người từng trả tiền mà mở lên
 * thấy mất sạch dữ liệu sẽ không quay lại. Họ chỉ mất phần mở khoá thêm.
 */
export function effectivePlan(
  plan: PlanId | null | undefined,
  expiresAtIso: string | null | undefined,
  now: Date = new Date(),
): PlanId {
  if (!plan || plan === 'free') return 'free';
  if (!expiresAtIso) return plan;
  return new Date(expiresAtIso).getTime() > now.getTime() ? plan : 'free';
}

/** Số ngày còn lại, làm tròn LÊN. 0 nghĩa là hết hôm nay. */
export function daysLeft(expiresAtIso: string | null | undefined, now: Date = new Date()): number | null {
  if (!expiresAtIso) return null;
  const ms = new Date(expiresAtIso).getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / (24 * 3600 * 1000));
}
