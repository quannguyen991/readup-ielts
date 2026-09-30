import test from 'node:test';
import assert from 'node:assert/strict';

import { addDays, dueBySlug, forecast, mergeReviewEntry, nextReview } from './review-schedule';

test('đúng liên tục đúng hạn: khoảng cách giãn 1 → 2 → 4 → 7 ngày', () => {
  let day = '2026-10-01';
  let e = nextReview(undefined, true, day);
  assert.equal(e.due, '2026-10-02');
  const gaps: number[] = [];
  for (let i = 0; i < 3; i++) {
    day = e.due;
    const n = nextReview(e, true, day);
    gaps.push((Date.parse(n.due) - Date.parse(day)) / 86400000);
    e = n;
  }
  assert.deepEqual(gaps, [2, 4, 7]);
});

test('sai thì về hộp đầu, hạn ngày mai', () => {
  const e = nextReview({ box: 4, due: '2026-10-05', last: '2026-09-20' }, false, '2026-10-05');
  assert.deepEqual(e, { box: 0, due: '2026-10-06', last: '2026-10-05' });
});

test('học dồn không lên hộp: đúng nhiều lần một ngày hoặc ôn trước hạn giữ nguyên', () => {
  const a = nextReview(undefined, true, '2026-10-01');
  assert.deepEqual(nextReview(a, true, '2026-10-01'), a);
  const early = nextReview({ box: 2, due: '2026-10-10', last: '2026-10-06' }, true, '2026-10-08');
  assert.equal(early.box, 2);
  assert.equal(early.due, '2026-10-10');
});

test('danh sách đến hạn theo bộ và dự báo 7 ngày', () => {
  const r = {
    a: { x: { box: 0, due: '2026-10-01', last: '2026-09-30' }, y: { box: 1, due: '2026-10-03', last: '2026-10-01' } },
    b: { z: { box: 0, due: '2026-09-28', last: '2026-09-27' } },
  };
  assert.deepEqual(dueBySlug(r, '2026-10-01'), { a: ['x'], b: ['z'] });
  const f = forecast(r, '2026-10-01', 3);
  assert.deepEqual(f.map((d) => d.count), [2, 0, 1]);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('gộp hai máy: lấy bản ôn gần nhất', () => {
  const old = { box: 3, due: '2026-10-09', last: '2026-10-02' };
  const recent = { box: 0, due: '2026-10-06', last: '2026-10-05' };
  assert.equal(mergeReviewEntry(old, recent), recent);
  assert.equal(mergeReviewEntry(undefined, old), old);
});
