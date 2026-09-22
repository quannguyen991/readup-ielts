import { MATH_SKILL_DOMAIN, type MathDomain, type MathItem, type MathSkill } from '@/lib/math/types';
import { generateMathSet } from './generator';

/**
 * Ngân hàng SAT Math theo kỹ năng — thứ thẻ kỹ năng ở trang Math hiển thị và
 * nút "Luyện" dẫn vào.
 *
 * Bản trước ghi mỗi kỹ năng "148 câu" (cỡ các bộ đề lộ trình có luyện kỹ năng
 * đó) nhưng nút Luyện lại mở một drill 6 câu ngẫu nhiên không thuộc 148 câu
 * nào — con số trên thẻ và thứ người học làm không dính gì tới nhau, và kỹ năng
 * nào cũng đúng 148 nên trông như số bịa.
 *
 * Giờ:
 *
 *   CỠ KHO theo TỈ TRỌNG CHÍNH THỨC của từng mảng trong đề Digital SAT Math
 *   (College Board: Algebra ~35%, Advanced Math ~35%, Problem-Solving ~15%,
 *   Geometry ~15%), chia đều cho các kỹ năng trong mảng. College Board không
 *   công bố tỉ trọng từng kỹ năng nên không chia mịn hơn thế.
 *
 *   MỖI CÂU CỐ ĐỊNH: kho chia thành các LƯỢT 10 câu, lượt thứ r sinh từ hạt
 *   giống `bank:<kỹ năng>:<r>` — mở lại lượt nào cũng đúng các câu ấy. "Đã làm
 *   30/70" nghĩa là đã làm xong ba lượt đầu, không phải bấm 30 lần.
 */

export const MATH_SKILLS = Object.keys(MATH_SKILL_DOMAIN) as MathSkill[];

/** Tỉ trọng mảng trong đề thật (College Board, Digital SAT Math). */
export const DOMAIN_SHARE: Record<MathDomain, number> = {
  algebra: 0.35,
  advanced_math: 0.35,
  problem_solving_data: 0.15,
  geometry_trig: 0.15,
};

/** Cỡ toàn kho, trước khi làm tròn từng kỹ năng về bội của một lượt. */
const BANK_TARGET = 1000;
/** Số câu mỗi lượt luyện. */
export const ROUND_SIZE = 10;

function skillsIn(domain: MathDomain): MathSkill[] {
  return MATH_SKILLS.filter((k) => MATH_SKILL_DOMAIN[k] === domain);
}

export const BANK_PER_SKILL = Object.fromEntries(
  MATH_SKILLS.map((k) => {
    const domain = MATH_SKILL_DOMAIN[k];
    const raw = (BANK_TARGET * DOMAIN_SHARE[domain]) / skillsIn(domain).length;
    // Tròn về bội của một lượt, tối thiểu hai lượt.
    return [k, Math.max(2 * ROUND_SIZE, Math.round(raw / ROUND_SIZE) * ROUND_SIZE)];
  }),
) as Record<MathSkill, number>;

export const MATH_BANK_TOTAL = MATH_SKILLS.reduce((sum, k) => sum + BANK_PER_SKILL[k], 0);

export function roundsFor(skill: MathSkill): number {
  return Math.ceil(BANK_PER_SKILL[skill] / ROUND_SIZE);
}

/** Số câu của lượt `round` (lượt cuối có thể thiếu). */
export function roundLength(skill: MathSkill, round: number): number {
  return Math.max(0, Math.min(ROUND_SIZE, BANK_PER_SKILL[skill] - round * ROUND_SIZE));
}

/** Mã lượt — lưu vào `setId` của phiên làm bài để biết lượt nào đã xong. */
export function bankRoundId(skill: MathSkill, round: number): string {
  return `bank:${skill}:${round}`;
}

export function parseBankRoundId(id: string | null): { skill: MathSkill; round: number } | null {
  if (!id) return null;
  const m = /^bank:([a-z_]+):(\d+)$/.exec(id);
  if (!m || !(m[1]! in MATH_SKILL_DOMAIN)) return null;
  return { skill: m[1] as MathSkill, round: Number(m[2]) };
}

/** Các câu của một lượt — cùng hạt giống thì cùng câu. */
export function bankRoundItems(skill: MathSkill, round: number): MathItem[] {
  const count = roundLength(skill, round);
  if (count === 0) return [];
  return generateMathSet({ skills: [skill], count, seed: bankRoundId(skill, round) });
}

export type SkillBankProgress = {
  /** Các lượt đã làm xong ít nhất một lần. */
  doneRounds: number[];
  /** Số câu KHÁC NHAU của kho đã làm. */
  answered: number;
  /** Lượt nên làm tiếp: lượt nhỏ nhất chưa làm; làm hết rồi thì quay lại lượt 0. */
  nextRound: number;
};

/** Tiến độ trong kho, suy từ các phiên làm bài đã lưu (`setId` = mã lượt). */
export function bankProgress(
  sessions: readonly { setId: string | null }[],
): Record<MathSkill, SkillBankProgress> {
  const done = new Map<MathSkill, Set<number>>();
  for (const s of sessions) {
    const parsed = parseBankRoundId(s.setId);
    if (!parsed || parsed.round >= roundsFor(parsed.skill)) continue;
    if (!done.has(parsed.skill)) done.set(parsed.skill, new Set());
    done.get(parsed.skill)!.add(parsed.round);
  }
  return Object.fromEntries(
    MATH_SKILLS.map((k) => {
      const rounds = [...(done.get(k) ?? [])].sort((a, b) => a - b);
      const answered = rounds.reduce((sum, r) => sum + roundLength(k, r), 0);
      let next = 0;
      while (rounds.includes(next) && next < roundsFor(k)) next += 1;
      if (next >= roundsFor(k)) next = 0;
      return [k, { doneRounds: rounds, answered, nextRound: next }];
    }),
  ) as Record<MathSkill, SkillBankProgress>;
}

export function mathBankDone(progress: Record<MathSkill, SkillBankProgress>): number {
  return MATH_SKILLS.reduce((sum, k) => sum + progress[k].answered, 0);
}
