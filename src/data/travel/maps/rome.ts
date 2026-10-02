/**
 * ROME — CHẾ ĐỘ ĐỐI TƯỢNG (kiểu Bến Dừa). Ảnh ĐẤT `public/travel/terrain/rome.small.png` (418×235) + lưới đi được
 * `rome.scene-walk.ts` (sinh bằng `tools/walkmask.py`, khoá `rome-scene`); công trình là sprite đứng riêng trong
 * `public/travel/sprites/rome/`, (x,y) là GIỮA-ĐÁY. Bản đồ phẳng cũ: `rome.flat.ts` (dự phòng).
 * Gán địa điểm: Colosseum (ô trên giữa), Trevi (đặt TRÊN bể nước giữa quảng trường), trattoria, Vatican = vương cung thánh đường,
 * Termini = Pantheon (toà lớn ở dưới), chợ = quầy gelato. Pizzeria và khách sạn chỉ để trang trí.
 */
import type { MapObject, Npc, SceneSprite } from '@/services/travel/types';
import { poiGeometry } from '@/components/travel/engine/scene';
import { imageMap, imagePoi } from './imagemap';
import { composeMask } from '@/components/travel/engine/imageWorld';
import { seamDecor } from './seams';
import { ROME_SCENE_MASK, ROME_SCENE_MASK_CELL } from './rome.scene-walk';
import { ROME_SCENE_E_MASK } from './rome.scene-walk-e';
import { ROME_SCENE_S_MASK } from './rome.scene-walk-s';
import { ROME_SCENE_SE_MASK } from './rome.scene-walk-se';

/** Thế giới 2×2 mảnh chồng nhau OV điểm (hoà Bayer): A 418×235 ở góc trái-trên; E/S/SE là 418×235, E lệch phải, S lệch xuống. */
const AW = 418;
const AH = 235;
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
  { from: 0, to: 1, x: EX + OV / 2, y: 90, r: 12 }, // cầu đá bên phải A ↔ cầu bên trái E
  { from: 0, to: 2, x: 210, y: SY + OV / 2, r: 12 }, // phố/vạch qua đường dưới A ↔ phố trên S
  ...linkLine(2, 3, { x: EX + 2, y: SY + 105 }, { x: EX + OV - 2, y: SY + 65 }),
  ...linkLine(1, 3, { x: EX + 211, y: SY + 2 }, { x: EX + 160, y: SY + OV - 2 }),
];

const SPRITES: Record<string, SceneSprite> = {
  lamp: { file: '../paris/props.png', w: 12, h: 50, crop: { x: 59, y: 10, w: 12, h: 50 } },
  colosseum: { w: 102, h: 68 },
  trattoria: { w: 85, h: 69 },
  pizzeria: { w: 92, h: 68 },
  pantheon: { w: 95, h: 76 },
  gelato: { w: 82, h: 73 },
  hotel: { w: 91, h: 78 },
  trevi: { w: 114, h: 78 },
  basilica: { w: 101, h: 78 },
  // ---- GEN SPRITES BEGIN
  stpeters: { w: 134, h: 92 },
  castel: { w: 109, h: 88 },
  arch: { w: 94, h: 59 },
  steps: { w: 116, h: 90 },
  carbonara: { w: 121, h: 62 },
  espresso: { w: 101, h: 66 },
  vespa: { w: 114, h: 60 },
  aqueduct: { w: 137, h: 60 },
  airport: { w: 137, h: 60 },
  // ---- GEN SPRITES END
};

const fp = (sprite: string, frac = 0.22, inset = 0.1) => {
  const s = SPRITES[sprite]!;
  const w = Math.round(s.w * (1 - inset * 2));
  const h = Math.max(4, Math.round(s.h * frac));
  return { x: -Math.round(w / 2), y: -h, w, h };
};
const O = (id: string, sprite: string, x: number, y: number, extra: Partial<MapObject> = {}): MapObject => ({ id, sprite, x, y, footprint: fp(sprite), ...extra });
const DOOR = { dx: 0, dy: 5 };

const OBJECTS: MapObject[] = [
  O('colosseum', 'colosseum', 213, 76, { poiId: 'rome-colosseum', door: DOOR }),
  O('trevi', 'trevi', 214, 124, { poiId: 'rome-trevi', door: { dx: 0, dy: 7 }, footprint: { x: -38, y: -26, w: 76, h: 26 } }),
  O('trattoria', 'trattoria', 85, 90, { poiId: 'rome-trattoria', door: DOOR }),
  O('basilica', 'basilica', 332, 92, { poiId: 'rome-vatican', door: DOOR }),
  O('pantheon', 'pantheon', 215, 192, { poiId: 'rome-termini', door: DOOR }),
  O('gelato', 'gelato', 335, 189, { poiId: 'rome-market', door: DOOR }),
  O('pizzeria', 'pizzeria', 114, 126),
  O('hotel', 'hotel', 87, 186),
  // ---- GEN BEGIN (mảnh E/S/SE sinh bằng mã + đo cửa trên lưới đi được)
  O('e-stpeters', 'stpeters', EX + 156, 41, { poiId: 'rome-stpeters', door: { dx: 0, dy: 4 } }),
  O('e-castel', 'castel', EX + 255, 51, { poiId: 'rome-castel', door: { dx: 0, dy: 4 } }),
  O('e-arch', 'arch', EX + 344, 94, { poiId: 'rome-arch', door: { dx: 0, dy: 8 } }),
  O('e-steps', 'steps', EX + 344, 165, { poiId: 'rome-steps', door: { dx: 0, dy: 4 } }),
  O('e-carbonara', 'carbonara', EX + 168, 209, { poiId: 'rome-carbonara', door: { dx: 0, dy: 4 } }),
  O('e-espresso', 'espresso', EX + 326, 209, { poiId: 'rome-espresso', door: { dx: 0, dy: 4 } }),
  O('s-vespa', 'vespa', 62, SY + 86, { poiId: 'rome-vespa', door: { dx: 0, dy: 4 } }),
  O('s-aqueduct', 'aqueduct', 274, SY + 81, { poiId: 'rome-aqueduct', door: { dx: 0, dy: 11 } }),
  O('s-gelato', 'gelato', 147, SY + 76),
  O('s-hotel', 'hotel', 370, SY + 89),
  O('s-pantheon', 'pantheon', 72, SY + 139),
  O('s-basilica', 'basilica', 357, SY + 196),
  O('se-airport', 'airport', EX + 209, SY + 226, { poiId: 'rome-gate', door: { dx: 0, dy: 4 } }),
  O('se-pantheon', 'pantheon', EX + 214, SY + 51),
  O('se-colosseum', 'colosseum', EX + 68, SY + 135),
  O('se-trevi', 'trevi', EX + 199, SY + 141),
  // ---- GEN END
];

const poiOf = (poiId: string) => {
  const o = OBJECTS.find((x) => x.poiId === poiId)!;
  const g = poiGeometry(o, SPRITES[o.sprite]!);
  return imagePoi(poiId, { hotspot: g.hotspot, door: g.door });
};

const NPCS: Npc[] = [
  {
    id: 'rome-npc-traveller',
    sprite: 'npc_tourist',
    at: { x: EX + 250, y: SY + 205 },
    path: [{ x: EX + 330, y: SY + 205 }],
    lines: [
      { en: 'Excuse me, which gate is the flight to Hanoi?', vi: 'Xin lỗi, chuyến bay đi Hà Nội ở cổng nào ạ?' },
      { en: 'I would stay in Rome forever.', vi: 'Mình muốn ở lại Rome mãi.' },
    ],
  },
  {
    id: 'rome-npc-local',
    sprite: 'npc_local',
    at: { x: 170, y: 132 },
    path: [{ x: 262, y: 132 }],
    lines: [
      { en: 'Throw a coin over your shoulder and you will come back to Rome.', vi: 'Ném một đồng xu qua vai là bạn sẽ quay lại Rome.' },
      { en: 'Walk, do not rush. Rome was not built in a day!', vi: 'Cứ đi chậm thôi. Rome đâu có xây xong trong một ngày!' },
    ],
  },
  {
    id: 'rome-npc-tourist',
    sprite: 'npc_tourist',
    at: { x: 150, y: 80 },
    path: [{ x: 153, y: 119 }],
    lines: [
      { en: 'Excuse me, how do I get to the Colosseum entrance?', vi: 'Xin lỗi, đi tới cổng Colosseum như thế nào ạ?' },
      { en: 'It is hotter than I expected!', vi: 'Trời nóng hơn mình tưởng!' },
    ],
  },
  {
    id: 'rome-npc-vendor',
    sprite: 'npc_vendor',
    at: { x: 316, y: 196 },
    lines: [{ en: 'Gelato! Pistachio or lemon? Taste one, please.', vi: 'Kem gelato đây! Hạt dẻ cười hay chanh? Mời bạn nếm thử.' }],
  },
  {
    id: 'rome-npc-elder',
    sprite: 'npc_elder',
    at: { x: 280, y: 132 },
    lines: [{ en: 'The pasta here is the best in the city. Order the carbonara.', vi: 'Mì ở đây ngon nhất thành phố. Bạn gọi món carbonara nhé.' }],
  },
  {
    id: 'rome-npc-kid',
    sprite: 'npc_kid',
    at: { x: 244, y: 132 },
    lines: [{ en: 'I made a wish! Dad gave me a coin.', vi: 'Con vừa ước xong! Bố cho con một đồng xu.' }],
  },
  {
    id: 'rome-npc-guard',
    sprite: 'npc_guard',
    at: { x: 250, y: 214 },
    path: [{ x: 170, y: 214 }],
    lines: [{ en: 'Tickets for the Metro are over there, next to the stairs.', vi: 'Vé Metro ở đằng kia, cạnh cầu thang.' }],
  },
  { id: 'rome-npc-cat', sprite: 'cat_sit', at: { x: 120, y: 214 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

const MASK = composeMask(
  WORLD,
  ROME_SCENE_MASK_CELL,
  [
    { x: 0, y: 0, w: AW, h: AH, cell: ROME_SCENE_MASK_CELL, rows: ROME_SCENE_MASK },
    { x: EX, y: 0, w: PW, h: PH, cell: ROME_SCENE_MASK_CELL, rows: ROME_SCENE_E_MASK },
    { x: 0, y: SY, w: PW, h: PH, cell: ROME_SCENE_MASK_CELL, rows: ROME_SCENE_S_MASK },
    { x: EX, y: SY, w: PW, h: PH, cell: ROME_SCENE_MASK_CELL, rows: ROME_SCENE_SE_MASK },
  ],
  LINKS,
);

const SEAMS = seamDecor({
  prefix: 'seam',
  maskRows: MASK,
  cell: ROME_SCENE_MASK_CELL,
  lines: [
    { x0: EX + OV / 2, y0: 10, x1: EX + OV / 2, y1: AH - 4 },
    { x0: EX + OV / 2, y0: SY + 4, x1: EX + OV / 2, y1: WORLD.h - 10 },
    { x0: 10, y0: SY + OV / 2, x1: AW - 4, y1: SY + OV / 2 },
    { x0: EX + 4, y0: SY + OV / 2, x1: WORLD.w - 10, y1: SY + OV / 2 },
  ],
  gaps: LINKS,
  sprites: ['lamp'],
  spacing: 56,
});

export const rome = (() => {
  const m = imageMap({
    id: 'rome',
    name: { vi: 'Rome', en: 'Rome' },
    utcOffsetHours: 1,
    terrain: true,
    size: WORLD,
    panels: [
      { suffix: '', x: 0, y: 0 },
      { suffix: '-e', x: EX, y: 0 },
      { suffix: '-s', x: 0, y: SY },
      { suffix: '-se', x: EX, y: SY },
    ],
    links: LINKS,
    spawn: { x: 210, y: 214 },
    pois: OBJECTS.filter((o) => o.poiId).map((o) => poiOf(o.poiId!)),
    npcs: NPCS,
    routes: [{ id: 'rome-boat', sprite: 'mini_boat', path: [{ x: 120, y: 7 }, { x: 330, y: 7 }], speed: 0.9 }],
    mask: { cell: ROME_SCENE_MASK_CELL, rows: MASK },
    sounds: ['city-day', 'fountain'],
  });
  m.scene = { sprites: SPRITES, objects: [...OBJECTS, ...SEAMS], ambient: 8 };
  return m;
})();
