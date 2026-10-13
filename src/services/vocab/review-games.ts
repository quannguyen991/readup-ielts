import { shuffled, type StudyWord } from './topic-study';

/**
 * Logic thuần của ba game ôn tập (Ghép cặp, Đoán chữ, Xếp câu): chọn từ, xáo ô,
 * kiểm đáp án. Không đụng React nên test được bằng node.
 */

/** Từ chơi được bằng chữ cái: chỉ a–z, dài 3–12. Bỏ cụm từ, dấu gạch và số. */
export function isLetterWord(word: string): boolean {
  return /^[a-z]{3,12}$/i.test(word.trim());
}

/** Chọn tối đa n từ khác nhau (không phân biệt hoa thường) có nghĩa tiếng Việt, xáo ngẫu nhiên. */
export function pickWords(
  words: readonly StudyWord[],
  n: number,
  rng: () => number,
  keep: (w: StudyWord) => boolean = () => true,
): StudyWord[] {
  const seen = new Set<string>();
  const pool: StudyWord[] = [];
  for (const w of words) {
    const key = w.word.trim().toLowerCase();
    if (!key || seen.has(key) || !w.meaningVi?.trim() || !keep(w)) continue;
    seen.add(key);
    pool.push(w);
  }
  return shuffled(pool, rng).slice(0, Math.max(0, n));
}

/** Một ô trên lưới ghép cặp: hoặc là từ tiếng Anh, hoặc là nghĩa tiếng Việt của cùng một từ. */
export type PairTile = { id: string; pairId: number; kind: 'word' | 'meaning'; text: string };

export function buildPairTiles(words: readonly StudyWord[], rng: () => number): PairTile[] {
  const tiles: PairTile[] = [];
  words.forEach((w, pairId) => {
    tiles.push({ id: `w${pairId}`, pairId, kind: 'word', text: w.word });
    tiles.push({ id: `m${pairId}`, pairId, kind: 'meaning', text: w.meaningVi });
  });
  return shuffled(tiles, rng);
}

/** Hai ô khớp khi cùng một từ và khác loại: một từ tiếng Anh với đúng nghĩa của nó. */
export function isPairMatch(a: PairTile, b: PairTile): boolean {
  return a.pairId === b.pairId && a.kind !== b.kind;
}

/** Từng chữ của từ: chữ đã đoán thì hiện, chưa đoán thì là gạch dưới. */
export function revealedLetters(word: string, guessed: ReadonlySet<string>): string[] {
  return [...word.toLowerCase()].map((ch) => (guessed.has(ch) ? ch : '_'));
}

/** Số chữ đã đoán mà không có trong từ. */
export function wrongGuessCount(word: string, guessed: ReadonlySet<string>): number {
  const letters = new Set(word.toLowerCase());
  let n = 0;
  for (const ch of guessed) if (!letters.has(ch)) n += 1;
  return n;
}

/** Đã đoán đủ mọi chữ cái khác nhau của từ (chữ lặp chỉ cần đoán một lần). */
export function isGuessSolved(word: string, guessed: ReadonlySet<string>): boolean {
  return [...new Set(word.toLowerCase())].every((ch) => guessed.has(ch));
}

export type SentenceChip = { id: number; text: string };

/**
 * Xáo các từ của câu. Khi câu có từ 2 trở lên, không để xáo ra đúng thứ tự gốc
 * (như vậy trò chơi mất ý nghĩa ngay từ đầu).
 */
export function scrambleSentence(
  sentence: string,
  rng: () => number,
): { target: string[]; chips: SentenceChip[] } {
  const target = sentence.trim().split(/\s+/).filter(Boolean);
  let order = shuffled(
    target.map((_, i) => i),
    rng,
  );
  if (target.length > 1 && order.every((v, i) => v === i)) order = [...order.slice(1), order[0]!];
  return { target, chips: order.map((i) => ({ id: i, text: target[i]! })) };
}

/** Các chip đã đặt có đúng thứ tự câu gốc chưa. Đối chiếu theo chữ, nên từ lặp không làm sai. */
export function isSentenceOrder(picked: readonly SentenceChip[], target: readonly string[]): boolean {
  return picked.length === target.length && picked.every((c, i) => c.text === target[i]);
}
