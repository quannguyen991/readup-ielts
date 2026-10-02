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
/**
 * Năm HỌ dạng câu mà bộ sinh bằng luật dựng được chắc chắn.
 *
 * Ba dạng nối (Headings, Features, Sentence Endings) đã bị rút khỏi bố cục. Cả
 * ba đòi trừu tượng hoá cả một đoạn hoặc dựng một danh sách lựa chọn có nghĩa —
 * code không có vốn từ để làm, và bản trước cố làm thì ra "tiêu đề là 9 từ đầu
 * của chính đoạn đó", ghép chuỗi là xong.
 *
 * Thà năm dạng dựng đúng còn hơn tám dạng có ba dạng đoán được. Ba dạng kia vẫn
 * còn trong `QuestionType` và vẫn dùng được ở nhánh luyện xen kẽ.
 */
export const RULE_SUPPORTED_TYPES: readonly QuestionType[] = [
  'true_false_not_given',
  'yes_no_not_given',
  'multiple_choice',
  'sentence_completion',
  'summary_completion',
  'short_answer',
  'matching_information',
];

const LAYOUTS: Record<1 | 2 | 3, QuestionBlock[][]> = {
  1: [
    [
      { type: 'true_false_not_given', count: 7 },
      { type: 'sentence_completion', count: 6 },
    ],
    [
      { type: 'matching_information', count: 5 },
      { type: 'short_answer', count: 4 },
      { type: 'summary_completion', count: 4 },
    ],
    [
      { type: 'true_false_not_given', count: 6 },
      { type: 'summary_completion', count: 7 },
    ],
    /*
      Ba khối nhỏ, thay vì hai khối lớn.

      Một khối bảy câu đòi bảy câu nguồn cùng dựng được một dạng; ba khối bốn tới
      năm câu chia gánh nặng ấy ra ba dạng khác nhau, nên bài đọc nghèo một dạng
      vẫn lấp đủ. Đề thật có cả hai kiểu, nên đây không phải sáng tác thêm.
    */
    [
      { type: 'true_false_not_given', count: 5 },
      { type: 'sentence_completion', count: 4 },
      { type: 'summary_completion', count: 4 },
    ],
  ],
  /*
    MỖI VỊ TRÍ CHỈ CÒN MỘT BỐ CỤC DÙNG DẠNG NỐI THÔNG TIN.

    Đo trên cả kho: "ý này nằm ở đoạn nào" chỉ lấp được 46% số chỗ, vì nó đòi câu
    nguồn vừa ngắn vừa đủ vốn từ để nói lại ba chỗ. Passage 2 trước đây có tới
    hai trong ba bố cục dựng trên dạng ấy cộng dạng trả lời ngắn, nên chỉ 27% số
    bài lấp nổi mười ba câu — trong khi passage 3 đạt 72%.

    Vẫn giữ đúng một bố cục có dạng ấy ở mỗi vị trí: đề thật có dạng này, bỏ hẳn
    là bớt mất một dạng người học phải biết. Nhưng nó không còn là đường duy nhất.
  */
  2: [
    [
      { type: 'true_false_not_given', count: 5 },
      { type: 'summary_completion', count: 4 },
      { type: 'multiple_choice', count: 4 },
    ],
    [
      { type: 'multiple_choice', count: 4 },
      { type: 'true_false_not_given', count: 5 },
      { type: 'sentence_completion', count: 4 },
    ],
    [
      { type: 'matching_information', count: 5 },
      { type: 'sentence_completion', count: 5 },
      { type: 'multiple_choice', count: 3 },
    ],
  ],
  3: [
    [
      { type: 'multiple_choice', count: 5 },
      { type: 'yes_no_not_given', count: 5 },
      { type: 'summary_completion', count: 3 },
    ],
    [
      { type: 'yes_no_not_given', count: 6 },
      { type: 'multiple_choice', count: 4 },
      { type: 'sentence_completion', count: 3 },
    ],
    [
      { type: 'multiple_choice', count: 4 },
      { type: 'yes_no_not_given', count: 5 },
      { type: 'matching_information', count: 4 },
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
  return blueprintsFor(position, seed)[0] as PassageBlueprint;
}

/**
 * MỌI bố cục của vị trí này, xếp theo thứ tự ưu tiên tất định của bài.
 *
 * Bố cục đầu danh sách đúng là bố cục `blueprintFor` trả về; phần còn lại là
 * đường lui. Có đường lui vì không phải bài đọc nào cũng gánh được mọi dạng câu:
 * một bài không có đoạn nào đủ vốn từ để nói lại thì khối "ý này nằm ở đoạn nào"
 * chỉ lấp được một phần ba, và bộ đề ra mười câu thay vì mười ba.
 *
 * Đây KHÔNG phải hạ chuẩn. Cả ba bố cục đều là tổ hợp có thật của đề IELTS, nên
 * đổi sang bố cục khác vẫn ra một passage đúng form — chỉ là chọn cái mà bài đọc
 * này cấp đủ nguyên liệu. Thứ bị loại vẫn là câu hỏi không đạt, không phải luật.
 */
export function blueprintsFor(position: 1 | 2 | 3, seed: string): PassageBlueprint[] {
  const layouts = LAYOUTS[position];
  const rng = mulberry32(hashString(`${position}:${seed}`));
  const first = Math.floor(rng() * layouts.length);
  const order = [first, ...layouts.map((_, i) => i).filter((i) => i !== first)];
  return order.map((i) => ({
    position,
    blocks: (layouts[i] as QuestionBlock[]).map((b) => ({ ...b })),
  }));
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
  multiple_choice_multi: 'Choose TWO letters, A-E.\nWhich TWO of the following statements are true?',
  note_completion: 'Complete the notes below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
  table_completion: 'Complete the table below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
  flow_chart_completion: 'Complete the flow-chart below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
  diagram_label_completion: 'Label the diagram below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
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
