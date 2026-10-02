import test from 'node:test';
import assert from 'node:assert/strict';

import { computeView, clientToWorld, pointerToWorld } from './engine/view';
import { buttonsPerColumn, capDpr, frameInterval, IDLE_AFTER_MS, IDLE_CALM_INTERVAL_MS, IDLE_INTERVAL_MS, isIdle, normaliseStick, sheetMaxHeight, shouldDismissSheet, stickToDirs, viewportKind, type FrameGate } from './mobile';

test('capDpr: kẹp ở 2, không nhỏ hơn 1, bỏ giá trị rác', () => {
  assert.equal(capDpr(3), 2);
  assert.equal(capDpr(2.625), 2);
  assert.equal(capDpr(1.5), 1.5);
  assert.equal(capDpr(0.5), 1);
  assert.equal(capDpr(NaN), 1);
  assert.equal(capDpr(4, 3), 3);
});

test('viewportKind: điện thoại dọc / ngang / máy tính', () => {
  assert.deepEqual(viewportKind(390, 844), { compact: true, landscape: false, sheet: true });
  assert.deepEqual(viewportKind(844, 390), { compact: true, landscape: true, sheet: false });
  assert.deepEqual(viewportKind(1400, 900), { compact: false, landscape: false, sheet: false });
  assert.equal(viewportKind(640, 900).sheet, false);
  assert.equal(viewportKind(360, 640).sheet, true);
});

test('buttonsPerColumn: vừa chiều cao', () => {
  assert.equal(buttonsPerColumn(370), 7); // 7×44 + 6×8 = 356
  assert.equal(buttonsPerColumn(340), 6);
  assert.equal(buttonsPerColumn(10), 1);
});

test('sheetMaxHeight: ~80%, chừa lề trên, không dưới 240', () => {
  assert.equal(sheetMaxHeight(844), 675);
  assert.equal(sheetMaxHeight(844, 60), 675);
  assert.equal(sheetMaxHeight(500, 100), 384);
  assert.equal(sheetMaxHeight(300), 240);
  assert.equal(sheetMaxHeight(200), 200);
});

test('shouldDismissSheet: kéo xa hoặc vuốt nhanh', () => {
  assert.equal(shouldDismissSheet(130, 0, 600), true);
  assert.equal(shouldDismissSheet(30, 0.2, 600), false);
  assert.equal(shouldDismissSheet(40, 0.9, 600), true);
  assert.equal(shouldDismissSheet(10, 2, 600), false);
  assert.equal(shouldDismissSheet(70, 0, 200), true); // tờ thấp: 30% = 60
});

test('isIdle + frameInterval: ẩn → dừng, rảnh → 20 khung/giây, bận → theo bộ tự hạ tải', () => {
  const g: FrameGate = { hidden: false, offscreen: false, now: 10_000, lastActiveAt: 10_000, busy: false, reducedMotion: false, adaptiveInterval: 0 };
  assert.equal(isIdle(10_000, 10_000, false), false);
  assert.equal(isIdle(10_000 + IDLE_AFTER_MS, 10_000, false), true);
  assert.equal(isIdle(99_999, 0, true), false);
  assert.equal(frameInterval(g), 0);
  assert.equal(frameInterval({ ...g, now: 10_000 + IDLE_AFTER_MS }), IDLE_INTERVAL_MS);
  assert.equal(frameInterval({ ...g, now: 10_000 + IDLE_AFTER_MS, reducedMotion: true }), IDLE_CALM_INTERVAL_MS);
  assert.equal(frameInterval({ ...g, now: 10_000 + IDLE_AFTER_MS, busy: true }), 0);
  assert.equal(frameInterval({ ...g, now: 10_000 + IDLE_AFTER_MS, adaptiveInterval: 80 }), 80);
  assert.equal(frameInterval({ ...g, hidden: true }), Infinity);
  assert.equal(frameInterval({ ...g, offscreen: true }), Infinity);
});

test('clientToWorld: khớp pointerToWorld khi canvas = css × dpr, và đúng khi dpr bị kẹp / làm tròn', () => {
  // điện thoại 390×844, dpr gốc 3 → kẹp 2
  const v = computeView(390, 844, 2);
  const rect = { left: 0, top: 0, width: 390, height: 844 };
  for (const [x, y] of [[0, 0], [195, 422], [389, 843], [100, 700]] as const) {
    assert.deepEqual(clientToWorld(x, y, rect, v, 12, 34), pointerToWorld(x, y, v, 12, 34));
  }
  // lề căn giữa: chạm đúng giữa màn hình rơi vào giữa vùng cảnh
  const mid = clientToWorld(195, 422, rect, v, 0, 0);
  assert.ok(Math.abs(mid.x - v.W / 2) <= 1 && Math.abs(mid.y - v.H / 2) <= 1);
  // dpr lẻ: devW = round(css × dpr) lệch css × dpr; chạm mép phải vẫn nằm trong cảnh
  const v2 = computeView(411, 731, 2.625);
  const r2 = { left: 0, top: 0, width: 411, height: 731 };
  const edge = clientToWorld(410.9, 730.9, r2, v2, 0, 0);
  assert.ok(edge.x <= v2.W && edge.y <= v2.H);
  // canvas đặt lệch trong trang
  const off = clientToWorld(60 + 195, 100 + 422, { left: 60, top: 100, width: 390, height: 844 }, v, 0, 0);
  assert.deepEqual(off, mid);
});

test('stickToDirs: vùng chết, 4 hướng, đi chéo', () => {
  assert.deepEqual(stickToDirs(0.1, 0.1), []);
  assert.deepEqual(stickToDirs(1, 0), ['right']);
  assert.deepEqual(stickToDirs(-1, 0.1), ['left']);
  assert.deepEqual(stickToDirs(0, -0.8), ['up']);
  assert.deepEqual(stickToDirs(0.7, 0.7).sort(), ['down', 'right']);
  assert.deepEqual(stickToDirs(0.9, 0.2), ['right']);
  const buf: ('up' | 'down' | 'left' | 'right')[] = [];
  assert.equal(stickToDirs(0, 1, buf), buf); // tái dùng mảng
});

test('normaliseStick: kẹp vào bán kính', () => {
  assert.deepEqual(normaliseStick(30, 0, 60), { x: 0.5, y: 0 });
  const n = normaliseStick(300, 400, 50);
  assert.ok(Math.abs(Math.hypot(n.x, n.y) - 1) < 1e-9);
  assert.deepEqual(normaliseStick(5, 5, 0), { x: 0, y: 0 });
});
