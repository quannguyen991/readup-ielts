import geomQuestions from './seed/sat-math/real-tests-geom.json';
import recent20242025Math from './seed/sat-math/real-tests-2024-2025.json';
import officialQbankMath from './seed/sat-math/official-qbank-math.json';

export type SatMathQuestion = {
  id: string;
  questionNumber: number;
  domain: string;
  skill: string;
  difficulty: 'easy' | 'medium' | 'hard';
  stem: string;
  options: string[];
  isMultipleChoice: boolean;
  correctAnswer: string;
  answerIndex: number;
  explanation: string;
  sourceBook?: string;
};

export const SAT_MATH_REAL_TEST_QUESTIONS: SatMathQuestion[] = [
  ...geomQuestions,
  ...recent20242025Math,
  ...officialQbankMath,
] as SatMathQuestion[];

export function getMathRealTestQuestionsByDifficulty(difficulty?: 'easy' | 'medium' | 'hard'): SatMathQuestion[] {
  if (!difficulty) return SAT_MATH_REAL_TEST_QUESTIONS;
  return SAT_MATH_REAL_TEST_QUESTIONS.filter((q) => q.difficulty === difficulty);
}
