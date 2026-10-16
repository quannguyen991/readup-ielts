import test from 'node:test';
import assert from 'node:assert/strict';

import { BOOKS } from './catalog';
import { GIFT_FIRST_BOOK, GIFT_LESSON_GOAL, GIFT_QUEST_GOAL, fullSetUnlocked, giftProgress } from './gift';

test('cuốn quà là một cuốn có thật trong tủ', () => {
  assert.ok(BOOKS.some((b) => b.id === GIFT_FIRST_BOOK));
});

test('chưa đủ ngưỡng thì chưa mở, tỉ lệ lấy phần thấp hơn', () => {
  const p = giftProgress(GIFT_QUEST_GOAL, 0);
  assert.equal(p.unlocked, false);
  assert.equal(p.ratio, 0);
  const half = giftProgress(GIFT_QUEST_GOAL / 2, GIFT_LESSON_GOAL);
  assert.equal(half.ratio, 0.5);
});

test('đủ cả hai ngưỡng mới mở', () => {
  assert.equal(giftProgress(GIFT_QUEST_GOAL, GIFT_LESSON_GOAL).unlocked, true);
});

test('số không hợp lệ coi như 0', () => {
  const p = giftProgress(Number.NaN, -3);
  assert.equal(p.questsDone, 0);
  assert.equal(p.lessonsDone, 0);
});

test('mở toàn bộ cần đã đăng ký', () => {
  assert.equal(fullSetUnlocked(false, GIFT_QUEST_GOAL, GIFT_LESSON_GOAL), false);
  assert.equal(fullSetUnlocked(true, GIFT_QUEST_GOAL, GIFT_LESSON_GOAL), true);
});
