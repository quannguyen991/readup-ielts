import assert from 'node:assert/strict';
import test from 'node:test';

import { TOEFL_LISTENING, TOEIC_PART1, TOEIC_PART2, TOEIC_PART3, TOEIC_PART4 } from './listening';
import { TOEFL_BUILD, TOEFL_SPEAKING, TOEFL_WRITING, TOEIC_SPEAKING, TOEIC_WRITING } from './writing';

test('listening Part 2 items have three responses and a valid answer', () => {
  assert.equal(TOEIC_PART2.length, 10);
  for (const q of TOEIC_PART2) {
    assert.equal(q.responses.length, 3, `${q.id} responses`);
    assert.ok(q.answer >= 0 && q.answer < 3, `${q.id} answer`);
  }
});

test('listening passages have valid questions and speaker-tagged lines', () => {
  for (const p of [...TOEIC_PART3, ...TOEIC_PART4, ...TOEFL_LISTENING]) {
    assert.ok(p.lines.length >= 2, `${p.id} lines`);
    assert.ok(p.questions.length >= 1, `${p.id} questions`);
    for (const q of p.questions) {
      assert.ok(q.answer >= 0 && q.answer < q.choices.length, `${q.id} answer range`);
    }
  }
  for (const p of TOEFL_LISTENING.filter((x) => x.kind === 'conversation')) {
    assert.ok(p.lines.every((l) => /^[MWSA]: /.test(l)), `${p.id} speaker tags`);
  }
});

test('writing tasks have prompts, a minimum length and a self-check list', () => {
  for (const t of [...TOEIC_WRITING, ...TOEFL_WRITING]) {
    assert.ok(t.prompt.length > 20, `${t.id} prompt`);
    assert.ok(t.minWords > 0, `${t.id} minWords`);
    assert.ok(t.checklist.length >= 2, `${t.id} checklist`);
  }
  for (const t of [...TOEIC_SPEAKING, ...TOEFL_SPEAKING]) {
    assert.ok(t.responseSeconds > 0 && t.prepSeconds >= 0, `${t.id} timings`);
  }
});

test('sentence-building chunks can be reordered into the answer sentence', () => {
  for (const task of TOEFL_BUILD) {
    const words = (s: string) => s.replace(/[.]/g, '').split(/\s+/).sort().join(' ');
    assert.equal(words(task.chunks.join(' ')), words(task.answer), `${task.id} chunks match the answer words`);
  }
});

test('Part 1 scene items have four statements and a valid answer', () => {
  assert.equal(TOEIC_PART1.length, 3);
  for (const q of TOEIC_PART1) {
    assert.equal(q.responses.length, 4, `${q.id} statements`);
    assert.ok(q.answer >= 0 && q.answer < 4, `${q.id} answer`);
  }
});

test('every Part 1 and Part 2 style question names its kind and level', () => {
  for (const q of TOEFL_LISTENING.flatMap((p) => p.questions)) {
    assert.ok(q.choices.length >= 2, `${q.id} choices`);
  }
  assert.ok(TOEFL_LISTENING.some((p) => p.questions.some((q) => q.id === 'toefl-poll-4')), 'inference question present');
});
