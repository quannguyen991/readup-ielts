import assert from 'node:assert/strict';
import { test } from 'node:test';

import { autoSpeakWhen, type QuestionDirection } from './auto-speak';
import type { StageKind } from './topic-study';

const w = (kind: StageKind, dir: QuestionDirection, flipped = false, revealed = false) => autoSpeakWhen({ kind, dir, flipped, revealed });

test('thẻ Anh → Việt và trắc nghiệm Anh → Việt: đọc ngay khi từ hiện ra, không đọc lại khi chấm', () => {
  assert.equal(w('flash', 'enToVi'), 'show');
  assert.equal(w('mcq', 'enToVi'), 'show');
  assert.equal(w('mcq', 'enToVi', false, true), 'show');
});

test('thẻ Việt → Anh: đọc khi lật ra từ', () => {
  assert.equal(w('flash', 'viToEn'), null);
  assert.equal(w('flash', 'viToEn', true), 'flip');
});

test('Việt → Anh (trắc nghiệm, gõ), điền chỗ trống: đọc khi đáp án lộ ra, cả đúng lẫn sai', () => {
  assert.equal(w('mcq', 'viToEn'), null);
  assert.equal(w('mcq', 'viToEn', false, true), 'reveal');
  assert.equal(w('type', 'viToEn'), null);
  assert.equal(w('type', 'viToEn', false, true), 'reveal');
  assert.equal(w('fill', 'enToVi', false, true), 'reveal');
});

test('chiều nghe đã tự đọc khi câu hiện ra: không đọc lại lúc lộ đáp án (trừ điền chỗ trống)', () => {
  assert.equal(w('mcq', 'listen', false, true), null);
  assert.equal(w('type', 'listen', false, true), null);
  assert.equal(w('fill', 'listen', false, true), 'reveal');
});
