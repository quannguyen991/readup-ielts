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
  p('hanoi', 'counter', 'counter', 'Quầy đổi vé', 'Ticket counter', [], [], 1, 0, undefined, undefined, { action: 'customs' }),
  p('hanoi', 'gate', 'airport', 'Cổng lên máy bay', 'Boarding gate', [], [], 1, 0, undefined, undefined, { action: 'gate' }),
  p('hanoi', 'pho', 'restaurant', 'Quán phở', 'Phở stall', ['food', 'reply-restaurant'], ['reply', 'cloze', 'listen-pick'], 1, 6, 'sv-hn-pho'),
  p('hanoi', 'board', 'station', 'Bảng chuyến bay', 'Flight board', ['listening-numbers-dates-money', 'listening-travel-booking'], ['listen-pick', 'cloze', 'dictation'], 1, 6, 'sv-hn-ticket', 'pho'),
];

const SINGAPORE: PoiContent[] = [
  p('singapore', 'changi', 'airport', 'Sân bay Changi', 'Changi Airport', ['listening-personal-details', 'listening-numbers-dates-money', 'reply-airport'], ['reply', 'listen-pick', 'cloze'], 1, 8, 'sv-sg-boarding'),
  p('singapore', 'mrt', 'station', 'Tàu điện MRT', 'MRT station', ['listening-directions-maps', 'transport', 'reply-directions'], ['reply', 'listen-pick', 'order'], 1, 8, 'sv-sg-mrt', 'changi'),
  p('singapore', 'hotel', 'hotel', 'Khách sạn', 'Hotel', ['listening-accommodation', 'housing', 'reply-hotel'], ['reply', 'cloze', 'order'], 1, 8, 'sv-sg-key', 'changi'),
  p('singapore', 'hawker', 'restaurant', 'Khu ăn vặt Hawker', 'Hawker centre', ['food', 'listening-shopping-services', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 1, 9, 'sv-sg-rice', 'mrt'),
  p('singapore', 'gardens', 'garden', 'Gardens by the Bay', 'Gardens by the Bay', ['environment', 'weather-climate'], ['cloze', 'listen-pick', 'translate'], 1, 10, 'sv-sg-orchid', 'hotel'),
  p('singapore', 'mbs', 'landmark', 'Marina Bay Sands', 'Marina Bay Sands', ['tourism', 'listening-tourism-tours', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 2, 12, 'sv-sg-mbs', 'hawker'),
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
];

const PARIS: PoiContent[] = [
  p('paris', 'station', 'station', 'Ga Paris', 'Paris station', ['transport', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'order'], 2, 10, 'sv-pr-ticket'),
  p('paris', 'cafe', 'cafe', 'Quán cà phê vỉa hè', 'Pavement café', ['food', 'reply-cafe'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-pr-croissant', 'station'),
  p('paris', 'louvre', 'museum', 'Bảo tàng Louvre', 'The Louvre', ['art', 'culture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-pr-pyramid', 'station'),
  p('paris', 'boutique', 'market', 'Cửa hàng thời trang', 'Fashion boutique', ['fashion', 'shopping', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 11, 'sv-pr-scarf', 'cafe'),
  p('paris', 'bistro', 'restaurant', 'Nhà hàng bistro', 'Bistro', ['food', 'festivals', 'reply-restaurant'], ['reply', 'cloze', 'order'], 3, 12, 'sv-pr-macaron', 'louvre'),
  p('paris', 'eiffel', 'landmark', 'Tháp Eiffel', 'Eiffel Tower', ['tourism', 'culture', 'reply-tickets'], ['reply', 'cloze', 'dictation'], 3, 14, 'sv-pr-eiffel', 'boutique'),
];

const AMSTERDAM: PoiContent[] = [
  p('amsterdam', 'station', 'station', 'Ga trung tâm', 'Central Station', ['transport', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'order'], 2, 10, 'sv-am-ticket'),
  p('amsterdam', 'canalhouse', 'hotel', 'Nhà kênh', 'Canal house', ['housing', 'listening-accommodation', 'reply-hotel'], ['reply', 'cloze', 'order'], 2, 10, 'sv-am-key', 'station'),
  p('amsterdam', 'flowers', 'market', 'Chợ hoa tulip', 'Flower market', ['agriculture', 'shopping', 'reply-market'], ['reply', 'cloze', 'translate'], 2, 10, 'sv-am-tulip', 'station'),
  p('amsterdam', 'windmill', 'garden', 'Cối xay gió', 'Windmill', ['energy', 'environment'], ['cloze', 'listen-pick', 'translate'], 3, 12, 'sv-am-mill', 'canalhouse'),
  p('amsterdam', 'cafe', 'cafe', 'Quán cà phê bên kênh', 'Canal-side café', ['leisure', 'food', 'reply-cafe'], ['reply', 'cloze', 'dictation'], 2, 10, 'sv-am-stroop', 'flowers'),
  p('amsterdam', 'boat', 'landmark', 'Chuyến thuyền kênh', 'Canal boat tour', ['tourism', 'listening-tourism-tours', 'reply-tickets'], ['reply', 'listen-pick', 'dictation'], 3, 13, 'sv-am-bike', 'windmill'),
];

const ROME: PoiContent[] = [
  p('rome', 'termini', 'station', 'Ga Termini', 'Termini station', ['transport', 'listening-directions-maps', 'reply-directions'], ['reply', 'listen-pick', 'order'], 3, 12, 'sv-rm-ticket'),
  p('rome', 'trattoria', 'restaurant', 'Quán trattoria', 'Trattoria', ['food', 'reply-restaurant'], ['reply', 'cloze', 'dictation'], 3, 12, 'sv-rm-pasta', 'termini'),
  p('rome', 'colosseum', 'landmark', 'Đấu trường Colosseum', 'The Colosseum', ['history', 'architecture', 'reply-tickets'], ['reply', 'cloze', 'listen-pick'], 3, 14, 'sv-rm-colosseum', 'termini'),
  p('rome', 'trevi', 'garden', 'Đài phun nước Trevi', 'Trevi Fountain', ['culture', 'listening-history-architecture'], ['cloze', 'dictation', 'listen-pick'], 3, 13, 'sv-rm-coin', 'trattoria'),
  p('rome', 'vatican', 'museum', 'Bảo tàng Vatican', 'Vatican museums', ['art', 'history', 'reply-tickets'], ['reply', 'cloze', 'translate'], 3, 14, 'sv-rm-vatican', 'colosseum'),
  p('rome', 'market', 'market', 'Chợ Campo de’ Fiori', 'Campo de’ Fiori market', ['shopping', 'food', 'reply-market'], ['reply', 'cloze', 'listen-pick'], 3, 12, 'sv-rm-olive', 'trevi'),
];

export const POI_CATALOG: PoiContent[] = [...HANOI, ...SINGAPORE, ...LONDON, ...PARIS, ...AMSTERDAM, ...ROME];

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
