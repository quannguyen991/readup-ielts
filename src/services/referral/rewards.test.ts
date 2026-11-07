import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PLAN_ORDER, planRank } from '@/lib/billing/plans';

const SKIP_PAID = 'gói trả phí đã tắt từ 17/10 (app không thương mại: effectivePlan luôn là max). Bật lại gói thì bỏ skip.';
import {
  MAX_REWARD_PLAN,
  MAX_TIER_REFERRALS,
  REFERRALS_PER_REWARD,
  REWARD_MONTHS,
  REWARD_PLAN,
  rewardPlanFor,
  settleReferralRewards,
  toNextReward,
  type PlanState,
} from './rewards';

const NOW = new Date(2026, 8, 2);
const free = (over: Partial<PlanState> = {}): PlanState => ({
  plan: 'free',
  expiresAt: null,
  rewardCreditMonths: 0,
  rewardsGranted: 0,
  ...over,
});

const monthsBetween = (iso: string | null, from: Date) =>
  iso ? Math.round((new Date(iso).getTime() - from.getTime()) / (30.44 * 864e5)) : 0;

test('chưa đủ mốc thì không có gì thay đổi', () => {
  for (const count of [0, 1, 5, 9]) {
    const out = settleReferralRewards(free(), count, NOW);
    assert.equal(out.plan, 'free');
    assert.equal(out.appliedMonths, 0);
    assert.equal(out.rewardsGranted, 0);
  }
});

test('đủ một mốc → bật gói thưởng 3 tháng', { skip: SKIP_PAID }, () => {
  const out = settleReferralRewards(free(), REFERRALS_PER_REWARD, NOW);
  assert.equal(out.plan, REWARD_PLAN);
  assert.equal(out.appliedMonths, REWARD_MONTHS);
  assert.equal(monthsBetween(out.expiresAt, NOW), REWARD_MONTHS);
  assert.equal(out.rewardsGranted, 1);
});

test('HAI MỐC: đủ 15 lượt ra Pro, đủ 30 lượt nâng lên Max', { skip: SKIP_PAID }, () => {
  const after1 = settleReferralRewards(free(), REFERRALS_PER_REWARD, NOW);
  assert.equal(after1.plan, REWARD_PLAN, 'mốc đầu là gói Pro');

  const state: PlanState = {
    plan: after1.plan,
    expiresAt: after1.expiresAt,
    rewardCreditMonths: 0,
    rewardsGranted: after1.rewardsGranted,
  };
  const after2 = settleReferralRewards(state, MAX_TIER_REFERRALS, NOW);
  assert.equal(after2.plan, MAX_REWARD_PLAN, 'đủ 30 lượt phải thành Max');
  assert.equal(monthsBetween(after2.expiresAt, NOW), REWARD_MONTHS * 2);
  assert.equal(after2.rewardsGranted, 2);
});

test('CHẠY LẠI KHÔNG PHÁT THÊM — hàm này bị gọi mỗi lần mở trang', () => {
  const first = settleReferralRewards(free(), REFERRALS_PER_REWARD, NOW);
  const state: PlanState = {
    plan: first.plan,
    expiresAt: first.expiresAt,
    rewardCreditMonths: first.rewardCreditMonths,
    rewardsGranted: first.rewardsGranted,
  };
  for (let i = 0; i < 5; i += 1) {
    const again = settleReferralRewards(state, REFERRALS_PER_REWARD, NOW);
    assert.equal(again.appliedMonths, 0, 'phát lại phần thưởng đã phát');
    assert.equal(again.expiresAt, first.expiresAt, 'hạn bị đẩy thêm mỗi lần gọi');
  }
});

test('KHÔNG HẠ GÓI người đang dùng gói cao hơn phần thưởng — ghi nợ', () => {
  /*
    Ca dễ làm hỏng nhất: viết thẳng `plan = <gói thưởng>` là kéo người đang trả
    tiền cho gói cao hơn xuống thấp. Món quà biến thành hình phạt, và đó đúng
    loại lỗi khiến người ta đòi hoàn tiền.

    Dựng ca bằng gói NGAY TRÊN phần thưởng thay vì viết 'pro' cứng: hôm nay
    thưởng là Max nên không còn gói nào cao hơn, và test tự bỏ qua. Ngày nào
    phần thưởng hạ xuống, hoặc có gói cao hơn Max, nó tự sống lại.
  */
  const higher = PLAN_ORDER[planRank(REWARD_PLAN) + 1];
  if (!higher) return; // phần thưởng đang là gói cao nhất — không có ca này

  const until = new Date(2027, 0, 1).toISOString();
  const out = settleReferralRewards(
    { plan: higher, expiresAt: until, rewardCreditMonths: 0, rewardsGranted: 0 },
    REFERRALS_PER_REWARD,
    NOW,
  );
  assert.equal(out.plan, higher, 'gói bị hạ');
  assert.equal(out.expiresAt, until, 'hạn của gói đang dùng bị đụng vào');
  assert.equal(out.bankedMonths, REWARD_MONTHS);
  assert.equal(out.rewardCreditMonths, REWARD_MONTHS);
  assert.equal(out.rewardsGranted, 1, 'vẫn phải ghi là đã phát, nếu không sẽ phát lại mãi');
});

test('nợ được kích hoạt khi gói đang có hết hạn', { skip: SKIP_PAID }, () => {
  const expiredPro = new Date(2026, 5, 1).toISOString();
  const out = settleReferralRewards(
    { plan: 'pro', expiresAt: expiredPro, rewardCreditMonths: 6, rewardsGranted: 2 },
    20,
    NOW,
  );
  assert.equal(out.plan, REWARD_PLAN);
  assert.equal(monthsBetween(out.expiresAt, NOW), 6);
  assert.equal(out.rewardCreditMonths, 0);
});

test('nợ cũ và phần thưởng mới gộp làm một, và kích hoạt theo mốc HIỆN TẠI', { skip: SKIP_PAID }, () => {
  const out = settleReferralRewards(
    free({ rewardCreditMonths: REWARD_MONTHS, rewardsGranted: 1 }),
    MAX_TIER_REFERRALS,
    NOW,
  );
  assert.equal(monthsBetween(out.expiresAt, NOW), REWARD_MONTHS * 2, '3 tháng nợ + 3 tháng mới');
  assert.equal(out.rewardCreditMonths, 0);
  assert.equal(out.plan, MAX_REWARD_PLAN, 'tháng nợ ghi từ hồi mốc Pro cũng được bật ở mốc Max');
});

test('Max cũng không bị hạ, và nợ vẫn giữ', () => {
  const out = settleReferralRewards(
    { plan: 'max', expiresAt: null, rewardCreditMonths: 0, rewardsGranted: 0 },
    MAX_TIER_REFERRALS,
    NOW,
  );
  assert.equal(out.plan, 'max');
  assert.equal(out.expiresAt, null, 'gói vĩnh viễn không được gán hạn');
  assert.equal(out.bankedMonths, REWARD_MONTHS * 2);
});

test('số lượt âm hay vô lý không đẻ ra phần thưởng', () => {
  assert.equal(settleReferralRewards(free(), -50, NOW).appliedMonths, 0);
  assert.equal(settleReferralRewards(free(), 0, NOW).rewardsGranted, 0);
});

test('đếm ngược tới mốc kế tiếp', () => {
  const per = REFERRALS_PER_REWARD;
  assert.equal(toNextReward(0), per);
  assert.equal(toNextReward(3), per - 3);
  assert.equal(toNextReward(per - 1), 1);
  assert.equal(toNextReward(per), per, 'vừa đạt mốc thì đếm lại từ đầu');
  assert.equal(toNextReward(per + 2), per - 2);
});

test('gói thưởng suy từ TỔNG số lượt mời, không lưu trong CSDL', () => {
  assert.equal(rewardPlanFor(0), REWARD_PLAN);
  assert.equal(rewardPlanFor(MAX_TIER_REFERRALS - 1), REWARD_PLAN);
  assert.equal(rewardPlanFor(MAX_TIER_REFERRALS), MAX_REWARD_PLAN);
  assert.equal(rewardPlanFor(MAX_TIER_REFERRALS * 4), MAX_REWARD_PLAN);
});
