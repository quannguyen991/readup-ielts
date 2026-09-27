import { test } from 'node:test';
import assert from 'node:assert/strict';

import { goalProgress, modelEssayBand } from './goal';

const none = { roadmapTarget: null, profileTarget: null, roadmapNow: null, firstBand: null, current: null };

test('chưa đặt mục tiêu ở đâu thì không bịa ra 7.0', () => {
  assert.deepEqual(goalProgress({ ...none, current: 5.5 }), { state: 'no-goal' });
});

test('mục tiêu ở Lộ trình được ưu tiên hơn hồ sơ', () => {
  const g = goalProgress({ ...none, roadmapTarget: 6.5, profileTarget: 8 });
  assert.deepEqual(g, { state: 'no-score', target: 6.5 });
});

test('không có Lộ trình thì lấy mục tiêu trong hồ sơ', () => {
  assert.deepEqual(goalProgress({ ...none, profileTarget: 7 }), { state: 'no-score', target: 7 });
});

test('tiến độ tính theo quãng từ điểm xuất phát tới mục tiêu, không chia thẳng', () => {
  // Khai 5.0, mục tiêu 7.0, giờ 6.0 → đi được nửa đường.
  const g = goalProgress({ ...none, roadmapTarget: 7, roadmapNow: 5, current: 6 });
  assert.equal(g.state, 'progress');
  if (g.state === 'progress') {
    assert.equal(g.pct, 50);
    assert.equal(g.left, 1);
  }
});

test('chưa khai band hiện tại thì xuất phát là bài chấm đầu tiên', () => {
  const g = goalProgress({ ...none, profileTarget: 6.5, firstBand: 4.5, current: 5.5 });
  assert.ok(g.state === 'progress' && g.start === 4.5 && g.pct === 50);
});

test('mới có một bài thì tiến độ là 0%, không phải band/mục tiêu', () => {
  const g = goalProgress({ ...none, roadmapTarget: 7, firstBand: 2.5, current: 2.5 });
  assert.ok(g.state === 'progress' && g.pct === 0 && g.left === 4.5);
});

test('tụt dưới điểm xuất phát thì kẹp ở 0%', () => {
  const g = goalProgress({ ...none, roadmapTarget: 7, roadmapNow: 6, current: 5 });
  assert.ok(g.state === 'progress' && g.pct === 0);
});

test('chạm mục tiêu thì báo đã đạt', () => {
  const g = goalProgress({ ...none, roadmapTarget: 6, roadmapNow: 5, current: 6.5 });
  assert.ok(g.state === 'reached' && g.pct === 100 && g.left === 0);
});

test('bài mẫu Writing theo band mục tiêu, kẹp trong 6–8', () => {
  assert.equal(modelEssayBand(null), 7);
  assert.equal(modelEssayBand(5.5), 6);
  assert.equal(modelEssayBand(6.5), 7);
  assert.equal(modelEssayBand(7.5), 8);
  assert.equal(modelEssayBand(9), 8);
});
