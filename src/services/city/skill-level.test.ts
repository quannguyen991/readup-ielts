import test from 'node:test';
import assert from 'node:assert/strict';

import { skillLevel, skillValue, SKILL_LADDER } from './skill-level';

const EMPTY = { wordStatus: {}, dictationTotals: [], readingSessions: 0, readingProgress: [], xp: 0 };

test('chưa có dữ liệu → null (giao diện hiện "—"), không bịa số', () => {
  for (const m of Object.keys(SKILL_LADDER) as (keyof typeof SKILL_LADDER)[]) assert.equal(skillLevel(m, skillValue(m, EMPTY)), null);
});

test('cấp đi theo mốc thật', () => {
  assert.deepEqual(skillLevel('vocab', 4), { metric: 'vocab', value: 4, level: 0, nextAt: 5 });
  assert.deepEqual(skillLevel('vocab', 5), { metric: 'vocab', value: 5, level: 1, nextAt: 20 });
  assert.equal(skillLevel('vocab', 5000)!.nextAt, null);
});

test('số đo lấy đúng nguồn', () => {
  const src = {
    wordStatus: { a: { status: 'known' }, b: { status: 'learning' }, c: { status: 'known' } },
    dictationTotals: [10, 12],
    readingSessions: 3,
    readingProgress: [100, 95, 40],
    xp: 250,
  };
  assert.equal(skillValue('vocab', src), 2);
  assert.equal(skillValue('listening', src), 22);
  assert.equal(skillValue('reading', src), 3);
  assert.equal(skillValue('library', src), 2);
  assert.equal(skillValue('overall', src), 250);
});
