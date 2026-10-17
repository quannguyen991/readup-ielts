import type { TrendFact, WritingPrompt } from '@/lib/writing/types';

/**
 * Hướng dẫn viết và triển khai cho từng đề Writing.
 *
 * Mọi nội dung suy ra từ chính đề (`chartData.analysisKey`, `essayKind`, số từ,
 * thời gian) bằng luật cố định, không gọi AI: cùng một đề luôn ra cùng một
 * hướng dẫn, không tốn tiền, và chạy được khi offline. Đổi đề thì hướng dẫn đổi
 * theo, không ai phải viết tay từng bài.
 */

export type GuideTone = 'orange' | 'green';

export type GuideSection = {
  heading: string;
  tone: GuideTone;
  paragraphs: string[];
  bullets?: string[];
};

export type WritingGuide = {
  /** Nhãn các mục bài viết tương ứng với khung đề (Introduction, Overview, Body…). */
  sectionKeys: { key: string; label: string }[];
  sections: GuideSection[];
};

const KIND_VI: Record<string, string> = {
  line: 'biểu đồ đường',
  bar: 'biểu đồ cột',
  pie: 'biểu đồ tròn',
  table: 'bảng số liệu',
  mixed: 'biểu đồ kết hợp',
  process: 'quy trình',
  map: 'bản đồ',
};

const KIND_EN: Record<string, string> = {
  line: 'line graph',
  bar: 'bar chart',
  pie: 'pie chart',
  table: 'table',
  mixed: 'charts',
  process: 'diagram',
  map: 'maps',
};

const ESSAY_TIP: Record<string, string> = {
  opinion: 'Nêu rõ quan điểm (đồng ý hay không) ở Introduction và nhắc lại ở Conclusion.',
  discussion: 'Trình bày lần lượt hai quan điểm, rồi nêu ý kiến riêng của bạn.',
  advantage_disadvantage: 'Body 1 nêu lợi thế, Body 2 nêu bất lợi. Đừng trộn hai ý vào một đoạn.',
  problem_solution: 'Body 1 mô tả vấn đề và nguyên nhân; Body 2 đề xuất giải pháp cụ thể.',
  two_part: 'Trả lời đủ cả hai vế của đề, mỗi vế một đoạn thân bài.',
};

const DIRECTION_VI: Record<string, string> = {
  up: 'tăng',
  down: 'giảm',
  stable: 'ổn định',
};

const MAGNITUDE_VI: Record<string, string> = {
  large: 'mạnh',
  small: 'nhẹ',
  medium: 'vừa',
};

export function writingGuide(prompt: WritingPrompt): WritingGuide {
  const minutes = Math.round(prompt.timeLimitSeconds / 60);
  const plan = planStep(prompt, minutes);

  if (prompt.task === 'ielts_task1') {
    return task1Guide(prompt, plan);
  }
  return task2Guide(prompt, plan);
}

function planStep(prompt: WritingPrompt, minutes: number): GuideSection {
  const overview = Math.round(minutes * 0.2);
  const body = Math.round(minutes * 0.4);
  const check = Math.max(1, minutes - overview - body - Math.round(minutes * 0.15));
  return {
    heading: 'Hướng dẫn triển khai',
    tone: 'green',
    paragraphs: [
      `Tổng thời gian gợi ý ${minutes} phút, tối thiểu ${prompt.minWords} từ. Chia thời gian như sau:`,
    ],
    bullets: [
      `Đọc đề và gạch chân 2–3 từ khoá: khoảng ${Math.max(2, Math.round(minutes * 0.1))} phút.`,
      `Lập dàn ý (ý chính của từng đoạn): khoảng ${overview} phút.`,
      `Viết Introduction, rồi ${prompt.task === 'ielts_task1' ? 'Overview' : 'Body 1'}: khoảng ${body} phút.`,
      `Viết nốt phần thân bài và kết luận, sau đó soát lỗi và đếm từ: khoảng ${check} phút.`,
    ],
  };
}

function task1Guide(prompt: WritingPrompt, plan: GuideSection): WritingGuide {
  const data = prompt.chartData;
  const kind = KIND_VI[prompt.chartKind ?? 'line'] ?? 'biểu đồ';
  const title = data?.title ?? '';
  const unit = data && 'unit' in data && data.unit ? `, đơn vị ${data.unit}` : '';
  const span = data && 'xLabels' in data && data.xLabels.length
    ? ` từ ${data.xLabels[0]} đến ${data.xLabels[data.xLabels.length - 1]}`
    : '';

  const trends = data?.analysisKey.trends ?? [];
  const extremes = data?.analysisKey.extremes ?? [];
  const grouping = data?.analysisKey.grouping ?? [[], []];

  const bodyOne = trends.filter((t) => grouping[0].includes(t.subject));
  const bodyTwo = trends.filter((t) => grouping[1].includes(t.subject));

  return {
    sectionKeys: [
      { key: 'intro', label: 'Introduction' },
      { key: 'overview', label: 'Overview' },
      { key: 'body1', label: 'Body 1' },
      { key: 'body2', label: 'Body 2' },
    ],
    sections: [
      {
        heading: '1. Giải thích đề',
        tone: 'orange',
        paragraphs: [
          `Đề cho ${kind}${span} về "${title}"${unit}. Bạn phải mô tả xu hướng chính và so sánh các đối tượng, không liệt kê từng con số.`,
        ],
      },
      {
        heading: '2. Định hướng Introduction',
        tone: 'orange',
        paragraphs: [
          `Paraphrase tiêu đề, nêu loại biểu đồ, các đối tượng được so sánh và khoảng thời gian. Mẫu gợi ý: "The ${KIND_EN[prompt.chartKind ?? "line"] ?? "chart"} illustrates…" (tự viết lại bằng cách diễn đạt của bạn).`,
        ],
      },
      {
        heading: '3. Định hướng Overview',
        tone: 'orange',
        paragraphs: [
          'Overview chỉ nêu hai điều: xu hướng chung và điểm cực trị. Không đưa số liệu chi tiết vào đây.',
        ],
        bullets: [
          ...trends.map((t) => trendLine(t)),
          ...extremes.map((e) => `${e.subject} ${e.rank === 'highest' ? 'cao nhất' : 'thấp nhất'}${e.at === 'throughout' ? ' suốt kỳ' : ` ở ${e.at}`}.`),
        ].slice(0, 6),
      },
      {
        heading: '4. Phân chia BODY rõ ràng',
        tone: 'orange',
        paragraphs: [
          'Chia thân bài thành hai đoạn, mỗi đoạn nhóm các đối tượng có xu hướng gần nhau.',
        ],
      },
      {
        heading: `BODY 1: ${grouping[0].join(', ') || 'nhóm đầu'}`,
        tone: 'green',
        paragraphs: ['Mô tả xu hướng và mốc đầu–cuối của nhóm này, theo thứ tự thời gian.'],
        bullets: bodyOne.map((t) => trendLine(t)),
      },
      {
        heading: `BODY 2: ${grouping[1].join(', ') || 'nhóm còn lại'}`,
        tone: 'green',
        paragraphs: ['Mô tả nhóm còn lại và so sánh với Body 1 (cao hơn, thấp hơn, gần bằng nhau).'],
        bullets: bodyTwo.map((t) => trendLine(t)),
      },
      plan,
    ],
  };
}

function task2Guide(prompt: WritingPrompt, plan: GuideSection): WritingGuide {
  const tip = ESSAY_TIP[prompt.essayKind ?? 'opinion'] ?? '';
  return {
    sectionKeys: [
      { key: 'intro', label: 'Introduction' },
      { key: 'body1', label: 'Body 1' },
      { key: 'body2', label: 'Body 2' },
      { key: 'conclusion', label: 'Conclusion' },
    ],
    sections: [
      {
        heading: '1. Giải thích đề',
        tone: 'orange',
        paragraphs: [`Dạng bài: ${essayLabel(prompt.essayKind)}. ${tip}`],
      },
      {
        heading: '2. Định hướng Introduction',
        tone: 'orange',
        paragraphs: ['Paraphrase đề trong 1–2 câu, rồi nêu rõ quan điểm hoặc luận điểm chính. Không viết ví dụ ở đây.'],
      },
      {
        heading: '3. Định hướng Body 1',
        tone: 'orange',
        paragraphs: ['Topic sentence nêu một ý chính, giải thích vì sao ý đó đúng, rồi đưa một ví dụ cụ thể.'],
      },
      {
        heading: '4. Định hướng Body 2',
        tone: 'orange',
        paragraphs: ['Làm tương tự Body 1 với ý thứ hai. Ý này phải khác hẳn ý đầu, không lặp lại cùng một lập luận.'],
      },
      {
        heading: '5. Định hướng Conclusion',
        tone: 'orange',
        paragraphs: ['Tóm lại quan điểm đã nêu ở Introduction bằng cách diễn đạt khác. Không thêm ý mới.'],
      },
      plan,
    ],
  };
}

function trendLine(t: TrendFact): string {
  const dir = DIRECTION_VI[t.direction] ?? t.direction;
  const mag = MAGNITUDE_VI[t.magnitude] ?? '';
  if (t.direction === 'stable') return `${t.subject}: ổn định quanh ${t.to}.`;
  return `${t.subject}: ${dir} ${mag} từ ${t.from} lên ${t.to}.`;
}

function essayLabel(kind: WritingPrompt['essayKind']): string {
  switch (kind) {
    case 'opinion':
      return 'ý kiến cá nhân';
    case 'discussion':
      return 'thảo luận hai quan điểm';
    case 'advantage_disadvantage':
      return 'lợi thế và bất lợi';
    case 'problem_solution':
      return 'vấn đề và giải pháp';
    case 'two_part':
      return 'hai vế';
    default:
      return 'luận';
  }
}
