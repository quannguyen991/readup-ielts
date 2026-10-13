import assert from 'node:assert/strict';
import test from 'node:test';

import { balanceOf } from '@/services/study-abroad/economy';
import type { Ledger } from '@/services/travel/economy';
import { chargeCapital, ordersToday, recordSale, recordWaste, shopBalance } from './economy';

const DAY = '2026-10-12';

test('mở quán: trừ vốn từ đồng du học một lần; thiếu tiền thì không trừ; đã trừ rồi thì báo already', () => {
  const poor = chargeCapital({ 'pay:shift:1:a': 100 }, 'singapore');
  assert.equal(poor.reason, 'poor');
  assert.deepEqual(poor.ledger, { 'pay:shift:1:a': 100 });

  const funded = chargeCapital({ 'pay:shift:1:a': 200 }, 'singapore');
  assert.equal(funded.reason, 'ok');
  assert.equal(balanceOf(funded.ledger), 50);

  const again = chargeCapital(funded.ledger, 'singapore');
  assert.equal(again.reason, 'already');
  assert.equal(balanceOf(again.ledger), 50);
});

test('bán: lãi = giá − chi phí; cùng mã đơn không bán hai lần', () => {
  const one = recordSale({}, DAY, 'o1', 25, 12);
  assert.equal(one.reason, 'paid');
  assert.equal(one.paid, 13);
  assert.equal(shopBalance(one.ledger), 13);

  const dup = recordSale(one.ledger, DAY, 'o1', 25, 12);
  assert.equal(dup.reason, 'duplicate');
  assert.equal(shopBalance(dup.ledger), 13);
});

test('đủ 12 đơn trong một ngày thì đơn thứ 13 bị từ chối; ngày khác vẫn bán được', () => {
  let ledger: Ledger = {};
  for (let i = 1; i <= 12; i++) ledger = recordSale(ledger, DAY, `o${i}`, 25, 12).ledger;
  assert.equal(ordersToday(ledger, DAY), 12);

  const full = recordSale(ledger, DAY, 'o13', 25, 12);
  assert.equal(full.reason, 'full');
  assert.deepEqual(full.ledger, ledger);

  assert.equal(recordSale(ledger, '2026-10-13', 'o13', 25, 12).reason, 'paid');
});

test('phục vụ sai: không có doanh thu, chỉ trừ nguyên liệu đã dùng, và chỉ một lần cho mỗi khách', () => {
  const sold = recordSale({}, DAY, 'o1', 25, 12).ledger;
  const wrong = recordWaste(sold, DAY, 'c1', 12);
  assert.equal(shopBalance(wrong), 1);
  assert.equal(ordersToday(wrong, DAY), 1);
  const again = recordWaste(wrong, DAY, 'c1', 12);
  assert.deepEqual(again, wrong);
});
