import assert from 'node:assert/strict';
import test from 'node:test';

import { ALL_TOEFL_VOCAB, ALL_TOEIC_VOCAB, VOCAB_UNITS, unitEntries, unitsFor } from './units';

test('every exam has twenty units of ten words', () => {
  for (const exam of ['toeic', 'toefl'] as const) {
    const units = unitsFor(exam);
    assert.equal(units.length, 20, `${exam} units`);
    for (const u of units) assert.equal(u.words.length, 10, `${u.id} size`);
  }
});

test('each vocabulary word belongs to exactly one unit and every list word is covered', () => {
  for (const exam of ['toeic', 'toefl'] as const) {
    const all = unitsFor(exam).flatMap((u) => u.words);
    assert.equal(new Set(all).size, all.length, `${exam} duplicate in units`);
    const list = (exam === 'toeic' ? ALL_TOEIC_VOCAB : ALL_TOEFL_VOCAB).map((e) => e.word);
    assert.deepEqual([...all].sort(), [...list].sort(), `${exam} coverage`);
  }
});

test('unit ids are unique and every unit resolves to entries', () => {
  const ids = VOCAB_UNITS.map((u) => u.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const u of VOCAB_UNITS) assert.equal(unitEntries(u).length, 10, `${u.id} entries`);
});

test('the TOEIC and TOEFL word lists have no duplicate words across base and extra lists', () => {
  for (const list of [ALL_TOEIC_VOCAB, ALL_TOEFL_VOCAB]) {
    const words = list.map((e) => e.word);
    assert.equal(new Set(words).size, words.length, 'duplicate word across lists');
  }
});

test('vocabulary entries are complete and examples contain their word', () => {
  for (const e of [...ALL_TOEIC_VOCAB, ...ALL_TOEFL_VOCAB]) {
    assert.ok(e.vi.length > 0 && e.en.length > 0 && e.example.length > 0, `${e.word} missing text`);
  }
  for (const e of ALL_TOEFL_VOCAB) {
    assert.ok(e.example.toLowerCase().includes(e.word), `${e.word} missing from its example`);
  }
});
