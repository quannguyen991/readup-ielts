import test from 'node:test';
import assert from 'node:assert/strict';

import { GT_CATEGORIES, MOCK_TESTS, gtAsTopic, gtById, gtExtra, mockAsTopic, mockExtra } from './speaking-more';

test('24 đề thi thử, mỗi đề đủ ba Part và đáp án mẫu', () => {
  assert.equal(MOCK_TESTS.length, 24);
  assert.equal(new Set(MOCK_TESTS.map((m) => m.id)).size, 24);
  for (const m of MOCK_TESTS) {
    assert.equal(m.part1.length, 2, m.id);
    assert.ok(m.part1.every((g) => g.qs.length === 4), `Part 1 ${m.id}`);
    assert.match(m.part2.prompt, /^Describe /, m.id);
    assert.equal(m.part2.bullets.length, 4, m.id);
    assert.equal(m.part3.length, 5, m.id);
    const t = mockAsTopic(m);
    const e = mockExtra(m);
    assert.equal(t.part1.length, 8);
    assert.equal(e.p1.length, 8);
    assert.equal(e.p3.length, 5);
    assert.ok(e.p1.every((x) => x.a.length > 20), `đáp án Part 1 ${m.id}`);
  }
});

test('10 nhóm giao tiếp, mỗi nhóm 5 đề đủ ý bắt buộc, mẫu câu và bài mẫu', () => {
  assert.equal(GT_CATEGORIES.length, 10);
  const ids = new Set<string>();
  for (const c of GT_CATEGORIES) {
    assert.equal(c.tasks.length, 5, c.id);
    for (const t of c.tasks) {
      assert.ok(!ids.has(t.id), `trùng id ${t.id}`);
      ids.add(t.id);
      assert.equal(t.mustVi.length, 3, t.id);
      assert.equal(t.phrases.length, 6, t.id);
      assert.ok(t.sample.split(/\s+/).length >= 55, `bài mẫu ${t.id}`);
      assert.equal(gtAsTopic(t).part1[0], t.task);
      assert.equal(gtExtra(t).vocab.length, 6);
      assert.equal(gtById(t.id)?.task.id, t.id);
    }
  }
});
