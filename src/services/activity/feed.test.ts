import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildActivityFeed, countFeedByKind, groupFeedByDay, localDayOf } from './feed';

const DAY = 86_400_000;

test('mọi loại việc gộp vào một dòng thời gian, mới nhất trước', () => {
  const now = Date.parse('2026-10-18T10:00:00');
  const items = buildActivityFeed({
    sessions: [
      { id: 's1', articleTitle: 'Bài đọc A', mode: 'practice', rawScore: 30, total: 40, estimatedBand: 7, finishedAt: new Date(now - 2 * DAY).toISOString() },
    ],
    listening: [{ id: 'l1', title: 'Band 9 · Section 1', score: 8, total: 10, band: 6.5, finishedAt: new Date(now - DAY).toISOString() }],
    speaking: [{ id: 'p1', titleVi: 'Phòng nói', typed: true, finishedAt: new Date(now - 3 * DAY).toISOString() }],
    writing: [{ id: 'w1', promptLabel: 'Task 2: ...', wordCount: 260, submittedAt: new Date(now).toISOString() }],
    lessons: [{ id: 'a1-articles', title: 'Mạo từ', at: new Date(now - 4 * DAY).toISOString() }],
    dailyDone: { '2026-10-17': 2, '2026-10-16': 0 },
  });
  // Ngày 17/10 (nhiệm vụ) nằm giữa; ngày 16/10 không có việc nên không sinh dòng.
  assert.equal(items.filter((i) => i.kind === 'daily').length, 1);
  assert.deepEqual(
    items.map((i) => i.kind),
    // Nhiệm vụ ngày 17/10 lấy giữa trưa nên đứng trước bài nghe lúc 10 giờ cùng ngày.
    ['writing', 'daily', 'listening', 'test', 'speaking', 'lesson'],
  );
});

test('kết quả nghe và bài đọc hiện band, lượt gõ phím được ghi rõ', () => {
  const items = buildActivityFeed({
    sessions: [{ id: 's', articleTitle: 'X', mode: 'mock_test', rawScore: 20, total: 40, estimatedBand: null, finishedAt: '2026-10-18T08:00:00' }],
    listening: [{ id: 'l', title: 'T', score: 3, total: 4, band: 7, finishedAt: '2026-10-18T09:00:00' }],
    speaking: [{ id: 'p', titleVi: 'Nói', typed: true, finishedAt: '2026-10-18T07:00:00' }],
  });
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  assert.equal(byId['test:s']?.detail, '20/40 đúng · thi thử');
  assert.equal(byId['listening:l']?.detail, 'Band 7.0 · 3/4 đúng');
  assert.equal(byId['speaking:p']?.detail, 'Gõ phím, không chấm nói');
});

test('nhóm theo ngày địa phương và đếm theo loại trong khoảng', () => {
  const now = Date.parse('2026-10-18T12:00:00');
  const items = buildActivityFeed({
    listening: [
      { id: 'a', title: 'A', score: 1, total: 1, band: 5, finishedAt: new Date(now).toISOString() },
      { id: 'b', title: 'B', score: 1, total: 1, band: 5, finishedAt: new Date(now - 40 * DAY).toISOString() },
    ],
    writing: [{ id: 'w', promptLabel: 'W', wordCount: 200, submittedAt: new Date(now - 2 * DAY).toISOString() }],
  });
  const groups = groupFeedByDay(items);
  assert.equal(groups.length, 3);
  assert.equal(groups[0]?.day, localDayOf(new Date(now).toISOString()));
  const last30 = countFeedByKind(items, now, 30 * DAY);
  assert.equal(last30.listening, 1);
  assert.equal(last30.writing, 1);
  assert.equal(countFeedByKind(items, now, 90 * DAY).listening, 2);
});

test('không có dữ liệu thì danh sách rỗng, không bịa dòng', () => {
  assert.deepEqual(buildActivityFeed({}), []);
  assert.deepEqual(buildActivityFeed({ dailyDone: { '2026-10-18': 0 } }), []);
});
