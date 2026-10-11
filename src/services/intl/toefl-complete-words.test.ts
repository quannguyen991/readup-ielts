import assert from 'node:assert/strict';
import test from 'node:test';

import { TOEFL_VOCAB } from '@/data/intl/toefl-vocab';
import { buildCompleteWordsSet, isCorrectWord, maskWord } from './toefl-complete-words';

test('maskWord keeps the first and last letters and hides two inner letters', () => {
  assert.equal(maskWord('data'), 'd__a');
  assert.equal(maskWord('analyze'), 'an__yze');
  for (const e of TOEFL_VOCAB) {
    const masked = maskWord(e.word);
    assert.equal(masked.length, e.word.length, `${e.word} length`);
    assert.equal(masked[0], e.word[0], `${e.word} first letter`);
    assert.equal(masked[masked.length - 1], e.word[e.word.length - 1], `${e.word} last letter`);
    assert.equal(masked.split('_').length - 1, 2, `${e.word} hides two letters`);
  }
});

test('a complete-words set has unique words and shows the masked form in context', () => {
  const set = buildCompleteWordsSet('test-set', 10);
  assert.equal(set.length, 10);
  assert.equal(new Set(set.map((i) => i.answer)).size, 10);
  for (const item of set) {
    assert.ok(item.sentence.toLowerCase().includes(item.masked.toLowerCase()), `${item.answer} masked form missing from sentence`);
  }
});

test('the same seed returns the same complete-words set', () => {
  assert.deepEqual(buildCompleteWordsSet('same', 10), buildCompleteWordsSet('same', 10));
});

test('answer checking ignores case and surrounding spaces', () => {
  const item = buildCompleteWordsSet('check', 1)[0];
  assert.ok(item);
  assert.equal(isCorrectWord(item, `  ${item.answer.toUpperCase()} `), true);
  assert.equal(isCorrectWord(item, 'wrong'), false);
});

test('the level filter keeps only words of that length band', () => {
  const easy = buildCompleteWordsSet('lvl', 10, undefined, 'easy');
  assert.ok(easy.length >= 5, 'enough easy words');
  for (const item of easy) assert.ok(item.answer.length <= 6, `${item.answer} is not easy`);
  for (const item of buildCompleteWordsSet('lvl', 10, undefined, 'hard')) assert.ok(item.answer.length >= 10, `${item.answer} is not hard`);
});
