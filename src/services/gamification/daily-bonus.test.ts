import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DAILY_VOLUME_TIERS, dailyBonusStars, dailyMultiplier, unclaimedDailyTiers } from './daily-bonus';

test('hệ số chuỗi: 1× ban đầu, +0,5× mỗi tuần, trần 3×', () => {
  assert.equal(dailyMultiplier(0), 1);
  assert.equal(dailyMultiplier(6), 1);
  assert.equal(dailyMultiplier(7), 1.5);
  assert.equal(dailyMultiplier(14), 2);
  assert.equal(dailyMultiplier(100), 3);
});

test('mốc số từ trong ngày: chỉ tính mốc đã đạt và chưa nhận', () => {
  const day = '2026-10-25';
  assert.deepEqual(unclaimedDailyTiers(day, 19, {}), []);
  assert.deepEqual(unclaimedDailyTiers(day, 20, {}).map((t) => t.words), [20]);
  const prizes = { [`daily:${day}:20`]: 10 };
  assert.deepEqual(unclaimedDailyTiers(day, 60, prizes).map((t) => t.words), [50]);
  assert.deepEqual(unclaimedDailyTiers('2026-10-26', 20, prizes).map((t) => t.words), [20]);
});

test('sao ngày được nhân theo chuỗi và làm tròn', () => {
  const [t20] = DAILY_VOLUME_TIERS;
  assert.equal(dailyBonusStars([t20!], 0), 10);
  assert.equal(dailyBonusStars([t20!], 7), 15);
  assert.equal(dailyBonusStars([...DAILY_VOLUME_TIERS], 0), 95);
});
