import assert from 'node:assert/strict';
import test from 'node:test';

import { getDrillSets, isDrillCorrect, optionsOf } from './index';

const TYPES = [
  'reading-tfng', 'reading-matching-headings', 'reading-summary-completion', 'reading-matching-info', 'reading-multiple-choice',
  'listening-form-completion', 'listening-map-labelling', 'listening-matching',
];

test('mỗi dạng Reading/Listening có 10 set × 20 câu', () => {
  for (const t of TYPES) {
    const sets = getDrillSets(t);
    assert.equal(sets.length, 10, `${t} cần 10 set`);
    assert.equal(new Set(sets.map((s) => s.id)).size, 10, `${t} trùng id set`);
    for (const s of sets) assert.equal(s.questions.length, 20, `${s.id} cần 20 câu`);
  }
});

test('đáp án trắc nghiệm nằm trong phương án, ô gõ không có phương án', () => {
  for (const t of TYPES) {
    for (const s of getDrillSets(t)) {
      for (const q of s.questions) {
        const opts = optionsOf(t, s, q);
        if (opts) assert.ok(opts.includes(q.answer), `${s.id}: "${q.answer}" không thuộc phương án`);
        else assert.ok(q.answer.trim().length > 0);
      }
    }
  }
});

test('chấm ô gõ bỏ qua hoa thường, dấu cách, £ và nhận đáp án phụ', () => {
  assert.ok(isDrillCorrect('£45 | 45', '45'));
  assert.ok(isDrillCorrect('BS8 4TQ', 'bs84tq'));
  assert.ok(isDrillCorrect('14 March | March 14', 'march 14'));
  assert.ok(!isDrillCorrect('Marsh', 'Marsha'));
  assert.ok(!isDrillCorrect('Marsh', ''));
});
