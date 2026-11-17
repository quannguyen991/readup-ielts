import { generateFigure, periodOf } from './chart-generator';
import { FIGURE_SPECS } from './figure-specs';
import { deriveAnalysisKey } from './analysis-key';
import { WRITING_SAMPLES } from '@/data/writing-samples';
import { TID_TASK1_PROMPTS } from '@/data/tid';
import type { AnalysisKey, LineOrBarChart, MixedChart, Task1Chart, Task2Essay, WritingPrompt } from '@/lib/writing/types';

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
  { topicSlug: 'transport', subject: 'expanding urban public transport', counterpoint: 'building more roads for private cars' },
  { topicSlug: 'transport', subject: 'encouraging people to cycle to work', counterpoint: 'improving bus and train services' },
  { topicSlug: 'media', subject: 'getting news from social media', counterpoint: 'relying on established news organisations' },
  { topicSlug: 'media', subject: 'limiting the amount of advertising aimed at children', counterpoint: 'allowing parents to decide what children see' },
  { topicSlug: 'crime', subject: 'using longer prison sentences to reduce crime', counterpoint: 'investing in education and rehabilitation' },
  { topicSlug: 'crime', subject: 'installing surveillance cameras in public places', counterpoint: 'protecting individual privacy' },
  { topicSlug: 'government', subject: 'spending public money on preventive healthcare', counterpoint: 'treating illness after it develops' },
  { topicSlug: 'government', subject: 'providing free childcare for working families', counterpoint: 'leaving childcare arrangements to parents' },
  { topicSlug: 'culture', subject: 'preserving historic buildings in growing cities', counterpoint: 'replacing them with modern housing' },
  { topicSlug: 'culture', subject: 'teaching traditional arts in schools', counterpoint: 'giving more time to science and technology' },
  { topicSlug: 'tourism', subject: 'promoting international tourism', counterpoint: 'protecting local communities from overcrowding' },
  { topicSlug: 'tourism', subject: 'choosing local holidays instead of overseas trips', counterpoint: 'travelling abroad to experience other cultures' },
  { topicSlug: 'family', subject: 'parents spending more time with young children', counterpoint: 'children learning independence early' },
  { topicSlug: 'family', subject: 'older people living with their adult children', counterpoint: 'older people living independently' },
  { topicSlug: 'economy', subject: 'raising the minimum wage', counterpoint: 'helping businesses keep their costs low' },
  { topicSlug: 'economy', subject: 'measuring national success by quality of life', counterpoint: 'measuring it mainly by economic growth' },
  { topicSlug: 'work', subject: 'introducing a four-day working week', counterpoint: 'keeping a conventional five-day schedule' },
  { topicSlug: 'work', subject: 'changing jobs frequently during a career', counterpoint: 'staying with one employer for many years' },
  { topicSlug: 'housing', subject: 'building high-density housing near city centres', counterpoint: 'expanding suburbs with more private homes' },
  { topicSlug: 'housing', subject: 'renting a home rather than buying one', counterpoint: 'saving to own a property' },
  { topicSlug: 'food', subject: 'eating less meat to protect the environment', counterpoint: 'continuing to eat a traditional diet' },
  { topicSlug: 'food', subject: 'buying food produced locally', counterpoint: 'choosing a wider range of imported products' },
  { topicSlug: 'globalisation', subject: 'international companies operating in local markets', counterpoint: 'protecting small domestic businesses' },
  { topicSlug: 'globalisation', subject: 'young people adopting global popular culture', counterpoint: 'maintaining local customs and languages' },
  { topicSlug: 'privacy', subject: 'companies collecting data about their customers', counterpoint: 'using less personalised digital services' },
  { topicSlug: 'privacy', subject: 'using facial recognition in public spaces', counterpoint: 'requiring traditional identity checks' },
  { topicSlug: 'sport', subject: 'schools making daily physical education compulsory', counterpoint: 'allowing more time for academic subjects' },
  { topicSlug: 'sport', subject: 'professional athletes receiving very high salaries', counterpoint: 'teachers and nurses being paid more' },
  { topicSlug: 'agriculture', subject: 'using modern technology to increase food production', counterpoint: 'supporting small-scale traditional farming' },
  { topicSlug: 'agriculture', subject: 'converting farmland into housing', counterpoint: 'protecting land for future food supplies' },
  { topicSlug: 'volunteering', subject: 'young adults completing a period of community service', counterpoint: 'beginning their careers immediately' },
  { topicSlug: 'volunteering', subject: 'volunteering as part of a university degree', counterpoint: 'keeping education focused on academic study' },
];

const TEMPLATES: Record<Task2Essay, (t: Theme, variant: number) => string> = {
  opinion: (t, i) => [
    `Some people believe that ${t.subject} is the most effective way to improve modern life. To what extent do you agree or disagree?`,
    `It is often argued that ${t.subject} should be a priority for society. To what extent do you agree or disagree?`,
    `In the modern world, ${t.subject} is increasingly seen as essential. Do you agree or disagree with this view?`,
  ][i % 3]!,
  discussion: (t, i) => [
    `Some people think that ${t.subject} should be a priority, while others believe that ${t.counterpoint} matters more. Discuss both views and give your own opinion.`,
    `While some people support ${t.subject}, others prefer ${t.counterpoint}. Discuss both sides and give your own view.`,
    `There is disagreement about whether ${t.subject} or ${t.counterpoint} deserves greater attention. Discuss both views and give your opinion.`,
  ][i % 3]!,
  advantage_disadvantage: (t, i) => [
    `In many countries, ${t.subject} has become increasingly common. Do the advantages of this development outweigh the disadvantages?`,
    `More people are now choosing ${t.subject}. What are the advantages and disadvantages of this change?`,
    `The growing emphasis on ${t.subject} has affected many communities. Do the advantages outweigh the disadvantages?`,
  ][i % 3]!,
  problem_solution: (t, i) => [
    `Despite growing awareness, ${t.subject} remains difficult to achieve. What are the main causes of this, and what solutions can you suggest?`,
    `Many societies face challenges related to ${t.subject}. Why has this become a problem, and how could it be addressed?`,
    `${t.subject} is a concern in a number of countries. What problems does this create, and what measures could solve them?`,
  ][i % 3]!,
  two_part: (t, i) => [
    `Today more people are choosing ${t.subject} rather than ${t.counterpoint}. Why is this happening, and is it a positive or a negative development?`,
    `The popularity of ${t.subject} is increasing. What explains this trend, and what effects might it have on society?`,
    `In recent years, ${t.subject} has attracted growing attention. Why has this happened, and do you consider it beneficial?`,
  ][i % 3]!,
};

const ESSAY_KINDS = Object.keys(TEMPLATES) as Task2Essay[];

/** Band gợi ý xoay vòng để kho đề có cả đề dễ lẫn đề khó. */
const BANDS = [6.0, 6.5, 7.0];

/**
 * Đề Task 2 viết tay, đi kèm bộ sinh theo công thức ở trên.
 *
 * Bộ sinh tạo đủ năm dạng câu hỏi cho từng nhóm chủ đề để người học có thể
 * luyện cùng một lĩnh vực theo nhiều yêu cầu lập luận khác nhau.
 */
const TASK2_CURATED: WritingPrompt[] = [
  {
    id: 'w-t2-curated-technology-opinion',
    task: 'ielts_task2',
    promptText:
      'Some people believe that artificial intelligence will soon do most jobs better than humans. To what extent do you agree or disagree?',
    chartKind: null,
    chartData: null,
    essayKind: 'opinion',
    topicSlug: 'technology',
    difficultyBand: 5.5,
    timeLimitSeconds: 2400,
    minWords: 250,
    source: 'curated',
  },
  {
    id: 'w-t2-curated-education-discussion',
    task: 'ielts_task2',
    promptText:
      'Some people think that universities should focus mainly on preparing students for the job market, while others believe that they should focus on research and general knowledge. Discuss both views and give your own opinion.',
    chartKind: null,
    chartData: null,
    essayKind: 'discussion',
    topicSlug: 'education',
    difficultyBand: 6.0,
    timeLimitSeconds: 2400,
    minWords: 250,
    source: 'curated',
  },
  {
    id: 'w-t2-curated-society-advantage-disadvantage',
    task: 'ielts_task2',
    promptText:
      'In many cities, residents are giving up private cars and using shared bicycles and electric scooters instead. Do the advantages of this trend outweigh the disadvantages?',
    chartKind: null,
    chartData: null,
    essayKind: 'advantage_disadvantage',
    topicSlug: 'society',
    difficultyBand: 6.5,
    timeLimitSeconds: 2400,
    minWords: 250,
    source: 'curated',
  },
  {
    id: 'w-t2-curated-environment-problem-solution',
    task: 'ielts_task2',
    promptText:
      'Despite many public campaigns, households in most countries still throw away large amounts of edible food each year. What are the main causes of this problem, and what solutions can you suggest?',
    chartKind: null,
    chartData: null,
    essayKind: 'problem_solution',
    topicSlug: 'environment',
    difficultyBand: 6.5,
    timeLimitSeconds: 2400,
    minWords: 250,
    source: 'curated',
  },
  {
    id: 'w-t2-curated-health-two-part',
    task: 'ielts_task2',
    promptText:
      'Many people now prefer to exercise at home using online videos rather than joining a gym. Why is this happening, and is it a positive or a negative development?',
    chartKind: null,
    chartData: null,
    essayKind: 'two_part',
    topicSlug: 'health',
    difficultyBand: 7.0,
    timeLimitSeconds: 2400,
    minWords: 250,
    source: 'curated',
  },
  {
    id: 'w-t2-curated-science-opinion',
    task: 'ielts_task2',
    promptText:
      'Some people believe that scientists should concentrate on solving practical problems rather than carrying out research with no immediate use. To what extent do you agree or disagree?',
    chartKind: null,
    chartData: null,
    essayKind: 'opinion',
    topicSlug: 'science',
    difficultyBand: 7.5,
    timeLimitSeconds: 2400,
    minWords: 250,
    source: 'curated',
  },
];

export function generateTask2Prompts(): WritingPrompt[] {
  const out: WritingPrompt[] = [];

  TASK2_THEMES.forEach((theme, themeIndex) => {
    ESSAY_KINDS.forEach((kind, kindIndex) => {
      out.push({
        id: `w-t2-${theme.topicSlug}-${themeIndex}-${kind}`,
        task: 'ielts_task2',
        promptText: TEMPLATES[kind](theme, themeIndex + kindIndex),
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

  out.push(...TASK2_CURATED);
  out.push(
    ...WRITING_SAMPLES.filter((sample) => sample.task === 'ielts_task2').map((sample) => ({
      id: sample.promptId ?? `w-${sample.id}`,
      task: 'ielts_task2' as const,
      promptText: sample.promptText,
      chartKind: null,
      chartData: null,
      essayKind: sample.essayKind ?? 'opinion',
      topicSlug: sample.topicSlug,
      difficultyBand: sample.band,
      timeLimitSeconds: 2400,
      minWords: 250,
      source: 'curated' as const,
    })),
  );
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
  const prompts = FIGURE_SPECS.map((spec, index) => ({
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

  {
    const emptyKey: AnalysisKey = { trends: [], extremes: [], crossings: [], grouping: [[], []] };
    const lineBase: LineOrBarChart = {
      kind: 'line',
      title: 'Average commuting time by car and bus in Metroville, 2000 and 2020',
      unit: 'minutes per journey',
      xLabels: ['2000', '2020'],
      series: [
        { name: 'Car', values: [28, 36] },
        { name: 'Bus', values: [42, 44] },
      ],
      analysisKey: emptyKey,
    };
    const barBase: LineOrBarChart = {
      kind: 'bar',
      title: 'Commuters by transport mode in Metroville, 2000 and 2020',
      unit: '% of commuters',
      xLabels: ['Car', 'Bus', 'Train', 'Bicycle'],
      series: [
        { name: '2000', values: [62, 20, 12, 6] },
        { name: '2020', values: [48, 27, 18, 7] },
      ],
      analysisKey: emptyKey,
    };
    const commuteLine = { ...lineBase, analysisKey: deriveAnalysisKey(lineBase) };
    const commuteBars = { ...barBase, analysisKey: deriveAnalysisKey(barBase) };
    const analysisKey: AnalysisKey = {
      trends: [...commuteLine.analysisKey.trends, ...commuteBars.analysisKey.trends],
      extremes: [...commuteLine.analysisKey.extremes, ...commuteBars.analysisKey.extremes],
      crossings: [...commuteLine.analysisKey.crossings, ...commuteBars.analysisKey.crossings],
      grouping: [
        [...commuteLine.analysisKey.grouping[0], ...commuteBars.analysisKey.grouping[0]],
        [...commuteLine.analysisKey.grouping[1], ...commuteBars.analysisKey.grouping[1]],
      ],
    };
    const chartData: MixedChart = {
      kind: 'mixed',
      title: 'Commuting time and transport choices in Metroville',
      parts: [commuteBars, commuteLine],
      analysisKey,
    };
    prompts.push({
      id: 'w-t1-mixed-metroville-commuting',
      task: 'ielts_task1',
      promptText:
        'The bar chart compares the percentage of commuters using four transport modes, while the line graph shows average journey time in Metroville in 2000 and 2020.',
      chartKind: 'mixed',
      chartData,
      essayKind: null,
      topicSlug: 'transport',
      difficultyBand: 7.0,
      timeLimitSeconds: 1200,
      minWords: 150,
      source: 'generated',
    });
  }

  prompts.push(...TID_TASK1_PROMPTS);
  return prompts;
}
