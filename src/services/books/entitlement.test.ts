import test from 'node:test';
import assert from 'node:assert/strict';

import { PLANS, PLAN_ORDER } from '@/lib/billing/plans';
import { bookGrant, orderIncludesBooks, type PaymentForBooks } from './entitlement';

function pay(over: Partial<PaymentForBooks>): PaymentForBooks {
  return {
    id: 'p1',
    plan: 'max',
    billing_cycle: 'monthly',
    status: 'paid',
    amount_vnd: 400_000,
    reference: 'RUABC123',
    paid_at: '2026-09-10T08:00:00.000Z',
    created_at: '2026-09-10T07:00:00.000Z',
    ...over,
  };
}

test('gói nào kèm sách: Max mọi chu kỳ, và mọi gói trả năm', () => {
  assert.equal(orderIncludesBooks('max', 'monthly'), true);
  assert.equal(orderIncludesBooks('max', 'yearly'), true);
  assert.equal(orderIncludesBooks('plus', 'yearly'), true);
  assert.equal(orderIncludesBooks('pro', 'yearly'), true);
  assert.equal(orderIncludesBooks('plus', 'monthly'), false);
  assert.equal(orderIncludesBooks('pro', 'monthly'), false);
  assert.equal(orderIncludesBooks('free', 'yearly'), false);
});

test('gói trả phí nào cũng có ít nhất một cách mua kèm sách', () => {
  for (const id of PLAN_ORDER) {
    if (PLANS[id].monthlyVnd === 0) continue;
    assert.equal(orderIncludesBooks(id, 'yearly'), true, id);
  }
});

test('chỉ đơn ĐÃ TRẢ mới cho quyền tải', () => {
  for (const status of ['pending', 'failed', 'refunded']) {
    assert.equal(bookGrant([pay({ status })]), null, status);
  }
  assert.equal(bookGrant([pay({})])?.id, 'p1');
});

test('không có đơn nào — gói có từ mời bạn, dùng thử hay admin bật tay — thì không có sách', () => {
  assert.equal(bookGrant([]), null);
});

test('đơn 0đ không tính, dù đúng gói', () => {
  assert.equal(bookGrant([pay({ amount_vnd: 0 })]), null);
});

test('Plus hoặc Pro trả tháng không kèm sách', () => {
  assert.equal(bookGrant([pay({ plan: 'pro', amount_vnd: 140_000 })]), null);
  assert.equal(bookGrant([pay({ plan: 'plus', amount_vnd: 49_000 })]), null);
});

test('nhiều đơn đủ điều kiện thì lấy đơn SỚM NHẤT — mã in trên sách không đổi khi mua thêm', () => {
  const later = pay({ id: 'late', reference: 'RULATE', paid_at: '2026-10-10T08:00:00.000Z' });
  const early = pay({
    id: 'early',
    reference: 'RUEARLY',
    plan: 'plus',
    billing_cycle: 'yearly',
    amount_vnd: 470_000,
    paid_at: '2026-09-01T08:00:00.000Z',
  });
  assert.equal(bookGrant([later, early])?.id, 'early');
});

test('đơn đã hoàn tiền mất quyền, đơn đang chờ cũng chưa cho quyền', () => {
  assert.equal(bookGrant([pay({ status: 'refunded' }), pay({ id: 'p2', status: 'pending' })]), null);
});

test('gói hay chu kỳ lạ trong CSDL không làm nổ và không cho quyền', () => {
  assert.equal(bookGrant([pay({ plan: 'vip' })]), null);
  assert.equal(bookGrant([pay({ billing_cycle: 'weekly' })]), null);
});
