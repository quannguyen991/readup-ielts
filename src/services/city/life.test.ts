import test from 'node:test';
import assert from 'node:assert/strict';

import { catalogItem } from '@/data/city/catalog';
import { entranceTile, key } from './placement';
import { sampleCity } from './sample-city';
import { isWater, tileAt } from './terrain';
import {
  activityAt,
  addNote,
  addToCollection,
  canPlaceFurniture,
  canStand,
  catchStars,
  CATCH_DAILY_CAP,
  cleanNote,
  EMPTY_HOME,
  EMPTY_SOCIAL,
  FURNITURE,
  findPath,
  makeQuestion,
  mergeCollection,
  moveAvatar,
  rollCatch,
  SPECIES,
  spawnPoint,
  toggleLike,
  walkIndex,
} from './life';

const c = sampleCity();
const ix = walkIndex({ terrain: c.terrain, works: {}, regions: c.regions, roads: c.roads, sites: c.sites });

test('không đứng được trong nhà, trên nước (trừ cầu), ngoài vùng đã mở', () => {
  const s = c.sites.find((x) => catalogItem(x.type)?.place.on === 'land')!;
  assert.equal(canStand(ix, s.x, s.y), false);
  for (let y = 0; y < c.terrain.size; y++)
    for (let x = 0; x < c.terrain.size; x++) {
      const t = tileAt(c.terrain, x, y)!;
      if (isWater(t)) assert.equal(canStand(ix, x, y), !!c.roads[key(x, y)], `ô nước ${x},${y}`);
    }
  assert.equal(canStand(ix, -1, 0), false);
});

test('đi thẳng vào tường thì trượt dọc, không xuyên qua', () => {
  const start = spawnPoint(ix, [20, 20]);
  assert.ok(canStand(ix, Math.floor(start[0]), Math.floor(start[1])));
  let p: [number, number] = start;
  for (let i = 0; i < 400; i++) {
    p = moveAvatar(ix, p, 0.1 * Math.cos(i / 17), 0.1 * Math.sin(i / 23));
    assert.ok(canStand(ix, Math.floor(p[0]), Math.floor(p[1])), `lọt vào ô cấm ở ${p}`);
  }
});

test('đứng trước cửa công trình kỹ năng thì được vào bài học của nó', () => {
  const s = c.sites.find((x) => catalogItem(x.type)?.skill && x.stageIdx >= catalogItem(x.type)!.stages.length);
  if (!s) return; // thành phố mẫu có thể chưa có công trình kỹ năng
  const it = catalogItem(s.type)!;
  const [ex, ey] = entranceTile(s.x, s.y, it.size, s.rot);
  const a = activityAt(ix, [ex + 0.5, ey + 0.5]);
  assert.equal(a?.kind, 'enter');
  assert.equal(a && a.kind === 'enter' ? a.route : '', it.skill!.route);
});

test('sát mép nước thì câu cá được', () => {
  let found = false;
  for (let y = 1; y < c.terrain.size - 1 && !found; y++)
    for (let x = 1; x < c.terrain.size - 1 && !found; x++) {
      if (!canStand(ix, x, y) || isWater(tileAt(c.terrain, x, y))) continue;
      const nearWater = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isWater(tileAt(c.terrain, x + dx!, y + dy!)) && !c.roads[key(x + dx!, y + dy!)] && c.regions.length > 0);
      if (!nearWater) continue;
      const a = activityAt(ix, [x + 0.5, y + 0.5]);
      if (a?.kind === 'fish') found = true;
    }
  assert.ok(found, 'không có chỗ nào câu cá được trên bản đồ mẫu');
});

test('độ hiếm: r nhỏ ra loài thường, r sát 1 ra loài huyền thoại; trần sao mỗi ngày', () => {
  assert.equal(rollCatch('fish', 0).rarity, 1);
  assert.equal(rollCatch('bug', 0.99999).rarity, 4);
  let legendary = 0;
  for (let i = 0; i < 1000; i++) if (rollCatch('fish', i / 1000).rarity === 4) legendary++;
  assert.ok(legendary >= 15 && legendary <= 25, `huyền thoại ${legendary}/1000`);
  assert.equal(catchStars(4, 0), 20);
  assert.equal(catchStars(4, CATCH_DAILY_CAP - 5), 5);
  assert.equal(catchStars(1, CATCH_DAILY_CAP), 0);
  assert.equal(new Set(SPECIES.map((s) => s.id)).size, SPECIES.length);
});

test('bộ sưu tập: gộp hai máy lấy số lớn hơn và ngày đầu sớm hơn', () => {
  const a = addToCollection(addToCollection({}, 'fish-ro', '2026-10-01'), 'fish-ro', '2026-10-02');
  const b = addToCollection({}, 'fish-ro', '2026-09-30');
  assert.deepEqual(mergeCollection(a, b)['fish-ro'], { n: 2, first: '2026-09-30' });
});

test('câu hỏi: đáp án đúng nằm đúng chỗ, bốn nghĩa khác nhau', () => {
  const pool = Array.from({ length: 12 }, (_, i) => ({ word: `w${i}`, meaningVi: `nghĩa ${i}` }));
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 50; k++) {
    const q = makeQuestion([pool[3]!], pool, rand)!;
    assert.equal(q.word, 'w3');
    assert.equal(q.options[q.answer], 'nghĩa 3');
    assert.equal(new Set(q.options).size, 4);
  }
  assert.equal(makeQuestion([], pool.slice(0, 3), rand), null);
});

test('nội thất: không chồng đồ sàn, thảm nằm dưới được, đồ treo chỉ sát tường', () => {
  const layout = { ...EMPTY_HOME, items: [{ uid: 'a', item: 'bed', x: 0, y: 0, rot: 0 as const }] };
  assert.deepEqual(canPlaceFurniture(layout, { item: 'chair', x: 1, y: 2, rot: 0 }), { ok: false, reason: 'overlap' });
  assert.deepEqual(canPlaceFurniture(layout, { item: 'rug-round', x: 0, y: 0, rot: 0 }), { ok: true });
  assert.deepEqual(canPlaceFurniture(layout, { item: 'poster', x: 3, y: 1, rot: 0 }), { ok: false, reason: 'wall_only' });
  assert.deepEqual(canPlaceFurniture(layout, { item: 'poster', x: 0, y: 0, rot: 0 }), { ok: true });
  assert.deepEqual(canPlaceFurniture(layout, { item: 'sofa', x: 6, y: 5, rot: 0 }), { ok: false, reason: 'outside' });
  assert.deepEqual(canPlaceFurniture(layout, { item: 'bed', x: 0, y: 0, rot: 0 }, 'a'), { ok: true });
  assert.equal(new Set(FURNITURE.map((f) => f.id)).size, FURNITURE.length);
});

test('sổ lưu bút: làm sạch lời nhắn, mỗi người một lời mỗi ngày; thích bấm lại là bỏ', () => {
  assert.equal(cleanNote('  xin\u0000 chào\n\nbạn  '), 'xin chào bạn');
  assert.equal(cleanNote('a'.repeat(500)).length, 120);
  const n = { by: 'u1', name: 'A', text: 'Đẹp quá', at: '2026-10-01T03:00:00Z' };
  const r1 = addNote(EMPTY_SOCIAL, n);
  assert.ok(r1.ok);
  const r2 = addNote(r1.ok ? r1.social : EMPTY_SOCIAL, { ...n, at: '2026-10-01T09:00:00Z' });
  assert.deepEqual(r2, { ok: false, reason: 'daily' });
  const l1 = toggleLike(EMPTY_SOCIAL, 'u1');
  assert.equal(l1.liked, true);
  assert.deepEqual(toggleLike(l1.social, 'u1').social.likes, []);
});

test('bấm tới đâu thì tìm đường tới đó, bấm vào nhà thì dừng sát nhà', () => {
  const start = spawnPoint(ix, [20, 20]);
  const from: [number, number] = [Math.floor(start[0]), Math.floor(start[1])];
  const s = c.sites.find((x) => catalogItem(x.type)?.place.on === 'land')!;
  const path = findPath(ix, from, [s.x, s.y]);
  assert.ok(path && path.length > 0, 'không tìm được đường tới nhà');
  let cur = from;
  for (const [px, py] of path!) {
    const nx = Math.floor(px);
    const ny = Math.floor(py);
    assert.ok(Math.abs(nx - cur[0]) <= 1 && Math.abs(ny - cur[1]) <= 1);
    assert.ok(canStand(ix, nx, ny));
    cur = [nx, ny];
  }
  assert.ok(Math.hypot(cur[0] - s.x, cur[1] - s.y) <= 6);
});
