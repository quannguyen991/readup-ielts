import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  BLUEPRINTS,
  blueprint,
  canBuild,
  demolishRefund,
  levelFor,
  nextLevelNeed,
  populationOf,
  type Plots,
} from './blueprints';
import { isInnerLot, LOTS, PLAZA_ID, SAMPLE_CITY } from './layout';
import { EMPTY_MATERIALS, earnFromAnswers, hasMaterials, materialForSource, starCost, subtract } from './materials';
import { mergeCity, type CityPayload } from './sync';

const rich = { wood: 999, stone: 999, brick: 999, steel: 999, glass: 999 };

test('24 khu đất quanh quảng trường, 8 khu vòng trong', () => {
  assert.equal(LOTS.length, 24);
  assert.equal(new Set(LOTS.map((l) => l.id)).size, 24);
  assert.ok(!LOTS.some((l) => l.id === PLAZA_ID));
  assert.equal(LOTS.filter((l) => l.inner).length, 8);
});

test('thành phố mẫu: đủ 24 khu, đúng luật đặt (tháp ở vòng trong, chỉ một tháp)', () => {
  assert.equal(Object.keys(SAMPLE_CITY).length, 24);
  for (const [id, p] of Object.entries(SAMPLE_CITY)) {
    assert.ok(LOTS.some((l) => l.id === id), `khu ${id} không có`);
    const bp = blueprint(p.type)!;
    if (bp.innerOnly) assert.ok(isInnerLot(id));
  }
  assert.equal(Object.values(SAMPLE_CITY).filter((p) => p.type === 'landmark').length, 1);
  const kinds = new Set(Object.values(SAMPLE_CITY).map((p) => p.type));
  assert.equal(kinds.size, BLUEPRINTS.length, 'mẫu phải có đủ mọi loại công trình');
});

test('câu đúng ra đúng vật liệu của mảng, có trần ngày', () => {
  assert.equal(materialForSource('vocab'), 'wood');
  assert.equal(materialForSource('math'), 'steel');
  assert.equal(materialForSource('verbal'), 'glass');
  assert.equal(materialForSource('lạ'), null);
  const r1 = earnFromAnswers(EMPTY_MATERIALS, null, 'vocab', 3, '2026-09-29');
  assert.equal(r1.inventory.wood, 3);
  const r2 = earnFromAnswers(r1.inventory, r1.daily, 'vocab', 100, '2026-09-29');
  assert.equal(r2.inventory.wood, 60, 'chạm trần 60 gỗ/ngày');
  assert.equal(r2.gained, 57);
  const r3 = earnFromAnswers(r2.inventory, r2.daily, 'vocab', 5, '2026-09-30');
  assert.equal(r3.gained, 5, 'sang ngày mới thì trần đặt lại');
});

test('cấp thành phố theo số dân', () => {
  assert.equal(levelFor(0), 1);
  assert.equal(levelFor(20), 2);
  assert.equal(levelFor(599), 4);
  assert.equal(levelFor(600), 5);
  assert.deepEqual(nextLevelNeed(8), { level: 2, need: 12 });
  assert.equal(nextLevelNeed(700), null);
});

test('xây: khoá theo cấp, thiếu vật liệu, khu có nhà, tháp chỉ ở vòng trong và chỉ một', () => {
  const empty: Plots = {};
  assert.deepEqual(canBuild('house2', '0-0', empty, rich, isInnerLot), { ok: true });
  assert.deepEqual(canBuild('skyscraper', '1-1', empty, rich, isInnerLot), { ok: false, reason: 'locked' });
  assert.deepEqual(canBuild('house2', '0-0', empty, EMPTY_MATERIALS, isInnerLot), { ok: false, reason: 'materials' });
  const one: Plots = { '0-0': { type: 'house2', builtAt: '' } };
  assert.deepEqual(canBuild('park', '0-0', one, rich, isInnerLot), { ok: false, reason: 'occupied' });
  // đủ dân cho cấp 5
  const big: Plots = Object.fromEntries(['0-1', '0-2', '0-3'].map((id) => [id, { type: 'skyscraper' as const, builtAt: '' }]));
  assert.ok(populationOf(big) >= 600);
  assert.deepEqual(canBuild('landmark', '0-0', big, rich, isInnerLot), { ok: false, reason: 'inner' });
  assert.deepEqual(canBuild('landmark', '1-2', big, rich, isInnerLot), { ok: true });
  const withTower = { ...big, '1-1': { type: 'landmark' as const, builtAt: '' } };
  assert.deepEqual(canBuild('landmark', '1-2', withTower, rich, isInnerLot), { ok: false, reason: 'max' });
});

test('nhà đầu tiên xây được bằng quà khởi công; phá dỡ hoàn một nửa', () => {
  const gift = { ...EMPTY_MATERIALS, wood: 30, brick: 20, glass: 4 };
  assert.ok(hasMaterials(gift, blueprint('house2')!.cost));
  assert.deepEqual(subtract(gift, blueprint('house2')!.cost), EMPTY_MATERIALS);
  assert.deepEqual(demolishRefund('house2'), { wood: 15, brick: 10, glass: 2 });
  assert.equal(starCost('glass', 10), 60);
});

test('gộp đồng bộ: bản sửa sau thắng, không cộng dồn vật liệu hai máy', () => {
  const a: CityPayload = { inventory: { ...EMPTY_MATERIALS, wood: 5 }, plots: {}, daily: null, giftClaimed: true, updatedAt: '2026-09-29T01:00:00Z' };
  const b: CityPayload = { inventory: { ...EMPTY_MATERIALS, wood: 9 }, plots: { '0-0': { type: 'park', builtAt: '' } }, daily: null, giftClaimed: true, updatedAt: '2026-09-29T02:00:00Z' };
  assert.equal(mergeCity(a, b).inventory.wood, 9);
  assert.equal(mergeCity(b, a).inventory.wood, 9);
  assert.equal(mergeCity(null, a).inventory.wood, 5);
});
