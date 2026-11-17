import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bumpStat, itemKey } from './learn-status';
import { buildToday, type PlanSet } from './today-plan';

const sets: PlanSet[] = [
  { id: 'a', title: 'A', level: 'A2', ids: ['a1', 'a2'], href: '/a' },
  { id: 'b', title: 'B', level: 'B1', ids: ['b1', 'b2'], href: '/b' },
  { id: 'c', title: 'C', level: 'C1', ids: ['c1', 'c2'], href: '/c' },
];
const at = '2026-11-17T00:00:00Z';

test('chưa làm gì: bài mới dễ nhất + thử thách, không có "tiếp tục"', () => {
  const plan = buildToday(sets, {}, 'dictation');
  assert.deepEqual(plan.map((p) => `${p.kind}:${p.set.id}`), ['fresh:a', 'challenge:b']);
});

test('có bài dở thì đứng đầu', () => {
  const stats = { [itemKey('dictation', 'b1')]: bumpStat(undefined, 1, true, at) };
  const plan = buildToday(sets, stats, 'dictation');
  assert.equal(plan[0]!.kind, 'continue');
  assert.equal(plan[0]!.set.id, 'b');
});

test('đã học hết bài dễ thì thử thách chuyển lên mức cao hơn', () => {
  const stats = {
    [itemKey('dictation', 'a1')]: bumpStat(undefined, 1, true, at),
    [itemKey('dictation', 'a2')]: bumpStat(undefined, 1, true, at),
  };
  const plan = buildToday(sets, stats, 'dictation');
  const kinds = plan.map((p) => `${p.kind}:${p.set.id}`);
  assert.ok(kinds.includes('fresh:b'));
  assert.ok(kinds.includes('challenge:c'));
});
