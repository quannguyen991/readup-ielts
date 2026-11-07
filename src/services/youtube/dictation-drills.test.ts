import test from 'node:test';
import assert from 'node:assert/strict';

import { splitForDictation } from './dictation-drills';

const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i + 1}`).join(' ');

test('câu từ 9 từ trở xuống giữ nguyên một lượt', () => {
  const drills = splitForDictation([{ start: 0, end: 4, text: words(9) }]);
  assert.equal(drills.length, 1);
  assert.equal(drills[0]!.whole, true);
  assert.equal(drills[0]!.parent, 0);
});

test('câu 20 từ chia thành ba lượt, không lượt nào quá 9 từ', () => {
  const drills = splitForDictation([{ start: 0, end: 9, text: words(20) }]);
  const sizes = drills.map((d) => d.text.split(' ').length);
  assert.deepEqual(sizes, [7, 7, 6]);
  assert.equal(drills.every((d) => !d.whole && d.parent === 0), true);
});

test('các lượt ghép lại đúng nguyên văn câu gốc', () => {
  const sentence = words(23);
  const drills = splitForDictation([{ start: 0, end: 10, text: sentence }]);
  assert.equal(drills.map((d) => d.text).join(' '), sentence);
});

test('thời gian các lượt nối liền và phủ đúng câu gốc', () => {
  const drills = splitForDictation([{ start: 10, end: 22, text: words(18) }]);
  assert.equal(drills.length, 2);
  assert.equal(drills[0]!.start, 10);
  assert.ok(Math.abs(drills[0]!.end - drills[1]!.start) < 1e-9);
  assert.equal(drills[drills.length - 1]!.end, 22);
});

test('parent trỏ đúng câu gốc khi nhiều câu nối nhau', () => {
  const drills = splitForDictation([
    { start: 0, end: 2, text: 'Hi there.' },
    { start: 2, end: 8, text: words(12) },
  ]);
  assert.deepEqual(drills.map((d) => d.parent), [0, 1, 1]);
  assert.equal(drills[0]!.whole, true);
  assert.equal(drills[1]!.whole, false);
});
