import { fetchText } from '../http';
import { parseFeed } from '../rss';
import type { FetchContext, RawArticle, SourceResult } from '../types';

/**
 * Nguồn RSS.
 *
 * Loại A (lưu toàn văn): cơ quan công / tổ chức phi lợi nhuận phát hành nội dung
 * public domain hoặc mở — VOA Learning English, NASA, NIH, ScienceDaily.
 * Chỉ lưu toàn văn khi feed tự cung cấp trong content:encoded; không bao giờ
 * đi cào thêm trang gốc.
 *
 * Loại B (chỉ tiêu đề): báo có bản quyền — BBC, Guardian, Reuters, Economist.
 * Lưu đúng những gì feed công khai: tiêu đề, mô tả ngắn, ảnh, link, ngày.
 */

type FeedSource = {
  key: string;
  name: string;
  url: string;
  topic: string;
  /** Loại A mới được phép lưu body. */
  fullText: boolean;
  license: RawArticle['licenseType'];
  attribution?: string;
};

export const FULL_TEXT_FEEDS: FeedSource[] = [
  {
    key: 'nasa',
    name: 'NASA',
    url: 'https://www.nasa.gov/news-release/feed/',
    topic: 'science',
    fullText: true,
    license: 'public_domain',
    attribution: 'Nguồn: NASA (public domain, U.S. Government).',
  },
  {
    key: 'cdc',
    name: 'CDC',
    url: 'https://tools.cdc.gov/api/v2/resources/media/132608.rss',
    topic: 'health',
    fullText: true,
    license: 'public_domain',
    attribution: 'Nguồn: U.S. Centers for Disease Control and Prevention (public domain).',
  },
];

export const HEADLINE_FEEDS: FeedSource[] = [
  {
    key: 'bbc',
    name: 'BBC News',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    topic: 'society',
    fullText: false,
    license: 'headline_only',
  },
  {
    key: 'guardian',
    name: 'The Guardian',
    url: 'https://www.theguardian.com/environment/rss',
    topic: 'environment',
    fullText: false,
    license: 'headline_only',
  },
  {
    key: 'npr-science',
    name: 'NPR Science',
    url: 'https://feeds.npr.org/1004/rss.xml',
    topic: 'science',
    fullText: false,
    license: 'headline_only',
  },
  {
    key: 'sciencedaily',
    name: 'ScienceDaily',
    url: 'https://www.sciencedaily.com/rss/top/science.xml',
    topic: 'science',
    fullText: false,
    license: 'headline_only',
  },
  {
    key: 'phys-org',
    name: 'Phys.org',
    url: 'https://phys.org/rss-feed/',
    topic: 'technology',
    fullText: false,
    license: 'headline_only',
  },
  {
    key: 'economist',
    name: 'The Economist',
    url: 'https://www.economist.com/business/rss.xml',
    topic: 'business',
    fullText: false,
    license: 'headline_only',
  },
];

export async function fetchFeed(source: FeedSource, ctx: FetchContext): Promise<SourceResult> {
  const articles: RawArticle[] = [];
  const errors: string[] = [];

  try {
    const xml = await fetchText(source.url, { timeoutMs: 25_000 });
    const items = parseFeed(xml);

    if (items.length === 0) errors.push(`${source.name}: feed rỗng hoặc không parse được`);

    for (const item of items) {
      if (articles.length >= ctx.limit) break;

      // Loại B: dứt khoát không lưu body, kể cả khi feed có content:encoded.
      const bodyText = source.fullText ? normalizeBody(item.content ?? item.description) : null;

      if (source.fullText && (!bodyText || countWords(bodyText) < 180)) continue;

      articles.push({
        externalId: `${source.key}-${hash(item.guid)}`,
        title: item.title,
        sourceName: source.name,
        sourceUrl: item.link,
        topic: source.topic,
        track: source.fullText ? 'academic' : 'general_training',
        licenseType: source.license,
        ...(source.attribution ? { attribution: source.attribution } : {}),
        ...(item.pubDate ? { publishedAt: toIso(item.pubDate) } : {}),
        summary: item.description.slice(0, 400),
        bodyText,
        ...(item.thumbnail ? { thumbnailUrl: item.thumbnail } : {}),
      });
    }

    ctx.log(`  ✓ ${source.name}: ${articles.length} bài`);
  } catch (err) {
    errors.push(`${source.name}: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { source: source.name, articles, errors };
}

function normalizeBody(text: string | null): string | null {
  if (!text) return null;

  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.split(/\s+/).length >= 12);

  return paragraphs.length > 0 ? paragraphs.join('\n\n') : null;
}

function countWords(text: string): number {
  return (text.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).length;
}

function toIso(value: string): string | undefined {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function hash(value: string): string {
  let h = 5381;
  for (let i = 0; i < value.length; i += 1) h = ((h << 5) + h + value.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
