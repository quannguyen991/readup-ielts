import { buildRwModule, rwPool } from '@/services/sat-rw/mock/build';
import { buildMockModule as buildMathModule } from '@/services/math/mock';
import type { MathItem } from '@/lib/math/types';
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
  };
}

export function buildQuestQuestions(seed: string, count: number, subject: QuestSubject): QuestQuestion[] {
  const verbal = buildRwModule(`quest:${seed}`, 1, 'mixed').items.map(verbalQuestion);
  const math = buildMathModule(`quest:${seed}`, 1, 'mixed').map(mathQuestion).filter((q): q is QuestQuestion => q !== null);
  const source = subject === 'math' ? math : subject === 'verbal' ? verbal : [...math, ...verbal];
  const fallback = [...source, ...rwPool().slice(0, count).map(verbalQuestion)];
  return Array.from({ length: count }, (_, index) => fallback[index % fallback.length]!);
}
