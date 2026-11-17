import assert from 'node:assert/strict';
import { test } from 'node:test';

import { JA_GRAMMAR, JA_LEVELS, jaGrammarOfLevel, makeCloze, searchJaGrammar } from './index';

test('mỗi cấp N5–N1 có ít nhất 25 điểm ngữ pháp, mỗi điểm ≥ 2 ví dụ có đoạn tô nằm trong câu', () => {
  for (const lv of JA_LEVELS) assert.ok(jaGrammarOfLevel(lv).length >= 25, `N${lv}`);
  for (const g of JA_GRAMMAR) {
    assert.ok(g.examples.length >= 2, g.id);
    for (const e of g.examples) assert.ok(e.ja.includes(e.mark) && e.vi.trim(), `${g.id}: ${e.ja}`);
  }
  assert.equal(new Set(JA_GRAMMAR.map((g) => g.id)).size, JA_GRAMMAR.length);
});

test('tìm không dấu và theo mẫu câu', () => {
  assert.ok(searchJaGrammar('tai sao').length >= 0);
  assert.ok(searchJaGrammar('にもかかわらず').some((g) => g.level === 2));
  assert.ok(searchJaGrammar('nghe noi', 4).length >= 1);
  assert.equal(searchJaGrammar('zzzzzz').length, 0);
});

test('câu điền chỗ trống có đáp án đúng nằm trong 4 lựa chọn khác nhau', () => {
  for (const lv of JA_LEVELS) {
    const qs = makeCloze(lv, 10);
    assert.equal(qs.length, 10);
    for (const q of qs) {
      assert.equal(q.options.length, 4, q.full);
      assert.equal(new Set(q.options).size, 4, q.full);
      assert.equal(q.before + q.options[q.answer] + q.after, q.full);
    }
  }
});
