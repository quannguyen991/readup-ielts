import test from 'node:test';
import assert from 'node:assert/strict';

import { IELTS_LESSONS, STAGES, lessonById, lessonsOfStage } from './ielts-speaking';

test('lộ trình: 5 chặng, mỗi chặng 4 bài, thứ tự 1–4', () => {
  assert.equal(STAGES.length, 5);
  assert.equal(IELTS_LESSONS.length, 20);
  for (const stage of STAGES) {
    const list = lessonsOfStage(stage.id);
    assert.equal(list.length, 4, stage.id);
    assert.deepEqual(list.map((l) => l.order), [1, 2, 3, 4], stage.id);
  }
});

test('mỗi bài đủ nội dung: mục tiêu, tiêu chí, cụm từ, bài tập, bài mẫu, lỗi, tự kiểm', () => {
  const ids = new Set<string>();
  for (const l of IELTS_LESSONS) {
    assert.ok(!ids.has(l.id), `trùng id ${l.id}`);
    ids.add(l.id);
    assert.ok(l.goal.length > 20, l.id);
    assert.ok(l.criteria.length >= 1, l.id);
    assert.ok(l.explanation.length >= 1, l.id);
    assert.ok(l.phrases.length >= 2, l.id);
    assert.ok(l.drills.length >= 1, l.id);
    assert.ok(l.model.answer.length > 20, l.id);
    assert.ok(l.model.whyGood.length >= 2, l.id);
    assert.ok(l.mistakes.length >= 2, l.id);
    assert.ok(l.checklist.length >= 3, l.id);
    assert.ok(l.target.wpmMin < l.target.wpmMax, l.id);
  }
});

test('bài tập chỉ dùng Part 1, 2, 3 hoặc tổng hợp; tra cứu theo id', () => {
  for (const l of IELTS_LESSONS) {
    for (const d of l.drills) assert.ok([1, 2, 3, 'all'].includes(d.part as never), l.id);
  }
  assert.equal(lessonById('b5-01-full-answers')?.stage, 'band5');
  assert.equal(lessonById('không-có'), undefined);
});
