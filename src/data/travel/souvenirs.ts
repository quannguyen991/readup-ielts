/**
 * Quà lưu niệm của "Du ngoạn Band 9": mỗi địa điểm một món, nhận ở lần hoàn thành
 * đầu. Mô tả đúng một dòng, song ngữ.
 */
import type { Bi } from '@/i18n/useL';
import type { CityId } from '@/services/travel/types';

export type Souvenir = { id: string; city: CityId; name: Bi; desc: Bi; rare?: boolean; glyph: string };

const s = (id: string, city: CityId, vi: string, en: string, dvi: string, den: string, a?: boolean | string, b?: string): Souvenir => ({
  id,
  city,
  name: { vi, en },
  desc: { vi: dvi, en: den },
  rare: a === true ? true : undefined,
  glyph: typeof a === 'string' ? a : (b ?? '🎁'),
});

export const SOUVENIRS: Souvenir[] = [
  s('sv-hn-pho', 'hanoi', 'Bát phở nhỏ', 'Little phở bowl', 'Món đầu tiên trong vali.', 'The first thing in your suitcase.', '🍜'),
  s('sv-hn-ticket', 'hanoi', 'Vé giấy Nội Bài', 'Paper ticket', 'Kỷ niệm chuyến đi đầu tiên.', 'A keepsake from your first trip.', '🎫'),

  s('sv-sg-boarding', 'singapore', 'Thẻ lên máy bay', 'Boarding pass', 'Tới Changi an toàn.', 'Safe arrival at Changi.', '🛂'),
  s('sv-sg-mrt', 'singapore', 'Thẻ MRT', 'MRT card', 'Chạm thẻ, lên tàu.', 'Tap in, hop on.', '🚇'),
  s('sv-sg-key', 'singapore', 'Thẻ phòng khách sạn', 'Hotel key card', 'Phòng 1208, tầng cao.', 'Room 1208, high floor.', '🔑'),
  s('sv-sg-rice', 'singapore', 'Đĩa cơm gà', 'Chicken rice plate', 'Món quốc dân ở Hawker.', 'The hawker-centre classic.', '🍚'),
  s('sv-sg-orchid', 'singapore', 'Hoa lan tím', 'Purple orchid', 'Quốc hoa của Singapore.', 'Singapore’s national flower.', '🌺'),
  s('sv-sg-mbs', 'singapore', 'Mô hình Marina Bay', 'Marina Bay model', 'Ba tháp, một con tàu.', 'Three towers, one ship.', true, '🏙️'),
  s('sv-sg-merlion', 'singapore', 'Sư tử biển Merlion', 'Merlion figurine', 'Quà bí mật lúc 20:00.', 'The 8 pm secret.', true, '🦁'),

  s('sv-ld-stamp', 'london', 'Dấu nhập cảnh', 'Entry stamp', 'Chào mừng tới nước Anh.', 'Welcome to the UK.', '🛂'),
  s('sv-ld-oyster', 'london', 'Thẻ Oyster', 'Oyster card', 'Nhớ chú ý khe hở sân ga.', 'Mind the gap!', '💳'),
  s('sv-ld-key', 'london', 'Chìa khoá nhà trọ', 'Inn key', 'Chìa to, cửa kêu cọt kẹt.', 'A big key and a creaky door.', '🗝️'),
  s('sv-ld-scone', 'london', 'Bánh scone', 'Scone', 'Kem trước hay mứt trước?', 'Cream first, or jam?', '🧁'),
  s('sv-ld-cheese', 'london', 'Phô mai chợ Borough', 'Borough cheese', 'Thơm, hơi nồng.', 'Rich and a little sharp.', '🧀'),
  s('sv-ld-bus', 'london', 'Xe buýt hai tầng', 'Double-decker', 'Đỏ, ngồi tầng trên.', 'Red, and upstairs is best.', '🚌'),
  s('sv-ld-bigben', 'london', 'Mô hình Big Ben', 'Big Ben model', 'Đúng giờ, như mọi khi.', 'On time, as always.', true, '🕰️'),

  s('sv-pr-ticket', 'paris', 'Vé métro', 'Métro ticket', 'Một vé, cả thành phố.', 'One ticket, the whole city.', '🎫'),
  s('sv-pr-croissant', 'paris', 'Bánh croissant', 'Croissant', 'Bơ thơm lừng.', 'Buttery and warm.', '🥐'),
  s('sv-pr-pyramid', 'paris', 'Kim tự tháp kính', 'Glass pyramid', 'Cổng vào Louvre.', 'The way into the Louvre.', '🔺'),
  s('sv-pr-scarf', 'paris', 'Khăn lụa', 'Silk scarf', 'Một chút phong cách Paris.', 'A touch of Paris style.', '🧣'),
  s('sv-pr-macaron', 'paris', 'Bánh macaron', 'Macaron', 'Ngọt, giòn, nhiều màu.', 'Sweet, crisp, colourful.', '🍬'),
  s('sv-pr-eiffel', 'paris', 'Tháp Eiffel mini', 'Mini Eiffel Tower', 'Lấp lánh mỗi giờ chẵn.', 'It sparkles on the hour.', true, '🗼'),

  s('sv-am-ticket', 'amsterdam', 'Vé tàu', 'Train ticket', 'Ga trung tâm, sân 4.', 'Central Station, platform 4.', '🚆'),
  s('sv-am-key', 'amsterdam', 'Chìa khoá nhà kênh', 'Canal-house key', 'Cầu thang rất dốc.', 'Very steep stairs.', '🔑'),
  s('sv-am-tulip', 'amsterdam', 'Hoa tulip', 'Tulip', 'Mua một bó ở chợ.', 'A bunch from the market.', '🌷'),
  s('sv-am-mill', 'amsterdam', 'Cối xay gió nhỏ', 'Little windmill', 'Quay khi có gió.', 'It turns in the wind.', '🌬️'),
  s('sv-am-stroop', 'amsterdam', 'Bánh stroopwafel', 'Stroopwafel', 'Đặt lên tách trà nóng.', 'Warm it on a hot cup.', '🥞'),
  s('sv-am-bike', 'amsterdam', 'Xe đạp nhỏ', 'Little bicycle', 'Ở đây ai cũng đạp xe.', 'Everyone cycles here.', true, '🚲'),

  s('sv-rm-ticket', 'rome', 'Vé tàu Termini', 'Termini ticket', 'Nhớ bấm vé trước khi lên.', 'Validate before you board.', '🎫'),
  s('sv-rm-pasta', 'rome', 'Đĩa pasta', 'Plate of pasta', 'Cacio e pepe, nóng hổi.', 'Cacio e pepe, piping hot.', '🍝'),
  s('sv-rm-colosseum', 'rome', 'Colosseum mini', 'Mini Colosseum', 'Hai nghìn năm tuổi.', 'Two thousand years old.', true, '🏛️'),
  s('sv-rm-coin', 'rome', 'Đồng xu ước nguyện', 'Wish coin', 'Ném qua vai trái.', 'Toss it over your left shoulder.', '🪙'),
  s('sv-rm-vatican', 'rome', 'Bưu thiếp Vatican', 'Vatican postcard', 'Trần nhà đẹp ngước cổ.', 'A ceiling worth the neck ache.', '✉️'),
  s('sv-rm-olive', 'rome', 'Lọ ô liu', 'Jar of olives', 'Mua ở chợ buổi sáng.', 'Bought at the morning market.', '🫒'),
];

const BY_ID = new Map(SOUVENIRS.map((x) => [x.id, x]));

export function getSouvenir(id: string): Souvenir | undefined {
  return BY_ID.get(id);
}
