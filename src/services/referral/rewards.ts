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
/** Mỗi phần thưởng là ngần này tháng. */
export const REWARD_MONTHS = 3;

/**
 * Thưởng bằng GÓI CAO NHẤT, không phải gói thấp nhất.
 *
 * Trước là Plus. Mời được mười người thật — mười người phải tạo tài khoản
 * VÀ học thật, xem điều kiện "hợp lệ" trong `/api/referrals` — là việc khó
 * hơn nhiều so với việc trả 49.000đ. Phần thưởng phải tương xứng với công bỏ ra,
 * không thì chẳng ai bỏ công.
 *
 * Và đây là đường DUY NHẤT để có Max mà không trả tiền. Max 400.000đ/tháng là
 * gói đắt nhất; ba tháng Max đổi lấy mười người học thật là một cuộc đổi rõ
 * ràng cho cả hai bên.
 */
export const REWARD_PLAN: PlanId = 'max';

export type PlanState = {
  plan: PlanId;
  expiresAt: string | null;
  /**
   * Số tháng đã được thưởng nhưng CHƯA dùng, vì đang có gói cao hơn.
   *
   * Cột trong CSDL vẫn tên `plus_credit_months` — tên lịch sử từ hồi phần thưởng
   * còn là Plus. Đổi tên cột là một lần migration cho đúng mỗi cái tên, nên chỉ
   * đổi tên ở đây và ánh xạ ở biên API.
   */
  rewardCreditMonths: number;
  /** Số phần thưởng đã phát. Chống phát lại khi tính lại tiến độ. */
  rewardsGranted: number;
};

export type Settlement = {
  plan: PlanId;
  expiresAt: string | null;
  rewardCreditMonths: number;
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
 * 1. KHÔNG BAO GIỜ HẠ GÓI. Phần thưởng giờ là Max — gói cao nhất — nên quy tắc
 *    này gần như không còn đụng tới ai. Nhưng giữ nguyên: nếu sau này có gói
 *    cao hơn Max, hoặc phần thưởng hạ xuống, thì người đang trả tiền cho gói cao
 *    hơn vẫn không bị kéo xuống — số tháng đó được GHI NỢ và tự bật sau.
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
  const totalCredit = state.rewardCreditMonths + newRewards * REWARD_MONTHS;

  // Gói đã hết hạn thì coi như Free — người ta phải nhận được thưởng ngay, chứ
  // không phải chờ một gói vốn đã chết.
  const active = effectivePlan(state.plan, state.expiresAt, now);

  if (totalCredit === 0) {
    return {
      plan: state.plan,
      expiresAt: state.expiresAt,
      rewardCreditMonths: 0,
      rewardsGranted: earned,
      appliedMonths: 0,
      bankedMonths: 0,
    };
  }

  /*
    GHI NỢ khi kích hoạt ngay sẽ làm người ta THIỆT. Hai trường hợp:

      · đang dùng gói CAO HƠN phần thưởng — kích hoạt là hạ gói;
      · đang dùng đúng gói ấy nhưng KHÔNG CÓ HẠN (vĩnh viễn) — kích hoạt là
        biến "không bao giờ hết" thành "hết sau ba tháng".

    Vế thứ hai chỉ lộ ra khi phần thưởng đổi từ Plus sang Max: hồi thưởng Plus
    thì tài khoản Max vĩnh viễn rơi vào vế thứ nhất và được ghi nợ đúng. Đổi
    sang Max là hai gói bằng hạng, vế thứ nhất hết đỡ, và một tài khoản vĩnh
    viễn sẽ bị gán hạn sử dụng. Test bắt được, không phải người dùng.
  */
  const wouldDowngrade = planRank(active) > planRank(REWARD_PLAN);
  const wouldCapLifetime = active === REWARD_PLAN && state.expiresAt === null;

  if (wouldDowngrade || wouldCapLifetime) {
    return {
      plan: state.plan,
      expiresAt: state.expiresAt,
      rewardCreditMonths: totalCredit,
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
    rewardCreditMonths: 0,
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
