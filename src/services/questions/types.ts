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
  // Giữ nguyên tên tiếng Anh của College Board — người luyện SAT tra tài liệu
  // theo đúng những tên này.
  sat_words_in_context: 'Words in Context',
  sat_central_idea: 'Central Ideas and Details',
  sat_command_of_evidence: 'Command of Evidence',
  sat_inference: 'Inferences',
  sat_text_structure: 'Text Structure and Purpose',
  sat_transitions: 'Transitions',
  sat_rhetorical_synthesis: 'Rhetorical Synthesis',
  sat_boundaries: 'Boundaries',
  sat_form_structure_sense: 'Form, Structure, and Sense',
};

/**
 * Bốn dạng thuộc hai domain "Writing" của SAT Reading and Writing.
 *
 * Tách riêng với `SAT_QUESTION_TYPES` (hai domain đọc hiểu) vì người luyện chọn
 * giữa hai nhóm này — đề thi thật trộn chung, nhưng lúc luyện thì tách ra mới
 * biết mình yếu chỗ nào.
 */
export const SAT_WRITING_QUESTION_TYPES: readonly QuestionType[] = [
  'sat_transitions',
  'sat_rhetorical_synthesis',
  'sat_boundaries',
  'sat_form_structure_sense',
];

/** Dạng câu của kỳ thi nào — dùng để lọc và để chọn bộ sinh đề. */
export const SAT_QUESTION_TYPES: readonly QuestionType[] = [
  'sat_words_in_context',
  'sat_central_idea',
  'sat_command_of_evidence',
  'sat_inference',
  'sat_text_structure',
];
