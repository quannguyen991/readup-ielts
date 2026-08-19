import type { ExamKind } from '@/types/database';
import type { FetchContext, RawArticle, SourceResult } from '../types';

/**
 * Đề luyện chính thức miễn phí: ielts.org, British Council, College Board và
 * Khan Academy.
 *
 * Danh sách TĨNH, không crawl, không tải PDF, không parse nội dung — chỉ lưu
 * tiêu đề + link + mô tả để app mở bằng expo-web-browser. Đây là Loại B:
 * licenseType 'headline_only' nên CHECK constraint ở DB tự chặn nếu ai đó
 * lỡ gán bodyText.
 *
 * Mọi URL dưới đây đã kiểm trả 200 ngày 10/08/2026.
 */
const ITEMS: ReadonlyArray<{
  key: string;
  title: string;
  url: string;
  /** Chỉ có nghĩa với IELTS; bài SAT để 'academic' cho khớp kiểu. */
  track: RawArticle['track'];
  exam: ExamKind;
  sourceName: string;
  summary: string;
}> = [
  {
    key: 'academic-reading-sample-tasks',
    title: 'IELTS Academic Reading — sample tasks (official)',
    url: 'https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test',
    track: 'academic',
    exam: 'ielts',
    sourceName: 'IELTS Official',
    summary: 'Bộ đề mẫu Academic Reading do IELTS phát hành, PDF 46 trang, kèm answer sheet.',
  },
  {
    key: 'general-training-reading-sample-tasks',
    title: 'IELTS General Training Reading — sample tasks (official)',
    url: 'https://ielts.org/take-a-test/preparation-resources/sample-test-questions/general-training-test',
    track: 'general_training',
    exam: 'ielts',
    sourceName: 'IELTS Official',
    summary: 'Bộ đề mẫu General Training Reading do IELTS phát hành, PDF 33 trang, kèm answer sheet.',
  },
  {
    key: 'british-council-reading-academic',
    title: 'British Council — Academic Reading practice test',
    url: 'https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests/reading/academic',
    track: 'academic',
    exam: 'ielts',
    sourceName: 'IELTS Official',
    summary: 'Đề Academic Reading luyện online miễn phí, có bản tải về để làm trên giấy.',
  },
  {
    key: 'british-council-reading-general',
    title: 'British Council — General Training Reading practice test',
    url: 'https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests/reading/general-training',
    track: 'general_training',
    exam: 'ielts',
    sourceName: 'IELTS Official',
    summary: 'Đề General Training Reading luyện online miễn phí, có bản tải về.',
  },
  {
    key: 'british-council-all-practice-tests',
    title: 'British Council — toàn bộ đề luyện 4 kỹ năng',
    url: 'https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests',
    track: 'academic',
    exam: 'ielts',
    sourceName: 'IELTS Official',
    summary: 'Trang tổng hợp đề luyện miễn phí cho cả bốn kỹ năng.',
  },
  {
    key: 'collegeboard-sat-practice',
    title: 'College Board — SAT practice (official)',
    url: 'https://satsuite.collegeboard.org/practice',
    track: 'academic',
    exam: 'sat',
    sourceName: 'College Board',
    summary:
      'Trang luyện thi chính thức của College Board: đề đầy đủ, câu hỏi mẫu và tài liệu tải về.',
  },
  {
    key: 'collegeboard-sat-full-length-tests',
    title: 'College Board — SAT full-length practice tests',
    url: 'https://satsuite.collegeboard.org/practice/practice-tests',
    track: 'academic',
    exam: 'sat',
    sourceName: 'College Board',
    summary:
      'Bộ đề SAT đầy đủ dạng số hoá, làm trong ứng dụng Bluebook hoặc tải bản giấy kèm đáp án.',
  },
  {
    key: 'khan-academy-digital-sat',
    title: 'Khan Academy — Official Digital SAT Prep',
    url: 'https://www.khanacademy.org/digital-sat',
    track: 'academic',
    exam: 'sat',
    sourceName: 'Khan Academy',
    summary: 'Khoá luyện SAT miễn phí do College Board uỷ quyền, có phần Reading and Writing riêng.',
  },
];

export function fetchOfficialPractice(ctx: FetchContext): SourceResult {
  const articles: RawArticle[] = ITEMS.map((item) => ({
    externalId: `official-${item.key}`,
    title: item.title,
    sourceName: item.sourceName,
    sourceUrl: item.url,
    topic: 'education',
    track: item.track,
    exam: item.exam,
    licenseType: 'headline_only',
    passageTier: 'official_practice',
    summary: item.summary,
    bodyText: null,
  }));

  ctx.log(`  ✓ Đề chính thức: ${articles.length} mục (link ra ngoài, không lưu nội dung)`);
  return { source: 'Đề chính thức', articles, errors: [] };
}
