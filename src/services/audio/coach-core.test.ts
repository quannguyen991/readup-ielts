import assert from 'node:assert/strict';
import { test } from 'node:test';

import { coachBand, pickPhrase, planCoach, wordsToFix, type CoachMemory } from './coach-core';

const sentence = 'The quick brown fox jumps over the lazy dog.';

test('mốc điểm: ≥ 85 khen, 60–84 sửa từ, < 60 chậm lại', () => {
  assert.equal(coachBand(85), 'good');
  assert.equal(coachBand(84), 'ok');
  assert.equal(coachBand(60), 'ok');
  assert.equal(coachBand(59), 'low');
});

test('khen thì không đọc mẫu và không mời đọc lại', () => {
  const plan = planCoach({ score: 92, missed: ['fox'], sentence });
  assert.equal(plan.band, 'good');
  assert.equal(plan.lines.length, 2);
  assert.ok(plan.lines.every((l) => l.rate === 1));
  assert.ok(!plan.lines.some((l) => /fox/.test(l.text)));
});

test('60–84: gọi tên tối đa hai từ, đọc từng từ chậm, rồi mời đọc lại', () => {
  const plan = planCoach({ score: 70, missed: ['jumps', 'lazy', 'dog'], near: ['over'], sentence });
  const slow = plan.lines.filter((l) => l.rate < 1);
  assert.deepEqual(
    slow.map((l) => l.text),
    ['jumps', 'lazy'],
  );
  const last = plan.lines.at(-1)!;
  assert.match(last.text, /again|try|turn|time/i);
  assert.equal(last.pauseMs, 0);
});

test('60–84 chỉ có từ gần đúng thì vẫn sửa từ đó; không có từ nào thì nói chung chung', () => {
  assert.deepEqual(wordsToFix([], ['over']), ['over']);
  const generic = planCoach({ score: 75, missed: [], near: [], sentence });
  assert.ok(generic.lines.every((l) => l.rate === 1));
});

test('< 60: chậm lại, đọc cả câu ở nhịp chậm, rồi mời đọc lại', () => {
  const plan = planCoach({ score: 30, missed: ['fox'], sentence });
  assert.equal(plan.band, 'low');
  const model = plan.lines.find((l) => l.text === sentence);
  assert.ok(model && model.rate < 0.7);
  assert.ok(plan.captionVi.length > 0 && plan.captionEn.length > 0);
});

test('không lặp câu vừa dùng của cùng một nhóm', () => {
  const mem: CoachMemory = {};
  const pool = ['a', 'b', 'c'];
  let prev = '';
  for (let i = 0; i < 60; i += 1) {
    const got = pickPhrase(pool, 'k', mem, Math.random);
    assert.notEqual(got, prev);
    prev = got;
  }
  assert.equal(pickPhrase(['only'], 'solo', mem), 'only');
});

test('từ rỗng hoặc không có chữ bị loại', () => {
  assert.deepEqual(wordsToFix(['', '123', ' Cat '], []), ['cat']);
});
