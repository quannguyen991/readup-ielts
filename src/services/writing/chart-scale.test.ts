import assert from 'node:assert/strict';
import { test } from 'node:test';

import { niceTicks, pieSlices, seriesExtent } from './chart-scale';

test('vạch trục là số tròn, không phải số lẻ dài', () => {
  for (const t of niceTicks(0, 155)) {
    assert.equal(t, Math.round(t * 100) / 100, `vạch ${t} không tròn`);
  }
});

test('vạch đầu không lớn hơn min và vạch cuối không nhỏ hơn max', () => {
  const ticks = niceTicks(12, 155);
  assert.ok((ticks[0] ?? 0) <= 12);
  assert.ok((ticks[ticks.length - 1] ?? 0) >= 155);
});

test('vạch tăng đều và không trùng nhau', () => {
  const ticks = niceTicks(0, 97);
  const step = (ticks[1] ?? 0) - (ticks[0] ?? 0);
  assert.ok(step > 0);
  for (let i = 1; i < ticks.length; i += 1) {
    assert.equal((ticks[i] ?? 0) - (ticks[i - 1] ?? 0), step);
  }
});

test('số vạch nằm trong khoảng dùng được, không quá dày cũng không quá thưa', () => {
  for (const [lo, hi] of [
    [0, 1],
    [0, 9],
    [0, 100],
    [0, 12345],
    [40, 41],
  ] as const) {
    const n = niceTicks(lo, hi).length;
    assert.ok(n >= 3 && n <= 8, `khoảng ${lo}-${hi} ra ${n} vạch`);
  }
});

test('min bằng max vẫn ra trục dùng được, không chia cho 0', () => {
  const ticks = niceTicks(50, 50);
  assert.ok(ticks.length >= 2);
  assert.ok(ticks.every((t) => Number.isFinite(t)));
});

test('biên độ lấy từ mọi chuỗi, và luôn kéo về 0 khi mọi giá trị đều dương', () => {
  // Trục cắt ở giá trị nhỏ nhất làm cột thấp trông như bằng 0 — sai tỷ lệ.
  const e = seriesExtent([{ values: [45, 68] }, { values: [95, 40] }]);
  assert.equal(e.min, 0);
  assert.equal(e.max, 95);
});

test('có giá trị âm thì không ép trục về 0', () => {
  const e = seriesExtent([{ values: [-4, 18] }]);
  assert.ok(e.min <= -4);
  assert.equal(e.max, 18);
});

test('chuỗi rỗng không làm sập, trả biên độ mặc định', () => {
  const e = seriesExtent([]);
  assert.ok(Number.isFinite(e.min) && Number.isFinite(e.max));
  assert.ok(e.max > e.min);
});

test('góc các lát bánh nối tiếp nhau và phủ trọn vòng tròn', () => {
  const slices = pieSlices([
    { label: 'A', value: 50 },
    { label: 'B', value: 30 },
    { label: 'C', value: 20 },
  ]);
  assert.equal(slices.length, 3);
  assert.equal(slices[0]?.startAngle, 0);
  for (let i = 1; i < slices.length; i += 1) {
    assert.equal(slices[i]?.startAngle, slices[i - 1]?.endAngle);
  }
  assert.equal(Math.round(slices[slices.length - 1]?.endAngle ?? 0), 360);
});

test('lát có giá trị 0 không làm hỏng phép chia', () => {
  const slices = pieSlices([
    { label: 'A', value: 100 },
    { label: 'B', value: 0 },
  ]);
  assert.equal(slices[1]?.startAngle, slices[1]?.endAngle);
});

test('tổng bằng 0 thì trả mảng rỗng chứ không ném lỗi', () => {
  assert.deepEqual(pieSlices([{ label: 'A', value: 0 }]), []);
});
