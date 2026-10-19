import { OXFORD_3000, OXFORD_ADVANCED, OXFORD_EXTRA, OXFORD_TOPICS, type OxfordEntry, type OxfordLevel } from '@/data/oxford';

/**
 * ÔN TẬP TỪ VỰNG: mỗi bài = một cấp × một chủ đề. Từ bài đó sinh ra hai loại bài kiểm tra:
 *
 *   - Trắc nghiệm ABCD (50 câu, kiểu THPT): điền từ vào câu ví dụ (chọn 1 trong 4 từ),
 *     và chọn nghĩa tiếng Việt của một từ (chọn 1 trong 4 nghĩa).
 *   - Điền từ (mỗi từ có câu ví dụ một câu): gõ từ còn thiếu vào ô trống.
 *
 * Câu hỏi được sinh từ dữ liệu có sẵn (câu ví dụ, nghĩa, từ loại), có trộn theo hạt giống cố định
 * để cùng một bài luôn ra cùng một bộ câu. Bộ dữ liệu không đổi nên không cần viết tay từng câu.
 */

export const QUIZ_LEVELS: OxfordLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
export const MCQ_COUNT = 50;

export type VocabLesson = {
  /** Mã bài, ổn định theo cấp và chủ đề, ví dụ "A1-3". */
  id: string;
  level: OxfordLevel;
  topic: string;
  /** Số thứ tự của chủ đề trong danh sách 18 chủ đề (dùng làm "Bài n" cùng cấp). */
  topicIndex: number;
  words: OxfordEntry[];
};

export type McqItem = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  word: string;
  explain: string;
};

export type FillItem = {
  id: string;
  /** Câu có ô trống "____" thay cho từ. */
  sentence: string;
  answer: string;
  meaningVi: string;
};

const ALL: OxfordEntry[] = [...OXFORD_3000, ...OXFORD_ADVANCED, ...OXFORD_EXTRA].filter((w) => QUIZ_LEVELS.includes(w.level));

/** Mọi bài học: mỗi cấp × mỗi chủ đề có ít nhất một từ. */
export function buildLessons(words: OxfordEntry[] = ALL): VocabLesson[] {
  const out: VocabLesson[] = [];
  for (const level of QUIZ_LEVELS) {
    OXFORD_TOPICS.forEach((topic, topicIndex) => {
      const list = words.filter((w) => w.level === level && w.topic === topic);
      if (list.length === 0) return;
      out.push({ id: `${level}-${topicIndex}`, level, topic, topicIndex, words: list });
    });
  }
  return out;
}

export function lessonById(id: string, lessons: VocabLesson[] = buildLessons()): VocabLesson | undefined {
  return lessons.find((l) => l.id === id);
}

/** Hạt giống FNV-1a đơn giản: cùng chuỗi luôn cho cùng số. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Trộn theo hạt giống: cùng khoá cho cùng thứ tự. */
export function shuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let s = hash(seed) || 1;
  const rand = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function escapeRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Thay từ trong câu ví dụ bằng "____". Trả null nếu câu không chứa đúng từ (ví dụ câu chỉ có
 * dạng biến đổi), khi đó từ đó không dùng cho câu điền từ.
 */
export function blankSentence(example: string, word: string): string | null {
  const re = new RegExp(`\\b${escapeRe(word)}\\b`, 'i');
  if (!re.test(example)) return null;
  return example.replace(re, '____');
}

/** Chọn tối đa n từ làm đáp án nhiễu: cùng từ loại và khác nghĩa, ưu tiên cùng chủ đề. */
function distractors(target: OxfordEntry, lesson: VocabLesson, pool: OxfordEntry[], n: number, key: (w: OxfordEntry) => string): string[] {
  const same = (w: OxfordEntry) => w.word !== target.word && w.pos === target.pos && key(w) !== key(target);
  const inLesson = shuffle(lesson.words.filter(same), `${lesson.id}|${target.word}|d`);
  const others = shuffle(pool.filter((w) => same(w) && !lesson.words.includes(w)), `${lesson.id}|${target.word}|o`);
  const picked: string[] = [];
  for (const w of [...inLesson, ...others]) {
    const k = key(w);
    if (picked.includes(k)) continue;
    picked.push(k);
    if (picked.length === n) break;
  }
  return picked;
}

/** Trắc nghiệm ABCD 50 câu cho một bài: ưu tiên điền từ vào câu, rồi đến chọn nghĩa. */
export function buildMcq(lesson: VocabLesson, pool: OxfordEntry[] = ALL, count = MCQ_COUNT): McqItem[] {
  const words = shuffle(lesson.words, `${lesson.id}|mcq`);
  const items: McqItem[] = [];

  // Lượt 1: điền từ vào câu ví dụ.
  for (const w of words) {
    if (items.length >= count) break;
    const sentence = blankSentence(w.example, w.word);
    if (!sentence) continue;
    const others = distractors(w, lesson, pool, 3, (x) => x.word);
    if (others.length < 3) continue;
    const opts = shuffle([w.word, ...others], `${lesson.id}|${w.word}|opt`);
    items.push({
      id: `${lesson.id}-c${items.length + 1}`,
      prompt: `Chọn từ thích hợp điền vào chỗ trống: "${sentence}"`,
      options: opts,
      answer: opts.indexOf(w.word),
      word: w.word,
      explain: `Đáp án: ${w.word} (${w.meaningVi}). ${w.example}`,
    });
  }

  // Lượt 2: chọn nghĩa tiếng Việt của từ, lặp lại từ đầu bài nếu còn thiếu câu.
  let round = 0;
  while (items.length < count && lesson.words.length > 0) {
    const w = words[round % words.length]!;
    round += 1;
    const others = distractors(w, lesson, pool, 3, (x) => x.meaningVi);
    if (others.length < 3) {
      if (round > words.length * 3) break;
      continue;
    }
    const opts = shuffle([w.meaningVi, ...others], `${lesson.id}|${w.word}|m${round}`);
    items.push({
      id: `${lesson.id}-m${items.length + 1}`,
      prompt: `"${w.word}" (${w.pos}) nghĩa tiếng Việt là gì?`,
      options: opts,
      answer: opts.indexOf(w.meaningVi),
      word: w.word,
      explain: `${w.word} = ${w.meaningVi}. ${w.example}`,
    });
  }
  return items.slice(0, count);
}

/** Điền từ vào ô trống: mỗi từ có câu ví dụ chứa đúng từ một lần. */
export function buildFill(lesson: VocabLesson): FillItem[] {
  const out: FillItem[] = [];
  for (const w of shuffle(lesson.words, `${lesson.id}|fill`)) {
    const sentence = blankSentence(w.example, w.word);
    if (!sentence) continue;
    out.push({ id: `${lesson.id}-f${out.length + 1}`, sentence, answer: w.word, meaningVi: w.meaningVi });
  }
  return out;
}

/** So khớp đáp án điền từ: không phân biệt hoa thường, bỏ khoảng trắng thừa. */
export function isFillCorrect(typed: string, answer: string): boolean {
  return typed.trim().toLowerCase() === answer.trim().toLowerCase();
}
