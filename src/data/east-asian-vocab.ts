import sourceBooks from './east-asian-vocab.json';
import extraZh from './east-asian-extra-zh.json';
import extraJa from './east-asian-extra-ja.json';
import type { BookVocabBook, BookVocabLesson, BookVocabTheme, VocabTopicWord } from './vocab-topics';

type SourceWord = { w: string; p?: string; r?: string; g?: string; o?: string; s?: number; l?: string };
type SourceLesson = {
  slug: string;
  name: string;
  nameVi: string;
  lessonIndex: number;
  sourceLesson: number | null;
  sourceUnit: number;
  lessonTitle: string | null;
  sourcePages: number[];
  blurb: string;
  rows: SourceWord[];
};
type SourceTheme = {
  slug: string;
  name: string;
  nameVi: string;
  sourceTheme: string;
  wordCount: number;
  lessons: SourceLesson[];
};
type SourceBook = {
  slug: string;
  name: string;
  nameVi: string;
  language: 'ja' | 'zh';
  blurb: string;
  sourceNote: string;
  wordCount: number;
  unitCount: number;
  topics: SourceTheme[];
};

const HSK_POS_VI: Record<string, string> = {
  名: 'danh từ', 动: 'động từ', 形: 'tính từ', 副: 'phó từ', 介: 'giới từ', 连: 'liên từ',
  代: 'đại từ', 数: 'số từ', 量: 'lượng từ', 数量: 'từ chỉ số lượng', 助: 'trợ từ', 叹: 'thán từ',
  前缀: 'tiền tố', 后缀: 'hậu tố', 拟声: 'từ tượng thanh',
};
const IRODORI_LEVEL_LABEL: Record<string, string> = {
  starter: 'Starter',
  'elementary-1': 'Elementary 1',
  'elementary-2': 'Elementary 2',
  'pre-intermediate': 'Pre-intermediate',
};

function translateHskPos(pos: string): string {
  return pos
    .replace(/数量|前缀|后缀|拟声|名|动|形|副|介|连|代|数|量|助|叹/g, (code) => HSK_POS_VI[code] ?? code)
    .replace(/、/g, ' / ')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/\s+/g, ' ')
    .trim();
}

type Extra = { vi: string; ex: { t: string; vi: string; py?: string }; syn?: string[]; coll?: string };
const EXTRA: Record<'zh' | 'ja', Record<string, Extra>> = { zh: extraZh as Record<string, Extra>, ja: extraJa as Record<string, Extra> };

function makeWord(row: SourceWord, book: SourceBook): VocabTopicWord {
  const isJapanese = book.language === 'ja';
  const extra = EXTRA[book.language][row.w];
  return {
    word: row.w,
    pos: isJapanese ? '' : translateHskPos(row.o ?? ''),
    ipa: row.p ?? '',
    // Nghĩa tiếng Việt là bản biên soạn thêm; nghĩa tiếng Anh của Irodori giữ ở definitionEn.
    meaningVi: extra?.vi ?? '',
    definitionEn: isJapanese ? row.g ?? '' : '',
    example: extra?.ex.t ?? '',
    exampleVi: extra?.ex.vi,
    exampleReading: extra?.ex.py,
    synonyms: extra?.syn?.length ? extra.syn : undefined,
    collocation: extra?.coll ?? '',
    band: isJapanese ? IRODORI_LEVEL_LABEL[row.l ?? ''] ?? 'Irodori' : `HSK ${row.l ?? ''}`.trim(),
    language: book.language,
    romanization: row.r,
    sourceLevel: row.l,
  };
}

function makeLesson(source: SourceLesson, book: SourceBook, topic: SourceTheme): BookVocabLesson {
  return {
    slug: source.slug,
    name: source.name,
    nameVi: source.nameVi,
    blurb: `${source.rows.length} từ · ${book.nameVi}`,
    words: source.rows.map((row) => makeWord(row, book)),
    bookSlug: book.slug,
    bookName: book.name,
    themeSlug: topic.slug,
    themeName: topic.name,
    themeNameVi: topic.nameVi,
    lessonIndex: source.lessonIndex,
    sourceLesson: source.sourceLesson ?? undefined,
    sourceUnit: source.sourceUnit,
    lessonTitle: source.lessonTitle ?? undefined,
    sourcePages: [],
    language: book.language,
    sourceNote: undefined,
  };
}

export const EAST_ASIAN_VOCAB_BOOKS: BookVocabBook[] = (sourceBooks as unknown as SourceBook[]).map((book) => {
  const topics: BookVocabTheme[] = book.topics.map((topic) => {
    const lessons = topic.lessons.map((lesson) => makeLesson(lesson, book, topic));
    return {
      slug: topic.slug,
      name: topic.name,
      nameVi: topic.nameVi,
      blurb: `${topic.wordCount} từ · ${book.nameVi}`,
      words: lessons.flatMap((lesson) => lesson.words),
      lessons,
    };
  });
  return {
    slug: book.slug,
    name: book.name,
    nameVi: book.nameVi,
    blurb: book.language === 'zh' ? 'Chữ Hán, pinyin, nghĩa tiếng Việt, ví dụ và đồng nghĩa theo cấp HSK.' : 'Kana, romaji, nghĩa tiếng Việt, ví dụ và từ đồng nghĩa theo bài Irodori.',
    words: topics.flatMap((topic) => topic.words),
    language: book.language,
    sourceNote: undefined,
    topics,
  };
});
