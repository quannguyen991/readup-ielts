import assert from 'node:assert/strict';
import { test } from 'node:test';

import { streakTierItem, streakTierStars } from './streak-tiers';

test('mốc không phải bội của 5 không thưởng gì', () => {
  for (const n of [0, 1, 4, 6, 9, 11]) {
    assert.equal(streakTierStars(n), 0);
    assert.equal(streakTierItem(n), null);
  }
});

test('sao tăng dần theo mốc 5, 10, 15, 20, và vẫn tăng sau 20', () => {
  assert.deepEqual([5, 10, 15, 20, 25, 30].map(streakTierStars), [5, 15, 30, 50, 70, 90]);
  for (let n = 25; n <= 100; n += 5) assert.ok(streakTierStars(n) > streakTierStars(n - 5));
});

test('mốc chẵn có món kho đồ, mốc lẻ thì không', () => {
  assert.equal(streakTierItem(5), null);
  assert.equal(streakTierItem(15), null);
  assert.equal(streakTierItem(10), 'potion');
  assert.equal(streakTierItem(20), 'hint');
  assert.equal(streakTierItem(30), 'shield');
  assert.equal(streakTierItem(40), 'double');
  assert.equal(streakTierItem(50), 'potion');
});
