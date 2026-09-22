import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BANK_PER_SKILL, MATH_BANK_TOTAL, MATH_SKILLS, answeredInBank } from './bank';

test('kỹ năng nào cũng có câu trong kho', () => {
  for (const k of MATH_SKILLS) assert.ok(BANK_PER_SKILL[k] > 0, k);
  assert.equal(MATH_BANK_TOTAL, MATH_SKILLS.reduce((s, k) => s + BANK_PER_SKILL[k], 0));
});

test('làm nhiều lượt hơn cỡ kho thì "đã làm" dừng ở cỡ kho', () => {
  const k = MATH_SKILLS[0]!;
  assert.equal(answeredInBank(k, { total: 5 }), 5);
  assert.equal(answeredInBank(k, { total: 10_000 }), BANK_PER_SKILL[k]);
});
