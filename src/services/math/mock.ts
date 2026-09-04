import { generateMathItem } from './generator';
import { MATH_TEMPLATES } from './templates';
import type { ModuleTier } from './scoring';
import { MATH_SKILL_DOMAIN } from '@/lib/math/types';
import type { MathDifficulty, MathDomain, MathItem, MathTemplate } from '@/lib/math/types';
import { hashString, mulberry32, shuffle } from '@/services/questions/rng';

/**
 * Mock test Math — mô phỏng hai module của phần Math đề số hoá.
 *
 * CẤU TRÚC ĐỀ THẬT được bám đúng ở ba điểm đo được: 22 câu mỗi module, 35 phút
 * mỗi module, và tỉ trọng bốn domain. Điểm thứ tư — module 2 khó hay dễ tuỳ kết
 * quả module 1 — cũng có, nhưng xem phần giới hạn bên dưới.
 *
 * GIỚI HẠN ĐÃ BIẾT, nói ra ở đây thay vì để người dùng tự phát hiện:
 *
 * 1. Mỗi kỹ năng hiện chỉ có MỘT template, và độ khó là thuộc tính của template
 *    chứ chưa phải tham số sinh đề. Nên "module khó hơn" ở đây khó hơn chủ yếu ở
 *    THÀNH PHẦN (nhiều câu thuộc template khó) chứ không phải từng câu khó lên.
 *    Muốn đúng nghĩa thì phải cho `build()` nhận thêm mức độ khó — việc của lát
 *    sau, và nó đụng cả 19 template.
 * 2. Ngưỡng chuyển module 60% là phỏng theo tài liệu luyện thi, College Board
 *    không công bố ngưỡng thật.
 * 3. 22 câu một module nhưng bank chỉ có 19 template, nên trong một module chắc
 *    chắn có kỹ năng lặp lại. Đề thật cũng lặp kỹ năng, nhưng lặp ít hơn.
 */

export const MOCK_MODULE_LENGTH = 22;
export const MOCK_MODULE_MINUTES = 35;

/**
 * Số câu mỗi domain trong một module 22 câu, bám tỉ trọng đề thật
 * (Algebra ~35%, Advanced Math ~35%, PSDA ~15%, Geometry ~15%).
 */
export const MOCK_DOMAIN_BLUEPRINT: Record<MathDomain, number> = {
  algebra: 8,
  advanced_math: 8,
  problem_solving_data: 3,
  geometry_trig: 3,
};

/** Trọng số bốc template theo độ khó, tuỳ bậc module. */
const DIFFICULTY_WEIGHT: Record<ModuleTier | 'mixed', Record<MathDifficulty, number>> = {
  mixed: { easy: 2, medium: 3, hard: 2 },
  easier: { easy: 4, medium: 3, hard: 1 },
  harder: { easy: 1, medium: 3, hard: 4 },
};

function weightedPool(templates: MathTemplate[], tier: ModuleTier | 'mixed'): MathTemplate[] {
  const pool: MathTemplate[] = [];
  for (const template of templates) {
    const weight = DIFFICULTY_WEIGHT[tier][template.difficulty];
    for (let i = 0; i < weight; i += 1) pool.push(template);
  }
  return pool;
}

/**
 * Dựng một module.
 *
 * Đi vòng tròn trong danh sách đã trộn của TỪNG DOMAIN chứ không bốc lại mỗi
 * câu: bốc lại thì một module 8 câu Algebra rất dễ ra 5 câu cùng một kỹ năng,
 * và người làm sẽ tưởng đề thi thật cũng lệch như vậy.
 */
export function buildMockModule(seed: string, index: 1 | 2, tier: ModuleTier | 'mixed'): MathItem[] {
  const rng = mulberry32(hashString(`mock:${seed}:module${index}:${tier}`));
  const items: MathItem[] = [];
  let position = 0;

  for (const domain of Object.keys(MOCK_DOMAIN_BLUEPRINT) as MathDomain[]) {
    const count = MOCK_DOMAIN_BLUEPRINT[domain];
    const templates = MATH_TEMPLATES.filter((t) => MATH_SKILL_DOMAIN[t.skill] === domain);
    const ordered = shuffle(weightedPool([...templates], tier), rng);

    for (let i = 0; i < count; i += 1) {
      const template = ordered[i % ordered.length];
      if (!template) break;
      items.push(generateMathItem(template.slug, `mock:${seed}:m${index}:${tier}#${position}`));
      position += 1;
    }
  }

  // Trộn lại toàn module để các domain không xếp thành khối — đề thật trộn lẫn.
  return shuffle(items, rng);
}

export type MockModuleResult = {
  correct: number;
  total: number;
};

export type MockProgress =
  | { stage: 'module1'; items: MathItem[] }
  | { stage: 'module2'; tier: ModuleTier; items: MathItem[]; module1: MockModuleResult };

export function startMock(seed: string): MockProgress {
  return { stage: 'module1', items: buildMockModule(seed, 1, 'mixed') };
}

export function continueMock(seed: string, module1: MockModuleResult, tier: ModuleTier): MockProgress {
  return { stage: 'module2', tier, items: buildMockModule(seed, 2, tier), module1 };
}

/** Tổng số câu cả bài — dùng để hiện tiến độ và để quy điểm. */
export const MOCK_TOTAL_QUESTIONS = MOCK_MODULE_LENGTH * 2;
