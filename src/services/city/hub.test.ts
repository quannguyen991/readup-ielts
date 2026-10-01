import { test } from 'node:test';
import assert from 'node:assert/strict';

import { catalogItem } from '@/data/city/catalog';
import {
  addHubNote,
  aggregateHub,
  applyContribution,
  cleanHubNote,
  cleanHubUser,
  EMPTY_HUB_USER,
  floorShortfall,
  HUB,
  HUB_TOWERS,
  hubProgress,
  hubRoom,
  rankOf,
  type HubRow,
} from './hub';
import { hubLayout, hubSites, seedForFloors } from './hub-layout';
import { floorsFor, isDone } from './construction';
import { MATERIAL_KINDS, type Materials } from './materials';

const DAY = '2026-10-01';
const AT = '2026-10-01T08:00:00.000Z';
const times = (m: Partial<Materials>, n: number): Materials => {
  const out = { wood: 0, stone: 0, brick: 0, steel: 0, glass: 0 };
  for (const k of MATERIAL_KINDS) out[k] = (m[k] ?? 0) * n;
  return out;
};

test('năm tháp: số tầng nằm trong khoảng của loại cao ốc (để sinh hình đúng số tầng)', () => {
  assert.equal(HUB_TOWERS.length, 5);
  for (const t of HUB_TOWERS) {
    const it = catalogItem(t.type);
    assert.ok(it?.floors, t.type);
    assert.ok(t.floors >= it!.floors![0] && t.floors <= it!.floors![1], `${t.id}: ${t.floors}`);
    assert.equal(floorsFor(it!, seedForFloors(t.type, t.floors, 12345)), t.floors);
  }
});

test('tiến độ: chưa góp gì → tháp 1 đang xây tầng 1, các tháp sau chưa tới lượt', () => {
  const p = hubProgress({});
  assert.equal(p.current, 0);
  assert.equal(p.towers[0]!.active, true);
  assert.equal(p.towers[0]!.floorsBuilt, 0);
  assert.equal(p.towers[0]!.floor!.fraction, 0);
  assert.ok(p.towers.slice(1).every((t) => !t.active && !t.done && t.floorsBuilt === 0));
});

test('tiến độ: đổ đầy tháp 1 từng tầng rồi mới sang tháp 2', () => {
  const t0 = HUB_TOWERS[0]!;
  const t1 = HUB_TOWERS[1]!;
  const total = times(t0.floorCost, t0.floors);
  // cộng đủ 2 tầng của tháp 2
  for (const k of MATERIAL_KINDS) total[k] += (t1.floorCost[k] ?? 0) * 2;
  const p = hubProgress(total);
  assert.equal(p.towers[0]!.done, true);
  assert.equal(p.towers[1]!.active, true);
  assert.equal(p.towers[1]!.floorsBuilt, 2);
  assert.equal(p.current, 1);
  assert.equal(p.floorsBuilt, t0.floors + 2);
});

test('tiến độ: thiếu một loại thì tầng đứng lại, hiện đúng loại còn thiếu', () => {
  const t0 = HUB_TOWERS[0]!;
  const total = times(t0.floorCost, 3);
  total.glass = (t0.floorCost.glass ?? 0) * 2; // kính chỉ đủ 2 tầng
  const p = hubProgress(total);
  assert.equal(p.towers[0]!.floorsBuilt, 2);
  const miss = floorShortfall(p.towers[0]);
  assert.deepEqual(Object.keys(miss), ['glass']);
  assert.equal(miss.glass, t0.floorCost.glass);
});

test('tiến độ tất định và không âm; góp đủ cả khu → xong hết', () => {
  const all = { wood: 0, stone: 0, brick: 0, steel: 0, glass: 0 };
  for (const t of HUB_TOWERS) for (const k of MATERIAL_KINDS) all[k] += (t.floorCost[k] ?? 0) * t.floors;
  const p = hubProgress(all);
  assert.equal(p.current, -1);
  assert.ok(p.towers.every((t) => t.done));
  assert.equal(p.floorsBuilt, p.floorsTotal);
  assert.deepEqual(hubProgress(all), p);
  assert.deepEqual(hubProgress({ wood: -50 }).towers[0]!.floor!.have.wood, 0);
});

test('góp: cộng dồn, trần ngày, mã trùng không cộng hai lần', () => {
  const r1 = applyContribution(EMPTY_HUB_USER, { wood: 10, stone: 5 }, 'c1', AT, DAY);
  assert.ok(r1.ok);
  if (!r1.ok) return;
  assert.equal(r1.units, 15);
  assert.equal(r1.user.total.wood, 10);
  assert.equal(hubRoom(r1.user, DAY), HUB.dailyUnitCap - 15);
  const dup = applyContribution(r1.user, { wood: 10, stone: 5 }, 'c1', AT, DAY);
  assert.ok(dup.ok && dup.duplicate);
  if (dup.ok) assert.equal(dup.user.total.wood, 10);
  const over = applyContribution(r1.user, { brick: HUB.dailyUnitCap }, 'c2', AT, DAY);
  assert.equal(over.ok, false);
  if (!over.ok) {
    assert.equal(over.reason, 'daily');
    assert.equal(over.room, HUB.dailyUnitCap - 15);
  }
  // ngày mới → trần mở lại
  assert.equal(hubRoom(r1.user, '2026-10-02'), HUB.dailyUnitCap);
});

test('góp: dữ liệu bẩn bị từ chối', () => {
  for (const bad of [{ wood: -1 }, { wood: 1.5 }, { wood: '3' }, { wood: HUB.maxPerKind + 1 }]) {
    const r = applyContribution(EMPTY_HUB_USER, bad, 'x', AT, DAY);
    assert.equal(r.ok, false, JSON.stringify(bad));
  }
  const empty = applyContribution(EMPTY_HUB_USER, {}, 'x', AT, DAY);
  assert.equal(empty.ok, false);
  assert.equal(applyContribution(EMPTY_HUB_USER, { wood: 1 }, '', AT, DAY).ok, false);
});

test('bảng tin: làm sạch chữ, tối đa 3 lời mỗi ngày, giữ 5 lời gần nhất', () => {
  assert.equal(cleanHubNote('  xin‮chào \n  mọi   người '), 'xin chào mọi người');
  assert.equal(cleanHubNote('a'.repeat(500)).length, HUB.noteMax);
  let u = EMPTY_HUB_USER;
  for (let i = 0; i < HUB.notesPerDay; i++) {
    const r = addHubNote(u, `lời ${i}`, AT, DAY);
    assert.ok(r.ok);
    if (r.ok) u = r.user;
  }
  const r = addHubNote(u, 'thêm', AT, DAY);
  assert.equal(r.ok, false);
  assert.equal(addHubNote(EMPTY_HUB_USER, '   ', AT, DAY).ok, false);
});

test('làm sạch dòng đọc từ cơ sở dữ liệu', () => {
  const u = cleanHubUser({ total: { wood: '9', stone: 4.7, glass: -3 }, recent: 'x', notes: [{ text: 'hi', at: AT }, { text: 5 }], ids: [1, 'a'] });
  assert.deepEqual(u.total, { wood: 0, stone: 4, brick: 0, steel: 0, glass: 0 });
  assert.deepEqual(u.recent, []);
  assert.equal(u.notes.length, 1);
  assert.deepEqual(u.ids, ['a']);
});

test('gộp mọi người: tổng, bảng vàng theo số đã góp, hoạt động và bảng tin mới nhất trước', () => {
  const a = applyContribution(EMPTY_HUB_USER, { wood: 30 }, 'a1', '2026-10-01T01:00:00Z', DAY);
  const b = applyContribution(EMPTY_HUB_USER, { stone: 10, glass: 2 }, 'b1', '2026-10-01T02:00:00Z', DAY);
  assert.ok(a.ok && b.ok);
  if (!a.ok || !b.ok) return;
  const bn = addHubNote(b.user, 'Cố lên mọi người!', '2026-10-01T03:00:00Z', DAY);
  assert.ok(bn.ok);
  if (!bn.ok) return;
  const rows: HubRow[] = [
    { key: 'A', name: 'An', user: a.user },
    { key: 'B', name: 'Bình', user: bn.user },
    { key: 'C', name: 'Chi', user: EMPTY_HUB_USER },
  ];
  const g = aggregateHub(rows);
  assert.equal(g.total.wood, 30);
  assert.equal(g.total.stone, 10);
  assert.equal(g.people, 2);
  assert.deepEqual(g.contributors.map((c) => c.name), ['An', 'Bình']);
  assert.equal(g.activity[0]!.name, 'Bình');
  assert.equal(g.board[0]!.text, 'Cố lên mọi người!');
  assert.equal(rankOf(rows, 'A'), 1);
  assert.equal(rankOf(rows, 'B'), 2);
  assert.equal(rankOf(rows, 'C'), 0);
});

test('bản đồ Trung tâm: đặt đủ năm tháp, đúng số tầng, tất định', () => {
  const l = hubLayout();
  assert.equal(l.towers.length, HUB_TOWERS.length);
  l.towers.forEach((s, i) => {
    assert.equal(s.type, HUB_TOWERS[i]!.type);
    assert.equal(s.floors, HUB_TOWERS[i]!.floors);
  });
  assert.ok(l.decor.some((s) => s.type === 'power_station'));
  assert.ok(l.decor.some((s) => s.type === 'fountain_plaza'));
  const again = hubLayout();
  assert.equal(again, l);
});

test('bản đồ Trung tâm: tiến độ thật áp vào tháp (xong / đang lên tầng / mới khảo sát)', () => {
  const t0 = HUB_TOWERS[0]!;
  const total = times(t0.floorCost, t0.floors + 0);
  const t1 = HUB_TOWERS[1]!;
  for (const k of MATERIAL_KINDS) total[k] += (t1.floorCost[k] ?? 0) * 3;
  const l = hubLayout();
  const sites = hubSites(l, hubProgress(total));
  const tw = (i: number) => sites.find((s) => s.id === l.towers[i]!.id)!;
  assert.ok(isDone(tw(0)));
  assert.equal(tw(1).floor, 3);
  assert.equal(tw(1).craneUp, true);
  assert.ok(!isDone(tw(1)));
  assert.equal(tw(2).stageIdx, 0);
  assert.equal(sites.length, l.decor.length + l.towers.length);
});
