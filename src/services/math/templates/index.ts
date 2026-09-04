import { ADVANCED_TEMPLATES } from './advanced';
import { ALGEBRA_TEMPLATES } from './algebra';
import { DATA_TEMPLATES } from './data';
import { GEOMETRY_TEMPLATES } from './geometry';
import { MATH_SKILL_DOMAIN } from '@/lib/math/types';
import type { MathDomain, MathSkill, MathTemplate } from '@/lib/math/types';

/**
 * Danh bạ template.
 *
 * Kho đề Math KHÔNG có file seed, khác kho bài đọc và kho đề Writing: một
 * template sinh ra vô hạn câu từ hạt, nên danh sách này CHÍNH LÀ kho đề. Thêm
 * một kỹ năng nghĩa là thêm một template vào đúng file domain của nó rồi nối
 * vào đây.
 *
 * MỌI KỸ NĂNG trong 19 kỹ năng của Digital SAT Math đều phải có template, và
 * mỗi kỹ năng có NHIỀU HƠN MỘT — hai dạng câu hỏi khác nhau về cấu trúc cho
 * cùng một kỹ năng, để người luyện không nhận ra khuôn rồi giải theo phản xạ
 * thay vì theo hiểu. `everySkillCovered()` chốt phần "không thiếu kỹ năng nào"
 * lại, và property test gọi nó — thêm kỹ năng vào taxonomy mà quên viết
 * template thì `npm test` đỏ ngay.
 *
 * Chỗ nào cần ĐÚNG MỘT câu cho mỗi kỹ năng (bài chẩn đoán) thì tự chọn lấy một
 * template bằng `templatesForSkill()`, chứ không duyệt thẳng danh sách này.
 */
export const MATH_TEMPLATES: readonly MathTemplate[] = [
  ...ALGEBRA_TEMPLATES,
  ...ADVANCED_TEMPLATES,
  ...DATA_TEMPLATES,
  ...GEOMETRY_TEMPLATES,
];

export function getTemplate(slug: string): MathTemplate | undefined {
  return MATH_TEMPLATES.find((t) => t.slug === slug);
}

export function templatesForSkill(skill: MathSkill): MathTemplate[] {
  return MATH_TEMPLATES.filter((t) => t.skill === skill);
}

/** Những kỹ năng đã có ít nhất một template — tức là những gì luyện được ngay. */
export function coveredSkills(): MathSkill[] {
  return [...new Set(MATH_TEMPLATES.map((t) => t.skill))];
}

/** Những kỹ năng của taxonomy CHƯA có template nào. Rỗng nghĩa là đã phủ hết. */
export function uncoveredSkills(): MathSkill[] {
  const covered = new Set(coveredSkills());
  return (Object.keys(MATH_SKILL_DOMAIN) as MathSkill[]).filter((s) => !covered.has(s));
}

export function templatesByDomain(): Record<MathDomain, MathTemplate[]> {
  const grouped: Record<MathDomain, MathTemplate[]> = {
    algebra: [],
    advanced_math: [],
    problem_solving_data: [],
    geometry_trig: [],
  };
  for (const template of MATH_TEMPLATES) {
    grouped[MATH_SKILL_DOMAIN[template.skill]].push(template);
  }
  return grouped;
}
