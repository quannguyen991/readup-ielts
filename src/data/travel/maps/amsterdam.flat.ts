/**
 * AMSTERDAM — CHẾ ĐỘ ẢNH. Nền `public/travel/maps/amsterdam.small.png` (418×235 điểm nguồn): kênh đào, cầu đá,
 * ga trung tâm (dưới-giữa), nhà kênh (giữa-trái), cối xay gió + ruộng tulip (trên-trái), chợ hoa trên thuyền
 * (phải), quán cà phê bên kênh (giữa), thuyền du lịch trên kênh. Mặt đất đi được: các lối/cầu vẽ tay
 * (`amsterdam.walk.ts`, sinh bằng `tools/walkmask.py` từ cấu hình `include_lines`).
 */
import type { Npc } from '@/services/travel/types';
import { imageMap, imagePoi } from './imagemap';
import { AMSTERDAM_MASK, AMSTERDAM_MASK_CELL } from './amsterdam.walk';

const NPCS: Npc[] = [
  {
    id: 'amsterdam-npc-local',
    sprite: 'npc_local',
    at: { x: 200, y: 214 },
    path: [{ x: 240, y: 216 }],
    lines: [
      { en: 'Watch out for the bikes! They have the right of way.', vi: 'Coi chừng xe đạp! Họ được ưu tiên đi trước.' },
      { en: 'Central Station is just behind you.', vi: 'Ga Trung tâm ở ngay sau lưng bạn.' },
    ],
  },
  {
    id: 'amsterdam-npc-tourist',
    sprite: 'npc_tourist',
    at: { x: 100, y: 146 },
    path: [{ x: 160, y: 156 }],
    lines: [
      { en: 'Excuse me, where can I buy a ticket for the canal boat?', vi: 'Xin lỗi, mua vé thuyền du lịch kênh ở đâu vậy?' },
      { en: 'Every bridge here looks the same, but they are all beautiful.', vi: 'Cầu nào ở đây nhìn cũng giống nhau, mà cái nào cũng đẹp.' },
    ],
  },
  {
    id: 'amsterdam-npc-vendor',
    sprite: 'npc_vendor',
    at: { x: 386, y: 150 },
    lines: [{ en: 'Tulips, ten euros a bunch. Which colour do you like?', vi: 'Hoa tulip mười euro một bó. Bạn thích màu nào?' }],
  },
  {
    id: 'amsterdam-npc-kid',
    sprite: 'npc_kid',
    at: { x: 360, y: 118 },
    lines: [{ en: 'Look at the swans! They are following the boat.', vi: 'Nhìn đàn thiên nga kìa! Chúng đang đi theo con thuyền.' }],
  },
  {
    id: 'amsterdam-npc-elder',
    sprite: 'npc_elder',
    at: { x: 140, y: 106 },
    lines: [{ en: 'I have drunk my coffee at this café every morning since I was young.', vi: 'Tôi uống cà phê ở quán này mỗi sáng từ hồi còn trẻ.' }],
  },
  {
    id: 'amsterdam-npc-business',
    sprite: 'npc_business',
    at: { x: 300, y: 80 },
    path: [{ x: 340, y: 104 }],
    lines: [{ en: 'Sorry, I am rushing to catch the tram.', vi: 'Xin lỗi, tôi đang vội bắt xe điện.' }],
  },
  { id: 'amsterdam-npc-cat', sprite: 'cat_sit', at: { x: 176, y: 205 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

export const amsterdamFlat = imageMap({
  id: 'amsterdam',
  name: { vi: 'Amsterdam', en: 'Amsterdam' },
  utcOffsetHours: 1,
  spawn: { x: 215, y: 212 },
  pois: [
    imagePoi('amsterdam-station', { hotspot: { x: 167, y: 145, w: 105, h: 60 }, door: { x: 215, y: 212 } }),
    imagePoi('amsterdam-canalhouse', { hotspot: { x: 125, y: 57, w: 68, h: 43 }, door: { x: 150, y: 106 } }),
    imagePoi('amsterdam-flowers', { hotspot: { x: 290, y: 138, w: 90, h: 50 }, door: { x: 389, y: 161 } }),
    imagePoi('amsterdam-windmill', { hotspot: { x: 30, y: 0, w: 40, h: 52 }, door: { x: 52, y: 66 } }),
    imagePoi('amsterdam-cafe', { hotspot: { x: 125, y: 100, w: 65, h: 25 }, door: { x: 165, y: 106 } }),
    imagePoi('amsterdam-boat', { hotspot: { x: 190, y: 122, w: 40, h: 22 }, door: { x: 221, y: 107 } }),
  ],
  npcs: NPCS,
  routes: [
    { id: 'amsterdam-boat-a', sprite: 'mini_boat', path: [{ x: 232, y: 96 }, { x: 266, y: 96 }], speed: 0.9 },
    { id: 'amsterdam-boat-b', sprite: 'mini_boat', path: [{ x: 54, y: 164 }, { x: 92, y: 164 }], speed: 0.8 },
  ],
  mask: { cell: AMSTERDAM_MASK_CELL, rows: AMSTERDAM_MASK },
  lights: [
    { x: 215, y: 190, r: 26 },
    { x: 165, y: 102, r: 20 },
    { x: 320, y: 100, r: 20 },
    { x: 100, y: 142, r: 18 },
  ],
  weather: { kind: 'wind', intensity: 0.5 },
  sounds: ['city-day', 'water-lap'],
});
