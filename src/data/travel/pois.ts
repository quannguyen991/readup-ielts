/**
 * DANH MỤC ĐỊA ĐIỂM của "Du ngoạn Band 9" — phần NỘI DUNG (bộ từ, loại câu, mức,
 * thưởng, điều kiện mở). Phần HÌNH HỌC (cửa, vùng chiếm trên lưới) nằm ở bản đồ
 * từng thành phố, ghép theo `id`.
 *
 * Quy ước mã: `<cityId>-<slug>`. Hàm `cityOfPoi` dựa vào tiền tố này.
 *
 * `decks` nhận hai loại mã:
 *   - mã bộ từ thật (`VOCAB_TOPICS` hoặc `listening-*`);
 *   - mã bộ câu đáp tình huống `reply-<chủ đề>` (xem `data/travel/replies.ts`).
 */
import type { Bi } from '@/i18n/useL';
import type { CityId, Level, PoiKind, QuestionType } from '@/services/travel/types';

export type PoiContent = {
  id: string;
  city: CityId;
  kind: PoiKind;
  name: Bi;
  content: { decks: string[]; types: QuestionType[]; level: Level };
  unlock?: { after?: string; minStars?: number };
  reward: { coins: number; souvenir?: string };
  /** Số câu một lượt (mặc định 7). */
  questions?: number;
  /** Địa điểm đặc biệt không phải lượt hỏi: mở quầy hải quan / ra cổng bay. */
  action?: 'customs' | 'gate';
};

const p = (
  city: CityId,
  slug: string,
  kind: PoiKind,
  vi: string,
  en: string,
  decks: string[],
  types: QuestionType[],
  level: Level,
  coins: number,
  souvenir: string | undefined,
  after?: string,
  extra: Partial<PoiContent> = {},
): PoiContent => ({
  id: `${city}-${slug}`,
  city,
  kind,
  name: { vi, en },
  content: { decks, types, level },
  unlock: after ? { after: `${city}-${after}` } : undefined,
  reward: { coins, souvenir },
  ...extra,
});

const HANOI: PoiContent[] = [
  // Quầy đổi vé đặt ở Ga Hà Nội; cổng lên máy bay cũ bỏ (đã có nút "Bản đồ thế giới"); bảng chuyến bay sẽ về lại cùng sân bay Nội Bài.
  p('hanoi', 'gate', 'airport', 'Sân bay Nội Bài — cổng lên máy bay', 'Noi Bai Airport — boarding gate', [], [], 1, 0, undefined, undefined, { action: 'gate' }),
  p('hanoi', 'board', 'station', 'Bảng chuyến bay', 'Flight board', ['listening-numbers-dates-money', 'listening-travel-booking'], ['listen-pick', 'cloze', 'dictation'], 1, 6, 'sv-hn-ticket', 'pho'),
  p('hanoi', 'counter', 'counter', 'Ga Hà Nội — quầy đổi vé', 'Hanoi Station — ticket counter', [], [], 1, 0, undefined, undefined, { action: 'customs' }),
  p('hanoi', 'pho', 'restaurant', 'Quán phở', 'Phở stall', ['food', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 1, 6, 'sv-hn-pho'),
  p('hanoi', 'eggcoffee', 'cafe', 'Quán cà phê trứng', 'Egg coffee café', ['food', 'leisure', 'reply-cafe'], ['reply', 'cloze', 'dictation'], 1, 7, 'sv-hn-eggcoffee', 'pho'),
  p('hanoi', 'oldquarter', 'hotel', 'Nhà ống phố cổ', 'Old Quarter homestay', ['housing', 'listening-accommodation', 'reply-hotel'], ['reply', 'cloze', 'order'], 1, 7, 'sv-hn-key', 'pho'),
  p('hanoi', 'dongxuan', 'market', 'Chợ Đồng Xuân', 'Dong Xuan Market', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 1, 8, 'sv-hn-basket', 'eggcoffee'),
  p('hanoi', 'thaprua', 'garden', 'Hồ Gươm và Tháp Rùa', 'Hoan Kiem Lake and Turtle Tower', ['environment', 'culture', 'weather-climate'], ['cloze', 'listen-pick', 'translate'], 1, 8, 'sv-hn-turtle', 'oldquarter'),
  p('hanoi', 'vanmieu', 'museum', 'Văn Miếu – Quốc Tử Giám', 'Temple of Literature', ['history', 'education', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hn-stele', 'thaprua'),
  p('hanoi', 'buncha', 'restaurant', 'Quán bún chả', 'Bún chả grill', ['food', 'reply-restaurant', 'listening-shopping-services'], ['reply', 'cloze', 'dictation'], 1, 7, 'sv-hn-buncha', 'pho'),
  p('hanoi', 'banhmi', 'cafe', 'Hàng bánh mì', 'Bánh mì stall', ['food', 'leisure', 'reply-cafe'], ['reply', 'cloze', 'listen-pick'], 1, 7, 'sv-hn-banhmi', 'eggcoffee'),
  p('hanoi', 'flowers', 'market', 'Chợ hoa Quảng Bá', 'Quang Ba flower market',['agriculture', 'shopping', 'reply-market'], ['reply', 'cloze', 'translate'], 1, 8, 'sv-hn-flowers', 'dongxuan'),
  p('hanoi', 'biahoi', 'restaurant', 'Phố bia hơi Tạ Hiện', 'Ta Hien beer street',['food', 'festivals', 'reply-restaurant'], ['reply', 'cloze', 'order'], 2, 9, 'sv-hn-beer', 'buncha'),
  p('hanoi', 'puppet', 'museum', 'Nhà hát múa rối nước', 'Water puppet theatre', ['culture', 'art', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hn-puppet', 'thaprua'),
  p('hanoi', 'opera', 'museum', 'Nhà hát Lớn', 'Opera House', ['art', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-hn-opera', 'vanmieu'),
  p('hanoi', 'doanmon', 'museum', 'Hoàng thành Thăng Long', 'Thang Long Imperial Citadel', ['history', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 11, 'sv-hn-citadel', 'opera'),
  p('hanoi', 'tranquoc', 'landmark', 'Chùa Trấn Quốc', 'Tran Quoc Pagoda', ['culture', 'festivals', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 11, 'sv-hn-pagoda', 'motcot'),
  p('hanoi', 'longbien', 'landmark', 'Cầu Long Biên', 'Long Bien Bridge', ['history', 'transport', 'listening-history-architecture'], ['cloze', 'listen-pick', 'dictation'], 2, 11, 'sv-hn-bridge', 'doanmon'),
  p('hanoi', 'mausoleum', 'landmark', 'Lăng Chủ tịch Hồ Chí Minh', 'Ho Chi Minh Mausoleum', ['history', 'tourism', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-hn-mausoleum', 'tranquoc'),
  p('hanoi', 'motcot', 'landmark', 'Chùa Một Cột', 'One Pillar Pagoda', ['tourism', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-hn-pillar', 'vanmieu'),
  // Địa điểm thật bổ sung (toạ độ đối chiếu Google Maps, 11/10/2026).
  p('hanoi', 'ngocson', 'landmark', 'Đền Ngọc Sơn và cầu Thê Húc', 'Ngoc Son Temple and The Huc Bridge', ['culture', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 11, 'sv-hn-ngocson', 'thaprua'),
  p('hanoi', 'nhatholon', 'landmark', 'Nhà thờ Lớn Hà Nội', "St. Joseph's Cathedral", ['culture', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 11, 'sv-hn-nhatholon', 'opera'),
  p('hanoi', 'buudien', 'landmark', 'Bưu điện Hà Nội', 'Hanoi Central Post Office', ['history', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hn-buudien', 'counter'),
  p('hanoi', 'lichsu', 'museum', 'Bảo tàng Lịch sử Quốc gia', 'National Museum of Vietnamese History', ['history', 'education', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 2, 11, 'sv-hn-lichsu', 'opera'),
  p('hanoi', 'hoalo', 'museum', 'Nhà tù Hỏa Lò', 'Hoa Lo Prison Relic', ['history', 'culture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-hn-hoalo', 'counter'),
  p('hanoi', 'quansu', 'landmark', 'Chùa Quán Sứ', 'Quan Su Pagoda', ['culture', 'festivals', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hn-quansu', 'hoalo'),
  p('hanoi', 'hangma', 'market', 'Phố Hàng Mã', 'Hang Ma lantern street', ['shopping', 'festivals', 'reply-market'], ['reply', 'cloze', 'translate'], 1, 8, 'sv-hn-hangma', 'dongxuan'),
  p('hanoi', 'cotco', 'landmark', 'Cột Cờ Hà Nội', 'Hanoi Flag Tower', ['history', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hn-cotco', 'mausoleum'),
  p('hanoi', 'badinh', 'landmark', 'Quảng trường Ba Đình', 'Ba Dinh Square', ['history', 'tourism', 'listening-history-architecture'], ['cloze', 'listen-pick', 'dictation'], 2, 10, 'sv-hn-badinh', 'mausoleum'),
  p('hanoi', 'quanthanh', 'landmark', 'Đền Quán Thánh', 'Quan Thanh Temple', ['culture', 'festivals', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hn-quanthanh', 'motcot'),
  p('hanoi', 'phutayho', 'landmark', 'Phủ Tây Hồ', 'Phu Tay Ho Temple', ['culture', 'history', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hn-phutayho', 'tranquoc'),
  p('hanoi', 'kimlien', 'landmark', 'Chùa Kim Liên', 'Kim Lien Pagoda', ['culture', 'festivals', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hn-kimlien', 'tranquoc'),
  p('hanoi', 'godongda', 'garden', 'Gò Đống Đa', 'Dong Da Mound', ['history', 'environment', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 9, 'sv-hn-godongda', 'vanmieu'),
  p('hanoi', 'huonglien', 'restaurant', 'Bún chả Hương Liên', 'Huong Lien bun cha', ['food', 'reply-restaurant', 'listening-shopping-services'], ['reply', 'cloze', 'dictation'], 1, 8, 'sv-hn-huonglien', 'buncha'),
  p('hanoi', 'dantoc', 'museum', 'Bảo tàng Dân tộc học Việt Nam', 'Vietnam Museum of Ethnology', ['culture', 'history', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 11, 'sv-hn-dantoc', 'lichsu'),
  p('hanoi', 'keangnam', 'landmark', 'Keangnam Landmark 72', 'Keangnam Landmark 72', ['architecture', 'tourism', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 9, 'sv-hn-keangnam', 'longbien'),
  p('hanoi', 'chollongbien', 'market', 'Chợ Long Biên', 'Long Bien Market', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 9, 'sv-hn-chollongbien', 'longbien'),
  p('hanoi', 'cafegiang', 'cafe', 'Cà phê Giảng', 'Giang Café', ['food', 'leisure', 'reply-cafe'], ['reply', 'cloze', 'dictation'], 1, 8, 'sv-hn-cafegiang', 'eggcoffee'),
  p('hanoi', 'banhmichao', 'cafe', 'Bánh mì Chảo Hiệu Lực', 'Hieu Luc pan-fried bánh mì', ['food', 'leisure', 'reply-cafe'], ['reply', 'cloze', 'listen-pick'], 1, 8, 'sv-hn-banhmichao', 'banhmi'),
  p('hanoi', 'honguom', 'museum', 'Nhà hát Hồ Gươm', 'Ho Guom Theatre', ['art', 'culture', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-hn-honguom', 'opera'),
];

const SINGAPORE: PoiContent[] = [
  p('singapore', 'changi', 'airport', 'Sân bay Changi', 'Changi Airport', ['listening-personal-details', 'listening-numbers-dates-money', 'reply-airport'], ['reply', 'listen-pick', 'cloze'], 1, 8, 'sv-sg-boarding'),
  p('singapore', 'mrt', 'station', 'Tàu điện MRT', 'MRT station', ['listening-directions-maps', 'transport', 'reply-directions'], ['reply', 'listen-pick', 'order'], 1, 8, 'sv-sg-mrt', 'changi'),
  p('singapore', 'hotel', 'hotel', 'Khách sạn', 'Hotel', ['listening-accommodation', 'housing', 'reply-hotel'], ['reply', 'cloze', 'order'], 1, 8, 'sv-sg-key', 'changi'),
  p('singapore', 'hawker', 'restaurant', 'Khu ăn vặt Hawker', 'Hawker centre', ['food', 'listening-shopping-services', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 1, 9, 'sv-sg-rice', 'mrt'),
  p('singapore', 'gardens', 'garden', 'Gardens by the Bay', 'Gardens by the Bay', ['environment', 'weather-climate'], ['cloze', 'listen-pick', 'translate'], 1, 10, 'sv-sg-orchid', 'hotel'),
  p('singapore', 'mbs', 'landmark', 'Marina Bay Sands', 'Marina Bay Sands', ['tourism', 'listening-tourism-tours', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 2, 12, 'sv-sg-mbs', 'hawker'),
  p('singapore', 'kopitiam', 'restaurant', 'Tiệm cà phê kopitiam', 'Kopitiam', ['food', 'listening-shopping-services', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 1, 9, 'sv-sg-kopi', 'hawker'),
  p('singapore', 'cablecar', 'station', 'Cáp treo Sentosa', 'Sentosa cable car', ['transport', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'order'], 2, 10, 'sv-sg-cablecar', 'mrt'),
  p('singapore', 'temple', 'landmark', 'Chùa Phật Nha', 'Buddha Tooth temple', ['culture', 'festivals', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 11, 'sv-sg-temple', 'gardens', { unlock: { after: 'singapore-gardens', minStars: 2 } }),
  p('singapore', 'mall', 'market', 'Trung tâm mua sắm Orchard', 'Orchard mall', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 11, 'sv-sg-mall', 'mbs', { unlock: { after: 'singapore-mbs', minStars: 2 } }),
  p('singapore', 'beachbar', 'cafe', 'Quán bar bãi biển', 'Beach bar', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-sg-coconut', 'cablecar'),
  p('singapore', 'merlion', 'secret', 'Merlion lúc 20:00', 'Merlion at 8 pm', ['tourism', 'food', 'environment', 'transport', 'listening-directions-maps', 'reply-tickets'], ['cloze', 'reply', 'listen-pick', 'order', 'dictation'], 2, 15, 'sv-sg-merlion', undefined, { questions: 10 }),
];

const LONDON: PoiContent[] = [
  p('london', 'heathrow', 'airport', 'Sân bay Heathrow', 'Heathrow Airport', ['listening-personal-details', 'listening-travel-booking', 'reply-airport'], ['reply', 'listen-pick', 'cloze'], 2, 10, 'sv-ld-stamp'),
  p('london', 'tube', 'station', 'Tàu điện ngầm Tube', 'The Tube', ['transport', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'order'], 2, 10, 'sv-ld-oyster', 'heathrow'),
  p('london', 'inn', 'hotel', 'Nhà trọ phố cổ', 'Old-town inn', ['housing', 'listening-accommodation', 'reply-hotel'], ['reply', 'cloze', 'order'], 2, 10, 'sv-ld-key', 'heathrow'),
  p('london', 'tearoom', 'cafe', 'Quán trà chiều', 'Tea room', ['food', 'reply-cafe'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-ld-scone', 'tube'),
  p('london', 'borough', 'market', 'Chợ Borough', 'Borough Market', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 11, 'sv-ld-cheese', 'inn'),
  p('london', 'museum', 'museum', 'Bảo tàng', 'Museum', ['history', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-ld-bus', 'tearoom'),
  p('london', 'bigben', 'secret', 'Big Ben đúng giờ', 'Big Ben on the hour', ['history', 'architecture', 'listening-history-architecture', 'listening-signposts-corrections', 'reply-directions'], ['dictation', 'listen-pick', 'cloze', 'order', 'reply'], 3, 15, 'sv-ld-bigben', undefined, { questions: 10 }),
  p('london', 'gate', 'airport', 'Sân bay Heathrow — cổng lên máy bay', 'Heathrow Airport — boarding gate', [], [], 2, 0, undefined, undefined, { action: 'gate' }),
  p('london', 'buckingham', 'landmark', 'Cung điện Buckingham', 'Buckingham Palace', ['history', 'tourism', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-ld-palace', 'museum'),
  p('london', 'eye', 'landmark', 'London Eye', 'London Eye', ['tourism', 'listening-tourism-tours', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 3, 12, 'sv-ld-eye', 'tearoom'),
  p('london', 'stpauls', 'museum', 'Nhà thờ St Paul', 'St Paul’s Cathedral', ['architecture', 'history', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-ld-stpauls', 'museum'),
  p('london', 'harrods', 'market', 'Cửa hàng Harrods', 'Harrods department store', ['shopping', 'fashion', 'reply-market'], ['reply', 'cloze', 'translate'], 3, 11, 'sv-ld-harrods', 'borough'),
  p('london', 'camden', 'market', 'Chợ Camden', 'Camden Market', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 3, 11, 'sv-ld-camden', 'harrods'),
  p('london', 'fishchips', 'restaurant', 'Quán fish and chips', 'Fish and chips shop', ['food', 'reply-restaurant', 'listening-shopping-services'], ['reply', 'cloze', 'order'], 2, 10, 'sv-ld-fish', 'tearoom'),
];

const PARIS: PoiContent[] = [
  p('paris', 'station', 'station', 'Ga Paris', 'Paris station', ['transport', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'order'], 2, 10, 'sv-pr-ticket'),
  p('paris', 'cafe', 'cafe', 'Quán cà phê vỉa hè', 'Pavement café', ['food', 'reply-cafe'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-pr-croissant', 'station'),
  p('paris', 'louvre', 'museum', 'Bảo tàng Louvre', 'The Louvre', ['art', 'culture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-pr-pyramid', 'station'),
  p('paris', 'boutique', 'market', 'Cửa hàng thời trang', 'Fashion boutique', ['fashion', 'shopping', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 11, 'sv-pr-scarf', 'cafe'),
  p('paris', 'bistro', 'restaurant', 'Nhà hàng bistro', 'Bistro', ['food', 'festivals', 'reply-restaurant'], ['reply', 'cloze', 'order'], 3, 12, 'sv-pr-macaron', 'louvre'),
  p('paris', 'eiffel', 'landmark', 'Tháp Eiffel', 'Eiffel Tower', ['tourism', 'culture', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 3, 14, 'sv-pr-eiffel', 'boutique'),
  p('paris', 'gate', 'airport', 'Sân bay Orly — cổng lên máy bay', 'Orly Airport — boarding gate', [], [], 2, 0, undefined, undefined, { action: 'gate' }),
  p('paris', 'orsay', 'museum', 'Bảo tàng Orsay', 'Musée d’Orsay', ['art', 'history', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-pr-orsay', 'louvre'),
  p('paris', 'notredame', 'landmark', 'Nhà thờ Đức Bà Paris', 'Notre-Dame de Paris', ['architecture', 'history', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-pr-notredame', 'station'),
  p('paris', 'creperie', 'restaurant', 'Quán bánh crêpe', 'Crêperie', ['food', 'reply-restaurant'], ['reply', 'cloze', 'order'], 2, 10, 'sv-pr-crepe', 'cafe'),
  p('paris', 'sacrecoeur', 'landmark', 'Thánh đường Sacré-Cœur', 'Sacré-Cœur Basilica', ['tourism', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 3, 12, 'sv-pr-sacre', 'notredame'),
  p('paris', 'carousel', 'garden', 'Vòng ngựa gỗ', 'Carousel', ['leisure', 'festivals'], ['cloze', 'listen-pick', 'translate'], 2, 10, 'sv-pr-carousel', 'cafe'),
  p('paris', 'perfume', 'market', 'Cửa hàng nước hoa', 'Perfume boutique', ['shopping', 'fashion', 'reply-market'], ['reply', 'cloze', 'translate'], 3, 11, 'sv-pr-perfume', 'boutique'),
  p('paris', 'moulin', 'landmark', 'Moulin Rouge', 'Moulin Rouge', ['art', 'festivals', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-pr-moulin', 'bistro'),
  p('paris', 'bouquiniste', 'market', 'Sạp sách ven sông', 'Riverside book stalls', ['shopping', 'education', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 10, 'sv-pr-books', 'orsay'),
];

const AMSTERDAM: PoiContent[] = [
  p('amsterdam', 'station', 'station', 'Ga trung tâm', 'Central Station', ['transport', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'order'], 2, 10, 'sv-am-ticket'),
  p('amsterdam', 'canalhouse', 'hotel', 'Nhà kênh', 'Canal house', ['housing', 'listening-accommodation', 'reply-hotel'], ['reply', 'cloze', 'order'], 2, 10, 'sv-am-key', 'station'),
  p('amsterdam', 'flowers', 'market', 'Chợ hoa tulip', 'Flower market', ['agriculture', 'shopping', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 10, 'sv-am-tulip', 'station'),
  p('amsterdam', 'windmill', 'garden', 'Cối xay gió', 'Windmill', ['energy', 'environment'], ['cloze', 'listen-pick', 'translate'], 3, 12, 'sv-am-mill', 'canalhouse'),
  p('amsterdam', 'cafe', 'cafe', 'Quán cà phê bên kênh', 'Canal-side café', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-am-stroop', 'flowers'),
  p('amsterdam', 'boat', 'landmark', 'Chuyến thuyền kênh', 'Canal boat tour', ['tourism', 'listening-tourism-tours', 'reply-tickets'], ['reply', 'listen-pick', 'dictation'], 3, 13, 'sv-am-bike', 'windmill'),
  p('amsterdam', 'gate', 'airport', 'Sân bay Schiphol — cổng lên máy bay', 'Schiphol Airport — boarding gate', [], [], 2, 0, undefined, undefined, { action: 'gate' }),
  p('amsterdam', 'annefrank', 'museum', 'Nhà Anne Frank', 'Anne Frank House', ['history', 'education', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-am-anne', 'canalhouse'),
  p('amsterdam', 'pancake', 'restaurant', 'Quán bánh pancake', 'Pancake house', ['food', 'reply-restaurant'], ['reply', 'cloze', 'order'], 2, 10, 'sv-am-pancake', 'cafe'),
  p('amsterdam', 'palace', 'landmark', 'Cung điện Hoàng gia Dam', 'Royal Palace on the Dam', ['history', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 3, 12, 'sv-am-palace', 'station'),
  p('amsterdam', 'vangogh', 'museum', 'Bảo tàng Van Gogh', 'Van Gogh Museum', ['art', 'culture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 13, 'sv-am-vangogh', 'palace'),
  p('amsterdam', 'stroopwafel', 'market', 'Sạp bánh stroopwafel', 'Stroopwafel stall', ['shopping', 'food', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 10, 'sv-am-waffle', 'flowers'),
  p('amsterdam', 'drawbridge', 'landmark', 'Cầu quay Magere Brug', 'Skinny Bridge', ['transport', 'tourism', 'reply-directions'], ['reply', 'listen-pick', 'order'], 2, 11, 'sv-am-bridge', 'canalhouse'),
  p('amsterdam', 'greenhouse', 'garden', 'Nhà kính tulip', 'Tulip greenhouse', ['agriculture', 'environment'], ['cloze', 'listen-pick', 'translate'], 3, 11, 'sv-am-greenhouse', 'flowers'),
  p('amsterdam', 'bikes', 'market', 'Cho thuê xe đạp', 'Bike rental', ['transport', 'shopping', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 10, 'sv-am-bikes', 'station'),
];

const ROME: PoiContent[] = [
  p('rome', 'termini', 'station', 'Ga Termini', 'Termini station', ['transport', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'order'], 3, 12, 'sv-rm-ticket'),
  p('rome', 'trattoria', 'restaurant', 'Quán trattoria', 'Trattoria', ['food', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 3, 12, 'sv-rm-pasta', 'termini'),
  p('rome', 'colosseum', 'landmark', 'Đấu trường Colosseum', 'The Colosseum', ['history', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 14, 'sv-rm-colosseum', 'termini'),
  p('rome', 'trevi', 'garden', 'Đài phun nước Trevi', 'Trevi Fountain', ['culture', 'listening-history-architecture'], ['cloze', 'dictation', 'listen-pick'], 3, 13, 'sv-rm-coin', 'trattoria'),
  p('rome', 'vatican', 'museum', 'Bảo tàng Vatican', 'Vatican museums', ['art', 'history', 'reply-tickets'], ['reply', 'cloze', 'translate'], 3, 14, 'sv-rm-vatican', 'colosseum'),
  p('rome', 'market', 'market', 'Chợ Campo de’ Fiori', 'Campo de’ Fiori market', ['shopping', 'food', 'reply-market'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-rm-olive', 'trevi'),
  p('rome', 'gate', 'airport', 'Sân bay Fiumicino — cổng lên máy bay', 'Fiumicino Airport — boarding gate', [], [], 3, 0, undefined, undefined, { action: 'gate' }),
  p('rome', 'stpeters', 'landmark', 'Quảng trường Thánh Phêrô', 'St Peter’s Square', ['architecture', 'history', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 13, 'sv-rm-peters', 'vatican'),
  p('rome', 'castel', 'museum', 'Lâu đài Thiên Thần', 'Castel Sant’Angelo', ['history', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 3, 13, 'sv-rm-castel', 'stpeters'),
  p('rome', 'steps', 'garden', 'Bậc thang Tây Ban Nha', 'Spanish Steps', ['tourism', 'leisure', 'listening-tourism-tours'], ['cloze', 'listen-pick', 'dictation'], 3, 12, 'sv-rm-steps', 'trevi'),
  p('rome', 'carbonara', 'restaurant', 'Quán carbonara', 'Carbonara kitchen', ['food', 'reply-restaurant'], ['reply', 'cloze', 'order'], 3, 12, 'sv-rm-carbonara', 'trattoria'),
  p('rome', 'arch', 'landmark', 'Khải hoàn môn Constantine', 'Arch of Constantine', ['history', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-rm-arch', 'colosseum'),
  p('rome', 'vespa', 'market', 'Cửa hàng xe Vespa', 'Vespa shop', ['shopping', 'transport', 'reply-market'], ['reply', 'cloze', 'translate'], 3, 12, 'sv-rm-vespa', 'market'),
  p('rome', 'espresso', 'cafe', 'Quán espresso', 'Espresso bar', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'dictation'], 3, 11, 'sv-rm-espresso', 'termini'),
  p('rome', 'aqueduct', 'garden', 'Cầu máng cổ', 'Ancient aqueduct', ['history', 'environment'], ['cloze', 'listen-pick', 'translate'], 3, 12, 'sv-rm-aqueduct', 'arch'),
];

const HOCHIMINH: PoiContent[] = [
  // Mảnh A (trung tâm Sài Gòn). Sân bay Tân Sơn Nhất + chợ đêm / Củ Chi / Mê Kông sẽ vào cùng các mảnh E/S/SE.
  p('hochiminh', 'gate', 'airport', 'Sân bay Tân Sơn Nhất — cổng lên máy bay', 'Tan Son Nhat Airport — boarding gate', [], [], 1, 0, undefined, undefined, { action: 'gate' }),
  p('hochiminh', 'benthanh', 'market', 'Chợ Bến Thành', 'Ben Thanh Market', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 1, 9, 'sv-hcm-conical'),
  p('hochiminh', 'comtam', 'restaurant', 'Quán cơm tấm', 'Broken-rice eatery', ['food', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 1, 9, 'sv-hcm-comtam', 'benthanh'),
  p('hochiminh', 'banhmi', 'cafe', 'Xe bánh mì và cà phê sữa đá', 'Bánh mì cart and iced coffee', ['food', 'leisure', 'reply-cafe'], ['reply', 'cloze', 'listen-pick'], 1, 9, 'sv-hcm-banhmi', 'benthanh'),
  p('hochiminh', 'notredame', 'landmark', 'Nhà thờ Đức Bà', 'Notre-Dame Cathedral', ['architecture', 'history', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hcm-notredame', 'benthanh'),
  p('hochiminh', 'postoffice', 'museum', 'Bưu điện Trung tâm', 'Central Post Office', ['architecture', 'culture', 'reply-tickets'], ['reply', 'cloze', 'translate'], 2, 10, 'sv-hcm-postcard', 'notredame'),
  p('hochiminh', 'independence', 'museum', 'Dinh Độc Lập', 'Independence Palace', ['history', 'culture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 11, 'sv-hcm-palace', 'postoffice'),
  p('hochiminh', 'phoshop', 'restaurant', 'Quán phở Sài Gòn', 'Saigon phở shop', ['food', 'reply-restaurant', 'listening-shopping-services'], ['reply', 'cloze', 'dictation'], 1, 9, 'sv-hcm-phoshop', 'comtam'),
  p('hochiminh', 'cafesua', 'cafe', 'Quán cà phê sữa đá', 'Iced milk coffee café', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'listen-pick'], 1, 9, 'sv-hcm-cafesua', 'banhmi'),
  p('hochiminh', 'opera', 'museum', 'Nhà hát Thành phố', 'Municipal Theatre', ['art', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-hcm-opera', 'postoffice'),
  p('hochiminh', 'thienhau', 'landmark', 'Chùa Bà Thiên Hậu', 'Thien Hau Temple', ['culture', 'festivals', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hcm-thienhau', 'notredame'),
  p('hochiminh', 'warmuseum', 'museum', 'Bảo tàng Chứng tích Chiến tranh', 'War Remnants Museum', ['history', 'education', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-hcm-warmuseum', 'independence'),
  p('hochiminh', 'buivien', 'market', 'Chợ đêm phố Bùi Viện', 'Bui Vien night market', ['shopping', 'money', 'leisure'], ['reply', 'cloze', 'translate'], 2, 10, 'sv-hcm-buivien', 'phoshop'),
  p('hochiminh', 'cuchi', 'landmark', 'Địa đạo Củ Chi', 'Cu Chi Tunnels', ['history', 'tourism', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-hcm-cuchi', 'warmuseum'),
  p('hochiminh', 'mekong', 'landmark', 'Bến thuyền sông Mê Kông', 'Mekong boat pier', ['tourism', 'agriculture', 'listening-tourism-tours'], ['reply', 'listen-pick', 'dictation'], 3, 12, 'sv-hcm-mekong', 'cuchi'),
  p('hochiminh', 'skydeck', 'landmark', 'Đài quan sát Sky Deck', 'Sky Deck viewpoint', ['tourism', 'architecture', 'listening-tourism-tours'], ['reply', 'cloze', 'dictation'], 3, 13, 'sv-hcm-skydeck', 'landmark81'),
  p('hochiminh', 'bitexco', 'landmark', 'Tháp Bitexco', 'Bitexco Tower', ['tourism', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 2, 11, 'sv-hcm-bitexco', 'banhmi'),
  p('hochiminh', 'landmark81', 'landmark', 'Landmark 81', 'Landmark 81', ['tourism', 'listening-tourism-tours', 'reply-tickets'], ['reply', 'listen-pick', 'dictation'], 2, 12, 'sv-hcm-landmark81', 'bitexco'),
  // Địa điểm thêm (Google Maps, 12/10/2026): trung tâm, quận 1–3, quận 5 và quận 6.
  p('hochiminh', 'nguyenhue', 'landmark', 'Phố đi bộ Nguyễn Huệ', 'Nguyen Hue Walking Street', ['leisure', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 1, 9, 'sv-hcm-nguyenhue', 'benthanh'),
  p('hochiminh', 'nharong', 'museum', 'Bến Nhà Rồng — Bảo tàng Hồ Chí Minh', 'Nha Rong Wharf — Ho Chi Minh Museum', ['history', 'culture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 11, 'sv-hcm-nharong', 'warmuseum'),
  p('hochiminh', 'vinhnghiem', 'landmark', 'Chùa Vĩnh Nghiêm', 'Vinh Nghiem Pagoda', ['culture', 'festivals', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hcm-vinhnghiem', 'thienhau'),
  p('hochiminh', 'taodan', 'garden', 'Công viên Tao Đàn', 'Tao Dan Park', ['environment', 'leisure'], ['cloze', 'listen-pick', 'dictation'], 1, 9, 'sv-hcm-taodan', 'postoffice'),
  p('hochiminh', 'thaocam', 'garden', 'Thảo Cầm Viên Sài Gòn', 'Saigon Zoo and Botanical Gardens', ['environment', 'leisure', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hcm-thaocam', 'taodan'),
  p('hochiminh', 'tandinh', 'landmark', 'Nhà thờ Tân Định', 'Tan Dinh Church', ['culture', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-hcm-tandinh', 'vinhnghiem'),
  p('hochiminh', 'lanhong', 'landmark', 'Lăng Ông Lê Văn Duyệt', 'Le Van Duyet Mausoleum', ['history', 'culture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-hcm-lanhong', 'tandinh'),
  p('hochiminh', 'binhtay', 'market', 'Chợ Bình Tây', 'Binh Tay Market', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 3, 12, 'sv-hcm-binhtay', 'thienhau'),
  p('hochiminh', 'lichsutp', 'museum', 'Bảo tàng Lịch sử TP.HCM', 'HCMC History Museum', ['history', 'education', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-hcm-lichsutp', 'nharong'),
  p('hochiminh', 'conrua', 'garden', 'Hồ Con Rùa', 'Turtle Lake', ['environment', 'culture'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hcm-conrua', 'tandinh'),
  p('hochiminh', 'jade', 'landmark', 'Chùa Ngọc Hoàng', 'Jade Emperor Pagoda', ['culture', 'festivals', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hcm-jade', 'thienhau'),
  p('hochiminh', 'khaitri', 'museum', 'Thư viện Khai Trí', 'Khai Tri Library', ['education', 'culture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hcm-khaitri', 'postoffice'),
  p('hochiminh', 'vincom', 'market', 'Vincom Đồng Khởi', 'Vincom Dong Khoi mall', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 10, 'sv-hcm-vincom', 'nguyenhue'),
  p('hochiminh', 'bxmiendong', 'station', 'Bến xe Miền Đông', 'Mien Dong bus station', ['tourism', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'cloze'], 3, 12, 'sv-hcm-bxmiendong', 'bitexco'),
  p('hochiminh', 'mymythuat', 'museum', 'Bảo tàng Mỹ thuật TP.HCM', 'HCMC Fine Arts Museum', ['art', 'culture', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-hcm-mymythuat', 'opera'),
  p('hochiminh', 'cong239', 'garden', 'Công viên 23/9', '23/9 Park', ['environment', 'leisure'], ['cloze', 'listen-pick', 'dictation'], 1, 9, 'sv-hcm-cong239', 'taodan'),
  p('hochiminh', 'bachdang', 'landmark', 'Bến Bạch Đằng', 'Bach Dang Wharf', ['tourism', 'architecture', 'listening-tourism-tours'], ['reply', 'listen-pick', 'dictation'], 2, 10, 'sv-hcm-bachdang', 'nharong'),
  p('hochiminh', 'vinhkhanh', 'restaurant', 'Phố ẩm thực Vĩnh Khánh', 'Vinh Khanh food street', ['food', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-hcm-vinhkhanh', 'comtam'),
  p('hochiminh', 'kimbien', 'market', 'Chợ Kim Biên', 'Kim Bien Market', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 3, 12, 'sv-hcm-kimbien', 'binhtay'),
  p('hochiminh', 'bunbo', 'restaurant', 'Quán bún bò Huế', 'Bun bo Hue stall', ['food', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 1, 8, 'sv-hcm-bunbo', 'phoshop'),
  p('hochiminh', 'banhxeo', 'restaurant', 'Quán bánh xèo', 'Banh xeo corner', ['food', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 1, 8, 'sv-hcm-banhxeo', 'cafesua'),
  p('hochiminh', 'chetrau', 'restaurant', 'Quán chè', 'Sweet soup stall', ['food', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 1, 8, 'sv-hcm-chetrau', 'banhmi'),
  p('hochiminh', 'trasua', 'cafe', 'Quán trà sữa', 'Milk tea shop', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'listen-pick'], 1, 8, 'sv-hcm-trasua', 'cafesua'),
  p('hochiminh', 'capheberu', 'cafe', 'Cà phê vỉa hè', 'Street-side coffee bench', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'dictation'], 1, 8, 'sv-hcm-capheberu', 'cafesua'),
  p('hochiminh', 'nhau', 'restaurant', 'Quán nhậu bia hơi', 'Beer hall', ['food', 'leisure', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 2, 9, 'sv-hcm-nhau', 'buivien'),
  p('hochiminh', 'sachcu', 'market', 'Hiệu sách cũ', 'Second-hand bookshop', ['education', 'shopping', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 9, 'sv-hcm-sachcu', 'vinhnghiem'),
  p('hochiminh', 'tapho', 'market', 'Tạp hoá đầu ngõ', 'Corner grocery', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 1, 8, 'sv-hcm-tapho', 'banhmi'),
  p('hochiminh', 'vang', 'market', 'Tiệm vàng', 'Gold shop', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'listen-pick'], 2, 9, 'sv-hcm-vang', 'benthanh'),
  p('hochiminh', 'thuocbac', 'market', 'Hiệu thuốc Bắc', 'Herbal medicine shop', ['culture', 'shopping'], ['reply', 'cloze', 'listen-pick'], 2, 9, 'sv-hcm-thuocbac', 'lanhong'),
  p('hochiminh', 'aodai', 'market', 'Tiệm may áo dài', 'Ao dai tailor', ['culture', 'shopping', 'reply-market'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-hcm-aodai', 'opera'),
  p('hochiminh', 'khachsan', 'hotel', 'Khách sạn mini', 'Mini hotel', ['housing', 'listening-accommodation', 'reply-hotel'], ['reply', 'cloze', 'order'], 1, 8, 'sv-hcm-khachsan', 'benthanh'),
  p('hochiminh', 'nhanghi', 'hotel', 'Nhà nghỉ phố Tây', 'Backpacker guesthouse', ['housing', 'reply-hotel'], ['reply', 'cloze', 'order'], 2, 9, 'sv-hcm-nhanghi', 'buivien'),
  p('hochiminh', 'benxe', 'station', 'Trạm xe buýt', 'Bus stop', ['tourism', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'cloze'], 1, 8, 'sv-hcm-benxe', 'nguyenhue'),
  p('hochiminh', 'chohoa', 'market', 'Chợ hoa', 'Flower market', ['environment', 'shopping', 'reply-market'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-hcm-chohoa', 'nguyenhue'),
  p('hochiminh', 'rapchieu', 'landmark', 'Rạp chiếu phim', 'Cinema', ['art', 'leisure', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hcm-rapchieu', 'opera'),
  p('hochiminh', 'caphetb', 'cafe', 'Quán cà phê Tân Bình', 'Tan Binh coffee shop', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'listen-pick'], 1, 8, 'sv-hcm-caphetb', 'thuocbac'),
  p('hochiminh', 'comnhat', 'restaurant', 'Quán cơm bình dân', 'Cheap rice shop', ['food', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 1, 8, 'sv-hcm-comnhat', 'vinhkhanh'),
  p('hochiminh', 'phoga', 'restaurant', 'Phở Gà Ông Tư', 'Ong Tu chicken pho', ['food', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 1, 8, 'sv-hcm-phoga', 'benthanh'),
  p('hochiminh', 'phobo', 'restaurant', 'Phở Bò Tái Anh Hai', 'Anh Hai rare beef pho', ['food', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 1, 8, 'sv-hcm-phobo', 'nguyenhue'),
  p('hochiminh', 'bunmam', 'restaurant', 'Bún Mắm Cô Ba', 'Co Ba fermented fish noodles', ['food', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 2, 9, 'sv-hcm-bunmam', 'comtam'),
  p('hochiminh', 'bunrieu', 'restaurant', 'Bún Riêu Cua Đồng', 'Field crab noodle soup', ['food', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 1, 8, 'sv-hcm-bunrieu', 'banhmi'),
  p('hochiminh', 'hutieu', 'restaurant', 'Hủ Tiếu Nam Vang', 'Phnom Penh hu tieu', ['food', 'reply-restaurant'], ['reply', 'cloze', 'translate'], 1, 8, 'sv-hcm-hutieu', 'cafesua'),
  p('hochiminh', 'comga', 'restaurant', 'Cơm Gà Xối Mỡ Chú Bảy', 'Chu Bay crispy chicken rice', ['food', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 1, 8, 'sv-hcm-comga', 'phoshop'),
  p('hochiminh', 'bunthit', 'restaurant', 'Bún Thịt Nướng Chị Mai', 'Chi Mai grilled pork noodles', ['food', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 1, 8, 'sv-hcm-bunthit', 'buivien'),
  p('hochiminh', 'banhcuon', 'restaurant', 'Bánh Cuốn Nóng', 'Hot steamed rice rolls', ['food', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 1, 8, 'sv-hcm-banhcuon', 'notredame'),
  p('hochiminh', 'banhcanh', 'restaurant', 'Bánh Canh Cua Bến Tre', 'Ben Tre crab noodle soup', ['food', 'reply-restaurant'], ['reply', 'cloze', 'translate'], 2, 9, 'sv-hcm-banhcanh', 'postoffice'),
  p('hochiminh', 'chaolong', 'restaurant', 'Cháo Lòng Bà Sáu', 'Ba Sau offal porridge', ['food', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 1, 7, 'sv-hcm-chaolong', 'vinhkhanh'),
  p('hochiminh', 'banhbeo', 'restaurant', 'Bánh Bèo Chén Huế', 'Hue water fern cakes', ['food', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 1, 7, 'sv-hcm-banhbeo', 'binhtay'),
  p('hochiminh', 'xoi', 'restaurant', 'Xôi Mặn Chị Hằng', 'Chi Hang savory sticky rice', ['food', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 1, 7, 'sv-hcm-xoi', 'tandinh'),
  p('hochiminh', 'banhbao', 'restaurant', 'Bánh Bao Bà Tư', 'Ba Tu steamed buns', ['food', 'reply-restaurant'], ['reply', 'cloze', 'translate'], 1, 7, 'sv-hcm-banhbao', 'vinhnghiem'),
  p('hochiminh', 'nuongtam', 'restaurant', 'Quán Nướng Anh Ba', 'Anh Ba grill house', ['food', 'leisure', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 2, 9, 'sv-hcm-nuongtam', 'taodan'),
  p('hochiminh', 'lau', 'restaurant', 'Lẩu Bò Nhà Lá', 'Leaf-house beef hotpot', ['food', 'leisure', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 2, 9, 'sv-hcm-lau', 'benthanh'),
  p('hochiminh', 'oc', 'restaurant', 'Ốc Nướng Dì Tám', 'Aunt Tam grilled snails', ['food', 'leisure', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 1, 8, 'sv-hcm-oc', 'nguyenhue'),
  p('hochiminh', 'cafevot', 'cafe', 'Cà Phê Vợt Chú Hải', 'Chu Hai sock coffee', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'listen-pick'], 1, 8, 'sv-hcm-cafevot', 'comtam'),
  p('hochiminh', 'caphetrung', 'cafe', 'Cà Phê Trứng Phố Cũ', 'Old quarter egg coffee', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'dictation'], 1, 8, 'sv-hcm-caphetrung', 'banhmi'),
  p('hochiminh', 'sinhto', 'cafe', 'Sinh Tố Mẹ Bông', 'Mother Bong smoothies', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'listen-pick'], 1, 7, 'sv-hcm-sinhto', 'cafesua'),
  p('hochiminh', 'nuocmia', 'cafe', 'Nước Mía Chú Bây', 'Chu Bay sugarcane juice', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'listen-pick'], 1, 7, 'sv-hcm-nuocmia', 'phoshop'),
  p('hochiminh', 'nuocep', 'cafe', 'Nước Ép Bảy Lý', 'Bay Ly juice bar', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'dictation'], 1, 7, 'sv-hcm-nuocep', 'buivien'),
  p('hochiminh', 'kem', 'cafe', 'Kem Xe Chú Tư', 'Chu Tu ice cream cart', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'listen-pick'], 1, 7, 'sv-hcm-kem', 'notredame'),
  p('hochiminh', 'banhflan', 'cafe', 'Bánh Flan Cô Huệ', 'Co Hue caramel custard', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'translate'], 1, 7, 'sv-hcm-banhflan', 'postoffice'),
  p('hochiminh', 'suadau', 'cafe', 'Sữa Đậu Nành Bà Bốn', 'Ba Bon soy milk', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'listen-pick'], 1, 7, 'sv-hcm-suadau', 'vinhkhanh'),
  p('hochiminh', 'banhngot', 'cafe', 'Bánh Ngọt Nhà Lý', 'Ly family bakery', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'dictation'], 2, 9, 'sv-hcm-banhngot', 'binhtay'),
  p('hochiminh', 'tratiem', 'cafe', 'Trà Nhà Bạch', 'Bach House tea', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'listen-pick'], 2, 9, 'sv-hcm-tratiem', 'tandinh'),
  p('hochiminh', 'banhtrang', 'restaurant', 'Bánh Tráng Trộn Bé Hai', 'Be Hai rice paper salad', ['food', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 1, 7, 'sv-hcm-banhtrang', 'vinhnghiem'),
  p('hochiminh', 'vitquay', 'restaurant', 'Vịt Quay Năm Tâm', 'Nam Tam roast duck', ['food', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 2, 9, 'sv-hcm-vitquay', 'taodan'),
  p('hochiminh', 'haisan', 'restaurant', 'Hải Sản Biển Đông', 'East Sea seafood', ['food', 'leisure', 'reply-restaurant'], ['reply', 'cloze', 'translate'], 2, 10, 'sv-hcm-haisan', 'benthanh'),
  p('hochiminh', 'bialo', 'restaurant', 'Bia Hơi Góc Phố', 'Corner-street draft beer', ['food', 'leisure', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 2, 9, 'sv-hcm-bialo', 'nguyenhue'),
  p('hochiminh', 'nonla', 'market', 'Nón Lá Bà Tứ', 'Ba Tu conical hats', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 1, 8, 'sv-hcm-nonla', 'comtam'),
  p('hochiminh', 'tranhtiem', 'market', 'Tiệm Tranh Sài Gòn', 'Saigon painting shop', ['shopping', 'culture', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 9, 'sv-hcm-tranhtiem', 'banhmi'),
  p('hochiminh', 'giaydep', 'market', 'Giày Dép Anh Tài', 'Anh Tai shoes and sandals', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'listen-pick'], 1, 8, 'sv-hcm-giaydep', 'cafesua'),
  p('hochiminh', 'quanao', 'market', 'Thời Trang Hà My', 'Ha My boutique', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 9, 'sv-hcm-quanao', 'phoshop'),
  p('hochiminh', 'suaxe', 'market', 'Sửa Xe Anh Bé', 'Anh Be motorbike repair', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'listen-pick'], 2, 9, 'sv-hcm-suaxe', 'buivien'),
  p('hochiminh', 'tiemanh', 'market', 'Chụp Ảnh Ngọc Diệp', 'Ngoc Diep photo studio', ['shopping', 'art', 'reply-market'], ['reply', 'cloze', 'dictation'], 2, 9, 'sv-hcm-tiemanh', 'notredame'),
  p('hochiminh', 'dienthoai', 'market', 'Điện Thoại Phúc Long', 'Phuc Long phone shop', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 9, 'sv-hcm-dienthoai', 'postoffice'),
  p('hochiminh', 'nhasach', 'market', 'Nhà Sách Đức Nhuận', 'Duc Nhuan bookshop', ['education', 'shopping', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 9, 'sv-hcm-nhasach', 'vinhkhanh'),
  p('hochiminh', 'cattoc', 'market', 'Tiệm Cắt Tóc Anh Nam', 'Anh Nam barbershop', ['shopping', 'reply-market'], ['reply', 'cloze', 'listen-pick'], 1, 8, 'sv-hcm-cattoc', 'binhtay'),
  p('hochiminh', 'nhathuoc', 'market', 'Nhà Thuốc Bình An', 'Binh An pharmacy', ['housing', 'shopping', 'reply-market'], ['reply', 'cloze', 'dictation'], 2, 9, 'sv-hcm-nhathuoc', 'tandinh'),
  p('hochiminh', 'minimart', 'market', 'Mini Mart Sài Gòn', 'Saigon mini mart', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 1, 8, 'sv-hcm-minimart', 'vinhnghiem'),
  p('hochiminh', 'trongiam', 'market', 'Gốm Sứ Bình Dương', 'Binh Duong pottery', ['culture', 'shopping', 'reply-market'], ['reply', 'cloze', 'listen-pick'], 2, 9, 'sv-hcm-trongiam', 'taodan'),
  p('hochiminh', 'nhatro', 'hotel', 'Nhà Nghỉ Bình Minh', 'Binh Minh guesthouse', ['housing', 'listening-accommodation', 'reply-hotel'], ['reply', 'cloze', 'order'], 1, 8, 'sv-hcm-nhatro', 'benthanh'),
  p('hochiminh', 'kara', 'landmark', 'Karaoke Đêm Vàng', 'Golden Night karaoke', ['leisure', 'art', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hcm-kara', 'nguyenhue'),
  p('hochiminh', 'caphesantuong', 'cafe', 'Cà phê sân thượng', 'Rooftop coffee', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'listen-pick'], 1, 8, 'sv-hcm-caphesantuong', 'cafesua'),
  p('hochiminh', 'chothinghe', 'market', 'Chợ Thị Nghè', 'Thi Nghe Market', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 10, 'sv-hcm-chothinghe', 'tandinh'),
  p('hochiminh', 'bachkhoa', 'landmark', 'Đại học Bách Khoa', 'HCMC University of Technology', ['education', 'architecture', 'reply-directions'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-hcm-bachkhoa', 'lichsutp'),
  p('hochiminh', 'quanoc', 'restaurant', 'Quán ốc', 'Snail eatery', ['food', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 1, 8, 'sv-hcm-quanoc', 'vinhkhanh'),
  p('hochiminh', 'comtam10', 'restaurant', 'Quán cơm tấm Quận 10', 'District 10 broken-rice shop', ['food', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 1, 8, 'sv-hcm-comtam10', 'comtam'),
  p('hochiminh', 'giatla', 'market', 'Tiệm giặt là', 'Laundry shop', ['housing', 'shopping', 'reply-market'], ['reply', 'cloze', 'translate'], 1, 8, 'sv-hcm-giatla', 'nhanghi'),
  p('hochiminh', 'quannhau', 'restaurant', 'Quán nhậu Nguyễn Trãi', 'Nguyen Trai beer shop', ['food', 'leisure', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 2, 9, 'sv-hcm-quannhau', 'nhau'),
];

const DANANG: PoiContent[] = [
  // Mảnh A (trung tâm bên sông Hàn). Sân bay, Hội An, Sơn Trà, Bà Nà, mỹ khê... vào cùng các mảnh E/S/SE.
  p('danang', 'gate', 'airport', 'Sân bay Đà Nẵng — cổng lên máy bay', 'Da Nang Airport — boarding gate', [], [], 1, 0, undefined, undefined, { action: 'gate' }),
  p('danang', 'chohan', 'market', 'Chợ Hàn', 'Han Market', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 1, 9, 'sv-dn-han'),
  p('danang', 'miquang', 'restaurant', 'Quán mì Quảng', 'Mì Quảng eatery', ['food', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 1, 9, 'sv-dn-miquang', 'chohan'),
  p('danang', 'beachbar', 'cafe', 'Quán cà phê bên biển', 'Seaside café', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'listen-pick'], 1, 9, 'sv-dn-shell', 'miquang'),
  p('danang', 'dragonbridge', 'landmark', 'Cầu Rồng', 'Dragon Bridge', ['tourism', 'listening-tourism-tours', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-dn-dragon', 'chohan'),
  p('danang', 'cham', 'museum', 'Bảo tàng Điêu khắc Chăm', 'Cham Sculpture Museum', ['history', 'culture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-dn-cham', 'dragonbridge'),
  p('danang', 'ladybuddha', 'landmark', 'Tượng Phật Bà Lady Buddha', 'Lady Buddha statue', ['culture', 'festivals', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 11, 'sv-dn-lady', 'cham'),
  p('danang', 'nguhanhson', 'landmark', 'Ngũ Hành Sơn', 'Marble Mountains', ['culture', 'history', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 11, 'sv-dn-marble', 'dragonbridge'),
  p('danang', 'hoianhouse', 'museum', 'Nhà cổ Hội An', 'Hoi An old house', ['culture', 'history', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 11, 'sv-dn-silk', 'nguhanhson'),
  p('danang', 'hoiancafe', 'cafe', 'Quán cà phê Hội An', 'Hoi An courtyard café', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-dn-lantern', 'hoianhouse'),
  p('danang', 'caolau', 'restaurant', 'Quán cao lầu', 'Cao lầu noodle house', ['food', 'reply-restaurant', 'listening-shopping-services'], ['reply', 'cloze', 'order'], 2, 10, 'sv-dn-caolau', 'hoianhouse'),
  p('danang', 'japanbridge', 'landmark', 'Chùa Cầu', 'Japanese Covered Bridge', ['architecture', 'history', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 11, 'sv-dn-japan', 'hoiancafe'),
  p('danang', 'ponagar', 'landmark', 'Tháp Chăm cổ', 'Ancient Cham tower', ['history', 'culture', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 3, 12, 'sv-dn-tower', 'japanbridge'),
  p('danang', 'seafood', 'restaurant', 'Nhà hàng hải sản', 'Seafood restaurant', ['food', 'reply-restaurant', 'festivals'], ['reply', 'cloze', 'order'], 2, 10, 'sv-dn-crab', 'beachbar'),
  p('danang', 'resort', 'hotel', 'Khu nghỉ dưỡng bên biển', 'Beach resort', ['housing', 'listening-accommodation', 'reply-hotel'], ['reply', 'cloze', 'order'], 2, 10, 'sv-dn-resortkey', 'seafood'),
  p('danang', 'sontra', 'garden', 'Bán đảo Sơn Trà', 'Son Tra Peninsula', ['environment', 'agriculture'], ['cloze', 'listen-pick', 'translate'], 2, 11, 'sv-dn-langur', 'resort'),
  p('danang', 'banahills', 'station', 'Cáp treo Bà Nà Hills', 'Ba Na Hills cable car', ['transport', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'order'], 3, 12, 'sv-dn-cablecar', 'sontra'),
  p('danang', 'goldenbridge', 'landmark', 'Cầu Vàng', 'Golden Bridge', ['tourism', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 2, 12, 'sv-dn-golden', 'nguhanhson'),
];

const TOKYO: PoiContent[] = [
  p('tokyo', 'gate', 'airport', 'Sân bay Haneda — cổng lên máy bay', 'Haneda Airport — boarding gate', [], [], 3, 0, undefined, undefined, { action: 'gate' }),
  p('tokyo', 'shibuya', 'landmark', 'Ngã tư Shibuya', 'Shibuya Crossing', ['tourism', 'transport', 'reply-directions'], ['reply', 'listen-pick', 'dictation'], 3, 13, 'sv-tokyo', undefined, { questions: 8 }),
  p('tokyo', 'sensoji', 'landmark', 'Chùa Sensō-ji', 'Sensō-ji Temple', ['culture', 'history', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 13, undefined, 'shibuya'),
  p('tokyo', 'tsukiji', 'market', 'Chợ Tsukiji', 'Tsukiji Market', ['food', 'shopping', 'reply-market'], ['reply', 'cloze', 'translate'], 3, 12, undefined, 'sensoji'),
  p('tokyo', 'ramen', 'restaurant', 'Quán ramen nhỏ', 'Ramen shop', ['food', 'reply-restaurant'], ['reply', 'cloze', 'order'], 3, 12, undefined, 'tsukiji'),
  p('tokyo', 'shinjuku', 'station', 'Ga Shinjuku', 'Shinjuku Station', ['transport', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'order'], 3, 12, undefined, 'ramen'),
];

const SEOUL: PoiContent[] = [
  p('seoul', 'gate', 'airport', 'Sân bay Incheon — cổng lên máy bay', 'Incheon Airport — boarding gate', [], [], 3, 0, undefined, undefined, { action: 'gate' }),
  p('seoul', 'gyeongbokgung', 'landmark', 'Cung Gyeongbokgung', 'Gyeongbokgung Palace', ['history', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 13, 'sv-seoul', undefined, { questions: 8 }),
  p('seoul', 'bukchon', 'landmark', 'Làng nhà hanok Bukchon', 'Bukchon Hanok Village', ['culture', 'housing', 'reply-directions'], ['reply', 'cloze', 'listen-pick'], 3, 12, undefined, 'gyeongbokgung'),
  p('seoul', 'gwangjang', 'market', 'Chợ Gwangjang', 'Gwangjang Market', ['food', 'shopping', 'reply-market'], ['reply', 'cloze', 'translate'], 3, 12, undefined, 'bukchon'),
  p('seoul', 'hongdae', 'cafe', 'Quán cà phê Hongdae', 'Hongdae café', ['food', 'leisure', 'reply-cafe'], ['reply', 'cloze', 'dictation'], 3, 11, undefined, 'gwangjang'),
  p('seoul', 'station', 'station', 'Ga Seoul', 'Seoul Station', ['transport', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'order'], 3, 12, undefined, 'hongdae'),
];

const NEWYORK: PoiContent[] = [
  p('newyork', 'gate', 'airport', 'Sân bay JFK — cổng lên máy bay', 'JFK Airport — boarding gate', [], [], 3, 0, undefined, undefined, { action: 'gate' }),
  p('newyork', 'timessquare', 'landmark', 'Quảng trường Times', 'Times Square', ['tourism', 'transport', 'reply-directions'], ['reply', 'listen-pick', 'dictation'], 3, 13, 'sv-newyork', undefined, { questions: 8 }),
  p('newyork', 'centralpark', 'garden', 'Công viên Central Park', 'Central Park', ['environment', 'leisure'], ['cloze', 'listen-pick', 'translate'], 3, 12, undefined, 'timessquare'),
  p('newyork', 'metmuseum', 'museum', 'Bảo tàng Nghệ thuật Metropolitan', 'The Metropolitan Museum of Art', ['art', 'history', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 13, undefined, 'centralpark'),
  p('newyork', 'brooklynpizza', 'restaurant', 'Tiệm pizza Brooklyn', 'Brooklyn pizzeria', ['food', 'reply-restaurant'], ['reply', 'cloze', 'order'], 3, 12, undefined, 'metmuseum'),
  p('newyork', 'subway', 'station', 'Ga tàu điện ngầm', 'Subway station', ['transport', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'order'], 3, 12, undefined, 'brooklynpizza'),
];

const ISTANBUL: PoiContent[] = [
  p('istanbul', 'gate', 'airport', 'Sân bay Istanbul — cổng lên máy bay', 'Istanbul Airport — boarding gate', [], [], 3, 0, undefined, undefined, { action: 'gate' }),
  p('istanbul', 'hagia', 'landmark', 'Nhà thờ Hồi giáo Hagia Sophia', 'Hagia Sophia Grand Mosque', ['history', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 13, 'sv-istanbul', undefined, { questions: 8 }),
  p('istanbul', 'grandbazaar', 'market', 'Chợ Grand Bazaar', 'Grand Bazaar', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 3, 12, undefined, 'hagia'),
  p('istanbul', 'spicebazaar', 'market', 'Chợ Gia vị', 'Spice Bazaar', ['food', 'shopping', 'reply-market'], ['reply', 'cloze', 'dictation'], 3, 12, undefined, 'grandbazaar'),
  p('istanbul', 'ferry', 'station', 'Bến phà Eminönü', 'Eminönü ferry pier', ['transport', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'order'], 3, 12, undefined, 'spicebazaar'),
  p('istanbul', 'lokanta', 'restaurant', 'Quán lokanta ven eo biển', 'Bosphorus lokanta', ['food', 'reply-restaurant'], ['reply', 'cloze', 'order'], 3, 12, undefined, 'ferry'),
];

const CAIRO: PoiContent[] = [
  p('cairo', 'gate', 'airport', 'Sân bay Cairo — cổng lên máy bay', 'Cairo Airport — boarding gate', [], [], 3, 0, undefined, undefined, { action: 'gate' }),
  p('cairo', 'giza', 'landmark', 'Quần thể Kim tự tháp Giza', 'Giza Pyramid Complex', ['history', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 14, 'sv-cairo', undefined, { questions: 8 }),
  p('cairo', 'egyptianmuseum', 'museum', 'Bảo tàng Ai Cập', 'The Egyptian Museum', ['history', 'art', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 13, undefined, 'giza'),
  p('cairo', 'khanelkhalili', 'market', 'Chợ Khan el-Khalili', 'Khan el-Khalili Bazaar', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 3, 12, undefined, 'egyptianmuseum'),
  p('cairo', 'nilepier', 'station', 'Bến thuyền sông Nile', 'Nile felucca pier', ['transport', 'listening-tourism-tours', 'reply-directions'], ['reply', 'listen-pick', 'order'], 3, 12, undefined, 'khanelkhalili'),
  p('cairo', 'koshary', 'restaurant', 'Quán koshary', 'Koshary restaurant', ['food', 'reply-restaurant'], ['reply', 'cloze', 'order'], 3, 11, undefined, 'nilepier'),
];

const SYDNEY: PoiContent[] = [
  p('sydney', 'gate', 'airport', 'Sân bay Sydney — cổng lên máy bay', 'Sydney Airport — boarding gate', [], [], 3, 0, undefined, undefined, { action: 'gate' }),
  p('sydney', 'operahouse', 'landmark', 'Nhà hát Opera Sydney', 'Sydney Opera House', ['art', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 14, 'sv-sydney', undefined, { questions: 8 }),
  p('sydney', 'harbourbridge', 'landmark', 'Cầu Harbour', 'Sydney Harbour Bridge', ['transport', 'tourism', 'reply-directions'], ['reply', 'listen-pick', 'dictation'], 3, 13, undefined, 'operahouse'),
  p('sydney', 'bondi', 'garden', 'Bãi biển Bondi', 'Bondi Beach', ['environment', 'leisure'], ['cloze', 'listen-pick', 'translate'], 3, 12, undefined, 'harbourbridge'),
  p('sydney', 'circularquay', 'station', 'Bến phà Circular Quay', 'Circular Quay ferry terminal', ['transport', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'order'], 3, 12, undefined, 'bondi'),
  p('sydney', 'fishmarket', 'market', 'Chợ cá Sydney', 'Sydney Fish Market', ['food', 'shopping', 'reply-market'], ['reply', 'cloze', 'translate'], 3, 12, undefined, 'circularquay'),
];

const MEXICOCITY: PoiContent[] = [
  p('mexicocity', 'gate', 'airport', 'Sân bay Benito Juárez — cổng lên máy bay', 'Benito Juárez Airport — boarding gate', [], [], 3, 0, undefined, undefined, { action: 'gate' }),
  p('mexicocity', 'zocalo', 'landmark', 'Quảng trường Zócalo', 'Zócalo main square', ['history', 'architecture', 'reply-directions'], ['reply', 'cloze', 'listen-pick'], 3, 13, 'sv-mexicocity', undefined, { questions: 8 }),
  p('mexicocity', 'fridamuseum', 'museum', 'Bảo tàng Frida Kahlo', 'Frida Kahlo Museum', ['art', 'culture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 13, undefined, 'zocalo'),
  p('mexicocity', 'coyoacan', 'market', 'Chợ Coyoacán', 'Coyoacán Market', ['shopping', 'food', 'reply-market'], ['reply', 'cloze', 'translate'], 3, 12, undefined, 'fridamuseum'),
  p('mexicocity', 'taqueria', 'restaurant', 'Quán taquería', 'Neighborhood taquería', ['food', 'reply-restaurant'], ['reply', 'cloze', 'order'], 3, 12, undefined, 'coyoacan'),
  p('mexicocity', 'chapultepec', 'garden', 'Công viên Chapultepec', 'Chapultepec Park', ['environment', 'leisure'], ['cloze', 'listen-pick', 'translate'], 3, 12, undefined, 'taqueria'),
];

const RIO: PoiContent[] = [
  p('rio', 'gate', 'airport', 'Sân bay Galeão — cổng lên máy bay', 'Galeão Airport — boarding gate', [], [], 3, 0, undefined, undefined, { action: 'gate' }),
  p('rio', 'christ', 'landmark', 'Tượng Chúa Cứu Thế', 'Christ the Redeemer', ['culture', 'tourism', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 14, 'sv-rio', undefined, { questions: 8 }),
  p('rio', 'copacabana', 'garden', 'Bãi biển Copacabana', 'Copacabana Beach', ['environment', 'leisure'], ['cloze', 'listen-pick', 'translate'], 3, 12, undefined, 'christ'),
  p('rio', 'selaron', 'landmark', 'Cầu thang Escadaria Selarón', 'Escadaria Selarón steps', ['art', 'culture', 'reply-directions'], ['reply', 'cloze', 'dictation'], 3, 12, undefined, 'copacabana'),
  p('rio', 'feira', 'market', 'Hội chợ cuối tuần', 'Weekend feira', ['shopping', 'food', 'reply-market'], ['reply', 'cloze', 'translate'], 3, 12, undefined, 'selaron'),
  p('rio', 'botafogo', 'cafe', 'Quán cà phê Botafogo', 'Botafogo café', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'dictation'], 3, 11, undefined, 'feira'),
];

const CAPETOWN: PoiContent[] = [
  p('capetown', 'gate', 'airport', 'Sân bay Cape Town — cổng lên máy bay', 'Cape Town Airport — boarding gate', [], [], 3, 0, undefined, undefined, { action: 'gate' }),
  p('capetown', 'tablemountain', 'landmark', 'Núi Bàn', 'Table Mountain', ['environment', 'tourism', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 14, 'sv-capetown', undefined, { questions: 8 }),
  p('capetown', 'bokaap', 'landmark', 'Khu Bo-Kaap', 'Bo-Kaap', ['culture', 'architecture', 'reply-directions'], ['reply', 'cloze', 'dictation'], 3, 12, undefined, 'tablemountain'),
  p('capetown', 'waterfront', 'market', 'Chợ V&A Waterfront', 'V&A Waterfront market', ['shopping', 'food', 'reply-market'], ['reply', 'cloze', 'translate'], 3, 12, undefined, 'bokaap'),
  p('capetown', 'boulders', 'garden', 'Bãi biển Boulders', 'Boulders Beach', ['environment', 'animals'], ['cloze', 'listen-pick', 'translate'], 3, 12, undefined, 'waterfront'),
  p('capetown', 'robben', 'museum', 'Bảo tàng đảo Robben', 'Robben Island Museum', ['history', 'education', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 13, undefined, 'boulders'),
];

const MARRAKECH: PoiContent[] = [
  p('marrakech', 'gate', 'airport', 'Sân bay Marrakech — cổng lên máy bay', 'Marrakech Airport — boarding gate', [], [], 3, 0, undefined, undefined, { action: 'gate' }),
  p('marrakech', 'jemaa', 'market', 'Quảng trường Jemaa el-Fnaa', 'Jemaa el-Fnaa square', ['culture', 'food', 'reply-market'], ['reply', 'cloze', 'listen-pick'], 3, 14, 'sv-marrakech', undefined, { questions: 8 }),
  p('marrakech', 'bahia', 'landmark', 'Cung điện Bahia', 'Bahia Palace', ['history', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 13, undefined, 'jemaa'),
  p('marrakech', 'majorelle', 'garden', 'Vườn Majorelle', 'Majorelle Garden', ['environment', 'art', 'leisure'], ['cloze', 'listen-pick', 'translate'], 3, 12, undefined, 'bahia'),
  p('marrakech', 'riad', 'hotel', 'Riad trong khu medina', 'Medina riad', ['housing', 'listening-accommodation', 'reply-hotel'], ['reply', 'cloze', 'order'], 3, 12, undefined, 'majorelle'),
  p('marrakech', 'tagine', 'restaurant', 'Quán tagine', 'Tagine restaurant', ['food', 'reply-restaurant'], ['reply', 'cloze', 'order'], 3, 12, undefined, 'riad'),
];

const SHANGHAI: PoiContent[] = [
  p('shanghai', 'gate', 'airport', 'Sân bay Phố Đông — cổng lên máy bay', 'Pudong Airport — boarding gate', [], [], 2, 0, undefined, undefined, { action: 'gate' }),
  p('shanghai', 'bund', 'landmark', 'Bến Thượng Hải', 'The Bund', ['history', 'architecture', 'tourism', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 2, 12, 'sv-sh-pearl', undefined, { questions: 8 }),
  p('shanghai', 'pearltower', 'landmark', 'Tháp Đông Phương Minh Châu', 'Oriental Pearl Tower', ['tourism', 'listening-tourism-tours', 'reply-tickets'], ['reply', 'listen-pick', 'cloze'], 2, 12, undefined, 'bund'),
  p('shanghai', 'yuyuan', 'garden', 'Vườn Dự Viên & Cầu Cửu Khúc', 'Yuyuan Garden', ['culture', 'environment', 'weather-climate'], ['cloze', 'listen-pick', 'translate'], 2, 11, 'sv-sh-tea', 'bund'),
  p('shanghai', 'xiaolongbao', 'restaurant', 'Tiệm Bánh Bao Nam Tường', 'Nanxiang Xiaolongbao', ['food', 'listening-shopping-services', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-sh-dumpling', 'yuyuan'),
  p('shanghai', 'nanjing', 'market', 'Phố đi bộ Nam Kinh', 'Nanjing Road Pedestrian Street', ['shopping', 'money', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 11, undefined, 'xiaolongbao'),
  p('shanghai', 'station', 'station', 'Ga Tàu Lục Gia Chủy & Maglev', 'Lujiazui Station & Maglev', ['transport', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'order'], 2, 11, undefined, 'pearltower'),
];

export const POI_CATALOG: PoiContent[] = [...HANOI, ...SINGAPORE, ...LONDON, ...PARIS, ...AMSTERDAM, ...ROME, ...HOCHIMINH, ...DANANG, ...TOKYO, ...SEOUL, ...NEWYORK, ...ISTANBUL, ...CAIRO, ...SYDNEY, ...MEXICOCITY, ...RIO, ...CAPETOWN, ...MARRAKECH, ...SHANGHAI];

const BY_ID = new Map(POI_CATALOG.map((x) => [x.id, x]));

export function getPoiContent(id: string): PoiContent | undefined {
  return BY_ID.get(id);
}

export function poisOfCity(city: CityId): PoiContent[] {
  return POI_CATALOG.filter((x) => x.city === city);
}

/** Địa điểm tính vào tiến độ thành phố: có lượt hỏi, không phải ô bí mật. */
export function mainPoisOfCity(city: CityId): PoiContent[] {
  return POI_CATALOG.filter((x) => x.city === city && x.kind !== 'secret' && !x.action);
}

export function cityOfPoi(poiId: string): CityId | undefined {
  return BY_ID.get(poiId)?.city;
}
