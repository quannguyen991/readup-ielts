import assert from 'node:assert/strict';
import { test } from 'node:test';

import { currentStep, stepSummary, type StepInput } from './level-path';

const words = (n: number) => Array.from({ length: n }, (_, i) => ({ word: `w${i}` }));
const none = new Set<string>();

function input(over: Partial<StepInput> & { n: number }): StepInput {
  return { words: words(over.n), dueWords: none, roundAsked: null, ...over };
}

test('học dở vẫn được tính là đã học, không đợi đến khi thuộc hết', () => {
  const s = stepSummary(input({ n: 30, stages: { w0: 1, w1: 1, w2: 2 } }), 1);
  assert.equal(s.studied, 3);
  assert.equal(s.learned, 1);
  assert.equal(s.finished, false);
});

test('một từ có lịch ôn cũng tính là đã học', () => {
  const reviews = { w5: { box: 1, due: '2026-11-01', last: '2026-10-30' } };
  const s = stepSummary(input({ n: 10, reviews }), 1);
  assert.equal(s.studied, 1);
});

test('học hết 30 từ của bước 1 thì bước 1 xong và bước hiện tại sang bước 2', () => {
  const b1 = stepSummary(input({ n: 30, stages: Object.fromEntries(words(30).map((w) => [w.word, 1])) }), 1);
  const b2 = stepSummary(input({ n: 40 }), 2);
  assert.equal(b1.finished, true);
  assert.equal(currentStep([b1, b2])?.n, 2);
});

test('đang ở bước 1 khi chưa học xong: bước 1 là bước hiện tại', () => {
  const b1 = stepSummary(input({ n: 30, stages: { w0: 1 } }), 1);
  const b2 = stepSummary(input({ n: 40 }), 2);
  assert.equal(currentStep([b1, b2])?.n, 1);
});

test('mọi bước xong thì không còn bước hiện tại', () => {
  const done = stepSummary(input({ n: 2, stages: { w0: 2, w1: 2 } }), 1);
  assert.equal(currentStep([done]), null);
});

test('đếm từ đến hạn ôn, không phân biệt hoa thường và khoảng trắng', () => {
  const s = stepSummary(input({ n: 3, dueWords: new Set(['w0', 'w2']) }), 1);
  assert.equal(s.due, 2);
});

test('báo số câu của vòng đang dở', () => {
  const s = stepSummary(input({ n: 30, roundAsked: 12 }), 1);
  assert.equal(s.roundAsked, 12);
});

test('từ trả lời sai (chặng 0) nhưng đã có trong lịch FSRS vẫn là đã học', () => {
  const s = stepSummary(input({ n: 10, studied: new Set(['w1', 'w2']) }), 1);
  assert.equal(s.studied, 2);
});
