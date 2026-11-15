import assert from 'node:assert/strict';
import { test } from 'node:test';

import { HSA_QUESTION_BANK } from '@/data/hsa-bank';
import { CRITERIA, KIND_CRITERION } from './criteria';
import { buildPlacement, placementActivity, placementIdOf } from './placement';

const sections = buildPlacement(HSA_QUESTION_BANK);

test('bài test đầu vào có năm phần, mỗi phần một tiêu chí, theo đúng thứ tự tiêu chí', () => {
  assert.deepEqual(sections.map((s) => s.id), CRITERIA.map((c) => c.id));
});

test('mỗi phần có 5–6 câu thuộc đúng tiêu chí của phần đó và không câu nào lặp giữa các phần', () => {
  const seen = new Set<string>();
  for (const s of sections) {
    assert.ok(s.questions.length >= 5 && s.questions.length <= 6, `${s.id}: ${s.questions.length} câu`);
    for (const q of s.questions) {
      assert.equal(KIND_CRITERION[q.kind], s.id, `${q.id} không thuộc ${s.id}`);
      assert.ok(!seen.has(q.id), `${q.id} lặp`);
      seen.add(q.id);
    }
  }
});

test('phần Đọc hiểu giữ nguyên chùm năm câu chung một bài đọc', () => {
  const reading = sections.find((s) => s.id === 'reading')!;
  const clustered = reading.questions.filter((q) => q.kind === 'reading-comprehension');
  assert.equal(clustered.length, 5);
  assert.equal(new Set(clustered.map((q) => q.context)).size, 1);
});

test('chọn cố định: gọi hai lần ra cùng bộ câu', () => {
  const again = buildPlacement(HSA_QUESTION_BANK);
  assert.deepEqual(again.map((s) => s.questions.map((q) => q.id)), sections.map((s) => s.questions.map((q) => q.id)));
});

test('có câu mức thấp trong phần nào còn câu mức thấp để lấy', () => {
  for (const s of sections.filter((x) => x.id !== 'reading')) {
    const hasLow = HSA_QUESTION_BANK.some((q) => KIND_CRITERION[q.kind] === s.id && (q.level === 'A2' || q.level === 'B1'));
    if (hasLow) assert.ok(s.questions.some((q) => q.level === 'A2' || q.level === 'B1'), `${s.id} thiếu câu mức thấp`);
  }
});

test('mã hoạt động đọc ngược được và từ chối mã lạ', () => {
  assert.equal(placementIdOf(placementActivity('vocab')), 'vocab');
  assert.equal(placementIdOf('placement:khac'), null);
  assert.equal(placementIdOf('practice:cloze'), null);
});
