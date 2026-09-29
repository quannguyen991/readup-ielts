import test from 'node:test';
import assert from 'node:assert/strict';

import { catalogItem, isTower } from '@/data/city/catalog';
import { canPlace, footprintTiles, key, type World } from './placement';
import { sampleCity } from './sample-city';

const c = sampleCity();

test('thành phố mẫu có đủ 4 kiểu cao ốc và một tòa đang lên tầng', () => {
  const towers = c.sites.filter((s) => isTower(catalogItem(s.type)));
  assert.ok(towers.length >= 6, `chỉ có ${towers.length} cao ốc`);
  for (const t of ['tower_office', 'tower_glass', 'tower_twin', 'tower_observation']) assert.ok(towers.some((s) => s.type === t), `thiếu ${t}`);
  const b = c.sites.find((s) => s.id === c.buildingTowerId);
  assert.ok(b && b.craneUp && (b.floor ?? 0) > 0 && (b.floor ?? 0) < (b.floors ?? 0) && b.crew === 'tower');
  assert.ok(c.sites.length >= 40);
});

test('mọi công trình đặt đúng luật của game, theo thứ tự xây', () => {
  const placed: typeof c.sites = [];
  for (const s of c.sites) {
    const w: World = { terrain: c.terrain, works: {}, roads: c.roads, zones: {}, regions: c.regions, sites: placed, era: 5 };
    const r = canPlace(w, s.type, s.x, s.y, s.rot);
    assert.ok(r.ok, `${s.id} (${s.type}) không hợp lệ: ${r.ok ? '' : r.reason}`);
    // Khi kiểm tiếp, công trình trước coi như đã xong (trạm điện có trước cao ốc).
    placed.push({ ...s, stageIdx: catalogItem(s.type)!.stages.length });
  }
});

test('không hai công trình chồng lên nhau, không đè lên đường', () => {
  const used = new Set<string>();
  for (const s of c.sites) {
    for (const [x, y] of footprintTiles(s.x, s.y, catalogItem(s.type)!.size, s.rot)) {
      const k = key(x, y);
      assert.ok(!used.has(k), `chồng ở ${k}`);
      assert.ok(!c.roads[k], `đè đường ở ${k}`);
      used.add(k);
    }
  }
});

test('tất định: dựng lại cho cùng kết quả', () => {
  assert.equal(JSON.stringify(sampleCity()), JSON.stringify(c));
});

test('không có cầu cụt: mỗi đoạn cầu có đường trên đất liền ở cả hai đầu', () => {
  const isBridge = (x: number, y: number) => (c.roads[key(x, y)] ?? '').startsWith('bridge');
  const isLand = (x: number, y: number) => !!c.roads[key(x, y)] && !isBridge(x, y);
  for (const k of Object.keys(c.roads)) {
    const [x, y] = k.split(',').map(Number) as [number, number];
    if (!isBridge(x, y)) continue;
    const reach = (dx: number, dy: number) => {
      let cx = x;
      let cy = y;
      while (isBridge(cx, cy)) {
        cx += dx;
        cy += dy;
      }
      return isLand(cx, cy);
    };
    assert.ok((reach(1, 0) && reach(-1, 0)) || (reach(0, 1) && reach(0, -1)), `cầu cụt ở ${k}`);
  }
});
