import test from 'node:test';
import assert from 'node:assert/strict';

import { classify } from './state';
import type { EvidenceMark, Observation } from './types';

function mark(paragraphIndex: number, phrase = 'always'): EvidenceMark {
  return { paragraphIndex, phrase, startOffset: 0, endOffset: phrase.length };
}

function obs(over: Partial<Observation> = {}): Observation {
  return { answerCorrect: true, mark: mark(2), truthParagraphIndex: 2, ...over };
}

test('không khoanh gì thì là unobserved, kể cả khi trả lời đúng', () => {
  assert.equal(classify(obs({ mark: null })), 'unobserved');
  assert.equal(classify(obs({ mark: null, answerCorrect: false })), 'unobserved');
});

test('câu không có đối chứng cũng là unobserved, không đoán bù', () => {
  assert.equal(classify(obs({ truthParagraphIndex: null })), 'unobserved');
});

test('đúng và khoanh đúng đoạn', () => {
  assert.equal(classify(obs()), 'aligned-correct');
});

test('đúng nhưng khoanh sai đoạn', () => {
  assert.equal(classify(obs({ mark: mark(5) })), 'misaligned-correct');
});

test('sai nhưng khoanh đúng đoạn', () => {
  assert.equal(classify(obs({ answerCorrect: false })), 'aligned-wrong');
});

test('sai và khoanh sai đoạn', () => {
  assert.equal(classify(obs({ answerCorrect: false, mark: mark(5) })), 'misaligned-wrong');
});

/**
 * Đoạn 0 là đoạn hợp lệ. Viết test riêng vì `if (!truthParagraphIndex)` là lỗi
 * rất dễ mắc, và nó biến mọi câu có đáp án ở đoạn đầu thành `unobserved`.
 */
test('đoạn số 0 vẫn là đoạn có thật, không bị coi là thiếu đối chứng', () => {
  assert.equal(
    classify({ answerCorrect: true, mark: mark(0), truthParagraphIndex: 0 }),
    'aligned-correct',
  );
});
