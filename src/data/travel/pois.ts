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
  p('hanoi', 'flowers', 'market', 'Chợ hoa', 'Flower market', ['agriculture', 'shopping', 'reply-market'], ['reply', 'cloze', 'translate'], 1, 8, 'sv-hn-flowers', 'dongxuan'),
  p('hanoi', 'biahoi', 'restaurant', 'Quán bia hơi', 'Bia hơi corner', ['food', 'festivals', 'reply-restaurant'], ['reply', 'cloze', 'order'], 2, 9, 'sv-hn-beer', 'buncha'),
  p('hanoi', 'puppet', 'museum', 'Nhà hát múa rối nước', 'Water puppet theatre', ['culture', 'art', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 10, 'sv-hn-puppet', 'thaprua'),
  p('hanoi', 'opera', 'museum', 'Nhà hát Lớn', 'Opera House', ['art', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-hn-opera', 'vanmieu'),
  p('hanoi', 'doanmon', 'museum', 'Hoàng thành Thăng Long', 'Thang Long Imperial Citadel', ['history', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 11, 'sv-hn-citadel', 'opera'),
  p('hanoi', 'tranquoc', 'landmark', 'Chùa Trấn Quốc', 'Tran Quoc Pagoda', ['culture', 'festivals', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 2, 11, 'sv-hn-pagoda', 'motcot'),
  p('hanoi', 'longbien', 'landmark', 'Cầu Long Biên', 'Long Bien Bridge', ['history', 'transport', 'listening-history-architecture'], ['cloze', 'listen-pick', 'dictation'], 2, 11, 'sv-hn-bridge', 'doanmon'),
  p('hanoi', 'mausoleum', 'landmark', 'Lăng Chủ tịch Hồ Chí Minh', 'Ho Chi Minh Mausoleum', ['history', 'tourism', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-hn-mausoleum', 'tranquoc'),
  p('hanoi', 'motcot', 'landmark', 'Chùa Một Cột', 'One Pillar Pagoda', ['tourism', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-hn-pillar', 'vanmieu'),
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

export const POI_CATALOG: PoiContent[] = [...HANOI, ...SINGAPORE, ...LONDON, ...PARIS, ...AMSTERDAM, ...ROME, ...HOCHIMINH, ...DANANG];

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
