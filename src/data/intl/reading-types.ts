import type { Bi } from '@/i18n/useL';
import type { IntlLevel } from './level';

export type ReadingQuestion = {
  id: string;
  prompt: string;
  choices: readonly string[];
  answer: number;
  explanation: Bi;
  /** Dạng câu hỏi, ví dụ "Suy luận", "Chèn câu", "Từ trong ngữ cảnh". */
  kind?: Bi;
  level?: IntlLevel;
};
