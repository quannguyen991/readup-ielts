import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLinearExplanation } from './linear-explanation';
import type { GeneratedQuestion } from './types';

test('buildLinearExplanation sinh đủ 3 bước Linearthinking cho câu True/False/Not Given', () => {
  const question: GeneratedQuestion = {
    id: 'q1',
    orderIndex: 0,
    type: 'true_false_not_given',
    prompt: 'No other species of parrot lives to the age a vaira can reach.',
    instruction: 'Choose TRUE/FALSE/NOT GIVEN',
    options: ['True', 'False', 'Not given'],
    correctAnswer: 'Not given',
    evidenceText: 'No other parrot is known to have abandoned flight so completely, and few birds of any sort live as long.',
    evidenceParagraphIndex: 0,
    explanation: 'Bài chỉ nói về birds in general, không so sánh riêng các loài vẹt.',
    lessonTip: null,
  };

  const paragraphs = [
    'Known to the Rendi people as the vaira... No other parrot is known to have abandoned flight so completely, and few birds of any sort live as long, some reaching 90 years of age.',
  ];

  const expl = buildLinearExplanation(question, 'True', false, paragraphs);

  assert.ok(expl.step1.chips.length > 0, 'Step 1 phải có các chip phân tích');
  assert.ok(expl.step1.intent.includes('Cần kiểm tra'), 'Step 1 phải có ý câu hỏi');

  assert.ok(expl.step2.strategy.includes('từ khoá'), 'Step 2 phải có hướng dẫn locate');
  assert.equal(expl.step2.paragraphIndex, 0);

  assert.ok(expl.step3.analysis.length > 0, 'Step 3 phải có phân tích dẫn chứng');
  assert.ok(expl.step3.conclusion.includes('Not given'), 'Step 3 phải kết luận đúng đáp án');
  assert.ok(expl.step3.trapNote, 'Khi người học làm sai thì Step 3 phải có trapNote');
});

test('buildLinearExplanation sinh giải thích cho dạng Summary Completion điền từ', () => {
  const question: GeneratedQuestion = {
    id: 'q7',
    orderIndex: 6,
    type: 'summary_completion',
    prompt: 'feeds on ferns, on parts taken from trees, and on ______',
    instruction: 'Choose ONE WORD ONLY from the passage',
    options: null,
    correctAnswer: 'seeds',
    evidenceText: 'Everything it eats comes from plants: besides ferns and the bark, roots and leaves of trees, it takes a good quantity of seeds.',
    evidenceParagraphIndex: 1,
    explanation: 'seeds',
    lessonTip: null,
  };

  const paragraphs = [
    'First paragraph...',
    'Everything it eats comes from plants: besides ferns and the bark, roots and leaves of trees, it takes a good quantity of seeds.',
  ];

  const expl = buildLinearExplanation(question, 'seeds', true, paragraphs);

  assert.ok(expl.step1.intent.includes('nguyên văn trong bài'));
  assert.equal(expl.step2.paragraphIndex, 1);
  assert.ok(expl.step3.conclusion.includes('seeds'));
});
