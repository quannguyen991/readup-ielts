import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MATH_ERROR_LABEL } from '@/lib/math/types';
import { buildErrorProfile, shortTitle } from './profile';

const NOW = Date.parse('2026-09-23T12:00:00Z');
const ago = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

test('tên ngắn lấy phần đầu của nhãn lỗi', () => {
  assert.equal(shortTitle(MATH_ERROR_LABEL.sign_flip), 'Sai dấu');
  assert.equal(shortTitle(MATH_ERROR_LABEL.forgot_distribute), 'Quên nhân phân phối');
  for (const label of Object.values(MATH_ERROR_LABEL)) assert.ok(shortTitle(label).length < label.length || label.length < 40);
});

test('gom lỗi ba nguồn, xu hướng 7 ngày, lỗi nóng lên trước, có đường sửa', () => {
  const profile = buildErrorProfile({
    mathSessions: [
      {
        finishedAt: ago(1),
        attempts: [
          { skill: 'linear_inequalities', isCorrect: false, errorTag: 'forgot_flip_inequality' },
          { skill: 'linear_inequalities', isCorrect: false, errorTag: 'forgot_flip_inequality' },
          { skill: 'percentages', isCorrect: true, errorTag: null },
        ],
      },
      { finishedAt: ago(10), attempts: [{ skill: 'percentages', isCorrect: false, errorTag: 'percent_of_wrong_base' }] },
    ],
    rwAttempts: { q1: { correct: false, at: ago(2) }, q2: { correct: true, at: ago(2) } },
    rwQuestions: [
      { id: 'q1', skill: 'transition' },
      { id: 'q2', skill: 'transition' },
    ],
    rwSkillLabel: { transition: 'Từ nối' },
    vocabLog: [
      { kind: 'double_letter', word: 'accommodate', slug: 'education', at: ago(3) },
      { kind: 'double_letter', word: 'occurrence', slug: 'education', at: ago(12) },
    ],
    now: NOW,
  });

  const byId = new Map(profile.map((p) => [p.id, p]));
  const flip = byId.get('math:forgot_flip_inequality')!;
  assert.equal(flip.last7, 2);
  assert.equal(flip.trend, 'new');
  assert.equal(flip.fix.href, '/math/learn/linear_inequalities');
  assert.equal(profile[0]!.id, 'math:forgot_flip_inequality', 'lỗi nhiều nhất 7 ngày qua đứng đầu');

  const pct = byId.get('math:percent_of_wrong_base')!;
  assert.equal(pct.last7, 0);
  assert.equal(pct.prev7, 1);
  assert.equal(pct.trend, 'down');

  const tr = byId.get('verbal:transition')!;
  assert.equal(tr.total, 1, 'câu làm đúng không tính');
  assert.equal(tr.fix.href, '/sat-rw/learn/transition');

  const dl = byId.get('vocab:double_letter')!;
  assert.equal(dl.trend, 'flat');
  assert.equal(dl.example, 'accommodate', 'ví dụ là lần mắc gần nhất');
  assert.equal(dl.fix.href, '/vocabulary/topic/education/learn');
});

test('chưa có dữ liệu thì hồ sơ rỗng', () => {
  assert.deepEqual(
    buildErrorProfile({ mathSessions: [], rwAttempts: {}, rwQuestions: [], rwSkillLabel: {}, vocabLog: [], now: NOW }),
    [],
  );
});
