import test from 'node:test';
import assert from 'node:assert/strict';

import { groupIntoBlocks, optionsFor } from './QuestionBlocks';
import type { GeneratedQuestion } from '@/services/questions/types';
import type { QuestionType } from '@/types/database';

function q(type: QuestionType, id: string, options?: string[]): GeneratedQuestion {
  return {
    id,
    orderIndex: 0,
    type,
    prompt: id,
    instruction: null,
    options: options ?? null,
    correctAnswer: 'x',
    evidenceText: 'x',
    evidenceParagraphIndex: 0,
    explanation: 'x',
    lessonTip: null,
  };
}

test('gom các câu cùng dạng đứng liền nhau thành một khối', () => {
  const blocks = groupIntoBlocks([
    q('true_false_not_given', 'a'),
    q('true_false_not_given', 'b'),
    q('summary_completion', 'c'),
  ]);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0]?.questions.length, 2);
  assert.equal(blocks[1]?.questions.length, 1);
});

test('đánh số theo vị trí trong CẢ bộ đề, không đếm lại từ đầu mỗi khối', () => {
  const blocks = groupIntoBlocks([
    q('true_false_not_given', 'a'),
    q('true_false_not_given', 'b'),
    q('summary_completion', 'c'),
    q('summary_completion', 'd'),
  ]);
  assert.deepEqual(
    blocks.map((b) => [b.from, b.to]),
    [
      [1, 2],
      [3, 4],
    ],
  );
});

/*
  Cùng dạng nhưng ĐỨT QUÃNG là hai khối. Gộp lại sẽ đánh số thành
  "Questions 1–2, 4" — đề thi không đánh số như vậy bao giờ.
*/
test('cùng dạng mà đứt quãng thì là hai khối riêng', () => {
  const blocks = groupIntoBlocks([
    q('true_false_not_given', 'a'),
    q('multiple_choice', 'b'),
    q('true_false_not_given', 'c'),
  ]);
  assert.equal(blocks.length, 3);
  assert.deepEqual(
    blocks.map((b) => b.from),
    [1, 2, 3],
  );
});

test('bộ đề rỗng thì không có khối nào, không ném lỗi', () => {
  assert.deepEqual(groupIntoBlocks([]), []);
});

test('mỗi khối mang lời dẫn của dạng đó', () => {
  const blocks = groupIntoBlocks([q('true_false_not_given', 'a')]);
  assert.ok(blocks[0]?.rubric.includes('NOT GIVEN'));
});

/*
  Hai dạng này có ba lựa chọn cố định. Bắt gõ tay là thêm một cách mất điểm
  không liên quan tới đọc hiểu: "not given", "NG", "Not Given" cùng một ý mà máy
  chấm thì không chắc.
*/
test('TFNG và YNNG luôn có ba nút chọn, kể cả khi bộ đề không kèm', () => {
  assert.deepEqual(optionsFor(q('true_false_not_given', 'a')), ['TRUE', 'FALSE', 'NOT GIVEN']);
  assert.deepEqual(optionsFor(q('yes_no_not_given', 'b')), ['YES', 'NO', 'NOT GIVEN']);
});

test('phương án có sẵn của bộ đề THẮNG bộ mặc định', () => {
  assert.deepEqual(optionsFor(q('true_false_not_given', 'a', ['Đúng', 'Sai'])), ['Đúng', 'Sai']);
});

test('dạng điền từ không có nút chọn — phải gõ', () => {
  assert.equal(optionsFor(q('sentence_completion', 'a')), null);
  assert.equal(optionsFor(q('summary_completion', 'b')), null);
  assert.equal(optionsFor(q('short_answer', 'c')), null);
});
