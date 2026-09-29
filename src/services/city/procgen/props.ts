/**
 * VẬT PHẨM sinh bằng code: cây (ba loài), bụi, đá, hoa, cỏ, hàng rào, ghế,
 * đèn đường; đồ công trường (cọc khảo sát, dây căng, biển dự án, đống đất,
 * thùng dụng cụ, xe rùa) và đống vật liệu (gỗ, đá, gạch, thép, kính).
 *
 * Mọi hàm ghi vào `Builder` ở ngữ cảnh công đoạn hiện hành, nên cùng một cái
 * cây dùng được cho cảnh quan công đoạn 8 lẫn cây tự nhiên của địa hình.
 */
import { PALETTE } from '@/data/city/palette';
import { pickOf, type Builder } from './parts';

const P = PALETTE;

// ------------------------------------------------------------------ cây & thiên nhiên

/** Cây tán tròn (loài 1): thân nâu, 2–3 khối tán lệch nhau. */
export function treeRound(b: Builder, x: number, z: number, scale: number, r: () => number, y = 0): Builder {
  const h = (0.32 + r() * 0.12) * scale;
  b.cyl(x, y, z, 0.05 * scale, h, P.foliage.trunk, { seg: 6 });
  const leaf = pickOf(P.foliage.leaf, r);
  const cr = (0.24 + r() * 0.08) * scale;
  b.sphere(x, y + h - cr * 0.3, z, cr, leaf);
  b.sphere(x + cr * 0.45, y + h - cr * 0.6, z + cr * 0.2, cr * 0.7, pickOf(P.foliage.leaf, r));
  if (r() < 0.6) b.sphere(x - cr * 0.4, y + h - cr * 0.55, z - cr * 0.25, cr * 0.65, leaf);
  return b;
}

/** Cây thông (loài 2): tầng tán hình nón. */
export function treePine(b: Builder, x: number, z: number, scale: number, r: () => number, y = 0): Builder {
  const h = 0.16 * scale;
  b.cyl(x, y, z, 0.045 * scale, h, P.foliage.trunk, { seg: 6 });
  const c = pickOf(P.foliage.pine, r);
  const tiers = 3;
  for (let i = 0; i < tiers; i++) {
    const rad = (0.26 - i * 0.06) * scale;
    b.cyl(x, y + h + i * 0.15 * scale, z, rad, 0.26 * scale, c, { taper: 0, seg: 8 });
  }
  return b;
}

/** Cây dừa (loài 3, ven biển): thân cong nhẹ, lá xoè. */
export function treePalm(b: Builder, x: number, z: number, scale: number, r: () => number, y = 0): Builder {
  const h = (0.55 + r() * 0.2) * scale;
  const lean = (r() - 0.5) * 0.25;
  b.cyl(x, y, z, 0.035 * scale, h, '#A7784C', { seg: 6, rz: lean, taper: 0.7 });
  const tx = x - Math.sin(lean) * h;
  const ty = y + Math.cos(lean) * h;
  const leaf = pickOf(P.foliage.palm, r);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + r() * 0.3;
    b.box(tx + Math.cos(a) * 0.14 * scale, ty - 0.02, z + Math.sin(a) * 0.14 * scale, 0.3 * scale, 0.03 * scale, 0.09 * scale, leaf, { ry: -a, rz: -0.35 });
  }
  b.sphere(tx, ty - 0.03, z, 0.04 * scale, '#7A5233');
  return b;
}

export function bush(b: Builder, x: number, z: number, scale: number, r: () => number, y = 0): Builder {
  const c = P.foliage.bush;
  b.sphere(x, y, z, 0.12 * scale, c);
  b.sphere(x + 0.08 * scale, y, z + 0.04 * scale, 0.09 * scale, pickOf(P.foliage.leaf, r));
  return b;
}

export function rock(b: Builder, x: number, z: number, scale: number, r: () => number, y = 0): Builder {
  b.sphere(x, y - 0.03 * scale, z, 0.13 * scale, pickOf([P.terrain.rock, P.terrain.rockDark], r), { ry: r() * 3 });
  if (r() < 0.5) b.sphere(x + 0.1 * scale, y - 0.02, z + 0.05 * scale, 0.07 * scale, P.terrain.rock);
  return b;
}

export function flowers(b: Builder, x: number, z: number, r: () => number, y = 0, n = 5): Builder {
  for (let i = 0; i < n; i++) {
    const dx = (r() - 0.5) * 0.3;
    const dz = (r() - 0.5) * 0.3;
    b.cyl(x + dx, y, z + dz, 0.008, 0.06, '#4E9F3D', { seg: 4 });
    b.sphere(x + dx, y + 0.06, z + dz, 0.025, pickOf(P.foliage.flower, r));
  }
  return b;
}

export function grassTuft(b: Builder, x: number, z: number, r: () => number, y = 0): Builder {
  for (let i = 0; i < 3; i++) b.cyl(x + (r() - 0.5) * 0.08, y, z + (r() - 0.5) * 0.08, 0.012, 0.07 + r() * 0.04, P.terrain.grassDark, { taper: 0, seg: 4 });
  return b;
}

// ------------------------------------------------------------------ đồ đường phố

export function bench(b: Builder, x: number, z: number, ry: number, y = 0): Builder {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  b.box(x, y + 0.08, z, 0.34, 0.03, 0.1, P.wood.mid, { ry });
  b.box(x - s * 0.045, y + 0.11, z - c * 0.045, 0.34, 0.08, 0.02, P.wood.mid, { ry });
  b.box(x + c * 0.14, y, z - s * 0.14, 0.03, 0.08, 0.09, P.steel.dark, { ry });
  b.box(x - c * 0.14, y, z + s * 0.14, 0.03, 0.08, 0.09, P.steel.dark, { ry });
  return b;
}

export function streetLamp(b: Builder, x: number, z: number, y = 0, h = 0.7): Builder {
  b.cyl(x, y, z, 0.022, h, P.steel.dark, { seg: 6 });
  b.box(x, y + h - 0.02, z + 0.05, 0.03, 0.03, 0.12, P.steel.dark);
  b.sphere(x, y + h - 0.06, z + 0.1, 0.045, '#FFF1B8', { glow: true });
  return b;
}

export function fenceRun(b: Builder, x0: number, z0: number, x1: number, z1: number, y = 0, color: string = P.wood.light): Builder {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const n = Math.max(1, Math.round(len / 0.25));
  const ry = Math.atan2(-(z1 - z0), x1 - x0);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    b.box(x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t, 0.035, 0.2, 0.035, color);
  }
  b.box((x0 + x1) / 2, y + 0.07, (z0 + z1) / 2, len, 0.025, 0.02, color, { ry });
  b.box((x0 + x1) / 2, y + 0.15, (z0 + z1) / 2, len, 0.025, 0.02, color, { ry });
  return b;
}

// ------------------------------------------------------------------ đồ công trường

export function stake(b: Builder, x: number, z: number, y = 0): Builder {
  b.box(x, y, z, 0.035, 0.22, 0.035, P.construction.stake);
  b.box(x, y + 0.18, z, 0.045, 0.03, 0.045, '#E0533D');
  return b;
}

/** Dây căng giữa hai cọc. */
export function rope(b: Builder, x0: number, z0: number, x1: number, z1: number, y = 0.16): Builder {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const ry = Math.atan2(-(z1 - z0), x1 - x0);
  return b.box((x0 + x1) / 2, y, (z0 + z1) / 2, len, 0.012, 0.012, P.construction.rope, { ry });
}

/** Biển tên dự án + bản vẽ nhỏ. */
export function projectSign(b: Builder, x: number, z: number, ry: number, y = 0): Builder {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  b.box(x - c * 0.1, y, z + s * 0.1, 0.03, 0.34, 0.03, P.wood.dark, { ry });
  b.box(x + c * 0.1, y, z - s * 0.1, 0.03, 0.34, 0.03, P.wood.dark, { ry });
  b.box(x, y + 0.2, z, 0.3, 0.16, 0.02, P.construction.sign, { ry });
  b.box(x, y + 0.23, z + 0.012 * Math.cos(ry), 0.2, 0.08, 0.005, P.construction.blueprint, { ry });
  return b;
}

export function soilPile(b: Builder, x: number, z: number, size: number, y = 0): Builder {
  return b.cyl(x, y, z, size, size * 0.8, P.terrain.soil, { taper: 0.25, seg: 9 });
}

export function toolbox(b: Builder, x: number, z: number, y = 0): Builder {
  b.box(x, y, z, 0.12, 0.06, 0.07, P.construction.toolbox);
  b.box(x, y + 0.06, z, 0.06, 0.015, 0.015, P.steel.dark);
  return b;
}

export function wheelbarrow(b: Builder, x: number, z: number, ry: number, y = 0): Builder {
  b.box(x, y + 0.06, z, 0.18, 0.07, 0.12, '#3E7CC4', { ry });
  b.cyl(x + Math.cos(ry) * 0.1, y, z - Math.sin(ry) * 0.1, 0.035, 0.03, P.steel.dark, { rx: Math.PI / 2, ry });
  return b;
}

export type StackKind = 'wood' | 'stone' | 'brick' | 'steel' | 'glass';

/** Đống vật liệu đã giao tới công trường. `amount` 1..4 = số lớp. */
export function materialStack(b: Builder, kind: StackKind, x: number, z: number, amount: number, y = 0): Builder {
  const layers = Math.max(1, Math.min(4, Math.round(amount)));
  for (let i = 0; i < layers; i++) {
    const yy = y + i * 0.05;
    if (kind === 'wood') {
      for (let k = 0; k < 3; k++) b.cyl(x - 0.07 + k * 0.07, yy + 0.025, z, 0.025, 0.24, i % 2 ? P.wood.light : P.wood.mid, { rx: Math.PI / 2, seg: 6 });
    } else if (kind === 'brick') {
      b.box(x, yy, z, 0.22, 0.05, 0.14, i % 2 ? P.brick.red : P.brick.warm);
    } else if (kind === 'stone') {
      b.box(x, yy, z, 0.2, 0.05, 0.16, i % 2 ? P.stone.mid : P.stone.light);
    } else if (kind === 'steel') {
      b.box(x, yy, z, 0.28, 0.03, 0.04, P.steel.navy);
      b.box(x, yy, z + 0.07, 0.28, 0.03, 0.04, P.steel.grey);
    } else {
      b.box(x, yy, z, 0.2, 0.04, 0.14, P.glass.blue);
    }
  }
  return b;
}
