import seed from './seed/bilingual/index.json';
import { PRESS_ARTICLES } from './bilingual-press-articles';

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

export type BilingualSource = {
  outlet: string;
  url: string;
  author?: string;
  publishedAt: string;
  license: string;
};

export type BilingualArticle = {
  id: string;
  /** "press" = bài báo lấy từ nguồn cho phép dùng lại; không có = bài Band 9 tự viết. */
  kind?: 'press';
  source?: BilingualSource;
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
  /** Ảnh bìa (đường dẫn trong app, ví dụ /bilingual/covers/bl-01.jpg). Không có thì thẻ dùng nền màu theo chủ đề. */
  cover?: string;
};

/*
  Thẻ <b>/<i> trong kho được GIỮ LẠI và màn đọc vẽ thành chữ đậm/nghiêng thật
  (`lib/inlineMarkup.ts`). Chỗ nào chỉ cần chữ trơn — ô tìm kiếm, thẻ danh sách,
  từ điển — thì gỡ thẻ tại chỗ bằng `stripInline`.
*/
export const BILINGUAL_ARTICLES: BilingualArticle[] = [
  ...(seed as BilingualArticle[]),
  ...PRESS_ARTICLES,
];

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


/*
  NGUỒN BÀI — cổng "Đọc báo song ngữ" chia kho theo nơi bài được đăng.
*/
export type BilingualOutlet = {
  key: string;
  name: string;
  /** Một dòng giới thiệu, chữ nghiêng trên thẻ nguồn. */
  tagline: string;
  license: string;
  /** Màu bìa thẻ nguồn. */
  cover: string;
  ink: string;
};

export const BILINGUAL_OUTLETS: BilingualOutlet[] = [
  {
    key: 'readup',
    name: 'Band 9 Analysis',
    tagline: 'Bài phân tích tự viết — kinh tế, sức khoẻ, khoa học, Việt Nam',
    license: 'Bản quyền Band 9',
    cover: '#F2B84B',
    ink: '#1F2A12',
  },
  {
    key: 'economist',
    name: 'The Economist',
    tagline: 'Kinh tế vĩ mô, AI, địa chính trị — chuẩn C1-C2 Band 8.5-9.0',
    license: 'Educational Fair Use / Band 9 Edition',
    cover: '#E3120B',
    ink: '#FFFFFF',
  },
  {
    key: 'bbc',
    name: 'BBC News & Future',
    tagline: 'Khoa học thường thức, tâm lý học, giáo dục & văn hóa toàn cầu',
    license: 'Educational Fair Use / Band 9 Edition',
    cover: '#0F172A',
    ink: '#FFFFFF',
  },
  {
    key: 'cnn_nyt',
    name: 'CNN & The New York Times',
    tagline: 'Thời sự quốc tế, y tế, dân số học & xã hội hiện đại',
    license: 'Educational Fair Use / Band 9 Edition',
    cover: '#0C2340',
    ink: '#FFFFFF',
  },
  {
    key: 'guardian_nature',
    name: 'The Guardian & Nature',
    tagline: 'Môi trường, sinh học biển, biến đổi khí hậu — sát chuẩn IELTS Passage 3',
    license: 'Educational Fair Use / Band 9 Edition',
    cover: '#052962',
    ink: '#FFFFFF',
  },
  {
    key: 'voa',
    name: 'VOA Learning English',
    tagline: 'Tin khoa học, sức khoẻ, văn hoá viết bằng tiếng Anh dễ đọc',
    license: 'Public domain',
    cover: '#2F5DA8',
    ink: '#FFFFFF',
  },
  {
    key: 'gv',
    name: 'Global Voices',
    tagline: 'Phóng sự từ cộng đồng khắp thế giới, góc nhìn người trong cuộc',
    license: 'CC BY 3.0',
    cover: '#C2553A',
    ink: '#FFFFFF',
  },
  {
    key: 'nasa',
    name: 'NASA Science',
    tagline: 'Trái Đất, Mặt Trăng, bầu trời — kể bởi chính nhà khoa học',
    license: 'Public domain',
    cover: '#1F2A44',
    ink: '#FFFFFF',
  },
  {
    key: 'wikinews',
    name: 'Wikinews',
    tagline: 'Tin khoa học và môi trường do cộng đồng biên tập',
    license: 'CC BY 2.5',
    cover: '#3E6B5A',
    ink: '#FFFFFF',
  },
  {
    key: 'wikipedia',
    name: 'Wikipedia',
    tagline: 'Bài bách khoa: lịch sử, tự nhiên, văn minh — đúng chất đề IELTS',
    license: 'CC BY-SA 4.0',
    cover: '#E9E4D4',
    ink: '#1F2A12',
  },
];

export function outletKeyOf(article: BilingualArticle): string {
  if (!article.source) return 'readup';
  if (/Economist/i.test(article.source.outlet)) return 'economist';
  if (/BBC/i.test(article.source.outlet)) return 'bbc';
  if (/CNN|New York Times|NYT/i.test(article.source.outlet)) return 'cnn_nyt';
  if (/Guardian|Nature/i.test(article.source.outlet)) return 'guardian_nature';
  if (/VOA/i.test(article.source.outlet)) return 'voa';
  if (/Global Voices/i.test(article.source.outlet)) return 'gv';
  if (/NASA/i.test(article.source.outlet)) return 'nasa';
  if (/Wikinews/i.test(article.source.outlet)) return 'wikinews';
  if (/Wikipedia/i.test(article.source.outlet)) return 'wikipedia';
  return 'readup';
}

export function articlesOfOutlet(key: string): BilingualArticle[] {
  const list = BILINGUAL_ARTICLES.filter((a) => outletKeyOf(a) === key);
  // Bài báo xếp mới đăng lên trước; bài tự viết theo thứ tự độ khó.
  return key === 'readup'
    ? list.sort((a, b) => a.order - b.order)
    : list.sort((a, b) => (b.source?.publishedAt ?? '').localeCompare(a.source?.publishedAt ?? ''));
}
