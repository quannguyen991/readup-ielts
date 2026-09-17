import seed from './seed/bilingual/index.json';

/**
 * Kho bài đọc song ngữ Anh–Việt.
 *
 * NGUỒN VÀ BẢN QUYỀN: toàn bộ văn bản tiếng Anh ở đây do dự án `doc-song-ngu`
 * tự viết, không trích từ báo hay sách nào. Đó là lý do kho này được phép hiện
 * TOÀN VĂN cả hai thứ tiếng ngay trong app, khác hẳn kho bài đọc `articles`
 * (bài báo có bản quyền, chỉ được dẫn link ra ngoài với những bài không tự
 * viết). Đừng nhập bài báo thật vào đây.
 *
 * Chữ ký hàm giữ cùng dáng với `writing-repository` và `articles`: nếu sau này
 * dữ liệu chuyển sang Supabase thì chỉ đổi ruột, màn hình không phải sửa.
 */

export type BilingualGloss = {
  word: string;
  ipa: string;
  pos: string;
  meaningVi: string;
};

export type BilingualParagraph = {
  en: string;
  vi: string;
  /** Chú giải lề của riêng đoạn này. */
  gloss: BilingualGloss[];
};

export type BilingualVocab = BilingualGloss & {
  collocation?: string;
  example?: string;
  derivatives?: string;
};

export type BilingualQuestion = {
  q: string;
  options: string[];
  answerIndex: number;
  whyVi: string;
  type: string;
};

export type BilingualArticle = {
  id: string;
  /** Số bài trong sách gốc — cũng là thứ tự độ khó tăng dần. */
  order: number;
  level: string;
  topic: string;
  titleEn: string;
  titleVi: string;
  standfirstEn: string;
  standfirstVi: string;
  wordCount: number;
  estMinutes: number;
  paragraphs: BilingualParagraph[];
  vocab: BilingualVocab[];
  questions: BilingualQuestion[];
};

/*
  Gỡ thẻ <b>/<i> còn sót từ bản sách gốc.

  Kho được chuyển từ bản HTML của sách, nên 181 chuỗi (đoạn Việt, đoạn Anh, họ
  từ) còn mang thẻ in đậm/nghiêng. Màn đọc vẽ chữ bằng <Text> chứ không dựng
  HTML, nên người đọc thấy nguyên "<b>" giữa câu — và từ điển rê chuột tra
  "<i>salary</i>" thành "isalaryi". Gỡ một lần lúc nạp, không sửa tay file seed.
*/
function stripTags<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(/<\/?(?:b|i|em|strong)>/gi, '') as T;
  }
  if (Array.isArray(value)) return value.map(stripTags) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripTags(v)]),
    ) as T;
  }
  return value;
}

export const BILINGUAL_ARTICLES: BilingualArticle[] = stripTags(seed as BilingualArticle[]);

export function getBilingualArticleById(id: string): BilingualArticle | undefined {
  return BILINGUAL_ARTICLES.find((a) => a.id === id);
}

export const BILINGUAL_LEVELS: string[] = [
  ...new Set(BILINGUAL_ARTICLES.map((a) => a.level)),
];

export const BILINGUAL_TOPICS: string[] = [
  ...new Set(BILINGUAL_ARTICLES.map((a) => a.topic)),
].sort((a, b) => a.localeCompare(b, 'vi'));

export type BilingualFilters = {
  search?: string;
  level?: string | 'all';
  topic?: string | 'all';
};

export function filterBilingualArticles(filters: BilingualFilters = {}): BilingualArticle[] {
  const { search = '', level = 'all', topic = 'all' } = filters;
  const needle = search.trim().toLowerCase();

  return BILINGUAL_ARTICLES.filter((a) => {
    if (level !== 'all' && a.level !== level) return false;
    if (topic !== 'all' && a.topic !== topic) return false;
    if (needle === '') return true;
    // Tìm cả hai thứ tiếng: người học nhớ bài theo tên tiếng Việt cũng nhiều
    // như theo tên tiếng Anh.
    return (
      a.titleEn.toLowerCase().includes(needle) ||
      a.titleVi.toLowerCase().includes(needle) ||
      a.standfirstEn.toLowerCase().includes(needle) ||
      a.standfirstVi.toLowerCase().includes(needle) ||
      a.topic.toLowerCase().includes(needle)
    );
  });
}

export function bilingualStats() {
  return {
    articles: BILINGUAL_ARTICLES.length,
    paragraphs: BILINGUAL_ARTICLES.reduce((n, a) => n + a.paragraphs.length, 0),
    vocab: BILINGUAL_ARTICLES.reduce((n, a) => n + a.vocab.length, 0),
    questions: BILINGUAL_ARTICLES.reduce((n, a) => n + a.questions.length, 0),
  };
}
