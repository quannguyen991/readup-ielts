import type { WordStage } from './topic-study';

/**
 * Ba nhóm từ của một bộ, tách rời nhau:
 * - ĐÃ NHỚ: mức 2.
 * - CẦN ÔN TẬP: đang học (mức 1), hoặc từng trả lời sai mà chưa lên mức 2.
 * - CHƯA NHỚ: chưa học lần nào và chưa từng sai.
 * Người dùng yêu cầu 27/09/2026, lấy màn Flashcard/Quiz của The IELTS Dictionary làm mẫu.
 */
export type DeckStatus = 'mastered' | 'review' | 'new';

export function wordStatus(stage: WordStage | undefined, lapses: number | undefined): DeckStatus {
  if (stage === 2) return 'mastered';
  if (stage === 1 || (lapses ?? 0) > 0) return 'review';
  return 'new';
}

export function groupByStatus<W extends { word: string }>(
  words: readonly W[],
  stages: Readonly<Record<string, WordStage>> | undefined,
  lapses: Readonly<Record<string, number>> | undefined,
): Record<DeckStatus, W[]> {
  const out: Record<DeckStatus, W[]> = { mastered: [], review: [], new: [] };
  for (const w of words) out[wordStatus(stages?.[w.word], lapses?.[w.word])].push(w);
  return out;
}

/**
 * Mức mới sau một câu Quiz: đúng thì lên một nấc (tối đa 2), sai thì về tối đa
 * mức 1 — từ "đã nhớ" mà trả lời sai thì phải ôn lại, không giữ nguyên.
 */
export function stageAfterQuiz(stage: WordStage | undefined, correct: boolean): WordStage {
  const s = stage ?? 0;
  if (correct) return (Math.min(2, s + 1) as WordStage);
  return (Math.min(1, s) as WordStage);
}
