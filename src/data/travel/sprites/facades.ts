/**
 * MẶT TIỀN CÔNG TRÌNH, kích thước theo ô của `footprint` (w×h ô), có hai bản ngày /
 * đêm (đêm: cửa sổ sáng đèn). Mã sprite: `fac:<loại>:<BIỂN>`, vd `fac:cafe:CAFE`.
 * Cửa ở cột `doorCol` (đúng cột có ô đứng vào địa điểm).
 */
import { Paint } from './paint';

export type FacadeKind = 'cafe' | 'restaurant' | 'hotel' | 'station' | 'market' | 'museum' | 'garden' | 'counter' | 'gate' | 'house' | 'shop' | 'terminal' | 'pub' | 'hall';
export const FACADE_KINDS: FacadeKind[] = ['cafe', 'restaurant', 'hotel', 'station', 'market', 'museum', 'garden', 'counter', 'gate', 'house', 'shop', 'terminal', 'pub', 'hall'];

// ----------------------------------------------------------- phông 3×5
const GLYPH: Record<string, string[]> = {};
function glyph(rows: string[]): string[] {
  return rows;
}
const G5 = (a: string, b: string, c: string, d: string, e: string) => glyph([a, b, c, d, e]);
Object.assign(GLYPH, {
  A: G5('.#.', '#.#', '###', '#.#', '#.#'),
  B: G5('##.', '#.#', '##.', '#.#', '##.'),
  C: G5('.##', '#..', '#..', '#..', '.##'),
  D: G5('##.', '#.#', '#.#', '#.#', '##.'),
  E: G5('###', '#..', '##.', '#..', '###'),
  F: G5('###', '#..', '##.', '#..', '#..'),
  G: G5('.##', '#..', '#.#', '#.#', '.##'),
  H: G5('#.#', '#.#', '###', '#.#', '#.#'),
  I: G5('###', '.#.', '.#.', '.#.', '###'),
  J: G5('..#', '..#', '..#', '#.#', '.#.'),
  K: G5('#.#', '#.#', '##.', '#.#', '#.#'),
  L: G5('#..', '#..', '#..', '#..', '###'),
  M: G5('#.#', '###', '###', '#.#', '#.#'),
  N: G5('##.', '#.#', '#.#', '#.#', '#.#'),
  O: G5('.#.', '#.#', '#.#', '#.#', '.#.'),
  P: G5('##.', '#.#', '##.', '#..', '#..'),
  Q: G5('.#.', '#.#', '#.#', '##.', '.##'),
  R: G5('##.', '#.#', '##.', '#.#', '#.#'),
  S: G5('.##', '#..', '.#.', '..#', '##.'),
  T: G5('###', '.#.', '.#.', '.#.', '.#.'),
  U: G5('#.#', '#.#', '#.#', '#.#', '###'),
  V: G5('#.#', '#.#', '#.#', '#.#', '.#.'),
  W: G5('#.#', '#.#', '###', '###', '#.#'),
  X: G5('#.#', '#.#', '.#.', '#.#', '#.#'),
  Y: G5('#.#', '#.#', '.#.', '.#.', '.#.'),
  Z: G5('###', '..#', '.#.', '#..', '###'),
  '0': G5('###', '#.#', '#.#', '#.#', '###'),
  '1': G5('.#.', '##.', '.#.', '.#.', '###'),
  '2': G5('##.', '..#', '.#.', '#..', '###'),
  '3': G5('##.', '..#', '.#.', '..#', '##.'),
  '4': G5('#.#', '#.#', '###', '..#', '..#'),
  '5': G5('###', '#..', '##.', '..#', '##.'),
  '9': G5('###', '#.#', '###', '..#', '###'),
  '-': G5('...', '...', '###', '...', '...'),
  '.': G5('...', '...', '...', '...', '.#.'),
  ' ': G5('...', '...', '...', '...', '...'),
});

export function textWidth(s: string): number {
  return s.length * 4 - 1;
}

export function drawText(p: Paint, x: number, y: number, s: string, c: string) {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const g = GLYPH[ch];
    if (g) g.forEach((row, j) => [...row].forEach((v, i) => v === '#' && p.px(cx + i, y + j, c)));
    cx += 4;
  }
}

// ----------------------------------------------------------- bộ phận
function window_(p: Paint, x: number, y: number, w: number, h: number, night: boolean, frame = 'w') {
  p.rect(x, y, w, h, night ? 'e' : 'z');
  if (!night) p.hline(x + 1, y + 1, Math.max(1, w - 3), 'w');
  p.frame(x - 1, y - 1, w + 2, h + 2, frame === 'w' ? 'W' : frame);
  if (w >= 5) p.vline(x + (w >> 1), y, h, night ? 'u' : 'B');
  p.hline(x - 1, y + h, w + 2, 'Y');
  if (night) p.hline(x, y + h - 1, w, 'u');
}

function door(p: Paint, x: number, y: number, w = 10, h = 14, c = 'x', dark = 'X') {
  p.rect(x, y, w, h, c).rect(x + 1, y + 1, w - 2, h - 1, dark).rect(x + 2, y + 2, w - 4, h - 2, c);
  p.vline(x + (w >> 1), y + 2, h - 2, dark);
  p.px(x + w - 3, y + (h >> 1), 'e');
  p.rect(x - 1, y + h, w + 2, 2, 'B').hline(x - 1, y + h, w + 2, 'b');
}

function shingles(p: Paint, x: number, y: number, w: number, h: number, light: string, dark: string) {
  p.rect(x, y, w, h, light);
  for (let j = 0; j < h; j += 4) {
    p.hline(x, y + j + 3, w, dark);
    for (let i = (j / 4) % 2 ? 2 : 0; i < w; i += 4) p.vline(x + i, y + j, 3, dark);
  }
  p.hline(x, y, w, 'e').hline(x, y + 1, w, light);
}

function awning(p: Paint, x: number, y: number, w: number, c1: string, c2: string) {
  for (let i = 0; i < w; i += 4) p.rect(x + i, y, 4, 6, ((i / 4) | 0) % 2 ? c2 : c1);
  for (let i = 0; i < w; i += 4) p.rect(x + i + 1, y + 6, 3, 1, ((i / 4) | 0) % 2 ? c2 : c1);
  p.hline(x, y, w, 'w').hline(x, y + 6, w, 'k');
}

function sign(p: Paint, cx: number, y: number, text: string, bg: string, fg: string) {
  const w = textWidth(text) + 6;
  const x = cx - (w >> 1);
  p.rect(x, y, w, 9, bg).frame(x, y, w, 9, 'o');
  drawText(p, x + 3, y + 2, text, fg);
}

// ----------------------------------------------------------- mặt tiền
export function buildFacade(kind: FacadeKind, w: number, h: number, doorCol: number, text: string, night: boolean): Paint {
  const W = w * 16;
  const H = h * 16;
  const p = new Paint(W, H);
  const dx = Math.max(0, Math.min(w - 1, doorCol)) * 16 + 3; // x của cửa (cửa rộng 10)
  const sh = (cx: number, cy: number, rx: number) => p.ellipse(cx, H - 1, rx, 1, 'k');
  void sh;

  if (kind === 'hall') {
    // Tường sảnh sân bay: dải trần, hàng cửa kính nhìn ra sân đỗ, chân tường nhấn màu.
    p.rect(0, 0, W, H, 'W').rect(0, 0, W, 5, 'P').hline(0, 5, W, 'p').hline(0, 6, W, 'k');
    const ww = 20;
    for (let x = 4; x + ww <= W - 2; x += ww + 4) {
      p.rect(x, 9, ww, H - 25, 'n').rect(x + 1, 10, ww - 2, H - 27, night ? 'P' : 'a');
      // đường chân trời + máy bay nhỏ ngoài kính
      p.rect(x + 1, H - 22, ww - 2, 5, night ? 'k' : 'B');
      if (!night) p.hline(x + 3, 14, 8, 'w').hline(x + 12, 17, 5, 'w');
      else for (let i = 0; i < 4; i++) p.px(x + 3 + i * 4, H - 21, 'e');
      p.vline(x + (ww >> 1), 10, H - 27, 'n');
    }
    p.rect(0, H - 14, W, 14, 'Y').hline(0, H - 14, W, 'y').rect(0, H - 4, W, 4, 'p').hline(0, H - 4, W, 'P');
    p.outline();
    return p;
  }

  if (kind === 'museum') {
    // Đền kiểu cổ điển: tam giác mái, cột, bậc thang.
    const roofH = Math.min(24, H - 28);
    p.rect(0, roofH, W, H - roofH - 6, 'b');
    for (let i = 0; i < roofH; i++) {
      const wd = Math.round(((W - 4) * (i + 1)) / roofH);
      p.hline((W - wd) >> 1, i, wd, i === roofH - 1 ? 'w' : 'W');
    }
    p.hline(0, roofH, W, 'w').hline(0, roofH + 1, W, 'B');
    // cột
    const cols = Math.max(3, Math.floor((W - 6) / 12));
    const step = (W - 8) / (cols - 1);
    for (let i = 0; i < cols; i++) {
      const x = Math.round(4 + i * step) - 2;
      p.rect(x, roofH + 2, 5, H - roofH - 10, 'w').vline(x + 4, roofH + 2, H - roofH - 10, 'B').rect(x - 1, roofH + 2, 7, 2, 'W').rect(x - 1, H - 10, 7, 2, 'W');
    }
    p.rect(0, H - 6, W, 3, 'W').rect(0, H - 3, W, 3, 'B').hline(0, H - 6, W, 'w');
    door(p, dx, H - 22, 10, 16, 'X', 'k');
    sign(p, dx + 5, roofH + 3, text || 'MUSEUM', 'k', 'e');
    p.outline();
    return p;
  }

  if (kind === 'market') {
    // Trung tâm ẩm thực: mái rộng trên cột, quầy hàng sắc màu bên trong.
    const roofH = 20;
    p.rect(2, roofH, W - 4, H - roofH - 2, 'W');
    p.rect(2, roofH, W - 4, 10, 'Y');
    const colors = ['p', 'r', 'u', 'L'];
    for (let i = 0; i < Math.floor((W - 12) / 24); i++) {
      const x = 8 + i * 24;
      p.rect(x, roofH + 10, 20, H - roofH - 16, 'x').hline(x, roofH + 10, 20, 'X');
      awning(p, x - 1, roofH + 6, 22, colors[i % 4]!, 'w');
      p.rect(x + 3, roofH + 18, 14, 3, 'w').rect(x + 5, roofH + 22, 4, 3, 'u').rect(x + 11, roofH + 22, 4, 3, 'r');
    }
    for (const x of [2, W - 5]) p.rect(x, roofH, 3, H - roofH - 2, 'n');
    // mái
    p.rect(0, 2, W, roofH - 2, 'p').hline(0, 2, W, 'e');
    for (let x = 0; x < W; x += 6) p.vline(x, 4, roofH - 6, 'P');
    p.hline(0, roofH - 2, W, 'P').hline(0, roofH - 1, W, 'k');
    sign(p, W >> 1, 7, text || 'HAWKER', 'W', 'P');
    p.rect(dx - 1, H - 6, 12, 6, 's');
    p.outline();
    return p;
  }

  if (kind === 'gate') {
    // Cổng lên máy bay: khung kính, biển số cổng.
    p.rect(0, 0, W, H, 'n').rect(2, 4, W - 4, H - 6, 'z');
    for (let x = 2; x < W - 2; x += 12) p.vline(x, 4, H - 6, 'B');
    p.hline(2, 4, W - 4, 'w').rect(0, 0, W, 4, 'P').hline(0, 0, W, 'p');
    for (let i = 0; i < 3; i++) p.line(8 + i * 18, H - 6, 20 + i * 18, 6, 'w');
    sign(p, dx + 5, 5, text || 'GATE 1', 'k', 'e');
    door(p, dx, H - 18, 10, 16, 'B', 'n');
    p.outline();
    return p;
  }

  if (kind === 'counter' || kind === 'terminal') {
    // Quầy làm thủ tục / hải quan: bàn dài, màn hình, biển treo.
    p.rect(0, 14, W, H - 14, 'W').hline(0, 14, W, 'w').rect(0, 0, W, 14, 'P').hline(0, 0, W, 'p').hline(0, 13, W, 'k');
    p.rect(1, H - 22, W - 2, 18, 'p').hline(1, H - 22, W - 2, 'e').hline(1, H - 5, W - 2, 'P').rect(1, H - 4, W - 2, 3, 'k');
    for (let x = 6; x < W - 12; x += 22) {
      p.rect(x, H - 34, 11, 8, 'o').rect(x + 1, H - 33, 9, 6, night ? 'e' : 'z').rect(x + 4, H - 26, 3, 3, 'n');
      p.rect(x + 14 > W - 6 ? x : x + 12, H - 25, 5, 3, 'w');
    }
    drawText(p, 4, 4, '', 'w');
    sign(p, W >> 1, 3, text || 'TICKET', 'k', 'e');
    p.rect(dx, H - 14, 10, 12, 'P').rect(dx + 1, H - 13, 8, 10, 'W');
    p.outline();
    return p;
  }

  // ---- nhà thường: mái ngói + tường + cửa sổ + cửa
  const wallH = Math.min(h >= 4 ? 40 : h === 3 ? 30 : 22, H - 12);
  const roofH = H - wallH;
  const hotel = kind === 'hotel';
  // mái
  if (hotel) {
    p.rect(0, 0, W, roofH, 'P').hline(0, 0, W, 'p');
    for (let x = 0; x < W; x += 8) p.rect(x, 4, 4, roofH - 6, 'p');
    p.hline(0, roofH - 1, W, 'k');
  } else {
    shingles(p, 0, 0, W, roofH, kind === 'station' ? 'B' : 'r', kind === 'station' ? 'n' : 'R');
    // ống khói / cửa sổ mái
    if (W >= 48 && roofH >= 16) {
      p.rect(W - 14, 2, 6, roofH - 4, 'Y').hline(W - 15, 2, 8, 'W').rect(W - 13, 0, 4, 2, 'n');
      p.rect(8, roofH - 14, 10, 12, 'Y').rect(9, roofH - 13, 8, 8, night ? 'e' : 'z').hline(7, roofH - 15, 12, 'R');
    }
    p.hline(0, roofH - 2, W, 'R').hline(0, roofH - 1, W, 'k');
  }
  // tường
  const body = kind === 'station' ? 'W' : hotel ? 'W' : 'y';
  p.rect(0, roofH, W, wallH, body).hline(0, roofH, W, 'Y');
  p.vline(0, roofH, wallH, 'Y').vline(W - 1, roofH, wallH, 'Y');
  p.rect(0, H - 4, W, 4, 'B').hline(0, H - 4, W, 'b');
  // cửa sổ
  const winY = roofH + 5;
  const winH = Math.max(7, Math.min(11, wallH - 20));
  for (let i = 0; i < w; i++) {
    const x = i * 16 + 3;
    if (Math.abs(x - dx) < 12) continue;
    window_(p, x + 1, winY, 8, winH, night);
    if (kind === 'house' || kind === 'pub') p.rect(x, winY + winH + 1, 10, 2, 'p').px(x + 2, winY + winH, 'p').px(x + 5, winY + winH, 'e');
  }
  // cửa + biển + mái hiên
  const dy = H - 16;
  if (kind === 'cafe' || kind === 'restaurant' || kind === 'pub' || kind === 'shop') {
    awning(p, Math.max(0, dx - 6), roofH + wallH - 22, Math.min(W, 22), kind === 'restaurant' ? 'r' : kind === 'pub' ? 'P' : 'p', 'w');
    door(p, dx, dy, 10, 14, kind === 'pub' ? 'P' : 'x', 'X');
    if (text) sign(p, W >> 1, roofH - 1, text, kind === 'pub' ? 'k' : 'W', kind === 'pub' ? 'e' : 'P');
  } else if (kind === 'hotel') {
    p.rect(dx - 5, dy - 4, 20, 3, 'u').hline(dx - 5, dy - 4, 20, 'e').hline(dx - 5, dy - 2, 20, 'U');
    door(p, dx, dy, 10, 14, 'U', 'X');
    p.rect(dx + 1, dy + 1, 8, 12, night ? 'e' : 'z').vline(dx + 5, dy + 1, 12, 'u');
    sign(p, W >> 1, roofH - 1, text || 'HOTEL', 'k', 'e');
  } else if (kind === 'station') {
    p.rect(dx - 3, dy - 6, 16, 20, 'p').rect(dx - 2, dy - 5, 14, 19, 'P').rect(dx, dy - 2, 10, 16, night ? 'e' : 'z');
    sign(p, W >> 1, roofH - 1, text || 'MRT', 'p', 'w');
    p.rect(1, roofH + 3, 6, 6, 'p').px(3, roofH + 5, 'w').px(4, roofH + 5, 'w');
  } else if (kind === 'garden') {
    door(p, dx, dy, 10, 14);
    p.rect(0, roofH, W, 4, 'L');
    if (text) sign(p, W >> 1, roofH - 1, text, 'W', 'h');
  } else {
    door(p, dx, dy, 10, 14);
    if (text) sign(p, W >> 1, roofH - 1, text, 'W', 'P');
  }
  p.outline();
  return p;
}

/** Biến thể màu tường/mái cho nhà thường (đổi vai màu, không thêm màu mới). */
export const FACADE_VARIANTS: Record<string, string>[] = [
  {},
  { y: 'e', Y: 'u', r: 'p', R: 'P' },
  { y: 'W', Y: 'S', r: 'R', R: 'o' },
];
