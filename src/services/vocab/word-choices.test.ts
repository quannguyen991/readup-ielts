import test from 'node:test';
import assert from 'node:assert/strict';

import { BLANK, buildExercise, buildWordChoices } from './exercise';
import type { VocabEntry } from '@/store/useVocabStore';

function entry(over: Partial<VocabEntry> = {}): VocabEntry {
  return {
    id: 'v1',
    word: 'mitigate',
    lemma: 'mitigate',
    phonetic: null,
    partOfSpeech: 'verb',
    definitionContext: null,
    definitionGeneral: null,
    definitionVi: 'làm giảm nhẹ',
    exampleSentence: null,
    sourceSentence: 'Planting trees can mitigate the summer heat in dense districts.',
    articleId: 'a1',
    articleTitle: 'Urban heat',
    paragraphIndex: 2,
    isCollocation: false,
    masteryPercent: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

const POOL = [
  entry(),
  entry({ id: 'v2', word: 'sustain', lemma: 'sustain' }),
  entry({ id: 'v3', word: 'decline', lemma: 'decline' }),
  entry({ id: 'v4', word: 'restore', lemma: 'restore' }),
  entry({ id: 'v5', word: 'allocate', lemma: 'allocate' }),
  entry({ id: 'v6', word: 'compel', lemma: 'compel' }),
];

const rnd = () => 0.42;

test('bốn phương án là TỪ, có đáp án, không trùng nhau', () => {
  const choices = buildWordChoices(entry(), POOL, rnd, 'Planting trees can ______ the summer heat.');
  assert.ok(choices);
  assert.equal(choices!.options.length, 4);
  assert.equal(new Set(choices!.options).size, 4);
  assert.equal(choices!.options[choices!.answerIndex], 'mitigate');
});

test('từ đã nằm sẵn trong câu KHÔNG được làm phương án nhiễu', () => {
  /*
    Nhìn thấy "decline" ở cuối câu là loại được nó mà không cần hiểu gì — câu
    hỏi khi đó đo trí nhớ thị giác chứ không đo nghĩa của từ.
  */
  const choices = buildWordChoices(
    entry(),
    POOL,
    rnd,
    'Planting trees can ______ the decline in summer comfort.',
  );
  assert.ok(choices);
  assert.ok(!choices!.options.includes('decline'));
});

test('không đủ ba từ nhiễu thì KHÔNG dựng câu hỏi', () => {
  assert.equal(buildWordChoices(entry(), [entry(), entry({ id: 'v2', word: 'sustain' })], rnd, 'a ______ b'), null);
});

test('dựng nguyên lượt ôn: câu khoét chỗ trống kèm bốn từ', () => {
  const exercise = buildExercise('context_choice', entry(), POOL, rnd);
  assert.ok(exercise && exercise.mode === 'context_choice');
  if (exercise?.mode !== 'context_choice') return;
  assert.ok(exercise.blanked.includes(BLANK));
  assert.ok(!exercise.blanked.includes('mitigate'), 'câu không được để lộ đáp án');
  assert.equal(exercise.options[exercise.answerIndex], 'mitigate');
  assert.equal(exercise.answer, 'mitigate');
});

test('từ không có câu gốc thì bỏ qua chế độ này, không dựng bừa', () => {
  const bare = entry({ id: 'v9', sourceSentence: '', exampleSentence: null });
  assert.equal(buildExercise('context_choice', bare, POOL, rnd), null);
});
