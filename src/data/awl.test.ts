import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AWL, awlOfSublist } from './awl';

test('120 từ: mỗi sublist đúng 60, không trùng', () => {
  assert.equal(AWL.length, 120);
  assert.equal(awlOfSublist(1).length, 60);
  assert.equal(awlOfSublist(2).length, 60);
  const words = AWL.map((w) => w.word);
  assert.equal(new Set(words).size, words.length);
});

test('mỗi từ có đủ loại từ, nghĩa và ví dụ hoàn chỉnh chứa chính từ đó', () => {
  for (const w of AWL) {
    assert.ok(w.pos && w.vi.trim().length >= 2, `${w.word}: thiếu loại từ hoặc nghĩa`);
    assert.match(w.example, /^[A-Z].*[.!?]$/, `${w.word}: ví dụ chưa thành câu`);
    assert.ok(w.example.toLowerCase().includes(w.word.slice(0, Math.max(4, w.word.length - 3))), `${w.word}: ví dụ không dùng từ này`);
  }
});
