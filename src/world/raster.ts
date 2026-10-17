import { CHUNK, T, TILE, WALKABLE } from './constants';
import { chunkOfTile, type ChunkId } from './coords';
import { flatten, inPolygon, nearestOnPoly, pointAt, polyLength, type Pt } from './geometry';
import { hash2, vnoise } from './rng';
import type { Area, Blueprint, Bridge, Lot, River, RoadSegment, RoadType } from './types';

const ROAD_DEFAULT: Record<RoadType, { width: number; sidewalk: number; rank: number; lanes: boolean }> = {
  avenue: { width: 6, sidewalk: 2, rank: 5, lanes: true },
  street: { width: 4, sidewalk: 2, rank: 4, lanes: true },
  lane: { width: 3, sidewalk: 1, rank: 3, lanes: false },
  alley: { width: 2, sidewalk: 0, rank: 2, lanes: false },
  path: { width: 2, sidewalk: 0, rank: 1, lanes: false },
};

export type RoadGeom = {
  seg: RoadSegment;
  poly: Pt[];
  width: number;
  sw: number;
  rank: number;
  lanes: boolean;
  length: number;
};

export type WorldObject = {
  id: string;
  kind: 'building' | 'tree' | 'lamp' | 'bench' | 'fountain' | 'bush' | 'stall' | 'bollard';
  /** Giữa-đáy theo điểm ảnh toàn cục. */
  px: number;
  py: number;
  w: number;
  h: number;
  variant: number;
  /** Ô neo (xác định chunk SỞ HỮU: mỗi vật chỉ có một chủ). */
  tx: number;
  ty: number;
  /** Các ô bị chặn (toạ độ ô toàn cục). */
  block: [number, number][];
  sprite?: string;
  lotId?: string;
};

export type BridgeGeom = { bridge: Bridge; tiles: [number, number][]; dir: 0 | 1 };

export const SIZE: Record<string, { w: number; h: number }> = {
  tree: { w: 26, h: 34 },
  lamp: { w: 10, h: 30 },
  bench: { w: 16, h: 12 },
  bush: { w: 24, h: 16 },
  stall: { w: 28, h: 26 },
  bollard: { w: 6, h: 10 },
  fountain: { w: 48, h: 44 },
};

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

/** Thế giới toàn cục: một lưới duy nhất được dựng từ blueprint. Chunk chỉ là cách cắt dữ liệu. */
export class World {
  readonly W: number;
  readonly H: number;
  readonly terrain: Uint8Array;
  readonly rank: Uint8Array;
  readonly bridgeDir: Uint8Array;
  readonly lotIndex: Int16Array;
  readonly blocked: Uint8Array;
  /** Địa hình ngay trước khi đặt lô (để kiểm lô không đè đường/nước). */
  preLot: Uint8Array = new Uint8Array(0);
  /** Lớp vạch kẻ đường theo điểm ảnh toàn cục: 0 trống, 1 vàng, 2 trắng, 3 vạch qua đường. */
  readonly marks: Uint8Array;
  readonly marksW: number;
  readonly roads: RoadGeom[] = [];
  readonly rivers: { river: River; poly: Pt[] }[] = [];
  readonly bridges: BridgeGeom[] = [];
  readonly objects: WorldObject[] = [];
  readonly doormats: Map<string, { lot: Lot; tx: number; ty: number; doorX: number; doorY: number }> = new Map();
  readonly nodeById: Map<string, { x: number; y: number; deg: number }> = new Map();
  private objAt = new Set<string>();

  constructor(readonly bp: Blueprint) {
    this.W = bp.widthTiles ?? bp.chunksX * CHUNK;
    this.H = bp.heightTiles ?? bp.chunksY * CHUNK;
    const n = this.W * this.H;
    this.terrain = new Uint8Array(n).fill(T.GRASS);
    this.rank = new Uint8Array(n);
    this.bridgeDir = new Uint8Array(n);
    this.lotIndex = new Int16Array(n).fill(-1);
    this.blocked = new Uint8Array(n);
    this.marksW = this.W * TILE;
    this.marks = new Uint8Array(this.marksW * this.H * TILE);
    this.build();
  }

  // ---- truy cập (kẹp ở mép thế giới: mép không phải mép địa hình) ----
  idx(wx: number, wy: number): number {
    const x = Math.max(0, Math.min(this.W - 1, wx));
    const y = Math.max(0, Math.min(this.H - 1, wy));
    return y * this.W + x;
  }
  inside(wx: number, wy: number): boolean {
    return wx >= 0 && wy >= 0 && wx < this.W && wy < this.H;
  }
  terrainAt(wx: number, wy: number): number {
    return this.terrain[this.idx(wx, wy)]!;
  }
  isWalk(wx: number, wy: number): boolean {
    if (!this.inside(wx, wy)) return false;
    const i = wy * this.W + wx;
    return WALKABLE.has(this.terrain[i]!) && !this.blocked[i];
  }
  chunkIds(): ChunkId[] {
    const out: ChunkId[] = [];
    for (let cy = 0; cy < this.bp.chunksY; cy++) for (let cx = 0; cx < this.bp.chunksX; cx++) out.push({ cx, cy });
    return out;
  }
  ownerOf(o: WorldObject): ChunkId {
    return chunkOfTile(o.tx, o.ty);
  }

  // ---- dựng ----
  private build() {
    const bp = this.bp;
    for (const nd of bp.nodes) this.nodeById.set(nd.id, { x: nd.x, y: nd.y, deg: 0 });
    for (const r of bp.roads) {
      const a = this.nodeById.get(r.a);
      const b = this.nodeById.get(r.b);
      if (!a || !b) throw new Error(`Đường ${r.id}: thiếu nút ${!a ? r.a : r.b}`);
      a.deg++;
      b.deg++;
      const d = ROAD_DEFAULT[r.type];
      const poly = flatten([[a.x, a.y], ...(r.via ?? []), [b.x, b.y]], !!r.curve);
      this.roads.push({
        seg: r,
        poly,
        width: r.width ?? d.width,
        sw: r.sidewalk === 'none' ? 0 : (r.sidewalkWidth ?? d.sidewalk),
        rank: d.rank,
        lanes: r.lanes ?? d.lanes,
        length: polyLength(poly),
      });
    }
    for (const rv of bp.rivers) this.rivers.push({ river: rv, poly: flatten(rv.pts, !!rv.curve) });

    this.areasPass(bp.areas);
    this.waterPass();
    this.roadsPass();
    this.bridgesPass();
    this.sidewalkPass();
    this.promenadePass();
    this.lotsPass();
    this.marksPass();
    this.objectsPass();
  }

  private forBox(x0: number, y0: number, x1: number, y1: number, fn: (x: number, y: number) => void) {
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(this.H - 1, Math.ceil(y1)); y++) {
      for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(this.W - 1, Math.ceil(x1)); x++) fn(x, y);
    }
  }

  private areasPass(areas: Area[]) {
    for (const a of areas) {
      const s = a.shape;
      const code = a.type === 'plaza' ? T.PLAZA : a.type === 'park' ? T.PARK : a.type === 'lotground' ? T.ASPHALT : T.SAND;
      let box: [number, number, number, number];
      let inside: (x: number, y: number) => boolean;
      if (s.kind === 'rect') {
        box = [s.x, s.y, s.x + s.w, s.y + s.h];
        inside = (x, y) => x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h;
      } else if (s.kind === 'ellipse') {
        box = [s.cx - s.rx, s.cy - s.ry, s.cx + s.rx, s.cy + s.ry];
        inside = (x, y) => ((x - s.cx) / s.rx) ** 2 + ((y - s.cy) / s.ry) ** 2 <= 1;
      } else {
        const xs = s.pts.map((p) => p[0]);
        const ys = s.pts.map((p) => p[1]);
        box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
        inside = (x, y) => inPolygon(s.pts, x, y);
      }
      this.forBox(box[0], box[1], box[2], box[3], (x, y) => {
        if (inside(x + 0.5, y + 0.5)) this.terrain[y * this.W + x] = code;
      });
    }
  }

  private riverWidthAt(rv: { river: River; poly: Pt[] }, t: number): number {
    const ctrl = rv.river.pts;
    const arcs = ctrl.map((p) => nearestOnPoly(rv.poly, p[0], p[1]).t);
    const w = rv.river.width;
    if (t <= arcs[0]!) return w[0]!;
    for (let i = 0; i < ctrl.length - 1; i++) {
      const a0 = arcs[i]!;
      const a1 = arcs[i + 1]!;
      if (t <= a1) return w[i]! + ((w[i + 1]! - w[i]!) * (t - a0)) / Math.max(1e-6, a1 - a0);
    }
    return w[w.length - 1]!;
  }

  private waterPass() {
    const bp = this.bp;
    for (const rv of this.rivers) {
      const wob = rv.river.wobble ?? 0.9;
      const maxw = Math.max(...rv.river.width) / 2 + wob + 1;
      const xs = rv.poly.map((p) => p.x);
      const ys = rv.poly.map((p) => p.y);
      const arcs = rv.river.pts.map((p) => nearestOnPoly(rv.poly, p[0], p[1]).t);
      const wAt = (t: number) => {
        const w = rv.river.width;
        if (t <= arcs[0]!) return w[0]!;
        for (let i = 0; i < arcs.length - 1; i++) {
          if (t <= arcs[i + 1]!) return w[i]! + ((w[i + 1]! - w[i]!) * (t - arcs[i]!)) / Math.max(1e-6, arcs[i + 1]! - arcs[i]!);
        }
        return w[w.length - 1]!;
      };
      this.forBox(Math.min(...xs) - maxw, Math.min(...ys) - maxw, Math.max(...xs) + maxw, Math.max(...ys) + maxw, (x, y) => {
        const cx = x + 0.5;
        const cy = y + 0.5;
        const nr = nearestOnPoly(rv.poly, cx, cy);
        if (nr.d > maxw) return;
        const hw = wAt(nr.t) / 2;
        const wobble = (vnoise(cx * 0.16, cy * 0.16, bp.seed + 11) - 0.5) * 2 * wob;
        if (nr.d + wobble < hw) this.terrain[y * this.W + x] = T.WATER;
      });
    }
    for (const p of bp.ponds) {
      this.forBox(p.cx - p.rx - 2, p.cy - p.ry - 2, p.cx + p.rx + 2, p.cy + p.ry + 2, (x, y) => {
        const cx = x + 0.5;
        const cy = y + 0.5;
        const wob = (vnoise(cx * 0.3, cy * 0.3, bp.seed + 5) - 0.5) * 0.5;
        if (((cx - p.cx) / p.rx) ** 2 + ((cy - p.cy) / p.ry) ** 2 + wob <= 1) this.terrain[y * this.W + x] = T.WATER;
      });
    }
  }

  private roadsPass() {
    for (const r of this.roads) {
      const surf = r.seg.surface ?? (r.seg.type === 'alley' ? 'brick' : r.seg.type === 'path' ? 'path' : r.seg.type === 'lane' ? 'brick' : 'asphalt');
      const code = surf === 'asphalt' ? T.ASPHALT : surf === 'brick' ? T.BRICK : T.PATH;
      const m = r.width / 2 + 1;
      const xs = r.poly.map((p) => p.x);
      const ys = r.poly.map((p) => p.y);
      this.forBox(Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) + m, Math.max(...ys) + m, (x, y) => {
        const i = y * this.W + x;
        if (this.terrain[i] === T.WATER) return;
        if (nearestOnPoly(r.poly, x + 0.5, y + 0.5).d < r.width / 2 && r.rank >= this.rank[i]!) {
          this.terrain[i] = code;
          this.rank[i] = r.rank;
        }
      });
    }
  }

  private bridgesPass() {
    for (const b of this.bp.bridges) {
      const [ax, ay] = b.a;
      const [bx, by] = b.b;
      const poly: Pt[] = [{ x: ax, y: ay }, { x: bx, y: by }];
      const dir: 0 | 1 = Math.abs(bx - ax) >= Math.abs(by - ay) ? 0 : 1;
      const tiles: [number, number][] = [];
      const len = Math.hypot(bx - ax, by - ay);
      const m = b.width / 2 + 1;
      this.forBox(Math.min(ax, bx) - m, Math.min(ay, by) - m, Math.max(ax, bx) + m, Math.max(ay, by) + m, (x, y) => {
        const nr = nearestOnPoly(poly, x + 0.5, y + 0.5);
        if (nr.d >= b.width / 2) return;
        const i = y * this.W + x;
        // chỉ phủ phần nước và một ô đất sát nước ở mỗi đầu cầu
        let nearWater = this.terrain[i] === T.WATER;
        if (!nearWater) for (const [dx, dy] of N4) if (this.terrain[this.idx(x + dx, y + dy)] === T.WATER) nearWater = true;
        if (nearWater && nr.t <= len + 0.5) {
          this.terrain[i] = T.BRIDGE;
          this.bridgeDir[i] = dir;
          this.rank[i] = 9;
          tiles.push([x, y]);
        }
      });
      this.bridges.push({ bridge: b, tiles, dir });
    }
  }

  private sidewalkPass() {
    for (const r of this.roads) {
      if (!r.sw) continue;
      const side = r.seg.sidewalk ?? 'both';
      const m = r.width / 2 + r.sw + 1;
      const xs = r.poly.map((p) => p.x);
      const ys = r.poly.map((p) => p.y);
      this.forBox(Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) + m, Math.max(...ys) + m, (x, y) => {
        const i = y * this.W + x;
        const tt = this.terrain[i]!;
        if (tt !== T.GRASS && tt !== T.PARK && tt !== T.SAND) return;
        const nr = nearestOnPoly(r.poly, x + 0.5, y + 0.5);
        if (nr.d < r.width / 2 || nr.d >= r.width / 2 + r.sw) return;
        // side = -1: bên phải hướng đi (a→b); +1: bên trái
        if (side === 'left' && nr.side !== 1) return;
        if (side === 'right' && nr.side !== -1) return;
        this.terrain[i] = T.SIDEWALK;
      });
    }
  }

  private promenadePass() {
    for (const rv of this.rivers) {
      const pr = rv.river.promenade;
      if (!pr) continue;
      const code = pr.surface === 'brick' ? T.BRICK : T.SIDEWALK;
      const dist = new Int16Array(this.W * this.H).fill(-1);
      const q: number[] = [];
      for (let i = 0; i < this.terrain.length; i++) {
        if (this.terrain[i] === T.WATER) {
          dist[i] = 0;
          q.push(i);
        }
      }
      for (let h = 0; h < q.length; h++) {
        const c = q[h]!;
        const d = dist[c]!;
        if (d >= pr.width) continue;
        const x = c % this.W;
        const y = (c / this.W) | 0;
        for (const [dx, dy] of N4) {
          const nx = x + dx;
          const ny = y + dy;
          if (!this.inside(nx, ny)) continue;
          const n = ny * this.W + nx;
          if (dist[n] !== -1) continue;
          dist[n] = d + 1;
          q.push(n);
        }
      }
      const reach = Math.max(...rv.river.width) / 2 + pr.width + 3;
      for (let i = 0; i < dist.length; i++) {
        const d = dist[i]!;
        if (d < 1 || d > pr.width) continue;
        const tt = this.terrain[i]!;
        if (tt !== T.GRASS && tt !== T.PARK && tt !== T.SAND) continue;
        const x = i % this.W;
        const y = (i / this.W) | 0;
        if (nearestOnPoly(rv.poly, x + 0.5, y + 0.5).d > reach) continue;
        this.terrain[i] = code;
      }
    }
  }

  private lotsPass() {
    this.preLot = this.terrain.slice();
    this.bp.lots.forEach((lot, li) => {
      for (let y = lot.y; y < lot.y + lot.h; y++) {
        for (let x = lot.x; x < lot.x + lot.w; x++) {
          if (!this.inside(x, y)) continue;
          const i = y * this.W + x;
          // Lô nhà không phải những tấm nền vuông giống nhau. Giữ lại cỏ/công viên của khu phố;
          // chỉ lưu dấu lô và collision dưới công trình.
          this.lotIndex[i] = li;
          this.blocked[i] = 1;
        }
      }
      // thảm cửa: ô giữa của hàng đáy mở lối; ô ngoài cửa nằm ngay phía nam
      const tx = lot.x + Math.floor(lot.w / 2);
      const ty = lot.y + lot.h - 1;
      if (this.inside(tx, ty)) this.blocked[ty * this.W + tx] = 0;
      // Mỗi cửa có một bậc lát gạch nhỏ; độ rộng thay đổi theo vị trí để phố không thành dãy ô lặp.
      const apronWidth = lot.w >= 8 && hash2(lot.x, lot.y, this.bp.seed + 63) > 0.5 ? 3 : 1;
      const apronDepth = hash2(lot.x, lot.y, this.bp.seed + 64) > 0.58 ? 2 : 1;
      for (let dy = 1; dy <= apronDepth; dy++) {
        for (let dx = 0; dx < apronWidth; dx++) {
          const ax = tx + dx - Math.floor(apronWidth / 2);
          const ay = ty + dy;
          if (!this.inside(ax, ay)) continue;
          const ai = ay * this.W + ax;
          if (this.terrain[ai] === T.GRASS || this.terrain[ai] === T.PARK || this.terrain[ai] === T.SAND) this.terrain[ai] = T.BRICK;
        }
      }
      this.doormats.set(lot.id, { lot, tx, ty, doorX: tx, doorY: ty + 1 });
    });
  }

  private marksPass() {
    const put = (x: number, y: number, v: number) => {
      const ix = Math.floor(x * TILE);
      const iy = Math.floor(y * TILE);
      if (ix < 0 || iy < 0 || ix >= this.marksW || iy >= this.H * TILE) return;
      this.marks[iy * this.marksW + ix] = v;
    };
    const junctions = [...this.nodeById.values()].filter((nd) => nd.deg >= 3);
    const nearJunction = (x: number, y: number, rad: number) => junctions.some((nd) => Math.hypot(nd.x - x, nd.y - y) < rad);
    for (const r of this.roads) {
      if (!r.lanes) continue;
      if ((r.seg.surface ?? 'asphalt') !== 'asphalt') continue;
      const double = r.seg.type === 'avenue';
      for (let s = 0; s < r.length; s += 1 / TILE) {
        const p = pointAt(r.poly, s);
        const tt = this.terrainAt(Math.floor(p.x), Math.floor(p.y));
        if (tt !== T.ASPHALT && tt !== T.BRIDGE) continue;
        if (nearJunction(p.x, p.y, r.width / 2 + 1.4)) continue;
        const nx = -p.dy;
        const ny = p.dx;
        if (double) {
          for (const o of [-1.5 / TILE, 1.5 / TILE]) put(p.x + nx * o, p.y + ny * o, 1);
        } else if (Math.floor(s * TILE) % 16 < 9) {
          put(p.x, p.y, 2);
          put(p.x + nx / TILE, p.y + ny / TILE, 2);
        }
      }
    }
    // Painted parking bays on lotground areas (screen-wide lines remain pixel-anchored).
    for (const a of this.bp.areas) {
      if (a.type !== 'lotground' || a.shape.kind !== 'rect') continue;
      const { x, y, w, h } = a.shape;
      for (let bay = x + 2; bay < x + w - 1; bay += 5) {
        for (let py = y + 0.5; py < y + h - 1; py += 0.25) put(bay, py, 2);
      }
      for (let px = x + 0.5; px < x + w - 0.5; px += 0.25) put(px, y + h - 1, 1);
    }
    // vạch qua đường tại nút giao bậc >= 3
    for (const [id, nd] of this.nodeById) {
      if (nd.deg < 3) continue;
      const incident = this.roads.filter((q) => q.seg.a === id || q.seg.b === id);
      const maxw = Math.max(...incident.map((q) => q.width));
      for (const r of incident) {
        if ((r.seg.surface ?? 'asphalt') !== 'asphalt' || r.seg.type === 'alley' || r.seg.type === 'path' || r.seg.type === 'lane') continue;
        const poly = r.seg.a === id ? r.poly : [...r.poly].reverse();
        const s0 = maxw / 2 + 0.6;
        for (let s = s0; s < s0 + 1.4; s += 1 / TILE) {
          const p = pointAt(poly, s);
          const nx = -p.dy;
          const ny = p.dx;
          for (let lat = -r.width / 2 + 0.3; lat < r.width / 2 - 0.3; lat += 1 / TILE) {
            if (Math.floor((lat + r.width / 2) * TILE) % 4 >= 2) continue;
            const x = p.x + nx * lat;
            const y = p.y + ny * lat;
            const tt = this.terrainAt(Math.floor(x), Math.floor(y));
            if (tt === T.ASPHALT || tt === T.BRIDGE) put(x, y, 3);
          }
        }
      }
    }
  }

  // ---- vật thể ----
  private nearDoor(tx: number, ty: number): boolean {
    for (const d of this.doormats.values()) if (Math.abs(d.doorX - tx) <= 2 && Math.abs(d.doorY - ty) <= 2) return true;
    return false;
  }
  private free(tx: number, ty: number): boolean {
    if (!this.inside(tx, ty) || this.objAt.has(`${tx},${ty}`) || this.blocked[ty * this.W + tx]) return false;
    return !this.nearDoor(tx, ty);
  }
  private nearObj(tx: number, ty: number, r: number): boolean {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (this.objAt.has(`${tx + dx},${ty + dy}`)) return true;
    return false;
  }
  private addObj(o: WorldObject) {
    this.objects.push(o);
    for (const [x, y] of o.block) {
      this.objAt.add(`${x},${y}`);
      if (this.inside(x, y)) this.blocked[y * this.W + x] = 1;
    }
    this.objAt.add(`${o.tx},${o.ty}`);
  }
  private place(kind: WorldObject['kind'], id: string, tx: number, ty: number, variant: number, size: { w: number; h: number }) {
    this.addObj({ id, kind, tx, ty, px: tx * TILE + TILE / 2, py: (ty + 1) * TILE, w: size.w, h: size.h, variant, block: [[tx, ty]] });
  }

  private objectsPass() {
    const bp = this.bp;
    for (const lot of bp.lots) {
      const dm = this.doormats.get(lot.id)!;
      const block: [number, number][] = [];
      for (let y = lot.y; y < lot.y + lot.h; y++) for (let x = lot.x; x < lot.x + lot.w; x++) if (!(x === dm.tx && y === dm.ty)) block.push([x, y]);
      this.objects.push({
        id: lot.id, kind: 'building', px: (lot.x + lot.w / 2) * TILE, py: (lot.y + lot.h) * TILE, w: lot.sprite.w, h: lot.sprite.h,
        variant: 0, tx: dm.tx, ty: dm.ty, block, sprite: lot.sprite.src, lotId: lot.id,
      });
      for (const [x, y] of block) this.objAt.add(`${x},${y}`);
      this.objAt.add(`${dm.tx},${dm.ty}`);
    }
    for (const d of bp.decor) {
      if (d.kind === 'fountain') {
        const tx = Math.floor(d.x);
        const ty = Math.floor(d.y);
        const block: [number, number][] = [];
        for (let y = ty - 1; y <= ty + 1; y++) for (let x = tx - 1; x <= tx + 1; x++) block.push([x, y]);
        this.addObj({ id: d.id, kind: 'fountain', tx, ty, px: tx * TILE + TILE / 2, py: (ty + 2) * TILE, w: 48, h: 44, variant: d.variant ?? 0, block });
      } else {
        this.place(d.kind, d.id, Math.floor(d.x), Math.floor(d.y), d.variant ?? 0, SIZE[d.kind]!);
      }
    }
    const junctions = [...this.nodeById.values()].filter((nd) => nd.deg >= 3);
    for (const r of this.roads) {
      if (!r.sw) continue;
      const wantTrees = r.seg.trees ?? (r.seg.type === 'avenue' || r.seg.type === 'street');
      const wantLamps = r.seg.lamps ?? (r.seg.type === 'avenue' || r.seg.type === 'street');
      const sw = r.seg.sidewalk ?? 'both';
      const sides = sw === 'both' ? [-1, 1] : sw === 'left' ? [1] : [-1];
      const off = r.width / 2 + 0.5;
      for (const sd of sides) {
        for (let s = 3; s < r.length - 3; s += 1) {
          const p = pointAt(r.poly, s);
          const nx = -p.dy * -sd;
          const ny = p.dx * -sd;
          const tx = Math.floor(p.x + nx * off);
          const ty = Math.floor(p.y + ny * off);
          if (this.terrainAt(tx, ty) !== T.SIDEWALK) continue;
          if (junctions.some((nd) => Math.hypot(nd.x - p.x, nd.y - p.y) < r.width / 2 + 3)) continue;
          const slot = Math.floor(s / 5);
          if (s - slot * 5 >= 1) continue;
          if (wantTrees && slot % 2 === 0 && this.free(tx, ty)) this.place('tree', `t-${r.seg.id}-${sd}-${slot}`, tx, ty, Math.floor(hash2(tx, ty, bp.seed) * 3), SIZE.tree!);
          else if (wantLamps && slot % 2 === 1 && this.free(tx, ty)) this.place('lamp', `l-${r.seg.id}-${sd}-${slot}`, tx, ty, 0, SIZE.lamp!);
        }
      }
    }
    for (const a of bp.areas) {
      if (a.type !== 'park') continue;
      const s = a.shape;
      const box = s.kind === 'rect' ? [s.x, s.y, s.x + s.w, s.y + s.h] : s.kind === 'ellipse' ? [s.cx - s.rx, s.cy - s.ry, s.cx + s.rx, s.cy + s.ry] : [Math.min(...s.pts.map((p) => p[0])), Math.min(...s.pts.map((p) => p[1])), Math.max(...s.pts.map((p) => p[0])), Math.max(...s.pts.map((p) => p[1]))];
      for (let ty = Math.floor(box[1]!); ty < box[3]!; ty++) {
        for (let tx = Math.floor(box[0]!); tx < box[2]!; tx++) {
          if (this.terrainAt(tx, ty) !== T.PARK || !this.free(tx, ty)) continue;
          const edge = N4.some(([dx, dy]) => this.terrainAt(tx + dx, ty + dy) !== T.PARK);
          const h = hash2(tx, ty, bp.seed + 91);
          if (this.nearObj(tx, ty, edge ? 0 : 1)) continue;
          if (N4.some(([dx, dy]) => this.terrainAt(tx + dx, ty + dy) === T.WATER)) continue;
          // Continuous planted edges and scattered interior trees make each block read as a garden island.
          const bush = edge ? h < 0.96 : h < 0.22;
          if (edge ? h >= 0.96 : h > 0.68) continue;
          this.place(bush ? 'bush' : 'tree', `p-${a.id}-${tx}-${ty}`, tx, ty, Math.floor(hash2(tx, ty, bp.seed + 3) * 3), bush ? SIZE.bush! : SIZE.tree!);
        }
      }
    }
    for (const rv of this.rivers) {
      if (!rv.river.promenade) continue;
      for (let ty = 0; ty < this.H; ty++) {
        for (let tx = 0; tx < this.W; tx++) {
          const tt = this.terrain[ty * this.W + tx]!;
          if (tt !== T.BRICK && tt !== T.SIDEWALK) continue;
          let near1 = false;
          let near2 = false;
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const m = Math.abs(dx) + Math.abs(dy);
              if (m > 2 || m === 0) continue;
              if (this.terrainAt(tx + dx, ty + dy) === T.WATER) {
                if (m === 1) near1 = true;
                else near2 = true;
              }
            }
          }
          if (near1 || !near2 || !this.free(tx, ty) || this.nearObj(tx, ty, 5)) continue;
          const h = hash2(tx, ty, bp.seed + 37);
          if (h < 0.05) this.place('lamp', `rl-${tx}-${ty}`, tx, ty, 0, SIZE.lamp!);
          else if (h < 0.075) this.place('bench', `rb-${tx}-${ty}`, tx, ty, 0, SIZE.bench!);
        }
      }
    }
  }
}
