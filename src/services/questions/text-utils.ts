import { shuffle } from './rng';

/**
 * Tiện ích văn bản dùng chung cho cả bộ sinh đề SAT lẫn IELTS.
 *
 * Tách ra đây vì hai bộ đề khác nhau về dạng câu nhưng giống hệt nhau ở phần
 * xử lý chữ: thế nào là một từ mang nghĩa, chọn nhiễu ra sao, khoét chỗ trống
 * thế nào. Chép đôi hai bản là sớm muộn chúng lệch nhau.
 */

/** Mỗi câu trắc nghiệm có đúng 4 lựa chọn. */
export const OPTIONS_PER_QUESTION = 4;

export function wordsOf(text: string): string[] {
  return text.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
}

/**
 * Từ mang nghĩa: đủ dài, không nằm trong danh sách từ chức năng, và giữ nguyên
 * dạng chữ như trong bài để điền vào chỗ trống là khớp.
 */
export function contentWords(text: string, minLength: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const word of wordsOf(text)) {
    const lower = word.toLowerCase();
    if (word.length < minLength) continue;
    if (FUNCTION_WORDS.has(lower)) continue;
    // Bỏ danh từ riêng: khoét tên riêng thì đoán được bằng trí nhớ, không phải
    // bằng ngữ cảnh.
    if (word[0] === word[0]?.toUpperCase() && word.slice(1) !== word.slice(1).toUpperCase()) {
      if (word[0] !== word[0]?.toLowerCase()) continue;
    }
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(word);
  }

  return out;
}

/** Đuôi từ, xấp xỉ từ loại mà không cần bộ gán nhãn. */
export function wordShape(word: string): string {
  for (const suffix of ['ing', 'tion', 'sion', 'ment', 'ness', 'able', 'ible', 'ed', 'ly', 'al', 's']) {
    if (word.endsWith(suffix)) return suffix;
  }
  return '';
}

/** Chỉ thay lần xuất hiện ĐẦU TIÊN, giữ nguyên phần còn lại của câu. */
export function blankOut(sentence: string, word: string): string {
  const index = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (index === -1) return sentence;
  return `${sentence.slice(0, index)}______${sentence.slice(index + word.length)}`;
}

/**
 * Nhiễu cùng "dáng" từ (đuôi -ing, -ed, -tion…) để không loại được đáp án chỉ
 * bằng cách nhìn từ loại mà không đọc câu. Nhiễu không được có sẵn trong chính
 * câu hỏi — thấy nó nằm ngay đó là loại được mà không cần hiểu.
 */
export function pickDistractors(
  pool: string[],
  answer: string,
  sentence: string,
  minLength: number,
  rng: () => number,
): string[] {
  const inSentence = new Set(contentWords(sentence, minLength));
  const shape = wordShape(answer);

  const candidates = pool.filter((w) => w !== answer && !inSentence.has(w));
  const sameShape = candidates.filter((w) => wordShape(w) === shape);

  // Ưu tiên cùng dáng từ; thiếu thì bù bằng từ bất kỳ để vẫn đủ 4 lựa chọn.
  const ranked = [...shuffle(sameShape, rng), ...shuffle(candidates, rng)];

  const picked: string[] = [];
  for (const word of ranked) {
    if (picked.includes(word)) continue;
    picked.push(word);
    if (picked.length === OPTIONS_PER_QUESTION - 1) break;
  }

  return picked;
}

/** Rút luân phiên từng nhóm cho tới khi đủ `limit` câu hoặc cạn nguồn. */
export function interleave<T>(groups: T[][], limit: number): T[] {
  const out: T[] = [];
  const cursors = groups.map(() => 0);

  while (out.length < limit) {
    let tookOne = false;

    for (const [g, group] of groups.entries()) {
      if (out.length >= limit) break;
      const cursor = cursors[g]!;
      if (cursor >= group.length) continue;
      out.push(group[cursor]!);
      cursors[g] = cursor + 1;
      tookOne = true;
    }

    if (!tookOne) break;
  }

  return out;
}

export const FUNCTION_WORDS = new Set([
  'because',
  'between',
  'however',
  'therefore',
  'although',
  'together',
  'through',
  'without',
  'against',
  'another',
  'himself',
  'herself',
  'itself',
  'themselves',
  'something',
  'anything',
  'everything',
  'nothing',
  'whether',
  'whatever',
  'whenever',
  'wherever',
  'perhaps',
  'indeed',
  'besides',
  'towards',
  'thereby',
  'moreover',
  // Trạng từ và động từ khuyết thiếu: làm nhiễu thì lộ ngay vì sai từ loại.
  'cannot',
  'scarcely',
  'hardly',
  'merely',
  'really',
  'rather',
  'almost',
  'always',
  'usually',
  'already',
  'certainly',
  'probably',
  'possibly',
  'entirely',
  'largely',
  'mostly',
  'nearly',
  'simply',
]);
