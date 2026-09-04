import { PLANS, PLAN_ORDER, type PlanId } from '@/lib/billing/plans';

/**
 * Quy đổi gói + chu kỳ ra SỐ TIỀN và SỐ THÁNG.
 *
 * HÀM THUẦN, và nằm ở đây thay vì trong route để test được. Đây là chỗ mà một
 * lỗi nhỏ thành lỗ hổng tiền bạc: nếu số tiền lấy từ client thì ai cũng mua gói
 * Max với giá 1.000đ. Route chỉ nhận `planId` và `cycle`, còn tiền thì tra ở đây.
 */
export type BillingCycle = 'monthly' | 'yearly';

export type OrderSpec = {
  plan: PlanId;
  cycle: BillingCycle;
  amountVnd: number;
  months: number;
};

export function isPaidPlan(plan: string): plan is PlanId {
  return PLAN_ORDER.includes(plan as PlanId) && plan !== 'free';
}

export function isCycle(value: unknown): value is BillingCycle {
  return value === 'monthly' || value === 'yearly';
}

/**
 * Dựng đơn từ gói và chu kỳ. Ném lỗi nếu đầu vào không hợp lệ.
 *
 * Gói Free không có đơn: không có tiền thì không có gì để đối chiếu, và một đơn
 * 0đ đang chờ trong danh sách quản trị chỉ làm rối mắt.
 */
export function buildOrder(plan: string, cycle: unknown): OrderSpec {
  if (!isPaidPlan(plan)) {
    throw new Error(`Gói "${plan}" không mua được. Chỉ nhận: ${PLAN_ORDER.filter((p) => p !== 'free').join(', ')}.`);
  }
  if (!isCycle(cycle)) throw new Error("Chu kỳ chỉ nhận 'monthly' hoặc 'yearly'.");

  const definition = PLANS[plan];
  const amountVnd = cycle === 'yearly' ? definition.yearlyVnd : definition.monthlyVnd;
  if (!Number.isInteger(amountVnd) || amountVnd <= 0) {
    throw new Error(`Bảng giá khai số tiền không hợp lệ cho gói ${plan}: ${amountVnd}.`);
  }

  return { plan, cycle, amountVnd, months: cycle === 'yearly' ? 12 : 1 };
}

/** Ngày hết hạn khi cộng thêm một đơn vào một gói đang có. */
export function extendExpiry(
  currentExpiry: string | null | undefined,
  months: number,
  now: Date = new Date(),
): string {
  /*
    Cộng TỪ NGÀY HẾT HẠN CŨ nếu nó còn ở tương lai, không cộng từ hôm nay.

    Người dùng gia hạn sớm ba ngày trước khi hết hạn mà bị tính lại từ hôm nay
    là mất ba ngày đã trả tiền. Số tiền nhỏ, nhưng đó đúng là loại lỗi khiến
    người ta không bao giờ gia hạn sớm nữa.
  */
  const base =
    currentExpiry && new Date(currentExpiry).getTime() > now.getTime()
      ? new Date(currentExpiry)
      : new Date(now);
  const until = new Date(base);
  until.setMonth(until.getMonth() + months);
  return until.toISOString();
}
