import geomQuestions from './seed/sat-math/real-tests-geom.json';

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

export const SAT_MATH_REAL_TEST_QUESTIONS: SatMathQuestion[] = geomQuestions as SatMathQuestion[];

export function getMathRealTestQuestionsByDifficulty(difficulty?: 'easy' | 'medium' | 'hard'): SatMathQuestion[] {
  if (!difficulty) return SAT_MATH_REAL_TEST_QUESTIONS;
  return SAT_MATH_REAL_TEST_QUESTIONS.filter((q) => q.difficulty === difficulty);
}
