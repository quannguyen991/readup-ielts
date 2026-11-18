import type { Bi } from './types';

export type SatMathDomain =
  | 'algebra'
  | 'advanced_math'
  | 'problem_solving_data'
  | 'geometry_trig'
  | 'extension';

export type SatMathScope = 'core' | 'extension';

export type SatMathChapterAlignment = {
  domain: SatMathDomain;
  scope: SatMathScope;
};

/**
 * Crosswalk from the 27-chapter College Panda-based route to the current
 * College Board Digital SAT Math domains. A chapter can teach useful algebra
 * beyond the exact skill labels in the current test blueprint; those chapters
 * are marked as enrichment instead of being treated as required test content.
 */
export const SAT_MATH_CHAPTER_ALIGNMENT: Readonly<Record<string, SatMathChapterAlignment>> = {
  'exponents-radicals': { domain: 'advanced_math', scope: 'core' },
  percent: { domain: 'problem_solving_data', scope: 'core' },
  'exponential-vs-linear': { domain: 'problem_solving_data', scope: 'core' },
  proportion: { domain: 'problem_solving_data', scope: 'core' },
  rates: { domain: 'problem_solving_data', scope: 'core' },
  expressions: { domain: 'advanced_math', scope: 'core' },
  'solving-equations': { domain: 'algebra', scope: 'core' },
  'equation-strategies': { domain: 'algebra', scope: 'core' },
  systems: { domain: 'algebra', scope: 'core' },
  inequalities: { domain: 'algebra', scope: 'core' },
  'word-problems': { domain: 'algebra', scope: 'core' },
  lines: { domain: 'algebra', scope: 'core' },
  'linear-models': { domain: 'algebra', scope: 'core' },
  functions: { domain: 'advanced_math', scope: 'core' },
  quadratics: { domain: 'advanced_math', scope: 'core' },
  'synthetic-division': { domain: 'extension', scope: 'extension' },
  'complex-numbers': { domain: 'extension', scope: 'extension' },
  'absolute-value': { domain: 'advanced_math', scope: 'core' },
  angles: { domain: 'geometry_trig', scope: 'core' },
  triangles: { domain: 'geometry_trig', scope: 'core' },
  circles: { domain: 'geometry_trig', scope: 'core' },
  trigonometry: { domain: 'geometry_trig', scope: 'core' },
  'reading-data': { domain: 'problem_solving_data', scope: 'core' },
  probability: { domain: 'problem_solving_data', scope: 'core' },
  'statistics-1': { domain: 'problem_solving_data', scope: 'core' },
  'statistics-2': { domain: 'problem_solving_data', scope: 'core' },
  volume: { domain: 'geometry_trig', scope: 'core' },
};

export const SAT_MATH_DOMAIN_INFO: Readonly<Record<SatMathDomain, {
  label: Bi;
  weight: string;
  questionRange: string;
}>> = {
  algebra: {
    label: { vi: 'Đại số', en: 'Algebra' },
    weight: '~35%',
    questionRange: '13–15 câu',
  },
  advanced_math: {
    label: { vi: 'Toán nâng cao', en: 'Advanced Math' },
    weight: '~35%',
    questionRange: '13–15 câu',
  },
  problem_solving_data: {
    label: { vi: 'Giải quyết vấn đề & phân tích dữ liệu', en: 'Problem-Solving and Data Analysis' },
    weight: '~15%',
    questionRange: '5–7 câu',
  },
  geometry_trig: {
    label: { vi: 'Hình học & lượng giác', en: 'Geometry and Trigonometry' },
    weight: '~15%',
    questionRange: '5–7 câu',
  },
  extension: {
    label: { vi: 'Mở rộng ngoài khung trọng tâm', en: 'Enrichment beyond the core blueprint' },
    weight: 'Tùy chọn',
    questionRange: 'Không tính vào 25 chủ đề cốt lõi',
  },
};

export function satMathChapterAlignment(id: string): SatMathChapterAlignment {
  return SAT_MATH_CHAPTER_ALIGNMENT[id] ?? { domain: 'extension', scope: 'extension' };
}
