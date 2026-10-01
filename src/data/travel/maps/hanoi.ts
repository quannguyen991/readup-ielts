/**
 * HÀ NỘI (Nội Bài) — CHẾ ĐỘ ẢNH. Nền `public/travel/maps/hanoi.small.png` (418×235 điểm nguồn).
 * Quầy đổi vé + bảng chuyến bay nằm trong sảnh kính, cổng lên máy bay ở nhà ga bên phải (máy bay ở bãi đỗ),
 * quán phở ở sạp bên trái. Mặt đất đi được: `hanoi.walk.ts` (sinh bằng `tools/walkmask.py`, chỉnh tay).
 */
import type { Npc } from '@/services/travel/types';
import { imageMap, imagePoi } from './imagemap';
import { HANOI_MASK, HANOI_MASK_CELL } from './hanoi.walk';

const NPCS: Npc[] = [
  {
    id: 'hanoi-npc-staff',
    sprite: 'npc_staff',
    at: { x: 176, y: 140 },
    lines: [
      { en: 'Good morning! Tickets are exchanged here, at the counter.', vi: 'Chào buổi sáng! Đổi vé ở quầy này nhé.' },
      { en: 'The boarding gate is on the right, next to the control tower.', vi: 'Cổng lên máy bay ở bên phải, cạnh đài kiểm soát không lưu.' },
    ],
  },
  {
    id: 'hanoi-npc-vendor',
    sprite: 'npc_vendor',
    at: { x: 60, y: 102 },
    lines: [
      { en: 'Phở bò or phở gà? Beef or chicken?', vi: 'Phở bò hay phở gà? (Beef or chicken?)' },
      { en: 'Be careful, the broth is hot!', vi: 'Cẩn thận, nước dùng nóng đấy!' },
    ],
  },
  {
    id: 'hanoi-npc-tourist',
    sprite: 'npc_tourist',
    at: { x: 129, y: 149 },
    path: [{ x: 250, y: 150 }],
    lines: [
      { en: 'Excuse me, which gate is the flight to Singapore?', vi: 'Xin lỗi, chuyến bay đi Singapore ở cổng nào ạ?' },
      { en: 'I love the roof of this terminal. It looks like a lotus.', vi: 'Mình thích mái của nhà ga này. Trông như bông sen.' },
    ],
  },
  {
    id: 'hanoi-npc-kid',
    sprite: 'npc_kid',
    at: { x: 270, y: 150 },
    lines: [{ en: 'Look, a big plane! Is it ours?', vi: 'Nhìn kìa, máy bay to quá! Có phải của mình không?' }],
  },
  {
    id: 'hanoi-npc-local',
    sprite: 'npc_local',
    at: { x: 87, y: 97 },
    path: [{ x: 47, y: 99 }],
    lines: [{ en: 'The bus to the city centre leaves every twenty minutes.', vi: 'Xe buýt vào trung tâm cứ hai mươi phút một chuyến.' }],
  },
  {
    id: 'hanoi-npc-guard',
    sprite: 'npc_guard',
    at: { x: 389, y: 113 },
    lines: [{ en: 'Please have your boarding pass ready.', vi: 'Vui lòng chuẩn bị sẵn thẻ lên máy bay.' }],
  },
  { id: 'hanoi-npc-cat', sprite: 'cat_sit', at: { x: 110, y: 138 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

export const hanoi = imageMap({
  id: 'hanoi',
  name: { vi: 'Hà Nội', en: 'Hanoi' },
  utcOffsetHours: 7,
  spawn: { x: 200, y: 150 },
  pois: [
    imagePoi('hanoi-counter', { hotspot: { x: 140, y: 112, w: 76, h: 26 }, door: { x: 192, y: 142 } }),
    imagePoi('hanoi-board', { hotspot: { x: 218, y: 114, w: 26, h: 14 }, door: { x: 230, y: 142 } }),
    imagePoi('hanoi-gate', { hotspot: { x: 370, y: 57, w: 48, h: 38 }, door: { x: 391, y: 113 } }),
    imagePoi('hanoi-pho', { hotspot: { x: 43, y: 72, w: 40, h: 30 }, door: { x: 62, y: 106 } }),
  ],
  npcs: NPCS,
  routes: [
    { id: 'hanoi-taxi-a', sprite: 'mini_taxi', path: [{ x: 110, y: 224 }, { x: 430, y: 224 }], speed: 2.6, loop: true },
    { id: 'hanoi-taxi-b', sprite: 'mini_taxi', path: [{ x: 430, y: 206 }, { x: 110, y: 206 }], speed: 2.0, loop: true },
    { id: 'hanoi-plane', sprite: 'mini_plane', path: [{ x: -30, y: 14 }, { x: 450, y: 40 }], speed: 3.2, loop: true, layer: 'sky' },
  ],
  mask: { cell: HANOI_MASK_CELL, rows: HANOI_MASK },
  lights: [
    { x: 192, y: 130, r: 30 },
    { x: 230, y: 130, r: 22 },
    { x: 60, y: 90, r: 18 },
    { x: 380, y: 100, r: 22 },
  ],
  sounds: ['airport-hall'],
});
