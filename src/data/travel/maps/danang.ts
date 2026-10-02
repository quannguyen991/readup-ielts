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
import { seamDecor } from './seams';
import { DANANG_SCENE_MASK, DANANG_SCENE_MASK_CELL } from './danang.scene-walk';
import { DANANG_SCENE_E_MASK } from './danang.scene-walk-e';
import { DANANG_SCENE_S_MASK } from './danang.scene-walk-s';
import { DANANG_SCENE_SE_MASK } from './danang.scene-walk-se';

/** Thế giới 2×2 mảnh 418×235 chồng nhau OV điểm (hoà Bayer): E lệch phải, S lệch xuống, SE lệch cả hai. Hộp bao 816×450. */
const PW = 418;
const PH = 235;
const OV = 20;
const EX = PW - OV;
const SY = PH - OV;
const WORLD = { w: EX + PW, h: SY + PH };

const linkLine = (from: number, to: number, a: { x: number; y: number }, b: { x: number; y: number }, r = 10, step = 12) => {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
  return Array.from({ length: n + 1 }, (_, i) => ({ from, to, x: Math.round(a.x + ((b.x - a.x) * i) / n), y: Math.round(a.y + ((b.y - a.y) * i) / n), r }));
};
const LINKS = [
  { from: 0, to: 1, x: EX + OV / 2, y: 107, r: 12 }, // cầu đá bên phải A ↔ cầu bên trái E
  ...linkLine(0, 2, { x: 123, y: SY + 3 }, { x: 120, y: SY + OV - 3 }), // vạch qua đường thứ nhất
  ...linkLine(0, 2, { x: 274, y: SY + 3 }, { x: 248, y: SY + OV - 3 }), // vạch qua đường thứ hai
  ...linkLine(2, 3, { x: EX + 2, y: SY + 102 }, { x: EX + OV - 2, y: SY + 69 }),
  ...linkLine(1, 3, { x: EX + 211, y: SY + 2 }, { x: EX + 145, y: SY + OV - 2 }),
];
import { vietnamTiles } from './vietnam.tiles';

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
  banahills: { w: 125, h: 77 },
  airport: { w: 171, h: 75 },
  lamp: { file: '../hanoi/lamp.png', w: 16, h: 72 },
  lampS: { file: '../hanoi/lamp.png', w: 16, h: 30, crop: { x: 0, y: 42, w: 16, h: 30 } },
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

const MASK = composeMask(
  WORLD,
  DANANG_SCENE_MASK_CELL,
  [
    { x: 0, y: 0, w: PW, h: PH, cell: DANANG_SCENE_MASK_CELL, rows: DANANG_SCENE_MASK },
    { x: EX, y: 0, w: PW, h: PH, cell: DANANG_SCENE_MASK_CELL, rows: DANANG_SCENE_E_MASK },
    { x: 0, y: SY, w: PW, h: PH, cell: DANANG_SCENE_MASK_CELL, rows: DANANG_SCENE_S_MASK },
    { x: EX, y: SY, w: PW, h: PH, cell: DANANG_SCENE_MASK_CELL, rows: DANANG_SCENE_SE_MASK },
  ],
  LINKS,
);

const SEAMS = seamDecor({
  prefix: 'seam',
  maskRows: MASK,
  cell: DANANG_SCENE_MASK_CELL,
  lines: [
    { x0: EX + OV / 2, y0: 10, x1: EX + OV / 2, y1: PH - 4 },
    { x0: EX + OV / 2, y0: SY + 4, x1: EX + OV / 2, y1: WORLD.h - 10 },
    { x0: 10, y0: SY + OV / 2, x1: PW - 4, y1: SY + OV / 2 },
    { x0: EX + 4, y0: SY + OV / 2, x1: WORLD.w - 10, y1: SY + OV / 2 },
  ],
  gaps: LINKS,
  sprites: ['lampS'],
  spacing: 64,
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
