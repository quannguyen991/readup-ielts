import test from 'node:test';
import assert from 'node:assert/strict';

import { DEV_FIXTURE } from '@/data/history/__dev__/fixture';

import { ttsLooksFailed, clampSeek, classifyMediaError, formatClock, hasSentenceSync, narrationLangs, neighbour, nextSpeed, paragraphAt, sentenceAt, SPEEDS } from './audio-core';

const sentences = [
  { start: 0, end: 4, text: 'a', paragraphId: 'p1' },
  { start: 4.5, end: 8, text: 'b', paragraphId: 'p1' },
  { start: 8, end: 12, text: 'c', paragraphId: 'p2' },
];

test('mốc câu: chỉ khi có timestamp thật; không có thì -1 (không suy đoán)', () => {
  assert.equal(sentenceAt(undefined, 3), -1);
  assert.equal(sentenceAt([], 3), -1);
  assert.equal(sentenceAt(sentences, 0), 0);
  assert.equal(sentenceAt(sentences, 3.99), 0);
  assert.equal(sentenceAt(sentences, 4.2), 0, 'kẽ hở giữa hai câu giữ câu vừa đọc');
  assert.equal(sentenceAt(sentences, 8), 2);
  assert.equal(sentenceAt(sentences, 99), 2);
  assert.equal(paragraphAt(sentences, 9), 'p2');
  assert.equal(paragraphAt(undefined, 9), null);
});

test('hasSentenceSync / ngôn ngữ thuyết minh theo audio có thật', () => {
  const [s1, s2] = DEV_FIXTURE.scenes;
  assert.equal(hasSentenceSync(s1!.audio!.en), true);
  assert.equal(hasSentenceSync(s2!.audio!.en), false);
  assert.deepEqual(narrationLangs(s1), ['en', 'vi']);
  assert.deepEqual(narrationLangs(s2), ['en']);
  assert.deepEqual(narrationLangs(undefined), []);
});

test('tốc độ, tua, đồng hồ, cảnh kế', () => {
  assert.deepEqual([...SPEEDS], [0.65, 0.75, 0.85, 1, 1.25, 1.5]);
  assert.equal(nextSpeed(1), 1.25);
  assert.equal(nextSpeed(1.5), 0.65);
  assert.equal(nextSpeed(0.65), 0.75);
  assert.equal(nextSpeed(3), 1);
  assert.equal(clampSeek(-5, 30), 0);
  assert.equal(clampSeek(50, 30), 30);
  assert.equal(clampSeek(NaN, 30), 0);
  assert.equal(clampSeek(7, NaN), 7);
  assert.equal(formatClock(75.9), '1:15');
  assert.equal(formatClock(-1), '0:00');
  assert.equal(neighbour(['s01', 's02', 's03'], 's02', 1), 's03');
  assert.equal(neighbour(['s01', 's02', 's03'], 's03', 1), null);
  assert.equal(neighbour(['s01', 's02', 's03'], 's01', -1), null);
  assert.equal(neighbour(['s01'], 'zz', 1), null);
});

test('phân loại lỗi audio', () => {
  assert.equal(classifyMediaError(4), 'missing');
  assert.equal(classifyMediaError(4, false), 'network');
  assert.equal(classifyMediaError(2), 'network');
  assert.equal(classifyMediaError(3), 'decode');
  assert.equal(classifyMediaError(undefined), 'missing');
});

test('giọng thiết bị đọc xong quá nhanh thì coi là thất bại, không đánh dấu đã đọc', () => {
  assert.equal(ttsLooksFailed(80, 100), true);
  assert.equal(ttsLooksFailed(5000, 100), true);
  assert.equal(ttsLooksFailed(30000, 100), false);
  assert.equal(ttsLooksFailed(500, 3), true);
});
