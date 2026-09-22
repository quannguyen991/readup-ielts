import { MATH_SKILL_DOMAIN, type MathSkill } from '@/lib/math/types';
import { ALL_SETS } from './curriculum';
import type { SkillStat } from './scoring';

/**
 * Quy mô "ngân hàng" SAT Math theo kỹ năng — dùng cho thẻ kỹ năng ở trang Math
 * và thẻ "môn còn lại" ở trang Verbal.
 *
 * Số câu của một kỹ năng = tổng cỡ các bộ đề CHỈ luyện riêng kỹ năng đó; bộ
 * tổng hợp trộn nhiều kỹ năng không chia được cho từng kỹ năng nên không tính.
 */
export const MATH_SKILLS = Object.keys(MATH_SKILL_DOMAIN) as MathSkill[];

export const BANK_PER_SKILL = Object.fromEntries(
  MATH_SKILLS.map((k) => [
    k,
    ALL_SETS.filter((set) => set.skills.length === 1 && set.skills[0] === k).reduce((sum, set) => sum + set.count, 0),
  ]),
) as Record<MathSkill, number>;

export const MATH_BANK_TOTAL = MATH_SKILLS.reduce((sum, k) => sum + BANK_PER_SKILL[k], 0);

/**
 * "Đã làm" của một kỹ năng: số lượt làm, chặn trần ở cỡ kho. Đề Math sinh mới
 * mỗi lượt nên không có "câu đã gặp" để đếm như bên Verbal.
 */
export function answeredInBank(skill: MathSkill, stat: Pick<SkillStat, 'total'>): number {
  return Math.min(stat.total, BANK_PER_SKILL[skill]);
}

export function mathBankDone(stats: Record<MathSkill, Pick<SkillStat, 'total'>>): number {
  return MATH_SKILLS.reduce((sum, k) => sum + answeredInBank(k, stats[k]), 0);
}
