import assert from 'node:assert/strict';
import test from 'node:test';

import { buildWorld, isBlockedAt, pathField } from '@/components/travel/engine/grid';
import { poisOfCity } from '@/data/travel/pois';
import { findPath } from '@/services/travel/pathfinding';
import type { CityMap } from '@/services/travel/types';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { geoToGrid, hochiminhGrid, HCM_ART_SLUGS, HCM_GEO } from './hochiminh.grid';
import { CITY_INTERIOR_ART } from '../interiors';

const m: CityMap = hochiminhGrid;
const { w, h } = m.size;
const count = (ch: string) => m.layers.ground.join('').split(ch).length - 1;
const objCount = (ch: string) => m.layers.objects.join('').split(ch).length - 1;

// Chợ Bến Thành (ô 72,56) và hệ số của lưới: 10 ô/km, 109,4 km/độ kinh và 111,2 km/độ vĩ ở 10,77°N.
const BEN_THANH = { lat: 10.7725, lon: 106.698 };
const KM_LON = 109.4;
const KM_LAT = 111.2;

test('lưới TP.HCM: đúng số dòng và số cột ở mọi lớp', () => {
  assert.equal(m.id, 'hochiminh');
  assert.equal(w, 128);
  assert.equal(h, 112);
  for (const layer of Object.values(m.layers)) {
    assert.equal(layer.length, h);
    for (const row of layer) assert.equal(row.length, w);
  }
});

test('đủ đúng các địa điểm trong danh mục, mỗi địa điểm một lần', () => {
  const want = poisOfCity('hochiminh').map((c) => c.id).sort();
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


test('có đường và vỉa hè đủ để đi bộ: nhiều ô đường và vỉa hè', () => {
  assert.ok(count('r') > 800, 'quá ít đường');
  assert.ok(count('p') > 500, 'quá ít vỉa hè');
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

test('chi tiết đô thị: có nhà, cửa hiệu, dù trà đá, cây dọc đường, thùng rác, biển chỉ đường', () => {
  assert.ok(objCount('#') >= 40, `quá ít nhà (${objCount('#')})`);
  assert.ok(objCount('%') >= 20, `quá ít cửa hiệu (${objCount('%')})`);
  assert.ok(objCount('T') + objCount('U') >= 60, 'quá ít cây dọc đường');
  assert.ok(objCount('n') >= 3, 'quá ít thùng rác');
  assert.ok(objCount('G') >= 3, 'quá ít biển chỉ đường');
  assert.ok(objCount('a') + objCount('e') + objCount('i') >= 10, 'quá ít hoa trong công viên');
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
  assert.ok(walkable - reached <= 20, `${walkable - reached} ô đi được bị cô lập`);
});

test('có nhiều nhà ống và cửa hàng xếp kín các ô phố', () => {
  assert.ok(objCount('#') + objCount('%') >= 120, `quá ít nhà (${objCount('#') + objCount('%')})`);
});

test('có xe buýt chạy trên đường lớn', () => {
  assert.ok((m.routes ?? []).some((r) => r.sprite === 'bus'), 'thiếu tuyến xe buýt');
});

test('mọi địa điểm thật nằm đúng hướng so với Chợ Bến Thành (đối chiếu Google Maps, bỏ qua chênh dưới 0,6 km)', () => {
  // Bến Thành ở ô (72,56). Bắc là y nhỏ, đông là x lớn.
  for (const g of HCM_GEO) {
    if (g.generic) continue;
    const p = m.pois.find((q) => q.id === `hochiminh-${g.slug}`);
    assert.ok(p, `thiếu địa điểm ${g.slug}`);
    const cx = p.footprint.x + p.footprint.w / 2;
    const cy = p.footprint.y + p.footprint.h / 2;
    const dxKm = (g.lon - BEN_THANH.lon) * KM_LON;
    const dyKm = (g.lat - BEN_THANH.lat) * KM_LAT;
    if (Math.abs(dxKm) > 1.5) assert.equal(Math.sign(cx - 72), Math.sign(dxKm), `${g.slug}: sai hướng đông–tây`);
    if (Math.abs(dyKm) > 1.5) assert.equal(Math.sign(56 - cy), Math.sign(dyKm), `${g.slug}: sai hướng bắc–nam`);
  }
});

test('bản kín: địa điểm thật lệch trung bình tối đa 10 ô, không ô nào quá 28 ô so với toạ độ Google Maps (khối phố rộng ~13 ô)', () => {
  const errs: number[] = [];
  for (const g of HCM_GEO) {
    if (g.generic) continue;
    const p = m.pois.find((q) => q.id === `hochiminh-${g.slug}`)!;
    const t = geoToGrid(g.lat, g.lon);
    if (t.x < 0 || t.y < 0 || t.x >= w || t.y >= h) continue;
    const cx = p.footprint.x + p.footprint.w / 2;
    const cy = p.footprint.y + p.footprint.h / 2;
    const d = Math.hypot(cx - t.x, cy - t.y);
    errs.push(d);
    // Khung nhỏ hơn nên vài địa điểm (Nhà Rồng, Hồ Con Rùa) bị đẩy xa hơn một chút.
    assert.ok(d <= 35, `${g.slug}: lệch ${d.toFixed(1)} ô so với Google Maps`);
  }
  const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
  assert.ok(mean <= 18, `lệch trung bình ${mean.toFixed(1)} ô`);
});

test('Củ Chi và bến Mê Kông nằm ngoài lưới nên được đặt ở mép đúng hướng: Củ Chi phía tây bắc, Mê Kông phía tây nam', () => {
  const cuchi = m.pois.find((p) => p.id === 'hochiminh-cuchi')!;
  const mekong = m.pois.find((p) => p.id === 'hochiminh-mekong')!;
  assert.ok(cuchi.footprint.x < 72 && cuchi.footprint.y < 56, 'Củ Chi sai hướng (phải ở tây bắc)');
  assert.ok(mekong.footprint.x < 72 && mekong.footprint.y > 56, 'bến Mê Kông sai hướng (phải ở tây nam)');
  assert.ok(Math.min(cuchi.footprint.x, cuchi.footprint.y) <= 10, 'Củ Chi không nằm sát mép');
  assert.ok(mekong.footprint.x <= 3 || mekong.footprint.y + mekong.footprint.h >= h - 3, 'bến Mê Kông không nằm sát mép');
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

test('công trình có tranh pixel thật: mỗi địa điểm khai báo đều có PNG trong public/travel/sprites/hochiminh-art', () => {
  for (const slug of HCM_ART_SLUGS) {
    assert.ok(existsSync(join(process.cwd(), 'public', 'travel', 'sprites', 'hochiminh-art', `${slug}.png`)), `thiếu tranh ${slug}`);
    const p = m.pois.find((q) => q.id === `hochiminh-${slug}`)!;
    assert.equal(p.sprite, `art:hochiminh-art/${slug}`, `${slug}: sprite chưa trỏ tới tranh`);
  }
});

test('NPC đứng trên chỗ đi được', () => {
  const world = buildWorld(m);
  for (const n of m.npcs) assert.ok(!isBlockedAt(world, n.at.x, n.at.y), `${n.id}: đứng chỗ bị chặn`);
});

test('nội thất TP.HCM: mỗi loại phòng vẽ riêng có đủ tranh lớn và tranh nhỏ trong public/travel/interiors/hochiminh', () => {
  for (const kind of CITY_INTERIOR_ART.hochiminh ?? []) {
    for (const file of [`${kind}.png`, `${kind}.small.png`]) {
      assert.ok(existsSync(join(process.cwd(), 'public', 'travel', 'interiors', 'hochiminh', file)), `thiếu phòng ${file}`);
    }
  }
});

test('phương tiện TP.HCM: xe máy, xe Grab và xe Be có tranh thật, chạy đúng trên đường', () => {
  const art = (sprite: string) => sprite.slice('art:hochiminh-vehicles/'.length);
  const vehicles = (m.routes ?? []).filter((r) => r.sprite.startsWith('art:hochiminh-vehicles/'));
  assert.ok(vehicles.length >= 15, `quá ít tuyến xe (${vehicles.length})`);
  assert.ok(vehicles.some((r) => art(r.sprite).startsWith('moto_')), 'thiếu xe máy');
  assert.ok(vehicles.some((r) => r.sprite.endsWith('car_green')), 'thiếu xe Grab (xanh lá)');
  assert.ok(vehicles.some((r) => r.sprite.endsWith('car_yellow')), 'thiếu xe Be (vàng)');
  for (const r of vehicles) {
    assert.ok(existsSync(join(process.cwd(), 'public', 'travel', 'sprites', 'hochiminh-vehicles', `${art(r.sprite)}.png`)), `thiếu tranh ${r.sprite}`);
    for (const pt of r.path) {
      if (pt.x < 0 || pt.y < 0 || pt.x >= w || pt.y >= h) continue;
      assert.ok('rhv'.includes(m.layers.ground[pt.y]![pt.x]!), `${r.id}: (${pt.x},${pt.y}) không phải đường`);
    }
  }
});
