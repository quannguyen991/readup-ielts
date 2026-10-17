import assert from 'node:assert/strict';
import { test } from 'node:test';

import { allSpeakingQuestions, buildSession, CUE_CARDS, cueCardOf, cueCardSpoken, getSpeakingQuestion, PART1_TOPICS } from './bank';

test('topic coaching asks one or two Weather questions and the next round stays in Weather', () => {
  const one = buildSession({ mode: 'p1', p1Topic: 'p1-weather', questionCount: 1 });
  assert.deepEqual(one.map((s) => s.question.id), ['p1-weather-1']);
  const two = buildSession({ mode: 'p1', p1Topic: 'p1-weather', questionCount: 2, questionOffset: 2 });
  assert.deepEqual(two.map((s) => s.question.id), ['p1-weather-3', 'p1-weather-4']);
  const wrapped = buildSession({ mode: 'p1', p1Topic: 'p1-weather', questionCount: 2, questionOffset: 3 });
  assert.deepEqual(wrapped.map((s) => s.question.id), ['p1-weather-4', 'p1-weather-1']);
  assert.equal(buildSession({ mode: 'full', questionCount: 1 }).length, 13);
});

test('ngân hàng đủ lượng tối thiểu: 12 bộ Part 1 × 4 câu, 12 thẻ Part 2, mỗi thẻ 4 câu Part 3', () => {
  assert.ok(PART1_TOPICS.length >= 12);
  for (const t of PART1_TOPICS) assert.equal(t.questions.length, 4, t.id);
  assert.ok(CUE_CARDS.length >= 12);
  for (const c of CUE_CARDS) {
    assert.equal(c.part3.length, 4, c.id);
    assert.ok((c.card.bullets ?? []).length >= 3, `${c.id} thiếu gạch đầu dòng`);
    assert.match(c.card.text, /^Describe /, c.id);
    assert.match(c.card.explain ?? '', /^and explain /, c.id);
  }
});

test('mã câu không trùng, câu hỏi không trùng chữ, đúng phần', () => {
  const all = allSpeakingQuestions();
  assert.equal(new Set(all.map((q) => q.id)).size, all.length);
  const texts = all.map((q) => q.text.toLowerCase());
  assert.equal(new Set(texts).size, texts.length, 'có câu hỏi trùng chữ');
  for (const t of PART1_TOPICS) for (const q of t.questions) assert.equal(q.part, 1);
  for (const c of CUE_CARDS) {
    assert.equal(c.card.part, 2);
    for (const q of c.part3) assert.equal(q.part, 3);
  }
});

test('câu hỏi là tiếng Anh gọn gàng, kết thúc đúng dấu', () => {
  for (const q of allSpeakingQuestions()) {
    assert.ok(q.text.length >= 12 && q.text.length <= 140, q.id);
    assert.match(q.text, q.part === 2 ? /\.$/ : /\?$/, q.id);
    assert.doesNotMatch(q.text, /[À-ỹ]/u, `${q.id} lẫn chữ tiếng Việt`);
    assert.ok(q.topicVi.length > 0);
  }
});

test('tra cứu theo mã và theo thẻ đề', () => {
  const c = CUE_CARDS[3]!;
  assert.equal(getSpeakingQuestion(c.card.id), c.card);
  assert.equal(cueCardOf(c.part3[2]!.id), c);
  assert.equal(cueCardOf(c.card.id), c);
  assert.equal(cueCardOf('p1-home-1'), undefined);
  assert.match(cueCardSpoken(c.card), /You should say: .+; and explain/);
});

test('Full test: 2 bộ Part 1 (8 câu) → thẻ Part 2 → 4 câu Part 3, đúng thứ tự', () => {
  const steps = buildSession({ mode: 'full', p1Topic: 'p1-shopping', cue: 'p2-goal' });
  assert.equal(steps.length, 8 + 1 + 4);
  assert.deepEqual(
    steps.map((s) => s.question.part),
    [1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 3, 3, 3],
  );
  // Bộ thứ hai là bộ đứng ngay sau bộ đã chọn trong danh sách.
  const after = PART1_TOPICS[(PART1_TOPICS.findIndex((t) => t.id === 'p1-shopping') + 1) % PART1_TOPICS.length]!;
  assert.equal(steps[0]!.question.id, 'p1-shopping-1');
  assert.equal(steps[4]!.question.id, `${after.id}-1`);
  assert.equal(steps[8]!.question.id, 'p2-goal');
  assert.equal(steps[9]!.question.id, 'p2-goal-p3-1');
  assert.deepEqual(
    steps.map((s) => s.partStart),
    [true, false, false, false, false, false, false, false, true, true, false, false, false],
  );
});

test('từng phần lẻ và một câu lẻ', () => {
  assert.equal(buildSession({ mode: 'p1', p1Topic: 'p1-music' }).length, 4);
  assert.equal(buildSession({ mode: 'p2', cue: 'p2-habit' })[0]!.question.part, 2);
  assert.equal(buildSession({ mode: 'p3', cue: 'p2-habit' }).length, 4);
  const one = buildSession({ mode: 'q', questionId: 'p2-habit-p3-2' });
  assert.equal(one.length, 1);
  assert.equal(one[0]!.partStart, true);
  assert.equal(buildSession({ mode: 'q', questionId: 'khong-co' }).length, 0);
  // Mã chủ đề lạ thì rơi về bộ đầu, không nổ.
  assert.equal(buildSession({ mode: 'p1', p1Topic: 'lạ' })[0]!.question.id, 'p1-home-1');
});
