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
