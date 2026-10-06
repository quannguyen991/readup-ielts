import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CITIES, CITY_ORDER, ROUTES, canFly, cityCompletion, flightCost, isCityUnlocked } from './world';
import { mainPoisOfCity } from '@/data/travel/pois';
import type { PoiProgress } from './types';

const prog = (best: 0 | 1 | 2 | 3): PoiProgress => ({ best, runs: 1, level: 1, lastAt: '' });
const passAll = (city: Parameters<typeof mainPoisOfCity>[0], upTo?: number) =>
  Object.fromEntries(mainPoisOfCity(city).slice(0, upTo).map((p) => [p.id, prog(2)]));

test('giá vé theo bảng kế hoạch', () => {
  assert.equal(flightCost('hanoi', 'singapore'), 1);
  assert.equal(flightCost('singapore', 'london'), 2);
  assert.equal(flightCost('london', 'paris'), 1);
  assert.equal(flightCost('paris', 'amsterdam'), 1);
  assert.equal(flightCost('paris', 'rome'), 1);
});

test('đường bay hai chiều; cặp không nối thẳng cộng dọc đường ngắn nhất', () => {
  assert.equal(flightCost('london', 'singapore'), 2);
  assert.equal(flightCost('hanoi', 'london'), 3);
  assert.equal(flightCost('london', 'rome'), 2);
  assert.equal(flightCost('amsterdam', 'rome'), 2);
});

test('về Hà Nội luôn miễn phí, cùng thành phố thì không bay', () => {
  for (const c of CITY_ORDER) assert.equal(flightCost(c, 'hanoi'), 0);
  assert.equal(flightCost('rome', 'rome'), 0);
});

test('mọi tuyến nối hai thành phố có thật và giá > 0', () => {
  for (const r of ROUTES) {
    assert.ok(CITIES[r.a] && CITIES[r.b]);
    assert.ok(r.tickets > 0);
  }
});

test('mở khoá: Singapore mở sẵn; London cần ≥ 60% Singapore; Paris/Amsterdam/Rome cần London', () => {
  const none = { poi: {} };
  assert.equal(isCityUnlocked(none, 'singapore'), true);
  assert.equal(isCityUnlocked(none, 'london'), false);
  const need = Math.ceil(mainPoisOfCity('singapore').length * 0.6);
  assert.equal(isCityUnlocked({ poi: passAll('singapore', need - 1) }, 'london'), false, 'dưới 60%');
  assert.equal(isCityUnlocked({ poi: passAll('singapore', need) }, 'london'), true, 'đủ 60%');
  for (const c of ['paris', 'amsterdam', 'rome'] as const) {
    assert.equal(isCityUnlocked({ poi: passAll('singapore') }, c), false);
    assert.equal(isCityUnlocked({ poi: passAll('london') }, c), true);
  }
});

test('một sao chưa tính là đạt', () => {
  const poi = Object.fromEntries(mainPoisOfCity('singapore').map((p) => [p.id, prog(1)]));
  assert.equal(cityCompletion({ poi }, 'singapore'), 0);
});

test('canFly: đủ vé và đã mở thì bay được, nêu rõ lý do khi không được', () => {
  const base = { city: 'hanoi' as const, poi: {} };
  assert.deepEqual(canFly({ ...base, tickets: 1 }, 'singapore'), { ok: true, cost: 1 });
  assert.deepEqual(canFly({ ...base, tickets: 0 }, 'singapore'), { ok: false, reason: 'tickets', cost: 1 });
  assert.deepEqual(canFly({ ...base, tickets: 9 }, 'london'), { ok: false, reason: 'locked', cost: 3 });
  assert.equal(canFly({ ...base, tickets: 9 }, 'hanoi').ok, false);
  const home = canFly({ city: 'rome', poi: {}, tickets: 0 }, 'hanoi');
  assert.deepEqual(home, { ok: true, cost: 0 });
});

test('bản đồ thế giới: các thành phố không dính nhau', () => {
  for (const a of CITY_ORDER)
    for (const b of CITY_ORDER) {
      if (a >= b) continue;
      const d = Math.hypot(CITIES[a].mapAt.x - CITIES[b].mapAt.x, CITIES[a].mapAt.y - CITIES[b].mapAt.y);
      assert.ok(d >= 4, `${a} và ${b} quá gần (${d.toFixed(1)} ô)`);
    }
});

test('Việt Nam: Đà Nẵng và TP.HCM nối Hà Nội–Singapore, mở sau Singapore', () => {
  assert.equal(flightCost('hanoi', 'danang'), 1);
  assert.equal(flightCost('danang', 'hochiminh'), 1);
  assert.equal(flightCost('singapore', 'hochiminh'), 1);
  assert.equal(flightCost('hochiminh', 'hanoi'), 0);
  assert.equal(flightCost('hanoi', 'london'), 3);
  for (const c of ['danang', 'hochiminh'] as const) {
    assert.ok(mainPoisOfCity(c).length >= 8, c);
    assert.equal(isCityUnlocked({ poi: {} }, c), false);
    assert.equal(isCityUnlocked({ poi: passAll('singapore') }, c), true);
  }
});
