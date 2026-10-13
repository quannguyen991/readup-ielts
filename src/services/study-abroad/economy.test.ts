import assert from 'node:assert/strict';
import test from 'node:test';

import type { DormDecoration } from '@/data/study-abroad-dorm';
import { STUDY_ABROAD_MISSIONS } from '@/data/study-abroad-campaign';
import { STUDY_DAYS } from '@/data/study-abroad-schedule';
import type { Ledger } from '@/services/travel/economy';
import { balanceOf, buy, canEquip, checkBuy, currentStudyDay, recordShift, rentOwed, settleApartmentRent, settleRent, shiftDayKey, shiftPay, weekOf } from './economy';

const ORCHID: DormDecoration = {
  id: 'sg-orchid',
  slot: 'corner',
  glyph: '🌺',
  name: { vi: 'Chậu lan', en: 'Orchid' },
  description: { vi: 'x', en: 'x' },
  unlockMission: 'arrival',
  price: 40,
};

const ALL_DONE = STUDY_ABROAD_MISSIONS.map((mission) => mission.id);

test('điểm ca: đạt từ 3/4 mới được trả, mỗi câu đúng 10 đồng', () => {
  assert.equal(shiftPay(2), 0);
  assert.equal(shiftPay(3), 30);
  assert.equal(shiftPay(4), 40);
});

test('ca đạt được ghi một lần; nộp lại cùng mã ca không trả thêm', () => {
  const first = recordShift({}, '1', 'a1', 4);
  assert.equal(first.paid, 40);
  assert.equal(balanceOf(first.ledger), 40);
  const again = recordShift(first.ledger, '1', 'a1', 4);
  assert.equal(again.reason, 'duplicate');
  assert.equal(again.paid, 0);
  assert.equal(balanceOf(again.ledger), 40);
});

test('một ngày học nhận tối đa 2 ca được trả; ca trượt không ghi sổ; ngày khác vẫn nhận được', () => {
  let ledger: Ledger = recordShift({}, '1', 'a1', 4).ledger;
  ledger = recordShift(ledger, '1', 'a2', 3).ledger;
  const third = recordShift(ledger, '1', 'a3', 4);
  assert.equal(third.reason, 'full');
  assert.equal(balanceOf(third.ledger), 70);

  const failed = recordShift({}, '1', 'b1', 2);
  assert.equal(failed.reason, 'failed');
  assert.deepEqual(failed.ledger, {});

  assert.equal(recordShift(ledger, '2', 'a3', 4).reason, 'paid');
});

test('sau khi xong chiến dịch, hạn ca theo ngày lịch: ngày mới lại được nhận ca', () => {
  assert.equal(shiftDayKey([], '2026-10-12'), '1');
  assert.equal(shiftDayKey(ALL_DONE, '2026-10-12'), 'post:2026-10-12');

  let ledger: Ledger = recordShift({}, shiftDayKey(ALL_DONE, '2026-10-12'), 'p1', 4).ledger;
  ledger = recordShift(ledger, 'post:2026-10-12', 'p2', 4).ledger;
  assert.equal(recordShift(ledger, 'post:2026-10-12', 'p3', 4).reason, 'full');
  assert.equal(recordShift(ledger, 'post:2026-10-13', 'p3', 4).reason, 'paid');
});

test('tuần thuê: 7 ngày học một tuần', () => {
  assert.equal(weekOf(1), 0);
  assert.equal(weekOf(7), 0);
  assert.equal(weekOf(8), 1);
});

test('tiền thuê: thiếu tiền thì để nợ; đủ tiền thì trừ các tuần nợ, tuần cũ trước', () => {
  assert.deepEqual(rentOwed({}, 'singapore', 1), [0]);
  const unpaid = settleRent({}, 'singapore', 1);
  assert.deepEqual(rentOwed(unpaid, 'singapore', 1), [0]);

  const funded: Ledger = { 'pay:shift:1:x': 65 };
  const settled = settleRent(funded, 'singapore', 8);
  assert.deepEqual(rentOwed(settled, 'singapore', 8), []);
  assert.equal(balanceOf(settled), 5);
});

test('tiền thuê trả đúng thứ tự: 45 đồng chỉ đủ tuần 0, tuần 1 còn nợ', () => {
  const settled = settleRent({ 'pay:shift:1:x': 45 }, 'singapore', 8);
  assert.deepEqual(rentOwed(settled, 'singapore', 8), [1]);
  assert.equal(balanceOf(settled), 15);
});

test('thanh toán tiền thuê trước khi kiểm tra mua: sổ đủ tiền thì không bị báo nợ', () => {
  const synced: Ledger = { 'pay:shift:1:a': 40, 'pay:shift:1:b': 40 };
  const settled = settleApartmentRent(synced, ['arrival']);
  assert.equal(balanceOf(settled), 50);
  assert.equal(checkBuy(settled, 'singapore', 1, ORCHID), 'ok');
  assert.deepEqual(settleApartmentRent({}, []), {});
});

test('mua đồ: phải đủ tiền, và không được mua khi còn nợ tiền thuê', () => {
  assert.equal(checkBuy({ 'pay:shift:1:x': 60, 'pay:rent:singapore:0': -30 }, 'singapore', 1, ORCHID), 'poor');
  assert.equal(checkBuy({ 'pay:shift:1:x': 100 }, 'singapore', 1, ORCHID), 'rent-unpaid');

  const paidRent: Ledger = { 'pay:shift:1:x': 100, 'pay:rent:singapore:0': -30 };
  assert.equal(checkBuy(paidRent, 'singapore', 1, ORCHID), 'ok');
  const bought = buy(paidRent, ORCHID);
  assert.equal(balanceOf(bought), 30);
  assert.equal(checkBuy(bought, 'singapore', 1, ORCHID), 'owned');
});

test('đồ có giá: cần mở bằng nhiệm vụ và đã mua mới đặt được', () => {
  assert.equal(canEquip(ORCHID, [], {}), false);
  assert.equal(canEquip(ORCHID, ['arrival'], {}), false);
  assert.equal(canEquip(ORCHID, ['arrival'], { 'pay:buy:sg-orchid': -40 }), true);
});

test('ngày học hiện tại đi theo nhiệm vụ chưa làm', () => {
  assert.equal(currentStudyDay([]), 1);
  assert.equal(currentStudyDay(['arrival']), 1);
  assert.equal(currentStudyDay(['arrival', 'campus-id']), 2);
  assert.equal(currentStudyDay(ALL_DONE), STUDY_DAYS.length);
});
