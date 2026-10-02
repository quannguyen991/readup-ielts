/**
 * ROME — CHẾ ĐỘ ẢNH. Nền `public/travel/maps/rome.small.png` (418×235 điểm nguồn): Đấu trường Colosseum (trên-trái),
 * đài phun nước Trevi (giữa-trên), quán trattoria có dù trắng (phải), nhà thờ nhỏ (dưới-phải) tượng trưng cho
 * Bảo tàng Vatican, quầy chợ hoa (phải), lối xuống Metro chữ M (trái-dưới). Mặt đất đi được: `rome.walk.ts`
 * (sinh bằng `tools/walkmask.py` theo màu đá lát, loại trừ các toà nhà).
 */
import type { Npc } from '@/services/travel/types';
import { imageMap, imagePoi } from './imagemap';
import { ROME_MASK, ROME_MASK_CELL } from './rome.walk';

const NPCS: Npc[] = [
  {
    id: 'rome-npc-local',
    sprite: 'npc_local',
    at: { x: 199, y: 129 },
    path: [{ x: 250, y: 140 }],
    lines: [
      { en: 'Throw a coin over your shoulder and you will come back to Rome.', vi: 'Ném một đồng xu qua vai là bạn sẽ quay lại Rome.' },
      { en: 'Walk, do not rush. Rome was not built in a day!', vi: 'Cứ đi chậm thôi. Rome đâu có xây xong trong một ngày!' },
    ],
  },
  {
    id: 'rome-npc-tourist',
    sprite: 'npc_tourist',
    at: { x: 99, y: 87 },
    path: [{ x: 70, y: 84 }],
    lines: [
      { en: 'Excuse me, how do I get to the Colosseum entrance?', vi: 'Xin lỗi, đi tới cổng Colosseum như thế nào ạ?' },
      { en: 'It is hotter than I expected!', vi: 'Trời nóng hơn mình tưởng!' },
    ],
  },
  {
    id: 'rome-npc-vendor',
    sprite: 'npc_vendor',
    at: { x: 326, y: 148 },
    lines: [{ en: 'Fresh olives and tomatoes! Taste one, please.', vi: 'Ô liu và cà chua tươi đây! Mời bạn nếm thử một quả.' }],
  },
  {
    id: 'rome-npc-elder',
    sprite: 'npc_elder',
    at: { x: 283, y: 135 },
    lines: [{ en: 'The pasta here is the best in the city. Order the carbonara.', vi: 'Mì ở đây ngon nhất thành phố. Bạn gọi món carbonara nhé.' }],
  },
  {
    id: 'rome-npc-kid',
    sprite: 'npc_kid',
    at: { x: 215, y: 128 },
    lines: [{ en: 'I made a wish! Dad gave me a coin.', vi: 'Con vừa ước xong! Bố cho con một đồng xu.' }],
  },
  {
    id: 'rome-npc-guard',
    sprite: 'npc_guard',
    at: { x: 110, y: 198 },
    lines: [{ en: 'Tickets for the Metro are over there, next to the stairs.', vi: 'Vé Metro ở đằng kia, cạnh cầu thang.' }],
  },
  { id: 'rome-npc-cat', sprite: 'cat_sit', at: { x: 131, y: 169 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

export const romeFlat = imageMap({
  id: 'rome',
  name: { vi: 'Rome', en: 'Rome' },
  utcOffsetHours: 1,
  spawn: { x: 110, y: 84 },
  pois: [
    imagePoi('rome-termini', { hotspot: { x: 95, y: 172, w: 34, h: 30 }, door: { x: 109, y: 201 } }),
    imagePoi('rome-colosseum', { hotspot: { x: 5, y: 5, w: 130, h: 70 }, door: { x: 100, y: 84 } }),
    imagePoi('rome-trevi', { hotspot: { x: 155, y: 28, w: 92, h: 90 }, door: { x: 205, y: 126 } }),
    imagePoi('rome-trattoria', { hotspot: { x: 258, y: 92, w: 57, h: 36 }, door: { x: 281, y: 131 } }),
    imagePoi('rome-vatican', { hotspot: { x: 250, y: 148, w: 72, h: 70 }, door: { x: 278, y: 222 } }),
    imagePoi('rome-market', { hotspot: { x: 316, y: 112, w: 40, h: 36 }, door: { x: 332, y: 150 } }),
  ],
  npcs: NPCS,
  mask: { cell: ROME_MASK_CELL, rows: ROME_MASK },
  lights: [
    { x: 205, y: 118, r: 28 },
    { x: 110, y: 82, r: 24 },
    { x: 278, y: 215, r: 22 },
    { x: 109, y: 195, r: 18 },
  ],
  sounds: ['city-day', 'fountain'],
});
