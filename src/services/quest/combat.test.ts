import { test } from 'node:test';
import assert from 'node:assert/strict';

import { resolveCombatAnswer, starsForAccuracy, xpForBattle } from './combat';

test('đúng thì gây damage và tăng combo', () => {
  const result = resolveCombatAnswer({ isCorrect: true, combo: 1, playerHp: 100, enemyHp: 100, enemyMaxHp: 100 });
  assert.equal(result.combo, 2);
  assert.equal(result.damage, 26);
  assert.equal(result.enemyDamage, 0);
  assert.equal(result.enemyHp, 74);
});

test('sai thì quái phản công và combo về 0', () => {
  const result = resolveCombatAnswer({ isCorrect: false, combo: 4, playerHp: 100, enemyHp: 100, enemyMaxHp: 100 });
  assert.equal(result.combo, 0);
  assert.equal(result.damage, 0);
  assert.equal(result.enemyDamage, 7);
  assert.equal(result.playerHp, 93);
});

test('damage và HP không âm, boss có thể bị hạ', () => {
  const result = resolveCombatAnswer({ isCorrect: true, combo: 5, playerHp: 2, enemyHp: 10, enemyMaxHp: 260 });
  assert.equal(result.enemyHp, 0);
  assert.equal(result.playerHp, 2);
  assert.equal(result.defeated, true);
});

test('xếp sao theo độ chính xác', () => {
  assert.equal(starsForAccuracy(9, 10), 3);
  assert.equal(starsForAccuracy(7, 10), 2);
  assert.equal(starsForAccuracy(6, 10), 1);
  assert.equal(xpForBattle(8, 10, 3), 285);
});
