import test from 'node:test';
import assert from 'node:assert/strict';

import { countWords, gradeQuestions, isAnswerCorrect } from './grade';
import type { GeneratedQuestion } from './types';
import type { QuestionType } from '@/types/database';

function q(type: QuestionType, id: string, correct: string, extra: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
  return {
    id, orderIndex: 0, type, prompt: id, instruction: null, options: null,
    correctAnswer: correct, evidenceText: 'x', evidenceParagraphIndex: 0, explanation: '', lessonTip: null,
    ...extra,
  };
}

test('TFNG/YNNG nhận viết tắt và hoa thường', () => {
  assert.ok(isAnswerCorrect('ng', 'NOT GIVEN', { type: 'true_false_not_given' }));
  assert.ok(isAnswerCorrect('Not given', 'NOT GIVEN', { type: 'true_false_not_given' }));
  assert.ok(isAnswerCorrect('t', 'TRUE', { type: 'true_false_not_given' }));
  assert.ok(isAnswerCorrect('Yes', 'YES', { type: 'yes_no_not_given' }));
  assert.ok(!isAnswerCorrect('FALSE', 'TRUE', { type: 'true_false_not_given' }));
  assert.ok(!isAnswerCorrect('', 'TRUE', { type: 'true_false_not_given' }));
});

test('điền từ dùng bộ chuẩn hoá của Listening: số, dấu nối, Anh/Mỹ, mạo từ', () => {
  const o = { type: 'sentence_completion' as const, maxWords: 2 };
  assert.ok(isAnswerCorrect('Twenty one', '21', o));
  assert.ok(isAnswerCorrect('1,000', '1000', o));
  assert.ok(isAnswerCorrect('colour', 'color', o));
  assert.ok(isAnswerCorrect('Well known', 'well-known', o));
  assert.ok(isAnswerCorrect('the library', 'library', o));
  assert.ok(isAnswerCorrect('library', 'the library', o));
  assert.ok(!isAnswerCorrect('libraries', 'library', o));
});

test('vượt giới hạn số từ thì sai dù chữ có chứa đáp án', () => {
  const o = { type: 'short_answer' as const, maxWords: 2 };
  assert.ok(isAnswerCorrect('wading birds', 'wading birds', o));
  assert.ok(!isAnswerCorrect('the wading birds nearby', 'wading birds', o));
  assert.equal(countWords('well-known  site'), 2);
});

test('đáp án thay thế (accept) được nhận', () => {
  assert.ok(isAnswerCorrect('tv', 'television', { type: 'note_completion', accept: ['TV'] }));
});

test('câu chọn nhận chữ cái hoặc nguyên văn phương án', () => {
  const options = ['red', 'green', 'blue'];
  assert.ok(isAnswerCorrect('b', 'B', { type: 'multiple_choice', options }));
  assert.ok(isAnswerCorrect('green', 'B', { type: 'multiple_choice', options }));
  assert.ok(isAnswerCorrect('B', 'green', { type: 'multiple_choice', options }));
  assert.ok(!isAnswerCorrect('red', 'green', { type: 'multiple_choice', options }));
});

test('Choose TWO chấm theo tập, không theo thứ tự, và cho điểm từng phần', () => {
  const opts = ['a1', 'b2', 'c3', 'd4', 'e5'];
  const mk = (id: string, ans: string) => q('multiple_choice_multi', id, ans, { groupId: 'g1', options: opts });
  const qs = [mk('q1', 'b2'), mk('q2', 'd4')];
  // Đủ và đảo thứ tự
  assert.deepEqual(gradeQuestions(qs, { q1: 'd4', q2: 'b2' }), { q1: true, q2: true });
  // Đúng một
  assert.deepEqual(gradeQuestions(qs, { q1: 'b2', q2: 'a1' }), { q1: true, q2: false });
  // Sai cả
  assert.deepEqual(gradeQuestions(qs, { q1: 'a1', q2: 'c3' }), { q1: false, q2: false });
  // Chọn cùng một phương án hai lần chỉ tính một điểm
  assert.deepEqual(gradeQuestions(qs, { q1: 'b2', q2: 'b2' }), { q1: true, q2: false });
  // Bỏ trống
  assert.deepEqual(gradeQuestions(qs, {}), { q1: false, q2: false });
});

test('nối tiêu đề so theo nguyên văn tiêu đề', () => {
  const heads = ['The cost of barrages', 'A predictable resource'];
  const x = q('matching_headings', 'h1', 'A predictable resource', { options: heads });
  assert.deepEqual(gradeQuestions([x], { h1: 'a predictable resource' }), { h1: true });
  assert.deepEqual(gradeQuestions([x], { h1: 'The cost of barrages' }), { h1: false });
});
