import assert from 'node:assert/strict';
import { test } from 'node:test';

import { readingExplanation } from './ielts-reading-explanations';

test('lời giải Reading: 48 đề Cambridge 10–21, đủ 40 câu, mỗi câu có lý do, câu trích và vị trí', () => {
  let tests = 0;
  for (let book = 10; book <= 21; book += 1) {
    for (let t = 1; t <= 4; t += 1) {
      const id = `cambridge-${book}-reading-${t}`;
      tests += 1;
      for (let n = 1; n <= 40; n += 1) {
        const e = readingExplanation(id, n);
        assert.ok(e, `${id} câu ${n}`);
        assert.ok(e.vi.length >= 15 && e.vi.length <= 900, `${id} câu ${n}: lý do`);
        assert.ok(e.quote.length >= 8 && e.quote.length <= 900, `${id} câu ${n}: câu trích`);
        assert.ok(e.where.length >= 3, `${id} câu ${n}: vị trí`);
      }
    }
  }
  assert.equal(tests, 48);
  for (const id of ['cambridge-8-reading-1', 'cambridge-8-reading-2', 'cambridge-8-reading-3', 'cambridge-8-reading-4', 'vol-10-reading-1', 'vol-10-reading-2', 'vol-10-reading-4', 'vol-10-reading-6']) {
    for (let n = 1; n <= 40; n += 1) assert.ok(readingExplanation(id, n), `${id} câu ${n}`);
  }
  // Vol 10 đề 3 và 5: khoá đáp án không khớp nội dung nên chưa có lời giải
  assert.equal(readingExplanation('vol-10-reading-3', 1), null);
  assert.equal(readingExplanation('vol-10-reading-5', 1), null);
  assert.equal(readingExplanation('cambridge-10-reading-1', 41), null);
  assert.equal(readingExplanation('khong-co', 1), null);
});
