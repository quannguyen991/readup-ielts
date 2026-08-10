import seed from './seed/articles.json';
import type { IngestedArticle } from '@/services/ingest/types';
import type { ArticleTrack, CefrLevel } from '@/types/database';

/**
 * Kho bài đọc trong app.
 *
 * Nguồn hiện tại là seed cào sẵn (chạy `npm run ingest` để làm mới), nên app
 * dùng được ngay cả khi chưa cấu hình Supabase. Khi đã có Supabase, cùng bộ
 * hàm này sẽ đọc từ bảng `articles` — chữ ký hàm giữ nguyên.
 */

export type Article = IngestedArticle;

export const ARTICLES: Article[] = seed as Article[];

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
] as const;

export const CEFR_LEVELS: CefrLevel[] = ['A2', 'B1', 'B2', 'C1', 'C2'];

export type ArticleFilters = {
  search?: string;
  topic?: string;
  track?: ArticleTrack | 'all';
  level?: CefrLevel | 'all';
  /** 'readable' = bài Loại A có toàn văn; 'headline' = bài Loại B chỉ tiêu đề. */
  kind?: 'all' | 'readable' | 'headline';
  sort?: 'newest' | 'shortest' | 'longest' | 'easiest' | 'hardest' | 'title';
};

export function getArticleById(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id);
}

export function isReadable(article: Article): boolean {
  return Boolean(article.bodyText) && article.licenseType !== 'headline_only';
}

export function filterArticles(filters: ArticleFilters = {}): Article[] {
  const { search, topic, track = 'all', level = 'all', kind = 'all', sort = 'newest' } = filters;
  const needle = search?.trim().toLowerCase();

  const result = ARTICLES.filter((a) => {
    if (kind === 'readable' && !isReadable(a)) return false;
    if (kind === 'headline' && isReadable(a)) return false;
    if (topic && a.topic !== topic) return false;
    if (track !== 'all' && a.track !== track) return false;
    if (level !== 'all' && a.cefrLevel !== level) return false;

    if (needle) {
      const haystack = `${a.title} ${a.summary ?? ''} ${a.topic} ${a.sourceName}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    return true;
  });

  return sortArticles(result, sort);
}

function sortArticles(articles: Article[], sort: NonNullable<ArticleFilters['sort']>): Article[] {
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

/** Thống kê nhanh cho banner Library. */
export function libraryStats() {
  const readable = ARTICLES.filter(isReadable);
  return {
    total: ARTICLES.length,
    readable: readable.length,
    headlines: ARTICLES.length - readable.length,
    sources: new Set(ARTICLES.map((a) => a.sourceName)).size,
  };
}
