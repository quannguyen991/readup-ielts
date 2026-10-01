import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mainPoisOfCity, getPoiContent } from '@/data/travel/pois';
import { ticketsOf, coinsOf } from './economy';
import { applyVisit, coinsFor, isPoiUnlocked, passportLevelOf, starsFor } from './rewards';
import type { TravelState } from './types';

type Slice = Pick<TravelState, 'poi' | 'ledger' | 'souvenirs' | 'visited'>;
const empty = (): Slice => ({ poi: {}, ledger: {}, souvenirs: {}, visited: {} });
const AT = '2026-10-02T09:00:00.000Z';
const poi = (id: string) => getPoiContent(id)!;

test('sao: ≥ 80% 3 sao, ≥ 60% 2 sao, ≥ 40% 1 sao, còn lại 0', () => {
  assert.equal(starsFor(7, 8), 3);
  assert.equal(starsFor(4, 5), 3);
  assert.equal(starsFor(5, 7), 2); // 71%
  assert.equal(starsFor(5, 8), 2); // 62,5%
  assert.equal(starsFor(4, 7), 1); // 57%
  assert.equal(starsFor(3, 8), 0); // 37,5%
  assert.equal(starsFor(0, 0), 0);
});

test('xu = cơ sở × (1 + 0,25 × sao); chỉ khi đạt; làm lại còn một nửa', () => {
  assert.equal(coinsFor(8, 3, false), 14); // 8 × 1,75
  assert.equal(coinsFor(8, 2, false), 12);
  assert.equal(coinsFor(8, 1, false), 0);
  assert.equal(coinsFor(8, 0, false), 0);
  assert.equal(coinsFor(8, 3, true), 7);
  assert.equal(coinsFor(0, 3, false), 0);
});

test('hoàn thành lần đầu: có xu, quà lưu niệm, ghi tiến độ', () => {
  const p = poi('singapore-changi');
  const { patch, result } = applyVisit(empty(), { poi: p, correct: 7, total: 8, nowIso: AT });
  assert.equal(result.stars, 3);
  assert.equal(result.firstCompletion, true);
  assert.equal(result.souvenir, 'sv-sg-boarding');
  assert.equal(result.coins, coinsFor(p.reward.coins, 3, false));
  assert.equal(patch.coins, result.coins);
  assert.ok(patch.souvenirs['sv-sg-boarding']);
  assert.equal(patch.poi[p.id]!.best, 3);
  assert.equal(patch.poi[p.id]!.runs, 1);
  assert.equal(patch.visited.singapore?.stamp, false);
  assert.equal(result.levelUnlocked, 2, '3 sao mở mức cao hơn');
  assert.equal(patch.poi[p.id]!.level, 2);
});

test('làm lại: xu giảm một nửa, không có quà lần hai, best chỉ tăng', () => {
  const p = poi('singapore-changi');
  const first = applyVisit(empty(), { poi: p, correct: 5, total: 7, nowIso: AT });
  assert.equal(first.result.stars, 2);
  const state: Slice = { ...empty(), ...first.patch };
  const again = applyVisit(state, { poi: p, correct: 7, total: 7, nowIso: AT });
  assert.equal(again.result.firstCompletion, false);
  assert.equal(again.result.souvenir, undefined);
  assert.equal(again.result.coins, coinsFor(p.reward.coins, 3, true));
  assert.equal(again.patch.poi[p.id]!.best, 3);
  assert.equal(again.patch.poi[p.id]!.runs, 2);
  const worse = applyVisit({ ...state, ...again.patch }, { poi: p, correct: 3, total: 7, nowIso: AT });
  assert.equal(worse.patch.poi[p.id]!.best, 3, 'lượt tệ hơn không hạ điểm cao');
  assert.equal(worse.result.coins, 0);
});

test('lượt chưa đạt: không xu, không quà, không mở gì', () => {
  const p = poi('singapore-changi');
  const { patch, result } = applyVisit(empty(), { poi: p, correct: 2, total: 7, nowIso: AT });
  assert.equal(result.passed, false);
  assert.equal(result.coins, 0);
  assert.equal(patch.coins, 0);
  assert.deepEqual(patch.souvenirs, {});
  assert.equal(patch.poi[p.id]!.best, 0);
  assert.equal(patch.poi[p.id]!.runs, 1);
});

test('hai máy ghi cùng lượt: mã khoản xu trùng nhau nên không cộng đôi', () => {
  const p = poi('singapore-changi');
  const a = applyVisit(empty(), { poi: p, correct: 7, total: 7, nowIso: AT });
  const b = applyVisit(empty(), { poi: p, correct: 7, total: 7, nowIso: AT });
  assert.deepEqual(a.patch.ledger, b.patch.ledger);
});

test('đạt hết địa điểm chính: đóng dấu một lần, thưởng 1 vé, cấp hộ chiếu tăng', () => {
  const ids = mainPoisOfCity('singapore').map((x) => x.id);
  let state = empty();
  let stamped = 0;
  let bonus = 0;
  for (const id of ids) {
    const { patch, result } = applyVisit(state, { poi: poi(id), correct: 6, total: 7, nowIso: AT });
    state = { ...state, ...patch };
    if (result.stamp) stamped += 1;
    bonus += result.bonusTickets;
  }
  assert.equal(stamped, 1);
  assert.equal(bonus, 1);
  assert.equal(state.visited.singapore?.stamp, true);
  assert.equal(ticketsOf(state.ledger), 1);
  assert.ok(coinsOf(state.ledger) > 0);
  const replay = applyVisit(state, { poi: poi(ids[0]!), correct: 7, total: 7, nowIso: AT });
  assert.equal(replay.result.stamp, undefined, 'không đóng dấu lần hai');
  assert.equal(ticketsOf(replay.patch.ledger), 1);
  assert.ok(replay.patch.passportLevel >= 2);
});

test('ô bí mật không tính vào việc đóng dấu', () => {
  const ids = mainPoisOfCity('singapore').map((x) => x.id);
  assert.ok(!ids.includes('singapore-merlion'));
});

test('cấp hộ chiếu: 1 + dấu + quà/6', () => {
  assert.equal(passportLevelOf(0, 0), 1);
  assert.equal(passportLevelOf(2, 0), 3);
  assert.equal(passportLevelOf(1, 12), 4);
});

test('mở khoá địa điểm: theo `after`; ô bí mật cần đạt hết địa điểm chính', () => {
  const none = { poi: {} };
  assert.equal(isPoiUnlocked(none, poi('singapore-changi')), true);
  assert.equal(isPoiUnlocked(none, poi('singapore-mrt')), false);
  const afterChangi = { poi: { 'singapore-changi': { best: 2 as const, runs: 1, level: 1 as const, lastAt: '' } } };
  assert.equal(isPoiUnlocked(afterChangi, poi('singapore-mrt')), true);
  assert.equal(isPoiUnlocked(afterChangi, poi('singapore-mbs')), false);
  const oneStar = { poi: { 'singapore-changi': { best: 1 as const, runs: 1, level: 1 as const, lastAt: '' } } };
  assert.equal(isPoiUnlocked(oneStar, poi('singapore-mrt')), false, '1 sao chưa mở chỗ kế');
  assert.equal(isPoiUnlocked(none, poi('singapore-merlion')), false);
  const all = Object.fromEntries(mainPoisOfCity('singapore').map((x) => [x.id, { best: 2 as const, runs: 1, level: 1 as const, lastAt: '' }]));
  assert.equal(isPoiUnlocked({ poi: all }, poi('singapore-merlion')), true);
});
