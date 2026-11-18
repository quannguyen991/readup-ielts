import EXPLANATIONS from './seed/ielts-reading-explanations.json';

/** Lời giải chi tiết từng câu của đề Reading Cambridge: lý do (tiếng Việt), câu trích trong bài và vị trí. */
export type ReadingExplanation = { vi: string; quote: string; where: string };

const TABLE = EXPLANATIONS as Record<string, Record<string, ReadingExplanation>>;

export function readingExplanation(testId: string, questionNumber: number): ReadingExplanation | null {
  const hit = TABLE[testId]?.[String(questionNumber)];
  return hit && hit.vi ? hit : null;
}

export function hasReadingExplanations(testId: string): boolean {
  return Boolean(TABLE[testId]);
}
