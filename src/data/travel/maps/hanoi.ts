/**
 * HÀ NỘI — CHẾ ĐỘ ĐỐI TƯỢNG (kiểu Bến Dừa), MẢNH A (trung tâm hồ Gươm). Ảnh ĐẤT `public/travel/terrain/hanoi.small.png`
 * (418×235) + lưới đi được `hanoi.scene-walk.ts` (khoá `hanoi-scene`); công trình là sprite đứng riêng trong
 * `public/travel/sprites/hanoi/`, (x,y) là GIỮA-ĐÁY. Các mảnh E/S/SE sẽ nối vào bằng cầu gỗ phải và vạch qua đường dưới.
 * Gán địa điểm: Văn Miếu (ô trên giữa), phở (trái trên), cà phê trứng (trái giữa), Chùa Một Cột (phải trên),
 * nhà ống phố cổ (trái dưới), chợ Đồng Xuân (dưới giữa), Ga Hà Nội = quầy đổi vé (phải dưới), Tháp Rùa trên bể nước giữa.
 * Nhà hát lớn đã có sprite nhưng để dành cho mảnh sau.
 */
import type { MapObject, Npc, SceneSprite } from '@/services/travel/types';
import { poiGeometry } from '@/components/travel/engine/scene';
import { imageMap, imagePoi } from './imagemap';
import { composeMask } from '@/components/travel/engine/imageWorld';
import { seamDecor } from './seams';
import { HANOI_SCENE_MASK, HANOI_SCENE_MASK_CELL } from './hanoi.scene-walk';
import { HANOI_SCENE_E_MASK } from './hanoi.scene-walk-e';
import { HANOI_SCENE_S_MASK } from './hanoi.scene-walk-s';
import { HANOI_SCENE_SE_MASK } from './hanoi.scene-walk-se';

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
  { from: 0, to: 1, x: EX + OV / 2, y: 91, r: 12 }, // cầu gỗ đỏ bên phải A ↔ cầu bên trái E
  { from: 0, to: 2, x: 209, y: SY + OV / 2, r: 12 }, // vạch qua đường dưới A ↔ vạch trên S
  ...linkLine(2, 3, { x: EX + 2, y: SY + 105 }, { x: EX + OV - 2, y: SY + 67 }), // đường mép phải S ↔ mép trái SE
  ...linkLine(1, 3, { x: EX + 205, y: SY + 2 }, { x: EX + 132, y: SY + OV - 2 }), // đường mép dưới E ↔ mép trên SE
];
import { vietnamTiles } from './vietnam.tiles';

const SPRITES: Record<string, SceneSprite> = {
  vanmieu: { w: 123, h: 66 },
  pho: { w: 86, h: 77 },
  eggcoffee: { w: 65, h: 78 },
  motcot: { w: 91, h: 69 },
  oldquarter: { w: 115, h: 69 },
  dongxuan: { w: 122, h: 67 },
  station: { w: 123, h: 68 },
  thaprua: { w: 97, h: 78 },
  opera: { w: 130, h: 71 },
  mausoleum: { w: 121, h: 74 },
  puppet: { w: 125, h: 80 },
  tranquoc: { w: 106, h: 84 },
  doanmon: { w: 115, h: 66 },
  longbien: { w: 131, h: 65 },
  biahoi: { w: 96, h: 61 },
  buncha: { w: 83, h: 63 },
  banhmi: { w: 96, h: 59 },
  flowers: { w: 73, h: 56 },
  lamp: { w: 16, h: 72 },
  lampS: { file: '../hanoi/lamp.png', w: 16, h: 30, crop: { x: 0, y: 42, w: 16, h: 30 } },
};

const fp = (sprite: string, frac = 0.22, inset = 0.1) => {
  const s = SPRITES[sprite]!;
  const w = Math.round(s.w * (1 - inset * 2));
  const h = Math.max(4, Math.round(s.h * frac));
  return { x: -Math.round(w / 2), y: -h, w, h };
};
const O = (id: string, sprite: string, x: number, y: number, extra: Partial<MapObject> = {}): MapObject => ({ id, sprite, x, y, footprint: fp(sprite), ...extra });
const DOOR = { dx: 0, dy: 5 };
const LAMP = { footprint: { x: -2, y: -3, w: 4, h: 3 }, glow: { dx: 0, dy: -26, r: 22 } };

const OBJECTS: MapObject[] = [
  O('vanmieu', 'vanmieu', 213, 77, { poiId: 'hanoi-vanmieu', door: DOOR }),
  O('pho', 'pho', 85, 87, { poiId: 'hanoi-pho', door: DOOR }),
  O('eggcoffee', 'eggcoffee', 114, 124, { poiId: 'hanoi-eggcoffee', door: { dx: 0, dy: 10 } }),
  O('motcot', 'motcot', 332, 95, { poiId: 'hanoi-motcot', door: { dx: 0, dy: 10 } }),
  O('oldquarter', 'oldquarter', 87, 185, { poiId: 'hanoi-oldquarter', door: DOOR }),
  O('dongxuan', 'dongxuan', 215, 188, { poiId: 'hanoi-dongxuan', door: DOOR }),
  O('station', 'station', 335, 185, { poiId: 'hanoi-counter', door: DOOR }),
  O('thaprua', 'thaprua', 214, 124, { poiId: 'hanoi-thaprua', door: { dx: 0, dy: 10 }, footprint: { x: -38, y: -26, w: 76, h: 26 } }),
  O('lamp-a1', 'lampS', 150, 100, LAMP),
  // ---- mảnh E (lệch x = EX)
  O('e-opera', 'opera', EX + 114, 80, { poiId: 'hanoi-opera', door: { dx: 0, dy: 14 } }),
  O('e-flowers', 'flowers', EX + 253, 85, { poiId: 'hanoi-flowers', door: { dx: 0, dy: 15 } }),
  O('e-puppet', 'puppet', EX + 322, 125, { poiId: 'hanoi-puppet', door: { dx: 0, dy: 15 } }),
  O('e-mausoleum', 'mausoleum', EX + 122, 188, { poiId: 'hanoi-mausoleum', door: { dx: 0, dy: 12 } }),
  O('e-tranquoc', 'tranquoc', EX + 291, 188, { poiId: 'hanoi-tranquoc', door: { dx: 0, dy: 12 } }),
  O('e-eggcoffee', 'eggcoffee', EX + 110, 140),
  O('e-lamp1', 'lampS', EX + 188, 118, LAMP),
  // ---- mảnh S (lệch y = SY)
  O('s-doanmon', 'doanmon', 126, SY + 77, { poiId: 'hanoi-doanmon', door: { dx: 0, dy: 15 } }),
  O('s-biahoi', 'biahoi', 307, SY + 77, { poiId: 'hanoi-biahoi', door: { dx: 0, dy: 13 } }),
  O('s-longbien', 'longbien', 107, SY + 128, { poiId: 'hanoi-longbien', door: { dx: 0, dy: 14 } }),
  O('s-buncha', 'buncha', 328, SY + 145, { poiId: 'hanoi-buncha', door: { dx: 0, dy: 15 } }),
  O('s-banhmi', 'banhmi', 213, SY + 185, { poiId: 'hanoi-banhmi', door: DOOR }),
  O('s-oldquarter', 'oldquarter', 330, SY + 196),
  O('s-lamp1', 'lampS', 190, SY + 60, LAMP),
  // ---- mảnh SE (lệch x = EX, y = SY): sân bay Nội Bài
  O('se-gate', 'station', EX + 230, SY + 60, { poiId: 'hanoi-gate', door: { dx: 0, dy: 14 } }),
  O('se-board', 'station', EX + 301, SY + 130, { poiId: 'hanoi-board', door: { dx: 0, dy: 8 } }),
  O('se-flowers', 'flowers', EX + 70, SY + 52),
  O('se-eggcoffee', 'eggcoffee', EX + 56, SY + 126),
  O('se-banhmi', 'banhmi', EX + 198, SY + 125),
  O('se-lamp1', 'lampS', EX + 100, SY + 92, LAMP),
];

const POI_IDS = [...OBJECTS.filter((o) => o.poiId).map((o) => o.poiId!)];

const poiOf = (poiId: string) => {
  const o = OBJECTS.find((x) => x.poiId === poiId)!;
  const g = poiGeometry(o, SPRITES[o.sprite]!);
  return imagePoi(poiId, { hotspot: g.hotspot, door: g.door });
};

const NPCS: Npc[] = [
  {
    id: 'hanoi-npc-pho',
    sprite: 'npc_vendor',
    at: { x: 66, y: 96 },
    lines: [
      { en: 'Beef or chicken noodle soup? Which one would you like?', vi: 'Phở bò hay phở gà? Bạn muốn món nào?' },
      { en: 'Be careful, the broth is hot!', vi: 'Cẩn thận, nước dùng nóng đấy!' },
    ],
  },
  {
    id: 'hanoi-npc-local',
    sprite: 'npc_local',
    at: { x: 158, y: 108 },
    path: [{ x: 148, y: 152 }],
    lines: [
      { en: 'Every morning I walk once around the lake. It keeps me young.', vi: 'Sáng nào tôi cũng đi bộ một vòng quanh hồ. Giữ cho mình trẻ lâu.' },
      { en: 'They say a giant turtle lives in the lake.', vi: 'Người ta kể trong hồ có một con rùa khổng lồ.' },
    ],
  },
  {
    id: 'hanoi-npc-tourist',
    sprite: 'npc_tourist',
    at: { x: 275, y: 134 },
    path: [{ x: 262, y: 100 }],
    lines: [
      { en: 'Excuse me, how do I get to the Temple of Literature?', vi: 'Xin lỗi, đi tới Văn Miếu như thế nào ạ?' },
      { en: 'Egg coffee? Sounds strange, but I want to try it.', vi: 'Cà phê trứng á? Nghe lạ nhưng mình muốn thử.' },
    ],
  },
  {
    id: 'hanoi-npc-kid',
    sprite: 'npc_kid',
    at: { x: 280, y: 138 },
    lines: [{ en: 'I fed the fish near the Turtle Tower!', vi: 'Con vừa cho cá ăn gần Tháp Rùa!' }],
  },
  {
    id: 'hanoi-npc-elder',
    sprite: 'npc_elder',
    at: { x: 300, y: 134 },
    lines: [{ en: 'In the Old Quarter every street sells one kind of thing.', vi: 'Ở phố cổ mỗi phố bán một thứ.' }],
  },
  {
    id: 'hanoi-npc-guard',
    sprite: 'npc_guard',
    at: { x: 350, y: 205 },
    path: [{ x: 290, y: 205 }],
    lines: [{ en: 'Tickets are sold at the station counter, just here.', vi: 'Vé bán ở quầy ga, ngay đây.' }],
  },
  {
    id: 'hanoi-npc-guide',
    sprite: 'npc_staff',
    at: { x: EX + 205, y: 160 },
    path: [{ x: EX + 205, y: 186 }],
    lines: [
      { en: 'The Mausoleum is open in the morning only. Please dress neatly.', vi: 'Lăng chỉ mở cửa buổi sáng. Xin ăn mặc chỉnh tề.' },
      { en: 'The water puppet show starts at seven.', vi: 'Buổi múa rối nước bắt đầu lúc bảy giờ.' },
    ],
  },
  {
    id: 'hanoi-npc-student',
    sprite: 'npc_kid',
    at: { x: 209, y: SY + 62 },
    path: [{ x: 209, y: SY + 130 }],
    lines: [{ en: 'I come to the Temple of Literature before every exam for good luck.', vi: 'Em đến Văn Miếu trước mỗi kỳ thi để lấy may.' }],
  },
  {
    id: 'hanoi-npc-fisher',
    sprite: 'npc_elder',
    at: { x: 60, y: SY + 160 },
    lines: [{ en: 'The Red River is wide here. Long Bien Bridge is more than a hundred years old.', vi: 'Sông Hồng ở đây rộng lắm. Cầu Long Biên đã hơn một trăm tuổi.' }],
  },
  {
    id: 'hanoi-npc-traveller',
    sprite: 'npc_tourist',
    at: { x: EX + 150, y: SY + 185 },
    path: [{ x: EX + 330, y: SY + 185 }],
    lines: [
      { en: 'Is this the way to the departure hall?', vi: 'Đây có phải đường tới sảnh đi không ạ?' },
      { en: 'My flight to Singapore leaves in an hour.', vi: 'Chuyến bay đi Singapore của mình một tiếng nữa cất cánh.' },
    ],
  },
  {
    id: 'hanoi-npc-porter',
    sprite: 'npc_guard',
    at: { x: EX + 250, y: SY + 160 },
    lines: [{ en: 'Taxis are outside Terminal 1. Please use the meter.', vi: 'Taxi ở bên ngoài Nhà ga T1. Xin đi theo đồng hồ.' }],
  },
  { id: 'hanoi-npc-cat', sprite: 'cat_sit', at: { x: 150, y: 214 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

const MASK = composeMask(
  WORLD,
  HANOI_SCENE_MASK_CELL,
  [
    { x: 0, y: 0, w: PW, h: PH, cell: HANOI_SCENE_MASK_CELL, rows: HANOI_SCENE_MASK },
    { x: EX, y: 0, w: PW, h: PH, cell: HANOI_SCENE_MASK_CELL, rows: HANOI_SCENE_E_MASK },
    { x: 0, y: SY, w: PW, h: PH, cell: HANOI_SCENE_MASK_CELL, rows: HANOI_SCENE_S_MASK },
    { x: EX, y: SY, w: PW, h: PH, cell: HANOI_SCENE_MASK_CELL, rows: HANOI_SCENE_SE_MASK },
  ],
  LINKS,
);

/** Hàng đèn che đường nối (chừa hở ở mọi điểm nối). */
const SEAMS = seamDecor({
  prefix: 'seam',
  maskRows: MASK,
  cell: HANOI_SCENE_MASK_CELL,
  lines: [
    { x0: EX + OV / 2, y0: 10, x1: EX + OV / 2, y1: PH - 4 },
    { x0: EX + OV / 2, y0: SY + 4, x1: EX + OV / 2, y1: WORLD.h - 10 },
    { x0: 10, y0: SY + OV / 2, x1: PW - 4, y1: SY + OV / 2 },
    { x0: EX + 4, y0: SY + OV / 2, x1: WORLD.w - 10, y1: SY + OV / 2 },
  ],
  gaps: LINKS,
  sprites: ['lampS'],
  spacing: 40,
});

export const hanoi = (() => {
  const m = imageMap({
    id: 'hanoi',
    name: { vi: 'Hà Nội', en: 'Hanoi' },
    utcOffsetHours: 7,
    terrain: true,
    spawn: { x: 209, y: 214 },
    pois: POI_IDS.map(poiOf),
    npcs: NPCS,
    routes: [
      { id: 'hanoi-boat', sprite: 'mini_boat', path: [{ x: 90, y: 6 }, { x: 330, y: 6 }], speed: 0.8 },
      { id: 'hanoi-plane', sprite: 'mini_plane', path: [{ x: EX + 120, y: SY + 190 }, { x: EX + 470, y: SY + 190 }], speed: 3.2, loop: true, layer: 'sky' },
    ],
    size: WORLD,
    panels: [
      { suffix: '', x: 0, y: 0 },
      { suffix: '-e', x: EX, y: 0 },
      { suffix: '-s', x: 0, y: SY },
      { suffix: '-se', x: EX, y: SY },
    ],
    links: LINKS,
    mask: { cell: HANOI_SCENE_MASK_CELL, rows: MASK },
    sounds: ['city-day'],
  });
  m.scene = { sprites: SPRITES, objects: [...OBJECTS, ...SEAMS], ambient: 8 };
  return m;
})();

/** Dự phòng khi chưa tải được ảnh đất: bản đồ ô chung của ba thành phố Việt Nam. */
export const hanoiTiles = vietnamTiles({ id: 'hanoi', name: { vi: 'Hà Nội', en: 'Hanoi' }, npcs: [] });
