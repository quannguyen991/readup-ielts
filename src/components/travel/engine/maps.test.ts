import test from 'node:test';
import assert from 'node:assert/strict';

import { getVocabTopic } from '@/data/vocab-topics';
import { CITY_MAPS, TILE_FALLBACKS } from '@/data/travel/maps';
import { poisOfCity } from '@/data/travel/pois';
import { PALETTES, ROLE_CHARS } from '@/data/travel/palettes';
import { hasSprite, SPRITE_FACTORIES, getSpriteDef, parseFacadeId, buildFacade, FACADE_KINDS, tileGrid, TILE_VARIANTS, type TileKind } from '@/data/travel/sprites';
import { findPath } from '@/services/travel/pathfinding';
import type { CityMap, Poi } from '@/services/travel/types';
import { buildWorld, isBlockedAt, pathField, TS } from './grid';
import { buildImgWorld, composeMask, findPathPx, isWalkPx } from './imageWorld';
import { buildSceneWorld, doorPoint, footprintRect, INTERIOR_CELL, interiorKindOf, interiorLayout, interiorMaskRows } from './scene';
import { INTERIOR_KIND_IDS } from '@/data/travel/interiors';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nearest, quantiseInPlace } from './quantise';
import { Camera, computeImageView, computeView, viewForK, zoomBounds } from './view';

const isReply = (d: string) => d.startsWith('reply-');
type R = { x: number; y: number; w: number; h: number };
const overlap = (a: R, b: R) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const bi = (b: { vi: string; en: string }) => b.vi.trim().length > 0 && b.en.trim().length > 0;

const imageMaps = Object.values(CITY_MAPS).filter((m) => m.image);
const worldOf = (m: CityMap) => (m.scene ? buildSceneWorld(m) : buildImgWorld(m.image!));
const sceneMaps = imageMaps.filter((m) => m.scene);

test('mọi thành phố đều là bản đồ ảnh 418×235 với lưới đi được đúng cỡ', () => {
  assert.equal(imageMaps.length, 8);
  for (const m of imageMaps) {
    const im = m.image!;
    const dims = (src: string) => {
      const h = readFileSync(join(process.cwd(), 'public', src.replace(/^\//, '')));
      return { w: h.readUInt32BE(16), h: h.readUInt32BE(20) };
    };
    if (im.panels && im.panels.length > 1) {
      let bw = 0;
      let bh = 0;
      for (const p of im.panels) {
        const d = dims(p.src);
        bw = Math.max(bw, p.x + d.w);
        bh = Math.max(bh, p.y + d.h);
      }
      assert.ok(im.size.w >= bw && im.size.h >= bh && im.size.w - bw < 2 * 235 && im.size.h - bh < 2 * 235, `${m.id}: size không bao các mảnh`);
    } else assert.deepEqual(im.size, dims(im.smallSrc ?? im.src), `${m.id}: size lệch ảnh`);
    assert.equal(im.scale, 4);
    assert.deepEqual(m.size, im.size);
    const { cell, rows } = im.mask;
    assert.equal(rows.length, Math.ceil(im.size.h / cell), `${m.id}: số dòng lưới`);
    for (const r of rows) {
      assert.equal(r.length, Math.ceil(im.size.w / cell), `${m.id}: độ dài dòng`);
      assert.match(r, /^[#~.]*$/);
    }
    assert.match(im.src, /^\/travel\/(maps|terrain)\/[a-z]+\.png$/);
    assert.match(im.smallSrc ?? '', /^\/travel\/(maps|terrain)\/[a-z]+\.small\.png$/);
  }
});

test('ảnh: spawn, mọi cửa nằm trong vùng đi được và tới được từ spawn bằng tìm đường', () => {
  for (const m of imageMaps) {
    const w = worldOf(m);
    assert.ok(isWalkPx(w, m.spawn.x, m.spawn.y), `${m.id}: spawn không đi được`);
    for (const p of m.pois) {
      assert.ok(p.door.x >= 0 && p.door.y >= 0 && p.door.x < w.w && p.door.y < w.h, `${p.id}: cửa ngoài ảnh`);
      assert.ok(isWalkPx(w, p.door.x, p.door.y), `${p.id}: cửa (${p.door.x},${p.door.y}) không nằm trên vùng đi được`);
      const path = findPathPx(w, m.spawn, p.door);
      assert.ok(path && path.length > 0, `${p.id}: không tới được từ spawn`);
      const last = path![path!.length - 1]!;
      assert.ok(Math.hypot(last.x - p.door.x, last.y - p.door.y) <= 2.5, `${p.id}: đường không dừng đúng cửa`);
    }
  }
});

test('ảnh: vùng chạm nằm trong ảnh, không chồng nhau, footprint = hotspot', () => {
  for (const m of imageMaps) {
    const rects = m.pois.map((p) => ({ id: p.id, r: p.hotspot! }));
    for (const { id, r } of rects) {
      if (m.scene) assert.ok(r.x + r.w > 0 && r.y + r.h > 0 && r.x < m.size.w && r.y < m.size.h, `${id}: hotspot ngoài ảnh`);
      else assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= m.size.w && r.y + r.h <= m.size.h, `${id}: hotspot ngoài ảnh`);
      assert.ok(r.w >= 12 && r.h >= 12, `${id}: hotspot nhỏ hơn 12 điểm`);
    }
    for (let i = 0; i < rects.length; i++) {
      assert.deepEqual(m.pois[i]!.footprint, m.pois[i]!.hotspot, `${rects[i]!.id}: footprint phải trùng hotspot`);
      if (!m.scene) for (let j = i + 1; j < rects.length; j++) assert.ok(!overlap(rects[i]!.r, rects[j]!.r), `${rects[i]!.id} chồng ${rects[j]!.id}`);
    }
  }
});

test('địa điểm khớp danh mục data/travel/pois.ts của từng thành phố', () => {
  for (const m of Object.values(CITY_MAPS)) {
    const want = poisOfCity(m.id).map((p) => p.id).sort();
    const got = m.pois.map((p) => p.id).sort();
    assert.deepEqual(got, want, `${m.id}: bộ địa điểm lệch danh mục`);
  }
});

test('mọi bộ từ của địa điểm tồn tại (trừ bộ câu đáp reply-*) và mọi chữ có vi + en', () => {
  for (const m of Object.values(CITY_MAPS)) {
    assert.ok(bi(m.name), m.id);
    for (const p of m.pois) {
      assert.ok(bi(p.name), p.id);
      for (const d of p.content.decks) if (!isReply(d)) assert.ok(getVocabTopic(d), `${p.id}: không có bộ ${d}`);
      if (p.unlock?.after) assert.ok(m.pois.some((q) => q.id === p.unlock!.after), `${p.id}: unlock.after lạ`);
    }
    for (const n of m.npcs) {
      assert.ok(n.lines.length > 0, n.id);
      for (const l of n.lines) assert.ok(l.en.trim() && l.vi.trim(), `${n.id}: thiếu en/vi`);
    }
  }
});

test('NPC đứng/đi trên vùng đi được (ảnh) và mọi mã sprite có trong atlas', () => {
  for (const m of imageMaps) {
    const w = worldOf(m);
    for (const n of m.npcs) {
      for (const pt of [n.at, ...(n.path ?? [])]) assert.ok(isWalkPx(w, pt.x, pt.y), `${n.id}: (${pt.x},${pt.y}) không đi được`);
      assert.ok(hasSprite(n.sprite) || hasSprite(`mini_${n.sprite}`), `${n.id}: sprite ${n.sprite} không có`);
    }
    for (const r of m.routes ?? []) {
      assert.ok(hasSprite(r.sprite), `${r.id}: sprite ${r.sprite}`);
      assert.ok(r.path.length >= 2 && r.speed > 0);
    }
    for (const p of m.pois) if (p.sprite) assert.ok(hasSprite(p.sprite), p.id);
  }
});

test('thuyền chạy trên nước (điểm giữa tuyến có ô nước)', () => {
  for (const m of imageMaps) {
    const w = buildImgWorld(m.image!);
    for (const r of m.routes ?? []) {
      if (!r.sprite.includes('boat')) continue;
      const a = r.path[0]!;
      const b = r.path[r.path.length - 1]!;
      let water = 0;
      const n = 20;
      for (let i = 0; i <= n; i++) {
        const x = a.x + ((b.x - a.x) * i) / n;
        const y = a.y + ((b.y - a.y) * i) / n;
        const ci = Math.floor(x / w.cell);
        const cj = Math.floor(y / w.cell);
        if (ci >= 0 && cj >= 0 && ci < w.mw && cj < w.mh && w.water[cj * w.mw + ci]) water++;
      }
      assert.ok(water >= n * 0.6, `${m.id}/${r.id}: chỉ ${water}/${n + 1} điểm trên nước`);
    }
  }
});

test('bản đồ ô dự phòng: lưới hợp lệ, cửa tới được, địa điểm không chồng/không đè nước, NPC trên đất', () => {
  for (const m of [...(Object.values(TILE_FALLBACKS) as CityMap[])]) {
    const { w, h } = m.size;
    for (const layer of Object.values(m.layers)) {
      assert.equal(layer.length, h, `${m.id}: số dòng`);
      for (const r of layer) assert.equal(r.length, w, `${m.id}: độ dài dòng`);
    }
    const world = buildWorld(m);
    assert.ok(!isBlockedAt(world, m.spawn.x, m.spawn.y), `${m.id}: spawn bị chặn`);
    const field = pathField(world);
    for (const p of m.pois) {
      assert.ok(!isBlockedAt(world, p.door.x, p.door.y), `${p.id}: cửa bị chặn`);
      assert.ok(findPath(field, m.spawn, p.door, { allowBlockedGoal: false }), `${p.id}: không tới được`);
      const f = p.footprint;
      for (let j = 0; j < f.h; j++) for (let i = 0; i < f.w; i++) assert.notEqual(m.layers.ground[f.y + j]![f.x + i], 'w', `${p.id}: đè lên nước`);
    }
    const rects = m.pois.map((p) => p.footprint);
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) assert.ok(!overlap(rects[i]!, rects[j]!), `${m.pois[i]!.id} chồng ${m.pois[j]!.id}`);
    for (const n of m.npcs) assert.ok(!isBlockedAt(world, n.at.x, n.at.y), `${n.id}: đứng chỗ bị chặn`);
  }
});

test('mỗi bảng màu đúng 32 vai, mọi sprite chỉ dùng vai màu hợp lệ và các dòng đều bằng nhau', () => {
  assert.equal(ROLE_CHARS.length, 32);
  for (const [id, p] of Object.entries(PALETTES)) {
    assert.equal(Object.keys(p.colors).length, 32, id);
    for (const ch of ROLE_CHARS) assert.match(p.colors[ch] ?? '', /^#[0-9a-f]{6}$/i, `${id}:${ch}`);
  }
  const ok = new Set([...ROLE_CHARS, '.']);
  for (const id of Object.keys(SPRITE_FACTORIES)) {
    const d = getSpriteDef(id)!;
    assert.ok(d.frames.length >= 1, id);
    for (const f of d.frames) {
      assert.equal(f.length, d.h, `${id}: số dòng`);
      for (const row of f) {
        assert.equal(row.length, d.w, `${id}: độ rộng dòng`);
        for (const ch of row) assert.ok(ok.has(ch), `${id}: vai màu lạ "${ch}"`);
      }
    }
  }
  for (const kind of FACADE_KINDS) for (const night of [false, true]) {
    const g = buildFacade(kind, 6, 5, 2, 'TEST', night).toRows();
    assert.equal(g.length, 80);
    for (const row of g) for (const ch of row) assert.ok(ok.has(ch), `facade ${kind}: "${ch}"`);
  }
  assert.ok(parseFacadeId('fac:cafe:CAFE'));
  assert.equal(parseFacadeId('fac:nope:X'), null);
  for (const [k, n] of Object.entries(TILE_VARIANTS) as [TileKind, number][]) {
    assert.ok(n >= 2, k);
    assert.equal(tileGrid(k, 0).length, 16);
    assert.notDeepEqual(tileGrid(k, 0), tileGrid(k, n > 1 ? 1 : 0), `${k}: biến thể giống hệt nhau`);
  }
});

test('khung nhìn: hệ số phóng luôn nguyên, bộ đệm không vượt canvas, lề căn giữa nguyên', () => {
  for (const dpr of [1, 1.25, 1.5, 2, 2.625, 3]) {
    for (const [w, h] of [[375, 700], [412, 800], [768, 1024], [1400, 800], [1920, 1000], [3000, 1200]] as [number, number][]) {
      for (const v of [computeView(w, h, dpr), computeImageView(w, h, dpr, 418, 235)]) {
        assert.ok(Number.isInteger(v.k) && v.k >= 1);
        assert.ok(v.W * v.k <= v.devW && v.H * v.k <= v.devH, `${w}x${h}@${dpr}`);
        assert.ok(v.devW - v.W * v.k < v.k && v.devH - v.H * v.k < v.k, 'phần dư phải nhỏ hơn một bước phóng');
        assert.ok(Number.isInteger(v.offX) && Number.isInteger(v.offY));
        assert.equal(v.devW, Math.round(w * dpr));
      }
    }
  }
  // ảnh: màn lớn thấy trọn tranh, điện thoại ≥ 2 px CSS mỗi điểm
  const big = computeImageView(1400, 800, 1, 418, 235);
  assert.ok(big.W >= 418 && big.H >= 235);
  const phone = computeImageView(375, 700, 3, 418, 235);
  assert.ok(phone.cssPerPx >= 2 - 1e-9);
});

test('máy quay: vị trí vẽ luôn nguyên, kẹp mép, căn giữa khi bản đồ nhỏ hơn khung', () => {
  const v = computeView(1000, 600, 1);
  const cam = new Camera();
  cam.snapTo(5, 5, v, 2000, 1500);
  assert.equal(cam.ix, 0);
  assert.equal(cam.iy, 0);
  for (let i = 0; i < 200; i++) {
    cam.update(1 / 60, 700 + i * 3.37, 400 + i * 1.91, v, 2000, 1500);
    assert.ok(Number.isInteger(cam.ix) && Number.isInteger(cam.iy));
    assert.ok(cam.ix >= 0 && cam.ix <= 2000 - v.W);
  }
  cam.snapTo(100, 100, v, 100, 100);
  assert.equal(cam.ix, Math.round((100 - v.W) / 2));
});

test('ép bảng màu: chọn màu gần nhất và giữ độ trong suốt', () => {
  const pal: [number, number, number][] = [[0, 0, 0], [255, 255, 255], [200, 30, 30]];
  assert.equal(nearest(pal, 10, 10, 10), 0);
  assert.equal(nearest(pal, 250, 250, 240), 1);
  assert.equal(nearest(pal, 190, 40, 35), 2);
  const data = new Uint8ClampedArray([12, 12, 12, 255, 250, 250, 250, 255, 100, 100, 100, 10]);
  quantiseInPlace(data, 3, 1, pal, 'none');
  assert.deepEqual([...data], [0, 0, 0, 255, 255, 255, 255, 255, 100, 100, 100, 0]);
});

test('cùng đầu vào cho cùng hình (sprite sinh ổn định)', () => {
  const a = JSON.stringify(getSpriteDef('lm_mbs'));
  assert.equal(a, JSON.stringify(SPRITE_FACTORIES.lm_mbs!()));
  assert.equal(TS, 16);
});

// kiểm kiểu: Poi có hotspot ở bản ảnh
const _typecheck: Poi | undefined = undefined;
void _typecheck;

test('cảnh đối tượng: sprite có thật, kích thước khớp tệp, vật trong ảnh, chân vật không chặn spawn/cửa', () => {
  for (const m of sceneMaps) {
    const sc = m.scene!;
    const { w: W, h: H } = m.image!.size;
    for (const [id, sp] of Object.entries(sc.sprites)) {
      const file = join(process.cwd(), 'public', 'travel', 'sprites', m.id, sp.file ?? `${id}.png`);
      assert.ok(existsSync(file), `${m.id}/${id}: thiếu tệp ${file}`);
      const buf = readFileSync(file);
      const fw = buf.readUInt32BE(16);
      const fh = buf.readUInt32BE(20);
      if (!sp.crop) assert.deepEqual([sp.w, sp.h], [fw, fh], `${m.id}/${id}: w,h lệch tệp`);
      else {
        assert.ok(sp.crop.x + sp.crop.w <= fw && sp.crop.y + sp.crop.h <= fh, `${m.id}/${id}: crop ngoài tệp`);
        assert.deepEqual([sp.w, sp.h], [sp.crop.w, sp.crop.h]);
      }
    }
    const ids = new Set<string>();
    for (const o of sc.objects) {
      assert.ok(!ids.has(o.id), `trùng id vật ${o.id}`);
      ids.add(o.id);
      assert.ok(sc.sprites[o.sprite], `${o.id}: sprite ${o.sprite} chưa khai`);
      assert.ok(o.x >= 0 && o.x <= W && o.y >= 0 && o.y <= H + 2, `${o.id}: ngoài ảnh`);
      const f = footprintRect(o);
      assert.ok(f.w > 0 && f.h > 0);
      assert.ok(f.x >= 0 && f.y >= 0 && f.x + f.w <= W && f.y + f.h <= H, `${o.id}: footprint ngoài ảnh`);
    }
    const w = buildSceneWorld(m);
    assert.ok(isWalkPx(w, m.spawn.x, m.spawn.y), `${m.id}: spawn bị chặn`);
    for (const o of sc.objects) {
      const d = doorPoint(o);
      if (!d) continue;
      for (const q of sc.objects) {
        const f = footprintRect(q);
        assert.ok(!(d.x >= f.x && d.x < f.x + f.w && d.y >= f.y && d.y < f.y + f.h), `cửa của ${o.id} nằm trong footprint của ${q.id}`);
      }
    }
  }
});

test('cảnh đối tượng: mỗi địa điểm có đúng một vật với cửa; cửa/hotspot khớp vật; cửa tới được', () => {
  for (const m of sceneMaps) {
    const sc = m.scene!;
    const w = buildSceneWorld(m);
    for (const p of m.pois) {
      const objs = sc.objects.filter((o) => o.poiId === p.id);
      assert.equal(objs.length, 1, `${p.id}: cần đúng 1 vật gắn poiId`);
      const o = objs[0]!;
      const d = doorPoint(o);
      assert.ok(d, `${p.id}: vật ${o.id} thiếu door`);
      assert.ok(Math.abs(d!.x - p.door.x) <= 1 && Math.abs(d!.y - p.door.y) <= 1, `${p.id}: door địa điểm lệch cửa vật`);
      assert.ok(isWalkPx(w, p.door.x, p.door.y), `${p.id}: cửa không đi được`);
      assert.ok(findPathPx(w, m.spawn, p.door), `${p.id}: không tới được từ spawn`);
      const sp = sc.sprites[o.sprite]!;
      assert.deepEqual(p.hotspot, { x: o.x - sp.w / 2, y: o.y - sp.h, w: sp.w, h: sp.h }, `${p.id}: hotspot lệch sprite`);
    }
    for (const o of sc.objects) if (o.poiId) assert.ok(m.pois.some((p) => p.id === o.poiId), `${o.id}: poiId lạ`);
  }
});

test('phòng trong: đủ 8 loại, mỗi loại có spawn/chủ/quầy/lối ra đúng chỗ và tới được', () => {
  const kinds = ['cafe', 'restaurant', 'hotel', 'market', 'museum', 'station', 'airport', 'counter'] as const;
  assert.deepEqual([...INTERIOR_KIND_IDS].sort(), [...kinds].sort());
  for (const k of kinds) {
    assert.equal(interiorKindOf(k), k);
    const L = interiorLayout(k);
    const rows = interiorMaskRows(L);
    const at = (x: number, y: number) => rows[Math.floor(y / INTERIOR_CELL)]![Math.floor(x / INTERIOR_CELL)];
    assert.equal(at(L.spawn.x, L.spawn.y), '#', `${k}: spawn`);
    assert.equal(at(L.hostFront.x, L.hostFront.y), '#', `${k}: hostFront`);
    assert.equal(at(L.exit.x, L.exit.y - 4), '#', `${k}: exit`);
    assert.equal(at(L.host.x, L.host.y), '.', `${k}: chủ đứng sau quầy`);
    const field = { w: rows[0]!.length, h: rows.length, isBlocked: (x: number, y: number) => rows[y]![x] !== '#' };
    const cell = (p: { x: number; y: number }) => ({ x: Math.floor(p.x / INTERIOR_CELL), y: Math.floor(p.y / INTERIOR_CELL) });
    assert.ok(findPath(field, cell(L.spawn), cell(L.hostFront), { allowBlockedGoal: false }), `${k}: không tới được chủ`);
    assert.ok(findPath(field, cell(L.hostFront), cell({ x: L.exit.x, y: L.exit.y - 4 }), { allowBlockedGoal: false }), `${k}: không ra được`);
    for (const b of L.blockers) assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= 418 && b.y + b.h <= 235, `${k}: đồ đạc ngoài ảnh`);
  }
  for (const k of ['garden', 'landmark', 'secret'] as const) assert.equal(interiorKindOf(k), null);
});

test('thế giới nhiều mảnh: ghép lưới đi được theo độ lệch bất kỳ, khoét thông chỗ nối', () => {
  const a = { x: 0, y: 0, w: 20, h: 10, cell: 2, rows: Array.from({ length: 5 }, () => '#'.repeat(10)) };
  const b = { x: 21, y: 9, w: 20, h: 10, cell: 2, rows: Array.from({ length: 5 }, () => '##..#####.'.padEnd(10, '.')) };
  const rows = composeMask({ w: 41, h: 19 }, 2, [a, b], []);
  assert.equal(rows.length, 10);
  assert.ok(rows.every((r) => r.length === 21));
  // trong mảnh a: đi được; ô tâm (1,1) thuộc a
  assert.equal(rows[0]![0], '#');
  // mảnh b bắt đầu ở x=21,y=9 → ô (i=11,j=5) tâm (23,11) thuộc b ô (1,1) = '#'
  assert.equal(rows[5]![11], '#');
  // ngoài mọi mảnh = chặn
  assert.equal(rows[0]![15], '.');
  const linked = composeMask({ w: 41, h: 19 }, 2, [a, b], [{ x: 30, y: 2, r: 4 }]);
  assert.equal(linked[1]![15], '#');
});

test('mọi bản đồ nhiều mảnh: mảnh trong thế giới, chỗ nối đi được, lưới đúng cỡ thế giới', () => {
  for (const m of imageMaps) {
    const im = m.image!;
    if (!im.panels || im.panels.length < 2) continue;
    assert.deepEqual(m.size, im.size);
    for (const p of im.panels) {
      assert.ok(p.x >= 0 && p.y >= 0 && p.x + (p.w ?? 418) <= im.size.w + 1 && p.y + (p.h ?? 235) <= im.size.h + 1, `${m.id}: mảnh ngoài thế giới`);
      assert.ok(existsSync(join(process.cwd(), 'public', p.src.replace(/^\//, ''))), `${m.id}: thiếu ${p.src}`);
    }
    const w = buildImgWorld(im);
    for (const l of im.links ?? []) assert.ok(isWalkPx(w, l.x, l.y), `${m.id}: chỗ nối (${l.x},${l.y}) không đi được`);
    for (const p of m.pois) assert.ok(findPathPx(worldOf(m), m.spawn, p.door), `${p.id}: không tới được qua các mảnh`);
  }
});

test('phóng to/thu nhỏ: hệ số luôn nguyên, bộ đệm khớp canvas, biên hợp lệ', () => {
  for (const dpr of [1, 1.25, 2, 3]) {
    for (const [w, h] of [[375, 700], [1250, 705], [1900, 900]] as [number, number][]) {
      const base = computeImageView(w, h, dpr, 836, 470);
      const b = zoomBounds(base.k);
      assert.ok(b.min <= 0 && b.max >= 0 && base.k + b.min >= 1);
      for (let z = b.min; z <= b.max; z++) {
        const v = viewForK(w, h, dpr, base.k + z);
        assert.ok(Number.isInteger(v.k) && v.k >= 1);
        assert.ok(v.W * v.k <= v.devW && v.H * v.k <= v.devH && v.devW - v.W * v.k < v.k);
        assert.equal(v.devW, Math.round(w * dpr));
      }
    }
  }
});
