/**
 * AMSTERDAM — CHẾ ĐỘ ĐỐI TƯỢNG (kiểu Bến Dừa). Ảnh ĐẤT `public/travel/terrain/amsterdam.small.png` (418×235): kênh là nước
 * (chặn) trừ ba cây cầu đá; `amsterdam.scene-walk.ts` là lưới đi được. Công trình là sprite đứng riêng trong
 * `public/travel/sprites/amsterdam/`; (x,y) là GIỮA-ĐÁY sprite. Bản đồ phẳng cũ: `amsterdam.flat.ts` (dự phòng).
 */
import type { MapObject, Npc, SceneSprite } from '@/services/travel/types';
import { poiGeometry } from '@/components/travel/engine/scene';
import { imageMap, imagePoi } from './imagemap';
import { composeMask } from '@/components/travel/engine/imageWorld';
import { seamDecor } from './seams';
import { AMSTERDAM_SCENE_MASK, AMSTERDAM_SCENE_MASK_CELL } from './amsterdam.scene-walk';
import { AMSTERDAM_SCENE_E_MASK } from './amsterdam.scene-walk-e';
import { AMSTERDAM_SCENE_S_MASK } from './amsterdam.scene-walk-s';
import { AMSTERDAM_SCENE_SE_MASK } from './amsterdam.scene-walk-se';

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
  house: { w: 51, h: 72 },
  row: { w: 102, h: 73 },
  brown: { w: 92, h: 73 },
  windmill: { w: 76, h: 83 },
  rijks: { w: 127, h: 83 },
  station: { w: 122, h: 78 },
  cheese: { w: 87, h: 56 },
  tulips: { w: 92, h: 47 },
  houseboat: { w: 129, h: 59 },
  // ---- GEN SPRITES BEGIN
  annefrank: { w: 60, h: 79 },
  pancake: { w: 81, h: 82 },
  palace: { w: 136, h: 86 },
  bikes: { w: 94, h: 71 },
  airport: { w: 127, h: 70 },
  vangogh: { w: 132, h: 54 },
  stroopwafel: { w: 94, h: 59 },
  drawbridge: { w: 147, h: 72 },
  greenhouse: { w: 124, h: 66 },
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
  O('rijks', 'rijks', 210, 74, { footprint: { x: -54, y: -16, w: 108, h: 16 } }),
  O('brown', 'brown', 76, 90, { poiId: 'amsterdam-cafe', door: DOOR }),
  O('windmill', 'windmill', 331, 89, { poiId: 'amsterdam-windmill', door: { dx: -2, dy: 6 }, footprint: { x: -26, y: -16, w: 52, h: 16 } }),
  O('row', 'row', 74, 186, { poiId: 'amsterdam-canalhouse', door: DOOR }),
  O('station', 'station', 209, 189, { poiId: 'amsterdam-station', door: DOOR }),
  O('tulips', 'tulips', 333, 186, { poiId: 'amsterdam-flowers', door: DOOR, footprint: { x: -38, y: -12, w: 76, h: 12 } }),
  O('houseboat', 'houseboat', 60, 112, { poiId: 'amsterdam-boat', door: { dx: -1, dy: 11 }, footprint: { x: -50, y: -10, w: 100, h: 10 } }),
  O('house', 'house', 24, 72, { footprint: { x: -18, y: -14, w: 36, h: 14 } }),
  O('cheese', 'cheese', 376, 196, { footprint: { x: -34, y: -12, w: 68, h: 12 } }),
  // ---- GEN BEGIN (mảnh E/S/SE sinh bằng mã + đo cửa trên lưới đi được)
  O('e-annefrank', 'annefrank', EX + 76, 75, { poiId: 'amsterdam-annefrank', door: { dx: 0, dy: 4 } }),
  O('e-pancake', 'pancake', EX + 180, 49, { poiId: 'amsterdam-pancake', door: { dx: 0, dy: 4 } }),
  O('e-stroopwafel', 'stroopwafel', EX + 256, 69, { poiId: 'amsterdam-stroopwafel', door: { dx: 0, dy: 4 } }),
  O('e-greenhouse', 'greenhouse', EX + 100, 173, { poiId: 'amsterdam-greenhouse', door: { dx: 0, dy: 4 } }),
  O('e-bikes', 'bikes', EX + 295, 173, { poiId: 'amsterdam-bikes', door: { dx: 0, dy: 4 } }),
  O('e-house', 'house', EX + 370, 169),
  O('s-palace', 'palace', 265, SY + 76, { poiId: 'amsterdam-palace', door: { dx: 0, dy: 4 } }),
  O('s-vangogh', 'vangogh', 64, SY + 76, { poiId: 'amsterdam-vangogh', door: { dx: 0, dy: 4 } }),
  O('s-drawbridge', 'drawbridge', 84, SY + 142, { poiId: 'amsterdam-drawbridge', door: { dx: 0, dy: 4 } }),
  O('s-row', 'row', 152, SY + 76),
  O('s-brown', 'brown', 312, SY + 131),
  O('s-windmill', 'windmill', 151, SY + 184),
  O('se-airport', 'airport', EX + 209, SY + 228, { poiId: 'amsterdam-gate', door: { dx: 0, dy: 4 } }),
  O('se-rijks', 'rijks', EX + 90, SY + 62),
  O('se-tulips', 'tulips', EX + 346, SY + 132),
  O('se-row', 'row', EX + 190, SY + 132),
  O('se-cheese', 'cheese', EX + 259, SY + 141),
  // ---- GEN END
];

const poiOf = (poiId: string) => {
  const o = OBJECTS.find((x) => x.poiId === poiId)!;
  const g = poiGeometry(o, SPRITES[o.sprite]!);
  return imagePoi(poiId, { hotspot: g.hotspot, door: g.door });
};

const NPCS: Npc[] = [
  {
    id: 'amsterdam-npc-traveller',
    sprite: 'npc_tourist',
    at: { x: EX + 250, y: SY + 205 },
    path: [{ x: EX + 330, y: SY + 205 }],
    lines: [
      { en: 'Excuse me, can I take my bike on the train to the airport?', vi: 'Xin lỗi, tôi mang xe đạp lên tàu ra sân bay được không?' },
      { en: 'Everyone here cycles, even in the rain.', vi: 'Ở đây ai cũng đạp xe, kể cả khi mưa.' },
    ],
  },
  {
    id: 'amsterdam-npc-local',
    sprite: 'npc_local',
    at: { x: 150, y: 214 },
    path: [{ x: 260, y: 214 }],
    lines: [
      { en: 'Watch out for the bikes! They have the right of way.', vi: 'Coi chừng xe đạp! Họ được ưu tiên đi trước.' },
      { en: 'Central Station is just behind you.', vi: 'Ga Trung tâm ở ngay sau lưng bạn.' },
    ],
  },
  {
    id: 'amsterdam-npc-tourist',
    sprite: 'npc_tourist',
    at: { x: 149, y: 129 },
    path: [{ x: 269, y: 129 }],
    lines: [
      { en: 'Excuse me, where can I buy a ticket for the canal boat?', vi: 'Xin lỗi, mua vé thuyền du lịch kênh ở đâu vậy?' },
      { en: 'Every bridge here looks the same, but they are all beautiful.', vi: 'Cầu nào ở đây nhìn cũng giống nhau, mà cái nào cũng đẹp.' },
    ],
  },
  {
    id: 'amsterdam-npc-vendor',
    sprite: 'npc_vendor',
    at: { x: 300, y: 196 },
    lines: [{ en: 'Tulips, ten euros a bunch. Which colour do you like?', vi: 'Hoa tulip mười euro một bó. Bạn thích màu nào?' }],
  },
  {
    id: 'amsterdam-npc-kid',
    sprite: 'npc_kid',
    at: { x: 239, y: 129 },
    lines: [{ en: 'Look at the swans! They are following the boat.', vi: 'Nhìn đàn thiên nga kìa! Chúng đang đi theo con thuyền.' }],
  },
  {
    id: 'amsterdam-npc-business',
    sprite: 'npc_business',
    at: { x: 120, y: 124 },
    path: [{ x: 330, y: 124 }],
    lines: [{ en: 'Sorry, I am rushing to catch the tram.', vi: 'Xin lỗi, tôi đang vội bắt xe điện.' }],
  },
  { id: 'amsterdam-npc-cat', sprite: 'cat_sit', at: { x: 176, y: 214 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

const MASK = composeMask(
  WORLD,
  AMSTERDAM_SCENE_MASK_CELL,
  [
    { x: 0, y: 0, w: AW, h: AH, cell: AMSTERDAM_SCENE_MASK_CELL, rows: AMSTERDAM_SCENE_MASK },
    { x: EX, y: 0, w: PW, h: PH, cell: AMSTERDAM_SCENE_MASK_CELL, rows: AMSTERDAM_SCENE_E_MASK },
    { x: 0, y: SY, w: PW, h: PH, cell: AMSTERDAM_SCENE_MASK_CELL, rows: AMSTERDAM_SCENE_S_MASK },
    { x: EX, y: SY, w: PW, h: PH, cell: AMSTERDAM_SCENE_MASK_CELL, rows: AMSTERDAM_SCENE_SE_MASK },
  ],
  LINKS,
);

const SEAMS = seamDecor({
  prefix: 'seam',
  maskRows: MASK,
  cell: AMSTERDAM_SCENE_MASK_CELL,
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

export const amsterdam = (() => {
  const m = imageMap({
    id: 'amsterdam',
    name: { vi: 'Amsterdam', en: 'Amsterdam' },
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
    spawn: { x: 200, y: 215 },
    pois: OBJECTS.filter((o) => o.poiId).map((o) => poiOf(o.poiId!)),
    npcs: NPCS,
    routes: [
      { id: 'amsterdam-boat-a', sprite: 'mini_boat', path: [{ x: 120, y: 6 }, { x: 300, y: 6 }], speed: 1.0 },
      { id: 'amsterdam-boat-b', sprite: 'mini_boat', path: [{ x: 390, y: 100 }, { x: 404, y: 136 }], speed: 0.4 },
    ],
    mask: { cell: AMSTERDAM_SCENE_MASK_CELL, rows: MASK },
    weather: { kind: 'wind', intensity: 0.5 },
    sounds: ['city-day', 'water-lap'],
  });
  m.scene = { sprites: SPRITES, objects: [...OBJECTS, ...SEAMS], ambient: 8 };
  return m;
})();
