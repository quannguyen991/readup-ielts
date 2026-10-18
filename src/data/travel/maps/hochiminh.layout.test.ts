import assert from 'node:assert/strict';
import test from 'node:test';

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

import { buildSceneWorld, spriteRect } from '@/components/travel/engine/scene';
import { hochiminh } from './hochiminh';

/** Vùng có pixel nhìn thấy của tranh (kênh alpha > 40), đo theo tệp PNG rồi quy về tỉ lệ 0–1. */
const opaqueCache = new Map<string, { x0: number; y0: number; x1: number; y1: number }>();
async function opaqueBox(file: string) {
  const hit = opaqueCache.get(file);
  if (hit) return hit;
  const path = join(process.cwd(), 'public', 'travel', 'sprites', 'hochiminh', file);
  assert.ok(existsSync(path), `thiếu tranh ${file}`);
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3]! > 40) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const box = { x0: x0 / info.width, y0: y0 / info.height, x1: (x1 + 1) / info.width, y1: (y1 + 1) / info.height };
  opaqueCache.set(file, box);
  return box;
}

// Bố cục TP.HCM 3×3 mảnh: vật không chồng nhau và mọi cửa địa điểm tới được từ điểm xuất phát.
const scene = hochiminh.scene!;
const objs = scene.objects.filter((o) => !o.id.startsWith('seam'));

const overlaps = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

test('vật không chồng lên nhau: phần pixel nhìn thấy của tranh không đè tranh khác', async () => {
  const rects: { id: string; r: { x: number; y: number; w: number; h: number } }[] = [];
  for (const o of objs) {
    const sp = scene.sprites[o.sprite];
    assert.ok(sp, `${o.id}: thiếu kích thước sprite ${o.sprite}`);
    const full = spriteRect(o, sp);
    const b = await opaqueBox(sp.file ?? `${o.sprite}.webp`);
    rects.push({ id: o.id, r: { x: full.x + b.x0 * full.w, y: full.y + b.y0 * full.h, w: (b.x1 - b.x0) * full.w, h: (b.y1 - b.y0) * full.h } });
  }
  const bad: string[] = [];
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i]!.r;
      const c = rects[j]!.r;
      const ox = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x);
      const oy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
      if (ox > 2 && oy > 2) bad.push(`${rects[i]!.id} / ${rects[j]!.id}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('mọi cửa địa điểm tới được từ điểm xuất phát (trên lưới đi được của cảnh)', () => {
  const w = buildSceneWorld(hochiminh);
  const cellOf = (x: number, y: number) => Math.floor(y / w.cell) * w.mw + Math.floor(x / w.cell);
  const seen = new Uint8Array(w.walk.length);
  const queue = [cellOf(hochiminh.spawn.x, hochiminh.spawn.y)];
  seen[queue[0]!] = 1;
  for (let q = 0; q < queue.length; q++) {
    const c = queue[q]!;
    const i = c % w.mw;
    const j = Math.floor(c / w.mw);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= w.mw || nj >= w.mh) continue;
      const n = nj * w.mw + ni;
      if (seen[n] || !w.walk[n]) continue;
      seen[n] = 1;
      queue.push(n);
    }
  }
  for (const p of hochiminh.pois) {
    const c = cellOf(p.door.x, p.door.y);
    assert.ok(seen[c], `${p.id}: cửa (${p.door.x},${p.door.y}) không tới được từ điểm xuất phát`);
  }
});

test('có cầu qua kênh Tây Bắc và mọi địa điểm nằm trong khung thế giới', () => {
  const bridges = scene.objects.filter((o) => o.id.startsWith('bridge'));
  assert.ok(bridges.length >= 2 && bridges.length <= 4, `số cầu ${bridges.length}: cần từ 2 đến 4 cầu`);
  for (const p of hochiminh.pois) {
    assert.ok(p.door.x >= 0 && p.door.y >= 0 && p.door.x < hochiminh.size.w && p.door.y < hochiminh.size.h, `${p.id}: cửa ngoài khung`);
  }
});
