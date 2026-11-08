import index from './seed/index.json';
import { getArticleBody, loadArticleBody, type ArticleBody, type ArticleMeta } from './article-repository';
import type { CefrLevel, ExamKind, PassageTier, SatTextType } from '@/types/database';

/**
 * Kho bài đọc trong app.
 *
 * Nguồn hiện tại là seed cào sẵn (chạy `npm run ingest` để làm mới), nên app
 * dùng được ngay cả khi chưa cấu hình Supabase. Khi đã có Supabase, cùng bộ
 * hàm này sẽ đọc từ bảng `articles` — chữ ký hàm giữ nguyên.
 *
 * Kho chia làm hai phần: `index.json` (metadata mọi bài, bundle sẵn để duyệt
 * và lọc tức thì) và `bodies/chunk-NN.json` (toàn văn, nạp lười). Nên ở đây
 * `ArticleMeta` là thứ Library dùng, còn `Article` (đã có toàn văn) chỉ dựng
 * khi thật sự mở bài ra đọc.
 */

/** Metadata bài đọc — thứ Library dùng để duyệt và lọc. Không mang toàn văn. */
export type { ArticleMeta };
/** Bài đọc đầy đủ. Màn đọc và bài tự dán dùng shape này. */
export type Article = ArticleMeta & ArticleBody;

export const ARTICLES: ArticleMeta[] = index as unknown as ArticleMeta[];

export const TOPICS = [
  { slug: 'environment', name: 'Environment', nameVi: 'Môi trường' },
  { slug: 'technology', name: 'Technology', nameVi: 'Công nghệ' },
  { slug: 'education', name: 'Education', nameVi: 'Giáo dục' },
  { slug: 'health', name: 'Health', nameVi: 'Sức khoẻ' },
  { slug: 'science', name: 'Science', nameVi: 'Khoa học' },
  { slug: 'business', name: 'Business', nameVi: 'Kinh doanh' },
  { slug: 'society', name: 'Society', nameVi: 'Xã hội' },
  { slug: 'culture', name: 'Culture', nameVi: 'Văn hoá' },
  { slug: 'history', name: 'History', nameVi: 'Lịch sử' },
  { slug: 'psychology', name: 'Psychology', nameVi: 'Tâm lý học' },
  // Thêm cùng nguồn SAT: passage văn học là một trong bốn loại văn bản của đề.
  { slug: 'literature', name: 'Literature', nameVi: 'Văn học' },
] as const;

export const CEFR_LEVELS: CefrLevel[] = ['A2', 'B1', 'B2', 'C1', 'C2'];

export const EXAMS: ReadonlyArray<{ value: ExamKind; label: string }> = [
  { value: 'ielts', label: 'IELTS' },
  { value: 'sat', label: 'SAT' },
];

/** Nhãn tier hiển thị cho người học, kèm khổ chữ để biết mình sắp đọc gì. */
export const TIER_LABEL: Record<PassageTier, string> = {
  p1: 'Passage 1 (~750 từ)',
  p2: 'Passage 2 (~900 từ)',
  p3: 'Passage 3 (~1050 từ)',
  short_academic: 'Bài học thuật ngắn',
  headline: 'Link đề chính thức',
  official_practice: 'Đề chính thức',
  sat_short: 'SAT — đoạn ngắn (25–150 từ)',
  sat_long: 'SAT — đoạn dài (500–750 từ)',
};

/** Tier nào thuộc kỳ thi nào — dùng để dựng bộ lọc theo kỳ thi đang chọn. */
export const TIERS_BY_EXAM: Record<ExamKind, PassageTier[]> = {
  ielts: ['p1', 'p2', 'p3', 'short_academic', 'official_practice'],
  // official_practice có ở cả hai: mỗi kỳ thi có link đề chính thức riêng.
  sat: ['sat_short', 'sat_long', 'official_practice'],
};

export const SAT_TEXT_TYPES: ReadonlyArray<{ value: SatTextType; label: string }> = [
  { value: 'literature', label: 'Văn học' },
  { value: 'history_social', label: 'Lịch sử & KHXH' },
  { value: 'humanities', label: 'Nhân văn' },
  { value: 'science', label: 'Khoa học' },
];

export type ArticleFilters = {
  search?: string;
  topic?: string;
  exam?: ExamKind | 'all';
  track?: ArticleMeta['track'] | 'all';
  tier?: PassageTier | 'all';
  satTextType?: SatTextType | 'all';
  level?: CefrLevel | 'all';
  /** Dải band IELTS của bài, ví dụ 'Band 6–7' (xem `BAND_RANGES`). */
  bandRange?: string | 'all';
  /** Tên nguồn, ví dụ 'Simple Wikipedia'. */
  source?: string | 'all';
  /** 'readable' = bài có toàn văn; 'headline' = bài chỉ tiêu đề, mở link gốc. */
  kind?: 'all' | 'readable' | 'headline';
  sort?: 'newest' | 'shortest' | 'longest' | 'easiest' | 'hardest' | 'title';
};

/** Các dải band có thật trong kho, từ thấp lên cao. */
export const BAND_RANGES: readonly string[] = [
  'Band 3–4',
  'Band 4–5',
  'Band 5–6',
  'Band 6–7',
  'Band 7–8',
  'Band 8–9',
];

/** Nguồn bài có thể lọc (chỉ nguồn bài đọc được, xếp theo số bài giảm dần). */
export const SOURCE_NAMES: readonly string[] = (() => {
  const count = new Map<string, number>();
  for (const a of ARTICLES) {
    if (a.licenseType === 'headline_only') continue;
    count.set(a.sourceName, (count.get(a.sourceName) ?? 0) + 1);
  }
  return [...count.entries()].filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1]).map(([name]) => name);
})();

export function getArticleById(id: string): ArticleMeta | undefined {
  return ARTICLES.find((a) => a.id === id);
}

/** Metadata + toàn văn, dùng ở màn đọc. undefined nếu không có bài hoặc mất chunk. */
export function getArticleWithBody(id: string): Article | undefined {
  const meta = getArticleById(id);
  if (!meta) return undefined;

  const body = getArticleBody(meta);
  if (!body) return undefined;

  return { ...meta, ...body };
}

/**
 * Như getArticleWithBody nhưng chờ chunk tải xong. Dùng ở máy chủ (API) và
 * ở mọi nơi cần chắc chắn có toàn văn; trên web, hàm đồng bộ có thể còn trả undefined.
 */
export async function loadArticleWithBody(id: string): Promise<Article | undefined> {
  const meta = getArticleById(id);
  if (!meta) return undefined;

  const body = await loadArticleBody(meta);
  if (!body) return undefined;

  return { ...meta, ...body };
}

/**
 * Đọc được trong app hay không.
 *
 * Kiểm giấy phép chứ không kiểm `bodyText`: index cố tình không mang toàn văn,
 * nên `Boolean(bodyText)` ở đây sẽ luôn sai. Giấy phép cũng đúng bản chất hơn —
 * bài Loại B và đề official đều dùng 'headline_only' và chỉ mở link ra ngoài.
 */
export function isReadable(article: Pick<ArticleMeta, 'licenseType'>): boolean {
  return article.licenseType !== 'headline_only';
}

export function filterArticles(filters: ArticleFilters = {}): ArticleMeta[] {
  const {
    search,
    topic,
    exam = 'all',
    track = 'all',
    tier = 'all',
    satTextType = 'all',
    level = 'all',
    bandRange = 'all',
    source = 'all',
    kind = 'all',
    sort = 'newest',
  } = filters;
  const needle = search?.trim().toLowerCase();

  const result = ARTICLES.filter((a) => {
    if (kind === 'readable' && !isReadable(a)) return false;
    if (kind === 'headline' && isReadable(a)) return false;
    if (topic && a.topic !== topic) return false;
    if (exam !== 'all' && a.exam !== exam) return false;
    // `track` chỉ có nghĩa với IELTS, nên lọc theo nó không được kéo theo bài SAT.
    if (track !== 'all' && (a.exam !== 'ielts' || a.track !== track)) return false;
    if (tier !== 'all' && a.passageTier !== tier) return false;
    if (satTextType !== 'all' && a.satTextType !== satTextType) return false;
    if (level !== 'all' && a.cefrLevel !== level) return false;
    if (bandRange !== 'all' && a.bandRange !== bandRange) return false;
    if (source !== 'all' && a.sourceName !== source) return false;

    if (needle) {
      const haystack = `${a.title} ${a.summary ?? ''} ${a.topic} ${a.sourceName}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    return true;
  });

  return sortArticles(result, sort);
}

function sortArticles(
  articles: ArticleMeta[],
  sort: NonNullable<ArticleFilters['sort']>,
): ArticleMeta[] {
  const copy = [...articles];

  switch (sort) {
    case 'shortest':
      return copy.sort((a, b) => (a.wordCount ?? 0) - (b.wordCount ?? 0));
    case 'longest':
      return copy.sort((a, b) => (b.wordCount ?? 0) - (a.wordCount ?? 0));
    case 'easiest':
      return copy.sort((a, b) => (a.readabilityScore ?? 99) - (b.readabilityScore ?? 99));
    case 'hardest':
      return copy.sort((a, b) => (b.readabilityScore ?? 0) - (a.readabilityScore ?? 0));
    case 'title':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'newest':
    default:
      return copy.sort((a, b) => {
        const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        return tb - ta;
      });
  }
}

export function topicLabel(slug: string): string {
  return TOPICS.find((t) => t.slug === slug)?.name ?? slug;
}

export function topicLabelVi(slug: string): string {
  return TOPICS.find((t) => t.slug === slug)?.nameVi ?? slug;
}

export function tierLabel(tier: PassageTier | null): string | null {
  return tier ? TIER_LABEL[tier] : null;
}

/**
 * Nhãn độ khó hợp với kỳ thi của bài.
 *
 * SAT không có thang band, nên gắn "Band 5–6" lên một trích đoạn SAT là thông
 * tin sai. Đổi lại dùng chính Flesch-Kincaid Grade đã chấm — nó vốn là bậc lớp
 * học ở Mỹ, đúng thước đo mà tài liệu SAT hay dùng.
 */
export function readingLevelLabel(
  article: Pick<ArticleMeta, 'exam' | 'bandRange' | 'readabilityScore'>,
): string | null {
  if (article.exam !== 'sat') return article.bandRange;
  if (article.readabilityScore === null) return null;
  return `Độ khó lớp ${Math.max(1, Math.round(article.readabilityScore))}`;
}

/** Thống kê nhanh cho banner Library. */
export function libraryStats() {
  const readable = ARTICLES.filter(isReadable);
  return {
    total: ARTICLES.length,
    readable: readable.length,
    headlines: ARTICLES.length - readable.length,
    sources: new Set(ARTICLES.map((a) => a.sourceName)).size,
    ielts: ARTICLES.filter((a) => a.exam === 'ielts').length,
    sat: ARTICLES.filter((a) => a.exam === 'sat').length,
  };
}
