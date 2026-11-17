import assert from 'node:assert/strict';
import test from 'node:test';

import { optionsOf } from './index';
import { buildMixedTest, MIXED_PARTS, MIXED_PER_PART, mixableTypes } from './mixed';

for (const skill of ['reading', 'listening'] as const) {
  test(`bài tổng hợp ${skill}: 4 phần × 10 câu, mỗi phần một dạng, câu nào cũng chấm được`, () => {
    assert.ok(mixableTypes(skill).length >= MIXED_PARTS, 'không đủ dạng để dựng bài tổng hợp');
    for (let seed = 1; seed <= 12; seed++) {
      const t = buildMixedTest(skill, seed)!;
      assert.equal(t.questions.length, MIXED_PARTS * MIXED_PER_PART);
      const parts = new Map<string, Set<string>>();
      for (const q of t.questions) {
        assert.ok(q.typeId && q.part, 'câu thiếu typeId/part');
        parts.set(q.part!, (parts.get(q.part!) ?? new Set()).add(q.typeId!));
        const opts = optionsOf(q.typeId!, t, q);
        if (opts) assert.ok(opts.includes(q.answer), `seed ${seed}: đáp án "${q.answer}" không thuộc phương án`);
        if (skill === 'listening') assert.ok(q.script && q.script.includes(':'), 'thiếu kịch bản nghe');
        else assert.ok(q.passage || q.context, 'thiếu bài đọc');
      }
      assert.equal(parts.size, MIXED_PARTS);
      for (const types of parts.values()) assert.equal(types.size, 1, 'một phần lẫn nhiều dạng');
      assert.equal(new Set([...parts.values()].map((s) => [...s][0])).size, MIXED_PARTS, 'hai phần cùng một dạng');
    }
  });
}

test('cùng seed dựng ra cùng bài, khác seed ra bài khác', () => {
  const a = buildMixedTest('reading', 7)!;
  const b = buildMixedTest('reading', 7)!;
  const c = buildMixedTest('reading', 8)!;
  assert.deepEqual(a.questions.map((q) => q.prompt), b.questions.map((q) => q.prompt));
  assert.notDeepEqual(a.questions.map((q) => q.prompt), c.questions.map((q) => q.prompt));
});
