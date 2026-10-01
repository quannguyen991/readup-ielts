/**
 * Kho CÂU ĐÁP TÌNH HUỐNG của "Du ngoạn Band 9": 7 chủ đề × 40 tình huống ngắn,
 * soạn tay bằng tiếng Anh Anh/Úc tự nhiên (có bản dịch tiếng Việt). Mỗi mục có
 * một câu đáp đúng và ba câu sai trôi chảy nhưng không hợp. Không dùng AI lúc chạy.
 *
 * Mã bộ để gắn vào `Poi.content.decks`: `reply-cafe`, `reply-hotel`,
 * `reply-directions`, `reply-market`, `reply-airport`, `reply-restaurant`,
 * `reply-tickets`.
 */
import type { Bi } from '@/i18n/useL';
import type { Level, PoiKind } from '@/services/travel/types';
import { CAFE, DIRECTIONS, HOTEL, type ReplyTuple } from './replies-a';
import { AIRPORT, MARKET, RESTAURANT, TICKETS } from './replies-b';

export type ReplyTheme = 'cafe' | 'hotel' | 'directions' | 'market' | 'airport' | 'restaurant' | 'tickets';

export const REPLY_THEMES: ReplyTheme[] = ['cafe', 'hotel', 'directions', 'market', 'airport', 'restaurant', 'tickets'];

export const REPLY_DECK_PREFIX = 'reply-';

export const REPLY_THEME_LABEL: Record<ReplyTheme, Bi> = {
  cafe: { vi: 'Quán cà phê', en: 'Café' },
  hotel: { vi: 'Khách sạn', en: 'Hotel' },
  directions: { vi: 'Hỏi đường', en: 'Directions' },
  market: { vi: 'Chợ & mua sắm', en: 'Market & shopping' },
  airport: { vi: 'Sân bay & hải quan', en: 'Airport & customs' },
  restaurant: { vi: 'Nhà hàng', en: 'Restaurant' },
  tickets: { vi: 'Vé tham quan', en: 'Tour tickets' },
};

export type ReplyItem = {
  /** `<theme>-<số thứ tự 01..>` ổn định theo vị trí trong tệp nguồn. */
  id: string;
  theme: ReplyTheme;
  level: Level;
  /** Bối cảnh tiếng Anh (một câu). */
  setup: string;
  /** Câu người kia nói; rỗng nếu chính người học mở lời. */
  line: string;
  /** Nghĩa tiếng Việt của bối cảnh + câu nói. */
  gloss: string;
  answer: string;
  answerVi: string;
  wrong: [string, string, string];
};

const RAW: Record<ReplyTheme, ReplyTuple[]> = {
  cafe: CAFE,
  hotel: HOTEL,
  directions: DIRECTIONS,
  market: MARKET,
  airport: AIRPORT,
  restaurant: RESTAURANT,
  tickets: TICKETS,
};

function build(theme: ReplyTheme): ReplyItem[] {
  return RAW[theme].map(([level, setup, line, gloss, answer, answerVi, wrong], i) => ({
    id: `${theme}-${String(i + 1).padStart(2, '0')}`,
    theme,
    level,
    setup,
    line,
    gloss,
    answer,
    answerVi,
    wrong: [...wrong] as [string, string, string],
  }));
}

export const REPLY_ITEMS: Record<ReplyTheme, ReplyItem[]> = Object.fromEntries(REPLY_THEMES.map((t) => [t, build(t)])) as Record<
  ReplyTheme,
  ReplyItem[]
>;

export const ALL_REPLY_ITEMS: ReplyItem[] = REPLY_THEMES.flatMap((t) => REPLY_ITEMS[t]);

export function isReplyDeck(deck: string): boolean {
  return deck.startsWith(REPLY_DECK_PREFIX) && (REPLY_THEMES as string[]).includes(deck.slice(REPLY_DECK_PREFIX.length));
}

export function themeOfDeck(deck: string): ReplyTheme | null {
  return isReplyDeck(deck) ? (deck.slice(REPLY_DECK_PREFIX.length) as ReplyTheme) : null;
}

/** Chủ đề mặc định theo loại địa điểm, khi địa điểm có kiểu `reply` mà không ghi bộ `reply-*`. */
export const REPLY_THEME_BY_KIND: Partial<Record<PoiKind, ReplyTheme>> = {
  cafe: 'cafe',
  hotel: 'hotel',
  station: 'directions',
  market: 'market',
  airport: 'airport',
  counter: 'airport',
  restaurant: 'restaurant',
  museum: 'tickets',
  landmark: 'tickets',
  garden: 'directions',
  secret: 'directions',
};

export function getReplyItem(id: string): ReplyItem | undefined {
  return ALL_REPLY_ITEMS.find((x) => x.id === id);
}
