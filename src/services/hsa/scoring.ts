import type { HsaLevel, HsaQuestion, HsaQuestionKind } from '@/data/hsa';
import { CRITERIA, KIND_CRITERION, LEVELS, type CriterionId } from './criteria';

/** Một câu đã làm, đủ để chấm lại và để hiện lời giải ở trang kết quả. */
export type AttemptItem = {
  qid: string;
  kind: HsaQuestionKind;
  level: HsaLevel;
  topic: string;
  /** Đáp án đã chọn; null là bỏ qua. */
  picked: number | null;
  answer: number;
};

export function itemsFrom(questions: readonly HsaQuestion[], answers: readonly (number | null)[]): AttemptItem[] {
  return questions.map((q, i) => ({ qid: q.id, kind: q.kind, level: q.level, topic: q.topic, picked: answers[i] ?? null, answer: q.answer }));
}

export type Tally = { correct: number; wrong: number; skipped: number; total: number };
export type CriterionResult = Tally & { id: CriterionId; pct: number | null; score10: number | null; state: 'strong' | 'ok' | 'weak' | 'none' };
export type LevelResult = Tally & { level: HsaLevel; pct: number | null };
export type KindResult = Tally & { kind: HsaQuestionKind; pct: number | null };
/**
 * Mức ước lượng: `reached` là mức cao nhất qua liên tiếp; `below` là mức đo được đầu tiên mà chưa qua
 * khi chưa qua mức nào (hiện thành "dưới B2"). Cả hai null nghĩa là chưa đủ câu để kết luận.
 */
export type CefrEstimate = { reached: HsaLevel | null; below: HsaLevel | null };

export type ScoreReport = Tally & {
  accuracy: number;
  /** Quy về thang 50 câu của đề thật: chỉ để so các bài với nhau, không phải điểm HSA. */
  score50: number;
  cefr: CefrEstimate;
  criteria: CriterionResult[];
  levels: LevelResult[];
  kinds: KindResult[];
  strongest: CriterionId | null;
  weakest: CriterionId | null;
};

const empty = (): Tally => ({ correct: 0, wrong: 0, skipped: 0, total: 0 });

function add(t: Tally, item: AttemptItem): void {
  t.total += 1;
  if (item.picked === null) t.skipped += 1;
  else if (item.picked === item.answer) t.correct += 1;
  else t.wrong += 1;
}

const pctOf = (t: Tally): number | null => (t.total === 0 ? null : t.correct / t.total);

/** Ngưỡng: từ 80% là vững, 60% là tạm ổn, dưới 60% là cần luyện thêm. */
export function stateOf(pct: number | null): CriterionResult['state'] {
  if (pct === null) return 'none';
  if (pct >= 0.8) return 'strong';
  if (pct >= 0.6) return 'ok';
  return 'weak';
}

/**
 * Ước lượng mức CEFR: đi từ A2 lên C1, mức nào có ít nhất 2 câu mà đúng từ 60% thì qua, gặp mức
 * không qua thì dừng. Mức nào ít hơn 2 câu thì bỏ qua, không dùng để kết luận. Ngân hàng câu có rất ít
 * câu A2 và B1, nên người yếu thường chỉ đo được từ B2: khi đó kết quả là "dưới B2", không bịa ra A1.
 */
export function estimateCefr(levels: readonly LevelResult[]): CefrEstimate {
  let reached: HsaLevel | null = null;
  for (const l of levels) {
    if (l.total < 2) continue;
    if ((l.pct ?? 0) >= 0.6) reached = l.level;
    else return { reached, below: reached ? null : l.level };
  }
  return { reached, below: null };
}

export function scoreItems(items: readonly AttemptItem[]): ScoreReport {
  const all = empty();
  const byCriterion = new Map<CriterionId, Tally>(CRITERIA.map((c) => [c.id, empty()]));
  const byLevel = new Map<HsaLevel, Tally>(LEVELS.map((l) => [l, empty()]));
  const byKind = new Map<HsaQuestionKind, Tally>();

  for (const item of items) {
    add(all, item);
    add(byCriterion.get(KIND_CRITERION[item.kind])!, item);
    add(byLevel.get(item.level)!, item);
    if (!byKind.has(item.kind)) byKind.set(item.kind, empty());
    add(byKind.get(item.kind)!, item);
  }

  const criteria: CriterionResult[] = CRITERIA.map((c) => {
    const t = byCriterion.get(c.id)!;
    const pct = pctOf(t);
    return { id: c.id, ...t, pct, score10: pct === null ? null : Math.round(pct * 100) / 10, state: stateOf(pct) };
  });
  const levels: LevelResult[] = LEVELS.map((level) => ({ level, ...byLevel.get(level)!, pct: pctOf(byLevel.get(level)!) }));
  const kinds: KindResult[] = [...byKind.entries()].map(([kind, t]) => ({ kind, ...t, pct: pctOf(t) }));

  const measured = criteria.filter((c) => c.pct !== null);
  const sorted = [...measured].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
  // Chỉ gọi "mạnh nhất" và "yếu nhất" khi có ít nhất hai tiêu chí và điểm của chúng thật sự khác nhau.
  const spread = measured.length >= 2 && sorted[0]!.pct !== sorted[sorted.length - 1]!.pct;
  const strongest = spread ? sorted[0]!.id : null;
  const weakest = spread ? sorted[sorted.length - 1]!.id : null;

  const accuracy = all.total === 0 ? 0 : all.correct / all.total;
  return {
    ...all,
    accuracy,
    score50: Math.round(accuracy * 50),
    cefr: estimateCefr(levels),
    criteria,
    levels,
    kinds,
    strongest,
    weakest,
  };
}

/** Gộp nhiều lượt làm (ví dụ cả 5 phần bài test đầu vào) thành một bảng điểm. */
export function mergeReports(lists: readonly (readonly AttemptItem[])[]): ScoreReport {
  return scoreItems(lists.flat());
}
