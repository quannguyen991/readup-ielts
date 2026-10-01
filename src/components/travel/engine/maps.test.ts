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
import { buildImgWorld, findPathPx, isWalkPx } from './imageWorld';
import { nearest, quantiseInPlace } from './quantise';
import { Camera, computeImageView, computeView } from './view';

const isReply = (d: string) => d.startsWith('reply-');
type R = { x: number; y: number; w: number; h: number };
const overlap = (a: R, b: R) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const bi = (b: { vi: string; en: string }) => b.vi.trim().length > 0 && b.en.trim().length > 0;

const imageMaps = Object.values(CITY_MAPS).filter((m) => m.image);

test('mọi thành phố đều là bản đồ ảnh 418×235 với lưới đi được đúng cỡ', () => {
  assert.equal(imageMaps.length, 6);
  for (const m of imageMaps) {
    const im = m.image!;
    assert.deepEqual(im.size, { w: 418, h: 235 }, m.id);
    assert.equal(im.scale, 4);
    assert.deepEqual(m.size, im.size);
    const { cell, rows } = im.mask;
    assert.equal(rows.length, Math.ceil(im.size.h / cell), `${m.id}: số dòng lưới`);
    for (const r of rows) {
      assert.equal(r.length, Math.ceil(im.size.w / cell), `${m.id}: độ dài dòng`);
      assert.match(r, /^[#~.]*$/);
    }
    assert.match(im.src, /^\/travel\/maps\/[a-z]+\.png$/);
    assert.match(im.smallSrc ?? '', /^\/travel\/maps\/[a-z]+\.small\.png$/);
  }
});

test('ảnh: spawn, mọi cửa nằm trong vùng đi được và tới được từ spawn bằng tìm đường', () => {
  for (const m of imageMaps) {
    const w = buildImgWorld(m.image!);
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
      assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= 418 && r.y + r.h <= 235, `${id}: hotspot ngoài ảnh`);
      assert.ok(r.w >= 12 && r.h >= 12, `${id}: hotspot nhỏ hơn 12 điểm`);
    }
    for (let i = 0; i < rects.length; i++) {
      assert.deepEqual(m.pois[i]!.footprint, m.pois[i]!.hotspot, `${rects[i]!.id}: footprint phải trùng hotspot`);
      for (let j = i + 1; j < rects.length; j++) assert.ok(!overlap(rects[i]!.r, rects[j]!.r), `${rects[i]!.id} chồng ${rects[j]!.id}`);
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
    const w = buildImgWorld(m.image!);
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
  for (const m of Object.values(TILE_FALLBACKS) as CityMap[]) {
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
