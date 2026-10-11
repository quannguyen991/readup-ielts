import { extractJson } from '@/services/ai/fallback';

/**
 * Chấm bài Viết TOEIC/TOEFL bằng AI. Chỉ ước lượng để luyện tập, không phải điểm chính thức.
 * Không chứa lời gọi mạng: phần gọi AI nằm ở route server, sau khi được bật có chủ đích.
 */

export type GradeCriterion = { name: string; score: number; comment: string };

export type IntlGrade = {
  /** Ước lượng 0–100, chỉ để luyện tập. */
  overall: number;
  criteria: GradeCriterion[];
  strengths: string[];
  improvements: string[];
};

export type GradeInput = {
  exam: 'toeic' | 'toefl';
  title: string;
  prompt: string;
  minWords: number;
  checklist: readonly string[];
  text: string;
};

const SYSTEM = [
  'Bạn là giáo viên chấm bài luyện thi TOEIC hoặc TOEFL cho người học Việt Nam.',
  'Chấm theo tiêu chí trong danh sách, cho mỗi tiêu chí điểm nguyên từ 0 đến 5.',
  'Nhận xét bằng tiếng Việt, ngắn gọn, nêu cụ thể câu hoặc chỗ nào cần sửa.',
  'Đây chỉ là ước lượng để luyện tập. Không khẳng định đây là điểm thi chính thức.',
  'Chỉ trả về một đối tượng JSON, không thêm chữ nào khác, theo khuôn:',
  '{"overall": số 0-100, "criteria": [{"name": "...", "score": 0-5, "comment": "..."}], "strengths": ["..."], "improvements": ["..."]}',
].join('\n');

export function buildGradeMessages(input: GradeInput): { system: string; user: string } {
  const user = [
    `Kỳ thi: ${input.exam === 'toeic' ? 'TOEIC' : 'TOEFL'}`,
    `Đề: ${input.title}`,
    `Yêu cầu: ${input.prompt}`,
    `Số từ tối thiểu gợi ý: ${input.minWords}`,
    'Tiêu chí:',
    ...input.checklist.map((c, i) => `${i + 1}. ${c}`),
    '',
    'Bài của người học:',
    input.text.slice(0, 4000),
  ].join('\n');
  return { system: SYSTEM, user };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Kiểm tra kết quả AI trước khi hiển thị. Sai khuôn thì báo lỗi, không hiện số bịa. */
export function parseIntlGrade(raw: string): IntlGrade {
  const data = extractJson<unknown>(raw);
  if (!isRecord(data)) throw new Error('grade: not an object');
  const overall = data.overall;
  if (typeof overall !== 'number' || !Number.isFinite(overall) || overall < 0 || overall > 100) {
    throw new Error('grade: overall out of range');
  }
  const criteriaRaw = data.criteria;
  if (!Array.isArray(criteriaRaw) || criteriaRaw.length === 0) throw new Error('grade: no criteria');
  const criteria = criteriaRaw.map((c): GradeCriterion => {
    if (!isRecord(c) || typeof c.name !== 'string' || typeof c.comment !== 'string') throw new Error('grade: bad criterion');
    if (typeof c.score !== 'number' || !Number.isInteger(c.score) || c.score < 0 || c.score > 5) {
      throw new Error('grade: score out of range');
    }
    return { name: c.name, score: c.score, comment: c.comment };
  });
  const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 5) : []);
  return { overall: Math.round(overall), criteria, strengths: strings(data.strengths), improvements: strings(data.improvements) };
}
