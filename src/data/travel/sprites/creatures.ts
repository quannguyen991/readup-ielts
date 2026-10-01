/**
 * ĐỘNG VẬT và PHƯƠNG TIỆN: bồ câu, chim sẻ, mèo; xe buýt hai tầng, taxi, tàu MRT,
 * thuyền, máy bay. Neo giữa-đáy. Phương tiện nhìn nghiêng quay sang phải (lật
 * ngang khi chạy chiều ngược — bộ vẽ lo).
 */
import { Paint } from './paint';
import type { SpriteDef } from './props';

const set = (frames: Paint[]): SpriteDef => ({ w: frames[0]!.w, h: frames[0]!.h, frames: frames.map((f) => f.toRows()) });

function pigeonWalk(step: number): Paint {
  const p = new Paint(14, 12);
  p.ellipse(7, 10, 5, 1, 'k');
  p.ellipse(7, 6, 4, 3, 'B').ellipse(6, 5, 3, 2, 'b');
  p.rect(9, 3, 3, 3, 'B').px(11, 4, 'o').px(12, 5, 'u');
  p.hline(9, 6, 3, 'z').px(10, 6, 'p');
  p.rect(3, 6, 3, 2, 'n');
  p.px(6, 9 + (step ? 0 : 0), 'r').px(8, 9, 'r').px(step ? 7 : 6, 10, 'r');
  p.outline();
  return p;
}

function pigeonFly(up: boolean): Paint {
  const p = new Paint(20, 14);
  p.ellipse(10, 8, 4, 2, 'B').ellipse(9, 7, 3, 1, 'b');
  p.rect(13, 6, 3, 3, 'B').px(15, 7, 'u').px(14, 7, 'o');
  p.rect(4, 7, 3, 2, 'n');
  if (up) {
    p.line(9, 6, 5, 1, 'b').line(10, 6, 7, 1, 'B').line(11, 6, 14, 1, 'b');
  } else {
    p.line(9, 8, 5, 12, 'b').line(10, 8, 8, 12, 'B').line(11, 8, 14, 12, 'b');
  }
  p.outline();
  return p;
}

function sparrow(up: boolean): Paint {
  const p = new Paint(14, 10);
  p.ellipse(7, 5, 3, 2, 'x').ellipse(6, 4, 2, 1, 's');
  p.rect(9, 3, 2, 2, 'X').px(11, 4, 'u');
  p.rect(2, 5, 3, 1, 'X');
  if (up) p.line(6, 3, 3, 0, 'X').line(7, 3, 9, 0, 'X');
  else p.line(6, 6, 3, 9, 'X').line(7, 6, 9, 9, 'X');
  p.outline();
  return p;
}

function cat(sit: boolean, step = 0): Paint {
  const p = new Paint(18, 16);
  p.ellipse(9, 14, 6, 1, 'k');
  if (sit) {
    p.ellipse(8, 10, 4, 4, 'u').ellipse(8, 11, 3, 3, 'e');
    p.rect(9, 2, 6, 5, 'u').px(9, 1, 'u').px(14, 1, 'u').px(11, 4, 'o').px(13, 4, 'o').px(12, 5, 'r');
    p.rect(2, 11, 2, 3, 'U').px(2, 10, 'U').px(1, 12, 'U');
    p.hline(9, 6, 6, 'U');
  } else {
    p.rect(5, 6, 9, 5, 'u').rect(5, 9, 9, 2, 'e').hline(5, 6, 9, 'U');
    p.rect(13, 3, 4, 4, 'u').px(13, 2, 'u').px(16, 2, 'u').px(15, 4, 'o').px(16, 6, 'r');
    p.line(5, 7, 2, 4, 'U').line(5, 8, 2, 5, 'U');
    p.rect(step ? 6 : 7, 11, 2, 3, 'U').rect(step ? 11 : 10, 11, 2, 3, 'U');
  }
  p.outline();
  return p;
}

function bus(): Paint {
  const p = new Paint(56, 36);
  p.ellipse(28, 33, 26, 2, 'k');
  p.rect(2, 4, 52, 26, 'p').hline(2, 4, 52, 'e').hline(2, 17, 52, 'P').hline(2, 29, 52, 'P').px(1, 5, 'p');
  p.rect(2, 4, 3, 26, 'p');
  // cửa sổ trên và dưới
  for (let i = 0; i < 6; i++) p.rect(5 + i * 8, 7, 6, 6, 'z').hline(5 + i * 8, 7, 6, 'w').px(5 + i * 8, 7, 'w');
  for (let i = 0; i < 5; i++) p.rect(5 + i * 8, 20, 6, 6, 'z');
  p.rect(46, 19, 7, 9, 'z').vline(49, 19, 9, 'P');
  p.rect(5, 30, 48, 1, 'o');
  // biển phía trước, đèn
  p.rect(51, 15, 3, 2, 'u').px(53, 26, 'e');
  p.hline(9, 14, 20, 'W').hline(9, 15, 20, 'W');
  // bánh xe
  for (const x of [12, 40]) p.ellipse(x, 30, 4, 4, 'o').ellipse(x, 30, 2, 2, 'B').px(x, 30, 'n');
  p.outline();
  return p;
}

function taxi(): Paint {
  const p = new Paint(32, 18);
  p.ellipse(16, 16, 14, 1, 'k');
  p.rect(2, 8, 28, 6, 'u').hline(2, 8, 28, 'e').hline(2, 13, 28, 'U');
  p.rect(8, 3, 14, 6, 'u').rect(9, 4, 5, 4, 'z').rect(15, 4, 6, 4, 'z').hline(8, 3, 14, 'e');
  p.rect(12, 1, 6, 2, 'w').px(14, 2, 'o');
  p.px(29, 10, 'w').px(2, 10, 'r');
  for (const x of [8, 23]) p.ellipse(x, 14, 3, 3, 'o').ellipse(x, 14, 1, 1, 'B');
  p.outline();
  return p;
}

function mrt(): Paint {
  const p = new Paint(80, 26);
  p.ellipse(40, 24, 38, 1, 'k');
  p.rect(1, 4, 78, 17, 'W').hline(1, 4, 78, 'w').hline(1, 18, 78, 'p').hline(1, 19, 78, 'P').hline(1, 20, 78, 'B');
  for (let i = 0; i < 8; i++) p.rect(4 + i * 9, 7, 7, 7, 'z').px(4 + i * 9, 7, 'w');
  p.rect(70, 5, 8, 11, 'z').vline(74, 5, 11, 'B');
  p.rect(1, 21, 78, 2, 'n');
  p.rect(70, 15, 6, 2, 'e');
  p.outline();
  return p;
}

function plane(): Paint {
  // Máy bay nhìn từ trên, mũi hướng phải.
  const p = new Paint(48, 40);
  p.ellipse(24, 20, 20, 3, 'w').hline(8, 20, 34, 'W').px(44, 20, 'W').px(45, 20, 'p');
  p.rect(18, 4, 6, 33, 'w').rect(20, 4, 3, 33, 'W');
  p.rect(6, 14, 3, 12, 'w').rect(7, 17, 2, 6, 'W');
  p.rect(24, 12, 4, 2, 'n').rect(24, 27, 4, 2, 'n');
  p.rect(36, 19, 5, 2, 'z');
  p.hline(5, 19, 5, 'p');
  p.outline();
  return p;
}

function plane_shadow(): Paint {
  const p = new Paint(48, 40);
  p.ellipse(24, 20, 20, 3, 'k').rect(18, 4, 6, 33, 'k').rect(6, 14, 3, 12, 'k');
  return p;
}

// ---- bản nhỏ cho chế độ ảnh nền
function miniPigeon(step: number): Paint {
  const p = new Paint(8, 6);
  p.ellipse(3, 3, 2, 1, 'B').px(5, 2, 'B').px(6, 2, 'u').px(2, 2, 'b').px(0, 3, 'n');
  p.px(3, 5, 'r').px(step ? 4 : 3, 5, 'r');
  return p;
}
function miniPigeonFly(up: boolean): Paint {
  const p = new Paint(12, 8);
  p.ellipse(6, 4, 2, 1, 'B').px(8, 3, 'B').px(9, 3, 'u').px(3, 4, 'n');
  if (up) p.line(5, 3, 3, 0, 'b').line(7, 3, 9, 0, 'b');
  else p.line(5, 5, 3, 7, 'b').line(7, 5, 9, 7, 'b');
  return p;
}
function miniBird(up: boolean): Paint {
  const p = new Paint(9, 6);
  p.px(4, 3, 'X').px(5, 3, 'X').px(6, 3, 'u');
  if (up) p.line(4, 2, 2, 0, 'X').line(5, 2, 7, 0, 'X');
  else p.line(4, 4, 2, 5, 'X').line(5, 4, 7, 5, 'X');
  return p;
}
function miniCat(): Paint {
  const p = new Paint(9, 9);
  p.ellipse(4, 6, 2, 2, 'u').rect(5, 1, 3, 3, 'u').px(5, 0, 'U').px(7, 0, 'U').px(6, 2, 'o').px(1, 7, 'U').px(0, 6, 'U');
  p.outline();
  p.ellipse(4, 8, 3, 0, 'k');
  return p;
}
function miniBoat(): Paint {
  const p = new Paint(30, 14);
  for (let i = 0; i < 9; i++) p.px(i * 2, 9 + (i % 2), i < 4 ? 'a' : 'w');
  p.rect(10, 7, 18, 4, 'R').hline(10, 7, 18, 'e').hline(10, 10, 18, 'k').px(29, 8, 'R').px(9, 8, 'R');
  p.rect(13, 3, 12, 4, 'W').hline(13, 3, 12, 'w').rect(14, 4, 2, 2, 'z').rect(18, 4, 2, 2, 'z').rect(22, 4, 2, 2, 'z');
  p.outline();
  return p;
}
function miniBus(): Paint {
  const p = new Paint(30, 18);
  p.rect(2, 3, 26, 11, 'p').hline(2, 3, 26, 'e').hline(2, 8, 26, 'P').hline(2, 13, 26, 'P');
  for (let i = 0; i < 5; i++) p.rect(4 + i * 5, 4, 3, 3, 'z').rect(4 + i * 5, 9, 3, 3, 'z');
  p.rect(24, 9, 3, 4, 'z');
  for (const x of [7, 21]) p.ellipse(x, 14, 2, 2, 'o');
  p.outline();
  p.ellipse(15, 17, 12, 0, 'k');
  return p;
}
function miniCar(): Paint {
  const p = new Paint(16, 9);
  p.rect(1, 3, 14, 3, 'o').rect(4, 1, 7, 3, 'o').rect(5, 2, 2, 1, 'z').rect(8, 2, 2, 1, 'z');
  p.px(2, 6, 'n').px(12, 6, 'n').px(14, 4, 'e');
  return p;
}
function miniPlane(): Paint {
  const p = new Paint(30, 24);
  p.rect(4, 11, 22, 2, 'w').px(26, 11, 'W').px(27, 12, 'W').rect(3, 10, 3, 1, 'p');
  p.rect(10, 3, 4, 17, 'w').rect(11, 3, 2, 17, 'W');
  p.rect(3, 8, 2, 7, 'w');
  p.rect(20, 11, 3, 1, 'z');
  p.outline();
  return p;
}
function miniPlaneShadow(): Paint {
  const p = new Paint(30, 24);
  p.rect(4, 11, 22, 2, 'k').rect(10, 3, 4, 17, 'k').rect(3, 8, 2, 7, 'k');
  return p;
}

export const CREATURES: Record<string, () => SpriteDef> = {
  pigeon_walk: () => set([pigeonWalk(0), pigeonWalk(1)]),
  pigeon_fly: () => set([pigeonFly(true), pigeonFly(false)]),
  bird_fly: () => set([sparrow(true), sparrow(false)]),
  cat_sit: () => set([cat(true)]),
  cat_walk: () => set([cat(false, 0), cat(false, 1)]),
  bus: () => set([bus()]),
  taxi: () => set([taxi()]),
  mrt: () => set([mrt()]),
  plane: () => set([plane()]),
  plane_shadow: () => set([plane_shadow()]),
  mini_pigeon_walk: () => set([miniPigeon(0), miniPigeon(1)]),
  mini_pigeon_fly: () => set([miniPigeonFly(true), miniPigeonFly(false)]),
  mini_bird_fly: () => set([miniBird(true), miniBird(false)]),
  mini_cat_sit: () => set([miniCat()]),
  mini_boat: () => set([miniBoat()]),
  mini_bus: () => set([miniBus()]),
  mini_taxi: () => set([miniCar()]),
  mini_plane: () => set([miniPlane()]),
  mini_plane_shadow: () => set([miniPlaneShadow()]),
};
