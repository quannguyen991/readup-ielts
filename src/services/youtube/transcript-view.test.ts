import test from 'node:test';
import assert from 'node:assert/strict';

import type { TranscriptSentence } from './transcript';
import { chunkLines, clock, indexAt, LINES_PER_REQUEST } from './transcript-view';

const sentences: TranscriptSentence[] = [
  { start: 0, end: 2, text: 'Hello there.' },
  { start: 2.5, end: 5, text: 'How are you?' },
  { start: 6, end: 9, text: 'I am fine.' },
];

test('chia lô đúng cỡ, lô cuối có thể ngắn hơn', () => {
  const lines = Array.from({ length: 23 }, (_, i) => `line ${i}`);
  const parts = chunkLines(lines);
  assert.equal(parts.length, Math.ceil(23 / LINES_PER_REQUEST));
  assert.equal(parts[0]?.length, LINES_PER_REQUEST);
  assert.equal(parts[parts.length - 1]?.length, 3);
  assert.deepEqual(parts.flat(), lines);
});

test('danh sách rỗng không tạo lô nào', () => {
  assert.deepEqual(chunkLines([]), []);
});

test('câu đang phát là câu có start gần nhất không vượt quá thời điểm', () => {
  assert.equal(indexAt(sentences, 0), 0);
  assert.equal(indexAt(sentences, 1.9), 0);
  assert.equal(indexAt(sentences, 2.5), 1);
  assert.equal(indexAt(sentences, 4.2), 1);
  assert.equal(indexAt(sentences, 7), 2);
  assert.equal(indexAt(sentences, 999), 2);
});

test('trước câu đầu hoặc khi không có thời gian hợp lệ thì trả về dòng đầu', () => {
  assert.equal(indexAt(sentences, -3), 0);
  assert.equal(indexAt(sentences, Number.NaN), 0);
  assert.equal(indexAt([], 10), 0);
});

test('nhãn thời gian', () => {
  assert.equal(clock(0), '0:00');
  assert.equal(clock(75.9), '1:15');
  assert.equal(clock(-4), '0:00');
  assert.equal(clock(605), '10:05');
});
