import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CEFR_LEVELS } from './types';
import { GRAMMAR_LESSONS, lessonsOfLevel } from './index';

test('mỗi cấp CEFR từ A1 đến C2 đều có ít nhất một bài', () => {
  for (const lv of CEFR_LEVELS) assert.ok(lessonsOfLevel(lv).length >= 1, `thiếu bài ở ${lv}`);
});

test('id không trùng nhau', () => {
  const ids = GRAMMAR_LESSONS.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('mỗi bài có đủ bước, đủ 5 câu kiểm tra, đáp án đúng nằm trong phương án', () => {
  for (const l of GRAMMAR_LESSONS) {
    assert.ok(l.steps.length >= 3, `${l.id}: ít hơn 3 bước`);
    assert.equal(l.quiz.length, 5, `${l.id}: cần đúng 5 câu kiểm tra`);
    for (const q of l.quiz) {
      assert.ok(q.answer >= 0 && q.answer < q.options.length, `${l.id}: đáp án ngoài phương án`);
    }
  }
});

test('thứ tự bài trong mỗi cấp liên tục từ 1', () => {
  for (const lv of CEFR_LEVELS) {
    const orders = lessonsOfLevel(lv).map((l) => l.order);
    orders.forEach((o, i) => assert.equal(o, i + 1, `${lv}: thứ tự bài không liên tục`));
  }
});

test('chuỗi tô nổi (mark) nằm đúng trong câu ví dụ và mọi ví dụ có bản dịch', () => {
  for (const l of GRAMMAR_LESSONS) {
    for (const s of l.steps) {
      for (const e of s.examples ?? []) {
        if (e.mark) assert.ok(e.en.includes(e.mark), `${l.id}: mark "${e.mark}" không nằm trong "${e.en}"`);
        assert.ok(e.vi.trim().length > 0, `${l.id}: thiếu bản dịch cho "${e.en}"`);
      }
    }
  }
});
