/**
 * NGƯỜI: lữ khách (4 hướng × 3 khung bước) và 8 kiểu người đi đường / NPC.
 * Ô 16×24, neo ở giữa-đáy (chân). Vẽ bằng bút theo "kiểu" (tóc, áo, quần, phụ kiện)
 * nên mọi hướng và khung bước nhất quán; hướng phải là lật ngang hướng trái.
 *
 * Khung 0 = đứng, 1 = bước chân trái, 2 = bước chân phải; vòng đi bộ 0,1,0,2.
 */
import { Paint } from './paint';
import type { SpriteDef } from './props';

export type Dir = 'down' | 'up' | 'left' | 'right';
export const DIRS: Dir[] = ['down', 'up', 'left', 'right'];

export type PersonStyle = {
  hair: string;
  shirt: string;
  shirtD: string;
  pants: string;
  shoes?: string;
  skin?: string;
  skinD?: string;
  /** cap: mũ lưỡi trai · hat: nón rộng vành · long: tóc dài · bun: búi tóc · none */
  head?: 'cap' | 'hat' | 'long' | 'bun' | 'none' | 'bald';
  apron?: boolean;
  tie?: boolean;
  bag?: boolean;
  dress?: boolean;
  kid?: boolean;
  stick?: boolean;
};

function person(dir: Dir, frame: 0 | 1 | 2, st: PersonStyle): Paint {
  const p = new Paint(16, 24);
  const skin = st.skin ?? 'c';
  const skinD = st.skinD ?? 'C';
  const shoes = st.shoes ?? 'o';
  const kid = !!st.kid;
  // Nhún người một điểm ở khung bước.
  const bob = frame === 0 ? 0 : 1;
  const top = (kid ? 6 : 2) + bob; // đỉnh đầu
  const legTop = kid ? 17 : 17;
  const legH = kid ? 4 : 5;
  const sideView = dir === 'left' || dir === 'right';

  // Bóng
  p.ellipse(8, 22, 5, 1, 'k');

  // Chân
  const stepA = frame === 1 ? 1 : 0;
  const stepB = frame === 2 ? 1 : 0;
  if (!sideView) {
    p.rect(5, legTop + stepA, 2, legH - stepA, st.dress ? skin : st.pants);
    p.rect(9, legTop + stepB, 2, legH - stepB, st.dress ? skin : st.pants);
    p.rect(5, legTop + legH - 1 + 0 - stepA + 0, 2, 1, shoes);
    p.rect(9, legTop + legH - 1 - stepB, 2, 1, shoes);
    // chân đứng sau lùi lên (giả bước)
    if (frame) p.rect(frame === 1 ? 5 : 9, legTop + legH - 1 - (frame === 1 ? stepA : stepB) + 1, 2, 1, 'k');
  } else {
    const swing = frame === 0 ? 0 : frame === 1 ? 2 : -2;
    p.rect(7 + swing, legTop, 2, legH, st.dress ? skin : st.pants);
    p.rect(7 + swing, legTop + legH - 1, 3, 1, shoes);
    if (frame) {
      p.rect(7 - swing, legTop, 2, legH - 1, st.dress ? skin : st.pants);
      p.rect(7 - swing, legTop + legH - 2, 3, 1, shoes);
    } else {
      p.rect(7, legTop, 2, legH, st.dress ? skin : st.pants);
    }
  }

  // Thân
  const torsoTop = top + 7;
  const torsoH = Math.max(4, legTop - torsoTop + (st.dress ? 3 : 1));
  if (!sideView) {
    p.rect(4, torsoTop, 8, torsoH, st.shirt);
    p.vline(11, torsoTop, torsoH, st.shirtD).hline(4, torsoTop + torsoH - 1, 8, st.shirtD);
    // tay
    const armSwing = frame === 0 ? 0 : 1;
    p.rect(3, torsoTop + 1 + (frame === 1 ? 1 : 0), 1, 4 - armSwing, st.shirt);
    p.rect(12, torsoTop + 1 + (frame === 2 ? 1 : 0), 1, 4 - armSwing, st.shirtD);
    p.px(3, torsoTop + 4 + (frame === 1 ? 1 : 0) - armSwing, skin).px(12, torsoTop + 4 + (frame === 2 ? 1 : 0) - armSwing, skin);
    if (st.apron) p.rect(5, torsoTop + 2, 6, torsoH - 2, 'w').hline(5, torsoTop + 2, 6, 'W');
    if (st.tie) p.vline(8, torsoTop, 4, 'r');
    if (st.bag && dir === 'up') p.rect(5, torsoTop, 6, 6, 'u').hline(5, torsoTop, 6, 'U');
    if (st.bag && dir === 'down') p.vline(5, torsoTop, 5, 'U').vline(10, torsoTop, 5, 'U');
  } else {
    p.rect(5, torsoTop, 6, torsoH, st.shirt).vline(10, torsoTop, torsoH, st.shirtD).hline(5, torsoTop + torsoH - 1, 6, st.shirtD);
    const sw = frame === 0 ? 0 : frame === 1 ? -1 : 1;
    p.rect(7 + sw, torsoTop + 1, 2, 4, st.shirtD).px(7 + sw, torsoTop + 5, skin);
    if (st.bag) p.rect(dir === 'left' ? 9 : 4, torsoTop, 3, 6, 'u').hline(dir === 'left' ? 9 : 4, torsoTop, 3, 'U');
    if (st.apron) p.rect(dir === 'left' ? 4 : 7, torsoTop + 2, 4, torsoH - 2, 'w');
  }
  if (st.dress) p.hline(4, torsoTop + torsoH - 1, 8, st.shirtD);

  // Đầu
  const hx = 4;
  p.rect(hx, top, 8, 7, skin);
  p.hline(hx, top + 6, 8, skinD);
  if (dir === 'down') {
    p.px(6, top + 4, 'o').px(9, top + 4, 'o');
    p.px(7, top + 6, 'C').px(8, top + 6, 'C');
  } else if (dir === 'up') {
    p.rect(hx, top, 8, 7, st.hair);
    p.hline(hx, top + 6, 8, skinD);
  } else {
    const fx = dir === 'left' ? hx + 1 : hx + 6;
    p.px(fx, top + 4, 'o');
    // gáy có tóc
    const bx = dir === 'left' ? hx + 4 : hx;
    p.rect(bx, top, 4, 5, st.hair);
  }
  // Tóc / mũ
  const headKind = st.head ?? 'none';
  if (headKind !== 'bald') {
    p.rect(hx - (headKind === 'hat' ? 1 : 0), top - 1, 8 + (headKind === 'hat' ? 2 : 0), 2, st.hair);
    if (dir === 'down' || sideView) p.hline(hx, top + 1, 8, st.hair);
  }
  if (headKind === 'long') {
    if (dir === 'down') p.vline(3, top + 1, 7, st.hair).vline(12, top + 1, 7, st.hair);
    if (dir === 'up') p.rect(hx - 1, top, 10, 9, st.hair);
    if (sideView) p.rect(dir === 'left' ? hx + 3 : hx - 0, top, 5, 9, st.hair);
  }
  if (headKind === 'bun') p.rect(6, top - 3, 4, 3, st.hair).hline(7, top - 3, 2, 'o');
  if (headKind === 'cap') {
    p.rect(hx, top - 2, 8, 3, st.shirtD).hline(hx, top, 8, 'o');
    if (dir === 'down') p.hline(hx + 1, top + 1, 6, st.shirtD);
    if (dir === 'left') p.hline(hx - 1, top, 4, st.shirtD);
    if (dir === 'right') p.hline(hx + 5, top, 4, st.shirtD);
  }
  if (headKind === 'hat') {
    p.rect(hx - 1, top, 10, 1, 'e').rect(hx + 1, top - 3, 6, 3, 'u').hline(hx + 1, top - 1, 6, 'U');
  }
  if (st.stick) p.vline(dir === 'right' ? 4 : 11, torsoTop + 3, 12, 'X');

  p.outline();
  return p;
}

function frames(dir: Dir, st: PersonStyle): string[][] {
  const f = (n: 0 | 1 | 2) => {
    if (dir === 'right') return person('left', n, st).flipH().toRows();
    return person(dir, n, st).toRows();
  };
  return [f(0), f(1), f(2)];
}

/** Màu áo cho 8 bộ trang phục của lữ khách (state.prefs.outfit % 8). */
export const OUTFITS: PersonStyle[] = [
  { hair: 'X', shirt: 'p', shirtD: 'P', pants: 'n', bag: true, head: 'cap' },
  { hair: 'o', shirt: 'u', shirtD: 'U', pants: 'P', bag: true },
  { hair: 'X', shirt: 'r', shirtD: 'R', pants: 'n', bag: true, head: 'long' },
  { hair: 'o', shirt: 'z', shirtD: 'A', pants: 'n', bag: true, head: 'cap' },
  { hair: 'X', shirt: 'L', shirtD: 'h', pants: 'X', bag: true, head: 'hat' },
  { hair: 'o', shirt: 'w', shirtD: 'B', pants: 'P', bag: true },
  { hair: 'x', shirt: 'P', shirtD: 'o', pants: 'n', bag: true, head: 'bun' },
  { hair: 'X', shirt: 'e', shirtD: 'U', pants: 'R', bag: true, head: 'long' },
];

export const NPC_STYLES: Record<string, PersonStyle> = {
  npc_tourist: { hair: 'X', shirt: 'z', shirtD: 'A', pants: 'Y', bag: true, head: 'hat' },
  npc_staff: { hair: 'o', shirt: 'p', shirtD: 'P', pants: 'P', head: 'cap', tie: false },
  npc_vendor: { hair: 'o', shirt: 'y', shirtD: 'Y', pants: 'n', apron: true, head: 'cap' },
  npc_business: { hair: 'o', shirt: 'n', shirtD: 'k', pants: 'k', tie: true, shoes: 'o' },
  npc_kid: { hair: 'X', shirt: 'r', shirtD: 'R', pants: 'p', kid: true },
  npc_elder: { hair: 'b', shirt: 'L', shirtD: 'h', pants: 'X', stick: true, head: 'bald' },
  npc_local: { hair: 'o', shirt: 'r', shirtD: 'R', pants: 'R', head: 'long', dress: true },
  npc_guard: { hair: 'o', shirt: 'P', shirtD: 'k', pants: 'k', head: 'cap', shoes: 'o' },
};

/**
 * BẢN NHỎ (chibi 10×14) cho chế độ ảnh nền: tranh nền có người đi đường chỉ cao ~6 điểm, nên nhân vật
 * chính cao ~12 điểm là vừa; vẽ cùng "mật độ điểm ảnh" với tranh để không bị lạc tông.
 */
function miniPerson(dir: Dir, frame: 0 | 1 | 2, st: PersonStyle): Paint {
  const p = new Paint(10, 14);
  const skin = st.skin ?? 'c';
  const shoes = st.shoes ?? 'o';
  const side = dir === 'left' || dir === 'right';
  const kid = !!st.kid;
  const top = kid ? 3 : 1;
  // chân
  const a = frame === 1 ? 1 : 0;
  const b = frame === 2 ? 1 : 0;
  const legY = top + 8;
  if (side) {
    const sw = frame === 0 ? 0 : frame === 1 ? 1 : -1;
    p.rect(4 + sw, legY, 2, 3, st.dress ? skin : st.pants);
    p.rect(4 - sw, legY, 2, 3 - (frame ? 1 : 0), st.dress ? skin : st.pants);
    p.px(4 + sw, legY + 3, shoes).px(5 + sw, legY + 3, shoes);
  } else {
    p.rect(3, legY + a, 2, 3 - a, st.dress ? skin : st.pants);
    p.rect(5, legY + b, 2, 3 - b, st.dress ? skin : st.pants);
    p.hline(3, legY + 3, 4, shoes);
  }
  // thân
  const ty = top + 5;
  p.rect(2, ty, 6, 3, st.shirt).hline(2, ty + 2, 6, st.shirtD);
  if (!side) {
    p.px(1, ty, st.shirt).px(1, ty + 1, skin).px(8, ty, st.shirtD).px(8, ty + 1, skin);
    if (st.apron) p.rect(3, ty + 1, 4, 2, 'w');
    if (st.tie) p.px(5, ty, 'r').px(5, ty + 1, 'r');
    if (st.bag && dir === 'up') p.rect(3, ty, 4, 3, 'u');
    if (st.bag && dir === 'down') p.px(2, ty, 'U').px(7, ty, 'U').px(3, ty + 1, 'U');
  } else {
    p.px(dir === 'left' ? 4 : 5, ty + 1, st.shirtD);
    if (st.bag) p.rect(dir === 'left' ? 6 : 1, ty, 2, 3, 'u');
    if (st.apron) p.rect(dir === 'left' ? 2 : 5, ty + 1, 3, 2, 'w');
  }
  if (st.dress) p.hline(2, ty + 3, 6, st.shirtD);
  // đầu
  p.rect(2, top, 6, 5, skin);
  const hk = st.head ?? 'none';
  if (dir === 'down') p.px(3, top + 3, 'o').px(6, top + 3, 'o');
  if (dir === 'up') p.rect(2, top, 6, 4, st.hair);
  if (side) {
    p.px(dir === 'left' ? 3 : 6, top + 3, 'o');
    p.rect(dir === 'left' ? 5 : 2, top, 3, 4, st.hair);
  }
  if (hk !== 'bald') p.rect(2, top, 6, 2, st.hair);
  if (hk === 'long') {
    if (dir === 'down') p.vline(1, top + 1, 4, st.hair).vline(8, top + 1, 4, st.hair);
    else p.rect(1, top, 8, 6, st.hair);
  }
  if (hk === 'bun') p.rect(4, top - 1, 2, 1, st.hair);
  if (hk === 'cap') {
    p.rect(2, top, 6, 2, st.shirtD);
    if (dir === 'down') p.hline(2, top + 2, 6, st.shirtD);
    if (dir === 'left') p.hline(1, top + 1, 3, st.shirtD);
    if (dir === 'right') p.hline(6, top + 1, 3, st.shirtD);
  }
  if (hk === 'hat') p.rect(1, top, 8, 1, 'e').rect(3, top - 1, 4, 1, 'u');
  p.outline();
  p.ellipse(5, 13, 3, 0, 'k');
  return p;
}

function miniFrames(dir: Dir, st: PersonStyle): string[][] {
  const f = (n: 0 | 1 | 2) => (dir === 'right' ? miniPerson('left', n, st).flipH().toRows() : miniPerson(dir, n, st).toRows());
  return [f(0), f(1), f(2)];
}

/**
 * BẢN "CHIBI" kiểu Bến Dừa (16×24, đầu to ~42% chiều cao, viền, đi 3 khung × 4 hướng) cho chế độ đối tượng.
 * Hàng chân = 21 (bóng ở hàng 22).
 */
function chibiPerson(dir: Dir, frame: 0 | 1 | 2, st: PersonStyle): Paint {
  const p = new Paint(16, 24);
  const skin = st.skin ?? 'c';
  const skinD = st.skinD ?? 'C';
  const shoes = st.shoes ?? 'o';
  const side = dir === 'left' || dir === 'right';
  const off = st.kid ? 3 : 0;
  const bob = frame === 0 ? 0 : 1;
  const legTop = 17;
  const legH = 4 - (st.kid ? 1 : 0);
  const a = frame === 1 ? 1 : 0;
  const b = frame === 2 ? 1 : 0;
  const pantsC = st.dress ? skin : st.pants;
  // chân
  if (side) {
    const sw = frame === 0 ? 0 : frame === 1 ? 2 : -2;
    p.rect(7 + sw, legTop + off, 3, legH, pantsC).rect(7 + sw, legTop + off + legH, 3, 1, shoes);
    if (frame) p.rect(7 - sw, legTop + off, 3, legH - 1, pantsC).rect(7 - sw, legTop + off + legH - 1, 3, 1, shoes);
  } else {
    p.rect(5, legTop + off + a, 2, legH - a, pantsC).rect(9, legTop + off + b, 2, legH - b, pantsC);
    p.rect(4, legTop + off + legH, 3, 1, shoes).rect(9, legTop + off + legH, 3, 1, shoes);
    if (a) p.rect(4, legTop + off + legH - 1, 3, 1, shoes);
    if (b) p.rect(9, legTop + off + legH - 1, 3, 1, shoes);
  }
  // thân
  const ty = 10 + off - bob * 0;
  p.rect(4, ty, 8, 7, st.shirt).hline(4, ty + 6, 8, st.shirtD).vline(11, ty, 7, st.shirtD);
  if (!side) {
    p.rect(3, ty + 1 + a, 1, 4, st.shirt).rect(12, ty + 1 + b, 1, 4, st.shirtD);
    p.px(3, ty + 5 + a, skin).px(12, ty + 5 + b, skin);
    if (st.apron) p.rect(5, ty + 2, 6, 5, 'w').hline(5, ty + 2, 6, 'W');
    if (st.tie) p.vline(8, ty, 4, 'r');
    if (st.bag && dir === 'up') p.rect(5, ty, 6, 6, 'u').hline(5, ty, 6, 'U');
    if (st.bag && dir === 'down') p.vline(5, ty, 5, 'U').vline(10, ty, 5, 'U');
  } else {
    const sw = frame === 0 ? 0 : frame === 1 ? -1 : 1;
    p.rect(7 + sw, ty + 1, 2, 5, st.shirtD).px(7 + sw, ty + 6, skin);
    if (st.bag) p.rect(dir === 'left' ? 9 : 4, ty, 3, 6, 'u').hline(dir === 'left' ? 9 : 4, ty, 3, 'U');
    if (st.apron) p.rect(dir === 'left' ? 4 : 7, ty + 2, 5, 5, 'w');
  }
  if (st.dress) p.hline(4, ty + 6, 8, st.shirtD).rect(3, ty + 6, 10, 1, st.shirtD);
  // đầu (to)
  const hy = off;
  p.rect(3, hy, 10, 10, skin).hline(3, hy + 9, 10, skinD);
  const hk = st.head ?? 'none';
  if (dir === 'down') {
    p.rect(5, hy + 5, 2, 2, 'o').rect(9, hy + 5, 2, 2, 'o').px(5, hy + 5, 'w').px(9, hy + 5, 'w');
    p.px(4, hy + 7, skinD).px(11, hy + 7, skinD).px(7, hy + 8, skinD).px(8, hy + 8, skinD);
  } else if (dir === 'up') {
    p.rect(3, hy, 10, 9, st.hair);
  } else {
    const fx = dir === 'left' ? 4 : 10;
    p.rect(fx, hy + 5, 2, 2, 'o').px(fx, hy + 5, 'w');
    p.px(dir === 'left' ? 3 : 12, hy + 7, skinD);
    p.rect(dir === 'left' ? 8 : 3, hy, 5, 8, st.hair);
  }
  if (hk !== 'bald') {
    p.rect(3, hy, 10, 4, st.hair);
    if (dir === 'down' || side) p.px(3, hy + 4, st.hair).px(12, hy + 4, st.hair);
  }
  if (hk === 'long') {
    if (dir === 'down') p.vline(2, hy + 3, 8, st.hair).vline(13, hy + 3, 8, st.hair);
    else p.rect(side ? (dir === 'left' ? 8 : 3) : 2, hy + 3, side ? 5 : 12, 9, st.hair);
  }
  if (hk === 'bun') p.rect(6, hy - 2, 4, 2, st.hair);
  if (hk === 'cap') {
    p.rect(3, hy - 1, 10, 5, st.shirtD);
    if (dir === 'down') p.hline(4, hy + 4, 8, st.shirtD);
    if (dir === 'left') p.hline(1, hy + 3, 5, st.shirtD);
    if (dir === 'right') p.hline(10, hy + 3, 5, st.shirtD);
  }
  if (hk === 'hat') p.rect(1, hy + 2, 14, 2, 'e').rect(4, hy - 2, 8, 4, 'u').hline(4, hy + 1, 8, 'U');
  if (st.stick) p.vline(dir === 'right' ? 3 : 13, ty + 3, 11, 'X');
  p.outline();
  p.ellipse(8, 22, 5, 0, 'k');
  return p;
}

function chibiFrames(dir: Dir, st: PersonStyle): string[][] {
  const f = (n: 0 | 1 | 2) => (dir === 'right' ? chibiPerson('left', n, st).flipH().toRows() : chibiPerson(dir, n, st).toRows());
  return [f(0), f(1), f(2)];
}

/** Người đi dạo nền: 8 kiểu trang phục khác nhau. */
export const WALKER_STYLES: PersonStyle[] = [
  { hair: 'X', shirt: 'z', shirtD: 'A', pants: 'n' },
  { hair: 'o', shirt: 'r', shirtD: 'R', pants: 'P', head: 'cap' },
  { hair: 'x', shirt: 'u', shirtD: 'U', pants: 'X', head: 'long' },
  { hair: 'o', shirt: 'L', shirtD: 'h', pants: 'n', bag: true },
  { hair: 'X', shirt: 'p', shirtD: 'P', pants: 'k', head: 'bun' },
  { hair: 'b', shirt: 'w', shirtD: 'B', pants: 'P', head: 'hat' },
  { hair: 'o', shirt: 'e', shirtD: 'U', pants: 'R', head: 'long', dress: true },
  { hair: 'X', shirt: 'n', shirtD: 'k', pants: 'k', tie: true },
];

export const PERSON_SPRITES: Record<string, () => SpriteDef> = {};

/** Mỗi người: 12 khung theo thứ tự hướng down, up, left, right × 3 khung bước. */
function register(id: string, st: PersonStyle) {
  PERSON_SPRITES[id] = () => ({
    w: 16,
    h: 24,
    frames: DIRS.flatMap((d) => frames(d, st)),
  });
}

function registerMini(id: string, st: PersonStyle) {
  PERSON_SPRITES[`mini_${id}`] = () => ({ w: 10, h: 14, frames: DIRS.flatMap((d) => miniFrames(d, st)) });
}
OUTFITS.forEach((o, i) => registerMini(`player_${i}`, o));
for (const [id, st] of Object.entries(NPC_STYLES)) registerMini(id, st);

function registerChibi(id: string, st: PersonStyle) {
  PERSON_SPRITES[`chibi_${id}`] = () => ({ w: 16, h: 24, frames: DIRS.flatMap((d) => chibiFrames(d, st)) });
}
OUTFITS.forEach((o, i) => registerChibi(`player_${i}`, o));
for (const [id, st] of Object.entries(NPC_STYLES)) registerChibi(id, st);
WALKER_STYLES.forEach((w, i) => registerChibi(`walker_${i}`, w));

register('player', OUTFITS[0]!);
OUTFITS.forEach((o, i) => register(`player_${i}`, o));
for (const [id, st] of Object.entries(NPC_STYLES)) register(id, st);

/** Chỉ số khung trong sprite người: hướng × 3 + bước. */
export function personFrame(dir: Dir, step: 0 | 1 | 2): number {
  return DIRS.indexOf(dir) * 3 + step;
}
