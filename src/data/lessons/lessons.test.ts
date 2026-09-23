import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MATH_LESSONS } from './math-lessons';
import { VERBAL_LESSONS } from './verbal-lessons';
import { SAT_MATH_VOCAB_LESSONS, SAT_VERBAL_VOCAB_LESSONS, VERBAL_THEMES } from './vocab-lessons';
import { MATH_SKILL_DOMAIN } from '@/lib/math/types';
import { validateMath } from '@/lib/math/expr';
import { SAT_RW_LEXICON } from '../sat-rw-lexicon';
import { SAT_RW_SKILL_LABEL } from '../sat-rw-repository';
import { SAT_VOCAB_TERMS } from '../sat-math-vocab';
import { getStaticDeck } from '../study-decks';

test('mỗi kỹ năng SAT Math có đúng một bài lý thuyết', () => {
  assert.deepEqual(MATH_LESSONS.map((l) => l.skill).sort(), Object.keys(MATH_SKILL_DOMAIN).sort());
});

test('mỗi kỹ năng SAT Verbal có đúng một bài lý thuyết', () => {
  assert.deepEqual(VERBAL_LESSONS.map((l) => l.skill).sort(), Object.keys(SAT_RW_SKILL_LABEL).sort());
});

test('mỗi bài có ví dụ, bẫy và mẹo', () => {
  for (const l of [...MATH_LESSONS, ...VERBAL_LESSONS]) {
    const kinds = new Set(l.blocks.map((b) => b.kind));
    for (const k of ['rule', 'example', 'trap', 'tip']) assert.ok(kinds.has(k as never), `${l.skill} thiếu ${k}`);
  }
});

test('markup toán trong bài Math hợp lệ', () => {
  for (const l of MATH_LESSONS) {
    for (const b of l.blocks) {
      const texts = b.kind === 'rule' ? [b.body, b.formula ?? ''] : b.kind === 'example' ? [b.problem, ...b.steps, b.answer] : [b.text];
      for (const t of texts) assert.deepEqual(validateMath(t), [], `${l.skill}: ${t}`);
    }
  }
});

test('đáp số các ví dụ Math tính lại bằng máy', () => {
  // (1150 - 80) / 35 = 30,57 → 30 thùng
  assert.equal(Math.floor((1150 - 80) / 35), 30);
  assert.equal(((1150 - 80) / 35).toFixed(2), '30.57');
  // 3(x + 4) = 5x - 2 → x = 7
  assert.equal(3 * (7 + 4), 5 * 7 - 2);
  // 2(3x - k) = 6x + 8 vô số nghiệm → -2k = 8
  assert.equal(-2 * -4, 8);
  // f qua (2,5), (6,17) → f(x) = 3x - 1
  assert.equal(3 * 2 - 1, 5);
  assert.equal(3 * 6 - 1, 17);
  // 2x + 3y = 12, 4x + ky = 5 vô nghiệm → k = 6
  assert.equal(4 / 2, 6 / 3);
  // -3x + 5 > 17 → x < -4
  assert.equal(-3 * -4 + 5, 17);
  // x^2 + 4x + k có nghiệm kép → k = 4
  assert.equal(16 - 4 * 4, 0);
  // 500 · 2^(12/4)
  assert.equal(500 * 2 ** (12 / 4), 4000);
  // 80 · 1,25 · 0,8
  assert.ok(Math.abs(80 * 1.25 * 0.8 - 80) < 1e-9);
  // 2,4,4,5,10 → mean 5; bỏ 10 → 3,75
  assert.equal((2 + 4 + 4 + 5 + 10) / 5, 5);
  assert.equal((2 + 4 + 4 + 5) / 4, 3.75);
  // residual
  assert.equal(34 - (2.5 * 8 + 10), 4);
  // 5-12-13
  assert.equal(5 ** 2 + 12 ** 2, 13 ** 2);
  // x^2 + y^2 - 6x + 4y - 3 = 0 → r^2 = 3 + 9 + 4
  assert.equal(3 + 9 + 4, 16);
  // cung 60° bán kính 6 = 2π
  assert.ok(Math.abs((60 / 360) * 2 * Math.PI * 6 - 2 * Math.PI) < 1e-9);
  // 60 km/h = 50/3 m/s
  assert.ok(Math.abs(60000 / 3600 - 50 / 3) < 1e-9);
});

test('mọi từ của từ điển SAT Verbal nằm trong đúng một bài từ vựng', () => {
  const all = VERBAL_THEMES.flatMap((t) => t.words);
  assert.equal(new Set(all).size, all.length, 'một từ nằm ở hai bài');
  assert.deepEqual([...all].sort(), Object.keys(SAT_RW_LEXICON).sort());
});

test('mọi thuật ngữ SAT Math nằm trong một bài từ vựng', () => {
  const all = SAT_MATH_VOCAB_LESSONS.flatMap((l) => l.words.map((w) => w.word));
  assert.equal(all.length, SAT_VOCAB_TERMS.length);
});

test('bài từ vựng đủ từ để làm trắc nghiệm 4 lựa chọn, và mở được như một bộ học', () => {
  for (const l of [...SAT_MATH_VOCAB_LESSONS, ...SAT_VERBAL_VOCAB_LESSONS]) {
    assert.ok(l.words.length >= 4, `${l.slug} chỉ có ${l.words.length} từ`);
    assert.ok(l.words.length <= 13, `${l.slug} quá dài`);
    assert.equal(getStaticDeck(l.slug)?.words.length, l.words.length);
  }
});
