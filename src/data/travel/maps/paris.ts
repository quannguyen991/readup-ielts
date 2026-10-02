/**
 * PARIS — CHẾ ĐỘ ĐỐI TƯỢNG (kiểu Bến Dừa). Ảnh ĐẤT `public/travel/terrain/paris.small.png` (418×235) + lưới đi được
 * `paris.scene-walk.ts`; mỗi công trình là một sprite đứng riêng trong `public/travel/sprites/paris/`. (x,y) của vật là
 * GIỮA-ĐÁY sprite. Bản đồ phẳng cũ: `paris.flat.ts` (dự phòng). Khách sạn và Khải Hoàn Môn chưa đặt (không có địa điểm).
 */
import type { MapObject, Npc, SceneSprite } from '@/services/travel/types';
import { poiGeometry } from '@/components/travel/engine/scene';
import { imageMap, imagePoi } from './imagemap';
import { composeMask } from '@/components/travel/engine/imageWorld';
import { seamDecor } from './seams';
import { PARIS_SCENE_MASK, PARIS_SCENE_MASK_CELL } from './paris.scene-walk';
import { PARIS_SCENE_E_MASK } from './paris.scene-walk-e';
import { PARIS_SCENE_S_MASK } from './paris.scene-walk-s';
import { PARIS_SCENE_SE_MASK } from './paris.scene-walk-se';

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
  { from: 0, to: 1, x: EX + OV / 2, y: 88, r: 12 }, // cầu đá bên phải A ↔ cầu bên trái E
  { from: 0, to: 2, x: 210, y: SY + OV / 2, r: 12 }, // phố/vạch qua đường dưới A ↔ phố trên S
  ...linkLine(2, 3, { x: EX + 2, y: SY + 105 }, { x: EX + OV - 2, y: SY + 65 }),
  ...linkLine(1, 3, { x: EX + 211, y: SY + 2 }, { x: EX + 160, y: SY + OV - 2 }),
];

const SPRITES: Record<string, SceneSprite> = {
  eiffel: { w: 69, h: 76 },
  louvre: { w: 112, h: 71 },
  metro: { w: 68, h: 68 },
  cafe: { w: 77, h: 82 },
  bakery: { w: 72, h: 82 },
  flowers: { w: 83, h: 66 },
  // bảng đạo cụ `props.png` tách thành từng vật
  tree: { file: 'props.png', w: 55, h: 62, crop: { x: 0, y: 0, w: 55, h: 62 }, erase: [{ x: 30, y: 44, w: 25, h: 18 }] },
  bench: { file: 'props.png', w: 28, h: 18, crop: { x: 30, y: 44, w: 28, h: 18 } },
  lamp: { file: 'props.png', w: 12, h: 50, crop: { x: 59, y: 10, w: 12, h: 50 } },
  kiosk: { file: 'props.png', w: 30, h: 57, crop: { x: 70, y: 5, w: 30, h: 57 } },
  // ---- GEN SPRITES BEGIN
  orsay: { w: 148, h: 68 },
  notredame: { w: 98, h: 81 },
  creperie: { w: 95, h: 70 },
  sacrecoeur: { w: 106, h: 84 },
  carousel: { w: 97, h: 68 },
  perfume: { w: 87, h: 72 },
  moulin: { w: 101, h: 84 },
  bouquiniste: { w: 118, h: 68 },
  airport: { w: 147, h: 68 },
  hotel: { w: 61, h: 82 },
  arc: { w: 76, h: 67 },
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
const LAMP = { footprint: { x: -2, y: -3, w: 4, h: 3 }, glow: { dx: 0, dy: -40, r: 24 } };

const OBJECTS: MapObject[] = [
  O('eiffel', 'eiffel', 196, 76, { poiId: 'paris-eiffel', door: DOOR, glow: { dx: 0, dy: -50, r: 26 } }),
  O('cafe', 'cafe', 72, 92, { poiId: 'paris-cafe', door: { dx: -1, dy: 7 } }),
  O('bakery', 'bakery', 307, 96, { poiId: 'paris-bistro', door: DOOR }),
  O('louvre', 'louvre', 79, 178, { poiId: 'paris-louvre', door: DOOR }),
  O('flowers', 'flowers', 312, 178, { poiId: 'paris-boutique', door: DOOR }),
  O('metro', 'metro', 198, 184, { poiId: 'paris-station', door: DOOR }),
  O('tree1', 'tree', 20, 62, { footprint: { x: -6, y: -5, w: 12, h: 5 } }),
  O('tree2', 'tree', 124, 126, { footprint: { x: -6, y: -5, w: 12, h: 5 } }),
  O('tree3', 'tree', 362, 124, { footprint: { x: -6, y: -5, w: 12, h: 5 } }),
  O('bench1', 'bench', 168, 131, { footprint: { x: -12, y: -5, w: 24, h: 5 } }),
  O('bench2', 'bench', 230, 131, { footprint: { x: -12, y: -5, w: 24, h: 5 } }),
  O('kiosk', 'kiosk', 252, 112, { footprint: { x: -12, y: -6, w: 24, h: 6 } }),
  O('lamp1', 'lamp', 150, 104, LAMP),
  O('lamp2', 'lamp', 248, 126, LAMP),
  O('lamp3', 'lamp', 120, 196, LAMP),
  O('lamp4', 'lamp', 280, 198, LAMP),
  // ---- GEN BEGIN (mảnh E/S/SE sinh bằng mã + đo cửa trên lưới đi được)
  O('e-orsay', 'orsay', EX + 129, 70, { poiId: 'paris-orsay', door: { dx: 0, dy: 4 } }),
  O('e-notredame', 'notredame', EX + 292, 102, { poiId: 'paris-notredame', door: { dx: 0, dy: 4 } }),
  O('e-creperie', 'creperie', EX + 150, 102, { poiId: 'paris-creperie', door: { dx: 0, dy: 4 } }),
  O('e-sacrecoeur', 'sacrecoeur', EX + 131, 192, { poiId: 'paris-sacrecoeur', door: { dx: 0, dy: 4 } }),
  O('e-carousel', 'carousel', EX + 288, 182, { poiId: 'paris-carousel', door: { dx: 0, dy: 4 } }),
  O('e-perfume', 'perfume', EX + 359, 200, { poiId: 'paris-perfume', door: { dx: 0, dy: 4 } }),
  O('s-moulin', 'moulin', 135, SY + 86, { poiId: 'paris-moulin', door: { dx: 0, dy: 4 } }),
  O('s-bouquiniste', 'bouquiniste', 134, SY + 151, { poiId: 'paris-bouquiniste', door: { dx: 0, dy: 4 } }),
  O('s-bakery', 'bakery', 266, SY + 86),
  O('s-hotel', 'hotel', 351, SY + 94),
  O('s-arc', 'arc', 304, SY + 158),
  O('s-flowers', 'flowers', 303, SY + 201),
  O('se-airport', 'airport', EX + 209, SY + 228, { poiId: 'paris-gate', door: { dx: 0, dy: 4 } }),
  O('se-louvre', 'louvre', EX + 116, SY + 149),
  O('se-arc', 'arc', EX + 189, SY + 79),
  O('se-flowers', 'flowers', EX + 233, SY + 149),
  // ---- GEN END
];

const poiOf = (poiId: string) => {
  const o = OBJECTS.find((x) => x.poiId === poiId)!;
  const g = poiGeometry(o, SPRITES[o.sprite]!);
  return imagePoi(poiId, { hotspot: g.hotspot, door: g.door });
};

const NPCS: Npc[] = [
  {
    id: 'paris-npc-traveller',
    sprite: 'npc_tourist',
    at: { x: EX + 250, y: SY + 205 },
    path: [{ x: EX + 330, y: SY + 205 }],
    lines: [
      { en: 'Excuse me, where can I buy a ticket for the airport shuttle?', vi: 'Xin lỗi, mua vé xe đưa đón ra sân bay ở đâu ạ?' },
      { en: 'Do not forget your passport!', vi: 'Đừng quên hộ chiếu nhé!' },
    ],
  },
  {
    id: 'paris-npc-local',
    sprite: 'npc_local',
    at: { x: 150, y: 108 },
    path: [{ x: 249, y: 105 }],
    lines: [
      { en: 'The Eiffel Tower sparkles every hour after dark.', vi: 'Tháp Eiffel lấp lánh mỗi giờ khi trời tối.' },
      { en: 'Take the Métro, it is faster than the bus.', vi: 'Đi Métro nhé, nhanh hơn xe buýt.' },
    ],
  },
  {
    id: 'paris-npc-tourist',
    sprite: 'npc_tourist',
    at: { x: 196, y: 90 },
    path: [{ x: 196, y: 130 }],
    lines: [
      { en: 'Excuse me, how far is the Louvre from here?', vi: 'Xin lỗi, từ đây đến Louvre bao xa vậy?' },
      { en: 'Is it better to climb the tower or take the lift?', vi: 'Nên leo thang bộ hay đi thang máy lên tháp?' },
    ],
  },
  {
    id: 'paris-npc-vendor',
    sprite: 'npc_vendor',
    at: { x: 290, y: 104 },
    lines: [{ en: 'A croissant and a coffee? Of course!', vi: 'Một bánh sừng bò và một ly cà phê? Tất nhiên rồi!' }],
  },
  {
    id: 'paris-npc-elder',
    sprite: 'npc_elder',
    at: { x: 100, y: 190 },
    lines: [{ en: 'I have walked past this museum for fifty years.', vi: 'Tôi đi ngang bảo tàng này đã năm mươi năm rồi.' }],
  },
  {
    id: 'paris-npc-kid',
    sprite: 'npc_kid',
    at: { x: 205, y: 135 },
    lines: [{ en: 'Can I throw a coin in the fountain?', vi: 'Con ném đồng xu vào đài phun nước được không?' }],
  },
  {
    id: 'paris-npc-business',
    sprite: 'npc_business',
    at: { x: 250, y: 214 },
    path: [{ x: 340, y: 214 }],
    lines: [{ en: 'Sorry, I am late for a lunch meeting at the bistro.', vi: 'Xin lỗi, tôi trễ buổi hẹn ăn trưa ở quán bistro rồi.' }],
  },
  { id: 'paris-npc-cat', sprite: 'cat_sit', at: { x: 150, y: 214 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

const MASK = composeMask(
  WORLD,
  PARIS_SCENE_MASK_CELL,
  [
    { x: 0, y: 0, w: AW, h: AH, cell: PARIS_SCENE_MASK_CELL, rows: PARIS_SCENE_MASK },
    { x: EX, y: 0, w: PW, h: PH, cell: PARIS_SCENE_MASK_CELL, rows: PARIS_SCENE_E_MASK },
    { x: 0, y: SY, w: PW, h: PH, cell: PARIS_SCENE_MASK_CELL, rows: PARIS_SCENE_S_MASK },
    { x: EX, y: SY, w: PW, h: PH, cell: PARIS_SCENE_MASK_CELL, rows: PARIS_SCENE_SE_MASK },
  ],
  LINKS,
);

const SEAMS = seamDecor({
  prefix: 'seam',
  maskRows: MASK,
  cell: PARIS_SCENE_MASK_CELL,
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

export const paris = (() => {
  const m = imageMap({
    id: 'paris',
    name: { vi: 'Paris', en: 'Paris' },
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
    spawn: { x: 190, y: 212 },
    pois: OBJECTS.filter((o) => o.poiId).map((o) => poiOf(o.poiId!)),
    npcs: NPCS,
    routes: [{ id: 'paris-boat', sprite: 'mini_boat', path: [{ x: 20, y: 9 }, { x: 330, y: 9 }], speed: 1.0 }],
    mask: { cell: PARIS_SCENE_MASK_CELL, rows: MASK },
    sounds: ['city-day'],
  });
  m.scene = { sprites: SPRITES, objects: [...OBJECTS, ...SEAMS], ambient: 8 };
  return m;
})();
