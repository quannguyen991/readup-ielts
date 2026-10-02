/**
 * SINGAPORE — CHẾ ĐỘ ĐỐI TƯỢNG (kiểu Bến Dừa). Lớp 1: ảnh ĐẤT trống `public/travel/terrain/singapore.small.png`
 * (418×235 điểm nguồn) + lưới đi được `singapore.scene-walk.ts`. Lớp 2: mỗi công trình là một sprite đứng riêng trong
 * `public/travel/sprites/singapore/` (mặt tiền + cửa ở đáy), xếp theo độ sâu cùng người chơi. Lớp 3: người, xe, chim,
 * nước, mưa, đèn do engine vẽ bằng mã. Mọi toạ độ là điểm nguồn của ảnh đất; (x,y) của vật là GIỮA-ĐÁY sprite.
 * Bản đồ phẳng cũ (`singapore.flat.ts`) chỉ còn là dự phòng khi ảnh đất không tải được.
 */
import type { MapObject, Npc, SceneSprite } from '@/services/travel/types';
import { poiGeometry } from '@/components/travel/engine/scene';
import { imageMap, imagePoi } from './imagemap';
import { composeMask } from '@/components/travel/engine/imageWorld';
import { seamDecor } from './seams';
import { SINGAPORE_SCENE_MASK, SINGAPORE_SCENE_MASK_CELL } from './singapore.scene-walk';
import { SINGAPORE_SCENE_E_MASK } from './singapore.scene-walk-e';
import { SINGAPORE_SCENE_S_MASK } from './singapore.scene-walk-s';
import { SINGAPORE_SCENE_SE_MASK } from './singapore.scene-walk-se';

/**
 * Thế giới 2×2 mảnh 418×235 CHỒNG nhau OV điểm (hoà bằng mặt nạ Bayer, xem `ImageLayer.blend`): E lệch phải PW−OV,
 * S lệch xuống PH−OV. Hộp bao = 816×450.
 */
const PW = 418;
const PH = 235;
const OV = 20;
const EX = PW - OV;
const SY = PH - OV;
const WORLD = { w: EX + PW, h: SY + PH };

/** Dãy điểm nối dọc một đoạn thẳng (khoét hành lang liền) giữa hai mảnh. */
const linkLine = (from: number, to: number, a: { x: number; y: number }, b: { x: number; y: number }, r = 10, step = 12) => {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
  return Array.from({ length: n + 1 }, (_, i) => ({ from, to, x: Math.round(a.x + ((b.x - a.x) * i) / n), y: Math.round(a.y + ((b.y - a.y) * i) / n), r }));
};
const LINKS = [
  { from: 0, to: 1, x: EX + OV / 2, y: 111, r: 12 }, // cầu bên phải của A ↔ cầu bên trái của E
  { from: 0, to: 2, x: 221, y: SY + OV / 2, r: 12 }, // đường dạo xuống đường nhựa phía nam ↔ lối đi cắt ngang đường của S
  // S → SE: đường ở mép phải S (y≈105) nối sang đường mép trái SE (y≈70)
  ...linkLine(2, 3, { x: EX + 2, y: SY + 105 }, { x: EX + OV - 2, y: SY + 70 }),
  // E → SE: đường mép dưới E (x≈240) nối xuống đường mép trên SE (x≈170)
  ...linkLine(1, 3, { x: EX + 240, y: SY + 2 }, { x: EX + 170, y: SY + OV - 2 }),
];

const SPRITES: Record<string, SceneSprite> = {
  hawker: { w: 139, h: 70 },
  mrt: { w: 107, h: 56 },
  hotel: { w: 128, h: 80 },
  mbs: { w: 123, h: 76 },
  merlion: { w: 99, h: 75 },
  supertree: { w: 101, h: 77 },
  dome: { w: 131, h: 62 },
  airport: { w: 140, h: 55 },
  // bộ sprite thứ hai (public/travel/sprites/singapore2/)
  mall: { file: '../singapore2/mall.png', w: 124, h: 73 },
  flyer: { file: '../singapore2/flyer.png', w: 89, h: 73 },
  artscience: { file: '../singapore2/artscience.png', w: 108, h: 66 },
  shophouse: { file: '../singapore2/shophouse.png', w: 111, h: 70 },
  temple: { file: '../singapore2/temple.png', w: 116, h: 70 },
  kopitiam: { file: '../singapore2/kopitiam.png', w: 115, h: 68 },
  hdb: { file: '../singapore2/hdb.png', w: 105, h: 75 },
  beachbar: { file: '../singapore2/beachbar.png', w: 126, h: 69 },
  cablecar: { file: '../singapore2/cablecar.png', w: 125, h: 65 },
  // bảng đạo cụ `props.png` tách thành từng vật
  palm_a: { file: 'props.png', w: 46, h: 59, crop: { x: 0, y: 0, w: 46, h: 59 }, erase: [{ x: 34, y: 39, w: 12, h: 20 }] },
  palm_b: { file: 'props.png', w: 48, h: 57, crop: { x: 48, y: 2, w: 48, h: 57 } },
  bench: { file: 'props.png', w: 29, h: 20, crop: { x: 34, y: 39, w: 29, h: 20 } },
  lamp: { file: 'props.png', w: 10, h: 52, crop: { x: 96, y: 7, w: 10, h: 52 } },
};

/** Vùng chiếm mặc định: phần dưới ~40% sprite, thu vào hai bên một chút. */
const fp = (sprite: string, frac = 0.4, inset = 0.06) => {
  const s = SPRITES[sprite]!;
  const w = Math.round(s.w * (1 - inset * 2));
  const h = Math.round(s.h * frac);
  return { x: -Math.round(w / 2), y: -h, w, h };
};

const O = (id: string, sprite: string, x: number, y: number, extra: Partial<MapObject> = {}): MapObject => ({ id, sprite, x, y, footprint: fp(sprite), ...extra });

const DOOR = { dx: 0, dy: 6 };

const OBJECTS: MapObject[] = [
  O('mbs', 'mbs', 230, 72, { poiId: 'singapore-mbs', door: { dx: 0, dy: 6 }, footprint: { x: -54, y: -20, w: 108, h: 20 } }),
  O('hawker', 'hawker', 117, 95, { poiId: 'singapore-hawker', door: { dx: 0, dy: 6 }, footprint: { x: -56, y: -22, w: 112, h: 22 } }),
  O('hotel', 'hotel', 125, 184, { poiId: 'singapore-hotel', door: { dx: 0, dy: 5 }, footprint: { x: -54, y: -26, w: 108, h: 26 } }),
  O('mrt', 'mrt', 342, 178, { poiId: 'singapore-mrt', door: { dx: -1, dy: 5 }, footprint: { x: -44, y: -20, w: 88, h: 20 } }),
  O('supertree', 'supertree', 333, 104, { poiId: 'singapore-gardens', door: { dx: 0, dy: 6 }, footprint: { x: -26, y: -16, w: 52, h: 16 } }),
  O('merlion', 'merlion', 230, 120, { poiId: 'singapore-merlion', door: { dx: 0, dy: 7 }, footprint: { x: -30, y: -22, w: 60, h: 22 } }),
  O('airport', 'airport', 210, 228, { poiId: 'singapore-changi', door: { dx: 0, dy: 5 }, footprint: { x: -56, y: -16, w: 112, h: 16 } }),
  O('dome', 'dome', 352, 62, { footprint: { x: -48, y: -14, w: 96, h: 14 } }),
  O('palm1', 'palm_a', 168, 132, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('palm2', 'palm_b', 292, 130, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('palm3', 'palm_a', 70, 140, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('palm4', 'palm_b', 258, 196, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('bench1', 'bench', 190, 126, { footprint: { x: -12, y: -5, w: 24, h: 5 } }),
  O('bench2', 'bench', 300, 120, { footprint: { x: -12, y: -5, w: 24, h: 5 } }),
  O('lamp1', 'lamp', 150, 116, { footprint: { x: -2, y: -3, w: 4, h: 3 }, glow: { dx: 0, dy: -44, r: 26 } }),
  O('lamp2', 'lamp', 215, 118, { footprint: { x: -2, y: -3, w: 4, h: 3 }, glow: { dx: 0, dy: -44, r: 26 } }),
  O('lamp3', 'lamp', 320, 118, { footprint: { x: -2, y: -3, w: 4, h: 3 }, glow: { dx: 0, dy: -44, r: 26 } }),
  O('lamp4', 'lamp', 180, 205, { footprint: { x: -2, y: -3, w: 4, h: 3 }, glow: { dx: 0, dy: -44, r: 26 } }),
  // ---- mảnh E (lệch x=EX): bộ sprite thứ hai
  O('e-mall', 'mall', EX + 116, 66, { poiId: 'singapore-mall', door: { dx: -1, dy: 5 }, footprint: { x: -54, y: -18, w: 108, h: 18 } }),
  O('e-flyer', 'flyer', EX + 237, 77, { footprint: { x: -36, y: -16, w: 72, h: 16 } }),
  O('e-artscience', 'artscience', EX + 310, 122, { footprint: { x: -46, y: -16, w: 92, h: 16 } }),
  O('e-palm1', 'palm_a', EX + 40, 150, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('e-palm2', 'palm_b', EX + 380, 150, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('e-palm3', 'palm_a', EX + 300, 185, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('e-palm4', 'palm_b', EX + 105, 168, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('e-palm5', 'palm_a', EX + 222, 190, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('e-bench1', 'bench', EX + 160, 152, { footprint: { x: -12, y: -5, w: 24, h: 5 } }),
  O('e-bench2', 'bench', EX + 230, 106, { footprint: { x: -12, y: -5, w: 24, h: 5 } }),
  O('e-lamp1', 'lamp', EX + 150, 76, { footprint: { x: -2, y: -3, w: 4, h: 3 }, glow: { dx: 0, dy: -44, r: 26 } }),
  O('e-lamp2', 'lamp', EX + 240, 140, { footprint: { x: -2, y: -3, w: 4, h: 3 }, glow: { dx: 0, dy: -44, r: 26 } }),
  // ---- mảnh SE (lệch x=EX, y=SY)
  O('se-cablecar', 'cablecar', EX + 96, SY + 54, { poiId: 'singapore-cablecar', door: DOOR, footprint: { x: -54, y: -16, w: 108, h: 16 } }),
  O('se-beachbar', 'beachbar', EX + 248, SY + 58, { poiId: 'singapore-beachbar', door: DOOR, footprint: { x: -54, y: -16, w: 108, h: 16 } }),
  O('se-shophouse', 'shophouse', EX + 279, SY + 122, { footprint: { x: -48, y: -18, w: 96, h: 18 } }),
  O('se-palm1', 'palm_a', EX + 88, SY + 140, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('se-palm2', 'palm_b', EX + 210, SY + 150, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('se-palm3', 'palm_a', EX + 330, SY + 140, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('se-bench1', 'bench', EX + 150, SY + 110, { footprint: { x: -12, y: -5, w: 24, h: 5 } }),
  O('se-lamp1', 'lamp', EX + 200, SY + 100, { footprint: { x: -2, y: -3, w: 4, h: 3 }, glow: { dx: 0, dy: -44, r: 26 } }),
  // ---- mảnh S (lệch y=SY)
  O('s-shophouse', 'shophouse', 117, SY + 86, { footprint: { x: -48, y: -18, w: 96, h: 18 } }),
  O('s-temple', 'temple', 326, SY + 86, { poiId: 'singapore-temple', door: DOOR, footprint: { x: -50, y: -18, w: 100, h: 18 } }),
  O('s-kopitiam', 'kopitiam', 127, SY + 154, { poiId: 'singapore-kopitiam', door: DOOR, footprint: { x: -50, y: -18, w: 100, h: 18 } }),
  O('s-shophouse2', 'shophouse', 326, SY + 146, { footprint: { x: -48, y: -18, w: 96, h: 18 } }),
  O('s-hdb', 'hdb', 330, SY + 200, { footprint: { x: -46, y: -20, w: 92, h: 20 } }),
  O('s-palm1', 'palm_a', 60, SY + 120, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('s-palm2', 'palm_b', 270, SY + 60, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('s-palm3', 'palm_a', 207, SY + 180, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('s-bench1', 'bench', 258, SY + 120, { footprint: { x: -12, y: -5, w: 24, h: 5 } }),
  O('s-lamp1', 'lamp', 190, SY + 60, { footprint: { x: -2, y: -3, w: 4, h: 3 }, glow: { dx: 0, dy: -44, r: 26 } }),
  O('s-lamp2', 'lamp', 270, SY + 100, { footprint: { x: -2, y: -3, w: 4, h: 3 }, glow: { dx: 0, dy: -44, r: 26 } }),
];

const poiOf = (poiId: string) => {
  const o = OBJECTS.find((x) => x.poiId === poiId)!;
  const g = poiGeometry(o, SPRITES[o.sprite]!);
  return imagePoi(poiId, { hotspot: g.hotspot, door: g.door });
};

const NPCS: Npc[] = [
  {
    id: 'singapore-npc-staff',
    sprite: 'npc_staff',
    at: { x: 186, y: 206 },
    lines: [
      { en: 'Welcome to Singapore! Do you have anything to declare?', vi: 'Chào mừng đến Singapore! Anh/chị có gì cần khai báo không?' },
      { en: 'The MRT stairs are by the big fountain plaza.', vi: 'Cầu thang xuống ga MRT ở cạnh quảng trường đài phun nước lớn.' },
    ],
  },
  {
    id: 'singapore-npc-vendor',
    sprite: 'npc_vendor',
    at: { x: 132, y: 104 },
    lines: [
      { en: 'Chicken rice, two dollars fifty. Would you like chilli with that?', vi: 'Cơm gà hai đô rưỡi. Anh/chị có lấy thêm ớt không?' },
      { en: 'Careful, the soup is very hot!', vi: 'Cẩn thận nhé, súp nóng lắm!' },
    ],
  },
  {
    id: 'singapore-npc-tourist',
    sprite: 'npc_tourist',
    at: { x: 150, y: 119 },
    path: [{ x: 299, y: 121 }],
    lines: [
      { en: 'Excuse me, how do I get to the big hotel with the boat on top?', vi: 'Xin lỗi, đi tới toà khách sạn lớn có con thuyền trên nóc như thế nào ạ?' },
      { en: 'The view of the bay is amazing at night.', vi: 'Cảnh vịnh đẹp tuyệt vào ban đêm.' },
    ],
  },
  {
    id: 'singapore-npc-local',
    sprite: 'npc_local',
    at: { x: 66, y: 125 },
    path: [{ x: 69, y: 159 }],
    lines: [
      { en: 'There is a famous stone lion on the plaza. Some people only find it after they have seen the big hotel.', vi: 'Trên quảng trường có một con sư tử đá nổi tiếng. Nhiều người chỉ tìm thấy sau khi đã ghé khách sạn lớn.' },
      { en: 'It might rain this afternoon. Take an umbrella.', vi: 'Chiều nay có thể mưa. Nhớ mang theo ô nhé.' },
    ],
  },
  {
    id: 'singapore-npc-kid',
    sprite: 'npc_kid',
    at: { x: 252, y: 134 },
    lines: [{ en: 'Look! The Merlion is spitting water!', vi: 'Nhìn kìa! Sư tử biển đang phun nước!' }],
  },
  { id: 'singapore-npc-cat', sprite: 'cat_sit', at: { x: 139, y: 105 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

const MASK = composeMask(
  WORLD,
  SINGAPORE_SCENE_MASK_CELL,
  [
    { x: 0, y: 0, w: PW, h: PH, cell: SINGAPORE_SCENE_MASK_CELL, rows: SINGAPORE_SCENE_MASK },
    { x: EX, y: 0, w: PW, h: PH, cell: SINGAPORE_SCENE_MASK_CELL, rows: SINGAPORE_SCENE_E_MASK },
    { x: 0, y: SY, w: PW, h: PH, cell: SINGAPORE_SCENE_MASK_CELL, rows: SINGAPORE_SCENE_S_MASK },
    { x: EX, y: SY, w: PW, h: PH, cell: SINGAPORE_SCENE_MASK_CELL, rows: SINGAPORE_SCENE_SE_MASK },
  ],
  LINKS,
);

/** Hàng cây che đường nối (chừa hở ở mọi điểm nối). */
const SEAMS = seamDecor({
  prefix: 'seam',
  maskRows: MASK,
  cell: SINGAPORE_SCENE_MASK_CELL,
  lines: [
    { x0: EX + OV / 2, y0: 10, x1: EX + OV / 2, y1: PH - 4 },
    { x0: EX + OV / 2, y0: SY + 4, x1: EX + OV / 2, y1: WORLD.h - 10 },
    { x0: 10, y0: SY + OV / 2, x1: PW - 4, y1: SY + OV / 2 },
    { x0: EX + 4, y0: SY + OV / 2, x1: WORLD.w - 10, y1: SY + OV / 2 },
  ],
  gaps: LINKS,
  sprites: ['palm_a', 'palm_b'],
});

export const singapore = (() => {
  const m = imageMap({
    id: 'singapore',
    name: { vi: 'Singapore', en: 'Singapore' },
    utcOffsetHours: 8,
    spawn: { x: 230, y: 200 },
    pois: ['singapore-changi', 'singapore-hawker', 'singapore-mrt', 'singapore-hotel', 'singapore-mbs', 'singapore-gardens', 'singapore-merlion', 'singapore-kopitiam', 'singapore-temple', 'singapore-mall', 'singapore-beachbar', 'singapore-cablecar'].map(poiOf),
    npcs: NPCS,
    routes: [
      { id: 'singapore-boat-w', sprite: 'mini_boat', path: [{ x: 14, y: 70 }, { x: 14, y: 150 }], speed: 0.7 },
      { id: 'singapore-plane', sprite: 'mini_plane', path: [{ x: -30, y: 22 }, { x: 450, y: 70 }], speed: 3.6, loop: true, layer: 'sky' },
    ],
    size: WORLD,
    panels: [
      { suffix: '', x: 0, y: 0 },
      { suffix: '-e', x: EX, y: 0 },
      { suffix: '-s', x: 0, y: SY },
      { suffix: '-se', x: EX, y: SY },
    ],
    links: LINKS,
    mask: { cell: SINGAPORE_SCENE_MASK_CELL, rows: MASK },
    sounds: ['city-day', 'water-lap'],
    terrain: true,
  });
  m.scene = { sprites: SPRITES, objects: [...OBJECTS, ...SEAMS], ambient: 16 };
  return m;
})();
