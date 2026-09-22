import assert from 'node:assert/strict';
import { test } from 'node:test';

import { summarizeRwBySkill } from './progress';

const Q = [
  { id: 'a', skill: 'words' },
  { id: 'b', skill: 'words' },
  { id: 'c', skill: 'words' },
  { id: 'd', skill: 'tense' },
];

test('đếm câu khác nhau, không đếm lượt bấm', () => {
  const p = summarizeRwBySkill(Q, {
    a: { correct: true, ms: 1000, at: '' },
    b: { correct: false, ms: 3000, at: '' },
  });
  assert.deepEqual(
    { bank: p.words!.bank, answered: p.words!.answered, correct: p.words!.correct, wrong: p.words!.wrong },
    { bank: 3, answered: 2, correct: 1, wrong: 1 },
  );
  assert.equal(p.words!.accuracy, 0.5);
  assert.equal(p.words!.totalMs, 4000);
});

test('kỹ năng chưa làm câu nào: độ chính xác là null, không phải 0', () => {
  const p = summarizeRwBySkill(Q, {});
  assert.equal(p.tense!.accuracy, null);
  assert.equal(p.tense!.bank, 1);
});

test('lượt làm của câu không còn trong kho thì bỏ qua', () => {
  const p = summarizeRwBySkill(Q, { zzz: { correct: true, ms: 5, at: '' } });
  assert.equal(p.words!.answered, 0);
});
