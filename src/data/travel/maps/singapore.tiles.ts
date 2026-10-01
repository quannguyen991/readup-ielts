/**
 * SINGAPORE — 60×40 ô. Bố cục (bắc ở trên):
 *   - Vịnh Marina phía đông-bắc, đường dạo + ván gỗ ven vịnh; Marina Bay Sands đứng trên đường dạo;
 *     cầu tàu nhỏ đâm ra vịnh, ở đầu cầu là Merlion (địa điểm ẨN, mở sau Marina Bay Sands).
 *   - Công viên phía tây-bắc (ao, ghế, cây).
 *   - Đại lộ 3 làn chạy ngang (taxi); dãy công trình phía nam: Changi (đến), Hawker Centre, khách sạn, MRT.
 *   - Vườn Gardens by the Bay ở phía nam (siêu cây, ao, đường đất).
 * Đường dạo y=29..30 nối mọi cửa; các lối dọc nối đại lộ với đường dạo.
 */
import type { CityMap, Npc, Poi } from '@/services/travel/types';
import { doorOf, MapBuilder } from './builder';
import { withCatalog } from './imagemap';

const m = new MapBuilder(60, 40, 'g');

// ------------------------------------------------------------------ đất
m.g(22, 0, 38, 13, 'w'); // vịnh
m.g(22, 13, 38, 1, 'd'); // ván gỗ ven vịnh
m.g(22, 14, 38, 3, 'P'); // đường dạo
m.g(28, 9, 3, 4, 'd'); // cầu tàu
m.g(0, 17, 60, 1, 'p');
m.g(0, 18, 60, 1, 'r');
m.g(0, 19, 60, 1, 'h');
m.g(0, 20, 60, 1, 'r');
m.g(0, 21, 60, 3, 'p'); // vỉa hè nam đại lộ y 21..23
m.g(0, 29, 60, 2, 'p'); // đường dạo y 29..30
// lối dọc giữa các công trình
for (const x of [10, 23, 32, 41]) m.g(x, 24, x === 10 ? 4 : 3, 5, 'p');
// công viên tây-bắc
m.g(3, 3, 5, 3, 'w'); // ao
m.g(0, 8, 22, 1, 's');
m.g(10, 0, 1, 17, 's');
m.g(9, 9, 3, 4, 'S'); // sân cát nhỏ quanh ghế
// vườn phía nam
m.g(8, 34, 44, 1, 's');
m.g(8, 31, 1, 4, 's');
m.g(51, 31, 1, 4, 's');
m.g(37, 34, 1, 4, 's');
m.g(46, 31, 8, 3, 'w'); // ao sen
m.g(47, 34, 6, 1, 'P');
m.g(5, 31, 3, 2, 'f');

// ------------------------------------------------------------------ công trình có địa điểm
const fp = {
  changi: { x: 2, y: 24, w: 8, h: 5 },
  hawker: { x: 14, y: 24, w: 9, h: 5 },
  hotel: { x: 26, y: 24, w: 6, h: 5 },
  mrt: { x: 35, y: 25, w: 6, h: 4 },
  mbs: { x: 38, y: 14, w: 8, h: 2 },
  merlion: { x: 28, y: 9, w: 2, h: 1 },
  gardens: { x: 36, y: 36, w: 2, h: 1 },
};

// ------------------------------------------------------------------ trang trí
// Tây-bắc: nhà dân + cây
m.o(14, 2, '#', 5, 4);
m.o(14, 10, '#', 4, 3);
m.o(18, 10, '%', 3, 3);
m.scatterMix(0, 0, 22, 17, 'TUNb', 0.1, 11);
m.scatter(0, 0, 22, 17, 'a', 0.03, 12);
m.scatter(0, 0, 22, 17, 'e', 0.03, 13);
m.o(8, 10, 'E');
m.o(12, 10, 'E');
m.o(9, 6, 'E');
m.row(1, 16, 1, 0, 6, 'b', 3);
// Dọc đại lộ: đèn đường, cây cọ
for (let x = 3; x < 60; x += 7) m.o(x, 17, 'L');
for (let x = 6; x < 60; x += 7) m.o(x, 21, 'N');
// Đường dạo ven vịnh
for (const x of [24, 33, 50, 56]) m.o(x, 16, 'L');
for (const x of [26, 31, 36, 48, 53]) m.o(x, 14, 'E');
m.o(34, 16, 'p');
m.o(35, 16, 'p');
m.o(47, 16, 'p');
m.o(55, 16, 'a');
// Cọ ven mép vịnh phía tây (đất cỏ)
m.row(22, 14, 0, 1, 3, 'N');
// Cầu tàu: ghế ở đầu cầu
m.o(30, 10, 'E');
// Thuyền neo ở vịnh
m.o(52, 3, 'O');
// Dãy công trình nam: cây/cọ và bồn hoa
for (const x of [1, 11, 12, 13]) void x;
m.o(10, 23, 'p');
m.o(13, 23, 'p');
m.o(22, 23, 'p');
m.o(26, 23, 'i');
m.o(31, 23, 'i');
m.o(34, 23, 'a');
m.o(40, 23, 'a');
m.o(43, 24, 'N', 1, 1);
// Hawker: bàn và dù
m.o(15, 30, 't');
m.o(16, 30, 'P');
m.o(20, 30, 'P');
m.o(21, 30, 't');
// Sân Changi: xe đẩy hành lý, thùng rác
m.o(1, 29, 'k');
m.o(10, 30, 'n');
// Phía đông công viên hoa
m.scatterMix(43, 23, 17, 6, 'NNbae', 0.2, 31);
m.o(50, 26, 'E');
m.o(55, 26, 'E');
m.scatter(0, 31, 60, 9, 'T', 0.05, 41);
m.scatter(0, 31, 60, 9, 'e', 0.06, 42);
m.scatter(0, 31, 60, 9, 'a', 0.05, 43);
m.scatter(0, 31, 60, 9, 'b', 0.04, 44);
// Siêu cây
for (const [x, y] of [[14, 37], [20, 38], [26, 36], [30, 38], [42, 36], [45, 38], [55, 37]] as [number, number][]) m.o(x, y, 'S');
m.o(33, 35, 'E');
m.o(40, 35, 'E');
// Dọn các ô cửa và lối
for (const f of Object.values(fp)) {
  const d = doorOf(f);
  m.clear(d.x, d.y, 1, 1);
}
// Hàng rào cây quanh vườn
m.row(9, 31, 1, 0, 0, 'H');

const POIS: Poi[] = [
  {
    id: 'singapore-changi',
    kind: 'airport',
    name: { vi: 'Changi — Nhà ga đến', en: 'Changi Arrivals' },
    door: doorOf(fp.changi),
    footprint: fp.changi,
    sprite: 'fac:gate:ARRIVALS',
    content: { decks: ['listening-personal-details', 'listening-numbers-dates-money'], types: ['listen-pick', 'dictation', 'cloze'], level: 1 },
    reward: { coins: 20, souvenir: 'singapore-passport-stamp' },
  },
  {
    id: 'singapore-hawker',
    kind: 'market',
    name: { vi: 'Khu ẩm thực Hawker', en: 'Hawker Centre' },
    door: doorOf(fp.hawker),
    footprint: fp.hawker,
    sprite: 'fac:market:HAWKER',
    content: { decks: ['food', 'listening-shopping-services'], types: ['reply', 'cloze', 'translate'], level: 1 },
    reward: { coins: 25, souvenir: 'singapore-chicken-rice' },
  },
  {
    id: 'singapore-hotel',
    kind: 'hotel',
    name: { vi: 'Khách sạn Marina', en: 'Marina Hotel' },
    door: doorOf(fp.hotel),
    footprint: fp.hotel,
    sprite: 'fac:hotel:HOTEL',
    content: { decks: ['listening-accommodation', 'housing'], types: ['reply', 'order', 'cloze'], level: 2 },
    unlock: { after: 'singapore-changi' },
    reward: { coins: 30, souvenir: 'singapore-room-key' },
  },
  {
    id: 'singapore-mrt',
    kind: 'station',
    name: { vi: 'Ga MRT', en: 'MRT Station' },
    door: doorOf(fp.mrt),
    footprint: fp.mrt,
    sprite: 'fac:station:MRT',
    content: { decks: ['transport', 'listening-directions-maps'], types: ['listen-pick', 'dictation', 'order'], level: 2 },
    unlock: { after: 'singapore-changi' },
    reward: { coins: 30, souvenir: 'singapore-ez-link' },
  },
  {
    id: 'singapore-gardens',
    kind: 'garden',
    name: { vi: 'Gardens by the Bay', en: 'Gardens by the Bay' },
    door: doorOf(fp.gardens),
    footprint: fp.gardens,
    sprite: 'lm_supertree',
    content: { decks: ['environment', 'weather-climate'], types: ['cloze', 'translate', 'listen-pick'], level: 2 },
    unlock: { after: 'singapore-mrt' },
    reward: { coins: 35, souvenir: 'singapore-orchid' },
  },
  {
    id: 'singapore-mbs',
    kind: 'landmark',
    name: { vi: 'Marina Bay Sands', en: 'Marina Bay Sands' },
    door: doorOf(fp.mbs),
    footprint: fp.mbs,
    sprite: 'lm_mbs',
    content: { decks: ['tourism', 'listening-tourism-tours'], types: ['listen-pick', 'cloze', 'speak'], level: 2 },
    unlock: { after: 'singapore-hawker' },
    reward: { coins: 40, souvenir: 'singapore-mbs-postcard' },
  },
  {
    id: 'singapore-merlion',
    kind: 'secret',
    name: { vi: 'Sư tử biển Merlion', en: 'The Merlion' },
    door: doorOf(fp.merlion),
    footprint: fp.merlion,
    sprite: 'lm_merlion',
    content: { decks: ['tourism', 'listening-tourism-tours'], types: ['speak', 'translate', 'cloze'], level: 3 },
    unlock: { after: 'singapore-mbs', minStars: 2 },
    reward: { coins: 60, souvenir: 'singapore-merlion-figurine' },
  },
];

const NPCS: Npc[] = [
  {
    id: 'singapore-npc-staff',
    sprite: 'npc_staff',
    at: { x: 4, y: 30 },
    lines: [
      { en: 'Welcome to Singapore! Do you have anything to declare?', vi: 'Chào mừng đến Singapore! Anh/chị có gì cần khai báo không?' },
      { en: 'The taxi stand is just outside, to your left.', vi: 'Bến taxi ở ngay bên ngoài, phía tay trái anh/chị.' },
    ],
  },
  {
    id: 'singapore-npc-vendor',
    sprite: 'npc_vendor',
    at: { x: 19, y: 30 },
    lines: [
      { en: 'Chicken rice, two dollars fifty. Would you like chilli with that?', vi: 'Cơm gà hai đô rưỡi. Anh/chị có lấy thêm ớt không?' },
      { en: 'Careful, the soup is very hot!', vi: 'Cẩn thận nhé, súp nóng lắm!' },
    ],
  },
  {
    id: 'singapore-npc-tourist',
    sprite: 'npc_tourist',
    at: { x: 30, y: 15 },
    path: [{ x: 44, y: 15 }],
    lines: [
      { en: 'Excuse me, how do I get to Marina Bay Sands?', vi: 'Xin lỗi, đi tới Marina Bay Sands như thế nào ạ?' },
      { en: 'The view from the bay is amazing at night.', vi: 'Cảnh nhìn từ vịnh đẹp tuyệt vào ban đêm.' },
    ],
  },
  {
    id: 'singapore-npc-local',
    sprite: 'npc_local',
    at: { x: 13, y: 8 },
    path: [{ x: 18, y: 8 }],
    lines: [
      { en: 'There is a stone lion on the pier. Some people only find it after they have seen the big hotel.', vi: 'Có một con sư tử đá trên cầu tàu. Nhiều người chỉ tìm thấy sau khi đã ghé khách sạn lớn.' },
      { en: 'It might rain this afternoon. Take an umbrella.', vi: 'Chiều nay có thể mưa. Nhớ mang theo ô nhé.' },
    ],
  },
  {
    id: 'singapore-npc-kid',
    sprite: 'npc_kid',
    at: { x: 49, y: 35 },
    path: [{ x: 45, y: 35 }],
    lines: [
      { en: 'Look! The Supertrees light up at night!', vi: 'Nhìn kìa! Những siêu cây sáng đèn vào ban đêm!' },
    ],
  },
  {
    id: 'singapore-npc-elder',
    sprite: 'npc_elder',
    at: { x: 8, y: 11 },
    lines: [
      { en: 'Take the MRT, young man. It is cheap, fast and cool.', vi: 'Cứ đi MRT đi cháu. Rẻ, nhanh mà lại mát.' },
      { en: 'I come here every morning to feed the birds.', vi: 'Sáng nào ông cũng ra đây cho chim ăn.' },
    ],
  },
  {
    id: 'singapore-npc-business',
    sprite: 'npc_business',
    at: { x: 34, y: 30 },
    path: [{ x: 48, y: 30 }],
    lines: [
      { en: 'Sorry, I am late for a meeting. Which platform is it?', vi: 'Xin lỗi, tôi trễ cuộc họp rồi. Đi sân ga số mấy nhỉ?' },
    ],
  },
  {
    id: 'singapore-npc-guard',
    sprite: 'npc_guard',
    at: { x: 36, y: 30 },
    lines: [
      { en: 'Please stand behind the yellow line.', vi: 'Xin đứng sau vạch vàng.' },
      { en: 'No eating or drinking on the train, please.', vi: 'Xin không ăn uống trên tàu.' },
    ],
  },
  {
    id: 'singapore-npc-cat',
    sprite: 'cat_sit',
    at: { x: 24, y: 30 },
    lines: [{ en: 'Meow!', vi: 'Meo!' }],
  },
];

export const singaporeTiles: CityMap = m.build({
  id: 'singapore',
  name: { vi: 'Singapore', en: 'Singapore' },
  utcOffsetHours: 8,
  palette: 'singapore',
  spawn: { x: 6, y: 30 },
  pois: POIS.map(withCatalog),
  npcs: NPCS,
  routes: [
    { id: 'singapore-taxi-east', sprite: 'taxi', path: [{ x: -4, y: 20 }, { x: 64, y: 20 }], speed: 3.4, count: 2, loop: true },
    { id: 'singapore-taxi-west', sprite: 'taxi', path: [{ x: 64, y: 18 }, { x: -4, y: 18 }], speed: 2.8, count: 2, loop: true },
    { id: 'singapore-boat', sprite: 'boat_small', path: [{ x: 25, y: 6 }, { x: 57, y: 6 }], speed: 0.9, count: 1 },
    { id: 'singapore-plane', sprite: 'plane', path: [{ x: -6, y: 4 }, { x: 66, y: 7 }], speed: 4, count: 1, loop: true, layer: 'sky' },
  ],
  weather: { kind: 'clear', intensity: 0 },
  sounds: ['city-day', 'water-lap'],
});
