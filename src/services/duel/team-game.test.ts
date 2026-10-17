import assert from 'node:assert/strict';
import { test } from 'node:test';

import { scoreTeamAnswer, teamWinners } from './team-game';

test('sai không đổi điểm; đúng nhận điểm nền', () => {
  assert.deepEqual(scoreTeamAnswer([80, 120], 0, false, 'double').scores, [80, 120]);
  assert.equal(scoreTeamAnswer([80, 120], 0, true, null).earned, 100);
  assert.deepEqual(scoreTeamAnswer([80, 120], 0, true, null).scores, [180, 120]);
});

test('bonus nhân đôi và nhật thực được áp dụng một lần', () => {
  assert.deepEqual(scoreTeamAnswer([0, 250, 40], 0, true, 'double').scores, [200, 250, 40]);
  const eclipse = scoreTeamAnswer([0, 250, 40], 0, true, 'eclipse');
  assert.deepEqual(eclipse.scores, [125, 225, 40]);
  assert.equal(eclipse.earned, 125);
});

test('bụi sao thưởng cho tất cả đội và tìm đúng các đội đồng hạng', () => {
  assert.deepEqual(scoreTeamAnswer([0, 50, 30], 1, true, 'stardust').scores, [10, 150, 40]);
  assert.deepEqual(teamWinners([150, 225, 225, 180]), [1, 2]);
  assert.deepEqual(teamWinners([]), []);
});
