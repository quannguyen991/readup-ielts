/**
 * TOKYO — bản đồ ĐỐI TƯỢNG 4 mảnh (816×450) vẽ lại theo chủ đề Nhật: lối lát đá, hoa anh đào, đèn đá, ao cá koi, cầu gỗ đỏ.
 * Hình học (đường, ô đất, đài tròn, nước) giữ nguyên khung Singapore nên dùng chung lưới đi được — xem `sg-layout.ts`.
 * Ảnh đất: public/travel/terrain/tokyo*.png · công trình: public/travel/sprites/tokyo/ (bảng sinh bằng ChatGPT, cắt bằng
 * scripts/art/cutsheet.py + finalize_sprites.py).
 */
import type { Npc, SceneSprite } from '@/services/travel/types';
import { buildSgLayoutCity } from './sg-layout';

const SPRITES: Record<string, SceneSprite> = {
  sensoji: { w: 104, h: 78 },
  ramen: { w: 64, h: 78 },
  tsukiji: { w: 103, h: 61 },
  shinjuku: { w: 115, h: 64 },
  shibuya: { w: 86, h: 98 },
  tower: { w: 74, h: 105 },
  haneda: { w: 128, h: 69 },
  machiya: { w: 96, h: 68 },
  apartment: { w: 80, h: 100 },
  office: { w: 78, h: 91 },
  shrine: { w: 104, h: 89 },
  teahouse: { w: 109, h: 82 },
  treeA: { w: 60, h: 61 },
  treeB: { w: 50, h: 45 },
  lamp: { w: 28, h: 52 },
  bench: { w: 29, h: 16 },
};

const NPCS: Npc[] = [
  {
    id: 'tokyo-npc-staff',
    sprite: 'npc_staff',
    chatPersona: 'staff',
    at: { x: 186, y: 206 },
    lines: [
      { en: 'Welcome. Tell me where you want to go and I can help you find the right route.', vi: 'Chào bạn. Hãy nói nơi bạn muốn đến, tôi sẽ giúp tìm đường phù hợp.' },
      { en: 'Shinjuku Station has more than two hundred exits, so check the sign colours.', vi: 'Ga Shinjuku có hơn hai trăm lối ra, nên hãy xem màu biển chỉ dẫn.' },
    ],
  },
  {
    id: 'tokyo-npc-vendor',
    sprite: 'npc_vendor',
    chatPersona: 'vendor',
    at: { x: 132, y: 104 },
    lines: [
      { en: 'Fresh tuna today! Would you like it as sushi or as a rice bowl?', vi: 'Hôm nay có cá ngừ tươi! Bạn muốn ăn sushi hay cơm tô?' },
      { en: 'The miso broth is ready. Would you like spring onions on your ramen?', vi: 'Nước dùng miso vừa xong. Bạn có muốn thêm hành lá vào ramen không?' },
    ],
  },
  {
    id: 'tokyo-npc-tourist',
    sprite: 'npc_tourist',
    chatPersona: 'traveller',
    at: { x: 150, y: 119 },
    path: [{ x: 299, y: 121 }],
    lines: [
      { en: 'I came out of the wrong Shinjuku exit. Does this path lead toward the east side?', vi: 'Mình ra nhầm cửa ga Shinjuku mất rồi. Đường này có dẫn về phía đông không?' },
      { en: 'The cherry blossoms are even prettier at dusk.', vi: 'Hoa anh đào còn đẹp hơn lúc hoàng hôn.' },
    ],
  },
  {
    id: 'tokyo-npc-local',
    sprite: 'npc_local',
    chatPersona: 'local',
    at: { x: 66, y: 125 },
    path: [{ x: 69, y: 159 }],
    lines: [
      { en: 'The lane behind the lanterns is quieter. Are you heading to Senso-ji?', vi: 'Con ngõ sau dãy đèn lồng yên tĩnh hơn. Bạn đang định tới Senso-ji à?' },
      { en: 'Bow once at the gate before you walk in. It is a small sign of respect.', vi: 'Hãy cúi chào một lần trước cổng rồi mới bước vào. Đó là một cử chỉ tôn trọng nhỏ.' },
    ],
  },
  { id: 'tokyo-npc-kid', sprite: 'npc_kid', at: { x: 252, y: 134 }, lines: [{ en: 'Look! The red tower is lit up!', vi: 'Nhìn kìa! Cái tháp đỏ đang sáng đèn!' }] },
  { id: 'tokyo-npc-cat', sprite: 'cat_sit', at: { x: 139, y: 105 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

export const tokyo = buildSgLayoutCity({
  id: 'tokyo',
  name: { vi: 'Tokyo', en: 'Tokyo' },
  utcOffsetHours: 9,
  sprites: SPRITES,
  npcs: NPCS,
  slots: {
    top: { sprite: 'sensoji', poi: 'tokyo-sensoji' },
    left: { sprite: 'tsukiji', poi: 'tokyo-tsukiji' },
    bottomLeft: { sprite: 'ramen', poi: 'tokyo-ramen' },
    bottomRight: { sprite: 'shinjuku', poi: 'tokyo-shinjuku' },
    gate: { sprite: 'haneda', poi: 'tokyo-gate' },
    eTop: { sprite: 'shibuya', poi: 'tokyo-shibuya' },
    right: { sprite: 'tower' },
    cornerNE: { sprite: 'machiya' },
    eMid: { sprite: 'teahouse' },
    eRight: { sprite: 'apartment' },
    seLeft: { sprite: 'shrine' },
    seRight: { sprite: 'machiya' },
    seLow: { sprite: 'office' },
    sLeft: { sprite: 'machiya' },
    sRight: { sprite: 'teahouse' },
    sLowLeft: { sprite: 'apartment' },
    sMidRight: { sprite: 'machiya' },
    sBottomRight: { sprite: 'office' },
  },
});
