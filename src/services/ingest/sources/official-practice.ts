import type { FetchContext, RawArticle, SourceResult } from '../types';

/**
 * Đề luyện chính thức miễn phí của ielts.org và British Council.
 *
 * Danh sách TĨNH, không crawl, không tải PDF, không parse nội dung — chỉ lưu
 * tiêu đề + link + mô tả để app mở bằng expo-web-browser. Đây là Loại B:
 * licenseType 'headline_only' nên CHECK constraint ở DB tự chặn nếu ai đó
 * lỡ gán bodyText.
 */
const ITEMS: ReadonlyArray<{
  key: string;
  title: string;
  url: string;
  track: RawArticle['track'];
  summary: string;
}> = [
  {
    key: 'academic-reading-sample-tasks',
    title: 'IELTS Academic Reading — sample tasks (official)',
    url: 'https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test',
    track: 'academic',
    summary: 'Bộ đề mẫu Academic Reading do IELTS phát hành, PDF 46 trang, kèm answer sheet.',
  },
  {
    key: 'general-training-reading-sample-tasks',
    title: 'IELTS General Training Reading — sample tasks (official)',
    url: 'https://ielts.org/take-a-test/preparation-resources/sample-test-questions/general-training-test',
    track: 'general_training',
    summary: 'Bộ đề mẫu General Training Reading do IELTS phát hành, PDF 33 trang, kèm answer sheet.',
  },
  {
    key: 'british-council-reading-academic',
    title: 'British Council — Academic Reading practice test',
    url: 'https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests/reading/academic',
    track: 'academic',
    summary: 'Đề Academic Reading luyện online miễn phí, có bản tải về để làm trên giấy.',
  },
  {
    key: 'british-council-reading-general',
    title: 'British Council — General Training Reading practice test',
    url: 'https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests/reading/general-training',
    track: 'general_training',
    summary: 'Đề General Training Reading luyện online miễn phí, có bản tải về.',
  },
  {
    key: 'british-council-all-practice-tests',
    title: 'British Council — toàn bộ đề luyện 4 kỹ năng',
    url: 'https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests',
    track: 'academic',
    summary: 'Trang tổng hợp đề luyện miễn phí cho cả bốn kỹ năng.',
  },
];

export function fetchOfficialPractice(ctx: FetchContext): SourceResult {
  const articles: RawArticle[] = ITEMS.map((item) => ({
    externalId: `official-${item.key}`,
    title: item.title,
    sourceName: 'IELTS Official',
    sourceUrl: item.url,
    topic: 'education',
    track: item.track,
    licenseType: 'headline_only',
    passageTier: 'official_practice',
    summary: item.summary,
    bodyText: null,
  }));

  ctx.log(`  ✓ IELTS Official: ${articles.length} mục (link ra ngoài, không lưu nội dung)`);
  return { source: 'IELTS Official', articles, errors: [] };
}
