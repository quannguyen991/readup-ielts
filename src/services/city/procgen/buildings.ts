/**
 * generateBuilding(type, seed, era) — công trình thấp tầng sinh bằng code, có
 * nhãn công đoạn cho từng bộ phận (xem `parts.ts`). Cao ốc ở `towers.ts`.
 *
 * Mọi công trình đi qua phần CÔNG TRƯỜNG chung (khảo sát → dọn nền → hố móng →
 * móng) rồi tới THÂN riêng của từng họ: khung → tường theo hàng (chừa lỗ cửa)
 * → mái từng phần → hoàn thiện (cửa, cửa sổ, sơn, đèn, biển) → cảnh quan
 * (tháo giàn giáo, dọn vật liệu thừa, lối vào, cây).
 *
 * Tỉ lệ: 1 ô = 1 đơn vị; một tầng nhà ~0.5–0.62; tường dày 0.05. Cùng seed →
 * cùng nhà (chỉ lưu seed + trạng thái xây, không lưu hình).
 */
import { catalogItem, isTower, type CatalogBuilding } from '@/data/city/catalog';
import { PALETTE, pick } from '@/data/city/palette';
import { floorsFor, stageCost } from '../construction';
import type { MaterialKind } from '../materials';
import { Builder, rng, type ProcBuilding } from './parts';
import {
  bench,
  bush,
  fenceRun,
  flowers,
  materialStack,
  projectSign,
  rock,
  rope,
  soilPile,
  stake,
  streetLamp,
  toolbox,
  treePine,
  treeRound,
  wheelbarrow,
} from './props';
import { generateTower, type TowerVariant } from './towers';

const P = PALETTE;
const T = 0.05; // độ dày tường

type Side = 'front' | 'back' | 'left' | 'right';
export type Opening = { side: Side; u: number; w: number; y0: number; h: number; kind: 'door' | 'window' | 'shop' };
type Body = { cx: number; cz: number; w: number; d: number; y0: number };

// ------------------------------------------------------------------ phần công trường chung

function has(item: CatalogBuilding, stage: number): boolean {
  return item.stages.includes(stage);
}

/** Công đoạn 0–3 + đống vật liệu được giao ở mỗi công đoạn + cảnh quan chung. */
function siteWorks(b: Builder, item: CatalogBuilding, body: Body, r: () => number) {
  const [W, D] = item.size;
  const hw = body.w / 2 + 0.08;
  const hd = body.d / 2 + 0.08;
  const { cx, cz } = body;
  const corners: [number, number][] = [
    [cx - hw, cz - hd],
    [cx + hw, cz - hd],
    [cx + hw, cz + hd],
    [cx - hw, cz + hd],
  ];
  // 0 — Khảo sát: cọc mốc 4 góc, dây căng, biển dự án + bản vẽ.
  if (has(item, 0)) {
    b.at(0, 0, 3);
    for (const [x, z] of corners) stake(b, x, z);
    b.at(0, 0, 2);
    for (let i = 0; i < 4; i++) rope(b, corners[i]![0], corners[i]![1], corners[(i + 1) % 4]![0], corners[(i + 1) % 4]![1]);
    b.at(0, 0, 8);
    projectSign(b, -W / 2 + 0.2, D / 2 - 0.15, 0.3);
    b.spot(0, cx - hw, 0, cz + hd).spot(0, cx + hw, 0, cz - hd);
  }
  // 1 — Dọn mặt bằng: lộ nền đất, dụng cụ tập kết.
  if (has(item, 1)) {
    b.at(1, 0, 8).box(cx, 0, cz, body.w + 0.3, 0.02, body.d + 0.3, P.terrain.dirt);
    b.at(1, 0, 8);
    toolbox(b, W / 2 - 0.2, -D / 2 + 0.2);
    wheelbarrow(b, W / 2 - 0.25, D / 2 - 0.3, 0.6);
    b.at(1, 0.5, 3);
    soilPile(b, -W / 2 + 0.18, -D / 2 + 0.2, 0.09);
    b.spot(1, cx, 0, cz + hd + 0.1).spot(1, cx - hw, 0, cz);
  }
  // 2 — Đào móng: vành hố có thành đất, đáy hố sẫm, đống đất lớn dần.
  if (has(item, 2)) {
    b.at(2, 0, 4);
    b.box(cx, 0.02, cz, body.w + 0.1, 0.012, body.d + 0.1, P.terrain.soilDark);
    const rim = 0.07;
    b.box(cx, 0, cz - hd, body.w + 0.24, rim, 0.08, P.terrain.soil);
    b.box(cx, 0, cz + hd, body.w + 0.24, rim, 0.08, P.terrain.soil);
    b.box(cx - hw, 0, cz, 0.08, rim, body.d + 0.1, P.terrain.soil);
    b.box(cx + hw, 0, cz, 0.08, rim, body.d + 0.1, P.terrain.soil);
    b.at(2, 0, 8);
    soilPile(b, -W / 2 + 0.2, D / 2 - 0.45, 0.12);
    b.at(2, 0.5, 8);
    soilPile(b, W / 2 - 0.22, -D / 2 + 0.45, 0.15);
    b.spot(2, cx - hw * 0.5, 0.02, cz).spot(2, cx + hw * 0.5, 0.02, cz);
  }
  // 3 — Làm móng: ván khuôn, dải móng, cốt thép, rồi mặt nền.
  if (has(item, 3)) {
    b.at(3, 0, 4);
    b.box(cx, 0, cz - hd + 0.02, body.w + 0.16, 0.1, 0.02, P.construction.formwork);
    b.box(cx, 0, cz + hd - 0.02, body.w + 0.16, 0.1, 0.02, P.construction.formwork);
    b.at(3, 0);
    b.box(cx, 0, cz - body.d / 2, body.w, 0.05, 0.1, P.construction.concrete);
    b.box(cx, 0, cz + body.d / 2, body.w, 0.05, 0.1, P.construction.concrete);
    b.box(cx - body.w / 2, 0, cz, 0.1, 0.05, body.d, P.construction.concrete);
    b.box(cx + body.w / 2, 0, cz, 0.1, 0.05, body.d, P.construction.concrete);
    b.at(3, 0.34, 4);
    const bars = Math.max(3, Math.round(body.w / 0.18));
    for (let i = 0; i <= bars; i++) b.box(cx - body.w / 2 + (i * body.w) / bars, 0.05, cz, 0.012, 0.012, body.d, P.construction.rebar);
    for (let j = 0; j <= 3; j++) b.box(cx, 0.062, cz - body.d / 2 + (j * body.d) / 3, body.w, 0.012, 0.012, P.construction.rebar);
    b.at(3, 0.67);
    b.box(cx, 0, cz, body.w + 0.1, body.y0, body.d + 0.1, item.era >= 3 ? P.stone.mid : P.stone.dark);
    b.spot(3, cx - hw, 0.02, cz + hd).spot(3, cx + hw * 0.4, 0.05, cz);
  }
  // Đống vật liệu được giao cho từng công đoạn (chỉ hiện khi đã giao, dọn khi xong công đoạn).
  const pileSpots: [number, number][] = [
    [W / 2 - 0.2, D / 2 - 0.2],
    [-W / 2 + 0.2, -D / 2 + 0.25],
  ];
  for (const st of item.stages) {
    if (st === 8) continue;
    const cost = stageCost(item, st);
    const kinds = (Object.keys(cost) as MaterialKind[]).filter((k) => (cost[k] ?? 0) > 0).slice(0, 2);
    kinds.forEach((k, i) => {
      b.at(st, 0, st + 1).with({ delivery: true });
      const [x, z] = pileSpots[i]!;
      materialStack(b, k, x, z, Math.min(4, 1 + Math.floor((cost[k] ?? 0) / 8)));
    });
  }
  return corners;
}

/** Cảnh quan chung công đoạn 8: lối vào, cây, bụi, hoa. */
function landscape(b: Builder, item: CatalogBuilding, body: Body, r: () => number, opts: { fence?: boolean; path?: string } = {}) {
  if (!has(item, 8)) return;
  const [W, D] = item.size;
  b.at(8, 0);
  const front = body.cz + body.d / 2;
  const pathLen = D / 2 - front;
  if (pathLen > 0.05) b.box(body.cx, 0, front + pathLen / 2, 0.3, 0.015, pathLen, opts.path ?? P.stone.paving);
  b.at(8, 0.3);
  const spots: [number, number][] = [
    [-W / 2 + 0.22, D / 2 - 0.22],
    [W / 2 - 0.22, -D / 2 + 0.22],
    [W / 2 - 0.2, D / 2 - 0.25],
  ];
  spots.forEach(([x, z], i) => {
    if (i === 0) treeRound(b, x, z, 0.9, r);
    else if (i === 1) (r() < 0.5 ? treePine : treeRound)(b, x, z, 0.8, r);
    else bush(b, x, z, 1, r);
  });
  b.at(8, 0.6);
  flowers(b, body.cx - 0.35, front + 0.12, r, 0, 4);
  if (opts.fence) {
    b.at(8, 0.8);
    fenceRun(b, -W / 2 + 0.06, D / 2 - 0.06, body.cx - 0.2, D / 2 - 0.06);
    fenceRun(b, body.cx + 0.2, D / 2 - 0.06, W / 2 - 0.06, D / 2 - 0.06);
  }
  b.spot(8, body.cx + 0.3, 0, front + 0.2).spot(8, -W / 2 + 0.35, 0, D / 2 - 0.3);
}

/** Giàn giáo quanh thân (công đoạn 4 dựng, công đoạn 8 tháo). Chỉ mặt trước + một bên để nhà vẫn dễ đọc. */
function scaffold(b: Builder, body: Body, height: number) {
  b.at(4, 0.5, 8);
  const off = 0.12;
  const x0 = body.cx - body.w / 2 - off;
  const x1 = body.cx + body.w / 2 + off;
  const zf = body.cz + body.d / 2 + off;
  const zb = body.cz - body.d / 2 - off;
  const pole = P.construction.scaffoldPole;
  for (const x of [x0, (x0 + x1) / 2, x1]) b.box(x, 0, zf, 0.025, height, 0.025, pole);
  for (const z of [zf, (zf + zb) / 2, zb]) b.box(x1, 0, z, 0.025, height, 0.025, pole);
  const lift = Math.max(1, Math.round(height / 0.5));
  for (let i = 1; i <= lift; i++) {
    const y = Math.min(height - 0.02, (i * height) / lift);
    b.box((x0 + x1) / 2, y, zf, x1 - x0, 0.025, 0.1, P.construction.scaffold);
    b.box(x1, y, (zf + zb) / 2, 0.1, 0.025, zf - zb, P.construction.scaffold);
  }
}

// ------------------------------------------------------------------ tường có lỗ cửa

/** Khoảng trên cạnh tường còn lại sau khi trừ các lỗ cửa cắt qua hàng [y0, y1]. */
function segments(len: number, holes: { u: number; w: number }[]): [number, number][] {
  const cuts = holes.map((h) => [h.u - h.w / 2, h.u + h.w / 2] as [number, number]).sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  let at = -len / 2;
  for (const [a, c] of cuts) {
    if (a > at + 0.005) out.push([at, a]);
    at = Math.max(at, c);
  }
  if (at < len / 2 - 0.005) out.push([at, len / 2]);
  return out;
}

/**
 * Xây tường theo HÀNG (công đoạn `stage`, thứ tự `order0 → order0+span`): mỗi
 * hàng là các đoạn hộp chừa đúng lỗ cửa. `color(row)` cho hàng gạch / ván.
 */
function walls(
  b: Builder,
  body: Body,
  height: number,
  rows: number,
  openings: Opening[],
  color: (row: number) => string,
  opts: { stage?: number; order0?: number; span?: number; paint?: string; sides?: Side[] } = {},
) {
  const stage = opts.stage ?? 5;
  const sides = opts.sides ?? ['front', 'back', 'left', 'right'];
  const rh = height / rows;
  for (let row = 0; row < rows; row++) {
    const y0 = body.y0 + row * rh;
    const y1 = y0 + rh;
    b.at(stage, (opts.order0 ?? 0) + ((opts.span ?? 1) * row) / rows);
    for (const side of sides) {
      const along = side === 'front' || side === 'back';
      const len = along ? body.w : body.d - 2 * T;
      const holes = openings.filter((o) => o.side === side && o.y0 < y1 - 0.001 && o.y0 + o.h > y0 + 0.001);
      for (const [a, c] of segments(len, holes)) {
        const mid = (a + c) / 2;
        const seg = c - a;
        const col = color(row);
        if (side === 'front') b.box(body.cx + mid, y0, body.cz + body.d / 2 - T / 2, seg, rh, T, col, { paint: opts.paint, tag: 'wall' });
        else if (side === 'back') b.box(body.cx + mid, y0, body.cz - body.d / 2 + T / 2, seg, rh, T, col, { paint: opts.paint, tag: 'wall' });
        else if (side === 'left') b.box(body.cx - body.w / 2 + T / 2, y0, body.cz + mid, T, rh, seg, col, { paint: opts.paint, tag: 'wall' });
        else b.box(body.cx + body.w / 2 - T / 2, y0, body.cz + mid, T, rh, seg, col, { paint: opts.paint, tag: 'wall' });
      }
    }
  }
}

/** Toạ độ + góc quay của một điểm trên mặt tường (u dọc tường, ra ngoài `out`). */
function onWall(body: Body, side: Side, u: number, out: number): { x: number; z: number; ry: number } {
  switch (side) {
    case 'front':
      return { x: body.cx + u, z: body.cz + body.d / 2 + out, ry: 0 };
    case 'back':
      return { x: body.cx + u, z: body.cz - body.d / 2 - out, ry: Math.PI };
    case 'left':
      return { x: body.cx - body.w / 2 - out, z: body.cz + u, ry: -Math.PI / 2 };
    default:
      return { x: body.cx + body.w / 2 + out, z: body.cz + u, ry: Math.PI / 2 };
  }
}

/** Hộp nằm trên mặt tường: rộng `w` theo tường, cao `h`, dày `t` (hướng ra ngoài). */
function wallBox(b: Builder, body: Body, side: Side, u: number, y: number, w: number, h: number, t: number, out: number, c: string, extra: Record<string, unknown> = {}) {
  const at = onWall(body, side, u, out);
  const along = side === 'front' || side === 'back';
  b.box(at.x, y, at.z, along ? w : t, h, along ? t : w, c, extra);
}

/** Hoàn thiện lỗ cửa: kính + khung + bậu (cửa sổ), cánh cửa + khung + bậc (cửa đi), cửa chớp tuỳ chọn. */
function fixtures(b: Builder, body: Body, openings: Opening[], opts: { frame: string; glass: string; door: string; shutter?: string; stage?: number; order?: number }) {
  b.at(opts.stage ?? 7, opts.order ?? 0);
  for (const o of openings) {
    const fw = 0.025;
    if (o.kind === 'door') {
      wallBox(b, body, o.side, o.u, o.y0, o.w, o.h, T * 0.6, -T / 2, opts.door, { tag: 'door' });
      wallBox(b, body, o.side, o.u - o.w / 2 - fw / 2, o.y0, fw, o.h + fw, T + 0.02, -T / 2, opts.frame);
      wallBox(b, body, o.side, o.u + o.w / 2 + fw / 2, o.y0, fw, o.h + fw, T + 0.02, -T / 2, opts.frame);
      wallBox(b, body, o.side, o.u, o.y0 + o.h, o.w + 2 * fw, fw, T + 0.02, -T / 2, opts.frame);
      wallBox(b, body, o.side, o.u + o.w * 0.3, o.y0 + o.h * 0.45, 0.03, 0.03, 0.03, 0.01, P.accent.gold);
    } else {
      wallBox(b, body, o.side, o.u, o.y0, o.w, o.h, T * 0.4, -T / 2, opts.glass, { tag: 'window' });
      wallBox(b, body, o.side, o.u - o.w / 2 - fw / 2, o.y0, fw, o.h, T + 0.02, -T / 2, opts.frame);
      wallBox(b, body, o.side, o.u + o.w / 2 + fw / 2, o.y0, fw, o.h, T + 0.02, -T / 2, opts.frame);
      wallBox(b, body, o.side, o.u, o.y0 + o.h, o.w + 2 * fw, fw, T + 0.02, -T / 2, opts.frame);
      wallBox(b, body, o.side, o.u, o.y0 - 0.02, o.w + 0.06, 0.02, T + 0.06, -T / 2, opts.frame);
      if (o.kind === 'window') wallBox(b, body, o.side, o.u, o.y0 + o.h / 2 - fw / 2, o.w, fw * 0.8, T * 0.5, -T / 2, opts.frame);
      if (opts.shutter && o.kind === 'window') {
        wallBox(b, body, o.side, o.u - o.w / 2 - fw - 0.05, o.y0, 0.08, o.h, 0.015, 0.008, opts.shutter);
        wallBox(b, body, o.side, o.u + o.w / 2 + fw + 0.05, o.y0, 0.08, o.h, 0.015, 0.008, opts.shutter);
      }
    }
  }
}

// ------------------------------------------------------------------ mái

/** Mái hai dốc lắp từng phần: vì kèo (0) → dốc trái (0.35) → dốc phải (0.65) → diềm + nóc (0.85). */
function gableRoof(b: Builder, body: Body, top: number, rise: number, color: string, opts: { stage?: number; fascia?: string; overhang?: number; alongZ?: boolean } = {}) {
  const stage = opts.stage ?? 6;
  const oh = opts.overhang ?? 0.09;
  // Mặc định sống mái chạy theo trục z (dốc hai bên trái/phải).
  const span = body.w / 2 + oh;
  const len = body.d + 2 * oh;
  const slope = Math.hypot(span, rise);
  const ang = Math.atan2(rise, span);
  b.at(stage, 0);
  const trusses = Math.max(2, Math.round(body.d / 0.4));
  for (let i = 0; i <= trusses; i++) {
    const z = body.cz - body.d / 2 + (i * body.d) / trusses;
    b.add({ shape: 'gable', p: [body.cx, top, z], s: [body.w, rise, 0.035], c: P.wood.dark });
  }
  b.at(stage, 0.35).box(body.cx - span / 2, top + rise / 2 - 0.03, body.cz, slope + 0.02, 0.05, len, color, { rz: ang });
  b.at(stage, 0.65).box(body.cx + span / 2, top + rise / 2 - 0.03, body.cz, slope + 0.02, 0.05, len, color, { rz: -ang });
  b.at(stage, 0.85);
  b.box(body.cx, top + rise - 0.02, body.cz, 0.08, 0.06, len + 0.02, color);
  if (opts.fascia) {
    b.box(body.cx - span, top - 0.05, body.cz, 0.03, 0.06, len, opts.fascia);
    b.box(body.cx + span, top - 0.05, body.cz, 0.03, 0.06, len, opts.fascia);
  }
  // Hồi tường tam giác hai đầu (bịt dưới mái).
  b.at(stage, 0.2);
  b.add({ shape: 'gable', p: [body.cx, top, body.cz + body.d / 2 - T / 2], s: [body.w, rise, T], c: P.wood.plank });
  b.add({ shape: 'gable', p: [body.cx, top, body.cz - body.d / 2 + T / 2], s: [body.w, rise, T], c: P.wood.plank });
}

/** Mái bốn dốc lắp theo lớp: vì kèo → sàn mái → ngói → bờ nóc. */
function hipRoof(b: Builder, body: Body, top: number, rise: number, color: string, stage = 6) {
  const oh = 0.08;
  b.at(stage, 0);
  const n = Math.max(2, Math.round(body.w / 0.4));
  for (let i = 0; i <= n; i++) b.add({ shape: 'gable', p: [body.cx - body.w / 2 + (i * body.w) / n, top, body.cz], s: [body.d, rise * 0.9, 0.035], c: P.wood.dark, ry: Math.PI / 2 });
  b.at(stage, 0.35).add({ shape: 'hip', p: [body.cx, top, body.cz], s: [body.w + oh, rise * 0.92, body.d + oh], c: P.wood.mid });
  b.at(stage, 0.7).add({ shape: 'hip', p: [body.cx, top + 0.01, body.cz], s: [body.w + 2 * oh, rise, body.d + 2 * oh], c: color });
  b.at(stage, 0.9).box(body.cx, top + rise - 0.02, body.cz, Math.max(0.05, body.w - body.d), 0.05, 0.06, color);
}

/** Mái bằng: sàn mái + tường chắn mái (+ tuỳ chọn khối kỹ thuật). */
function flatRoof(b: Builder, body: Body, top: number, color: string, stage = 6) {
  b.at(stage, 0).box(body.cx, top, body.cz, body.w + 0.04, 0.05, body.d + 0.04, P.concrete.dark);
  b.at(stage, 0.5);
  const t = 0.04;
  b.box(body.cx, top + 0.05, body.cz + body.d / 2, body.w + 0.04, 0.1, t, color);
  b.box(body.cx, top + 0.05, body.cz - body.d / 2, body.w + 0.04, 0.1, t, color);
  b.box(body.cx - body.w / 2, top + 0.05, body.cz, t, 0.1, body.d, color);
  b.box(body.cx + body.w / 2, top + 0.05, body.cz, t, 0.1, body.d, color);
}

// ------------------------------------------------------------------ khung

function frame(b: Builder, body: Body, height: number, floors: number, color: string, bays = 2, order0 = 0) {
  b.at(4, order0);
  const posts: number[] = [];
  for (let i = 0; i <= bays; i++) posts.push(-body.w / 2 + (i * body.w) / bays);
  const depthPosts = [-body.d / 2, body.d / 2];
  for (const px of posts) for (const pz of depthPosts) b.box(body.cx + px, body.y0, body.cz + pz, 0.06, height, 0.06, color);
  b.box(body.cx - body.w / 2, body.y0, body.cz, 0.06, height, 0.06, color);
  b.box(body.cx + body.w / 2, body.y0, body.cz, 0.06, height, 0.06, color);
  for (let f = 1; f <= floors; f++) {
    const y = body.y0 + (f * height) / floors - 0.05;
    b.at(4, order0 + (0.5 * f) / floors);
    b.box(body.cx, y, body.cz + body.d / 2, body.w + 0.06, 0.05, 0.06, color);
    b.box(body.cx, y, body.cz - body.d / 2, body.w + 0.06, 0.05, 0.06, color);
    b.box(body.cx - body.w / 2, y, body.cz, 0.06, 0.05, body.d, color);
    b.box(body.cx + body.w / 2, y, body.cz, 0.06, 0.05, body.d, color);
    if (f < floors) b.box(body.cx, y, body.cz, body.w, 0.04, body.d, P.concrete.mid);
  }
  b.spot(4, body.cx - body.w / 2 - 0.12, 0, body.cz + body.d / 2 + 0.12).spot(4, body.cx + body.w / 2 + 0.12, 0, body.cz);
  b.spot(5, body.cx, 0, body.cz + body.d / 2 + 0.14).spot(5, body.cx + body.w / 2 + 0.14, 0, body.cz - 0.2);
  b.spot(6, body.cx - body.w / 2 - 0.12, height, body.cz + body.d / 2 + 0.12).spot(6, body.cx + body.w / 2 + 0.12, height, body.cz);
  b.spot(7, body.cx + 0.25, 0, body.cz + body.d / 2 + 0.15).spot(7, body.cx - body.w / 2 - 0.15, 0, body.cz);
}

// ------------------------------------------------------------------ các họ công trình

function houseWood(b: Builder, item: CatalogBuilding, r: () => number) {
  const body: Body = { cx: 0, cz: -0.12, w: 1.3, d: 1.05, y0: 0.1 };
  siteWorks(b, item, body, r);
  const h = 0.62;
  const roof = pick([P.roof.red, P.roof.blue, P.roof.green, P.roof.terracotta], r);
  const shutter = pick(['#3C9C97', '#4F79B7', '#5E9E4E', '#C8653E'], r);
  frame(b, body, h, 1, P.wood.dark, 2);
  // Hiên trước: cột hiên dựng cùng khung.
  b.at(4, 0.6);
  b.box(-0.35, body.y0, body.cz + body.d / 2 + 0.24, 0.05, h - 0.08, 0.05, P.wood.dark);
  b.box(0.35, body.y0, body.cz + body.d / 2 + 0.24, 0.05, h - 0.08, 0.05, P.wood.dark);
  b.box(0, body.y0, body.cz + body.d / 2 + 0.13, 0.86, 0.03, 0.28, P.wood.mid);
  scaffold(b, body, h + 0.05);
  const openings: Opening[] = [
    { side: 'front', u: 0, w: 0.24, y0: body.y0, h: 0.42, kind: 'door' },
    { side: 'front', u: -0.42, w: 0.22, y0: body.y0 + 0.22, h: 0.22, kind: 'window' },
    { side: 'front', u: 0.42, w: 0.22, y0: body.y0 + 0.22, h: 0.22, kind: 'window' },
    { side: 'left', u: 0, w: 0.22, y0: body.y0 + 0.22, h: 0.22, kind: 'window' },
    { side: 'right', u: 0.15, w: 0.22, y0: body.y0 + 0.22, h: 0.22, kind: 'window' },
    { side: 'back', u: 0.3, w: 0.22, y0: body.y0 + 0.22, h: 0.22, kind: 'window' },
  ];
  walls(b, body, h, 6, openings, (row) => (row % 2 ? P.wood.plank : P.wood.light));
  gableRoof(b, body, body.y0 + h, 0.42, roof, { fascia: P.wood.trim });
  b.at(6, 0.9).box(0.4, body.y0 + h + 0.1, body.cz - 0.1, 0.13, 0.4, 0.13, P.stone.dark);
  // Mái hiên + hoàn thiện.
  b.at(7, 0).box(0, body.y0 + h - 0.06, body.cz + body.d / 2 + 0.16, 0.95, 0.04, 0.36, roof, { rx: 0.18 });
  fixtures(b, body, openings, { frame: P.wood.trim, glass: P.glass.blue, door: P.wood.dark, shutter });
  b.at(7, 0.5);
  streetLamp(b, 0.28, body.cz + body.d / 2 + 0.06, body.y0 + 0.28, 0.12);
  b.anchor('door', 0.25, 0.1, body.cz + body.d / 2 + 0.3).anchor('side', body.w / 2 + 0.25, 0, body.cz);
  landscape(b, item, body, r, { fence: true });
  return { body, height: body.y0 + h + 0.42 };
}

function houseBrick(b: Builder, item: CatalogBuilding, r: () => number) {
  const body: Body = { cx: 0, cz: -0.1, w: 1.36, d: 1.1, y0: 0.1 };
  siteWorks(b, item, body, r);
  const fh = 0.5;
  const h = fh * 2;
  const roof = pick([P.roof.terracotta, P.roof.red, P.roof.slate], r);
  frame(b, body, h, 2, P.concrete.mid, 2);
  scaffold(b, body, h + 0.05);
  const openings: Opening[] = [
    { side: 'front', u: -0.3, w: 0.26, y0: body.y0, h: 0.4, kind: 'door' },
    { side: 'front', u: 0.3, w: 0.28, y0: body.y0 + 0.16, h: 0.24, kind: 'window' },
    { side: 'front', u: -0.3, w: 0.26, y0: body.y0 + fh + 0.12, h: 0.28, kind: 'window' },
    { side: 'front', u: 0.3, w: 0.26, y0: body.y0 + fh + 0.12, h: 0.28, kind: 'window' },
    { side: 'left', u: 0, w: 0.24, y0: body.y0 + 0.16, h: 0.24, kind: 'window' },
    { side: 'left', u: 0, w: 0.24, y0: body.y0 + fh + 0.14, h: 0.24, kind: 'window' },
    { side: 'right', u: -0.15, w: 0.24, y0: body.y0 + 0.16, h: 0.24, kind: 'window' },
    { side: 'right', u: -0.15, w: 0.24, y0: body.y0 + fh + 0.14, h: 0.24, kind: 'window' },
    { side: 'back', u: 0.2, w: 0.24, y0: body.y0 + fh + 0.14, h: 0.24, kind: 'window' },
  ];
  walls(b, body, h, 10, openings, (row) => (row % 2 ? P.brick.red : P.brick.warm));
  // Gờ tầng (gạch cách điệu: dải vữa sáng giữa hai tầng).
  b.at(5, 0.5).box(0, body.y0 + fh - 0.02, body.cz, body.w + 0.04, 0.04, body.d + 0.04, P.brick.mortar);
  hipRoof(b, body, body.y0 + h, 0.44, roof);
  b.at(6, 0.95).box(-0.4, body.y0 + h + 0.12, body.cz - 0.2, 0.14, 0.45, 0.14, P.brick.dark);
  fixtures(b, body, openings, { frame: '#FFFFFF', glass: P.glass.blue, door: P.roof.teal });
  // Ban công tầng 2 có lan can + mái che cửa.
  b.at(7, 0.4);
  b.box(0.3, body.y0 + fh + 0.08, body.cz + body.d / 2 + 0.1, 0.4, 0.035, 0.2, P.concrete.light);
  b.box(0.3, body.y0 + fh + 0.11, body.cz + body.d / 2 + 0.19, 0.4, 0.14, 0.015, P.steel.dark);
  b.box(-0.3, body.y0 + 0.42, body.cz + body.d / 2 + 0.08, 0.36, 0.03, 0.16, roof);
  b.at(7, 0.7);
  for (const u of [0.3]) b.box(u, body.y0 + 0.13, body.cz + body.d / 2 + 0.04, 0.26, 0.05, 0.06, '#8B5E3C');
  flowers(b, 0.3, body.cz + body.d / 2 + 0.04, r, body.y0 + 0.17, 3);
  streetLamp(b, -0.08, body.cz + body.d / 2 + 0.05, body.y0 + 0.3, 0.12);
  b.anchor('door', -0.55, 0.1, body.cz + body.d / 2 + 0.25).anchor('side', body.w / 2 + 0.2, 0, body.cz + 0.3);
  landscape(b, item, body, r, { fence: true });
  return { body, height: body.y0 + h + 0.44 };
}

function townhouse(b: Builder, item: CatalogBuilding, r: () => number, seed: number) {
  const floors = 3 + (Math.abs(seed) % 3);
  const body: Body = { cx: 0, cz: -0.08, w: 1.4, d: 1.2, y0: 0.1 };
  siteWorks(b, item, body, r);
  const gh = 0.56; // tầng trệt cao hơn
  const fh = 0.46;
  const h = gh + fh * (floors - 1);
  const wall = pick(P.wall, r);
  const trim = '#FFFFFF';
  frame(b, body, h, floors, P.concrete.mid, 3);
  // Mép sàn mỗi tầng (thấy rõ độ dày).
  for (let f = 1; f < floors; f++) b.at(4, 0.6 + (0.3 * f) / floors).box(0, body.y0 + gh + (f - 1) * fh - 0.03, body.cz, body.w + 0.08, 0.06, body.d + 0.08, P.concrete.light);
  scaffold(b, body, h + 0.05);
  const openings: Opening[] = [
    { side: 'front', u: -0.18, w: 0.72, y0: body.y0 + 0.05, h: 0.4, kind: 'shop' },
    { side: 'front', u: 0.5, w: 0.22, y0: body.y0, h: 0.42, kind: 'door' },
  ];
  for (let f = 1; f < floors; f++) {
    const y = body.y0 + gh + (f - 1) * fh + 0.08;
    for (const u of [-0.42, 0, 0.42]) openings.push({ side: 'front', u, w: 0.22, y0: y, h: 0.3, kind: 'window' });
    openings.push({ side: 'left', u: 0, w: 0.22, y0: y, h: 0.28, kind: 'window' });
    openings.push({ side: 'right', u: 0, w: 0.22, y0: y, h: 0.28, kind: 'window' });
    openings.push({ side: 'back', u: -0.3, w: 0.22, y0: y, h: 0.28, kind: 'window' });
    openings.push({ side: 'back', u: 0.3, w: 0.22, y0: y, h: 0.28, kind: 'window' });
  }
  walls(b, body, h, floors * 4, openings, (row) => (row % 2 ? P.concrete.light : P.concrete.mid), { paint: wall });
  // Tầng trệt khác tầng trên: ốp đá + mái hiên + biển cửa hàng.
  b.at(5, 0.2).box(0, body.y0, body.cz + body.d / 2 + 0.005, body.w, 0.08, 0.02, P.stone.dark);
  b.at(6, 0).box(0, body.y0 + h, body.cz, body.w + 0.1, 0.06, body.d + 0.1, trim);
  flatRoof(b, { ...body, y0: 0 }, body.y0 + h + 0.06, wall);
  b.at(6, 0.8);
  b.box(-0.35, body.y0 + h + 0.11, body.cz - 0.2, 0.3, 0.14, 0.24, P.steel.light);
  treeRound(b, 0.35, body.cz + 0.1, 0.45, r, body.y0 + h + 0.11);
  fixtures(b, body, openings, { frame: trim, glass: P.glass.blue, door: P.wood.dark });
  b.at(7, 0.4);
  const awning = pick(P.accent.awning, r);
  b.box(-0.18, body.y0 + 0.5, body.cz + body.d / 2 + 0.12, 0.8, 0.03, 0.26, awning, { rx: 0.22 });
  b.box(-0.18, body.y0 + gh - 0.02, body.cz + body.d / 2 + 0.03, 0.7, 0.1, 0.03, P.accent.sign);
  // Ban công Pháp ở các tầng trên.
  for (let f = 1; f < floors; f++) {
    const y = body.y0 + gh + (f - 1) * fh + 0.08;
    b.at(7, 0.5 + (0.4 * f) / floors);
    for (const u of [-0.42, 0.42]) {
      b.box(u, y - 0.02, body.cz + body.d / 2 + 0.06, 0.3, 0.025, 0.1, trim);
      b.box(u, y, body.cz + body.d / 2 + 0.105, 0.3, 0.12, 0.012, P.steel.dark);
    }
  }
  b.anchor('door', 0.5, 0.1, body.cz + body.d / 2 + 0.25).anchor('side', -0.55, 0.1, body.cz + body.d / 2 + 0.3);
  landscape(b, item, body, r);
  return { body, height: body.y0 + h + 0.3 };
}

type CivicOpts = {
  w: number;
  d: number;
  floors: number;
  fh: number;
  material: 'brick' | 'plaster' | 'wood' | 'stone';
  roof: 'gable' | 'hip' | 'flat';
  roofColor: string;
  wall?: string;
  columns?: number;
  tower?: 'clock' | 'bell' | 'spire' | 'dome';
  sign: string;
  cross?: boolean;
  flag?: boolean;
  door?: string;
};

/** Công trình công cộng / kỹ năng: khối chính + các chi tiết nhận diện (hàng cột, tháp chuông, dấu chữ thập…). */
function civic(b: Builder, item: CatalogBuilding, r: () => number, o: CivicOpts) {
  const body: Body = { cx: 0, cz: -(item.size[1] - o.d) / 2 + 0.08, w: o.w, d: o.d, y0: 0.12 };
  siteWorks(b, item, body, r);
  const h = o.fh * o.floors;
  frame(b, body, h, o.floors, o.material === 'wood' ? P.wood.dark : P.concrete.mid, Math.max(2, Math.round(o.w / 0.5)));
  scaffold(b, body, h + 0.05);
  const openings: Opening[] = [{ side: 'front', u: 0, w: 0.3, y0: body.y0, h: Math.min(0.46, o.fh - 0.06), kind: 'door' }];
  const nx = Math.max(2, Math.round(o.w / 0.36));
  for (let f = 0; f < o.floors; f++) {
    const y = body.y0 + f * o.fh + 0.14;
    for (let i = 0; i < nx; i++) {
      const u = -o.w / 2 + ((i + 0.5) * o.w) / nx;
      if (f === 0 && Math.abs(u) < 0.25) continue;
      openings.push({ side: 'front', u, w: 0.2, y0: y, h: o.fh * 0.5, kind: 'window' });
      if (i % 2 === 0) openings.push({ side: 'back', u, w: 0.2, y0: y, h: o.fh * 0.5, kind: 'window' });
    }
    const nz = Math.max(1, Math.round(o.d / 0.45));
    for (let j = 0; j < nz; j++) {
      const u = -o.d / 2 + ((j + 0.5) * o.d) / nz;
      openings.push({ side: 'left', u, w: 0.2, y0: y, h: o.fh * 0.5, kind: 'window' });
      openings.push({ side: 'right', u, w: 0.2, y0: y, h: o.fh * 0.5, kind: 'window' });
    }
  }
  const rows = o.floors * 4;
  const col = (row: number) =>
    o.material === 'brick' ? (row % 2 ? P.brick.red : P.brick.warm) : o.material === 'wood' ? (row % 2 ? P.wood.plank : P.wood.light) : o.material === 'stone' ? (row % 2 ? P.stone.light : P.stone.mid) : row % 2 ? P.concrete.light : P.concrete.mid;
  walls(b, body, h, rows, openings, col, { paint: o.material === 'plaster' ? (o.wall ?? pick(P.wall, r)) : undefined });
  const top = body.y0 + h;
  if (o.roof === 'gable') gableRoof(b, body, top, Math.min(0.55, o.w * 0.28), o.roofColor, { fascia: '#FFFFFF' });
  else if (o.roof === 'hip') hipRoof(b, body, top, Math.min(0.5, o.d * 0.4), o.roofColor);
  else flatRoof(b, body, top, o.wall ?? P.concrete.light);
  // Tháp nhận diện.
  if (o.tower) {
    b.at(6, 0.9);
    const tx = 0;
    const tz = body.cz;
    const tb = top + (o.roof === 'flat' ? 0.1 : 0.2);
    if (o.tower === 'dome') {
      b.cyl(tx, tb, tz, 0.26, 0.18, P.stone.light, { seg: 14 });
      b.sphere(tx, tb + 0.18, tz, 0.26, P.roof.teal);
    } else {
      b.box(tx, tb, tz, 0.32, 0.4, 0.32, o.material === 'brick' ? P.brick.red : P.concrete.light);
      if (o.tower === 'clock') b.cyl(tx, tb + 0.22, tz + 0.165, 0.09, 0.01, '#FFFFFF', { rx: Math.PI / 2, seg: 14 });
      if (o.tower === 'bell') b.sphere(tx, tb + 0.2, tz, 0.07, P.accent.gold);
      b.add({ shape: 'pyr', p: [tx, tb + 0.4, tz], s: [0.38, o.tower === 'spire' ? 0.5 : 0.24, 0.38], c: o.roofColor });
    }
  }
  fixtures(b, body, openings, { frame: '#FFFFFF', glass: P.glass.blue, door: o.door ?? P.wood.dark });
  b.at(7, 0.3);
  // Hàng cột + mái sảnh.
  if (o.columns) {
    const pw = Math.min(o.w - 0.1, 0.24 * o.columns);
    for (let i = 0; i < o.columns; i++) b.cyl(-pw / 2 + (i * pw) / (o.columns - 1), body.y0, body.cz + body.d / 2 + 0.2, 0.035, o.fh - 0.02, '#F3EEE3', { seg: 8 });
    b.box(0, body.y0 + o.fh - 0.02, body.cz + body.d / 2 + 0.14, pw + 0.16, 0.06, 0.34, '#F3EEE3');
    b.add({ shape: 'gable', p: [0, body.y0 + o.fh + 0.04, body.cz + body.d / 2 + 0.14], s: [pw + 0.16, 0.16, 0.34], c: '#F3EEE3' });
  } else {
    b.box(0, body.y0 + 0.5, body.cz + body.d / 2 + 0.1, 0.46, 0.03, 0.22, o.roofColor);
  }
  // Biển tên + dấu nhận diện.
  b.at(7, 0.6);
  b.box(0, body.y0 + (o.columns ? o.fh + 0.02 : 0.56), body.cz + body.d / 2 + 0.02, Math.min(0.9, o.w * 0.6), 0.12, 0.03, o.sign);
  b.box(0, body.y0 + (o.columns ? o.fh + 0.05 : 0.59), body.cz + body.d / 2 + 0.037, Math.min(0.7, o.w * 0.45), 0.05, 0.005, P.accent.signText);
  if (o.cross) {
    b.box(o.w / 2 - 0.2, top - 0.3, body.cz + body.d / 2 + 0.02, 0.2, 0.06, 0.02, '#E0533D');
    b.box(o.w / 2 - 0.2, top - 0.37, body.cz + body.d / 2 + 0.02, 0.06, 0.2, 0.02, '#E0533D');
  }
  if (o.flag) {
    b.cyl(o.w / 2 + 0.12, 0, body.cz + body.d / 2 + 0.2, 0.012, 0.9, P.steel.light, { seg: 5 });
    b.box(o.w / 2 + 0.2, 0.74, body.cz + body.d / 2 + 0.2, 0.16, 0.1, 0.008, P.accent.flag);
  }
  streetLamp(b, -o.w / 2 + 0.05, body.cz + body.d / 2 + 0.28, 0, 0.55);
  b.anchor('door', 0.35, 0.12, body.cz + body.d / 2 + 0.3).anchor('side', o.w / 2 + 0.2, 0, body.cz);
  landscape(b, item, body, r);
  if (has(item, 8)) {
    b.at(8, 0.7);
    bench(b, -o.w / 2 + 0.3, item.size[1] / 2 - 0.2, 0);
  }
  return { body, height: top + 0.6 };
}

// ------------------------------------------------------------------ công trình đặc biệt

function tent(b: Builder, item: CatalogBuilding, r: () => number) {
  const body: Body = { cx: 0, cz: 0, w: 0.62, d: 0.7, y0: 0 };
  siteWorks(b, item, body, r);
  b.at(4, 0);
  b.box(0, 0, -0.3, 0.035, 0.46, 0.035, P.wood.dark);
  b.box(0, 0, 0.3, 0.035, 0.46, 0.035, P.wood.dark);
  b.at(4, 0.5).box(0, 0.43, 0, 0.03, 0.03, 0.66, P.wood.dark);
  b.at(6, 0).add({ shape: 'gable', p: [0, 0, 0], s: [0.64, 0.45, 0.66], c: pick(['#E9D8B4', '#D9C39A', '#9CC3A0', '#E7B08A'], r) });
  b.at(6, 0.5).add({ shape: 'gable', p: [0, 0, 0.335], s: [0.3, 0.3, 0.01], c: '#6B4F3A' });
  // Dây buộc xuống cọc — nhìn rõ.
  b.at(8, 0);
  for (const [x, z] of [
    [-0.45, -0.3],
    [0.45, -0.3],
    [-0.45, 0.3],
    [0.45, 0.3],
  ] as const) {
    b.box(x, 0, z, 0.025, 0.08, 0.025, P.wood.dark);
    b.box(x * 0.72, 0.13, z, 0.2, 0.01, 0.01, P.construction.rope, { rz: Math.sign(x) * 0.8 });
  }
  b.box(0.25, 0, 0.42, 0.18, 0.04, 0.08, '#A7784C');
  b.anchor('door', 0.25, 0, 0.42);
  return { body, height: 0.46 };
}

function campfire(b: Builder, item: CatalogBuilding, r: () => number) {
  const body: Body = { cx: 0, cz: 0, w: 0.5, d: 0.5, y0: 0 };
  siteWorks(b, item, body, r);
  b.at(5, 0);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    b.sphere(Math.cos(a) * 0.17, 0.02, Math.sin(a) * 0.17, 0.045, i % 2 ? P.stone.mid : P.stone.dark);
  }
  b.at(5, 0.5);
  for (let i = 0; i < 3; i++) b.box(0, 0.03, 0, 0.26, 0.035, 0.035, P.wood.dark, { ry: (i * Math.PI) / 3 });
  b.at(8, 0);
  b.cyl(0, 0.05, 0, 0.07, 0.16, '#F2A33A', { taper: 0, glow: true });
  b.cyl(0, 0.05, 0, 0.04, 0.22, '#F7D14C', { taper: 0, glow: true });
  for (const a of [0.4, 2.4, 4.2]) b.cyl(Math.cos(a) * 0.36, 0, Math.sin(a) * 0.36, 0.06, 0.08, P.wood.mid, { seg: 8, rx: Math.PI / 2, ry: a });
  return { body, height: 0.3 };
}

function well(b: Builder, item: CatalogBuilding, r: () => number) {
  const body: Body = { cx: 0, cz: 0, w: 0.5, d: 0.5, y0: 0 };
  siteWorks(b, item, body, r);
  for (let row = 0; row < 4; row++) {
    b.at(5, row / 4);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + (row % 2) * 0.3;
      b.box(Math.cos(a) * 0.19, 0.02 + row * 0.06, Math.sin(a) * 0.19, 0.12, 0.058, 0.07, row % 2 ? P.stone.light : P.stone.mid, { ry: -a });
    }
  }
  b.at(8, 0);
  b.cyl(0, 0.02, 0, 0.14, 0.02, P.terrain.waterDeep, { seg: 12 });
  b.box(-0.22, 0.02, 0, 0.04, 0.5, 0.04, P.wood.dark);
  b.box(0.22, 0.02, 0, 0.04, 0.5, 0.04, P.wood.dark);
  b.cyl(0, 0.42, 0, 0.03, 0.44, P.wood.mid, { rz: Math.PI / 2, seg: 6 });
  b.add({ shape: 'gable', p: [0, 0.52, 0], s: [0.56, 0.18, 0.34], c: P.roof.red });
  b.cyl(0.05, 0.2, 0, 0.04, 0.07, P.wood.mid, { seg: 8 });
  return { body, height: 0.7 };
}

function depot(b: Builder, item: CatalogBuilding, r: () => number) {
  const body: Body = { cx: -0.35, cz: -0.35, w: 0.9, d: 0.7, y0: 0.05 };
  siteWorks(b, item, body, r);
  b.at(4, 0);
  for (const [x, z] of [
    [-0.8, -0.7],
    [0.1, -0.7],
    [-0.8, 0],
    [0.1, 0],
  ] as const)
    b.box(x, 0.05, z, 0.05, 0.5, 0.05, P.wood.dark);
  b.at(4, 0.5).box(-0.35, 0.53, -0.35, 1.0, 0.04, 0.8, P.wood.mid);
  b.at(8, 0);
  b.add({ shape: 'gable', p: [-0.35, 0.55, -0.35], s: [1.05, 0.25, 0.85], c: P.construction.tarp, ry: Math.PI / 2 });
  fenceRun(b, -0.95, 0.95, 0.95, 0.95);
  fenceRun(b, 0.95, -0.95, 0.95, 0.95);
  b.box(0.55, 0, 0.4, 0.5, 0.02, 0.6, P.terrain.dirt);
  b.anchor('yard', 0.55, 0.02, 0.35).anchor('side', -0.2, 0.05, 0.25);
  return { body, height: 0.8 };
}

function warehouse(b: Builder, item: CatalogBuilding, r: () => number) {
  return civic(b, item, r, { w: 1.5, d: 2.3, floors: 1, fh: 0.8, material: 'wood', roof: 'gable', roofColor: P.roof.red, sign: P.wood.dark, door: P.roof.red });
}

function dock(b: Builder, item: CatalogBuilding, r: () => number) {
  const body: Body = { cx: 0, cz: -0.1, w: 1.5, d: 1.6, y0: 0 };
  siteWorks(b, item, { ...body, y0: 0.05 }, r);
  // 2 — đóng cọc, 3 — dầm đỡ, 4 — sàn ván, 7 — lan can + cột neo, 8 — thuyền + thùng.
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      b.at(2, (i * 3 + j) / 12).cyl(-0.6 + i * 0.4, -0.35, -0.8 + j * 0.6, 0.04, 0.5, P.wood.dark, { seg: 6 });
    }
  }
  b.at(3, 0);
  for (let j = 0; j < 3; j++) b.box(0, 0.05, -0.8 + j * 0.6, 1.4, 0.05, 0.06, P.wood.dark);
  const planks = 10;
  for (let k = 0; k < planks; k++) b.at(4, k / planks).box(-0.7 + (k + 0.5) * 0.14, 0.1, -0.2, 0.13, 0.035, 1.4, k % 2 ? P.wood.light : P.wood.plank);
  b.at(7, 0);
  for (const x of [-0.72, 0.72]) b.box(x, 0.13, -0.2, 0.03, 0.14, 1.4, P.wood.dark);
  for (const z of [-0.8, 0.3]) b.cyl(0.62, 0.13, z, 0.04, 0.1, P.steel.dark, { seg: 8 });
  streetLamp(b, -0.62, -0.8, 0.13, 0.5);
  b.at(8, 0);
  b.box(1.02, -0.05, -0.3, 0.3, 0.12, 0.8, '#FFFFFF');
  b.box(1.02, 0.07, -0.3, 0.26, 0.04, 0.7, P.roof.red);
  b.box(1.02, 0.11, -0.5, 0.02, 0.4, 0.02, P.wood.dark);
  materialStack(b, 'wood', -0.4, 0.25, 2, 0.14);
  b.anchor('dock', 0.3, 0.14, 0.3).anchor('side', -0.4, 0.14, -0.6);
  return { body, height: 0.6 };
}

function fence(b: Builder, item: CatalogBuilding, r: () => number) {
  const body: Body = { cx: 0, cz: 0, w: 0.9, d: 0.2, y0: 0 };
  siteWorks(b, item, body, r);
  b.at(4, 0);
  for (let i = 0; i < 5; i++) b.box(-0.45 + i * 0.225, 0, 0, 0.04, 0.22, 0.04, P.wood.light);
  b.at(8, 0);
  b.box(0, 0.08, 0, 0.94, 0.025, 0.02, P.wood.light);
  b.box(0, 0.17, 0, 0.94, 0.025, 0.02, P.wood.light);
  return { body, height: 0.22 };
}

function lamp(b: Builder, item: CatalogBuilding, r: () => number) {
  const body: Body = { cx: 0, cz: 0, w: 0.3, d: 0.3, y0: 0 };
  siteWorks(b, item, body, r);
  b.at(5, 0).cyl(0, 0, 0, 0.1, 0.05, P.stone.mid, { seg: 8 });
  b.at(8, 0);
  streetLamp(b, 0, 0, 0.05, 0.75);
  return { body, height: 0.8 };
}

function park(b: Builder, item: CatalogBuilding, r: () => number) {
  const body: Body = { cx: 0, cz: 0, w: 1.7, d: 1.7, y0: 0 };
  siteWorks(b, item, body, r);
  b.at(2, 0).box(0, 0.015, 0, 0.7, 0.01, 0.7, P.terrain.soilDark);
  b.at(8, 0);
  b.box(0, 0, 0, 1.8, 0.02, 1.8, P.terrain.meadow);
  b.box(0, 0.02, 0, 0.26, 0.01, 1.8, P.stone.paving);
  b.box(0, 0.02, 0, 1.8, 0.01, 0.26, P.stone.paving);
  b.cyl(0.45, 0.02, -0.45, 0.28, 0.03, P.stone.mid, { seg: 16 });
  b.cyl(0.45, 0.04, -0.45, 0.24, 0.02, P.terrain.waterShallow, { seg: 16 });
  b.at(8, 0.4);
  treeRound(b, -0.55, -0.55, 1, r);
  treePine(b, -0.6, 0.5, 0.9, r);
  treeRound(b, 0.6, 0.55, 0.9, r);
  bench(b, -0.3, 0.3, 0);
  flowers(b, 0.35, 0.3, r, 0.02, 6);
  streetLamp(b, 0.2, -0.2, 0.02, 0.6);
  return { body, height: 0.8 };
}

function market(b: Builder, item: CatalogBuilding, r: () => number) {
  const body: Body = { cx: 0, cz: -0.2, w: 2.2, d: 1.8, y0: 0.06 };
  siteWorks(b, item, body, r);
  // Quầy chợ có mái hiên sọc + một mái chợ trung tâm.
  const stalls: [number, number][] = [
    [-0.75, -0.75],
    [0, -0.75],
    [0.75, -0.75],
    [-0.75, 0.35],
    [0.75, 0.35],
  ];
  stalls.forEach(([x, z], i) => {
    b.at(4, i / stalls.length);
    for (const [dx, dz] of [
      [-0.25, -0.2],
      [0.25, -0.2],
      [-0.25, 0.2],
      [0.25, 0.2],
    ] as const)
      b.box(x + dx, 0.06, z + dz, 0.035, 0.45, 0.035, P.wood.dark);
    b.at(5, i / stalls.length).box(x, 0.06, z + 0.12, 0.5, 0.22, 0.1, P.wood.mid);
    b.at(6, i / stalls.length).box(x, 0.5, z, 0.62, 0.05, 0.5, pick(P.accent.awning, r), { rx: -0.12 });
    b.at(7, i / stalls.length);
    for (let k = 0; k < 3; k++) b.sphere(x - 0.14 + k * 0.14, 0.3, z + 0.12, 0.05, pick(['#E0533D', '#F2A33A', '#8DC35B', '#FACC15'], r));
  });
  b.at(6, 0.5).add({ shape: 'hip', p: [0, 0.62, -0.2], s: [0.9, 0.35, 0.7], c: P.roof.terracotta });
  b.at(4, 0.6);
  for (const [x, z] of [
    [-0.4, -0.5],
    [0.4, -0.5],
    [-0.4, 0.1],
    [0.4, 0.1],
  ] as const)
    b.cyl(x, 0.06, z, 0.04, 0.56, P.stone.light, { seg: 8 });
  b.at(8, 0).box(0, 0, 0.8, 2.6, 0.015, 0.5, P.stone.paving);
  b.anchor('yard', -0.2, 0.06, 0.6).anchor('side', 1.1, 0.06, -0.2);
  landscape(b, item, body, r);
  return { body, height: 1.0 };
}

function fountainPlaza(b: Builder, item: CatalogBuilding, r: () => number) {
  const body: Body = { cx: 0, cz: 0, w: 2.6, d: 2.6, y0: 0.04 };
  siteWorks(b, item, body, r);
  b.at(5, 0);
  for (let i = 0; i < 9; i++) b.at(5, i / 9).box(-0.87 + (i % 3) * 0.87, 0.04, -0.87 + Math.floor(i / 3) * 0.87, 0.84, 0.02, 0.84, i % 2 ? P.stone.paving : P.stone.light);
  b.at(7, 0);
  b.cyl(0, 0.06, 0, 0.62, 0.14, P.stone.mid, { seg: 20 });
  b.cyl(0, 0.2, 0, 0.56, 0.02, P.terrain.waterShallow, { seg: 20 });
  b.cyl(0, 0.2, 0, 0.1, 0.4, P.stone.light, { seg: 10 });
  b.cyl(0, 0.6, 0, 0.28, 0.06, P.stone.mid, { seg: 16 });
  b.cyl(0, 0.66, 0, 0.05, 0.22, '#CFEFFA', { taper: 0, seg: 8 });
  b.at(8, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    treeRound(b, Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0.9, r, 0.06);
    bench(b, Math.cos(a + 0.6) * 0.95, Math.sin(a + 0.6) * 0.95, -a, 0.06);
    streetLamp(b, Math.cos(a - 0.6) * 1.1, Math.sin(a - 0.6) * 1.1, 0.06, 0.6);
  }
  return { body, height: 0.9 };
}

function lighthouse(b: Builder, item: CatalogBuilding, r: () => number) {
  const body: Body = { cx: -0.2, cz: -0.2, w: 0.9, d: 0.9, y0: 0.08 };
  siteWorks(b, item, body, r);
  const bands = 8;
  const bh = 0.24;
  b.at(4, 0);
  for (let i = 0; i < 4; i++) b.box(-0.2 + (i % 2 ? 0.28 : -0.28), 0.08, -0.2 + (i < 2 ? 0.28 : -0.28), 0.04, bands * bh, 0.04, P.construction.scaffoldPole, { until: 8 });
  for (let i = 0; i < bands; i++) {
    const rb = 0.36 - i * 0.02;
    b.at(5, i / bands).cyl(-0.2, 0.08 + i * bh, -0.2, rb, bh, P.concrete.light, { taper: (rb - 0.02) / rb, seg: 14, paint: i % 2 ? '#E0533D' : '#FFFFFF' });
  }
  const top = 0.08 + bands * bh;
  b.at(6, 0).cyl(-0.2, top, -0.2, 0.3, 0.05, P.steel.dark, { seg: 14 });
  b.at(6, 0.5).cyl(-0.2, top + 0.05, -0.2, 0.16, 0.24, P.glass.teal, { seg: 12, glow: true });
  b.at(6, 0.8).cyl(-0.2, top + 0.29, -0.2, 0.2, 0.18, '#E0533D', { taper: 0, seg: 12 });
  b.at(7, 0);
  b.cyl(-0.2, top + 0.05, -0.2, 0.29, 0.1, P.steel.dark, { seg: 16, taper: 1 });
  b.sphere(-0.2, top + 0.17, -0.2, 0.08, '#FFF1B8', { glow: true });
  // Nhà người gác.
  b.at(8, 0).box(0.45, 0.05, 0.4, 0.4, 0.3, 0.35, '#FFFFFF');
  b.add({ shape: 'gable', p: [0.45, 0.35, 0.4], s: [0.44, 0.16, 0.39], c: P.roof.red });
  rock(b, 0.6, -0.55, 1.2, r);
  return { body, height: top + 0.5 };
}

function station(b: Builder, item: CatalogBuilding, r: () => number) {
  const res = civic(b, item, r, { w: 2.2, d: 1.0, floors: 2, fh: 0.5, material: 'brick', roof: 'hip', roofColor: P.roof.slate, tower: 'clock', sign: P.accent.sign });
  // Sân ga có mái che dài + đường ray.
  b.at(4, 0.7);
  for (let i = 0; i < 5; i++) b.box(-1.6 + i * 0.8, 0.06, 1.0, 0.05, 0.55, 0.05, P.steel.navy);
  b.at(6, 0.6).box(0, 0.6, 1.0, 3.6, 0.05, 0.6, P.roof.teal, { rx: 0.08 });
  b.at(5, 0.9).box(0, 0.02, 1.0, 3.7, 0.08, 0.7, P.stone.light);
  b.at(8, 0);
  b.box(0, 0.01, 1.45, 3.9, 0.02, 0.1, '#6B6B6B');
  b.box(0, 0.03, 1.39, 3.9, 0.02, 0.02, P.steel.grey);
  b.box(0, 0.03, 1.51, 3.9, 0.02, 0.02, P.steel.grey);
  return res;
}

function powerStation(b: Builder, item: CatalogBuilding, r: () => number) {
  const body: Body = { cx: -0.6, cz: -0.6, w: 1.2, d: 1.0, y0: 0.08 };
  siteWorks(b, item, body, r);
  frame(b, body, 0.6, 1, P.steel.navy, 2);
  walls(b, body, 0.6, 3, [{ side: 'front', u: 0, w: 0.3, y0: 0.08, h: 0.42, kind: 'door' }], (row) => (row % 2 ? P.concrete.light : P.concrete.mid), { paint: '#E4E1DA' });
  flatRoof(b, body, 0.68, P.steel.light);
  b.at(7, 0);
  // Máy biến áp + cột điện giàn + dây.
  for (let i = 0; i < 3; i++) {
    b.box(0.55, 0.08, -0.9 + i * 0.55, 0.36, 0.34, 0.3, P.steel.grey);
    for (let k = 0; k < 3; k++) b.cyl(0.45 + k * 0.1, 0.42, -0.9 + i * 0.55, 0.018, 0.16, '#C9A227', { seg: 6 });
  }
  b.at(7, 0.5);
  for (const [x, z] of [
    [1.15, 1.1],
    [-1.15, 1.1],
  ] as const) {
    for (const [dx, dz] of [
      [-0.08, -0.08],
      [0.08, -0.08],
      [-0.08, 0.08],
      [0.08, 0.08],
    ] as const)
      b.box(x + dx, 0, z + dz, 0.025, 1.1, 0.025, P.steel.light);
    b.box(x, 1.02, z, 0.5, 0.04, 0.04, P.steel.light);
  }
  b.box(0, 1.02, 1.1, 2.3, 0.01, 0.01, P.crane.cable);
  b.box(0.14, 0, -0.1, 0.4, 0.3, 0.02, P.accent.sign);
  b.at(8, 0);
  fenceRun(b, -1.4, 1.4, 1.4, 1.4, 0, P.steel.light);
  fenceRun(b, 1.4, -1.4, 1.4, 1.4, 0, P.steel.light);
  b.anchor('side', -0.2, 0.08, 0.4);
  return { body, height: 1.1 };
}

// ------------------------------------------------------------------ bảng họ

type Gen = (b: Builder, item: CatalogBuilding, r: () => number, seed: number) => { body: Body; height: number };

const GENS: Partial<Record<string, Gen>> = {
  tent,
  campfire,
  well,
  depot,
  house_wood: houseWood,
  warehouse,
  dock,
  fence,
  house_brick: houseBrick,
  townhouse,
  lamp,
  park,
  market,
  fountain_plaza: fountainPlaza,
  lighthouse,
  station,
  power_station: powerStation,
  school: (b, it, r) => civic(b, it, r, { w: 2.3, d: 1.5, floors: 2, fh: 0.52, material: 'brick', roof: 'hip', roofColor: P.roof.slate, tower: 'bell', sign: '#3AA65D', flag: true }),
  library: (b, it, r) => civic(b, it, r, { w: 2.4, d: 1.1, floors: 2, fh: 0.54, material: 'stone', roof: 'hip', roofColor: P.roof.teal, columns: 4, tower: 'dome', sign: P.accent.sign }),
  post_office: (b, it, r) => civic(b, it, r, { w: 2.3, d: 1.2, floors: 2, fh: 0.5, material: 'plaster', wall: '#F4E1C8', roof: 'hip', roofColor: P.roof.red, tower: 'clock', sign: '#F2B33D', flag: true }),
  hospital: (b, it, r) => civic(b, it, r, { w: 2.4, d: 1.9, floors: 3, fh: 0.48, material: 'plaster', wall: '#F4F6F8', roof: 'flat', roofColor: P.steel.light, sign: '#E0533D', cross: true }),
  academy: (b, it, r) => civic(b, it, r, { w: 2.5, d: 1.8, floors: 3, fh: 0.5, material: 'stone', roof: 'hip', roofColor: P.roof.blue, columns: 6, tower: 'spire', sign: '#8A63D2', flag: true }),
  skill_vocab: (b, it, r) => civic(b, it, r, { w: 1.4, d: 1.1, floors: 1, fh: 0.6, material: 'wood', roof: 'gable', roofColor: P.roof.green, sign: '#3AA65D' }),
  skill_listen: (b, it, r) => civic(b, it, r, { w: 1.4, d: 1.1, floors: 1, fh: 0.6, material: 'wood', roof: 'gable', roofColor: P.roof.blue, tower: 'bell', sign: '#3E7CC4' }),
  skill_reading: (b, it, r) => civic(b, it, r, { w: 1.4, d: 1.1, floors: 2, fh: 0.48, material: 'brick', roof: 'gable', roofColor: P.roof.teal, sign: '#C8653E' }),
};

const cache = new Map<string, ProcBuilding>();

/**
 * Sinh công trình. `era` chọn chất liệu phù hợp kỷ (đang dùng qua catalog);
 * cùng (type, seed) luôn trả cùng một cây bộ phận.
 */
export function generateBuilding(type: string, seed: number, era = 1): ProcBuilding {
  const k = `${type}:${seed}:${era}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const item = catalogItem(type);
  if (!item) throw new Error(`Không có công trình ${type}`);
  if (isTower(item)) {
    const t = generateTower(seed, floorsFor(item, seed), item.gen as TowerVariant, type);
    cache.set(k, t);
    return t;
  }
  const gen = GENS[item.gen];
  if (!gen) throw new Error(`Chưa có bộ sinh cho ${item.gen}`);
  const b = new Builder();
  const r = rng(seed * 7919 + type.length * 131);
  const { height } = gen(b, item, r, seed);
  const out: ProcBuilding = { type, seed, size: item.size, parts: b.parts, anchors: b.anchors, height, workSpots: b.workSpots };
  if (cache.size > 400) cache.clear();
  cache.set(k, out);
  return out;
}
