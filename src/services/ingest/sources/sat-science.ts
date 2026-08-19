import { pickExcerpts, toProseParagraphs } from '../excerpt';
import { fetchWikipediaCategories } from './wikipedia';
import type { TopicCategoryMap } from './category-map';
import type { FetchContext, RawArticle, SourceResult } from '../types';
import type { PassageTier, SatTextType } from '@/types/database';

/**
 * Passage SAT về khoa học và khoa học xã hội đương đại.
 *
 * Nguồn Gutenberg cho ra văn bản trước 1930; SAT thì luôn có một mảng khoa học
 * viết cho người đọc phổ thông thời nay. Wikipedia đúng đăng ký giọng văn đó —
 * văn giải thích, người thường đọc được — nên ở đây lấy bài Wikipedia rồi cắt
 * về khổ SAT thay vì lấy abstract tạp chí (abstract là văn viết cho đồng
 * nghiệp, dày thuật ngữ và số liệu, không giống passage SAT).
 *
 * Bộ chủ đề dưới đây CỐ TÌNH khác bộ của nhánh IELTS để hai kho bài không
 * chồng nội dung nhau.
 */

const SHORT_PER_ARTICLE = 2;
const LONG_PER_ARTICLE = 1;

/**
 * Trần số bài Wikipedia lấy về, KHÔNG phụ thuộc `ctx.limit` chung.
 *
 * Hai lý do. Ngân sách: mỗi bài đẻ ra tới 3 passage, mà `index.json` được bundle
 * thẳng vào app (~800 byte/bài) nên nhánh này dễ một mình chiếm hết chỗ. Chất
 * lượng: 14 category chia nhau hạn mức lớn thì phải quét sâu xuống đuôi danh
 * sách, chỗ toàn bài phụ và bài sơ khai.
 */
const MAX_SOURCE_ARTICLES = 120;

const SHORT_SPEC = { targetWords: 130, minWords: 60, maxWords: 150 } as const;
const LONG_SPEC = { targetWords: 720, minWords: 500, maxWords: 750 } as const;

/**
 * Category Wikipedia theo bốn nhánh nội dung SAT hay ra: sinh học tiến hoá,
 * thần kinh, vật liệu, thiên văn, kinh tế học hành vi, nhân học.
 */
const SAT_SCIENCE_CATEGORIES: TopicCategoryMap = [
  {
    topic: 'science',
    en: ['Evolutionary biology', 'Astrophysics', 'Materials science', 'Genetics', 'Paleontology'],
    simple: [],
  },
  {
    topic: 'health',
    en: ['Neuroscience', 'Immunology', 'Human genetics'],
    simple: [],
  },
  {
    topic: 'environment',
    en: ['Biodiversity', 'Oceanography', 'Atmospheric sciences'],
    simple: [],
  },
  {
    topic: 'psychology',
    en: ['Behavioral economics', 'Developmental psychology', 'Social psychology'],
    simple: [],
  },
  {
    topic: 'society',
    en: ['Anthropology', 'Linguistics', 'Archaeology'],
    simple: [],
  },
] as const;

/**
 * SAT xếp tâm lý học và kinh tế học hành vi vào nhánh khoa học xã hội thực
 * nghiệm, chứ không vào nhánh khoa học tự nhiên — bám đúng cách phân loại đó.
 */
const TEXT_TYPE_BY_TOPIC: Record<string, SatTextType> = {
  science: 'science',
  health: 'science',
  environment: 'science',
  psychology: 'history_social',
  society: 'history_social',
};

export async function fetchSatScience(ctx: FetchContext): Promise<SourceResult> {
  const limit = Math.min(ctx.limit, MAX_SOURCE_ARTICLES);
  const source = await fetchWikipediaCategories({ ...ctx, limit }, 'en', SAT_SCIENCE_CATEGORIES);

  const articles = source.articles.flatMap((raw) => toSatPassages(raw));

  ctx.log(
    `  ✓ SAT khoa học: ${articles.length} passage từ ${source.articles.length} bài Wikipedia`,
  );

  return { source: 'SAT — khoa học đương đại', articles, errors: source.errors };
}

/**
 * Cắt một bài dài thành các passage khổ SAT.
 *
 * Khác nhánh sách: bài báo/bài bách khoa không có bìa và mục lục, phần mở đầu
 * lại là phần súc tích nhất — nên không cắt bỏ đầu đuôi.
 */
function toSatPassages(raw: RawArticle): RawArticle[] {
  if (!raw.bodyText) return [];

  const paragraphs = toProseParagraphs(raw.bodyText);
  if (paragraphs.length === 0) return [];

  const noTrim = { skipHeadRatio: 0, skipTailRatio: 0 } as const;

  const long = pickExcerpts(paragraphs, { count: LONG_PER_ARTICLE, ...LONG_SPEC, ...noTrim });
  const short = pickExcerpts(paragraphs, {
    count: SHORT_PER_ARTICLE,
    ...SHORT_SPEC,
    ...noTrim,
    avoid: long.map((e) => ({ start: e.startIndex, end: e.startIndex + e.paragraphs.length })),
  });

  const satTextType = TEXT_TYPE_BY_TOPIC[raw.topic] ?? 'science';

  const build = (
    excerpt: (typeof short)[number],
    tier: Extract<PassageTier, 'sat_short' | 'sat_long'>,
    ordinal: number,
  ): RawArticle => ({
    ...raw,
    externalId: `sat-${raw.externalId}-${tier}-${excerpt.startIndex}`,
    title: `${raw.title} — ${tier === 'sat_short' ? 'passage' : 'long passage'} ${ordinal}`,
    exam: 'sat',
    satTextType,
    passageTier: tier,
    summary: `Trích đoạn khoa học khổ SAT từ bài "${raw.title}".`,
    bodyText: excerpt.paragraphs.join('\n\n'),
  });

  return [
    ...short.map((e, i) => build(e, 'sat_short', i + 1)),
    ...long.map((e, i) => build(e, 'sat_long', i + 1)),
  ];
}
