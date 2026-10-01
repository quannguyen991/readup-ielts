/**
 * VẬT THỂ BAY của "Bay qua thành phố" — tám nhân vật vẽ bằng code (pixel-art,
 * không dùng ảnh ngoài): máy bay, khinh khí cầu, siêu nhân áo choàng (nhân vật
 * tự thiết kế, không phải hình của bộ truyện nào), kỳ lân có cánh, rồng hiền,
 * tên lửa, đĩa bay và thảm bay.
 *
 * Mỗi nhân vật là một hàm vẽ lên lưới điểm ảnh `SW×SH`, quay mặt sang PHẢI
 * (cảnh trôi sang trái). Có `FLYER_FRAMES` khung (vỗ cánh, phi nước đại, lửa
 * chập chờn). Sau khi vẽ, một bước chung lo: viền tối 1 điểm ảnh quanh hình,
 * tuyết đọng ở mép trên, ánh nước ở mép trên khi mưa. Đèn (cửa sổ, lửa, đèn
 * UFO) không bị nhuộm màu buổi tối để ban đêm vẫn sáng.
 *
 * Hiệu ứng động ngoài hình (vệt khói, cầu vồng, tia sáng) do `scene.ts` vẽ,
 * toạ độ gắn ở `FLYER_META`.
 */

export type FlyerId = 'plane' | 'balloon' | 'hero' | 'unicorn' | 'dragon' | 'rocket' | 'ufo' | 'carpet';

export const FLYERS: readonly { id: FlyerId; vi: string; en: string; emoji: string }[] = [
  { id: 'plane', vi: 'Máy bay', en: 'Airplane', emoji: '✈️' },
  { id: 'balloon', vi: 'Khinh khí cầu', en: 'Balloon', emoji: '🎈' },
  { id: 'hero', vi: 'Siêu nhân', en: 'Caped hero', emoji: '🦸' },
  { id: 'unicorn', vi: 'Kỳ lân', en: 'Unicorn', emoji: '🦄' },
  { id: 'dragon', vi: 'Rồng hiền', en: 'Dragon', emoji: '🐉' },
  { id: 'rocket', vi: 'Tên lửa', en: 'Rocket', emoji: '🚀' },
  { id: 'ufo', vi: 'Đĩa bay', en: 'Saucer', emoji: '🛸' },
  { id: 'carpet', vi: 'Thảm bay', en: 'Carpet', emoji: '🧞' },
];

export function isFlyerId(x: unknown): x is FlyerId {
  return typeof x === 'string' && FLYERS.some((f) => f.id === x);
}

export function flyerById(id: string | null | undefined): (typeof FLYERS)[number] {
  return FLYERS.find((f) => f.id === id) ?? FLYERS[0]!;
}

export const SW = 72;
export const SH = 56;
export const FLYER_FRAMES = 4;

type Trail = 'contrail' | 'smoke' | 'rainbow' | 'sparkle' | 'streak' | 'ember' | 'beam' | 'none';
export type FlyerMeta = {
  /** Khung hình mỗi giây của hoạt cảnh (vỗ cánh, lửa…). */
  fps: number;
  trail: Trail;
  /** Nơi vệt bắt đầu, toạ độ trong sprite. */
  at: { x: number; y: number };
  /** Quầng sáng ban đêm. */
  glow?: { x: number; y: number; r: number; c: string };
  /** Biên độ nhún lên xuống (điểm ảnh). */
  bob: number;
};

export const FLYER_META: Record<FlyerId, FlyerMeta> = {
  plane: { fps: 8, trail: 'contrail', at: { x: 29, y: 40 }, bob: 1.6 },
  balloon: { fps: 6, trail: 'ember', at: { x: 36, y: 33 }, glow: { x: 36, y: 33, r: 22, c: '255,190,90' }, bob: 2.6 },
  hero: { fps: 5, trail: 'streak', at: { x: 8, y: 29 }, bob: 2.2 },
  unicorn: { fps: 7, trail: 'rainbow', at: { x: 7, y: 33 }, glow: { x: 61, y: 6, r: 12, c: '255,230,150' }, bob: 2 },
  dragon: { fps: 7, trail: 'ember', at: { x: 62, y: 25 }, bob: 2 },
  rocket: { fps: 10, trail: 'smoke', at: { x: 4, y: 28 }, glow: { x: 6, y: 28, r: 24, c: '255,150,60' }, bob: 1.4 },
  ufo: { fps: 6, trail: 'beam', at: { x: 36, y: 38 }, glow: { x: 36, y: 40, r: 26, c: '150,255,190' }, bob: 2.4 },
  carpet: { fps: 5, trail: 'sparkle', at: { x: 6, y: 36 }, bob: 2.2 },
};

// ------------------------------------------------------------------ màu

function hexRgb(h: string): [number, number, number] {
  const v = parseInt(h.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function mixHex(a: string, b: string, t: number): string {
  const x = hexRgb(a);
  const y = hexRgb(b);
  const c = (i: number) => Math.round(x[i]! + (y[i]! - x[i]!) * t);
  return '#' + [c(0), c(1), c(2)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
/** Sáng (lvl 1) / tối (lvl -1) hơn màu gốc — bóng đổ kiểu pixel-art 3 tông. */
const tone = (c: string, lvl: number) => (lvl > 0 ? mixHex(c, '#FFFFFF', 0.3) : lvl < 0 ? mixHex(c, '#1A2240', 0.24) : c);

export type FlyerOpts = {
  /** Nhuộm màu theo buổi / thời tiết (hàm của cảnh). */
  tint: (c: string) => string;
  /** Ban đêm / trời tối: bật đèn. */
  lit: boolean;
  rain: boolean;
  snow: boolean;
  outline: string;
};

type Col = string | ((x: number, y: number, lvl: number) => string);

/** Bảng điểm ảnh nhỏ: vẽ khối, elip, đa giác, đường thẳng — mọi toạ độ cộng thêm (dx, dy). */
class PX {
  d: (string | null)[] = new Array(SW * SH).fill(null);
  dx = 0;
  dy = 0;
  constructor(private o: FlyerOpts) {}

  private put(x: number, y: number, c: string, raw = false) {
    x = Math.round(x + this.dx);
    y = Math.round(y + this.dy);
    if (x < 0 || y < 0 || x >= SW || y >= SH) return;
    this.d[y * SW + x] = raw ? c : this.o.tint(c);
  }
  get(x: number, y: number) {
    x = Math.round(x + this.dx);
    y = Math.round(y + this.dy);
    return x < 0 || y < 0 || x >= SW || y >= SH ? null : this.d[y * SW + x]!;
  }
  px(x: number, y: number, c: string) {
    this.put(x, y, c);
  }
  /** Điểm sáng (không nhuộm màu buổi). */
  lamp(x: number, y: number, w: number, h: number, c: string) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, c, true);
  }
  rect(x: number, y: number, w: number, h: number, c: string) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, c);
  }
  /** Chỉ tô lại những điểm đã có hình (dải sọc, vân). */
  recolor(x: number, y: number, w: number, h: number, c: string) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) if (this.get(x + i, y + j)) this.put(x + i, y + j, c);
  }
  ell(cx: number, cy: number, rx: number, ry: number, c: Col, clip = false) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const ex = (x + 0.5 - cx) / rx;
        const ey = (y + 0.5 - cy) / ry;
        if (ex * ex + ey * ey > 1) continue;
        if (clip && !this.get(x, y)) continue;
        const sx = (x + 0.5 - (cx - rx * 0.22)) / rx;
        const sy = (y + 0.5 - (cy - ry * 0.3)) / ry;
        const dd = sx * sx + sy * sy;
        const lvl = dd > 1 ? -1 : dd < 0.16 && rx > 4 ? 1 : 0;
        this.put(x, y, typeof c === 'function' ? c(x, y, lvl) : tone(c, lvl));
      }
  }
  poly(pts: [number, number][], c: Col, lvl = 0) {
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const p of pts) {
      y0 = Math.min(y0, p[1]);
      y1 = Math.max(y1, p[1]);
    }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const yy = y + 0.5;
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]!;
        const b = pts[(i + 1) % pts.length]!;
        if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) xs.push(a[0] + ((yy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2)
        for (let x = Math.ceil(xs[i]! - 0.5); x <= Math.floor(xs[i + 1]! - 0.5); x++) this.put(x, y, typeof c === 'function' ? c(x, y, lvl) : tone(c, lvl));
    }
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string, w = 1) {
    const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const y = y0 + ((y1 - y0) * i) / n;
      for (let j = 0; j < w; j++) for (let k = 0; k < w; k++) this.put(x + j, y + k, c);
    }
  }
}

const hash2 = (x: number, y: number) => (Math.imul(x + 17, 73856093) ^ Math.imul(y + 31, 19349663)) >>> 0;

// ------------------------------------------------------------------ từng nhân vật

const GOLD = '#F2B33D';
const NAVY = '#24385E';
const CREAM = '#FFF1C9';
const SKIN = '#F4C9A4';
const RED = '#E4574A';
const BLUE = '#3C7BE0';
const RAINBOW = ['#FF5C8A', '#FFA24C', '#FFD84A', '#5BD68A', '#4FB0FF', '#A57BF2'];

function plane(p: PX, f: number, o: FlyerOpts) {
  const flex = Math.round(Math.sin((f * Math.PI) / 2));
  p.dy = 2;
  // Cánh xa + đuôi ngang xa (tối hơn, ló lên sau thân).
  p.poly([[36, 22], [41, 12], [47, 12], [46, 22]], '#A9B7CC');
  p.poly([[12, 22], [7, 16], [12, 16], [18, 22]], '#A9B7CC');
  // Đuôi đứng (vàng).
  p.poly([[11, 23], [4, 6], [12, 6], [23, 22]], GOLD);
  p.poly([[11, 23], [9, 14], [12, 14], [18, 22]], GOLD, -1);
  // Thân.
  p.ell(34, 28, 27, 8, '#F6F8FC');
  p.recolor(15, 32, 38, 2, BLUE);
  p.recolor(58, 27, 2, 3, '#DCE4F0');
  // Kính buồng lái + cửa sổ.
  p.rect(54, 23, 4, 3, '#3E5C86');
  p.px(55, 23, '#7FA4D2');
  for (let x = 20; x <= 50; x += 4) p.lamp(x, 24, 2, 2, o.lit ? '#FFE9A0' : '#5B7BA6');
  // Cánh gần quét ra sau + động cơ.
  p.poly([[34, 31], [22, 48 + flex], [30, 48 + flex], [46, 32]], '#E6ECF5');
  p.poly([[34, 31], [22, 48 + flex], [25, 48 + flex], [36, 31]], '#E6ECF5', 1);
  p.ell(31, 40 + flex * 0.5, 4.5, 2.8, '#8C9AB0');
  p.rect(26, 39 + Math.round(flex * 0.5), 1, 2, '#5C6A80');
  // Đuôi ngang gần.
  p.poly([[12, 29], [3, 37], [8, 37], [19, 30]], '#E6ECF5');
  if (o.lit) p.lamp(22, 48 + flex, 2, 1, f % 2 ? '#FF5A5A' : '#8A2A2A');
  if (o.lit) p.lamp(7, 36, 1, 1, f % 2 ? '#8A2A2A' : '#FFFFFF');
}

function balloon(p: PX, f: number, o: FlyerOpts) {
  const bands = [RED, CREAM, GOLD, '#2E7BD6'];
  const stripe = (x: number, _y: number, l: number) => {
    const b = bands[Math.floor((x - 18) / 6.4 + 40) % 4]!;
    return tone(b, l);
  };
  p.dy = 3;
  p.ell(36, 15, 17, 15, stripe);
  p.poly(
    [[22, 24], [50, 24], [43, 34], [29, 34]],
    (x, _y) => tone(bands[Math.floor((x - 18) / 6.4 + 40) % 4]!, x > 40 ? -1 : 0),
  );
  // Đai trang trí quanh bụng khí cầu.
  p.recolor(21, 22, 30, 1, '#FFFFFF');
  // Dây + giỏ.
  const rope = '#5A4026';
  p.line(30, 34, 32, 40, rope);
  p.line(42, 34, 40, 40, rope);
  p.line(36, 35, 36, 40, rope);
  p.rect(33, 35, 6, 2, '#6B7280');
  p.rect(30, 40, 12, 2, '#8A5A2B');
  p.rect(31, 42, 10, 7, '#BF8444');
  for (let y = 43; y < 49; y += 2) for (let x = 31 + (y % 4 === 1 ? 1 : 0); x < 41; x += 2) p.px(x, y, '#8F5F2E');
  p.rect(31, 48, 10, 1, '#7A4F24');
  // Ngọn lửa đốt.
  const fl = [0, 1, 2, 1][f]!;
  p.lamp(35, 31 - fl, 2, 4 + fl, '#FF9A3C');
  p.lamp(35, 32 - fl, 1, 3 + fl, '#FFE27A');
  void o;
}

function hero(p: PX, f: number) {
  const ph = (f * Math.PI) / 2;
  const TEAL = '#25B3C2';
  const CAPE = '#F2653B';
  p.dy = 3;
  // Áo choàng: dải cam bay sau lưng, thon dần về phía sau, uốn sóng.
  const top: [number, number][] = [];
  const bot: [number, number][] = [];
  const mid: [number, number][] = [];
  for (let x = 42; x >= 3; x -= 3) {
    const d = 42 - x;
    const wv = Math.sin(ph + d * 0.3) * (0.4 + d * 0.12);
    const half = 7.2 - d * 0.1;
    const m = 24 + d * 0.03 + wv;
    top.push([x, m - half]);
    bot.push([x, m + half]);
    mid.push([x, m]);
  }
  p.poly([...top, ...[...bot].reverse()], CAPE);
  p.poly([...mid, ...[...bot].reverse()], CAPE, -1);
  for (let i = 0; i + 1 < bot.length; i++) p.line(bot[i]![0], bot[i]![1], bot[i + 1]![0], bot[i + 1]![1], GOLD);
  // Chân (xa tối hơn, đá nhẹ theo nhịp) + ủng.
  const s = Math.round(Math.sin(ph + 1) * 1.5);
  const k = Math.round(Math.sin(ph) * 1);
  p.poly([[28, 31], [9, 34 + s], [9, 39 + s], [28, 37]], TEAL, -1);
  p.rect(4, 33 + s, 6, 6, tone(NAVY, -1));
  p.poly([[28, 29], [9, 29 + k], [9, 34 + k], [28, 34]], TEAL);
  p.rect(4, 28 + k, 6, 6, NAVY);
  p.rect(4, 28 + k, 6, 1, '#4A5F8C');
  // Thân + thắt lưng vàng.
  p.ell(37, 27, 14, 8, TEAL);
  p.recolor(33, 20, 2, 16, GOLD);
  // Tay phải duỗi thẳng phía trước (dưới cằm) + găng kem.
  p.poly([[43, 26], [60, 25], [60, 30], [46, 32]], TEAL);
  p.recolor(55, 25, 1, 5, tone(TEAL, -1));
  p.ell(63, 27.5, 3.5, 3.5, CREAM);
  // Đầu: mặt, mũ bay xanh đậm, kính vàng.
  p.ell(52, 17.5, 7, 7, SKIN);
  p.ell(51, 13.5, 7.2, 3.8, NAVY);
  p.rect(45, 15, 5, 2, NAVY);
  p.rect(55, 16, 5, 4, GOLD);
  p.rect(56, 17, 3, 2, '#A8E8FA');
  p.px(56, 17, '#FFFFFF');
  p.px(57, 22, '#C98A6A');
  p.rect(56, 23, 2, 1, '#B8605A');
  p.px(46, 18, '#7A4A2A');
  p.px(46, 19, '#7A4A2A');
}

function unicorn(p: PX, f: number) {
  const ph = (f * Math.PI) / 2;
  p.dy = 4;
  const HOOF = '#FFB8D2';
  // Cánh (sau cùng, vỗ lên xuống).
  const wingA = [-132, -98, -62, -98][f]! * (Math.PI / 180);
  const sh: [number, number] = [31, 25];
  const feathers: [number, number][] = [
    [-0.55, 20],
    [-0.2, 24],
    [0.15, 23],
    [0.5, 18],
  ];
  const wingCol = '#F6F1FF';
  const tips: [number, number][] = [];
  for (const [da, len] of feathers) {
    const a = wingA + da;
    tips.push([sh[0] + Math.cos(a) * len, sh[1] + Math.sin(a) * len]);
  }
  // Màng cánh tròn trịa (nối các đầu lông) rồi vạch lông sáng / tối.
  p.poly([[sh[0] - 3, sh[1] + 3], ...tips, [sh[0] + 5, sh[1] + 3]], wingCol);
  p.poly([[sh[0], sh[1]], tips[2]!, tips[3]!, [sh[0] + 5, sh[1] + 3]], '#E3DAFA');
  for (const t of tips) p.line(sh[0] + 1, sh[1], t[0] + (sh[0] - t[0]) * 0.18, t[1] + (sh[1] - t[1]) * 0.18, '#D3C7F2');
  p.ell(31, 25, 6, 4, wingCol);
  // Chân xa (tối).
  const FDX = [7, 4, -2, 3];
  const BDX = [-7, -4, 2, -3];
  const FDY = [0, -1, -3, -1];
  const limb = (x0: number, y0: number, x1: number, y1: number, far: boolean) => {
    p.line(x0, y0, x1, y1, tone('#FFF6FA', far ? -1 : 0), 3);
    p.rect(Math.round(x1) - 1, Math.round(y1) + 2, 4, 2, far ? tone(HOOF, -1) : HOOF);
  };
  limb(41, 34, 41 + FDX[(f + 2) % 4]!, 43 + FDY[(f + 2) % 4]!, true);
  limb(27, 34, 27 + BDX[(f + 2) % 4]!, 43 + FDY[(f + 3) % 4]!, true);
  // Thân, cổ, đầu.
  p.ell(34, 29, 15, 8, '#FFF6FA');
  p.poly([[43, 26], [48, 12], [57, 14], [53, 31], [44, 35]], '#FFF6FA');
  p.ell(57, 14.5, 6.2, 4.4, '#FFF6FA');
  p.ell(61.5, 16.5, 3.2, 2.6, '#FFD3E2');
  p.px(63, 16, '#B05A7A');
  p.rect(57, 12, 1, 2, '#2B2140');
  p.px(58, 12, '#FFFFFF');
  p.px(58, 16, '#FFA6C4');
  p.poly([[52, 10], [53, 3], [57, 9]], '#FFF6FA');
  p.px(54, 7, '#FFA6C4');
  // Sừng vàng xoắn.
  p.poly([[57, 9], [64, -2], [61, 10]], '#FFD66B');
  p.px(61, 4, '#FFF3B0');
  p.px(62, 1, '#FFF3B0');
  p.px(60, 7, '#E0A83A');
  // Bờm cầu vồng bay phấp phới dọc cổ.
  for (let i = 0; i < 10; i++) {
    const t = i / 9;
    const x = 50 - t * 7 - 2 - Math.sin(ph + i * 0.7) * 1.4;
    const y = 8 + t * 17;
    p.rect(x, y, 4, 2, RAINBOW[i % RAINBOW.length]!);
  }
  // Đuôi cầu vồng.
  for (let i = 0; i < 9; i++) {
    const x = 21 - i * 1.7;
    const y = 28 + Math.sin(ph + i * 0.7) * 2 + i * 0.5;
    p.rect(x, y, 3, 3, RAINBOW[(i + 2) % RAINBOW.length]!);
  }
  // Chân gần.
  limb(42, 35, 42 + FDX[f]!, 44 + FDY[f]!, false);
  limb(26, 35, 26 + BDX[f]!, 44 + FDY[(f + 1) % 4]!, false);
}

function dragon(p: PX, f: number, o: FlyerOpts) {
  const ph = (f * Math.PI) / 2;
  const G = '#5FC48C';
  const G2 = '#7FD6A4';
  p.dy = 3;
  p.dx = 4;
  // Cánh dơi (sau lưng), vỗ.
  const a = [-128, -96, -60, -96][f]! * (Math.PI / 180);
  const r0: [number, number] = [28, 26];
  const r1: [number, number] = [39, 26];
  const spokes = [-0.7, -0.05, 0.6];
  const lens = [18, 24, 19];
  const pts: [number, number][] = [r0];
  spokes.forEach((da, i) => {
    const an = a + da;
    pts.push([r0[0] + Math.cos(an) * lens[i]!, r0[1] + Math.sin(an) * lens[i]!]);
    if (i < spokes.length - 1) {
      const mid = a + (da + spokes[i + 1]!) / 2;
      pts.push([r0[0] + Math.cos(mid) * lens[i]! * 0.74, r0[1] + Math.sin(mid) * lens[i]! * 0.74]);
    }
  });
  pts.push(r1);
  p.poly(pts, '#F5A468');
  for (let i = 0; i < spokes.length; i++) p.line(r0[0] + 4, r0[1], r0[0] + 4 + Math.cos(a + spokes[i]!) * lens[i]! * 0.92, r0[1] + Math.sin(a + spokes[i]!) * lens[i]! * 0.92, '#D9783E');
  // Đuôi cong có mũi.
  for (let i = 0; i < 8; i++) {
    const x = 22 - i * 1.6;
    const y = 33 + Math.sin(ph + i * 0.5) * 1.5 + i * 0.8;
    const r = 5 - i * 0.4;
    p.ell(x, y, Math.max(1.5, r), Math.max(1.5, r * 0.88), G);
  }
  p.poly([[6, 43], [4, 37], [12, 40], [10, 45]], GOLD);
  // Chân sau xa, thân, bụng, chân trước.
  p.ell(28, 40, 3.4, 4, tone(G, -1));
  p.ell(35, 30, 14, 9, G);
  p.ell(37, 35, 10, 5, CREAM, true);
  for (let i = 0; i < 4; i++) p.recolor(30 + i * 3, 33 + (i % 2) * 2, 2, 1, '#EAD79A');
  p.ell(40, 40.5, 3.6, 4, G);
  p.ell(27, 40.5, 3.6, 4, G);
  p.rect(25, 43, 5, 1, CREAM);
  p.rect(38, 43, 5, 1, CREAM);
  // Gai lưng vàng.
  for (const x of [21, 26, 31, 36, 41]) {
    const ty = 30 - 9 * Math.sqrt(Math.max(0, 1 - ((x - 35) / 14) ** 2));
    p.poly([[x - 2, ty + 1.5], [x, ty - 3], [x + 2, ty + 1.5]], GOLD);
  }
  // Cổ + đầu + mõm.
  p.poly([[43, 28], [49, 17], [57, 21], [52, 34]], G);
  p.ell(54, 21.5, 8, 6.2, G);
  p.ell(61, 24, 4.6, 3.3, G2);
  p.px(64, 23, '#2B3A33');
  p.px(63, 23, '#2B3A33');
  p.rect(57, 18, 3, 3, '#FFFFFF');
  p.rect(58, 19, 2, 2, '#2B2140');
  p.px(58, 19, '#FFFFFF');
  p.rect(58, 25, 2, 1, '#FF9FB5');
  p.px(60, 26, '#C0405A');
  // Sừng kem.
  p.poly([[49, 16], [48, 8], [53, 15]], CREAM);
  p.poly([[55, 15], [57, 8], [59, 16]], CREAM);
  void o;
}

function rocket(p: PX, f: number) {
  p.dy = 3;
  p.dx = 5;
  // Lửa phụt.
  const len = [11, 14, 9, 13][f]!;
  p.lamp(12 - len, 25, len, 6, '#FF8A3C');
  p.poly([[12, 24], [12 - len, 28], [12, 32]], '#FF8A3C');
  p.lamp(12 - Math.round(len * 0.7), 26, Math.round(len * 0.7), 4, '#FFE27A');
  p.lamp(12 - Math.round(len * 0.35), 27, Math.round(len * 0.35), 2, '#FFFFFF');
  // Vòi phun.
  p.rect(12, 23, 5, 10, '#6B7280');
  p.rect(12, 23, 5, 1, '#8A93A3');
  // Cánh đuôi (sau thân).
  p.poly([[15, 22], [12, 8], [19, 8], [30, 21]], RED);
  p.poly([[15, 34], [12, 48], [19, 48], [30, 35]], RED, -1);
  // Thân + mũi.
  p.ell(35, 28, 21, 9.5, '#F6F8FC');
  p.poly([[47, 19], [64, 28], [47, 37]], RED);
  p.poly([[47, 19], [64, 28], [56, 28], [47, 24]], RED, 1);
  p.recolor(25, 19, 2, 19, NAVY);
  p.recolor(28, 19, 1, 19, RED);
  // Cửa sổ tròn.
  p.ell(39, 27, 4.8, 4.8, '#2E4A86');
  p.ell(39, 27, 3.2, 3.2, '#8FD3F2');
  p.px(37, 25, '#FFFFFF');
  p.px(38, 25, '#FFFFFF');
}

function ufo(p: PX, f: number) {
  p.dy = 6;
  // Mái vòm kính + người ngoài hành tinh dễ thương.
  p.ell(36, 18, 11, 10, '#A8E6F7');
  p.ell(36, 21, 4.5, 4.6, '#82D96C');
  p.rect(33, 20, 2, 2, '#1B2236');
  p.rect(38, 20, 2, 2, '#1B2236');
  p.px(35, 23, '#3E7A32');
  p.px(36, 23, '#3E7A32');
  p.line(36, 16, 36, 13, '#82D96C');
  p.rect(35, 11, 3, 3, '#FFD66B');
  p.px(31, 13, '#FFFFFF');
  p.px(32, 12, '#FFFFFF');
  // Đĩa.
  p.ell(36, 30, 28, 7, '#C8D1DE');
  p.recolor(10, 30, 52, 2, '#98A5BA');
  p.ell(36, 36, 12, 3.4, '#8794AA');
  // Đèn nhấp nháy quanh đĩa.
  const cols = ['#FF6B6B', '#FFD66B', '#6BE08A', '#6BB8FF'];
  for (let i = 0; i < 7; i++) p.lamp(14 + i * 7, 29, 2, 2, cols[(i + f) % 4]!);
}

function carpet(p: PX, f: number) {
  const ph = (f * Math.PI) / 2;
  const cy = (x: number) => 37 + Math.sin(ph + x * 0.13) * 1.8 - (x - 6) * 0.03;
  p.dy = 3;
  // Thảm: dải lượn sóng, viền vàng, hoa văn thoi.
  const top: [number, number][] = [];
  const bot: [number, number][] = [];
  for (let x = 6; x <= 64; x += 4) {
    top.push([x, cy(x)]);
    bot.push([x, cy(x) + 6]);
  }
  p.poly([...top, ...bot.reverse()], '#C03A52');
  for (let x = 7; x <= 62; x++) {
    const y = Math.round(cy(x));
    p.px(x, y, GOLD);
    p.px(x, y + 5, GOLD);
    if ((x - 7) % 8 === 4) {
      p.px(x, y + 2, CREAM);
      p.px(x, y + 3, CREAM);
      p.px(x - 1, y + 2.5, CREAM);
      p.px(x + 1, y + 2.5, CREAM);
    }
  }
  // Tua rua hai đầu, bay nhẹ.
  for (let k = 0; k < 4; k++) {
    const fl = Math.sin(ph + k) * 1.2;
    p.line(6, cy(6) + 1 + k * 1.5, 2 + fl, cy(6) + 2 + k * 1.5 + 1, GOLD);
    p.line(64, cy(64) + 1 + k * 1.5, 67 + fl, cy(64) + 2 + k * 1.5 + 1, GOLD);
  }
  // Người ngồi xếp bằng, khăn xếp, mắt cười.
  const by = cy(38);
  p.ell(38, by - 1, 8, 3.2, '#2E4A86');
  p.ell(38, by - 8, 6.4, 7, '#3FB8A9');
  p.recolor(32, by - 5, 13, 1, CREAM);
  p.poly([[42, by - 8], [48, by - 5], [47, by - 3], [41, by - 5]], '#3FB8A9');
  p.ell(48, by - 4, 1.8, 1.8, SKIN);
  p.ell(38, by - 18, 5.4, 5.4, SKIN);
  p.ell(38, by - 23, 6.4, 4, CREAM);
  p.rect(35, by - 22, 7, 1, GOLD);
  p.px(41, by - 24, RED);
  p.px(40, by - 25, RED);
  p.px(41, by - 18, '#2B2140');
  p.px(40, by - 15, '#B8605A');
  p.px(39, by - 15, '#B8605A');
}

const DRAW: Record<FlyerId, (p: PX, f: number, o: FlyerOpts) => void> = {
  plane,
  balloon,
  hero: (p, f) => hero(p, f),
  unicorn: (p, f) => unicorn(p, f),
  dragon,
  rocket: (p, f) => rocket(p, f),
  ufo: (p, f) => ufo(p, f),
  carpet: (p, f) => carpet(p, f),
};

/** Lưới điểm ảnh của một khung (đã thêm tuyết / ánh mưa, CHƯA có viền) — tách riêng để kiểm tra không cần canvas. */
export function flyerPixels(id: FlyerId, frame: number, o: FlyerOpts): (string | null)[] {
  const p = new PX(o);
  DRAW[id](p, ((frame % FLYER_FRAMES) + FLYER_FRAMES) % FLYER_FRAMES, o);
  const d = p.d;
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= SW || y >= SH ? null : d[y * SW + x]!);
  // Mép trên: tuyết đọng / ánh nước.
  if (o.snow || o.rain) {
    const edges: number[] = [];
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) if (d[y * SW + x] && !at(x, y - 1)) edges.push(y * SW + x);
    for (const i of edges) {
      const x = i % SW;
      const y = (i / SW) | 0;
      const h = hash2(x, y) % 100;
      if (o.snow) {
        d[i] = '#F6F9FD';
        if (h < 45 && d[i + SW]) d[i + SW] = '#E3ECF6';
      } else if (h < 55) d[i] = mixHex(d[i]!, '#DDEBFA', 0.5);
    }
  }
  return d;
}

/** Vẽ một khung của nhân vật ra canvas `SW×SH` (viền, tuyết, ánh mưa đã thêm). */
export function renderFlyer(id: FlyerId, frame: number, o: FlyerOpts): HTMLCanvasElement {
  const d = flyerPixels(id, frame, o);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= SW || y >= SH ? null : d[y * SW + x]!);
  const c = document.createElement('canvas');
  c.width = SW;
  c.height = SH;
  const g = c.getContext('2d')!;
  // Viền 1 điểm ảnh bốn hướng.
  g.fillStyle = o.outline;
  for (let y = 0; y < SH; y++)
    for (let x = 0; x < SW; x++)
      if (!d[y * SW + x] && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) g.fillRect(x, y, 1, 1);
  for (let y = 0; y < SH; y++)
    for (let x = 0; x < SW; x++) {
      const col = d[y * SW + x];
      if (col) {
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }
  return c;
}

/** Tên buổi ngày: sprite không nhuộm màu — dùng cho ô chọn, huy hiệu, thẻ Quest. */
export const DAY_OPTS: FlyerOpts = { tint: (c) => c, lit: false, rain: false, snow: false, outline: '#17223D' };
