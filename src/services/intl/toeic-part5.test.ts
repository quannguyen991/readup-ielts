import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPart5Set, isValidPart5Item, part5PoolSize } from './toeic-part5';

test('the Part 5 pool is large enough to vary practice sets', () => {
  assert.ok(part5PoolSize() >= 200, `pool has ${part5PoolSize()} items`);
});

test('every generated Part 5 item is valid: one correct answer, four distinct choices, one blank', () => {
  const all = buildPart5Set('audit', 1000);
  assert.equal(all.length, part5PoolSize());
  for (const item of all) {
    assert.ok(isValidPart5Item(item), `${item.id} is invalid`);
  }
});

test('Part 5 item ids are unique across the pool', () => {
  const ids = buildPart5Set('audit', 1000).map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('the same seed gives the same set, in the same order, with the same choices', () => {
  const a = buildPart5Set('seed-1', 10);
  const b = buildPart5Set('seed-1', 10);
  assert.deepEqual(a, b);
});

test('different seeds give different sets', () => {
  const a = buildPart5Set('seed-1', 10).map((i) => i.id).join('|');
  const b = buildPart5Set('seed-2', 10).map((i) => i.id).join('|');
  assert.notEqual(a, b);
});

test('each wrong choice carries an error tag, and the correct choice carries none', () => {
  for (const item of buildPart5Set('tags', 60)) {
    const correct = item.options.find((o) => o.correct);
    assert.equal(correct?.tag, null, `${item.id} correct tag`);
    for (const o of item.options.filter((x) => !x.correct)) {
      assert.notEqual(o.tag, null, `${item.id} wrong choice ${o.text} has no tag`);
    }
  }
});

test('every difficulty level has enough items for a full set', () => {
  for (const level of ['easy', 'medium', 'hard'] as const) {
    assert.ok(part5PoolSize(level) >= 10, `${level} pool has ${part5PoolSize(level)} items`);
    const set = buildPart5Set('lvl', 10, level);
    assert.equal(set.length, 10);
    for (const item of set) assert.equal(item.level, level, `${item.id} wrong level`);
  }
});

test('the hand-written bank adds hard and medium grammar items that the generator does not cover', () => {
  assert.ok(part5PoolSize('hard') >= 16, `hard pool has ${part5PoolSize('hard')} items`);
  assert.ok(part5PoolSize('medium') >= 55, `medium pool has ${part5PoolSize('medium')} items`);
  const bank = buildPart5Set('bank-check', 1000).filter((i) => i.id.startsWith('bank:'));
  assert.equal(bank.length, 17, 'every bank item is in the pool');
  for (const item of bank) assert.ok(isValidPart5Item(item), `${item.id} is invalid`);
});

test('every Part 5 item carries a question kind label', () => {
  for (const item of buildPart5Set('kinds', 1000)) {
    assert.ok(item.kind.vi.length > 0 && item.kind.en.length > 0, `${item.id} kind`);
  }
});
