import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BOARD_LIMIT, TOP_SHOWN, monthScore, myStanding, parseBoard, rankMonth } from './leaderboard';

const led = (m: string, ...pts: number[]) => Object.fromEntries(pts.map((p, i) => [`pp:${m}-0${i + 1}:ans:${i}`, p]));

test('điểm tháng: chỉ cộng khoản của tháng đó, bỏ khoản bịa (quá lớn, âm, không phải số)', () => {
  const ledger = { ...led('2026-10', 3, 5), ...led('2026-09', 40), 'pp:2026-10-09:x:y': 9999, 'pp:2026-10-10:x:z': -4, 'pp:2026-10-11:x:w': 'a', 'tk:welcome': 2 };
  assert.equal(monthScore(ledger, '2026-10'), 8);
  assert.equal(monthScore(ledger, '2026-09'), 40);
});

test('điểm tháng: dữ liệu hỏng không làm sập', () => {
  assert.equal(monthScore(null, '2026-10'), 0);
  assert.equal(monthScore([], '2026-10'), 0);
  assert.equal(monthScore('x', '2026-10'), 0);
  assert.equal(monthScore(undefined, '2026-10'), 0);
});

test('xếp hạng: điểm cao trước, hòa theo mã, bỏ người 0 điểm, có trần số dòng', () => {
  const rows = [
    { userId: 'b', ledger: led('2026-10', 5) },
    { userId: 'a', ledger: led('2026-10', 5) },
    { userId: 'c', ledger: led('2026-10', 9) },
    { userId: 'd', ledger: led('2026-09', 9) },
    { userId: 'e', ledger: null },
  ];
  assert.deepEqual(rankMonth(rows, '2026-10').map((r) => r.userId), ['c', 'a', 'b']);
  const many = Array.from({ length: BOARD_LIMIT + 20 }, (_, i) => ({ userId: `u${String(i).padStart(3, '0')}`, ledger: led('2026-10', 1 + (i % 7)) }));
  assert.equal(rankMonth(many, '2026-10').length, BOARD_LIMIT);
  assert.deepEqual(rankMonth([], '2026-10'), []);
});

test('phản hồi máy chủ: dạng sai ra null (giao diện hiện trạng thái trống); dòng hỏng bị bỏ', () => {
  assert.equal(parseBoard(null), null);
  assert.equal(parseBoard({ error: 'x' }), null);
  assert.equal(parseBoard({ month: '2026-10', board: 'a' }), null);
  const b = parseBoard({ month: '2026-10', board: [{ id: 'a', name: 'An', points: 5 }, { id: 1 }, null, { id: 'b', name: 'Bình', points: Number.NaN }] });
  assert.deepEqual(b, { month: '2026-10', board: [{ id: 'a', name: 'An', points: 5 }] });
});

test('vị trí của mình: trong bảng thì có hạng; ngoài bảng thì chỉ có điểm; chưa đăng nhập thì không hạng', () => {
  const board = Array.from({ length: 15 }, (_, i) => ({ id: `id${i}`, name: `N${i}`, points: 100 - i }));
  assert.deepEqual(myStanding(board, 'id2', 0), { rank: 3, points: 98, inTop: true });
  const low = myStanding(board, 'id12', 0);
  assert.equal(low.rank, 13);
  assert.equal(low.inTop, 12 < TOP_SHOWN);
  assert.deepEqual(myStanding(board, 'khac', 7), { rank: null, points: 7, inTop: false });
  assert.deepEqual(myStanding(board, null, 7), { rank: null, points: 7, inTop: false });
  assert.deepEqual(myStanding([], 'x', 0), { rank: null, points: 0, inTop: false });
});
