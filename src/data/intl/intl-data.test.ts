import assert from 'node:assert/strict';
import test from 'node:test';

import { TOEFL_ACADEMIC_PASSAGE, TOEFL_PASSAGES } from './toefl-reading';
import { TOEFL_VOCAB } from './toefl-vocab';
import { TOEIC_LR, TOEIC_LR_LEVELS } from './toeic-structure';
import { TOEIC_PART6, TOEIC_PART7 } from './toeic-reading';
import { TOEIC_VOCAB } from './toeic-vocab';

test('TOEIC Listening and Reading total 200 questions in the published part counts', () => {
  for (const section of TOEIC_LR) {
    const sum = section.parts.reduce((acc, p) => acc + p.questions, 0);
    assert.equal(sum, section.questions, `${section.key} parts sum`);
  }
  assert.equal(TOEIC_LR.reduce((acc, s) => acc + s.questions, 0), 200);
  assert.deepEqual(
    TOEIC_LR[0]?.parts.map((p) => p.questions),
    [6, 25, 39, 30],
  );
  assert.deepEqual(
    TOEIC_LR[1]?.parts.map((p) => p.questions),
    [30, 16, 54],
  );
});

test('TOEIC score levels cover 10 to 990 without overlap', () => {
  const sorted = [...TOEIC_LR_LEVELS].sort((a, b) => a.min - b.min);
  assert.equal(sorted[0]?.min, 10);
  assert.equal(sorted[sorted.length - 1]?.max, 990);
  for (let i = 1; i < sorted.length; i++) {
    assert.ok((sorted[i]?.min ?? 0) > (sorted[i - 1]?.max ?? 0), `level ${i} overlaps`);
  }
});

test('vocabulary lists have unique words and complete entries', () => {
  for (const list of [TOEIC_VOCAB, TOEFL_VOCAB]) {
    const words = list.map((e) => e.word);
    assert.equal(new Set(words).size, words.length, 'duplicate word');
    for (const e of list) {
      assert.ok(e.vi.length > 0 && e.en.length > 0 && e.example.length > 0, `${e.word} missing text`);
    }
  }
});

test('every TOEFL vocabulary example contains its base word', () => {
  for (const e of TOEFL_VOCAB) {
    assert.ok(e.example.toLowerCase().includes(e.word), `${e.word} missing from its example`);
  }
});

test('TOEIC Part 6 texts have four blanks that match their questions', () => {
  for (const text of TOEIC_PART6) {
    assert.equal(text.blanks.length, 4, `${text.id} blanks`);
    text.blanks.forEach((blank, i) => {
      assert.equal(blank.prompt, `Chỗ trống ${i + 1}`, `${text.id} prompt ${i + 1}`);
      assert.ok(text.body.includes(`{${i + 1}}`), `${text.id} missing marker {${i + 1}}`);
      assert.ok(blank.answer >= 0 && blank.answer < blank.choices.length, `${blank.id} answer range`);
      assert.equal(new Set(blank.choices).size, blank.choices.length, `${blank.id} distinct choices`);
    });
  }
});

test('TOEIC Part 7 questions have valid answers', () => {
  for (const set of TOEIC_PART7) {
    assert.ok(set.texts.length >= 1 && set.questions.length >= 1, `${set.id} content`);
    for (const q of set.questions) {
      assert.ok(q.answer >= 0 && q.answer < q.choices.length, `${q.id} answer range`);
      assert.equal(new Set(q.choices).size, q.choices.length, `${q.id} distinct choices`);
    }
  }
});

test('TOEFL academic passage questions have valid answers', () => {
  assert.equal(TOEFL_ACADEMIC_PASSAGE.questions.length, 4);
  for (const q of TOEFL_ACADEMIC_PASSAGE.questions) {
    assert.ok(q.answer >= 0 && q.answer < q.choices.length, `${q.id} answer range`);
  }
});

test('Part 6 insertion texts mark positions [A]-[D] and point at a valid position', () => {
  for (const text of TOEIC_PART6.filter((t) => t.insertion)) {
    for (const marker of ['[A]', '[B]', '[C]', '[D]']) assert.ok(text.body.includes(marker), `${text.id} missing ${marker}`);
    const ins = text.insertion;
    assert.ok(ins && ins.answer >= 0 && ins.answer <= 3, `${text.id} insertion answer`);
  }
});

test('the TOEFL honeybee passage marks [A]-[D] and its insertion question has a valid answer', () => {
  const bees = TOEFL_PASSAGES.find((p) => p.id === 'toefl-honeybees');
  assert.ok(bees, 'bees passage present');
  for (const marker of ['[A]', '[B]', '[C]', '[D]']) assert.ok(bees.text.includes(marker), `missing ${marker}`);
  assert.ok(bees.questions.some((q) => q.kind?.en === 'Sentence insertion'), 'insertion question present');
});

test('every TOEFL passage has a difficulty level and its questions have kinds', () => {
  for (const p of TOEFL_PASSAGES) {
    assert.ok(['easy', 'medium', 'hard'].includes(p.level), `${p.id} level`);
    for (const q of p.questions) assert.ok(q.kind, `${q.id} kind`);
  }
});

test('the TOEFL mechanical clock passage marks [A]-[D] and its insertion question points at [C]', () => {
  const clock = TOEFL_PASSAGES.find((p) => p.id === 'toefl-mechanical-clock');
  assert.ok(clock, 'clock passage present');
  for (const marker of ['[A]', '[B]', '[C]', '[D]']) assert.ok(clock.text.includes(marker), `missing ${marker}`);
  const insertion = clock.questions.find((q) => q.kind?.en === 'Sentence insertion');
  assert.ok(insertion, 'insertion question present');
  assert.equal(insertion.answer, 2, 'insertion answer is [C]');
});

test('every TOEIC Part 6 and Part 7 id is unique', () => {
  const ids = [...TOEIC_PART6.map((t) => t.id), ...TOEIC_PART7.map((s) => s.id)];
  assert.equal(new Set(ids).size, ids.length, 'duplicate Part 6 or Part 7 id');
  const questionIds = [...TOEIC_PART6.flatMap((t) => t.blanks.map((b) => b.id)), ...TOEIC_PART7.flatMap((s) => s.questions.map((q) => q.id))];
  assert.equal(new Set(questionIds).size, questionIds.length, 'duplicate question id');
});
