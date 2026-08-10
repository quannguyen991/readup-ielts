import { fetchJson, sleep } from '../http';
import type { FetchContext, RawArticle, SourceResult } from '../types';

/**
 * Wikipedia + Simple Wikipedia (CC BY-SA 4.0) — Loại A, được lưu toàn văn
 * kèm attribution bắt buộc theo giấy phép.
 */

type ExtractResponse = {
  query?: {
    pages?: Record<
      string,
      {
        pageid?: number;
        title?: string;
        extract?: string;
        missing?: string;
        thumbnail?: { source?: string };
      }
    >;
  };
};

/** Chủ đề bám sát dải đề tài IELTS Reading hay gặp. */
const TOPIC_TITLES: Array<{ topic: string; titles: string[] }> = [
  { topic: 'environment', titles: ['Great Barrier Reef', 'Coral bleaching', 'Deforestation', 'Renewable energy', 'Glacier'] },
  { topic: 'technology', titles: ['Artificial intelligence', 'Machine learning', 'Internet of things', '3D printing'] },
  { topic: 'education', titles: ['Lifelong learning', 'Bilingual education', 'Distance education'] },
  { topic: 'health', titles: ['Sleep', 'Vaccine', 'Nutrition', 'Antibiotic resistance'] },
  { topic: 'science', titles: ['Photosynthesis', 'Plate tectonics', 'Antarctica', 'Solar power'] },
  { topic: 'business', titles: ['Globalization', 'Remote work', 'Supply chain'] },
  { topic: 'society', titles: ['Urbanization', 'Public transport', 'Sustainable city'] },
  { topic: 'culture', titles: ['Silk Road', 'Intangible cultural heritage', 'Traditional medicine'] },
  { topic: 'history', titles: ['Industrial Revolution', 'Ancient Rome', 'Printing press'] },
  { topic: 'psychology', titles: ['Memory', 'Motivation', 'Cognitive bias', 'Circadian rhythm'] },
];

export async function fetchWikipedia(
  ctx: FetchContext,
  variant: 'en' | 'simple' = 'en',
): Promise<SourceResult> {
  const host = variant === 'simple' ? 'simple.wikipedia.org' : 'en.wikipedia.org';
  const sourceName = variant === 'simple' ? 'Simple Wikipedia' : 'Wikipedia';
  const articles: RawArticle[] = [];
  const errors: string[] = [];

  const wanted = TOPIC_TITLES.flatMap((t) => t.titles.map((title) => ({ topic: t.topic, title })));

  for (const { topic, title } of wanted) {
    if (articles.length >= ctx.limit) break;

    // Wikipedia trả 429 nếu gọi liên tiếp quá nhanh — giữ nhịp lịch sự.
    await sleep(900);

    try {
      const url =
        `https://${host}/w/api.php?action=query&format=json&formatversion=2` +
        `&prop=extracts|pageimages&explaintext=1&exsectionformat=plain&piprop=thumbnail&pithumbsize=800` +
        `&redirects=1&titles=${encodeURIComponent(title)}`;

      const json = await fetchJson<ExtractResponse & { query?: { pages?: unknown } }>(url);
      const pages = normalizePages(json);
      const page = pages[0];

      if (!page || page.missing || !page.extract) {
        errors.push(`${sourceName}: không có nội dung cho "${title}"`);
        continue;
      }

      const body = cleanExtract(page.extract);
      if (countWords(body) < 250) {
        errors.push(`${sourceName}: "${title}" quá ngắn`);
        continue;
      }

      const pageUrl = `https://${host}/wiki/${encodeURIComponent((page.title ?? title).replace(/ /g, '_'))}`;

      articles.push({
        externalId: `${variant}-wiki-${page.pageid ?? title}`,
        title: page.title ?? title,
        sourceName,
        sourceUrl: pageUrl,
        topic,
        track: 'academic',
        licenseType: 'cc_by_sa',
        attribution: `Nguồn: ${sourceName}, bài "${page.title ?? title}", giấy phép CC BY-SA 4.0. ${pageUrl}`,
        bodyText: body,
        summary: firstSentences(body, 2),
        thumbnailUrl: page.thumbnail?.source,
      });

      ctx.log(`  ✓ ${sourceName}: ${page.title ?? title}`);
    } catch (err) {
      errors.push(`${sourceName} "${title}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { source: sourceName, articles, errors };
}

function normalizePages(json: unknown): Array<{
  pageid?: number;
  title?: string;
  extract?: string;
  missing?: boolean | string;
  thumbnail?: { source?: string };
}> {
  const pages = (json as { query?: { pages?: unknown } }).query?.pages;
  if (Array.isArray(pages)) return pages as never;
  if (pages && typeof pages === 'object') return Object.values(pages) as never;
  return [];
}

/** Bỏ các mục cuối bài (References, See also...) và đoạn quá ngắn. */
function cleanExtract(extract: string): string {
  const stopHeadings = /^(References|See also|External links|Further reading|Notes|Bibliography|Sources)$/i;

  const kept: string[] = [];
  for (const block of extract.split(/\n{2,}/)) {
    const line = block.trim();
    if (!line) continue;
    if (stopHeadings.test(line.replace(/=/g, '').trim())) break;
    if (/^==+.*==+$/.test(line)) continue; // tiêu đề mục
    if (line.split(/\s+/).length < 12) continue;
    kept.push(line.replace(/\s+/g, ' '));
    if (kept.length >= 14) break;
  }

  return kept.join('\n\n');
}

function countWords(text: string): number {
  return (text.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).length;
}

function firstSentences(text: string, count: number): string {
  const sentences = text.split(/(?<=[.!?])\s+/).slice(0, count);
  return sentences.join(' ').slice(0, 300);
}
