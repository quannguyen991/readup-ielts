import { clozeOf, normalizeAnswer, shuffled, type StudyWord } from './topic-study';

/**
 * CÂU HỎI TRẮC NGHIỆM A/B/C/D KIỂU ĐỀ THPT cho màn Quiz ôn tập (27/09/2026,
 * người dùng: "kiểu multiple choice các câu hỏi abcd như thi thpt").
 *
 * Ba dạng quen thuộc của đề tiếng Anh THPT, dựng từ chính dữ liệu của bộ:
 * - COMPLETE: câu ví dụ khoét chỗ trống, bốn từ CÙNG TỪ LOẠI;
 * - CLOSEST: câu ví dụ gạch chân từ đang học, chọn từ GẦN NGHĨA NHẤT;
 * - OPPOSITE: như trên nhưng chọn từ TRÁI NGHĨA — một phương án nhiễu là từ
 *   đồng nghĩa của chính từ đó (bẫy kinh điển của đề thi).
 * - DEFINITION (dự phòng): từ không dựng được ba dạng trên thì hỏi từ đúng với
 *   định nghĩa tiếng Anh, để mọi từ của bộ đều có câu.
 *
 * Dạng chỗ trống chỉ dùng khi từ trong câu đúng NGUYÊN DẠNG của từ gốc: câu
 * dùng "adapted" mà phương án là "adapt" thì đáp án sai ngữ pháp.
 */
export type ThptKind = 'complete' | 'closest' | 'opposite' | 'definition' | 'advert' | 'flyer';

export type ThptQuestion = {
  kind: ThptKind;
  word: StudyWord;
  instruction: string;
  before: string;
  /** Phần gạch chân (closest/opposite) hoặc đáp án bị khoét (complete, advert, flyer). */
  focus: string;
  after: string;
  options: string[];
  correctIndex: number;
  /** Khung quảng cáo hoặc tờ rơi bao quanh câu (chỉ có ở hai dạng advert và flyer). */
  frame?: { headline: string; footer: string };
};

/** Số câu trong một lượt trắc nghiệm THPT của mỗi bài. */
export const THPT_QUESTIONS_PER_BAI = 35;

export const THPT_INSTRUCTION: Record<ThptKind, string> = {
  complete: 'Mark the letter A, B, C, or D to indicate the correct answer to the following question.',
  closest: 'Mark the letter A, B, C, or D to indicate the word CLOSEST in meaning to the underlined word.',
  opposite: 'Mark the letter A, B, C, or D to indicate the word OPPOSITE in meaning to the underlined word.',
  definition: 'Mark the letter A, B, C, or D to indicate the word that best matches the definition.',
  advert: 'Read the advertisement below and mark the letter A, B, C, or D to indicate the correct word to fill in the gap.',
  flyer: 'Read the flyer below and mark the letter A, B, C, or D to indicate the correct word to fill in the gap.',
};

export const THPT_KIND_LABEL: Record<ThptKind, string> = {
  complete: 'Điền vào chỗ trống',
  closest: 'Gần nghĩa nhất',
  opposite: 'Trái nghĩa',
  definition: 'Đúng định nghĩa',
  advert: 'Quảng cáo',
  flyer: 'Tờ rơi',
};

const single = (s: string) => !/\s/.test(s.trim());

/** Ba phương án nhiễu khác hẳn đáp án và mọi từ bị cấm; lấy lần lượt từ các nguồn theo thứ tự ưu tiên. */
function pickDistractors(correct: string, banned: Iterable<string>, sources: string[][], rng: () => number): string[] | null {
  const seen = new Set([normalizeAnswer(correct), ...[...banned].map(normalizeAnswer)]);
  const out: string[] = [];
  for (const src of sources) {
    for (const cand of shuffled(src, rng)) {
      if (out.length === 3) return out;
      const key = normalizeAnswer(cand);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(cand);
    }
  }
  return out.length === 3 ? out : null;
}

function withOptions(
  q: Omit<ThptQuestion, 'options' | 'correctIndex'>,
  correct: string,
  distractors: string[],
  rng: () => number,
): ThptQuestion {
  const options = shuffled([correct, ...distractors], rng);
  return { ...q, options, correctIndex: options.indexOf(correct) };
}

/** Mọi dạng dựng được cho một từ (có thể rỗng). */
export function thptQuestionsFor(word: StudyWord, pool: readonly StudyWord[], rng: () => number): ThptQuestion[] {
  const others = pool.filter((w) => normalizeAnswer(w.word) !== normalizeAnswer(word.word));
  const samePos = others.filter((w) => w.pos && w.pos === word.pos);
  const otherPos = others.filter((w) => !(w.pos && w.pos === word.pos));
  const related = [word.word, ...(word.synonyms ?? []), ...(word.antonyms ?? [])];
  const cloze = clozeOf(word.example, word.word);
  const out: ThptQuestion[] = [];

  if (cloze && normalizeAnswer(cloze.answer) === normalizeAnswer(word.word)) {
    const d = pickDistractors(word.word, related, [samePos.map((w) => w.word), otherPos.map((w) => w.word)], rng);
    if (d) {
      out.push(
        withOptions(
          { kind: 'complete', word, instruction: THPT_INSTRUCTION.complete, before: cloze.before, focus: cloze.answer, after: cloze.after },
          word.word,
          d,
          rng,
        ),
      );
    }
  }

  if (cloze) {
    // Phương án là TỪ ĐƠN của các từ khác trong bộ (và đồng nghĩa của chúng), cùng từ loại trước.
    const wordsOf = (ws: StudyWord[]) => ws.flatMap((w) => [w.word, ...(w.synonyms ?? [])]).filter(single);
    const synonym = shuffled((word.synonyms ?? []).filter(single), rng)[0];
    if (synonym) {
      const d = pickDistractors(synonym, related, [wordsOf(samePos), wordsOf(otherPos)], rng);
      if (d) {
        out.push(
          withOptions(
            { kind: 'closest', word, instruction: THPT_INSTRUCTION.closest, before: cloze.before, focus: cloze.answer, after: cloze.after },
            synonym,
            d,
            rng,
          ),
        );
      }
    }
    const antonym = shuffled((word.antonyms ?? []).filter(single), rng)[0];
    if (antonym) {
      // Bẫy: một phương án là từ ĐỒNG nghĩa của chính từ gạch chân.
      const trap = (word.synonyms ?? []).filter(single);
      const bannedForOpp = [word.word, ...(word.antonyms ?? [])];
      const d = pickDistractors(antonym, bannedForOpp, [shuffled(trap, rng).slice(0, 1), wordsOf(samePos), wordsOf(otherPos)], rng);
      if (d) {
        out.push(
          withOptions(
            { kind: 'opposite', word, instruction: THPT_INSTRUCTION.opposite, before: cloze.before, focus: cloze.answer, after: cloze.after },
            antonym,
            d,
            rng,
          ),
        );
      }
    }
  }
  if (out.length === 0 && word.definitionEn) {
    const d = pickDistractors(word.word, related, [samePos.map((w) => w.word), otherPos.map((w) => w.word)], rng);
    if (d) {
      out.push(
        withOptions(
          { kind: 'definition', word, instruction: THPT_INSTRUCTION.definition, before: '', focus: word.definitionEn, after: '' },
          word.word,
          d,
          rng,
        ),
      );
    }
  }
  return out;
}

/**
 * Một đề: mỗi từ một câu, dạng câu xoay vòng để không hai câu cùng dạng liền
 * nhau khi còn chọn được. Từ không dựng được câu nào thì bỏ qua.
 */
/** Chế độ đề: xen kẽ các dạng THPT, hoặc toàn bộ là quảng cáo / tờ rơi. */
export type ThptMode = 'mix' | 'advert' | 'flyer';

const ADVERT_HEADLINES = ['SPECIAL OFFER!', 'NEW ARRIVAL!', "DON'T MISS OUT!", 'LIMITED TIME ONLY!', 'NOW OPEN!'];
const ADVERT_FOOTERS = ['Call us today!', 'Visit our store now.', 'Hurry, while stocks last.', 'Book your place today.'];
const FLYER_HEADLINES = ['WELCOME TO OUR CENTRE', 'JOIN OUR CLUB!', 'ENGLISH WORKSHOP', 'FREE TRIAL LESSON', 'SUMMER CAMP'];
const FLYER_FOOTERS = ['For more details, call the number below.', 'Register at the front desk.', 'All students are welcome.'];

/** Đưa câu khoét chỗ trống vào khung quảng cáo hoặc tờ rơi; đáp án và bốn phương án giữ nguyên. */
function framed(q: ThptQuestion, mode: 'advert' | 'flyer', rng: () => number): ThptQuestion {
  const heads = mode === 'advert' ? ADVERT_HEADLINES : FLYER_HEADLINES;
  const foots = mode === 'advert' ? ADVERT_FOOTERS : FLYER_FOOTERS;
  const pick = (xs: string[]) => xs[Math.floor(rng() * xs.length)] ?? xs[0]!;
  return { ...q, kind: mode, instruction: THPT_INSTRUCTION[mode], frame: { headline: pick(heads), footer: pick(foots) } };
}

/**
 * Mức độ đề. Theo tổng hợp các trang tham khảo về đề THPT: nhận biết (điền từ, dễ nhất), thông hiểu (điền từ
 * và gần nghĩa), vận dụng (trái nghĩa khó hơn đồng nghĩa). Đây là cách chia của app, không phải đề chính thức.
 */
export type ThptDifficulty = 'easy' | 'medium' | 'hard';

export const THPT_DIFFICULTY_ORDER: Record<ThptDifficulty, ThptKind[]> = {
  easy: ['complete'],
  medium: ['complete', 'closest'],
  hard: ['opposite', 'closest'],
};

export function buildThptQuiz(
  words: readonly StudyWord[],
  pool: readonly StudyWord[],
  rng: () => number,
  mode: ThptMode = 'mix',
  difficulty?: ThptDifficulty,
): ThptQuestion[] {
  if (mode !== 'mix') {
    // Quảng cáo / tờ rơi: mỗi từ dựng từ câu khoét chỗ trống, bọc trong khung riêng.
    const out: ThptQuestion[] = [];
    for (const w of words) {
      const c = thptQuestionsFor(w, pool, rng).find((q) => q.kind === 'complete');
      if (c) out.push(framed(c, mode, rng));
    }
    return out;
  }
  const order: ThptKind[] = difficulty ? THPT_DIFFICULTY_ORDER[difficulty] : ['complete', 'closest', 'opposite'];
  const out: ThptQuestion[] = [];
  let turn = 0;
  for (const w of words) {
    const qs = thptQuestionsFor(w, pool, rng);
    if (qs.length === 0) continue;
    const last = out[out.length - 1]?.kind;
    let pick: ThptQuestion | undefined;
    for (let k = 0; k < order.length && !pick; k++) {
      const kind = order[(turn + k) % order.length]!;
      if (kind !== last || qs.length === 1) pick = qs.find((q) => q.kind === kind);
    }
    out.push(pick ?? qs[0]!);
    turn += 1;
  }
  return out;
}
