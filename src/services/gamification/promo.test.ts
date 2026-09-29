import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DAILY_POINT_CAP, dailyCapFor, dailyPoints, lifetimePoints } from './points';
import { giftAvailable, inPromo, PROMO } from './promo';

test('mùa sao rộng lượng: 30/09 tới hết 30/10', () => {
  assert.equal(inPromo('2026-09-29'), false);
  assert.equal(inPromo('2026-09-30'), true);
  assert.equal(inPromo('2026-10-15'), true);
  assert.equal(inPromo('2026-10-30'), true);
  assert.equal(inPromo('2026-10-31'), false);
});

test('trong mùa: sao nhân đôi, trần ngày 150; ngoài mùa giữ luật cũ', () => {
  const day = { minutes: 30, questions: 20 }; // thô 40
  assert.equal(dailyPoints(day, 0, '2026-09-29'), 40);
  assert.equal(dailyPoints(day, 0, '2026-10-05'), 80);
  const heavy = { minutes: 300, questions: 200 };
  assert.equal(dailyPoints(heavy, 10, '2026-09-29'), DAILY_POINT_CAP);
  assert.equal(dailyPoints(heavy, 10, '2026-10-05'), PROMO.dailyCap);
  assert.equal(dailyCapFor('2026-10-05'), 150);
  assert.equal(dailyCapFor('2026-11-01'), 60);
  // Không truyền ngày (nơi gọi cũ) → luật thường.
  assert.equal(dailyPoints(day, 0), 40);
});

test('tổng sao mọi thời tính đúng ngày trong mùa', () => {
  const daily = { '2026-09-29': { minutes: 10, questions: 0 }, '2026-09-30': { minutes: 10, questions: 0 } };
  // 29/09: 10; 30/09: chuỗi 2 ngày → hệ số 1,1 × 10 × 2 = 22.
  assert.equal(lifetimePoints(daily), 32);
});

test('quà nhận một lần, trong mùa', () => {
  assert.equal(giftAvailable('2026-09-29', {}), false);
  assert.equal(giftAvailable('2026-09-30', {}), true);
  assert.equal(giftAvailable('2026-09-30', { [PROMO.id]: 2000 }), false);
  assert.equal(giftAvailable('2026-10-31', {}), false);
});
