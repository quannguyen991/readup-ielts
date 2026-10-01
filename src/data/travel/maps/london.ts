/**
 * LONDON — CHẾ ĐỘ ẢNH. Nền: `public/travel/maps/london.small.png` (418×235 điểm nguồn, mưa phùn),
 * toạ độ là điểm nguồn. Mặt đất đi được: `london.walk.ts` (sinh bằng `tools/walkmask.py`, chỉnh tay).
 * Khớp tranh: Big Ben (trên-trái), xe buýt đỏ trên cầu Westminster = điểm đến từ sân bay Heathrow
 * (tranh không có sân bay), ga Tube (phải), nhà trà + chợ mái sọc + bảo tàng cột + quán trọ gạch đỏ (dưới).
 */
import type { Npc } from '@/services/travel/types';
import { imageMap, imagePoi } from './imagemap';
import { LONDON_MASK, LONDON_MASK_CELL } from './london.walk';

const NPCS: Npc[] = [
  {
    id: 'london-npc-guard',
    sprite: 'npc_guard',
    at: { x: 232, y: 108 },
    lines: [
      { en: 'Mind the gap, please. And keep to the left.', vi: 'Xin chú ý khoảng trống. Và đi bên trái nhé.' },
      { en: 'Big Ben is the bell, not the tower!', vi: 'Big Ben là cái chuông, không phải toà tháp đâu!' },
    ],
  },
  {
    id: 'london-npc-tourist',
    sprite: 'npc_tourist',
    at: { x: 60, y: 126 },
    path: [{ x: 112, y: 144 }],
    lines: [
      { en: 'Excuse me, could you take a photo of me with the clock tower?', vi: 'Xin lỗi, bạn chụp giúp mình một tấm với toà tháp đồng hồ được không?' },
      { en: 'It never stops raining here, does it?', vi: 'Ở đây trời lúc nào cũng mưa nhỉ?' },
    ],
  },
  {
    id: 'london-npc-vendor',
    sprite: 'npc_vendor',
    at: { x: 222, y: 210 },
    lines: [{ en: 'Fresh scones, two for three pounds. Would you like clotted cream?', vi: 'Bánh scone mới nướng, hai cái ba bảng. Bạn có muốn kem đặc không?' }],
  },
  {
    id: 'london-npc-local',
    sprite: 'npc_local',
    at: { x: 331, y: 119 },
    path: [{ x: 297, y: 113 }],
    lines: [
      { en: 'The Tube is just down the road, past the big trees.', vi: 'Ga Tube ở ngay cuối đường, qua mấy hàng cây lớn.' },
      { en: 'Take an umbrella. You will need it.', vi: 'Nhớ mang ô nhé. Bạn sẽ cần đấy.' },
    ],
  },
  {
    id: 'london-npc-business',
    sprite: 'npc_business',
    at: { x: 280, y: 112 },
    path: [{ x: 350, y: 122 }],
    lines: [{ en: 'Sorry, I am running late. Which line goes to Victoria?', vi: 'Xin lỗi, tôi đang trễ. Tuyến nào đi Victoria vậy?' }],
  },
  {
    id: 'london-npc-elder',
    sprite: 'npc_elder',
    at: { x: 300, y: 224 },
    lines: [{ en: 'In my day the bus was a penny and the weather was exactly the same.', vi: 'Hồi ông còn trẻ xe buýt chỉ một xu, còn thời tiết thì y hệt thế này.' }],
  },
  {
    id: 'london-npc-kid',
    sprite: 'npc_kid',
    at: { x: 345, y: 118 },
    lines: [{ en: 'Look, a double-decker bus! Can we sit upstairs?', vi: 'Nhìn kìa, xe buýt hai tầng! Mình ngồi trên tầng hai nhé?' }],
  },
  { id: 'london-npc-cat', sprite: 'cat_sit', at: { x: 190, y: 222 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

export const london = imageMap({
  id: 'london',
  name: { vi: 'London', en: 'London' },
  utcOffsetHours: 0,
  spawn: { x: 230, y: 110 },
  pois: [
    imagePoi('london-heathrow', { hotspot: { x: 96, y: 118, w: 44, h: 26 }, door: { x: 93, y: 131 } }),
    imagePoi('london-tube', { hotspot: { x: 374, y: 106, w: 26, h: 22 }, door: { x: 391, y: 131 } }),
    imagePoi('london-inn', { hotspot: { x: 352, y: 150, w: 60, h: 55 }, door: { x: 352, y: 214 } }),
    imagePoi('london-tearoom', { hotspot: { x: 137, y: 172, w: 64, h: 40 }, door: { x: 169, y: 219 } }),
    imagePoi('london-borough', { hotspot: { x: 202, y: 170, w: 82, h: 38 }, door: { x: 237, y: 205 } }),
    imagePoi('london-museum', { hotspot: { x: 287, y: 148, w: 63, h: 50 }, door: { x: 318, y: 204 } }),
    imagePoi('london-bigben', { hotspot: { x: 207, y: 0, w: 26, h: 86 }, door: { x: 225, y: 99 } }),
  ],
  npcs: NPCS,
  routes: [
    { id: 'london-boat', sprite: 'mini_boat', path: [{ x: 66, y: 4 }, { x: 40, y: 92 }], speed: 1.0 },
    { id: 'london-bus', sprite: 'mini_bus', path: [{ x: 222, y: 104 }, { x: 424, y: 134 }], speed: 2.2, loop: true },
  ],
  mask: { cell: LONDON_MASK_CELL, rows: LONDON_MASK },
  lights: [
    { x: 15, y: 98, r: 22 },
    { x: 37, y: 113, r: 22 },
    { x: 76, y: 132, r: 20 },
    { x: 115, y: 142, r: 18 },
    { x: 170, y: 112, r: 18 },
    { x: 262, y: 104, r: 18 },
    { x: 330, y: 92, r: 18 },
  ],
  weather: { kind: 'drizzle', intensity: 0.4 },
  sounds: ['rain-soft', 'city-murmur'],
});
