/**
 * PHÒNG TRONG dự phòng vẽ bằng mã (dùng khi chưa có / không tải được `/travel/interiors/<kind>.png`): tường trên + hai bên,
 * sàn gạch, quầy, đồ đạc đúng chỗ các `blockers` của bố cục (`data/travel/interiors.ts`), cửa ở đáy giữa.
 */
import type { Palette } from '@/data/travel/palettes';
import { INTERIOR_SIZE, type InteriorLayout, type IRect } from '@/data/travel/interiors';
import { ctx2d, makeCanvas } from './Atlas';
import type { InteriorKind } from './scene';

export function drawInterior(kind: InteriorKind, col: Palette, layout: InteriorLayout, W: number = INTERIOR_SIZE.w, H: number = INTERIOR_SIZE.h): ReturnType<typeof makeCanvas> {
  const cv = makeCanvas(W, H);
  const c = ctx2d(cv);
  if (layout.zone === 'platform') return drawStationPlatform(c, cv, col, layout, W, H);
  if (kind === 'garden' || kind === 'landmark' || kind === 'secret') return drawOutdoorPlace(c, cv, kind, col, W, H);
  const r = (x: number, y: number, w: number, h: number, ch: string) => {
    c.fillStyle = col[ch] ?? '#000';
    c.fillRect(x, y, w, h);
  };
  const F = layout.floor;
  const light = kind === 'station' || kind === 'airport' || kind === 'counter';
  // viền tối + tường
  r(0, 0, W, H, 'o');
  r(F.x - 14, 4, F.w + 28, F.h + 30, light ? 'W' : 'y');
  r(F.x - 14, 4, F.w + 28, 4, 'Y');
  // tường trên: có cửa sổ
  const wallB = F.y;
  r(F.x - 14, wallB - 8, F.w + 28, 8, kind === 'museum' ? 'p' : 'Y');
  for (let x = F.x + 10; x + 28 < F.x + F.w - 6; x += 52) {
    if (Math.abs(x + 14 - W / 2) < 56) continue;
    r(x - 2, 10, 32, 14, 'w');
    r(x, 12, 28, 10, 'z');
    r(x + 13, 12, 2, 10, 'w');
  }
  // tường hai bên (gờ chân tường)
  r(F.x - 14, wallB, 14, F.h, 'Y');
  r(F.x + F.w, wallB, 14, F.h, 'Y');
  r(F.x - 14, wallB, 3, F.h, 'o');
  r(F.x + F.w + 11, wallB, 3, F.h, 'o');
  // sàn
  for (let y = F.y; y < F.y + F.h; y += 12)
    for (let x = F.x; x < F.x + F.w; x += 12) {
      const alt = ((x - F.x) / 12 + (y - F.y) / 12) % 2 === 0;
      r(x, y, 12, 12, kind === 'hotel' || kind === 'museum' ? (alt ? 'x' : 's') : light ? (alt ? 'b' : 'W') : alt ? 'y' : 'Y');
    }
  // thảm lối đi giữa
  r(F.x + F.w / 2 - 40, F.y + 56, 80, F.h - 56, kind === 'museum' || kind === 'hotel' ? 'P' : 'p');
  r(F.x + F.w / 2 - 38, F.y + 58, 76, 2, 'u');
  // đồ đạc đúng vị trí vùng chặn
  const furniture = (b: IRect) => {
    const x = b.x;
    const y = b.y;
    if (kind === 'cafe' || kind === 'restaurant') {
      r(x, y + 4, b.w, b.h - 4, 'x');
      r(x, y + 4, b.w, 3, 's');
      r(x + 3, y + b.h, 4, 5, 'X');
      r(x + b.w - 7, y + b.h, 4, 5, 'X');
      r(x + 4, y, 8, 5, 'w');
      r(x + b.w - 14, y, 8, 5, 'e');
    } else if (kind === 'market') {
      r(x, y, b.w, b.h, 'X');
      for (let j = y + 4; j < y + b.h - 6; j += 18) {
        r(x + 2, j, b.w - 4, 12, 'x');
        for (let i = x + 4; i < x + b.w - 8; i += 9) r(i, j + 2, 6, 8, (i + j) % 3 ? 'r' : 'u');
      }
    } else if (kind === 'hotel') {
      r(x, y, b.w, b.h, 'w');
      r(x, y, b.w, 10, 'p');
      r(x + 2, y + 12, b.w - 4, b.h - 16, 'W');
      r(x, y + b.h - 4, b.w, 4, 'X');
    } else if (kind === 'museum') {
      r(x + 2, y + b.h - 8, b.w - 4, 8, 'b');
      r(x + 4, y, b.w - 8, b.h - 6, 'u');
      r(x + 6, y + 2, b.w - 12, b.h - 12, 'e');
    } else {
      r(x, y, b.w, b.h, 'p');
      r(x + 2, y + 2, b.w - 4, b.h / 2, 'z');
      r(x, y + b.h - 4, b.w, 4, 'P');
    }
  };
  for (const b of layout.blockers) if (b !== layout.counter) furniture(b);
  // quầy
  const q = layout.counter;
  r(q.x - 2, q.y + 6, q.w + 4, q.h - 4, 'X');
  r(q.x, q.y + 4, q.w, 10, 'x');
  r(q.x, q.y + 4, q.w, 2, 's');
  for (let x = q.x + 8; x < q.x + q.w - 12; x += 16) r(x, q.y + 15, 12, q.h - 17, 'x');
  if (kind === 'cafe' || kind === 'restaurant') {
    r(q.x + 8, q.y - 3, 14, 8, 'w');
    r(q.x + q.w - 26, q.y, 16, 5, 'r');
  } else if (kind === 'hotel') {
    for (let i = 0; i < 4; i++) r(q.x + 6 + i * 6, q.y - 9, 4, 9, i % 2 ? 'U' : 'u');
  } else {
    r(q.x + 10, q.y - 8, 18, 10, 'n');
    r(q.x + 12, q.y - 6, 14, 6, 'z');
  }
  // cây cảnh ở bốn góc sàn
  const plant = (x: number, y: number) => {
    r(x, y + 8, 10, 8, 'r');
    r(x - 3, y - 2, 16, 12, 'L');
    r(x - 1, y - 6, 12, 8, 'l');
  };
  plant(F.x + 6, F.y + 8);
  plant(F.x + F.w - 16, F.y + 8);
  plant(F.x + 6, F.y + F.h - 20);
  plant(F.x + F.w - 16, F.y + F.h - 20);
  // cửa + bậc thềm ở đáy giữa
  const d = layout.doorway;
  r(d.x - 6, d.y - 2, d.w + 12, 4, 'u');
  r(d.x, d.y, d.w, d.h, 'X');
  r(d.x + 2, d.y + 2, d.w - 4, d.h - 2, 'x');
  r(d.x + d.w / 2 - 1, d.y + 2, 2, d.h - 2, 'X');
  return cv;
}

function drawStationPlatform(c: CanvasRenderingContext2D, cv: ReturnType<typeof makeCanvas>, col: Palette, layout: InteriorLayout, W: number, H: number) {
  const r = (x: number, y: number, w: number, h: number, color: string) => {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  };
  r(0, 0, W, H, '#11192a');
  r(0, 0, W, 51, '#202d45');
  r(18, 18, W - 36, 32, '#172238');
  for (let x = 26; x < W - 20; x += 40) {
    r(x, 12, 2, 41, '#53627a');
    r(x - 5, 10, 12, 4, '#d5d8d5');
    r(x - 2, 14, 6, 2, '#f5d887');
  }
  // Recessed tracks behind the train; the walkable platform begins at the bright edge line.
  r(0, 55, W, 74, '#080d18');
  r(0, 89, W, 4, '#687283');
  r(0, 99, W, 2, '#3b4658');
  r(0, 124, W, 5, '#f4ca4c');
  for (let x = 0; x < W; x += 18) r(x, 127, 9, 2, '#fff0a1');
  const F = layout.floor;
  r(F.x, 131, F.w, F.h - 131 + F.y, '#bfc0b5');
  for (let y = 138; y < H; y += 14) {
    r(12, y, W - 24, 1, '#979a93');
    for (let x = 12 + ((y / 14) % 2) * 12; x < W - 10; x += 24) r(x, y, 1, 14, '#a8aaa2');
  }
  r(0, H - 11, W, 11, '#253348');
  r(21, 142, 55, 48, '#27364c');
  r(25, 146, 47, 39, '#475770');
  r(32, 146, 3, 39, '#c1aa67');
  r(78, 18, 84, 20, '#0a1424');
  r(84, 23, 72, 3, '#f5d25d');
  r(84, 29, 42, 2, '#8bd2ce');
  r(129, 29, 27, 2, '#8bd2ce');
  c.fillStyle = '#e8e4d5';
  c.font = '6px monospace';
  c.fillText('MRT  ·  PLATFORM', 84, 20);
  return cv;
}

function drawOutdoorPlace(c: CanvasRenderingContext2D, cv: ReturnType<typeof makeCanvas>, kind: 'garden' | 'landmark' | 'secret', col: Palette, W: number, H: number) {
  const r = (x: number, y: number, w: number, h: number, key: string) => {
    c.fillStyle = col[key] ?? '#000';
    c.fillRect(x, y, w, h);
  };
  if (kind === 'garden') {
    r(0, 0, W, H, 'z');
    r(0, 0, W, 50, 'b');
    r(0, 44, W, 19, 'l');
    r(0, 62, W, H - 62, 'L');
    r(182, 57, 54, H - 57, 's');
    r(186, 57, 46, H - 57, 'x');
    r(21, 78, 91, 65, 'b');
    r(25, 82, 83, 56, 'z');
    r(25, 98, 83, 3, 'w');
    r(25, 122, 83, 2, 'w');
    for (const [x, y] of [[26, 49], [346, 50], [38, 138], [337, 139]] as const) {
      r(x, y + 26, 24, 8, 'X'); r(x + 9, y + 4, 7, 27, 'n'); r(x + 2, y + 12, 23, 12, 'L'); r(x + 5, y + 6, 18, 13, 'l'); r(x + 9, y, 12, 12, 'L');
    }
    for (let x = 133; x < 179; x += 13) { r(x, 89 + (x % 3) * 4, 4, 4, 'r'); r(x + 2, 86 + (x % 3) * 4, 3, 3, 'w'); }
    r(113, 171, 67, 6, 'X'); r(116, 168, 61, 3, 'x');
    r(245, 171, 67, 6, 'X'); r(248, 168, 61, 3, 'x');
    r(188, 50, 42, 34, 'X'); r(192, 55, 34, 24, 'x'); r(196, 59, 26, 16, 'u');
  } else if (kind === 'landmark') {
    r(0, 0, W, H, 'z'); r(0, 0, W, 47, 'b'); r(0, 47, W, H - 47, 'Y');
    r(0, 174, W, 61, 'x');
    for (let x = 0; x < W; x += 28) r(x, 174 + (x % 3) * 2, 14, 2, 's');
    r(166, 99, 86, 76, 'X'); r(174, 78, 70, 22, 'X'); r(182, 54, 54, 24, 'n'); r(190, 44, 38, 10, 'u');
    r(190, 108, 38, 67, 'w'); r(198, 119, 22, 56, 'Y'); r(207, 51, 8, 9, 'U');
    r(145, 166, 128, 8, 'o'); r(154, 159, 110, 7, 'X');
    r(19, 75, 72, 67, 'p'); r(24, 80, 62, 55, 'w'); r(328, 75, 72, 67, 'p'); r(333, 80, 62, 55, 'w');
    r(316, 52, 70, 32, 'X'); r(320, 56, 62, 24, 'Y'); r(324, 61, 54, 2, 'u');
  } else {
    r(0, 0, W, H, 'o'); r(0, 0, W, 43, 'X'); r(0, 43, W, H - 43, 'n');
    r(18, 54, 78, H - 54, 'o'); r(W - 96, 54, 78, H - 54, 'o');
    r(99, 74, W - 198, H - 74, 'X'); r(107, 82, W - 214, H - 82, 'x');
    r(153, 52, 112, 37, 'r'); r(161, 57, 96, 26, 'X'); r(171, 64, 76, 13, 'z');
    r(31, 67, 49, 90, 'n'); r(35, 71, 41, 78, 'Y');
    r(338, 67, 49, 90, 'n'); r(342, 71, 41, 78, 'Y');
    r(46, 89, 18, 5, 'U'); r(354, 89, 18, 5, 'U');
    r(57, 175, 65, 18, 'X'); r(296, 175, 65, 18, 'X');
    r(146, 52, 128, 34, 'X'); r(151, 57, 118, 22, 'x');
  }
  return cv;
}
