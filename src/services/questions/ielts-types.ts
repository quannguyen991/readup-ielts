import type { QuestionType } from '@/types/database';

/**
 * Bộ dạng bài IELTS Reading đầy đủ, một nơi duy nhất.
 *
 * Mọi chỗ cần biết "IELTS Reading có những dạng nào, gọi tắt là gì, sinh ra sao"
 * (thẻ bài ở thư viện, bộ lọc, hộp "Tạo đề", bộ sinh AI, bộ kiểm) đều đọc ở đây.
 * Thêm một dạng mới = thêm một dòng vào `IELTS_TYPE_SPECS`, không sửa ở nơi khác.
 *
 * `family` quyết định cách vẽ và cách chấm:
 *   - tf        : ba nhãn cố định (TRUE/FALSE/NOT GIVEN, YES/NO/NOT GIVEN)
 *   - choice    : chọn một / nhiều phương án
 *   - matching  : nối với một danh sách dùng chung (tiêu đề, đoạn, người/vật, vế câu)
 *   - completion: gõ chữ lấy từ bài, có giới hạn số từ
 *   - form      : điền vào một khuôn (bảng, sơ đồ, ghi chú) mang nhiều chỗ trống
 */

export type TypeFamily = 'tf' | 'choice' | 'matching' | 'completion' | 'form';

export type IeltsTypeSpec = {
  type: QuestionType;
  family: TypeFamily;
  /** Nhãn tắt trên thẻ bài và chip lọc. */
  short: string;
  /** Tên đầy đủ, đúng cách đề thi gọi. */
  label: string;
  /** Mô tả một câu cho hộp "Tạo đề". */
  hintVi: string;
  hintEn: string;
  /** Số câu mặc định của một khối dạng này trong một passage 13 câu. */
  defaultCount: number;
  minCount: number;
  maxCount: number;
  /** Bài phải có ít nhất ngần này đoạn mới ra được dạng này (nối tiêu đề cần nhiều đoạn). */
  minParagraphs?: number;
  /** Bài phải có ít nhất ngần này từ. */
  minWords?: number;
};

export const IELTS_TYPE_SPECS: readonly IeltsTypeSpec[] = [
  {
    type: 'true_false_not_given', family: 'tf', short: 'T/F/NG', label: 'True / False / Not Given',
    hintVi: 'Đúng, sai hay không có thông tin', hintEn: 'Agrees, contradicts or not stated',
    defaultCount: 6, minCount: 3, maxCount: 8,
  },
  {
    type: 'yes_no_not_given', family: 'tf', short: 'Y/N/NG', label: 'Yes / No / Not Given',
    hintVi: 'Quan điểm của tác giả', hintEn: "The writer's claims",
    defaultCount: 5, minCount: 3, maxCount: 8, minWords: 500,
  },
  {
    type: 'multiple_choice', family: 'choice', short: 'Multiple Choice', label: 'Multiple Choice',
    hintVi: 'Chọn một đáp án A–D', hintEn: 'Pick one answer, A–D',
    defaultCount: 4, minCount: 2, maxCount: 6,
  },
  {
    type: 'multiple_choice_multi', family: 'choice', short: 'Choose TWO', label: 'Multiple Choice (Choose TWO)',
    hintVi: 'Chọn 2 đáp án trong 5–7 lựa chọn', hintEn: 'Pick two answers from five to seven options',
    defaultCount: 2, minCount: 2, maxCount: 3, minWords: 400,
  },
  {
    type: 'matching_headings', family: 'matching', short: 'Headings', label: 'Matching Headings',
    hintVi: 'Chọn tiêu đề cho từng đoạn', hintEn: 'Choose a heading for each paragraph',
    defaultCount: 5, minCount: 3, maxCount: 7, minParagraphs: 5, minWords: 500,
  },
  {
    type: 'matching_information', family: 'matching', short: 'Match Info', label: 'Matching Information',
    hintVi: 'Thông tin này nằm ở đoạn nào', hintEn: 'Which paragraph contains this information',
    defaultCount: 4, minCount: 3, maxCount: 7, minParagraphs: 4,
  },
  {
    type: 'matching_features', family: 'matching', short: 'Match Features', label: 'Matching Features',
    hintVi: 'Nối nhận định với người hoặc vật', hintEn: 'Match statements to people or things',
    defaultCount: 4, minCount: 3, maxCount: 6, minWords: 500,
  },
  {
    type: 'matching_sentence_endings', family: 'matching', short: 'Sentence Endings', label: 'Matching Sentence Endings',
    hintVi: 'Nối nửa câu với phần kết phù hợp', hintEn: 'Join each sentence start to its ending',
    defaultCount: 4, minCount: 3, maxCount: 6, minWords: 500,
  },
  {
    type: 'sentence_completion', family: 'completion', short: 'Sentence Completion', label: 'Sentence Completion',
    hintVi: 'Điền từ vào câu, theo giới hạn số từ', hintEn: 'Fill each sentence, within the word limit',
    defaultCount: 4, minCount: 3, maxCount: 7,
  },
  {
    type: 'short_answer', family: 'completion', short: 'Short Answer', label: 'Short-answer Questions',
    hintVi: 'Trả lời ngắn bằng chữ trong bài', hintEn: 'Answer briefly with words from the text',
    defaultCount: 4, minCount: 3, maxCount: 6,
  },
  {
    type: 'summary_completion', family: 'form', short: 'Summary', label: 'Summary Completion',
    hintVi: 'Điền đoạn tóm tắt (có thể kèm bảng từ A–I)', hintEn: 'Complete a summary (optionally from a word list)',
    defaultCount: 5, minCount: 4, maxCount: 7, minWords: 400,
  },
  {
    type: 'note_completion', family: 'form', short: 'Notes', label: 'Note Completion',
    hintVi: 'Điền ghi chú theo mục', hintEn: 'Complete structured notes',
    defaultCount: 5, minCount: 4, maxCount: 7, minWords: 400,
  },
  {
    type: 'table_completion', family: 'form', short: 'Table', label: 'Table Completion',
    hintVi: 'Điền các ô trống trong bảng', hintEn: 'Fill the blank cells in a table',
    defaultCount: 5, minCount: 4, maxCount: 7, minWords: 400,
  },
  {
    type: 'flow_chart_completion', family: 'form', short: 'Flow-chart', label: 'Flow-chart Completion',
    hintVi: 'Điền các bước trong sơ đồ quy trình', hintEn: 'Fill the steps of a process flow-chart',
    defaultCount: 5, minCount: 4, maxCount: 7, minWords: 400,
  },
  {
    type: 'diagram_label_completion', family: 'form', short: 'Diagram', label: 'Diagram Label Completion',
    hintVi: 'Điền nhãn cho sơ đồ (dạng chữ)', hintEn: 'Label the parts of a diagram (text form)',
    defaultCount: 4, minCount: 4, maxCount: 6, minWords: 400,
  },
];

export const IELTS_TYPES_ALL: readonly QuestionType[] = IELTS_TYPE_SPECS.map((s) => s.type);

const SPEC = new Map<QuestionType, IeltsTypeSpec>(IELTS_TYPE_SPECS.map((s) => [s.type, s]));

export function specOf(type: QuestionType): IeltsTypeSpec | undefined {
  return SPEC.get(type);
}

/** Nhãn tắt cho chip. Dạng không phải IELTS (SAT) trả về nhãn của chính nó. */
export function shortLabel(type: QuestionType): string {
  return SPEC.get(type)?.short ?? SAT_SHORT[type] ?? type;
}

export function fullLabel(type: QuestionType): string {
  return SPEC.get(type)?.label ?? SAT_FULL[type] ?? type;
}

const SAT_SHORT: Partial<Record<QuestionType, string>> = {
  sat_words_in_context: 'Words in Context',
  sat_central_idea: 'Central Ideas',
  sat_command_of_evidence: 'Evidence',
  sat_inference: 'Inferences',
  sat_text_structure: 'Text Structure',
  sat_transitions: 'Transitions',
  sat_rhetorical_synthesis: 'Rhetorical Synthesis',
  sat_boundaries: 'Boundaries',
  sat_form_structure_sense: 'Form & Sense',
};

const SAT_FULL: Partial<Record<QuestionType, string>> = {
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

/** Dạng nào cần khuôn dựng sẵn (nhiều chỗ trống chung một cấu trúc). */
export const FORM_TYPES: ReadonlySet<QuestionType> = new Set([
  'note_completion',
  'table_completion',
  'flow_chart_completion',
  'diagram_label_completion',
]);

/** Dạng sinh bằng khối có cấu trúc (JSON nhóm), không phải danh sách câu phẳng. */
export const STRUCTURED_TYPES: ReadonlySet<QuestionType> = new Set([
  'matching_headings',
  'matching_features',
  'matching_sentence_endings',
  'multiple_choice_multi',
  'summary_completion',
  'note_completion',
  'table_completion',
  'flow_chart_completion',
  'diagram_label_completion',
]);

/** Dạng gõ chữ lấy từ bài — đáp án phải có thật trong bài, và có giới hạn số từ. */
export const COMPLETION_TYPES: ReadonlySet<QuestionType> = new Set([
  'sentence_completion',
  'summary_completion',
  'note_completion',
  'table_completion',
  'flow_chart_completion',
  'diagram_label_completion',
  'short_answer',
]);

/** Dạng nối với danh sách chung. */
export const LIST_MATCH_TYPES: ReadonlySet<QuestionType> = new Set([
  'matching_headings',
  'matching_features',
  'matching_sentence_endings',
]);

export type ArticleShape = { paragraphs?: number; words?: number | null };

/**
 * Bài này có đủ chất liệu để sinh dạng này không.
 *
 * Chỉ dùng số liệu RẺ (số từ, khổ passage) để thẻ bài ở thư viện không phải nạp
 * toàn văn từng bài. Kiểm kỹ hơn (đủ đoạn, đáp án có trong bài) do bộ kiểm làm
 * sau khi sinh.
 */
export function canGenerate(type: QuestionType, shape: ArticleShape): boolean {
  const spec = SPEC.get(type);
  if (!spec) return false;
  if (spec.minParagraphs !== undefined && shape.paragraphs !== undefined && shape.paragraphs < spec.minParagraphs) {
    return false;
  }
  if (spec.minWords !== undefined && shape.words !== undefined && shape.words !== null && shape.words < spec.minWords) {
    return false;
  }
  return true;
}

export type MixBlock = { type: QuestionType; count: number };

/** Tổng số câu của một passage thật. */
export const PASSAGE_TOTAL = 13;

/**
 * Chia 13 câu cho các dạng đã chọn, bám số câu mặc định của từng dạng rồi bù/bớt
 * ở dạng còn dư địa. Không bao giờ trả số câu ngoài [min, max] của dạng.
 */
export function buildMix(types: readonly QuestionType[], total = PASSAGE_TOTAL): MixBlock[] {
  const specs = types.map((t) => SPEC.get(t)).filter((s): s is IeltsTypeSpec => Boolean(s));
  if (specs.length === 0) return [];
  const counts = specs.map((s) => s.defaultCount);
  let sum = counts.reduce((a, b) => a + b, 0);
  let guard = 200;
  while (sum !== total && guard-- > 0) {
    const grow = sum < total;
    let moved = false;
    for (let i = 0; i < specs.length && sum !== total; i += 1) {
      const s = specs[i] as IeltsTypeSpec;
      const next = (counts[i] as number) + (grow ? 1 : -1);
      if (next < s.minCount || next > s.maxCount) continue;
      counts[i] = next;
      sum += grow ? 1 : -1;
      moved = true;
    }
    if (!moved) break;
  }
  return specs.map((s, i) => ({ type: s.type, count: counts[i] as number }));
}

/**
 * Mấy bố cục "đề thật" cho một vị trí passage — đủ dạng mới, dùng làm mặc định khi
 * bấm "Tạo đề" một chạm. Mỗi bố cục là ba dạng, 13 câu.
 */
export const DEFAULT_MIXES: Record<1 | 2 | 3, QuestionType[][]> = {
  1: [
    ['true_false_not_given', 'note_completion', 'short_answer'],
    ['matching_information', 'table_completion', 'true_false_not_given'],
    ['true_false_not_given', 'sentence_completion', 'summary_completion'],
  ],
  2: [
    ['matching_headings', 'multiple_choice', 'sentence_completion'],
    ['true_false_not_given', 'summary_completion', 'multiple_choice_multi'],
    ['matching_information', 'flow_chart_completion', 'multiple_choice'],
  ],
  3: [
    ['multiple_choice', 'yes_no_not_given', 'matching_sentence_endings'],
    ['yes_no_not_given', 'matching_features', 'multiple_choice_multi'],
    ['matching_headings', 'yes_no_not_given', 'summary_completion'],
  ],
};

/** Bố cục mặc định tất định theo id bài, lọc theo chất liệu của bài. */
export function defaultMixFor(
  position: 1 | 2 | 3,
  seed: string,
  shape: ArticleShape,
): MixBlock[] {
  const options = DEFAULT_MIXES[position];
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let k = 0; k < options.length; k += 1) {
    const types = options[(h + k) % options.length] as QuestionType[];
    if (types.every((t) => canGenerate(t, shape))) return buildMix(types);
  }
  // Bài ngắn / ít đoạn: lùi về ba dạng không đòi gì.
  return buildMix(['true_false_not_given', 'sentence_completion', 'multiple_choice']);
}
