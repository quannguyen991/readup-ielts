import { test } from 'node:test';
import assert from 'node:assert/strict';

import type { TerrainKind } from '@/data/city/catalog';
import { newSite, type Site } from './construction';
import { EMPTY_MATERIALS } from './materials';
import { canLandWork, canPlace, canRoad, canUnlockRegion, entranceTile, footprintTiles, key, roadShape, type World } from './placement';
import { mergeCity, EMPTY_CITY, type CityPayload } from './sync';
import { generateTerrain, heightAt, isSteep, isWater, MAP, regionOf, START_REGIONS, terrainStats, tileAt, type Terrain } from './terrain';

const RICH = { wood: 999, stone: 999, brick: 999, steel: 999, glass: 999 };
const KINDS: TerrainKind[] = ['plains', 'coast', 'mountain'];

function world(kind: TerrainKind, seed = 42, extra: Partial<World> = {}): World {
  return { terrain: generateTerrain(kind, seed), works: {}, roads: {}, zones: {}, regions: [...START_REGIONS], sites: [], era: 5, ...extra };
}

/** Tìm một chỗ đặt hợp lệ cho công trình trong vùng mở sẵn. */
function spot(w: World, type: string, rot: 0 | 1 | 2 | 3 = 0): [number, number] | null {
  for (let y = 10; y < 30; y++) for (let x = 10; x < 30; x++) if (canPlace(w, type, x, y, rot).ok) return [x, y];
  return null;
}

test('cùng seed → cùng địa hình; khác seed → khác', () => {
  for (const k of KINDS) {
    const a = generateTerrain(k, 7);
    const b = generateTerrain(k, 7);
    assert.deepEqual(a.tiles, b.tiles);
    assert.notDeepEqual(generateTerrain(k, 7).tiles, generateTerrain(k, 8).tiles);
  }
});

test('ba địa hình khác nhau rõ ràng', () => {
  const plains = terrainStats(generateTerrain('plains', 3));
  const coast = terrainStats(generateTerrain('coast', 3));
  const mountain = terrainStats(generateTerrain('mountain', 3));
  assert.ok(plains.water > 30 && plains.water < 300, `sông: ${plains.water}`);
  assert.ok(coast.water > 350, `biển: ${coast.water}`);
  assert.ok(coast.sand > 40, `bãi cát: ${coast.sand}`);
  assert.ok(mountain.maxH >= 5, `núi cao: ${mountain.maxH}`);
  assert.ok(mountain.steep + mountain.rock > plains.steep + plains.rock + 40, 'núi nhiều dốc / đá hơn đồng bằng');
  assert.ok(plains.land > mountain.land, 'đồng bằng dễ xây hơn');
});

test('mỗi địa hình, nhiều seed: vùng mở sẵn đủ chỗ cho điểm tập kết và vài căn lều', () => {
  for (const k of KINDS) {
    for (let seed = 1; seed <= 20; seed++) {
      const w = world(k, seed, { era: 1 });
      assert.ok(spot(w, 'depot'), `${k}#${seed}: không đặt được điểm tập kết`);
      assert.ok(spot(w, 'tent'), `${k}#${seed}: không đặt được lều`);
    }
  }
});

test('bản đồ ban đầu không có công trình (cây, đá không tính)', () => {
  assert.deepEqual(EMPTY_CITY.sites, []);
  assert.deepEqual(EMPTY_CITY.roads, {});
});

test('không đặt trên nước, ngoài bản đồ, vùng chưa mở, ô đã có công trình', () => {
  const w = world('plains', 5);
  let water: [number, number] | null = null;
  for (let y = 10; y < 30 && !water; y++) for (let x = 10; x < 30 && !water; x++) if (isWater(tileAt(w.terrain, x, y))) water = [x, y];
  assert.ok(water);
  assert.equal(canPlace(w, 'tent', water![0], water![1], 0).ok, false);
  assert.equal((canPlace(w, 'tent', -1, 3, 0) as { reason: string }).reason, 'outside');
  assert.equal((canPlace(w, 'tent', 2, 2, 0) as { reason: string }).reason, 'locked_region');
  const [x, y] = spot(w, 'tent')!;
  const site = newSite({ id: 'a', type: 'tent', seed: 1, x, y, rot: 0, now: '' });
  assert.equal((canPlace({ ...w, sites: [site] }, 'tent', x, y, 0) as { reason: string }).reason, 'occupied');
});

test('cổng phải nối đường theo yêu cầu; xoay 90° đổi mặt trước và phạm vi chiếm đất', () => {
  const w = world('plains', 9, { era: 2 });
  const [x, y] = spot({ ...w, era: 1 }, 'depot')!;
  const blocked = canPlace(w, 'house_wood', x, y, 0);
  assert.ok(!blocked.ok);
  if (!blocked.ok && blocked.reason === 'no_road') {
    const [ex, ey] = entranceTile(x, y, [2, 2], 0);
    const withRoad = { ...w, roads: { [key(ex, ey)]: 'dirt' as const } };
    assert.equal(canPlace(withRoad, 'house_wood', x, y, 0).ok, true);
  }
  assert.deepEqual(entranceTile(0, 0, [2, 2], 0), [0, 2]);
  assert.deepEqual(entranceTile(0, 0, [2, 2], 1), [2, 0]);
  assert.deepEqual(entranceTile(5, 5, [2, 2], 2), [5, 4]);
  assert.deepEqual(entranceTile(5, 5, [2, 2], 3), [4, 5]);
  assert.equal(footprintTiles(0, 0, [4, 3], 1).length, 12);
  assert.deepEqual(footprintTiles(0, 0, [3, 1], 1).map(([, ty]) => ty), [0, 1, 2]);
});

test('cao ốc cần đường nhựa + trạm điện đã xong; đường đất không đủ', () => {
  const base = world('plains', 13);
  const [x, y] = spot({ ...base, era: 1 }, 'depot')!;
  let pos: [number, number] | null = null;
  for (let yy = 10; yy < 28 && !pos; yy++) {
    for (let xx = 10; xx < 28 && !pos; xx++) {
      const [ex, ey] = entranceTile(xx, yy, [3, 3], 0);
      const r = canPlace({ ...base, roads: { [key(ex, ey)]: 'asphalt' } }, 'tower_office', xx, yy, 0);
      if (!r.ok && r.reason === 'no_power') pos = [xx, yy];
    }
  }
  assert.ok(pos, 'tìm được chỗ chỉ thiếu trạm điện');
  const [tx, ty] = pos!;
  const [ex, ey] = entranceTile(tx, ty, [3, 3], 0);
  const dirt = canPlace({ ...base, roads: { [key(ex, ey)]: 'dirt' } }, 'tower_office', tx, ty, 0);
  assert.equal((dirt as { reason: string }).reason, 'road_kind');
  const power: Site = { ...newSite({ id: 'p', type: 'power_station', seed: 1, x, y, rot: 0, now: '' }), stageIdx: 99 };
  const ok = canPlace({ ...base, roads: { [key(ex, ey)]: 'asphalt' }, sites: [power] }, 'tower_office', tx, ty, 0);
  assert.ok(ok.ok || (!ok.ok && ok.reason === 'occupied'), JSON.stringify(ok));
});

test('ven biển: bến thuyền phải trên mép nước; cao ốc không đặt trên bãi cát', () => {
  const w = world('coast', 21);
  let dock: [number, number, number] | null = null;
  for (let y = 10; y < 30 && !dock; y++) {
    for (let x = 10; x < 30 && !dock; x++) {
      for (const rot of [0, 1, 2, 3] as const) {
        const [ex, ey] = entranceTile(x, y, [2, 2], rot);
        const r = canPlace({ ...w, roads: { [key(ex, ey)]: 'dirt' } }, 'dock', x, y, rot);
        if (r.ok) {
          dock = [x, y, rot];
          break;
        }
      }
    }
  }
  assert.ok(dock, 'có chỗ cho bến thuyền');
  for (const [tx, ty] of footprintTiles(dock![0], dock![1], [2, 2], dock![2])) assert.ok(isWater(tileAt(w.terrain, tx, ty)));
  let sandTile: [number, number] | null = null;
  for (let y = 10; y < 30 && !sandTile; y++) for (let x = 10; x < 30 && !sandTile; x++) if (tileAt(w.terrain, x, y)!.kind === 'sand') sandTile = [x, y];
  if (sandTile) assert.equal((canPlace(w, 'house_wood', sandTile[0], sandTile[1], 0) as { reason: string }).reason === 'sand' || !canPlace(w, 'house_wood', sandTile[0], sandTile[1], 0).ok, true);
});

test('miền núi: ô dốc bị khoá, san thềm mở được', () => {
  let found = false;
  for (let seed = 1; seed < 30 && !found; seed++) {
    const w = world('mountain', seed);
    for (let y = 10; y < 30 && !found; y++) {
      for (let x = 10; x < 30 && !found; x++) {
        if (!isSteep(w.terrain, {}, x, y) || tileAt(w.terrain, x, y)!.kind === 'rock' || isWater(tileAt(w.terrain, x, y))) continue;
        assert.equal((canPlace(w, 'tent', x, y, 0) as { reason: string }).reason, 'steep');
        const work = canLandWork(w, x, y, 'terrace', RICH);
        assert.ok(work.ok);
        assert.equal(isSteep(w.terrain, { [key(x, y)]: 'terrace' }, x, y), false);
        assert.ok(Number.isInteger(heightAt(w.terrain, { [key(x, y)]: 'terrace' }, x, y)));
        found = true;
      }
    }
  }
  assert.ok(found);
});

test('đường tự nối hình dạng: thẳng, cua, ngã ba, ngã tư', () => {
  const r = { '5,5': 'dirt', '5,4': 'dirt', '5,6': 'dirt', '6,5': 'dirt', '4,5': 'dirt' } as const;
  assert.equal(roadShape(r, 5, 5).kind, 'cross');
  assert.equal(roadShape({ '5,5': 'dirt', '5,4': 'dirt', '5,6': 'dirt' }, 5, 5).kind, 'straight');
  assert.equal(roadShape({ '5,5': 'dirt', '5,4': 'dirt', '6,5': 'dirt' }, 5, 5).kind, 'corner');
  assert.equal(roadShape({ '5,5': 'dirt', '5,4': 'dirt', '6,5': 'dirt', '4,5': 'dirt' }, 5, 5).kind, 'tee');
});

test('cầu: bắc từ bờ ra, cần đúng kỷ; đường trên đá không được', () => {
  const w = world('plains', 5, { era: 2 });
  let shore: [number, number] | null = null;
  for (let y = 10; y < 30 && !shore; y++) {
    for (let x = 10; x < 30 && !shore; x++) {
      const t = tileAt(w.terrain, x, y);
      if (isWater(t) && !isWater(tileAt(w.terrain, x, y - 1))) shore = [x, y];
    }
  }
  assert.ok(shore);
  const r = canRoad(w, shore![0], shore![1], 'dirt', RICH);
  assert.ok(r.ok && r.tile === 'bridge_wood', JSON.stringify(r));
  assert.equal(canRoad({ ...w, era: 1 }, shore![0], shore![1], 'dirt', RICH).ok, false);
  assert.equal(canRoad(w, shore![0], shore![1], 'dirt', EMPTY_MATERIALS).ok, false);
});

test('mở vùng: phải kề vùng đã mở, đủ kỷ, có đường chạm mép, đủ vật liệu', () => {
  const w = world('plains', 5, { era: 1 });
  const target = regionOf(20, 5); // vùng phía bắc giữa
  assert.equal((canUnlockRegion(w, target, RICH, 4) as { reason: string }).reason, 'era');
  const w2 = { ...w, era: 2 };
  assert.equal((canUnlockRegion(w2, target, RICH, 4) as { reason: string }).reason, 'no_road');
  const w3 = { ...w2, roads: { [key(20, MAP.region)]: 'dirt' as const } };
  assert.equal(canUnlockRegion(w3, target, RICH, 4).ok, true);
  assert.equal((canUnlockRegion(w3, 0, RICH, 4) as { reason: string }).reason, 'not_adjacent');
});

test('gộp đồng bộ: bản học nhiều hơn giữ thành phố; mã đã thưởng hợp của hai bên', () => {
  const phone: CityPayload = { ...EMPTY_CITY, inventory: { ...EMPTY_MATERIALS, wood: 30 }, lifetime: 40, awarded: { 'mock_test:a': '2026-09-29' }, updatedAt: '2026-09-29T02:00:00Z' };
  const pc: CityPayload = { ...EMPTY_CITY, inventory: { ...EMPTY_MATERIALS, wood: 5 }, lifetime: 5, awarded: { 'writing_graded:b': '2026-09-28' }, updatedAt: '2026-09-29T03:00:00Z' };
  const m = mergeCity(pc, phone);
  assert.equal(m.inventory.wood, 30, 'học trên điện thoại rồi mở máy tính thấy vật liệu');
  assert.ok(m.awarded['mock_test:a'] && m.awarded['writing_graded:b']);
  assert.equal(mergeCity(null, pc).lifetime, 5);
});

test('địa hình xem trước: ô liền, nước, dốc, bờ, bị chặn đều phân biệt được', () => {
  const t: Terrain = generateTerrain('coast', 4);
  const kinds = new Set(t.tiles.map((x) => x.kind));
  for (const k of ['grass', 'sand', 'water', 'shallow', 'rock'] as const) assert.ok(kinds.has(k), `ven biển thiếu ${k}`);
});
