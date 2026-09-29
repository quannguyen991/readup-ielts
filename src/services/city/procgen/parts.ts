/**
 * CÂY BỘ PHẬN của công trình sinh bằng code — thuần dữ liệu (không three.js),
 * nên test được hình học trên Node: cửa có nằm trên tường không, sàn có đủ
 * không, cùng seed có cùng hình không.
 *
 * Mỗi bộ phận gắn NHÃN CÔNG ĐOẠN: xuất hiện ở công đoạn nào (`stage`), theo thứ
 * tự nào trong công đoạn (`order` 0..1 — tường lên từng hàng, mái lắp từng
 * phần), tháo ở công đoạn nào (`until` — giàn giáo, cọc mốc). Cao ốc thêm
 * `floor` + `fstep` (khung → sàn → mặt dựng → mép tầng) và `core` (lõi đi trước).
 *
 * Toạ độ cục bộ: tâm khu đất ở (0, 0), mặt đất y = 0, mặt trước nhìn về +z.
 * `p` là TÂM ĐÁY của khối; `s` là kích thước [rộng x, cao y, sâu z].
 */
export type Shape = 'box' | 'cyl' | 'sphere' | 'gable' | 'hip' | 'pyr';

export type Part = {
  shape: Shape;
  p: [number, number, number];
  s: [number, number, number];
  /** Quay quanh trục y (radian). */
  ry?: number;
  /** Nghiêng quanh trục x / z (radian) — tấm mái, dây căng. */
  rx?: number;
  rz?: number;
  /** Màu thô (lúc xây). */
  c: string;
  /** Màu sau khi sơn (từ công đoạn 7). */
  paint?: string;
  /** Hình trụ: tỉ lệ bán kính đỉnh / đáy (0 = hình nón). */
  taper?: number;
  seg?: number;
  stage: number;
  order?: number;
  until?: number;
  /** Chỉ hiện khi vật liệu của công đoạn hiện tại đã giao (đống vật liệu). */
  delivery?: boolean;
  floor?: number;
  fstep?: number;
  core?: boolean;
  /** Giàn giáo vòng quanh tầng: chỉ hiện quanh hai tầng đang thi công. */
  ring?: boolean;
  /** Nhãn kiểm tra hình học (test): cửa, kính, tường, sàn, cột. */
  tag?: 'door' | 'window' | 'glass' | 'wall' | 'slab' | 'column' | 'core';
  /** Bộ phận phát sáng (đèn) — renderer có thể cho sáng nhẹ. */
  glow?: boolean;
};

export type Anchor = { tag: 'door' | 'side' | 'yard' | 'roof' | 'dock'; p: [number, number, number]; ry: number };

export type Crane = {
  /** Vị trí chân cần cẩu (cục bộ). */
  x: number;
  z: number;
  /** Hướng tay cần lúc nghỉ. */
  ry: number;
  jib: number;
};

export type ProcBuilding = {
  type: string;
  seed: number;
  /** Kích thước khu đất (ô). */
  size: [number, number];
  parts: Part[];
  anchors: Anchor[];
  /** Chiều cao khi hoàn thiện. */
  height: number;
  /** Cao ốc. */
  tower?: { floors: number; floorH: number; baseY: number; podium: number; crane: Crane; footprint: [number, number] };
  /** Chỗ công nhân đứng làm ở từng công đoạn (cục bộ). */
  workSpots: Record<number, [number, number, number][]>;
};

/** Trạng thái hiển thị (khớp `VisualProgress` của construction.ts). */
export type Visual = {
  stage: number;
  fraction: number;
  delivered: boolean;
  floorsDone: number;
  floorStep: number;
  craneUp: boolean;
};

export const DONE: Visual = { stage: 9, fraction: 1, delivered: true, floorsDone: 999, floorStep: 0, craneUp: false };

/** Bộ phận có hiện ở trạng thái `v` không. */
export function isVisible(part: Part, v: Visual): boolean {
  if (part.until !== undefined && v.stage >= part.until) return false;
  if (part.ring) return v.stage === 4 && part.floor !== undefined && part.floor >= v.floorsDone - 1 && part.floor <= v.floorsDone;
  if (part.floor !== undefined) {
    if (v.stage < 4) return false;
    if (v.stage > 4) return true;
    if (part.core) return part.floor <= v.floorsDone + 1;
    if (part.floor < v.floorsDone) return true;
    if (part.floor > v.floorsDone) return false;
    return (part.fstep ?? 0) < v.floorStep;
  }
  if (part.stage < v.stage) return true;
  if (part.stage > v.stage) return false;
  if (part.delivery && !v.delivered) return false;
  const order = part.order ?? 0;
  return order === 0 ? true : order <= v.fraction + 1e-9;
}

export function visibleParts(b: ProcBuilding, v: Visual): Part[] {
  return b.parts.filter((p) => isVisible(p, v));
}

/** Màu đang hiển thị của bộ phận (thô trước công đoạn 7, sơn từ công đoạn 7). */
export function colorOf(part: Part, v: Visual): string {
  return part.paint && v.stage >= 7 ? part.paint : part.c;
}

// ------------------------------------------------------------------ bộ dựng

export function rng(seed: number): () => number {
  let a = (seed | 0) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickOf<T>(list: readonly T[], r: () => number): T {
  return list[Math.floor(r() * list.length) % list.length]!;
}

/**
 * Bộ dựng: giữ "công đoạn / thứ tự / tháo" hiện hành để các lệnh thêm khối
 * ngắn gọn. `at(stage, order?, until?)` đổi ngữ cảnh.
 */
export class Builder {
  parts: Part[] = [];
  anchors: Anchor[] = [];
  workSpots: Record<number, [number, number, number][]> = {};
  private ctx: Pick<Part, 'stage' | 'order' | 'until' | 'delivery' | 'floor' | 'fstep' | 'core' | 'ring'> = { stage: 0 };

  at(stage: number, order = 0, until?: number): this {
    this.ctx = { stage, order, until };
    return this;
  }

  /** Ngữ cảnh tầng cao ốc. */
  floor(floor: number, fstep: number): this {
    this.ctx = { stage: 4, floor, fstep };
    return this;
  }

  ringAt(floor: number): this {
    this.ctx = { stage: 4, floor, ring: true };
    return this;
  }

  coreAt(floor: number): this {
    this.ctx = { stage: 4, floor, core: true };
    return this;
  }

  with(extra: Partial<Pick<Part, 'order' | 'until' | 'delivery'>>): this {
    this.ctx = { ...this.ctx, ...extra };
    return this;
  }

  add(part: Omit<Part, 'stage'> & Partial<Pick<Part, 'stage'>>): this {
    this.parts.push({ ...this.ctx, ...part } as Part);
    return this;
  }

  /** Hộp: (x, y đáy, z) + kích thước. */
  box(x: number, y: number, z: number, w: number, h: number, d: number, c: string, extra: Partial<Part> = {}): this {
    return this.add({ shape: 'box', p: [x, y, z], s: [w, h, d], c, ...extra });
  }

  cyl(x: number, y: number, z: number, r: number, h: number, c: string, extra: Partial<Part> = {}): this {
    return this.add({ shape: 'cyl', p: [x, y, z], s: [r * 2, h, r * 2], c, seg: 10, ...extra });
  }

  sphere(x: number, y: number, z: number, r: number, c: string, extra: Partial<Part> = {}): this {
    return this.add({ shape: 'sphere', p: [x, y, z], s: [r * 2, r * 2, r * 2], c, ...extra });
  }

  spot(stage: number, x: number, y: number, z: number): this {
    (this.workSpots[stage] ??= []).push([x, y, z]);
    return this;
  }

  anchor(tag: Anchor['tag'], x: number, y: number, z: number, ry = 0): this {
    this.anchors.push({ tag, p: [x, y, z], ry });
    return this;
  }
}

/** Kích thước khung của một bộ phận (để test: không nổi lơ lửng, nằm trong khu đất). */
export function bounds(p: Part): { min: [number, number, number]; max: [number, number, number] } {
  const [x, y, z] = p.p;
  const [w, h, d] = p.s;
  const rot = p.ry ?? 0;
  const c = Math.abs(Math.cos(rot));
  const s = Math.abs(Math.sin(rot));
  const hw = (w * c + d * s) / 2;
  const hd = (w * s + d * c) / 2;
  return { min: [x - hw, y, z - hd], max: [x + hw, y + h, z + hd] };
}
