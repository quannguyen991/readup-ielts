import { effectivePlan } from '@/lib/billing/entitlements';
import { planRank, type PlanId } from '@/lib/billing/plans';
import { extendExpiry } from '@/services/payment/order';

/**
 * Luật thưởng khi giới thiệu bạn bè.
 *
 * HÀM THUẦN, tách khỏi route để test được từng ca. Đây là chỗ dễ sai theo cách
 * tốn tiền: thưởng nhầm là phát không gói trả phí, mà thưởng thiếu thì người
 * dùng đã mời thật mà không nhận được gì và họ sẽ không mời nữa.
 */

/** Đủ ngần này lượt mời HỢP LỆ thì được một phần thưởng. */
export const REFERRALS_PER_REWARD = 10;
/** Mỗi phần thưởng là ngần này tháng gói Plus. */
export const REWARD_MONTHS = 3;
export const REWARD_PLAN: PlanId = 'plus';

export type PlanState = {
  plan: PlanId;
  expiresAt: string | null;
  /** Số tháng Plus đã được thưởng nhưng CHƯA dùng, vì đang có gói cao hơn. */
  plusCreditMonths: number;
  /** Số phần thưởng đã phát. Chống phát lại khi tính lại tiến độ. */
  rewardsGranted: number;
};

export type Settlement = {
  plan: PlanId;
  expiresAt: string | null;
  plusCreditMonths: number;
  rewardsGranted: number;
  /** Số tháng vừa được kích hoạt ngay. 0 = không đổi gì hoặc chỉ ghi nợ. */
  appliedMonths: number;
  /** Số tháng đang treo, chờ gói hiện tại hết hạn. */
  bankedMonths: number;
};

/**
 * Tính lại trạng thái gói sau khi biết số lượt mời hợp lệ.
 *
 * BA QUY TẮC, và cả ba đều để KHÔNG AI MẤT GÌ:
 *
 * 1. KHÔNG BAO GIỜ HẠ GÓI. Người đang dùng Pro mà nhận thưởng Plus thì không bị
 *    kéo xuống Plus — ba tháng đó được GHI NỢ và tự bật khi Pro hết hạn. Hạ gói
 *    của người đang trả tiền để "tặng" họ một thứ rẻ hơn là món quà tệ nhất.
 * 2. KHÔNG PHÁT LẠI. `rewardsGranted` nhớ đã phát bao nhiêu lần; hàm này chạy
 *    lại bao nhiêu lần cũng ra cùng kết quả.
 * 3. GIA HẠN CỘNG DỒN. Đang có Plus thì cộng vào hạn cũ, không tính lại từ hôm
 *    nay — cộng từ hôm nay là ăn mất phần đã có.
 */
export function settleReferralRewards(
  state: PlanState,
  qualifiedCount: number,
  now: Date = new Date(),
): Settlement {
  const earned = Math.floor(Math.max(0, qualifiedCount) / REFERRALS_PER_REWARD);
  const newRewards = Math.max(0, earned - state.rewardsGranted);
  const totalCredit = state.plusCreditMonths + newRewards * REWARD_MONTHS;

  // Gói đã hết hạn thì coi như Free — người ta phải nhận được thưởng ngay, chứ
  // không phải chờ một gói vốn đã chết.
  const active = effectivePlan(state.plan, state.expiresAt, now);

  if (totalCredit === 0) {
    return {
      plan: state.plan,
      expiresAt: state.expiresAt,
      plusCreditMonths: 0,
      rewardsGranted: earned,
      appliedMonths: 0,
      bankedMonths: 0,
    };
  }

  if (planRank(active) > planRank(REWARD_PLAN)) {
    // Đang dùng gói cao hơn: giữ nguyên mọi thứ, chỉ ghi nợ.
    return {
      plan: state.plan,
      expiresAt: state.expiresAt,
      plusCreditMonths: totalCredit,
      rewardsGranted: earned,
      appliedMonths: 0,
      bankedMonths: totalCredit,
    };
  }

  // Đang Free hoặc đang Plus: kích hoạt toàn bộ số tháng đang có.
  const base = active === REWARD_PLAN ? state.expiresAt : null;
  return {
    plan: REWARD_PLAN,
    expiresAt: extendExpiry(base, totalCredit, now),
    plusCreditMonths: 0,
    rewardsGranted: earned,
    appliedMonths: totalCredit,
    bankedMonths: 0,
  };
}

/** Còn thiếu bao nhiêu lượt nữa thì tới mốc thưởng tiếp theo. */
export function toNextReward(qualifiedCount: number): number {
  const remainder = Math.max(0, qualifiedCount) % REFERRALS_PER_REWARD;
  return REFERRALS_PER_REWARD - remainder;
}
