import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ESSAYS, essayItemId, getEssay } from './essays';

test('bài essay: đủ số lượng, độ dài và id không trùng', () => {
  assert.ok(ESSAYS.length >= 8);
  assert.equal(new Set(ESSAYS.map((e) => e.id)).size, ESSAYS.length);
  for (const e of ESSAYS) {
    const reading = e.kind === 'reading';
    assert.ok(reading ? e.sentences.length >= 25 && e.sentences.length <= 60 : e.sentences.length >= 24 && e.sentences.length <= 32, `${e.id}: ${e.sentences.length} câu`);
    assert.ok(reading ? e.paragraphSizes.length >= 4 && e.paragraphSizes.length <= 20 : e.paragraphSizes.length >= 4 && e.paragraphSizes.length <= 6, e.id);
    assert.equal(e.paragraphSizes.reduce((a, b) => a + b, 0), e.sentences.length);
    for (const s of e.sentences) {
      assert.ok(s.vi.trim().length > 2 && s.en.trim().length > 2, e.id);
      assert.ok(/[À-ỹ]/.test(s.vi) || /[a-z]/.test(s.vi), e.id);
    }
  }
});

test('tra cứu theo mã và mã câu', () => {
  assert.equal(getEssay('es-01')?.id, 'es-01');
  assert.equal(essayItemId('es-01', 3), 'es-01:3');
});
