import { generateMathItem } from './generator';
import { rankSkillsToPractice, summarizeByDomain, summarizeBySkill } from './scoring';
import type { ScoredAttempt, SkillStat } from './scoring';
import { MATH_SKILL_DOMAIN } from '@/lib/math/types';
import type { MathDomain, MathItem, MathSkill } from '@/lib/math/types';
import { MATH_TEMPLATES, templatesForSkill } from './templates';
import { hashString, mulberry32 } from '@/services/questions/rng';

/**
 * Bài chẩn đoán — bài đầu tiên người học làm trong module Math.
 *
 * MỘT CÂU CHO MỖI KỸ NĂNG, đủ 19 kỹ năng. Đây là chỗ bài chẩn đoán cố ý LỆCH
 * khỏi cấu trúc đề thật: đề thật dồn 70% số câu vào Algebra và Advanced Math,
 * nên bám đúng tỉ trọng ấy thì bốn trong bảy kỹ năng của Problem-Solving and
 * Data Analysis sẽ không được hỏi câu nào. Bài này không nhằm ước lượng điểm —
 * nó nhằm vẽ BẢN ĐỒ, mà bản đồ thì phải phủ hết.
 *
 * Đổi lại, kết quả phải đọc dè dặt: một câu cho một kỹ năng thì sai một câu
 * không chứng minh được là yếu kỹ năng ấy. `DiagnosticReading` bên dưới nói
 * thẳng điều đó ra thay vì để màn hình tự suy diễn.
 */

/** Thứ tự domain khi làm bài: đi từ mảng nặng nhất của đề thật xuống. */
const DOMAIN_ORDER: MathDomain[] = [
  'algebra',
  'advanced_math',
  'problem_solving_data',
  'geometry_trig',
];

export const DIAGNOSTIC_LENGTH = 19;

/** Ước lượng thời lượng: nhịp ~1,5 phút một câu của phần Math đề thật. */
export const DIAGNOSTIC_MINUTES = 30;

/**
 * Dựng bộ đề chẩn đoán.
 *
 * Thứ tự cố định theo domain chứ không trộn ngẫu nhiên: người chưa thi thử bao
 * giờ mà gặp câu hình học ngay sau câu thống kê sẽ mất nhịp, còn đi theo cụm
 * thì đỡ phải đổi bối cảnh liên tục. Đề thật có trộn, nhưng bài chẩn đoán không
 * phải bài thi.
 */
export function buildDiagnostic(seed: string): MathItem[] {
  // MỖI KỸ NĂNG CHỌN ĐÚNG MỘT TEMPLATE. Mỗi kỹ năng giờ có nhiều hơn một
  // template (cùng kỹ năng nhưng khác dạng câu hỏi), nên duyệt thẳng
  // `MATH_TEMPLATES` sẽ ra một bài dài gấp đôi và hỏi vài kỹ năng hai lần —
  // phá đúng tính chất "một câu một kỹ năng" mà cách đọc kết quả dựa vào.
  //
  // Chọn bằng RNG gieo hạt theo `seed`, nên cùng một hạt vẫn ra cùng một bài
  // (tái lập được), còn hai người khác hạt thì gặp hai dạng câu khác nhau của
  // cùng kỹ năng.
  const rng = mulberry32(hashString(`diagnostic-pick:${seed}`));

  const bySkill = new Map<MathSkill, (typeof MATH_TEMPLATES)[number]>();
  for (const skill of Object.keys(MATH_SKILL_DOMAIN) as MathSkill[]) {
    const pool = templatesForSkill(skill);
    if (pool.length === 0) continue;
    bySkill.set(skill, pool[Math.floor(rng() * pool.length)] ?? pool[0]!);
  }

  const ordered = [...bySkill.values()].sort((a, b) => {
    const domainDiff =
      DOMAIN_ORDER.indexOf(MATH_SKILL_DOMAIN[a.skill]) -
      DOMAIN_ORDER.indexOf(MATH_SKILL_DOMAIN[b.skill]);
    if (domainDiff !== 0) return domainDiff;
    return a.slug.localeCompare(b.slug);
  });

  return ordered.map((template, index) =>
    generateMathItem(template.slug, `diagnostic:${seed}#${index}`),
  );
}

export type SkillVerdict = 'chua_lam' | 'can_kiem_lai' | 'tam_on';

export type DiagnosticReading = {
  /** Kỹ năng → nhận định, kèm câu chữ giải thích mức tin cậy. */
  bySkill: Array<{ stat: SkillStat; verdict: SkillVerdict }>;
  byDomain: ReturnType<typeof summarizeByDomain>;
  /** Xếp theo mức cần luyện, đã cắt còn những kỹ năng đáng làm trước. */
  priority: SkillStat[];
  correct: number;
  total: number;
};

export const SKILL_VERDICT_LABEL: Record<SkillVerdict, string> = {
  chua_lam: 'Chưa làm',
  can_kiem_lai: 'Cần kiểm lại',
  tam_on: 'Tạm ổn',
};

/**
 * Đọc kết quả bài chẩn đoán.
 *
 * Chỉ có ba nhận định, và không nhận định nào là "yếu". Với đúng một câu mỗi kỹ
 * năng thì "sai" chỉ đủ để nói CẦN KIỂM LẠI — có thể là chưa hiểu, mà cũng có
 * thể là đọc hụt một dòng. Gắn nhãn "yếu" ở đây là kết luận vượt quá bằng chứng,
 * và người học sẽ tin nó.
 */
export function readDiagnostic(attempts: ScoredAttempt[]): DiagnosticReading {
  const bySkill = summarizeBySkill(attempts);
  const byDomain = summarizeByDomain(attempts);

  const verdicts = (Object.keys(bySkill) as MathSkill[]).map((skill) => {
    const stat = bySkill[skill];
    const verdict: SkillVerdict =
      stat.total === 0 ? 'chua_lam' : stat.correct === stat.total ? 'tam_on' : 'can_kiem_lai';
    return { stat, verdict };
  });

  const priority = rankSkillsToPractice(bySkill).filter((s) => s.total === 0 || s.correct < s.total);

  return {
    bySkill: verdicts.sort((a, b) => {
      const domainDiff =
        DOMAIN_ORDER.indexOf(a.stat.domain) - DOMAIN_ORDER.indexOf(b.stat.domain);
      return domainDiff !== 0 ? domainDiff : a.stat.skill.localeCompare(b.stat.skill);
    }),
    byDomain,
    priority,
    correct: attempts.filter((a) => a.isCorrect).length,
    total: attempts.length,
  };
}

/**
 * Câu tóm tắt hiện ngay đầu màn kết quả.
 *
 * Viết ra ở đây chứ không viết trong component, để cái ranh giới "được kết luận
 * tới đâu" nằm cùng chỗ với logic tính toán ra nó.
 */
export function diagnosticHeadline(reading: DiagnosticReading): string {
  const { correct, total } = reading;
  if (total === 0) return 'Chưa làm bài chẩn đoán.';

  const needWork = reading.priority.length;
  if (needWork === 0) {
    return `Đúng ${correct}/${total}. Không kỹ năng nào sai — nên bước tiếp theo là làm thử một đề mock đủ hai module để xem tốc độ.`;
  }

  return (
    `Đúng ${correct}/${total}. Có ${needWork} kỹ năng cần kiểm lại. ` +
    'Mỗi kỹ năng ở đây mới được hỏi ĐÚNG MỘT CÂU, nên đây là bản đồ định hướng chứ chưa phải kết luận — ' +
    'drill riêng kỹ năng đó sẽ xác nhận.'
  );
}
