import test from 'node:test';
import assert from 'node:assert/strict';

import { REFUND_WINDOW_DAYS, changeOfMindRefund } from './refund';

const PAID = '2026-09-01T00:00:00.000Z';
const at = (iso: string) => new Date(iso);

test('trong hạn: báo còn bao nhiêu ngày, làm tròn lên', () => {
  assert.deepEqual(changeOfMindRefund({ paidAt: PAID, now: at('2026-09-01T12:00:00.000Z'), booksDownloaded: 0 }), {
    kind: 'eligible',
    daysLeft: REFUND_WINDOW_DAYS,
  });
  assert.deepEqual(changeOfMindRefund({ paidAt: PAID, now: at('2026-09-07T23:00:00.000Z'), booksDownloaded: 0 }), {
    kind: 'eligible',
    daysLeft: 1,
  });
});

test('đúng mốc hết hạn là hết, không có ngày thứ tám', () => {
  const end = new Date(Date.parse(PAID) + REFUND_WINDOW_DAYS * 86_400_000);
  assert.deepEqual(changeOfMindRefund({ paidAt: PAID, now: end, booksDownloaded: 0 }), { kind: 'expired' });
});

test('đã tải sách thì không hoàn kiểu đổi ý, dù mới trả tiền một giờ', () => {
  assert.deepEqual(changeOfMindRefund({ paidAt: PAID, now: at('2026-09-01T01:00:00.000Z'), booksDownloaded: 2 }), {
    kind: 'books_downloaded',
    count: 2,
  });
});

test('đơn chưa có giờ trả tiền, hoặc giờ hỏng, thì không có gì để xét', () => {
  assert.equal(changeOfMindRefund({ paidAt: null, now: at(PAID), booksDownloaded: 0 }), null);
  assert.equal(changeOfMindRefund({ paidAt: 'hom qua', now: at(PAID), booksDownloaded: 0 }), null);
});
