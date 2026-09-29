import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CATALOG, isTower } from '@/data/city/catalog';
import { generateBuilding } from './buildings';
import { bounds, DONE, isVisible, visibleParts, type Part, type ProcBuilding, type Visual } from './parts';
import { craneHeight, generateTower, workLevel, type TowerVariant } from './towers';

const at = (stage: number, fraction = 1, extra: Partial<Visual> = {}): Visual => ({ stage, fraction, delivered: true, floorsDone: 0, floorStep: 0, craneUp: false, ...extra });
const sig = (b: ProcBuilding, v: Visual) => visibleParts(b, v).length;
const SEEDS = Array.from({ length: 20 }, (_, i) => i * 37 + 5);
const FAMILIES: TowerVariant[] = ['tower_stepped', 'tower_rounded', 'tower_twin', 'tower_observation'];

function overlap(a: Part, b: Part): number {
  const A = bounds(a);
  const B = bounds(b);
  let vol = 1;
  for (let i = 0; i < 3; i++) {
    const d = Math.min(A.max[i]!, B.max[i]!) - Math.max(A.min[i]!, B.min[i]!);
    if (d <= 0) return 0;
    vol *= d;
  }
  return vol;
}

function touches(a: Part, b: Part, tol: number): boolean {
  const A = bounds(a);
  const B = bounds(b);
  for (let i = 0; i < 3; i++) if (A.min[i]! > B.max[i]! + tol || B.min[i]! > A.max[i]! + tol) return false;
  return true;
}

test('cùng seed → cùng công trình; khác seed → khác (nhà ở, cao ốc)', () => {
  for (const type of ['house_wood', 'house_brick', 'townhouse', 'tower_office', 'tower_glass', 'tower_twin', 'tower_observation']) {
    const a = generateBuilding(type, 11);
    const b = generateBuilding(type, 11);
    assert.deepEqual(a.parts, b.parts, type);
    const c = generateBuilding(type, 12);
    assert.notDeepEqual(a.parts.map((p) => p.c), c.parts.map((p) => p.c), `${type} đổi seed phải đổi biến thể`);
  }
});

test('mọi công trình trong catalog sinh được, không có số lỗi (NaN), nằm trong khu đất', () => {
  for (const item of CATALOG) {
    for (const seed of SEEDS.slice(0, 5)) {
      const b = generateBuilding(item.id, seed);
      assert.ok(b.parts.length > 10, `${item.id} quá ít bộ phận`);
      const [W, D] = b.size;
      for (const p of b.parts) {
        for (const v of [...p.p, ...p.s]) assert.ok(Number.isFinite(v), `${item.id}: số lỗi`);
        const bb = bounds(p);
        const pad = item.id === 'dock' ? 0.5 : 0.25;
        assert.ok(bb.min[0] >= -W / 2 - pad && bb.max[0] <= W / 2 + pad, `${item.id}#${seed}: bộ phận tràn khu đất theo x (${bb.min[0].toFixed(2)}..${bb.max[0].toFixed(2)})`);
        assert.ok(bb.min[2] >= -D / 2 - pad && bb.max[2] <= D / 2 + pad, `${item.id}#${seed}: bộ phận tràn khu đất theo z`);
      }
    }
  }
});

test('nhà ở: chín công đoạn nhìn khác nhau rõ ràng', () => {
  for (const type of ['house_wood', 'house_brick', 'townhouse']) {
    const b = generateBuilding(type, 3);
    const counts: number[] = [];
    for (let st = 0; st <= 8; st++) counts.push(sig(b, at(st, 0)));
    counts.push(sig(b, DONE));
    for (let i = 1; i < counts.length; i++) {
      const before = new Set(visibleParts(b, i === counts.length - 1 ? at(8, 0) : at(i - 1, 0)).map((p) => JSON.stringify(p)));
      const after = new Set(visibleParts(b, i === counts.length - 1 ? DONE : at(i, 0)).map((p) => JSON.stringify(p)));
      const diff = [...after].filter((x) => !before.has(x)).length + [...before].filter((x) => !after.has(x)).length;
      assert.ok(diff >= 3, `${type}: công đoạn ${i - 1}→${i} gần như không đổi hình (${diff})`);
    }
  }
});

test('tường lên theo từng hàng trong công đoạn 5', () => {
  const b = generateBuilding('house_brick', 5);
  const walls = (f: number) => visibleParts(b, at(5, f)).filter((p) => p.tag === 'wall').length;
  assert.ok(walls(0) > 0 && walls(0) < walls(0.5) && walls(0.5) < walls(1));
});

test('cửa và cửa sổ không trôi khỏi tường (20 seed)', () => {
  for (const type of ['house_wood', 'house_brick', 'townhouse', 'school', 'hospital', 'library']) {
    for (const seed of SEEDS) {
      const parts = visibleParts(generateBuilding(type, seed), DONE);
      const walls = parts.filter((p) => p.tag === 'wall');
      for (const f of parts.filter((p) => p.tag === 'window' || p.tag === 'door')) {
        assert.ok(walls.some((w) => touches(f, w, 0.03)), `${type}#${seed}: ${f.tag} ở ${f.p.map((n) => n.toFixed(2))} không chạm tường`);
      }
    }
  }
});

test('mái: vì kèo trước, rồi từng phần mái', () => {
  const b = generateBuilding('house_wood', 9);
  const roof = (f: number) => visibleParts(b, at(6, f)).filter((p) => p.stage === 6).length;
  assert.ok(roof(0) < roof(0.4) && roof(0.4) < roof(0.7) && roof(0.7) < roof(1));
});

test('cao ốc: bốn họ × 20 seed — kính không xuyên cột, mỗi tầng đủ khung / sàn / mặt dựng', () => {
  for (const v of FAMILIES) {
    for (const seed of SEEDS) {
      const floors = 10 + (seed % 11);
      const t = generateTower(seed, floors, v);
      for (let f = 0; f < floors; f++) {
        const fl = t.parts.filter((p) => p.floor === f && !p.core && !p.ring);
        for (const step of [0, 1, 2]) assert.ok(fl.some((p) => p.fstep === step), `${v}#${seed} tầng ${f} thiếu bước ${step}`);
        assert.ok(fl.some((p) => p.tag === 'slab'), `${v}#${seed} tầng ${f} thiếu sàn`);
        const glass = fl.filter((p) => p.tag === 'glass' && (p.ry ?? 0) % (Math.PI / 2) === 0);
        const cols = fl.filter((p) => p.tag === 'column');
        for (const g of glass) for (const c of cols) assert.ok(overlap(g, c) < 1e-5, `${v}#${seed} tầng ${f}: kính xuyên cột`);
      }
      assert.ok(t.tower!.floors === floors);
      assert.ok(t.height > floors * 0.3, `${v}: quá thấp`);
    }
  }
});

test('cao ốc xây từng tầng: tầng chưa xây không hiện; có khung chưa có kính; lõi đi trước sàn', () => {
  const t = generateTower(7, 14, 'tower_stepped');
  const vis = (floorsDone: number, floorStep: number) => visibleParts(t, { stage: 4, fraction: 0, delivered: true, floorsDone, floorStep, craneUp: true });
  const f5 = vis(5, 0);
  assert.ok(!f5.some((p) => p.floor !== undefined && p.floor > 5 && !p.core && !p.ring), 'tầng chưa xây không hiện');
  assert.ok(f5.some((p) => p.core && p.floor === 6), 'lõi đi trước một tầng');
  assert.ok(!f5.some((p) => p.core && p.floor === 7));
  const frameOnly = vis(5, 1);
  assert.ok(frameOnly.some((p) => p.floor === 5 && p.fstep === 0));
  assert.ok(!frameOnly.some((p) => p.floor === 5 && p.tag === 'glass'), 'tầng có khung chưa có kính');
  const slabNoGlass = vis(5, 2);
  assert.ok(slabNoGlass.some((p) => p.floor === 5 && p.tag === 'slab'));
  assert.ok(!slabNoGlass.some((p) => p.floor === 5 && p.tag === 'glass'), 'có sàn nhưng chưa mặt dựng');
  // Giàn giáo chỉ quanh tầng đang thi công.
  const rings = vis(8, 1).filter((p) => p.ring).map((p) => p.floor);
  assert.ok(rings.length > 0 && rings.every((f) => f === 7 || f === 8));
  assert.equal(visibleParts(t, DONE).filter((p) => p.ring).length, 0, 'xong thì không còn giàn giáo');
});

test('công nhân đứng trên sàn đã có; cần cẩu luôn cao hơn tầng đang xây, không vượt đỉnh quá xa', () => {
  const t = generateTower(9, 16, 'tower_rounded');
  let prev = -1;
  for (let f = 0; f < 16; f++) {
    const lvl = workLevel(t.tower!, f, 0);
    assert.ok(lvl > prev);
    prev = lvl;
    assert.ok(craneHeight(t, f) > workLevel(t.tower!, f, 3) + 0.3);
    assert.ok(craneHeight(t, f) <= t.height + 0.8 + 1e-9);
  }
});

test('bốn họ cao ốc phân biệt được bằng dáng (không chỉ màu)', () => {
  const profile = (v: TowerVariant) => {
    const t = generateTower(21, 16, v);
    const done = visibleParts(t, DONE).filter((p) => p.floor !== undefined && !p.core);
    const widthAt = (f: number) => {
      const ps = done.filter((p) => p.floor === f);
      return Math.max(...ps.map((p) => bounds(p).max[0])) - Math.min(...ps.map((p) => bounds(p).min[0]));
    };
    return [widthAt(6), widthAt(11), widthAt(15), t.height, t.size[0]].map((n) => Math.round(n * 10));
  };
  const profiles = FAMILIES.map((v) => JSON.stringify(profile(v)));
  assert.equal(new Set(profiles).size, 4, profiles.join(' | '));
  // tháp đôi: khe hở giữa hai thân nhìn thấy được ở tầng giữa
  const twin = generateTower(21, 16, 'tower_twin');
  const mid = visibleParts(twin, DONE).filter((p) => p.floor === 10 && !p.core && p.tag === 'glass');
  assert.ok(!mid.some((p) => bounds(p).min[0] < 0.1 && bounds(p).max[0] > 0.2), 'khe giữa hai thân bị lấp');
});

test('cao ốc có khối đế, tầng kỹ thuật khác nhịp và đỉnh riêng', () => {
  for (const v of FAMILIES) {
    const t = generateTower(4, 15, v);
    const pod = t.tower!.podium;
    assert.ok(pod >= 1 && pod <= 3);
    const louvers = t.parts.filter((p) => p.floor !== undefined && p.fstep === 2 && p.c === '#4A5360');
    assert.ok(louvers.length > 0, `${v}: thiếu tầng kỹ thuật`);
    assert.ok(t.parts.some((p) => p.stage === 6 && p.glow), `${v}: đỉnh phải có đèn cảnh báo`);
    assert.ok(t.parts.some((p) => p.stage === 7 && p.tag === 'door'), `${v}: thiếu lối vào sảnh`);
  }
});

test('không bộ phận nào của công đoạn chưa tới hiện trước', () => {
  const b = generateBuilding('house_brick', 2);
  for (const p of visibleParts(b, at(3, 0.5))) assert.ok(p.stage <= 3 || (p.until ?? 99) <= 3);
  assert.ok(isVisible({ shape: 'box', p: [0, 0, 0], s: [1, 1, 1], c: '#000', stage: 2 }, at(3)));
});

test('catalog cao ốc dùng generateTower (có tầng, có cần cẩu)', () => {
  for (const item of CATALOG.filter(isTower)) {
    const b = generateBuilding(item.id, 13);
    assert.ok(b.tower, item.id);
    assert.ok(b.tower!.crane.jib > 1.5);
  }
});
