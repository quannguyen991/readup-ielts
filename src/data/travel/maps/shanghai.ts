/**
 * THƯỢNG HẢI (SHANGHAI) — CHẾ ĐỘ ĐỐI TƯỢNG (kiểu Bến Dừa / Singapore).
 * Lớp 1: ảnh ĐẤT 4 mảnh (816×450) với sông Hoàng Phố, bến cảng, lối dạo lát đá và quảng trường trung tâm.
 * Lớp 2: các công trình điểm nhấn đặc trưng Thượng Hải đứng độc lập, xếp chiều sâu (Y-sorting):
 *   - Bến Thượng Hải (The Bund): toà nhà tân cổ điển bên bờ sông Hoàng Phố
 *   - Tháp Đông Phương Minh Châu (Oriental Pearl Tower): toà tháp biểu tượng trên quảng trường trung tâm
 *   - Dự Viên (Yuyuan Garden) & Miếu Thành Hoàng: mái ngói cong phong cách Giang Nam
 *   - Tiệm Tiểu Long Bao Nam Tường (Nanxiang Xiaolongbao): ẩm thực trứ danh
 *   - Phố đi bộ Nam Kinh (Nanjing Road): trung tâm thương mại đa tầng sầm uất
 *   - Ga Tàu Lục Gia Chủy & Maglev: ga tàu hiện đại kết nối sân bay Phố Đông
 *   - Cổng bay Sân bay Quốc tế Phố Đông (Pudong Airport)
 * Lớp 3: thuyền du lịch trên sông Hoàng Phố, máy bay trên trời, NPC đi dạo và hệ thống đèn lồng / đèn đường ban đêm.
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
  { from: 0, to: 1, x: EX + OV / 2, y: 111, r: 12 },
  { from: 0, to: 2, x: 221, y: SY + OV / 2, r: 12 },
  ...linkLine(2, 3, { x: EX + 2, y: SY + 105 }, { x: EX + OV - 2, y: SY + 70 }),
  ...linkLine(1, 3, { x: EX + 240, y: SY + 2 }, { x: EX + 170, y: SY + OV - 2 }),
];

const SPRITES: Record<string, SceneSprite> = {
  // Điểm nhấn Thượng Hải
  bund: { file: '../singapore/hotel.png', w: 128, h: 80 },
  pearl: { file: 'pearl.png', w: 60, h: 135 },
  temple: { file: '../singapore2/temple.png', w: 116, h: 70 },
  xiaolongbao: { file: '../singapore2/kopitiam.png', w: 115, h: 68 },
  nanjing: { file: '../singapore2/mall.png', w: 124, h: 73 },
  station: { file: '../singapore/mrt.png', w: 107, h: 56 },
  airport: { file: '../singapore/airport.png', w: 140, h: 55 },
  // Cảnh quan Phố Đông & phố cổ Giang Nam
  pudong_tower: { file: '../singapore/mbs.png', w: 123, h: 76 },
  dome: { file: '../singapore/dome.png', w: 131, h: 62 },
  ferris: { file: '../singapore2/flyer.png', w: 89, h: 73 },
  lotus: { file: '../singapore2/artscience.png', w: 108, h: 66 },
  shophouse: { file: '../singapore2/shophouse.png', w: 111, h: 70 },
  hdb: { file: '../singapore2/hdb.png', w: 105, h: 75 },
  teahouse: { file: '../singapore2/beachbar.png', w: 126, h: 69 },
  ferry: { file: '../singapore2/cablecar.png', w: 125, h: 65 },
  hawker: { file: '../singapore/hawker.png', w: 139, h: 70 },
  // Đạo cụ cây xanh, ghế nghỉ và đèn đường
  palm_a: { file: '../singapore/props.png', w: 46, h: 59, crop: { x: 0, y: 0, w: 46, h: 59 }, erase: [{ x: 34, y: 39, w: 12, h: 20 }] },
  palm_b: { file: '../singapore/props.png', w: 48, h: 57, crop: { x: 48, y: 2, w: 48, h: 57 } },
  bench: { file: '../singapore/props.png', w: 29, h: 20, crop: { x: 34, y: 39, w: 29, h: 20 } },
  lamp: { file: '../singapore/props.png', w: 10, h: 52, crop: { x: 96, y: 7, w: 10, h: 52 } },
};

const fp = (sprite: string, frac = 0.4, inset = 0.06) => {
  const s = SPRITES[sprite]!;
  const w = Math.round(s.w * (1 - inset * 2));
  const h = Math.round(s.h * frac);
  return { x: -Math.round(w / 2), y: -h, w, h };
};

const O = (id: string, sprite: string, x: number, y: number, extra: Partial<MapObject> = {}): MapObject => ({
  id,
  sprite,
  x,
  y,
  footprint: fp(sprite),
  ...extra,
});

const DOOR = { dx: 0, dy: 6 };

const OBJECTS: MapObject[] = [
  // 1. Tháp Đông Phương Minh Châu (trung tâm quảng trường tròn)
  O('pearltower', 'pearl', 230, 120, { poiId: 'shanghai-pearltower', door: { dx: 0, dy: 7 }, footprint: { x: -20, y: -16, w: 40, h: 16 } }),
  // 2. Bến Thượng Hải (The Bund - toà nhà Tân cổ điển bên sông)
  O('bund', 'bund', 125, 184, { poiId: 'shanghai-bund', door: { dx: 0, dy: 5 }, footprint: { x: -54, y: -26, w: 108, h: 26 } }),
  // 3. Ga Tàu Lục Gia Chủy & Maglev
  O('station', 'station', 342, 178, { poiId: 'shanghai-station', door: { dx: -1, dy: 5 }, footprint: { x: -44, y: -20, w: 88, h: 20 } }),
  // 4. Sân bay Quốc tế Phố Đông - Cổng lên máy bay
  O('airport', 'airport', 210, 228, { poiId: 'shanghai-gate', door: { dx: 0, dy: 5 }, footprint: { x: -56, y: -16, w: 112, h: 16 } }),

  // Cảnh quan Phố Đông (mảnh A)
  O('pudong_tower', 'pudong_tower', 230, 72, { footprint: { x: -54, y: -20, w: 108, h: 20 } }),
  O('hawker', 'hawker', 117, 95, { footprint: { x: -56, y: -22, w: 112, h: 22 } }),
  O('dome', 'dome', 352, 62, { footprint: { x: -48, y: -14, w: 96, h: 14 } }),

  // Cây cối, ghế đá, đèn đường dọc lối dạo mảnh A
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

  // ---- Mảnh E: Phố thương mại Nam Kinh & bờ sông phía Đông
  // 5. Phố đi bộ Nam Kinh (Nanjing Road Pedestrian Mall)
  O('nanjing', 'nanjing', EX + 116, 66, { poiId: 'shanghai-nanjing', door: { dx: -1, dy: 5 }, footprint: { x: -54, y: -18, w: 108, h: 18 } }),
  O('e-ferris', 'ferris', EX + 237, 77, { footprint: { x: -36, y: -16, w: 72, h: 16 } }),
  O('e-lotus', 'lotus', EX + 310, 122, { footprint: { x: -46, y: -16, w: 92, h: 16 } }),
  O('e-palm1', 'palm_a', EX + 40, 150, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('e-palm2', 'palm_b', EX + 380, 150, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('e-palm3', 'palm_a', EX + 300, 185, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('e-palm4', 'palm_b', EX + 105, 168, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('e-palm5', 'palm_a', EX + 222, 190, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('e-bench1', 'bench', EX + 160, 152, { footprint: { x: -12, y: -5, w: 24, h: 5 } }),
  O('e-bench2', 'bench', EX + 230, 106, { footprint: { x: -12, y: -5, w: 24, h: 5 } }),
  O('e-lamp1', 'lamp', EX + 150, 76, { footprint: { x: -2, y: -3, w: 4, h: 3 }, glow: { dx: 0, dy: -44, r: 26 } }),
  O('e-lamp2', 'lamp', EX + 240, 140, { footprint: { x: -2, y: -3, w: 4, h: 3 }, glow: { dx: 0, dy: -44, r: 26 } }),

  // ---- Mảnh SE: Bến phà sông & quán trà ven nước
  O('se-ferry', 'ferry', EX + 96, SY + 54, { door: DOOR, footprint: { x: -54, y: -16, w: 108, h: 16 } }),
  O('se-teahouse', 'teahouse', EX + 248, SY + 58, { door: DOOR, footprint: { x: -54, y: -16, w: 108, h: 16 } }),
  O('se-shophouse', 'shophouse', EX + 279, SY + 122, { footprint: { x: -48, y: -18, w: 96, h: 18 } }),
  O('se-palm1', 'palm_a', EX + 88, SY + 140, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('se-palm2', 'palm_b', EX + 210, SY + 150, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('se-palm3', 'palm_a', EX + 330, SY + 140, { footprint: { x: -4, y: -6, w: 8, h: 6 } }),
  O('se-bench1', 'bench', EX + 150, SY + 110, { footprint: { x: -12, y: -5, w: 24, h: 5 } }),
  O('se-lamp1', 'lamp', EX + 200, SY + 100, { footprint: { x: -2, y: -3, w: 4, h: 3 }, glow: { dx: 0, dy: -44, r: 26 } }),

  // ---- Mảnh S: Khu phố cổ Thượng Hải, Dự Viên & Tiệm Bánh Bao
  // 6. Vườn Dự Viên & Miếu Thành Hoàng (Yuyuan Garden)
  O('yuyuan', 'temple', 326, SY + 86, { poiId: 'shanghai-yuyuan', door: DOOR, footprint: { x: -50, y: -18, w: 100, h: 18 } }),
  // 7. Tiệm Bánh Bao Nam Tường (Nanxiang Xiaolongbao)
  O('xiaolongbao', 'xiaolongbao', 127, SY + 154, { poiId: 'shanghai-xiaolongbao', door: DOOR, footprint: { x: -50, y: -18, w: 100, h: 18 } }),

  O('s-shophouse1', 'shophouse', 117, SY + 86, { footprint: { x: -48, y: -18, w: 96, h: 18 } }),
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
  const o = OBJECTS.find((x) => x.poiId === poiId);
  if (!o) throw new Error(`Object not found for POI ${poiId}`);
  const g = poiGeometry(o, SPRITES[o.sprite]!);
  return imagePoi(poiId, { hotspot: g.hotspot, door: g.door });
};

const NPCS: Npc[] = [
  {
    id: 'shanghai-npc-staff',
    sprite: 'npc_staff',
    chatPersona: 'staff',
    at: { x: 186, y: 206 },
    lines: [
      { en: 'Welcome to Shanghai! Did you arrive via Pudong Airport or Hongqiao?', vi: 'Chào mừng đến Thượng Hải! Bạn vừa tới qua sân bay Phố Đông hay Hồng Kiều?' },
      { en: 'The Maglev train reaches 430 kilometres an hour straight to the Pudong terminal.', vi: 'Tàu đệm từ Maglev đạt 430 km/h thẳng tới ga Phố Đông.' },
    ],
  },
  {
    id: 'shanghai-npc-vendor',
    sprite: 'npc_vendor',
    chatPersona: 'vendor',
    at: { x: 132, y: 104 },
    lines: [
      { en: 'Steaming hot Nanxiang Xiaolongbao! Sip the savoury broth before taking a bite.', vi: 'Tiểu long bao Nam Tường nóng hổi! Nhớ húp ngụm nước súp đậm đà trước khi cắn bánh.' },
      { en: 'Be careful with your first bite, the soup inside is boiling hot!', vi: 'Cẩn thận miếng cắn đầu tiên nhé, nước súp bên trong vừa ra lò nóng lắm!' },
    ],
  },
  {
    id: 'shanghai-npc-tourist',
    sprite: 'npc_tourist',
    chatPersona: 'traveller',
    at: { x: 150, y: 119 },
    path: [{ x: 299, y: 121 }],
    lines: [
      { en: 'The view of the Oriental Pearl Tower across the Huangpu River is breathtaking!', vi: 'Cảnh Tháp Đông Phương Minh Châu nhìn từ bờ sông Hoàng Phố đẹp ngỡ ngàng!' },
      { en: 'Have you visited the Bund at night when all the colonial facades light up?', vi: 'Bạn đã ghé Bến Thượng Hải lúc đêm về khi các toà nhà cổ điển lên đèn chưa?' },
    ],
  },
  {
    id: 'shanghai-npc-local',
    sprite: 'npc_local',
    chatPersona: 'local',
    at: { x: 66, y: 125 },
    path: [{ x: 69, y: 159 }],
    lines: [
      { en: 'Yuyuan Garden has classical pavilions and the famous Zigzag Bridge.', vi: 'Dự Viên có những lầu các cổ kính và Cầu Cửu Khúc nổi tiếng.' },
      { en: 'Nanjing Road has hundreds of shops and illuminated neon signs.', vi: 'Phố đi bộ Nam Kinh có hàng trăm cửa hiệu và biển hiệu neon rực rỡ.' },
    ],
  },
  {
    id: 'shanghai-npc-kid',
    sprite: 'npc_kid',
    at: { x: 252, y: 134 },
    lines: [{ en: 'Look! The spheres on the Pearl Tower sparkle in the sunshine!', vi: 'Nhìn kìa! Những quả cầu trên Tháp Minh Châu lấp lánh dưới ánh nắng!' }],
  },
  { id: 'shanghai-npc-cat', sprite: 'cat_sit', at: { x: 139, y: 105 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
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

export const shanghai = (() => {
  const m = imageMap({
    id: 'shanghai',
    name: { vi: 'Thượng Hải', en: 'Shanghai' },
    utcOffsetHours: 8,
    spawn: { x: 230, y: 200 },
    pois: [
      'shanghai-gate',
      'shanghai-bund',
      'shanghai-pearltower',
      'shanghai-yuyuan',
      'shanghai-xiaolongbao',
      'shanghai-nanjing',
      'shanghai-station',
    ].map(poiOf),
    npcs: NPCS,
    routes: [
      { id: 'shanghai-boat-w', sprite: 'mini_boat', path: [{ x: 14, y: 70 }, { x: 14, y: 150 }], speed: 0.7 },
      { id: 'shanghai-plane', sprite: 'mini_plane', path: [{ x: -30, y: 22 }, { x: 450, y: 70 }], speed: 3.6, loop: true, layer: 'sky' },
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
