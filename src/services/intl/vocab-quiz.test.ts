import assert from 'node:assert/strict';
import test from 'node:test';

import { ALL_TOEFL_VOCAB, ALL_TOEIC_VOCAB, unitEntries, unitsFor } from '@/data/intl/units';
import { buildVocabQuiz } from './vocab-quiz';

test('meaning quiz: one correct Vietnamese meaning among four distinct choices', () => {
  const unit = unitEntriesFor('toeic', 0);
  const items = buildVocabQuiz(unit, ALL_TOEIC_VOCAB, 'seed-m', 'meaning', 10);
  assert.equal(items.length, 10);
  for (const q of items) {
    assert.equal(q.choices.length, 4, `${q.id} choices`);
    assert.equal(new Set(q.choices).size, 4, `${q.id} distinct`);
    assert.ok(q.answer >= 0 && q.answer < 4, `${q.id} answer`);
  }
});

test('cloze quiz: the blank replaces the word and the correct choice is that word', () => {
  const unit = unitEntriesFor('toefl', 0);
  const items = buildVocabQuiz(unit, ALL_TOEFL_VOCAB, 'seed-c', 'cloze', 10);
  assert.ok(items.length >= 5, 'enough cloze-capable words');
  for (const q of items) {
    assert.match(q.prompt, /_____/, `${q.id} has a blank`);
    const word = q.id.replace('cloze:', '');
    assert.equal(q.choices[q.answer], word, `${q.id} correct choice`);
    assert.doesNotMatch(q.prompt, new RegExp(`\b${word}\b`, 'i'), `${q.id} leaks the word`);
    assert.equal(new Set(q.choices).size, 4, `${q.id} distinct`);
  }
});

test('the same seed gives the same quiz', () => {
  const unit = unitEntriesFor('toefl', 1);
  assert.deepEqual(buildVocabQuiz(unit, ALL_TOEFL_VOCAB, 'same', 'meaning'), buildVocabQuiz(unit, ALL_TOEFL_VOCAB, 'same', 'meaning'));
});

function unitEntriesFor(exam: 'toeic' | 'toefl', index: number) {
  const unit = unitsFor(exam)[index];
  if (!unit) throw new Error('no unit');
  return unitEntries(unit);
}
