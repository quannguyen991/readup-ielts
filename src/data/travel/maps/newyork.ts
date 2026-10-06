/**
 * NEW YORK — bản đồ ĐỐI TƯỢNG 4 mảnh (816×450) vẽ lại theo chủ đề Manhattan: vỉa hè lát đá, cây phố, thảm cỏ kiểu Central Park,
 * cột đèn sắt, ghế công viên, cầu vòm đá. Hình học giữ nguyên khung Singapore nên dùng chung lưới đi được — xem `sg-layout.ts`.
 * Ảnh đất: public/travel/terrain/newyork*.png · công trình: public/travel/sprites/newyork/.
 */
import type { Npc, SceneSprite } from '@/services/travel/types';
import { buildSgLayoutCity } from './sg-layout';

const SPRITES: Record<string, SceneSprite> = {
  timessquare: { w: 86, h: 106 },
  centralpark: { w: 101, h: 72 },
  metmuseum: { w: 113, h: 72 },
  pizzeria: { w: 84, h: 84 },
  brownstone: { w: 123, h: 81 },
  subway: { w: 84, h: 72 },
  jfk: { w: 126, h: 72 },
  skyscraper: { w: 61, h: 90 },
  deli: { w: 88, h: 90 },
  brickapt: { w: 56, h: 84 },
  flatiron: { w: 49, h: 84 },
  glasstower: { w: 62, h: 86 },
  treeA: { w: 52, h: 54 },
  treeB: { w: 50, h: 53 },
  bench: { w: 29, h: 15 },
  lamp: { w: 9, h: 51 },
};

const NPCS: Npc[] = [
  {
    id: 'newyork-npc-staff',
    sprite: 'npc_staff',
    chatPersona: 'staff',
    at: { x: 186, y: 206 },
    lines: [
      { en: 'Hi. Ask me anything about the neighbourhood, and we can work through it together.', vi: 'Chào bạn. Cứ hỏi tôi bất cứ điều gì về khu này, mình cùng tìm hiểu nhé.' },
      { en: 'The subway entrance is right by the corner, under the green lamps.', vi: 'Lối xuống tàu điện ngầm ngay ở góc phố, dưới hai ngọn đèn xanh.' },
    ],
  },
  {
    id: 'newyork-npc-vendor',
    sprite: 'npc_vendor',
    chatPersona: 'vendor',
    at: { x: 132, y: 104 },
    lines: [
      { en: 'We make the dough here every morning. Want a slice while it is still hot?', vi: 'Sáng nào chúng tôi cũng nhào bột ở đây. Bạn muốn ăn một miếng lúc còn nóng không?' },
      { en: 'Plain cheese or pepperoni? Both are fresh out of the oven.', vi: 'Phô mai thường hay xúc xích cay? Cả hai đều vừa ra lò.' },
    ],
  },
  {
    id: 'newyork-npc-tourist',
    sprite: 'npc_tourist',
    chatPersona: 'traveller',
    at: { x: 150, y: 119 },
    path: [{ x: 299, y: 121 }],
    lines: [
      { en: 'My map says the subway entrance is on this block. Have you spotted the stairs?', vi: 'Bản đồ chỉ lối xuống tàu điện ngầm ở dãy phố này. Bạn có thấy cầu thang không?' },
      { en: 'Times Square is so bright, even in the afternoon!', vi: 'Quảng trường Times sáng thật, ngay cả buổi chiều!' },
    ],
  },
  {
    id: 'newyork-npc-local',
    sprite: 'npc_local',
    chatPersona: 'local',
    at: { x: 66, y: 125 },
    path: [{ x: 69, y: 159 }],
    lines: [
      { en: 'The park is a good shortcut, but the paths near the lake are easier to follow.', vi: 'Công viên là lối tắt khá tốt, nhưng đường gần hồ dễ đi hơn.' },
      { en: 'Walk fast and look straight ahead — that is how you blend in here.', vi: 'Cứ đi nhanh và nhìn thẳng — đó là cách hòa vào nhịp phố này.' },
    ],
  },
  { id: 'newyork-npc-kid', sprite: 'npc_kid', at: { x: 252, y: 134 }, lines: [{ en: 'Look! A yellow taxi!', vi: 'Nhìn kìa! Một chiếc taxi vàng!' }] },
  { id: 'newyork-npc-cat', sprite: 'cat_sit', at: { x: 139, y: 105 }, lines: [{ en: 'Meow!', vi: 'Meo!' }] },
];

export const newyork = buildSgLayoutCity({
  id: 'newyork',
  name: { vi: 'New York', en: 'New York' },
  utcOffsetHours: -5,
  sprites: SPRITES,
  npcs: NPCS,
  slots: {
    top: { sprite: 'timessquare', poi: 'newyork-timessquare' },
    left: { sprite: 'pizzeria', poi: 'newyork-brooklynpizza' },
    bottomLeft: { sprite: 'metmuseum', poi: 'newyork-metmuseum' },
    bottomRight: { sprite: 'subway', poi: 'newyork-subway' },
    right: { sprite: 'centralpark', poi: 'newyork-centralpark' },
    gate: { sprite: 'jfk', poi: 'newyork-gate' },
    cornerNE: { sprite: 'skyscraper' },
    eTop: { sprite: 'brownstone' },
    eMid: { sprite: 'deli' },
    eRight: { sprite: 'brickapt' },
    seLeft: { sprite: 'brownstone' },
    seRight: { sprite: 'flatiron' },
    seLow: { sprite: 'glasstower' },
    sLeft: { sprite: 'deli' },
    sRight: { sprite: 'brickapt' },
    sLowLeft: { sprite: 'brownstone' },
    sMidRight: { sprite: 'flatiron' },
    sBottomRight: { sprite: 'glasstower' },
  },
});
