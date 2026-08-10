import type { ArticleTrack, CefrLevel, LicenseType } from '@/types/database';

/** Bài đọc thô do một nguồn trả về, trước khi chấm độ khó và chuẩn hoá. */
export type RawArticle = {
  /** Định danh ổn định theo nguồn, dùng để chống trùng giữa các lần chạy. */
  externalId: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  topic: string;
  track: ArticleTrack;
  licenseType: LicenseType;
  attribution?: string;
  publishedAt?: string;
  summary?: string;
  /** null với nguồn Loại B — tuyệt đối không lưu toàn văn báo có bản quyền. */
  bodyText: string | null;
  thumbnailUrl?: string;
};

/** Bài đọc đã chuẩn hoá, sẵn sàng ghi vào seed hoặc Supabase. */
export type IngestedArticle = {
  id: string;
  externalId: string;
  title: string;
  slug: string;
  sourceName: string;
  sourceUrl: string;
  topic: string;
  track: ArticleTrack;
  licenseType: LicenseType;
  attribution: string | null;
  publishedAt: string | null;
  summary: string | null;
  bodyText: string | null;
  paragraphs: string[];
  thumbnailUrl: string | null;
  cefrLevel: CefrLevel | null;
  bandRange: string | null;
  wordCount: number | null;
  estMinutes: number | null;
  readabilityScore: number | null;
  rareWordRatio: number | null;
};

export type SourceResult = {
  source: string;
  articles: RawArticle[];
  errors: string[];
};

export type FetchContext = {
  /** Số bài tối đa lấy từ nguồn này. */
  limit: number;
  log: (message: string) => void;
};
