import { test } from 'node:test';
import assert from 'node:assert/strict';

import { averageBand, bandDelta, formatBand, latestBand } from './band';

/**
 * Band là thang của riêng IELTS. Lượt làm bài SAT lưu `estimatedBand: null`,
 * nên mọi chỗ hiển thị hoặc tính trung bình phải chịu được null.
 *
 * Bug đã gặp thật: màn Review gọi thẳng `session.estimatedBand.toFixed(1)`,
 * nộp bài SAT là cả trang trắng vì React ném lỗi giữa lúc render.
 */

test('formatBand: null ra dấu gạch, không được ném lỗi', () => {
  assert.equal(formatBand(null), '—');
  assert.equal(formatBand(6.5), '6.5');
  assert.equal(formatBand(7), '7.0');
});

test('averageBand: bỏ qua lượt SAT thay vì coi là 0', () => {
  // 6 và 7 trung bình 6.5; lượt SAT (null) không được kéo tụt xuống 4.33.
  assert.equal(averageBand([6, null, 7]), 6.5);
});

test('averageBand: toàn SAT thì không có band để nói', () => {
  assert.equal(averageBand([null, null]), null);
  assert.equal(averageBand([]), null);
});

test('latestBand: lấy lượt IELTS gần nhất, bỏ qua SAT chen giữa', () => {
  assert.equal(latestBand([null, 6.5, 7]), 6.5);
  assert.equal(latestBand([null, null]), null);
});

test('bandDelta: thiếu một đầu thì không có chênh lệch', () => {
  assert.equal(bandDelta(7, 6.5), 0.5);
  assert.equal(bandDelta(7, null), null);
  assert.equal(bandDelta(null, 6.5), null);
});
