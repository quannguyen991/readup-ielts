import { hash2 } from './rng';
import type { RGB } from './palette';

/** Sprite pixel-art vẽ bằng mã (không emoji, không ảnh ngoài): cây, đèn, ghế, bụi, đài phun, người chơi. */
export type PixelSprite = { w: number; h: number; data: Uint8ClampedArray };

class Pix {
  data: Uint8ClampedArray;
  constructor(readonly w: number, readonly h: number) {
    this.data = new Uint8ClampedArray(w * h * 4);
  }
  px(x: number, y: number, c: RGB, a = 255) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const o = (y * this.w + x) * 4;
    this.data[o] = c[0]; this.data[o + 1] = c[1]; this.data[o + 2] = c[2]; this.data[o + 3] = a;
  }
  has(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h && this.data[(y * this.w + x) * 4 + 3]! > 0;
  }
  rect(x: number, y: number, w: number, h: number, c: RGB) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB | ((x: number, y: number) => RGB)) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.px(x, y, typeof c === 'function' ? c(x, y) : c);
      }
    }
  }
  /** Viền tối quanh phần đã vẽ. */
  outline(c: RGB) {
    const src = this.data.slice();
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (src[(y * this.w + x) * 4 + 3]! > 0) continue;
        const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
          const nx = x + dx!, ny = y + dy!;
          return nx >= 0 && ny >= 0 && nx < this.w && ny < this.h && src[(ny * this.w + nx) * 4 + 3]! > 0;
        });
        if (nb) this.px(x, y, c);
      }
    }
  }
}

const mix = (a: RGB, b: RGB, t: number): RGB => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];

const LEAF: RGB[][] = [
  [[40, 98, 38], [58, 128, 44], [88, 160, 52], [128, 190, 70]],
  [[36, 92, 52], [52, 120, 62], [80, 152, 74], [120, 184, 90]],
  [[70, 100, 30], [92, 132, 36], [124, 164, 46], [160, 196, 64]],
];
const TRUNK: RGB[] = [[74, 48, 30], [104, 70, 44]];
const OUT: RGB = [26, 44, 26];

export function makeTree(variant: number): PixelSprite {
  const p = new Pix(26, 34);
  const L = LEAF[variant % 3]!;
  p.rect(11, 24, 4, 9, TRUNK[0]!);
  p.rect(12, 24, 2, 9, TRUNK[1]!);
  p.px(10, 32, TRUNK[0]!); p.px(15, 32, TRUNK[0]!);
  const lobes: [number, number, number, number][] = [[13, 14, 11, 11], [8, 17, 7, 6], [18, 17, 7, 6], [13, 9, 8, 7]];
  for (const [cx, cy, rx, ry] of lobes) {
    p.ellipse(cx, cy, rx, ry, (x, y) => {
      const lit = (cx - x) * 0.45 + (cy - y) * 0.9 + hash2(x, y, variant) * 3.5;
      return lit > 5 ? L[3]! : lit > 1.5 ? L[2]! : lit > -3 ? L[1]! : L[0]!;
    });
  }
  for (let i = 0; i < 18; i++) {
    const x = 3 + Math.floor(hash2(i, 1, variant) * 20), y = 4 + Math.floor(hash2(i, 2, variant) * 20);
    if (p.has(x, y)) p.px(x, y, L[hash2(i, 3, variant) < 0.5 ? 0 : 3]!);
  }
  p.outline(OUT);
  return { w: 26, h: 34, data: p.data };
}

export function makeBush(): PixelSprite {
  const p = new Pix(24, 16);
  const L = LEAF[0]!;
  p.ellipse(12, 11, 11, 4, [34, 82, 34]);
  for (const [cx, cy, rx, ry] of [[5, 9, 5, 5], [11, 7, 6, 6], [18, 9, 5, 5]] as const) {
    p.ellipse(cx, cy, rx, ry, (x, y) => {
      const lit = (cx - x) * 0.55 + (cy - y) * 0.9 + hash2(x, y, 4) * 2.5;
      return lit > 3 ? L[3]! : lit > 0 ? L[2]! : L[1]!;
    });
  }
  for (const [x, y] of [[4, 8], [8, 5], [12, 4], [16, 6], [20, 8], [10, 9], [17, 11]] as const) {
    if (p.has(x, y)) p.px(x, y, L[3]!);
  }
  p.outline(OUT);
  return { w: 24, h: 16, data: p.data };
}

export function makeLamp(): PixelSprite {
  const p = new Pix(10, 30);
  const dark: RGB = [48, 52, 60], mid: RGB = [86, 92, 104];
  p.rect(4, 8, 2, 21, dark);
  p.rect(3, 27, 4, 2, mid);
  p.rect(2, 3, 6, 6, mid);
  p.rect(3, 4, 4, 4, [255, 232, 150]);
  p.rect(4, 5, 2, 2, [255, 252, 220]);
  p.rect(2, 2, 6, 1, dark);
  p.outline([24, 26, 30]);
  return { w: 10, h: 30, data: p.data };
}

export function makeBench(): PixelSprite {
  const p = new Pix(16, 12);
  p.rect(1, 4, 14, 2, [150, 100, 60]);
  p.rect(1, 7, 14, 3, [170, 118, 74]);
  p.rect(1, 8, 14, 1, [120, 80, 48]);
  p.rect(2, 10, 2, 2, [60, 56, 56]);
  p.rect(12, 10, 2, 2, [60, 56, 56]);
  p.rect(1, 2, 14, 1, [120, 80, 48]);
  p.outline([40, 28, 20]);
  return { w: 16, h: 12, data: p.data };
}

export function makeFountain(): PixelSprite {
  const p = new Pix(48, 44);
  const stone: RGB[] = [[170, 162, 150], [150, 142, 132], [196, 188, 172], [100, 92, 86]];
  p.ellipse(24, 30, 22, 12, stone[3]!);
  p.ellipse(24, 28, 21, 11, stone[2]!);
  p.ellipse(24, 28, 17, 8, (x, y) => (hash2(x, y, 8) < 0.2 ? [120, 210, 200] : [30, 150, 140]));
  p.rect(22, 8, 4, 22, stone[1]!);
  p.rect(23, 8, 1, 22, stone[2]!);
  p.ellipse(24, 14, 9, 4, stone[1]!);
  p.ellipse(24, 13, 8, 3, (x, y) => (hash2(x, y, 9) < 0.25 ? [150, 226, 214] : [40, 160, 150]));
  p.rect(21, 3, 6, 6, stone[0]!);
  for (const [x, y] of [[24, 1], [23, 2], [25, 2], [20, 5], [28, 5], [18, 10], [30, 10], [22, 0], [26, 0]] as const) p.px(x, y, [190, 236, 240]);
  p.outline([60, 54, 50]);
  return { w: 48, h: 44, data: p.data };
}

/** Quầy hàng vỉa hè với mái bạt sọc, làm theo bảng màu phố Sài Gòn. */
export function makeStall(variant = 0): PixelSprite {
  const p = new Pix(28, 26);
  const awnings: [RGB, RGB][] = [
    [[210, 72, 54], [250, 208, 112]],
    [[35, 132, 126], [240, 220, 156]],
    [[118, 82, 148], [244, 174, 118]],
  ];
  const [a, b] = awnings[variant % awnings.length]!;
  p.rect(4, 10, 20, 13, [102, 66, 43]);
  p.rect(5, 12, 18, 9, [185, 127, 76]);
  p.rect(6, 13, 16, 7, [226, 190, 128]);
  p.rect(4, 9, 20, 2, [54, 44, 38]);
  p.rect(3, 3, 22, 2, [45, 38, 36]);
  p.rect(4, 5, 20, 1, a);
  p.rect(5, 6, 18, 1, b);
  for (let x = 5; x < 24; x += 4) p.rect(x, 7, 3, 3, ((x - 5) / 4) % 2 === 0 ? a : b);
  p.rect(4, 10, 2, 12, [70, 48, 37]); p.rect(22, 10, 2, 12, [70, 48, 37]);
  p.rect(7, 15, 3, 3, [226, 82, 54]); p.rect(12, 14, 3, 4, [245, 192, 76]); p.rect(18, 15, 3, 3, [80, 148, 84]);
  p.rect(5, 22, 18, 2, [52, 42, 36]);
  p.outline([52, 38, 32]);
  return { w: 28, h: 26, data: p.data };
}

export function makeBollard(): PixelSprite {
  const p = new Pix(6, 10);
  p.rect(2, 2, 2, 7, [76, 78, 77]);
  p.rect(1, 1, 4, 2, [120, 122, 116]);
  p.rect(2, 2, 1, 6, [192, 174, 132]);
  p.rect(1, 8, 4, 1, [46, 49, 49]);
  p.outline([36, 39, 37]);
  return { w: 6, h: 10, data: p.data };
}

/** Người chơi: 4 hướng × 3 khung đi. */
export function makePlayer(dir: 'up' | 'down' | 'left' | 'right', frame: number): PixelSprite {
  const p = new Pix(14, 22);
  const skin: RGB = [240, 196, 156], shirt: RGB = [226, 88, 74], pants: RGB = [54, 72, 120], hair: RGB = [46, 34, 28], shoe: RGB = [34, 28, 28];
  const step = frame === 1 ? -1 : frame === 2 ? 1 : 0;
  p.rect(4, 10, 6, 7, shirt);
  p.rect(4, 10, 6, 1, mix(shirt, [255, 255, 255], 0.25));
  p.rect(3, 11, 1, 5, shirt); p.rect(10, 11, 1, 5, shirt);
  p.rect(3, 16, 1, 1, skin); p.rect(10, 16, 1, 1, skin);
  p.rect(4, 17, 3, 3 + (step < 0 ? -1 : 0), pants);
  p.rect(7, 17, 3, 3 + (step > 0 ? -1 : 0), pants);
  p.rect(4, 20 + (step < 0 ? -1 : 0), 3, 1, shoe);
  p.rect(7, 20 + (step > 0 ? -1 : 0), 3, 1, shoe);
  p.rect(4, 3, 6, 7, skin);
  if (dir === 'down') { p.rect(4, 2, 6, 3, hair); p.px(5, 6, [40, 30, 30]); p.px(8, 6, [40, 30, 30]); }
  else if (dir === 'up') { p.rect(4, 2, 6, 7, hair); }
  else if (dir === 'left') { p.rect(4, 2, 6, 3, hair); p.rect(7, 2, 3, 6, hair); p.px(5, 6, [40, 30, 30]); }
  else { p.rect(4, 2, 6, 3, hair); p.rect(4, 2, 3, 6, hair); p.px(8, 6, [40, 30, 30]); }
  p.outline([24, 20, 24]);
  return { w: 14, h: 22, data: p.data };
}

const cache = new Map<string, PixelSprite>();
export function decorSprite(kind: string, variant = 0): PixelSprite | null {
  const key = `${kind}:${variant}`;
  let s = cache.get(key);
  if (s) return s;
  switch (kind) {
    case 'tree': s = makeTree(variant); break;
    case 'bush': s = makeBush(); break;
    case 'lamp': s = makeLamp(); break;
    case 'bench': s = makeBench(); break;
    case 'fountain': s = makeFountain(); break;
    case 'stall': s = makeStall(variant); break;
    case 'bollard': s = makeBollard(); break;
    default: return null;
  }
  cache.set(key, s);
  return s;
}
