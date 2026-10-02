import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mainPoisOfCity } from '@/data/travel/pois';
import { journeyOf, recommendedPoi } from './journey';
import { TRAVEL_ECONOMY } from './economy';
import type { PoiProgress } from './types';

const p = (best: 0 | 1 | 2 | 3): PoiProgress => ({ best, runs: 1, level: 1, lastAt: '2026-10-02T00:00:00Z' });

test('lộ trình: chưa làm gì thì gợi ý địa điểm đầu chuỗi, phần còn lại khoá', () => {
  const j = journeyOf({ poi: {}, visited: {} }, 'singapore');
  const main = mainPoisOfCity('singapore');
  assert.ok(j.steps.length >= main.length);
  assert.equal(j.next?.id, main[0]!.id);
  assert.equal(j.steps.find((x) => x.state === 'next')?.poi.id, main[0]!.id);
  assert.equal(j.passed, 0);
  assert.equal(j.pct, 0);
  assert.ok(j.nextCities.includes('london'));
  assert.ok(j.steps.some((s) => s.state === 'locked' && s.needs));
});

test('lộ trình: đạt đủ 60% thì thanh tiến tới thành phố kế đầy; gợi ý nhảy sang bước kế', () => {
  const main = mainPoisOfCity('singapore');
  const need = Math.ceil(main.length * TRAVEL_ECONOMY.unlockAt);
  const poi = Object.fromEntries(main.slice(0, need).map((m) => [m.id, p(2)]));
  const j = journeyOf({ poi, visited: {} }, 'singapore');
  assert.equal(j.unlockPct, 100);
  assert.equal(j.needMore, 0);
  assert.notEqual(j.next?.id, main[0]!.id);
  const half = journeyOf({ poi: { [main[0]!.id]: p(2) }, visited: {} }, 'singapore');
  assert.ok(half.unlockPct > 0 && half.unlockPct < 100);
  assert.ok(half.needMore > 0);
});

test('địa điểm gợi ý luôn là nơi đang mở và chưa đạt; một sao chưa tính là đạt', () => {
  const main = mainPoisOfCity('hanoi');
  assert.equal(recommendedPoi({ poi: { 'hanoi-pho': p(1) }, visited: {} }, 'hanoi')?.id, 'hanoi-pho');
  const done = Object.fromEntries(main.map((m) => [m.id, p(3)]));
  const r = recommendedPoi({ poi: done, visited: {} }, 'hanoi');
  assert.ok(!r || r.kind === 'secret');
});
