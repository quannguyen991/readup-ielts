import { test } from 'node:test';
import assert from 'node:assert/strict';

import { groupByStatus, stageAfterQuiz, wordStatus } from './deck-status';

test('ba nhóm tách rời: đã nhớ, cần ôn tập, chưa nhớ', () => {
  assert.equal(wordStatus(2, 3), 'mastered');
  assert.equal(wordStatus(1, 0), 'review');
  assert.equal(wordStatus(0, 1), 'review');
  assert.equal(wordStatus(undefined, undefined), 'new');
});

test('gom cả bộ theo nhóm, không từ nào lọt hay trùng', () => {
  const words = [{ word: 'a' }, { word: 'b' }, { word: 'c' }, { word: 'd' }];
  const g = groupByStatus(words, { a: 2, b: 1 }, { c: 2 });
  assert.deepEqual(g.mastered.map((w) => w.word), ['a']);
  assert.deepEqual(g.review.map((w) => w.word), ['b', 'c']);
  assert.deepEqual(g.new.map((w) => w.word), ['d']);
});

test('Quiz: đúng lên một nấc, sai thì từ đã nhớ phải ôn lại', () => {
  assert.equal(stageAfterQuiz(undefined, true), 1);
  assert.equal(stageAfterQuiz(1, true), 2);
  assert.equal(stageAfterQuiz(2, true), 2);
  assert.equal(stageAfterQuiz(2, false), 1);
  assert.equal(stageAfterQuiz(0, false), 0);
});
