import { MATH_SKILL_DOMAIN } from '@/lib/math/types';
import type { MathDomain, MathErrorTag, MathSkill } from '@/lib/math/types';

/**
 * Tổng hợp kết quả làm bài Math.
 *
 * Ba mức tổng hợp, dùng vào ba việc khác nhau:
 *
 * - THEO KỸ NĂNG — trả lời "tôi thủng chỗ nào", là thứ quyết định giao bài gì tiếp.
 * - THEO DOMAIN — trả lời "mảng nào yếu", đủ tin cậy hơn vì gộp nhiều câu lại.
 * - THEO NHÃN LỖI — trả lời "tôi hay hỏng kiểu gì", cắt ngang mọi kỹ năng.
 *
 * Mức thứ ba là thứ một bank đề thường không có: sai dấu ở phương trình bậc
 * nhất và sai dấu ở bất phương trình là CÙNG một thói quen hỏng, và chỉ nhìn
 * thấy được khi gộp theo nhãn lỗi thay vì gộp theo kỹ năng.
 */

export type ScoredAttempt = {
  skill: MathSkill;
  isCorrect: boolean;
  errorTag: MathErrorTag | null;
  timeSpentMs: number;
};

export type SkillStat = {
  skill: MathSkill;
  domain: MathDomain;
  correct: number;
  total: number;
  /** null khi chưa làm câu nào — KHÁC với 0%, và mọi chỗ hiển thị phải phân biệt. */
  accuracy: number | null;
  avgTimeMs: number | null;
};

export type DomainStat = {
  domain: MathDomain;
  correct: number;
  total: number;
  accuracy: number | null;
};

const EMPTY_SKILL = (skill: MathSkill): SkillStat => ({
  skill,
  domain: MATH_SKILL_DOMAIN[skill],
  correct: 0,
  total: 0,
  accuracy: null,
  avgTimeMs: null,
});

export function summarizeBySkill(attempts: ScoredAttempt[]): Record<MathSkill, SkillStat> {
  const stats = {} as Record<MathSkill, SkillStat>;
  for (const skill of Object.keys(MATH_SKILL_DOMAIN) as MathSkill[]) {
    stats[skill] = EMPTY_SKILL(skill);
  }

  const timeTotals = {} as Record<MathSkill, number>;
  for (const attempt of attempts) {
    const stat = stats[attempt.skill];
    stat.total += 1;
    if (attempt.isCorrect) stat.correct += 1;
    timeTotals[attempt.skill] = (timeTotals[attempt.skill] ?? 0) + attempt.timeSpentMs;
  }

  for (const skill of Object.keys(stats) as MathSkill[]) {
    const stat = stats[skill];
    if (stat.total > 0) {
      stat.accuracy = stat.correct / stat.total;
      stat.avgTimeMs = Math.round((timeTotals[skill] ?? 0) / stat.total);
    }
  }

  return stats;
}

export function summarizeByDomain(attempts: ScoredAttempt[]): Record<MathDomain, DomainStat> {
  const stats: Record<MathDomain, DomainStat> = {
    algebra: { domain: 'algebra', correct: 0, total: 0, accuracy: null },
    advanced_math: { domain: 'advanced_math', correct: 0, total: 0, accuracy: null },
    problem_solving_data: { domain: 'problem_solving_data', correct: 0, total: 0, accuracy: null },
    geometry_trig: { domain: 'geometry_trig', correct: 0, total: 0, accuracy: null },
  };

  for (const attempt of attempts) {
    const stat = stats[MATH_SKILL_DOMAIN[attempt.skill]];
    stat.total += 1;
    if (attempt.isCorrect) stat.correct += 1;
  }

  for (const domain of Object.keys(stats) as MathDomain[]) {
    const stat = stats[domain];
    if (stat.total > 0) stat.accuracy = stat.correct / stat.total;
  }

  return stats;
}

export function countErrorTags(attempts: ScoredAttempt[]): Array<{ tag: MathErrorTag; count: number }> {
  const counts = new Map<MathErrorTag, number>();
  for (const attempt of attempts) {
    if (attempt.isCorrect || !attempt.errorTag) continue;
    counts.set(attempt.errorTag, (counts.get(attempt.errorTag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/**
 * Xếp hạng kỹ năng cần luyện nhất.
 *
 * Kỹ năng CHƯA LÀM CÂU NÀO xếp trước kỹ năng đã làm và sai, vì không biết gì về
 * nó còn đáng lo hơn là biết mình yếu nó. Sau đó mới tới độ chính xác thấp dần.
 * Đây là lý do `accuracy` để null chứ không để 0: hai trạng thái ấy phải phân
 * biệt được ở đúng chỗ này.
 */
export function rankSkillsToPractice(stats: Record<MathSkill, SkillStat>): SkillStat[] {
  return Object.values(stats).sort((a, b) => {
    if (a.total === 0 && b.total !== 0) return -1;
    if (b.total === 0 && a.total !== 0) return 1;
    if (a.total === 0 && b.total === 0) return a.skill.localeCompare(b.skill);
    const diff = (a.accuracy ?? 0) - (b.accuracy ?? 0);
    if (diff !== 0) return diff;
    // Cùng độ chính xác thì ưu tiên kỹ năng làm ÍT câu hơn: số liệu mỏng hơn
    // nên cần thêm bằng chứng hơn.
    return a.total - b.total;
  });
}

/** Bậc độ khó của module 2 trong đề số hoá — quyết định trần điểm. */
export type ModuleTier = 'easier' | 'harder';

/**
 * Quy số câu đúng ra thang 200–800.
 *
 * ĐÂY LÀ ƯỚC LƯỢNG, KHÔNG PHẢI BẢNG QUY ĐỔI CHÍNH THỨC. College Board không
 * công bố bảng quy đổi của đề số hoá, và bảng ấy còn đổi theo từng lần thi. Con
 * số ở đây chỉ để thấy mình đang ở khoảng nào và có nhích lên không.
 *
 * Cùng kỷ luật với `estimatedBand` của module Reading: chỗ nào không biết thì
 * nói là không biết, chứ không in ra một con số cứng như thể nó là điểm thật.
 *
 * Hình dạng của phép quy đổi bám một tính chất CÓ THẬT của đề số hoá: ai bị
 * chuyển sang module 2 dễ hơn thì bị chặn trần điểm, dù làm đúng hết. Đó là hệ
 * quả trực tiếp của việc chấm theo độ khó câu hỏi.
 */
export const SCORE_RANGE: Record<ModuleTier, [number, number]> = {
  easier: [200, 600],
  harder: [400, 800],
};

export function estimateMathScore(correct: number, total: number, tier: ModuleTier): number {
  if (total <= 0) return SCORE_RANGE[tier][0];
  const [low, high] = SCORE_RANGE[tier];
  const ratio = Math.min(1, Math.max(0, correct / total));
  return Math.round((low + (high - low) * ratio) / 10) * 10;
}

/**
 * Ngưỡng chuyển module. Đề thật không công bố ngưỡng; 60% là con số được nhắc
 * tới nhiều nhất trong tài liệu luyện thi, và mọi chỗ hiển thị phải nói rõ đây
 * là phỏng theo chứ không phải quy tắc chính thức.
 */
export const MODULE_ROUTING_THRESHOLD = 0.6;

export function routeSecondModule(correct: number, total: number): ModuleTier {
  if (total <= 0) return 'easier';
  return correct / total >= MODULE_ROUTING_THRESHOLD ? 'harder' : 'easier';
}

export function formatAccuracy(accuracy: number | null): string {
  return accuracy === null ? '—' : `${Math.round(accuracy * 100)}%`;
}
