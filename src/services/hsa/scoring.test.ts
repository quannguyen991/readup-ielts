import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { HsaLevel, HsaQuestionKind } from '@/data/hsa';
import { CRITERIA, KIND_CRITERION } from './criteria';
import { estimateCefr, scoreItems, stateOf, type AttemptItem } from './scoring';

const item = (kind: HsaQuestionKind, level: HsaLevel, ok: boolean | null, n = 0): AttemptItem => ({
  qid: `${kind}-${level}-${n}`,
  kind,
  level,
  topic: 't',
  picked: ok === null ? null : ok ? 1 : 0,
  answer: 1,
});

test('mỗi dạng câu thuộc đúng một tiêu chí và không sót dạng nào', () => {
  const kinds = CRITERIA.flatMap((c) => c.kinds);
  assert.equal(new Set(kinds).size, kinds.length);
  assert.equal(kinds.length, 14);
  for (const k of kinds) assert.ok(KIND_CRITERION[k]);
});

test('đếm đúng, sai, bỏ qua và quy về thang 50', () => {
  const r = scoreItems([item('cloze', 'B1', true, 1), item('cloze', 'B1', false, 2), item('reasoning', 'B2', null, 3), item('reasoning', 'B2', true, 4)]);
  assert.deepEqual([r.correct, r.wrong, r.skipped, r.total], [2, 1, 1, 4]);
  assert.equal(r.accuracy, 0.5);
  assert.equal(r.score50, 25);
});

test('điểm theo tiêu chí cộng lại bằng cả bài', () => {
  const r = scoreItems([
    item('sentence-completion', 'A2', true, 1),
    item('synonym-antonym', 'B1', false, 2),
    item('dialogue-ordering', 'B1', true, 3),
    item('reading-comprehension', 'B2', true, 4),
    item('reasoning', 'C1', false, 5),
  ]);
  assert.equal(r.criteria.reduce((s, c) => s + c.total, 0), r.total);
  assert.equal(r.criteria.reduce((s, c) => s + c.correct, 0), r.correct);
  const vocab = r.criteria.find((c) => c.id === 'vocab')!;
  assert.equal(vocab.pct, 0);
  assert.equal(vocab.state, 'weak');
});

test('tiêu chí mạnh nhất và yếu nhất chỉ có khi đo được ít nhất hai tiêu chí khác nhau', () => {
  const one = scoreItems([item('cloze', 'B1', true)]);
  assert.equal(one.strongest, null);
  assert.equal(one.weakest, null);
  const two = scoreItems([item('cloze', 'B1', true), item('reasoning', 'B1', false)]);
  assert.equal(two.strongest, 'reading');
  assert.equal(two.weakest, 'reasoning');
  const tie = scoreItems([item('cloze', 'B1', true), item('reasoning', 'B1', true)]);
  assert.equal(tie.weakest, null);
});

test('ngưỡng vững, ổn, yếu và chưa đo', () => {
  assert.equal(stateOf(0.8), 'strong');
  assert.equal(stateOf(0.79), 'ok');
  assert.equal(stateOf(0.6), 'ok');
  assert.equal(stateOf(0.59), 'weak');
  assert.equal(stateOf(null), 'none');
});

test('ước lượng CEFR dừng ở mức đầu tiên không qua và bỏ mức quá ít câu', () => {
  const lv = (level: HsaLevel, correct: number, total: number) => ({ level, correct, wrong: total - correct, skipped: 0, total, pct: total ? correct / total : null });
  assert.deepEqual(estimateCefr([lv('A2', 4, 4), lv('B1', 3, 4), lv('B2', 1, 4), lv('C1', 4, 4)]), { reached: 'B1', below: null });
  assert.deepEqual(estimateCefr([lv('A2', 1, 4), lv('B1', 4, 4), lv('B2', 4, 4), lv('C1', 4, 4)]), { reached: null, below: 'A2' });
  assert.deepEqual(estimateCefr([lv('A2', 3, 3), lv('B1', 0, 1), lv('B2', 3, 4), lv('C1', 0, 0)]), { reached: 'B2', below: null });
});

test('chỉ đo được từ B2 mà không qua thì là "dưới B2", không gán A1', () => {
  const lv = (level: HsaLevel, correct: number, total: number) => ({ level, correct, wrong: total - correct, skipped: 0, total, pct: total ? correct / total : null });
  assert.deepEqual(estimateCefr([lv('A2', 0, 1), lv('B1', 0, 0), lv('B2', 1, 6), lv('C1', 0, 6)]), { reached: null, below: 'B2' });
});

test('bài rỗng không chia cho 0', () => {
  const r = scoreItems([]);
  assert.equal(r.accuracy, 0);
  assert.equal(r.score50, 0);
  assert.deepEqual(r.cefr, { reached: null, below: null });
  assert.ok(r.criteria.every((c) => c.pct === null && c.state === 'none'));
});
