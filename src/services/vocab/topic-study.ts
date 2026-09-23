/**
 * Logic học một bộ từ theo chủ đề — hàm thuần, để các màn Học, Nghe chép, Điền
 * câu, Kiểm tra và Trò chơi dùng chung một luật chấm và một cách chọn câu.
 *
 * Không có gì ở đây gọi mạng hay AI: câu hỏi dựng từ chính dữ liệu của bộ từ
 * (nghĩa, phiên âm, câu ví dụ, cụm từ đi kèm).
 */

export type StudyWord = {
  word: string;
  pos: string;
  ipa: string;
  meaningVi: string;
  definitionEn: string;
  example: string;
  collocation: string;
  band: string;
};

/** RNG gieo hạt — cùng hạt ra cùng thứ tự, để test tái lập được. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Chuẩn hoá câu trả lời gõ tay: bỏ hoa thường, khoảng trắng thừa, dấu câu ở
 * hai đầu, và thống nhất dấu nháy. "Habitat." và " habitat" là cùng một đáp án.
 */
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

export function isTypedCorrect(input: string, target: string): boolean {
  return normalizeAnswer(input).length > 0 && normalizeAnswer(input) === normalizeAnswer(target);
}

/**
 * So từng chữ cái để tô màu chỗ sai trong Nghe chép. Căn theo vị trí — đủ cho
 * một từ đơn; lỗi thường gặp là sai một hai chữ, không phải lệch cả từ.
 */
export function letterDiff(input: string, target: string): { ch: string; ok: boolean }[] {
  const a = input.trim().toLowerCase();
  const b = target.trim();
  return [...b].map((ch, i) => ({ ch, ok: a[i] === ch.toLowerCase() }));
}

/**
 * Bốn lựa chọn cho một câu trắc nghiệm: đáp án đúng + ba từ khác trong bộ.
 * Lọc trùng theo NỘI DUNG hiển thị — hai từ khác nhau có thể dịch ra cùng một
 * nghĩa tiếng Việt, và hai lựa chọn giống hệt nhau thì câu hỏi hỏng.
 */
export function makeChoices(
  target: StudyWord,
  pool: readonly StudyWord[],
  show: (w: StudyWord) => string,
  rng: () => number,
): { options: string[]; correctIndex: number } {
  const correct = show(target);
  const seen = new Set([normalizeAnswer(correct)]);
  const distractors: string[] = [];
  for (const w of shuffled(pool, rng)) {
    if (distractors.length === 3) break;
    const text = show(w);
    const key = normalizeAnswer(text);
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(text);
  }
  const options = shuffled([correct, ...distractors], rng);
  return { options, correctIndex: options.indexOf(correct) };
}

/**
 * Khoét từ ra khỏi câu ví dụ để làm câu điền.
 *
 * Câu ví dụ hay dùng dạng CHIA của từ ("habitats", "adapted", "migrating"),
 * nên thử cả dạng gốc lẫn gốc bỏ đuôi -e/-y cộng một hậu tố. Tìm theo biên chữ
 * cái Unicode chứ không `\b` (xem ghi chú bộ nhớ: `\b` của JS không hiểu chữ
 * có dấu).
 */
export function clozeOf(example: string, word: string): { before: string; answer: string; after: string } | null {
  const w = word.trim().toLowerCase();
  if (!w || w.includes(' ')) {
    const i = example.toLowerCase().indexOf(w);
    if (!w || i < 0) return null;
    return { before: example.slice(0, i), answer: example.slice(i, i + w.length), after: example.slice(i + w.length) };
  }
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stem = escape(w.replace(/(e|y)$/, ''));
  const last = escape(w.slice(-1));
  // CHỈ đuôi chia từ, không đuôi phái sinh: "negotiate" không được khớp
  // "negotiators" — đó là một từ khác, khoét nó ra là hỏi sai từ.
  const forms = [
    `${escape(w)}(?:s|es|d|ed|ing)?`,
    `${stem}(?:ies|ied|ing|ed|es)`,
    `${escape(w)}${last}(?:ed|ing)`,
  ].join('|');
  const re = new RegExp(`(?<![\\p{L}])(${forms})(?![\\p{L}])`, 'iu');
  const m = re.exec(example);
  if (!m) return null;
  return { before: example.slice(0, m.index), answer: m[0], after: example.slice(m.index + m[0].length) };
}

/** Mức thuộc của một từ trong bộ: 0 chưa học, 1 đã nhận ra (trắc nghiệm đúng), 2 đã nhớ (gõ đúng). */
export type WordStage = 0 | 1 | 2;

/**
 * Chọn từ cho một vòng Học: ưu tiên từ chưa thuộc, theo thứ tự trong bộ (bộ đã
 * xếp dễ trước khó). Học hết rồi thì ôn lại từ đầu.
 */
export function pickRound(words: readonly StudyWord[], stageOf: (w: string) => WordStage, size = 10): StudyWord[] {
  const open = words.filter((w) => stageOf(w.word) < 2);
  const source = open.length > 0 ? open : words;
  return source.slice(0, size);
}

export type LearnItem = { word: string; kind: 'recognize' | 'recall' };

/**
 * Hàng đợi của một vòng Học.
 *
 * Mỗi từ qua HAI chặng: nhận ra (trắc nghiệm) rồi nhớ lại (gõ ra từ tiếng Anh
 * khi chỉ thấy nghĩa). Đúng chặng một thì chặng hai được xếp vào hàng — không
 * ngay sau, để giữa hai lần gặp có vài câu khác chen vào. Sai thì câu ấy quay
 * lại sau vài lượt. Vòng kết thúc khi mọi từ qua chặng hai.
 */
export function initialQueue(words: readonly StudyWord[]): LearnItem[] {
  return words.map((w) => ({ word: w.word, kind: 'recognize' as const }));
}

/** Khoảng cách (số câu) trước khi gặp lại một câu. */
export const REQUEUE_GAP = 3;

export function advanceQueue(queue: readonly LearnItem[], correct: boolean): LearnItem[] {
  const [head, ...rest] = queue;
  if (!head) return [];
  const insertAt = (item: LearnItem) => {
    const at = Math.min(REQUEUE_GAP, rest.length);
    return [...rest.slice(0, at), item, ...rest.slice(at)];
  };
  if (!correct) return insertAt(head);
  if (head.kind === 'recognize') return insertAt({ word: head.word, kind: 'recall' });
  return rest;
}
