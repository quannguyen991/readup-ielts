import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ledgerAdd } from './economy';
import { emptyTravel, mergeTravel, normalizeTravel, pruneSeen, withDerived, type TravelPayload } from './sync';

const NOW = Date.parse('2026-10-02T12:00:00Z');
const make = (over: Partial<TravelPayload> = {}): TravelPayload => withDerived({ ...emptyTravel('2026-10-02'), ...over });

test('gộp với bản máy chủ rỗng: giữ nguyên bản trên máy', () => {
  const a = make({ ledger: { 'tk:welcome': 2 } });
  assert.equal(mergeTravel(a, null, NOW).tickets, 2);
  assert.equal(mergeTravel(a, undefined, NOW).tickets, 2);
});

test('sổ cái: hợp theo mã, khoản trùng không cộng đôi, vé và xu tính lại', () => {
  const a = make({ ledger: { 'tk:welcome': 2, 'tk:customs:2026-10-02:1': 1, 'co:visit:p:1': 10 } });
  const b = make({ ledger: { 'tk:welcome': 2, 'tk:customs:2026-10-02:1': 1, 'tk:customs:2026-10-02:2': 1, 'co:visit:q:1': 5 } });
  const m = mergeTravel(a, b, NOW);
  assert.equal(m.tickets, 4);
  assert.equal(m.coins, 15);
  assert.equal(Object.keys(m.ledger).length, 5);
});

test('khoản chi ở một máy được trừ sau khi gộp', () => {
  const base = ledgerAdd({}, 'tk:welcome', 2);
  const a = make({ ledger: ledgerAdd(base, 'tk:fly:hanoi>singapore:111', -1) });
  const b = make({ ledger: base });
  assert.equal(mergeTravel(a, b, NOW).tickets, 1);
  assert.equal(mergeTravel(b, a, NOW).tickets, 1);
});

test('gộp giao hoán với vé / xu / tiến độ', () => {
  const a = make({ ledger: { 'tk:a': 1 }, poi: { x: { best: 3, runs: 2, level: 2, lastAt: '2026-10-01' } } });
  const b = make({ ledger: { 'tk:b': 1 }, poi: { x: { best: 1, runs: 5, level: 1, lastAt: '2026-10-02' } } });
  const ab = mergeTravel(a, b, NOW);
  const ba = mergeTravel(b, a, NOW);
  assert.equal(ab.tickets, ba.tickets);
  assert.deepEqual(ab.poi, ba.poi);
});

test('tiến độ địa điểm: best, runs, level lấy số lớn; lastAt lấy mới hơn', () => {
  const a = make({ poi: { x: { best: 3, runs: 2, level: 2, lastAt: '2026-10-01' } } });
  const b = make({ poi: { x: { best: 1, runs: 5, level: 1, lastAt: '2026-10-02' }, y: { best: 2, runs: 1, level: 1, lastAt: '' } } });
  const m = mergeTravel(a, b, NOW);
  assert.deepEqual(m.poi.x, { best: 3, runs: 5, level: 2, lastAt: '2026-10-02' });
  assert.equal(m.poi.y?.best, 2);
});

test('đã đến / quà lưu niệm: hợp; dấu hộ chiếu bên nào có thì có; cấp hộ chiếu tính lại', () => {
  const a = make({ visited: { hanoi: { stamp: false, firstAt: '2026-10-02T08:00:00Z' }, singapore: { stamp: true, firstAt: '2026-10-03T00:00:00Z' } }, souvenirs: { 'sv-a': true } });
  const b = make({ visited: { hanoi: { stamp: true, firstAt: '2026-10-01T08:00:00Z' }, london: { stamp: false, firstAt: '2026-10-04T00:00:00Z' } }, souvenirs: { 'sv-b': true } });
  const m = mergeTravel(a, b, NOW);
  assert.equal(m.visited.hanoi?.stamp, true);
  assert.equal(m.visited.hanoi?.firstAt, '2026-10-01T08:00:00Z');
  assert.ok(m.visited.singapore && m.visited.london);
  assert.deepEqual(Object.keys(m.souvenirs).sort(), ['sv-a', 'sv-b']);
  assert.equal(m.passportLevel, 1 + 2 + 0);
});

test('hạn mức ngày: cùng ngày lấy số lớn, ngày mới hơn thắng', () => {
  const a = make({ dailyCaps: { day: '2026-10-02', custom: 3, review: 0, stars: 1, reviewWords: 4 } });
  const b = make({ dailyCaps: { day: '2026-10-02', custom: 1, review: 2, stars: 0, reviewWords: 20 } });
  assert.deepEqual(mergeTravel(a, b, NOW).dailyCaps, { day: '2026-10-02', custom: 3, review: 2, stars: 1, reviewWords: 20 });
  const c = make({ dailyCaps: { day: '2026-10-03', custom: 0, review: 0, stars: 0 } });
  assert.equal(mergeTravel(a, c, NOW).dailyCaps.day, '2026-10-03');
});

test('vị trí, thành phố, tuỳ chọn: bản có mốc mới hơn thắng', () => {
  const old = make({ city: 'hanoi', pos: { x: 1, y: 1 }, prefs: { name: 'Cũ', outfit: 0, sound: true }, updatedAt: '2026-10-02T08:00:00Z' });
  const fresh = make({ city: 'singapore', pos: { x: 9, y: 4 }, prefs: { name: 'Mới', outfit: 2, sound: false }, updatedAt: '2026-10-02T09:00:00Z' });
  for (const [l, r] of [[old, fresh], [fresh, old]] as const) {
    const m = mergeTravel(l, r, NOW);
    assert.equal(m.city, 'singapore');
    assert.deepEqual(m.pos, { x: 9, y: 4 });
    assert.equal(m.prefs.name, 'Mới');
    assert.equal(m.updatedAt, '2026-10-02T09:00:00Z');
  }
});

test('onboarded: bên nào đã qua thì đã qua', () => {
  assert.equal(mergeTravel(make({ onboarded: false }), make({ onboarded: true }), NOW).onboarded, true);
});

test('câu đã làm: hợp, giữ mốc muộn hơn, bỏ mục quá 48 giờ', () => {
  const recent = new Date(NOW - 3600_000).toISOString();
  const later = new Date(NOW - 1800_000).toISOString();
  const stale = new Date(NOW - 72 * 3600_000).toISOString();
  const a = make({ seen: { k1: recent, old: stale } });
  const b = make({ seen: { k1: later, k2: recent } });
  const m = mergeTravel(a, b, NOW);
  assert.equal(m.seen!.k1, later);
  assert.ok(m.seen!.k2);
  assert.equal(m.seen!.old, undefined);
  assert.deepEqual(pruneSeen({ x: stale }, NOW), {});
});

test('chuẩn hoá dữ liệu lạ không làm sập và không tạo số âm / NaN', () => {
  const junk = normalizeTravel({ ledger: { 'tk:a': 'x', 'tk:b': 3, 'co:z': Number.NaN }, poi: { p: { best: 99, runs: -4, level: 0 } }, city: 'mars', pos: 'oops', visited: { hanoi: 1, rome: { stamp: true } }, prefs: { name: 'a'.repeat(100) } });
  assert.deepEqual(junk.ledger, { 'tk:b': 3 });
  assert.equal(junk.tickets, 3);
  assert.equal(junk.city, 'hanoi');
  assert.deepEqual(junk.poi.p, { best: 3, runs: 0, level: 1, lastAt: '' });
  assert.equal(junk.prefs.name.length, 24);
  assert.ok(junk.visited.rome?.stamp);
  assert.deepEqual(normalizeTravel(null), emptyTravel());
  assert.deepEqual(normalizeTravel('x').ledger, {});
});

test('khoá đồng bộ đã đăng ký trong engine', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../sync/stores.ts', import.meta.url), 'utf8');
  assert.ok(src.includes("key: 'travel'") && src.includes('registerSyncedStore(travelStore)'));
});
