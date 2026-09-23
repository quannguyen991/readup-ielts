import assert from 'node:assert/strict';
import { test } from 'node:test';

import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { buildQuiz, isQuizCorrect, kindSequence } from './quiz';
import { seededRng } from './topic-study';

test('dãy dạng câu chia đều và không có hai dạng giống nhau liền kề', () => {
  for (let seed = 0; seed < 200; seed += 1) {
    const seq = kindSequence(20, seededRng(seed));
    for (let i = 1; i < seq.length; i += 1) assert.notEqual(seq[i], seq[i - 1], seq.join(' '));
    for (const k of ['mcq', 'type', 'cloze', 'tf']) assert.equal(seq.filter((x) => x === k).length, 5);
  }
});

test('đề của mọi bộ: đủ câu, không lặp từ, xen kẽ dạng, có đáp án chấm được', () => {
  const decks = [...VOCAB_TOPICS.slice(0, 15).map((t) => t.words), ...SAT_VOCAB_LESSONS.map((l) => l.words)];
  for (const [d, words] of decks.entries()) {
    for (let seed = 0; seed < 5; seed += 1) {
      const quiz = buildQuiz(words, seededRng(seed * 100 + d));
      assert.equal(quiz.length, Math.min(20, words.length));
      assert.equal(new Set(quiz.map((q) => q.word.word)).size, quiz.length, 'một từ bị hỏi hai lần');
      for (let i = 1; i < quiz.length; i += 1) assert.notEqual(quiz[i]!.kind, quiz[i - 1]!.kind);
      for (const q of quiz) {
        if (q.kind === 'mcq' || q.kind === 'cloze') {
          assert.equal(new Set(q.options).size, q.options.length);
          assert.ok(isQuizCorrect(q, q.correctIndex));
        }
        if (q.kind === 'cloze') assert.ok(q.before + q.answer + q.after === q.word.example);
        if (q.kind === 'type') assert.ok(isQuizCorrect(q, ` ${q.word.word.toUpperCase()} `));
        if (q.kind === 'tf') {
          assert.ok(isQuizCorrect(q, q.isTrue));
          assert.equal(q.isTrue, q.shownMeaning === q.word.meaningVi);
        }
      }
    }
  }
});

test('bỏ trống thì sai', () => {
  const [q] = buildQuiz(VOCAB_TOPICS[0]!.words, seededRng(1), 1);
  assert.equal(isQuizCorrect(q!, null), false);
});
