import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { INTERIOR_CELL, interiorLayout, interiorMaskRows, type InteriorKind } from '@/components/travel/engine/scene';
import { CITY_BACK_ROOMS } from '@/data/travel/interiors';
import { findPath } from '@/services/travel/pathfinding';

type P = { x: number; y: number };
const cell = (p: P) => ({ x: Math.floor(p.x / INTERIOR_CELL), y: Math.floor(p.y / INTERIOR_CELL) });
const at = (rows: string[], p: P) => rows[Math.floor(p.y / INTERIOR_CELL)]![Math.floor(p.x / INTERIOR_CELL)];
const fieldOf = (rows: string[]) => ({ w: rows[0]!.length, h: rows.length, isBlocked: (x: number, y: number) => rows[y]![x] !== '#' });

test('khu phụ: cửa hai chiều, điểm xuất hiện đi được, tới được cửa và lối ra', () => {
  for (const [city, rooms] of Object.entries(CITY_BACK_ROOMS)) {
    for (const kind of Object.keys(rooms ?? {}) as InteriorKind[]) {
      const label = `${city}/${kind}`;
      const main = interiorLayout(kind, 'main', city);
      const back = interiorLayout(kind, 'back', city);
      assert.equal(main.portal?.destination, 'back', `${label}: cửa phòng chính`);
      assert.equal(back.portal?.destination, 'main', `${label}: cửa khu phụ`);
      const mainRows = interiorMaskRows(main);
      const backRows = interiorMaskRows(back);
      assert.equal(at(mainRows, main.spawn), '#', `${label}: điểm xuất hiện phòng chính`);
      assert.equal(at(backRows, back.spawn), '#', `${label}: điểm xuất hiện khu phụ`);
      assert.ok(findPath(fieldOf(mainRows), cell(main.spawn), cell(main.portal!.at)), `${label}: phòng chính không tới được cửa`);
      assert.ok(findPath(fieldOf(backRows), cell(back.spawn), cell(back.portal!.at)), `${label}: khu phụ không tới được cửa`);
      assert.ok(findPath(fieldOf(backRows), cell(back.spawn), cell({ x: back.exit.x, y: back.exit.y - 4 })), `${label}: khu phụ không ra được`);
      assert.equal(at(backRows, main.portal!.spawn!), '#', `${label}: chỗ về từ khu phụ trong phòng chính bị chặn`);
      assert.equal(at(mainRows, back.portal!.spawn!), '#', `${label}: chỗ về từ phòng chính trong khu phụ bị chặn`);
      for (const r of [main.portal!.rect]) assert.equal(at(mainRows, { x: r.x + 2, y: r.y + 2 }), '#', `${label}: cửa phòng chính nằm ngoài sàn`);
      for (const r of [back.portal!.rect]) assert.equal(at(backRows, { x: r.x + 2, y: r.y + 2 }), '#', `${label}: cửa khu phụ nằm ngoài sàn`);
      for (const b of back.blockers) assert.ok(b.x >= 30 && b.x + b.w <= 388 && b.y >= 62 && b.y + b.h <= 198, `${label}: đồ đạc khu phụ ngoài sàn`);
    }
  }
});

test('khu phụ: mỗi khu có đủ tranh lớn và tranh nhỏ trong public/travel/interiors/<thành phố>', () => {
  for (const [city, rooms] of Object.entries(CITY_BACK_ROOMS)) {
    for (const kind of Object.keys(rooms ?? {})) {
      for (const file of [`${kind}-back.webp`, `${kind}-back.small.webp`]) {
        assert.ok(existsSync(join(process.cwd(), 'public', 'travel', 'interiors', city, file)), `${city}: thiếu tranh ${file}`);
      }
    }
  }
});
