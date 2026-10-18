import { test } from 'node:test';
import assert from 'node:assert/strict';

import { currentStreak, dateKey, isActiveDay, longestStreak, shiftDays } from './points';
import {
  nextStreakMilestone,
  STREAK_MILESTONES,
  streakBonusTotal,
  streakPrizeKey,
  unclaimedMilestones,
} from './streak-rewards';

const day = (minutes: number, questions = 0, extra: { wordsReviewed?: number; events?: number } = {}) => ({
  minutes,
  questions,
  ...extra,
});

test('một việc đã hoàn thành (không phút, không câu) vẫn tính là ngày học', () => {
  assert.equal(isActiveDay(day(0, 0, { events: 1 })), true);
  assert.equal(isActiveDay(day(0, 0, { wordsReviewed: 2 })), true);
  assert.equal(isActiveDay(day(0, 0)), false);
  assert.equal(isActiveDay(undefined), false);
  // Ngày cũ không có trường mới vẫn đọc được.
  assert.equal(isActiveDay({ minutes: 5, questions: 0 }), true);
});

test('chuỗi hiện tại đếm ngày có việc, kể cả ngày chỉ có việc đã xong', () => {
  const today = new Date(2026, 9, 18);
  const daily = {
    [dateKey(new Date(2026, 9, 18))]: day(0, 0, { events: 1 }),
    [dateKey(new Date(2026, 9, 17))]: day(0, 0, { events: 2 }),
    [dateKey(new Date(2026, 9, 16))]: day(3),
  };
  assert.equal(currentStreak(daily, today), 3);
});

test('hôm nay chưa học thì chuỗi còn theo hôm qua; hai ngày trống liền thì đứt', () => {
  const today = new Date(2026, 9, 18);
  assert.equal(currentStreak({ [dateKey(new Date(2026, 9, 17))]: day(5) }, today), 1);
  assert.equal(currentStreak({ [dateKey(new Date(2026, 9, 16))]: day(5) }, today), 0);
});

test('chuỗi dài nhất tìm trong cả nhật ký, không phụ thuộc hôm nay', () => {
  const daily = {
    [dateKey(new Date(2026, 0, 1))]: day(1),
    [dateKey(new Date(2026, 0, 2))]: day(1),
    [dateKey(new Date(2026, 0, 3))]: day(1),
    [dateKey(new Date(2026, 0, 10))]: day(1),
    [dateKey(new Date(2026, 0, 11))]: day(1),
  };
  assert.equal(longestStreak(daily), 3);
  assert.equal(longestStreak({}), 0);
});

test('ngày đông băng nối chuỗi dài nhất như ngày đã học', () => {
  const daily = {
    [dateKey(new Date(2026, 0, 1))]: day(1),
    [dateKey(new Date(2026, 0, 3))]: day(1),
  };
  assert.equal(longestStreak(daily, [dateKey(new Date(2026, 0, 2))]), 3);
  const today = new Date(2026, 0, 3);
  assert.equal(currentStreak(daily, today, [dateKey(new Date(2026, 0, 2))]), 3);
});

test('chuỗi qua mốc năm vẫn đúng (không lệch do độ dài tháng)', () => {
  const daily = {
    [dateKey(new Date(2025, 11, 31))]: day(1),
    [dateKey(new Date(2026, 0, 1))]: day(1),
    [dateKey(new Date(2026, 0, 2))]: day(1),
  };
  assert.equal(longestStreak(daily), 3);
  assert.equal(currentStreak(daily, new Date(2026, 0, 2)), 3);
  assert.equal(dateKey(shiftDays(new Date(2026, 0, 1), -1)), '2025-12-31');
});

test('mốc thưởng: chỉ mốc đã đạt và chưa ghi sao mới được cộng', () => {
  assert.deepEqual(unclaimedMilestones(7, {}).map((m) => m.days), [3, 7]);
  assert.deepEqual(unclaimedMilestones(7, { [streakPrizeKey(3)]: 10 }).map((m) => m.days), [7]);
  assert.deepEqual(unclaimedMilestones(2, {}), []);
});

test('tổng thưởng chuỗi chỉ cộng khoá streak:, không lẫn thưởng hạng tháng', () => {
  assert.equal(streakBonusTotal({ [streakPrizeKey(3)]: 10, [streakPrizeKey(7)]: 30, '2026-10': 200 }), 40);
  assert.equal(streakBonusTotal(undefined), 0);
});

test('mốc kế tiếp và số ngày còn thiếu', () => {
  assert.deepEqual(nextStreakMilestone(5)?.milestone, STREAK_MILESTONES[1]);
  assert.equal(nextStreakMilestone(5)?.remaining, 2);
  assert.equal(nextStreakMilestone(500), null);
});
