import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cityOffsetHours, dayPhase, daylight, formatClock, isEuSummerTime, lampsOn, localTime, skyAt, weatherPlan } from './clock';

const utc = (iso: string) => Date.parse(iso);

test('giờ địa phương theo độ lệch cố định', () => {
  const t = utc('2026-01-15T00:00:00Z');
  assert.equal(localTime('hanoi', t).hour, 7);
  assert.equal(localTime('singapore', t).hour, 8);
  assert.equal(localTime('london', t).hour, 0);
  assert.equal(localTime('paris', t).hour, 1);
});

test('giờ mùa hè châu Âu: Chủ nhật cuối tháng 3 đến Chủ nhật cuối tháng 10 (01:00 UTC)', () => {
  assert.equal(isEuSummerTime(utc('2026-03-29T00:59:00Z')), false);
  assert.equal(isEuSummerTime(utc('2026-03-29T01:00:00Z')), true);
  assert.equal(isEuSummerTime(utc('2026-10-25T00:59:00Z')), true);
  assert.equal(isEuSummerTime(utc('2026-10-25T01:00:00Z')), false);
  assert.equal(cityOffsetHours('london', utc('2026-10-02T12:00:00Z')), 1);
  assert.equal(cityOffsetHours('rome', utc('2026-10-02T12:00:00Z')), 2);
  assert.equal(cityOffsetHours('singapore', utc('2026-10-02T12:00:00Z')), 8);
  assert.equal(cityOffsetHours('hanoi', utc('2026-07-01T00:00:00Z')), 7);
});

test('qua nửa đêm đổi ngày theo giờ địa phương', () => {
  const t = utc('2026-10-02T17:30:00Z'); // Hà Nội 00:30 ngày 03
  assert.equal(localTime('hanoi', t).dayKey, '2026-10-03');
  assert.equal(localTime('london', t).dayKey, '2026-10-02');
  assert.equal(formatClock(localTime('hanoi', t)), '00:30');
});

test('không phụ thuộc biến môi trường TZ', () => {
  const before = localTime('singapore', utc('2026-06-01T04:00:00Z')).hour;
  const old = process.env.TZ;
  process.env.TZ = 'Asia/Ho_Chi_Minh';
  try {
    assert.equal(localTime('singapore', utc('2026-06-01T04:00:00Z')).hour, before);
    assert.equal(before, 12);
  } finally {
    if (old === undefined) delete process.env.TZ;
    else process.env.TZ = old;
  }
});

test('pha trong ngày và độ sáng', () => {
  assert.equal(dayPhase(3), 'night');
  assert.equal(dayPhase(6), 'dawn');
  assert.equal(dayPhase(12), 'day');
  assert.equal(dayPhase(18), 'dusk');
  assert.equal(dayPhase(21), 'night');
  assert.ok(daylight(12) === 1 && daylight(2) === 0);
  assert.ok(daylight(6) > 0 && daylight(6) < 1);
  assert.equal(lampsOn(22), true);
  assert.equal(lampsOn(12), false);
});

test('thời tiết: cùng ngày cùng kết quả; Singapore mưa rào buổi chiều; Rome luôn nắng', () => {
  assert.deepEqual(weatherPlan('london', 10, '2026-10-02'), weatherPlan('london', 10, '2026-10-02'));
  assert.equal(weatherPlan('singapore', 9, '2026-10-02').kind, 'clear');
  const kinds = new Set<string>();
  const day = (d: number) => `2026-10-${String(d).padStart(2, '0')}`;
  for (let d = 1; d <= 28; d += 1) kinds.add(weatherPlan('singapore', 16, day(d)).kind);
  assert.ok(kinds.has('shower-evening'));
  for (let d = 1; d <= 28; d += 1) assert.equal(weatherPlan('rome', 12, day(d)).kind, 'clear');
  let wet = 0;
  for (let d = 1; d <= 28; d += 1) {
    const k = weatherPlan('london', 12, day(d)).kind;
    if (k === 'rain' || k === 'drizzle' || k === 'fog') wet += 1;
  }
  assert.ok(wet >= 10, 'London hay ẩm ướt');
  assert.equal(weatherPlan('amsterdam', 12, '2026-10-02').kind, 'wind');
});

test('skyAt gom đủ thông tin', () => {
  const s = skyAt('london', utc('2026-10-02T19:00:00Z'));
  assert.equal(s.time.hour, 20);
  assert.equal(s.phase, 'night');
  assert.equal(s.lamps, true);
});
