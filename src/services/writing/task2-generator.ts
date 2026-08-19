import { generateFigure, periodOf } from './chart-generator';
import { FIGURE_SPECS } from './figure-specs';
import type { Task1Chart, Task2Essay, WritingPrompt } from '@/lib/writing/types';

/**
 * Bộ sinh đề.
 *
 * Đề IELTS là dữ kiện chứ không phải tác phẩm: cùng một dạng luận ghép với một
 * chủ đề thì ra một đề hợp lệ. Sinh theo công thức là đủ, và tránh hẳn chuyện
 * cào nguyên văn đề của bên khác.
 *
 * Không dùng RNG ở tầng này: danh sách chủ đề × dạng luận đã cố định nên thứ tự
 * đề cũng cố định. Chạy lại script không xáo trộn kho đề cũ, và người học không
 * thấy đề tự nhiên đổi chỗ giữa hai lần mở app.
 */

type Theme = {
  topicSlug: string;
  /** Cụm danh từ đứng làm chủ đề của câu lệnh. */
  subject: string;
  /** Vế đối lập, dùng cho dạng cần hai mặt. */
  counterpoint: string;
};

export const TASK2_THEMES: Theme[] = [
  {
    topicSlug: 'environment',
    subject: 'reducing plastic waste',
    counterpoint: 'investing in cleaner energy',
  },
  {
    topicSlug: 'environment',
    subject: 'protecting endangered species',
    counterpoint: 'developing new farmland',
  },
  { topicSlug: 'technology', subject: 'working from home', counterpoint: 'working in an office' },
  {
    topicSlug: 'technology',
    subject: 'children using smartphones',
    counterpoint: 'children playing outdoors',
  },
  {
    topicSlug: 'education',
    subject: 'studying abroad',
    counterpoint: 'studying in one own country',
  },
  {
    topicSlug: 'education',
    subject: 'learning a second language at primary school',
    counterpoint: 'starting at secondary school',
  },
  {
    topicSlug: 'health',
    subject: 'taxing sugary drinks',
    counterpoint: 'educating people about diet',
  },
  {
    topicSlug: 'health',
    subject: 'building more public sports facilities',
    counterpoint: 'funding hospitals',
  },
  {
    topicSlug: 'business',
    subject: 'starting a business at a young age',
    counterpoint: 'gaining experience first',
  },
  { topicSlug: 'society', subject: 'living in a city', counterpoint: 'living in the countryside' },
  {
    topicSlug: 'society',
    subject: 'spending public money on the arts',
    counterpoint: 'spending it on public transport',
  },
  {
    topicSlug: 'science',
    subject: 'funding space exploration',
    counterpoint: 'solving problems on Earth',
  },
];

const TEMPLATES: Record<Task2Essay, (t: Theme) => string> = {
  opinion: (t) =>
    `Some people believe that ${t.subject} is the most effective way to improve modern life. To what extent do you agree or disagree?`,
  discussion: (t) =>
    `Some people think that ${t.subject} should be a priority, while others believe that ${t.counterpoint} matters more. Discuss both views and give your own opinion.`,
  advantage_disadvantage: (t) =>
    `In many countries, ${t.subject} has become increasingly common. Do the advantages of this development outweigh the disadvantages?`,
  problem_solution: (t) =>
    `Despite growing awareness, ${t.subject} remains difficult to achieve. What are the main causes of this, and what solutions can you suggest?`,
  two_part: (t) =>
    `Today more people are choosing ${t.subject} rather than ${t.counterpoint}. Why is this happening, and is it a positive or a negative development?`,
};

const ESSAY_KINDS = Object.keys(TEMPLATES) as Task2Essay[];

/** Band gợi ý xoay vòng để kho đề có cả đề dễ lẫn đề khó. */
const BANDS = [6.0, 6.5, 7.0];

export function generateTask2Prompts(): WritingPrompt[] {
  const out: WritingPrompt[] = [];

  TASK2_THEMES.forEach((theme, themeIndex) => {
    ESSAY_KINDS.forEach((kind, kindIndex) => {
      // Mỗi chủ đề chỉ lấy 3 trong 5 dạng, lệch nhau theo chủ đề. Lấy đủ 5 thì
      // năm đề cùng một chủ đề đọc lên rất giống nhau.
      if ((kindIndex + themeIndex) % 5 >= 3) return;

      out.push({
        id: `w-t2-${theme.topicSlug}-${themeIndex}-${kind}`,
        task: 'ielts_task2',
        promptText: TEMPLATES[kind](theme),
        chartKind: null,
        chartData: null,
        essayKind: kind,
        topicSlug: theme.topicSlug,
        difficultyBand: BANDS[(themeIndex + kindIndex) % BANDS.length] ?? 6.5,
        timeLimitSeconds: 2400,
        minWords: 250,
        source: 'generated',
      });
    });
  });

  return out;
}

/** Câu lệnh chuẩn của Task 1, khác nhau theo loại hình. */
const TASK1_LEAD: Record<Task1Chart, string> = {
  line: 'The line graph below shows',
  bar: 'The bar chart below shows',
  pie: 'The pie charts below show',
  table: 'The table below shows',
  mixed: 'The charts below show',
  process: 'The diagram below shows',
  map: 'The maps below show',
};

export function generateTask1Prompts(): WritingPrompt[] {
  return FIGURE_SPECS.map((spec, index) => ({
    id: `w-t1-${spec.kind}-${spec.slug}`,
    task: 'ielts_task1',
    // `subject` đã viết thường và có sẵn mạo từ nên ghép vào là đọc trôi:
    // "The line graph below shows the average price of petrol…".
    promptText: `${TASK1_LEAD[spec.kind]} ${spec.subject}${periodOf(spec)}.`,
    chartKind: spec.kind,
    chartData: generateFigure(spec, 'v1'),
    essayKind: null,
    topicSlug: spec.topicSlug,
    difficultyBand: BANDS[index % BANDS.length] ?? 6.5,
    timeLimitSeconds: 1200,
    minWords: 150,
    source: 'generated',
  }));
}
