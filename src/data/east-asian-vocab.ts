import sourceBooks from './east-asian-vocab.json';
import openBooks from './east-asian-open-vocab.json';
import extraZh from './east-asian-extra-zh.json';
import extraJa from './east-asian-extra-ja.json';
import type { BookVocabBook, BookVocabLesson, BookVocabTheme, VocabTopicWord } from './vocab-topics';

type SourceWord = {
  w: string; p?: string; r?: string; g?: string; o?: string; s?: number; l?: string;
  vi?: string; ex?: string; exVi?: string; exEn?: string; exReading?: string; syn?: string[]; coll?: string;
};
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
  sourceUrl?: string;
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

type Extra = { vi: string; ex: { t: string; vi: string; py?: string; en?: string }; syn?: string[]; coll?: string };
const EXTRA: Record<'zh' | 'ja', Record<string, Extra>> = { zh: extraZh as Record<string, Extra>, ja: extraJa as Record<string, Extra> };

function makeWord(row: SourceWord, book: SourceBook): VocabTopicWord {
  const isJapanese = book.language === 'ja';
  const extra = EXTRA[book.language][row.w];
  return {
    word: row.w,
    pos: isJapanese ? (row.o ?? '') : translateHskPos(row.o ?? ''),
    ipa: row.p ?? '',
    // Nghĩa tiếng Việt là bản biên soạn thêm; nghĩa tiếng Anh của Irodori giữ ở definitionEn.
    meaningVi: extra?.vi ?? row.vi ?? row.g ?? '',
    definitionEn: row.g ?? '',
    example: extra?.ex?.t ?? row.ex ?? '',
    exampleVi: extra?.ex?.vi ?? row.exVi,
    // Câu ví dụ lấy từ bảng bổ sung thì bản dịch Anh cũng phải lấy ở đó (không lẫn với câu gốc của dòng).
    exampleEn: extra?.ex ? extra.ex.en : row.exEn,
    exampleReading: extra?.ex?.py ?? row.exReading,
    synonyms: extra?.syn?.length ? extra.syn : row.syn?.length ? row.syn : undefined,
    collocation: extra?.coll ?? row.coll ?? '',
    glossLanguage: extra?.vi || row.vi ? 'vi' : row.g ? 'en' : undefined,
    band: isJapanese
      ? (row.l?.startsWith('N') ? `JLPT ${row.l}` : IRODORI_LEVEL_LABEL[row.l ?? ''] ?? 'Irodori')
      : `HSK ${row.l ?? ''}`.trim(),
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
    sourceNote: book.sourceNote,
    sourceUrl: book.sourceUrl,
  };
}

/** Từ đứng riêng: một cụm kana/kanji ngắn, không có dấu câu (loại các câu hội thoại dài). */
const STANDALONE = /^[぀-ヿ一-鿿]{1,8}$/;
const VOCAB_CHUNK = 20;

/** Bài "từ riêng lẻ" của một bộ Irodori: gom các từ đứng riêng của mọi bài hội thoại, mỗi bài tối đa 20 từ. */
function standaloneVocabLessons(topic: SourceTheme): SourceLesson[] {
  const seen = new Set<string>();
  const rows: SourceWord[] = [];
  for (const lesson of topic.lessons) {
    for (const row of lesson.rows) {
      const core = row.w.replace(/[（）()～〜]/g, '');
      if (!STANDALONE.test(core) || seen.has(core)) continue;
      seen.add(core);
      rows.push(row);
    }
  }
  const out: SourceLesson[] = [];
  for (let i = 0, n = 1; i < rows.length; i += VOCAB_CHUNK, n++) {
    out.push({
      slug: `${topic.slug}-tu-${String(n).padStart(2, '0')}`,
      name: `Words ${n}`,
      nameVi: `Từ riêng lẻ · Phần ${n}`,
      lessonIndex: 100 + n,
      sourceLesson: null,
      sourceUnit: topic.lessons[0]?.sourceUnit ?? 0,
      lessonTitle: null,
      sourcePages: [],
      blurb: '',
      rows: rows.slice(i, i + VOCAB_CHUNK),
    });
  }
  return out;
}

export const EAST_ASIAN_VOCAB_BOOKS: BookVocabBook[] = ([
  ...(sourceBooks as unknown as SourceBook[]),
  ...(openBooks as unknown as SourceBook[]),
]).map((book) => {
  const isIrodori = book.language === 'ja' && (sourceBooks as unknown as SourceBook[]).includes(book);
  const topics: BookVocabTheme[] = book.topics.map((topic) => {
    // Từ của bộ (topic.words) chỉ tính từ bài hội thoại, để không đếm trùng từ ở bài riêng lẻ.
    const dialogue = topic.lessons.map((lesson) => makeLesson(lesson, book, topic));
    const vocab = isIrodori ? standaloneVocabLessons(topic).map((lesson) => makeLesson(lesson, book, topic)) : [];
    return {
      slug: topic.slug,
      name: topic.name,
      nameVi: topic.nameVi,
      blurb: `${topic.wordCount} từ · ${book.nameVi}`,
      words: dialogue.flatMap((lesson) => lesson.words),
      lessons: [...dialogue, ...vocab],
    };
  });
  return {
    slug: book.slug,
    name: book.name,
    nameVi: book.nameVi,
    blurb: book.blurb,
    words: topics.flatMap((topic) => topic.words),
    language: book.language,
    sourceNote: book.sourceNote,
    sourceUrl: book.sourceUrl,
    topics,
  };
});
