/**
 * TP. HỒ CHÍ MINH — CHẾ ĐỘ ĐỐI TƯỢNG, MẢNH A (trung tâm Sài Gòn bên sông). Ảnh ĐẤT `public/travel/terrain/hochiminh.small.png`
 * (418×235) + lưới đi được `hochiminh.scene-walk.ts` (khoá `hochiminh-scene`); công trình là sprite đứng riêng trong
 * `public/travel/sprites/hochiminh/`, (x,y) là GIỮA-ĐÁY. Cầu đá bên phải nối sang mảnh E, vạch qua đường dưới nối sang mảnh S.
 * Gán địa điểm: Dinh Độc Lập (ô trên giữa), Nhà thờ Đức Bà (trái trên), Bưu điện (trái giữa), Landmark 81 (phải trên),
 * Bitexco (phải giữa), chợ Bến Thành (trái dưới), quán cơm tấm (dưới giữa), xe bánh mì (phải dưới); bể nước giữa để trống.
 * Các sprite còn lại (opera, warmuseum, phoshop, cafesua, thienhau, skydeck, cuchi, mekong, airport, buivien) để dành cho E/S/SE.
 */
import type { MapObject, Npc, SceneSprite } from '@/services/travel/types';
import { poiGeometry } from '@/components/travel/engine/scene';
import { imageMap, imagePoi } from './imagemap';
import { composeMask } from '@/components/travel/engine/imageWorld';
import { seamDecor } from './seams';
import { HOCHIMINH_SCENE_MASK, HOCHIMINH_SCENE_MASK_CELL } from './hochiminh.scene-walk';
import { HOCHIMINH_SCENE_E_MASK } from './hochiminh.scene-walk-e';
import { HOCHIMINH_SCENE_S_MASK } from './hochiminh.scene-walk-s';
import { HOCHIMINH_SCENE_SE_MASK } from './hochiminh.scene-walk-se';

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
  { from: 0, to: 1, x: EX + OV / 2, y: 98, r: 12 }, // cầu đá bên phải A ↔ cầu bên trái E
  { from: 0, to: 2, x: 209, y: SY + OV / 2, r: 12 }, // vạch qua đường dưới A ↔ vạch trên S
  ...linkLine(2, 3, { x: EX + 2, y: SY + 110 }, { x: EX + OV - 2, y: SY + 74 }),
  ...linkLine(1, 3, { x: EX + 212, y: SY + 2 }, { x: EX + 176, y: SY + OV - 2 }),
];
import { vietnamTiles } from './vietnam.tiles';

const SPRITES: Record<string, SceneSprite> = {
  palace: { w: 130, h: 65 },
  notredame: { w: 78, h: 81 },
  postoffice: { w: 120, h: 72 },
  landmark81: { w: 69, h: 76 },
  bitexco: { w: 66, h: 75 },
  benthanh: { w: 120, h: 76 },
  comtam: { w: 79, h: 65 },
  banhmi: { w: 86, h: 63 },
  skydeck: { w: 93, h: 80 },
  opera: { w: 106, h: 65 },
  thienhau: { w: 130, h: 72 },
  phoshop: { w: 85, h: 70 },
  warmuseum: { w: 122, h: 66 },
  cafesua: { w: 109, h: 69 },
  buivien: { w: 121, h: 64 },
  cuchi: { w: 114, h: 74 },
  mekong: { w: 124, h: 68 },
  airport: { w: 142, h: 70 },
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
  O('palace', 'palace', 212, 77, { poiId: 'hochiminh-independence', door: { dx: 0, dy: 8 } }),
  O('notredame', 'notredame', 85, 87, { poiId: 'hochiminh-notredame', door: { dx: 0, dy: 5 } }),
  O('postoffice', 'postoffice', 112, 126, { poiId: 'hochiminh-postoffice', door: { dx: 0, dy: 12 } }),
  O('landmark81', 'landmark81', 332, 90, { poiId: 'hochiminh-landmark81', door: { dx: 0, dy: 6 } }),
  O('bitexco', 'bitexco', 322, 125, { poiId: 'hochiminh-bitexco', door: { dx: 0, dy: 13 } }),
  O('benthanh', 'benthanh', 86, 185, { poiId: 'hochiminh-benthanh', door: { dx: 0, dy: 11 } }),
  O('comtam', 'comtam', 212, 187, { poiId: 'hochiminh-comtam', door: { dx: 0, dy: 5 } }),
  O('banhmi', 'banhmi', 335, 186, { poiId: 'hochiminh-banhmi', door: { dx: 0, dy: 10 } }),
  // ---- mảnh E (lệch x = EX)
  O('e-skydeck', 'skydeck', EX + 97, 92, { poiId: 'hochiminh-skydeck', door: { dx: 0, dy: 12 } }),
  O('e-opera', 'opera', EX + 175, 84, { poiId: 'hochiminh-opera', door: { dx: 0, dy: 4 } }),
  O('e-thienhau', 'thienhau', EX + 260, 100, { poiId: 'hochiminh-thienhau', door: { dx: 0, dy: 8 } }),
  O('e-phoshop', 'phoshop', EX + 345, 110, { poiId: 'hochiminh-phoshop', door: { dx: 0, dy: 8 } }),
  O('e-warmuseum', 'warmuseum', EX + 116, 185, { poiId: 'hochiminh-warmuseum', door: { dx: 0, dy: 6 }, footprint: { x: -34, y: -14, w: 68, h: 14 } }),
  O('e-cafesua', 'cafesua', EX + 250, 195, { poiId: 'hochiminh-cafesua', door: { dx: 0, dy: 6 } }),
  O('e-bitexco', 'bitexco', EX + 332, 185),
  // ---- mảnh S (lệch y = SY)
  O('s-buivien', 'buivien', 76, SY + 88, { poiId: 'hochiminh-buivien', door: { dx: 0, dy: 5 } }),
  O('s-cuchi', 'cuchi', 155, SY + 87, { poiId: 'hochiminh-cuchi', door: { dx: 0, dy: 9 } }),
  O('s-mekong', 'mekong', 147, SY + 147, { poiId: 'hochiminh-mekong', door: { dx: 0, dy: 6 } }),
  O('s-postoffice', 'postoffice', 262, SY + 93),
  O('s-notredame', 'notredame', 347, SY + 95),
  O('s-comtam', 'comtam', 270, SY + 170),
  O('s-landmark81', 'landmark81', 353, SY + 182),
  // ---- mảnh SE (lệch x = EX, y = SY): sân bay Tân Sơn Nhất
  O('se-airport', 'airport', EX + 235, SY + 62, { poiId: 'hochiminh-gate', door: { dx: 0, dy: 5 } }),
  O('se-palace', 'palace', EX + 105, SY + 62),
  O('se-benthanh', 'benthanh', EX + 247, SY + 130),
  O('se-notredame', 'notredame', EX + 363, SY + 130),
];

const poiOf = (poiId: string) => {
  const o = OBJECTS.find((x) => x.poiId === poiId)!;
  const g = poiGeometry(o, SPRITES[o.sprite]!);
  return imagePoi(poiId, { hotspot: g.hotspot, door: g.door });
};

const NPCS: Npc[] = [
  {
    id: 'hochiminh-npc-xe',
    sprite: 'npc_local',
    at: { x: 156, y: 108 },
    path: [{ x: 156, y: 126 }],
    lines: [
      { en: 'Crossing the street here? Just walk slowly and the bikes will go around you.', vi: 'Qua đường ở đây hả? Cứ đi chậm, xe máy sẽ tự tránh bạn.' },
      { en: 'Try iced coffee with milk. It is the Saigon way.', vi: 'Thử cà phê sữa đá đi. Đúng kiểu Sài Gòn đó.' },
    ],
  },
  {
    id: 'hochiminh-npc-tourist',
    sprite: 'npc_tourist',
    at: { x: 270, y: 140 },
    path: [{ x: 270, y: 100 }],
    lines: [{ en: 'Excuse me, which way to Ben Thanh Market?', vi: 'Xin lỗi, đi Chợ Bến Thành đường nào ạ?' }],
  },
  {
    id: 'hochiminh-npc-vendor',
    sprite: 'npc_vendor',
    at: { x: 300, y: 196 },
    lines: [{ en: 'Banh mi! Hot and crunchy. Pork or egg?', vi: 'Bánh mì nóng giòn đây! Thịt hay trứng?' }],
  },
  {
    id: 'hochiminh-npc-kid',
    sprite: 'npc_kid',
    at: { x: 200, y: 137 },
    lines: [{ en: 'Dad says the cathedral bricks came all the way from France.', vi: 'Bố bảo gạch của nhà thờ chở từ Pháp sang đó.' }],
  },
  {
    id: 'hochiminh-npc-guide',
    sprite: 'npc_staff',
    at: { x: EX + 212, y: 160 },
    path: [{ x: EX + 212, y: 200 }],
    lines: [
      { en: 'The Sky Deck is on the 49th floor. The lift takes less than a minute.', vi: 'Đài quan sát ở tầng 49. Thang máy đi chưa tới một phút.' },
      { en: 'Please keep quiet inside the temple.', vi: 'Xin giữ yên lặng khi vào chùa.' },
    ],
  },
  {
    id: 'hochiminh-npc-student',
    sprite: 'npc_kid',
    at: { x: 209, y: SY + 40 },
    path: [{ x: 209, y: SY + 90 }],
    lines: [{ en: 'Bui Vien is crowded at night. Hold on to your bag!', vi: 'Phố Bùi Viện tối rất đông. Giữ chặt túi nhé!' }],
  },
  {
    id: 'hochiminh-npc-boatman',
    sprite: 'npc_elder',
    at: { x: 190, y: SY + 153 },
    lines: [{ en: 'A boat trip to the Mekong Delta takes the whole day. Bring a hat.', vi: 'Đi thuyền xuống đồng bằng sông Cửu Long mất cả ngày. Nhớ mang nón.' }],
  },
  {
    id: 'hochiminh-npc-traveller',
    sprite: 'npc_tourist',
    at: { x: EX + 300, y: SY + 175 },
    path: [{ x: EX + 380, y: SY + 175 }],
    lines: [
      { en: 'Excuse me, which gate is the flight to Hanoi?', vi: 'Xin lỗi, chuyến bay đi Hà Nội ở cổng nào ạ?' },
      { en: 'It is so hot! I need an iced coffee.', vi: 'Nóng quá! Mình cần một ly cà phê đá.' },
    ],
  },
  { id: 'hochiminh-npc-cat', sprite: 'cat_sit', at: { x: 150, y: 214 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

const MASK = composeMask(
  WORLD,
  HOCHIMINH_SCENE_MASK_CELL,
  [
    { x: 0, y: 0, w: PW, h: PH, cell: HOCHIMINH_SCENE_MASK_CELL, rows: HOCHIMINH_SCENE_MASK },
    { x: EX, y: 0, w: PW, h: PH, cell: HOCHIMINH_SCENE_MASK_CELL, rows: HOCHIMINH_SCENE_E_MASK },
    { x: 0, y: SY, w: PW, h: PH, cell: HOCHIMINH_SCENE_MASK_CELL, rows: HOCHIMINH_SCENE_S_MASK },
    { x: EX, y: SY, w: PW, h: PH, cell: HOCHIMINH_SCENE_MASK_CELL, rows: HOCHIMINH_SCENE_SE_MASK },
  ],
  LINKS,
);

const SEAMS = seamDecor({
  prefix: 'seam',
  maskRows: MASK,
  cell: HOCHIMINH_SCENE_MASK_CELL,
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

export const hochiminh = (() => {
  const m = imageMap({
    id: 'hochiminh',
    name: { vi: 'TP. Hồ Chí Minh', en: 'Ho Chi Minh City' },
    utcOffsetHours: 7,
    terrain: true,
    spawn: { x: 209, y: 214 },
    pois: OBJECTS.filter((o) => o.poiId).map((o) => poiOf(o.poiId!)),
    npcs: NPCS,
    routes: [
      { id: 'hochiminh-boat', sprite: 'mini_boat', path: [{ x: 60, y: 8 }, { x: 340, y: 8 }], speed: 0.9 },
      { id: 'hochiminh-plane', sprite: 'mini_plane', path: [{ x: EX + 100, y: SY + 190 }, { x: EX + 470, y: SY + 190 }], speed: 3.2, loop: true, layer: 'sky' },
    ],
    size: WORLD,
    panels: [
      { suffix: '', x: 0, y: 0 },
      { suffix: '-e', x: EX, y: 0 },
      { suffix: '-s', x: 0, y: SY },
      { suffix: '-se', x: EX, y: SY },
    ],
    links: LINKS,
    mask: { cell: HOCHIMINH_SCENE_MASK_CELL, rows: MASK },
    sounds: ['city-day'],
  });
  m.scene = { sprites: SPRITES, objects: [...OBJECTS, ...SEAMS], ambient: 12 };
  return m;
})();

/** Dự phòng khi chưa tải được ảnh đất: bản đồ ô chung của các thành phố Việt Nam. */
export const hochiminhTiles = vietnamTiles({ id: 'hochiminh', name: { vi: 'TP. Hồ Chí Minh', en: 'Ho Chi Minh City' }, npcs: [] });
