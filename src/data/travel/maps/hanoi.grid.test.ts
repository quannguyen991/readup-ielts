import assert from 'node:assert/strict';
import test from 'node:test';

import { buildWorld, isBlockedAt, pathField } from '@/components/travel/engine/grid';
import { poisOfCity } from '@/data/travel/pois';
import { findPath } from '@/services/travel/pathfinding';
import type { CityMap } from '@/services/travel/types';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { geoToGrid, hanoiGrid, HANOI_ART_SLUGS, HANOI_GEO } from './hanoi.grid';

const m: CityMap = hanoiGrid;
const { w, h } = m.size;
const count = (ch: string) => m.layers.ground.join('').split(ch).length - 1;

test('lưới Hà Nội: đúng số dòng và số cột ở mọi lớp', () => {
  assert.equal(m.id, 'hanoi');
  for (const layer of Object.values(m.layers)) {
    assert.equal(layer.length, h);
    for (const row of layer) assert.equal(row.length, w);
  }
});

test('đủ đúng các địa điểm trong danh mục, mỗi địa điểm một lần', () => {
  const want = poisOfCity('hanoi').map((c) => c.id).sort();
  const got = m.pois.map((p) => p.id).sort();
  assert.deepEqual(got, want);
});

test('spawn và mọi cửa đều tới được từ spawn; cửa không bị chặn', () => {
  const world = buildWorld(m);
  assert.ok(!isBlockedAt(world, m.spawn.x, m.spawn.y), 'spawn bị chặn');
  const field = pathField(world);
  for (const p of m.pois) {
    assert.ok(!isBlockedAt(world, p.door.x, p.door.y), `${p.id}: cửa bị chặn`);
    assert.ok(findPath(field, m.spawn, p.door, { allowBlockedGoal: false }), `${p.id}: không tới được`);
  }
});

test('địa điểm không chồng nhau và không đè lên nước', () => {
  for (const p of m.pois) {
    const f = p.footprint;
    for (let j = 0; j < f.h; j++) {
      for (let i = 0; i < f.w; i++) assert.notEqual(m.layers.ground[f.y + j]![f.x + i], 'w', `${p.id}: đè lên nước`);
    }
  }
  const overlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (let i = 0; i < m.pois.length; i++) {
    for (let j = i + 1; j < m.pois.length; j++) {
      assert.ok(!overlap(m.pois[i]!.footprint, m.pois[j]!.footprint), `${m.pois[i]!.id} chồng ${m.pois[j]!.id}`);
    }
  }
});

test('có hồ Hoàn Kiếm đủ lớn, và đảo Tháp Rùa đi được', () => {
  assert.ok(count('w') > 100, 'hồ quá nhỏ');
  const tower = m.pois.find((p) => p.id === 'hanoi-thaprua')!;
  assert.ok(!isBlockedAt(buildWorld(m), tower.door.x, tower.door.y), 'cửa Tháp Rùa bị chặn');
});

test('có đường và vỉa hè đủ để đi bộ: nhiều ô đường và vỉa hè', () => {
  assert.ok(count('r') > 300, 'quá ít đường');
  assert.ok(count('p') > 200, 'quá ít vỉa hè');
});

test('tuyến xe chạy trên đường: mọi điểm trên lưới của tuyến đều là đường hoặc cầu', () => {
  assert.ok((m.routes ?? []).length >= 2, 'thiếu tuyến xe');
  for (const r of m.routes ?? []) {
    for (const pt of r.path) {
      if (pt.x < 0 || pt.y < 0 || pt.x >= w || pt.y >= h) continue;
      const g = m.layers.ground[pt.y]![pt.x]!;
      assert.ok('rhv'.includes(g), `${r.id}: (${pt.x},${pt.y}) không phải đường (${g})`);
    }
  }
});

const objCount = (ch: string) => m.layers.objects.join('').split(ch).length - 1;

test('chi tiết đô thị: có nhà, cửa hiệu, dù trà đá, cây dọc đường, thùng rác, biển chỉ đường', () => {
  assert.ok(objCount('#') >= 12, `quá ít nhà (${objCount('#')})`);
  assert.ok(objCount('%') >= 10, `quá ít cửa hiệu (${objCount('%')})`);
  assert.ok(objCount('P') >= 5, `quá ít dù trà đá (${objCount('P')})`);
  assert.ok(objCount('T') + objCount('U') >= 40, 'quá ít cây dọc đường');
  assert.ok(objCount('n') >= 3, 'quá ít thùng rác');
  assert.ok(objCount('G') >= 3, 'quá ít biển chỉ đường');
  assert.ok(objCount('a') + objCount('e') + objCount('i') >= 20, 'quá ít hoa trong công viên');
});

test('khu phố thông nhau: mọi ô đi được đều tới được từ điểm xuất phát', () => {
  const world = buildWorld(m);
  const seen = new Uint8Array(w * h);
  const queue = [m.spawn];
  seen[m.spawn.y * w + m.spawn.x] = 1;
  let reached = 1;
  for (let q = 0; q < queue.length; q++) {
    const t = queue[q]!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = t.x + dx;
      const ny = t.y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen[ny * w + nx] || isBlockedAt(world, nx, ny)) continue;
      seen[ny * w + nx] = 1;
      reached++;
      queue.push({ x: nx, y: ny });
    }
  }
  let walkable = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!isBlockedAt(world, x, y)) walkable++;
  // Vài ô lẻ kẹt giữa cây trong công viên, giữa nước và nhà là chấp nhận được; khu phố lớn thì không.
  assert.ok(walkable - reached <= 10, `${walkable - reached} ô đi được bị cô lập`);
});

test('có nhiều nhà ống và cửa hàng xếp kín các ô phố', () => {
  assert.ok(objCount('#') + objCount('%') >= 80, `quá ít nhà (${objCount('#') + objCount('%')})`);
});

test('có xe buýt chạy trên đường lớn', () => {
  assert.ok((m.routes ?? []).some((r) => r.sprite === 'bus'), 'thiếu tuyến xe buýt');
});

test('mọi địa điểm thật nằm đúng hướng so với hồ Hoàn Kiếm (đối chiếu Google Maps, bỏ qua chênh dưới 0,6 km)', () => {
  // Toạ độ tâm hồ Hoàn Kiếm: 21,0288 N, 105,8524 E; ô (80,50). Bắc là y nhỏ, đông là x lớn.
  for (const g of HANOI_GEO) {
    if (g.generic) continue;
    const p = m.pois.find((q) => q.id === `hanoi-${g.slug}`);
    assert.ok(p, `thiếu địa điểm ${g.slug}`);
    const cx = p.footprint.x + p.footprint.w / 2;
    const cy = p.footprint.y + p.footprint.h / 2;
    const dxKm = (g.lon - 105.8524) * 103.9;
    const dyKm = (g.lat - 21.0288) * 111.2;
    if (Math.abs(dxKm) > 0.6) assert.equal(Math.sign(cx - 80), Math.sign(dxKm), `${g.slug}: sai hướng đông–tây`);
    if (Math.abs(dyKm) > 0.6) assert.equal(Math.sign(50 - cy), Math.sign(dyKm), `${g.slug}: sai hướng bắc–nam`);
  }
});

test('mọi địa điểm thật nằm gần toạ độ Google Maps (trong 12 ô; riêng nơi bị mép bản đồ chặn thì bỏ qua)', () => {
  for (const g of HANOI_GEO) {
    if (g.generic) continue;
    const p = m.pois.find((q) => q.id === `hanoi-${g.slug}`)!;
    const t = geoToGrid(g.lat, g.lon);
    if (t.x < 0 || t.y < 0 || t.x >= w || t.y >= h) continue;
    const cx = p.footprint.x + p.footprint.w / 2;
    const cy = p.footprint.y + p.footprint.h / 2;
    assert.ok(Math.hypot(cx - t.x, cy - t.y) <= 12, `${g.slug}: lệch ${Math.hypot(cx - t.x, cy - t.y).toFixed(1)} ô so với Google Maps`);
  }
});

test('địa điểm không đặt lên đường lớn (đường chính không bị chắn)', () => {
  for (const p of m.pois) {
    const f = p.footprint;
    for (let j = 0; j < f.h; j++) {
      for (let i = 0; i < f.w; i++) {
        const g = m.layers.ground[f.y + j]![f.x + i]!;
        assert.ok(!'rhv'.includes(g), `${p.id}: đặt lên đường (${g})`);
      }
    }
  }
});

test('công trình có tranh pixel thật: mỗi địa điểm khai báo đều có PNG trong public/travel/sprites/hanoi-art', () => {
  for (const slug of HANOI_ART_SLUGS) {
    assert.ok(existsSync(join(process.cwd(), 'public', 'travel', 'sprites', 'hanoi-art', `${slug}.png`)), `thiếu tranh ${slug}`);
    const p = m.pois.find((q) => q.id === `hanoi-${slug}`)!;
    assert.equal(p.sprite, `art:hanoi-art/${slug}`, `${slug}: sprite chưa trỏ tới tranh`);
  }
});

test('nhân vật có tranh pixel: mỗi NPC dùng tranh đã có trong public/travel/sprites/hanoi-npc', () => {
  for (const n of m.npcs) {
    if (!n.sprite.startsWith('art:hanoi-npc/')) continue;
    const slug = n.sprite.slice('art:hanoi-npc/'.length);
    assert.ok(existsSync(join(process.cwd(), 'public', 'travel', 'sprites', 'hanoi-npc', `${slug}.png`)), `${n.id}: thiếu tranh ${slug}`);
  }
});

test('NPC đứng trên chỗ đi được', () => {
  const world = buildWorld(m);
  for (const n of m.npcs) assert.ok(!isBlockedAt(world, n.at.x, n.at.y), `${n.id}: đứng chỗ bị chặn`);
});
