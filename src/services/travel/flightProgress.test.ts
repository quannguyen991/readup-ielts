import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mainPoisOfCity } from '@/data/travel/pois';
import { TRAVEL_ECONOMY } from './economy';
import { cityProgressFine, FLIGHT_CHAIN, learningProgress, LEARNING_CITIES, nextStop, positionAt } from './flightProgress';
import { WORLD_ART } from './worldGeometry';

const stars = (city: Parameters<typeof mainPoisOfCity>[0], n: number) =>
  Object.fromEntries(mainPoisOfCity(city).map((p) => [p.id, { best: n, visits: 1 }])) as never;

test('chưa học gì thì máy bay đứng ở Hà Nội', () => {
  assert.equal(learningProgress({ poi: {} }), 0);
  const p = positionAt(0);
  assert.equal(p.from, 'hanoi');
  assert.ok(Math.abs(p.x - WORLD_ART.hanoi.x) < 0.01 && Math.abs(p.y - WORLD_ART.hanoi.y) < 0.01);
});

test('học xong mọi thành phố thì máy bay tới Rome', () => {
  const poi: Record<string, unknown> = {};
  for (const c of LEARNING_CITIES) Object.assign(poi, stars(c, 3));
  assert.equal(learningProgress({ poi } as never), 1);
  const p = positionAt(1);
  assert.equal(p.to, 'rome');
  assert.ok(Math.abs(p.x - WORLD_ART.rome.x) < 0.01 && Math.abs(p.y - WORLD_ART.rome.y) < 0.01);
});

test('mỗi sao kiếm được đều làm tiến độ tăng (mịn, không nhảy cóc)', () => {
  const sg = mainPoisOfCity('singapore');
  assert.ok(sg.length >= 2);
  const a = cityProgressFine({ poi: { [sg[0]!.id]: { best: 1, visits: 1 } } } as never, 'singapore');
  const b = cityProgressFine({ poi: { [sg[0]!.id]: { best: 2, visits: 1 } } } as never, 'singapore');
  assert.ok(a > 0 && b > a);
  const need = TRAVEL_ECONOMY.visit.passStars;
  assert.equal(cityProgressFine({ poi: { [sg[0]!.id]: { best: need + 1, visits: 1 } } } as never, 'singapore'), 1 / sg.length);
});

test('vị trí đi liên tục dọc tuyến và không lùi', () => {
  let lastLeg = 0;
  let prev = positionAt(0);
  for (let i = 1; i <= 200; i += 1) {
    const p = positionAt(i / 200);
    assert.ok(p.leg >= lastLeg);
    assert.ok(Math.hypot(p.x - prev.x, p.y - prev.y) < 12, 'bước nhảy quá lớn');
    lastLeg = p.leg;
    prev = p;
  }
  assert.equal(FLIGHT_CHAIN[0], 'hanoi');
});

test('đích kế tiếp luôn nằm trên tuyến', () => {
  assert.equal(nextStop(0), 'singapore');
  assert.ok(FLIGHT_CHAIN.includes(nextStop(0.5)));
});
