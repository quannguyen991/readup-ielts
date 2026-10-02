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
  /**
   * Nhóm câu chung một khuôn: "Choose TWO letters" (mỗi đáp án một số câu), bảng /
   * sơ đồ / ghi chú điền chỗ trống. Câu cùng `groupId` phải đứng liền nhau.
   * TUỲ CHỌN — mọi bộ đề lưu từ trước không có trường này.
   */
  groupId?: string;
  /** Khuôn của cả nhóm; CHỈ có ở câu ĐẦU nhóm. */
  form?: QuestionForm;
  /** Số từ tối đa của đáp án điền ("NO MORE THAN TWO WORDS"); số tính là một từ. */
  maxWords?: number;
  /** Đáp án khác cũng được nhận (dạng điền từ). */
  accept?: string[];
};

/**
 * Khuôn dựng sẵn của một nhóm điền chỗ trống. `lines` chứa ô trống `{{k}}`, k đếm
 * từ 1 trong nhóm. Với bảng, mỗi hàng là một chuỗi `a | b | {{1}}`; hàng đầu là
 * tiêu đề cột. Với sơ đồ chữ, mỗi dòng là một nút.
 */
export type QuestionForm = {
  kind: 'table' | 'flow' | 'notes' | 'summary' | 'diagram';
  title?: string;
  lines: string[];
};

export type QuestionSet = {
  /**
   * Đơn hàng dạng câu đã dùng để sinh bộ này, dạng chuỗi đã sắp xếp.
   *
   * Có để so cache: cùng bài nhưng khác bộ lọc thì phải sinh lại. Rỗng nghĩa là
   * "không đặt dạng nào cả", khác với `undefined` của bộ đề cache từ bản cũ.
   */
  requestedTypes?: string;
  articleId: string;
  title: string;
  generatedBy: 'ai' | 'offline';
  model: string | null;
  createdAt: string;
  questions: GeneratedQuestion[];
  /** Dạng của khối nào đã đặt mà không dựng nổi (qua bộ kiểm) — để báo người học. */
  failedTypes?: QuestionType[];
};

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  true_false_not_given: 'True / False / Not Given',
  yes_no_not_given: 'Yes / No / Not Given',
  matching_headings: 'Matching Headings',
  matching_information: 'Matching Information',
  matching_features: 'Matching Features',
  matching_sentence_endings: 'Matching Sentence Endings',
  multiple_choice: 'Multiple Choice',
  sentence_completion: 'Sentence Completion',
  summary_completion: 'Summary Completion',
  short_answer: 'Short Answer',
  multiple_choice_multi: 'Multiple Choice (more than one answer)',
  note_completion: 'Note Completion',
  table_completion: 'Table Completion',
  flow_chart_completion: 'Flow-chart Completion',
  diagram_label_completion: 'Diagram Label Completion',
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

/**
 * Những dạng câu hỏi bộ sinh đề THẬT SỰ làm được lúc này.
 *
 * KHÔNG liệt kê dạng chưa cài. Bày "Matching Headings" ra bộ lọc rồi chọn vào
 * không ra câu nào là thất hứa ngay ở bước chọn bài — người dùng nghĩ app hỏng
 * chứ không nghĩ dạng đó chưa tồn tại.
 *
 * Danh sách này TỪNG chỉ có một dạng cho IELTS, và lúc đó nó đúng: bộ sinh chạy
 * bằng AI gọi thẳng SDK Anthropic qua `ANTHROPIC_API_KEY`, biến chưa bao giờ
 * được cấu hình, nên mọi bài đều rơi về `offline-generator.ts` vốn chỉ làm được
 * Multiple Choice. Nay bộ sinh đi qua hai proxy đang dùng và cả 13 dạng đã chạy
 * thật — kiểm từng dạng một, mỗi dạng 4 câu, tất cả ra đúng dạng đã đặt.
 *
 * VẪN CÒN ĐƯỜNG LÙI: proxy sập thì reader quay về bộ offline và chỉ có Multiple
 * Choice. Đó là lý do màn đọc bài vẫn giữ dòng báo "đang sinh offline" — người
 * học phải biết mình đang nhận bộ đề rút gọn, chứ không phải đoán.
 */
export const AVAILABLE_IELTS_TYPES: QuestionType[] = [
  'true_false_not_given',
  'yes_no_not_given',
  'matching_headings',
  'matching_information',
  'matching_features',
  'matching_sentence_endings',
  'multiple_choice',
  'sentence_completion',
  'summary_completion',
  'short_answer',
];

export const AVAILABLE_SAT_TYPES: QuestionType[] = [
  'sat_words_in_context',
  'sat_central_idea',
  'sat_command_of_evidence',
  'sat_inference',
  'sat_text_structure',
];
