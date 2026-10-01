import test from 'node:test';
import assert from 'node:assert/strict';

import { applyGift, checkGiftAmount, giftedTotal, newGiftId } from './gift-stars';
import { mergeReward } from '@/services/gamification/shop';
import { prizeTotal } from '@/services/gamification/monthly';

test('kiểm số sao tặng', () => {
  assert.deepEqual(checkGiftAmount(500), { ok: true, stars: 500 });
  assert.equal(checkGiftAmount(0).ok, false);
  assert.equal(checkGiftAmount(-5).ok, false);
  assert.equal(checkGiftAmount(1.5).ok, false);
  assert.equal(checkGiftAmount('abc').ok, false);
  assert.equal(checkGiftAmount(100_001).ok, false);
});

test('ghi khoản tặng riêng, giữ nguyên dữ liệu khác, gửi lại cùng mã không cộng hai lần', () => {
  const before = { owned: { x: 1 }, spent: 30, prizes: { '2026-09': 200 } };
  const once = applyGift(before, '20261001-abc', 500);
  assert.deepEqual((once as { owned: unknown }).owned, { x: 1 });
  assert.equal((once as { spent: number }).spent, 30);
  assert.equal(prizeTotal((once as { prizes: Record<string, number> }).prizes), 700);
  const twice = applyGift(once, '20261001-abc', 500);
  assert.equal(prizeTotal((twice as { prizes: Record<string, number> }).prizes), 700);
  assert.equal(giftedTotal((twice as { prizes: Record<string, number> }).prizes), 500);
});

test('máy người dùng gộp với bản trên máy chủ: sao tặng KHÔNG mất', () => {
  const server = applyGift({ owned: {}, spent: 0, prizes: {}, wornAt: '' }, '20261001-abc', 1000) as never;
  // Máy người dùng chưa biết khoản tặng, nhưng có thưởng tháng mới và đeo đồ sau đó.
  const device = { owned: { a: 1 }, spent: 50, prizes: { '2026-10': 100 }, wornAt: '2026-10-02T00:00:00Z', frozenDays: [] } as never;
  const merged = mergeReward(device, server)!;
  assert.equal(prizeTotal(merged.prizes), 1100);
});

test('mã đợt dễ đọc, có ngày', () => {
  assert.match(newGiftId(new Date('2026-10-01T05:00:00Z'), () => 0.5), /^20261001-[0-9a-z]{6}$/);
});
