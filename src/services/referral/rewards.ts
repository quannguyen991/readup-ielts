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
export const REFERRALS_PER_REWARD = 15;
/** Mỗi phần thưởng là ngần này tháng. */
export const REWARD_MONTHS = 3;

/**
 * Thưởng bằng gói PRO, không phải gói cao nhất.
 *
 * Lịch sử: Plus → Max (03/09/2026) → Pro, và mốc lượt mời 10 → 15 (12/09/2026).
 *
 * Vì sao không còn thưởng Max: Max là gói DUY NHẤT có chứng chỉ ký số, mà một
 * tờ chứng nhận phát ra theo số lượt mời thì tự nó mất nghĩa. Pro đã có trọn
 * nội dung và trợ giảng AI — đúng thứ người mời muốn dùng thật.
 *
 * Ba tháng Pro đáng 420.000đ, đổi lấy 15 người tạo tài khoản VÀ học thật (điều
 * kiện "hợp lệ" xem trong `/api/referrals`). Vẫn là cuộc đổi rõ ràng cho cả hai
 * bên, nhưng không còn phát không gói đắt nhất.
 */
export const REWARD_PLAN: PlanId = 'pro';

/** Từ mốc này trở đi, phần thưởng nâng lên gói cao nhất. */
export const MAX_TIER_REFERRALS = 30;

/** Gói của mốc trên. */
export const MAX_REWARD_PLAN: PlanId = 'max';

/**
 * Gói được thưởng, tính theo TỔNG số lượt mời hợp lệ.
 *
 * KHÔNG LƯU GÓI THƯỞNG VÀO CSDL. Cột `plus_credit_months` chỉ là một số nguyên,
 * không chỗ nào ghi được "ba tháng này là Pro hay Max" — mà thêm cột thì phải
 * chạy migration. Suy lại từ số lượt mời vừa tránh được migration, vừa ra một
 * luật dễ nói với người dùng: đủ 30 lượt thì mọi tháng thưởng đang treo cũng
 * được nâng lên Max, không phải chỉ phần mới.
 */
export function rewardPlanFor(qualifiedCount: number): PlanId {
  return qualifiedCount >= MAX_TIER_REFERRALS ? MAX_REWARD_PLAN : REWARD_PLAN;
}

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
 * 1. KHÔNG BAO GIỜ HẠ GÓI. Phần thưởng là Pro, nên người đang trả tiền cho Max
 *    mà tới mốc thưởng sẽ KHÔNG bị kéo xuống Pro: số tháng ấy được GHI NỢ, rồi
 *    tự bật khi Max hết hạn.
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

    Vế thứ hai lộ ra khi phần thưởng BẰNG HẠNG với gói đang có: một tài khoản
    Pro vĩnh viễn mà kích hoạt thưởng sẽ bị gán hạn ba tháng, tức là đổi "không
    bao giờ hết" lấy ba tháng. Test bắt được chuyện này, không phải người dùng.
  */
  const rewardPlan = rewardPlanFor(qualifiedCount);
  const wouldDowngrade = planRank(active) > planRank(rewardPlan);
  const wouldCapLifetime = active === rewardPlan && state.expiresAt === null;

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

  // Đang Free, Plus, hoặc chính Pro có hạn: kích hoạt toàn bộ số tháng đang có.
  /*
    NÂNG HẠNG THÌ GIỮ NGUYÊN THỜI GIAN CÒN LẠI.

    Người vừa mời thêm 15 người để lên mốc Max mà mất ba tháng Pro đang có thì
    phần thưởng hoá ra phạt. Nên hạn cũ được cộng tiếp, chỉ đổi tên gói lên cao
    hơn — miễn gói đang dùng không cao hơn gói thưởng (ca ấy đã ghi nợ ở trên).

    `extendExpiry` tự bỏ qua hạn đã ở quá khứ, nên gói hết hạn cũng không sao.
  */
  const base = planRank(active) <= planRank(rewardPlan) ? state.expiresAt : null;
  return {
    plan: rewardPlan,
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
