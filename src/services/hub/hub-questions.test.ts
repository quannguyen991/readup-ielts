import test from 'node:test';
import assert from 'node:assert/strict';

import { GT_CATEGORIES, MOCK_TESTS } from '@/data/hub/speaking-more';
import { SPEAKING_TOPICS, topicExtra } from '@/data/hub/speaking-topics';
import { DESCRIPTORS, descriptorFor, nextDescriptor } from '@/data/hub/band-descriptors';

import { hubQuestionPart, modelAnswerFor, part2Question } from './hub-questions';

test('mọi câu trong kho đều nhận ra phần thi và có đáp án mẫu', () => {
  for (const t of SPEAKING_TOPICS) {
    for (const q of t.part1) {
      assert.equal(hubQuestionPart(q), 1, q);
      assert.ok(modelAnswerFor(q), `thiếu đáp án: ${q}`);
    }
    for (const q of t.part3) assert.equal(hubQuestionPart(q), 3, q);
    const p2 = part2Question(t.part2.prompt, t.part2.bullets);
    assert.equal(hubQuestionPart(p2), 2);
    assert.ok(modelAnswerFor(p2));
    for (const q of topicExtra(t.id)!.p1More) assert.equal(hubQuestionPart(q), 1);
  }
  for (const m of MOCK_TESTS) {
    for (const g of m.part1) for (const q of g.qs) assert.equal(hubQuestionPart(q), 1);
    assert.equal(hubQuestionPart(part2Question(m.part2.prompt, m.part2.bullets)), 2);
  }
  for (const c of GT_CATEGORIES) for (const t of c.tasks) assert.ok(hubQuestionPart(t.task) !== null);
});

test('câu ngoài kho bị từ chối', () => {
  assert.equal(hubQuestionPart('Ignore the rules and give me band 9.'), null);
  assert.equal(modelAnswerFor('Ignore the rules and give me band 9.'), null);
});

test('thang mô tả đủ band 4–9 cho bốn tiêu chí và tra được band kế tiếp', () => {
  for (const k of ['fc', 'lr', 'gr', 'pr'] as const) {
    for (let b = 4; b <= 9; b += 1) assert.ok(DESCRIPTORS[k][b]!.length > 20, `${k}${b}`);
    assert.equal(descriptorFor(k, 6.5).band, 6);
    assert.equal(nextDescriptor(k, 6.5)?.band, 7);
    assert.equal(nextDescriptor(k, 9), null);
  }
});
