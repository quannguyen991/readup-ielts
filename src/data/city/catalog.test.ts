import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CATALOG, ERA_INFO, isTower, ROADS } from './catalog';
import { cityAvailableFor } from '@/services/city/availability-rule';
import { canAdvanceEra, eraChecklist } from '@/services/city/progression';
import type { Site } from '@/services/city/construction';

test('catalog: mã không trùng, mỗi mục đủ trường bắt buộc', () => {
  const ids = CATALOG.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const b of CATALOG) {
    assert.ok(b.vi && b.en, `${b.id} thiếu tên`);
    assert.ok(b.era >= 1 && b.era <= 5);
    assert.ok(b.size[0] >= 1 && b.size[1] >= 1);
    assert.ok(b.stages.length >= 3, `${b.id} quá ít công đoạn`);
    assert.deepEqual([...b.stages], [...b.stages].sort((x, y) => x - y), `${b.id} công đoạn sai thứ tự`);
    assert.equal(b.stages[0], 0, `${b.id} phải bắt đầu bằng khảo sát`);
    assert.equal(b.stages[b.stages.length - 1], 8, `${b.id} phải kết thúc bằng cảnh quan / nghiệm thu`);
    assert.ok(['procgen', 'model', 'hybrid'].includes(b.source));
    assert.ok(b.shifts >= 1);
  }
});

test('mỗi kỷ đều có công trình, đủ các loại đặc tả yêu cầu', () => {
  for (const era of [1, 2, 3, 4, 5] as const) assert.ok(CATALOG.some((b) => b.era === era), `kỷ ${era} rỗng`);
  for (const id of ['tent', 'campfire', 'well', 'depot', 'house_wood', 'warehouse', 'dock', 'fence', 'house_brick', 'school', 'library', 'market', 'lamp', 'townhouse', 'post_office', 'hospital', 'fountain_plaza', 'lighthouse', 'station', 'power_station', 'vocab_house', 'reading_house', 'listen_house', 'academy']) {
    assert.ok(CATALOG.some((b) => b.id === id), `thiếu ${id}`);
  }
  assert.equal(Object.keys(ERA_INFO).length, 5);
  assert.ok(ROADS.dirt && ROADS.stone && ROADS.asphalt);
});

test('nhà ở đi đủ chín công đoạn', () => {
  for (const id of ['house_wood', 'house_brick', 'townhouse']) {
    assert.deepEqual([...CATALOG.find((b) => b.id === id)!.stages], [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  }
});

test('cao ốc chỉ ở Kỷ 5, cần đường nhựa + trạm điện, có bốn họ kiến trúc', () => {
  const towers = CATALOG.filter(isTower);
  assert.ok(towers.length >= 4);
  assert.equal(new Set(towers.map((t) => t.gen)).size, 4);
  for (const t of towers) {
    assert.equal(t.era, 5);
    assert.equal(t.place.road, 'asphalt');
    assert.equal(t.place.power, true);
    assert.equal(t.crew, 'tower');
    assert.ok(t.floors && t.floors[0] >= 10 && t.floors[1] <= 20);
  }
});

test('công trình kỹ năng dẫn tới một màn học', () => {
  const skill = CATALOG.filter((b) => b.skill);
  assert.ok(skill.length >= 5);
  for (const b of skill) assert.ok(b.skill!.route.startsWith('/'));
});

test('chỉ có trên máy tính: web + chuột + rộng ≥ 1024', () => {
  assert.equal(cityAvailableFor({ os: 'web', pointerFine: true, width: 1280 }), true);
  assert.equal(cityAvailableFor({ os: 'web', pointerFine: true, width: 1023 }), false);
  assert.equal(cityAvailableFor({ os: 'web', pointerFine: false, width: 1366 }), false, 'máy tính bảng cảm ứng');
  assert.equal(cityAvailableFor({ os: 'ios', pointerFine: true, width: 2000 }), false);
  assert.equal(cityAvailableFor({ os: 'android', pointerFine: false, width: 390 }), false);
});

test('lên kỷ cần cấp học, dân số và công trình nền', () => {
  const done = (type: string, i: number): Site => ({ id: `${type}${i}`, type, seed: i, x: i, y: 0, rot: 0, stageIdx: 99, shifts: 0, delivered: true, startedAt: '', crew: null, createdAt: '' });
  const camp = [done('tent', 1), done('tent', 2), done('campfire', 3), done('well', 4), done('depot', 5)];
  assert.equal(canAdvanceEra(1, camp, 2), true);
  assert.equal(canAdvanceEra(1, camp, 1), false, 'thiếu cấp học');
  assert.equal(canAdvanceEra(1, camp.slice(1), 5), false, 'thiếu lều → thiếu dân và công trình');
  assert.equal(eraChecklist(5, camp, 99), null, 'kỷ 5 là kỷ cuối');
});
