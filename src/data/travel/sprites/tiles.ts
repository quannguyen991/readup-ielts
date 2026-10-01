/**
 * Ô ĐẤT 16×16 sinh bằng mã (kế hoạch §7.2 mục 1). Mỗi loại có 4–8 biến thể để
 * mặt đất không lặp; biến thể chọn theo vị trí ô (băm), không ngẫu nhiên lúc vẽ.
 * Ô đất KHÔNG có viền navy (viền chỉ dành cho vật đứng trên đất).
 */
import { Paint, mulberry32, type Grid } from './paint';

export type TileKind =
  | 'grass'
  | 'path'
  | 'paving'
  | 'plaza'
  | 'cobble'
  | 'road'
  | 'roadh'
  | 'roadv'
  | 'water'
  | 'floor'
  | 'carpet'
  | 'wood'
  | 'tilefloor'
  | 'sand'
  | 'rail';

export const TILE_VARIANTS: Record<TileKind, number> = {
  grass: 8,
  path: 4,
  paving: 6,
  plaza: 4,
  cobble: 6,
  road: 4,
  roadh: 2,
  roadv: 2,
  water: 4,
  floor: 4,
  carpet: 2,
  wood: 4,
  tilefloor: 4,
  sand: 4,
  rail: 2,
};

const T = 16;

function seedOf(kind: string, v: number): number {
  let h = 2166136261;
  for (let i = 0; i < kind.length; i++) h = Math.imul(h ^ kind.charCodeAt(i), 16777619);
  return (h ^ (v * 7919)) >>> 0;
}

function speckle(p: Paint, r: () => number, c: string, n: number) {
  for (let i = 0; i < n; i++) p.px((r() * T) | 0, (r() * T) | 0, c);
}

function build(kind: TileKind, v: number): Paint {
  const r = mulberry32(seedOf(kind, v));
  const p = new Paint(T, T);
  switch (kind) {
    case 'grass': {
      p.rect(0, 0, T, T, 'g');
      speckle(p, r, 'G', 14);
      if (v === 1 || v === 4) {
        for (let i = 0; i < 4; i++) {
          const x = 1 + ((r() * 13) | 0);
          const y = 2 + ((r() * 12) | 0);
          p.px(x, y, 'L').px(x, y - 1, 'G').px(x + 1, y - 1, 'G');
        }
      }
      if (v === 2) {
        for (let i = 0; i < 3; i++) {
          const x = 2 + ((r() * 11) | 0);
          const y = 3 + ((r() * 10) | 0);
          const c = ['w', 'e', 'p'][i % 3]!;
          p.px(x, y, c).px(x, y + 1, 'L');
        }
      }
      if (v === 3) for (let i = 0; i < 5; i++) p.ellipse(2 + ((r() * 12) | 0), 2 + ((r() * 12) | 0), 2, 1, 'G');
      if (v === 5) {
        p.px(5, 9, 'b').px(6, 9, 'B').px(5, 10, 'B');
        p.px(11, 4, 'b').px(12, 4, 'B');
      }
      if (v === 6) for (let i = 0; i < 3; i++) p.px((r() * 15) | 0, (r() * 15) | 0, 'l');
      if (v === 7) {
        p.px(4, 5, 'e').px(11, 11, 'e').px(10, 3, 'w');
        speckle(p, r, 'L', 5);
      }
      break;
    }
    case 'path': {
      p.rect(0, 0, T, T, 's');
      speckle(p, r, 'S', 18);
      speckle(p, r, 't', 4 + v);
      if (v === 2) p.px(7, 8, 'b').px(8, 8, 'B');
      break;
    }
    case 'sand': {
      p.rect(0, 0, T, T, 's');
      speckle(p, r, 'w', 5);
      speckle(p, r, 'S', 12);
      if (v % 2) p.hline(2 + v, 6 + v, 5, 'S');
      break;
    }
    case 'paving': {
      p.rect(0, 0, T, T, 'b');
      p.hline(0, 7, T, 'B').hline(0, 15, T, 'B');
      p.vline(((v * 3) % 8) + 0, 0, 7, 'B').vline(((v * 3 + 4) % 8) + 8, 8, 8, 'B');
      speckle(p, r, 'w', 5);
      speckle(p, r, 'B', 4);
      if (v === 5) p.px(4, 4, 'n').px(5, 5, 'n');
      break;
    }
    case 'plaza': {
      p.rect(0, 0, T, T, 'b');
      p.rect(0, 0, 8, 8, 'W').rect(8, 8, 8, 8, 'W');
      p.frame(0, 0, T, T, 'B');
      speckle(p, r, 'w', 4);
      if (v === 3) p.rect(6, 6, 4, 4, 'u').rect(7, 7, 2, 2, 'e');
      break;
    }
    case 'cobble': {
      p.rect(0, 0, T, T, 'n');
      for (let row = 0; row < 4; row++) {
        const off = row % 2 ? 2 : 0;
        for (let col = -1; col < 4; col++) {
          const x = col * 5 + off;
          const y = row * 4;
          p.rect(x, y, 4, 3, r() < 0.4 ? 'b' : 'B');
          p.px(x, y, 'b');
        }
      }
      speckle(p, r, 'w', v % 3);
      break;
    }
    case 'road': {
      p.rect(0, 0, T, T, 'n');
      speckle(p, r, 'B', 12);
      speckle(p, r, 'o', 3);
      break;
    }
    case 'roadh': {
      p.rect(0, 0, T, T, 'n');
      speckle(p, r, 'B', 10);
      p.hline(v === 0 ? 1 : 2, 7, 6, 'e').hline(v === 0 ? 1 : 2, 8, 6, 'e');
      p.hline(9, 7, 5, 'e').hline(9, 8, 5, 'e');
      break;
    }
    case 'roadv': {
      p.rect(0, 0, T, T, 'n');
      speckle(p, r, 'B', 10);
      p.vline(7, 1, 6, 'e').vline(8, 1, 6, 'e').vline(7, 9, 5, 'e').vline(8, 9, 5, 'e');
      break;
    }
    case 'water': {
      p.rect(0, 0, T, T, 'a');
      for (let i = 0; i < 4; i++) {
        const x = (r() * 11) | 0;
        const y = 1 + ((r() * 13) | 0);
        const len = 3 + ((r() * 4) | 0);
        p.hline(x, y, len, 'A');
        if (i % 2) p.px(x + 1, y + 1, 'd');
      }
      speckle(p, r, 'z', 2);
      break;
    }
    case 'floor': {
      p.rect(0, 0, T, T, 'W');
      p.hline(0, 0, T, 'b').vline(0, 0, T, 'b');
      p.hline(0, 8, T, 'y').vline(8, 0, T, 'y');
      speckle(p, r, 'w', 5);
      if (v === 1) p.px(3, 3, 'w').px(4, 3, 'w');
      break;
    }
    case 'carpet': {
      p.rect(0, 0, T, T, 'P');
      for (let y = 0; y < T; y += 4) for (let x = (y / 4 + v) % 2 ? 2 : 0; x < T; x += 4) p.px(x, y, 'p');
      p.frame(0, 0, T, T, 'P');
      break;
    }
    case 'wood': {
      for (let y = 0; y < T; y += 4) {
        p.rect(0, y, T, 3, 'x');
        p.hline(0, y + 3, T, 'X');
        p.vline((y * 3 + v * 5) % 14 + 1, y, 3, 'X');
      }
      speckle(p, r, 's', 3);
      break;
    }
    case 'tilefloor': {
      for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) p.rect(x * 8, y * 8, 8, 8, (x + y) % 2 ? 'y' : 'Y');
      p.hline(0, 0, T, 'S').vline(0, 0, T, 'S');
      speckle(p, r, 'w', 3);
      break;
    }
    case 'rail': {
      p.rect(0, 0, T, T, 't');
      speckle(p, r, 'S', 8);
      p.hline(0, 3, T, 'n').hline(0, 12, T, 'n').hline(0, 4, T, 'B').hline(0, 13, T, 'B');
      for (let x = 1; x < T; x += 5) p.rect(x, 1, 2, 14, 'X');
      break;
    }
  }
  return p;
}

const cache = new Map<string, Grid>();
export function tileGrid(kind: TileKind, variant: number): Grid {
  const n = TILE_VARIANTS[kind];
  const v = ((variant % n) + n) % n;
  const key = `${kind}:${v}`;
  let g = cache.get(key);
  if (!g) {
    g = build(kind, v).toRows();
    cache.set(key, g);
  }
  return g;
}

/** Bọt nước ven bờ: hướng cạnh có đất liền (n/e/s/w), 2 khung bọt đung đưa. */
export function foamGrid(side: 'n' | 'e' | 's' | 'w', frame: 0 | 1): Grid {
  const p = new Paint(T, T);
  const off = frame;
  for (let i = 0; i < T; i++) {
    const wob = ((i + off * 2) % 4 < 2 ? 0 : 1) + (i % 5 === 0 ? 1 : 0);
    const cells: [number, number, string][] = [
      [i, wob, 'w'],
      [i, wob + 1, (i + off) % 3 === 0 ? 'w' : 'a'],
    ];
    for (const [a, b, c] of cells) {
      if (side === 'n') p.px(a, b, c);
      if (side === 's') p.px(a, T - 1 - b, c);
      if (side === 'w') p.px(b, a, c);
      if (side === 'e') p.px(T - 1 - b, a, c);
    }
  }
  return p.toRows();
}
