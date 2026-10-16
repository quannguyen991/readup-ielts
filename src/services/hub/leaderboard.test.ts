import test from 'node:test';
import assert from 'node:assert/strict';

import { rankRows, weeklyHubPoints } from './leaderboard';

test('điểm tuần: nhiệm vụ trong 7 ngày gần nhất, âm đã thuộc', () => {
  const doneByDay = { '2026-10-16': ['a', 'b'], '2026-10-10': ['c'], '2026-09-01': ['old'] };
  const points = weeklyHubPoints(doneByDay, { p: 85, t: 60, k: 90 }, '2026-10-16');
  // 3 nhiệm vụ trong tuần (10 mỗi cái) + 2 âm thuộc (5 mỗi cái)
  assert.equal(points, 40);
});

test('xếp hạng: bỏ người chưa có điểm, sắp giảm dần, đánh số từ 1', () => {
  const ranked = rankRows([
    { userId: 'x', points: 0 },
    { userId: 'a', points: 30 },
    { userId: 'b', points: 50 },
  ]);
  assert.deepEqual(ranked.map((r) => [r.userId, r.rank]), [['b', 1], ['a', 2]]);
});
