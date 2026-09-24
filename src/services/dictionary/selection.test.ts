import assert from 'node:assert/strict';
import { test } from 'node:test';

import { lookupable } from './selection';

test('bôi đen: tra từ và cụm tiếng Anh ngắn, gọt dấu câu hai đầu', () => {
  assert.equal(lookupable('  habitat. '), 'habitat');
  assert.equal(lookupable('“nuclear family”,'), 'nuclear family');
  assert.equal(lookupable("mother-in-law's"), "mother-in-law's");
});

test('bôi đen: bỏ qua tiếng Việt, số, đoạn quá dài và câu nhiều hơn năm từ', () => {
  assert.equal(lookupable('môi trường'), null);
  assert.equal(lookupable('2026'), null);
  assert.equal(lookupable('a'), null);
  assert.equal(lookupable('this is a sentence with far too many words'), null);
  assert.equal(lookupable('x'.repeat(60)), null);
});
