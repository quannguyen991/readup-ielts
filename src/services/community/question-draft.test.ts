import assert from 'node:assert/strict';
import test from 'node:test';

import { MATH_SKILL_LABEL, type MathItem } from '@/lib/math/types';
import type { MathAttemptRecord } from '@/store/useMathStore';

import { mathQuestionDraft } from './question-draft';

const skill = 'linear_equations_one_var' as const;

const mcq = {
  id: 'linear-one:1',
  templateSlug: 'linear-one',
  skill,
  domain: 'algebra',
  difficulty: 'easy',
  format: 'mcq',
  stem: 'If 2x + 3 = 11, what is x?',
  figure: null,
  choices: [
    { display: '3', errorTag: null },
    { display: '4', errorTag: 'sign_flip' },
    { display: '7', errorTag: null },
    { display: '8', errorTag: null },
  ],
  correctIndex: 1,
} as unknown as MathItem;

const attempt = (userAnswer: string | null): MathAttemptRecord => ({
  itemId: mcq.id,
  skill,
  domain: 'algebra',
  format: 'mcq',
  userAnswer,
  isCorrect: false,
  errorTag: null,
  timeSpentMs: 1000,
});

test('draft lists the question and lettered choices, and names the picked letter', () => {
  const { title, body } = mathQuestionDraft(mcq, attempt('2'), false);
  assert.equal(title, `Hỏi về SAT Math: ${MATH_SKILL_LABEL[skill]}`);
  assert.match(body, /If 2x \+ 3 = 11, what is x\?/);
  assert.match(body, /A\. 3\nB\. 4/);
  assert.match(body, /Mình chọn: C\./);
});

test('fraction markup becomes readable plain text', () => {
  const fraction = { ...mcq, stem: 'If frac(x,6) - 4 = 3, what is x?' } as MathItem;
  const { body } = mathQuestionDraft(fraction, attempt('0'), false);
  assert.match(body, /If \(x\)\/\(6\) - 4 = 3, what is x\?/);
  assert.doesNotMatch(body, /frac\(/);
});

test('draft never reveals the correct choice', () => {
  const { body } = mathQuestionDraft(mcq, attempt('0'), true);
  assert.doesNotMatch(body, /correct|đúng|Đáp án/i);
  assert.match(body, /My answer: A\./);
});

test('blank answers are described as blank', () => {
  const { body } = mathQuestionDraft(mcq, attempt(null), false);
  assert.match(body, /Mình chọn: bỏ trống\./);
});
