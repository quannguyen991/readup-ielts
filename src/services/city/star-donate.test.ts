import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ECONOMY, EMPTY_ECONOMY, exchange, exchangeCost, exchangeRoom } from './economy';
import { applyContribution, EMPTY_HUB_USER, floorShortfall, HUB, HUB_TOWERS, hubProgress, unitsOf } from './hub';
import { MATERIAL_KINDS, type Materials } from './materials';
import { clampOrder, DEFAULT_MIX, planStars, spendableStars } from './star-donate';

const DAY = '2026-10-01';
const full = (): Materials => ({ ...ECONOMY.exchange.dailyCap });
const sum = (m: Partial<Materials>) => MATERIAL_KINDS.reduce((s, k) => s + (m[k] ?? 0), 0);

test('chia đều: tầng đang thiếu loại nào thì mua loại đó trước, đều tay giữa các loại', () => {
  const t0 = HUB_TOWERS[0]!;
  const miss = floorShortfall(hubProgress({}).towers[0]);
  assert.deepEqual(miss, t0.floorCost);
  // Sao dư cho cả tầng đầu: gói tầng đầu tiên được lấp đủ, không loại nào bị bỏ đói.
  const need = exchangeCost(t0.floorCost);
  const p = planStars(need, { first: miss, mix: t0.floorCost, room: full() });
  for (const k of MATERIAL_KINDS) assert.equal(p.order[k], t0.floorCost[k] ?? 0, k);
  assert.equal(p.cost, need);
  assert.equal(p.left, 0);
  // Ít sao: mỗi loại tiến đều (không loại nào đã đầy khi loại khác còn 0).
  const few = planStars(need / 2, { first: miss, room: full() });
  const frac = MATERIAL_KINDS.map((k) => few.order[k] / (t0.floorCost[k] ?? 1));
  assert.ok(Math.max(...frac) - Math.min(...frac) <= 0.5, JSON.stringify(few.order));
  assert.ok(few.cost <= need / 2);
});

test('sao còn dư sau tầng đầu đi theo tỷ lệ gói một tầng', () => {
  const t0 = HUB_TOWERS[0]!;
  const miss = floorShortfall(hubProgress({}).towers[0]);
  const stars = exchangeCost(t0.floorCost) * 3;
  const p = planStars(stars, { first: miss, mix: t0.floorCost, room: full() });
  // Ba tầng: đúng 3 × gói tầng (giá và tỷ lệ chia hết) — hoặc rất sát.
  for (const k of MATERIAL_KINDS) assert.ok(Math.abs(p.order[k] - 3 * (t0.floorCost[k] ?? 0)) <= 1, `${k}: ${p.order[k]}`);
  assert.ok(p.left >= 0 && p.left < Math.min(...MATERIAL_KINDS.map((k) => ECONOMY.exchange.price[k])) + 20);
});

test('không bao giờ tiêu quá số sao; chi phí khớp bảng giá; tất định', () => {
  for (const stars of [0, 1, 3, 4, 7, 50, 199, 200, 1000, 12345, 1e7]) {
    const a = planStars(stars, { room: full() });
    assert.ok(a.cost <= stars, `${stars}`);
    assert.equal(a.cost, exchangeCost(a.order));
    assert.equal(a.units, sum(a.order));
    assert.equal(a.left, stars - a.cost);
    assert.deepEqual(planStars(stars, { room: full() }), a);
  }
  for (const bad of [-5, NaN, Infinity * 0, 0.9]) assert.equal(planStars(bad, { room: full() }).units, 0);
});

test('mặc định không biết cần gì → theo DEFAULT_MIX, không dồn một loại', () => {
  const p = planStars(400, { room: full() });
  const kinds = MATERIAL_KINDS.filter((k) => p.order[k] > 0);
  assert.equal(kinds.length, 5);
  for (const k of MATERIAL_KINDS) assert.ok(p.order[k] >= DEFAULT_MIX[k] - 1, k);
});

test('tôn trọng trần: trần đổi từng loại, tổng đơn vị còn góp được, trần mỗi loại', () => {
  const room: Materials = { wood: 3, stone: 0, brick: 100, steel: 2, glass: 100 };
  const p = planStars(100000, { room, maxUnits: 40, maxPerKind: 30 });
  assert.ok(p.order.wood <= 3 && p.order.stone === 0 && p.order.steel <= 2);
  assert.ok(p.order.brick <= 30 && p.order.glass <= 30);
  assert.ok(p.units <= 40);
  // Hết chỗ → đơn rỗng, sao nguyên.
  const none = planStars(500, { room: { wood: 0, stone: 0, brick: 0, steel: 0, glass: 0 } });
  assert.equal(none.units, 0);
  assert.equal(none.left, 500);
});

test('đơn do planStars sinh ra luôn được luật đổi + luật góp chấp nhận', () => {
  for (const stars of [10, 60, 200, 500, 2000, 9000]) {
    const room = exchangeRoom(EMPTY_ECONOMY, DAY);
    const miss = floorShortfall(hubProgress({}).towers[0]);
    const p = planStars(stars, { first: miss, mix: HUB_TOWERS[0]!.floorCost, room, maxUnits: HUB.dailyUnitCap, maxPerKind: HUB.maxPerKind });
    if (p.units === 0) continue;
    const ex = exchange(EMPTY_ECONOMY, p.order, stars, DAY, `t${stars}`);
    assert.ok(ex.ok, `${stars}: ${JSON.stringify(p)}`);
    const hub = applyContribution(EMPTY_HUB_USER, p.order, `h${stars}`, '2026-10-01T01:00:00Z', DAY);
    assert.ok(hub.ok, `${stars}: ${JSON.stringify(hub)}`);
    if (hub.ok) assert.equal(hub.units, unitsOf(p.order));
  }
});

test('đơn tự chọn bị cắt về trần; "Tất cả" không vượt trần', () => {
  const room: Materials = { wood: 10, stone: 5, brick: 0, steel: 1, glass: 1 };
  const o = clampOrder({ wood: 99, stone: 99, brick: 99, steel: 99, glass: 99 }, { room, maxUnits: 12 });
  assert.deepEqual(o, { wood: 10, stone: 2, brick: 0, steel: 0, glass: 0 });
  assert.equal(sum(clampOrder({ wood: -3, stone: 1.9 }, { room })), 1);
  // spendableStars không vượt số dư, không vượt giá của đơn lớn nhất còn được phép.
  assert.equal(spendableStars(1e9, { room }), exchangeCost(clampOrder({ wood: 1e9, stone: 1e9, brick: 1e9, steel: 1e9, glass: 1e9 }, { room })));
  assert.equal(spendableStars(30, { room }), 30);
  assert.equal(spendableStars(-5, { room }), 0);
});

test('trần mới: đổi sao được nhiều hơn trần học nhưng vẫn có trần; đủ ~2,5×', () => {
  for (const k of MATERIAL_KINDS) {
    assert.ok(ECONOMY.exchange.dailyCap[k] >= ECONOMY.dailyCap[k] * 2, k);
    assert.ok(ECONOMY.exchange.dailyCap[k] <= ECONOMY.dailyCap[k] * 3, k);
  }
  assert.equal(HUB.dailyUnitCap, 600);
});

test('ít sao: ưu tiên loại rẻ, nhiều phần (50⭐ → gỗ/đá/gạch, chưa tới thép/kính)', () => {
  const p = planStars(50, { room: full() });
  assert.deepEqual(p.order, { wood: 4, stone: 3, brick: 3, steel: 0, glass: 0 });
  assert.ok(p.left < 4);
});
