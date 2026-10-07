import type { MathDifficulty, MathDomain, MathItem, MathSkill } from '@/lib/math/types';
import { MATH_DOMAIN_LABEL, MATH_SKILL_DOMAIN } from '@/lib/math/types';
import type { DifficultyMix } from '@/lib/difficulty';
import { generateMathItem } from './generator';
import { MATH_TEMPLATES, templatesForSkill } from './templates';
import type { MathSetKind } from '@/lib/math/theme';
import { hashString, mulberry32, shuffle } from '@/services/questions/rng';

export type MathCourseLevel = 'foundation' | 'medium' | 'advanced';

export const UNIT_TEST_PASS_THRESHOLD = 0.75;

export type MathCourseUnit = {
  id: string;
  number: number;
  title: { vi: string; en: string };
  blurb: { vi: string; en: string };
  level: MathCourseLevel | null;
  difficulty: MathDifficulty | null;
  domain: MathDomain | null;
  skills: MathSkill[];
};

export type MathCourseAssessment = {
  id: string;
  courseUnitId: string;
  title: string;
  blurb: string;
  kind: Extract<MathSetKind, 'quiz' | 'unit_test'>;
  assessment: Extract<MathSetKind, 'quiz' | 'unit_test'>;
  targetDifficulty: MathDifficulty;
  difficulty: MathDifficulty;
  skills: MathSkill[];
  count: number;
  minutes: number;
  quizNumber?: number;
  order: number;
  mix: DifficultyMix;
  unitTitle: string;
  domain: MathDomain;
};

const COURSE_DOMAINS: MathDomain[] = [
  'algebra',
  'problem_solving_data',
  'advanced_math',
  'geometry_trig',
];

const LEVELS: {
  id: MathCourseLevel;
  label: { vi: string; en: string };
  difficulty: MathDifficulty;
  mix: DifficultyMix;
}[] = [
  {
    id: 'foundation',
    label: { vi: 'Nền tảng', en: 'Foundations' },
    difficulty: 'easy',
    mix: { easy: 0.7, medium: 0.3, hard: 0 },
  },
  {
    id: 'medium',
    label: { vi: 'Trung bình', en: 'Medium' },
    difficulty: 'medium',
    mix: { easy: 0.2, medium: 0.6, hard: 0.2 },
  },
  {
    id: 'advanced',
    label: { vi: 'Nâng cao', en: 'Advanced' },
    difficulty: 'hard',
    mix: { easy: 0, medium: 0.3, hard: 0.7 },
  },
];

const DOMAIN_LABELS: Record<MathDomain, { vi: string; en: string }> = {
  algebra: { vi: 'Đại số', en: MATH_DOMAIN_LABEL.algebra },
  problem_solving_data: { vi: 'Xử lý bài toán & phân tích dữ liệu', en: MATH_DOMAIN_LABEL.problem_solving_data },
  advanced_math: { vi: 'Toán nâng cao', en: MATH_DOMAIN_LABEL.advanced_math },
  geometry_trig: { vi: 'Hình học & lượng giác', en: MATH_DOMAIN_LABEL.geometry_trig },
};

const SKILLS_BY_DOMAIN = Object.fromEntries(
  COURSE_DOMAINS.map((domain) => [
    domain,
    (Object.keys(MATH_SKILL_DOMAIN) as MathSkill[]).filter((skill) => MATH_SKILL_DOMAIN[skill] === domain),
  ]),
) as Record<MathDomain, MathSkill[]>;

/**
 * Checkpoint groups approximate the public course's quiz breaks using existing
 * Band 9 skill IDs. Several finer Khan topics still share one Band 9 skill;
 * the research map calls out those coverage gaps explicitly.
 */
const QUIZ_SKILLS_BY_DOMAIN: Record<MathDomain, MathSkill[][]> = {
  algebra: [
    ['linear_equations_one_var', 'linear_inequalities', 'linear_functions', 'linear_equations_two_var'],
    ['systems_linear_two_var', 'linear_inequalities'],
  ],
  problem_solving_data: [
    ['ratios_rates_units', 'percentages'],
    ['one_var_data', 'two_var_data'],
    ['probability', 'sample_inference', 'statistical_claims'],
  ],
  advanced_math: [
    ['equivalent_expressions', 'nonlinear_equations'],
    ['nonlinear_functions', 'nonlinear_equations'],
    ['nonlinear_equations', 'nonlinear_functions'],
  ],
  geometry_trig: [
    ['area_volume', 'lines_angles_triangles', 'right_triangles_trig'],
    ['circles', 'right_triangles_trig'],
  ],
};

const overview: MathCourseUnit = {
  id: 'about-sat',
  number: 1,
  title: { vi: 'Làm quen với SAT Math', en: 'About SAT Math' },
  blurb: {
    vi: 'Nắm cấu trúc bài thi, máy tính, thời gian và kiểm tra đầu vào trước khi chọn điểm bắt đầu.',
    en: 'Review the test format, calculator, timing, and placement check before choosing where to begin.',
  },
  level: null,
  difficulty: null,
  domain: null,
  skills: [],
};

const leveledUnits: MathCourseUnit[] = LEVELS.flatMap((level) =>
  COURSE_DOMAINS.map((domain) => {
    const domainLabel = DOMAIN_LABELS[domain];
    return {
      id: `${level.id}-${domain}`,
      number: 0,
      title: {
        vi: `${level.label.vi} · ${domainLabel.vi}`,
        en: `${level.label.en}: ${domainLabel.en}`,
      },
      blurb: {
        vi: `Luyện ${domainLabel.vi.toLocaleLowerCase('vi-VN')} ở mức ${level.label.vi.toLocaleLowerCase('vi-VN')}, rồi làm quiz và bài kiểm tra unit.`,
        en: `Practice ${domainLabel.en.toLowerCase()} at the ${level.label.en.toLowerCase()} level, then take a quiz and unit test.`,
      },
      level: level.id,
      difficulty: level.difficulty,
      domain,
      skills: SKILLS_BY_DOMAIN[domain],
    } satisfies MathCourseUnit;
  }),
);

export const SAT_MATH_COURSE_UNITS: MathCourseUnit[] = [
  overview,
  ...leveledUnits.map((unit, index) => ({ ...unit, number: index + 2 })),
];

const LEVEL_BY_ID = Object.fromEntries(LEVELS.map((level) => [level.id, level])) as Record<MathCourseLevel, (typeof LEVELS)[number]>;

export function getMathCourseUnit(id: string): MathCourseUnit | undefined {
  return SAT_MATH_COURSE_UNITS.find((unit) => unit.id === id);
}

export function getCourseAssessment(id: string): MathCourseAssessment | undefined {
  return SAT_MATH_COURSE_ASSESSMENTS.find((assessment) => assessment.id === id);
}

export function getCourseAssessmentsForUnit(unitId: string): MathCourseAssessment[] {
  return SAT_MATH_COURSE_ASSESSMENTS.filter((assessment) => assessment.courseUnitId === unitId);
}

/** Quiz attempts count as checkpoints; a unit test needs 3/4 correct (75%) to complete the unit. */
export function isCourseAssessmentComplete(
  assessment: Pick<MathCourseAssessment, 'assessment'>,
  progress?: { rounds?: number; lastRatio?: number },
): boolean {
  if ((progress?.rounds ?? 0) < 1) return false;
  return assessment.assessment === 'quiz' || (progress?.lastRatio ?? 0) >= UNIT_TEST_PASS_THRESHOLD;
}

export const SAT_MATH_COURSE_ASSESSMENTS: MathCourseAssessment[] = SAT_MATH_COURSE_UNITS
  .filter((unit): unit is MathCourseUnit & { level: MathCourseLevel; difficulty: MathDifficulty; domain: MathDomain } =>
    unit.level !== null && unit.difficulty !== null && unit.domain !== null,
  )
  .flatMap((unit) => {
    const level = LEVEL_BY_ID[unit.level];
    const shared = {
      courseUnitId: unit.id,
      targetDifficulty: unit.difficulty,
      difficulty: unit.difficulty,
      order: 1000 + unit.number * 10,
      mix: level.mix,
      unitTitle: unit.title.vi,
      domain: unit.domain,
    };
    return [
      ...QUIZ_SKILLS_BY_DOMAIN[unit.domain].map((skills, index) => ({
        ...shared,
        id: `course-${unit.id}-quiz-${index + 1}`,
        title: `Quiz ${index + 1} · ${unit.title.vi}`,
        blurb: `4 câu kiểm tra nhóm kỹ năng ${index + 1} trước khi sang phần kế tiếp.`,
        kind: 'quiz' as const,
        assessment: 'quiz' as const,
        quizNumber: index + 1,
        skills,
        count: 4,
        minutes: 8,
        order: shared.order + index + 1,
      })),
      {
        ...shared,
        id: `course-${unit.id}-unit-test`,
        title: `Bài kiểm tra · ${unit.title.vi}`,
        blurb: 'Phân bổ đều câu hỏi giữa các kỹ năng đã học trong unit; điểm thấp gợi ý quay lại phần cần ôn.',
        kind: 'unit_test' as const,
        assessment: 'unit_test' as const,
        skills: unit.skills,
        count: Math.max(12, unit.skills.length * 3),
        minutes: Math.max(18, unit.skills.length * 4),
        order: shared.order + 9,
      },
    ];
  });

/** Sinh bài đánh giá xác định theo từng kỹ năng để bài ngắn vẫn chạm được toàn unit. */
export function buildCourseAssessmentItems(
  assessment: Pick<MathCourseAssessment, 'id' | 'skills' | 'targetDifficulty' | 'count'>,
  round: number,
): MathItem[] {
  const skills = shuffle(assessment.skills, mulberry32(hashString(`${assessment.id}:skills`)));
  const rng = mulberry32(hashString(`${assessment.id}:r${round}`));
  const pools = new Map(
    skills.map((skill) => [
      skill,
      templatesForSkill(skill).filter((template) => template.difficulty === assessment.targetDifficulty),
    ]),
  );

  const items: MathItem[] = [];
  for (let i = 0; i < assessment.count; i += 1) {
    const skill = skills[i % skills.length];
    if (!skill) break;
    const pool = pools.get(skill) ?? [];
    if (pool.length === 0) {
      throw new Error(`Không có template ${assessment.targetDifficulty} cho kỹ năng ${skill}.`);
    }
    const template = pool[Math.floor(rng() * pool.length)]!;
    items.push(generateMathItem(template.slug, `${assessment.id}:r${round}#${i}`));
  }
  return items;
}

/** Danh mục kỹ năng thuộc mảng, dùng trong bản đồ chương trình và kiểm thử. */
export function skillsForMathDomain(domain: MathDomain): MathSkill[] {
  return [...SKILLS_BY_DOMAIN[domain]];
}

/** Ghi nhận các bậc khả dụng theo bộ sinh hiện tại, không tuyên bố mastery. */
export function courseDifficultyMix(level: MathCourseLevel): DifficultyMix {
  return { ...LEVEL_BY_ID[level].mix };
}

/** Dùng trong test để chặn unit thiếu câu hỏi ở một bậc nào đó. */
export function coveredAssessmentSkills(domain: MathDomain, difficulty: MathDifficulty): MathSkill[] {
  return MATH_TEMPLATES.filter((template) =>
    MATH_SKILL_DOMAIN[template.skill] === domain && template.difficulty === difficulty,
  ).map((template) => template.skill).filter((skill, index, all) => all.indexOf(skill) === index);
}
