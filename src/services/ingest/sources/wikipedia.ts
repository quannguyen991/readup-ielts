import { createPacer, fetchJson, mapWithConcurrency, sleep } from '../http';
import { TOPIC_CATEGORIES, type TopicCategoryMap } from './category-map';
import type { FetchContext, RawArticle, SourceResult } from '../types';

/**
 * Wikipedia + Simple Wikipedia (CC BY-SA 4.0) — Loại A, được lưu toàn văn
 * kèm attribution bắt buộc theo giấy phép.
 */

export type WikiPage = {
  pageid?: number;
  title?: string;
  extract?: string;
  missing?: boolean | string;
  thumbnail?: { source?: string };
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
      const page = await fetchExtract(host, title);

      if (!page) {
        errors.push(`${sourceName}: không có nội dung cho "${title}"`);
        continue;
      }

      const body = cleanExtract(page.extract ?? '');
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

/**
 * Lấy extract toàn bài cho MỘT tiêu đề. exlimit bị hạ xuống 1 nên không gộp được.
 *
 * `pace` tuỳ chọn: nhánh curated (fetchWikipedia) không truyền — tự giữ nhịp
 * riêng bằng sleep(900) không đổi. Nhánh crawl category truyền pacer dùng
 * chung xuống tận đây để fetchJson/fetchText xin nhịp cho TỪNG lần thử thật
 * (kể cả retry sau 429), không chỉ lần gọi logic đầu tiên.
 */
export async function fetchExtract(
  host: string,
  title: string,
  options?: { pace?: () => Promise<void> },
): Promise<WikiPage | null> {
  const url =
    `https://${host}/w/api.php?action=query&format=json&formatversion=2` +
    `&prop=extracts|pageimages&explaintext=1&exsectionformat=plain&piprop=thumbnail&pithumbsize=800` +
    `&redirects=1&titles=${encodeURIComponent(title)}`;

  const json = await fetchJson<unknown>(url, { pace: options?.pace });
  const pages = normalizePages(json);
  const page = pages[0];

  if (!page || page.missing || !page.extract) return null;
  return page;
}

function normalizePages(json: unknown): WikiPage[] {
  const pages = (json as { query?: { pages?: unknown } }).query?.pages;
  if (Array.isArray(pages)) return pages as never;
  if (pages && typeof pages === 'object') return Object.values(pages) as never;
  return [];
}

const STOP_HEADINGS =
  /^(References|See also|External links|Further reading|Notes|Bibliography|Sources|Citations|Footnotes)$/i;

/** Tối đa bấy nhiêu đoạn — đủ cho truncateToTier cắt theo tier lớn nhất. */
const MAX_PARAGRAPHS = 60;
/** Dưới ngần này từ thì là chú thích ảnh hoặc dòng lạc, không phải đoạn văn. */
const MIN_PARAGRAPH_WORDS = 12;

/**
 * Đổi extract của MediaWiki thành các đoạn văn thật, bỏ mục cuối bài.
 *
 * Định dạng của `explaintext=1&exsectionformat=plain` KHÔNG giống trực giác:
 * các đoạn trong cùng một mục cách nhau bằng MỘT dấu xuống dòng, còn hai dòng
 * trống chỉ xuất hiện trước tên mục. Tách theo `\n{2,}` như văn bản thường sẽ
 * dán nguyên một mục thành "một đoạn" và dính luôn tên mục vào đầu — đã gặp
 * thật: "Research topics Research in evolutionary biology covers…".
 *
 * Xuất ra ngoài để test được mà không cần gọi mạng.
 */
export function cleanExtract(extract: string): string {
  const kept: string[] = [];

  for (const section of extract.replace(/\r\n?/g, '\n').split(/\n{2,}/)) {
    const lines = section.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // Dòng đầu mục là tên mục khi nó ngắn và không kết bằng dấu câu.
    const heading = lines[0]!;
    const isHeading = !/[.!?]["'”’)]?$/.test(heading) && countWords(heading) <= 12;
    if (isHeading) {
      if (STOP_HEADINGS.test(heading.replace(/=/g, '').trim())) return kept.join('\n\n');
      lines.shift();
    }

    for (const line of lines) {
      if (countWords(line) < MIN_PARAGRAPH_WORDS) continue;
      kept.push(line.replace(/\s+/g, ' '));
      if (kept.length >= MAX_PARAGRAPHS) return kept.join('\n\n');
    }
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

/** Số thành viên lấy tối đa từ mỗi category trước khi lọc. */
const CATEGORY_MEMBER_LIMIT = 500;
/** Nhịp gọi: 400ms giữa hai request, 2 request song song. */
const FETCH_CONCURRENCY = 2;
const FETCH_SPACING_MS = 400;

/**
 * MỘT bộ điều nhịp dùng chung cho toàn bộ crawl theo category — cả request
 * liệt kê category lẫn request lấy extract đều xin nhịp từ đây, nên tổng tốc
 * độ gọi ra ngoài luôn bị chặn ở FETCH_SPACING_MS bất kể có bao nhiêu request
 * đang chạy song song. Xem createPacer trong http.ts để biết vì sao race-free.
 *
 * Được truyền xuống fetchJson (qua fetchCategoryTitles và fetchExtract) thay
 * vì gọi trực tiếp ở đây — fetchText tự gọi pace() ở ĐẦU MỖI LẦN THỬ trong
 * vòng lặp retry của nó, nên một request bị 429 rồi tự retry cũng bị chặn
 * đúng nhịp, không lách qua pacer được.
 */
const pace = createPacer(FETCH_SPACING_MS);

type CategoryMembersResponse = {
  query?: { categorymembers?: Array<{ title?: string }> };
  continue?: { cmcontinue?: string };
};

async function fetchCategoryTitles(host: string, category: string): Promise<string[]> {
  const titles: string[] = [];
  let cmcontinue: string | undefined;

  do {
    const url =
      `https://${host}/w/api.php?action=query&format=json&formatversion=2` +
      `&list=categorymembers&cmnamespace=0&cmlimit=${CATEGORY_MEMBER_LIMIT}` +
      `&cmtitle=${encodeURIComponent(`Category:${category}`)}` +
      (cmcontinue ? `&cmcontinue=${encodeURIComponent(cmcontinue)}` : '');

    // pace được truyền xuống fetchJson thay vì gọi ở đây, để retry bên trong
    // fetchText (khi gặp 429) cũng phải xin nhịp lại cho từng lần thử thật.
    const json = await fetchJson<CategoryMembersResponse>(url, { pace });
    for (const member of json.query?.categorymembers ?? []) {
      if (member.title) titles.push(member.title);
    }

    cmcontinue = json.continue?.cmcontinue;
  } while (cmcontinue && titles.length < CATEGORY_MEMBER_LIMIT);

  return titles;
}

/**
 * Crawl theo category để lấy số lượng lớn. Quality gate ở pipeline mới là chỗ
 * loại rác (trang định hướng, danh sách, stub...) — hàm này chỉ lo lấy về và
 * gắn đúng chủ đề, không tự lọc nội dung.
 */
export async function fetchWikipediaCategories(
  ctx: FetchContext,
  variant: 'en' | 'simple' = 'en',
  /** Bộ chủ đề khác, dùng khi cào cho kỳ thi khác (xem sat-science.ts). */
  categoryMap: TopicCategoryMap = TOPIC_CATEGORIES,
): Promise<SourceResult> {
  const host = variant === 'simple' ? 'simple.wikipedia.org' : 'en.wikipedia.org';
  const sourceName = variant === 'simple' ? 'Simple Wikipedia' : 'Wikipedia';
  const errors: string[] = [];

  // Gom tiêu đề theo chủ đề, chia đều hạn mức cho các chủ đề.
  const perTopic = Math.max(1, Math.ceil(ctx.limit / categoryMap.length));
  const wanted: Array<{ topic: string; title: string }> = [];
  // Dedupe theo tiêu đề trên toàn bộ crawl (không chỉ trong một category) để
  // một bài không bị tải hai lần khi nó nằm trong nhiều category/chủ đề.
  const seen = new Set<string>();

  for (const entry of categoryMap) {
    const categories = variant === 'simple' ? entry.simple : entry.en;
    const collected: string[] = [];

    for (const category of categories) {
      if (collected.length >= perTopic) break;
      try {
        for (const title of await fetchCategoryTitles(host, category)) {
          if (collected.length >= perTopic) break;
          if (seen.has(title)) continue;
          seen.add(title);
          collected.push(title);
        }
      } catch (err) {
        errors.push(
          `${sourceName} category "${category}": ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    for (const title of collected) wanted.push({ topic: entry.topic, title });
  }

  ctx.log(`  · ${sourceName}: ${wanted.length} tiêu đề từ category, bắt đầu tải extract`);

  const fetched = await mapWithConcurrency(wanted, FETCH_CONCURRENCY, async (item) => {
    // pace được truyền vào fetchExtract (rồi xuống fetchJson/fetchText) thay
    // vì gọi ở đây, cùng lý do như fetchCategoryTitles ở trên: một slot cho
    // MỖI lần thử thật, kể cả các lần retry sau 429.
    try {
      const page = await fetchExtract(host, item.title, { pace });
      if (!page) return null;

      const pageUrl = `https://${host}/wiki/${encodeURIComponent((page.title ?? item.title).replace(/ /g, '_'))}`;

      const article: RawArticle = {
        externalId: `${variant}-wiki-${page.pageid ?? item.title}`,
        title: page.title ?? item.title,
        sourceName,
        sourceUrl: pageUrl,
        topic: item.topic,
        track: 'academic',
        licenseType: 'cc_by_sa',
        attribution: `Nguồn: ${sourceName}, bài "${page.title ?? item.title}", giấy phép CC BY-SA 4.0. ${pageUrl}`,
        // Phải qua cleanExtract chứ không lưu extract thô: extract thô dán cả
        // một mục thành một "đoạn" khổng lồ, truncateToTier cắt trên đó sẽ ra
        // passage lệch khổ và dính tên mục vào giữa câu.
        bodyText: cleanExtract(page.extract ?? ''),
        thumbnailUrl: page.thumbnail?.source,
      };

      return article;
    } catch (err) {
      errors.push(`${sourceName} "${item.title}": ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  });

  const articles = fetched.filter((a): a is RawArticle => a !== null);
  ctx.log(`  ✓ ${sourceName}: ${articles.length} bài có nội dung`);

  return { source: sourceName, articles, errors };
}
