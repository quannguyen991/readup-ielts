import type { GeneratedQuestion } from '@/services/questions/types';
import { BLOCK_RUBRIC } from '@/services/questions/blueprint';
import type { QuestionType } from '@/types/database';

/**
 * Gom danh sách câu hỏi thành các KHỐI liền mạch, đúng như đề thật in ra.
 *
 * Đề thi không đánh số từng câu rời rạc: nó nói "Questions 1–6" rồi đặt một lời
 * dẫn dùng chung cho cả sáu câu. Lời dẫn ấy là một phần của đề — người mất điểm
 * TFNG phần lớn vì không phân biệt được NOT GIVEN với FALSE, mà chỗ phân biệt
 * nằm ngay trong lời dẫn chứ không nằm trong câu hỏi.
 *
 * Gom theo CHUỖI LIỀN NHAU chứ không gom theo dạng: nếu bộ đề trả về TFNG, điền
 * từ, rồi TFNG nữa thì đó là hai khối TFNG khác nhau, và gộp chúng lại sẽ đánh
 * số sai — "Questions 1–6, 9–11" không phải cách đề thi đánh số.
 */

export type QuestionBlockView = {
  type: QuestionType;
  rubric: string;
  /** Số thứ tự câu đầu và câu cuối trong CẢ bộ đề, đếm từ 1. */
  from: number;
  to: number;
  questions: GeneratedQuestion[];
  /** Có khi cả khối là MỘT nhóm chung khuôn (Choose TWO, bảng, sơ đồ, ghi chú). */
  groupId?: string;
};

export function groupIntoBlocks(questions: GeneratedQuestion[]): QuestionBlockView[] {
  const blocks: QuestionBlockView[] = [];

  questions.forEach((q, index) => {
    const last = blocks[blocks.length - 1];
    // Hai nhóm cùng dạng nhưng khác khuôn (hai bảng liền nhau) là hai khối.
    if (last && last.type === q.type && last.groupId === q.groupId) {
      last.questions.push(q);
      last.to = index + 1;
      return;
    }
    blocks.push({
      type: q.type,
      rubric: BLOCK_RUBRIC[q.type] ?? '',
      from: index + 1,
      to: index + 1,
      questions: [q],
      ...(q.groupId ? { groupId: q.groupId } : {}),
    });
  });

  for (const b of blocks) b.rubric = rubricFor(b);
  return blocks;
}

const WORDS = ['', 'ONE WORD ONLY', 'NO MORE THAN TWO WORDS', 'NO MORE THAN THREE WORDS'];
const NOUN: Partial<Record<QuestionType, string>> = {
  summary_completion: 'summary',
  note_completion: 'notes',
  table_completion: 'table',
  flow_chart_completion: 'flow-chart',
  diagram_label_completion: 'diagram',
};

/**
 * Lời dẫn của khối, tính từ NỘI DUNG khối chứ không chỉ từ dạng.
 *
 * Giới hạn số từ nằm trên từng câu (`maxWords`) và đổi theo bộ đề, nên lời dẫn
 * "NO MORE THAN TWO WORDS" cứng ở `BLOCK_RUBRIC` sẽ nói sai khi đáp án chỉ được
 * một từ. Dạng có bảng từ thì lời dẫn đổi sang "chọn từ trong bảng".
 */
export function rubricFor(block: Pick<QuestionBlockView, 'type' | 'questions'>): string {
  const base = BLOCK_RUBRIC[block.type] ?? '';
  const first = block.questions[0];
  const limit = Math.max(0, ...block.questions.map((q) => q.maxWords ?? 0));

  if (block.type === 'multiple_choice_multi' && first) {
    const n = block.questions.length;
    const last = String.fromCharCode(64 + (first.options?.length ?? 5));
    return `Choose ${n === 3 ? 'THREE' : 'TWO'} letters, A-${last}.`;
  }

  const noun = NOUN[block.type];
  if (noun) {
    if (first?.options && first.options.length > 0) {
      const last = String.fromCharCode(64 + first.options.length);
      return `Complete the ${noun} using the list of words, A-${last}, below.`;
    }
    const lim = WORDS[Math.min(3, Math.max(1, limit || 2))];
    const num = block.type === 'summary_completion' ? ' AND/OR A NUMBER' : '';
    if (block.type === 'diagram_label_completion') return `Label the diagram below. Choose ${lim}${num} from the passage for each answer.`;
    return `Complete the ${noun} below. Choose ${lim}${num} from the passage for each answer.`;
  }

  if (block.type === 'sentence_completion' && limit > 0) {
    return `Complete the sentences below. Choose ${WORDS[Math.min(3, limit)]} from the passage for each answer.`;
  }
  if (block.type === 'short_answer' && limit > 0) {
    return `Answer the questions below. Choose ${WORDS[Math.min(3, limit)]} from the passage for each answer.`;
  }
  return base;
}

/**
 * Phương án cho một câu, kể cả khi bộ đề không kèm sẵn.
 *
 * TFNG và YNNG có ĐÚNG ba lựa chọn cố định, đề thật in sẵn chúng trong lời dẫn —
 * nhưng bộ sinh không trả `options` cho hai dạng này, nên trước đây chúng rơi
 * xuống một ô gõ tự do. Bắt người học gõ "NOT GIVEN" bằng tay là thêm một cách
 * mất điểm không liên quan gì tới đọc hiểu: gõ "not given", "NG", "Not Given"
 * đều là cùng một ý mà máy chấm thì không chắc.
 */
export function optionsFor(question: GeneratedQuestion): string[] | null {
  if (question.options && question.options.length > 0) return question.options;
  if (question.type === 'true_false_not_given') return ['TRUE', 'FALSE', 'NOT GIVEN'];
  if (question.type === 'yes_no_not_given') return ['YES', 'NO', 'NOT GIVEN'];
  return null;
}
