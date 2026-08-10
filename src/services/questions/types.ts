import type { QuestionType } from '@/types/database';

export type GeneratedQuestion = {
  id: string;
  orderIndex: number;
  type: QuestionType;
  prompt: string;
  instruction: string | null;
  options: string[] | null;
  correctAnswer: string;
  /** Cụm chữ trong bài chứa đáp án — dùng để tô sáng ở màn Test Review. */
  evidenceText: string;
  evidenceParagraphIndex: number;
  explanation: string;
  lessonTip: string | null;
};

export type QuestionSet = {
  articleId: string;
  title: string;
  generatedBy: 'ai' | 'offline';
  model: string | null;
  createdAt: string;
  questions: GeneratedQuestion[];
};

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  true_false_not_given: 'True / False / Not Given',
  yes_no_not_given: 'Yes / No / Not Given',
  matching_headings: 'Matching Headings',
  matching_information: 'Matching Information',
  multiple_choice: 'Multiple Choice',
  sentence_completion: 'Sentence Completion',
  summary_completion: 'Summary Completion',
  short_answer: 'Short Answer',
};
