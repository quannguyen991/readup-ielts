/**
 * HÀ NỘI — CHẾ ĐỘ ĐỐI TƯỢNG (kiểu Bến Dừa), MỞ RỘNG THÀNH LƯỚI 3×4 MẢNH quanh hồ Gươm.
 * Ảnh đất: `public/travel/terrain/hanoi*.small.png` (418×235); lưới đi được: `hanoi.scene-walk-*.ts` (khoá `hanoi-scene-*`).
 * Công trình là sprite đứng riêng trong `public/travel/sprites/hanoi/`, (x,y) là GIỮA-ĐÁY.
 * Mảnh A (trung tâm hồ Gươm) đặt ở SHIFT; các mảnh khác quanh nó: NW/N/NE (phía bắc, hồ), W/SW (phía tây),
 * E/EE (phố cổ và cầu bên phải), S/SE (đường lớn và sân bay). Toạ độ cũ của 2×2 đều dịch theo SHIFT.
 */
import type { MapObject, Npc, SceneSprite } from '@/services/travel/types';
import { poiGeometry } from '@/components/travel/engine/scene';
import { imageMap, imagePoi } from './imagemap';
import { composeMask } from '@/components/travel/engine/imageWorld';
import { HANOI_SCENE_MASK, HANOI_SCENE_MASK_CELL } from './hanoi.scene-walk';
import { HANOI_SCENE_E_MASK } from './hanoi.scene-walk-e';
import { HANOI_SCENE_S_MASK } from './hanoi.scene-walk-s';
import { HANOI_SCENE_SE_MASK } from './hanoi.scene-walk-se';
import { HANOI_SCENE_W_MASK } from './hanoi.scene-walk-w';
import { HANOI_SCENE_SW_MASK } from './hanoi.scene-walk-sw';
import { HANOI_SCENE_N_MASK } from './hanoi.scene-walk-n';
import { HANOI_SCENE_NE_MASK } from './hanoi.scene-walk-ne';
import { HANOI_SCENE_NW_MASK } from './hanoi.scene-walk-nw';
import { HANOI_SCENE_EE_MASK } from './hanoi.scene-walk-ee';
import { HANOI_SCENE_NEE_MASK } from './hanoi.scene-walk-nee';
import { HANOI_SCENE_SEE_MASK } from './hanoi.scene-walk-see';

/** Mỗi mảnh 418×235, chồng lên nhau OV điểm. Toạ độ thế giới: A ở SHIFT, các mảnh khác cách EX/SY. */
const PW = 418;
const PH = 235;
const OV = 20;
const EX = PW - OV;
const SY = PH - OV;
const SHIFT = { x: EX, y: SY };
const sh = <T extends { x: number; y: number }>(p: T): T => ({ ...p, x: p.x + SHIFT.x, y: p.y + SHIFT.y });
/** Thế giới 3×4 mảnh: 3 cột (x = 0, EX, 2EX, 3EX) × 3 hàng (y = 0, SY, 2SY). Khung 1612×665. */
const WORLD3 = { w: 3 * EX + PW, h: 2 * SY + PH };

const linkLine = (from: number, to: number, a: { x: number; y: number }, b: { x: number; y: number }, r = 10, step = 12) => {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
  return Array.from({ length: n + 1 }, (_, i) => ({ from, to, x: Math.round(a.x + ((b.x - a.x) * i) / n), y: Math.round(a.y + ((b.y - a.y) * i) / n), r }));
};
/** Liên kết gốc của bản 2×2 (toạ độ cũ, dịch theo SHIFT khi dùng). Chỉ số `from/to` là chỉ số mảnh trong PARTS. */
const LINKS_A = [
  { from: 0, to: 1, x: EX + OV / 2, y: 91, r: 12 }, // cầu gỗ đỏ bên phải A ↔ cầu bên trái E
  { from: 0, to: 2, x: 209, y: SY + OV / 2, r: 12 }, // vạch qua đường dưới A ↔ vạch trên S
  ...linkLine(2, 3, { x: EX + 2, y: SY + 105 }, { x: EX + OV - 2, y: SY + 67 }), // đường mép phải S ↔ mép trái SE
  ...linkLine(1, 3, { x: EX + 205, y: SY + 2 }, { x: EX + 132, y: SY + OV - 2 }), // đường mép dưới E ↔ mép trên SE
];
const LINKS_BASE = LINKS_A.map(sh);
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
  nhatholon: { file: 'nhatholon.png', w: 77, h: 79 },
  buudien: { file: 'buudien.png', w: 79, h: 50 },
  quansu: { file: 'quansu.png', w: 86, h: 56 },
  ngocson: { file: 'ngocson.png', w: 78, h: 59 },
  cotco: { file: 'cotco.png', w: 84, h: 85 },
  quanthanh: { file: 'quanthanh.png', w: 60, h: 63 },
  hoalo: { file: 'hoalo.png', w: 72, h: 55 },
  lichsu: { file: 'lichsu.png', w: 73, h: 57 },
  badinh: { file: 'badinh.png', w: 84, h: 69 },
  dantoc: { file: 'dantoc.png', w: 83, h: 49 },
  kimlien: { file: 'kimlien.png', w: 74, h: 61 },
  hangma: { file: 'hangma.png', w: 37, h: 61 },
  godongda: { file: 'godongda.png', w: 80, h: 77 },
  phutayho: { file: 'phutayho.png', w: 74, h: 61 },
  seambush_a: { file: 'seambush_a.png', w: 16, h: 14 },
  seambush_b: { file: 'seambush_b.png', w: 18, h: 15 },
  seambush_c: { file: 'seambush_c.png', w: 14, h: 12 },
  honguom: { file: 'honguom.png', w: 80, h: 66 },
  hoangthanh: { file: 'hoangthanh.png', w: 81, h: 65 },
  hangbac: { file: 'hangbac.png', w: 87, h: 78 },
  chohom: { file: 'chohom.png', w: 83, h: 53 },
  phunghung: { file: 'phunghung.png', w: 87, h: 78 },
  huonglien: { file: 'huonglien.png', w: 54, h: 66 },
  keangnam: { file: 'keangnam.png', w: 71, h: 82 },
  chollongbien: { file: 'chollongbien.png', w: 80, h: 63 },
  cafegiang: { file: 'cafegiang.png', w: 43, h: 66 },
  banhmichao: { file: 'banhmichao.png', w: 57, h: 66 },
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

/** Vật của bản 2×2 cũ, toạ độ cũ (dịch theo SHIFT khi đưa vào cảnh). */
const OBJECTS: MapObject[] = [
  O('vanmieu', 'vanmieu', 189, 31, { poiId: 'hanoi-vanmieu', door: DOOR }),
  O('pho', 'pho', 85, 87, { poiId: 'hanoi-pho', door: DOOR }),
  O('motcot', 'motcot', 332, 95, { poiId: 'hanoi-motcot', door: { dx: 0, dy: 10 } }),
  O('oldquarter', 'oldquarter', 81, 191, { poiId: 'hanoi-oldquarter', door: DOOR }),
  O('dongxuan', 'dongxuan', 215, 188, { poiId: 'hanoi-dongxuan', door: DOOR }),
  O('station', 'station', 337, 183, { poiId: 'hanoi-counter', door: DOOR }),
  O('thaprua', 'thaprua', 212, 122, { poiId: 'hanoi-thaprua', door: { dx: 0, dy: 10 }, footprint: { x: -38, y: -26, w: 76, h: 26 } }),
  // ---- mảnh E (lệch x = EX)
  O('e-opera', 'opera', EX + 114, 80, { poiId: 'hanoi-opera', door: { dx: 0, dy: 14 } }),
  O('e-flowers', 'flowers', EX + 253, 85, { poiId: 'hanoi-flowers', door: { dx: 0, dy: 15 } }),
  O('e-puppet', 'puppet', EX + 352, 125, { poiId: 'hanoi-puppet', door: { dx: 0, dy: 15 } }),
  O('e-mausoleum', 'mausoleum', EX + 122, 188, { poiId: 'hanoi-mausoleum', door: { dx: 0, dy: 12 } }),
  O('e-tranquoc', 'tranquoc', EX + 271, 208, { poiId: 'hanoi-tranquoc', door: { dx: 0, dy: 12 } }),
  // ---- mảnh S (lệch y = SY)
  O('s-doanmon', 'doanmon', 126, SY + 77, { poiId: 'hanoi-doanmon', door: { dx: 0, dy: 15 } }),
  O('s-biahoi', 'biahoi', 307, SY + 77, { poiId: 'hanoi-biahoi', door: { dx: 0, dy: 13 } }),
  O('s-longbien', 'longbien', 95, SY + 140, { poiId: 'hanoi-longbien', door: { dx: 0, dy: 14 } }),
  O('s-buncha', 'buncha', 328, SY + 145, { poiId: 'hanoi-buncha', door: { dx: 0, dy: 15 } }),
  O('s-banhmi', 'banhmi', 213, SY + 185, { poiId: 'hanoi-banhmi', door: DOOR }),
  O('s-lamp1', 'lampS', 190, SY + 60, LAMP),
  // ---- mảnh SE (lệch x = EX, y = SY): sân bay Nội Bài
  O('se-gate', 'station', EX + 230, SY + 60, { poiId: 'hanoi-gate', door: { dx: 0, dy: 14 } }),
  O('se-board', 'station', EX + 301, SY + 130, { poiId: 'hanoi-board', door: { dx: 0, dy: 8 } }),
  O('se-eggcoffee', 'eggcoffee', EX + 56, SY + 126),
  O('se-lamp1', 'lampS', EX + 100, SY + 92, LAMP),
];

/** Địa điểm mới ở các mảnh mở rộng: toạ độ thế giới (không dịch). */
const NEW_OBJECTS: MapObject[] = [
  // Cà phê trứng: dời khỏi cụm Phở/Văn Miếu (chồng lên nhau) sang lô trống phía bắc, vẫn tới được
  O('eggcoffee', 'eggcoffee', 302, 294, { poiId: 'hanoi-eggcoffee', door: { dx: 0, dy: 10 } }),
  // công trình Hà Nội ở các lô xám của mảnh mở rộng (mỗi công trình là một địa điểm, cửa ngay dưới)
  O('h-nhatholon', 'nhatholon', 1454, 558, { poiId: 'hanoi-nhatholon', door: { dx: 0, dy: 4 } }),
  O('h-buudien', 'buudien', 322, 486, { poiId: 'hanoi-buudien', door: { dx: 0, dy: 4 } }),
  O('h-quansu', 'quansu', 1566, 574, { poiId: 'hanoi-quansu', door: { dx: 0, dy: 4 } }),
  O('h-ngocson', 'ngocson', 278, 394, { poiId: 'hanoi-ngocson', door: { dx: 0, dy: 4 } }),
  O('h-cotco', 'cotco', 210, 306, { poiId: 'hanoi-cotco', door: { dx: 0, dy: 4 } }),
  O('h-quanthanh', 'quanthanh', 367, 249, { poiId: 'hanoi-quanthanh', door: { dx: 0, dy: 4 } }),
  O('h-hoalo', 'hoalo', 298, 550, { poiId: 'hanoi-hoalo', door: { dx: 0, dy: 4 } }),
  O('h-lichsu', 'lichsu', 186, 394, { poiId: 'hanoi-lichsu', door: { dx: 0, dy: 4 } }),
  O('h-badinh', 'badinh', 378, 342, { poiId: 'hanoi-badinh', door: { dx: 0, dy: 4 } }),
  O('h-dantoc', 'dantoc', 1414, 405, { poiId: 'hanoi-dantoc', door: { dx: 0, dy: 4 } }),
  O('h-kimlien', 'kimlien', 368, 426, { poiId: 'hanoi-kimlien', door: { dx: 0, dy: 4 } }),
  O('h-hangma', 'hangma', 928, 513, { poiId: 'hanoi-hangma', door: { dx: 0, dy: 4 } }),
  O('h-godongda', 'godongda', 86, 410, { poiId: 'hanoi-godongda', door: { dx: 0, dy: 4 } }),
  O('h-phutayho', 'phutayho', 122, 542, { poiId: 'hanoi-phutayho', door: { dx: 0, dy: 4 } }),
  O('h-honguom', 'honguom', 806, 466, { poiId: 'hanoi-honguom', door: { dx: 0, dy: 4 } }),
  O('h-hoangthanh', 'hoangthanh', 52, 280, { poiId: 'hanoi-hoangthanh', door: { dx: 0, dy: 4 } }),
  O('h-hangbac', 'hangbac', 1470, 338, { poiId: 'hanoi-hangbac', door: { dx: 0, dy: 4 } }),
  O('h-chohom', 'chohom', 1541, 657, { poiId: 'hanoi-chohom', door: { dx: 0, dy: 4 } }),
  O('h-phunghung', 'phunghung', 1309, 658, { poiId: 'hanoi-phunghung', door: { dx: 0, dy: 4 } }),
  O('h-huonglien', 'huonglien', 1382, 594, { poiId: 'hanoi-huonglien', door: { dx: 0, dy: 4 } }),
  O('h-keangnam', 'keangnam', 1158, 426, { poiId: 'hanoi-keangnam', door: { dx: 0, dy: 4 } }),
  O('h-chollongbien', 'chollongbien', 1564, 376, { poiId: 'hanoi-chollongbien', door: { dx: 0, dy: 4 } }),
  O('h-cafegiang', 'cafegiang', 1298, 334, { poiId: 'hanoi-cafegiang', door: { dx: 0, dy: 4 } }),
  O('h-banhmichao', 'banhmichao', 1272, 412, { poiId: 'hanoi-banhmichao', door: { dx: 0, dy: 4 } }),
];

const SCENE_OBJECTS = [...OBJECTS.map(sh), ...NEW_OBJECTS];

const POI_IDS = [...SCENE_OBJECTS.filter((o) => o.poiId).map((o) => o.poiId!)];

const poiOf = (poiId: string) => {
  const o = SCENE_OBJECTS.find((x) => x.poiId === poiId)!;
  const g = poiGeometry(o, SPRITES[o.sprite]!);
  return imagePoi(poiId, { hotspot: g.hotspot, door: g.door });
};

/** NPC của bản 2×2 cũ, toạ độ cũ (dịch theo SHIFT). */
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

/** Mười mảnh theo đúng vị trí; thứ tự này khớp với PARTS và panels bên dưới. */
const PARTS = [
  { x: 0, y: 0, w: PW, h: PH, cell: HANOI_SCENE_MASK_CELL, rows: HANOI_SCENE_NW_MASK },
  { x: EX, y: 0, w: PW, h: PH, cell: HANOI_SCENE_MASK_CELL, rows: HANOI_SCENE_N_MASK },
  { x: 2 * EX, y: 0, w: PW, h: PH, cell: HANOI_SCENE_MASK_CELL, rows: HANOI_SCENE_NE_MASK },
  { x: 0, y: SY, w: PW, h: PH, cell: HANOI_SCENE_MASK_CELL, rows: HANOI_SCENE_W_MASK },
  { x: SHIFT.x, y: SHIFT.y, w: PW, h: PH, cell: HANOI_SCENE_MASK_CELL, rows: HANOI_SCENE_MASK },
  { x: 2 * EX, y: SY, w: PW, h: PH, cell: HANOI_SCENE_MASK_CELL, rows: HANOI_SCENE_E_MASK },
  { x: 3 * EX, y: SY, w: PW, h: PH, cell: HANOI_SCENE_MASK_CELL, rows: HANOI_SCENE_EE_MASK },
  { x: 0, y: 2 * SY, w: PW, h: PH, cell: HANOI_SCENE_MASK_CELL, rows: HANOI_SCENE_SW_MASK },
  { x: EX, y: 2 * SY, w: PW, h: PH, cell: HANOI_SCENE_MASK_CELL, rows: HANOI_SCENE_S_MASK },
  { x: 2 * EX, y: 2 * SY, w: PW, h: PH, cell: HANOI_SCENE_MASK_CELL, rows: HANOI_SCENE_SE_MASK },
  { x: 3 * EX, y: 0, w: PW, h: PH, cell: HANOI_SCENE_MASK_CELL, rows: HANOI_SCENE_NEE_MASK },
  { x: 3 * EX, y: 2 * SY, w: PW, h: PH, cell: HANOI_SCENE_MASK_CELL, rows: HANOI_SCENE_SEE_MASK },
];
const MASK_BASE = composeMask(WORLD3, HANOI_SCENE_MASK_CELL, PARTS, LINKS_BASE);

/** Điểm nối dọc mọi ranh giới giữa các mảnh (mỗi 10 px), bỏ chỗ có nước: mảnh nào cũng đi tới được. */
const seamPoints = () => {
  const out: { from: number; to: number; x: number; y: number; r: number }[] = [];
  const vertical: [number, number, number][] = [
    [3 * EX + OV / 2, 0, SY],
    [EX + OV / 2, 0, WORLD3.h],
    [2 * EX + OV / 2, 0, WORLD3.h],
    [3 * EX + OV / 2, SY, 2 * SY + PH],
  ];
  for (const [x, y0, y1] of vertical) for (let y = y0 + 10; y < y1 - 4; y += 10) out.push({ from: 0, to: 0, x, y, r: 10 });
  for (let x = 10; x <= WORLD3.w - 10; x += 10) out.push({ from: 0, to: 0, x, y: SY + OV / 2, r: 10 });
  for (let x = 10; x <= WORLD3.w - 10; x += 10) out.push({ from: 0, to: 0, x, y: 2 * SY + OV / 2, r: 10 });
  return out.filter((p) => {
    // bỏ điểm nối nếu trong khung quanh nó (r = 10) có nước, để nước không bị lát thành đường
    for (let dy = -p.r; dy <= p.r; dy += 2) for (let dx = -p.r; dx <= p.r; dx += 2) {
      if (MASK_BASE[Math.floor((p.y + dy) / HANOI_SCENE_MASK_CELL)]?.[Math.floor((p.x + dx) / HANOI_SCENE_MASK_CELL)] === '~') return false;
    }
    return true;
  });
};
/** Đường nối khu tây (mép hồ) bị Hoàng Thành chặn: đi dọc mép, không qua nước hay chân công trình. */
const ISLAND_LINKS_HN = [
  ...linkLine(0, 0, { x: 11, y: 243 }, { x: 23, y: 243 }, 10, 12),
  ...linkLine(0, 0, { x: 23, y: 243 }, { x: 35, y: 243 }, 10, 12),
  ...linkLine(0, 0, { x: 35, y: 243 }, { x: 47, y: 243 }, 10, 12),
  ...linkLine(0, 0, { x: 47, y: 243 }, { x: 59, y: 243 }, 10, 12),
  ...linkLine(0, 0, { x: 59, y: 243 }, { x: 71, y: 243 }, 10, 12),
  ...linkLine(0, 0, { x: 71, y: 243 }, { x: 83, y: 243 }, 10, 12),
  ...linkLine(0, 0, { x: 83, y: 243 }, { x: 95, y: 243 }, 10, 12),
  ...linkLine(0, 0, { x: 95, y: 243 }, { x: 107, y: 243 }, 10, 12),
  ...linkLine(0, 0, { x: 107, y: 243 }, { x: 119, y: 243 }, 10, 12),
  ...linkLine(0, 0, { x: 119, y: 243 }, { x: 131, y: 243 }, 10, 12),
  ...linkLine(0, 0, { x: 131, y: 243 }, { x: 143, y: 243 }, 10, 12),
];
const LINKS = [...LINKS_BASE, ...seamPoints(), ...ISLAND_LINKS_HN, // nối khu bị tách vào mạng chính
  ...linkLine(0, 0, { x: 801, y: 239 }, { x: 803, y: 295 }, 10, 12),
  ...linkLine(0, 0, { x: 1255, y: 351 }, { x: 1263, y: 349 }, 10, 12),
  ...linkLine(0, 0, { x: 1610, y: 338 }, { x: 1611, y: 327 }, 10, 12),
];
const MASK = composeMask(WORLD3, HANOI_SCENE_MASK_CELL, PARTS, LINKS);


import { seamHedge } from './seams';
/** Hàng bụi/cây dọc mọi mép mảnh (che đường nối cho quyện hoà; không có đèn). */
const SEAMS = seamHedge({
  prefix: 'seam',
  maskRows: MASK,
  cell: HANOI_SCENE_MASK_CELL,
  lines: [
    { x0: 408, y0: 10, x1: 408, y1: 665 - 10 },
    { x0: 806, y0: 10, x1: 806, y1: 665 - 10 },
    { x0: 1204, y0: 10, x1: 1204, y1: 665 - 10 },
    { x0: 10, y0: 225, x1: 1602, y1: 225 },
    { x0: 10, y0: 440, x1: 1602, y1: 440 },
  ],
  gaps: [...LINKS, { x: 1150, y: 225 }], // lối hẹp giữa NE và EE: chừa hở để không cô lập
  sprites: ['seambush_a', 'seambush_b', 'seambush_c'],
  spacing: 12,
});

export const hanoi = (() => {
  const m = imageMap({
    id: 'hanoi',
    name: { vi: 'Hà Nội', en: 'Hanoi' },
    utcOffsetHours: 7,
    terrain: true,
    spawn: sh({ x: 209, y: 214 }),
    pois: POI_IDS.map(poiOf),
    npcs: NPCS.map((n) => ({ ...n, at: sh(n.at), ...(n.path ? { path: n.path.map(sh) } : {}) })),
    routes: [
      { id: 'hanoi-boat', sprite: 'mini_boat', path: [{ x: EX + 60, y: 60 }, { x: EX + 330, y: 60 }], speed: 0.8 },
      { id: 'hanoi-plane', sprite: 'mini_plane', path: [{ x: EX + 120, y: SY + 190 }, { x: EX + 470, y: SY + 190 }].map(sh), speed: 3.2, loop: true, layer: 'sky' },
    ],
    size: WORLD3,
    panels: [
      { suffix: '-nw', x: 0, y: 0 },
      { suffix: '-n', x: EX, y: 0 },
      { suffix: '-ne', x: 2 * EX, y: 0 },
      { suffix: '-w', x: 0, y: SY },
      { suffix: '', x: SHIFT.x, y: SHIFT.y },
      { suffix: '-e', x: 2 * EX, y: SY },
      { suffix: '-ee', x: 3 * EX, y: SY },
      { suffix: '-sw', x: 0, y: 2 * SY },
      { suffix: '-s', x: EX, y: 2 * SY },
      { suffix: '-se', x: 2 * EX, y: 2 * SY },
      { suffix: '-nee', x: 3 * EX, y: 0 },
      { suffix: '-see', x: 3 * EX, y: 2 * SY },
    ],
    links: LINKS,
    mask: { cell: HANOI_SCENE_MASK_CELL, rows: MASK },
    sounds: ['city-day'],
  });
  m.scene = { sprites: SPRITES, objects: [...SCENE_OBJECTS, ...SEAMS], ambient: 8 };
  return m;
})();

/** Dự phòng khi chưa tải được ảnh đất: bản đồ ô chung của ba thành phố Việt Nam. */
export const hanoiTiles = vietnamTiles({ id: 'hanoi', name: { vi: 'Hà Nội', en: 'Hanoi' }, npcs: [] });
