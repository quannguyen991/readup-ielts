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

export type BilingualSource = {
  outlet: string;
  url: string;
  author?: string;
  publishedAt: string;
  license: string;
};

export type BilingualArticle = {
  id: string;
  /** "press" = bài báo lấy từ nguồn cho phép dùng lại; không có = bài ReadUp tự viết. */
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
};

/*
  Thẻ <b>/<i> trong kho được GIỮ LẠI và màn đọc vẽ thành chữ đậm/nghiêng thật
  (`lib/inlineMarkup.ts`). Chỗ nào chỉ cần chữ trơn — ô tìm kiếm, thẻ danh sách,
  từ điển — thì gỡ thẻ tại chỗ bằng `stripInline`.
*/
export const BILINGUAL_ARTICLES: BilingualArticle[] = seed as BilingualArticle[];

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

  Chỉ gồm những nơi cho phép dùng lại TOÀN VĂN: VOA và NASA (tài liệu của chính
  phủ Mỹ, không giữ bản quyền), Global Voices (CC BY — được dịch, phải ghi
  nguồn). Báo giữ bản quyền (Guardian, NYT, Economist…) KHÔNG được đưa vào đây,
  kể cả khi có để link gốc: link không biến việc chép toàn văn thành hợp pháp.
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
    name: 'ReadUp Analysis',
    tagline: 'Bài phân tích tự viết — kinh tế, sức khoẻ, khoa học, Việt Nam',
    license: 'Bản quyền ReadUp',
    cover: '#F2B84B',
    ink: '#1F2A12',
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
];

export function outletKeyOf(article: BilingualArticle): string {
  if (!article.source) return 'readup';
  if (/VOA/i.test(article.source.outlet)) return 'voa';
  if (/Global Voices/i.test(article.source.outlet)) return 'gv';
  if (/NASA/i.test(article.source.outlet)) return 'nasa';
  return 'readup';
}

export function articlesOfOutlet(key: string): BilingualArticle[] {
  const list = BILINGUAL_ARTICLES.filter((a) => outletKeyOf(a) === key);
  // Bài báo xếp mới đăng lên trước; bài tự viết theo thứ tự độ khó.
  return key === 'readup'
    ? list.sort((a, b) => a.order - b.order)
    : list.sort((a, b) => (b.source?.publishedAt ?? '').localeCompare(a.source?.publishedAt ?? ''));
}
