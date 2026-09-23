/**
 * Màn "Điền vào câu" — bốn dạng câu XEN KẼ, cùng một việc: đặt từ vào đúng
 * câu ví dụ của nó.
 *
 * - `pick`     chọn 1 trong 4 từ (dạng gốc) cho chỗ trống;
 * - `scramble` xếp các chữ cái bị xáo thành từ còn thiếu (đúng dạng trong câu);
 * - `write`    gõ từ còn thiếu, có gợi ý nghĩa và chữ cái đầu;
 * - `listen`   nghe cả câu được đọc to, gõ từ còn thiếu.
 *
 * Dạng nào cũng chỉ có MỘT đáp án đúng. Không dùng "câu này dùng từ đúng hay
 * sai": thay một từ khác vào câu ví dụ nhiều khi vẫn ra câu đúng nghĩa
 * ("natural habitats" → "natural ecosystems"), và người học bị chấm oan.
 *
 * Mỗi vòng 10 câu, không hai câu cùng dạng liền nhau. Sai thì câu đó quay lại
 * sau hai câu, bằng MỘT DẠNG KHÁC — ưu tiên dạng dễ hơn (chọn từ, xếp chữ) để
 * sửa trước, và để người học không nhớ vị trí đáp án thay vì nhớ từ.
 *
 * Hàm thuần, gieo hạt được.
 */
import { spreadKinds } from './quiz';
import { clozeOf, isTypedCorrect, makeChoices, shuffled, type StudyWord } from './topic-study';

export type ClozeKind = 'pick' | 'scramble' | 'write' | 'listen';
export const CLOZE_KINDS: readonly ClozeKind[] = ['pick', 'scramble', 'write', 'listen'];
export const CLOZE_KIND_LABEL: Record<ClozeKind, string> = {
  pick: 'Chọn từ',
  scramble: 'Xếp chữ',
  write: 'Gõ từ',
  listen: 'Nghe và điền',
};

export const CLOZE_ROUND = 10;
/** Số câu chen giữa trước khi hỏi lại câu vừa sai. */
export const CLOZE_GAP = 2;

export type ClozeItem = { word: string; kind: ClozeKind; retry?: boolean };

type Blank = { before: string; answer: string; after: string };

export type ClozeQuestion =
  | ({ kind: 'pick'; word: StudyWord; options: string[]; correctIndex: number } & Blank)
  | ({ kind: 'scramble'; word: StudyWord; tiles: string[] } & Blank)
  | ({ kind: 'write' | 'listen'; word: StudyWord } & Blank);

/** Những từ khoét được khỏi câu ví dụ của chính nó. */
export function clozeable<W extends StudyWord>(words: readonly W[]): W[] {
  return words.filter((w) => clozeOf(w.example, w.word));
}

/** Một vòng: tối đa 10 từ (nơi gọi đã xếp thứ tự), dạng câu xen kẽ. */
export function planClozeRound(words: readonly StudyWord[], rng: () => number, size = CLOZE_ROUND): ClozeItem[] {
  const chosen = clozeable(words).slice(0, size);
  const kinds = spreadKinds(chosen.length, rng, CLOZE_KINDS);
  return chosen.map((w, i) => ({ word: w.word, kind: kinds[i]! }));
}

/** Thứ tự ưu tiên khi hỏi lại câu sai: dạng dễ trước. */
const RETRY_ORDER: readonly ClozeKind[] = ['pick', 'scramble', 'write', 'listen'];

export function advanceCloze(queue: readonly ClozeItem[], correct: boolean): ClozeItem[] {
  const [head, ...rest] = queue;
  if (!head) return [];
  if (correct) return rest;
  // Sai lần đầu: hỏi lại sau hai câu. Đã hỏi lại mà VẪN sai: dời xuống cuối
  // vòng — nếu không, vài từ khó cứ xoay vòng với nhau ở đầu hàng và những từ
  // còn lại của vòng không bao giờ tới lượt.
  const at = head.retry ? rest.length : Math.min(CLOZE_GAP, rest.length);
  // Khác dạng vừa sai, và khác hai câu đứng ngay trước/sau chỗ chèn — bốn dạng
  // trừ tối đa ba dạng bị cấm thì luôn còn ít nhất một.
  const banned = new Set<ClozeKind>([head.kind]);
  if (rest[at - 1]) banned.add(rest[at - 1]!.kind);
  if (rest[at]) banned.add(rest[at]!.kind);
  const kind = RETRY_ORDER.find((k) => !banned.has(k)) ?? 'pick';
  return [...rest.slice(0, at), { word: head.word, kind, retry: true }, ...rest.slice(at)];
}

const isLetter = (ch: string) => /\p{L}/u.test(ch);

/** Chữ cái của đáp án, xáo trộn, viết thường. Không trả về đúng thứ tự gốc khi còn cách xáo khác. */
export function scrambleTiles(answer: string, rng: () => number): string[] {
  const letters = [...answer.toLowerCase()].filter(isLetter);
  let tiles = shuffled(letters, rng);
  if (tiles.join('') === letters.join('') && new Set(letters).size > 1) {
    // Xoay vòng một bước; nếu vẫn trùng (chuỗi tuần hoàn như "abab") thì đảo ngược.
    tiles = [...letters.slice(1), letters[0]!];
    if (tiles.join('') === letters.join('')) tiles = [...letters].reverse();
  }
  return tiles;
}

/**
 * Ghép các chữ đã chọn vào khuôn của đáp án: chữ cái lấy lần lượt từ `picked`,
 * còn dấu cách, gạch nối, nháy giữ nguyên chỗ. Chỗ chưa có chữ để trống ('').
 */
export function fillPattern(answer: string, picked: readonly string[]): string[] {
  let i = 0;
  return [...answer].map((ch) => (isLetter(ch) ? (picked[i++] ?? '') : ch));
}

export function letterCount(answer: string): number {
  return [...answer].filter(isLetter).length;
}

export function buildClozeQuestion(item: ClozeItem, pool: readonly StudyWord[], rng: () => number): ClozeQuestion | null {
  const word = pool.find((w) => w.word === item.word);
  const blank = word ? clozeOf(word.example, word.word) : null;
  if (!word || !blank) return null;
  if (item.kind === 'pick') {
    const { options, correctIndex } = makeChoices(word, pool, (w) => w.word, rng);
    return { kind: 'pick', word, ...blank, options, correctIndex };
  }
  if (item.kind === 'scramble') return { kind: 'scramble', word, ...blank, tiles: scrambleTiles(blank.answer, rng) };
  return { kind: item.kind, word, ...blank };
}

/** `number` cho dạng chọn, chuỗi cho các dạng gõ / xếp chữ — so với đúng DẠNG trong câu. */
export function isClozeCorrect(q: ClozeQuestion, answer: number | string | null): boolean {
  if (answer === null) return false;
  if (q.kind === 'pick') return answer === q.correctIndex;
  return typeof answer === 'string' && isTypedCorrect(answer, q.answer);
}
