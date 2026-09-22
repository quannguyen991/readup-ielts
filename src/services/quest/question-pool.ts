import { buildRwModule, rwPool } from '@/services/sat-rw/mock/build';
import { buildMockModule as buildMathModule } from '@/services/math/mock';
import { MATH_SKILL_LABEL, type MathItem } from '@/lib/math/types';
import type { MockItem } from '@/services/sat-rw/mock/item';
import type { QuestQuestion, QuestSubject } from './types';

function verbalQuestion(item: MockItem): QuestQuestion {
  return {
    id: item.id,
    subject: 'verbal',
    prompt: item.stem,
    context: item.passage,
    options: item.options,
    correctIndex: item.answerIndex,
    explanation: item.solutionVi,
    skill: item.skill,
    skillLabel: item.domain,
    rwItem: item,
  };
}

function mathQuestion(item: MathItem): QuestQuestion | null {
  if (!item.choices || item.correctIndex === null) return null;
  return {
    id: item.id,
    subject: 'math',
    prompt: item.stem,
    options: item.choices.map((choice) => choice.display),
    correctIndex: item.correctIndex,
    explanation: item.steps.map((step) => step.text).join(' '),
    skill: item.skill,
    skillLabel: MATH_SKILL_LABEL[item.skill],
    figure: item.figure,
  };
}

export function buildQuestQuestions(seed: string, count: number, subject: QuestSubject): QuestQuestion[] {
  const verbal = buildRwModule(`quest:${seed}`, 1, 'mixed').items.map(verbalQuestion);
  const math = buildMathModule(`quest:${seed}`, 1, 'mixed').map(mathQuestion).filter((q): q is QuestQuestion => q !== null);
  /*
    "mixed" XEN KẼ hai môn, không nối môn này sau môn kia. Bản nối đuôi đặt cả
    mô-đun Math (hơn chục câu) lên trước, mà một trận chỉ lấy 8–10 câu đầu —
    nên trận "hỗn hợp" nào cũng toàn Math, câu Verbal không bao giờ tới lượt.
  */
  const source = subject === 'math' ? math : subject === 'verbal' ? verbal : interleave(math, verbal);
  const fallback = [...source, ...rwPool().slice(0, count).map(verbalQuestion)];
  return Array.from({ length: count }, (_, index) => fallback[index % fallback.length]!);
}

/** Xen kẽ hai danh sách: a0, b0, a1, b1… — hết một bên thì nối nốt bên còn lại. */
function interleave<T>(a: readonly T[], b: readonly T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) out.push(a[i]!);
    if (i < b.length) out.push(b[i]!);
  }
  return out;
}
