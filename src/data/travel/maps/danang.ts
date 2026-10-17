/**
 * ĐÀ NẴNG — CHẾ ĐỘ ĐỐI TƯỢNG, MẢNH A (trung tâm bên sông Hàn). Ảnh ĐẤT `public/travel/terrain/danang.small.png` (418×235)
 * + lưới đi được `danang.scene-walk.ts` (khoá `danang-scene`); công trình là sprite đứng riêng trong
 * `public/travel/sprites/danang/`, (x,y) là GIỮA-ĐÁY. Cầu đá bên phải nối sang mảnh E, hai vạch qua đường dưới nối sang mảnh S.
 * Gán địa điểm: chợ Hàn (ô trên giữa), tượng Phật Bà (trên phải), mì Quảng (trái trên), quán cà phê biển (trái giữa),
 * Cầu Rồng (phải giữa), Ngũ Hành Sơn (trái dưới), Bảo tàng Chăm (dưới giữa), Cầu Vàng (phải dưới); quảng trường + bể nước để trống.
 * Các sprite còn lại (airport, hoian*, japanbridge, caolau, sontra, ponagar, seafood, resort, banahills) để dành cho E/S/SE.
 */
import type { MapObject, Npc, SceneSprite } from '@/services/travel/types';
import { poiGeometry } from '@/components/travel/engine/scene';
import { imageMap, imagePoi } from './imagemap';
import { composeMask } from '@/components/travel/engine/imageWorld';
import { DANANG_SCENE_MASK, DANANG_SCENE_MASK_CELL } from './danang.scene-walk';
import { DANANG_SCENE_E_MASK } from './danang.scene-walk-e';
import { DANANG_SCENE_S_MASK } from './danang.scene-walk-s';
import { DANANG_SCENE_SE_MASK } from './danang.scene-walk-se';
import { DANANG_SCENE_EE_MASK } from './danang.scene-walk-ee';
import { DANANG_SCENE_SEE_MASK } from './danang.scene-walk-see';

/** Thế giới 2×2 mảnh 418×235 chồng nhau OV điểm (hoà Bayer): E lệch phải, S lệch xuống, SE lệch cả hai. Hộp bao 816×450. */
const PW = 418;
const PH = 235;
const OV = 20;
const EX = PW - OV;
const SY = PH - OV;
/** Cột Đông thứ hai (EE): bờ biển Mỹ Khê, nối tiếp mảnh E ở x = 2·EX (chỉ có ở hàng trên). */
const EE_X = 2 * EX;
const WORLD = { w: EE_X + PW, h: SY + PH };

const linkLine = (from: number, to: number, a: { x: number; y: number }, b: { x: number; y: number }, r = 10, step = 12) => {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
  return Array.from({ length: n + 1 }, (_, i) => ({ from, to, x: Math.round(a.x + ((b.x - a.x) * i) / n), y: Math.round(a.y + ((b.y - a.y) * i) / n), r }));
};
const LINKS_BASE = [
  { from: 0, to: 1, x: EX + OV / 2, y: 107, r: 12 }, // cầu đá bên phải A ↔ cầu bên trái E
  ...linkLine(0, 2, { x: 123, y: SY + 3 }, { x: 120, y: SY + OV - 3 }), // vạch qua đường thứ nhất
  ...linkLine(0, 2, { x: 274, y: SY + 3 }, { x: 248, y: SY + OV - 3 }), // vạch qua đường thứ hai
  ...linkLine(2, 3, { x: EX + 2, y: SY + 102 }, { x: EX + OV - 2, y: SY + 69 }),
  ...linkLine(1, 3, { x: EX + 211, y: SY + 2 }, { x: EX + 145, y: SY + OV - 2 }),
];
import { vietnamTiles } from './vietnam.tiles';

const PARTS = [
  { x: 0, y: 0, w: PW, h: PH, cell: DANANG_SCENE_MASK_CELL, rows: DANANG_SCENE_MASK },
  { x: EX, y: 0, w: PW, h: PH, cell: DANANG_SCENE_MASK_CELL, rows: DANANG_SCENE_E_MASK },
  { x: 0, y: SY, w: PW, h: PH, cell: DANANG_SCENE_MASK_CELL, rows: DANANG_SCENE_S_MASK },
  { x: EX, y: SY, w: PW, h: PH, cell: DANANG_SCENE_MASK_CELL, rows: DANANG_SCENE_SE_MASK },
  { x: EE_X, y: 0, w: PW, h: PH, cell: DANANG_SCENE_MASK_CELL, rows: DANANG_SCENE_EE_MASK },
  { x: EE_X, y: SY, w: PW, h: PH, cell: DANANG_SCENE_MASK_CELL, rows: DANANG_SCENE_SEE_MASK },
];
const MASK_BASE = composeMask(WORLD, DANANG_SCENE_MASK_CELL, PARTS, LINKS_BASE);
/** Điểm nối dọc ranh giới E ↔ EE (mỗi 10 px), bỏ chỗ có nước để không lát đường qua biển. */
const eeSeam: { from: number; to: number; x: number; y: number; r: number }[] = [];
for (let y = 10; y < PH - 4; y += 10) {
  const x = EE_X + OV / 2;
  let wet = false;
  for (let dy = -10; dy <= 10 && !wet; dy += 2) for (let dx = -10; dx <= 10 && !wet; dx += 2) {
    if (MASK_BASE[Math.floor((y + dy) / DANANG_SCENE_MASK_CELL)]?.[Math.floor((x + dx) / DANANG_SCENE_MASK_CELL)] === '~') wet = true;
  }
  if (!wet) eeSeam.push({ from: 0, to: 0, x, y, r: 10 });
}
/** Lọc điểm nối: bỏ điểm có nước quanh nó (theo mặt nạ nền), giữ phần còn lại làm lối đi. */
const seamLinks = (pts: { x: number; y: number }[]) =>
  pts
    .filter((p) => {
      for (let dy = -10; dy <= 10; dy += 2) for (let dx = -10; dx <= 10; dx += 2) {
        if (MASK_BASE[Math.floor((p.y + dy) / DANANG_SCENE_MASK_CELL)]?.[Math.floor((p.x + dx) / DANANG_SCENE_MASK_CELL)] === '~') return false;
      }
      return true;
    })
    .map((p) => ({ from: 0, to: 0, x: p.x, y: p.y, r: 10 }));
/** Ranh giới EE ↔ mảnh biển phía dưới (dọc và ngang), mỗi 10 px. */
const seeVert: { x: number; y: number }[] = [];
for (let y = SY + 4; y < WORLD.h - 4; y += 10) seeVert.push({ x: EE_X + OV / 2, y });
const seeHoriz: { x: number; y: number }[] = [];
for (let x = EE_X + 10; x < WORLD.w - 4; x += 10) seeHoriz.push({ x, y: SY + OV / 2 });
/** Nối 2 khu đi được bị tách (mảnh EE/SEE) về mạng chính, không qua nước và không qua chân công trình. */
const ISLAND_LINKS = [
  ...linkLine(0, 0, { x: 655, y: 213 }, { x: 655, y: 201 }, 10, 12),
  ...linkLine(0, 0, { x: 655, y: 201 }, { x: 655, y: 195 }, 10, 12),
  ...linkLine(0, 0, { x: 511, y: 221 }, { x: 511, y: 211 }, 10, 12),
  ...linkLine(0, 0, { x: 885, y: 419 }, { x: 873, y: 419 }, 10, 12),
  ...linkLine(0, 0, { x: 873, y: 419 }, { x: 871, y: 415 }, 10, 12),
];
const LINKS = [...LINKS_BASE, ...eeSeam, ...seamLinks(seeVert), ...seamLinks(seeHoriz), ...ISLAND_LINKS];

const SPRITES: Record<string, SceneSprite> = {
  hanmarket: { w: 137, h: 69 },
  ladybuddha: { w: 77, h: 80 },
  miquang: { w: 108, h: 68 },
  beachbar: { w: 112, h: 69 },
  dragonbridge: { w: 125, h: 60 },
  marble: { w: 113, h: 70 },
  cham: { w: 122, h: 71 },
  goldenbridge: { w: 128, h: 67 },
  hoianhouse: { w: 109, h: 66 },
  japanbridge: { w: 130, h: 66 },
  hoiancafe: { w: 119, h: 68 },
  caolau: { w: 117, h: 63 },
  ponagar: { w: 98, h: 78 },
  resort: { w: 131, h: 74 },
  seafood: { w: 124, h: 72 },
  sontra: { w: 135, h: 64 },
  seambush_a: { file: 'seambush_a.png', w: 16, h: 14 },
  seambush_b: { file: 'seambush_b.png', w: 18, h: 15 },
  seambush_c: { file: 'seambush_c.png', w: 14, h: 12 },
  banahills: { w: 125, h: 77 },
  lovebridge: { file: 'lovebridge.png', w: 87, h: 60 },
  chocon: { file: 'chocon.png', w: 87, h: 78 },
  linhung: { file: 'linhung.png', w: 85, h: 61 },
  nonnuoc: { file: 'nonnuoc.png', w: 87, h: 78 },
  airport: { w: 171, h: 75 },
  lamp: { file: '../hanoi/lamp.png', w: 16, h: 72 },
  lampS: { file: '../hanoi/lamp.png', w: 16, h: 30, crop: { x: 0, y: 42, w: 16, h: 30 } },
  seafoodhouse: { file: 'seafoodhouse.png', w: 59, h: 44 },
  beachcafe: { file: 'beachcafe.png', w: 43, h: 44 },
  beachhotel: { file: 'beachhotel.png', w: 42, h: 36 },
};

const fp = (sprite: string, frac = 0.22, inset = 0.1) => {
  const s = SPRITES[sprite]!;
  const w = Math.round(s.w * (1 - inset * 2));
  const h = Math.max(4, Math.round(s.h * frac));
  return { x: -Math.round(w / 2), y: -h, w, h };
};
const O = (id: string, sprite: string, x: number, y: number, extra: Partial<MapObject> = {}): MapObject => ({ id, sprite, x, y, footprint: fp(sprite), ...extra });

const OBJECTS: MapObject[] = [
  O('hanmarket', 'hanmarket', 209, 62, { poiId: 'danang-chohan', door: { dx: 0, dy: 5 } }),
  O('ladybuddha', 'ladybuddha', 319, 58, { poiId: 'danang-ladybuddha', door: { dx: 0, dy: 8 } }),
  O('miquang', 'miquang', 62, 98, { poiId: 'danang-miquang', door: { dx: 0, dy: 5 } }),
  O('beachbar', 'beachbar', 124, 107, { poiId: 'danang-beachbar', door: { dx: 0, dy: 5 } }),
  O('dragonbridge', 'dragonbridge', 315, 110, { poiId: 'danang-dragonbridge', door: { dx: 0, dy: 6 } }),
  O('marble', 'marble', 60, 182, { poiId: 'danang-nguhanhson', door: { dx: 0, dy: 8 } }),
  O('cham', 'cham', 206, 182, { poiId: 'danang-cham', door: { dx: 0, dy: 8 } }),
  O('goldenbridge', 'goldenbridge', 322, 180, { poiId: 'danang-goldenbridge', door: { dx: 0, dy: 10 } }),
  // ---- mảnh E (lệch x = EX): phố cổ Hội An
  O('e-japanbridge', 'japanbridge', EX + 115, 72, { poiId: 'danang-japanbridge', door: { dx: 0, dy: 5 } }),
  O('e-ponagar', 'ponagar', EX + 216, 86, { poiId: 'danang-ponagar', door: { dx: 0, dy: 4 } }),
  O('e-hoianhouse', 'hoianhouse', EX + 325, 105, { poiId: 'danang-hoianhouse', door: { dx: 0, dy: 5 } }),
  O('e-hoiancafe', 'hoiancafe', EX + 140, 137, { poiId: 'danang-hoiancafe', door: { dx: 0, dy: 5 } }),
  O('e-caolau', 'caolau', EX + 115, 204, { poiId: 'danang-caolau', door: { dx: 0, dy: 5 } }),
  O('e-resort', 'resort', EX + 290, 172),
  // ---- mảnh S (lệch y = SY): biển + Sơn Trà
  O('s-seafood', 'seafood', 74, SY + 101, { poiId: 'danang-seafood', door: { dx: 0, dy: 5 } }),
  O('s-sontra', 'sontra', 195, SY + 83, { poiId: 'danang-sontra', door: { dx: 0, dy: 5 } }),
  O('s-resort', 'resort', 323, SY + 93, { poiId: 'danang-resort', door: { dx: 0, dy: 5 } }),
  O('s-beachbar', 'beachbar', 178, SY + 138),
  O('s-hoiancafe', 'hoiancafe', 315, SY + 146),
  // ---- mảnh SE (lệch x = EX, y = SY): Bà Nà + sân bay
  O('se-banahills', 'banahills', EX + 212, SY + 87, { poiId: 'danang-banahills', door: { dx: 0, dy: 5 } }),
  O('se-airport', 'airport', EX + 178, SY + 143, { poiId: 'danang-gate', door: { dx: 0, dy: 5 } }),
  O('se-ponagar', 'ponagar', EX + 60, SY + 57),
  O('se-hoianhouse', 'hoianhouse', EX + 276, SY + 152),
  // công trình biển ở các ô xám của mảnh EE và mảnh biển (trang trí)
  O('ee-seafoodhouse', 'seafoodhouse', 942, 72, { poiId: 'danang-mykhe', door: { dx: 0, dy: 4 } }),
  O('ee-beachcafe', 'beachcafe', 943, 182, { poiId: 'danang-cafemykhe', door: { dx: 0, dy: 4 } }),
  O('see-beachhotel', 'beachhotel', 965, 288, { poiId: 'danang-hotelmykhe', door: { dx: 0, dy: 4 } }),
  // địa điểm mới: cầu, chợ, chùa, bãi biển ở các ô trống
  O('d-lovebridge', 'lovebridge', 1169, 287, { poiId: 'danang-lovebridge', door: { dx: 0, dy: 4 } }),
  O('d-chocon', 'chocon', 907, 417, { poiId: 'danang-chocon', door: { dx: 0, dy: 4 } }),
  O('d-linhung', 'linhung', 1018, 61, { poiId: 'danang-linhung', door: { dx: 0, dy: 4 } }),
  O('d-nonnuoc', 'nonnuoc', 869, 228, { poiId: 'danang-nonnuoc', door: { dx: 0, dy: 4 } }),
];

const poiOf = (poiId: string) => {
  const o = OBJECTS.find((x) => x.poiId === poiId)!;
  const g = poiGeometry(o, SPRITES[o.sprite]!);
  return imagePoi(poiId, { hotspot: g.hotspot, door: g.door });
};

const NPCS: Npc[] = [
  {
    id: 'danang-npc-local',
    sprite: 'npc_local',
    at: { x: 100, y: 205 },
    path: [{ x: 180, y: 205 }],
    lines: [
      { en: 'The Dragon Bridge breathes fire at nine on Saturday nights.', vi: 'Cầu Rồng phun lửa lúc chín giờ tối thứ Bảy.' },
      { en: 'My Khe is one of the cleanest beaches in Vietnam.', vi: 'Mỹ Khê là một trong những bãi biển sạch nhất Việt Nam.' },
    ],
  },
  {
    id: 'danang-npc-tourist',
    sprite: 'npc_tourist',
    at: { x: 270, y: 130 },
    path: [{ x: 270, y: 190 }],
    lines: [{ en: 'Is the cable car to Ba Na open today?', vi: 'Hôm nay cáp treo lên Bà Nà có chạy không ạ?' }],
  },
  {
    id: 'danang-npc-vendor',
    sprite: 'npc_vendor',
    at: { x: 105, y: 128 },
    lines: [{ en: 'Mi Quang with peanuts and rice crackers. Try a bowl!', vi: 'Mì Quảng với đậu phộng và bánh tráng. Ăn thử một tô nhé!' }],
  },
  {
    id: 'danang-npc-kid',
    sprite: 'npc_kid',
    at: { x: 150, y: 130 },
    lines: [{ en: 'I saw the dragon spit water last night!', vi: 'Tối qua con thấy rồng phun nước!' }],
  },
  {
    id: 'danang-npc-hoian',
    sprite: 'npc_vendor',
    at: { x: EX + 210, y: 170 },
    path: [{ x: EX + 210, y: 190 }],
    lines: [
      { en: 'Lanterns are lit every full-moon night. The old town goes quiet and glows.', vi: 'Đêm rằm phố cổ tắt đèn điện, chỉ còn đèn lồng.' },
      { en: 'Cao lau is made with water from one old well only.', vi: 'Cao lầu chỉ nấu bằng nước giếng cổ.' },
    ],
  },
  {
    id: 'danang-npc-swimmer',
    sprite: 'npc_kid',
    at: { x: 200, y: SY + 158 },
    lines: [{ en: 'The water is warm. Do you want to swim?', vi: 'Nước ấm lắm. Bạn có muốn bơi không?' }],
  },
  {
    id: 'danang-npc-traveller',
    sprite: 'npc_tourist',
    at: { x: EX + 250, y: SY + 190 },
    path: [{ x: EX + 330, y: SY + 190 }],
    lines: [
      { en: 'Excuse me, where do I catch the shuttle to Ba Na Hills?', vi: 'Xin lỗi, đón xe đưa đón lên Bà Nà ở đâu ạ?' },
      { en: 'The weather up there is much cooler.', vi: 'Trên đó trời mát hơn nhiều.' },
    ],
  },
  { id: 'danang-npc-cat', sprite: 'cat_sit', at: { x: 140, y: 214 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

const MASK = composeMask(WORLD, DANANG_SCENE_MASK_CELL, PARTS, LINKS);


import { seamHedge } from './seams';
/** Hàng bụi/cây dọc mọi mép mảnh (che đường nối cho quyện hoà; không có đèn). */
const SEAMS = seamHedge({
  prefix: 'seam',
  maskRows: MASK,
  cell: DANANG_SCENE_MASK_CELL,
  lines: [
    { x0: 408, y0: 10, x1: 408, y1: 440 },
    { x0: 806, y0: 10, x1: 806, y1: 440 },
    { x0: 10, y0: 225, x1: 1204, y1: 225 },
  ],
  gaps: LINKS,
  sprites: ['seambush_a', 'seambush_b', 'seambush_c'],
  spacing: 12,
});

export const danang = (() => {
  const m = imageMap({
    id: 'danang',
    name: { vi: 'Đà Nẵng', en: 'Da Nang' },
    utcOffsetHours: 7,
    terrain: true,
    spawn: { x: 209, y: 214 },
    pois: OBJECTS.filter((o) => o.poiId).map((o) => poiOf(o.poiId!)),
    npcs: NPCS,
    routes: [
      { id: 'danang-boat', sprite: 'mini_boat', path: [{ x: 8, y: 10 }, { x: 8, y: 50 }], speed: 0.7 },
      { id: 'danang-plane', sprite: 'mini_plane', path: [{ x: EX + 80, y: SY + 190 }, { x: EX + 470, y: SY + 190 }], speed: 3.2, loop: true, layer: 'sky' },
    ],
    size: WORLD,
    panels: [
      { suffix: '', x: 0, y: 0 },
      { suffix: '-e', x: EX, y: 0 },
      { suffix: '-s', x: 0, y: SY },
      { suffix: '-se', x: EX, y: SY },
      { suffix: '-ee', x: EE_X, y: 0 },
      { suffix: '-see', x: EE_X, y: SY },
    ],
    links: LINKS,
    mask: { cell: DANANG_SCENE_MASK_CELL, rows: MASK },
    sounds: ['city-day', 'water-lap'],
  });
  m.scene = { sprites: SPRITES, objects: [...OBJECTS, ...SEAMS], ambient: 10 };
  return m;
})();

/** Dự phòng khi chưa tải được ảnh đất: bản đồ ô chung của các thành phố Việt Nam. */
export const danangTiles = vietnamTiles({ id: 'danang', name: { vi: 'Đà Nẵng', en: 'Da Nang' }, npcs: [] });
