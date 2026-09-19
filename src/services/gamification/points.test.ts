import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DAILY_POINT_CAP,
  currentStreak,
  dailyPoints,
  dateKey,
  daysUntilReset,
  lifetimePoints,
  monthPoints,
  nextTier,
  streakMultiplier,
  tierFor,
} from './points';

const day = (minutes: number, questions = 0) => ({ minutes, questions });

test('hệ số chuỗi tăng dần rồi chạm trần 2', () => {
  assert.equal(streakMultiplier(0), 1);
  assert.equal(streakMultiplier(3), 1.3);
  assert.equal(streakMultiplier(50), 2);
});

test('điểm ngày = (phút + nửa câu) × hệ số, và có trần', () => {
  assert.equal(dailyPoints(day(20, 10), 0), 25);
  assert.equal(dailyPoints(day(20, 10), 3), 33); // 25 × 1.3
  assert.equal(dailyPoints(day(600, 400), 10), DAILY_POINT_CAP);
  assert.equal(dailyPoints(undefined, 5), 0);
});

test('chuỗi chưa đứt khi HÔM NAY chưa học, chỉ đứt khi hôm qua cũng trống', () => {
  const today = new Date(2026, 8, 19);
  const daily = {
    [dateKey(new Date(2026, 8, 18))]: day(30),
    [dateKey(new Date(2026, 8, 17))]: day(20),
  };
  assert.equal(currentStreak(daily, today), 2);

  const gap = { [dateKey(new Date(2026, 8, 16))]: day(30) };
  assert.equal(currentStreak(gap, today), 0);
});

test('thẻ giữ chuỗi nối lại ngày trống', () => {
  const today = new Date(2026, 8, 19);
  const daily = {
    [dateKey(new Date(2026, 8, 19))]: day(10),
    [dateKey(new Date(2026, 8, 17))]: day(20),
  };
  assert.equal(currentStreak(daily, today), 1);
  assert.equal(currentStreak(daily, today, [dateKey(new Date(2026, 8, 18))]), 3);
});

test('điểm tháng chỉ cộng ngày trong tháng đó và không tính ngày tương lai', () => {
  const today = new Date(2026, 8, 19);
  const daily = {
    [dateKey(new Date(2026, 7, 31))]: day(60),
    [dateKey(new Date(2026, 8, 1))]: day(30),
    [dateKey(new Date(2026, 8, 19))]: day(30),
  };
  // 1/9 nối tiếp 31/8 nên hệ số chuỗi của nó là 1,1 → 33 điểm; 19/9 đứng một mình → 30.
  const september = monthPoints(daily, today);
  assert.equal(september, 63);
  assert.ok(lifetimePoints(daily) > september, 'điểm mọi thời phải gồm cả tháng trước');
});

test('bậc theo điểm tháng, có bậc kế tiếp cho tới đỉnh', () => {
  assert.equal(tierFor(0).name, 'Tân binh');
  assert.equal(tierFor(500).name, 'Bền bỉ');
  assert.equal(tierFor(99999).name, 'Thiên tài');
  assert.equal(nextTier(0)?.remaining, 150);
  assert.equal(nextTier(99999), null);
});

test('đếm ngược tới ngày bảng xếp hạng đặt lại', () => {
  assert.equal(daysUntilReset(new Date(2026, 8, 30)), 1);
  assert.equal(daysUntilReset(new Date(2026, 8, 19)), 12);
});
