import test from 'node:test';
import assert from 'node:assert/strict';

import { answerQuestion, completedCount, completeScene, mergeHistory, normalizeHistory, openScene, resumeScene, type HistoryProgress } from './progress';

const T = 'vn-khang-chien-chong-phap';
const empty: HistoryProgress = { topics: {} };

test('tiến độ: mở cảnh ghi lastSceneId, hoàn thành chỉ ghi một lần', () => {
  let p = openScene(empty, T, 's02', '2026-10-02T01:00:00Z');
  p = completeScene(p, T, 's02', '2026-10-02T01:05:00Z');
  const again = completeScene(p, T, 's02', '2026-10-03T00:00:00Z');
  assert.equal(again, p, 'hoàn thành lần hai không đổi gì');
  assert.equal(p.topics[T]!.lastSceneId, 's02');
  assert.equal(p.topics[T]!.scenes.s02!.completedAt, '2026-10-02T01:05:00Z');
  assert.equal(completedCount(p, T, ['s01', 's02', 's03']), 1);
});

test('tiến độ: không đụng state gốc (bất biến)', () => {
  const p = openScene(empty, T, 's01', 'x');
  assert.deepEqual(empty, { topics: {} });
  assert.notEqual(p, empty);
});

test('tiến độ: chọn cảnh để tiếp tục', () => {
  const ids = ['s01', 's02', 's03'];
  assert.equal(resumeScene(empty, T, ids), 's01');
  let p = completeScene(empty, T, 's01', '2026-10-02T01:00:00Z');
  assert.equal(resumeScene(p, T, ids), 's02');
  p = openScene(p, T, 's03', '2026-10-02T02:00:00Z');
  assert.equal(resumeScene(p, T, ids), 's03');
  assert.equal(resumeScene(p, T, ['s01', 's02']), 's02', 'cảnh dở không còn hiện thì quay về cảnh chưa xong đầu tiên');
  assert.equal(resumeScene(p, T, []), null);
});

test('đồng bộ: đã đọc xong là một chiều; cảnh dở lấy bản mới hơn; đáp án gộp', () => {
  const a = answerQuestion(completeScene(openScene(empty, T, 's01', '2026-10-02T01:00:00Z'), T, 's01', '2026-10-02T01:10:00Z'), T, 's01', 's01-q1', 0, '2026-10-02T01:11:00Z');
  const b = openScene(answerQuestion(empty, T, 's01', 's01-q1', 2, '2026-10-02T05:00:00Z'), T, 's03', '2026-10-02T05:01:00Z');
  const m = mergeHistory(a, b);
  const t = m.topics[T]!;
  assert.equal(t.lastSceneId, 's03');
  assert.equal(t.scenes.s01!.completedAt, '2026-10-02T01:10:00Z', 'b chưa đọc xong s01 nhưng a đã đọc: giữ');
  assert.equal(t.scenes.s01!.answers!['s01-q1'], 2, 'bản mới hơn thắng ở đáp án');
  assert.deepEqual(mergeHistory(b, a), m, 'gộp không phụ thuộc thứ tự');
});

test('đồng bộ: remote rỗng giữ nguyên local; dữ liệu rác được làm sạch', () => {
  const a = openScene(empty, T, 's01', '2026-10-02T01:00:00Z');
  assert.deepEqual(mergeHistory(a, null), a);
  assert.deepEqual(normalizeHistory(null), empty);
  assert.deepEqual(normalizeHistory({ topics: { x: 5, y: { updatedAt: 3 } } }), empty);
});
