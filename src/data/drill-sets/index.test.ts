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

const NEW_TYPES = [
  'reading-ynng', 'reading-matching-features', 'reading-matching-endings', 'reading-sentence-completion',
  'reading-table-flow-completion', 'reading-short-answer', 'listening-mcq', 'listening-sentence-completion',
  'listening-table-completion', 'listening-short-answer',
];
const squashText = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[^a-z0-9£$%]/g, '');

test('dạng mới có ít nhất 5 set, mỗi set tối thiểu 16 câu đã qua kiểm máy', () => {
  for (const t of NEW_TYPES) {
    const sets = getDrillSets(t);
    assert.ok(sets.length >= 5, `${t} chỉ có ${sets.length} set`);
    assert.equal(new Set(sets.map((s) => s.id)).size, sets.length, `${t} trùng id set`);
    for (const s of sets) assert.ok(s.questions.length >= 16, `${s.id} chỉ có ${s.questions.length} câu`);
  }
});

test('dạng mới: đáp án thuộc phương án, bằng chứng nằm đúng trong bài, giải thích bằng tiếng Việt', () => {
  const VI = /[ạảãàáâậầấẩẫăắằặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôộồốổỗơợờớởỡùúụủũưựừứửữỳýỵỷỹđ]/i;
  for (const t of NEW_TYPES) {
    for (const s of getDrillSets(t)) {
      const ctx = squashText(s.context ?? '');
      assert.ok(ctx.length > 1500, `${s.id} thiếu bài`);
      for (const q of s.questions) {
        const opts = optionsOf(t, s, q);
        if (opts) assert.ok(opts.includes(q.answer), `${s.id}: "${q.answer}" không thuộc phương án`);
        else assert.ok(q.answer.trim().length > 0 && q.prompt.trim().length > 0, `${s.id}: câu trống`);
        assert.ok(q.quote && ctx.includes(squashText(q.quote)), `${s.id}: bằng chứng "${q.quote}" không có trong bài`);
        assert.ok(VI.test(q.why), `${s.id}: giải thích không phải tiếng Việt`);
      }
    }
  }
});

test('YNNG dùng ba nhãn YES / NO / NOT GIVEN và mỗi set đủ cả ba', () => {
  for (const s of getDrillSets('reading-ynng')) {
    const labels = new Set(s.questions.map((q) => q.answer));
    assert.deepEqual([...labels].sort(), ['NO', 'NOT GIVEN', 'YES']);
    assert.deepEqual(optionsOf('reading-ynng', s, s.questions[0]!), ['YES', 'NO', 'NOT GIVEN']);
  }
});
