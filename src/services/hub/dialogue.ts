import { DIALOGUES, type Dialogue, type DialogueQuiz } from '@/data/hub/dialogues';

/**
 * Logic thuần của hội thoại mẫu: tìm bài, chấm câu điền từ, gộp kết quả giữa các máy.
 * Đạt khi đúng ít nhất 2 trên 3 câu, cùng quy tắc với nhập vai.
 */

export const DIALOGUE_PASS_RATIO = 2 / 3;

export type DialogueGrade = { correct: number; total: number; percent: number; passed: boolean };

/** Điểm cao nhất (phần trăm câu đúng) của từng bài. Đồng bộ qua store `dialogue_best`. */
export type DialogueBest = Record<string, number>;

export function dialogueById(id: string): Dialogue | undefined {
  return DIALOGUES.find((d) => d.id === id);
}

export function gradeDialogue(picks: (number | null)[], quiz: DialogueQuiz[]): DialogueGrade {
  const total = quiz.length;
  const correct = quiz.reduce((n, item, i) => n + (picks[i] === item.answer ? 1 : 0), 0);
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, total, percent, passed: total > 0 && correct >= Math.ceil(total * DIALOGUE_PASS_RATIO) };
}

/** Gộp hai máy: mỗi bài giữ điểm cao hơn. */
export function mergeDialogueBest(local: DialogueBest, remote: DialogueBest): DialogueBest {
  const out: DialogueBest = { ...(local ?? {}) };
  for (const id of Object.keys(remote ?? {})) {
    const r = remote?.[id];
    if (r === undefined) continue;
    out[id] = Math.max(out[id] ?? 0, r);
  }
  return out;
}
