import test from 'node:test';
import assert from 'node:assert/strict';

import { BOOKS, type BookId } from './catalog';
import { BOOK_REQUIREMENTS, GIFT_FIRST_BOOK, bookGap, bookUnlocked, cleanCount, unlockedBooks } from './gift';

test('cuốn quà là một cuốn có thật trong tủ', () => {
  assert.ok(BOOKS.some((b) => b.id === GIFT_FIRST_BOOK));
});

test('mỗi cuốn trong tủ đều có chỉ tiêu, không sót cuốn nào', () => {
  for (const b of BOOKS) assert.ok(BOOK_REQUIREMENTS[b.id as BookId], `thiếu chỉ tiêu cho ${b.id}`);
});

test('chỉ tiêu tăng dần theo thứ tự mở, cuốn quà mở ngay', () => {
  assert.deepEqual(BOOK_REQUIREMENTS[GIFT_FIRST_BOOK], { quests: 0, lessons: 0 });
  const order = BOOKS.map((b) => BOOK_REQUIREMENTS[b.id as BookId].quests);
  for (let i = 1; i < order.length; i++) assert.ok((order[i] ?? 0) >= (order[i - 1] ?? 0), 'chỉ tiêu nhiệm vụ phải không giảm');
});

test('thiếu một trong hai chỉ tiêu thì chưa mở', () => {
  assert.equal(bookUnlocked('ielts-listening', { quests: 2, lessons: 1 }), false);
  assert.equal(bookUnlocked('ielts-listening', { quests: 1, lessons: 2 }), false);
  assert.equal(bookUnlocked('ielts-listening', { quests: 2, lessons: 2 }), true);
});

test('đủ chỉ tiêu thì mở, vượt chỉ tiêu vẫn mở', () => {
  assert.equal(bookUnlocked('bilingual', { quests: 25, lessons: 25 }), true);
  assert.equal(bookUnlocked('bilingual', { quests: 99, lessons: 99 }), true);
});

test('mở dần: tiến độ tăng thì danh sách mở cũng tăng', () => {
  assert.deepEqual(unlockedBooks({ quests: 0, lessons: 0 }), [GIFT_FIRST_BOOK]);
  const mid = unlockedBooks({ quests: 6, lessons: 6 });
  assert.ok(mid.includes('ielts-task1'));
  assert.ok(!mid.includes('ielts-task2'));
  assert.equal(unlockedBooks({ quests: 25, lessons: 25 }).length, BOOKS.length);
});

test('số đếm không hợp lệ coi như 0', () => {
  assert.equal(cleanCount(Number.NaN), 0);
  assert.equal(cleanCount(-3), 0);
  assert.equal(cleanCount('5'), 0);
  assert.equal(bookUnlocked('ielts-listening', { quests: Number.NaN, lessons: -3 }), false);
});

test('bookGap cho biết còn thiếu bao nhiêu', () => {
  assert.deepEqual(bookGap('ielts-task1', { quests: 4, lessons: 6 }), { quests: 2, lessons: 0 });
  assert.deepEqual(bookGap('ielts-task1', { quests: 10, lessons: 10 }), { quests: 0, lessons: 0 });
});
