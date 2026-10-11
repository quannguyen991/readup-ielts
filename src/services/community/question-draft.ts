import { mathToPlainText, parseMath } from '@/lib/math/expr';
import { MATH_SKILL_LABEL, type MathItem } from '@/lib/math/types';
import type { MathAttemptRecord } from '@/store/useMathStore';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

function plain(markup: string): string {
  return mathToPlainText(parseMath(markup));
}

/**
 * Nháp câu hỏi để gửi cộng đồng. Không đưa đáp án đúng vào nháp: người hỏi cần
 * hiểu vì sao mình sai, còn đưa đáp án thì người khác chỉ chép.
 */
export function mathQuestionDraft(item: MathItem, attempt: MathAttemptRecord, en: boolean): { title: string; body: string } {
  const skill = MATH_SKILL_LABEL[item.skill];
  const title = en ? `Help with SAT Math: ${skill}` : `Hỏi về SAT Math: ${skill}`;
  const choices = item.choices?.map((choice, index) => `${LETTERS[index] ?? index + 1}. ${plain(choice.display)}`).join('\n');
  const answer = describeAnswer(item, attempt, en);
  const ask = en
    ? `My answer: ${answer}. I don't understand why it is wrong. Can someone explain?`
    : `Mình chọn: ${answer}. Mình chưa hiểu vì sao sai, ai giải thích giúp mình với?`;
  const parts = [en ? 'Question:' : 'Câu hỏi:', plain(item.stem), ...(choices ? [choices] : []), ask];
  return { title, body: parts.join('\n\n') };
}

function describeAnswer(item: MathItem, attempt: MathAttemptRecord, en: boolean): string {
  if (attempt.userAnswer === null) return en ? 'left blank' : 'bỏ trống';
  if (!item.choices) return attempt.userAnswer;
  const index = Number(attempt.userAnswer);
  if (!Number.isInteger(index) || index < 0 || index >= item.choices.length) return en ? 'unknown' : 'không rõ';
  return LETTERS[index] ?? String(index + 1);
}
