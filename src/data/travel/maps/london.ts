/**
 * LONDON — CHẾ ĐỘ ĐỐI TƯỢNG (kiểu Bến Dừa). Ảnh ĐẤT `public/travel/terrain/london.small.png` (403×243) + lưới đi được
 * `london.scene-walk.ts`; mỗi công trình là một sprite đứng riêng trong `public/travel/sprites/london/`.
 * (x,y) của vật là GIỮA-ĐÁY sprite theo điểm nguồn của ảnh đất. Bản đồ phẳng cũ: `london.flat.ts` (dự phòng).
 * Gán địa điểm: Tower Bridge = Heathrow (cửa ngõ vào London; tranh không có sân bay), Big Ben = ô bí mật.
 */
import type { MapObject, Npc, SceneSprite } from '@/services/travel/types';
import { poiGeometry } from '@/components/travel/engine/scene';
import { imageMap, imagePoi } from './imagemap';
import { composeMask } from '@/components/travel/engine/imageWorld';
import { seamDecor } from './seams';
import { LONDON_SCENE_MASK, LONDON_SCENE_MASK_CELL } from './london.scene-walk';
import { LONDON_SCENE_E_MASK } from './london.scene-walk-e';
import { LONDON_SCENE_S_MASK } from './london.scene-walk-s';
import { LONDON_SCENE_SE_MASK } from './london.scene-walk-se';

/** Thế giới 2×2 mảnh chồng nhau OV điểm (hoà Bayer): A 403×243 ở góc trái-trên; E/S/SE là 418×235, E lệch phải, S lệch xuống. */
const AW = 403;
const AH = 243;
const PW = 418;
const PH = 235;
const OV = 20;
const EX = AW - OV;
const SY = AH - OV;
const WORLD = { w: EX + PW, h: SY + PH };

const linkLine = (from: number, to: number, a: { x: number; y: number }, b: { x: number; y: number }, r = 10, step = 12) => {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
  return Array.from({ length: n + 1 }, (_, i) => ({ from, to, x: Math.round(a.x + ((b.x - a.x) * i) / n), y: Math.round(a.y + ((b.y - a.y) * i) / n), r }));
};
const LINKS = [
  { from: 0, to: 1, x: EX + OV / 2, y: 104, r: 12 }, // cầu đá bên phải A ↔ cầu bên trái E
  { from: 0, to: 2, x: 210, y: SY + OV / 2, r: 12 }, // phố/vạch qua đường dưới A ↔ phố trên S
  ...linkLine(2, 3, { x: EX + 2, y: SY + 105 }, { x: EX + OV - 2, y: SY + 65 }),
  ...linkLine(1, 3, { x: EX + 211, y: SY + 2 }, { x: EX + 160, y: SY + OV - 2 }),
];

const SPRITES: Record<string, SceneSprite> = {
  pub: { w: 87, h: 76 },
  cafe: { w: 72, h: 79 },
  hotel: { w: 69, h: 81 },
  bigben: { w: 64, h: 81 },
  phonebox: { w: 28, h: 54 },
  postbox: { w: 20, h: 39 },
  tube: { w: 85, h: 60 },
  museum: { w: 119, h: 63 },
  bridge: { w: 110, h: 71 },
  tree: { w: 86, h: 69 },
  // ---- GEN SPRITES BEGIN
  airport: { w: 156, h: 64 },
  buckingham: { w: 150, h: 74 },
  camden: { w: 128, h: 51 },
  eye: { w: 86, h: 75 },
  fishchips: { w: 105, h: 88 },
  harrods: { w: 153, h: 86 },
  stpauls: { w: 114, h: 89 },
  // ---- GEN SPRITES END
};

/** Vùng chiếm mặc định: phần dưới ~22% sprite, thu vào hai bên. */
const fp = (sprite: string, frac = 0.22, inset = 0.1) => {
  const s = SPRITES[sprite]!;
  const w = Math.round(s.w * (1 - inset * 2));
  const h = Math.max(4, Math.round(s.h * frac));
  return { x: -Math.round(w / 2), y: -h, w, h };
};
const O = (id: string, sprite: string, x: number, y: number, extra: Partial<MapObject> = {}): MapObject => ({ id, sprite, x, y, footprint: fp(sprite), ...extra });
const DOOR = { dx: 0, dy: 5 };

const OBJECTS: MapObject[] = [
  O('bridge', 'bridge', 193, 78, { poiId: 'london-heathrow', door: DOOR }),
  O('bigben', 'bigben', 92, 102, { poiId: 'london-bigben', door: DOOR, glow: { dx: 0, dy: -55, r: 22 } }),
  O('hotel', 'hotel', 295, 102, { poiId: 'london-inn', door: DOOR }),
  O('pub', 'pub', 75, 176, { poiId: 'london-borough', door: DOOR }),
  O('museum', 'museum', 193, 196, { poiId: 'london-museum', door: DOOR }),
  O('cafe', 'cafe', 300, 178, { poiId: 'london-tearoom', door: DOOR }),
  O('tube', 'tube', 90, 226, { poiId: 'london-tube', door: DOOR }),
  O('phonebox', 'phonebox', 140, 128, { footprint: { x: -6, y: -6, w: 12, h: 6 }, glow: { dx: 0, dy: -30, r: 16 } }),
  O('postbox', 'postbox', 252, 128, { footprint: { x: -5, y: -5, w: 10, h: 5 } }),
  O('tree1', 'tree', 24, 96, { footprint: { x: -8, y: -6, w: 16, h: 6 }, glow: { dx: 14, dy: -40, r: 22 } }),
  O('tree2', 'tree', 352, 134, { footprint: { x: -8, y: -6, w: 16, h: 6 }, glow: { dx: 14, dy: -40, r: 22 } }),
  O('tree3', 'tree', 330, 52, { footprint: { x: -8, y: -6, w: 16, h: 6 } }),
  // ---- GEN BEGIN (mảnh E/S/SE sinh bằng mã + đo cửa trên lưới đi được)
  O('e-buckingham', 'buckingham', EX + 121, 74, { poiId: 'london-buckingham', door: { dx: 0, dy: 4 } }),
  O('e-eye', 'eye', EX + 251, 85, { poiId: 'london-eye', door: { dx: 0, dy: 4 } }),
  O('e-stpauls', 'stpauls', EX + 121, 195, { poiId: 'london-stpauls', door: { dx: 0, dy: 4 } }),
  O('e-pub', 'pub', EX + 334, 101),
  O('e-cafe', 'cafe', EX + 256, 198),
  O('e-hotel', 'hotel', EX + 350, 192),
  O('s-harrods', 'harrods', 70, SY + 106, { poiId: 'london-harrods', door: { dx: 0, dy: 4 } }),
  O('s-camden', 'camden', 276, SY + 94, { poiId: 'london-camden', door: { dx: 0, dy: 4 } }),
  O('s-fishchips', 'fishchips', 210, SY + 183, { poiId: 'london-fishchips', door: { dx: 0, dy: 4 } }),
  O('s-pub', 'pub', 160, SY + 94),
  O('s-hotel', 'hotel', 368, SY + 111),
  O('s-museum', 'museum', 319, SY + 186),
  O('se-airport', 'airport', EX + 209, SY + 222, { poiId: 'london-gate', door: { dx: 0, dy: 4 } }),
  O('se-tube', 'tube', EX + 218, SY + 54),
  O('se-hotel', 'hotel', EX + 46, SY + 50),
  O('se-cafe', 'cafe', EX + 171, SY + 141),
  // ---- GEN END
];

const poiOf = (poiId: string) => {
  const o = OBJECTS.find((x) => x.poiId === poiId)!;
  const g = poiGeometry(o, SPRITES[o.sprite]!);
  return imagePoi(poiId, { hotspot: g.hotspot, door: g.door });
};

const NPCS: Npc[] = [
  {
    id: 'london-npc-traveller',
    sprite: 'npc_tourist',
    at: { x: EX + 250, y: SY + 205 },
    path: [{ x: EX + 330, y: SY + 205 }],
    lines: [
      { en: 'Excuse me, is this the right queue for the flight to Hanoi?', vi: 'Xin lỗi, đây có phải hàng xếp cho chuyến bay đi Hà Nội không ạ?' },
      { en: 'The Underground is faster than a taxi at this hour.', vi: 'Giờ này đi tàu điện ngầm nhanh hơn taxi.' },
    ],
  },
  {
    id: 'london-npc-guard',
    sprite: 'npc_guard',
    at: { x: 160, y: 122 },
    lines: [
      { en: 'Mind the gap, please. And keep to the left.', vi: 'Xin chú ý khoảng trống. Và đi bên trái nhé.' },
      { en: 'Big Ben is the bell, not the tower!', vi: 'Big Ben là cái chuông, không phải toà tháp đâu!' },
    ],
  },
  {
    id: 'london-npc-tourist',
    sprite: 'npc_tourist',
    at: { x: 40, y: 112 },
    path: [{ x: 150, y: 112 }],
    lines: [
      { en: 'Excuse me, could you take a photo of me with the clock tower?', vi: 'Xin lỗi, bạn chụp giúp mình một tấm với toà tháp đồng hồ được không?' },
      { en: 'It never stops raining here, does it?', vi: 'Ở đây trời lúc nào cũng mưa nhỉ?' },
    ],
  },
  {
    id: 'london-npc-vendor',
    sprite: 'npc_vendor',
    at: { x: 119, y: 211 },
    lines: [{ en: 'Fresh scones, two for three pounds. Would you like clotted cream?', vi: 'Bánh scone mới nướng, hai cái ba bảng. Bạn có muốn kem đặc không?' }],
  },
  {
    id: 'london-npc-local',
    sprite: 'npc_local',
    at: { x: 250, y: 112 },
    path: [{ x: 340, y: 112 }],
    lines: [
      { en: 'The Tube is just down the road, by the zebra crossing.', vi: 'Ga Tube ở ngay cuối đường, cạnh vạch sang đường.' },
      { en: 'Take an umbrella. You will need it.', vi: 'Nhớ mang ô nhé. Bạn sẽ cần đấy.' },
    ],
  },
  {
    id: 'london-npc-business',
    sprite: 'npc_business',
    at: { x: 230, y: 214 },
    path: [{ x: 330, y: 214 }],
    lines: [{ en: 'Sorry, I am running late. Which line goes to Victoria?', vi: 'Xin lỗi, tôi đang trễ. Tuyến nào đi Victoria vậy?' }],
  },
  {
    id: 'london-npc-kid',
    sprite: 'npc_kid',
    at: { x: 210, y: 138 },
    lines: [{ en: 'Look, a double-decker bus! Can we sit upstairs?', vi: 'Nhìn kìa, xe buýt hai tầng! Mình ngồi trên tầng hai nhé?' }],
  },
  { id: 'london-npc-cat', sprite: 'cat_sit', at: { x: 160, y: 214 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

const MASK = composeMask(
  WORLD,
  LONDON_SCENE_MASK_CELL,
  [
    { x: 0, y: 0, w: AW, h: AH, cell: LONDON_SCENE_MASK_CELL, rows: LONDON_SCENE_MASK },
    { x: EX, y: 0, w: PW, h: PH, cell: LONDON_SCENE_MASK_CELL, rows: LONDON_SCENE_E_MASK },
    { x: 0, y: SY, w: PW, h: PH, cell: LONDON_SCENE_MASK_CELL, rows: LONDON_SCENE_S_MASK },
    { x: EX, y: SY, w: PW, h: PH, cell: LONDON_SCENE_MASK_CELL, rows: LONDON_SCENE_SE_MASK },
  ],
  LINKS,
);

const SEAMS = seamDecor({
  prefix: 'seam',
  maskRows: MASK,
  cell: LONDON_SCENE_MASK_CELL,
  lines: [
    { x0: EX + OV / 2, y0: 10, x1: EX + OV / 2, y1: AH - 4 },
    { x0: EX + OV / 2, y0: SY + 4, x1: EX + OV / 2, y1: WORLD.h - 10 },
    { x0: 10, y0: SY + OV / 2, x1: AW - 4, y1: SY + OV / 2 },
    { x0: EX + 4, y0: SY + OV / 2, x1: WORLD.w - 10, y1: SY + OV / 2 },
  ],
  gaps: LINKS,
  sprites: ['postbox'],
  spacing: 56,
});

export const london = (() => {
  const m = imageMap({
    id: 'london',
    name: { vi: 'London', en: 'London' },
    utcOffsetHours: 0,
    size: WORLD,
    panels: [
      { suffix: '', x: 0, y: 0, w: AW, h: AH },
      { suffix: '-e', x: EX, y: 0 },
      { suffix: '-s', x: 0, y: SY },
      { suffix: '-se', x: EX, y: SY },
    ],
    links: LINKS,
    terrain: true,
    spawn: { x: 193, y: 214 },
    pois: OBJECTS.filter((o) => o.poiId).map((o) => poiOf(o.poiId!)),
    npcs: NPCS,
    routes: [{ id: 'london-boat', sprite: 'mini_boat', path: [{ x: 20, y: 8 }, { x: 330, y: 12 }], speed: 1.0 }],
    mask: { cell: LONDON_SCENE_MASK_CELL, rows: MASK },
    weather: { kind: 'drizzle', intensity: 0.4 },
    sounds: ['rain-soft', 'city-murmur'],
  });
  m.scene = { sprites: SPRITES, objects: [...OBJECTS, ...SEAMS], ambient: 8 };
  return m;
})();
