/**
 * SINGAPORE — CHẾ ĐỘ ẢNH. Nền là tranh pixel-art `public/travel/maps/singapore.small.png`
 * (418×235 điểm nguồn); mọi toạ độ ở đây là điểm nguồn của ảnh đó. Mặt đất đi được nằm ở
 * `singapore.walk.ts` (sinh bằng `tools/walkmask.py` rồi chỉnh tay).
 *
 * Địa điểm (mã theo `data/travel/pois.ts`) đặt đúng chỗ thấy trên tranh: Changi = nhà vòm kính (trái),
 * MRT = bậc thang xuống ga ở quảng trường Merlion, Hawker = chợ mái ngói đỏ, Marina Bay Sands (trên cùng),
 * Merlion (quảng trường giữa), Gardens by the Bay (siêu cây, phải-trên), khách sạn (phải-dưới).
 * Bản đồ ô vẽ bằng mã dự phòng: `singapore.tiles.ts`.
 */
import type { Npc } from '@/services/travel/types';
import { imageMap, imagePoi } from './imagemap';
import { SINGAPORE_MASK, SINGAPORE_MASK_CELL } from './singapore.walk';

const NPCS: Npc[] = [
  {
    id: 'singapore-npc-staff',
    sprite: 'npc_staff',
    at: { x: 44, y: 150 },
    lines: [
      { en: 'Welcome to Singapore! Do you have anything to declare?', vi: 'Chào mừng đến Singapore! Anh/chị có gì cần khai báo không?' },
      { en: 'The MRT stairs are by the big fountain plaza.', vi: 'Cầu thang xuống ga MRT ở cạnh quảng trường đài phun nước lớn.' },
    ],
  },
  {
    id: 'singapore-npc-vendor',
    sprite: 'npc_vendor',
    at: { x: 46, y: 104 },
    lines: [
      { en: 'Chicken rice, two dollars fifty. Would you like chilli with that?', vi: 'Cơm gà hai đô rưỡi. Anh/chị có lấy thêm ớt không?' },
      { en: 'Careful, the soup is very hot!', vi: 'Cẩn thận nhé, súp nóng lắm!' },
    ],
  },
  {
    id: 'singapore-npc-tourist',
    sprite: 'npc_tourist',
    at: { x: 165, y: 99 },
    path: [{ x: 226, y: 104 }],
    lines: [
      { en: 'Excuse me, how do I get to the big hotel with the boat on top?', vi: 'Xin lỗi, đi tới toà khách sạn lớn có con thuyền trên nóc như thế nào ạ?' },
      { en: 'The view of the bay is amazing at night.', vi: 'Cảnh vịnh đẹp tuyệt vào ban đêm.' },
    ],
  },
  {
    id: 'singapore-npc-local',
    sprite: 'npc_local',
    at: { x: 82, y: 134 },
    path: [{ x: 65, y: 147 }],
    lines: [
      { en: 'There is a famous stone lion on the plaza. Some people only find it after they have seen the big hotel.', vi: 'Trên quảng trường có một con sư tử đá nổi tiếng. Nhiều người chỉ tìm thấy sau khi đã ghé khách sạn lớn.' },
      { en: 'It might rain this afternoon. Take an umbrella.', vi: 'Chiều nay có thể mưa. Nhớ mang theo ô nhé.' },
    ],
  },
  {
    id: 'singapore-npc-kid',
    sprite: 'npc_kid',
    at: { x: 249, y: 171 },
    lines: [{ en: 'Look! The Merlion is spitting water!', vi: 'Nhìn kìa! Sư tử biển đang phun nước!' }],
  },
  {
    id: 'singapore-npc-business',
    sprite: 'npc_business',
    at: { x: 240, y: 104 },
    path: [{ x: 286, y: 106 }],
    lines: [{ en: 'Sorry, I am late for a meeting. Which way is the station?', vi: 'Xin lỗi, tôi trễ cuộc họp rồi. Ga tàu đi lối nào nhỉ?' }],
  },
  {
    id: 'singapore-npc-guard',
    sprite: 'npc_guard',
    at: { x: 61, y: 147 },
    lines: [
      { en: 'Please stand behind the yellow line.', vi: 'Xin đứng sau vạch vàng.' },
      { en: 'No eating or drinking on the train, please.', vi: 'Xin không ăn uống trên tàu.' },
    ],
  },
  { id: 'singapore-npc-cat', sprite: 'cat_sit', at: { x: 71, y: 105 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

export const singapore = imageMap({
  id: 'singapore',
  name: { vi: 'Singapore', en: 'Singapore' },
  utcOffsetHours: 8,
  spawn: { x: 30, y: 160 },
  pois: [
    imagePoi('singapore-changi', { hotspot: { x: 30, y: 116, w: 42, h: 28 }, door: { x: 53, y: 145 } }),
    imagePoi('singapore-hawker', { hotspot: { x: 0, y: 50, w: 94, h: 48 }, door: { x: 57, y: 101 } }),
    imagePoi('singapore-mrt', { hotspot: { x: 250, y: 186, w: 26, h: 20 }, door: { x: 262, y: 184 } }),
    imagePoi('singapore-hotel', { hotspot: { x: 322, y: 158, w: 90, h: 58 }, door: { x: 365, y: 216 } }),
    imagePoi('singapore-mbs', { hotspot: { x: 130, y: 4, w: 134, h: 96 }, door: { x: 190, y: 101 } }),
    imagePoi('singapore-gardens', { hotspot: { x: 296, y: 10, w: 114, h: 72 }, door: { x: 318, y: 86 } }),
    imagePoi('singapore-merlion', { hotspot: { x: 228, y: 124, w: 34, h: 38 }, door: { x: 241, y: 166 } }),
  ],
  npcs: NPCS,
  routes: [
    { id: 'singapore-boat-bay', sprite: 'mini_boat', path: [{ x: 150, y: 114 }, { x: 276, y: 117 }], speed: 1.1 },
    { id: 'singapore-boat-south', sprite: 'mini_boat', path: [{ x: 150, y: 216 }, { x: 336, y: 226 }], speed: 1.4 },
    { id: 'singapore-plane', sprite: 'mini_plane', path: [{ x: -30, y: 22 }, { x: 450, y: 70 }], speed: 3.6, loop: true, layer: 'sky' },
  ],
  mask: { cell: SINGAPORE_MASK_CELL, rows: SINGAPORE_MASK },
  lights: [
    { x: 190, y: 100, r: 34 },
    { x: 141, y: 98, r: 22 },
    { x: 172, y: 178, r: 16 },
    { x: 215, y: 186, r: 16 },
    { x: 256, y: 172, r: 16 },
    { x: 57, y: 100, r: 20 },
    { x: 365, y: 214, r: 20 },
  ],
  sounds: ['city-day', 'water-lap'],
});
