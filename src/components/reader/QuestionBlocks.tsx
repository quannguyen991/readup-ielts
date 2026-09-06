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
};

export function groupIntoBlocks(questions: GeneratedQuestion[]): QuestionBlockView[] {
  const blocks: QuestionBlockView[] = [];

  questions.forEach((q, index) => {
    const last = blocks[blocks.length - 1];
    if (last && last.type === q.type) {
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
    });
  });

  return blocks;
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
