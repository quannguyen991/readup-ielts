import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CATALOG, catalogItem } from '@/data/city/catalog';
import {
  applyShift,
  BUILD,
  canHire,
  currentStep,
  deliver,
  distributeShifts,
  floorsFor,
  isDone,
  newSite,
  populationOf,
  settle,
  stageCost,
  stageShifts,
  stepCost,
  stepShifts,
  visualProgress,
  type Site,
} from './construction';
import { add, EMPTY_MATERIALS, MATERIAL_KINDS } from './materials';

const T0 = new Date('2026-09-29T08:00:00Z');
const later = (min: number) => new Date(T0.getTime() + min * 60_000);
const RICH = { wood: 9999, stone: 9999, brick: 9999, steel: 9999, glass: 9999 };

function site(type: string, seed = 7): Site {
  return newSite({ id: `s-${type}`, type, seed, x: 0, y: 0, rot: 0, now: T0.toISOString() });
}

/** Làm hết một công trình với đủ vật liệu + đội; trả số lần giao và số ca đã dùng. */
function buildAll(s: Site, at: (i: number) => Date): { site: Site; deliveries: number; shifts: number } {
  let cur: Site = { ...s, crew: catalogItem(s.type)!.crew };
  let inv = { ...RICH };
  let deliveries = 0;
  let shifts = 0;
  for (let i = 0; i < 2000 && !isDone(cur); i++) {
    if (!cur.delivered) {
      const r = deliver(cur, inv, at(i).toISOString());
      assert.ok(r.ok, `giao được vật liệu ở bước ${JSON.stringify(currentStep(cur, catalogItem(cur.type)!))}`);
      if (r.ok) {
        cur = r.site;
        inv = r.inventory;
        deliveries++;
      }
    }
    const before = JSON.stringify(cur);
    cur = applyShift(cur, at(i));
    if (JSON.stringify(cur) !== before) shifts++;
    else cur = settle(cur, at(i + 1000));
  }
  return { site: cur, deliveries, shifts };
}

test('chi phí các công đoạn cộng lại đúng bằng tổng chi phí của công trình', () => {
  for (const item of CATALOG) {
    let sum = { ...EMPTY_MATERIALS };
    for (const st of item.stages) sum = add(sum, stageCost(item, st));
    for (const k of MATERIAL_KINDS) assert.equal(sum[k], item.cost[k] ?? 0, `${item.id}.${k}`);
  }
});

test('không trừ cả công trình lúc đặt: khảo sát chỉ tốn phần của khảo sát', () => {
  const s = site('house_wood');
  const cost = stepCost(s, catalogItem('house_wood')!);
  const total = catalogItem('house_wood')!.cost;
  assert.ok((cost.wood ?? 0) < (total.wood ?? 0));
});

test('không có ca thì công trình đứng yên, kể cả khi thời gian trôi', () => {
  const s: Site = { ...site('house_wood'), crew: 'pioneer' };
  assert.equal(s.delivered, true, 'khảo sát không tốn vật liệu: coi như đã giao');
  const after = settle(s, later(60 * 24 * 30));
  assert.equal(after.stageIdx, 0);
  assert.equal(after.shifts, 0);
});

test('không có đội thi công thì ca không áp vào', () => {
  const s = site('house_wood');
  assert.equal(s.crew, null);
  assert.deepEqual(applyShift(s, T0), s);
});

test('nhà gỗ đi đủ chín công đoạn theo thứ tự, mỗi công đoạn ≥ 1 ca', () => {
  const item = catalogItem('house_wood')!;
  assert.deepEqual([...item.stages], [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const seen: number[] = [];
  let s: Site = { ...site('house_wood'), crew: 'pioneer' };
  let inv = { ...RICH };
  for (let i = 0; i < 200 && !isDone(s); i++) {
    const st = visualProgress(s).stage;
    if (seen[seen.length - 1] !== st) seen.push(st);
    if (!s.delivered) {
      const r = deliver(s, inv, later(i * 70).toISOString());
      if (r.ok) {
        s = r.site;
        inv = r.inventory;
      }
    }
    s = applyShift(s, later(i * 70 + 65));
  }
  assert.ok(isDone(s));
  assert.deepEqual(seen, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  for (const st of item.stages) assert.ok(stageShifts(item, st) >= 1);
});

test('móng cần đông cứng ~1 giờ: đủ ca nhưng chưa đủ giờ thì chưa xong', () => {
  let s: Site = { ...site('house_wood'), crew: 'pioneer', stageIdx: 3 };
  s = { ...s, delivered: false };
  const r = deliver(s, RICH, T0.toISOString());
  assert.ok(r.ok);
  if (!r.ok) return;
  s = r.site;
  const need = stepShifts(s, catalogItem('house_wood')!);
  for (let i = 0; i < need; i++) s = applyShift(s, later(5));
  assert.equal(s.stageIdx, 3, 'chưa đủ giờ đông cứng');
  s = settle(s, later(BUILD.curingMinutes + 1));
  assert.equal(s.stageIdx, 4, 'đủ giờ + đủ ca thì qua móng');
});

test('hết giờ đông cứng nhưng thiếu ca thì không tự xong', () => {
  let s: Site = { ...site('house_wood'), crew: 'pioneer', stageIdx: 3, delivered: true, startedAt: T0.toISOString() };
  s = settle(s, later(600));
  assert.equal(s.stageIdx, 3);
});

test('cao ốc: dựng cần cẩu rồi xây TỪNG TẦNG — một ca không xong nhiều tầng', () => {
  const item = catalogItem('tower_glass')!;
  let s: Site = { ...site('tower_glass', 3), crew: 'tower', stageIdx: item.stages.indexOf(4), craneUp: false, delivered: false };
  const r = deliver(s, RICH, T0.toISOString());
  assert.ok(r.ok);
  if (!r.ok) return;
  s = applyShift(r.site, T0);
  assert.equal(s.craneUp, true);
  assert.deepEqual(currentStep(s, item), { kind: 'floor', floor: 0, step: 0 });
  const d = deliver(s, RICH, T0.toISOString());
  assert.ok(d.ok);
  if (!d.ok) return;
  s = applyShift(d.site, T0);
  assert.equal(s.floor ?? 0, 0, 'một ca: nửa tầng (khung + sàn)');
  assert.equal(s.floorStep, 2);
  s = applyShift(s, T0);
  assert.equal(s.floor, 1, 'ca thứ hai: xong tầng 1');
  assert.equal(s.floorStep, 0);
  assert.equal(s.delivered, false, 'tầng mới phải giao vật liệu tầng');
  assert.deepEqual(applyShift(s, T0), s, 'chưa giao vật liệu tầng thì không xây tiếp');
});

test('cao ốc 20 tầng cần nhiều ca (không vô tận, không một ca là xong)', () => {
  const seed = [...Array(200).keys()].find((k) => floorsFor(catalogItem('tower_glass')!, k) === 20)!;
  const { site: done, shifts } = buildAll(site('tower_glass', seed), (i) => later(i * 90));
  assert.ok(isDone(done));
  assert.ok(shifts >= 40 && shifts <= 80, `số ca ${shifts}`);
});

test('mọi công trình trong catalog xây xong được với đủ vật liệu + đội', () => {
  for (const item of CATALOG) {
    const { site: done } = buildAll(site(item.id), (i) => later(i * 90));
    assert.ok(isDone(done), item.id);
  }
});

test('thuê đội: phải mở khoá, phù hợp loại công trình, còn chỗ, đủ vật liệu', () => {
  const house = site('house_brick');
  assert.deepEqual(canHire('pioneer', house, [house], RICH, 3, 10), { ok: false, reason: 'unfit' });
  assert.deepEqual(canHire('builder', house, [house], RICH, 2, 10), { ok: false, reason: 'locked' });
  const wh: Site = { ...site('warehouse'), stageIdx: 99 };
  assert.deepEqual(canHire('builder', house, [house, wh], RICH, 3, 10), { ok: true });
  assert.deepEqual(canHire('builder', house, [house, wh], EMPTY_MATERIALS, 3, 10), { ok: false, reason: 'materials' });
  const busy1: Site = { ...site('house_brick'), id: 'b1', crew: 'builder' };
  const busy2: Site = { ...site('house_brick'), id: 'b2', crew: 'builder' };
  assert.deepEqual(canHire('builder', house, [house, wh, busy1, busy2], RICH, 3, 10), { ok: false, reason: 'busy' });
  const tower = site('tower_office');
  assert.deepEqual(canHire('builder', tower, [tower, wh], RICH, 5, 20), { ok: false, reason: 'unfit' });
  assert.deepEqual(canHire('tower', tower, [tower, wh], RICH, 5, 20), { ok: false, reason: 'locked' }, 'cần trạm điện đã xong');
});

test('phân ca: công trường ưu tiên nhận trước; không có ca thì không ai tiến', () => {
  const mk = (id: string, created: string): Site => {
    const s = { ...site('tent'), id, createdAt: created, crew: 'pioneer' as const };
    const r = deliver(s, RICH, T0.toISOString());
    return r.ok ? r.site : s;
  };
  const a = mk('a', '2026-09-01');
  const b = mk('b', '2026-09-02');
  const none = distributeShifts([a, b], 0, 'b', T0);
  assert.deepEqual(none.worked, {});
  const one = distributeShifts([a, b], 1, 'b', T0);
  assert.deepEqual(one.worked, { b: 1 });
  assert.equal(one.bank, 0);
});

test('dân số chỉ tính công trình đã hoàn thành', () => {
  const doing = site('house_wood');
  const done: Site = { ...site('house_wood'), id: 'done', stageIdx: 9 };
  assert.equal(populationOf([doing, done]), catalogItem('house_wood')!.population);
});

test('tiến độ hình ảnh khôi phục đúng từ dữ liệu đã lưu', () => {
  const s: Site = { ...site('tower_office', 11), stageIdx: 4, craneUp: true, floor: 6, floorStep: 2, shifts: 0, delivered: true, crew: 'tower' };
  const saved = JSON.parse(JSON.stringify(s)) as Site;
  assert.deepEqual(visualProgress(saved), visualProgress(s));
  assert.equal(visualProgress(saved).floorsDone, 6);
});

test('công trường mới không mang theo trường thừa', () => {
  const s = newSite({ id: 'x', type: 'tent', seed: 1, x: 3, y: 4, rot: 0, now: '2026-09-29T00:00:00.000Z' });
  assert.equal('now' in s, false);
  assert.equal(s.createdAt, '2026-09-29T00:00:00.000Z');
});
