import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PLANS } from '@/lib/billing/plans';

import { buildOrder, extendExpiry, isCycle, isPaidPlan } from './order';

test('số tiền lấy từ BẢNG GIÁ, khớp từng gói và từng chu kỳ', () => {
  /*
    Đây là hàng rào chống lỗ hổng tiền bạc rõ nhất của cả module: route không
    bao giờ nhận số tiền từ client, nó tra ở đây. Test khoá lại quan hệ đó.
  */
  for (const plan of ['plus', 'pro', 'max'] as const) {
    assert.equal(buildOrder(plan, 'monthly').amountVnd, PLANS[plan].monthlyVnd);
    assert.equal(buildOrder(plan, 'yearly').amountVnd, PLANS[plan].yearlyVnd);
  }
});

test('trả năm là 12 tháng, trả tháng là 1', () => {
  assert.equal(buildOrder('pro', 'yearly').months, 12);
  assert.equal(buildOrder('pro', 'monthly').months, 1);
});

test('không tạo được đơn cho gói Free hay gói bịa', () => {
  assert.throws(() => buildOrder('free', 'monthly'), /không mua được/);
  assert.throws(() => buildOrder('vip', 'monthly'), /không mua được/);
  assert.throws(() => buildOrder('', 'monthly'), /không mua được/);
});

test('chu kỳ lạ bị từ chối, không âm thầm coi là trả tháng', () => {
  assert.throws(() => buildOrder('pro', 'weekly'), /monthly/);
  assert.throws(() => buildOrder('pro', undefined), /monthly/);
  assert.throws(() => buildOrder('pro', 12), /monthly/);
});

test('bộ nhận dạng gói và chu kỳ', () => {
  assert.equal(isPaidPlan('max'), true);
  assert.equal(isPaidPlan('free'), false);
  assert.equal(isPaidPlan('standard'), false);
  assert.equal(isCycle('yearly'), true);
  assert.equal(isCycle('YEARLY'), false);
});

// ------------------------------------------------------------- gia hạn

test('gia hạn SỚM cộng dồn từ ngày hết hạn cũ, không mất ngày đã trả', () => {
  const now = new Date(2026, 8, 2);
  const expiry = new Date(2026, 8, 20).toISOString(); // còn 18 ngày
  const next = new Date(extendExpiry(expiry, 1, now));
  // Phải là 20/10, không phải 02/10 — cộng từ hôm nay là ăn mất 18 ngày đã trả.
  assert.equal(next.getMonth(), 9);
  assert.equal(next.getDate(), 20);
});

test('gói đã hết hạn thì tính lại từ hôm nay', () => {
  const now = new Date(2026, 8, 2);
  const expired = new Date(2026, 5, 1).toISOString();
  const next = new Date(extendExpiry(expired, 1, now));
  assert.equal(next.getMonth(), 9);
  assert.equal(next.getDate(), 2);
});

test('chưa có hạn nào thì tính từ hôm nay', () => {
  const now = new Date(2026, 8, 2);
  assert.equal(new Date(extendExpiry(null, 12, now)).getFullYear(), 2027);
});

test('cộng tháng qua cuối năm không nhảy sai năm', () => {
  const now = new Date(2026, 11, 15);
  const next = new Date(extendExpiry(null, 1, now));
  assert.equal(next.getFullYear(), 2027);
  assert.equal(next.getMonth(), 0);
});
