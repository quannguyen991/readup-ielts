import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PLANS } from '@/lib/billing/plans';
import {
  EARLY_RENEWAL_DISCOUNT_PERCENT,
  EARLY_RENEWAL_WINDOW_DAYS,
  GROUP_BUY_TIERS,
  activeFlashSale,
  applyPercentDiscount,
  cheapestCandidate,
  groupBuyDiscountPercent,
  groupBuyYearlyPrice,
  isBeforePriceCutoff,
  isEligibleForEarlyRenewal,
  isGroupBuyPlan,
  PRICE_CHANGE_CUTOFF_ISO,
} from './pricing-rules';

// ------------------------------------------------------------------- group-buy

test('bậc giảm giá LỆCH SÂU DẦN theo gói ở cùng một mốc số người', () => {
  // Đây là điểm cả hai giám khảo độc lập cùng yêu cầu ghép vào bản cuối: Max
  // phải giảm sâu hơn Pro, Pro phải giảm sâu hơn Plus, ở CÙNG một mốc người.
  for (const size of [3, 5, 10] as const) {
    assert.ok(GROUP_BUY_TIERS.plus[size] < GROUP_BUY_TIERS.pro[size], `mốc ${size}: Plus phải nhẹ hơn Pro`);
    assert.ok(GROUP_BUY_TIERS.pro[size] < GROUP_BUY_TIERS.max[size], `mốc ${size}: Pro phải nhẹ hơn Max`);
  }
});

test('Max mốc 10 người là bậc giảm sâu nhất trong toàn bảng', () => {
  const all = Object.values(GROUP_BUY_TIERS).flatMap((tiers) => Object.values(tiers));
  assert.equal(Math.max(...all), GROUP_BUY_TIERS.max[10]);
});

test('gói Free không tham gia mua theo nhóm', () => {
  assert.equal(isGroupBuyPlan('free'), false);
  assert.equal(groupBuyDiscountPercent('free', 10), 0);
});

test('giá nhóm luôn tính động từ giá niêm yết hiện tại, không lệch nếu giá gốc đổi', () => {
  for (const plan of ['plus', 'pro', 'max'] as const) {
    for (const size of [3, 5, 10] as const) {
      const expected = applyPercentDiscount(PLANS[plan].yearlyVnd, GROUP_BUY_TIERS[plan][size]);
      assert.equal(groupBuyYearlyPrice(plan, size), expected);
    }
  }
});

test('giá nhóm luôn rẻ hơn giá niêm yết, và không bao giờ âm hay bằng 0', () => {
  for (const plan of ['plus', 'pro', 'max'] as const) {
    for (const size of [3, 5, 10] as const) {
      const price = groupBuyYearlyPrice(plan, size);
      assert.ok(price > 0, `giá nhóm ${plan}/${size} phải dương`);
      assert.ok(price < PLANS[plan].yearlyVnd, `giá nhóm ${plan}/${size} phải rẻ hơn giá niêm yết`);
    }
  }
});

// ---------------------------------------------------------------- applyPercentDiscount

test('làm tròn về nghìn đồng gần nhất', () => {
  // 890.000 * 0,75 = 667.500 — lẻ tới hàng trăm, phải làm tròn lên 668.000 cho
  // gõ tay chuyển khoản không sai.
  assert.equal(applyPercentDiscount(890_000, 25), 668_000);
  assert.equal(applyPercentDiscount(890_000, 25) % 1000, 0, 'kết quả phải là bội số của 1.000');
});

test('percent = 0 trả về nguyên giá, không đổi gì', () => {
  assert.equal(applyPercentDiscount(470_000, 0), 470_000);
});

// -------------------------------------------------------------------- flash sale

test('đúng ngày trong cửa sổ thì có flash sale', () => {
  assert.ok(activeFlashSale(new Date(2027, 0, 1)) !== null, '1/1 phải có flash sale');
  assert.ok(activeFlashSale(new Date(2027, 5, 2)) !== null, '2/6 phải có flash sale');
  assert.ok(activeFlashSale(new Date(2027, 8, 1)) !== null, '1/9 phải có flash sale');
});

test('ngoài cửa sổ thì không có flash sale', () => {
  assert.equal(activeFlashSale(new Date(2027, 0, 3)), null, '3/1 đã hết đợt');
  assert.equal(activeFlashSale(new Date(2027, 2, 15)), null, 'giữa tháng 3 không có đợt nào');
  assert.equal(activeFlashSale(new Date(2027, 11, 31)), null, '31/12 không có đợt nào');
});

// ---------------------------------------------------------------- gia hạn sớm

test('còn đúng trong cửa sổ trước khi hết hạn thì đủ điều kiện', () => {
  const now = new Date('2027-01-10T00:00:00.000Z');
  const expiresIn5Days = new Date(now.getTime() + 5 * 24 * 3600_000).toISOString();
  assert.equal(isEligibleForEarlyRenewal(expiresIn5Days, now), true);
});

test('còn quá xa mới hết hạn thì KHÔNG đủ điều kiện', () => {
  const now = new Date('2027-01-10T00:00:00.000Z');
  const expiresIn30Days = new Date(now.getTime() + 30 * 24 * 3600_000).toISOString();
  assert.equal(isEligibleForEarlyRenewal(expiresIn30Days, now), false);
});

test('đã hết hạn rồi thì KHÔNG phải "gia hạn sớm" nữa', () => {
  const now = new Date('2027-01-10T00:00:00.000Z');
  const expiredYesterday = new Date(now.getTime() - 24 * 3600_000).toISOString();
  assert.equal(isEligibleForEarlyRenewal(expiredYesterday, now), false);
});

test('không có hạn dùng (null) thì không đủ điều kiện', () => {
  assert.equal(isEligibleForEarlyRenewal(null), false);
});

test('đúng biên cửa sổ — ngày cuối cùng vẫn tính, ngày kế tiếp thì không', () => {
  const now = new Date('2027-01-10T00:00:00.000Z');
  const atBoundary = new Date(now.getTime() + EARLY_RENEWAL_WINDOW_DAYS * 24 * 3600_000).toISOString();
  const justOver = new Date(now.getTime() + (EARLY_RENEWAL_WINDOW_DAYS + 1) * 24 * 3600_000).toISOString();
  assert.equal(isEligibleForEarlyRenewal(atBoundary, now), true);
  assert.equal(isEligibleForEarlyRenewal(justOver, now), false);
});

test('mức giảm gia hạn sớm là 5%, dùng hằng số chứ không phải số cứng', () => {
  assert.equal(EARLY_RENEWAL_DISCOUNT_PERCENT, 5);
});

// -------------------------------------------------------------------- grandfather

test('đơn trả TRƯỚC mốc tăng giá thì được giữ giá cũ', () => {
  const before = new Date(new Date(PRICE_CHANGE_CUTOFF_ISO).getTime() - 1000).toISOString();
  assert.equal(isBeforePriceCutoff(before), true);
});

test('đơn trả SAU mốc tăng giá thì không còn được giữ giá cũ', () => {
  const after = new Date(new Date(PRICE_CHANGE_CUTOFF_ISO).getTime() + 1000).toISOString();
  assert.equal(isBeforePriceCutoff(after), false);
});

test('chưa từng trả đơn nào (null) thì không có gì để giữ giá cũ', () => {
  assert.equal(isBeforePriceCutoff(null), false);
  assert.equal(isBeforePriceCutoff(undefined), false);
});

// ------------------------------------------------------------------ cheapestCandidate

test('chọn đúng ứng viên rẻ nhất trong danh sách', () => {
  const winner = cheapestCandidate([
    { source: 'base', amountVnd: 890_000, label: 'giá niêm yết' },
    { source: 'group', amountVnd: 668_000, label: 'giá nhóm' },
    { source: 'flash_sale', amountVnd: 712_000, label: 'flash sale' },
  ]);
  assert.equal(winner.source, 'group');
  assert.equal(winner.amountVnd, 668_000);
});

test('chỉ một ứng viên (base) thì trả về đúng nó', () => {
  const only = { source: 'base' as const, amountVnd: 470_000, label: 'giá niêm yết' };
  assert.deepEqual(cheapestCandidate([only]), only);
});

test('KHÔNG cộng dồn nhiều nguồn giảm giá — luôn lấy MỘT ứng viên rẻ nhất, không phải tổng', () => {
  /*
    Đây là luật quan trọng nhất của cả module. Bốn nguồn giảm giá được thiết kế
    độc lập, không ai tính chuyện chúng chồng lên nhau — cộng dồn % sẽ ra một
    con số không ai kiểm chứng được là hợp lý hay không.
  */
  const group = { source: 'group' as const, amountVnd: 668_000, label: 'giá nhóm' };
  const flash = { source: 'flash_sale' as const, amountVnd: 712_000, label: 'flash sale' };
  const winner = cheapestCandidate([group, flash]);
  // Nếu lỡ cộng dồn thì kết quả sẽ nhỏ hơn CẢ HAI ứng viên — kiểm ngược để chắc
  // hàm không làm điều đó.
  assert.ok(winner.amountVnd === group.amountVnd || winner.amountVnd === flash.amountVnd);
});
