import test from 'node:test';
import assert from 'node:assert/strict';

import { verifyQuestion, verifySet } from './verify';
import type { GeneratedQuestion } from './types';
import type { QuestionType } from '@/types/database';

/**
 * Canh bộ kiểm đề đọc.
 *
 * Mỗi test dưới đây khoá lại ĐÚNG MỘT kiểu hỏng mà bản sinh-bằng-luật trước đã
 * mắc và đã được ghi trong `offline-generator.ts`. Đây không phải danh sách tôi
 * nghĩ ra cho đủ — đây là danh sách vết thương.
 */

const PARAS = [
  'The kakapo is a nocturnal parrot found only in New Zealand. It cannot fly.',
  'Kakapo breed in summer and autumn, but only in years when food is plentiful.',
  'In 1894 the government moved several birds to Resolution Island, but stoats arrived within six years.',
];

function q(over: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
  return {
    id: 'q1',
    orderIndex: 0,
    type: 'true_false_not_given' as QuestionType,
    prompt: 'Kakapo can be found in countries other than New Zealand.',
    instruction: null,
    options: null,
    correctAnswer: 'FALSE',
    evidenceText: 'The kakapo is a nocturnal parrot found only in New Zealand.',
    evidenceParagraphIndex: 0,
    explanation: 'x',
    lessonTip: null,
    ...over,
  };
}

test('câu hợp lệ thì đi qua', () => {
  assert.equal(verifyQuestion(q(), PARAS).ok, true);
});

test('câu trích không có trong bài thì bị chặn', () => {
  const r = verifyQuestion(q({ evidenceText: 'The kakapo migrates to Australia each winter.' }), PARAS);
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'evidence-not-in-passage');
});

test('chỉ số đoạn trỏ sai chỗ thì bị chặn', () => {
  const r = verifyQuestion(q({ evidenceParagraphIndex: 2 }), PARAS);
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'evidence-paragraph-mismatch');
});

/*
  Đây là vết thương nặng nhất của bản trước: "chép nguyên câu trong bài rồi khoét
  một từ → Ctrl-F". Câu như vậy đo kỹ năng dò chuỗi, không đo đọc hiểu.
*/
test('đề chép gần nguyên câu bằng chứng thì bị chặn', () => {
  const r = verifyQuestion(
    q({ prompt: 'The kakapo is a nocturnal parrot found only in New Zealand' }),
    PARAS,
  );
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'stem-copies-evidence');
});

test('nhắc lại vài từ khoá của bài thì KHÔNG bị chặn', () => {
  // Đề đọc hiểu buộc phải nhắc từ khoá, nếu không người học không biết tìm ở đâu.
  assert.equal(verifyQuestion(q({ prompt: 'The kakapo lives in more than one country.' }), PARAS).ok, true);
});

test('nhãn TFNG ngoài ba nhãn hợp lệ thì bị chặn', () => {
  assert.equal(verifyQuestion(q({ correctAnswer: 'MAYBE' }), PARAS).ok, false);
  assert.equal(verifyQuestion(q({ correctAnswer: 'true' }), PARAS).ok, true);
});

test('nhãn YNNG dùng bộ nhãn riêng, không nhận TRUE', () => {
  const item = q({ type: 'yes_no_not_given', correctAnswer: 'TRUE' });
  const r = verifyQuestion(item, PARAS);
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'bad-label');
  assert.equal(verifyQuestion(q({ type: 'yes_no_not_given', correctAnswer: 'YES' }), PARAS).ok, true);
});

test('đáp án điền từ phải có thật trong bài', () => {
  const good = q({
    type: 'sentence_completion',
    prompt: 'Kakapo breed only when food is ________.',
    correctAnswer: 'plentiful',
    evidenceText: 'Kakapo breed in summer and autumn, but only in years when food is plentiful.',
    evidenceParagraphIndex: 1,
  });
  assert.equal(verifyQuestion(good, PARAS).ok, true);

  const r = verifyQuestion({ ...good, correctAnswer: 'abundant' }, PARAS);
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'answer-not-in-passage');
});

test('trắc nghiệm mà đáp án không ứng phương án nào thì bị chặn', () => {
  const base = q({
    type: 'multiple_choice',
    prompt: 'Where is the kakapo found?',
    options: ['New Zealand', 'Australia', 'Fiji', 'Samoa'],
  });
  assert.equal(verifyQuestion({ ...base, correctAnswer: 'New Zealand' }, PARAS).ok, true);
  assert.equal(verifyQuestion({ ...base, correctAnswer: 'A' }, PARAS).ok, true);
  const r = verifyQuestion({ ...base, correctAnswer: 'Z' }, PARAS);
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'answer-not-among-options');
});

test('phương án trùng nhau hoặc quá ít thì bị chặn', () => {
  const base = q({ type: 'multiple_choice', prompt: 'Where?', correctAnswer: 'A' });
  assert.equal(verifyQuestion({ ...base, options: ['a', 'A', 'b', 'c'] }, PARAS).ok, false);
  assert.equal(verifyQuestion({ ...base, options: ['a', 'b'] }, PARAS).ok, false);
});

/* ---------------- kiểm cả bộ ---------------- */

/*
  Mỗi câu có thể hợp lệ riêng lẻ mà cả bộ vẫn đoán được. Đây đúng là kiểu hỏng
  "đáp án LUÔN là đoạn 1" của bản trước.
*/
test('cả bộ TFNG chỉ một nhãn thì bị chặn', () => {
  const set = [0, 1, 2, 3].map((i) => q({ id: `q${i}`, prompt: `Statement number ${i} about birds.` }));
  const r = verifySet(set, PARAS);
  assert.equal(r.ok, false);
  assert.ok(r.ok === false && r.reasons.includes('labels-not-varied'));
});

test('cả bộ trắc nghiệm dồn một chữ cái thì bị chặn', () => {
  const set = [0, 1, 2, 3].map((i) =>
    q({
      id: `q${i}`,
      type: 'multiple_choice',
      prompt: `Question number ${i} about the bird.`,
      options: ['a', 'b', 'c', 'd'],
      correctAnswer: 'A',
    }),
  );
  const r = verifySet(set, PARAS);
  assert.ok(r.ok === false && r.reasons.includes('answer-letter-bias'));
});

test('bằng chứng dồn hết vào một đoạn thì bị chặn', () => {
  const set = [0, 1, 2, 3, 4, 5].map((i) =>
    q({ id: `q${i}`, prompt: `Distinct statement ${i} regarding the parrot species.`, correctAnswer: i % 2 ? 'TRUE' : 'FALSE' }),
  );
  const r = verifySet(set, PARAS);
  assert.ok(r.ok === false && r.reasons.includes('evidence-clustered'));
});

test('hai câu hỏi gần trùng nhau thì bị chặn', () => {
  const set = [
    q({ id: 'a', prompt: 'The kakapo lives in more than one country today.' }),
    q({
      id: 'b',
      correctAnswer: 'TRUE',
      prompt: 'The kakapo lives in more than one country today.',
      evidenceParagraphIndex: 1,
      evidenceText: 'Kakapo breed in summer and autumn, but only in years when food is plentiful.',
    }),
  ];
  const r = verifySet(set, PARAS);
  assert.ok(r.ok === false && r.reasons.includes('duplicate-stems'));
});

test('bộ đề tử tế thì cả bộ đi qua', () => {
  const set = [
    q({ id: 'a', prompt: 'The kakapo lives in more than one country.', correctAnswer: 'FALSE' }),
    q({
      id: 'b',
      prompt: 'Food supply affects how often the birds breed.',
      correctAnswer: 'TRUE',
      evidenceParagraphIndex: 1,
      evidenceText: 'Kakapo breed in summer and autumn, but only in years when food is plentiful.',
    }),
    q({
      id: 'c',
      prompt: 'Predators reached the island soon after the birds were moved.',
      correctAnswer: 'TRUE',
      evidenceParagraphIndex: 2,
      evidenceText: 'In 1894 the government moved several birds to Resolution Island, but stoats arrived within six years.',
    }),
  ];
  assert.equal(verifySet(set, PARAS).ok, true);
});
