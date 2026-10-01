/**
 * VẬT TRANG TRÍ trên đất: cây, đèn, ghế, hàng rào, bồn hoa, biển chỉ đường…
 * Neo ở GIỮA-ĐÁY ô chứa chân vật (xem `SpriteDef`). `k` là bóng đổ (vẽ mờ 30%).
 */
import { Paint, mulberry32, type Grid } from './paint';

export type SpriteDef = { w: number; h: number; frames: Grid[] };

const one = (p: Paint): SpriteDef => ({ w: p.w, h: p.h, frames: [p.toRows()] });

function shadow(p: Paint, cx: number, y: number, rx: number, ry = 2) {
  p.ellipse(cx, y, rx, ry, 'k');
}

function blob(p: Paint, cx: number, cy: number, rx: number, ry: number, seed: number) {
  // Tán lá nhiều lớp: tối ở đáy-phải, sáng ở trên-trái, rồi viền.
  const r = mulberry32(seed);
  p.ellipse(cx + 1, cy + 1, rx, ry, 'h');
  p.ellipse(cx, cy, rx - 1, ry - 1, 'L');
  p.ellipse(cx - 2, cy - 2, Math.max(2, rx - 4), Math.max(2, ry - 4), 'l');
  for (let i = 0; i < 6; i++) p.px(cx - rx + 3 + ((r() * (rx * 2 - 5)) | 0), cy - ry + 3 + ((r() * (ry * 2 - 5)) | 0), r() < 0.5 ? 'h' : 'l');
}

export function treeRound(v: number): Paint {
  const p = new Paint(32, 40);
  shadow(p, 16, 37, 11, 2);
  p.rect(14, 26, 4, 11, 'x').rect(17, 26, 1, 11, 'X').px(13, 36, 'X').px(18, 36, 'X');
  blob(p, 16, 15, v ? 13 : 12, v ? 12 : 13, 11 + v * 7);
  if (v) {
    p.px(10, 22, 'p').px(21, 16, 'p').px(17, 9, 'e');
  }
  p.outline();
  return p;
}

export function palm(): Paint {
  const p = new Paint(32, 48);
  shadow(p, 16, 45, 8, 2);
  const trunk: [number, number][] = [[16, 44], [16, 40], [17, 36], [17, 32], [18, 28], [18, 24], [19, 20]];
  for (const [x, y] of trunk) p.rect(x - 1, y, 3, 4, 'x').px(x + 1, y, 'X').px(x + 1, y + 2, 'X');
  p.hline(15, 41, 4, 'X').hline(16, 33, 4, 'X').hline(17, 26, 4, 'X');
  const fronds: [number, number, number, number][] = [
    [20, 20, 30, 24], [20, 20, 29, 17], [20, 20, 24, 12], [20, 20, 14, 11], [20, 20, 8, 17], [20, 20, 6, 24], [20, 20, 11, 22], [20, 20, 26, 27],
  ];
  for (const [x0, y0, x1, y1] of fronds) {
    p.line(x0, y0, x1, y1, 'L');
    p.line(x0, y0 + 1, x1, y1 + 1, 'h');
    p.line(x0, y0 - 1, x1, y1 - 1, 'l');
  }
  p.rect(18, 19, 4, 3, 'U').px(19, 19, 'u');
  p.outline();
  return p;
}

export function cypress(): Paint {
  const p = new Paint(16, 48);
  shadow(p, 8, 45, 5, 2);
  p.rect(7, 40, 2, 5, 'X');
  p.ellipse(8, 22, 6, 20, 'h');
  p.ellipse(7, 21, 4, 18, 'L');
  p.ellipse(6, 18, 2, 12, 'l');
  p.outline();
  return p;
}

export function bush(v: number): Paint {
  const p = new Paint(16, 16);
  shadow(p, 8, 14, 6, 2);
  p.ellipse(8, 9, 6, 5, 'h').ellipse(8, 8, 5, 4, 'L').ellipse(6, 6, 3, 2, 'l');
  if (v) p.px(5, 9, 'p').px(10, 7, 'p').px(8, 10, 'e');
  p.outline();
  return p;
}

export function hedge(): Paint {
  const p = new Paint(16, 16);
  shadow(p, 8, 14, 7, 1);
  p.rect(1, 3, 14, 11, 'h').rect(1, 3, 14, 8, 'L').rect(2, 3, 12, 3, 'l');
  for (let x = 2; x < 14; x += 3) p.px(x, 8, 'h').px(x + 1, 5, 'h');
  p.outline();
  return p;
}

export function flowers(c1: string, c2: string): Paint {
  const p = new Paint(16, 16);
  p.ellipse(8, 11, 7, 4, 'h').ellipse(8, 10, 6, 3, 'L');
  const dots: [number, number, string][] = [[4, 8, c1], [8, 7, c2], [11, 9, c1], [6, 11, c2], [10, 12, c1], [3, 11, c2], [13, 11, c2]];
  for (const [x, y, c] of dots) p.px(x, y, c).px(x, y - 1, c === c1 ? c2 : c1);
  return p;
}

export function lamp(): Paint {
  const p = new Paint(16, 36);
  shadow(p, 8, 34, 4, 1);
  p.rect(7, 12, 2, 22, 'n').px(8, 12, 'B').rect(6, 31, 4, 3, 'n').hline(6, 31, 4, 'B');
  p.rect(5, 5, 6, 8, 'u').rect(6, 6, 4, 6, 'e').hline(4, 4, 8, 'U').hline(5, 3, 6, 'n');
  p.px(8, 2, 'n');
  p.outline();
  return p;
}

export function bench(): Paint {
  const p = new Paint(20, 16);
  shadow(p, 10, 14, 8, 1);
  p.rect(2, 7, 16, 3, 'x').hline(2, 7, 16, 'e').hline(2, 10, 16, 'X');
  p.rect(2, 3, 16, 3, 'x').hline(2, 3, 16, 's').hline(2, 6, 16, 'X');
  p.rect(3, 10, 2, 4, 'n').rect(15, 10, 2, 4, 'n').rect(2, 3, 1, 8, 'n').rect(17, 3, 1, 8, 'n');
  p.outline();
  return p;
}

export function signpost(): Paint {
  const p = new Paint(16, 28);
  shadow(p, 8, 26, 4, 1);
  p.rect(7, 9, 2, 17, 'x').px(8, 9, 'X');
  p.rect(2, 4, 12, 7, 'u').hline(2, 4, 12, 'e').hline(2, 10, 12, 'U');
  p.hline(4, 6, 6, 'o').hline(4, 8, 8, 'o');
  p.outline();
  return p;
}

export function fence(vertical: boolean): Paint {
  const p = new Paint(16, 16);
  if (!vertical) {
    p.rect(0, 6, 16, 2, 'x').hline(0, 6, 16, 's').rect(0, 10, 16, 2, 'x').hline(0, 10, 16, 's');
    for (const x of [1, 8, 14]) p.rect(x, 3, 2, 11, 'x').px(x, 3, 's').px(x + 1, 13, 'X');
    p.hline(1, 14, 14, 'k');
  } else {
    p.rect(6, 0, 4, 16, 'x').vline(6, 0, 16, 's').vline(9, 0, 16, 'X');
    for (const y of [2, 7, 12]) p.rect(5, y, 6, 2, 'x').hline(5, y, 6, 's');
  }
  p.outline();
  return p;
}

export function table(parasol: boolean): Paint {
  const p = new Paint(24, 32);
  shadow(p, 12, 29, 9, 2);
  p.rect(11, 18, 2, 10, 'n');
  p.ellipse(12, 20, 8, 3, 'x').ellipse(12, 19, 8, 2, 's');
  p.rect(2, 25, 4, 4, 'X').rect(18, 25, 4, 4, 'X').rect(3, 24, 3, 2, 'x').rect(18, 24, 3, 2, 'x');
  if (parasol) {
    p.rect(11, 6, 2, 14, 'w');
    p.ellipse(12, 7, 11, 5, 'p');
    for (let i = 0; i < 4; i++) p.rect(4 + i * 6, 3, 3, 8, 'w');
    p.hline(2, 11, 20, 'P');
  } else {
    p.rect(8, 15, 3, 4, 'w').rect(14, 16, 3, 3, 'u');
  }
  p.outline();
  return p;
}

export function planter(): Paint {
  const p = new Paint(16, 18);
  shadow(p, 8, 16, 6, 1);
  p.rect(2, 9, 12, 7, 'r').hline(2, 9, 12, 'e').hline(2, 15, 12, 'R');
  p.ellipse(8, 7, 6, 4, 'L').ellipse(6, 6, 3, 2, 'l');
  p.px(5, 5, 'p').px(9, 4, 'e').px(11, 6, 'p').px(7, 7, 'w');
  p.outline();
  return p;
}

export function bin(): Paint {
  const p = new Paint(12, 18);
  shadow(p, 6, 16, 5, 1);
  p.rect(2, 5, 8, 11, 'p').rect(2, 5, 8, 2, 'P').rect(1, 4, 10, 2, 'P');
  p.vline(4, 8, 6, 'P').vline(7, 8, 6, 'P').hline(2, 15, 8, 'P');
  p.outline();
  return p;
}

export function crate(): Paint {
  const p = new Paint(16, 16);
  shadow(p, 8, 14, 7, 1);
  p.rect(2, 4, 12, 10, 'x').frame(2, 4, 12, 10, 'X').line(3, 5, 12, 12, 'X').hline(2, 4, 12, 's');
  p.outline();
  return p;
}

export function trolley(): Paint {
  const p = new Paint(20, 20);
  shadow(p, 10, 18, 8, 1);
  p.rect(3, 4, 14, 2, 'B').rect(3, 4, 2, 10, 'B').rect(3, 13, 14, 2, 'B');
  p.rect(6, 7, 8, 5, 'p').hline(6, 7, 8, 'w').rect(8, 8, 4, 1, 'u');
  p.px(5, 16, 'n').px(14, 16, 'n').px(5, 17, 'o').px(14, 17, 'o');
  p.outline();
  return p;
}

export function seats(): Paint {
  const p = new Paint(32, 20);
  shadow(p, 16, 18, 13, 1);
  for (let i = 0; i < 3; i++) {
    const x = 2 + i * 10;
    p.rect(x, 3, 8, 7, 'P').rect(x + 1, 4, 6, 5, 'p').rect(x, 10, 8, 4, 'p').hline(x, 10, 8, 'P');
    p.rect(x + 1, 14, 1, 3, 'n').rect(x + 6, 14, 1, 3, 'n');
  }
  p.outline();
  return p;
}

export function pot(): Paint {
  const p = new Paint(16, 28);
  shadow(p, 8, 26, 5, 1);
  p.rect(4, 17, 8, 8, 'r').hline(3, 17, 10, 'e').hline(4, 24, 8, 'R');
  p.ellipse(8, 11, 6, 7, 'L').ellipse(6, 9, 3, 4, 'l').line(8, 17, 8, 12, 'h');
  p.outline();
  return p;
}

export function pillar(): Paint {
  const p = new Paint(16, 40);
  shadow(p, 8, 38, 6, 1);
  p.rect(3, 4, 10, 32, 'b').vline(3, 4, 32, 'w').vline(12, 4, 32, 'B').vline(11, 6, 28, 'B');
  p.rect(2, 2, 12, 3, 'W').rect(2, 35, 12, 3, 'W').hline(2, 37, 12, 'B');
  p.outline();
  return p;
}

export function boatSmall(): Paint {
  const p = new Paint(40, 24);
  p.ellipse(20, 20, 17, 2, 'k');
  p.rect(4, 12, 32, 6, 'p').hline(3, 11, 34, 'w').hline(5, 18, 30, 'P').px(3, 12, 'w').px(36, 12, 'w');
  p.rect(14, 5, 12, 7, 'W').rect(15, 6, 4, 4, 'z').rect(21, 6, 4, 4, 'z').hline(13, 4, 14, 'r');
  p.outline();
  return p;
}

export function puddle(): Paint {
  const p = new Paint(14, 7);
  p.ellipse(7, 3, 6, 3, 'A').ellipse(7, 3, 5, 2, 'a').hline(4, 2, 4, 'w').px(9, 3, 'w');
  return p;
}

export const PROPS: Record<string, () => SpriteDef> = {
  tree_a: () => one(treeRound(0)),
  tree_b: () => one(treeRound(1)),
  palm: () => one(palm()),
  cypress: () => one(cypress()),
  bush: () => one(bush(0)),
  bush_berry: () => one(bush(1)),
  hedge: () => one(hedge()),
  flowers_a: () => one(flowers('p', 'e')),
  flowers_b: () => one(flowers('w', 'u')),
  flowers_c: () => one(flowers('r', 'w')),
  lamp: () => one(lamp()),
  bench: () => one(bench()),
  signpost: () => one(signpost()),
  fence_h: () => one(fence(false)),
  fence_v: () => one(fence(true)),
  table: () => one(table(false)),
  parasol: () => one(table(true)),
  planter: () => one(planter()),
  bin: () => one(bin()),
  crate: () => one(crate()),
  trolley: () => one(trolley()),
  seats: () => one(seats()),
  pot: () => one(pot()),
  pillar: () => one(pillar()),
  boat_small: () => one(boatSmall()),
  puddle: () => one(puddle()),
};
