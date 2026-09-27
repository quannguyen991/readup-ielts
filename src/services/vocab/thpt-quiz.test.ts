import { test } from 'node:test';
import assert from 'node:assert/strict';

import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { buildThptQuiz, thptQuestionsFor } from './thpt-quiz';
import { normalizeAnswer, seededRng } from './topic-study';

test('mọi câu của mọi bộ IELTS: 4 phương án khác nhau, đáp án nằm trong đó', () => {
  let total = 0;
  for (const topic of VOCAB_TOPICS) {
    const qs = buildThptQuiz(topic.words, topic.words, seededRng(7));
    assert.equal(qs.length, topic.words.length, `${topic.slug}: chỉ dựng được ${qs.length}/${topic.words.length} câu`);
    for (const q of qs) {
      total++;
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options.map(normalizeAnswer)).size, 4, `${q.word.word}: trùng phương án`);
      assert.ok(q.correctIndex >= 0 && q.correctIndex < 4);
      assert.ok(q.focus.length > 0);
    }
  }
  assert.ok(total > 2000);
});

test('câu gần nghĩa: phương án nhiễu không phải từ đồng nghĩa khác của chính từ đó', () => {
  for (const topic of VOCAB_TOPICS.slice(0, 10)) {
    for (const w of topic.words) {
      for (const q of thptQuestionsFor(w, topic.words, seededRng(3))) {
        if (q.kind !== 'closest') continue;
        const syn = new Set((w.synonyms ?? []).map(normalizeAnswer));
        q.options.forEach((o, i) => {
          if (i !== q.correctIndex) assert.ok(!syn.has(normalizeAnswer(o)), `${w.word}: nhiễu "${o}" lại là đồng nghĩa`);
        });
      }
    }
  }
});

test('câu trái nghĩa: không phương án nhiễu nào là từ trái nghĩa khác', () => {
  for (const topic of VOCAB_TOPICS.slice(0, 10)) {
    for (const w of topic.words) {
      for (const q of thptQuestionsFor(w, topic.words, seededRng(5))) {
        if (q.kind !== 'opposite') continue;
        const ant = new Set((w.antonyms ?? []).map(normalizeAnswer));
        q.options.forEach((o, i) => {
          if (i !== q.correctIndex) assert.ok(!ant.has(normalizeAnswer(o)), `${w.word}: nhiễu "${o}" lại là trái nghĩa`);
        });
      }
    }
  }
});

test('câu điền chỗ trống chỉ khi từ trong câu đúng nguyên dạng', () => {
  for (const topic of VOCAB_TOPICS.slice(0, 10)) {
    for (const w of topic.words) {
      for (const q of thptQuestionsFor(w, topic.words, seededRng(9))) {
        if (q.kind === 'complete') assert.equal(normalizeAnswer(q.focus), normalizeAnswer(w.word));
      }
    }
  }
});

test('đề trộn đủ ba dạng', () => {
  const t = VOCAB_TOPICS[0]!;
  const kinds = new Set(buildThptQuiz(t.words, t.words, seededRng(1)).map((q) => q.kind));
  for (const k of ['closest', 'complete', 'opposite'] as const) assert.ok(kinds.has(k), `thiếu dạng ${k}`);
});
