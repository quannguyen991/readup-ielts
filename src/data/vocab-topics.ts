import topics from './seed/vocab-topics/index.json';
import { LISTENING_DECKS } from './vocab-listening';
import { VFI_DECKS } from './vocab-for-ielts';
import { VFIA_DECKS } from './vocab-for-ielts-advanced';
import globalSuccessDecks from './seed/vocab-global-success/index.json';
import { DESTINATION_DECKS } from './destination-vocab';
import { DAILY_TALK_TOPICS } from './vocab-daily';
import bookVocab from './book-vocab.json';
import bookVocabTopicMap from './book-vocab-topic-map.json';
import { EAST_ASIAN_VOCAB_BOOKS } from './east-asian-vocab';

/**
 * Bộ từ vựng IELTS soạn sẵn theo chủ đề.
 *
 * VÌ SAO CÓ: sổ từ của app vốn chỉ đầy lên khi người học chạm vào từ trong lúc
 * đọc — tức là nó TRỐNG TRƠN ở ngày đầu tiên. Người mới mở app, vào Sổ từ, thấy
 * số 0 và một dòng chữ bảo họ đi chỗ khác trước đã. Năm mươi bộ này cho họ thứ
 * để bắt đầu ngay, và cho người sắp thi một danh sách để rà theo chủ đề.
 *
 * Dữ liệu nằm trong bundle (không gọi mạng): 2.500 từ dạng JSON là vài trăm KB,
 * rẻ hơn nhiều so với việc bắt người dùng chờ một lời gọi API để xem danh sách.
 */

export type VocabTopicWord = {
  word: string;
  pos: string;
  ipa: string;
  meaningVi: string;
  definitionEn: string;
  example: string;
  collocation: string;
  /** Bản dịch tiếng Việt của câu ví dụ (bộ Trung/Nhật); bộ tiếng Anh dịch theo yêu cầu. */
  exampleVi?: string;
  /** Phiên âm câu ví dụ (pinyin) cho bộ tiếng Trung. */
  exampleReading?: string;
  band: string;
  /** Mức CEFR: B1 ≈ band 5–6, B2 ≈ 6–7, C1 ≈ 7–8, C2 ≈ 8+. Có ở mọi từ sau khi ghép bộ B1–C2. */
  cefr?: 'B1' | 'B2' | 'C1' | 'C2';
  /** Đồng nghĩa cùng nghĩa, cùng từ loại (soạn tay, máy kiểm khi gộp). Không có thì bỏ trống. */
  synonyms?: string[];
  antonyms?: string[];
  origin?: 'source-list' | 'original-advanced';
  /** Ngữ cảnh dùng (tiếng Việt): nói câu này khi nào, ở đâu. Chỉ có ở bộ giao tiếp hằng ngày. */
  context?: string;
  /** Ngôn ngữ gốc của từ; dùng để hiển thị cách đọc và chọn giọng đọc phù hợp. */
  language?: 'en' | 'ja' | 'zh';
  /** Romaji của từ tiếng Nhật. */
  romanization?: string;
  sourcePos?: string;
  /** Ngôn ngữ của nghĩa nguồn; Irodori cung cấp nghĩa tiếng Anh. */
  glossLanguage?: 'vi' | 'en';
  sourcePage?: number;
  sourceLevel?: string;
  sourceNote?: string;
};

export type VocabTopic = {
  slug: string;
  name: string;
  nameVi: string;
  blurb: string;
  words: VocabTopicWord[];
  /** Present on Global Success vocabulary decks. */
  grade?: number;
  unit?: number;
  sourceUrl?: string;
  /** Parent book when this is one of the book-based study topics. */
  bookSlug?: string;
  bookName?: string;
  language?: 'en' | 'ja' | 'zh';
  sourceNote?: string;
};

export const VOCAB_TOPICS: VocabTopic[] = topics as unknown as VocabTopic[];
/** Bộ từ nâng cao tự biên soạn theo chủ điểm Global Success; không thay cho danh sách nguyên văn trong sách. */
export const GLOBAL_SUCCESS_DECKS: VocabTopic[] = globalSuccessDecks as unknown as VocabTopic[];
type BookTopicMapEntry = { slug: string; name: string; nameVi: string; ranges: number[][]; wordCount: number };
export type BookVocabLesson = VocabTopic & {
  bookSlug: string;
  bookName: string;
  themeSlug: string;
  themeName: string;
  themeNameVi: string;
  lessonIndex: number;
  sourceLesson?: number;
  sourceUnit?: number;
  lessonTitle?: string;
  sourcePages?: number[];
};
export type BookVocabTheme = {
  slug: string;
  name: string;
  nameVi: string;
  blurb: string;
  words: VocabTopicWord[];
  lessons: BookVocabLesson[];
};
export type BookVocabBook = Omit<VocabTopic, 'topics'> & { topics: BookVocabTheme[] };

const BOOK_LESSON_SIZE = 50;

/** Giữ sách → chủ đề → buổi học; mỗi buổi có tối đa 50 từ. */
const ENGLISH_BOOK_VOCAB_BOOKS: BookVocabBook[] = (bookVocab as unknown as VocabTopic[]).map((book) => {
  const groups = (bookVocabTopicMap as Record<string, BookTopicMapEntry[]>)[book.slug] ?? [];
  const topics = groups.map((group) => ({
    slug: group.slug,
    name: group.name,
    nameVi: group.nameVi,
    blurb: `${group.wordCount} từ · ${book.name}`,
    words: group.ranges.flatMap(([start, end]) => book.words.slice(start, end)),
    lessons: [] as BookVocabLesson[],
  }));
  for (const topic of topics) {
    const lessonCount = Math.ceil(topic.words.length / BOOK_LESSON_SIZE);
    topic.lessons = Array.from({ length: lessonCount }, (_, index) => {
      const words = topic.words.slice(index * BOOK_LESSON_SIZE, (index + 1) * BOOK_LESSON_SIZE);
      const lessonNumber = index + 1;
      const labelVi = `${topic.nameVi} · Buổi ${lessonNumber}`;
      const labelEn = `${topic.name} · Lesson ${lessonNumber}`;
      return {
        slug: `${topic.slug}-lesson-${String(lessonNumber).padStart(2, '0')}`,
        name: labelEn,
        nameVi: labelVi,
        blurb: `Buổi ${lessonNumber}/${lessonCount} · ${words.length} từ · ${book.name}`,
        words,
        bookSlug: book.slug,
        bookName: book.name,
        themeSlug: topic.slug,
        themeName: topic.name,
        themeNameVi: topic.nameVi,
        lessonIndex: lessonNumber,
      };
    });
  }
  return { ...book, topics };
});

/** Gộp 7 sách tiếng Anh với toàn bộ bộ OCR tiếng Trung và tiếng Nhật. */
export const BOOK_VOCAB_BOOKS: BookVocabBook[] = [...ENGLISH_BOOK_VOCAB_BOOKS, ...EAST_ASIAN_VOCAB_BOOKS];

/** Các buổi học của mọi sách, mỗi buổi tối đa 50 từ. */
export const BOOK_VOCAB_DECKS: BookVocabLesson[] = BOOK_VOCAB_BOOKS.flatMap((book) => book.topics.flatMap((topic) => topic.lessons));

/**
 * Tìm bộ theo slug — cả 50 chủ đề lẫn các bộ từ vựng Nghe (`listening-*`, xem
 * `vocab-listening.ts`) và các bộ Vocabulary for IELTS (`vfi-*`, `vfia-*`, xem `vocab-for-ielts.ts` và `vocab-for-ielts-advanced.ts`). Các màn học chỉ gọi hàm này nên bộ Nghe chạy chung được
 * mà `VOCAB_TOPICS` (và test "50 × 50") vẫn giữ nguyên.
 */
export function getVocabTopic(slug: string): VocabTopic | undefined {
  return VOCAB_TOPICS.find((t) => t.slug === slug) ?? BOOK_VOCAB_DECKS.find((d) => d.slug === slug) ?? GLOBAL_SUCCESS_DECKS.find((d) => d.slug === slug) ?? LISTENING_DECKS.find((d) => d.slug === slug) ?? VFI_DECKS.find((d) => d.slug === slug) ?? VFIA_DECKS.find((d) => d.slug === slug) ?? DESTINATION_DECKS.find((d) => d.slug === slug) ?? DAILY_TALK_TOPICS.find((d) => d.slug === slug);
}

export const VOCAB_TOPIC_TOTALS = {
  topics: VOCAB_TOPICS.length,
  words: VOCAB_TOPICS.reduce((sum, t) => sum + t.words.length, 0),
};

/** Nhóm từ của một chủ đề theo mức band, giữ nguyên thứ tự dễ → khó. */
export const BAND_ORDER: VocabTopicWord['band'][] = ['5-6', '6-7', '7-8', '8+'];

export function groupByBand(words: VocabTopicWord[]): Array<{
  band: VocabTopicWord['band'];
  words: VocabTopicWord[];
}> {
  return BAND_ORDER.map((band) => ({ band, words: words.filter((w) => w.band === band) })).filter(
    (g) => g.words.length > 0,
  );
}
