import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MASTERED_AT, wordStats } from './word-stats';

test('từ của tôi: đếm từ đã lưu, thành thạo (≥80%) và đang học', () => {
  const s = wordStats({ masteryPercent: [0, 40, 79, 80, 100], reviewedAt: [] }, new Date(2026, 9, 16, 12));
  assert.equal(s.total, 5);
  assert.equal(s.mastered, 2);
  assert.equal(s.learning, 3);
  assert.equal(MASTERED_AT, 80);
});

test('từ của tôi: biểu đồ 7 ngày cũ → mới, đếm đúng lượt ôn theo ngày địa phương', () => {
  const now = new Date(2026, 9, 16, 12);
  const s = wordStats(
    {
      masteryPercent: [],
      reviewedAt: [new Date(2026, 9, 16, 8).toISOString(), new Date(2026, 9, 16, 20).toISOString(), new Date(2026, 9, 14, 9).toISOString(), new Date(2026, 8, 1, 9).toISOString(), 'không phải ngày'],
    },
    now,
  );
  assert.equal(s.week.length, 7);
  assert.equal(s.week[0]!.day, '2026-10-10');
  assert.equal(s.week[6]!.day, '2026-10-16');
  assert.equal(s.week[6]!.isToday, true);
  assert.equal(s.reviewedToday, 2);
  assert.equal(s.week.find((d) => d.day === '2026-10-14')!.count, 1);
  assert.equal(s.week.reduce((n, d) => n + d.count, 0), 3, 'lượt ngoài 7 ngày và ngày lỗi không được tính');
});
