import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  answeredNumbers, bandFromRaw40, bandFromScore, coveredNumbers, isGapCorrect, manyCorrectCount,
  normalizeAnswer, numberToWords, scoreSections,
} from './scoring';
import type { ListeningSection } from './types';

test('chuẩn hoá: hoa thường, dấu câu, dấu nối', () => {
  assert.equal(normalizeAnswer('  Well-Known! '), 'well known');
  assert.equal(normalizeAnswer('Mind_map.'), 'mind map');
  assert.equal(normalizeAnswer("O'Brien"), 'obrien');
  assert.equal(normalizeAnswer(''), '');
});

test('chuẩn hoá: số viết chữ và chữ số', () => {
  assert.equal(normalizeAnswer('eight'), '8');
  assert.equal(normalizeAnswer('Twenty-one'), '21');
  assert.equal(normalizeAnswer('one hundred and fifty'), '150');
  assert.equal(normalizeAnswer('two thousand'), '2000');
  assert.equal(normalizeAnswer('1,000'), '1000');
  assert.equal(normalizeAnswer('9:30'), '9.30');
  assert.equal(normalizeAnswer('3.5'), '3.5');
  assert.equal(normalizeAnswer('eight pounds'), '8 pounds');
  assert.equal(normalizeAnswer('one two'), '1 2');
});

test('numberToWords', () => {
  assert.deepEqual(numberToWords(21), ['twenty', 'one']);
  assert.deepEqual(numberToWords(105), ['one', 'hundred', 'five']);
  assert.deepEqual(numberToWords(2500), ['two', 'thousand', 'five', 'hundred']);
});

test('chấm điền từ: biến thể chấp nhận', () => {
  const q = { answer: '8', accept: ['eight people'] };
  assert.ok(isGapCorrect('eight', q));
  assert.ok(isGapCorrect('8', q));
  assert.ok(isGapCorrect('Eight People.', q));
  assert.ok(!isGapCorrect('nine', q));
  assert.ok(!isGapCorrect('', q));
});

test('chấm điền từ: Anh / Mỹ, nối chữ, ngoặc tuỳ chọn', () => {
  assert.ok(isGapCorrect('color', { answer: 'colour' }));
  assert.ok(isGapCorrect('Centre', { answer: 'center' }));
  assert.ok(isGapCorrect('mindmap', { answer: 'mind map' }));
  assert.ok(isGapCorrect('mind-map', { answer: 'mind map' }));
  assert.ok(isGapCorrect('library', { answer: '(the) library' }));
  assert.ok(isGapCorrect('the library', { answer: '(the) library' }));
  assert.ok(!isGapCorrect('a library', { answer: '(the) library' }));
  assert.ok(isGapCorrect('9:30', { answer: '9.30' }));
  assert.ok(isGapCorrect('twelve', { answer: '12' }));
});

test('chấm điền từ: không chấp nhận sai chính tả / số nhiều', () => {
  assert.ok(!isGapCorrect('apron', { answer: 'aprons' }));
  assert.ok(!isGapCorrect('aprn', { answer: 'apron' }));
});

test('chọn nhiều đáp án: mỗi khoá đúng một điểm', () => {
  assert.equal(manyCorrectCount(['A', 'D'], ['A', 'D']), 2);
  assert.equal(manyCorrectCount(['d', 'a'], ['A', 'D']), 2);
  assert.equal(manyCorrectCount(['A', 'B'], ['A', 'D']), 1);
  assert.equal(manyCorrectCount(['A', 'A'], ['A', 'D']), 1);
  assert.equal(manyCorrectCount(['B', 'C'], ['A', 'D']), 0);
  assert.equal(manyCorrectCount(undefined, ['A', 'D']), 0);
  assert.equal(manyCorrectCount(['A', 'B', 'D'], ['A', 'D']), 2);
});

const section: ListeningSection = {
  n: 1, title: 't', audio: '/a.mp3', transcript: [{ text: 'x' }],
  groups: [
    { type: 'gap', instruction: 'i', lines: ['{{1}}', '{{2}}'], questions: [{ n: 1, answer: 'Jensen' }, { n: 2, answer: '8', accept: ['eight'] }] },
    { type: 'mcq-one', instruction: 'i', questions: [{ n: 3, prompt: 'p', answer: 'B', options: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }] }] },
    { type: 'mcq-many', instruction: 'i', options: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }, { key: 'C', text: 'c' }], questions: [{ n: 4, answer: ['A', 'C'] }] },
    { type: 'matching', instruction: 'i', options: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }], questions: [{ n: 6, prompt: 'w', answer: 'A' }] },
  ],
};

test('phủ số câu của mcq-many', () => {
  assert.deepEqual(coveredNumbers(section.groups[2]?.questions[0] as never), [4, 5]);
});

test('chấm cả section', () => {
  const r = scoreSections([section], { 1: 'jensen', 2: 'Eight', 3: 'A', 4: ['C', 'B'], 6: 'a' });
  assert.equal(r.total, 6);
  assert.equal(r.score, 1 + 1 + 0 + 1 + 1);
  assert.deepEqual(r.results.map((x) => x.correct), [true, true, false, false, true]);
});

test('số câu đã trả lời', () => {
  const s = answeredNumbers([section], { 1: 'x', 2: '  ', 4: ['A'] });
  assert.deepEqual([...s].sort(), [1, 4]);
  assert.deepEqual([...answeredNumbers([section], { 4: ['A', 'C'] })].sort(), [4, 5]);
});

test('bảng band Listening', () => {
  assert.equal(bandFromRaw40(40), 9);
  assert.equal(bandFromRaw40(39), 9);
  assert.equal(bandFromRaw40(38), 8.5);
  assert.equal(bandFromRaw40(35), 8);
  assert.equal(bandFromRaw40(32), 7.5);
  assert.equal(bandFromRaw40(30), 7);
  assert.equal(bandFromRaw40(26), 6.5);
  assert.equal(bandFromRaw40(23), 6);
  assert.equal(bandFromRaw40(18), 5.5);
  assert.equal(bandFromRaw40(16), 5);
  assert.equal(bandFromRaw40(13), 4.5);
  assert.equal(bandFromRaw40(10), 4);
  assert.equal(bandFromRaw40(0), 0);
  assert.equal(bandFromScore(8, 10), 7.5);
  assert.equal(bandFromScore(10, 10), 9);
  assert.equal(bandFromScore(0, 0), 0);
});
