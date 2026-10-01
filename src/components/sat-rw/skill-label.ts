import { SAT_RW_SKILL_LABEL } from '@/data/sat-rw-repository';
import { SAT_RW_SKILL_LABEL_EN } from './skill-label-en';

/**
 * Tên kỹ năng SAT Verbal khi giao diện đang ở tiếng Anh.
 *
 * Bản tiếng Việt nằm ở `SAT_RW_SKILL_LABEL` trong kho dữ liệu; để nguyên ở đó,
 * dịch tại chỗ hiển thị. Sáu kỹ năng cuối vốn đã là tên College Board.
 */
export function rwSkillLabel(skill: string, en: boolean): string {
  return (en ? SAT_RW_SKILL_LABEL_EN[skill] : SAT_RW_SKILL_LABEL[skill]) ?? SAT_RW_SKILL_LABEL[skill] ?? skill;
}
