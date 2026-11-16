import type { VocabTopic, VocabTopicWord } from './vocab-topics';
import study4Seed from './seed/vocab-study4/index.json';

/** Broad groups used to keep the imported vocabulary collections easy to scan. */
export type Study4Category = 'ielts' | 'toeic' | 'sat' | 'academic' | 'idioms';

/** Vocabulary collection copied under the user's license. */
export type Study4Deck = VocabTopic & {
  study4Id: number;
  category: Study4Category;
  sourceUrl: string;
  words: VocabTopicWord[];
};

export const STUDY4_CATEGORY_ORDER: readonly Study4Category[] = ['ielts', 'toeic', 'sat', 'academic', 'idioms'];

export const STUDY4_CATEGORY_INFO: Record<Study4Category, { vi: string; en: string }> = {
  ielts: { vi: 'IELTS', en: 'IELTS' },
  toeic: { vi: 'TOEIC', en: 'TOEIC' },
  sat: { vi: 'SAT', en: 'SAT' },
  academic: { vi: 'Học thuật · TOEFL · GRE · Kinh doanh', en: 'Academic · TOEFL · GRE · Business' },
  idioms: { vi: 'Thành ngữ', en: 'Idioms' },
};

/**
 * Kept separate from VOCAB_TOPICS so the fixed 50-topic IELTS catalog and its
 * coverage checks remain unchanged. The JSON seed contains one record per
 * collection, with its source URL and category on each deck.
 */
const VIETNAMESE_TITLES: Record<string, string> = {
  'study4-common-ielts-listening': 'Từ vựng IELTS Listening phổ biến',
  'study4-barrons-essentials-ielts': 'Từ vựng IELTS thiết yếu · Barron’s',
  'study4-toeic-word-list': 'Danh sách từ vựng TOEIC',
  'study4-600-toeic-words': '600 từ vựng TOEIC',
  'study4-barrons-sat-words': 'Từ vựng SAT · Barron’s',
  'study4-college-panda-400-sat': '400 từ SAT · College Panda',
  'study4-new-academic-word-list': 'Danh sách từ vựng học thuật mới',
  'study4-business-word-list': 'Từ vựng kinh doanh',
  'study4-toefl-word-list': 'Danh sách từ vựng TOEFL',
  'study4-powerscore-gre-repeat-offenders': '700 từ GRE thường gặp · PowerScore',
  'study4-essential-english-idioms': 'Thành ngữ tiếng Anh thiết yếu',
};

/** Canonical forms of optional variants in the source idiom list, so practice modes target a real phrase. */
export const STUDY4_IDIOM_HEADWORDS: Record<string, string> = {
  'be about to do smth': 'about to do something',
  'to be the matter': 'something the matter',
  'all (day, week, month, year) long': 'all day long',
  'be in touch (with)': 'be in touch with',
  'every other (one)': 'every other day',
  'had better (do something)': 'had better do something',
  'in time to (do something)': 'in time to do something',
  'over and over (again)': 'over and over again',
  'to be carried away (by, with)': 'to be carried away by',
  'to be in charge (of something)': 'to be in charge of something',
  "to be in (someone's) shoes": "to be in someone's shoes",
  'to be in (the/one\'s) way': 'to be in the way',
  'to be up to (something)': 'to be up to something',
  'to be with (someone)': 'to be with someone',
  'to call it a day/night': 'to call it a day',
  "to change one's (my, his, your, etc. ) mind": 'change your mind',
  'to drop (someone) a line': 'to drop someone a line',
  'to eat in/to eat out': 'to eat in',
  'to fill (someone) in': 'to fill someone in',
  'to get along with someone (something)': 'to get along with someone',
  'to get better (worse, etc. )': 'to get better',
  'to get in/to get on': 'to get in',
  'to get out of/to get off': 'to get out of',
  'to get sick (well, tired, busy, wet, etc. )': 'to get sick',
  'to get used (to something)': 'to get used to something',
  'to give (someone) a big hand': 'to give someone a big hand',
  'to give (someone) a break': 'to give someone a break',
  'to give (someone) a hand': 'to give someone a hand',
  'to have (time) off': 'to have time off',
  'to keep away (from)': 'to keep away from',
  'to kick (something) around': 'to kick something around',
  'to leave (someone or something) alone': 'to leave someone alone',
  'to make a difference (to someone)': 'to make a difference to someone',
  'to make friends (with)': 'to make friends with',
  'to make (someone) tick': 'to make someone tick',
  "to make up one's (my, his, your, etc. ) mind": 'make up your mind',
  'to meet (someone) halfway': 'to meet someone halfway',
  'to pay attention (to)': 'to pay attention to',
  'to put (someone) on': 'to put someone on',
  'to see eye to eye (on something/with somebody)': 'to see eye to eye on something',
  'to serve (someone) right': 'to serve someone right',
  "to serve (the/one's) purpose": 'to serve the purpose',
  'to take a trip (to)': 'to take a trip to',
  "to take one's (my, his, your, etc. ) time": 'take your time',
  'to take turns (doing something)': 'to take turns doing something',
  'to throw (someone) a curve': 'to throw someone a curve',
  'would rather (do something)': 'would rather do something',
};

const IDIOM_SOURCE_BY_HEADWORD = Object.fromEntries(
  Object.entries(STUDY4_IDIOM_HEADWORDS).map(([source, headword]) => [headword, source]),
);

export function study4SourceHeadword(word: string): string {
  return IDIOM_SOURCE_BY_HEADWORD[word] ?? word;
}

/** Vietnamese display names and localized card descriptions; source names remain available in English. */
export const STUDY4_DECKS = (study4Seed as unknown as Study4Deck[]).map((deck) => ({
  ...deck,
  nameVi: VIETNAMESE_TITLES[deck.slug] ?? deck.name,
  blurb: `${deck.words.length.toLocaleString('vi-VN')} từ`,
  sourceNote: undefined,
  words: deck.slug === 'study4-essential-english-idioms'
    ? deck.words.map((word) => ({ ...word, word: STUDY4_IDIOM_HEADWORDS[word.word] ?? word.word }))
    : deck.words,
}));

const SOURCE_SECTION_VI: Record<string, string> = {
  OTHERS: 'Khác', VEHICLES: 'Phương tiện', TRANSPORTATIONS: 'Giao thông', WORKS: 'Công việc',
  'EQUIPMENT - TOOLS': 'Thiết bị · dụng cụ', SPORTS: 'Thể thao', 'ARTS - MEDIA': 'Nghệ thuật · truyền thông',
  TOURING: 'Du lịch tham quan', ENVIRONMENT: 'Môi trường', HOBBIES: 'Sở thích', EDUCATION: 'Giáo dục',
  ARCHITECTURE: 'Kiến trúc', QUALITIES: 'Phẩm chất', HOMES: 'Nhà cửa', PLACES: 'Địa điểm', HEALTH: 'Sức khỏe',
  'IN THE CITY': 'Trong thành phố', 'TIME EXPRESSION': 'Cách diễn đạt thời gian', COLORS: 'Màu sắc',
  SHAPES: 'Hình dạng', ADJECTIVES: 'Tính từ', VERBS: 'Động từ', LANGUAGES: 'Ngôn ngữ', COUNTRY: 'Quốc gia',
  WEATHER: 'Thời tiết', NATURE: 'Thiên nhiên', 'MONEY MATTERS': 'Tiền bạc', OCEANS: 'Đại dương',
  CONTINENTS: 'Châu lục', MARKETING: 'Tiếp thị', SUBJECTS: 'Môn học', 'MONTHS OF THE YEAR': 'Các tháng trong năm',
  'DAYS OF THE WEEK': 'Các ngày trong tuần', MATERIALS: 'Vật liệu', BUSINESS: 'Kinh doanh', TOURISM: 'Du lịch',
  TRANSPORTATION: 'Giao thông', 'LEISURE TIME': 'Thời gian giải trí', TECHNOLOGY: 'Công nghệ', SOCIETY: 'Xã hội',
  CULTURE: 'Văn hóa', TRAVEL: 'Du lịch', 'MANAGEMENT ISSUES': 'Quản lý', PURCHASING: 'Mua sắm',
  'OFFICE ISSUES': 'Công việc văn phòng', ENTERTAINMENT: 'Giải trí', 'RESTAURANTS AND EVENTS': 'Nhà hàng · sự kiện',
  'FINANCING AND BUDGETING': 'Tài chính · ngân sách', PERSONNEL: 'Nhân sự', 'GENERAL BUSINESS': 'Kinh doanh tổng quát',
  'THE NATURAL WORLD': 'Thế giới tự nhiên',
};

export function study4SectionLabel(label: string, english: boolean): string {
  if (english) return label.toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
  return SOURCE_SECTION_VI[label.toUpperCase()] ?? label;
}

export function getStudy4Deck(slug: string): Study4Deck | undefined {
  return STUDY4_DECKS.find((deck) => deck.slug === slug);
}

export const STUDY4_TOTALS = {
  decks: STUDY4_DECKS.length,
  words: STUDY4_DECKS.reduce((total, deck) => total + deck.words.length, 0),
};
