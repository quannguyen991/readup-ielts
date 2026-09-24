import assert from 'node:assert/strict';
import { test } from 'node:test';

import { findDeckWord } from './deck-dictionary';

test('tra trong máy: từ của bộ chủ đề có đủ nghĩa, khớp cả dạng chia', () => {
  const w = findDeckWord('Apprenticeship');
  assert.ok(w, 'có trong bộ Giáo dục');
  assert.ok(w.meaningVi && w.ipa && w.example);
  assert.equal(findDeckWord('apprenticeships')?.word, 'apprenticeship');
  assert.equal(findDeckWord('zzzzqqq'), null);
});
