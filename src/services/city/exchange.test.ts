import { test } from 'node:test';
import assert from 'node:assert/strict';

import { boughtToday, ECONOMY, EMPTY_ECONOMY, exchange, exchangeCost, exchangeRoom, recordContribution, shiftDay, type EconomyState } from './economy';
import { EMPTY_CITY, mergeCity, type CityPayload } from './sync';

const DAY = '2026-09-30';

test('bảng giá: gỗ 4, gạch 5, đá 6, thép 15, kính 20 sao / đơn vị', () => {
  assert.deepEqual(ECONOMY.exchange.price, { wood: 4, brick: 5, stone: 6, steel: 15, glass: 20 });
  assert.equal(exchangeCost({ brick: 12 }), 60);
  assert.equal(exchangeCost({ wood: 2, glass: 1 }), 28);
});

test('đổi sao → cộng kho, ghi sổ, trả đúng giá', () => {
  const r = exchange(EMPTY_ECONOMY, { brick: 12 }, 100, DAY, 'b1');
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.cost, 60);
  assert.equal(r.state.inventory.brick, 12);
  assert.deepEqual(r.state.ledger?.b1, { day: DAY, src: 'buy', delta: { brick: 12 }, stars: 60 });
  assert.equal(boughtToday(r.state, DAY).brick, 12);
});

test('thiếu sao → không đổi gì', () => {
  const r = exchange(EMPTY_ECONOMY, { steel: 4 }, 59, DAY, 'x');
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, 'stars');
});

test('đơn không hợp lệ: âm, lẻ, rỗng, mã trùng', () => {
  assert.equal(exchange(EMPTY_ECONOMY, { wood: -1 }, 1e6, DAY, 'a').ok, false);
  assert.equal(exchange(EMPTY_ECONOMY, { wood: 1.5 }, 1e6, DAY, 'a').ok, false);
  assert.equal(exchange(EMPTY_ECONOMY, {}, 1e6, DAY, 'a').ok, false);
  const r = exchange(EMPTY_ECONOMY, { wood: 1 }, 1e6, DAY, 'a');
  assert.ok(r.ok);
  if (!r.ok) return;
  const again = exchange(r.state, { wood: 1 }, 1e6, DAY, 'a');
  assert.equal(again.ok, false);
  if (!again.ok) assert.equal(again.reason, 'duplicate');
});

test('trần mua mỗi ngày từng loại; sang ngày mới thì mở lại', () => {
  const cap = ECONOMY.exchange.dailyCap.glass;
  let s: EconomyState = EMPTY_ECONOMY;
  const r1 = exchange(s, { glass: cap - 2 }, 1e6, DAY, 'g1');
  assert.ok(r1.ok);
  if (r1.ok) s = r1.state;
  const r2 = exchange(s, { glass: 3 }, 1e6, DAY, 'g2');
  assert.equal(r2.ok, false);
  if (!r2.ok) {
    assert.equal(r2.reason, 'capped');
    assert.equal(r2.room?.glass, 2);
  }
  assert.equal(exchangeRoom(s, DAY).glass, 2);
  // Đơn nhiều loại: một loại vượt trần thì cả đơn bị từ chối (không đổi một nửa).
  const r3 = exchange(s, { glass: 3, wood: 5 }, 1e6, DAY, 'g3');
  assert.equal(r3.ok, false);
  const tomorrow = shiftDay(DAY, 1);
  assert.equal(exchangeRoom(s, tomorrow).glass, cap);
  assert.ok(exchange(s, { glass: 3 }, 1e6, tomorrow, 'g4').ok);
});

test('góp Trung tâm: trừ kho, ghi sổ âm, gọi lại cùng mã không trừ hai lần', () => {
  const s0: EconomyState = { ...EMPTY_ECONOMY, inventory: { wood: 10, stone: 5, brick: 0, steel: 0, glass: 0 } };
  const s1 = recordContribution(s0, { wood: 4, stone: 5 }, DAY, 'h1');
  assert.deepEqual(s1.inventory, { wood: 6, stone: 0, brick: 0, steel: 0, glass: 0 });
  assert.deepEqual(s1.ledger?.h1?.delta, { wood: -4, stone: -5 });
  assert.equal(recordContribution(s1, { wood: 4 }, DAY, 'h1'), s1);
  // Góp không tính vào trần đổi sao.
  assert.equal(boughtToday(s1, DAY).wood, 0);
});

const city = (over: Partial<CityPayload>): CityPayload => ({ ...EMPTY_CITY, terrain: { kind: 'plains', seed: 1 }, ...over });

test('gộp hai máy: vật liệu đổi bằng sao ở máy "học ít hơn" không bị mất', () => {
  // Máy tính đổi 12 gạch; điện thoại học thêm (lifetime cao hơn) nhưng chưa thấy lần đổi.
  const pc = city({ inventory: { wood: 0, stone: 0, brick: 12, steel: 0, glass: 0 }, lifetime: 5, ledger: { b1: { day: DAY, src: 'buy', delta: { brick: 12 }, stars: 60 } } });
  const phone = city({ inventory: { wood: 7, stone: 0, brick: 0, steel: 0, glass: 0 }, lifetime: 12 });
  const m = mergeCity(pc, phone);
  assert.equal(m.lifetime, 12);
  assert.equal(m.inventory.wood, 7);
  assert.equal(m.inventory.brick, 12);
  assert.ok(m.ledger?.b1);
  // Gộp lại lần nữa không cộng lần hai.
  const again = mergeCity(m, pc);
  assert.equal(again.inventory.brick, 12);
});

test('gộp hai máy: vật liệu đã góp không hiện lại để góp lần hai', () => {
  const pc = city({ inventory: { wood: 0, stone: 0, brick: 0, steel: 0, glass: 0 }, lifetime: 20, ledger: { h1: { day: DAY, src: 'hub', delta: { wood: -20 } } } });
  const phone = city({ inventory: { wood: 25, stone: 0, brick: 0, steel: 0, glass: 0 }, lifetime: 25 });
  const m = mergeCity(pc, phone);
  assert.equal(m.inventory.wood, 5);
});

test('dòng sổ quá hạn giữ sổ thì không áp bù', () => {
  const old = shiftDay(DAY, -(ECONOMY.ledger.keepDays + 3));
  const a = city({ lifetime: 1, ledger: { old1: { day: old, src: 'buy', delta: { wood: 9 } } } });
  const b = city({ lifetime: 9, ledger: { n1: { day: DAY, src: 'buy', delta: { stone: 1 } } }, inventory: { wood: 0, stone: 1, brick: 0, steel: 0, glass: 0 } });
  const m = mergeCity(a, b);
  assert.equal(m.inventory.wood, 0);
});

test('payload cũ không có sổ vẫn gộp được', () => {
  const a = city({ lifetime: 3 });
  delete (a as Partial<CityPayload>).ledger;
  const b = city({ lifetime: 1 });
  delete (b as Partial<CityPayload>).ledger;
  assert.equal(mergeCity(a, b).lifetime, 3);
});
