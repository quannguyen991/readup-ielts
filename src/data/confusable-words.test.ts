import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CONFUSABLE_PAIRS, blankOut, questionsFor } from './confusable-words';

test('40 cặp, không trùng, đủ 7 trường', () => {
  assert.equal(CONFUSABLE_PAIRS.length, 40);
  const keys = CONFUSABLE_PAIRS.map((p) => `${p.a}|${p.b}`);
  assert.equal(new Set(keys).size, keys.length);
  for (const p of CONFUSABLE_PAIRS) {
    for (const f of [p.a, p.b, p.viA, p.viB, p.exA, p.exB, p.tip]) assert.ok(f && f.trim().length > 0, `${p.a}/${p.b}: thiếu trường`);
    assert.notEqual(p.a, p.b);
  }
});

test('mỗi ví dụ chứa đúng từ của mình và là câu hoàn chỉnh', () => {
  for (const p of CONFUSABLE_PAIRS) {
    assert.ok(p.exA.toLowerCase().includes(p.a.toLowerCase()), `${p.a}: ví dụ A không chứa từ`);
    assert.ok(p.exB.toLowerCase().includes(p.b.toLowerCase()), `${p.b}: ví dụ B không chứa từ`);
    assert.match(p.exA, /^[A-Z].*[.!?]$/, `${p.a}: ví dụ A chưa thành câu`);
    assert.match(p.exB, /^[A-Z].*[.!?]$/, `${p.b}: ví dụ B chưa thành câu`);
  }
});

test('câu hỏi: chỗ trống thật sự, đáp án đúng nằm trong lựa chọn', () => {
  const qs = questionsFor(CONFUSABLE_PAIRS);
  assert.equal(qs.length, 80);
  for (const q of qs) {
    assert.ok(q.sentence.includes('_____'), `thiếu chỗ trống: ${q.sentence}`);
    assert.equal(new Set(q.options).size, 2);
    assert.ok(q.options[q.answer].length > 0);
  }
  assert.equal(blankOut('She likes tea.', 'tea'), 'She likes _____.');
});
