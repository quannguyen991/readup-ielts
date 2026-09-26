import assert from 'node:assert/strict';
import { test } from 'node:test';

import { demoLeaderboard } from './demo-board';

test('bảng minh hoạ: cùng ngày ra cùng bảng, xếp đúng thứ tự, mã id có tiền tố demo-', () => {
  const a = demoLeaderboard('2026-09-26', '2026-08');
  const b = demoLeaderboard('2026-09-26', '2026-08');
  assert.deepEqual(a, b);
  assert.equal(a.board.length, 20);
  for (let i = 1; i < a.board.length; i++) assert.ok(a.board[i - 1]!.points >= a.board[i]!.points);
  for (let i = 1; i < a.golden.board.length; i++) assert.ok(a.golden.board[i - 1]!.stars >= a.golden.board[i]!.stars);
  assert.equal(new Set(a.board.map((r) => r.name)).size, a.board.length, 'trùng tên');
  for (const r of [...a.board, ...a.previous.board, ...a.golden.board]) assert.ok(r.id.startsWith('demo-'));
  assert.equal(a.previous.month, '2026-08');
  assert.equal(a.golden.day, '2026-09-26');
});

test('số liệu nằm trong khoảng một học sinh thật đạt được', () => {
  const a = demoLeaderboard('2026-09-26', '2026-08');
  for (const r of a.board) assert.ok(r.streak >= 1 && r.streak <= 26, `chuỗi ${r.streak} ngày vượt số ngày của tháng`);
  for (const r of a.golden.board) assert.ok(r.correct <= 60 && r.vocab <= 80);
});
