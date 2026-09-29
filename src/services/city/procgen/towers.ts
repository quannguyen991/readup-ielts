/**
 * generateTower(seed, floors, variant) — CAO ỐC sinh bằng code, xây TỪNG TẦNG.
 *
 * Người dùng chê bản trước "hình khối sơ sài": ba hộp chồng, phủ một ảnh kính
 * lặp đều, mái phẳng. Ở đây mỗi tòa có đủ:
 * - KHỐI ĐẾ 1–3 tầng rộng hơn thân: sảnh kính, mái che cửa, cửa hàng, bậc, cây;
 * - LÕI thang máy đi trước sàn một tầng;
 * - CỘT theo nhịp đều + DẦM, SÀN có độ dày và mép sàn nhô ra thấy được;
 * - MẶT DỰNG chia ô bằng thanh đứng/ngang, xen ô đặc, ô lam, ô mở — không lặp
 *   nguyên một ô kính trên cả tòa; mặt sau và hai bên cũng có thiết kế;
 * - GÓC TÒA xử lý riêng theo họ (cột góc / vát góc / kính góc);
 * - TẦNG KỸ THUẬT khác nhịp mặt dựng ở giữa và trên cùng;
 * - ĐỈNH riêng từng họ (mái chóp, vành tròn + ăng-ten, cầu nối, đài quan sát
 *   + chóp nhọn) với đèn cảnh báo;
 * - chân công trình: lối vào sảnh, biển tên, bồn cây, ghế, đèn.
 *
 * Bốn họ, khác nhau ở DÁNG chứ không chỉ màu:
 * 1. `tower_stepped`     tháp văn phòng bậc thang: thân thu hẹp ở hai cao độ, sân mái lùi.
 * 2. `tower_rounded`     tháp kính bo góc: mặt bằng bát giác (vát góc), lam đứng theo nhịp.
 * 3. `tower_twin`        tháp đôi nối đế: hai thân cao thấp trên một đế, khe hở rõ, cầu nối.
 * 4. `tower_observation` tháp quan sát: thân thu dần, tầng quan sát nhô ra, chóp nhọn.
 *
 * Mỗi tầng xây theo 4 bước (`fstep`): 0 khung → 1 sàn → 2 mặt dựng → 3 mép tầng.
 */
import { PALETTE, pick } from '@/data/city/palette';
import { Builder, rng, type Crane, type ProcBuilding } from './parts';
import { bench, projectSign, rope, soilPile, stake, streetLamp, toolbox, treeRound, wheelbarrow } from './props';

const P = PALETTE;
export type TowerVariant = 'tower_stepped' | 'tower_rounded' | 'tower_twin' | 'tower_observation';

export const FLOOR_H = 0.34;
const BASE_Y = 0.14;

type Plan = { cx: number; cz: number; w: number; d: number; chamfer: number };

/** Một mặt của một tầng: các đoạn tường thẳng (bát giác có 8 đoạn). */
type Face = { x0: number; z0: number; x1: number; z1: number; corner: boolean };

function faces(p: Plan): Face[] {
  const { cx, cz, w, d, chamfer: c } = p;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;
  if (c <= 0) {
    return [
      { x0, z0: z1, x1, z1, corner: false }, // trước
      { x0: x1, z0: z1, x1, z1: z0, corner: false }, // phải
      { x0: x1, z0, x1: x0, z1: z0, corner: false }, // sau
      { x0, z0, x1: x0, z1, corner: false }, // trái
    ];
  }
  return [
    { x0: x0 + c, z0: z1, x1: x1 - c, z1, corner: false },
    { x0: x1 - c, z0: z1, x1, z1: z1 - c, corner: true },
    { x0: x1, z0: z1 - c, x1, z1: z0 + c, corner: false },
    { x0: x1, z0: z0 + c, x1: x1 - c, z1: z0, corner: true },
    { x0: x1 - c, z0, x1: x0 + c, z1: z0, corner: false },
    { x0: x0 + c, z0, x1: x0, z1: z0 + c, corner: true },
    { x0, z0: z0 + c, x1: x0, z1: z1 - c, corner: false },
    { x0, z0: z1 - c, x1: x0 + c, z1, corner: true },
  ];
}

/** Góc quay để một hộp dài theo trục x nằm dọc mặt (x0,z0)→(x1,z1). */
function faceAngle(f: Face): number {
  return Math.atan2(-(f.z1 - f.z0), f.x1 - f.x0);
}

/** Pháp tuyến ra ngoài của mặt (mặt bằng đi ngược chiều kim đồng hồ nhìn từ trên → ra ngoài bên phải). */
function outward(f: Face): [number, number] {
  const dx = f.x1 - f.x0;
  const dz = f.z1 - f.z0;
  const len = Math.hypot(dx, dz) || 1;
  return [dz / len, -dx / len];
}

type Style = {
  glass: string;
  glassAlt: string;
  mullion: string;
  spandrel: string;
  column: string;
  podium: string;
  accent: string;
};

function style(variant: TowerVariant, r: () => number): Style {
  const glass = pick([P.glass.blue, P.glass.teal, P.glass.lilac, P.glass.deep], r);
  switch (variant) {
    case 'tower_stepped':
      return { glass, glassAlt: P.glass.deep, mullion: '#EEF2F6', spandrel: pick([P.steel.warm, '#B9A58C'], r), column: P.stone.light, podium: P.stone.mid, accent: P.accent.gold };
    case 'tower_rounded':
      return { glass, glassAlt: P.glass.teal, mullion: '#DDE7EF', spandrel: P.steel.grey, column: P.steel.light, podium: P.concrete.mid, accent: '#3AA6C9' };
    case 'tower_twin':
      return { glass, glassAlt: P.glass.lilac, mullion: '#F3EEE6', spandrel: P.steel.navy, column: P.steel.navy, podium: P.brick.dark, accent: '#E0533D' };
    default:
      return { glass, glassAlt: P.glass.blue, mullion: '#F1F4F7', spandrel: P.steel.dark, column: P.steel.warm, podium: P.stone.dark, accent: '#8A63D2' };
  }
}

type Pattern = 'glass' | 'solid' | 'louver' | 'open';

/** Bề dày cột góc (cột đầu mỗi mặt) và cột giữa nhịp. */
const MID_T = 0.05;
function cornerT(variant: TowerVariant): number {
  return variant === 'tower_stepped' || variant === 'tower_observation' ? 0.1 : 0.07;
}

/**
 * Kiểu ô mặt dựng theo (tầng, mặt, ô) — có nhịp, không ngẫu nhiên hỗn loạn:
 * mỗi họ một quy luật; seed chỉ đổi pha của quy luật.
 */
function panel(variant: TowerVariant, floor: number, face: number, bay: number, bays: number, tech: boolean, phase: number): Pattern {
  if (tech) return 'louver';
  switch (variant) {
    case 'tower_stepped':
      // Cửa sổ băng ngang; ô đặc ở hai đầu mặt, ô mở so le mỗi 3 tầng.
      if (bay === 0 || bay === bays - 1) return floor % 2 === 0 ? 'solid' : 'glass';
      return (floor + bay + phase) % 6 === 0 ? 'open' : 'glass';
    case 'tower_rounded':
      // Kính suốt; lam ở mặt sau (hướng nắng) theo cột xen kẽ.
      if (face >= 4 && face <= 5 && (bay + phase) % 2 === 0) return 'louver';
      return (floor * 3 + bay + phase) % 11 === 0 ? 'open' : 'glass';
    case 'tower_twin':
      // Lưới ô vuông sâu: ô đặc theo đường chéo tạo hoa văn.
      return (floor + bay + phase) % 5 === 0 ? 'solid' : (floor + bay) % 7 === 3 ? 'open' : 'glass';
    default:
      return (bay + phase) % 4 === 1 && floor % 3 === 0 ? 'louver' : (floor + bay) % 9 === 0 ? 'open' : 'glass';
  }
}

/** Một tầng của một thân: khung → sàn → mặt dựng → mép tầng, trên mặt bằng `plan`. */
function floorOf(b: Builder, variant: TowerVariant, st: Style, plan: Plan, f: number, y: number, h: number, opts: { tech: boolean; podium: boolean; phase: number; ground: boolean }) {
  const fs = faces(plan);
  // 0 — khung: cột theo nhịp + dầm biên.
  b.floor(f, 0);
  for (const face of fs) {
    const len = Math.hypot(face.x1 - face.x0, face.z1 - face.z0);
    const bays = Math.max(1, Math.round(len / (opts.podium ? 0.42 : 0.36)));
    const ang = faceAngle(face);
    for (let i = 0; i < bays; i++) {
      const t = i / bays;
      const x = face.x0 + (face.x1 - face.x0) * t;
      const z = face.z0 + (face.z1 - face.z0) * t;
      const thick = i === 0 ? cornerT(variant) : MID_T;
      b.box(x, y, z, thick, h, thick, st.column, { tag: 'column' });
    }
    b.box((face.x0 + face.x1) / 2, y + h - 0.05, (face.z0 + face.z1) / 2, len, 0.05, 0.05, st.column, { ry: ang });
  }
  // 1 — sàn: bản sàn có độ dày, nhô khỏi mặt dựng một chút (mép sàn thấy được).
  b.floor(f, 1);
  const slabGrow = opts.podium ? 0.05 : 0.035;
  if (plan.chamfer > 0) {
    b.box(plan.cx, y + h - 0.055, plan.cz, plan.w + slabGrow * 2 - plan.chamfer * 0.6, 0.055, plan.d + slabGrow * 2, P.concrete.light, { tag: 'slab' });
    b.box(plan.cx, y + h - 0.055, plan.cz, plan.w + slabGrow * 2, 0.055, plan.d + slabGrow * 2 - plan.chamfer * 0.6, P.concrete.light, { tag: 'slab' });
  } else {
    b.box(plan.cx, y + h - 0.055, plan.cz, plan.w + slabGrow * 2, 0.055, plan.d + slabGrow * 2, P.concrete.light, { tag: 'slab' });
  }
  // 2 — mặt dựng: ô kính chia thanh, xen ô đặc / lam / ô mở.
  b.floor(f, 2);
  fs.forEach((face, fi) => {
    const len = Math.hypot(face.x1 - face.x0, face.z1 - face.z0);
    const bays = Math.max(1, Math.round(len / (opts.podium ? 0.42 : 0.36)));
    const ang = faceAngle(face);
    const [nx, nz] = outward(face);
    const bw = len / bays;
    for (let i = 0; i < bays; i++) {
      // Ô nằm GIỮA hai cột: trừ nửa bề dày cột mỗi bên (cột đầu mặt là cột góc, dày hơn),
      // để kính / ô đặc không xuyên vào cột.
      const gapL = (i === 0 ? cornerT(variant) : MID_T) / 2 + 0.006;
      const gapR = (i === bays - 1 ? cornerT(variant) : MID_T) / 2 + 0.006;
      const t = (i + 0.5) / bays + (gapL - gapR) / 2 / len;
      const pw2 = bw - gapL - gapR;
      const x = face.x0 + (face.x1 - face.x0) * t - nx * 0.012;
      const z = face.z0 + (face.z1 - face.z0) * t - nz * 0.012;
      const glassH = h - 0.075;
      if (opts.podium && opts.ground) {
        // Tầng trệt khối đế: kính cửa hàng cao, khung đậm.
        b.box(x, y, z, pw2, glassH, 0.03, i % 2 ? st.glassAlt : st.glass, { ry: ang, tag: 'glass' });
        b.box(x + nx * 0.02, y + glassH * 0.62, z + nz * 0.02, pw2, 0.025, 0.02, st.mullion, { ry: ang });
        continue;
      }
      const kind: Pattern = face.corner && variant === 'tower_twin' ? 'glass' : panel(variant, f, fi, i, bays, opts.tech, opts.phase);
      if (kind === 'solid') {
        b.box(x, y, z, pw2, glassH, 0.035, st.spandrel, { ry: ang, tag: 'glass' });
        b.box(x + nx * 0.02, y + glassH * 0.3, z + nz * 0.02, pw2 * 0.4, glassH * 0.4, 0.02, st.glassAlt, { ry: ang });
      } else if (kind === 'louver') {
        b.box(x, y, z, pw2, glassH, 0.02, P.steel.dark, { ry: ang, tag: 'glass' });
        for (let k = 0; k < 4; k++) b.box(x + nx * 0.035, y + 0.04 + k * (glassH / 4.2), z + nz * 0.035, pw2, 0.02, 0.03, st.mullion, { ry: ang });
      } else {
        const shade = (f + i) % 3 === 0 ? st.glassAlt : st.glass;
        b.box(x, y + 0.055, z, pw2, glassH - 0.055, 0.025, shade, { ry: ang, tag: 'glass' });
        // bậu dưới ô kính (spandrel mảnh) + thanh ngang giữa
        b.box(x, y, z, pw2, 0.055, 0.03, st.spandrel, { ry: ang });
        b.box(x + nx * 0.02, y + 0.055 + (glassH - 0.055) * 0.55, z + nz * 0.02, pw2, 0.014, 0.012, st.mullion, { ry: ang });
        if (kind === 'open') b.box(x + nx * 0.035, y + 0.07, z + nz * 0.035, pw2 * 0.45, (glassH - 0.055) * 0.5, 0.012, P.glass.night, { ry: ang });
      }
      // họ bo góc: lam đứng nhô ra theo nhịp
      if (variant === 'tower_rounded' && i % 2 === 0) b.box(face.x0 + (face.x1 - face.x0) * (i / bays) + nx * 0.05, y, face.z0 + (face.z1 - face.z0) * (i / bays) + nz * 0.05, 0.02, glassH, 0.07, st.mullion, { ry: ang });
    }
  });
  // 3 — mép tầng: dải bo mép / gờ đá, chỉ tầng kỹ thuật và khối đế có mép đậm.
  b.floor(f, 3);
  for (const face of fs) {
    const len = Math.hypot(face.x1 - face.x0, face.z1 - face.z0);
    const [nx, nz] = outward(face);
    const band = opts.tech || opts.podium ? 0.045 : 0.022;
    b.box((face.x0 + face.x1) / 2 + nx * 0.03, y + h - 0.075, (face.z0 + face.z1) / 2 + nz * 0.03, len + 0.02, band, 0.03, opts.tech ? st.accent : st.mullion, { ry: faceAngle(face) });
  }
}

function core(b: Builder, f: number, y: number, h: number, x: number, z: number) {
  b.coreAt(f).box(x, y, z, 0.62, h, 0.62, P.concrete.dark, { tag: 'core' });
}

function ring(b: Builder, f: number, y: number, h: number, plan: Plan) {
  b.ringAt(f);
  const o = 0.1;
  const x0 = plan.cx - plan.w / 2 - o;
  const x1 = plan.cx + plan.w / 2 + o;
  const z0 = plan.cz - plan.d / 2 - o;
  const z1 = plan.cz + plan.d / 2 + o;
  for (const [x, z] of [
    [x0, z0],
    [x1, z0],
    [x0, z1],
    [x1, z1],
    [(x0 + x1) / 2, z1],
    [x1, (z0 + z1) / 2],
  ] as const)
    b.box(x, y, z, 0.022, h, 0.022, P.construction.scaffoldPole);
  b.box((x0 + x1) / 2, y + h - 0.03, z1, x1 - x0, 0.022, 0.08, P.construction.scaffold);
  b.box(x1, y + h - 0.03, (z0 + z1) / 2, 0.08, 0.022, z1 - z0, P.construction.scaffold);
  b.box((x0 + x1) / 2, y + h - 0.03, z0, x1 - x0, 0.022, 0.08, P.construction.scaffold);
  b.box(x0, y + h - 0.03, (z0 + z1) / 2, 0.08, 0.022, z1 - z0, P.construction.scaffold);
}

/** Công đoạn 0–3 cho cao ốc: khu đất lớn, hố sâu, cọc nhồi + đài cọc. */
function towerSite(b: Builder, W: number, D: number, pw: number, pd: number, r: () => number) {
  const hw = pw / 2 + 0.08;
  const hd = pd / 2 + 0.08;
  const corners: [number, number][] = [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ];
  b.at(0, 0, 3);
  for (const [x, z] of corners) stake(b, x, z);
  b.at(0, 0, 2);
  for (let i = 0; i < 4; i++) rope(b, corners[i]![0], corners[i]![1], corners[(i + 1) % 4]![0], corners[(i + 1) % 4]![1]);
  b.at(0, 0, 8);
  projectSign(b, -W / 2 + 0.25, D / 2 - 0.15, 0.2);
  b.at(1, 0, 8).box(0, 0, 0, pw + 0.3, 0.02, pd + 0.3, P.terrain.dirt);
  b.at(1, 0, 8);
  toolbox(b, W / 2 - 0.2, D / 2 - 0.18);
  wheelbarrow(b, -W / 2 + 0.3, -D / 2 + 0.2, 0.3);
  b.at(2, 0, 4).box(0, 0.02, 0, pw, 0.012, pd, P.terrain.soilDark);
  for (const [x, z, w, d] of [
    [0, -hd, pw + 0.24, 0.1],
    [0, hd, pw + 0.24, 0.1],
    [-hw, 0, 0.1, pd],
    [hw, 0, 0.1, pd],
  ] as const)
    b.box(x, 0, z, w, 0.1, d, P.terrain.soil);
  b.at(2, 0, 8);
  soilPile(b, -W / 2 + 0.22, D / 2 - 0.5, 0.16);
  b.at(2, 0.5, 8);
  soilPile(b, W / 2 - 0.2, -D / 2 + 0.5, 0.2);
  // Cọc nhồi → đài cọc → bản móng.
  b.at(3, 0, 4);
  const nx = 3;
  const nz = 3;
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) b.cyl(-pw / 2 + 0.3 + (i * (pw - 0.6)) / (nx - 1), 0, -pd / 2 + 0.3 + (j * (pd - 0.6)) / (nz - 1), 0.07, 0.12, P.construction.concrete, { seg: 8 });
  b.at(3, 0.34, 4);
  for (let i = 0; i <= 6; i++) b.box(-pw / 2 + (i * pw) / 6, 0.08, 0, 0.014, 0.014, pd, P.construction.rebar);
  b.at(3, 0.67).box(0, 0, 0, pw + 0.1, BASE_Y, pd + 0.1, P.stone.dark);
  b.spot(3, -hw, 0.02, hd).spot(3, hw * 0.3, BASE_Y, 0);
  b.spot(0, -hw, 0, hd).spot(1, hw, 0, hd).spot(2, 0, 0.02, hd);
  void r;
}

/**
 * Sinh cao ốc. `floors` gồm cả tầng khối đế. Cùng (seed, floors, variant) →
 * cùng hình. Trả thêm thông tin cần cẩu và chiều cao để renderer dựng cần cẩu
 * cao dần theo tòa.
 */
export function generateTower(seed: number, floors: number, variant: TowerVariant, type: string = variant): ProcBuilding {
  const r = rng(seed * 104729 + variant.length * 17);
  const n = Math.max(6, floors);
  const podium = 1 + Math.floor(r() * 3);
  const phase = Math.floor(r() * 7);
  const st = style(variant, r);
  const b = new Builder();
  const twin = variant === 'tower_twin';
  const size: [number, number] = twin ? [4, 3] : [3, 3];
  const [W, D] = size;
  const pw = twin ? 3.5 : 2.5;
  const pd = twin ? 2.5 : 2.5;
  towerSite(b, W, D, pw, pd, r);

  // Mặt bằng từng tầng theo họ.
  const setA = podium + Math.floor((n - podium) * (0.45 + r() * 0.1));
  const setB = podium + Math.floor((n - podium) * (0.72 + r() * 0.08));
  const shafts = (f: number): Plan[] => {
    if (f < podium) return [{ cx: 0, cz: 0, w: pw, d: pd, chamfer: 0 }];
    switch (variant) {
      case 'tower_stepped': {
        const s = f < setA ? 2.2 : f < setB ? 1.8 : 1.4;
        return [{ cx: 0, cz: -0.1, w: s, d: s, chamfer: 0 }];
      }
      case 'tower_rounded':
        return [{ cx: 0, cz: -0.05, w: 2.05, d: 2.05, chamfer: 0.42 }];
      case 'tower_twin': {
        const tall = n;
        const short = Math.max(podium + 4, Math.round(n * 0.72));
        const out: Plan[] = [];
        if (f < tall) out.push({ cx: -0.85, cz: -0.1, w: 1.45, d: 1.5, chamfer: 0 });
        if (f < short) out.push({ cx: 0.95, cz: -0.1, w: 1.25, d: 1.35, chamfer: 0 });
        return out;
      }
      default: {
        // Thu dần; hai tầng quan sát trên cùng nhô ra.
        const t = (f - podium) / Math.max(1, n - podium - 1);
        if (f >= n - 2) return [{ cx: 0, cz: 0, w: 2.35, d: 2.35, chamfer: 0.55 }];
        const s = 2.0 - t * 0.7;
        return [{ cx: 0, cz: 0, w: s, d: s, chamfer: 0 }];
      }
    }
  };

  const techFloors = new Set([podium + Math.floor((n - podium) / 2), n - 1]);
  let top = BASE_Y;
  for (let f = 0; f < n; f++) {
    const isPodium = f < podium;
    const h = isPodium ? FLOOR_H * 1.25 : FLOOR_H;
    const y = BASE_Y + (f < podium ? f * FLOOR_H * 1.25 : podium * FLOOR_H * 1.25 + (f - podium) * FLOOR_H);
    const plans = shafts(f);
    // Lõi thang máy (đi trước sàn một tầng).
    if (twin) {
      if (!isPodium) plans.forEach((p) => core(b, f, y, h, p.cx, p.cz));
      else {
        core(b, f, y, h, -0.85, -0.1);
        core(b, f, y, h, 0.95, -0.1);
      }
    } else core(b, f, y, h, 0, isPodium ? 0 : plans[0]!.cz);
    for (const plan of plans) {
      floorOf(b, variant, st, plan, f, y, h, { tech: !isPodium && techFloors.has(f), podium: isPodium, phase, ground: f === 0 });
      ring(b, f, y, h, plan);
    }
    // Sân lùi có lan can khi thân thu hẹp (bậc thang) hoặc trên nóc khối đế.
    const next = f + 1 < n ? shafts(f + 1) : [];
    for (const plan of plans) {
      const above = next.find((q) => Math.abs(q.cx - plan.cx) < 0.3);
      if (!above || above.w < plan.w - 0.15) {
        b.floor(f, 3);
        const rail = y + h;
        const x0 = plan.cx - plan.w / 2 + 0.02;
        const x1 = plan.cx + plan.w / 2 - 0.02;
        const z0 = plan.cz - plan.d / 2 + 0.02;
        const z1 = plan.cz + plan.d / 2 - 0.02;
        if (above) {
          b.box((x0 + x1) / 2, rail, z1, x1 - x0, 0.09, 0.015, P.steel.dark);
          b.box(x1, rail, (z0 + z1) / 2, 0.015, 0.09, z1 - z0, P.steel.dark);
          b.box(x0, rail, (z0 + z1) / 2, 0.015, 0.09, z1 - z0, P.steel.dark);
          b.box((x0 + x1) / 2, rail, z0, x1 - x0, 0.09, 0.015, P.steel.dark);
        }
      }
    }
    // Tháp đôi: cầu nối trên cao giữa hai thân (khe hở vẫn thấy rõ trên/dưới cầu).
    if (twin && f === Math.round(n * 0.55) && plans.length === 2) {
      // Cầu vừa khít khe giữa hai cột góc (thân trái kết thúc ở x = -0.125, thân phải bắt đầu ở 0.325).
      const gapL = -0.125 + cornerT(variant) / 2 + 0.005;
      const gapR = 0.325 - cornerT(variant) / 2 - 0.005;
      b.floor(f, 3).box((gapL + gapR) / 2, y + 0.06, -0.1, gapR - gapL, FLOOR_H * 0.75, 0.5, st.glassAlt, { tag: 'glass' });
      b.box((gapL + gapR) / 2, y + 0.005, -0.1, gapR - gapL, 0.05, 0.56, P.concrete.light);
    }
    top = y + h;
  }

  // 6 — cất nóc: tầng kỹ thuật trên mái + đỉnh riêng từng họ.
  const roofPlans = shafts(n - 1);
  b.at(6, 0);
  for (const p of roofPlans) {
    b.box(p.cx, top, p.cz, p.w * 0.94, 0.06, p.d * 0.94, P.concrete.dark);
    b.box(p.cx - p.w * 0.2, top + 0.06, p.cz, p.w * 0.35, 0.16, p.d * 0.35, P.steel.light);
    b.box(p.cx + p.w * 0.22, top + 0.06, p.cz + p.d * 0.2, 0.16, 0.12, 0.16, P.steel.grey);
  }
  b.at(6, 0.4);
  for (const p of roofPlans) {
    const x0 = p.cx - p.w / 2;
    const x1 = p.cx + p.w / 2;
    const z0 = p.cz - p.d / 2;
    const z1 = p.cz + p.d / 2;
    b.box(p.cx, top, z1, p.w, 0.12, 0.03, st.column);
    b.box(p.cx, top, z0, p.w, 0.12, 0.03, st.column);
    b.box(x0, top, p.cz, 0.03, 0.12, p.d, st.column);
    b.box(x1, top, p.cz, 0.03, 0.12, p.d, st.column);
  }
  b.at(6, 0.7);
  const main = roofPlans[0]!;
  let height = top + 0.3;
  if (variant === 'tower_stepped') {
    b.add({ shape: 'pyr', p: [main.cx, top + 0.12, main.cz], s: [main.w * 0.8, 0.7, main.d * 0.8], c: st.glassAlt, tag: 'glass' });
    b.cyl(main.cx, top + 0.82, main.cz, 0.02, 0.4, P.steel.light, { seg: 6 });
    b.sphere(main.cx, top + 1.22, main.cz, 0.05, '#FF5A4A', { glow: true });
    height = top + 1.3;
  } else if (variant === 'tower_rounded') {
    b.cyl(main.cx, top + 0.12, main.cz, main.w * 0.46, 0.34, st.glass, { seg: 16, taper: 0.92, tag: 'glass' });
    b.cyl(main.cx, top + 0.46, main.cz, main.w * 0.44, 0.05, st.column, { seg: 16 });
    b.cyl(main.cx + 0.2, top + 0.5, main.cz, 0.025, 0.9, P.steel.light, { seg: 6 });
    b.sphere(main.cx + 0.2, top + 1.4, main.cz, 0.05, '#FF5A4A', { glow: true });
    height = top + 1.45;
  } else if (twin) {
    for (const p of roofPlans) {
      b.add({ shape: 'hip', p: [p.cx, top + 0.12, p.cz], s: [p.w * 0.9, 0.3, p.d * 0.9], c: st.column });
      b.sphere(p.cx, top + 0.45, p.cz, 0.045, '#FF5A4A', { glow: true });
    }
    // Thân thấp cũng có đỉnh + đèn.
    const shortTop = BASE_Y + podium * FLOOR_H * 1.25 + (Math.max(podium + 4, Math.round(n * 0.72)) - podium) * FLOOR_H;
    b.add({ shape: 'hip', p: [0.95, shortTop, -0.1], s: [1.2, 0.26, 1.3], c: st.column });
    b.box(0.95, shortTop, -0.1, 1.2, 0.08, 1.3, P.concrete.dark);
    b.sphere(0.95, shortTop + 0.3, -0.1, 0.045, '#FF5A4A', { glow: true });
    height = top + 0.5;
  } else {
    b.cyl(main.cx, top + 0.12, main.cz, 0.5, 0.2, st.column, { seg: 12, taper: 0.6 });
    b.cyl(main.cx, top + 0.32, main.cz, 0.12, 1.5, P.steel.light, { seg: 8, taper: 0 });
    b.sphere(main.cx, top + 1.3, main.cz, 0.06, '#FF5A4A', { glow: true });
    height = top + 1.85;
  }

  // 7 — hoàn thiện chân tòa: mái che sảnh, cửa xoay, biển tên, đèn.
  b.at(7, 0);
  const front = pd / 2;
  b.box(0, BASE_Y + FLOOR_H * 1.0, front + 0.2, 1.0, 0.05, 0.42, st.column);
  b.box(-0.45, BASE_Y, front + 0.38, 0.04, FLOOR_H * 1.0, 0.04, st.column);
  b.box(0.45, BASE_Y, front + 0.38, 0.04, FLOOR_H * 1.0, 0.04, st.column);
  b.box(0, BASE_Y, front + 0.012, 0.36, FLOOR_H * 0.85, 0.03, P.glass.night, { tag: 'door' });
  b.cyl(0, BASE_Y, front + 0.05, 0.14, FLOOR_H * 0.85, st.glassAlt, { seg: 10 });
  b.at(7, 0.5);
  b.box(0, BASE_Y + FLOOR_H * 1.05, front + 0.42, 0.8, 0.1, 0.03, st.accent);
  b.box(0, BASE_Y + FLOOR_H * 1.07, front + 0.437, 0.6, 0.05, 0.005, P.accent.signText);
  for (const x of [-pw / 2 + 0.3, pw / 2 - 0.3]) b.box(x, BASE_Y + 0.25, front + 0.03, 0.22, 0.08, 0.02, pick(P.accent.awning, r));
  // 8 — cảnh quan: sân lát, bồn cây, ghế, đèn, lối ra đường.
  b.at(8, 0);
  b.box(0, 0, D / 2 - 0.2, W - 0.1, 0.02, 0.4, P.stone.paving);
  b.box(0, 0.02, D / 2 - 0.2, 0.9, 0.02, 0.4, P.stone.light);
  b.at(8, 0.3);
  for (const x of [-W / 2 + 0.25, W / 2 - 0.25]) {
    b.box(x, 0.02, D / 2 - 0.22, 0.28, 0.1, 0.28, P.stone.mid);
    treeRound(b, x, D / 2 - 0.22, 0.75, r, 0.12);
  }
  b.at(8, 0.6);
  bench(b, -0.8, D / 2 - 0.1, 0);
  streetLamp(b, 0.75, D / 2 - 0.12, 0.02, 0.7);
  streetLamp(b, -W / 2 + 0.15, -D / 2 + 0.15, 0, 0.7);

  const crane: Crane = { x: W / 2 - 0.12, z: -D / 2 + 0.12, ry: Math.PI * 0.75, jib: twin ? 2.9 : 2.3 };
  b.anchor('door', 0.6, BASE_Y, front + 0.5).anchor('yard', -0.9, 0.02, D / 2 - 0.25);
  return {
    type,
    seed,
    size,
    parts: b.parts,
    anchors: b.anchors,
    height,
    tower: { floors: n, floorH: FLOOR_H, baseY: BASE_Y, podium, crane, footprint: [pw, pd] },
    workSpots: b.workSpots,
  };
}

/** Cao độ mặt sàn đã có sàn (chỗ công nhân được đứng) khi đã xong `floorsDone` tầng + `floorStep` bước. */
export function workLevel(t: NonNullable<ProcBuilding['tower']>, floorsDone: number, floorStep: number): number {
  const f = floorStep >= 2 ? floorsDone + 1 : floorsDone;
  const pod = Math.min(f, t.podium);
  return t.baseY + pod * t.floorH * 1.25 + Math.max(0, f - t.podium) * t.floorH;
}

/** Chiều cao cần cẩu: cao hơn tầng đang xây ~3 tầng, không vượt đỉnh + 0.8. */
export function craneHeight(b: ProcBuilding, floorsDone: number): number {
  const t = b.tower!;
  const current = workLevel(t, floorsDone, 0);
  return Math.min(b.height + 0.8, current + t.floorH * 3 + 0.6);
}
