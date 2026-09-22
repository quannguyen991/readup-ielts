import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MATH_SKILL_DOMAIN } from '@/lib/math/types';
import {
  BANK_PER_SKILL,
  DOMAIN_SHARE,
  MATH_BANK_TOTAL,
  MATH_SKILLS,
  ROUND_SIZE,
  bankProgress,
  bankRoundId,
  bankRoundItems,
  roundsFor,
} from './bank';

test('cỡ kho mỗi mảng bám tỉ trọng chính thức của đề (lệch không quá 5 điểm %)', () => {
  for (const [domain, share] of Object.entries(DOMAIN_SHARE)) {
    const inDomain = MATH_SKILLS.filter((k) => MATH_SKILL_DOMAIN[k] === domain);
    const total = inDomain.reduce((s, k) => s + BANK_PER_SKILL[k], 0);
    assert.ok(Math.abs(total / MATH_BANK_TOTAL - share) <= 0.05, `${domain}: ${total}/${MATH_BANK_TOTAL}`);
  }
});

test('kỹ năng không còn cùng một cỡ: Advanced Math nhiều câu hơn Probability', () => {
  assert.ok(BANK_PER_SKILL.nonlinear_functions > BANK_PER_SKILL.probability);
  for (const k of MATH_SKILLS) assert.equal(BANK_PER_SKILL[k] % ROUND_SIZE, 0, k);
});

test('một lượt luôn ra đúng các câu ấy — kho cố định, không bốc ngẫu nhiên', () => {
  const a = bankRoundItems('circles', 1).map((q) => q.stem);
  const b = bankRoundItems('circles', 1).map((q) => q.stem);
  assert.deepEqual(a, b);
  assert.equal(a.length, ROUND_SIZE);
  assert.notDeepEqual(a, bankRoundItems('circles', 0).map((q) => q.stem));
});

test('tiến độ đếm câu khác nhau theo lượt, và chỉ tới lượt chưa làm', () => {
  const k = 'linear_functions' as const;
  const p = bankProgress([
    { setId: bankRoundId(k, 0) },
    { setId: bankRoundId(k, 0) },
    { setId: bankRoundId(k, 2) },
    { setId: 'u1-warmup' },
    { setId: null },
  ]);
  assert.equal(p[k].answered, 2 * ROUND_SIZE);
  assert.equal(p[k].nextRound, 1);
  assert.equal(p.circles.answered, 0);
});

test('làm hết mọi lượt thì quay lại lượt đầu', () => {
  const k = 'probability' as const;
  const all = Array.from({ length: roundsFor(k) }, (_, r) => ({ setId: bankRoundId(k, r) }));
  const p = bankProgress(all);
  assert.equal(p[k].answered, BANK_PER_SKILL[k]);
  assert.equal(p[k].nextRound, 0);
});
