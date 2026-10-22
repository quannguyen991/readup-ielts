import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ACHIEVEMENTS, XP_PER_LEVEL, evaluateAchievements, levelOf, xpOf, type HubStats } from './achievements';

const EMPTY: HubStats = { lessonsDone: 0, lessonsTotal: 24, scenariosDone: 0, tasksDone: 0, streak: 0, phonemeBest: {} };

test('XP cộng từ bài học, tình huống và nhiệm vụ', () => {
  assert.equal(xpOf(EMPTY), 0);
  assert.equal(xpOf({ ...EMPTY, lessonsDone: 2, scenariosDone: 1, tasksDone: 3 }), 2 * 20 + 15 + 3 * 10);
});

test('cấp bắt đầu từ 1, cứ đủ 100 XP lên một cấp', () => {
  assert.deepEqual(levelOf(0), { level: 1, into: 0, need: XP_PER_LEVEL, ratio: 0 });
  assert.equal(levelOf(99).level, 1);
  assert.equal(levelOf(100).level, 2);
  assert.equal(levelOf(150).into, 50);
  assert.equal(levelOf(150).ratio, 0.5);
});

test('huy hiệu mở khoá đúng mốc, không mở sớm', () => {
  const none = evaluateAchievements(EMPTY);
  assert.ok(none.every((a) => !a.unlocked));
  const first = evaluateAchievements({ ...EMPTY, lessonsDone: 1 }).find((a) => a.id === 'first-lesson')!;
  assert.equal(first.unlocked, true);
  const streak6 = evaluateAchievements({ ...EMPTY, streak: 6 }).find((a) => a.id === 'streak-7')!;
  assert.equal(streak6.unlocked, false);
  assert.equal(streak6.progress, 6);
  assert.equal(evaluateAchievements({ ...EMPTY, streak: 7 }).find((a) => a.id === 'streak-7')!.unlocked, true);
});

test('bậc thầy ngữ pháp chỉ mở khi học hết toàn bộ bài', () => {
  assert.equal(evaluateAchievements({ ...EMPTY, lessonsDone: 23 }).find((a) => a.id === 'grammar-master')!.unlocked, false);
  assert.equal(evaluateAchievements({ ...EMPTY, lessonsDone: 24 }).find((a) => a.id === 'grammar-master')!.unlocked, true);
});

test('tiến độ không vượt mốc, và mỗi huy hiệu có ảnh riêng', () => {
  for (const a of evaluateAchievements({ ...EMPTY, streak: 500, scenariosDone: 99 })) assert.ok(a.progress <= a.goal, a.id);
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.art)).size, ACHIEVEMENTS.length);
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
});

test('mỗi huy hiệu đều có file ảnh trong public/badges', async () => {
  const { existsSync } = await import('node:fs');
  const path = await import('node:path');
  const root = path.resolve(import.meta.dirname, '..', '..', '..', 'public', 'badges');
  assert.ok(ACHIEVEMENTS.length >= 21);
  for (const a of ACHIEVEMENTS) assert.ok(existsSync(path.join(root, `${a.art}.png`)), `thiếu ${a.art}.png`);
});
