/**
 * HỒ SƠ LỖI CÁ NHÂN — gom mọi lỗi CÓ TÊN mà app đã gọi ra, thành "những lỗi
 * bạn hay mắc nhất", kèm xu hướng và đường sửa ngay.
 *
 * Đây là thứ các app luyện thi khác không làm được: họ chỉ biết bạn sai câu
 * nào; ReadUp sinh đề bằng code nên biết bạn sai VÌ SAO.
 *
 * Ba nguồn:
 * - SAT Math: nhãn lỗi của phương án nhiễu đã chọn (`errorTag` — quên đổi dấu,
 *   giải ra ẩn kia, lấy phần trăm sai gốc…).
 * - SAT Verbal: kỹ năng của câu làm sai (kho Verbal không gắn nhãn cho từng
 *   nhiễu, nên cấp độ gọi tên là kỹ năng).
 * - Từ vựng: kiểu lỗi gõ/chọn từ đã chẩn đoán (phụ âm đôi, nhầm đuôi, nhầm từ…).
 *
 * Xu hướng: so 7 ngày gần nhất với 7 ngày trước đó.
 */
import { MATH_ERROR_LABEL, MATH_SKILL_LABEL, type MathErrorTag, type MathSkill } from '@/lib/math/types';
import { MISTAKE_ADVICE, MISTAKE_TITLE, type MistakeKind } from '@/services/vocab/mistake';

export type ErrorArea = 'math' | 'verbal' | 'vocab';

export type ErrorItem = {
  id: string;
  area: ErrorArea;
  title: string;
  /** Giải thích / lời khuyên ngắn. */
  detail: string;
  last7: number;
  prev7: number;
  total: number;
  trend: 'up' | 'down' | 'flat' | 'new';
  /** Ví dụ gần nhất (tên kỹ năng hoặc từ). */
  example: string | null;
  fix: { label: string; href: string };
};

export type MathAttemptLike = { skill: MathSkill; isCorrect: boolean; errorTag: MathErrorTag | null };
export type MathSessionLike = { finishedAt: string; attempts: readonly MathAttemptLike[] };
export type RwAttemptLike = { correct: boolean; at: string };
export type RwQuestionLike = { id: string; skill: string };
export type VocabMistakeLike = { kind: MistakeKind; word: string; slug: string; at: string };

const DAY = 86_400_000;

/** Phần đầu của nhãn dài: "Sai dấu — đổi vế…" → "Sai dấu". */
export function shortTitle(label: string): string {
  const cut = label.split(/ — |\. /)[0]!;
  return cut.replace(/\.$/, '');
}

type Bucket = { last7: number; prev7: number; total: number; lastAt: number; example: string | null; hint: Map<string, number> };

function bump(map: Map<string, Bucket>, key: string, at: number, now: number, example: string, hint: string) {
  const b = map.get(key) ?? { last7: 0, prev7: 0, total: 0, lastAt: 0, example: null, hint: new Map() };
  const age = now - at;
  if (age <= 7 * DAY) b.last7 += 1;
  else if (age <= 14 * DAY) b.prev7 += 1;
  b.total += 1;
  if (at >= b.lastAt) {
    b.lastAt = at;
    b.example = example;
  }
  b.hint.set(hint, (b.hint.get(hint) ?? 0) + 1);
  map.set(key, b);
}

function trendOf(b: Bucket): ErrorItem['trend'] {
  if (b.prev7 === 0 && b.last7 > 0) return 'new';
  if (b.last7 > b.prev7) return 'up';
  if (b.last7 < b.prev7) return 'down';
  return 'flat';
}

const topHint = (b: Bucket) => [...b.hint.entries()].sort((x, y) => y[1] - x[1])[0]![0];

export function buildErrorProfile(input: {
  mathSessions: readonly MathSessionLike[];
  rwAttempts: Readonly<Record<string, RwAttemptLike>>;
  rwQuestions: readonly RwQuestionLike[];
  rwSkillLabel: Readonly<Record<string, string>>;
  vocabLog: readonly VocabMistakeLike[];
  now: number;
}): ErrorItem[] {
  const { now } = input;
  const out: ErrorItem[] = [];

  // --- SAT Math: theo nhãn lỗi, gợi ý sửa ở kỹ năng hay mắc nhãn ấy nhất.
  const math = new Map<string, Bucket>();
  for (const s of input.mathSessions) {
    const at = new Date(s.finishedAt).getTime();
    for (const a of s.attempts) {
      if (a.isCorrect || !a.errorTag) continue;
      bump(math, a.errorTag, at, now, MATH_SKILL_LABEL[a.skill], a.skill);
    }
  }
  for (const [tag, b] of math) {
    const skill = topHint(b) as MathSkill;
    out.push({
      id: `math:${tag}`,
      area: 'math',
      title: shortTitle(MATH_ERROR_LABEL[tag as MathErrorTag]),
      detail: MATH_ERROR_LABEL[tag as MathErrorTag],
      ...counts(b),
      example: b.example,
      fix: { label: `Học lại: ${MATH_SKILL_LABEL[skill]}`, href: `/math/learn/${skill}` },
    });
  }

  // --- SAT Verbal: theo kỹ năng của câu sai.
  const skillOf = new Map(input.rwQuestions.map((q) => [q.id, q.skill]));
  const verbal = new Map<string, Bucket>();
  for (const [id, a] of Object.entries(input.rwAttempts)) {
    if (a.correct) continue;
    const skill = skillOf.get(id);
    if (!skill) continue;
    bump(verbal, skill, new Date(a.at).getTime(), now, input.rwSkillLabel[skill] ?? skill, skill);
  }
  for (const [skill, b] of verbal) {
    out.push({
      id: `verbal:${skill}`,
      area: 'verbal',
      title: `Hay sai dạng ${input.rwSkillLabel[skill] ?? skill}`,
      detail: 'Đọc lại bài lý thuyết của dạng này — phần "Bẫy hay gặp" thường chính là chỗ đang mất điểm.',
      ...counts(b),
      example: null,
      fix: { label: 'Học lại bài lý thuyết', href: `/sat-rw/learn/${skill}` },
    });
  }

  // --- Từ vựng: theo kiểu lỗi, sửa ở bộ từ gần nhất mắc lỗi ấy.
  const vocab = new Map<string, Bucket>();
  for (const m of input.vocabLog) bump(vocab, m.kind, new Date(m.at).getTime(), now, m.word, m.slug);
  for (const [kind, b] of vocab) {
    const slug = topHint(b);
    out.push({
      id: `vocab:${kind}`,
      area: 'vocab',
      title: MISTAKE_TITLE[kind as MistakeKind],
      detail: MISTAKE_ADVICE[kind as MistakeKind],
      ...counts(b),
      example: b.example,
      fix: { label: 'Luyện lại bộ từ', href: `/vocabulary/topic/${slug}/learn` },
    });
  }

  // Lỗi đang "nóng" (7 ngày gần) lên trước; hoà thì theo tổng.
  return out.sort((a, b) => b.last7 - a.last7 || b.total - a.total || a.id.localeCompare(b.id));
}

function counts(b: Bucket) {
  return { last7: b.last7, prev7: b.prev7, total: b.total, trend: trendOf(b) };
}
