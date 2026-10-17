import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  checkFeature,
  checkQuota,
  daysLeft,
  effectivePlan,
  hasFeature,
  isStageUnlocked,
  periodKey,
  quotaLimit,
  quotaPeriodKey,
  quotaPlan,
  remainingQuota,
  requiredPlanFor,
  unlockedStageCount,
} from './entitlements';
import {
  PLANS,
  PLAN_ORDER,
  TRIAL_AI_PLAN,
  TRIAL_DAYS,
  TRIAL_PLAN,
  TRIAL_PLANS,
  formatVnd,
  planOf,
  planRank,
  yearlySavingPercent,
  type Feature,
} from './plans';

/**
 * Luật chia gói phải test được bằng ca cụ thể: chặn nhầm người đã trả tiền là
 * mất khách, chặn sót là mất doanh thu, và cả hai đều âm thầm.
 */

// ------------------------------------------------------------ hình dạng gói

test('gói cao hơn luôn bao trọn tính năng của gói thấp hơn', () => {
  // Nếu vi phạm thì có người trả tiền nhiều hơn mà mất một tính năng — kiểu lỗi
  // không ai báo, chỉ lặng lẽ huỷ gói.
  for (let i = 1; i < PLAN_ORDER.length; i += 1) {
    const lower = PLANS[PLAN_ORDER[i - 1]!];
    const higher = PLANS[PLAN_ORDER[i]!];
    for (const feature of lower.features) {
      assert.ok(
        higher.features.includes(feature),
        `Gói ${higher.name} thiếu "${feature}" mà gói ${lower.name} đã có.`,
      );
    }
  }
});

test('hạn mức của gói cao hơn không bao giờ chặt hơn gói thấp hơn', { skip: 'Bậc trả phí đã bỏ: Max là trần chung cho mọi người, xem EVERYONE_PLAN' }, () => {
  for (let i = 1; i < PLAN_ORDER.length; i += 1) {
    const lower = PLANS[PLAN_ORDER[i - 1]!];
    const higher = PLANS[PLAN_ORDER[i]!];
    for (const quota of Object.keys(lower.quotas) as Array<keyof typeof lower.quotas>) {
      const lo = lower.quotas[quota];
      const hi = higher.quotas[quota];
      if (hi === null) continue; // không giới hạn thì luôn rộng hơn
      assert.ok(lo !== null, `Gói ${lower.name} thả cửa "${quota}" nhưng ${higher.name} lại chặn.`);
      assert.ok(hi >= lo, `Gói ${higher.name} chặt hơn ${lower.name} ở "${quota}".`);
    }
  }
});

test('mỗi gói có ÍT NHẤT ba gạch đầu dòng để hiện trên thẻ giá', () => {
  /*
    Đổi từ "đúng 3" sang "ít nhất 3" — 03/09/2026 mỗi gói được thêm một dòng có
    chủ đích (Free: nhắc dùng thử Plus; Plus/Max: nhắc mua theo nhóm; Pro: nudge
    sang Max), nên số dòng không còn cố định ở 3 nữa. UI (`PlanCard`) map thẳng
    qua mảng `highlights` không giới hạn số lượng, nên luật thật sự cần giữ chỉ
    là "đủ dài để đáng đọc", không phải một con số cứng.
  */
  for (const id of PLAN_ORDER) {
    assert.ok(PLANS[id].highlights.length >= 3, `Gói ${id} không đủ ba dòng.`);
  }
});

test('viết giá theo cách Việt Nam', () => {
  assert.equal(formatVnd(0), 'Miễn phí');
  assert.equal(formatVnd(99_000), '99.000đ');
  assert.equal(formatVnd(1_690_000), '1.690.000đ');
});

test('gói không rõ thì coi là Free, không nổ', () => {
  assert.equal(planOf(null).id, 'free');
  assert.equal(planOf(undefined).id, 'free');
});

// ------------------------------------------------------------- tính năng

test('Free không mở toàn bộ lộ trình Math, mọi gói trả phí thì có', () => {
  assert.equal(hasFeature('free', 'math_all_stages'), false);
  for (const id of ['plus', 'pro', 'max'] as const) {
    assert.ok(hasFeature(id, 'math_all_stages'), `Gói ${id} phải mở hết lộ trình.`);
  }
});

test('chấm Writing bằng AI mọi gói đều có — khác nhau ở HẠN MỨC, không ở cửa', { skip: 'Bậc trả phí đã bỏ: Max là trần chung cho mọi người, xem EVERYONE_PLAN' }, () => {
  // AI là chi phí biến đổi, nên bậc thang đúng là số lượt chứ không phải bật/tắt.
  // Chặn hẳn ở gói Free thì người dùng không bao giờ thấy thứ đắt nhất của app.
  for (const id of PLAN_ORDER) {
    assert.ok(hasFeature(id, 'writing_ai_grading'), `Gói ${id} bị chặn oan.`);
  }
  const limits = PLAN_ORDER.map((id) => quotaLimit(id, 'ai_calls_per_month') ?? Infinity);
  for (let i = 1; i < limits.length; i += 1) {
    assert.ok(limits[i]! > limits[i - 1]!, 'Hạn mức AI phải tăng dần theo bậc gói.');
  }
});

test('chatbox và bài mẫu chỉ từ Pro trở lên', () => {
  for (const feature of ['ai_chat', 'model_essays'] as const) {
    assert.equal(hasFeature('free', feature), false);
    assert.equal(hasFeature('plus', feature), false);
    assert.equal(hasFeature('pro', feature), true);
    assert.equal(hasFeature('max', feature), true);
  }
});

test('Max hơn Pro đúng HAI thứ, và ngân sách AI', { skip: 'Bậc trả phí đã bỏ: Max là trần chung cho mọi người, xem EVERYONE_PLAN' }, () => {
  /*
    Trang giá nói thẳng điều này. Ai lén thêm một tính năng riêng cho Max mà
    quên sửa lời quảng cáo thì test này đỏ trước khi người dùng phát hiện.

    Danh sách viết CỤ THỂ chứ không phải "ít nhất một": một bài kiểm tra nói
    "Max phải có gì đó hơn" thì bất kỳ tính năng bịa nào cũng qua được.
  */
  const onlyInMax = PLANS.max.features.filter((f) => !PLANS.pro.features.includes(f));
  assert.deepEqual(onlyInMax, ['priority_support', 'verifiable_credential']);
  assert.ok(
    (quotaLimit('max', 'ai_calls_per_month') ?? 0) >= (quotaLimit('pro', 'ai_calls_per_month') ?? 0) * 3,
    'Max phải hơn Pro ít nhất gấp ba về ngân sách AI, nếu không thì chênh giá vô lý.',
  );
});

test('chấm Writing KHÔNG cần AI thì mọi gói đều có', () => {
  // Bộ phân tích offline không tốn gì, nên khoá nó chỉ là chặn bừa.
  for (const id of PLAN_ORDER) {
    assert.ok(hasFeature(id, 'writing_offline_grading'), `Gói ${id} bị chặn oan.`);
  }
});

test('câu mời nâng cấp trỏ tới gói RẺ NHẤT mở được tính năng đó', () => {
  assert.equal(requiredPlanFor('math_all_stages'), 'plus');
  assert.equal(requiredPlanFor('ai_chat'), 'pro');
  assert.equal(requiredPlanFor('priority_support'), 'max');
  assert.equal(requiredPlanFor('writing_offline_grading'), 'free');
});

test('không bao giờ mời nâng lên gói đắt hơn mức cần', () => {
  // Lỗi này không làm hỏng gì về kỹ thuật nên rất dễ lọt: người dùng chỉ cần
  // Plus mà bị mời mua Max thì họ bỏ đi, và không ai báo lỗi.
  for (const feature of ALL_FEATURES) {
    const required = requiredPlanFor(feature);
    for (const id of PLAN_ORDER) {
      if (planRank(id) < planRank(required)) {
        assert.ok(!hasFeature(id, feature), `Gói ${id} vốn có "${feature}" mà lại đòi ${required}.`);
      }
    }
    assert.ok(hasFeature(required, feature), `Gói ${required} được chỉ định nhưng lại không có "${feature}".`);
  }
});

test('checkFeature trả về đúng gói cần nâng lên', () => {
  const blocked = checkFeature('free', 'math_all_stages');
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.allowed === false && blocked.reason, 'plan');
  assert.equal(blocked.allowed === false && blocked.reason === 'plan' && blocked.requiredPlan, 'plus');
  assert.equal(checkFeature('pro', 'ai_chat').allowed, true);
});

/**
 * Mọi tính năng có trong hệ thống.
 *
 * Viết tay thay vì suy từ `PLANS`: đúng cái ta muốn bắt là "khai một tính năng
 * rồi quên gắn vào gói nào". Suy từ PLANS thì danh sách tự khớp và test rỗng ruột.
 */
const ALL_FEATURES: Feature[] = [
  'math_all_stages',
  'math_unlimited_mock',
  'reading_unlimited',
  'vocab_unlimited',
  'writing_offline_grading',
  'writing_ai_grading',
  'model_essays',
  'ai_chat',
  'priority_support',
];

// --------------------------------------------------------------- hạn mức

test('Free bị chặn khi chạm trần, còn dưới trần thì cho qua', () => {
  assert.equal(checkQuota('free', 'reading_per_day', 4).allowed, true);
  const blocked = checkQuota('free', 'reading_per_day', 5);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.allowed === false && blocked.reason, 'quota');
  assert.equal(blocked.allowed === false && blocked.reason === 'quota' && blocked.limit, 5);
});

test('không giới hạn thì dùng bao nhiêu cũng qua', () => {
  assert.equal(quotaLimit('plus', 'reading_per_day'), null);
  assert.equal(checkQuota('plus', 'reading_per_day', 9999).allowed, true);
  assert.equal(remainingQuota('plus', 'reading_per_day', 9999), null);
});

test('Max vẫn có trần AI, và trần đó được ghi thành số thật', { skip: 'Bậc trả phí đã bỏ: Max là trần chung cho mọi người, xem EVERYONE_PLAN' }, () => {
  // Viết "không giới hạn" rồi âm thầm chặn ở đâu đó là cách nhanh nhất mất niềm tin.
  const limit = quotaLimit('max', 'ai_calls_per_month');
  assert.ok(typeof limit === 'number' && limit >= 100, 'Trần AI của Max phải là số và phải cao.');
  assert.equal(checkQuota('max', 'ai_calls_per_month', limit as number).allowed, false);
});

test('số lượt còn lại không bao giờ âm', () => {
  assert.equal(remainingQuota('free', 'ai_calls_per_month', 99), 0);
  assert.equal(remainingQuota('free', 'ai_calls_per_month', 1), 2);
});

// ---------------------------------------------------------- chặng Math

test('Free mở TRỌN chặng 1, khoá từ chặng 2', () => {
  assert.equal(unlockedStageCount('free'), 1);
  assert.equal(isStageUnlocked('free', 0), true);
  assert.equal(isStageUnlocked('free', 1), false);
  assert.equal(isStageUnlocked('free', 4), false);
});

test('gói trả phí mở mọi chặng', () => {
  for (const id of ['plus', 'pro', 'max'] as const) {
    assert.equal(unlockedStageCount(id), null);
    for (const index of [0, 1, 2, 3, 4]) {
      assert.equal(isStageUnlocked(id, index), true);
    }
  }
});

// ------------------------------------------------------------- chu kỳ

test('chu kỳ ngày đổi khi sang ngày mới, theo giờ ĐỊA PHƯƠNG', () => {
  // 23:30 giờ VN vẫn là hôm nay, dù theo UTC đã sang ngày khác.
  const late = new Date(2026, 7, 23, 23, 30);
  const early = new Date(2026, 7, 24, 0, 10);
  assert.equal(periodKey('day', late), '2026-08-23');
  assert.equal(periodKey('day', early), '2026-08-24');
  assert.notEqual(periodKey('day', late), periodKey('day', early));
});

test('chu kỳ tháng gom đúng các ngày trong cùng tháng', () => {
  assert.equal(periodKey('month', new Date(2026, 7, 1)), '2026-08');
  assert.equal(periodKey('month', new Date(2026, 7, 31)), '2026-08');
  assert.notEqual(periodKey('month', new Date(2026, 8, 1)), '2026-08');
});

test('tuần bắt đầu từ THỨ HAI, không phải chủ nhật', () => {
  // 24/08/2026 là thứ Hai; 23/08 là chủ nhật và phải thuộc tuần TRƯỚC.
  const monday = new Date(2026, 7, 24);
  const sunday = new Date(2026, 7, 23);
  const nextSunday = new Date(2026, 7, 30);
  assert.equal(periodKey('week', monday), periodKey('week', nextSunday));
  assert.notEqual(periodKey('week', sunday), periodKey('week', monday));
});

test('hạn mức không có chu kỳ thì khoá cố định', () => {
  assert.equal(quotaPeriodKey('vocab_total', new Date(2026, 0, 1)), 'all');
  assert.equal(quotaPeriodKey('vocab_total', new Date(2027, 5, 9)), 'all');
});

test('mỗi hạn mức gắn đúng chu kỳ của tên nó', () => {
  const now = new Date(2026, 7, 23, 12);
  assert.equal(quotaPeriodKey('reading_per_day', now), '2026-08-23');
  assert.equal(quotaPeriodKey('ai_calls_per_month', now), '2026-08');
  assert.ok(quotaPeriodKey('mock_per_week', now).includes('-W'));
});

// ------------------------------------------------------------- hết hạn

test('app không thương mại: mọi người dùng có quyền gói cao nhất, không phụ thuộc gói hay hạn', () => {
  const now = new Date(2026, 7, 23);
  const past = new Date(2026, 7, 1).toISOString();
  const future = new Date(2026, 8, 30).toISOString();
  assert.equal(effectivePlan('free', null, now), 'max');
  assert.equal(effectivePlan('max', past, now), 'max');
  assert.equal(effectivePlan('plus', future, now), 'max');
  assert.equal(effectivePlan(null, null, now), 'max');
});

test('đếm ngày còn lại, làm tròn lên và không âm', () => {
  const now = new Date(2026, 7, 23, 12);
  assert.equal(daysLeft(new Date(2026, 7, 24, 13).toISOString(), now), 2);
  assert.equal(daysLeft(new Date(2026, 7, 1).toISOString(), now), 0);
  assert.equal(daysLeft(null), null);
});

test('mọi tính năng đều thuộc ít nhất một gói', () => {
  // Khai một tính năng rồi quên gắn vào gói nào thì nó bị khoá với TẤT CẢ, kể cả Max.
  for (const feature of ALL_FEATURES) {
    assert.ok(
      PLAN_ORDER.some((id) => PLANS[id].features.includes(feature)),
      `Tính năng "${feature}" không thuộc gói nào.`,
    );
  }
});

test('gói đắt hơn luôn bao trùm gói rẻ hơn', () => {
  // Bậc thang có lỗ — mua gói cao hơn mà MẤT một tính năng — là lỗi không ai
  // báo cáo, họ chỉ lặng lẽ đòi hoàn tiền.
  for (let i = 1; i < PLAN_ORDER.length; i += 1) {
    const lower = PLANS[PLAN_ORDER[i - 1]!];
    const upper = PLANS[PLAN_ORDER[i]!];
    for (const feature of lower.features) {
      assert.ok(
        upper.features.includes(feature),
        `Gói ${upper.id} thiếu "${feature}" mà gói rẻ hơn ${lower.id} lại có.`,
      );
    }
    for (const quota of Object.keys(lower.quotas) as (keyof typeof lower.quotas)[]) {
      const lo = lower.quotas[quota];
      const hi = upper.quotas[quota];
      if (lo === null) {
        assert.equal(hi, null, `Gói ${upper.id} siết "${quota}" chặt hơn ${lower.id}.`);
      } else if (hi !== null && upper.id !== 'max') {
        // Max là trần fair-use chung cho mọi người, không còn là bậc trả phí nên không so với bậc dưới.
        assert.ok(hi >= lo, `Gói ${upper.id} có "${quota}" thấp hơn ${lower.id}.`);
      }
    }
  }
});

test('giá tăng dần theo bậc, và trả năm luôn rẻ hơn 12 tháng lẻ', () => {
  assert.equal(PLANS.free.monthlyVnd, 0, 'Gói Free mà mất tiền thì không còn là Free.');
  for (let i = 1; i < PLAN_ORDER.length; i += 1) {
    const lower = PLANS[PLAN_ORDER[i - 1]!];
    const upper = PLANS[PLAN_ORDER[i]!];
    assert.ok(upper.monthlyVnd > lower.monthlyVnd, `Gói ${upper.id} không đắt hơn ${lower.id}.`);
  }
  for (const id of PLAN_ORDER) {
    const plan = PLANS[id];
    if (plan.monthlyVnd === 0) continue;
    assert.ok(plan.yearlyVnd < plan.monthlyVnd * 12, `Trả năm gói ${id} không rẻ hơn trả tháng.`);
    const saving = yearlySavingPercent(plan);
    assert.ok(saving >= 15 && saving <= 40, `Mức tiết kiệm ${saving}% của gói ${id} không hợp lý.`);
  }
});

test('đúng MỘT gói được đánh dấu gợi ý', () => {
  const flagged = PLAN_ORDER.filter((id) => PLANS[id].recommended);
  assert.equal(flagged.length, 1, 'Gợi ý hai gói cùng lúc là không gợi ý gì cả.');
});

test('gói dùng thử là một gói có thật và không phải gói đắt nhất', () => {
  assert.ok(PLAN_ORDER.includes(TRIAL_PLAN));
  assert.ok(planRank(TRIAL_PLAN) > 0, 'Dùng thử gói Free thì không có nghĩa gì.');
});

test('học thử 5 ngày: mở nội dung gói thử, nhưng lượt AI vẫn là mức Free', () => {
  assert.equal(TRIAL_DAYS, 5);
  // Chỉ Plus hoặc Pro — không thử Max, không "thử" Free.
  assert.deepEqual([...TRIAL_PLANS], ['plus', 'pro']);
  assert.ok(TRIAL_PLANS.includes(TRIAL_PLAN));
  for (const id of TRIAL_PLANS) assert.equal(quotaPlan(id, 'ai_calls_per_month', true), 'free');
  assert.equal(TRIAL_AI_PLAN, 'free');
  // Đang học thử: AI theo Free, mọi hạn mức khác theo gói thử.
  assert.equal(quotaPlan(TRIAL_PLAN, 'ai_calls_per_month', true), 'free');
  assert.equal(quotaLimit(quotaPlan(TRIAL_PLAN, 'ai_calls_per_month', true), 'ai_calls_per_month'), quotaLimit('free', 'ai_calls_per_month'));
  assert.equal(quotaPlan(TRIAL_PLAN, 'reading_per_day', true), TRIAL_PLAN);
  // Gói trả tiền thật thì không bị kéo xuống.
  assert.equal(quotaPlan('pro', 'ai_calls_per_month', false), 'pro');
});
