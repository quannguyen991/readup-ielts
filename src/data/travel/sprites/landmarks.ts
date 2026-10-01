/**
 * BIỂU TƯỢNG THÀNH PHỐ vẽ bằng bút pixel theo lưới palette-indexed (kế hoạch §7.2
 * mục 2). Mỗi hình có bản NGÀY và ĐÊM (cửa sổ, mặt đồng hồ, đèn sáng lên).
 * Neo giữa-đáy; kích thước cố định theo từng hình. Có thể thay bằng ảnh thật qua
 * `Atlas.registerImage('lm_mbs', url)` — mã không đổi.
 */
import { Paint, hash2 } from './paint';
import type { SpriteDef } from './props';

const pair = (day: Paint, night: Paint): SpriteDef => ({ w: day.w, h: day.h, frames: [day.toRows(), night.toRows()] });

/** Tô hình thang theo hàng: cạnh trái/phải nội suy tuyến tính từ y0 đến y1. */
function trap(p: Paint, y0: number, y1: number, l0: number, r0: number, l1: number, r1: number, c: string) {
  const n = Math.max(1, y1 - y0);
  for (let y = y0; y <= y1; y++) {
    const t = (y - y0) / n;
    const l = Math.round(l0 + (l1 - l0) * t);
    const r = Math.round(r0 + (r1 - r0) * t);
    p.hline(l, y, r - l + 1, c);
  }
}

// ============================================================ Marina Bay Sands (128×96)
function mbs(night: boolean): Paint {
  const p = new Paint(128, 96);
  const towers = [
    { x0: 10, lean: 6 },
    { x0: 50, lean: 0 },
    { x0: 90, lean: -6 },
  ];
  const yTop = 22;
  const yBot = 90;
  towers.forEach((tw, ti) => {
    for (let y = yTop; y <= yBot; y++) {
      const t = (y - yTop) / (yBot - yTop);
      const sh = Math.round(tw.lean * (1 - t));
      const xl = tw.x0 + sh;
      for (let i = 0; i < 28; i++) {
        const x = xl + i;
        const half = i < 13 ? 0 : i > 14 ? 1 : 2;
        let c: string;
        if (half === 2) c = 'd';
        else {
          const floor = y % 4 === 0;
          const lit = night && hash2(x >> 1, y >> 2, ti * 31) % 100 < 42;
          if (night) c = floor ? 'd' : lit ? 'e' : half ? 'd' : 'A';
          else c = floor ? 'z' : (x + (y >> 1)) % 5 === 0 ? 'w' : half ? 'A' : 'a';
        }
        p.px(x, y, c);
      }
      // gờ trắng hai mép
      p.px(xl, y, night ? 'A' : 'w');
      p.px(xl + 27, y, night ? 'd' : 'z');
    }
    // đỉnh tháp
    p.hline(tw.x0 + tw.lean - 1, yTop - 1, 30, night ? 'A' : 'b');
  });
  // chân đế
  p.rect(2, 88, 124, 8, 'b').hline(2, 88, 124, 'w').hline(2, 95, 124, 'B');
  for (let x = 6; x < 124; x += 9) p.rect(x, 91, 5, 3, night ? 'e' : 'z');
  for (let x = 4; x < 122; x += 14) p.ellipse(x + 3, 88, 3, 2, 'L').px(x + 3, 87, 'l');
  // SkyPark: thuyền trên ba tháp
  for (let y = 12; y <= 24; y++) {
    const t = (y - 12) / 12;
    const l = Math.round(1 + t * t * 14);
    const r = Math.round(127 - t * t * 4);
    p.hline(l, y, r - l + 1, y < 14 ? 'W' : y < 19 ? 'b' : y < 22 ? 'B' : 'n');
  }
  p.hline(0, 11, 128, 'w');
  // hồ bơi vô cực + cây
  p.rect(66, 12, 52, 2, night ? 'A' : 'a').hline(66, 12, 52, night ? 'a' : 'w');
  for (let x = 6; x < 60; x += 5) p.ellipse(x, 11, 2, 2, 'L').px(x - 1, 10, 'l');
  for (let x = 30; x < 120; x += 12) p.vline(x, 15, 3, 'B');
  if (night) for (let x = 8; x < 120; x += 6) p.px(x, 14, 'e');
  p.outline();
  return p;
}

// ============================================================ Merlion (40×60)
function merlion(night: boolean): Paint {
  const p = new Paint(40, 60);
  // nền đá
  p.ellipse(20, 56, 17, 3, 'B').ellipse(20, 54, 15, 3, 'b').rect(7, 48, 26, 7, 'b').hline(7, 48, 26, 'w').hline(7, 54, 26, 'B');
  // thân cá cong
  p.ellipse(19, 34, 8, 14, 'W').ellipse(17, 33, 5, 12, 'w');
  for (let y = 24; y < 47; y += 3) for (let x = 12 + ((y / 3) % 2) * 2; x < 28; x += 4) p.px(x, y, 'B');
  // đuôi cá cuộn
  p.line(14, 46, 8, 44, 'W').line(8, 44, 6, 38, 'W').line(9, 45, 7, 39, 'W');
  p.ellipse(6, 36, 3, 4, 'W').px(4, 34, 'B').px(6, 33, 'B');
  // đầu sư tử
  p.ellipse(20, 14, 11, 10, 'B').ellipse(20, 15, 8, 8, 'W');
  p.rect(14, 4, 12, 4, 'B');
  for (let a = 0; a < 12; a++) p.px(9 + a * 2, 5 + ((a * 3) % 5), 'B');
  p.px(16, 12, 'o').px(24, 12, 'o').px(15, 11, 'o').px(25, 11, 'o');
  p.rect(18, 15, 5, 2, 'B').rect(17, 19, 7, 3, 'o').rect(18, 20, 5, 2, 'r');
  // tia nước
  const jet: [number, number][] = [[24, 21], [28, 20], [32, 21], [35, 24], [37, 29], [38, 35], [38, 41], [39, 47]];
  for (let i = 0; i < jet.length - 1; i++) {
    p.line(jet[i]![0], jet[i]![1], jet[i + 1]![0], jet[i + 1]![1], 'a').line(jet[i]![0], jet[i]![1] + 1, jet[i + 1]![0], jet[i + 1]![1] + 1, 'w');
  }
  p.ellipse(37, 51, 3, 1, 'a');
  if (night) p.replace({ W: 'b', w: 'W' });
  p.outline();
  return p;
}

// ============================================================ Supertree (32×64)
function supertree(night: boolean): Paint {
  const p = new Paint(32, 64);
  p.ellipse(16, 62, 9, 2, 'k');
  // thân
  trap(p, 26, 60, 14, 17, 11, 21, 'n');
  p.vline(15, 28, 30, 'B');
  p.rect(10, 58, 12, 4, 'n').hline(10, 58, 12, 'B');
  // vòng đi bộ
  p.hline(8, 40, 16, 'B').hline(8, 41, 16, 'n');
  // nhánh đỡ tán
  for (let a2 = 0; a2 < 5; a2++) p.line(16, 30, 3 + a2 * 6, 17, 'n');
  // tán dù (phẳng, rộng) + mặt dưới tím hồng
  p.ellipse(16, 13, 15, 8, 'h').rect(1, 14, 30, 8, '.');
  p.ellipse(16, 12, 14, 7, 'L').rect(2, 14, 28, 7, '.');
  p.ellipse(16, 20, 14, 3, 'P').rect(0, 14, 32, 4, '.');
  p.ellipse(16, 21, 12, 2, 'p');
  for (let i = 0; i < 24; i++) {
    const x = 3 + ((i * 7) % 26);
    const y = 7 + ((i * 5) % 9);
    p.px(x, y, i % 3 === 0 ? 'l' : i % 3 === 1 ? 'h' : 'g');
  }
  p.ellipse(12, 8, 6, 2, 'l');
  if (night) {
    for (let i = 0; i < 20; i++) p.px(4 + ((i * 11) % 24), 19 + ((i * 7) % 4), i % 2 ? 'e' : 'w');
    p.ellipse(16, 22, 11, 2, 'e');
  } else p.px(22, 14, 'e').px(9, 18, 'e');
  p.outline();
  return p;
}

// ============================================================ Big Ben (64×112)
function bigBen(night: boolean): Paint {
  const p = new Paint(64, 112);
  const stone = 's';
  // cánh Tòa nhà Nghị viện phía trái (thấp)
  p.rect(0, 84, 24, 28, stone).hline(0, 84, 24, 'W').vline(0, 84, 28, 'S');
  for (let x = 3; x < 22; x += 6) {
    p.rect(x, 90, 3, 8, night ? 'e' : 'o').px(x + 1, 89, night ? 'e' : 'o');
    p.rect(x, 102, 3, 6, night ? 'e' : 'o');
  }
  for (let x = 2; x < 24; x += 6) p.vline(x, 76, 8, 'S').px(x, 75, 'u').rect(x - 1, 80, 3, 4, 's');
  p.hline(0, 84, 24, 'e');
  // thân tháp
  const x0 = 24;
  p.rect(x0 + 1, 52, 20, 60, stone).vline(x0 + 1, 52, 60, 'S').vline(x0 + 20, 52, 60, 't').vline(x0 + 19, 52, 60, 'S');
  p.hline(x0 + 1, 52, 20, 'W');
  for (let y = 58; y < 108; y += 8) {
    p.hline(x0 + 1, y, 20, 't');
    p.rect(x0 + 8, y + 2, 2, 5, night ? 'e' : 'o').rect(x0 + 13, y + 2, 2, 5, night ? 'e' : 'o');
  }
  p.rect(x0 - 1, 106, 24, 6, 'S').hline(x0 - 1, 106, 24, 'W');
  // tầng đồng hồ
  p.rect(x0 - 2, 30, 26, 24, 's').vline(x0 - 2, 30, 24, 'S').vline(x0 + 23, 30, 24, 't').hline(x0 - 2, 30, 26, 'W').hline(x0 - 2, 53, 26, 't');
  for (const x of [x0 - 1, x0 + 22]) p.rect(x, 28, 2, 26, 't');
  // mặt đồng hồ
  const cx = x0 + 11;
  const cy = 42;
  p.ellipse(cx, cy, 9, 9, 'u').ellipse(cx, cy, 8, 8, night ? 'e' : 'w');
  for (let a = 0; a < 12; a++) {
    const ang = (a / 12) * Math.PI * 2;
    p.px(Math.round(cx + Math.sin(ang) * 7), Math.round(cy - Math.cos(ang) * 7), 'o');
  }
  p.line(cx, cy, cx, cy - 6, 'o').line(cx, cy, cx + 3, cy + 2, 'o').px(cx, cy, 'u');
  p.hline(cx - 5, cy - 11, 11, 'u').hline(cx - 5, cy + 11, 11, 'u');
  // tầng chuông
  p.rect(x0 + 1, 14, 20, 17, 'S').rect(x0, 12, 22, 3, 'u').hline(x0, 12, 22, 'e');
  for (const x of [x0 + 3, x0 + 9, x0 + 15]) p.rect(x, 17, 4, 11, night ? 'u' : 'o').px(x + 1, 16, night ? 'u' : 'o').px(x + 2, 16, night ? 'u' : 'o');
  p.hline(x0 + 1, 29, 20, 't');
  // mái nhọn
  for (let y = 3; y <= 12; y++) {
    const half = Math.round(1 + (y - 3) * 1.05);
    p.hline(33 - half, y, half * 2 + 2, y % 3 === 0 ? 'P' : 'n');
    p.px(33 - half, y, 'B');
  }
  p.hline(22, 12, 24, 'u');
  p.vline(33, 0, 3, 'u').px(33, 0, 'e');
  p.rect(x0 + 2, 11, 18, 1, 'u');
  for (const x of [x0 - 1, x0 + 22]) p.rect(x, 7, 2, 7, 'u').px(x, 6, 'e');
  p.outline();
  return p;
}

// ============================================================ Tower Bridge (128×64)
function towerBridge(night: boolean): Paint {
  const p = new Paint(128, 64);
  const tower = (x0: number) => {
    p.rect(x0, 12, 22, 46, 'B').vline(x0, 12, 46, 'b').vline(x0 + 21, 12, 46, 'n').vline(x0 + 20, 12, 46, 'n');
    for (const t of [x0 - 1, x0 + 19]) {
      p.rect(t, 6, 4, 8, 'B').rect(t, 7, 1, 7, 'b');
      trap(p, 0, 6, t + 1, t + 2, t - 1, t + 4, 'A');
    }
    trap(p, 2, 12, x0 + 10, x0 + 11, x0 + 3, x0 + 18, 'A');
    for (let y = 18; y < 56; y += 9) {
      p.rect(x0 + 4, y, 4, 6, night ? 'e' : 'o').rect(x0 + 13, y, 4, 6, night ? 'e' : 'o');
      p.hline(x0, y + 7, 22, 'n');
    }
    p.rect(x0 + 7, 30, 8, 7, 'S').frame(x0 + 7, 30, 8, 7, 'n');
    p.rect(x0 - 1, 56, 24, 6, 'n').hline(x0 - 1, 56, 24, 'B');
  };
  tower(24);
  tower(82);
  // lối đi trên cao
  p.rect(44, 14, 38, 5, 'A').rect(44, 15, 38, 3, night ? 'e' : 'z').hline(44, 14, 38, 'd').hline(44, 19, 38, 'd');
  for (let x = 48; x < 82; x += 6) p.vline(x, 15, 3, 'd');
  // xích treo
  for (let x = 0; x <= 24; x++) {
    const y = Math.round(40 + (x - 24) * (x - 24) * 0.04 - 12 + 12);
    p.px(x, Math.min(y, 52) - 6, 'A');
  }
  for (let x = 104; x < 128; x++) {
    const y = Math.round(40 + (x - 104) * (x - 104) * 0.04 - 12 + 12);
    p.px(x, Math.min(y, 52) - 6, 'A');
  }
  p.line(0, 50, 24, 20, 'A').line(104, 20, 127, 50, 'A');
  for (let x = 4; x < 24; x += 4) p.vline(x, 20 + Math.round((24 - x) * 0.9), 50 - 20 - Math.round((24 - x) * 0.9), 'd');
  for (let x = 108; x < 128; x += 4) p.vline(x, 20 + Math.round((x - 104) * 0.9), 50 - 20 - Math.round((x - 104) * 0.9), 'd');
  // mặt cầu
  p.rect(0, 52, 128, 6, 'n').hline(0, 52, 128, 'B').hline(0, 57, 128, 'k');
  for (let x = 2; x < 128; x += 4) p.px(x, 55, 'e');
  p.rect(44, 50, 38, 2, 'A');
  p.outline();
  return p;
}

// ============================================================ hộp điện thoại đỏ (14×26)
function phoneBox(night: boolean): Paint {
  const p = new Paint(14, 26);
  p.ellipse(7, 24, 6, 1, 'k');
  p.rect(1, 3, 12, 21, 'p').rect(1, 1, 12, 3, 'P').hline(2, 0, 10, 'P').hline(3, 1, 8, 'p');
  p.rect(5, 1, 4, 2, 'w');
  for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) p.rect(2 + i * 5, 5 + j * 6, 4, 5, night ? 'e' : 'z');
  p.vline(6, 4, 19, 'P').vline(7, 4, 19, 'P').hline(1, 23, 12, 'P');
  p.outline();
  return p;
}

// ============================================================ Tháp Eiffel (64×128) — bản đầu
function eiffel(night: boolean): Paint {
  const p = new Paint(64, 128);
  const leg = (xl: number, xr: number, y0: number, y1: number, w0: number, w1: number) => {
    // hai thanh cong, nối bằng thanh chéo
    for (let y = y0; y <= y1; y++) {
      const t = (y - y0) / (y1 - y0);
      const l = Math.round(xl + (32 - w0 - xl) * 0 + (xl - 32 + w0) * 0);
      void l;
      const half = Math.round(w0 + (w1 - w0) * (t * t * 0.4 + t * 0.6));
      p.px(32 - half, y, 'u').px(32 + half, y, 'u').px(32 - half + 1, y, 'U').px(32 + half - 1, y, 'U');
      if (y % 6 === 0) p.hline(32 - half, y, half * 2 + 1, 'U');
      if (xr) void xr;
    }
  };
  // thân: bán kính thu hẹp theo y
  leg(0, 0, 4, 122, 1, 26);
  // tầng 1 và 2
  p.rect(6, 100, 52, 4, 'u').hline(6, 100, 52, 'e').hline(6, 104, 52, 'U');
  p.rect(20, 52, 24, 3, 'u').hline(20, 52, 24, 'e').hline(20, 55, 24, 'U');
  p.rect(28, 22, 8, 2, 'u');
  // vòm chân
  for (let x = 14; x < 50; x++) {
    const t = (x - 14) / 36;
    const y = 122 - Math.round(Math.sin(t * Math.PI) * 14);
    p.px(x, y, 'U').px(x, y + 1, 'u');
  }
  // chéo
  for (let y = 60; y < 100; y += 8) {
    const t = (y - 4) / 118;
    const half = Math.round(1 + 25 * (t * t * 0.4 + t * 0.6));
    p.line(32 - half, y, 32, y + 8, 'U').line(32 + half, y, 32, y + 8, 'U');
  }
  p.vline(32, 0, 5, 'U').px(32, 0, night ? 'e' : 'u');
  if (night) for (let y = 8; y < 118; y += 4) { const t = (y - 4) / 118; const half = Math.round(1 + 25 * (t * t * 0.4 + t * 0.6)); p.px(32 - half, y, 'e').px(32 + half, y, 'e'); }
  p.outline();
  return p;
}

// ============================================================ Colosseum (128×80) — bản đầu
function colosseum(night: boolean): Paint {
  const p = new Paint(128, 80);
  p.ellipse(64, 66, 62, 12, 'B');
  p.rect(2, 22, 124, 48, 'S');
  p.ellipse(64, 70, 62, 8, 'S');
  for (let tier = 0; tier < 3; tier++) {
    const y = 28 + tier * 14;
    p.hline(2, y - 2, 124, 'Y');
    for (let x = 6; x < 124; x += 8) {
      p.rect(x, y, 5, 9, night ? 'u' : 'o').px(x, y, night ? 'u' : 'o').px(x + 4, y, night ? 'u' : 'o').rect(x + 1, y - 1, 3, 1, night ? 'u' : 'o');
    }
  }
  p.rect(2, 16, 124, 8, 'Y').hline(2, 16, 124, 'W');
  for (let x = 6; x < 124; x += 8) p.rect(x, 18, 3, 4, 'o');
  // phần vỡ góc phải
  p.rect(100, 10, 28, 14, '.');
  trap(p, 10, 24, 100, 104, 100, 126, 'S');
  p.outline();
  return p;
}

// ============================================================ nhà kênh Amsterdam (3 kiểu, 24×44)
function canalHouse(kind: number, night: boolean): Paint {
  const p = new Paint(24, 44);
  const brick = ['y', 'Y', 'p'][kind % 3]!;
  const dark = ['Y', 'R', 'P'][kind % 3]!;
  p.rect(2, 12, 20, 32, brick).vline(2, 12, 32, dark).vline(21, 12, 32, dark);
  // đầu hồi bậc thang / chuông / cổ
  if (kind === 0) for (let i = 0; i < 5; i++) p.rect(2 + i * 2, 12 - (i < 3 ? i * 2 : (4 - i) * 2) - 2, 20 - i * 4, 2, brick);
  if (kind === 1) { p.ellipse(12, 10, 10, 6, brick); p.rect(2, 10, 20, 4, brick); p.rect(10, 1, 4, 3, brick); }
  if (kind === 2) { trap(p, 0, 12, 12, 12, 2, 21, brick); p.px(12, 0, 'w'); p.rect(11, 3, 3, 3, 'w'); }
  for (let j = 0; j < 3; j++) for (const x of [5, 15]) p.rect(x, 15 + j * 9, 4, 6, night ? 'e' : 'z').frame(x - 1, 14 + j * 9, 6, 8, 'w');
  p.rect(9, 36, 6, 8, 'X').hline(8, 35, 8, 'w');
  p.hline(1, 43, 22, 'B');
  p.outline();
  return p;
}

// ============================================================ cối xay gió (48×64), 4 khung cánh quạt
function windmill(frame: number): Paint {
  const p = new Paint(48, 64);
  p.ellipse(24, 60, 14, 2, 'k');
  trap(p, 22, 60, 17, 30, 10, 38, 'y');
  trap(p, 22, 60, 17, 18, 10, 12, 'Y');
  p.rect(10, 56, 29, 4, 'b').hline(10, 56, 29, 'w');
  p.rect(20, 48, 8, 12, 'X').rect(21, 49, 6, 11, 'x');
  p.rect(19, 36, 4, 6, 'z').rect(26, 36, 4, 6, 'z');
  trap(p, 10, 22, 24, 24, 13, 35, 'R');
  trap(p, 10, 22, 24, 24, 24, 35, 'r');
  p.px(24, 9, 'u');
  const cx = 24;
  const cy = 22;
  const base = (frame / 4) * (Math.PI / 2);
  for (let k = 0; k < 4; k++) {
    const a = base + (k * Math.PI) / 2;
    const ex = Math.round(cx + Math.cos(a) * 21);
    const ey = Math.round(cy + Math.sin(a) * 21);
    p.line(cx, cy, ex, ey, 'X');
    // lưới cánh
    const nx = -Math.sin(a);
    const ny = Math.cos(a);
    for (let s = 5; s <= 20; s += 1) {
      const px = Math.round(cx + Math.cos(a) * s + nx * 3);
      const py = Math.round(cy + Math.sin(a) * s + ny * 3);
      p.px(px, py, s % 2 ? 'w' : 'W').px(Math.round(px + nx), Math.round(py + ny), 'W');
    }
  }
  p.ellipse(cx, cy, 2, 2, 'u');
  p.outline();
  return p;
}

export const LANDMARKS: Record<string, () => SpriteDef> = {
  lm_mbs: () => pair(mbs(false), mbs(true)),
  lm_merlion: () => pair(merlion(false), merlion(true)),
  lm_supertree: () => pair(supertree(false), supertree(true)),
  lm_bigben: () => pair(bigBen(false), bigBen(true)),
  lm_tower_bridge: () => pair(towerBridge(false), towerBridge(true)),
  lm_phonebox: () => pair(phoneBox(false), phoneBox(true)),
  lm_eiffel: () => pair(eiffel(false), eiffel(true)),
  lm_colosseum: () => pair(colosseum(false), colosseum(true)),
  lm_canal_a: () => pair(canalHouse(0, false), canalHouse(0, true)),
  lm_canal_b: () => pair(canalHouse(1, false), canalHouse(1, true)),
  lm_canal_c: () => pair(canalHouse(2, false), canalHouse(2, true)),
  lm_windmill: () => ({ w: 48, h: 64, frames: [0, 1, 2, 3].map((f) => windmill(f).toRows()) }),
};

/** Sprite có hai khung ngày/đêm (khung 0 ngày, 1 đêm) — còn lại là sprite hoạt cảnh. */
export const DAY_NIGHT_SPRITES = new Set(Object.keys(LANDMARKS).filter((k) => k !== 'lm_windmill'));
