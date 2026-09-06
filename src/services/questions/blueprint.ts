import type { QuestionType } from '@/types/database';
import { hashString, mulberry32 } from './rng';

/**
 * Bản thiết kế một passage IELTS Reading — mấy KHỐI dạng câu, mỗi khối mấy câu.
 *
 * VÌ SAO PHẢI CÓ. Bộ sinh cũ rải dạng câu theo lô rồi trộn lẫn, nên một passage
 * ra kiểu: TFNG, điền từ, TFNG, trắc nghiệm, nối tiêu đề, điền từ… Đề thật không
 * bao giờ như vậy: nó đi thành KHỐI — "Questions 1–6: do the following statements
 * agree…", rồi "Questions 7–13: complete the notes below".
 *
 * Khác biệt không phải chuyện thẩm mỹ. Mỗi khối có MỘT lời dẫn dùng chung, và cả
 * chiến thuật làm bài của khối ấy là chung: TFNG thì quét theo thứ tự câu hỏi,
 * nối tiêu đề thì đọc lướt từng đoạn trước. Trộn lẫn thì người luyện không bao
 * giờ luyện được nhịp làm bài thật, mà nhịp mới là thứ hỏng đầu tiên trong phòng
 * thi.
 *
 * BA VỊ TRÍ, BA BỘ THIẾT KẾ KHÁC NHAU. Passage 1 dễ và thiên về tra thông tin;
 * passage 3 dài, nhiều lập luận, nên nặng trắc nghiệm và quan điểm tác giả. Dùng
 * chung một bộ cho cả ba là bỏ mất chính cái đường dốc mà đề thi dựng ra.
 */

export type QuestionBlock = {
  type: QuestionType;
  count: number;
};

export type PassageBlueprint = {
  /** Vị trí trong đề: 1, 2 hay 3. */
  position: 1 | 2 | 3;
  blocks: QuestionBlock[];
};

/**
 * Các bố cục có thật của từng vị trí passage.
 *
 * Mỗi bố cục tổng 13 câu — đúng khổ một passage của đề 40 câu. Bố cục lấy theo
 * những tổ hợp hay gặp trong đề Cambridge, nhưng KHÔNG chép đề: đây là khung
 * dạng câu, còn nội dung câu vẫn sinh từ bài đọc của app.
 */
const LAYOUTS: Record<1 | 2 | 3, QuestionBlock[][]> = {
  1: [
    [
      { type: 'true_false_not_given', count: 7 },
      { type: 'summary_completion', count: 6 },
    ],
    [
      { type: 'matching_information', count: 5 },
      { type: 'sentence_completion', count: 4 },
      { type: 'short_answer', count: 4 },
    ],
    [
      { type: 'true_false_not_given', count: 6 },
      { type: 'short_answer', count: 3 },
      { type: 'sentence_completion', count: 4 },
    ],
  ],
  2: [
    [
      { type: 'matching_headings', count: 6 },
      { type: 'true_false_not_given', count: 4 },
      { type: 'sentence_completion', count: 3 },
    ],
    [
      { type: 'matching_features', count: 5 },
      { type: 'summary_completion', count: 5 },
      { type: 'multiple_choice', count: 3 },
    ],
    [
      { type: 'yes_no_not_given', count: 6 },
      { type: 'matching_information', count: 4 },
      { type: 'matching_sentence_endings', count: 3 },
    ],
  ],
  3: [
    [
      { type: 'multiple_choice', count: 5 },
      { type: 'yes_no_not_given', count: 5 },
      { type: 'summary_completion', count: 3 },
    ],
    [
      { type: 'matching_headings', count: 5 },
      { type: 'multiple_choice', count: 4 },
      { type: 'matching_sentence_endings', count: 4 },
    ],
    [
      { type: 'yes_no_not_given', count: 7 },
      { type: 'matching_features', count: 3 },
      { type: 'multiple_choice', count: 3 },
    ],
  ],
};

/** Số câu của một passage trong đề 40 câu. */
export const QUESTIONS_PER_PASSAGE = 13;

/**
 * Bản thiết kế cho một passage, TẤT ĐỊNH theo `seed`.
 *
 * Cùng một bài trong cùng một đề thì luôn ra cùng bố cục. Bốc ngẫu nhiên mỗi lần
 * mở sẽ khiến người học làm lại một đề và gặp cấu trúc khác — lúc đó "làm lại đề
 * cũ" không còn là làm lại nữa, và cũng không so được hai lần làm.
 */
export function blueprintFor(position: 1 | 2 | 3, seed: string): PassageBlueprint {
  const layouts = LAYOUTS[position];
  const rng = mulberry32(hashString(`${position}:${seed}`));
  const picked = layouts[Math.floor(rng() * layouts.length)] ?? layouts[0];
  return { position, blocks: (picked as QuestionBlock[]).map((b) => ({ ...b })) };
}

/** Mọi dạng câu mà bản thiết kế này cần, theo đúng thứ tự khối. */
export function typesOf(blueprint: PassageBlueprint): QuestionType[] {
  return blueprint.blocks.map((b) => b.type);
}

/** Tổng số câu của bản thiết kế. */
export function totalOf(blueprint: PassageBlueprint): number {
  return blueprint.blocks.reduce((sum, b) => sum + b.count, 0);
}

/**
 * Lời dẫn của từng khối — thứ đứng trên đầu "Questions 1–6".
 *
 * Viết bằng tiếng Anh và bám sát chữ của đề thật, vì đọc hiểu đúng lời dẫn cũng
 * là một phần của kỹ năng làm bài: rất nhiều người mất điểm TFNG chỉ vì không
 * phân biệt được "NOT GIVEN" với "FALSE", mà chỗ phân biệt nằm ngay trong lời dẫn.
 */
export const BLOCK_RUBRIC: Readonly<Record<QuestionType, string>> = Object.freeze({
  true_false_not_given:
    'Do the following statements agree with the information given in the Reading Passage?\nWrite TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.',
  yes_no_not_given:
    "Do the following statements agree with the claims of the writer in the Reading Passage?\nWrite YES if the statement agrees with the claims of the writer, NO if the statement contradicts the claims of the writer, NOT GIVEN if it is impossible to say what the writer thinks about this.",
  matching_headings:
    'The Reading Passage has several paragraphs. Choose the correct heading for each paragraph from the list of headings below.',
  matching_information:
    'Which paragraph contains the following information? You may use any letter more than once.',
  matching_features:
    'Look at the following statements and the list of options below. Match each statement with the correct option.',
  matching_sentence_endings:
    'Complete each sentence with the correct ending from the list below.',
  multiple_choice: 'Choose the correct letter, A, B, C or D.',
  sentence_completion:
    'Complete the sentences below. Choose ONE WORD ONLY from the passage for each answer.',
  summary_completion:
    'Complete the notes below. Choose ONE WORD AND/OR A NUMBER from the passage for each answer.',
  short_answer:
    'Answer the questions below. Choose NO MORE THAN THREE WORDS from the passage for each answer.',
  // Bốn dạng SAT không xuất hiện trong đề IELTS, nhưng kiểu dữ liệu dùng chung
  // nên vẫn phải khai đủ. Để trống thì `Record` không đủ khoá và TypeScript bắt.
  sat_words_in_context: '',
  sat_central_idea: '',
  sat_command_of_evidence: '',
  sat_inference: '',
  sat_text_structure: '',
  sat_transitions: '',
  sat_rhetorical_synthesis: '',
  sat_boundaries: '',
  sat_form_structure_sense: '',
});
