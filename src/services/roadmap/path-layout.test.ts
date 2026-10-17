import test from 'node:test';
import assert from 'node:assert/strict';

import { LABEL_WIDTH, NODE_SIZE, ROW_GAP, curvePath, layoutPath } from './path-layout';

test('nút luân phiên trái phải, và nằm trong chiều rộng', () => {
  const { points } = layoutPath(6, 360);
  assert.equal(points.length, 6);
  assert.deepEqual(points.map((p) => p.side), ['left', 'right', 'left', 'right', 'left', 'right']);
  assert.ok(points.every((p) => p.x > 0 && p.x < 360));
});

test('nhãn đặt cạnh nút không tràn khung trên điện thoại (360px)', () => {
  const { points } = layoutPath(6, 360);
  for (const p of points) {
    if (p.side === 'left') assert.ok(p.x + NODE_SIZE / 2 + 12 + LABEL_WIDTH <= 360 + 1);
    else assert.ok(p.x - NODE_SIZE / 2 - 12 - LABEL_WIDTH >= -1);
  }
});

test('chiều cao khớp số hàng; số nút 0 không lỗi', () => {
  const { height } = layoutPath(6, 360);
  const { points: empty, height: h0 } = layoutPath(0, 360);
  assert.equal(empty.length, 0);
  assert.ok(h0 > 0);
  assert.ok(height >= 5 * ROW_GAP);
});

test('đường cong đi qua mọi tâm nút theo thứ tự', () => {
  const { points } = layoutPath(3, 360);
  const d = curvePath(points);
  assert.match(d, /^M /);
  assert.equal((d.match(/ C /g) ?? []).length, 2);
  assert.equal(curvePath(points.slice(0, 1)), '');
});
