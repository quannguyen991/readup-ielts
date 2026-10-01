import { questionsForSkill, rwDifficulty, type SatRwQuestion } from '@/data/sat-rw-repository';
import { DIFFICULTIES, type Difficulty } from '@/lib/difficulty';

/**
 * Bộ đề theo KỸ NĂNG của SAT Verbal (`/sat-rw/skill/[skill]`): câu của kỹ năng
 * xếp dễ → khó rồi cắt thành các bộ 10 câu cố định. Bộ đầu dễ, các bộ cuối là
 * câu khó viết riêng. Dùng chung cho trang chọn bộ và nút Luyện ở hub.
 */

export const RW_SKILL_SET_SIZE = 10;

export function rwSkillSets(skill: string): SatRwQuestion[][] {
  const all = questionsForSkill(skill);
  const out: SatRwQuestion[][] = [];
  for (let i = 0; i < all.length; i += RW_SKILL_SET_SIZE) out.push(all.slice(i, i + RW_SKILL_SET_SIZE));
  return out;
}

/** Nhãn của một bộ: bậc chiếm nhiều câu nhất (hoà thì lấy bậc khó hơn). */
export function rwSetTier(questions: readonly SatRwQuestion[]): Difficulty {
  let best: Difficulty = 'medium';
  let bestCount = 0;
  for (const d of DIFFICULTIES) {
    const n = questions.filter((q) => rwDifficulty(q) === d).length;
    if (n > 0 && n >= bestCount) {
      best = d;
      bestCount = n;
    }
  }
  return best;
}

/**
 * Bộ nên mở khi bấm Luyện với một bộ lọc độ khó: bộ CHƯA LÀM XONG đầu tiên
 * thuộc bậc ấy; làm hết rồi thì bộ đầu của bậc. Không có bộ nào thuộc bậc ấy
 * thì trả null — nút Luyện về trang chọn bộ.
 */
export function rwSetForTier(
  skill: string,
  tier: Difficulty,
  answered: (questionId: string) => boolean,
): number | null {
  const sets = rwSkillSets(skill);
  const ofTier = sets.map((qs, i) => ({ qs, i })).filter(({ qs }) => rwSetTier(qs) === tier);
  if (ofTier.length === 0) return null;
  const open = ofTier.find(({ qs }) => !qs.every((q) => answered(q.id)));
  return (open ?? ofTier[0]!).i;
}
