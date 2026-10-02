/**
 * PARIS — CHẾ ĐỘ ẢNH. Nền `public/travel/maps/paris.small.png` (418×235 điểm nguồn, hoàng hôn thu).
 * Tháp Eiffel (trên-giữa), Louvre + kim tự tháp kính (trái-dưới), lối vào Métro kiểu Art Nouveau (phải-dưới),
 * dãy quán cà phê / bistro / cửa hàng dọc phố bên phải. Mặt đất đi được là các lối vẽ tay (`paris.walk.ts`
 * sinh bằng `tools/walkmask.py` từ cấu hình `include_lines`; tranh quá nhiễu lá để phân loại theo màu).
 */
import type { Npc } from '@/services/travel/types';
import { imageMap, imagePoi } from './imagemap';
import { PARIS_MASK, PARIS_MASK_CELL } from './paris.walk';

const NPCS: Npc[] = [
  {
    id: 'paris-npc-local',
    sprite: 'npc_local',
    at: { x: 170, y: 128 },
    path: [{ x: 225, y: 128 }],
    lines: [
      { en: 'The Eiffel Tower sparkles every hour after dark.', vi: 'Tháp Eiffel lấp lánh mỗi giờ khi trời tối.' },
      { en: 'Take the Métro, it is faster than the bus.', vi: 'Đi Métro nhé, nhanh hơn xe buýt.' },
    ],
  },
  {
    id: 'paris-npc-tourist',
    sprite: 'npc_tourist',
    at: { x: 190, y: 62 },
    path: [{ x: 192, y: 84 }],
    lines: [
      { en: 'Excuse me, how far is the Louvre from here?', vi: 'Xin lỗi, từ đây đến Louvre bao xa vậy?' },
      { en: 'Is it better to climb the tower or take the lift?', vi: 'Nên leo thang bộ hay đi thang máy lên tháp?' },
    ],
  },
  {
    id: 'paris-npc-vendor',
    sprite: 'npc_vendor',
    at: { x: 295, y: 79 },
    lines: [{ en: 'A croissant and a coffee? Of course!', vi: 'Một bánh sừng bò và một ly cà phê? Tất nhiên rồi!' }],
  },
  {
    id: 'paris-npc-elder',
    sprite: 'npc_elder',
    at: { x: 100, y: 196 },
    lines: [{ en: 'I have walked past this glass pyramid for fifty years.', vi: 'Tôi đi ngang kim tự tháp kính này đã năm mươi năm rồi.' }],
  },
  {
    id: 'paris-npc-kid',
    sprite: 'npc_kid',
    at: { x: 205, y: 130 },
    lines: [{ en: 'Can I throw a coin in the fountain?', vi: 'Con ném đồng xu vào đài phun nước được không?' }],
  },
  {
    id: 'paris-npc-business',
    sprite: 'npc_business',
    at: { x: 340, y: 105 },
    path: [{ x: 390, y: 122 }],
    lines: [{ en: 'Sorry, I am late for a lunch meeting at the bistro.', vi: 'Xin lỗi, tôi trễ buổi hẹn ăn trưa ở quán bistro rồi.' }],
  },
  { id: 'paris-npc-cat', sprite: 'cat_sit', at: { x: 150, y: 190 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

export const parisFlat = imageMap({
  id: 'paris',
  name: { vi: 'Paris', en: 'Paris' },
  utcOffsetHours: 1,
  spawn: { x: 195, y: 128 },
  pois: [
    imagePoi('paris-eiffel', { hotspot: { x: 166, y: 0, w: 46, h: 42 }, door: { x: 190, y: 52 } }),
    imagePoi('paris-louvre', { hotspot: { x: 0, y: 135, w: 155, h: 60 }, door: { x: 100, y: 200 } }),
    imagePoi('paris-station', { hotspot: { x: 257, y: 163, w: 48, h: 36 }, door: { x: 278, y: 203 } }),
    imagePoi('paris-cafe', { hotspot: { x: 270, y: 38, w: 50, h: 40 }, door: { x: 300, y: 78 } }),
    imagePoi('paris-bistro', { hotspot: { x: 327, y: 75, w: 34, h: 32 }, door: { x: 345, y: 107 } }),
    imagePoi('paris-boutique', { hotspot: { x: 362, y: 97, w: 26, h: 20 }, door: { x: 372, y: 114 } }),
  ],
  npcs: NPCS,
  routes: [{ id: 'paris-boat', sprite: 'mini_boat', path: [{ x: 66, y: 70 }, { x: 108, y: 78 }], speed: 1.0 }],
  mask: { cell: PARIS_MASK_CELL, rows: PARIS_MASK },
  lights: [
    { x: 190, y: 50, r: 30 },
    { x: 195, y: 116, r: 26 },
    { x: 100, y: 190, r: 28 },
    { x: 278, y: 190, r: 22 },
    { x: 300, y: 70, r: 20 },
  ],
  sounds: ['city-day'],
});
