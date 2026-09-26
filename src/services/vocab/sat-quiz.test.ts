import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { seededRng } from '@/services/vocab/topic-study';
import { buildSatQuiz, clozeOf, passed, SAT_QUIZ_TOPICS, type SatQuizLevel } from './sat-quiz';

const LEVELS: SatQuizLevel[] = [1, 2, 3];

test('mọi chủ đề SAT đều có quiz đủ ba mức, mỗi câu bốn phương án khác nhau, đúng một đáp án', () => {
  for (const lesson of SAT_VOCAB_LESSONS) {
    for (const level of LEVELS) {
      const items = buildSatQuiz(lesson, level, seededRng(7));
      assert.ok(items.length >= Math.min(5, lesson.words.length), `${lesson.slug} mức ${level}: chỉ ${items.length} câu`);
      for (const it of items) {
        assert.equal(it.options.length, 4, it.id);
        assert.equal(new Set(it.options.map((o) => o.toLowerCase())).size, 4, `${it.id} trùng phương án`);
        assert.ok(it.answerIndex >= 0 && it.answerIndex < 4, it.id);
      }
    }
  }
});

test('đáp án đúng là đúng theo dữ liệu từ điển của chính từ đó', () => {
  for (const lesson of SAT_VOCAB_LESSONS) {
    for (const level of LEVELS) {
      for (const it of buildSatQuiz(lesson, level, seededRng(11))) {
        const ans = it.options[it.answerIndex]!;
        if (it.kind === 'meaning') assert.equal(ans, it.word.meaningVi);
        if (it.kind === 'definition' || it.kind === 'cloze') assert.equal(ans, it.word.word);
        if (it.kind === 'synonym') assert.ok(it.word.synonyms!.includes(ans));
        if (it.kind === 'antonym') assert.ok(it.word.antonyms!.includes(ans));
        if (it.kind === 'cloze') {
          assert.ok(it.context!.includes('______'));
          assert.ok(!/an ______/i.test(it.context!), `${it.id}: mạo từ lộ đáp án`);
        }
      }
    }
  }
});

test('từ nối cùng quan hệ logic không đứng chung một câu (tránh hai đáp án)', () => {
  for (const lesson of SAT_VOCAB_LESSONS) {
    for (const level of LEVELS) {
      for (const it of buildSatQuiz(lesson, level, seededRng(9))) {
        if (!it.word.pos.startsWith('từ nối') || (it.kind !== 'cloze' && it.kind !== 'definition')) continue;
        const logicOf = new Map(lesson.words.map((w) => [w.word, w.pos]));
        it.options.forEach((o, i) => {
          if (i !== it.answerIndex) assert.notEqual(logicOf.get(o), it.word.pos, `${it.id}: "${o}" cùng nhóm với đáp án`);
        });
      }
    }
  }
});

test('nhiễu không phải từ đồng nghĩa ghi sẵn của đáp án (tránh câu hai đáp án)', () => {
  for (const lesson of SAT_VOCAB_LESSONS) {
    for (const it of buildSatQuiz(lesson, 3, seededRng(3))) {
      if (it.kind !== 'cloze' && it.kind !== 'definition') continue;
      const syns = new Set((it.word.synonyms ?? []).map((s) => s.toLowerCase()));
      it.options.forEach((o, i) => {
        if (i !== it.answerIndex) assert.ok(!syns.has(o.toLowerCase()), `${it.id}: nhiễu "${o}" là đồng nghĩa`);
      });
    }
  }
});

test('mức khó chủ yếu là điền vào câu / đồng–trái nghĩa, không phải lặp lại mức vừa', () => {
  const all = SAT_VOCAB_LESSONS.flatMap((l) => buildSatQuiz(l, 3, seededRng(5)));
  const inContext = all.filter((it) => it.kind !== 'definition').length;
  assert.ok(inContext / all.length > 0.6, `chỉ ${inContext}/${all.length} câu ngữ cảnh`);
});

test('điền vào câu nhận cả cụm từ và không khớp nửa chữ', () => {
  assert.equal(clozeOf('sum', 'The sum of 8 and 5 is 13.'), 'The ______ of 8 and 5 is 13.');
  assert.equal(clozeOf('sum', 'A summary of the data.'), null);
  assert.equal(clozeOf('at odds with', 'The claim is at odds with the data.'), 'The claim is ______ the data.');
  assert.equal(clozeOf('audible', 'There was an audible sigh.'), 'There was a(n) ______ sigh.');
  assert.equal(clozeOf('fragile', 'It is a fragile vase.'), 'It is a(n) ______ vase.');
});

test('chủ đề chia hai nhóm Verbal / Math, qua mức khi đúng từ 80%', () => {
  assert.equal(SAT_QUIZ_TOPICS.reduce((n, t) => n + t.lessons.length, 0), SAT_VOCAB_LESSONS.length);
  assert.equal(passed(8, 10), true);
  assert.equal(passed(7, 10), false);
  assert.equal(passed(0, 0), false);
});
