import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SAT_MATH_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { dropOldMathQuiz, remapTopicStudy } from './sat-slug-migration';

const foundations = SAT_MATH_VOCAB_LESSONS[0]!;
const algebra = SAT_MATH_VOCAB_LESSONS[1]!;

test('tiến độ theo từ dời sang bài mới đang chứa từ đó, không mất', () => {
  // Bản cũ: "coefficient" (Đại số) nằm dưới sat-math-bai-3; "remainder" (Số học) dưới sat-math-bai-2.
  const input: Parameters<typeof remapTopicStudy>[0] = {
    stages: { 'sat-math-bai-3': { coefficient: 2 }, 'sat-math-bai-2': { remainder: 1, sum: 2 }, 'topic-ielts-1': { apple: 1 } },
    lapses: { 'sat-math-bai-2': { remainder: 2 } },
    starred: { 'sat-math-bai-3': ['coefficient'] },
  };
  const p = remapTopicStudy(input);
  assert.equal(foundations.slug, 'sat-math-bai-1');
  assert.equal(p.stages![algebra.slug]!.coefficient, 2);
  assert.equal(p.stages![foundations.slug]!.remainder, 1);
  assert.equal(p.stages!['topic-ielts-1']!.apple, 1);
  assert.deepEqual(p.starred![algebra.slug], ['coefficient']);
  assert.equal(p.lapses![foundations.slug]!.remainder, 2);
  // Chạy lại không đổi gì.
  assert.deepEqual(remapTopicStudy(p), p);
});

test('điểm bài Math làm trước mốc đổi thì bỏ, sau mốc thì giữ', () => {
  const best = dropOldMathQuiz({
    'sat-math-bai-7:1': { score: 7, total: 7, at: '2026-09-27T10:00:00.000Z' },
    'sat-math-bai-1:2': { score: 30, total: 32, at: '2026-10-02T10:00:00.000Z' },
    'sat-verbal-bai-1:1': { score: 7, total: 7, at: '2026-09-27T10:00:00.000Z' },
  });
  assert.deepEqual(Object.keys(best).sort(), ['sat-math-bai-1:2', 'sat-verbal-bai-1:1']);
});

test('bản lưu trống không sinh ra trường undefined (không đè giá trị mặc định lúc gộp)', () => {
  const p = remapTopicStudy({});
  assert.deepEqual(Object.keys(p), []);
  const merged = { stages: {}, lapses: {}, starred: {}, scores: {}, ...p };
  assert.deepEqual(merged.stages, {});
});
