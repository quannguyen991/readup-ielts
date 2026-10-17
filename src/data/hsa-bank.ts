import type { Bi } from '@/i18n/useL';
import { HSA_FORM_1, type HsaQuestion, type HsaQuestionKind } from './hsa';
import { HSA_ADVANCED_SET } from './hsa-advanced';
import { HSA_EXTENDED_PRACTICE } from './hsa-extended-practice';
import { HSA_FORM_2, HSA_FORM_3 } from './hsa-more-forms';

export type HsaPaper = { id: string; title: Bi; questions: readonly HsaQuestion[] };

const ORIGINAL_PAPERS: readonly HsaPaper[] = [
  { id: '1', title: { vi: 'Đề mô phỏng 01', en: 'Practice paper 01' }, questions: HSA_FORM_1 },
  { id: '2', title: { vi: 'Đề mô phỏng 02', en: 'Practice paper 02' }, questions: HSA_FORM_2 },
  { id: '3', title: { vi: 'Đề mô phỏng 03', en: 'Practice paper 03' }, questions: HSA_FORM_3 },
];

const LANGUAGE_BLUEPRINT: readonly [HsaQuestionKind, number][] = [
  ['sentence-completion', 10],
  ['synonym-antonym', 4],
  ['dialogue-completion', 4],
  ['dialogue-ordering', 4],
  ['sentence-rewriting', 4],
  ['sentence-combination', 4],
];

function rotatePick<T>(items: readonly T[], start: number, count: number): T[] {
  if (!items.length) return [];
  return Array.from({ length: Math.min(count, items.length) }, (_, index) => items[(start + index) % items.length]!);
}

function contextGroups(kind: HsaQuestionKind): HsaQuestion[][] {
  const groups = new Map<string, HsaQuestion[]>();
  for (const question of ORIGINAL_PAPERS.flatMap((paper) => paper.questions)) {
    if (question.kind !== kind) continue;
    const key = question.context ?? question.id;
    groups.set(key, [...(groups.get(key) ?? []), question]);
  }
  return [...groups.values()].filter((group) => group.length === 5);
}

function createRotatedPaper(number: number): HsaPaper {
  const allOriginalQuestions = ORIGINAL_PAPERS.flatMap((paper) => paper.questions);
  const questions: HsaQuestion[] = [];
  for (const [kind, count] of LANGUAGE_BLUEPRINT) {
    const pool = allOriginalQuestions.filter((question) => question.kind === kind);
    questions.push(...rotatePick(pool, (number * count + number) % pool.length, count));
  }

  const reasoningPool = [
    ...allOriginalQuestions.filter((question) => question.kind === 'reasoning'),
    ...HSA_ADVANCED_SET.filter((question) => question.kind === 'reasoning'),
  ];
  questions.push(...rotatePick(reasoningPool, number * 3, 5));

  // Keep the five blanks from one passage together, as they appear in the HSA format.
  const clozeSets = contextGroups('cloze');
  questions.push(...(clozeSets[(number - 4) % clozeSets.length] ?? []));

  // Reading passages rotate by cluster; item order changes while each cluster remains intact.
  const readingSets = contextGroups('reading-comprehension');
  const firstIndex = (number * 5) % readingSets.length;
  let secondIndex = (firstIndex + 1 + (number % (readingSets.length - 1))) % readingSets.length;
  if (secondIndex === firstIndex) secondIndex = (firstIndex + 1) % readingSets.length;
  questions.push(...rotatePick(readingSets[firstIndex] ?? [], number, 5));
  questions.push(...rotatePick(readingSets[secondIndex] ?? [], number + 2, 5));

  const id = String(number);
  return { id, title: { vi: `Đề mô phỏng ${id.padStart(2, '0')}`, en: `Practice paper ${id.padStart(2, '0')}` }, questions };
}

/** Twenty fixed, blueprint-shaped forms selected from the original item bank. */
export const HSA_PAPERS: readonly HsaPaper[] = [
  ...ORIGINAL_PAPERS,
  ...Array.from({ length: 17 }, (_, index) => createRotatedPaper(index + 4)),
];

/** Unique authored questions; rotated papers reuse these items in different combinations. */
export const HSA_QUESTION_BANK: readonly HsaQuestion[] = [
  ...ORIGINAL_PAPERS.flatMap((paper) => paper.questions),
  ...HSA_ADVANCED_SET,
  ...HSA_EXTENDED_PRACTICE,
];
