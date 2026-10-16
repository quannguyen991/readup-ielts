import test from 'node:test';
import assert from 'node:assert/strict';

import { mergeHub } from './sync';

test('điểm và số lần luyện không bao giờ tụt xuống khi gộp', () => {
  const merged = mergeHub({ phonemeBest: { p: 70 }, phonemeTries: { p: 3 } }, { phonemeBest: { p: 85, t: 60 }, phonemeTries: { p: 5 } });
  assert.equal(merged.phonemeBest.p, 85);
  assert.equal(merged.phonemeBest.t, 60);
  assert.equal(merged.phonemeTries.p, 5);
});

test('nhiệm vụ đã làm trong cùng một ngày được hợp, không mất', () => {
  const merged = mergeHub({ doneByDay: { '2026-10-16': ['phoneme:p'] } }, { doneByDay: { '2026-10-16': ['grammar:a1-can'] } });
  assert.deepEqual([...merged.doneByDay['2026-10-16']!].sort(), ['grammar:a1-can', 'phoneme:p']);
});

test('bài đạt giữ thời điểm sớm nhất; bộ đã tạo hợp theo id', () => {
  const merged = mergeHub(
    { lessonsDone: { 'a1-can': '2026-10-10T08:00:00Z' }, userSets: [{ id: 'u1', title: 'A', items: ['x'], createdAt: 'now' }] },
    { lessonsDone: { 'a1-can': '2026-10-12T08:00:00Z' }, userSets: [{ id: 'u2', title: 'B', items: ['y'], createdAt: 'now' }] },
  );
  assert.equal(merged.lessonsDone['a1-can'], '2026-10-10T08:00:00Z');
  assert.equal(merged.userSets.length, 2);
});

test('slide: giữ bản có nội dung ở máy này trước', () => {
  assert.deepEqual(mergeHub({ slides: ['mine'] }, { slides: ['theirs'] }).slides, ['mine']);
  assert.deepEqual(mergeHub({ slides: [] }, { slides: ['theirs'] }).slides, ['theirs']);
});

test('không có bản trên máy chủ thì giữ nguyên bản trên máy', () => {
  const merged = mergeHub({ saved: ['set-p-t-k'], roleplayDone: { 'rp-deadline': 1 } }, null);
  assert.deepEqual(merged.saved, ['set-p-t-k']);
  assert.equal(merged.roleplayDone['rp-deadline'], 1);
});

test('bài IELTS đã xong: giữ thời điểm sớm nhất khi hai máy cùng đánh dấu', () => {
  const merged = mergeHub({ ieltsDone: { 'b5-01-full-answers': '2026-10-10T08:00:00Z' } }, { ieltsDone: { 'b5-01-full-answers': '2026-10-12T08:00:00Z', 'b5-02-linkers': '2026-10-12T09:00:00Z' } });
  assert.equal(merged.ieltsDone['b5-01-full-answers'], '2026-10-10T08:00:00Z');
  assert.equal(Object.keys(merged.ieltsDone).length, 2);
});
