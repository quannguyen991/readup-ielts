/**
 * Đề Kiểm tra một bộ từ — trộn bốn dạng câu, XEN KẼ nhau:
 *
 * - `mcq`   trắc nghiệm 4 đáp án (hai chiều Anh ↔ Việt);
 * - `type`  điền từ: thấy nghĩa, gõ ra từ tiếng Anh;
 * - `cloze` điền vào câu ví dụ, chọn 1 trong 4 từ;
 * - `tf`    thẻ Đúng/Sai: thấy một cặp từ – nghĩa, nói cặp đó đúng hay sai.
 *
 * `tf` là bản CHẤM ĐƯỢC của thẻ lật: màn Học để người học tự đánh giá "đã
 * biết / chưa nhớ", nhưng bài kiểm tra thì không cho tự chấm.
 *
 * Không có hai câu cùng dạng đứng liền nhau. Hàm thuần, gieo hạt được.
 */
import { clozeOf, isTypedCorrect, makeChoices, normalizeAnswer, shuffled, type StudyWord } from './topic-study';

export type QuizKind = 'mcq' | 'type' | 'cloze' | 'tf';

export type QuizQuestion =
  | { kind: 'mcq'; word: StudyWord; enToVi: boolean; options: string[]; correctIndex: number }
  | { kind: 'cloze'; word: StudyWord; before: string; answer: string; after: string; options: string[]; correctIndex: number }
  | { kind: 'type'; word: StudyWord }
  | { kind: 'tf'; word: StudyWord; shownMeaning: string; isTrue: boolean };

/** number: chỉ số phương án; string: chữ đã gõ; boolean: Đúng/Sai; null: bỏ trống. */
export type QuizAnswer = number | string | boolean | null;

export const QUIZ_KIND_LABEL: Record<QuizKind, string> = {
  mcq: 'Trắc nghiệm',
  type: 'Điền từ',
  cloze: 'Điền vào câu',
  tf: 'Đúng hay sai',
};

/**
 * Dãy dạng câu: chia đều các dạng, rồi xếp sao cho không có hai dạng giống
 * nhau liền kề (luôn chọn dạng còn nhiều nhất khác dạng vừa đặt — cách này
 * không bao giờ bị kẹt khi số lượng các dạng lệch nhau tối đa 1). Dùng chung
 * cho đề Kiểm tra và màn Điền vào câu.
 */
export function kindSequence(size: number, rng: () => number, available: readonly QuizKind[] = ['mcq', 'type', 'cloze', 'tf']): QuizKind[] {
  return spreadKinds(size, rng, available);
}

export function spreadKinds<K extends string>(size: number, rng: () => number, available: readonly K[]): K[] {
  const counts = new Map<K, number>(available.map((k) => [k, Math.floor(size / available.length)]));
  const extra = shuffled(available, rng);
  for (let i = 0; i < size % available.length; i += 1) counts.set(extra[i]!, counts.get(extra[i]!)! + 1);
  const out: K[] = [];
  for (let i = 0; i < size; i += 1) {
    const prev = out[out.length - 1];
    const options = shuffled(available, rng)
      .filter((k) => counts.get(k)! > 0)
      .sort((a, b) => counts.get(b)! - counts.get(a)!);
    const pick = options.find((k) => k !== prev) ?? options[0]!;
    counts.set(pick, counts.get(pick)! - 1);
    out.push(pick);
  }
  return out;
}

export function buildQuiz(words: readonly StudyWord[], rng: () => number, size = 20): QuizQuestion[] {
  const chosen = shuffled(words, rng).slice(0, Math.min(size, words.length));
  const clozeWords = chosen.filter((w) => clozeOf(w.example, w.word));
  let plan = kindSequence(chosen.length, rng);
  // Không đủ câu ví dụ khoét được cho số ô điền-vào-câu thì bỏ hẳn dạng đó.
  if (clozeWords.length < plan.filter((k) => k === 'cloze').length) plan = kindSequence(chosen.length, rng, ['mcq', 'type', 'tf']);

  // Ô điền-vào-câu lấy từ có câu ví dụ khoét được; các ô khác lấy phần còn lại.
  const clozeQueue = clozeWords.slice(0, plan.filter((k) => k === 'cloze').length);
  const otherQueue = chosen.filter((w) => !clozeQueue.includes(w));

  let mcqIndex = 0;
  return plan.map((kind): QuizQuestion => {
    if (kind === 'cloze') {
      const word = clozeQueue.shift()!;
      const blank = clozeOf(word.example, word.word)!;
      const { options, correctIndex } = makeChoices(word, words, (x) => x.word, rng);
      return { kind, word, ...blank, options, correctIndex };
    }
    const word = otherQueue.shift()!;
    if (kind === 'type') return { kind, word };
    if (kind === 'tf') {
      const decoy = shuffled(words, rng).find((x) => normalizeAnswer(x.meaningVi) !== normalizeAnswer(word.meaningVi));
      const isTrue = !decoy || rng() < 0.5;
      return { kind, word, isTrue, shownMeaning: isTrue ? word.meaningVi : decoy!.meaningVi };
    }
    const enToVi = mcqIndex++ % 2 === 0;
    const { options, correctIndex } = makeChoices(word, words, (x) => (enToVi ? x.meaningVi : x.word), rng);
    return { kind: 'mcq', word, enToVi, options, correctIndex };
  });
}

export function isQuizCorrect(q: QuizQuestion, a: QuizAnswer): boolean {
  if (a === null) return false;
  switch (q.kind) {
    case 'mcq':
    case 'cloze':
      return a === q.correctIndex;
    case 'type':
      return typeof a === 'string' && isTypedCorrect(a, q.word.word);
    case 'tf':
      return a === q.isTrue;
  }
}

/** Câu đã có câu trả lời chưa (ô gõ chỉ toàn khoảng trắng tính là chưa). */
export function isAnswered(a: QuizAnswer): boolean {
  return a !== null && !(typeof a === 'string' && a.trim() === '');
}
