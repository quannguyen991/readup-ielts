import assert from 'node:assert/strict';
import { test } from 'node:test';

import { findPath, hasPath, reachableTiles, toField } from './pathfinding';

const parse = (rows: string[]) => rows.map((r) => [...r].map((c) => c === '#'));

test('đường thẳng trong lưới trống: đúng độ dài, không gồm ô xuất phát, gồm ô đích', () => {
  const grid = parse(['.....', '.....', '.....']);
  const p = findPath(grid, { x: 0, y: 0 }, { x: 4, y: 0 })!;
  assert.equal(p.length, 4);
  assert.deepEqual(p[p.length - 1], { x: 4, y: 0 });
  assert.deepEqual(p[0], { x: 1, y: 0 });
});

test('đứng sẵn ở đích: mảng rỗng', () => {
  assert.deepEqual(findPath(parse(['..']), { x: 0, y: 0 }, { x: 0, y: 0 }), []);
});

test('đi vòng tường', () => {
  const grid = parse(['..#..', '..#..', '..#..', '.....']);
  const p = findPath(grid, { x: 0, y: 0 }, { x: 4, y: 0 })!;
  assert.ok(p);
  assert.equal(p.length, 10);
  for (const t of p) assert.equal(grid[t.y]![t.x], false, `ô ${t.x},${t.y} bị chặn`);
});

test('mỗi bước chỉ đi 4 hướng', () => {
  const grid = parse(['....', '.##.', '....']);
  const p = findPath(grid, { x: 0, y: 0 }, { x: 3, y: 2 })!;
  let prev = { x: 0, y: 0 };
  for (const t of p) {
    assert.equal(Math.abs(t.x - prev.x) + Math.abs(t.y - prev.y), 1);
    prev = t;
  }
});

test('không có đường: null; toạ độ ngoài bản đồ: null; xuất phát bị chặn: null', () => {
  const grid = parse(['.#.', '.#.', '.#.']);
  assert.equal(findPath(grid, { x: 0, y: 0 }, { x: 2, y: 0 }), null);
  assert.equal(findPath(grid, { x: 0, y: 0 }, { x: 9, y: 0 }), null);
  assert.equal(findPath(grid, { x: 1, y: 0 }, { x: 0, y: 0 }), null);
});

test('ô đích bị chặn (cửa sát tường): mặc định vẫn tới được, tắt tuỳ chọn thì không', () => {
  const grid = parse(['...', '.#.', '...']);
  const to = { x: 1, y: 1 };
  assert.ok(findPath(grid, { x: 0, y: 0 }, to));
  assert.equal(findPath(grid, { x: 0, y: 0 }, to, { allowBlockedGoal: false }), null);
});

test('nhận cả PathField với hàm chặn', () => {
  const field = { w: 3, h: 3, isBlocked: (x: number, y: number) => x === 1 && y !== 2 };
  const p = findPath(field, { x: 0, y: 0 }, { x: 2, y: 0 })!;
  assert.equal(p.length, 6);
  assert.equal(toField(field), field);
});

test('đường ưu tiên ít ngoặt', () => {
  const p = findPath(parse(['......', '......', '......']), { x: 0, y: 0 }, { x: 5, y: 2 })!;
  let turns = 0;
  let prevDir = '';
  let prev = { x: 0, y: 0 };
  for (const t of p) {
    const dir = `${t.x - prev.x},${t.y - prev.y}`;
    if (prevDir && dir !== prevDir) turns += 1;
    prevDir = dir;
    prev = t;
  }
  assert.ok(turns <= 2, `ngoặt ${turns} lần`);
});

test('reachableTiles và hasPath', () => {
  const grid = parse(['..#.', '..#.', '..#.']);
  const r = reachableTiles(grid, { x: 0, y: 0 });
  assert.equal(r.size, 6);
  assert.ok(r.has('1,2') && !r.has('3,0'));
  assert.equal(hasPath(grid, { x: 0, y: 0 }, { x: 3, y: 0 }), false);
  assert.equal(hasPath(grid, { x: 0, y: 0 }, { x: 1, y: 2 }), true);
});

test('bản đồ lớn trống: vẫn nhanh và đúng', () => {
  const field = { w: 200, h: 200, isBlocked: () => false };
  const p = findPath(field, { x: 0, y: 0 }, { x: 199, y: 199 })!;
  assert.equal(p.length, 398);
});
