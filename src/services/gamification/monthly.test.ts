import assert from 'node:assert/strict';
import { test } from 'node:test';

import { endOfPreviousMonth, monthKey, prizeForRank, prizeTotal } from './monthly';
import { monthPoints } from './points';

test('thưởng theo hạng: nhất 300, nhì 200, ba 150, tới hạng 10 được 50, ngoài top 10 không có', () => {
  assert.deepEqual([1, 2, 3, 4, 10, 11, 0, -1, 2.5].map(prizeForRank), [300, 200, 150, 50, 50, 0, 0, 0, 0]);
});

test('tháng trước tính trọn tới ngày cuối, kể cả khi đang đầu năm', () => {
  const end = endOfPreviousMonth(new Date(2027, 0, 3, 9));
  assert.equal(monthKey(end), '2026-12');
  assert.equal(end.getDate(), 31);
  // Ngày cuối tháng có học thì vẫn được tính vào điểm tháng đó.
  const daily = { '2026-12-31': { minutes: 20, questions: 0 }, '2027-01-02': { minutes: 30, questions: 0 } };
  assert.equal(monthPoints(daily, end), 20);
});

test('tổng sao thưởng tháng bỏ qua số âm', () => {
  assert.equal(prizeTotal({ '2026-08': 300, '2026-09': 50 }), 350);
  assert.equal(prizeTotal({ x: -5 }), 0);
  assert.equal(prizeTotal(undefined), 0);
});
